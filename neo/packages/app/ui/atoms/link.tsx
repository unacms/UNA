import { Pressable } from 'app/design/view';
import { useCurrentTabPath, Link } from 'app/lib/hooks/router'
import { FeedbackHaptics, isExternalUrl, openExternalLink } from 'app/lib/util';
import { nativeTabPageHref } from 'app/lib/navigation/tab-history';
import { findTabPathForUrl } from 'app/components/nav/tabs/tab-menu';
import { useCurrentUser } from 'app/context/user';
import { appSetting, sanitazeUrl, cn } from 'app/lib/util';
import { useMemo, useCallback } from 'react';
import { Text } from 'app/design/typography'
import emitter, { EVENTS } from 'app/context/emitter';
import type { LinkProps } from './link.types';
const ThemeLinkSizes = appSetting('theme', 'link_sizes');
const ThemeLinkStyles = appSetting('theme', 'link_styles');

export default function ElementLink({
    href = '',
    target,
    /** When set (e.g. `/tab0`), native navigation uses this tab segment instead of inferring from the tab bar or current tab. */
    tabPath,
    haptics,
    children,
    asExternal,
    onPress,
    mode,
    variant = 'default',
    size,
    className = '',
    hitSlop,
    hitarea = true,
    alt,
    emulate: _emulate,
    ...rest 
}: LinkProps) {

    const currentTabPath = useCurrentTabPath();
    const { currentUser } = useCurrentUser();

    const finalHref = sanitazeUrl(href);

    const handlePress = useCallback((e: any) => {
        if (haptics) FeedbackHaptics(haptics);
        emitter.emit(EVENTS.link, { action: 'pressed', href: finalHref });
        onPress?.(e); 
    }, [haptics, finalHref, onPress]);

    const isLoggedIn = !!currentUser;
    const TabList = useMemo(() => {
        return isLoggedIn
            ? appSetting('menu_items', 'menu_tabbar_logged')
            : appSetting('menu_items', 'menu_tabbar_non_logged');
    }, [isLoggedIn]);

   
    // Match against tab urls + transpile_urls so in-app links route to the same
    // tab as deep links (see processUrl in components/nav/tabs/index.js).
    const matchedTabPath = useMemo(() => findTabPathForUrl(finalHref, TabList), [finalHref, TabList]);

    const p = useMemo(() => {
        if (target) {
            return finalHref;
        }
        const pathname = tabPath || matchedTabPath || currentTabPath;
        // A page pushed onto that tab's native stack, or its root.
        return nativeTabPageHref(finalHref, pathname, currentUser);
    }, [target, finalHref, matchedTabPath, currentTabPath, tabPath, currentUser]);

    // Pages always push (same tab or another one); a tab root is navigated to,
    // which pops that tab's stack back to it.
    const pushes = typeof p !== 'object' || 'params' in p;


    const sizeClass = (() => {
        if (!size) return '';
        const hitareaClass = hitarea === false ? '' : ('web:u-link-hitarea web:u-link-hitarea-' + size);
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        // Variant-specific size classes (e.g. real padding for 'primary' inline-button style)
        const variantSizeClass = ThemeLinkSizes[size]?.[variant] || '';
        return cn(hitareaClass, textSizeClass, variantSizeClass);
    })();

    const sizeHitSlop = size ? ThemeLinkSizes[size]?.hitSlop : undefined;
    // Fallback hitSlop from theme by size (native only); explicit prop wins; allow disabling with hitarea={false}
    const resolvedHitSlop =
        hitSlop !== undefined ? hitSlop :
            hitarea === false ? undefined :
                { top: sizeHitSlop, right: sizeHitSlop, bottom: sizeHitSlop, left: sizeHitSlop };


    const composedClassName = cn(ThemeLinkStyles[variant], sizeClass, className);

    // Helper to check if children are all text-like (strings/numbers) including arrays
    const isTextContent = (child: any) => {
        if (child === null || child === undefined) return true;
        if (typeof child === 'string' || typeof child === 'number') return true;
        if (Array.isArray(child)) return child.every(isTextContent);
        return false;
    };

    const accessibleLabel = alt || (typeof children === 'string' ? children : undefined);
    const isTextMode = mode === 'text';
    const isPlainMode = mode === 'plain';
    const isExternal = isExternalUrl(finalHref) || asExternal === true;

    const content = isTextContent(children) ? (
        <Text className={composedClassName}>{children}</Text>
    ) : children;

    // open external links in browser
    if (isExternal) {
        const Cnt = isTextMode ? Text : Pressable;

        return (
            <Cnt
                onPress={(e: any) => {
                    handlePress(e);
                    openExternalLink(finalHref);
                }}
                className={composedClassName}
                aria-label={accessibleLabel}
                accessibilityLabel={accessibleLabel}
            >
                {isTextMode ? children : content}
            </Cnt>
        );
    }

    const renderInnerContent = () => {
        if (isPlainMode) return content;
        if (isTextMode) return <Text className={composedClassName}>{children}</Text>;

        return (
            <Pressable
                hitSlop={resolvedHitSlop}
                className={composedClassName}
            >
                {content}
            </Pressable>
        );
    };

    return (
        <Link
            push={pushes}
            href={p}
            asChild
            onPress={handlePress}
            aria-label={accessibleLabel}
            accessibilityLabel={accessibleLabel}
            {...rest}
        >
            {renderInnerContent()}
        </Link>
    );
}
