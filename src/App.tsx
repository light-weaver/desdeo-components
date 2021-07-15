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
  exampleProblem3ObjectiveData
} from "./data/ExampleData";
import { useState, useEffect } from "react";

// TODO: muuta ehkä interfaceksi tyyliin exampledataan.tsx?
// eg. here ideal is 10 for obj[0] and nadir is 0.
// 3 steps
const problemData = {
  upperBounds: [
    [10,5,2], // objective 1
    [2.0,0.6,0.3], // objective 2
    [5,3,1], // objective 3
  ],
  lowerBounds: [
    [0,1.5,2], // objective 1
    [0.1,0.2,0.3], // objective 2
    [-5,0,1], // objective 3
  ],
  refPoints: [
    [2], // objective 1
    [0.3], // objective 2
    [-1,], // objective 3 
  ],
  steps: 2,
  boundary: [[7], [0.7],[-1]],
  // pitää olla number[][] nykyään
}
// with 4 steps, should work when axises are fixed
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
    [7, 6, 5, 4, 3,3, 3, 3, 3, 3, 3], // objective 1
    [0.5,0.32,0.45, 0.42,0.42, 0.4, 0.4, 0.4, 0.4, 0.4], // objective 2
    [-1,4,-1,1,2.2, 2, 2,2, 2,2], // objective 3 
  ],
  steps: 5,
  // boundary needs to have set default value or some value for the objective if its not used so the order doenst go wrong
  // big enough so its out of the picture would be one (stupid) way.
  boundary: [
    [7,7,7,6,6,6,6,6,6,6], 
    [Number.NaN],
    //[0.7, 0.7,0.7,0.7,0.7,0.7,1, 1, 1, 1],
    [-2, -2,-2,-2, -2 , -2, -2, -2, -2, -2, -2, -2]
  ],
}
 


function App() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <>
      <div style={{ width: "1200px", height: "1000px", float: "left" }}>
        <NavigationBars
          problemInfo={exampleProblem3ObjectiveData}
          upperBound={problemData2.upperBounds}
          lowerBound={problemData2.lowerBounds}
          totalSteps={100} // def esim. 100, nyt kolme koska kolmedatapistettä
          step={problemData2.steps} // n. 1-100, nyt 1-3.
          referencePoints={problemData2.refPoints}
          boundary={problemData2.boundary} // boundary for obj1, obj2
          handleReferencePoint={setSelected}
          handleBound={setSelected}
        />
      </div>
      <br></br>
      <div style={{ width: "1200px", height: "1000px", float: "left" }}>
        <NavigationBars
          problemInfo={exampleProblem3ObjectiveData}
          upperBound={problemData.upperBounds}
          lowerBound={problemData.lowerBounds}
          totalSteps={100} // def esim. 100, nyt kolme koska kolmedatapistettä
          step={problemData.steps} // n. 1-100, nyt 1-3.
          referencePoints={problemData.refPoints}
          boundary={problemData.boundary} // boundary for obj1, obj2
          handleReferencePoint={setSelected}
          handleBound={setSelected}
        />
      </div>
    </>
  );
}

export default App;
