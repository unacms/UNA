/** A fresh Idempotency-Key: a UUID, or 32 random hex digits where randomUUID is missing. */
export function newIdempotencyKey(): string {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** What a write was last sent with: its body and the key it went with. */
export type IdempotencySlot = { current: { body: string; key: string } | null };

/**
 * Whether an answer says nothing of the first sending of its request, so that one's answer may
 * still be there for the same key:
 * - 409: the first one still runs (`idempotency_in_progress`).
 * - 429: the site's rate limit answers before it looks at the key (BxDolApiV2Router), so a first
 *   sending whose answer was lost may be done, or still running.
 * - a server error: a gateway's 502 or 504 while the site works on, a 503 or 500 from before the
 *   key was looked at, a 500 after part of the work.
 * Keeping the key on these never leaves a form replaying a failure: the site stores none of them
 * (BxDolApiV2Idempotency::isStorable) and lets its claim on the key go, so the same key either
 * runs the write again or gets the first sending's stored answer. After a request that died the
 * same key is answered 409 for up to a minute, then runs.
 */
export function saysNothingOfFirstSending(status: number): boolean {
    return status === 409 || status === 429 || status >= 500;
}

/**
 * After an answer came: the write is settled (its key is let go, so sending it again is a write
 * of its own), unless the answer says nothing of the first sending (`saysNothingOfFirstSending`):
 * the key stays then, and the same body sent again goes with it. A write whose answer never came
 * keeps its key: do not call this then.
 */
export function settleIdempotency(slot: IdempotencySlot, status: number): void {
    if (!saysNothingOfFirstSending(status)) slot.current = null;
}

/**
 * The Idempotency-Key for a write of this body: the one it was sent with before when the body is
 * the same (a retry after an answer that never came gets the site's first answer, not a second
 * poll or post), else a new one. Clear the slot once the write is done, so the same text written
 * again later is a write of its own.
 */
export function idempotencyKeyFor(slot: IdempotencySlot, body: unknown): string {
    const json = JSON.stringify(body);
    if (slot.current?.body !== json) slot.current = { body: json, key: newIdempotencyKey() };
    return slot.current.key;
}
