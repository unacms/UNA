const merge = require('deepmerge');
const configCustom = require('app/design/tailwind-custom/theme');
const isNative = process.env.TAILWIND_TARGET === 'native';
const { nativewindUIColors } = require('app/design/tailwind/nativewindui-theme');

const colors = {
    neutral: {
        DEFAULT: 'rgba(107,114,128,1)',
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
    pop: {
        DEFAULT: 'rgba(220, 38, 38, 1)',
        d: 'rgba(239, 68, 68, 1)',
    },
    linkhover: {
        DEFAULT: 'rgba(37, 99, 235, 1)',
        d: 'rgba(96, 165, 250, 1)',
    },

    bgrcard: {
        DEFAULT: 'rgba(255,255,255,0.7)',
        d: 'rgba(17,24,39,0.7)',

    },
    bdrcard: {
        DEFAULT: 'rgba(107,114,128,0.1)',
        h: 'rgba(107,114,128,0.1)',
        d: 'rgba(107,114,128,0.1)',
        dh: 'rgba(107,114,128,0.1)',
    },

    bgrinput: {
        DEFAULT: 'rgba(245,250,255,1)',
        h: 'rgba(255,255,255,1)',
        f: 'rgba(255,255,255,1)',
        d: 'rgba(17,24,39,1)',
        dh: 'rgba(17,24,39,1)',
        df: 'rgba(17,24,39,1)',
    },
    bdrinput: {
        DEFAULT: 'rgba(209,213,219,1)',
        h: 'rgba(37, 99, 235, 1)',
        f: 'rgba(37, 99, 235, 1)',
        d: 'rgba(55,65,81,1)',
        dh: 'rgba(59, 130, 246, 1)',
        df: 'rgba(59, 130, 246, 1)'
    },
    bdrnavbar: {
        DEFAULT: 'rgba(107,114,128,0.1)',
        d: 'rgba(156,163,175,0.1)',
        v: 'rgba(107,114,128,0.1)',
        dv: 'rgba(156,163,175,0.1)',
       
    },
    bgrtabbar: {
        DEFAULT: 'rgba(255,255,255,0.7)',
        d: 'rgba(31,41,55,0.7)',
    },
    bdrtabbar: {
        DEFAULT: 'rgba(75,85,100,0.10)',
        d: 'rgba(75,85,100,0.10)',
    },
    bgritem: {
        DEFAULT: 'rgba(107,114,128,0.1)',
        h: 'rgba(107,114,128,0.2)',
        d: 'rgba(156,163,175,0.1)',
        dh: 'rgba(156,163,175,0.2)',

    },
    bgritemprimary: {
        DEFAULT: 'rgba(59, 130, 246, 0.15)',
        h: 'rgba(59, 130, 246, 0.25)',
        d: 'rgba(59, 130, 246, 0.15)',
        dh: 'rgba(59, 130, 246, 0.25)',
    },
    bdritem: {
        DEFAULT: 'rgba(107,114,128,0.1)',
        h: 'rgba(107,114,128,0.2)',
        d: 'rgba(156,163,175,0.1)',
        dh: 'rgba(156,163,175,0.2)',
    },
    bgrbutton: {
        DEFAULT: 'rgba(255,255,255,1)',   
        h: 'rgba(243,244,246,1)', 
        d: 'rgba(31,41,55,1)',
        dh: 'rgba(55,65,81,1)',
    },
    bdrbutton: {
        DEFAULT: 'rgba(0,0,0,0.1)',
        h: 'rgba(0,0,0,0.15)',
        d: 'rgba(255,255,255,0.05)',
        dh: 'rgba(255,255,255,0.1)',
    },
    bdr: {
        DEFAULT: 'rgba(110,115,130,0.1)',
        h: 'rgba(110,115,130,0.2)',
        f: 'rgba(110,115,130,0.3)',
        d: 'rgba(110,115,130,0.1)',
        dh: 'rgba(110,115,130,0.2)',
        df: 'rgba(110,115,130,0.3)',
    },
}

const theme = {
    extend: {
        containers: {
            '2xs': '16rem',
            'xs': '20rem',
            'sm': '40rem',
            'md': '48rem',
            'lg': '64rem',
            'xl': '80rem',
            '2xl': '96rem',
            
        },
        colors: {
            ...colors,
            ...nativewindUIColors,
        },
        borderColor: {
            // Make `border` (width-only) pick up semantic default color on web and native
            DEFAULT: nativewindUIColors.border,
        },
      
        boxShadow: {
            'xs': 'var(--shadow-xs)',
            'sm': 'var(--shadow-sm)',
            'md': 'var(--shadow-md)',
            'lg': 'var(--shadow-lg)',
            'xl': 'var(--shadow-xl)',
            '2xl': 'var(--shadow-2xl)',
            'border-sm': 'var(--shadow-border-sm)',
            'border': 'var(--shadow-border)',
            'border-lg': 'var(--shadow-border-lg)',
            'border-xl': 'var(--shadow-border-xl)',
        },

        fontSize: {
            '2xs': ['10px', { lineHeight: '12px' }],
          
        },
        
        minWidth: {
            '240': '240px',
        },
        maxWidth: {
            '8xl': '1440px',
        },
        fontFamily: {
            main: ['var(--font-main)'],
            title: ['var(--font-title)'],
        },
      
        aspectRatio: {
            '3/1': '3 / 1',
            '4/1': '4 / 1',
            '5/1': '5 / 1',
        },
        borderRadius: {
            none: '0px',
            sm: 'var(--radius-sm)',
            DEFAULT: 'var(--radius-default)',
            md: 'var(--radius-md)',
            lg: 'var(--radius-lg)',
            xl: 'var(--radius-xl)',
            '2xl': 'var(--radius-2xl)',
            '3xl': 'var(--radius-3xl)',
            full: 'var(--radius-full)',
        },
        // NOTE: Do not redefine fontSize again below. Keep all font sizes in the single block above.
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