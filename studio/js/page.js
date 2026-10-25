/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioPage(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioPage' : oOptions.sObjName;
    this.sCodeMirror = oOptions.sCodeMirror == undefined ? '' : oOptions.sCodeMirror;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this.oPopupOptions = {
        fog: {
            color: '#fff',
            opacity: .7
        },
        closeOnOuterClick: false
    };
    
    var $this = this;
    $(document).ready (function () {
    	if($this.sCodeMirror != '')
            $this.initCodeMirror($this.sCodeMirror);
    });
}

BxDolStudioPage.prototype.processJson = function (oData) {
    bx_loading('bx-std-page-columns', false);

    processJsonData(oData);
};

BxDolStudioPage.prototype.togglePopup = function(sName, oLink) {
    var $this = this;

    var sId = '#bx-std-pcap-menu-popup-' + sName;
    if(sName == 'actions' && $(sId).length == 0)
        sId = '#bx-std-pmenu-popup-' + sName;

    if($(sId + ':visible').length > 0) {
        $(sId).dolPopupHide();
        return;
    }

    $(oLink).parent().addClass('bx-menu-tab-active');

    var oPopupOptions = {
        pointer:{
            el:$(oLink)
        },
        onHide: function() {
            $(oLink).parent().removeClass('bx-menu-tab-active');
        }
    };

    switch(sName) {
        case 'assistant':
            break;

        case 'help':
            oPopupOptions = $.extend({}, oPopupOptions, {
                onBeforeShow: function() {
                    var oPopup = $(sId);
                    var oPopupRss = oPopup.find('.RSSAggrCont');
                    if(oPopupRss.contents().length)
                        return;

                    oPopupRss.dolRSSFeed({
                        onError: function() {
                            oPopupRss.html(_t('_adm_txt_show_help_content_empty'));
                            oPopup._dolPopupSetPosition(oPopupOptions);
                        },
                        onShow: function() {
                            oPopup._dolPopupSetPosition(oPopupOptions);
                        }
                    });

                    oPopup._dolPopupSetPosition(oPopupOptions);
                }
            });
            break;
    }

    if($(sId).html().length > 0)
        $(sId).dolPopup(oPopupOptions);
};

BxDolStudioPage.prototype.initCodeMirror = function(sSelector) {
    var oSelector = $(sSelector);
    for(var i = 0; i < oSelector.length; i++) {
        var e = CodeMirror.fromTextArea(oSelector.get(i), {
            lineNumbers: true,
            mode: "htmlmixed",
            htmlMode: true,
            matchBrackets: true
        });
    }
};

/**
 * Phone layout: the page menu is a horizontal row of tabs, so the active one is brought into view on load.
 */
$(document).ready(function() {
    if(!window.matchMedia('(max-width: 767px)').matches)
        return;

    var oMenu = document.querySelector('.bx-std-page-column.bx-std-page-menu');
    var oActive = oMenu ? oMenu.querySelector('.bx-std-pmen-item.bx-menu-tab-active') : null;
    if(!oActive || oMenu.scrollWidth <= oMenu.clientWidth)
        return;

    // the row scrolls on its own; scrollIntoView would move every scrollable ancestor, the page included
    oMenu.scrollLeft += oActive.getBoundingClientRect().left - oMenu.getBoundingClientRect().left - (oMenu.clientWidth - oActive.offsetWidth) / 2;
});


/**
 * Overlay scrollbar for a block's scroll box (div.bx-std-block-content, see page.css): bx_scrollbar_overlay (inc/js/functions.js) draws
 * a track and a thumb over the block, along the box's right edge and round its rounded corners, with the block's own class names.
 */
function bx_std_scrollbars(sSelector) {
    $(sSelector || 'div.bx-std-block-content').each(function() {
        bx_std_scrollbar(this);
    });
}

function bx_std_scrollbar(oScroller) {
    var oBlock = $(oScroller).closest('div.bx-std-block')[0];
    if(!oBlock)
        return;

    bx_scrollbar_overlay(oScroller, oBlock, {
        svg: 'bx-std-scrollbar',
        track: 'bx-std-scrollbar-track',
        thumb: 'bx-std-scrollbar-thumb',
        scroller: '', // page.css hides the native bar of div.bx-std-block-content
        scrolling: 'bx-std-scrolling',
        hover: '' // page.css shows the bar on div.bx-std-block:hover
    });
}

$(document).ready(function() {
    bx_std_scrollbars();
});

/**
 * Button loader (the launcher's tile wave, page.css .bx-std-btn-loading) for a button whose request is in flight: the button is disabled
 * and its label gives way to the wave at the button's width, so nothing moves; the label (and the button) comes back when the request
 * ends. The label stays the accessible name meanwhile. Replaces the site's bx_loading_btn spinner in Studio.
 */
function bx_std_loading_btn(oButton, bShow) {
    oButton = $(oButton);
    if(!oButton.length)
        return;

    if(bShow) {
        if(oButton.data('bx-loading'))
            return;

        oButton.data('bx-loading', {html: oButton.html(), label: oButton.attr('aria-label'), disabled: oButton.prop('disabled') || oButton.hasClass('bx-btn-disabled')});
        if(!oButton.attr('aria-label'))
            oButton.attr('aria-label', oButton.text().trim());

        oButton.css('min-width', oButton.outerWidth() + 'px').prop('disabled', true).attr('aria-disabled', 'true').addClass('bx-btn-disabled bx-btn-loading');
        oButton.html('<span class="bx-std-btn-loading" aria-hidden="true"></span>');
        return;
    }

    var oSaved = oButton.data('bx-loading');
    if(!oSaved)
        return;

    // a button that was disabled before stays so
    oButton.removeData('bx-loading').css('min-width', '').removeClass('bx-btn-loading').html(oSaved.html);
    if(!oSaved.disabled)
        oButton.prop('disabled', false).removeAttr('aria-disabled').removeClass('bx-btn-disabled');
    if(oSaved.label == undefined)
        oButton.removeAttr('aria-label');
}

/** @} */
