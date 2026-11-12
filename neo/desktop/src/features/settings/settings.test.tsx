import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../../lib/command-bus';
import { AppContext, type AppContextValue } from '../../lib/context';
import { chooseLanguage, LANGUAGE_NAMES, LANGUAGES } from '../../lib/i18n';
import type { SessionSummary } from '../../lib/native';
import { RouterProvider } from '../../lib/navigation';
import { RouteHistory, routeToPath, sectionRoute, settingsRoute } from '../../lib/router';
import { appSettings } from '../../lib/settings';
import type { CommandId } from '../../lib/shortcuts';
import { type CommandHandler, Shell } from '../../shell/shell';
import type { NavItem } from '../../shell/sidebar';
import { profileChanges } from './edit-profile';
import { updateStatusText } from './settings-panel';

// choosing a language ends in loading the window again, which jsdom cannot: the rest of the module is real
vi.mock('../../lib/i18n', async (importOriginal) => ({ ...(await importOriginal<typeof import('../../lib/i18n')>()), chooseLanguage: vi.fn(() => true) }));

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily Carter', about: 'Gardener', status: 'active', created_at: '2026-01-01T00:00:00Z' } as Schema<'Profile'>;
const org: Schema<'Profile'> = { id: '9', kind: 'organization', module: 'bx_organizations', display_name: 'Garden Club', about: '', status: 'active', created_at: '2026-01-01T00:00:00Z' } as Schema<'Profile'>;
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily, org] } as unknown as Schema<'Me'>;

const sessions: SessionSummary[] = [
    { key: 'https://community.example|3', siteUrl: 'https://community.example', siteName: 'Gardeners', accountName: 'Lily Carter', active: true },
    { key: 'https://other.example|5', siteUrl: 'https://other.example', siteName: 'Cyclists', accountName: 'Lily', active: false },
];

type Answer = { status: number; body?: unknown };
type Routes = Record<string, (request: Request) => Answer | Promise<Answer>>;

function fakeApi(routes: Routes = {}): UnaApi {
    return createUnaApi({
        siteUrl: 'https://community.example',
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            const handler = routes[`${request.method} ${path}`];
            if (!handler) return new Promise<Response>(() => {});
            const { status, body } = await handler(request);
            if (body === undefined) return new Response(null, { status });
            return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' } });
        },
    });
}

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home', icon: 'house' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications', icon: 'bell' },
];

type Spies = { switchNetwork: (key: string) => void; addNetwork: () => void; commands?: (id: CommandId) => void };

function Harness({ history, api, spies }: { history: RouteHistory; api: UnaApi; spies: Spies }) {
    const commands = useRef<CommandHandler | null>(null);
    useEffect(
        () =>
            listenForCommands(
                (id) => {
                    spies.commands?.(id);
                    commands.current?.(id);
                },
                { mac: false, nativeMenu: false },
            ),
        [spies],
    );
    const ctx: AppContextValue = {
        api,
        siteUrl: 'https://community.example',
        me,
        signOut: () => {},
        signingOut: false,
        messageTo: () => {},
        runCommand: (id) => commands.current?.(id),
        sessions,
        sessionKey: sessions[0]!.key,
        switchNetwork: spies.switchNetwork,
        addNetwork: spies.addNetwork,
    };
    return (
        <AppContext.Provider value={ctx}>
            <RouterProvider history={history}>
                <Shell siteUrl="https://community.example" items={items} profile={lily} commands={commands} />
            </RouterProvider>
        </AppContext.Provider>
    );
}

function setup(history = new RouteHistory(sectionRoute('home')), routes: Routes = {}, spies: Partial<Spies> = {}) {
    const all: Spies = { switchNetwork: vi.fn(), addNetwork: vi.fn(), ...spies };
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness history={history} api={fakeApi(routes)} spies={all} />
        </QueryClientProvider>,
    );
    return { history, spies: all };
}

afterEach(async () => {
    cleanup();
    vi.restoreAllMocks();
    await appSettings.set('singleKeyShortcuts', true);
    await appSettings.set('theme', 'system');
    delete document.documentElement.dataset.theme;
    localStorage.clear();
});

describe('Settings', () => {
    it('opens with Ctrl+, at Account: the networks and the profiles', () => {
        const { history, spies } = setup();
        fireEvent.keyDown(window, { key: ',', code: 'Comma', ctrlKey: true });
        expect(routeToPath(history.current)).toBe('/settings/settings/account');
        expect(screen.getByRole('region', { name: 'Settings' })).toBeTruthy();
        const panel = screen.getByRole('region', { name: 'Account' });
        expect(document.activeElement).toBe(within(panel).getByRole('heading', { name: 'Account' }));
        const nav = screen.getByRole('navigation', { name: 'Settings' });
        expect(within(nav).getByRole('button', { name: 'Account' }).getAttribute('aria-current')).toBe('page');

        expect(within(panel).getByText('Gardeners – Lily Carter')).toBeTruthy();
        expect(within(panel).getByText('Open now')).toBeTruthy();
        fireEvent.click(within(panel).getByRole('button', { name: 'Switch' }));
        expect(spies.switchNetwork).toHaveBeenCalledWith('https://other.example|5');
        expect(within(panel).getByRole('button', { name: 'Edit profile: Garden Club' })).toBeTruthy();
        expect(within(panel).getByRole('button', { name: 'Act as Garden Club' })).toBeTruthy();
        expect(within(panel).getByRole('button', { name: 'Sign out of Gardeners – Lily Carter' })).toBeTruthy();

        // the settings button at the sidebar's foot says Settings is open
        const sidebar = document.querySelector<HTMLElement>('[data-pane="sidebar"]')!;
        expect(within(sidebar).getByRole('button', { name: 'Settings' }).getAttribute('aria-current')).toBe('page');
    });

    it('turns single-key shortcuts off: j, ? and E do nothing, Esc and Ctrl keys still work', async () => {
        const commands = vi.fn();
        setup(new RouteHistory(settingsRoute('keyboard')), {}, { commands });
        const toggle = screen.getByRole('switch', { name: 'Single-key shortcuts' });
        expect(toggle.getAttribute('aria-checked')).toBe('true');
        fireEvent.click(toggle);
        await waitFor(() => expect(appSettings.current.singleKeyShortcuts).toBe(false));
        await waitFor(() => expect(screen.getByText('Single-key shortcuts off')).toBeTruthy());
        expect(within(screen.getByRole('region', { name: 'Keyboard' })).getAllByText('(off)').length).toBeGreaterThan(0);

        document.body.focus();
        fireEvent.keyDown(window, { key: '?', code: 'Slash', shiftKey: true });
        fireEvent.keyDown(window, { key: 'j', code: 'KeyJ' });
        fireEvent.keyDown(window, { key: 'E', code: 'KeyE', shiftKey: true });
        expect(commands).not.toHaveBeenCalled();
        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        fireEvent.keyDown(window, { key: '1', code: 'Digit1', ctrlKey: true, altKey: true });
        expect(commands.mock.calls.map((c) => c[0])).toEqual(['close-detail', 'go-home']);

        // and on again
        fireEvent.click(screen.queryByRole('switch', { name: 'Single-key shortcuts' }) ?? toggle);
        await act(async () => {
            await appSettings.set('singleKeyShortcuts', true);
        });
        fireEvent.keyDown(window, { key: '?', code: 'Slash', shiftKey: true });
        expect(commands).toHaveBeenLastCalledWith('show-shortcuts');
    });

    it('sets the theme: Dark is data-theme dark on the page and kept for the next start', async () => {
        setup(new RouteHistory(settingsRoute('appearance')));
        const group = screen.getByRole('group', { name: 'Theme' });
        expect((within(group).getByRole('radio', { name: 'System' }) as HTMLInputElement).checked).toBe(true);
        fireEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
        await waitFor(() => expect(appSettings.current.theme).toBe('dark'));
        expect(document.documentElement.dataset.theme).toBe('dark');
        expect(localStorage.getItem('una-desktop-theme')).toBe('dark');
        expect(JSON.parse(localStorage.getItem('una-setting:theme') ?? 'null')).toBe('dark');
        await waitFor(() => expect(screen.getByText('Dark theme')).toBeTruthy());
        fireEvent.click(within(group).getByRole('radio', { name: 'System' }));
        await waitFor(() => expect(document.documentElement.dataset.theme).toBeUndefined());
    });

    it('keeps Notifications and Start at login for the desktop app', () => {
        setup(new RouteHistory(settingsRoute('notifications')));
        expect((screen.getByRole('switch', { name: 'Show notifications from the system' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByText('These work in the desktop app.')).toBeTruthy();
    });

    it('has the update checks in About, for the desktop app', () => {
        setup(new RouteHistory(settingsRoute('about')));
        const toggle = screen.getByRole('switch', { name: 'Check for updates automatically' }) as HTMLButtonElement;
        expect(toggle.getAttribute('aria-checked')).toBe('true');
        expect(toggle.disabled, 'in a browser tab').toBe(true);
        expect((screen.getByRole('button', { name: 'Check for Updates…' }) as HTMLButtonElement).disabled).toBe(true);
        expect(screen.getByRole('group', { name: 'Updates' })).toBeTruthy();
    });

    it('says how the updates stand', () => {
        const update = { version: '0.2.0', currentVersion: '0.1.0' };
        expect(updateStatusText({ phase: 'idle', dialogOpen: false })).toBe('');
        expect(updateStatusText({ phase: 'current', checkedAt: 1, dialogOpen: false })).toBe('Up to date');
        expect(updateStatusText({ phase: 'available', update, dialogOpen: false })).toBe('Version 0.2.0 is available');
        expect(updateStatusText({ phase: 'failed', reason: 'offline', dialogOpen: false })).toBe('Could not check: offline');
        expect(updateStatusText({ phase: 'installing', update, dialogOpen: true })).toBe('Installing version 0.2.0…');
    });
});

describe('Language', () => {
    const NOTE = 'The app’s own words. What a network says comes in this language when the network has it.';
    const languageSelect = () => screen.getByRole('combobox', { name: 'Language' }) as HTMLSelectElement;

    afterEach(async () => {
        await appSettings.set('language', 'system');
        vi.mocked(chooseLanguage).mockClear();
    });

    it('is a select after the Theme: the system’s language, then each language under its own name', () => {
        setup(new RouteHistory(settingsRoute('appearance')));
        const select = languageSelect();
        expect(select.tagName).toBe('SELECT');
        expect(Array.from(select.options).map((o) => [o.value, o.textContent])).toEqual([['system', 'System'], ...LANGUAGES.map((code) => [code, LANGUAGE_NAMES[code]])]);
        expect(within(select).getByRole('option', { name: 'English' })).toBeTruthy();
        expect(within(select).getByRole('option', { name: 'Русский' })).toBeTruthy();
        expect(select.value).toBe('system');
        // its label is on screen, its note is its description
        expect(screen.getByText('Language', { selector: 'label' }).getAttribute('for')).toBe(select.id);
        expect(select.getAttribute('aria-describedby')).toBe(screen.getByText(NOTE).id);
        const theme = screen.getByRole('group', { name: 'Theme' });
        expect(theme.compareDocumentPosition(select) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(select.closest('section')).toBe(theme.closest('section'));
    });

    it('shows the kept choice', async () => {
        await appSettings.set('language', 'ru');
        setup(new RouteHistory(settingsRoute('appearance')));
        expect(languageSelect().value).toBe('ru');
        expect(chooseLanguage).not.toHaveBeenCalled();
    });

    it('keeps the language chosen, then loads the window again in it', async () => {
        setup(new RouteHistory(settingsRoute('appearance')));
        const select = languageSelect();
        fireEvent.change(select, { target: { value: 'ru' } });
        await waitFor(() => expect(chooseLanguage).toHaveBeenCalledWith('ru'));
        expect(appSettings.current.language).toBe('ru');
        expect(JSON.parse(localStorage.getItem('una-setting:language') ?? 'null')).toBe('ru');
        expect(select.value).toBe('ru');
    });

    it('says when the choice could not be kept, and loads nothing again', async () => {
        setup(new RouteHistory(settingsRoute('appearance')));
        vi.spyOn(appSettings, 'set').mockRejectedValueOnce(new Error('disk full'));
        fireEvent.change(languageSelect(), { target: { value: 'ru' } });
        const said = await screen.findByText('Language not kept: disk full');
        expect(said.getAttribute('role')).toBe('status');
        expect(chooseLanguage).not.toHaveBeenCalled();
    });
});

describe('Edit profile', () => {
    it('sends only what changed', () => {
        const keep = { kind: 'keep' } as const;
        expect(profileChanges(lily, { name: ' Lily Carter ', about: 'Gardener', avatar: keep, cover: keep })).toEqual({});
        expect(profileChanges(lily, { name: 'Lily C.', about: 'Gardener\nand cook', avatar: { kind: 'remove' }, cover: keep })).toEqual({
            display_name: 'Lily C.',
            about: 'Gardener\nand cook',
            avatar_id: null,
        });
        const media = { id: '73014444038', kind: 'image', url: '', variants: {}, state: 'ready', mime: 'image/png' } as unknown as Schema<'Media'>;
        expect(profileChanges(lily, { name: 'Lily Carter', about: 'Gardener', avatar: keep, cover: { kind: 'new', media } })).toEqual({ cover_id: '73014444038' });
    });

    it('saves, and shows the site’s reasons next to the field', async () => {
        const bodies: unknown[] = [];
        let refuse = true;
        const saved = { ...lily, display_name: 'Lily C.' };
        setup(new RouteHistory({ list: { section: 'settings' }, detail: { kind: 'edit-profile', id: '4' } }), {
            'GET /profiles/4': () => ({ status: 200, body: lily }),
            'PATCH /profiles/4': async (request) => {
                bodies.push(await request.json());
                if (refuse) {
                    refuse = false;
                    return { status: 422, body: { type: 'about:blank', title: 'Unprocessable Content', status: 422, code: 'validation_failed', errors: [{ field: 'display_name', code: 'invalid_value', message: 'Cannot start with @' }] } };
                }
                return { status: 200, body: saved };
            },
        });
        const name = (await screen.findByRole('textbox', { name: 'Name' })) as HTMLInputElement;
        await waitFor(() => expect(name.value).toBe('Lily Carter'));
        expect(screen.getByRole('group', { name: 'Picture' })).toBeTruthy();

        fireEvent.change(name, { target: { value: '@lily' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'));
        expect(screen.getByText('Cannot start with @')).toBeTruthy();
        expect(document.activeElement).toBe(name);
        expect(bodies[0]).toEqual({ display_name: '@lily' });

        fireEvent.change(name, { target: { value: 'Lily C.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.getByText('Profile saved')).toBeTruthy());
        expect(bodies[1]).toEqual({ display_name: 'Lily C.' });
        expect(name.getAttribute('aria-invalid')).toBeNull();
    });

    it('keeps a long about as it is: the app has only its start', async () => {
        const bodies: unknown[] = [];
        const long = { ...lily, about: `${'x'.repeat(999)}…`, about_truncated: true };
        setup(new RouteHistory({ list: { section: 'settings' }, detail: { kind: 'edit-profile', id: '4' } }), {
            'GET /profiles/4': () => ({ status: 200, body: long }),
            'PATCH /profiles/4': async (request) => {
                bodies.push(await request.json());
                return { status: 200, body: { ...long, display_name: 'Lily C.' } };
            },
        });
        const about = (await screen.findByRole('textbox', { name: 'About' })) as HTMLTextAreaElement;
        await waitFor(() => expect(about.value).toBe(long.about));
        expect(about.readOnly).toBe(true);
        expect(screen.getByText(/longer than the app shows/)).toBeTruthy();
        fireEvent.change(screen.getByRole('textbox', { name: 'Name' }), { target: { value: 'Lily C.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(screen.getByText('Profile saved')).toBeTruthy());
        expect(bodies[0]).toEqual({ display_name: 'Lily C.' });
    });

    it('moves focus to the field the site refused: the about on a 409, the photo on a 422', async () => {
        let answer: Answer = { status: 409, body: { type: 'about:blank', title: 'Conflict', status: 409, code: 'formatted_text', detail: 'This text has links or formatting: edit it on the site' } };
        setup(new RouteHistory({ list: { section: 'settings' }, detail: { kind: 'edit-profile', id: '4' } }), {
            'GET /profiles/4': () => ({ status: 200, body: lily }),
            'PATCH /profiles/4': () => answer,
        });
        const about = (await screen.findByRole('textbox', { name: 'About' })) as HTMLTextAreaElement;
        await waitFor(() => expect(about.value).toBe('Gardener'));
        fireEvent.change(about, { target: { value: 'Gardener and cook' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await waitFor(() => expect(about.getAttribute('aria-invalid')).toBe('true'));
        expect(document.activeElement).toBe(about);

        answer = { status: 422, body: { type: 'about:blank', title: 'Unprocessable Content', status: 422, code: 'validation_failed', errors: [{ field: 'avatar_id', code: 'not_found', message: 'No photo uploaded for this profile' }] } };
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        const alert = await screen.findByText('No photo uploaded for this profile');
        expect(alert.getAttribute('role')).toBe('alert');
        expect(document.activeElement).toBe(within(screen.getByRole('group', { name: 'Picture' })).getByRole('button', { name: 'Choose a photo' }));
    });

    it('changes pictures only of the acting profile', async () => {
        setup(new RouteHistory({ list: { section: 'settings' }, detail: { kind: 'edit-profile', id: '9' } }), { 'GET /profiles/9': () => ({ status: 200, body: org }) });
        expect(await screen.findAllByText('Act as this profile to change its pictures (Settings, Account).')).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Choose a photo' })).toBeNull();
    });
});

describe('Sidebar', () => {
    it('switches networks from its menu with the keyboard', () => {
        const { spies } = setup();
        const button = screen.getByRole('button', { name: /^Gardeners(, Lily Carter)?, switch network$/ });
        fireEvent.click(button);
        const menu = screen.getByRole('menu', { name: 'Networks' });
        const radios = within(menu).getAllByRole('menuitemradio');
        expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
        expect(document.activeElement).toBe(radios[0]);
        expect(radios[1]?.getAttribute('aria-keyshortcuts')).toBe('Control+Shift+2');
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        expect(document.activeElement).toBe(radios[1]);
        fireEvent.keyDown(menu, { key: 'End' });
        expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: 'Sign Out of Gardeners' }));
        // type-ahead: the next item starting with the letter typed
        fireEvent.keyDown(menu, { key: 'o' });
        expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: 'Open Gardeners in Browser' }));
        fireEvent.keyDown(menu, { key: 'Escape' });
        expect(screen.queryByRole('menu')).toBeNull();
        expect(document.activeElement).toBe(button);

        fireEvent.click(button);
        fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitemradio', { name: /Cyclists/ }));
        expect(spies.switchNetwork).toHaveBeenCalledWith('https://other.example|5');
        expect(document.activeElement).toBe(button);
    });

    it('folds to icons with Ctrl+\\ and back, the names staying the buttons’ names', () => {
        setup();
        const shell = document.querySelector('.shell');
        expect(shell?.getAttribute('data-sidebar')).toBe('full');
        fireEvent.keyDown(window, { key: '\\', code: 'Backslash', ctrlKey: true });
        expect(shell?.getAttribute('data-sidebar')).toBe('rail');
        const nav = screen.getByRole('navigation', { name: 'Sections' });
        expect(within(nav).getByRole('button', { name: 'Home' })).toBeTruthy();
        expect(within(nav).getByRole('button', { name: 'Groups' })).toBeTruthy();
        expect(localStorage.getItem('una-desktop-sidebar')).toBe('rail');
        fireEvent.keyDown(window, { key: '\\', code: 'Backslash', ctrlKey: true });
        expect(shell?.getAttribute('data-sidebar')).toBe('full');
    });

    it('says when the computer is offline', () => {
        setup();
        const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
        act(() => {
            window.dispatchEvent(new Event('offline'));
        });
        expect(screen.getByText(/You’re offline/)).toBeTruthy();
        online.mockReturnValue(true);
        act(() => {
            window.dispatchEvent(new Event('online'));
        });
        expect(screen.queryByText(/You’re offline/)).toBeNull();
    });
});
