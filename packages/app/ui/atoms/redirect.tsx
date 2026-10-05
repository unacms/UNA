import { useEffect, useRef, useCallback, type Ref } from 'react';
import { useRouter, useCurrentTabPath } from 'app/lib/hooks/router'
import { nativeTabHref } from 'app/lib/navigation/tab-history'
import { Platform } from 'react-native'

/** Imperative handle: `<Redirect ref={r} />`, then `r.current?.redirect(url)`. */
export type RedirectHandle = { redirect: (url: string) => void };

export default function ElementRedirect({ ref }: { ref?: Ref<RedirectHandle | null> }) {
    const router = useRouter();
    const tabPath = useCurrentTabPath();
    const routerRef = useRef(router);
    const tabPathRef = useRef(tabPath);
    const isMountedRef = useRef(true);

    // Update refs when router or tab path changes
    useEffect(() => {
        routerRef.current = router;
        tabPathRef.current = tabPath;
    }, [router, tabPath]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Stable redirect function
    const redirectFn = useCallback((sUrl: string) => {
        // Check mount state
        if (!isMountedRef.current) {
            return;
        }

        const currentRouter = routerRef.current;

        if (!currentRouter) {
            return;
        }

        try {
            const target = Platform.OS === 'web'
                ? sUrl
                : nativeTabHref(sUrl, tabPathRef.current);

            // Web router takes strings only; the object form is native-only (Platform check above).
            currentRouter.push(target as string);
        } catch (error) {
            // Ignore navigation errors on unmount
            if (isMountedRef.current) {
                console.warn('Redirect error:', error);
            }
        }
    }, []);

    // Assign function directly to ref without useImperativeHandle
    useEffect(() => {
        if (!ref) return;

        if (typeof ref === 'function') {
            ref({ redirect: redirectFn });
        } else {
            ref.current = { redirect: redirectFn };
        }

        return () => {
            if (typeof ref === 'function') {
                ref(null);
            } else if (ref && 'current' in ref) {
                ref.current = null;
            }
        };
    }, [ref, redirectFn]);

    return null;
}

