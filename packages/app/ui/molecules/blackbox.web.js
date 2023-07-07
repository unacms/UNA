import React, { useCallback, useState, useEffect, useRef  } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable, ScrollView  } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Theme } from 'app/design/theme';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, storageSet } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer } from 'app/lib/blackbox-helpers';
import Loading from 'app/ui/atoms/loading'
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useRouter } from 'next/router';
import  CurRouter from "app/ui/atoms/router";
import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/hooks/skeleton';

export function BlackBox({ header, smallHeader, minHeaderHeight = 100, isHideDefaultHeader = false, menu, data, blocks, useSectionAsMenu, offsetTop}) {

    const router = useRouter();

    let uniRef = useRef();
   
    const initedTabs = fillTabs(menu, data, blocks, useSectionAsMenu);
    const windowWidth = useWindowDimensions().width;

    const [routes, setRoutes] = useState(initedTabs);
    const routesRef = useRef();

    useEffect(() => {
        routesRef.current = routes;
      }, [routes]); // This runs every time `routes` changes

    const exitingFunction = (index) => {
        const route = routesRef.current.find((item) => item.index === index);
        if (appSetting('cache', 'list')){
            storageSet('ls-d', route.storageKeyValue, {index:index, data:route.data, endpoint:route.endpoint})
        }
    };
    
    const scroll = useSharedValue(1);
    const headerHeight = useSharedValue(minHeaderHeight);
    const headerMaxHeight = useSharedValue(minHeaderHeight);
    const headerMinHeight = useSharedValue(minHeaderHeight);
    const { colors } = Theme();

    const [index, setIndex] = useState(routes.findIndex(function(item) {
        return item.key === data.url.replace('+', '');
    }));
    const indicatorOffset = useSharedValue(0);
    
    const isLoading = useRef(false);
    

    const getNumCols = (width) => {
        let currentRoute = routes.find((item) => item.index === index);
        let blocksroutes =  currentRoute?.blocks;
        width = windowWidth;
        if (!blocksroutes)
            return 1;
        const blockKeys = Object.keys(blocksroutes);

        for (const key of blockKeys) {
            if (blocksroutes[key].perLine > 0) {
                return blocksroutes[key].perLine;
            }
        }

        let perLineSettings = appSetting('browse', 'per_line');
        if (currentRoute.endpoint.unit.includes('-profile-') || currentRoute.endpoint.unit.includes('-context-')){
            perLineSettings = appSetting('browse', 'per_line_profile');
        }

        for (let i = 0; i < perLineSettings.length; i++) {
            if (width > perLineSettings[i].width) {
                return perLineSettings[i].count;
            }
        }

        return 1;
    };

    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth));
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
    }, [routes, index]);


    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > headerMinHeight.value)
                scroll.value = 0;
            if (window.scrollY == 0)
                scroll.value = 1;
        };
    
        // Add the event listener when the component mounts
        window.addEventListener('scroll', handleScroll);
    
        // Clean up the event listener when the component unmounts
        return () => {
          window.removeEventListener('scroll', handleScroll);
        };
      }, []); 

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const renderTabBar = (props) => {
        const currentRoute = routes.find((item) => item.index === index);
        let headerSettings = getHeaderSettings(currentRoute.key, windowWidth);

        const tabWidth = 120; //windowWidth > 800 ? 120 : (windowWidth - 64)/routes.length ;
        indicatorOffset.value = withTiming(index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        });

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth,
                height:2.5,
                bottom:0,
                position:'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                display:'none'
            },
        });

        if (routes.length > 1){
            const menuSettings = appSetting('menu_items', menu.object);
            const addButtons = menuSettings?.add?.map((button) => {
                let btn = <Button title={button.title} startDecorator={button.icon} variant="outline" rounded size=""/>;
                btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
                return (
                    <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
            )});
            return (
                <View className="w-full backdrop-blur border-b items-center justify-center border-bordercolornavbar dark:border-bordercolornavbar-dark bg-backgroundnavbar dark:bg-backgroundnavbar-dark"  >
                    <View  className={ appSetting('layout', 'max_width')+ ' mx-auto w-full'}>
                    {!header && <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 border-b border-bordercolornavbar dark:border-bordercolornavbar-dark">
                        <Row className="items-center">
                        <View className="ml-4 "></View>
                        { headerSettings.header && <Pressable className="mr-2 bg-backgroundnavbar dark:bg-backgroundnavbar-dark  w-10 h-10 rounded-full justify-center items-center" onPress={router.back} >
                            <Icon icon="left" width={24} height={24} />
                        </Pressable>
                        }
                        { headerSettings.title && <Text className="text-2xl  mr-8 font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{menuSettings?.name}</Text>}
                        </Row> 
                        <Row className="pr-4">
                            {addButtons}
                        </Row>
                    </Row>
                    }
                    <Row className="items-center ">
                        {menuSettings?.name ? <Text  className="text-3xl my-auto mx-4 font-bold text-neutral-800  dark:text-neutral-200 hidden lg:flex h-10">{menuSettings?.name}</Text> : <></>}
                        <ScrollView horizontal={true} className="items-center gap-0 " >
                            <Row className="mr-auto ml-4 gap-x-2" >
                                {routes.map((a) => (
                                    <Pressable  className=" py-2 items-center"
                                        key={`tab-${a.index}`}
                                        onPress={() => {
                                            setIndex(a.index)
                                            window.history.pushState({ }, '', '/' + a.key);
                                        }}
                                    >
                                        <Button fullWidth={true} id="tab" variant={a.index ==index ? 'outline': "text"} rounded size='sm' title={a.title}   />
                                    </Pressable>
                                ))}
                                <Animated.View style={[styles.indicator, indicatorStyle]} ><View className="w-full h-1 " style={{borderRadius: 3, height: 2.5, backgroundColor: colors.primary, maxWidth:100}}></View></Animated.View>
                            </Row>
                            
                        </ScrollView>
                        <Row className="hidden lg:flex px-4">
                            {addButtons}
                        </Row>
                    </Row>
                </View>
            </View>

        )}
    };

    const viewRef = useRef(null);

    const renderHeader =  useCallback(() => {
        const d = 200;
        let menuHeight = 48;

        const tabBarObj = renderTabBar();
        if (!tabBarObj)
            menuHeight = 0; 

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
        const animatedStyle5 = useAnimatedStyle(() => {
            return {
                top: withTiming((scroll.value || window.innerWidth >0) > 0 ? (windowWidth > 1024 ? 63: 0): 0, { duration: d }),
                opacity:1
            };
        });


        const contentContainerStyle = useAnimatedStyle(() => {
            const baseHeight = scroll.value === 1 ? headerMaxHeight.value : headerMinHeight.value;
            const height = Math.max(baseHeight - 300 + menuHeight, 0);
            return {
                height,
            };
        });

        const parentAnimatedStyle = useAnimatedStyle(() => {
            return {
                height: withTiming(scroll.value == 1 ? headerMaxHeight.value : headerMinHeight.value, { duration: d }),
            };
        });

        if (!header){
            if (tabBarObj)
                return <>
                    <View className="w-full h-12 lg:h-12"></View>
                    <Animated.View style={[{ width: '100%', position: 'fixed', overflow: 'hidden', zIndex: 50  }, animatedStyle5]}>{tabBarObj}</Animated.View>

                    </>
        }


        const handleHeaderMaxLayout = useCallback((event) => {
            headerMaxHeight.value = event.nativeEvent.layout.height;
            headerHeight.value = headerMaxHeight.value ;
           
        });

        const handleHeaderMinLayout = useCallback((event) => {
            headerMinHeight.value = event.nativeEvent.layout.height;
        });

        return (
            <>
                <Animated.View style={[{ width: '100%', position: 'fixed', overflow: 'hidden', zIndex:50  }, animatedStyle5]}  ref={viewRef} >
                    <Animated.View className="w-full" style={parentAnimatedStyle}>
                        <Animated.View style={[{ width: '100%', position: 'absolute', overflow: 'hidden'  }, animatedStyleA]}>
                            <View onLayout={handleHeaderMaxLayout}>
                                {header}
                            </View>
                        </Animated.View>
                        <Animated.View style={[{ width: '100%', position: 'absolute', overflow: 'hidden'}, animatedStyleB]}>
                            <View  onLayout={handleHeaderMinLayout}>
                                {smallHeader}
                            </View>
                        </Animated.View>
                    </Animated.View>
                    <View >
                        {tabBarObj}
                    </View>
                </Animated.View>
                <Animated.View style={[{ width: '100%'}, contentContainerStyle]}></Animated.View>
                
            </>
        );
    }, [scroll, index, windowWidth]);

    const RenderScene = useCallback(({ route, status }) => <TabScene status={status}  route={route} width={windowWidth} index={index} />, [numColumns, windowWidth]);  

    const TabFlashList = React.forwardRef((props, ref) => {

        if (getNumCols(0) != numColumns)
            setNumColumns(getNumCols(0));

        return (
           <UniList
                {...props}
                useWindowScroll
                numColumns={numColumns}     
                onEndReached={handleEndReached}
            />
        );
    });

    const headerObj = renderHeader();

    const TabScene = ({ route, width, status }) => {

        const Preload = getSkeleton(data.module? data.module : data.unit);

        if (!route.inited){
            return <View className='m-2 pt-80'><Loading/></View>
        }
        if (route.inited){
            const dataItems = route.data
            let isRightCol = route?.sidebar?.content?.length > 0
            return (
                <>
                <CurRouter route={route} exitingFunction={() => exitingFunction(route.index)}  />
                <Row style={{ paddingTop: header ? (width > 1024 ? offsetTop : offsetTop - 50) : 0 }} className="mb-4"> 
                    <View className={isRightCol? 'flex-auto w-2/3': 'w-full'}>
                        {dataItems.length > 0 ? <TabFlashList
                            index={route.index}
                            data={dataItems}
                            storagekey={route.storageKeyValue}
                            refer={uniRef}
                            unit={route.endpoint?.unit}
                            renderItem={({ item, index }) => <ItemRenderer  route={route} numColumns={numColumns} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module}/>}
                            ListFooterComponent = {
                                <View className='m-4'>
                                    {(hasNextPage && isFetchingNextPage) ? (
                                        Preload
                                    ) : null}
                                </View>
                            }
                        /> : Preload}
                    </View>
                    {isRightCol && <View className="hidden xl:block w-1/3 mt-4 ">
                        <UniList
                            no_scroll
                            renderItem={({ item, index }) => <ItemRenderer key={'item' + index} route={route} numColumns={1} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''}/>}
                            data={route?.sidebar?.content}
                        />
                    </View>}
                </Row></>
        
    )}};
    const currentRoute = routes.find((item) => item.index === index);

    const handleLayoutTop = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    const windowHeight = useWindowDimensions().height;
    //onWheel={handleWheel} 
    return (
       <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            {headerObj}
            <View className={ appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <RenderScene route={currentRoute}/>
            </View>
       </View>
    );
}