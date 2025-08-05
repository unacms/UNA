import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting} from 'app/lib/util';

const tableTheme = appSetting('theme', 'tables');

function createTableComponent({ baseClass, Component = View, role, ariaLevel }) {
    return function TableSubComponent({ className, density, ...props }) {
        const finalDensity = density ?? globalDensity;

        return (
            <Component
                className={`${tableTheme[baseClass]} ${className}`}
                role={role}
                aria-level={ariaLevel}
                {...props}
            />
        );
    };
}

// Table Root Component
const Table = createTableComponent({ 
    baseClass: 'u-table-base',
    role: 'table'
});

// Table Header Component
const TableHeader = createTableComponent({ 
    baseClass: 'u-table-header',
    role: 'rowgroup'
});

// Table Body Component
const TableBody = createTableComponent({ 
    baseClass: 'u-table-body',
    role: 'rowgroup'
});

// Table Footer Component
const TableFooter = createTableComponent({ 
    baseClass: 'u-table-footer',
    role: 'rowgroup'
});

// Table Row Component
const TableRow = createTableComponent({ 
    baseClass: 'u-table-row',
    role: 'row'
});

// Table Head Cell Component
const TableHead = createTableComponent({
    baseClass: 'u-table-head',
    Component: View,
    role: 'columnheader'
});

// Table Cell Component
const TableCell = createTableComponent({
    baseClass: 'u-table-cell',
    role: 'cell'
});

// Table Header Text Component
const TableHeaderText = createTableComponent({
    baseClass: 'u-table-head-text',
    Component: Text
});

// Table Cell Text Component
const TableCellText = createTableComponent({
    baseClass: 'u-table-cell-text',
    Component: Text
});

export default Table;

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableHeaderText,
    TableCellText,
};