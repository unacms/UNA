import { useCallback, useState, useEffect, useRef, useMemo, useContext, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSpring } from "react-native-reanimated";
import { View, ViewRef, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { useWindowDimensions } from 'react-native';
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, getLayout, handleFeedLayoutData, menuItemsByName, getMenuSettings, isObjectsEqual } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, LeftSidebar, TopSidebar, getNumCols, processBlocks } from 'app/lib/conductor-helpers';
import { ItemRenderer, ItemRendererMemo } from 'app/components/item-renderer';
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
import { storageClear, menuItemsFilter, LAYOUT_BREAKPOINTS, cn } from 'app/lib/util';
import Footer from 'app/components/nav/footer';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { callFn } from 'app/lib/functions/call';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import emitter from 'app/context/emitter';
import Cover, { CoverSmall } from 'app/components/elements/cover';
import { CoverMenuMore, CoverMenu } from 'app/components/nav/menu-cover'
import { Panel, PanelGroup, PanelHandler, isShowColumn } from "app/ui/molecules/resizable-panels";
import { useLayoutSettings } from 'app/context/layout-settings';
import { cd } from 'app/lib/util'

const conductorTheme = appSetting('theme', 'conductor');
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

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
            <View className="gap-y-4">
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
            btn = <Search section={button.section} params={{ trigger: { size: "sm", ring: "p-1" } }} />
        else {
            btn = <Button title={t(button.title)} startDecorator={button.icon} ring="p-1" variant="secondary" rounded size="sm" onPress={() => (handleFormModal(button, event, setPageData))} />;
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


    if (index >= filteredItems.length) {
        index = 0;
    }

    const MenuItem = memo(({ item: a, itemRefs, index: index2, visibleItemsCount }) => {
        return callFn('getButtonForConductorSmall', [a, index, () => {
            setIndex(a.index);
            getNumCols(windowWidth, routes[index], leftSideBar)
            window.history.pushState({}, '', '/' + a.key);
            if (onChangeRoute) {
                onChangeRoute(a);
            }
        }, routes])
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
        const translatedTitle = <Text className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 leading-6 font-medium text-base">{t(title)}</Text>;
        const { currentUser } = useCurrentUser();
        let addonContent = callFn("getAddonForConductor", [item, index, currentUser])

        const handlePress = () => {
            emitter.emit('dynamic_menu', { action: 'hide' });
            setIndex(index);
            getNumCols(windowWidth, routes[index], leftSideBar);
            window.history.pushState({}, '', '/' + key);
            if (onChangeRoute) {
                onChangeRoute(item);
            }
        };

        if (icon === '*') {
            return <Link href={link}><Row className="justify-between items-center min-w-200">{translatedTitle} {addonContent}</Row></Link>;
        }

        return (
            <Pressable
                className={' pupurs' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="  hover:cursor-pointer justify-between bg-bgritem dark:bg-bgritem-d my-0.5 flex flex-row h-11 items-center px-3 text-base rounded-xl hover:bg-bgritem-h dark:hover:bg-bgritem-dh items-center min-w-[192px]">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        );
    });

    const ButtonEx = memo(({ visibleItemsCount }) => {
        return <Button startDecorator="ChevronDown" variant='secondary' rounded pressed={visibleItemsCount <= index ? true : false} size="base" />;
    });

    return <DynamicMenu
        name={name}
        offsetWidth={80}
        ButtonEx={ButtonEx}
        MenuItemEx={MenuItemEx}
        MenuItem={MenuItem}
        containerClasses="w-full justify-between "
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
                        <Pressable className={a.ident ? conductorTheme.menu_categ_ident : ''} onPress={(event) => {
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

const HeaderContainer = ({ tabBarObj, pageData, headerSettings, windowWidth, isCoverDisabled, isHideCover }) => {
    const scrollValue = useSharedValue(isCoverDisabled ? 0 : 1);
    const hideDefaultHeaderFrom = useSharedValue(200);
    const cover1Ref = useRef(null);

    const uri = pageData?.uri;
    const isCover = pageData.cover_block ? (true) : false

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            if (!isCoverDisabled) {
                if (currentScrollY > hideDefaultHeaderFrom.value) {
                    scrollValue.value = 0;
                } else if (currentScrollY <= hideDefaultHeaderFrom.value) {
                    scrollValue.value = 1;
                }
            }
        });
    }, [scrollValue]);

    useEffect(() => {
        if (!appSetting('cover', 'fixed') && isCover) {
            window.addEventListener('scroll', handleScroll);
            cover1Ref.current.measureInWindow((x, y, width, height) => {
                hideDefaultHeaderFrom.value = height
            })
        }

        return () => {
            if (!appSetting('cover', 'fixed') && isCover) {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);

    const animatedStyleHeader2 = useAnimatedStyle(() => {
        return {
            marginBottom: scrollValue.value == 1 || isCoverDisabled ? '0px' : '130px',
        };
    }, [scrollValue]);

    const animatedStyleHeader3 = useAnimatedStyle(() => {
        return {
            display: scrollValue.value == 1 ? 'none' : 'flex',
        };
    }, [scrollValue]);

    return (
        <>
            <Animated.View className={`${conductorTheme.cover_base} cover-1 `} style={[{ zIndex: '50' }, animatedStyleHeader2]}>
                <ViewRef ref={cover1Ref} className={conductorTheme.cover_content + ' aaaa'}   >
                    {(isCover && !isHideCover) && <View className="w-full dfsdf">
                        <Cover data={pageData.cover_block} mode={headerSettings.cover} uri={uri} context={pageData.context} />
                    </View>}
                    <View className="w-full ">
                        {tabBarObj}
                    </View>
                </ViewRef></Animated.View>
            <Animated.View className={`fixed w-full z-50 cover-2 ${isCoverDisabled ? ` hidden ${TABLET_MODE_FROM}:flex ` : ' hidden'}`} style={[{ position: isCoverDisabled ? '' : 'fixed', zIndex: '50', }, animatedStyleHeader3]} >
                <View className="w-full bg-card/90 backdrop-blur-xl shadow-sm">
                    {(isCover && !isHideCover) && <View className="w-full">
                        <CoverSmall context={pageData.context} data={pageData.cover_block} />
                    </View>}
                    <View className="w-full ">
                        {tabBarObj}
                    </View>

                </View>
            </Animated.View>
        </>
    )
};

const TabBar = ({ menu, routes, leftSideBar, pageData, currentUser, index, setIndex, getNumCols, windowWidth, onChangeRoute, isHideCover, omitDefaultBackground = false }) => {
    const { t } = useTranslation();
    const { layoutName: layout } = useLayoutSettings();
    const menuSettings = getMenuSettings(menu.object, menu.config, menu);
    if (routes.length > 1) {
        const addButtons = AddMenu(menu, 'hideInTopBar')
        return (
            <TopSidebar omitDefaultBackground={omitDefaultBackground} leftSideBar={leftSideBar} addButtons={addButtons} layout={layout} title={t(menuSettings?.name)} >
                <View className="flex-1">
                    <ConductorMenu currentUser={currentUser} leftSideBar={leftSideBar} routes={routes} index={index} t={t} setIndex={setIndex} getNumCols={getNumCols} windowWidth={windowWidth} onChangeRoute={onChangeRoute} />
                </View>
                {(!!pageData.cover_block?.actions_menu) && <Row className=" items-center gap-x-2 justify-end  ">
                    {isHideCover && <CoverMenu
                        {...pageData.cover_block.actions_menu}
                        uri={pageData.uri}
                        isSplitMenu={true}
                        containerClasses="gap-x-2"
                    />}
                    {!!appSetting('cover', 'more_menu_in_navbar', pageData?.module) && <CoverMenuMore
                        {...pageData.cover_block.actions_menu}
                        uri={pageData.uri}
                        isSplitMenu={true}
                        persistent={1}
                    />}
                </Row>}
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
            {isTitle && <View className={`${conductorTheme.content_max_width} mx-auto w-full pt-3  px-4`}><Text className="text-3xl tracking-tight leading-10 font-bold text-neutral-800  dark:text-neutral-200 ">{route.title}</Text></View>}
        </>
    )
};

export function Conductor({ isCoverDisabled, menu, data, blocks, useSectionAsMenu, leftSideBar, leftSideBarBlocks, leftSideBarWidth = appSetting('conductor', 'sidebar_width'), skeleton = '', onChangeRoute, keyword, layoutName, defaultHeaderHeight = 112 }) {
    const uniRef = useRef();
    const { currentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const { layoutData, setLayoutData } = useLayoutData();
    const { layoutName: tmplLayout, density } = useLayoutSettings();
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

    const AddBlocksCnt = useMemo(() => AddBlocks(currentRoute.leftSideBarBlocks, currentRoute.pageData, onFormChangedValues), [currentRoute.leftSideBarBlocks, currentRoute.pageData, onFormChangedValues]);

    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: AddBlocksCnt, showClose: true, snapPoints: ['50%', '75%'], modal: true });
    }, [AddBlocksCnt]);

    const unitType = useMemo(() => {
        const type = getUnitModeBySource(currentRoute?.endpoint);
        return type === 'default' ? getUnitType(currentRoute) : type;
    }, [currentRoute?.endpoint, currentRoute?.inited, currentRoute?.blocks]);

    const sSkeleton = useMemo(() => {
        const a = callFn("getSkeletonByEndPoint", [currentRoute]);
        if (a)
            return a;
        let baseSkeleton = skeleton || currentRoute?.endpoint?.module || currentRoute?.endpoint?.unit;
        return unitType ? [baseSkeleton, unitType] : baseSkeleton;
    }, [skeleton, currentRoute, unitType]);

    useEffect(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100);
    }, [windowWidth]);

    const Preload = useMemo(() => getSkeletonForList(sSkeleton, numColumns), [sSkeleton, numColumns]);

    const RenderScene = useCallback(({ route, header, prevRoute, headerHeight, isCoverDisabled }) => {

        const dataItems = route?.data
        const contentPaddingClass = header ? '' : '';


        const isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar;
        const isLeftCol = route?.leftSideBarBlocks?.length > 0 && (layoutName === 'profile');

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

        if (layoutName == 'navigator'){
            return (
                <View className={
                        cn(isRightCol ? 'flex-auto' : 'w-full mx-auto',
                            layoutName !== 'navigator' && cd('p-md'),
                            contentPaddingClass)
                    }>
                        {TabFlashListM}
                        {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.length == 0 && callFn("noContentByUrl", [route?.endpoint])))}
                    </View>
            )
        }

        const sidebarUnitType = route.blocks?.browse_sidebar?.unitType || 'default';
        const cellsCustomConfig = appSetting('layouts', route?.pageData?.uri);
        const pageData = route.inited ? route.pageData : prevRoute.pageData;
        //if (cellsCustomConfig?.adjustable) {
        return (
            <PanelGroup
                autoSaveId={`cells-${pageData?.uri || 'default'}`}
                direction="horizontal"
                className={layoutName == 'navigator' ? '' : ''}
                onLayout={() => {
                    requestAnimationFrame(() => {
                        document.body.offsetHeight;
                        window.dispatchEvent(new Event('resize_panel'));
                    });
                }}

            >
                {isLeftCol && <>
                    <Panel className={`hidden ${cellsCustomConfig.cells?.left?.breakpoint}:block`} {...cellsCustomConfig.cells?.left}>
                        <View className={`fixed-process ${cd('py-md')}`}>
                            {AddBlocksCnt}
                        </View>
                    </Panel>
                    <PanelHandler
                        gap="hidden xl:block" sizable={cellsCustomConfig.sizable}
                    />
                </>
                }
                <Panel  {...cellsCustomConfig.cells?.center}>
                    <View className={
                        cn(isRightCol ? 'flex-auto' : 'w-full mx-auto',
                            layoutName !== 'navigator' && cd('py-md'),
                            contentPaddingClass)
                    }>
                        {TabFlashListM}
                        {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.length == 0 && callFn("noContentByUrl", [route?.endpoint])))}
                    </View>
                </Panel>
                {isRightCol && <>
                    <PanelHandler
                        gap="hidden lg:block" sizable={cellsCustomConfig.sizable}
                    />
                    <Panel className={`hidden ${cellsCustomConfig.cells?.right?.breakpoint}:block`} {...cellsCustomConfig.cells?.right}>
                        <View className={`${cd('py-md')} fixed-process `}>
                            {route?.sidebar?.content.map((item, index) => {
                                return <View className="mb-4" key={'item' + index}><ItemRenderer unitType={sidebarUnitType} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} /></View>
                            })}
                            <View><BlockByName data={route.pageData ? route.pageData : data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1} /></View>
                        </View>
                    </Panel>
                </>}
            </PanelGroup>
        );


    }, [numColumns, windowWidth, index, density]);

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

    const isHideCover = data?.cover_block?.profile && appSetting('cover', 'hide_cover_for_context') && data?.cover_block?.profile?.id === data?.context?.current?.id && windowWidth >= LAYOUT_BREAKPOINTS[TABLET_MODE_FROM];

    const tabBarObj = useMemo(() => (
        <TabBar
            isHideCover={isHideCover}
            menu={menu}
            routes={routes}
            leftSideBar={leftSideBar}
            currentUser={currentUser}
            index={index}
            setIndex={setIndex}
            getNumCols={getNumCols}
            windowWidth={windowWidth}
            onChangeRoute={onChangeRoute}
            omitDefaultBackground={false}
            pageData={data}
        />
    ), [menu, routes, leftSideBar, currentUser, index, setIndex, getNumCols, windowWidth, onChangeRoute, isHideCover]);

    const isShowFilters = layoutName == 'navigator' && leftSideBarBlocks.length > 0;

    const tabBarObj1 = windowWidth < LAYOUT_BREAKPOINTS[TABLET_MODE_FROM] && isShowFilters ?
        <>
            {tabBarObj}
            <View className={`items-start px-3 sm:px-4 py-2`}>
                <Button title="Filters" variant="default" size="sm" rounded onPress={showFilters} />
            </View>
        </> : tabBarObj;

    const headerComponent = useMemo(() => (
        <HeaderContainer
            isHideCover={isHideCover}
            tabBarObj={tabBarObj1}
            headerSettings={headerSettings}
            pageData={data}
            windowWidth={windowWidth}
            isCoverDisabled={isCoverDisabled}
        />

    ), [cntWidth, currentUser, windowWidth, routes, index, isHideCover]);

    const topSideBarComponent = useMemo(() => (
        <TopSideBarContainer
            routes={routes}
            index={index}
            setIndex={setIndex}
            onChangeRoute={onChangeRoute} />

    ), [routes, index, setIndex, onChangeRoute]);


    const isUseCurrentHeader = (layoutName === 'profile' || layoutName === 'profile-alt') && !isCoverDisabled

    if (leftSideBar) {

        const offset = 64
        let a = <View style={{ minHeight: (windowHeight - offset) }} className={`${leftSideBarWidth}  ${conductorTheme.left_menu_cnt} ${appSetting('conductor', 'sidebar')}`}>
            {leftSideBarComponent}
        </View>
        const sidebar = appSetting('conductor', 'sidebar')
        let rc = ""
        if (sidebar == 'rounded') {
            rc = "items-start justify-start mt-4"
            a = <View className={`${leftSideBarWidth} mr-4 hidden lg:block sm:rounded-2xl bg-bgrnavbar dark:bg-bgrnavbar-d`}>
                {leftSideBarComponent}
            </View>
        }

        const MainComponent = <View className=" flex-auto ">
            {(headerSettings.showAltTopMenu) && topSideBarComponent}
            {/*(windowWidth < LAYOUT_BREAKPOINTS.lg && layoutName == 'navigator' && leftSideBarBlocks.length > 0) && <View className="items-start ml-4 mt-2 mb-2">
                                <Button title="Filters" variant="default" size="sm" rounded onPress={showFilters} />
                            </View>*/}
            {sceneHeaderComponent}
            <RenderScene isCoverDisabled={isCoverDisabled} prevRoute={prevRoute} headerHeight={isShowFilters && routes.length > 1 ? defaultHeaderHeight + 52 : defaultHeaderHeight} header={isUseCurrentHeader ? null : headerComponent} route={currentRoute} />
        </View>

        const cellsCustomConfig = appSetting('layouts', 'navigator');
        if (cellsCustomConfig?.adjustable) {
            return (
                <><PanelGroup autoSaveId={`cells-navigator`} direction="horizontal" className={appSetting('layout', 'max_width')}>
                    {isShowColumn(true, windowWidth, cellsCustomConfig.cells?.left) && <>
                        <Panel {...cellsCustomConfig.cells?.left}>
                            <View className={`${cd('p-md')}`}>
                                {leftSideBarComponent}
                            </View>
                        </Panel>
                        <PanelHandler
                            gap="hidden lg:block" sizable={cellsCustomConfig.sizable}
                        /></>}
                    <Panel {...cellsCustomConfig.cells?.center}>
                        <View className={`lg:${cd('p-md')}`}>
                            {MainComponent}
                        </View>
                    </Panel>
                </PanelGroup>
                <Footer /></>
            );
        }

        return (
            <View className={appSetting('layout', 'max_width') + " w-full h-full mx-auto"} scrollEnabled={false} onLayout={handleLayoutTop}>
                {isUseCurrentHeader && headerComponent}
                <Toaster ref={toasterRef} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
                <View style={{ minHeight: (windowHeight - offset) }} className={appSetting('layout', 'max_width  ') + 'mx-auto w-full  '} >{/*mt-28 lg:mt-0*/}
                    <Row className={rc}>
                        {a}
                        {MainComponent}
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
                <RenderScene isCoverDisabled={isCoverDisabled} prevRoute={prevRoute} headerHeight={isShowFilters && routes.length > 1 ? defaultHeaderHeight + 52 : defaultHeaderHeight} header={isUseCurrentHeader ? null : headerComponent} route={currentRoute} />
            </View>
            <Footer />
        </View>
    );
}
