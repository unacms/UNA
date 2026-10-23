import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { useCallback, type CSSProperties } from 'react';
import { appSetting, cn, sanitazeUrl, isExternalUrl, decodeTextNode } from 'app/lib/util'
import emitter, { EVENTS } from 'app/context/emitter';
import type { LinkProps } from './link.types';

// Variants and sizes from theme
const ThemeLinkSizes = appSetting('theme', 'link_sizes');
const ThemeLinkStyles = appSetting('theme', 'link_styles');

/** The new hash when `href` is the current page with another hash, '' otherwise. */
function samePageHash(href: string | undefined): string {
    if (!href || typeof window === 'undefined') return '';
    try {
        const url = new URL(href, window.location.href);
        const current = window.location;
        if (url.origin !== current.origin || url.pathname !== current.pathname || url.search !== current.search) return '';
        return url.hash && url.hash !== current.hash ? url.hash : '';
    } catch {
        return '';
    }
}

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
    onPressIn,
    onPointerDown,
    alt,
    ...rest
}: LinkProps) {

    const router = useRouter();
    const href = sanitazeUrl(hrefProp);
    const isExternal = isExternalUrl(href) || asExternal === true;
    const resolvedTarget = target ?? (isExternal ? '_blank' : undefined);
    const rel = resolvedTarget === '_blank' ? 'noopener noreferrer' : undefined;

    // Convert alt to aria-label (alt is not valid for <a> elements)
    const accessibleLabel = decodeTextNode(alt || (typeof children === 'string' ? children : undefined));

    const handlePress = useCallback((event?: { preventDefault?: () => void }) => {
        emitter.emit(EVENTS.link, { action: 'pressed', href });
        if (onPress) onPress(event);
        if (href) {
            try {
                router.push(href);
            } catch (error) {
                const message = error instanceof Error ? error.message : '';
                if (typeof window !== 'undefined' && message.includes('before initialization')) {
                    window.location.assign(href);
                } else {
                    throw error;
                }
            }
            event?.preventDefault?.();
        }
    }, [href, router, onPress]);

    // The click event goes to `onClick` so a handler can `preventDefault()`
    // (Next's Link then skips its own navigation).
    const handleLinkClick = useCallback((event?: any) => {
        emitter.emit(EVENTS.link, { action: 'pressed', href });
        onClick?.(event);

        // Next changes only the hash with pushState, which nobody hears; set it
        // on the location instead so the page gets `hashchange` (e.g. #cid= from
        // a notification on the page it points to).
        const hash = event && !event.defaultPrevented && !resolvedTarget && event.button === 0
            && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
            ? samePageHash(href) : '';
        if (hash) {
            event.preventDefault();
            window.location.hash = hash;
        }
    }, [onClick, href, resolvedTarget]);

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
                className={mode === 'plain' ? className : composedClassName}
                onPress={handlePress}
                onPressIn={onPressIn}
                onPointerDown={onPointerDown}
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
                target={resolvedTarget}
                rel={rel}
                href={href}
                className={className}
                // Inline style (NeoButtonLink: `--neo-hit-*` hit-area insets).
                style={rest.style as CSSProperties | undefined}
                prefetch={isPrefetch}
                onClick={handleLinkClick}
                onPointerDown={onPointerDown}
                aria-label={accessibleLabel}
                aria-current={rest['aria-current']}
            >
                {children}
            </Link>
    }

    return (
        <Link
            target={resolvedTarget}
            rel={rel}
            href={href}
            {...rest}
            className={composedClassName}
            prefetch={isPrefetch}
            onClick={handleLinkClick}
            onPointerDown={onPointerDown}
            aria-label={accessibleLabel}
        >
            {children}
        </Link>
    );
}
