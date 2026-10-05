import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile/profile';
import Switch from 'app/ui/atoms/switcher';
import CheckBox from 'app/ui/atoms/checkbox';
import { Icon } from 'app/ui/atoms/icon';
import { stripTags } from 'app/lib/util';
import RowGridButton from './row-grid-button';
import { dedupeGridRowActions } from './actions';
import { useGrid } from './context';

const isSwitcherOn = (data) => data == 'active' || data == '1';

/** Columns have fixed tracks, so every textual cell truncates instead of wrapping. */
const CELL_TEXT_CLASS = 'block max-w-full min-w-0 overflow-hidden truncate text-secondary-foreground';

function TextCell({ children }) {
    return <Text className={CELL_TEXT_CLASS} numberOfLines={1}>{children}</Text>;
}

/** Text cells share the markup above and differ only in how the value reads. */
const CELL_TEXT_VALUE = {
    text: ({ value }) => stripTags(value),
    price: ({ value: { value, currency } }) => `${value} ${currency}`,
    period: ({ value: { period, unit } }) => `${period} ${unit}`,
};

/**
 * `time` renders a relative date, `datetime` adds the clock — `Time` switches on
 * the `datetime` string, so the cell type is passed straight through.
 * Empty stamps stay blank.
 */
function TimeCell({ ts, format }) {
    if (!Number(ts)) return null;

    return <Time ts={ts} format={format} stylesName='text-sm text-secondary-foreground' />;
}

/** Interactive cells subscribe to the store themselves — plain cells stay pure. */
function SwitcherCell({ id, data }) {
    const toggleSwitch = useGrid((state) => state.toggleSwitch);

    return (
        <View className="items-start justify-center">
            <Switch
                size="small"
                onValueChange={() => toggleSwitch(id)}
                value={isSwitcherOn(data)}
            />
        </View>
    );
}

/** Subscribes to its own checked flag, so checking a row re-renders one cell. */
function SelectCell({ rowId }) {
    const isSelected = useGrid((state) => state.selected.has(rowId));
    const toggleSelected = useGrid((state) => state.toggleSelected);

    return (
        <View className="items-start justify-center">
            <CheckBox
                value={isSelected}
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleSelected(rowId)}
                isBackground={false}
                compact
            />
        </View>
    );
}

/**
 * Render one UNA grid cell by `cell.type` (text, date, switcher, actions, …).
 * Unknown types fall back to JSON so new backend types are visible in UI.
 */
export default function Cell({ cell, id }) {
    switch (cell?.type) {
        case 'time':
        case 'datetime':
            return <TimeCell ts={cell.data} format={cell.type} />
        case 'link':
            return <Link href={cell.data.url}><Text className="text-primary">{cell.data.text}</Text></Link>
        case 'text':
        case 'price':
        case 'period':
            return <TextCell>{CELL_TEXT_VALUE[cell.type](cell)}</TextCell>
        case 'order':
            return (
                <View className="items-start justify-center">
                    <Icon icon="GripVertical" size={18} className="text-muted-foreground" />
                </View>
            )
        case 'switcher':
            return <SwitcherCell id={id} data={cell.data} />
        case 'checkbox':
            return <SelectCell rowId={cell.data} />
        case 'profile':
            return <Profile {...cell.data} displaySize="sm" />
        case 'actions':
            return (
                <View className="w-full items-end justify-center">
                    <Row className="gap-1.5 items-center justify-end flex-nowrap">
                        {dedupeGridRowActions(cell.data).map((itemAction, index) => (
                            <RowGridButton
                                key={"ab" + index}
                                itemAction={itemAction}
                                id={id}
                            />
                        ))}
                    </Row>
                </View>
            )

    }
    return <TextCell>{JSON.stringify(cell)}</TextCell>
}
