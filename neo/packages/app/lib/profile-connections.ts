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

/** A card's data, as far as its counts go. */
export type CardCountsData = {
    module?: unknown;
    members_count?: unknown;
    members_list?: unknown;
    mutual_friends_count?: unknown;
    mutual_friends_list?: unknown;
    friends_count?: unknown;
    friends_list?: unknown;
    followers_count?: unknown;
    followers_list?: unknown;
    [key: string]: unknown;
} | null | undefined;

/** One count of a card's line: `labelKey` is its plural translation key ("members": "3 members"). */
export type CardCountPart = { key: string; count: number; labelKey: string };

/** A card's line has room for this many counts. */
export const CARD_COUNTS_MAX = 2;

function countOf(value: unknown): number {
    const count = Number(value);
    return Number.isFinite(count) && count > 0 ? count : 0;
}

/**
 * The counts a card shows under its name, as UNA's site card does, in its order: the members of a group, a space or
 * an organization (an event's are "going"), the friends (the ones shared with the viewer, when there are any), the
 * followers (an event's are "interested"). A count of zero is left out; the line has room for the first two.
 */
export function getCardCountParts(data: CardCountsData, max = CARD_COUNTS_MAX): CardCountPart[] {
    const isEvent = data?.module === 'bx_events';
    const mutual = countOf(data?.mutual_friends_count);
    return [
        { key: 'members', count: countOf(data?.members_count), labelKey: isEvent ? 'going' : 'members' },
        mutual
            ? { key: 'friends', count: mutual, labelKey: 'mutual_friends' }
            : { key: 'friends', count: countOf(data?.friends_count), labelKey: 'friends' },
        { key: 'followers', count: countOf(data?.followers_count), labelKey: isEvent ? 'intrested' : 'followers' },
    ].filter((part) => part.count > 0).slice(0, max);
}

/**
 * The lists the card's one group of avatars is merged from, in UNA's order
 * (BxBaseModGroupsModule::_getConnectionsPreviewIds): the members first, then the friends shared with the viewer,
 * the friends, the followers.
 */
export function getCardPreviewLists<T = ConnectionProfile>(data: CardCountsData): Array<T[] | null | undefined> {
    return [data?.members_list, data?.mutual_friends_list, data?.friends_list, data?.followers_list] as Array<T[] | null | undefined>;
}
