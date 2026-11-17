import type { Query } from '@tanstack/react-query';
import { fetcher } from 'app/lib/fetcher';
import emitter, { EVENTS } from 'app/context/emitter';
import { getQueryClient } from 'app/lib/platform/query-client';
import { createPatchKeeper } from 'app/lib/patch-keeper';
import { listHasCard, patchFromCardState, patchListPages, type ConnectionPatch } from 'app/lib/connection-patch';

/**
 * Profile cards in the query cache follow a connection change without their lists being requested again
 * (lib/connection-patch.ts has the rules and the tests). `applyConnectionPatch` writes an action's reply into every
 * cached list; `refreshCardFromServer` asks UNA for one profile's state when the change came from elsewhere.
 */
type Id = number | string;

/** The `EVENTS.connections` action sent when a profile's connection state was written into the lists. */
export const CONNECTION_PATCHED = 'patched';

const CARD_STATE_URL = '/api.php?r=system/get_card_state/TemplServiceConnections&params[]=';
/** A socket event that follows this tab's own action brings nothing its reply didn't. */
const OWN_ACTION_MS = 5000;
const REFRESH_DELAY_MS = 400;

const ownActions = new Map<string, number>();
const refreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

const isListQuery = (query: Query) => Array.isArray((query.state.data as { pages?: unknown } | undefined)?.pages);

let keeper: ReturnType<typeof createPatchKeeper<ConnectionPatch>> | null = null;

export function applyConnectionPatch(patch: ConnectionPatch | null | undefined, { own = false } = {}): void {
    if (!patch || patch.profileId == null) return;
    if (own) ownActions.set(String(patch.profileId), Date.now());
    // Written into every cached list, and again over a list answer that left UNA before the change (patch-keeper.ts).
    keeper ??= createPatchKeeper(getQueryClient(), patchListPages);
    keeper.apply(patch);
    // A page that shows this profile outside a list (its own page: the cover's counts and actions) refreshes that
    // part itself (components/page-layout/profile.js). `Layouts` reloads a page only on 'changed'.
    emitter.emit(EVENTS.connections, { action: CONNECTION_PATCHED, profileId: patch.profileId });
}

function isOwnRecentAction(profileId: Id): boolean {
    const at = ownActions.get(String(profileId));
    if (at === undefined) return false;
    if (Date.now() - at < OWN_ACTION_MS) return true;
    ownActions.delete(String(profileId));
    return false;
}

function hasCardInCache(profileId: Id): boolean {
    return getQueryClient().getQueryCache().findAll({ predicate: isListQuery })
        .some((query) => listHasCard(query.state.data, profileId));
}

/**
 * The viewer's connection with a profile changed somewhere else: update its cards here. One small request per
 * profile, only when a list in this app shows its card, and not for the change this tab just made itself. UNA
 * sends several events for one change (a friendship is two connections), so requests are held for a moment.
 */
export function refreshCardFromServer(profileId: Id | null | undefined): void {
    if (profileId == null || isOwnRecentAction(profileId) || !hasCardInCache(profileId)) return;

    const key = String(profileId);
    clearTimeout(refreshTimers.get(key));
    refreshTimers.set(key, setTimeout(async () => {
        refreshTimers.delete(key);
        try {
            const response = await fetcher(CARD_STATE_URL + encodeURIComponent(JSON.stringify({ cid: profileId })), false, { silent: true });
            applyConnectionPatch(patchFromCardState(response?.data));
        } catch {
            // The card keeps what it shows; the next load of its list corrects it.
        }
    }, REFRESH_DELAY_MS));
}
