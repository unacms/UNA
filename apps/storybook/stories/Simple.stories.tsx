import type { Meta, StoryObj } from '@storybook/react-vite';

import React from 'react';

// Simple test component
const SimpleComponent = ({ text, color }: { text: string; color: string }) => (
  <div style={{ color, fontSize: '24px', padding: '20px' }}>
    {text}
  </div>
);

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Test/Simple',
  component: SimpleComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    text: { control: 'text' },
    color: { control: 'color' },
  },
} satisfies Meta<typeof SimpleComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: 'Hello World!',
    color: '#000000',
  },
};

export const Red: Story = {
  args: {
    text: 'Red Text',
    color: '#ff0000',
  },
};
