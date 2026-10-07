/** Parse `/tab0`… from a pathname. Leaf helper — no app imports (avoids require cycles). */

const TAB_IN_PATH_RE = /\/(tab\d+)(?:\/|$)/;

/** Canonical `/tabN`, or `null` if the path has no tab segment. */
export function parseTabKey(pathname: string | null | undefined) {
    const match = String(pathname || '').match(TAB_IN_PATH_RE);
    return match ? `/${match[1]}` : null;
}

/** Same as `parseTabKey`, with `/tab0` when the path is not a tab route. */
export function getTabKeyFromPathname(pathname: string | null | undefined) {
    return parseTabKey(pathname) || '/tab0';
}

/**
 * The bottom tab the user last selected (`/tab0`…). Lives here, not in
 * tab-history, so router helpers can read it without an import cycle.
 */
let selectedTabKey: string | null = null;

export function getSelectedTabKey() {
    return selectedTabKey;
}

export function setSelectedTabKey(key: string | null) {
    selectedTabKey = key;
}
