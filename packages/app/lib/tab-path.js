/** Parse `/tab0`… from a pathname. Leaf helper — no app imports (avoids require cycles). */

const TAB_IN_PATH_RE = /\/(tab\d+)(?:\/|$)/;

/** Canonical `/tabN`, or `null` if the path has no tab segment. */
export function parseTabKey(pathname) {
    const match = String(pathname || '').match(TAB_IN_PATH_RE);
    return match ? `/${match[1]}` : null;
}

/** Same as `parseTabKey`, with `/tab0` when the path is not a tab route. */
export function getTabKeyFromPathname(pathname) {
    return parseTabKey(pathname) || '/tab0';
}
