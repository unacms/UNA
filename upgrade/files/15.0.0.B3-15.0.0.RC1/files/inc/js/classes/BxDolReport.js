/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolReport(options)
{
    this._sObjName = undefined == options.sObjName ? 'oReport' : options.sObjName; // javascript object name, to run current object instance from onTimer
    this._sSystem = options.sSystem; // current comment system
    this._iAuthorId = options.iAuthorId; // this comment's author ID.
    this._iObjId = options.iObjId; // this object id comments

    this._sActionsUri = 'report.php';
    this._sActionsUrl = options.sRootUrl + this._sActionsUri; // actions url address

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';
    this._sSP = options.sStylePrefix == undefined ? 'bx-report' : options.sStylePrefix;
    this._aHtmlIds = options.aHtmlIds;
    this._oRequestParams = options.oRequestParams == undefined ? {} : options.oRequestParams;
    this._sUnreportConfirm = options.sUnreportConfirm == undefined ? _t('_Are_you_sure') : options.sUnreportConfirm;

    this._oParent = null;
}

BxDolReport.prototype.toggleByPopup = function(oLink) {
    var $this = this;
    var oData = this._getDefaultParams();
    oData['action'] = 'GetReportedBy';

    $(oLink).dolPopupAjax({
        id: this._aHtmlIds['by_popup'], 
        url: bx_append_url_params(this._sActionsUri, oData)
    });
};

BxDolReport.prototype.report = function(oLink) {
    var $this = this;

    this._oParent = $(oLink);

    var fPerform = function() {
        var oData = $this._getDefaultParams();
        oData['action'] = 'Report';

        $.get(
            $this._sActionsUrl,
            oData,
            function(oData) {
                    $this.processJson(oData, $this._oParent);
            },
            'json'
        );
    };

    if(this._oParent.hasClass('bx-report-reported'))
        bx_confirm(this._sUnreportConfirm, fPerform);
    else 
    	fPerform();
};

BxDolReport.prototype.onReport = function(oData, oElement)
{
    var $this = this;
    var fPerform = function() {
        if(oData && oData.code != 0)
            return;

        if(oData && oData.reported != undefined)
            $(oElement).toggleClass('bx-report-reported', oData.reported);

        if(oData && oData.disabled)
            $(oElement).removeAttr('onclick').addClass($(oElement).hasClass('bx-btn') ? 'bx-btn-disabled' : 'bx-report-disabled');

        if(oData && oData.label_icon)
            $(oElement).find('.sys-action-do-icon .sys-icon').attr('class', 'sys-icon ' + oData.label_icon);

        if(oData && oData.label_title) {
            $(oElement).attr('title', oData.label_title);
            $(oElement).find('.sys-action-do-text').html(oData.label_title);
        }

        var oCounter = $this._getCounter(oElement);
        if(oCounter && oCounter.length > 0) {
            oCounter.html(oData.countf);

            oCounter.parents('.' + $this._sSP + '-counter-holder:first').bx_anim(oData.count > 0 ? 'show' : 'hide');
        }
    };

    if(oData && oData.msg != undefined)
        bx_alert(oData.msg, fPerform);
    else
        fPerform();
};

BxDolReport.prototype.processJson = function(oData, oElement) {
    oElement = oElement != undefined ? oElement : this._oParent;

    var fContinue = function() {
        //--- Show Popup
        if(oData && oData.popup != undefined) {
            $('#' + oData.popup_id).remove();

            var oPopup = null;
            var oOptions = {
                pointer: {
                    el: oElement
                },
                fog: {
                    color: '#fff',
                    opacity: .7
                },
                closeOnOuterClick: false
            };

            if(typeof(oData.popup) == 'object') {
                oOptions = $.extend({}, oOptions, oData.popup.options);
                oPopup = $(oData.popup.html);
            }
            else 
                oPopup = $(oData.popup);

            oPopup.hide().prependTo('body').dolPopup(oOptions);
        }

        //--- Evaluate JS code
        if (oData && oData.eval != undefined)
            eval(oData.eval);
    };

    //--- Show Message
    if(oData && oData.message != undefined)
        bx_alert(oData.message, fContinue);
    else
    	fContinue();
};

BxDolReport.prototype._getButtons = function(oElement) {
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find('.' + this._sSP + '-button');
    else
        return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-button');
};

BxDolReport.prototype._getCounter = function(oElement) {
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find('.' + this._sSP + '-counter');
    else 
        return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-counter');
};

BxDolReport.prototype._loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);	
};

BxDolReport.prototype._getDefaultParams = function() {
    var oDate = new Date();

    return jQuery.extend({
        sys: this._sSystem,
        object_id: this._iObjId
    }, this._oRequestParams, {
        _t: oDate.getTime()
    });
};

/** @} */
