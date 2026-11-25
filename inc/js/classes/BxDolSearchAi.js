/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The AI search block on the site (template search_ai.html), as NEO's search_ai with use_page_results: while the
 * member types, the query goes to searchExtended.php (action parse_ai), which reads it into the search object's
 * fields and draws them as chips. Search opens the object's results block (this page's, else its search page) with
 * those fields as `filters`, the same values the search form sends. A chip's remove button leaves its field out.
 * Without a model to ask (available: 0) the words go to the object's first text field.
 */
function BxDolSearchAi(oOptions)
{
    this._oOptions = oOptions || {};
    this._oRoot = $('#' + this._oOptions.id);
    this._oInput = this._oRoot.find('.bx-search-ai-input');
    this._oChips = this._oRoot.find('.bx-search-ai-chips');

    this._oParsed = null;       // the last answer of parse_ai
    this._sParsed = '';         // the query it is for
    this._oRemoved = {};        // fields whose chip was removed
    this._oRequest = null;
    this._iTimer = 0;
    this._bGo = false;          // Search was pressed while the query was being read

    this._bind();
    this._grow();
}

BxDolSearchAi.prototype.PARSE_MIN_LENGTH = 3;
BxDolSearchAi.prototype.PARSE_DELAY = 600;

BxDolSearchAi.prototype._bind = function () {
    var $this = this;

    this._oInput.on('input', function () {
        $this._grow();
        clearTimeout($this._iTimer);
        $this._iTimer = setTimeout(function () {
            $this._parse();
        }, $this.PARSE_DELAY);
    });

    // a text area searches on Enter, as a field does; Shift+Enter starts a new line
    this._oInput.on('keydown', function (oEvent) {
        if (oEvent.key == 'Enter' && !oEvent.shiftKey && this.tagName == 'TEXTAREA') {
            oEvent.preventDefault();
            $this._oRoot.find('.bx-search-ai-form').trigger('submit');
        }
    });

    this._oRoot.find('.bx-search-ai-form').on('submit', function (oEvent) {
        oEvent.preventDefault();
        $this._submit();
    });

    this._oChips.on('click', '.bx-search-window-chip-remove', function () {
        var sField = $(this).attr('data-remove');
        if (sField)
            $this._oRemoved[sField] = 1;
        $(this).closest('.bx-search-window-chip-wrap').remove();
    });
};

/**
 * A text area grows with its text, up to the height the CSS allows.
 */
BxDolSearchAi.prototype._grow = function () {
    var e = this._oInput.get(0);
    if (!e || e.tagName != 'TEXTAREA')
        return;

    e.style.height = 'auto';
    e.style.height = e.scrollHeight + 'px';
};

BxDolSearchAi.prototype._query = function () {
    return $.trim(this._oInput.val() || '');
};

BxDolSearchAi.prototype._parse = function (fDone) {
    var $this = this;
    var sQuery = this._query();

    if (this._oRequest) {
        this._oRequest.abort();
        this._oRequest = null;
    }

    if (!parseInt(this._oOptions.available) || sQuery.length < this.PARSE_MIN_LENGTH) {
        this._setParsed(null, sQuery);
        if (fDone)
            fDone();
        return;
    }

    if (sQuery === this._sParsed && this._oParsed) {
        if (fDone)
            fDone();
        return;
    }

    var sTimezone = '';
    try {
        sTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    }
    catch (e) {}

    this._oRoot.addClass('bx-search-ai-busy');
    this._oRequest = $.getJSON(this._oOptions.parse_url, {
        object: this._oOptions.object,
        action: 'parse_ai',
        query: sQuery,
        hint_id: this._oOptions.hint_id || '',
        timezone: sTimezone,
        _t: (new Date()).getTime()
    })
    .done(function (oData) {
        $this._setParsed(oData && typeof oData == 'object' ? oData : null, sQuery);
    })
    .fail(function (oXhr, sStatus) {
        if (sStatus != 'abort')
            $this._setParsed(null, sQuery);
    })
    .always(function (oXhr, sStatus) {
        if (sStatus == 'abort')
            return;
        $this._oRequest = null;
        $this._oRoot.removeClass('bx-search-ai-busy');
        if (fDone)
            fDone();
    });
};

BxDolSearchAi.prototype._setParsed = function (oData, sQuery) {
    this._oParsed = oData;
    this._sParsed = sQuery;
    this._oRemoved = {};
    this._oChips.html(oData && oData.chips_html ? oData.chips_html : '');
};

BxDolSearchAi.prototype._submit = function () {
    var $this = this;
    if (this._bGo)
        return;

    clearTimeout(this._iTimer);
    this._bGo = true;
    this._parse(function () {
        $this._bGo = false;
        $this._go();
    });
};

/**
 * The fields the query was read into, less the removed ones, as the search form sends them; the words alone when
 * nothing was read from them.
 */
BxDolSearchAi.prototype._filters = function () {
    var oFilters = {};
    var sQuery = this._query();
    var o = this._oParsed;

    if (o && o.filters && typeof o.filters == 'object') {
        var oSkip = {};
        $.each(o.chips || {}, $.proxy(function (sField, oChip) {
            if (this._oRemoved[sField] && oChip && oChip.filter_keys)
                $.each(oChip.filter_keys, function (i, sKey) {
                    oSkip[sKey] = 1;
                });
        }, this));

        $.each(o.filters, function (sKey, mixedValue) {
            if (!oSkip[sKey])
                oFilters[sKey] = mixedValue;
        });
    }

    if ($.isEmptyObject(oFilters) && sQuery && this._oOptions.keyword_field)
        oFilters[this._oOptions.keyword_field] = sQuery;

    return oFilters;
};

BxDolSearchAi.prototype._go = function () {
    var sQuery = this._query();
    var sUrl = this._oOptions.results_url;
    var aParams = [];

    var oFilters = this._filters();
    if (!$.isEmptyObject(oFilters))
        aParams.push('filters=' + encodeURIComponent(JSON.stringify(oFilters)));
    if (sQuery)
        aParams.push('ai_query=' + encodeURIComponent(sQuery));

    if (aParams.length)
        sUrl += (sUrl.indexOf('?') == -1 ? '?' : '&') + aParams.join('&');

    document.location = sUrl;
};

/** @} */
