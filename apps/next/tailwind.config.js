
const { theme } = require('app/design/tailwind/theme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: [
    'gap-x-2',
  ],
  theme: {
    ...theme,
  },
  important: 'html',
  plugins: [require('nativewind/tailwind/css')],
}
