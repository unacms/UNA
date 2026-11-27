/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 */

/**
 * Media Uploader js class
 */

function BxMediaUploader(sUploaderObject, sStorageObject, sUniqId, sActionsUri, options) {
    this.init(sUploaderObject, sStorageObject, sUniqId, sActionsUri, options);
    this._sIframeId = 'bx-form-input-files-' + sUniqId + '-iframe';
    this._eForm = null;
}

BxMediaUploader.prototype.init = function (sUploaderObject, sStorageObject, sUniqId, sActionsUri, options) {
    this._sUploaderObject = sUploaderObject;
    this._sStorageObject = sStorageObject;
    this._sUniqId = sUniqId;
	
    this._sActionsUri = sActionsUri;
	this._sModulePath = options.module_path ? options.module_path : ''; 

    this._sPopupContainerId = 'bx-form-input-files-' + sUniqId + '-popup-wrapper-' + this._sUploaderObject;
    this._sResultContainerId = 'bx-form-input-files-' + sUniqId + '-upload-result';
    this._sErrorsContainerId = 'bx-form-input-files-' + sUniqId + '-errors'; 
    this._sFormContainerId = 'bx-form-input-files-' + sUniqId + '-form-cont';
	
	
    this._sTemplateGhost = options.template_ghost ? options.template_ghost : '<div id="' + this._getFileContainerId('{file_id}') + '"><input type="hidden" name="f[]" value="{file_id}" />{file_name} (<a href="javascript:void(0);" onclick="{js_instance_name}.deleteGhost(\'{file_id}\')">delete</a>)</div>';
    this._sTemplateReorder = options.template_reorder ? options.template_reorder : '<div class="bx-uploader-ghost-reorder"><i class="sys-icon bars"></i></div>';
    this._sTemplateError = options.template_error_msg ? options.template_error_msg : '<div>{error}</div>' ;
    this._sTemplateErrorGhosts = options.template_error_ghosts ? options.template_error_ghosts : this._sTemplateError;

    this._isMultiple = undefined == options.multiple || !options.multiple ? false : true;
    this._isReordering = undefined == options.reordering || !options.reordering ? false : true;

	this._iContentId = undefined == options.content_id || '' == options.content_id ? '' : parseInt(options.content_id);
    this._sImagesTranscoder = options.images_transcoder ? options.images_transcoder : '';
    this._isPrivate = undefined == options.storage_private || parseInt(options.storage_private) ? 1 : 0;
    this._sUploaderInstanceName = options.uploader_instance_name ? options.uploader_instance_name : '';
    this._sUploadToken = options.upload_token ? options.upload_token : '';
    
    this._acceptedFileTypes = options.acceptedFiles ? options.acceptedFiles : '';
    
	this._isUploadsInProgress = false;
	this._isErrorShown = false;
	this._bNeedClose = false;
	
	this._aJsToEval = [];
	this._aFilesForUpload = [];
	
	this._aLabels = [];
	
	this._oFilePondObject = '';
	FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginFileValidateType,
        FilePondPluginFileValidateSize,
        FilePondPluginImageTransform,
        FilePondPluginImageCrop,
        FilePondPluginImageResize,
            
    );
}

BxMediaUploader.prototype.popupShow = function (oLabels) 
{
	var $this = this;
	$this._aLabels = oLabels;

	var oSettings = {
		// files upload on Done, so a photo can be edited before: click it in the list
		instantUpload: false,
		allowProcess: false,
		allowMultiple: this._isMultiple,
		server: {
			process: function (fieldName, file, metadata, load, error, progress, abort) {
				var formData = new FormData();
				formData.append(fieldName, file, file.name);
				formData.append('uo', $this._sUploaderObject);
				formData.append('so', $this._sStorageObject);
				formData.append('uid', $this._sUniqId);
				formData.append('m', $this._isMultiple);
				formData.append('c', $this._iContentId);
				formData.append('p', $this._isPrivate);
				formData.append('a', 'upload');
				if ($this._sUploadToken)
					formData.append('ut', $this._sUploadToken);

				var request = new XMLHttpRequest();
				request.open('POST', sUrlRoot + 'storage_uploader.php');
				request.upload.onprogress = function (e) {
					progress(e.lengthComputable, e.loaded, e.total);
				};
				request.onload = function () {
					if (request.status >= 200 && request.status < 300) {
						load($this._sUploaderInstanceName);
						$this._aJsToEval.push(jQuery(request.responseText).text());
					}
					else {
						error(request.status);
					}
				};
				request.onerror = function () {
					error('error');
				};
				request.send(formData);

				return {
					abort: function () {
						request.abort();
						abort();
					}
				};
			}
		},
		onactivatefile: function (oItem) {
			$this.editPondFile(oItem);
		}
	};

	var aAcceptableFiles = [];
	if ($this._acceptedFileTypes && $this._acceptedFileTypes != '') {
		$this._acceptedFileTypes.split(',').forEach(function (sItem) {
			var mixedType = $this.getMimeTypefromString(sItem.trim());
			if (!mixedType)
				return;
			if (Array.isArray(mixedType))
				aAcceptableFiles = aAcceptableFiles.concat(mixedType);
			else
				aAcceptableFiles.push(mixedType);
		});
	}

	$this._oFilePondObject = FilePond.create(document.querySelector('#' + this._sFormContainerId + ' input[type="file"]'), Object.assign(oSettings, oLabels));
	$this._oFilePondObject.acceptedFileTypes = aAcceptableFiles;
	$this._oFilePondObject.on('processfiles', function () {
		if ($this._bNeedClose)
			$this.finalize();
	});

	$('#' + this._sPopupContainerId + ' .bx_media_list_item').on('click', function () {
		$this.selectFile(this);
	});

	// edit a recent file: the edited copy is uploaded as a new file
	$('#' + this._sPopupContainerId + ' .bx_media_lists button').on('click', function (oEvent) {
		oEvent.stopPropagation();

		var eItem = $(this).parents('.bx_media_list_item');
		var sId = eItem.attr('data-id');
		var oFile = $this._aFilesForUpload[sId];
		BxMediaEditor.open({src: oFile.file || oFile.url}).then(function (oResult) {
			if (!oResult)
				return;
			eItem.css('backgroundImage', 'url(' + URL.createObjectURL(oResult) + ')');
			eItem.attr('data-upload', '1');
			$this.addUploadedFile(oResult, sId);
			if (!$this._aFilesForUpload[sId].selected)
				$this.selectFile(eItem.get(0));
		});
	});
}

BxMediaUploader.prototype.editPondFile = function (oItem) {
	var $this = this;
	if (!oItem || !oItem.file || !/^image\/(jpeg|png|webp|gif|bmp)$/.test(oItem.fileType))
		return;

	BxMediaEditor.open({src: oItem.file, name: oItem.filename}).then(function (oResult) {
		if (!oResult)
			return;
		var oPond = $this._oFilePondObject;
		var iIndex = oPond.getFiles().indexOf(oItem);
		oPond.removeFile(oItem.id);
		oPond.addFile(oResult, iIndex >= 0 ? {index: iIndex} : {});
	});
}

BxMediaUploader.prototype.initFile = function (id, url) {
	var $this = this;
	$this._aFilesForUpload[id] = {id: id, url: url, selected: false, file: null, status: true, statusInfo: ''};
}

BxMediaUploader.prototype.selectFile = function (obj) {
    var $this = this;
    var id = $(obj).attr('data-id');
	if (!$this.isMultiple()){
		$.each($this._aFilesForUpload, function(index, value) {
			if ($this._aFilesForUpload[index] != null)
			$this._aFilesForUpload[index].selected = false;
			$this._aFilesForUpload[id].status = false;
		}); 
		$('.bx_media_list_item_container').removeClass('bx_media_list_item_container_selected');
	}
		
	if (!$this._aFilesForUpload[id].selected){
		$this._aFilesForUpload[id].selected = true;
		$this._aFilesForUpload[id].status = false;
		$(obj).parent().addClass('bx_media_list_item_container_selected');
	}
	else{
		$this._aFilesForUpload[id].selected = false;
		$this._aFilesForUpload[id].status = true;
		$(obj).parent().removeClass('bx_media_list_item_container_selected');
	}

}

BxMediaUploader.prototype.addUploadedFile = function (file, id) {
	var $this = this;
	$this._aFilesForUpload[id].file = file;
}

BxMediaUploader.prototype.uploadSelectedFiles = function (btn) {
	var $this = this;
	$(btn).text($this._aLabels['labelButtonProcessAll']);
	$(btn).prop('disabled', true);
	$.each($this._aFilesForUpload, function(index, value) {
    	if (value != null && value.selected)
			$this.uploadFile(value);
	}); 
	
	$this._oFilePondObject.processFiles();
	$this._bNeedClose = true;
	$this.finalize();
}

BxMediaUploader.prototype.uploadFile = function (oFile) {
	var $this = this;
	
    if (oFile.file != null) {
        const formData = new FormData();

        formData.append('f[]', oFile.file, new Date().getTime() + "_" + oFile.file.name);
        formData.append('uo', this._sUploaderObject);
        formData.append('so', this._sStorageObject);
        formData.append('uid', this._sUniqId);
        formData.append('m', this._isMultiple);
        formData.append('c', this._iContentId);
        formData.append('p', this._isPrivate);
        formData.append('a', 'upload');
        if (this._sUploadToken) formData.append('ut', this._sUploadToken);

        const request = new XMLHttpRequest();
        request.open('POST', sUrlRoot + 'storage_uploader.php');

        request.onload = function(res) {
            if (request.status >= 200 && request.status < 300) {
				$this._aFilesForUpload[oFile.id].status = true;
				$this._aJsToEval.push(jQuery(request.responseText).text());
				$this.finalize();
            }
        };
        request.send(formData);
    }
    else{
        // a recent file unchanged: the server copies it by its id
        $.post(sUrlRoot + $this._sActionsUri + 'CopyFile/', { FileId: oFile.id, StorageObject: this._sStorageObject, UniqId: this._sUniqId, UploaderInstanceName: this._sUploaderInstanceName, UploaderObject: this._sUploaderObject, isPrivate: this._isPrivate, ContentId: this._iContentId, isMultiple: this._isMultiple ? 1 : 0 }, function (data, textStatus) {
			$this._aFilesForUpload[oFile.id].status = true;
			$this._aJsToEval.push(jQuery(data).text());
			$this.finalize();
        });
    }
}

BxMediaUploader.prototype.isMultiple = function () {
    return this._isMultiple;
}

BxMediaUploader.prototype.getCurrentFilesCount = function () {
	var $this = this;
    return $('#' + $this._sResultContainerId + ' .bx-uploader-ghost').length;
}

BxMediaUploader.prototype.showUploaderForm = function () {
    var $this = this;
    var sUrl = this._getUrlWithStandardParams() + '&a=show_uploader_form&m=' + (this._isMultiple ? 1 : 0) + '&c=' + this._iContentId + '&p=' + this._isPrivate + '&_t=' + escape(new Date());
    $(window).dolPopupAjax({
        url: sUrl,
        id: {force: true, value: this._sPopupContainerId},
        onBeforeShow: function() {
            if ($this.isMultiple())
                $('#' + $this._sPopupContainerId + ' .bx-uploader-add-more-files').show();
            else
                $('#' + $this._sPopupContainerId + ' .bx-uploader-add-more-files').hide();
            $('#' + $this._sPopupContainerId + ' .bx-popup-element-close').click(function() {
                $this.close();
            });
            if ('undefined' !== typeof($this.onBeforeShowPopup))
                $this.onBeforeShowPopup();
        },
        onShow: function () {
            if ('undefined' !== typeof($this.onShowPopup))
                $this.onShowPopup();
        },
        closeOnOuterClick: false,
		removeOnClose: true,
    });
}

BxMediaUploader.prototype.finalize = function () {
	var $this = this;

	// FilePond still uploads or has files waiting
	if ($this._oFilePondObject.status == 3 || $this._oFilePondObject.status == 1)
		return;

	// recent files still being copied
	var bWaiting = false;
	$.each($this._aFilesForUpload, function (sId, oFile) {
		if (oFile != null && !oFile.status)
			bWaiting = true;
	});
	if (bWaiting)
		return;

	var aResults = $this._aJsToEval;
	$this._aJsToEval = [];
	$.each(aResults, function (iIndex, sResult) {
		$this._onUploadResult(sResult);
	});

	$this.hide();
}

// storage_uploader.php answers with a call of onUploadCompleted: read the uploader and the errors from it instead of running it
BxMediaUploader.prototype._onUploadResult = function (sResult) {
	var m = /window\.parent\.(\w+)\.onUploadCompleted\('((?:[^'\\]|\\.)*)'\)/.exec(sResult || '');
	if (!m)
		return;
	var oUploader = window[m[1]];
	if (oUploader && typeof oUploader.onUploadCompleted === 'function')
		oUploader.onUploadCompleted(m[2].replace(/\\(.)/g, '$1'));
}

BxMediaUploader.prototype.hide = function () {
	var $this = this;

	$('.bx_media_list_item_container').removeClass('bx_media_list_item_container_selected');
	$('#' + this._sPopupContainerId).dolPopupHide();
}

BxMediaUploader.prototype.close = function () {
    var $this = this;
    if (this._isUploadsInProgress) {
        bx_confirm(_t('_sys_uploader_confirm_close_popup'), function() {
            $this.cancelAll();
            $this.hide();
        });
    } else {
        $this.hide();
    }
}

BxMediaUploader.prototype.beforeUpload = function (params) {

    this._eForm = params;
    this._loading(true, false);    
    this._isUploadsInProgress = true;
    this._lockPageFromLeaving();
    this._clearErrors();
}

BxMediaUploader.prototype.onUploadCompleted = function (sErrorMsg) {
    this._isUploadsInProgress = false;
    this._unlockPageFromLeaving();
    this._loading(false, true);

    if (sErrorMsg.length) {
        this.restoreGhosts();        
        this._showError(sErrorMsg);
    } else {        
        this.restoreGhosts();
        $('#' + this._sPopupContainerId).dolPopupHide({});
		this._oFilePondObject.removeFiles();
    }
}

BxMediaUploader.prototype.cancelAll = function () {
    $('#' + this._sIframeId).attr('src', 'javascript:false;');
    this.uploadCompleted(_t('_sys_uploader_upload_canceled'));
}

BxMediaUploader.prototype.restoreGhosts = function (bInitReordering, onComplete) {
    var sUrl = this._getUrlWithStandardParams() + '&img_trans=' + this._sImagesTranscoder + '&a=restore_ghosts&f=json' + '&c=' + this._iContentId + '&_t=' + (new Date());
    var $this = this;

    bInitReordering = bInitReordering !== undefined ? bInitReordering : this._isReordering;

    bx_loading(this._sResultContainerId, true);

    $.getJSON(sUrl, function (aData) {
        bx_loading($this._sResultContainerId, false);
   
        if (!$this.isMultiple())
            $('#' + $this._sResultContainerId + ' .bx-uploader-ghost').remove();

        if ('object' === typeof(aData)) {
            if('object' === typeof(aData.g) && 'object' === typeof(aData.o)) 
                for(var i in aData.o) {
                    var iFileId = aData.o[i];
                    $this.showGhost(iFileId, aData.g[iFileId]);
                }
            else
                $.each(aData, function(iFileId, oVars) {
                    $this.showGhost(iFileId, oVars);
                });

            $('#' + $this._sResultContainerId).bx_show_more_check_overflow();

            if(bInitReordering) {
                var sClassGhost = 'bx-uploader-ghost';
                $('#' + $this._sResultContainerId).find('.' + sClassGhost).each(function() {
                    if($(this).find('.bx-uploader-ghost-reorder').length == 0)
                        $(this).prepend($this._sTemplateReorder);
                });

                var fInitReordering = function() {
                    $('#' + $this._sResultContainerId).sortable({
                        items: '.bx-uploader-ghost', 
                        start: function(oEvent, oUi) {
                            oUi.item.addClass('bx-uploader-ghost-dragging');
                        },
                        stop: function(oEvent, oUi) {
                            oUi.item.removeClass('bx-uploader-ghost-dragging');

                            $this.reorderGhosts(oUi.item);
                        }
                    });
                };

                if($.sortable !== undefined)
                    fInitReordering();
                else
                    setTimeout(fInitReordering, 2000);
            }
        }

        if(typeof onComplete === 'function')
            return onComplete(aData);
    });
};

BxMediaUploader.prototype.reorderGhosts = function(oDraggable) {
    var sUrl = this._getUrlWithStandardParams() + '&a=reorder_ghosts&f=json' + '&c=' + this._iContentId + '&' + $('#' + this._sResultContainerId).sortable('serialize', {key: 'ghosts[]'}) + '&_t=' + escape(new Date());

    $.getJSON(sUrl, function (aData) {
        processJsonData(aData);
    });
};

BxMediaUploader.prototype.showGhost = function(iId, oVars) {
    var oFileContainer = $('#' + this._getFileContainerId(iId));
    if(oFileContainer.length > 0)
        return;

    var sHTML;
    if (typeof this._sTemplateGhost == 'object')
        sHTML = this._sTemplateGhost[iId];
    else
        sHTML = this._sTemplateGhost;

    for(var i in oVars)
        sHTML = sHTML.replace (new RegExp('{' + i + '}', 'g'), oVars[i]);

    $('#' + this._sResultContainerId).append(sHTML);

    oFileContainer.find('.bx-uploader-ghost-preview img').hide().fadeIn(1000);
};

BxMediaUploader.prototype.deleteGhost = function (iFileId) {
    var sUrl = this._getUrlWithStandardParams() + '&a=delete&id=' + iFileId;
    var $this = this;

    var sFileContainerId = $this._getFileContainerId(iFileId);
    bx_loading(sFileContainerId, true);

    $.post(sUrl, {_t: new Date()}, function (sMsg) {
        bx_loading(sFileContainerId, false);
        if ('ok' == sMsg) {
            $('#' + sFileContainerId).slideUp('slow', function () {
                $(this).remove();
            });
        } else {
            $('#' + this._sResultContainerId).prepend($this._sTemplateErrorGhosts.replace('{error}', sMsg));
        }        
    });
};

BxMediaUploader.prototype._clearErrors = function () {
    $('#' + this._sPopupContainerId + ' #' + this._sErrorsContainerId).html('');
    this._isErrorShown = false;
}

BxMediaUploader.prototype._showError = function (s, bAppend) {
    if (s == undefined || !s.length)
        return;
    if (!bAppend)
        $('#' + this._sPopupContainerId + ' #' + this._sErrorsContainerId).html(this._sTemplateError.replace('{error}', s));
    else
        $('#' + this._sPopupContainerId + ' #' + this._sErrorsContainerId).prepend(this._sTemplateError.replace('{error}', s));
    this._isErrorShown = true;
};

BxMediaUploader.prototype._getFileContainerId = function (iFileId) {
    return 'bx-uploader-file-' + this._sStorageObject + '-' + iFileId;
};

BxMediaUploader.prototype._getUrlWithStandardParams = function () {
    return sUrlRoot + 'storage_uploader.php?uo=' + this._sUploaderObject + '&so=' + this._sStorageObject + '&uid=' + this._sUniqId;
}

BxMediaUploader.prototype._lockPageFromLeaving = function () {
    $(window).bind('beforeunload', function (e) {
        var e = e || window.event;
        // for ie, ff
        e.returnValue = _t('_sys_uploader_confirm_leaving_page');
        // for webkit
        return _t('_sys_uploader_confirm_leaving_page');
    });
}

BxMediaUploader.prototype._unlockPageFromLeaving = function () {
    $(window).unbind('beforeunload');
}

BxMediaUploader.prototype._loading = function (bShowProgress, bShowForm) {

    var eForm = $('#' + this._sFormContainerId + ' .bx-uploader-files-list');
    var eBtn = $('#' + this._sFormContainerId + ' .bx-btn-primary');

    if (bShowForm) {
        if (null != this._eForm) {
            eForm.find('.bx-uploader-simple-file').filter(':not(:first)').remove();
            if ('undefined' !== typeof(this._eForm.reset)) 
                this._eForm.reset();
        }
        eForm.show();
        eBtn.show();
    } else {
        eForm.hide();
        eBtn.hide();
    }

    bx_loading($('#' + this._sFormContainerId + ' .bx-uploader-loading').get(0), bShowProgress);
}

BxMediaUploader.prototype.getMimeTypefromString  = function (ext) {
    
    var mimeTypes = 
    {
        
        '3gp'    : 'video/3gpp',
        '3g2'    : 'video/3gpp2',
        'a'      : 'application/octet-stream',
        'ai'     : 'application/postscript',
        'aif'    : 'audio/x-aiff',
        'aifc'   : 'audio/x-aiff',
        'aiff'   : 'audio/x-aiff',
        'asf'   : 'video/x-ms-asf',
        'au'     : 'audio/basic',
        'avi'    : 'video/avi',
        'bat'    : 'text/plain',
        'bin'    : 'application/octet-stream',
        'bmp'    : 'image/x-ms-bmp',
        'c'      : 'text/plain',
        'cdf'    : 'application/x-cdf',
        'csh'    : 'application/x-csh',
        'css'    : 'text/css',
        'divx'   : 'video/divx',
        'dll'    : 'application/octet-stream',
        'doc'    : 'application/msword',
        'dot'    : 'application/msword',
        'drc'    : 'video/drc',
        'dvi'    : 'application/x-dvi',
        'eml'    : 'message/rfc822',
        'eps'    : 'application/postscript',
        'etx'    : 'text/x-setext',
        'exe'    : 'application/octet-stream',
        'gif'    : 'image/gif',
        'gtar'   : 'application/x-gtar',
        'h'      : 'text/plain',
        'hdf'    : 'application/x-hdf',
        'htm'    : 'text/html',
        'html'   : 'text/html',
        'jpe'    : 'image/jpeg',
        'jpeg'   : 'image/jpeg',
        'jpg'    : 'image/jpeg',
        'js'     : 'application/x-javascript',
        'ksh'    : 'text/plain',
        'latex'  : 'application/x-latex',
        'm1v'    : 'video/mpeg',
        'man'    : 'application/x-troff-man',
        'me'     : 'application/x-troff-me',
        'mht'    : 'message/rfc822',
        'mhtml'  : 'message/rfc822',
        'mkv'    : 'video/x-matroska',
        'mif'    : 'application/x-mif',
        'mov'    : 'video/quicktime',
        'movie'  : 'video/x-sgi-movie',
        'mp2'    : 'audio/mpeg',
        'mp3'    : 'audio/mpeg',
        'mp4'    : 'video/mp4',  
        'm4v'    : 'video/mp4', 
        'mpa'    : 'video/mpeg',
        'mpe'    : 'video/mpeg',
        'mpeg'   : 'video/mpeg',
        'mpg'    : 'video/mpeg',
        'ms'     : 'application/x-troff-ms',
        'nc'     : 'application/x-netcdf',
        'nws'    : 'message/rfc822',
        'o'      : 'application/octet-stream',
        'obj'    : 'application/octet-stream',
        'oda'    : 'application/oda',
        'ogv'    : 'video/ogg',
        'ogg'    : 'video/ogg',
        'pbm'    : 'image/x-portable-bitmap',
        'pdf'    : 'application/pdf',
        'pfx'    : 'application/x-pkcs12',
        'pgm'    : 'image/x-portable-graymap',
        'png'    : 'image/png',
        'pnm'    : 'image/x-portable-anymap',
        'pot'    : 'application/vnd.ms-powerpoint',
        'ppa'    : 'application/vnd.ms-powerpoint',
        'ppm'    : 'image/x-portable-pixmap',
        'pps'    : 'application/vnd.ms-powerpoint',
        'ppt'    : 'application/vnd.ms-powerpoint',
        'pptx'   : 'application/vnd.ms-powerpoint',
        'ps'     : 'application/postscript',
        'pwz'    : 'application/vnd.ms-powerpoint',
        'py'     : 'text/x-python',
        'pyc'    : 'application/x-python-code',
        'pyo'    : 'application/x-python-code',
        'qt'     : 'video/quicktime',
        'ra'     : 'audio/x-pn-realaudio',
        'ram'    : 'application/x-pn-realaudio',
        'ras'    : 'image/x-cmu-raster',
        'rdf'    : 'application/xml',
        'rgb'    : 'image/x-rgb',
        'rm'     : 'application/vnd.rn-realmedia',
        'rmvb'   : 'application/vnd.rn-realmedia-vbr',
        'roff'   : 'application/x-troff',
        'rtx'    : 'text/richtext',
        'sgm'    : 'text/x-sgml',
        'sgml'   : 'text/x-sgml',
        'sh'     : 'application/x-sh',
        'shar'   : 'application/x-shar',
        'snd'    : 'audio/basic',
        'so'     : 'application/octet-stream',
        'src'    : 'application/x-wais-source',
        'swf'    : 'application/x-shockwave-flash',
        't'      : 'application/x-troff',
        'tar'    : 'application/x-tar',
        'tcl'    : 'application/x-tcl',
        'tex'    : 'application/x-tex',
        'texi'   : 'application/x-texinfo',
        'texinfo': 'application/x-texinfo',
        'tif'    : 'image/tiff',
        'tiff'   : 'image/tiff',
        'tr'     : 'application/x-troff',
        'tsv'    : 'text/tab-separated-values',
        'txt'    : 'text/plain',
        'ustar'  : 'application/x-ustar',
        'vcf'    : 'text/x-vcard',
        'wav'    : 'audio/wav',
        'webm'   : 'video/webm',
        'wmv'    : 'video/wmv',
        'wiz'    : 'application/msword',
        'wsdl'   : 'application/xml',
        'xbm'    : 'image/x-xbitmap',
        'xlb'    : 'application/vnd.ms-excel',
        'xls'    : 'application/vnd.ms-excel',
        'xlsx'    : 'application/vnd.ms-excel',
        'xml'    : 'text/xml',
        'xpdl'   : 'application/xml',
        'xpm'    : 'image/x-xpixmap',
        'xsl'    : 'application/xml',
        'xvid'   : 'video/xvid',
        'webp'   : 'image/webp',
        'xwd'    : 'image/x-xwindowdump',
        'svg'    : 'image/svg+xml',
        'zip'    : ['application/zip', 'application/x-zip-compressed']
       
    }
    return mimeTypes[ext.replace('.', '')];
}