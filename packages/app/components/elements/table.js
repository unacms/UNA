import { ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link';
import { isUrl } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableHeaderText,
    TableCellText,
} from 'app/ui/molecules/page/table';

const UNIX_TS_MIN = 1000000000;

function isHeaderRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const values = Object.values(row);
    if (!values.length) return false;
    return values.every((value) => typeof value === 'string' && !isUrl(value));
}

function isUnixTs(value) {
    return Number.isInteger(value) && value > UNIX_TS_MIN;
}

function columnKind(key, rows) {
    const values = rows.map((row) => row?.[key]).filter((value) => value != null && value !== '');
    if (values.some((value) => isUrl(String(value)))) return 'url';
    if (values.some(isUnixTs)) return 'time';
    if (values.length && values.every((value) => typeof value === 'number')) return 'number';
    return 'text';
}

function columnClass(kind) {
    if (kind === 'url' || kind === 'text') return 'flex-2 min-w-0';
    return 'flex-1 min-w-0';
}

function CellValue({ value, kind }) {
    if (kind === 'time') {
        if (!Number(value)) return null;
        return <Time ts={value} format="datetime" stylesName="" />;
    }

    if (kind === 'url' && isUrl(String(value))) {
        return (
            <Link href={value}>
                <Text className="text-primary" numberOfLines={1}>
                    {value}
                </Text>
            </Link>
        );
    }

    if (value == null || value === '') return null;

    return <TableCellText numberOfLines={1}>{String(value)}</TableCellText>;
}

export default function ElementTable({ data, blockWrapperProps }) {
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return null;

    const header = isHeaderRow(rows[0]) ? rows[0] : null;
    const body = header ? rows.slice(1) : rows;
    const keys = Object.keys(header || body[0] || {});
    const kinds = Object.fromEntries(keys.map((key) => [key, columnKind(key, body)]));

    return (
        <BlockWrapper {...blockWrapperProps}>
            <ScrollView
                horizontal
                className="w-full"
                contentContainerClassName="w-full min-w-full"
                showsHorizontalScrollIndicator
            >
                <Table className="w-full ">
                    <TableHeader>
                        <TableRow>
                            {keys.map((key) => (
                                <TableHead key={key} className={columnClass(kinds[key])}>
                                    <TableHeaderText numberOfLines={1}>
                                        {header ? header[key] : key}
                                    </TableHeaderText>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {body.map((row, index) => (
                            <TableRow key={index}>
                                {keys.map((key) => (
                                    <TableCell key={key} className={columnClass(kinds[key])}>
                                        <CellValue value={row?.[key]} kind={kinds[key]} />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollView>
        </BlockWrapper>
    );
}

ElementTable.checkEmpty = (item) => Array.isArray(item?.data) && item.data.length > 0;
