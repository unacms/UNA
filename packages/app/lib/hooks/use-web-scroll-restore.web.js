import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    getWebScrollKey,
    readWebScroll,
    writeWebScroll,
    restoreWebScroll,
} from 'app/lib/web-scroll-session.web';

function isInternalHref(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return false;
    }
    if (href.startsWith('/')) {
        return true;
    }
    try {
        const url = new URL(href, window.location.origin);
        return url.origin === window.location.origin;
    } catch {
        return false;
    }
}

/**
 * Lives in the root Next layout (survives page navigations). Saves window scroll per URL,
 * restores on return. Works with scroll={false} on Link so Next does not zero scroll before save.
 */
export function useWebScrollRestore() {
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);
    const cancelRestoreRef = useRef(null);
    const saveRafRef = useRef(0);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        history.scrollRestoration = 'manual';
    }, []);

    useEffect(() => {
        pathnameRef.current = pathname;

        const key = getWebScrollKey(pathname, window.location.search);
        const savedY = readWebScroll(key);

        if (cancelRestoreRef.current) {
            cancelRestoreRef.current();
        }

        if (savedY != null) {
            cancelRestoreRef.current = restoreWebScroll(key);
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }

        const onScroll = () => {
            if (saveRafRef.current) {
                return;
            }
            saveRafRef.current = requestAnimationFrame(() => {
                saveRafRef.current = 0;
                writeWebScroll(
                    getWebScrollKey(pathnameRef.current, window.location.search),
                    window.scrollY || document.documentElement.scrollTop || 0
                );
            });
        };

        const onPointerDown = (event) => {
            const anchor = event.target?.closest?.('a[href]');
            if (!anchor || anchor.target === '_blank') {
                return;
            }
            const href = anchor.getAttribute('href');
            if (!isInternalHref(href)) {
                return;
            }
            writeWebScroll(
                getWebScrollKey(pathname, window.location.search),
                window.scrollY || document.documentElement.scrollTop || 0
            );
        };

        const onPageHide = () => {
            writeWebScroll(
                getWebScrollKey(pathname, window.location.search),
                window.scrollY || document.documentElement.scrollTop || 0
            );
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('pointerdown', onPointerDown, true);
        window.addEventListener('pagehide', onPageHide);

        return () => {
            if (cancelRestoreRef.current) {
                cancelRestoreRef.current();
                cancelRestoreRef.current = null;
            }
            cancelAnimationFrame(saveRafRef.current);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('pagehide', onPageHide);
            writeWebScroll(
                getWebScrollKey(pathname, window.location.search),
                window.scrollY || document.documentElement.scrollTop || 0
            );
        };
    }, [pathname]);
}
