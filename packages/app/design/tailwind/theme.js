// @ts-check

/* @type {import('tailwindcss').Config['theme']} */

const colors = {
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
  primary: {
    DEFAULT: 'rgba(2,132,199,1)',
    dark: 'rgba(14,165,233,1)',
    50: 'rgba(240,249,255,1)',
    100: 'rgba(224,242,254,1)',
    200: 'rgba(186,230,253,1)',
    300: 'rgba(125,211,252,1)',
    400: 'rgba(56,189,248,1)',
    500: 'rgba(14,165,233,1)',
    600: 'rgba(2,132,199,1)',
    700: 'rgba(3,105,161,1)',
    800: 'rgba(7,89,133,1)',
    900: 'rgba(12,74,110,1)',
    950: 'rgba(8,47,73,1)',
  
  },

  accent: {
    DEFAULT: 'rgba(249,115,22,1)',
    dark: 'rgba(249,115,22,1)',
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



  backgroundbody: {
    DEFAULT: 'rgba(229,231,235,1)',
    dark: 'rgba(3,7,18,1)',
  },

  backgroundbackdrop: {
    DEFAULT: 'rgba(255 255 255 / 0.5)',
    dark: 'rgba(55 55 55 / 0.5)',
  },



  backgroundcard: {
    DEFAULT: 'rgba(255,255,255,1)',
    hover: 'rgba(255,255,255,0.8)',
    active: 'rgba(255,255,255,0.6)',
    dark: 'rgba(17,24,39,1)',
    darkhover: 'rgba(17,24,39,0.8)',
    darkactive: 'rgba(17,24,39,0.6)'
  },
  bordercolorcard: {
    DEFAULT: 'rgba(229,231,235,0.8)',
    hover: 'rgba(229,231,235,1)',
    active: 'rgba(229,231,235,0.5)',
    dark: 'rgba(17,24,39,1)',
    darkhover: 'rgba(17,24,39,1)',
    darkactive: 'rgba(17,24,39,0.5)'
  },

  backgroundinput: {
    DEFAULT: 'rgba(209,213,219,0.5)',
    focus: 'rgba(255,255,255,1)',
    dark: 'rgba(55,65,81,0.5)',
    darkafocus: 'rgba(17,24,39,1)',
  },
  bordercolorinput: {
    DEFAULT: 'rgba(209,213,219,1)',
    focus: 'rgba(2,132,199,1)',
    dark: 'rgba(17,24,39,1)',
    darkfocus: 'rgba(14,165,233,1)',
  },

  backgroundcell: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    dark: 'rgba(17,24,39,0.9)',
  },
  bordercolorcell: {
    DEFAULT: 'rgba(209,213,219,1)',
    dark: 'rgba(17,24,39,1)',
  },

  backgroundmodal: {
    DEFAULT: 'rgba(255,255,255,0.8)',
    dark: 'rgba(31,41,55,0.8)',
  },
  bordercolormodal: {
    DEFAULT: 'rgba(209,213,219,0.8)',
    dark: 'rgba(55,65,81,1)',
  },

  backgroundnavbar: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    dark: 'rgba(17,24,39,0.9)',

  },
  bordercolornavbar: {
    DEFAULT: 'rgba(229,231,235,1)',
    dark: 'rgba(3,7,18,1)',
  },

  backgroundtabbar: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    dark: 'rgba(17,24,39,0.9)',
  },

  bordercolortabbar: {
    DEFAULT: 'rgba(rgba(229,231,235,0.8)',
    dark: 'rgba(31,41,55,0.8)',
  },

  backgrounditem: {
    DEFAULT: 'rgba(209,213,219,0.8)',
    dark: 'rgba(55,65,81,0.8)',
  },
  bordercoloritem: {
    DEFAULT: 'rgba(209,213,219,1)',
    dark: 'rgba(55,65,81,1)',
  },

  backgroundbutton: {
    DEFAULT: 'rgba(209,213,219,0.6)',
    hover: 'rgba(209,213,219,0.2)',
    dark: 'rgba(107,114,128,0.5)',
    darkhover: 'rgba(107,114,128,0.2)',
    
  },
  bordercolorbutton: {
    DEFAULT: 'rgba(107,114,128,0.2)',
    dark: 'rgba(107,114,128,0.2)',
  },


  bordercolor: {
    DEFAULT: 'rgba(209,213,219,0.5)',
    dark: 'rgba(55,65,81,0.5)',
    
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