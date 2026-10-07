import { useCallback } from 'react'
import { View } from 'app/design/view'
import { DragDropContext, Droppable, Draggable, type DraggableProvided, type DropResult } from '@hello-pangea/dnd'
import type { UniListRenderItem } from './shared'

/**
 * Drag-and-drop reorderable list (web only).
 *
 * Not virtualized on purpose: DnD needs every row in the DOM to measure drop
 * targets, and sortable lists (admin grids) are short. `UniList` delegates
 * here when it gets `sortable`, so callers keep a single import.
 *
 * @param {object}   props
 * @param {array}    props.data       Rows, already deduped.
 * @param {Function} props.renderItem `({ item, index }) => node`.
 * @param {Function} props.onSort     `@hello-pangea/dnd` onDragEnd result.
 * @param {object}   [props.style]    Wrapper style (fixed height, etc).
 */
export default function SortableList({ data, renderItem, onSort, style }: {
    data: any[]
    renderItem: UniListRenderItem
    onSort?: (result: DropResult) => void
    style?: any
}) {
    const renderRow = useCallback((index: number, item: any, provided: DraggableProvided, isDragging: boolean) => (
        <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            style={provided.draggableProps.style}
            className={`item ${isDragging ? 'is-dragging' : ''}`}
        >
            <View className="min-h-px">
                {renderItem({ item, index })}
            </View>
        </div>
    ), [renderItem])

    return (
        <View style={style}>
            <DragDropContext onDragEnd={onSort!}>
                <Droppable
                    droppableId="droppable"
                    // The row being dragged is rendered in a portal; give it the same markup.
                    renderClone={(provided, snapshot, rubric) =>
                        renderRow(
                            rubric.source.index,
                            data[rubric.source.index],
                            provided,
                            snapshot.isDragging
                        )
                    }
                >
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            {data.map((item, index) => (
                                <Draggable
                                    draggableId={`item-${item.id}`}
                                    index={index}
                                    key={item.id}
                                >
                                    {(dragProvided, snapshot) =>
                                        renderRow(index, item, dragProvided, snapshot.isDragging)
                                    }
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </View>
    )
}
