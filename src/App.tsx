// import React from "react";
import HorizontalBars from "./components/HorizontalBars";
import ParallelAxes from "./components/ParallelAxes";
import { exampleDataTen4Objectives } from "./data/ExampleData";
import { useState, useEffect } from "react";

function App() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <>
      <div style={{ width: "800px", float: "left" }}>
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
