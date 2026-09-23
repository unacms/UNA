'use client';

import { createContext } from 'react';

/** When tab screens render in the shared slide layer, they keep per-tab route focus. */
export const TabRouteOverrideContext = createContext<unknown>(null);
