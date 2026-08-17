import { atom, useSetAtom, useAtomValue } from 'jotai';
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
// Monotonic id of the last `setHeader` write. Blur resets compare against
// this so a screen that already lost the atom does not wipe a newer owner
// (sibling useEffects in one commit, or useFocusEffect before useEffect).
let headerWriteGeneration = 0;
export const getHeaderWriteGeneration = () => headerWriteGeneration;
export const footerAtom = atom(true);
export const scrollDirectionAtom = atom(0);
export const scrollValueAtom = atom(0);
// Non-reactive mirror. Scroll writers fire every frame — subscribe with
// `useScrollValue()` only when the UI must track offset continuously
// (cover collapse, overlay header). Callbacks should use `getScrollValue()`.
let scrollValueCurrent = 0;
export const getScrollValue = () => scrollValueCurrent;
const setScrollValueAtom = atom(null, (_get, set, value) => {
    const next = Math.round(Number(value));
    if (!Number.isFinite(next) || next === scrollValueCurrent) return;
    scrollValueCurrent = next;
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
/**
 * SSR/hydration seed for headerHeightAtom on web only.
 * After mount, PageHeader `onLayout` replaces this with the measured height.
 * Keep close to `layout.header.content` height (e.g. h-14 → 56) to minimize layout shift.
 */
export const DEFAULT_HEADER_HEIGHT = 64;
export const headerHeightAtom = atom(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
export const footerHeightAtom = atom(0);

// Write-only atom: keep the last measured height while a visible header is
// being replaced. On web, the DOM may not emit another layout event if the
// header content is effectively the same, so clearing here can leave content
// tucked under the fixed header after HMR/theme/layout updates.
// On native, subHeader toggles must not zero height (Settings tabs clip); the
// PageHeader container onLayout updates the total instead.
export const setHeaderAtom = atom(null, (get, set, value) => {
    headerWriteGeneration += 1;
    const prev = get(headerAtom);
    const next = typeof value === 'function' ? value(prev) : value;
    set(headerAtom, next);
    // Native: do not zero height when subHeader appears/disappears — that left
    // list content under Settings tabs until (or unless) a later measure. Keep
    // the previous offset; PageHeader container onLayout corrects the total.
    // Treat missing `header` as null so `setHeader({ subHeader })` after
    // `defaultHeader` (`header: null`) does not look like a chrome change.
    const prevSlot = prev?.header === false ? false : (prev?.header ?? null);
    const nextSlot = next?.header === false ? false : (next?.header ?? null);
    if (!isWeb && (nextSlot === false || nextSlot !== prevSlot)) {
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

export const useSetListMaxScrollOffset = () => useSetAtom(listMaxScrollOffsetAtom);
export const useListMaxScrollOffset = () => useAtomValue(listMaxScrollOffsetAtom);

export const useSetCoverScrollCompensation = () => useSetAtom(coverScrollCompensationAtom);
export const useCoverScrollCompensation = () => useAtomValue(coverScrollCompensationAtom);

export const useSetHeaderHeight = () => useSetAtom(headerHeightAtom);
export const useHeaderHeight = () => useAtomValue(headerHeightAtom);

export const useSetFooterHeight = () => useSetAtom(footerHeightAtom);
export const useFooterHeight = () => useAtomValue(footerHeightAtom);