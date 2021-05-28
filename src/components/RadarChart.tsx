import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { line } from "d3-shape";
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
  console.log("og data", data)
  
  const features = [0,1,2,3,4]

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
    const radialScale = scaleLinear().domain([0, 500]).range([0, 300]);
    const ticks = [50,100,200,500]; // get from data
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
      /*
      let coord: Coordinate = {
        X: 300 + x,
        Y: 300 - y,
      };
      return coord;
       */
      return {"x": 300 + x, "y": 300 - y};
    };

    // hard code some of the data, get it from desdeo later. Kinda broken but ok
    for (var i = 0; i < features.length; i++) {
      let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;  
      let line_coord = angleCoordinate(angle, 500);
      let label_coord = angleCoordinate(angle, 450);

      // draw the chart
      selection
        .append("line")
        .attr("x1", 300)
        .attr("y1", 300)
        .attr("x2", line_coord.x)
        .attr("y2", line_coord.y)
        .attr("stroke", "black");
      selection
        .append("text")
        .attr("x", label_coord.x)
        .attr("y", label_coord.y)
        .text(i);
    }

    /* How to do lines
        // create lines data
    const linesData = data.values.map((datum) => {
      return datum.value.map((v, i) => {
        return [x().call(x, data.names[i])!, ys()[i](v)];
      });
    });

    const lines = linesData.map((datum) => {
      return line()(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });
     */
    // plot the fake data. Dont use ts-ignore.
    // @ts-ignore:
    let Line: any = line().x(d => d.x).y(d => d.y);

    const colors = ["red", "gray", "navy"];
    const getPath = (data_point: number[]) => {
      let coords = [];
      for (var i = 0; i < features.length; i++) {
        let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
        coords.push(angleCoordinate(angle, data_point[i]));
      }
      return coords;
    };
    for (var i = 0; i < features.length; i++) {
      console.log("data:", data.value)
      let d = data.value;
      console.log(typeof(d))
      console.log("tässä d:", d)
      let color = colors[i];
      let coords = getPath(d);
      console.log(coords)

      selection
        .append("path")
        .datum(coords)
        .attr("d", Line)
        .attr("stroke-width", 3)
        .attr("stroke", color)
        .attr("fill", color)
        .attr("stroke-opacity", 1)
        .attr("opacity", 0.5);
    }
  }, [selection, dimensions]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default RadarChart;
