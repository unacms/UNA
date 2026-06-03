import { Pressable } from 'app/design/view';
import { useGlobalSearchParams, Link } from 'app/lib/hooks/router'
import { FeedbackHaptics, isExternalUrl, openExternalLink } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appSetting, sanitazeUrl, cn } from 'app/lib/util';
import { useMemo, useCallback } from 'react';
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import emitter from 'app/context/emitter';

const ThemeLinkSizes = appSetting('theme', 'link_sizes');
const ThemeLinkStyles = appSetting('theme', 'link_styles');

const isIos = Platform.OS === 'ios';

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
    ...rest 
}: any) {

    const glob = useGlobalSearchParams();
    const { currentUser } = useCurrentUser();

    const handlePress = useCallback((e) => {
        if (haptics) FeedbackHaptics(haptics);
        emitter.emit('link', { action: 'pressed' });
        onPress?.(e); 
    }, [haptics]);

    const TabList = useMemo(() => {
        return currentUser
            ? appSetting('menu_items', 'menu_tabbar_logged')
            : appSetting('menu_items', 'menu_tabbar_non_logged');
    }, [currentUser?.id]);

   
    const finalHref = sanitazeUrl(href);

    const index = (() => {
        const match = TabList.find((item: any) => finalHref.includes(item.url));
        return match ? TabList.indexOf(match) : -1;
    })();

    const p = useMemo(() => {
        if (target) {
            return finalHref;
        }
        const pathname = tabPath
            ? tabPath
            : index !== -1
              ? `/tab${index}`
              : `/${glob.name}`;
        return {
            pathname,
            params: { url: finalHref },
        };
    }, [target, finalHref, index, glob.name, tabPath]);


    const sizeClass = (() => {
        if (!size) return '';
        const hitareaClass = hitarea === false ? '' : ('web:u-link-hitarea web:u-link-hitarea-' + size);
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        // Variant-specific size classes (e.g. real padding for 'primary' inline-button style)
        const variantSizeClass = ThemeLinkSizes[size]?.[variant] || '';
        return cn(hitareaClass, textSizeClass, variantSizeClass);
    })();

    // Fallback hitSlop from theme by size (native only); explicit prop wins; allow disabling with hitarea={false}
    const resolvedHitSlop =
        hitSlop !== undefined ? hitSlop :
            hitarea === false ? undefined :
                { top: ThemeLinkSizes[size]?.hitSlop, right: ThemeLinkSizes[size]?.hitSlop, bottom: ThemeLinkSizes[size]?.hitSlop, left: ThemeLinkSizes[size]?.hitSlop };


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
                onPress={() => openExternalLink(finalHref)}
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
                onPress={handlePress}
                className={composedClassName}
            >
                {content}
            </Pressable>
        );
    };

    return (
        <Link
            push
            href={p}
            asChild
            aria-label={accessibleLabel}
            accessibilityLabel={accessibleLabel}
            {...rest}
        >
            {renderInnerContent()}
        </Link>
    );
}