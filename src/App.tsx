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
    [1.0,0.6,0.3], // objective 2
  ],
  lowerBounds: [
    [0,1.5,2], // objective 1
    [0.1,0.2,0.3], // objective 2
  ],
  refPoints: [
    [8,5], // aluksi vain 1 entinen piste
    [0.2,0.2], // 
  ]
}



function App() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <>
      <div style={{ width: "800px", height: "800px", float: "left" }}>
        <NavigationBars
          //problemInfo={exampleProblem3ObjectiveData}
          upperBound={problemData.upperBounds}
          lowerBound={problemData.lowerBounds}
          totalSteps={3} // def esim. 100, nyt kolme koska kolmedatapistettä
          step={1} // n. 1-100, nyt 1-3.
          referencePoints={problemData.refPoints}
          boundary={[5,0.3]} // boundary for obj1, obj2
          handleReferencePoint={setSelected}
          handleBound={setSelected}
        />
      </div>

      <br></br>
        <div style={{ width: "800px", float: "left" }}>
        <HorizontalBars
          objectiveData={exampleDataSimple3Objectives}
          setReferencePoint={setSelected}
          referencePoint={[50,0.5,30]}
          currentPoint={[48,0.45,40]}
        />
      </div>
    </>
  );
}

export default App;
