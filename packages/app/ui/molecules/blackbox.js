import React, { useCallback, useState, useEffect, useRef } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "showtime-tab-view";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Row, Pressable  } from 'app/design/view';
import { FlashList } from "@shopify/flash-list";
import { Theme } from 'app/design/theme';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { appSetting } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/blackbox-helpers';
import Loading from 'app/ui/atoms/loading'
import { updateRightHeader } from 'app/lib/native-handlers';

export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks }) {

    const initedTabs = fillTabs(menu, data, blocks);

    const [routes, setRoutes] = useState(initedTabs);
    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const { colors } = Theme();

    const [index, setIndex] = useState(routes[0].index);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);
    const headerMaxHeight = useSharedValue(100);

    const isLoading = useRef(false);

    const handleEndReached = useCallback(async () => {
        if (isLoading.current) 
            return;
        isLoading.current = true;

        parseData(routes, index, setRoutes);
        
        isLoading.current = false;
    }, [routes, index]);

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
            <FlashList
                {...props}
                renderScrollComponent={TabFlashListScrollView}
                contentContainerStyle={{ paddingTop: scrollViewPaddingTop, paddingBottom:20 }}
                ref={ref}
                onScroll={handleLayout}
                onEndReachedThreshold={0.5}
                onEndReached={handleEndReached}
            />
        );
    });

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);


    const TabScene = ({ route }) => {
        if (!route.inited){
            return <View className='m-2 pt-80'><Loading/></View>
        }
        if (route.inited)
            return (
                <TabFlashList
                    index={route.index}
                    data={route.data}
                    estimatedItemSize={60}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => <ItemRenderer route={route}  item={item} unit={route?.endpoint?.unit} module={data.module ? data.module : ''}/>}
                    ListFooterComponent={
                        (route?.endpoint?.finished === false) ? (
                            <View className='m-2'><Loading/></View>
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
                updateRightHeader(menuSettings.add, navigation);
            }, 300);

            return (
                <View className="">
                    <Row  >
                        {props.navigationState.routes.map((a) => (
                            <Pressable className="flex-1 bg-backgroundnavbar dark:bg-backgroundnavbar-dark items-center justify-center py-2.5 border-b border-bordercolornavbar dark:border-bordercolornavbar-dark"
                                key={`tab-${a.index}`}
                                onPress={() => {
                                    setIndex(a.index)
                                }}
                            >
                                <Text className="font-semibold text-base" style={{color: (props.navigationState.index === a.index ? colors.activeTabText : colors.tabText)}}>{a.title}</Text>
                            </Pressable>
                        ))}
                        <Animated.View className="absolute bottom-0 left-0 h-1 flex items-center justify-center " style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1" style={{borderRadius: 2, height: 2.5, backgroundColor: colors.primary, maxWidth:120}}></View></Animated.View>
                    </Row>
                </View>
        

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