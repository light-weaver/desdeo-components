import React, { ComponentProps, useState, useEffect } from "react";
import { Story } from "@storybook/react";
import NavigationBar from "../components/NavigationBar";
import { exampleDataSingleObjectiveNavigation } from "../data/ExampleData";

import "bootstrap/dist/css/bootstrap.min.css";

export default {
  title: "NavigationBar",
  component: NavigationBar,
};

const Template: Story<ComponentProps<typeof NavigationBar>> = (args) => {
  return (
    <div>
      <div style={{ width: "800px" }}>
        <NavigationBar {...args} />
      </div>
    </div>
  );
};

export const NavigationSingleObjective = Template.bind({});
NavigationSingleObjective.args = {
  objectiveData: exampleDataSingleObjectiveNavigation,
  handleReferenceValue: (x: [number]) => console.log(x),
  handleBoundValue: (x: [number]) => console.log(x),
  newStep: exampleDataSingleObjectiveNavigation.stepsTaken,
  handleNewStep: (x: [number]) => console.log(x),
};
