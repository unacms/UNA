/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolFeature(options)
{
	this._sObjName = undefined == options.sObjName ? 'oFeature' : options.sObjName; // javascript object name, to run current object instance from onTimer
	this._sSystem = options.sSystem; // current comment system
	this._iAuthorId = options.iAuthorId; // this comment's author ID.
    this._iObjId = options.iObjId; // this object id comments

    this._sActionsUri = 'feature.php';
    this._sActionsUrl = options.sRootUrl + this._sActionsUri; // actions url address

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';
    this._sSP = undefined == options.sStylePrefix ? 'bx-feature' : options.sStylePrefix;
    this._aHtmlIds = options.aHtmlIds;

    this._oParent = null;
}

BxDolFeature.prototype.feature = function(oLink) {
	var $this = this;
    var oData = this._getDefaultParams();
    oData['action'] = 'Feature';

    this._oParent = oLink;

    $.get(
    	this._sActionsUrl,
    	oData,
    	function(oData) {
    		$this.processJson(oData, oLink);
    	},
    	'json'
    );
};

BxDolFeature.prototype.onFeature = function(oData, oElement)
{
    var fContinue = function() {
        if(oData && oData.code != 0)
            return;

        if(oData && oData.label_icon)
            bx_set_icon($(oElement).find('.sys-action-do-icon .sys-icon'), oData.label_icon);

        if(oData && oData.label_title) {
            $(oElement).attr('title', oData.label_title);
            $(oElement).find('.sys-action-do-text').html(oData.label_title);
        }

        if(oData && oData.disabled)
            $(oElement).removeAttr('onclick').addClass($(oElement).hasClass('bx-btn') ? 'bx-btn-disabled' : 'bx-feature-disabled');
    };

    if(oData && oData.msg != undefined && oData.msg.length > 0)
        bx_alert(oData.msg, fContinue);
    else
        fContinue();	
};

BxDolFeature.prototype.processJson = function(oData, oElement) {
	oElement = oElement != undefined ? oElement : this._oParent;

	var fContinue = function() {
		//--- Show Popup
	    if(oData && oData.popup != undefined) {
	    	$('#' + oData.popup_id).remove();

	    	$(oData.popup).hide().prependTo('body').dolPopup({
	    		pointer: {
	    			el: oElement
	    		},
	            fog: {
					color: '#fff',
					opacity: .7
	            }
	        });
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

BxDolFeature.prototype._getButtons = function(oElement) {
	if($(oElement).hasClass(this._sSP))
		return $(oElement).find('.' + this._sSP + '-button');
	else
		return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-button');
};

BxDolFeature.prototype._loadingInButton = function(e, bShow) {
	if($(e).length)
		bx_loading_btn($(e), bShow);
	else
		bx_loading($('body'), bShow);	
};

BxDolFeature.prototype._getDefaultParams = function() {
	var oDate = new Date();
    return {
        sys: this._sSystem,
        object_id: this._iObjId,
        _t: oDate.getTime()
    };
};

/** @} */
