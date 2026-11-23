/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * AG Grid (Community, MIT) for a grid whose sys_objects_grid.engine is 'ag'.
 * Quartz is the legacy CSS theme: template/css/grid_ag.css restyles it.
 *
 * An engine=ag grid uses the infinite row model: blocks load as the grid is
 * scrolled, there is no pager. A grid whose rows open (expand) uses the client row
 * model and loads all its rows: only that model lets one row grow and moves the rows
 * under it down, the infinite one keeps every row as tall as the first. Managed row dragging needs the client row model,
 * so an order column is an unmanaged drag handle: the drop posts the same
 * reorder action the classic grid posts.
 *
 * Actions, bulk selection and the secret eye go through the BxDolGrid instance
 * kept in glGrids, so Studio scripts that call reload() and processJson()
 * keep working.
 *
 * Cell values: the server (BxBaseGrid::_agCell) flags a text cell 'html' when its
 * value is what the classic grid prints inside the cell. Only such a value is
 * inserted as HTML; every other value is inserted as text.
 */

function BxDolGridAg(oCfg, oBx) {
    this._oCfg = oCfg || {};
    this._oBx = oBx || null;
    this._oApi = null;
    this._sObject = this._oCfg.object;
    this._sFieldId = this._oCfg.field_id;
    this._sWrap = 'bx-grid-wrap-' + this._sObject;
    this._iStart = Number.parseInt(this._oCfg.start, 10) || 0;
    this._iPerPage = Number.parseInt(this._oCfg.per_page, 10) || 10;
    this._iTotal = 0;
    this._sAppliedField = null;
    this._sAppliedDir = null;

    const oBxOpts = this._oCfg.bx || {};
    this._sStartGet = oBxOpts.paginate_get_start || '';
    this._sPerPageGet = oBxOpts.paginate_get_per_page || '';
    this._sFilterGet = oBxOpts.filter_get || 'filter';
    this._sOrderGetField = oBxOpts.order_get_field || 'order_field';
    this._sOrderGetDir = oBxOpts.order_get_dir || 'order_dir';
    this._oExpand = this._oCfg.expand || null;
    this._oExpanded = {};
    this._oChildren = {};
    this._oItemsBx = null;
    this._iRowHeight = 52;
    this._iItemHeight = 44;
    // From tablets up every row is a card: the row is taller by the gap between the cards, and no
    // column is pinned, so a card is one piece. Phones keep the plain table.
    this._bCards = !!globalThis.matchMedia?.('(min-width: 768px)').matches;
    this._iRowGap = this._bCards ? 8 : 0;
    this._bClient = !!this._oExpand;

    this._adoptBx();
    this._mount();
    this._select2Filters();
}

BxDolGridAg.prototype._adoptBx = function () {
    const oBx = this._oBx;
    if (!oBx)
        return;

    oBx.reload = (iStart) => {
        if (iStart !== undefined && iStart !== null && iStart !== '') {
            this._iStart = Number.parseInt(iStart, 10) || 0;
            oBx._oOptions.start = this._iStart;
        }
        this.refresh();
    };

    oBx.setFilter = (sFilter, isReload) => {
        if (oBx._sFilter == sFilter)
            return;

        oBx._sFilter = sFilter;
        if (isReload) {
            this._iStart = 0;
            oBx._oOptions.start = 0;
            this.refresh();
        }
    };

    // A response that carries new HTML would replace this grid. Refresh the rows instead.
    oBx.setOnReload(() => this.refresh());

    const fProcess = oBx.processJson;
    oBx.processJson = (...aArgs) => {
        fProcess.call(oBx, ...aArgs);

        // A switch only flips its own control. Reloading the grid would jump the scroll.
        if (aArgs[0] && aArgs[1] === 'reorder')
            this.refresh();
    };
};

/**
 * In Studio the header's filter selects are select2 fields, as Studio's other selects (the page
 * builder's page picker). select2 fires the select's own change, so the filter's onchange still
 * runs. On a site page they stay the form's own selects, as in the classic grid.
 */
BxDolGridAg.prototype._select2Filters = function () {
    if (!Number(this._oCfg.select2) || typeof jQuery === 'undefined' || typeof jQuery.fn.select2 !== 'function')
        return;

    jQuery('#' + this._sWrap + ' .bx-grid-header-controls-filter select').each(function () {
        const $s = jQuery(this);
        if ($s.hasClass('select2-hidden-accessible'))
            return;
        $s.select2({
            width: 'resolve',
            minimumResultsForSearch: 10,
            templateSelection: (d) => d.text
        });
    });
};

BxDolGridAg.prototype._mount = function () {
    const eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid || typeof bxAgGrid === 'undefined' || typeof bxAgGrid.createGrid !== 'function')
        return;

    if (this._bCards)
        eGrid.classList.add('bx-grid-ag-cards');

    const oOptions = {
        theme: 'legacy',
        columnDefs: this._columns(),
        context: { ag: this },
        getRowId: (p) => {
            const mixedId = p.data?.[this._sFieldId];
            return mixedId != null && mixedId !== '' ? String(mixedId) : 'bx-ag-row';
        },
        suppressMovableColumns: true,
        suppressCellFocus: true,
        headerHeight: 44,
        rowHeight: this._iRowHeight + this._iRowGap,
        rowDragManaged: false,
        overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">' + this._esc(this._oCfg.empty || '') + '</span>',
        onGridReady: (e) => {
            this._oApi = e.api;
            if (this._bClient)
                this._loadClient();
        },
        onSelectionChanged: () => this._syncChecks(),
        onModelUpdated: () => this._fitHeight()
    };
    // With no cell focus the grid leaves its row checkboxes out of the Tab order. Put them back and
    // name them, once the rows that just came into view are drawn.
    const fNameChecks = () => setTimeout(() => this._nameChecks(eGrid), 0);

    if (this._bClient) {
        oOptions.rowModelType = 'clientSide';
        oOptions.rowData = [];
        // The server sorts: a click on a header loads the rows again in the new order.
        oOptions.onSortChanged = () => this._loadClient();
        oOptions.getRowHeight = (p) => this._rowHeight(p?.data);
    } else {
        oOptions.rowModelType = 'infinite';
        oOptions.cacheBlockSize = this._iPerPage;
        oOptions.infiniteInitialRowCount = this._iPerPage;
        oOptions.datasource = {
            getRows: (params) => this._getRows(params)
        };
    }

    if (this._hasKind('order'))
        oOptions.onRowDragEnd = (e) => this._onRowDragEnd(e);

    if (this._hasKind('checkbox')) {
        oOptions.rowSelection = {
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: false,
            enableClickSelection: false,
            // A row the classic grid gives a disabled checkbox (_isCheckboxDisabled) cannot be selected here either.
            isRowSelectable: (node) => !Number(node.data?.checkbox?.disabled)
        };
        oOptions.selectionColumnDef = {
            width: 52,
            maxWidth: 64,
            pinned: this._bCards ? null : 'left',
            sortable: false,
            resizable: false,
            suppressHeaderMenuButton: true,
            cellClass: 'bx-grid-ag-select'
        };
        oOptions.onViewportChanged = fNameChecks;
        oOptions.onModelUpdated = () => {
            this._fitHeight();
            fNameChecks();
        };
    }

    // Before the grid's own key handlers, which are on elements inside this one.
    eGrid.addEventListener('keydown', (ev) => this._onTab(ev, eGrid), true);

    this._oApi = bxAgGrid.createGrid(eGrid, oOptions);
};

/**
 * Tab inside the grid. Cells take no focus (suppressCellFocus), so the grid has no cell to move
 * Tab to: from a header it walks the headers in a circle, and from a switch or a button in a row
 * it does not move at all. So Tab is taken before the grid sees it:
 * - from a header, to the first control in the rows (a checkbox, a switch, a link, a button);
 * - between the controls of the rows, in the order they are shown;
 * - from the last control out of the grid, and with Shift from the first one back to the headers.
 * Arrow keys between headers, Enter to sort and Shift+Tab from a header stay the grid's own.
 */
BxDolGridAg.prototype._onTab = function (ev, eGrid) {
    if (ev.key !== 'Tab' || ev.altKey || ev.ctrlKey || ev.metaKey)
        return;

    const eFrom = ev.target;
    const bHeader = !!eFrom.closest?.('.ag-header');
    if ((!bHeader && !eFrom.closest?.('.ag-row')) || (bHeader && ev.shiftKey))
        return;

    const aControls = this._rowStops(eGrid);
    const iFrom = aControls.indexOf(eFrom);
    let eTo = null;
    if (bHeader)
        eTo = aControls[0];
    else if (ev.shiftKey)
        eTo = iFrom > 0 ? aControls[iFrom - 1] : eGrid.querySelector('.ag-header-cell');
    else
        eTo = aControls[iFrom + 1];

    // Past the last control: the first one after the grid.
    if (!eTo && !ev.shiftKey)
        eTo = this._tabStops([document.body]).find((e) => !eGrid.contains(e) && (eGrid.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));

    if (!eTo)
        return;

    ev.stopPropagation();
    ev.preventDefault();
    eTo.focus();
};

/**
 * The controls in the rows in the order they are shown: by row, then by column, then what an
 * opened row holds under its cells. The grid keeps rows and cells in the DOM in the order it made
 * them, not the order on screen (ensureDomOrder would fix that, but it re-inserts rows as they
 * scroll, and a re-inserted control loses the focus).
 */
BxDolGridAg.prototype._rowStops = function (eGrid) {
    const fRow = (e) => Number(e.getAttribute('row-index')) || 0;
    const fCol = (e) => Number(e.closest('.ag-cell')?.getAttribute('aria-colindex')) || Infinity;

    const a = [];
    for (const eRow of Array.from(eGrid.querySelectorAll('.ag-row')).sort((x, y) => fRow(x) - fRow(y)))
        a.push(...this._tabStops([eRow]).sort((x, y) => fCol(x) - fCol(y)));
    return a;
};

/**
 * What Tab stops at inside these elements, in document order.
 */
BxDolGridAg.prototype._tabStops = function (aIn) {
    const sStops = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]';
    const a = [];
    for (const eIn of aIn) {
        for (const e of eIn.querySelectorAll(sStops)) {
            if (e.tabIndex >= 0 && !e.disabled && e.getClientRects().length && !e.closest('.ag-tab-guard, [hidden], [inert]'))
                a.push(e);
        }
    }
    return a;
};

BxDolGridAg.prototype._hasKind = function (sKind) {
    return (this._oCfg.columns || []).some((oCol) => oCol.kind === sKind);
};

/**
 * Row checkboxes: reachable with Tab, and named for a screen reader as the classic grid names them.
 */
BxDolGridAg.prototype._nameChecks = function (eGrid) {
    const sLabel = this._oCfg.text_select || '';
    for (const eInput of eGrid.querySelectorAll('.ag-selection-checkbox input[type="checkbox"]')) {
        eInput.tabIndex = 0;
        if (sLabel && !eInput.getAttribute('aria-label'))
            eInput.setAttribute('aria-label', sLabel);
    }
};

BxDolGridAg.prototype._columns = function () {
    const aCols = [];

    if (this._oExpand)
        aCols.push(this._columnExpand());

    for (const oCol of this._oCfg.columns || []) {
        if (oCol.kind === 'checkbox')
            continue;

        aCols.push(oCol.kind === 'order' ? this._columnOrder(oCol) : this._columnData(oCol));
    }

    return aCols;
};

/**
 * What the narrow, fixed columns share: the arrow that opens a row and the drag handle.
 */
BxDolGridAg.prototype._columnFixed = function (sName, oMore) {
    return {
        colId: sName,
        field: sName,
        headerName: '',
        flex: 0,
        pinned: this._bCards ? null : 'left',
        sortable: false,
        resizable: false,
        suppressHeaderMenuButton: true,
        cellDataType: false,
        cellRenderer: BxDolGridAgCell,
        ...oMore
    };
};

BxDolGridAg.prototype._columnExpand = function () {
    return this._columnFixed('_bx_expand', {
        width: 46,
        minWidth: 46,
        maxWidth: 46,
        lockPosition: 'left',
        cellClass: 'bx-grid-ag-expand',
        cellStyle: { paddingLeft: '0px', paddingRight: '0px' },
        valueGetter: () => '',
        bxExpand: true
    });
};

BxDolGridAg.prototype._columnOrder = function (oCol) {
    return this._columnFixed(oCol.name, {
        headerName: '',
        width: 52,
        maxWidth: 64,
        rowDrag: true
    });
};

BxDolGridAg.prototype._columnData = function (oCol) {
    const sSortField = this._oCfg.sorting_field || '';
    const sSortDir = String(this._oCfg.sorting_dir || '').toLowerCase() === 'desc' ? 'desc' : 'asc';

    const oDef = {
        colId: oCol.name,
        field: oCol.name,
        headerName: oCol.title || '',
        sortable: Number.parseInt(oCol.sortable, 10) === 1,
        filter: false,
        suppressHeaderMenuButton: true,
        cellDataType: false,
        cellRenderer: BxDolGridAgCell,
        // The server sorts. The grid only shows the arrow.
        comparator: () => 0
    };

    if (sSortField && sSortField === oCol.name && oDef.sortable)
        oDef.sort = sSortDir;

    if (!oCol.controls)
        return { ...oDef, ...this._size(oCol.width) };

    if (oCol.name === 'actions')
        return { ...oDef, width: 168, minWidth: 96, flex: 0 };

    return { ...oDef, width: 88, minWidth: 64, flex: 0 };
};

BxDolGridAg.prototype._size = function (sWidth) {
    const s = String(sWidth || '').trim();
    let m = /^(\d+(?:\.\d+)?)%$/.exec(s);
    if (m)
        return { flex: Number.parseFloat(m[1]) || 1, minWidth: 80 };

    m = /^(\d+(?:\.\d+)?)px$/.exec(s);
    if (m)
        return { width: Number.parseFloat(m[1]), flex: 0, minWidth: 48 };

    return { flex: 1, minWidth: 80 };
};

BxDolGridAg.prototype.refresh = function () {
    if (this._bClient)
        this._loadClient();
    else
        this._oApi?.purgeInfiniteCache?.();
};

/**
 * Client row model: every row of the grid (with the filter and the sort of now), asked for
 * 500 at a time until the total the server reports is here. Opened rows stay open.
 */
BxDolGridAg.prototype._loadClient = function () {
    if (!this._oApi)
        return;

    const oCol = (this._oApi.getColumnState?.() || []).find((c) => c.sort);
    const oSort = oCol ? { field: oCol.colId, dir: oCol.sort === 'desc' ? 'DESC' : 'ASC' } : { field: '', dir: 'ASC' };
    const iPer = 500;
    const aAll = [];
    const iLoad = (this._iLoad || 0) + 1;
    this._iLoad = iLoad;

    const fLoad = (iStart) => {
        this._fetch(iStart, iPer, oSort, (o) => {
            if (iLoad !== this._iLoad)
                return;
            const a = o.data || [];
            aAll.push(...a);
            if (a.length && aAll.length < (Number.parseInt(o.total, 10) || 0)) {
                fLoad(aAll.length);
                return;
            }
            this._setTotal(o);
            this._oApi.setGridOption('rowData', aAll);
            this._oApi.resetRowHeights?.();
            this._reloadExpanded();
        });
    };
    fLoad(0);
};

BxDolGridAg.prototype._getRows = function (params) {
    const iStart = params.startRow;
    const iPer = params.endRow - params.startRow;
    const oSort = { field: '', dir: 'ASC' };
    if (params.sortModel?.length) {
        oSort.field = params.sortModel[0].colId;
        oSort.dir = params.sortModel[0].sort === 'desc' ? 'DESC' : 'ASC';
    }

    this._fetch(iStart, iPer, oSort, (o) => {
        this._setTotal(o);
        // lastRow is stored as the row count, so this is the server total.
        params.successCallback(o.data || [], typeof o.total === 'number' ? o.total : 0);
    }, () => params.failCallback());
};

/**
 * One GET of rows. cache: false adds jQuery's own timestamp, so a browser never answers from its cache.
 */
BxDolGridAg.prototype._getJson = function (oQuery) {
    return jQuery.ajax({
        url: sUrlRoot + 'grid.php',
        data: oQuery,
        dataType: 'json',
        cache: false
    });
};

BxDolGridAg.prototype._fetch = function (iStart, iPerPage, oSort, fOk, fFail) {
    this._applySort(oSort);
    this._iStart = iStart;
    if (this._oBx)
        this._oBx._oOptions.start = iStart;

    this._getJson(this._query(iStart, iPerPage))
        .done((o) => fOk?.(o || {}))
        .fail(() => fFail?.());
};

BxDolGridAg.prototype._query = function (iStart, iPerPage) {
    const o = { o: this._sObject, a: 'data_ag' };
    const oAppend = this._oBx ? this._oBx._oQueryAppend : null;
    if (oAppend && typeof oAppend === 'object') {
        for (const sKey of Object.keys(oAppend))
            o[sKey] = oAppend[sKey];
    }

    o[this._sFilterGet] = this._oBx?._sFilter || '';
    if (this._sAppliedField) {
        o[this._sOrderGetField] = this._sAppliedField;
        o[this._sOrderGetDir] = this._sAppliedDir || 'ASC';
    }
    o[this._sStartGet || 'start'] = iStart;
    o[this._sPerPageGet || 'per_page'] = iPerPage;
    if (this._oBx?._sCsrfToken)
        o.csrf_token = this._oBx._sCsrfToken;
    return o;
};

BxDolGridAg.prototype._applySort = function (oSort) {
    this._sAppliedField = oSort?.field || '';
    this._sAppliedDir = oSort?.dir || 'ASC';
    if (!this._oBx)
        return;
    this._oBx._sOrderField = this._sAppliedField;
    this._oBx._sOrderDir = this._sAppliedDir;
};

BxDolGridAg.prototype._setTotal = function (o) {
    this._iTotal = Number.parseInt(o.total, 10) || 0;
    if (!o.total_f)
        return;
    const e = document.querySelector('#' + this._sWrap + ' .bx-grid-header-controls-counter-value');
    if (e)
        e.textContent = o.total_f;
};

BxDolGridAg.prototype._rowHeight = function (oData) {
    const iRow = this._iRowHeight + this._iRowGap;
    if (!this._oExpand || !oData)
        return iRow;
    const sId = String(oData[this._sFieldId]);
    if (!this._oExpanded[sId])
        return iRow;
    const n = (this._oChildren[sId] || []).length || 1;
    return iRow + this._itemsHeadHeight() + n * this._iItemHeight + 8;
};

/**
 * An opened row shows a caption line over its items when the items come with their columns.
 */
BxDolGridAg.prototype._itemsHeadHeight = function () {
    return this._oExpand?.columns?.length ? 36 : 0;
};

/**
 * Width of one column of an opened row's items, as the grid sizes its own columns: a share for
 * a percent, a fixed width for pixels and for the narrow controls (switches, actions).
 */
BxDolGridAg.prototype._itemFlex = function (oCol) {
    if (oCol.kind === 'order')
        return '0 0 52px';
    if (Number(oCol.controls))
        return oCol.name === 'actions' ? '0 0 168px' : '0 0 88px';

    const s = String(oCol.width || '').trim();
    let m = /^(\d+(?:\.\d+)?)%$/.exec(s);
    if (m)
        return (Number.parseFloat(m[1]) || 1) + ' 1 0';
    m = /^(\d+(?:\.\d+)?)px$/.exec(s);
    if (m)
        return '0 0 ' + Number.parseFloat(m[1]) + 'px';
    return '1 1 0';
};

BxDolGridAg.prototype._layoutRow = function (node) {
    if (!node)
        return;
    node.setRowHeight?.(this._rowHeight(node.data));
    if (!this._oApi)
        return;
    this._oApi.onRowHeightChanged();
    this._oApi.redrawRows({ rowNodes: [node] });
    this._fitHeight();
};

/**
 * The grid is as tall as its rows, up to the max-height of the CSS, and scrolls inside that.
 * A few rows then leave no empty space above the bulk actions.
 */
BxDolGridAg.prototype._fitHeight = function () {
    const eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid || !this._oApi?.getDisplayedRowCount)
        return;

    let iMax = Number.parseFloat(globalThis.getComputedStyle(eGrid).maxHeight);
    if (Number.isNaN(iMax))
        iMax = Infinity;

    const iCount = this._oApi.getDisplayedRowCount();
    if (!iCount)
        return;

    let iHeight = 44 + 2;
    for (let i = 0; i < iCount && iHeight < iMax; i++)
        iHeight += this._oApi.getDisplayedRowAtIndex(i)?.rowHeight || this._iRowHeight + this._iRowGap;

    eGrid.style.height = Math.ceil(Math.min(iHeight, iMax)) + 'px';
};

BxDolGridAg.prototype.toggleExpand = function (sId, node) {
    if (!this._oExpand || !node?.data)
        return;

    if (this._oExpanded[sId]) {
        delete this._oExpanded[sId];
        this._layoutRow(node);
        return;
    }

    const oMeta = node.data._meta || {};
    if (!oMeta[this._oExpand.set])
        return;

    if (this._oChildren[sId]) {
        this._oExpanded[sId] = true;
        this._layoutRow(node);
        return;
    }

    this._fetchItems(oMeta, (aRows) => {
        this._oChildren[sId] = aRows || [];
        this._oExpanded[sId] = true;
        this._layoutRow(node);
    });
};

/**
 * The items of an opened row, all of them: asked for 500 at a time (what one request may
 * return), until the total the server reports is here.
 */
BxDolGridAg.prototype._fetchItems = function (oMeta, fDone) {
    const iPer = 500;
    const aAll = [];
    const fLoad = (iStart) => {
        this._getJson(this._itemsQuery(oMeta, iStart, iPer))
            .done((o) => {
                const a = o?.data || [];
                aAll.push(...a);
                if (a.length && aAll.length < (Number.parseInt(o?.total, 10) || 0))
                    fLoad(aAll.length);
                else
                    fDone(aAll);
            })
            .fail(() => fDone(aAll));
    };
    fLoad(0);
};

BxDolGridAg.prototype._itemsQuery = function (oMeta, iStart, iPer) {
    const oCfg = this._oExpand;
    const o = { o: oCfg.object, a: 'data_ag' };
    o.set = oMeta[oCfg.set] || '';
    o.module = oMeta[oCfg.module] || '';
    o.start = iStart;
    o.per_page = iPer;
    if (this._oBx?._sCsrfToken)
        o.csrf_token = this._oBx._sCsrfToken;
    return o;
};

BxDolGridAg.prototype._itemsBx = function (oMeta) {
    const oCfg = this._oExpand;
    if (!this._oItemsBx) {
        const oBxOpts = this._oCfg.bx || {};
        this._oItemsBx = new BxDolGrid(oCfg.object, {
            csrf_token: oBxOpts.csrf_token || '',
            sortable: 0,
            sorting: 0,
            filter: '',
            filter_get: 'filter',
            order_field: '',
            order_dir: 'ASC',
            order_get_field: 'order_field',
            order_get_dir: 'order_dir',
            query_append: {},
            popup_options: oBxOpts.popup_options || {},
            confirm_messages: {},
            text_search_input: '',
            columns: 1
        });
        this._oItemsBx.setOnReload(() => this._reloadExpanded());

        // The items' forms and popups answer to glGrids[<items grid>], as on the items' own page.
        // This page has no such grid, so the one made here stands in for it.
        if (globalThis.glGrids && globalThis.glGrids[oCfg.object] === undefined)
            globalThis.glGrids[oCfg.object] = this._oItemsBx;
    }
    this._oItemsBx._oQueryAppend = {
        set: oMeta[oCfg.set] || '',
        module: oMeta[oCfg.module] || ''
    };
    return this._oItemsBx;
};

BxDolGridAg.prototype._reloadExpanded = function () {
    if (!this._oApi)
        return;
    this._oApi.forEachNode((n) => {
        if (!n.data)
            return;
        const sId = String(n.data[this._sFieldId]);
        if (!this._oExpanded[sId])
            return;
        this._fetchItems(n.data._meta || {}, (aRows) => {
            this._oChildren[sId] = aRows || [];
            this._layoutRow(n);
        });
    });
};

/**
 * Ids of the loaded rows in the order they are shown, or null when the rows are not one
 * unbroken list from the first row (a block is still loading): a reorder then would save a
 * wrong order.
 */
BxDolGridAg.prototype._loadedIds = function () {
    const sField = this._sFieldId;
    const a = [];
    this._oApi.forEachNode((n) => {
        if (n.data?.[sField] != null && n.rowIndex != null)
            a.push({ i: n.rowIndex, id: String(n.data[sField]) });
    });
    a.sort((x, y) => x.i - y.i);

    if (!a.length || a.some((o, k) => o.i !== k))
        return null;

    return a.map((o) => o.id);
};

BxDolGridAg.prototype._reorderQuery = function (sObject, aIds) {
    const sKey = encodeURIComponent(sObject + '_row[]');
    return aIds.map((sId) => sKey + '=' + encodeURIComponent(sId)).join('&');
};

BxDolGridAg.prototype._onRowDragEnd = function (e) {
    if (!this._oBx || !this._oApi || e?.node?.rowIndex == null || e.overIndex == null || e.overIndex < 0)
        return;

    // Under a search or a sorted column the rows shown are not the whole list in its saved order:
    // numbering them 1, 2, 3 would move them ahead of the rows not shown.
    if (this._oBx._sFilter || this._sAppliedField)
        return;

    const iFrom = e.node.rowIndex;
    const iTo = e.overIndex;
    if (iFrom === iTo)
        return;

    const aIds = this._loadedIds();
    if (!aIds || iFrom < 0 || iFrom >= aIds.length || iTo >= aIds.length)
        return;

    const sId = aIds.splice(iFrom, 1)[0];
    aIds.splice(iTo, 0, sId);

    this._oBx.action('reorder', {}, this._reorderQuery(this._sObject, aIds), true);
};

BxDolGridAg.prototype._syncChecks = function () {
    const e = document.getElementById('bx-grid-table-' + this._sObject);
    if (!e || !this._oApi?.getSelectedRows)
        return;

    const sName = this._sObject + '_check';
    const sField = this._sFieldId;
    const aRows = this._oApi.getSelectedRows() || [];
    document.getElementById(this._sWrap)?.classList.toggle('bx-grid-ag-has-selection', aRows.length > 0);
    this._syncBulk(aRows.length);
    e.textContent = '';
    for (const oRow of aRows) {
        if (oRow?.[sField] == null)
            continue;
        const oInput = document.createElement('input');
        oInput.type = 'checkbox';
        oInput.name = sName;
        oInput.checked = true;
        oInput.value = oRow[sField];
        e.appendChild(oInput);
    }
};

/**
 * The bulk bar sits between the filters and the rows and shows only while rows are selected:
 * how many, the bulk actions, and a button that clears the selection.
 */
BxDolGridAg.prototype._syncBulk = function (iCount) {
    const eBar = document.getElementById('bx-grid-ag-bulk-' + this._sObject);
    if (!eBar)
        return;

    const eCount = eBar.querySelector('.bx-grid-ag-bulk-count');
    if (eCount)
        eCount.textContent = String(this._oCfg.text_selected || '{0}').replace('{0}', iCount);

    const bShow = iCount > 0;
    if (eBar.hidden === !bShow)
        return;
    eBar.hidden = !bShow;

    if (!eBar._bxBound) {
        eBar._bxBound = true;
        eBar.querySelector('.bx-grid-ag-bulk-clear')?.addEventListener('click', () => this._oApi?.deselectAll?.());
    }

    this._fitHeight();
};

BxDolGridAg.prototype._esc = function (s) {
    const oMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(s ?? '').replace(/[&<>"']/g, (c) => oMap[c]);
};

/**
 * A link target from row data: http(s), mailto, tel or a path of this site. Anything else,
 * a javascript: URL for one, is not used.
 */
BxDolGridAg.safeUrl = function (sUrl) {
    const s = String(sUrl ?? '').trim();
    if (s === '')
        return '';
    if (/^(?:https?:|mailto:|tel:)/i.test(s))
        return s;
    return /^[a-z][a-z0-9+.-]*:/i.test(s) ? '' : s;
};

BxDolGridAg.prototype._saveChildOrder = function (ePanel, oMeta, sMenuId) {
    const oCfg = this._oExpand;
    if (!oCfg)
        return;
    const sField = oCfg.field_id || 'id';
    const aIds = [];
    for (const eRow of ePanel.querySelectorAll('.bx-grid-ag-item')) {
        if (eRow.dataset.id)
            aIds.push(eRow.dataset.id);
    }
    if (aIds.length < 2)
        return;

    const oById = {};
    for (const oItem of this._oChildren[sMenuId] || []) {
        if (oItem?.[sField] != null)
            oById[String(oItem[sField])] = oItem;
    }
    this._oChildren[sMenuId] = aIds.filter((sId) => oById[sId]).map((sId) => oById[sId]);

    this._itemsBx(oMeta).action('reorder', {}, this._reorderQuery(oCfg.object, aIds), true);
};

/**
 * Cell renderer of every column. AG Grid makes one per cell and calls init().
 */
function BxDolGridAgCell() {
    this.eGui = null;
    this._eItems = null;
    this._eRow = null;
}

BxDolGridAgCell.prototype.init = function (params) {
    this.eGui = document.createElement('div');
    this.eGui.className = 'bx-grid-ag-cell';

    const oAg = params.context?.ag;
    if (!oAg)
        return;

    let cell = params.value;
    if ((cell == null || cell === '') && params.data)
        cell = params.data[params.colDef.field];

    // The name cell is an HTML link. Drawing it replaces the cell contents, so the arrow goes last,
    // and the expand column has nothing else to draw.
    this._draw(this.eGui, cell, params, oAg);

    if (params.colDef?.bxExpand) {
        this._chevron(params, oAg);
        this._childItems(params, oAg);
    }
};

BxDolGridAgCell.prototype.destroy = function () {
    this._eItems?.remove();
    this._eRow?.classList.remove('bx-grid-ag-row-open');
    this._eItems = null;
    this._eRow = null;
};

BxDolGridAgCell.prototype.getGui = function () {
    return this.eGui;
};

BxDolGridAgCell.prototype.refresh = function () {
    return false;
};

BxDolGridAgCell.prototype._chevron = function (params, oAg) {
    if (!oAg._oExpand || !params.data)
        return;

    const sId = String(params.data[oAg._sFieldId]);
    const bOpen = !!oAg._oExpanded[sId];
    const eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = 'bx-grid-ag-chevron' + (bOpen ? ' is-open' : '');
    eBtn.setAttribute('aria-expanded', bOpen ? 'true' : 'false');
    eBtn.setAttribute('aria-label', oAg._oCfg.text_expand || '');
    eBtn.title = oAg._oCfg.text_expand || '';
    eBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    eBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        oAg.toggleExpand(sId, params.node);
    });
    this.eGui.prepend(eBtn);
};

BxDolGridAgCell.prototype._childItems = function (params, oAg) {
    if (!params.data || !params.eGridCell)
        return;
    const sId = String(params.data[oAg._sFieldId]);
    if (!oAg._oExpanded[sId])
        return;

    const eRow = params.eGridCell.closest('.ag-row');
    if (!eRow)
        return;

    const aItems = oAg._oChildren[sId] || [];
    const oMeta = params.data._meta || {};
    const ePanel = document.createElement('div');
    ePanel.className = 'bx-grid-ag-items';
    ePanel.style.top = (oAg._iRowGap / 2 + oAg._iRowHeight) + 'px';

    const aCols = oAg._oExpand?.columns || [];
    if (aCols.length) {
        const eHead = document.createElement('div');
        eHead.className = 'bx-grid-ag-item is-columns bx-grid-ag-items-head';
        for (const oCol of aCols) {
            const eCell = document.createElement('span');
            eCell.className = 'bx-grid-ag-item-cell';
            eCell.style.flex = oAg._itemFlex(oCol);
            eCell.textContent = oCol.kind === 'order' ? '' : (oCol.title || '');
            eHead.appendChild(eCell);
        }
        ePanel.appendChild(eHead);
    }

    if (aItems.length) {
        for (const oItem of aItems)
            ePanel.appendChild(this._childRow(oItem, oAg, oMeta));
    } else {
        const eEmpty = document.createElement('div');
        eEmpty.className = 'bx-grid-ag-item bx-grid-ag-item-empty';
        eEmpty.textContent = oAg._oCfg.empty || '';
        ePanel.appendChild(eEmpty);
    }

    eRow.classList.add('bx-grid-ag-row-open');
    eRow.appendChild(ePanel);
    this._eItems = ePanel;
    this._eRow = eRow;
    this._bindChildDrag(ePanel, oAg, oMeta, sId);
};

BxDolGridAgCell.prototype._childRow = function (oItem, oAg, oMeta) {
    const sField = oAg._oExpand.field_id || 'id';
    const sId = oItem?.[sField] == null ? '' : String(oItem[sField]);
    const eRow = document.createElement('div');
    eRow.className = 'bx-grid-ag-item';
    eRow.dataset.id = sId;

    const eHandle = document.createElement('div');
    eHandle.className = 'bx-grid-drag-handle';
    eHandle.title = oAg._oCfg.text_order || '';
    const eGrip = document.createElement('i');
    eGrip.className = 'sys-icon grip-vertical';
    eGrip.setAttribute('aria-hidden', 'true');
    eHandle.appendChild(eGrip);
    eRow.appendChild(eHandle);

    // The items belong to another grid object: their actions go through its own BxDolGrid, with the menu's set.
    const oReal = oAg._itemsBx(oMeta);
    const oQuery = {
        set: oMeta[oAg._oExpand.set] || '',
        module: oMeta[oAg._oExpand.module] || ''
    };
    const oBx = {
        actionWithId: (...aArgs) => {
            oReal._oQueryAppend = { set: oQuery.set, module: oQuery.module };
            return oReal.actionWithId(...aArgs);
        }
    };
    const oChild = { _oBx: oBx, _sFieldId: sField, _oCfg: oAg._oCfg };

    // Every column of the items grid, in its order, under the captions of the line above.
    const aCols = oAg._oExpand?.columns || [];
    if (aCols.length) {
        eRow.textContent = '';
        eRow.classList.add('is-columns');
        for (const oCol of aCols) {
            if (oCol.kind === 'order') {
                eHandle.style.flex = oAg._itemFlex(oCol);
                eRow.appendChild(eHandle);
                continue;
            }
            const eCell = document.createElement('span');
            eCell.className = 'bx-grid-ag-item-cell' + (Number(oCol.controls) ? ' is-controls' : '');
            eCell.style.flex = oAg._itemFlex(oCol);
            this._draw(eCell, oItem[oCol.name], { data: oItem, colDef: { field: oCol.name, headerName: oCol.title || '' } }, oChild);
            eRow.appendChild(eCell);
        }
        return eRow;
    }

    for (const sSwitch of ['switcher', 'switcher_api']) {
        if (oItem[sSwitch]?.type === 'switcher')
            this._switch(eRow, oItem[sSwitch], { data: oItem, colDef: {} }, oChild);
    }

    const eTitle = document.createElement('span');
    eTitle.className = 'bx-grid-ag-item-title';
    const oTitle = oItem.title_system || {};
    this._text(eTitle, oTitle.value ?? '', oAg, !!oTitle.html);
    eRow.appendChild(eTitle);

    if (oItem.actions?.type === 'actions') {
        const eActs = document.createElement('span');
        eActs.className = 'bx-grid-ag-item-actions';
        this._actions(eActs, oItem.actions.data, { data: oItem }, oChild);
        eRow.appendChild(eActs);
    }

    return eRow;
};

BxDolGridAgCell.prototype._bindChildDrag = function (ePanel, oAg, oMeta, sMenuId) {
    let eDrag = null;
    for (const eRow of ePanel.querySelectorAll('.bx-grid-ag-item')) {
        const eHandle = eRow.querySelector('.bx-grid-drag-handle');
        if (!eHandle)
            continue;

        eHandle.addEventListener('mousedown', () => eRow.setAttribute('draggable', 'true'));
        eRow.addEventListener('dragstart', (ev) => {
            eDrag = eRow;
            eRow.classList.add('is-dragging');
            if (ev.dataTransfer) {
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.setData('text/plain', eRow.dataset.id || '');
            }
            ev.stopPropagation();
        });
        eRow.addEventListener('dragover', (ev) => {
            if (!eDrag || eDrag === eRow)
                return;
            ev.preventDefault();
            const r = eRow.getBoundingClientRect();
            if (ev.clientY > r.top + r.height / 2)
                eRow.after(eDrag);
            else
                eRow.before(eDrag);
        });
        eRow.addEventListener('dragend', () => {
            eRow.classList.remove('is-dragging');
            eRow.removeAttribute('draggable');
            if (eDrag) {
                eDrag = null;
                oAg._saveChildOrder(ePanel, oMeta, sMenuId);
            }
        });
    }
};

BxDolGridAgCell.prototype._draw = function (eGui, cell, params, oAg) {
    if (cell == null || cell === '')
        return;

    if (typeof cell !== 'object') {
        this._text(eGui, cell, oAg, false);
        return;
    }

    switch (cell.type || 'text') {
        case 'text':
            this._text(eGui, cell.value ?? '', oAg, !!cell.html);
            break;
        case 'price':
            eGui.textContent = this._pair(cell.value, 'value', 'currency');
            break;
        case 'period':
            eGui.textContent = this._pair(cell.value, 'period', 'unit');
            break;
        case 'time':
        case 'datetime':
            eGui.textContent = this._when(cell.data, cell.type === 'datetime');
            break;
        case 'link':
            this._link(eGui, cell.data || {});
            break;
        case 'switcher':
            this._switch(eGui, cell, params, oAg);
            break;
        case 'profile':
            this._profile(eGui, cell.data || {});
            break;
        case 'actions':
            this._actions(eGui, cell.data, params, oAg);
            break;
        case 'secret':
            this._secret(eGui, cell, params, oAg);
            break;
        case 'order':
        case 'checkbox':
            break;
        default:
            this._other(eGui, cell, oAg);
            break;
    }
};

/**
 * A cell type this script does not know is shown as its text, never as HTML.
 */
BxDolGridAgCell.prototype._other = function (eGui, cell, oAg) {
    if (typeof cell.value === 'string' || typeof cell.value === 'number')
        this._text(eGui, cell.value, oAg, false);
    else if (typeof cell.data === 'string')
        this._text(eGui, cell.data, oAg, false);
};

/**
 * bHtml: the server flagged the value as what the classic grid prints inside the cell (escaped
 * text, or the markup of the grid's own cell method). Anything else is text.
 */
BxDolGridAgCell.prototype._text = function (eGui, mixed, oAg, bHtml) {
    const e = document.createElement('span');
    e.className = 'bx-grid-ag-text';
    eGui.appendChild(e);

    if (!bHtml) {
        e.textContent = String(mixed ?? '');
        e.title = e.textContent;
        return;
    }

    e.innerHTML = String(mixed ?? '');
    // A column cuts long text with an ellipsis: plain text is there in full when pointed at.
    if (!e.firstElementChild)
        e.title = e.textContent;
    if (!e.firstElementChild || !globalThis.jQuery)
        return;

    if (jQuery.fn.bxProcessHtml)
        jQuery(e).bxProcessHtml();
    oAg._oBx?._bindActionsSingle?.(jQuery(e));
};

BxDolGridAgCell.prototype._pair = function (v, sA, sB) {
    if (v && typeof v === 'object')
        return [v[sA], v[sB]].filter((m) => m != null && m !== '').join(' ');

    return String(v ?? '');
};

BxDolGridAgCell.prototype._when = function (nStamp, bTime) {
    const n = Number(nStamp);
    if (!n)
        return '';
    const d = new Date(n * 1000);
    if (Number.isNaN(d.getTime()))
        return '';
    return bTime ? d.toLocaleString() : d.toLocaleDateString();
};

BxDolGridAgCell.prototype._link = function (eGui, oLink) {
    const sUrl = BxDolGridAg.safeUrl(oLink.url);
    const e = document.createElement(sUrl ? 'a' : 'span');
    if (sUrl)
        e.setAttribute('href', sUrl);
    e.textContent = oLink.text || '';
    eGui.appendChild(e);
};

BxDolGridAgCell.prototype._switch = function (eGui, cell, params, oAg) {
    // 'on' is the classic grid's own answer (_isSwitcherOn). Older data has only the field's value.
    const bOn = cell.on == null ? (cell.data == 1 || cell.data === 'active') : Number(cell.on) === 1;
    const eCont = document.createElement('div');
    eCont.className = 'bx-switcher-cont relative ' + (bOn ? 'on' : 'off');

    const eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = 'relative inline-flex flex-shrink-0 h-6 w-11 ring-1 ring-gray-300 dark:ring-gray-700 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-400';
    eBtn.setAttribute('role', 'switch');
    eBtn.setAttribute('aria-checked', bOn ? 'true' : 'false');
    // The name the classic grid gives the switch: what it does and the row's title.
    const sLabel = cell.label || params.colDef.headerName || '';
    if (sLabel) {
        eBtn.setAttribute('aria-label', sLabel);
        eBtn.title = sLabel;
    }

    const eKnob = document.createElement('span');
    eKnob.setAttribute('aria-hidden', 'true');
    eKnob.className = 'inline-block h-5 w-5 rounded-full shadow transform ring-0 transition ease-in-out duration-200 pointer-events-none';
    eBtn.appendChild(eKnob);
    eCont.appendChild(eBtn);

    const sId = params.data ? params.data[oAg._sFieldId] : '';
    const sAction = cell.action || 'enable';
    eBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const bNext = eCont.classList.contains('off');
        eCont.classList.toggle('on', bNext);
        eCont.classList.toggle('off', !bNext);
        eBtn.setAttribute('aria-checked', bNext ? 'true' : 'false');
        // The row keeps its data while the grid redraws it (scrolled away and back, opened, closed):
        // the new state goes there too, or the switch would come back as it was loaded.
        cell.on = bNext ? 1 : 0;
        this._syncRowActions(eCont);
        oAg._oBx?.actionWithId(sId, sAction, { checked: bNext ? 1 : 0 }, '', false, 0);
    });

    eGui.appendChild(eCont);
};

/**
 * The classic grid greys a row's actions while every switch of the row is off, and brings them
 * back when one is turned on. The same here, for the actions that follow the row's state.
 */
BxDolGridAgCell.prototype._syncRowActions = function (eSwitch) {
    const eRow = eSwitch.closest('.bx-grid-ag-item, .ag-row');
    if (!eRow)
        return;

    // An opened menu row holds its items' rows too: only this row's own controls count.
    const fOwn = (e) => e.closest('.bx-grid-ag-item, .ag-row') === eRow;
    const bOn = Array.from(eRow.querySelectorAll('.bx-switcher-cont')).filter(fOwn).some((e) => e.classList.contains('on'));
    for (const eBtn of eRow.querySelectorAll('button[bx_grid_action_single]:not([bx_grid_permanent_state])')) {
        if (fOwn(eBtn))
            this._disable(eBtn, !bOn);
    }
};

BxDolGridAgCell.prototype._disable = function (eBtn, bDisabled) {
    eBtn.classList.toggle('bx-btn-disabled', bDisabled);
    if (bDisabled)
        eBtn.setAttribute('aria-disabled', 'true');
    else
        eBtn.removeAttribute('aria-disabled');
};

BxDolGridAgCell.prototype._profile = function (eGui, d) {
    const sUrl = BxDolGridAg.safeUrl(d.url);
    const e = document.createElement(sUrl ? 'a' : 'span');
    e.className = 'bx-grid-ag-profile';
    if (sUrl)
        e.setAttribute('href', sUrl);
    const sAvatar = BxDolGridAg.safeUrl(d.url_avatar);
    if (sAvatar) {
        const eImg = document.createElement('img');
        eImg.src = sAvatar;
        eImg.alt = '';
        e.appendChild(eImg);
    }
    e.appendChild(document.createTextNode(d.display_name || ''));
    eGui.appendChild(e);
};

BxDolGridAgCell.prototype._actions = function (eGui, aActions, params, oAg) {
    if (!aActions?.length)
        return;

    eGui.classList.add('bx-grid-ag-actions');
    const sId = params.data ? params.data[oAg._sFieldId] : '';
    for (const oAction of aActions) {
        if (oAction && typeof oAction === 'object' && oAction.name)
            eGui.appendChild(this._action(oAction, sId, oAg));
    }
};

/**
 * One row action as the classic grid's button: its icon and title, the bx_grid_* attributes
 * BxDolGrid reads, and the disabled look of an action the row does not allow now.
 */
BxDolGridAgCell.prototype._action = function (oAction, sId, oAg) {
    const oAttr = oAction.attr && typeof oAction.attr === 'object' ? oAction.attr : {};
    const eBtn = this._actionButton(oAction, oAttr, sId);

    // A settings button carries the classic onclick that opens its menu. Calling the action
    // instead would skip that menu. The attribute comes from the grid's own action definition.
    const sOnClick = oAttr.onclick ? String(oAttr.onclick) : '';
    const sName = oAction.name;
    const iConfirm = oAction.confirm ? 1 : 0;

    // Added before the onclick attribute, so it runs first and can stop a disabled button's onclick.
    eBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (eBtn.classList.contains('bx-btn-disabled')) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            return;
        }
        if (sOnClick)
            return;

        ev.preventDefault();
        oAg._oBx?.actionWithId(sId, sName, {}, '', false, iConfirm);
    });

    if (sOnClick)
        eBtn.setAttribute('onclick', sOnClick);

    return eBtn;
};

/**
 * The button itself: label, icon, the bx_grid_* attributes and the disabled look.
 */
BxDolGridAgCell.prototype._actionButton = function (oAction, oAttr, sId) {
    const eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = 'bx-btn bx-btn-small bx-def-margin-thd';
    const sLabel = oAction.title || oAction.label || '';
    if (sLabel) {
        eBtn.title = sLabel;
        eBtn.setAttribute('aria-label', sLabel);
    }
    if (oAction.icon)
        this._actionIcon(eBtn, oAction.icon);
    if (!Number.parseInt(oAction.icon_only, 10) && oAction.title) {
        const eLabel = document.createElement('u');
        eLabel.textContent = oAction.title;
        eBtn.appendChild(eLabel);
    }

    for (const sKeep of ['bx_grid_action_single', 'bx_grid_action_data', 'bx_grid_action_confirm', 'bx_grid_action_reset_paginate', 'bx_grid_permanent_state', 'bx-popup-id']) {
        if (oAttr[sKeep] != null && oAttr[sKeep] !== '')
            eBtn.setAttribute(sKeep, oAttr[sKeep]);
    }
    if (!eBtn.getAttribute('bx_grid_action_data') && sId !== '')
        eBtn.setAttribute('bx_grid_action_data', sId);

    if (Number(oAction.disabled))
        this._disable(eBtn, true);

    return eBtn;
};

BxDolGridAgCell.prototype._actionIcon = function (eBtn, sIcon) {
    const s = String(sIcon || '');
    if (/<svg[\s>]/i.test(s)) {
        const eSvg = this._svgNode(s);
        if (eSvg)
            eBtn.appendChild(eSvg);
        return;
    }

    const sClass = s.replace(/[^\w -]/g, '').trim();
    if (!sClass)
        return;
    const eIcon = document.createElement('i');
    eIcon.className = 'sys-icon ' + sClass;
    eIcon.setAttribute('aria-hidden', 'true');
    eBtn.appendChild(eIcon);
};

/**
 * An icon given as SVG markup is rebuilt from a short list of shapes and attributes, so
 * nothing that runs (a script, an event handler, a link) can come in with it.
 */
BxDolGridAgCell.prototype._svgNode = function (sMarkup) {
    const eSrc = new DOMParser().parseFromString(String(sMarkup), 'text/html').querySelector('svg');
    if (!eSrc)
        return null;

    const eSvg = this._svgCopy(eSrc);
    if (!eSvg)
        return null;
    eSvg.setAttribute('class', 'sys-icon sys-icon-svg');
    eSvg.setAttribute('aria-hidden', 'true');
    return eSvg;
};

BxDolGridAgCell.prototype._svgCopy = function (eFrom) {
    const oTags = new Set(['svg', 'path', 'circle', 'rect', 'g', 'line', 'polyline', 'polygon', 'ellipse', 'title']);
    const oAttrs = new Set([
        'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
        'd', 'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'rx', 'ry', 'points', 'transform',
        'xmlns', 'fill-rule', 'clip-rule', 'opacity'
    ]);

    const sTag = (eFrom.tagName || '').toLowerCase();
    if (!oTags.has(sTag))
        return null;

    const e = document.createElementNS('http://www.w3.org/2000/svg', sTag);
    for (const oAttr of eFrom.attributes) {
        if (oAttrs.has(oAttr.name) && !/javascript:|url\s*\(/i.test(oAttr.value))
            e.setAttribute(oAttr.name, oAttr.value);
    }
    for (const eNode of eFrom.children) {
        const eChild = this._svgCopy(eNode);
        if (eChild)
            e.appendChild(eChild);
    }
    return e;
};

BxDolGridAgCell.prototype._secret = function (eGui, cell, params, oAg) {
    const sMasked = typeof cell.value === 'string' ? cell.value : '';
    const eWrap = document.createElement('div');
    eWrap.className = 'bx-grid-secret';

    const eVal = document.createElement('span');
    eVal.className = 'bx-grid-secret-value';
    eVal.dataset.masked = sMasked;
    eVal.textContent = sMasked;
    eWrap.appendChild(eVal);

    const sRowId = params.data ? params.data[oAg._sFieldId] : '';
    const sField = params.colDef.field || '';
    const eToggle = document.createElement('button');
    eToggle.type = 'button';
    eToggle.className = 'bx-grid-secret-toggle';
    // The title is the button's name: BxDolGrid changes it to "Hide" while the value is shown.
    eToggle.title = oAg._oCfg.text_reveal || '';
    eToggle.setAttribute('bx_grid_secret_id', sRowId);
    eToggle.setAttribute('bx_grid_secret_field', sField);
    const eIcon = document.createElement('i');
    eIcon.className = 'sys-icon eye';
    eIcon.setAttribute('aria-hidden', 'true');
    eToggle.appendChild(eIcon);

    eToggle.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (!oAg._oBx)
            return;
        if (eWrap.classList.contains('bx-grid-secret-shown'))
            oAg._oBx.hideSecret(jQuery(eWrap));
        else
            oAg._oBx.revealSecret(sRowId, sField);
    });

    eWrap.appendChild(eToggle);
    eGui.appendChild(eWrap);
};
