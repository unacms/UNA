import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { View, ScrollView, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { deepEqual, getUnitModeBySource, handleFeedLayoutData } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, getNumCols } from 'app/lib/conductor-helpers';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { useWindowDimensions } from 'react-native';
import { Button } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user'
import { useLayoutData } from 'app/context/layout';
import { Theme } from 'app/design/theme';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import Toaster from 'app/ui/atoms/toaster';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { BlockByName } from 'app/components/block';
import { callFn } from 'app/lib/functions/call';

const TabBar = React.memo(({ routes, index, setIndex, onChangeRoute, currentUser }) => {
    if (routes.length > 1) {
        return (
            <View className="w-full">
                <ScrollView horizontal={true}  className="  ">
                    <Row className="px-1.5  justify-center" >
                        {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                            const btn =  callFn("getButtonForConductorNative", [a, index, currentUser, setIndex, onChangeRoute]);
                            return (
                                <View className="py-2 px-1 items-center justify-center"
                                    key={`tab-${a.index}`}
                                >
                                    {btn}
                                </View>
                            )
                        })}

                    </Row>
                </ScrollView>
            </View>
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
    prevRoute,
    header,
    headerHeight,
    unitType,
    Preload,
    unitMode,
    fetchNextPage,
    onRefresh,
    refreshing,
    numColumns
}) => {

    const handleEndReached = useCallback(() => {
        if (!route?.endpoint || route?.endpoint?.params?.start === 0 || refreshing || route?.endpoint?.finished)
            return;
        fetchNextPage();
    }, [route?.endpoint, route?.endpoint?.params?.start, route?.endpoint?.finished, fetchNextPage, refreshing]);

    const renderItem = useCallback(({ item, index }) => (
        <ItemRenderer
            unitType={unitType}
            unitMode={unitMode}
            route={route}
            item={{ ...item, feed_type: route?.endpoint?.params?.type }}
            unit={route?.endpoint?.unit}
            module={route?.endpoint?.module}
        />
    ), [unitType, unitMode, route]);

    /*if (!route.inited) {
        return <></>;
    }*/
    return (
        <UniList
            scrollProps={
                {
                    pageData: route.inited ? route.pageData : prevRoute.pageData, 
                    subHeaderComponent: header, 
                    headerHeight: headerHeight, 
                    isBackButton: false,
                    isMenuNameAsTitle: true
                }
            }
            index={route.index}
            data={route.data}
            route={route}
            unit={route.endpoint?.unit}
            renderItem={renderItem}
            ListFooterComponent={
                (route?.endpoint?.request_url ? (route?.endpoint?.finished ? (route.data.length == 0 ?  callFn("noContentByUrl", [route?.endpoint]) : <></>) : Preload) : <></>)
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

export function ConductorFlat({ header, defaultHeaderHeight=116, smallHeader, minHeaderHeight, isHideDefaultHeader, leftSideBarBlocks, menu, layoutName, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword }) {

    minHeaderHeight = minHeaderHeight || 100;
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';

    const { currentUser } = useCurrentUser();
    const { layoutData, setLayoutData } = useLayoutData();
    const { setBottomSheetData } = useBottomSheetData();
    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const toasterRef2 = useRef();
    const windowDimen = useWindowDimensions();
    const windowWidth = windowDimen.width;
   

    useEffect(() => {
        if (!deepEqual(menu, menuState)) {
            setMenuState(menu);
            setRoutes(initedTabs);
        }
    }, [menu, menuState, initedTabs, setRoutes, data]);

    /*useEffect(() => {
        setRoutes(initedTabs);
    }, [data]);*/


    const setRoutes = /*useCallback(*/(a) => {
        setRoutes1(a);
    }/*, []);*/

    const initialIndex = useMemo(() => {
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
    console.log("indexindex", index, prevIndex)
    const setIndex = (newIndex) => {
        setPrevIndex(index);
        _setIndex(newIndex);
      };
      

    const currentRoute = useMemo(() => routes.find((item) => item.index === index), [routes, index]);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    const qKey = useMemo(() => [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)], [currentRoute, index, keyword]);
    const queryClient = useQueryClient();

    const numColumns = getNumCols(windowWidth, currentRoute, null);

    useEffect(() => {
        if (currentRoute.cached) {
            revalidateData();

        }
        if (currentRoute?.endpoint?.unit == 'feed') {
            subscribe('bx_timeline_0', 'added', setIsRevalidate);
            subscribe('bx_timeline_0', 'deleted', setIsRevalidate);
        }
    }, []);

    useEffect(() => {
        if (isRevalidate)
            revalidateData();
    }, [isRevalidate]);

    const bEnabled = currentRoute?.endpoint?.params?.start == 0 && !isRefreshing;

    const {
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: ({ pageParam }) => parseData(routes, index, setRoutes),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage?.data?.length > 0) {
                return lastPage?.endpoint;
            }

            return;
        },
        enabled: false//routes[index]?.data?.length == 0
    });

    useEffect(() => {
        if (bEnabled) {
            fetchNextPage();
        }
    }, [bEnabled]);

    useEffect(() => {
        setToaster2Visible(false);
    }, [index]);

    const showNewContent2 = async () => {
        const newRoutes = [...routes];
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = newRoutes[index].data.filter(item => item.type === 'block');;
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
        setToaster2Visible(false);
    }

    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
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
                setToaster2Visible(validatedData !== 'valid');
            }
        }
    }, [currentRoute, isRevalidate, currentUser?.id]);

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const onStartRefresh = useCallback(async () => {
        setRoutes(prevRoutes => {
            const updatedRoutes = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);;
            return [...prevRoutes.slice(0, index), updatedRoutes[index], ...prevRoutes.slice(index + 1)];
        });
        setIsRefreshing(true);
    }, [initedTabs, index]);

    useEffect(() => {
        if (isRefreshing) {
            queryClient.removeQueries(qKey);
            setIsRefreshing(false);
        }
    }, [isRefreshing, queryClient, qKey]);

    /* NEW POST TO FEED */
    useEffect(() => {
        if (currentRoute.endpoint?.unit === 'feed' && layoutData && layoutData.data && (layoutData?.type == 'feed:new_content' || layoutData?.type == 'feed:remove_content')) {
            let clonedData = currentRoute.data
            const data = handleFeedLayoutData(layoutData, clonedData)
            // Create a new route object by spreading the existing one and updating data
            const updatedRoute = { ...routes[index], data };

            // Create a new routes array with the updated route
            const newRoutes = [...routes];
            newRoutes[index] = updatedRoute;
            setRoutes(newRoutes);
            setLayoutData(null)
        }
        callFn("updateRouteDataForConnections", [currentRoute, layoutData, routes, index, setRoutes])
    }, [layoutData]);
    /* NEW POST TO FEED */

    const Preload = useMemo(() => {
        return getSkeletonForList(skeleton !== '' ? skeleton : (data.module ? data.module : data.unit), numColumns);
    }, [skeleton, data.module, data.unit]);

    const unitType = useMemo(() => {
        return getUnitModeBySource(currentRoute?.endpoint);
    }, [currentRoute?.endpoint?.request_url]); // Dependency on route.endpoint.request_url

    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: <AddBlocks leftSideBarBlocks={leftSideBarBlocks} data={data} onFormSubmit={onFormSubmit} />, showClose: true, snapPoints: ['60%', '60%'] });
    }, [leftSideBarBlocks, data, onFormSubmit, layoutName]);

    const setFilterValue = (values) => {

        const newRoutes = [...routes];
        values.forEach(function (value) {
            const name = value.name;
            const val = value.value;
            if (newRoutes[index].endpoint.params.filters) {
                newRoutes[index].endpoint.params.filters[name] = val;
            }
            else {
                newRoutes[index].endpoint.params.filters = { [name]: val };
            }
        })
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = [];
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
    }

    const onFormSubmit = useCallback((formData, d) => {
        let filterValues = [];
        for (let key in d) {
            filterValues.push({ name: key, value: Array.isArray(d[key]) ? d[key].join(',') : d[key] })
        };
        setFilterValue(filterValues);
        setBottomSheetData(false);
    });

    const isShowFilters = layoutName == 'navigator' && leftSideBarBlocks && leftSideBarBlocks?.length > 0;
    const sceneHeader =  <TabBar routes={routes} index={index} setIndex={setIndex} onChangeRoute={onChangeRoute} currentUser={currentUser} />
    const filter =  (isShowFilters) && (<View className="items-start ml-3 mt-2 mb-1">
        <Button title='Filters' variant="default" size="sm" rounded onPress={showFilters} />
    </View>)
    const h =<>{sceneHeader}{filter}</>
    return (
        <View className="w-full flex-1">
            <View className="w-full flex-1 ">
                <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
                <TabScene headerHeight={isShowFilters? 150: defaultHeaderHeight} header={h} prevRoute={prevRoute} numColumns={numColumns} onRefresh={onStartRefresh} refreshing={isRefreshing} route={currentRoute} Preload={Preload} unitType={unitType} unitMode={unitMode} fetchNextPage={fetchNextPage} />
            </View>
        </View>
    );
}