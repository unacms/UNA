
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { useRef, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCallback, forwardRef, useMemo } from 'react';
import { useBreakpoint } from 'app/context/measure'
import { paddingForList } from 'app/customization/functions';

export default function UniList(props) {
    let { useCustomScrollHandler, preloadComponent, isModal, sortable, data: rawData, renderItem, onEndReached, onStartReached, maxToRenderPerBatch, initialNumToRender, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
        onSort, mode, layout, numColumns, keyboardShouldPersistTaps, keyExtractor, useWindowScroll: useWindowScrollProp, height, listState, endpoint, viewParams, topItemCount, scrollToLastItem, refreshing, onRefresh, isInPanel, paddingTop, ...rest } = props

    const uniRef = useRef();
    const currentBreakpoint = useBreakpoint();

    const data = useMemo(() => rawData.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i), [rawData]);
    const isGridMode = mode != 'simple' && !sortable;
    const [isGridReady, setIsGridReady] = useState(!preloadComponent);
    const [showContent, setShowContent] = useState(!preloadComponent);
    const revealTimerRef = useRef(null);
    const lastPreloadRef = useRef(preloadComponent);

    useEffect(() => {
        if (preloadComponent) {
            lastPreloadRef.current = preloadComponent;
        }
    }, [preloadComponent]);

    useEffect(() => {
        if (!sortable && mode == 'simple' && !preloadComponent) {
            setShowContent(true);
            return;
        }

        if (!isGridMode) {
            return;
        }

        if (preloadComponent) {
            setIsGridReady(false);
            setShowContent(false);
        }
    }, [isGridMode, mode, sortable, preloadComponent]);

    useEffect(() => {
        const clearRevealTimer = () => {
            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }
        };

        const scheduleReveal = () => {
            revealTimerRef.current = setTimeout(() => {
                revealTimerRef.current = null;
                setShowContent(true);
            }, 140);
        };

        clearRevealTimer();

        if (!sortable && mode == 'simple') {
            if (preloadComponent) {
                setShowContent(false);
                return clearRevealTimer;
            }

            scheduleReveal();
            return clearRevealTimer;
        }

        if (!isGridMode) {
            setShowContent(true);
            return clearRevealTimer;
        }

        if (preloadComponent || !isGridReady) {
            setShowContent(false);
            return clearRevealTimer;
        }

        if (!lastPreloadRef.current) {
            setShowContent(true);
            return clearRevealTimer;
        }

        scheduleReveal();
        return clearRevealTimer;
    }, [isGridMode, mode, sortable, preloadComponent, isGridReady]);

    const itemContent = useCallback((index, data) => {
        return (
            <View className="min-h-px">
                {renderItem({ item: data, index })}
            </View>
        );
    }, [renderItem]);

    const itemContentSorted = useCallback((index, data, provided, isDragging) => {
        return (

            <div
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
                style={provided.draggableProps.style}
                className={`item ${isDragging ? "is-dragging" : ""}`}
            >
                {itemContent(index, data)}
            </div>

        );

    }, [itemContent]);

    const normalizedHeight = (() => {
        if (typeof height === 'number') {
            return height > 0 ? `${height}px` : undefined;
        }
        if (typeof height === 'string') {
            const trimmedHeight = height.trim();
            if (!trimmedHeight || trimmedHeight === '100%' || trimmedHeight === 'auto') {
                return undefined;
            }
            if (!Number.isNaN(Number(trimmedHeight))) {
                const numericHeight = Number(trimmedHeight);
                return numericHeight > 0 ? `${numericHeight}px` : undefined;
            }
            const parsedFloat = parseFloat(trimmedHeight);
            if (!Number.isNaN(parsedFloat) && parsedFloat <= 0) {
                return undefined;
            }
            return trimmedHeight;
        }
        return undefined;
    })();

    const hasResolvedHeight = Boolean(normalizedHeight);

    // If explicit useWindowScroll prop is provided, respect it
    // Otherwise, default to window scroll when no valid height is provided
    const shouldUseWindowScroll =
        typeof useWindowScrollProp === 'boolean' ? useWindowScrollProp : !hasResolvedHeight;

    // Always use window scroll if no height is resolved to prevent zero-sized element errors
    const isWindowScroll = hasResolvedHeight ? shouldUseWindowScroll : true;

    // Only set height style if we have a valid height AND we're not using window scroll
    // This prevents virtuoso from receiving conflicting signals
    let style = (normalizedHeight && !isWindowScroll) ? { height: normalizedHeight } : {};
    if (paddingTop) {
        style.paddingTop = paddingTop
    }


    const ItemComponent = useMemo(() => {
        const cls = layout || 'w-full';
        return ({ className, ...props }) => (
            <div className={`${cls} ${className || 'mb-3'}`} {...props} />
        );
    }, [layout]);
    const ListComponent = useMemo(() =>
        forwardRef(({ className, ...props }, ref) => (
            <div
                ref={ref}
                className={`u-max-width-block w-full mx-auto justify-center flex flex-wrap flex-row ${className || ''}`}
                {...props}
            />
        )),
        []
    );
    const FooterComponent = useCallback(() => ListFooterComponent, [ListFooterComponent]);
    const virtuosoStyle = isWindowScroll
        ? (paddingTop ? { paddingTop } : {})
        : style;

    const commonVirtuosoProps = {
        data,
        useWindowScroll: isWindowScroll,
        style: virtuosoStyle,
        ref: refer ? refer : uniRef,
        startReached: onStartReached,
        endReached: onEndReached,
        overscan: props.unit == 'notifications' ? 100 : 900,
        increaseViewportBy: { top: 3000, bottom: 3000 },
        components: mode != 'simple' ? {
            List: ListComponent,
            Item: ItemComponent,
            Footer: FooterComponent,
        } : {
            Footer: FooterComponent,
        },
        ...rest,
    };

    if (props.no_scroll) {
        return <View>
            {data.map((item, index) => {
                return renderItem({ item: item, index });
            })}
        </View>;
    }

    // Get dynamic padding based on endpoint/module
    const listPadding = paddingForList(endpoint);
    const overlayPreload = !sortable
        ? (preloadComponent || lastPreloadRef.current)
        : null;

    let contentComponent = null
    if (preloadComponent && !isGridMode) {
        contentComponent = preloadComponent;
    }
    else {
        // Wrapper style: use explicit height only when not using window scroll, otherwise let it flow naturally
        const wrapperStyle = isWindowScroll ? {} : style;

        // Get dynamic padding based on endpoint/module


        if (mode != 'simple' && !sortable) {
            return (
                <View className="@container/list" style={wrapperStyle}>
                    <View className={`${data.length ? listPadding : ''} relative`} style={wrapperStyle}>
                        {ListHeaderComponent && ListHeaderComponent()}
                        <View
                            className={`transition-opacity duration-500 ease-out ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <VirtuosoGrid
                                {...commonVirtuosoProps}
                                itemContent={itemContent}
                                readyStateChanged={(ready) => {
                                    if (ready) {
                                        setIsGridReady(true);
                                    }
                                }}
                                {...(scrollToLastItem ? { initialTopMostItemIndex: data.length } : {})}
                                endReached={() => { onEndReached() }}
                            />
                        </View>
                        {overlayPreload && (
                            <View className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ease-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                                {overlayPreload}
                            </View>
                        )}
                    </View>
                </View>
            )
        }
        else {
            if (sortable) {
                return (
                    <View style={wrapperStyle}>
                        <DragDropContext onDragEnd={onSort}>
                            <Droppable
                                droppableId="droppable"
                                renderClone={(provided, snapshot, rubric) => (
                                    itemContentSorted(
                                        rubric.source.index,
                                        data[rubric.source.index],
                                        provided,
                                        snapshot.isDragging
                                    )
                                )}
                            >
                                {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {data.map((item, index) => (
                                            <Draggable
                                                draggableId={`item-${item.id}`}
                                                index={index}
                                                key={item.id}
                                            >
                                                {(provided, snapshot) =>
                                                    itemContentSorted(
                                                        index,
                                                        item,
                                                        provided,
                                                        snapshot.isDragging
                                                    )
                                                }
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </View>
                );
            }
            else {
                return (
                    <View className={`${listPadding} relative`} style={wrapperStyle}>
                        <View
                            className={`transition-opacity duration-500 ease-out ${showContent ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                            style={wrapperStyle}
                        >
                            {ListHeaderComponent && ListHeaderComponent()}
                            <Virtuoso
                                itemContent={itemContent}
                                {...commonVirtuosoProps}
                                {...(listState?.ranges && { restoreStateFrom: listState })}
                                {...(scrollToLastItem && { initialTopMostItemIndex: data.length })}
                                endReached={onEndReached}
                            />
                        </View>
                        {overlayPreload && (
                            <View className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 ease-out ${showContent ? 'opacity-0' : 'opacity-100'}`}>
                                {overlayPreload}
                            </View>
                        )}
                    </View>
                )
            }
        }
    }

    return contentComponent;
}