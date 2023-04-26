// @ts-check

/* @type {import('tailwindcss').Config['theme']} */

const colors = {
  
  primary: {
    DEFAULT: 'rgba(37,99,235,1)',
    dark: 'rgba(96,165,250,1)',
    50: 'rgba(239,246,255,1)',
    100: 'rgba(219,234,254,1)',
    200: 'rgba(191,219,254,1)',
    300: 'rgba(147,197,253,1)',
    400: 'rgba(96,165,250,1)',
    500: 'rgba(59,130,246,1)',
    600: 'rgba(37,99,235,1)',
    700: 'rgba(29,78,216,1)',
    800: 'rgba(30,64,175,1)',
    900: 'rgba(30,58,138,1)',
    950: 'rgba(23,37,84,1)',
  
  },

  accent: {
    DEFAULT: '#0284c7',
    dark: '#0ea5e9',
    50: 'rgba(255,247,237,1)',
    100: 'rgba(255,237,213,1)',
    200: 'rgba(254,215,170,1)',
    300: 'rgba(253,186,116,1)',
    400: 'rgba(251,146,60,1)',
    500: 'rgba(249,115,22,1)',
    600: 'rgba(234,88,12,1)',
    700: 'rgba(194,65,12,1)',
    800: 'rgba(154,52,18,1)',
    900: 'rgba(124,45,18,1)',
    950: 'rgba(67,20,7,1)',
  
  },

  neutral: {
    DEFAULT: 'rgba(75,85,99,1)',
    dark: 'rgba(156,163,175,1)',
    50: 'rgba(249,250,251,1)',
    100: 'rgba(243,244,246,1)',
    200: 'rgba(229,231,235,1)',
    300: 'rgba(209,213,219,1)',
    400: 'rgba(156,163,175,1)',
    500: 'rgba(107,114,128,1)',
    600: 'rgba(75,85,99,1)',
    700: 'rgba(55,65,81,1)',
    800: 'rgba(31,41,55,1)',
    900: 'rgba(17,24,39,1)',
    950: 'rgba(3,7,18,1)',
  
  },

  backgroundbody: {
    DEFAULT: 'rgba(229,231,235,1)',
    dark: 'rgba(3,7,18,1)',
  },

  backgroundbackdrop: {
    DEFAULT: 'rgba(255 255 255 / 0.5)',
    dark: 'rgba(55 55 55 / 0.5)',
  },

  backgroundlevel1: {
    DEFAULT: 'rgba(255,255,255,1)',
    dark: 'rgba(17,24,39,1)',
  },

  backgroundlevel2: {
    DEFAULT: 'rgba(243,244,246,1)',
    dark: 'rgba(31,41,55,1)',
  },

  backgroundlevel3: {
    DEFAULT: 'rgba(229,231,235,1)',
    dark: 'rgba(55,65,81,1)',
  },

  backgroundcard: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    hover: 'rgba(255,255,255,1)',
    active: 'rgba(255,255,255,0.5)',
    dark: 'rgba(17,24,39,0.9)',
    darkhover: 'rgba(17,24,39,1)',
    darkactive: 'rgba(17,24,39,0.5)',
  },
  bordercolorcard: {
    DEFAULT: 'rgba(229,231,235,1)',
    
    hover: 'rgba(209,213,219,1)',
    active: 'rgba(229,231,235,1)',
    dark: 'rgba(3,7,18,1)',
    darkhover: 'rgba(31,41,55,1)', 
    darkactive: 'rgba(3,7,18,1)',
  },

  backgroundnavbar: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    dark: 'rgba(17,24,39,0.9)',
  },
  bordercolornavbar: {
    DEFAULT: 'rgba(229,231,235,1)',
    dark: 'rgba(3,7,18,1)',
  },

  backgrounditem: {
    DEFAULT: 'rgba(209,213,219,0.5)',
    dark: 'rgba(55,65,81,0.5)',
  },
  bordercoloritem: {
    DEFAULT: 'rgba(209,213,219,1)',
    dark: 'rgba(55,65,81,1)',
  },

  backgroundbutton: {
    DEFAULT: 'rgba(209,213,219,0.8)',
    hover: 'rgba(209,213,219,0.5)',
    dark: 'rgba(55,65,81,0.5)',
    darkhover: 'rgba(55,65,81,0.8)',
  },
  bordercolorbutton: {
    DEFAULT: 'rgba(209,213,219,1)',
    dark: 'rgba(55,65,81,1)',
  },


  bordercolor: {
    DEFAULT: 'rgba(243,244,246,1)',
    dark: 'rgba(31,41,55,1)',
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