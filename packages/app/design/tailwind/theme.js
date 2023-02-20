// @ts-check

/** @type {import('tailwindcss').Config['theme']} */

const colors = 
{
    "primary": {
        DEFAULT: "#2F5E8E",
        "content": "#2F5E8E",
        "focus": "#214264",

        "dark": "#2F5E8E",
        "content-dark": "#6A9BCE",
        "focus-dark": "#2F5E8E",
    },
    "gray-1000": {
        DEFAULT: "#06090E",
     
    },
};

const theme = {
    extend: {
        colors: colors
    },
}

module.exports = {
  theme,
  colors,
}
