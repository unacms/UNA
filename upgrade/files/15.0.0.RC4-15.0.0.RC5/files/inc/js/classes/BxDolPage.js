/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */
function BxDolPage(oOptions) {
    this._sObjName = oOptions.sObjName == undefined ? 'oBxDolPage' : oOptions.sObjName;
    this._sObject = oOptions.sObject; // page object

    this._sActionsUri = 'page.php';
    this._sActionsUrl = oOptions.sRootUrl; // actions url address
    this._aHtmlIds = oOptions.aHtmlIds;

    this._isStickyColumns = oOptions.isStickyColumns == undefined ? false : oOptions.isStickyColumns;
    this._iLastSc = 0;

    this._oCreativeEditor = null;
    this._oCreativeStorage =  null;
    this._sCreativeStorageData = 'bx-cs-data';
    this._sCreativeStorageHtml = 'bx-cs-html';

    var $this = this;
    $(document).ready(function() {
        $this.init();
    });
}

BxDolPage.prototype.init = function() {
    var $this = this;
    if ($this._isStickyColumns && !$('html').hasClass('bx-media-phone')) {
        window.glTheiaStickySidebar = new TheiaStickySidebar.TheiaStickySidebar($.extend({}, {
            elements: '.bx-layout-col',
            additionalMarginTop:70
        }, typeof(window.glTheiaStickySidebarSettings) !== 'undefined' ? window.glTheiaStickySidebarSettings : {}));
    }

    // process embeds
    $(document).bxConvertEmbeds();

    // process links
    bx_process_links();
};

/**
 * Share a page's link: on a phone the system share sheet when the browser has one, else (and on a computer,
 * or when the sheet fails) the Share popup with the services and the link to copy.
 */
BxDolPage.prototype.share = function(oLink, sUrl)
{
    var $this = this;
    if(this._isPhone() && navigator.share) {
        var sLink = sUrl;
        try {
            sLink = decodeURIComponent(sUrl); // the menus pass the link URL-encoded ({url_encoded})
        } catch(e) {}

        navigator.share({url: sLink, title: document.title}).catch(function(oError) {
            if(!oError || oError.name != 'AbortError') // closing the sheet is not a failure
                $this.sharePopup(oLink, sUrl);
        });
        return;
    }

    this.sharePopup(oLink, sUrl);
};

BxDolPage.prototype._isPhone = function()
{
    return $('html').hasClass('bx-media-phone') || (window.matchMedia && window.matchMedia('(pointer: coarse) and (max-width: 767px)').matches);
};

BxDolPage.prototype.sharePopup = function(oLink, sUrl)
{
    var oData = this._getDefaultParams();
    oData['a'] = 'get_share';
    oData['url'] = sUrl;
    $(".bx-popup-applied:visible").dolPopupHide();

    $(window).dolPopupAjax({
        url: bx_append_url_params(this._sActionsUri, oData),
        displayMode: 'box',
        closeOnOuterClick: false,
        id: {value: 'sys_share_popup', force: true}
    });
}

BxDolPage.prototype.showHelp = function(oLink, iBlockId)
{
    var oData = this._getDefaultParams();
    oData['a'] = 'get_help';
    oData['block_id'] = iBlockId;

    $(oLink).dolPopupAjax({
        id: {value:this._aHtmlIds['help_popup'] + iBlockId, force:1}, 
        url: bx_append_url_params(this._sActionsUri, oData),
        closeOnOuterClick: true,
        removeOnClose: true,
        onBeforeShow: function(oPopup) {
            oPopup.addClass('bx-popup-help');
        }
    });
};

//TODO: Continue from here.
BxDolPage.prototype.creativeEdit = function(oLink, iBlockId)
{
    if(this._oCreativeEditor)
        return;

    var $this = this;

    $(oLink).toggleClass('hidden').siblings('.bx-cc-save').toggleClass('hidden');

    //--- Holdres
    if(!$('#' + this._sCreativeStorageData).length)
        $('body').prepend('<textarea id="' + this._sCreativeStorageData + '" class="hidden"></textarea>');
    else
        $('#' + this._sCreativeStorageData).val('');

    if(!$('#' + this._sCreativeStorageHtml).length)
        $('body').prepend('<textarea id="' + this._sCreativeStorageHtml + '" class="hidden"></textarea>');
    else
        $('#' + this._sCreativeStorageHtml).val('');

    /*
    //--- Panels
    $('body').prepend('<div class="bx-cp-top"><div class="bx-cp bx-cp-devices"></div><div class="bx-cp bx-cp-options"></div><div class="bx-cp bx-cp-views"></div><div class="bx-cp bx-cp-views-container"><div class="bx-c-blocks"></div><div class="bx-c-styles"></div></div></div>');
    */

    //Load data to local storage
    var oContent = $(oLink).parents('.bx-creative-controls:first').siblings('.bx-creative-content');
    if(oContent.length) {
        $('#' + this._sCreativeStorageData).val(JSON.stringify({pages: [{component: oContent.html()}]}));
        $('#' + this._sCreativeStorageHtml).val(oContent.html());
    }

    const oStorage = (editor) => {
        const oStorageData = document.getElementById($this._sCreativeStorageData);
        const oStorageHtml = document.getElementById($this._sCreativeStorageHtml);

        editor.Storage.add('inline', {
            load() {
                return JSON.parse(oStorageData.value || '{}');
            },
            store(data) {
              const component = editor.Pages.getSelected().getMainComponent();

              oStorageData.value = JSON.stringify(data);
              oStorageHtml.value = `<style>${editor.getCss({ component })}</style>${editor.getHtml({ component })}`;
            }
        });
    };  


    var sContainer = 'bx-cc-' + iBlockId;
    var iContainerHeight = $('#' + sContainer).height();
    this._oCreativeEditor = grapesjs.init({
        // Indicate where to init the editor. You can also pass an HTMLElement
        container: '#' + sContainer,

        plugins: [oStorage, 'gjs-blocks-basic', 'grapesjs-style-bg', 'grapesjs-preset-webpage'],
        pluginsOpts: {
            'gjs-blocks-basic': { flexGrid: true },
            'grapesjs-preset-webpage': {}
        },

        height: iContainerHeight > 800 ? iContainerHeight : 800,
/*
        blockManager: {
            appendTo: '.bx-c-blocks',
        },
        styleManager: {
            appendTo: '.bx-c-styles',
        },
*/
        storageManager: { 
            type: 'inline',
            autosave: true,
            autoload: true
        }
    });

/*
    const pm = this._oCreativeEditor.Panels;
    pm.addPanel({id: 'panel-top', el: '.bx-cp-top'});
    pm.addPanel({id: 'panel-devices', el: '.bx-cp-devices', buttons: pm.getPanel('devices-c').buttons.models});
    pm.addPanel({id: 'panel-options', el: '.bx-cp-options', buttons: pm.getPanel('options').buttons.models});
    pm.addPanel({id: 'panel-views', el: '.bx-cp-views', buttons: pm.getPanel('views').buttons.models});
    pm.addPanel({id: 'panel-views', el: '.bx-cp-views-container'});
*/
};

BxDolPage.prototype.creativeSave = function(oLink, iBlockId)
{
    if(!this._oCreativeEditor)
        return;

    this._loadingInButton($(oLink), true);

    var $this = this;
    var sContent = $('#' + this._sCreativeStorageHtml).val();

    var oParams = $.extend({}, this._getDefaultParams(), {
        a: 'creative_save',
        b: iBlockId,
        c: sContent
    });

    $.post (
        this._sActionsUri,
        oParams,
        function() {
            $this._loadingInButton($(oLink), false);

            $(oLink).toggleClass('hidden').siblings('.bx-cc-edit').toggleClass('hidden');
            $('.bx-cp-top').remove();

            $this._oCreativeEditor.destroy();
            $this._oCreativeEditor = null;

            var oContent = $(oLink).parents('.bx-creative-controls:first').siblings('.bx-creative-content');
            if(oContent.length)
                oContent.attr('style', '').html(sContent);
        },
        'json'
    );
};

BxDolPage.prototype._loadingInButton = function(e, bShow)
{
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);
};

BxDolPage.prototype._getDefaultParams = function() 
{
    var oDate = new Date();
    return {
        o: this._sObject,
        _t: oDate.getTime()
    };
};

/** @} */
