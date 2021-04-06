import React, { useRef, useEffect, useState } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";

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
  {
    name: "efficiency",
    direction: "max",
    value: 25000,
    selected: false,
  },
  {
    name: "???",
    direction: "max",
    value: 200,
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

const ideal = [25, 0.95, -871, 150000, 300];
const nadir = [101, 0.11, 801, 520, 100];

const HorizontalBars = () => {
  /* 
  These hooks are used to store states, which are meaningful to the operation of this component.
  - ref should only ever point to the single svg-element
  - selection is used to have a usable hook to get hold of the DOM through d3 throughout this
    function
  - data is used to refer to the data being displayed
  - prefPointLocs refers to the locations of the pointers indicating preference on each horizontal bar
   */
  const ref = useRef<SVGSVGElement | null>(null);
  const [selection, setSelection] = useState<null | Selection<
    SVGSVGElement | null,
    unknown,
    null,
    undefined
  >>(null);
  const [data] = useState(initialData);
  const [prefPointerLocs, setPrefPointerLocs] = useState(
    data.map((d) => d.value)
  );

  // create an array of linear scales to scale each objective being maximized
  const [xs] = useState(
    data.map((d, i) => {
      return scaleLinear()
        .domain([nadir[i], ideal[i]])
        .range([0, dimensions.chartWidth]);
    })
  );

  // create also an array of reverse scales to be used when minimizing
  const [xs_rev] = useState(
    data.map((d, i) => {
      return scaleLinear()
        .domain([ideal[i], nadir[i]])
        .range([0, dimensions.chartWidth]);
    })
  );

  // create an array of bottom axised to work as the individual x-axis for each bar
  const [xAxises] = useState(
    data.map((d, i) => {
      if (d.direction === "max") {
        return axisBottom(xs[i]);
      } else {
        return axisBottom(xs_rev[i]);
      }
    })
  );

  // This is the main use effect and should really be fired only once per render.
  useEffect(() => {
    // create a discrete band to position each of the horizontal bars
    // this has to be created in the effect because it's type cannot be coerced as of yet
    // (may in a future version of d3)
    const y = scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, dimensions.chartHeight])
      .padding(0.35);

    if (!selection) {
      setSelection(select(ref.current));
    } else {
      // Position the x-axises
      data.map((d, i) =>
        selection
          .append("g")
          .attr(
            "transform",
            `translate(${dimensions.marginLeft}, ${
              y.call(y, d.name)! + y.bandwidth() * 1.05
            })`
          )
          .call(xAxises[i])
      );

      // enter selection, append to this
      const enter = selection.append("g").selectAll("rect").data(data).enter();

      // append the labels for each bar positioned after the bar, roughly center to the bar
      enter
        .append("text")
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .attr("transform", (d) => {
          return `translate(${
            dimensions.marginLeft + dimensions.chartWidth + 10
          }, ${y(d.name)! + y.bandwidth() / 2})`;
        })
        .text((d) => `${d.name}(${d.direction})`)
        .attr("font-size", 18)
        .attr("font-weight", "bold");

      // draw the positive space for max problems and negative space for min problems
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

      // draw the positive space for min problems and the negative space for pos problems
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

      // draw a transparent overlay on top of each bar to work as an event detector
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
        .attr("opacity", 0.0);

      // draw the preference pointers on each bar on top of the event overlay
      enter
        .append("line")
        .attr("class", "preferencePointer")
        .attr("y1", (d) => y(d.name)!)
        .attr("y2", (d) => y(d.name)! + y.bandwidth())
        .attr("x1", (d, i) => {
          if (d.direction === "max") {
            return xs[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === "max") {
            return xs[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("stroke-width", 3)
        .attr("stroke", "black")
        .attr("fill", "none");
    }
  }, [selection, data, xs, xs_rev, xAxises]);

  /* We need an useEffect to watch for changes in the preference pointer values and update not
   *  just the location of the pointers, but also the event handlers on the overlay.
   */
  useEffect(() => {
    if (!selection) {
      return;
    } else {
      // select the preference pointers
      const enterPointer = selection.selectAll(".preferencePointer").data(data);

      // update the x location of the preference pointer according to the state of prefPointerLocs
      enterPointer
        .transition()
        .duration(300)
        .ease(easeCubic)
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
        });

      // select the event detection overlay, this needs to be updated because the first useEffect
      // does not have access to the updated state of preferencePointerLocs
      const enterOverlay = selection
        .selectAll(".preferencePointerOverlay")
        .data(data);

      enterOverlay.on("click", (event, d) => {
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
  }, [selection, prefPointerLocs, data, xs, xs_rev, xAxises]);

  return (
    <div className="vertical-bars-component">
      <svg ref={ref} width={dimensions.width} height={dimensions.height}></svg>
      <ul>
        {prefPointerLocs.map((d, i) => (
          <li key={i}>{`${data[i].name}(${data[i].direction}) = ${d}`}</li>
        ))}
      </ul>
    </div>
  );
};

export default HorizontalBars;
