import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { appSetting, cn, sanitazeUrl } from 'app/lib/util'
import { getWebScrollKey, writeWebScroll } from 'app/lib/web-scroll-session.web'


// Variants and sizes from theme
const ThemeLinkSizes = appSetting('theme', 'link_sizes');
const ThemeLinkStyles = appSetting('theme', 'link_styles');

export default function ElementLink({
    href: hrefProp,
    emulate,
    target,
    tabPath: _tabPath,
    variant = 'default',
    size,
    mode,
    children,
    className = '',
    hitarea = true,
    asExternal,
    noprefetch,
    onClick,
    onPress,
    alt,
    ...rest
}) {

    const router = useRouter();
    const pathname = usePathname();
    const href = sanitazeUrl(hrefProp);

    // Convert alt to aria-label (alt is not valid for <a> elements)
    const accessibleLabel = alt || (typeof children === 'string' ? children : undefined);

    /** Persist scroll for the page being left (current URL), restored when user returns. */
    const saveScrollForCurrentPage = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }
        writeWebScroll(
            getWebScrollKey(pathname, window.location.search),
            window.scrollY || document.documentElement.scrollTop || 0
        );
    }, [pathname]);

    const handlePress = useCallback((event) => {
        if (onPress) onPress(event);
        if (href) {
            saveScrollForCurrentPage();
            router.push(href, { scroll: false });
            event?.preventDefault?.();
        }
    }, [href, router, onPress, saveScrollForCurrentPage]);

    const handleLinkClick = useCallback((event) => {
        saveScrollForCurrentPage();
        if (onClick) onClick(event);
    }, [onClick, saveScrollForCurrentPage]);

    const sizeClass = (() => {
        if (!size) return '';
        const hitareaClass = hitarea === false ? '' : `u-link-hitarea u-link-hitarea-${size}`;
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        // Variant-specific size classes (e.g. real padding for 'primary' inline-button style)
        const variantSizeClass = ThemeLinkSizes[size]?.[variant] || '';
        return cn(hitareaClass, textSizeClass, variantSizeClass);
    })();

    const composedClassName = cn(ThemeLinkStyles[variant], sizeClass, className);

    // Early return for non-emulated links with empty href
    if (!href && emulate !== true) {
        return children;
    }

    if (emulate === true){
        return (
            <Pressable
                {...rest}
                className={composedClassName}
                onPress={handlePress}
                aria-label={accessibleLabel}
                accessibilityLabel={accessibleLabel}
            >
                {children}
            </Pressable>
        );
    }

    const isPrefetch = false;//noprefetch || href == '/logout' || href == 'logout' || appSetting('config', 'noprefetch') ? false : true;

    if (mode === 'plain') {
        return <Link
                target={target}
                href={href}
                className={className}
                prefetch={isPrefetch}
                scroll={false}
            >
                {children}
            </Link>
    }

    return (
        <Link
            target={target}
            href={href}
            {...rest}
            className={composedClassName}
            prefetch={isPrefetch}
            scroll={false}
            onClick={handleLinkClick}
            aria-label={accessibleLabel}
        >
            {children}
        </Link>
    );
}
