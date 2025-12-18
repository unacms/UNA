import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { getBreakpoint } from 'app/lib/util';
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
import { useSetHeader, defaultHeader, useSetFooter } from 'app/context/jotai/layout';

const mapLayoutBlocks = (items = []) =>
    items.map(({ source }) => ({
        name: source,
        block: { name: source },
    }));

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

export default function PageLayout({ data, blocks, isModal = false, url }) {
    const isWeb = Platform.OS == 'web';
    const windowHeight = useWindowHeight();
    const isDesktop = useIsDesktop();
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    const currentBreakpoint = useBreakpoint();
    const currentBreakpointName = getBreakpoint(currentBreakpoint)
    const groupRef = useRef(null)
    const setHeader = useSetHeader();
    const setFooter = useSetFooter();

    const localUrl = isModal ? url : useLocalSearchParams().url;
    const commentsData = useMemo(() => data?.layout_parsed ? data.elements.cell_bottom[0] : DataByName(data, blocks?.comments), [data, blocks?.comments]);

    // for modal
    const offset = isDesktop ? 100 : 60
    const [height, setHeight] = useState(windowHeight - offset - 100)

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

    useEffect(() => {
        setHeight(windowHeight - offset - 100)
    }, [windowHeight]);

    const { leftBarBlocks, sideBarBlocks, centerBlocks } = defineCells(blocks, data);

    const mainBlocks = isDesktop ? centerBlocks : [...centerBlocks, ...sideBarBlocks, ...leftBarBlocks]


    const aItems = useMemo(() => mainBlocks.map((value) => ({
        id: `block_${value.name}`,
        data: <View className={'px-4 py-2'}><BlockByName isModal={isModal} data={data} name={value} contentOnly={value.sidebar || value.leftbar ? false : true} /></View>
    })), [blocks, data, isDesktop]);


    const isRightCol = sideBarBlocks.length > 0 && isDesktop
    const isLeftCol = leftBarBlocks.length > 0 && isDesktop

    const viewProps = isWeb ? {
        style: { minHeight: !isDesktop ? windowHeight : windowHeight - 64 },
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
            windowHeight -
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

    const isMultiColumn = leftBarBlocks.length > 0 || sideBarBlocks.length > 0;

    //console.log("headerItems[0].data", aItems[0])
    useEffect(() => {
        if (!isModal) {
            if (!isDesktop) {
                setHeader({ subHeader: aItems[0].data, backButton: true, title: data.title });
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

    if (isModal) {
        return (
            <View className="w-full">
                <View className="w-full " style={{ height: height }}>
                    <CommentsBrowse
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



    if (!isWeb || !isDesktop || !isMultiColumn) {
        const newItems = !isWeb || !isDesktop ? aItems.slice(1) : aItems;
        return (
            <View {...viewProps} className={`w-full ${isWeb ? '' : 'h-full'}`}>
                <View className={`max-w-4xl w-full flex-1 bg-card shadow-sm text-card-foreground rounded-2xl  lg:my-4 mx-auto `}>
                    <View onLayout={handleListLayout} style={{ pointerEvents: 'box-none', marginBottom: formHeight }} className='w-full flex-1 '>
                        <CommentsBrowse

                            scrollToIndex={scrollToEnd}
                            addItems={newItems}
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
                        <View className={`fixed-process'}`} >
                            <View className='fixed-process w-96 hidden sm:flex gap-y-3 '>
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
                    />
                </>
            )}
            <Panel {...centerPanelProps} className="mt-0.5 sm:p-2">
                <View className={`w-full h-full bg-card/80 shadow-sm text-card-foreground rounded-2xl py-3 sm:py-4 mx-auto `}>
                    <View onLayout={handleListLayout} style={{ pointerEvents: 'box-none', marginBottom: formHeight }} className='w-full flex-1'>
                        <CommentsBrowse
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
                        <View className={`fixed-process'}`}>
                            <View className='fixed-process w-96 hidden sm:flex gap-y-3 '>
                                {
                                    sideBarBlocks.map((value) => {
                                        console.log("value", value)
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