import React from 'react';
import { Text, H1, H2, H3 } from 'app/design/typography';

export default {
  title: 'Design/Typography',
  component: Text,
  parameters: {
    docs: {
      description: {
        component: 'Typography components from the design system.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      defaultValue: 'Sample text',
    },
    className: {
      control: 'text',
      defaultValue: '',
    },
  },
};

// Basic Text component
export const Default = {
  args: {
    children: 'This is a default Text component',
    className: 'text-gray-900',
  },
};

// Heading components
export const Heading1 = {
  render: (args) => <H1 {...args} />,
  args: {
    children: 'Heading 1 (H1)',
    className: 'text-gray-900 mb-4',
  },
};

export const Heading2 = {
  render: (args) => <H2 {...args} />,
  args: {
    children: 'Heading 2 (H2)',
    className: 'text-gray-800 mb-3',
  },
};

export const Heading3 = {
  render: (args) => <H3 {...args} />,
  args: {
    children: 'Heading 3 (H3)',
    className: 'text-gray-700 mb-2',
  },
};

// Text with different styles
export const StyledText = {
  args: {
    children: 'This text has custom styling',
    className: 'text-blue-600 font-bold text-lg',
  },
};

export const MutedText = {
  args: {
    children: 'This is muted text',
    className: 'text-gray-500 text-sm',
  },
};
