import localFont from 'next/font/local';
import { mainFont, titleFont } from './fonts-web-default';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// only for custom projects

/*const mainFont2 = localFont({
  src: [{ path: './TimesNewRoman.ttf', style: 'normal' }],
  variable: '--font-main',
});

const titleFont2 = localFont({
  src: [{ path: './CenturyGothic.ttf', style: 'normal' }],
  variable: '--font-title',
});

export const fontVars = `${mainFont2.variable} ${titleFont2.variable}`;*/

export const fontVars = `${mainFont.variable} ${titleFont.variable}`;