const merge = require('deepmerge');
const configCustom = require('app/design/tailwind-custom/theme');

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
        DEFAULT: 'rgba(37, 99, 235, 1)',
        d: 'rgba(59, 130, 246, 1)',
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
        d: 'rgba(3,7,18,1)',
    },
    bgrsecondary: {
        DEFAULT: 'rgba(0,0,0,0.05)',
        d: 'rgba(255,255,255,0.05)',
    },

    bgrcard: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    bdrcard: {
        DEFAULT: 'rgba(107,114,128,0.1)',
        d: 'rgba(107,114,128,0.1)',
    },



    bgrinput: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        h: 'rgba(107,114,128,0.25)',
        f: 'rgba(255,255,255,1)',
        d: 'rgba(107,114,128,0.15)',
        dh: 'rgba(107,114,128,0.25)',
        df: 'rgba(0,0,0,0.1)',
    },
    bdrinput: {
        DEFAULT: 'rgba(107,114,128,0.2)',
        h: 'rgba(107,114,128,0.3)',
        f: 'rgba(37, 99, 235, 0.8)',
        d: 'rgba(107,114,128,0.2)',
        dh: 'rgba(107,114,128,0.3)',
        df: 'rgba(59, 130, 246, 0.8)',
    },
    bgrmodal: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    bdrmodal: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(255,255,255,0.05)',
    },
    bgrnavbar: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    bdrnavbar: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        d: 'rgba(107,114,128,0.15)',
       
    },
    bgrtabbar: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    bdrtabbar: {
        DEFAULT: 'rgba(229,231,235,1)',
        d: 'rgba(0,0,0,1)',
    },
    bgritem: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        h: 'rgba(107,114,128,0.25)',
        d: 'rgba(107,114,128,0.15)',
        dh: 'rgba(107,114,128,0.25)',

    },
    bdritem: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        d: 'rgba(107,114,128,0.15)',

    },
    bgrbutton: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        h: 'rgba(107,114,128,0.25)',
        d: 'rgba(107,114,128,0.15)',
        dh: 'rgba(107,114,128,0.25)',
    },
    bdrbutton: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        f: 'rgba(107,114,128,0.25)',
        d: 'rgba(107,114,128,0.15)',
        df: 'rgba(107,114,128,0.25)',
    },
    bdr: {
        DEFAULT: 'rgba(107,114,128,0.15)',
        h: 'rgba(107,114,128,0.25)',
        f: 'rgba(255,255,255,1)',
        d: 'rgba(107,114,128,0.15)',
        dh: 'rgba(107,114,128,0.25)',
        df: 'rgba(0,0,0,0.1)',
    },
    bgr: {
        DEFAULT: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
    },
    screen: {
        DEFAULT: 'rgba(243,244,246,1)',
        d: 'rgba(17,24,39,1)',
    },
    indicator: {
        DEFAULT: 'rgba(37, 99, 235, 1)',
        d: 'rgba(59, 130, 246, 1)',
    },
}

const theme = {
    extend: {
        
        colors: colors,
        fontFamily: {
            default: ['default-font', 'sans-serif']
        },

        boxShadow: {
            'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },

        aspectRatio: {
            '3/1': '3 / 1',
            '4/1': '4 / 1',
            '5/1': '5 / 1',
        },
        fontSize: {
            base: '16px',
        },
        keyframes: {
            appear: {
              "0%": {
                opacity: "0",
                width: "0%",
                marginLeft: "auto",
                marginRight: "auto",
              },
              "60%": {
                opacity: "0.6",
                width: "100%",
                marginLeft: "auto",
                marginRight: "auto",
              },
              "80%": {
                opacity: "0.8",
                width: "90%",
                marginLeft: "auto",
                marginRight: "auto",
              },
              "100%": {
                opacity: "1",
                width: "100%",
                marginLeft: "auto",
                marginRight: "auto",
              },
            },
            slidein: {
                "0%": {
                    opacity: "0",
                    transform: "translateY(-20%)",
                },
                "100%": {
                    opacity: "1",
                    transform: "translateY(0)",
                },
            },
           },
           animation: {
              appear: "appear 0.5s forwards ease-in-out",
              slidein: "slidein 1.2s linear(0, 0.002 0.4%, 0.0088, 0.0201, 0.0357 1.78%, 0.081 2.76%, 0.148 3.85%, 0.2932 5.75%, 0.6178 9.49%, 0.7501 11.1%, 0.8725 12.76%, 0.9694, 1.0481 15.87%, 1.0816, 1.1101, 1.1337, 1.1527 19.09%, 1.1681, 1.1789 20.81%, 1.186, 1.1876 22.88%, 1.1838 24.03%, 1.1746 25.24%, 1.1625 26.33%, 1.1462 27.54%, 1.0534 33.35%, 1.0312 34.9%, 1.0131 36.34%, 0.9958, 0.9825, 0.9732 41.34%, 0.9672 43.12%, 0.9648 45.37%, 0.9671 47.84%, 0.9726 50.25%, 0.9969 58.76%, 1.0027 61.93%, 1.0058 65.15%, 1.0062 70.44%, 0.9991 86.19%, 0.9995 99.99%) forwards",
           }
        
    },
}

module.exports = (() => {
    const mergedConfig = merge({ theme, colors }, configCustom);
    return mergedConfig;
  })();