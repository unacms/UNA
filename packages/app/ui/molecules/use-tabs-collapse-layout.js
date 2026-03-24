import {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useRef,
} from 'react';
import { useWindowDimensions } from 'react-native';
import { TABS_DEFAULT_MORE_BUTTON_WIDTH_PX } from 'app/ui/molecules/tabs-selection-constants';

/**
 * How many tabs fit in a row before the "More" control, given measured widths.
 * @param {number} containerWidth — inner width available for the tab row (after list horizontal padding)
 * @param {number[]} tabWidths — one width per tab, same order as `tabs`
 * @param {number} gapPx — horizontal gap between items (matches list `gap-*`)
 * @param {number} moreButtonWidth — measured "More" width, or 0 to use default estimate
 */
export function computeVisibleTabCount(
    containerWidth,
    tabWidths,
    gapPx,
    moreButtonWidth
) {
    const n = tabWidths.length;
    if (n === 0) return 0;
    if (!containerWidth || containerWidth <= 0) return n;

    const gap = gapPx ?? 4;
    const moreW =
        moreButtonWidth > 0
            ? moreButtonWidth
            : TABS_DEFAULT_MORE_BUTTON_WIDTH_PX;

    const rowWidth = (count) => {
        let s = 0;
        for (let i = 0; i < count; i++) {
            s += tabWidths[i] ?? 0;
            if (i < count - 1) s += gap;
        }
        return s;
    };

    if (rowWidth(n) <= containerWidth) return n;

    for (let k = n - 1; k >= 1; k--) {
        if (rowWidth(k) + gap + moreW <= containerWidth) return k;
    }
    return 1;
}

/**
 * @param {'scroll'|'collapse'} overflow
 * @param {Array<{ key: string }>} tabs
 * @param {number} [gapPx] — from `tabs_sizes[*].gap_px`
 * @param {number} [contentPaddingHorizontal] — subtract this from raw row viewport width (both sides total of list horizontal padding: 2 × scroll_inset)
 */
export function useTabsCollapseLayout({
    overflow,
    tabs,
    gapPx,
    contentPaddingHorizontal = 0,
}) {
    const tabCount = tabs?.length ?? 0;
    const tabKeys = useMemo(
        () => (tabs ?? []).map((t) => t.key).join('\u0000'),
        [tabs]
    );

    const [containerWidth, setContainerWidth] = useState(0);
    const [tabWidths, setTabWidths] = useState(() => []);
    const [moreWidth, setMoreWidth] = useState(0);

    const containerRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const { width: windowWidth } = useWindowDimensions();

    useEffect(() => {
        setContainerWidth(0);
        setTabWidths([]);
        setMoreWidth(0);
    }, [tabKeys, tabCount]);

    useEffect(() => {
        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
        };
    }, []);

    const onContainerLayout = useCallback(
        (e) => {
            const raw = e.nativeEvent.layout.width;
            const inner = Math.max(0, raw - (contentPaddingHorizontal || 0));
            setContainerWidth(inner);
        },
        [contentPaddingHorizontal]
    );

    const setContainerRef = useCallback(
        (node) => {
            containerRef.current = node;
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
            if (
                !node ||
                overflow !== 'collapse' ||
                typeof ResizeObserver === 'undefined'
            ) {
                return;
            }
            const ro = new ResizeObserver((entries) => {
                const cr = entries[0]?.contentRect;
                if (!cr) return;
                const inner = Math.max(
                    0,
                    cr.width - (contentPaddingHorizontal || 0)
                );
                setContainerWidth(inner);
            });
            ro.observe(node);
            resizeObserverRef.current = ro;
        },
        [overflow, contentPaddingHorizontal, tabKeys]
    );

    /** Re-read width when the window/orientation changes (native + web) if onLayout does not fire. */
    useEffect(() => {
        if (overflow !== 'collapse') return;
        const node = containerRef.current;
        if (!node || typeof node.measure !== 'function') return;
        const id = requestAnimationFrame(() => {
            node.measure((_x, _y, w, _h) => {
                const inner = Math.max(
                    0,
                    w - (contentPaddingHorizontal || 0)
                );
                setContainerWidth(inner);
            });
        });
        return () => cancelAnimationFrame(id);
    }, [windowWidth, overflow, contentPaddingHorizontal, tabKeys]);

    const onTabLayout = useCallback(
        (index) => (e) => {
            const w = e.nativeEvent.layout.width;
            setTabWidths((prev) =>
                Array.from({ length: tabCount }, (_, i) =>
                    i === index ? w : prev[i] ?? 0
                )
            );
        },
        [tabCount]
    );

    const onMoreLayout = useCallback((e) => {
        setMoreWidth(e.nativeEvent.layout.width);
    }, []);

    const visibleCount = useMemo(() => {
        if (overflow !== 'collapse' || tabCount === 0) return tabCount;
        if (!containerWidth || containerWidth <= 0) return tabCount;

        const w = tabWidths.slice(0, tabCount);
        const allMeasured =
            w.length >= tabCount &&
            w.slice(0, tabCount).every((x) => typeof x === 'number' && x > 0);
        if (!allMeasured) return tabCount;

        return computeVisibleTabCount(
            containerWidth,
            w,
            gapPx ?? 4,
            moreWidth
        );
    }, [
        overflow,
        tabCount,
        containerWidth,
        tabWidths,
        moreWidth,
        gapPx,
    ]);

    useEffect(() => {
        if (overflow !== 'collapse') return;
        if (tabCount > 0 && visibleCount === tabCount) {
            setMoreWidth(0);
        }
    }, [overflow, visibleCount, tabCount]);

    const visibleTabs = useMemo(
        () => (tabs ?? []).slice(0, visibleCount),
        [tabs, visibleCount]
    );
    const overflowTabs = useMemo(
        () => (tabs ?? []).slice(visibleCount),
        [tabs, visibleCount]
    );

    const isActiveInOverflow = useCallback(
        (tabKey) => {
            const i = (tabs ?? []).findIndex((t) => t.key === tabKey);
            return i >= 0 && i >= visibleCount;
        },
        [tabs, visibleCount]
    );

    return {
        visibleCount,
        visibleTabs,
        overflowTabs,
        isActiveInOverflow,
        onContainerLayout,
        onTabLayout,
        onMoreLayout,
        setContainerRef,
    };
}
