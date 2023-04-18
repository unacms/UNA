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

    
  
  screen: {
    DEFAULT: '#f3f4f6',
    dark: '#030712',
  },
  navbar: {
    DEFAULT: '#FFFFFF',
    dark: '#111827',
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
    hover: '#f9fafb',
    darkhover: '#1f2937',
    active: '#f3f4f6',
    darkactive: '#030712',
    border: 'rgba(209, 213, 219, 0.5)',
    borderhover: 'rgba(209, 213, 219, 1)',
    darkborder: 'rgba(55, 65, 81, 0.3)',
    darkborderhover: 'rgba(55, 65, 81, 1)',
  },

  neoitem: {
    DEFAULT: 'rgba(226, 232, 240, 0.8)',
    dark: 'rgba(30, 41, 59, 0.8)',
  },
  neobutton: {
    DEFAULT: '#6B7280',
    dark: '#6B7280',
  },
  neoborder: {
    DEFAULT: 'rgba(209, 213, 219, 0.5)',
    dark: 'rgba(55, 65, 81, 0.3)',
  },
  
  neolink: {
    DEFAULT: '#3B82F6',
    dark: '#3B82F6',
  },
  neoinput: {
    DEFAULT: 'rgba(241, 245, 249, 0.5)',
    dark: 'rgba(30, 41, 59, 0.5)',
     
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
