import { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal, scaleRadial } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft, axisTop, axisRight } from "d3-axis";
import { range, max } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData, ObjectiveDatum } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData; // data to be displayed
  oldAlternative?: ObjectiveData; // old alternative solution
  dimensionsMaybe?: RectDimensions; // dimensions for the chart
  userPrefForVisuals: boolean[]; // list of user preferences for the charts properties like where is ideal or nadir.
  selectedIndices: number[]; // selected points
  handleSelection: (x: number[]) => void; // handler for selected points
  // possible axisOrder Prop
}

const defaultVisuals = {
  inverseAxis: true, 
  //turnAxis: true, 
  radarOrSpider: true,
};

// TODO:
// päätä docu tyyli, google jos jaksaa niin hienosti kommentoida.
// koodiin siisteys, kommentointi
// fix axis labels, need to add margins to svg

const defaultDimensions = {
  chartHeight: 800,
  chartWidth: 800,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 50,
  marginBottom: 50,
};

export const RadarChart = ({
  objectiveData,
  oldAlternative,
  dimensionsMaybe,
  userPrefForVisuals,
  selectedIndices,
  handleSelection,
}: RadarChartProps) => {
  const ref = useRef(null);
  const [selection, setSelection] = useState<null | Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  >>(null);
  const [dimensions] = useState(
    dimensionsMaybe ? dimensionsMaybe : defaultDimensions
  );

  // color table. 0 index def color, 1 index highlight color, 2 index selected color
  let colors = ["#69b3a2", "pink", "red"];

  // set user preferences or default settings.
  let inverseAxis: boolean,  radarOrSpider: boolean;
  if (userPrefForVisuals === undefined) {
    inverseAxis = defaultVisuals.inverseAxis;
    //turnAxis = defaultVisuals.turnAxis; // don't know if this makes any sense anymore
    radarOrSpider = defaultVisuals.radarOrSpider;
  }
  inverseAxis = userPrefForVisuals[0];
  //turnAxis = userPrefForVisuals[1];
  radarOrSpider = userPrefForVisuals[1];

  const oldSol = oldAlternative;
  const offset = dimensions.marginTop; 

  // States
  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered
  const [hoverTarget, SetHoverTarget] = useState(-1); // keeps track of hover target
  const [activeIndices, SetActiveIndices] = useState<number[]>(selectedIndices);

  useEffect(() => {
    SetActiveIndices(selectedIndices);
  }, [selectedIndices]);

  // this scales the axises and turns them accordingly to preferred center, default is nadir at center.
  const radScaleAxis = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = 0;
      let end = radius;
      if (data.directions[i] === -1 ) {
        start = radius;
        end = 0;
      }
      if (inverseAxis === false){
        start = radius;
        end = 0;
        if (data.directions[i] === -1 ) {
          start = 0;
          end = radius;
        }
      }
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data, inverseAxis]);

  // this scales the data and turns them accordingly to preferred center, default is nadir at center.
  const radScaleData = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = radius;
      let end = 0;
      if (data.directions[i] === -1 ){
        start = 0;
        end = radius;
      }
      if (inverseAxis === false){
        start = 0;
        end = radius;
        if (data.directions[i] === -1 ) {
          start = radius;
          end = 0;
        }
      }
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data, inverseAxis]);

  // makes bandScales or each of the objectives. Sets the names and the ranges of the axises without scaling them yet.
  const rband = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, radius]),
    [data]
  );

  // Makes the scaled axises. Calls radScale which will scale the objectives.
  const axisScales = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(radScaleAxis()[i]); //.ticks(ticks);
    });
  }, [data]);

  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;
  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2) - offset, //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"

  const offsetx = -15;
  const offsety = -5;
  // angleSlice in degrees
  const angleDeg = 360 / total;

  useEffect(() => {
    SetData(objectiveData);
  }, [objectiveData]);

  useEffect(() => {
    if (!selection) {
      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `${-offset} ${-offset} ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();

    const centerX = renderW / 2 - offset;
    const centerY = renderH / 2 - offset;

    // helper to use with anything chart related that is not interactive with data.
    const chart = selection
      .append("g")
      .attr("transform", "translate(" + centerX + ", " + centerY + ")");

    data.names.map((name, i) => {
      // rotates the labels horizontally
      const rotateLabels = (i: number) => {
        return -i * angleDeg;
      };

      // transfrom each axis to center of our g. For each axis we need to substract the bandwidth and rotate the axis by the angle in degrees.
      const axis = 
        selection
        .append("g")
        .attr("class", "axises")
        .attr(
          "transform",
          `translate(${
            rband().call(rband, name)! + centerX - i * rband().bandwidth()
          }, 0 )
          rotate( ${i * angleDeg} 0 ${centerY} )
        `
        )
        .call(axisScales()[i].tickSize(6)); // this turns these the same way but I lost the text labels

      // turn the tick labels
      axis
        .selectAll("text")
        .style("text-anchor", "start") // end, niin menee 0 akseli hyvin muut huonosti.
        .attr("transform", () => {
          if (i === 0) {
            return `translate( ${offsetx} 0 ) `;
          }
          return `translate( ${offsetx} 0 ) rotate(${rotateLabels(i)} 0 0 ) `;
        });

      axis.selectAll("text").attr("font-size", "15px");
      axis
        .append("text")
        .attr("class", "labels")
        .style("text-anchor", "middle")
        .text(
          () => `${data.names[i]} (${data.directions[i] === 1 ? "min" : "max"})`
        )
        .style("fill", "black");

      // rotate the objective labels
      axis
        .selectAll(".labels")
        .attr("font-size", "15px")
        .attr(
          "transform",
          `translate( 0 ${offsety} ) rotate(${rotateLabels(i)} 0 0 ) `
        );
    });

    // draw the outline circle for radarchart, do not for spider.
    if (radarOrSpider === true) {
      chart
      .selectAll("circle")
        .data(range(1, 2))
        .enter()
        .append("circle")
        .attr("r", () => radius)
        .style("stroke", "black")
        .style("fill-opacity", 0.0);
    }

    const linesData = (dataset: ObjectiveData) =>
      dataset.values.map((datum) => {
        return datum.value.map((v, i) => {
          return [angleSlice * i, radScaleData()[i](v)]; // call radScales for data points
        });
      });
    const linesRadial = linesData(data).map((datum) => {
      return lineRadial().curve(curveLinearClosed)(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });

    // outline for the oldAlternative. TODO: decide on good color. Grey gets overrun by darker colors,
    if (oldSol !== undefined) {
      const oldSolution = linesData(oldSol).map((datum) => {
        return lineRadial().curve(curveLinearClosed)(
          datum.map((d) => {
            return [d[0], d[1]];
          })
        );
      });

     chart 
        .selectAll(".oldSolution")
        .data(oldSol.values)
        .enter()
        .append("g")
        .attr("class", "oldSolution")
        .append("path")
        .attr("d", (_, i) => oldSolution[i])
        .style("stroke-width", 3 + "px")
        .style("stroke", "black")
        .style("fill", "none");
    }

    //Create a wrapper for the blobs
  chart
      .selectAll(".radarArea")
      .data(data.values)
      .enter()
      .append("path")
      .attr("class", "radarArea")
      .attr("d", (_, i) => linesRadial[i])
      .attr("fill", colors[0])
      .attr("fill-opacity", 0)
      .on("mouseover", function () {
        //Diddm all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.0);
        //Bring back the hovered over blob
        select(this).transition().duration(200).style("fill-opacity", 0.8);
      })
      .on("mouseout", function () {
        //Bring back all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.0);
      });

    // add invis paths to trigger mouse events.
    selection
      .append("g")
      .selectAll("path")
      .data(
        data.values.map((d, i) => {
          return { index: i, ...d };
        })
      )
      .enter()
      .append("path")
      .attr("class", "pathDetector")
      .attr("transform", `translate(${centerX} ${centerY})`)
      .attr("d", (_, i) => linesRadial[i])
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("stroke-width", "15px")
      .attr("pointer-events", "visibleStroke")
      .on("mouseenter", (_, datum) => {
        // here maybe the color?
        SetHoverTarget(datum.index);
      })
      .on("mouseleave", () => {
        SetHoverTarget(-1);
      })
      .on("click", (_, datum) => {
        if (activeIndices.includes(datum.index)) {
          // rm the index
          const tmp = activeIndices.filter((i) => i !== datum.index);
          handleSelection(tmp);
          return;
        }
        const tmp = activeIndices.concat(datum.index);
        handleSelection(tmp);
      });
  }, [selection, data, dimensions, activeIndices]); // add data and active one

  useEffect(() => {
    if (!selection) {
      return;
    }

    // none selected, reset colors for not selected
    if (hoverTarget === -1) {
      const resetSelection = selection
        .selectAll(".radarArea")
        .data(data.values)
        .filter((_, i) => {
          return !activeIndices.includes(i);
        });

      // check not empty
      if (!resetSelection.empty()) {
        resetSelection.attr("stroke-width", "5px").attr("stroke", "#69b3a2");
      }
      return;
      // end effect
    }

    // darken hover target
    const hoverSelection = selection
      .selectAll(".radarArea")
      .data(data.values)
      .filter((_, i) => {
        return i === hoverTarget && !activeIndices.includes(i);
      });

    // check not empty
    if (!hoverSelection.empty()) {
      hoverSelection.attr("stroke-width", "5px").attr("stroke", "pink");
    }
  }, [hoverTarget, selection, activeIndices]);

  useEffect(() => {
    if (!selection) {
      return;
    }

    // highlight selected
    const highlightSelect = selection
      .selectAll(".radarArea")
      .data(data.values)
      .filter((d, i) => {
        console.log("selected d, i", d, i);
        return activeIndices.includes(i);
      });

    // selection from filter is not empty. Here you would add the legend with values for selected
    if (!highlightSelect.empty()) {
      console.log(highlightSelect.data()[0].value[0]); // näin pääsee käsiksi valittujen pisteiden datoihin

      highlightSelect
        .attr("stroke-width", "5px")
        .attr("stroke", "red")
    }
    // dim not selected
    const dimSelection = selection
      .selectAll(".radarArea")
      .data(data.values)
      .filter((_, i) => {
        return !activeIndices.includes(i);
      });

    // selection from filter is not empty
    if (!dimSelection.empty()) {
      dimSelection.attr("stroke-width", "5px").attr("stroke", "#69b3a2");
    }
  }, [activeIndices, selection]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};
