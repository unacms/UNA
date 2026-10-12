import { useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { useIsFocused } from 'app/lib/hooks/router';
import { finishScreenLoad, recordAppStart } from './health';

type StartupTiming = { startTime?: number | null; initializeRuntimeStart?: number | null };

let firstScreen = true;

/** Milliseconds from process start to now (React Native's startup timing), or 0. */
function sinceProcessStart(): number {
    const timing = (performance as Performance & { rnStartupTiming?: StartupTiming }).rnStartupTiming;
    const start = [timing?.startTime, timing?.initializeRuntimeStart].find((value) => typeof value === 'number' && Number.isFinite(value) && value > 0);
    return typeof start === 'number' ? performance.now() - start : 0;
}

/**
 * A page's content is laid out on the screen in front: the first one ends the cold start
 * (`app_start`), later ones a navigation (`screen_load`).
 */
function markScreenReady(): void {
    try {
        if (!firstScreen) {
            finishScreenLoad();
            return;
        }
        firstScreen = false;
        recordAppStart(sinceProcessStart());
    } catch {
        // never throw
    }
}

/**
 * Apps: put in a page's layout, keyed by the page, so it mounts with the page's content.
 * It measures nothing while its screen is in the background (a preloaded tab); a tab
 * switched to with its page already laid out is ready at once.
 */
export function ScreenReadyMarker() {
    const focused = useIsFocused();
    const laidOut = useRef(false);

    useEffect(() => {
        if (focused && laidOut.current) markScreenReady();
    }, [focused]);

    const onLayout = () => {
        if (laidOut.current) return;
        laidOut.current = true;
        if (focused) markScreenReady();
    };

    return <View pointerEvents="none" className="absolute w-0 h-0" onLayout={onLayout} />;
}
