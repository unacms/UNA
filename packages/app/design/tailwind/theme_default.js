const colors = {
  neutral: {
    DEFAULT: 'rgba(75,85,99,1)',
    d: 'rgba(156,163,175,1)',
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
    DEFAULT: 'rgba(206,58,52,1)',
    d: 'rgba(226,85,79,1)',
    50: 'rgba(253,243,243,1)',
    100: 'rgba(252,229,228,1)',
    200: 'rgba(250,208,206,1)',
    300: 'rgba(246,174,171,1)',
    400: 'rgba(238,128,123,1)',
    500: 'rgba(226,85,79,1)',
    600: 'rgba(206,58,52,1)',
    700: 'rgba(173,45,40,1)',
    800: 'rgba(144,40,36,1)',
    900: 'rgba(120,39,36,1)',
    950: 'rgba(65,16,14,1)',
  },

  accent: {
    DEFAULT: 'rgba(246 208 25,1)',
    d: 'rgba(249,115,22,1)',
  },

  bgrbody: {
    DEFAULT: 'rgb(243,244,246)',
    d: 'rgb(0,0,0)',
  },

  bgrcard: {
    DEFAULT: 'rgba(255,255,255,1)',
    h: 'rgba(249,250,251,1)',
    d: 'rgba(17,24,39,1)',
    dh: 'rgba(31,41,55,1)',
  },
  bdrcard: {
    DEFAULT: 'rgba(229,231,235,1)',
    h: 'rgba(209,213,219,1)',
    d: 'rgba(31,41,55,1)',
    dh: 'rgba(55,65,81,1)',
  },

  bgrinput: {
    DEFAULT: 'rgba(209,213,219,0.5)',
    f: 'rgba(255,255,255,1)',
    d: 'rgba(55,65,81,0.5)',
    df: 'rgba(17,24,39,1)',
  },
  bdrinput: {
    DEFAULT: 'rgba(209,213,219,1)',
    f: 'rgba(2,132,199,1)',
    d: 'rgba(17,24,39,1)',
    df: 'rgba(14,165,233,1)',
  },

  bgrmodal: {
    DEFAULT: 'rgba(255,255,255,0.9)',
    d: 'rgba(17,24,39,0.9)',
  },
  bdrmodal: {
    DEFAULT: 'rgba(229,231,235,0.8)',
    d: 'rgba(31,41,55,0.6)',
  },

  bgrnavbar: {
    DEFAULT: 'rgba(255,255,255,0.8)',
    d: 'rgba(17,24,39,0.8)',
  },
  bdrnavbar: {
    DEFAULT: 'rgba(229,231,235,0.8)',
    d: 'rgba(31,41,55,0.8)',
  },

  bgrtabbar: {
    DEFAULT: 'rgba(255,255,255,1)',
    d: 'rgba(17,24,39,1)',
  },

  bdrtabbar: {
    DEFAULT: 'rgba(229,231,235,0.8)',
    d: 'rgba(31,41,55,0.6)',
  },

  bgritem: {
    DEFAULT: 'rgba(229,231,235,0.9)',
    d: 'rgba(31,41,55,0.9)',
  },
  bdritem: {
    DEFAULT: 'rgba(229,231,235,1)',
    d: 'rgba(31,41,55,1)',
  },

  bgrbutton: {
    DEFAULT: 'rgba(209,213,219,0.6)',
    h: 'rgba(209,213,219,0.2)',
    d: 'rgba(107,114,128,0.5)',
    dh: 'rgba(107,114,128,0.2)',
  },
  bdrbutton: {
    DEFAULT: 'rgba(229,231,235,1)',
    h: 'rgba(209,213,219,1)',
    d: 'rgba(31,41,55,1)',
    dh: 'rgba(55,65,81,1)',
  },

  bdr: {
    DEFAULT: 'rgba(229,231,235,1)',
    d: 'rgba(31,41,55,1)',
  },

  screen: {
    DEFAULT: '#f3f4f6',
    d: '#030712',
  },
  bgritem: {
    DEFAULT: 'rgba(226, 232, 240, 0.8)',
    d: 'rgba(30, 41, 59, 0.8)',
  },
}

const theme = {
  extend: {
    colors: colors,

    aspectRatio: {
      '3/1': '3 / 1',
      '4/1': '4 / 1',
      '5/1': '5 / 1',
    },
  },
}

module.exports = {
  theme,
  colors,
}
