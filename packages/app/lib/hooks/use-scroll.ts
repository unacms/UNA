import { useRef, useCallback } from 'react';
import { Platform, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import { nextScrollDirectionFromDelta } from 'app/lib/navigation/scroll-navigation-state';

export function useScroll() {
    const scrollY = useRef(0);
    const scrollState = useRef(0);
    const accDir = useRef(0);
    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();
    const isWeb = Platform.OS === 'web';
    
    const handleNativeScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const previousScrollY = scrollY.current;

        const next = nextScrollDirectionFromDelta(previousScrollY, currentScrollY, accDir);
        if (next !== null && next !== scrollState.current) {
            scrollState.current = next;
            setScrollDirection(next);
        }

        scrollY.current = currentScrollY;
        setScrollValue(currentScrollY);
    }, [setScrollDirection, setScrollValue]);

    return {
        onScroll: isWeb ? undefined : handleNativeScroll
    };
}