import React, { useCallback, useState, useEffect, useMemo, useLayoutEffect } from "react";
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
import { useSetHeader, useScrollValue } from 'app/context/jotai/layout';
import { getComponent } from 'app/components/registry';
import { useFocusEffect }  from 'app/lib/hooks/router'

const TabBar = React.memo(({ routes, index, setIndex, onChangeRoute }) => {
    const MenuItemSubmenu = getComponent('menu-item', 'submenu');
    if (routes.length > 1) {
        return (

            <ScrollView horizontal={true} className=" bg-card ">
                <Row className="pl-2 justify-center" >
                    {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {


                        return (
                            <View className="p-1 items-center justify-center"
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
    ListHeaderComponent,
    isProfileHeader,
    unitType,
    Preload,
    unitMode,
    fetchNextPage,
    onRefresh,
    refreshing,
    smallHeader,
    numColumns
}) => {


    const handleEndReached = useCallback(
        async (lastItemIndex) => {
            if (!route?.endpoint || route?.endpoint?.params?.start === 0 || refreshing || route?.endpoint?.finished)
                return;
            fetchNextPage()
        },
        [route?.endpoint, route?.endpoint?.params?.start, route?.endpoint?.finished, fetchNextPage, refreshing]
    )

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

    const scrollValue = useScrollValue();
    const NoContent = getComponent('molecule', 'no_content')

    return (
        <>
            {(isProfileHeader && scrollValue > 500) && smallHeader}

            <UniList
                ListHeaderComponent={typeof ListHeaderComponent === 'function' ? ListHeaderComponent : ListHeaderComponent ? () => ListHeaderComponent : undefined}

                index={route.index}
                data={route.data}
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
            /></>

    )
});

export function Conductor({ isCoverDisabled, ts, header, defaultHeaderHeight = 88, smallHeader, minHeaderHeight, isHideDefaultHeader, leftSideBarBlocks, menu, layoutName, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword }) {

    console.log("1111",111)
    minHeaderHeight = minHeaderHeight || 100;
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';

    const { currentUser } = useCurrentUser();

    const { setBottomSheetData } = useBottomSheetData();
    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    const setHeader = useSetHeader();



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

    const setIndex = (newIndex) => {
        setPrevIndex(index);
        _setIndex(newIndex);
    };


    const currentRoute = useMemo(() => routes.find((item) => item.index === index), [routes, index]);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    const qKey = useMemo(() => [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)], [currentRoute, index, keyword]);
    const queryClient = useQueryClient();

    const numColumns = 1;

    useEffect(() => {
        if (currentRoute.cached) {
            revalidateData();

        }
    }, []);

    useEffect(() => {
        if (!currentRoute?.endpoint?.unit == 'feed')
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
            if (data.action == 'remove_content' || data.action == 'new_content') {
                //todo
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


    const bEnabled = (currentRoute?.endpoint?.params?.start == 0 || currentRoute.data.length < currentRoute?.endpoint?.params?.per_page) && !isRefreshing;

    const {
        fetchNextPage,
        hasNextPage
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
    }, [bEnabled, currentRoute.data.length]);

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

    const isUseCurrentHeader = layoutName === 'profile';
    /* useLayoutEffect(() => {
         setHeader({subHeader: sceneHeader});
     }, [index, sceneHeader, setHeader]);
     */

     const isShowFilters = layoutName == 'navigator' && leftSideBarBlocks && leftSideBarBlocks?.length > 0;
     
     const sceneHeader = useMemo(
        () => <TabBar routes={routes} index={index} setIndex={setIndex} onChangeRoute={onChangeRoute} />,
        [routes, index, setIndex, onChangeRoute]
    );

     const filter = (isShowFilters) && (<View className="items-start ml-3 mt-2 mb-1">
         <Button title='Filters' variant="default" size="sm" rounded onPress={showFilters} />
     </View>)

   /* useEffect(() => {
        
    }, [header,sceneHeader, setHeader]);
*/

    useFocusEffect(
        useCallback(() => {
            console.log('Screen focused!');
            if (isUseCurrentHeader) {
                setHeader({ header: false });
            }
            else {
                setHeader({ subHeader: sceneHeader });
            }
           
        }, [header, isUseCurrentHeader, sceneHeader, setHeader])
    );


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

   

    const isProfileHeader = layoutName === 'profile' && !isCoverDisabled;

    const smallSceneHeader = <View className="w-full">
        <CoverSmall showMoreMenu={true} context={currentRoute?.pageData?.context} data={currentRoute.pageData?.cover_block} />
        {sceneHeader}
        {filter}
    </View>

    const tabSceneProps = {
        numColumns: numColumns,
        onRefresh: onStartRefresh,
        refreshing: isRefreshing,
        route: currentRoute,
        index:index,    
        Preload: Preload,
        unitType: unitType,
        unitMode: unitMode,
        fetchNextPage: fetchNextPage,
        isProfileHeader: isProfileHeader,
        smallHeader: smallSceneHeader
    };

    const CoverHeader = useMemo(() => {

        return <Cover data={currentRoute.pageData?.cover_block} showMoreMenu={false} uri={currentRoute.pageData?.uri} context={currentRoute?.pageData?.context} />
    }, [currentRoute.pageData]);



    if (isProfileHeader) {
        if (currentRoute?.pageData) {// may be need to fix
            Object.assign(tabSceneProps, {

                ListHeaderComponent: () => <>
                    {CoverHeader}
                    {sceneHeader}
                    {filter}
                </>
            });
        } else {
            if (prevRoute) {
                Object.assign(tabSceneProps, {

                    ListHeaderComponent: () => <>
                        <Cover data={prevRoute.pageData?.cover_block} showMoreMenu={false} uri={prevRoute.pageData?.uri} context={prevRoute?.pageData?.context} />
                        {sceneHeader}
                        {filter}
                    </>
                });
            }
        }
    }

    return (
        <View className="w-full h-full ">
            <View className="w-full flex-1 ">
                <Snackbar visible={snackbarVisible} onPress={showNewContent2} onDismiss={() => setSnackbarVisible(false)} variant="primary" title="Show New Posts" size="sm" />
                <TabScene {...tabSceneProps} />
            </View>
        </View>
    );
}