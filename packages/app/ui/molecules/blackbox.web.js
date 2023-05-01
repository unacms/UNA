import React, { useCallback, useState, useEffect, useRef  } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
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
import { ScrollView } from "dripsy";


export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks }) {

    const initedTabs = processMenu(menu.object, menu.items).map((item, index) => {
        const i = { key: item.link, title: item.title, index };
        if (getURI(item.link) === data.uri) {
            let contentAndEndpoint = processUrl(data, blocks);
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

    const windowWidth = useWindowDimensions().width;

    const getNumCols = (width) => {
        if (Object.keys(blocks).length == 1){
            return width > 600 ? 3 : 1
        }
        return 1
    };

    const [routes, setRoutes] = useState(initedTabs);
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth));
    const [offsetTop, setOffsetTop] = useState(550);
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
        //todo delay
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

    const handleLayout = (event) => {
        console.log(event.nativeEvent.layoutMeasurement.height)
        if (event.nativeEvent.contentOffset.y > 200)
            scroll.value = 0;
            if (event.nativeEvent.contentOffset.y <10)
                scroll.value = 1;

        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const isEndReached = contentOffset.y + layoutMeasurement.height >= contentSize.height;
    
        if (isEndReached) {
            handleEndReached();
        }
       // scroll.value = event.nativeEvent.contentOffset.y > 200 ? 0 : 1;
    };

    useEffect(() => {
        async function fetchAndUpdateData() {
            const currentRoute = routes.find((item) => item.index === index);
            if (!currentRoute.inited){
                const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + currentRoute.link);
                let settings = appSetting('layouts', getURI(currentRoute.link))
                let contentAndEndpoint = processUrl(sResponse.data, settings.blocks); 
                addMoreData(contentAndEndpoint.content, contentAndEndpoint.endpoint)

            }
        }
        fetchAndUpdateData();
    }, [index]);

    const scrollY = useSharedValue(0);


    const CustomScrollComponent = React.forwardRef((props, ref) => {
       
      
        return (
          <Animated.ScrollView
            {...props}
            ref={ref}
            scrollEventThrottle={16}

          />
        );
      });

    const RenderScene = useCallback(({ route }) => <TabScene route={route} index={index} />, []);  

    const TabFlashList = React.forwardRef((props, ref) => {

        return (
            <FlashList
                {...props}
                renderScrollComponent={CustomScrollComponent}
                ref={ref}
                onScroll={handleLayout}
                onEndReachedThreshold={0.5}
                onEndReached={handleEndReached}
            />
        );
    });

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
                    numColumns={numColumns}
                    keyExtractor={item => item.id}
                    renderItem={({ item, index }) => {
                        if (item?.type === 'block') {
                            return <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : 'w-full'}><BlockByName2 b={item.data} name={item.block} /></View>
                        } else {
                            return <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : 'w-full'}><Unit unit={route?.endpoint?.unit} data={item} mode={appSetting('feed', 'default_view')} /></View>
                        }
                    }}
                    ListFooterComponent={
                        (route?.endpoint?.finished === false) ? (
                            <View className='m-2'><Loading/></View>
                        ) : null
                    }
                />
    )};

    const renderTabBar = (props) => {
      
        const tabWidth = 200;
        indicatorOffset.value = withTiming(index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        });

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth,
                height:4,
                bottom:0,
                position:'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                display:'flex'
            },
        });

        if (routes.length > 1)
            return (
                <View className="w-full" style={{ backgroundColor: colors.barsBackground}} >
                <View  className={ appSetting('layout', 'max_width')+ ' mx-auto w-full'}>
                    <Row className="items-start" >
                        {routes.map((a) => (
                            <Pressable style={{width:tabWidth}} className=" py-4 items-center"
                                key={`tab-${a.index}`}
                                onPress={() => {
                                    setIndex(a.index)
                                }}
                            >
                                <Text className="font-bold text-base" style={{color: (index === a.index ? colors.primary : colors.default)}}>{a.title}</Text>
                            </Pressable>
                        ))}
                        <Animated.View style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1" style={{borderRadius: 2, height: 3, backgroundColor: colors.primary, maxWidth:150}}></View></Animated.View>
                    </Row>
                </View>
                </View>

    )};

    const renderHeader =  useCallback(() => {

        const d = 200;
        const animatedStyleA = useAnimatedStyle(() => {
            return {
                opacity: withTiming(scroll.value, { duration: d }),
                height: withTiming(369 * scroll.value, { duration: d }),
            };
        });


        const animatedStyleB = useAnimatedStyle(() => {
            return {
                opacity: withTiming(1 - scroll.value, { duration: d }),
                height: withTiming(65 * (1 - scroll.value), { duration: d }),
            };
        });

        const tabBarObj = renderTabBar();

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: withTiming(scroll.value == 1 ? 369 : 65, { duration: d }),
            };
        });

        if (!header)
            return <><View className="w-full h-12"></View><View className="fixed w-full z-50" >{tabBarObj}</View></>

        return (
            <>
                <Animated.View className="w-full" style={parentAnimatedStyle}></Animated.View>
                <View className="fixed w-full z-50" >
                    <Animated.View className="w-full" style={parentAnimatedStyle}>
                        <Animated.View style={[{ width: '100%', position: 'absolute',  }, animatedStyleA]}>
                            {header}
                        </Animated.View>
                        <Animated.View style={[{ width: '100%', position: 'absolute', }, animatedStyleB]}>
                            {smallHeader}
                        </Animated.View>
                    </Animated.View>
                    {tabBarObj}
                </View>
            </>
        );
    }, [scroll, index]);

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

    const currentRoute = routes.find((item) => item.index === index);


    const headerObj = renderHeader();

    const handleLayoutTop = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        const containerHeight = event.nativeEvent.layout.height;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    const windowHeight = useWindowDimensions().height;
    const offset = header ? 165 : 65;
// {headerObj}
    return (
       <View style={{height: windowHeight - 64}} className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            {headerObj}
            <View style={{height: windowHeight - offset}} className={ appSetting('layout', 'max_width') + ' mx-auto w-full  '}>
                <RenderScene route={currentRoute}/>
            </View>
       </View>
    );
}