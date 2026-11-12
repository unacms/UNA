import { describe, expect, it, vi } from 'vitest';

import { ApiError, isApiOff, retryOnce } from './api';
import { ApiAvailability, type AvailabilityBackend, offCode } from './api-availability';

const SITE = 'https://community.example';

function fake(known: Record<string, unknown> = {}) {
    let change: (c: { site?: unknown; code?: unknown }) => void = () => {};
    const asked: string[] = [];
    const checked: string[] = [];
    const answers: (() => Promise<unknown>)[] = [];
    const backend: AvailabilityBackend = {
        get: (site) => {
            asked.push(site);
            return Promise.resolve(known[site] ?? null);
        },
        check: (site) => {
            checked.push(site);
            return (answers.shift() ?? (() => Promise.resolve(null)))();
        },
        onChange: (cb) => {
            change = cb;
            return Promise.resolve(() => {});
        },
    };
    return { backend, asked, checked, answers, change: (c: { site?: unknown; code?: unknown }) => change(c) };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('a network whose API is turned off', () => {
    it('reads only the two codes', () => {
        expect(offCode('api_v2_disabled')).toBe('api_v2_disabled');
        expect(offCode('api_disabled')).toBe('api_disabled');
        for (const other of ['maintenance', '', null, undefined, 503, {}]) expect(offCode(other)).toBeNull();
    });

    it('keeps each site apart and tells its listeners each change once', async () => {
        const f = fake();
        const availability = new ApiAvailability(f.backend);
        const heard = vi.fn();
        availability.subscribe(heard);
        availability.watch(SITE);
        await settle();

        f.change({ site: SITE, code: 'api_v2_disabled' });
        f.change({ site: `${SITE}/`, code: 'api_v2_disabled' });
        expect(availability.codeOf(SITE)).toBe('api_v2_disabled');
        expect(availability.codeOf(`${SITE}/`)).toBe('api_v2_disabled');
        expect(availability.codeOf('https://other.example')).toBeNull();
        expect(heard).toHaveBeenCalledTimes(1);

        // something that is not a change of a site says nothing
        f.change({ code: 'api_disabled' });
        f.change({ site: 7, code: 'api_disabled' });
        expect(heard).toHaveBeenCalledTimes(1);

        // a code this page does not know is the API answering, as far as it can tell
        f.change({ site: SITE, code: null });
        expect(availability.codeOf(SITE)).toBeNull();
        expect(heard).toHaveBeenCalledTimes(2);
    });

    it('asks Rust once how a site stands when a page loads while it is off', async () => {
        const f = fake({ [SITE]: 'api_disabled' });
        const availability = new ApiAvailability(f.backend);
        availability.watch(`${SITE}/`);
        availability.watch(SITE);
        await settle();
        expect(f.asked).toEqual([SITE]);
        expect(availability.codeOf(SITE)).toBe('api_disabled');
    });

    it('a change heard while Rust is asked is not undone by the older answer', async () => {
        const f = fake();
        const availability = new ApiAvailability(f.backend);
        availability.watch(SITE);
        f.change({ site: SITE, code: 'api_v2_disabled' });
        await settle();
        expect(availability.codeOf(SITE)).toBe('api_v2_disabled');
    });

    it('asks the site again on request, and keeps what was known when it cannot be reached', async () => {
        const f = fake();
        const availability = new ApiAvailability(f.backend);
        availability.set(SITE, 'api_v2_disabled');

        f.answers.push(() => Promise.resolve('api_v2_disabled'));
        await expect(availability.check(SITE)).resolves.toBe('api_v2_disabled');
        expect(availability.codeOf(SITE)).toBe('api_v2_disabled');

        f.answers.push(() => Promise.reject('Could not reach the network: timed out'));
        await expect(availability.check(SITE)).rejects.toBe('Could not reach the network: timed out');
        expect(availability.codeOf(SITE)).toBe('api_v2_disabled');

        f.answers.push(() => Promise.resolve(null));
        await expect(availability.check(SITE)).resolves.toBeNull();
        expect(availability.codeOf(SITE)).toBeNull();
        expect(f.checked).toEqual([SITE, SITE, SITE]);
    });
});

describe('an answer of Rust that is older than a change already heard', () => {
    type Told = { site?: unknown; code?: unknown; seq?: unknown };

    /** A backend whose answers are given by hand, each when the test says. */
    function slow() {
        let change: (c: Told) => void = () => {};
        const waiting: ((answer: unknown) => void)[] = [];
        const later = () => new Promise<unknown>((resolve) => waiting.push(resolve));
        const backend: AvailabilityBackend = {
            get: later,
            check: later,
            onChange: (cb) => {
                change = cb;
                return Promise.resolve(() => {});
            },
        };
        return { backend, change: (c: Told) => change(c), answer: (a: unknown) => waiting.shift()?.(a), waiting };
    }

    // as Rust says them, numbered, and as a bare code (which the page orders by what it heard since it asked)
    const ways = [
        { name: 'numbered', back: { site: SITE, code: null, seq: 2 }, off: { site: SITE, code: 'api_v2_disabled', seq: 1 }, on: { code: null, seq: 0 }, stale: { code: 'api_v2_disabled', seq: 1 } },
        { name: 'bare', back: { site: SITE, code: null }, off: { site: SITE, code: 'api_v2_disabled' }, on: null, stale: 'api_v2_disabled' },
    ];

    for (const way of ways) {
        it(`the first read does not put back "off" after the API is back (${way.name})`, async () => {
            const f = slow();
            const availability = new ApiAvailability(f.backend);
            const told = vi.fn();
            availability.subscribe(told);
            availability.watch(SITE);
            await settle();
            expect(f.waiting).toHaveLength(1);
            // Rust read "off" (after its change 1), then the site answered (change 2): the event first
            f.change(way.back);
            f.answer(way.stale);
            await settle();
            expect(availability.codeOf(SITE)).toBeNull();
            expect(told).not.toHaveBeenCalled();
        });

        it(`a check does not put back "off" after the API is back (${way.name})`, async () => {
            const f = slow();
            const availability = new ApiAvailability(f.backend);
            availability.watch(SITE);
            await settle();
            f.answer(way.on);
            f.change(way.off);
            expect(availability.codeOf(SITE)).toBe('api_v2_disabled');

            const checked = availability.check(SITE);
            // the check got a maintenance page (off still, change 1); a request found the API back meanwhile
            f.change(way.back);
            f.answer(way.stale);
            // what the banner is told is how the site stands, not the older answer
            await expect(checked).resolves.toBeNull();
            expect(availability.codeOf(SITE)).toBeNull();
        });
    }

    it('two changes told out of order end as the later one', async () => {
        const f = slow();
        const availability = new ApiAvailability(f.backend);
        availability.watch(SITE);
        await settle();
        f.change({ site: SITE, code: null, seq: 4 });
        f.change({ site: SITE, code: 'api_disabled', seq: 3 });
        expect(availability.codeOf(SITE)).toBeNull();
        // another site's later change says nothing of this one, and a newer one is taken
        f.change({ site: 'https://other.example', code: 'api_disabled', seq: 5 });
        f.change({ site: SITE, code: 'api_v2_disabled', seq: 6 });
        expect(availability.codeOf(SITE)).toBe('api_v2_disabled');
        expect(availability.codeOf('https://other.example')).toBe('api_disabled');
    });

    it('an answer no older than the last change is taken, off or back', async () => {
        const f = slow();
        const availability = new ApiAvailability(f.backend);
        availability.watch(SITE);
        await settle();
        f.change({ site: SITE, code: 'api_v2_disabled', seq: 1 });
        // read after change 2, whose event is still on its way
        f.answer({ code: null, seq: 2 });
        await settle();
        expect(availability.codeOf(SITE)).toBeNull();
        f.change({ site: SITE, code: null, seq: 2 });
        const checked = availability.check(SITE);
        f.answer({ code: 'api_disabled', seq: 3 });
        await expect(checked).resolves.toBe('api_disabled');
    });

    it('asks how a site stands only once its changes are heard', async () => {
        let listening: () => void = () => {};
        const asked: string[] = [];
        const backend: AvailabilityBackend = {
            get: (site) => {
                asked.push(site);
                return Promise.resolve({ code: null, seq: 0 });
            },
            check: () => Promise.resolve(null),
            onChange: () => new Promise((resolve) => (listening = () => resolve(() => {}))),
        };
        const availability = new ApiAvailability(backend);
        availability.watch(SITE);
        await settle();
        expect(asked).toEqual([]);
        listening();
        await settle();
        expect(asked).toEqual([SITE]);
    });
});

describe('a request the site answers with its API turned off', () => {
    it('is not a failure to try again', () => {
        const v2 = new ApiError('API v2 is turned off on this network', 503, 'api_v2_disabled');
        const all = new ApiError('The API is turned off on this network', 503, 'api_disabled');
        const maintenance = new ApiError('The site answered 503', 503);
        expect(isApiOff(v2)).toBe(true);
        expect(isApiOff(all)).toBe(true);
        expect(isApiOff(maintenance)).toBe(false);
        expect(isApiOff(new ApiError('Gone', 410, 'api_v2_disabled'))).toBe(false);
        expect(isApiOff(new TypeError('unreachable'))).toBe(false);

        expect(retryOnce(0, v2)).toBe(false);
        expect(retryOnce(0, all)).toBe(false);
        // a server error that says nothing is still tried once more
        expect(retryOnce(0, maintenance)).toBe(true);
        expect(retryOnce(1, maintenance)).toBe(false);
    });
});
