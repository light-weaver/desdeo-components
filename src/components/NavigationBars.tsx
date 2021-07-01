import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";


/* let's copypaste the problemInfo type here to get started. 
 */
type ProblemType = "Analytical" | "Placeholder";
type MinOrMax = 1 | -1;

interface ProblemInfo {
  problemId: number;
  problemName: string;
  problemType: ProblemType;
  objectiveNames: string[];
  variableNames: string[];
  nObjectives: number;
  ideal: number[];
  nadir: number[];
  minimize: MinOrMax[];
}

interface NavigationBarsProps {
  problemInfo?: ProblemInfo;
  upperBound: number[][];
  lowerBound: number[][];
  totalSteps: number;
  step: number; 
  referencePoints: number[][];
  boundary: number[];
  handleReferencePoint:         
    | React.Dispatch<React.SetStateAction<number[]>>
    | ((x: number[]) => void);
  handleBound:     
    | React.Dispatch<React.SetStateAction<number[]>>
    | ((x: number[]) => void);
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

export const NavigationBars = ({
  problemInfo,
  upperBound,
  lowerBound,
  totalSteps,
  step,
  referencePoints,
  boundary,
  handleReferencePoint,
  handleBound,
  dimensionsMaybe,
}: NavigationBarsProps) => {
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

  const [data, SetData] = useState(problemInfo)
  const [uBound] = useState(upperBound)
  const [lBound] = useState(lowerBound)
  const allSteps = totalSteps;
  
  let currentstep = 0;
  let steps = step;

  const [refPoints] = useState(referencePoints)
  const bounds = useState(boundary)

  // just to get rid of the warnings for now
  console.log(allSteps,currentstep, steps, bounds, data, SetData, uBound, lBound, dimensions, setSelection, selection, refPoints)
  console.log(handleReferencePoint);
  console.log(handleBound);

  // axises and stuff here


    // This is the main use effect and should really be fired only once per render.
  useEffect(() => {
    // create a discrete band to position each of the horizontal bars
    if (!selection) {
      // add svg and update selection
      const renderH = dimensions.chartHeight;
      const renderW =
        dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;

      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
    } else {
      // clear the svg of its children
      console.log("svg clear!");
      selection.selectAll("*").remove();

    // stuff here


    }
  },[selection, data, dimensions]); 

  return <div ref={ref} id="container" className="svg-container"></div>;
}


export default NavigationBars;

