import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { listenForCommands } from '../lib/command-bus';
import { AppContext, type AppContextValue } from '../lib/context';
import { TabsProvider } from '../lib/navigation';
import { isWindowGesture, useOpenInWindow } from '../lib/open-in-window';
import { routeToPath, sectionRoute } from '../lib/router';
import type { Navigation, NavigationItem } from '../lib/site-navigation';
import { TabsModel, tabsStorageKey } from '../lib/tabs';
import { type CommandHandler, Shell } from './shell';
import type { NavItem } from './sidebar';

const lily: Schema<'Profile'> = { id: '4', kind: 'person', module: 'bx_persons', display_name: 'Lily', status: 'active', about: '', created_at: '2026-01-01T00:00:00Z' };
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [lily] } as unknown as Schema<'Me'>;
const SITE = 'https://community.example';

function footerItem(name: string, title: string, more: Partial<NavigationItem> = {}): NavigationItem {
    return { id: `sys_footer:system:${name}`, set: 'sys_footer', module: 'system', name, title, icon: null, link: null, counter: null, target: null, tabs: [], contexts: [], more_contexts: false, all_target: null, config: {}, hidden_on: [], ...more };
}

const NAVIGATION: Navigation = {
    menu: 'sys_apps_sidebar',
    platform: 'desktop-app',
    groups: [],
    footer: [
        footerItem('about', 'About', { link: `${SITE}/about`, target: { kind: 'page', section: null, view: null, id: null, module: null, path: '/page/about' } }),
        footerItem('help', 'Help', { link: 'https://help.example.org/una' }),
        // the site's own page the app can't show: left out, never "open on the site"
        footerItem('contact', 'Contact', { link: `${SITE}/contact` }),
        footerItem('copyright', '© 2026 Community. All rights reserved.'),
    ],
};

const items: NavItem[] = [
    { section: 'home', label: 'Home', command: 'go-home', icon: 'house' },
    { section: 'explore', label: 'Explore', command: 'go-explore', icon: 'compass' },
    { section: 'notifications', label: 'Notifications', command: 'go-notifications', icon: 'bell' },
    { section: 'messages', label: 'Messages', command: 'go-messages', icon: 'message-circle' },
];

/** A storage of the test's own for the tabs. */
function memory() {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

function api(navigation: Navigation | null = NAVIGATION): UnaApi {
    return createUnaApi({
        siteUrl: SITE,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const path = new URL(request.url).pathname.replace(/^\/api\/v2/, '');
            if (path === '/navigation') return navigation ? new Response(JSON.stringify(navigation), { status: 200, headers: { 'Content-Type': 'application/json' } }) : new Response(null, { status: 404 });
            return new Promise<Response>(() => {});
        },
    });
}

/** Opens a post with the window's gestures, as the lists do. */
function Opener() {
    const open = useOpenInWindow();
    return (
        <button
            type="button"
            onClick={(e) => {
                if (open && isWindowGesture(e)) open({ kind: 'post', id: '12' });
            }}
        >
            Post 12
        </button>
    );
}

function renderChrome({ tabs = new TabsModel(sectionRoute('home'), tabsStorageKey(`${SITE}|3`), memory()), navigation = NAVIGATION as Navigation | null } = {}) {
    function Harness() {
        const commands = useRef<CommandHandler | null>(null);
        useEffect(() => listenForCommands((id) => commands.current?.(id), { mac: false, nativeMenu: false }), []);
        const ctx: AppContextValue = { api: api(navigation), siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
        return (
            <AppContext.Provider value={ctx}>
                <TabsProvider tabs={tabs}>
                    <Shell siteUrl={SITE} items={items} profile={lily} commands={commands} />
                    <Opener />
                </TabsProvider>
            </AppContext.Provider>
        );
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } }, logger: { log: () => {}, warn: () => {}, error: () => {} } });
    const view = render(
        <QueryClientProvider client={client}>
            <Harness />
        </QueryClientProvider>,
    );
    return { tabs, view };
}

const key = (k: string, code: string, mods: Partial<KeyboardEvent> = {}) => act(() => void fireEvent.keyDown(window, { key: k, code, ctrlKey: true, ...mods }));
const topBar = () => document.querySelector<HTMLElement>('.chrome-top')!;
const bottomBar = () => document.querySelector<HTMLElement>('.chrome-bottom')!;
const tablist = () => screen.getByRole('tablist', { name: 'Tabs' });
const tabNames = () => within(tablist()).getAllByRole('tab').map((t) => t.querySelector('.tab-title')?.textContent);
const shell = () => document.querySelector<HTMLElement>('.shell')!;

afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
});

describe('the window’s chrome', () => {
    it('draws the section’s icon before its title, the icon its tab has, outside the heading’s name', () => {
        renderChrome();
        const heading = screen.getByRole('heading', { level: 1, name: 'Home' });
        const icon = heading.querySelector('.pane-title-icon [data-icon]');
        expect(icon?.getAttribute('data-icon')).toBe(within(tablist()).getByRole('tab').querySelector('[data-icon]')?.getAttribute('data-icon'));
        expect(icon?.closest('[aria-hidden="true"]')).toBeTruthy();
    });

    it('keeps the top and bottom bars with the sidebar’s names, its icons and with it hidden', () => {
        renderChrome();
        // the top bar: the sidebar's toggle, History, Back and Forward, the tabs; the content in its container
        for (const name of ['Show icons only', 'Recently visited', 'Back', 'Forward', 'New tab']) expect(within(topBar()).getByRole('button', { name })).toBeTruthy();
        expect(within(topBar()).getByRole('tablist', { name: 'Tabs' })).toBeTruthy();
        expect(screen.getByRole('main').classList.contains('content')).toBe(true);
        const panel = document.getElementById('tab-panel')!;
        expect(panel.getAttribute('role')).toBe('tabpanel');
        expect(panel.contains(screen.getByRole('region', { name: 'Home' }))).toBe(true);
        expect(panel.getAttribute('aria-labelledby')).toBe(within(tablist()).getByRole('tab').id);
        expect(within(tablist()).getByRole('tab').getAttribute('aria-controls')).toBe('tab-panel');
        // Back and Forward are the top bar's, not the list pane's
        expect(within(screen.getByRole('region', { name: 'Home' })).queryByRole('button', { name: 'Back' })).toBeNull();

        fireEvent.click(within(topBar()).getByRole('button', { name: 'Show icons only' }));
        expect(shell().dataset.sidebar).toBe('rail');
        expect(topBar().isConnected && bottomBar().isConnected).toBe(true);
        expect(within(topBar()).getByRole('button', { name: 'Show sidebar names' })).toBeTruthy();

        // Cmd+Ctrl+S (Ctrl+Shift+S here): no sidebar at all, the bars stay
        key('S', 'KeyS', { shiftKey: true });
        expect(shell().dataset.sidebar).toBe('hidden');
        expect(document.querySelector('[data-pane="sidebar"]')).toBeNull();
        expect(within(topBar()).getByRole('button', { name: 'Show sidebar' })).toBeTruthy();
        expect(bottomBar().isConnected).toBe(true);
        expect(localStorage.getItem('una-desktop-sidebar-hidden')).toBe('1');
        // the toggle brings it back as it was
        fireEvent.click(within(topBar()).getByRole('button', { name: 'Show sidebar' }));
        expect(shell().dataset.sidebar).toBe('rail');
        expect(document.querySelector('[data-pane="sidebar"]')).toBeTruthy();
    });

    it('shows the footer’s links: pages open in the app, other sites in the browser, text as text', async () => {
        const { tabs } = renderChrome();
        const footer = await screen.findByRole('navigation', { name: 'Footer' });
        expect(bottomBar().contains(footer)).toBe(true);
        expect(within(footer).getByRole('link', { name: 'Help' }).getAttribute('href')).toBe('https://help.example.org/una');
        expect(within(footer).queryByText('Contact')).toBeNull();
        expect(within(footer).getByText('© 2026 Community. All rights reserved.').tagName).toBe('SPAN');
        // a page: the content pane, nothing beside it
        act(() => tabs.active.history.push({ list: { section: 'home' }, detail: { kind: 'post', id: '1' } }));
        fireEvent.click(within(footer).getByRole('button', { name: 'About' }));
        const route = tabs.active.history.current;
        expect(route.list.section).toBe('page');
        expect(route.list.page).toBe('/page/about');
        expect(route.detail).toBeNull();
    });

    it('draws no footer for a site without GET /navigation', async () => {
        renderChrome({ navigation: null });
        await act(async () => {});
        expect(screen.queryByRole('navigation', { name: 'Footer' })).toBeNull();
        expect(bottomBar().isConnected).toBe(true);
    });
});

describe('tabs', () => {
    it('opens, names, selects, closes and reopens tabs from the keys', async () => {
        const { tabs } = renderChrome();
        expect(tabNames()).toEqual(['Home']);
        // one tab: no close button, Cmd+W leaves it
        expect(within(topBar()).queryByRole('button', { name: /^Close/ })).toBeNull();
        key('w', 'KeyW');
        expect(tabs.tabs).toHaveLength(1);

        key('t', 'KeyT');
        expect(tabNames()).toEqual(['Home', 'Home']);
        expect(within(tablist()).getAllByRole('tab')[1]!.getAttribute('aria-selected')).toBe('true');
        await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Home', level: 1 })));
        // the new tab goes elsewhere and is named after it
        key('3', 'Digit3', { altKey: true });
        expect(tabNames()).toEqual(['Home', 'Notifications']);
        expect(routeToPath(tabs.tabs[0]!.history.current)).toBe('/home');

        // Cmd+1: the first tab, its own route and history
        key('1', 'Digit1');
        expect(within(tablist()).getAllByRole('tab')[0]!.getAttribute('aria-selected')).toBe('true');
        expect(screen.getByRole('region', { name: 'Home' })).toBeTruthy();
        expect(within(topBar()).getByRole('button', { name: 'Back' }).getAttribute('aria-disabled')).toBe('true');
        // Cmd+9: the last one
        key('9', 'Digit9');
        expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy();
        expect(within(topBar()).getByRole('button', { name: 'Back' }).getAttribute('aria-disabled')).toBeNull();

        key('w', 'KeyW');
        expect(tabNames()).toEqual(['Home']);
        key('T', 'KeyT', { shiftKey: true });
        expect(tabNames()).toEqual(['Home', 'Notifications']);
        // back with its history
        fireEvent.click(within(topBar()).getByRole('button', { name: 'Back' }));
        expect(routeToPath(tabs.active.history.current)).toBe('/home');
    });

    it('follows the tab pattern: arrows show the next tab, Delete and the close button close, middle click too', () => {
        const { tabs } = renderChrome();
        act(() => {
            tabs.open(sectionRoute('explore'), { title: 'Explore', icon: 'compass' });
            tabs.open(sectionRoute('messages'), { title: 'Messages', icon: 'message-circle' });
        });
        const all = () => within(tablist()).getAllByRole('tab');
        // one tab in the tab order: the one shown, with its close button after it
        expect(all().map((t) => t.tabIndex)).toEqual([-1, -1, 0]);
        const close = within(topBar()).getByRole('button', { name: 'Close Messages' });
        expect(close.tabIndex).toBe(0);
        expect(within(topBar()).getByRole('button', { name: 'Close Explore' }).tabIndex).toBe(-1);

        all()[2]!.focus();
        fireEvent.keyDown(all()[2]!, { key: 'ArrowLeft' });
        expect(all()[1]!.getAttribute('aria-selected')).toBe('true');
        expect(screen.getByRole('region', { name: 'Explore' })).toBeTruthy();
        fireEvent.keyDown(all()[1]!, { key: 'Home' });
        expect(all()[0]!.getAttribute('aria-selected')).toBe('true');
        fireEvent.keyDown(all()[0]!, { key: 'End' });
        expect(all()[2]!.getAttribute('aria-selected')).toBe('true');

        // Option+Shift+Left moves the tab
        fireEvent.keyDown(all()[2]!, { key: 'ArrowLeft', altKey: true, shiftKey: true });
        expect(tabNames()).toEqual(['Home', 'Messages', 'Explore']);

        fireEvent.keyDown(all()[1]!, { key: 'Delete' });
        expect(tabNames()).toEqual(['Home', 'Explore']);
        fireEvent.click(within(topBar()).getByRole('button', { name: 'Close Explore' }));
        expect(tabNames()).toEqual(['Home']);
        act(() => void tabs.open(sectionRoute('explore'), { title: 'Explore', icon: 'compass' }));
        fireEvent(all()[1]!, new MouseEvent('auxclick', { bubbles: true, button: 1 }));
        expect(tabNames()).toEqual(['Home']);
    });

    it('opens a post in a background tab with Ctrl+click, and in a window with Ctrl+Alt+click', () => {
        const { tabs } = renderChrome();
        const shown = tabs.active.id;
        fireEvent.click(screen.getByRole('button', { name: 'Post 12' }), { ctrlKey: true });
        expect(tabs.tabs).toHaveLength(2);
        expect(tabs.active.id).toBe(shown);
        expect(routeToPath(tabs.tabs[1]!.history.current)).toBe('/home/post/12');
        // named and drawn for what it shows before it is ever shown
        expect(tabNames()).toEqual(['Home', 'Post']);
        expect(within(tablist()).getAllByRole('tab')[1]!.querySelector('[data-icon="house"]')).toBeTruthy();
        // a plain click opens nothing elsewhere; with Alt it is a window, not a tab
        fireEvent.click(screen.getByRole('button', { name: 'Post 12' }));
        fireEvent.click(screen.getByRole('button', { name: 'Post 12' }), { ctrlKey: true, altKey: true });
        expect(tabs.tabs).toHaveLength(2);
    });

    it('comes back after a restart with the same tabs per network, and lists the places visited', () => {
        const store = memory();
        const makers = tabsStorageKey('http://desktop.localhost:8090|1');
        const first = renderChrome({ tabs: new TabsModel(sectionRoute('home'), makers, store) });
        key('t', 'KeyT');
        key('2', 'Digit2', { altKey: true });
        expect(tabNames()).toEqual(['Home', 'Explore']);
        first.view.unmount();

        renderChrome({ tabs: new TabsModel(sectionRoute('home'), makers, store) });
        expect(tabNames()).toEqual(['Home', 'Explore']);
        expect(within(tablist()).getAllByRole('tab')[1]!.getAttribute('aria-selected')).toBe('true');
        cleanup();
        // another network: its own tabs
        renderChrome({ tabs: new TabsModel(sectionRoute('home'), tabsStorageKey('http://network2.localhost:8092|1'), store) });
        expect(tabNames()).toEqual(['Home']);
        // History lists what this network's tabs showed
        const visited = within(topBar()).getByRole('button', { name: 'Recently visited' });
        expect(visited.getAttribute('aria-disabled')).toBe('true');
    });
});
