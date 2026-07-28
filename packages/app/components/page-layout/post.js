import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { LAYOUT_BREAKPOINTS } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView, { KbStickyView } from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import emitter from 'app/context/emitter';
import { useIsDesktop, useWindowHeight, useBreakpoint, useBreakpointName } from 'app/context/measure';
import { appSetting } from 'app/lib/util';
import { Card } from 'app/ui/molecules/card';
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps,
} from 'app/ui/molecules/resizable-panels'
import { useSetHeader, defaultHeader, useSetFooter, useHeaderHeight } from 'app/context/jotai/layout';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
import { useStickyHeaderOffset, stickySidebarStyle } from 'app/lib/hooks/use-sticky-header-offset'
import { Loading } from 'app/customization/loading'
const mapLayoutBlocks = (items) =>
    (Array.isArray(items) ? items : []).map(({ source }) => ({
        name: source,
        block: { name: source },
    }));

const getCommentsData = (data, blocks) => {
    const bottomCell = data?.elements?.cell_bottom;

    if (data?.layout_parsed && Array.isArray(bottomCell) && bottomCell.length > 0) {
        return bottomCell[0];
    }

    return DataByName(data, blocks?.comments);
};

const defineCells = (blocks, data) => {
    if (data?.layout_parsed) {
        const elements = data.elements || {};

        const sideBarBlocks = mapLayoutBlocks(elements.cell_right);
        const centerBlocks = mapLayoutBlocks(elements.cell_center);
        const leftBarBlocks = mapLayoutBlocks(elements.cell_left);
        const topBlocks = mapLayoutBlocks(elements.cell_top);

        return { sideBarBlocks, topBlocks, centerBlocks, leftBarBlocks };
    }

    const mapFromBlocks = (predicate) =>
        Object.entries(blocks)
            .filter(([, value]) => predicate(value))
            .map(([key, value]) => (value));

    const sideBarBlocks = mapFromBlocks(b => b.sidebar);
    const topBlocks = mapFromBlocks(b => b.forHeader);
    const centerBlocks = mapFromBlocks(b => b.forList);
    const leftBarBlocks = mapFromBlocks(b => b.leftbar);


    return { sideBarBlocks: sideBarBlocks, topBlocks: topBlocks, centerBlocks: centerBlocks, leftBarBlocks: leftBarBlocks };
};

export default function PageLayout({ data, blocks, isModal = false, url, pageClasses }) {
    const { contentWidth, padding, gap } = pageClasses ?? {};
    const isWeb = Platform.OS == 'web';
    const windowHeight = useWindowHeight();
    const insets = useSafeAreaInsets();
    const isDesktop = useIsDesktop();
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    const currentBreakpoint = useBreakpoint();
    const currentBreakpointName = useBreakpointName()
    const isLgUp = currentBreakpoint >= LAYOUT_BREAKPOINTS.lg;
    const isFormFixed = isWeb && !isLgUp;
    const groupRef = useRef(null)
    const setHeader = useSetHeader();
    const setFooter = useSetFooter();
    const searchParams = useLocalSearchParams();
    const pageHeaderHeight = useHeaderHeight();
    const stickyTop = useStickyHeaderOffset(isWeb ? pageHeaderHeight : 0);
    const stickySidebarScrollStyle = stickySidebarStyle(stickyTop);

    const localUrl = isModal ? url : searchParams.url;
    const commentsData = useMemo(() => getCommentsData(data, blocks), [data, blocks?.comments]);
    const commentsContent = commentsData?.content?.[0];
    const commentsBrowse = commentsContent?.browse;
    const commentsModule = commentsBrowse?.data?.module || commentsData?.module;
    const commentsObjectId = commentsBrowse?.data?.object_id;
    const commentsForm = commentsContent?.form;
    const commentsRequestUrl = commentsContent?.url;

    

    useEffect(() => {
        if (localUrl) {
            const hash = localUrl.split('#')[1];
            if (hash) {
                // click on reply
                if (hash.includes('cmt_id=')) {
                    setReplyId(hash);
                    emitter.emit('editor', { action: 'focus', note: "setReplyId", timeout: 800 });
                    setScrollToEnd(hash.replace('cmt_id=', ''));
                }
                else {
                    if (hash.includes('cid=')) {

                        //click from notifs
                        setScrollToEnd(hash.replace('cid=', ''));
                    }
                    else {
                        // click on comments
                        setScrollToEnd(true);
                        emitter.emit('editor', { action: 'focus', note: "a", timeout: 800 });
                    }

                }
            }

        }
    }, [localUrl, data]);


    useEffect(() => {


        const subscription2 = emitter.addListener(`comment`, (data) => {
            if (data.action == 'send') {
                setReplyId(false)
            }
        })

        return () => {
            subscription2.remove();
        }
    }, [])

    const { leftBarBlocks, sideBarBlocks, centerBlocks } = defineCells(blocks, data);

    const mainBlocks = isDesktop && !isModal ? centerBlocks : [...centerBlocks, ...sideBarBlocks, ...leftBarBlocks]

    const aItems = useMemo(() => mainBlocks.map((value, index) => ({
        id: `block_${value.name}`,
        data: <View className={'p-3 sm:px-4 ' + (index != 0 ? 'pt-0' : 'pt-3')}><BlockByName isModal={isModal} data={data} name={value} contentOnly={true} /></View>
    })), [blocks, data, isDesktop]);

    const isRightCol = sideBarBlocks.length > 0 && isDesktop
    const isLeftCol = leftBarBlocks.length > 0 && isDesktop

    const viewProps = isWeb ? {
        style: { minHeight: !isDesktop ? windowHeight : windowHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        //if (isWeb)
            setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleListLayout = (event) => {
        setListWidth(event.nativeEvent.layout.width - 2)
    }

    const layoutCols =
        !isLeftCol && !isRightCol
            ? 'c'
            : !isLeftCol
                ? 'c-r'
                : !isRightCol
                    ? 'l-c'
                    : 'l-c-r'

    const cellsCustomConfig = useMemo(() => {
        return (
            appSetting('layouts', data?.uri) ||
            appSetting('layouts', `cols-${layoutCols}`)
        )
    }, [data?.uri, layoutCols])

    const { cells = {} } = cellsCustomConfig || {}

    // LEFT
    const {
        breakpoint: leftBreakpoint,
        responsive: leftResponsive,
        ...leftBase
    } = cells.left ?? {}
    const leftPanelProps = resolvePanelProps(
        leftBase,
        leftResponsive,
        currentBreakpointName
    )

    // CENTER
    const {
        breakpoint: centerBreakpoint,
        responsive: centerResponsive,
        ...centerBase
    } = cells.center ?? {}
    const centerPanelProps = resolvePanelProps(
        centerBase,
        centerResponsive,
        currentBreakpointName
    )

    // RIGHT
    const {
        breakpoint: rightBreakpoint,
        responsive: rightResponsive,
        ...rightBase
    } = cells.right ?? {}
    const rightPanelProps = resolvePanelProps(
        rightBase,
        rightResponsive,
        currentBreakpointName
    )

    const onLayout = (sizes) => {
        setTimeout(() => window.dispatchEvent(new Event('resize_panel')), 100)
    }

    useEffect(() => {
        const layouts = []
        if (isLeftCol) {
            layouts.push(leftPanelProps.defaultSize)
        }
        layouts.push(centerPanelProps.defaultSize)
        if (isRightCol) {
            layouts.push(rightPanelProps.defaultSize)
        }

        const isValid = layouts.length > 0 && layouts.every(s => typeof s === 'number' && s > 0)

        if (groupRef && isValid) {
            groupRef.current?.setLayout(layouts)
        }
    }, [currentBreakpointName, groupRef])

    const isMultiColumn = leftBarBlocks.length > 0 || sideBarBlocks.length > 0;

    //console.log("headerItems[0].data", aItems[0])
    useEffect(() => {
        if (!isModal) {
            if (!isDesktop) {
                setHeader({ subHeader: aItems[0].data, backButton: true, title: data.module == 'bx_timeline' ? 'Update ' : 'Post' });
            }
            else {
                setHeader(defaultHeader);
            }

        }

    }, [isDesktop, isWeb, isMultiColumn, setHeader]);

    useEffect(() => {
        setFooter(false);
        return () => {
            setFooter(true);
        };
    }, []);

    let offset2 = 56;
    if (isDesktop)
        offset2 += 0;// offsets in modal web

    if (!isWeb) {
            offset2 = insets.bottom + insets.top;
            if (Platform.OS == 'ios') {
                offset2 = insets.bottom + insets.top + 80;
            }
        }
    if (isModal) {
        return (
            <View className="w-full flex-1 relative" >
                <View className="flex-1 w-full">
                        {data == 'loading' ?
                            <Loading />
                        : <CommentsBrowse
                            useCustomScrollHandler={true}
                            height={windowHeight - offset2 > 0 ? windowHeight - offset2 : undefined}
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            isModal={true}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                            marginBottom={formHeight}
                        />}
                </View>

                <KbStickyView
                    offset={{ closed: 0, opened: insets.bottom }}
                >
                    <View onLayout={handleLayout}>
                        <CommentsForm
                            isModal={isModal}
                            objectId={commentsObjectId}
                            module={commentsModule}
                            form={commentsForm}
                            requestUrl={commentsRequestUrl}
                        />
                    </View>
                </KbStickyView>
            </View>
        )

       /* else {

            return (
                <View className="w-full flex-1 ">
                    <View className="w-full flex-1" >
                        <CommentsBrowse
                            useCustomScrollHandler={true}
                            height={windowHeight > 0 ? windowHeight - 160 : undefined}
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            isModal={true}
                            browse={commentsData?.content[0]?.browse}
                            module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                            requestUrl={commentsData?.content[0]?.url}
                            replyId={replyId}
                        />
                    </View>
                    <KbAvoidingView modalOffset={90}>
                        <View
                            onLayout={handleLayout}
                            className="border-t border-border/60"
                        >
                            <CommentsForm
                                isModal={isModal}
                                objectId={commentsData?.content[0]?.browse.data.object_id}
                                module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module}
                                form={commentsData?.content[0]?.form}
                                requestUrl={commentsData?.content[0]?.url}
                            />
                        </View>
                    </KbAvoidingView>
                </View>
            )
        }*/
    }

    if (!isWeb || !isDesktop ) {
        const newItems = !isWeb || !isDesktop ? aItems.slice(1) : aItems;
        return (
            <View {...viewProps} className={`w-full ${isWeb ? '' : 'h-full'}`}>
                <View className={`max-w-5xl w-full flex-1 bg-card text-card-foreground lg:rounded-2xl lg:my-4 mx-auto `}>
                    <View
                        onLayout={handleListLayout}
                        style={{ pointerEvents: 'box-none', ...(isFormFixed ? { marginBottom: formHeight } : null) }}
                        className="w-full flex-1"
                    >
                        <CommentsBrowse

                            scrollToIndex={scrollToEnd}
                            addItems={newItems}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                        />
                    </View>
                    <KbAvoidingView>
                        <View
                            onLayout={handleLayout}
                            style={isFormFixed && listWidth ? { width: listWidth + 5 } : undefined}
                            className="bg-linear-to-t from-card to-transparent web:fixed web:bottom-0 web:z-50 lg:static lg:z-auto lg:w-full"
                        >
                            
                                <CommentsForm
                                    isModal={isModal}
                                    objectId={commentsObjectId}
                                    module={commentsModule}
                                    form={commentsForm}
                                    requestUrl={commentsRequestUrl}
                                />
                            
                        </View>
                    </KbAvoidingView>
                </View>
            </View>
        );
    }

    return (
        <PanelGroup
            ref={groupRef}
            key={`${data?.uri || 'default'}-pnl2-${cellsCustomConfig.sizable ? 'sizable' : 'static'
                }`}
            autoSaveId={
                cellsCustomConfig.sizable
                    ? `cells-${data?.uri || 'default'}`
                    : undefined
            }
            direction="horizontal"
            {...viewProps}
            className={`${contentWidth} ${isMultiColumn ? 'mx-auto' : ' mx-auto flex-1 h-full sm:min-h-[calc(100vh-16rem)]'} `}
            // Default panel-group overflow:hidden creates a scrollport and breaks
            // window-scroll sticky. clip still contains resize overflow without that.
            style={{ ...(viewProps.style || {}), overflow: 'clip' }}
            onLayout={onLayout}
        >
            {isLeftCol && (
                <>
                    <Panel
                        className={`hidden ${leftBreakpoint}:block `}
                        {...leftPanelProps}
                    >
                        <View className="h-full w-full">
                            <View
                                className="web:sticky w-full hidden sm:flex gap-y-3 web:overflow-y-auto"
                                style={stickySidebarScrollStyle}
                            >
                                {
                                    leftBarBlocks.map(([key, value]) => {
                                        return (
                                            <BlockByName key={value.name} data={data} name={value} sidebar={true} />
                                        )
                                    })}
                            </View>
                        </View>
                    </Panel>
                    <PanelHandler
                        gap={`hidden ${leftBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                        panelLine={cellsCustomConfig['panel-line']}
                    />
                </>
            )}
            <Panel {...centerPanelProps} className="mt-0.5 sm:m-0 sm:p-3 lg:p-4 ">
                <Card padding="pt-1" className={`w-full mx-auto `}>
                    <View
                        onLayout={handleListLayout}
                        style={{ pointerEvents: 'box-none', ...(isFormFixed ? { marginBottom: formHeight } : null) }}
                        className="w-full flex-1"
                    >
                        <CommentsBrowse
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                        />
                    </View>
                    <KbAvoidingView>
                        <View
                            onLayout={handleLayout}
                            style={isFormFixed && listWidth ? { width: listWidth + 5 } : undefined}
                            className="w-full max-lg:web:fixed max-lg:web:bottom-0 max-lg:z-50 lg:static "
                        >
                                <CommentsForm
                                    objectId={commentsObjectId}
                                    module={commentsModule}
                                    form={commentsForm}
                                    requestUrl={commentsRequestUrl}
                                />
                        </View>
                    </KbAvoidingView>
                </Card>
            </Panel>
            {isRightCol && (
                <>
                    <PanelHandler
                        gap={`hidden ${rightBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                        panelLine={cellsCustomConfig['panel-line']}
                    />
                    <Panel
                        className={`hidden ${rightBreakpoint}:block`}
                        {...rightPanelProps}
                    >
                        <View className="h-full w-full">
                            <View
                                className="web:sticky w-full hidden sm:flex gap-3 lg:gap-4 mt-0.5 sm:m-0 sm:p-3 lg:p-4 web:overflow-y-auto"
                                style={stickySidebarScrollStyle}
                            >
                                {
                                    sideBarBlocks.map((value) => {
                                        return (
                                            <BlockByName key={value.name} data={data} name={value} sidebar={true} />
                                        )
                                    })}
                            </View>
                        </View>
                    </Panel>
                </>
            )}
        </PanelGroup>
    );
}