import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * Returns true when app is in foreground (active).
 * Uses AppState - pauses polling when app is in background.
 */
export function useAppState() {
    const [isVisible, setIsVisible] = useState(() => AppState.currentState === 'active');

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            setIsVisible(nextAppState === 'active');
        });
        return () => subscription.remove();
    }, []);

    return isVisible;
}
