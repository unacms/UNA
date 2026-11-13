/**
 * A feed entry about a profile itself ("Muha joined"): the entry's object is its author's own
 * profile, so its page is a profile page, not a content page.
 */

type FeedEntry = {
    type?: string;
    url?: string;
    author_data?: { module?: string; url?: string } | null;
};

/** A UNA link as a path to compare: no origin, query, hash or slashes around it. */
function linkPath(url?: string): string {
    if (!url) return ''
    const ends = [url.indexOf('?'), url.indexOf('#')].filter((i) => i >= 0)
    let path = ends.length ? url.slice(0, Math.min(...ends)) : url
    const scheme = path.indexOf('://')
    if (scheme > 0) {
        const slash = path.indexOf('/', scheme + 3)
        path = slash < 0 ? '' : path.slice(slash)
    }
    return path.split('/').filter(Boolean).join('/')
}

export function isProfileFeedEntry(entry?: FeedEntry | null): boolean {
    const author = entry?.author_data
    if (!entry?.type || !author?.module || entry.type !== author.module) return false
    const path = linkPath(entry.url)
    return path !== '' && path === linkPath(author.url)
}
