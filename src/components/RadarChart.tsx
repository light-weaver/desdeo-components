import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
  /* TODO: mitä muuta tarvitsee?
   */
}

type Coordinate = {
  X: number;
  Y: number;
};

const defaultDimensions = {
  chartHeight: 600,
  chartWidth: 1000,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

// mitä muuta tarvitsee
const RadarChart = ({ objectiveData, dimensionsMaybe }: RadarChartProps) => {
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
  const [data] = useState(objectiveData.values[0]);

  // hard code data for example. 
  const harddata = [];
  const features = ["A", "B", "C", "D", "E", "F"];
  //generate the data
  for (var i = 0; i < 3; i++) {
    var point: any = {}; // dont use any normally
    //each feature will be a random number from 1-9
    features.forEach((f) => (point[f] = 1 + Math.random() * 8));
    harddata.push(point);
  }
  console.log(harddata);

  useEffect(() => {
    if (!selection) {
      // add svg and update selection
      const renderH =
        dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
      const renderW =
        dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;

      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      console.log(newSelection);
      return;
    }

    // hard code the basic chart
    const radialScale = scaleLinear().domain([0, 10]).range([0, 250]);
    const ticks = [2, 4, 6,8,10]; // get from data
    ticks.forEach((t) =>
      selection
        .append("circle")
        .attr("cx", 300)
        .attr("cy", 300)
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("r", radialScale(t))
    );
    ticks.forEach((t) =>
      selection
        .append("text")
        .attr("x", 305)
        .attr("y", 300 - radialScale(t))
        .text(t.toString())
    );

    // plot the axes, hardcoding. Types look litle cumbersome or i am doing it wrong.
    const angleCoordinate = (angle: number, value: number) => {
      let x = Math.cos(angle) * radialScale(value);
      let y = Math.sin(angle) * radialScale(value);
      let coord: Coordinate = {
        X: 300 + x,
        Y: 300 - y,
      };
      return coord;
    };

    // hard code some of the data, get it from desdeo later. Kinda broken but ok
    for (var i = 0; i < features.length; i++) {
      let ft = features[i];
      let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
      let line_coord = angleCoordinate(angle, 10);
      let label_coord = angleCoordinate(angle, 10.5);

      // draw
      selection
        .append("line")
        .attr("x1", 300)
        .attr("y1", 300)
        .attr("x2", line_coord.X)
        .attr("y2", line_coord.Y)
        .attr("stroke", "black");
      selection
        .append("text")
        .attr("x", label_coord.X)
        .attr("y", label_coord.Y)
        .text(ft);
    }
  }, [selection, dimensions]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default RadarChart;
