import { Root } from 'app/root'
import { memo, useState, useEffect, useRef } from 'react'
import { useCurrentUser } from 'app/context/user';
import { appSetting, parseUrl, parseQueryString, isNativeTabsEnabled } from 'app/lib/util'
import { useBottomSheetData } from 'app/context/bottomsheet';
import { fetcher } from 'app/lib/fetcher';
import { useLocalSearchParams, useIsFocused } from 'app/lib/hooks/router'
import { ensureTabHistory, applyTabHistory, peekTabLastUrl } from 'app/lib/navigation/tab-history';
import { splitTabBarItems } from 'app/components/nav/tabs/tab-menu';
import { getCachedPageData, setCachedPageData } from 'app/lib/cache/native-tab-page-cache';
import { clearAllPageCache } from 'app/lib/cache/clear-page-cache';
import emitter, { EVENTS } from 'app/context/emitter'
import * as SplashScreen from 'expo-splash-screen';
import { TabChromeProvider } from 'app/context/tab-chrome';
import { usePageBottomBlur } from 'app/context/jotai/layout';
import { TabSlide } from 'app/components/nav/tab-slide';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'app/lib/hooks/router';
import { EdgeBlur, edgeBlurConfig } from 'app/ui/atoms/edge-blur';

/**
 * iOS NativeTabs: native blur behind the floating tab bar (`layout.tabbar_fade_blur`).
 * Inside a tab screen the bottom safe-area inset already includes the tab bar
 * (UIKit adds it), so the blur spans that inset plus `extend`.
 */
function TabBarEdgeBlur({ tabKey }) {
    const insets = useSafeAreaInsets();
    const config = edgeBlurConfig('tabbar');
    // The page already blurs from the screen bottom up (messenger composer).
    const pageOwnsBlur = usePageBottomBlur(tabKey);
    if (!config || pageOwnsBlur) return null;
    const height = insets.bottom + (config.extend ?? 0);
    return (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height }}>
            <EdgeBlur edge="bottom" config={config} />
        </View>
    );
}

const NativeTabPressSync = isNativeTabsEnabled()
    ? require('./native-tab-press-sync').default
    : null;

function isFetchablePagePath(path) {
    return Boolean(path && path.startsWith('/') && !path.includes('/?url='));
}

export async function getData(pagePath, params) {
    let path = (!pagePath || pagePath === '/' || pagePath.startsWith('expo-development-client')) ? 'home' : pagePath;
    path = path.startsWith('/') ? path.slice(1) : path;

    let apiPath = `/api.php?r=system/get_page_by_request/TemplServicePages&params[]=${path}`;
    if (params) {
        apiPath += `&params[]=&params[]=${params}`;
    }

    const data = await fetcher(apiPath);
    return { props: data };
}

async function fetchPageProps(pagePath) {
    const { path: pathWithoutQuery, queryString } = parseUrl(pagePath);
    const params = queryString ? JSON.stringify(parseQueryString(queryString)) : null;
    const data = await getData(pathWithoutQuery, params);
    return data;
}

function hideSplashOnce(splashHiddenRef, delayMs = 0) {
    if (splashHiddenRef.current) return null;
    splashHiddenRef.current = true;
    if (delayMs > 0) {
        return setTimeout(() => {
            SplashScreen.hideAsync().catch(() => {});
        }, delayMs);
    }
    void SplashScreen.hideAsync().catch(() => {});
    return null;
}

function routeParam(value) {
    if (value == null) return value;
    return Array.isArray(value) ? value[0] : value;
}

/**
 * NativeTabs mounts every screen at once and freeze is off (see tabs/index.js),
 * so without this gate all five tabs fetch and render their full page trees —
 * image feeds included — at launch. Activate a tab's content on first focus, or
 * in the background after `lazy_tabs_preload_delay` ms so later switches are
 * still instant. JS tabs already lazy-mount at the navigator level.
 */
function useLazyTabActivation() {
    const isFocused = useIsFocused();
    const [activated, setActivated] = useState(() => !isNativeTabsEnabled() || isFocused);
    if (isFocused && !activated) {
        setActivated(true);
    }
    useEffect(() => {
        if (activated) return undefined;
        const delay = Number(appSetting('native', 'lazy_tabs_preload_delay'));
        if (!Number.isFinite(delay) || delay <= 0) {
            setActivated(true);
            return undefined;
        }
        const timer = setTimeout(() => setActivated(true), delay);
        return () => clearTimeout(timer);
    }, [activated]);
    return activated;
}

function ScreenInner(params) {
    const local = useLocalSearchParams();
    const pathname = params.tabname;
    const { currentUser } = useCurrentUser();
    const activated = useLazyTabActivation();
    const tabListKey = currentUser ? 'menu_tabbar_logged' : 'menu_tabbar_non_logged';
    const tabList = appSetting('menu_items', tabListKey) || [];
    let _path = routeParam(local.url);

    // A native press on the More tab (switching to it or re-tapping it) is
    // followed by a JUMP_TO that drops this route's params, and the root
    // fallback below would swap in the first overflow item. Keep the page the
    // More tab was showing.
    if (!_path && pathname === `/tab${splitTabBarItems(tabList).moreTabIndex}`) {
        _path = peekTabLastUrl(pathname);
    }

    // BOTTOM TABS NAVIGATION
    // Also detect a stale URL from the other user context (e.g. guest's /safety still
    // held by Expo Router after login). Recompute it from the current context's menu.
    const otherTabListKey = currentUser ? 'menu_tabbar_non_logged' : 'menu_tabbar_logged';
    const otherMenuItem = (appSetting('menu_items', otherTabListKey) || []).find((item) => item.key === pathname);
    const isStaleContextUrl = !!otherMenuItem?.url && _path === otherMenuItem.url;

    if (!_path || _path.includes('/tab') || isStaleContextUrl) {
        const item = tabList.find((item) => item.key === pathname);
        _path = item ? item.url : null;
        if (_path === '{profile}') {
            _path = currentUser?.url;
        }
    }

    const userKey = currentUser?.id
        ? `${currentUser.id}-${currentUser.confirmed}`
        : 'guest';
    // Same rule as the tab bar itself (tabs/index.js `isShowTabs`).
    const isShowTabs = !!((currentUser && currentUser.confirmed) || appSetting('native', 'show_tabs_non_logged'));

    // Stable key per tab — no remount on in-tab navigation. Shell refresh uses refreshToken (redirectTo), not key.
    return (
        <>
            {NativeTabPressSync ? <NativeTabPressSync tabKey={pathname} /> : null}
            {activated ? (
                <TabChromeProvider tabKey={pathname}>
                    <Content
                        key={`${pathname}__${userKey}`}
                        pagePath={_path}
                        currentUser={currentUser}
                        tabKey={pathname}
                        refreshToken={local.refresh}
                        historyMode={routeParam(local.tabHist)}
                    />
                </TabChromeProvider>
            ) : null}
            {activated && isShowTabs && isNativeTabsEnabled() ? <TabBarEdgeBlur tabKey={pathname} /> : null}
        </>
    );
}

// The tab navigator re-renders every mounted route on each navigation state
// change, and freeze is off for NativeTabs — so unfocused tabs must bail out here.
export const Screen = memo(ScreenInner);

/** Second barrier: expo-router route contexts can force Screen/Content to render. */
const PageBody = memo(function PageBody({ path, data }) {
    return <Root path={path} data={data} uri={data?.uri} />;
});

/** Cache read, tagged with the path it belongs to. */
function readCachedPage(tabKey, pagePath, currentUser, refreshToken) {
    if (!tabKey || !pagePath || refreshToken) return null;
    const cached = getCachedPageData(tabKey, pagePath, currentUser?.id, currentUser?.confirmed);
    if (!cached) return null;
    return { path: pagePath, props: cached };
}

function resolvePageTimestamp(tabKey, pagePath, currentUser, { forceShellRefresh, hadCache }) {
    if (forceShellRefresh || hadCache) return Date.now();
    const existing = getCachedPageData(tabKey, pagePath, currentUser?.id, currentUser?.confirmed);
    return existing?.data?.timestamp ?? Date.now();
}

const Content = memo(({ pagePath, currentUser, tabKey, refreshToken, historyMode }) => {
    // Page state carries the path it was loaded for. When the path changes, read
    // the cache during render (React "adjusting state while rendering") so body
    // appears in the same pass — no empty frame + layout-effect re-render.
    const [page, setPage] = useState(() => readCachedPage(tabKey, pagePath, currentUser, refreshToken));
    let pageData = page?.path === pagePath ? page.props : null;
    if (!pageData) {
        const cached = readCachedPage(tabKey, pagePath, currentUser, refreshToken);
        if (cached) {
            pageData = cached.props;
            setPage(cached);
        }
    }

    const { setBottomSheetData } = useBottomSheetData();
    const pagePathRef = useRef(pagePath);
    const tabKeyRef = useRef(tabKey);
    const currentUserRef = useRef(currentUser);
    const splashHiddenRef = useRef(false);
    pagePathRef.current = pagePath;
    tabKeyRef.current = tabKey;
    currentUserRef.current = currentUser;

    useEffect(() => {
        if (!tabKey) return;
        ensureTabHistory(tabKey, currentUser, pagePath);
    }, [tabKey, currentUser?.id, currentUser?.url, pagePath]);

    useEffect(() => {
        if (!tabKey || !pagePath) return;
        applyTabHistory(
            tabKey,
            pagePath,
            currentUser,
            historyMode === 'replace' || historyMode === 'reset' ? historyMode : 'push',
        );
    }, [tabKey, pagePath, currentUser?.id, currentUser?.url, historyMode]);

    // Stale-while-revalidate: show cache immediately, always refetch from server.
    useEffect(() => {
        if (!isFetchablePagePath(pagePath)) return;

        const forceShellRefresh = Boolean(refreshToken);
        const cached = !forceShellRefresh
            ? getCachedPageData(tabKey, pagePath, currentUser?.id, currentUser?.confirmed)
            : null;

        let cancelled = false;
        const pathAtStart = pagePath;

        const run = async () => {
            try {
                const data = await fetchPageProps(pagePath);
                if (cancelled || pagePathRef.current !== pathAtStart) return;
                if (data?.props) {
                    // Bump timestamp on force refresh or after serving cache so profile/layout
                    // adopt fresh menu/actions (Trust, connections, etc.).
                    data.props.data.timestamp = resolvePageTimestamp(
                        tabKey,
                        pagePath,
                        currentUser,
                        { forceShellRefresh, hadCache: Boolean(cached) },
                    );
                    setCachedPageData(tabKey, pagePath, data.props, currentUser?.id, currentUser?.confirmed);
                    setBottomSheetData(false);
                    setPage({ path: pathAtStart, props: data.props });
                } else {
                    hideSplashOnce(splashHiddenRef);
                }
            } catch {
                if (cancelled) return;
                hideSplashOnce(splashHiddenRef);
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [pagePath, currentUser?.id, currentUser?.confirmed, tabKey, refreshToken, setBottomSheetData]);

    // Language switch (and other page reloads): drop stale cached JSON and refetch.
    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.page, (payload) => {
            if (payload?.action !== 'reload') return;

            clearAllPageCache();

            const path = pagePathRef.current;
            const key = tabKeyRef.current;
            const user = currentUserRef.current;
            if (!isFetchablePagePath(path)) return;

            (async () => {
                try {
                    const data = await fetchPageProps(path);
                    if (data?.props) {
                        data.props.data.timestamp = Date.now();
                        setCachedPageData(key, path, data.props, user?.id, user?.confirmed);
                        setBottomSheetData(false);
                        setPage({ path, props: data.props });
                    }
                } catch {
                    // Keep showing last good pageData if any; splash already handled on cold start.
                }
            })();
        });
        return () => subscription.remove();
    }, [setBottomSheetData]);

    useEffect(() => {
        if (!pageData?.data) return;
        const timer = hideSplashOnce(splashHiddenRef, 1000);
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [pageData?.data]);

    const body = pageData?.data ? (
        <PageBody path={pagePath} data={pageData.data} />
    ) : null;

    if (!isNativeTabsEnabled()) {
        return body;
    }

    return (
        <TabSlide tabKey={tabKey} ready={!!pageData?.data}>
            {body}
        </TabSlide>
    );
});
