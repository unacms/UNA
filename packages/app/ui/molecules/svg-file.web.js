import { ThemeName } from 'app/design/theme';

export default function ({src_web, src_dark, src_default, ...props}) {
    const theme = ThemeName();
    const themedSrc = theme === 'dark' && src_dark ? src_dark : src_default;
    const src = src_web || themedSrc;

    if (!src) {
        console.warn('SvgFile: No valid src provided');
        return null;
    }

    // Hydration-safe: avoid window-dependent baseUrl so SSR markup matches client.
    // Use a relative URL so it works for localhost + preview deployments automatically.
    const finalSrc = src.startsWith('http://') || src.startsWith('https://') ? src : `/svg/${src}`;

    return (
        <img {...props} src={finalSrc}/>
    );
} 
