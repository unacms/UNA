/**
 * The icon the header's main menu draws for a section (a conductor page): the icon of the site menu's item that links
 * to one of the section's pages. The section header shows it, so both draw the same icon; the section's own menu often
 * has another one (`building` for Orgs where the site menu has `building-columns`).
 */

type SiteMenuItem = { icon?: unknown; link?: unknown; items?: unknown; subitems?: unknown } | null | undefined;

/** A link as a bare path: no origin, query, hash or outer slashes (`/persons-home?x=1` → `persons-home`). */
export function sectionLinkPath(link: unknown): string {
    if (typeof link !== 'string') return '';
    return link.trim()
        .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '')
        .replace(/[?#].*$/, '')
        .replace(/^\/+|\/+$/g, '');
}

/** UNA's icon name of the first item, at any depth, that links to one of `pages`; null when none does. */
export function siteMenuIconForPages(items: unknown, pages: readonly unknown[]): string | null {
    const wanted = new Set(pages.map(sectionLinkPath).filter(Boolean));
    if (!wanted.size) return null;

    const walk = (list: unknown): string | null => {
        const rows: SiteMenuItem[] = Array.isArray(list)
            ? list
            : list && typeof list === 'object' ? Object.values(list) : [];
        for (const item of rows) {
            if (!item || typeof item !== 'object') continue;
            if (typeof item.icon === 'string' && item.icon && wanted.has(sectionLinkPath(item.link))) return item.icon;
            const found = walk(item.subitems ?? item.items);
            if (found) return found;
        }
        return null;
    };
    return walk(items);
}
