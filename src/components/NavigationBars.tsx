import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection } from "d3-selection";
import { drag } from "d3-drag";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { line, curveStepAfter } from "d3-shape";
import "d3-transition";
import "./Svg.css";
import { ProblemInfo, ProblemData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface NavigationBarsProps {
  problemInfo: ProblemInfo;
  problemData: ProblemData;
  referencePoints: number[][];
  boundaries: number[][];
  handleReferencePoint:
  | React.Dispatch<React.SetStateAction<number[][]>>
  | ((x: number[][]) => void);
  handleBound:
  | React.Dispatch<React.SetStateAction<number[][]>>
  | ((x: number[][]) => void);
  dimensionsMaybe?: RectDimensions;
}

// data type to hold datapoints for ref and boundary lines
interface PointData {
  x: number;
  y: number;
}

const defaultDimensions = {
  chartHeight: 900,
  chartWidth: 1300,
  marginLeft: 80,
  marginRight: 10,
  marginTop: 50,
  marginBottom: 50,
};

export const NavigationBars = ({
  problemInfo,
  problemData,
  referencePoints,
  boundaries,
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

  // constants
  const data = problemData;
  const allSteps = data.totalSteps; // tämä pois ja sen sijaan vaan listan viimeisin arvo piirretään aina.
  const step = data.stepsTaken;
  const ideal = problemInfo.ideal;
  const nadir = problemInfo.nadir;
  const minOrMax = problemInfo.minimize;
  const objNames = problemInfo.objectiveNames;
  const offset =
    (dimensions.chartHeight - dimensions.marginTop - dimensions.marginBottom) /
    problemInfo.nObjectives;
  const plotHeight = offset - dimensions.marginTop; // size of individual plots
  const drawableSteps = Array.from(range(0, allSteps + 5)); // how many steps will be drawn
  const uBound = data.upperBounds
  const ulen = uBound[0].length - 1;
  const lBound = data.lowerBounds
  const llen = lBound[0].length - 1;

  /*===================
         Scales
    ===================*/

  // Scales the objective values to plot coordinates.
  const yAxis = useCallback(() => {
    return objNames.map((_, i) => {
      return scaleLinear().domain([ideal[i], nadir[i]]).range([0, plotHeight]);
    });
  }, [dimensions]);

  // for returning the svg's coordinate value to parent in original scale.
  const scaleY = useCallback(() => {
    return minOrMax.map((_, i) => {
      return scaleLinear()
        .domain([plotHeight, 0])
        .range([nadir[i], ideal[i]]);
    });
  }, [dimensions]);

  // get the correct yAxis depending on miniming or maximizing. Reversed when maximizing. Maximal is always at the top.
  const yAxises = useCallback(() => {
    return minOrMax.map((_, i) => {
      return axisLeft(yAxis()[i]);
    });
  }, [yAxis]);

  // xAxis handles the steps
  const xAxis = useCallback(() => {
    return objNames.map(() => {
      return scaleLinear()
        .domain([0, allSteps])
        .range([0, dimensions.chartWidth - dimensions.marginRight - dimensions.marginLeft]);
    });
  }, [dimensions]);

  // calls xAxis for each objective
  const xAxises = useCallback(() => {
    return objNames.map((_, i) => {
      return axisBottom(xAxis()[i]).ticks(6);
    });
  }, [xAxis]);

  // generates the lines for refpoints and boundaries
  const lineGenerator = line<PointData>()
    .x((d) => d["x"])
    .y((d) => d["y"])
    .curve(curveStepAfter);

  // fills pointData objects to use drawing both reference and boundary lines
  const fillPointData = (data: any, drawableSteps: number[], index: number) => {
    let pointData: PointData[] = [];
    // if data is NaN we return nothing e.g. if bounds is not set it has Number.NaN in first index and we skip that objective
    if (!Number.isNaN(data[index][0])) {
      for (let ind of drawableSteps) {
        let currentPoint = data[index][ind];
        if (currentPoint === undefined) {
          currentPoint = data[index][step];
        }
        pointData.push({
          x: xAxis()[index](drawableSteps[ind]),
          y: yAxis()[index](currentPoint),
        });
      }
    }
    return pointData;
  };

  /*===================
     Main use effect.
     ===================*/

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

      // labels. Add them if needed.
      /*
      chart
        .append("g")
        .selectAll("text")
        .data(objNames)
        .enter()
        .append("text")
        .text((d, i) => `${d} ${minOrMax[i] === -1 ? "(max)" : "(min)️"}`)
        .attr("transform", (_, i) => {
          return `translate( ${-70}  ${offset * i - 10})`;
        })
        .attr("font-size", "15px")
        .attr("font-weight", "bold");
        */

      // draws the polygons from upper and lowerBounds.
      const drawPolygons = (index: number) => {
        // if minimizing else maximizing
        let j = index; // current objective index
        let i; // iterator for the steps
        let path; // path to be formed
        // first step. Needs to take first of upperBound and lowerBound
        for (i = 0; i < 1; i++) {
          path = [
            xAxis()[j](i),
            yAxis()[j](uBound[j][i]),
            xAxis()[j](i),
            yAxis()[j](lBound[j][i]),
          ].join(",");
        }
        // Next, we iterate through the lowerBounds
        for (i = 1; i < lBound[j].length; i++) {
          path =
            path + "," + [xAxis()[j](i), yAxis()[j](lBound[j][i])].join(",");
        }
        // Then, through the upperBounds
        for (i = uBound[j].length - 1; i > 0; i--) {
          path =
            path + "," + [xAxis()[j](i), yAxis()[j](uBound[j][i])].join(",");
        }
        return path;
      };

      const colors = ["lightblue", "lightgreen", "lightgrey", "lightyellow", "cyan"]

      // draw the polygons to the svg
      objNames.map((_, index) => {
        const enter = selection
          .append("g")
          .attr(
            "transform",
            `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
          )
          .selectAll("polygon")
          .data([drawableSteps])
          .enter();

        enter
          .append("polygon")
          .attr("transform", `translate(0 ${offset * index} )`)
          .attr("fill", colors[index])
          .attr("points", function(d) {
            return d.map(() => drawPolygons(index)).join(" ");
          });

        const uppLabels = selection.append('g').attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        )
        // upper labels
        uppLabels
          .selectAll('text')
          .data([uBound[index][ulen]])
          .enter()
          .append('text')
          .text((d) => {
            return `${d}`
          })
          .attr("transform", (d) => {
            return `translate( ${xAxis()[index](ulen) - 30} ${yAxis()[index](d) + (offset * index) - 5} )`
          })
          .attr('font-size', '12px')


        const lowLabels = selection.append('g').attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        )
        // lower labels
        lowLabels
          .selectAll('text')
          .data([lBound[index][llen]])
          .enter()
          .append('text')
          .text((d) => {
            return `${d}`
          })
          .attr("transform", (d) => {
            if (step < 4) {
              return `translate( ${xAxis()[index](llen) - 30} ${yAxis()[index](d) + (offset * index) + 20} )`
            }
            else {
              return `translate( ${xAxis()[index](llen) - 30} ${yAxis()[index](d) + (offset * index) + 10} )`
            }
          })
          .attr('font-size', '12px')

      });
    }
  }, [selection, dimensions, uBound, lBound]);

  /*===================
    useEffect for boundary
    ===================*/

  useEffect(() => {
    if (!selection || !boundaries) {
      return;
    }
    selection.selectAll(".boundary").remove(); // removes old points
    selection.selectAll(".movableBound").remove(); // removes old points

    boundaries.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      const boundaryPointData = fillPointData(boundaries, drawableSteps, index);

      const deleteOldBoundPath = () => {
        enter.selectAll(".boundary").remove();
        // remove from component's referencePointData. only for visuals
        boundaryPointData.splice(step + 1, allSteps - 1); // step + 1, step - 1
        enter
          .selectAll(".boundary")
          .data(boundaryPointData)
          .enter()
          .append("path")
          .attr("class", "boundary")
          .attr("d", () => lineGenerator(boundaryPointData))
          .attr("transform", `translate(0 ${offset * index} )`)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", "4px");
      };

      // movableLineData object
      let movableBoundData: PointData[] = [
        { x: xAxis()[index](step), y: 0 }, // now needs some data to work. x coord will always be the step coord
        { x: dimensions.chartWidth, y: 0 }, //. y will change so it doenst matter here
      ];

      const movePath = () => {
        // remove old movableLine
        enter.selectAll(".movableBound").remove();
        // add new movableLine and draw it
        enter
          .selectAll(".movableBound")
          .data(movableBoundData)
          .enter()
          .append("path")
          .attr("class", "movableBound")
          .attr("d", () => lineGenerator(movableBoundData))
          .attr("transform", `translate(0 ${offset * index} )`)
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", "4px");
      };

      // add the boundaryLines. Also implements the drag events.
      enter
        .selectAll(".boundary")
        .data(boundaryPointData)
        .enter()
        .append("path")
        .attr("class", "boundary")
        .attr("d", () => lineGenerator(boundaryPointData))
        .attr("transform", `translate(0 ${offset * index} )`)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", "4px")
        .call(
          drag<SVGPathElement, PointData, SVGElement>()
            .on("start", function() {
              // do nothing, if call delete here, then when clicking the line we remove the line and we dont have anything to drag.
            })
            .on("drag", function(event) {
              deleteOldBoundPath(); // delete old lines
              // get data and move while dragging
              movableBoundData[0].y = event.y;
              movableBoundData[1].y = event.y;
              movePath();
            })
            .on("end", function(event) {
              // add line coords to reference data              
              let newYvalue = scaleY()[index](event.y);
              if (newYvalue > ideal[index]) {
                newYvalue = ideal[index]
              }
              if (newYvalue < nadir[index]) {
                newYvalue = nadir[index]
              }
              // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
              const newBounds = boundaries.map((bound) => bound);
              newBounds[index][step] = newYvalue;
              handleBound(newBounds); // call the refence handler
            })
        );
    });
  }, [selection, boundaries, handleBound]);

  /*===================
    useEffect for refLines
    ===================*/

  useEffect(() => {
    if (!selection) {
      return;
    }

    selection.selectAll(".refPoint").remove(); // removes old points
    selection.selectAll(".movableLine").remove(); // removes old points

    referencePoints.map((_, index) => {
      const enter = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );

      const referencePointData = fillPointData(referencePoints, drawableSteps, index);

      const deleteOldLinePath = () => {
        enter.selectAll(".refPoint").remove();
        // remove from component's referencePointData. only for visuals
        referencePointData.splice(step + 1, allSteps - 1); // step + 1, step - 1
        enter
          .selectAll(".refPoint")
          .data(referencePointData)
          .enter()
          .append("path")
          .attr("class", "refPoint")
          .attr("d", () => lineGenerator(referencePointData))
          .attr("transform", `translate(0 ${offset * index} )`)
          .attr("fill", "none")
          .attr("stroke", "darkgreen")
          //.attr("stroke-dasharray", "4,2")
          .attr("stroke-width", "5px");
      };

      // movableLineData object
      let movableLineData: PointData[] = [
        { x: xAxis()[index](step), y: 0 }, // now needs some data to work. x coord will always be the step coord
        { x: dimensions.chartWidth, y: 0 }, //. y will change so it doenst matter here
      ];

      const movePath = () => {
        // remove old movableLine
        enter.selectAll(".movableLine").remove();
        // add new movableLine and draw it
        enter
          .selectAll(".movableLine")
          .data(movableLineData)
          .enter()
          .append("path")
          .attr("class", "movableLine")
          .attr("d", () => lineGenerator(movableLineData))
          .attr("transform", `translate(0 ${offset * index} )`)
          .attr("fill", "none")
          .attr("stroke", "darkgreen")
          //.attr("stroke-dasharray", "4,2")
          .attr("stroke-width", "5px");
      };

      // add the referenceLines. Also implements the drag events.
      enter
        .selectAll(".refPoint")
        .data(referencePointData)
        .enter()
        .append("path")
        .attr("class", "refPoint")
        .attr("d", () => lineGenerator(referencePointData))
        .attr("transform", `translate(0 ${offset * index} )`)
        .attr("fill", "none")
        .attr("stroke", "darkgreen")
        //.attr("stroke-dasharray", "4,2")
        .attr("stroke-width", "5px")
        .call(
          drag<SVGPathElement, PointData, SVGElement>()
            .on("start", function() {
              // do nothing, if call delete here, then when clicking the line we remove the line and we dont have anything to drag.
            })
            .on("drag", function(event) {
              deleteOldLinePath(); // delete old lines
              // get data and move while dragging
              movableLineData[0].y = event.y;
              movableLineData[1].y = event.y;
              movePath();
            })
            .on("end", function(event) {
              // add line coords to reference data
              let newYvalue = scaleY()[index](event.y);
              if (newYvalue > ideal[index]) {
                newYvalue = ideal[index]
              }
              if (newYvalue < nadir[index]) {
                newYvalue = nadir[index]
              }
              // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
              const newRefPoints = referencePoints.map((ref) => ref);
              newRefPoints[index][step] = newYvalue;
              handleReferencePoint(newRefPoints); // call the refence handler
            })
        );
    });
  }, [selection, handleReferencePoint, referencePoints]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
