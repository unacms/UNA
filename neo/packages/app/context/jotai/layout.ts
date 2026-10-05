import { useCallback } from 'react';
import { atom, useSetAtom, useAtomValue, type Atom, type PrimitiveAtom, type WritableAtom } from 'jotai';

type NumberAtom = PrimitiveAtom<number>;
import { Platform } from 'react-native'
import { useTabChromeKey } from 'app/context/tab-chrome';
const isWeb = Platform.OS == 'web'

export const footerAtom = atom<boolean>(true);
export const scrollDirectionAtom = atom<number>(0);
export const scrollValueAtom = atom<number>(0);
// Non-reactive mirror, keyed per tab. Scroll writers fire every frame — subscribe
// with `useScrollValue()` only when the UI must track offset continuously
// (cover collapse, overlay header). Callbacks should use `useGetScrollValue()`.
const scrollValueCurrentByTab = new Map<string, number>();
export const getScrollValue = (tabKey = 'web') => scrollValueCurrentByTab.get(tabKey) ?? 0;
/** Tab-scoped getter: reads the scroll offset of the tab this component lives in. */
export const useGetScrollValue = () => {
    const tabKey = useTabChromeKey();
    return useCallback(() => getScrollValue(tabKey), [tabKey]);
};
/** Max scroll offset the active list can reach (content height − viewport). */
export const listMaxScrollOffsetAtom = atom<number>(0);
/**
 * Extra bottom padding for the active list while the profile cover is
 * collapsed on a short list (see conductor.js). Keeps the scroll range equal
 * to the expanded-cover state so the list stays scrollable and the cover can
 * always be expanded back.
 */
export const coverScrollCompensationAtom = atom<number>(0);
/** Scroll offset at which the native profile cover finishes collapsing (see conductor.js). */
export const COVER_COLLAPSE_SCROLL = 500;
/**
 * SSR/hydration seed for headerHeightAtom on web only.
 * After mount, PageHeader `onLayout` replaces this with the measured height.
 * Keep close to `layout.header.content` height (e.g. h-14 → 56) to minimize layout shift.
 */
export const DEFAULT_HEADER_HEIGHT = 64;
export const headerHeightAtom = atom<number>(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
export const footerHeightAtom = atom<number>(0);

const headerHeightAtomsByTab = new Map<string, NumberAtom>([['web', headerHeightAtom]]);

function getTabAtom<A>(map: Map<string, A>, key: string, create: (key: string) => A): A {
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
const scrollDirectionAtomsByTab = new Map<string, NumberAtom>([['web', scrollDirectionAtom]]);
const scrollValueAtomsByTab = new Map<string, NumberAtom>([['web', scrollValueAtom]]);
const setScrollValueAtomsByTab = new Map<string, WritableAtom<null, [unknown], void>>();
const isScrolledAtomsByTab = new Map<string, Atom<boolean>>();
const listMaxScrollOffsetAtomsByTab = new Map<string, NumberAtom>([['web', listMaxScrollOffsetAtom]]);
const coverScrollCompensationAtomsByTab = new Map<string, NumberAtom>([['web', coverScrollCompensationAtom]]);

const getScrollDirectionAtomForTab = (key: string) => getTabAtom(scrollDirectionAtomsByTab, key, () => atom(0));
const getScrollValueAtomForTab = (key: string) => getTabAtom(scrollValueAtomsByTab, key, () => atom(0));
const getListMaxScrollOffsetAtomForTab = (key: string) => getTabAtom(listMaxScrollOffsetAtomsByTab, key, () => atom(0));
const getCoverScrollCompensationAtomForTab = (key: string) => getTabAtom(coverScrollCompensationAtomsByTab, key, () => atom(0));
const getIsScrolledAtomForTab = (key: string) =>
    getTabAtom(isScrolledAtomsByTab, key, (k) => atom((get) => get(getScrollValueAtomForTab(k)) > 0));
const getSetScrollValueAtomForTab = (key: string) =>
    getTabAtom(setScrollValueAtomsByTab, key, (k) =>
        atom(null, (_get, set, value: unknown) => {
            const next = Math.round(Number(value));
            if (!Number.isFinite(next) || next === getScrollValue(k)) return;
            scrollValueCurrentByTab.set(k, next);
            set(getScrollValueAtomForTab(k), next);
        })
    );

// The page draws its own blur down to the screen bottom (the messenger composer),
// so the tab screen's bar blur (expo-screen TabBarEdgeBlur) stands down.
const pageBottomBlurAtomsByTab = new Map<string, PrimitiveAtom<boolean>>();
const getPageBottomBlurAtomForTab = (key: string) => getTabAtom(pageBottomBlurAtomsByTab, key, () => atom(false));

function getHeaderHeightAtomForTab(key: string): NumberAtom {
    let next = headerHeightAtomsByTab.get(key);
    if (!next) {
        next = atom<number>(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
        headerHeightAtomsByTab.set(key, next);
    }
    return next;
}

// Custom hooks — scoped to the current tab so Posts/Messages keep their own chrome.
// Header *content* is not state here: pages declare it with `PageHeaderOptions`
// (ui/molecules/header/options.js); only the measured height flows back.
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

export const useSetPageBottomBlur = () => useSetAtom(getPageBottomBlurAtomForTab(useTabChromeKey()));
/** Read outside the tab's chrome provider (the tab screen itself), hence the explicit key. */
export const usePageBottomBlur = (tabKey: string) => useAtomValue(getPageBottomBlurAtomForTab(tabKey));

export const useSetFooterHeight = () => useSetAtom(footerHeightAtom);
export const useFooterHeight = () => useAtomValue(footerHeightAtom);
