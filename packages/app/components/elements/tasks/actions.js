/**
 * UNA tasks actions: `modal` opens a form, `callback` hits an endpoint
 * (optionally behind a confirm dialog), `menu` carries plain menu items.
 */
import { useTranslation } from 'react-i18next';
import { NeoButton } from 'app/design/controls';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { fetcher } from 'app/lib/fetcher';
import { apiUrl, emitTasksListRefresh } from './helpers';

export const NO_CONFIRM = { show: false, title: '', cb: null };

function actionNeedsConfirm(action) {
    return action?.confirm == '1' || action?.confirm === true;
}

/** Runs `execute` now, or after the user confirms when the action asks for it. */
async function runWithConfirm({ needsConfirm, title, execute, setShowConfirm }) {
    if (needsConfirm && setShowConfirm) {
        setShowConfirm({ show: true, title: title || 'Are you sure?', cb: execute });
        return;
    }
    await execute();
}

export function actionsToDropdownItems(actions = []) {
    return actions.map((action) => ({
        id: action.name,
        name: action.name,
        title: action.title || action.name,
        ...(action.icon ? { icon: action.icon } : {}),
        action,
    }));
}

/**
 * @param {object} handlers
 * @param {(block) => void} handlers.setFormBlock   receives the modal form block
 * @param {(state) => void} [handlers.setShowConfirm]
 */
export async function runTaskAction(action, { setFormBlock, setShowConfirm }) {
    if (!action) return;

    if (action.type === 'modal') {
        const response = await fetcher(apiUrl(action.callback));
        setFormBlock({ content: response.data, designbox_id: 0, title: action.title });
        return;
    }

    if (action.type === 'callback') {
        await runWithConfirm({
            needsConfirm: actionNeedsConfirm(action),
            title: action.title || action.confirm_text,
            setShowConfirm,
            execute: async () => {
                await fetcher(apiUrl(action.callback));
                emitTasksListRefresh();
            },
        });
    }
}

export function TaskActionsDropdown({ actions, ...handlers }) {
    const { t } = useTranslation();
    const items = actionsToDropdownItems(actions);
    if (!items.length) return null;

    return (
        <DropdownMenu
            items={items}
            onSelect={(item) => runTaskAction(item.action, handlers)}
            buttonProps={{
                style: 'borderless',
                controlSize: 'small',
                borderShape: 'circle',
                image: 'Ellipsis',
                accessibilityLabel: t('More options'),
                classNames: { root: 'self-center' },
            }}
        />
    );
}

/** Buttons for `type: 'menu'` actions (each carries UNA menu `items`). */
export function MenuObjectActions({ actions, setShowConfirm }) {
    const menuItems = (actions || []).flatMap((action) => (
        Array.isArray(action?.items) ? action.items : []
    ));
    if (!menuItems.length) return null;

    const onMenuItemPress = (item) => {
        const callbackUrl = item?.data?.request_url || item?.callback;
        if (!callbackUrl) return;

        return runWithConfirm({
            needsConfirm: actionNeedsConfirm(item?.data || item),
            title: item?.title || item?.data?.confirm_text,
            setShowConfirm,
            execute: async () => {
                await fetcher(apiUrl(callbackUrl));
                if (item?.data?.on_callback === 'refresh' || item?.on_callback === 'refresh') {
                    emitTasksListRefresh();
                }
            },
        });
    };

    return menuItems.map((item, index) => (
        <NeoButton
            key={item?.id || item?.name || `menu-item-${index}`}
            style="glass"
            controlSize="small"
            label={item?.title || item?.name}
            onPress={() => onMenuItemPress(item)}
        />
    ));
}
