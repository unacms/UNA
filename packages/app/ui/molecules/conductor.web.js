import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { StyleSheet, useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, getLayout, handleFeedLayoutData, menuItemsByName } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, LeftSidebar, TopSidebar } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { appStatic } from 'app/lib/app-static';
import { Input } from 'app/design/controls'
import MenuDrawer from 'app/components/nav/menu-drawer'
import { useTranslation } from 'react-i18next';
import Toaster from 'app/ui/atoms/toaster';
import useDaemon from 'app/lib/hooks/daemon'
import { useLayoutData } from 'app/context/layout';
import { useCurrentUser } from 'app/context/user'
import Dropdown from 'app/ui/atoms/dropdown'
import Search from 'app/ui/molecules/search';
import Location from 'app/components/form-fields/location'
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { storageClear, menuItemsFilter } from 'app/lib/util';
import Footer from 'app/components/nav/footer';

function AddBlocks({leftSideBarBlocks, data, onFormSubmit})
{
    const windowDimen = useWindowDimensions();
    const windowWidth = windowDimen.width;
    const [show, setShow] = useState(false);

    let leftSideBarBlocksObj = leftSideBarBlocks.map((block) => {
        return <BlockByName
            data={data}
            name={block}
            onFormSubmit={onFormSubmit}
            saveOnChanges={true}
        />
    });

    return <>
        {leftSideBarBlocksObj?.length > 0 &&
            <>
            {windowWidth < 1024 && <View className="items-start ml-4 mt-2">
                <Button title={show ?"Hide filters": "Show filters"}  variant="outline" rounded onPress={() =>{setShow(!show)}} />
            </View>}
            {(show || windowWidth>=1024) && <View className="my-3 mx-2 ">
                {leftSideBarBlocksObj.map((block, index) => {
                    return <View key={"lb-" + index}>{block}</View>
                })}
            </View>}
            </>
        }
    </>
}

export function Conductor({ header, smallHeader, menu, data, blocks, useSectionAsMenu, leftSideBar, leftSideBarBlocks, leftSideBarWidth = 'w-80', skeleton = '', onChangeRoute, keyword, cover, layoutName }) {
    const { currentUser } = useCurrentUser();
    const { layoutData } = useLayoutData();
    const { t } = useTranslation();
    let uniRef = useRef();
    const [menuPopup, setMenuPopup] = useState(false)
    const showMenu = (params) => {
        setMenuPopup(!menuPopup)
    }
    console.log("layoutDatalayoutData", layoutData)
    //const [maxId, setMaxId] = useState(0);
    //const toasterRef = useRef();
    const toasterRef2 = useRef();

    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);

    const windowDimen = useWindowDimensions();
    const windowWidth = windowDimen.width;
    const windowHeight = windowDimen.height;
    const [routes, setRoutes] = useState(initedTabs);
    const [cntWidth, setCntWidth] = useState(0);

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

    //let maxIdLocal = 0;
    const currentRoute = routes.find((item) => item.index === index);

    let headerSettings = getHeaderSettings(getURI(currentRoute?.key), windowWidth, layoutName);

    /* DAEMON PART */
    /*const setToasterVisible = (val) => {
        const current = toasterRef.current;
        if (current) {
            current.setVisible(val);
        }
    }
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

    }*/
    /* DAEMON PART */

    useEffect(() => {
        if (getNumCols(cntWidth) != numColumns) {
            setNumColumns(getNumCols(cntWidth));
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

    const hasEndpoint = Boolean(currentRoute?.endpoint);
    let endpointUpdateContent = '';
    let bUpdateContent = false;

    if (hasEndpoint) {
        const a = [...new Set(currentRoute.data
            .filter(item => item.type !== 'block')
            .map(item => item.id)
        )].slice(0, 10).join(',');
        if (a || true) {
            endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                'params': { ...currentRoute.endpoint.params, validate: a }
            });
            bUpdateContent = true;
        }
    }

    const { daemonData, daemonUrl } = useDaemon(endpointUpdateContent, false, bUpdateContent, 10000);

    useEffect(() => {
        if (daemonUrl == endpointUpdateContent) {
            if (daemonData) {
                const data = daemonData?.[0]?.data?.data;
                if (data && (data == 'valid' || data == 'invalid')) {
                    setToaster2Visible(data !== 'valid');
                }
            }
            else {
                setToaster2Visible(false);
            }
        }
    }, [daemonData, daemonUrl]);

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

    /* NEW POST TO FEED */
    useEffect(() => {
        if (currentRoute.endpoint?.unit === 'feed' && layoutData && layoutData.data && (layoutData?.type == 'feed:new_content' || layoutData?.type == 'feed:remove_content')) {
            let clonedData = currentRoute.data
            const data = handleFeedLayoutData(layoutData, clonedData)
            const newRoutes = [...routes];
            newRoutes[index].data = data
            setRoutes(newRoutes);
        }
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

    const getNumCols = (width) => {

        let blocksroutes = currentRoute?.blocks;
        width = windowWidth;
        // if (!blocksroutes)
        //    return 1;
        if (blocksroutes) {
            const blockKeys = Object.keys(blocksroutes);
            for (const key of blockKeys) {
                if (blocksroutes[key].perLine > 0 && width> 640) {
                    return blocksroutes[key].perLine;
                }
            }
        }

        let perLineSettings = appSetting('browse', 'per_line');
        if (currentRoute?.endpoint?.request_url.includes('TemplServiceProfiles') || currentRoute?.endpoint?.unit.includes('-profile-') || currentRoute?.endpoint?.unit.includes('-context-')) {
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

    const queryKey = [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)];
    const queryClient = useQueryClient();
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth));
    const {
        status: rqtStatus,
        data: newData,
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


    const onFormSubmit = useCallback((formData, d) => {
        let filterValues = [];
        for (let key in d) {
            filterValues.push({name: key, value: Array.isArray(d[key])?d[key].join(','):d[key]})
        };
        setFilterValue(filterValues)

    });

    const MemoAddBlocks = React.memo(AddBlocks);

    

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
            let addButtonsSet = menuSettings?.add?.filter(item => item.hideInTopBar !== true);
            addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);
            /* if (!currentUser) {
                 addButtonsSet = addButtonsSet?.filter(item => item.nonlogged !== false && item.nonoperator !== false );
             }*/
            const addButtons = addButtonsSet?.map((button) => {
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
                <TopSidebar isDrawer={isDrawer} isWeb={true} style={styles} leftSideBar={leftSideBar} header={header} headerSettings={headerSettings} addButtons={addButtons} isSmall={isSmall} showMenu={showMenu} layout={getLayout(currentUser)} title={t(menuSettings?.name)} >
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
                zIndex: scrollValue.value ? 40 : 45
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
        const counter = appSetting('layout', 'show_nav_counters') ? 0 : route.addon ? (route.addon.text ? route.addon.text : route.addon) : 0;
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
                {counter > 0 && <View className="mx-4 mb-0 mt-2"><Text className="text-lg font-bold text-neutral-800  dark:text-neutral-200 ">{route.title} ({counter})</Text></View>}
                <TabScene status={status} route={route} width={windowWidth} index={index} />
            </>
        )
    }
        , [numColumns, windowWidth, rqtStatus, index]);

    const TabFlashList = React.forwardRef((props, ref) => {

        /*if (getNumCols(0) != numColumns)
            setNumColumns(getNumCols(0));
*/
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

        if (!route.inited) {
            return <></>
        }
        if (route.inited) {
            let unitType = getUnitModeBySource(route?.endpoint?.request_url)
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
                <Row style={{ paddingTop: header ? 0 : 0 }} className={headerSettings.columns == "reverse" ? 'flex-row-reverse' : ''}>
                    <View className={(isRightCol ? 'flex-auto sm:border-r border-bdr dark:border-bdr-d ' : 'w-full sm:p-2 ') + (layoutName == 'navigator' ? '' : ' pt-4')}>
                        {TabFlashListM}
                        {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.length == 0 && appStatic('components_content_empty')))}


                    </View>
                    {isRightCol && <View className="hidden xl:block w-80 xl:w-96  ">
                        <View className="fixed-process w-80 xl:w-96 p-4">
                            {route?.sidebar?.content.map((item, index) => {
                                return <ItemRenderer unitType={sidebarUnitType} key={'item' + index} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} />
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


    const leftSideBarObj = useCallback(() => {

        const menuSettings = appSetting('menu_items', menu.object);
        const addButtons = menuSettings?.add?.filter(item => item.hideInSideBar !== true).map((button) => {

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
        return (
            <>
                <LeftSidebar title={t(menuSettings?.name)} addButtons={addButtons} width={leftSideBarWidth}>
                    {headerSettings.hideLeftmenu != true && routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
                        let settings = appSetting('layouts', a.key)
                        let icon = !a.ident ? (settings?.icon ? settings?.icon : a?.icon.replace('*', '')) : a.icon.replace('*', '');
                        let btn = <Button
                            variant={a.index == index ? 'outline' : "text"}
                            size={!a.ident ? "base" : "sm"}
                            pressed={a.index == index ? true : false}
                            fullWidth
                            title={(a.title)}
                            align="start"
                            startDecorator={icon}
                            addon={!appSetting('layout', 'show_nav_counters') && a.addon ? null : a.addon}
                        />
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
                    <MemoAddBlocks leftSideBarBlocks={leftSideBarBlocks} data={data} onFormSubmit={onFormSubmit}/>
                    
                </LeftSidebar>

            </>
        )
    }, [routes, index]);

    const topSideBarObj = useCallback(() => {
        return <Row className="w-full px-8 pt-6 items-stretch justify-stretch sticky z-50 t-8 gap-x-8 hidden lg:flex">
            {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {

                let btn = <Button
                    variant={a.index == index ? 'outline' : "text"}
                    size={!a.ident ? "base" : "sm"}
                    pressed={a.index == index ? true : false}

                    title={(a.title)}
                    align="start"

                    addon={!appSetting('layout', 'show_nav_counters') && a.addon ? null : a.addon}
                />

                return (
                    <Pressable className={" py-2 items-center "}
                        key={`tab-${a.index}`}
                        onPress={() => {
                            setIndex(a.index);
                            getNumCols(windowWidth)
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

    if (leftSideBar) {
        return (
            <View className={appSetting('layout', 'max_width') + " w-full h-full mx-auto"} scrollEnabled={false} onLayout={handleLayoutTop}>
                {headerObj}
                <MenuDrawer showMenu={showMenu} menuPopup={menuPopup} cssClass="lg:hidden fixed z-50 top-16  w-full" />
                {/*<Toaster ref={toasterRef} onPress={showNewContent} variant="primary" title="New content" size="sm" />*/}
                <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="New content" size="sm" />
                <View style={{ minHeight: (windowHeight - 64) }} className={appSetting('layout', 'max_width  ') + '  mx-auto w-full '} >
                    <Row>
                        <View style={{ minHeight: (windowHeight - 64) }} className={leftSideBarWidth + ' hidden lg:block border-r border-bdr dark:border-bdr-d  fixed lg:relative top-0 z-50'}>
                            {leftSideBarObj()}
                        </View>
                        <View className=" flex-auto">{/*min-h-screen???*/}
                            {(headerSettings.showAltTopMenu) && topSideBarObj()}
                            <View className="lg:hidden">
                                <MemoAddBlocks leftSideBarBlocks={leftSideBarBlocks} data={data} onFormSubmit={onFormSubmit}/>
                            </View>
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
            <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="New content" size="sm" />
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full min-h-screen'}>

                <RenderScene route={currentRoute} />
            </View>
            <Footer />
        </View>
    );
}
function ConductorMenu({ routes, index, t, setIndex, getNumCols, windowWidth, onChangeRoute }) {

    let filteredItems = routes.filter((aItem) => aItem.hideInTop != true)

    const MenuItem = memo(({ item: a, itemRefs, index: index2, visibleItemsCount }) => {
        const btn = <Button fullWidth={true} id="tab" pressed={a.index == index ? true : false} variant={a.index == index ? 'outline' : "text"} rounded size='sm' title={t(a.title)} addon={!appSetting('layout', 'show_nav_counters') && a.addon ? null : a.addon} />
        if (a.icon == '*') {
            return <View className={"justify-center" + (index2 > visibleItemsCount - 1 ? ' item-overlap ' : '')} ref={el => itemRefs.current[index2] = el}><Link href={a.link}>{btn}</Link></View>
        }
        return (
            <Pressable ref={el => itemRefs.current[index2] = el} className={" py-2 items-center " + a?.menu_settings?.class + (index2 > visibleItemsCount - 1 ? ' item-overlap ' : '')}
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
                {btn}
            </Pressable>
        )
    });

    const MenuItemEx = memo(({ item, index }) => {
        const { title, addon, icon, link, menu_settings, key } = item;
        const translatedTitle = <Text>{t(title)}</Text>;
        let addonContent = null;
        if (addon) {
            const addonClasses = addon.variant === 'primary' ? "bg-contrast dark:bg-contrast-d" : "bg-neutral-500 dark:bg-neutral-500";
            const addonText = addon.variant === 'primary' ? addon.text : addon;
            if (addonText) {
                addonContent = (
                    <Text className={`${addonClasses} rounded-full px-2 py-0.5 mx-1 text-center items-center text-white text-xs font-semibold`}>
                        {t(addonText)}
                    </Text>
                );
            }
        }

        const handlePress = () => {
            setIndex(index);
            getNumCols(windowWidth);
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
        return <View key="btn" className='ml-1'><Button title={'More...'} variant={visibleItemsCount <= index ? 'outline' : "text"} pressed={visibleItemsCount <= index ? true : false} size="sm" rounded onPress={() => { }} /></View>;
    });

    return <DynamicMenu
        name="main-menu"
        offsetWidth={120}
        ButtonEx={ButtonEx}
        MenuItemEx={MenuItemEx}
        MenuItem={MenuItem}
        containerClasses="w-full"
        items={filteredItems}
        isButtonOutside={false}
        menuClasses=" ml-3.5 gap-x-1 flex-row"
        menuExClasses="mr-auto ml-4 items-end"
    />
}