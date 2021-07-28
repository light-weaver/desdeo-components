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
  ],
  lowerBounds: [
    objective1lower,
    objective2lower, 
    objective3lower,
  ],
  refPoints: [
    objRef1,
    objRef2,
    objRef3,
  ],
  steps: L,
  boundary: [
    bound1,
    //[5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // objective 1
    [Number.NaN],[Number.NaN]],
}

const problemData3 = {
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




// simple data for building the component
// data has +1 to steps since always needs to have the starting point / ending point as the + 1.
const problemData2 = {
  upperBounds: [
    [10,9,7,5,5,5], // objective 1
    [2.0,1.9,1.5,0.8,0.6,0.6], // objective 2
    [5,4.5,4,3,2.8,2.8], // objective 3
  ],
  lowerBounds: [
    [0,0.2, 0.3, 0.5,1.5,1.5], // objective 1
    [0.0,0.05, 0.1, 0.15, 0.2, 0.2], // objective 2
    [-5,-4, -3,0.2,0.5,0.5], // objective 3
  ],
  refPoints: [
    [7, 6, 4, 4, 3,3, 3, 3, 3, 3, 3], // objective 1
    [1.5,1.2,0.45, 0.45,0.42, 0.4, 0.4, 0.4, 0.4, 0.4], // objective 2
    [-1,-1,1,1,2, 2, 2,2, 2,2], // objective 3 
  ],
  steps: 5,
  // boundary needs to have set default value or some value for the objective if its not used so the order doenst go wrong
  boundary: [
    [8,8,8,6,6,6,6,6,6,6], 
    [Number.NaN],
    //[0.7, 0.7,0.7,0.7,0.7,0.7,1, 1, 1, 1],
    [-2, -2,-2,0, 0 , 0, 0, 0, 0, 0, 0, 0]
  ],
}
 


function App() {
  // new moved ref/bound points should be moved by this?
  const [selected, setSelected] = useState<number[]>([]);


  const [refData, setRefData] = useState(problemData2.refPoints)

  useEffect(() => {
    console.log(selected);
  }, [selected]);


  useEffect(() => {
    const refData = problemData2.refPoints

   setRefData(refData) 
  },[refData, problemData2])


  const reDraw = (newPoint:any) => {
          problemData2.refPoints[0].splice(3, 7)
          problemData2.refPoints[0].push(newPoint)
          problemData2.refPoints[0].push(newPoint)
          problemData2.refPoints[0].push(newPoint)
          problemData2.refPoints[0].push(newPoint)
          problemData2.refPoints[0].push(newPoint)
          problemData2.refPoints[0].push(newPoint)
          console.log(problemData2.refPoints)
        
          refData[0].splice(3, 7)  
          refData[0].push(newPoint)
          refData[0].push(newPoint)
          refData[0].push(newPoint)
          refData[0].push(newPoint)
          refData[0].push(newPoint)
          refData[0].push(newPoint)
          console.log(refData)
  }

  return (
    <>
      <div style={{ width: "1200px", height: "1000px", float: "left" }}>
        <NavigationBars
          problemInfo={exampleProblemInfo3ObjectiveData}
          upperBound={problemData2.upperBounds}
          lowerBound={problemData2.lowerBounds}
          totalSteps={100} // def esim. 100, nyt kolme koska kolmedatapistettä
          step={problemData2.steps} // n. 1-100, nyt 1-3.
          referencePoints={refData}
          boundary={problemData2.boundary} // boundary for obj1, obj2
          handleReferencePoint={setSelected}
          handleBound={setSelected}
          onDrag={
         (newPoint:any) => {
            console.log("new Y value", newPoint)
            reDraw(newPoint)
        }
          }
        />
      </div>

    </>
  );
}

export default App;
