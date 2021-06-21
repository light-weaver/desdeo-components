import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal, scaleRadial } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft, axisTop, axisRight } from "d3-axis";
import { range, max } from "d3-array";
import { Force, forceRadial, forceX, forceY } from "d3-force";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData, ObjectiveDatum } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
  inverseAxis: Boolean;
  turnAxis: Boolean; // turn Axis so improvement is towards same way for each axis.
  selectedIndices: number[];
  handleSelection: (x: number[]) => void;
  // what else is needed
}

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
  dimensionsMaybe,
  inverseAxis,
  turnAxis,
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

  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered
  //console.log(renderW, renderH);

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
      return axisLeft(radScale()[i]);
    });
  }, [data, radScale]);

  if (inverseAxis === true) {
    radScale = radScaleInv;
  }

  const colors = [
    "#EDC951",
    "#3BB143",
    "#00008B",
    "#FFF111",
    "#FC0FC0",
    "#B200ED",
    "#131E3A",
    "#00A0B0",
    "#4B3A26",
  ];

  // TODO: Turn labels, add margins

  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;
  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2) - offset, //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const levels = 4;

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
      // transfrom each axis to center of our g. For each axis we need to substract the bandwidth and rotate the axis by the angle in degrees.
      const axis = selection
        .append("g")
        .attr(
          "transform",
          `translate(${
            rband().call(rband, name)! + centerX - i * rband().bandwidth()
          }, 0 )
          rotate( ${i * angleDeg} 0 ${centerY} )
        `
        )
        .call(bandScales()[i].tickSizeOuter(0));

      axis.selectAll("text").attr("font-size", "15px");
      axis
        .append("text")
        .attr("class", "labels")
        .style("text-anchor", "middle")
        .text(
          () => `${data.names[i]} (${data.directions[i] === 1 ? "min" : "max"})`
        )
        .style("fill", "black");

      // labels need work. angle turning needs maffs.
      axis
        .selectAll(".labels")
        .attr("font-size", "20px")
        .attr(
          "transform",
          `translate( 0 0 ) rotate(${i * angleDeg * 2} 0 -10 ) `
        );
    });

    // wrapper for grid and axises
    const axisGrid = g.append("g").attr("class", "axisWrap");
    // draw the background circles
    axisGrid
      .selectAll("circle")
      .data(range(1, levels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", (i, _) => (radius / levels - 1) * i - offset)
      .style("fill", "white")
      .style("stroke", "lightblue")
      .style("fill-opacity", 0.2);

    const linesData = data.values.map((datum) => {
      return datum.value.map((v, i) => {
        let x = angleSlice * i;
        let y = radScales()[i](v);
        return [x, y];
      });
    });

    // could do common data both for lines and PO circles
    const lines = linesData.map((datum) => {
      return lineRadial().curve(curveLinearClosed)(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });

    // function to change the fill_opacity. Right now only rudimentary.
    const fill_opacity = () => {
      if (lines.length > 5) {
        return 0.0;
      } else {
        return 0.5;
      }
    };

    //Create a wrapper for the blobs
    const blobWrapper = g
      .selectAll(".radarWrapper")
      .data(data.values)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

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
      .attr('pointer-events', 'visibleStroke')
      .on('mouseenter', (_, datum) => {
        SetHoverTarget(datum.index);
      }).on('mouseleave', () => {
        SetHoverTarget(-1);
      }).on('click', (_, datum) => {
        if (activeIndices.includes(datum.index)) {
          // rm the index
          const tmp = activeIndices.filter((i) => i !== datum.index);
          handleSelection(tmp);
          return;
        }
        console.log("AFter")
        const tmp = activeIndices.concat(datum.index)
        handleSelection(tmp)
      })

  }, [selection, data, dimensions, activeIndices]); // add data and active one

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
      highlightSelect.attr("stroke-width", "8px").attr("stroke", "red")
      .style('fill_opacity', 1);
    }


  }, [activeIndices, selection]);



  return <div ref={ref} id="container" className="svg-container"></div>;
};
