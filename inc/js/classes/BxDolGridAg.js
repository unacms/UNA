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
    // A second level: an opened row's item that opens onto items of its own (a form's display onto its fields),
    // keyed by the row's id and the item's id (_key2).
    this._oExpanded2 = {};
    this._oChildren2 = {};
    this._oChildBx = {};
    this._iItemHeight = 44;
    this._iRowGap = 0;
    this._bClient = !!this._oExpand;
    // Rows or cards: the viewer's choice (_sView, kept in the browser, one for every grid), else rows from tablets up
    // and cards on phones, as the window's width changes.
    this._sViewKey = 'bx-grid-ag-view';
    this._sView = this._readView();
    this._oWide = globalThis.matchMedia?.('(min-width: 768px)') || null;
    this._setLayout();

    this._adoptBx();
    this._searchField();
    this._mount();
    this._select2Filters();
    this._bindFilterLoading();
    this._bindBulk();
    this._cardSort();
    this._bindView();
}

/**
 * From tablets up no column is pinned and the cells have more room (_bWide, bx-grid-ag-cards). In the cards view
 * (_bCardView, bx-grid-ag-phone) every row is a card that shows the row's columns as lines, with no column header. A card
 * does not open onto other rows (Navigation > Menus): its name leads to them.
 */
BxDolGridAg.prototype._setLayout = function () {
    this._bWide = !!this._oWide?.matches;
    this._bCardView = this._sView ? this._sView === 'cards' : !this._bWide;
    this._iRowHeight = this._bCardView ? this._cardHeight() : 52;
};

BxDolGridAg.prototype._readView = function () {
    try {
        const s = globalThis.localStorage?.getItem(this._sViewKey) || '';
        return s === 'rows' || s === 'cards' ? s : '';
    } catch (e) {
        return '';
    }
};

BxDolGridAg.prototype._saveView = function () {
    try {
        if (this._sView)
            globalThis.localStorage?.setItem(this._sViewKey, this._sView);
        else
            globalThis.localStorage?.removeItem(this._sViewKey);
    } catch (e) {
        // A browser that keeps nothing keeps the choice until the page is left.
    }
};

/**
 * The Rows / Cards buttons in the header. A choice that is what this width shows anyway is no choice: the grid
 * follows the width again. Otherwise it stays, at any width, until the other button is pressed.
 */
BxDolGridAg.prototype._bindView = function () {
    const aBtns = Array.from(document.querySelectorAll('#' + this._sWrap + ' .bx-grid-ag-view-btn'));
    for (const eBtn of aBtns) {
        eBtn.addEventListener('click', () => {
            const sWant = eBtn.getAttribute('data-bx-view');
            this._sView = sWant === (this._oWide?.matches ? 'rows' : 'cards') ? '' : sWant;
            this._saveView();
            this._relayout();
            // Every other grid on the page follows: the choice is one for all of them.
            for (const oOther of Object.values(globalThis.glGridsAg || {})) {
                if (oOther !== this && oOther?._readView) {
                    oOther._sView = this._sView;
                    oOther._relayout();
                }
            }
        });
    }

    this._oWide?.addEventListener?.('change', () => this._relayout());
    this._syncView();
};

BxDolGridAg.prototype._syncView = function () {
    for (const eBtn of document.querySelectorAll('#' + this._sWrap + ' .bx-grid-ag-view-btn')) {
        const bOn = eBtn.getAttribute('data-bx-view') === (this._bCardView ? 'cards' : 'rows');
        eBtn.setAttribute('aria-pressed', bOn ? 'true' : 'false');
        eBtn.classList.toggle('bx-btn-primary', bOn);
    }
};

/**
 * Draws the grid again when the rows / cards choice or the width asks for another layout. The rows are asked for
 * again; the filter and the sort stay.
 */
BxDolGridAg.prototype._relayout = function () {
    const bWasCards = this._bWide;
    const bWasPhone = this._bCardView;
    this._setLayout();
    this._syncView();
    if (bWasCards === this._bWide && bWasPhone === this._bCardView)
        return;

    const eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid)
        return;

    this._oApi?.destroy?.();
    this._oApi = null;
    eGrid.classList.remove('bx-grid-ag-cards', 'bx-grid-ag-phone');
    eGrid.style.height = '';
    eGrid.textContent = '';
    this._mount();
    this._cardSort();
};

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
 * The classic script puts the whole filter the grid opens with into the search field. A filter may carry more than
 * the search phrase (a Studio grid's module): the field shows the phrase the server names ('search' of the config),
 * or its "Search..." text when there is none, which the classic script puts back when the field is left empty.
 */
BxDolGridAg.prototype._searchField = function () {
    const oBx = this._oBx;
    if (!oBx || this._oCfg.search === undefined || this._oCfg.search === oBx._sFilter)
        return;

    const sText = this._oCfg.bx?.text_search_input || '';
    oBx._sSearchInputText = sText;

    const eSearch = document.getElementById('bx-grid-search-' + this._sObject);
    if (eSearch)
        eSearch.value = this._oCfg.search !== '' ? this._oCfg.search : sText;
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

    eGrid.classList.toggle('bx-grid-ag-cards', this._bWide);
    eGrid.classList.toggle('bx-grid-ag-phone', this._bCardView);

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
        // A row does not light up under the pointer: only its links and buttons do.
        suppressRowHoverHighlight: true,
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

    if (this._bCardView) {
        oOptions.columnDefs = [{ colId: '_bx_card', headerName: '', flex: 1, sortable: false, resizable: false, suppressHeaderMenuButton: true }];
        oOptions.headerHeight = 0;
        oOptions.isFullWidthRow = () => true;
        oOptions.fullWidthCellRenderer = BxDolGridAgCard;
        if (this._hasKind('checkbox'))
            oOptions.rowSelection = {
                mode: 'multiRow',
                checkboxes: false,
                headerCheckbox: false,
                enableClickSelection: false,
                isRowSelectable: (node) => !Number(node.data?.checkbox?.disabled)
            };
    } else if (this._hasKind('checkbox')) {
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
            pinned: this._bWide ? null : 'left',
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

    // Before the grid's own key handlers, which are on elements inside this one. Once: the grid may be drawn again.
    if (!this._bKeysBound) {
        this._bKeysBound = true;
        eGrid.addEventListener('keydown', (ev) => this._onTab(ev, eGrid), true);
    }

    // Nothing shows until the first rows are in and the columns have their widths (_reveal): no empty rows, then
    // columns that move, then the rows. The loading indicator stands over the grid meanwhile.
    eGrid.classList.add('bx-grid-ag-pending');
    this._loading(true);
    clearTimeout(this._iRevealLate);
    this._iRevealLate = setTimeout(() => this._reveal(), 8000);

    this._oApi = bxAgGrid.createGrid(eGrid, oOptions);
    this._watchHug();
};

/**
 * Shows the grid once its first rows are drawn and the columns that fit their content have their widths (_fitHug
 * waits 30ms after the rows come).
 */
BxDolGridAg.prototype._reveal = function () {
    const eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid?.classList.contains('bx-grid-ag-pending'))
        return;

    clearTimeout(this._iRevealSoon);
    this._iRevealSoon = setTimeout(() => {
        clearTimeout(this._iRevealLate);
        eGrid.classList.remove('bx-grid-ag-pending');
        this._loading(false);
    }, 80);
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

/**
 * Cards have no column header to sort by, so a select among the header's filters lists the sortable columns,
 * each way. It is left out when no column sorts.
 */
BxDolGridAg.prototype._cardSort = function () {
    if (this._eSort) {
        const $s = typeof jQuery !== 'undefined' ? jQuery(this._eSort).find('select') : null;
        if ($s?.hasClass('select2-hidden-accessible'))
            $s.select2('destroy');
        this._eSort.remove();
    }
    this._eSort = null;
    if (!this._bCardView)
        return;

    const aCols = (this._oCfg.columns || []).filter((o) => Number(o.sortable) === 1 && o.title);
    const eHost = document.getElementById('bx-grid-cont-' + this._sObject);
    if (!aCols.length || !eHost)
        return;

    // A select of the grid's own filters' kind, among them in the header (above the cards when the grid has none).
    const eWrap = document.createElement('div');
    eWrap.className = 'bx-form-input-wrapper bx-form-input-wrapper-select bx-grid-ag-phone-sort';
    const eSel = document.createElement('select');
    eSel.className = 'bx-def-font-inputs bx-form-input-select';
    eSel.setAttribute('aria-label', this._oCfg.text_sort || '');
    eWrap.appendChild(eSel);

    const fOpt = (sField, sDir, sText) => {
        const e = document.createElement('option');
        e.value = sField + '|' + sDir;
        e.textContent = sText;
        return e;
    };
    eSel.appendChild(fOpt('', 'ASC', this._oCfg.text_sort || ''));
    for (const oCol of aCols) {
        eSel.appendChild(fOpt(oCol.name, 'ASC', oCol.title + ' ↑'));
        eSel.appendChild(fOpt(oCol.name, 'DESC', oCol.title + ' ↓'));
    }

    const sField = this._oCfg.sorting_field || '';
    const sDir = String(this._oCfg.sorting_dir || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    if (this._oCardSort)
        eSel.value = this._oCardSort.field + '|' + this._oCardSort.dir;
    else if (sField && aCols.some((o) => o.name === sField)) {
        this._oCardSort = { field: sField, dir: sDir };
        eSel.value = sField + '|' + sDir;
    }

    const eFilters = document.querySelector('#' + this._sWrap + ' .bx-grid-header-controls-filter');
    if (eFilters)
        eFilters.appendChild(eWrap);
    else
        eHost.parentNode.insertBefore(eWrap, eHost);
    this._eSort = eWrap;

    // select2 sends its change through jQuery, so the select is listened to through jQuery too.
    const fChange = () => {
        const [sName, sWay] = eSel.value.split('|');
        this._oCardSort = sName ? { field: sName, dir: sWay } : null;
        this.refresh();
    };
    if (typeof jQuery !== 'undefined') {
        jQuery(eSel).on('change', fChange);
        if (eFilters && Number(this._oCfg.select2) && typeof jQuery.fn.select2 === 'function')
            jQuery(eSel).select2({ width: 'resolve', minimumResultsForSearch: 10 });
    } else {
        eSel.addEventListener('change', fChange);
    }
};

/**
 * The parts of a card, from the grid's columns: every column is a line of its own, its title on the left and its value
 * on the right (the name, the switches, a count, a date). The first line also holds the row's checkbox on the left; the row's buttons stand in the card's top right corner, outside the lines.
 */
BxDolGridAg.prototype._cardParts = function () {
    const o = { lines: [], actions: null };
    for (const oCol of this._oCfg.columns || []) {
        if (oCol.kind === 'checkbox' || oCol.kind === 'order')
            continue;
        if (oCol.name === 'actions')
            o.actions = oCol;
        else
            o.lines.push(oCol);
    }
    return o;
};

/**
 * A card's height: a line for each column (28px, as tall as a switch), and at least the row's buttons, which stand in
 * the card's top right corner, outside the lines. The 20px are the card's padding.
 */
BxDolGridAg.prototype._iCardLine = 28;

BxDolGridAg.prototype._cardHeight = function () {
    return 20 + Math.max(36, Math.max(1, this._cardParts().lines.length) * this._iCardLine);
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
        pinned: this._bWide ? null : 'left',
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
        rowDrag: true,
        rowDragText: (p) => this._dragText(p?.rowNode?.data)
    });
};

/**
 * What a dragged row's label says: its first text column, as text (the drag handle's own value is an object).
 */
BxDolGridAg.prototype._dragText = function (oData) {
    for (const oCol of this._oCfg.columns || []) {
        if (oCol.hug || oCol.kind)
            continue;

        const m = oData?.[oCol.name];
        const v = String((m && typeof m === 'object' ? (m.value ?? m.data?.text) : m) ?? '');
        // Markup the server flagged is read in an inert document, so nothing in it loads or runs.
        const s = (m?.html ? new DOMParser().parseFromString(v, 'text/html').body.textContent : v).trim();
        if (s)
            return s;
    }

    return '';
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

    if (oCol.hug)
        return { ...oDef, ...this._columnHug(oCol) };

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
        return { flex: Number.parseFloat(m[1]) || 1, minWidth: this._iTextMinWidth };

    m = /^(\d+(?:\.\d+)?)px$/.exec(s);
    if (m)
        return { width: Number.parseFloat(m[1]), flex: 0, minWidth: 48 };

    return { flex: 1, minWidth: this._iTextMinWidth };
};

/**
 * Column widths by what a column shows (BxBaseGrid::_getColumnKind, the 'hug' of a column in the config).
 * A switch, the row's action buttons, a count in its capsule or an icon is as wide as what is in it: it starts at a
 * width that fits its usual content, and _fitHug widens it to its widest drawn cell or its title, so a button never
 * wraps or clips. It never narrows again while the grid is open, so the columns don't jump while rows scroll in.
 * Text columns share what is left (_size), each at least _iTextMinWidth wide, and cut long text with an ellipsis: a
 * narrow grid cuts its text before it pushes the buttons out of sight.
 */
BxDolGridAg.prototype._iTextMinWidth = 72;

BxDolGridAg.prototype._columnHug = function (oCol) {
    const oStart = { switcher: 76, actions: 64, count: 72, icon: 64 };
    return {
        width: oStart[oCol.hug] || 64,
        minWidth: 48,
        flex: 0,
        resizable: false,
        suppressSizeToFit: true,
        cellClass: 'bx-grid-ag-hug',
        headerClass: 'bx-grid-ag-hug'
    };
};

BxDolGridAg.prototype._hugIds = function () {
    return (this._oCfg.columns || []).filter((o) => o.hug && o.hug !== 'checkbox' && o.hug !== 'order').map((o) => o.name);
};

BxDolGridAg.prototype._watchHug = function () {
    const aIds = this._hugIds();
    if (!aIds.length || !this._oApi?.addEventListener)
        return;

    // The cells' own padding is the room around what is in them: only a little more, so a title is not cut by a
    // fraction of a pixel.
    this._oApi.setGridOption?.('autoSizePadding', 4);
    this._oHugWidths = {};
    let iTimer = 0;
    const fFit = () => {
        clearTimeout(iTimer);
        iTimer = setTimeout(() => this._fitHug(aIds), 30);
    };
    for (const sEvent of ['firstDataRendered', 'modelUpdated', 'viewportChanged'])
        this._oApi.addEventListener(sEvent, fFit);
};

BxDolGridAg.prototype._fitHug = function (aIds) {
    const oApi = this._oApi;
    if (!oApi?.autoSizeColumns || oApi.isDestroyed?.())
        return;

    oApi.autoSizeColumns(aIds, false);

    const aKeep = [];
    for (const sId of aIds) {
        const iNow = oApi.getColumn(sId)?.getActualWidth?.() || 0;
        const iWas = this._oHugWidths[sId] || 0;
        if (iNow < iWas)
            aKeep.push({ key: sId, newWidth: iWas });
        else
            this._oHugWidths[sId] = iNow;
    }
    if (!aKeep.length)
        return;

    oApi.setColumnWidths(aKeep);
    // Setting a width back does not share out the room again: the text columns keep the room the narrowed ones left
    // them, and the grid grows wider than its box. Their flex, set again, shares out what is left.
    const aFlex = oApi.getColumns().filter((c) => c.getColDef().flex).map((c) => ({ colId: c.getColId(), flex: c.getColDef().flex }));
    if (aFlex.length)
        oApi.applyColumnState({ state: aFlex });
};

BxDolGridAg.prototype.refresh = function () {
    clearTimeout(this._iLoadingSoon);
    this._loading(true);
    if (this._bClient)
        this._loadClient();
    else
        this._oApi?.purgeInfiniteCache?.();
};

/**
 * The site's loading indicator over the rows, as the classic grid shows it (BxDolGrid.loading), while the grid asks
 * for its rows again: a changed filter, a reload after an action. Rows that load as the grid scrolls don't show it.
 */
BxDolGridAg.prototype._loading = function (bShow) {
    if (!!this._bLoading === !!bShow || typeof bx_loading !== 'function')
        return;

    const eCont = document.getElementById('bx-grid-cont-' + this._sObject);
    if (!eCont)
        return;

    this._bLoading = !!bShow;
    bx_loading(jQuery(eCont), this._bLoading);
};

/**
 * A select in the header answers at once: the page's script may wait before it asks for the rows (Studio's filters
 * wait 500ms, for the search field's sake), and the grid would look deaf meanwhile. When no reload follows (the
 * filter did not change), the indicator goes away by itself.
 */
BxDolGridAg.prototype._bindFilterLoading = function () {
    if (typeof jQuery === 'undefined')
        return;

    jQuery('#' + this._sWrap).on('change.bxGridAgLoading', '.bx-grid-header-controls-filter select', () => {
        this._loading(true);
        clearTimeout(this._iLoadingSoon);
        this._iLoadingSoon = setTimeout(() => this._loading(false), 1500);
    });

    // A select's list is as wide as the select by default; a narrow select (a breadcrumb) would wrap its options.
    jQuery('#' + this._sWrap).on('select2:open.bxGridAg', '.bx-grid-header-controls-filter select', function () {
        jQuery(this).data('select2')?.$dropdown?.addClass('bx-grid-ag-filter-dropdown');
    });
};

/**
 * Client row model: every row of the grid (with the filter and the sort of now), asked for
 * 500 at a time until the total the server reports is here. Opened rows stay open.
 */
BxDolGridAg.prototype._loadClient = function () {
    if (!this._oApi)
        return;

    // Cards have no column headers to sort by: the sort select above them (_cardSort) does it.
    const oCol = (this._oApi.getColumnState?.() || []).find((c) => c.sort);
    let oSort = oCol ? { field: oCol.colId, dir: oCol.sort === 'desc' ? 'DESC' : 'ASC' } : { field: '', dir: 'ASC' };
    if (this._bCardView)
        oSort = this._oCardSort ? { field: this._oCardSort.field, dir: this._oCardSort.dir } : { field: '', dir: 'ASC' };
    const iPer = 500;
    const aAll = [];
    const iLoad = (this._iLoad || 0) + 1;
    this._iLoad = iLoad;

    // A failed request leaves no rows rather than the previous ones, which would pass for the
    // answer to the new filter or sort, and says so.
    const fFail = () => {
        if (iLoad !== this._iLoad)
            return;
        this._loading(false);
        this._reveal();
        this._oApi.setGridOption('rowData', []);
        const sError = typeof _t === 'function' ? _t('_sys_txt_error_occured') : '';
        if (sError && typeof bx_alert === 'function')
            bx_alert(sError);
    };
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
            this._loading(false);
            this._reveal();
        }, fFail);
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
    } else if (this._oCardSort) {
        oSort.field = this._oCardSort.field;
        oSort.dir = this._oCardSort.dir;
    }

    this._fetch(iStart, iPer, oSort, (o) => {
        this._loading(false);
        this._reveal();
        this._setTotal(o);
        // lastRow is stored as the row count, so this is the server total.
        params.successCallback(o.data || [], typeof o.total === 'number' ? o.total : 0);
    }, () => {
        this._loading(false);
        this._reveal();
        params.failCallback();
    });
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
    if (!this._oExpand || !oData || this._bCardView)
        return iRow;
    const sId = String(oData[this._sFieldId]);
    if (!this._oExpanded[sId])
        return iRow;
    const aItems = this._oChildren[sId] || [];
    let iHeight = iRow + this._itemsHeadHeight() + Math.max(1, aItems.length) * this._iItemHeight + 8;

    const oCfg2 = this._oExpand.expand;
    if (oCfg2) {
        const sField = this._oExpand.field_id || '_id';
        for (const oItem of aItems) {
            const sKey = this._key2(sId, oItem?.[sField]);
            if (this._oExpanded2[sKey])
                iHeight += (oCfg2.columns?.length ? 36 : 0) + Math.max(1, (this._oChildren2[sKey] || []).length) * this._iItemHeight;
        }
    }
    return iHeight;
};

BxDolGridAg.prototype._key2 = function (sRowId, mixedItemId) {
    return String(sRowId) + '\n' + String(mixedItemId);
};

/**
 * The _meta key a row must have a value in to open ('require' of an expand config: a menu with no set has no items).
 */
BxDolGridAg.prototype._expandRequire = function (oCfg) {
    return oCfg?.require || '';
};

/**
 * What an expand config sends with its request for items ('params': request parameter => key in the opened row's
 * _meta), with the values of this row.
 */
BxDolGridAg.prototype._expandQuery = function (oCfg, oMeta) {
    const o = {};
    for (const [sParam, sKey] of Object.entries(oCfg?.params || {}))
        o[sParam] = oMeta?.[sKey] || '';
    return o;
};

/**
 * What an opened row's items act through: the BxDolGrid of their own grid (_itemsBx), with the opened row's
 * parameters put in place before each action (a menu's set, a form's object). Links in an item's cells run that
 * grid's own actions too: the parameters are put in place on the way down, before its click handler runs.
 */
BxDolGridAg.prototype._childBx = function (oCfg, oMeta) {
    const oReal = this._itemsBx(oMeta, oCfg);
    const oQuery = this._expandQuery(oCfg, oMeta);
    const fAppend = () => {
        oReal._oQueryAppend = { ...oQuery };
    };

    return {
        actionWithId: (...aArgs) => {
            fAppend();
            return oReal.actionWithId(...aArgs);
        },
        _bindActionsSingle: (jEl) => {
            jEl?.[0]?.addEventListener('click', fAppend, true);
            oReal._bindActionsSingle?.(jEl);
        }
    };
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
    // No limit in the styles (a grid that fills its block, as in Studio): never taller than the window, so the grid
    // keeps drawing only the rows in sight.
    if (Number.isNaN(iMax))
        iMax = globalThis.innerHeight || 640;

    const iCount = this._oApi.getDisplayedRowCount();
    if (!iCount)
        return;

    let iHeight = 44 + 2;
    for (let i = 0; i < iCount && iHeight < iMax; i++)
        iHeight += this._oApi.getDisplayedRowAtIndex(i)?.rowHeight || this._iRowHeight + this._iRowGap;

    eGrid.style.height = Math.ceil(Math.min(iHeight, iMax)) + 'px';
};

BxDolGridAg.prototype.toggleExpand = function (sId, node) {
    if (!this._oExpand || !node?.data || this._bCardView)
        return;

    if (this._oExpanded[sId]) {
        delete this._oExpanded[sId];
        this._layoutRow(node);
        return;
    }

    const oMeta = node.data._meta || {};
    const sRequire = this._expandRequire(this._oExpand);
    if (sRequire && !oMeta[sRequire])
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
BxDolGridAg.prototype._fetchItems = function (oMeta, fDone, oCfg) {
    const iPer = 500;
    const aAll = [];
    const fLoad = (iStart) => {
        this._getJson(this._itemsQuery(oMeta, iStart, iPer, oCfg))
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

BxDolGridAg.prototype._itemsQuery = function (oMeta, iStart, iPer, oCfg) {
    oCfg = oCfg || this._oExpand;
    const o = { o: oCfg.object, a: 'data_ag', ...this._expandQuery(oCfg, oMeta) };
    o.start = iStart;
    o.per_page = iPer;
    if (this._oBx?._sCsrfToken)
        o.csrf_token = this._oBx._sCsrfToken;
    return o;
};

BxDolGridAg.prototype._itemsBx = function (oMeta, oCfg) {
    oCfg = oCfg || this._oExpand;
    if (!this._oChildBx[oCfg.object]) {
        const oBxOpts = this._oCfg.bx || {};
        this._oChildBx[oCfg.object] = new BxDolGrid(oCfg.object, {
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
        this._oChildBx[oCfg.object].setOnReload(() => this._reloadExpanded());

        // The items' forms and popups answer to glGrids[<items grid>], as on the items' own page.
        // This page has no such grid, so the one made here stands in for it.
        if (globalThis.glGrids && globalThis.glGrids[oCfg.object] === undefined)
            globalThis.glGrids[oCfg.object] = this._oChildBx[oCfg.object];
    }
    this._oChildBx[oCfg.object]._oQueryAppend = this._expandQuery(oCfg, oMeta);
    return this._oChildBx[oCfg.object];
};

/**
 * Opens or closes an opened row's item onto its own items (the second level).
 */
BxDolGridAg.prototype.toggleExpand2 = function (sRowId, oItem, node) {
    const oCfg2 = this._oExpand?.expand;
    if (!oCfg2 || !oItem || !node || this._bCardView)
        return;

    const sKey = this._key2(sRowId, oItem[this._oExpand.field_id || '_id']);
    if (this._oExpanded2[sKey]) {
        delete this._oExpanded2[sKey];
        this._layoutRow(node);
        return;
    }

    const oMeta = oItem._meta || {};
    const sRequire = this._expandRequire(oCfg2);
    if (sRequire && !oMeta[sRequire])
        return;

    this._fetchItems(oMeta, (aRows) => {
        this._oChildren2[sKey] = aRows || [];
        this._oExpanded2[sKey] = true;
        this._layoutRow(node);
    }, oCfg2);
};

BxDolGridAg.prototype._reloadExpanded = function () {
    if (!this._oApi || this._bCardView)
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
            this._reloadExpanded2(sId, n);
        });
    });
};

BxDolGridAg.prototype._reloadExpanded2 = function (sRowId, node) {
    const oCfg2 = this._oExpand?.expand;
    if (!oCfg2)
        return;

    const sField = this._oExpand.field_id || '_id';
    for (const oItem of this._oChildren[sRowId] || []) {
        const sKey = this._key2(sRowId, oItem?.[sField]);
        if (!this._oExpanded2[sKey])
            continue;

        this._fetchItems(oItem._meta || {}, (aRows) => {
            this._oChildren2[sKey] = aRows || [];
            this._layoutRow(node);
        }, oCfg2);
    }
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
/**
 * The bulk actions are a menu under the "Actions" button at the right end of the header. The
 * button is always there and shows how many rows are selected. An action picked with no row
 * selected says to select rows first instead of doing nothing.
 */
BxDolGridAg.prototype._syncBulk = function (iCount) {
    this._iSelected = iCount;
    const eCount = document.querySelector('#bx-grid-ag-bulk-' + this._sObject + ' .bx-grid-ag-bulk-count');
    if (eCount)
        eCount.textContent = iCount > 0 ? ' (' + iCount + ')' : '';
};

/**
 * The menu is the site's popup menu (bx_menu_popup_inline opens and closes it). The popup is moved
 * out of the grid when it opens, so the check is on the popup itself: it runs before the grid's
 * own handler on the item and stops an action with no row selected.
 */
BxDolGridAg.prototype._bindBulk = function () {
    const eMenu = document.getElementById('bx-grid-ag-bulk-' + this._sObject + '-menu');
    if (!eMenu)
        return;

    eMenu.addEventListener('click', (ev) => {
        if (!ev.target.closest('[bx_grid_action_bulk]') || this._iSelected > 0)
            return;
        ev.preventDefault();
        ev.stopPropagation();
        jQuery(eMenu).dolPopupHide?.();
        const sText = this._oCfg.text_select_rows || '';
        if (sText && typeof bx_alert === 'function')
            bx_alert(sText);
    }, true);
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
    const sField = oCfg.field_id || '_id';
    const aIds = [];
    for (const eRow of ePanel.querySelectorAll(':scope > .bx-grid-ag-item')) {
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

    this._itemsBx(oMeta, oCfg).action('reorder', {}, this._reorderQuery(oCfg.object, aIds), true);
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

/**
 * The cards view: a row as a card. Every column is a line, its title then its value; the row's checkbox starts the
 * first line and its buttons stand in the card's corner. The values are drawn as the grid's cells.
 */
function BxDolGridAgCard() {}

BxDolGridAgCard.prototype = Object.create(BxDolGridAgCell.prototype);
BxDolGridAgCard.prototype.constructor = BxDolGridAgCard;

BxDolGridAgCard.prototype.init = function (params) {
    this.eGui = document.createElement('div');
    this.eGui.className = 'bx-grid-ag-card';

    const oAg = params.context?.ag;
    const oData = params.data;
    if (!oAg || !oData)
        return;

    const fParams = (oCol) => ({ data: oData, node: params.node, colDef: { field: oCol.name, headerName: oCol.title || '' } });
    const oParts = oAg._cardParts();

    // The first line's start: the checkbox. Cards have no drag handle: the order is changed in the rows view.
    const aLead = [];
    if (oAg._hasKind('checkbox')) {
        const eCheck = document.createElement('input');
        eCheck.type = 'checkbox';
        eCheck.className = 'bx-grid-ag-card-check';
        eCheck.disabled = !!Number(oData.checkbox?.disabled);
        eCheck.checked = !!params.node?.isSelected?.();
        if (oAg._oCfg.text_select)
            eCheck.setAttribute('aria-label', oAg._oCfg.text_select);
        eCheck.addEventListener('change', () => params.node?.setSelected?.(eCheck.checked));
        this._fSelected = () => {
            eCheck.checked = !!params.node.isSelected();
        };
        params.node?.addEventListener?.('rowSelected', this._fSelected);
        this._oNode = params.node;
        aLead.push(eCheck);
    }

    // The row's buttons: in the card's corner, the lines keep clear of them.
    if (oParts.actions) {
        const eActs = document.createElement('div');
        eActs.className = 'bx-grid-ag-card-actions';
        this._draw(eActs, oData[oParts.actions.name], fParams(oParts.actions), oAg);
        this.eGui.appendChild(eActs);
        this.eGui.classList.add('bx-grid-ag-card-has-actions');
    }

    const eLines = document.createElement('dl');
    eLines.className = 'bx-grid-ag-card-fields';
    const aLines = oParts.lines.length ? oParts.lines : [null];
    aLines.forEach((oCol, i) => {
        const eLine = document.createElement('div');
        eLine.className = 'bx-grid-ag-card-field';
        const eCap = document.createElement('dt');
        eCap.className = 'bx-grid-ag-card-caption';
        if (i === 0 && aLead.length)
            eCap.append(...aLead);
        const eCapText = document.createElement('span');
        eCapText.textContent = oCol?.title || '';
        eCap.appendChild(eCapText);
        const eVal = document.createElement('dd');
        eVal.className = 'bx-grid-ag-card-value';
        if (oCol)
            this._draw(eVal, oData[oCol.name], fParams(oCol), oAg);
        eLine.append(eCap, eVal);
        eLines.appendChild(eLine);
    });
    this.eGui.appendChild(eLines);
};

BxDolGridAgCard.prototype.destroy = function () {
    if (this._oNode && this._fSelected)
        this._oNode.removeEventListener?.('rowSelected', this._fSelected);
    this._oNode = null;
    this._fSelected = null;
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
    if (aCols.length)
        ePanel.appendChild(this._itemsHead(aCols, oAg, !!oAg._oExpand.expand));

    if (aItems.length) {
        const sField = oAg._oExpand.field_id || '_id';
        for (const oItem of aItems) {
            ePanel.appendChild(this._childRow(oItem, oAg, oMeta, sId, params.node));

            const sKey = oAg._key2(sId, oItem?.[sField]);
            if (oAg._oExpand.expand && oAg._oExpanded2[sKey])
                ePanel.appendChild(this._childPanel2(oItem, oAg, oAg._oChildren2[sKey] || []));
        }
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

BxDolGridAgCell.prototype._childRow = function (oItem, oAg, oMeta, sRowId, node) {
    const sField = oAg._oExpand.field_id || '_id';
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

    // The items belong to another grid object: their actions go through it.
    const oChild = { _oBx: oAg._childBx(oAg._oExpand, oMeta), _sFieldId: sField, _oCfg: oAg._oCfg };

    // Every column of the items grid, in its order, under the captions of the line above.
    const aCols = oAg._oExpand?.columns || [];
    if (aCols.length) {
        eRow.textContent = '';
        eRow.classList.add('is-columns');
        if (oAg._oExpand.expand)
            eRow.appendChild(this._chevron2(oItem, oAg, sRowId, node));
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

/**
 * The captions over an opened row's items: the titles of their grid's columns, each as wide as its cells below; an
 * empty cell first when the items have arrows of their own.
 */
BxDolGridAgCell.prototype._itemsHead = function (aCols, oAg, bChevron) {
    const eHead = document.createElement('div');
    eHead.className = 'bx-grid-ag-item is-columns bx-grid-ag-items-head';
    if (bChevron) {
        const eSpace = document.createElement('span');
        eSpace.className = 'bx-grid-ag-item-cell bx-grid-ag-item-chevron';
        eHead.appendChild(eSpace);
    }
    for (const oCol of aCols) {
        const eCell = document.createElement('span');
        eCell.className = 'bx-grid-ag-item-cell';
        eCell.style.flex = oAg._itemFlex(oCol);
        eCell.textContent = oCol.kind === 'order' ? '' : (oCol.title || '');
        eHead.appendChild(eCell);
    }
    return eHead;
};

/**
 * The arrow that opens an opened row's item onto its own items (the second level).
 */
BxDolGridAgCell.prototype._chevron2 = function (oItem, oAg, sRowId, node) {
    const eCell = document.createElement('span');
    eCell.className = 'bx-grid-ag-item-cell bx-grid-ag-item-chevron';

    const sKey = oAg._key2(sRowId, oItem?.[oAg._oExpand.field_id || '_id']);
    const sRequire = oAg._expandRequire(oAg._oExpand.expand);
    if (sRequire && !oItem?._meta?.[sRequire])
        return eCell;

    const bOpen = !!oAg._oExpanded2[sKey];
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
        oAg.toggleExpand2(sRowId, oItem, node);
    });
    eCell.appendChild(eBtn);
    return eCell;
};

/**
 * An opened item's own items (the second level): their captions, then a line for each, with the columns of their
 * grid; their actions go through that grid's own BxDolGrid, with the opened item's parameters.
 */
BxDolGridAgCell.prototype._childPanel2 = function (oParent, oAg, aRows) {
    const oCfg2 = oAg._oExpand.expand;
    const oMeta = oParent._meta || {};
    const aCols = oCfg2.columns || [];

    const ePanel = document.createElement('div');
    ePanel.className = 'bx-grid-ag-items2';

    if (aCols.length)
        ePanel.appendChild(this._itemsHead(aCols, oAg, false));

    if (!aRows.length) {
        const eEmpty = document.createElement('div');
        eEmpty.className = 'bx-grid-ag-item bx-grid-ag-item-empty';
        eEmpty.textContent = oAg._oCfg.empty || '';
        ePanel.appendChild(eEmpty);
        return ePanel;
    }

    const sField = oCfg2.field_id || '_id';
    const oChild = { _oBx: oAg._childBx(oCfg2, oMeta), _sFieldId: sField, _oCfg: oAg._oCfg };

    for (const oItem of aRows) {
        const eRow = document.createElement('div');
        eRow.className = 'bx-grid-ag-item is-columns';
        eRow.dataset.id = oItem?.[sField] == null ? '' : String(oItem[sField]);
        for (const oCol of aCols) {
            const eCell = document.createElement('span');
            eCell.className = 'bx-grid-ag-item-cell' + (Number(oCol.controls) ? ' is-controls' : '');
            eCell.style.flex = oAg._itemFlex(oCol);
            // The order is changed on the items' own page: no drag handle here.
            if (oCol.kind !== 'order')
                this._draw(eCell, oItem[oCol.name], { data: oItem, colDef: { field: oCol.name, headerName: oCol.title || '' } }, oChild);
            eRow.appendChild(eCell);
        }
        ePanel.appendChild(eRow);
    }
    return ePanel;
};

BxDolGridAgCell.prototype._bindChildDrag = function (ePanel, oAg, oMeta, sMenuId) {
    let eDrag = null;
    for (const eRow of ePanel.querySelectorAll(':scope > .bx-grid-ag-item')) {
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
    else
        this._fullTextOnHover(e);
    if (!e.firstElementChild || !globalThis.jQuery)
        return;

    if (jQuery.fn.bxProcessHtml)
        jQuery(e).bxProcessHtml();
    oAg._oBx?._bindActionsSingle?.(jQuery(e));
};

/**
 * A name that is a link, cut by its column: pointing at it shows the whole name, instead of the link's own title
 * ("Manage items"), which comes back when the name fits again.
 */
BxDolGridAgCell.prototype._fullTextOnHover = function (e) {
    const eLink = e.childElementCount === 1 && e.firstElementChild.tagName === 'A' && !e.firstElementChild.classList.contains('bx-btn') ? e.firstElementChild : null;
    if (!eLink)
        return;

    const sOwn = eLink.getAttribute('title') || '';
    eLink.addEventListener('mouseenter', () => {
        const bCut = e.scrollWidth > e.clientWidth;
        eLink.title = bCut ? eLink.textContent : sOwn;
    });
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

    // The id the switch acts on: its own when the grid builds one for its switches (a permission's level and
    // action), else the row's.
    const sId = cell.id != null ? cell.id : (params.data ? params.data[oAg._sFieldId] : '');
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

    // An action the grid draws as a link (Help Tours' preview: its href) opens that link, as the classic grid's.
    const sHref = oAttr.href ? BxDolGridAg.safeUrl(String(oAttr.href)) : '';
    if (sHref)
        return this._actionLink(eBtn, sHref, oAttr.target);

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
 * A link action: the button's look, label and icon on a link.
 */
BxDolGridAgCell.prototype._actionLink = function (eBtn, sHref, sTarget) {
    const eLink = document.createElement('a');
    eLink.className = eBtn.className;
    for (const sAttr of ['title', 'aria-label'])
        if (eBtn.hasAttribute(sAttr))
            eLink.setAttribute(sAttr, eBtn.getAttribute(sAttr));
    eLink.append(...eBtn.childNodes);
    eLink.setAttribute('href', sHref);
    if (sTarget === '_blank') {
        eLink.setAttribute('target', '_blank');
        eLink.setAttribute('rel', 'noopener');
    }
    eLink.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (eLink.classList.contains('bx-btn-disabled'))
            ev.preventDefault();
    });
    return eLink;
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
