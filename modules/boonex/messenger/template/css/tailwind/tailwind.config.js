module.exports = {
  presets: [require('./parent.config.js')],
  safelist: [
      'lg:block','xl:block',
      '-space-x-4','space-y-1', 'gap-3',
      'md:hidden', 'h-min', 'max-w-fit',
      {
         pattern: /col-span-(2|3|4|5|6|7|8|9|10)/,
         variants: ['xl', 'md']
      }
  ],
  theme: {
      extend: {
          colors: {
              'bubble-away': '#f5a623'
          },
          flex: {
              'stat': '0 0 auto',
              'dynamic': '1 1 0',
          },
          screens: {
              'xs': '480px'
          }
      },
  }
}