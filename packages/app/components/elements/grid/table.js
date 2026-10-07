import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { View, Row, ScrollView } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist';
import Loading from 'app/ui/atoms/loading';
import GridRow from './row';
import { useGrid } from './context';

/**
 * Sticky-width header + virtualized body. Horizontal ScrollView lets wide
 * UNA grids scroll instead of squashing text columns.
 */
export default function GridTable({ rows, query }) {
    const { t } = useTranslation();
    const { status, hasNextPage, isFetchingNextPage, isRefetching, handleEndReached, reloadGrid } = query;
    const { columns, tableMinWidth, isSortable, sortRows } = useGrid(
        useShallow((state) => ({
            columns: state.columns,
            tableMinWidth: state.tableMinWidth,
            isSortable: state.isSortable,
            sortRows: state.sortRows,
        }))
    );

    return (
        <ScrollView
            horizontal
            className="w-full"
            contentContainerClassName="w-full min-w-full"
            showsHorizontalScrollIndicator
        >
            <View
                className="w-full border border-border/60 rounded-lg"
                style={{ width: '100%', minWidth: tableMinWidth }}
            >
                <Row className="w-full items-center gap-2 px-2 py-2 border-b border-border/60">
                    {columns.map((column, index) => (
                        <View
                            key={column.name + index}
                            style={column.style}
                            className={`justify-center py-1 min-w-0 ${column.align}`}
                        >
                            <Text
                                className="font-bold text-secondary-foreground text-left"
                                numberOfLines={1}
                            >
                                {column.label}
                            </Text>
                        </View>
                    ))}
                </Row>
                {(!rows || rows.length === 0) && status === 'success' && !hasNextPage && (
                    <View className="items-center px-2 pt-4 pb-4">
                        <Text className="text-secondary-foreground text-center">{t('Nothing to show')}</Text>
                    </View>
                )}

                <UniList
                    height={400}
                    sortable={isSortable}
                    onSort={sortRows}
                    data={rows}
                    onEndReached={handleEndReached}
                    refreshing={isRefetching}
                    onRefresh={reloadGrid}
                    ListFooterComponent={hasNextPage && isFetchingNextPage ? (
                        <View className="p-4 items-center">
                            <Loading size="small" />
                        </View>
                    ) : null}
                    renderItem={({ item }) => <GridRow item={item} />}
                />
            </View>
        </ScrollView>
    );
}
