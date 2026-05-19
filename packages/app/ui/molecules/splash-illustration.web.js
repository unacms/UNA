import { useThemeName } from 'app/design/theme';
import { getBaseUrl } from 'app/config';

/**
 * Splash hero for web: <img> with CSS mask so LCP gets fetchpriority=high + eager load,
 * while keeping secondary-foreground tint (same technique as SvgFile colorize).
 */
export default function SplashIllustration({
    className = 'text-secondary-foreground',
    alt = 'Splash screen illustration',
}) {
    const theme = useThemeName();
    const file = theme === 'dark' ? 'splash-dark.svg' : 'splash-light.svg';
    const baseUrl = typeof window !== 'undefined' ? getBaseUrl() : '';
    const url = `${baseUrl}/svg/${file}`;

    return (
        <img
            src={url}
            alt={alt}
            width={192}
            height={192}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className={`block h-full w-full ${className}`}
            style={{
                backgroundColor: 'currentColor',
                maskImage: `url("${url}")`,
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
                maskSize: 'contain',
                WebkitMaskImage: `url("${url}")`,
                WebkitMaskPosition: 'center',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
            }}
        />
    );
}
