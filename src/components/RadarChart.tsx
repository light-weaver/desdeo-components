import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand, scaleOrdinal } from "d3-scale";
import { line, lineRadial, curveLinearClosed } from "d3-shape";
import { axisBottom, axisLeft } from "d3-axis";
import { range } from "d3-array";

import "d3-transition";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface RadarChartProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
  // what else is needed
}

const defaultDimensions = {
  chartHeight: 800,
  chartWidth: 800,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

export const RadarChart = ({
  objectiveData,
  dimensionsMaybe,
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
  const [data] = useState(objectiveData);

  //const datadims = data.values[0].value.length; // get number of objectives. todo: make a getter
  //console.log("dims", datadims)
  //const colors = ["#EDC951","#CC333F","#00A0B0"]
  const datadatum = data.values;

  const dataunit = datadatum[0].value;
  console.log("dta", dataunit);
  const datalist = [{ x: 0, value: 93.24 }];

  console.log("datavalues", datalist);

  const maxValue = 800; // get this from the data
  const colorScale = scaleOrdinal().range(["#EDC951", "#CC333F", "#00A0B0"]);

  const allAxis = data.names;
  //["Price", "Quality", "Time"] // data.names; //(data.names.map((name) => name )) fix this
  console.log(allAxis);
  const axisNumbers = allAxis.length;
  const radius = Math.min(dimensions.chartWidth, dimensions.chartHeight) / 2;
  console.log("rad", radius);
  //const Format = format('%');
  

  const rs = useCallback( () => 
    scaleLinear().domain([0, maxValue]).range([0, radius]),[data, maxValue]
  );

  const radScale = scaleLinear().domain([0, maxValue]).range([0, radius]);
  
  let angle = (Math.PI * 2) / axisNumbers;
  // add svg and update selection
  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;

  console.log(renderH);
  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;
  console.log(renderW);

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
      console.log(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();
    const g = selection
      .append("g")
      .attr("transform", "translate(" + renderW / 2 + ", " + renderH / 2 + ")");

    let axisGrid = g.append("g").attr("class", "axiswrap");
    // draw the circles
    axisGrid
      .selectAll("circle")
      .data(range(1, 4).reverse())
      .enter()
      .append("circle")
      //.attr("transform", "translate(300,300)") // for this, do as in parallelaxes, scale with sizes
      .attr("r", function (d, _) {
        return (radius / 4) * d;
      })
      .style("fill", "white")
      .style("stroke", "lightblue")
      .style("fill-opacity", 0);

    // draw the axes
    let axis = axisGrid
      .selectAll(".axis")
      .data(allAxis)
      .enter()
      .append("g")
      .attr("class", "axis");
    // append the lines
    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", function (_, i) {
        return radScale(maxValue * 1.1) * Math.cos(angle * i - Math.PI / 2);
      }) // could make these own function, bc imo prettier/clearer that way
      .attr(
        "y2",
        (_, i) => radScale(maxValue * 1.1) * Math.sin(angle * i - Math.PI / 2)
      )
      // .attr("transform", "translate(300,300)") // for this, do as in parallelaxes, scale with sizes
      .attr("class", "line")
      .style("stroke", "black")
      .style("stroke-width", "2px");
    // axis labels

      const linesData = data.values.map((datum) => {
        return datum.value.map((v,_) => {
          return [rs().call(rs, maxValue), rs()(v)]
        });
      });

      const lines = linesData.map((datum) => {
        return lineRadial().
          curve(curveLinearClosed).radius((d,i)=>radScale(d[i])).angle((_,i) => i*angle)
        (
          datum.map((d) => {
            return [d[0], d[1]];
          }
        ));
      });

    // radar chart blobs
    const radarLine = lineRadial()
      .curve(curveLinearClosed)
      .radius((d, i) => radScale(d[i]))
      .angle((_, i) => i * angle);
  
    // create lines data
    //Create a wrapper for the blobs
    let blobWrapper = g
      .selectAll(".radarWrapper")
      .data(datadatum)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // Needs data there to work and at right form.
    blobWrapper.append("path").attr('class', 'radarStroke').attr("d", (_,i) => lines[i]).attr('stroke', 'red').attr('stroke-width', '5px');

    //selection.selectAll("g").attr("transform", `translate(0 ${dimensions.marginTop})`);
  }, [selection, dimensions, data]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};
