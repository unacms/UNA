const { theme } = require('app/design/tailwind/theme.js')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    
  ],
  presets: [require("nativewind/preset")],
  theme: {
    ...theme,
  },
   plugins: [require("@tailwindcss/container-queries")],
}

