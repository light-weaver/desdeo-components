import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { line } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
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
  chartHeight: 600,
  chartWidth: 1000,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

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
  const [data] = useState(objectiveData);
  console.log("og data", data);

  //const ideals = 
  //console.log(ideals);
  const nadirs = data.nadir;
    console.log(nadirs)

    const axisLenght = dimensions.chartWidth / 3;
    const offset = 300;
  // change the angle in the unit circle. ioffset since d3 draws from topleft corner  
  const angleCoordinate = (angle: number) => {
    let x = Math.cos(angle) * axisLenght;
    let y = Math.sin(angle) * axisLenght;
    return { x: offset + x, y: offset - y };
  };

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

    // position the axises
    data.names.map((name, i) => {
      console.log("!",name, i)
      let angle = Math.PI / 2 + (2 * Math.PI * i) / data.names.length;
      let line_coord = angleCoordinate(angle);
      let label_coord = angleCoordinate(angle);
      selection
        .append("line")
        .attr("x1", offset)
        .attr("y1", offset)
        .attr("x2", line_coord.x)
        .attr("y2", line_coord.y)
        .attr("stroke", "black");

        // for now we just append some pixels so the labels stay in the picture. TODO: add padding instead.
      selection.append('text').attr('x', label_coord.x + 50).attr('y',label_coord.y +50).text(name.toString())
    });
  }, [selection, dimensions]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default RadarChart;
