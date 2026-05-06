const { theme } = require('app/design/tailwind/theme')
const plugin = require('tailwindcss/plugin')
/** @type {import('tailwindcss').Config} */

const platformVariants = plugin(({ addVariant }) => {
  addVariant('web', '&')
  addVariant('native', '@media not all')
  addVariant('ios', '@media not all')
  addVariant('android', '@media not all')
})

module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/**/*.{js,jsx,ts,tsx}',
    // Exclude node_modules by being specific about package paths
  ],
  safelist: [
    
  ],
  theme: {
    ...theme,
  },
  darkMode: ['class', '[theme="dark"]'],
  important: 'html',
   plugins: [platformVariants, require("@tailwindcss/container-queries"), require("tailwindcss-animate")],
  future: {hoverOnlyWhenSupported: true}
}
