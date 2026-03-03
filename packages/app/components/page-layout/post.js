import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { getBreakpoint } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Keyboard, Platform } from 'react-native'
import { useLocalSearchParams, useSafeAreaInsets } from 'app/lib/hooks/router'
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
    const { bottom: safeBottomInset } = useSafeAreaInsets();
    const isDesktop = useIsDesktop();
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [modalViewportHeight, setModalViewportHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    const currentBreakpoint = useBreakpoint();
    const currentBreakpointName = getBreakpoint(currentBreakpoint)
    const groupRef = useRef(null)
    const setHeader = useSetHeader();
    const setFooter = useSetFooter();

    const localUrl = isModal ? url : useLocalSearchParams().url;
    const commentsData = useMemo(() => data?.layout_parsed ? data.elements.cell_bottom[0] : DataByName(data, blocks?.comments), [data, blocks?.comments]);

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
    }, [localUrl]);



    const { leftBarBlocks, sideBarBlocks, centerBlocks } = defineCells(blocks, data);

    const mainBlocks = isDesktop && !isModal ? centerBlocks : [...centerBlocks, ...sideBarBlocks, ...leftBarBlocks]

//value.sidebar || value.leftbar ? false : true
    const aItems = useMemo(() => mainBlocks.map((value) => ({
        id: `block_${value.name}`,
        data: <View className={'px-3 lg:px-4 pt-3'}><BlockByName isModal={isModal} data={data} name={value} contentOnly={true} /></View>
    })), [blocks, data, isDesktop]);

    const isRightCol = sideBarBlocks.length > 0 && isDesktop
    const isLeftCol = leftBarBlocks.length > 0 && isDesktop

    const viewProps = isWeb ? {
        style: { minHeight: !isDesktop ? windowHeight : windowHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        // On native post pages the form is in normal flow; re-measuring during keyboard
        // animation can create noisy re-layouts and input jank.
        if (!isWeb && !isModal) {
            return
        }
        const nextHeight = Math.round(event.nativeEvent.layout.height)
        setFormHeight((prev) => (prev === nextHeight ? prev : nextHeight))
    }, [isWeb, isModal]);

    const handleListLayout = useCallback((event) => {
        if (!isWeb) {
            return
        }
        const nextWidth = Math.round(event.nativeEvent.layout.width - 2)
        setListWidth((prev) => (prev === nextWidth ? prev : nextWidth))
    }, [isWeb])

    const handleModalLayout = useCallback((event) => {
        if (!isModal) {
            return
        }
        const nextHeight = Math.round(event.nativeEvent.layout.height)
        setModalViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight))
    }, [isModal])

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

    useEffect(() => {
        if (isWeb || !isModal) return;

        const onShow = (event) => {
            const nextHeight = Math.round(event?.endCoordinates?.height || 0)
            setKeyboardHeight((prev) =>
                prev === nextHeight ? prev : nextHeight,
            )
        }
        const onHide = () => {
            setKeyboardHeight((prev) => (prev === 0 ? prev : 0))
        }

        const subscriptions = [
            Keyboard.addListener('keyboardWillShow', onShow),
            Keyboard.addListener('keyboardDidShow', onShow),
            Keyboard.addListener('keyboardWillHide', onHide),
            Keyboard.addListener('keyboardDidHide', onHide),
        ]

        return () => {
            subscriptions.forEach((subscription) => subscription.remove())
        }
    }, [isModal, isWeb])

    const modalKeyboardLift = Math.max(0, keyboardHeight - safeBottomInset)
    const modalBaseHeight = modalViewportHeight || windowHeight
    const modalListHeight = modalBaseHeight - formHeight - modalKeyboardLift
    const resolvedModalListHeight = modalListHeight > 0 ? modalListHeight : undefined
    if (isModal) {
        return (
            <View onLayout={handleModalLayout} className="w-full justify-between flex-1" >
                <View className='w-full flex-1 '>
                    <View style={{ height: resolvedModalListHeight }}>
                        <CommentsBrowse
                            useCustomScrollHandler={true}
                            height={resolvedModalListHeight}
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            isModal={true}
                            browse={commentsData?.content[0]?.browse}
                            module={commentsData?.content[0].browse?.data?.module || commentsData?.module}
                            requestUrl={commentsData?.content[0]?.url}
                            replyId={replyId}
                        />
                    </View>
                </View>
                <View
                    onLayout={handleLayout}
                    style={{
                        // Keep the composer aligned with keyboard while preserving
                        // the composer's own bottom padding inside the sheet.
                        marginBottom: Math.max(
                            0,
                            modalKeyboardLift,
                        ),
                    }}
                    className="border-t border-border/60 "
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
                <View className={`max-w-5xl w-full flex-1 bg-card text-card-foreground lg:rounded-2xl lg:my-4 mx-auto `}>
                    <View onLayout={handleListLayout} style={{ pointerEvents: 'box-none', marginBottom: isWeb ? formHeight : 0 }} className='w-full flex-1 '>
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
                        <View onLayout={handleLayout} style={isWeb ? { width: listWidth + 5 } : undefined} className='-ml-[2px] -mr-[2px] border-background border bg-background web:fixed z-50 web:bottom-0  '>
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
                        className={`hidden ${leftBreakpoint}:block mt-0.5 sm:mt-0 sm:p-4`}
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
            <Panel {...centerPanelProps} className="mt-0.5 sm:mt-0 sm:p-4">
                <View className={`w-full h-full bg-card shadow-custom text-card-foreground rounded-xl mx-auto `}>
                    <View onLayout={handleListLayout} style={{ pointerEvents: 'box-none', marginBottom: isWeb ? formHeight : 0 }} className='w-full flex-1'>
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
                        <View onLayout={handleLayout} style={isWeb ? { width: listWidth + 5 } : undefined} className=' mb-4 web:fixed z-50 web:bottom-0 overflow-hidden  '>
                            <View className='bg-red-500 w-full   '>
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
                        className={`hidden ${rightBreakpoint}:block mt-0.5 sm:mt-0 sm:p-4`}
                        {...rightPanelProps}
                    >
                        <View className={`fixed-process'}`}>
                            <View className='fixed-process w-96 hidden sm:flex gap-y-3 '>
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