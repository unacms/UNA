/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

/**
 * Context menus. An element with data-bx-context-menu="#popup" opens that popup (a transBox holding a [role="menu"] list,
 * see studio/template/menu_context.html) on right-click, on the keyboard's Menu key or Shift+F10 (both fire 'contextmenu')
 * and on a long press on a touch screen; open(oTrigger) opens it from a click on a visible button. The popup plugin
 * handles the outside click, Escape and the fade; this adds the ARIA menu behaviour: focus lands on the first item,
 * arrows, Home and End move, Tab leaves, checkbox and radio items keep their state, and focus returns to the trigger.
 */
function BxDolStudioContextMenu() {
    this.sAttr = 'data-bx-context-menu';
    this.sItems = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
    this.iPressDelay = 500;
    this.iGap = 4; // between the trigger and the menu

    this.oTrigger = null;
    this.oPopup = null;
    this._iPressTimer = 0;
    this._iPressedAt = 0;

    this.init();
}

BxDolStudioContextMenu.prototype.init = function() {
    var $this = this;

    document.addEventListener('contextmenu', function(oEvent) {
        var oTrigger = oEvent.target.closest('[' + $this.sAttr + ']');
        if(!oTrigger)
            return;

        oEvent.preventDefault();
        if(Date.now() - $this._iPressedAt < 800)
            return; // the long press has already opened it (Android fires contextmenu as well)

        $this.open(oTrigger);
    });

    //--- Touch: a long press (iOS never fires contextmenu), cancelled by lifting or moving the finger.
    document.addEventListener('pointerdown', function(oEvent) {
        if(oEvent.pointerType != 'touch')
            return;

        var oTrigger = oEvent.target.closest('[' + $this.sAttr + ']');
        if(!oTrigger)
            return;

        clearTimeout($this._iPressTimer);
        $this._iPressTimer = setTimeout(function() {
            $this._iPressedAt = Date.now();
            $this.open(oTrigger);
        }, $this.iPressDelay);
    });
    ['pointerup', 'pointercancel', 'pointermove'].forEach(function(sEvent) {
        document.addEventListener(sEvent, function() {
            clearTimeout($this._iPressTimer);
        });
    });
    document.addEventListener('click', function(oEvent) {
        // the tap that ends a long press must not follow the trigger's link
        if(Date.now() - $this._iPressedAt < 800 && oEvent.target.closest('[' + $this.sAttr + ']'))
            oEvent.preventDefault();
    }, true);

    //--- Inside the menu: arrows move between the items, Tab or Escape leaves, an activated item closes it.
    document.addEventListener('keydown', function(oEvent) {
        var oMenu = oEvent.target.closest('[role="menu"]');
        if(!oMenu)
            return;

        var aItems = $this.getItems(oMenu);
        var iIndex = aItems.indexOf(document.activeElement);
        var iCount = aItems.length;
        switch(oEvent.key) {
            case 'ArrowDown':
                aItems[(iIndex + 1) % iCount].focus();
                break;
            case 'ArrowUp':
                aItems[(iIndex - 1 + iCount) % iCount].focus();
                break;
            case 'Home':
                aItems[0].focus();
                break;
            case 'End':
                aItems[iCount - 1].focus();
                break;
            case 'Tab':
            case 'Escape':
                $this.close();
                break;
            default:
                return;
        }

        oEvent.preventDefault();
    });
    document.addEventListener('click', function(oEvent) {
        var oItem = oEvent.target.closest($this.sItems);
        if(!oItem || !oItem.closest('[role="menu"]'))
            return;

        var sRole = oItem.getAttribute('role');
        if(sRole == 'menuitemcheckbox')
            oItem.setAttribute('aria-checked', oItem.getAttribute('aria-checked') == 'true' ? 'false' : 'true');
        else if(sRole == 'menuitemradio') {
            $this.getItems(oItem.closest('[role="menu"]')).forEach(function(oOther) {
                if(oOther.getAttribute('role') == 'menuitemradio')
                    oOther.setAttribute('aria-checked', 'false');
            });
            oItem.setAttribute('aria-checked', 'true');
        }

        $this.close();
    });
};

/**
 * Open a trigger's menu next to it, however it was asked for (pointer, keyboard, long press, a button's click): 4px under
 * the trigger, flush with its start edge; fit() moves it above, or flush with the end edge, when the window runs out.
 */
BxDolStudioContextMenu.prototype.open = function(oTrigger) {
    var $this = this;

    var oPopup = $(oTrigger.getAttribute(this.sAttr));
    if(!oPopup.length)
        return this.load(oTrigger);

    // another menu is up: it goes first
    if(this.oPopup && this.oPopup.get(0) !== oPopup.get(0) && this.oPopup.is(':visible'))
        this.oPopup.dolPopupHide();

    this.oTrigger = oTrigger;
    this.oPopup = oPopup;

    var oAnchor = this.getAnchor(oTrigger);

    if(oPopup.is(':visible')) {
        // still fading out, or asked to show a moment ago: the plugin would toggle it, so come back when that is over
        if(!oPopup.hasClass('bx-popup-active')) {
            setTimeout(function() {
                $this.open(oTrigger);
            }, 250);
            return false;
        }

        // the same menu asked for again: it just settles next to its trigger
        oPopup._dolPopupSetPosition({position: 'absolute', left: oAnchor.x, top: oAnchor.y, pointer: false});
        this.fit(oPopup, oTrigger);
        this.focusFirst(oPopup);
        return false;
    }

    oPopup.dolPopup({
        position: 'absolute',
        left: oAnchor.x,
        top: oAnchor.y,
        pointer: false,
        fog: false,
        closeOnOuterClick: true,
        cssClass: 'bx-popup-menu',
        onBeforeShow: function(oShowing) {
            $this.fit(oShowing, $this.oTrigger); // laid out but still invisible here: no jump when it has to flip
        },
        onShow: function(oShown) {
            $this.fit(oShown, $this.oTrigger);
            if($this.oTrigger.hasAttribute('aria-expanded'))
                $this.oTrigger.setAttribute('aria-expanded', 'true');
            $this.focusFirst(oShown);
        },
        onHide: function(oHidden) {
            if($this.oTrigger.hasAttribute('aria-expanded'))
                $this.oTrigger.setAttribute('aria-expanded', 'false');

            // focus went nowhere in particular (the item that was activated is gone from view): back to the trigger
            if(document.activeElement == document.body || oHidden.get(0).contains(document.activeElement))
                $this.oTrigger.focus();
        }
    });

    return false;
};

/**
 * A menu that is not on the page yet (launcher tiles, dock items name theirs in data-bx-context-menu-load as "page:tileId"):
 * fetch it from the page's module endpoint, keep it in the document, then open it.
 */
BxDolStudioContextMenu.prototype.load = function(oTrigger) {
    var $this = this;

    var sLoad = oTrigger.getAttribute(this.sAttr + '-load');
    if(!sLoad || this._bLoading)
        return false;

    var aLoad = sLoad.split(':');
    this._bLoading = true;
    $.get(sUrlStudio + 'module.php', {mod_action: 'context', mod_value: aLoad[0], mod_widget_id: parseInt(aLoad[1]) || 0, _t: Date.now()}, function(oData) {
        if(!oData || oData.code != 0 || !oData.content)
            return;

        $('body').append(oData.content);
        $this.open(oTrigger);
    }, 'json').always(function() {
        $this._bLoading = false;
    });

    return false;
};

/**
 * Whether a long press opened a menu just now (the launcher's own long press then leaves edit mode alone).
 */
BxDolStudioContextMenu.prototype.justOpened = function() {
    return Date.now() - this._iPressedAt < 1500;
};

/**
 * Where the menu goes first: 4px under the trigger, flush with its start edge (page coordinates). In RTL the start edge is
 * the right one, which fit() lines the menu up with once its width is known.
 */
BxDolStudioContextMenu.prototype.getAnchor = function(oTrigger) {
    var oRect = oTrigger.getBoundingClientRect();
    return {x: oRect.left + window.scrollX, y: oRect.bottom + window.scrollY + this.iGap};
};

BxDolStudioContextMenu.prototype.isRtl = function() {
    return document.documentElement.dir == 'rtl' || document.body.classList.contains('bx-dir-rtl');
};

/**
 * Keep the menu on screen and off its trigger: flush with the trigger's end edge when it would run past the side of the
 * window (start edge in RTL), 4px above the trigger when it would run past the bottom.
 */
BxDolStudioContextMenu.prototype.fit = function(oPopup, oTrigger) {
    // layout size, not the rendered box: the popup is scaled while it fades in, and this may run mid-fade
    var iWidth = oPopup.get(0).offsetWidth;
    var iHeight = oPopup.get(0).offsetHeight;
    var oTriggerRect = oTrigger.getBoundingClientRect();
    var oCss = {};

    var iLeft = this.isRtl() ? oTriggerRect.right - iWidth : oTriggerRect.left;
    if(iLeft + iWidth > window.innerWidth - 8)
        iLeft = oTriggerRect.right - iWidth;
    if(iLeft < 8)
        iLeft = this.isRtl() ? oTriggerRect.left : 8;
    oCss.left = Math.round(iLeft + window.scrollX);

    oCss.top = Math.round(oTriggerRect.bottom + this.iGap + window.scrollY);
    if(oTriggerRect.bottom + this.iGap + iHeight > window.innerHeight - 8 && oTriggerRect.top - this.iGap - iHeight >= 8)
        oCss.top = Math.round(oTriggerRect.top - this.iGap - iHeight + window.scrollY);

    oPopup.css(oCss);
};

BxDolStudioContextMenu.prototype.focusFirst = function(oPopup) {
    var aItems = this.getItems(oPopup.get(0));
    if(aItems.length)
        aItems[0].focus();
};

BxDolStudioContextMenu.prototype.getItems = function(oMenu) {
    return Array.prototype.filter.call(oMenu.querySelectorAll(this.sItems), function(oItem) {
        return !oItem.disabled && oItem.getAttribute('aria-disabled') != 'true';
    });
};

BxDolStudioContextMenu.prototype.close = function() {
    if(this.oPopup && this.oPopup.is(':visible'))
        this.oPopup.dolPopupHide();
};

var oBxDolStudioContextMenu = new BxDolStudioContextMenu();

/** @} */
