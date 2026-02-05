import { Inter, Lexend } from 'next/font/google';

// Optimized Google Font loading for web
// - Only loads needed weights (400, 500, 600, 700)
// - Latin subset only (reduces size by ~80%)
// - display: 'swap' for better loading performance
// - Automatic font subsetting and optimization by Next.js
// - preload: false to avoid browser warnings about unused preloaded resources
//   (fonts still load via CSS @font-face, just without <link rel="preload">)

export const mainFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-main',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const titleFont = Lexend({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-title',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});
