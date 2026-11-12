import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
    calls: [] as string[],
    getSession: vi.fn<() => Promise<unknown>>(),
    listSessions: vi.fn<() => Promise<unknown[]>>(async () => []),
    signOut: vi.fn<() => Promise<unknown>>(async () => null),
}));

vi.mock('./lib/native', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./lib/native')>();
    return {
        ...actual,
        showWindow: vi.fn(async (evenHidden?: boolean) => {
            native.calls.push(evenHidden ? 'show even hidden' : 'show');
        }),
        getSession: vi.fn(() => {
            native.calls.push('session');
            return native.getSession();
        }),
        listSessions: vi.fn(() => native.listSessions()),
        signOut: vi.fn(() => {
            native.calls.push('sign out');
            return native.signOut();
        }),
        takeDeepLinks: vi.fn(async () => []),
    };
});

import { App } from './app';

function renderApp() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={client}>
            <App />
        </QueryClientProvider>,
    );
}

beforeEach(() => {
    native.calls.length = 0;
    native.getSession.mockReset();
    native.listSessions.mockReset().mockResolvedValue([]);
    native.signOut.mockReset().mockResolvedValue(null);
});
afterEach(cleanup);

describe('a network its site signed out', () => {
    const makers = { siteUrl: 'http://desktop.localhost:8090', generation: 4, key: 'http://desktop.localhost:8090|1', siteName: 'UNA Makers', accountName: 'Andrey', needsSignIn: true };
    const list = [
        { key: makers.key, siteUrl: makers.siteUrl, siteName: 'UNA Makers', accountName: 'Andrey', active: true, needsSignIn: true },
        { key: 'http://network2.localhost:8092|1', siteUrl: 'http://network2.localhost:8092', siteName: 'Riverside Network', accountName: 'Andrey', active: false },
    ];

    it('stays in the list and opens as its sign-in screen, with its address filled in', async () => {
        native.getSession.mockResolvedValue(makers);
        native.listSessions.mockResolvedValue(list);
        renderApp();

        expect(await screen.findByRole('heading', { name: 'Sign in to UNA Makers again' })).toBeTruthy();
        expect(screen.getByText(/UNA Makers signed you out as Andrey\. Sign in again to keep using it here\./)).toBeTruthy();
        expect((screen.getByLabelText('Network address') as HTMLInputElement).value).toBe('http://desktop.localhost:8090');
        // the other networks are a click away
        expect(await screen.findByRole('button', { name: /Riverside Network/ })).toBeTruthy();
        expect(native.calls).not.toContain('sign out');
    });

    it('leaves the list only when the person signs out of it', async () => {
        native.getSession.mockResolvedValue(makers);
        native.listSessions.mockResolvedValue(list);
        renderApp();

        fireEvent.click(await screen.findByRole('button', { name: 'Sign out of UNA Makers' }));
        await waitFor(() => expect(native.calls).toContain('sign out'));
        expect(await screen.findByRole('heading', { name: 'Sign in to your network' })).toBeTruthy();
    });
});

describe('reading the sign-in', () => {
    it('shows the window first, then says "Signing in…" until the session is known', async () => {
        let answer: (value: unknown) => void = () => undefined;
        native.getSession.mockReturnValue(new Promise((resolve) => (answer = resolve)));
        renderApp();

        const status = await screen.findByText('Signing in…');
        expect(status.getAttribute('role')).toBe('status');
        // nothing above it holds its announcement back
        expect(status.closest('[aria-busy="true"]')).toBeNull();
        await waitFor(() => expect(native.calls).toEqual(['show', 'session']));
        expect(screen.queryByRole('heading', { name: 'Sign in to your network' })).toBeNull();

        await act(async () => answer(null));
        expect(await screen.findByRole('heading', { name: 'Sign in to your network' })).toBeTruthy();
        expect(screen.queryByText('Signing in…')).toBeNull();
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('a keychain that refuses shows the alert with Try again over the sign-in form', async () => {
        native.getSession.mockRejectedValueOnce("UNA couldn't read your sign-in from the keychain: User canceled the operation");
        renderApp();

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toContain('UNA couldn’t read your sign-in from the keychain.');
        expect(alert.textContent).toContain('User canceled the operation');
        // the headline once (Rust's message starts with the same sentence)
        expect(alert.textContent?.match(/read your sign-in from the keychain/g)).toHaveLength(1);
        // started at login with the window closed, the alert must still be seen
        await waitFor(() => expect(native.calls).toContain('show even hidden'));
        expect(screen.getByLabelText('Network address')).toBeTruthy();

        // allowed this time: the read is tried again, and the alert goes
        native.getSession.mockResolvedValueOnce(null);
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(native.calls.filter((c) => c === 'session')).toHaveLength(2);
        expect(screen.getByRole('heading', { name: 'Sign in to your network' })).toBeTruthy();
    });

    it('Try again stays where it is while it reads, and a second press waits for it', async () => {
        native.getSession.mockRejectedValueOnce('UNA couldn’t read your sign-in from the keychain: locked');
        renderApp();
        const button = await screen.findByRole('button', { name: 'Try again' });

        let answer: (value: unknown) => void = () => undefined;
        native.getSession.mockReturnValueOnce(new Promise((_, reject) => (answer = reject)));
        fireEvent.click(button);
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(button);
        expect(native.calls.filter((c) => c === 'session')).toHaveLength(2);

        const first = screen.getByRole('alert');
        await act(async () => answer('UNA couldn’t read your sign-in from the keychain: still locked'));
        const again = await screen.findByRole('alert');
        expect(again.textContent).toContain('still locked');
        // a new alert element, so the failed retry is announced again
        expect(again).not.toBe(first);
        expect(again.textContent).toContain('UNA still couldn’t read your sign-in');
        expect(screen.getByRole('button', { name: 'Try again' }).getAttribute('aria-busy')).toBeNull();
    });
});
