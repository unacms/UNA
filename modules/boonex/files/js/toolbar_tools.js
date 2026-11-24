function BxFilesBrowserTools(oOptions) {
    this._sView = oOptions.layout;
    this._bBookmarks = oOptions.bookmarks;
    this._sSorting = oOptions.sorting;
    this._sKeyword = oOptions.keyword;
    this._sUniq = oOptions.unique_ident;
    this._aRequestParams = oOptions.aRequestParams;
    this._iSearchTimeoutId = 0;
    this._sActionUrl = oOptions.sActionUrl;
    this._iContext = oOptions.context;
    this._iCurrentFolder = oOptions.current_folder;
    this._iCurrentPage = oOptions.current_page;
    this._sCsrfToken = oOptions.csrf_token || '';

    this._oToolbarObject = $('#bx-files-browser-toolbar-' + this._sUniq).get(0);

    this.aSelectedFiles = [];

    var $this = this;

    $(document).ready(function(){
        $('input[type=checkbox]', $($this._oToolbarObject).parent()).change(function(){
            $this.updateBulkActionsPanelVisivility();
        });
    });

    $(window).on('files_browser.update', function(){
        $this.reloadBlock($this._iCurrentPage);
    });
}

BxFilesBrowserTools.prototype.findSelectedFiles = function() {
    this.aSelectedFiles = [];
    var $this = this;
    $('input[type=checkbox]:checked', $(this._oToolbarObject).parent()).each(function(i, el){
        if ($(el).val() > 0) $this.aSelectedFiles.push($(el).val());
    });
}

BxFilesBrowserTools.prototype.updateBulkActionsPanelVisivility = function() {
    this.findSelectedFiles();
    if (this.aSelectedFiles.length) $('.bx-files-bulk-actions', this._oToolbarObject).slideDown();
    else $('.bx-files-bulk-actions', this._oToolbarObject).slideUp();
}

BxFilesBrowserTools.prototype.reloadBlock = function(iPage) {
    if (typeof iPage == 'undefined') iPage = 0;
    loadDynamicBlockAutoPaginate(this._oToolbarObject, iPage, '0', this.getRequestUrl());
}

BxFilesBrowserTools.prototype.onChangeFilter = function(oFilter) {
	var $this = this;

	clearTimeout($this._iSearchTimeoutId);
    $this._iSearchTimeoutId = setTimeout(function () {
        $this._sKeyword = $(oFilter).val();
        $this.reloadBlock();
    }, 500);
};

BxFilesBrowserTools.prototype.setView = function(val) {
    this._sView = val;
    this.reloadBlock();
}

BxFilesBrowserTools.prototype.toggleBookmarks = function() {
    this._bBookmarks = this._bBookmarks ? 0 : 1;
    this.reloadBlock();
}

BxFilesBrowserTools.prototype.setSorting = function(val) {
    this._sSorting = val;
    this.reloadBlock();
}

BxFilesBrowserTools.prototype.getRequestUrl = function() {
    return  this._aRequestParams.unit_view_param + '=' + this._sView + '&' +
            this._aRequestParams.bookmarks_param + '=' + this._bBookmarks + '&' +
            this._aRequestParams.sorting_param + '=' + this._sSorting + '&' +
            this._aRequestParams.keyword_param + '=' + this._sKeyword + '&' +
            this._aRequestParams.current_folder + '=' + this._iCurrentFolder;
}

BxFilesBrowserTools.prototype.onSelectAll = function(el) {
    $(el).
        closest('.bx-files-text-unit-simple-row').
        siblings().
        find('input[type=checkbox]').
        prop('checked', $(el).prop('checked')).change(function(){
            $(el).attr('checked', false);
        });
};

BxFilesBrowserTools.prototype.onBeforeUpload = function() {
    $.post(this._sActionUrl + 'clear_ghosts/', {csrf_token: this._sCsrfToken});
}

BxFilesBrowserTools.prototype.onAfterUpload = function() {
    var $this = this;
    $.post(this._sActionUrl + 'upload_completed/', {context: this._iContext, folder: this._iCurrentFolder, csrf_token: this._sCsrfToken}, function(oData) {
        processJsonData(oData);
        $this.reloadBlock();
    }, 'json');
}

BxFilesBrowserTools.prototype.addFolder = function(sMessage) {
    var $this = this;
    bx_prompt(sMessage, '', function(oPopup) {
        var name = oPopup.getValue();

        $.post($this._sActionUrl + 'create_folder/', {context: $this._iContext, current_folder: $this._iCurrentFolder, name: name, csrf_token: $this._sCsrfToken}, function (oData) {
            processJsonData(oData);
            $this.reloadBlock();
        }, 'json');
    });
}

BxFilesBrowserTools.prototype.folderNavigate = function(id) {
    this._iCurrentFolder = id >= 0 ? id : -this._iCurrentFolder;
    this.reloadBlock();
}

BxFilesBrowserTools.prototype.bookmarkFiles = function() {
    if (!this.aSelectedFiles.length) return;

    var $this = this;
    $.post(this._sActionUrl+'bookmark/0', {bulk: this.aSelectedFiles, csrf_token: this._sCsrfToken}, function(oData){
        processJsonData(oData);
        $this.reloadBlock();
    }, 'json');
}

BxFilesBrowserTools.prototype.deleteFiles = function() {
    if (!this.aSelectedFiles.length) return;

    var $this = this;

    bx_confirm(_t('_Are_you_sure'), function(){
		$.post($this._sActionUrl+'entry_delete/0', {bulk: $this.aSelectedFiles, csrf_token: $this._sCsrfToken}, function(oData){
            processJsonData(oData);
            $this.reloadBlock();
        }, 'json');
	});
}

BxFilesBrowserTools.prototype.moveFiles = function() {
    if (!this.aSelectedFiles.length) return;

    $.post(this._sActionUrl + 'move_files/', {bulk: this.aSelectedFiles, csrf_token: this._sCsrfToken}, processJsonData, 'json');
}

BxFilesBrowserTools.prototype.downloadFiles = function() {
    if (!this.aSelectedFiles.length) return;

    window.open(this._sActionUrl + 'download/0/0/' + JSON.stringify(this.aSelectedFiles),'_blank');
}