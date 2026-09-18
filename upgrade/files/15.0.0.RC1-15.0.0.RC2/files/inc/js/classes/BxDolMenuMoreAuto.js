/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolMenuMoreAuto(options)
{
    this._sObject = options.sObject;
    this._iItemsStatic = undefined == options.iItemsStatic ? 0 : options.iItemsStatic;
    this._bItemsStaticOnly = undefined == options.bItemsStaticOnly ? 0 : options.bItemsStaticOnly;
    this._aHtmlIds = undefined == options.aHtmlIds ? {} : options.aHtmlIds;  

    this._sKeyWidth = 'bx-mma-width';

    this._sClassReady = 'bx-mma-ready';
    this._sClassItem = '.bx-menu-item';
    this._sClassItemMore = this._sClassItem + '.bx-menu-item-more-auto';
    this._sClassItemMoreSubmenu = '.bx-menu-submenu-more-auto';
    this._sClassItemStatic = 'bx-menu-item-static';

    this._bStaticMode = this._bItemsStaticOnly && this._iItemsStatic > 0;
    this._bTrackContainerResize = false;
}

BxDolMenuMoreAuto.prototype.init = function() {
    var $this = this;

    var oMenu = $('#' + this._aHtmlIds['main']);
    if(!oMenu.length) 
        return;

    //--- Initialize ---//
    var oItemMore = oMenu.find(this._sClassItemMore);
    var oItemMoreSubmenu = oItemMore.find(this._sClassItemMoreSubmenu);

    for(var i = 0; i < this._iItemsStatic; i++)
        oItemMore.prevAll(this._sClassItem + ':not(.' + this._sClassItemStatic + '):last').addClass(this._sClassItemStatic);

    var iMenu = 0;
    oMenu.children(this._sClassItem + ':visible').each(function() {
        iMenu += $this._getWidth($(this));
    });

    var iParent = oMenu.parent().width();
    var iItemMore = $this._getWidth(oItemMore);

    oMenu.css('overflow', 'visible');

    if(iMenu >= iParent || this._bStaticMode)
        this._moveToSubmenu(oMenu, oItemMore, oItemMoreSubmenu, iParent, iItemMore);
    else
        oMenu.parents('.bx-menu-more-auto-wrapper:first').css('overflow', 'visible');

    //--- Add event handlers ---//
    if(!this._bStaticMode) {
        $(window).on('resize', function() {
           $this.update();
        });

        if(this._bTrackContainerResize)
            setTimeout(function () {
                oMenu.find(this._sClassItem).on('resize', function() {
                    $this.update(true);
                });
            }, 200);
    }
};

BxDolMenuMoreAuto.prototype.update = function(bForceCalculate)
{
    if(this._bStaticMode)
        return;

    var $this = this;
    var oMenu = $('#' + this._aHtmlIds['main']);
    var oItemMore = oMenu.find(this._sClassItemMore);
    var oItemMoreSubmenu = oItemMore.find(this._sClassItemMoreSubmenu);

    var iMenu = 0;
    oMenu.children(this._sClassItem + ':visible').each(function() {
        iMenu += $this._getWidth($(this), $(this).not($this._sClassItemMore).length ? bForceCalculate : false);
    });

    var iParent = oMenu.parent().width();
    var iItemMore = $this._getWidth(oItemMore, false);

    if(iMenu > iParent)
        this._moveToSubmenu(oMenu, oItemMore, oItemMoreSubmenu, iParent, iItemMore);
    if(iMenu < iParent)
        this._moveFromSubmenu(oMenu, oItemMore, oItemMoreSubmenu, iParent, iMenu);
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
}

BxDolMenuMoreAuto.prototype._moveToSubmenu = function(oMenu, oItemMore, oItemMoreSubmenu, iParent, iItemMore)
{
    var $this = this;

    var bRelocateOthers = false;
    var iWidthTotal = iItemMore;
    var oSubmenuItemFirst = oItemMoreSubmenu.children(this._sClassItem + ':first');

    oMenu.children(this._sClassItem + ':not(' + this._sClassItemMore + ')').each(function() {
        var oItem = $(this);
        var iItem = $this._getWidth(oItem);
        if(($this._bStaticMode || bRelocateOthers || iWidthTotal + iItem > iParent) && !oItem.hasClass($this._sClassItemStatic)) {
            oItem.addClass('bx-def-color-bg-hl-hover');
            oItem.find('a').each(function() {
                if($(this).hasClass('bx-btn'))
                    $(this).removeClass('bx-btn').addClass('bx-nobtn');

                if($(this).hasClass('bx-btn-height'))
                    $(this).removeClass('bx-btn-height').addClass('bx-nobtn-height');
            });

            if(!oSubmenuItemFirst.length)
                oItemMoreSubmenu.append(oItem.detach());
            else
                oSubmenuItemFirst.before(oItem.detach());
            bRelocateOthers = true;
            return;
        }

        iWidthTotal += iItem;
    });

    if(oItemMoreSubmenu.find('li').length)
        oItemMore.show(function() {
            oMenu.addClass($this._sClassReady).parents('.bx-menu-more-auto-wrapper:first').css('overflow', 'visible');
        });
};

BxDolMenuMoreAuto.prototype._moveFromSubmenu = function(oMenu, oItemMore, oItemMoreSubmenu, iParent, iMenu)
{
    var $this = this;

    var bStopRelocation = false;
    var iWidthTotal = iMenu;
    oItemMoreSubmenu.children(this._sClassItem).each(function() {
        if(bStopRelocation) 
            return;

        var oItem = $(this);
        var iItem = $this._getWidth(oItem);
        if(iWidthTotal + iItem > iParent) {
            bStopRelocation = true;
            return;
        }

        oItem.removeClass('bx-def-color-bg-hl-hover');
        oItem.find('a').each(function() {
            if($(this).hasClass('bx-nobtn'))
                $(this).removeClass('bx-nobtn').addClass('bx-btn');

            if($(this).hasClass('bx-nobtn-height'))
                $(this).removeClass('bx-nobtn-height').addClass('bx-btn-height');
        });

        oItemMore.before(oItem.detach());
        iWidthTotal += iItem;
    });

    if(!oItemMoreSubmenu.find('li').length)
        oItemMore.hide();
};

BxDolMenuMoreAuto.prototype._getWidth = function(oItem, bForceCalculate)
{
    var iItem = parseInt(oItem.attr(this._sKeyWidth));
    if(!bForceCalculate && iItem)
        return iItem;

    iItem = oItem.outerWidth(true);
    if(iItem)
        oItem.attr(this._sKeyWidth, iItem);

    return iItem;
}
/** @} */
