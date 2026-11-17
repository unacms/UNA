/**
 * A profile's card after a connection with it changed (the viewer followed it, a friend request was accepted): its
 * counts and the state of its friend and follow buttons, written into the lists that already hold the card, so no
 * list is requested again. UNA sends the new counts with the action's reply (`counts`), and the whole state for a
 * profile on request (`system/get_card_state/TemplServiceConnections`), which the apps ask for when the change came
 * from somewhere else (another tab or device, the other person).
 *
 * Cards live in the query cache as pages of list items (`lib/browse-query`). A profile's card is the item whose
 * `author_data.id` is the profile and which carries the counts; its buttons are the items of its `meta` menu whose
 * `data` names the connection (`o`) and the profile (`cid`). Every function returns what it was given when nothing
 * changes, so nothing re-renders.
 */
export const CARD_CONNECTIONS = ['sys_profiles_friends', 'sys_profiles_subscriptions'] as const;

const COUNT_KEYS = ['friends_count', 'followers_count'] as const;
const ELEMENT_KEYS = ['name', 'title', 'actions', 'a'] as const;

type Id = number | string;
type Dict = Record<string, any>;

export type CardCounts = { profile_id?: Id; friends_count?: number; followers_count?: number };
/** A button's new state: UNA's element (`connections_ext`: name, title, actions; `connections`: a, title). */
export type CardElement = { type?: string; name?: unknown; title?: unknown; actions?: unknown; a?: unknown };
export type ConnectionPatch = {
    profileId: Id;
    counts?: CardCounts | null;
    /** By connection object (`sys_profiles_friends` ...). */
    elements?: Record<string, CardElement | null | undefined> | null;
};

const sameId = (a: Id | null | undefined, b: Id | null | undefined) => a != null && b != null && String(a) === String(b);
const sameValue = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

export function isCardConnection(object: unknown): boolean {
    return typeof object === 'string' && (CARD_CONNECTIONS as readonly string[]).includes(object);
}

function patchCounts(item: Dict, patch: ConnectionPatch): Dict {
    const counts = patch.counts;
    if (!counts || !sameId(item.author_data?.id, patch.profileId)) return item;

    let next = item;
    for (const key of COUNT_KEYS) {
        const value = counts[key];
        // Only a count the card already shows: a post by the same author has none.
        if (typeof value !== 'number' || !(key in item) || Number(item[key]) === value) continue;
        if (next === item) next = { ...item };
        next[key] = value;
    }
    return next;
}

function patchButton(metaItem: Dict, patch: ConnectionPatch): Dict {
    const data = metaItem?.data;
    const element = data && patch.elements ? patch.elements[String(data.o)] : null;
    if (!element || !sameId(data.cid, patch.profileId)) return metaItem;
    // The two kinds of button keep different fields: one's state is not the other's.
    if (element.type && data.type && element.type !== data.type) return metaItem;

    let nextData = data;
    for (const key of ELEMENT_KEYS) {
        if (!(key in element) || element[key] === undefined || sameValue(data[key], element[key])) continue;
        if (nextData === data) nextData = { ...data };
        nextData[key] = element[key];
    }
    return nextData === data ? metaItem : { ...metaItem, data: nextData };
}

function patchButtons(item: Dict, patch: ConnectionPatch): Dict {
    const items = item.meta?.items;
    if (!patch.elements || !Array.isArray(items)) return item;

    let changed = false;
    const nextItems = items.map((metaItem: Dict) => {
        const next = patchButton(metaItem, patch);
        if (next !== metaItem) changed = true;
        return next;
    });
    return changed ? { ...item, meta: { ...item.meta, items: nextItems } } : item;
}

/** One list item with the patch applied; the same object when the patch is not about it. */
export function patchCardItem<T>(item: T, patch: ConnectionPatch): T {
    if (!item || typeof item !== 'object' || patch?.profileId == null) return item;
    return patchButtons(patchCounts(item as Dict, patch), patch) as T;
}

/** A list's cached pages (`{ pages: [{ data: [...] }] }`) with the patch applied; the same object when unchanged. */
export function patchListPages<T>(cached: T, patch: ConnectionPatch): T {
    const pages = (cached as Dict | null | undefined)?.pages;
    if (!Array.isArray(pages)) return cached;

    let changed = false;
    const nextPages = pages.map((page: Dict) => {
        if (!Array.isArray(page?.data)) return page;
        let pageChanged = false;
        const data = page.data.map((item: unknown) => {
            const next = patchCardItem(item, patch);
            if (next !== item) pageChanged = true;
            return next;
        });
        if (!pageChanged) return page;
        changed = true;
        return { ...page, data };
    });
    return changed ? ({ ...(cached as Dict), pages: nextPages } as T) : cached;
}

/** Whether a cached list holds this profile's card (worth a request for its state). */
export function listHasCard(cached: unknown, profileId: Id): boolean {
    const pages = (cached as Dict | null | undefined)?.pages;
    if (!Array.isArray(pages)) return false;
    return pages.some((page: Dict) => Array.isArray(page?.data) && page.data.some((item: Dict) =>
        sameId(item?.author_data?.id, profileId)
        || (Array.isArray(item?.meta?.items) && item.meta.items.some((metaItem: Dict) => sameId(metaItem?.data?.cid, profileId)))
    ));
}

/** The patch of an action's reply (`perform`): its counts and the pressed button's new state. */
export function patchFromReply(object: string, profileId: Id, reply: Dict | null | undefined, type: string): ConnectionPatch | null {
    if (!reply || typeof reply !== 'object' || profileId == null) return null;
    const element: CardElement = { type };
    for (const key of ELEMENT_KEYS) {
        if (reply[key] !== undefined) element[key] = reply[key];
    }
    const hasElement = element.title !== undefined;
    const counts = reply.counts && typeof reply.counts === 'object' ? reply.counts as CardCounts : null;
    if (!hasElement && !counts) return null;
    return { profileId, counts, elements: hasElement ? { [object]: element } : null };
}

/** The patch of UNA's card state (`get_card_state`). */
export function patchFromCardState(state: Dict | null | undefined): ConnectionPatch | null {
    if (!state || typeof state !== 'object' || state.profile_id == null) return null;
    return {
        profileId: state.profile_id,
        counts: state.counts && typeof state.counts === 'object' ? state.counts : null,
        elements: state.elements && typeof state.elements === 'object' && !Array.isArray(state.elements) ? state.elements : null,
    };
}

/** The other profile of a connection event on the viewer's channel; null when the event is not about a card. */
export function cardProfileOfEvent(event: Dict | null | undefined, viewerId: Id): Id | null {
    if (!event || !isCardConnection(event.object)) return null;
    const { initiator, content } = event;
    if (initiator == null || content == null) return null;
    if (sameId(initiator, viewerId)) return sameId(content, viewerId) ? null : content;
    return sameId(content, viewerId) ? initiator : null;
}
