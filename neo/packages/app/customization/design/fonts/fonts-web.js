import { webFontClassName } from 'app/design/fonts/fonts-web';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects
// 
// Pick the font per platform in customization/config/fonts.js. A family other
// than 'system' on web needs its next/font instances: pass them to
// webFontClassName() (example in app/design/fonts/fonts-web.web.ts), or use
// your own fonts and uncomment below:
// 
// import localFont from 'next/font/local';
// 
// const mainFont = localFont({
//   src: [{ path: './YourCustomFont.ttf', style: 'normal' }],
//   variable: '--font-main',
//   display: 'swap',
// });
// 
// const titleFont = localFont({
//   src: [{ path: './YourTitleFont.ttf', style: 'normal' }],
//   variable: '--font-title',
//   display: 'swap',
// });

// With local fonts: export const fontVars = `${mainFont.variable} ${titleFont.variable}`;
export const fontVars = webFontClassName();