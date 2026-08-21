/** Parse `/tab0`… from a pathname. Leaf helper — no app imports (avoids require cycles). */
export function getTabKeyFromPathname(pathname) {
    const match = String(pathname || '').match(/\/(tab\d+)(?:\/|$)/);
    return match ? `/${match[1]}` : '/tab0';
}
