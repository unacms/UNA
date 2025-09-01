import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

// Import Lucide icons for web (same as the app uses)
import {
  User, Heart, Star, Check, Search, House, Settings, Menu, X, ArrowRight,
  Bell, Calendar, MessageSquare, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Eye, EyeOff, Pencil, Trash2, Share2, Bookmark, ThumbsUp, Camera, File, Image,
  MapPin, Globe, Send, Mail, Phone, Clock, Award, Badge, BadgeCheck, Crown
} from 'lucide-react';

// Icon mapping that matches the app's IconSet (string keys to components)
const iconMap: Record<string, React.ComponentType<any>> = {
  User, Heart, Star, Check, Search, House, Settings, Menu, X, ArrowRight,
  Bell, Calendar, MessageSquare, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Eye, EyeOff, Pencil, Trash: Trash2, Share2, Bookmark, ThumbsUp, Camera, File, Image,
  MapPin, Globe, Send, Mail, Phone, Clock, Award, Badge, BadgeCheck, Crown
};

interface IconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

const MockIcon: React.FC<IconProps> = ({ icon, color = '#000000', size = 24, className = '' }) => {
  // Get the actual Lucide icon component
  const IconComponent = iconMap[icon as keyof typeof iconMap];

  if (!IconComponent) {
    // Fallback for unknown icons
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: `${size * 0.6}px`,
        }}
        className={className}
      >
        ?
      </div>
    );
  }

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      style={{ display: 'inline-flex' }}
    />
  );
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'UI/Atoms/Icon',
  component: MockIcon,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      description: {
        component: 'An icon component that displays various icons with customizable color and size.',
      },
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    icon: {
      control: 'select',
      options: ['User', 'Heart', 'Star', 'Check', 'Search', 'House', 'Settings', 'Menu', 'X', 'ArrowRight', 'Bell', 'Calendar', 'MessageSquare', 'Plus', 'ChevronDown', 'ChevronUp', 'Eye', 'EyeOff', 'Pencil', 'Trash', 'Share2', 'Bookmark', 'ThumbsUp', 'Camera', 'File', 'Image', 'MapPin', 'Globe', 'Send', 'Mail', 'Phone', 'Clock', 'Award', 'Badge', 'BadgeCheck', 'Crown'],
      description: 'Icon name from the app\'s IconSet (Lucide icons)'
    },
    color: {
      control: 'color',
      description: 'Icon color'
    },
    size: {
      control: { type: 'number', min: 12, max: 64 },
      description: 'Icon size in pixels'
    },
    className: { control: 'text' },
  },
} satisfies Meta<typeof MockIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
  args: {
    icon: 'User',
    size: 24,
  },
};

export const Colored: Story = {
  args: {
    icon: 'Heart',
    color: '#ff0000',
    size: 32,
  },
};

export const Large: Story = {
  args: {
    icon: 'Star',
    size: 48,
  },
};

export const Small: Story = {
  args: {
    icon: 'Check',
    size: 16,
  },
};

export const NavigationIcons: Story = {
  args: {
    icon: 'House',
    size: 24,
  },
};

export const ActionIcons: Story = {
  args: {
    icon: 'Plus',
    size: 24,
  },
};
