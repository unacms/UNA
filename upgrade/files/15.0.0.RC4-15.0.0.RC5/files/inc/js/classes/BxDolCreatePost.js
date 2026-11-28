/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

function BxDolCreatePost(oOptions) {
    this._sObjName = oOptions.sObjName == undefined ? 'oBxDolCreatePost' : oOptions.sObjName;
    this._sRootUrl = oOptions.sRootUrl == undefined ? sUrlRoot : oOptions.sRootUrl;
    this._sDefault = oOptions.sDefault == undefined ? '' : oOptions.sDefault;
    this._sDefaultUri = oOptions.sDefaultUri == undefined ? '' : oOptions.sDefaultUri;
    this._iContextId = oOptions.iContextId == undefined ? 0 : oOptions.iContextId;
    this._oPreloadingList = oOptions.oPreloadingList == undefined ? [] : oOptions.oPreloadingList;
    this._oCustom = oOptions.oCustom == undefined ? {} : oOptions.oCustom;

    this._sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this._iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;

    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;

    // set here, not in init: init waits for document ready, and a click can come first
    this._oRequests = {};
    this._oInserts = {};

    var $this = this;
    $(document).ready(function() {
        $this.init();
    });
}

BxDolCreatePost.prototype.init = function () {
    var $this = this;

    // The form, its editor and uploaders are loaded on demand: when the member is about
    // to use the composer (pointer over it, focus, touch), and at the latest on click.
    $('.sys-cpf-form.sys-cpf-default').on('pointerenter focusin touchstart', function() {
        $this._loadForm($this._sDefault);
    }).on('keydown', function(oEvent) {
        if(oEvent.key != 'Enter' && oEvent.key != ' ')
            return;

        oEvent.preventDefault();
        $(this).trigger('click');
    });

    for(var sKey in this._oPreloadingList) {
        var sForm = '.sys-cpf-form.sys-cpf-' + sKey;
        if($(sForm).find('form').length != 0)
            continue;

        this._loadForm(sKey, this._oPreloadingList[sKey]).done(function(oData) {
            if(oData?.content)
                $this._insertForm(oData);
        });
    }
};

/**
 * Request the form of a module once; later calls get the same request.
 */
BxDolCreatePost.prototype._loadForm = function (sModuleName, sModuleUri) {
    if(this._oRequests[sModuleName])
        return this._oRequests[sModuleName];

    if(!sModuleUri)
        sModuleUri = sModuleName == this._sDefault ? this._sDefaultUri : '';
    if(!sModuleUri)
        return $.Deferred().reject().promise();

    var $this = this;
    var oRequest = $.get(
        this._sRootUrl + 'modules/?r=' + sModuleUri + '/get_create_post_form/', {
            ajax_mode: true,
            dynamic_mode: true,
            absolute_action_url: true,
            context_id: this._iContextId,
            custom: this._oCustom,
            _t: Date.now()
        },
        null,
        'json'
    ).fail(function() {
        // let the next attempt ask again
        delete $this._oRequests[sModuleName];
    });

    this._oRequests[sModuleName] = oRequest;
    return oRequest;
};

/**
 * Put a loaded form into its hidden wrapper once (the wrapper of the default module is in
 * the template already); later calls get the same promise, resolved with the wrapper.
 */
BxDolCreatePost.prototype._insertForm = function (oData) {
    if(this._oInserts[oData.module])
        return this._oInserts[oData.module];

    var oForm = $('.sys-cpf-form.sys-cpf-' + oData.module);
    if(oForm.length == 0) {
        oForm = $('<div class="sys-cpf-form sys-cpf-' + oData.module + '"></div>').hide();
        $('.sys-cpf-close').before(oForm);
    }

    var oDeferred = $.Deferred();
    if(oForm.find('form').length)
        oDeferred.resolve(oForm);
    else
        bx_html_async(oForm, oData.content, function() {
            oDeferred.resolve(oForm);
        });

    this._oInserts[oData.module] = oDeferred.promise();
    return this._oInserts[oData.module];
};

BxDolCreatePost.prototype.getForm = function (sModuleName, sModuleUri, oElement) {
    var $this = this;

    var oTab = $(oElement);
    var sTabActive = 'bx-menu-tab-active';
    oTab.parents('.bx-db-menu:first').find('li.' + sTabActive).removeClass(sTabActive);
    oTab.parents('li:first').addClass(sTabActive);
    oTab.parents('.bx-popup-applied:visible').dolPopupHide();

    $('.sys-cpf-form:visible').hide({
        duration: 0,
        complete: function() {
            $('.sys-cpf-close:visible').hide();

            if(!$('.sys-cpf-form.sys-cpf-' + sModuleName + ' form').length) {
                $this._placeholderInBlock(oElement, true);

                $this._loadForm(sModuleName, sModuleUri).done(function(oData) {
                    if(!oData?.content) {
                        $this._placeholderInBlock(oElement, false);
                        return;
                    }

                    $this._insertForm(oData).done(function(oForm) {
                        $this._placeholderInBlock(oElement, false);
                        oForm.show().bxProcessHtml().siblings('.sys-cpf-close:hidden').show();
                        oForm.find('form :input:visible:first').trigger('focus');
                    });
                }).fail(function() {
                    $this._placeholderInBlock(oElement, false);
                    $('.sys-cpf-form.sys-cpf-default').show();
                });
            }
            else 
                $('.sys-cpf-form.sys-cpf-' + sModuleName).show().bxProcessHtml().siblings('.sys-cpf-close:hidden').show();
        }
    });

    return false;
};

BxDolCreatePost.prototype.hideForm = function(oElement) {
    $(oElement).parents('.sys-cpf-close:first').hide();

    var sTabActive = 'bx-menu-tab-active';
    var sTabDefault = 'bx-menu-item-' + this._sDefault;

    var oMiActive = $(oElement).parents('.bx-db-container:first').find('ul > li.' + sTabActive);
    var bMiChange = !oMiActive.hasClass(sTabDefault);

    if(bMiChange)
        oMiActive.removeClass(sTabActive);

    $('.sys-cpf-form:visible').hide({
        duration: 0,
        complete: function() {
            $('.sys-cpf-form.sys-cpf-default').show();

            if(bMiChange)
                $('.' + sTabDefault).addClass(sTabActive);
        }
    });
};

BxDolCreatePost.prototype._loading = function(e, bShow) {
    var oParent = $(e).length ? $(e) : $('body'); 
    bx_loading(oParent, bShow);
};

BxDolCreatePost.prototype._loadingInBlock = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-db-container:first') : $('body'); 
    bx_loading(oParent, bShow);
};

BxDolCreatePost.prototype._placeholderInBlock = function(e, bShow) {
    var oPlaceholder = null;
    if($(e).length) 
        oPlaceholder = $(e).parents('.bx-db-container:first').find('.sys-cpf-form.sys-cpf-loading'); 

    if(!oPlaceholder)
        return _loadingInBlock(e, bShow);

    if(bShow)
        oPlaceholder.show();
    else
        oPlaceholder.hide();
};

/** @} */
