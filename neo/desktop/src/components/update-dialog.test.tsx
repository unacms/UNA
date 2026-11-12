import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { InstallEvent, UpdateInfo, UpdatesBackend } from '../lib/updates';
import { UpdatesStore } from '../lib/updates';
import { progressText, releaseDate, UpdateDialog } from './update-dialog';

afterEach(cleanup);

const update: UpdateInfo = { version: '0.2.0', currentVersion: '0.1.0', notes: '- Faster feed\n- <b>not</b> markup', date: '2026-11-20T10:00:00Z' };

function setup(found: UpdateInfo | null = update) {
    let send: (e: InstallEvent) => void = () => {};
    let finish: { resolve: () => void; reject: (e: unknown) => void } | null = null;
    const backend: UpdatesBackend = {
        check: () => Promise.resolve(found),
        install: (_v, onEvent) => {
            send = onEvent;
            return new Promise((resolve, reject) => (finish = { resolve, reject }));
        },
    };
    const store = new UpdatesStore(backend);
    render(<UpdateDialog store={store} />);
    return { store, send: (e: InstallEvent) => act(() => send(e)), finish: () => finish };
}

const dialog = () => document.querySelector('dialog') as HTMLDialogElement;

describe('the update dialog', () => {
    it('is closed until there is something to say', () => {
        setup();
        expect(dialog().hasAttribute('open')).toBe(false);
    });

    it('says the app is up to date when the person asked and there is nothing new', async () => {
        const { store } = setup(null);
        await act(() => store.check({ manual: true }));
        expect(dialog().hasAttribute('open')).toBe(true);
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('UNA is up to date');
        expect(screen.getByRole('status').textContent).toBe('UNA is up to date');
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(dialog().hasAttribute('open')).toBe(false);
    });

    it('shows what is new as plain text, and installs only on Install and Restart', async () => {
        const { store, send, finish } = setup();
        await act(() => store.check({ manual: false }));
        expect(dialog().hasAttribute('open'), 'an automatic find opens no dialog').toBe(false);
        act(() => store.openDialog());
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('A new version of UNA is available');
        expect(screen.getByText('UNA 0.2.0 is out. You have 0.1.0.')).toBeTruthy();
        const notes = screen.getByRole('region', { name: 'What’s new' });
        expect(notes.textContent).toBe('- Faster feed\n- <b>not</b> markup');
        expect(notes.querySelector('b'), 'no markup from the release').toBeNull();
        expect(notes.tabIndex, 'focusable, so the keyboard can scroll it').toBe(0);
        expect(finish()).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'Install and Restart' }));
        expect(finish()).not.toBeNull();
        send({ event: 'started', total: 10 * 1024 * 1024 });
        send({ event: 'progress', downloaded: 4 * 1024 * 1024 });
        const bar = screen.getByRole('progressbar', { name: 'Downloading UNA 0.2.0…' });
        expect(bar.getAttribute('value')).toBe(String(4 * 1024 * 1024));
        expect(bar.getAttribute('aria-valuetext')).toBe('4.0 MB of 10.0 MB');
        expect(screen.queryByRole('button', { name: 'Close' }), 'no closing while it installs').toBeNull();
        expect(document.activeElement, 'focus stays in the dialog when its button goes').toBe(screen.getByRole('heading', { level: 2 }));
        send({ event: 'installing' });
        expect(screen.getByRole('status').textContent).toBe('Installing UNA 0.2.0…');
    });

    it('says why an install failed and tries it again', async () => {
        const { store, finish } = setup();
        await act(() => store.check({ manual: true }));
        fireEvent.click(screen.getByRole('button', { name: 'Install and Restart' }));
        await act(async () => finish()?.reject('The update server could not be reached'));
        expect(screen.getByRole('alert').textContent).toBe('The update server could not be reached');
        expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('The update was not installed');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(screen.getByRole('progressbar')).toBeTruthy();
    });

    it('writes sizes and dates the person’s way', () => {
        expect(progressText(512 * 1024, null)).toBe('512 KB');
        expect(progressText(0, 2048)).toBe('0 bytes of 2 KB');
        expect(releaseDate('2026-11-20T10:00:00Z')).toMatch(/2026/);
        expect(releaseDate('not a date')).toBeNull();
        expect(releaseDate(null)).toBeNull();
    });
});
