/**
 * Hands media picked before a form exists to that form's files field.
 *
 * The feed composer's media button picks files first and then opens the post
 * form; the form's files field takes them when it mounts and uploads them as if
 * they had been picked inside the form. A field that is already mounted never
 * looks, so an entry only reaches a field the composer is about to open.
 */
const QUEUE_TTL_MS = 30_000;

const pendingByField = new Map<string, { assets: unknown[]; at: number }>();

export function queueFieldAssets(fieldName: string, assets: unknown[]) {
    if (assets.length)
        pendingByField.set(fieldName, { assets, at: Date.now() });
}

export function takeFieldAssets<T = unknown>(fieldName: string): T[] | null {
    const entry = pendingByField.get(fieldName);
    if (!entry)
        return null;
    pendingByField.delete(fieldName);
    return Date.now() - entry.at <= QUEUE_TTL_MS ? (entry.assets as T[]) : null;
}
