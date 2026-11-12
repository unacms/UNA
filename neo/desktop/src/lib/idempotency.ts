/** A fresh Idempotency-Key: a UUID, or 32 random hex digits where randomUUID is missing. */
export function newIdempotencyKey(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** What a write was last sent with: its body and the key it went with. */
export type IdempotencySlot = { current: { body: string; key: string } | null };

/**
 * The Idempotency-Key for a write of this body: the one it was sent with before when the body is
 * the same (a retry after an answer that never came gets the site's first answer, not a second
 * poll or post), else a new one. Clear the slot once the write is done, so the same text written
 * again later is a write of its own.
 */
/**
 * After an answer came: the write is settled (its key is let go, so sending it again is a write
 * of its own), unless the site said the first one still runs (409 `idempotency_in_progress`),
 * whose answer the same key gets later. A write whose answer never came keeps its key: do not
 * call this then. (What an answer says of the uploads a request names is a wider question, with
 * its own rule: `saysNothingOfUploads` in photo-uploads.)
 */
export function settleIdempotency(slot: IdempotencySlot, status: number): void {
    if (status !== 409) slot.current = null;
}

export function idempotencyKeyFor(slot: IdempotencySlot, body: unknown): string {
    const json = JSON.stringify(body);
    if (slot.current?.body !== json) slot.current = { body: json, key: newIdempotencyKey() };
    return slot.current.key;
}
