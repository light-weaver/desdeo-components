import { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { lineRadial, curveLinearClosed } from "d3-shape";
import { axisLeft } from "d3-axis";
import { range } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
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

// default is nadir in center and chart is radarChart with the circle wrapping the axises.
const defaultVisuals = {
  nadirAtCenter: true,
  radarOrSpider: true,
};

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

  // set user preferences or use default settings.
  let nadirAtCenter: boolean, radarOrSpider: boolean;
  if (userPrefForVisuals === undefined) {
    nadirAtCenter = defaultVisuals.nadirAtCenter;
    radarOrSpider = defaultVisuals.radarOrSpider;
  }
  nadirAtCenter = userPrefForVisuals[0];
  radarOrSpider = userPrefForVisuals[1];

  // States
  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered
  const [hoverTarget, SetHoverTarget] = useState(-1); // keeps track of hover target
  const [activeIndices, SetActiveIndices] = useState<number[]>(selectedIndices);

  const oldSol = oldAlternative; // get the oldAlternative
  const offset = dimensions.marginTop + 10; // offset for margins
  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;
  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2) - offset, //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const angleDeg = 360 / total; // angleSlice in degrees

  useEffect(() => {
    SetActiveIndices(selectedIndices);
  }, [selectedIndices]);

  // this scales the axises and turns them accordingly to preferred center, default is nadir at center.
  const radScaleAxis = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = 0;
      let end = radius;
      if (data.directions[i] === -1) {
        start = radius;
        end = 0;
      }
      if (nadirAtCenter === false) {
        start = radius;
        end = 0;
        if (data.directions[i] === -1) {
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
  }, [data, nadirAtCenter, radius]);

  // this scales the data and turns them accordingly to preferred center, default is nadir at center.
  const radScaleData = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = radius;
      let end = 0;
      if (data.directions[i] === -1) {
        start = 0;
        end = radius;
      }
      if (nadirAtCenter === false) {
        start = 0;
        end = radius;
        if (data.directions[i] === -1) {
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
  }, [data, nadirAtCenter, radius]);

  // makes bandScales or each of the objectives. Sets the names and the ranges of the axises without scaling them yet.
  const rband = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, radius]),
    [data, radius]
  );

  // Makes the scaled axises. Calls radScale which will scale the objectives.
  const axisScales = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(radScaleAxis()[i]).ticks(4);
    });
  }, [data, radScaleAxis]);

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
    // offsets for ticks
    const offsetTickX = 15;
    const offsetTickY = 10;

    // helper to use with anything chart related that is not interactive with data.
    const chart = selection
      .append("g")
      .attr("transform", "translate(" + centerX + ", " + centerY + ")");

    data.names.map((name, i) => {
      // rotates the labels horizontally
      const rotateLabels = (i: number) => {
        return -i * angleDeg;
      };

      // transform each axis to center of our g. For each axis we need to substract the bandwidth and rotate the axis by the angle in degrees.
      const axis = selection
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
        .call(axisScales()[i].tickSizeOuter(0));

      // turn the tick labels
      axis
        .selectAll("text")
        .style("text-anchor", "start")
        .attr("transform", () => {
          if (i === 0) {
            return `translate( ${-offsetTickX - 5} 0 ) `;
          }
          return `translate( ${-offsetTickX} 0 ) rotate(${rotateLabels(
            i
          )} 0 0 ) `;
        });
      axis.selectAll("text").attr("font-size", "17px");
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
        .attr("font-size", "18px")
        .attr("transform", () => {
          if (i === 0) {
            return `translate(0 ${-offsetTickY} ) `;
          }
          return `translate( 30 ${offsetTickY} ) rotate(${rotateLabels(
            i
          )} 0 0 ) `;
        });
    });

    // draw the outline circle for radarchart, do not for spider.
    if (radarOrSpider) {
      chart
        .selectAll("circle")
        .data(range(1, 2))
        .enter()
        .append("circle")
        .attr("r", () => radius)
        .style("stroke", "black")
        .style("fill-opacity", 0.0);
    }

    // create linesdata from a dataset in polar coordinates for linesRadial
    const linesData = (dataset: ObjectiveData) =>
      dataset.values.map((datum) => {
        return datum.value.map((v, i) => {
          return [angleSlice * i, radScaleData()[i](v)]; // call radScaleData for data points
        });
      });
    const linesRadial = linesData(data).map((datum) => {
      return lineRadial().curve(curveLinearClosed)(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });

    // outline for the oldSolution
    if (oldSol !== undefined) {
      const oldSolution = linesData(oldSol).map((datum) => {
        return lineRadial().curve(curveLinearClosed)(
          datum.map((d) => {
            return [d[0], d[1]];
          })
        );
      });
      // draw the oldAlternative
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

    // Draw the solutions
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
        //Dim all areas
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.0);
        //Bring back the hovered over area
        select(this).transition().duration(200).style("fill-opacity", 0.8);
      })
      .on("mouseout", function () {
        //Bring back all areas
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
  }, [selection, data, dimensions, activeIndices]);

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
      .filter((_, i) => {
        return activeIndices.includes(i);
      });

    // selection from filter is not empty
    if (!highlightSelect.empty()) {
      highlightSelect.attr("stroke-width", "5px").attr("stroke", "red");
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
