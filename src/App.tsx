import React, { useRef, useEffect, useState } from "react";
import { select, selection, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { max, min } from "d3-array";
import { axisLeft, axisBottom } from "d3-axis";
import randomstring from "randomstring";
import "d3-transition";
import { easeElastic } from "d3-ease";
import { appendFile } from "node:fs";

const initialData = [
  {
    name: "price",
    value: 50,
    direction: "min",
    selected: false,
  },
  {
    name: "quality",
    value: 0.2,
    direction: "max",
    selected: false,
  },
  {
    name: "time",
    direction: "min",
    value: -500,
    selected: false,
  },
];

const dimensions = {
  width: 900,
  height: 600,
  marginLeft: 100,
  marginRight: 100,
  chartHeight: 500,
  chartWidth: 500,
};

const ideal = [25, 0.95, -871];
const nadir = [101, 0.11, 801];

function App() {
  const ref = useRef<SVGSVGElement | null>(null);
  const [selection, setSelection] = useState<null | Selection<
    SVGSVGElement | null,
    unknown,
    null,
    undefined
  >>(null);
  const [data, setData] = useState(initialData);
  const [prefPointerLocs, setPrefPointerLocs] = useState(
    data.map((d) => d.value)
  );

  const xs = data.map((d, i) => {
    return scaleLinear()
      .domain([nadir[i], ideal[i]])
      .range([0, dimensions.chartWidth]);
  });

  const xs_rev = data.map((d, i) => {
    return scaleLinear()
      .domain([ideal[i], nadir[i]])
      .range([0, dimensions.chartWidth]);
  });

  const y = scaleBand()
    .domain(data.map((d) => d.name))
    .range([0, dimensions.chartHeight])
    .padding(0.35);

  const xAxises = data.map((d, i) => {
    if (d.direction === "max") {
      return axisBottom(xs[i]).ticks(10);
    } else {
      return axisBottom(xs_rev[i]);
    }
  });

  useEffect(() => {
    if (!selection) {
      setSelection(select(ref.current));
    } else {
      // Axixes
      const xAxisGroup = data.map((d, i) =>
        selection
          .append("g")
          .attr(
            "transform",
            `translate(${dimensions.marginLeft}, ${
              y(d.name)! + y.bandwidth() * 1.05
            })`
          )
          .call(xAxises[i])
          .append("text")
          .attr("fill", "black")
          .attr(
            "transform",
            `translate(${dimensions.chartWidth / 2}, ${y.bandwidth() * 0.3})`
          )
          .text(`${d.name}`)
          .attr("font-size", 12)
          .attr("font-weight", "bold")
      );

      // positive space for max, negative space for min
      const enter = selection.append("g").selectAll("rect").data(data).enter();

      // max pos space
      enter
        .append("rect")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", (d, i) => {
          if (d.direction === "max") {
            return xs[i](d.value);
          } else {
            return xs_rev[i](d.value);
          }
        })
        .attr("y", (d) => {
          return y(d.name)!;
        })
        .attr("x", 0)
        .attr("height", y.bandwidth)
        .attr("fill", (d, i) => {
          if (d.direction === "max") {
            return "green";
          } else {
            return "red";
          }
        });

      // neg pos space
      enter
        .append("rect")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", (d, i) => {
          if (d.direction === "max") {
            return dimensions.chartWidth - xs[i](d.value);
          } else {
            return dimensions.chartWidth - xs_rev[i](d.value);
          }
        })
        .attr("y", (d) => {
          return y(d.name)!;
        })
        .attr("x", (d, i) => {
          if (d.direction === "max") {
            return xs[i](d.value);
          } else {
            return xs_rev[i](d.value);
          }
        })
        .attr("height", y.bandwidth)
        .attr("fill", (d, i) => {
          if (d.direction === "max") {
            return "red";
          } else {
            return "green";
          }
        });

      // overlay to handle events
      enter
        .append("rect")
        .attr("class", "preferencePointerOverlay")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", dimensions.chartWidth)
        .attr("y", (d) => {
          return y(d.name)!;
        })
        .attr("x", 0)
        .attr("height", y.bandwidth)
        .attr("fill", "yellow")
        .attr("opacity", 0.0)
        .on("click", (event, d) => {
          const match_index = data.findIndex((datum) => datum.name === d.name);
          const prefValue = (d.direction === "max"
            ? xs[match_index]
            : xs_rev[match_index]
          ).invert(pointer(event)[0]);
          // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
          const newLocs = prefPointerLocs.map((loc) => loc);
          newLocs[match_index] = prefValue;
          setPrefPointerLocs(newLocs.map((loc) => loc));
        });

      enter
        .append("line")
        .attr("class", "preferencePointer")
        .attr("x1", (d, i) => {
          if (d.direction === "max") {
            return xs[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === "max") {
            return xs[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("y1", (d) => y(d.name)!)
        .attr("y2", (d) => y(d.name)! + y.bandwidth())
        .attr("stroke-width", 5)
        .attr("stroke", "blue")
        .attr("fill", "none");
    }
  }, [selection]);

  /* We need an useEffect to watch for changes in the preference pointer values and update not
   *  just the location of the pointers, but also the event handlers on the overlay.
   */
  useEffect(() => {
    if (!selection) {
      return;
    } else {
      const enter = selection.selectAll(".preferencePointer").data(data);

      enter
        .attr("x1", (d, i) => {
          if (d.direction === "max") {
            return xs[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === "max") {
            return xs[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("y1", (d) => y(d.name)!)
        .attr("y2", (d) => y(d.name)! + y.bandwidth())
        .attr("stroke-width", 5)
        .attr("stroke", "blue")
        .attr("fill", "none");
      const enter_2 = selection
        .selectAll(".preferencePointerOverlay")
        .data(data);
      enter_2.on("click", (event, d) => {
        const match_index = data.findIndex((datum) => datum.name === d.name);
        const prefValue = (d.direction === "max"
          ? xs[match_index]
          : xs_rev[match_index]
        ).invert(pointer(event)[0]);
        // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
        const newLocs = prefPointerLocs.map((loc) => loc);
        newLocs[match_index] = prefValue;
        setPrefPointerLocs(newLocs.map((loc) => loc));
      });
    }
  }, [prefPointerLocs]);

  return (
    <div>
      <svg ref={ref} width={dimensions.width} height={dimensions.height}></svg>
      <ul>
        {prefPointerLocs.map((d, i) => (
          <li>{`${data[i].name}(${data[i].direction}) = ${d}`}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
