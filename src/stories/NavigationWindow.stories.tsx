import React, { ComponentProps, useState, useEffect } from "react";
import { Story } from "@storybook/react";
import NavigationWindow from "../components/NavigationWindow";
import { exampleProblemData3ObjectiveData } from "../data/ExampleData";

import "bootstrap/dist/css/bootstrap.min.css";

export default {
  title: "NavigationWindow",
  component: NavigationWindow,
};

const Template: Story<ComponentProps<typeof NavigationWindow>> = (args) => {
  return (
    <div>
      <div style={{ width: "800px" }}>
        <NavigationWindow {...args} />
      </div>
    </div>
  );
};

export const NavigationSingleObjective = Template.bind({});
NavigationSingleObjective.args = {
  objectiveData: exampleProblemData3ObjectiveData,
  handleReferenceValue: (x: [number, number]) => console.log(x),
  handleBoundValue: (x: [number, number]) => console.log(x),
  handleStep: (x: number) => console.log(x),
};
