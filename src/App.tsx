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

// doesnt work
const range = (max:number, min:number, l:number) => {
  Array.from({length: l}, () => (Math.random()*(max - min)) + min).sort((a,b) => b - a) 
}

let L = 20

let max = 10
let min = 2
let objective1upper =  Array.from({length: L}, () => (Math.random()*(max - min)) + min).sort((a,b) => b - a) 
max = 2
min = 0.1
let objective1lower = Array.from({length: L}, () =>(Math.random()*(max - min)) + min).sort((a,b) => a - b) 
max = 2.0
min = 0.3
let objective2upper = Array.from({length: L}, () => (Math.random()*(max - min)) + min).sort((a,b) => b - a) 
max = 0.3
min = 0.0
let objective2lower = Array.from({length: L}, () => (Math.random()*(max - min)) + min).sort((a,b) => a - b) 
max = 5
min = 1
let objective3upper = Array.from({length: L}, () => (Math.random()*(max - min)) + min).sort((a,b) => b - a) 
max = 1
min = -5
let objective3lower = Array.from({length: L}, () => (Math.random()*(max - min)) + min).sort((a,b) => a - b) 


let objRef1 = Array.from({length: L+1}, () => (Math.random()*(7 - 2)) + 2)//.sort((a,b) => b - a) 
let objRef2 = Array.from({length: L+1}, () => (Math.random()*(2 - 0.3)) + 0.3)//.sort((a,b) => b - a) 
let objRef3 = Array.from({length: L+1}, () => (Math.random()*(5 + 5)) - 5)//.sort((a,b) => b - a) 

let bound1 = Array.from({length: L+1}, () => (Math.random()*(10 - 2)) + 2)


// more complex data to test the component
// refPoints and bounds need to be atleast steps long ideally same size. 
// Values don't necessary make any sense here
const problemData = {
  upperBounds: [
    objective1upper,
    objective2upper,
    objective3upper,
    objective1upper,
    objective2upper,
  ],
  lowerBounds: [
    objective1lower,
    objective2lower, 
    objective3lower,
    objective1lower,
    objective2lower, 
  ],
  refPoints: [
    objRef1,
    objRef2,
    objRef3,
    objRef1,
    objRef2,
  ],
  steps: L,
  boundary: [
    bound1,
    //[5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // objective 1
    [Number.NaN],
    [Number.NaN],
    bound1,
    [Number.NaN]],
}

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
   console.log(refData)
   let newData = {...refData}
   setRefData(newData) 
   console.log(refData)
  },[refData])



  useEffect(() => {
   console.log(bound)
   setBound(bound) 
   console.log(bound)
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
