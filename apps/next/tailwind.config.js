const { theme } = require('app/design/tailwind/theme')
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    // Card component density classes
    
  ],
  theme: {
    ...theme,
  },
  darkMode: ['class', '[theme="dark"]'],
  important: 'html',
  presets: [require("nativewind/preset")],
   plugins: [require("@tailwindcss/container-queries")],
  future: {hoverOnlyWhenSupported: true}
}

