/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioFormsLabels(oOptions) {
    this.sActionsUrl = oOptions.sActionUrl;
    this.sPageUrl = oOptions.sPageUrl;
    this.sObjNameGrid = oOptions.sObjNameGrid;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioFormsLabels' : oOptions.sObjName;
    this.sParamsDivider = oOptions.sParamsDivider == undefined ? '#-#' : oOptions.sParamsDivider;

    this.sTextSearchInput = oOptions.sTextSearchInput == undefined ? '' : oOptions.sTextSearchInput;
}

BxDolStudioFormsLabels.prototype.onChangeFilter = function() {
    var $this = this;

    var sValueSearch = $('#bx-grid-search-' + this.sObjNameGrid).val();
    if(sValueSearch == this.sTextSearchInput)
        sValueSearch = '';

    // A select is applied at once; typing in the search field is applied once it pauses.
    clearTimeout($this._iSearchTimeoutId);
    $this._iSearchTimeoutId = setTimeout(function () {
        glGrids[$this.sObjNameGrid].setFilter(sValueSearch, true);
    }, document.activeElement && document.activeElement.id == 'bx-grid-search-' + $this.sObjNameGrid ? 300 : 0);
};
/** @} */
