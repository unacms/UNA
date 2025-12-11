import { atom } from 'jotai';

// Atom для subheader компонента
export const subheaderAtom = atom(null);

// Atom для направления скролла
// 0 = top (не скроллили), 1 = вниз, -1 = вверх
export const scrollDirectionAtom = atom(0);

// Atom для высоты хедера
export const headerHeightAtom = atom(0);
