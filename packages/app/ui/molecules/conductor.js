import React, { useCallback, useState, useEffect } from "react";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "@showtime-xyz/tab-view";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Row, Pressable  } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { appSetting, deepEqual, getUnitModeBySource } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/conductor-helpers';
import { updateRightHeaderObj } from 'app/lib/native-handlers';
import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/skeleton-helpers';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import Search from 'app/ui/molecules/search';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user'

export function Conductor({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks, useSectionAsMenu=false, unitMode='', skeleton='', onChangeRoute, keyword }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { t } = useTranslation();
    const initedTabs = fillTabs(menu, data, blocks, useSectionAsMenu);

    const [routes, setRoutes] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    if (!deepEqual(menu,menuState)){
        setMenuState(menu)
        setRoutes(initedTabs);
    }
        
    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const [ index, setIndex ] = useState(routes.findIndex(function(item) {
        if (useSectionAsMenu)
            return data.url == item.key;
        else
            return ('/'+data.url).includes('/'+item.key);
    }));
   // const [index, setIndex] = useState(routes[0].index);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);
    const headerMaxHeight = useSharedValue(100);

    const {
        status,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery([routes[index]?.endpoint?.request_url, index], 
        ({ pageParam }) => parseData(routes, index, setRoutes),
        {
            getNextPageParam: lastPage => {
                if (lastPage?.data?.length == 0)
                    return;
                return lastPage?.endpoint;
            },
    });

    const handleEndReached = useCallback(async () => {
       
        if (isFetchingNextPage) 
            return;
        fetchNextPage();
    }, [routes, index, isFetchingNextPage, status]);

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
        forwardedRef = {ref}
        ContainerView = {Animated.ScrollView}
        />
    ));

    const TabFlashList = React.forwardRef((props, ref) => {
        const { scrollViewPaddingTop } = useHeaderTabContext();
        return (
            <UniList
                {...props}
                renderScrollComponent = {TabFlashListScrollView}
                contentContainerStyle = {{ paddingTop: scrollViewPaddingTop + 4, paddingBottom:20 }}
                refer = {ref}
                onScroll = {handleLayout}
                onEndReached = {handleEndReached}
            />
        );
    });

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);


    const TabScene = ({ route, index }) => {
      
        const Preload = getSkeleton(skeleton != '' ? skeleton : (data.module? data.module : data.unit));
        if (!route.inited){
            return Preload
        }

        const unitType = getUnitModeBySource(route?.endpoint?.request_url);
        if (route.inited)
            return (
                <TabFlashList
                    index={route.index}
                    data={route.data}
                    unit={route.endpoint?.unit}
                    renderItem={({ item, index }) => <ItemRenderer unitType={unitType} unitMode={unitMode} route={route}  item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module}/>}
                    ListFooterComponent={
                        (route.data.length > 0 && route?.endpoint?.finished === false) ? (
                            Preload
                        ) : null
                    }
                />
    )};

    const renderScene = useCallback(({ route }) => <TabScene route={route} index={route.index} />, [unitMode]);

    const renderTabBar = (props) => {
      
        const tabWidth = props.layout.width/props.navigationState.routes.length;
        indicatorOffset.value = withTiming(props.navigationState.index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        },[indicatorOffset]);

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth
            },
        });

        if (props.navigationState.routes.length > 1){

            const menuSettings = appSetting('menu_items', menu.object);
            setTimeout(() => {
                const addButtons = menuSettings?.add?.map((button) => {
                    if(currentUser || (!currentUser && button.nonlogged != false)){
                        let btn = undefined;
                        if(button.section)
                            btn = <Search section={button.section} params={{trigger: {size: 'sm'}}} />
                        else {
                            btn = <Button title={button.title} variant='text' startDecorator={button.icon} size="sm" />;
                            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
                        }

                        return (
                            <View className="w-8"  key={`add-${button.icon}`} >{btn}</View>
                        )
                    }
                });
                updateRightHeaderObj(addButtons, navigation);
                //updateRightHeader(menuSettings?.add, navigation);
            }, 300);

            return (
                <ScrollView  horizontal={true} className="bg-white dark:bg-neutral-900  min-w-full">
                    <Row className="pl-4 gap-x-4" >
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
                                }} fullWidth={false} variant={props.navigationState.index === a.index  ? 'primary': "text"} rounded size='sm' title={t(a.title)} />
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
        },[scroll]);


        const animatedStyleB = useAnimatedStyle(() => {
            return {
                opacity: withTiming(1 - scroll.value, { duration: 500 }),
            };
        },[scroll]);

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: headerMaxHeight.value,
            };
        },[headerMaxHeight]);

        const handleHeaderMaxLayout = useCallback((event) => {
            headerMaxHeight.value = event.nativeEvent.layout.height;
        });

        if (!header)
            return <></>
        return (
            <Animated.View className='w-full h-80' style={parentAnimatedStyle}>
                <Animated.View style={[{ width: '100%', position: 'absolute', zIndex:500 }, animatedStyleA]}>
                <View onLayout={handleHeaderMaxLayout}>
                    {header}
                </View>
                </Animated.View>
                <Animated.View style={[{ width: '100%', position: 'absolute', bottom:0 }, animatedStyleB]}>
                    {smallHeader}
                </Animated.View>
            </Animated.View>
        );
    }, [scroll, headerMaxHeight]);

    let edges = ['left', 'right'];

    return (
        <SafeAreaView edges={edges} style={{
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '100%'
            }}>
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
            />
        </SafeAreaView>
    );
}