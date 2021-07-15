import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { line, curveStepAfter } from "d3-shape";
import "d3-transition";
import "./Svg.css";
import { ProblemInfo } from "../types/ProblemTypes";
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

// data type to hold datapoints for ref and boundary lines
interface PointData {
  x: number;
  y: number;
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
 * find solution to X-axis. ask.
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
  // TODO: conscruct data object that has all the useful and needed parts from navProps

  console.log(handleBound, handleReferencePoint);

  // constants
  const allStepsOG = totalSteps;
  const allSteps = 10;
  const steps = step;
  const ideal = problemInfo.ideal;
  const nadir = problemInfo.nadir;
  const minOrMax = problemInfo.minimize;
  const objNames = problemInfo.objectiveNames;
  const plotHeight = 250;
  const offset = 300;
  const drawableSteps = Array.from(range(0, allSteps));

  // States
  const [data, setData] = useState(problemInfo);
  useEffect(() => {
    setData(problemInfo);
  }, [problemInfo]);

  const [bounds, setBoundary] = useState(boundary); // when to use useStates ?
  const [uBound, setUBound] = useState(upperBound);
  const [lBound, setLBound] = useState(lowerBound);
  useEffect(() => {
    setBoundary(boundary);
    setUBound(uBound);
    setLBound(lBound);
  }, [boundary, uBound, lBound]);

  const [refPoints, setRefPoints] = useState(referencePoints);
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

  const lineGenerator = line<PointData>()
    .x((d) => d["x"])
    .y((d) => d["y"])
    .curve(curveStepAfter);

  // This is the main use effect and should really be fired only once per render.
  useEffect(() => {
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

      // chart where to add stuff
      const chart = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      objNames.map((_, i) => {
        // y
        chart
          .append("g")
          .attr("transform", `translate( ${0}  ${offset * i})`)
          .call(yAxises()[i]);

        // x
        chart
          .append("g")
          .attr("transform", `translate(0 ${plotHeight + offset * i} )`)
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
          return `translate( ${-70}  ${offset * i})`;
        })
        .attr("font-size", "10px")
        .attr("font-weight", "bold");

      const drawPolygons = (index: number) => {
        // TODO: make better, use steps maybe?
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

      objNames.map((_, index) => {
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
          .attr("transform", `translate(0 ${offset * index} )`) // tälleen samalla datalla ettei ole päällekkäin
          .attr("fill", "darkgrey")
          .attr("points", function (d) {
            return d.map(() => drawPolygons(index)).join(" ");
          });
      });
    }
  }, [selection, data, dimensions, uBound, lBound]);

  // useEffect for boundary
  useEffect(() => {
    if (!selection || !bounds) {
      return;
    }
    selection.selectAll(".boundary").remove(); // removes old points
    console.log("sel", selection);

    bounds.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      const boundaryPointData: PointData[] = [];

      // if bounds is not set it has Number.NaN in first index and we skip that objective
      if (!Number.isNaN(bounds[index][0])) {
        for (let ind of drawableSteps) {
          if (minOrMax[index] === -1) {
            boundaryPointData.push({
              x: xAxis()[index](drawableSteps[ind]),
              y: yAxis_rev()[index](bounds[index][ind]),
            });
          } else {
            boundaryPointData.push({
              x: xAxis()[index](drawableSteps[ind]),
              y: yAxis()[index](bounds[index][ind]),
            });
          }
        }
        console.log("boundaryData", boundaryPointData);
        enter
          .append("g")
          .selectAll(".boundary")
          .data(boundaryPointData)
          .enter()
          .append("path")
          .attr("class", "boundary")
          .attr("stroke-dasharray", "3,3")
          .attr("d", () => lineGenerator(boundaryPointData))
          .attr("transform", `translate(0 ${300 * index} )`) // tälleen samalla datalla ettei ole päällekkäin
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", "1px");
      }
    });
  }, [selection, bounds, data]);

  // useEffect for refLines
  useEffect(() => {
    if (!selection) {
      return;
    }

    selection.selectAll(".refPoint").remove(); // removes old points
    console.log("sel", selection);

    refPoints.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      const referencePointData: PointData[] = [];
      for (let ind of drawableSteps) {
        if (minOrMax[index] === -1) {
          referencePointData.push({
            x: xAxis()[index](drawableSteps[ind]),
            y: yAxis_rev()[index](refPoints[index][ind]),
          });
        } else {
          referencePointData.push({
            x: xAxis()[index](drawableSteps[ind]),
            y: yAxis()[index](refPoints[index][ind]),
          });
        }
      }

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
        .attr("stroke", "black")
        .attr("stroke-width", "3px");
    });
  }, [selection, refPoints, data]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
