import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scalePoint } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { polygonArea } from 'd3-polygon'
import { line } from "d3-shape";
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
  chartHeight: 1000,
  chartWidth: 1200,
  marginLeft: 80,
  marginRight: 150,
  marginTop: 50,
  marginBottom: 50,
};

/*
 * TODO: put axises better in place
 *
 */

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
  console.log(problemInfo);
  // const [data, SetData] = useState(problemInfo);

  // temp data object
  const tempData = [
    {
  //    objectiveNames: ["X", "Y", "Z"]},{
    upperBounds: [
      [10, 5, 2], // objective 1
      [1.0, 0.6, 0.3], // objective 2
    ]},{
    lowerBounds: [
      [0, 1.5, 2], // objective 1
      [0.1, 0.2, 0.3], // objective 2
    ]},{
 //   refPoints: [
 //     [8, 5], // aluksi vain 1 entinen piste
 //     [0.2, 0.2], //
 //   ],
    }];

  // temp data object
  const Data ={ 
    objectiveNames: ["X", "Y", "Z"],
    upperBounds: [
      [10, 5, 2], // objective 1
      [1.0, 0.6, 0.3], // objective 2
    ],
    lowerBounds: [
      [0, 1.5, 2], // objective 1
      [0.1, 0.2, 0.3], // objective 2
    ],
    refPoints: [
      [8, 5], // aluksi vain 1 entinen piste
      [0.2, 0.2], //
    ],
  };
  const [data, SetData] = useState(Data);

  const [Datatemp] = useState(tempData)

  // TODO: conscruct data object that has all the useful and needed parts from navProps

  const [uBound] = useState(upperBound);
  const [lBound] = useState(lowerBound);
  const allSteps = totalSteps;

  const allStepstemp = 10;

  let currentstep = 1;
  let steps = step;
  //const allAxis = data.objectiveNames.map((name, _) => name), //Names of each axis
   // numberOfObjectives = allAxis.length; //The number of different axes

  const [refPoints] = useState(referencePoints);
  const bounds = useState(boundary);

  // just to get rid of the warnings for now
  console.log(
    allSteps,
    currentstep,
    steps,
    bounds,
    data,
    SetData,
    uBound,
    lBound,
    dimensions,
    setSelection,
    selection,
    refPoints
  );
  console.log(handleReferencePoint);
  console.log(handleBound);

  // axises and stuff here
  //const whereIsY = dimensions.chartHeight / numberOfObjectives - 50;

  // y-axis needs to scale the objectives
  const yAxis = useCallback(() => {
    return data.objectiveNames.map(() => {
      return scaleLinear()
        .domain([10, 0]) // add ideal and nadirs
        .range([0, 250]);
    });
  }, [dimensions, data]);

  const yAxises = useCallback(() => {
    return data.objectiveNames.map((_, i) => {
      return axisLeft(yAxis()[i]);
    });
  }, [data, yAxis]);

  // x-axis only cares about the steps.
  // maybe use d3.scalePoint ?
  const xAxis = useCallback(() => {
    return data.objectiveNames.map(() => {
      return scalePoint()
        .domain(["0","1","2", "3","4","5"])
        .range([0, dimensions.chartWidth]);
    });
  }, [data, dimensions]);

  const xAxises = useCallback(() => {
    return data.objectiveNames.map((_, i) => {
      return axisBottom(xAxis()[i]);
    });
  }, [data, xAxis]);

  // This is the main use effect and should really be fired only once per render.
  useEffect(() => {
    // create a discrete band to position each of the horizontal bars
    if (!selection) {
      // add svg and update selection
      const renderH = dimensions.chartHeight;
      const renderW = dimensions.chartWidth;

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

      const chart = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      // stuff here
      data.objectiveNames.map((_, i) => {
        // MIETI

        // y
        chart
          .append("g")
          .attr("transform", `translate( ${0}  ${300 * i})`)
          .call(yAxises()[i]);

          // x
        chart.append('g').attr('transform', `translate(0 ${250 + 300 * i} )`).call(xAxises()[i])
        // näiden koko että täyttää objektien väli
        //chart.append('g').attr('transform', `translate( ${0}  ${300*i})`)
        //.call(yAxis()[i])  whereIsY * (i +1 )
      });



      let poly = [
        {"x":0, "y":0},
        {"x":0,"y":250},
        {"x":240,"y":200},
        {"x":480,"y":150},
        {"x":480,"y":125},
        {"x":240,"y":50},
      ];



      let polydata = [
        {"x":"0", "y":10},
        {"x":"0","y":0},
        {"x":"1","y":1.5},
        {"x":"2","y":2},
        {"x":"2","y":3.2},
        {"x":"1","y":7.5},
      ];

    /*
     * Jos piirrän polygoneilla niin muistetaan logiikka: piste kerrallaan vastapäivään.
     *  
     *  eli eka piste vasen yläkulma 0,0 eli step 0 ja ideal/nadir eli siis upperBound eka
     *  toka step 0  ja ideal/nadir eli siis lowerBound eka
     *  sitten
     *  step 1 ja lowerBound toka
     *  step 2 ja lowerBound kolmas 
     *  jne kunnes
     *
     *  step x ja upperBound vika
     *  step x-1 ja upperBound toka vika
     *  jne kunnes kaikki käyty paitsi upperBound eka
     *  
     */

      // draw the polygons


    // create lines data
    const boundedLines = tempData.map((d,i) => {
      console.log("D ja i",d,i)
        return [xAxis()[i]("1"), yAxis()[i](10)];
      })
    
      console.log(boundedLines)

      // piirtää kaikki mutta päällekkäin, jos laitetaan data erilailla niin sitten paremmin
      // TODO: jos objectiveNames:illä olisi data. niin voisi tehdä tässä mapissa kai?
      data.objectiveNames.map((_,i) => {
     const enter = selection.append('g')
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        )
     .selectAll('polygon').data([polydata]).enter();

     enter.append('polygon')
     .attr('transform', `translate(0 ${300 * i} )`) // tälleen samalla datalla ettei ole päällekkäin
      .attr('fill', "darkgrey" )
     .attr('points', function(d) { 
        return d.map(function(d) {
            return [xAxis()[i](d.x), yAxis()[i](d.y)].join(",");
        }).join(" ")
      })
    });
    



    
    }
  }, [selection, data, tempData, dimensions]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
