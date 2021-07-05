import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData, ProblemInfo } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";


interface NavigationBarsProps {
  problemInfo: ProblemInfo;
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
  chartHeight: 900,
  chartWidth: 1200,
  marginLeft: 80,
  marginRight: 150,
  marginTop: 250,
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

  // y-axis needs to scale the objectives
  const yAxis = useCallback(()=>{
    return data.objectiveNames.map((_,i) => {
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([0, dimensions.chartHeight]);
    })
  }, [dimensions, data])

  // Again drawing on top of each other, move later
  const yAxises = useCallback(() => {
    return data.objectiveNames.map((_,i) => {
      return axisLeft(yAxis()[i]);
    })
  }, [data, yAxis])

  // x-axis only cares about the steps.
  const xAxis = useCallback(()=> {
    return data.objectiveNames.map(()=>{
      return scaleLinear().
        domain([currentstep, allSteps]).range([0,dimensions.chartWidth])
  })                         
  }, [data, dimensions]) 

  const xAxises = useCallback(() => {
    return data.objectiveNames.map((_,i) => {
      return axisBottom(xAxis()[i])
    })
  }, [data, xAxis])


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

      const chart = selection.append('g')
      //.attr("transform", `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`);

    // stuff here
      data.objectiveNames.map((_, i) => {
        
        // MIETI
        chart.append('g').attr('transform', `translate( ${dimensions.marginLeft} ${dimensions.marginTop + 250 * i})`)
        .call(xAxises()[i])

        // näiden koko että täyttää objektien välit
        chart.append('g').attr('transform', `translate( ${dimensions.marginLeft}  ${300*i})`)
        .call(yAxises()[i])
        


      })


    }
  },[selection, data, dimensions]); 

  return <div ref={ref} id="container" className="svg-container"></div>;
}


export default NavigationBars;

