/** Active scroll containers (Page / Modal) register here; topmost wins. */

const handlers = [];

export function pushFormEnsureVisibleHandler(handler) {
    handlers.push(handler);
    return () => {
        const index = handlers.lastIndexOf(handler);
        if (index >= 0) handlers.splice(index, 1);
    };
}

export function requestFormEnsureVisible(payload) {
    const handler = handlers[handlers.length - 1];
    handler?.(payload);
}

/** Prefer the topmost field when several errors appear in one frame. */
let pendingYs = [];
let rafId = null;

export function queueFormEnsureVisible(windowY) {
    if (typeof windowY !== 'number' || Number.isNaN(windowY)) return;
    pendingYs.push(windowY);
    if (rafId != null) return;
    const schedule =
        typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (cb) => setTimeout(cb, 16);
    rafId = schedule(() => {
        const minY = Math.min(...pendingYs);
        pendingYs = [];
        rafId = null;
        requestFormEnsureVisible({ windowY: minY });
    });
}

/** RN ScrollView uses { y }; DOM / RN-web nodes use scrollTop. */
export function scrollContainerByDelta(scrollView, delta, currentY = 0) {
    if (!scrollView || Math.abs(delta) < 40) return;

    if (typeof scrollView.scrollTop === 'number') {
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
