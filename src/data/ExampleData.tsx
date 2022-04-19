import {
  ObjectiveData,
  ProblemInfo,
  NavigationData,
  NavigationDataSingleObjective,
} from "../types/ProblemTypes";

export const exampleProblemInfo3ObjectiveData: ProblemInfo = {
  problemId: 0,
  problemName: "TestProblem",
  problemType: "Discrete",
  objectiveNames: ["Outlet Gases", "Enviromental Damage", "Profit"],
  variableNames: ["X", "Y", "Z"],
  nObjectives: 3,
  ideal: [0, 0, 5],
  nadir: [10, 2, -5],
  minimize: [1, 1, -1],
};

export const exampleProblemData3ObjectiveData: NavigationData = {
  objectiveNames: ["Objective 1", "Objective 2", "Objective 3"],
  minimize: [1, 1, 1],
  ideal: [0, 0, -5],
  nadir: [10, 2, 5],
  upperBounds: [
    [10, 9, 7, 5, 5, 5], // objective 1
    [2.0, 1.9, 1.5, 0.8, 0.6, 0.6], // objective 2
    [5, 4.5, 4, 3, 2.8, 2.8], // objective 3
  ],
  lowerBounds: [
    [0, 0.2, 0.3, 0.5, 1.5, 1.5], // objective 1
    [0.0, 0.05, 0.1, 0.15, 0.2, 0.2], // objective 2
    [-5, -4, -3, 0.2, 0.5, 0.5], // objective 3
  ],
  referencePoints: [
    [7, 6, 4, 4, 3, 3], // objective 1
    [1.5, 1.2, 0.45, 0.45, 0.42, 0.42], // objective 2
    [-1, -1, 1, 1, 2, 2], // objective 3
  ],
  // boundary needs to have set default value or some value for the objective if its not used so the order doenst go wrong
  boundaries: [
    [8, 8, 8, 6, 6, 6],
    [1, 1, 1, 0.7, 0.7, 0.6],
    [-2, -2, -2, 0, 0, 0],
  ],
  totalSteps: 15,
  stepsTaken: 5, // this must to be stepsTaken - 1 from to the bounds and refereslines given.
};

export const exampleProblem5ObjectiveData: ProblemInfo = {
  problemId: 1,
  problemName: "TestProblem",
  problemType: "Discrete",
  objectiveNames: ["G1", "G2", "G3", "G4", "G5"],
  variableNames: ["X", "Y", "Z", "R", "V"],
  nObjectives: 5,
  ideal: [0, 0, 5, 10, 2],
  nadir: [10, 2, -5, 0, 0],
  minimize: [1, 1, -1, -1, -1],
};

export const exampleSingle5OldAlternative: ObjectiveData = {
  values: [
    {
      selected: false,
      value: [50, 0.15, -400, 20000, 150],
    },
  ],
  names: ["Price", "Quality", "Time", "Efficiency", "???"],
  directions: [1, -1, 1, -1, -1],
  ideal: [25, 0.95, -871, 150000, 300],
  nadir: [101, 0.11, 801, 520, 100],
};

export const exampleDataSingle5Objectives: ObjectiveData = {
  values: [
    {
      selected: false,
      value: [40, 0.2, -500, 25000, 200],
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

export const exampleDataSimple3Objectives: ObjectiveData = {
  values: [
    {
      selected: false,
      value: [45, 0.2, 100],
    },
    {
      selected: false,
      value: [75, 0.4, 80],
    },
    {
      selected: false,
      value: [101, 0.6, 40],
    },
  ],
  names: ["Price", "Quality", "Time"],
  directions: [1, -1, 1],
  ideal: [25, 0.95, 150],
  nadir: [101, 0.11, 1],
};

export const exampleDataTen4Objectives: ObjectiveData = {
  names: ["Price", "Quality", "Time", "Efficiency"],
  directions: [1, -1, 1, -1],
  ideal: [25, 0.95, -871, 10],
  nadir: [101, 0.11, 801, 0],
  values: [
    {
      selected: true,
      value: [50, 0.2, -500, 1],
    },
    {
      selected: false,
      value: [28, 0.9, -300, 2],
    },
    {
      selected: false,
      value: [90, 0.13, -800, 3],
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

export const exampleDataSingleObjectiveNavigation: NavigationDataSingleObjective =
  {
    objectiveName: "Test",
    objectiveID: 1,
    ideal: 0,
    nadir: 10,
    minimize: 1,
    upperReachables: [10, 9, 8, 7, 6, 6],
    lowerReachables: [0, 1, 1, 2, 3, 4],
    referencePoints: [1, 2, 3, 4, 5, 6],
    bounds: [1, 1, 1, 1, 1, 1],
    totalSteps: 10,
    stepsTaken: 6,
  };
