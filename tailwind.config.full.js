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
    {
      pattern: /.*/
    }
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
