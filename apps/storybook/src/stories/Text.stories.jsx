import { Text, H1, H1C, H2, H3, H4, H5, H6 } from "app/design/typography";

export default {
  title: "Design/Typography",
  component: Text,
  argTypes: {
    children: {
      control: "text",
      defaultValue: "Hello World",
    },
    className: {
      control: "text",
      defaultValue: "",
    },
    fontFamily: {
      control: "text",
      defaultValue: "",
    },
  },
};

// Generic Text
export const Default = (args) => <Text {...args} />;
Default.args = {
  children: "This is a default Text component",
};

// Headings
export const Heading1 = (args) => <H1 {...args} />;
Heading1.args = {
  className: "text-gray-900",
  children: "Heading 1 (H1)",
};

export const Heading1C = (args) => <H1C {...args} />;
Heading1C.args = {
  className: "text-gray-800",
  children: "Heading 1 Compact (H1C)",
};

export const Heading2 = (args) => <H2 {...args} />;
Heading2.args = {  
  className: "text-gray-700",
  children: "Heading 2 (H2)",
};

export const Heading3 = (args) => <H3 {...args} />;
Heading3.args = {
  className: "text-gray-600",
  children: "Heading 3 (H3)",
};

export const Heading4 = (args) => <H4 {...args} />;
Heading4.args = {
  className: "text-gray-500",
  children: "Heading 4 (H4)",
};

export const Heading5 = (args) => <H5 {...args} />;
Heading5.args = {
  className: "text-gray-400",
  children: "Heading 5 (H5)",
};

export const Heading6 = (args) => <H6 {...args} />;
Heading6.args = {
  className: "text-gray-300",
  children: "Heading 6 (H6)",
};
