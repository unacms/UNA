import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, getLayout, handleFeedLayoutData, menuItemsByName, getMenuSettings } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer,ItemRendererMemo, LeftSidebar, TopSidebar, getNumCols } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { Input } from 'app/design/controls'
import MenuDrawer from 'app/components/nav/menu-drawer'
import { useTranslation } from 'react-i18next';
import Toaster from 'app/ui/atoms/toaster';
import { useLayoutData } from 'app/context/layout';
import { useCurrentUser } from 'app/context/user'
import Dropdown from 'app/ui/atoms/dropdown'
import Search from 'app/ui/molecules/search';
import Location from 'app/components/form-fields/location'
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { storageClear, menuItemsFilter, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import Footer from 'app/components/nav/footer';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { callFn } from 'app/lib/functions/call';


const conductorTheme = appSetting('theme', 'conductor');

const AddBlocks = (leftSideBarBlocks, data, onFormSubmit, onFormChangedValues) => {
    if (!leftSideBarBlocks)
        return null;

    let leftSideBarBlocksObj = leftSideBarBlocks.map((block) => {
       
        return <BlockByName
            data={data}
            name={block}
           //onFormSubmit={onFormSubmit}
            //saveOnChanges={true}
            onChange={onFormChangedValues}
        />
    });

    return <>
        {(leftSideBarBlocksObj?.length > 0 ) && 
            <View className="my-3 mx-2 ">
                {leftSideBarBlocksObj.map((block, index) => {
                    return <View key={"lb-" + index}>{block}</View>
                })}
            </View>
        }
    </>
};

export function Conductor({ header, smallHeader, menu, data, blocks, useSectionAsMenu, leftSideBar, leftSideBarBlocks, leftSideBarWidth = ' w-80 2xl:w-96 ', skeleton = '', onChangeRoute, keyword, cover, layoutName }) {

    const { currentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const { layoutData } = useLayoutData();
    const { t } = useTranslation();
    let uniRef = useRef();
    const [menuPopup, setMenuPopup] = useState(false)
    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }

    const toasterRef2 = useRef();

    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [routes, setRoutes] = useState(initedTabs);
    const [cntWidth, setCntWidth] = useState(0);
    const [isRevalidate, setIsRevalidate] = useState(false);
    const isDrawer = menuItemsByName('main_menu', appSetting('menu_items', 'menu_drawer'), currentUser).length > 0;

    useEffect(() => {
        setRoutes(initedTabs);
    }, [keyword, data.url, data.elements]);


    const scrollValue = useSharedValue(1);
    //const { colors } = Theme();
    const [index, setIndex] = useState(() => {
        const foundIndex = routes.findIndex(function (item) {
          if (useSectionAsMenu) {
            return data.url === item.key;
          } else {
            return data.url === item.key;  // for links like /events
            // return (data.url).includes(item.key);  // Uncomment if needed
          }
        });
        return foundIndex !== -1 ? foundIndex : 0;
    });


    const currentRoute = routes.find((item) => item.index === index);
    let headerSettings = getHeaderSettings(getURI(currentRoute?.key), windowWidth, layoutName, currentRoute.config);


    useEffect(() => {
        if (currentRoute.cached){
            revalidateData();

        }
        if (currentRoute?.endpoint?.unit == 'feed'){
            subscribe('bx_timeline_0', 'added', setIsRevalidate);
            subscribe('bx_timeline_0', 'deleted', setIsRevalidate);
        }
    }, []);

    useEffect(() => {
        if (isRevalidate)
            revalidateData();
    }, [isRevalidate]);

    useEffect(() => {
        const numColumnsN = getNumCols(windowWidth, currentRoute, leftSideBar);
        if (numColumnsN != numColumns) {
            setNumColumns(numColumnsN);
        }
    }, [cntWidth, currentRoute]);

    /* UPDATE CONTENT PART */
    useEffect(() => {
        setToaster2Visible(false);
    }, [index]);

    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
    }

    const revalidateData =  useCallback(async () => {
        const hasEndpoint = Boolean(currentRoute?.endpoint);
        let endpointUpdateContent = '';
        let bUpdateContent = false;
        const revalidatedData = JSON.parse(isRevalidate);
    
        if (hasEndpoint) {
    
            const a = [...new Set(currentRoute.data
                .filter(item => item.type !== 'block')
                .map(item => item.id)
            )].slice(0, 10).join(',');

            if ((a || true) && revalidatedData.author_id != currentUser?.id &&  !currentRoute.endpoint.request_url.includes("system/get_results/TemplSearchExtendedServices")) {
                endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                    'params': { ...currentRoute.endpoint.params, validate: a }
                });
                bUpdateContent = true;
            }
        }
        if (bUpdateContent){
            const validatedData = (await fetcher(endpointUpdateContent)).data?.[0]?.data?.data;

            if (validatedData && (validatedData == 'valid' || validatedData == 'invalid')) {
                setToaster2Visible(validatedData !== 'valid');
            }
        }
    }, [currentRoute, isRevalidate, currentUser?.id]);

    const showNewContent2 = async () => {
        storageClear('ul:data', currentRoute.storageKeyValue)
        storageClear('ul:state', currentRoute.storageKeyValue)

        const newRoutes = [...routes];
        newRoutes[index].endpoint.finished = false;
        newRoutes[index].data = newRoutes[index].data.filter(item => item.type === 'block');;
        newRoutes[index].endpoint.params.start = 0;
        setRoutes(newRoutes);
        setToaster2Visible(false);
        // uniRef.current.scrollToIndex({ animated: true, index: -1 });

    }
    /* UPDATE CONTENT PART */
    //console.log("currentRoutecurrentRoute", currentRoute.endpoint?.request_url,layoutData?.data?.action?.a, layoutData?.data?.action?.o )
    /* NEW POST TO FEED */
    useEffect(() => {
        if (currentRoute.endpoint?.unit === 'feed' && layoutData && layoutData.data && (layoutData?.type == 'feed:new_content' || layoutData?.type == 'feed:remove_content')) {
            let clonedData = currentRoute.data
            const data = handleFeedLayoutData(layoutData, clonedData)
            const newRoutes = [...routes];
            newRoutes[index].data = data
            setRoutes(newRoutes);
        }
        callFn("updateRouteDataForConnections", [currentRoute, layoutData, routes, index, setRoutes])
        
    }, [layoutData]);
    /* NEW POST TO FEED */

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

    

    const queryKey = [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters), data.uri];
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth, currentRoute, leftSideBar));
    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,

    } = useInfiniteQuery({
        queryKey: queryKey,
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
        const baseScroll = windowWidth < LAYOUT_BREAKPOINTS.lg ? 280 : offset;
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


    const onFormChangedValues = useCallback((values) => {
        let filterValues = [];
        for (let key in values) {
            filterValues.push({name: key, value: Array.isArray(values[key])?values[key].join(','):values[key]})
        };

        setFilterValue(filterValues)
        setBottomSheetData(false);
    }, []);


    const onFormSubmit = useCallback((formData, d) => {
        onFormChangedValues(d);
    }, []);



    //console.log("setFilterValue", routes[index].endpoint.filters)

    const handleEndReached = useCallback(async (lastItemIndex) => {
        if (isFetchingNextPage)
            return;
        if (!hasNextPage === false)
            return;
        if (currentRoute?.endpoint?.finished)
            return;
        if (lastItemIndex == false)
            return;
        fetchNextPage();
    }, [routes, index, isFetchingNextPage, hasNextPage]);

    let offset = header ? (windowWidth < LAYOUT_BREAKPOINTS.lg ? 400 : 400) : 50;
    if (cover == 'min' && header > 50) {
        offset = windowWidth < LAYOUT_BREAKPOINTS.lg ? 80 : 200
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
        if (!appSetting('cover', 'fixed'))
            window.addEventListener('scroll', handleScroll);
        if (appSetting('cover', 'scroll'))
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

        if (routes.length > 1) {
            //const menuSettings = appSetting('menu_items', menu.object);
            const menuSettings = getMenuSettings(menu.object, menu.config);
            let addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
            addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);

            const addButtons = addButtonsSet?.map((button) => {
                let btn = undefined;
                if (button.section)
                    btn = <Search section={button.section} />
                else {
                    btn = <Button title={button.title} startDecorator={button.icon} variant="secondary" rounded />;
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
                <TopSidebar isDrawer={isDrawer} isWeb={true} style={styles} leftSideBar={leftSideBar} header={header} headerSettings={headerSettings} addButtons={addButtons} isSmall={isSmall} showMenu={showMenu} layout={getLayout(currentUser)} title={t(menuSettings?.name)} >
                    <ConductorMenu leftSideBar={leftSideBar} routes={routes} index={index} t={t} setIndex={setIndex} getNumCols={getNumCols} windowWidth={windowWidth} onChangeRoute={onChangeRoute} />
                </TopSidebar>

            )
        }
    };

    const renderHeader = useCallback((tabBarObj, tabBarObjSmall) => {
        const tOffset = getLayout(currentUser) == 'ver' ? 0 : 63;
        if (!header && !smallHeader){
            return (
                <><View style={{ position: 'fixed', width: cntWidth + 'px', overflow: 'hidden', zIndex: 40, top: windowWidth >= LAYOUT_BREAKPOINTS.lg ? tOffset : 0 }}>
                    {tabBarObj}
                </View><View className="h-28 w-full lg:hidden"></View></>
            )
        }

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
                zIndex: scrollValue.value ? 40 : 45
            };
        }, [scrollValue]);

        
      
        return (
            <>
                <Animated.View style={[{ width: cntWidth + 'px', position: 'fixed', overflow: 'hidden', zIndex: 40, top: windowWidth >= LAYOUT_BREAKPOINTS.lg ? tOffset : 0 }, animatedStyle6]}>
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
    }, [windowWidth, currentUser, cntWidth, header, smallHeader]);

    const RenderScene = useCallback(({ route, status }) => {
        const filters = appSetting('conductor', 'hide_browse_filter') ? null : route?.endpoint?.filters;
        const counter = appSetting('conductor', 'show_nav_counters') ? 0 : route.addon ? (route.addon.text ? route.addon.text : route.addon) : 0;
        const isTitle = appSetting('conductor', 'show_nav_titles');
        return (
            <>
                {callFn("getFiltersForConductor", [filters, setFilterValue, route?.endpoint?.params?.filters])}
                {counter > 0 && <View className="mx-4 mb-0 mt-2"><Text className="text-xl font-bold text-neutral-800  dark:text-neutral-200 ">{route.title} ({counter})</Text></View>}
                {isTitle && <View className={`${conductorTheme.content_max_width} mx-auto w-full mt-4 px-4`}><Text className="text-2xl font-bold text-neutral-800  dark:text-neutral-200 ">{route.title}</Text></View>}
                <TabScene status={status} route={route} width={windowWidth} index={index} />
            </>
        )
    }
        , [numColumns, windowWidth, index]);

    const TabFlashList = React.forwardRef((props, ref) => {

        if (props.data.length == 1 && !props.endpoint) {
            let a = props.data.map((item, index) => {
                return <View className={appSetting('layout', 'max_width_block') + " mx-auto w-full"} key={"tab-" + index}><ItemRendererMemo route={props.route} key={'item' + index} numColumns={1} item={item} /></View>
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
   // const tabBarObjSmall = renderTabBar(true);
    const headerObj = renderHeader(tabBarObj, tabBarObj/*tabBarObjSmall*/);

    const TabScene = ({ route, width, status }) => {
        const dataItems = route?.data
        //let b = useMemo(() => {

        if (!route.inited) {
            return <></>
        }
        if (route.inited) {
            let unitType = getUnitModeBySource(route?.endpoint)
            if (unitType == 'default')
                unitType = getUnitType(route);

            let sSkeleton = route?.endpoint?.module ? route?.endpoint?.module : route?.endpoint?.unit
            if (skeleton)
                sSkeleton = skeleton;

            if (unitType)
                sSkeleton = [sSkeleton, unitType];

            const Preload = getSkeletonForList(sSkeleton, numColumns);

            let isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar;

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
            }, [dataItems, numColumns, dataItems.length]);
            /* const TabFlashListM = <TabFlashList
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
             />*/
            //
            let sidebarUnitType = 'default';
            if (route.blocks?.browse_sidebar?.unitType) {
                sidebarUnitType = route.blocks.browse_sidebar.unitType
            }
            return (
                <Row style={{ paddingTop: header ? 0 : 0 }} className={(headerSettings.columns == "reverse" ? 'flex-row-reverse' : '') + conductorTheme.content_max_width + '  mx-auto w-full'}>
                    <View className={(isRightCol ? 'flex-auto sm:border-r border-bdr dark:border-bdr-d px-4 flex-auto ' : ' w-full mx-auto sm:p-2 ') + (layoutName == 'navigator' ? '' : ' pt-4')}>
                        {TabFlashListM}
                        {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.length == 0 &&  callFn("noContentByUrl", [route?.endpoint])))}


                    </View>
                    {isRightCol && <View className="hidden xl:flex flex-auto max-w-md ">
                        <View className={`${conductorTheme.right_column_cnt}`}>
                            {route?.sidebar?.content.map((item, index) => {
                                return <View className="mb-4" key={'item' + index}><ItemRenderer unitType={sidebarUnitType}  route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} /></View>
                            })}
                            <BlockByName data={route.pageData ? route.pageData : data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1} />
                        </View>
                    </View>}
                </Row>
            )
        }
    };

    const handleLayoutTop = (event) => {
        setCntWidth(event.nativeEvent.layout.width)

    };

    const AddBlocksCnt = useMemo(() => AddBlocks(leftSideBarBlocks, data, onFormSubmit, onFormChangedValues), [leftSideBarBlocks, data, onFormSubmit, onFormChangedValues]);
    
    const leftSideBarObj = useCallback(() => {
        /*const renderForm = (formProps, onFormChange) => {
            return (
                <Form {...formProps} key="form" name={formProps.name} onChange={onFormChange} />
            )
        }*/

        //const menuSettings = appSetting('menu_items', menu.object);
        const menuSettings = getMenuSettings(menu.object, menu.config);
        const addButtons = menuSettings?.add?.filter(item => item.hideInSideBar !== true).map((button) => {

            let btn = undefined;
            if (button.section)
                btn = <Search section={button.section} params={{ trigger: { size: 'sm' } }} />
            else {
                btn = <Button title={t(button.title)} startDecorator={button.icon} variant="secondary" rounded size="sm" />;
                btn = button.link ? <Link href={button.link} >{btn}</Link> : btn
            }

            return (
                <View className="ml-2 " key={`add-${button.icon}`} >{btn}</View>
            )
        });
        return (
            <>
                <LeftSidebar title={t(menuSettings?.name)} addButtons={addButtons} width={leftSideBarWidth}>
                    {headerSettings.hideLeftmenu != true && routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                        const btn = callFn('getButtonForConductor', [a, index, currentUser])
                        
                        if (a?.icon == '*') {
                            return (
                                <Link href={a.link} key={`lmenu-${a.index}`} alt={a.title}>
                                    {btn}
                                </Link>
                            );
                        }
                        return (
                            <Link href={a.key} key={`lmenu-${a.index}`} alt={a.title}>
                                <Pressable className={a.ident ? 'pl-10' : ''} onPress={(event) => {
                                    setIndex(a.index);
                                    window.history.pushState({}, '', a.key);
                                    event.preventDefault()
                                }}>
                                    {btn}
                                </Pressable>
                            </Link>
                        )
                    })}
                    {AddBlocksCnt}
                    
                </LeftSidebar>

            </>
        )
    }, [routes, index, currentUser, windowWidth]);

    const topSideBarObj = useCallback(() => {
        return <Row className="w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex">
            {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {

                let btn = <Button
                    variant={a.index == index ? 'secondary' : "text"}
                    size={!a.ident ? "base" : "sm"}
                    pressed={a.index == index ? true : false}

                    title={(a.title)}
                    align="start"

                    addon={!appSetting('conductor', 'show_nav_counters') && a.addon ? null : a.addon}
                />

                return (
                    <Pressable className={" pb-3 pt-1 items-center "}
                        key={`tab-${a.index}`}
                        onPress={() => {
                            setIndex(a.index);
                            getNumCols(windowWidth, currentRoute, leftSideBar)
                            window.history.pushState({}, '', '/' + a.key);
                            if (onChangeRoute) {
                                onChangeRoute(a);
                            }
                        }}
                    >
                        {btn}
                    </Pressable>
                )
            })}
        </Row>

    }, [routes, index]);

    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: AddBlocksCnt, showClose: true, snapPoints: ['60%', '60%'] });
    }, [leftSideBarBlocks, data, onFormSubmit]);

    if (leftSideBar) {
        const offset = 64
        return (
            <View className={appSetting('layout', 'max_width') + " w-full h-full mx-auto"} scrollEnabled={false} onLayout={handleLayoutTop}>
                {headerObj}
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-14  w-full" />
                {/*<Toaster ref={toasterRef} onPress={showNewContent} variant="primary" title="New content" size="sm" />*/}
                <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
                <View style={{ minHeight: (windowHeight - offset) }} className={appSetting('layout', 'max_width  ') + ' mx-auto w-full '} >
                    <Row>
                        <View style={{ minHeight: (windowHeight - offset) }} className={leftSideBarWidth + ' hidden lg:block border-r border-bdrnavbar dark:border-bdrnavbar-d bg-bgrnavbar dark:bg-bgrnavbar-d fixed lg:relative top-0 z-50'}>
                            {leftSideBarObj()}
                        </View>
                        <View className=" flex-auto">{/*min-h-screen???*/}
                            {(headerSettings.showAltTopMenu) && topSideBarObj()}
                            
                            {(windowWidth < LAYOUT_BREAKPOINTS.lg && layoutName == 'navigator' && leftSideBarBlocks.length > 0) && <View className="items-start ml-2 mt-2">
                                <Button title="Filters"  variant="default" size="sm" rounded onPress={showFilters} />
                            </View>}

                            <RenderScene route={currentRoute} />
                        </View>
                    </Row>
                </View>
                <Footer />
            </View>
        );
    }
    return (
        <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            {headerObj}
            <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-16 w-full" />
            <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
            <View className={`${conductorTheme.content_max_width} mx-auto w-full min-h-screen`}>
                <RenderScene route={currentRoute} />
            </View>
            <Footer />
        </View>
    );
}

function ConductorMenu({ routes, index, t, setIndex, getNumCols, windowWidth, onChangeRoute, leftSideBar }) {

    const name="cnd-main-menu"
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses=conductorTheme.menu_cnt
    
    const MenuItem = memo(({ item: a, itemRefs, index: index2, visibleItemsCount }) => {
        const { currentUser } = useCurrentUser();
        const btn = callFn('getButtonForConductorSmall', [a, index, currentUser])
        return (
            <Pressable ref={el => (itemRefs?.current ? (itemRefs.current[index2] = el) : (el = null))} className={" py-2 items-center " + a?.menu_settings?.class + (index2 > visibleItemsCount - 1 ? ' item-overlap ' : '')}
                key={`tab-${index2}`}
                onPress={() => {
                    setIndex(a.index);
                    getNumCols(windowWidth, routes[index], leftSideBar)
                    window.history.pushState({}, '', '/' + a.key);
                    if (onChangeRoute) {
                        onChangeRoute(a);
                    }
                }}
            >
                {btn}
            </Pressable>
        )
    });

    if (!conductorTheme.menu_is_dynamic){
        return (
                <View className={menuClasses} >
                    {
                        filteredItems.map((aItem, iKey) => {
                            return <MenuItem key={name +'menu'+ iKey} item={aItem} index={iKey} />
                        })
                    }
                </View>
        );
    }

    const MenuItemEx = memo(({ item, index }) => {
        const { title, addon, icon, link, menu_settings, key } = item;
        const translatedTitle = <Text>{t(title)}</Text>;
        const { currentUser } = useCurrentUser();
        let addonContent = callFn("getAddonForConductor", [item, index, currentUser])

        const handlePress = () => {
            setIndex(index);
            getNumCols(windowWidth, routes[index], leftSideBar);
            window.history.pushState({}, '', '/' + key);
            if (onChangeRoute) {
                onChangeRoute(item);
            }
        };

        if (icon === '*') {
            return <Link href={link}><Row className="justify-between items-center min-w-[200px]">{translatedTitle} {addonContent}</Row></Link>;
        }

        return (
            <Pressable
                className={' px-3 py-2.5 ' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="justify-between items-center min-w-[200px]">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        );
    });

    const ButtonEx = memo(({ visibleItemsCount }) => {
        return <View key="btn" className='ml-1 py-2 '><Button title={'More...'} variant={visibleItemsCount <= index ? 'secondary' : "text"} pressed={visibleItemsCount <= index ? true : false} size="sm" /></View>;
    });

    return <DynamicMenu
        name={name}
        offsetWidth={120}
        ButtonEx={ButtonEx}
        MenuItemEx={MenuItemEx}
        MenuItem={MenuItem}
        containerClasses="w-full"
        items={filteredItems}
        isButtonOutside={false}
        menuClasses={menuClasses}
        menuExClasses="mr-auto ml-4 items-end"
    />
}