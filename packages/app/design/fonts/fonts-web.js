import { Inter, Lexend } from 'next/font/google';

// Optimized Google Font loading for web (next/font)
// - Latin subset, display swap, no preload (avoids unused preload warnings; fonts still load)

export const mainFont = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-main',
    display: 'swap',
    preload: false,
});

export const titleFont = Lexend({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-title',
    display: 'swap',
    preload: false,
});
