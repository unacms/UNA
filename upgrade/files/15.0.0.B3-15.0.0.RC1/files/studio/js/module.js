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

            if(iWidgetId != 0 && oData.widget.length > 0) {
                $('#bx-std-widget-' + iWidgetId).replaceWith(oData.widget);
                oBxDolStudioLauncher.enableJitter();
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

    $('#bx-menu-item-' + oData.page).bx_anim('hide', this.sAnimationEffect, this.iAnimationSpeed, function() {
        $(this).remove();
    });

    $('#bx-std-widget-' + oData.widget_id).bx_anim('hide', this.sAnimationEffect, this.iAnimationSpeed, function() {
        $(this).remove();
    });
};

/** @} */
