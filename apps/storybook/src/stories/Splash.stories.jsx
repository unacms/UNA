import React from 'react';
import AnimatedBackground from 'app/ui/atoms/animated-background.web';

export default {
  title: 'UI/Atoms/AnimatedBackground',
  component: AnimatedBackground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Animated background component that transitions between different backgrounds based on route and theme.',
      },
    },
  },
};

// Default story
export const Default = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default animated background component.',
      },
    },
  },
};

// With different theme
export const DarkTheme = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Animated background in dark theme.',
      },
    },
  },
};

// With custom background
export const CustomBackground = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Animated background with custom background configuration.',
      },
    },
  },
};
