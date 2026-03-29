import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import { nextScrollDirectionFromDelta } from 'app/lib/scroll-navigation-state';

export function useWindowScrollNavigationSync() {
    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();
    const scrollYRef = useRef(0);
    const scrollStateRef = useRef(0);
    const accDirRef = useRef(0);

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') {
            return;
        }

        let rafId = 0;

        const syncScrollState = () => {
            rafId = 0;
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;
            const previousScrollY = scrollYRef.current;
            const nextDirection = nextScrollDirectionFromDelta(
                previousScrollY,
                currentScrollY,
                accDirRef
            );

            if (nextDirection !== null && nextDirection !== scrollStateRef.current) {
                scrollStateRef.current = nextDirection;
                setScrollDirection(nextDirection);
            }

            scrollYRef.current = currentScrollY;
            setScrollValue(currentScrollY);
        };

        const handleWindowScroll = () => {
            if (rafId) {
                return;
            }
            rafId = requestAnimationFrame(syncScrollState);
        };

        syncScrollState();
        window.addEventListener('scroll', handleWindowScroll, { passive: true });

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('scroll', handleWindowScroll);
        };
    }, [setScrollDirection, setScrollValue]);
}
