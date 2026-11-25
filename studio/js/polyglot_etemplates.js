/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioPolyglotEtemplates(oOptions) {
	this._iSearchTimeoutId = false;
	this.sActionsUrl = oOptions.sActionUrl;
	this.sObjNameGrid = oOptions.sObjNameGrid;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioPolyglotEtemplates' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this.sTextSearchInput = oOptions.sTextSearchInput == undefined ? '' : oOptions.sTextSearchInput; 
}

BxDolStudioPolyglotEtemplates.prototype.onChangeFilter = function() {
	var $this = this;

	var sValueModule = $('#bx-grid-module-' + this.sObjNameGrid).val().replace('id-', '');

	var sValueSearch = $('#bx-grid-search-' + this.sObjNameGrid).val();
	if(sValueSearch == this.sTextSearchInput)
		sValueSearch = '';

	// A select is applied at once; typing in the search field is applied once it pauses.
	clearTimeout($this._iSearchTimeoutId);
    $this._iSearchTimeoutId = setTimeout(function () {
    	glGrids[$this.sObjNameGrid].setFilter(sValueModule + '#-#' + sValueSearch, true);
    }, document.activeElement && document.activeElement.id == 'bx-grid-search-' + $this.sObjNameGrid ? 300 : 0);
};
/** @} */
