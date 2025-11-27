import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { stripTags, cd, getBreakpoint } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import emitter from 'app/context/emitter';
import { useIsDesktop, useWindowHeight, useBreakpoint } from 'app/context/measure';
import { appSetting } from 'app/lib/util';
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps,
} from 'app/ui/molecules/resizable-panels'

export default function PageLayout({ data, blocks, isModal = false, url }) {
    const isWeb = Platform.OS == 'web';
    const windowWHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    const currentBreakpoint = useBreakpoint();
    const currentBreakpointName = getBreakpoint(currentBreakpoint)
    const groupRef = useRef(null)

    const localUrl = isModal ? url : useLocalSearchParams().url;
    const commentsData = useMemo(() => DataByName(data, blocks.comments), [data, blocks.comments]);


    // for modal
    const offset = isDesktop ? 100 : 60
    const [height, setHeight] = useState(
        windowWHeight - offset - 100
    )

    useEffect(() => {
        if (localUrl) {
            const hash = localUrl.split('#')[1];
            if (hash) {
                // click on reply
                if (hash.includes('cmt_id=')) {
                    console.log("notifsnotifs", hash)
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
    }, [localUrl]);

    const aItems = useMemo(() => Object.entries(blocks)
        .filter(([key, value]) => value.forList)
        .map(([key, value]) => ({
            id: `block_${key}`,
            data: <View className={value.name.includes("entity_text_block") || value.name.includes("get_block_text_and_subentries") ? 'px-4' : ''}><BlockByName isModal={isModal} data={data} name={value} contentOnly={true} /></View>
        })), [blocks, data]);

    const aItemsLeftBar = Object.entries(blocks).filter(([key, value]) => value.leftbar);
    const aItemsRightBar = Object.entries(blocks).filter(([key, value]) => value.sidebar);

    const isRightCol = aItemsRightBar.length > 0
    const isLeftCol = aItemsLeftBar.length > 0

    const viewProps = isWeb ? {
        style: { minHeight: !isDesktop ? windowWHeight : windowWHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        if (isWeb)
            setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleListLayout = (event) => {

        setListWidth(event.nativeEvent.layout.width - 2)
    }

    const handleLayoutModal = (event) => {
        const h =
            windowWHeight -
            offset -
            event.nativeEvent.layout.height
        setHeight(h)
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
        if (groupRef) {
            groupRef.current?.setLayout(layouts)
        }
    }, [currentBreakpointName, groupRef])

    if (isModal) {
        return (
            <View className="w-full">
                <View className="w-full " style={{ height: height }}>
                    <CommentsBrowse
                        scrollProps={
                            isModal ? { pageData: null, headerComponent: <></>, isNoContainer: true, headerHeight: 8 } : {
                                headerHeight: 64,
                                pageData: data,
                                // headerComponent: headerItems[0].data,
                                isBackButton: true,
                                padding: 16,
                            }
                        }
                        useCustomScrollHandler={true}
                        height={height > 0 ? height : undefined}
                        scrollToIndex={scrollToEnd}
                        addItems={aItems}
                        isModal={true}
                        browse={commentsData?.content[0]?.browse}
                        module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                        requestUrl={commentsData?.content[0]?.url}
                        replyId={replyId}
                    />
                </View>
                <View
                    onLayout={handleLayoutModal}
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
            </View>
        )
    }

    const isMultiColumn = aItemsLeftBar.length > 0;

    if (!isWeb || !isDesktop || !isMultiColumn) {
        return (
             <View {...viewProps} className={`w-full ${isWeb ? '' : 'h-full'}`}>
                <View className={`max-w-4xl w-full flex-1 bg-card shadow-sm text-card-foreground rounded-2xl  lg:my-4 mx-auto `}>
                    <View onLayout={handleListLayout} pointerEvents="box-none" className='w-full flex-1 ' style={{ marginBottom: formHeight }}>
                        <CommentsBrowse
                            scrollProps={
                                {
                                    headerHeight: 64,
                                    pageData: data,
                                    // headerComponent: headerItems[0].data,
                                    isBackButton: true,
                                    padding: 16,
                                }
                            }
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            browse={commentsData?.content[0]?.browse}
                            module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                            requestUrl={commentsData?.content[0]?.url}
                            replyId={replyId}
                        />
                    </View>
                    <KbAvoidingView>
                        <View onLayout={handleLayout} style={{ width: listWidth + 5 }} className='-ml-[2px] -mr-[2px] border-background border bg-background web:fixed z-50 web:bottom-0  '>
                            <View className=' lg:mb-4  ml-[1px] '>
                                <CommentsForm 
                                    isModal={isModal} 
                                    objectId={commentsData?.content[0]?.browse.data.object_id} 
                                    module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} 
                                    form={commentsData?.content[0]?.form} 
                                    requestUrl={commentsData?.content[0]?.url} 
                                />
                            </View>
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
            className={` ${isMultiColumn ? appSetting('layout', 'max_width_content') + 'mx-auto' : ''} flex-1 w-full h-full sm:min-h-[calc(100vh-16rem)]`}
            onLayout={onLayout}
        >
            {isLeftCol && (
                <>
                    <Panel
                        className={`hidden ${leftBreakpoint}:block mt-0.5 sm:p-2`}
                        {...leftPanelProps}
                    >
                        <View
                            className={`fixed-process'}`}
                        >
                            {aItemsLeftBar.length > 0 && (
                                <View className='fixed-process w-96 hidden sm:flex gap-y-3 '>
                                    {
                                        aItemsLeftBar.map(([key, value]) => {
                                            return (
                                                <BlockByName data={data} name={value} sidebar={true} />
                                            )
                                        })}
                                </View>)}
                        </View>
                    </Panel>
                    <PanelHandler
                        gap={`hidden ${leftBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                    />
                </>
            )}
            <Panel {...centerPanelProps} className="mt-0.5 sm:p-2">
                <View className={`w-full h-full bg-card/80 shadow-sm text-card-foreground rounded-2xl py-3 sm:py-4 mx-auto `}>
                    <View onLayout={handleListLayout} pointerEvents="box-none" className='w-full flex-1' style={{ marginBottom: formHeight }}>
                        <CommentsBrowse
                            scrollProps={
                                {
                                    headerHeight: 64,
                                    pageData: data,
                                    // headerComponent: headerItems[0].data,
                                    isBackButton: true,
                                    padding: 16,
                                }
                            }
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            browse={commentsData?.content[0]?.browse}
                            module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                            requestUrl={commentsData?.content[0]?.url}
                            replyId={replyId}
                        />
                    </View>
                    <KbAvoidingView>
                        <View onLayout={handleLayout} style={{ width: listWidth + 5 }} className='-ml-[2px] -mr-[2px] border-background border bg-background web:fixed z-50 web:bottom-0  '>
                            <View className='lg:rounded-b-2xl px-4 py-3  lg:mb-4 bg-card shadow-sm ml-[1px] '>
                                <CommentsForm 
                                    objectId={commentsData?.content[0]?.browse.data.object_id}
                                    module={commentsData?.content[0]?.browse?.data?.module || commentsData?.module} 
                                    form={commentsData?.content[0]?.form} 
                                    requestUrl={commentsData?.content[0]?.url} 
                                />
                            </View>
                        </View>
                    </KbAvoidingView>
                </View>
            </Panel>
            {isRightCol && (
                <>
                    <PanelHandler
                        gap={`hidden ${rightBreakpoint}:block`}
                        sizable={cellsCustomConfig.sizable}
                    />
                    <Panel
                        className={`hidden ${rightBreakpoint}:block mt-0.5 sm:p-2`}
                        {...rightPanelProps}
                    >
                        <View
                            className={`fixed-process'}`}
                        >
                            {aItemsRightBar.length > 0 && (
                                <View className='fixed-process w-96 hidden sm:flex '>
                                    {
                                        aItemsRightBar.map(([key, value]) => {
                                            return (
                                                <BlockByName data={data} name={value} sidebar={true} />
                                            )
                                        })}
                                </View>)}
                        </View>
                    </Panel>
                </>
            )}
        </PanelGroup>
    );
}