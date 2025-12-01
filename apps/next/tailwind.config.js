const { theme } = require('app/design/tailwind/theme')
/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/**/*.{js,jsx,ts,tsx}',
    '../../packages/test-components/src/**/*.{js,jsx,ts,tsx}',
    // Exclude node_modules by being specific about package paths
  ],
  safelist: [
    
  ],
  theme: {
    ...theme,
  },
  darkMode: ['class', '[theme="dark"]'],
  important: 'html',
  presets: [require("nativewind/preset")],
   plugins: [require("@tailwindcss/container-queries"), require("tailwindcss-animate")],
  future: {hoverOnlyWhenSupported: true}
}

