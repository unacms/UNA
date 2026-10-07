import { createContext, useContext, useRef } from 'react';
import { createStore, useStore } from 'zustand';
import { flattenPagesForUniList } from 'app/lib/browse-query';
import { handleFormModal } from 'app/ui/molecules/dialogs/form-modal';
import {
    applyGridActionCallback,
    applyMenuManageCallback,
    performCreditsCheckout,
    performGridAction,
    resolveActionPageUrl,
    toGridFormBlock,
    toIdsQuery,
} from './actions';

const CLOSED_CONFIRM = { show: false, cb: null };

/** UNA switcher values flip between these pairs. */
const SWITCHER_NEXT = { active: 'hidden', hidden: 'active', 0: '1', 1: '0' };

/** Rewrite rows of every cached page of the grid's infinite query. */
const patchCachedRows = ({ queryClient, queryKey }, mapRows) => {
    if (!queryClient) return;

    queryClient.setQueryData(queryKey, (old) => {
        if (!old?.pages?.length) return old;

        return {
            ...old,
            pages: old.pages.map((page) => ({
                ...page,
                data: mapRows(page.data ?? []),
            })),
        };
    });
};

/**
 * Grid state context. Unlike the app-wide zustand stores in `app/context`,
 * a page can render several grid blocks, so the store is created per provider
 * instead of at module level.
 *
 * Handlers read fresh state via `get()`, so components subscribe to values
 * only — never to whole handler dependency sets.
 */
const createGridStore = (initial) => createStore((set, get) => ({
    /** Column tracks, table width, sortability and `field_id` — see `GridProvider`. */
    ...initial,

    /** Injected from React — see `useGridData`. */
    settings: {},
    queryAppend: {},
    queryClient: null,
    queryKey: [],
    reloadGrid: () => {},
    t: (key) => key,

    // --- rows and selection ------------------------------------------------
    // Rows are not mirrored into the store: delete / switcher toggle write
    // straight into the react-query cache, so the list has a single source of
    // truth and a local patch can never be lost when another page loads.

    /** Set of checked row ids — cells subscribe to `selected.has(id)` only. */
    selected: new Set(),

    /** Current rows across all loaded pages. */
    getRows: () => flattenPagesForUniList(get().queryClient?.getQueryData(get().queryKey)),

    /** Remove rows after delete / hide_row (does not wait for a reload). */
    deleteRows: (idsToRemove) => {
        patchCachedRows(get(), (rows) => rows.filter(
            (item) => !idsToRemove.some((id) => item.id == id)
        ));
    },

    /** Patch one row in the visible list (processed display cells only). */
    updateRow: (rowId, rowData) => {
        if (rowId == null || !rowData) return;

        const next = { ...rowData, id: rowData.id ?? rowId };
        patchCachedRows(get(), (rows) => rows.map((item) => (item.id == rowId ? next : item)));
    },

    toggleSelected: (id) => set((state) => {
        const selected = new Set(state.selected);
        if (!selected.delete(id)) {
            selected.add(id);
        }
        return { selected };
    }),

    getSelectedIds: () => Array.from(get().selected),

    // --- overlays ----------------------------------------------------------
    // Bottom-sheet form, Stripe / form modals, page-in-modal, confirm dialog
    // and message. Actions call the `open*` / `ask*` handlers; `GridModals`
    // renders the state.

    sheetBlock: null,
    formBlock: null,
    stripeCheckout: null,
    pageData: false,
    confirm: CLOSED_CONFIRM,
    message: null,

    openSheet: (sheetBlock) => set({ sheetBlock }),
    openForm: (formBlock) => set({ formBlock }),
    openStripe: (stripeCheckout) => set({ stripeCheckout }),
    closeStripe: () => set({ stripeCheckout: null }),
    setPageData: (pageData) => set({ pageData }),

    /** Form-modal close/reload: empty value means "done, refresh grid". */
    handlePageModalData: (value) => {
        if (!value) {
            set({ pageData: false });
            get().reloadGrid();
            return;
        }
        set({ pageData: value });
    },

    /** `GridModals` dismisses the bottom sheet when `sheetBlock` clears. */
    closeAll: () => set({ sheetBlock: null, formBlock: null }),

    /** After a form in a sheet/modal submits: close overlays and reload the grid. */
    closeAndReload: () => {
        setTimeout(() => {
            get().closeAll();
            get().reloadGrid();
        }, 100);
    },

    /** Destructive actions run `cb` only after the user confirms. */
    askConfirm: (cb) => set({ confirm: { show: true, cb } }),

    cancelConfirm: () => set({ confirm: CLOSED_CONFIRM }),

    acceptConfirm: () => {
        const { cb } = get().confirm;
        set({ confirm: CLOSED_CONFIRM });
        cb?.();
    },

    showMessage: (message) => set({ message }),
    hideMessage: () => set({ message: null }),

    // --- shared API --------------------------------------------------------

    /** Named TemplServiceGrid action (or custom callback URL). */
    runGridAction: async (action, params, callback) => {
        const { settings, queryAppend } = get();
        return await performGridAction({
            object: settings.object,
            queryAppend,
            action,
            params,
            callback,
        });
    },

    /** Stable wrapper so components never subscribe to the injected `reloadGrid`. */
    reload: () => get().reloadGrid(),

    /**
     * Row / independent `type=modal` and MultiAdd menu callbacks: URL-only
     * FormModal, or fetch form JSON (`action` or `callback`) into the sheet.
     */
    openGridModal: async (data) => {
        const { runGridAction, setPageData, handlePageModalData, openSheet } = get();

        const pageUrl = resolveActionPageUrl(data);
        if (pageUrl && !data.action && !data.callback) {
            setPageData('loading');
            await handleFormModal({ link: pageUrl }, null, handlePageModalData);
            return;
        }

        const fetchedData = await runGridAction(data.action, data.params, data.callback);
        const block = toGridFormBlock(fetchedData.data);
        openSheet({
            title: block.content[0]?.title || data.title,
            block,
        });
    },

    // --- bulk actions ------------------------------------------------------
    // UNA `actions.bulk`: calculate, delete, Stripe / credits checkout.
    // Handlers read the current selection from the store, so toolbar buttons
    // stay stable while rows are being checked.

    /** Confirm, then delete checked rows on the server. */
    deleteSelected: () => {
        get().askConfirm(() => {
            const { getSelectedIds, deleteRows, runGridAction } = get();
            const selected = getSelectedIds();
            deleteRows(selected);
            runGridAction('delete', '&' + toIdsQuery(selected));
        });
    },

    /** Bulk `calculate` — show total time from the msg block. */
    calculateSelected: async () => {
        const { getSelectedIds, runGridAction, showMessage } = get();

        const response = await runGridAction('calculate', '&' + toIdsQuery(getSelectedIds()));
        const content = Array.isArray(response?.data) ? response.data : [];
        const msgItem = content.find((item) => item?.type === 'msg');
        if (!msgItem?.data) return;

        showMessage('Calculated time: ' + msgItem.data.total_f);
    },

    /** Bulk checkout: Stripe widget or credits page-in-modal. */
    checkoutSelected: async (type, payment_type) => {
        const { getSelectedIds, settings, openStripe, runGridAction, showMessage, openForm, t } = get();
        const selected = getSelectedIds();

        if (type == 'stripe_v3') {
            openStripe({
                payment_type,
                seller_id: settings.query_append.seller_id,
                items: selected,
            });
        }
        if (type == 'credits') {
            await performCreditsCheckout({
                runGridAction,
                settings,
                selected,
                showMessage,
                openForm,
                t,
            });
        }
    },

    // --- row actions -------------------------------------------------------

    /** Row `type=modal` sheet / FormModal, or `type=object` Stripe checkout. */
    openRowAction: async (data) => {
        if (data.type == 'modal') {
            await get().openGridModal(data);
        }
        if (data.type == 'object') {
            get().openStripe({
                payment_type: data.payment_type,
                seller_id: data.seller_id,
                items: data.items,
            });
        }
    },

    /**
     * Row `callback` button: run the named action, then apply UNA's `on_callback`
     * (hide row, redirect, patch rows or reload). `redirectRef` points at the
     * <Redirect> rendered by that button.
     */
    runRowCallback: async (itemAction, id, redirectRef) => {
        const { runGridAction, deleteRows, updateRow, reload, askConfirm } = get();

        const run = async () => {
            const response = await runGridAction(
                itemAction.name,
                '&ids[]=' + itemAction.attr.bx_grid_action_data
            );
            await applyGridActionCallback({
                itemAction,
                response,
                id,
                deleteRows,
                updateRow,
                reloadGrid: reload,
                redirectRef,
            });
        };

        if (itemAction.confirm == '1') {
            askConfirm(run);
            return;
        }
        await run();
    },

    /** Manage-menu item (`display_type=callback`); `setHide` drops just the control. */
    runMenuCallback: async (oItem, id, setHide) => {
        if (oItem.display_type !== 'callback') return;

        const { deleteRows, updateRow, reload, askConfirm } = get();
        const run = () => applyMenuManageCallback({
            oItem,
            id,
            deleteRows,
            updateRow,
            reloadGrid: reload,
            setHide,
        });

        if (oItem.data.confirm == 1) {
            askConfirm(run);
            return;
        }
        await run();
    },

    /**
     * Enable/disable a row: optimistic immutable patch, then `enable` API + reload.
     *
     * The row is looked up by id, not by position — sorting, a delete or the
     * next loaded page can shift indexes between render and press.
     */
    toggleSwitch: async (id) => {
        const { getRows, updateRow, runGridAction, reloadGrid } = get();

        let bChecked = false;
        const currentItem = getRows().find((item) => item.id == id);
        if (currentItem?.switcher) {
            const nextData = SWITCHER_NEXT[currentItem.switcher.data];
            bChecked = nextData == 'active' || nextData == '1';
            updateRow(id, {
                ...currentItem,
                switcher: { ...currentItem.switcher, data: nextData },
            });
        }

        await runGridAction('enable', '&ids[]=' + id + (bChecked ? '&checked=1' : ''));
        reloadGrid();
    },

    /** Persist drag-reorder via `a=reorder`, then reload. */
    sortRows: (result) => {
        if (!result.destination) return;

        const { getRows, settings, runGridAction, reloadGrid } = get();
        const updatedData = [...getRows()];
        const [removed] = updatedData.splice(result.source.index, 1);
        updatedData.splice(result.destination.index, 0, removed);

        runGridAction('reorder', '&' + updatedData.map((item) => `${settings.object}_row[]=${item.id}`).join('&'));
        reloadGrid();
    },
}));

// --- column layout ---------------------------------------------------------
// Flex-none columns need fixed width/minWidth so the header and every body row
// share the same tracks (content-sized flex columns diverge per row and the
// labels stop lining up).

const CONTROL_COL_STYLE = {
    checkbox: { flexGrow: 0, flexShrink: 0, width: 44, minWidth: 44 },
    order: { flexGrow: 0, flexShrink: 0, width: 36, minWidth: 36 },
    switcher: { flexGrow: 0, flexShrink: 0, width: 64, minWidth: 64 },
    // Fixed track for row actions (right-aligned); header label stays empty.
    actions: { flexGrow: 0, flexShrink: 0, width: 168, minWidth: 168 },
};

/**
 * Short meta columns — fixed track (`flex-none`).
 * Date-ish words match anywhere (`date_added`), money/period only as whole names.
 */
const FLEX_NONE_NAME_RE = /date|time|added|created|changed|^(period|price|amount)$/i;
const META_COL_WIDTH = 108;

const TEXT_COL_MIN_WIDTH = 72;
const ROW_GAP = 8;
const ROW_PAD_X = 16; // px-2 each side

/**
 * Text columns (title, provider, …): flex-auto — share leftover space.
 * Controls / date / actions: flex-none — fixed tracks.
 */
const getColumnStyle = (name) => {
    if (CONTROL_COL_STYLE[name]) {
        return CONTROL_COL_STYLE[name];
    }

    if (FLEX_NONE_NAME_RE.test(name)) {
        return {
            flexGrow: 0,
            flexShrink: 0,
            width: META_COL_WIDTH,
            minWidth: META_COL_WIDTH,
        };
    }

    return {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: TEXT_COL_MIN_WIDTH,
    };
};

/**
 * Normalize UNA header: drop `reports`, and insert an empty `actions` column
 * when row cells have actions but the header omitted that track.
 */
const normalizeGridHeader = (rawHeader, sampleRow) => {
    const cols = (rawHeader || []).filter((item) => item?.name != 'reports');
    const hasActionsCol = cols.some((c) => c?.name === 'actions');
    const rowHasActions =
        !!sampleRow &&
        Object.values(sampleRow).some((cell) => cell?.type === 'actions');

    if (!hasActionsCol && rowHasActions) {
        cols.push({ name: 'actions', title: '' });
    }

    return cols;
};

/**
 * Everything the header and the rows need to lay out columns: track styles,
 * alignment, labels, plus the minimum table width that makes horizontal scroll
 * kick in before columns collapse.
 */
const buildGridColumns = (rawHeader, sampleRow) => {
    const columns = normalizeGridHeader(rawHeader, sampleRow).map((col) => {
        const name = col?.name || '';
        const isActions = name === 'actions';

        return {
            name,
            style: getColumnStyle(name),
            align: isActions ? 'items-end' : 'items-start',
            // Actions keeps a blank label so date/meta columns stay on their tracks;
            // the checkbox column has no label at all.
            label: isActions ? ' ' : col?.title == 'Select' ? '' : col?.title || '',
        };
    });

    const colsMin = columns.reduce(
        (sum, col) => sum + (col.style.minWidth || col.style.width || TEXT_COL_MIN_WIDTH),
        0
    );
    const gaps = Math.max(0, columns.length - 1) * ROW_GAP;

    return {
        columns,
        tableMinWidth: colsMin + gaps + ROW_PAD_X,
        isSortable: columns.some((col) => col.name == 'order'),
    };
};

// --- provider --------------------------------------------------------------

const GridContext = createContext(null);

/**
 * Creates the store for one grid block. Column layout comes from the page JSON
 * and never changes while the block is mounted, so it is computed once here
 * instead of being threaded through the table and every row as props.
 */
export function GridProvider({ data, children }) {
    const storeRef = useRef();
    if (!storeRef.current) {
        storeRef.current = createGridStore({
            ...buildGridColumns(data.header, data.data?.[0]),
            fieldId: data.settings?.field_id,
        });
    }

    return (
        <GridContext.Provider value={storeRef.current}>
            {children}
        </GridContext.Provider>
    );
}

/** Subscribe to a slice of grid state (`useGrid((state) => state.selected)`). */
export function useGrid(selector) {
    const store = useContext(GridContext);
    return useStore(store, selector);
}

/** Raw store handle for `setState` / `getState` outside of render. */
export function useGridApi() {
    return useContext(GridContext);
}
