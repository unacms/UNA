import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { useCallback, useMemo } from 'react';
import { appSetting, cn, sanitazeUrl, isExternalUrl } from 'app/lib/util'
import emitter from 'app/context/emitter';

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
    const href = sanitazeUrl(hrefProp);
    const isExternal = isExternalUrl(href) || asExternal === true;
    const resolvedTarget = target ?? (isExternal ? '_blank' : undefined);
    const rel = resolvedTarget === '_blank' ? 'noopener noreferrer' : undefined;

    // Convert alt to aria-label (alt is not valid for <a> elements)
    const accessibleLabel = alt || (typeof children === 'string' ? children : undefined);

    const handlePress = useCallback((event) => {
        emitter.emit('link', { action: 'pressed', href });
        if (onPress) onPress(event);
        if (href) {
            router.push(href);
            event?.preventDefault?.();
        }
    }, [href, router, onPress]);

    const handleLinkClick = useCallback((event) => {  
        emitter.emit('link', { action: 'pressed', href });
        if (onClick) onClick();
    }, [onClick, target, href]);

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
                target={resolvedTarget}
                rel={rel}
                href={href}
                className={className}
                prefetch={isPrefetch}
                onClick={handleLinkClick}
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
            aria-label={accessibleLabel}
        >
            {children}
        </Link>
    );
}
