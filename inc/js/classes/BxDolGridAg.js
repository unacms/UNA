/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * AG Grid (Community, MIT) for a grid whose sys_objects_grid.engine is 'ag'.
 * Quartz is the legacy CSS theme: template/css/grid_ag.css restyles it.
 *
 * Every engine=ag grid uses the infinite row model: blocks load as the grid is
 * scrolled, there is no pager. Community managed row dragging needs the client
 * row model, so an order column is not a drag handle here.
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

    this._adoptBx();
    this._mount();
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

        // enable/disable have no `grid` key, so onReload does not run for them.
        if (oData.enable !== undefined || oData.disable !== undefined || oData.enable_api !== undefined || oData.disable_api !== undefined)
            self.refresh();
    };
};

BxDolGridAg.prototype._mount = function () {
    var eGrid = document.getElementById('bx-grid-ag-' + this._sObject);
    if (!eGrid || typeof bxAgGrid === 'undefined' || typeof bxAgGrid.createGrid !== 'function')
        return;

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
        rowHeight: 52,
        rowModelType: 'infinite',
        cacheBlockSize: this._iPerPage,
        infiniteInitialRowCount: this._iPerPage,
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
        }
    };

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
            pinned: 'left',
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

BxDolGridAg.prototype._columns = function () {
    var aCfg = this._oCfg.columns || [];
    var sSortField = this._oCfg.sorting_field || '';
    var sSortDir = String(this._oCfg.sorting_dir || '').toLowerCase() === 'desc' ? 'desc' : 'asc';
    var aCols = [];

    for (var i = 0; i < aCfg.length; i++) {
        var col = aCfg[i];
        if (col.kind === 'checkbox' || col.kind === 'order')
            continue;

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

BxDolGridAg.prototype._syncChecks = function () {
    var e = document.getElementById('bx-grid-table-' + this._sObject);
    if (!e || !this._oApi || !this._oApi.getSelectedRows)
        return;

    var sName = this._sObject + '_check';
    var sField = this._sFieldId;
    var aRows = this._oApi.getSelectedRows() || [];
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

    var oAg = params.context && params.context.ag;
    if (!oAg)
        return;

    var cell = params.value;
    if ((cell == null || cell === '') && params.data)
        cell = params.data[params.colDef.field];

    this._draw(this.eGui, cell, params, oAg);
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
    if (/<[a-z!/]/i.test(s)) {
        eGui.innerHTML = s;
        if (window.jQuery) {
            if (jQuery.fn.bxProcessHtml)
                jQuery(eGui).bxProcessHtml();
            if (oAg._oBx && oAg._oBx._bindActionsSingle)
                oAg._oBx._bindActionsSingle(jQuery(eGui));
        }
    } else {
        eGui.textContent = s;
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
        if (a.icon) {
            var eIcon = document.createElement('i');
            eIcon.className = 'sys-icon ' + String(a.icon).replace(/[^A-Za-z0-9_ -]/g, '');
            eBtn.appendChild(eIcon);
        }
        if (!parseInt(a.icon_only, 10) && a.title) {
            var eLabel = document.createElement('u');
            eLabel.textContent = a.title;
            eBtn.appendChild(eLabel);
        }

        (function (sName, iConfirm) {
            eBtn.addEventListener('click', function (ev) {
                ev.preventDefault();
                if (oAg._oBx)
                    oAg._oBx.actionWithId(sId, sName, {}, '', false, iConfirm);
            });
        })(a.name, a.confirm ? 1 : 0);

        eGui.appendChild(eBtn);
    }
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
