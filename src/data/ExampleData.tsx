import { ObjectiveData } from "../types/ProblemTypes";

export const exampleDataSingle5Objectives: ObjectiveData = {
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

export const exampleDataSingle3Objectives: ObjectiveData = {
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

export const exampleDataTen4Objectives: ObjectiveData = {
  names: ["Price", "Quality", "Time", "Efficiency"],
  directions: [1, -1, 1, -1],
  ideal: [25, 0.95, -871, 10],
  nadir: [101, 0.11, 801, 0],
  values: [
    {
      selected: false,
      value: [50, 0.2, -500, 1],
    },
    {
      selected: false,
      value: [20, 0.9, -300, 2],
    },
    {
      selected: false,
      value: [90, 0.01, -800, 3],
    },
    {
      selected: false,
      value: [40, 0.3, 500, 4],
    },
    {
      selected: false,
      value: [55, 0.6, -550, 5],
    },
    {
      selected: false,
      value: [66, 0.22, 602, 6],
    },
    {
      selected: false,
      value: [26, 0.18, 100, 7],
    },
    {
      selected: false,
      value: [99, 0.33, 0, 8],
    },
    {
      selected: false,
      value: [80, 0.73, -100, 9],
    },
    {
      selected: false,
      value: [33.3, 0.81, -150, 10],
    },
  ],
};
