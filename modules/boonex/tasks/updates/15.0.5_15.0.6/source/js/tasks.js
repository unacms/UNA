/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

function BxTasksView(oOptions) {
    this._oOptions = oOptions;
}

BxTasksView.prototype.init = function () {
    var $this = this;

    $('.bx-tasks-tasklist').each(function() {
        $(this).addClass(localStorage.getItem('bx-tasks-tasklist-' + $(this).attr('data-list')));
    });
};

BxTasksView.prototype.toggle = function (sList, oSource) {
    var sClass = 'bx-tasks-tl-collapsed';
    var oParent = $(oSource).parents('.bx-tasks-tasklist:first');

    oParent.toggleClass(sClass);
    oParent.siblings('.bx-tasks-tasks').toggle();

    localStorage.setItem('bx-tasks-tasklist-' + sList, oParent.hasClass(sClass) ? sClass : '');
    return false;
};

BxTasksView.prototype.setCompleted = function (iId, oObj) {
    var iVal = ($(oObj).prop('checked') ? 1 : 0);

    this._setCompleted(iId, iVal);
};

BxTasksView.prototype.setCompletedByMenu = function (iId, iValue, oObj) {
    $(oObj).addClass('bx-btn-disabled');

    this._setCompleted(iId, iValue, function(oData) {
        processJsonData(oData);
    });
};

BxTasksView.prototype._setCompleted = function (iId, iValue, onComplete) {
    $.getJSON(this._oOptions.sActionUrl + 'set_completed/' + iId + '/' + iValue + '/', function(oData) {
        if(typeof onComplete === 'function')
            onComplete(oData);
    });
};

BxTasksView.prototype.processTaskList = function (iContextId, iId, oSource, oEvent) {
    oEvent.stopPropagation();

    var $this = this;
    $(window).dolPopupAjax({
        url: $this._oOptions.sActionUrl + 'process_task_list_form/' + iContextId + '/' + iId + '/',
        closeOnOuterClick: false,
        removeOnClose: true
    });
};

BxTasksView.prototype.deleteTaskList = function (iContextId, iId, obj) {
    var $this = this;
    bx_confirm($this._oOptions.t_confirm_block_deletion, function () {
        $.getJSON($this._oOptions.sActionUrl + 'delete_task_list/' + iContextId + '/' + iId + '/', {}, function (oData) {
            $this.reloadData(oData, iContextId)
        });
    });
};
	
BxTasksView.prototype.processTask = function (iContextId, iListId, oSource) {
    var $this = this;
    $(window).dolPopupAjax({
        url: $this._oOptions.sActionUrl + 'process_task_form/' + iContextId + '/' + iListId + '/',
        closeOnOuterClick: false,
        removeOnClose: true
    });
};

BxTasksView.prototype.processTaskEditTasksList = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'tasks_list', oSource);
};

BxTasksView.prototype.processTaskEditType = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'type', oSource);
};

BxTasksView.prototype.processTaskEditPriority = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'priority', oSource);
};

BxTasksView.prototype.processTaskEditEstimate = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'estimate', oSource);
};

BxTasksView.prototype.processTaskEditDueDate = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'due_date', oSource);
};

BxTasksView.prototype.processTaskEditState = function (iContentId, oSource) {
    this.processTaskEditProperty(iContentId, 'state', oSource);
};

BxTasksView.prototype.processTaskEditProperty = function (iContentId, sProperty, oSource) {
    var $this = this;
    $(window).dolPopupAjax({
        url: $this._oOptions.sActionUrl + 'process_task_form_edit_property/' + iContentId + '/' + sProperty + '/',
        closeOnOuterClick: false,
        removeOnClose: true
    });
};

BxTasksView.prototype.changeAlloViewTo = function (oSource) {
    var iContext = parseInt($(oSource).val());

    if(iContext && iContext < 0)
        document.location = bx_append_url_params(document.location.href, {context: iContext});
};

BxTasksView.prototype.hidePopup = function (oData) {
    $(".bx-popup-applied:visible").dolPopupHide();
};

BxTasksView.prototype.reloadData = function (oData, iContextId) {
    $(".bx-popup-applied:visible").dolPopupHide();

    loadDynamicBlockAuto($('.bx-tasks-tasklist-add'), window.location.href )
};

BxTasksView.prototype.reload = function (oData) {
    $(".bx-popup-applied:visible").dolPopupHide();

    document.location = document.location;
};

BxTasksView.prototype.applyFilter = function (oSource, iContextId) {
    var $this = this;
    var iFilter = $(oSource).val();
    var oDate = new Date();

    this.loadingInBlock(oSource, true);

    $.get(
        this._oOptions.sActionUrl + 'apply_filter/' + iContextId + '/' + iFilter, 
        {
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loadingInBlock(oSource, false);

            processJsonData(oData);
        },
        'json'
    );

    return false;
};

BxTasksView.prototype.onApplyFilter = function (oData) {
    if(oData && oData.content) {
        var sTasksId = '#' + this._oOptions.aHtmlIds['tasks'];

        $(sTasksId).replaceWith(oData.content);
        $(sTasksId).bxProcessHtml();
    }
};

BxTasksView.prototype.createFilter = function (oSource, iContextId) {
    var $this = this;
    var oDate = new Date();

    this.loadingInBlock(oSource, true);

    $.get(
        this._oOptions.sActionUrl + 'create_filter/' + iContextId, 
        {
            _t: oDate.getTime()
        },
        function(oData) {
            $this.loadingInBlock(oSource, false);

            processJsonData(oData);
        },
        'json'
    );

    return false;
};

BxTasksView.prototype.onChangeSave = function (oElement) {
    $(oElement).parents('form').find('#bx-form-element-title').toggleClass('bx-tasks-ffi-hidden', !($("[name = 'save_me']").prop('checked') || $("[name = 'save_all']").prop('checked')));
};

BxTasksView.prototype.loadingInBlock = function(e, bShow) {
    var oParent = $(e).length ? $(e).parents('.bx-db-container:first') : $('body'); 
    bx_loading(oParent, bShow);
};