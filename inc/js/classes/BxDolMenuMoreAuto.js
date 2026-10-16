/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * A horizontal menu that moves the items which don't fit into its 'more' popup.
 *
 * Which items stay in the row is computed from the items' natural widths, measured on an invisible copy of the
 * row (so the visible row is never torn up to be measured), and the space the row has. The answer is applied
 * only when it changes, and it is remembered per window width: the next page applies it while it is parsed,
 * before the first paint, so on page switches the row shows at once and nothing moves.
 *
 * The first real measurement waits until the document is parsed (toolbar items that share the header with the
 * menu exist only then) and web fonts have loaded. After that a ResizeObserver on the menu's container updates
 * the row when the space really changes; only those updates glide the items to their new places.
 */
function BxDolMenuMoreAuto(options)
{
    this._sObject = options.sObject;
    this._iItemsStatic = undefined == options.iItemsStatic ? 0 : options.iItemsStatic;
    this._bItemsStaticOnly = undefined == options.bItemsStaticOnly ? 0 : options.bItemsStaticOnly;
    this._aHtmlIds = undefined == options.aHtmlIds ? {} : options.aHtmlIds;

    this._sClassReady = 'bx-mma-ready';
    this._sClassItem = '.bx-menu-item';
    this._sClassItemMore = this._sClassItem + '.bx-menu-item-more-auto';
    this._sClassItemMoreSubmenu = '.bx-menu-submenu-more-auto';
    this._sClassItemStatic = 'bx-menu-item-static';

    this._sStorageKey = 'bx-mma-' + this._sObject;
    this._iStorageWidths = 12;

    this._bStaticMode = this._bItemsStaticOnly && this._iItemsStatic > 0;

    this._oMenu = null;
    this._oItemMore = null;
    this._oSubmenu = null;
    this._aItems = [];
    this._eSubmenuFirst = null;

    this._sLayout = '';
    this._fLayoutWidth = -1;
    this._bSettled = false;
}

BxDolMenuMoreAuto.prototype.init = function()
{
    var $this = this;

    var oMenu = $('#' + this._aHtmlIds['main']);
    if(!oMenu.length)
        return;

    // Pages may run the init code again for a menu that is already set up (a re-rendered block keeps the element).
    var eMenu = oMenu.get(0);
    if(eMenu._bxMenuMoreAuto)
        return;
    eMenu._bxMenuMoreAuto = this;

    this._oMenu = oMenu;
    this._oItemMore = oMenu.children(this._sClassItemMore);
    this._oSubmenu = this._oItemMore.find(this._sClassItemMoreSubmenu);
    this._eSubmenuFirst = this._oSubmenu.children(this._sClassItem).get(0) || null;
    this._aItems = oMenu.children(this._sClassItem).not(this._sClassItemMore).toArray();

    // The first N items are persistent: they never move into 'more'.
    var iStatic = 0;
    $.each(this._aItems, function(i, eItem) {
        if(iStatic >= $this._iItemsStatic)
            return false;

        if(!$(eItem).hasClass($this._sClassItemStatic)) {
            $(eItem).addClass($this._sClassItemStatic);
            iStatic++;
        }
    });

    oMenu.css('overflow', 'visible');
    oMenu.parents('.bx-menu-more-auto-wrapper:first').css('overflow', 'visible');

    /**
     * The row this window width had on the previous page is applied right away, so the row can show before the
     * first paint. Without one, a first guess is applied and the row stays hidden (templates keep it hidden until
     * it is marked ready) until it is measured for real.
     */
    var sRemembered = this._bStaticMode ? '' : this._recall();
    if(sRemembered) {
        this._apply(sRemembered);
        this._reveal(false);
    }
    else
        this._layout(false);

    if(this._bStaticMode) {
        this._reveal(false);
        return;
    }

    var fSettle = function() {
        $this._whenFontsReady(function() {
            $this._settle();
        });
    };

    if(document.readyState == 'loading')
        $(document).ready(fSettle);
    else
        fSettle();

    //--- Track the space the row has: other header items appearing, a sidebar toggling, the window resizing ---//
    if(typeof(window.ResizeObserver) != 'undefined')
        new ResizeObserver(function() {
            $this._onResize();
        }).observe(oMenu.parent().get(0));
    else
        $(window).on('resize', function() {
            $this._onResize();
        });

    // Item labels change width when a web font finishes loading after the menu has settled.
    if(document.fonts && document.fonts.addEventListener)
        document.fonts.addEventListener('loadingdone', function() {
            if($this._bSettled)
                $this._layout(true);
        });
};

/**
 * Recalculate the row now, e.g. after an item's content has changed.
 */
BxDolMenuMoreAuto.prototype.update = function(bForceCalculate)
{
    if(this._bStaticMode || !this._oMenu)
        return;

    this._layout(this._bSettled);
};

BxDolMenuMoreAuto.prototype.more = function(oElement)
{
    var oElement = $(oElement);

    oElement.parents('li:first').find('#' + this._aHtmlIds['more_auto_popup']).dolPopup({
        pointer: {
            el: oElement
        },
        moveToDocRoot: false,
        cssClass: 'bx-popup-menu',
        onShow: function() {
            oElement.attr('aria-expanded', 'true');
        },
        onHide: function() {
            oElement.attr('aria-expanded', 'false');
        }
    });
};

BxDolMenuMoreAuto.prototype._settle = function()
{
    if(this._bSettled)
        return;

    /**
     * Usually the row is still hidden here, or it already is the remembered one and nothing moves. If the remembered
     * row turns out to be wrong (the toolbar changed since), the shown items glide to their places.
     */
    this._bSettled = true;
    this._layout(this._oMenu.hasClass(this._sClassReady));
    this._reveal(true);
};

/**
 * Mark the row ready, which shows it in templates that hide it until then. A remembered row may have been styled
 * hidden already (the browser can paint before the init code runs), so it skips the template's reveal transition.
 */
BxDolMenuMoreAuto.prototype._reveal = function(bTransition)
{
    var eMenu = this._oMenu.get(0);
    if(this._oMenu.hasClass(this._sClassReady))
        return;

    if(bTransition) {
        this._oMenu.addClass(this._sClassReady);
        return;
    }

    var sTransition = eMenu.style.transition;
    eMenu.style.transition = 'none';
    this._oMenu.addClass(this._sClassReady);
    this._fRevealOpacity = Number.parseFloat(window.getComputedStyle(eMenu).opacity); // Reading it applies the change before the transition comes back.
    eMenu.style.transition = sTransition;
};

BxDolMenuMoreAuto.prototype._onResize = function()
{
    if(!this._bSettled)
        return;

    // Our own changes to the row don't change the container's width; skip the callbacks they cause.
    if(Math.abs(this._getAvailable() - this._fLayoutWidth) < 0.5)
        return;

    this._layout(true);
};

BxDolMenuMoreAuto.prototype._whenFontsReady = function(fCallback)
{
    if(!document.fonts || typeof(document.fonts.ready) != 'object' || document.fonts.status == 'loaded') {
        fCallback();
        return;
    }

    var bDone = false;
    var fOnce = function() {
        if(bDone)
            return;

        bDone = true;
        fCallback();
    };

    document.fonts.ready.then(fOnce, fOnce);
    setTimeout(fOnce, 1000); // A font that never loads doesn't keep the menu hidden.
};

/**
 * Measure, decide which items stay in the row and apply it.
 * @param bAnimate - glide the items that stay to their new places (only for a row that is already shown)
 */
BxDolMenuMoreAuto.prototype._layout = function(bAnimate)
{
    if(this._bStaticMode) {
        this._apply(this._compute(null, 0));
        return;
    }

    var fAvailable = this._getAvailable();
    if(fAvailable <= 0)
        return; // Not displayed yet: the ResizeObserver calls again once it is.

    var sLayout = this._compute(this._measure(), fAvailable);

    var aBefore = bAnimate && sLayout != this._sLayout ? this._getPositions() : null;
    this._apply(sLayout);
    if(aBefore)
        this._animateFrom(aBefore);

    this._fLayoutWidth = this._getAvailable();
    if(this._bSettled)
        this._remember(sLayout);
};

/**
 * The width the row can use: its container's content width less the row's own padding.
 */
BxDolMenuMoreAuto.prototype._getAvailable = function()
{
    var eParent = this._oMenu.parent().get(0);
    var oStyleParent = window.getComputedStyle(eParent);
    var oStyleMenu = window.getComputedStyle(this._oMenu.get(0));

    return eParent.getBoundingClientRect().width
        - Number.parseFloat(oStyleParent.paddingLeft) - Number.parseFloat(oStyleParent.paddingRight)
        - Number.parseFloat(oStyleParent.borderLeftWidth) - Number.parseFloat(oStyleParent.borderRightWidth)
        - Number.parseFloat(oStyleMenu.paddingLeft) - Number.parseFloat(oStyleMenu.paddingRight)
        - Number.parseFloat(oStyleMenu.borderLeftWidth) - Number.parseFloat(oStyleMenu.borderRightWidth);
};

/**
 * Natural widths of all items and of 'more', taken from an invisible copy of the row placed next to it, so it
 * gets the same styles. Each item's share includes the gap before it, so any run of items adds up.
 * @return {items: [share, ...], more: share}
 */
BxDolMenuMoreAuto.prototype._measure = function()
{
    var $this = this;
    var eMenu = this._oMenu.get(0);

    var eProbe = eMenu.cloneNode(false);
    eProbe.removeAttribute('id');
    eProbe.setAttribute('aria-hidden', 'true');
    eProbe.style.cssText = 'position:absolute;top:0;left:0;width:max-content;max-width:none;overflow:visible;visibility:hidden;pointer-events:none;';

    var aClones = $.map(this._aItems, function(eItem) {
        var eClone = eItem.cloneNode(true);
        $this._styleForRow($(eClone));
        eProbe.appendChild(eClone);
        return eClone;
    });

    var eMoreClone = null;
    if(this._oItemMore.length) {
        // Without its popup, which holds the items that are in 'more' now.
        eMoreClone = this._oItemMore.get(0).cloneNode(true);
        $(eMoreClone).find('#' + this._aHtmlIds['more_auto_popup']).remove();
        eMoreClone.style.display = 'list-item';
        eProbe.appendChild(eMoreClone);
    }

    $(eProbe).find('[id]').removeAttr('id');
    eMenu.parentNode.insertBefore(eProbe, eMenu);

    var bRtl = window.getComputedStyle(eProbe).direction == 'rtl';
    var oProbe = eProbe.getBoundingClientRect();
    var oStyleProbe = window.getComputedStyle(eProbe);
    var fStart = bRtl ? oProbe.right - Number.parseFloat(oStyleProbe.paddingRight) - Number.parseFloat(oStyleProbe.borderRightWidth) : oProbe.left + Number.parseFloat(oStyleProbe.paddingLeft) + Number.parseFloat(oStyleProbe.borderLeftWidth);
    var fEdge = function(eElement) {
        var oRect = eElement.getBoundingClientRect();
        return bRtl ? fStart - oRect.left : oRect.right - fStart;
    };

    var fPrev = 0;
    var aItems = $.map(aClones, function(eClone) {
        if(!eClone.getClientRects().length)
            return 0; // Not displayed at this width.

        var fEnd = fEdge(eClone);
        var fShare = fEnd - fPrev;
        fPrev = fEnd;
        return fShare;
    });
    var fMore = eMoreClone && eMoreClone.getClientRects().length ? fEdge(eMoreClone) - fPrev : 0;

    eProbe.remove();

    return {items: aItems, more: fMore};
};

/**
 * Which items stay in the row: a string with '1' (row) or '0' (more) per item, in their order.
 * In static mode only the persistent items stay and no sizes are needed.
 */
BxDolMenuMoreAuto.prototype._compute = function(oSizes, fAvailable)
{
    var $this = this;
    var fEps = 0.5;

    var fAll = 0;
    if(oSizes)
        $.each(oSizes.items, function(i, fShare) {
            fAll += fShare;
        });

    var bAllFit = !this._bStaticMode && fAll <= fAvailable + fEps;

    var aResult = [];
    var bRelocate = false;
    var fUsed = oSizes ? oSizes.more : 0;
    $.each(this._aItems, function(i, eItem) {
        var bStatic = $(eItem).hasClass($this._sClassItemStatic);
        var fShare = oSizes ? oSizes.items[i] : 0;

        if(bAllFit || bStatic || (!$this._bStaticMode && !bRelocate && fUsed + fShare <= fAvailable + fEps)) {
            aResult.push('1');
            fUsed += fShare;
            return;
        }

        aResult.push('0');
        bRelocate = true;
    });

    return aResult.join('');
};

/**
 * Put each item in the row or in 'more', keeping their order, and touch only the ones that change place.
 */
BxDolMenuMoreAuto.prototype._apply = function(sLayout)
{
    if(sLayout.length != this._aItems.length || sLayout == this._sLayout)
        return;

    var eMenu = this._oMenu.get(0);
    var eSubmenu = this._oSubmenu.get(0);
    var eRowNext = this._oItemMore.get(0) || null;
    var eSubmenuNext = this._eSubmenuFirst;

    for(var i = this._aItems.length - 1; i >= 0; i--) {
        var eItem = this._aItems[i];

        if(sLayout.charAt(i) == '1' || !eSubmenu) {
            if(eItem.parentNode !== eMenu) {
                this._styleForRow($(eItem));
                eMenu.insertBefore(eItem, eRowNext); // eRowNext may be null (no 'more' item): append.
            }
            eRowNext = eItem;
        }
        else {
            if(eItem.parentNode !== eSubmenu) {
                this._styleForSubmenu($(eItem));
                eSubmenu.insertBefore(eItem, eSubmenuNext);
            }
            eSubmenuNext = eItem;
        }
    }

    // Shown and hidden at once: a jQuery show() animation would grow the item while the others move.
    if(sLayout.includes('0'))
        this._oItemMore.show();
    else
        this._oItemMore.hide();

    this._sLayout = sLayout;
};

BxDolMenuMoreAuto.prototype._styleForRow = function(oItem)
{
    oItem.removeClass('bx-def-color-bg-hl-hover');
    oItem.find('a.bx-nobtn').removeClass('bx-nobtn').addClass('bx-btn');
    oItem.find('a.bx-nobtn-height').removeClass('bx-nobtn-height').addClass('bx-btn-height');
};

BxDolMenuMoreAuto.prototype._styleForSubmenu = function(oItem)
{
    oItem.addClass('bx-def-color-bg-hl-hover');
    oItem.find('a.bx-btn').removeClass('bx-btn').addClass('bx-nobtn');
    oItem.find('a.bx-btn-height').removeClass('bx-btn-height').addClass('bx-nobtn-height');
};

/**
 * The remembered row is stored per window width, together with the item names it was computed for.
 */
BxDolMenuMoreAuto.prototype._getSignature = function()
{
    return $.map(this._aItems, function(eItem) {
        return (eItem.className.match(/bx-menu-item-([\w-]+)/) || ['', ''])[1] + ':' + $(eItem).text().trim().length;
    }).join(',');
};

BxDolMenuMoreAuto.prototype._recall = function()
{
    try {
        var oStored = JSON.parse(window.localStorage.getItem(this._sStorageKey) || 'null');
        if(!oStored || oStored.sig != this._getSignature() || !oStored.rows)
            return '';

        var sLayout = oStored.rows[window.innerWidth];
        return typeof(sLayout) == 'string' && sLayout.length == this._aItems.length ? sLayout : '';
    }
    catch(e) {
        return ''; // Storage unavailable (private mode, blocked) or corrupt: lay out from scratch.
    }
};

BxDolMenuMoreAuto.prototype._remember = function(sLayout)
{
    try {
        var sSignature = this._getSignature();
        var oStored = JSON.parse(window.localStorage.getItem(this._sStorageKey) || 'null');
        if(!oStored || oStored.sig != sSignature)
            oStored = {sig: sSignature, rows: {}, order: []};

        var sWidth = String(window.innerWidth);
        if(oStored.rows[sWidth] == sLayout)
            return;

        oStored.rows[sWidth] = sLayout;
        oStored.order = $.grep(oStored.order || [], function(s) { return s != sWidth; });
        oStored.order.push(sWidth);
        while(oStored.order.length > this._iStorageWidths)
            delete oStored.rows[oStored.order.shift()];

        window.localStorage.setItem(this._sStorageKey, JSON.stringify(oStored));
    }
    catch(e) {
        // Storage unavailable or full: the row is only not remembered for the next page.
    }
};

/**
 * Where each shown item sits before an update, so the items that stay can glide to their new place
 * (a centered menu shifts when an item moves in or out of 'more') instead of jumping.
 */
BxDolMenuMoreAuto.prototype._getPositions = function()
{
    var aResult = [];

    this._oMenu.children(this._sClassItem + ':visible').each(function() {
        aResult.push({item: this, left: this.getBoundingClientRect().left});
    });

    return aResult;
};

BxDolMenuMoreAuto.prototype._animateFrom = function(aBefore)
{
    if(!aBefore.length || typeof(Element.prototype.animate) != 'function' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches))
        return;

    var oOptions = {duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)'};

    this._oMenu.children(this._sClassItem + ':visible').each(function(iIndex, eItem) {
        var oBefore = aBefore.find(function(o) {
            return o.item === eItem;
        });

        if(!oBefore) {
            eItem.animate([{opacity: 0}, {opacity: 1}], oOptions);
            return;
        }

        var fShift = oBefore.left - eItem.getBoundingClientRect().left;
        if(Math.abs(fShift) >= 1)
            eItem.animate([{transform: 'translateX(' + fShift + 'px)'}, {transform: 'none'}], oOptions);
    });
};

/** @} */
