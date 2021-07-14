import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scalePoint } from "d3-scale";
import { range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { polygonArea } from "d3-polygon";
import { line, curveStepAfter } from "d3-shape";
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
  boundary?: number[][];
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
 * TODO:
 * draw reference point
 * find solution to X-axis. ask.
 * ask about the useStates for diff variables.
 * make sure can run with up to 100 steps and all between.. Should work.
 * start making stuff interactive mainly moving the reference point
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
  // 100 is the real max, use 10 for simplicity
  const allStepsOG = totalSteps;
  const allSteps = 10;

  // how many steps drawn
  const steps = step;

  const [refPoints, setRefPoints] = useState(referencePoints);
  //const bounds = useState(boundary); // when to use useStates ?
  console.log(handleBound, handleReferencePoint);

  // when to use these, do i need the data object even?
  const boundaries = data.boundary;
  const ideal = data.problemInfo.ideal;
  const nadir = data.problemInfo.nadir;
  const minOrMax = data.problemInfo.minimize;
  const objNames = data.problemInfo.objectiveNames;

  // axises and stuff here
  const plotHeight = 250;

  useEffect(() => {
    setRefPoints(referencePoints);
  }, [referencePoints]);

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
  const xAxis = useCallback(() => {
    return objNames.map(() => {
      return scaleLinear()
        .domain([0, allSteps])
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

      // labels
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

      console.log("YLA", uBound);
      console.log("ALA", lBound);

      const drawableSteps = [Array.from(Array(steps).keys())];
      console.log("eka useeff steps", drawableSteps);

      const drawPolygons = (steps: number[], index: number) => {
        console.log("poly d 2", steps, index);

        if (minOrMax[index] === 1) {
          let j = index; // tämä kun vaihtaa objektien kesken
          let i;
          let path;
          // first step.
          for (i = 0; i < 1; i++) {
            path = [
              xAxis()[j](i),
              yAxis()[j](uBound[j][i]),
              xAxis()[j](i),
              yAxis()[j](lBound[j][i]),
            ].join(",");
          }
          // lowerBounds
          for (i = 1; i < lBound[j].length; i++) {
            path =
              path + "," + [xAxis()[j](i), yAxis()[j](lBound[j][i])].join(",");
          }
          // upperBounds
          for (i = uBound[j].length - 1; i > 0; i--) {
            path =
              path + "," + [xAxis()[j](i), yAxis()[j](uBound[j][i])].join(",");
          }
          return path;
        } else {
          let j = index; // tämä kun vaihtaa objektien kesken
          let i;
          let path;
          // first step.
          for (i = 0; i < 1; i++) {
            path = [
              xAxis()[j](i),
              yAxis_rev()[j](uBound[j][i]),
              xAxis()[j](i),
              yAxis_rev()[j](lBound[j][i]),
            ].join(",");
          }
          // lowerBounds
          for (i = 1; i < lBound[j].length; i++) {
            path =
              path +
              "," +
              [xAxis()[j](i), yAxis_rev()[j](lBound[j][i])].join(",");
          }
          // upperBounds
          for (i = uBound[j].length - 1; i > 0; i--) {
            path =
              path +
              "," +
              [xAxis()[j](i), yAxis_rev()[j](uBound[j][i])].join(",");
          }

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

        console.log(minOrMax);

        // TODO: do again, like refPoints except the undefined check if not given
        // boundary needs to have set default value or some value for the objective if its not used so the order doenst go wrong
        if (boundary !== undefined) {
          const bLines = minOrMax.map((d, i) => {
            if (d === -1) {
              return [
                [0, yAxis_rev()[i](boundary[i][i])],
                [xAxis()[i](allSteps), yAxis_rev()[i](boundary[i][i])],
              ];
            }
            return [
              [0, yAxis()[i](boundary[i][i])],
              [xAxis()[i](allSteps), yAxis()[i](boundary[i][i])],
            ];
          });
          console.log("bLines", bLines);

          const boundaryLines = bLines.map((d) => {
            return line()([
              [d[0][0], d[0][1]],
              [d[1][0], d[1][1]],
            ]);
          });
          console.log(boundaryLines);

          // draw boundary line
          enter
            .append("g")
            .selectAll(".boundary")
            .data(objNames)
            .enter()
            .append("path")
            .attr("class", "boundary")
            .attr("stroke-dasharray", "3,3")
            .attr("d", () => boundaryLines[index])
            .attr("transform", `translate(0 ${300 * index} )`) // tälleen samalla datalla ettei ole päällekkäin
            .attr("stroke", "black")
            .attr("stroke-width", "1px");
        }

      });
    }
  }, [selection, data, dimensions]);


  // useEffect for boundary
  useEffect(() => {
    if (!selection || !boundaries) {
      return;
    }

    boundaries.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

        console.log(index, enter)


  });

  }, [selection, boundaries, data])


  // useEffect for refLines
  // currently only draws the first point
  // TODO: draw the history as well
  useEffect(() => {
    if (!selection) {
      return;
    }

    selection.selectAll(".refPoint").remove(); // removes old points
    console.log("sel", selection);

    console.log("referencePoints", refPoints);
    refPoints.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      console.log(index);
      // This to draw the referencePoints like the polygons aka for once per objective.
      // so linedata needs to have start + all the reference points with steps + last line to end (x width, last refpoint)
      interface ReferencePointData {
        x: number;
        y: number;
      }

      /* nykyisen järjen mukaan data yksikkö on       
       *  x iteroi 0 -> drawableStepsseillä max stepsheihin
       *  y iteroi ekasta ref pisteestä[0] refpisteelistan loppuun, jonka perään sitä vikaa toistetaan kunnes max steps.
       *  eli käytännössä voisi olla kiva jos ref datassa olisi aina pisteiden verran niitä arvoja
       *  ..
       *  taisiis mitäs jos oletetaan näin, siirtyy mahdolinen ongelma käyttöliittymälle.
       *
       */

      // Tätä sitten testaamaan, että missä hajoaa.

      const drawableSteps = Array.from(range(0,allSteps));
      console.log("draw steps", drawableSteps);
      console.log("draw steps", drawableSteps[0]);

      // Yea let's make own data type to get rid of the annoying errors.
      let referencePointData: ReferencePointData[] = []
      for (let ind of drawableSteps) {
        if (minOrMax[index] === -1) {
          referencePointData.push({x: xAxis()[index](drawableSteps[ind]), y: yAxis_rev()[index](refPoints[index][ind])})
        } 
        else {
          referencePointData.push({x: xAxis()[index](drawableSteps[ind]), y: yAxis()[index](refPoints[index][ind])})
        }
      }


      let lineGenerator = line<ReferencePointData>()
          .x(function (d) {
              return d['x'];
          })
          .y(function (d) {
            return d['y'];
          })
          .curve(curveStepAfter);
      console.log("stupid reflines", lineGenerator);

      enter
        .append("g")
        .selectAll(".refPoint")
        .data(referencePointData)
        .enter()
        .append("path")
        .attr("class", "refPoint")
        .attr("d", () => lineGenerator(referencePointData))
        .attr("transform", `translate(0 ${300 * index} )`) // tälleen samalla datalla ettei ole päällekkäin
        .attr("fill", "none")
        .attr("stroke", "black").attr('stroke-width', '3px');



    });
  }, [selection, refPoints, data]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
