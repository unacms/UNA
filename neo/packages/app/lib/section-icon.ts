/**
 * The icon the header's main menu draws for a section (a conductor page): the icon of the site menu's item that links
 * to one of the section's pages. The section header shows it, so both draw the same icon; the section's own menu often
 * has another one (`building` for Orgs where the site menu has `building-columns`).
 */

type SiteMenuItem = { icon?: unknown; link?: unknown; items?: unknown; subitems?: unknown } | null | undefined;

/** A link as a bare path: no origin, query, hash or outer slashes (`/persons-home?x=1` → `persons-home`). */
export function sectionLinkPath(link: unknown): string {
    if (typeof link !== 'string') return '';
    let path = link.trim();
    // String scans, not regular expressions: linear on any input.
    const scheme = path.indexOf('://');
    if (scheme > 0) {
        const slash = path.indexOf('/', scheme + 3);
        path = slash < 0 ? '' : path.slice(slash);
    }
    const end = path.search(/[?#]/);
    if (end >= 0) path = path.slice(0, end);
    let start = 0;
    let stop = path.length;
    while (start < stop && path[start] === '/') start++;
    while (stop > start && path[stop - 1] === '/') stop--;
    return path.slice(start, stop);
}

/** A menu's items as an array: UNA sends a list, or an object keyed by name. */
function menuRows(list: unknown): SiteMenuItem[] {
    if (Array.isArray(list)) return list;
    if (list && typeof list === 'object') return Object.values(list);
    return [];
}

/** UNA's icon name of the first item, at any depth, that links to one of `pages`; null when none does. */
export function siteMenuIconForPages(items: unknown, pages: readonly unknown[]): string | null {
    const wanted = new Set(pages.map(sectionLinkPath).filter(Boolean));
    if (!wanted.size) return null;

    const walk = (list: unknown): string | null => {
        for (const item of menuRows(list)) {
            if (!item || typeof item !== 'object') continue;
            if (typeof item.icon === 'string' && item.icon && wanted.has(sectionLinkPath(item.link))) return item.icon;
            const found = walk(item.subitems ?? item.items);
            if (found) return found;
        }
        return null;
    };
    return walk(items);
}
