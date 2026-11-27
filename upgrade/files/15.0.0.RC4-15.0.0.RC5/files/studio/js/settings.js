/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Studio > Settings. A click on a group in the side menu swaps only the group's block (#bx-std-pc-content) for the one
 * settings.php answers to stg_action=get-page-by-type, and puts the group's own link in the address bar, so Back, Forward
 * and a refresh work as with full loads. The links stay real: a click with a modifier key, a browser without the History
 * API or any failed request simply follows the link. Hovering or focusing an item fetches its group ahead of the click.
 * Leaving a group with changes that aren't saved asks first, here and when the page itself is left.
 */
function BxDolStudioSettings(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioSettings' : oOptions.sObjName;
    this.sType = oOptions.sType == undefined ? '' : oOptions.sType;
    this.sTextUnsaved = oOptions.sTextUnsaved == undefined ? '' : oOptions.sTextUnsaved;

    this.sSelContent = '#bx-std-pc-content';
    this.sSelMenu = '#bx-std-pc-menu';
    this.sSelForm = 'form[name="adm-settings-form"]';
    this.sClassActive = 'bx-menu-tab-active';
    this.iPrefetchDelay = 80; // a pointer passing over the menu fetches nothing
    this.iPrefetchLifetime = 30000; // a group fetched ahead of a click is shown only while it is this fresh, in ms
    this.iLoadingDelay = 200; // the loader shows only for a slow answer

    this.oPrefetched = {}; // type => {request, time}
    this.oRequest = null; // the switch in progress
    this.iPrefetchTimer = 0;
    this.bDirty = false;
    this.sSnapshot = '';

    var $this = this;
    $(document).ready(function() {
        $this.init();
    });
}

BxDolStudioSettings.prototype.init = function() {
    var $this = this;

    this.snapshot();

    if(window.history && window.history.replaceState)
        window.history.replaceState({stgType: this.sType}, '', window.location.href);

    $(window).on('popstate', function(oEvent) {
        var oState = oEvent.originalEvent.state;
        if(!oState || !oState.stgType || oState.stgType == $this.sType)
            return;

        // the address has already changed: with changes not saved it goes back to this group until the switch is confirmed
        if($this.isDirty()) {
            var sType = oState.stgType;
            window.history.pushState({stgType: $this.sType}, '', $this.getUrl($this.sType));
            bx_confirm($this.sTextUnsaved, function() {
                $this.load(sType, true);
            });
            return;
        }

        $this.load(oState.stgType, false);
    });

    $(window).on('beforeunload', function(oEvent) {
        if(!$this.isDirty())
            return;

        oEvent.preventDefault();
        return (oEvent.originalEvent.returnValue = $this.sTextUnsaved);
    });

    // only what someone types or picks makes the group dirty, not the scripts that fill the form as it starts
    $(document).on('input change', this.sSelContent + ' ' + this.sSelForm, function(oEvent) {
        if(oEvent.originalEvent)
            $this.bDirty = true;
    });

    // a save makes what the form holds the saved state, and groups fetched before it may show old values
    $(document).on('bx-options-submitted', this.sSelContent + ' ' + this.sSelForm, function(oEvent, oData) {
        $this.oPrefetched = {};
        if(oData && parseInt(oData.code) == 0)
            $this.snapshot();
    });

    $(document).on('mouseenter focusin', this.sSelMenu + ' .bx-std-pmen-item > a', function() {
        var sType = $this.getTypeByItem(this);
        if(!sType)
            return;

        clearTimeout($this.iPrefetchTimer);
        $this.iPrefetchTimer = setTimeout(function() {
            $this.prefetch(sType);
        }, $this.iPrefetchDelay);
    });

    $(document).on('mouseleave', this.sSelMenu + ' .bx-std-pmen-item > a', function() {
        clearTimeout($this.iPrefetchTimer);
    });
};

/**
 * The side menu item's onclick. Returns false when the switch is handled here, true to let the browser follow the link.
 */
BxDolStudioSettings.prototype.changePage = function(sType, oEvent) {
    if(oEvent && (oEvent.ctrlKey || oEvent.metaKey || oEvent.shiftKey || oEvent.altKey || (oEvent.button != undefined && oEvent.button != 0)))
        return true;

    if(!window.history || !window.history.pushState || !window.Promise)
        return true;

    if(sType == this.sType && !this.oRequest)
        return false;

    var $this = this;
    if(this.isDirty()) {
        bx_confirm(this.sTextUnsaved, function() {
            $this.load(sType, true);
        });
        return false;
    }

    this.load(sType, true);
    return false;
};

BxDolStudioSettings.prototype.load = function(sType, bPush) {
    var $this = this;

    if(this.oRequest && this.oRequest.abort)
        this.oRequest.abort();

    var oRequest = this.take(sType);
    this.oRequest = oRequest;

    var iLoading = setTimeout(function() {
        bx_loading($this.sSelContent.slice(1), true);
    }, this.iLoadingDelay);

    var fDone = function() {
        clearTimeout(iLoading);
        bx_loading($this.sSelContent.slice(1), false);
        if($this.oRequest === oRequest)
            $this.oRequest = null;
    };

    oRequest.then(function(oData) {
        if($this.oRequest !== oRequest)
            return;

        fDone();

        if(!oData || parseInt(oData.code) != 0 || typeof(oData.content) != 'string') {
            $this.follow(sType);
            return;
        }

        $this.show(sType, oData.content, bPush);
    }, function(oXhr, sStatus) {
        if($this.oRequest !== oRequest)
            return;

        fDone();

        if(sStatus != 'abort')
            $this.follow(sType);
    });
};

/**
 * A switch that failed opens the group as a full page. The changes were confirmed to be left already, so it doesn't ask again.
 */
BxDolStudioSettings.prototype.follow = function(sType) {
    this.bDirty = false;
    document.location.href = this.getUrl(sType);
};

BxDolStudioSettings.prototype.show = function(sType, sContent, bPush) {
    var oContent = $(this.sSelContent);

    // the options' own script (options.html) runs as the block goes in and makes the group's oBxDolStudioOptions
    oContent.html(sContent).bxProcessHtml();
    if(typeof(bx_std_scrollbars) == 'function')
        bx_std_scrollbars();

    var oMenu = $(this.sSelMenu);
    oMenu.find('.bx-std-pmen-item.' + this.sClassActive).removeClass(this.sClassActive);
    var oItem = oMenu.find('#bx-std-pmi-' + sType).addClass(this.sClassActive);

    // the phone layout's menu is a row of tabs: the chosen one is brought into view, as on load (page.js)
    var oRow = oMenu.closest('.bx-std-page-column-cnt')[0];
    if(oItem.length && oRow && oRow.scrollWidth > oRow.clientWidth && window.matchMedia('(max-width: 767px)').matches)
        oRow.scrollLeft += oItem[0].getBoundingClientRect().left - oRow.getBoundingClientRect().left - (oRow.clientWidth - oItem[0].offsetWidth) / 2;

    if(bPush)
        window.history.pushState({stgType: sType}, '', this.getUrl(sType));

    this.sType = sType;
    this.snapshot();

    var oScroller = oContent.find(this.sSelForm + ' > .bx-form-advanced-wrapper')[0];
    if(oScroller)
        oScroller.scrollTop = 0;
};

/**
 * Fetches a group ahead of the click. A hover that ends in a click reuses this request.
 */
BxDolStudioSettings.prototype.prefetch = function(sType) {
    if(sType == this.sType || !window.Promise)
        return;

    var oEntry = this.oPrefetched[sType];
    if(oEntry && (Date.now() - oEntry.time) < this.iPrefetchLifetime)
        return;

    this.oPrefetched[sType] = {
        request: this.request(sType),
        time: Date.now()
    };
};

/**
 * The request for a group: the one prefetched, while it is fresh, or a new one. A prefetched answer is used once, so
 * coming back to a group later shows its current values.
 */
BxDolStudioSettings.prototype.take = function(sType) {
    var oEntry = this.oPrefetched[sType];
    delete this.oPrefetched[sType];

    if(oEntry && (Date.now() - oEntry.time) < this.iPrefetchLifetime)
        return oEntry.request;

    return this.request(sType);
};

BxDolStudioSettings.prototype.request = function(sType) {
    return $.ajax({
        url: this.sActionsUrl,
        method: 'GET',
        dataType: 'json',
        cache: false,
        data: {
            stg_action: 'get-page-by-type',
            stg_value: sType
        }
    });
};

BxDolStudioSettings.prototype.getUrl = function(sType) {
    return this.sActionsUrl + '?page=' + encodeURIComponent(sType);
};

BxDolStudioSettings.prototype.getTypeByItem = function(oLink) {
    var sId = $(oLink).closest('.bx-std-pmen-item').attr('id') || '';
    return sId.indexOf('bx-std-pmi-') === 0 ? sId.slice(11) : '';
};

BxDolStudioSettings.prototype.getState = function() {
    var oForm = $(this.sSelContent + ' ' + this.sSelForm);
    if(!oForm.length)
        return '';

    var sState = oForm.serialize();
    oForm.find('input[type="file"]').each(function() {
        sState += '&' + this.name + '=' + (this.value || '');
    });

    return sState;
};

BxDolStudioSettings.prototype.snapshot = function() {
    this.bDirty = false;
    this.sSnapshot = this.getState();
};

/**
 * Changed by someone and different from what was loaded or last saved: changing a value and changing it back is not a change.
 */
BxDolStudioSettings.prototype.isDirty = function() {
    return this.bDirty && this.getState() != this.sSnapshot;
};
/** @} */
