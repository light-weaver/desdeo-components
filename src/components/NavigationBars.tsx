import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scalePoint } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { polygonArea } from "d3-polygon";
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

  // data object needs to:
  // 1. be iterable
  // 2. have bounds split for different objectives or be in correct order so calling by index is not a problem

  // temp data object
  const Data = {
    problemInfo,
    upperBound,
    lowerBound,
    referencePoints,
    step,
    boundary,
  };

  const [data, SetData] = useState(Data);
  console.log("data", data);

  // TODO: conscruct data object that has all the useful and needed parts from navProps

  const [uBound] = useState(upperBound);
  const [lBound] = useState(lowerBound);
  const allSteps = totalSteps;

  const allStepstemp = 10;

  let currentstep = 0;
  let steps = step;
  //const allAxis = data.objectiveNames.map((name, _) => name), //Names of each axis
  // numberOfObjectives = allAxis.length; //The number of different axes

  const [refPoints] = useState(referencePoints);
  const bounds = useState(boundary);
  console.log(handleBound, handleReferencePoint);

  const ideal = data.problemInfo.ideal;
  const nadir = data.problemInfo.nadir;
  const minOrMax = data.problemInfo.minimize;
  const objNames = data.problemInfo.objectiveNames;

  // axises and stuff here
  const plotHeight = 250;

  // y-axis needs to scale the objectives
  const yAxis_rev = useCallback(() => {
    return objNames.map((_, i) => {
      return scaleLinear()
        .domain([nadir[i], ideal[i]]) // add ideal and nadirs
        .range([0, plotHeight]);
    });
  }, [dimensions, data]);
  //
  // y-axis needs to scale the objectives. This means maximal is at the top.
  const yAxis = useCallback(() => {
    return objNames.map((_, i) => {
      return scaleLinear()
        .domain([ideal[i], nadir[i]]) // add ideal and nadirs
        .range([0, plotHeight]);
    });
  }, [dimensions, data]);

  const yAxises = useCallback(() => {
    return minOrMax.map((d, i) => {
      if (d === -1) {
        return axisLeft(yAxis_rev()[i]);
      } else {
        return axisLeft(yAxis()[i]);
      }
    });
  }, [data, yAxis, yAxis_rev]);

  // x-axis only cares about the steps.
  // maybe use d3.scalePoint ?
  const xAxis = useCallback(() => {
    return objNames.map(() => {
      return scalePoint()
        .domain(["0", "1", "2", "3", "4", "5"])
        .range([0, dimensions.chartWidth]);
    });
  }, [data, dimensions]);

  const xAxises = useCallback(() => {
    return objNames.map((_, i) => {
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
      objNames.map((d, i) => {
        console.log(d);
        // y
        chart
          .append("g")
          .attr("transform", `translate( ${0}  ${300 * i})`)
          .call(yAxises()[i]);

        // x
        chart
          .append("g")
          .attr("transform", `translate(0 ${250 + 300 * i} )`)
          .call(xAxises()[i]);
      });

      chart
        .append("g")
        .selectAll("text")
        .data(objNames)
        .enter()
        .append("text")
        .text((d, i) => `${d} ${minOrMax[i] === -1 ? "(max)" : "(min)️"}`)
        .attr("transform", (_, i) => {
          return `translate( ${-70}  ${300 * i})`;
        })
        .attr("font-size", "10px")
        .attr("font-weight", "bold");


      // TODO: kun enemmän pisteitä boundseissa kun tavoitteita niin hajoaa
      const len = uBound[0].length;
      console.log("YLA", uBound);
      console.log("ALA", lBound);
      console.log(len);

      const drawableSteps = [Array.from(Array(steps).keys())];

      const drawPolygons = (steps: number[], index: number) => {
        console.log("tämä d 2", steps, index);

        console.log("min or max", minOrMax[index]);
        if (minOrMax[index] === 1) {
          let j = index; // tämä kun vaihtaa objektien kesken
          let i;
          let path;
          // first step. 
          for (i = 0; i < 1; i++) {
            path = [
              xAxis()[j](i.toString()),
              yAxis()[j](uBound[j][i]),
              xAxis()[j](i.toString()),
              yAxis()[j](lBound[j][i]),
            ].join(",");
          }
          // lowerBounds
          for (i = 1; i < lBound[j].length; i++) {
            path =
              path +
              "," +
              [xAxis()[j](i.toString()), yAxis()[j](lBound[j][i])].join(",");
          }
          // upperBounds
          for (i = uBound[j].length - 1; i > 0; i--) {
            path =
              path +
              "," +
              [xAxis()[j](i.toString()), yAxis()[j](uBound[j][i])].join(",");
          }
          console.log("MIN index", index)
          console.log("Path MIN", path);
          return path;
        } else {
          let j = index; // tämä kun vaihtaa objektien kesken
          let i;
          let path;
          // first step. 
          for (i = 0; i < 1; i++) {
            path = [
              xAxis()[j](i.toString()),
              yAxis_rev()[j](uBound[j][i]),
              xAxis()[j](i.toString()),
              yAxis_rev()[j](lBound[j][i]),
            ].join(",");
          }
          // lowerBounds
          for (i = 1; i < lBound[j].length; i++) {
            path =
              path +
              "," +
              [xAxis()[j](i.toString()), yAxis_rev()[j](lBound[j][i])].join(
                ","
              );
          }
          // upperBounds
          for (i = uBound[j].length - 1; i > 0; i--) {
            path =
              path +
              "," +
              [xAxis()[j](i.toString()), yAxis_rev()[j](uBound[j][i])].join(
                ","
              );
          }

          console.log("MAX index", index)
          console.log("Path MAX", path);
          return path;
        }
      };

      data.problemInfo.objectiveNames.map((_, index) => {
        const enter = selection
          .append("g")
          .attr(
            "transform",
            `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
          )
          .selectAll("polygon")
          .data([drawableSteps]) // tälle viksumpi tapa
          .enter();

        enter
          .append("polygon")
          .attr("transform", `translate(0 ${300 * index} )`) // tälleen samalla datalla ettei ole päällekkäin
          .attr("fill", "darkgrey")
          .attr("points", function (d) {
            //console.log("tämä d",d)
            return d
              .map(function (d) {
                return drawPolygons(d, index);
              })
              .join(" ");
          });
      });
    }
  }, [selection, data, dimensions]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
