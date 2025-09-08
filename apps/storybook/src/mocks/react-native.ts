// Import React for createElement
import React from 'react';

// Mock react-native for Storybook
export const Platform = {
  OS: 'web' as const,
  select: (obj: Record<string, unknown>) => obj.web || obj.default,
  Version: 0,
};

export const Dimensions = {
  get: () => ({
    width: 375,
    height: 812,
    scale: 2,
    fontScale: 1,
  }),
  addEventListener: () => ({
    remove: () => {},
  }),
};

// Mock Text component for web
export const Text = ({ children, className, style, ...props }: { children?: React.ReactNode; className?: string; style?: Record<string, unknown>; [key: string]: unknown }) => {
  return React.createElement('span', {
    className,
    style,
    ...props
  }, children);
};

// Mock TouchableOpacity and other components that might be imported
export const TouchableOpacity = ({ children, onPress, style, ...props }: { children?: React.ReactNode; onPress?: () => void; style?: Record<string, unknown>; [key: string]: unknown }) => {
  return React.createElement('div', {
    onClick: onPress,
    style,
    ...props
  }, children);
};

export const View = ({ children, style, ...props }: { children?: React.ReactNode; style?: Record<string, unknown>; [key: string]: unknown }) => {
  return React.createElement('div', {
    style,
    ...props
  }, children);
};

// Mock other commonly imported modules
export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
};

export const Alert = {
  alert: (title: string, message?: string) => {
    console.log(`Alert: ${title}`, message);
  },
};
