/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolForm(oOptions)
{
    if(typeof oOptions === 'undefined')
        return;

    this._sObjName = oOptions.sObjName === undefined ? 'oForm' : oOptions.sObjName; // javascript object name, to run current object instance from onTimer
    this._sId = oOptions.sId; // form HTML ID
    this._sName = oOptions.sName; // form name
    this._sObject = oOptions.sObject; // form object
    this._sDisplay = oOptions.sDisplay; // form display

    this._sActionsUri = 'form.php';
    this._sActionsUrl = oOptions.sRootUrl + this._sActionsUri; // actions url address
    this._bInitCodeMirror = oOptions.bInitCodeMirror == undefined ? false : oOptions.bInitCodeMirror;
    this._bLeavePageConfirmation = oOptions.bLeavePageConfirmation == undefined ? false : oOptions.bLeavePageConfirmation;
    this._sTxtLeavePageConfirmation = oOptions.sTxtLeavePageConfirmation === undefined ? _t('_sys_leave_page_confirmation') : oOptions.sTxtLeavePageConfirmation;

    this._bChanged = false;

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';
    this._aHtmlIds = oOptions.aHtmlIds;

    if(this._bLeavePageConfirmation)
        this.initLeavePageConfirmation();
}

/**
 * Note. Is called anytime a form was loaded, even if previously created object of the form is used.
 */
BxDolForm.prototype.init = function()
{
    if(this._bInitCodeMirror) {
        setTimeout(() => {
            this.initCodeMirror();
        }, 500);
    }
};

BxDolForm.prototype.initCodeMirror = function()
{
    var oSelector = $('#' + this._sId + ' .bx-form-input-code');

    for(var i = 0; i < oSelector.length; i++) {
        CodeMirror.fromTextArea(oSelector.get(i), {
            lineNumbers: true,
            mode: "htmlmixed",
            htmlMode: true,
            matchBrackets: true
        }).on('blur', function(oEditor) {
            oEditor.save();
        });
    }
};

BxDolForm.prototype.initLeavePageConfirmation = function()
{
    var $this = this;

    var bName = this._sName != undefined && this._sName.length > 0;
    var bObject = this._sObject != undefined && this._sObject.length > 0;
    if(!bName && !bObject)
        return;

    var sForm = '';
    var oForm = null;
    if(bName) {
        sForm = this._sName;
        oForm = $('#' + sForm);
    }
    if(!oForm.length && bObject) {
        sForm = this._sObject;
        oForm = $('#' + sForm);
    }
    if(!oForm.length)
        return;

    if(oForm.find('.bx-form-warn:visible').length > 0) {
        oForm.find(':text').each(function() {
            if($(this).val() > 0)
                $this.setChanged();
        });
    }

    document.getElementById(sForm).addEventListener('input', (event) => {
        if(!event?.inputType || !event.inputType.length)
            return;

        $this.setChanged();
    });

    document.getElementById(sForm).addEventListener('submit', (event) => {
        $this.resetChanged();
    });

    window.addEventListener('beforeunload', (event) => {
        if(!$this._bChanged) 
            return;

        event.preventDefault();
        event.returnValue = '';
    });
    
    $('a').bind('click', function() {
        if(!$this._bChanged)
            return;

        var oLink = $(this);
        var sHref = oLink.attr('href');
        var sOnclick = oLink.attr('onclick');
        if(!sHref || (sOnclick != undefined && sOnclick.trim().length > 0))
            return;

        if(sHref.indexOf(sUrlRoot) == -1)
            sHref = sUrlRoot + sHref;
 
        var oRegExp = new RegExp('^' + bx_get_regexp('url') + '$', 'i');
        if(!sHref.trim().match(oRegExp))
            return;

        event.preventDefault();

        bx_confirm($this._sTxtLeavePageConfirmation, function() {
            $this.resetChanged();

            oLink.get(0).click();
        });
    });
};

BxDolForm.prototype.setChanged = function() {
    this._bChanged = true;
};

BxDolForm.prototype.resetChanged = function() {
    this._bChanged = false;
};

BxDolForm.prototype.showHelp = function(oLink, sInputName)
{
    var oData = this._getDefaultParams();
    oData['a'] = 'get_help';
    oData['input'] = sInputName;

    $(oLink).dolPopupAjax({
        id: {value:this._aHtmlIds['help_popup'] + sInputName, force:1}, 
        url: bx_append_url_params(this._sActionsUri, oData),
        closeOnOuterClick: true,
        removeOnClose: true,
        onBeforeShow: function(oPopup) {
            oPopup.addClass('bx-popup-help');
        }
    });
};

BxDolForm.prototype.pgcTogglePopup = function(oLink, iInputId, sPrivacyObject)
{
    var oData = this._getDefaultParams();
    oData['a'] = 'get_privacy_group_chooser';
    oData['input_id'] = iInputId;
    oData['privacy_object'] = sPrivacyObject;

    $(oLink).dolPopupAjax({
        id: {value:this._aHtmlIds['pgc_popup'] + iInputId, force:1},
        url: bx_append_url_params(this._sActionsUri, oData),
        closeOnOuterClick: false,
        removeOnClose: true,
    });
};

BxDolForm.prototype.pgcOnSelectGroup = function(oData)
{
    if(oData && parseInt(oData.code) != 0)
        return;

    if(oData.form_id && oData.chooser_id && oData.icon)
        $('#' + oData.form_id + ' #' + oData.chooser_id + ' .bx-form-input-pgc-current .sys-icon').removeClass().addClass('sys-icon ' + oData.icon);
};

BxDolForm.prototype._getDefaultParams = function() 
{
    var oDate = new Date();
    return {
        o: this._sObject,
        d: this._sDisplay,
        _t: oDate.getTime()
    };
};

BxDolForm.setCheckBoxValue = function (obj) {
    var oHidden = $(obj).parent('div').find('INPUT[type=hidden]')
    var val = 0;
    if ($(obj).attr("checked") == 'checked') {
        val = 1;
    }
    oHidden.val(val);
}

/** @} */
