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

BxDolStudioPageAgents.prototype.initAgentChat = function(sSelector, iAgentId, aThreads) {
    var $this = this;
    if (typeof aThreads === 'undefined') {
        this._fetchAgentChatThreads(iAgentId, function(aList) {
            $this.initAgentChat(sSelector, iAgentId, aList || []);
        });
        return;
    }

    var oChat = $(sSelector);
    if (!oChat.length)
        return;

    this.destroyAgentChat();
    this._ensureAgentChatStyles();
    this._sAgentChatSelector = sSelector;
    this._iAgentChatId = iAgentId;

    var oBox = oChat.closest('.bx-agents-popup-chat-wrap');
    if (!oBox.length)
        oBox = this._ensureAgentChatWrap(oChat, iAgentId);

    if (!aThreads.length && !oBox.find('.bx-agents-popup-chat-thread').length)
        aThreads = [{ thread_id: '', writable: 1, context_pid: 0, title: 'Guest', meta: '' }];
    if (aThreads.length)
        this._fillAgentChatThreads(oBox, aThreads);

    this._oAgentChatBox = oBox;
    oBox.off('click.agentChat').on('click.agentChat', '.bx-agents-popup-chat-thread', function(e) {
        e.preventDefault();
        $this._openAgentChatThread($(this));
    });

    var oFirst = oBox.find('.bx-agents-popup-chat-thread').first();
    if (oFirst.length)
        this._openAgentChatThread(oFirst);
    else
        this._initWritableAgentChat(sSelector, iAgentId, 0);
};

BxDolStudioPageAgents.prototype._fetchAgentChatThreads = function(iAgentId, fDone) {
    var sUrl = (typeof sUrlRoot !== 'undefined' ? sUrlRoot : '/') + 'grid.php?o=sys_studio_agents_agents&a=get_chat_threads&id=' + encodeURIComponent(iAgentId) + '&_r=' + Date.now();
    if (typeof glGrids !== 'undefined' && this.sObjNameGrid && glGrids[this.sObjNameGrid] && glGrids[this.sObjNameGrid]._sCsrfToken)
        sUrl += '&csrf_token=' + encodeURIComponent(glGrids[this.sObjNameGrid]._sCsrfToken);
    $.getJSON(sUrl, function(oData) {
        fDone((oData && oData.threads) ? oData.threads : []);
    }).fail(function() {
        fDone([]);
    });
};

BxDolStudioPageAgents.prototype._ensureAgentChatWrap = function(oChat, iAgentId) {
    oChat.wrap('<div class="bx-agents-popup-chat-wrap" data-agent-id="' + parseInt(iAgentId, 10) + '"><div class="bx-agents-popup-chat-main"></div></div>');
    var oMain = oChat.parent();
    var oBox = oMain.parent();
    oMain.append('<div class="bx-agents-popup-chat-note" style="display:none;">View only</div>');
    oChat.before('<div class="bx-agents-popup-chat-artifacts" style="display:none;"></div>');
    oBox.prepend('<aside class="bx-agents-popup-chat-list"><div class="bx-agents-popup-chat-list-title">Chats</div><div class="bx-agents-popup-chat-list-items"></div></aside>');
    return oBox;
};

BxDolStudioPageAgents.prototype._fillAgentChatThreads = function(oBox, aThreads) {
    var oItems = oBox.find('.bx-agents-popup-chat-list-items');
    if (!oItems.length)
        return;
    oItems.empty();
    for (var i = 0; i < aThreads.length; i++) {
        var t = aThreads[i] || {};
        var bMine = parseInt(t.writable, 10) === 1;
        var oBtn = $('<button type="button" class="bx-agents-popup-chat-thread"></button>');
        if (bMine)
            oBtn.addClass('bx-agents-popup-chat-thread-mine');
        oBtn.attr({
            'data-thread-id': t.thread_id || '',
            'data-writable': bMine ? 1 : 0,
            'data-context': parseInt(t.context_pid, 10) || 0
        });
        oBtn.data('artifacts', Array.isArray(t.artifacts) ? t.artifacts : []);
        oBtn.append($('<span class="bx-agents-popup-chat-thread-title"></span>').text(t.title || 'Chat'));
        var sStatus = t.status === 'closed' ? 'closed' : 'opened';
        var oMeta = $('<span class="bx-agents-popup-chat-thread-meta"></span>')
            .addClass(sStatus === 'closed' ? 'bx-agents-popup-chat-thread-status-closed' : 'bx-agents-popup-chat-thread-status-opened')
            .text(t.meta || ('status: ' + sStatus));
        oBtn.append(oMeta);
        oItems.append(oBtn);
    }
};

BxDolStudioPageAgents.prototype._ensureAgentChatStyles = function() {
    if (document.getElementById('bx-agents-popup-chat-inline-css'))
        return;
    var oStyle = document.createElement('style');
    oStyle.id = 'bx-agents-popup-chat-inline-css';
    oStyle.textContent =
        '#grid-popup-sys_studio_agents_agents-message .bx-popup-width{width:68rem;max-width:calc(100vw - 2rem);}' +
        '.bx-agents-popup-chat-wrap{display:flex;gap:0.75rem;min-height:32rem;max-height:min(36rem,calc(100vh - 10rem));}' +
        '.bx-agents-popup-chat-list{flex:0 0 15.5rem;width:15.5rem;display:flex;flex-direction:column;min-height:0;border-right:1px solid rgba(0,0,0,.08);padding-right:0.75rem;}' +
        '.bx-agents-popup-chat-list-title{font-weight:600;margin-bottom:0.5rem;}' +
        '.bx-agents-popup-chat-list-items{overflow-y:auto;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:0.25rem;}' +
        '.bx-agents-popup-chat-thread{display:block;width:100%;text-align:left;border:0;background:transparent;padding:0.5rem 0.6rem;border-radius:0.4rem;cursor:pointer;}' +
        '.bx-agents-popup-chat-thread:hover,.bx-agents-popup-chat-thread-active{background:rgba(37,99,235,.08);}' +
        '.bx-agents-popup-chat-thread-title{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.bx-agents-popup-chat-thread-meta{display:block;font-size:0.75rem;margin-top:0.15rem;white-space:pre-line;line-height:1.25;}' +
        '.bx-agents-popup-chat-thread-status-opened{color:#15803d;}' +
        '.bx-agents-popup-chat-thread-status-closed{color:#b45309;}' +
        '.bx-agents-popup-chat-thread-dates{display:block;font-size:0.7rem;opacity:.6;margin-top:0.1rem;line-height:1.25;}' +
        '.bx-agents-popup-chat-thread-dates span{display:block;}' +
        '.bx-agents-popup-chat-artifacts{flex:0 0 auto;margin:0 0 0.5rem;padding:0.5rem 0.65rem;font-size:0.8rem;line-height:1.35;border:1px solid rgba(0,0,0,.12);border-radius:0.4rem;max-height:8rem;overflow-y:auto;background:#fffbe6;}' +
        '.bx-agents-popup-chat-artifacts-row{display:flex;gap:0.5rem;min-width:0;}' +
        '.bx-agents-popup-chat-artifacts-k{flex:0 0 7rem;font-weight:600;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.bx-agents-popup-chat-artifacts-v{flex:1 1 auto;min-width:0;overflow-wrap:anywhere;}' +
        '.bx-agents-popup-chat-artifacts-empty{opacity:.6;}' +
        '.bx-agents-popup-chat-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;}' +
        '.bx-agents-popup-chat{height:auto;flex:1 1 auto;min-height:16rem;max-height:100%;}' +
        '.bx-agents-popup-chat-note{margin-top:0.5rem;font-size:0.8rem;opacity:.7;}';
    document.head.appendChild(oStyle);
};

BxDolStudioPageAgents.prototype._openAgentChatThread = function(oBtn) {
    var sSelector = this._sAgentChatSelector;
    var iAgentId = this._iAgentChatId;
    var oBox = this._oAgentChatBox;
    if (!oBtn || !oBtn.length || !sSelector)
        return;

    if (oBox && oBox.length) {
        oBox.find('.bx-agents-popup-chat-thread').removeClass('bx-agents-popup-chat-thread-active');
        oBtn.addClass('bx-agents-popup-chat-thread-active');
    }

    var bWritable = parseInt(oBtn.attr('data-writable'), 10) === 1;
    var iContext = parseInt(oBtn.attr('data-context'), 10) || 0;
    var sThreadId = oBtn.attr('data-thread-id') || '';

    this.destroyAgentChat(true);
    this._renderAgentChatArtifacts(oBox, oBtn.data('artifacts') || []);

    if (bWritable) {
        if (oBox && oBox.length)
            oBox.find('.bx-agents-popup-chat-note').hide();
        this._initWritableAgentChat(sSelector, iAgentId, iContext);
        return;
    }

    if (oBox && oBox.length)
        oBox.find('.bx-agents-popup-chat-note').show();
    this._loadReadonlyAgentChat(sSelector, iAgentId, sThreadId);
};

BxDolStudioPageAgents.prototype._initWritableAgentChat = function(sSelector, iAgentId, iContext) {
    if (typeof una === 'undefined' || !una.Chat)
        return;

    var sRoot = (typeof sUrlRoot !== 'undefined') ? sUrlRoot : '/';
    var sEndpoint = sRoot + 'sys-ai-chat/' + encodeURIComponent(iAgentId);
    iContext = parseInt(iContext, 10) || 0;
    if (iContext > 0)
        sEndpoint += '&context=' + encodeURIComponent(iContext);

    this._oAgentChat = una.Chat.init(sSelector, {
        agentId: iAgentId,
        formatting: true,
        contextProfileId: iContext,
        endpoint: sEndpoint
    });
};

BxDolStudioPageAgents.prototype._loadReadonlyAgentChat = function(sSelector, iAgentId, sThreadId) {
    var $this = this;
    var el = typeof sSelector === 'string' ? document.querySelector(sSelector) : sSelector;
    if (!el)
        return;

    this._iAgentChatLoad = (this._iAgentChatLoad || 0) + 1;
    var iLoad = this._iAgentChatLoad;
    el.innerHTML = '';

    var sUrl = (typeof sUrlRoot !== 'undefined' ? sUrlRoot : '/') + 'grid.php?o=sys_studio_agents_agents&a=get_chat_thread&id=' + encodeURIComponent(iAgentId) + '&thread_id=' + encodeURIComponent(sThreadId) + '&_r=' + Date.now();
    if (typeof glGrids !== 'undefined' && this.sObjNameGrid && glGrids[this.sObjNameGrid] && glGrids[this.sObjNameGrid]._sCsrfToken)
        sUrl += '&csrf_token=' + encodeURIComponent(glGrids[this.sObjNameGrid]._sCsrfToken);

    if (this._oAgentChatXhr && this._oAgentChatXhr.abort)
        this._oAgentChatXhr.abort();

    this._oAgentChatXhr = $.getJSON(sUrl, function(oData) {
        if (iLoad !== $this._iAgentChatLoad)
            return;
        if (!oData || (oData.code && oData.code != 200)) {
            el.innerHTML = '<div class="bx-def-font-small" style="color:#c0392b;">' + $this._escAgentChat((oData && (oData.msg || oData.message)) || 'Error') + '</div>';
            return;
        }
        if (parseInt(oData.writable, 10) === 1) {
            $this._initWritableAgentChat(sSelector, iAgentId, 0);
            return;
        }
        $this._renderAgentChatArtifacts($this._oAgentChatBox, oData.artifacts || []);
        $this._renderReadonlyAgentChat(el, oData.messages || []);
    }).fail(function() {
        if (iLoad !== $this._iAgentChatLoad)
            return;
        el.innerHTML = '';
    });
    };

BxDolStudioPageAgents.prototype._ensureAgentChatArtifactsPanel = function(oBox) {
    if (!oBox || !oBox.length)
        return $();
    var oPanel = oBox.find('.bx-agents-popup-chat-main > .bx-agents-popup-chat-artifacts');
    if (oPanel.length)
        return oPanel;
    oPanel = $('<div class="bx-agents-popup-chat-artifacts"></div>');
    var oChat = oBox.find('.bx-agents-popup-chat-main > .bx-agents-popup-chat').first();
    if (oChat.length)
        oChat.before(oPanel);
    else
        oBox.find('.bx-agents-popup-chat-main').prepend(oPanel);
    return oPanel;
};

BxDolStudioPageAgents.prototype._fillAgentChatArtifactsEl = function(oPanel, aArtifacts) {
    if (!oPanel || !oPanel.length)
        return;
    aArtifacts = Array.isArray(aArtifacts) ? aArtifacts : [];
    oPanel.empty();
    if (!aArtifacts.length) {
        oPanel.hide();
        return;
    }
    for (var i = 0; i < aArtifacts.length; i++) {
        var a = aArtifacts[i] || {};
        var oRow = $('<div class="bx-agents-popup-chat-artifacts-row"></div>');
        oRow.append($('<span class="bx-agents-popup-chat-artifacts-k"></span>').text(a.field_name || ''));
        oRow.append($('<span class="bx-agents-popup-chat-artifacts-v"></span>').text(a.field_value || ''));
        oPanel.append(oRow);
    }
    oPanel.show();
};

BxDolStudioPageAgents.prototype._renderAgentChatArtifacts = function(oBox, aArtifacts) {
    this._fillAgentChatArtifactsEl(this._ensureAgentChatArtifactsPanel(oBox), aArtifacts);
};

BxDolStudioPageAgents.prototype._renderReadonlyAgentChat = function(el, aMessages) {
    var html = '<div class="bx-ai-chat flex flex-col gap-3 h-full min-h-72">' +
        '<div class="bx-ai-chat-messages bx-def-border bx-def-round-corners bx-def-padding" style="flex:1;overflow-y:auto;min-height:16rem;">';
    for (var i = 0; i < aMessages.length; i++) {
        var m = aMessages[i] || {};
        var isUser = m.role === 'user';
        var text = '';
        if (typeof m.content === 'string')
            text = m.content;
        else if (m.parts && m.parts.length) {
            for (var j = 0; j < m.parts.length; j++) {
                if (m.parts[j] && m.parts[j].type === 'text' && m.parts[j].content)
                    text += (text ? '\n' : '') + m.parts[j].content;
            }
        }
        html += '<div class="bx-ai-chat-message" style="display:flex;justify-content:' + (isUser ? 'flex-end' : 'flex-start') + ';margin:6px 0;">' +
            '<div class="bx-ai-chat-message-inner bx-def-padding-sec bx-def-round-corners" style="max-width:85%;background:' + (isUser ? '#2563eb' : '#fff') + ';color:' + (isUser ? '#fff' : 'inherit') + ';">' +
            this._escAgentChat(text).replace(/\n/g, '<br />') +
            '</div></div>';
    }
    html += '</div></div>';
    el.innerHTML = html;
    var list = el.querySelector('.bx-ai-chat-messages');
    if (list)
        list.scrollTop = list.scrollHeight;
};

BxDolStudioPageAgents.prototype._escAgentChat = function(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

BxDolStudioPageAgents.prototype.destroyAgentChat = function(bKeepBox) {
    this._iAgentChatLoad = (this._iAgentChatLoad || 0) + 1;
    if (this._oAgentChatXhr && this._oAgentChatXhr.abort) {
        try { this._oAgentChatXhr.abort(); } catch (e) {}
    }
    this._oAgentChatXhr = null;

    if (this._oAgentChat) {
    try {
        this._oAgentChat.destroy();
    } catch (e) {}
    this._oAgentChat = null;
    }

    if (this._sAgentChatSelector) {
        var el = document.querySelector(this._sAgentChatSelector);
        if (el)
            el.innerHTML = '';
    }

    if (!bKeepBox) {
        if (this._oAgentChatBox && this._oAgentChatBox.length)
            this._oAgentChatBox.off('click.agentChat');
        this._oAgentChatBox = null;
        this._sAgentChatSelector = '';
        this._iAgentChatId = 0;
    }
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

BxDolStudioPageAgents.prototype.agentAdd = function() {
    if (typeof(glGrids) == 'undefined' || !this.sObjNameGrid || !glGrids[this.sObjNameGrid])
        return;

    glGrids[this.sObjNameGrid].action('add', {}, '', false, 0);
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
