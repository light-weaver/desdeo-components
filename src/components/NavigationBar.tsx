import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection } from "d3-selection";
import { drag } from "d3-drag";
import { scaleLinear } from "d3-scale";
import { range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { line, curveStepAfter } from "d3-shape";
import "d3-transition";
import "./Svg.css";
import { NavigationData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface NavigationBarProps {
  objectiveData: NavigationData;
  handleReferencePoint:
    | React.Dispatch<React.SetStateAction<[number[], number]>>
    | ((x: [number[], number]) => void);
  handleBound:
    | React.Dispatch<React.SetStateAction<[number[], number]>>
    | ((x: [number[], number]) => void);
  dimensionsMaybe?: RectDimensions;
}

// data type to hold datapoints for ref and boundary lines
interface PointData {
  x: number;
  y: number;
}

const defaultDimensions = {
  chartHeight: 200,
  chartWidth: 1300,
  marginLeft: 80,
  marginRight: 10,
  marginTop: 50,
  marginBottom: 50,
};

export const NavigationBar = ({
  objectiveData,
  handleReferencePoint,
  handleBound,
  dimensionsMaybe,
}: NavigationBarProps) => {
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
  const data = objectiveData;
  const allSteps = data.totalSteps;
  //const step = data.stepsTaken;
  const step = data.stepsTaken;
  const ideal = data.ideal;
  const nadir = data.nadir;
  const objectiveID = data.objectiveID;
  const minOrMax = data.minimize;
  const objName = data.objectiveName;
  const offset =
    dimensions.chartHeight - dimensions.marginTop - dimensions.marginBottom;
  const plotHeight = offset; // size of individual plots
  const drawableSteps = Array.from(range(0, allSteps + 5)); // how many steps will be drawn
  const uReach = data.upperReachables;
  const lReach = data.lowerReachables;
  const referencePoints = data.referencePoints;

  /*===================
         Scales
    ===================*/

  // Scales the objective values to plot coordinates.
  const objValToYPixel = useCallback(() => {
    return scaleLinear().domain([ideal, nadir]).range([0, plotHeight]);
  }, [ideal, nadir, plotHeight]);

  // for returning the svg's coordinate value to parent in original scale.
  const yPixelToObjVal = useCallback(() => {
    return scaleLinear().domain([plotHeight, 0]).range([nadir, ideal]);
  }, [plotHeight, ideal, nadir]);

  // get the correct yAxis depending on miniming or maximizing. Reversed when maximizing. Maximal is always at the top.
  const yAxis = useCallback(() => {
    return axisLeft(objValToYPixel());
  }, [objValToYPixel]);

  // xAxis handles the steps
  const stepValtoXPixel = useCallback(() => {
    return scaleLinear()
      .domain([0, allSteps])
      .range([
        0,
        dimensions.chartWidth - dimensions.marginRight - dimensions.marginLeft,
      ]);
  }, [dimensions, allSteps]);

  // calls xAxis for the objective
  const xAxis = useCallback(() => {
    return axisBottom(stepValtoXPixel()).ticks(6);
  }, [stepValtoXPixel]);

  // generates the lines for refpoints and boundaries
  const lineGenerator = line<PointData>()
    .x((d) => d["x"])
    .y((d) => d["y"])
    .curve(curveStepAfter);

  // fills pointData objects to use drawing both reference and boundary lines
  const fillPointData = (data: any, drawableSteps: number[]) => {
    let pointData: PointData[] = [];
    // if data is NaN we return nothing e.g. if bounds is not set it has Number.NaN in first index and we skip that objective
    if (!Number.isNaN(data[0])) {
      for (let ind of drawableSteps) {
        let currentPoint = data[ind];
        if (currentPoint === undefined) {
          currentPoint = data[step];
        }
        pointData.push({
          x: stepValtoXPixel()(drawableSteps[ind]),
          y: objValToYPixel()(currentPoint),
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

      // y
      chart.append("g").attr("transform", `translate( ${0} )`).call(yAxis());

      // x
      chart
        .append("g")
        .attr("transform", `translate(0 ${plotHeight} )`)
        .call(xAxis());

      // labels. Add them if needed.
      /*
      chart
        .append("g")
        .selectAll("text")
        .data(objName)
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
      const drawPolygons = () => {
        // if minimizing else maximizing
        let i; // iterator for the steps
        let path; // path to be formed
        // first step. Needs to take first of upperBound and lowerBound
        for (i = 0; i < 1; i++) {
          path = [
            stepValtoXPixel()(i),
            objValToYPixel()(uReach[i]),
            stepValtoXPixel()(i),
            objValToYPixel()(lReach[i]),
          ].join(",");
        }
        // Next, we iterate through the lowerBounds
        for (i = 1; i < uReach.length; i++) {
          path =
            path +
            "," +
            [stepValtoXPixel()(i), objValToYPixel()(lReach[i])].join(",");
        }
        // Then, through the upperBounds
        for (i = uReach.length - 1; i > 0; i--) {
          path =
            path +
            "," +
            [stepValtoXPixel()(i), objValToYPixel()(uReach[i])].join(",");
        }
        return path;
      };

      const color = "lightgreen";

      // draw the polygons to the svg

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
        .attr("transform", `translate(0 ${offset} )`)
        .attr("fill", color)
        .attr("points", function (d) {
          return d.map(() => drawPolygons()).join(" ");
        });

      const uppLabels = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );
      // upper labels
      uppLabels
        .selectAll("text")
        .data([uReach[step - 1]])
        .enter()
        .append("text")
        .text((d) => {
          return `${d}`;
        })
        .attr("transform", (d) => {
          return `translate( ${stepValtoXPixel()(step) - 30} ${
            objValToYPixel()(d) - 5
          } )`;
        })
        .attr("font-size", "12px");

      const lowLabels = selection
        .append("g")
        .attr(
          "transform",
          `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
        );
      // lower labels
      lowLabels
        .selectAll("text")
        .data([lReach[step - 1]])
        .enter()
        .append("text")
        .text((d) => {
          return `${d}`;
        })
        .attr("transform", (d) => {
          if (step < 4) {
            return `translate( ${stepValtoXPixel()(step) - 30} ${
              objValToYPixel()(d) + 20
            } )`;
          } else {
            return `translate( ${stepValtoXPixel()(step) - 30} ${
              objValToYPixel()(d) + 10
            } )`;
          }
        })
        .attr("font-size", "12px");
    }
  }, [selection, dimensions, uReach, lReach]);

  /*===================
    useEffect for boundary
    ===================*/

  /*   useEffect(() => {
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
        { x: stepValtoXPixel()[index](step), y: 0 }, // now needs some data to work. x coord will always be the step coord
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
            .on("start", function () {
              // do nothing, if call delete here, then when clicking the line we remove the line and we dont have anything to drag.
            })
            .on("drag", function (event) {
              deleteOldBoundPath(); // delete old lines
              // get data and move while dragging
              movableBoundData[0].y = event.y;
              movableBoundData[1].y = event.y;
              movePath();
            })
            .on("end", function (event) {
              // add line coords to reference data
              let newYvalue = yPixelToObjVal()[index](event.y);
              if (newYvalue > ideal[index]) {
                newYvalue = ideal[index];
              }
              if (newYvalue < nadir[index]) {
                newYvalue = nadir[index];
              }
              // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
              const newBounds = boundaries.map((bound) => bound);
              newBounds[index][step] = newYvalue;
              handleBound(newBounds); // call the refence handler
            })
        );
    });
  }, [selection, boundaries, handleBound]);
 */

  /*===================
    useEffect for refLines
    ===================*/

  useEffect(() => {
    if (!selection) {
      return;
    }

    selection.selectAll(".refPoint").remove(); // removes old points
    selection.selectAll(".movableLine").remove(); // removes old points

    const enter = selection
      .append("g")
      .attr(
        "transform",
        `translate( ${dimensions.marginLeft} ${dimensions.marginTop})`
      );

    const referencePointData = fillPointData(referencePoints, drawableSteps);

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
        .attr("transform", `translate(0)`)
        .attr("fill", "none")
        .attr("stroke", "darkgreen")
        //.attr("stroke-dasharray", "4,2")
        .attr("stroke-width", "5px");
    };

    // movableLineData object
    let movableLineData: PointData[] = [
      { x: stepValtoXPixel()(step), y: 0 }, // now needs some data to work. x coord will always be the step coord
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
        .attr("transform", `translate(0)`)
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
      .attr("transform", `translate(0)`)
      .attr("fill", "none")
      .attr("stroke", "darkgreen")
      //.attr("stroke-dasharray", "4,2")
      .attr("stroke-width", "5px")
      .call(
        drag<SVGPathElement, PointData, SVGElement>()
          .on("start", function () {
            // do nothing, if call delete here, then when clicking the line we remove the line and we dont have anything to drag.
          })
          .on("drag", function (event) {
            deleteOldLinePath(); // delete old lines
            // get data and move while dragging
            movableLineData[0].y = event.y;
            movableLineData[1].y = event.y;
            movePath();
          })
          .on("end", function (event) {
            // add line coords to reference data
            let newYvalue = yPixelToObjVal()(event.y);
            if (newYvalue > ideal) {
              newYvalue = ideal;
            }
            if (newYvalue < nadir) {
              newYvalue = nadir;
            }
            // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
            const newRefPoints = referencePoints.map((ref) => ref);
            newRefPoints[step] = newYvalue;
            handleReferencePoint([newRefPoints, objectiveID]); // call the refence handler
          })
      );
  }, [selection, handleReferencePoint, referencePoints]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default NavigationBars;
