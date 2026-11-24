/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The site's search window (BxBaseSearchWindow): the header's Search, a section's or context's Search and Cmd/Ctrl+K open
 * it as a dialog; the results page (search-keyword) has the same body in the page. It keeps the query (the URL params of
 * the results page, BxDolSearchUnified) and asks searchKeywordContent.php?window=1 for the chips and results that go with it.
 */
function BxDolSearchWindow(oRoot)
{
    this._oRoot = $(oRoot);
    this._sUrl = this._oRoot.attr('data-url');
    this._sMode = this._oRoot.attr('data-mode');
    this._bPage = this._sMode == 'page' || this._sMode == 'explore';
    this._bAi = this._oRoot.attr('data-ai') == '1';
    this._oQuery = {};
    try {
        this._oQuery = JSON.parse(this._oRoot.attr('data-query') || '{}') || {};
    } catch (e) {}
    if(Array.isArray(this._oQuery))
        this._oQuery = {};

    this._iTimer = 0;
    this._iSeq = 0;
    this._oRequest = null;
    this._iMinLen = 2;

    this._bind();
    this._toggleExplore();
}

BxDolSearchWindow.POPUP = '#bx-search-window';

/**
 * Opens the dialog, global or with a scope: {section: 'bx_posts'}, {context: 12}, {author: 5}.
 */
BxDolSearchWindow.open = function(oScope, oTrigger)
{
    var oPopup = $(BxDolSearchWindow.POPUP);
    if(!oPopup.length)
        return false;

    var oWindow = oPopup.find('.bx-search-window').data('bx-search-window');
    if(!oWindow)
        return false;

    oWindow.setScope(oScope || {});
    oWindow._oTrigger = oTrigger ? $(oTrigger) : null;

    // its top edge stays where it opens, 4rem from the window's top (NEO's dialog too): only the bottom moves as results come and go
    oPopup.dolPopup({
        position: 'fixed',
        left: 'center',
        top: '4rem',
        onShow: function() {
            if(oWindow._oTrigger)
                oWindow._oTrigger.attr('aria-expanded', 'true');
            oWindow.focusInput();
        },
        onHide: function() {
            if(oWindow._oTrigger) {
                var oTrigger = oWindow._oTrigger.attr('aria-expanded', 'false');
                setTimeout(function() {
                    oTrigger.filter(':visible').first().focus();
                }, 0);
            }
        }
    });

    return false;
};

/**
 * A button's data attributes: data-search-section, data-search-context, data-search-author.
 */
BxDolSearchWindow.openFrom = function(oButton)
{
    var o = $(oButton), oScope = {};
    if(o.attr('data-search-section'))
        oScope.section = o.attr('data-search-section');
    if(o.attr('data-search-context'))
        oScope.context = o.attr('data-search-context');
    if(o.attr('data-search-author'))
        oScope.author = o.attr('data-search-author');

    return BxDolSearchWindow.open(oScope, oButton);
};

BxDolSearchWindow.init = function()
{
    $('.bx-search-window').each(function() {
        if(!$(this).data('bx-search-window'))
            $(this).data('bx-search-window', new BxDolSearchWindow(this));
    });

    // Cmd/Ctrl+K: global search, from anywhere but a text field of another form
    $(document).off('keydown.bx-search-window').on('keydown.bx-search-window', function(oEvent) {
        if((oEvent.metaKey || oEvent.ctrlKey) && !oEvent.altKey && String(oEvent.key).toLowerCase() == 'k') {
            if(!$(BxDolSearchWindow.POPUP).length)
                return;

            // a text field or an editor keeps its own Cmd/Ctrl+K (an editor's "insert link"); the window's own field doesn't
            var oTarget = $(oEvent.target);
            if(oTarget.is('input, textarea, select, [contenteditable], [contenteditable] *') && !oTarget.parents(BxDolSearchWindow.POPUP).length)
                return;

            oEvent.preventDefault();
            if($(BxDolSearchWindow.POPUP).is(':visible'))
                $(BxDolSearchWindow.POPUP).find('.bx-search-window-input').focus().select();
            else
                BxDolSearchWindow.open({});
        }
    });
};

BxDolSearchWindow.prototype.setScope = function(oScope)
{
    var oQuery = {};
    $.each(['section', 'context', 'author'], function(i, sKey) {
        if(oScope[sKey])
            oQuery[sKey] = String(oScope[sKey]);
    });

    var sKeyword = this._oRoot.find('.bx-search-window-input').val();
    if(sKeyword)
        oQuery.keyword = sKeyword;

    this._oQuery = oQuery;
    this._load();
};

BxDolSearchWindow.prototype.focusInput = function()
{
    this._oRoot.find('.bx-search-window-input').focus().select();
};

BxDolSearchWindow.prototype._bind = function()
{
    var $this = this, oRoot = this._oRoot;

    oRoot.on('submit', '.bx-search-window-form', function(oEvent) {
        oEvent.preventDefault();

        // Enter opens the selected result
        var oActive = oRoot.find('.bx-search-window-item-active a').first();
        if(oActive.length) {
            window.location = oActive.attr('href');
            return;
        }

        // with AI on, the first Enter on new words lets it read them (a module, dates); typing alone never asks the model
        var sKeyword = $.trim(oRoot.find('.bx-search-window-input').val());
        if($this._bAi && sKeyword && sKeyword !== $this._sAiKeyword) {
            $this._sAiKeyword = sKeyword;
            clearTimeout($this._iTimer);
            $this._run(true);
            return;
        }

        // then the full results
        if($this._bPage)
            $this._run(false);
        else
            window.location = $this._getResultsUrl();
    });

    oRoot.on('input', '.bx-search-window-input', function() {
        // a reply to the words before these must not bring them back
        $this._iSeq++;
        if($this._oRequest) {
            $this._oRequest.abort();
            $this._oRequest = null;
        }
        // no request in flight until the next one starts
        $this._oRoot.find('.bx-search-window-busy').addClass('hidden');
        $this._oRoot.find('.bx-search-window-results').attr('aria-busy', null);

        var sValue = $.trim($(this).val());
        if(sValue)
            $this._oQuery.keyword = sValue;
        else
            delete $this._oQuery.keyword;

        delete $this._oQuery.cursor;
        clearTimeout($this._iTimer);
        if(sValue.length && sValue.length < $this._iMinLen)
            return;

        $this._iTimer = setTimeout(function() {
            $this._run(false);
        }, 300);
    });

    oRoot.on('keydown', '.bx-search-window-input', function(oEvent) {
        if(oEvent.key == 'ArrowDown' || oEvent.key == 'ArrowUp') {
            oEvent.preventDefault();
            $this._moveSelection(oEvent.key == 'ArrowDown' ? 1 : -1);
        }
    });

    oRoot.on('click', '.bx-search-window-close', function() {
        if($this._bPage)
            return;

        $(BxDolSearchWindow.POPUP).dolPopupHide();
    });

    // chips
    oRoot.on('click', '.bx-search-window-chip[data-panel]', function() {
        var oChip = $(this), sPanel = oChip.attr('data-panel'), bOpen = oChip.attr('aria-expanded') == 'true';
        oRoot.find('.bx-search-window-chip[data-panel]').attr('aria-expanded', 'false');
        oRoot.find('.bx-search-window-panel').addClass('hidden');
        if(!bOpen) {
            oChip.attr('aria-expanded', 'true');
            var oPanel = oRoot.find('#' + sPanel).removeClass('hidden');
            oPanel.find('input, select, button').filter(':visible').first().focus();
        }
    });

    oRoot.on('click', '.bx-search-window-chip[data-toggle]', function() {
        var sName = $(this).attr('data-toggle');
        if($this._oQuery[sName])
            delete $this._oQuery[sName];
        else
            $this._oQuery[sName] = 1;
        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-chip-remove', function() {
        var sName = $(this).attr('data-remove');
        if(sName == 'date') {
            delete $this._oQuery.date_from;
            delete $this._oQuery.date_to;
            delete $this._oQuery.date_field;
        }
        else if(sName == 'section') {
            var aSections = String($this._oQuery.section || '').split(',');
            var sValue = $(this).attr('data-value');
            aSections = $.grep(aSections, function(s) { return s && s != sValue; });
            if(aSections.length)
                $this._oQuery.section = aSections.join(',');
            else
                delete $this._oQuery.section;
            delete $this._oQuery.filters;
        }
        else if($this._getFilters()[sName] !== undefined) {
            var oFilters = $this._getFilters();
            delete oFilters[sName];
            $this._setFilters(oFilters);
        }
        else
            delete $this._oQuery[sName];

        delete $this._oQuery.tab;
        $this._run(true);
        $this.focusInput();
    });

    // "+ Filter": a module to look in, Title only, or a filter to set in its panel (Created by, Date, the module's fields)
    oRoot.on('click', '.bx-search-window-add', function() {
        var sName = $(this).attr('data-add'), sValue = $(this).attr('data-value');
        if(sName == 'section') {
            $this._oQuery.section = sValue;
            delete $this._oQuery.tab;
            $this._run(true);
            return;
        }
        if(sName == 'toggle') {
            $this._oQuery[sValue] = 1;
            $this._run(true);
            $this.focusInput();
            return;
        }

        oRoot.find('.bx-search-window-panel').addClass('hidden');
        oRoot.find('#bx-search-window-panel-' + sValue).removeClass('hidden').find('input').first().focus();
    });

    oRoot.on('click', '.bx-search-window-set', function() {
        $this._oQuery[$(this).attr('data-name')] = $(this).attr('data-value');
        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-date-apply', function() {
        var oPanel = $(this).parents('.bx-search-window-panel:first');
        var sFrom = oPanel.find('.bx-search-window-date-from').val(), sTo = oPanel.find('.bx-search-window-date-to').val();
        if(!sFrom)
            return;

        $this._oQuery.date_from = sFrom;
        if(sTo)
            $this._oQuery.date_to = sTo;
        else
            delete $this._oQuery.date_to;

        var oField = oPanel.find('.bx-search-window-date-field');
        if(oField.length && oField.val() != 'created')
            $this._oQuery.date_field = oField.val();
        else
            delete $this._oQuery.date_field;

        try {
            $this._oQuery.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {}

        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-options-apply', function() {
        var oPanel = $(this).parents('.bx-search-window-panel:first'), sName = oPanel.attr('data-name');
        var aValues = oPanel.find('input:checked').map(function() { return this.value; }).get();
        var oFilters = $this._getFilters();
        if(aValues.length)
            oFilters[sName] = oPanel.find('input[type=radio]').length ? aValues[0] : aValues;
        else
            delete oFilters[sName];
        $this._setFilters(oFilters);
        $this._run(true);
    });

    // "Created by": people whose name matches
    oRoot.on('input', '.bx-search-window-profile-input', function() {
        var oInput = $(this), oPanel = oInput.parents('.bx-search-window-panel:first'), sTerm = $.trim(oInput.val());
        clearTimeout($this._iProfileTimer);
        if(sTerm.length < 2) {
            oPanel.find('.bx-search-window-profile-list').html('');
            return;
        }

        $this._iProfileTimer = setTimeout(function() {
            $.getJSON(oPanel.attr('data-suggest'), {term: sTerm}, function(aData) {
                var oList = oPanel.find('.bx-search-window-profile-list').html('');
                $.each(Array.isArray(aData) ? aData.slice(0, 8) : [], function(i, oItem) {
                    $('<button type="button" class="bx-search-window-set bx-btn bx-btn-small"></button>')
                        .attr('data-name', 'author').attr('data-value', oItem.value).text($('<div/>').html(oItem.label).text())
                        .appendTo(oList);
                });
            });
        }, 300);
    });

    // results
    oRoot.on('change', '.bx-search-window-sort', function() {
        if($(this).val() == 'new')
            $this._oQuery.sort = 'new';
        else
            delete $this._oQuery.sort;
        $this._run(false);
    });

    oRoot.on('click', '.bx-search-window-tab', function() {
        var sTab = $(this).attr('data-tab');
        if(sTab)
            $this._oQuery.tab = sTab;
        else
            delete $this._oQuery.tab;
        delete $this._oQuery.cursor;
        $this._run(false);
    });

    oRoot.on('click', '.bx-search-window-more', function() {
        var oButton = $(this), oGroup = oButton.parents('.bx-search-window-group:first');
        var oQuery = $.extend({}, $this._oQuery, {cursor: oButton.attr('data-cursor')});
        if(!oQuery.tab && !oQuery.section)
            oQuery.tab = oGroup.attr('data-group');

        oButton.addClass('bx-btn-disabled').attr('aria-busy', 'true');
        $this._request(oQuery, function(oData) {
            var oNew = $('<div/>').html(oData.results).find('.bx-search-window-group[data-group="' + oGroup.attr('data-group') + '"]');
            oGroup.find('.bx-search-window-items').append(oNew.find('.bx-search-window-items').children());
            oButton.remove();
            oNew.find('.bx-search-window-more').appendTo(oGroup);
            $this._initIcons();
        });
    });
};

BxDolSearchWindow.prototype._initIcons = function()
{
    if(typeof window.bx_iconset_init_lucide === 'function')
        bx_iconset_init_lucide();
};

BxDolSearchWindow.prototype._getFilters = function()
{
    if(!this._oQuery.filters)
        return {};

    try {
        var o = JSON.parse(this._oQuery.filters);
        return o && typeof(o) == 'object' && !Array.isArray(o) ? o : {};
    } catch (e) {
        return {};
    }
};

BxDolSearchWindow.prototype._setFilters = function(oFilters)
{
    if($.isEmptyObject(oFilters))
        delete this._oQuery.filters;
    else
        this._oQuery.filters = JSON.stringify(oFilters);
};

BxDolSearchWindow.prototype._moveSelection = function(iStep)
{
    var aItems = this._oRoot.find('.bx-search-window-items').children().filter(':visible');
    if(!aItems.length)
        return;

    var iIndex = aItems.index(aItems.filter('.bx-search-window-item-active')) + iStep;
    iIndex = Math.max(0, Math.min(aItems.length - 1, iIndex));

    aItems.removeClass('bx-search-window-item-active').attr('aria-selected', null);
    var oItem = aItems.eq(iIndex).addClass('bx-search-window-item-active').attr('aria-selected', 'true');
    if(oItem.get(0) && oItem.get(0).scrollIntoView)
        oItem.get(0).scrollIntoView({block: 'nearest'});
};

BxDolSearchWindow.prototype._getResultsUrl = function()
{
    var oQuery = $.extend({}, this._oQuery);
    delete oQuery.cursor;
    return this._oRoot.find('.bx-search-window-form').attr('action') + '?' + $.param(oQuery);
};

/**
 * Asks for the query's parts and puts them in. bAi: let the AI parser read the keyword first (when it is on).
 */
BxDolSearchWindow.prototype._run = function(bAi)
{
    var $this = this, oQuery = $.extend({}, this._oQuery), iSeq = this._iSeq;
    delete oQuery.cursor;

    this._request($.extend({}, oQuery, bAi && this._bAi ? {ai: 1} : {}), function(oData) {
        // the field changed since: its own request comes
        if(iSeq !== $this._iSeq)
            return;

        if(oData.query && typeof(oData.query) == 'object' && !Array.isArray(oData.query)) {
            $this._oQuery = oData.query;

            // the AI may have read the words into chips: the field shows the words it searches for
            if(bAi) {
                var sKeyword = oData.query.keyword || '';
                $this._oRoot.find('.bx-search-window-input').val(sKeyword);
                $this._sAiKeyword = sKeyword;
            }
        }

        $this._oRoot.find('.bx-search-window-chips-wrap').html(oData.chips);
        $this._oRoot.find('.bx-search-window-results').html(oData.results);
        $this._oRoot.find('.bx-search-window-full').attr('href', oData.results_url);
        $this._oRoot.find('.bx-search-window-status').text(oData.count || '');
        $this._initIcons();

        if($this._sMode == 'page' && window.history && window.history.replaceState)
            window.history.replaceState(null, '', oData.results_url);

        $this._toggleExplore();
    });
};

/**
 * Explore: the page's other blocks (featured content) until a search is typed, the results in their place then.
 */
BxDolSearchWindow.prototype._toggleExplore = function()
{
    if(this._sMode != 'explore')
        return;

    var q = this._oQuery, bQuery = !!(q.keyword || q.context || q.author || q.date_from || q.filters);
    var oOwn = this._oRoot.parents('.bx-page-block-container:first');
    $('.bx-page-block-container').not(oOwn).toggleClass('hidden', bQuery);
    this._oRoot.find('.bx-search-window-footer').toggleClass('hidden', !bQuery);
};

BxDolSearchWindow.prototype._load = function()
{
    this._run(false);
};

BxDolSearchWindow.prototype._request = function(oQuery, onSuccess)
{
    var $this = this;
    if(this._oRequest)
        this._oRequest.abort();

    var oBusy = this._oRoot.find('.bx-search-window-busy').removeClass('hidden');
    this._oRoot.find('.bx-search-window-results').attr('aria-busy', 'true');

    this._oRequest = $.ajax({
        url: this._sUrl,
        data: $.extend({window: 1, mode: this._sMode}, oQuery),
        dataType: 'json',
        success: function(oData) {
            if(oData && typeof(oData) == 'object')
                onSuccess(oData);
        },
        error: function(oXhr, sStatus) {
            if(sStatus != 'abort')
                $this._oRoot.find('.bx-search-window-results').html($('<p class="bx-search-window-hint text-sm text-red-700 dark:text-red-400" role="alert"></p>').text(_t('_sys_search_window_error')));
        },
        complete: function(oXhr, sStatus) {
            if(sStatus == 'abort')
                return;
            oBusy.addClass('hidden');
            $this._oRoot.find('.bx-search-window-results').attr('aria-busy', null);
            $this._oRequest = null;
        }
    });
};

$(document).ready(function() {
    BxDolSearchWindow.init();
});

/** @} */
