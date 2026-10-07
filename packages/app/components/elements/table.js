import { ScrollView } from 'app/design/view';
import { Text } from 'app/design/typography';
import Time from 'app/ui/atoms/time';
import Link from 'app/ui/atoms/link';
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

function isHttpUrl(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    try {
        const url = new URL(trimmed);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isHeaderRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return false;
    const values = Object.values(row);
    if (!values.length) return false;
    return values.every((value) => typeof value === 'string' && !isHttpUrl(value));
}

function toUnixTs(value) {
    if (typeof value === 'number' && Number.isInteger(value) && value > UNIX_TS_MIN) {
        return value;
    }
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
        const n = Number(value);
        if (Number.isInteger(n) && n > UNIX_TS_MIN) return n;
    }
    return null;
}

function cellKind(value) {
    if (value == null || value === '') return 'empty';
    if (toUnixTs(value) != null) return 'time';
    if (isHttpUrl(String(value))) return 'url';
    if (typeof value === 'number') return 'number';
    return 'text';
}

function columnClass(key, rows) {
    const wide = rows.some((row) => {
        const kind = cellKind(row?.[key]);
        return kind === 'url' || kind === 'text';
    });
    return wide ? 'flex-2 min-w-0' : 'flex-1 min-w-0';
}

function CellValue({ value }) {
    const kind = cellKind(value);

    if (kind === 'time') {
        const ts = toUnixTs(value);
        if (!ts) return null;
        return <Time ts={ts} format="datetime" stylesName="" />;
    }

    if (kind === 'url') {
        return (
            <Link href={value}>
                <Text className="text-primary" numberOfLines={1}>
                    {value}
                </Text>
            </Link>
        );
    }

    if (kind === 'empty') return null;

    return <TableCellText numberOfLines={1}>{String(value)}</TableCellText>;
}

export default function ElementTable({ data, blockWrapperProps }) {
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) return null;

    const header = isHeaderRow(rows[0]) ? rows[0] : null;
    const body = header ? rows.slice(1) : rows;
    const keys = Object.keys(header || body[0] || {});

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
                                <TableHead key={key} className={columnClass(key, body)}>
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
                                    <TableCell key={key} className={columnClass(key, body)}>
                                        <CellValue value={row?.[key]} />
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
