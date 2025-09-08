
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'
import { useRef } from 'react';
import { storageSet, cd } from 'app/lib/util'
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCallback, forwardRef } from 'react';
import ScrollList from 'app/ui/molecules/scroll_list'

export default function UniList(props) {
    let { useCustomScrollHandler, scrollProps, preloadComponent, sortable, data, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
        onSort, numColumns, keyboardShouldPersistTaps, keyExtractor, useWindowScroll, height, listState, endpoint, index, viewParams, topItemCount, scrollToLastItem, refreshing, onRefresh, isInPanel, ...rest } = props

    const uniRef = useRef();

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

    const style = height && height != '100%' ? { height: `${height}px` } : {};

    const isScrolling = (isFinished) => {

        if (!isFinished && refer?.current && refer.current.getState && rest.storagekey) {

            refer.current.getState((state) => {
                const ch = { state: state }
                storageSet('ul:state', rest.storagekey, ch);
            });
        }
    }

    const stateChanged = (state) => {
        const ch = { state: state }
        storageSet('ul:state', rest.storagekey, ch);
    }

    const ItemComponent = ({ className, ...props }) => (
        <ReactNativeView className={`w-1/${numColumns} ${cd('p-sm')} ${className || cd('mb-md')}`} {...props} />
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

    const commonVirtuosoProps = {
        data,
        useWindowScroll: !height,
        style,
        ref: refer ? refer : uniRef,
        endReached: onEndReached,
        overscan: 900,
        components: numColumns > 1 ? {
            List: ListComponent,
            Item: ItemComponent,
            Footer: () => {
                return ListFooterComponent
            },
            Header: () => {
                // Add header spacer only for panel layouts where content scrolls under semi-transparent header
                if (isInPanel && scrollProps?.headerHeight > 0) {
                    return <View style={{ height: 64 }} />;
                }
                return useCustomScrollHandler ? <View style={{ paddingTop: scrollProps.headerHeight }}></View> : null;
            },
        } : {
            Footer: () => ListFooterComponent,
            Header: () => {
                // Add header spacer only for panel layouts where content scrolls under semi-transparent header
                if (isInPanel && scrollProps?.headerHeight > 0) {
                    return <View style={{ height: 64 }} />;
                }
                return useCustomScrollHandler ? <View style={{ paddingTop: scrollProps.headerHeight }}></View> : null;
            },
        },
        isScrolling,
        ...rest,
    };




    let contentComponent = null

    if (preloadComponent) {
        contentComponent = preloadComponent;
    }
    else {
        if (numColumns > 1 && !sortable) {
            contentComponent = (
                <View style={style}>
                    {ListHeaderComponent && ListHeaderComponent()}
                    <VirtuosoGrid
                        {...commonVirtuosoProps}
                        itemContent={itemContent}
                        stateChanged={stateChanged}
                        {...(scrollToLastItem ? { initialTopMostItemIndex: data.length } : {})}
                        atBottomStateChange={onEndReached}
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
                    <View style={style}>
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