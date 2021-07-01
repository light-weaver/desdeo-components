import HorizontalBars from "./components/HorizontalBars";
import ParallelAxes from "./components/ParallelAxes";
import { RadarChart } from "./components/RadarChart";
import {
  exampleDataSimple3Objectives,
  exampleDataTen4Objectives,
  exampleDataSingle3Objectives,
  exampleDataSingle5Objectives,
  exampleSingle5OldAlternative
} from "./data/ExampleData";
import { useState, useEffect } from "react";

function App() {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    console.log(selected);
  }, [selected]);

  return (
    <>
      <div style={{ width: "800px", height: "800px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataSimple3Objectives}
          userPrefForVisuals={[true, true]} // [inverseAxis, radarOrSpider]. Nadir in the middle, radarChart.
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
        <div style={{ width: "800px", float: "left" }}>
        <ParallelAxes
          objectiveData={exampleDataSimple3Objectives}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
      <br></br>
      <div style={{ width: "800px", height: "800px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataTen4Objectives}
          userPrefForVisuals={[true, true]} // [inverseAxis, radarOrSpider]. Nadir in the middle, radarChart.
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
        <div style={{ width: "800px", float: "left" }}>
        <ParallelAxes
          objectiveData={exampleDataTen4Objectives}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
      <br></br>
      <div style={{ width: "800px", height: "800px", float: "left" }}>
        <RadarChart
          objectiveData={exampleDataSingle5Objectives}
          userPrefForVisuals={[true, true]} // [inverseAxis, radarOrSpider]. Nadir in the middle, radarChart.
          oldAlternative={exampleSingle5OldAlternative}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
        <div style={{ width: "800px", float: "left" }}>
        <ParallelAxes
          objectiveData={exampleDataSingle5Objectives}
          oldAlternative={exampleSingle5OldAlternative}
          selectedIndices={selected}
          handleSelection={setSelected}
        />
      </div>
    </>
  );
}

export default App;
