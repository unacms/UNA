const { theme } = require('app/design/tailwind/theme.js')
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    // Card component density classes
    'u-card-base-compact',
    'u-card-base-default', 
    'u-card-base-relaxed',
    'u-card-header-compact',
    'u-card-header-default',
    'u-card-header-relaxed',
    'u-card-title-compact',
    'u-card-title-default',
    'u-card-title-relaxed',
    'u-card-description-compact',
    'u-card-description-default',
    'u-card-description-relaxed',
    'u-card-content-compact',
    'u-card-content-default',
    'u-card-content-relaxed',
    'u-card-footer-compact',
    'u-card-footer-default',
    'u-card-footer-relaxed',
    // Content padding density classes
    'u-content-padding-compact',
    'u-content-padding-default',
    'u-content-padding-relaxed',
    // Density-aware padding utilities
    'p-sm',
    'p-md',
    'p-lg',
    'px-sm',
    'px-md',
    'px-lg',
    'py-sm',
    'py-md',
    'py-lg',
    'pt-sm',
    'pt-md',
    'pt-lg',
    'pb-sm',
    'pb-md',
    'pb-lg',
    // Controls
    'u-cn-sw-trk-base',
    'u-cn-sw-trk-sm',
    'u-cn-sw-tmb-base',
    'u-cn-sw-tmb-sm',
    'u-cn-sw-tmb-act-base',
    'u-cn-sw-tmb-act-sm',
  ],
  presets: [require("nativewind/preset")],
  theme: {
    ...theme,
  },
  plugins: [],
}

