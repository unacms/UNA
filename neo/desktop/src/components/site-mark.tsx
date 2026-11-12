import type { CSSProperties } from 'react';

import { monogram, type SiteInfo } from '../lib/branding';
import { mediaSrc, usePicture } from '../lib/media';

type Props = {
    site: Pick<SiteInfo, 'name' | 'mark' | 'markDark' | 'icon'>;
    /** The site the pictures are of (the signed-in one, or on the sign-in screen the one found). */
    siteUrl: string;
    size: number;
    className?: string;
};

/**
 * A network's square mark: the site's (its dark variant in the dark theme, tokens.css picks
 * it, so the theme switch needs no render), else its home screen icon, else a monogram tile
 * in the accent. Decorative: the name is always said next to it.
 */
export function SiteMark({ site, siteUrl, size, className }: Props) {
    const light = usePicture(mediaSrc(site.mark, siteUrl));
    const dark = usePicture(mediaSrc(site.markDark, siteUrl));
    const icon = usePicture(mediaSrc(site.icon, siteUrl));
    const style = { '--size': `${size}px` } as CSSProperties;
    const classes = `site-mark${className ? ` ${className}` : ''}`;
    const img = (picture: typeof light, variant?: 'light' | 'dark') =>
        picture.src ? (
            <img
                key={variant ?? 'icon'}
                className={classes}
                data-variant={variant}
                src={picture.src}
                alt=""
                width={size}
                height={size}
                style={style}
                decoding="async"
                referrerPolicy="no-referrer"
                onError={picture.onError}
                onLoad={picture.onLoad}
            />
        ) : null;

    if (light.src) return dark.src && dark.src !== light.src ? [img(light, 'light'), img(dark, 'dark')] : img(light);
    if (dark.src) return img(dark);
    if (icon.src) return img(icon);
    return (
        <span className={`${classes} site-mark-mono`} aria-hidden="true" style={{ ...style, fontSize: Math.round(size * 0.5) }}>
            {monogram(site.name)}
        </span>
    );
}
