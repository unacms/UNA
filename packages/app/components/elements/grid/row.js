import { memo } from 'react';
import { View, Row } from 'app/design/view';
import Cell from './cell';
import { useGrid } from './context';

/**
 * One row of the grid. Memoized because the list re-renders on every fetch and
 * on every selection change, while a row itself only depends on its own data.
 * Column tracks and `field_id` come from the store — both are computed once per
 * grid, so subscribing here keeps `item` the only prop.
 */
export default memo(function GridRow({ item }) {
    const columns = useGrid((state) => state.columns);
    const fieldId = useGrid((state) => state.fieldId);
    const id = item[fieldId];

    return (
        <Row className="w-full items-center gap-2 px-2 py-2 border-b border-border/60 web:hover:bg-muted/40">
            {columns.map((column, index) => (
                <View
                    key={column.name + index}
                    style={column.style}
                    className={`justify-center min-h-9 min-w-0 ${column.align}`}
                >
                    <Cell cell={item[column.name]} id={id} />
                </View>
            ))}
        </Row>
    );
});
