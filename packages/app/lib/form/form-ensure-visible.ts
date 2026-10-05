import { Platform } from 'react-native';

/** Active scroll containers (Page / Modal) register here; topmost wins. */

const handlers: Array<(target: { windowY: number }) => void> = [];

export function pushFormEnsureVisibleHandler(handler: (...args: any[]) => any) {
    handlers.push(handler);
    return () => {
        const index = handlers.lastIndexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
    };
}

export function requestFormEnsureVisible(payload: any) {
    const handler = handlers[handlers.length - 1];
    handler?.(payload);
}

/** Prefer the topmost field when several errors appear in one frame. */
let pendingYs: number[] = [];
let rafId: any = null;

export function queueFormEnsureVisible(windowY: number) {
    if (typeof windowY !== 'number' || Number.isNaN(windowY)) return;
    pendingYs.push(windowY);
    if (rafId != null) return;
    const schedule =
        typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (cb: () => void) => setTimeout(cb, 16);
    rafId = schedule(() => {
        const minY = Math.min(...pendingYs);
        pendingYs = [];
        rafId = null;
        requestFormEnsureVisible({ windowY: minY });
    });
}

/** RN ScrollView uses scrollTo({ y }); DOM / RN-web nodes use scrollTop. */
export function scrollContainerByDelta(scrollView: any, delta: number, currentY = 0) {
    if (!scrollView || Math.abs(delta) < 40) return;

    // Native host objects often expose getter-only scrollTop — never assign it.
    if (Platform.OS === 'web' && typeof scrollView.scrollTop === 'number') {
        scrollView.scrollTop = Math.max(0, scrollView.scrollTop + delta);
        return;
    }

    if (typeof scrollView.scrollTo === 'function') {
        scrollView.scrollTo({
            y: Math.max(0, currentY + delta),
            animated: true,
        });
    }
}
