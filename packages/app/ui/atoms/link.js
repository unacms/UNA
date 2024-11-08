import { Pressable } from 'app/design/view';
import { Link, useGlobalSearchParams } from 'expo-router';
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getDomainFromUrl } from 'app/lib/util';
import * as WebBrowser from 'expo-web-browser';
import React, { useMemo, useCallback } from 'react';

export default function ElementLink(props) {
    const { href = '', target, haptics, children, ...rest } = props;
    const glob = useGlobalSearchParams();
    const { currentUser } = useCurrentUser();

    // Обработчик для Haptics
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

    // Список невалидных значений href
    const invalidHrefs = ['javascript:', '/javascript:', undefined, null];
    const sanitizedHref = invalidHrefs.includes(href) ? '' : href;

    // Если href невалиден или пуст, возвращаем детей без обертки
    

    let finalHref = sanitizedHref === '/home' ? '/' : sanitizedHref;

    // Поиск индекса в TabList
    const index = useMemo(() => {
        return TabList.findIndex((item) => finalHref.includes(item.url));
    }, [TabList, finalHref]);

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
    const domain = useMemo(() => getDomainFromUrl(finalHref), [finalHref]);
    const rootUrl = appSetting('config', 'native_app_images_url');

    // Обработчик внешних ссылок
    const handleExternalLinkPress = useCallback(async () => {
        await WebBrowser.openBrowserAsync(finalHref);
    }, [finalHref]);

    if (!sanitizedHref) {
        return children;
    }

    // Если ссылка внешняя, открываем в браузере
    if (domain && domain !== rootUrl) {
        return (
            <Pressable onPress={handleExternalLinkPress}>
                {children}
            </Pressable>
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