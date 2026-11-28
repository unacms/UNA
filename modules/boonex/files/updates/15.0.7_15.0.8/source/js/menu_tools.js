/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

function BxFilesMenuTools(oOptions) {
	this._sActionsUrl = oOptions.sActionUrl;
	this._sCsrfToken = oOptions.csrf_token || '';
}

BxFilesMenuTools.prototype.bookmark = function(iContentId, oMenuItem) {
	$.post(this._sActionsUrl+'bookmark/'+iContentId, {csrf_token: this._sCsrfToken});

	if ($('i', oMenuItem).hasClass('far')) {
		$('i', oMenuItem).removeClass('far').addClass('fas');
	} else {
		$('i', oMenuItem).removeClass('fas').addClass('far');
	}
};

BxFilesMenuTools.prototype.preview = function(iContentId) {
	$('.bx-popup-wrapper:visible').dolPopupHide();
	$.get(this._sActionsUrl+'entry_preview/'+iContentId, processJsonData, 'json');
};

BxFilesMenuTools.prototype.info = function(iContentId) {
	$('.bx-popup-wrapper:visible').dolPopupHide();
	$.get(this._sActionsUrl+'entry_info/'+iContentId, processJsonData, 'json');
};

BxFilesMenuTools.prototype.edit = function(iContentId) {
	$('.bx-popup-wrapper:visible').dolPopupHide();
	$.get(this._sActionsUrl+'entry_edit_title/'+iContentId, processJsonData, 'json');
};

BxFilesMenuTools.prototype.delete = function(iContentId) {
	$('.bx-popup-wrapper:visible').dolPopupHide();
	var $this = this;
	bx_confirm(_t('_Are_you_sure'), function(){
		$.post($this._sActionsUrl+'entry_delete/'+iContentId, {csrf_token: $this._sCsrfToken}, processJsonData, 'json');
	});
};

BxFilesMenuTools.prototype.moveTo = function(iContentId) {
    $.post(this._sActionsUrl + 'move_files/', {file: iContentId, csrf_token: this._sCsrfToken}, processJsonData, 'json');
}

/** @} */
