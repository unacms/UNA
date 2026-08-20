import { atom, useSetAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { Platform } from 'react-native'
const isWeb = Platform.OS == 'web'

export const defaultHeader = {
    header: null,
    subHeader: null,
    backButton: false,
    title: false,
};
// Atoms
export const headerAtom = atom(defaultHeader);
export const footerAtom = atom(true);
export const scrollDirectionAtom = atom(0);
export const scrollValueAtom = atom(0);
const setScrollValueAtom = atom(null, (get, set, value) => {
    const next = Math.round(Number(value));
    if (!Number.isFinite(next) || next === get(scrollValueAtom)) return;
    set(scrollValueAtom, next);
});
/** Max scroll offset the active list can reach (content height − viewport). */
export const listMaxScrollOffsetAtom = atom(0);
/**
 * Extra bottom padding for the active list while the profile cover is
 * collapsed on a short list (see conductor.js). Keeps the scroll range equal
 * to the expanded-cover state so the list stays scrollable and the cover can
 * always be expanded back.
 */
export const coverScrollCompensationAtom = atom(0);
/** Scroll offset at which the native profile cover finishes collapsing (see conductor.js). */
export const COVER_COLLAPSE_SCROLL = 500;
/** Keep close to `layout.header.content` height (e.g. h-16 → 64) to minimize layout shift. */
export const DEFAULT_HEADER_HEIGHT = 64;
/**
 * SSR/hydration seed on web; on native each tab store starts here until PageHeader
 * `onLayout` publishes the measured height. Use DEFAULT (not 0) so list spacers are
 * not empty on first paint under the absolute header bar.
 */
export const headerHeightAtom = atom(DEFAULT_HEADER_HEIGHT);
export const footerHeightAtom = atom(0);

// Write-only atom: keep the last measured height while a visible header is
// being replaced. On web, the DOM may not emit another layout event if the
// header content is effectively the same, so clearing here can leave content
// tucked under the fixed header after HMR/theme/layout updates.
// On native, subHeader toggles must not zero height (Settings tabs clip); the
// PageHeader container onLayout updates the total instead.
export const setHeaderAtom = atom(null, (get, set, value) => {
    const prev = get(headerAtom);
    const next = typeof value === 'function' ? value(prev) : value;
    set(headerAtom, next);
    // Native: only a hidden header is known to be 0 tall. Swapping the chrome
    // for another element must keep the previous offset — React Native emits
    // `onLayout` again only when the measured size actually changes, so zeroing
    // on every swap leaves the list under a same-height bar (messenger, Settings
    // tabs) with no second measure to correct it.
    if (!isWeb && next?.header === false) {
        set(headerHeightAtom, 0);
    }
});

// Custom hooks
export const useSetHeader = () => useSetAtom(setHeaderAtom);
export const useHeader = () => useAtomValue(headerAtom);

export const useSetFooter = () => useSetAtom(footerAtom);
export const useFooter = () => useAtomValue(footerAtom);

export const useSetScrollDirection = () => useSetAtom(scrollDirectionAtom);
export const useScrollDirection = () => useAtomValue(scrollDirectionAtom);


export const useSetScrollValue = () => useSetAtom(setScrollValueAtom);
export const useScrollValue = () => useAtomValue(scrollValueAtom);
/**
 * Non-reactive read of the current scroll offset. Scroll writers fire every
 * frame — subscribe with `useScrollValue()` only when the UI must track the
 * offset continuously (cover collapse, overlay header); callbacks should read
 * through this hook, which resolves against the store of the screen it is
 * mounted in (each native tab has its own).
 */
export const useGetScrollValue = () =>
    useAtomCallback(useCallback((get) => get(scrollValueAtom), []));

export const useSetListMaxScrollOffset = () => useSetAtom(listMaxScrollOffsetAtom);
export const useListMaxScrollOffset = () => useAtomValue(listMaxScrollOffsetAtom);

export const useSetCoverScrollCompensation = () => useSetAtom(coverScrollCompensationAtom);
export const useCoverScrollCompensation = () => useAtomValue(coverScrollCompensationAtom);

export const useSetHeaderHeight = () => useSetAtom(headerHeightAtom);
export const useHeaderHeight = () => useAtomValue(headerHeightAtom);

export const useSetFooterHeight = () => useSetAtom(footerHeightAtom);
export const useFooterHeight = () => useAtomValue(footerHeightAtom);