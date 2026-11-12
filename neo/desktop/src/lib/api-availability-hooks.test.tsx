import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiAvailability, type AvailabilityBackend, useReloadWhenApiBack, useRetryWithCheck } from './api-availability';

const SITE = 'https://community.example';

type Change = { site?: unknown; code?: unknown };

/** Rust's event as a window hears it, and how many still listen. */
function events() {
    const heard = new Set<(c: Change) => void>();
    const changes: AvailabilityBackend['onChange'] = (cb) => {
        heard.add(cb);
        return Promise.resolve(() => heard.delete(cb));
    };
    return { changes, listening: () => heard.size, tell: (c: Change) => [...heard].map((cb) => cb(c)) };
}

function client() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    return { queryClient, wrapper };
}

afterEach(cleanup);

describe('a window when its network’s API answers again', () => {
    it('loads again what it shows, a screen that only failed included', async () => {
        const e = events();
        const { wrapper } = client();
        let off = true;
        const load = vi.fn(() => (off ? Promise.reject(new Error('API v2 is turned off on this network')) : Promise.resolve('Lily')));
        // a window of its own on its "could not load" screen: no banner, only the event
        function Screen() {
            useReloadWhenApiBack(`${SITE}/`, e.changes);
            const me = useQuery({ queryKey: ['me'], queryFn: load });
            return <p>{me.isError ? 'failed' : (me.data ?? 'loading')}</p>;
        }
        render(<Screen />, { wrapper });
        await waitFor(() => expect(screen.getByText('failed')).toBeTruthy());
        expect(load).toHaveBeenCalledTimes(1);

        // off still, another network, a change that is not "back": nothing is asked
        act(() => void e.tell({ site: SITE, code: 'api_v2_disabled' }));
        act(() => void e.tell({ site: 'https://other.example', code: null }));
        act(() => void e.tell({ code: null }));
        expect(load).toHaveBeenCalledTimes(1);

        off = false;
        act(() => void e.tell({ site: SITE, code: null }));
        await waitFor(() => expect(screen.getByText('Lily')).toBeTruthy());
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('stops listening when it closes', async () => {
        const e = events();
        const { wrapper } = client();
        const view = renderHook(() => useReloadWhenApiBack(SITE, e.changes), { wrapper });
        await waitFor(() => expect(e.listening()).toBe(1));
        view.unmount();
        expect(e.listening()).toBe(0);
    });
});

describe('Try again of a screen whose request failed', () => {
    function setup() {
        const answers: (() => Promise<unknown>)[] = [];
        const checked: string[] = [];
        const backend: AvailabilityBackend = {
            get: () => Promise.resolve(null),
            check: (site) => {
                checked.push(site);
                return (answers.shift() ?? (() => Promise.resolve(null)))();
            },
            onChange: () => Promise.resolve(() => {}),
        };
        const availability = new ApiAvailability(backend);
        const again = vi.fn();
        function Screen() {
            const { retry, checking } = useRetryWithCheck(SITE, again, availability);
            return (
                <button onClick={retry} aria-busy={checking}>
                    Try again
                </button>
            );
        }
        render(<Screen />);
        return { availability, again, answers, checked, button: () => screen.getByRole('button') };
    }

    it('asks again at once while the site is not held as off', () => {
        const s = setup();
        fireEvent.click(s.button());
        expect(s.again).toHaveBeenCalledTimes(1);
        expect(s.checked).toEqual([]);
    });

    it('asks the site first while it is held as off: Rust answers the page’s requests itself until then', async () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        let answer: (code: unknown) => void = () => {};
        s.answers.push(() => new Promise((resolve) => (answer = resolve)));
        fireEvent.click(s.button());
        fireEvent.click(s.button());
        expect(s.checked).toEqual([SITE]);
        expect(s.again).not.toHaveBeenCalled();
        expect(s.button().getAttribute('aria-busy')).toBe('true');

        await act(async () => answer(null));
        expect(s.again).toHaveBeenCalledTimes(1);
        expect(s.availability.codeOf(SITE)).toBeNull();
        expect(s.button().getAttribute('aria-busy')).toBe('false');
    });

    it('asks again all the same when the site cannot be reached', async () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_disabled'));
        s.answers.push(() => Promise.reject('Could not reach the network: timed out'));
        fireEvent.click(s.button());
        await waitFor(() => expect(s.again).toHaveBeenCalledTimes(1));
        expect(s.availability.codeOf(SITE)).toBe('api_disabled');
    });
});
