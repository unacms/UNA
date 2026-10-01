import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { appSetting, getBreakpoint, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { useState, useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native'
const DESKTOP_KEY = appSetting('layout', 'tablet_mode_from') || 'lg';
const DESKTOP_FROM = LAYOUT_BREAKPOINTS[DESKTOP_KEY as keyof typeof LAYOUT_BREAKPOINTS] ?? LAYOUT_BREAKPOINTS.lg;
// SSR has no viewport; assume 2xl so responsive panel configs (e.g. wiki side columns
// with defaultSize: 0 until xl) resolve to desktop sizes on the first render.
const SSR_LAYOUT_BREAKPOINT = LAYOUT_BREAKPOINTS['2xl'] ?? DESKTOP_FROM;
const BP_VALUES_DESC = (Object.values(LAYOUT_BREAKPOINTS) as number[]).sort((a, b) => b - a);

const getBP = (w: number): number => {
    for (const value of BP_VALUES_DESC) {
        if (w >= value) return value;
    }
    return 0;
};

const initW = Math.round(Dimensions.get('window').width);
const initH = Math.round(Dimensions.get('window').height);
const isSSR = typeof window === 'undefined';

type MeasureStore = {
    /** Largest LAYOUT_BREAKPOINTS width (px) that fits the window; 0 below the smallest. */
    currentBreakpoint: number;
    windowWidth: number;
    windowHeight: number;
    isDesktop: boolean;
    setWindowSize: (w: number, h: number) => void;
};

export const useMeasureStore = create<MeasureStore>()((set, get) => ({
    currentBreakpoint: getBP(initW),
    windowWidth: initW,
    windowHeight: initH,
    isDesktop: isSSR ? true : initW >= DESKTOP_FROM,

    setWindowSize: (w, h) => {
        const { windowWidth, windowHeight, currentBreakpoint, isDesktop } = get();
        if (w === windowWidth && h === windowHeight) return;

        const nextBP = getBP(w);
        const nextIsDesktop = w >= DESKTOP_FROM;

        const update: Partial<MeasureStore> = { windowWidth: w, windowHeight: h };
        if (nextBP !== currentBreakpoint) update.currentBreakpoint = nextBP;
        if (nextIsDesktop !== isDesktop) update.isDesktop = nextIsDesktop;

        set(update);
    },
}));

export const useActualWindowHeight = () => {
    const isWeb = Platform.OS === 'web';
    const fallbackHeight = useWindowHeight();
    const [actualHeight, setActualHeight] = useState(fallbackHeight);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    useEffect(() => {
        if (!isWeb || !window.visualViewport) {
            setActualHeight(fallbackHeight);
            setIsKeyboardOpen(false);
            return;
        }
        const update = () => {
            // Only subscribed when visualViewport exists (checked above).
            const vpHeight = Math.round(window.visualViewport!.height);
            const kbOpen = window.innerHeight - vpHeight > 150;
            setActualHeight(vpHeight);
            setIsKeyboardOpen(kbOpen);
        };
        update();
        window.visualViewport.addEventListener('resize', update);
        return () => window.visualViewport!.removeEventListener('resize', update);
    }, [isWeb, fallbackHeight]);
    return { height: actualHeight, isKeyboardOpen };
};


// SSR always renders as desktop (window width is 0 on the server, see `isDesktop` above).
// On web every hydrating render must return the same value as SSR, otherwise components
// branching on `useIsDesktop()` (e.g. PageHeader's collapsible header) produce hydration
// mismatches — which in Next 16 / React 19.2 dev can cascade into
// "RangeError: Maximum call stack size exceeded" during hydration recovery.
// useSyncExternalStore returns the server snapshot whenever React hydrates, then re-renders
// with the client one. That holds per Suspense boundary: next/dynamic molecules (e.g. the
// header toolbar) hydrate after the shell commits, when a module-level "hydrated" flag
// would already read true. Client-only mounts (and native) get `true` right away.
const subscribeNoop = () => () => {};
const getHydratedOnClient = () => true;
const getHydratedOnServer = () => false;
const useHydrated = () => useSyncExternalStore(subscribeNoop, getHydratedOnClient, getHydratedOnServer);

// SSR and hydrating renders use SSR_LAYOUT_BREAKPOINT (desktop, like useIsDesktop), so layouts
// that switch structure on the breakpoint (universal.js rows vs panels, wiki/post flags) hydrate
// cleanly and adapt to the real viewport right after.
export const useBreakpoint = () => {
    const currentBreakpoint = useMeasureStore((s) => s.currentBreakpoint);
    return useHydrated() ? currentBreakpoint : SSR_LAYOUT_BREAKPOINT;
};
export const useBreakpointName = () => getBreakpoint(useBreakpoint());
export const useIsDesktop = () => {
    const isDesktop = useMeasureStore((s) => s.isDesktop);
    const hydrated = useHydrated();
    return hydrated ? isDesktop : true;
};
// Window size is 0×0 during SSR (no window). Until hydration, return that same 0 so
// styles derived from it (e.g. post layout `minHeight: windowHeight - 64`) match the
// server HTML — React doesn't patch mismatched attributes, so they'd stay wrong.
const SSR_WINDOW_SIZE = { width: 0, height: 0 };
// New object per call: consumers re-render on any store change (fine on zustand v4;
// needs useShallow on v5, which would otherwise loop).
export const useWindowSize = () => {
    const size = useMeasureStore((s) => ({ width: s.windowWidth, height: s.windowHeight }));
    return useHydrated() ? size : SSR_WINDOW_SIZE;
};
export const useWindowHeight = () => {
    const height = useMeasureStore((s) => s.windowHeight);
    return useHydrated() ? height : SSR_WINDOW_SIZE.height;
};
export const useWindowWidth = () => {
    const width = useMeasureStore((s) => s.windowWidth);
    return useHydrated() ? width : SSR_WINDOW_SIZE.width;
};
export const useSetWindowSize = () => useMeasureStore((s) => s.setWindowSize);
