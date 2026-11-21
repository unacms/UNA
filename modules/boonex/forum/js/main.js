/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

function BxForumMain(oOptions) {
	this._sActionsUrl = oOptions.sActionUrl;
    this._sObjName = oOptions.sObjName == undefined ? 'oFormMain' : oOptions.sObjName;
    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this._sObjNameGrid = oOptions.sObjNameGrid;
    this._sParamsDivider = oOptions.sParamsDivider == undefined ? '#-#' : oOptions.sParamsDivider;

	var $this = this;
	$(document).ready(function () {
		$this.init();
	});
}

BxForumMain.prototype.init = function() {
	var ePreviews = $('.bx-forum-grid-preview');
    if(!ePreviews.length)
        return;

    var oFunction = function () {
    	$('.bx-grid-table').each(function() {
    		var oTable = $(this);

	        // calculate width of all table cols, except the one which contains item's preview
	        var iCalcWidth = 0;
	        oTable.find('tbody tr:first-child td').each(function () {
	            if(!$(this).find('.bx-forum-grid-preview').length)
	            	iCalcWidth += $(this).outerWidth();
	        });

	        // set width for items' previews
	        var iInnerWidth = oTable.parent().innerWidth();
	        oTable.find('.bx-forum-grid-preview').each(function () {
	            var eWrapper = $(this).parent();
	        }); 
            
	        oTable.find('tr').each(function () {
	            $(this).removeClass('bx-def-color-bg-hl')
	            $(this).click(function (evt) {
	                console.log(event.srcElement.localName);
	                if (!event.srcElement.closest('a')) {
                        location = $(this).find('.bx-forum-gp-title A').attr('href');
                    }
                })
	        }); 
            
            
    	});
    };

    $(window).resize(function() {
    	oFunction();
    });

    BxDolGrid.prototype.onDataReloaded = function (isSkipSearchInput) {
    	oFunction();
    };

    oFunction();
};

BxForumMain.prototype.onChangeFilter = function (oFilter) {
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
