// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

const colors = {
  brand: {
    DEFAULT: '#3B82F6',
    dark: '#3B82F6',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  primary: {
    DEFAULT: '#3B82F6',
    dark: '#3B82F6',
  
  },
  secondary: {
    DEFAULT: '#0489c5',
    dark: '#11aae6',
        50: '#f0f9ff',
        100: '#e0f3fe',
        200: '#bbe8fc',
        300: '#7ed6fb',
        400: '#3ac2f6',
        500: '#11aae6',
        600: '#0489c5',
        700: '#056d9f',
        800: '#085d84',
        900: '#0b405b',
    
    
  },
  screen: {
    DEFAULT: '#F3F4F6',
    dark: '#030407',
  },
  navbar: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
  },
  'item-hover': {
    DEFAULT: '#dbe1e6',
    dark: '#252a32',
  },
  sidebar: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
  },
  tabbar: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
  },
  block: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
  },
  neocard: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
    hover: '#F3F4F6',
    darkhover: '#1F2937',
  },
  neoitem: {
    DEFAULT: '#E5E7EB',
    dark: '#1F2937',
  },
  neobutton: {
    DEFAULT: '#6B7280',
    dark: '#6B7280',
  },
  neoborder: {
    DEFAULT: '#9CA3AF',
    dark: '#374151',
  },
  neolink: {
    DEFAULT: '#3B82F6',
    dark: '#3B82F6',
  },
  neoinput: {
    DEFAULT: '#D1D5DB',
    dark: '#374151',
     
  },
  neogray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
}

const theme = {
  extend: {
    colors: colors,

    aspectRatio: {
      '3/1': '3 / 1',
    },
  },
}

module.exports = {
  theme,
  colors,
}
