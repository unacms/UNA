import { Root } from 'app/root'
import { useState, useEffect, useLayoutEffect } from 'react'
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, getURI, getPageSettings } from 'app/lib/util'
import { Loading } from 'app/customization/loading'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';
import { useLocalSearchParams } from 'app/lib/hooks/router'
import { ensureTabHistory, pushTabHistory } from 'app/lib/tab-history';
import { getCachedPageData, setCachedPageData } from 'app/lib/tab-page-cache';
import * as SplashScreen from 'expo-splash-screen';

export async function getData(path, token, origin, headers, callback, params) {

    path = (!path || path.startsWith('expo-development-client')) ? 'home' : path;
    path = path.startsWith('/') ? path.substr(1) : path;
    path = `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${path}`;

    const uri = getURI(path);
   // const settings = appSetting('l-ayouts', uri);
    /*if (settings?.blocks) {
        const blockNames = Object.values(settings.blocks).map(block => block.name).join(',');
        path += `&params[]=${blockNames}`;
    }
*/
    if (params) {
        path += `&params[]=&params[]=${params}`;
    }

    const fetcherArgs = token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path;
   
    const data = await fetcher(fetcherArgs);

    return { props: { uri: path.length ? path[0] : 'home', ...data } };
}

function routeParam(value) {
    if (value == null) return value;
    return Array.isArray(value) ? value[0] : value;
}

export function Screen(params) {
    const local = useLocalSearchParams();
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    let _path = routeParam(local.url);
    let isRoot = false;
  
    // BOTTOM TABS NAVIGATION
    // Also detect a stale URL from the other user context (e.g. guest's /safety still
    // held by Expo Router after login). Recompute it from the current context's menu.
    const otherTabListKey = currentUser ? 'menu_tabbar_non_logged' : 'menu_tabbar_logged';
    const otherMenuItem = (appSetting('menu_items', otherTabListKey) || []).find((item) => item.key === pathname);
    const isStaleContextUrl = !!otherMenuItem?.url && _path === otherMenuItem.url;

    if (!_path || _path.includes('/tab') || isStaleContextUrl) {
        const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
        const tabList = appSetting('menu_items', tabListKey);
        const item = tabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
        if (_path === '{profile}') {
            _path = currentUser?.url;
        }
        
        isRoot = true;
    }

    const userKey = currentUser?.id ?? 'guest';
    // Stable key per tab — no remount on in-tab navigation. Shell refresh uses refreshToken (redirectTo), not key.
    return (
        <Content
            key={`${pathname}__${userKey}`}
            pagePath={_path}
            currentUser={currentUser}
            tabKey={pathname}
            isRoot={isRoot}
            refreshToken={local.refresh}
        />
    );


}

const Content = ({ pagePath, currentUser, tabKey, isRoot, refreshToken }) => {


    const [pageData, setPageData] = useState(null);
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();

    useEffect(() => {
        if (!tabKey) return;
        ensureTabHistory(tabKey, currentUser, pagePath);
    }, [tabKey, currentUser?.id, currentUser?.url, pagePath]);

    useEffect(() => {
        if (!tabKey || !pagePath) return;
        pushTabHistory(tabKey, pagePath, currentUser);
    }, [tabKey, pagePath, currentUser?.id, currentUser?.url]);

    // Apply cached page synchronously when the in-tab URL changes (e.g. profile back).
    useLayoutEffect(() => {
        if (!tabKey || !pagePath || refreshToken) return;
        const cached = getCachedPageData(tabKey, pagePath);
        if (cached) {
            setPageData(cached);
            return;
        }
        setPageData((prev) => {
            const prevUrl = prev?.data?.url;
            if (!prevUrl || prevUrl === pagePath) return prev;
            return null;
        });
    }, [tabKey, pagePath, refreshToken]);

    useEffect(() => {
        if (!(pagePath && pagePath.startsWith('/') && !pagePath.includes('/?url='))) return;

        const forceShellRefresh = Boolean(refreshToken);
        if (!forceShellRefresh) {
            const cached = getCachedPageData(tabKey, pagePath);
            if (cached) {
                setPageData(cached);
                return;
            }
        }

        const fetchPageData = async () => {
            const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
            const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
            const data = await getData(pathWithoutQuery, null, null, null, null, params);
            if (data?.props) {
                if (forceShellRefresh) {
                    data.props.data.timestamp = Date.now();
                } else {
                    const existing = getCachedPageData(tabKey, pagePath);
                    data.props.data.timestamp = existing?.data?.timestamp ?? Date.now();
                }
                setCachedPageData(tabKey, pagePath, data.props);
                setBottomSheetData(bottomSheetData !== false ? false : bottomSheetData);
                setPageData(data.props);
            }
        };
        fetchPageData();
    }, [pagePath, currentUser?.id, currentUser?.confirmed, tabKey, refreshToken]);


    useEffect(() => {
        const prepareApp = async () => {
            if (pageData?.data) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                await SplashScreen.hideAsync();
            }
        };

        prepareApp();
    }, [pageData?.data]);
    return pageData?.data ? (

        <Root path={pagePath} data={pageData.data} uri={pageData.data.uri} />
    ) : <></>;
};