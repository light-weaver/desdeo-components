import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { range } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
  // what else is needed
}

const defaultDimensions = {
  chartHeight: 800,
  chartWidth: 800,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

const exampleData = [
  [
    //iPhone
    { axis: "Battery Life", value: 0.22 },
    { axis: "Brand", value: 0.28 },
    { axis: "Contract Cost", value: 0.29 },
    { axis: "Design And Quality", value: 0.17 },
    { axis: "Have Internet Connectivity", value: 0.22 },
  ],
  [
    //Samsung
    { axis: "Battery Life", value: 0.27 },
    { axis: "Brand", value: 0.16 },
    { axis: "Contract Cost", value: 0.35 },
    { axis: "Design And Quality", value: 0.13 },
    { axis: "Have Internet Connectivity", value: 0.2 },
  ],
  [
    //Nokia Smartphone
    { axis: "Battery Life", value: 0.26 },
    { axis: "Brand", value: 0.1 },
    { axis: "Contract Cost", value: 0.3 },
    { axis: "Design And Quality", value: 0.14 },
    { axis: "Have Internet Connectivity", value: 0.22 },
  ],
];

export const RadarChart = ({
  objectiveData,
  dimensionsMaybe,
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
  const [real_data, SetData2] = useState(objectiveData);

  const [data, SetData] = useState(exampleData);

  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight; //If the supplied maxValue is smaller than the actual one, replace by the max in the data
  let maxValue = 0.5; // get this from the real data
  const colors = ["#EDC951", "#CC333F", "#00A0B0", "#AAAAAA", "#BBBBBB"];

  // oma nootti: ei varmaan kannata olla xs koska pitäisi olla vain scalelinear joka skaalaa oikealle etäisyydelle origosta akselille
  // pisteen ja radialScale joka kääntää kulman ja laittaa oikealle kohdalle ympyräkoordinaateissa.
  // COmeon: tietysti käännät x arvon lineaarisesti skaalattuna sitten angleksi eli polaariseksi koordinaatiksi ja y arvon lineaarisesti skaalattuna radiukseski.

  const allAxis = exampleData[0].map(function (i, _) {
      return i.axis;
    }), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2), //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const levels = 4; // how many background circles we want
  // scale to linearize the data
  const rScale = scaleLinear().range([0, radius]).domain([0, maxValue]);

  useEffect(() => {
    if (!selection) {
      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        //.attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      console.log(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();

    const g = selection
      .append("g")
      .attr("transform", "translate(" + renderW / 2 + ", " + renderH / 2 + ")");

    // wrapper for grid and axises
    const axisGrid = g.append("g").attr("class", "axisWrap");
    // draw the background circles
    axisGrid
      .selectAll("circle")
      .data(range(1, levels).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      //.attr("transform", "translate(300,300)") // for this, do as in parallelaxes, scale with sizes
      .attr("r", (d, _) => (radius / levels) * d)
      .style("fill", "white")
      .style("stroke", "lightblue")
      .style("fill-opacity", 0.2);

    // TODO: draw labels

    // draw the axes
    const axis = axisGrid
      .selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");
    // append the lines
    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (_, i) => rScale(maxValue) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y2",
        (_, i) => rScale(maxValue) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      // .attr("transform", "translate(300,300)") // for this, do as in parallelaxes, scale with sizes
      .attr("class", "line")
      .style("stroke", "black")
      .style("stroke-width", "5px");

    // axis labels
    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr(
        "x",
        (_, i) =>
          rScale(maxValue * 0.95) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (_, i) =>
          rScale(maxValue * 0.9) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .text((d) => d);

    const radarLine = lineRadial()
      .curve(curveLinearClosed)
      // @ts-ignore
      .radius((d) => rScale(d.value))
      .angle((_, i) => i * angleSlice);

    //Create a wrapper for the blobs
    let blobWrapper = g
      .selectAll(".radarWrapper")
      .data(exampleData) // this needs real data too
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // append the backgrounds from the solution points
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      // @ts-ignore
      .attr("d", (d, _) => radarLine(d)) // from the example this should feed the datum for lines
      // @ts-ignore
      .attr("fill", (_, i) => colors[i])
      .attr("fill-opacity", 0.5)
      //.on('mouseover', ((d,i) => selectAll('.radarArea').transition().duration(200)).style('fill-opacity', 0.1));
      // @ts-ignore
      .on("mouseover", function (d, i) {
        //Dim all blobs
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
          .style("fill-opacity", 0.5);
      });

    // append the solution points
    blobWrapper
      .selectAll(".radarCicle")
      .data((d, _) => d)
      .enter()
      .append("circle")
      .attr("class", "radarCicle")
      .attr("r", levels)
      .attr(
        "cx",
        (d, i) => rScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "cy",
        (d, i) => rScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .style("fill", "yellow")
      .style("fill-opacity", 0.8);

    //Create the outlines
    blobWrapper
      .append("path")
      .attr("class", "radarStroke")
      // @ts-ignore
      .attr("d", (d, _) => radarLine(d))
      .style("stroke-width", 2 + "px")
      .style("stroke", (_, i) => colors[i])
      .style("fill", "none");

    //selection.selectAll("g").attr("transform", `translate(0 ${dimensions.marginTop})`);
  }, [selection]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};
