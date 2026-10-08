import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { LAYOUT_BREAKPOINTS, isNativeTabsEnabled, findElementBySource } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/components/elements/comments-browse'
import KbAvoidingView, { KbStickyView, useStickyComposerListInset } from 'app/ui/atoms/kb-avoiding-view';
import { EdgeBlurView, edgeBlurConfig } from 'app/ui/atoms/edge-blur';
import { Platform } from 'react-native'
import { useLocalSearchParams } from 'app/lib/hooks/router'
import emitter, { EVENTS } from 'app/context/emitter';
import { useIsDesktop, useWindowHeight, useBreakpoint, useBreakpointName } from 'app/context/measure';
import { appSetting } from 'app/lib/util';
import { Block } from 'app/ui/molecules/page/page-block';
import {
    Panel,
    PanelGroup,
    PanelHandler,
    resolvePanelProps,
} from 'app/ui/molecules/page/resizable-panels'
import { useSetFooter, useHeaderHeight } from 'app/context/jotai/layout';
import { PageHeaderOptions } from 'app/ui/molecules/header/options';
import { useSafeAreaInsets, getWindowSafeAreaInsets } from 'app/lib/hooks/router'
import { useStickyHeaderOffset, stickySidebarStyle } from 'app/lib/hooks/use-sticky-header-offset'
import { Loading } from 'app/customization/loading'
import { useCurrentUser } from 'app/context/user'
import { getNativeTabBarHeight } from 'app/components/nav/tabs/tab-menu'
// Keep in sync with TAB_BAR_HEIGHT in app/components/nav/tabs/native-tabs.js —
// the JS tab bar is in-flow, so the screen (and the composer's coordinate
// space) ends this far above the window bottom.
const JS_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 52 : 56;
// JS tab bar bounds the screen; the composer just needs breathing room above it.
const COMPOSER_FOOTER_GAP = 4;

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

/**
 * The post layout already mounts CommentsBrowse + CommentsForm from
 * `getCommentsData`. Jobs (and similar) still put that same reviews/comments
 * block in `cell_center`, so it would also land in `aItems` and remount a
 * second composer. Drop only that owned block — leave center-only comments
 * alone when the page has no comments data of its own.
 */
function blockSource(item) {
    return item?.name || item?.block?.name;
}

function blockHasContentType(item, data, type) {
    const el = findElementBySource(data, blockSource(item));
    return Array.isArray(el?.content) && el.content.some((c) => c?.type === type);
}

function isOwnedCommentsThreadItem(item, data, commentsData, commentsName) {
    const source = blockSource(item);
    if (!source) return false;
    if (commentsData?.source && source === commentsData.source) return true;
    if (commentsName && source === commentsName) return true;
    return blockHasContentType(item, data, 'comments');
}

const defineCells = (blocks, data) => {
    if (data?.layout_parsed) {
        const elements = data.elements || {};

        const sideBarBlocks = mapLayoutBlocks(elements.cell_right);
        const centerBlocks = mapLayoutBlocks(elements.cell_center);
        const leftBarBlocks = mapLayoutBlocks(elements.cell_left);
        const topBlocks = mapLayoutBlocks(elements.cell_top);

        return { sideBarBlocks, topBlocks, centerBlocks, leftBarBlocks };
    }

    // No layout config for this page (e.g. a plain UNA page such as
    // `resources-manage/<space>` opened in the post modal): render every
    // cell's blocks in the center column instead of crashing on
    // `Object.entries(undefined)`.
    if (!blocks || typeof blocks !== 'object') {
        const cells = data?.elements && typeof data.elements === 'object' ? Object.values(data.elements) : [];
        const centerBlocks = mapLayoutBlocks(
            cells.flatMap(cell => (Array.isArray(cell) ? cell : Object.values(cell || {})))
        );
        return { sideBarBlocks: [], topBlocks: [], centerBlocks, leftBarBlocks: [] };
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

export default function PageLayout({ data, blocks, isModal = false, url, pageClasses, embedded = false, headerTitle }) {
    const { contentWidth, padding, gap } = pageClasses ?? {};
    const isWeb = Platform.OS == 'web';
    const windowHeight = useWindowHeight();
    const insets = useSafeAreaInsets();
    const { currentUser } = useCurrentUser();
    const isDesktop = useIsDesktop();
    const [replyId, setReplyId] = useState(false);
    const [scrollToEnd, setScrollToEnd] = useState(false);
    const [formHeight, setFormHeight] = useState(0);
    const [listWidth, setListWidth] = useState(0)
    const [modalListHeight, setModalListHeight] = useState(0)
    // Clearance so the last comment can scroll clear of the floating composer.
    // Must track the composer's real height (measured by `handleLayout`) — a fixed
    // constant leaves the last comment stuck behind it.
    const { marginBottom: listBottomInset } = useStickyComposerListInset(formHeight);
    // Resting gap between the composer and the screen bottom (native page only):
    // with native tabs the page paints behind the system tab bar, so the composer
    // must clear it (taller on Android with labels); with JS tabs the screen
    // already ends above the footer.
    // Window insets, not `insets`: the NativeTabs nested SafeAreaProvider can
    // report bottom = keyboard height, which would bounce the composer.
    const composerBottomGap = isWeb
        ? 0
        : isNativeTabsEnabled()
            ? getNativeTabBarHeight(currentUser) + (getWindowSafeAreaInsets().bottom || 0)
            : COMPOSER_FOOTER_GAP;
    // KeyboardStickyView translates by (keyboardHeight − opened), so landing the
    // composer flush on the keyboard requires opened == its resting distance
    // from the *window* bottom. NativeTabs: the screen is full-window, so that's
    // just composerBottomGap. JS tabs: the in-flow tab bar (plus Android's root
    // SafeAreaView bottom padding) sits below the screen and must be added.
    const composerStickyOpened = isNativeTabsEnabled()
        ? composerBottomGap
        : JS_TAB_BAR_HEIGHT
            + composerBottomGap
            + (Platform.OS === 'android' ? (getWindowSafeAreaInsets().bottom || 0) : 0);
    const currentBreakpoint = useBreakpoint();
    const currentBreakpointName = useBreakpointName()
    const isLgUp = currentBreakpoint >= LAYOUT_BREAKPOINTS.lg;
    const isFormFixed = isWeb && !isLgUp;
    const groupRef = useRef(null)
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
                // click on reply — focus deferred to CommentsFormInner after mention settles
                if (hash.includes('cmt_id=')) {
                    setReplyId(hash);
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
                        emitter.emit(EVENTS.editor, { action: 'focus', note: "a", timeout: 800 });
                    }

                }
            }

        }
    }, [localUrl, data]);


    useEffect(() => {


        const subscription2 = emitter.addListener(EVENTS.comment, (data) => {
            if (data.action == 'send') {
                setReplyId(false)
            }
        })

        return () => {
            subscription2.remove();
        }
    }, [])

    const { leftBarBlocks, sideBarBlocks, centerBlocks } = defineCells(blocks, data);

    // Desktop page keeps INFO in the right column. When that column folds
    // (mobile, or the post modal) those blocks used to append after the body.
    // Lift `entity_info` into the text block, between title and description.
    const foldSidebars = !(isDesktop && !isModal);
    const foldedSideBlocks = foldSidebars ? [...sideBarBlocks, ...leftBarBlocks] : [];
    const infoBlocks = foldedSideBlocks.filter((item) => blockHasContentType(item, data, 'entity_info'));
    const otherFoldedBlocks = foldedSideBlocks.filter((item) => !blockHasContentType(item, data, 'entity_info'));
    const hasTextBlock = centerBlocks.some((item) => blockHasContentType(item, data, 'entity_text'));
    const afterTitle = foldSidebars && hasTextBlock && infoBlocks.length > 0
        ? (
            <View className="py-3">
                {infoBlocks.map((value) => (
                    <BlockByName
                        key={value.name}
                        isModal={isModal}
                        data={data}
                        name={value}
                        contentOnly
                    />
                ))}
            </View>
        )
        : null;

    const mainBlocks = foldSidebars
        ? [...centerBlocks, ...(hasTextBlock ? [] : infoBlocks), ...otherFoldedBlocks]
        : centerBlocks;
    const ownsPageComments = !!(commentsBrowse || commentsForm);
    const commentsBlockName = blocks?.comments?.name;
    const threadBlocks = ownsPageComments
        ? mainBlocks.filter((item) => !isOwnedCommentsThreadItem(item, data, commentsData, commentsBlockName))
        : mainBlocks;

    const aItems = useMemo(() => threadBlocks.map((value, index) => ({
        id: `block_${value.name}`,
        data: (
            <View className={'px-4 py-2.5 ' + (index != 0 ? 'pt-0' : 'sm:pb-3 sm:pt-4')}>
                <BlockByName
                    isModal={isModal}
                    data={data}
                    name={value}
                    contentOnly={true}
                    afterTitle={blockHasContentType(value, data, 'entity_text') ? afterTitle : undefined}
                />
            </View>
        )
    })), [threadBlocks, data, isModal, afterTitle]);

    const isRightCol = sideBarBlocks.length > 0 && isDesktop
    const isLeftCol = leftBarBlocks.length > 0 && isDesktop

    const viewProps = isWeb && !embedded ? {
        style: { minHeight: !isDesktop ? windowHeight : windowHeight - 64 },
    } : {};

    const handleLayout = useCallback((event) => {
        //if (isWeb)
            setFormHeight(event.nativeEvent.layout.height)
    }, []);

    const handleListLayout = (event) => {
        setListWidth(event.nativeEvent.layout.width - 2)
    }

    // Modal only: the comments list must scroll inside its own bounded box (the
    // pinned composer sits below it), and that requires a resolved px height.
    // Ignore sub-pixel jitter so the measure→height→measure loop settles.
    const handleModalListLayout = useCallback((event) => {
        const next = Math.round(event.nativeEvent.layout.height)
        setModalListHeight(prev => (Math.abs(prev - next) > 1 ? next : prev))
    }, []);

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

    useEffect(() => {
        if (embedded) return;
        setFooter(false);
        return () => {
            setFooter(true);
        };
    }, [embedded]);

    let offset2 = 56;
    if (isDesktop)
        offset2 += 0;// offsets in modal web

    if (!isWeb) {
            offset2 = insets.bottom + insets.top;
            if (Platform.OS == 'ios') {
                offset2 = insets.bottom + insets.top + 80;
            }
        }
    // Small screens (native + mobile web): title + back go into the pinned
    // header chrome; the author block stays in-flow in the list (like desktop
    // and the modal, which owns its own chrome).
    const headerOptions = (isModal || embedded) ? null : (
        <PageHeaderOptions
            backButton
            title={headerTitle || (data.module == 'bx_timeline' ? 'Update' : 'Post')}
            mobileOnly
        />
    );

    if (isModal) {
        return (
            <View className="w-full flex-1 relative">
                <View className="flex-1 w-full min-h-0" onLayout={handleModalListLayout}>
                        {data == 'loading' ?
                            <Loading />
                        : <CommentsBrowse
                            useCustomScrollHandler={true}
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            isModal={true}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                            marginBottom={listBottomInset}
                            // The composer below is pinned only because this column is
                            // height-bounded, so the list has to scroll itself rather
                            // than delegate outwards. That needs a real px height —
                            // flex gives this wrapper one, so measure and pass it down.
                            height={modalListHeight}
                        />}
                </View>

                {/* Floats over the list (parent is `relative`) so comments scroll
                    behind the composer's bottom-anchored fade. The list keeps its
                    own clearance via `listBottomInset`. */}
                {/* `style`, not `className`: KbStickyView wraps react-native's View
                    (RNW drops className) and KeyboardStickyView on native. */}
                {ownsPageComments && (
                    <KbStickyView
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
                        offset={{ closed: 0, opened: insets.bottom }}
                    >
                        <View onLayout={handleLayout}>
                            <CommentsForm
                                isModal={isModal}
                                fadeSurface="card"
                                objectId={commentsObjectId}
                                module={commentsModule}
                                form={commentsForm}
                                requestUrl={commentsRequestUrl}
                            />
                        </View>
                    </KbStickyView>
                )}
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
        // Native page: same overlay composer as modal (KbStickyView). KbAvoidingView
        // padding + Keyboard.dismiss after submit floated the form mid-screen.
        if (!isWeb) {
            return (
                <View {...viewProps} className="w-full h-full">
                    {headerOptions}
                    <View className="max-w-5xl w-full flex-1 bg-card text-card-foreground relative mx-auto">
                        <View className="flex-1 w-full min-h-0">
                            <CommentsBrowse
                                scrollToIndex={scrollToEnd}
                                addItems={aItems}
                                browse={commentsBrowse}
                                module={commentsModule}
                                requestUrl={commentsRequestUrl}
                                replyId={replyId}
                                marginBottom={listBottomInset + composerBottomGap}
                            />
                        </View>
                        {ownsPageComments && (
                            <KbStickyView
                                style={{ position: 'absolute', left: 0, right: 0, bottom: composerBottomGap }}
                                offset={{ closed: 0, opened: composerStickyOpened }}
                            >
                                <View onLayout={handleLayout}>
                                    <CommentsForm
                                        isModal={isModal}
                                        fadeSurface="card"
                                        objectId={commentsObjectId}
                                        module={commentsModule}
                                        form={commentsForm}
                                        requestUrl={commentsRequestUrl}
                                    />
                                </View>
                            </KbStickyView>
                        )}
                    </View>
                </View>
            );
        }

        return (
            <View {...viewProps} className="w-full">
                {headerOptions}
                <View className={embedded
                    ? 'w-full flex-1'
                    : 'max-w-5xl w-full flex-1 bg-card text-card-foreground lg:rounded-2xl lg:my-4 mx-auto '
                }>
                    <View
                        onLayout={handleListLayout}
                        style={{ pointerEvents: 'box-none', ...(isFormFixed ? { marginBottom: formHeight } : null) }}
                        className="w-full flex-1 "
                    >
                        <CommentsBrowse
                            embedded={embedded}
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                        />
                    </View>
                    {ownsPageComments && (
                        <KbAvoidingView>
                            <EdgeBlurView
                                edge="bottom"
                                config={edgeBlurConfig('footer')}
                                onLayout={handleLayout}
                                style={isFormFixed && listWidth ? { width: listWidth + 5 } : undefined}
                                // pt-12: fade runs above the input (bottom-anchored panel grows upward).
                                className="pt-12 lg:pt-0 web:fixed web:bottom-0 web:z-50 lg:static lg:z-0 lg:w-full"
                                washClassName="bg-linear-to-t from-card from-40% to-transparent"
                            >
                                <CommentsForm
                                    isModal={isModal}
                                    objectId={commentsObjectId}
                                    module={commentsModule}
                                    form={commentsForm}
                                    requestUrl={commentsRequestUrl}
                                />
                            </EdgeBlurView>
                        </KbAvoidingView>
                    )}
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
            className={`${contentWidth} ${isMultiColumn ? 'mx-auto' : ` mx-auto flex-1${embedded ? '' : ' h-full sm:min-h-[calc(100vh-16rem)]'}`} `}
            // Default panel-group overflow:hidden creates a scrollport and breaks
            // window-scroll sticky. clip still contains resize overflow without that.
            // Embedded list-open: grow with the blocks so the browse card scrolls.
            style={{
                ...(viewProps.style || {}),
                overflow: embedded ? 'visible' : 'clip',
                ...(embedded ? { height: 'auto', minHeight: '100%' } : {}),
            }}
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
                                className={embedded
                                    ? 'web:sticky top-0 w-full hidden sm:flex gap-y-3'
                                    : 'web:sticky w-full hidden sm:flex gap-y-3 web:overflow-y-auto'}
                                style={embedded ? { top: 0 } : stickySidebarScrollStyle}
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
                {embedded ? (
                    <View className="w-full mx-auto">
                        <CommentsBrowse
                            embedded
                            scrollToIndex={scrollToEnd}
                            addItems={aItems}
                            browse={commentsBrowse}
                            module={commentsModule}
                            requestUrl={commentsRequestUrl}
                            replyId={replyId}
                        />
                        {ownsPageComments && (
                            <CommentsForm
                                objectId={commentsObjectId}
                                module={commentsModule}
                                form={commentsForm}
                                requestUrl={commentsRequestUrl}
                            />
                        )}
                    </View>
                ) : (
                <Block isBg className={`w-full mx-auto `}>
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
                    {ownsPageComments && (
                        <KbAvoidingView>
                            <View
                                onLayout={handleLayout}
                                style={isFormFixed && listWidth ? { width: listWidth + 5 } : undefined}
                                className="w-full max-lg:web:fixed max-lg:web:bottom-0 max-lg:z-50 lg:static min-h-4"
                            >
                                    <CommentsForm
                                        // No fade here: this branch only renders when
                                        // `isDesktop` (>= lg), where the composer is
                                        // `lg:static` — in flow, with nothing behind it.
                                        objectId={commentsObjectId}
                                        module={commentsModule}
                                        form={commentsForm}
                                        requestUrl={commentsRequestUrl}
                                    />
                            </View>
                        </KbAvoidingView>
                    )}
                </Block>
                )}
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
                                className={embedded
                                    ? 'web:sticky top-0 w-full hidden sm:flex gap-3 lg:gap-4 mt-0.5 sm:m-0 sm:p-3 lg:p-4'
                                    : 'web:sticky w-full hidden sm:flex gap-3 lg:gap-4 mt-0.5 sm:m-0 sm:p-3 lg:p-4 web:overflow-y-auto'}
                                style={embedded ? { top: 0 } : stickySidebarScrollStyle}
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