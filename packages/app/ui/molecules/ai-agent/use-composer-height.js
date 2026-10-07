'use client';

import { useCallback, useLayoutEffect, useState } from 'react';
import { isWeb } from 'app/lib/util';

/** One line of the composer, and the point where it stops growing and starts scrolling. */
export const COMPOSER_LINE_PX = 20;
export const COMPOSER_MAX_PX = 160;

/**
 * How much taller than its resting height the box must be before we treat it as
 * multiline. Rounding and line-height fractions make a single line measure a pixel
 * or two off, and flipping `textAlignVertical` on that noise makes the caret jump.
 */
const MULTILINE_SLACK_PX = 6;

function clampComposerHeight(height) {
    return Math.min(Math.max(Math.round(height), COMPOSER_LINE_PX), COMPOSER_MAX_PX);
}

/**
 * Auto-growing composer height, shared by web and native.
 *
 * Web measures the textarea directly (`scrollHeight` after resetting the height);
 * native has no such measurement, so it reports through `onContentSizeChange`.
 *
 * `restHeight` is state rather than a ref because `isMultiline` is computed during
 * render: a ref written in this layout effect would still hold the *previous*
 * commit's value at that point, so the composer would spend a render one step
 * behind its own size.
 */
export function useComposerHeight(inputRef, input) {
    const [height, setHeight] = useState(COMPOSER_LINE_PX);
    const [restHeight, setRestHeight] = useState(COMPOSER_LINE_PX);

    const applyHeight = useCallback((measured) => {
        const next = clampComposerHeight(measured);
        setHeight((prev) => (prev === next ? prev : next));
        return next;
    }, []);

    useLayoutEffect(() => {
        const node = inputRef.current;
        // Native TextInput has no `.style`/`scrollHeight`; it drives us via onContentSizeChange.
        if (!node?.style || typeof node.scrollHeight !== 'number') return;

        // Setting height to 'auto' to measure collapses the box for one frame, which
        // makes the browser drop the selection — so snapshot and restore it.
        const selectionStart = node.selectionStart;
        const selectionEnd = node.selectionEnd;
        node.style.height = 'auto';
        const next = applyHeight(input ? node.scrollHeight : COMPOSER_LINE_PX);
        node.style.height = `${next}px`;
        if (
            isWeb &&
            typeof node.setSelectionRange === 'function' &&
            typeof document !== 'undefined' &&
            document.activeElement === node
        ) {
            node.setSelectionRange(selectionStart, selectionEnd);
        }
        // An empty composer defines the "one line" baseline that isMultiline compares
        // against. It is measured rather than assumed because font and padding come
        // from theme settings.
        if (!input) setRestHeight(next);
    }, [input, applyHeight, inputRef]);

    const onContentSizeChange = useCallback((event) => {
        const measured = event?.nativeEvent?.contentSize?.height;
        if (measured) applyHeight(input ? measured : COMPOSER_LINE_PX);
    }, [applyHeight, input]);

    const isMultiline = input.length > 0
        && (height > restHeight + MULTILINE_SLACK_PX || input.includes('\n'));

    return {
        height,
        isMultiline,
        onContentSizeChange,
        // Only let the box scroll once it has stopped growing, otherwise short text
        // can scroll out of view inside a half-height composer.
        scrollEnabled: height >= COMPOSER_MAX_PX,
    };
}
