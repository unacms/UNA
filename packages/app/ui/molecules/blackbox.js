import React, { useCallback, useState, useEffect, useRef } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "showtime-tab-view";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Row, Pressable  } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Theme } from 'app/design/theme';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { appSetting, deepEqual } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/blackbox-helpers';
import { updateRightHeader } from 'app/lib/native-handlers';
import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/hooks/skeleton';
import { Button } from 'app/design/controls';

export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks, useSectionAsMenu=false }) {

    const initedTabs = fillTabs(menu, data, blocks, useSectionAsMenu);

    const [routes, setRoutes] = useState(initedTabs);
    const [menuState, setMenuState] = useState(menu);
    if (!deepEqual(menu,menuState)){
        setMenuState(menu)
        setRoutes(initedTabs);
    }
        
    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const { colors } = Theme();

    const [index, setIndex] = useState(routes[0].index);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);
    const headerMaxHeight = useSharedValue(100);

    const isLoading = useRef(false);

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
        console.log('================')
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
                contentContainerStyle={{ paddingTop: scrollViewPaddingTop, paddingBottom:20 }}
                refer ={ref}
                onScroll={handleLayout}
                onEndReached={handleEndReached}
            />
        );
    });

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);


    const TabScene = ({ route,index }) => {
        const Preload = getSkeleton(data.module? data.module : data.unit);
        if (!route.inited){
            return Preload
        }

        if (route.inited)
            return (
                <TabFlashList
                    index={route.index}
                    data={route.data}
                    unit={route.endpoint?.unit}
                    renderItem={({ item, index }) => <ItemRenderer route={route}  item={item} unit={route?.endpoint?.unit} module={data.module ? data.module : ''}/>}
                    ListFooterComponent={
                        (route.data.length > 0 && route?.endpoint?.finished === false) ? (
                            Preload
                        ) : null
                    }
                />
    )};

    const renderScene = useCallback(({ route }) => <TabScene route={route} index={route.index} />, []);

    const renderTabBar = (props) => {
      
        const tabWidth = props.layout.width/props.navigationState.routes.length;
        indicatorOffset.value = withTiming(props.navigationState.index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        });

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth
            },
        });

        if (props.navigationState.routes.length > 1){

            const menuSettings = appSetting('menu_items', menu.object);
            setTimeout(() => {
                updateRightHeader(menuSettings?.add, navigation);
            }, 300);

            return (
                <ScrollView  horizontal={true} className="bg-backgroundnavbar dark:bg-backgroundnavbar-dark min-w-full">
                    <Row className="pl-4 gap-x-1" >
                        {props.navigationState.routes.map((a) => (
                            <Pressable className="items-center justify-center py-2.5  border-b border-bordercolornavbar dark:border-bordercolornavbar-dark"
                                key={`tab-${a.index}`}
                            >
                            <View > 
                                <Button onPress={() => {
                                   setIndex(a.index)
                                }} fullWidth={false} id="tab" rounded variant={props.navigationState.index === a.index  ? 'outline': "text"}  size='sm' title={a.title} />
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
        });


        const animatedStyleB = useAnimatedStyle(() => {
            return {
                opacity: withTiming(1 - scroll.value, { duration: 500 }),
            };
        });

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: headerMaxHeight.value,
            };
        });

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