import { View } from 'app/design/view'

/**
 * Native: no drag-and-drop. @hello-pangea/dnd is DOM-only (it appends <style>
 * tags to document.head and renders <div> drag handles), so items keep their
 * order and the reorder handle is not rendered. Web counterpart in droppable.js.
 */
export function DragContext({ children }) {
    return <View>{children}</View>;
}

export function DragItem({ index, data, renderItem }) {
    return renderItem(index, data);
}

export function DragControl() {
    return null;
}
