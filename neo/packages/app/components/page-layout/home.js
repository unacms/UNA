import { View, Row, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { appSetting } from 'app/lib/util'
import { usePref, setPref } from 'app/context/prefs'
import { useCurrentUser } from 'app/context/user'
import { useTranslation } from 'react-i18next'
import Profile from 'app/ui/molecules/profile/profile'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import { components } from 'app/components/registry'
import { InformerStrip, useBelowInformerStrip } from 'app/components/elements/informer'
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps
} from 'app/ui/molecules/page/resizable-panels'
import { useLayoutSettings } from 'app/context/layout-settings'
import Badge from 'app/ui/molecules/profile/badge'
import Badges from 'app/ui/molecules/profile/badges'
import { useBreakpoint, useIsDesktop, useBreakpointName } from 'app/context/measure';
import { useHeaderHeight } from 'app/context/jotai/layout';
import { PageHeaderOptions } from 'app/ui/molecules/header/options';
import { NeoButtonLink } from 'app/design/controls';
import HomeCover from 'app/components/elements/covers/home-cover';
import { PageFooter } from 'app/components/nav/menu-footer';

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

// A block UNA marks `splash_only` (the sign-in and join blocks while they are off for the apps) is for the splash,
// which finds it in the page's blocks; the home page leaves it out.
const mapLayoutBlocks = (items = []) =>
    items.filter((item) => !item?.splash_only).map(({ source }) => ({
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
        Object.entries(blocks || {})
            .filter(([, value]) => predicate(value))
            .map(([key, value]) => ({ name: key, block: value }));

    const sideBarBlocks = mapFromBlocks(b => b.sidebar);
    const topBlocks = mapFromBlocks(b => b.topbar);
    const centerBlocks = mapFromBlocks(b => b.center);
    const navBarBlocks = mapFromBlocks(b => b.leftbar);
    const timelineBlocks = [];

    return { sideBarBlocks, topBlocks, centerBlocks, navBarBlocks, timelineBlocks };
};


/**
 * What the home page has beside and under its top blocks on this screen: side columns (web only, where they are
 * pinned to the window: the member's profile and feed menu or left blocks, right blocks) and a feed (a guest's home
 * has none unless UNA gives guests a timeline block).
 */
const homeColumns = ({ isWeb, currentUser, feedList, blocks, navBarBlocks, sideBarBlocks, timelineBlocks }) => {
    const hasProfile = Boolean(appSetting('layout', 'show_profile_info') && currentUser)
    const hasLeftColumn = (hasProfile || feedList.length > 1 || navBarBlocks.length > 0)
    const hasSideColumns = isWeb && (hasLeftColumn || sideBarBlocks.length > 0)
    const hasFeed = timelineBlocks.length > 0 || feedList.some(item => blocks?.[item.name + '_feed'])
    // Native: the feed list owns the scrolling and the space under the floating header, so the cover and the center
    // blocks go at the top of the list (centerInFeed). Above the list they would sit under the header.
    const centerInFeed = !isWeb && hasFeed && !hasSideColumns
    return { hasSideColumns, hasFeed, centerInFeed, centerAbove: !hasSideColumns && !centerInFeed }
}

/** The top blocks open the middle column beside side columns, else they run across the page's content width. */
const topBlocksClassName = (inColumn) => inColumn
    ? 'w-full gap-4 pb-4'
    : `${appSetting('layout', 'page_content_width_default')} mx-auto gap-4 px-0 pt-0 sm:px-4 sm:pt-4`

export default function ({ data, blocks }) {
/*
return <View className='bg-blue-500 w-full h-full pt-24'>
 <Link
                            href={'/view-persons-profile/dr-andrey-yasko-phd'}
                    
                          
                        >
                            <Text>df sdf sdf</Text>
                        </Link>
</View>*/
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
    const MenuItemSidebarWithWrapper = components['menu-item']['sidebar_with_wrapper'];
    const isWeb = Platform.OS == 'web'
    const isDesktop = useIsDesktop();
    const { feedUnit } = useLayoutSettings();

    const headerHeight = useHeaderHeight();
    // The fixed side columns start under the informer strip while it is in view (layout.web.js).
    const columnsTop = useBelowInformerStrip(headerHeight);
    const [sideBarWidth, setSideBarWidth] = useState(undefined);
    const [asideWidth, setAsideWidth] = useState(undefined);

    const { t } = useTranslation()
    const { currentUser } = useCurrentUser()

    // Stored preference is applied after hydration; SSR and first paint use the default.
    const feedType = usePref('feedType') ?? appSetting('feed', 'default_feed')

    const feedList = appSetting('feed', 'list')

    function setFeedTypeEx(mode) {
        setPref('feedType', mode)
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


    let dUser = Object.assign({}, currentUser)
    dUser.url_avatar = dUser.avatar
    dUser.url = appSetting('dashboard', 'url')
    
    // UNA's home cover (Studio > Pages > Home > Cover, sent as `cover_home`) and the blocks of the top cell (the home
    // menu). On the web the side columns are fixed to the window, so whatever is above them would slide under them:
    // with side columns these go at the top of the middle column, above the feed; without any (a guest's home), across
    // the page's content width above it, as UNA's site shows them.
    const { hasSideColumns, hasFeed, centerInFeed, centerAbove } = homeColumns({ isWeb, currentUser, feedList, blocks, navBarBlocks, sideBarBlocks, timelineBlocks })
    const hasTop = Boolean(data?.cover_home) || centerBlocks?.length > 0
    const BlocksCenter = hasTop ? <View className={topBlocksClassName(hasSideColumns)}>
        <HomeCover cover={data?.cover_home} hiddenOn={data?.cover_hidden_on} />
        {centerBlocks?.map((item, index) => {
            return (
                <BlockByName
                    key={'block_' + index}
                    name={item.block}
                    data={data}
                    {...item.block.props}
                />
            )
        })}</View> : null

    // The top of the feed list: on native the cover and the center blocks (homeColumns), then the top cell's blocks.
    const headerBlocks = (
        <>
            {centerInFeed ? BlocksCenter : null}
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

    const MenuItemSubmenu = components['menu-item']['submenu'];

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
                                unitMode={feedUnit}
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
                top: columnsTop,
                height: `calc(100vh - ${columnsTop}px)`,
                width: sideBarWidth,
            }}
            className="flex-auto p-4 gap-0.5 fixed overflow-scroll "
        >
            
                {/* A guest's home without the splash (Studio > Designer > Splash off) has no profile to show. */}
                {appSetting('layout', 'show_profile_info') && currentUser && (
                    <View className="-mx-2">
                        <NeoButtonLink
                            href={currentUser.url}
                            alt={currentUser.display_name}
                            style="borderless"
                            // Matches the sidebar menu items below (see
                            // menu-items/sidebar-with-wrapper.js) so the profile row
                            // is not taller than the list it sits above.
                            controlSize="regular"
                            width="fill"
                            align="start"
                            contentInsets={{ x: 8 }}
                            className="group"
                        >
                            <Row className="w-full items-center">
                                <Profile
                                    {...currentUser}
                                    url_avatar={currentUser.avatar}
                                    color={currentUser.color}
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
                                    userUrl={currentUser?.url}
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
                top: columnsTop,
                height: `calc(100vh - ${columnsTop}px)`,
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

    const content = (
        <>
            <PageHeaderOptions sub={subHeader} band mobileOnly />
            {/* The home cover is the page's heading: no title in the header over it. */}
            {data?.cover_home ? <PageHeaderOptions showTitle={false} /> : null}
            {centerAbove ? BlocksCenter : null}
        
            {hasFeed || hasSideColumns ? <PanelGroup
                ref={groupRef}
                key={`cells-home${cellsCustomConfig.sizable ? 'sizable' : 'static'}`}
                autoSaveId={cellsCustomConfig.sizable ? `cells-home` : undefined}
                direction="horizontal"
                className={`${appSetting('layout', 'page_content_width_default')} mx-auto flex-auto flex-row`}
                onLayout={onLayout}
            >
                {isWeb && (
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
                        {/* The apps: the informer strip above the feed, under the header (the web has it under its header,
                            layout.web.js). */}
                        {!isWeb ? <InformerStrip /> : null}
                        {hasSideColumns ? BlocksCenter : null}
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
            </PanelGroup> : null}
        </>
    )

    // A member's feed loads on as it scrolls and has the footer's links in the account menu. A guest's home ends with
    // the site footer, at the bottom of the screen at least, as UNA's does.
    if (currentUser) return content
    return (
        <View className="w-full flex-col" style={isWeb ? { minHeight: `calc(100vh - ${headerHeight}px)` } : undefined}>
            {content}
            <View className="flex-1" />
            <PageFooter />
        </View>
    )
}
