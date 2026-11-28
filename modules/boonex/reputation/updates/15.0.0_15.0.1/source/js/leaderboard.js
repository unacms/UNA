/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

function BxReputationLeaderboard(oOptions)
{
    this._sActionsUrl = oOptions.sActionUrl;
    this._sObjNameGrid = oOptions.sObjNameGrid;
    this._sObjName = oOptions.sObjName == undefined ? 'oBxReputationLeaderboard' : oOptions.sObjName;

    this._sName = oOptions.sName == undefined ? '' : oOptions.sName;
    this._iContextId = oOptions.iContextId == undefined ? 0 : oOptions.iContextId;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'slide' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
    this._oRequestParams = oOptions.oRequestParams == undefined ? {} : oOptions.oRequestParams;
    this._oFiltersPopupOptions = {};
}

BxReputationLeaderboard.prototype.changeLeaderboardFilters = function(oLink, oRequestParams)
{
    var $this = this;

    oRequestParams = jQuery.extend({}, this._oRequestParams, {
        start: 0
    }, oRequestParams);

    var sFilters = '#' + this._aHtmlIds['filters_popup'];
    if($(sFilters).length)
        return $(sFilters).dolPopup(this._oFiltersPopupOptions);

    var oData = this._getDefaultData(oLink);
    if(oRequestParams != undefined)
        oData = jQuery.extend({}, oData, oRequestParams);

    this.loadingInButton(oLink, true);

    jQuery.get (
        this._sActionsUrl + 'get_filters_leaderboard',
        oData,
        function(oResponse) {
            if(oLink)
                $this.loadingInButton(oLink, false);

            if(oResponse && oResponse.popup != undefined) {
                $this._oFiltersPopupOptions = jQuery.extend({}, oResponse.popup.options, {
                    pointer: { 
                        el: $(oLink),
                        align: 'right'
                    }
                });

                oResponse.popup.options = $this._oFiltersPopupOptions;
            }

            processJsonData(oResponse);
        },
        'json'
    );
};

BxReputationLeaderboard.prototype.onFiltersApply = function(oSource)
{
    oRequestParams = jQuery.extend({}, this._oRequestParams);

    var oFilters = $(oSource).parents('.bx-reputation-filters:first');

    //--- Apply duration
    var oDays = oFilters.find("select[name='days']");
    if(oDays.length)
        oRequestParams.days = parseInt(oDays.val().replace('d-', ''));

    //--- Apply username
    var oUsername = oFilters.find("input[name='username']");
    if(oUsername.length)
        oRequestParams.username = oUsername.val();

    this._getData(oSource, oRequestParams);
};

BxReputationLeaderboard.prototype.onFiltersReset = function(oSource)
{
    var oFilters = $(oSource).parents('.bx-reputation-filters:first');
    
    //--- Reset duration
    var oDays = oFilters.find("select[name='days']");
    if(oDays.length)
        oDays.val('d-' + this._oRequestParams.days);

    //--- Reset username
    var oUsername = oFilters.find("input[name='username']");
    if(oUsername.length)
        oUsername.val('');

    this._getData(oSource, this._oRequestParams);
};

BxReputationLeaderboard.prototype._getData = function(oSource, oRequestData)
{
    var $this = this;
    var sLeaderboard = '#' + this._aHtmlIds['leaderboard'] + this._sName;
    
    var oData = this._getDefaultData();
    if(oRequestData != undefined)
        oData = jQuery.extend({}, oData, oRequestData);

    this.loadingInButton(oSource, true);

    jQuery.get (
        this._sActionsUrl + 'get_leaderboard',
        oData,
        function(oResponse) {
            if(oSource)
                $this.loadingInButton(oSource, false);

            if(!oResponse.content)
                return;

            $('.bx-popup-applied:visible').dolPopupHide();

            $(sLeaderboard).replaceWith(oResponse.content);
            $(sLeaderboard).bxProcessHtml();
        },
        'json'
    );
};

BxReputationLeaderboard.prototype.loadingInButton = function(e, bShow) {
    if($(e).length)
        bx_loading_btn($(e), bShow);
    else
        bx_loading($('body'), bShow);	
};

BxReputationLeaderboard.prototype.loadingInBlock = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-db-container:first') : $('body'); 
    bx_loading(oParent, bShow);
};

BxReputationLeaderboard.prototype._getDefaultData = function() {
    var oDate = new Date();
    return jQuery.extend({}, this._oRequestParams, {
        name: this._sName,
        context_id: this._iContextId,
        _t:oDate.getTime()
    });
};

/** @} */
