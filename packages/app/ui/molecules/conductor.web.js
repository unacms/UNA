import React, { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";
import { View, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, getLayout, handleFeedLayoutData, menuItemsByName, getMenuSettings, isObjectsEqual } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, ItemRenderer, ItemRendererMemo, LeftSidebar, TopSidebar, getNumCols, processBlocks } from 'app/lib/conductor-helpers';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { useTranslation } from 'react-i18next';
import Toaster from 'app/ui/atoms/toaster';
import { useLayoutData } from 'app/context/layout';
import { useCurrentUser } from 'app/context/user'
import Search from 'app/ui/molecules/search';
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { storageClear, menuItemsFilter, LAYOUT_BREAKPOINTS } from 'app/lib/util';
import Footer from 'app/components/nav/footer';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { callFn } from 'app/lib/functions/call';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';

const conductorTheme = appSetting('theme', 'conductor');

const getUnitType = (currentRoute) => {
    const blocksroutes = currentRoute?.blocks;
    if (blocksroutes) {
        const blockKeys = Object.keys(blocksroutes);
        for (const key of blockKeys) {
            if (!blocksroutes[key].sidebar && blocksroutes[key].unitType) {
                return blocksroutes[key].unitType;
            }
        }
    }
}

const AddBlocks = (leftSideBarBlocks, data, onFormChangedValues) => {

    if (!leftSideBarBlocks || !data)
        return null;

    const leftSideBarBlocksObj = leftSideBarBlocks.map((block) => {
        return <BlockByName
            data={data}
            name={block}
            onChange={onFormChangedValues}
        />
    });

    return <>
        {(leftSideBarBlocksObj?.length > 0) &&
            <View className="my-0 mx-2 ">
                {leftSideBarBlocksObj.map((block, index) => {
                    return <View key={"lb-" + index}>{block}</View>
                })}
            </View>
        }
    </>
};

const AddMenu = (menu, filter) => {
    const [pageData, setPageData] = useState(false);

    const { currentUser } = useCurrentUser();
    const { t } = useTranslation();
    const menuSettings = getMenuSettings(menu.object, menu.config);
    let addButtonsSet = menuSettings?.add?.filter(item => item[filter] !== true);
    addButtonsSet = menuItemsFilter(addButtonsSet, currentUser);

    if (!addButtonsSet) {
        addButtonsSet = [];

        if (menu.add_url && currentUser) {
            addButtonsSet.push({
                icon: 'Plus',
                name: 'Add',
                link: menu.add_url,
            });
        }
        if (menu.name) {
            addButtonsSet.push({
                icon: 'Search',
                name: 'Search',
                link: '',
                section: menu.name,
            },);
        }
    }

    return addButtonsSet.map((button) => {

        let btn = undefined;
        if (button.section)
            btn = <Search section={button.section} params={{ trigger: { size: 'sm' } }} />
        else {
            btn = <Button title={t(button.title)} startDecorator={button.icon} variant="secondary" ring="p-1" rounded size="sm" onPress={() => (handleFormModal(button, event, setPageData))} />;
            btn = (button.link && button.name != "Add") ? <Link href={button.link} >{btn}</Link> : btn
        }

        return (
            <View className=" " key={`add-${button.icon}`} >
                {btn}
                <FormModal pageData={pageData} setPageData={setPageData} />
            </View>

        )
    });
}

function ConductorMenu({ routes, index, t, setIndex, getNumCols, windowWidth, onChangeRoute, leftSideBar }) {

    const name = "cnd-main-menu"
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt

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

    if (!conductorTheme.menu_is_dynamic) {
        return (
            <View className={menuClasses} >
                {
                    filteredItems.map((aItem, iKey) => {
                        return <MenuItem key={name + 'menu' + iKey} item={aItem} index={iKey} />
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
                className={' p-3 ' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="h-6 justify-between items-center min-w-48">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        );
    });

    const ButtonEx = memo(({ visibleItemsCount }) => {
        return <Button startDecorator="ChevronDown" variant={visibleItemsCount <= index ? 'secondary' : "secondary"} rounded ring="p-1" pressed={visibleItemsCount <= index ? true : false} size="sm" />;
    });

    return <DynamicMenu
        name={name}
        offsetWidth={80}
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

const LeftSideBarContainer = ({ menu, routes, currentUser, index, setIndex, leftSideBarWidth, headerSettings, AddBlocksCnt }) => {
    const menuSettings = getMenuSettings(menu.object, menu.config, menu);
    const { t } = useTranslation();
    const addButtons = AddMenu(menu, 'hideInSideBar');
    return (
        <LeftSidebar title={t(menuSettings?.name)} addButtons={addButtons} >
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
                        <Pressable className={a.ident ? 'pl-[48px]' : ''} onPress={(event) => {
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
    )
}

const HeaderContainer = ({ tabBarObj, tabBarObjSmall, currentUser, smallHeader, header, windowWidth, cntWidth, cover }) => {
    let offset = header ? (windowWidth < LAYOUT_BREAKPOINTS.lg ? 400 : 400) : 50;
    if (cover == 'min' && header > 50) {
        offset = windowWidth < LAYOUT_BREAKPOINTS.lg ? 80 : 200
    }

    const scrollValue = useSharedValue(1);

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            if (window.scrollY > offset && scrollValue.value !== 0) {
                scrollValue.value = 0;
            } else if (window.scrollY < offset && scrollValue.value !== 1) {
                scrollValue.value = 1;
            }
        });
    }, [offset, scrollValue]);

    useEffect(() => {
        /*const handleScroll = () => {
            if (window.scrollY > offset && scrollValue.value != 0) {
                scrollValue.value = 0;
            }
            if (window.scrollY < offset && scrollValue.value != 1) {
                scrollValue.value = 1;
            }
        };*/

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

    const tmplLayout = getLayout(currentUser);
    const tOffset = tmplLayout == 'ver' ? 0 : 63;
    const d = 200;
    const animatedStyle5 = useAnimatedStyle(() => {
        const opacityValue = withTiming(scrollValue.value, { duration: d });
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

    if (!header && !smallHeader && windowWidth < LAYOUT_BREAKPOINTS.lg) {
        return (
            <View >
                {tabBarObj}
            </View>
        )
    }

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
};

const TabBar = ({ isSmall = false, menu, routes, leftSideBar, header, headerSettings, currentUser, index, setIndex, getNumCols, windowWidth, onChangeRoute }) => {
    const isDrawer = menuItemsByName('main_menu', appSetting('menu_items', 'menu_drawer'), currentUser).length > 0;
    const { t } = useTranslation();
    const showMenu = (params) => { }

    const menuSettings = getMenuSettings(menu.object, menu.config, menu);
    if (routes.length > 1) {
        const addButtons = AddMenu(menu, 'hideInTopBar')
        return (
            <TopSidebar isDrawer={isDrawer} isWeb={true} leftSideBar={leftSideBar} header={header} headerSettings={headerSettings} addButtons={addButtons} isSmall={isSmall} showMenu={showMenu} layout={getLayout(currentUser)} title={t(menuSettings?.name)} >
                <ConductorMenu currentUser={currentUser} leftSideBar={leftSideBar} routes={routes} index={index} t={t} setIndex={setIndex} getNumCols={getNumCols} windowWidth={windowWidth} onChangeRoute={onChangeRoute} />
            </TopSidebar>

        )
    }
};

const TopSideBarContainer = ({ routes, index, setIndex, onChangeRoute }) => {
    return <Row className={conductorTheme.topmenu_cnt}>
        {routes.filter((aItem) => aItem.hideInTop != true).map((a) => {

            let btn = <Button
                variant={a.index == index ? conductorTheme.topmenu_button_variant_active : conductorTheme.topmenu_button_variant}
                size={conductorTheme.topmenu_button_size}
                pressed={a.index == index ? conductorTheme.topmenu_button_pressed : false}

                title={(a.title)}
                align={conductorTheme.topmenu_button_align}
                fullWidth={conductorTheme.topmenu_button_fullWidth}
                addon={!appSetting('conductor', 'show_nav_counters') && a.addon ? null : a.addon}
                key={`tab-${a.index}`}
                onPress={() => {
                    setIndex(a.index);
                    window.history.pushState({}, '', '/' + a.key);
                    if (onChangeRoute) {
                        onChangeRoute(a);
                    }
                }}
            />

            return btn
        })}
    </Row>
};

const RenderSceneHeader = ({ route, setFilterValue }) => {
    const filters = appSetting('conductor', 'hide_browse_filter') ? null : route?.endpoint?.filters;
    const counter = appSetting('conductor', 'show_nav_counters') ? 0 : route.addon ? (route.addon.text ? route.addon.text : route.addon) : 0;
    const isTitle = appSetting('conductor', 'show_nav_titles');
    return (
        <>
            {callFn("getFiltersForConductor", [filters, setFilterValue, route?.endpoint?.params?.filters])}
            {counter > 0 && <View className="mx-4 mb-0 mt-2"><Text className="text-xl font-bold text-neutral-800  dark:text-neutral-200 ">{route.title} ({counter})</Text></View>}
            {isTitle && <View className={`${conductorTheme.content_max_width} mx-auto w-full pt-3 px-4`}><Text className="text-3xl tracking-tight leading-[40px] font-bold text-neutral-800  dark:text-neutral-200 ">{route.title}</Text></View>}
        </>
    )
};

export function Conductor({ header, smallHeader, menu, data, blocks, useSectionAsMenu, leftSideBar, leftSideBarBlocks, leftSideBarWidth = ' w-96 ', skeleton = '', onChangeRoute, keyword, cover, layoutName, defaultHeaderHeight=116 }) {
    const uniRef = useRef();
    const { currentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const { layoutData, setLayoutData } = useLayoutData();
    const tmplLayout = getLayout(currentUser);
    const toasterRef = useRef(); // ref for toaster

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu, leftSideBarBlocks);
    
    const [routes, setRoutes] = useState(initedTabs);
   
    const [cntWidth, setCntWidth] = useState(0);
    const [isRevalidate, setIsRevalidate] = useState(false);

    useEffect(() => {
        setRoutes(initedTabs);
    }, [keyword, data.url, data.elements]);


    const initialIndex = useMemo(() => {
        const foundIndex = routes.findIndex(function (item) {
            if (useSectionAsMenu) {
                return data.url === item.key;
            } else {
                return data.url === item.key;
            }
        });
        return foundIndex !== -1 ? foundIndex : 0;
    }, [routes, data.url, useSectionAsMenu]);

    const [index, _setIndex] = useState(initialIndex);
    const [prevIndex, setPrevIndex] = useState(initialIndex);

    const setIndex = (newIndex) => {
        setPrevIndex(index);
        _setIndex(newIndex);
      };

    const currentRoute = routes.find((item) => item.index === index);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    const queryKey = [currentRoute?.endpoint?.request_url, index, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters), data.uri];
    const [headerSettings, setHeaderSettings] = useState(getHeaderSettings(getURI(currentRoute?.key), windowWidth, layoutName, currentRoute.config));

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
        enabled: currentRoute?.endpoint?.params?.start == 0//route?.endpoint?.params?.start == 0
    });

    const handleEndReached = useCallback(async (lastItemIndex) => {

        if (isFetchingNextPage)
            return;
        if (hasNextPage === false)
            return;
        if (currentRoute?.endpoint?.finished)
            return;
        if (lastItemIndex == false)
            return;
        //console.log("handleEndReached2", Date.now()) 
        fetchNextPage();
    }, [currentRoute?.endpoint?.finished, isFetchingNextPage, hasNextPage]);


    useEffect(() => {
        if (currentRoute.inited) {
            const headerSettingsN = getHeaderSettings(getURI(currentRoute?.key), windowWidth, layoutName, currentRoute.config);

            if (!isObjectsEqual(headerSettings, headerSettingsN)) {
                setHeaderSettings(headerSettingsN);
            }
        }

    }, [windowWidth, layoutName, currentRoute?.key, currentRoute.config]);

    useEffect(() => {
        if (currentRoute.cached) {
            revalidateData();

        }
        if (currentRoute?.endpoint?.unit == 'feed') {
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
    }, [windowWidth, currentRoute, leftSideBar]);

    /* UPDATE CONTENT PART */
    useEffect(() => {
        setToaster2Visible(false);
        setBottomSheetData(false)
    }, [index]);

    const setToaster2Visible = (val) => {
        const current = toasterRef.current;
        if (current) {
            current.setVisible(val);
        }
    }

    const revalidateData = useCallback(async () => {
        const hasEndpoint = Boolean(currentRoute?.endpoint);
        let endpointUpdateContent = '';
        let bUpdateContent = false;
        const revalidatedData = JSON.parse(isRevalidate);

        if (hasEndpoint) {

            const a = [...new Set(currentRoute.data
                .filter(item => item.type !== 'block')
                .map(item => item.id)
            )].slice(0, 10).join(',');

            if ((a || true) && revalidatedData.author_id != currentUser?.id && !currentRoute.endpoint.request_url.includes("system/get_results/TemplSearchExtendedServices")) {
                endpointUpdateContent = currentRoute.endpoint.request_url + JSON.stringify({
                    'params': { ...currentRoute.endpoint.params, validate: a }
                });
                bUpdateContent = true;
            }
        }
        if (bUpdateContent) {
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
            setLayoutData(null)
        }
        callFn("updateRouteDataForConnections", [currentRoute, layoutData, routes, index, setRoutes])

    }, [layoutData]);
    /* NEW POST TO FEED */

    const setFilterValue = (values) => {
        setIndex((prevIndex) => {
            setRoutes((prevRoutes) => {
                const newRoutes = [...prevRoutes]; // Актуальные маршруты
    
                console.log("newRoutes1", newRoutes);
    
                values.forEach((value) => {
                    const name = value.name;
                    const val = value.value;
    
                    if (newRoutes[prevIndex].endpoint.params.filters) {
                        newRoutes[prevIndex].endpoint.params.filters[name] = val;
                    } else {
                        newRoutes[prevIndex].endpoint.params.filters = { [name]: val };
                    }
                });
    
                newRoutes[prevIndex].endpoint.finished = false;
                newRoutes[prevIndex].data = [];
                newRoutes[prevIndex].endpoint.params.start = 0;
    
                console.log("newRoutes2", newRoutes);
                return newRoutes; // Обновляем состояние
            });
    
            return prevIndex; // Возвращаем актуальный index (он не изменяется в этой функции)
        });
    };

    const onFormChangedValues = useCallback((values) => {
        let filterValues = [];
        for (let key in values) {
            filterValues.push({ name: key, value: Array.isArray(values[key]) ? values[key].join(',') : values[key] })
        };

        setFilterValue(filterValues)
        //  setBottomSheetData(false);
    }, []);

    const onFormSubmit = useCallback((formData, d) => {
        onFormChangedValues(d);
    }, []);

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);

    const handleLayoutTop = (event) => {
        setCntWidth(event.nativeEvent.layout.width)
    };

    const tabBarObj = useMemo(() => (
        <TabBar
            isSmall={false}
            menu={menu}
            routes={routes}
            leftSideBar={leftSideBar}
            header={header}
            headerSettings={headerSettings}
            currentUser={currentUser}
            index={index}
            setIndex={setIndex}
            getNumCols={getNumCols}
            windowWidth={windowWidth}
            onChangeRoute={onChangeRoute}
        />
    ), [menu, routes, leftSideBar, header, headerSettings, currentUser, index, setIndex, getNumCols, windowWidth, onChangeRoute]);

    const AddBlocksCnt = useMemo(() => AddBlocks(currentRoute.leftSideBarBlocks, currentRoute.pageData, onFormChangedValues), [currentRoute.leftSideBarBlocks, currentRoute.pageData, onFormChangedValues]);

    /* console.log("Reload!");
 
     useEffect(() => {
         console.log("Reload- index", index)
     }, [index]);
     useEffect(() => {
         console.log("Reload- cntWidth", cntWidth)
     }, [cntWidth]);
     useEffect(() => {
         console.log("Reload- isRevalidate", isRevalidate)
     }, [isRevalidate]);
     useEffect(() => {
         console.log("Reload- routes", routes)
     }, [routes]);
     useEffect(() => {
         console.log("Reload- headerSettings", headerSettings)
     }, [headerSettings]);
     useEffect(() => {
         console.log("Reload- numColumns", numColumns)
     }, [numColumns]);
 */
    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: AddBlocksCnt, showClose: true, snapPoints: ['50%', '75%'] });
    }, [currentRoute.leftSideBarBlocks, currentRoute.pageData, onFormSubmit]);

    const unitType = useMemo(() => {
        const type = getUnitModeBySource(currentRoute?.endpoint);
        return type === 'default' ? getUnitType(currentRoute) : type;
    }, [currentRoute?.endpoint, currentRoute?.inited, currentRoute?.blocks]);

    const sSkeleton = useMemo(() => {
        let baseSkeleton = skeleton || currentRoute?.endpoint?.module || currentRoute?.endpoint?.unit;
        return unitType ? [baseSkeleton, unitType] : baseSkeleton;
    }, [skeleton, currentRoute, unitType]);

    const Preload = useMemo(() => getSkeletonForList(sSkeleton, numColumns), [sSkeleton, numColumns]);

    const RenderScene = useCallback(({ route, header, prevRoute, headerHeight }) => {

        const dataItems = route?.data

        if (dataItems.length == 1 && !route.endpoint) {
            const a = dataItems.map((item, index) => {
                return <View className={`lg:mt-0 mx-auto mt-2 w-full ${appSetting('layout', 'max_width_block')}`} key={`tab-${index}`}><ItemRendererMemo route={route} key={'item' + index} numColumns={1} item={item} /></View>
            });
            return a;
        }

       
        const isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar;

        const TabFlashListM = useMemo(() => {
            return <UniList
                scrollProps={header ?
                    {
                        pageData: route.inited ? route.pageData : prevRoute.pageData, 
                        subHeaderComponent: header, 
                        headerHeight: headerHeight, 
                        isBackButton: false,
                        isMenuNameAsTitle: true
                    } : null
                }
                index={route.index}
                data={dataItems}
                endpoint={route.endpoint}
                listState={route?.state}
                storagekey={route.storageKeyValue}
                refer={uniRef}
                route={route}
                unit={route.endpoint?.unit}
                useWindowScroll
                numColumns={numColumns}
                onEndReached={handleEndReached}
                renderItem={({ item, index }) => <ItemRenderer unitType={unitType} route={route} numColumns={numColumns} item={{ ...item, feed_type: route?.endpoint?.params?.type }} unit={route?.endpoint?.unit} module={route?.endpoint?.module} />}
                ListFooterComponent={
                    <View>
                        {(hasNextPage && isFetchingNextPage) ? (
                            Preload
                        ) : null}
                    </View>
                }
            />
        }, [dataItems, numColumns, dataItems.length]);

        const sidebarUnitType = route.blocks?.browse_sidebar?.unitType || 'default';

        return (
            <Row style={{ paddingTop: header ? 0 : 0 }} className={(headerSettings.columns == "reverse" ? 'flex-row-reverse' : '') + conductorTheme.content_max_width + '  mx-auto w-full '}>
                <View className={(isRightCol ? 'flex-auto sm:border-r border-bdr dark:border-bdr-d lg:px-4 flex-auto ' : ' w-full mx-auto px-2 py-4 ') /*sm:p-2*/+ (layoutName == 'navigator' ? '' : ' lg:pt-4')}/*lg:pt-4*/>
                    {TabFlashListM}
                    {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.length == 0 && callFn("noContentByUrl", [route?.endpoint])))}


                </View>
                {isRightCol && <View className="hidden xl:flex flex-auto max-w-md ">
                    <View className={`${conductorTheme.right_column_cnt}`}>
                        {route?.sidebar?.content.map((item, index) => {
                            return <View className="mb-4" key={'item' + index}><ItemRenderer unitType={sidebarUnitType} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} /></View>
                        })}
                        <BlockByName data={route.pageData ? route.pageData : data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1} />
                    </View>
                </View>}
            </Row>
        )

    }, [numColumns, windowWidth, index]);

    const sceneHeaderComponent = useMemo(() => (
        <RenderSceneHeader route={currentRoute} setFilterValue={setFilterValue} />
    ), [currentRoute, setFilterValue]);

    const leftSideBarComponent = useMemo(() => (
        <LeftSideBarContainer
            index={index}
            setIndex={setIndex}
            menu={menu}
            routes={routes}
            currentUser={currentUser}
            leftSideBarWidth={leftSideBarWidth}
            headerSettings={headerSettings}
            AddBlocksCnt={AddBlocksCnt} />
    ), [index, setIndex, menu, routes, currentUser, leftSideBarWidth, headerSettings, AddBlocksCnt]);

    const headerComponent = useMemo(() => (
        <HeaderContainer
            cover={cover}
            cntWidth={cntWidth}
            tabBarObj={tabBarObj}
            tabBarObjSmall={tabBarObj}
            currentUser={currentUser}
            smallHeader={smallHeader}
            header={leftSideBar && layoutName != 'navigator'  ? <View className="bg-bgrcard dark:bg-bgrcard-d lg:hidden pt-20 px-3">{leftSideBarComponent}</View> : header}
            windowWidth={windowWidth}
        />
    ), [cover, cntWidth, tabBarObj, currentUser, smallHeader, header, windowWidth]);

    const topSideBarComponent = useMemo(() => (
        <TopSideBarContainer
            routes={routes}
            index={index}
            setIndex={setIndex}
            onChangeRoute={onChangeRoute} />

    ), [routes, index, setIndex, onChangeRoute]);

    const isShowFilters = false;// todo
    const isUseCurrentHeader = layoutName !== 'navigator' && header

    if (leftSideBar) {

        const offset = 64
        let a = <View style={{ minHeight: (windowHeight - offset) }} className={`${leftSideBarWidth} hidden lg:block ${conductorTheme.left_menu_cnt} fixed lg:relative top-0 z-50`}>
            {leftSideBarComponent}
        </View>
        const sidebar = appSetting('conductor', 'sidebar')
        let rc = ""
        if (sidebar == 'rounded') {
            rc = "items-start justify-start"
            a = <View className={`${leftSideBarWidth} mt-4 mr-4 hidden lg:block sm:rounded-2xl bg-bgrnavbar dark:bg-bgrnavbar-d`}>
                {leftSideBarComponent}
            </View>
        }

        return (
            <View className={appSetting('layout', 'max_width') + " w-full h-full mx-auto"} scrollEnabled={false} onLayout={handleLayoutTop}>
                {isUseCurrentHeader && headerComponent}
                <Toaster ref={toasterRef} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
                <View style={{ minHeight: (windowHeight - offset) }} className={appSetting('layout', 'max_width  ') + ' lala mx-auto w-full  '} >{/*mt-28 lg:mt-0*/}
                    <Row className={rc}>
                        {a}
                        <View className=" flex-auto ">
                            {(headerSettings.showAltTopMenu) && topSideBarComponent}
                            {(windowWidth < LAYOUT_BREAKPOINTS.lg && layoutName == 'navigator' && leftSideBarBlocks.length > 0) && <View className="items-start ml-4 mt-2 mb-2">
                                <Button title="Filters" variant="default" size="sm" rounded onPress={showFilters} />
                            </View>}
                            {sceneHeaderComponent}
                            <RenderScene prevRoute={prevRoute} headerHeight={isShowFilters? 150: defaultHeaderHeight} header={isUseCurrentHeader ? null : headerComponent} route={currentRoute} />
                        </View>
                    </Row>
                </View>
                <Footer />
            </View>
        );
    }

    return (
        <View className="w-full h-full" scrollEnabled={false} onLayout={handleLayoutTop}>
            {(isUseCurrentHeader || windowWidth > LAYOUT_BREAKPOINTS.lg) && headerComponent}
            <Toaster ref={toasterRef} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
            <View className={`${conductorTheme.content_max_width} mx-auto w-full min-h-screen ${tmplLayout == 'mixed' ? 'mt-12' : ''}`}>
                {sceneHeaderComponent}
                <RenderScene prevRoute={prevRoute} headerHeight={isShowFilters? 150: defaultHeaderHeight} header={isUseCurrentHeader ? null : headerComponent} route={currentRoute} />
            </View>
            <Footer />
        </View>
    );
}