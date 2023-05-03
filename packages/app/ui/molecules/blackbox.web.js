import React, { useCallback, useState, useEffect, useRef  } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable  } from 'app/design/view';
import { FlashList } from "@shopify/flash-list";
import { Theme } from 'app/design/theme';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BlockByName2 } from 'app/components/block';
import Unit from 'app/components/unit';
import { appSetting} from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { fillTabs, parseData, fetchAndUpdateData } from 'app/lib/blackbox-helpers';
import Loading from 'app/ui/atoms/loading'
import { Button } from 'app/design/controls';

export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks }) {

    const initedTabs = fillTabs(menu, data, blocks);

    const windowWidth = useWindowDimensions().width;

    const getNumCols = (width) => {

        const blockKeys = Object.keys(blocks);

        for (const key of blockKeys) {
            if (blocks[key].perLine > 0) {
                return blocks[key].perLine;
            }
        }

        return blockKeys.length === 1 && width > 600 ? 3 : 1;
    };

    const iMenuHeight = 64;

    const [routes, setRoutes] = useState(initedTabs);
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth));
    const scroll = useSharedValue(1);
    const headerHeight = useSharedValue(100);
    const headerMaxHeight = useSharedValue(100);
    const headerMinHeight = useSharedValue(100);
    const { colors } = Theme();

    const [index, setIndex] = useState(routes[0].index);
    const indicatorOffset = useSharedValue(0);

    const isLoading = useRef(false);

    const handleEndReached = useCallback(async () => {
        parseData(routes, index, setRoutes);
        isLoading.current = false;
    }, [routes, index]);

    const handleScroll = (event) => {
        if (event.nativeEvent.contentOffset.y > headerMaxHeight.value - headerMinHeight.value)
            scroll.value = 0;
        if (event.nativeEvent.contentOffset.y <10)
            scroll.value = 1;
    };

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const renderTabBar = (props) => {
      
        const tabWidth = 160;
        indicatorOffset.value = withTiming(index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        });

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth,
                height:3,
                bottom:0,
                position:'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                display:'flex'
            },
        });

        if (routes.length > 1){
            const menuSettings = appSetting('menu_items', menu.object);
            const addButtons = menuSettings.add?.map((button) => (
                <View className="ml-2" key={`add-${button.title}`} ><Button title={button.title} startDecorator={button.icon} size="sm"/></View>
            ));
            return (
                <View className="w-full backdrop-blur border-b  border-bordercolortabbar dark:border-bordercolortabbar-dark" style={{ backgroundColor: colors.barsBackground}} >
                    <View  className={ appSetting('layout', 'max_width')+ ' mx-auto w-full'}>
                    <Row className="items-center gap-0 mx-4">
                        {menuSettings?.icon ? <View className=""><Icon size={32} icon={menuSettings?.icon} /></View> : <></>}
                        {menuSettings?.name ? <Text  className="text-xl mx-2 font-bold text-neutral-800 dark:text-neutral-200">{menuSettings?.name}</Text> : <></>}
                            <Row className="items-center mx-auto" >
                            
                                {routes.map((a) => (
                                    <Pressable style={{width:tabWidth}} className=" py-3 items-center"
                                        key={`tab-${a.index}`}
                                        onPress={() => {
                                            setIndex(a.index)
                                        }}
                                    >
                                        <Text className="font-semibold text-base" style={{color: (index === a.index ? colors.primary : colors.default)}}>{a.title}</Text>
                                    </Pressable>
                                ))}
                                <Animated.View style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1 " style={{borderRadius: 3, height: 3, backgroundColor: colors.primary, maxWidth:160}}></View></Animated.View>
                            </Row>
                            {addButtons}
                        </Row>
                    </View>
                </View>

        )}
    };

    const viewRef = useRef(null);
    const isWheeling = useRef(false);
    const wheelTimeout = useRef(null);

    const handleWheel = (event) => {
        if (scroll.value == 0)
            return;
        if (isWheeling.current) {
            clearTimeout(wheelTimeout.current);
        } else {
            isWheeling.current = true;
            if (viewRef.current) {
                viewRef.current.setNativeProps({
                    style: {
                        zIndex: 0,
                     },
                });
            }
        }
    
        wheelTimeout.current = setTimeout(() => {
            isWheeling.current = false;
            handleWheelEnd();
        }, 150); 
    };
    
    const handleWheelEnd = () => {
        if (viewRef.current) {
            viewRef.current.setNativeProps({
                style: {
                    zIndex: 50,
                },
            });
        }
      };

    const renderHeader =  useCallback(() => {
        const d = 200;
        const menuHeight = 48;
        const animatedStyleA = useAnimatedStyle(() => {
            const opacityValue = withTiming(scroll.value, { duration: d });
            
            return {
                opacity: opacityValue,
                display: opacityValue === 0 ? 'none' : 'flex',
                height: withTiming(headerMaxHeight.value * scroll.value, { duration: d }),
            };
        });

        const animatedStyleB = useAnimatedStyle(() => {
            const opacityValue = withTiming(1 - scroll.value, { duration: d });
            return {
                opacity: opacityValue,
                display: opacityValue === 0 ? 'none' : 'flex',
                height: withTiming(headerMinHeight.value * (1 - scroll.value), { duration: d }),
            };
        });

        const contentContainerStyle = useAnimatedStyle(() => {
            const baseHeight = scroll.value === 1 ? headerMaxHeight.value : headerMinHeight.value;
            const height = Math.max(baseHeight - 300 + menuHeight, 0);
            return {
                height,
            };
        });
        
          
        const tabBarObj = renderTabBar();

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: withTiming(scroll.value == 1 ? headerMaxHeight.value : headerMinHeight.value, { duration: d }),
            };
        });

        if (!header){
            if (tabBarObj)
                return <><View className="w-full h-12"></View><View className="fixed w-full " >{tabBarObj}</View></>
        }


        const handleHeaderMaxLayout = useCallback((event) => {
            console.log('Max---------', event.nativeEvent.layout.height);
            headerMaxHeight.value = event.nativeEvent.layout.height;
            headerHeight.value = headerMaxHeight.value ;
           
        });

        const handleHeaderMinLayout = useCallback((event) => {
            console.log('Min---------', event.nativeEvent.layout.height);
            headerMinHeight.value = event.nativeEvent.layout.height;
        });
        
        return (
            <>
                <View className="fixed w-full z-50 "  ref={viewRef} style={{zIndex: 50}} >
                    <Animated.View className="w-full" style={parentAnimatedStyle}>
                        <Animated.View style={[{ width: '100%', position: 'absolute', overflow: 'hidden'  }, animatedStyleA]}>
                            <View onLayout={handleHeaderMaxLayout}>
                                {header}
                            </View>
                        </Animated.View>
                        <Animated.View style={[{ width: '100%', position: 'absolute', overflow: 'hidden'}, animatedStyleB]}>
                            <View className="jjjj" onLayout={handleHeaderMinLayout}>
                                {smallHeader}
                            </View>
                        </Animated.View>
                    </Animated.View>
                    <View >
                        {tabBarObj}
                    </View>
                </View>
                <Animated.View style={[{ width: '100%'}, contentContainerStyle]}></Animated.View>
                
            </>
        );
    }, [scroll, index]);

    const RenderScene = useCallback(({ route }) => <TabScene route={route} index={index} />, []);  

    const TabFlashList = React.forwardRef((props, ref) => {
        return (
            <FlashList
                {...props}
                ref={ref}
                onScroll={handleScroll}
                contentContainerStyle={{ paddingTop: header ? 300 : 0 }}
                onEndReached={handleEndReached}
            />
        );
    });

    const headerObj = renderHeader();

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
                            return <View key={`${route.index}-${item.id}`} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : 'w-full'}><Unit module={data.module ? data.module : ''} unit={route?.endpoint?.unit} data={item} mode={appSetting('feed', 'default_view')} /></View>
                        }
                    }}
                    ListFooterComponent={
                        (route?.endpoint?.finished === false) ? (
                            <View className='m-2'><Loading/></View>
                        ) : null
                    }
                />
    )};

    const currentRoute = routes.find((item) => item.index === index);

    

    const handleLayoutTop = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        const containerHeight = event.nativeEvent.layout.height;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    const windowHeight = useWindowDimensions().height;
    //{headerObj}
    return (
       <View style={{height: windowHeight - iMenuHeight}} className="w-full h-full" scrollEnabled={true}   onWheel={handleWheel}  onLayout={handleLayoutTop}>
            {headerObj}
            <View style={{height: windowHeight - iMenuHeight }} className={ appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <RenderScene route={currentRoute}/>
            </View>
       </View>
    );
}