import Router from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { appSetting } from 'app/lib/util'
import { getPageSkeleton, getBlackBox  } from 'app/lib/skeleton-helpers'

export default function useLoadingSkeleton(width) {
    const [state, setState] = useState({ loading: false, url: '' })

    const handleRouteChangeStart = useCallback((url) => {
        setState({ loading: true, url })
    }, [])

    const handleRouteChangeComplete = useCallback(() => {
        setState((prevState) => ({ ...prevState, loading: false }))
    }, [])

    useEffect(() => {
        Router.events.on('routeChangeStart', handleRouteChangeStart)
        Router.events.on('routeChangeComplete', handleRouteChangeComplete)
        Router.events.on('routeChangeError', handleRouteChangeComplete)

        // Clean up event listeners on unmount
        return () => {
            Router.events.off('routeChangeStart', handleRouteChangeStart)
            Router.events.off('routeChangeComplete', handleRouteChangeComplete)
            Router.events.off('routeChangeError', handleRouteChangeComplete)
        }
    }, [handleRouteChangeStart, handleRouteChangeComplete])

    const selectSkeleton = useCallback(
        (url) => {
            if (!url || url === '/') {
                return getPageSkeleton['home']
            }
            const cleanUrl = url.split('/').filter(Boolean)[0]
            const l = appSetting('layouts', cleanUrl)
            let layout = l?.layout

            if (layout == 'blackbox') {
                return getBlackBox(width)
            }
            return getPageSkeleton['layout'] || getPageSkeleton['default']
        },
        [width]
    )

    const skeleton = selectSkeleton(state.url)

    return [state.loading, skeleton]
}
