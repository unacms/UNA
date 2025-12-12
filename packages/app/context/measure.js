import { create } from 'zustand';
import { Dimensions, Platform } from 'react-native';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util';

const DESKTOP_KEY = appSetting('layout', 'tablet_mode_from') || 'lg';
const DESKTOP_FROM = LAYOUT_BREAKPOINTS[DESKTOP_KEY] ?? LAYOUT_BREAKPOINTS.lg;
const BP_VALUES_DESC = Object.values(LAYOUT_BREAKPOINTS).sort((a, b) => b - a);

const getBP = (w) => {
    for (const value of BP_VALUES_DESC) {
        if (w >= value) return value;
    }
    return 0;
};

// SSR/hydration safety:
// On web, server render can't know the real viewport width. If the client bootstraps with a
// different initial width, any `useIsDesktop()` conditional rendering will hydrate-mismatch.
//
// We start web at 0x0 for BOTH server + client initial render, then `WindowSizeSync`
// (in `packages/app/components/layouts.js`) updates the store after mount.
const isWeb = Platform.OS === 'web';
const initW = isWeb ? 0 : Math.round(Dimensions.get('window').width);
const initH = isWeb ? 0 : Math.round(Dimensions.get('window').height);

export const useMeasureStore = create((set, get) => ({
    currentBreakpoint: getBP(initW),
    windowWidth: initW,
    windowHeight: initH,
    isDesktop: initW >= DESKTOP_FROM,

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

export const useBreakpoint = () => useMeasureStore((s) => s.currentBreakpoint);
export const useIsDesktop = () => useMeasureStore((s) => s.isDesktop);
export const useWindowSize = () => useMeasureStore((s) => ({ width: s.windowWidth, height: s.windowHeight }));
export const useWindowHeight = () => useMeasureStore((s) => (s.windowHeight));
export const useWindowWidth = () => useMeasureStore((s) => (s.windowWidth));
export const useSetWindowSize = () => useMeasureStore((s) => s.setWindowSize);
