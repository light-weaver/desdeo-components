import React, { ComponentProps, useState } from "react";
import { Story } from "@storybook/react";
import HorizontalBars from "../components/HorizontalBars";
import {
  exampleDataSingle5Objectives,
  exampleDataSingle3Objectives,
} from "../data/ExampleData";

export default {
  title: "HorizontalBars",
  component: HorizontalBars,
};

const Template: Story<ComponentProps<typeof HorizontalBars>> = (args) => {
  const [ref, setRef] = useState(args.referencePoint);
  args.setReferencePoint = setRef;
  args.referencePoint = ref;
  args.currentPoint = ref;

  return (
    <div>
      <div style={{ width: "800px" }}>
        <HorizontalBars {...args} />
      </div>
      <div style={{ width: "800px" }}>
        <HorizontalBars {...args} />
      </div>
      <ul>
        {ref.map((v, i) => (
          <li>{`Item ${i + 1}. = ${v}`}</li>
        ))}
      </ul>
    </div>
  );
};

export const FiveObjectives = Template.bind({});
FiveObjectives.args = {
  objectiveData: exampleDataSingle5Objectives,
  referencePoint: exampleDataSingle5Objectives.values[0].value,
};

export const FiveObjectivesSmall = Template.bind({});
FiveObjectivesSmall.args = {
  objectiveData: exampleDataSingle5Objectives,
  referencePoint: exampleDataSingle5Objectives.values[0].value,
};

export const ThreeObjectives = Template.bind({});
ThreeObjectives.args = {
  objectiveData: exampleDataSingle3Objectives,
  referencePoint: exampleDataSingle3Objectives.values[0].value,
};
