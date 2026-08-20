/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

(function($) {

    $.fn.dolPopupDefaultOptions = {
        parent: 'body', // parent element selector
        closeOnOuterClick: true,
        removeOnClose: false,
        closeElement: '.bx-popup-element-close', // link to element which will close popup
        position: 'centered', // | 'absolute' | 'fixed' | event | element,
        fog: true, // false | true | {color:string, opacity: float},
        pointer: false, // {el:(string_id|jquery_object), align: (left|right|center)},
        left: 0, // only for fixed or absolute
        top: 0, // only for fixed
        bottom: 'auto', // only for fixed or absolute
        moveToDocRoot: true,
        displayMode: 'trans', // trans | box | is needed for dynamic loading with dolPopupAjax
        onBeforeShow: function () {},
        onShow: function () {},
        onBeforeHide: function () {},
        onHide: function () {},
        speed: 200
    }; 

    $.fn.dolPopupDefaultPointerOptions = {
        align: 'right',
        offset: '0 0',
        offset_pointer: '0 0'
    }; 

    $.fn.dolPopupCenter = function () {
        var dy = $(window).height() > $(this).outerHeight() ? ($(window).height() - $(this).outerHeight()) / 2 : 0;
        var dx = $(window).width() > $(this).outerWidth() ? ($(window).width() - $(this).outerWidth()) / 2 : 0;
        this.css("position","absolute");        
        this.css("top", Math.max(0, dy + $(window).scrollTop()) + "px");
        this.css("left", Math.max(0, dx + $(window).scrollLeft()) + "px");
        return this;
    }
    
    $.fn.dolPopupCenterHor = function () {
        var dx = $(window).width() > $(this).outerWidth() ? ($(window).width() - $(this).outerWidth()) / 2 : 0;
        this.css("left", Math.max(0, dx + $(window).scrollLeft()) + "px");
        return this;
    }

    function _getScrollbarWidth () {
        if ($(document.body).height() <= $(window).height()) {
            return 0;
        }

        var outer = document.createElement("div"),
            inner = document.createElement("div"),
            widthNoScroll,
            widthWithScroll;

        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        document.body.appendChild(outer);

        widthNoScroll = outer.offsetWidth;

        // Force scrollbars
        outer.style.overflow = "scroll";

        // Add innerdiv
        inner.style.width = "100%";
        outer.appendChild(inner);

        widthWithScroll = inner.offsetWidth;

        // Remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    };

    function _dolPopupLockScreen (bLock) {
        var eBody = $(document.body);
        var eBodyHtml = $("html, body");
        if((bLock && eBodyHtml.hasClass('bx-popup-lock')) || (!bLock && !eBodyHtml.hasClass('bx-popup-lock'))) 
            return;

        var iPaddingRight = parseInt(eBody.css("padding-right")) + ((bLock ? 1 : -1) * _getScrollbarWidth());

        eBody.css("padding-right", iPaddingRight + "px");
        eBodyHtml.toggleClass('bx-popup-lock', bLock);
    };

    $.fn.dolPopup = function(options) {
        var $this = this;
        var options = options || {};
        var o = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if (false != o.pointer) {
            o.fog = false;
            o.pointer = $.extend({}, $.fn.dolPopupDefaultPointerOptions, $(document).data('bx-popup-options') ? $(document).data('bx-popup-options') : {}, o.pointer);
        }

        if (o.fog && !$('#bx-popup-fog').length) {
            $('<div id="bx-popup-fog" class="bx-popup-fog bx-def-z-index-overlay" style="display: none;">&nbsp;</div>').prependTo('body');
        }

        var oFogCss = {
            width: $(window).width(),
            height: $(window).height(),
        };

        if(typeof o.fog == 'object') {
            if(o.fog.opacity != undefined)
                oFogCss = $.extend({}, oFogCss, {opacity: o.fog.opacity});
            if(o.fog.color != undefined)
                oFogCss = $.extend({}, oFogCss, {backgroundColor: o.fog.color});
        }

        $('#bx-popup-fog').css(oFogCss);

        $(window).on('resize.popupFog', function () {
            $('#bx-popup-fog').css({
                width: $(window).width(),
                height: $(window).height()
            });
        }).on('keyup.popup', function(oEvent) {
            if(o.closeOnOuterClick && oEvent.which == 27)
                $this.dolPopupHide();
        });

        return this.each(function() {
            var $el = $(this);

            $el.addClass('bx-def-z-index-modal bx-popup-responsive');

            // element must have id
            if (!$el.attr('id'))
                return false;

            if ($el.is(":visible")) { // if popup is shown - hide it
                $el.dolPopupHide();
                return true;
            } 

            if (false != o.pointer)
                $el.addClass('bx-popup-with-pointer'); // to make all popups with pointer not responsive add: .removeClass('bx-popup-responsive')

            if (o.cssClass && o.cssClass != '' && !$el.hasClass(o.cssClass))
                $el.addClass(o.cssClass);

            // default style for correct positioning
            $el.css({
                display: 'block',
                visibility: 'hidden',
                position: 'absolute',
                top: 0,
                left: 0
            });

            if (o.moveToDocRoot)
                $el.detach().appendTo('body');

            setTimeout(function() { // timeout is needed for some browsers to render element

                if (o.fog)
                    _dolPopupLockScreen(true);

                // remove any transitions before setting popup position
                $el.removeClass('bx-popup-transitions bx-popup-inactive'); 

                // set popup position
                $el._dolPopupSetPosition(o);

                if (!$el.hasClass('bx-popup-applied')) { // do this only once
                    $el.addClass('bx-popup-applied');

                    // save options for element
                    $el.data('bx-popup-options', o);

                    // attach event for "close element"
                    if (o.closeElement) {
                        $(o.closeElement, $el)
                            .css('cursor', 'hand')
                            .click(function() {
                                $el.dolPopupHide();
                            });
                    }

                    // attach event for outer click checking
                    if (o.closeOnOuterClick) {
                        var fCallback = function(e) {
                            if ($el.hasClass('bx-popup-applied') && $el.is(':visible')) {
                                if ($(e.target).parents('#' + $el.attr('id')).length == 0) {
                                    $el.dolPopupHide();
                                }
                            }

                            return true;
                        }

                        $(document).on({
                            mousedown: fCallback,
                            touchend: fCallback
                        });
                    }
                }

                if(typeof(o.onBeforeShow) == 'function')
                	o.onBeforeShow($el);
                else if(typeof(o.onBeforeShow) == 'string')
                	eval(o.onBeforeShow);

                // transition effect
                if (o.moveToDocRoot) { 
                    // we need to disable classes with "max-height:100%", since popup isn't in the root element, so animation will not work when moveToDocRoot option is set 
                    $el.addClass('bx-popup-inactive');
                    setTimeout(function () {
                        $el.addClass('bx-popup-transitions bx-popup-active');
                    }, 10);
                }

                // Don't should popup with pointer if there is no parent. Checking before showing. 
                if(typeof o.pointer.el == 'string')
                    o.pointer.el = $(o.pointer.el);

                if($(o.pointer.el).length > 0 && !$.contains(document, o.pointer.el[0])) {
            		$el.remove();
            		return;
                }

                // show popup
                $el.css({display: 'block', visibility: 'visible'});
                if (o.fog) {
                    var oOnHide = function() {
                        $(window).triggerHandler('resize.popupFog');
                    };

                    if (o.speed > 0)
                        $('#bx-popup-fog').fadeIn(o.speed, oOnHide);
                    else
                        $('#bx-popup-fog').show(oOnHide);
                }

                /*
                 * Trap focus inside popup.
                 */
                $el.find('.bx-focus-trap').bind('focus', function() {
                    var aFocusable = bx_get_focusable($el.get(0));
                    if(aFocusable && aFocusable.length > 0)
                        $(aFocusable[0]).focus();
                });

                /*
                 * Add onHide to return focus back.
                 */
                if(bx_clicked_stack_lenth()) {
                    var onHide = null;
                    if(typeof(o.onHide) == 'function')
                        onHide = o.onHide;
                    else if(typeof(o.onHide) == 'string')
                        onHide = function(oPopup) {
                            eval(o.onHide);
                        };

                    o.onHide = function() {
                        if(typeof(onHide) == 'function')
                            onHide($el);

                        $(bx_clicked_stack_pop()).focus();
                    };
                }

                setTimeout(function () {
                    // Don't should popup with pointer if there is no parent. Checking after showing.
                    if(typeof o.pointer.el == 'string')
                        o.pointer.el = $(o.pointer.el);

                    if($(o.pointer.el).length > 0 && !$.contains(document, o.pointer.el[0])) {
                        $el.remove();
                        return;
                    }

                    var aFocusable = bx_get_focusable($el.get(0));
                    if(aFocusable && aFocusable.length > 0)
                        $(aFocusable[0]).focus();

                    if(typeof(o.onShow) == 'function')
                        o.onShow($el);
                    else if(typeof(o.onShow) == 'string')
                    	eval(o.onShow);

                }, o.speed);

            }, 100);
        });
    };

    $.fn.dolPopupInline = function(oOptionsCustom) {
    	if(typeof(oOptionsCustom) == 'undefined' || typeof(oOptionsCustom) != 'object')
            oOptionsCustom = {};

    	var oOptionsTotal = $.extend({}, oOptionsCustom, {
        	position: 'fixed',
        	top: '0px',
        	fog: false,
        	closeElement: '.bx-popup-close',
        	onBeforeShow: function(oPopup) {
        		if(typeof(oOptionsCustom.onBeforeShow) == 'function')
        			oOptionsCustom.onBeforeShow(oPopup);

        		$('body').addClass('bx-popup-inline-holder');
        	},
        	onBeforeHide: function(oPopup) {
        		if(typeof(oOptionsCustom.onBeforeHide) == 'function')
        			oOptionsCustom.onBeforeHide(oPopup);

        		$('body').removeClass('bx-popup-inline-holder');
        	},
        	onHide: function(oPopup) {
        		if(typeof(oOptionsCustom.onHide) == 'function')
        			oOptionsCustom.onHide(oPopup);

        		if(oOptionsCustom.removeOnClose == true)
        			$(oPopup).remove();
        	}
        });

    	return this.each(function() {
    		$(this).addClass('bx-popup-inline').dolPopup(oOptionsTotal);
    	});
    };

    $.fn.dolPopupFullScreen = function(oOptions) {
    	return this.each(function() {
    		$(this).addClass('bx-popup-full-screen').dolPopup(oOptions);
    	});
    };

    $.fn.dolPopupHide = function(options) { 

        if ('undefined' == typeof(options) || 'object' != typeof(options))
            options = {};

        return this.each(function() {
            var $el = $(this);

            if (!$el.hasClass('bx-popup-applied'))
                return false;

            if (!$el.is(':visible') || 'hidden' == $el.css('visibility') || 'none' == $el.css('display'))
                return false;            

            var o = $.extend({}, $el.data('bx-popup-options'), options);

            if (!o)
                return false;

            if ($el.data('bx-popup-timer'))
                clearInterval($el.data('bx-popup-timer'));
                    
            $(window).off('resize.popupWindow');
            $(window).off('resize.popupPointer');
            $(window).off('resize.popupFog');
            $(window).off('keyup.popup');

            if(typeof(o.onBeforeHide) == 'function')
            	o.onBeforeHide($el);
            else if(typeof(o.onBeforeHide) == 'string')
            	eval(o.onBeforeHide);

            $el.removeClass('bx-popup-active').addClass('bx-popup-inactive');

            var onHide = null;
            if(typeof(o.onHide) == 'function')
            	onHide = o.onHide;
            else if(typeof(o.onHide) == 'string')
            	onHide = function(oPopup) {
            		eval(o.onHide);
            	};

            if (o.speed > 0) {

                if (o.fog)
                    $('#bx-popup-fog').fadeOut(o.speed);

                setTimeout(function () {
                    $el.hide();

                    if(typeof(onHide) == 'function')
                    	onHide($el);

                    if(o.removeOnClose == true)
                		$el.remove();

                }, o.speed);

            } else {

                if (o.fog)
                    $('#bx-popup-fog').hide();

                $el.hide(function() {
                	if(typeof(onHide) == 'function')
                    	onHide($el);

                	if(o.removeOnClose == true)
                		$el.remove();
                });
            }
            
            _dolPopupLockScreen(false);
        });
    };


    $.fn.dolPopupAjax = function(options) { 
        options = options || {};
        options = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if(!options.url)
            return;

        if(!options.container)
            options.container = '.bx-popup-content-wrapped';

        var bDisplayModeBox = false;
        if(options.displayMode && options.displayMode == 'box')
            bDisplayModeBox = true;

        var bFullScreen = false;
        if(options.fullScreen !== undefined)
            bFullScreen = options.fullScreen;

        var bx_menu_on = function (e, b) {
            var li = $(e).parents('li:first');   
            if (!li.length)
                return;
            if (b) {
                var ul = $(e).parents('ul:first');   
                ul.find('li').removeClass('bx-menu-tab-active');
                li.addClass('bx-menu-tab-active');
            } else {
                li.removeClass('bx-menu-tab-active');
            }
        }

        var bx_menu_is_on = function (e) {    
            var li = $(e).parents('li:first');   
            if (!li.length)
                return false;
            return li.hasClass('bx-menu-tab-active');
        }

        return this.each(function() {
            var e = $(this);

            // get id
            var sPopupId = '';
            var sIdPrefix = 'bx-popup-ajax-wrapper-';
            if(typeof(e.attr('bx-popup-id')) != 'undefined')
            	sPopupId = sIdPrefix + e.attr('bx-popup-id');
            else if(typeof(options.id) != 'undefined')
            	switch(typeof(options.id)) {
                    case 'string':
                        sPopupId = sIdPrefix + options.id;
                        break;

                    case 'object':
                        sPopupId = typeof(options.id.force) != 'undefined' && options.id.force ? options.id.value : sIdPrefix + options.id.value;
                        break;
                }
            else
            	sPopupId = sIdPrefix + parseInt(2147483647 * Math.random());

            var oPointerOptions = $.isWindow(e[0]) ? false : $.extend({}, {el:$(e), align:'center'}, options.pointer);
            if ($('#' + sPopupId + ':visible').length) { // if popup exists and is shown - hide it

                $('#' + sPopupId).dolPopupHide();

            } 
            else if ($('#' + sPopupId).length) { // if popup exists but not shown - unhide it

                if (!$.isWindow(e[0]))
                    bx_menu_on(e, true);

                if (options.cssClass && options.cssClass != '' && !$('#' + sPopupId).hasClass(options.cssClass)) {
                    $('#' + sPopupId).addClass(options.cssClass);
                }

                var oPopupOptions = $.extend({}, options, {
                    pointer: oPointerOptions,
                    onHide: function (oPopup) {
                        if (!$.isWindow(e[0]))
                            bx_menu_on(e, false);

                        if(typeof(options.onHide) == 'function')
                        	options.onHide(oPopup);
                    }
                });

                if(bFullScreen)
                    $('#' + sPopupId).dolPopupFullScreen(oPopupOptions);
                else
                    $('#' + sPopupId).dolPopup(oPopupOptions);

            } 
            else { // if popup doesn't exists - create new one from provided url

                if (!$.isWindow(e[0]))
                    bx_menu_on(e, true);

                $('<div id="' + sPopupId + '" style="display:none;">' + $('#bx-popup-loading').html() + '</div>').appendTo(options.parent).find(options.container).hide();

                $('#' + sPopupId).addClass($('#bx-popup-loading').attr('class'));
                
                if (options.cssClass && options.cssClass != ''){
                    $('#' + sPopupId).addClass(options.cssClass);
                }
                
                var oLoading = $('#' + sPopupId + ' .bx-popup-loading-wrapped');
                bx_loading_content(oLoading, true, true);

                var oPopupOptions = $.extend({}, options, {
                    pointer: oPointerOptions,
                    onHide: function (oPopup) {
                        if (!$.isWindow(e[0]))
                            bx_menu_on(e, false);

                        if(typeof(options.onHide) == 'function')
                            options.onHide(oPopup);
                    }
                });

                if(bFullScreen && !bDisplayModeBox)
                    $('#' + sPopupId).dolPopupFullScreen(oPopupOptions);
                else
                    $('#' + sPopupId).dolPopup(oPopupOptions);

                var fOnLoad = function() {
                    bx_loading_content(oLoading, false);
                    
                    var oPopup = $('#' + sPopupId);

                    oPopup.find(options.container).bxProcessHtml().show();
                    oPopup._dolPopupSetPosition({
                        pointer: oPointerOptions
                    });

                    var aFocusable = bx_get_focusable(oPopup.get(0));
                    if(aFocusable && aFocusable.length > 0)
                        $(aFocusable[0]).focus();

                    if (typeof (options.onLoad) == 'function')
                        options.onLoad('#' + sPopupId);
                    else if (typeof (options.onLoad) == 'string')
                        eval(options.onLoad);

                };

                var fOnLoadImg = function () {
                    if($('#' + sPopupId).find('img').length > 0 && !$('#' + sPopupId).find('img').get(0).complete)
                        $('#' + sPopupId).find('img').load(fOnLoad);
                    else
                        fOnLoad();
                };

                var sUrl = (options.url.indexOf('http://') == 0 || options.url.indexOf('https://') == 0 || options.url.indexOf('/') == 0 ? '' : sUrlRoot) + options.url;

                if(bDisplayModeBox) {
                    options.container = '.bx-popup-content:first';

                    $.get(sUrl, function(sData) {
                        $('#' + sPopupId).replaceWith(sData);
                        if(bFullScreen)
                            $('#' + sPopupId).dolPopupFullScreen(oPopupOptions);
                        else
                            $('#' + sPopupId).dolPopup(oPopupOptions);

                        setTimeout(fOnLoadImg, 100); // TODO: better way is to check if item is animating before positioning it in the code where popup is positioning
                    });
                }
                else
                    $('#' + sPopupId).find(options.container).load(sUrl, function () {
                        setTimeout(fOnLoadImg, 100); // TODO: better way is to check if item is animating before positioning it in the code where popup is positioning
                    });
            }
        });
    };


    $.fn.dolPopupImage = function(sUrl, sLoadingElement) {

        return this.each(function() {

            var ePopup = $(this);
            var k = .97,
                w = $(window).width(),
                h = $(window).height(),
                eImg = new Image();

            if (!ePopup.find('img').size())
                return;

            ePopup.filter('.bx-popup-wrapper').addClass('bx-popup-image-wrapper');

            eImg.src = sUrl;

            if ('undefined' != typeof(sLoadingElement))
                bx_loading (sLoadingElement, true);

            $(eImg).on('load', function () {

                var ri = eImg.width / eImg.height;
                var rs = w/h;

                if ('undefined' != typeof(sLoadingElement))
                    bx_loading (sLoadingElement, false);

                ePopup.find('img').attr('src', sUrl);

                if ('undefined' != typeof(window.matchMedia) && window.matchMedia("(max-width:720px)").matches)
                    k = 1.0;

                // fit image into the browser window
                if (eImg.width < w * k && eImg.height < h * k) {
                    ePopup.find('img').css({
                        width: 'auto',
                        height: 'auto'
                    });
                }
                else {
                    ePopup.find('img').css({
                        width: rs > ri ? parseInt(k * eImg.width * h/eImg.height) + 'px' : 'auto',
                        height: rs > ri ? 'auto' : parseInt(k * eImg.height * w/eImg.width) + 'px',
                    }).addClass('bx-constrain-height');
                }
                
                // show popup
                ePopup.dolPopup();

                // hide popup upon clicking/tapping on the image
                var fCallback = function (e) {
                    e.stopPropagation();
                    ePopup.dolPopupHide();
                };
                ePopup.find('img').on({
                    click: fCallback,
                    touchend: fCallback
                });

            });
        });
    };

    $.fn.dolPopupAlert = function(options) {
    	var oAPopup = $('#bx-popup-alert');
        var sDefMessage = '', sDefBtnOkTitle = '';

        var oMessage = null;
    	if(options.message != undefined && options.message.length > 0) {
            oMessage = oAPopup.find('.popup_alert_text');

            sDefMessage = oMessage.html();
            oMessage.html(options.message).bxTime();
        }

        var oBtnOk = oAPopup.find('.popup_alert_ok');
        if(options.params != undefined && options.params.ok != undefined && options.params.ok.title != undefined && options.params.ok.title.length > 0) {
            sDefBtnOkTitle = oBtnOk.html();
            oBtnOk.html(options.params.ok.title);
        }

        var bFuncOk = options.onClickOk && typeof(options.onClickOk) == 'function';
        if(bFuncOk)
            options.closeOnOuterClick = false;

    	oBtnOk.bind('click', function() {
            if(bFuncOk)
                options.onClickOk(oAPopup);

            oAPopup.dolPopupHide();
        });
        
        var fOnShow = options.onShow;
        options.onShow = function(oPopup) {
            oBtnOk.focus();

            if(typeof(fOnShow) == 'function')
                fOnShow(oAPopup);
        };

        var fOnHide = options.onHide;
        options.onHide = function(oPopup) {
            if(typeof(fOnHide) == 'function')
                fOnHide(oAPopup);

            /**
             * Restore default functions and layout 
             * if the last one was customized.
             */
            oAPopup.find('.bx-btn').unbind('click');
            if(sDefMessage.length > 0)
                oMessage.html(sDefMessage);
            if(sDefBtnOkTitle.length > 0)
                oBtnOk.html(sDefBtnOkTitle);
        };

        oAPopup.dolPopup(options);
    };

    $.fn.dolPopupConfirm = function(options) {
    	var oCPopup = $('#bx-popup-confirm');
        var sDefMessage = '', sDefBtnYesTitle = '', sDefBtnNoTitle = '';

        var oMessage = null;
    	if(options.message != undefined && options.message.length > 0) {
            oMessage = oCPopup.find('.popup_confirm_text');

            sDefMessage = oMessage.html();
            oMessage.html(options.message);
        }

        var bParams = options.params != undefined;
        var oBtnYes = oCPopup.find('.popup_confirm_yes');
        if(bParams && options.params.yes != undefined && options.params.yes.title != undefined && options.params.yes.title.length > 0) {
            sDefBtnYesTitle = oBtnYes.html();
            oBtnYes.html(options.params.yes.title);
        }

        var oBtnNo = oCPopup.find('.popup_confirm_no');
        if(bParams && options.params.no != undefined && options.params.no.title != undefined && options.params.no.title.length > 0) {
            sDefBtnNoTitle = oBtnNo.html();
            oBtnNo.html(options.params.no.title);
        }

        var bFuncYes = options.onClickYes && typeof(options.onClickYes) == 'function';
        var bFuncNo = options.onClickNo && typeof(options.onClickNo) == 'function';
        if(bFuncYes || bFuncNo)
            options.closeOnOuterClick = false;

    	oBtnYes.bind('click', function(event) {
            event.stopPropagation();

            if(bFuncYes)
                options.onClickYes(oCPopup);

            oCPopup.dolPopupHide();
        });

        oBtnNo.bind('click', function(event) {
            event.stopPropagation();

            if(bFuncNo)
                options.onClickNo(oCPopup);

            oCPopup.dolPopupHide();
        });

        oCPopup.find('.bx-popup-element-close').off('click.popupDismiss').on('click.popupDismiss', function() {
            if(bFuncNo)
                options.onClickNo(oCPopup);
        });

        var fOnShow = options.onShow;
        options.onShow = function(oPopup) {
            oBtnYes.focus();

            if(typeof(fOnShow) == 'function')
                fOnShow(oCPopup);
        };

        var fOnHide = options.onHide;
        options.onHide = function(oPopup) {
            if(typeof(fOnHide) == 'function')
                fOnHide(oCPopup);

            /**
             * Restore default functions and layout 
             * if the last one was customized.
             */
            oCPopup.find('.bx-btn').unbind('click');
            oCPopup.find('.bx-popup-element-close').off('click.popupDismiss');
            if(sDefMessage.length > 0)
                oMessage.html(sDefMessage);
            if(sDefBtnYesTitle.length > 0)
                oBtnYes.html(sDefBtnYesTitle);
            if(sDefBtnNoTitle.length > 0)
                oBtnNo.html(sDefBtnNoTitle);
        };

        oCPopup.dolPopup(options);
    };

    $.fn.dolPopupPrompt = function(options) {
    	var oPPopup = $('#bx-popup-prompt');
        var sDefMessage = '', sDefValue = '', sDefBtnOkTitle = '', sDefBtnCancelTitle = '';

    	oPPopup.setValue = function(mixedValue) {
            return oPPopup.find('[name="bx-popup-prompt-value"]').val(mixedValue);
    	};

    	oPPopup.getValue = function() {
            return oPPopup.find('[name="bx-popup-prompt-value"]').val();
    	};   		

        var oMessage = null;
    	if(options.message != undefined && options.message.length > 0) {
            oMessage = oPPopup.find('.popup_prompt_text');

            sDefMessage = oMessage.html();
            oMessage.html(options.message);
        }

    	if(options.value != undefined && options.value.length > 0) {
            sDefValue = oPPopup.getValue();
            oPPopup.setValue(options.value);
        }

        var bParams = options.params != undefined;
        var oBtnOk = oPPopup.find('.popup_prompt_ok');
        if(bParams && options.params.ok != undefined && options.params.ok.title != undefined && options.params.ok.title.length > 0) {
            sDefBtnOkTitle = oBtnOk.html();
            oBtnOk.html(options.params.ok.title);
        }

        var oBtnCancel = oPPopup.find('.popup_prompt_cancel');
        if(bParams && options.params.cancel != undefined && options.params.cancel.title != undefined && options.params.cancel.title.length > 0) {
            sDefBtnCancelTitle = oBtnCancel.html();
            oBtnCancel.html(options.params.cancel.title);
        }

        var bFuncOk = options.onClickOk && typeof(options.onClickOk) == 'function';
        var bFuncCancel = options.onClickCancel && typeof(options.onClickCancel) == 'function';
        if(bFuncOk || bFuncCancel)
            options.closeOnOuterClick = false;

    	oBtnOk.bind('click', function() {
            if(bFuncOk)
                options.onClickOk(oPPopup);

            oPPopup.dolPopupHide();
        });

        oBtnCancel.bind('click', function() {
            if(bFuncCancel)
                options.onClickCancel(oPPopup);

            oPPopup.dolPopupHide();
        });

        oPPopup.find('.bx-popup-element-close').off('click.popupDismiss').on('click.popupDismiss', function() {
            if(bFuncCancel)
                options.onClickCancel(oPPopup);
        });

        var fOnShow = options.onShow;
        options.onShow = function(oPopup) {
            oBtnOk.focus();

            if(typeof(fOnShow) == 'function')
                fOnShow(oPPopup);
        };

        var fOnHide = options.onHide;
        options.onHide = function(oPopup) {
            if(typeof(fOnHide) == 'function')
                fOnHide(oPPopup);

            /**
             * Restore default functions and layout 
             * if the last one was customized.
             */
            oPPopup.find('.bx-btn').unbind('click');
            oPPopup.find('.bx-popup-element-close').off('click.popupDismiss');
            if(sDefMessage.length > 0)
                oMessage.html(sDefMessage);
            if(sDefValue.length > 0)
                oPPopup.setValue(sDefValue);
            else
                oPPopup.setValue('');
            if(sDefBtnOkTitle.length > 0)
                oBtnOk.html(sDefBtnOkTitle);
            if(sDefBtnCancelTitle.length > 0)
                oBtnCancel.html(sDefBtnCancelTitle);
        };

        oPPopup.dolPopup(options);
    };

    $.fn._dolPopupSetPosition = function(options) {
        
        var o = $.extend({}, $.fn.dolPopupDefaultOptions, options);

        if (undefined != o.pointer && false != o.pointer)
            o.pointer = $.extend({}, $.fn.dolPopupDefaultPointerOptions, $(document).data('bx-popup-options') ? $(document).data('bx-popup-options') : {}, o.pointer);

        return this.each(function() {
            var $el = $(this);
            
            if (o.pointer != false) {                
                
                var yOffset = 8;
                var ePointAt = typeof o.pointer.el == 'string' ? $(o.pointer.el) : o.pointer.el;
                if (!ePointAt)
                    ePointAt = $('body');

                var aOffset = ('' + o.pointer.offset).split(' ', 2);
                var aOffsetPointer = ('' + o.pointer.offset_pointer).split(' ', 2);
                if (undefined == aOffset[0] || undefined == aOffset[1])
                    aOffset = [0, 0];
                if (undefined == aOffsetPointer[0] || undefined == aOffsetPointer[1])
                    aOffsetPointer = [0, 0];

                $el.position({
                    of: ePointAt,
                    my: o.pointer.align + '+' + parseInt(aOffset[0]) + ' top+' + yOffset + '+' + parseInt(aOffset[1] - 0),
                    at: o.pointer.align + ' bottom',
                    collision: 'fit none'
                });

                $el.find('.bx-popup-box-pointer').css('display', 'block').position({
                    of: ePointAt,
                    my: 'center+' + (parseInt(aOffsetPointer[0]) + parseInt(aOffset[0])) + ' top+' + yOffset + '+' + (parseInt(aOffsetPointer[1]) + parseInt(aOffset[1]) + 0),
                    at: 'center bottom'
                });

                $(window).on('resize.popupPointer', function() {
                    $el.position({
                        of: ePointAt,
                        my: o.pointer.align + '+' + parseInt(aOffset[0]) + ' top+' + yOffset + '+' + parseInt(aOffset[1]),
                        at: o.pointer.align + ' bottom',
                        collision: 'flip none'
                    });
                });

            } else if (o.position == 'fixed' || o.position == 'absolute') {
                var bCenterHor = o.left != undefined && o.left == 'center';
                var oCss = {
                    position: o.position,
                    left: o.left,
                    top: o.top,
                    bottom: o.bottom
                };
                if(!bCenterHor)
                    oCss.left = o.left;

                $el.css(oCss);

                if(bCenterHor) {
                    var fReposition = function(oElement) {
                        oElement.dolPopupCenterHor();
                    };

                    fReposition($el);

                    // reposition popup when its height is changed
                    $el.data('bx-popup-height', $el.height());
                    $el.data('bx-popup-timer', setInterval(function () {
                        if ($el.height() > $el.data('bx-popup-height')) {
                            fReposition($el);
                            $el.data('bx-popup-height', $el.height());
                        }
                    }, 500));

                    // attach window resize event
                    $(window).on('resize.popupWindow', function() {
                        fReposition($el);
                    }).on('scroll', function() {
                        fReposition($el);
                    });
                }
            } else if (o.position == 'centered') {

            	var oPosition = function(oElement) {
                    oElement.dolPopupCenter();
            	};

            	oPosition($el);

                // reposition popup when its height is changed
                $el.data('bx-popup-height', $el.height());
                $el.data('bx-popup-timer', setInterval(function () {
                    if ($el.height() > $el.data('bx-popup-height')) {
                        oPosition($el);
                        $el.data('bx-popup-height', $el.height());
                    }
                }, 500));

                // attach window resize event
                $(window).on('resize.popupWindow', function() {
                	oPosition($el);
                }).on('scroll', function() {
                	oPosition($el);
                });

            } else if (typeof o.position == 'object') {

                $el.position({
                    of: o.position,
                    my: 'center top',
                    at: 'center bottom',
                    collision: 'flip flip'
                });

            }
        });
    };

})(jQuery);

/** @} */
