import { Text } from 'app/design/typography';
import { View, Row } from 'app/design/view';
import Link from 'app/ui/atoms/link';
import Profile from 'app/ui/molecules/profile/profile';
import Switch from 'app/ui/atoms/switcher';
import CheckBox from 'app/ui/atoms/checkbox';
import { Icon } from 'app/ui/atoms/icon';
import { stripTags, formatDate, useDateLocaleTag } from 'app/lib/util';
import RowGridButton, { RowActionsOverflow, getRowActions } from './row-grid-button';

/** Row action buttons the actions column fits (its width in context.js). */
const ROW_ACTIONS_VISIBLE = 2;
import { useTranslation } from 'react-i18next';
import { dedupeGridRowActions } from './actions';
import { useGrid } from './context';

const isSwitcherOn = (data) => data == 'active' || data == '1';

/** Columns have fixed tracks, so every textual cell truncates instead of wrapping. */
const CELL_TEXT_CLASS = 'block max-w-full min-w-0 overflow-hidden truncate text-sm text-secondary-foreground';

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
 * A table is read across rows, so dates are absolute (`Nov 12`, `Nov 12, 2025` for another year),
 * not relative as in feeds; `datetime` adds the clock. Empty stamps stay blank.
 */
function TimeCell({ ts, format }) {
    const { t } = useTranslation();
    const locale = useDateLocaleTag();

    if (!Number(ts)) return null;

    const text = formatDate(new Date(Number(ts) * 1000), t, { showTime: format === 'datetime', locale });
    return <Text className="text-sm text-secondary-foreground" numberOfLines={1}>{text}</Text>;
}

/** Interactive cells subscribe to the store themselves — plain cells stay pure. */
function SwitcherCell({ id, data, label }) {
    const { t } = useTranslation();
    const toggleSwitch = useGrid((state) => state.toggleSwitch);

    return (
        <View className="items-start justify-center">
            <Switch
                size="small"
                onValueChange={() => toggleSwitch(id)}
                value={isSwitcherOn(data)}
                // Some grids leave the switcher column untitled (bx_albums_common); the switch still needs a name.
                label={label || t('Enabled')}
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
export default function Cell({ cell, id, label }) {
    switch (cell?.type) {
        case 'time':
        case 'datetime':
            return <TimeCell ts={cell.data} format={cell.type} />
        case 'link':
            return <Link href={cell.data.url}><Text className="text-sm text-primary">{cell.data.text}</Text></Link>
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
            return <SwitcherCell id={id} data={cell.data} label={label} />
        case 'checkbox':
            return <SelectCell rowId={cell.data} />
        case 'profile':
            // Bounded to the column, so a long name ends in an ellipsis (Profile truncates it) instead of running over the next one.
            return (
                <View className="w-full min-w-0 overflow-hidden">
                    <Profile {...cell.data} displaySize="sm" />
                </View>
            )
        case 'actions': {
            // Two buttons fit the column; with more, the first stays and the others go to a "…" menu.
            // A menu action (`type: menu`) is its own "…" already, so it stays a button.
            const actions = getRowActions(dedupeGridRowActions(cell.data));
            const canFold = actions.length > ROW_ACTIONS_VISIBLE && !actions.some((itemAction) => itemAction.type === 'menu');
            const visible = canFold ? actions.slice(0, ROW_ACTIONS_VISIBLE - 1) : actions;
            const folded = canFold ? actions.slice(ROW_ACTIONS_VISIBLE - 1) : [];
            return (
                <View className="w-full items-end justify-center">
                    <Row className="gap-1.5 items-center justify-end flex-nowrap">
                        {visible.map((itemAction, index) => (
                            <RowGridButton
                                key={"ab" + index}
                                itemAction={itemAction}
                                id={id}
                            />
                        ))}
                        {folded.length ? <RowActionsOverflow id={id} actions={folded} /> : null}
                    </Row>
                </View>
            )
        }

    }
    return <TextCell>{JSON.stringify(cell)}</TextCell>
}
