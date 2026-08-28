/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */
function BxDolStudioPageAgents(oOptions)
{
    BxDolStudioPage.call(this, oOptions);

    this.sPageUrl = oOptions.sPageUrl;
    this.sActionUrl = oOptions.sActionUrl;
    this.sObjName = oOptions.sObjName == undefined ? 'oBxDolStudioPageAgents' : oOptions.sObjName;

    this.sActionUrlCmts = oOptions.sActionUrlCmts == undefined ? this.sActionUrl : oOptions.sActionUrlCmts;
    this.sActionUrlGrid = oOptions.sActionUrlGrid == undefined ? this.sActionUrl : oOptions.sActionUrlGrid;
    this.sObjNameGrid = oOptions.sObjNameGrid == undefined ? '' : oOptions.sObjNameGrid;

    var $this = this;
    $(document).ready(function () {
        $this.initGrid();
    });
}

BxDolStudioPageAgents.prototype = Object.create(BxDolStudioPage.prototype);
BxDolStudioPageAgents.prototype.constructor = BxDolStudioPageAgents;

BxDolStudioPageAgents.prototype.initGrid = function() {
    if (typeof(glGrids) == 'undefined' || !this.sObjNameGrid || !glGrids[this.sObjNameGrid])
        return;

    glGrids[this.sObjNameGrid].setOnReload(function() {
        document.location = document.location;
    });
};

BxDolStudioPageAgents.prototype.initAgentChat = function(sSelector, iAgentId) {
    var $this = this;
    var fInit = function() {
        $this.destroyAgentChat();
        if (typeof una === 'undefined' || !una.Chat)
            return;
        $this._oAgentChat = una.Chat.init(sSelector, { agentId: iAgentId, formatting: true });
    };

    if (typeof una !== 'undefined' && una.Chat)
        fInit();
};

BxDolStudioPageAgents.prototype.destroyAgentChat = function() {
    if (!this._oAgentChat)
        return;

    try {
        this._oAgentChat.destroy();
    } catch (e) {}
    this._oAgentChat = null;
};

BxDolStudioPageAgents.prototype.agentActions = function(oSource) {
    var iId = $(oSource).parents('.bx-agt-agent:first').attr('data-id');
    bx_menu_popup_inline('#bx-agt-agent-actions-' + iId, oSource);
};

BxDolStudioPageAgents.prototype.agentAction = function(sAction, iId, iConfirm, iResetPaginate) {
    $('.bx-popup-applied:visible').dolPopupHide();
    if (typeof(glGrids) == 'undefined' || !this.sObjNameGrid || !glGrids[this.sObjNameGrid])
        return;

    glGrids[this.sObjNameGrid].actionSingle(sAction, iId, {
        confirm: iConfirm,
        reset_paginate: iResetPaginate
    });
};

BxDolStudioPageAgents.prototype.agentActivate = function(oSource) {
    var oDate = new Date();
    var oAgent = $(oSource).parents('.bx-agt-agent:first');

    jQuery.get(
        this.sActionUrl,
        {
            agt_action: 'agent-activate',
            agt_value: parseInt(oAgent.attr('data-id')),
            _t: oDate.getTime()
        },
        function(oData) {
            processJsonData(oData);
        },
        'json'
    );
};

BxDolStudioPageAgents.prototype.agentCheckName = function(oSource, sTitleId, sNameId, iId) {
    var oDate = new Date();
    var oForm = jQuery(oSource).parents('.bx-form-advanced:first');

    var oName = oForm.find("[name='" + sNameId + "']");
    var sName = oName.val();
    var bName = sName.length != 0;

    var oTitle = oForm.find("[name='" + sTitleId + "']");
    var sTitle = oTitle.val();
    var bTitle = sTitle.length != 0;

    if(!bName && !bTitle)
        return;

    var sTitleCheck = '';
    if(bName)
        sTitleCheck = sName;
    else if(bTitle) {
        sTitleCheck = sTitle;

        sTitle = sTitle.replace(/[^A-Za-z0-9_]/g, '-');
        sTitle = sTitle.replace(/[-]{2,}/g, '-');
        oName.val(sTitle.toLowerCase());
    }

    jQuery.get(
        this.sActionUrl,
        {
            agt_action: 'agent-check-name',
            agt_value: sTitleCheck,
            id: iId && parseInt(iId) > 0 ? iId : 0,
            _t: oDate.getTime()
        },
        function(oData) {
            if(!oData || oData.name == undefined)
                return;

            oName.val(oData.name);
        },
        'json'
    );
};

BxDolStudioPageAgents.prototype.onChangeAutomatorType = function(oSelect) {
    var aHide = [];
    var aShow = [];
    switch($(oSelect).val()) {
        case 'event':
            aHide = []; //['scheduler_time'];
            aShow = []; //['alert_unit', 'alert_action'];
            break;

        case 'scheduler':
            aHide = []; //['alert_unit', 'alert_action'];
            aShow = []; //['scheduler_time'];
            break;
            
        default:
            aHide = []; //['alert_unit', 'alert_action', 'scheduler_time'];
            aShow = [];
    }

    var sHide = '';
    aHide.forEach((sItem) => {
        sHide += ".bx-form-advanced #bx-form-element-" + sItem + ",";
    });

    var sShow = '';
    aShow.forEach((sItem) => {
        sShow += ".bx-form-advanced #bx-form-element-" + sItem + ",";
    });

    $(sHide.substring(0, sHide.length - 1)).bx_anim('hide', this.sAnimationEffect, 0);
    $(sShow.substring(0, sShow.length - 1)).bx_anim('show', this.sAnimationEffect, 0);
};

BxDolStudioPageAgents.prototype.approveCode = function(oSource, iCmtId) {
    var $this = this;
    var oData = this._getDefaultData();
    oData = jQuery.extend({}, oData, {action: 'approveCode', Cmt: iCmtId});

    oSource = $(oSource);
    bx_loading_btn(oSource, true);

    jQuery.post (
        this.sActionUrlCmts,
        oData,
        function(oData) {
            bx_loading_btn(oSource, false);

            processJsonData(oData);
        },
        'json'
    );
};

BxDolStudioPageAgents.prototype.providerAdd = function(oButton, sName) {
    var oButton = $(oButton);

    var oSubentry = oButton.parents('#bx-form-element-' + sName).find('.bx-form-input-provider:first').clone();
    oSubentry.find("select").val('');
    oSubentry.find("input[type = 'hidden']").remove();

    oButton.parents('.bx-form-input-provider-add:first').before(oSubentry);
};

BxDolStudioPageAgents.prototype.providerDelete = function(oButton) {
    $(oButton).parents('.bx-form-input-provider:first').remove();
};

BxDolStudioPageAgents.prototype.helperAdd = function(oButton, sName) {
    var oButton = $(oButton);

    var oSubentry = oButton.parents('#bx-form-element-' + sName).find('.bx-form-input-helper:first').clone();
    oSubentry.find("select").val('');
    oSubentry.find("input[type = 'hidden']").remove();

    oButton.parents('.bx-form-input-helper-add:first').before(oSubentry);
};

BxDolStudioPageAgents.prototype.helperDelete = function(oButton) {
    $(oButton).parents('.bx-form-input-helper:first').remove();
};

BxDolStudioPageAgents.prototype.assistantAdd = function(oButton, sName) {
    var oButton = $(oButton);

    var oSubentry = oButton.parents('#bx-form-element-' + sName).find('.bx-form-input-assistant:first').clone();
    oSubentry.find("select").val('');
    oSubentry.find("input[type = 'hidden']").remove();

    oButton.parents('.bx-form-input-assistant-add:first').before(oSubentry);
};

BxDolStudioPageAgents.prototype.assistantDelete = function(oButton) {
    $(oButton).parents('.bx-form-input-assistant:first').remove();
};

BxDolStudioPageAgents.prototype.toolAdd = function(oButton, sName) {
    var oButton = $(oButton);

    var oSubentry = oButton.parents('#bx-form-element-' + sName).find('.bx-form-input-tools:first').clone();
    oSubentry.find("select").val('');
    oSubentry.find("input[type = 'hidden']").remove();

    oButton.parents('.bx-form-input-tools-add:first').before(oSubentry);
};

BxDolStudioPageAgents.prototype.toolDelete = function(oButton) {
    $(oButton).parents('.bx-form-input-tools:first').remove();
};

BxDolStudioPageAgents.prototype._getDefaultData = function() {
    var oDate = new Date();
    return jQuery.extend({}, this._oRequestParams, {_t:oDate.getTime()});
};

/** @} */
