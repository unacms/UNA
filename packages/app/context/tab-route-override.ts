'use client';

import { createContext, useContext } from 'react';

/** When tab screens render in the shared slide layer, they keep per-tab route focus. */
export const TabRouteOverrideContext = createContext<unknown>(null);

/** True for the transient page copy TabSlideHost renders while tabs slide. */
export function useIsTabSlideCopy(): boolean {
    return useContext(TabRouteOverrideContext) != null;
}
