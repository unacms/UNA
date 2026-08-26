/**
 * 
 * Note. For now only UNA core, Artificer and Messenger modules were included in minifying process.
 * 
 */

module.exports = {
  content: [
    './inc/js/*.js',
    './inc/js/classes/*.js',

    './modules/base/**/js/*.js',
    './modules/base/**/template/*.html',

    './modules/boonex/**/js/*.js',
    './modules/boonex/**/template/*.html',

    './modules/boonex/**/data/template/**/*.html',

    './studio/template/*.html',
    './studio/template/scripts/*.php',
    './studio/template/scripts_templ/*.php',

    './template/*.html',
    './template/scripts/*.php',
    './template/scripts_templ/*.php',

    './src/**/*.{ts,tsx}'
  ],
  safelist: [
    'w-8', 'w-10', 'w-16', 'w-24', 'w-48', 'w-4/6', 
    'h-8', 'h-10', 'h-24', 'h-48',
    '-m-2',
    'text-red-400', 
    'ring-blue-500', 'ring-opacity-20', 
    'focus:ring-blue-500', 'focus:ring-opacity-20',
    'border-blue-500', 'border-opacity-70', 
    'focus:border-blue-500', 'focus:border-opacity-70',

    'lg:block', 'lg:hidden', 
    'dark:block', 'dark:hidden', 'dark:lg:block', 'dark:lg:hidden',

    'aspect-w-1', 'aspect-w-3', 'aspect-w-4', 'aspect-w-9', 'aspect-w-16',
    'aspect-h-1', 'aspect-h-3', 'aspect-h-4', 'aspect-h-9', 'aspect-h-16',
    'aspect-none',

    'col-red1', 'col-red1-dark', 'col-red2', 'col-red2-dark', 'col-red3', 'col-red3-dark',
    'bg-col-red1', 'bg-col-red1-dark', 'bg-col-red2', 'bg-col-red2-dark', 'bg-co3-red1', 'bg-col-red3-dark',
    'col-green1', 'col-green1-dark', 'col-green2', 'col-green2-dark', 'col-green3', 'col-green3-dark',
    'bg-col-green1', 'bg-col-green1-dark', 'bg-col-green2', 'bg-col-green2-dark', 'bg-co3-green1', 'bg-col-green3-dark',
    'col-blue1', 'col-blue1-dark', 'col-blue2', 'col-blue2-dark', 'col-blue3', 'col-blue3-dark',
    'bg-col-blue1', 'bg-col-blue1-dark', 'bg-col-blue2', 'bg-col-blue2-dark', 'bg-co3-blue1', 'bg-col-blue3-dark',
    'col-gray', 'col-gray-dark',
    'bg-col-gray', 'bg-col-gray-dark',

    'bx-def-box-sizing', 'bx-def-align-center',  'bx-def-valign-center', 'bx-def-centered', 
    'bx-def-margin', 'bx-def-margin-neg', 'bx-def-margin-left', 'bx-def-margin-left-auto', 'bx-def-margin-right', 'bx-def-margin-top', 'bx-def-margin-top-auto', 'bx-def-margin-bottom', 'bx-def-margin-leftright', 'bx-def-margin-leftright-neg', 'bx-def-margin-topbottom', 'bx-def-margin-topbottom-neg', 'bx-def-margin-lefttopright', 'bx-def-margin-rightbottomleft', 
    'bx-def-margin-sec', 'bx-def-margin-sec-neg', 'bx-def-margin-sec-left', 'bx-def-margin-sec-left-auto', 'bx-def-margin-sec-right', 'bx-def-margin-sec-top', 'bx-def-margin-sec-top-auto', 'bx-def-margin-sec-bottom', 'bx-def-margin-sec-leftright', 'bx-def-margin-sec-leftright-neg', 'bx-def-margin-sec-topbottom', 'bx-def-margin-sec-topbottom-neg', 'bx-def-margin-sec-lefttopright', 'bx-def-margin-sec-rightbottomleft', 
    'bx-def-margin-thd', 'bx-def-margin-thd-neg', 'bx-def-margin-thd-left', 'bx-def-margin-thd-left-auto', 'bx-def-margin-thd-right', 'bx-def-margin-thd-top', 'bx-def-margin-thd-top-auto', 'bx-def-margin-thd-bottom', 'bx-def-margin-thd-leftright', 'bx-def-margin-thd-leftright-neg', 'bx-def-margin-thd-topbottom', 'bx-def-margin-thd-topbottom-neg', 'bx-def-margin-thd-lefttopright', 'bx-def-margin-thd-rightbottomleft', 
    'bx-def-padding', 'bx-def-padding-left', 'bx-def-padding-left-auto', 'bx-def-padding-right', 'bx-def-padding-top', 'bx-def-padding-top-auto', 'bx-def-padding-bottom', 'bx-def-padding-leftright', 'bx-def-padding-topbottom', 'bx-def-padding-lefttopright', 'bx-def-padding-rightbottomleft', 
    'bx-def-padding-sec', 'bx-def-padding-sec-left', 'bx-def-padding-sec-left-auto', 'bx-def-padding-sec-right', 'bx-def-padding-sec-top', 'bx-def-padding-sec-top-auto', 'bx-def-padding-sec-bottom', 'bx-def-padding-sec-leftright', 'bx-def-padding-sec-topbottom', 'bx-def-padding-sec-lefttopright', 'bx-def-padding-sec-rightbottomleft', 
    'bx-def-padding-thd', 'bx-def-padding-thd-left', 'bx-def-padding-thd-left-auto', 'bx-def-padding-thd-right', 'bx-def-padding-thd-top', 'bx-def-padding-thd-top-auto', 'bx-def-padding-thd-bottom', 'bx-def-padding-thd-leftright', 'bx-def-padding-thd-topbottom', 'bx-def-padding-thd-lefttopright', 'bx-def-padding-thd-rightbottomleft', 
    'bx-def-font-small', 'bx-def-font-middle', 'bx-def-font-large', 'bx-def-font-h3', 'bx-def-font-h2', 'bx-def-font-h1', 
    'bx-def-a-colored',
    'bx-def-unit-alert', 'bx-def-unit-alert-small', 'bx-def-unit-alert-middle',
    'bx-def-label',
    'bx-def-icon-size', 'bx-def-thumb-size', 'bx-def-ava-size', 'bx-def-ava-big-size',
    'bx-def-icon-badge-size', 'bx-def-thumb-badge-size', 'bx-def-ava-badge-size', 'bx-def-ava-big-badge-size',
    'bx-def-color-bg-box-active', 

    'bx-form-caption', 'bx-form-value', 'bx-form-required', 'bx-form-warn', 
    'bx-form-input-wrapper-checkbox', 'bx-form-input-wrapper-radio', 'bx-form-input-wrapper-checkbox_set', 'bx-form-input-wrapper-radio_set',
    'bx-form-input-slider', 'bx-form-input-doublerange', 'bx-form-input-select_multiple', 'bx-form-input-select', 'bx-form-input-radio_set', 'bx-form-input-checkbox_set', 'bx-form-input-number', 'bx-form-input-time', 'bx-form-input-datepicker', 'bx-form-input-datetime', 'bx-form-input-textarea', 'bx-form-input-text', 'bx-form-input-price', 'bx-form-input-checkbox', 'bx-form-input-radio', 
    'bx-switcher-cont', 

    'bx-popup-full-screen', 'bx-popup-fog',

    'bx-stl-mil', 'bx-stl-mii', 'bx-stl-mit', 'bx-stl-mia', 

    'bx-informer-msg-info', 'bx-informer-msg-alert', 'bx-informer-msg-error',

    'sys-action-counter', 'sys-ac-only', 'sys-ac-link',

    'bx-vote-bls-submenu-cnt', 
    
    'bx-base-general-unit-meta-username', 'bx-base-text-unit-gallery-wrapper', 'aspect-video', 

    'bx-tl-overflow',

    'sys-auth-block', 'sys-auth-compact-container',

    'flickity-button',
	  
    'ql-editor', 'space-x-4', 'filepond--drop-label',
      
    'bg-slate-600','bg-gray-600','bg-zinc-600','bg-neutral-600','bg-stone-600','bg-red-600','bg-orange-600','bg-amber-600','bg-yellow-600','bg-lime-600','bg-green-600','bg-emerald-600','bg-teal-600','bg-cyan-600','bg-sky-600','bg-indigo-600','bg-violet-600','bg-blue-600','bg-purple-600','bg-fuchsia-600','bg-pink-600','bg-rose-600',
      
    'text-slate-600','text-gray-600','text-zinc-600','text-neutral-600','text-stone-600','text-red-600','text-orange-600','text-amber-600','text-yellow-600','text-lime-600','text-green-600','text-emerald-600','text-teal-600','text-cyan-600','text-sky-600','text-indigo-600','text-violet-600','text-blue-600','text-purple-600','text-fuchsia-600','text-pink-600', 'text-rose-600'
  ],
  darkMode: 'class', // false or 'media' or 'class'
  theme: {
    fontFamily: {
        'inter': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
    },
    extend: {
        width: {
            '21': '5.25rem',
            '46': '11.5rem',
            '50': '12.5rem',
            '112': '28rem',
            '128': '32rem',
            '144': '36rem',
            '1/10': '10%',
            '2/10': '20%',
            '3/10': '30%',
            '4/10': '40%',
            '5/10': '50%',
            '6/10': '60%',
            '7/10': '70%',
            '8/10': '80%',
            '9/10': '90%'
        },
        minWidth: {
            4: '1rem',
            6: '1.5rem',
            48: '12rem',
            88: '22rem'
        },
        maxWidth: {
            32: '8rem',
        },
        height: {
            46: '11.5rem',
            50: '12.5rem',
            112: '28rem',
            128: '32rem',
            144: '36rem'
        },
        maxHeight: {
            128: '32rem',
        },
        lineHeight: {
            11: '2.75rem',
            12: '3rem',
            13: '3.25rem',
            14: '3.5rem',
            15: '3.75rem',
            16: '4rem',
        },
        zIndex: {
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
        },
        flex: {
            2: '2 2 0%',
        },
        translate: {
            '5/4': '125%',
        },
        animation: {
          goo: "goo 8s infinite",
        },
        aspectRatio: {
          auto: 'auto',
          square: '1 / 1',
          video: '16 / 9',
          portrait: '9 / 16',
          1: '1',
          2: '2',
          3: '3',
          4: '4',
          5: '5',
          6: '6',
          7: '7',
          8: '8',
          9: '9',
          10: '10',
          11: '11',
          12: '12',
          13: '13',
          14: '14',
          15: '15',
          16: '16',
        },
        keyframes: {
          goo: {
            "0%": {
              transform: "translate(0px, 0px) scale(1)",
            },
            "33%": {
              transform: "translate(30px, -50px) scale(1.2)",
            },
            "66%": {
              transform: "translate(-20px, 20px) scale(0.8)",
            },
            "100%": {
              transform: "translate(0px, 0px) scale(1)",
            },
          },
        },
    },
  },
  variants: {
    aspectRatio: ['responsive', 'hover']
  },
  corePlugins: {
    aspectRatio: true,
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
}