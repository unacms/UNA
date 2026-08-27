import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useSharedValue } from 'react-native-reanimated';
import { View } from 'app/design/view';
import { appSetting, deepEqual } from 'app/lib/util';
import { fillTabs, mergeConductorRoutes, parseData, fetchAndUpdateData, pageDataWithRestoredFormValues, findConductorRouteIndex } from './helpers';
import { ConductorLeftbarBlocks, ConductorFiltersButton, openConductorFiltersSheet } from './shared-ui';
import { TabSceneHeader, TabBar, TabScene, AT_TOP_SCROLL_THRESHOLD } from './native-ui';
import { useConductorLeftbar, useConductorFilters } from './use-conductor';
import { useConductorRoutes } from './use-conductor-routes';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from 'app/context/user'
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import Snackbar from 'app/ui/atoms/snackbar';
import { useBottomSheetData } from 'app/context/bottomsheet';
import emitter from 'app/context/emitter'
import { useSetHeader, useGetScrollValue, defaultHeader, useSetHeaderHeight, getHeaderWriteGeneration } from 'app/context/jotai/layout';
import { isTabScopedChromeKey, useTabChromeKey } from 'app/context/tab-chrome';
import { getComponent } from 'app/components/registry';
import { useFocusEffect, useIsFocused } from 'app/lib/hooks/router'
import {
    getCachedConductorState,
    setCachedConductorState,
    consumeNotificationsConductorStale,
} from 'app/lib/cache/native-conductor-cache';
import { setListScrollOffset } from 'app/lib/cache/list-scroll-cache';
import { useTranslation } from 'react-i18next';

export function Conductor({ isCoverDisabled, header, isHideDefaultHeader, leftSideBarBlocks, menu, layoutName, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword, ts }) {
    const { t } = useTranslation();
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';
    const { currentUser } = useCurrentUser();

    const { setBottomSheetData } = useBottomSheetData();
    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);
    const conductorCacheKey = `${layoutName}:${data?.url ?? ''}:${currentUser?.id ?? 'guest'}`;
    // Read cache once for bootstrap; later URL changes go through applyUrlChange.
    const cachedConductorRef = useRef(null);
    if (cachedConductorRef.current === null) {
        cachedConductorRef.current = getCachedConductorState(
            layoutName,
            data?.url,
            currentUser?.id
        );
    }
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [refreshRequested, setRefreshRequested] = useState(false);

    const setHeader = useSetHeader();
    const setHeaderHeight = useSetHeaderHeight();
    const getScrollValue = useGetScrollValue();
    const tabScopedHeader = isTabScopedChromeKey(useTabChromeKey());
    // Tab screens stay mounted when blurred (see tabs.js) — every write to the
    // shared header atom and every global emitter command must be gated on
    // focus, otherwise a background conductor clobbers the visible submenu.
    const isFocused = useIsFocused();
    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;

    const listRef = useRef(null);
    const coverScrollY = useSharedValue(0);
    const [coverOverlayPad, setCoverOverlayPad] = useState(0);
    const onOverlayHeight = useCallback((height) => {
        setCoverOverlayPad((prev) => (prev === height ? prev : height));
    }, []);
    const activeRequestUrlRef = useRef(null);

    // Platform bits for useConductorRoutes (cache, focus-gated links, no URL change on tab).
    const routesAdapter = useMemo(
        () => ({
            skipFirstPageRev: true,
            getInitialRoutes: (tabs) => cachedConductorRef.current?.routes ?? tabs,
            applyUrlChange: ({
                setRoutes,
                setIndex,
                initedTabs: tabs,
                pageUrl,
                useSectionAsMenu: sectionMenu,
                indexRef,
            }) => {
                setRoutes(tabs);
                const foundIndex = findConductorRouteIndex(tabs, pageUrl, sectionMenu);
                if (foundIndex !== -1 && foundIndex !== indexRef.current) {
                    setIndex(foundIndex);
                }
            },
            applySoftRefresh: ({ setRoutes, initedTabs: tabs }) => {
                setRoutes((current) => mergeConductorRoutes(tabs, current));
            },
            // Submenu switches in place — do not change the screen URL (cover/shell).
            onSelectTab: ({ tab, setIndex, routesRef, onChangeRoute: notify }) => {
                setIndex(tab.index);
                notify?.(routesRef.current?.[tab.index] ?? tab);
            },
            onMenuChange: ({ menu: nextMenu, prevMenu, initedTabs: tabs, setRoutes }) => {
                if (deepEqual(nextMenu, prevMenu)) return;
                setRoutes((prev) => mergeConductorRoutes(tabs, prev));
            },
            subscribeExternalHref: (onHref) => {
                const sub = emitter.addListener('link', (payload) => {
                    if (!isFocusedRef.current) return;
                    const href = payload?.href;
                    if (!href) return;
                    onHref(href);
                });
                return () => sub.remove();
            },
        }),
        []
    );

    const {
        routes,
        setRoutes,
        routesRef,
        index,
        setIndex,
        indexRef,
        activeRoute,
        prevRoute,
        onSelectTab,
    } = useConductorRoutes({
        initedTabs,
        pageUrl: data?.url,
        keyword,
        pageTimestamp: data?.timestamp,
        ts,
        useSectionAsMenu,
        onChangeRoute,
        menu,
        adapter: routesAdapter,
    });

    // Write-through while URL is stable so a timestamp remount can bootstrap
    // from cache. Do not key this effect on data.url — a URL change would
    // otherwise store the previous page's routes under the new URL.
    useEffect(() => {
        if (!layoutName || !data?.url || !routes?.some((route) => route.inited)) {
            return;
        }
        setCachedConductorState(layoutName, data.url, {
            routes,
            index,
        }, currentUser?.id);
    }, [layoutName, routes, index, currentUser?.id]);

    useEffect(() => {
        return () => {
            if (!data?.url || !routesRef.current?.some((route) => route.inited)) {
                return;
            }
            setCachedConductorState(layoutName, data.url, {
                routes: routesRef.current,
                index: indexRef.current,
            }, currentUser?.id);
        };
    }, [conductorCacheKey, layoutName, data?.url, currentUser?.id]);

    activeRequestUrlRef.current = activeRoute?.endpoint?.request_url ?? null;
    const currentRoute = useMemo(() => {
        return activeRoute?.inited ? activeRoute : (prevRoute ?? activeRoute);
    }, [activeRoute, prevRoute]);
    // Query key follows the selected tab only after fetchAndUpdateData inits it — not prevRoute's endpoint.
    // Full params (incl. status) so group activate/deactivate does not reuse an empty cache.
    const endpointParamsKey = useMemo(
        () => JSON.stringify(activeRoute?.inited ? (activeRoute?.endpoint?.params ?? null) : null),
        [activeRoute?.inited, activeRoute?.endpoint?.params]
    );
    const qKey = useMemo(
        () => [
            activeRoute?.inited ? activeRoute?.endpoint?.request_url : null,
            index,
            keyword,
            endpointParamsKey,
            ts,
        ],
        [activeRoute?.inited, activeRoute?.endpoint?.request_url, index, keyword, endpointParamsKey, ts]
    );
    const queryClient = useQueryClient();

    const numColumns = 1;

    // Drop cached hasNextPage=false when the selected tab changes so the first fetch is not blocked.
    useEffect(() => {
        if (!activeRoute?.inited) return;
        queryClient.removeQueries({ queryKey: qKey });
    }, [index, activeRoute?.inited, qKey, queryClient]);

    useEffect(() => {
        if (currentRoute.cached) {
            revalidateData();

        }
    }, []);

    useEffect(() => {
        if (currentRoute?.endpoint?.unit !== 'feed')
            return;

        const sub1 = subscribe('bx_timeline_0', 'added', setIsRevalidate);
        const sub2 = subscribe('bx_timeline_0', 'deleted', setIsRevalidate);

        return () => {
            sub1();
            sub2();
        };
    }, []);

    useEffect(() => {
        const subscription2 = emitter.addListener('feed', (data) => {
            if (data.action == 'remove_content') {
                setRoutes(prevRoutes => {
                    const newRoutes = [...prevRoutes];
                    newRoutes[index] = {
                        ...newRoutes[index],
                        data: newRoutes[index].data.filter(item => item.id != data.id)
                    };
                    return newRoutes;
                });
            }
            if (data.action == 'new_content' && (!currentRoute?.endpoint?.params?.owner_id || Math.abs(currentRoute?.endpoint?.params?.owner_id) == Math.abs(data?.data?.owner_id))) {
                setRoutes(prevRoutes => {
                    const newRoutes = [...prevRoutes];
                    const routeData = newRoutes[index].data;
                    const lastBlockIndex = routeData.findLastIndex(item => item.type === 'block');
                    const insertAt = lastBlockIndex + 1;
                    newRoutes[index] = {
                        ...newRoutes[index],
                        data: [
                            ...routeData.slice(0, insertAt),
                            data.data,
                            ...routeData.slice(insertAt)
                        ]
                    };
                    return newRoutes;
                });
            }
        })

        return () => {

            subscription2.remove()
        }
    }, [])

    useEffect(() => {
        if (isRevalidate)
            revalidateData();
    }, [isRevalidate]);


    // Gate fetches on the selected tab once inited — not on prevRoute while the new tab is loading.
    const bEnabled = Boolean(
        activeRoute?.inited &&
        activeRoute?.endpoint &&
        activeRoute.endpoint.request_url &&
        !activeRoute.endpoint.finished &&
        (activeRoute.endpoint.params?.start == 0 ||
            activeRoute.data.length <
            (activeRoute.endpoint.params?.per_page ?? Number.POSITIVE_INFINITY)) &&
        !isRefreshing
    );

    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: ({ pageParam }) => parseData(routesRef.current, index, setRoutes),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage?.data?.length > 0) {
                return lastPage?.endpoint;
            }

            return;
        },
        enabled: false//routes[index]?.data?.length == 0
    });

    useEffect(() => {
        // Do not check hasNextPage===false here — a premature empty page marks false and blocks the real first fetch.
        if (!bEnabled || isFetchingNextPage) return;
        fetchNextPage();
    }, [bEnabled, activeRoute?.data?.length, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        setSnackbarVisible(false);
    }, [index]);

    const showNewContent2 = async () => {
        const newRoutes = [...routes];
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = newRoutes[index].data.filter(item => item.type === 'block');;
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
        setSnackbarVisible(false);
    }

    const revalidateData = useCallback(async () => {
        const hasEndpoint = Boolean(currentRoute?.endpoint);
        let endpointUpdateContent = '';
        let bUpdateContent = false;
        const revalidatedData = JSON.parse(isRevalidate);
        if (hasEndpoint) {

            const a = [...new Set(currentRoute.data
                .filter(item => item.type !== 'block')
                .map(item => item.id)
            )].slice(0, 10).join(',');

            if ((a || true) && revalidatedData.author_id != currentUser?.id && !currentRoute.endpoint.request_url.includes("system/get_results/TemplSearchExtendedServices")) {
                endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                    'params': { ...currentRoute.endpoint.params, validate: a }
                });
                bUpdateContent = true;
            }
        }
        if (bUpdateContent) {
            const validatedData = (await fetcher(endpointUpdateContent)).data?.[0]?.data?.data;

            if (validatedData && (validatedData == 'valid' || validatedData == 'invalid')) {
                setSnackbarVisible(validatedData !== 'valid');
            }
        }
    }, [currentRoute, isRevalidate, currentUser?.id]);

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const onStartRefresh = useCallback(() => {
        const requestUrl = activeRoute?.endpoint?.request_url;
        if (requestUrl) {
            setListScrollOffset(requestUrl, 0);
        }
        setRoutes((prevRoutes) =>
            prevRoutes.map((route) => {
                if (route.index !== index) return route;
                return {
                    ...route,
                    data: (route.data || []).filter((item) => item.type === 'block'),
                    endpoint: route.endpoint
                        ? {
                            ...route.endpoint,
                            finished: false,
                            params: {
                                ...route.endpoint.params,
                                start: 0,
                            },
                        }
                        : route.endpoint,
                };
            })
        );
        setIsRefreshing(true);
        setRefreshRequested(true);
    }, [index, activeRoute?.endpoint?.request_url]);

    // CounterChecker emits when unread grows; only act if notifications list is focused.
    // Keep the badge until the user leaves the tab (tabs/navigator still clear on enter).
    useEffect(() => {
        const subscription = emitter.addListener('notifications', (payload) => {
            if (payload?.action !== 'arrived') return;
            if (!isFocusedRef.current) return;
            const unit = routesRef.current?.[indexRef.current]?.endpoint?.unit;
            if (unit !== 'notifications') return;

            consumeNotificationsConductorStale();
            onStartRefresh();
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('list', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action === 'refresh') {
                onStartRefresh();
            }
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('page', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action === 'reload') {
                onStartRefresh();
            }
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

    useEffect(() => {
        const subscription = emitter.addListener('conductor', (payload) => {
            if (!isFocusedRef.current) return;
            if (payload?.action !== 'reset_to_first') return;

            if (indexRef.current !== 0) {
                setIndex(0);
                return;
            }

            const requestUrl = activeRequestUrlRef.current;
            if (getScrollValue() > AT_TOP_SCROLL_THRESHOLD) {
                if (requestUrl) {
                    setListScrollOffset(requestUrl, 0);
                }
                if (listRef.current?.scrollToOffset) {
                    listRef.current.scrollToOffset({ offset: 0, animated: true });
                } else {
                    listRef.current?.scrollToIndex?.({ index: 0, animated: true });
                }
                return;
            }

            onStartRefresh();
        });
        return () => subscription.remove();
    }, [setIndex, onStartRefresh, getScrollValue]);

    useEffect(() => {
        if (!refreshRequested) {
            return;
        }

        let isMounted = true;
        const runRefresh = async () => {
            try {
                queryClient.removeQueries({ queryKey: qKey });
                await fetchNextPage();
            } finally {
                if (isMounted) {
                    setIsRefreshing(false);
                    setRefreshRequested(false);
                }
            }
        };

        runRefresh();
        return () => {
            isMounted = false;
        };
    }, [refreshRequested, queryClient, qKey, fetchNextPage]);


    const leftbarContent = currentRoute?.leftbar?.content ?? []
    const {
        leftbarMenuBlocks,
        leftbarFilterBlocks,
        leftbarExcludedFromMainIds,
    } = useConductorLeftbar({
        leftbarContent,
        layoutName,
    })

    // Prefer route leftbar; keep legacy string-name prop as fallback.
    const filtersSheetBlocks = useMemo(() => {
        if (leftbarFilterBlocks.length > 0) return leftbarFilterBlocks
        return Array.isArray(leftSideBarBlocks) ? leftSideBarBlocks : []
    }, [leftbarFilterBlocks, leftSideBarBlocks])

    const isShowFilters = filtersSheetBlocks.length > 0;

    const { setFilterValue, onFormChangedValues, formValuesToFilterEntries } =
        useConductorFilters({
            index,
            setRoutes,
            routesRef,
            skipFirstChange: true,
        })

    const tabBarMetaKey = useMemo(
        () =>
            routes
                .map(
                    (r) =>
                        `${r.index}:${r.title}:${r.hideInTop ?? ''}:${r.key ?? ''}:${r.item?.disabled ?? ''}:${r.hasChildren ?? ''}:${r.parentIndex ?? ''}`
                )
                .join('|'),
        [routes]
    );

    const tabBarRoutes = useMemo(
        () =>
            routes.map(({ index: routeIndex, title, hideInTop, menu_settings, addon, item, key, link, icon, hasChildren, childIndices, parentIndex, canNavigate, depth, image }) => ({
                index: routeIndex,
                title,
                hideInTop,
                menu_settings,
                addon,
                item,
                key,
                link,
                icon,
                hasChildren,
                childIndices,
                parentIndex,
                canNavigate,
                depth,
                image,
            })),
        [tabBarMetaKey]
    );

    const sceneHeader = useMemo(
        () => (
            <TabBar
                routes={tabBarRoutes}
                routesRef={routesRef}
                index={index}
                setIndex={setIndex}
                onChangeRoute={onChangeRoute}
                onSelectTab={onSelectTab}
                leftbarMenus={leftbarMenuBlocks}
            />
        ),
        [tabBarRoutes, index, setIndex, onChangeRoute, onSelectTab, leftbarMenuBlocks]
    );

    const onFormSubmit = useCallback((formData, d) => {
        setFilterValue(formValuesToFilterEntries(d), d);
        setBottomSheetData(false);
    }, [setFilterValue, formValuesToFilterEntries, setBottomSheetData]);

    const showFilters = useCallback(() => {
        const pageData = pageDataWithRestoredFormValues(
            currentRoute?.pageData ?? data,
            routesRef.current?.[index]?.endpoint?.filterFormValues
        )
        openConductorFiltersSheet(setBottomSheetData, {
            t,
            snapPoints: ['60%', '60%'],
            content: (
                <ConductorLeftbarBlocks
                    items={filtersSheetBlocks}
                    data={pageData}
                    onFormSubmit={onFormSubmit}
                    onChange={onFormChangedValues}
                    saveOnChanges
                    className="my-3 mx-2 "
                />
            ),
        });
    }, [filtersSheetBlocks, currentRoute?.pageData, data, onFormSubmit, onFormChangedValues, t, setBottomSheetData, index]);

    const filter = useMemo(
        () => (
            <ConductorFiltersButton
                visible={isShowFilters}
                onPress={showFilters}
                className="items-start ml-3 mt-2 mb-1"
            />
        ),
        [isShowFilters, showFilters]
    );

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        data?.cover_block?.profile?.module ?? currentRoute?.pageData?.cover_block?.profile?.module
    );

    const isProfileLayout = layoutName === 'profile';
    const hasDynamicCover = isProfileLayout && !isCoverDisabled && coverMode !== 'none';
    const headerMode = !isProfileLayout
        ? 'none'      // settings on weave
        : hasDynamicCover
            ? 'dynamic' // person profile
            : 'small';    // group on weave profile

    const useLocalHeader =
        headerMode === 'dynamic' ||
        (headerMode === 'small' && !appSetting('native', 'collapsible_header'));

    const coverBlock = data?.cover_block;
    // Cover chrome (context selector, actions menu) belongs to the page that owns
    // cover_block, so it must not follow the active subtab — otherwise every tab
    // switch hands the cover a new uri and re-renders it.
    const pageUri = data?.uri ?? currentRoute?.pageData?.uri;
    const pageContext = data?.context //currentRoute?.pageData?.context;

    const sceneHeaderComp = useMemo(
        () => (
            <TabSceneHeader
                headerMode={headerMode}
                coverBlock={coverBlock}
                pageUri={pageUri}
                pageContext={pageContext}
                sceneHeader={sceneHeader}
                filter={filter}
                ts={ts}
                coverScrollY={coverScrollY}
                onOverlayHeight={onOverlayHeight}
            />
        ),
        [headerMode, coverBlock, pageUri, pageContext, sceneHeader, filter, ts, coverScrollY, onOverlayHeight]
    );

    const subHeaderRef = useRef(sceneHeaderComp);
    subHeaderRef.current = sceneHeaderComp;
    const headerWriteRef = useRef(0);
    const setOwnedHeader = useCallback((value) => {
        setHeader(value);
        headerWriteRef.current = getHeaderWriteGeneration();
    }, [setHeader]);

    useFocusEffect(
        useCallback(() => {
            if (useLocalHeader) {
                setOwnedHeader({ header: false });
                setHeaderHeight(0);
            } else {
                setOwnedHeader({ subHeader: subHeaderRef.current });
            }
            const unit =
                routesRef.current?.[indexRef.current]?.endpoint?.unit;
            if (unit === 'notifications' && consumeNotificationsConductorStale()) {
                onStartRefresh();
            }
        }, [useLocalHeader, setOwnedHeader, setHeaderHeight, onStartRefresh])
    );

    // Reset chrome only on a real blur. Subtab switches remount this conductor
    // while the screen stays focused — a focus-effect cleanup would clear
    // subHeader, zero the list offset, and PageHeader would not re-measure.
    // Skip if another screen already wrote the shared header in this commit
    // (sibling useEffects run in tree order; useFocusEffect can run first).
    const wasFocusedRef = useRef(isFocused);
    useEffect(() => {
        const wasFocused = wasFocusedRef.current;
        wasFocusedRef.current = isFocused;
        if (
            wasFocused
            && !isFocused
            && !tabScopedHeader
            && headerWriteRef.current === getHeaderWriteGeneration()
        ) {
            setHeader(defaultHeader);
        }
    }, [isFocused, setHeader, tabScopedHeader]);

    const lastPushedSubHeaderRef = useRef(null);
    useEffect(() => {
        // Only the focused screen may update the shared subHeader; on refocus
        // the useFocusEffect above restores it from subHeaderRef.
        if (!useLocalHeader && isFocused) {
            if (lastPushedSubHeaderRef.current === sceneHeaderComp) return;
            lastPushedSubHeaderRef.current = sceneHeaderComp;
            setOwnedHeader({ subHeader: sceneHeaderComp });
        }
    }, [useLocalHeader, isFocused, sceneHeaderComp, setOwnedHeader]);

    const tabSceneProps = {
        skeleton: skeleton,
        numColumns: numColumns,
        onRefresh: onStartRefresh,
        refreshing: isRefreshing,
        // Selected tab only — never prevRoute (that painted feed skeletons on members).
        route: activeRoute ?? currentRoute,
        index: index,
        unitMode: unitMode,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage,
        isFetchingNextPage: isFetchingNextPage,
        skipHeaderOffset: useLocalHeader,
        listRef: listRef,
        leftbarExcludedFromMainIds,
        coverOverlayPad: headerMode === 'dynamic' ? coverOverlayPad : 0,
        coverScrollY: headerMode === 'dynamic' ? coverScrollY : undefined,
        isInited: !!activeRoute?.inited,
    };

    const Form = getComponent('element', 'form');
    const formProps = currentRoute?.endpoint?.filters;

    const FormHeader = useMemo(() => {
        if (!formProps) return undefined;
        const formUrl = currentRoute?.link || currentRoute?.pageData?.url;
        return () => (
            <View className="w-full">
                <Form
                    {...formProps}
                    key={formUrl ? `form-${formUrl}` : 'form'}
                    name={formProps.name}
                    url={formUrl}
                    onChange={onFormChangedValues}
                />
            </View>
        );
    }, [formProps, onFormChangedValues, currentRoute?.link, currentRoute?.pageData?.url]);

    if (!!formProps) {
        Object.assign(tabSceneProps, {
            ListHeaderComponent: FormHeader
        });
    }

    return (
        <View className="w-full h-full ">
            <View className="w-full flex-1 " style={headerMode === 'dynamic' ? { overflow: 'hidden' } : undefined}>
                <Snackbar visible={snackbarVisible} onPress={showNewContent2} onDismiss={() => setSnackbarVisible(false)} variant="primary" title={t('Show New Posts')} size="sm" />
                {useLocalHeader && headerMode !== 'dynamic' ? sceneHeaderComp : null}
                <TabScene {...tabSceneProps} />
                {useLocalHeader && headerMode === 'dynamic' ? sceneHeaderComp : null}
            </View>
        </View>
    );
}