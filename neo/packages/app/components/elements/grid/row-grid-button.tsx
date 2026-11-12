import { useState, useRef, type RefObject } from 'react';
import { Platform } from 'react-native';
import { NeoButton, NeoButtonLink } from 'app/design/controls';
import DropdownMenu, { type DropdownMenuItemData } from 'app/ui/atoms/dropdown-menu';
import Redirect, { type RedirectHandle } from 'app/ui/atoms/redirect';
import { getDataForMenu } from 'app/lib/util';
import { getActionButtonIcon } from './actions';
import { useGrid } from './context';
import type { GridRowAction, GridRowId, RowActionsOverflowProps, RowGridButtonProps } from './row-grid-button.types';

/** Row actions UNA should not render as icon buttons. */
const EXCLUDED_ROW_ACTIONS = new Set(['clear_reports', 'set_acl_level']);

/** The actions a row shows as buttons: those it doesn't drop. */
export function getRowActions(actions: (GridRowAction | null | undefined)[] | null | undefined): GridRowAction[] {
    return (actions || []).filter((itemAction): itemAction is GridRowAction => !!itemAction && !EXCLUDED_ROW_ACTIONS.has(itemAction.name));
}

type GridStoreActions = {
    openRowAction: (action: GridRowAction) => void;
    runRowCallback: (action: GridRowAction, id: GridRowId, redirectRef: RefObject<RedirectHandle | null>) => void;
    runMenuCallback: (item: DropdownMenuItemData, id: GridRowId, setHide: (hide: boolean) => void) => void;
};

/** The grid store (context.js) is untyped: these are the handlers the row controls call. */
function useRowHandlers(): GridStoreActions {
    const openRowAction = useGrid((state: GridStoreActions) => state.openRowAction);
    const runRowCallback = useGrid((state: GridStoreActions) => state.runRowCallback);
    const runMenuCallback = useGrid((state: GridStoreActions) => state.runMenuCallback);

    return { openRowAction, runRowCallback, runMenuCallback };
}

function actionIcon(action: GridRowAction): string | undefined {
    return (getActionButtonIcon(action.name, action.icon) as string | null | undefined) || undefined;
}

/**
 * The row's actions that don't fit (see `ROW_ACTIONS_VISIBLE` in cell.js) in one "…" menu:
 * links open, modals and objects open their form, callbacks run, as their buttons do.
 */
export function RowActionsOverflow({ id, actions }: RowActionsOverflowProps) {
    const redirectRef = useRef<RedirectHandle | null>(null);
    const { openRowAction, runRowCallback } = useRowHandlers();

    const items: DropdownMenuItemData[] = actions.map((itemAction) => ({
        name: itemAction.name,
        title: itemAction.title,
        icon: actionIcon(itemAction),
    }));

    const onSelect = (oItem: DropdownMenuItemData) => {
        const itemAction = actions.find((action) => action.name === oItem?.name);
        if (!itemAction) return;

        if (itemAction.type === 'link')
            redirectRef.current?.redirect(itemAction.url ?? '');
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
export default function RowGridButton({ id, itemAction }: RowGridButtonProps) {
    const [hide, setHide] = useState(false);
    const [menuData, setMenuData] = useState<(GridRowAction & { items: DropdownMenuItemData[] }) | false>(false);
    const redirectRef = useRef<RedirectHandle | null>(null);
    const { openRowAction, runRowCallback, runMenuCallback } = useRowHandlers();

    const icon = actionIcon(itemAction);

    if (EXCLUDED_ROW_ACTIONS.has(itemAction.name) || hide) {
        return <></>;
    }

    const commonProps = {
        style: 'borderless',
        controlSize: 'small',
        label: icon ? undefined : itemAction.title,
        image: icon,
        accessibilityLabel: itemAction.title,
    } as const;

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
