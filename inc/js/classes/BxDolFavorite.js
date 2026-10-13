/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolFavorite(options)
{
	this._sObjName = undefined == options.sObjName ? 'oFavorite' : options.sObjName; // javascript object name, to run current object instance from onTimer
	this._sSystem = options.sSystem; // current comment system
	this._iAuthorId = options.iAuthorId; // this comment's author ID.
    this._iObjId = options.iObjId; // this object id comments

    this._sActionsUri = 'favorite.php';
    this._sActionsUrl = options.sRootUrl + this._sActionsUri; // actions url address

    this._sAnimationEffect = 'fade';
    this._iAnimationSpeed = 'slow';
    this._sSP = undefined == options.sStylePrefix ? 'bx-favorite' : options.sStylePrefix;
    this._aHtmlIds = options.aHtmlIds;

    this._oParent = null;
}

BxDolFavorite.prototype.toggleByPopup = function(oLink) {
	var $this = this;
    var oData = this._getDefaultParams();
    oData['action'] = 'GetFavoritedBy';

	$(oLink).dolPopupAjax({
		id: this._aHtmlIds['by_popup'], 
		url: bx_append_url_params(this._sActionsUri, oData)
	});
};

BxDolFavorite.prototype.favorite = function(oLink) {
    var $this = this;
    var oData = this._getDefaultParams();
    oData['action'] = 'Favorite';

    this._oParent = $(oLink);
    $.get(
    	this._sActionsUrl,
    	oData,
    	function (oData) {

    	    $this.processJson(oData, this._oParent);
    	},
    	'json'
    );
};

BxDolFavorite.prototype.showNewList = function (obj) {
    $(obj).parents('form').find("#bx-form-element-title").show();
    $(obj).parents('form').find("#bx-form-element-allow_view_favorite_list_to").show();
    $(obj).parents('form').find("#bx-form-element-new_list").hide();
}

BxDolFavorite.prototype.cmtDelete = function (obj, list_id) {
    var $this = this;
    bx_confirm('', function () {
        var oData = $this._getDefaultParams();
        oData['action'] = 'DeleteList';
        oData['list_id'] = list_id;
        $.get(
            $this._sActionsUrl,
            oData,
            function (oData) {
                $this.processJson(oData, this._oParent);
            },
            'json'
        );
    });
}

BxDolFavorite.prototype.cmtEdit = function (obj, list_id) {
    var $this = this;
    var oData = $this._getDefaultParams();
    oData['action'] = 'EditList';
    oData['list_id'] = list_id;

    $.get(
        $this._sActionsUrl,
        oData,
        function (oData) {
            $this.processJson(oData, $(obj));
        },
        'json'
    );
}

BxDolFavorite.prototype.onEditFavoriteList = function (oData, oElement) {
    var $this = this;
    var fContinue = function() {
        if(oData && oData.code != 0)
            return;
        location.reload();
    };

    if (oData && oData.msg != undefined && oData.msg.length > 0)
        bx_alert(oData.msg, fContinue);
    else
        fContinue();
}


BxDolFavorite.prototype.onFavorite = function(oData, oElement)
{
    var $this = this;

    // A favorite is a toggle: on when added, off when taken back.
    if(typeof(bx_sound) == 'function' && oData)
        if(oData.code != undefined && parseInt(oData.code) != 0)
            bx_sound('error');
        else
            bx_sound('toggle', {direction: oData.favorited ? 'forward' : 'back'});
    var fContinue = function() {
        if(oData && oData.code != 0)
            return;

        if(oData && oData.label_icon)
            $(oElement).find('.sys-action-do-icon .sys-icon').attr('class', 'sys-icon ' + oData.label_icon);

        if(oData && oData.label_title) {
            $(oElement).attr('title', oData.label_title);
            $(oElement).find('.sys-action-do-text').html(oData.label_title);
        }

        if(oData && oData.disabled)
            $(oElement).removeAttr('onclick').addClass($(oElement).hasClass('bx-btn') ? 'bx-btn-disabled' : 'bx-favorite-disabled');

        var oCounter = $this._getCounter(oElement);
        if(oCounter && oCounter.length > 0) {
            oCounter.html(oData.countf);

            oCounter.parents('.' + $this._sSP + '-counter-holder:first').bx_anim(oData.count > 0 ? 'show' : 'hide');
        }
    };

    if(oData && oData.msg != undefined && oData.msg.length > 0)
        bx_alert(oData.msg, fContinue);
    else
        fContinue();
};

BxDolFavorite.prototype.processJson = function (oData, oElement)
{
    oElement = oElement != undefined ? oElement : this._oParent;
    var $this = this;

    var fContinue = function() {
        //--- Show Popup
        if(oData && oData.popup != undefined) {
            $('.' + $this._sSP + '-do-form').parents(".bx-popup-wrapper").remove();
            $(oData.popup).hide().prependTo('body').bxProcessHtml().dolPopup({
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
    else if (oData && oData.redirect != undefined)
        document.location = oData.redirect;
    else
        fContinue();
};

BxDolFavorite.prototype._getButtons = function(oElement) {
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find('.' + this._sSP + '-button');
    else
        return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-button');
};

BxDolFavorite.prototype._getCounter = function(oElement) {
    if($(oElement).hasClass(this._sSP))
        return $(oElement).find('.' + this._sSP + '-counter');
    else 
        return $(oElement).parents('.' + this._sSP + ':first').find('.' + this._sSP + '-counter');
};

BxDolFavorite.prototype._loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);	
};

BxDolFavorite.prototype._getDefaultParams = function() {
    var oDate = new Date();
    return {
        sys: this._sSystem,
        object_id: this._iObjId,
        _t: oDate.getTime()
    };
};

/** @} */
