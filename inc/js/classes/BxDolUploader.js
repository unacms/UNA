/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Simple Uploader js class
 */


function BxDolUploaderBase (sUploaderObject, sStorageObject, sUniqId, options) {

    this.init(sUploaderObject, sStorageObject, sUniqId, options);

    this._sIframeId = 'bx-form-input-files-' + sUniqId + '-iframe';
    this._eForm = null;
}

BxDolUploaderBase.prototype.init = function (sUploaderObject, sStorageObject, sUniqId, options) {
    this._isUploadsInProgress = false;

    this._sUploaderObject = sUploaderObject;
    this._sStorageObject = sStorageObject;

    this._sUniqId = sUniqId;

    this._sUploaderJsInstance = 'glUploader_' + sUniqId + '_' + this._sUploaderObject;
    this._sUploadInProgressContainerId = 'bx-form-input-files-' + sUniqId + '-upload-in-progress-' + this._sUploaderObject;
    this._sPopupContainerId = 'bx-form-input-files-' + sUniqId + '-popup-wrapper-' + this._sUploaderObject;

    this._sResultContainerId = 'bx-form-input-files-' + sUniqId + '-upload-result';
    this._sErrorsContainerId = 'bx-form-input-files-' + sUniqId + '-errors'; 
    this._sProgressContainerId = 'bx-form-input-files-' + sUniqId + '-progress'; 

    this._sFormContainerId = 'bx-form-input-files-' + sUniqId + '-form-cont';

    this._sTemplateGhost = options.template_ghost ? options.template_ghost : '<div id="' + this._getFileContainerId('{file_id}') + '"><input type="hidden" name="f[]" value="{file_id}" />{file_name} (<a href="javascript:void(0);" onclick="{js_instance_name}.deleteGhost(\'{file_id}\')">delete</a>)</div>';
    this._sTemplateReorder = options.template_reorder ? options.template_reorder : '<div class="bx-uploader-ghost-reorder bx-btn bx-btn-small"><i class="sys-icon bars"></i></div>';
    this._sTemplateError = options.template_error_msg ? options.template_error_msg : '<div>{error}</div>' ;
    this._sTemplateErrorGhosts = options.template_error_ghosts ? options.template_error_ghosts : this._sTemplateError;

    this._isMultiple = undefined == options.multiple || !options.multiple ? false : true;
    this._isLatest = undefined == options.latest || !options.latest ? false : true;
    this._isReordering = undefined == options.reordering || !options.reordering ? false : true;

    this._iContentId = undefined == options.content_id || '' == options.content_id ? '' : parseInt(options.content_id);

    this._sImagesTranscoder = options.images_transcoder ? options.images_transcoder : '';
    this._sUploadToken = options.upload_token ? options.upload_token : '';

    this._isPrivate = undefined == options.storage_private || parseInt(options.storage_private) ? 1 : 0;

    this._isErrorShown = false;

    this._onUploadBefore = typeof options.on_upload_before === 'function' ? options.on_upload_before : function () {};
    this._onUpload = typeof options.on_upload === 'function' ? options.on_upload : function () {};
    this._onRestoreGhosts = typeof options.on_restore_ghosts === 'function' ? options.on_restore_ghosts : function () {};
}

BxDolUploaderBase.prototype.isMultiple = function () {    
    return this._isMultiple;
}

BxDolUploaderBase.prototype.getCurrentFilesCount = function () {
    return $('#' + $this._sResultContainerId + ' .bx-uploader-ghost').length;
}

BxDolUploaderBase.prototype.showUploaderForm = function () {
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
                $this.onClickCancel();
            });
			$("#" + $this._sFormContainerId + " .bx-btn.bx-btn-primary:not(.bx-crop-upload)").hide();
            if ('undefined' !== typeof($this.onBeforeShowPopup))
                $this.onBeforeShowPopup();
        },
        onShow: function () {
            if ('undefined' !== typeof($this.onShowPopup))
                $this.onShowPopup();
        },
        closeElement: false,
        closeOnOuterClick: false
    });
}

BxDolUploaderBase.prototype.onClickCancel = function () {
	var $this = this;
    if (this._isUploadsInProgress) {
    	bx_confirm(_t('_sys_uploader_confirm_close_popup'), function() {
    		$this.cancelAll();
            $('#' + $this._sPopupContainerId).dolPopupHide({});
    	});
    } else {
        $('#' + this._sPopupContainerId).dolPopupHide();
    }
}

BxDolUploaderBase.prototype.onBeforeUpload = function (params) {

    this._eForm = params;

    this._loading(true, false);
        
    this._isUploadsInProgress = true;
    this._lockPageFromLeaving();
    this._clearErrors();

    if(typeof this._onUploadBefore === 'function')
        this._onUploadBefore(this);
}

BxDolUploaderBase.prototype.onProgress = function (params) {

}

BxDolUploaderBase.prototype.onUploadCompleted = function (sErrorMsg) {

    this._isUploadsInProgress = false;
    this._unlockPageFromLeaving();
    this._loading(false, true);

    if (sErrorMsg.length) {
        this.restoreGhosts();
        this._showError(sErrorMsg);
    } else {
        this.restoreGhosts();
        $('#' + this._sPopupContainerId).dolPopupHide({});

        if(typeof this._onUpload === 'function')
            this._onUpload(this, this._iContentId);
    }
}

BxDolUploaderBase.prototype.cancelAll = function () {
    $('#' + this._sIframeId).attr('src', 'javascript:false;');
    this.onUploadCompleted(_t('_sys_uploader_upload_canceled'));
}

/**
 * Uploaders on one page restore their ghosts (files uploaded but not saved yet) with one
 * request: calls made in the same tick are queued and sent together, see storage_uploader.php.
 */
BxDolUploaderBase._aGhostsQueue = [];

BxDolUploaderBase.prototype.restoreGhosts = function (bInitReordering, onComplete) {
    var $this = this;

    bInitReordering = bInitReordering !== undefined ? bInitReordering : this._isReordering;

    var aQueue = BxDolUploaderBase._aGhostsQueue;
    aQueue.push({
        uploader: this,
        callback: function (aData) {
            $this._showRestoredGhosts(aData, bInitReordering, onComplete);
        }
    });

    if (aQueue.length == 1)
        setTimeout(BxDolUploaderBase._restoreGhostsQueued, 0);
};

/** Max number of uploaders in one restore_ghosts_batch request, see BxDolUploader::GHOSTS_BATCH_MAX. */
BxDolUploaderBase._iGhostsBatchMax = 20;

BxDolUploaderBase._restoreGhostsQueued = function () {
    var aQueue = BxDolUploaderBase._aGhostsQueue.splice(0);

    if (aQueue.length == 1) {
        var oUploader = aQueue[0].uploader;
        $.getJSON(oUploader._getUrlWithStandardParams() + '&' + $.param(oUploader._getRestoreGhostsParams()) + '&a=restore_ghosts&f=json&_t=' + Date.now(), aQueue[0].callback);
        return;
    }

    for (var i = 0; i < aQueue.length; i += BxDolUploaderBase._iGhostsBatchMax)
        BxDolUploaderBase._restoreGhostsBatch(aQueue.slice(i, i + BxDolUploaderBase._iGhostsBatchMax));
};

BxDolUploaderBase._restoreGhostsBatch = function (aBatch) {
    $.post(sUrlRoot + 'storage_uploader.php?a=restore_ghosts_batch&f=json', {
        items: $.map(aBatch, function (oItem) {
            return $.extend({
                uo: oItem.uploader._sUploaderObject,
                so: oItem.uploader._sStorageObject,
                uid: oItem.uploader._sUniqId
            }, oItem.uploader._getRestoreGhostsParams());
        })
    }, function (aData) {
        $.each(aBatch, function (i, oItem) {
            oItem.callback(aData?.[i] ?? []);
        });
    }, 'json');
};

BxDolUploaderBase.prototype._getRestoreGhostsParams = function () {
    return {
        img_trans: String(this._sImagesTranscoder),
        c: String(this._iContentId),
        m: this._isMultiple ? 1 : 0,
        l: this._isLatest ? 1 : 0
    };
};

BxDolUploaderBase.prototype._showRestoredGhosts = function (aData, bInitReordering, onComplete) {
    var $this = this;

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

        $('#' + $this._sResultContainerId).bx_show_more_check_overflow().bxProcessHtml();

        if(bInitReordering) {
            var sClassGhost = 'bx-uploader-ghost';
            $('#' + $this._sResultContainerId).find('.' + sClassGhost).each(function() {
                if($(this).find('.bx-uploader-ghost-reorder').length == 0)
                    $(this).find('.bx-base-general-uploader-ghost').prepend($this._sTemplateReorder);
            });

            var fInitReordering = function() {                    
                $('#' + $this._sResultContainerId).sortable({
                    items: '.' + sClassGhost, 
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
        onComplete(aData);

    if(typeof $this._onRestoreGhosts === 'function')
        $this._onRestoreGhosts($this, aData);
};

BxDolUploaderBase.prototype.reorderGhosts = function(oDraggable) {
    var sUrl = this._getUrlWithStandardParams() + '&a=reorder_ghosts&f=json' + '&c=' + this._iContentId + '&' + $('#' + this._sResultContainerId).sortable('serialize', {key: 'ghosts[]'}) + '&_t=' + escape(new Date());

    $.getJSON(sUrl, function (aData) {
        processJsonData(aData);
    });
};

BxDolUploaderBase.prototype.showGhost = function(iId, oVars) {
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
    
    $('#' + this._sResultContainerId).append(sHTML).trigger( "contentchange" );

    oFileContainer.find('.bx-uploader-ghost-preview img').hide().fadeIn(1000);
};

BxDolUploaderBase.prototype.deleteGhost = function (iFileId, onComplete) {
    var sUrl = this._getUrlWithStandardParams() + '&a=delete&id=' + iFileId;
    var $this = this;

    var sFileContainerId = $this._getFileContainerId(iFileId);
    bx_loading(sFileContainerId, true);

    $.post(sUrl, {_t: escape(new Date())}, function (sMsg) {
        var fOnComplete = function(sMsg) {
            if(typeof onComplete === 'function')
                onComplete(sMsg);
        };

        bx_loading(sFileContainerId, false);

        if ('ok' == sMsg) {
            $('#' + sFileContainerId).slideUp('slow', function () {
                $(this).remove();

                fOnComplete(sMsg);
            });
        } else {
            $('#' + this._sResultContainerId).prepend($this._sTemplateErrorGhosts.replace('{error}', sMsg));

            fOnComplete(sMsg);
        }
    });
};

BxDolUploaderBase.prototype._clearErrors = function () {
    $(' #' + this._sErrorsContainerId).html('');
    this._isErrorShown = false;
}

BxDolUploaderBase.prototype._showError = function (s, bAppend) {
    if (s == undefined || !s.length)
        return;

    var eCont = $('#' + this._sPopupContainerId).find('[id=' + this._sErrorsContainerId + ']').size() ? $('#' + this._sPopupContainerId).find('[id=' + this._sErrorsContainerId + ']') : $('#' + this._sErrorsContainerId);

    if (!bAppend)
        eCont.html(this._sTemplateError.replace('{error}', s));
    else
        eCont.prepend(this._sTemplateError.replace('{error}', s));

    this._isErrorShown = true;
};

BxDolUploaderBase.prototype._getFileContainerId = function (iFileId) {
	return 'bx-uploader-file-' + this._sStorageObject + '-' + iFileId;
};

BxDolUploaderBase.prototype._getUrlWithStandardParams = function () {
    return sUrlRoot + 'storage_uploader.php?uo=' + this._sUploaderObject + '&so=' + this._sStorageObject + '&uid=' + this._sUniqId;
}

BxDolUploaderBase.prototype._lockPageFromLeaving = function () {
    $(window).bind('beforeunload', function (e) {
        var e = e || window.event;
        // for ie, ff
        e.returnValue = _t('_sys_uploader_confirm_leaving_page');
        // for webkit
        return _t('_sys_uploader_confirm_leaving_page');
    });
}

BxDolUploaderBase.prototype._unlockPageFromLeaving = function () {
    $(window).unbind('beforeunload');
}

BxDolUploaderBase.prototype._loading = function (bShowProgress, bShowForm) {

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

BxDolUploaderBase.prototype.getMimeTypefromString  = function (ext) {
    
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
        'avi'    : 'video/x-msvideo',
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
        'm4a'    : ['audio/mp4', 'audio/x-m4a'],
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
        'wav'    : 'audio/x-wav',
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

/**
 * HTML5 Uploader js class
 */
function BxDolUploaderHTML5 (sUploaderObject, sStorageObject, sUniqId, options) {

    this.init(sUploaderObject, sStorageObject, sUniqId, options);

    this._sIframeId = 'bx-form-input-files-' + sUniqId + '-iframe';
    this._eForm = null;    
    this._sDivId = 'bx-form-input-files-' + sUniqId + '-div-' + this._sUploaderObject;
    this._sFocusDivId = 'bx-form-input-files-' + sUniqId + '-focus-' + this._sUploaderObject;
    this._uploader = null;
    this._aFiles = [];
  

    this.initUploader = function (o) {

        var $this = this;

        if (null != this._uploader)
            this._uploader = null;

        var $this = this;
        var _options = {
            allowProcess: false,
            allowPaste: false,
            allowRevert: false,
            allowRemove: false,
            imagePreviewHeight: 100,
            credits: {},
            allowMultiple: $this._isMultiple ? true : false,
            maxFiles: $this.isMultiple() ? 50 : 1,
            maxFileSize: o.maxFilesize > 2 ? Math.round(o.maxFilesize) + 'MB' : Math.round(o.maxFilesize*1024) + 'KB',
            instantUpload: true,
            onaddfile: (error, file) => { 
                if (error){
                    $this._uploader.removeFile(file);
                    if($this._uploader.status != 3)
                        $this.onUploadCompleted(''); 
                }
                else{
                    $this.onBeforeUpload(''); 
                }
            },
            onerror: (error) => { 
                if (error.main)
                    $this._showError(error.main + '. ' + error.sub);
            },
            onprocessfiles: (files) => { 
                $this.onUploadCompleted(''); 
                oProgress.hide();
                $this._aFiles = [];
            },
            onprocessfileprogress(file, progress) {
                $this._aFiles[file.source.lastModified+'-'+file.source.size+'-'+file.source.name] = progress * file.source.size;
                iTotal = 0;
                iUploaded = 0; 
                for (const propertyName in $this._aFiles) {
                    iUploaded += $this._aFiles[propertyName];
                }
                
                for (i = 0; i < $this._uploader.getFiles().length; i++){
                    iTotal += $this._uploader.getFiles()[i].source.size;
                }
            
                iProgress = iUploaded / iTotal * 100;
            
                oProgress =  $('#' + $this._sProgressContainerId);
                
                if (oProgress.parents('.bx-db-container').find('.uploader_progress').length > 0){
                    oProgress = oProgress.parents('.bx-db-container').find('.uploader_progress');
                }
                
                oProgress.show();
                oProgress.find('.progress_line').css('width', iProgress + '%');
            },
            server: {
				process: (fieldName, file, metadata, load, error, progress, abort) => {
					const formData = new FormData();
					formData.append('file', file, file.name);
					formData.append('uo', this._sUploaderObject);
					formData.append('so', this._sStorageObject);
					formData.append('uid', this._sUniqId);
					formData.append('m', this._isMultiple ? 1 : 0);
					formData.append('c', this._iContentId);
					formData.append('p', this._isPrivate);
					formData.append('a', 'upload');
					if (this._sUploadToken)
					    formData.append('ut', this._sUploadToken);

					const request = new XMLHttpRequest();
					request.open('POST', sUrlRoot + 'storage_uploader.php');

					request.upload.onprogress = (e) => {
						progress(e.lengthComputable, e.loaded, e.total);
					};

					request.onload = function(res) {
						if (request.status >= 200 && request.status < 300) {
							var o = null;
                            try {
                                o = JSON.parse(request.responseText);
                            } 
                            catch (e) {}
                            if (o && 'undefined' !== typeof(o.error)) {
                                $this._showError(o.error, true);
                            }
                            
                            load(request.responseText);
						}
						else {
							error('error');
						}
					};
					request.send(formData);
				}
			},
        };
        
        aAcceptableFiles = [];
        if (o.acceptedFiles && o.acceptedFiles != ''){
            a = o.acceptedFiles.trim().split(/\s*,\s*/);
            a.forEach(function(item, i, arr) {
                if ($this.getMimeTypefromString(item)){
                    oT = $this.getMimeTypefromString(item);
                    if (Array.isArray(oT)){
                        oT.forEach(function(oTs, j, ar) {
                            aAcceptableFiles.push(oTs);
                        });
                    }
                    else{
                        aAcceptableFiles.push(oT);
                    }
                }
                    
            });
        }
        
        if (aAcceptableFiles.length){
            _options.acceptedFileTypes = aAcceptableFiles;
        }
        
      
        
        if (o.resizeWidth || o.resizeHeight){
            _options.allowImageResize = true;
            _options.imageResizeTargetWidth = o.resizeWidth;
            _options.imageResizeTargetHeight = o.resizeHeight;
            _options.imageResizeMode = o.resizeMethod;
        }
        else{
            _options.allowImageResize = false;
            _options.allowImageTransform = false;
        }
        
        FilePond.registerPlugin(
            FilePondPluginImagePreview,
            FilePondPluginFileValidateType,
            FilePondPluginFileValidateSize,
            FilePondPluginImageTransform,
            FilePondPluginImageCrop,
            FilePondPluginImageResize,
            
        );

        this._uploader = FilePond.create(
            document.querySelector('#' + this._sDivId),
            $.extend({}, _options, o)
        );

        if (typeof(glFilepondLocale) !== 'undefined');
            this._uploader.setOptions(glFilepondLocale);

        // need to be activated if catch paste needed
        //this.initPasteEditor();
    }

    this.onUploadCompleted = function (sErrorMsg) {        
        if (sErrorMsg.length)
            this._showError(sErrorMsg);        
        
        var $this = this;
        if($this._uploader.status != 3) {
            this._isUploadsInProgress = false;
            this.restoreGhosts();
            if(!this._isErrorShown) {
                $('#' + this._sPopupContainerId).dolPopupHide({});
                this.removeFiles();
            }

            if(typeof this._onUpload === 'function')
                this._onUpload(this, this._iContentId);
        }
    }

    this.removeFiles = function () {
        oFiles = this._uploader.getFiles();
        for (i = 0; i < oFiles.length; i++){
            this._uploader.removeFile(i);
        }
    }

    this.cancelAll = function () {
        this.removeFiles();
    }

    this.onBeforeUpload = function (params) {
        this._isUploadsInProgress = true;
        this._clearErrors();

        if(typeof this._onUploadBefore === 'function')
            this._onUploadBefore(this);
    }

    this.onProgress = function (params) {
    }

    this.onClickCancel = function () {
        var $this = this;
        if (this._isUploadsInProgress) {
            bx_confirm(_t('_sys_uploader_confirm_close_popup'), function() {
                $this.removeFiles();
                $this.cancelAll();
                $('#' + $this._sPopupContainerId).dolPopupHide({});
            });
        } else {
            $this.removeFiles();
            $('#' + this._sPopupContainerId).dolPopupHide();
        }
        
        BxDolUploaderBase.prototype._clearErrors.call(this);
    }

    this.onShowPopup = function () {
        var $this = this;
        setTimeout(function () {
            $this.focusPasteEditor();
        }, 200);
    }

    this.focusPasteEditor = function () {
        $('#' + this._sFocusDivId).focus();
    }

    this.initPasteEditor = function () {
        var $this = this;
        $('#' + this._sFocusDivId).on('paste', function (e) {
            var aFiles = [];
            if (e.type == 'paste') {
                var aItems = (e.clipboardData || e.originalEvent.clipboardData).items;
                
                for (var i in aItems) {
                    var oItem = aItems[i];
                    if (oItem.kind === 'file')
                        aFiles.push(oItem.getAsFile());
                }
                $this._uploader.addFiles(aFiles);
            }
        });
    }
    
    this.showUploaderForm = function() {
        this._uploader.browse();
    }
    
    this.initUploader({
        'maxFilesize': options.maxFilesize,
        'acceptedFiles': options.acceptedFiles,
        'resizeWidth': options.resizeWidth,
        'resizeHeight': options.resizeHeight,
        'resizeMethod': options.resizeMethod,
        'dictDefaultMessage': options.dictDefaultMessage,
        'dictFileTooBig': options.dictFileTooBig,
        'dictMaxFilesExceeded': options.dictMaxFilesExceeded,
        'dictInvalidFileType': options.dictInvalidFileType,
    });
}

BxDolUploaderHTML5.prototype = BxDolUploaderBase.prototype;

function BxDolUploaderSimple(sUploaderObject, sStorageObject, sUniqId, options)
{
    BxDolUploaderHTML5.call(this, sUploaderObject, sStorageObject, sUniqId, options);
}

BxDolUploaderSimple.prototype = Object.create(BxDolUploaderHTML5.prototype);
BxDolUploaderSimple.prototype.constructor = BxDolUploaderSimple;

/**
 * Crop Image Uploader js class
 */
function BxDolUploaderCrop (sUploaderObject, sStorageObject, sUniqId, options) {

    this.init(sUploaderObject, sStorageObject, sUniqId, options);

    this._eForm = null;

    this.initUploader = function (oOptions) {

        var $this = this;

        var aExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        var eCroppie = $("#" + this._sFormContainerId + " .bx-croppie-element").croppie(oOptions);

		$("#" + this._sFormContainerId + ' .bx-crop-rotate').on('click', function(ev) {
			eCroppie.croppie('rotate', parseInt($(this).data('deg')));
		});
        
        $("#" + this._sFormContainerId + " input[name=f]").on("change", function() {
            var input = this;            

            if (input.files && input.files[0]) {

                var m = input.files[0].name.match(/\.([A-Za-z0-9]+)$/);

                if (2 != m.length || -1 == aExt.indexOf(m[1].toLowerCase())) {                    
                    $(input).replaceWith($(input).val('').clone(true));
                    $this._showError(_t('_sys_uploader_crop_wrong_ext'));
                    return;
                }

                $this._clearErrors();

                var reader = new FileReader()

                reader.onload = function(e) {
                    eCroppie.croppie('bind', {
                        url: e.target.result
                    });
                    $("#" + $this._sFormContainerId + " .bx-croppie-element").addClass('ready');
                    $("#" + $this._sFormContainerId + " .bx-crop-action").removeClass('bx-btn-disabled');
                    $("#" + $this._sFormContainerId + " .bx-croppie-element").data('bx-filename', input.files[0].name.replace(/(\.[A-Za-z0-9]+)$/, '.jpg'));
                }
                reader.readAsDataURL(input.files[0]);
            }
        });

        $("#" + this._sFormContainerId + " .bx-crop-upload").on('click', function(ev) {
            eCroppie.croppie('result', {
                type: 'canvas',
                size: 'original',
                format: 'jpeg',
                quality: '0.85',
            }).then(function(resp) {
                var fd = new FormData();

                fd.append("f", dataURItoBlob(resp), $("#" + $this._sFormContainerId + " .bx-croppie-element").data('bx-filename'));
                $.each(oOptions.bx_form, function (sName) {
                    fd.append(sName, this);
                });
                if ($this._sUploadToken)
                    fd.append('ut', $this._sUploadToken);
                
                $this.onBeforeUpload(fd);

                $.ajax({
                    url: sUrlRoot + 'storage_uploader.php',
                    type: "POST",
                    processData: false,
                    contentType: false,
                    data: fd,
                    success: function(data) {
                        eval(data);
                    },
                    error: function() {
                        $this._showError(_t('_sys_uploader_crop_err_upload'));
                    }
                })

            });
        });

        function dataURItoBlob(dataURI) {
            var split = dataURI.split(','),
                dataTYPE = split[0].match(/:(.*?);/)[1],
                binary = atob(split[1]),
                array = [];
                
            for (var i = 0; i < binary.length; i++) 
                array.push(binary.charCodeAt(i));

            return new Blob([new Uint8Array(array)], {
                type: dataTYPE
            });
        }

        
    };
}

BxDolUploaderCrop.prototype = BxDolUploaderBase.prototype;


/**
 * Record Video Uploader js class
 */
function BxDolUploaderRecordVideo (sUploaderObject, sStorageObject, sUniqId, options) {
    this._camera = null;
    this._blob = null;
    this._recorder = null;
    this._camera_type = 'user';

    this._audio_bitrate = undefined !== options.audio_bitrate ? parseInt(options.audio_bitrate) : 128000;
    this._video_bitrate = undefined !== options.video_bitrate ? parseInt(options.video_bitrate) : 1000000;

    this.init(sUploaderObject, sStorageObject, sUniqId, options);

    this.showUploaderForm = function() {
        if (typeof MediaRecorder == 'undefined' || !('requestData' in MediaRecorder.prototype)) {
            bx_alert(_t('_sys_uploader_unsupported_browser'));
            return;
        }

        BxDolUploaderBase.prototype.showUploaderForm.call(this);
    }

    this.onBeforeShowPopup = function() {
        this._blob = null;
        this._camera = null;
        this._recorder = null
        this._clearErrors();

        $('#bx-upoloader-recording-preview').hide();
        $('#bx-upoloader-camera-capture').show();

        $('#' + this._sFormContainerId + ' .bx-uploader-record-video-controls').hide();
    }

    this.switchCamera = function () {
        this._camera_type = this._camera_type == 'user' ? 'environment' : 'user';

        this.releaseCamera();
        this.onShowPopup();
    }

    this.onShowPopup = function () {
        var $this = this;
        try {
            navigator.mediaDevices.getUserMedia({ audio: true, video: {facingMode: this._camera_type} }).then(function(camera) {
                $this._camera = camera;
                $this.showCameraCapture();

                $('#' + $this._sFormContainerId + ' .bx-uploader-recording-start').show();
                $('#' + $this._sFormContainerId + ' .bx-uploader-recording-stop').hide();
                $('#' + $this._sFormContainerId + ' .bx-uploader-record-video-controls').show();

                navigator.mediaDevices.enumerateDevices().then(function(mediaDevices){
                    let constraints = navigator.mediaDevices.getSupportedConstraints();
                    if ($this.getDevicesNum(mediaDevices) > 1 && typeof constraints.facingMode != 'undefined' && constraints.facingMode) {
                        $('#' + $this._sFormContainerId + ' .bx-record-camera-switch').show();
                    } else {
                        $('#' + $this._sFormContainerId + ' .bx-record-camera-switch').hide();
                    }
                });

            })
        } catch (err) {
            $this._showError(_t('_sys_uploader_camera_capture_failed'));
        }
    }

    this.onClickCancel = function () {
        this.releaseCamera();

        BxDolUploaderBase.prototype.onClickCancel.call(this);
    }

    this.startRecording = function() {
        this._recorder = RecordRTC(this._camera, {
            type: 'video',
            audioBitsPerSecond: this._audio_bitrate,
            videoBitsPerSecond: this._video_bitrate,
            disableLogs: true
        });

        if (!this._recorder) {
            this._showError(_t('_sys_uploader_unsupported_browser'));
            return;
        }

        $("#" + this._sFormContainerId + " .bx-btn.bx-btn-primary:not(.bx-crop-upload)").hide();
        $('#' + this._sFormContainerId + ' .bx-uploader-recording-start').hide();
        $('#' + this._sFormContainerId + ' .bx-uploader-recording-stop').show();

        this._recorder.startRecording();

        this.showCameraCapture();
    }

    this.stopRecording = function(bSubmitWhenReady) {
        $('#' + this._sFormContainerId + ' .bx-uploader-recording-start').show();
        $('#' + this._sFormContainerId + ' .bx-uploader-recording-stop').hide();

        var $this = this;
        this._recorder.stopRecording(function(){
            $this._blob = $this._recorder.getBlob();
            $this.showRecordingPreview();

            $this._recorder.destroy();
            $this._recorder = null;

            $("#" + $this._sFormContainerId + " .bx-btn.bx-btn-primary:not(.bx-crop-upload)").show();
            if (bSubmitWhenReady)
                $this.submitRecording($('#' + $this._sFormContainerId + ' form').get(0));
        });
    }

    this.showCameraCapture = function() {
        var video = $('#bx-upoloader-recording-preview').hide().get(0);
        if (video.pause !== 'undefined') video.pause();
        video.removeAttribute('src');

        video = $('#bx-upoloader-camera-capture').show().get(0);
        video.srcObject = this._camera;
        video.muted = true;
        video.volume = 0;
        $('#' + this._sFormContainerId + ' .bx-record-video-preview .bx-record-video-preview-filesize').html('');
    }

    this.showRecordingPreview = function() {
        $('#bx-upoloader-camera-capture').hide();
        $('#bx-upoloader-recording-preview').show().get(0).src = URL.createObjectURL(this._blob);

        var mbytes = (this._blob.size/1024/1024).toFixed(2);
        $('#' + this._sFormContainerId + ' .bx-record-video-preview .bx-record-video-preview-filesize').html(mbytes + ' ' + _t('_sys_uploader_record_video_mb'));
    }

    this.submitRecording = function(form) {
        if (this._recorder) {
            this.stopRecording(true);
            return;
        }

        this.onBeforeUpload(form);

        var data = new FormData(form);
        if (this._blob != null) data.append("f[]", this._blob, new Date().toISOString() + '.webm');
        if (this._sUploadToken)
            data.append('ut', this._sUploadToken);

        var $this = this;
        $.ajax({
            url: $(form).attr('action'),
            type: "POST",
            data: data,
            processData: false,
            contentType: false,
            success:function(sErrorMsg, textStatus, jqXHR) {
                $this.onUploadCompleted(sErrorMsg);
                if (!sErrorMsg.length) {
                    $this.releaseCamera();
                }
            },
        });
    }

    this.releaseCamera = function() {
        //stop playing recorded file
        var video = $('#bx-upoloader-recording-preview').get(0);
        if (video.pause != 'undefined') video.pause();
        video.removeAttribute('src');

        if (this._recorder) {
            this._recorder.destroy();
            this._recorder = null;
        }

        if (this._camera) {
            if (typeof this._camera.stop != 'undefined') this._camera.stop();
            this._camera.getTracks().forEach(function (track) {
                if (track.readyState == 'live') {
                    track.stop();
                }
            });
        }
    }

    this.getDevicesNum = function(mediaDevices) {
        let count = 0;
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') count++;
        });
        return count;
    }
}

BxDolUploaderRecordVideo.prototype = BxDolUploaderBase.prototype;


function BxDolImageTweak (unique_id, action_url, content_id, field, js_object, allow_tweak) {
    var $this = this;
    this._sUniqueId = unique_id;
    this._sActionUrl = action_url;
    this._sContentId = content_id;
    this._sField = field;
    this._sJsObject = js_object;
    this._bAllowTweak = allow_tweak;
    this._oContainerButtons = $('.bx-image-edit-buttons-' + unique_id);
    this._oContainerButtons.removeClass('hidden');
    $("#bx-form-input-files-" + this._sUniqueId + "-upload-result").bind( "contentchange", function(){ 
        $this.uploadComplete($(this));
    });
    
    if (this._bAllowTweak){
        this._oContainerButtons.find('.bx-image-edit-buttons-edit').removeClass('hidden');
    }
}

BxDolImageTweak.prototype.showUploaderForm = function(){
    var $this = this;
    $('#bx-form-input-files-' + $this._sUniqueId + '-upload-result').html('');
    eval($this._sJsObject + '.showUploaderForm()');
}
    
BxDolImageTweak.prototype.uploadComplete = function(obj){
    var $this = this;
    var sUrl = $this._sActionUrl + "updateImage/" + $this._sField + "/" + $this._sContentId + "/" + obj.html() + "/"; 
    
    $this._oContainerButtons.removeClass('bx-image-edit-buttons-no-image');
    $.post(sUrl, function (aData) {
        var sSelImage = ".bx-image-edit-source-" + $this._sUniqueId;
        var sSelPlaceholder = ".bx-image-edit-placeholder-" + $this._sUniqueId;

        if ($this._bAllowTweak){
            $(sSelImage).css("background-image", "url(" + aData + ")").css('background-position', '').show();

            if($(sSelPlaceholder).length > 0)
                $(sSelPlaceholder).hide();
            else
                $(sSelImage).parents('.bx-base-pofile-cover-image.bx-bpci-holder').removeClass('bx-bpci-holder h-32 lg:h-32').addClass('h-64 lg:h-80')
        }
        else{
            $(sSelImage).attr("src", aData).show();

            if($(sSelPlaceholder).length > 0)
                $(sSelPlaceholder).hide();
            else
                $(sSelImage).parents('.bx-base-pofile-cover-thumb').find('p.bx-base-pofile-unit-thumb').hide();
        }
    });
}

BxDolImageTweak.prototype.changePosition = function (){
    var $this = this;
    $(".bx-image-edit-source-" + $this._sUniqueId).parent().append("<div class='bx-image-edit-move-info'><i class='sys-icon sys-colored arrows-alt '></i>" + _t('_sys_uploader_image_reposition_info') + "</div>");
    $(".bx-image-edit-source-" + $this._sUniqueId).addClass('bx-image-edit-move').bind('dragover', function(e){
        $(".bx-image-edit-source-" + $this._sUniqueId).parent().find('.bx-image-edit-move-info').remove();
        $(".bx-image-edit-source-" + $this._sUniqueId).css('background-position', " 0px " + e.offsetY / $(e.currentTarget).height() * 100 + '%');
    });
    if (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0)) {
        $('body').css('overflow', 'hidden')
        $(".bx-image-edit-source-" + $this._sUniqueId).bind('touchmove', function(e){
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            $(".bx-image-edit-source-" + $this._sUniqueId).parent().find('.bx-image-edit-move-info').remove();
            $(".bx-image-edit-source-" + $this._sUniqueId).css('background-position', " 0px " + touch.pageY / $(e.currentTarget).height() * 100 + '%');
        });
    }
    with ($this._oContainerButtons) {
        find('.bx-image-edit-buttons-cancel').removeClass('hidden');
        find('.bx-image-edit-buttons-save').removeClass('hidden');
        find('.bx-image-edit-buttons-edit').addClass('hidden');
        find('.bx-image-edit-buttons-upload').addClass('hidden');
    }
}

BxDolImageTweak.prototype.cancelPosition = function (){
    var $this = this;
    $('body').css('overflow', '')
    $(".bx-image-edit-source-" + $this._sUniqueId).parent().find('.bx-image-edit-move-info').remove();
    $(".bx-image-edit-source-" + $this._sUniqueId).addClass('bx-image-edit-move').unbind('dragover').unbind('touchmove'); 
    
    with ($this._oContainerButtons) {
        find('.bx-image-edit-buttons-cancel').addClass('hidden');
        find('.bx-image-edit-buttons-save').addClass('hidden');
        find('.bx-image-edit-buttons-edit').removeClass('hidden');
        find('.bx-image-edit-buttons-upload').removeClass('hidden');
    }
}
    
BxDolImageTweak.prototype.savePosition = function (){
    var $this = this;
    $('body').css('overflow', '')
    $(".bx-image-edit-source-" + $this._sUniqueId).parent().find('.bx-image-edit-move-info').remove();
    $(".bx-image-edit-source-" + $this._sUniqueId).addClass('bx-image-edit-move').unbind('dragover').unbind('touchmove'); 
    $(".bx-image-edit-source-" + $this._sUniqueId).removeClass('bx-image-edit-move')
    
    aPos = $(".bx-image-edit-source-" + $this._sUniqueId).css('background-position').split(' ');
    $.post($this._sActionUrl + 'updateImagePosition/' + $this._sContentId + '/' + $this._sField + '/' + aPos[0].replace('%','').replace('px','') + '/' + aPos[1].replace('%','').replace('px','') + '/', function () {
        with ($this._oContainerButtons) {
            find('.bx-image-edit-buttons-cancel').addClass('hidden');
            find('.bx-image-edit-buttons-save').addClass('hidden');
            find('.bx-image-edit-buttons-edit').removeClass('hidden');
            find('.bx-image-edit-buttons-upload').removeClass('hidden');
        }
    });
}

/** @} */
