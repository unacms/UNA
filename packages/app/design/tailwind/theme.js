const merge = require('deepmerge');
const configCustom = require('app/customization/design/tailwind/theme');
const nativewindOS = process.env.NATIVEWIND_OS;
const isNative = nativewindOS === 'ios' || nativewindOS === 'android' || process.env.TAILWIND_TARGET === 'native';
const { nativewindUIColors } = require('app/design/tailwind/nativewindui-theme');

// Keep web shadows aligned with Tailwind defaults while providing
// parseable single-shadow values for NativeWind on iOS/Android.

//
// The `btn-*` family below uses stacked shadows (incl. inset) to define
// button surfaces *without* a `border` style. This avoids the well-known
// problems with mixing borders and rounded corners on:
//   - Native iOS — borders break the smooth (superellipse) corner rendering;
//     `overflow: hidden` workarounds clip the wrong shape.
//   - Cross-platform — borders add layout px and shift the box model
//     differently on web vs native.
//   - Dark mode — a single border colour rarely reads correctly across both
//     themes; the `*-deep` variants give us a second tuned stack.
//
// React Native 0.81 supports `boxShadow` natively, including stacked + inset
// shadows, so the same strings work on web and native via NativeWind.
//
// Currently only the `glass` family is in active use. The `bordered` /
// `borderedProminent` styles are intentionally flat (no shadow) per the
// design call, and `outline` / `focus` tokens are kept around as
// cross-platform fallbacks for places that can't rely on `border` /
// `outline` CSS (e.g. inside RN where outlines aren't supported).
const boxShadowBtn = {
    // Pure outline replacement — single 1px ring, no fill, no lift.
    // Reserved for "outline-only" surfaces that need a 1px ring without
    // pulling in a real CSS `border`. Not currently used by any built-in
    // style; available via `classNames.container = 'shadow-btn-outline …'`.
    'btn-outline':      '0 0 0 1px rgb(0 0 0 / 0.10)',
    'btn-outline-deep': '0 0 0 1px rgb(255 255 255 / 0.10)',

    // Glass surface — inner highlights + thin outer ring + a wide soft
    // ambient drop so the surface reads as floating above the page.
    // Used by both `glass` and `glassProminent` variants; the bg colour
    // differentiates them.
    'btn-glass':       'inset 0 0 0 1px rgb(255 255 255 / 0.30), inset 0 1px 0 0 rgb(255 255 255 / 0.40), 0 0 0 1px rgb(0 0 0 / 0.05), 0 4px 8px -2px rgb(0 0 0 / 0.06), 0 16px 32px -8px rgb(0 0 0 / 0.10)',
    'btn-glass-deep':  'inset 0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 0 rgb(255 255 255 / 0.10), 0 0 0 1px rgb(0 0 0 / 0.40), 0 4px 8px -2px rgb(0 0 0 / 0.30), 0 16px 32px -8px rgb(0 0 0 / 0.50)',

    // Glass pressed — keep the same border/highlight stack but shrink the
    // ambient drop so the button visually settles closer to the surface.
    // No inset darkening (it conflicts with the press scale animation).
    'btn-glass-pressed':      'inset 0 0 0 1px rgb(255 255 255 / 0.30), inset 0 1px 0 0 rgb(255 255 255 / 0.40), 0 0 0 1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    'btn-glass-pressed-deep': 'inset 0 0 0 1px rgb(255 255 255 / 0.06), inset 0 1px 0 0 rgb(255 255 255 / 0.10), 0 0 0 1px rgb(0 0 0 / 0.40), 0 2px 4px -1px rgb(0 0 0 / 0.30)',

    // Focus ring drawn as shadow when an outline cannot be used (rare —
    // pseudo-element ring is preferred; this is the cross-platform fallback).
    'btn-focus':       '0 0 0 2px rgb(var(--ring) / 0.85)',
    'btn-focus-deep':  '0 0 0 2px rgb(var(--ring) / 0.95)',
};

const boxShadowWeb = {
    none: '0 0 #0000',

    '2xs': '0 1px rgb(0 0 0 / 0.02)',
    '2xs-deep': '0 1px rgb(0 0 0 / 0.08)',

    'xs': '0 1px 2px rgb(0 0 0 / 0.03)',
    'xs-deep': '0 1px 2px rgb(0 0 0 / 0.12)',

    'sm':      '0 1px 3px rgb(0 0 0 / 0.04)',
    'sm-deep': '0 1px 3px rgb(0 0 0 / 0.16)',

    DEFAULT: '0 3px 6px 0 rgb(0 0 0 / 0.06)',
    'deep': '0 3px 6px 0 rgb(0 0 0 / 0.24)',

    'md': '0 4px 6px rgb(0 0 0 / 0.08)',
    'md-deep': '0 4px 6px rgb(0 0 0 / 0.32)',

    'lg': '0 8px 16px rgb(0 0 0 / 0.08)',
    'lg-deep': '0 8px 16px rgb(0 0 0 / 0.4)',

    'xl': '0 16px 24px rgb(0 0 0 / 0.08)',
    'xl-deep': '0 16px 24px rgb(0 0 0 / 0.48)',

    '2xl': '0 24px 48px rgb(0 0 0 / 0.08)',
    '2xl-deep': '0 24px 48px rgb(0 0 0 / 0.56)',

    ...boxShadowBtn,
};

const boxShadowNative = {
    none: '0 0 #0000',

    DEFAULT: '0 3px 6px 0 rgb(0 0 0 / 0.02)',
    'deep': '0 3px 6px 0 rgb(0 0 0 / 0.08)',

    '2xs': '0 1px rgb(0 0 0 / 0.04)',
    '2xs-deep': '0 1px rgb(0 0 0 / 0.08)',

    'xs': '0 1px 2px rgb(0 0 0 / 0.06)',
    'xs-deep': '0 1px 2px rgb(0 0 0 / 0.12)',

    'sm':      '0 1px 3px rgb(0 0 0 / 0.08)',
    'sm-deep': '0 1px 3px rgb(0 0 0 / 0.16)',

    'md': '0 4px 6px rgb(0 0 0 / 0.1)',
    'md-deep': '0 4px 6px rgb(0 0 0 / 0.16)',

    'lg': '0 8px 16px rgb(0 0 0 / 0.12)',
    'lg-deep': '0 8px 16px rgb(0 0 0 / 0.2)',

    'xl': '0 16px 24px rgb(0 0 0 / 0.16)',
    'xl-deep': '0 16px 24px rgb(0 0 0 / 0.24)',

    '2xl': '0 24px 48px rgb(0 0 0 / 0.24)',
    '2xl-deep': '0 24px 48px rgb(0 0 0 / 0.32)',

    ...boxShadowBtn,
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
            '3xl': '120rem',
            
        },
        screens: {
            '3xl': '120rem',
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
            '9xl': '1536px',
            '10xl': '1920px',
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