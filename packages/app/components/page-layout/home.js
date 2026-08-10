import { View, Row, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
    appSetting,
    storageSet,
    storageGet,
    asyncStorageSet,
} from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import { getComponent } from 'app/components/registry'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps
} from 'app/ui/molecules/resizable-panels'
import { useLayoutSettings } from 'app/context/layout-settings'
import Badge from 'app/ui/molecules/badge'
import Badges from 'app/ui/molecules/badges'
import { useBreakpoint, useWindowSize, useIsDesktop, useWindowHeight, useWindowWidth, useBreakpointName } from 'app/context/measure';
import { useSetHeader, useHeaderHeight, defaultHeader } from 'app/context/jotai/layout';
import { useFocusEffect }  from 'app/lib/hooks/router'
import { Button, ButtonLink, NeoButton, NeoButtonLink } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon';

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

const getTimelineBlock = (name, timelineBlocks) => {
    const map = {
        foryou: 'bx_timeline:get_block_view_feed_and_hot',
        account: 'bx_timeline:get_block_view_account',
        hot: 'bx_timeline:get_block_view_hot',
        public: 'bx_timeline:get_block_view_home',
        channels: 'bx_timeline:get_block_view_channels',
    };

    return timelineBlocks.find(item => item.name === map[name]);
};

const mapLayoutBlocks = (items = []) =>
    items.map(({ source }) => ({
        name: source,
        block: { name: source },
    }));

const defineCells = (blocks, data) => {
    if (data?.layout_parsed) {
        const elements = data.elements || {};
        const centerCell = elements.cell_center || [];

        const sideBarBlocks = mapLayoutBlocks(elements.cell_right);
        const centerBlocks = mapLayoutBlocks(elements.cell_top);
        const navBarBlocks = mapLayoutBlocks(elements.cell_left);
        const timelineBlocks = mapLayoutBlocks(
            centerCell.filter(item => item?.source?.includes('bx_timeline'))
        );
        const topBlocks = mapLayoutBlocks(
            centerCell.filter(item => !item?.source?.includes('bx_timeline'))
        );

        return { sideBarBlocks, topBlocks, centerBlocks, navBarBlocks, timelineBlocks };
    }

    const mapFromBlocks = (predicate) =>
        Object.entries(blocks)
            .filter(([, value]) => predicate(value))
            .map(([key, value]) => ({ name: key, block: value }));

    const sideBarBlocks = mapFromBlocks(b => b.sidebar);
    const topBlocks = mapFromBlocks(b => b.topbar);
    const centerBlocks = mapFromBlocks(b => b.center);
    const navBarBlocks = mapFromBlocks(b => b.leftbar);
    const timelineBlocks = [];

    return { sideBarBlocks, topBlocks, centerBlocks, navBarBlocks, timelineBlocks };
};


export default function ({ data, blocks }) {


 /*   return  <>
   
    <NeoButton style="bordered" label="Save" image="Save" onPress={() => {}} />
         <NeoButton style="bordered" width="fill" align="start" controlSize="large" onPress={() => {}}>
                                <Row className="flex-row items-center gap-3 flex-1 w-full">
                                    <Icon icon="FileText" size={22} className="text-foreground" />
                                    <View className="flex-1">
                                        <Text className="text-foreground font-medium">Untitled.md</Text>
                                        <Text className="text-muted-foreground text-xs">Edited 5 minutes ago</Text>
                                    </View>
                                    <Icon icon="ChevronRight" size={20} className="text-muted-foreground" />
                                </Row>
                            </NeoButton>
        </>*/
  /*  return <>
    <View className='mt-24'>
    <Button onPress={() => {
        console.log('onPress')
    }} title="Button" variant="primary" startDecorator='Plus'></Button>

<Button onPress={() => {
        console.log('onPress')
    }} variant="primary" startDecorator='Plus'></Button>
    <Button onPress={() => {
        console.log('onPress')
    }} variant="primary" startDecorator='Minus' rounded></Button>
    <Button  title="NoButton" variant="primary" startDecorator='Plus'></Button>
     <ButtonLink  fullWidth href='/about' title="ButtonLink" variant="primary" startDecorator='Plus'></ButtonLink>
     <ButtonLink   href='https://www.google.com' target='_blank' title="ButtonLink google" variant="primary" ></ButtonLink>


    

     <Link href='https://www.google.com' target='_blank'>google</Link>
     </View>
    </>  */
    /*  return <>
      <Text fontFamily="font-main" className="text-red-500 text-3xl" >The quick brown fox jumps over the lazy dog.  
 Packz my box with five dozen liquor jugs. 
 </Text>
      <Text fontFamily="font-title" className="text-red-500 text-3xl" >The quick brown fox jumps over the lazy dog.  
 Pack my box with five dozen liquor jugs.    
 </Text>
 
  <Text  className="text-red-500 text-3xl" >The quick brown fox jumps over the lazy dog.  
 Pack my box with five dozen liquor jugs.   
 </Text>
 </>
    /* const wh = useWindowWidth();
     console.log("whwhwh", wh)
     return
    /*   const currentBreakpoint = useBreakpoint();
      const isDesktop = useIsDesktop();
      // const windowSize = useWindowSize();
       //console.log("!!!!!!!useWindowSize ", windowSize )
          console.log("!!!!!!!bucket ", currentBreakpoint )
 return;*/
    //  return <Button variant="accent" title="dfsdfsd" startDecorator="Plus"></Button>

    // return <Loading/>
    /*return (
    <Text className="text-red-500">zcxzxc zxc<Icon className="text-red-500 " icon="Plus"></Icon></Text>
    <Button startDecorator="Plus" title="fdfdsf" variant="badge"></Button>
     <Button startDecorator="Plus" variant="badge" title="fdfdsf"></Button>
</>
    )*/
    const MenuItemSidebarWithWrapper = getComponent('menu-item', 'sidebar_with_wrapper');
    const isWeb = Platform.OS == 'web'
    const isDesktop = useIsDesktop();
    const { layoutName, layoutSettings } = useLayoutSettings();

    const setHeader = useSetHeader();
    const headerHeight = useHeaderHeight();
    const [sideBarWidth, setSideBarWidth] = useState(undefined);
    const [asideWidth, setAsideWidth] = useState(undefined);

    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()

    const feedTypeD = storageGet('feed:type', '', true)

    const [feedType, setFeedType] = useState(
        feedTypeD ? feedTypeD : appSetting('feed', 'default_feed')
    )

    const feedList = appSetting('feed', 'list')

    function setFeedTypeEx(mode) {
        storageSet('feed:type', '', mode, true)
        setFeedType(mode)
    }

    const handleSideBarLayout = useCallback(({ nativeEvent: { layout } }) => {
        const nextWidth = layout?.width;
        setSideBarWidth(prevWidth => (prevWidth === nextWidth ? prevWidth : nextWidth));
    }, []);

    const handleAsideLayout = useCallback(({ nativeEvent: { layout } }) => {
        const nextWidth = layout?.width;
        setAsideWidth(prevWidth => (prevWidth === nextWidth ? prevWidth : nextWidth));
    }, []);

    const { sideBarBlocks, navBarBlocks, topBlocks, centerBlocks, timelineBlocks } = defineCells(blocks, data);


    asyncStorageSet('layout:visited', 'true')
    let dUser = Object.assign({}, currentUser)
    dUser.url_avatar = dUser.avatar
    dUser.url = appSetting('dashboard', 'url')
    const headerBlocks = (
        <>
            {topBlocks?.map((item, index) => {
                return (
                    <View className='mb-0.5 sm:mb-3' key={'block_' + index}><BlockByName
                        name={item.block}
                        data={data}
                        {...item.block.props}
                    /></View>
                )
            })}
        </>
    )
    
    const BlocksCenter = <View className={` mx-auto w-full`}>
        {centerBlocks?.map((item, index) => {
            return (
                <BlockByName
                    key={'block_' + index}
                    name={item.block}
                    data={data}
                    {...item.block.props}
                />
            )
        })}</View>

    const MenuItemSubmenu = getComponent('menu-item', 'submenu');

    const subHeader = useMemo(() =>
        feedList.length > 1 ? (
            <ScrollView horizontal={true} className='flex w-full scrollbar-hide ps-3 py-2'>
                <Row className={`${feedList.length > 1 ? ' gap-2 ' : ''}`}>
                    {feedList.map((item, index) => (
                        <View key={'row_' + index}>
                            <MenuItemSubmenu
                                icon={item.icon}
                                title={item.showTitle ? t(item.title) : ''}
                                pressed={feedType == item.name}
                                onPress={() => {
                                    setFeedTypeEx(item.name)
                                }}
                            />
                        </View>
                    ))}
                </Row>
            </ScrollView>
        ) : null,
        [feedList, feedType]
    );

    const FeedContent = (
        <>
            {layoutName == 'ver' && (
                <View className={`hidden ${TABLET_MODE_FROM}:flex`}>
                    {subHeader}
                </View>
            )}

            {feedList.map((item, index) => {
                if (feedType == item.name) {
                    return (
                        <View className='' key={'view' + index}>
                            <BlockByName
                                data={data}

                                name={
                                    blocks?.[item.name + '_feed_form']
                                }
                            />
                            <BlockByName
                                data={data}
                                name={timelineBlocks.length ? getTimelineBlock(item.name, timelineBlocks) : blocks?.[item.name + '_feed']}
                                unitMode={layoutSettings.feed_unit}
                                exProps={{
                                    headerBlocks: headerBlocks,
                                }}
                            />
                        </View>
                    )
                }
                return (
                    <React.Fragment key={'empty_' + index}></React.Fragment>
                )
            })}
        </>
    )

    const AsideContent = (
        <>
            {sideBarBlocks.map((item, index) => {
                return (
                    <BlockByName
                        exProps={item.block}
                        key={'block_' + index}
                        name={item.block}
                        data={data}
                        {...item.block.props}
                    />
                )
            })}
        </>
    )

    const SideBarContent = (
        <View
            style={{
                top: headerHeight,
                height: `calc(100vh - ${headerHeight}px)`,
                width: sideBarWidth,
            }}
            className="flex-auto p-4 gap-0.5 fixed overflow-scroll "
        >
            
                {appSetting('layout', 'show_profile_info') && (
                    <View className="-mx-2">
                        <NeoButtonLink
                            href={currentUser.url}
                            alt={currentUser.display_name}
                            style="borderless"
                            // Matches the sidebar menu items below (see
                            // menu-items/sidebar-with-wrapper.js) so the profile row
                            // is not taller than the list it sits above.
                            controlSize="large"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            className="group"
                        >
                            <Row className="w-full items-center">
                                <Profile
                                    {...currentUser}
                                    url_avatar={currentUser.avatar}
                                    displayType="unit_wo_info"
                                    displaySize="sm"
                                    showLinks={false}
                                />
                                <Row className="flex-auto items-center gap-1">
                                    <Row className="items-center gap-1 flex-auto">
                                        <Text className="px-2 text-sm leading-tighter font-semibold truncate text-card-foreground web:group-hover:text-foreground">
                                            {currentUser.display_name}
                                        </Text>
                                        {currentUser.badges ? <Badges badges={currentUser.badges} size="xs" /> : null}
                                    </Row>
                                    {currentUser.membership_name ? (
                                        <Badge
                                            size="xs"
                                            variant="default"
                                            data={{
                                                text: currentUser.membership_name,
                                                icon: currentUser.membership_icon,
                                                icon_url: currentUser.membership_icon_url
                                            }}
                                        />
                                    ) : null}
                                </Row>
                            </Row>
                        </NeoButtonLink>
                    </View>
                )}

                {feedList.length > 1 && (
                    <View className="py-3 border-b border-border/60 gap-0.5 -mx-2">
                        {feedList.map((item, index) => {
                            return (
                                <MenuItemSidebarWithWrapper
                                    key={`menu-${index}`}
                                    onPress={() => {
                                        setFeedTypeEx(item.name)
                                    }}
                                    isActive={feedType == item.name}
                                    icon={item.icon}
                                    title={t(item.title)}
                                    index={index}
                                    userUrl={currentUser.url}
                                />
                            )
                        })}
                    </View>
                )}

                {navBarBlocks.map((item, index) => {
                    return (
                        <View className={(appSetting('layout', 'show_profile_info') || feedList.length > 1) || index > 0 ? " " : ''} key={'block_' + index}>
                            <BlockByName
                                name={item.block}
                                data={data}
                                {...item.block.props}
                            />
                        </View>
                    )
                })}
            
        </View>
    )

    const AsidePanelContent = (
        <View
            style={{
                top: headerHeight,
                height: `calc(100vh - ${headerHeight}px)`,
                width: asideWidth,
            }}
            className="fixed overflow-scroll p-4 gap-4"
        >
            {AsideContent}
        </View>
    )

    const cellsCustomConfig = useMemo(() => {
        return appSetting('layouts', 'home') || appSetting('layouts', 'cols-l-c-r');
    }, []);
    const groupRef = useRef(null);
    const currentBreakpoint = useBreakpoint();
    const { cells = {} } = cellsCustomConfig || {};
    const currentBreakpointName = useBreakpointName();

    // LEFT
    const {
        breakpoint: leftBreakpoint,
        responsive: leftResponsive,
        ...leftBase
    } = cells.left ?? {};
    const leftPanelProps = resolvePanelProps(leftBase, leftResponsive, currentBreakpointName);


    // CENTER
    const {
        breakpoint: centerBreakpoint,
        responsive: centerResponsive,
        ...centerBase
    } = cells.center ?? {};
    const centerPanelProps = resolvePanelProps(centerBase, centerResponsive, currentBreakpointName);

    // RIGHT
    const {
        breakpoint: rightBreakpoint,
        responsive: rightResponsive,
        ...rightBase
    } = cells.right ?? {};
    const rightPanelProps = resolvePanelProps(rightBase, rightResponsive, currentBreakpointName);

    const onLayout = (sizes) => {
        if (isWeb) {
            setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100);
        }
    };

    useEffect(() => {
        if (isWeb) {
            groupRef.current?.setLayout([leftPanelProps.defaultSize, centerPanelProps.defaultSize, rightPanelProps.defaultSize]);
        }
    }, [currentBreakpointName]);

   
    useEffect(() => {
        if (isWeb) 
            setHeader(isDesktop ? defaultHeader : { subHeader: subHeader });
    }, [isDesktop, subHeader, setHeader]);



    useFocusEffect(
        useCallback(() => {
            if (!isWeb) 
                setHeader(isDesktop ? defaultHeader : { subHeader: subHeader });
        }, [isWeb, isDesktop, defaultHeader, subHeader, setHeader])
    );

    return (
        <>{BlocksCenter}
        
            <PanelGroup
                ref={groupRef}
                key={`cells-home${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                autoSaveId={cellsCustomConfig.sizable ? `cells-home` : undefined}
                direction="horizontal"
                className={`${appSetting('layout', 'page_content_width_default')} ns--panel-group-- mx-auto flex-auto flex-row ne--`}
                onLayout={onLayout}
            >
                {layoutName == 'hor' && isWeb && (
                    <>
                        <Panel className={`hidden ${leftBreakpoint}:block sm:w-full `} {...leftPanelProps}>
                            <View onLayout={handleSideBarLayout} className="flex-auto h-full w-full">
                                {SideBarContent}
                            </View>
                        </Panel>
                        <PanelHandler
                            gap={`hidden ${leftBreakpoint}:block`}
                            sizable={cellsCustomConfig.sizable}
                            panelLine={cellsCustomConfig['panel-line']}
                        />
                    </>
                )}
                <Panel className="w-full min-w-0 native:w-full" {...centerPanelProps}>
                    <View className={`${appSetting('layout', 'feed_container')}`}>
                        {FeedContent}
                    </View>
                </Panel>

                {isWeb && (
                    <>
                        <PanelHandler
                            gap={`hidden ${rightBreakpoint}:block`}
                            sizable={cellsCustomConfig.sizable}
                            panelLine={cellsCustomConfig['panel-line']}
                        />
                        <Panel className={`hidden ${rightBreakpoint}:block ${currentBreakpointName}:w-full`} {...rightPanelProps}>
                            <View onLayout={handleAsideLayout} className="flex-auto h-full w-full">
                                {AsidePanelContent}
                            </View>
                        </Panel>
                    </>
                )}
            </PanelGroup>
        </>
    )
}
