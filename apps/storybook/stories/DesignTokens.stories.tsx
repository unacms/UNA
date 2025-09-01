import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

// Design token demonstration component
const DesignTokenDemo = ({
  backgroundColor,
  textColor,
  borderColor,
  spacing,
  borderRadius
}: {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  spacing: string;
  borderRadius: string;
}) => (
  <div
    style={{
      backgroundColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      padding: spacing,
      borderRadius,
      fontSize: '16px',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <h3 style={{ margin: '0 0 8px 0' }}>Design Token Demo</h3>
    <p style={{ margin: '0' }}>
      This demonstrates semantic design tokens that can be used across the application.
    </p>
  </div>
);

const meta = {
  title: 'Design System/Tokens',
  component: DesignTokenDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    backgroundColor: {
      control: 'color',
      description: 'Background color token (e.g., bg-card, bg-background)'
    },
    textColor: {
      control: 'color',
      description: 'Text color token (e.g., text-foreground, text-muted-foreground)'
    },
    borderColor: {
      control: 'color',
      description: 'Border color token (e.g., border-border, border-input)'
    },
    spacing: {
      control: 'select',
      options: ['4px', '8px', '12px', '16px', '20px', '24px'],
      description: 'Spacing token for padding'
    },
    borderRadius: {
      control: 'select',
      options: ['0px', '4px', '6px', '8px', '12px', '16px'],
      description: 'Border radius token (e.g., rounded-sm, rounded-md, rounded-lg)'
    },
  },
} satisfies Meta<typeof DesignTokenDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
  args: {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#e5e7eb',
    spacing: '16px',
    borderRadius: '8px',
  },
};

export const MutedCard: Story = {
  args: {
    backgroundColor: '#f9fafb',
    textColor: '#6b7280',
    borderColor: '#d1d5db',
    spacing: '12px',
    borderRadius: '6px',
  },
};

export const PrimaryButton: Story = {
  args: {
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderColor: '#3b82f6',
    spacing: '8px 16px',
    borderRadius: '6px',
  },
};
