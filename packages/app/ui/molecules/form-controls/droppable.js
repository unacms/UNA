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

// Space is dnd's (lift / drop). Enter is marked handled so a pressable card
// around the handle (lessons, steps) does not open from it.
const keepEnterInHandle = (event) => {
    if (event.key === 'Enter') event.preventDefault();
};

/**
 * The div is the focusable drag handle (dnd's role="button", tabIndex 0), so it
 * carries the accessible name and the `u-neo-btn-link hit-area-*` host classes
 * for a passive NeoButton inside (the focus ring then takes the button's shape).
 */
export function DragControl({ dragHandleProps, accessibilityLabel, className, children }) {
    return <div className={className} aria-label={accessibilityLabel} onKeyDown={keepEnterInHandle} {...dragHandleProps}>{children}</div>;
}