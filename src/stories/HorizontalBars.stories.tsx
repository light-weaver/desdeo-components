import React, { ComponentProps } from "react";
import { Story } from "@storybook/react";
import HorizontalBars from "../components/HorizontalBars";

export default {
  title: "HorizontalBars",
  component: HorizontalBars,
};

const Template: Story<ComponentProps<typeof HorizontalBars>> = (args) => (
  <HorizontalBars />
);

export const ThreeObjectives = Template.bind({});
ThreeObjectives.args = {};
