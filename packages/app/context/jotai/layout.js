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
export const footerAtom = atom(true);
export const scrollDirectionAtom = atom(0);
export const scrollValueAtom = atom(0);
/**
 * Standard fixed-header height on web (matches header `h-16` / `h-14 + pt-2` themes).
 * On web the real height is only known after hydration (onLayout / desktop effect),
 * so seed the atom with this value. If it started at 0 instead, the SSR paint
 * would render page content under the fixed header (no spacer, minHeight 100vh +
 * `my-auto` centering) and then jump down once hydration measures the header.
 */
export const DEFAULT_HEADER_HEIGHT = 64;
export const headerHeightAtom = atom(isWeb ? DEFAULT_HEADER_HEIGHT : 0);
export const footerHeightAtom = atom(0);

// Write-only atom: keep the last measured height while a visible header is
// being replaced. On web, the DOM may not emit another layout event if the
// header content is effectively the same, so clearing here can leave content
// tucked under the fixed header after HMR/theme/layout updates.
export const setHeaderAtom = atom(null, (get, set, value) => {
    const next = typeof value === 'function' ? value(get(headerAtom)) : value;
    set(headerAtom, next);
    if (!isWeb && next?.header === false) {
        set(headerHeightAtom, 0); //disabled by https://linear.app/unainc/issue/CRD-418 need to check it deeply
    }
});

// Custom hooks
export const useSetHeader = () => useSetAtom(setHeaderAtom);
export const useHeader = () => useAtomValue(headerAtom);

export const useSetFooter = () => useSetAtom(footerAtom);
export const useFooter = () => useAtomValue(footerAtom);

export const useSetScrollDirection = () => useSetAtom(scrollDirectionAtom);
export const useScrollDirection = () => useAtomValue(scrollDirectionAtom);


export const useSetScrollValue = () => useSetAtom(scrollValueAtom);
export const useScrollValue = () => useAtomValue(scrollValueAtom);

export const useSetHeaderHeight = () => useSetAtom(headerHeightAtom);
export const useHeaderHeight = () => useAtomValue(headerHeightAtom);

export const useSetFooterHeight = () => useSetAtom(footerHeightAtom);
export const useFooterHeight = () => useAtomValue(footerHeightAtom);