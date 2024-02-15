import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable, ScrollView } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Theme } from 'app/design/theme';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, getAlert, menuItemsByName, getLayout } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, getBackButtonWeb,LeftSidebar, TopSidebar } from 'app/lib/conductor-helpers';
import { Button, ButtonRef } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeleton } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { appStatic } from 'app/lib/app-static';
import { Input } from 'app/design/controls'
import MainMenu from 'app/components/nav/mainmenu'
import { useTranslation } from 'react-i18next';
import { fetcher } from 'app/lib/fetcher';
import Toaster from 'app/ui/atoms/toaster';
import useDaemon from 'app/lib/hooks/daemon'
import { LayoutData } from 'app/context/layout';
import { useCurrentUser } from 'app/context/user'
import Dropdown from 'app/ui/atoms/dropdown'
import Search from 'app/ui/molecules/search';
import Location from 'app/components/form-fields/location'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import DynamicMenu from 'app/ui/molecules/dynamic_menu';

export function Conductor({ header, smallHeader, menu, data, blocks, useSectionAsMenu, leftSideBar, skeleton = '', onChangeRoute, keyword, cover, layoutName }) {
    const { currentUser, setCurrentUser } = useCurrentUser();

    const menu_drawer = appSetting('menu_items', 'menu_drawer')
    let menu_drawer_items = menuItemsByName('main_menu', menu_drawer, currentUser);

    const { layoutData, setLayoutData } = useContext(LayoutData);
    const { t } = useTranslation();
    let uniRef = useRef();
    const [menuPopup, setMenuPopup] = useState(false)
    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }


    const [maxId, setMaxId] = useState(0);
    const toasterRef = useRef();

  

    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);

    const windowDimen = useWindowDimensions();
    const windowWidth = windowDimen.width;
    const windowHeight = windowDimen.height;
    const [routes, setRoutes] = useState(initedTabs);
    const [cntWidth, setCntWidth] = useState(0);


    useEffect(() => {
        setRoutes(initedTabs);
    }, [keyword, data.url, data.elements]);

    const scrollValue = useSharedValue(1);
    const { colors } = Theme();
    const [index, setIndex] = useState(routes.findIndex(function (item) {
        if (useSectionAsMenu)
            return data.url == item.key;
        else
            return (data.url).includes(item.key);
    }));

    //console.log("routes", routes)

    /* DAEMON PART */
    const setToasterVisible = (val) => {
        const current = toasterRef.current;
        if (current) {
            current.setVisible(val);
        }
    }

    let maxIdLocal = 0;
    const currentRoute = routes.find((item) => item.index === index);

    let headerSettings = getHeaderSettings(getURI(currentRoute?.key), windowWidth, layoutName);
    const bUseDaemon = (currentRoute?.endpoint?.unit == 'feed');
    let params = currentRoute?.endpoint?.params ? JSON.parse(JSON.stringify(currentRoute.endpoint.params)) : {};
    params.start = 0;
    const { daemonData, error } = useDaemon('/api.php?r=bx_timeline/get_live_update&params[]=' + JSON.stringify({ 'params': params }) + '&params[]=0&params[]=0', false, bUseDaemon);
    if (bUseDaemon) {
        maxIdLocal = currentRoute?.data.length > 0
            ? currentRoute?.data.reduce((max, item) => {
                const idNumber = parseFloat(item.id);
                return (typeof idNumber === 'number' && Number.isFinite(idNumber) && idNumber > max) ? idNumber : max;
            }, parseFloat(currentRoute?.data[0].id) || 0)
            : 0;
        if (daemonData && maxId > 0 && maxId < daemonData) {
            setTimeout(() => {
                setToasterVisible(true);
            }, 100);

        }
    }
    // }, [index]);


    useEffect(() => {
        if (maxIdLocal > 0 && maxIdLocal != maxId) {
            setMaxId(maxIdLocal)
        }
    }, [maxIdLocal]);


    const showNewContent = async () => {
        setToasterVisible(false);
        let params = JSON.parse(JSON.stringify(currentRoute.endpoint.params));
        params.start = 0;
        const sRequest = currentRoute.endpoint.request_url + JSON.stringify({ params });

        const sResponse = await fetcher(sRequest);
        maxIdLocal = sResponse.data[0].data.data.length > 0 ? sResponse.data[0].data.data.reduce((max, item) => item.id > max ? item.id : max, sResponse.data[0].data.data[0].id) : 0;
        setLayoutData(getAlert('feed:new_content', sResponse.data[0].data.data));

        setMaxId(maxIdLocal);
        uniRef.current.scrollToIndex({ animated: true, index: -1 });

    }
    /* DAEMON PART */

    const indicatorOffset = useSharedValue(0);

    const getUnitType = (currentRoute) => {
        let blocksroutes = currentRoute?.blocks;
        if (blocksroutes) {
            const blockKeys = Object.keys(blocksroutes);
            for (const key of blockKeys) {
                if (!blocksroutes[key].sidebar && blocksroutes[key].unitType) {
                    return blocksroutes[key].unitType;
                }
            }
        }

    }

    const getNumCols = (width) => {

        let blocksroutes = currentRoute?.blocks;
        width = windowWidth;
        // if (!blocksroutes)
        //    return 1;
        if (blocksroutes) {
            const blockKeys = Object.keys(blocksroutes);
            for (const key of blockKeys) {
                if (blocksroutes[key].perLine > 0) {
                    return blocksroutes[key].perLine;
                }
            }
        }

        let perLineSettings = appSetting('browse', 'per_line');
        if (currentRoute?.endpoint?.unit.includes('-profile-') || currentRoute?.endpoint?.unit.includes('-context-')) {
            perLineSettings = appSetting('browse', 'per_line_profile');
        }
        if (leftSideBar) {
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
        queryKey: [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)],
        queryFn: ({ pageParam }) => parseData(routes, index, setRoutes),
        getNextPageParam: (lastPage, pages) => {
            if (lastPage?.data?.length > 0) {
                return lastPage?.endpoint;
            }

            return;
        },
        enabled: currentRoute?.endpoint?.params?.start == 0//routes[index]?.data?.length == 0
    });

    const scrollToCover = (cover, windowWidth, offset) => {
        const baseScroll = windowWidth < 1024 ? 280 : offset;
        const adjustment = cover === 'group' ? -100 : -200;
        if (cover != 'min') {
            window.scroll({
                top: baseScroll + adjustment,
                behavior: "smooth",
            });
        }
    }


    const setFilterValue = (values) => {

        const newRoutes = [...routes];
        values.forEach(function (value) {
            const name = value.name;
            const val = value.value;
            if (newRoutes[index].endpoint.params.filters) {
                newRoutes[index].endpoint.params.filters[name] = val;
            }
            else {
                newRoutes[index].endpoint.params.filters = { [name]: val };
            }
        })
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = [];
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
    }

    /*const applyFilterValue = () => {
        const newRoutes = [...routes];
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = [];
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
    }

    useEffect(() => {
        if (currentRoute?.endpoint?.params?.filters)
            applyFilterValue();
    }, [currentRoute?.endpoint?.params?.filters]);
*/
    const handleEndReached = useCallback(async (lastItemIndex) => {
        if (isFetchingNextPage)
            return;
        if (!hasNextPage)
            return;
        if (currentRoute?.endpoint.finished)
            return;
        if (lastItemIndex == false)
            return;
        fetchNextPage();
    }, [routes, index, isFetchingNextPage, hasNextPage]);

    let offset = header ? (windowWidth < 1024 ? 400 : 400) : 50;
    if (cover == 'min' && header > 50) {
        offset = windowWidth < 1024 ? 80 : 200
    }
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > offset && scrollValue.value != 0) {
                scrollValue.value = 0;
            }
            if (window.scrollY < offset && scrollValue.value != 1) {
                scrollValue.value = 1;
            }
        };

        // Add the event listener when the component mounts
        window.addEventListener('scroll', handleScroll);
        if (appSetting('layout', 'cover_scroll'))
            scrollToCover(cover, windowWidth, offset)

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };

    }, []);

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const renderTabBar = (isSmall = false) => {

        const tabWidth = 120; //windowWidth > 800 ? 120 : (windowWidth - 64)/routes.length ;
        indicatorOffset.value = withTiming(index * tabWidth, { duration: 200, easing: Easing.inOut(Easing.ease) });

        const indicatorStyle = useAnimatedStyle(() => {
            return {
                transform: [{ translateX: indicatorOffset.value }],
            };
        }, [indicatorOffset]);

        const styles = StyleSheet.create({
            indicator: {
                width: tabWidth,
                height: 2.5,
                bottom: 0,
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                display: 'none'
            },
        });

        if (routes.length > 1) {
            const menuSettings = appSetting('menu_items', menu.object);
            const addButtons = menuSettings?.add?.map((button) => {
                let btn = undefined;
                if (button.section)
                    btn = <Search section={button.section} />
                else {
                    btn = <Button title={button.title} startDecorator={button.icon} variant="outline" rounded />;
                    btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
                }

                return (
                    <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
                )
            });

            let styles = {}
            /* if (windowWidth > 600 && getLayout(currentUser) != 'hor') {
                 styles = { width: 1536 - 20 * 16 }
             }
 */
            return (
                <TopSidebar isWeb={true} style={styles} leftSideBar={leftSideBar} header={header} headerSettings={headerSettings} menu_drawer_items={menu_drawer_items} addButtons={addButtons} isSmall={isSmall} showMenu={showMenu} layout={getLayout(currentUser)} title={t(menuSettings?.name)} >
                      <ConductorMenu routes={routes} index={index} t={t} setIndex={setIndex} getNumCols={getNumCols} windowWidth={windowWidth} onChangeRoute={onChangeRoute} />
                </TopSidebar>
                    
            )
        }
    };

    const renderHeader = useCallback((tabBarObj, tabBarObjSmall) => {
        const d = 200;
        const animatedStyle5 = useAnimatedStyle(() => {
            const opacityValue = withTiming(scrollValue.value, { duration: d });
            const zIndexValue = withTiming(scrollValue.value, { duration: d });
            return {
                opacity: opacityValue

            };
        }, [scrollValue]);

        const animatedStyle6 = useAnimatedStyle(() => {
            const opacityValue = withTiming(1 - scrollValue.value, { duration: d });
            return {
                opacity: opacityValue,
                zIndex: scrollValue.value ? 40 : 60
            };
        }, [scrollValue]);

        /* if (!header){
             if (tabBarObj)
                 return <>
                     <View className="w-full h-12 lg:h-12"></View>
                     <Animated.View style={[{ width: '100%',  overflow: 'hidden', zIndex: 50  }]}>{tabBarObj}</Animated.View>
                 </>
         }*/
        let tOffset = getLayout(currentUser) == 'ver' ? 0 : 63;
        return (
            <>
                <Animated.View style={[{ width: cntWidth + 'px', position: 'fixed', overflow: 'hidden', zIndex: 40, top: windowWidth >= 1024 ? tOffset : 0 }, animatedStyle6]}>
                    {smallHeader}
                    {tabBarObjSmall}
                </Animated.View>
                <Animated.View style={[{ width: cntWidth + 'px', overflow: 'hidden', zIndex: 50 }, animatedStyle5]}  >
                    <View className="w-full" >
                        <View style={[{ width: '100%', overflow: 'hidden' }]}>
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
    }, [windowWidth, currentUser, cntWidth]);

    const RenderScene = useCallback(({ route, status }) => {
        let inputs = route?.endpoint?.filters?.inputs;
        return (
            <>
                {
                    inputs && (

                        <Row className={appSetting('layout', 'max_width') + " mx-auto w-full p-3 sm:p-4 pb-1 sm:pb-0 w-full gap-x-4 items-center "}>

                            {Object.keys(inputs).map((key, index) => {
                                if (inputs[key].type == 'radio_set') {
                                    let values = [];
                                    if (Array.isArray(inputs[key].values)) {
                                        values = inputs[key].values.map(function (key) {
                                            return key.value && key.key != "date_range" ? { label: key.value, value: key.key } : null;
                                        });
                                        values = values.filter(Boolean);
                                    }
                                    return (
                                        <Row key={index} className="items-center">
                                            {/* <Text className="text-neutral-800 dark:text-neutral-200 text-base">{inputs[key].caption}: </Text>*/}
                                            <Dropdown
                                                labelField="label"
                                                valueField="value"
                                                value={route?.endpoint?.params?.filters?.[inputs[key].name]}
                                                onChange={(value) => setFilterValue([{ name: inputs[key].name, value: value }])}
                                                data={values}
                                            />
                                        </Row>
                                    );
                                } else if (inputs[key].type == 'text') {
                                    return (
                                        <Row key={index} className="items-center">
                                            <Input
                                                name="search"
                                                placeholder={inputs[key].caption}
                                                value={route?.endpoint?.params?.filters?.[inputs[key].name]}

                                                onChangeText={(value) => setFilterValue(inputs[key].name, value)}
                                            />
                                        </Row>
                                    );
                                } else if (inputs[key].type == 'location') {
                                    return (
                                        <Row key={index} className="items-center">
                                            <Location
                                                name="search"
                                                value={{ location_string: route?.endpoint?.params?.filters?.[inputs[key].name] }}
                                                onChange={(value) => { setFilterValue([{ name: inputs[key].name, value: value.location_string }, { name: inputs[key].name + '_country', value: value.country }, { name: inputs[key].name + '_state', value: value.state }, { name: inputs[key].name + '_city', value: value.city }]) }}
                                            />
                                        </Row>
                                    );
                                }
                                return null; // Return null if none of the conditions are met
                            })}
                        </Row>

                    )
                }
                <TabScene status={status} route={route} width={windowWidth} index={index} />
            </>
        )
    }
        , [numColumns, windowWidth, rqtStatus, index]);

    const TabFlashList = React.forwardRef((props, ref) => {

        if (getNumCols(0) != numColumns)
            setNumColumns(getNumCols(0));

        if (props.data.length == 1 && !props.endpoint) {
            let a = props.data.map((item, index) => {
                return <View className={appSetting('layout', 'max_width_block') + " mx-auto w-full"} key={"tab-" + index}><ItemRenderer route={props.route} key={'item' + index} numColumns={1} item={item} /></View>
            });
            return a;
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
    const tabBarObjSmall = renderTabBar(true);
    const headerObj = renderHeader(tabBarObj, tabBarObjSmall);

    const TabScene = ({ route, width, status }) => {
        const dataItems = route?.data
        //let b = useMemo(() => {
        const Preload = getSkeleton(skeleton != '' ? skeleton : (data.module ? data.module : data.unit), numColumns);
        if (!route.inited) {
            return <></>
        }
        if (route.inited) {
            let isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar;
            let unitType = getUnitModeBySource(route?.endpoint?.request_url)
            if (unitType == 'default')
                unitType = getUnitType(route);

            let TabFlashListM = useMemo(() => {
                return <TabFlashList
                    index={route.index}
                    data={dataItems}
                    endpoint={route.endpoint}
                    listState={route?.state}
                    storagekey={route.storageKeyValue}
                    refer={uniRef}
                    route={route}
                    unit={route.endpoint?.unit}
                    renderItem={({ item, index }) => <ItemRenderer unitType={unitType} route={route} numColumns={numColumns} item={item} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />}
                    ListFooterComponent={
                        <View>
                            {(hasNextPage && isFetchingNextPage) ? (
                                Preload
                            ) : null}
                        </View>
                    }
                />
            }, [dataItems]);
            //
            let sidebarUnitType = 'default';
            if (route.blocks?.browse_sidebar?.unitType) {
                sidebarUnitType = route.blocks.browse_sidebar.unitType
            }
            //border-r border-bdr dark:border-bdr-d border-dashed
            return (
                <Row style={{ paddingTop: header ? 0 : 0 }} className={headerSettings.columns == "reverse" ? 'flex-row-reverse' : ''}>
                    <View className={(isRightCol ? 'flex-auto border-r border-bdr dark:border-bdr-d border-dashed' : 'w-full p-2') + (layoutName == 'navigator' ? '' : ' pt-4')}>
                        {dataItems.length > 0 ? TabFlashListM : (rqtStatus != 'success' && route?.endpoint?.request_url ? Preload : appStatic('components_content_empty'))}
                    </View>
                    {isRightCol && <View className="hidden xl:block w-80 2xl:w-96  ">
                        <View className="fixed-process w-80 2xl:w-96 px-4 pt-4">
                            {route?.sidebar?.content.map((item, index) => {
                                return <ItemRenderer unitType={sidebarUnitType} key={'item' + index} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} />
                            })}
                            <BlockByName data={data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1} />
                        </View>
                    </View>}
                </Row>
            )
        }

    };

    useEffect(() => {
        if (getNumCols(cntWidth) != numColumns)
            setNumColumns(getNumCols(cntWidth));
    }, [cntWidth]);

    const handleLayoutTop = (event) => {
        setCntWidth(event.nativeEvent.layout.width)

    };

    const leftSideBarObj = useCallback(() => {
        const menuSettings = appSetting('menu_items', menu.object);
        const addButtons = menuSettings?.add?.map((button) => {

            let btn = undefined;
            if (button.section)
                btn = <Search section={button.section} params={{ trigger: { size: 'sm' } }} />
            else {
                btn = <Button title={t(button.title)} startDecorator={button.icon} variant="outline" rounded size="sm" />;
                btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
            }

            return (
                <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
            )
        });
        return <LeftSidebar title={t(menuSettings?.name)} addButtons={addButtons}>
            {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                    let settings = appSetting('layouts', a.key)
                    let icon = !a.ident ? (settings?.icon ? settings?.icon : a?.icon) : a.icon;
                    return (
                        <Link href={a.key} key={`lmenu-${a.index}`} alt={a.title}>
                            <Pressable className={a.ident ? 'pl-10' : ''} onPress={(event) => {
                                setIndex(a.index);
                                window.history.pushState({}, '', a.key);
                                event.preventDefault()
                            }}>
                                <Button
                                    variant={a.index == index ? 'outline' : "text"}
                                    size={!a.ident ? "base" : "sm"}
                                    pressed={a.index == index ? true : false}
                                    fullWidth
                                    title={(a.title)}
                                    align="start"
                                    startDecorator={icon}
                                    addon={a.addon}
                                />
                            </Pressable>
                        </Link>
                    )
                })}
            </LeftSidebar>
    }, [routes, index]);

    if (leftSideBar) {
        return (
            <View className={appSetting('layout', 'max_width') + " w-full h-full mx-auto"} scrollEnabled={false} onLayout={handleLayoutTop}>
                <MainMenu items={menu_drawer_items} showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-[114px]  w-full" />
                {headerObj}
                <Toaster ref={toasterRef} onPress={showNewContent} variant="primary" title="New content" size="sm" />
                <View style={{ minHeight: (windowHeight - 64) }} className={appSetting('layout', 'max_width  ') + '  mx-auto w-full '} >
                    <Row>
                        <View style={{ minHeight: (windowHeight - 64) }} className={'hidden lg:block w-80  border-r  border-dashed border-bdr dark:border-bdr-d  fixed lg:relative top-0 z-50'}>
                            {leftSideBarObj()}
                        </View>
                        <View className=" flex-auto">{/*min-h-screen???*/}
                            <RenderScene route={currentRoute} />
                        </View>
                    </Row>
                </View>
            </View>
        );
    }
    return (
        <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            <MainMenu showMenu={showMenu} items={menu_drawer_items} menuPopup={menuPopup} cssClass="lg:hidden absolute z-50 top-[115px] w-full" />
            {headerObj}
            <Toaster ref={toasterRef} onPress={showNewContent} variant="primary" title="New content" size="sm" />
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full min-h-screen'}>
                <RenderScene route={currentRoute} />
            </View>
        </View>
    );
}
function ConductorMenu({ routes, index, t, setIndex, getNumCols, windowWidth, onChangeRoute }) {
    let filteredItems = routes.filter((aItem) => aItem.hideInTop != true)

    const MenuItem = memo(({ item:a, itemRefs, index:index2, visibleItemsCount }) => {
        return (
            <Pressable  ref={el => itemRefs.current[index2] = el} className={" py-2 items-center " + a?.menu_settings?.class + (index2 > visibleItemsCount - 1 ? ' item-overlap ' : '')}
                key={`tab-${index2}`}
                onPress={() => {
                    setIndex(a.index);
                    getNumCols(windowWidth)
                    window.history.pushState({}, '', '/' + a.key);
                    if (onChangeRoute) {
                        onChangeRoute(a);
                    }
                }}
            >
                <Button fullWidth={true} id="tab" pressed={a.index == index ? true : false} variant={a.index == index ? 'outline' : "text"} rounded size='sm' title={t(a.title)} addon={a.addon} />
            </Pressable>
        )
    });

    const MenuItemEx = memo(({ item:a , index:index2 }) => {
     
        return (
            <Pressable className={" py-2 items-center " + a?.menu_settings?.class}
                key={`tab-${a.index}`}
                onPress={() => {
                    setNtfsOpen(false)
                    setIndex(a.index);
                    getNumCols(windowWidth)
                    window.history.pushState({}, '', '/' + a.key);
                    if (onChangeRoute) {
                        onChangeRoute(a);
                    }
                }}
            >
                <Button fullWidth={true} id="tab" pressed={a.index == index ? true : false} variant={a.index == index ? 'outline' : "text"} rounded size='sm' title={t(a.title)} addon={a.addon} />
            </Pressable>
        )
    });

    const ButtonEx = memo(() => {
        return <View key="btn" className='ml-2'><Button variant="text" size="sm" rounded startDecorator="DotsThreeOutline" /></View>;
    });
    
    return <DynamicMenu 
        name = "main-menu"
        ButtonEx={ButtonEx} 
        MenuItemEx={MenuItemEx} 
        MenuItem={MenuItem} 
        containerClasses = "w-full" 
        items={filteredItems} 
        isButtonOutside = {false}
        menuClasses = "mr-auto ml-3 sm:ml-4 gap-x-2 flex-row"  
        menuExClasses ="mr-auto ml-3 sm:ml-4 items-end"
        />
}