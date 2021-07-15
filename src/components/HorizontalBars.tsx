import React, { useEffect, useState, useCallback, useRef } from "react";
import { select, Selection, pointer } from "d3-selection";
import { scaleLinear, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import "d3-transition";
import { easeCubic } from "d3-ease";
import "./Svg.css";
import { ObjectiveData } from "../types/ProblemTypes";
import { RectDimensions } from "../types/ComponentTypes";

interface HorizontalBarsProps {
objectiveData: ObjectiveData;
  setReferencePoint:
    | React.Dispatch<React.SetStateAction<number[]>>
    | ((x: number[]) => void);
  referencePoint: number[];
  currentPoint: number[];
  dimensionsMaybe?: RectDimensions;
}
const defaultDimensions = {
  chartHeight: 600,
  chartWidth: 800,
  marginLeft: 80,
  marginRight: 160,
  marginTop: 0,
  marginBottom: 0,
};

// Change me: add arg for reference point and use objective data just to set up.
const HorizontalBars = ({
  objectiveData,
  setReferencePoint,
  referencePoint,
  currentPoint,
  dimensionsMaybe,
}: HorizontalBarsProps) => {
  /* 
  These hooks are used to store states, which are meaningful to the operation of this component.
  - ref should only ever point to the single svg-element
  - selection is used to have a usable hook to get hold of the DOM through d3 throughout this
    function
  - data is used to refer to the data being displayed
  - prefPointLocs refers to the locations of the pointers indicating preference on each horizontal bar
   */
  const ref = useRef(null);
  // SetStateAction<Selection<SVGSVGElement, unknown, HTMLElement, any> | null>
  const [selection, setSelection] = useState<null | Selection<
    SVGSVGElement,
    unknown,
    null,
    undefined
  >>(null);
  const [data] = useState(
    objectiveData.values[0].value.map((value, i) => {
      return {
        name: objectiveData.names[i],
        value: value,
        direction: objectiveData.directions[i],
        selected: objectiveData.values[0].selected,
      };
    })
  );
  const [ideal] = useState(objectiveData.ideal);
  const [nadir] = useState(objectiveData.nadir);
  const [prefPointerLocs, setPrefPointerLocs] = useState(
    data.map((d) => d.value)
  );
  const [infoPointerLocs, setInfoPointerLocs] = useState(
    data.map((d) => d.value)
  );
  const [posNegMiddle, setPosNegMiddle] = useState(currentPoint);
  const [dimensions] = useState(
    dimensionsMaybe ? dimensionsMaybe! : defaultDimensions
  );

  useEffect(() => {
    setPrefPointerLocs(referencePoint);
    setInfoPointerLocs(referencePoint);
  }, [referencePoint]);

  useEffect(() => {
    setPosNegMiddle(currentPoint);
  }, [currentPoint]);

  // create an array of linear scales to scale each objective being maximized
  const xs = useCallback(() => {
    return data.map((_, i) => {
      return scaleLinear()
        .domain([nadir[i], ideal[i]])
        .range([0, dimensions.chartWidth]);
    });
  }, [dimensions, data, ideal, nadir]);

  // create also an array of reverse scales to be used when minimizing
  const xs_rev = useCallback(() => {
    return data.map((_, i) => {
      return scaleLinear()
        .domain([ideal[i], nadir[i]])
        .range([0, dimensions.chartWidth]);
    });
  }, [dimensions, data, ideal, nadir]);

  // create an array of bottom axises to work as the individual x-axis for each bar
  const xAxises = useCallback(() => {
    return data.map((d, i) => {
      if (d.direction === -1) {
        return axisBottom(xs()[i]);
      } else {
        return axisBottom(xs_rev()[i]);
      }
    });
  }, [data, xs, xs_rev]);

  // create a discrete band to position each of the horizontal bars
  const y = useCallback(
    () =>
      scaleBand()
        .domain(data.map((d) => d.name))
        .range([0, dimensions.chartHeight])
        .padding(0.35),
    [dimensions, data]
  );

  // This is the main use effect and should really be fired only once per render.
  useEffect(() => {
    // create a discrete band to position each of the horizontal bars
    if (!selection) {
      // add svg and update selection
      const renderH = dimensions.chartHeight;
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
    } else {
      // clear the svg of its children
      console.log("svg clear!");
      selection.selectAll("*").remove();

      // Position the x-axises
      data.map((d, i) =>
        selection
          .append("g")
          .attr(
            "transform",
            `translate(${dimensions.marginLeft}, ${
              y().call(y, d.name) as number + y().bandwidth() * 1.05
            })`
          )
          .call(xAxises()[i].tickSizeOuter(0))
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
          }, ${y()(d.name) as number + y().bandwidth() / 2})`;
        })
        .text((d) => `${d.name} ${d.direction === -1 ? "(max)" : "(min)️"}`)
        .attr("font-size", "14px")
        .attr("font-weight", "bold");

      // draw the positive space for max problems and negative space for min problems
      enter
        .append("rect")
        .attr("class", "posMaxNegMin")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value);
          } else {
            return xs_rev()[i](d.value);
          }
        })
        .attr("y", (d) => {
          return y()(d.name) as number;
        })
        .attr("x", 0)
        .attr("height", y().bandwidth)
        .attr("fill", (d) => {
          if (d.direction === -1) {
            return "#90ee90";
          } else {
            return "#ffcccb";
          }
        });

      // draw the positive space for min problems and the negative space for pos problems
      enter
        .append("rect")
        .attr("class", "negMaxPosMin")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", (d, i) => {
          if (d.direction === -1) {
            return dimensions.chartWidth - xs()[i](d.value);
          } else {
            return dimensions.chartWidth - xs_rev()[i](d.value);
          }
        })
        .attr("y", (d) => {
          return y()(d.name) as number;
        })
        .attr("x", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value);
          } else {
            return xs_rev()[i](d.value);
          }
        })
        .attr("height", y().bandwidth)
        .attr("fill", (d) => {
          if (d.direction === -1) {
            return "#ffcccb";
          } else {
            return "#90ee90";
          }
        });

      // draw the info pointers on each bar on top of the event overlay
      enter
        .append("line")
        .attr("class", "infoPointer")
        .attr("y1", (d) => y()(d.name) as number)
        .attr("y2", (d) => y()(d.name) as number + y().bandwidth())
        .attr("x1", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("stroke-width", 2)
        .attr("stroke", "grey")
        .attr("fill", "none");

      // draw the preference pointers on each bar on top of the event overlay
      enter
        .append("line")
        .attr("class", "preferencePointer")
        .attr("y1", (d) => y()(d.name) as number)
        .attr("y2", (d) => y()(d.name) as number + y().bandwidth())
        .attr("x1", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](d.value) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](d.value) + dimensions.marginLeft;
          }
        })
        .attr("stroke-width", 3)
        .attr("stroke", "black")
        .attr("fill", "none");

      enter
        .append("text")
        .attr("class", "infoLabel")
        .attr("fill", "black")
        .attr("text-anchor", (d, i) => {
          const midPoints = xs().map((x, _) => {
            return (x.domain()[0] + x.domain()[1]) / 2;
          });
          if (d.value >= midPoints[i]) {
            return "end";
          } else {
            return "start";
          }
        })
        .attr("transform", (d, i) => {
          return `translate(${
            d.direction === -1
              ? xs()[i](d.value) + dimensions.marginLeft
              : xs_rev()[i](d.value) + dimensions.marginLeft
          }, ${y()(d.name) as number + y().bandwidth() / 2})`;
        })
        .text(
          (d) =>
            `${d.name}: ${d.value} ${d.direction === -1 ? "(max)️" : "(min)️"}`
        )
        .attr("font-size", "16px")
        .attr("font-weight", "light");

      // draw a transparent overlay on top of each bar to work as an event detector
      enter
        .append("rect")
        .attr("class", "preferencePointerOverlay")
        .attr("transform", `translate(${dimensions.marginLeft}, 0)`)
        .attr("width", dimensions.chartWidth)
        .attr("y", (d) => {
          return y()(d.name) as number;
        })
        .attr("x", 0)
        .attr("height", y().bandwidth)
        .attr("fill", "yellow")
        .attr("opacity", 0.0);
    }
  }, [selection, data, xs, xs_rev, y, xAxises, dimensions]);

  // update the negative and positive spaces when the current solution is updated
  useEffect(() => {
    if (!selection) {
      return;
    }
    const enterPosMaxNegMin = selection.selectAll(".posMaxNegMin").data(data);
    // update the positive space for max problems and negative space for min problems
    enterPosMaxNegMin.attr("width", (d, i) => {
      if (d.direction === -1) {
        return xs()[i](posNegMiddle[i]);
      } else {
        return xs_rev()[i](posNegMiddle[i]);
      }
    });

    const enterNegMaxPosMin = selection.selectAll(".negMaxPosMin").data(data);
    // draw the positive space for min problems and the negative space for pos problems
    enterNegMaxPosMin
      .attr("width", (d, i) => {
        if (d.direction === -1) {
          return dimensions.chartWidth - xs()[i](posNegMiddle[i]);
        } else {
          return dimensions.chartWidth - xs_rev()[i](posNegMiddle[i]);
        }
      })
      .attr("x", (d, i) => {
        if (d.direction === -1) {
          return xs()[i](posNegMiddle[i]);
        } else {
          return xs_rev()[i](posNegMiddle[i]);
        }
      });
  }, [data, posNegMiddle, dimensions]);

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
        .duration(100)
        .ease(easeCubic)
        .attr("x1", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](prefPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](prefPointerLocs[i]) + dimensions.marginLeft;
          }
        });

      // select the info pointers
      const enterInfoPtr = selection.selectAll(".infoPointer").data(data);

      // update the x location of the info pointer according to the state of infoPointerLocs
      enterInfoPtr
        .attr("x1", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](infoPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](infoPointerLocs[i]) + dimensions.marginLeft;
          }
        })
        .attr("x2", (d, i) => {
          if (d.direction === -1) {
            return xs()[i](infoPointerLocs[i]) + dimensions.marginLeft;
          } else {
            return xs_rev()[i](infoPointerLocs[i]) + dimensions.marginLeft;
          }
        });

      // select the info labels
      const enterInfoLabels = selection.selectAll(".infoLabel").data(data);

      // update the x location of the info labels according to the state of infoPointerLocs
      enterInfoLabels
        .attr("transform", (d, i) => {
          return `translate(${
            d.direction === -1
              ? xs()[i](infoPointerLocs[i]) + dimensions.marginLeft
              : xs_rev()[i](infoPointerLocs[i]) + dimensions.marginLeft
          }, ${y()(d.name)! + y().bandwidth() / 2})`;
        })
        .attr("text-anchor", (_, i) => {
          const midPoints = xs().map((x, _) => {
            return (x.domain()[0] + x.domain()[1]) / 2;
          });
          if (infoPointerLocs[i] >= midPoints[i]) {
            return "end";
          } else {
            return "start";
          }
        })
        .text(
          (d, i) =>
            `${d.name}: ${infoPointerLocs[i].toExponential(2)} ${
              d.direction === -1 ? "(max)" : "(min)️"
            }`
        );

      // select the event detection overlay, this needs to be updated because the first useEffect
      // does not have access to the updated state of preferencePointerLocs
      const enterOverlay = selection
        .selectAll(".preferencePointerOverlay")
        .data(data);

      enterOverlay.on("click", (event, d) => {
        const match_index = data.findIndex((datum) => datum.name === d.name);
        const prefValue = (d.direction === -1
          ? xs()[match_index]
          : xs_rev()[match_index]
        ).invert(pointer(event)[0]);
        // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
        const newLocs = prefPointerLocs.map((loc) => loc);
        newLocs[match_index] = prefValue;
        setPrefPointerLocs(newLocs.map((loc) => loc));
        setReferencePoint(newLocs.map((loc) => loc));
      });

      enterOverlay.on("mousemove", (event, d) => {
        const match_index = data.findIndex((datum) => datum.name === d.name);
        const prefValue = (d.direction === -1
          ? xs()[match_index]
          : xs_rev()[match_index]
        ).invert(pointer(event)[0]);
        // SUPER IMPORTANT TO **NOT** CHANGE STATE, BUT TO CREATE A NEW OBJECT!
        const newLocs = infoPointerLocs.map((loc) => loc);
        newLocs[match_index] = prefValue;
        setInfoPointerLocs(newLocs.map((loc) => loc));
      });

      enterOverlay.on("mouseleave", () => {
        setInfoPointerLocs(prefPointerLocs);
      });
    }
  }, [
    selection,
    prefPointerLocs,
    infoPointerLocs,
    data,
    y,
    xs,
    xs_rev,
    xAxises,
    dimensions,
    setReferencePoint,
  ]);

  return <div ref={ref} id="container" className="svg-container"></div>;
};

export default HorizontalBars;
