import React, { useCallback, useState, useEffect, useContext } from "react";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "@showtime-xyz/tab-view";
import { View, ScrollView, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { useNavigation } from '@react-navigation/native';
import { appSetting, deepEqual, getUnitModeBySource, handleFeedLayoutData } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/conductor-helpers';
import { updateRightHeader } from 'app/lib/native-handlers';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { Button } from 'app/design/controls';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'
import { useRouter } from 'expo-router';
import { LayoutData } from 'app/context/layout';

export function Conductor({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks, useSectionAsMenu = false, unitMode = '', skeleton = '', onChangeRoute, keyword }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { layoutData, setLayoutData } = useContext(LayoutData);
    const { t } = useTranslation();
    const routerExpo = useRouter();
    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [routes, setRoutes1] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    if (!deepEqual(menu, menuState)) {
        setMenuState(menu)
        setRoutes(initedTabs);
    }

    const setRoutes = (a) => {
        setRoutes1(a);
    };

    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const [index, setIndex] = useState(routes.findIndex(function (item) {
        if (useSectionAsMenu)
            return data.url == item.key;
        else
            return ('/' + data.url).includes('/' + item.key);
    }));
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);
    const headerMaxHeight = useSharedValue(100);

    const currentRoute = routes.find((item) => item.index === index);
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


    if (isHideDefaultHeader) {
        setTimeout(() => {
            navigation.setOptions({ headerShown: false });
        }, 300);
    }

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
            routerExpo.replace(routes[index].link);
            queryClient.removeQueries(qKey);
        }
    }, [isRefreshing]);

    /* NEW POST TO FEED */
    useEffect(() => {
        const data = handleFeedLayoutData(layoutData, routes[index].data, routes[index].endpoint?.unit )
        const newRoutes = [...routes];
        newRoutes[index].data = data
        setRoutes(newRoutes);

    }, [layoutData]);
    /* NEW POST TO FEED */

    const onStartRefresh = async () => {
        setIsRefreshing(true);
        setIsRefreshing(false);
    };

    const TabScene = ({ route, index }) => {
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
                renderItem={({ item, index }) => <ItemRenderer unitType={unitType} unitMode={unitMode} route={route} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />}
                ListFooterComponent={
                    (route?.endpoint?.finished) ? null : Preload
                }
            />
        )
    };

    const renderScene = useCallback(({ route }) => <TabScene route={route} index={route.index} />, [unitMode]);

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

            const menuSettings = appSetting('menu_items', menu.object);
            setTimeout(() => {
                //TODO FIX
                //updateRightHeaderObj(addButtons, navigation);
                updateRightHeader(currentUser?menuSettings?.add:null, navigation, );
            }, 300);
            /* gap-x-2*/
            return (
                <ScrollView horizontal={true} className="bg-white dark:bg-neutral-900  min-w-full">
                    <Row className="pl-4 gap-x-2 " >
                        {props.navigationState.routes.filter((aItem) => aItem.hideInTop != true).map((a) => (
                            <Pressable className="items-center justify-center py-2.5"
                                key={`tab-${a.index}`}
                            >
                                <View >
                                    <Button onPress={() => {
                                        setIndex(a.index)
                                        if (onChangeRoute) {
                                            onChangeRoute(a);
                                        }
                                    }} fullWidth={false} variant={props.navigationState.index === a.index ? 'primary' : "text"} rounded size='sm' title={t(a.title)} />
                                </View>
                            </Pressable>
                        ))}

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
            
            isRefreshing={isRefreshing}
            enableGestureRunOnJS={false}
        />
    );
}