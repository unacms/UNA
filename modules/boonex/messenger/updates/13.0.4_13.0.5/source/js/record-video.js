/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */
 
/**
 * Record video js file.
 */
 
function oJotVideoRecorder(oOptions)
{
	this.bstart = oOptions.bstart || '#start-record';
	this.bplay = oOptions.bplay || '#play-record';
	this.bclose = oOptions.bclose || '#close-record';
	this.bsend = oOptions.bsend || '#send-record';						
	this.video = oOptions.video || '#video';
	this.title = oOptions.title || '.bx-messenger-video-recording';
	this.start = oOptions.start || function(){};
	this.stop = oOptions.stop || function(){};
	this.send = oOptions.send || function(){};
	this.close = oOptions.close || function(){};
	this.oStream = null;
	this.oVideoBlob = null;
	this.oRecorder = null;
	this.sPopUpWrapper = '.bx-popup-wrapper';
	this.sDisableButtonClass = 'bx-btn-disabled';
};

oJotVideoRecorder.prototype.InitWebCam = function()
{
	const _this = this;
	try {
		navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true
		})
		.then(async function (oCamera) {
			_this.oStream = oCamera;
			$(_this.video).prop('srcObject', _this.oStream);

			$(_this.bstart)
				.removeClass(_this.sDisableButtonClass)
				.prop('disabled', false);

		});
	}
	catch(e){
		console.log(_t('_bx_messenger_video_record_is_not_supported', e.toString()));
		$(_this.bclose).click();
	};
};

oJotVideoRecorder.prototype.stopWebCamAndClose = function()
{
	if (this.oStream)
		this
			.oStream
			.getTracks()
			.forEach(function(track)
					{
						track.stop();
					});
					
	$(this.video)
		.parents(this.sPopUpWrapper)
		.dolPopupHide();
};

oJotVideoRecorder.prototype.init = function()
{		
		const _this = this,
			fClose = () => {
				_this.stopWebCamAndClose();
				_this.close();
			};
				
		$(_this.bclose).click(function(){
			if (typeof _this.oVideoBlob !== 'undefined')
				return bx_confirm(_t('_bx_messenger_close_video_confirm'), fClose);
			else
				fClose();
		});
		
		$(this.bsend).click(function(){
			if (_this.oVideoBlob !== undefined)
				_this.send(_this.oVideoBlob, () => _this.stopWebCamAndClose());
		});
		
		$(_this.video).on('loadeddata', function()
		{
			$(this)
				.parents(_this.sPopUpWrapper)
				.dolPopupCenter();
		});			
	
		this.InitWebCam();
		
		$(_this.bplay)
			.click(
					function()
					{
						const iActivePos = $(this).data('click');
						switch(iActivePos){
							case 1:
								$(this)
									.html('<i class="sys-icon play"></i>')
									.data('click', 2);
									
								$(_this.video)
									.trigger('pause');
								break;
							default:
								$(_this.video)
									.trigger('play');
								
								$(this)
									.removeClass('empty')
									.html('<i class="sys-icon pause"></i>')
									.data('click', 1);
						}			
					});
		
		$(_this.video)
			.on('ended', 
						function(e)
						{
							$(_this.bplay)
								.html('<i class="sys-icon undo"></i>')
								.addClass('empty')
								.data('click', 2);
						});
		
		$(_this.bstart)
		.click(
				function()
				{
					const __this = $(this);
					switch(__this.data('click'))
					{		
						case 1:
							$(__this).removeClass('active');
							__this
								.html('<i class="sys-icon circle"></i>')
								.data('click', 2);
							
							_this.stop(function()
							{					
								var oFile = this.getBlob();
								_this.stopRecording(oFile);
							});	
							break;
						default:
								$(_this.video).prop('srcObject', _this.oStream);
								
								URL.revokeObjectURL(_this.oVideoBlob);
														
								_this.start(_this.oStream);
																			
								$(_this.video)
									.prop('muted', true)
									.prop('autoplay', true)
									.prepend('<i class="sys-icon circle"></i>');
									
								$(_this.bplay)
									.html('<i class="sys-icon play"></i>')
									.addClass(_this.sDisableButtonClass)
									.prop('disabled', true)
									.removeClass('empty')
									.data('click', '');
								
								$(_this.bsend)
									.addClass(_this.sDisableButtonClass)
									.prop('disabled', true);
								
								
								$(_this.title).css('display', 'flex');
								__this.html('<i class="sys-icon square"></i>').data('click', 1);
					}
				});	
};

oJotVideoRecorder.prototype.isMimeTypeSupported = function(mimeType){
	return typeof MediaRecorder.isTypeSupported === 'function' ?
        MediaRecorder.isTypeSupported(mimeType) : true;
};

oJotVideoRecorder.prototype.getMimeType = function(mimeType){
	var mimeType = 'video/mp4\;codecs=h264'; // H264

    if (this.isMimeTypeSupported(mimeType) === false)
        mimeType = 'video/webm';

    return mimeType;
};

oJotVideoRecorder.prototype.stopRecording = function(oBlob)
{
	var _this = this;
	_this.oVideoBlob = oBlob || null;
	
	$(_this.title).fadeOut('slow');

	$(_this.video)
		.height($(_this.video).height())
		.width($(_this.video).width())
		.prop('srcObject', null)
		.prop('autoplay', false)
		.prop('src', _this.oVideoBlob ? URL.createObjectURL(_this.oVideoBlob) : '')
		.prop('muted', false);
	
	$(_this.bplay)
		.removeClass(_this.sDisableButtonClass)
		.prop('disabled', false);
	
	$(_this.bsend)
		.removeClass(_this.sDisableButtonClass)
		.prop('disabled', false);
	
};