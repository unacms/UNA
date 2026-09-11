import { useCallback } from 'react'
import { useFocusEffect } from 'app/lib/hooks/router'
import { consumeNotificationsConductorStale } from 'app/lib/cache/native-conductor-cache'

/**
 * Catch up on notifications that arrived while this screen was in the
 * background (section 5 of `index.js`). Header chrome itself is declared
 * with `PageHeaderOptions` in the render tree, so focus no longer has to
 * claim or release anything.
 */
export function useConductorFocusRefresh({ routesRef, indexRef, onStartRefresh }) {
    useFocusEffect(
        useCallback(() => {
            const unit = routesRef.current?.[indexRef.current]?.endpoint?.unit
            if (unit === 'notifications' && consumeNotificationsConductorStale()) {
                onStartRefresh()
            }
        }, [routesRef, indexRef, onStartRefresh])
    )
}
