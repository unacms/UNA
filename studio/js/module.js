/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioModule(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sActionsPrefix = oOptions.sActionsPrefix;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioModule' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
}

BxDolStudioModule.prototype.settings = function(sName, iWidgetId) {
    if(!sName)
        return false;

    var oDate = new Date();
    var aParams = {_t:oDate.getTime()};
    aParams[this.sActionsPrefix + '_action'] = 'settings';
    aParams[this.sActionsPrefix + '_value'] = sName;
    aParams[this.sActionsPrefix + '_widget_id'] = iWidgetId;

    $.get(
    	this.sActionsUrl, aParams, function(oData) {
            processJsonData(oData);
    	},
    	'json'
    );
};

BxDolStudioModule.prototype.activate = function(oCheckbox, sName, iWidgetId) {
    var $this = this;
    var oDate = new Date();
    var aParams = {_t:oDate.getTime()};
    aParams[this.sActionsPrefix + '_action'] = 'activate';
    aParams[this.sActionsPrefix + '_value'] = sName;
    aParams[this.sActionsPrefix + '_widget_id'] = iWidgetId;

    $.get(
        this.sActionsUrl, aParams, function(oData) {
            processJsonData(oData);

            $('.bx-popup-applied:visible').dolPopupHide();

            if(oData.code != 0) {
                $(oCheckbox).attr('checked', 'checked').trigger('enable');
                return;
            }

            // the app's dock item dims or brightens with it (the launcher tile is replaced below)
            if(oData.page)
                $('#bx-menu-item-' + oData.page).toggleClass('bx-menu-item-disabled', !parseInt(oData.enabled));

            if(iWidgetId != 0 && oData.widget.length > 0) {
                $('#bx-std-widget-' + iWidgetId).replaceWith(oData.widget);
                if(oBxDolStudioLauncher.bJitterMode)
                    oBxDolStudioLauncher.enableJitter(); // the fresh tile needs its edit-mode controls shown
                return;
            }

            $('#bx-std-page-columns').bx_anim('hide', $this.sAnimationEffect, $this.iAnimationSpeed, function() {
                $(this).html(oData.content);
                if(oData.content.length > 0)
                    $(this).bxProcessHtml().bx_anim('show', $this.sAnimationEffect, 'fast');
            });
        },
        'json'
    );
    return true;
};

BxDolStudioModule.prototype.uninstall = function(sName, iWidgetId, iConfirm) {
    if(!sName)
        return false;

    var oDate = new Date();
    var aParams = {_t:oDate.getTime()};
    aParams[this.sActionsPrefix + '_action'] = 'uninstall';
    aParams[this.sActionsPrefix + '_value'] = sName;
    aParams[this.sActionsPrefix + '_widget_id'] = iWidgetId;
    aParams[this.sActionsPrefix + '_confirmed'] = parseInt(iConfirm);
    
    $('.bx-popup-applied:visible').dolPopupHide();

    $.get(
    	this.sActionsUrl, aParams, function (oData) {
            processJsonData(oData);
    	},
    	'json'
    );
};

BxDolStudioModule.prototype.onUninstall = function(oData) {
    if(oData.code != 0 || oData.page.length == 0 || oData.widget_id.length == 0) 
        return;

    // uninstalled from the app's own page: the page is gone, back to the launcher
    if(window.location.pathname.indexOf('module.php') != -1 && window.location.search.indexOf('name=' + oData.page) != -1) {
        window.location = sUrlStudio + 'launcher.php';
        return;
    }

    $('#bx-menu-item-' + oData.page).bx_anim('hide', this.sAnimationEffect, this.iAnimationSpeed, function() {
        $(this).remove();
    });

    $('#bx-std-widget-' + oData.widget_id).bx_anim('hide', this.sAnimationEffect, this.iAnimationSpeed, function() {
        $(this).remove();
    });
};

/** @} */
