import { useState, useEffect } from 'react';

/**
 * Returns true when browser tab/window is visible (user is viewing the page).
 * Uses Page Visibility API - pauses polling when tab is in background.
 */
export function useAppState(): boolean {
    const [isVisible, setIsVisible] = useState(() =>
        typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
    );

    useEffect(() => {
        const handleChange = () => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleChange);
        return () => document.removeEventListener('visibilitychange', handleChange);
    }, []);

    return isVisible;
}
