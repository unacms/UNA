/**
 * Hands media picked before a form exists to that form's files field.
 *
 * The feed composer's media button picks files first and then opens the post
 * form; the form's files field takes them when it mounts and uploads them as if
 * they had been picked inside the form. A field that is already mounted never
 * looks, so an entry only reaches a field the composer is about to open.
 * `unsupported` counts picks that were dropped, so the field can say so.
 */
const QUEUE_TTL_MS = 30_000;

export type PendingFieldAssets<T = unknown> = { assets: T[]; unsupported: number };

const pendingByField = new Map<string, PendingFieldAssets & { at: number }>();

export function queueFieldAssets(fieldName: string, assets: unknown[], unsupported = 0) {
    if (assets.length || unsupported)
        pendingByField.set(fieldName, { assets, unsupported, at: Date.now() });
}

export function takeFieldAssets<T = unknown>(fieldName: string): PendingFieldAssets<T> | null {
    const entry = pendingByField.get(fieldName);
    if (!entry)
        return null;
    pendingByField.delete(fieldName);
    if (Date.now() - entry.at > QUEUE_TTL_MS)
        return null;
    return { assets: entry.assets as T[], unsupported: entry.unsupported };
}
