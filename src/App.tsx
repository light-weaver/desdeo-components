import React from "react";
import HorizontalBars from "./components/HorizontalBars";
import { exampleDataSingle5Objectives } from "./data/ExampleData";
import { useState, useEffect } from "react";

function App() {
  const [refPoint, setRefPoint] = useState([1, 2, 3]);

  useEffect(() => {
    console.log(refPoint);
  }, [refPoint]);

  return (
    <>
      <div style={{ width: "800px", float: "left" }}>
        <HorizontalBars
          objectiveData={exampleDataSingle5Objectives}
          setReferencePoint={setRefPoint}
        ></HorizontalBars>
      </div>
    </>
  );
}

export default App;
