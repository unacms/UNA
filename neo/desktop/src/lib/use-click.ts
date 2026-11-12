import { type RefObject, useEffect, useRef } from 'react';

/**
 * A click listener on an element that is no control of its own: the backdrop of a dialog, the
 * empty part of a box around a field, a label of a text box that is no form control, text whose
 * links are handled where they are clicked. It is the pointer's way to something the keyboard
 * reaches through a real control (the field, a link, Esc), so it is a listener on the element,
 * not an `onClick` that would promise a control. It runs before React's handlers:
 * `stopPropagation` keeps the click from the rows around the element and from the document's
 * link handler (lib/native.ts captureLinks) alike. `target` is the element's ref, or the id of
 * an element another component draws (it must be in the page when this one mounts).
 */
export function useClick(target: RefObject<HTMLElement | null> | string | undefined, onClick: (e: MouseEvent, el: HTMLElement) => void): void {
    const latest = useRef(onClick);
    useEffect(() => {
        latest.current = onClick;
    });
    useEffect(() => {
        const el = typeof target === 'string' ? document.getElementById(target) : target?.current;
        if (!el) return;
        const listener = (e: MouseEvent) => latest.current(e, el);
        el.addEventListener('click', listener);
        return () => el.removeEventListener('click', listener);
    }, [target]);
}
