import React, { useEffect, useState, useCallback, useRef } from "react";

import "d3-transition";
import "./Svg.css";
import {
  NavigationDataSingleObjective,
  NavigationData,
} from "../types/ProblemTypes";
import NavigationBar from "./NavigationBar";
import { RectDimensions } from "../types/ComponentTypes";

interface NavigationWindowProps {
  objectiveData: NavigationData;
  handleReferenceValue:
    | React.Dispatch<React.SetStateAction<[number, number]>>
    | ((x: [number, number]) => void);
  handleBoundValue:
    | React.Dispatch<React.SetStateAction<[number, number]>>
    | ((x: [number, number]) => void);

  handleStep:
    | React.Dispatch<React.SetStateAction<number>>
    | ((x: number) => void);
  dimensionsMaybe?: RectDimensions;
}

export const NavigationWindow = ({
  objectiveData,
  handleReferenceValue,
  handleBoundValue,
  handleStep,
  dimensionsMaybe,
}: NavigationWindowProps) => {
  var singleObjectiveDataArray: NavigationDataSingleObjective[] = [];
  const [newStep, handleNewStep] = useState<number>();

  const numObj = objectiveData.objectiveNames.length;

  for (let i = 0; i < numObj; i++) {
    singleObjectiveDataArray.push({
      objectiveName: objectiveData.objectiveNames[i],
      objectiveID: i,
      ideal: objectiveData.ideal[i],
      nadir: objectiveData.nadir[i],
      minimize: objectiveData.minimize[i],
      upperReachables: objectiveData.upperBounds[i],
      lowerReachables: objectiveData.lowerBounds[i],
      referencePoints: objectiveData.referencePoints[i],
      bounds: objectiveData.boundaries[i],
      totalSteps: objectiveData.totalSteps,
      stepsTaken: objectiveData.stepsTaken,
    });
  }
  return (
    <div className="navigation-window">
      {singleObjectiveDataArray.map((data) => {
        return (
          <NavigationBar
            objectiveData={data}
            handleReferenceValue={handleReferenceValue}
            handleBoundValue={handleBoundValue}
            newStep={newStep}
            handleNewStep={(x: number) => {
              handleNewStep(x);
              handleStep(x);
            }}
            dimensionsMaybe={dimensionsMaybe}
          ></NavigationBar>
        );
      })}
    </div>
  );
};

export default NavigationWindow;
