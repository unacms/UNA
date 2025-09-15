const { theme } = require('app/design/tailwind/theme.js')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    "./.storybook/**/*.{js,jsx,ts,tsx}",
    '../../packages/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    
  ],
  presets: [require("nativewind/preset")],
  theme: {
    ...theme,
  },
  darkMode: ['class', '[theme="dark"]'],
  plugins: [],
}

