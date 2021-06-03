// import React from "react";
import HorizontalBars from "./components/HorizontalBars";
import ParallelAxes from "./components/ParallelAxes";
import { RadarChart } from "./components/RadarChart";
import { exampleDataTen4Objectives, exampleDataSingle3Objectives, exampleDataSingle5Objectives } from "./data/ExampleData";
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
          objectiveData={exampleDataSingle3Objectives}
        />
      </div>
        <div style={{ width: "600px", height: "600px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataSingle5Objectives}
        />
      </div>
      <div style={{ width: "600px", height: "600px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataTen4Objectives}
        />
      </div>
      <div style={{ width: "800px", float: "right" }}>
        <ParallelAxes
          objectiveData={exampleDataTen4Objectives}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
    </>
  );
}

export default App;
