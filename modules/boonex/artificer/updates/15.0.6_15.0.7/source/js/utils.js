function BxArtificerUtils(oOptions)
{
    this._sActionUri = oOptions.sActionUri;
    this._sActionUrl = oOptions.sActionUrl;
    this._sObject = oOptions.sObject;
    this._aHtmlIds = undefined == oOptions.aHtmlIds ? {} : oOptions.aHtmlIds;  
    this._sColorScheme = undefined == oOptions.sColorScheme ? 'auto' : oOptions.sColorScheme;

    if(htmx != undefined) {
        // 4xx and 5xx responses stay out of the page, same as htmx 2.
        htmx.config.noSwap = [204, 304, '4xx', '5xx'];
        htmx.on('htmx:before:settle', function(evt) {
            // outerHTML settle fires on the first inserted node. A leading
            // newline makes that a text node, which has no querySelectorAll.
            var aNodes = evt.target && evt.target.nodeType === 1 ? [evt.target] : ((evt.detail && evt.detail.newContent) || []);

            for(var i = 0; i < aNodes.length; i++) {
                var oNode = aNodes[i];
                if(!oNode || oNode.nodeType !== 1 || oNode.id == 'bx-content-preload')
                    continue;

                $(oNode).bxProcessHtml();
            }
        });
    }

    this.init();
}

BxArtificerUtils.prototype.init = function()
{
    var $this = this;

    switch(this._sColorScheme) {
        case 'auto':
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
                $this.setColorSchemeIcon();
                $this.setColorSchemeHtml();
                $this.onColorSchemeChange();
            });
            break;

        case 'light_only':
            this.setColorScheme(1);
            break;

        case 'dark_only':
            this.setColorScheme(2);
            break;
    }    

    this.setColorSchemeHtml();

    $(document).ready(function() {
        $this.setColorSchemeIcon();
        $this.onColorSchemeChange();
    });
};

BxArtificerUtils.prototype.setColorScheme = function(iCode)
{
    switch(iCode) {
        case 0:
            localStorage.removeItem('theme');
            break;

        case 1:
            localStorage.theme = 'sun'
            break;

        case 2:
            localStorage.theme = 'dark'
            break;
    }

    this.setColorSchemeIcon();
    this.setColorSchemeHtml();
    this.onColorSchemeChange(iCode);
};

BxArtificerUtils.prototype.isColorSchemeDark = function()
{
    return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

BxArtificerUtils.prototype.setColorSchemeHtml = function()
{
    if(this.isColorSchemeDark())
        $('html').addClass('dark')
    else
        $('html').removeClass('dark')
};

BxArtificerUtils.prototype.setColorSchemeIcon = function() 
{
    $('.bx-sb-theme-current').html('<i class="sys-icon ' + (this.isColorSchemeDark() ? 'moon' : 'sun') + '"></i>').bxProcessHtml();
};

BxArtificerUtils.prototype.onColorSchemeChange = function(iCode) 
{
    if(typeof glOnColorSchemeChange === 'undefined' || !(glOnColorSchemeChange instanceof Array)) 
        return;

    if(typeof iCode === 'undefined' || !iCode)
        iCode = this.isColorSchemeDark() ? 2 : 1;

    for(var i = 0; i < glOnColorSchemeChange.length; i++)
        if(typeof glOnColorSchemeChange[i] === "function")
            glOnColorSchemeChange[i](iCode);
};

BxArtificerUtils.prototype.getColorSchemeMenu = function() {
    $('#bx-sb-theme-switcher-menu').dolPopup({
        pointer: {
            el: $('.bx-sb-theme-switcher')
        },
        moveToDocRoot: true,
        cssClass: 'bx-popup-menu'
    });
};

BxArtificerUtils.prototype.getAddContentMenu = function(sMenu, e, sPosition) {
    $('.bx-popup-applied:visible').dolPopupHide();

    var sSidebar = 'account';
    if(bx_sidebar_active(sSidebar))
        bx_sidebar_toggle(sSidebar);

    bx_menu_popup_inline(sMenu, e, {});
};

BxArtificerUtils.prototype.getNotificationsMenu = function(sMenu, e, sPosition, oOptions) {
    $('.bx-popup-applied:visible').dolPopupHide();

    var sSidebar = 'account';
    if(bx_sidebar_active(sSidebar))
        bx_sidebar_toggle(sSidebar);

    oOptions = $.extend({}, {pointer: {align:'right'}, cssClass: ''}, oOptions);

    bx_menu_popup(sMenu, e, oOptions);
};

BxArtificerUtils.prototype.mmenuClickAl = function(oElement) {
    var sClass = 'bx-menu-tab-active';
    var oItem = $(oElement).parent().addClass(sClass);

    oItem.siblings().removeClass(sClass);
    oItem.siblings('.bx-menu-item-more-auto').find('li').removeClass(sClass);

    oItem.parents('li:first').siblings().removeClass(sClass);
    if(oItem.parents('.bx-popup-applied.bx-popup-menu'))
        $('.bx-popup-applied:visible').dolPopupHide();
};

BxArtificerUtils.prototype.submenuClickBl = function(oElement) {
    var oItems = $(oElement).parents('ul:first').find('li');
    var iPosNew = oItems.index($(oElement).parent());
    var iPosOld = oItems.index($(oElement).parent().siblings('.bx-menu-tab-active'));

    var sClassAdd = iPosOld > iPosNew ? 'ltr' : 'rtl';
    $('#bx-content-wrapper').addClass(sClassAdd);
};

BxArtificerUtils.prototype.submenuClickAl = function(oElement) {
    var sClass = 'bx-menu-tab-active';
    var oItem = $(oElement).parent().addClass(sClass);

    oItem.siblings().removeClass(sClass);
    oItem.siblings('.bx-menu-item-more-auto').find('li').removeClass(sClass);

    oItem.parents('li:first').siblings().removeClass(sClass);
    if(oItem.parents('.bx-popup-applied.bx-popup-menu'))
        $('.bx-popup-applied:visible').dolPopupHide();

    var sSidebar = 'site';
    if(bx_sidebar_active(sSidebar))
        bx_sidebar_toggle(sSidebar);
};