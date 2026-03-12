const merge = require('deepmerge');
const configCustom = require('app/customization/design/tailwind/theme');
const nativewindOS = process.env.NATIVEWIND_OS;
const isNative = nativewindOS === 'ios' || nativewindOS === 'android' || process.env.TAILWIND_TARGET === 'native';
const { nativewindUIColors } = require('app/design/tailwind/nativewindui-theme');

// Keep web shadows aligned with Tailwind defaults while providing
// parseable single-shadow values for NativeWind on iOS/Android.
const boxShadowWeb = {
    none: '0 0 #0000',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    '2xs': '0 1px rgb(0 0 0 / 0.05)',
    'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px 0px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 8px 16px -2px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 16px 24px -4px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 24px 48px -4px rgb(0 0 0 / 0.25)',
    'custom': 'var(--shadow-custom)',
    'custom-hover': 'var(--shadow-custom-hover)',
};

const boxShadowNative = {
    none: '0 0 #0000',
    DEFAULT: '0px 3px 6px rgba(0, 0, 0, 0.08)',
    '2xs': '0px 1px 1px rgba(0, 0, 0, 0.08)',
    'xs': '0px 1px 2px rgba(0, 0, 0, 0.08)',
    'sm': '0px 2px 4px rgba(0, 0, 0, 0.08)',
    'md': '0px 4px 8px rgba(0, 0, 0, 0.08)',
    'lg': '0px 8px 16px rgba(0, 0, 0, 0.08)',
    'xl': '0px 16px 24px rgba(0, 0, 0, 0.08)',
    '2xl': '0px 24px 48px rgba(0, 0, 0, 0.08)',
    // NativeWind currently maps one shadow layer only; these approximate
    // the web stacked border+shadow custom tokens.
    'custom': '0px 2px 4px rgba(0, 0, 0, 0.08)',
    'custom-hover': '0px 3px 6px rgba(0, 0, 0, 0.2)',
};

const colors = {
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
        boxShadow: isNative ? boxShadowNative : boxShadowWeb,
        elevation: {
            '2xs': '1',
            'xs': '2',
            'custom': '2',
            'custom-hover': '3',
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
        /*keyframes: {
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
        }*/
        
    },
}

module.exports = (() => {
    const mergedConfig = merge({ theme, colors }, configCustom);
    return mergedConfig;
  })();