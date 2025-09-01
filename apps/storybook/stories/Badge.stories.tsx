import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

// Mock Badge component for demonstration
interface BadgeData {
  text?: string;
  icon?: string;
  color?: string;
  is_icon_only?: boolean;
}

interface BadgeProps {
  data: BadgeData;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

const MockBadge: React.FC<BadgeProps> = ({ data, variant = 'default', size = 'sm', rounded = false }) => {
  const sizeStyles = {
    xs: { padding: '2px 6px', fontSize: '10px', iconSize: 10 },
    sm: { padding: '4px 8px', fontSize: '12px', iconSize: 12 },
    md: { padding: '6px 12px', fontSize: '14px', iconSize: 14 },
    lg: { padding: '8px 16px', fontSize: '16px', iconSize: 16 },
  };

  const colorStyles = {
    green: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    blue: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
    yellow: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    purple: { bg: '#ede9fe', text: '#581c87', border: '#d8b4fe' },
    red: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  };

  const currentSize = sizeStyles[size];
  const currentColor = colorStyles[data.color as keyof typeof colorStyles] || colorStyles.green;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: '500',
        backgroundColor: currentColor.bg,
        color: currentColor.text,
        border: `1px solid ${currentColor.border}`,
        borderRadius: rounded ? '9999px' : '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {data.icon && (
        <span style={{ fontSize: currentSize.iconSize }}>
          {data.icon === 'check' ? '✓' :
           data.icon === 'BadgeCheck' ? '✓' :
           data.icon === 'star' ? '⭐' :
           data.icon === 'crown' ? '👑' :
           data.icon}
        </span>
      )}
      {data.text && !data.is_icon_only && data.text}
    </span>
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'UI/Molecules/Badge',
  component: MockBadge,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      description: {
        component: 'A badge component that displays status, labels, or notifications with optional icons.',
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'success', 'warning', 'error'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg'],
    },
    rounded: { control: 'boolean' },
    data: { control: 'object' },
  },
} satisfies Meta<typeof MockBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    data: {
      text: 'Badge',
      icon: 'Check',
      color: 'green',
    },
    size: 'sm',
  },
};

export const WithIcon: Story = {
  args: {
    data: {
      text: 'Verified',
      icon: 'BadgeCheck',
      color: 'blue',
    },
    size: 'md',
  },
};

export const IconOnly: Story = {
  args: {
    data: {
      icon: 'Star',
      color: 'yellow',
      is_icon_only: true,
    },
    size: 'lg',
  },
};

export const Rounded: Story = {
  args: {
    data: {
      text: 'Premium',
      icon: 'Crown',
      color: 'purple',
    },
    size: 'sm',
    rounded: true,
  },
};
