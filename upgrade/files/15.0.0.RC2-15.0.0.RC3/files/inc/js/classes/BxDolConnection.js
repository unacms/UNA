/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolConnection(oOptions)
{
    this._sSystem = oOptions.sSystem;
    this._iContentId = oOptions.iContentId; // profile or content ID to connect with
    this._sContentType = oOptions.sContentType; 
    this._bIsMutual = oOptions.bIsMutual; 

    this._sObjName = undefined == oOptions.sObjName ? 'oConnection' : oOptions.sObjName; // javascript object name, to run current object instance from onTimer
    this._sActionsUri = 'conn.php';
    this._sActionsUrl = oOptions.sRootUrl + this._sActionsUri; // actions url address

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';
    this._sSP = undefined == oOptions.sStylePrefix ? 'bx-view' : oOptions.sStylePrefix;
    this._aHtmlIds = oOptions.aHtmlIds;
    this._aRequestParams = oOptions.aRequestParams;
}

BxDolConnection.prototype.connect = function(oLink, sAction, iContentId, bConfirm) {
    var $this = this;
    var oData = this._getDefaultParams();
    oData['act'] = sAction;
    oData['out'] = 'eval';

    if(!iContentId)
        iContentId = this._iContentId;

    var fPerform = function() {
        bx_loading_btn(oLink, 1);

        $.post(
            $this._sActionsUrl, 
            oData,
            function (oData) {
                bx_loading_btn(oLink, 0);

                $(oLink).parents('.bx-popup-applied:first:visible').dolPopupHide();

                if(typeof(oData) != 'object')
                    return;

                // Following or befriending is a toggle: on when made, off when removed or declined.
                if(typeof(bx_sound) == 'function')
                    if(oData.err)
                        bx_sound('error');
                    else
                        bx_sound('toggle', {direction: /^(remove|reject|cancel|unfollow|unsubscribe)/i.test(sAction) ? 'back' : 'forward', group: 'reactions'});

                if(oData.err)
                    bx_alert(oData.msg);
                else {
                    if(oData.eval != undefined)
                        eval(oData.eval);
                    else if(!loadDynamicBlockAuto(oLink))
                        location.reload();
                }
            },
            'json'
        );
    };

    if (typeof(bConfirm) != 'undefined' && bConfirm)
    	bx_confirm(_t('_Are_you_sure'), fPerform);
    else
    	fPerform();
};

BxDolConnection.prototype.onConnect = function(oData) {
    if(oData.data != 'undefined')
        $('#' + this._aHtmlIds['main'] + this._iContentId).replaceWith(oData.data).bxProcessHtml();
};

BxDolConnection.prototype.toggleConnectPopup = function(oLink, iContentId) {
    if(!iContentId)
        iContentId = this._iContentId;

    bx_menu_popup_inline('#' + this._aHtmlIds['do_popup'] + iContentId, oLink);
};

BxDolConnection.prototype.toggleByPopup = function(oLink) {
    var $this = this;
    var oData = this._getDefaultParams();
    oData['act'] = 'GetConnected';
    oData['fmt'] = 'html';

    $(oLink).dolPopupAjax({
        id: this._aHtmlIds['by_popup'] + this._iContentId, 
        url: bx_append_url_params(this._sActionsUri, oData)
    });
};

BxDolConnection.prototype.getUsers = function(oLink, iStart, iPerPage) {
    var $this = this;
    var oData = this._getDefaultParams();
    oData['act'] = 'GetUsers';
    oData['start'] = iStart;
    oData['per_page'] = iPerPage;

    this._loadingInPopup(oLink, true);

    $.get(
        this._sActionsUri,
        oData,
        function(oData) {
            $this._loadingInPopup(oLink, false);

            oData.source = oLink;
            processJsonData(oData);
        },
        'json'
    );
};

BxDolConnection.prototype.onGetUsers = function(oData) {
    if(!oData.content)
        return;

    $(oData.source).parents('.bx-popup-content-wrapped:first').html(oData.content);
};

BxDolConnection.prototype._loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);
};

BxDolConnection.prototype._loadingInPopup = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-popup-content:first') : $('body'); 
    bx_loading(oParent, bShow);
};

BxDolConnection.prototype._getDefaultParams = function() {
    var oDate = new Date();
    return {
        obj: this._sSystem,
        id: this._iContentId,
        mutual: this._bIsMutual,
        content_type: this._sContentType,
        params: $.param(this._aRequestParams),
        _t: oDate.getTime(),
    };
};

/** @} */
