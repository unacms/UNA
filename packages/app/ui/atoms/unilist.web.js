
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCallback, forwardRef } from 'react';
import { useBreakpoint } from 'app/context/measure'
import { useSetScrollDirection } from 'app/context/jotai/layout';
import { paddingForList } from 'app/customization/functions';

export default function UniList(props) {
    let { useCustomScrollHandler, preloadComponent, isModal, sortable, data, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
        onSort, mode, layout, numColumns, keyboardShouldPersistTaps, keyExtractor, useWindowScroll: useWindowScrollProp, height, listState, endpoint, viewParams, topItemCount, scrollToLastItem, refreshing, onRefresh, isInPanel, paddingTop, ...rest } = props

    const uniRef = useRef();
    const currentBreakpoint = useBreakpoint();
    const scrollY = useRef(0);
    const scrollState = useRef(0); // Текущее состояние: 0, 1 или -1

    const setScrollDirection = useSetScrollDirection();

    data = data.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    const itemContent = useCallback((index, data) => {
        const renderedItem = renderItem({ item: data, index });
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

    if (props.no_scroll) {
        return <View>
            {data.map((item, index) => {
                return renderItem({ item: item, index });
            })}
        </View>;
    }

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

    useEffect(() => {
        if (!isWindowScroll) return;

        const SCROLL_OFFSET_THRESHOLD = 100;

        const handleWindowScroll = () => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;
            const previousScrollY = scrollY.current;

            let newScrollState;

            if (currentScrollY < SCROLL_OFFSET_THRESHOLD) {
                newScrollState = 0;
            } else if (currentScrollY > previousScrollY && currentScrollY > 0) {
                newScrollState = 1;
            } else if (currentScrollY < previousScrollY) {
                newScrollState = -1;
            } else {
                newScrollState = scrollState.current;
            }

            if (newScrollState !== scrollState.current) {
                setScrollDirection(newScrollState);
                scrollState.current = newScrollState;
            }

            scrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleWindowScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleWindowScroll);
        };
    }, [isWindowScroll, setScrollDirection]);

    // Only set height style if we have a valid height AND we're not using window scroll
    // This prevents virtuoso from receiving conflicting signals
    let style = (normalizedHeight && !isWindowScroll) ? { height: normalizedHeight } : {};
    if (paddingTop) {
        style.paddingTop = paddingTop
    }


    const ItemComponent = ({ className, ...props }) => (
        <ReactNativeView className={`${layout || 'w-full'} ${className || 'mb-3'}`} {...props} />
    );

    const ListComponent = forwardRef(({ className, ...props }, ref) => {
        return (
            <ReactNativeView
                ref={ref}
                className={`u-max-width-block w-full mx-auto flex flex-wrap flex-row ${className || ''}`}
                {...props}
            />
        );
    });

    // Style for virtuoso: only pass explicit height when NOT using window scroll, but preserve paddingTop
    const virtuosoStyle = isWindowScroll
        ? (paddingTop ? { paddingTop } : {})
        : style;


    const commonVirtuosoProps = {
        data,
        useWindowScroll: isWindowScroll,
        style: virtuosoStyle,
        ref: refer ? refer : uniRef,
        endReached: onEndReached,
        overscan: props.unit == 'notifications' ? 100 : 900,
        components: mode != 'simple' ? {
            List: ListComponent,
            Item: ItemComponent,
            Footer: () => {
                return ListFooterComponent
            },

        } : {
            Footer: () => ListFooterComponent,

        },
        ...rest,
    };

    // Get dynamic padding based on endpoint/module
    const listPadding = paddingForList(endpoint);

    let contentComponent = null
    if (preloadComponent) {
        contentComponent = preloadComponent;
    }
    else {
        // Wrapper style: use explicit height only when not using window scroll, otherwise let it flow naturally
        const wrapperStyle = isWindowScroll ? {} : style;

        // Get dynamic padding based on endpoint/module


        if (mode != 'simple' && !sortable) {
            return (
                <View className="@container/list" style={wrapperStyle}>
                    <View className={`${data.length ? listPadding : ''}`} style={wrapperStyle}>
                        {ListHeaderComponent && ListHeaderComponent()}
                        <VirtuosoGrid
                            {...commonVirtuosoProps}
                            itemContent={itemContent}
                            //stateChanged={stateChanged}
                            {...(scrollToLastItem ? { initialTopMostItemIndex: data.length } : {})}
                            // atBottomStateChange={()=>{console.log("atBottomStateChange"), onEndReached()}}
                            endReached={() => { onEndReached() }}
                        />
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
                    <View className={`${listPadding}`} style={wrapperStyle}>
                        <View style={wrapperStyle}>
                            {ListHeaderComponent && ListHeaderComponent()}
                            <Virtuoso
                                itemContent={itemContent}
                                {...commonVirtuosoProps}
                                {...(listState?.ranges && { restoreStateFrom: listState })}
                                {...(scrollToLastItem && { initialTopMostItemIndex: data.length })}
                                endReached={onEndReached}
                            />
                        </View>
                    </View>
                )
            }
        }
    }

    return contentComponent;
}