import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Returns true when the app is in the foreground (active), false when in background.
 * Used to pause daemon polling when the app is not visible.
 */
export function useAppState() {
    const [isActive, setIsActive] = useState(() => AppState.currentState === 'active');

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            setIsActive(nextAppState === 'active');
        });
        return () => subscription.remove();
    }, []);

    return isActive;
}
