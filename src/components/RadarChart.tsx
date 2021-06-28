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
}

// default choices: Nadir is in the middle, axises are turned so their goal is on the outline, drawing RadarChart.
const defaultVisuals = {
  inverseAxis: true,
  turnAxis: true,
  radarOrSpider: true,
};

// TODO:
// labelit vaakatasoon
// koodiin siisteys, kommentointi

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

  // color table
  let colors = [
    "#4B0082",
    "#FF69B4",
    "#00FF00",
    "#8B4513",
    "#4682B4",
    "#FF1493",
    "#00FFFF",
    "#228B22",
    "#FFE4C4",
    "#0000FF",
    "#FFFF00",
  ];

  // set user preferences or default settings.
  let inverseAxis: boolean, turnAxis: boolean, radarOrSpider: boolean;
  if (userPrefForVisuals === undefined) {
    inverseAxis = defaultVisuals.inverseAxis;
    turnAxis = defaultVisuals.turnAxis;
    radarOrSpider = defaultVisuals.radarOrSpider;
  }
  inverseAxis = userPrefForVisuals[0];
  turnAxis = userPrefForVisuals[1];
  radarOrSpider = userPrefForVisuals[2];

  // labeleista.. pallot päihin joita hover niin näkee arvot
  // vai valitsemalla solutionin näkee tarkat arvot jossain?
  // TODO: fix objective labels. find a way to offset them so they fit to the picture and are not on top of the
  // tick labels.

  const oldSol = oldAlternative;

  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered

  const [hoverTarget, SetHoverTarget] = useState(-1); // keeps track of hover target
  const [activeIndices, SetActiveIndices] = useState<number[]>(selectedIndices);

  const offset = 20; // clumsy solution

  useEffect(() => {
    SetActiveIndices(selectedIndices);
  }, [selectedIndices]);
  // TODO: Now need to take a new look on this and start from cleaner state.

  let radScale = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = radius;
      let end = 0;

      if (data.directions[i] === -1 && turnAxis === true) {
        start = 0;
        end = radius;
      }

      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  let radScaleInv = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = 0;
      let end = radius;

      if (data.directions[i] === -1 && turnAxis === true) {
        start = radius;
        end = 0;
      }

      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  let radScale_fix = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = radius;
      let end = 0;

      if (data.directions[i] === -1 && turnAxis === true) {
        start = 0;
        end = radius;
      }
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  const radScales = useCallback(() => {
    return data.directions.map((_, i) => {
      return radScale_fix()[i];
    });
  }, [data, radScale_fix]);

  const rband = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, radius]),
    [dimensions, data]
  );

  const bandScales = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(radScale()[i]); //.ticks(ticks);
    });
  }, [data, radScale]);

  if (inverseAxis === true) {
    radScale = radScaleInv;
  }

  // TODO: Turn labels, add margins

  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;
  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2) - offset, //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const ticks = 4;

  const offsetx = -15;
  const offsety = -10;
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
        //.attr("viewBox", `${-offset} -20 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();

    const centerX = renderW / 2 - offset;
    const centerY = renderH / 2 - offset;
    const g = selection
      .append("g")
      .attr("transform", "translate(" + centerX + ", " + centerY + ")");

    data.names.map((name, i) => {
      // rotates the labels horizontally
      const rotateLabels = (i: number) => {
        return -i * angleDeg;
      };

      // transfrom each axis to center of our g. For each axis we need to substract the bandwidth and rotate the axis by the angle in degrees.
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
        .call(bandScales()[i].tickSize(6)); // this turns these the same way but I lost the text labels

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

    if (radarOrSpider === true) {
      const axisGrid = g.append("g").attr("class", "axisCircle");
      // draw the background circle
      axisGrid
        .selectAll("circle")
        .data(range(1, 2))
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", () => radius)
        .style("stroke", "black")
        .style("fill-opacity", 0.0);
    }

    const linesData = (dataset: ObjectiveData) =>
      dataset.values.map((datum) => {
        return datum.value.map((v, i) => {
          return [angleSlice * i, radScales()[i](v)];
        });
      });

    // could do common data both for lines and PO circles
    const lines = linesData(data).map((datum) => {
      return lineRadial().curve(curveLinearClosed)(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });

    const dots = linesData(data).map((datum) => {
        return datum.map((d) => {
            return [d[0], d[1]]
        })
    })

    const poDots = linesData(data).map((d) => {
      return [d[0], d[1]];
    });

    console.log("DOTS",dots.flat()) // has 9 bc comes from linesdatum
    console.log("podots", poDots.flat()) // has 6 bc comes podots

    // function to change the fill_opacity. Right now only rudimentary.
    const fill_opacity = () => {
      if (lines.length > 5) {
        return 0.0;
      } else {
        return 0.35;
      }
    };

    // outline for the oldAlternative. TODO: decide on good color. Grey gets overrun by darker colors,
    // black might be too dark.
    if (oldSol !== undefined) {
      const oldSolution = linesData(oldSol).map((datum) => {
        return lineRadial().curve(curveLinearClosed)(
          datum.map((d) => {
            return [d[0], d[1]];
          })
        );
      });
      selection
        .append("g")
        .selectAll(".oldSolution")
        .data(oldSol.values)
        .enter()
        .append("g")
        .attr("class", "oldSolution")
        .append("path")
        .attr("transform", `translate(${centerX} ${centerY})`)
        .attr("d", (_, i) => oldSolution[i])
        .style("stroke-width", 3 + "px")
        .style("stroke", "black")
        .style("fill", "none");
    }

    //Create a wrapper for the blobs
    const blobWrapper = g
      .selectAll(".radarWrapper")
      .data(data.values)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // TODO: check for redundancies
    // append the backgrounds from the solution points
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      //.attr('transform', `translate(${centerX} ${centerY})`)
      .attr("d", (_, i) => lines[i])
      .attr("fill", (_, i) => colors[i])
      .attr("fill-opacity", fill_opacity)
      .on("mouseover", function () {
        //Diddm all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.1);
        //Bring back the hovered over blob
        select(this).transition().duration(200).style("fill-opacity", 0.8);
      })
      .on("mouseout", function () {
        //Bring back all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", fill_opacity);
      });

    //Create the outlines
    blobWrapper
      .append("path")
      .attr("d", (_, i) => lines[i])
      .style("stroke-width", 4 + "px")
      .style("stroke", (_, i) => colors[i])
      .style("fill", "none");

    // add invis paths to trigger mouse events.
    selection
      .append("g")
      .selectAll("path")
      .data(
        data.values.map((d, i) => {
          //console.log("data values", data.values);
          return { index: i, ...d };
        })
      )
      .enter()
      //      blobWrapper // this already has origo at centerX/Y.
      .append("path")
      .attr("class", "pathDetector")
      .attr("transform", `translate(${centerX} ${centerY})`)
      .attr("d", (_, i) => lines[i])
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

      //attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
//     const dotsflat = dots.flat()
    // add po circles. Have to write it properly too..
//    selection
//      .append("g")
//      .selectAll("path")
//      .data(
//        data.values.map((d, i) => {
//          //console.log("data values", data.values);
//          return { index: i, ...d };
//        })
//      )
//      .enter()
//      .append("circle")
//      .attr("class", "poCircles")
//      .attr("transform", `translate(${centerX} ${centerY})`)
//      .attr("cx", (_,i) => Math.cos(dotsflat[i][i])*angleSlice)
//      .attr("cy", (_,i) => Math.sin(dotsflat[i][i])*angleSlice)
//      .attr("r", 5)
//      .attr("stroke", "red");
//

  }, [selection, data, dimensions, activeIndices]); // add data and active one

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

      let showableNumbers = highlightSelect.data()[0].value;
      console.log(showableNumbers);

      highlightSelect
        .attr("stroke-width", "8px")
        .attr("stroke", "red")
        .style("fill_opacity", 1);

      // jotain joka vain näyttää toiminnallisuuden. TODO: do it properly.
      selection
        .append("g")
        .attr("class", "numbers")
        .append("text")
        .attr("x", 700)
        .attr("y", 400)
        .text(() => showableNumbers.toString())
        .style("fill", "black");

      // jotain tämän tyylistä, vaatii ajattelua.
      //        highlightSelect.enter().append('circle').
      //            attr('cx', 100)
      //        .attr('cy', (_,i) => 100 + i*25)
      //        .attr('r', 7)
      //        .style('fill', colors[0])
    }
  }, [activeIndices, selection]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};
