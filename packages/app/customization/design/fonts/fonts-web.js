import { mainFont, titleFont } from 'app/design/fonts/fonts-web';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects
// 
// To use local/custom fonts instead of Google Fonts, uncomment below:
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

export const fontVars = `${mainFont.variable} ${titleFont.variable}`;