import { fetcher } from 'app/lib/fetcher';
import { getPageData } from 'app/lib/util';
import { buildFilterParam } from './filters';

/**
 * Append UNA `query_append` pairs to a grid URL (`&key=value`, no encoding —
 * matches historic TemplServiceGrid calls).
 */
export const appendQueryParams = (url, queryAppend = {}) => {
    Object.keys(queryAppend).forEach((sKey) => {
        url += '&' + sKey + '=' + queryAppend[sKey];
    });
    return url;
};

/** `ids[]=1&ids[]=2` for bulk / row actions. */
export const toIdsQuery = (ids = []) => ids.map((id) => `ids[]=${id}`).join('&');

/** UNA form payload for BlockByData (`designbox_id: 0` = no wrapper). */
export const toGridFormBlock = (content) => ({ content, designbox_id: 0 });

/**
 * Load one page of grid rows (`a=display`). Used by useInfiniteQuery.
 */
export const fetchGridData = async ({ pageParam, settings, selectedFilters, numberedFilterKeys, queryAppend, searchValue }) => {
    const start = pageParam?.start || 0;
    let url = "&start=" + start;
    url += '&filter=' + buildFilterParam(numberedFilterKeys, selectedFilters, searchValue);

    let sUrl = '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + settings.object + '&a=display';
    sUrl = appendQueryParams(sUrl, queryAppend);

    const fetchedData = await fetcher(sUrl + url);

    return {
        data: fetchedData.data?.data || [],
        params: {
            start: start,
            per_page: fetchedData.data?.settings?.per_page || settings.per_page
        }
    };
};

/**
 * Pull grid row(s) from a UNA action API response. Always returns an array.
 * UNA payloads vary: `{rows}`, `{data}`, a raw array, or a single row object.
 */
export const extractGridRowsFromResponse = (response) => {
    const data = response?.data;
    if (!data) return [];

    // Shape: { rows: [...] }
    if (Array.isArray(data.rows) && data.rows.length > 0) {
        return data.rows;
    }
    // Shape: { data: [...] } or { data: {...} }
    if (Array.isArray(data?.data) && data.data.length > 0) {
        return data.data;
    }
    if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
        return [data.data];
    }
    // Shape: data is a direct array of rows
    if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        // Content blocks (msg/form/redirect) are not grid rows.
        if (first?.type === 'msg' || first?.type === 'form' || first?.type === 'redirect') {
            return [];
        }
        return data;
    }
    // Shape: single row object (not a full grid payload with settings/header/rows)
    if (typeof data === 'object' && !Array.isArray(data) && !data.settings && !data.header && !data.rows) {
        return [data];
    }

    return [];
};

/** First row from an action response, or null. */
export const extractGridRowFromResponse = (response) => {
    const rows = extractGridRowsFromResponse(response);
    return rows[0] ?? null;
};

/**
 * True when a row has designed cells (`{ type, … }`) from grid display API.
 * Raw DB rows must trigger a full reload instead of a local patch.
 */
export const isProcessedGridRow = (row) => {
    if (!row || typeof row !== 'object') return false;
    return Object.values(row).some(
        (cell) => cell != null && typeof cell === 'object' && typeof cell.type === 'string'
    );
};

/** Replace `{id}` in action links with the row id from `bx_grid_action_data`. */
export const resolveActionPageUrl = (data) => {
    const raw = data?.link || data?.url || data?.redirect_url || '';
    if (!raw) return '';
    const id = data?.attr?.bx_grid_action_data;
    if (id == null || id === '' || !String(raw).includes('{id}')) return raw;
    return String(raw).replaceAll('{id}', id);
};

/**
 * Row action name / UNA icon → Lucide icon. Matched top to bottom, and order
 * matters: `icon=remove` wins over `name=edit` (UNA sometimes sends both).
 */
const ROW_ACTION_ICONS = [
    { lucide: 'Trash', names: ['delete', 'remove'], icons: ['remove'] },
    { lucide: 'Pencil', names: ['edit'] },
    { lucide: 'Copy', names: ['copy', 'clone', 'duplicate'], icons: ['copy'] },
    { lucide: 'Eye', names: ['view', 'preview', 'info'], icons: ['eye'] },
    { lucide: 'ChartLine', names: ['promotion'] },
    { lucide: 'Wallet', names: ['edit_budget'] },
    { lucide: 'UserRoundCog', names: ['set_role'] },
    { lucide: 'Ellipsis', names: ['actions'] },
    { lucide: 'Mail', names: ['envelope'], icons: ['envelope'] },
    { lucide: 'MailOpen', names: ['envelope-open'], icons: ['envelope-open'] },
];

/** Lucide icon for a row action, or `false` to fall back to the action title. */
export const getActionButtonIcon = (name, icon) => {
    const match = ROW_ACTION_ICONS.find(
        (rule) => rule.names.includes(name) || rule.icons?.includes(icon)
    );
    if (match) return match.lucide;

    // UNA can also send a Lucide name directly.
    if (typeof icon === 'string' && /^[A-Z][A-Za-z0-9]*$/.test(icon)) return icon;
    return false;
};

/**
 * UNA grids often ship both a text "View details" control and an `edit` icon that
 * open the same modal/url. Prefer the icon action and drop the duplicate text one.
 */
export const dedupeGridRowActions = (actions) => {
    const list = (actions || []).filter((item) => item?.type);
    const edit = list.find((a) => a.name === 'edit');
    if (!edit) return list;

    const editUrl = edit.url || edit.link || '';

    return list.filter((action) => {
        if (action.name === 'edit' || action.name === 'delete') return true;
        if (getActionButtonIcon(action.name, action.icon)) return true;

        const title = String(action.title || '');
        if (/view\s*details/i.test(title)) return false;
        if (editUrl && (action.url === editUrl || action.link === editUrl)) return false;

        if (
            action.type === 'modal' &&
            edit.type === 'modal' &&
            ((edit.action && edit.action === action.action) ||
                (edit.callback && edit.callback === action.callback))
        ) {
            return false;
        }

        return true;
    });
};

/**
 * Call a named grid action (`a=delete|enable|…`) or a custom callback URL.
 * `params` is a raw query suffix (`&ids[]=1`); skipped when `callback` is set.
 */
export const performGridAction = async ({ object, queryAppend, action, params, callback }) => {
    let sUrl = callback
        ? '/api.php?r=' + callback
        : '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' + object + '&a=' + action;
    if (!callback) {
        sUrl = appendQueryParams(sUrl, queryAppend);
    }

    return await fetcher(sUrl + (callback ? '' : params));
};

/**
 * Apply UNA `on_callback` after a row action: hide row, redirect, patch rows,
 * or full refresh via `reloadGrid`.
 */
export const applyGridActionCallback = async ({
    itemAction,
    response,
    id,
    deleteRows,
    updateRow,
    reloadGrid,
    redirectRef,
}) => {
    /*if (itemAction.on_callback == 'hide') {
        setHide(true);
    }*/
    if (itemAction.on_callback == 'hide_row') {
        deleteRows([itemAction.attr.bx_grid_action_data, id]);
        return;
    }
    if (itemAction.on_callback == 'redirect') {
        // Only the `callback` button renders <Redirect>; other action types have no ref.
        redirectRef?.current?.redirect(itemAction.redirect_url);
        return;
    }
    if (itemAction.on_callback == 'refresh_rows') {
        const rows = extractGridRowsFromResponse(response);
        // Display API returns cells as `{ type, value|data }`. Some actions
        // return raw DB fields in `data.rows` — those need a full reload.
        if (rows.length > 0 && rows.every(isProcessedGridRow)) {
            const fallbackId = itemAction.attr?.bx_grid_action_data ?? id;
            rows.forEach((row) => {
                const rowId = row?.id ?? fallbackId;
                if (row && rowId != null) {
                    updateRow(rowId, row);
                }
            });
            return;
        }
        reloadGrid();
        return;
    }
    if (itemAction.on_callback == 'refresh') {
        reloadGrid();
        return;
    }

    reloadGrid();
};

/**
 * Handle a manage-menu item (`display_type=callback`): hide control/row or
 * refresh from the menu request URL.
 */
export const applyMenuManageCallback = async ({
    oItem,
    id,
    deleteRows,
    updateRow,
    reloadGrid,
    setHide,
}) => {
    const response = await fetcher('/api.php?r=' + oItem.data.request_url);
    if (oItem.data.on_callback === 'hide') {
        setHide(true);
    } else if (oItem.data.on_callback === 'hide_row') {
        deleteRows([oItem.data.id]);
    } else if (oItem.data.on_callback === 'refresh_row') {
        const row = extractGridRowFromResponse(response);
        if (row && isProcessedGridRow(row)) {
            const rowId = row.id ?? oItem.data.id ?? id;
            if (rowId != null) {
                updateRow(rowId, row);
            }
        } else {
            reloadGrid();
        }
    } else if (oItem.data.on_callback === 'refresh') {
        reloadGrid();
    }
};

/**
 * Credits checkout: grid `checkout` → payment URL → page JSON → center cell
 * content for the checkout modal. Failures surface via Msg (`showMessage`).
 */
export const performCreditsCheckout = async ({
    runGridAction,
    settings,
    selected,
    showMessage,
    openForm,
    t,
}) => {
    const fail = (msg) => {
        showMessage(msg || t('Something went wrong'));
    };

    const response = await runGridAction(
        'checkout',
        '&provider=credits&seller_id=' + settings.query_append.seller_id + '&' + toIdsQuery(selected)
    );

    const checkoutMsg = Array.isArray(response?.data)
        ? response.data.find((item) => item?.type === 'msg')
        : null;
    if (checkoutMsg?.data) {
        fail(typeof checkoutMsg.data === 'string' ? checkoutMsg.data : checkoutMsg.data?.msg || checkoutMsg.data?.message);
        return;
    }

    if (!response?.data?.url) {
        fail(t('Checkout URL not found'));
        return;
    }

    const response2 = await fetcher(response.data.url);
    if (!response2?.data?.url) {
        fail(t('Payment page URL not found'));
        return;
    }

    const response3 = await getPageData(response2.data.url);
    const content = response3?.data?.elements?.cell_center?.[0]?.content;
    if (!content?.length) {
        fail(t('Checkout content not found'));
        return;
    }

    openForm(toGridFormBlock(content));
};
