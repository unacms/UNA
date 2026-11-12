import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../lib/command-bus';
import { AppContext, type AppContextValue } from '../lib/context';
import { fallbackMenus } from '../lib/native-menu';
import { RouterProvider } from '../lib/navigation';
import { RouteHistory, routeToPath, sectionRoute, settingsRoute } from '../lib/router';
import { command, spokenShortcut } from '../lib/shortcuts';
import { networkButtonName, networkMenu } from './network-switcher';
import { Pane } from './pane';
import { type CommandHandler, Shell } from './shell';
import type { NavItem } from './sidebar';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const club: Schema<'Profile'> = { id: '9', kind: 'organization', module: 'bx_organizations', display_name: 'Garden Club', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = {
    account: { id: '3', email: 'lily@example.com' },
    active_profile_id: '4',
    profiles: [
        { ...lily, about: '', created_at: '2026-01-01T00:00:00Z' },
        { ...club, about: '', created_at: '2026-01-01T00:00:00Z' },
    ],
} as unknown as Schema<'Me'>;

/** A site that never answers: the shell is under test, not the screens' data. */
function quietApi(): UnaApi {
    return createUnaApi({ siteUrl: 'https://community.example', fetch: () => new Promise<Response>(() => {}) });
}

const navItems = (requests: number): NavItem[] => [
    { section: 'home', label: 'Home', command: 'go-home', icon: 'house' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications', badge: 3, icon: 'bell' },
    { section: 'profile', label: 'Profile', command: 'go-profile', icon: 'circle-user-round' },
    { section: 'connections', label: 'Connections', icon: 'users', badge: requests, spokenBadge: `, ${requests} friend requests waiting` },
];

function renderShell({ history = new RouteHistory(sectionRoute('home')), requests = 0, run = vi.fn() } = {}) {
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
        const ctx: AppContextValue = {
            api: quietApi(),
            siteUrl: 'https://community.example',
            me,
            signOut: () => {},
            signingOut: false,
            messageTo: () => {},
            runCommand: (id) => (id === 'show-shortcuts' ? run(id) : commands.current?.(id)),
            sessions: [{ key: 'https://community.example|3', siteUrl: 'https://community.example', siteName: 'UNA Makers', accountName: 'Lily', active: true }],
            sessionKey: 'https://community.example|3',
        };
        return (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>
                    <Shell siteUrl="https://community.example" items={navItems(requests)} requests={requests} profile={lily} commands={commands} />
                </RouterProvider>
            </AppContext.Provider>
        );
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { history, run };
}

afterEach(() => {
    act(() => fallbackMenus.show(null));
    cleanup();
    localStorage.clear();
});

const sidebar = () => document.querySelector<HTMLElement>('[data-pane="sidebar"]')!;
const topBar = () => document.querySelector<HTMLElement>('.chrome-top')!;
const nav = () => screen.getByRole('navigation', { name: 'Sections' });
const field = () => screen.getByRole('searchbox', { name: 'Search people, posts and groups' }) as HTMLInputElement;

describe('the sidebar', () => {
    it('names the network, and the window after the section and the network', () => {
        renderShell();
        const network = within(sidebar()).getByRole('button', { name: 'UNA Makers, switch network' });
        expect(network.textContent).toContain('UNA Makers');
        expect(document.title).toBe('Home – UNA Makers');
        // the menu button says when its menu is open
        expect(network.getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(network);
        expect(network.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByRole('menu', { name: 'Networks' })).toBeTruthy();
        act(() => fallbackMenus.close(null));
        expect(network.getAttribute('aria-expanded')).toBe('false');
        expect(within(sidebar()).getByRole('button', { name: 'Lily, switch profile' }).getAttribute('aria-expanded')).toBe('false');
    });

    it('names the open network in its menu by the name the rest of the menu uses', () => {
        const entries = networkMenu({
            sessions: [
                { key: 'http://desktop.localhost:8090|1', siteUrl: 'http://desktop.localhost:8090', siteName: '', accountName: 'Andrey' },
                { key: 'https://b.example|2', siteUrl: 'https://b.example', siteName: '', accountName: '' },
            ],
            current: 'http://desktop.localhost:8090|1',
            name: 'UNA Makers',
            openSite: () => {},
            signOut: () => {},
        });
        const texts = entries.map((e) => (e === 'separator' ? '-' : e.text));
        expect(texts).toEqual(['UNA Makers – Andrey', 'b.example', '-', 'Open UNA Makers in Browser', '-', 'Sign Out of UNA Makers']);
        expect(networkButtonName({ name: 'UNA Makers', account: 'Andrey' }, [{ siteUrl: 'http://desktop.localhost:8090' }], 'http://desktop.localhost:8090')).toBe('UNA Makers, switch network');
        // one its site signed out stays in the menu, said so
        const kept = networkMenu({
            sessions: [{ key: 'http://desktop.localhost:8090|1', siteUrl: 'http://desktop.localhost:8090', siteName: 'UNA Makers', accountName: 'Andrey', needsSignIn: true }],
            name: 'Riverside Network',
            openSite: () => {},
            signOut: () => {},
        });
        expect(kept[0] !== 'separator' && kept[0]?.text).toBe('UNA Makers – Andrey (signed out)');
        // two accounts on one site: which one
        expect(networkButtonName({ name: 'UNA Makers', account: 'Andrey' }, [{ siteUrl: 'http://a.test' }, { siteUrl: 'http://a.test/' }], 'http://a.test')).toBe('UNA Makers, Andrey, switch network');
    });

    it('has icons and quiet counts, the number said in the row’s name', () => {
        renderShell();
        const row = within(nav()).getByRole('button', { name: 'Notifications, 3 unread' });
        expect(row.querySelector('.nav-icon .icon')).toBeTruthy();
        expect(row.querySelector('.nav-badge')?.textContent).toBe('3');
        expect(row.querySelector('.nav-badge')?.getAttribute('aria-hidden')).toBe('true');
        expect(row.getAttribute('title')).toBeNull();
        expect(row.getAttribute('aria-keyshortcuts')).toBe('Control+Alt+3');
        // Search is the field now, not a row
        expect(within(nav()).queryByRole('button', { name: /^Search/ })).toBeNull();
        // the search is a landmark of its own, outside the navigation
        expect(nav().contains(screen.getByRole('search'))).toBe(false);
    });

    it('counts friend requests on Connections, which shows them in the content pane, never beside a section', () => {
        // a part of Settings open beside Settings: a row replaces both
        const { history } = renderShell({ requests: 2, history: new RouteHistory(settingsRoute('keyboard')) });
        const row = within(nav()).getByRole('button', { name: 'Connections, 2 friend requests waiting' });
        expect(row.querySelector('.nav-badge')?.textContent).toBe('2');
        expect(row.getAttribute('aria-current')).toBeNull();
        fireEvent.click(row);
        expect(routeToPath(history.current)).toBe('/connections?tab=requests');
        expect(history.current.detail).toBeNull();
        expect(within(nav()).getByRole('button', { name: 'Connections, 2 friend requests waiting' }).getAttribute('aria-current')).toBe('page');
        expect(within(nav()).getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBeNull();
        expect(screen.getByRole('region', { name: 'Connections' })).toBeTruthy();
        // there is no Requests row any more
        expect(within(nav()).queryByRole('button', { name: /^Requests/ })).toBeNull();
    });

    it('has rows that only ever show a section: whatever was open beside a list closes', () => {
        const { history } = renderShell({ requests: 2 });
        for (const row of within(nav()).getAllByRole('button')) {
            act(() => history.push({ list: { section: 'notifications' }, detail: { kind: 'post', id: '12' } }));
            fireEvent.click(row);
            expect(history.current.detail, row.textContent ?? '').toBeNull();
        }
    });

    it('has no Requests row with none waiting', () => {
        renderShell();
        expect(within(nav()).queryByRole('button', { name: /Requests/ })).toBeNull();
    });

    it('drives Search from its field: typing shows it, Esc clears, Esc again goes back', async () => {
        const { history } = renderShell();
        fireEvent.change(field(), { target: { value: 'lily' } });
        await waitFor(() => expect(routeToPath(history.current)).toBe('/search?q=lily'));
        // the Search view draws no field of its own while the sidebar has one
        expect(screen.getAllByRole('searchbox')).toHaveLength(1);
        field().focus();
        fireEvent.keyDown(field(), { key: 'Escape' });
        expect(field().value).toBe('');
        expect(routeToPath(history.current)).toBe('/search?q=lily');
        await waitFor(() => expect(routeToPath(history.current)).toBe('/search'));
        fireEvent.keyDown(field(), { key: 'Escape' });
        expect(routeToPath(history.current)).toBe('/home');
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Home', level: 1 })));
    });

    it('shows the palette’s keys in the empty field, said in words', () => {
        renderShell();
        expect(document.querySelector('.search-hint kbd')).toBeTruthy();
        expect(spokenShortcut(command('command-palette'), true)).toBe('Command K');
        expect(spokenShortcut(command('new-message'), true)).toBe('Shift Command N');
        expect(spokenShortcut(command('switch-network-2'), false)).toBe('Control Shift 2');
    });

    it('opens the profile menu: the profiles, View Profile, Settings, Keyboard Shortcuts, Check for Updates, Sign Out', () => {
        const { run } = renderShell();
        const button = within(sidebar()).getByRole('button', { name: 'Lily, switch profile' });
        fireEvent.click(button);
        const menu = screen.getByRole('menu', { name: 'Profile' });
        expect(Array.from(menu.querySelectorAll('[role^="menuitem"]')).map((i) => i.textContent?.trim())).toEqual([
            'Lily',
            'Garden Club',
            'View Profile',
            'Settings…',
            'Keyboard Shortcuts',
            'Check for Updates…',
            'Sign Out',
        ]);
        expect(within(menu).getByRole('menuitemradio', { name: 'Lily' }).getAttribute('aria-checked')).toBe('true');
        fireEvent.click(within(menu).getByRole('menuitem', { name: 'Keyboard Shortcuts' }));
        expect(run).toHaveBeenCalledWith('show-shortcuts');
        expect(document.activeElement).toBe(button);
    });

    it('switches to icons only with its own button, which says what it does next', () => {
        renderShell();
        const shell = document.querySelector<HTMLElement>('.shell')!;
        expect(shell.style.getPropertyValue('--sidebar-width')).toBe('220px');
        // the toggle is the top bar's, over the sidebar
        fireEvent.click(within(topBar()).getByRole('button', { name: 'Show icons only' }));
        expect(shell.getAttribute('data-sidebar')).toBe('rail');
        // the rail's 56px is the stylesheet's: no inline width over it
        expect(shell.style.getPropertyValue('--sidebar-width')).toBe('');
        expect(within(topBar()).getByRole('button', { name: 'Show sidebar names' })).toBeTruthy();
        // the network and the profile keep their names as tooltips
        expect(within(sidebar()).getByRole('button', { name: 'UNA Makers, switch network' }).closest('.tooltip-anchor')).toBeTruthy();
        expect(within(sidebar()).getByRole('button', { name: 'Lily, switch profile' }).closest('.tooltip-anchor')).toBeTruthy();
        // under the rail Search is a row again, and its field is the Search view's
        fireEvent.click(within(nav()).getByRole('button', { name: 'Search' }));
        expect(screen.getAllByRole('searchbox')).toHaveLength(1);
    });

    describe('in a narrow window', () => {
        const narrow = (query: string) =>
            ({ matches: query !== '(min-width: 820px)', media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;
        afterEach(() => vi.unstubAllGlobals());

        it('opens its names over the panes with focus in them, and a pick closes them', async () => {
            vi.stubGlobal('matchMedia', narrow);
            const { history } = renderShell({ requests: 2 });
            const shell = document.querySelector<HTMLElement>('.shell')!;
            expect(shell.getAttribute('data-sidebar')).toBe('rail');
            const heading = screen.getByRole('heading', { name: 'Home', level: 1 });
            heading.focus();
            fireEvent.keyDown(heading, { key: '\\', code: 'Backslash', ctrlKey: true });
            expect(shell.getAttribute('data-sidebar')).toBe('overlay');
            expect(document.querySelector('main')?.hasAttribute('inert')).toBe(true);
            // the panes went inert: focus is in the names, not lost on the page
            await waitFor(() => expect(sidebar().contains(document.activeElement)).toBe(true));
            expect(document.activeElement).toBe(within(nav()).getByRole('button', { name: 'Home' }));
            // a pick closes the names, and the section's heading can take focus
            fireEvent.click(within(nav()).getByRole('button', { name: 'Connections, 2 friend requests waiting' }));
            expect(routeToPath(history.current)).toBe('/connections?tab=requests');
            expect(shell.getAttribute('data-sidebar')).toBe('rail');
            expect(document.querySelector('main')?.hasAttribute('inert')).toBe(false);
            expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Connections', level: 1 }));
        });
    });

    it('can be resized from the keyboard, remembered on this computer', () => {
        renderShell();
        const handle = screen.getByRole('separator', { name: 'Resize sidebar' });
        fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });
        expect(handle.getAttribute('aria-valuenow')).toBe('252');
        expect(JSON.parse(localStorage.getItem('una-desktop-layout') ?? '{}')).toMatchObject({ sidebar: 252 });
        // the list's handle is there only while a detail is open beside it
        expect(screen.queryByRole('separator', { name: 'Resize list' })).toBeNull();
    });
});

describe('the toolbar', () => {
    it('has Back and Forward, off but focusable with the reason while history can’t move', () => {
        const { history } = renderShell();
        // the name stays Back; why it does nothing is its description
        const back = screen.getByRole('button', { name: 'Back', description: 'nothing to go back to' });
        expect(back.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(back);
        expect(routeToPath(history.current)).toBe('/home');
        act(() => history.push(sectionRoute('notifications')));
        const live = screen.getByRole('button', { name: 'Back' });
        expect(live.getAttribute('aria-disabled')).toBeNull();
        expect(live.getAttribute('aria-keyshortcuts')).toBe('Control+[');
        fireEvent.click(live);
        expect(routeToPath(history.current)).toBe('/home');
        expect(screen.getByRole('button', { name: 'Forward' }).getAttribute('aria-disabled')).toBeNull();
    });

    it('closes the detail with an icon button named for it', () => {
        const { history } = renderShell({ history: new RouteHistory(settingsRoute('about')) });
        const close = within(screen.getByRole('region', { name: 'About' })).getByRole('button', { name: 'Close details' });
        expect(close.querySelector('[data-icon="x"]')).toBeTruthy();
        expect(close.getAttribute('aria-keyshortcuts')).toBe('Escape');
        fireEvent.click(close);
        expect(routeToPath(history.current)).toBe('/settings');
    });

    it('names the window after the open detail, and after the section again once it closes', () => {
        const { history } = renderShell({ history: new RouteHistory(settingsRoute('about')) });
        expect(document.title).toBe('About – UNA Makers');
        act(() => history.push(sectionRoute('notifications')));
        expect(document.title).toBe('Notifications – UNA Makers');
    });

    it('has the section’s action at its end: New post on Home, which opens the compose sheet', () => {
        renderShell();
        const head = screen.getByRole('region', { name: 'Home' }).querySelector('.pane-head')!;
        const newPost = within(head.querySelector<HTMLElement>('.pane-actions')!).getByRole('button', { name: 'New post' });
        expect(newPost.querySelector('[data-icon="square-pen"]')).toBeTruthy();
        expect(newPost.getAttribute('aria-keyshortcuts')).toBe('Control+N');
        fireEvent.click(newPost);
        expect(screen.getByRole('dialog', { name: 'New post' })).toBeTruthy();
    });

    it('puts a segmented control in its own slot, which a narrow pane moves to a second row', () => {
        renderShell({ history: new RouteHistory(sectionRoute('notifications')) });
        const head = screen.getByRole('region', { name: 'Notifications' }).querySelector('.pane-head')!;
        expect(head.querySelector('.pane-scope [role="tablist"]')).toBeTruthy();
        expect(head.querySelector('.pane-actions [role="tablist"]')).toBeNull();
    });
});

describe('a hero pane', () => {
    it('keeps its title for screen readers and focus, drawn only once the hero’s name is under the toolbar', () => {
        function Hero() {
            return (
                <RouterProvider history={new RouteHistory(sectionRoute('profile'))}>
                    <Pane pane="list" title="Lily Carter" hideTitle="until-scrolled">
                        <div className="profile-name" aria-hidden="true">
                            Lily Carter
                        </div>
                    </Pane>
                </RouterProvider>
            );
        }
        render(<Hero />);
        const heading = screen.getByRole('heading', { name: 'Lily Carter', level: 1 });
        expect(heading.className).toContain('pane-title-hero');
        expect(heading.className).not.toContain('sr-only');
        const head = heading.closest('.pane-head')!;
        expect(head.hasAttribute('data-title-shown')).toBe(false);
        const body = document.querySelector<HTMLElement>('.pane-body')!;
        const name = document.querySelector<HTMLElement>('.profile-name')!;
        body.getBoundingClientRect = () => ({ top: 52, bottom: 800 }) as DOMRect;
        name.getBoundingClientRect = () => ({ top: 10, bottom: 40 }) as DOMRect;
        fireEvent.scroll(body);
        expect(head.hasAttribute('data-title-shown')).toBe(true);
        name.getBoundingClientRect = () => ({ top: 100, bottom: 130 }) as DOMRect;
        fireEvent.scroll(body);
        expect(head.hasAttribute('data-title-shown')).toBe(false);
    });

    it('with buttons of its own (Close, Back) keeps its toolbar, the picture before the title; without, its toolbar is a bar over the content', () => {
        function Hero({ close }: { close: boolean }) {
            return (
                <RouterProvider history={new RouteHistory(sectionRoute('profile'))}>
                    <Pane pane="list" title="Lily Carter" hideTitle="until-scrolled" hero={{ picture: <span className="avatar" /> }} actions={close ? <button type="button">Close details</button> : undefined}>
                        <div className="profile-name" aria-hidden="true">
                            Lily Carter
                        </div>
                    </Pane>
                </RouterProvider>
            );
        }
        const { rerender } = render(<Hero close />);
        const heading = screen.getByRole('heading', { name: 'Lily Carter', level: 1 });
        const head = heading.closest('.pane-head')!;
        expect(head.classList.contains('pane-head-floating')).toBe(false);
        expect(head.hasAttribute('data-bar-hidden')).toBe(false);
        expect(within(head as HTMLElement).getByRole('button', { name: 'Close details' })).toBeTruthy();
        expect(heading.querySelector('.pane-title-picture .avatar')).toBeTruthy();
        expect(heading.closest('section')!.hasAttribute('data-hero-bar')).toBe(false);

        // the same heading when the pane goes without them: focus on it stays
        heading.focus();
        rerender(<Hero close={false} />);
        expect(head.classList.contains('pane-head-floating')).toBe(true);
        expect(head.hasAttribute('data-bar-hidden')).toBe(true);
        expect(heading.closest('section')!.hasAttribute('data-hero-bar')).toBe(true);
        expect(document.activeElement).toBe(heading);
    });
});
