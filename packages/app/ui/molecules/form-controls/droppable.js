import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { View } from 'app/design/view'

const itemContentSorted = (index, data, provided, isDragging, renderItem) => {
    return (
        <div
            {...provided.draggableProps}
       
            ref={provided.innerRef}
            style={{
                ...(provided.draggableProps.style || {}), 
                opacity: isDragging ? 0.8 : 1, 
            }}
            className={`item ${isDragging ? "is-dragging" : ""}`}
        >
            {renderItem(index, data, provided.dragHandleProps)}
        </div>
    );
};

export function DragContext({ children, onSort, renderItem, direction="vertical" }) {
    return (
        <DragDropContext onDragEnd={onSort}>
            <Droppable
                droppableId="droppable"
                mode="virtual"
                direction={direction}
                renderClone={(provided, snapshot, rubric) => (
                    itemContentSorted(rubric.source.index, rubric, provided, snapshot.isDragging, renderItem)
                )}
            >
                {(provided) => (
                    <View {...provided.droppableProps} ref={provided.innerRef}>
                        {children}
                    </View>
                )}
            </Droppable>
        </DragDropContext>
    );
}

export function DragItem({ index, data, renderItem, isDragEnabled  }) {
    return isDragEnabled ? (
        <Draggable draggableId={`${index}`} index={index}>
            {(provided, snapshot) => (
                itemContentSorted(index, data, provided, snapshot.isDragging, renderItem)
            )}
        </Draggable>
     ) : renderItem(index, data);
}

export function DragControl({dragHandleProps, children}) {
    return <div className=''  {...dragHandleProps}>{children}</div>;
}