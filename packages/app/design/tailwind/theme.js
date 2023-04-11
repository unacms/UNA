// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

const colors = {
  
  primary: {
    DEFAULT: '#0284c7',
    dark: '#0ea5e9',
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  
  },
  secondary: {
    DEFAULT: '#0d9488',
    dark: '#14b8a6',
        50: '#f0f9ff',
        100: '#e0f3fe',
        200: '#bbe8fc',
        300: '#7ed6fb',
        400: '#3ac2f6',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
        950: '#042f2e',
    
    
  },
  accent: {
    DEFAULT: '#ea580c',
    dark: '#f97316',
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
        950: '#431407',
    
    
  },
  screen: {
    DEFAULT: '#E5E7EB',
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
    dark: '#0f172a',
    hover: '#f8fafc',
    darkhover: '#1e293b',
    active: '#f1f5f9',
    darkactive: '#020617',
  },
  neoitem: {
    DEFAULT: '#F3F4F6',
    dark: '#1F2937',
  },
  neobutton: {
    DEFAULT: '#6B7280',
    dark: '#6B7280',
  },
  neoborder: {
    DEFAULT: '#e2e8f0',
    dark: '#1e293b',
  },
  neolink: {
    DEFAULT: '#3B82F6',
    dark: '#3B82F6',
  },
  neoinput: {
    DEFAULT: '#F9FAFB',
    dark: '#030712',
     
  },
  neogray: {
    DEFAULT: '#475569',
    dark: '#64748b',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
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
