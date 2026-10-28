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
export default function Illustration({ name, className = '' }: Readonly<IllustrationProps>) {
    return (
        <svg
            viewBox={ILLUSTRATION_VIEWBOX}
            width="100%"
            height="100%"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {ILLUSTRATIONS[name].map((shape) => (
                <path
                    key={shape.d}
                    d={shape.d}
                    className={TONE_CLASS[shape.tone]}
                    fillRule={shape.evenOdd ? 'evenodd' : undefined}
                />
            ))}
        </svg>
    );
}
