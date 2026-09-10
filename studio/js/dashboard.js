/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioDashboard(oOptions) {
	this.sActionsUrl = oOptions.sActionUrl;
    this.aStatusTitles = oOptions.aStatusTitles || {}; // ok / warn / fail / undef, as words
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioDashboard' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    var $this = this;
    $(document).ready(function() {
        // one polite live region for everything the page finishes asynchronously (see announce)
        $('<div id="bx-dbd-status" class="sr-only" role="status" aria-live="polite"></div>').appendTo($('#bx-std-page-content').first().length ? '#bx-std-page-content' : 'body');
    	$('.bx-dbd-block-content').bxProcessHtml();
    });
}

/**
 * Polite live region of the page; cleared first so the same text is announced again.
 */
BxDolStudioDashboard.prototype.announce = function(sText) {
    var oStatus = $('#bx-dbd-status');
    if(!oStatus.length || !sText)
        return;

    oStatus.text('');
    setTimeout(function() {
        oStatus.text(sText);
    }, 50);
};

/**
 * Block busy state while it fetches (aria-busy on .bx-std-block). The visible indicator is the pressed button's (loadingButton); a fetch
 * nothing was pressed for (the Server block's first load, a tab's first opening) shows the same wave inside the panel it fills (getLoader).
 */
BxDolStudioDashboard.prototype.loading = function(sDivId, bShow, oButton) {
    $('#' + sDivId).closest('.bx-std-block').attr('aria-busy', bShow ? 'true' : 'false');

    if(oButton)
        this.loadingButton(oButton, bShow);
};

/**
 * Trigger button loader: the Studio-wide one (page.js bx_std_loading_btn).
 */
BxDolStudioDashboard.prototype.loadingButton = function(oButton, bShow) {
    bx_std_loading_btn(oButton, bShow);
};

/**
 * The tile wave centred in a panel whose content is on its way (dashboard.css .bx-dbd-loading).
 */
BxDolStudioDashboard.prototype.getLoader = function() {
    return '<div class="bx-dbd-loading" aria-hidden="true"><span class="bx-std-btn-loading"></span></div>';
};

/**
 * Updates block: ask the server for the latest versions and fill the status rows. Runs when the page opens and from the
 * hero's "Check for updates" button, which shows the loader (and takes no clicks) while a check is in flight.
 */
BxDolStudioDashboard.prototype.checkForUpgrade = function() {
    var $this = this;
    var sDivId = 'bx-dbd-version';
    var oButton = $('#' + sDivId + ' .bx-dbd-version-check');

    $this.loading(sDivId, true, oButton);

    $.get(
        this.sActionsUrl,
        {
            dbd_action: 'check_for_upgrade',
            _t: new Date().getTime()
        },
        function(oData) {
            var oInfo = oData && oData.data ? oData.data : {};
            $this.setVersionRow('stable', oInfo.stable);
            $this.setVersionRow('beta', oInfo.beta);
            $this.setVersionRow('apps', oInfo.apps);

            // the rows changed silently: read them out, name, value and status
            var aOut = [];
            $('#' + sDivId + ' .bx-dbd-htools-item[id]').each(function() {
                var sName = $(this).find('.bx-dbd-htools-name').contents().first().text().trim();
                var sStatus = $(this).find('.bx-dbd-htools-status').text().trim();
                aOut.push(sName + ' ' + $(this).find('.bx-dbd-htools-value').text().trim() + (sStatus ? ' (' + sStatus.replace(/^,\s*/, '') + ')' : ''));
            });
            $this.announce(aOut.join(', '));

            // the Update button lives in the block caption, outside the block content
            if(oInfo.upgrade != undefined && parseInt(oInfo.upgrade) == 1)
                $('#' + sDivId).closest('.bx-std-block').find('.bx-dbd-version-update').show();
        },
        'json'
    ).always(function() {
        $this.loading(sDivId, false, oButton);
    });
};

/**
 * Updates block: fill a status row (Latest Stable, Latest Beta, Apps) from the update check: {status, name?, value}.
 */
BxDolStudioDashboard.prototype.setVersionRow = function(sRow, oRow) {
    var oItem = $('#bx-dbd-version-' + sRow);
    if(!oItem.length || !oRow)
        return;

    oItem.removeClass('bx-dbd-htools-item-ok bx-dbd-htools-item-warn bx-dbd-htools-item-fail bx-dbd-htools-item-undef').addClass('bx-dbd-htools-item-' + oRow.status);
    if(oRow.name)
        oItem.find('.bx-dbd-htools-name').contents().first().replaceWith(document.createTextNode(oRow.name));
    oItem.find('.bx-dbd-htools-status').text(this.aStatusTitles[oRow.status] ? ', ' + this.aStatusTitles[oRow.status] : '');
    oItem.find('.bx-dbd-htools-value').html(oRow.value);
};

/**
 * Version block: an update switch changed (the site's switch script has already flipped the checkbox and the on/off
 * classes); save the option and flip everything back if the save fails.
 */
BxDolStudioDashboard.prototype.toggleOption = function(sName, oInput) {
    var $this = this;
    var oSwitch = $(oInput).closest('.bx-switcher-cont');
    var bOn = oInput.checked;
    var fSet = function(bState) {
        oInput.checked = bState;
        oSwitch.toggleClass('on', bState).toggleClass('off', !bState);
        oSwitch.find('[role="switch"]').attr('aria-checked', bState ? 'true' : 'false');
    };

    fSet(bOn);

    $.post(
        this.sActionsUrl,
        {
            dbd_action: 'set_option',
            dbd_value: sName,
            dbd_state: bOn ? 1 : 0,
            _t: new Date().getTime()
        },
        function(oData) {
            if(oData && oData.code == 0)
                return;

            fSet(!bOn);
            if(oData && oData.message)
                $this.popup(oData.message);
        },
        'json'
    ).fail(function() {
        fSet(!bOn);
    });
};

BxDolStudioDashboard.prototype.performUpgrade = function() {
    var $this = this;
    var oDate = new Date();
    var sDivId = 'bx-dbd-version';
    var oButton = $('#' + sDivId).closest('.bx-std-block').find('.bx-dbd-version-update'); // the caption's Update button

    $this.loading(sDivId, true, oButton);

    $.post(
        this.sActionsUrl,
        {
            dbd_action: 'perform_upgrade',
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loading(sDivId, false, oButton);

            if(!oData.message)
                return;

            $this.popup(oData.message);
        },
        'json'
    );
};

BxDolStudioDashboard.prototype.checkHostParams = function() {
    var $this = this;

    $('#bx-dbd-htools').html(this.getLoader());
    this.getBlockContent('htools', function(oData) {
        if(oData.data)
            $this.replaceHostTools(oData.data);
    });
};

/**
 * Server block: swap in freshly rendered content (the Status tab shown, the Audit tab to be loaded again) and let the tabs be used.
 */
BxDolStudioDashboard.prototype.replaceHostTools = function(sContent) {
    var sDivId = 'bx-dbd-htools';

    $('#' + sDivId).replaceWith(sContent);

    var oBlock = $('#' + sDivId).bxProcessHtml().closest('.bx-std-block').attr('aria-busy', 'false');

    // the tabs stayed usable while the block loaded: show whichever one is selected (the fresh panels open on Status)
    var oSelected = oBlock.find('[role="tablist"] [role="tab"][aria-selected="true"]');
    if(oSelected.length)
        this.hostToolsTab(oSelected.attr('aria-controls').replace(sDivId + '-', ''), oSelected);

    // the gauges arrived silently: read them out
    var aOut = [];
    $('#' + sDivId + ' .bx-dbd-gauge-ring[aria-label]').each(function() {
        aOut.push($(this).attr('aria-label'));
    });
    this.announce(aOut.join(', '));
};

/**
 * Server block, Audit tab: run the audit again, redraw the block from the new report and come back to the Audit tab.
 */
BxDolStudioDashboard.prototype.runAudit = function(oButton) {
    var $this = this;
    var sDivId = 'bx-dbd-htools';
    oButton = $(oButton);

    $this.loading(sDivId, true, oButton);

    $.post(
        this.sActionsUrl,
        {
            dbd_action: 'run_audit'
        },
        function(oData) {
            if(!oData || !oData.data)
                return;

            $this.replaceHostTools(oData.data);
            $this.hostToolsTab('audit');
        },
        'json'
    ).always(function() {
        // the block is either replaced (the button with it) or left as it was, with its button usable again
        $this.loading(sDivId, false, oButton);
    });
};

/**
 * Server block, Audit tab: fold or unfold a section's rows.
 */
BxDolStudioDashboard.prototype.auditToggle = function(oButton) {
    var bOpen = $(oButton).attr('aria-expanded') != 'true';

    $(oButton).attr('aria-expanded', bOpen ? 'true' : 'false');
    $('#' + $(oButton).attr('aria-controls')).prop('hidden', !bOpen);
};

BxDolStudioDashboard.prototype.getBlockContent = function(sType, onComplete) {
    var $this = this;
    var oDate = new Date();
    var sDivId = 'bx-dbd-' + sType;

    $this.loading(sDivId, true);

    $.get(
        this.sActionsUrl,
        {
            dbd_action: 'get_block',
            dbd_value: sType,
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loading(sDivId, false);

            if(typeof onComplete == 'function')
                return onComplete(oData);

            if(!oData.data)
                return;

            $('#' + sDivId).replaceWith(oData.data);
        },
        'json'
    );
};

BxDolStudioDashboard.prototype.initChart = function(sType, oData) {
    this.showChart(sType, oData);
};

/**
 * Share chart drawn in place, no library: a hero panel with the "used" headline (and the capacity when known) over a stacked
 * bar with one slice per item, then a row per item with its icon, size, colour mark and, when the item can be cleared on its
 * own, a trash button.
 * oData is {items: [{name, bytes, size, icon: {url|svg}, type?, clear?, note?, note_alert?, url?}], used, used_bytes, total, total_bytes,
 * total_fail?, icon_clear?, bar?, action?}. With bar: false (the Queues block) it is a plain list: the headline and the
 * rows, without the bar and the colour marks; a row's note sits before its value (in red with note_alert), a row with a url
 * is a link to the page that manages it, and action names the method a row's clear button calls (clearCache by default).
 * A chart with a label (the Cache block) gets a compact label / stat line over its bar instead of the big headline, top
 * names that many of its largest items under the bar (top_zero lists items at zero too), and clear_all puts a "clear all" button under it. Several charts at once (the Space block:
 * local and remote storage) come as {charts: [{label, items, used, total, ...}], groups: [{items}]}: the hero stacks a
 * labelled chart per entry, the list shows one group of rows per chart, separated by a hairline; a row marked placeholder
 * has no colour mark.
 */
BxDolStudioDashboard.prototype.showChart = function(sType, oData) {
    var $this = this;
    var oChart = $('#bx-dbd-' + sType + ' .bx-dbd-chart');
    if(!oChart.length || !oData)
        return;

    var aCharts = oData.charts || [oData];
    var aGroups = oData.groups || [{items: oData.items || []}];
    var bRows = aCharts.length > 1 || !!aCharts[0].label;
    var bBar = oData.bar !== false;
    var sClear = oData.action || 'clearCache';
    var aColors = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#84cc16', '#06b6d4', '#f59e0b', '#ef4444', '#9ca3af'];
    var fAttr = function(s) { return String(s).replace(/"/g, '&quot;'); };

    var sHero = '';
    for(var c = 0; c < aCharts.length; c++) {
        var oC = aCharts[c];
        var aItems = oC.items || [];
        var fBase = oC.total_bytes > 0 ? oC.total_bytes : oC.used_bytes;

        var sSlices = '', sLabel = '';
        for(var i = 0; i < aItems.length; i++) {
            var oItem = aItems[i];
            var fShare = fBase > 0 ? oItem.bytes / fBase * 100 : 0;

            // Each slice names its item in the tooltip below.
            if(bBar && oItem.bytes > 0)
                sSlices += '<span class="bx-dbd-chart-slice" style="width:' + fShare.toFixed(2) + '%;background:' + aColors[i % aColors.length] + '" data-label="' + fAttr(oItem.name + ': ' + oItem.size) + '"></span>';

            sLabel += (sLabel ? ', ' : '') + oItem.name + ' ' + oItem.size;
        }

        // An unlabelled chart: the big headline. Labelled: a compact label / stat line over the bar.
        var sHead = bRows
            ? '<div class="bx-dbd-chart-head bx-dbd-chart-head-sm"><span class="bx-dbd-chart-label">' + oC.label + '</span><span class="bx-dbd-chart-stat">' + oC.used + (oC.total ? ' &middot; ' + oC.total : '') + '</span></div>'
            : '<div class="bx-dbd-chart-head"><span class="bx-dbd-chart-used">' + oC.used + '</span>' + (oC.total ? '<span class="bx-dbd-chart-total' + (oC.total_fail ? ' bx-dbd-chart-total-fail' : '') + '">' + oC.total + '</span>' : '') + '</div>';
        var sBar = bBar ? '<div class="bx-dbd-chart-bar" role="img" aria-label="' + fAttr((oC.label ? oC.label + ': ' : '') + (sLabel || oC.used)) + '">' + sSlices + '</div>' : '';

        // The largest items, biggest first (the Cache block lists its caches in a fixed order), written under the bar like the audit's outcome counts.
        var aTop = [];
        var aBySize = oC.top ? aItems.slice().sort(function(a, b) { return b.bytes - a.bytes; }) : [];
        for(var j = 0; j < aBySize.length && aTop.length < oC.top; j++)
            if(aBySize[j].bytes > 0 || oC.top_zero)
                aTop.push(aBySize[j].name + ' ' + aBySize[j].size);
        var sSummary = aTop.length ? '<div class="bx-dbd-chart-summary">' + aTop.join(' &middot; ') + '</div>' : '';

        sHero += bRows ? '<div class="bx-dbd-chart-row">' + sHead + sBar + sSummary + '</div>' : sHead + sBar + sSummary;
    }

    // The "clear all" button follows the chart in a foot row.
    if(oData.clear_all)
        sHero += '<div class="bx-dbd-chart-foot"><button type="button" class="bx-btn bx-dbd-chart-clear-all">' + oData.clear_all + '</button></div>';

    var sList = '';
    for(var g = 0; g < aGroups.length; g++) {
        var aRows = aGroups[g].items || [];

        var sRows = '';
        for(var i = 0; i < aRows.length; i++) {
            var oRow = aRows[i];

            // An app's own icon, or a Lucide glyph on the same gray tile the block headers use; both carry the tile's hairline ring.
            var sIcon = '';
            if(oRow.icon && oRow.icon.url)
                sIcon = '<span class="bx-dbd-tile bx-dbd-tile-app" aria-hidden="true"><img src="' + oRow.icon.url + '" alt=""></span>';
            else
                sIcon = '<span class="bx-dbd-tile" aria-hidden="true">' + (oRow.icon && oRow.icon.svg ? oRow.icon.svg : '') + '</span>';

            // A row that can be cleared on its own ends with an icon-only trash button (the label is its accessible name).
            var sAction = '';
            if(oRow.clear && oRow.type && oData.icon_clear && oData.icon_clear.svg)
                sAction = '<button type="button" class="bx-btn bx-dbd-chart-action" data-type="' + oRow.type + '" title="' + fAttr(oRow.clear) + '" aria-label="' + fAttr(oRow.clear) + '">' + oData.icon_clear.svg + '</button>';

            // A mark in the row's bar colour, right after the value, ties the row to its slice; a note (a file count, or failed jobs) sits before the value.
            var sMark = bBar && !oRow.placeholder ? '<span class="bx-dbd-chart-mark" style="background:' + aColors[i % aColors.length] + '" aria-hidden="true"></span>' : '';
            var sNote = oRow.note ? '<span class="bx-dbd-chart-note' + (oRow.note_alert ? ' bx-dbd-chart-note-alert' : '') + '">' + oRow.note + '</span>' : '';
            var sCells = sIcon + '<span class="bx-dbd-chart-name">' + oRow.name + '</span>' + sNote + '<span class="bx-dbd-chart-size">' + oRow.size + '</span>' + sMark + sAction;
            sRows += oRow.url ? '<a class="bx-dbd-chart-item bx-dbd-chart-link" href="' + fAttr(oRow.url) + '">' + sCells + '</a>' : '<div class="bx-dbd-chart-item">' + sCells + '</div>';
        }

        sList += '<div class="bx-dbd-chart-group">' + sRows + '</div>';
    }

    oChart.html(
        '<div class="bx-dbd-hero bx-dbd-chart-hero' + (bRows ? ' bx-dbd-chart-hero-rows' : '') + '">' + sHero + '</div>' +
        '<div class="bx-dbd-chart-list">' + sList + '</div>'
    );

    this.bindChartTips(oChart);

    if(typeof $this[sClear] != 'function')
        return;

    oChart.find('.bx-dbd-chart-action').on('click', function() {
        $this[sClear]($(this).data('type'), this);
        return false;
    });
    oChart.find('.bx-dbd-chart-clear-all').on('click', function() {
        $this[sClear]('all', this);
        return false;
    });
};

/**
 * Hovering a bar slice shows its data-label above the bar, in a tip that lives in the hero (the bar clips to its rounded
 * corners). Binds every bar under oScope: a chart block's, or the Audit tab's outcome bar.
 */
BxDolStudioDashboard.prototype.bindChartTips = function(oScope) {
    var oHero = oScope.find('.bx-dbd-chart-hero');
    if(!oHero.length)
        return;

    var oTip = $('<div class="bx-dbd-chart-tip" role="tooltip" hidden></div>').appendTo(oHero);
    oScope.find('.bx-dbd-chart-slice').on('mouseenter', function() {
        var oSlice = $(this);
        var oBar = oSlice.parent();
        oTip.text(oSlice.data('label')).prop('hidden', false);

        var iHalf = oTip.outerWidth() / 2;
        var iLeft = oSlice.offset().left - oHero.offset().left + oSlice.outerWidth() / 2;
        oTip.css({
            left: Math.min(Math.max(iLeft, iHalf), oHero.innerWidth() - iHalf),
            top: oBar.offset().top - oHero.offset().top - oTip.outerHeight() - 6
        });
    }).on('mouseleave', function() {
        oTip.prop('hidden', true);
    });
};

/**
 * Clear one item (or 'all') of a chart block and redraw it from the returned data; a string comes back when the block has nothing left to chart.
 */
BxDolStudioDashboard.prototype.clearChartItem = function(sBlock, sAction, sType, oButton) {
    var $this = this;
    var oDate = new Date();
    var sDivId = 'bx-dbd-' + sBlock;

    $this.loading(sDivId, true, oButton);

    $.post(
        this.sActionsUrl,
        {
            dbd_action: sAction,
            dbd_value: sType,
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loading(sDivId, false, oButton);

            if(oData.message != undefined && oData.message.length > 0)
                $this.popup(oData.message, function() {
                    // the control that was used is redrawn with the chart: hand focus to the block's first control
                    return $('#' + sDivId).find('button, a[href]').first().get(0);
                });

            if(oData.data == undefined)
                return;

            if(typeof oData.data == 'object')
                $this.showChart(sBlock, oData.data);
            else if(typeof oData.data == 'string')
                $('#' + sDivId).html(oData.data);
        },
        'json'
    );
};

BxDolStudioDashboard.prototype.clearCache = function(sType, oButton) {
    this.clearChartItem('cache', 'clear_cache', sType, oButton);
};

BxDolStudioDashboard.prototype.clearQueue = function(sType, oButton) {
    this.clearChartItem('queues', 'clear_queue', sType, oButton);
};

/**
 * Server block: show one tab's panel. Audit and permissions panels fetch their report the first time they open.
 */
BxDolStudioDashboard.prototype.hostToolsTab = function(sTab, oTab) {
    var $this = this;
    var sDivId = 'bx-dbd-htools';
    var oBlock = $('#' + sDivId).closest('.bx-std-block');
    var oPanel = $('#' + sDivId + '-' + sTab);
    if(!oPanel.length)
        return;

    oTab = oTab ? $(oTab) : $('#' + sDivId + '-tab-' + sTab);
    oBlock.find('[role="tablist"] [role="tab"]').attr({'aria-selected': 'false', 'tabindex': '-1'});
    oTab.attr({'aria-selected': 'true', 'tabindex': '0'});

    oBlock.find('.bx-dbd-htools-panel').prop('hidden', true);
    oPanel.prop('hidden', false);

    var sAction = oPanel.data('action');
    if(!sAction || oPanel.data('loaded'))
        return;

    oPanel.data('loaded', true).html($this.getLoader());
    $this.loading(sDivId, true);

    $.get(
        this.sActionsUrl,
        {
            dbd_action: sAction,
            _t: new Date().getTime()
        },
        function(sData) {
            $this.loading(sDivId, false);

            if(!sData.length) {
                oPanel.data('loaded', false).empty();
                return;
            }

            oPanel.html(sData).bxProcessHtml();
            $this.bindChartTips(oPanel);
        },
        'html'
    ).fail(function() {
        // the tab can be tried again after a failed request
        $this.loading(sDivId, false);
        oPanel.data('loaded', false).empty();
    });
};

/**
 * Arrow keys move between the Server block's tabs, as a tablist expects.
 */
BxDolStudioDashboard.prototype.hostToolsTabKey = function(oEvent, oTab) {
    var iStep = oEvent.key == 'ArrowRight' ? 1 : (oEvent.key == 'ArrowLeft' ? -1 : 0);
    var bEdge = oEvent.key == 'Home' || oEvent.key == 'End';
    if(!iStep && !bEdge)
        return;

    var oTabs = $(oTab).closest('[role="tablist"]').find('[role="tab"]');
    var oNext = bEdge ? oTabs.eq(oEvent.key == 'Home' ? 0 : oTabs.length - 1) : $(oTabs.get((oTabs.index(oTab) + iStep + oTabs.length) % oTabs.length));

    oEvent.preventDefault();
    oNext.focus();
    this.hostToolsTab(oNext.attr('aria-controls').replace('bx-dbd-htools-', ''), oNext);
};

/**
 * A message in a modal popup. The dialog is named by its text and takes focus, so it is read out and Escape closes it;
 * afterwards focus goes back to the control that was used, or to what fFocusBack() returns when that control is gone.
 */
BxDolStudioDashboard.prototype.popup = function(sValue, fFocusBack) {
    var sId = 'bx-std-dbd-popup';
    var oLast = document.activeElement;

    $('#' + sId).remove();
    $('<div id="' + sId + '" style="display: none;"></div>').prependTo('body').html(sValue);
    $('#' + sId).dolPopup({
        closeElement: '.bx-std-action-result-close, .bx-popup-element-close', // the outcome dialog's own close button (it carries no site popup class, whose hover rule would move it)
        onShow: function(oPopup) {
            var oDialog = oPopup.find('[role="dialog"]').first();
            if(!oDialog.length)
                oDialog = oPopup;

            // an outcome dialog (page_action_result.html) is an alert dialog named by its message, and focus lands on its Close button
            var oText = oPopup.find('.bx-std-action-result-cnt').first();
            if(oText.length) {
                if(!oText.attr('id'))
                    oText.attr('id', sId + '-text');

                oDialog.attr({'role': 'alertdialog', 'aria-labelledby': oText.attr('id')});
            }
            else
                oDialog.attr('aria-label', oPopup.text().trim().replace(/\s+/g, ' ').slice(0, 200));

            oDialog.attr('tabindex', '-1');

            var oClose = oPopup.find('.bx-std-action-result-close').first();
            (oClose.length ? oClose : oDialog).get(0).focus();
        },
        onHide: function() {
            var oBack = oLast && document.contains(oLast) && oLast !== document.body ? oLast : (typeof fFocusBack == 'function' ? fFocusBack() : null);
            if(oBack)
                oBack.focus();
        }
    });
};
/**
 * Users block: the chart in the hero, under the charted series' figure for the period and its title, and the rows under it as its legend,
 * each showing its own figure for the period; on the hero's right, how many of the charted series are online now. oData is {period,
 * series_default, periods: {name: {title, label, type}}, series: {name: {title, online, periods: {name: [{label, title, count, total?}]}}},
 * txt_peak}; everything comes with the block, so the period
 * tabs in the block caption (dbd_users_tabs.html) and the rows only redraw. 'bars' periods: a bar per bucket, as tall as its share of the
 * period's peak, the newest one solid, each naming its bucket and count in the slice tooltip. 'line' (the Total tab, first and selected): the
 * running total as a line over the whole period with the area under it tinted, a transparent column per bucket carrying the tooltip.
 */
BxDolStudioDashboard.prototype.initUsersChart = function(oData) {
    this.oUsersData = oData;
    this.sUsersPeriod = oData && oData.period ? oData.period : 'all';
    this.sUsersSeries = oData && oData.series_default ? oData.series_default : 'accounts';
    this.usersDraw();
};

/**
 * A period tab in the block caption was chosen.
 */
BxDolStudioDashboard.prototype.usersPeriod = function(sPeriod, oTab) {
    var oData = this.oUsersData;
    if(!oData || !oData.periods || !oData.periods[sPeriod])
        return;

    var oBlock = $('#bx-dbd-users').closest('.bx-std-block');
    oTab = oTab ? $(oTab) : oBlock.find('[role="tab"][data-period="' + sPeriod + '"]');
    oBlock.find('[role="tab"]').attr({'aria-selected': 'false', 'tabindex': '-1'});
    oTab.attr({'aria-selected': 'true', 'tabindex': '0'});
    oBlock.find('#bx-dbd-users-chart').attr('aria-labelledby', oTab.attr('id') || null);

    this.sUsersPeriod = sPeriod;
    this.usersDraw();
};

/**
 * A row was pressed: its series is the one charted.
 */
BxDolStudioDashboard.prototype.usersSeries = function(sSeries, oRow) {
    var oData = this.oUsersData;
    if(!oData || !oData.series || !oData.series[sSeries])
        return;

    var oBlock = $('#bx-dbd-users').closest('.bx-std-block');
    oBlock.find('.bx-dbd-users-row').attr('aria-pressed', 'false');
    (oRow ? $(oRow) : oBlock.find('.bx-dbd-users-row[data-series="' + sSeries + '"]')).attr('aria-pressed', 'true');

    this.sUsersSeries = sSeries;
    this.usersDraw();
};

/**
 * Draw the chosen series over the chosen period.
 */
BxDolStudioDashboard.prototype.usersDraw = function() {
    var oData = this.oUsersData;
    var oPeriod = oData && oData.periods ? oData.periods[this.sUsersPeriod] : null;
    var oSeries = oData && oData.series ? oData.series[this.sUsersSeries] : null;
    if(!oPeriod || !oSeries)
        return;

    var oBlock = $('#bx-dbd-users').closest('.bx-std-block');
    var fAttr = function(s) { return String(s).replace(/"/g, '&quot;'); };

    var aItems = (oSeries.periods && oSeries.periods[this.sUsersPeriod]) || [], iMax = 0, iTotal = 0;
    for(var i = 0; i < aItems.length; i++) {
        iTotal += aItems[i].count;
        iMax = Math.max(iMax, aItems[i].count);
    }

    var bLine = oPeriod.type == 'line';
    var sChart = '';
    if(bLine) {
        // the running total, scaled to the chart's 100 units with 4 kept above the highest point; one bucket still draws as a flat line
        var iLast = aItems.length ? aItems[aItems.length - 1].total : 0;
        var iSteps = Math.max(aItems.length - 1, 1), iW = iSteps * 10, iH = 100;
        var aPoints = [], sHits = '';
        for(var j = 0; j < aItems.length; j++) {
            var oItem = aItems[j];
            var fY = iLast > 0 ? iH - oItem.total / iLast * (iH - 4) : iH;
            aPoints.push((aItems.length > 1 ? j * 10 : 0) + ',' + fY.toFixed(1));
            if(aItems.length == 1)
                aPoints.push(iW + ',' + fY.toFixed(1));

            sHits += '<span class="bx-dbd-chart-slice bx-dbd-users-hit" data-label="' + fAttr(oItem.title + ': ' + oItem.total) + '"></span>';
        }

        sChart = '<svg class="bx-dbd-users-line-svg" viewBox="0 0 ' + iW + ' ' + iH + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<polygon class="bx-dbd-users-line-area" points="0,' + iH + ' ' + aPoints.join(' ') + ' ' + iW + ',' + iH + '"></polygon>' +
            '<polyline class="bx-dbd-users-line-path" points="' + aPoints.join(' ') + '" vector-effect="non-scaling-stroke"></polyline>' +
            '</svg><div class="bx-dbd-users-hits">' + sHits + '</div>';
        iTotal = iLast;
    }
    else {
        for(var k = 0; k < aItems.length; k++) {
            var oBar = aItems[k];
            var fShare = iMax > 0 ? oBar.count / iMax * 100 : 0;
            sChart += '<span class="bx-dbd-chart-slice bx-dbd-users-bar' + (k == aItems.length - 1 ? ' bx-dbd-users-bar-last' : '') + '" style="height:' + fShare.toFixed(1) + '%" data-label="' + fAttr(oBar.title + ': ' + oBar.count) + '"></span>';
        }
    }

    // every series row shows its figure for the period (the running total on the Total tab), and the hero names the charted one with its figure
    var sPeriod = this.sUsersPeriod;
    var fFigure = function(oOne) {
        var aList = (oOne.periods && oOne.periods[sPeriod]) || [], iSum = 0;
        for(var n = 0; n < aList.length; n++)
            iSum += aList[n].count;
        return bLine && aList.length ? aList[aList.length - 1].total : iSum;
    };
    for(var sName in oData.series)
        oBlock.find('.bx-dbd-users-row[data-series="' + sName + '"] .bx-dbd-htools-value').text(fFigure(oData.series[sName]).toLocaleString());
    oBlock.find('.bx-dbd-users-total').text(iTotal.toLocaleString());
    oBlock.find('.bx-dbd-users-caption').text(oSeries.title);

    // on the right, how many of the charted series are online now (a live figure, the same for every period)
    var iOnline = parseInt(oSeries.online) || 0;
    oBlock.find('.bx-dbd-users-online-count').text(iOnline.toLocaleString());
    oBlock.find('.bx-dbd-users-online').toggleClass('bx-dbd-users-online-on', iOnline > 0);

    // the chart's accessible name: the series over the period, its total and its peak bucket's count
    var sPeak = iMax > 0 && oData.txt_peak ? ', ' + oData.txt_peak.replace('{0}', iMax) : '';
    oBlock.find('.bx-dbd-users-bars').toggleClass('bx-dbd-users-line', bLine).toggleClass('bx-dbd-users-bars-dense', !bLine && aItems.length > 14).attr('aria-label', fAttr(oSeries.title + ', ' + oPeriod.label + ': ' + iTotal + sPeak)).html(sChart);

    // the tooltip is bound to the slices, so it is rebuilt with them
    oBlock.find('.bx-dbd-chart-tip').remove();
    this.bindChartTips(oBlock);
};

/**
 * Arrow keys move between the period tabs, as a tablist expects.
 */
BxDolStudioDashboard.prototype.usersPeriodKey = function(oEvent, oTab) {
    var iStep = oEvent.key == 'ArrowRight' ? 1 : (oEvent.key == 'ArrowLeft' ? -1 : 0);
    var bEdge = oEvent.key == 'Home' || oEvent.key == 'End';
    if(!iStep && !bEdge)
        return;

    var oTabs = $(oTab).closest('[role="tablist"]').find('[role="tab"]');
    var oNext = bEdge ? oTabs.eq(oEvent.key == 'Home' ? 0 : oTabs.length - 1) : $(oTabs.get((oTabs.index(oTab) + iStep + oTabs.length) % oTabs.length));

    oEvent.preventDefault();
    oNext.focus();
    this.usersPeriod(oNext.data('period'), oNext);
};

/** @} */
