/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * AG Grid (Community, MIT) for a grid whose sys_objects_grid.engine is 'ag'.
 * Quartz is the legacy CSS theme: template/css/grid_ag.css restyles it.
 *
 * Every engine=ag grid uses the infinite row model: blocks load as the grid is
 * scrolled, there is no pager. Managed row dragging needs the client row model,
 * so an order column is an unmanaged drag handle: the drop posts the same
 * reorder action the classic grid posts.
 *
 * Actions, bulk selection and the secret eye go through the BxDolGrid instance
 * kept in glGrids, so Studio scripts that call reload() and processJson()
 * keep working.
 */

function BxDolGridAg(oCfg, oBx) {
    this._oCfg = oCfg || {};
    this._oBx = oBx || null;
    this._oApi = null;
    this._sObject = oCfg.object;
    this._sFieldId = oCfg.field_id;
    this._sWrap = 'bx-grid-wrap-' + oCfg.object;
    this._iStart = parseInt(oCfg.start, 10) || 0;
    this._iPerPage = parseInt(oCfg.per_page, 10) || 10;
    this._iTotal = 0;
    this._sAppliedField = null;
    this._sAppliedDir = null;

    var oBxOpts = oCfg.bx || {};
    this._sStartGet = oBxOpts.paginate_get_start || '';
    this._sPerPageGet = oBxOpts.paginate_get_per_page || '';
    this._sFilterGet = oBxOpts.filter_get || 'filter';
    this._sOrderGetField = oBxOpts.order_get_field || 'order_field';
    this._sOrderGetDir = oBxOpts.order_get_dir || 'order_dir';
    this._oExpand = oCfg.expand || null;
    this._oExpanded = {};
    this._oChildren = {};
    this._oItemsBx = null;
    this._iRowHeight = 52;
    this._iItemHeight = 44;
    // From tablets up every row is a card: the row is taller by the gap between the cards, and no
    // column is pinned, so a card is one piece. Phones keep the plain table.
    this._bCards = !!(window.matchMedia && window.matchMedia('(min-width: 768px)').matches);
    this._iRowGap = this._bCards ? 8 : 0;

    this._adoptBx();
    this._mount();
    this._select2Filters();
}

BxDolGridAg.prototype._adoptBx = function () {
    if (!this._oBx)
        return;

    var self = this;
    var oBx = this._oBx;

    oBx.reload = function (iStart) {
        if (typeof iStart !== 'undefined' && iStart !== null && iStart !== '') {
            self._iStart = parseInt(iStart, 10) || 0;
            this._oOptions.start = self._iStart;
        }
        self.refresh();
    };

    oBx.setFilter = function (sFilter, isReload) {
        if (this._sFilter == sFilter)
            return;

        this._sFilter = sFilter;
        if (isReload) {
            self._iStart = 0;
            this._oOptions.start = 0;
            self.refresh();
        }
    };

    // A response that carries new HTML would replace this grid. Refresh the rows instead.
    oBx.setOnReload(function () {
        self.refresh();
    });

    var fProcess = oBx.processJson;
    oBx.processJson = function (oData, sAction, isDisableLoading) {
        fProcess.apply(this, arguments);
        if (!oData)
            return;

        // A switch only flips its own control. Reloading the grid would jump the scroll.
        if (sAction === 'reorder')
            self.refresh();
    };
};

/**
 * The header's filter selects are select2 fields, as Studio's other selects (the page builder's
 * page picker). select2 fires the select's own change, so the filter's onchange still runs.
 */
BxDolGridAg.prototype._select2Filters = function () {
    if (typeof jQuery === 'undefined' || typeof jQuery.fn.select2 !== 'function')
        return;

    jQuery('#' + this._sWrap + ' .bx-grid-header-controls-filter select').each(function () {
        var $s = jQuery(this);
        if ($s.hasClass('select2-hidden-accessible'))
            return;
        $s.select2({
            width: 'resolve',
            minimumResultsForSearch: 10,
            templateSelection: function (d) {
                return d.text;
            }
        });
    });
};

BxDolGridAg.prototype._mount = function () {
    var eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid || typeof bxAgGrid === 'undefined' || typeof bxAgGrid.createGrid !== 'function')
        return;

    if (this._bCards)
        eGrid.classList.add('bx-grid-ag-cards');

    var self = this;
    var oOptions = {
        theme: 'legacy',
        columnDefs: this._columns(),
        context: { ag: this },
        getRowId: function (p) {
            if (p.data && p.data[self._sFieldId] != null && p.data[self._sFieldId] !== '')
                return String(p.data[self._sFieldId]);
            return 'bx-ag-row';
        },
        suppressMovableColumns: true,
        suppressCellFocus: true,
        headerHeight: 44,
        rowHeight: this._iRowHeight + this._iRowGap,
        rowModelType: 'infinite',
        cacheBlockSize: this._iPerPage,
        infiniteInitialRowCount: this._iPerPage,
        rowDragManaged: false,
        overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">' + this._esc(this._oCfg.empty || '') + '</span>',
        datasource: {
            getRows: function (params) {
                self._getRows(params);
            }
        },
        onGridReady: function (e) {
            self._oApi = e.api;
        },
        onSelectionChanged: function () {
            self._syncChecks();
        },
        onModelUpdated: function () {
            self._fitHeight();
        }
    };

    if (this._oExpand) {
        oOptions.getRowHeight = function (p) {
            return self._rowHeight(p && p.data);
        };
    }

    if (this._hasOrder()) {
        oOptions.onRowDragEnd = function (e) {
            self._onRowDragEnd(e);
        };
    }

    if (this._hasCheckbox()) {
        oOptions.rowSelection = {
            mode: 'multiRow',
            checkboxes: true,
            headerCheckbox: false,
            enableClickSelection: false
        };
        oOptions.selectionColumnDef = {
            width: 52,
            maxWidth: 64,
            pinned: this._bCards ? null : 'left',
            sortable: false,
            resizable: false,
            suppressHeaderMenuButton: true
        };
    }

    this._oApi = bxAgGrid.createGrid(eGrid, oOptions);
};

BxDolGridAg.prototype._hasCheckbox = function () {
    var a = this._oCfg.columns || [];
    for (var i = 0; i < a.length; i++) {
        if (a[i].kind === 'checkbox')
            return true;
    }
    return false;
};

BxDolGridAg.prototype._hasOrder = function () {
    var a = this._oCfg.columns || [];
    for (var i = 0; i < a.length; i++) {
        if (a[i].kind === 'order')
            return true;
    }
    return false;
};

BxDolGridAg.prototype._columns = function () {
    var aCfg = this._oCfg.columns || [];
    var sSortField = this._oCfg.sorting_field || '';
    var sSortDir = String(this._oCfg.sorting_dir || '').toLowerCase() === 'desc' ? 'desc' : 'asc';
    var bExpand = !!this._oExpand;
    var aCols = [];

    if (bExpand) {
        aCols.push({
            colId: '_bx_expand',
            field: '_bx_expand',
            headerName: '',
            width: 46,
            minWidth: 46,
            maxWidth: 46,
            flex: 0,
            pinned: this._bCards ? null : 'left',
            lockPosition: 'left',
            sortable: false,
            resizable: false,
            suppressHeaderMenuButton: true,
            cellDataType: false,
            cellClass: 'bx-grid-ag-expand',
            cellStyle: { paddingLeft: '0px', paddingRight: '0px' },
            valueGetter: function () {
                return '';
            },
            cellRenderer: BxDolGridAgCell,
            bxExpand: true
        });
    }

    for (var i = 0; i < aCfg.length; i++) {
        var col = aCfg[i];
        if (col.kind === 'checkbox')
            continue;

        if (col.kind === 'order') {
            aCols.push({
                colId: col.name,
                field: col.name,
                headerName: '',
                width: 52,
                maxWidth: 64,
                flex: 0,
                pinned: this._bCards ? null : 'left',
                sortable: false,
                resizable: false,
                suppressHeaderMenuButton: true,
                cellDataType: false,
                rowDrag: true,
                cellRenderer: BxDolGridAgCell
            });
            continue;
        }

        var oCol = {
            colId: col.name,
            field: col.name,
            headerName: col.title || '',
            sortable: parseInt(col.sortable, 10) === 1,
            filter: false,
            suppressHeaderMenuButton: true,
            cellDataType: false,
            comparator: function () {
                return 0;
            }
        };

        if (sSortField && sSortField === col.name && oCol.sortable)
            oCol.sort = sSortDir;

        if (col.controls && col.name === 'actions') {
            oCol.width = 168;
            oCol.minWidth = 96;
            oCol.flex = 0;
            oCol.cellRenderer = BxDolGridAgCell;
        } else if (col.controls) {
            oCol.width = 88;
            oCol.minWidth = 64;
            oCol.flex = 0;
            oCol.cellRenderer = BxDolGridAgCell;
        } else {
            var oSize = this._size(col.width);
            for (var sKey in oSize)
                oCol[sKey] = oSize[sKey];
            oCol.cellRenderer = BxDolGridAgCell;
        }

        aCols.push(oCol);
    }

    return aCols;
};

BxDolGridAg.prototype._size = function (sWidth) {
    var s = String(sWidth || '');
    var m = /^(\d+(?:\.\d+)?)%$/.exec(s.trim());
    if (m)
        return { flex: parseFloat(m[1]) || 1, minWidth: 80 };

    m = /^(\d+(?:\.\d+)?)px$/.exec(s.trim());
    if (m)
        return { width: parseFloat(m[1]), flex: 0, minWidth: 48 };

    return { flex: 1, minWidth: 80 };
};

BxDolGridAg.prototype.refresh = function () {
    if (this._oApi && this._oApi.purgeInfiniteCache)
        this._oApi.purgeInfiniteCache();
};

BxDolGridAg.prototype._getRows = function (params) {
    var self = this;
    var iStart = params.startRow;
    var iPer = params.endRow - params.startRow;
    var oSort = { field: '', dir: 'ASC' };
    if (params.sortModel && params.sortModel.length) {
        oSort.field = params.sortModel[0].colId;
        oSort.dir = params.sortModel[0].sort === 'desc' ? 'DESC' : 'ASC';
    }

    this._fetch(iStart, iPer, oSort, function (o) {
        self._setTotal(o);
        // lastRow is stored as the row count, so this is the server total.
        params.successCallback(o.data || [], typeof o.total === 'number' ? o.total : 0);
    }, function () {
        params.failCallback();
    });
};

BxDolGridAg.prototype._fetch = function (iStart, iPerPage, oSort, fOk, fFail) {
    this._applySort(oSort);
    this._iStart = iStart;
    if (this._oBx)
        this._oBx._oOptions.start = iStart;

    jQuery.getJSON(sUrlRoot + 'grid.php', this._query(iStart, iPerPage))
        .done(function (o) {
            if (typeof fOk === 'function')
                fOk(o || {});
        })
        .fail(function () {
            if (typeof fFail === 'function')
                fFail();
        });
};

BxDolGridAg.prototype._query = function (iStart, iPerPage) {
    var o = { o: this._sObject, a: 'data_ag' };
    var oAppend = this._oBx ? this._oBx._oQueryAppend : null;
    if (oAppend && typeof oAppend === 'object') {
        for (var sKey in oAppend) {
            if (Object.prototype.hasOwnProperty.call(oAppend, sKey))
                o[sKey] = oAppend[sKey];
        }
    }

    o[this._sFilterGet] = this._oBx ? (this._oBx._sFilter || '') : '';
    if (this._sAppliedField) {
        o[this._sOrderGetField] = this._sAppliedField;
        o[this._sOrderGetDir] = this._sAppliedDir || 'ASC';
    }
    o[this._sStartGet || 'start'] = iStart;
    o[this._sPerPageGet || 'per_page'] = iPerPage;
    if (this._oBx && this._oBx._sCsrfToken)
        o.csrf_token = this._oBx._sCsrfToken;
    o._r = Math.random();
    return o;
};

BxDolGridAg.prototype._applySort = function (oSort) {
    oSort = oSort || { field: '', dir: 'ASC' };
    this._sAppliedField = oSort.field || '';
    this._sAppliedDir = oSort.dir || 'ASC';
    if (!this._oBx)
        return;
    this._oBx._sOrderField = this._sAppliedField;
    this._oBx._sOrderDir = this._sAppliedDir;
};

BxDolGridAg.prototype._setTotal = function (o) {
    this._iTotal = parseInt(o.total, 10) || 0;
    if (!o.total_f)
        return;
    var e = document.querySelector('#' + this._sWrap + ' .bx-grid-header-controls-counter-value');
    if (e)
        e.textContent = o.total_f;
};

BxDolGridAg.prototype._rowHeight = function (oData) {
    var iRow = this._iRowHeight + this._iRowGap;
    if (!this._oExpand || !oData)
        return iRow;
    var sId = String(oData[this._sFieldId]);
    if (!this._oExpanded[sId])
        return iRow;
    var a = this._oChildren[sId] || [];
    var n = a.length || 1;
    return iRow + n * this._iItemHeight + 8;
};

BxDolGridAg.prototype._layoutRow = function (node) {
    if (!node)
        return;
    if (node.setRowHeight)
        node.setRowHeight(this._rowHeight(node.data));
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
    var eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid || !this._oApi || !this._oApi.getDisplayedRowCount)
        return;

    var iMax = parseFloat(window.getComputedStyle(eGrid).maxHeight);
    if (isNaN(iMax))
        iMax = Infinity;

    var iCount = this._oApi.getDisplayedRowCount();
    if (!iCount)
        return;

    var iHeight = 44 + 2;
    for (var i = 0; i < iCount && iHeight < iMax; i++) {
        var oNode = this._oApi.getDisplayedRowAtIndex(i);
        iHeight += oNode && oNode.rowHeight ? oNode.rowHeight : this._iRowHeight + this._iRowGap;
    }

    eGrid.style.height = Math.ceil(Math.min(iHeight, iMax)) + 'px';
};

BxDolGridAg.prototype.toggleExpand = function (sId, node) {
    if (!this._oExpand || !node || !node.data)
        return;

    if (this._oExpanded[sId]) {
        delete this._oExpanded[sId];
        this._layoutRow(node);
        return;
    }

    var oMeta = node.data._meta || {};
    if (!oMeta[this._oExpand.set])
        return;

    var self = this;
    if (this._oChildren[sId]) {
        this._oExpanded[sId] = true;
        this._layoutRow(node);
        return;
    }

    this._fetchItems(oMeta, function (aRows) {
        self._oChildren[sId] = aRows || [];
        self._oExpanded[sId] = true;
        self._layoutRow(node);
    });
};

BxDolGridAg.prototype._fetchItems = function (oMeta, fDone) {
    var self = this;
    var fLoad = function (iPer, bAgain) {
        jQuery.getJSON(sUrlRoot + 'grid.php', self._itemsQuery(oMeta, iPer))
            .done(function (o) {
                o = o || {};
                var a = o.data || [];
                var n = parseInt(o.total, 10) || a.length;
                if (bAgain && a.length && a.length < n) {
                    fLoad(n, false);
                    return;
                }
                fDone(a);
            })
            .fail(function () {
                fDone([]);
            });
    };
    fLoad(500, true);
};

BxDolGridAg.prototype._itemsQuery = function (oMeta, iPer) {
    var oCfg = this._oExpand;
    var o = { o: oCfg.object, a: 'data_ag' };
    o.set = oMeta[oCfg.set] || '';
    o.module = oMeta[oCfg.module] || '';
    o.start = 0;
    o.per_page = iPer;
    if (this._oBx && this._oBx._sCsrfToken)
        o.csrf_token = this._oBx._sCsrfToken;
    o._r = Math.random();
    return o;
};

BxDolGridAg.prototype._itemsBx = function (oMeta) {
    var oCfg = this._oExpand;
    if (!this._oItemsBx) {
        var oBxOpts = this._oCfg.bx || {};
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
        var self = this;
        this._oItemsBx.setOnReload(function () {
            self._reloadExpanded();
        });
    }
    this._oItemsBx._oQueryAppend = {
        set: oMeta[oCfg.set] || '',
        module: oMeta[oCfg.module] || ''
    };
    return this._oItemsBx;
};

BxDolGridAg.prototype._reloadExpanded = function () {
    var self = this;
    if (!this._oApi)
        return;
    this._oApi.forEachNode(function (n) {
        if (!n.data)
            return;
        var sId = String(n.data[self._sFieldId]);
        if (!self._oExpanded[sId])
            return;
        self._fetchItems(n.data._meta || {}, function (aRows) {
            self._oChildren[sId] = aRows || [];
            self._layoutRow(n);
        });
    });
};

BxDolGridAg.prototype._onRowDragEnd = function (e) {
    if (!this._oBx || !this._oApi || !e || !e.node || e.node.rowIndex == null || e.overIndex == null || e.overIndex < 0)
        return;
    if (e.node.rowIndex === e.overIndex)
        return;

    var sField = this._sFieldId;
    var a = [];
    this._oApi.forEachNode(function (n) {
        if (n.data && n.data[sField] != null && n.rowIndex != null)
            a.push({ i: n.rowIndex, id: String(n.data[sField]) });
    });
    a.sort(function (x, y) {
        return x.i - y.i;
    });
    if (!a.length || a[0].i !== 0)
        return;
    for (var k = 1; k < a.length; k++) {
        if (a[k].i !== a[k - 1].i + 1)
            return;
    }

    var aIds = [];
    for (var i = 0; i < a.length; i++)
        aIds.push(a[i].id);

    var iFrom = e.node.rowIndex;
    var iTo = e.overIndex;
    if (iFrom < 0 || iFrom >= aIds.length || iTo < 0 || iTo >= aIds.length)
        return;

    var sId = aIds.splice(iFrom, 1)[0];
    aIds.splice(iTo, 0, sId);

    var sKey = encodeURIComponent(this._sObject + '_row[]');
    var s = '';
    for (var j = 0; j < aIds.length; j++)
        s += (s ? '&' : '') + sKey + '=' + encodeURIComponent(aIds[j]);

    this._oBx.action('reorder', {}, s, true);
};

BxDolGridAg.prototype._syncChecks = function () {
    var e = document.getElementById('bx-grid-table-' + this._sObject);
    if (!e || !this._oApi || !this._oApi.getSelectedRows)
        return;

    var sName = this._sObject + '_check';
    var sField = this._sFieldId;
    var aRows = this._oApi.getSelectedRows() || [];
    var eWrap = document.getElementById(this._sWrap);
    if (eWrap)
        eWrap.classList.toggle('bx-grid-ag-has-selection', aRows.length > 0);
    e.textContent = '';
    for (var i = 0; i < aRows.length; i++) {
        if (!aRows[i] || aRows[i][sField] == null)
            continue;
        var oInput = document.createElement('input');
        oInput.type = 'checkbox';
        oInput.name = sName;
        oInput.checked = true;
        oInput.value = aRows[i][sField];
        e.appendChild(oInput);
    }
};

BxDolGridAg.prototype._esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
};

function BxDolGridAgCell() {}

BxDolGridAgCell.prototype.init = function (params) {
    this.eGui = document.createElement('div');
    this.eGui.className = 'bx-grid-ag-cell';
    this._eItems = null;
    this._eRow = null;

    var oAg = params.context && params.context.ag;
    if (!oAg)
        return;

    var cell = params.value;
    if ((cell == null || cell === '') && params.data)
        cell = params.data[params.colDef.field];

    // The name cell is an HTML link. Drawing it replaces the cell contents, so the arrow goes last,
    // and the expand column has nothing else to draw.
    this._draw(this.eGui, cell, params, oAg);

    if (params.colDef && params.colDef.bxExpand) {
        this._chevron(params, oAg);
        this._childItems(params, oAg);
    }
};

BxDolGridAgCell.prototype.destroy = function () {
    if (this._eItems && this._eItems.parentNode)
        this._eItems.parentNode.removeChild(this._eItems);
    if (this._eRow)
        this._eRow.classList.remove('bx-grid-ag-row-open');
    this._eItems = null;
    this._eRow = null;
};

BxDolGridAgCell.prototype._chevron = function (params, oAg) {
    if (!oAg._oExpand || !params.data)
        return;

    var sId = String(params.data[oAg._sFieldId]);
    var bOpen = !!oAg._oExpanded[sId];
    var eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = 'bx-grid-ag-chevron' + (bOpen ? ' is-open' : '');
    eBtn.setAttribute('aria-expanded', bOpen ? 'true' : 'false');
    eBtn.setAttribute('aria-label', 'Expand');
    eBtn.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M7 4.5 L13.5 10 L7 15.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    eBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        oAg.toggleExpand(sId, params.node);
    });
    if (this.eGui.firstChild)
        this.eGui.insertBefore(eBtn, this.eGui.firstChild);
    else
        this.eGui.appendChild(eBtn);
};

BxDolGridAgCell.prototype._childItems = function (params, oAg) {
    if (!params.data || !params.eGridCell)
        return;
    var sId = String(params.data[oAg._sFieldId]);
    if (!oAg._oExpanded[sId])
        return;

    var eRow = params.eGridCell.closest ? params.eGridCell.closest('.ag-row') : null;
    if (!eRow)
        return;

    var aItems = oAg._oChildren[sId] || [];
    var oMeta = params.data._meta || {};
    var ePanel = document.createElement('div');
    ePanel.className = 'bx-grid-ag-items';
    ePanel.style.top = (oAg._iRowGap / 2 + oAg._iRowHeight) + 'px';

    if (!aItems.length) {
        var eEmpty = document.createElement('div');
        eEmpty.className = 'bx-grid-ag-item bx-grid-ag-item-empty';
        eEmpty.textContent = oAg._oCfg.empty || '';
        ePanel.appendChild(eEmpty);
    } else {
        for (var i = 0; i < aItems.length; i++)
            ePanel.appendChild(this._childRow(aItems[i], oAg, oMeta));
    }

    eRow.classList.add('bx-grid-ag-row-open');
    eRow.appendChild(ePanel);
    this._eItems = ePanel;
    this._eRow = eRow;
    this._bindChildDrag(ePanel, oAg, oMeta, sId);
};

BxDolGridAgCell.prototype._childRow = function (oItem, oAg, oMeta) {
    var sField = oAg._oExpand.field_id || 'id';
    var sId = oItem && oItem[sField] != null ? String(oItem[sField]) : '';
    var eRow = document.createElement('div');
    eRow.className = 'bx-grid-ag-item';
    eRow.setAttribute('data-id', sId);

    var eHandle = document.createElement('div');
    eHandle.className = 'bx-grid-drag-handle';
    var eGrip = document.createElement('i');
    eGrip.className = 'sys-icon grip-vertical';
    eHandle.appendChild(eGrip);
    eRow.appendChild(eHandle);

    var oReal = oAg._itemsBx(oMeta);
    var oQuery = {};
    oQuery[oAg._oExpand.set] = oMeta[oAg._oExpand.set] || '';
    oQuery[oAg._oExpand.module] = oMeta[oAg._oExpand.module] || '';
    var oBx = {
        actionWithId: function () {
            oReal._oQueryAppend = {
                set: oQuery[oAg._oExpand.set],
                module: oQuery[oAg._oExpand.module]
            };
            return oReal.actionWithId.apply(oReal, arguments);
        }
    };
    var oChild = { _oBx: oBx, _sFieldId: sField };
    if (oItem.switcher && oItem.switcher.type === 'switcher')
        this._switch(eRow, oItem.switcher, { data: oItem, colDef: {} }, oChild);
    if (oItem.switcher_api && oItem.switcher_api.type === 'switcher')
        this._switch(eRow, oItem.switcher_api, { data: oItem, colDef: {} }, oChild);

    var eTitle = document.createElement('span');
    eTitle.className = 'bx-grid-ag-item-title';
    var oTitle = oItem.title_system || {};
    this._text(eTitle, oTitle.value == null ? '' : oTitle.value, oAg);
    eRow.appendChild(eTitle);

    if (oItem.actions && oItem.actions.type === 'actions') {
        var eActs = document.createElement('span');
        eActs.className = 'bx-grid-ag-item-actions';
        this._actions(eActs, oItem.actions.data, { data: oItem }, oChild);
        eRow.appendChild(eActs);
    }

    return eRow;
};

BxDolGridAgCell.prototype._bindChildDrag = function (ePanel, oAg, oMeta, sMenuId) {
    var eDrag = null;
    var aRows = ePanel.querySelectorAll('.bx-grid-ag-item');
    for (var i = 0; i < aRows.length; i++) {
        (function (eRow) {
            var eHandle = eRow.querySelector('.bx-grid-drag-handle');
            if (!eHandle)
                return;
            eHandle.addEventListener('mousedown', function () {
                eRow.setAttribute('draggable', 'true');
            });
            eRow.addEventListener('dragstart', function (ev) {
                eDrag = eRow;
                eRow.classList.add('is-dragging');
                if (ev.dataTransfer) {
                    ev.dataTransfer.effectAllowed = 'move';
                    ev.dataTransfer.setData('text/plain', eRow.getAttribute('data-id') || '');
                }
                ev.stopPropagation();
            });
            eRow.addEventListener('dragover', function (ev) {
                if (!eDrag || eDrag === eRow)
                    return;
                ev.preventDefault();
                var r = eRow.getBoundingClientRect();
                var bAfter = ev.clientY > r.top + r.height / 2;
                if (bAfter)
                    eRow.parentNode.insertBefore(eDrag, eRow.nextSibling);
                else
                    eRow.parentNode.insertBefore(eDrag, eRow);
            });
            eRow.addEventListener('dragend', function () {
                eRow.classList.remove('is-dragging');
                eRow.removeAttribute('draggable');
                if (eDrag) {
                    eDrag = null;
                    oAg._saveChildOrder(ePanel, oMeta, sMenuId);
                }
            });
        })(aRows[i]);
    }
};

BxDolGridAg.prototype._saveChildOrder = function (ePanel, oMeta, sMenuId) {
    var oCfg = this._oExpand;
    if (!oCfg)
        return;
    var sField = oCfg.field_id || 'id';
    var aIds = [];
    var aRows = ePanel.querySelectorAll('.bx-grid-ag-item');
    for (var i = 0; i < aRows.length; i++) {
        var sId = aRows[i].getAttribute('data-id');
        if (sId)
            aIds.push(sId);
    }
    if (aIds.length < 2)
        return;

    var aOld = this._oChildren[sMenuId] || [];
    var m = {};
    for (var j = 0; j < aOld.length; j++) {
        if (aOld[j] && aOld[j][sField] != null)
            m[String(aOld[j][sField])] = aOld[j];
    }
    var aNew = [];
    for (var k = 0; k < aIds.length; k++) {
        if (m[aIds[k]])
            aNew.push(m[aIds[k]]);
    }
    this._oChildren[sMenuId] = aNew;

    var sKey = encodeURIComponent(oCfg.object + '_row[]');
    var s = '';
    for (var n = 0; n < aIds.length; n++)
        s += (s ? '&' : '') + sKey + '=' + encodeURIComponent(aIds[n]);

    this._itemsBx(oMeta).action('reorder', {}, s, true);
};

BxDolGridAgCell.prototype.getGui = function () {
    return this.eGui;
};

BxDolGridAgCell.prototype.refresh = function () {
    return false;
};

BxDolGridAgCell.prototype._draw = function (eGui, cell, params, oAg) {
    if (cell == null || cell === '')
        return;

    if (typeof cell !== 'object') {
        this._text(eGui, cell, oAg);
        return;
    }

    var oBx = oAg._oBx;
    var sType = cell.type || 'text';
    switch (sType) {
        case 'text':
            this._text(eGui, cell.value == null ? '' : cell.value, oAg);
            break;
        case 'price':
            eGui.textContent = this._pair(cell.value, 'value', 'currency');
            break;
        case 'period':
            eGui.textContent = this._pair(cell.value, 'period', 'unit');
            break;
        case 'time':
        case 'datetime':
            eGui.textContent = this._when(cell.data, sType === 'datetime');
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
            if (typeof cell.value === 'string' || typeof cell.value === 'number')
                this._text(eGui, cell.value, oAg);
            else if (typeof cell.data === 'string')
                this._text(eGui, cell.data, oAg);
            break;
    }
};

BxDolGridAgCell.prototype._text = function (eGui, mixed, oAg) {
    var s = mixed == null ? '' : String(mixed);
    var e = document.createElement('span');
    e.className = 'bx-grid-ag-text';
    if (/<[a-z!/]/i.test(s)) {
        e.innerHTML = s;
        eGui.appendChild(e);
        if (window.jQuery) {
            if (jQuery.fn.bxProcessHtml)
                jQuery(e).bxProcessHtml();
            if (oAg._oBx && oAg._oBx._bindActionsSingle)
                oAg._oBx._bindActionsSingle(jQuery(e));
        }
    } else {
        e.textContent = s;
        eGui.appendChild(e);
    }
};

BxDolGridAgCell.prototype._pair = function (v, sA, sB) {
    if (v && typeof v === 'object') {
        var a = [];
        if (v[sA] != null && v[sA] !== '')
            a.push(v[sA]);
        if (v[sB] != null && v[sB] !== '')
            a.push(v[sB]);
        return a.join(' ');
    }
    return v == null ? '' : String(v);
};

BxDolGridAgCell.prototype._when = function (nStamp, bTime) {
    var n = Number(nStamp);
    if (!n)
        return '';
    var d = new Date(n * 1000);
    if (isNaN(d.getTime()))
        return '';
    return bTime ? d.toLocaleString() : d.toLocaleDateString();
};

BxDolGridAgCell.prototype._link = function (eGui, oLink) {
    var e = document.createElement(oLink.url ? 'a' : 'span');
    if (oLink.url)
        e.setAttribute('href', oLink.url);
    e.textContent = oLink.text || '';
    eGui.appendChild(e);
};

BxDolGridAgCell.prototype._switch = function (eGui, cell, params, oAg) {
    var bOn = cell.data == 1 || cell.data === 'active';
    var eCont = document.createElement('div');
    eCont.className = 'bx-switcher-cont relative ' + (bOn ? 'on' : 'off');

    var eBtn = document.createElement('button');
    eBtn.type = 'button';
    eBtn.className = 'relative inline-flex flex-shrink-0 h-6 w-11 ring-1 ring-gray-300 dark:ring-gray-700 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-blue-400';
    eBtn.setAttribute('role', 'switch');
    eBtn.setAttribute('aria-checked', bOn ? 'true' : 'false');
    if (params.colDef.headerName)
        eBtn.setAttribute('aria-label', params.colDef.headerName);

    var eKnob = document.createElement('span');
    eKnob.setAttribute('aria-hidden', 'true');
    eKnob.className = 'inline-block h-5 w-5 rounded-full shadow transform ring-0 transition ease-in-out duration-200 pointer-events-none';
    eBtn.appendChild(eKnob);
    eCont.appendChild(eBtn);

    var sId = params.data ? params.data[oAg._sFieldId] : '';
    var sAction = cell.action || 'enable';
    eBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var bNext = eCont.classList.contains('off');
        eCont.classList.toggle('on', bNext);
        eCont.classList.toggle('off', !bNext);
        eBtn.setAttribute('aria-checked', bNext ? 'true' : 'false');
        if (oAg._oBx)
            oAg._oBx.actionWithId(sId, sAction, { checked: bNext ? 1 : 0 }, '', false, 0);
    });

    eGui.appendChild(eCont);
};

BxDolGridAgCell.prototype._profile = function (eGui, d) {
    var e = document.createElement(d.url ? 'a' : 'span');
    e.className = 'bx-grid-ag-profile';
    if (d.url)
        e.setAttribute('href', d.url);
    if (d.url_avatar) {
        var eImg = document.createElement('img');
        eImg.src = d.url_avatar;
        eImg.alt = '';
        e.appendChild(eImg);
    }
    e.appendChild(document.createTextNode(d.display_name || ''));
    eGui.appendChild(e);
};

BxDolGridAgCell.prototype._actions = function (eGui, aActions, params, oAg) {
    if (!aActions || !aActions.length)
        return;

    eGui.classList.add('bx-grid-ag-actions');
    var sId = params.data ? params.data[oAg._sFieldId] : '';
    for (var i = 0; i < aActions.length; i++) {
        var a = aActions[i];
        if (!a || typeof a !== 'object' || !a.name)
            continue;

        var eBtn = document.createElement('button');
        eBtn.type = 'button';
        eBtn.className = 'bx-btn bx-btn-small bx-def-margin-thd';
        if (a.title) {
            eBtn.title = a.title;
            eBtn.setAttribute('aria-label', a.title);
        }
        if (a.icon)
            this._actionIcon(eBtn, a.icon);
        if (!parseInt(a.icon_only, 10) && a.title) {
            var eLabel = document.createElement('u');
            eLabel.textContent = a.title;
            eBtn.appendChild(eLabel);
        }

        // A settings button carries the classic onclick that opens its menu. Calling the action
        // instead would skip that menu.
        var oAttr = a.attr && typeof a.attr === 'object' ? a.attr : {};
        var sOnClick = oAttr.onclick ? String(oAttr.onclick) : '';
        var aKeep = ['bx_grid_action_single', 'bx_grid_action_data', 'bx_grid_action_confirm', 'bx_grid_action_reset_paginate', 'bx-popup-id'];
        for (var k = 0; k < aKeep.length; k++) {
            if (oAttr[aKeep[k]] != null && oAttr[aKeep[k]] !== '')
                eBtn.setAttribute(aKeep[k], oAttr[aKeep[k]]);
        }
        if (!eBtn.getAttribute('bx_grid_action_data') && sId !== '')
            eBtn.setAttribute('bx_grid_action_data', sId);

        if (sOnClick) {
            eBtn.setAttribute('onclick', sOnClick);
            eBtn.addEventListener('click', function (ev) {
                ev.stopPropagation();
            });
        } else {
            (function (sName, iConfirm) {
                eBtn.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    if (oAg._oBx)
                        oAg._oBx.actionWithId(sId, sName, {}, '', false, iConfirm);
                });
            })(a.name, a.confirm ? 1 : 0);
        }

        eGui.appendChild(eBtn);
    }
};

BxDolGridAgCell.prototype._actionIcon = function (eBtn, sIcon) {
    var s = String(sIcon || '');
    if (/<svg[\s>]/i.test(s)) {
        var eSvg = this._svgNode(s);
        if (eSvg)
            eBtn.appendChild(eSvg);
        return;
    }

    var sClass = s.replace(/[^A-Za-z0-9_ -]/g, '').replace(/^\s+|\s+$/g, '');
    if (!sClass)
        return;
    var eIcon = document.createElement('i');
    eIcon.className = 'sys-icon ' + sClass;
    eBtn.appendChild(eIcon);
};

BxDolGridAgCell.prototype._svgNode = function (sMarkup) {
    var eWrap = document.createElement('div');
    eWrap.innerHTML = String(sMarkup);
    var eSrc = eWrap.querySelector('svg');
    if (!eSrc)
        return null;

    var aAllowed = { svg: 1, path: 1, circle: 1, rect: 1, g: 1, line: 1, polyline: 1, polygon: 1, ellipse: 1, title: 1 };
    var aAttr = {
        viewBox: 1, width: 1, height: 1, fill: 1, stroke: 1, 'stroke-width': 1, 'stroke-linecap': 1, 'stroke-linejoin': 1,
        d: 1, cx: 1, cy: 1, r: 1, x: 1, y: 1, x1: 1, y1: 1, x2: 1, y2: 1, rx: 1, ry: 1, points: 1, transform: 1,
        xmlns: 1, 'fill-rule': 1, 'clip-rule': 1, opacity: 1
    };
    var fCopy = function (eFrom) {
        var sTag = eFrom.tagName ? eFrom.tagName.toLowerCase() : '';
        if (!aAllowed[sTag])
            return null;
        var e = document.createElementNS('http://www.w3.org/2000/svg', sTag);
        for (var i = 0; i < eFrom.attributes.length; i++) {
            var oA = eFrom.attributes[i];
            if (!aAttr[oA.name])
                continue;
            if (/javascript:|url\s*\(/i.test(oA.value))
                continue;
            e.setAttribute(oA.name, oA.value);
        }
        for (var c = 0; c < eFrom.childNodes.length; c++) {
            if (eFrom.childNodes[c].nodeType !== 1)
                continue;
            var eChild = fCopy(eFrom.childNodes[c]);
            if (eChild)
                e.appendChild(eChild);
        }
        return e;
    };

    var eSvg = fCopy(eSrc);
    if (!eSvg)
        return null;
    eSvg.setAttribute('class', 'sys-icon sys-icon-svg');
    eSvg.setAttribute('aria-hidden', 'true');
    return eSvg;
};

BxDolGridAgCell.prototype._secret = function (eGui, cell, params, oAg) {
    var sMasked = typeof cell.value === 'string' ? cell.value : '';
    var eWrap = document.createElement('div');
    eWrap.className = 'bx-grid-secret';

    var eVal = document.createElement('span');
    eVal.className = 'bx-grid-secret-value';
    eVal.setAttribute('data-masked', sMasked);
    eVal.textContent = sMasked;
    eWrap.appendChild(eVal);

    var eToggle = document.createElement('a');
    eToggle.href = 'javascript:void(0)';
    eToggle.className = 'bx-grid-secret-toggle';
    eToggle.setAttribute('bx_grid_secret_id', params.data ? params.data[oAg._sFieldId] : '');
    eToggle.setAttribute('bx_grid_secret_field', params.colDef.field || '');
    var eIcon = document.createElement('i');
    eIcon.className = 'sys-icon eye';
    eToggle.appendChild(eIcon);

    eToggle.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (!oAg._oBx)
            return;
        if (eWrap.classList.contains('bx-grid-secret-shown'))
            oAg._oBx.hideSecret(jQuery(eWrap));
        else
            oAg._oBx.revealSecret(eToggle.getAttribute('bx_grid_secret_id'), eToggle.getAttribute('bx_grid_secret_field'));
    });

    eWrap.appendChild(eToggle);
    eGui.appendChild(eWrap);
};
