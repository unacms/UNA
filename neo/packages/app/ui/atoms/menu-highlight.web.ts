import { useCallback } from 'react';

/** The list class the highlight's CSS hangs on (design/styles/global.web.css). */
export const MENU_HIGHLIGHT_CLASS = 'neo-menu-highlight';

const INTERACTIVE = 'a, [tabindex]';

/**
 * One highlight that slides under a menu's items to the one under the pointer, or the one focused from the
 * keyboard, as UNA's popup menus do (bx_menu_highlight). Returns a ref for the list, whose children are the items;
 * the list also needs MENU_HIGHLIGHT_CLASS. Touch has no hover: taps don't move it. Native has no hover and
 * gets a no-op (menu-highlight.ts).
 */
export function useMenuHighlight() {
    return useCallback((node: unknown) => {
        const list = node as HTMLElement | null;
        if (!list || typeof list.addEventListener !== 'function') return undefined;

        // The list's child that holds the target: an item, unless it has nothing to press (a group header).
        const itemOf = (target: EventTarget | null) => {
            let el = target instanceof HTMLElement ? target : null;
            while (el && el.parentElement !== list) el = el.parentElement;
            return el && (el.matches(INTERACTIVE) || el.querySelector(INTERACTIVE)) ? el : null;
        };

        const move = (item: HTMLElement) => {
            // The item's own surface (a link wraps it) gives the box and the corners.
            const surface = item.matches('.group') ? item : (item.querySelector<HTMLElement>(':scope > .group') ?? item);
            const listBox = list.getBoundingClientRect();
            const box = surface.getBoundingClientRect();
            // The first item it lights fades in where it is, without sliding in from the top of the list.
            const jump = !list.classList.contains('neo-menu-highlight-on');
            list.classList.toggle('neo-menu-highlight-jump', jump);
            list.style.setProperty('--neo-menu-highlight-x', `${box.left - listBox.left - list.clientLeft}px`);
            list.style.setProperty('--neo-menu-highlight-y', `${box.top - listBox.top - list.clientTop}px`);
            list.style.setProperty('--neo-menu-highlight-w', `${box.width}px`);
            list.style.setProperty('--neo-menu-highlight-h', `${box.height}px`);
            list.style.setProperty('--neo-menu-highlight-r', getComputedStyle(surface).borderRadius);
            if (jump) {
                void getComputedStyle(list, '::before').transform;
                list.classList.add('neo-menu-highlight-on');
            }
        };
        const hide = () => list.classList.remove('neo-menu-highlight-on');

        const onPointerOver = (event: PointerEvent) => {
            if (event.pointerType === 'touch') return;
            const item = itemOf(event.target);
            if (item) move(item);
        };
        const onFocusIn = (event: FocusEvent) => {
            const target = event.target as HTMLElement | null;
            const item = itemOf(target);
            if (item && target?.matches(':focus-visible')) move(item);
        };
        const onFocusOut = (event: FocusEvent) => {
            if (!(event.relatedTarget instanceof Node) || !list.contains(event.relatedTarget)) hide();
        };

        list.addEventListener('pointerover', onPointerOver);
        list.addEventListener('pointerleave', hide);
        list.addEventListener('focusin', onFocusIn);
        list.addEventListener('focusout', onFocusOut);
        return () => {
            list.removeEventListener('pointerover', onPointerOver);
            list.removeEventListener('pointerleave', hide);
            list.removeEventListener('focusin', onFocusIn);
            list.removeEventListener('focusout', onFocusOut);
        };
    }, []);
}
