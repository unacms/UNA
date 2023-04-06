// @ts-check

const { theme } = require('app/design/tailwind/theme')

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    '../../packages/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    'space-x-2',
  ],
  theme: {
    ...theme,
  },
  plugins: [],
}
