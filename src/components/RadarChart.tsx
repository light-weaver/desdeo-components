import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { range, max } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData, ObjectiveDatum } from "../types/ProblemTypes";
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

  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered
  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight; //If the supplied maxValue is smaller than the actual one, replace by the max in the data
  // TODO: take minuses and ideals, nadirs and directions into account.
  //const maxValue: number = max(data, (d) => d.value) || 1;
  const maxValue = 150;
  console.log("maxval", maxValue);
  const colors = ["#EDC951", "#CC333F", "#00A0B0", "#AAAAAA", "#BBBBBB"];

  console.log("data", data);

  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(renderW / 2, renderH / 2), //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const levels = 4; // how many background circles we want

  console.log("angleslice", angleSlice);
  console.log("axis", allAxis);
  // scale to linearize the data
  // Need to make scale different for each objective
  // this needs to take ideals and nadirs to account.
  const rScale = scaleLinear().range([0, radius]).domain([0, maxValue]);

  useEffect(() => {
    SetData(objectiveData);
  }, [objectiveData]);

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
      .attr("r", (i, _) => (radius / levels) * i)
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
      .attr("class", "line")
      .style("stroke", "black")
      .style("stroke-width", "3px");

    // axis labels
    axis
      .append("text")
      .attr("class", "legend")
      .style("font-size", "15px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr(
        "x",
        (_, i) =>
          rScale(maxValue * 0.95) * Math.cos(angleSlice * i + 0.1 - Math.PI / 2)
      )
      .attr(
        "y",
        (_, i) =>
          rScale(maxValue * 0.9) * Math.sin(angleSlice * i + 0.1 - Math.PI / 2)
      )
      .text((name) => name);

    // create lines data
    const linesData = data.values.map((datum) => {
      return datum.value.map((v, i) => {
        return [angleSlice * i, rScale(v)];
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
    //Create a wrapper for the blobs
    const blobWrapper = g
      .selectAll(".radarWrapper")
      .data(data.values) // this needs real data too
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // append the backgrounds from the solution points
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      .attr("d", (_, i) => lines[i]) // from the example this should feed the datum for lines
      .attr("fill", (_, i) => colors[i])
      .attr("fill-opacity", 0.5)
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
          .style("fill-opacity", 0.5);
      });

    //Create the outlines
    blobWrapper
      .append("path")
      .attr("class", "radarStroke")
      .attr("d", (_, i) => lines[i])
      .style("stroke-width", 2 + "px")
      .style("stroke", (_, i) => colors[i])
      .style("fill", "none");

    const poDatum: ObjectiveDatum[] = data.values;

    const poDots = linesData.map((d) => {
      return [d[0], d[1]];
    });
    console.log("doits", poDots);

    const blobCirclesEnter = blobWrapper
      .selectAll(".radarCicle")
      .data(poDatum)
      .enter();


     let [eka,toka, kolmas] = poDatum
      console.log("ayay",poDatum)
      console.log(eka.value, toka, kolmas )


    // append the solution points. Think how to make smart, only d
    // Need to go over every number in value[] and draw circle at x, y there. loop over all values per axis or?
    // Do own circlesdata function? <-- This seems like the way to go with d3 opinions 
    poDatum.forEach((entry) => {
      console.log("E",entry)
      const {selected, value} =  entry;
      console.log(selected, value)
      blobCirclesEnter
        .append("circle")
        .attr("class", "radarCicle")
        .attr("r", 5)
        .attr("cx", function (_,i) {
          //console.log("dee ja index",d, i);
          //console.log("picked val", d.value[i]);
          return rScale(value[i]) * Math.cos(angleSlice * i - Math.PI / 2);
        })
        .attr(
          "cy",
          (_, i) => rScale(value[i]) * Math.sin(angleSlice * i - Math.PI / 2)
        )
        .style("fill", "red")
        .style("fill-opacity", 1);
    });


    //selection.selectAll("g").attr("transform", `translate(0 ${dimensions.marginTop})`);
  }, [selection, data, dimensions]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};
