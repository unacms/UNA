// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

const colors = 
{
    "brand": {
        DEFAULT: "#2F5E8E",
        "dark": "#040507",
    },
    "screen": {
        DEFAULT: "#f3f5f6",
        "dark": "#0d0f11",
    },
    "navbar": {
            DEFAULT: "#FFFFFF",
            "dark": "#181b20",
    },
    "sidebar": {
        DEFAULT: "#FFFFFF",
        "dark": "#181b20",
    },
    "tabbar": {
        DEFAULT: "#FFFFFF",
        "dark": "#181b20",
    },
    "block": {
        DEFAULT: "#FFFFFF",
        "dark": "#181b20",
    },
    "card": {
        DEFAULT: "#FFFFFF",
        "dark": "#181b20",
    },
    "button": {
        DEFAULT: "#2F5E8E",
        "dark": "#2F5E8E",
    },
    "bordercolor": {
        DEFAULT: "#252a32",
        "dark": "#90a2b2",
    },
    'neo': {
        '50': '#f3f5f6',
        '100': '#dbe1e6',
        '200': '#bdc8d1',
        '300': '#90a2b2',
        '400': '#607385',
        '500': '#465462',
        '600': '#2f3742',
        '700': '#252a32',
        '800': '#181b20',
        '900': '#0d0f11',
    },
   
};

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
