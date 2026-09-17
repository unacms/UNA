/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioMenuTop(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioMenuTop' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    bx_set_color_scheme_html();

    var $this = this;
    $(document).ready(function() {
        $this.markTheme();
        $this.searchInit();
    });

    //--- Theme radios: arrows move between the options and apply them, as in a native radio group.
    $(document).on('keydown', '.bx-theme-toggle [role="radio"]', function(oEvent) {
        var aKeys = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1};
        if(!(oEvent.key in aKeys))
            return true;

        var oOptions = $(this).closest('.bx-theme-toggle').find('[role="radio"]');
        oOptions.eq((oOptions.index(this) + aKeys[oEvent.key] + oOptions.length) % oOptions.length).trigger('focus').trigger('click');
        return false;
    });
}

/**
 * Launcher search sizing: the field needs at least 12rem next to the launcher icon; when the left
 * header section can't give it that, the item collapses to a trigger button (.bx-mt-compact).
 */
BxDolStudioMenuTop.prototype.searchInit = function() {
    var $this = this;
    var oLeft = document.querySelector('.bx-std-menu-top-left');
    var oItem = oLeft ? oLeft.querySelector('li.bx-menu-tab-search') : null;
    if(!oItem || typeof ResizeObserver === 'undefined')
        return;

    var iMinField = 192; // min-w-48

    this.fSearchMeasure = function() {
        if(oItem.classList.contains('bx-mt-active'))
            return; // the open field owns the header, don't re-measure until it closes

        var iSiblings = 0;
        $(oItem).siblings(':visible').each(function() {
            iSiblings += $(this).outerWidth(true);
        });

        var oStyle = getComputedStyle(oLeft);
        var iAvailable = oLeft.clientWidth - parseFloat(oStyle.paddingLeft) - parseFloat(oStyle.paddingRight) - iSiblings;

        oItem.classList.toggle('bx-mt-compact', iAvailable < iMinField);
    };

    new ResizeObserver(this.fSearchMeasure).observe(oLeft);
    this.fSearchMeasure();
};

BxDolStudioMenuTop.prototype.searchClose = function(oItem) {
    oItem = $(oItem).closest('li.bx-menu-tab-search');
    if(!oItem.hasClass('bx-mt-active'))
        return;

    oItem.removeClass('bx-mt-active');
    oItem.find('.bx-std-search-trigger').attr('aria-expanded', 'false');

    if(typeof this.fSearchMeasure == 'function')
        this.fSearchMeasure();
};

BxDolStudioMenuTop.prototype.searchKey = function(oEvent) {
    var oInput = $(oEvent.target);

    if(oEvent.key == 'Enter') {
        var oPick = $('.bx-std-widgets .bx-std-widget-icon-pick .bx-std-widget-link:first');
        if(oInput.val() != '' && oPick.length)
            oPick[0].click(); // the tile link carries the app URL or its onclick handler
        return false;
    }

    if(oEvent.key != 'Escape')
        return true;

    if(oInput.val() != '') {
        oInput.val('');
        this.searchWidget(oEvent);
        return false;
    }

    var oItem = oInput.closest('li.bx-menu-tab-search');
    if(oItem.hasClass('bx-mt-compact')) {
        this.searchClose(oItem);
        oItem.find('.bx-std-search-trigger').trigger('focus');
    }
    else
        oInput.trigger('blur');

    return false;
};

BxDolStudioMenuTop.prototype.searchBlur = function(oInput) {
    var oItem = $(oInput).closest('li.bx-menu-tab-search');
    if(oItem.hasClass('bx-mt-compact') && $(oInput).val() == '')
        this.searchClose(oItem);
};

BxDolStudioMenuTop.prototype.setTheme = function(oButton, iCode) {
    bx_set_color_scheme(iCode);

    this.markTheme();
};

/**
 * Reflect the stored theme ('auto', 'sun' or 'dark') on the segmented control in the account menu.
 */
BxDolStudioMenuTop.prototype.markTheme = function() {
    var sTheme = bx_get_color_scheme();

    $('.bx-theme-option').each(function() {
        var bChecked = $(this).data('bx-theme') == sTheme;
        $(this).attr('aria-checked', bChecked ? 'true' : 'false').attr('tabindex', bChecked ? '0' : '-1');
    });
};

BxDolStudioMenuTop.prototype.clickEdit = function(oItem) {
    $('.bx-popup-applied:visible').dolPopupHide();

    if(oBxDolStudioLauncher.bJitterMode)
        oBxDolStudioLauncher.disableJitter();
    else
        oBxDolStudioLauncher.enableJitter();
};

BxDolStudioMenuTop.prototype.clickLogout = function(oItem) {
    $(oItem).parent().toggleClass('bx-menu-tab-active');
};

BxDolStudioMenuTop.prototype.searchToggle = function(oLink) {
    var oItem = $(oLink).closest('li.bx-menu-tab-search');

    oItem.toggleClass('bx-mt-active');

    var bActive = oItem.hasClass('bx-mt-active');
    $(oLink).attr('aria-expanded', bActive ? 'true' : 'false');
    if(bActive)
        oItem.find('input[name="search"]').trigger('focus');

    return false;
};

BxDolStudioMenuTop.prototype.searchWidget = function(oEvent) {
    this.searchFilter($(oEvent.target));
};

/**
 * Show the apps whose name starts with the field's text (every app for an empty field), pick the first one for Enter
 * and report the count; one pass per pause in typing.
 */
BxDolStudioMenuTop.prototype.searchFilter = function(oInput) {
    var $this = this;

    // the clear button shows only while there is something to clear
    oInput.siblings('.bx-std-search-clear').prop('hidden', !oInput.val().length);

    clearTimeout(this.iSearchTimer);
    this.iSearchTimer = setTimeout(function () {
        var sSearch = oInput.val().toLowerCase();
        var oWidgets = $('.bx-std-widgets > .bx-std-widget');

        oWidgets.each(function() {
            $(this).toggle(!sSearch.length || String($(this).data('name')).toLowerCase().indexOf(sSearch) === 0);
        });

        var oVisible = oWidgets.filter(':visible');
        $this.searchPick(sSearch.length ? oVisible.first() : null);

        if(typeof oBxDolStudioLauncher !== 'undefined')
            oBxDolStudioLauncher.searchResult(sSearch, oVisible.length);
    }, 100);
};

/**
 * The field's clear button: empty the field, show every app again and hand focus back to the field.
 */
BxDolStudioMenuTop.prototype.searchClear = function(oButton) {
    var oInput = $(oButton).siblings('input');
    if(!oInput.length)
        return false;

    oInput.val('');
    this.searchFilter(oInput);
    oInput.trigger('focus');

    return false;
};

/**
 * Highlight one tile as the choice Enter will open (the first match while filtering); pass null to clear.
 */
BxDolStudioMenuTop.prototype.searchPick = function(oWidget) {
    var sClass = 'bx-std-widget-icon-pick';

    $('.bx-std-widgets .' + sClass).removeClass(sClass);
    if(oWidget && oWidget.length)
        oWidget.find('.bx-std-widget-icon').addClass(sClass);
};

/** @} */
