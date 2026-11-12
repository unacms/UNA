import { describe, expect, it, vi } from 'vitest';

import { coalesce, eventId, Realtime, type RealtimeBackend, type RealtimeEvent, type RealtimeStatus } from './realtime';

function fake() {
    const watched: { channels: string[]; viewer: string | null }[] = [];
    let send: (e: RealtimeEvent) => void = () => {};
    let status: (s: RealtimeStatus) => void = () => {};
    const backend: RealtimeBackend = {
        watch: (channels, viewer) => {
            watched.push({ channels, viewer });
            return Promise.resolve({ connected: true, channels: { activities: 'bx_timeline_0' } });
        },
        onEvent: (cb) => {
            send = cb;
            return Promise.resolve(() => {});
        },
        onStatus: (cb) => {
            status = cb;
            return Promise.resolve(() => {});
        },
    };
    return { backend, watched, send: (e: RealtimeEvent) => send(e), status: (s: RealtimeStatus) => status(s) };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('live events', () => {
    it('tells Rust the window’s channels once a turn, and hands each event to its channel’s handlers', async () => {
        const f = fake();
        const rt = new Realtime(f.backend);
        const a = vi.fn();
        const b = vi.fn();
        const stopA = rt.subscribe('bx_timeline_0', a);
        rt.subscribe('cmts_bx_timeline_12', b);
        const stopA2 = rt.subscribe('bx_timeline_0', a);
        await settle();
        expect(f.watched).toEqual([{ channels: ['bx_timeline_0', 'cmts_bx_timeline_12'], viewer: null }]);
        expect(rt.status).toEqual({ connected: true, channels: { activities: 'bx_timeline_0' } });

        f.send({ channel: 'bx_timeline_0', event: 'added', data: { id: '7' } });
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).not.toHaveBeenCalled();
        f.send({ channel: 'somewhere_else', event: 'added', data: null });
        expect(a).toHaveBeenCalledTimes(1);

        stopA();
        stopA2();
        await settle();
        expect(f.watched.at(-1)).toEqual({ channels: ['cmts_bx_timeline_12'], viewer: null });
    });

    it('says which profile it shows, and follows what Rust says', async () => {
        const f = fake();
        const rt = new Realtime(f.backend);
        const changed = vi.fn();
        rt.onStatus(changed);
        rt.setViewer('4');
        await settle();
        expect(f.watched.at(-1)).toEqual({ channels: [], viewer: '4' });
        f.status({ connected: false, channels: {} });
        expect(rt.status.connected).toBe(false);
        expect(changed).toHaveBeenCalled();
    });

    it('keeps going when a handler throws', () => {
        const rt = new Realtime(fake().backend);
        const after = vi.fn();
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        rt.subscribe('c_1', () => {
            throw new Error('boom');
        });
        rt.subscribe('c_1', after);
        rt.receive({ channel: 'c_1', event: 'x', data: null });
        expect(after).toHaveBeenCalled();
        error.mockRestore();
    });

    it('runs a busy feed’s checks at most once a wait, the last one too', () => {
        vi.useFakeTimers();
        try {
            const fn = vi.fn();
            const run = coalesce(fn, 1000);
            run();
            run();
            run();
            expect(fn).toHaveBeenCalledTimes(1);
            vi.advanceTimersByTime(1000);
            expect(fn).toHaveBeenCalledTimes(2);
            vi.advanceTimersByTime(1000);
            expect(fn).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });

    it('reads the id an event names', () => {
        expect(eventId({ channel: 'c', event: 'added', data: { id: 12 } })).toBe('12');
        expect(eventId({ channel: 'c', event: 'added', data: { id: '12' } })).toBe('12');
        expect(eventId({ channel: 'c', event: 'added', data: null })).toBeNull();
        expect(eventId({ channel: 'c', event: 'added', data: 'plain' })).toBeNull();
    });
});
