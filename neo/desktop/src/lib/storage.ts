/**
 * What the page keeps in localStorage, on this computer: conveniences (a folded section, a
 * width, the theme, the last site). The storage may be missing, blocked (a private window) or
 * full, and nothing kept here is worth an error on screen: a read that fails finds nothing, and
 * a write that fails keeps nothing, so the choice lasts until the app quits.
 */

/** The string kept under a key; null when there is none or the storage can't be read. */
export function readStored(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/** Keep a string under a key; null takes the key out, for a value that is the default again. */
export function writeStored(key: string, value: string | null): void {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        // nowhere to keep it
    }
}

export function removeStored(key: string): void {
    writeStored(key, null);
}

/**
 * The value kept as JSON under a key; undefined when there is none or it can't be read as JSON.
 * What comes back was written by any version of the app, or by hand: the caller checks its shape.
 */
export function readStoredJson(key: string): unknown {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? undefined : (JSON.parse(raw) as unknown);
    } catch {
        return undefined;
    }
}

/** Keep a value as JSON under a key. */
export function writeStoredJson(key: string, value: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // nowhere to keep it, or not a value JSON can write
    }
}
