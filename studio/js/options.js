/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

function BxDolStudioOptions(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioOptions' : oOptions.sObjName;
    this.sParamPrefix = oOptions.sParamPrefix == undefined ? 'opt' : oOptions.sParamPrefix;

    this.sType = oOptions.sType == undefined ? '' : oOptions.sType;
    this.sCategory = oOptions.sCategory == undefined ? '' : oOptions.sCategory;
    this.sMix = oOptions.sMix == undefined ? '' : oOptions.sMix;

    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this.bBusy = false;
}

BxDolStudioOptions.prototype.onSubmit = function(oForm) {
    if(this.bBusy)
        return false;

    var oSubmit = $(oForm).find('input[type="submit"],button[type="submit"]');

    oSubmit.addClass('bx-btn-disabled');
    bx_std_loading_btn(oSubmit, true);

    return (this.bBusy = true);
};

BxDolStudioOptions.prototype.onSubmitted = function(sFormId, sTocken, oData) {
    var oForm = $('#' + sFormId);
    var oSubmit = oForm.find('input[type="submit"],button[type="submit"]');

    oForm.find('input[name="csrf_token"]').val(sTocken);

    oSubmit.removeClass('bx-btn-disabled');
    bx_std_loading_btn(oSubmit, false);

    this.bBusy = false;
};

BxDolStudioOptions.prototype.import = function(oButton) {
    this.mixAction(oButton, 'import');
};

BxDolStudioOptions.prototype.onImport = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.export = function(oButton) {
    this.mixAction(oButton, 'export');
};

BxDolStudioOptions.prototype.onExport = function(oData) {
    document.location.href = oData.url;
};

BxDolStudioOptions.prototype.mixCreate = function(oButton) {
    this.mixActionWithValue(oButton, 'create-mix');
};

BxDolStudioOptions.prototype.onMixCreate = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixImport = function(oButton) {
    this.mixActionWithValue(oButton, 'import-mix');
};

BxDolStudioOptions.prototype.onMixImport = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixSelect = function(oSelect) {
    this.mixActionWithValue(oSelect, 'select-mix', $(oSelect).val());
};

BxDolStudioOptions.prototype.onMixSelect = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixExport = function(oButton, iId) {
    this.mixActionWithValue(oButton, 'export-mix', iId);
};

BxDolStudioOptions.prototype.onMixExport = function(oData) {
    document.location.href = oData.url;
};

BxDolStudioOptions.prototype.mixPublish = function(oButton, iId) {
    this.mixActionWithValue(oButton, 'publish-mix', iId);
};

BxDolStudioOptions.prototype.onMixPublish = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixHide = function(oButton, iId) {
    this.mixActionWithValue(oButton, 'hide-mix', iId);
};

BxDolStudioOptions.prototype.onMixHide = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixDelete = function(oButton, iId) {
    this.mixActionWithValue(oButton, 'delete-mix', iId, 1);
};

BxDolStudioOptions.prototype.onMixDelete = function(oData) {
    document.location.href = document.location.href;
};

BxDolStudioOptions.prototype.mixAction = function(oSource, sAction, bConfirm) {
    var $this = this;
    var oDate = new Date();
    var aParams = {
        type: this.sType,
        category: this.sCategory,
        _t:oDate.getTime()
    };
    aParams[this.sParamPrefix + '_action'] = sAction;

    var oPerform = function() {
        $.post(
            this.sActionsUrl,
            aParams,
            function (oData) {
                processJsonData(oData);
            },
            'json'
        );
    };

    if(bConfirm != undefined && parseInt(bConfirm) == 1)
	bx_confirm('', oPerform);
    else
        oPerform();
};

BxDolStudioOptions.prototype.mixActionWithValue = function(oSource, sAction, mixedValue, bConfirm) {
    var $this = this;
    var oDate = new Date();
    var aParams = {
        type: $this.sType,
        category: $this.sCategory,
        _t:oDate.getTime()
    };
    aParams[this.sParamPrefix + '_action'] = sAction;
    aParams[this.sParamPrefix + '_value'] = mixedValue;

    var oPerform = function() {
        $.post(
            $this.sActionsUrl,
            aParams,
            function (oData) {
                processJsonData(oData)
            },
            'json'
        );
    };

    if(bConfirm != undefined && parseInt(bConfirm) == 1)
	bx_confirm('', oPerform);
    else
        oPerform();
};

BxDolStudioOptions.prototype.processResult = function(oData) {
    processJsonData(oData);
};
/** @} */
