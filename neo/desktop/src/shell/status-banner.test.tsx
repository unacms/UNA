import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiAvailability, type AvailabilityBackend } from '../lib/api-availability';
import { StatusBanner } from './status-banner';

const SITE = 'https://community.example';
const OTHER = 'https://other.example';

function setup(siteUrl = SITE) {
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
    const announce = vi.fn();
    // where the shell sends the keyboard when Try again goes while it has it: the list pane
    const retryGone = vi.fn(() => document.querySelector<HTMLElement>('[data-pane="list"]')?.focus());
    const ui = (site: string) => (
        <>
            <StatusBanner siteUrl={site} announce={announce} onRetryGone={retryGone} availability={availability} />
            <section data-pane="list" tabIndex={-1} />
        </>
    );
    const view = render(ui(siteUrl));
    return { availability, announce, retryGone, answers, checked, show: (site: string) => view.rerender(ui(site)) };
}

/** The banner's words (its icon's markup has white space of its own). */
const said = () => screen.getByRole('status').textContent?.trim() ?? '';

function goOffline(offline: boolean) {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: !offline });
    act(() => {
        window.dispatchEvent(new Event(offline ? 'offline' : 'online'));
    });
}

afterEach(() => {
    cleanup();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

describe('the status banner', () => {
    it('says nothing while the network answers, and keeps its live region for when it does not', () => {
        setup();
        expect(said()).toBe('');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('says API v2 is turned off, with a way to ask again, and goes by itself when it answers', () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        expect(said()).toBe('API v2 is turned off on this network');
        expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();

        act(() => s.availability.set(SITE, null));
        expect(said()).toBe('');
        expect(screen.queryByRole('button')).toBeNull();
        // the change is said (the window's session loads again what failed: useReloadWhenApiBack)
        expect(s.announce).toHaveBeenCalledWith('The network’s API answers again');
        // nobody was on the button: the keyboard is left where it is
        expect(s.retryGone).not.toHaveBeenCalled();
    });

    it('says the whole API is turned off in its own words', () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_disabled'));
        expect(said()).toBe('The API is turned off on this network');
    });

    it('keeps another network out of it', () => {
        const s = setup();
        act(() => s.availability.set(OTHER, 'api_v2_disabled'));
        expect(said()).toBe('');

        // switched to the one that is off, and back: nothing is said of this one for that
        s.show(OTHER);
        expect(said()).toBe('API v2 is turned off on this network');
        s.show(SITE);
        expect(said()).toBe('');
        expect(s.announce).not.toHaveBeenCalled();
    });

    it('Try again asks the site once at a time, keeps its size while it waits, and says what came of it', async () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        let answer: (code: unknown) => void = () => {};
        s.answers.push(() => new Promise((resolve) => (answer = resolve)));

        const button = screen.getByRole('button', { name: 'Try again' });
        fireEvent.click(button);
        fireEvent.click(button);
        expect(s.checked).toEqual([SITE]);
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.hasAttribute('data-busy')).toBe(true);
        // the label stays in the button (hidden by the stylesheet), so it keeps its width and its name
        expect(button.textContent).toBe('Try again');

        await act(async () => answer('api_v2_disabled'));
        expect(button.hasAttribute('data-busy')).toBe(false);
        expect(s.announce).toHaveBeenCalledWith('API v2 is turned off on this network');
        expect(said()).toBe('API v2 is turned off on this network');

        // a site that cannot be reached: said, and the banner stays
        s.answers.push(() => Promise.reject('Could not reach the network: timed out'));
        fireEvent.click(button);
        await waitFor(() => expect(s.announce).toHaveBeenCalledWith('Could not reach the network: timed out'));
        expect(said()).toBe('API v2 is turned off on this network');

        // and one that answers again: the banner goes
        s.answers.push(() => Promise.resolve(null));
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(screen.queryByRole('button')).toBeNull());
        expect(s.announce).toHaveBeenCalledWith('The network’s API answers again');
    });

    it('keeps the banner when the site, held as off, answers Try again with something that says nothing', async () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        // a maintenance page: Rust holds the site as off still, and says so
        s.answers.push(() => Promise.resolve('api_v2_disabled'));
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => expect(s.announce).toHaveBeenCalledWith('API v2 is turned off on this network'));
        expect(said()).toBe('API v2 is turned off on this network');
        expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
        expect(s.announce).not.toHaveBeenCalledWith('The network’s API answers again');
    });

    it('moves the keyboard on when Try again goes while it has it', async () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        const button = screen.getByRole('button', { name: 'Try again' });
        button.focus();
        s.answers.push(() => Promise.resolve(null));
        fireEvent.click(button);
        await waitFor(() => expect(screen.queryByRole('button')).toBeNull());
        expect(s.retryGone).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(document.querySelector('[data-pane="list"]'));

        // and when the computer goes offline under it
        act(() => s.availability.set(SITE, 'api_disabled'));
        screen.getByRole('button', { name: 'Try again' }).focus();
        goOffline(true);
        expect(screen.queryByRole('button')).toBeNull();
        expect(s.retryGone).toHaveBeenCalledTimes(2);
        expect(document.activeElement).toBe(document.querySelector('[data-pane="list"]'));
    });

    it('says offline first, with nothing to ask the site', () => {
        const s = setup();
        act(() => s.availability.set(SITE, 'api_v2_disabled'));
        goOffline(true);
        expect(said()).toContain('You’re offline');
        expect(screen.queryByRole('button')).toBeNull();
        goOffline(false);
        expect(said()).toBe('API v2 is turned off on this network');
    });
});
