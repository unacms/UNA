/**
 * Merged Tailwind `theme.extend` for the legacy JS config (`apps/next/tailwind.config.js`).
 *
 * That config is NOT loaded by any build — Tailwind v4 requires an explicit
 * `@config` directive and this repo has none. Utilities are generated from the
 * CSS-first token map instead: design/styles/theme.css (`@theme inline`) +
 * design/styles/palette.css, imported by both `global.css` (web) and
 * `apps/expo/global.combined.css` (native).
 *
 * Treat this file as reference only: a token added here but not mirrored into
 * the `@theme inline` block of design/styles/theme.css produces no CSS at all.
 */
const merge = require('deepmerge');
const configCustom = require('app/customization/design/tailwind/theme');
const nativewindOS = process.env.NATIVEWIND_OS;
const isNative = nativewindOS === 'ios' || nativewindOS === 'android' || process.env.TAILWIND_TARGET === 'native';
const { nativewindUIColors } = require('app/design/tailwind/nativewindui-theme');

const neoShadow = (name) => `var(--neo-shadow-${name})`;

const boxShadowBtn = {
    // Override `--neo-shadow-*` in customization CSS; keep Tailwind utility
    // names stable so downstream projects do not need to redefine classes.
    'card-outline':       neoShadow('card-outline'),
    'card-outline-deep':  neoShadow('card-outline-deep'),

    'block-outline':       neoShadow('block-outline'),
    'block-outline-deep':  neoShadow('block-outline-deep'),

    'btn-outline':      neoShadow('btn-outline'),
    'btn-outline-deep': neoShadow('btn-outline-deep'),
    'btn-glass':       neoShadow('btn-glass'),
    'btn-glass-deep':  neoShadow('btn-glass-deep'),
    'btn-glass-pressed':      neoShadow('btn-glass-pressed'),
    'btn-glass-pressed-deep': neoShadow('btn-glass-pressed-deep'),

    // Prominent glass sits on an opaque primary fill, so the edge needs to
    // stay in the primary colour family. Avoid a full white inset ring: it
    // makes the lower edge look lighter than the fill and busy on blue.
    'btn-glass-prominent':      neoShadow('btn-glass-prominent'),
    'btn-glass-prominent-deep': neoShadow('btn-glass-prominent-deep'),
    'btn-glass-prominent-pressed':      neoShadow('btn-glass-prominent-pressed'),
    'btn-glass-prominent-pressed-deep': neoShadow('btn-glass-prominent-pressed-deep'),

};

const boxShadowAvatar = {
    avatar: 'inset 0 0 0 1px rgb(0 0 0 / 0.02)',
    'avatar-deep': 'inset 0 0 0 1px rgb(255 255 255 / 0.02)',
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

    ...boxShadowAvatar,
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

    ...boxShadowAvatar,
    ...boxShadowBtn,
};

const colors = {
}

const theme = {
    extend: {
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
            xs: 'var(--radius-xs)',
            sm: 'var(--radius-sm)',
            DEFAULT: 'var(--radius-default)',
            md: 'var(--radius-md)',
            lg: 'var(--radius-lg)',
            xl: 'var(--radius-xl)',
            '2xl': 'var(--radius-2xl)',
            '3xl': 'var(--radius-3xl)',
            '4xl': 'var(--radius-4xl)',
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