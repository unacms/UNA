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
