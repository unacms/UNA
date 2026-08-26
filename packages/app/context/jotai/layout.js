import { useCallback } from 'react';
import { atom, useSetAtom, useAtomValue } from 'jotai';
import { Platform } from 'react-native'
import { useTabChromeKey } from 'app/context/tab-chrome';
const isWeb = Platform.OS == 'web'

export const defaultHeader = {
    header: null,
    subHeader: null,
    backButton: false,
    title: false,
};
// Atoms
export const headerAtom = atom(defaultHeader);
// Monotonic id of the last `setHeader` write. Blur resets compare against
// this so a screen that already lost the atom does not wipe a newer owner
// (sibling useEffects in one commit, or useFocusEffect before useEffect).
let headerWriteGeneration = 0;
export const getHeaderWriteGeneration = () => headerWriteGeneration;
export const footerAtom = atom(true);
export const scrollDirectionAtom = atom(0);
export const scrollValueAtom = atom(0);
// Non-reactive mirror, keyed per tab. Scroll writers fire every frame — subscribe
// with `useScrollValue()` only when the UI must track offset continuously
// (cover collapse, overlay header). Callbacks should use `useGetScrollValue()`.
const scrollValueCurrentByTab = new Map();
export const getScrollValue = (tabKey = 'web') => scrollValueCurrentByTab.get(tabKey) ?? 0;
/** Tab-scoped getter: reads the scroll offset of the tab this component lives in. */
export const useGetScrollValue = () => {
    const tabKey = useTabChromeKey();
    return useCallback(() => getScrollValue(tabKey), [tabKey]);
};
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
/**
 * SSR/hydration seed for headerHeightAtom on web only.
 * After mount, PageHeader `onLayout` replaces this with the measured height.
 * Keep close to `layout.header.content` height (e.g. h-14 → 56) to minimize layout shift.
 */
export const DEFAULT_HEADER_HEIGHT = 64;
export const headerHeightAtom = atom(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
export const footerHeightAtom = atom(0);

const headerAtomsByTab = new Map([['web', headerAtom]]);
const headerHeightAtomsByTab = new Map([['web', headerHeightAtom]]);
const setHeaderAtomsByTab = new Map();

function getTabAtom(map, key, create) {
    let next = map.get(key);
    if (!next) {
        next = create(key);
        map.set(key, next);
    }
    return next;
}

// Scroll state is per tab: native tab screens stay mounted when blurred, so a
// single global atom would re-render chrome (PageHeader, menus) in every tab on
// each scroll frame of the focused one.
const scrollDirectionAtomsByTab = new Map([['web', scrollDirectionAtom]]);
const scrollValueAtomsByTab = new Map([['web', scrollValueAtom]]);
const setScrollValueAtomsByTab = new Map();
const isScrolledAtomsByTab = new Map();
const listMaxScrollOffsetAtomsByTab = new Map([['web', listMaxScrollOffsetAtom]]);
const coverScrollCompensationAtomsByTab = new Map([['web', coverScrollCompensationAtom]]);

const getScrollDirectionAtomForTab = (key) => getTabAtom(scrollDirectionAtomsByTab, key, () => atom(0));
const getScrollValueAtomForTab = (key) => getTabAtom(scrollValueAtomsByTab, key, () => atom(0));
const getListMaxScrollOffsetAtomForTab = (key) => getTabAtom(listMaxScrollOffsetAtomsByTab, key, () => atom(0));
const getCoverScrollCompensationAtomForTab = (key) => getTabAtom(coverScrollCompensationAtomsByTab, key, () => atom(0));
const getIsScrolledAtomForTab = (key) =>
    getTabAtom(isScrolledAtomsByTab, key, (k) => atom((get) => get(getScrollValueAtomForTab(k)) > 0));
const getSetScrollValueAtomForTab = (key) =>
    getTabAtom(setScrollValueAtomsByTab, key, (k) =>
        atom(null, (_get, set, value) => {
            const next = Math.round(Number(value));
            if (!Number.isFinite(next) || next === getScrollValue(k)) return;
            scrollValueCurrentByTab.set(k, next);
            set(getScrollValueAtomForTab(k), next);
        })
    );

function getHeaderAtomForTab(key) {
    let next = headerAtomsByTab.get(key);
    if (!next) {
        next = atom(defaultHeader);
        headerAtomsByTab.set(key, next);
    }
    return next;
}

function getHeaderHeightAtomForTab(key) {
    let next = headerHeightAtomsByTab.get(key);
    if (!next) {
        next = atom(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
        headerHeightAtomsByTab.set(key, next);
    }
    return next;
}

function createSetHeaderAtom(key) {
    return atom(null, (get, set, value) => {
        headerWriteGeneration += 1;
        const tabHeaderAtom = getHeaderAtomForTab(key);
        const tabHeightAtom = getHeaderHeightAtomForTab(key);
        const prev = get(tabHeaderAtom);
        const next = typeof value === 'function' ? value(prev) : value;
        set(tabHeaderAtom, next);
        // Native: do not zero height when subHeader appears/disappears — that left
        // list content under Settings tabs until (or unless) a later measure. Keep
        // the previous offset; PageHeader container onLayout corrects the total.
        // Treat missing `header` as null so `setHeader({ subHeader })` after
        // `defaultHeader` (`header: null`) does not look like a chrome change.
        const prevSlot = prev?.header === false ? false : (prev?.header ?? null);
        const nextSlot = next?.header === false ? false : (next?.header ?? null);
        if (!isWeb && (nextSlot === false || nextSlot !== prevSlot)) {
            set(tabHeightAtom, 0);
        }
    });
}

// Write-only atom: keep the last measured height while a visible header is
// being replaced. On web, the DOM may not emit another layout event if the
// header content is effectively the same, so clearing here can leave content
// tucked under the fixed header after HMR/theme/layout updates.
// On native, subHeader toggles must not zero height (Settings tabs clip); the
// PageHeader container onLayout updates the total instead.
export const setHeaderAtom = createSetHeaderAtom('web');
setHeaderAtomsByTab.set('web', setHeaderAtom);

function getSetHeaderAtomForTab(key) {
    let next = setHeaderAtomsByTab.get(key);
    if (!next) {
        next = createSetHeaderAtom(key);
        setHeaderAtomsByTab.set(key, next);
    }
    return next;
}

// Custom hooks — scoped to the current tab so Posts/Messages keep their own chrome.
export const useSetHeader = () => useSetAtom(getSetHeaderAtomForTab(useTabChromeKey()));
export const useHeader = () => useAtomValue(getHeaderAtomForTab(useTabChromeKey()));

export const useSetFooter = () => useSetAtom(footerAtom);
export const useFooter = () => useAtomValue(footerAtom);

export const useSetScrollDirection = () => useSetAtom(getScrollDirectionAtomForTab(useTabChromeKey()));
export const useScrollDirection = () => useAtomValue(getScrollDirectionAtomForTab(useTabChromeKey()));


export const useSetScrollValue = () => useSetAtom(getSetScrollValueAtomForTab(useTabChromeKey()));
export const useScrollValue = () => useAtomValue(getScrollValueAtomForTab(useTabChromeKey()));
/** True once the list has left the top. Does not update every scroll pixel. */
export const isScrolledAtom = getIsScrolledAtomForTab('web');
export const useIsScrolled = () => useAtomValue(getIsScrolledAtomForTab(useTabChromeKey()));

export const useSetListMaxScrollOffset = () => useSetAtom(getListMaxScrollOffsetAtomForTab(useTabChromeKey()));
export const useListMaxScrollOffset = () => useAtomValue(getListMaxScrollOffsetAtomForTab(useTabChromeKey()));

export const useSetCoverScrollCompensation = () => useSetAtom(getCoverScrollCompensationAtomForTab(useTabChromeKey()));
export const useCoverScrollCompensation = () => useAtomValue(getCoverScrollCompensationAtomForTab(useTabChromeKey()));

export const useSetHeaderHeight = () => useSetAtom(getHeaderHeightAtomForTab(useTabChromeKey()));
export const useHeaderHeight = () => useAtomValue(getHeaderHeightAtomForTab(useTabChromeKey()));

export const useSetFooterHeight = () => useSetAtom(footerHeightAtom);
export const useFooterHeight = () => useAtomValue(footerHeightAtom);
