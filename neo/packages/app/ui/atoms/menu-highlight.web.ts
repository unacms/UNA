import { useCallback, useRef } from 'react';

/** The list class the highlight's CSS hangs on (design/styles/global.web.css). */
export const MENU_HIGHLIGHT_CLASS = 'neo-menu-highlight';

const INTERACTIVE = 'a, [tabindex]';

/**
 * One highlight that slides under a menu's items to the one under the pointer, or the one focused from the
 * keyboard, as UNA's popup menus do (bx_menu_highlight). Returns a ref for the list, whose children are the items;
 * the list also needs MENU_HIGHLIGHT_CLASS. Touch has no hover: taps don't move it. When the list's rows or its
 * width change under a lit item (a group opens, another closes above it), the highlight is put back on that item
 * at once, as the item itself moved. Native has no hover and gets a no-op (menu-highlight.ts).
 */
export function useMenuHighlight() {
    // The lists it is on (a sectioned menu has one per section), each with what takes it off again. A ref passed
    // through View is called with null when its list unmounts, without saying which, and what the callback returns
    // is dropped there: so a null drops the lists that have left the page.
    const attached = useRef<Map<HTMLElement, () => void> | null>(null);

    return useCallback((node: unknown) => {
        const lists = (attached.current ??= new Map<HTMLElement, () => void>());
        const list = node as HTMLElement | null;
        if (!list) {
            // Once React has removed the unmounted nodes.
            queueMicrotask(() => {
                lists.forEach((detach, mounted) => {
                    if (mounted.isConnected) return;
                    detach();
                    lists.delete(mounted);
                });
            });
            return;
        }
        if (typeof list.addEventListener !== 'function') return;
        lists.get(list)?.();

        // The list's child that holds the target: an item, unless it has nothing to press (a group header).
        const itemOf = (target: EventTarget | null) => {
            let el = target instanceof HTMLElement ? target : null;
            while (el && el.parentElement !== list) el = el.parentElement;
            return el && (el.matches(INTERACTIVE) || el.querySelector(INTERACTIVE)) ? el : null;
        };

        // The item the highlight is on, to put it back there when the list changes around it.
        let lit: HTMLElement | null = null;

        const move = (item: HTMLElement, inPlace = false) => {
            lit = item;
            // The item's own surface (a link wraps it) gives the box and the corners.
            const surface = item.matches('.group') ? item : (item.querySelector<HTMLElement>(':scope > .group') ?? item);
            const listBox = list.getBoundingClientRect();
            const box = surface.getBoundingClientRect();
            // The first item it lights fades in where it is (`-jump` transitions only the opacity), later ones slide
            // to theirs. One that follows its item (`inPlace`) is there at once, as the item is.
            const jump = inPlace || !list.classList.contains('neo-menu-highlight-on');
            list.classList.toggle('neo-menu-highlight-jump', jump);
            // Boxes are on screen, so scaled while the menu grows in: back to the list's own pixels.
            const scale = list.offsetWidth ? listBox.width / list.offsetWidth : 1;
            list.style.setProperty('--neo-menu-highlight-x', `${(box.left - listBox.left) / scale - list.clientLeft}px`);
            list.style.setProperty('--neo-menu-highlight-y', `${(box.top - listBox.top) / scale - list.clientTop}px`);
            list.style.setProperty('--neo-menu-highlight-w', `${box.width / scale}px`);
            list.style.setProperty('--neo-menu-highlight-h', `${box.height / scale}px`);
            list.style.setProperty('--neo-menu-highlight-r', getComputedStyle(surface).borderRadius);
            if (jump) {
                // Laid out at its first item before it shows: otherwise the next move, which ends the jump, doesn't slide.
                list.getBoundingClientRect();
                list.classList.add('neo-menu-highlight-on');
            }
        };
        const hide = () => {
            lit = null;
            list.classList.remove('neo-menu-highlight-on');
        };

        // Rows added or removed, or a list that got wider or narrower: the lit item has another box now, and
        // neither the pointer nor the focus moved to say so.
        const follow = () => {
            if (!lit || !list.classList.contains('neo-menu-highlight-on')) return;
            if (lit.parentElement === list) move(lit, true);
            else hide();
        };
        const rowsObserver = typeof MutationObserver === 'function' ? new MutationObserver(follow) : null;
        rowsObserver?.observe(list, { childList: true });
        const sizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(follow) : null;
        sizeObserver?.observe(list);

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
        lists.set(list, () => {
            rowsObserver?.disconnect();
            sizeObserver?.disconnect();
            list.removeEventListener('pointerover', onPointerOver);
            list.removeEventListener('pointerleave', hide);
            list.removeEventListener('focusin', onFocusIn);
            list.removeEventListener('focusout', onFocusOut);
        });
    }, []);
}
