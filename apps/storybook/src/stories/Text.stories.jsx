import { Text, H1, H1C, H2, H3, H4, H5, H6 } from "app/design/typography";
// Removed play tests temporarily to avoid interactions addon incompatibility
import { useEffect } from "react";

export default {
  title: "Design/Typography",
  component: Text,
  tags: ['autodocs'],
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
  parameters: {
    a11y: { disable: false },
    viewport: { defaultViewport: 'responsive' },
  }
};

// Generic Text
export const Default = (args) => <Text {...args} />;
Default.args = {
  children: "This is a default Text component",
};

// Override via className (should take precedence over fallback styles)
export const WithClassName = (args) => <Text {...args} />;
WithClassName.args = {
  children: "Custom className should override fallback styles",
  className: "text-blue-600",
};

// Google Fonts selector for custom font testing
const GOOGLE_FONTS = [
  { label: "Inter", familyParam: "Inter:wght@100;300;400;500;600;700;900", cssFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  { label: "Roboto", familyParam: "Roboto:wght@100;300;400;500;700;900", cssFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" },
  { label: "Poppins", familyParam: "Poppins:wght@200;400;600;700", cssFamily: "Poppins, ui-sans-serif, system-ui, sans-serif" },
  { label: "Merriweather", familyParam: "Merriweather:ital,wght@0,300;0,700;1,300;1,700", cssFamily: "Merriweather, ui-serif, Georgia, serif" },
];

export const CustomFont = ({ googleFont = "Inter", ...args }) => {
  const selected = GOOGLE_FONTS.find(f => f.label === googleFont);
  const href = selected ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(selected.familyParam)}&display=swap` : '';
  useEffect(() => {
    if (!href) return;
    const id = "sb-google-font";
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [href]);

  return (
    <div style={{ fontFamily: selected?.cssFamily }}>
      <Text {...args} />
    </div>
  );
};
CustomFont.args = {
  children: "Custom font applied from Google Fonts selector",
};
CustomFont.argTypes = {
  googleFont: { control: "select", options: GOOGLE_FONTS.map(f => f.label) },
};

// Long text wrapping within constrained width
export const LongText = (args) => (
  <div className="max-w-xs">
    <Text {...args} />
  </div>
);
LongText.args = {
  children:
    "Very long text to validate wrapping and layout behavior across viewports. This should wrap within the container width and remain readable.",
};

// Truncated single-line text
export const Truncated = (args) => (
  <div className="w-[50vw]">
    <Text {...args} />
  </div>
);
Truncated.args = {
  children:
    "This is a very long single-line text that should be truncated with an ellipsis when it exceeds the container width.",
  className: "block truncate",
};

// Headings
export const Heading1 = (args) => <H1 {...args} />;
Heading1.args = {
  children: "Heading 1 (H1)",
};

export const Heading1C = (args) => <H1C {...args} />;
Heading1C.args = {
  
  children: "Heading 1 Compact (H1C)",
};

export const Heading2 = (args) => <H2 {...args} />;
Heading2.args = {  

  children: "Heading 2 (H2)",
};

export const Heading3 = (args) => <H3 {...args} />;
Heading3.args = {

  children: "Heading 3 (H3)",
};

export const Heading4 = (args) => <H4 {...args} />;
Heading4.args = {

  children: "Heading 4 (H4)",
};

export const Heading5 = (args) => <H5 {...args} />;
Heading5.args = {
  children: "Heading 5 (H5)",
};

export const Heading6 = (args) => <H6 {...args} />;
Heading6.args = {
  children: "Heading 6 (H6)",
};

// RTL rendering
export const RTL = (args) => (
  <div dir="rtl">
    <Text {...args} />
  </div>
);
RTL.args = {
  children: "نص واجهة المستخدم (RTL)",
};

// Dark mode rendering (applies semantic tokens via data-theme)
export const DarkMode = (args) => (
  <div data-theme="dark" className="min-h-screen bg-background p-4">
    <Text {...args} />
  </div>
);
DarkMode.args = {
  children: "Text in dark mode should use semantic foreground color",
};
