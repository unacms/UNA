/**
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

function BxTasksImport(oOptions) {
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxTasksImport' : oOptions.sObjName;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
}

BxTasksImport.prototype.changeSource = function(oElement) {
    var $this = this;
    var oDate = new Date();

    this.loadingInBlock(oElement, true);

    $.get(
        this._sActionsUrl + 'import_action/get_params', 
        {
            source: $(oElement).val(),
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loadingInBlock(oElement, false);

            processJsonData(oData);
        },
        'json'
    );

    return false;
};

BxTasksImport.prototype.onChangeSource = function (oData) {
    if(oData && oData.content) {
        var sData = JSON.stringify(oData.content, null, 2);

        $('#' + this._aHtmlIds['import_field_params']).val(sData);

        $('.CodeMirror').each(function() {
            this.CodeMirror.setValue(sData);
        });
    }
};

BxTasksImport.prototype.loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);
};

BxTasksImport.prototype.loadingInBlock = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-db-container:first') : $('body'); 
    bx_loading(oParent, bShow);
};
