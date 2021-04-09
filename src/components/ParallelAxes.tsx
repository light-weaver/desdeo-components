import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisLeft } from "d3-axis";
import { line } from "d3-shape";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface ParallelAxesProps {
  objectiveData: ObjectiveData;
  dimensionsMaybe?: RectDimensions;
}

const defaultDimensions = {
  chartHeight: 600,
  chartWidth: 1000,
  marginLeft: 50,
  marginRight: 50,
  marginTop: 30,
  marginBottom: 30,
};

const ParallelAxes = ({
  objectiveData,
  dimensionsMaybe,
}: ParallelAxesProps) => {
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
  const [data] = useState(objectiveData); // if changes, the whole graph is re-rendered
  const [selectedData, SetSelectedData] = useState(objectiveData.values); // keeps track of selected
  const [hoverTarget, SetHoverTarget] = useState(-1); // keeps track of hover target

  // create an array of linear scales to scale each objective
  const ys = useCallback(() => {
    return data.ideal.map((_, i) => {
      return scaleLinear()
        .domain([
          data.ideal[i] < data.nadir[i] ? data.ideal[i] : data.nadir[i], // min
          data.ideal[i] > data.nadir[i] ? data.ideal[i] : data.nadir[i], // max
        ])
        .range([dimensions.chartHeight, 0]);
    });
  }, [dimensions, data]);

  const x = useCallback(
    () =>
      scaleBand()
        .domain(data.names.map((name) => name))
        .range([0, dimensions.chartWidth])
        .padding(1),
    [dimensions, data]
  );

  const yAxixes = useCallback(() => {
    return data.directions.map((_, i) => {
      return axisLeft(ys()[i]);
    });
  }, [data, ys]);

  useEffect(() => {
    // create a discrete band to position each of the horizontal bars
    if (!selection) {
      // add svg and update selection
      const renderH =
        dimensions.chartHeight + dimensions.marginBottom + dimensions.marginTop;
      const renderW =
        dimensions.chartWidth + dimensions.marginLeft + dimensions.marginRight;

      const newSelection = select(ref.current)
        .classed("svg-container", true)
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .attr("viewBox", `0 0 ${renderW} ${renderH}`)
        .classed("svg-content", true);

      // update selection
      setSelection(newSelection);
      return;
    }
    // clear the svg
    selection.selectAll("*").remove();

    // position the axises
    // y-axis
    data.names.map((name, i) =>
      selection
        .append("g")
        .attr(
          "transform",
          `translate(${x().call(x, name)! + x().bandwidth()} ${
            dimensions.marginTop
          })`
        )
        .call(yAxixes()[i])
    );

    // create lines data
    const linesData = data.values.map((datum) => {
      return datum.value.map((v, i) => {
        return [x().call(x, data.names[i])!, ys()[i](v)];
      });
    });

    const lines = linesData.map((datum) => {
      return line()(
        datum.map((d) => {
          return [d[0], d[1]];
        })
      );
    });

    // add thin visual paths, these will be visible
    selection
      .append("g")
      .selectAll("path")
      .data(data.values)
      .enter()
      .append("path")
      .attr("class", "visualPath")
      .attr("transform", `translate(0 ${dimensions.marginTop})`)
      .attr("d", (_, i) => lines[i])
      .attr("fill", "none")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 1);

    // add thick invisible paths, these will be used to trigger and improve mouse events
    selection
      .append("g")
      .selectAll("path")
      .data(
        // append the index to the data for easier access in event handlers
        data.values.map((d, i) => {
          return { index: i, ...d };
        })
      )
      .enter()
      .append("path")
      .attr("class", "pathDetector")
      .attr("transform", `translate(0 ${dimensions.marginTop})`)
      .attr("d", (_, i) => lines[i])
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("stroke-width", 15)
      .attr("pointer-events", "visibleStroke") // Otherwise the paths will be treated as closed shapes
      .on("mouseenter", (_, datum) => {
        SetHoverTarget(datum.index);
      })
      .on("mouseleave", () => {
        SetHoverTarget(-1);
      })
      .on("click", (_, datum) => {
        const newData = selectedData;
        newData[datum.index].selected = !newData[datum.index].selected;
        SetSelectedData([...newData]); // hooks are stupid, they don't notice if attributes of an object have changed, this is why they must be destructed like this when setting them
      });
  }, [selection, dimensions, data]);

  useEffect(() => {
    if (!selection) {
      return;
    }

    // highlight selected
    const highlightSelect = selection
      .selectAll(".visualPath")
      .data(selectedData)
      .filter((d, _) => {
        return d.selected;
      });

    // selection from filter is not empty
    if (!highlightSelect.empty()) {
      highlightSelect.attr("stroke-width", 2).attr("stroke", "red");
    }

    // dim not selected
    const dimSelection = selection
      .selectAll(".visualPath")
      .data(selectedData)
      .filter((d, _) => {
        return !d.selected;
      });

    // selection from filter is not empty
    if (!dimSelection.empty()) {
      dimSelection.attr("stroke-width", 1).attr("stroke", "#69b3a2");
    }
  }, [selectedData, selection]);

  useEffect(() => {
    if (!selection) {
      return;
    }

    // none selected, reset colors for not selected
    if (hoverTarget === -1) {
      const resetSelection = selection
        .selectAll(".visualPath")
        .data(selectedData)
        .filter((d, _) => {
          return !d.selected;
        });

      // check not empty
      if (!resetSelection.empty()) {
        resetSelection.attr("stroke-width", 1).attr("stroke", "#69b3a2");
      }
      return;
      // end effect
    }

    // darken hover target
    const hoverSelection = selection
      .selectAll(".visualPath")
      .data(selectedData)
      .filter((d, i) => {
        return i === hoverTarget && !d.selected;
      });

    // check not empty
    if (!hoverSelection.empty()) {
      hoverSelection.attr("stroke-width", 2).attr("stroke", "pink");
    }
  }, [hoverTarget, selection, selectedData]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default ParallelAxes;
