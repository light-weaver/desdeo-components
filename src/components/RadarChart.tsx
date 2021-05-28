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

const defaultDimensions = {
  chartHeight: 600,
  chartWidth: 1000,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

// mitä muuta tarvitsee
const RadarChart = ({objectiveData, dimensionsMaybe}: RadarChartProps) => {
  const ref = useRef(null);
  const [selection, setSelection] = useState<null | Selection<SVGSVGElement, unknown, null, undefined>>(null);
    const [dimensions] = useState(
    dimensionsMaybe ? dimensionsMaybe : defaultDimensions
  );
  const [data] = useState(objectiveData.values[0])

  return (
    <div> hello </div>
  )
}

export default RadarChart;
