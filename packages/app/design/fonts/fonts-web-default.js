import localFont from 'next/font/local';

export const mainFont = localFont({
  src: [{ path: './Inter-VariableFont.ttf', style: 'normal' }],
  variable: '--font-main',
});

export const titleFont = localFont({
  src: [{ path: './Inter-VariableFont.ttf', style: 'normal' }],
  variable: '--font-title',
});


