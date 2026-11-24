/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioFormsPreLists(oOptions) {
	this._iSearchTimeoutId = false;
	this.sActionsUrl = oOptions.sActionUrl;
	this.sPageUrl = oOptions.sPageUrl;
	this.sObjNameGrid = oOptions.sObjNameGrid;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioFormsLists' : oOptions.sObjName;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this.sParamsDivider = oOptions.sParamsDivider == undefined ? '#-#' : oOptions.sParamsDivider;

    this.sTextSearchInput = oOptions.sTextSearchInput == undefined ? '' : oOptions.sTextSearchInput;

    var $this = this;
    $(document).ready(function() {
    	$('#bx-grid-search-' + $this.sObjNameGrid).off('keyup focusout').bind({
            keyup: function (e) {
               $this.onChangeFilter();
            },
            focusout: function (e) {
                if (0 == this.value.length)
                    this.value = $this.sTextSearchInput;

                $this.onChangeFilter();
            }
        });    	
    });
}

BxDolStudioFormsPreLists.prototype.onChangeFilter = function() {
	var $this = this;

	var sValueModule = $('#bx-grid-module-' + this.sObjNameGrid).val();

	var sValueSearch = $('#bx-grid-search-' + this.sObjNameGrid).val();
	if(sValueSearch == this.sTextSearchInput)
		sValueSearch = '';

	// A select is applied at once; typing in the search field is applied once it pauses.
	clearTimeout($this._iSearchTimeoutId);
    $this._iSearchTimeoutId = setTimeout(function () {
    	glGrids[$this.sObjNameGrid].setFilter(sValueModule + $this.sParamsDivider + sValueSearch, true);
    }, document.activeElement && document.activeElement.id == 'bx-grid-search-' + $this.sObjNameGrid ? 300 : 0);
};
/** @} */
