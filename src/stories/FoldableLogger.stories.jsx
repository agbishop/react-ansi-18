import React from "react";
import FoldableLogger from "../index.js";
import testdata from "./data.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Logger/FoldableLogger",
  component: FoldableLogger,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => (
  <div style={{ height: `500px`, width: `100%`, overflow: "auto" }}>
    <FoldableLogger {...args} />
  </div>
);

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
  log: testdata.data,
  linkify: false,
  autoScroll: false,
  showHeader: false,
};
