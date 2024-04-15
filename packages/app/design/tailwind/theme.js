const merge = require('deepmerge');
const configCustom = require('./theme.custom.js');

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
        DEFAULT: 'rgba(59, 130, 246, 1)',
        d: 'rgba(37, 99, 235, 1)',
        50: 'rgba(239, 246, 255, 1)',
        100: 'rgba(219, 234, 254, 1)',
        200: 'rgba(191, 219, 254, 1)',
        300: 'rgba(147, 197, 253, 1)',
        400: 'rgba(96, 165, 250, 1)',
        500: 'rgba(59, 130, 246, 1)',
        600: 'rgba(37, 99, 235, 1)',
        700: 'rgba(29, 78, 216, 1)',
        800: 'rgba(30, 64, 175, 1)',
        900: 'rgba(30, 58, 138, 1)',
        950: 'rgba(23, 37, 84, 1)',
    },
    contrast: {
        DEFAULT: 'rgba(255, 0, 0, 1)',
        d: 'rgba(255, 0, 0, 1)',
    },
    linkhover: {
        DEFAULT: 'rgba(37, 99, 235, 1)',
        d: 'rgba(96, 165, 250, 1)',
    },
    linkhoverbrand: {
        DEFAULT: 'rgba(37, 99, 235, 1)',
        d: 'rgba(96, 165, 250, 1)',
    },
    linkhoverneutral: {
        DEFAULT: 'rgba(75,85,99,1)',
        d: 'rgba(209,213,219,1)',
    },
    accent: {
        DEFAULT: 'rgba(55,65,81,1)',
        d: 'rgba(249,115,22,1)',
    },

    bgrbody: {
        DEFAULT: 'rgba(243,244,246,1)',
        d: 'rgba(0,0,0,1)',
    },

    bgrbody2: {
        DEFAULT: 'rgba(243,244,246,0.9)',
        d: 'rgba(0,0,0,0.9)',
    },

    bgrcard: {
        DEFAULT: 'rgba(255,255,255,0.9)',
        h: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,0.9)',
        dh: 'rgba(17,24,39,1)',
    },
    bdrcard: {
        DEFAULT: 'rgba(0,0,0,0.1)',
        h: 'rgba(0,0,0,0.15)',
        d: 'rgba(255,255,255,0.05)',
        dh: 'rgba(255,255,255,0.10)',
    },

    bgrinput: {
        DEFAULT: 'rgba(229,231,235,0.5)',
        f: 'rgba(255,255,255,1)',
        d: 'rgba(31,41,55,0.5)',
        df: 'rgba(3,7,18,1)',
    },
    bdrinput: {
        DEFAULT: 'rgba(107,114,128,0.2)',
        f: 'rgba(107,114,128,0.5)',
        d: 'rgba(107,114,128,0.2)',
        df: 'rgba(107,114,128,0.5)',
    },


    bgrmodal: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    bdrmodal: {
        DEFAULT: 'rgba(229,231,235,1)',
        d: 'rgba(31,41,55,1)',
    },

    bgrnavbar: {
        DEFAULT: 'rgba(255,255,255,0.8)',
        d: 'rgba(17,24,39,0.8)',
    },
    bdrnavbar: {
        DEFAULT: 'rgba(209,213,219,0.8)',
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
        DEFAULT: 'rgba(229,231,235,0.6)',
        d: 'rgba(31,41,55,0.8)',
        h: 'rgba(229,231,235,0.8)',
        dh: 'rgba(31,41,55,0.6)',

    },
    bdritem: {
        DEFAULT: 'rgba(229,231,235,1)',
        d: 'rgba(31,41,55,1)',

    },

    bgrbutton: {
        DEFAULT: 'rgba(229,231,235,0.8)',
        h: 'rgba(209,213,219,0.5)',
        d: 'rgba(31,41,55,0.8)',
        dh: 'rgba(31,41,55,0.5)',
    },
    bdrbutton: {
        DEFAULT: 'rgba(209,213,219,0.8)',
        h: 'rgba(209,213,219,1)',
        d: 'rgba(31,41,55,1)',
        dh: 'rgba(31,41,55,0.8)',
    },

    bdr: {
        DEFAULT: 'rgba(229,231,235,1)',
        d: 'rgba(31,41,55,0.8)',
    },
    bgr: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    screen: {
        DEFAULT: '#f3f4f6',
        d: '#030712',
    },
}

const theme = {
    extend: {
        colors: colors,
        fontFamily: {
            default: ['default-font', 'sans-serif']
        },
        aspectRatio: {
            '3/1': '3 / 1',
            '4/1': '4 / 1',
            '5/1': '5 / 1',
        },
    },
}

module.exports = merge({ theme, colors }, configCustom)
