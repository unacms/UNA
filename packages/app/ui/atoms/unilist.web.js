
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso'
import { View } from 'app/design/view'
import { View as ReactNativeView } from 'react-native'

import { storageSet, appSetting } from 'app/lib/util'
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useCallback, forwardRef } from 'react';

export default function UniList(props) {
    let { sortable, data, renderItem, onEndReached, maxToRenderPerBatch, initialNumToRender, contentContainerStyle, initialScrollIndex, ListHeaderComponent, ListFooterComponent, refer, onScrollToIndex,
        onSort, numColumns, keyboardShouldPersistTaps, keyExtractor, useWindowScroll, height, listState, endpoint, index, viewParams, topItemCount, scrollToLastItem, refreshing, onRefresh, ...rest } = props

    data = data.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

    const itemContent = useCallback((index, data) => {
        return renderItem({ item: data, index });
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

    const style = height ? { height: `${height}px` } : {};

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
        <ReactNativeView className={`w-1/${numColumns} ${className || ''}`} {...props} />
    );

    const ListComponent = forwardRef(({ className, ...props }, ref) => {
        const maxWidthBlock = appSetting('layout', 'max_width_block');
        return (
            <ReactNativeView
                ref={ref}
                className={`${maxWidthBlock} mx-auto flex flex-wrap flex-row ${className || ''}`}
                {...props}
            />
        );
    });


    const commonVirtuosoProps = {
        data,
        useWindowScroll: !height,
        style,
        ref: refer,
        endReached: onEndReached,
        overscan: 900,
        components: numColumns > 1 ? {
            List: ListComponent,
            Item: ItemComponent,
            Footer: () => {
                return ListFooterComponent
            },
        } : {
            Footer: () => ListFooterComponent,
            Header: () => ListHeaderComponent,
        },
        isScrolling,
        ...rest,
    };

    if (numColumns > 1) {
        return (
            <VirtuosoGrid
                {...commonVirtuosoProps}
                itemContent={itemContent}
                stateChanged={stateChanged}
                {...(scrollToLastItem ? { initialTopMostItemIndex: data.length } : {})}
                atBottomStateChange={onEndReached}
            />
        )
    }
    else {
        if (sortable) {
            return (
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

                                />
                                {provided.placeholder}
                            </View>
                        )}
                    </Droppable>
                </DragDropContext>
            )
        }
        return (
            <Virtuoso
                itemContent={itemContent}
                {...commonVirtuosoProps}
                {...(listState?.ranges && { restoreStateFrom: listState })}
                {...(scrollToLastItem && { initialTopMostItemIndex: data.length })}
            />
        )
    }
}