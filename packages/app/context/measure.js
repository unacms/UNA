import { create } from 'zustand';
import { Dimensions } from 'react-native';
import { appSetting, getBreakpoint, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { useState, useEffect, useLayoutEffect } from 'react';
import { Platform } from 'react-native'
const DESKTOP_KEY = appSetting('layout', 'tablet_mode_from') || 'lg';
const DESKTOP_FROM = LAYOUT_BREAKPOINTS[DESKTOP_KEY] ?? LAYOUT_BREAKPOINTS.lg;
// SSR has no viewport; assume 2xl so responsive panel configs (e.g. wiki side columns
// with defaultSize: 0 until xl) resolve to desktop sizes on the first render.
const SSR_LAYOUT_BREAKPOINT = LAYOUT_BREAKPOINTS['2xl'] ?? DESKTOP_FROM;
const BP_VALUES_DESC = Object.values(LAYOUT_BREAKPOINTS).sort((a, b) => b - a);

const getBP = (w) => {
    for (const value of BP_VALUES_DESC) {
        if (w >= value) return value;
    }
    return 0;
};

const initW = Math.round(Dimensions.get('window').width);
const initH = Math.round(Dimensions.get('window').height);
const isSSR = typeof window === 'undefined';

export const useMeasureStore = create((set, get) => ({
    currentBreakpoint: getBP(initW),
    windowWidth: initW,
    windowHeight: initH,
    isDesktop: isSSR ? true : initW >= DESKTOP_FROM,

    setWindowSize: (w, h) => {
        const { windowWidth, windowHeight, currentBreakpoint, isDesktop } = get();
        if (w === windowWidth && h === windowHeight) return;

        const nextBP = getBP(w);
        const nextIsDesktop = w >= DESKTOP_FROM;

        const update = { windowWidth: w, windowHeight: h };
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
            const vpHeight = Math.round(window.visualViewport.height);
            const kbOpen = window.innerHeight - vpHeight > 150;
            setActualHeight(vpHeight);
            setIsKeyboardOpen(kbOpen);
        };
        update();
        window.visualViewport.addEventListener('resize', update);
        return () => window.visualViewport.removeEventListener('resize', update);
    }, [isWeb, fallbackHeight]);
    return { height: actualHeight, isKeyboardOpen };
};


// SSR always renders as desktop (window width is 0 on the server, see `isDesktop` above).
// On web the first client render must return the same value as SSR, otherwise components
// branching on `useIsDesktop()` (e.g. PageHeader's collapsible header) produce hydration
// mismatches — which in Next 16 / React 19.2 dev can cascade into
// "RangeError: Maximum call stack size exceeded" during hydration recovery.
let didHydrate = Platform.OS !== 'web';
const useHydrated = () => {
    const [hydrated, setHydrated] = useState(didHydrate);
    useLayoutEffect(() => {
        if (!hydrated) {
            didHydrate = true;
            setHydrated(true);
        }
    }, [hydrated]);
    return hydrated;
};

export const useBreakpoint = () => useMeasureStore((s) => s.currentBreakpoint);
// SSR and the first client render share the same snapshot until hydration.
export const useBreakpointName = () => {
    const currentBreakpoint = useMeasureStore((s) => s.currentBreakpoint);
    const hydrated = useHydrated();
    return getBreakpoint(hydrated ? currentBreakpoint : SSR_LAYOUT_BREAKPOINT);
};
export const useIsDesktop = () => {
    const isDesktop = useMeasureStore((s) => s.isDesktop);
    const hydrated = useHydrated();
    return hydrated ? isDesktop : true;
};
export const useWindowSize = () => useMeasureStore((s) => ({ width: s.windowWidth, height: s.windowHeight }));
export const useWindowHeight = () => useMeasureStore((s) => (s.windowHeight));
export const useWindowWidth = () => useMeasureStore((s) => (s.windowWidth));
export const useSetWindowSize = () => useMeasureStore((s) => s.setWindowSize);
