/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolGrid (sObject, oOptions) {
    this._iSearchTimeoutId = false;
    this._sObject = sObject;
    this._sIdWrapper = 'bx-grid-wrap-' + sObject;
    this._sIdContainer = 'bx-grid-cont-' + sObject;
    this._sIdTable = 'bx-grid-table-' + sObject;
    this._oOptions = oOptions;
    
    this._sCsrfToken = oOptions.csrf_token;

    this._sOrderField = undefined == oOptions.order_field ? '' : oOptions.order_field;
    this._sOrderDir = undefined == oOptions.order_dir ? 'ASC' : oOptions.order_dir;
    this._sSearchInputText = undefined == oOptions.text_search_input ? '' : oOptions.text_search_input;
    this._oPopupOptions = $.extend({
    	onBeforeShow: function(oElement) {
    		jQuery(oElement).bxProcessHtml();
    	}
    }, oOptions.popup_options);
    this._oQueryAppend = oOptions.query_append;
    this._oConfirmMessages = oOptions.confirm_messages;

    this.init(oOptions);
}

BxDolGrid.prototype.init = function (oOptions) {
    this._sFilter = undefined == oOptions.filter ? '' : oOptions.filter;
    if (this._sFilter.length)
        this._sSearchInputText = this._sFilter;

    $('#bx-grid-search-' + this._sObject).val(this._sSearchInputText);

    this._oQueryAppend = oOptions.query_append;

    this._onDataReloaded();

    if (this._sOrderField.length)
        this.setSorting (this._sOrderField, this._sOrderDir, true);
};

BxDolGrid.prototype.resetSorting = function (sField, sDir) {
    this._sOrderField = '';
    this._sOrderDir = 'ASC';
    this.reload(0);
};

BxDolGrid.prototype.setSorting = function (sField, sDir, isDisableReload) {
    
    if (typeof(sField) == "undefined" || 0 == sField.length)
        return;

    if (typeof(sDir) != "undefined")
        this._sOrderDir = 'DESC' == sDir ? 'DESC' : 'ASC'; // explicit order
    else
        this._sOrderDir = 'ASC'; // of sorting new field, always order in asceding order    
    
    this._sOrderField = sField;
    
    var sHtmlIndi = 'ASC' == this._sOrderDir ? ' &darr;' : ' &uarr;';
    jQuery('#' + this._sIdTable + ' *[bx_grid_sort_head] .bx-grid-sort-indi').hide();
    jQuery('#' + this._sIdTable + ' *[bx_grid_sort_head=' + sField + '] .bx-grid-sort-indi').html(sHtmlIndi).show();    
    
    if (typeof(isDisableReload) == "undefined" || !isDisableReload)
        this.reload(0);
};

BxDolGrid.prototype.setFilter = function (sFilter, isReload) {

    if (this._sFilter == sFilter)
        return;

    this._sFilter = sFilter;

    if (isReload) {
        if (sFilter.length > 0)
            this.reload(0);
        else
            this.reload();
    }
};

BxDolGrid.prototype.orderable = function () {
    var $this = this;
    jQuery('#' + this._sIdTable + ' *[bx_grid_sort_head] .bx-grid-sort-handle').bind('click', function () {                
        var sField = $(this).parents('*[bx_grid_sort_head]').attr('bx_grid_sort_head');
        if (sField) {
            $this.setSorting(sField, sField == $this._sOrderField ? ('ASC' == $this._sOrderDir ? 'DESC' : 'ASC') : undefined);
        }
    });
    
    if (this._sOrderField)
        this.setSorting (this._sOrderField, this._sOrderDir, true);
};

BxDolGrid.prototype.sortable = function () {
    var $this = this;
    jQuery('#' + this._sIdTable + ' tbody .bx-grid-drag-handle').show();
    jQuery('#' + this._sIdTable + ' tbody').sortable({
        handle: '.bx-grid-drag-handle',
        placeholder: 'bx-grid-drag-placeholder',
        items:'tr', 
        forcePlaceholderSize: true, 

        start: function(oEvent, oUi) {

            jQuery('#' + $this._sIdTable + ' tbody tr').removeClass('bx-def-color-bg-hl bx-grid-table-row-trans'); // remove rows highlighting and transitions  

            oUi.placeholder.html('<td colspan="' + $this._oOptions.columns + '">&rarr;</td>'); // add placeholder with arrow
        
            oUi.item.addClass('bx-grid-gragging-row bx-def-color-bg-active'); // apply classes for dragged row            
        },

        stop: function(oEvent, oUi) {
            oUi.item.removeClass('bx-grid-gragging-row'); // remove classes from dragged row
            
            jQuery('#' + $this._sIdTable + ' tbody tr:odd').addClass('bx-def-color-bg-hl'); // highlight odd rows            

            $this.blink(oUi.item.attr('id')); // make dropped row to blink, so we clearly see where dropped row is places

            // searialize current rows order and send result to the server for saving
            var s = jQuery('#' + $this._sIdTable + ' tbody').sortable('serialize'); 
            $this.action('reorder', {}, s, true);
        }
    });
};

BxDolGrid.prototype.blink = function (sId) {
    var e = jQuery('#' + sId);
    e.removeClass('bx-grid-table-row-trans');
    e.addClass('bx-def-color-bg-active');    
    setTimeout('glGrids.' + this._sObject + '._blinkCallback("' + sId + '")', 200);
};

BxDolGrid.prototype.enable = function (sId, isEnable) {
    var e = jQuery('#' + sId);
    var eSwitch = e.find('.bx-switcher-cont:has([bx_grid_action_single = "enable"])');
    var eActions = e.find('.bx-grid-cell-single-actions-wrapper *[bx_grid_action_single]').not('*[bx_grid_permanent_state]');

    if (isEnable) {        
        e.removeClass('bx-grid-table-row-disabled bx-def-font-grayed');
        eSwitch.removeClass('off').addClass('on');
        eActions.removeClass('bx-btn-disabled');
        if (eActions.length)
            this._bindActionsSingle(e);
    } else {
        eActions.addClass('bx-btn-disabled');
        eSwitch.removeClass('on').addClass('off');
        e.addClass('bx-grid-table-row-disabled bx-def-font-grayed');        
        if (eActions.length)
            this._unbindActionsSingle(e);
    }
};

BxDolGrid.prototype._blinkCallback = function (sId) {
    var e = jQuery('#' + sId);
    e.addClass('bx-grid-table-row-trans');
    e.removeClass('bx-def-color-bg-active');
};

BxDolGrid.prototype.actionWithId = function (sId, sAction, oData, sData, isDisableLoading, isConfirm) {
    var sDataAdd = 'ids[]=' + sId;
    if (typeof(sData) == "undefined" || !sData.length) {
        sData = sDataAdd;
    } else {
        if ('&' != sData[sData.length-1])
            sData += '&';
        sData += sDataAdd;
    } 

    this.action(sAction, oData, sData, isDisableLoading, isConfirm);
};

BxDolGrid.prototype.actionWithSelected = function (sActionData, sAction, oData, sData, isDisableLoading, isConfirm) {    

    var sDataAdd = '';
    jQuery("#" + this._sIdTable + " input[name=" + this._sObject + "_check]:checked").each(function () {
        if (sDataAdd.length)   
            sDataAdd += "&";
        sDataAdd += 'ids[]=' + $(this).val();
    });

    if (!sDataAdd.length)
        return;

    if (typeof(sData) == "undefined" || !sData.length) {
        sData = sDataAdd;
    } else {
        if ('&' != sData[sData.length-1])
            sData += '&';
        sData += sDataAdd;
    } 

    this.action(sAction, oData, sData, isDisableLoading, isConfirm);
};

BxDolGrid.prototype.action = function (sAction, oData, sData, isDisableLoading, isConfirm) {
    var $this = this;
    var fPerform = function() {
    	var i;
    	var sUrl = sUrlRoot + "grid.php?o=" + $this._sObject + "&a=" + sAction;

    	if (typeof($this._oQueryAppend) == 'object')
            oData = $.extend({}, $this._oQueryAppend, oData);

        for (i in oData)
            sUrl += "&" + i + "=" + encodeURIComponent(oData[i]);
        if (typeof(sData) != 'undefined')
            sUrl += '&' + sData;
        if ($this._sFilter.length)
            sUrl += '&' + $this._oOptions.filter_get + '=' + encodeURIComponent ($this._sFilter);
        if ($this._sOrderField.length)
            sUrl += '&' + $this._oOptions.order_get_field + '=' + encodeURIComponent ($this._sOrderField);
        if ($this._sOrderDir.length)
            sUrl += '&' + $this._oOptions.order_get_dir + '=' + encodeURIComponent ($this._sOrderDir);
        if ($this._sCsrfToken.length)
            sUrl += '&csrf_token=' + encodeURIComponent ($this._sCsrfToken);
        sUrl += '&_r=' + Math.random();

        if (typeof(isDisableLoading) == 'undefined' || !isDisableLoading)
            $this.loading(true);

        if(sUrl.length < 2048)
            $.getJSON(sUrl, function(oResult) {
                $this.processJson(oResult, sAction, isDisableLoading);
            });
        else {
            var oUri = new URI(sUrl);

            oData = oUri.query(true);
            sUrl = oUri.query("").toString();

            $.post(sUrl, oData, function(oResult) {
                $this.processJson(oResult, sAction, isDisableLoading);
            }, 'json');
        }
    };

    if(typeof(isConfirm) != 'undefined' && parseInt(isConfirm) == 1)
    	bx_confirm(typeof(this._oConfirmMessages[sAction]) == 'undefined' ? _t('_sys_grid_confirmation') : this._oConfirmMessages[sAction], function() {
    		fPerform();
    	});
    else
    	fPerform();
};

BxDolGrid.prototype.processJson = function (oData, sAction, isDisableLoading) {
    var $this = this;
    var fContinue = function() {
    	if (oData && undefined != oData.grid) {        
            $('#' + $this._sIdContainer).html($(oData.grid).find('#' + $this._sIdContainer).html());
            var sFooter = $(oData.grid).find('.bx-grid-footer').size() ? $(oData.grid).find('.bx-grid-footer').html() : '';
            $('#' + $this._sIdWrapper).find('.bx-grid-footer').html(sFooter);
            $('#' + $this._sIdWrapper).find('.bx-grid-header-controls-counter-value').html(oData.total_count_f);
            $this._onDataReloaded(true);
        }
    	if (oData && undefined != oData.blink) {
            if ('object' == typeof(oData.blink)) {
                for(var i in oData.blink)
                    $this.blink($this._sObject + '_row_' + oData.blink[i]);
            } else {
                $this.blink($this._sObject + '_row_' + oData.blink);
            }
        }
        if (oData && undefined != oData.disable) {        
            if ('object' == typeof(oData.disable)) {
                for(var i in oData.disable)
                    $this.enable($this._sObject + '_row_' + oData.disable[i], false);
            } else {
                $this.enable($this._sObject + '_row_' + oData.disable, false);
            }
        }
        if (oData && undefined != oData.enable) {
            if ('object' == typeof(oData.enable)) {
                for(var i in oData.enable)
                    $this.enable($this._sObject + '_row_' + oData.enable[i], true);
            } else {
                $this.enable($this._sObject + '_row_' + oData.enable, true);
            }
        }
        if (oData && undefined != oData.popup) {
            var sId = 'grid-popup-' + $this._sObject + '-' + sAction;
            $('#' + sId).remove();
            if ('object' == typeof(oData.popup)) {
                var o = $.extend({}, $this._oPopupOptions, oData.popup.options);
                $('<div id="' + sId + '" style="display: none;"></div>').prependTo('body').html(oData.popup.html);
                $('#' + sId).dolPopup(o);
            } else {
                $('<div id="' + sId + '" style="display: none;"></div>').prependTo('body').html(oData.popup);
                $('#' + sId).dolPopup($this._oPopupOptions);
            }        
        }
        if (oData && oData.reload != undefined && parseInt(oData.reload) == 1) {
            document.location = document.location;
        }
        if (oData && oData.redirect != undefined && oData.redirect.length != 0) {
            document.location = oData.redirect;
        }
        if (oData && oData.open_url != undefined && oData.open_url.length != 0) {
            window.open(oData.open_url, '_blank');
        }
        if (oData && undefined != oData.eval) {
            eval(oData.eval);
        }
        if (oData && undefined != oData.secret) {
            $this.setSecretValue(oData.secret.id, oData.secret.field, oData.secret.value);
        }
    };

    if (typeof(isDisableLoading) == 'undefined' || !isDisableLoading)
        this.loading(false);

    if (oData && undefined != oData.msg) {
        bx_alert(oData.msg, function() {
        	fContinue();
        });
    }
    else
    	fContinue();
};

BxDolGrid.prototype.loading = function (bShow) {
    bx_loading(this._sIdContainer, bShow);
};

BxDolGrid.prototype.reload = function (iStart, iPerPage) {
    var oData = this._getActionDataForReload(iStart, iPerPage);
    this.action('display', oData);
};

BxDolGrid.prototype._getActionDataForReload = function (iStart, iPerPage) {
    var oData = {};

    if (typeof(iStart) != 'undefined') {
        oData[this._oOptions.paginate_get_start] = iStart;
        this._oOptions.start = iStart;
    } 
    else {
        oData[this._oOptions.paginate_get_start] = this._oOptions.start;
    }

    if (this._oOptions.paginate_get_per_page.length) {
        if (typeof(iPerPage) != 'undefined') {
            oData[this._oOptions.paginate_get_per_page] = iPerPage;
            this._oOptions.per_page = iPerPage;
        }
        else {
            oData[this._oOptions.paginate_get_per_page] = this._oOptions.per_page;
        }
    }

    return oData;
};

BxDolGrid.prototype._unbindActionsSingle = function (eElement) {
    var elements;
    
    if ('undefined' == typeof(eElement))
        elements = jQuery('#' + this._sIdWrapper + ' *[bx_grid_action_single]');
    else
        elements = eElement.find('*[bx_grid_action_single]');

    elements.unbind('click');
};

BxDolGrid.prototype._bindActionsSingle = function (eElement) {
    var $this = this;
    var elements;

    if ('undefined' == typeof(eElement))
        elements = jQuery('#' + this._sIdWrapper + ' *[bx_grid_action_single]');
    else
        elements = eElement.find('*[bx_grid_action_single]');

    elements.not('.bx-btn-disabled').bind('click', function () {
        if ($(this).hasClass('bx-btn-disabled'))
            return;
        var sAction = $(this).attr('bx_grid_action_single');
        var sActionConfirm = $(this).attr('bx_grid_action_confirm');
        var sActionData = $(this).attr('bx_grid_action_data');
        var iActionResetPaginate = parseInt($(this).attr('bx_grid_action_reset_paginate'));
        var oData = iActionResetPaginate ? {} : $this._getActionDataForReload();
        oData = $this._checkAppend(this, oData);
        $this.actionWithId (sActionData, sAction, oData, '', false, sActionConfirm);
    });
};

BxDolGrid.prototype._bindActions = function (isSkipSearchInput) {
    var $this = this;

    jQuery('#' + this._sIdContainer).bind('scroll', function () {
        if (-$(this).find('.bx-grid-table').position().left >= ($(this).find('.bx-grid-table').width() - $(this).width()))
            $(this).parents('.bx-grid-table-wrapper2').addClass('bx-grid-table-hide-shadow-after');
        else
            $(this).parents('.bx-grid-table-wrapper2').removeClass('bx-grid-table-hide-shadow-after');
        
        if ($(this).find('.bx-grid-table').position().left >= 0)
            $(this).parents('.bx-grid-table-wrapper2').addClass('bx-grid-table-hide-shadow-before');
        else
            $(this).parents('.bx-grid-table-wrapper2').removeClass('bx-grid-table-hide-shadow-before');
    });

    jQuery('#' + this._sIdWrapper + ' *[bx_grid_action_bulk]').bind('click', function () {
        if ($(this).hasClass('bx-btn-disabled'))
            return;
        var sAction = $(this).attr('bx_grid_action_bulk');
        var sActionConfirm = $(this).attr('bx_grid_action_confirm');
        var sActionData = $(this).attr('bx_grid_action_data');
        var iActionResetPaginate = parseInt($(this).attr('bx_grid_action_reset_paginate'));
        var oData = iActionResetPaginate ? {} : $this._getActionDataForReload();
        oData = $this._checkAppend(this, oData);
        $this.actionWithSelected (sActionData, sAction, oData, '', false, sActionConfirm);
    });

    this._bindActionsSingle ();

    jQuery('#' + this._sIdWrapper + ' .bx-grid-secret-toggle').bind('click', function () {
        var eWrap = $(this).closest('.bx-grid-secret');
        if (eWrap.hasClass('bx-grid-secret-shown')) {
            $this.hideSecret(eWrap);
            return;
        }
        $this.revealSecret($(this).attr('bx_grid_secret_id'), $(this).attr('bx_grid_secret_field'));
    });
    
    if (jQuery('#' + this._sIdWrapper + ' .bx-switcher-cont input').length) 
        jQuery('#' + this._sIdWrapper).addWebForms(); 
    jQuery('#' + this._sIdWrapper + ' .bx-switcher-cont input').bind('change', function () {
        var sAction = $(this).attr('bx_grid_action_single');
        var sActionConfirm = $(this).attr('bx_grid_action_confirm');
        var sActionData = $(this).attr('bx_grid_action_data');
        var iActionResetPaginate = parseInt($(this).attr('bx_grid_action_reset_paginate'));
        var oData = iActionResetPaginate ? {} : $this._getActionDataForReload();
        $this.actionWithId (sActionData, sAction, $.extend({}, oData, {checked:this.checked ? 1 : 0}), '', false, sActionConfirm);
    });

    if (typeof(isSkipSearchInput) == 'undefined' || false == isSkipSearchInput) {

        jQuery('#' + this._sIdWrapper + ' *[bx_grid_action_independent]').bind('click', function () {
            if ($(this).hasClass('bx-btn-disabled'))
                return;
            var sAction = $(this).attr('bx_grid_action_independent');
            var sActionConfirm = $(this).attr('bx_grid_action_confirm');
            var iActionResetPaginate = parseInt($(this).attr('bx_grid_action_reset_paginate'));
            var oData = iActionResetPaginate ? {} : $this._getActionDataForReload();
            oData = $this._checkAppend(this, oData);
            $this.action (sAction, oData, '', false, sActionConfirm);
        });    

        var callbackSearch = function (sTerm) {
            clearTimeout($this._iSearchTimeoutId);
            $this._iSearchTimeoutId = setTimeout(function () {
            	if(glGrids[$this._sObject])
            		glGrids[$this._sObject].setFilter(sTerm, true);
            }, 500);
        };
        
        jQuery('#bx-grid-search-' + this._sObject).bind({
            keyup: function (e) {
                callbackSearch(this.value);
            },
            focusout: function (e) {
                if (0 == this.value.length)
                    this.value = $this._sSearchInputText;
                callbackSearch(this.value == $this._sSearchInputText ? '' : this.value);
            },
            focusin: function (e) {
                if (this.value == $this._sSearchInputText)
                    this.value = '';
            }
        });
    }
};

BxDolGrid.prototype._onDataReloaded = function (isSkipSearchInput) {

    jQuery('#' + this._sIdTable + ' tbody tr:odd').addClass('bx-def-color-bg-hl');
    
    jQuery('#' + this._sIdTable).bxProcessHtml();

    if (this._oOptions.sorting)
        this.orderable();

    if (this._oOptions.sortable && 0 == this._sFilter.length && 0 == this._sOrderField.length)
        this.sortable();

    this._bindActions(isSkipSearchInput);

    this.onDataReloaded(isSkipSearchInput);
};

BxDolGrid.prototype.onDataReloaded = function (isSkipSearchInput) {};

BxDolGrid.prototype._checkAppend = function (oInput, oData) {
	var oAppend = $(oInput).attr('bx_grid_action_append') ? $.parseJSON($(oInput).attr('bx_grid_action_append')) : false;
    if(typeof(oAppend) == 'object')
        oData = $.extend({}, oData, oAppend);

    return oData;
};

BxDolGrid.prototype.revealSecret = function (sId, sField) {
    var $this = this;
    var oInput = $('#bx-popup-prompt-value');

    $(document).dolPopupPrompt({
        message: _t('_sys_grid_secret_password_prompt'),
        value: '',
        onClickOk: function (oPopup) {
            var oData = {
                o: $this._sObject,
                a: 'reveal_secret',
                'ids[]': sId,
                field: sField,
                password: oPopup.getValue(),
                csrf_token: $this._sCsrfToken,
                _r: Math.random()
            };
            if (typeof($this._oQueryAppend) == 'object')
                oData = $.extend({}, $this._oQueryAppend, oData);

            $this.loading(true);
            $.post(sUrlRoot + 'grid.php', oData, function (oResult) {
                $this.processJson(oResult, 'reveal_secret', false);
            }, 'json');
        },
        onShow: function () {
            oInput.attr('type', 'password').attr('autocomplete', 'current-password').val('').focus();
        },
        onHide: function () {
            oInput.attr('type', 'text').removeAttr('autocomplete').val('');
        }
    });
};

BxDolGrid.prototype.hideSecret = function (eWrap) {
    var sMasked = eWrap.find('.bx-grid-secret-value').attr('data-masked') || '';
    eWrap.removeClass('bx-grid-secret-shown');
    eWrap.find('.bx-grid-secret-value').text(sMasked);
    eWrap.find('.bx-grid-secret-toggle').attr('title', _t('_sys_grid_secret_reveal'));
    eWrap.find('.bx-grid-secret-toggle .sys-icon').removeClass('eye-slash').addClass('eye');
};

BxDolGrid.prototype.setSecretValue = function (sId, sField, sValue) {
    var eToggle = jQuery('#' + this._sIdWrapper + ' .bx-grid-secret-toggle').filter(function () {
        return $(this).attr('bx_grid_secret_id') == sId && $(this).attr('bx_grid_secret_field') == sField;
    });
    var eWrap = eToggle.closest('.bx-grid-secret');
    eWrap.addClass('bx-grid-secret-shown');
    eWrap.find('.bx-grid-secret-value').text(sValue);
    eToggle.attr('title', _t('_sys_grid_secret_hide'));
    eToggle.find('.sys-icon').removeClass('eye').addClass('eye-slash');
};

/** @} */
