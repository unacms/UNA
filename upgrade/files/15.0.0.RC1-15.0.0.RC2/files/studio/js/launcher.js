/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioLauncher(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioLauncher' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'fast' : oOptions.iAnimationSpeed;
    this.bInit = oOptions.bInit == undefined ? true : oOptions.bInit;

    //--- Live region texts (BxBaseStudioLauncher::getPageJsCode): search results and moves in edit mode.
    this.sTxtMatches = oOptions.sTxtMatches == undefined ? '{0}' : oOptions.sTxtMatches;
    this.sTxtMatchesOne = oOptions.sTxtMatchesOne == undefined ? '{0}' : oOptions.sTxtMatchesOne;
    this.sTxtMoved = oOptions.sTxtMoved == undefined ? '{0}: {1}/{2}' : oOptions.sTxtMoved;

    //--- Jitter Settings ---//
    this.bJitterMode = false;
    this.aJitterConf = {
        item: '.bx-std-widget-icon',
        elements: '.bx-std-widget-actions,.bx-std-widget-icon-jitter,.bx-std-widget-caption-jitter'
    };

    this.aSortingConf = {
    	parent: '.bx-std-widgets',
        item: '.bx-std-widget',
        placeholder: 'bx-std-widget bx-std-widget-empty'
    };

    if(this.bInit)
    	this.init();
}

BxDolStudioLauncher.prototype.init = function() {
    var $this = this;

    $(document).ready(function() {
        var hammertime = new Hammer($('.bx-std-widgets').get(0));
        hammertime.get('press').set({time: 1000});
        hammertime.on('press', function(oEvent) {
            if(typeof oBxDolStudioContextMenu !== 'undefined' && oBxDolStudioContextMenu.justOpened())
                return; // the press opened a tile's context menu

            if(!$this.bJitterMode)
                $this.enableJitter();
            else
                $this.disableJitter();
        });

        //--- Desktop: put the cursor in the app search so typing filters straight away (no autofocus on touch, it would raise the keyboard; not while the intro tour holds focus).
        if(bx_is_mouse() && window.matchMedia('(min-width: 768px)').matches && !(typeof glTour !== 'undefined' && glTour.isActive()))
            $('li.bx-menu-tab-search:not(.bx-mt-compact) input[name="search"]').trigger('focus');

    	//--- Enable Sorting for Page Edit mode ---//
    	$($this.aSortingConf.parent).sortable({
            disabled: true,
            handle: '.bx-std-widget-icon-jitter',
            items: $this.aSortingConf.item,
            placeholder: $this.aSortingConf.placeholder,
            start: function(oEvent, oUi) {
                oUi.item.addClass('bx-std-widget-dragging');
            },
            stop: function(oEvent, oUi) {
                oUi.item.removeClass('bx-std-widget-dragging');
                $this.reorder(oUi.item);
            }
    	});
    });

    //--- Escape leaves edit mode; the search field and popups handle their own Escape first.
    window.addEventListener('keydown', function(oEvent) {
        if(oEvent.key !== 'Escape' || !$this.bJitterMode || $(oEvent.target).is('input, textarea, select') || $('.bx-popup-applied:visible').length)
            return;

        $this.disableJitter();
    });
};

BxDolStudioLauncher.prototype.browser = function(oLink, sType) {
    var $this = this;
    var oDate = new Date();

    if(sType == undefined)
        sType = '';

    var oBrowser = $('#bx-std-launcher-browser');
    if(oBrowser.length > 0) {
        var fBrowserShow = function() {
            oBrowser.dolPopup({
                closeOnOuterClick: true,
                pointer: {
                    el: '.bx-menu-breadcrumb .bx-menu-bc-' + (sType.length > 0 ? 'type' : 'home'),
                    align: 'left',
                    offset: '-16 0'
                },
                onBeforeShow: function(oPopup) {
                    $this.browserChangeType(oLink, sType);
                } 
            });
        }

        if(oBrowser.is(':visible'))
            oBrowser.dolPopupHide({
                onHide: function() {
                    if(oBrowser.find('.bx-std-lb-menu .bx-std-pmen-item.bx-std-pmen-item-' + sType + '.bx-menu-tab-active').length == 0)
                        fBrowserShow();
                }
            });
        else
            fBrowserShow();            

        return false;
    }

    $.get(
        this.sActionsUrl,
        {
            action: 'launcher-browser',
            type: sType,
            _t: oDate.getTime()
        },
        function(oData) {
            processJsonData(oData);
        },
        'json'
    );

    return false;
};

BxDolStudioLauncher.prototype.browserChangeType = function(oLink, sType) {
    var sMenuActive = 'bx-menu-tab-active';
    var sContentActive = 'bx-std-lbw-active';

    var oMenuActive = $('.bx-std-launcher-browser .bx-std-lb-menu .bx-std-pmen-item.' + sMenuActive);
    if(oMenuActive.hasClass('bx-std-pmen-item-' + sType))
        return;

    oMenuActive.removeClass(sMenuActive).siblings('.bx-std-pmen-item-' + sType).addClass(sMenuActive);
    $('.bx-std-launcher-browser .bx-std-lb-content .bx-std-lb-widgets.' + sContentActive).removeClass(sContentActive).siblings('.bx-std-lbw-' + sType).addClass(sContentActive);
};

BxDolStudioLauncher.prototype.updateCache = function() {
    var oDate = new Date();

    $.get(
        this.sActionsUrl,
        {
            action: 'launcher-update-cache',
            _t:oDate.getTime()
        }
    );
};

BxDolStudioLauncher.prototype.reorder = function(oDraggable) {
    var oDate = new Date();

    $.post(
        this.sActionsUrl + '?' + oDraggable.parent('.bx-std-widgets').sortable('serialize', {key: 'items[]'}),
        {
            action: 'launcher-reorder',
            page: this.sScrollCurrent,
            _t:oDate.getTime()
        },
        function(oData) {
            if(oData.code != 0) {
                bx_alert(oData.message);
                return;
            }
        },
        'json'
    );

    return true;
};

BxDolStudioLauncher.prototype.featured = function(sPageName, oLink) {
    var $this = this;
    var oDate = new Date();

    $.get(
        this.sActionsUrl,
        {
            action: 'page-featured',
            page: sPageName,
            _t: oDate.getTime()
        },
        function(oData) {
            $('.bx-popup-applied:visible').dolPopupHide();

            if(oData.code != 0) {
                bx_alert(oData.message);
                return;
            }

            var oSettings = $(oLink).parents('.bx-mod-popup-settings:first');
            if(oSettings.length > 0 && oData.widget_id != undefined && oData.widget.length > 0) {
                $('#bx-std-widget-' + oData.widget_id).replaceWith(oData.widget);
                if($this.bInit)
                    oBxDolStudioLauncher.enableJitter();
            }
            
            var sClassStatic = 'bx-menu-item-static';
            var sClassDivider = 'bx-menu-item-divider';
            var oItem = $('#bx-menu-item-' + sPageName).toggleClass(sClassStatic + ' bx-menu-item-dynamic'); // the acted-on app's dock item, not necessarily this page's
            if(oItem.hasClass(sClassStatic))
                $(oItem).insertBefore(oItem.siblings('.' + sClassDivider));
            else
                $(oItem).insertAfter(oItem.siblings(':last'));
        },
        'json'
    );
    return true;
};

BxDolStudioLauncher.prototype.bookmark = function(sPageName, oLink) {
    var oDate = new Date();

    $.get(
        this.sActionsUrl,
        {
            action: 'page-bookmark',
            page: sPageName,
            _t: oDate.getTime()
        },
        function(oData) {
            $('.bx-popup-applied:visible').dolPopupHide();

            if(oData.code != 0) {
                bx_alert(oData.message);
                return;
            }
            
            var sClassStatic = 'bx-menu-item-static';
            var sClassDivider = 'bx-menu-item-divider';
            var oItem = $('#bx-menu-item-' + sPageName).toggleClass(sClassStatic + ' bx-menu-item-dynamic'); // the acted-on app's dock item, not necessarily this page's
            if(oItem.hasClass(sClassStatic))
                $(oItem).insertBefore(oItem.siblings('.' + sClassDivider));
            else
                $(oItem).insertAfter(oItem.siblings(':last'));
        },
        'json'
    );

    return true;
};

BxDolStudioLauncher.prototype.rearrange = function(iWidgetId, oSelect) {
    var oDate = new Date();
    var oSelect = $(oSelect);
    var oPopup = oSelect.parents('.bx-popup');

    bx_loading(oPopup, true);

    $.get(
        this.sActionsUrl,
        {
            action: 'widget-rearrange',
            widget_id: iWidgetId,
            type: oSelect.val(),
            _t: oDate.getTime()
        },
        function(oData) {
            bx_loading(oPopup, false);

            processJsonData(oData);
        },
        'json'
    );

    return true;
};

BxDolStudioLauncher.prototype.enableJitter = function() {
    $(this.aJitterConf.elements).fadeIn('fast');
    $(this.aJitterConf.item).removeClass('bx-std-widget-icon-trans');
    $(this.aSortingConf.parent).addClass('bx-std-jitter').sortable('option', 'disabled', false);

    this.bJitterMode = true;
    this.markJitter();
};

BxDolStudioLauncher.prototype.disableJitter = function() {
    var oActive = $(document.activeElement);
    var oWidget = oActive.closest(this.aSortingConf.item);

    $(this.aJitterConf.elements).fadeOut('fast');	
    $(this.aJitterConf.item).addClass('bx-std-widget-icon-trans');
    $(this.aSortingConf.parent).removeClass('bx-std-jitter').sortable('option', 'disabled', true);

    this.bJitterMode = false;
    this.markJitter();

    //--- Keyboard focus was on a control that just went away: keep it on the same tile, or on the first one.
    if(oWidget.length && oActive.closest('.bx-std-widget-actions').length)
        oWidget.find('.bx-std-widget-icon .bx-std-widget-link').trigger('focus');
    else if(oActive.closest('#bx-std-launcher-edit').length)
        $(this.aSortingConf.parent + ' > ' + this.aSortingConf.item).filter(':visible').first().find('.bx-std-widget-icon .bx-std-widget-link').trigger('focus');
};

/**
 * Reflect edit mode on the Done bar and on the Manage Apps toggle in the account menu.
 */
BxDolStudioLauncher.prototype.markJitter = function() {
    var bOn = this.bJitterMode;

    $('#bx-std-launcher-edit').prop('hidden', !bOn);
    $('.bx-menu-account li.edit').toggleClass('bx-menu-tab-active', bOn).find('[aria-pressed]').attr('aria-pressed', bOn ? 'true' : 'false');
};

/**
 * Non-drag reordering for edit mode: shift one app past its visible neighbour, save, and announce the new position.
 */
BxDolStudioLauncher.prototype.move = function(oButton, iDirection) {
    var sItem = this.aSortingConf.item + ':visible';
    var oWidget = $(oButton).closest(this.aSortingConf.item);
    var oSibling = iDirection < 0 ? oWidget.prevAll(sItem).first() : oWidget.nextAll(sItem).first();
    if(!oSibling.length)
        return false;

    if(iDirection < 0)
        oWidget.insertBefore(oSibling);
    else
        oWidget.insertAfter(oSibling);

    $(oButton).trigger('focus');

    var oWidgets = oWidget.parent().children(sItem);
    this.announce(this.sTxtMoved.replace('{0}', oWidget.find('.bx-std-widget-caption').text().trim()).replace('{1}', oWidgets.index(oWidget) + 1).replace('{2}', oWidgets.length));

    return this.reorder(oWidget);
};

/**
 * Search feedback: the empty message when nothing matches, and the match count for screen readers.
 */
BxDolStudioLauncher.prototype.searchResult = function(sSearch, iCount) {
    $('#bx-std-launcher-empty').prop('hidden', !sSearch.length || iCount > 0);

    if(!sSearch.length)
        $('#bx-std-launcher-status').text('');
    else
        this.announce((iCount == 1 ? this.sTxtMatchesOne : this.sTxtMatches).replace('{0}', iCount));
};

/**
 * Polite live region of the launcher; cleared first so the same text is announced again.
 */
BxDolStudioLauncher.prototype.announce = function(sText) {
    var oStatus = $('#bx-std-launcher-status');
    if(!oStatus.length)
        return;

    oStatus.text('');
    clearTimeout(this.iAnnounceTimer);
    this.iAnnounceTimer = setTimeout(function() {
        oStatus.text(sText);
    }, 50);
};

/** @} */
