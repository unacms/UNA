import { describe, expect, it } from 'vitest';

import { idempotencyKeyFor, type IdempotencySlot, saysNothingOfFirstSending, settleIdempotency } from './idempotency';

const body = ['/albums', { title: 'Sea', media_ids: [1, 2] }];

/** The keys the same body goes with before and after an answer of this status. */
function keysAround(status: number): { first: string; next: string } {
    const slot: IdempotencySlot = { current: null };
    const first = idempotencyKeyFor(slot, body);
    settleIdempotency(slot, status);
    return { first, next: idempotencyKeyFor(slot, body) };
}

describe('settleIdempotency', () => {
    it('keeps the key while the first sending still runs (409)', () => {
        const { first, next } = keysAround(409);
        expect(next).toBe(first);
    });

    it('keeps the key on 429: the rate limit answers before the key is looked at', () => {
        const { first, next } = keysAround(429);
        expect(next).toBe(first);
    });

    it.each([500, 502, 503, 504])('keeps the key on a server error (%i), which the site never stores', (status) => {
        const { first, next } = keysAround(status);
        expect(next).toBe(first);
    });

    it.each([200, 201, 204, 400, 401, 403, 404, 422])('lets the key go on an answer that settles the write (%i)', (status) => {
        const { first, next } = keysAround(status);
        expect(next).not.toBe(first);
    });

    it('sends the same key after a lost answer and then a 429, until an answer settles the write', () => {
        const slot: IdempotencySlot = { current: null };
        // sent, the answer never came: the slot is not settled
        const first = idempotencyKeyFor(slot, body);
        // sent again: 429
        expect(idempotencyKeyFor(slot, body)).toBe(first);
        settleIdempotency(slot, 429);
        // and again: the site's stored answer to the first one, and only then a new key
        expect(idempotencyKeyFor(slot, body)).toBe(first);
        settleIdempotency(slot, 201);
        expect(idempotencyKeyFor(slot, body)).not.toBe(first);
    });

    it('takes a changed body as a write of its own, whatever the last answer was', () => {
        const slot: IdempotencySlot = { current: null };
        const first = idempotencyKeyFor(slot, body);
        settleIdempotency(slot, 429);
        expect(idempotencyKeyFor(slot, ['/albums', { title: 'Sky' }])).not.toBe(first);
    });
});

describe('saysNothingOfFirstSending', () => {
    it('is true for 409, 429 and server errors only', () => {
        expect([409, 429, 500, 502, 503, 504].every((s) => saysNothingOfFirstSending(s))).toBe(true);
        expect([200, 201, 400, 403, 404, 408, 422].some((s) => saysNothingOfFirstSending(s))).toBe(false);
    });
});
