// import React from "react";
import HorizontalBars from "./components/HorizontalBars";
import ParallelAxes from "./components/ParallelAxes";
import { RadarChart } from "./components/RadarChart";
//import { RadarChartex } from "./components/RadarChartex";
import {
  exampleDataSimple3Objectives,
  exampleDataTen4Objectives,
  exampleDataSingle3Objectives,
  exampleDataSingle5Objectives,
} from "./data/ExampleData";
//import {test3o, test4o, test5o } from "./data/testdata";
import { useState, useEffect } from "react";

function App() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <>
      <div style={{ width: "600px", height: "600px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataSimple3Objectives}
          inverseAxis={true}
          turnAxis={true}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
      <div style={{ width: "600px", height: "600px", float: "left" }}>
        <ParallelAxes
          objectiveData={exampleDataSimple3Objectives}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
    </>
  );
}

export default App;
