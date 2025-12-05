import { Pressable } from 'app/design/view';
import { useGlobalSearchParams, Link } from 'app/lib/hooks/router'
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getDomainFromUrl, cd } from 'app/lib/util';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useCallback } from 'react';
import { Text } from 'app/design/typography'

export default function ElementLink(props) {
    const { href = '', target, haptics, children, asExternal, mode, variant, size, className = '', hitSlop, hitarea = true,  ...rest } = props;
    const glob = useGlobalSearchParams();
    const { currentUser } = useCurrentUser();

    const handleHapticsPress = useCallback(() => {
        if (haptics) {
            FeedbackHaptics(haptics);
        }
    }, [haptics]);

    const TabList = useMemo(() => {
        return currentUser
            ? appSetting('menu_items', 'menu_tabbar_logged')
            : appSetting('menu_items', 'menu_tabbar_non_logged');
    }, [currentUser?.id]);
    

    const LinksForTabs = useMemo(() => {
        const baseLinks = TabList.map((item, index) => ({
            url: item.url,
            index
        }));
    
       // const additionalLinks = appSetting('menu_items', 'transpile_urls');
        return baseLinks;//[...baseLinks, ...additionalLinks];
    }, [TabList]);

    // Список невалидных значений href
    const invalidHrefs = ['javascript:', '/javascript:', undefined, null];
    const sanitizedHref = invalidHrefs.includes(href) ? '' : href;

    // Если href невалиден или пуст, возвращаем детей без обертки
    let finalHref = sanitizedHref === '/home' ? '/' : sanitizedHref;
    if (!finalHref.includes('/')) {
        finalHref = `/${finalHref}`;
    }
    const domain = useMemo(() => getDomainFromUrl(finalHref), [finalHref]);
    const rootUrl = appSetting('config', 'native_app_images_url');

    const finalHrefWithDomain = finalHref;
    finalHref = finalHref.replace(domain, '');

    const index = useMemo(() => {
        const match = LinksForTabs.find((item) => finalHref.includes(item.url));
        return match ? match.index : -1; 
    }, [LinksForTabs, finalHref]);

    // Формирование пути навигации
    const p = useMemo(() => {
        if (target) {
            return finalHref;
        }
        return {
            pathname: index !== -1 ? `/tab${index}` : `/${glob.name}`,
            params: { url: finalHref },
        };
    }, [target, finalHref, index, glob.name]);

    // Получение домена и корневого URL
    // Обработчик внешних ссылок
    const handleExternalLinkPress = useCallback(async () => {
        await WebBrowser.openBrowserAsync(finalHrefWithDomain);
    }, [finalHrefWithDomain]);

    if (!sanitizedHref) {
        return children;
    }
    
    // Variants and sizes from theme - compute once for all link types
    const ThemeLinkSizes = appSetting('theme', 'link_sizes');
    const ThemeLinkStyles = appSetting('theme', 'link_styles');

    const selectedVariant = variant || 'default';
    const variantClass = [
        ThemeLinkStyles[`u-link-${selectedVariant}-cnt`] || '',
        ThemeLinkStyles[`u-link-${selectedVariant}-text`] || '',
        ThemeLinkStyles[`u-link-${selectedVariant}-trans`] || ''
    ].join(' ').trim();

    const sizeClass = (() => {
        if (!size) return '';
        const hitareaClass = hitarea === false ? '' : (ThemeLinkSizes[size]?.hitarea_class || '');
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        const roundedClass = ThemeLinkSizes[size]?.rounded || '';
        const focusClass = ThemeLinkSizes[size]?.focus || '';
        const paddingClass = ThemeLinkSizes[size]?.padding || '';
        return [paddingClass, hitareaClass, textSizeClass, roundedClass, focusClass].filter(Boolean).join(' ');
    })();

    // Fallback hitSlop from theme by size (native only); explicit prop wins; allow disabling with hitarea={false}
    const resolvedHitSlop = hitSlop ?? (hitarea === false ? undefined : (size ? ThemeLinkSizes[size]?.hitSlop : undefined));

    const ghostNativePressedClass = (selectedVariant === 'ghost' || selectedVariant === 'plainghost' || selectedVariant === 'accentghost') ? ' active:bg-muted rounded-lg ' : '';
    const composedClassName = [variantClass, sizeClass, ghostNativePressedClass, className].filter(Boolean).join(' ').trim();

    // Если ссылка внешняя, открываем в браузере
    if (domain && domain !== rootUrl || asExternal === true) {
        const content = (typeof children === 'string' || typeof children === 'number') ? (
            <Text className={composedClassName} style={{ pointerEvents: 'none' }}>{children}</Text>
        ) : children;
        
        // Generate accessible label for external links
        const externalAccessibleLabel = rest.alt || (typeof children === 'string' ? children : undefined);
        
        if (mode == 'text'){
            return (
                <Text 
                    onPress={handleExternalLinkPress}
                    className={composedClassName}
                    aria-label={externalAccessibleLabel}
                    accessibilityLabel={externalAccessibleLabel}
                >
                    {children}
                </Text>
            );
        }
        return (
            <Pressable 
                onPress={handleExternalLinkPress}
                className={composedClassName}
                aria-label={externalAccessibleLabel}
                accessibilityLabel={externalAccessibleLabel}
            >
                {content}
            </Pressable>
        );
    }


if (mode == 'text'){
    // Generate accessible label for text mode links
    const accessibleLabel = rest.alt || (typeof children === 'string' ? children : undefined);
    const { alt, ...linkRest } = rest;
    
    return (
        <Link 
            push 
            href={p} 
            asChild 
            aria-label={accessibleLabel}
            accessibilityLabel={accessibleLabel}
            {...linkRest}
        >
            <Text className={composedClassName}>{children}</Text>
        </Link>
    );
}

    // For non-text mode, wrap string/number children in Text with variant classes applied
    // style.pointerEvents="none" allows touches to pass through to parent Pressable
    const content = (typeof children === 'string' || typeof children === 'number') ? (
        <Text className={composedClassName} style={{ pointerEvents: 'none' }}>{children}</Text>
    ) : children;

    // Generate accessible label for link if needed
    const accessibleLabel = rest.alt || (typeof children === 'string' ? children : undefined);
    
    // Remove alt from rest since it's not valid for <a> elements
    const { alt, ...linkRest } = rest;

    return (
        <Link 
            push 
            href={p} 
            asChild 
            aria-label={accessibleLabel}
            accessibilityLabel={accessibleLabel}
            {...linkRest}
        >
            <Pressable 
                hitSlop={resolvedHitSlop} 
                onPress={haptics ? handleHapticsPress : undefined} 
                className={composedClassName}
            >
                {content}
            </Pressable>
        </Link>
    );
}