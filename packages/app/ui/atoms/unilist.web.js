
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { useRef } from 'react';
import { cd } from 'app/lib/util'
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCallback, forwardRef } from 'react';
import ScrollList from 'app/ui/molecules/scroll_list'
import { useBreakpoint } from 'app/context/measure'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'

export default function UniList(props) {
    let { useCustomScrollHandler, scrollProps, preloadComponent, sortable, data, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
        onSort, mode, layout, numColumns, keyboardShouldPersistTaps, keyExtractor, useWindowScroll: useWindowScrollProp, height, listState, endpoint, viewParams, topItemCount, scrollToLastItem, refreshing, onRefresh, isInPanel, paddingTop, ...rest } = props

    const uniRef = useRef();
    const currentBreakpoint = useBreakpoint();

    data = data.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    const itemContent = useCallback((index, data) => {
        return (
            <View className="">
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
    
    // Only set height style if we have a valid height AND we're not using window scroll
    // This prevents virtuoso from receiving conflicting signals
    let style = (normalizedHeight && !isWindowScroll) ? { height: normalizedHeight } : {};
    if (paddingTop) {
        style.paddingTop = paddingTop
    }


    const ItemComponent = ({ className, ...props }) => (
        <ReactNativeView className={`${layout || 'w-full'} ${className || cd('mb-md')}`} {...props} />
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
            Header: () => {

                // Add header spacer only for panel layouts on lg+ viewports where content scrolls under semi-transparent header
                if (isInPanel && scrollProps?.headerHeight > 0 && currentBreakpoint >= LAYOUT_BREAKPOINTS.lg) {
                    return <View style={{ height: 64 }} />;
                }
                return useCustomScrollHandler ? <View style={{ paddingTop: scrollProps.headerHeight }}></View> : null;
            },
        } : {
            Footer: () => ListFooterComponent,
            Header: () => {
                // Add header spacer only for panel layouts on lg+ viewports where content scrolls under semi-transparent header
                if (isInPanel && scrollProps?.headerHeight > 0 && currentBreakpoint >= LAYOUT_BREAKPOINTS.lg) {
                    return <View style={{ height: 64 }} />;
                }
                return useCustomScrollHandler ? <View style={{ paddingTop: scrollProps.headerHeight }}></View> : null;
            },
        },
        // isScrolling,
        ...rest,
    };
    let contentComponent = null
    if (preloadComponent) {
        contentComponent = preloadComponent;
    }
    else {
        // Wrapper style: use explicit height only when not using window scroll, otherwise let it flow naturally
        const wrapperStyle = isWindowScroll ? {} : style;
        
        if (mode != 'simple' && !sortable) {
            contentComponent = (
                <View className="@container/list" style={wrapperStyle}>
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
            )
        }
        else {
            if (sortable) {
                contentComponent = (
                    <DragDropContext onDragEnd={onSort}>
                        <Droppable
                            droppableId="droppable"
                            mode="virtual"
                            renderClone={(provided, snapshot, rubric) => (
                                itemContentSorted(rubric.source.index, data[rubric.source.index], provided, snapshot.isDragging)

                            )}
                        >
                            {(provided) => (
                                <View {...provided.droppableProps} ref={provided.innerRef}>
                                    <Virtuoso
                                        itemContent={(index, item) => (
                                            <Draggable draggableId={`${item.id}`} index={index} key={item.id}>
                                                {(provided) => itemContentSorted(index, item, provided, false)}
                                            </Draggable>
                                        )}
                                        {...commonVirtuosoProps}
                                        {...(listState?.ranges && { restoreStateFrom: listState })}
                                        {...(scrollToLastItem && { initialTopMostItemIndex: data.length })}
                                        endReached={onEndReached}
                                    />
                                    {provided.placeholder}
                                </View>
                            )}
                        </Droppable>
                    </DragDropContext>
                )
            }
            else {
                contentComponent = (
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
                )
            }
        }
    }

    if (!scrollProps)
        return contentComponent;

    return (
        <ScrollList
            useCustomScrollHandler={useCustomScrollHandler}
            content={contentComponent}
            contentType="FlatList"
            refer={refer ? refer : uniRef}
            {...scrollProps}
        />

    )

}