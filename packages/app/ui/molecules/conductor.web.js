import React, { useCallback, useState, useEffect, useRef, useMemo, memo   } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable, ScrollView  } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Theme } from 'app/design/theme';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, getBackButtonWeb } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { appStatic } from 'app/lib/app-static';
import { Modal } from 'app/design/controls';
import { Input } from 'app/design/controls'
import MainMenu from 'app/components/nav/mainmenu'
import Redirect from 'app/ui/atoms/redirect';
import { useTranslation } from 'react-i18next';

export function Conductor({ header, smallHeader, menu, data, blocks, useSectionAsMenu, leftSideBar, skeleton='', onChangeRoute, keyword, cover}) {
    const { t } = useTranslation();
    const redirectdRef = useRef();
    let uniRef = useRef();
    let inputSearchRef = useRef();
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [menuPopup, setMenuPopup] = useState(false)

    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
      }


    const initedTabs = fillTabs(menu, data, blocks, useSectionAsMenu);
   // console.log('initedTabs', menu, initedTabs);
    const windowDimen =  useWindowDimensions();
    const windowWidth = windowDimen.width;
    const windowHeight = windowDimen.height;
    const [routes, setRoutes] = useState(initedTabs);
   // console.log('routes', routes)
    useEffect(() => {
        setRoutes(initedTabs);
    }, [keyword]);

    const scrollValue = useSharedValue(1);
    const { colors } = Theme();
    const [index, setIndex] = useState(routes.findIndex(function(item) {
        if (useSectionAsMenu)
            return data.url == item.key;
        else
            return data.url.includes(item.key);
    }));

    const indicatorOffset = useSharedValue(0);
    
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
        if (currentRoute?.endpoint?.unit.includes('-profile-') || currentRoute?.endpoint?.unit.includes('-context-')){
            perLineSettings = appSetting('browse', 'per_line_profile');
        }
        if (leftSideBar){
            perLineSettings = appSetting('browse', 'per_line_left_side_bar');
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
        status: rqtStatus,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        
    } = useInfiniteQuery({
            queryKey: [routes[index]?.endpoint?.request_url, index, keyword], 
            queryFn:  ({ pageParam }) => parseData(routes, index, setRoutes),	
            getNextPageParam: (lastPage, pages) => { 
                if (lastPage?.data?.length > 0){
                    return lastPage?.endpoint; 
                }

                return;
            },
            enabled: routes[index]?.endpoint?.params?.start == 0//routes[index]?.data?.length == 0
    });

    const scrollToCover = (cover, windowWidth, offset) => {
        const baseScroll = windowWidth < 1024 ? 280 : offset;
        const adjustment = cover === 'group' ? -100 : -200;
    
        window.scroll({
            top: baseScroll + adjustment,
            behavior: "smooth",
        });
    }

    const handleEndReached = useCallback(async (lastItemIndex) => {
        if (isFetchingNextPage) 
            return;
        if (!hasNextPage) 
            return;
        if (routes[index]?.endpoint.finished)
            return;
        if (lastItemIndex == false)
            return;
        fetchNextPage();
    }, [routes, index, isFetchingNextPage, hasNextPage]);

    let offset = header ? (windowWidth < 1024 ? 200 : 600) : 50;
    if (cover == 'min' && header > 50){
        offset = windowWidth < 1024 ? 80 : 200
    }
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > offset && scrollValue.value != 0){
                scrollValue.value = 0;
            }
            if (window.scrollY < offset && scrollValue.value != 1){
                scrollValue.value = 1;
            }
        };
    
        // Add the event listener when the component mounts
        window.addEventListener('scroll', handleScroll);
        scrollToCover(cover, windowWidth, offset)

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
        },[indicatorOffset]);

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
                let btn = <Button title={button.title} startDecorator={button.icon} variant="outline" onPress={button.section ? () => showSearch(button.section) : undefined} rounded />;
                btn = button.link ? <Link href = { button.link } >{btn}</Link> : btn
                return (
                    <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
            )});
            return (
                <View className={ (leftSideBar ? 'lg:hidden': '') + " w-full  items-left justify-center bg-white border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d border-b backdrop-blur"}  >
                    <View  className={ (leftSideBar ? appSetting('layout', 'max_width') : ' max-w-screen-2xl mx-auto ') + 'w-full'}>
                    {!header && <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16 border-b border-bdrnavbar dark:border-bdrnavbar-d">
                        <Row className="items-center">
                        <View className="ml-4 "></View>
                        { headerSettings.header && getBackButtonWeb() }
                        { headerSettings.header == false && headerSettings.menu == true &&  <View className="lg:hidden mr-4"><Pressable  onPress={showMenu}>
                    <Button
                      variant="outline"
                      startDecorator="List"
                      rounded
                      align="start"
                    />
                  
                  </Pressable></View>}
                        { headerSettings.title && <Text className="text-2xl  mr-8 font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{t(menuSettings?.name)}</Text>}
                        </Row> 
                        <Row className="pr-4">
                            {addButtons}
                        </Row>
                    </Row>
                    }
                    <Row className="items-center ">
                        {menuSettings?.name ? <Text  className="text-2xl my-auto mx-4 font-bold text-neutral-800  dark:text-neutral-200 hidden lg:flex h-9">{menuSettings?.name}</Text> : <></>}
                        <ScrollView horizontal={true} className="items-center gap-0 " >
                            <Row className="mr-auto ml-4 gap-x-2" >
                                {routes.filter((aItem) => aItem.hideInTop != true).map((a) => (
                                    <Pressable  className=" py-2 items-center"
                                        key={`tab-${a.index}`}
                                        onPress={() => {
                                            setIndex(a.index);
                                            getNumCols(windowWidth)
                                            window.history.pushState({ }, '', '/' + a.key);
                                            if (onChangeRoute) {
                                                onChangeRoute(a);
                                            }
                                        }}
                                    >
                                        <Button fullWidth={true} id="tab" variant={a.index ==index ? 'outline': "text"} rounded size='sm' title={t(a.title)} addon={a.addon} />
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

    const renderHeader =  useCallback((tabBarObj) => {
        const d = 200;

        const animatedStyle5 = useAnimatedStyle(() => {
            const opacityValue = withTiming(scrollValue.value, { duration: d });
            return {
                opacity:opacityValue
            };
        },[scrollValue]);

        const animatedStyle6 = useAnimatedStyle(() => {
            const opacityValue = withTiming(1 - scrollValue.value, { duration: d });
            return {
                opacity:opacityValue
            };
        },[scrollValue]);

       /* if (!header){
            if (tabBarObj)
                return <>
                    <View className="w-full h-12 lg:h-12"></View>
                    <Animated.View style={[{ width: '100%',  overflow: 'hidden', zIndex: 50  }]}>{tabBarObj}</Animated.View>
                </>
        }*/
        let tOffset = appSetting('layout', 'format') =='ver' ? 0: 63;
        return (
            <>
                <Animated.View style={[{ width: '100%',  position:'fixed', overflow: 'hidden', zIndex:40, top:windowWidth >= 1024 ? tOffset: 0 }, animatedStyle6]}>
                    {smallHeader}
                    {tabBarObj}
                </Animated.View>
                <Animated.View style={[{ width: '100%',  overflow: 'hidden', zIndex:50  }, animatedStyle5]}  >
                    <View className="w-full" >
                        <View style={[{ width: '100%',  overflow: 'hidden'  }]}>
                            <View>
                                {header}     
                            </View>
                        </View>
                    </View>
                    <View >
                        {tabBarObj}
                    </View>
                </Animated.View>
            </>
        );
    }, [windowWidth]);

    const RenderScene = useCallback(({ route, status }) => <TabScene status={status}  route={route} width={windowWidth} index={index} />, [numColumns, windowWidth, rqtStatus, index]);  

    const TabFlashList = React.forwardRef((props, ref) => {

        if (getNumCols(0) != numColumns)
            setNumColumns(getNumCols(0));

        if (props.data.length == 1 && !props.endpoint){
            {props.data.map((item, index ) => {
                return <ItemRenderer key={'item' + index} numColumns={1} item={item} />
            })}
        }
        
        return (
           <UniList
                {...props}
                useWindowScroll
                numColumns={numColumns}     
                onEndReached={handleEndReached}
            />
        );
    });
    const tabBarObj = renderTabBar();
    const headerObj = renderHeader(tabBarObj);

    const TabScene = ({ route, width, status }) => {
        const dataItems = route.data
        //let b = useMemo(() => {
        const Preload = getSkeleton(skeleton != '' ? skeleton : (data.module? data.module : data.unit));
        if (!route.inited){
            return <></>
        }
        if (route.inited){
            let isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar
            const unitType = getUnitModeBySource(route?.endpoint?.request_url)
            
            let TabFlashListM = useMemo(() => {  
                return <TabFlashList
                    index={route.index}
                    data={dataItems}
                    endpoint={route.endpoint}
                    listState = {route?.state}
                    storagekey={route.storageKeyValue}
                    refer={uniRef}
                    unit={route.endpoint?.unit}
                    renderItem={({ item, index }) => <ItemRenderer unitType={unitType} route={route} numColumns={numColumns} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module}/>}
                    ListFooterComponent = {
                        <View className='m-4'>
                            {(hasNextPage && isFetchingNextPage) ? (
                                Preload
                            ) : null}
                        </View>
                    }
                />
            }, [dataItems.length]);
            return (
                <>
                <Row style={{ paddingTop: header ? 0 : 0 }} className=" "> 
                    <View className={isRightCol? 'flex-auto w-2/3 pt-4 border-r border-bdr dark:border-bdr-d border-dashed ': 'w-full p-2'}>
                        {dataItems.length > 0 ? TabFlashListM : rqtStatus != 'success' ? Preload :appStatic('components_content_empty')}
                    </View>
                    {isRightCol && <View className="hidden xl:block w-1/3 pt-4 pl-4">

                        {route?.sidebar?.content.map((item, index ) => {
                            return <ItemRenderer key={'item' + index} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''}/>
                        })}

                        <BlockByName data={data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1}/>
                    </View>}
                </Row></>
        
    )}
    // can be the problem (freeze data im lists)
                    //    }, [dataItems.length, route.index]);
                      //  return b;
                        
};
    const currentRoute = routes.find((item) => item.index === index);

    const handleLayoutTop = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        if (getNumCols(containerWidth) != numColumns)
        setNumColumns(getNumCols(containerWidth));
    };
    
    const showSearch = (section) => {
        setTimeout(() => {
            inputSearchRef.current && inputSearchRef.current.focus()
        }, 100);
        setSearchVisible(section);
    };

    const handleSearch = (value) => {
        setSearchValue(value)
    };
    
    const handleSearchStart = () => {
        redirectdRef.current.redirect('/search-keyword?keyword=' + searchValue + '&section='+ searchVisible);
    };
    
    const leftSideBarObj = useCallback(() => {
        const menuSettings = appSetting('menu_items', menu.object);
        const addButtons = menuSettings?.add?.map((button) => {
            let btn = <Button title={t(button.title)} onPress={button.section ? () => showSearch(button.section) : undefined} startDecorator={button.icon} variant="outline" rounded size="sm"/>;
            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
            return (
                <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
        )});
        return  <ScrollView className='hidden lg:block lg:w-1/4 xl:w-1/5 t-0 lg:px-4 lg:py-3 fixed top-16 left-0' style={{height: windowHeight - 80}}>
            <Row className="justify-between items-center mb-4 ">
                <Text className="text-2xl mx-1 my-auto font-bold  text-neutral-700 dark:text-neutral-100 hidden lg:flex flex-row items-center gap-x-2 ">
                    {t(menuSettings?.name)}
                </Text>
                <Row className=" ">
                    {addButtons}
                </Row>
            </Row>
            <View className=' hidden flex-col gap-y-0.5 lg:flex '>
                {routes.map((a) => {
                    let settings = appSetting('layouts', a.key)
                    return (
                    <Link href={a.key} key={`lmenu-${a.index}`} alt={a.title}>
                        <Pressable className={a.ident ? 'pl-10': ''} onPress={(event) => {
                            setIndex(a.index);
                            window.history.pushState({ }, '', a.key);
                            event.preventDefault()
                        }}>
                          <Button
                                variant={a.index == index ? 'outline': "text"}
                                size={!a.ident ? "lg" : "base"}
                                fullWidth
                                title = {(a.title)}
                                align="start"
                                startDecorator={!a.ident ? settings?.icon : a.icon}
                                addon={a.addon}
                            />
                        </Pressable>
                    </Link>
                )})}
            </View>
            </ScrollView>
    }, [routes, index]);

    const searchBarObj= () => {
        return (
            <>
                <Redirect ref={redirectdRef} />
                <Modal onVisible={searchVisible} onClose={() => { setSearchVisible(false)}} position="top">
                    <View className="px-1.5 pb-1.5">
                        <View className="flex-row items-center mb-2">
                            <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5 mb-2">Search</Text>
                        </View>
                        <View className="flex-row">
                            <Input name="search" ref={inputSearchRef} onSubmitEditing={handleSearchStart} onChangeText={(value) => handleSearch(value)} role="textbox" aria-label="Search" />
                        </View>
                    </View>
                </Modal>
            </>
        );
    };

    if (leftSideBar){
        return (
            <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
                <MainMenu showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-[114px] w-full" />
                {headerObj}
                <View style={{minHeight:(windowHeight-64)}} className={appSetting('layout', 'max_width') + ' mx-auto  w-full'} >
                    <Row>
                        <View style={{minHeight:(windowHeight-64)}} className={'hidden lg:block w-full lg:w-1/4 xl:w-1/5 border-r  border-neutral-500/10 bg-bgrnavbar dark:bg-bgrnavbar-d lg:p-4 fixed lg:relative top-0 z-50'}>
                            {leftSideBarObj()}
                        </View>
                        <View className="w-full lg:w-3/4 xl:w-4/5 min-h-screen">
                            <RenderScene route={currentRoute}/>
                        </View>
                    </Row>
                 </View>
                 {searchBarObj()}
            </View>
         );

    }
    return (
       <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            <MainMenu showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden absolute z-50 top-[115px] w-full" />
            {headerObj}
            <View className='max-w-screen-2xl mx-auto w-full min-h-screen '>
                <RenderScene route={currentRoute}/>
            </View>
            {searchBarObj()}
       </View>
    );
}