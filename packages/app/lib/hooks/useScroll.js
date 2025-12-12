import { useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useSetScrollDirection } from 'app/context/jotai/layout';

const SCROLL_OFFSET_THRESHOLD = 100;

export function useScroll() {
    const scrollY = useRef(0);
    const scrollState = useRef(0);
    const setScrollDirection = useSetScrollDirection();
    const isWeb = Platform.OS === 'web';
    
    const handleNativeScroll = useCallback((event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const previousScrollY = scrollY.current;
        
        let newScrollState;
        
        if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
            newScrollState = 0;
        } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
            newScrollState = 1;
        } else if (currentScrollY < previousScrollY) {
            newScrollState = -1;
        } else {
            newScrollState = scrollState.current;
        }
        
        if (newScrollState !== scrollState.current) {
            setScrollDirection(newScrollState);
            scrollState.current = newScrollState;
        }
        
        scrollY.current = currentScrollY;
    }, [setScrollDirection]);
    
    // Эффект для веба
    useEffect(() => {
        if (!isWeb) return;
        
        const handleWindowScroll = () => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;
            const previousScrollY = scrollY.current;
            
            let newScrollState;
            
            if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
                newScrollState = 0;
            } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
                newScrollState = 1;
            } else if (currentScrollY < previousScrollY) {
                newScrollState = -1;
            } else {
                newScrollState = scrollState.current;
            }
            
            if (newScrollState !== scrollState.current) {
                setScrollDirection(newScrollState);
                scrollState.current = newScrollState;
            }
            
            scrollY.current = currentScrollY;
        };
        
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleWindowScroll);
        };
    }, [isWeb, setScrollDirection]);
    
    return {
        onScroll: isWeb ? undefined : handleNativeScroll
    };
}