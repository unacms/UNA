// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

const colors = {
  brand: {
    DEFAULT: '#f03906',
    dark: '#ff5511',
    50: '#fff5ed',
    100: '#ffe8d4',
    200: '#ffcca8',
    300: '#ffa870',
    400: '#ff7837',
    500: '#11aae6',
    600: '#f03906',
    700: '#c72707',
    800: '#9e200e',
    900: '#7f1e0f',
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
    DEFAULT: '#f3f5f6',
    dark: '#0d0f11',
  },
  navbar: {
    DEFAULT: '#FFFFFF',
    dark: '#181b20',
  },
  'item-hover': {
    DEFAULT: '#dbe1e6',
    dark: '#252a32',
  },
  sidebar: {
    DEFAULT: '#FFFFFF',
    dark: '#181b20',
  },
  tabbar: {
    DEFAULT: '#FFFFFF',
    dark: '#181b20',
  },
  block: {
    DEFAULT: '#FFFFFF',
    dark: '#181b20',
  },
  card: {
    DEFAULT: '#FFFFFF',
    dark: '#181b20',
  },
  button: {
    DEFAULT: '#2F5E8E',
    dark: '#2F5E8E',
  },
  bordercolor: {
    DEFAULT: '#252a32',
    dark: '#607385',
  },
  neo: {
    50: '#f3f5f6',
    100: '#dbe1e6',
    200: '#bdc8d1',
    300: '#90a2b2',
    400: '#607385',
    500: '#465462',
    600: '#2f3742',
    700: '#252a32',
    800: '#181b20',
    900: '#0d0f11',
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
