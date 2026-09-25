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
 * Overlay scrollbar for a block's scroll box (div.bx-std-block-content, see page.css): an SVG over the block draws a track and a thumb
 * along the box's right edge and round its rounded corners, the thumb's length and place following the scroll position.
 * The native bar is hidden by CSS; the SVG is redrawn on scroll, on resize and when the content changes.
 */
function bx_std_scrollbars(sSelector) {
    $(sSelector || 'div.bx-std-block-content').each(function() {
        bx_std_scrollbar(this);
    });
}

function bx_std_scrollbar(oScroller) {
    if(oScroller.bxScrollbar)
        return;

    var oBlock = $(oScroller).closest('div.bx-std-block')[0];
    if(!oBlock)
        return;

    var sNs = 'http://www.w3.org/2000/svg';
    var oSvg = document.createElementNS(sNs, 'svg');
    oSvg.setAttribute('class', 'bx-std-scrollbar');
    oSvg.setAttribute('aria-hidden', 'true');
    var oTrack = document.createElementNS(sNs, 'path');
    oTrack.setAttribute('class', 'bx-std-scrollbar-track');
    var oThumb = document.createElementNS(sNs, 'path');
    oThumb.setAttribute('class', 'bx-std-scrollbar-thumb');
    oSvg.appendChild(oTrack);
    oSvg.appendChild(oThumb);
    oBlock.insertBefore(oSvg, oBlock.firstChild); // first, so the scroll box stays the block's :last-child (page.css rounds it by that)

    var oState = {scroller: oScroller, block: oBlock, svg: oSvg, track: oTrack, thumb: oThumb, timer: null};
    oScroller.bxScrollbar = oState;

    var fUpdate = function() {
        bx_std_scrollbar_update(oState);
    };
    oScroller.addEventListener('scroll', function() {
        fUpdate();
        $(oBlock).addClass('bx-std-scrolling');
        clearTimeout(oState.timer);
        oState.timer = setTimeout(function() {
            $(oBlock).removeClass('bx-std-scrolling');
        }, 800);
    }, {passive: true});
    if(window.ResizeObserver)
        new ResizeObserver(fUpdate).observe(oScroller);
    if(window.MutationObserver)
        new MutationObserver(function() {
            clearTimeout(oState.mutation);
            oState.mutation = setTimeout(fUpdate, 50);
        }).observe(oScroller, {childList: true, subtree: true, attributes: true});
    $(window).on('resize', fUpdate);

    fUpdate();
}

function bx_std_scrollbar_update(o) {
    var oScroller = o.scroller, iRange = oScroller.scrollHeight - oScroller.clientHeight;
    if(iRange <= 1) {
        o.svg.style.display = 'none';
        return;
    }
    o.svg.style.display = '';

    var oRb = o.block.getBoundingClientRect(), oRs = oScroller.getBoundingClientRect();
    var fW = oRb.width, fH = oRb.height, fTop = oRs.top - oRb.top, fBottom = oRs.bottom - oRb.top;
    var oCss = getComputedStyle(oScroller), oCssBlock = getComputedStyle(o.block);
    var fInset = 6; // the bar's centre line, 6px in from the edge: 4px wide with a 4px gap
    var fRb = Math.max((parseFloat(oCss.borderBottomRightRadius) || 0) - fInset, 0);
    var fRt = fTop < 1 ? Math.max((parseFloat(oCssBlock.borderTopRightRadius) || 0) - fInset, 0) : 0;
    var fX = fW - fInset;

    // round the top corner when the scroll box starts at the block's top, down the right edge, round the bottom corner
    var sPath = fRt > 0 ? 'M' + (fX - fRt) + ' ' + (fTop + fInset) + ' A' + fRt + ' ' + fRt + ' 0 0 1 ' + fX + ' ' + (fTop + fInset + fRt) : 'M' + fX + ' ' + (fTop + fInset);
    sPath += ' L' + fX + ' ' + (fBottom - fInset - fRb);
    if(fRb > 0)
        sPath += ' A' + fRb + ' ' + fRb + ' 0 0 1 ' + (fX - fRb) + ' ' + (fBottom - fInset);

    o.svg.setAttribute('viewBox', '0 0 ' + fW + ' ' + fH);
    o.track.setAttribute('d', sPath);
    o.thumb.setAttribute('d', sPath);

    var fLength = o.thumb.getTotalLength();
    var fThumb = Math.max(fLength * oScroller.clientHeight / oScroller.scrollHeight, 24);
    var fOffset = (fLength - fThumb) * oScroller.scrollTop / iRange;
    o.thumb.setAttribute('stroke-dasharray', fThumb + ' ' + fLength);
    o.thumb.setAttribute('stroke-dashoffset', -fOffset);
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
