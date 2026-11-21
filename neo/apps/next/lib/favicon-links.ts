/**
 * The browser tab icons of a page: the favicons uploaded in UNA's Designer (Studio > Designer > Icon) when the page
 * says there are any, else the build's own files. A dark mode icon is linked with `media`, which Chrome, Firefox and
 * Safari all follow for tab icons; Chrome ignores the `prefers-color-scheme` style inside an SVG favicon, so one
 * adaptive SVG isn't enough there. UNA's site switches the same pair with a script (template/meta_icons.html).
 */

/** UNA's page payload `icons` (BxBaseFunctions::getUploadedFaviconUrls): '' for each one not uploaded. */
export type UnaPageIcons = {
    fav?: unknown;
    svg?: unknown;
    dark?: unknown;
};

export type FaviconLink = {
    url: string;
    type?: string;
    sizes?: string;
    media?: string;
};

const LIGHT = '(prefers-color-scheme: light)';
const DARK = '(prefers-color-scheme: dark)';

function httpUrl(value: unknown): string {
    return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : '';
}

function typeOf(url: string): string | undefined {
    const path = url.split(/[?#]/)[0]?.toLowerCase() ?? '';
    if (path.endsWith('.svg')) return 'image/svg+xml';
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.ico')) return 'image/x-icon';
    return undefined;
}

function link(url: string, media?: string): FaviconLink {
    const type = typeOf(url);
    return { url, ...(type && { type }), ...(media && { media }) };
}

/**
 * @param icons    the page's `icons`, or nothing from an older UNA
 * @param base     where the build's files are: '/' or '/static/' (a client project's)
 * @param iconPng  the build's 192px PNG, for clients without SVG icons (link previews)
 */
export function faviconLinks(icons: UnaPageIcons | null | undefined, base: string, iconPng: string): FaviconLink[] {
    const fav = httpUrl(icons?.fav);
    const svg = httpUrl(icons?.svg);
    const dark = httpUrl(icons?.dark);
    const light = svg || fav;

    // Nothing uploaded: the build's icons, the default glyph in dark ink and in white. The SVG goes last, for
    // browsers that take the last icon they can use.
    if (!light) {
        const links: FaviconLink[] = [{ url: iconPng, type: 'image/png', sizes: '192x192' }];
        if (dark)
            return [...links, link(`${base}favicon.svg`, LIGHT), link(dark, DARK)];

        return [...links, link(`${base}favicon.svg`, LIGHT), link(`${base}favicon-dark.svg`, DARK)];
    }

    // Designer's favicon.ico first, for browsers without SVG icons, then the SVG; the dark one only on dark tabs.
    const links: FaviconLink[] = [];
    if (fav && svg)
        links.push({ ...link(fav), sizes: 'any' });

    if (!dark)
        return [...links, link(light)];

    return [...links, link(light, LIGHT), link(dark, DARK)];
}
