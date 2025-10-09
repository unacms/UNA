import { useCallback, useState, useEffect, useRef, useMemo, memo } from "react";
import { Text } from 'app/design/typography';
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { View, ViewRef, Row, Pressable } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { appSetting, getHeaderSettings, getUnitModeBySource, getURI, handleFeedLayoutData, getMenuSettings, isObjectsEqual, getBreakpoint } from 'app/lib/util';
import { fillTabs, parseData, fetchAndUpdateData, LeftSidebar, TopSidebar, getNumCols } from 'app/lib/conductor-helpers';
import { ItemRenderer } from 'app/components/item-renderer';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { BlockByName } from 'app/components/block';
import { useTranslation } from 'react-i18next';
import Toaster from 'app/ui/atoms/toaster';
import { useLayoutData } from 'app/context/layout';
import { useCurrentUser } from 'app/context/user'
import Search from 'app/ui/molecules/search';
import DynamicMenu from 'app/components/nav/menu-dynamic';
import { storageClear, menuItemsFilter } from 'app/lib/util';
import { subscribe } from 'app/ui/atoms/socket';
import { fetcher } from 'app/lib/fetcher';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { callFn } from 'app/lib/functions/call';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import emitter from 'app/context/emitter';
import Cover, { CoverSmall } from 'app/components/elements/cover';
import { CoverMenuMore, CoverMenu } from 'app/components/nav/menu-cover'
import { Panel, PanelGroup, PanelHandler } from "app/ui/molecules/resizable-panels";
import { useLayoutSettings } from 'app/context/layout-settings';
import { cd } from 'app/lib/util'
import { useIsDesktop, useBreakpoint } from 'app/context/measure';

const conductorTheme = appSetting('theme', 'conductor');

export function Conductor({ isCoverDisabled, ts, menu, data, blocks, useSectionAsMenu, skeleton = '', onChangeRoute, keyword, layoutName, defaultHeaderHeight = 112 }) {
    const uniRef = useRef();
    const { currentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();
    const { layoutData, setLayoutData } = useLayoutData();
    const { layoutName: tmplLayout } = useLayoutSettings();
    const toasterRef = useRef(); // ref for toaster
    const cleanUrl = data.url.split("?")[0];
    const currentBreakpoint = useBreakpoint();
    const isDesktop = useIsDesktop();
    const initedTabs = fillTabs(menu, data, blocks, currentUser, useSectionAsMenu);
    const [routes, setRoutes] = useState(initedTabs);
    const [isRevalidate, setIsRevalidate] = useState(false);

    useEffect(() => {
        setRoutes(initedTabs);
    }, [keyword, data.url, data.elements]);

    // found current index from routes
    const getFoundIndex = useCallback(() => {
        const found = routes.findIndex(item => {
            if (useSectionAsMenu) {
                return data.url === item.key;
            } else {
                return item.key.includes('?')
                    ? data.url === item.key
                    : cleanUrl === item.key;
            }
        });
        return found !== -1 ? found : 0;
    }, [routes, useSectionAsMenu, data.url, cleanUrl]);

    const initialIndex = useMemo(() => getFoundIndex(), [getFoundIndex]);

    const [index, _setIndex] = useState(initialIndex);
    const [prevIndex, setPrevIndex] = useState(initialIndex);

    const setIndex = (newIndex) => {
        setPrevIndex(index);
        _setIndex(newIndex);
    };

    useEffect(() => {
        const foundIndex = getFoundIndex();
        if (foundIndex !== index)
            setIndex(foundIndex)
    }, [ts]);

    const currentRoute = routes.find((item) => item.index === index);
    const prevRoute = useMemo(() => routes.find((item) => item.index === prevIndex), [routes, prevIndex]);;
    const queryKey = [currentRoute?.endpoint?.request_url, currentRoute.link, keyword, JSON.stringify(currentRoute?.endpoint?.params?.filters)];
    const cellsCustomConfig = appSetting('layouts', 'navigator') || appSetting('layouts', `cols-l-c`);
    const initialHeaderSettings = getHeaderSettings(getURI(currentRoute?.key), isDesktop, layoutName, currentRoute.config);

    // Disable offset for adjustable panel layouts
    if (cellsCustomConfig?.adjustable) {
        initialHeaderSettings.offset = false;
    }
    const [headerSettings, setHeaderSettings] = useState(initialHeaderSettings);

    const [numColumns, setNumColumns] = useState(getNumCols(currentBreakpoint, currentRoute));

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
        if (lastItemIndex === false)
            return;
        fetchNextPage();
    }, [currentRoute?.endpoint?.finished, isFetchingNextPage, hasNextPage]);


    useEffect(() => {
        if (currentRoute.inited) {
            const headerSettingsN = getHeaderSettings(getURI(currentRoute?.key), isDesktop, layoutName, currentRoute.config);
            // Disable offset for adjustable panel layouts
            if (cellsCustomConfig?.adjustable) {
                headerSettingsN.offset = false;
            }

            if (!isObjectsEqual(headerSettings, headerSettingsN)) {
                setHeaderSettings(headerSettingsN);
            }
        }

    }, [isDesktop, layoutName, currentRoute?.key, currentRoute.config]);

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
        const numColumnsN = getNumCols(currentBreakpoint, currentRoute);
        if (numColumnsN != numColumns) {
            setNumColumns(numColumnsN);
        }
    }, [currentBreakpoint, currentRoute]);

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
                const newRoutes = [...prevRoutes];
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
                return newRoutes;
            });

            return prevIndex;
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

    useEffect(() => {
        fetchAndUpdateData(routes, index, setRoutes);
    }, [index]);



    const LeftBarContentBlocks = LeftBarContent(currentRoute, onFormChangedValues);

    const showFilters = useCallback(() => {
        setBottomSheetData({ title: 'Filters', content: LeftBarContentBlocks, showClose: true, snapPoints: ['50%', '75%'], modal: true });
    }, [LeftBarContentBlocks]);

    const unitType = useMemo(() => {
        const type = getUnitModeBySource(currentRoute?.endpoint);
        return type === 'default' ? getUnitType(currentRoute) : type;
    }, [currentRoute?.endpoint, currentRoute?.inited, currentRoute?.blocks]);

    const sSkeleton = useMemo(() => {
        const a = callFn("getSkeletonByEndPoint", [currentRoute]);
        if (a)
            return a;
        const baseSkeleton = skeleton || currentRoute?.endpoint?.module || currentRoute?.endpoint?.unit;
        return unitType ? [baseSkeleton, unitType] : baseSkeleton;
    }, [skeleton, currentRoute, unitType]);

    useEffect(() => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100);
    }, []);

    const Preload = useMemo(() => getSkeletonForList(sSkeleton, numColumns), [sSkeleton, numColumns]);

    const RenderScene = useCallback(({ route, header, prevRoute, headerHeight }) => {
        const pageData = route.inited ? route.pageData : prevRoute.pageData;
        const dataItems = route?.data;

        const isRightCol = route?.sidebar?.content?.length > 0 || route?.blocks?.browse_sidebar;
        const isLeftCol = route?.leftbar?.content?.length > 0 || layoutName == 'navigator';
        const renderItem = useCallback(
            ({ item, index }) => (
                <ItemRenderer
                    unitType={unitType}
                    route={route}
                    numColumns={numColumns}
                    item={{ ...item, feed_type: route?.endpoint?.params?.type }}
                    unit={route?.endpoint?.unit}
                    module={route?.endpoint?.module}
                />
            ),
            [route, numColumns, unitType]
        );
        const MainContent = useMemo(() => {
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
                useWindowScroll={true}
                numColumns={numColumns}
                onEndReached={handleEndReached}
                renderItem={renderItem}
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
        const layoutCols = !isLeftCol && !isRightCol ? 'c' : !isLeftCol ? 'c-r' : !isRightCol ? 'l-c' : 'l-c-r';
        
        const cellsCustomConfig = useMemo(() => {
            return appSetting('layouts', route?.pageData?.uri)
                || appSetting('layouts', `cols-${layoutCols}`);
        }, [route?.pageData?.uri, layoutCols]);


        const { cells = {} } = cellsCustomConfig || {};
        const currentBreakpointName = getBreakpoint(currentBreakpoint);

        function resolvePanelProps(base, responsive, bpName = currentBreakpointName) {
            const override = responsive?.[bpName];
            return override ? { ...base, ...override } : base; // merge поверх базовых
        }

        // LEFT
        const {
            breakpoint: leftBreakpoint,
            responsive: leftResponsive,
            ...leftBase
        } = cells.left ?? {};
        const leftPanelProps = resolvePanelProps(leftBase, leftResponsive);

        // CENTER
        const {
            breakpoint: centerBreakpoint,
            responsive: centerResponsive,
            ...centerBase
        } = cells.center ?? {};
        const centerPanelProps = resolvePanelProps(centerBase, centerResponsive);

        // RIGHT
        const {
            breakpoint: rightBreakpoint,
            responsive: rightResponsive,
            ...rightBase
        } = cells.right ?? {};
        const rightPanelProps = resolvePanelProps(rightBase, rightResponsive); 

        const onLayout = (sizes) => {
            setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100);
        };

        return (
            <PanelGroup
                key={`${pageData?.uri || 'default'}-pnl2-${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                autoSaveId={cellsCustomConfig.sizable ? `cells-${pageData?.uri || 'default'}` : undefined}
                direction="horizontal"
                className={(layoutName == 'navigator' ? '' : '') + " h-full"}
                onLayout={onLayout}
            >
                {isLeftCol && <>
                    <Panel className={`hidden ${leftBreakpoint}:block`} {...leftPanelProps}>
                        <View className={`${layoutName == 'profile' ? cd('p-md') + ' fixed-process' : appSetting('conductor', 'sidebar_container')}`}>
                            {layoutName == 'profile' ? <LeftSideBarContainer
                                layoutName={layoutName}
                                index={index}
                                setIndex={setIndex}
                                menu={menu}
                                routes={routes}
                                currentUser={currentUser}
                                headerSettings={headerSettings}
                            >{LeftBarContentBlocks}</LeftSideBarContainer> : <View className=' fixed-process  p-2 '><LeftSideBarContainer
                                layoutName={layoutName}
                                index={index}
                                setIndex={setIndex}
                                menu={menu}
                                routes={routes}
                                currentUser={currentUser}
                                headerSettings={headerSettings}
                            >{LeftBarContentBlocks}</LeftSideBarContainer></View>
                            }
                        </View>
                    </Panel>
                    <PanelHandler gap="hidden xl:block" sizable={cellsCustomConfig.sizable} />
                </>
                }
                <Panel {...centerPanelProps}>
                    <View className={`${isRightCol ? 'flex-auto' : 'w-full mx-auto'} ${layoutName !== 'navigator' ? 'mt-0.5 sm:' + cd('p-md') : 'lg:p-2 '}`}>
                        {MainContent}
                        {route?.endpoint?.request_url && (!route.endpoint?.finished ? Preload : (dataItems.filter(item => (item.type !='block')).length == 0 && callFn("noContentByUrl", [route?.endpoint])))}
                    </View>
                </Panel>
                {isRightCol && <>
                    <PanelHandler gap="hidden lg:block" sizable={cellsCustomConfig.sizable} />
                    <Panel className={`hidden ${rightBreakpoint}:block`} {...rightPanelProps}>
                        <View className={`${cd('p-md')} fixed-process `}>
                            {route?.sidebar?.content.map((item, index) => {
                                return <ItemRenderer key={`${route?.index}-${item.id}`} unitType={sidebarUnitType} route={route} numColumns={1} sidebar={true} item={item} unit={route?.sidebar?.endpoint?.unit} module={route?.sidebar?.endpoint?.module ? route?.sidebar?.endpoint?.module : ''} />
                            })}
                            <View>
                                <BlockByName data={route.pageData ? route.pageData : data} name={route.blocks?.browse_sidebar} sidebar={true} perLine={1} maxItems={1} />
                            </View>
                        </View>
                    </Panel>
                </>}
            </PanelGroup>
        );
    }, [numColumns, currentBreakpoint, index]);

    const isHideCover = data?.cover_block?.profile && appSetting('cover', 'hide_cover_for_context') && data?.cover_block?.profile?.id === data?.context?.current?.id && isDesktop;

    const showFiltersBtn = !isDesktop && layoutName === 'navigator' && ((currentRoute?.leftbar?.content?.length ?? 0) > 0);

    const headerComponent = (
        <HeaderContainer
            isHideCover={isHideCover}
            tabBarObj={
                <>
                    <TabBar
                        isHideCover={isHideCover}
                        menu={menu}
                        routes={routes}
                        layoutName={layoutName}
                        currentUser={currentUser}
                        index={index}
                        setIndex={setIndex}
                        getNumCols={getNumCols}
                        currentBreakpoint={currentBreakpoint}
                        onChangeRoute={onChangeRoute}
                        omitDefaultBackground={false}
                        pageData={data}
                    />
                    {showFiltersBtn && (
                        <View className="items-start px-3 sm:px-4 py-2">
                            <Button
                                title="Filters"
                                variant="default"
                                size="sm"
                                rounded
                                onPress={showFilters}
                            />
                        </View>
                    )}
                </>
            }
            headerSettings={headerSettings}
            pageData={data}
            isCoverDisabled={isCoverDisabled}
        />
    );

    const isUseCurrentHeader = layoutName === 'profile' && (!isCoverDisabled || !isDesktop)

    return (
        <View className="w-full h-full" scrollEnabled={false}>
            {(isUseCurrentHeader || isDesktop) && headerComponent}
            <Toaster ref={toasterRef} onPress={showNewContent2} variant="primary" title="Show New Posts" size="sm" />
            <View className={`${layoutName === 'profile' ? conductorTheme.content_max_width : ''} mx-auto w-full min-h-screen ${tmplLayout == 'mixed' ? 'mt-12' : ''}`}>
                <RenderSceneHeader route={currentRoute} setFilterValue={setFilterValue} />
                <RenderScene numColumns={numColumns} currentBreakpoint={currentBreakpoint} index={index} prevRoute={prevRoute} headerHeight={showFiltersBtn && routes.length > 1 ? defaultHeaderHeight + 52 : defaultHeaderHeight} header={isUseCurrentHeader ? null : headerComponent} route={currentRoute} />
            </View>
        </View>
    );
}


const getUnitType = (currentRoute) =>
    Object.values(currentRoute?.blocks ?? {}).find(
        (b) => !b.sidebar && b.unitType
    )?.unitType;


const LeftBarContent = (route, onFormChangedValues) => {
    const items = route?.leftbar?.content ?? [];
    if (items.length === 0) return null;

    return (
        <View className="gap-y-4">
            {items.map((block, index) => (
                <View key={`lb-${block.id ?? block.block ?? index}`}>
                    <BlockByName
                        name={block.block}
                        onChange={onFormChangedValues}
                        data={route?.pageData}
                        sidebar={true}
                    />
                </View>
            ))}
        </View>
    );
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
        if (menu.name && menu.add_url) {
            addButtonsSet.push({
                icon: 'Search',
                name: 'Search',
                link: '',
                section: menu.name,
            },);
        }
    }
    return <Row className="gap-x-2">
        {addButtonsSet.map((button) => {

            let btn = undefined;
            if (button.section)
                btn = <Search section={button.section} params={{ trigger: { size: "sm" } }} />
            else {
                btn = <Button title={t(button.title)} startDecorator={button.icon} rounded size="base" variant="secondary" onPress={() => (handleFormModal(button, event, setPageData))} />;
                btn = (button.link && button.name != "Add") ? <Link href={button.link} >{btn}</Link> : btn
            }

            return (

                <View key={`add-${button.icon}-${button.name}`} >
                    {btn}
                    <FormModal pageData={pageData} setPageData={setPageData} />
                </View>


            )
        })}
    </Row>
}

function ConductorMenu({ routes, index, t, setIndex, getNumCols, currentBreakpoint, onChangeRoute }) {

    const name = "cnd-main-menu"
    const filteredItems = routes.filter((aItem) => aItem.hideInTop != true)
    const menuClasses = conductorTheme.menu_cnt


    if (index >= filteredItems.length) {
        index = 0;
    }

    const MenuItem = memo(({ item: a, itemRefs, index: index2, visibleItemsCount }) => {
        return callFn('getButtonForConductorSmall', [a, index, () => {
            setIndex(a.index);
            getNumCols(currentBreakpoint, routes[index])
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
            getNumCols(currentBreakpoint, routes[index]);
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
                className={' ' + menu_settings?.class ?? ''}
                onPress={handlePress}
            >
                <Row className="  hover:cursor-pointer justify-between  flex flex-row h-10 items-center px-3 text-base rounded-xl web:hover:bg-muted items-center ">
                    {translatedTitle}
                    {addonContent}
                </Row>
            </Pressable>
        );
    });

    const ButtonEx = memo(({ visibleItemsCount }) => {
        return <View className="pr-3"><Button startDecorator="ChevronDown" variant='text' rounded pressed={visibleItemsCount <= index ? true : false} size="sm" /></View>;
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

const LeftSideBarContainer = ({ menu, routes, currentUser, index, setIndex, headerSettings, children, layoutName }) => {
    const menuSettings = getMenuSettings(menu.object, menu.config, menu);

    const { t } = useTranslation();
    const addButtons = AddMenu(menu, 'hideInSideBar');
    return (
        <LeftSidebar title={layoutName == 'profile' ? '' : t(menuSettings?.name)} addButtons={addButtons} >
            {layoutName == 'navigator' && routes.filter((aItem) => aItem.hideInTop != true).map((a) => {
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
            {children}
        </LeftSidebar>
    )
}

const HeaderContainer = ({ tabBarObj, pageData, headerSettings, isCoverDisabled, isHideCover }) => {
 
    const isDesktop = useIsDesktop();
    const scrollValue = useSharedValue(isCoverDisabled ? 0 : 1);
    const hideDefaultHeaderFrom = useSharedValue(200);
    const coverHeight = useSharedValue(0);

    const uri = pageData?.uri;
    const coverMode = appSetting('cover', 'view_by_module', pageData.cover_block?.profile?.module)
    const isCover = pageData.cover_block && coverMode != 'none' ? (true) : false

    const handleScroll = useCallback(() => {
        requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
             scrollValue.value = currentScrollY > hideDefaultHeaderFrom.value ? 0 : 1;
        });       
    }, [scrollValue]);

    useEffect(() => {
        if (!appSetting('cover', 'fixed') && isCover) {
            window.addEventListener('scroll', handleScroll);
        }


        return () => {
            if (!appSetting('cover', 'fixed') && isCover) {
                window.removeEventListener('scroll', handleScroll);
            }
        };
    }, [handleScroll]);


    const animatedStyleHeaderCommon = useAnimatedStyle(() => {
        return {
            position: scrollValue.value == 1 || (false) ? 'relative' : 'fixed',
            marginBottom: scrollValue.value == 1 || (false) ? '0px' : hideDefaultHeaderFrom.value + 'px',
        };
    }, [scrollValue,isDesktop, isCoverDisabled]);

    const animatedStyleHeaderCover = useAnimatedStyle(() => {
        return {
            display: scrollValue.value == 1 ? 'flex' : 'none',
        };
    }, [scrollValue]);

    const animatedStyleHeaderCoverSmall = useAnimatedStyle(() => {
        return {
            display: scrollValue.value == 1  ? 'none' : 'flex', // display: scrollValue.value == 1 || (isCoverDisabled && !isDesktop) ? 'none' : 'flex',
        };
    }, [scrollValue]);

    const animatedStyleHeaderSpacer = useAnimatedStyle(() => {
        return {
            display: scrollValue.value == 1 || (false) ? 'none' : 'flex',
            height: scrollValue.value == 1 || (false) ? '0px' : (coverHeight.value) + 'px',

        };
    }, [scrollValue, coverHeight]);


const onCoverLayout = useCallback((e) => {
    coverHeight.value = e.nativeEvent.layout.height || 0;
}, []);


const onMenuLayout = useCallback((e) => {
  menuHeight.value = e.nativeEvent.layout.height || 0;
}, []);

    return (
        <View className="z-50">
            <Animated.View style={[{}, animatedStyleHeaderSpacer]} />
            <Animated.View style={[{ width: '100%' }, animatedStyleHeaderCommon]}>
                <View className={`${conductorTheme.cover_base} cover-1`} onLayout={onCoverLayout}>
                    <Animated.View style={[{}, animatedStyleHeaderCover]}>
                        <ViewRef  className={conductorTheme.cover_content}   >
                            {(isCover && !isHideCover) && <View className="w-full ">
                                <Cover data={pageData.cover_block} mode={headerSettings.cover} uri={uri} context={pageData.context} />
                            </View>}

                        </ViewRef>
                    </Animated.View>
                    <Animated.View style={[{}, animatedStyleHeaderCoverSmall]}>
                        <ViewRef className={conductorTheme.cover_small + '  header-fixed'} >
                            {(isCover && !isHideCover || !isDesktop) && <View className="w-full">
                                <CoverSmall context={pageData.context} data={pageData.cover_block} />
                            </View>}
                        </ViewRef>
                    </Animated.View>
                    <View className="w-full header-fixed" >
                        {tabBarObj}
                    </View>
                </View>
            </Animated.View>
        </View>

    )
};
/*
leftSideBar to remove
*/
const TabBar = ({ menu, routes, pageData, layoutName, currentUser, index, setIndex, getNumCols, currentBreakpoint, onChangeRoute, omitDefaultBackground = false }) => {
    const { t } = useTranslation();
    const { layoutName: layout } = useLayoutSettings();
    const menuSettings = getMenuSettings(menu.object, menu.config, menu);
    if (routes.length > 1) {
        const addButtons = AddMenu(menu, 'hideInTopBar')
        return (
            <TopSidebar layoutName={layoutName} omitDefaultBackground={omitDefaultBackground} addButtons={addButtons} layout={layout} title={t(menuSettings?.name)} >
                <View className="flex-1">
                    <ConductorMenu currentUser={currentUser} routes={routes} index={index} t={t} setIndex={setIndex} getNumCols={getNumCols} currentBreakpoint={currentBreakpoint} onChangeRoute={onChangeRoute} />
                </View>
                {(!!pageData.cover_block?.actions_menu) && <Row className="hidden lg:block items-center mx-3 ">
                    {!!appSetting('cover', 'more_menu_in_navbar', pageData?.module) && <Row className="gap-2">
                        <CoverMenu
                            {...pageData.cover_block.actions_menu}
                            uri={pageData.uri}
                            isSplitMenu={true}
                            containerClasses="gap-2 "
                        />
                        <CoverMenuMore
                            {...pageData.cover_block.actions_menu}
                            uri={pageData.uri}
                            isSplitMenu={true}
                        /></Row>}
                </Row>}
            </TopSidebar>
        )
    }
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