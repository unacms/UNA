/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioBuilderPage(oOptions) {
    this.sActionUrl = oOptions.sActionUrl;
    this.sPageUrl = oOptions.sPageUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioBuilderPage' : oOptions.sObjName;
    this.sType = oOptions.sType == undefined ? '' : oOptions.sType;
    this.sPage = oOptions.sPage == undefined ? '' : oOptions.sPage;
    this.sAnimationEffect = oOptions.sAnimationEffect == undefined ? 'fade' : oOptions.sAnimationEffect;
    this.iAnimationSpeed = oOptions.iAnimationSpeed == undefined ? 'slow' : oOptions.iAnimationSpeed;
    this.oHtmlIds = oOptions.oHtmlIds == undefined ? {} : oOptions.oHtmlIds;
    this.oLanguages = oOptions.oLanguages == undefined ? {} : oOptions.oLanguages;

    this.aSortingConf = {
    	parent: '.adm-bp-cell-cnt',
    	parent_prefix: 'adm-bpc-',
        item: '.adm-bp-block',
        placeholder: 'adm-bp-block adm-bp-block-empty'
    };

    $('div.bx-std-pt-bp-types select').select2({
        templateSelection: d => d.text
    });

    $('div.bx-std-pt-bp-pages select').select2({
        templateResult: this.formatItemPage,
        templateSelection: d => d.text
    });

    var $this = this;
    $(document).ready(function() {
    	$($this.aSortingConf.parent).sortable({
            handle: $($this.aSortingConf.item + ' .adm-bpb-drag-handle'),
            items: $this.aSortingConf.item, 
            placeholder: $this.aSortingConf.placeholder,
            connectWith: $this.aSortingConf.parent,
            start: function(oEvent, oUi) {
                oUi.item.addClass('adm-bp-block-dragging').width(300);
            },
            stop: function(oEvent, oUi) {
                oUi.item.removeClass('adm-bp-block-dragging');
                $this.reorder(oUi.item);
            }
    	});
    });
}

BxDolStudioBuilderPage.prototype.formatItemPage = function(oItem) {
    if(!oItem.id) 
        return oItem.text;

    const sUrl = $(oItem.element).data('url');
    const iBlocks = $(oItem.element).data('blocks');
    const sBlocks = parseInt(iBlocks) >= 0 ? iBlocks : _t('_sys_not_available');

    return $(`
    <div class="adm-bp-page">
        <div>
            <div class="adm-bpp-ttl">${oItem.text}</div>
            <div class="adm-bpp-inf bx-def-font-meta">${sUrl || ''}</div>
        </div>
        <div class="adm-bpp-cnt">${sBlocks}</div>
    </div>
    `);
};

/**
 * Main page methods.
 */
BxDolStudioBuilderPage.prototype.onChangeType = function(oSelect) {
    document.location.href = this.parsePageUrl({type: $(oSelect).val()});
};

BxDolStudioBuilderPage.prototype.onChangePage = function(oSelect) {
    document.location.href = this.parsePageUrl({page: $(oSelect).val()});
};

BxDolStudioBuilderPage.prototype.getUri = function(oElement) {
    var mixedParams = {};

    var sUri = $('#' + this.oHtmlIds['uri_field_id']).val();
    if(sUri.length > 0)
        mixedParams['uri'] = sUri;
    else {
        var bGot = false;

        $.each(this.oLanguages, function(sKey, sValue) {
            mixedParams[sKey] = $('#bx-form-input-title-' + sKey).val();
            if(mixedParams[sKey].length > 0)
                bGot = true;
        });

        if(!bGot)
            return;
    }

    bx_loading(this.oHtmlIds['add_popup_id'], true);

    this.performAction('uri_get', mixedParams);
};

BxDolStudioBuilderPage.prototype.onGetUri = function(oData) {
    bx_loading(this.oHtmlIds['add_popup_id'], false);

    $('#' + this.oHtmlIds['uri_field_id']).val(oData.uri);
    $('#' + this.oHtmlIds['url_field_id']).val(oData.url);
};

BxDolStudioBuilderPage.prototype.onCreatePage = function(sType, sPage) {
    window.location.href = this.parsePageUrl({type: sType, page: sPage});
};

BxDolStudioBuilderPage.prototype.deletePage = function() {
    var $this = this;

    bx_confirm(aDolLang['_adm_bp_wrn_page_delete'], function() {
        $this.performAction('page_delete');
    });
};

BxDolStudioBuilderPage.prototype.reorder = function(oDraggable) {
    var $this = this;
    var oDate = new Date();

    var aParams = new Array();
    $(this.aSortingConf.parent).each(function(iIndex, oElement){
        var sId = $(oElement).attr('id');
        aParams.push($('#' + sId).sortable('serialize', {key: 'bp_items_' + sId.replace($this.aSortingConf.parent_prefix, '') + '[]'}));
    });

    $.post(
        this.sActionUrl + (this.sActionUrl.indexOf('?') == -1 ? '?' : '&') + aParams.join('&'),
        {
            bp_action: 'reorder',
            bp_page: $this.sPage,
            _t:oDate.getTime()
        },
        function(oData) {
            if(oData.code != 0) {
                bx_alert(oData.message);
                return;
            }
        },
        'json'
    );

    return true;
};

/**
 * "Add Block" popup methods. 
 */
BxDolStudioBuilderPage.prototype.onChangeModule = function(sName, oLink) {
    var $this = this;
    var oDate = new Date();

    var sClass = 'bx-menu-tab-active';
    $(oLink).parents('.bx-std-pmen-item:first').addClass(sClass).siblings('.bx-std-pmen-item').removeClass(sClass);

    var sId = '#' + $this.oHtmlIds['block_list_id'] + sName;
    if($(sId).length != 0) {
        $('#' + this.oHtmlIds['block_lists_id'] + ' > div:visible').bx_anim('hide', this.sAnimationEffect, 0, function() {
            $(sId).show();
        });

        return;
    }

    bx_loading(this.oHtmlIds['create_block_popup_id'], true);

    $.post(
        this.sActionUrl,
        {
            bp_action: 'block_list',
            bp_module: sName,
            _t:oDate.getTime()
        },
        function(oData) {
            bx_loading($this.oHtmlIds['create_block_popup_id'], false);

            $('#' + $this.oHtmlIds['block_lists_id'] + ' > div:visible').bx_anim('hide', $this.sAnimationEffect, 0, function() {
                $(this).parent().append(oData.content).bxProcessHtml();
            });
        },
        'json'
    );
};

BxDolStudioBuilderPage.prototype.onSelectBlock = function(oCheckbox) {
    var iCounter = parseInt($('#adm-bp-cbf-counter').html());
    iCounter += $(oCheckbox).prop('checked') ? 1 : -1;

    $('#adm-bp-cbf-counter').html(iCounter);
};

BxDolStudioBuilderPage.prototype.onCreateBlock = function(oData) {
    window.location.href = this.parsePageUrl({page: this.sPage});
};

BxDolStudioBuilderPage.prototype.onChangeVisibleFor = function(oSelect) {
    $(oSelect).parents('form:first').find('#bx-form-element-visible_for_levels').bx_anim($(oSelect).val() == 'all' ? 'hide' : 'show', this.sAnimationEffect, this.iAnimationSpeed);
};

BxDolStudioBuilderPage.prototype.onEditBlockBeforeShow = function(oPopup) {
    var oTextarea = $(oPopup).find("textarea.bx-form-input-textarea-codemirror[name = 'content']");
    if(oTextarea.length > 0)
        CodeMirror.fromTextArea(oTextarea.get(0), {
            lineNumbers: true,
            mode: "htmlmixed",
            htmlMode: true,
            matchBrackets: true
        }).on('blur', function(oEditor) {
            oEditor.save();
        });
};

BxDolStudioBuilderPage.prototype.onEditBlock = function(oData) {
    window.location.href = this.parsePageUrl({page: this.sPage});
};

BxDolStudioBuilderPage.prototype.onEditBlockCancel = function(oButton) {
    if ('undefined' !== typeof(bx_editor_remove_all))
        bx_editor_remove_all($(oButton).parents('form:first'));

    $('.bx-popup-applied:visible').dolPopupHide();
};

BxDolStudioBuilderPage.prototype.deleteBlock = function(iId) {
    var $this = this;

    bx_confirm(aDolLang['_adm_bp_wrn_page_block_delete'], function() {
        bx_loading($this.oHtmlIds['edit_block_popup_id'], true);
        $this.performAction('block_delete', {id:iId});
    });
};

BxDolStudioBuilderPage.prototype.onDeleteBlock = function(iId, oData) {
    bx_loading(this.oHtmlIds['edit_block_popup_id'], false);
    $('.bx-popup-applied:visible').dolPopupHide();

    $('#' + this.oHtmlIds['block_id'] + iId).bx_anim('hide', this.sAnimationEffect, this.iAnimationSpeed, function() {
            $(this).remove();
    });
};

/**
 * "Settings" popup methods.
 */
BxDolStudioBuilderPage.prototype.onChangeSettingGroup = function(sName, oLink) {
    var $this = this;

    var sClass = 'bx-menu-tab-active';
    $(oLink).parents('.bx-std-pmen-item:first').addClass(sClass).siblings('.bx-std-pmen-item').removeClass(sClass);

    $('#' + this.oHtmlIds['settings_groups_id'] + ' > div:visible').bx_anim('hide', this.sAnimationEffect, 0, function() {
        $('#' + $this.oHtmlIds['settings_group_id'] + sName).show(function() {
            $(this).find('.CodeMirror').each(function() {
                this.CodeMirror.refresh();
            });
        });
    });
};

BxDolStudioBuilderPage.prototype.onChangeLayout = function(iId, oLink) {
    $('#' + this.oHtmlIds['settings_group_id'] + 'layout > .adm-bp-layout-active').removeClass('adm-bp-layout-active');
    $('#' + this.oHtmlIds['layout_id'] + iId).addClass('adm-bp-layout-active');
    $("[name = 'layout_id']").val(iId);
};

BxDolStudioBuilderPage.prototype.onSaveSettingsLayout = function() {
    window.location.href = this.parsePageUrl({page: this.sPage});
};

BxDolStudioBuilderPage.prototype.onCloseSettings = function() {
    $('.bx-popup-applied:visible').dolPopupHide({
        onHide: function(oPopup) {
            $(oPopup).remove();
        }
    });
};

/**
 * General methods.
 */
BxDolStudioBuilderPage.prototype.performAction = function(sAction, aParams) {
    var $this = this;
    var oDate = new Date();

    if(aParams == undefined)
        aParams = {};

    aParams.bp_action = sAction;
    aParams.bp_type = $this.sType;
    aParams.bp_page = $this.sPage;
    aParams._t = oDate.getTime();

    if($('.bx-loading-ajax:visible').length == 0)
        bx_loading('bx-std-page-columns', true);

    $.post(
        this.sActionUrl,
        aParams,
        function(oData) {
            oBxDolStudioPage.processJson(oData);
        },
        'json'
    );
};

BxDolStudioBuilderPage.prototype.parsePageUrl = function(aParams) {
    var sType = aParams.type != undefined ? aParams.type : this.sType;
    var sPage = aParams.page != undefined ? aParams.page : '';

    return this.sPageUrl.replace('{0}', sType).replace('{1}', sPage);
};

BxDolStudioBuilderPage.prototype.changeDimension = function(oText) {
    var oText = $(oText);
    var sKey = oText.attr('name');
    var iValue = parseInt(oText.val());
    if(!iValue || iValue <= 0)
        return;

    var oUrl = oText.parents('.bx-uploader-ghost:first').find('.bx-ug-url');
    var aUrl = oUrl.val().split('?');
    var aPairs = aUrl[1].split('&');

    var aParams = {};
    var bUpdated = false;
    for(var i in aPairs) {
        var aPair = aPairs[i].split('=');

        aParams[aPair[0]] = aPair[1];
        if(aPair[0] == sKey) {
            aParams[aPair[0]] = iValue;
            bUpdated = true;
        }
    }

    if(!bUpdated)
        aParams[sKey] = iValue;

    oUrl.val(bx_append_url_params(aUrl[0], aParams));
};

BxDolStudioBuilderPage.prototype.deleteGhost = function(iFileId, sFileUrl, sFileIcon, aEditors, oUploaderInstance) {
    bx_editor_remove_img(aEditors, ['img[src="' + sFileIcon + '"]', 'img[src="' + sFileUrl + '"]', '#bx-base-text-img-' + iFileId, '#bx-base-text-icon-' + iFileId]);

    oUploaderInstance.deleteGhost(iFileId);
};

BxDolStudioBuilderPage.prototype.insertIntoPost = function(oButton, iFileId, sEditorId) {
    var sFileUrl = $(oButton).parents('.bx-uploader-ghost:first').find('.bx-ug-url').val();

    bx_editor_insert_img (sEditorId, 'bx-base-text-img-' + iFileId, sFileUrl, 'bx-base-text-img');
};

/** @} */
