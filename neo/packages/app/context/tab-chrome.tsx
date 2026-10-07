'use client';

import { createContext, useContext, type ReactNode } from 'react';

const WEB_CHROME_KEY = 'web';
const TabChromeContext = createContext<string | null>(null);
const PushedScreenContext = createContext(false);

/**
 * Each NativeTabs / JS tab screen owns its header chrome. The key is the tab
 * (`/tab0`) for a tab root and `/tab0/page#…` for a page pushed onto the tab's
 * stack, so header height and scroll state stay per screen while several pages
 * of one tab are mounted. `pushed`: the screen has a page below it to go back to.
 */
export function TabChromeProvider({ tabKey, pushed = false, children }: { tabKey?: string | null; pushed?: boolean; children?: ReactNode }) {
    return (
        <TabChromeContext.Provider value={tabKey || WEB_CHROME_KEY}>
            <PushedScreenContext.Provider value={pushed}>
                {children}
            </PushedScreenContext.Provider>
        </TabChromeContext.Provider>
    );
}

/** Stable per-screen key. Hidden tabs must not read the active pathname. */
export function useTabChromeKey(): string {
    return useContext(TabChromeContext) || WEB_CHROME_KEY;
}

/** True on a page pushed onto a tab's native stack (back pops it). */
export function useIsPushedScreen(): boolean {
    return useContext(PushedScreenContext);
}

export function isTabScopedChromeKey(key: unknown): key is string {
    return typeof key === 'string' && key.startsWith('/tab');
}
