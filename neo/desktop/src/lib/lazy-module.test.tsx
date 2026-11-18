import { act, render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it } from 'vitest';

import { lazyModule } from './lazy-module';

function deferred<T>() {
    let resolve: (value: T) => void = () => undefined;
    let reject: (reason: unknown) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('lazyModule', () => {
    it('loads once, however often it is asked for', async () => {
        let calls = 0;
        const part = lazyModule(async () => {
            calls++;
            return { word: 'hello' };
        });
        await Promise.all([part.load(), part.load()]);
        await part.load();
        expect(calls).toBe(1);
        expect(part.loaded().word).toBe('hello');
    });

    it('says when it is used before it has loaded', () => {
        const part = lazyModule(() => new Promise<{ word: string }>(() => undefined));
        expect(() => part.loaded()).toThrow(/before it has loaded/);
        void part.load();
        expect(() => part.loaded()).toThrow(/before it has loaded/);
    });

    it('holds a component back until it has loaded, then draws it at once every time', async () => {
        const { promise, resolve } = deferred<{ word: string }>();
        const part = lazyModule(() => promise);
        function Word() {
            return <p>{part.use().word}</p>;
        }
        // React 19 draws a component that suspends only inside an awaited act
        let first: ReturnType<typeof render> | undefined;
        await act(async () => {
            first = render(
                <Suspense fallback={<p>loading</p>}>
                    <Word />
                </Suspense>,
            );
        });
        expect(screen.getByText('loading')).toBeTruthy();
        await act(async () => resolve({ word: 'hello' }));
        expect(await screen.findByText('hello')).toBeTruthy();
        first?.unmount();
        // loaded: no fallback, not even for a frame
        render(
            <Suspense fallback={<p>loading</p>}>
                <Word />
            </Suspense>,
        );
        expect(screen.queryByText('loading')).toBeNull();
        expect(screen.getByText('hello')).toBeTruthy();
    });

    it('tries again after a load that failed', async () => {
        let calls = 0;
        const part = lazyModule(async () => {
            calls++;
            if (calls === 1) throw new Error('could not read the file');
            return { word: 'hello' };
        });
        await expect(part.load()).rejects.toThrow('could not read the file');
        await expect(part.load()).resolves.toEqual({ word: 'hello' });
        expect(calls).toBe(2);
    });
});
