/**
 * One group of avatars for a profile's connections. UNA sends the first profiles of each list on its own (the
 * friends a viewer shares with the profile, its friends, its followers), and a friend is usually a follower too, so a
 * group per count showed the same faces twice. The lists are merged in the order given, each person once, without
 * the viewer: their own avatar says nothing new next to a "Following" button. UNA's site does the same
 * (BxBaseModProfileModule::getConnectionsPreviewIds).
 */
export type ConnectionProfile = {
    id?: unknown;
    module?: unknown;
    author_data?: { id?: unknown } | null;
    [key: string]: unknown;
} | null | undefined;

/** How many avatars the group shows. */
export const CONNECTIONS_PREVIEW_MAX = 3;

/** A profile's id: a list entry is a card with its profile in `author_data`, or the profile itself. */
export function connectionProfileId(profile: ConnectionProfile): string {
    const id = profile?.author_data?.id ?? profile?.id;
    return id === undefined || id === null || id === '' ? '' : String(id);
}

export function mergeConnectionProfiles<T extends ConnectionProfile>(
    lists: ReadonlyArray<readonly T[] | null | undefined>,
    { max = CONNECTIONS_PREVIEW_MAX, exclude }: { max?: number; exclude?: unknown } = {},
): T[] {
    const skip = exclude === undefined || exclude === null || exclude === false || exclude === '' ? '' : String(exclude);
    const seen = new Set<string>();
    const merged: T[] = [];
    for (const list of lists) {
        if (!Array.isArray(list)) continue;
        for (const profile of list) {
            const id = connectionProfileId(profile);
            if (!id || id === skip || seen.has(id)) continue;
            seen.add(id);
            merged.push(profile);
            if (merged.length >= max) return merged;
        }
    }
    return merged;
}

type ListItem = { list?: unknown; [key: string]: unknown };

/**
 * A menu whose items carry their own lists (a profile page's friends and followers counts): the first of them takes
 * the merged group, the others keep their count alone. Items without a list, and a menu with one list, stay as they
 * are (but for the viewer and a person listed twice).
 */
export function withMergedItemLists<T extends ListItem>(
    items: readonly T[] | null | undefined,
    options: { max?: number; exclude?: unknown } = {},
): T[] {
    const all = Array.isArray(items) ? [...items] : [];
    const withList = all.filter((item) => Array.isArray(item?.list) && (item.list as unknown[]).length > 0);
    if (!withList.length) return all;

    const merged = mergeConnectionProfiles(withList.map((item) => item.list as ConnectionProfile[]), options);
    const first = withList[0];
    return all.map((item) => {
        if (!withList.includes(item)) return item;
        const next = { ...item };
        if (item === first && merged.length) next.list = merged;
        else delete next.list;
        return next;
    });
}
