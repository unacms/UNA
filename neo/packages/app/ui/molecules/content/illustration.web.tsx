import { ILLUSTRATIONS, ILLUSTRATION_VIEWBOX } from './illustration-shapes';
import type { IllustrationProps, IllustrationTone } from './illustration.types';

const TONE_CLASS: Record<IllustrationTone, string> = {
    muted: 'fill-muted',
    accent: 'fill-accent',
    primary: 'fill-primary',
    accentForeground: 'fill-accent-foreground',
    primaryForeground: 'fill-primary-foreground',
};

/**
 * Decorative shape art in the theme's colours. Inline, so it is in the SSR HTML (never the
 * LCP fetch) and follows light/dark without a second file.
 */
export default function Illustration({ name, picture, className = '' }: Readonly<IllustrationProps>) {
    const shapes = picture?.shapes ?? (name ? ILLUSTRATIONS[name] : []);
    return (
        <svg
            viewBox={picture?.viewBox ?? ILLUSTRATION_VIEWBOX}
            width="100%"
            height="100%"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {shapes.map((shape, index) => (
                <path
                    // Two shapes of a picture UNA sends may share a path.
                    key={`${index}:${shape.d}`}
                    d={shape.d}
                    className={TONE_CLASS[shape.tone]}
                    fillRule={shape.evenOdd ? 'evenodd' : undefined}
                />
            ))}
        </svg>
    );
}
