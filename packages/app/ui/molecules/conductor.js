import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { View, ScrollView, Row } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { deepEqual, getUnitModeBySource } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, getAddon } from 'app/lib/conductor-helpers';
import { ItemRenderer } from 'app/components/item-renderer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { Button } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user'
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import Snackbar from 'app/ui/atoms/snackbar';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { BlockByName } from 'app/components/block';
import Cover, { CoverSmall } from 'app/components/elements/cover';
import emitter from 'app/context/emitter'
import { useSetHeader, useScrollValue, defaultHeader } from 'app/context/jotai/layout';
import { getComponent } from 'app/components/registry';
import { useFocusEffect } from 'app/lib/hooks/router'
import { appSetting } from 'app/lib/util'
import {
    getCachedConductorState,
    setCachedConductorState,
    setListScrollOffset,
} from 'app/lib/tab-page-cache';
import {
    getSkeletonByEndPoint,
    layoutForList,
    paddingForList
} from 'app/customization/functions'

// Scroll offset at which the full cover finishes crossfading into the small cover.
const COVER_SWITCH_THRESHOLD = 500;
// Matches the web crossfade/collapse duration in conductor.web.js.
const COVER_SWITCH_DURATION = 300;

/**
 * Native counterpart to the web cover crossfade: blends the full cover into the
 * small cover and animates the container height so the tabs/filter below glide
 * up instead of jumping. `progress` is the ground-truth state (0 = full, 1 =
 * small); height and opacities are derived from it.
 */
const DynamicCoverHeader = React.memo(function DynamicCoverHeader({
    coverHeader,
    coverHeaderSmall,
    sceneHeader,
    filter,
}) {
    const scrollValue = useScrollValue();
    const showSmall = scrollValue > COVER_SWITCH_THRESHOLD;

    const [fullHeight, setFullHeight] = useState(0);
    const [smallHeight, setSmallHeight] = useState(0);
    const measured = fullHeight > 0 && smallHeight > 0;

    const progress = useSharedValue(showSmall ? 1 : 0);

    useEffect(() => {
        progress.set(withTiming(showSmall ? 1 : 0, { duration: COVER_SWITCH_DURATION }));
    }, [showSmall, progress]);

    const containerStyle = useAnimatedStyle(() => {
        if (!measured) return {};
        return { height: interpolate(progress.get(), [0, 1], [fullHeight, smallHeight]) };
    }, [measured, fullHeight, smallHeight]);

    const fullStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
    const smallStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));

    const onFullLayout = useCallback((e) => {
        setFullHeight(e.nativeEvent.layout.height);
    }, []);
    const onSmallLayout = useCallback((e) => {
        setSmallHeight(e.nativeEvent.layout.height);
    }, []);

    return (
        <View className="w-full">
            <Animated.View style={[{ width: '100%', overflow: 'hidden' }, containerStyle]}>
                <Animated.View
                    style={[measured ? { position: 'absolute', top: 0, left: 0, right: 0 } : { width: '100%' }, fullStyle]}
                    pointerEvents={showSmall ? 'none' : 'auto'}
                    onLayout={onFullLayout}
                >
                    {coverHeader}
                </Animated.View>
                <Animated.View
                    style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, smallStyle]}
                    pointerEvents={showSmall ? 'auto' : 'none'}
                    onLayout={onSmallLayout}
                >
                    {coverHeaderSmall}
                </Animated.View>
            </Animated.View>
            {sceneHeader}
            {filter}
        </View>
    );
});

const TabSceneHeader = React.memo(function TabSceneHeader2({
    headerMode,
    coverBlock,
    pageUri,
    pageContext,
    sceneHeader,
    filter,
}) {
    const coverHeader = useMemo(
        () => (
            <Cover
                data={coverBlock}
                showMoreMenu={false}
                uri={pageUri}
                context={pageContext}
            />
        ),
        [coverBlock, pageUri, pageContext]
    );
    const coverHeaderSmall = useMemo(
        () => (
            <CoverSmall showMoreMenu context={pageContext} data={coverBlock} />
        ),
        [coverBlock, pageContext]
    );
    if (headerMode === 'dynamic') {
        return (
            <DynamicCoverHeader
                coverHeader={coverHeader}
                coverHeaderSmall={coverHeaderSmall}
                sceneHeader={sceneHeader}
                filter={filter}
            />
        );
    }
    if (headerMode === 'small') {
        return (
            <View className="w-full">
                {coverHeader}
                {sceneHeader}
                {filter}
            </View>
        );
    }
    if (headerMode === 'none') {
        return (
            <View className="w-full">
                {sceneHeader}
                {filter}
            </View>
        );
    }
    return null;
});

const TabBar = React.memo(({ routes, index, setIndex, onChangeRoute }) => {
    const MenuItemSubmenu = getComponent('menu-item', 'submenu');
    if (routes.length > 1) {
        return (

            <ScrollView horizontal={true} className=" bg-card ">
                <Row className="px-3 gap-2 h-14 justify-center" >
                    {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {


                        return (
                            <View className={` items-center justify-center ${a?.menu_settings?.class || ''}`}
                                key={`tab-${a.index}`}
                            >
                                <MenuItemSubmenu
                                    title={a.title}
                                    pressed={a.index == index}
                                    disabled={a?.item?.disabled}
                                    addon={getAddon(a.addon)}
                                    onPress={() => {
                                        setIndex(a.index)

                                        if (onChangeRoute) {
                                            onChangeRoute(a)
                                        }
                                    }}
                                    item={a}
                                />
                            </View>
                        )
                    })}
                </Row>
            </ScrollView>

        )
    }
});


const AddBlocks = React.memo(({
    leftSideBarBlocks, data, onFormSubmit
}) => {
    if (!leftSideBarBlocks)
        return null;

    let leftSideBarBlocksObj = leftSideBarBlocks.map((block) => {
        return <BlockByName
            key={block}
            data={data}
            name={block}
            onFormSubmit={onFormSubmit}
            saveOnChanges={true}
        />
    });

    return <>
        {(leftSideBarBlocksObj?.length > 0) &&
            <View className="my-3 mx-2 ">
                {leftSideBarBlocksObj.map((block, index) => {
                    return <View key={"lb-" + index}>{block}</View>
                })}
            </View>
        }
    </>
});

const TabScene = React.memo(({
    route,
    hasNextPage,
    isFetchingNextPage,
    skeleton,
    ListHeaderComponent,
    unitMode,
    fetchNextPage,
    onRefresh,
    refreshing,
    numColumns
}) => {

    const handleEndReached = useCallback(

        async (lastItemIndex) => {

            if (isFetchingNextPage) return
            if (hasNextPage === false) return
            if (lastItemIndex === false) return
            fetchNextPage()
        },
        [refreshing, isFetchingNextPage, hasNextPage]
    )

    const renderItem = useCallback(({ item, index }) => (
        <ItemRenderer
            unitType={unitType}
            unitMode={unitMode}
            route={route}
            item={item}
            unit={route?.endpoint?.unit}
            module={route?.endpoint?.module}
        />
    ), [unitType, unitMode, route]);

    const SkeletonForRoute = useMemo(() => {
        const a = getSkeletonByEndPoint(route)
        if (a) return a
        const baseSkeleton =
            skeleton ||
            route?.endpoint?.module ||
            route?.endpoint?.unit
        return unitType ? [baseSkeleton, unitType] : baseSkeleton
    }, [skeleton, route, unitType])

    const unitType = useMemo(() => {
        return getUnitModeBySource(route?.endpoint);
    }, [route?.endpoint?.request_url]); // Dependency on route.endpoint.request_url



    const layout = layoutForList(route?.endpoint);
    const paddings = paddingForList(route?.endpoint);

    const Preload = useMemo(
        () => getSkeletonForList(SkeletonForRoute, 1, true, layout, renderItem, paddings),
        [SkeletonForRoute, renderItem]
    )

    //
    const NoContent = getComponent('molecule', 'no_content')

    const feedType = route?.endpoint?.params?.type;

    const routeData = useMemo(() => {
        const base = route?.endpoint
            ? route.data
            : [...(route.data || []), ...(route.sidebar?.content || [])];
        if (!feedType || !base) return base;
        return base.map(item =>
            item.feed_type === feedType ? item : { ...item, feed_type: feedType }
        );
    }, [route?.endpoint, route?.data, route?.sidebar?.content, feedType]);

    return (
        <UniList
            ListHeaderComponent={typeof ListHeaderComponent === 'function' ? ListHeaderComponent : ListHeaderComponent ? () => ListHeaderComponent : undefined}
            index={route.index}
            data={routeData}
            route={route}
            unit={route.endpoint?.unit}
            renderItem={renderItem}
            ListFooterComponent={
                (route?.endpoint?.request_url ? (route?.endpoint?.finished ? (route.data.length == 0 ? <NoContent endpoint={route?.endpoint} /> : <></>) : Preload) : <></>)
            }
            maxToRenderPerBatch={5}
            initialNumToRender={5}
            numColumns={numColumns}
            mode="simple"
            url={route?.endpoint?.request_url}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReached={handleEndReached}
        />
    )
});

export function Conductor({ isCoverDisabled, header, isHideDefaultHeader, leftSideBarBlocks, menu, layoutName, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword }) {
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';
    const isFormInitialized = useRef(false);
    const routesRef = useRef(null);
    const { currentUser } = useCurrentUser();


    const { setBottomSheetData } = useBottomSheetData();
    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const conductorCacheKey = `${layoutName}:${data?.url ?? ''}`;
    const cachedConductor = getCachedConductorState(layoutName, data?.url);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(cachedConductor?.routes ?? initedTabs);
    const [menuState, setMenuState] = useState(menu);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [refreshRequested, setRefreshRequested] = useState(false);



    const setHeader = useSetHeader();



    useEffect(() => {
        if (!deepEqual(menu, menuState)) {
            setMenuState(menu);
            setRoutes(initedTabs);
        }
    }, [menu, menuState, initedTabs, setRoutes, data]);

    const setRoutes = /*useCallback(*/(a) => {
        setRoutes1(a);
    }/*, []);*/

    routesRef.current = routes;

    const initialIndex = useMemo(() => {
        if (typeof cachedConductor?.index === 'number') {
            return cachedConductor.index;
        }
        const idx = routes.findIndex(item => {
            if (useSectionAsMenu) {
                return data.url === item.key;
            } else {
                return `/${data.url}`.includes(`/${item.key}`);
            }
        });
        return idx === -1 ? 0 : idx; // Default to 0 if no matching route is found
    }, [routes, data.url, useSectionAsMenu]);

    const [index, _setIndex] = useState(initialIndex);
    const [prevIndex, setPrevIndex] = useState(initialIndex);
    const indexRef = useRef(initialIndex);

    useEffect(() => {
        indexRef.current = index;
    }, [index]);

    // Persist list state only on unmount — avoid read/write cycle with useState cache bootstrap.
    useEffect(() => {
        return () => {
            if (!data?.url || !routesRef.current?.some((route) => route.inited)) {
                return;
            }
            setCachedConductorState(layoutName, data.url, {
                routes: routesRef.current,
                index: indexRef.current,
            });
        };
    }, [conductorCacheKey, layoutName, data?.url]);

    const setIndex = (newIndex) => {
        setPrevIndex(index);
        _setIndex(newIndex);
    };


    /*const currentRoute = useMemo(() => routes.find((item) => item.index === index), [routes, index]);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    */
    const prevRoute = useMemo(
        () => routes.find((item) => item.index === prevIndex),
        [routes, prevIndex]
    );
    // Selected tab route (may still be loading — fetch logic must not use the fallback below).
    const activeRoute = useMemo(
        () => routes.find((item) => item.index === index),
        [routes, index]
    );
    const currentRoute = useMemo(() => {
        return activeRoute?.inited ? activeRoute : (prevRoute ?? activeRoute);
    }, [activeRoute, prevRoute]);
    // Query key follows the selected tab only after fetchAndUpdateData inits it — not prevRoute's endpoint.
    const qKey = useMemo(
        () => [
            activeRoute?.inited ? activeRoute?.endpoint?.request_url : null,
            index,
            keyword,
            JSON.stringify(activeRoute?.inited ? activeRoute?.endpoint?.params?.filters : undefined),
        ],
        [activeRoute, index, keyword]
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
        isFormInitialized.current = false;
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

    useEffect(() => {
        const subscription = emitter.addListener('list', (payload) => {
            if (payload?.action === 'refresh') {
                onStartRefresh();
            }
        });
        return () => subscription.remove();
    }, [onStartRefresh]);

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


    const isShowFilters = layoutName == 'navigator' && leftSideBarBlocks && leftSideBarBlocks?.length > 0;

    const sceneHeader = useMemo(
        () => <TabBar routes={routes} index={index} setIndex={setIndex} onChangeRoute={onChangeRoute} />,
        [routes, index, setIndex, onChangeRoute]
    );

    const setFilterValue = useCallback((values) => {
        setRoutes(prevRoutes => {
            const newRoutes = [...prevRoutes];
            if (!newRoutes[index]?.endpoint?.params) return prevRoutes;

            const filters = {};
            values.forEach(v => { filters[v.name] = v.value; });

            newRoutes[index] = {
                ...newRoutes[index],
                data: [],
                endpoint: {
                    ...newRoutes[index].endpoint,
                    finished: false,
                    params: {
                        ...newRoutes[index].endpoint.params,
                        filters,
                        start: 0,
                    },
                },
            };
            return newRoutes;
        });
    }, [index])

    const onFormSubmit = useCallback((formData, d) => {
        let filterValues = [];
        for (let key in d) {
            filterValues.push({ name: key, value: Array.isArray(d[key]) ? d[key].join(',') : d[key] })
        };
        setFilterValue(filterValues);
        setBottomSheetData(false);
    });

    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: <AddBlocks leftSideBarBlocks={leftSideBarBlocks} data={data} onFormSubmit={onFormSubmit} />, showClose: true, snapPoints: ['60%', '60%'] });
    }, [leftSideBarBlocks, data, onFormSubmit, layoutName]);

    const filter = useMemo(
        () =>
            isShowFilters ? (
                <View className="items-start ml-3 mt-2 mb-1">
                    <Button title="Filters" variant="default" size="sm" rounded onPress={showFilters} />
                </View>
            ) : null,
        [isShowFilters, showFilters]
    );

    const coverMode = appSetting(
        'cover',
        'view_by_module',
        currentRoute?.pageData?.cover_block?.profile?.module
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
    const pageUri = currentRoute?.pageData?.uri;
    const pageContext = currentRoute?.pageData?.context;

    const sceneHeaderComp = useMemo(
        () => (
            <TabSceneHeader
                headerMode={headerMode}
                coverBlock={coverBlock}
                pageUri={pageUri}
                pageContext={pageContext}
                sceneHeader={sceneHeader}
                filter={filter}
            />
        ),
        [headerMode, coverBlock, pageUri, pageContext, sceneHeader, filter]
    );
    useFocusEffect(
        useCallback(() => {
            if (useLocalHeader) {
                setHeader({ header: false });
            }
            else {
                setHeader({ subHeader: sceneHeaderComp });
            }
        }, [sceneHeaderComp, useLocalHeader, setHeader])
    );

    const tabSceneProps = {
        skeleton: skeleton,
        numColumns: numColumns,
        onRefresh: onStartRefresh,
        refreshing: isRefreshing,
        route: currentRoute,
        index: index,
        unitMode: unitMode,
        fetchNextPage: fetchNextPage,
        hasNextPage: hasNextPage,
        isFetchingNextPage: isFetchingNextPage
    };

    const onFormChangedValues = useCallback((values) => {
        if (!isFormInitialized.current) {
            isFormInitialized.current = true;
            return;
        }

        let filterValues = []
        for (let key in values) {
            filterValues.push({
                name: key,
                value: Array.isArray(values[key])
                    ? values[key].join(',')
                    : values[key],
            })
        }

        const currentFilters = routesRef.current?.[index]?.endpoint?.params?.filters
        const newFilters = {}
        filterValues.forEach(f => { newFilters[f.name] = f.value })
        if (JSON.stringify(currentFilters) !== JSON.stringify(newFilters)) {
            setFilterValue(filterValues)
        }
    }, [index])

    const Form = getComponent('element', 'form');
    const formProps = currentRoute?.endpoint?.filters;

    const FormHeader = useMemo(() => {
        if (!formProps) return undefined;
        return () => (
            <View className="w-full">
                <Form {...formProps} key="form" name={formProps.name} onChange={onFormChangedValues} />
            </View>
        );
    }, [formProps, onFormChangedValues]);

    if (!!formProps) {
        Object.assign(tabSceneProps, {
            ListHeaderComponent: FormHeader
        });
    }

    return (
        <View className="w-full h-full ">
            <View className="w-full flex-1 ">
                <Snackbar visible={snackbarVisible} onPress={showNewContent2} onDismiss={() => setSnackbarVisible(false)} variant="primary" title="Show New Posts" size="sm" />
                {useLocalHeader && sceneHeaderComp}
                <TabScene {...tabSceneProps} />
            </View>
        </View>
    );
}