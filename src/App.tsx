import HorizontalBars from "./components/HorizontalBars";
import ParallelAxes from "./components/ParallelAxes";
import RadarChart from "./components/RadarChart";
import NavigationBars from "./components/NavigationBars";
import {
  exampleDataSimple3Objectives,
  exampleDataTen4Objectives,
  exampleDataSingle3Objectives,
  exampleDataSingle5Objectives,
  exampleSingle5OldAlternative,
  exampleProblemInfo3ObjectiveData,
  exampleProblemData3ObjectiveData,
  exampleProblem5ObjectiveData
} from "./data/ExampleData";
import { useState, useEffect } from "react";

import { ProblemData } from "./types/ProblemTypes";



function App() {
  // new moved ref/bound points should be moved by this?
  const [selected, setSelected] = useState<number[]>([]);
  const [refData, setRefData] = useState<number[]>([]);
  const [bound, setBound] = useState<number[]>([]);
  //const [refData, setRefData] = useState<number[]>([]);
  const [pData, setData] = useState(exampleProblemData3ObjectiveData)

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  useEffect(() => {
   setData(pData) 
  },[pData])

  useEffect(() => {
   console.log("useEff ref", refData)
    //let newData = {refData}
   //let newData = {...refData, }
   //setRefData(newData) 
   //console.log(refData)
  },[refData])

  useEffect(() => {
   console.log("useEff bound", bound)
   setBound(bound) 
   //console.log(bound)
  },[bound])


  return (
    <>
      <div style={{ width: "1200px", height: "1000px", float: "left" }}>
        <NavigationBars 
          problemInfo={exampleProblemInfo3ObjectiveData}
          problemData={pData}
          handleReferencePoint={setRefData}
          handleBound={setBound}
        />
      </div>
    </>
  );
}

export default App;
