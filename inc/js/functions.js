/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function processJsonData(oData) {
	var fContinue = function(oData) {
		if(oData && oData.reload != undefined && parseInt(oData.reload) == 1)
	    	document.location = document.location;

	    if(oData && oData.redirect != undefined && oData.redirect.length != 0)
	    	document.location = oData.redirect;

	    if(oData && oData.popup != undefined) {
	    	var oPopup = null;
	    	var oOptions = {
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

            if ('undefined' !== typeof(bx_editor_remove_all))
                bx_editor_remove_all($('#' + oPopup.attr('id')));
            
	    	$('#' + oPopup.attr('id')).remove();
	        oPopup.hide().prependTo('body').bxProcessHtml().dolPopup(oOptions);
	    }

	    if(oData && oData.form != undefined && oData.form_id != undefined)
	    	$('form#' + oData.form_id).replaceWith(oData.form).bxProcessHtml();

	    if (oData && oData.eval != undefined)
	        eval(oData.eval);
	};

	if(oData && oData.object != undefined && oData.grid != undefined)
		if(glGrids[oData.object] != undefined)
			glGrids[oData.object].processJson(oData);

	if(oData && oData.message != undefined && oData.message.length != 0)
		bx_alert(oData.message, function() {
			fContinue(oData);
		});
	else if(oData && oData.msg != undefined && oData.msg.length != 0)
		bx_alert(oData.msg, function() {
			fContinue(oData);
		});
	else
		fContinue(oData);
};

function getHtmlData( elem, url, callback, method, confirmation, values, loading)
{
    var fPerform = function() {
		// in most cases it is element ID, in other cases - object of jQuery
		if (typeof elem == 'string')
		    elem = '#' + elem; // create selector from ID

		var $block = $(elem);

		var blockPos = $block.css('position');

		$block.css('position', 'relative'); // set temporarily for displaying "loading icon"

        if ('undefined' === typeof(loading) || loading) {
    		bx_loading_content($block, true);
	    	var $loadingDiv = $block.find('.bx-loading-ajax');

    		var iLeftOff = parseInt(($block.innerWidth() / 2.0) - ($loadingDiv.outerWidth()  / 2.0));
	    	var iTopOff  = parseInt(($block.innerHeight() / 2.0) - ($loadingDiv.outerHeight()));
		    if (iTopOff<0) iTopOff = 0;

    		$loadingDiv.css({
	    	    position: 'absolute',
		        left: iLeftOff,
    		    top:  iTopOff
	    	});
        }

		if (undefined != method && (method == 'post' || method == 'POST')) {
            if (typeof values == 'undefined')
                values = {};
		    $.post(url, values, function(data) {
		        $block.html(data);
		        $block.css('position', blockPos).bxProcessHtml();

		        if (typeof callback == 'function')
		            callback.apply($block);
		    });		
		} 
		else {
		    $block.load(url + '&_r=' + Math.random(), function() {
		        $(this).css('position', blockPos).bxProcessHtml();

		        if (typeof callback == 'function')
		            callback.apply(this);
		    });
		}
    };

    if (typeof(confirmation) != 'undefined' && confirmation)
    	bx_confirm(_t('_Are_you_sure'), fPerform);
    else 
    	fPerform();
}

function loadDynamicBlockAutoPaginate (e, iStart, iPerPage, sAdditionalUrlParams, sStartParamName, sPerPageParamName) {

    sUrl = location.href;
    sStartParamName = typeof sStartParamName !== 'undefined' ?  sStartParamName : 'start';
    sPerPageParamName = typeof sPerPageParamName !== 'undefined' ?  sPerPageParamName : 'per_page';

    sUrl = sUrl.replace(/start=\d+/, '').replace(/per_page=\d+/, '').replace(/[&\?]+$/, '');
    sUrl = bx_append_url_params(sUrl, sStartParamName + '=' + parseInt(iStart) + '&' + sPerPageParamName + '=' + parseInt(iPerPage));
    if ('undefined' != typeof(sAdditionalUrlParams))
        sUrl = bx_append_url_params(sUrl, sAdditionalUrlParams);

	if ($(e).parents('.bx-search-result-block-pagination').length > 0){
		$([document.documentElement, document.body]).animate({
			scrollTop: $(e).parents('.bx-search-result-block-pagination').first().offset().top
		}, 500);
	}
    return loadDynamicBlockAuto(e, sUrl);
}

function loadDynamicBlockAutoSort (e, sort, sAdditionalUrlParams) {

    sUrl = location.href;
    console.log(sort);

    sUrl = sUrl.replace(/sort=\d+/, '').replace(/[&\?]+$/, '');
    sUrl = bx_append_url_params(sUrl, 'sort' + '=' + sort);
    if ('undefined' != typeof(sAdditionalUrlParams))
        sUrl = bx_append_url_params(sUrl, sAdditionalUrlParams);

    if ($(e).parents('.bx-search-result-block-pagination').length > 0){
        $([document.documentElement, document.body]).animate({
            scrollTop: $(e).parents('.bx-search-result-block-pagination').first().offset().top
        }, 500);
    }
    return loadDynamicBlockAuto(e, sUrl);
}

/**
 * This function reloads page block automatically, 
 * just provide any element inside the block and this function will reload the block.
 * @param e - element inside the block
 * @return true on success, or false on error - particularly, if block isn't found
 */
function loadDynamicBlockAuto(e, sUrl, oPostData) {
    var oContainer = $(e).parents('.bx-page-block-container:first:not(.no-dynamic)');
    var sId = oContainer.attr('id');

    if ('undefined' == typeof(sUrl))
        sUrl = location.href;

    if (!sId || !sId.length)
        return false;

    var aMatches = sId.match(/\-(\d+)$/);
    if (!aMatches || !aMatches[1])
        return false;

    var oPaginate = oContainer.find('.bx-paginate'); 
    if(oPaginate.length > 0) {
    	var iStart = parseInt(oPaginate.attr('bx-data-start'));
    	var iPerPage = parseInt(oPaginate.attr('bx-data-perpage'));

    	var oParams = {};
    	if(!isNaN(iStart) && sUrl.indexOf('start') == -1)
    		oParams.start = iStart;
    	if(!isNaN(iPerPage) && sUrl.indexOf('per_page') == -1)
    		oParams.per_page = iPerPage;

    	sUrl = bx_append_url_params(sUrl, oParams);
    }

    loadDynamicBlock(parseInt(aMatches[1]), sUrl, oPostData);
    return true;
}

/**
 * Reload the current page block to show or hide a form secret field.
 * Reveal is POSTed with a CSRF token so it cannot be triggered by a GET param alone.
 * When the form is not inside a page block, the whole page is reloaded via POST.
 */
function bx_form_secret_toggle(e) {
    var oToggle = $(e);
    var bHide = oToggle.closest('.bx-form-secret').hasClass('bx-form-secret-shown');
    var sField = oToggle.attr('bx_form_secret_field');
    var sCsrfToken = oToggle.attr('bx_form_secret_csrf');

    var sUrl = location.href;
    try {
        var oUrl = new URL(sUrl);
        oUrl.searchParams.delete('form_secret_reveal');
        oUrl.searchParams.delete('csrf_token');
        sUrl = oUrl.toString();
    } catch (oErr) {
        sUrl = sUrl.replace(/([?&])form_secret_reveal=[^&]*/g, '$1').replace(/([?&])csrf_token=[^&]*/g, '$1').replace(/[?&]$/, '');
    }

    if (bHide) {
        if (!loadDynamicBlockAuto(e, sUrl))
            location.href = sUrl;
        return false;
    }

    var oData = {form_secret_reveal: sField};
    if (sCsrfToken)
        oData.csrf_token = sCsrfToken;

    return loadDynamicBlockAuto(e, sUrl, oData);
}

function loadDynamicBlock(iBlockID, sUrl, oPostData) {
    
    var oCallback = null;
    if($('#bx-page-block-' + iBlockID + ' .bx-base-unit-showcase-wrapper').length){
        oCallback = bx_showcase_view_init;
    }
    if (typeof oPostData != 'undefined' && oPostData)
        getHtmlData($('#bx-page-block-' + iBlockID), bx_append_url_params(sUrl, 'dynamic=tab&pageBlock=' + iBlockID), oCallback, 'post', false, oPostData);
    else
        getHtmlData($('#bx-page-block-' + iBlockID), bx_append_url_params(sUrl, 'dynamic=tab&pageBlock=' + iBlockID), oCallback);
    return true;
}

function loadDynamicPopupBlock(iBlockID, sUrl) {
    if (!$('#dynamicPopup').length) {
        $('<div id="dynamicPopup" style="display:none;"></div>').prependTo('body');
    }

    $('#dynamicPopup').load(
        (sUrl + '&dynamic=popup&pageBlock=' + iBlockID),
        function() {
            $(this).dolPopup({
                left: 0,
                top: 0
            });
        }
    );
}

function closeDynamicPopupBlock() {
    $('#dynamicPopup').dolPopupHide();
}

function loadDynamicBlockAsync(iBlockID, sUrl, fCallback, bLoading, bLazyLoad) {
    if(!sUrl)
        sUrl = document.location.href;

    var fLoadBlock = function(iBlockID, sUrl) {
        if(fCallback == undefined || fCallback == true)
            fCallback = onAsyncBlockLoad;

        getHtmlData($('#bx-page-block-' + iBlockID), bx_append_url_params(sUrl, 'dynamic=tab&pageBlock=' + iBlockID), fCallback, 'post', false, {
            includedCss: JSON.stringify(aIncludedCss), 
            includedJs: JSON.stringify(aIncludedJs)
        }, (bLoading != undefined && bLoading == true));
    };

    if(bLazyLoad == undefined || bLazyLoad == true) {
        const oObserver = new IntersectionObserver((aEntries, obs) => {
            aEntries.forEach(oEntry => {
                if(oEntry.isIntersecting) {
                    const oElement = oEntry.target;

                    fLoadBlock(iBlockID, sUrl);

                    obs.unobserve(oElement);
                }
            });
        }, {
            root: null,        // viewport
            threshold: 0.1     // trigger when 10% visible
        });

        document.querySelectorAll('.bx-db-placeholder-async').forEach(oElement => {
            oObserver.observe(oElement);
        });
    }
    else
        $(document).ready(function() {
            fLoadBlock(iBlockID, sUrl);
        });
}

function onAsyncBlockLoad() {
    var oBlock = $(this);

    if(!oBlock.html()) 
        oBlock.remove();
}

/**
 * Translate string
 */
function _t(s, arg0, arg1, arg2) {
    if (!window.aDolLang || !aDolLang[s])
        return s;

    cs = aDolLang[s];
    cs = cs.replace(/\{0\}/g, arg0);
    cs = cs.replace(/\{1\}/g, arg1);
    cs = cs.replace(/\{2\}/g, arg2);
    return cs;
}

function showPopupAnyHtml(sUrl, sId) {

    var oPopupOptions = {};

    if (!sId || !sId.length)
        sId = 'login_div';

    $('#' + sId).remove();
    $('<div id="' + sId + '" style="display: none;"></div>').prependTo('body').load(
        sUrl.match('^http[s]{0,1}:\/\/') ? sUrl : sUrlRoot + sUrl,
        function() {
            $(this).dolPopup(oPopupOptions);
        }
    );
}

function bx_loading_svg(sType, sClass) {
	sClass = sClass != undefined && sClass.length > 0 ? sClass : '';

	if(sUseSvgLoading != undefined && sUseSvgLoading.length > 0)
		return sUseSvgLoading.replace(new RegExp('__type__','g'), sType).replace(new RegExp('__class__','g'), sClass);

	var s = '';
	s += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 520 520" class="' + sClass + '" style="enable-background:new 0 0 520 520;" xml:space="preserve">';
	s += '<g class="' + sType + '">';
	s += '<g class="inner">';
	s += '<path class="p1" d="M152,260C152,260,152,260,152,260c0-59.8,48.4-108.4,108.1-108.4c43.3,0,80.9,25.6,97.9,62.4V107.3c-28-18.3-61.9-28.9-98.1-28.9C159.8,78.4,78.6,159.9,78.6,260c0,59.5,28.4,112.4,73.4,145.6V260z"/>';
	s += '<path class="p2" d="M368,114.4V260c0,59.8-48.4,108.4-108.1,108.4c-43.3,0-80.9-25.6-97.9-62.4v106.7c28,18.3,61.9,28.9,98.1,28.9c100.1,0,181.3-81.4,181.3-181.6C441.4,200.5,413,147.6,368,114.4z"/>';
	s += '</g>';
	s += '<g class="outer">';
	s += '<path class="p1" d="M146.9,106.7c-8.1-15-36.9-29.9-68.9-27.3v124.2C90,164.3,114.6,130.5,146.9,106.7z"/>';
	s += '<path class="p2" d="M373.1,413.3c8.1,15,36.7,29.9,68.9,27.3V316.4C429.8,355.7,405.4,389.5,373.1,413.3z"/>';
	s += '</g>';
	s += '</g>';
	s += '</svg>';
	return s;
}

function bx_loading_animate (e, aOptions) {
    e = $(e);
    if (!e.length)
        return false;
    if (e.find('.bx-sys-spinner').length)
        return false;
    return new Spinner(aOptions).spin(e.get(0));
}

function bx_loading_btn (oElement, bEnable) {
    var oButton = $(oElement);
    var sClassHeight = oButton.hasClass('bx-btn-small') ? 'bx-btn-small-height' : 'bx-btn-height';

    if (oButton.children('div').size())
        oButton = oButton.children('div').first();

    if(!bEnable)
    	oButton.find('.bx-loading-ajax-btn').remove();
    else if (!oButton.find('.bx-loading-ajax-btn').length)
    	oButton.append('<b class="bx-loading-ajax-btn ' + sClassHeight + '">' + (bUseSvgLoading ? bx_loading_svg('colored', sClassHeight) : '') + '</b>');

    if(!bUseSvgLoading)
    	bx_loading_animate(oButton.find('.bx-loading-ajax-btn'), aSpinnerSmallOpts);    
}

function bx_loading_content (oElement, bEnable, isReplace) {
    var oBlock = $(oElement);
    var oLoading = $('<div class="bx-loading-ajax bx-def-z-index-front">' + (bUseSvgLoading ? bx_loading_svg('colored') : '') + '</div>');
    
    if(!bEnable)
    	oBlock.find(".bx-loading-ajax").remove();
    else if(!oBlock.find('.bx-loading-ajax').length) {
        if('undefined' != typeof(isReplace) && isReplace)
            oBlock.html(oLoading.addClass('static'));
        else
            oBlock.append(oLoading);

        if(!bUseSvgLoading)
        	bx_loading_animate(oBlock.find('.bx-loading-ajax'), aSpinnerOpts);
    } 
}

function bx_loading (elem, b) {

    if (typeof elem == 'string')
        elem = '#' + elem;

    var block = $(elem);

    if (block.hasClass('bx-btn')) {
        bx_loading_btn (block, b);
        return;
    }

    if (1 == b || true == b) {

        bx_loading_content(block, b);

        e = block.find(".bx-loading-ajax");
        e.css('left', parseInt(block.width()/2.0 - e.width()/2.0));

        var he = e.outerHeight();
        var hc = block.outerHeight();

        if (block.css('position') != 'relative' && block.css('position') != 'absolute') {
            if (!block.data('css-save-position'))
                block.data('css-save-position', block.css('position'));
            block.css('position', 'relative');
        }

        if (hc > he) {
            e.css('top', parseInt(hc/2.0 - he/2.0));
        }

        if (hc < he) {
            if (!block.data('css-save-min-height'))
                block.data('css-save-min-height', block.css('min-height'));
            block.css('min-height', he);
            e.css('top', 0);
        }

    } else {

        if (block.data('css-save-position'))
            block.css('position', block.data('css-save-position'));

        if (block.data('css-save-min-height'))
            block.css('min-height', block.data('css-save-min-height'));

        bx_loading_content(block, b);

    }

}


/**
 * Center content with floating blocks.
 * sSel - jQuery selector of content to be centered
 * sBlockSel - jquery selector of blocks
 */
function bx_center_content (sSel, sBlockStyle, bListenOnResize) {

    var sId;
    if ($(sSel).parent().hasClass('bx-center-content-wrapper')) {
        sId = $(sSel).parent().attr('id');
    } else {
        sId = 'id' + (new Date()).getTime();
        $(sSel).wrap('<div id="'+sId+'" class="bx-center-content-wrapper"></div>');
    }

    var eCenter = $('#' + sId);
    var iAll = $('#' + sId + ' ' + sBlockStyle).size();
    var iWidthUnit = $('#' + sId + ' ' + sBlockStyle + ':first').outerWidth(true);
    var iWidthContainer = eCenter.innerWidth();           
    var iPerRow = parseInt(iWidthContainer/iWidthUnit);
    var iLeft = (iWidthContainer - (iAll > iPerRow ? iPerRow * iWidthUnit : iAll * iWidthUnit)) / 2;

    if (iWidthUnit > iWidthContainer)
        return;

    if ('undefined' != typeof(bListenOnResize) && bListenOnResize) {
        $(window).on('resize.bx-center-content', function () {
            bx_center_content(sSel, sBlockStyle);
        });
    }

    eCenter.css("padding-left", iLeft);
}

/**
 * Show pointer popup with menu from URL.
 * @param o - menu object name
 * @param e - element to show popup at
 * @param options - popup options
 * @param vars - additional GET variables
 */
function bx_menu_popup (o, e, options, vars) {
    var options = options || {};
    var vars = vars || {};

    if ('undefined' == typeof(e))
        e = window;

    var o = $.extend({}, $.fn.dolPopupDefaultOptions, {
        id: o, 
        url: bx_append_url_params('menu.php', $.extend({o:o}, vars)), 
        cssClass: 'bx-popup-menu'
    }, options);

    $(e).dolPopupAjax(o);
}

/**
 * Show pointer popup with menu from existing HTML.
 * @param jSel - jQuery selector for html to show in popup
 * @param e - element to show popup at
 * @param options - popup options
 */
function bx_menu_popup_inline (jSel, e, options) {
    if ($(jSel + ':visible').length) 
        $(jSel).dolPopupHide(); 
    else {
        var options = options || {};

        var bElement = e != undefined && $(e).length != 0;

        var o = $.extend({}, $.fn.dolPopupDefaultOptions, options, {
            pointer: bElement ? {el:$(e)} : false, 
            cssClass: 'bx-popup-menu',
            onShow: function(oPopup) {
                oPopup.find('a').each(function () {
                    $(this).off('click.bx-popup-menu');
                    $(this).on('click.bx-popup-menu', function() {
                        $(jSel).dolPopupHide();
                    });
                });
            },
        });

        $(jSel).dolPopup(o);
    }
}

/**
 * Show pointer popup with menu from URL.
 * @param sObject - menu object name
 * @param oElement - element to show popup at
 * @param oOptions - popup options
 * @param oVars - additional GET variables
 */
function bx_menu_slide (sObject, oElement, sPosition, oOptions, oVars) {
    var oVars = oVars || {};
    var oOptions = oOptions || {};
    oOptions = $.extend({}, {parent: 'body', container: '.bx-sliding-menu-content'}, oOptions);

    var sId = '';
    var sIdSel = '';
    var sIdPfx = 'bx-sliding-menu-wrapper-';
    if(typeof(oOptions.id) != 'undefined')
    	switch(typeof(oOptions.id)) {
    		case 'string':
    			sId = sIdPfx + oOptions.id;
    			break;

    		case 'object':
    			sId = typeof(oOptions.id.force) != 'undefined' && oOptions.id.force ? oOptions.id.value : sIdPfx + oOptions.id.value;
    			break;
    	}
    else
    	sId = sIdPfx + parseInt(2147483647 * Math.random());

    sIdSel = '#' + sId;
    
    //--- If slider exists
    if ($(sIdSel).length) {
    	bx_menu_slide_inline (sIdSel, oElement, sPosition);
    	return;
    }
    //--- If slider doesn't exists
    else {
    	var oMenuLoading = $('#bx-sliding-menu-loading');
        if(!oMenuLoading || !oMenuLoading.length)
            return;

    	$('<div id="' + sId + '" style="display:none;">' + oMenuLoading.html() + '</div>').addClass(oMenuLoading.attr('class')).appendTo(oOptions.parent);

        var oLoading = $(sIdSel + ' .bx-sliding-menu-loading');
        bx_loading_content(oLoading, true, true);

        bx_menu_slide_inline (sIdSel, oElement, sPosition);
        
        var fOnLoad = function() {
        	bx_loading_content(oLoading, false);

        	$(sIdSel).bxProcessHtml().show();
        };

        $(sIdSel).find(oOptions.container).load(bx_append_url_params('menu.php', $.extend({o:sObject}, oVars)), function () {
            var f = function () {
            	if($(sIdSel).find('img').length > 0 && !$(sIdSel).find('img').get(0).complete)
            		$(sIdSel).find('img').load(fOnLoad);
            	else
            		fOnLoad();
            };
            setTimeout(f, 100); // TODO: better way is to check if item is animating before positioning it in the code where popup is positioning
        });
    }
    	
}

/**
 * Show sliding menu from existing HTML.
 * @param sMenu - jQuery object or selector for html to show in popup
 * @param e - element to click to open/close slider
 * @param sPosition - 'block' for sliding menu in blocks, 'site' - for sliding main menu
 */
function bx_menu_slide_inline (sMenu, e, sPosition) {
    var options = options || {};
    var eSlider = $(sMenu);

    if ('undefined' !== typeof (bx_menu_slide_inline_custom)) {
        return bx_menu_slide_inline_custom(sMenu, e, sPosition);
    }

    if ('undefined' == typeof(e))
        e = eSlider.data('data-control-btn');

    var eIcon = $(e).find('.sys-icon-a');    

    var fPositionElement = function (oElement) {
        eSlider.css({
            position: 'absolute',
            top: oElement.outerHeight(true),
            left: 0
        });
    };

    var fPositionBlock = function () {
        var eBlock = eSlider.parents('.bx-page-block-container');
        eSlider.css({
            position: 'absolute',
            top: eBlock.find('.bx-db-header').outerHeight(true),
            left: 0
            //width: eBlock.width() TODO: Commited to test. Remove if everything is OK.
        });
    };

    var fPositionSite = function () {
        var eToolbar = $('#bx-toolbar');
        eSlider.css({
            position: 'fixed',
            top: eToolbar.outerHeight(true) + (typeof iToolbarSubmenuTopOffset != 'undefined' ? parseInt(iToolbarSubmenuTopOffset) : 0),
            left: 0
        });
    };

    var fClose = function () {
        if (eIcon.length)
            (new Marka(eIcon[0])).set(eIcon.attr('data-icon-orig'));
        eSlider.slideUp()
    };

    var fOpen = function () {
        if (eIcon.length) {
            eIcon.attr('data-icon-orig', eIcon.attr('data-icon'));
            (new Marka(eIcon[0])).set('times');
        }

        if(typeof sPosition == 'object')
            fPositionElement(sPosition);
        else if(typeof sPosition == 'string' && sPosition == 'block')
            fPositionBlock();
        else
            fPositionSite();

        eSlider.slideDown();

        eSlider.data('data-control-btn', e);        
    };    
    
    if ('undefined' == typeof(sPosition))
        sPosition = 'block';

    if (eSlider.is(':visible')) {
        fClose();
        $(e).focus();

        $(document).off('click.bx-sliding-menu touchend.bx-sliding-menu');
        $(window).off('resize.bx-sliding-menu');
    }
    else {
        bx_menu_slide_close_all_opened();

        $(document).off('click.bx-sliding-menu touchend.bx-sliding-menu');
        $(window).off('resize.bx-sliding-menu');

        fOpen();
        eSlider.find('.bx-popup-content a:first').focus();
        eSlider.find('a').each(function () {
            $(this).off('click.bx-sliding-menu');
            $(this).on('click.bx-sliding-menu', function () {
                fClose();
            });
        });

        setTimeout(function () {

            var iWidthPrev = $(window).width();
            $(window).on('resize.bx-sliding-menu', function () {
                if ($(this).width() == iWidthPrev)
                    return;
                iWidthPrev = $(this).width();
                bx_menu_slide_close_all_opened();
            });
 
            $(document).on('click.bx-sliding-menu touchend.bx-sliding-menu', function (event) {
                if ($(event.target).parents('.bx-sliding-menu, .bx-sliding-menu-main, .bx-popup-slide-wrapper, .bx-db-header').length || $(event.target).filter('.bx-sliding-menu-main, .bx-popup-slide-wrapper, .bx-db-header').length || e === event.target)
                    event.stopPropagation();
                else
                    bx_menu_slide_close_all_opened();
            });

        }, 10);
    }
}

/**
 * Close all opened sliding menus
 */
function bx_menu_slide_close_all_opened () {
    $('.bx-sliding-menu:visible, .bx-sliding-menu-main:visible, .bx-popup-slide-wrapper:visible').each(function () {
        bx_menu_slide_inline('#' + this.id);
    });
}

/*
 * Note. oData.count_old and oData.count_new are also available and can be checked or used in notification popup.  
 */
function bx_menu_show_live_update(oData) {
    var sSelectorAddon = '.bx-menu-item-addon';

    //--- Update Child Menu Item
    if(oData.mi_child) {
        var oMenuItem = $('.bx-menu-object-' + oData.mi_child.menu_object + ' .bx-menu-item-' + oData.mi_child.menu_item);
        var oMenuItemAddon = oMenuItem.find(sSelectorAddon);

        if(oMenuItemAddon.length > 0)
            oMenuItemAddon.html(oData.count_new);
        else
            oMenuItem.append(oData.code.replace('{count}', oData.count_new));

        //+++ Check for 0 value
        oMenuItemAddon = oMenuItem.find(sSelectorAddon);
        if(parseInt(oData.count_new) > 0)
            oMenuItemAddon.show();
        else
            oMenuItemAddon.hide();
    }

    //--- Update Parent Menu Item
    if(oData.mi_parent) {
        var oMenuItem = $('.bx-menu-object-' + oData.mi_parent.menu_object + ' .bx-menu-item-' + oData.mi_parent.menu_item);
        var oMenuItemAddon = oMenuItem.find(sSelectorAddon);

        var sMediaType = bx_check_mq();
        if(sMediaType == 'mobile')
            sMediaType = 'phone';

        var iSum = 0;
        $('.bx-media-' + sMediaType + ' .bx-menu-object-' + oData.mi_child.menu_object + ' .bx-menu-item:not(.bx-def-media-' + sMediaType + '-hide) .bx-menu-item-addon').each(function() {
            iValue = parseInt($(this).html());
            if(iValue && iValue > 0)
                iSum += iValue;
        });

        if(oMenuItemAddon.length > 0)
            oMenuItemAddon.html(iSum);
        else
            oMenuItem.append(oData.code.replace('{count}', iSum));

        //+++ Check for 0 value
        oMenuItemAddon = oMenuItem.find(sSelectorAddon);
        if(iSum > 0)
            oMenuItemAddon.show();
        else
            oMenuItemAddon.hide();
    }
}

function bx_menu_show_more_less(oLink, sMenu, sSelectorParent) {
    if(!sSelectorParent)
        sSelectorParent = 'ul';

    var sClass = 'bx-mi-hidden';
    $(oLink).parents(sSelectorParent + ':first').find('.bx-mi-aux, .bx-psmi-show-more, .bx-psmi-show-less').toggleClass(sClass);

    $.get(sUrlRoot + 'menu.php', {
        o: sMenu, 
        a: 'set_collapsed', 
        v: $(oLink).parents(sSelectorParent + ':first').find('.bx-mi-aux').hasClass(sClass) ? 1 : 0
    });
}

function bx_menu_toggle_contents(oLink, sSelectorParent) {
    if(!sSelectorParent)
        sSelectorParent = '.bx-menu-contents';

    var sClass = 'bx-m-collapsed';
    var oParent = $(oLink).parents(sSelectorParent + ':first');

    oParent.toggleClass(sClass);
    oParent.siblings('.bx-menu-content').toggle();

    return false;
}

function bx_menu_toggle(oLink, sMenu, sMenuItem, sSelectorParent) {
    if(!sSelectorParent)
        sSelectorParent = 'li';

    var sClass = 'bx-mi-collapsed';
    var oParent = $(oLink).parents(sSelectorParent + ':first');

    oParent.toggleClass(sClass);

    $.get(sUrlRoot + 'menu.php', {
        o: sMenu, 
        a: 'set_collapsed_submenu',
        i: sMenuItem,
        v: oParent.hasClass(sClass) ? 1 : 0
    });
    
    return false;
}

function bx_menu_followings_load_more(oLink, sMenu, sContextModule, iStart, iPerPage) {
    var oLoadingParent = $(oLink).length ? $(oLink).parents('.bx-menu-item:first') : $('body'); 

    bx_loading(oLoadingParent, true);

    $.get(sUrlRoot + 'menu.php', {
        o: sMenu, 
        a: 'load_more', 
        v: sContextModule,
        start: iStart,
        per_page: iPerPage
    }, function(oData) {
        bx_loading(oLoadingParent, false);

        if(oData && oData.content != undefined)
            $(oLink).parents('.bx-menu-subitem:first').replaceWith(oData.content);
    }, 'json');
}

/**
 * Set ACL level for specified profile
 * @param iProfileId - profile id to set acl level for
 * @param iAclLevel - acl level id to assign to a given rofile
 */
function bx_set_acl_level (iProfileId, iAclLevel, mixedLoadingElement) {
    var bBulk = !$.isNumeric(iProfileId);
    var iAclCard = !bBulk && $('#sys-acl-profile-' + iProfileId).length > 0 ? 1 : 0;

    var bLoading = typeof(mixedLoadingElement) != 'undefined';
    if(bLoading)
        bx_loading($(mixedLoadingElement), true);

    $.post(sUrlRoot + 'menu.php', {o:'sys_set_acl_level', profile_id: iProfileId, level_id: iAclLevel, card:iAclCard}, function(oData) {
        bx_on_set_acl_level(oData, mixedLoadingElement);
    }, 'json');
}

/**
 * Reset ACL level for specified profile to Standard.
 * @param iProfileId - profile id to reset acl level for
 */
function bx_reset_acl_level (iProfileId, mixedLoadingElement) {
    var bBulk = !$.isNumeric(iProfileId);
    var iAclCard = !bBulk && $('#sys-acl-profile-' + iProfileId).length > 0 ? 1 : 0;

    var fPerform = function() {
        var bLoading = typeof(mixedLoadingElement) != 'undefined';
        if(bLoading)
            bx_loading($(mixedLoadingElement), true);

        $.post(sUrlRoot + 'menu.php', {o:'sys_set_acl_level', profile_id: iProfileId, level_id: 3, card: iAclCard}, function(oData) {
            bx_on_set_acl_level(oData, mixedLoadingElement);
        }, 'json');
    };

    bx_confirm(_t('_Are_you_sure'), fPerform);
}

function bx_on_set_acl_level(oData, oLoadingElement) {
    if(typeof(oLoadingElement) != 'undefined')
        bx_loading($(oLoadingElement), false);

    if(oData.msg != undefined && oData.msg.length) {
        bx_alert(oData.msg);
        return;
    }

    if($(oLoadingElement).hasClass('bx-popup-applied'))
        $(oLoadingElement).dolPopupHide().remove();

    if(typeof(oData.card) == 'object')
        for(var iField in oData.card) {
            var oCard = $(oData.card[iField]);
            $('#' + oCard.attr('id')).replaceWith(oCard.bxTime());
        }
}

/**
 * Set badge for specified content
 * @param sModule - current module for content
 * @param iContentId - content id to set badge for
 * @param iBadgeId - badge id to assign to a given content
 */
function bx_set_badge (sModule, iContentId, iBadgeId, mixedLoadingElement) {
   
    var bLoading = typeof(mixedLoadingElement) != 'undefined';
    if(bLoading)
        bx_loading($(mixedLoadingElement), true);
    $.post(sUrlRoot + 'menu.php', {o:'sys_set_badges', module: sModule, content_id: iContentId, badge_id: iBadgeId}, function(oData) {
        if(bLoading)
            bx_loading($(mixedLoadingElement), false);

        if(oData.msg != undefined && oData.msg.length) {
            bx_alert(oData.msg);
            return;
        }

        if($(mixedLoadingElement).hasClass('bx-popup-applied'))
            $(mixedLoadingElement).dolPopupHide().remove();

        if(typeof(oData.card) == 'object')
            for(var iField in oData.card) {
                var oCard = $(oData.card[iField]);
                $('#' + oCard.attr('id')).replaceWith(oCard);
            }
		
		$('.bx-base-bages-container').html(oData.html);
		
    }, 'json');
}

function bx_get_notes(oSource,  sModule, iContentId, oOptions, oVars) {
    var oOptions = oOptions || {};
    var oVars = oVars || {};

    $.post(
        sUrlRoot + 'modules/?r=' + sModule + '/get_notes/',
        $.extend({content_id: iContentId}, oVars),
        function(oData) {
            if(oData && oData.popup != undefined) {
                if(typeof(oData.popup) == 'string')
                    oData.popup = {html: oData.popup, options: {}};

                oData.popup.options = $.extend({}, $.fn.dolPopupDefaultOptions, oData.popup.options, {
                    id: sModule + '_notes_' + iContentId, 
                    closeOnOuterClick: false,
                    removeOnClose: true,
                    onBeforeShow: function(oPopup) {
                        $(oPopup).find('.bx-popup-element-close').removeClass('bx-def-media-desktop-hide bx-def-media-tablet-hide');
                    }
                }, oOptions);
            }
            
            processJsonData(oData);
        },
        'json'
    );
}

function bx_approve(oSource,  sModule, iContentId, oOptions, oVars) {
    var oOptions = oOptions || {};
    var oVars = oVars || {};

    var fPopupInit = function(oData) {
        if(oData && oData.popup != undefined) {
            if(typeof(oData.popup) == 'string')
                oData.popup = {html: oData.popup, options: {}};

            oData.popup.options = $.extend({}, $.fn.dolPopupDefaultOptions, oData.popup.options, {
                id: sModule + '_approve_' + iContentId, 
                closeOnOuterClick: false,
                removeOnClose: true,
                onBeforeShow: function(oPopup) {
                    $(oPopup).find('.bx-popup-element-close').removeClass('bx-def-media-desktop-hide bx-def-media-tablet-hide');

                    var oForm = $(oPopup).find('form');
                    if(oForm.length > 0) {
                        oForm.ajaxForm({ 
                            dataType: 'json',
                            beforeSubmit: function(aFormData, oForm, oOptions) {
                                bx_loading(oForm, true);
                            },
                            success: function(oData) {
                                $('.bx-popup-applied:visible').dolPopupHide();

                                fPopupInit(oData);

                                processJsonData(oData);
                            }
                        });
                    }
                }
            }, oOptions);
        }
    };

    $.post(
        sUrlRoot + 'modules/?r=' + sModule + '/approve/',
        $.extend({content_id: iContentId}, oVars),
        function(oData) {
            fPopupInit(oData);

            processJsonData(oData);
        },
        'json'
    );
}

function bx_showcase_init(sSelWrapper, sSelItem) {
    var oWrapper = $(sSelWrapper);

    if(oWrapper.closest('.bx-popup-wrapper').length != 0)
        return;

    oWrapper.each(function() {
        var sClassEnabled = 'bx-sc-enabled';
        var oShowcase = $(this);
        var oCells = oShowcase.find(sSelItem);

        if(oCells.width() * oCells.length <= oShowcase.parent().width()) {
            if(oShowcase.hasClass('flickity-enabled'))
                oShowcase.flickity('destroy').removeClass(sClassEnabled);

            return;
        }

        if(oShowcase.hasClass('flickity-enabled'))
            return;

        var oShowcaseOptions = {
            cellSelector: sSelItem,
            cellAlign: 'left',
            imagesLoaded: true,
            wrapAround: true,
            pageDots: false
        };

        var iGroupCells = oShowcase.attr('bx-sc-group-cells');
        if(iGroupCells != undefined)
            oShowcaseOptions.groupCells = parseInt(iGroupCells);

        oShowcase.on('ready.flickity', function() {
            $(this).addClass(sClassEnabled);
        }).flickity(oShowcaseOptions);
    });
}

function validateLoginForm(eForm) {
    return true;
}

/**
 * convert <time> tags to human readable format
 * @param sLang - use sLang localization
 * @param isAutoupdate - for internal usage only
 */
function bx_time(sLang, isAutoupdate, sRootSel) {
    if ('undefined' == typeof(sRootSel))
        sRootSel = 'body';
    var iAutoupdate = 22*60*60; // autoupdate time in realtime if less than 22 hours
    var sSel = 'time';

    if (typeof(sLang) != 'undefined')
        glBxTimeLang = sLang;
    else if(typeof(glBxTimeLang) != 'undefined')
        sLang = glBxTimeLang;

    if(!sLang)
        return;

    if ('undefined' != typeof(isAutoupdate) && isAutoupdate)
        sSel += '.bx-time-autoupdate';

    $(sRootSel).find(sSel).each(function () {
        var s;
        var sTime = $(this).attr('datetime');
        var iSecondsDiff = moment(sTime).unix() - moment().unix();
        if (iSecondsDiff < 0)
            iSecondsDiff = -iSecondsDiff;

        if (iSecondsDiff < $(this).attr('data-bx-autoformat'))
            s = moment(sTime).locale(sLang).fromNow(); // 'time ago' format
        else if (1 == $(this).attr('data-bx-utc'))
            s = moment.utc(sTime).locale(sLang).format($(this).attr('data-bx-format')); 
        else
            s = moment(sTime).locale(sLang).format($(this).attr('data-bx-format'));

        if (iSecondsDiff < iAutoupdate)
            $(this).addClass('bx-time-autoupdate');
        else
            $(this).removeClass('bx-time-autoupdate');

        $(this).html(s);
    });

    if ($('time.bx-time-autoupdate').size()) {
        setTimeout(function () {
            bx_time(sLang, true);
        }, 20000);
    }
}

(function($) {

    $.fn.bxTime = function() {
        bx_time(undefined, undefined, this);
        return this;
    };

    /**
     * process HTML which was added dynamicly on the page
     */ 
    $.fn.bxProcessHtml = function (oCallback) {
        var eElement = $(this);
        if ('undefined' !== typeof(eElement)) {
            // process js time
            eElement.bxTime();
            bx_process_links();
            
            // process web forms
            if ($.isFunction($.fn.addWebForms))
	            eElement.addWebForms();
            
            // process animating icons
        	bx_activate_anim_icons();

            // process syntax hightlighing
            if ('undefined' !== typeof(Prism) && eElement.size())
                Prism.highlightAllUnder(eElement[0]);

            // process links
            bx_redirect_for_external_links(eElement);

            // flickity update
            setTimeout(function () {
                const oFlickity = eElement.find('.flickity-enabled');
                if (oFlickity.length)
                    oFlickity.flickity('resize');
            }, 250);
        }
        if ('undefined' !== typeof(oCallback)) {
            oCallback(eElement);
        }

        if (typeof glOnProcessHtml !== 'undefined' && glOnProcessHtml instanceof Array) {
            for (var i = 0; i < glOnProcessHtml.length; i++)
                if (typeof glOnProcessHtml[i] === "function")
                    glOnProcessHtml[i](this);
        }
        
        return this;
    };

    $.fn.bxCheckOverflowHeight = function(sClass, onFind) {
    	if(!sClass)
            sClass = 'bx-overflow';

        return this.each(function() {
            var oElement = $(this);
            if(oElement.hasClass(sClass) || oElement.css('overflow') != 'hidden')
            	return;

            if(oElement.find('img').length > 0) {
                var oImg = oElement.find('img:first').get(0);

                const oImgCopy = new Image();
                oImgCopy.src = oImg.src;
                oImgCopy.onload = function() {
                    var iHeightParent = oElement.height();
                    var iHeightImg = oImg.clientHeight;
                    var iOffsetTopImg = oImg.offsetTop;
                    if(iOffsetTopImg < iHeightParent && iOffsetTopImg + iHeightImg > iHeightParent)
                        oElement.css('max-height', (iOffsetTopImg + iHeightImg +  50) + 'px');

                    if(oElement.prop('scrollHeight') <= Math.ceil(oElement.height()))
                        return;

                    oElement.addClass(sClass);
                    if(typeof onFind === 'function')
                        onFind(oElement);
                }
            }
            else {
                if(oElement.prop('scrollHeight') <= Math.ceil(oElement.height()))
                    return;

                oElement.addClass(sClass);
                if(typeof onFind === 'function')
                    onFind(oElement);
            }
        });
    };

    $.fn.bxConvertEmbeds = function() {
        return this.each(function() {
            $(this).find(".bx-embed-link").each(function() {
                var oItem = $(this);
                oItem.html(oItem.attr('source'));
                $.getJSON(sUrlRoot + '/embed.php?', {a: 'get_link', l: oItem.attr('source')}, function(oData) {
                    oItem.html(oData.code)
                    if(oItem.find('a').length > 0)
                        bx_embed_link(oItem.find('a')[0]);
                });
            });
        });
    };
} (jQuery));


/**
 * Perform connections AJAX request. 
 * In case of error - it shows js alert with error message.
 * In case of success - the page is reloaded.
 * 
 * @param sObj - connections object
 * @param sAction - 'add', 'remove' or 'reject'
 * @param iContentId - content id, initiator is always current logged in user
 * @param bConfirm - show confirmation dialog
 */
function bx_conn_action(e, sObj, sAction, iContentId, bConfirm, fOnComplete) {
    var fPerform = function() {
		var aParams = {
		    obj: sObj,
		    act: sAction,
		    id: iContentId
		};
		var fCallback = function (data) {
		    bx_loading_btn(e, 0);
		    if ('object' != typeof(data))
		        return;
		    if (data.err) {
		        bx_alert(data.msg);
		    } else {
		        if ('function' == typeof(fOnComplete))
		            fOnComplete(data, e);
		        else if (!loadDynamicBlockAuto(e))
		            location.reload();
		        else
		            $('#bx-popup-ajax-wrapper-bx_persons_view_actions_more').remove();
		    }
		};
		
		bx_loading_btn(e, 1);
		
		$.ajax({
		    dataType: 'json',
		    url: sUrlRoot + 'conn.php',
		    data: aParams,
		    type: 'POST',
		    success: fCallback
		});
    };

    if (typeof(bConfirm) != 'undefined' && bConfirm)
    	bx_confirm(_t('_Are_you_sure'), fPerform);
    else
    	fPerform();
}

/**
 * Perform recommendations AJAX request. 
 * In case of error - it shows js alert with error message.
 * In case of success - the page is reloaded.
 * 
 * @param sObj - recommendation object
 * @param sAction - 'ignore'
 * @param iContentId - content id, initiator is always current logged in user
 * @param bConfirm - show confirmation dialog
 */
function bx_recommendation_action(e, sObj, sAction, iContentId, bConfirm, fOnComplete) {
    var fPerform = function() {
        var aParams = {
            obj: sObj,
            act: sAction,
            id: iContentId
        };

        var fCallback = function (data) {
            bx_loading_btn(e, 0);
            if ('object' != typeof(data))
                return;

            if (data.msg)
                bx_alert(data.msg);
            else {
                if ('function' == typeof(fOnComplete))
                    fOnComplete(data, e);
                else if (!loadDynamicBlockAuto(e))
                    location.reload();
            }
        };

        bx_loading_btn(e, 1);

        $.ajax({
            dataType: 'json',
            url: sUrlRoot + 'recommendation.php',
            data: aParams,
            type: 'POST',
            success: fCallback
        });
    };

    if (typeof(bConfirm) != 'undefined' && bConfirm)
    	bx_confirm(_t('_Are_you_sure'), fPerform);
    else
    	fPerform();
}

function bx_append_url_params (sUrl, mixedParams) {
    var sParams = sUrl.indexOf('?') == -1 ? '?' : '&';

    var sHash = '';
    if(sUrl.indexOf('#') != -1) {
        var oUrl = new URL(sUrl);
        if(oUrl.hash.length > 0) {
            sHash = oUrl.hash;
            sUrl = sUrl.replace(sHash, '');
        }
        else
            sUrl = sUrl.replace('#', '');
    }

    if(mixedParams instanceof Array) {
    	for(var i in mixedParams)
            sParams += i + '=' + mixedParams[i] + '&';
        sParams = sParams.substr(0, sParams.length-1);
    }
    else if(mixedParams instanceof Object) {
    	$.each(mixedParams, function(sKey, sValue) {
    		sParams += sKey + '=' + sValue + '&';
    	});
        sParams = sParams.substr(0, sParams.length-1);
    }
    else
        sParams += mixedParams;

    return sUrl + sParams + sHash;
}

function bx_search_extnded_sort(obj, url){
    location.href = url + '&sort=' +$(obj).val();
}

function bx_search_on_type (e, n, sFormSel, sResultsContSel, sLoadingContSel, bSortResults, iMinLen, onComplete, onCancel) {
    var oForm = $(e.target).parents(sFormSel + ':first');

    if ('undefined' != typeof(e)) {
        if(e.keyCode == 13) {
            oForm.find('input[name=live_search]').val(0);
            oForm.submit();
            return false;
        }

        if(e.keyCode == 27) { 
            if(typeof onCancel === 'function')
                onCancel(oForm);
        }
    }

    iMinLen = typeof(iMinLen) != 'undefined' ? parseInt(iMinLen) : 0;
    if(iMinLen > 0 && iMinLen > (oForm.find('input[name=keyword]').val().length + 1))
        return true;

    if ('undefined' != typeof(glBxSearchTimeoutHandler) && glBxSearchTimeoutHandler)
        clearTimeout(glBxSearchTimeoutHandler);

    glBxSearchTimeoutHandler = setTimeout(function () {
        bx_search (n, sFormSel, sResultsContSel, sLoadingContSel, bSortResults, onComplete);
    }, 500);

    return true;
}

function bx_search (n, sFormSel, sResultsContSel, sLoadingContSel, bSortResults, onComplete) {
    if ('undefined' == typeof(sLoadingContSel))
        sLoadingContSel = sResultsContSel;
    if ('undefined' == typeof(bSortResults))
        bSortResults = false;

    var sQuery = $('input', sFormSel).serialize();

    bx_loading($(sLoadingContSel), true);
    $.post(sUrlRoot + 'searchKeywordContent.php', sQuery, function(data) {
        bx_loading($(sLoadingContSel), false);

        if(!data)
            return;

        if (bSortResults) {
            var sAsk = $(data).filter(".bx-btn.sys-agents-ask");

            var aSortedUnits = $(data).find(".bx-def-unit-live-search").toArray().sort(function (a, b) {
                return b.getAttribute('data-ts') - a.getAttribute('data-ts');
            });

            data = '';
            if(sAsk.length)
                data += sAsk.get(0).outerHTML;

            $.each(aSortedUnits.slice(0, n), function (i, e) {
                data += e.outerHTML;
            });
            
            
        } 

        var oContainer = $(sResultsContSel);
        oContainer.html(data).bxProcessHtml();

        if(typeof onComplete === 'function')
            onComplete(oContainer, data);
    });

    return false;
}

function on_filter_apply(e, sInputId, sFilterName)
{
	var oRegExp = new RegExp("[&]{0,1}" + sFilterName + "=.*");
    var s = ('' + document.location).replace(oRegExp, ''); // remove filter
    s = s.replace(/page=\d+/, 'page=1'); // goto 1st page
    if (e.checked && $('#' + sInputId).val().length > 2)
        s += (-1 == s.indexOf('?') ? '?' : '&') + sFilterName + '=' + $('#' + sInputId).val(); // append filter
    document.location = s;
}

function on_filter_key_up (e, sCheckboxId)
{
    if (13 == e.keyCode) {
        $('#' + sCheckboxId).click();
        return false;
    }
    else {
        $('#' + sCheckboxId).removeAttr('checked');
        return true;
    }
}

function on_copyright_click()
{
	oDate = new Date();

	$(document).dolPopupAlert({
		message: _t('_copyright', oDate.getFullYear())
	});
}

function bx_activate_anim_icons(sColor)
{
    if(typeof(sColor) != 'undefined')
        glBxAnimIconColor = sColor;
    else if(typeof(glBxAnimIconColor) != 'undefined')
        sColor = glBxAnimIconColor;

    if(!sColor)
        return;

    $('.sys-icon-a').not('.marka').each(function () {
        var e = $(this);
        var m = new Marka(e.get(0)), r = e.attr('data-rotate'), c = e.attr('data-color');
        m.set(e.attr('data-icon')).rotate(r ? r : 'down').color(c ? c : sColor);
    });
}

function bx_get_param(s) {
    if (!window.aDolOptions || !aDolOptions[s])
        return false;

    return aDolOptions[s];
}

function bx_autocomplete_fields(iId, sUrl, sName, bShowImg, bOnlyOnce, onSelect){
	if (!$('#' + iId).hasClass('bx-form-input-autotoken'))
			$('#' + iId).addClass('bx-form-input-autotoken');
	
	$('#' + iId + ' input[type=text]').autocomplete({
		source: sUrl,
        focus: function(e, ui ) {
            $(this).val(ui.item.label); 
            e.preventDefault();
        },
		select: function(e, ui) {
			$(this).val(ui.item.label);
			$(this).trigger('superselect', ui.item);
					
			if (typeof onSelect === 'function')
				onSelect(ui);
			
			e.preventDefault();			
		}
	});
	if ($('#' + iId + ' .val').length > 0 && bOnlyOnce)
		$('#' + iId + ' input[type=text]').hide();
	$('#' + iId + ' input[type=text]').on('superselect', function(e, item) {
		$(this).hide();
		if ('undefined' != typeof(item)) {
			var sImage = '';
			if(bShowImg && item.unit != undefined)
				sImage = item.unit;
			else if(bShowImg && item.thumb != undefined)
				sImage = '<img class="bx-def-thumb bx-def-icon-size bx-def-margin-sec-right" src="' + item.thumb + '">';

			$(this).before('<b class="val bx-def-color-bg-hl bx-def-round-corners">' + sImage + item.label + '<i class="sys-icon times ltr:ml-1 rtl:mr-1"></i><input type="hidden" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" name="' + sName + (bOnlyOnce ? '' : '[]') + '" value="' + item.value + '" /></b>');
		}

		if (!bOnlyOnce)
		{
			fAutoShrinkInput();
			$(this).show();
			this.value = '';
		}

	}).on('keydown', function(e) {

		// if: comma,enter (delimit more keyCodes with | pipe)
		if (/(13)/.test(e.which))
			e.preventDefault();

	});

	$('#' + iId).on('click', 'b', function() {
		$(this).remove();
			
		if (bOnlyOnce)
			$('#' + iId + ' input[type=text]').val('').show();
		else
			fAutoShrinkInput();
	});

	fAutoShrinkInput = function () {
		var iWidthCont = $('#' + iId + '.bx-form-input-autotoken').innerWidth();
		var iWidthExisting = 0;
		$('#' + iId + '.bx-form-input-autotoken b').each(function () {
			iWidthExisting += $(this).outerWidth(true);
		});

		$('#' + iId + '.bx-form-input-autotoken input').innerWidth(parseInt(iWidthCont - iWidthExisting > 180 ? iWidthCont - iWidthExisting : 180) - 5);
	};

	if (!bOnlyOnce)
		fAutoShrinkInput();
	else
		$('#' + iId + '.bx-form-input-autotoken input').outerWidth('100%');
};

function bx_alert(sMessage, fOnClickOk, oParams)
{
    $(document).dolPopupAlert({
        message: sMessage,
        onClickOk: fOnClickOk,
        params: oParams
    });
}

function bx_confirm(sMessage, fOnClickYes, fOnClickNo, oParams)
{
    $(document).dolPopupConfirm({
        message: sMessage,
        onClickYes: fOnClickYes,
        onClickNo: fOnClickNo,
        params: oParams
    });
}

function bx_prompt(sMessage, sValue, fOnClickOk, fOnClickCancel, oParams)
{
    $(document).dolPopupPrompt({
        message: sMessage,
        value: sValue,
        onClickOk: fOnClickOk,
        onClickCancel: fOnClickCancel,
        params: oParams
    });
}

function bx_is_color_scheme_dark()
{
    return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function bx_get_color_scheme()
{
    return 'theme' in localStorage ? localStorage.theme : 'auto';    
}

function bx_set_color_scheme(iCode)
{
    switch(iCode) {
        case 0:
            localStorage.removeItem('theme');
            break;

        case 1:
            localStorage.theme = 'sun'
            break;

        case 2:
            localStorage.theme = 'dark'
            break;
    }

    //--- Change scheme.
    bx_set_color_scheme_html();

    //--- Notify global handlers.
    if(typeof glOnColorSchemeChange === 'undefined' || !(glOnColorSchemeChange instanceof Array)) 
        return;

    if(typeof iCode === 'undefined' || !iCode)
        iCode = this.isColorSchemeDark() ? 2 : 1;

    for(var i = 0; i < glOnColorSchemeChange.length; i++)
        if(typeof glOnColorSchemeChange[i] === 'function')
            glOnColorSchemeChange[i](iCode);
}

function bx_set_color_scheme_html()
{
    if(bx_is_color_scheme_dark())
        $('html').addClass('dark')
    else
        $('html').removeClass('dark')
}

function bx_is_mouse()
{
    return matchMedia('(pointer:fine)').matches;
}

function bx_is_touch_device()
{
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
}

/**
 * Check if mobile or desktop device.
 */
function bx_check_mq()
{
    if (typeof glOnCheckMq === 'function') {
        return glOnCheckMq();
    }

    return window.getComputedStyle(document.querySelector('body'), '::before').getPropertyValue('content').replace(/'/g, "").replace(/"/g, "");
}

/**
 * This function loads the passed list of CSS files. In case when this function is called for dynamic loading 
 * of the same file but many times it allows to avoid multiply loadings of the same file.
 */
function bx_get_style(mixedUrl)
{
    if(typeof(mixedUrl) === 'string')
        mixedUrl = new Array(mixedUrl);

    for(let i = 0; i < mixedUrl.length; i++) {
        if(mixedUrl[i] === undefined || !mixedUrl[i].length || $("link[href = '" + mixedUrl[i] + "']").length > 0)
            continue;

        $("head").append($("<link rel='stylesheet' href='" + mixedUrl[i] + "' type='text/css' />"));
    }
}

/**
 * This function loads the passed list of js files and executes callback function when the all files are loaded.
 * In case when this function is called for dynamic loading of the same file but many times (like Plyr video init)
 * it allows to avoid multiply loadings of the same file.
 */
function bx_get_scripts (aFiles, fCallback)
{
    let iCounter = 0;
    const
        iLength = aFiles.length,
        fHandler = function() {
            if (iCounter++ >= (iLength-1) && typeof(fCallback) === 'function')
                fCallback();
            else
                fExecute(aFiles[iCounter]);
        },
        // Check if js file is not loaded yet then start to load it and returns Promise.
        // All functions which try to load the same file will wait for loading of the file
        // and then continue to work
        fExecute = function(sFile) {
            if ('undefined' === typeof(glBxLoadedScripts[sFile]))
                glBxLoadedScripts[sFile] = { complete : $.bxGetCachedScript(sFile).done(fHandler) };
            else
                glBxLoadedScripts[sFile].complete.then(fHandler);
        };

    if ('undefined' === typeof(glBxLoadedScripts))
        glBxLoadedScripts = {};

    fExecute(aFiles[iCounter]);
}

jQuery.bxGetCachedScript = function(sUrl, oOptions) 
{
    oOptions = $.extend(oOptions || {}, {
        dataType: "script",
        cache: true,
        url: sUrl
    });

    return jQuery.ajax(oOptions);
};

function bx_is_selector_in_stylesheet(sSel)
{
    var a = [];
    var aSs = document.styleSheets;
    for (var sSheet = 0; sSheet < aSs.length; sSheet++) {
        var ruleList = document.styleSheets[sSheet].cssRules;
        for (var rule = 0; rule < ruleList.length; rule++)
           a.push(ruleList[rule].selectorText);
    }
    return -1 !== a.indexOf(sSel);
}

function bx_copy_to_clipboard(s, onSuccess, onFail)
{
    if ("undefined" === typeof(onSuccess))
        onSuccess = function (){};
    if ("undefined" === typeof(onFail))
        onFail = function (){};

    const oClip = navigator.clipboard;
    if ("undefined" !== typeof(oClip)) {
        navigator.clipboard.writeText(s).then(onSuccess, onFail);
    } 
    else {
        if (document.execCommand) {
            const el = document.createElement("input");
            el.value = s;
            document.body.append(el);

            el.select();
            el.setSelectionRange(0, s.length);

            if (document.execCommand("copy")) {
                onSuccess();
            }

            el.remove();
        }
        else {
            onFail();
        }
    }
}

function bx_regexp_escape(s) 
{
    return s
        .replace(/[|\\{}()[\]^$+*?.]/mg, '\\$&')
        .replace(/-/mg, '\\x2d');
}

function bx_get_regexp(sType) 
{
    var o = {
        tag:"(<([^>]+bx-tag[^>]+)>)",
        mention: "(<([^>]+bx-mention-link[^>]+)>)",
        url: "(([A-Za-z]{3,9}:(?:\\/\\/)?)(?:[\\-;:&=\\+\\$,\\w]+@)?[A-Za-z0-9\\.\\-]+|(?:www\\.|[\\-;:&=\\+\\$,\\w]+@)[A-Za-z0-9\\.\\-]+)((?:\\/[\\+~%#\\/\\.\\w\\-_!\\(\\)]*)?\\??(?:[\\-\\+=&;%@\\.\\w_]*)#?(?:[\\.\\!\\/\\w]*))?"
    };

    return o[sType];
}

function bx_process_links()
{
    // process links in container
    $('.bx-lnk-cnt .bx-lnk-src:not(.bx-inited)').each(function() {
        $(this).addClass('bx-inited');
        var sUrl = $(this).prop('href');
        $(this).parents('.bx-lnk-cnt').first().addClass('cursor-pointer').click(function(oEvent){
            if ($(oEvent.target).closest('a').length == 0 && $(oEvent.target).closest('button').length == 0 && $(oEvent.target).closest('form').length == 0 &&  $(oEvent.target).closest('input').length == 0){
                location.href = sUrl;
            }
        });
    });
}


function bx_redirect_for_external_links (e)
{
    if ('undefined' === typeof(aDolOptions.sys_confirmation_before_redirect) || 'on' !== aDolOptions.sys_confirmation_before_redirect)
        return;

    var aExclude = ['javascript:', 'about:', sUrlRoot];
    var sPattern = 'a';
    $(aExclude).each(function () {
        sPattern += ':not([href^="' + this + '"])';
    });
    if ('undefined' !== typeof(aDolOptions.sys_storage_s3_endpoint) && aDolOptions.sys_storage_s3_endpoint.length)
        sPattern += ':not([href^="https://' + aDolOptions.sys_storage_s3_endpoint + '"])';

    sPattern += ":is([href^='http://'],[href^='https://'])";

    if ('undefined' === typeof(e))
        e = $('document');

    e.find(sPattern).each(function() {
        if ($(this).attr('href').match(/s3\.amazonaws\.com/))
            return;
            
        $(this).on('contextmenu', function(e) {
            e.preventDefault();
        });
        $(this).on('click', function() {
        	var $this = $(this);
            bx_redirect_for_external_links_open($this.attr('href'));
	        return false;
        });
    });
}

function bx_redirect_for_external_links_open (sHref)
{
    //bx_confirm(_t('_sys_redirect_confirmation', sHref).replace(/\&quot;/g, ''), function () {
    //    window.open(sHref, '_blank').focus();
    //});
    window.open(sUrlRoot + 'page.php?i=redirect&url=' + encodeURIComponent(sHref), '_blank').focus();
}

function bx_agents_action(oElement, sTool, sAction, aParams)
{
    var oDate = new Date();
    var sQueryUrl = sUrlRoot + 'agents.php';
    var oQueryParams = jQuery.extend({}, {t: sTool, a: sAction, _t:oDate.getTime()}, aParams != undefined ? aParams : {});

    bx_loading_btn(oElement, true);

    jQuery.post (
        sQueryUrl,
        oQueryParams,
        function(oData) {
            bx_loading_btn(oElement, false);

            processJsonData(oData);
        },
        'json'
    );
}

function bx_get_focusable(oContext = 'document')
{
    return Array.from(oContext.querySelectorAll('button, [href], input:not([type="hidden"]), textarea, select, [tabindex]:not(.bx-focus-trap, [tabindex="-1"])')).filter(function(oElement) { 
        return !$(oElement).closest(':hidden').length; 
    });
}

function bx_clicked_stack_register()
{
    const iStackMaxLenth = 3;

    $('a,button').filter(function(iIndex, oElement) {
        return !$(oElement).closest('.bx-sidebar').length;
    }).on('click', function() {
        if(typeof window.glClickedStack === 'undefined')
            window.glClickedStack = [];    

        window.glClickedStack.push(this);

        if(window.glClickedStack && window.glClickedStack.length > iStackMaxLenth)
            window.glClickedStack = window.glClickedStack.slice(-iStackMaxLenth);
    });
}

function bx_clicked_stack_lenth()
{
    return window.glClickedStack ? window.glClickedStack.length : 0;
}

function bx_clicked_stack_get()
{
    const iLenth = bx_clicked_stack_lenth();
    return iLenth > 0 ? window.glClickedStack[iLenth - 1] : false;
}

function bx_clicked_stack_pop()
{
    return window.glClickedStack && window.glClickedStack.length > 0 ? window.glClickedStack.pop() : false;
}

/** @} */
