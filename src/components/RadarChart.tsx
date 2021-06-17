import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, selectAll, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal, scaleRadial } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft, axisTop, axisRight } from "d3-axis";
import { range, max } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData, ObjectiveDatum } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
  inverseAxis: Boolean;
  turnAxis: Boolean; // turn Axis so improvement is towards same way for each axis.
  // what else is needed
}

const defaultDimensions = {
  chartHeight: 800,
  chartWidth: 800,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 50,
  marginBottom: 50,
};

export const RadarChart = ({
  objectiveData,
  dimensionsMaybe,
  inverseAxis,
  turnAxis
}: RadarChartProps) => {
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

  const [data, SetData] = useState(objectiveData); // if changes, the whole graph is re-rendered
  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight; 
  console.log(renderW, renderH);
  // TODO: Now need to take a new look on this and start from cleaner state. 
  //const maxValue: number = max(data, (d) => d.value) || 1;


  let radScale = useCallback(() => {
    return data.ideal.map((d, i) => {
      console.log("dataid",d,i )
      let start = radius;
      let end = 0

      if (data.directions[i] === -1 && turnAxis === true){
        start = 0;
        end = radius;
      } 

      return scaleLinear()
      //return scaleRadial() // vai radiaaliskaala tässä
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  let radScaleInv = useCallback(() => {
    return data.ideal.map((_, i) => {
      let start = 0;
      let end = radius;

      if (data.directions[i] === -1 && turnAxis === true){
        start = radius;
        end = 0;
      } 

      return scaleLinear()
      //return scaleRadial() // vai radiaaliskaala tässä
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  let radScale_fix = useCallback(() => {
    return data.ideal.map((d, i) => {
      console.log("dataid",d,i )
      let start = radius;
      let end = 0

      if (data.directions[i] === -1 && turnAxis === true){
        start = 0;
        end = radius;
      } 
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([start, end]);
    });
  }, [data]);

  const radScales = useCallback(() => {
    return data.directions.map((d, i) => {
      console.log("DIRS", d, i)
      return radScale_fix()[i];
    });
  }, [data, radScale_fix]);

  const rband = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, radius]),
    [dimensions, data]
  );

  const bandScales = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(radScale()[i]);
    });
  }, [data, radScale]);


  if (inverseAxis === true) {
    radScale = radScaleInv;
  }


  const maxValue = 150;
  //onsole.log("maxval", maxValue);
  const colors = [
    "#EDC951",
    "#CC333F",
    "#00A0B0",
    "#AAEEEA",
    "#FFF111",
    "#FC0FC0",
    "#B200ED",
    "#131E3A",
    "#3BB143",
    "#4B3A26",
  ];

  //console.log("data", data);

  const allAxis = data.names.map((name, _) => name), //Names of each axis
    total = allAxis.length, //The number of different axes
    //radius = Math.min(renderW / 2, renderH / 2), //Radius of the outermost circle
    angleSlice = (Math.PI * 2) / total; //The width in radians of each "slice"
  const levels = 4; // how many background circles we want

  const radius = 450  
  
  //console.log("rad",radius)
  const angleDeg = 360 / total;
  //console.log("angleslice", angleSlice);
  //console.log("axis", allAxis);

  // TODO: get rid of this and those who depend on it
  const rScale = scaleLinear().range([0, radius]).domain([0, maxValue]);

  //const maxValues = nadir;

  useEffect(() => {
    SetData(objectiveData);
  }, [objectiveData]);

  useEffect(() => {
    if (!selection) {
      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        //.attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      //console.log(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();

    // TODO: nämä centerX, centerY olkoon tästedes origo.
    const centerX = renderW / 2;
    const centerY = renderH / 2;
    const g = selection
      .append("g")
      .attr("transform", "translate(" + centerX + ", " + centerY + ")");

    // TODO: axels are mirrored at some i
    data.names.map((name, i) => {
      // transfrom each axis to center of our g. For each axis we need to substract the bandwidth and rotate the axis by the angle in degrees.
      const newAx = selection
        .append("g")
        .attr(
          "transform",
          `translate(${
            rband().call(rband, name)! + centerX - i * rband().bandwidth()
          }, 0 )
          rotate( ${i * angleDeg} 0 ${centerY} )
        `
        )
        .call(bandScales()[i].tickSizeOuter(0)); // no idea why last axis doesn't listen to this.
     // console.log(name);

      newAx.selectAll("text").attr("font-size", "20px");
      newAx
        .append("text")
        .style("text-anchor", "middle")
        .text(
          () => `${data.names[i]} (${data.directions[i] === 1 ? "min" : "max"})`
        )
        .style("fill", "black");
    });

    //const Format = format(".6");
    // wrapper for grid and axises
    const axisGrid = g.append("g").attr("class", "axisWrap");
    // draw the background circles
    axisGrid
      .selectAll("circle")
      .data(range(1, levels).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", (i, _) => (radius / levels) * i)
      .style("fill", "white")
      .style("stroke", "lightblue")
      .style("fill-opacity", 0.2);



    const linesData = data.values.map((datum) => {
      return datum.value.map((v, i) => {
        console.log("i, v", i, v)

        let x = (angleSlice * i)
        let y = radScales()[i](v)
        console.log("X", x)
        console.log("Y", y)
        return [x, y];
      });
    });

    // could do common data both for lines and PO circles
    const lines = linesData.map((datum) => {
      return lineRadial().curve(curveLinearClosed)(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });
    //Create a wrapper for the blobs
    const blobWrapper = g
      .selectAll(".radarWrapper")
      .data(data.values)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // append the backgrounds from the solution points
    blobWrapper
      .append("path")
      .attr("class", "radarArea")
      //.attr('transform', `translate(${centerX} ${centerY})`)
      .attr("d", (_, i) => lines[i])
      .attr("fill", (_, i) => colors[i])
      .attr("fill-opacity", 0.5)
      .on("mouseover", function () {
        //Diddm all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.1);
        //Bring back the hovered over blob
        select(this).transition().duration(200).style("fill-opacity", 0.8);
      })
      .on("mouseout", function () {
        //Bring back all blobs
        selectAll(".radarArea")
          .transition()
          .duration(200)
          .style("fill-opacity", 0.5);
      });

    //Create the outlines
    blobWrapper
      .append("path")
      .attr("class", "radarStroke")
      .attr("d", (_, i) => lines[i])
      .style("stroke-width", 2 + "px")
      .style("stroke", (_, i) => colors[i])
      .style("fill", "none");

    // TODO: scale the dots like the areas
//    const poDatum: ObjectiveDatum[] = data.values;
//    const poDots = linesData.map((d) => {
//      return [d[0], d[1]];
//    });
//    console.log("doits", poDots);
//
//    const blobCirclesEnter = blobWrapper
//      .selectAll(".radarCicle")
//      .data(poDatum)
//      .enter();
//
//    // append the solution points. Think how to make smart, only d
//    poDatum.forEach((entry) => {
//      // console.log("E", entry);
//      const { selected, value } = entry;
//      console.log(selected, value);
//      blobCirclesEnter
//        .append("circle")
//        .attr("class", "radarCicle")
//        .attr("r", 5)
//        .attr("cx", function (_, i) {
//          //console.log("dee ja index",d, i);
//          //console.log("picked val", d.value[i]);
//          return rScale(value[i]) * Math.cos(angleSlice * i - Math.PI / 2);
//        })
//        .attr(
//          "cy",
//          (_, i) => rScale(value[i]) * Math.sin(angleSlice * i - Math.PI / 2)
//        )
//        .style("fill", (_, i) => colors[i])
//        .style("fill-opacity", 1);
//    });
//
    //selection.selectAll("g").attr("transform", `translate(0 ${dimensions.marginTop})`);
  }, [selection, data, dimensions]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};
