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
    // the pills' names in the order the member added them (the row shows them so)
    this._aOrder = [];
    this._oRequest = null;
    this._iMinLen = 2;

    this._bind();
    this._orderPills();
    this._placeFilter();
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

    // chips and their dropdowns ("+ Filter", a filter's own picker): one open at a time, under the chips
    oRoot.on('click', '.bx-search-window-chip[data-panel]', function() {
        var oChip = $(this), bOpen = oChip.attr('aria-expanded') == 'true';
        $this._closePanels(false);
        if(!bOpen)
            $this._openPanel(oChip.attr('data-panel'), oChip);
    });

    oRoot.on('click', '.bx-search-window-chip[data-toggle]', function() {
        var sName = $(this).attr('data-toggle');
        if($this._oQuery[sName])
            delete $this._oQuery[sName];
        else
            $this._oQuery[sName] = 1;
        delete $this._oQuery.tab;
        $this._bFocusFilter = true;
        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-chip-remove', function() {
        var sName = $(this).attr('data-remove');
        $this._aOrder = $.grep($this._aOrder, function(s) { return s != sName; });
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
        // the removed chip is gone: the keyboard goes on from "+ Filter"
        $this._bFocusFilter = true;
        $this._run(true);
    });

    // "+ Filter": a module to look in, Title only, or a filter to set in its own picker (Created by, Date, a module's field)
    oRoot.on('click', '.bx-search-window-add', function() {
        var sName = $(this).attr('data-add'), sValue = $(this).attr('data-value');
        if(sName == 'section' || sName == 'toggle') {
            if(sName == 'section')
                $this._oQuery.section = sValue;
            else
                $this._oQuery[sValue] = 1;
            $this._added(sName == 'section' ? 'section' : sValue);
            delete $this._oQuery.tab;
            $this._closePanels(false);
            $this._bFocusFilter = true;
            $this._run(true);
            return;
        }

        var oFilter = oRoot.find('.bx-search-window-chip-add');
        $this._closePanels(false);
        $this._openPanel('bx-search-window-panel-' + sValue, oFilter);
    });

    oRoot.on('click', '.bx-search-window-set', function() {
        $this._oQuery[$(this).attr('data-name')] = $(this).attr('data-value');
        $this._added($(this).attr('data-name'));
        delete $this._oQuery.tab;
        $this._closePanels(false);
        $this._bFocusFilter = true;
        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-date-preset', function() {
        var o = $(this), iDays = parseInt(o.attr('data-days'), 10), bAhead = o.attr('data-ahead') == '1';
        var fYmd = function(d) {
            return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        };
        var oToday = new Date(), oOther = new Date(oToday.getTime() + (bAhead ? 1 : -1) * iDays * 86400000);
        $this._oQuery.date_from = fYmd(bAhead ? oToday : oOther);
        $this._oQuery.date_to = fYmd(bAhead ? oOther : oToday);
        if(o.attr('data-field'))
            $this._oQuery.date_field = o.attr('data-field');
        else
            delete $this._oQuery.date_field;
        try {
            $this._oQuery.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {}
        $this._added('date');
        delete $this._oQuery.tab;
        $this._closePanels(false);
        $this._bFocusFilter = true;
        $this._run(true);
    });

    oRoot.on('click', '.bx-search-window-date-apply', function() {
        var oPanel = $(this).parents('.bx-search-window-panel:first');
        var sFrom = oPanel.find('.bx-search-window-date-from').val(), sTo = oPanel.find('.bx-search-window-date-to').val();
        if(!sFrom) {
            oPanel.find('.bx-search-window-date-from').focus();
            return;
        }

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

        $this._added('date');
        delete $this._oQuery.tab;
        $this._closePanels(false);
        $this._bFocusFilter = true;
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
        $this._added(sName);
        delete $this._oQuery.tab;
        $this._closePanels(false);
        $this._bFocusFilter = true;
        $this._run(true);
    });

    // "Created by": people whose name matches, as a combobox (the arrows move to the names, Enter takes one)
    oRoot.on('input', '.bx-search-window-profile-input', function() {
        var oInput = $(this), oPanel = oInput.parents('.bx-search-window-panel:first'), sTerm = $.trim(oInput.val());
        var oList = oPanel.find('.bx-search-window-profile-list');
        clearTimeout($this._iProfileTimer);
        oList.find('.bx-search-window-person').remove();
        oInput.attr('aria-expanded', oList.children().length ? 'true' : 'false');
        if(sTerm.length < 2)
            return;

        $this._iProfileTimer = setTimeout(function() {
            $.getJSON(oPanel.attr('data-suggest'), {term: sTerm}, function(aData) {
                oList.find('.bx-search-window-person').remove();
                $.each(Array.isArray(aData) ? aData.slice(0, 8) : [], function(i, oItem) {
                    var oLink = $('<a href="javascript:void(0);" role="option" class="bx-search-window-set flex items-center"><span class="bx-stl-mit"></span></a>')
                        .attr('data-name', 'author').attr('data-value', oItem.value);
                    oLink.find('.bx-stl-mit').text($('<div/>').html(oItem.label).text());
                    $('<li class="bx-menu-item bx-search-window-person" role="none"></li>').append(oLink).appendTo(oList);
                });
                oInput.attr('aria-expanded', oList.children().length ? 'true' : 'false');
            });
        }, 300);
    });

    // in a dropdown: the arrows move between its rows and fields, Enter in the name field takes the first name, Escape
    // closes it (not the window) and leaves the keyboard on what opened it
    oRoot.on('keydown', '.bx-search-window-panel', function(oEvent) {
        var oPanel = $(this);
        if(oEvent.key == 'Escape') {
            oEvent.preventDefault();
            oEvent.stopPropagation();
            // the popup closes on Escape's keyup (dolPopup): that keyup is this dropdown's
            $this._bSwallowEscape = true;
            $this._closePanels(true);
            return;
        }
        if(oEvent.key == 'Enter' && $(oEvent.target).is('.bx-search-window-profile-input')) {
            oEvent.preventDefault();
            oPanel.find('.bx-search-window-person a').first().trigger('click');
            return;
        }
        if(oEvent.key != 'ArrowDown' && oEvent.key != 'ArrowUp')
            return;
        if($(oEvent.target).is('select, input[type=date], input[type=checkbox], input[type=radio]'))
            return;
        var aStops = oPanel.find('a[role=menuitem], a[role=option], .bx-search-window-profile-input').filter(':visible');
        var i = aStops.index(oEvent.target);
        oEvent.preventDefault();
        i = oEvent.key == 'ArrowDown' ? Math.min(i + 1, aStops.length - 1) : Math.max(i - 1, 0);
        aStops.eq(i).focus();
    });

    oRoot.on('keyup', function(oEvent) {
        if(oEvent.key == 'Escape' && $this._bSwallowEscape) {
            $this._bSwallowEscape = false;
            oEvent.stopPropagation();
        }
    });

    // a press outside a dropdown, or the keyboard leaving it, closes it
    $(document).on('mousedown.bx-search-window', function(oEvent) {
        var oTarget = $(oEvent.target);
        if(!oTarget.closest('.bx-search-window-panel, .bx-search-window-chip[data-panel]').length)
            $this._closePanels(false);
    });
    oRoot.on('focusout', '.bx-search-window-panel', function() {
        var oPanel = $(this);
        setTimeout(function() {
            var oActive = $(document.activeElement);
            if(!oPanel.hasClass('hidden') && !oActive.closest('.bx-search-window-panel').length && !oActive.closest('.bx-search-window-chip[data-panel]').length && oActive.closest(oRoot).length)
                $this._closePanels(false);
        }, 0);
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
    // "Open ↵" at the chosen row's end (CSS reads it from the link)
    oItem.children('a').attr('data-open', this._oRoot.find('.bx-search-window-results').attr('data-open') || '');
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
        $this._orderPills();
        $this._placeFilter();
        if($this._bFocusFilter) {
            $this._bFocusFilter = false;
            $this._oRoot.find('.bx-search-window-chip-add').focus();
        }
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
 * A pill was added (`sName` as its remove button names it): it goes to the end of the row.
 */
BxDolSearchWindow.prototype._added = function(sName)
{
    this._aOrder = $.grep(this._aOrder, function(s) { return s != sName; });
    this._aOrder.push(sName);
};

/**
 * The pills after "+ Filter" in the order they were added; those the window opened with (its scope) come first, in UNA's order.
 */
BxDolSearchWindow.prototype._orderPills = function()
{
    var aOrder = this._aOrder, oRow = this._oRoot.find('.bx-search-window-chips');
    var aPills = oRow.children('.bx-search-window-chip-wrap').filter(function() {
        return $(this).find('.bx-search-window-chip-remove').length > 0;
    }).get();
    var fIndex = function(el) {
        return aOrder.indexOf($(el).find('.bx-search-window-chip-remove').attr('data-remove'));
    };
    aPills.sort(function(a, b) {
        return fIndex(a) - fIndex(b);
    });
    $.each(aPills, function(i, el) {
        oRow.append(el);
    });
};

/**
 * In a block (Explore, the results page) "+ Filter" sits beside the field, as the feed's composer trigger's buttons: 44px,
 * icon-only below lg (its label stays its name). The chips come anew with each answer, so it is moved there each time.
 */
BxDolSearchWindow.prototype._placeFilter = function()
{
    if(!this._bPage)
        return;

    var oSlot = this._oRoot.find('.bx-search-window-filter-slot').empty();
    var oFilter = this._oRoot.find('.bx-search-window-chips .bx-search-window-chip-add');
    if(!oFilter.length)
        return;

    // labelled from lg (its name in the label), icon-only below
    oFilter.removeClass('bx-btn-small bx-btn-icon').addClass('bx-btn-icon-mobile').removeAttr('title');
    oFilter.children('span').addClass('bx-btn-icon-mobile-label').text(oFilter.attr('aria-label') || '');
    oSlot.append(oFilter.parent('.bx-search-window-chip-wrap').length ? oFilter.parent() : oFilter);
};

/**
 * A dropdown under the chips, opened from its chip ("+ Filter", a set filter's chip): the keyboard goes to its first row or field.
 */
BxDolSearchWindow.prototype._openPanel = function(sId, oTrigger)
{
    var oPanel = this._oRoot.find('#' + sId);
    if(!oPanel.length)
        return;

    this._oPanelTrigger = oTrigger && oTrigger.length ? oTrigger : this._oRoot.find('.bx-search-window-chip-add');
    this._oPanelTrigger.attr('aria-expanded', 'true');
    oPanel.removeClass('hidden');
    oPanel.find('.bx-search-window-profile-input, a[role=menuitem], a[role=option], input, select, button').filter(':visible').first().focus();
};

/**
 * Closes the open dropdown; `bFocus`: the keyboard goes back to what opened it.
 */
BxDolSearchWindow.prototype._closePanels = function(bFocus)
{
    var oOpen = this._oRoot.find('.bx-search-window-panel').not('.hidden');
    this._oRoot.find('.bx-search-window-chip[data-panel]').attr('aria-expanded', 'false');
    if(!oOpen.length)
        return;

    oOpen.addClass('hidden');
    if(bFocus && this._oPanelTrigger && this._oPanelTrigger.closest(document.documentElement).length)
        this._oPanelTrigger.focus();
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
                $this._oRoot.find('.bx-search-window-results').html($('<p class="bx-search-window-hint px-2 py-3 text-sm text-red-700 dark:text-red-400" role="alert"></p>').text(_t('_sys_search_window_error')));
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
