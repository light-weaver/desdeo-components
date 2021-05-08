import React, { ComponentProps, useState, useEffect } from "react";
import { Story } from "@storybook/react";
import ParallelAxes from "../components/ParallelAxes";
import { exampleDataTen4Objectives } from "../data/ExampleData";

export default {
  title: "ParallelAxis",
  component: ParallelAxes,
};

const Template: Story<ComponentProps<typeof ParallelAxes>> = (args) => {
  return (
    <div>
      <div style={{ width: "800px" }}>
        <ParallelAxes {...args} />
      </div>
    </div>
  );
};

export const FourObjectives = Template.bind({});
FourObjectives.args = {
  objectiveData: exampleDataTen4Objectives,
  selectedIndices: [0, 1],
  handleSelection: (x: number[]) => console.log(x),
};
