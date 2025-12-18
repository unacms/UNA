import { atom, useSetAtom, useAtomValue } from 'jotai';

export const defaultHeader = { header: null, subHeader: null, backButton: false, title: false };
// Atoms
export const headerAtom = atom(defaultHeader);
export const footerAtom = atom(true);
export const scrollDirectionAtom = atom(0);
export const headerHeightAtom = atom(0);

// Custom hooks
export const useSetHeader = () => useSetAtom(headerAtom);
export const useHeader = () => useAtomValue(headerAtom);

export const useSetFooter = () => useSetAtom(footerAtom);
export const useFooter = () => useAtomValue(footerAtom);

export const useSetScrollDirection = () => useSetAtom(scrollDirectionAtom);
export const useScrollDirection = () => useAtomValue(scrollDirectionAtom);

export const useSetHeaderHeight = () => useSetAtom(headerHeightAtom);
export const useHeaderHeight = () => useAtomValue(headerHeightAtom);