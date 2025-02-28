import { Pressable } from 'app/design/view';
import { Link, useGlobalSearchParams } from 'expo-router';
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getDomainFromUrl } from 'app/lib/util';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useCallback } from 'react';
import { Text } from 'app/design/typography'
export default function ElementLink(props) {
    const { href = '', target, haptics, children, asExternal, mode,  ...rest } = props;
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
        await WebBrowser.openBrowserAsync(finalHref);
    }, [finalHref]);

    if (!sanitizedHref) {
        return children;
    }
    // Если ссылка внешняя, открываем в браузере
    if (domain && domain !== rootUrl || asExternal === true) {
        if (mode == 'text'){
            return (
                <Text onPress={handleExternalLinkPress}>
                    {children}
                </Text>
            );
        }
        return (
            <Pressable onPress={handleExternalLinkPress}>
                {children}
            </Pressable>
        );
    }


if (mode == 'text'){
    return (
        <Link push href={p} asChild {...rest}>
                {children}
        </Link>
    );
}

    return (
        <Link push href={p} asChild {...rest}>
            <Pressable onPress={haptics ? handleHapticsPress : undefined}>
                {children}
            </Pressable>
        </Link>
    );
}