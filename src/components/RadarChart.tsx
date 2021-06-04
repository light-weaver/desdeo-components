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
  const [data, SetData] = useState(objectiveData);

  useEffect(() => {
    SetData(objectiveData);
  }, [objectiveData]);

  //const datadims = data.values[0].value.length; // get number of objectives. todo: make a getter
  //console.log("dims", datadims)
  //const colors = ["#EDC951","#CC333F","#00A0B0"]

  const colorScale = scaleOrdinal().range(["#EDC951", "#CC333F", "#00A0B0"]);

  const allAxis = data.names;
  //["Price", "Quality", "Time"] // data.names; //(data.names.map((name) => name )) fix this
  const axisNumbers = allAxis.length;
  const radius = Math.min(dimensions.chartWidth, dimensions.chartHeight) / 2;
  console.log("rad", radius);
  //const Format = format('%');
  
  // temp constraints
  let minDomain = 0;
  let maxDomain = 1;
  data.names.map((_,i) => {
    minDomain =  data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i];
    maxDomain = data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i];
  })

  const maxValue = maxDomain; // get this from the data

  const rs = useCallback(() => {
    return data.ideal.map((_, i) => {
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([0, radius]);
    });
  }, [data, maxValue]);

  const yAxises = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(rs()[i]);
    });
  }, [data, rs]);

  const xs = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, 360])
        .padding(1),
    [dimensions, data]
  );

  const radScale = scaleLinear()
  //.domain([minDomain, maxDomain])
  .domain([minDomain,maxDomain])
  .range([0, 360]);

  let angle = (Math.PI * 2) / axisNumbers;
  // add svg and update selection
  const renderH =
    dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;

  const renderW =
    dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;

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
      return datum.value.map((v, i) => {
        return [xs().call(xs, data.names[i])!, radScale(v)];
      });
    });

    // This is a mess. TODO: make it again so that datapoints would actually hit the axels and then worry about moving them to the right positions.
    //const lineRad = lineRadial().curve(curveLinearClosed).radius(d, 

    console.log("linedata",linesData)
    // also problem is that values don't touch the axels. Need to make that happen someway
    //radScale(maxValue * 1.1) * Math.cos(angle * i - Math.PI / 2);
    //  value: [50, 0.2, -500],
    // bug here, otherwise should work. i goes over the index, making the path to undef.
    let ist = 0
    const lines2 = linesData.map((datum) => {
      return lineRadial()
        .curve(curveLinearClosed)
        .radius((d, i) => {console.log("tämä",d, i, d[i]); return (radScale(d[i] * 1.1)*Math.cos(angle* i - Math.PI/2) ); })
        //.radius(360)
        .angle((_, i) => i * angle)(
        datum.map((d) => {
          console.log("i", ist)
          ist += 1
          return [d[0], d[1]];
        })
      );
    });

    console.log("l2",lines2)
    const lines = linesData.map((datum) => {
      return line()(
        datum.map((d,i) => {
          console.log("arvot", d, i)
          console.log( "tulos", [(radScale(d[0]* 1.1)*Math.cos(angle*i - Math.PI/2)), (radScale(d[1] *1.1)*Math.sin(angle*i - Math.PI/2)) ]   )
          return [d[0], d[1] ];
        })
      );
    });

    console.log("l",lines)
    console.log("data values", data.values)

    // create lines data
    //Create a wrapper for the blobs
    let blobWrapper = g
      .selectAll(".radarWrapper")
      .data(data.values)
      .enter()
      .append("g")
      .attr("class", "radarWrapper");

    // Needs data there to work and at right form.
    blobWrapper
      .append("path")
      .attr("class", "radarStroke")
      .attr("d", (_, i) => { console.log("viivat", i); return lines[i];} ) // from the example this should feed the datum for lines
      .attr("stroke", "red")
      .attr("stroke-width", "5px");

    //selection.selectAll("g").attr("transform", `translate(0 ${dimensions.marginTop})`);
  }, [selection, dimensions, data]); // add data and active one

  return <div ref={ref} id="container" className="svg-container"></div>;
};
