import { View } from 'app/design/view';
import { BlockWrapper } from 'app/components/block-wrapper';
import { GridProvider } from './grid/context';
import { useGridData } from './grid/use-grid-data';
import GridModals from './grid/modals';
import GridToolbar from './grid/toolbar';
import GridTable from './grid/table';

/**
 * UNA CMS grid block: paginated table with filters, row/bulk actions, and checkout.
 * Rows, selection and overlays live in a per-grid store (`./grid/context`);
 * fetching and filter state live in `useGridData`.
 */
export default function ElementGrid(props) {
    if (!props.data?.header)
        return <></>;

    return (
        <GridProvider data={props.data}>
            <GridBlock {...props} />
        </GridProvider>
    );
}

function GridBlock({ data, blockWrapperProps }) {
    const {
        settings,
        rows,
        dropdownFilterKeys,
        selectedFilters,
        handleFilter,
        handleSearch,
        query,
    } = useGridData(data);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                <GridModals />
                <GridToolbar
                    actionsBulk={Object.values(data.actions?.bulk || {})}
                    actionsIndependent={Object.values(data.actions?.independent || {})}
                    dropdownFilterKeys={dropdownFilterKeys}
                    settings={settings}
                    selectedFilters={selectedFilters}
                    handleFilter={handleFilter}
                    handleSearch={handleSearch}
                />
                <GridTable rows={rows} query={query} />
            </View>
        </BlockWrapper>
    );
}
