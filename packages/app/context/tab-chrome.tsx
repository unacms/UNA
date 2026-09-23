'use client';

import { createContext, useContext, type ReactNode } from 'react';

const WEB_CHROME_KEY = 'web';
const TabChromeContext = createContext<string | null>(null);

/** Each NativeTabs / JS tab screen owns its header chrome. */
export function TabChromeProvider({ tabKey, children }: { tabKey?: string | null; children?: ReactNode }) {
    return (
        <TabChromeContext.Provider value={tabKey || WEB_CHROME_KEY}>
            {children}
        </TabChromeContext.Provider>
    );
}

/** Stable per-tab key. Hidden tabs must not read the active pathname. */
export function useTabChromeKey(): string {
    return useContext(TabChromeContext) || WEB_CHROME_KEY;
}

export function isTabScopedChromeKey(key: unknown): key is string {
    return typeof key === 'string' && key.startsWith('/tab');
}
