import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface ParallelAxesProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
}

const defaultDimensions = {
  chartHeight: 600,
  chartWidth: 800,
  marginLeft: 80,
  marginRight: 160,
  marginTop: 0,
  marginBottom: 0,
};

const ParallelAxes = ({
  objectiveData,
  dimensionsMaybe,
}: ParallelAxesProps) => {
  const ref = useRef(null);
  const [dimensions] = useState(
    dimensionsMaybe ? dimensionsMaybe : defaultDimensions
  );
  const [data] = useState(objectiveData);

  return (
    <div ref={ref} id="container" className="svg-container">
      Parallel Axes
    </div>
  );
};

export default ParallelAxes;
