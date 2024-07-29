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
import { md5 } from 'app/lib/util'

export function Conductor({ header, smallHeader, minHeaderHeight, isHideDefaultHeader, menu, data, blocks, useSectionAsMenu, unitMode, skeleton, onChangeRoute, keyword }) {
    minHeaderHeight = minHeaderHeight || 100; 
    const renderedItemsRef = useRef(new Map());
    isHideDefaultHeader = isHideDefaultHeader || false;
    useSectionAsMenu = useSectionAsMenu || false;
    skeleton = skeleton || '';
    unitMode = unitMode || '';

    const { currentUser } = useCurrentUser();
    const { layoutData } = useLayoutData();
    const { t } = useTranslation();
    const routerExpo = useRouter();
    const initedTabs =  useMemo(() => fillTabs(menu, data, blocks, currentUser, useSectionAsMenu), [menu, data, blocks, currentUser, useSectionAsMenu]);;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    
    useEffect(() => {
        if (!deepEqual(menu, menuState)) {
            setMenuState(menu);
            setRoutes(initedTabs);
        }
    }, [menu, menuState, initedTabs, setRoutes]);


    const setRoutes = useCallback((a) => {
        setRoutes1(a);
    }, []);

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

    const currentRoute =  useMemo(() => routes.find((item) => item.index === index), [routes, index]);;
    const qKey = [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)];
    const queryClient = useQueryClient();

    const {
        status: rqtStatus,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,

    } = useInfiniteQuery({
        queryKey: qKey,
        queryFn: ({ pageParam }) => parseData(routes, index, setRoutes),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage?.data?.length > 0) {
                return lastPage?.endpoint;
            }

            return;
        },
        enabled: currentRoute?.endpoint?.params?.start == 0 && !isRefreshing//routes[index]?.data?.length == 0
    });

    const handleEndReached = async (lastItemIndex) => {
        if (isFetchingNextPage || isRefreshing)
            return;
        if (currentRoute?.endpoint?.finished)
            return;

        fetchNextPage();
    };

    const glob = useGlobalSearchParams();

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

    useEffect(() => {
        if (isRefreshing) {
            routerExpo.replace( {
                pathname: '/' + glob.name,
                params: { url: '/' + routes[index].link }
              });
              
            queryClient.removeQueries(qKey);
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
    }, [layoutData]);
    /* NEW POST TO FEED */

    const onStartRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setIsRefreshing(false);
    }, []);

    const handleItemRender = useCallback((item, index, unitType, unitMode, route) => {
       const key = `${item.id}-${index}`;
        // Check if item is already cached
        if (renderedItemsRef.current.has(key)) {
            console.log("keypres--", key)
            return renderedItemsRef.current.get(key);
        }
        
        // Render new item and cache it
        const renderedItem =  <ItemRenderer unitType={unitType} unitMode={unitMode} route={route} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />
       // renderedItemsRef.current.set(key, renderedItem);
        return renderedItem;
    }, []);

    const TabScene =  useCallback(({ route, index }) => {
        const Preload = getSkeletonForList(skeleton != '' ? skeleton : (data.module ? data.module : data.unit), 1);
        if (!route.inited) {
            //Preload
            return <></>
        }
        const unitType = getUnitModeBySource(route?.endpoint?.request_url);

        return (
            <TabFlashList
                index={route.index}
                data={route.data}
                route={route}
                unit={route.endpoint?.unit}
                //renderItem={({ item, index }) => handleItemRender(item, index, unitType, unitMode, route)}
                //renderItem={({ item, index }) => <ItemRenderer unitType={unitType} unitMode={unitMode} route={route} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />
                renderItem={({ item, index }) => <ItemRenderer unitType={unitType} unitMode={unitMode} route={route} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />}
               //<View className="w-full h-24 bg-red-500 my-2"></View>}
               getItemType={(item) => {
                return item.type;
              }}
                ListFooterComponent={
                    (route?.endpoint?.request_url ? ( route?.endpoint?.finished ? null : Preload) : <></>)
                }
            />
        )
    }, [skeleton, data, unitMode]);

    const renderScene = useCallback(({ route }) => <TabScene route={route} index={route.index} />, [unitMode]);
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
                <ScrollView horizontal={true}  style={{ backgroundColor: colors.barsBackground }} className=" border-b border-bdr dark:border-bdr-d min-w-full">
                    <Row className="px-1.5 " >
                        {props.navigationState.routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                            const counter = appSetting('layout', 'show_nav_counters') ? 0 : a.addon ? (a.addon.text ? a.addon.text : a.addon) : 0;
                            const counter2 = counter >0 ? ' ('+counter+')' :''
                            return (
                            <Pressable className="items-center py-2 px-1 justify-center"
                                key={`tab-${a.index}`}
                            >
                                
                                    <Button onPress={() => {
                                        setIndex(a.index)
                                        if (onChangeRoute) {
                                            onChangeRoute(a);
                                        }
                                    }} fullWidth={false} variant={props.navigationState.index === a.index ? 'primary' : "text"} rounded size='sm' title={t(a.title)+counter2} />
                                
                            </Pressable>
                        )})}

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
            };
        }, [scroll]);

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: headerMaxHeight.value,
            };
        }, [headerMaxHeight]);

        const handleHeaderMaxLayout = useCallback((event) => {
            headerMaxHeight.value = event.nativeEvent.layout.height;
        });

        if (!header)
            return <></>
        return (
            <Animated.View className='w-full h-80' style={parentAnimatedStyle}>
                <Animated.View style={[{ width: '100%', position: 'absolute', zIndex: 500 }, animatedStyleA]}>
                    <View onLayout={handleHeaderMaxLayout}>
                        {header}
                    </View>
                </Animated.View>
                <Animated.View style={[{ width: '100%', position: 'absolute', bottom: 0 }, animatedStyleB]}>
                    {smallHeader}
                </Animated.View>
            </Animated.View>
        );
    }, [scroll, headerMaxHeight]);

    return (

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
        />
    );
}