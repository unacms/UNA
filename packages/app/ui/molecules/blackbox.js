import React, { useCallback, useState, useEffect } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { TabView, useHeaderTabContext, SceneComponent } from "showtime-tab-view";
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Row, Pressable  } from 'app/design/view';
import { FlashList } from "@shopify/flash-list";
import { Theme } from 'app/design/theme';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { appSetting, processMenu, getURI } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import Loading from 'app/ui/atoms/loading'

export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks }) {

    const initedTabs = processMenu(menu.object, menu.items).map((item, index) => {
        const i = { key: item.link, title: item.title, index };
        if (getURI(item.link) === data.uri) {
            contentAndEndpoint = processUrl(data, blocks);
            i.data = contentAndEndpoint.content;
            i.inited = true;
            i.link = item.link;
            i.endpoint = contentAndEndpoint.endpoint;
        } else {
            i.link = item.link;
            i.inited = false;
            i.data = [];
        }
      
        return i;
    });

    const [routes, setRoutes] = useState(initedTabs);
    const scroll = useSharedValue(1);
    const navigation = useNavigation();
    const { colors } = Theme();
    const startAnimationFrom = 200;

    const [index, setIndex] = useState(routes[0].index);
    const animationHeaderPosition = useSharedValue(0);
    const animationHeaderHeight = useSharedValue(0);
    const indicatorOffset = useSharedValue(0);

    const handleEndReached = useCallback(async () => {
        const currentRoute = routes.find((item) => item.index === index);

        if (currentRoute && currentRoute.endpoint && !currentRoute.endpoint.finished) {
            const params = { ...currentRoute.endpoint.params, start: parseInt(currentRoute.endpoint.params.start) + parseInt(currentRoute.endpoint.params.per_page) };
            const sRequest = currentRoute.endpoint.request_url + JSON.stringify({ params });

            const sResponse = await fetcher(sRequest);
            const newData = sResponse.data[0].data.data;
            const finished = newData.length === 0;
            let isFinished = (currentRoute.endpoint.finished !== finished)
            let endpoint = currentRoute.endpoint
            endpoint.finished = finished;
            endpoint.params = params;

            if (newData.length > 0 || isFinished) {
                addMoreData(newData, endpoint);
            }
        }
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
                contentContainerStyle={{ paddingTop: scrollViewPaddingTop }}
                ref={ref}
                onScroll={handleLayout}
                onEndReachedThreshold={0.5}
                onEndReached={handleEndReached}
            />
        );
    });

    useEffect(() => {
        async function fetchAndUpdateData() {
            const currentRoute = routes.find((item) => item.index === index);
            if (!currentRoute.inited){
                const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + currentRoute.link);
                let settings = appSetting('layouts', getURI(currentRoute.link))
                contentAndEndpoint = processUrl(sResponse.data, settings.blocks); 
                addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint)

            }
        }
        fetchAndUpdateData();
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
                    renderItem={({ item, index }) => {
                        if (item?.type === 'block') {
                            return <View key={`${route.index}-${item.id}`}><BlockByName2 b={item.data} name={item.block} /></View>
                        } else {
                            return <View key={`${route.index}-${item.id}`}><Unit unit={route?.endpoint?.unit} data={item} mode={appSetting('feed', 'default_view')} /></View>
                        }
                    }}
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

        if (props.navigationState.routes.length > 1)
            return (
                <View className="pb-2" style={{ backgroundColor: colors.barsBackground }}>
                    <Row  >
                        {props.navigationState.routes.map((a) => (
                            <Pressable className="flex-1 items-center justify-center py-4 "
                                key={`tab-${a.index}`}
                                onPress={() => {
                                    setIndex(a.index)
                                }}
                            >
                                <Text className="font-bold text-base" style={{color: (props.navigationState.index === a.index ? colors.primary : colors.default)}}>{a.title}</Text>
                            </Pressable>
                        ))}
                        <Animated.View className="absolute bottom-0 left-0 h-1 flex items-center justify-center " style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1" style={{borderRadius: 2, height: 3, backgroundColor: colors.primary, maxWidth:150}}></View></Animated.View>
                    </Row>
                </View>

    )};

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

        if (!header)
            return <></>

        return (
            <View className='w-full h-80'>
                <Animated.View style={[{ width: '100%', position: 'absolute' }, animatedStyleA]}>
                    {header}
                </Animated.View>
                <Animated.View style={[{ width: '100%', position: 'absolute', bottom: 0 }, animatedStyleB]}>
                    {smallHeader}
                </Animated.View>
            </View>
        );
    }, [scroll]);

    const addMoreData = (newItems, endpoint) => {
        setRoutes((prevRoutes) => {
            const updatedRoutes = prevRoutes.map((route) => {
                if (route.index === index) {
                    route.endpoint = endpoint;
                    route.inited =true
                    return {
                        ...route,
                        data: route.data.concat(newItems),
                    };
                }
                return route;
            });
            return updatedRoutes;
        });
    };

    function getContent(data, block) {
        const blockName = block.name;
        const b = Object.values(data?.elements)
          .flatMap(Object.values)
          .find(element => element.content && element.source === blockName);
      
        return b?.content[0]?.type === 'browse'
          ? { data: b.content[0].data, type: 'browse' }
          : { data: b, type: 'block', block: block };
    }

    function processUrl(data, blocks) {
        const contentAndEndpoint = Object.values(blocks).reduce(
            (acc, block) => {
                const b = getContent(data, block);
                if (b.type === 'browse') {
                    acc.endpoint = {
                        ...acc.endpoint,
                        params: b.data.params,
                        request_url: b.data.request_url,
                        finished: false,
                        unit: b.data.unit,
                    };
                    acc.content = [...acc.content, ...b.data.data];
                } else {
                    acc.content.push({ ...b, id: `block-${b.data.id}`, type: 'block' });
                }
    
                return acc;
            },
            { content: [], endpoint: null }
        );
        return contentAndEndpoint;
    }

    return (
        <SafeAreaView edges={['top','left', 'right']} style={{
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