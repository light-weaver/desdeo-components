import { ObjectiveData } from "../types/ProblemTypes";

const exampleDataSingle5Objectives: ObjectiveData = {
  values: [
    {
      selected: false,
      value: [50, 0.2, -500, 25000, 200],
    },
  ],
  names: ["Price", "Quality", "Time", "Efficiency", "???"],
  directions: [1, -1, 1, -1, -1],
  ideal: [25, 0.95, -871, 150000, 300],
  nadir: [101, 0.11, 801, 520, 100],
};

const exampleDataSingle3Objectives: ObjectiveData = {
  values: [
    {
      selected: false,
      value: [50, 0.2, -500],
    },
  ],
  names: ["Price", "Quality", "Time"],
  directions: [1, -1, 1],
  ideal: [25, 0.95, -871],
  nadir: [101, 0.11, 801],
};

export { exampleDataSingle5Objectives, exampleDataSingle3Objectives };
