import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "@showtime-xyz/tab-view";
import { View, ScrollView, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { appSetting, deepEqual, getUnitModeBySource, handleFeedLayoutData } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/conductor-helpers';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useLayoutData } from 'app/context/layout';
import { Theme } from 'app/design/theme';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import Toaster from 'app/ui/atoms/toaster';
import { callFn } from 'app/lib/functions/call';

export function Conductor({ header, smallHeader, minHeaderHeight, isHideDefaultHeader, menu, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword }) {
    minHeaderHeight = minHeaderHeight || 100;
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';

    const { currentUser } = useCurrentUser();
    const { layoutData } = useLayoutData();
    const { t } = useTranslation();

    const initedTabs = useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const toasterRef2 = useRef();

    useEffect(() => {
        if (!deepEqual(menu, menuState)) {
            setMenuState(menu);
            setRoutes(initedTabs);
        }
    }, [menu, menuState, initedTabs, setRoutes]);


    const setRoutes = /*useCallback(*/(a) => {
        setRoutes1(a);
    }/*, []);*/

    const scroll = useSharedValue(1);
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

    const [index, setIndex] = useState(initialIndex);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);
    const headerMaxHeight = useSharedValue(100);

    const currentRoute = useMemo(() => routes.find((item) => item.index === index), [routes, index]);;
    const qKey = [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)];
    const queryClient = useQueryClient();

    useEffect(() => {
        if (currentRoute.cached){
            revalidateData();

        }
        if (currentRoute?.endpoint?.unit == 'feed'){
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
        enabled: false
    });

    useEffect(() => {
        if (bEnabled){
            //parseData(routes, index, setRoutes)
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
        // uniRef.current.scrollToIndex({ animated: true, index: -1 });

    }

    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
    }

    const revalidateData =  useCallback(async () => {
        const hasEndpoint = Boolean(currentRoute?.endpoint);
        let endpointUpdateContent = '';
        let bUpdateContent = false;
        const revalidatedData = JSON.parse(isRevalidate);
        if (hasEndpoint) {
    
            const a = [...new Set(currentRoute.data
                .filter(item => item.type !== 'block')
                .map(item => item.id)
            )].slice(0, 10).join(',');

            if ((a || true) && revalidatedData.author_id != currentUser?.id &&  !currentRoute.endpoint.request_url.includes("system/get_results/TemplSearchExtendedServices")) {
                endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                    'params': { ...currentRoute.endpoint.params, validate: a }
                });
                bUpdateContent = true;
            }
        }
        if (bUpdateContent){
            const validatedData = (await fetcher(endpointUpdateContent)).data?.[0]?.data?.data;

            if (validatedData && (validatedData == 'valid' || validatedData == 'invalid')) {
                setToaster2Visible(validatedData !== 'valid');
            }
        }
    }, [currentRoute, isRevalidate, currentUser?.id]);

    const handleEndReached = async (lastItemIndex) => {
       
       /*if (isFetchingNextPage || isRefreshing)
            return;
        if (currentRoute?.endpoint?.finished)
            return;

        fetchNextPage();*/
        if (!currentRoute?.endpoint)
            return;

        if (currentRoute?.endpoint?.params?.start == 0)
            return;

        if (isRefreshing)
            return;
        if (currentRoute?.endpoint?.finished)
            return;
        console.log('++++++++++++++++++++++++++++++++++++', handleEndReached)
        fetchNextPage();
        // parseData(routes, index, setRoutes)
    };

   

    /*if (isHideDefaultHeader) {
        setTimeout(() => {
            navigation.setOptions({ headerShown: false });
        }, 300);
    }*/

    const handleLayout = (event) => {
        scroll.value = event.nativeEvent.contentOffset.y > 200 ? 0 : 1;
    };

    const TabFlashListScrollView = React.forwardRef((props, ref) => (
        <SceneComponent
            {...props}
            useExternalScrollView
            forwardedRef={ref}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            ContainerView={Animated.ScrollView}
        />
    ));

    const TabFlashList = React.forwardRef((props, ref) => {
        const { scrollViewPaddingTop } = useHeaderTabContext();
        return (
            <UniList
                {...props}
                renderScrollComponent={TabFlashListScrollView}
                contentContainerStyle={{ paddingTop: scrollViewPaddingTop + 4, paddingBottom: 20 }}
                refer={ref}

                onScroll={handleLayout}
                onEndReached={handleEndReached}
            />
        );
    });

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const onStartRefresh = async () => {
        const newRoutes = [...routes];
        //TODO CHECK WHY INITEDD TABS  IS RELOADING EVERY TIME
        let k = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);
        newRoutes[index] = k[index];
        setRoutes(newRoutes);
        setIsRefreshing(true);

    };


    useEffect(() => {
        if (isRefreshing) {
            queryClient.removeQueries(qKey);
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    /* NEW POST TO FEED */
    useEffect(() => {
        if (currentRoute.endpoint?.unit === 'feed' && layoutData && layoutData.data && (layoutData?.type == 'feed:new_content' || layoutData?.type == 'feed:remove_content')) {
            let clonedData = currentRoute.data
            const data = handleFeedLayoutData(layoutData, clonedData)
            const newRoutes = [...routes];
            newRoutes[index].data = data
            setRoutes(newRoutes);
        }
        callFn("updateRouteDataForConnections", [currentRoute, layoutData, routes, index, setRoutes])
    }, [layoutData]);
    /* NEW POST TO FEED */

    const TabScene = useCallback(({ route, index }) => {
        const cache = useRef({});
        const Preload = getSkeletonForList(skeleton != '' ? skeleton : (data.module ? data.module : data.unit), 1);
        if (!route.inited) {
            //Preload
            return <></>
        }
        const unitType = getUnitModeBySource(route?.endpoint);

        const renderCachedItem = ({ item, index }) => {
            const cacheKey = item.id || index; // Use id or index as the cache key
    
            // Check if the item is already cached
            if (!cache.current[cacheKey]) {
                // If not cached, render the item and store it in the cache
                cache.current[cacheKey] = (
                    <ItemRenderer
                        unitType={unitType}
                        unitMode={unitMode}
                        route={route}
                        item={item}
                        unit={route?.endpoint?.unit}
                        module={route?.endpoint?.module}
                    />
                );
            }
           
            return cache.current[cacheKey];
        };

        console.log("route?.endpoint?.finished", route?.endpoint?.finished, route.data.length)

        return (
            <TabFlashList
                index={route.index}
                data={route.data}
                route={route}
                unit={route.endpoint?.unit}
                //renderItem={({ item, index }) => renderCachedItem({ item, index })}
                renderItem={({ item, index }) => <ItemRenderer unitType={unitType} unitMode={unitMode} route={route} item={{ ...item, feed_type: route?.endpoint?.params?.type }} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />}
                //<View className="w-full h-24 bg-red-500 my-2"></View>}
                getItemType={(item) => {
                    return item.type;
                }}
                ListFooterComponent={
                    (route?.endpoint?.request_url ? ((route?.endpoint?.finished) ? (route.data.length == 0 ? callFn("noContentByUrl", [route?.endpoint]) : null) : Preload) : null)
                }
            />
        )
    }, [skeleton, data, unitMode]);

    const renderScene = useCallback(({ route }) => <><Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" /><TabScene route={route} index={route.index} /></>, [unitMode]);
    const { colors } = Theme();

    const renderTabBar = (props) => {

        const tabWidth = props.layout.width / props.navigationState.routes.length;
        indicatorOffset.value = withTiming(props.navigationState.index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        /* const indicatorStyle = useAnimatedStyle(() => {
             return {
                 transform: [{ translateX: indicatorOffset.value }],
             };
         }, [indicatorOffset]);
 */
        /* const styles = StyleSheet.create({
             indicator: {
                 width: tabWidth
             },
         });
 */
        if (props.navigationState.routes.length > 1) {

            /*const menuSettings = appSetting('menu_items', menu.object);
            setTimeout(() => {

                if (!isHideDefaultHeader){
                    let addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
                    addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);
                    updateCenterHeader('/'+data.url, data.name, false, navigation, addButtonsSet);
                }
            }, 300);*/
            /* gap-x-2*/
            return (
                <ScrollView horizontal={true} style={{ backgroundColor: colors.barsBackground }} className=" border-b border-bdr dark:border-bdr-d min-w-full">
                    <Row className="px-1.5 " >
                        {props.navigationState.routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                            const counter = appSetting('conductor', 'show_nav_counters') ? 0 : a.addon ? (a.addon.text ? a.addon.text : a.addon) : 0;
                            const counter2 = counter > 0 ? ' (' + counter + ')' : ''
                            const btn = callFn("getButtonForConductorNative", [a, props.navigationState.index, currentUser, setIndex, onChangeRoute])

                            return (
                                <Pressable className="items-center py-2 px-1 justify-center"
                                    key={`tab-${a.index}`}
                                >
                                    {btn}
                                </Pressable>
                            )
                        })}

                    </Row>
                </ScrollView>
                /*  <Animated.View className="absolute bottom-0 left-0 h-1 flex items-center justify-center " style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1" style={{borderRadius: 2, height: 2.5, backgroundColor: colors.primary, maxWidth:120}}></View></Animated.View>*/
            )
        }
    };

    const renderHeader = useCallback(() => {
        const animatedStyleA = useAnimatedStyle(() => {
            return {
                opacity: withTiming(scroll.value, { duration: 500 }),
            };
        }, [scroll]);


        const animatedStyleB = useAnimatedStyle(() => {
            return {
                opacity: withTiming(1 - scroll.value, { duration: 500 }),
                zIndex: (1 - scroll.value)*500
            };
        }, [scroll]);

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: headerMaxHeight.value,
                zIndex: (scroll.value)*500
            };
        }, [headerMaxHeight]);

        const handleHeaderMaxLayout = useCallback((event) => {
            headerMaxHeight.value = event.nativeEvent.layout.height;
        });

        if (!header)
            return <></>
        return (
            <Animated.View className='w-full h-80' style={parentAnimatedStyle}>
                <Animated.View style={[{ width: '100%', position: 'absolute' }, animatedStyleA]}>
                    <View onLayout={handleHeaderMaxLayout}>
                        {header}
                    </View>
                </Animated.View>
                <Animated.View style={[{ width: '100%', position: 'absolute', bottom: 0 }, animatedStyleB]}>
                    {smallHeader}
                </Animated.View>
            </Animated.View>
        );
    }, [scroll, headerMaxHeight, header, smallHeader]);

    //console.log("********************************************************RELOAD**********", currentRoute?.endpoint?.params?.start, isRefreshing, currentRoute.data.length)
   
   /* 
       const routerExpo = useRouter();
 const glob = useGlobalSearchParams();
    <Button title="xx" onPress={() => {
        routerExpo.replace( {
            pathname: '/' + glob.name,
            params: { url: '/' + routes[index].link }
          })}}>
        </Button>*/
    return (

        <>
         <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            lazy
            renderScrollHeader={renderHeader}
            minHeaderHeight={minHeaderHeight}
            animationHeaderPosition={animationHeaderPosition}
            animationHeaderHeight={animationHeaderHeight}
            renderTabBar={renderTabBar}
            onStartRefresh={onStartRefresh}
            isRefreshing={isRefreshing}
            enableGestureRunOnJS={false}
        /></>
    );
}