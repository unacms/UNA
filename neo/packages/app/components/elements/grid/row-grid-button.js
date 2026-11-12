import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Redirect from 'app/ui/atoms/redirect';
import { getDataForMenu } from 'app/lib/util';
import { getActionButtonIcon } from './actions';
import { useGrid } from './context';

/** Row actions UNA should not render as icon buttons. */
const EXCLUDED_ROW_ACTIONS = new Set(['clear_reports', 'set_acl_level']);

/** The actions a row shows as buttons: those it doesn't drop. */
export function getRowActions(actions) {
    return (actions || []).filter((itemAction) => itemAction && !EXCLUDED_ROW_ACTIONS.has(itemAction.name));
}

/**
 * The row's actions that don't fit (see `ROW_ACTIONS_VISIBLE` in cell.js) in one "…" menu:
 * links open, modals and objects open their form, callbacks run, as their buttons do.
 */
export function RowActionsOverflow({ id, actions }) {
    const redirectRef = useRef();

    const openRowAction = useGrid((state) => state.openRowAction);
    const runRowCallback = useGrid((state) => state.runRowCallback);

    const items = actions.map((itemAction) => ({
        name: itemAction.name,
        title: itemAction.title,
        icon: getActionButtonIcon(itemAction.name, itemAction.icon) || undefined,
    }));

    const onSelect = (oItem) => {
        const itemAction = actions.find((action) => action.name === oItem?.name);
        if (!itemAction) return;

        if (itemAction.type === 'link')
            redirectRef.current?.redirect(itemAction.url);
        else if (itemAction.type === 'modal' || itemAction.type === 'object')
            openRowAction(itemAction);
        else if (itemAction.type === 'callback')
            runRowCallback(itemAction, id, redirectRef);
    };

    return (
        <>
            <Redirect ref={redirectRef} />
            <DropdownMenu mode="popup" items={items} onSelect={onSelect}>
                <NeoButton
                    style="borderless"
                    controlSize="small"
                    image="Ellipsis"
                    accessibilityLabel="Actions"
                    interactive
                />
            </DropdownMenu>
        </>
    );
}

/**
 * One control in a grid row's actions cell (link / modal / menu / callback / object).
 * Everything it needs comes from the grid store, so rows pass ids only.
 */
export default function RowGridButton({ id, itemAction }) {
    const [hide, setHide] = useState(false);
    const [menuData, setMenuData] = useState(false);
    const redirectRef = useRef();

    const openRowAction = useGrid((state) => state.openRowAction);
    const runRowCallback = useGrid((state) => state.runRowCallback);
    const runMenuCallback = useGrid((state) => state.runMenuCallback);

    const icon = getActionButtonIcon(itemAction.name, itemAction.icon);

    if (EXCLUDED_ROW_ACTIONS.has(itemAction.name) || hide) {
        return <></>;
    }

    const commonProps = {
        style: 'borderless',
        controlSize: 'small',
        label: icon ? undefined : itemAction.title,
        image: icon || undefined,
        accessibilityLabel: itemAction.title,
    };

    if (itemAction.type === 'link') {
        return (
            <NeoButtonLink href={itemAction.url} {...commonProps} />
        );
    }

    if (itemAction.type === 'modal' || itemAction.type === 'object') {
        return (
            <NeoButton
                {...commonProps}
                onPress={() => {
                    openRowAction(itemAction);
                }}
            />
        );
    }

    if (itemAction.type === 'menu') {
        return (
            <>
                {!menuData ? <NeoButton
                    style="borderless"
                    controlSize="small"
                    image="Ellipsis"
                    accessibilityLabel={itemAction.title || 'Actions'}
                    onPress={() => {
                        if (Platform.OS === 'web')
                            setMenuData({
                                ...itemAction,
                                items: [{ name: 'loader' }],
                            })
                        getDataForMenu(itemAction, setMenuData)
                    }}
                /> : <DropdownMenu
                    mode="popup"
                    items={menuData.items}
                    defaultOpen={true}
                    onSelect={(oItem) => runMenuCallback(oItem, id, setHide)}
                >
                    <NeoButton
                        style="borderless"
                        controlSize="small"
                        image="Ellipsis"
                        accessibilityLabel={itemAction.title || 'Actions'}
                        interactive
                    />
                </DropdownMenu>}
            </>
        );
    }

    if (itemAction.type === 'callback') {
        return (
            <>
                <Redirect ref={redirectRef} />
                <NeoButton
                    {...commonProps}
                    onPress={() => runRowCallback(itemAction, id, redirectRef)}
                />
            </>
        );
    }

    return null;
}
