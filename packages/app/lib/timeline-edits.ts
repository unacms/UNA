import { subscribe } from 'app/ui/atoms/socket';

/**
 * One `bx_timeline_0` `edited` binding for every feed card on screen. Each card
 * used to bind its own handler, so one edit ran (and JSON-parsed) once per card;
 * now the payload is parsed once and only the edited card's listeners run.
 */

const listeners = new Map<string, Set<() => unknown>>();
let unsubscribeSocket: (() => void) | null = null;

/** Timeline socket payload: a JSON string or an object (`{ id, author_id, peformer_id }`). */
function editedId(payload: unknown): string | null {
    let event: unknown = payload;
    if (typeof payload === 'string') {
        try {
            event = JSON.parse(payload);
        } catch {
            return null;
        }
    }
    const id = event && typeof event === 'object' ? (event as { id?: unknown }).id : undefined;
    return id == null ? null : String(id);
}

function onEdited(payload: unknown) {
    const id = editedId(payload);
    if (id == null) return;
    listeners.get(id)?.forEach((listener) => {
        // A failed reload keeps the card as it is; the next edit retries.
        Promise.resolve().then(listener).catch(() => {});
    });
}

/** Call `listener` when the timeline event `id` is edited; returns the unsubscribe function. */
export function subscribeTimelineEdit(id: number | string, listener: () => unknown): () => void {
    const key = String(id);
    let set = listeners.get(key);
    if (!set) {
        set = new Set();
        listeners.set(key, set);
    }
    set.add(listener);
    if (!unsubscribeSocket) unsubscribeSocket = subscribe('bx_timeline_0', 'edited', onEdited);

    return () => {
        const current = listeners.get(key);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) listeners.delete(key);
        if (listeners.size === 0 && unsubscribeSocket) {
            unsubscribeSocket();
            unsubscribeSocket = null;
        }
    };
}
