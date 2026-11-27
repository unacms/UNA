/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MediaManager MediaManager
 * @ingroup     UnaModules
 */

/**
 * Media Changer js class
 */

function BxMediaChanger(oOptions) {
	this._sActionUrl = oOptions.sActionUrl;
	this._iContentId = oOptions.iContentId;
	this._sFieldName = oOptions.sFieldName;
	this._sModule = oOptions.sModule;
	this._sObjName = oOptions.sObjName;
	this._sStorage = oOptions.sStorage;
	this._sUploader = oOptions.sUploader;
	this._sTranscoder = oOptions.sTranscoder;
	this._sSelector = '.' + oOptions.sSelector;
	this._bIsBackground = oOptions.bIsBackground;
	this._sImageUrl = oOptions.sImageUrl;
	this._sUniqId = oOptions.sUniqId;
	this._sUploadToken = oOptions.sUploadToken ? oOptions.sUploadToken : '';
	this._sImageType = oOptions.sImageType;
	this._sButtons = oOptions.sButtons;
	
	this._bIsInline = (this._sImageType == 'cover' ? true : false);
	this._bIsCaption = (this._sImageType == 'avatar' ? false : true);
	this._aCaptions = oOptions.aCaptions;
    var $this = this;
	$(document).ready(function () {
        window[$this._sObjName].init(); 
    });
}

BxMediaChanger.prototype.init = function () {
	var $this = this;
	$($this._sSelector).each(function () {
		var $frame = $(this);
		$frame.find('.bx-media-editable-cnt').remove();

		// the buttons come rendered from media_changer_buttons.html
		var $cnt = $($this._sButtons);
		$cnt.insertAfter($frame.find('>:first-child'));

		var bImage = $this._sImageUrl != '';
		$cnt.find('.bx-media-editable-btn-edit').toggle(bImage);
		$cnt.find('.bx-media-editable-btn-tweak').toggle(bImage && $this._bIsInline);

		$cnt.on('click', function (oEvent) {
			oEvent.stopPropagation();
		});
		$cnt.find('.bx-media-editable-file').on('change', function () {
			var oFile = this.files[0];
			if (oFile)
				$this.uploadFile(oFile);
			$(this).val('');
		});
		$cnt.find('.bx-media-editable-btn-edit').on('click', function () {
			$this.addEditor('open');
		});
		$cnt.find('.bx-media-editable-btn-tweak').on('click', function () {
			$this.addEditor('inline');
		});

		$cnt.addClass($this._bIsCaption ? 'bx-media-editable-cnt-top' : 'bx-media-editable-cnt-center');
	});

	// icons of markup added after the page loaded
	if (typeof window.bx_iconset_init_lucide === 'function')
		window.bx_iconset_init_lucide();
}

// 'open' edits the image with every tool, 'inline' only moves the crop of a cover in its frame
BxMediaChanger.prototype.addEditor = function (sMode) {
	var $this = this;
	var oOptions = {src: $this._sImageUrl};

	if (sMode == 'inline') {
		var eFrame = $($this._sSelector).get(0);
		if (eFrame && eFrame.offsetWidth && eFrame.offsetHeight)
			oOptions.aspectRatio = eFrame.offsetWidth / eFrame.offsetHeight;
		oOptions.tools = ['crop'];
	}

	BxMediaEditor.open(oOptions).then(function (oFile) {
		if (oFile)
			$this.uploadFile(oFile);
	});
}

BxMediaChanger.prototype.uploadFile = function (oFile) {

    var $this = this;
    var $src = $($this._sSelector).find('.bx-media-editable-src');
    
	if (oFile.type.indexOf('image') == -1){
        $src.parent().addClass('bx-media-editable-src-updating');
        $src.parent().attr('data-content', $this._aCaptions['allowed_files']);
        var oAnim = setInterval(function(){
            $src.parent().toggleClass("bx-media-editable-src-updating2");
        }, 500);
         setTimeout(function(){
            $src.parent().removeClass('bx-media-editable-src-updating');
        }, 3000);
        
        return;
    }

	$src.parent().addClass('bx-media-editable-src-updating');

	$src.parent().attr('data-content', $this._aCaptions['please_wait']);
        
	var oAnim = setInterval(function(){
    	$src.parent().toggleClass("bx-media-editable-src-updating2");
 	}, 500);
    
	const formData = new FormData();
    formData.append('file', oFile, oFile.name);
	formData.append('f', oFile, oFile.name);
	formData.append('uo', $this._sUploader);
	formData.append('so', $this._sStorage);
	formData.append('uid', $this._sUniqId);
	formData.append('m', '');
	formData.append('c', $this._iContentId);
	formData.append('p', '0');
	formData.append('a', 'upload');
	if ($this._sUploadToken) formData.append('ut', $this._sUploadToken);

	const request = new XMLHttpRequest();
	request.open('POST', sUrlRoot + 'storage_uploader.php');
	request.onload = function(res) {
		if (request.status >= 200 && request.status < 300) {
			
			// restore ghosts
			var sUrl = sUrlRoot + 'storage_uploader.php?uo=' + $this._sUploader + '&so=' + $this._sStorage + '&uid=' + $this._sUniqId + '&img_trans=' + $this._sTranscoder + '&a=restore_ghosts&f=json&l=1&c=' + $this._iContentId + '&_t=' + (new Date());

			$.getJSON(sUrl, function (aData) {
                if ('object' === typeof(aData) && 'object' === typeof(aData.g)) {
                    if('object' === typeof(aData.g) && 'object' === typeof(aData.o)) 
                        aData = aData.g;
					// l=1 asks for the latest file only; take the newest one anyway
					var oLatest = null;
					$.each(aData, function(iFileId, oVars) {
						if (!oLatest || parseInt(oVars.file_id) > parseInt(oLatest.file_id))
							oLatest = oVars;
					});
					$.each(oLatest ? {latest: oLatest} : {}, function(sKey, oVars) {
						$this._sImageUrl = oVars.file_url;
                        if ($this._bIsBackground){
							$src.css("backgroundImage", 'url("' + oVars.file_url + '")');
                            $($this._sSelector).closest('.bx-media-editable').removeClass('h-32').removeClass('lg:h-32').addClass('h-64').addClass('lg:h-80');
                        }
						else{
							$src.attr("src", oVars.file_url);
                            $src.show();
                            $($this._sSelector).find('.bx-media-editable-src-placeholder').hide();
						}
						
						$src.parent().removeClass('bx-media-editable-src-updating');
						clearInterval(oAnim);
						var sOnclick = $src.parent().attr('onclick');
						if (sOnclick){
							var sOldUrl = sOnclick.substring(
								sOnclick.lastIndexOf("dolPopupImage(") , 
								sOnclick.lastIndexOf("$(this).parent()")
							);
							if (sOldUrl != ''){
								sOnclick= sOnclick.replace(sOldUrl, "dolPopupImage('" + $this._sImageUrl + "', ");
								$src.parent().attr('onclick', sOnclick);
							}
						}
						
						$.post($this._sActionUrl + 'UpdateContent/', {
							module: $this._sModule,
							field: $this._sFieldName,
							content_id: $this._iContentId,
							file_id: oVars.file_id
						});
						window[$this._sObjName].init(); 
					})

				}
				else{
                    $($this._sSelector).find('.bx-media-editable-src-placeholder').hide();
                }
			});

		}
		else {
			clearInterval(oAnim);
			$src.parent().removeClass('bx-media-editable-src-updating bx-media-editable-src-updating2');
			console.error('bx_media upload failed', request.status, request.responseText);
		}
	};
	request.send(formData);
}