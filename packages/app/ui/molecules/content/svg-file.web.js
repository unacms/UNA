import { useThemeName } from 'app/design/theme';

export default function ({src_web, src_dark, src_default, colorize = false, className = '', style, alt = '', ...props}) {
    const theme = useThemeName();
    const src = theme === 'dark' && src_dark ? src_dark : src_default; 

    if (!src) {
        console.warn('SvgFile: No valid src provided');
        return null;
    }

    // Root-relative path: identical on SSR and client (resolves to the page origin in the browser).
    const url = `/svg/${src}`;
    if (colorize) {
        return (
            <span
                key={src}
                {...props}
                aria-label={alt || undefined}
                className={className}
                role={alt ? 'img' : 'presentation'}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'currentColor',
                    maskImage: `url("${url}")`,
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                    maskSize: 'contain',
                    WebkitMaskImage: `url("${url}")`,
                    WebkitMaskPosition: 'center',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskSize: 'contain',
                    ...style,
                }}
            />
        );
    }

    return (
        <img
            key={src}
            {...props}
            className={className}
            src={url}
            alt={alt}
            style={style}
        />
    );
} 
