/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

function BxResourcesMain(oOptions) {
    this._oOptions = oOptions
    this._aHtmlIds = oOptions.aHtmlIds == undefined ? {} : oOptions.aHtmlIds;
}

BxResourcesMain.prototype.processList = function (iContextId, iId, oSource) {
    var $this = this;

    $(window).dolPopupAjax({
        url: $this._oOptions.sActionUrl + 'process_list_form/' + iContextId + '/' + iId + '/',
        closeOnOuterClick: false,
        removeOnClose: true
    });   
};

BxResourcesMain.prototype.deleteList = function (iContextId, iListId, oSource) {
    var $this = this;

    bx_confirm($this._oOptions.t_confirm_block_deletion, function () {
        $.getJSON($this._oOptions.sActionUrl + 'delete_list/' + iContextId + '/' + iListId + '/', {}, function (oData) {
            $this.reloadData(oData, iContextId);
        });
    });
};

BxResourcesMain.prototype.processEntry = function (iContextId, iListId, oSource) {
    var $this = this;

    $(window).dolPopupAjax({
        url: $this._oOptions.sActionUrl + 'process_entry_form/' + iContextId + '/' + iListId + '/',
        closeOnOuterClick: false,
        removeOnClose: true
    });
};

BxResourcesMain.prototype.reloadData = function (oData, iContextId) {
    $(".bx-popup-applied:visible").dolPopupHide();

    loadDynamicBlockAuto($('#' + this._aHtmlIds['lists']), window.location.href);
};

BxResourcesMain.prototype.reload = function (oData) {
    $(".bx-popup-applied:visible").dolPopupHide();

    document.location = document.location;
};
