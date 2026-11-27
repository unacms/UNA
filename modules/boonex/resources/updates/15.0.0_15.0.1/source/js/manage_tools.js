/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

function BxResourcesManageTools(oOptions)
{
    BxBaseModTextManageTools.call(this, oOptions);

    this._sObjName = oOptions.sObjName == undefined ? 'oBxResourcesManageTools' : oOptions.sObjName;
}

BxResourcesManageTools.prototype = Object.create(BxBaseModTextManageTools.prototype);
BxResourcesManageTools.prototype.constructor = BxResourcesManageTools;

BxResourcesManageTools.prototype.onChangeFilter = function(oFilter) {
    var $this = this;
    var oFilter1 = $('#bx-grid-filter1-' + this._sObjNameGrid);
    var sValueFilter1 = oFilter1.length > 0 ? oFilter1.val() : '';

    var oFilter2 = $('#bx-grid-filter2-' + this._sObjNameGrid);
    var sValueFilter2 = oFilter2.length > 0 ? oFilter2.val() : '';
    
    var oFilter3 = $('#bx-grid-filter3-' + this._sObjNameGrid);
    var sValueFilter3 = oFilter3.length > 0 ? oFilter3.val() : '';

    var oSearch = $('#bx-grid-search-' + this._sObjNameGrid);
    var sValueSearch = oSearch.length > 0 ? oSearch.val() : '';
    if(sValueSearch == _t('_sys_grid_search'))
        sValueSearch = '';

    clearTimeout($this._iSearchTimeoutId);
    $this._iSearchTimeoutId = setTimeout(function () {
        glGrids[$this._sObjNameGrid].setFilter(sValueFilter1 + $this._sParamsDivider + sValueFilter2 + $this._sParamsDivider + sValueFilter3 + $this._sParamsDivider + sValueSearch, true);
    }, 500);
};

/** @} */
