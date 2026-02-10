import { Pressable } from 'app/design/view';
import { useGlobalSearchParams, Link } from 'app/lib/hooks/router'
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getDomainFromUrl, cn } from 'app/lib/util';
import * as WebBrowser from 'expo-web-browser';
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
    haptics,
    children,
    asExternal,
    mode,
    variant = 'default',
    size,
    className = '',
    hitSlop,
    hitarea = true,
    alt,
    ...rest 
}) {

    const glob = useGlobalSearchParams();

    const { currentUser } = useCurrentUser();

    const handlePress = useCallback(() => {
        if (haptics) FeedbackHaptics(haptics);
        if (isIos) emitter.emit('link', { action: 'pressed' });
    }, [haptics]);

    const TabList = useMemo(() => {
        return currentUser
            ? appSetting('menu_items', 'menu_tabbar_logged')
            : appSetting('menu_items', 'menu_tabbar_non_logged');
    }, [currentUser?.id]);

    const invalidHrefs = ['javascript:', '/javascript:', undefined, null];
    const sanitizedHref = invalidHrefs.includes(href) ? '' : href;

    let finalHref = sanitizedHref;
    if (!finalHref.includes('/')) {
        finalHref = `/${finalHref}`;
    }
    const domain = getDomainFromUrl(finalHref);
    const rootUrl = appSetting('config', 'native_app_images_url');

    const externalUrl = finalHref;
    finalHref = finalHref.replace(domain, '');

    const index = (() => {
        const match = TabList.find((item) => finalHref.includes(item.url));
        return match ? TabList.indexOf(match) : -1;
    })();

    const p = useMemo(() => {
        if (target) {
            return finalHref;
        }
        return {
            pathname: index !== -1 ? `/tab${index}` : `/${glob.name}`,
            params: { url: finalHref },
        };
    }, [target, finalHref, index, glob.name]);

    const handleExternalLinkPress = useCallback(async () => {
        await WebBrowser.openBrowserAsync(externalUrl);
    }, [finalHrefWithDomain]);

    if (!sanitizedHref) {
        return children;
    }

    const sizeClass = (() => {
        if (!size) return '';
        const hitareaClass = hitarea === false ? '' : ('web:u-link-hitarea web:u-link-hitarea-' + size || '');
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        return cn(hitareaClass, textSizeClass);
    })();

    // Fallback hitSlop from theme by size (native only); explicit prop wins; allow disabling with hitarea={false}
    const resolvedHitSlop =
        hitSlop !== undefined ? hitSlop :
            hitarea === false ? undefined :
                { top: ThemeLinkSizes[size]?.hitSlop, right: ThemeLinkSizes[size]?.hitSlop, bottom: ThemeLinkSizes[size]?.hitSlop, left: ThemeLinkSizes[size]?.hitSlop };


    const composedClassName = cn(ThemeLinkStyles[variant], sizeClass, className);

    // Helper to check if children are all text-like (strings/numbers) including arrays
    const isTextContent = (child) => {
        if (child === null || child === undefined) return true;
        if (typeof child === 'string' || typeof child === 'number') return true;
        if (Array.isArray(child)) return child.every(isTextContent);
        return false;
    };

    const accessibleLabel = alt || (typeof children === 'string' ? children : undefined);
    // open external links in browser
    if (domain && domain !== rootUrl || asExternal === true) {
        const content = isTextContent(children) ? (
            <Text className={composedClassName} style={{ pointerEvents: 'none' }}>{children}</Text>
        ) : children;

        if (mode === 'text') {
            return (
                <Text
                    onPress={handleExternalLinkPress}
                    className={composedClassName}
                    aria-label={accessibleLabel}
                    accessibilityLabel={accessibleLabel}
                >
                    {children}
                </Text>
            );
        }
        return (
            <Pressable
                onPress={handleExternalLinkPress}
                className={composedClassName}
                aria-label={accessibleLabel}
                accessibilityLabel={accessibleLabel}
            >
                {content}
            </Pressable>
        );
    }

    if (mode === 'text') {
        return (
            <Link
                push
                href={p}
                asChild
                aria-label={accessibleLabel}
                accessibilityLabel={accessibleLabel}
                {...rest}
            >
                <Text className={composedClassName}>{children}</Text>
            </Link>
        );
    }

    // For non-text mode, wrap string/number children in Text with variant classes applied
    // style.pointerEvents="none" allows touches to pass through to parent Pressable
    const content = isTextContent(children) ? (
        <Text className={composedClassName} style={{ pointerEvents: 'none' }}>{children}</Text>
    ) : children;

    return (
        <Link
            push
            href={p}
            asChild
            aria-label={accessibleLabel}
            accessibilityLabel={accessibleLabel}
            {...rest}
        >
            <Pressable
                hitSlop={resolvedHitSlop}
                onPress={handlePress}
                className={composedClassName}
            >
                {content}
            </Pressable>
        </Link>
    );
}