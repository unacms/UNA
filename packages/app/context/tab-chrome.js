'use client';

import { createContext, useContext } from 'react';

const WEB_CHROME_KEY = 'web';
const TabChromeContext = createContext(null);

/** Each NativeTabs / JS tab screen owns its header chrome. */
export function TabChromeProvider({ tabKey, children }) {
    return (
        <TabChromeContext.Provider value={tabKey || WEB_CHROME_KEY}>
            {children}
        </TabChromeContext.Provider>
    );
}

/** Stable per-tab key. Hidden tabs must not read the active pathname. */
export function useTabChromeKey() {
    return useContext(TabChromeContext) || WEB_CHROME_KEY;
}

export function isTabScopedChromeKey(key) {
    return typeof key === 'string' && key.startsWith('/tab');
}
