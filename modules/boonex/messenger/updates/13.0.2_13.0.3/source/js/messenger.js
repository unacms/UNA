/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup	UnaModules
 * @{
 */
 
/**
 * Main messenger js file.
 */

;window.oMessenger = (function($){
	let _oMessenger = null;
	
	function oMessenger(oOptions){
		//list of selectors

		this.sAddFilesFormComments = '#bx-messenger-files-upload-comment';
		this.sAddFilesForm = '#bx-messenger-files-uploader';
		this.sJitsiVideo = '#bx-messenger-jitsi-video';
		this.sJitsiMain = '#bx-messenger-jitsi';
		this.sEditJotArea = '.bx-messenger-edit-jot';
		this.sEditJotAreaId = '#bx-messenger-edit-message-box';
		this.sThreadTextArea = '#bx-messenger-thread-message-box';
		this.sAttachmentArea = '.bx-messenger-attachment-area';
		this.sAttachmentBlock = '.bx-messenger-attachment';
		this.sAttachmentFiles = '.bx-messenger-attachment-files';
		this.sGiphyImages = '.bx-messenger-static-giphy';
		this.sAttachmentImages = '.bx-messenger-attachment-file-images';
		this.sSendAreaActions = '.bx-messenger-post-box-send-actions';
		this.sSendAreaActionsButtons = '.bx-messenger-post-box-send-actions-items';
		this.sReactionsArea = '.bx-messenger-jot-reactions';
		this.sMediaATArea = ['.bx-messenger-attachment-file-videos', '.bx-messenger-attachment-file-audio'];
		this.sVideoAttachment = '.bx-messenger-attachment-file-videos';
		this.sAudioAttachment = '.bx-messenger-attachment-file-audio';
		this.sFileAttachment = '.bx-messenger-attachment-file';
		this.sFilesUploadAreaOnForm = '.bx-messenger-upload-area';
		this.sTmpVideoFile = '.bx-messenger-attachment-temp-video';
		this.sReactionItem = '.bx-messenger-reaction';
		this.sReactionMenu = '.bx-messenger-reactions-menu';
		this.sGiphyItems = '.bx-messenger-giphy-items';
		this.sGiphySendArea = '#bx-messenger-send-area-giphy';
		this.sGiphMain = '.giphy';
		this.sGiphyBlock = '.bx-messenger-giphy';
		this.sTalkAreaWrapper = '.bx-messenger-table-wrapper';
		this.sActivePopup = '.bx-popup-applied:visible';
		this.sJitsiButton = '#jitsi-button';
		this.sJitsiJoinButton = '.bx-messenger-jots-message-vc-join-button';
		this.sDateNavigator = '#date-time-navigator';
		this.sUploaderAreaPrefix = 'bx-messenger-uploading-placeholder'; //
		this.sJotMessageReply = '.bx-messenger-reply-area-message';
		this.sJotMessageReplyArea = '.bx-messenger-reply-area';
		this.sJotMessageTitle = '.bx-messenger-jots-title';
		this.sTextArea = '.text-area';
		this.sInboxTitle = '#bx-messenger-inbox-area-title';
		this.sAttachFilesButton = 'a.attachefile, button.attachefile';
		this.sTalksListSearchBar = '.bx-messenger-participants-usernames';

		//global class options
		this.oUsersTemplate	= oOptions.templates && $(oOptions.templates['jot_template']);
		this.sReactionTemplate = oOptions.templates && oOptions.templates['reaction_template'];
		this.oActiveEditQuill = null;
		this.sJotUrl = (oOptions && oOptions.jot_url) || sUrlRoot + 'm/messenger/archive/';
		this.sInfoFavIcon = 'modules/boonex/messenger/template/images/icons/favicon-red-32x32.png';
		this.sJotSpinner = '<img src="modules/boonex/messenger/template/images/icons/jot-loading.gif" />';
		this.sDefaultFavIcon = $('link[rel="shortcut icon"]').attr('href');
		this.iAttachmentUpdate = false;
		this.iTimer = null;
		this.sEmbedTemplate = (oOptions.templates && oOptions.templates['embed_template']) || '<a href="__url__">__url__</a>';
		this.sThumbIcon = (oOptions.templates && oOptions.templates['thumb_icon']) || '';
		this.sThumbLetter = (oOptions.templates && oOptions.templates['thumb_letter']) || '';
		this.sAddUserTemplate = (oOptions.templates && oOptions.templates['add_user_item']) || '';
		this.iMaxLength = (oOptions && oOptions.max) || 0;
		this.iMaxReplyLength = 500;
		this.iMaxHistory = oOptions.max_history_number || 50;
		this.iStatus = document.hasFocus() ? 1 : 2; // 1- online, 2-away
		this.iActionsButtonWidth = '2.25';
		this.iScrollDownSpeed = 1500;
		this.aJitisActiveUsers = {};
		this.iHideUnreadBadge = 1000;
		this.iRunSearchInterval = 500; // seconds
		this.iMinHeightToStartLoading = 5; // scroll height to start history loading
		this.iMinTimeBeforeToStartLoadingPrev = 300; // 300 millseconds before to start loading history
		this.iUpdateProcessedMedia = 30000; //  30 seconds to check updated media files
		this.iTypingUsersTitleHide = 1000; //hide typing users div when users stop typing
		this.iLoadTimout = 0;
		this.iFilterType = 0;
		this.iStarredTalks = false;
		this.bActiveConnect = true;
		this.aUsers = [];
		this.iLastReadJotId = 0;
		this.iReplyId = 0;
		this.iThreadId = 0;
		this.iScrollDownPositionJotId = 0; // position of the scroll for down arrow on history page when user jump to reply
		this.oSendPool = new Map();

		// files uploader
		this.aUploaderQueue = Object.create(null);
		this.sUploaderInputPrefix = 'messenger_uploader_';
		// quill toolbar settings
		this.aToolbarSettings = [
			['bold', 'italic', 'underline', 'strike', 'link'],
			['blockquote', 'code-block'],
			[{ 'color': [] }, { 'background': [] }]
		];
		this.lastEditText = '';
		this.incomingMessage = 'modules/boonex/messenger/data/notify.mp3'; //beep file, occurs when message received
		this.reaction = 'modules/boonex/messenger/data/reaction.mp3'; //beep file, occurs when message received
		this.call = 'modules/boonex/messenger/data/call.mp3'; //incoming call file for video conferences
		this.emojiObject = oOptions.emoji || null;
		this.direction = oOptions.direction || 'LTR';

		this.aPlatforms = ['MacIntel', 'MacPPC', 'Mac68K', 'Macintosh', 'iPhone', 'iPod', 'iPad', 'iPhone Simulator', 'iPod Simulator', 'iPad Simulator', 'Pike v7.6 release 92', 'Pike v7.8 release 517'];
		this.oStorage = null;
		this.oHistory = window.history || {};
		this.oFilesUploader = null;
		this.oActiveAudioInstance = null;
		this.oActiveEmojiObject = Object.create(null);
		this.sJitsiServerUrl = oOptions.jitsi_server;
		this.aDatesItervals = [];
		this.aSearchJotsList = null;
		this.iScrollbarWidth = 0;
		this.oEmojiTemplate = oOptions.templates && oOptions.templates['participants_item'];
		this.aLoadingRequestsPool = []; // contains requests to load the talks when member clicks many talks with small delay and there is not enough time to load each talk

		$(this).on('message', () => this.beep());

		this.oSettings = {
							url	: oOptions.url || window.location.href,
							title : document.title || '',
							lot	: oOptions.lot || 0,
							name: (oOptions && oOptions.name) || 0,
							user_id: (oOptions && oOptions.user_id) || 0,
							group_id : (oOptions && oOptions.group_id) || 0,
							area_type: 'inbox'
						};


		this.bCreateNew = false;
		this.aTmpContent = [];
		this.oPrevSettings = null;
		this.bUniqueMode = !!oOptions['unique_mode'];
		this.iSelectedJot = oOptions.jot_id || 0;
		this.iLastUnreadJot = oOptions.last_unread_jot || 0;
		this.iUnreadJotsNumber = oOptions.unread_jots || 0;
		this.bAllowAttachMessages = oOptions.allow_attach || 0;
		this.iLotType = oOptions.type || 0;
		this.iMuted = +oOptions.muted;
		this.bByUrl = +oOptions.by_url;
		this.iSelectedPersonToTalk = oOptions.selected_profile || 0;
		this.isBlockMessenger = typeof oOptions.block_version !== 'undefined' ? oOptions.block_version : $(window.oMessengerSelectors.JOT.lotsBlock).length === 0;

		const { mainTalkBlock } = window.oMessengerSelectors.HISTORY;
		this.oFilesUploaderSettings = typeof oOptions['files_uploader'] !== 'undefined' ? $.extend(oOptions['files_uploader'], { main_object_name: mainTalkBlock }) : null;

		// Real-time WebSockets framework class
		this.oRTWSF = (oOptions && oOptions.oRTWSF) || window.oRTWSF || null;
		
		// Main Messenger menu
		this.oMenu = null;

		// text editor
		this.quill = null;

		$(window).on('popstate', (e) => this.updateHistory(e));

		this.oNotifications = Object.assign({
			'inbox': 0,
			'threads': Object.create({}),
			'direct': Object.create({}),
			'groups': Object.create({})
		}, oOptions.messages || {});
	}

	oMessenger.prototype.updateHistory = function(e){
		const _this = this,
			  { state } = this.oHistory,
			  { lot, jot, action, type, area, menu } = state || {};


		if (this.oEditor)
			this.oEditor.blur();

		if (oMUtils.isMobile() && typeof _this.oMenu !== 'undefined') {
			if (_this.oMenu.isHistoryColActive())
				return _this.oMenu.showHistoryPanel();

			if (_this.oMenu.isMenuColActive())
				return _this.oMenu.toggleMenuPanel();
		}

		switch(action){
			case 'init':
			case 'load_talk':
				if (lot) {
					_this.oMenu.toggleMenuItem(undefined, menu);
					if (area !== _this.oSettings.area_type && !_this.isBlockVersion()) {
						_this.loadTalksListByParam({ group: area }, () => {
							_this.loadTalk(lot, jot);
						});
					}
					else
						_this.loadTalk(lot);
				}
				break;
			case 'create_list':
					_this.createList(type);
				break;
		}
	}

	oMessenger.prototype.updateCreateButton = function(){
		const { area_type } = this.oSettings,
			{ createTalkButton, talksList, topItem } = window.oMessengerSelectors.TALKS_LIST;

		if (['direct', 'groups'].includes(area_type))
			$(createTalkButton).show();
		else
			$(createTalkButton).hide();

		$(talksList).find(topItem).addClass('hidden');
	}

	oMessenger.prototype.playSound = function(sFile, bRepeat = false){
		if (!_oMessenger[sFile])
			return ;

	try {
			if (bRepeat)
				this.oActiveAudioInstance = createjs.Sound.play(sFile, { interrupt: createjs.Sound.INTERRUPT_ANY, loop: -1 });
			else
				createjs.Sound.play(sFile, {});
		}
		catch(e){
			console.log('Sound is not supported in your browser');
		}
	};

	/**
	* Init current chat/talk/lot settings
	*/

	oMessenger.prototype.initLotSettings = function(oOptions){
		const _this = this,
			{ lot, jot, last_unread_jot, unread_jots, title, group_id } = oOptions || {},
			{ conversationBody } = window.oMessengerSelectors.HISTORY;

		for (const key in this.oSettings) {
			if (typeof oOptions[key] !== 'undefined')
				_this.oSettings[key] = oOptions[key];
		}

		this.iSelectedJot = jot || 0;
		this.iLastUnreadJot = last_unread_jot || 0;
		this.iUnreadJotsNumber = unread_jots || 0;
		this.iLastReadJotId = 0;

		this.updateCounters(unread_jots, true);

		/* runs periodic to find not processed videos in chat history and replace them with processed videos */
		setInterval(
			function()
			{
				_this.updateProcessedMedia();
			}, _this.iUpdateProcessedMedia
		);

		$(document).ready(() => $(conversationBody).initJotIcons().initAccordion());
		
		this.blockSendMessages(!this.oRTWSF || !this.oRTWSF.isInitialized() || (!lot && !this.iSelectedPersonToTalk && this.iLotType === 2));
	};

	oMessenger.prototype.setScrollBarWidth = function() {
		const { talkBlock, mainScrollArea, scrollAreaItem } = window.oMessengerSelectors.HISTORY;
		this.iScrollbarWidth = $(talkBlock).prop('offsetWidth') - $(talkBlock).prop('clientWidth');

		if (!$(talkBlock).prop('clientWidth'))
			return ;

		// set dates intervals top div width without scrollbar width
		$(this.sDateNavigator).width($(talkBlock).prop('clientWidth'));

		if (this.iScrollbarWidth)
			$(`${mainScrollArea},${scrollAreaItem}`).css('right', `calc( ${this.iScrollbarWidth}px + 0.5rem )`);
	}

	oMessenger.prototype.initScrollArea = function() {
		const _this = this,
			 { talkBlock, mainScrollArea, unreadJotsCounter } = window.oMessengerSelectors.HISTORY,
			 { talkListJotSelector } = window.oMessengerSelectors.JOT;

		let iBottomScreenPos = $(talkBlock).scrollTop() + $(talkBlock).innerHeight();
		let bStartLoading = !(_this.iLastUnreadJot || _this.iSelectedJot);
		let iCounterValue = +$(unreadJotsCounter).text();
		let iUpdateCounter = null;
		let iPrevScrollHeight = null;

		$(talkBlock).scroll(function(e){
			const isScrollAvail = $(this).prop('scrollHeight') > $(this).prop('clientHeight'),
				iScrollHeight = $(this).prop('scrollHeight') - $(this).prop('clientHeight'),
				iScrollPosition = $(this).prop('scrollHeight') - $(this).prop('clientHeight') - $(this).scrollTop(),
				iPassPixelsToStart = isScrollAvail ? _this.iMinHeightToStartLoading/100 * $(this).prop('clientHeight') * iScrollHeight/$(this).prop('clientHeight') : 0,
				isTopPosition = ($(this).scrollTop() <= iPassPixelsToStart) || ($(this).scrollTop() === 0),
				isBottomPosition = $(this).scrollTop() > ($(this).prop('scrollHeight') - $(this).prop('clientHeight') - iPassPixelsToStart);

			if (!isScrollAvail)
				return;

			if (iPrevScrollHeight === null){
				$(this).trigger(jQuery.Event('scrollMount'));
				iPrevScrollHeight = $(this).prop('scrollHeight');
			} else
			if (iPrevScrollHeight !== $(this).prop('scrollHeight')){
				$(this).trigger(jQuery.Event('scrollHeightUpdated'));
				iPrevScrollHeight = $(this).prop('scrollHeight');
			}

			iBottomScreenPos = $(talkBlock).scrollTop() + $(talkBlock).innerHeight();
			iCounterValue = +$(unreadJotsCounter).text();
			if (_this.iLastUnreadJot) {
				$(talkListJotSelector).each(function () {
					const iId = +$(this).data('id');
					const { top } = $(this).position();
					const iJotBottomPos = top + $(this).innerHeight();

					if (iId < _this.iLastUnreadJot)
						return;

					if (iId > _this.iLastUnreadJot && iJotBottomPos <= iBottomScreenPos) {
						_this.iLastReadJotId = iId;
						$(unreadJotsCounter).text(--iCounterValue);
						if (!iCounterValue)
							$(unreadJotsCounter).hide();

						clearTimeout(iUpdateCounter);
					}
				});

				if (_this.iLastReadJotId && _this.iLastUnreadJot !== _this.iLastReadJotId ) {
					_this.iLastUnreadJot = _this.iLastReadJotId;
					iUpdateCounter = setTimeout(() => {
						if (document.hasFocus()) {
							_this.broadcastView(_this.iLastUnreadJot);
							_this.updateCounters(iCounterValue);
						}
					}, 1000);
				}
			}

			if (!isBottomPosition && !isTopPosition && bStartLoading)
				bStartLoading = false;

			if (iScrollPosition > $(talkListJotSelector).last().height() || iCounterValue)
				$(mainScrollArea).fadeIn();
			else
				$(mainScrollArea).fadeOut();

			if ((isBottomPosition || isTopPosition)){
				if (!bStartLoading) {
					bStartLoading = true;
					_this.iLoadTimout = setTimeout(
						function () {

							e.stopPropagation();
							e.preventDefault();

							_this.updateJots({
								action: isTopPosition ? 'prev' : 'new',
								position: isBottomPosition ? 'freeze' : 'position',
								last_viewed_jot: _this.iLastUnreadJot
							});

						}, _this.iMinTimeBeforeToStartLoadingPrev);
				}
			}
			else
				clearTimeout(_this.iLoadTimout);
		});
	}

	oMessenger.prototype.loadTalkFiles = function(oBlock, iCount, fCallback) {
		const { msgContainer } = window.oMessengerSelectors.SYSTEM;
		bx_loading(oBlock, true);
		$.get('modules/?r=messenger/get_talk_files/', {
			number: iCount,
			lot_id: this.oSettings.lot
		}, function ({ code, html, total }) {
			bx_loading(oBlock, false);

			if (!code && !($(msgContainer, oBlock).length && $(html).hasClass(msgContainer)))
				$(oBlock)
					.append(html)
					.bxMsgTime();

			if (typeof (fCallback) === 'function')
				fCallback({ total });
		}, 'json');
	};

	oMessenger.prototype.loadTalkInfo = function(oBlock, fCallback) {
		const { msgContainer } = window.oMessengerSelectors.SYSTEM;
		bx_loading(oBlock, true);
		$.get('modules/?r=messenger/get_talk_info/', {
			lot_id: this.oSettings.lot
		}, function ({ code, html, total }) {
			bx_loading(oBlock, false);

			if (!code && !($(msgContainer, oBlock).length && $(html).hasClass(msgContainer)))
				$(oBlock)
					.append(html)
					.bxMsgTime();

			if (typeof (fCallback) === 'function')
				fCallback({ total });
		}, 'json');
	};

	oMessenger.prototype.updateLotSettings = function(oOptions) {
		this.initLotSettings(oOptions);
	}

	oMessenger.prototype.initTextEditor = function(oSettings) {
		return new oMessengerEditor(Object.assign({}, oSettings, {
			showToolbar: () => !oMUtils.isMobile()
		}));
	}

	oMessenger.prototype.createFilesUploader = function() {
		const _this = this,
			{ attachmentArea } = window.oMessengerSelectors.TEXT_AREA;

		let iTime = (new Date()).getTime();
		const InputName = `${_this.sUploaderInputPrefix}${iTime}`;
		const sInput = `<input type="file" name="${InputName}" required style="display:none;"/>`;

		$(attachmentArea).before(sInput);

		if (!this.oFilesUploader)
			this.initFilesUploader();

		this.oFilesUploader.create(InputName);
	}

	oMessenger.prototype.initFilesUploader = function(sSelector = '') {
		const _this = this,
			{ attachmentArea } = window.oMessengerSelectors.TEXT_AREA;

		if (!this.oFilesUploaderSettings)
			return;

		this.oFilesUploader = (new oMessengerUploader(Object.assign({}, this.oFilesUploaderSettings, {
				onAddFilesCallback: () => {
					if ($(`${sSelector}${attachmentArea}`).children().length) {
						$(`${sSelector}${this.sGiphMain}`).fadeOut();
						$(`${sSelector}${attachmentArea}`).html('');
					}
				},
				onUpdateAttachments: (bUpdate) => this.updateSendArea(bUpdate),
				onUploadingComplete: (sName, aFiles, fCallback) => {
					if (typeof _this.aUploaderQueue[sName] === 'undefined')
						return false;

					const { id } = _this.aUploaderQueue[sName] || {},
							fUpload = () => {

								const { uploading_jot_id, lot } = _this.aUploaderQueue[sName];
												return $.post('modules/?r=messenger/update_uploaded_files/', {
													jot_id: uploading_jot_id,
													files: aFiles
												}, function ({ code, message }) {
													if (+code && message)
														bx_alert(message);
													else
													{
														_this.broadcastMessage({
															jot_id: uploading_jot_id, lot,
															addon: 'update_attachment'
														});

														if ($(`#${_this.sUploaderAreaPrefix}-${id}`).length)
															_this.attacheFiles(uploading_jot_id, true, () => {
																$(`#${_this.sUploaderAreaPrefix}-${id}`).fadeOut(function () {
																	$(this).remove();
																});
															});
													}

													if (typeof fCallback === 'function')
														fCallback();

													delete _this.aUploaderQueue[sName];

												}, 'json');
							}

					if (aFiles.length) {
						if (_this.oSendPool.has(id)) {
							const oThread = _this.oSendPool.get(id);
							if (oThread.promise !== null)
								oThread.promise.then(fUpload);
						} else
								fUpload();
					}
				}
			}))).getUploader();

		return this.oFilesUploader;
	}

	oMessenger.prototype.initTextArea = function(fCallback, sTextAreaSelector = null) {
		const _this = this,
			{ inputArea, sendButton, attachmentGroup } = window.oMessengerSelectors.TEXT_AREA,
			{ talkListJotSelector } = window.oMessengerSelectors.JOT;

		this.oEditor = this.initTextEditor({
			selector: sTextAreaSelector || inputArea,
			placeholder: _t('_bx_messenger_post_area_message'),
			onEnter:() => {
				if (!(oMUtils.isMobileDevice() || oMUtils.isUnaMobileApp())) {
					_this.updateScrollPosition('bottom');
					$(sendButton).click();
					return true;
				}

				_this.oEditor.focus();
				return false;
			},
			onInit : function(){
				if (typeof fCallback === 'function') {
					fCallback();
				}
			},
			onUp: () => {
				if ($(talkListJotSelector).length && _this.oEditor.length <= 1) {
					const oJot = $(`${talkListJotSelector}`).last();
					if (+oJot.data('my'))
						_this.editJot(oJot);
					return false;
				}
				return true;
			},
			onChange: () => {
				const { ops } = _this.oEditor.getContents(),
					{ lot, name, user_id } = _this.oSettings;

				if (!lot || _this.bCreateNew)
					return;

				_this.updateSendAreaHeight();
				if (_this.oEditor.length > 1){
					const oJotInfo = Object.create(null);
					 oJotInfo.message = ops;
					 if (_this.iReplyId)
						oJotInfo.reply = _this.iReplyId;

					_this.oStorage.saveLot(lot, oJotInfo);
				}
				else
					_this.oStorage.deleteLot(lot);

				// show typing area when member post the message
				if (_this.oRTWSF)
					_this.oRTWSF.typing({ lot, name, user_id });
		  }
		});

		// when member clicks on send message icon
		$(sendButton).on('click', () => {
			if (_this.sendMessage(_this.oEditor.length === 1 ? '' : _this.oEditor.html(), undefined, () => {
				if (_this.oFilesUploader)
					_this.oFilesUploader.clean();

					_this.oPrevSettings = null;
					_this.aTmpContent = [];
					_this.oStorage.deleteLot(_this.oSettings.lot);
				}))
				{
					_this.aTmpContent = _this.oEditor.getContents();
					_this.oEditor.setContents([]);
					if (!(oMUtils.isMobileDevice() || oMUtils.isUnaMobileApp()))
						_this.oEditor.focus();
					else
						_this.oEditor.blur();
				}
		});

		_this.updateSendAreaButtons();

		oMessengerEmoji.init($.extend(_this.emojiObject, {
			onEmojiSelect: function(oEmoji){
				if (_this.oActiveEmojiObject['type'] === 'reaction' && +_this.oActiveEmojiObject['param'])
					_this.onJotAddReaction(oEmoji, +_this.oActiveEmojiObject['param']); 
				else if (_this.oActiveEmojiObject['type'] === 'textarea')
					_this.onTextAreaAddEmoji(oEmoji);

				_this.oActiveEmojiObject = Object.create(null);
			}}));

		$(_this.sSendAreaActionsButtons)
			.find(window.oMessengerSelectors.EMOJI.sendEmojiButton)
			.attacheEmoji((e) => {
				const { textArea } = window.oMessengerSelectors.TEXT_AREA;

				if (window.oMessengerEmoji)
					window.oMessengerEmoji.emojiCall({
						position: 'absolute',
						left: '2.5rem',
						right: '',
						top: '',
						bottom: $(textArea).height()
					}, () => _this.oActiveEmojiObject['type'] = 'textarea');
			});

		// init files uploader
		_this.createFilesUploader();

		$(_this.sAttachFilesButton).on('click', () => {
			if (!$(`${attachmentGroup} [name^="${_this.sUploaderInputPrefix}"]`).length || !_this.oFilesUploader)
				_this.createFilesUploader();

			_this.oFilesUploader.browse();
		});

		// enable video recorder if it is not IOS/Mac devices
		if(!_this.aPlatforms.includes(navigator.platform))
			$(_this.sSendAreaActionsButtons)
				.find('li.video').show();

		$(_this.sGiphySendArea)
			.on('click',
					function(e){
						if ($(_this.sGiphMain).is(':visible'))
							$(_this.sGiphMain).fadeOut();
						else
							$(_this.sGiphMain).fadeIn(function(){
								$(this).css('display', 'flex');
								_this.initGiphy();
							});
					});

		_this.setStorageData();
		_this.updateSendAreaHeight();
		_this.checkNotFinishedTalks();
    }

   oMessenger.prototype.setStorageData = function() {
	   const _this = this,
		   { sendButton } = window.oMessengerSelectors.TEXT_AREA,
		   { jotMain } = window.oMessengerSelectors.JOT;

	   // check if the not finished message for the talk exists
	   const mixedStorageMessage = _this.oStorage.getLot(_this.oSettings.lot);
	   if ( typeof mixedStorageMessage === 'object'){
		   const { message, reply } = mixedStorageMessage;

		   if (Array.isArray(mixedStorageMessage) && mixedStorageMessage.length){
			   _this.oEditor.setContents(mixedStorageMessage);
			   $(sendButton).fadeIn();
		   }
		   else if (Array.isArray(message) && message.length)
		   {
			   _this.oEditor.setContents(message);
			   $(sendButton).fadeIn();
		   }
		   else if ( typeof mixedStorageMessage === 'string' && mixedStorageMessage.length)
			   _this.oEditor.setText(mixedStorageMessage);

		   if (+reply){
			   _this.iReplyId = +reply;
			   _this.replyJot($(`${jotMain}[data-id="${_this.iReplyId}"]`), _this.iReplyId);
		   }
	   }
   }

	oMessenger.prototype.updateSendAreaHeight = function() {
		const { inputArea } = window.oMessengerSelectors.TEXT_AREA,
				oInputArea = $(inputArea),
			    fMaxHeight = parseInt(oInputArea.css('max-height'));

		if (oInputArea.outerHeight() >= fMaxHeight)
			oInputArea.css('overflow-y', 'auto');
		else
			oInputArea.css('overflow-y', 'visible');
	}

	oMessenger.prototype.updateSendArea = function(bFilesEmpty){
		const { attachmentGroup } = window.oMessengerSelectors.TEXT_AREA;

		if (bFilesEmpty)
			$(attachmentGroup).hide();
		else
			$(attachmentGroup).show();
	};

	oMessenger.prototype.onOuterClick = function(oEvent){
		const { inputArea } = window.oMessengerSelectors.TEXT_AREA;
		if ($(oEvent.target).closest(inputArea).length)
			return;

		if (!$(oEvent.target).closest(this.sGiphySendArea).length && !$(oEvent.target).closest(this.sGiphMain).length)
			$(this.sGiphMain).fadeOut();
	};

	/**
	 * Mark talks in case if they are contains not finiched messages
	 */

	oMessenger.prototype.checkNotFinishedTalks = function(){
		const { talkItem } = window.oMessengerSelectors.TALKS_LIST,
			  oLots = this.oStorage.getLots(),
		 	  oLotsKeys = (oLots && Object.keys(oLots)) || [];

		$(`${talkItem} .info`).each(function(){
			$(this).html('');
		});

		if (oLotsKeys.length)
			oLotsKeys.map((iLot) => $(`${talkItem}[data-lot="${iLot}"] .info`).html( oLots[iLot].length ? '<i class="sys-icon pen"></i>' : ''));
	};
	
	/**
	* Init send message area buttons
	*/
		
	oMessenger.prototype.updateSendAreaButtons = function(sSelector){
		const _this = this,
			 oSmile = $(`${sSelector}${_this.sSendAreaActionsButtons}`)
						.find('button.smiles')
						.parent();

		if (oMUtils.isMobile())
			oSmile.hide();
		else
			oSmile.show(100);
	};

	oMessenger.prototype.blockSendMessages = function(bBlock){
		const { textArea, textAreaDisabled } = window.oMessengerSelectors.TEXT_AREA;

		if (bBlock !== undefined)
			this.bActiveConnect = !bBlock;
		
		if (!this.bActiveConnect && !$(textArea).hasClass(textAreaDisabled))
			$(textArea).addClass(textAreaDisabled);
		
		if (this.bActiveConnect)
			$(textArea).removeClass(textAreaDisabled);
	}

	oMessenger.prototype.isBlockVersion = function(){
		return this.isBlockMessenger;
	}

	oMessenger.prototype.showWelcomeMessage = function(sMessage){
		if (sMessage.length)
			bx_alert(sMessage);
	}

	oMessenger.prototype.removeEditArea = function(oEvent){
		const _this = this,
			  bEditArea = $(oEvent.target).parents(_this.sEditJotArea).length;

		$(this.sEditJotArea).each(function()
		{
			if (!bEditArea)
				_this.cancelEdit($(this));
		});
	};

	/**
	* Update status of the member
	*@param object oData changed profile's settings
	*/
	oMessenger.prototype.updateStatuses = function(oData){
		let sClass = 'offline';

		switch(oData.status)
		{
			case 1:
				sClass = 'online';
				break;
			case 2:
				sClass = 'away';
				break;
			default:
				sClass = 'offline';
		}

		$('div[data-user-status="' + oData.user_id + '"]')
			.removeClass('online offline away')
			.addClass(sClass)
			.attr('title', _t('_bx_messenger_' + sClass));
	}
	
	/**
	* Set users statuses
	*@param object oObject from which to copy status to all other places where status exists (to make all statuses similar)
	*/
	oMessenger.prototype.setUsersStatuses = function(oObject){
		const { talkStatus } = window.oMessengerSelectors.TALKS_LIST,
			  iUser = oObject
						.find(talkStatus)
						.data('user-status');

		if (parseInt(iUser))
		{
			const classList = oObject
								.find(talkStatus)
								.attr('class')
								.split(/\s+/);

			if (typeof classList[2] !== 'undefined')
			{
				$('div[data-user-status="' + iUser + '"]').
					removeClass('online offline away').
					addClass(classList[2]).
					attr('title', _t('_bx_messenger_' + classList[2]));
			}
		}
	};
	
	/**
	* Load logged member's message template	
	*/
	oMessenger.prototype.loadMembersTemplate = function(){
		const _this = this;
		
		if (_this.oUsersTemplate == null)
			$.get('modules/?r=messenger/load_members_template', 
				function({ data }){
					if (typeof data !== 'undefined' && data.length){
						_this.oUsersTemplate = $(data);
					}
			}, 'json');	
	}
	
	/**
	* Search for lot
	*@param int/function mixedOption type of the lot or calback function
	*@param string sText keyword for filter
	*/
	oMessenger.prototype.searchByItems = function(mixedOption, sText){
		const _this = this,
			iFilterType	= typeof mixedOption == 'function' || mixedOption === undefined ? this.iFilterType : mixedOption,
			{ talksList, searchCloseIcon } = window.oMessengerSelectors.TALKS_LIST,
			searchFunction = () => {
								_this.iTimer = setTimeout(() => bx_loading($(talksList), true), 1000);
								$.get('modules/?r=messenger/search', { param:sText || '', type:iFilterType, starred: +_this.iStarredTalks },
										function({ code, html, search_list })
										{
											clearTimeout(_this.iTimer);

											bx_loading($(talksList), false);
											if (parseInt(code) === 1)
												window.location.reload();
											else
											{
												_this.aSearchJotsList = typeof search_list !== 'undefined' ? search_list : null;
												_this.showSearchCounter(_this.oSettings.lot);

												const fCallback = () => typeof mixedOption === 'function' && mixedOption();
												if (!parseInt(code)) {
													$(' > ul', talksList)
														.html(html)
														.bxMsgTime()
														.fadeIn(fCallback);

													$(talksList).initLazyLoading((oObject, bFlag) => _this.loadTalksList(oObject, bFlag));
													_this.iFilterType = iFilterType;
												}
												else
													fCallback();
											}

											if (sText && sText.length)
												$(searchCloseIcon).show();
											else
												$(searchCloseIcon).hide();

										}, 'json');
							};


		if ((typeof mixedOption !== 'function' && mixedOption) || typeof sText !== 'undefined'){
			clearTimeout(_this.iTimer);	
			this.iTimer = setTimeout(searchFunction, _this.iRunSearchInterval);
		}
		else
			searchFunction();
	}

	oMessenger.prototype.disableCreateList = function() {
		const { conversationBlockHistory, createTalkArea } = window.oMessengerSelectors.HISTORY,
			  { talkTitle } = window.oMessengerSelectors.TEXT_AREA;

		$(createTalkArea, conversationBlockHistory).hide().remove();
		$(talkTitle).remove();

		this.bCreateNew = false;
		this.oMenu.toggleAlwaysOnTop(false);
	}

	oMessenger.prototype.createList = function(action, fCallback) {
		const { lot, area_type, group_id } = this.oSettings,
			  { panel } = window.oMessengerSelectors.TALKS_LIST,
			  { textArea } = window.oMessengerSelectors.TEXT_AREA,
			  { mainTalkBlock, tableWrapper, conversationBlockHistory, createTalkArea, talkBlockWrapper, historyColumn } = window.oMessengerSelectors.HISTORY,
			  _this = this;

		const bIsPanel = $(historyColumn).hasClass(panel);
		if (bIsPanel && $(createTalkArea, conversationBlockHistory).length)
			return;

		if (oMUtils.isMobile()) {
			if (!_this.oMenu.isHistoryColActive())
				_this.oMenu.showHistoryPanel();
		}

		_this.oMenu.toggleAlwaysOnTop();

		// flag to detect if the new conversation is created
		this.bCreateNew = action === 'new';

		bx_loading($(mainTalkBlock), true);
		$.post('modules/?r=messenger/load_list', { group_id, area_type, action, lot }, function ({
																								   code,
																								   content,
																								   text_area,
																								   msg
																							  	 }) {
			bx_loading($(mainTalkBlock), false);
			if (+code && msg) {
				bx_alert(msg);
				return;
			}

			if (!parseInt(code)) {
				$(talkBlockWrapper, conversationBlockHistory)
					.before(content);

				if (text_area) {
					if ($(textArea, mainTalkBlock).length)
						$(textArea, mainTalkBlock).replaceWith(text_area);
					else
						$(tableWrapper).append(text_area);

					if (_this.oFilesUploader)
						_this.oFilesUploader.removeCurrent();

					_this.initTextArea();
				}

				if (typeof fCallback == 'function')
					fCallback();
			}
		}, 'json');
	}

	oMessenger.prototype.saveParticipantsList = function(iLotId){
		const _this = this,
			{ createTalkArea, mainTalkBlock } = window.oMessengerSelectors.HISTORY,
			{ blockContainer, bxTitle, blockMenu }  = window.oMessengerSelectors.SYSTEM;

		let _iLotId = iLotId;
		$.post('modules/?r=messenger/save_lots_parts', {
			lot:_iLotId,
			participants:_this.getParticipantsList(),
			is_block: _this.isBlockVersion()
		},
		function({ code, message, lot, header, buttons }){
						if (+code === 1)
							bx_alert(message);
						else
						{
							_this.disableCreateList();

							if (typeof header !== 'undefined') {
								$(mainTalkBlock)
									.closest(blockContainer)
									.find(bxTitle)
									.html(header)
									.siblings(blockMenu)
									.html(buttons)
									.fadeIn();
							}

							if (lot) {
								_this.oSettings.lot = lot;
								_this.blockSendMessages(false);
									
								if (!_this.isBlockVersion())
									_this.upLotsPosition(_this.oSettings);
								
								if (!_iLotId)
									_this.updateTalksListArea();
							}
							
							if (_this.oEditor)
								setTimeout(() => _this.oEditor.focus(), 1000);
						}
						
		}, 'json');
	};
	
	oMessenger.prototype.updateTalksListArea = function(){
		const { talksList } = window.oMessengerSelectors.TALKS_LIST,
			  { msgContainer } = window.oMessengerSelectors.SYSTEM;

		if ($(msgContainer, talksList).length)
				$(msgContainer, talksList).remove();
	}
	
	oMessenger.prototype.updateCommentsAreaWidth = function(fWidth){
			$(this.sAddFilesFormComments)
				.css('max-width', fWidth ? fWidth : $(this.sAddFilesFormComments).parent().width());
	};

	oMessenger.prototype.leaveLot = function(iLotId){
		const _this = this,
			{ talksListItems } = window.oMessengerSelectors.TALKS_LIST;

		if (!iLotId)
			return false;

		$.post('modules/?r=messenger/leave', {lot:iLotId}, function(oData){
			bx_alert(oData.message);
			if (!parseInt(oData.code))
					_this.searchByItems(() => $(talksListItems).length ?  $(talksListItems).first().click() : '');
		}, 'json');
	};
	
	oMessenger.prototype.muteLot = function(iLotId, oEl){
		const iVal = parseInt($(oEl).data('value'));

		if (iVal)
			$('i.sys-icon', oEl)
				.removeClass('bell-slash').addClass('bell');
		else
			$('i', oEl)
				.removeClass('bell').addClass('bell-slash');

		this.iMuted = +!iVal;
		$(oEl).data('value', this.iMuted);

		$.post('modules/?r=messenger/mute', {lot:iLotId}, function(oData){
				if (typeof oData.code !== 'undefined')
				    $(oEl)
						.attr('title', oData.title)
						.find('.title')
						.text(oData.title)
		}, 'json');
	}
	
	oMessenger.prototype.starLot = function(iLotId, oEl){
		const iVal = parseInt($(oEl).data('value'));

		if (!iVal)
			$('i', oEl)
				.addClass('fill');
		else
			$('i', oEl)
				.removeClass('fill');

		$(oEl).data('value', +!iVal);

		$.post('modules/?r=messenger/star', {lot:iLotId}, function(oData){
					if (typeof oData.code !== 'undefined')
						$(oEl)
							.attr('title', oData.title)
							.find('.title')
							.text(oData.title)
				}, 'json');
	}
	
	oMessenger.prototype.viewJot = function(iJotId){
		const _this = this,
			{ conversationBody } = window.oMessengerSelectors.HISTORY,
			{ jotMessage, jotDeleted, jotHidden } = window.oMessengerSelectors.JOT,
			oObject = $(jotMessage, $('div[data-id="' + iJotId + '"]', conversationBody));
		
		if (!oObject)
			return ;
		
		if ($(jotHidden, oObject).length)
		{
			if ($(jotHidden, oObject).is(':hidden'))
				$(jotHidden, oObject).fadeIn('slow');
			else
				$(jotHidden, oObject).fadeOut();
			
			return false;
		}
		
		bx_loading($(jotDeleted, oObject), true);
		$.post('modules/?r=messenger/view_jot', { jot: iJotId }, function(oData)
		{
			if (!parseInt(oData.code) && oData.html.length)
				$(jotDeleted, oObject)
					.append(
							$(oData.html)
								.fadeIn('slow')
							);
			
			bx_loading($(jotDeleted, oObject), false);
		}, 'json');
	};

	oMessenger.prototype.calculatePositionTop = function(oJot, oObject, bLocal) {
		const { talkBlock } = window.oMessengerSelectors.HISTORY;
		const iHeight = oObject.height(),
			bIsFileMenu = $(oObject).hasClass('file-menu'),
			iParentHeight = oJot.closest(this.sTalkAreaWrapper).height(),
			iScrollTop = oJot.closest(talkBlock).scrollTop(),
			iTop = oJot.position().top - iScrollTop;

			if (bIsFileMenu)
				return -iHeight/2;

		let iTopPos = 0;
		if ((iParentHeight > iHeight) && ((iParentHeight - iTop) < iHeight/2))
			iTopPos = iTop - iHeight;
		else if (iTop > iHeight/2)
			iTopPos = iTop - iHeight/2;

		return iTopPos - ( bLocal ? iTop : 0 ); // use this local in case if it is some internal popup not the global like reaction popup
	};

	oMessenger.prototype.onAddReaction = function(oObject, bNear){
		const _this = this,
			{ jotMain } = window.oMessengerSelectors.JOT,
			oJot = $(oObject).closest(jotMain),
			iJotId = oJot.data('id') || 0;

		if (window.oMessengerEmoji)
			window.oMessengerEmoji.emojiCall((oComponent) => ({
				top: _this.calculatePositionTop(oJot, oComponent),
				left: bNear && !oMUtils.isMobile() ? $(oObject).position().left : 0,
				position: 'absolute'
			}), () => _this.oActiveEmojiObject = {'type': 'reaction', 'param': iJotId});
	};

	oMessenger.prototype.deleteLot = function(iLotId){
		const _this = this,
			  { talksListItems, talkItem } = window.oMessengerSelectors.TALKS_LIST,
			  { mainTalkBlock } = window.oMessengerSelectors.HISTORY,
			  { blockContainer, blockMenu } = window.oMessengerSelectors.SYSTEM;

		if (iLotId)
				$.post('modules/?r=messenger/delete', { lot: iLotId }, function({ code }){
					if (+code === 1)
						window.location.reload();
					else
						if (!code)
						{
							if (_this.isBlockVersion())
                                window.location.reload();
							else
								{
								$(`[data-lot="${iLotId}"]${talkItem}`).fadeOut(() => {
									if ($(talksListItems).length > 0) {
										$(talksListItems).first().click();
										if (oMUtils.isMobile())
											_this.oMenu.showHistoryPanel();
									}
										else
									{
										$(mainTalkBlock)
											.closest(blockContainer)
											.find(blockMenu)
											.html('');
									}
								}).remove()
							};

							_this.broadcastMessage({
								action: 'msg',
								addon: 'remove_lot',
								lot: iLotId
							});
						}
				}, 'json');
	};

	oMessenger.prototype.clearLot = function(iLotId){
		const _this = this,
			{ mainTalkBlock, conversationBody } = window.oMessengerSelectors.HISTORY;

		if (iLotId) {
			bx_loading($(mainTalkBlock), true);
			$.post('modules/?r=messenger/clear_history', {lot: iLotId}, function ({code, message}) {
				if (!parseInt(code)) {
					bx_loading($(mainTalkBlock), false);
					$(conversationBody).html('');
					_this.broadcastMessage({
						action: 'msg',
						addon: 'clear'
					});
				} else
					bx_alert(message);
			}, 'json');
		}
	};

	oMessenger.prototype.cancelEdit = function(oObject){
		const { jotMain, jotMessage} = window.oMessengerSelectors.JOT;

		if (this.lastEditText.length);
		{
			$(oObject)
				.closest(jotMain)
				.find(jotMessage)
				.html(this.lastEditText)
				.parent()
				.linkify(true, true); // don't update attachment for message and don't broadcast as new message*/

			if (this.oActiveEditQuill) {
				this.oActiveEditQuill.disable();
				this.oActiveEditQuill = null;
			}
		}

		this.oEditor.focus();
	};

	oMessenger.prototype.onSaveJotItem = function(oObject) {
		const _this = this,
			{ jotMain } = window.oMessengerSelectors.JOT,
			oJot = $(oObject).parents(jotMain),
			iJotId = oJot.data('id') || 0;

		if (!iJotId)
			return false;

		$.post('modules/?r=messenger/save_jot_item', { jot: iJotId }, function ({ code, msg }) {
				if (code)
					bx_alert(msg);
		});
	}

	oMessenger.prototype.saveJot = function(oObject){
		const _this = this,
			{ jotMessageBody, jotMain, jotMessage, jotIconsArea, jotIconsEditIcon } = window.oMessengerSelectors.JOT,
			oJot = $(oObject).parents(jotMain),
			iJotId = oJot.data('id') || 0,
			sMessage = _this.oActiveEditQuill && _this.oActiveEditQuill.root.innerHTML.replace("<p><br></p>", "");

		if (!_this.oActiveEditQuill.getText().trim().length) {
			oJot.closest(jotMessageBody).addClass('hidden');
			return false;
		}

		if (sMessage.localeCompare(_this.lastEditText) === 0)
		{
			_this.cancelEdit(oObject);
			return false;
		}
		
		if (iJotId)
		{
			$.post('modules/?r=messenger/edit_jot', { jot: iJotId, message: sMessage  }, function({ code, html })
			{
				if (!parseInt(code))
				{
					$(jotMessage, oJot)
						.html(sMessage)
						.parent()
						.linkify(false, true) // update attachment for the message, but don't broadcast as new message 
						.end();

					if (!$(oJot).find(jotIconsEditIcon).length)
						$(oJot).find(jotIconsArea).prepend(html || '');

					const oInfo = {
									jot_id: iJotId,
									addon: 'edit'
								  };

					if (!_this.isBlockVersion())
						_this.upLotsPosition($.extend(oInfo, _this.oSettings));

					_this.broadcastMessage(oInfo);
				}
			}, 'json');
			
			return true;
		}
			
		return false;
	};

	oMessenger.prototype.cleanReplayArea = function(){
		const { textArea, replyAreaMessage } = window.oMessengerSelectors.TEXT_AREA;

		this.iReplyId = 0;
		
		$(replyAreaMessage, textArea)
			.empty()
			.parent()
			.hide();
				
		this.oStorage.deleteLotItem(this.oSettings.lot, 'reply');
	}
	
	oMessenger.prototype.getReplyPreview = function(iJotId){
		const
			{ jotMain, jotMessage } = window.oMessengerSelectors.JOT,
			oJot = $(`${jotMain}[data-id="${iJotId}"]`),
			  iMaxLength = oMUtils.isMobile() ? this.iMaxReplyLength/2 : this.iMaxReplyLength,
			  _this = this;
			  
		if (!oJot)
			return;
		
		let sMessage = oJot.find(jotMessage).text();
		if (sMessage.length){
			if (sMessage.length > iMaxLength)
				sMessage = sMessage.substr(0, iMaxLength) + '...';
			
			return sMessage;
		}
		
		const oFiles = $(_this.sAttachmentArea, oJot);
		if (oFiles){
			let oObject = null;					
			if (oFiles.find(`${_this.sAttachmentImages},${_this.sGiphyImages}`).length){
				oObject = oFiles.find(`${_this.sAttachmentImages} img, ${_this.sGiphyImages} img`).first();
			}
			else if (oFiles.find(_this.sVideoAttachment).length){
				sUrl = oFiles.find(`${_this.sVideoAttachment} video`).first().prop('poster');
				if (sUrl)
					oObject = $(`<img src="${sUrl}" />`);	
			}
			else if (oFiles.find(_this.sAudioAttachment).length)
				oObject = oFiles.find(`${_this.sAudioAttachment} .audio .title`).first();
			else if (oFiles.find(_this.sFileAttachment).length)
				oObject = oFiles.find(_this.sFileAttachment).first();
			
			return (oObject && oObject.clone()) || '...';
		}
		
		return '...';
	}

	oMessenger.prototype.replyJot = function(oObject, iJotId){
		const { textArea, replyAreaMessage } = window.oMessengerSelectors.TEXT_AREA,
			  { jotMain } = window.oMessengerSelectors.JOT,
			  oJot = $(oObject).closest(jotMain),
			 _this = this;

		if (!oJot.length){
			if (iJotId){
				$.post('modules/?r=messenger/get_jot_preview', { jot: iJotId }, function({ code, html })
				{
					if (!parseInt(code) && typeof fFunc === 'undefined')
						fFunc(html);

				}, 'json');
			}
			else
				return;
		}
		else
		{
			_this.iReplyId = oJot.data('id');
			$(replyAreaMessage, textArea)
				.html(_this.getReplyPreview(_this.iReplyId))
				.parent()
				.css('display', 'flex');

			_this.oStorage.saveLotItem(_this.oSettings.lot, _this.iReplyId, 'reply');
			if (_this.oEditor)
				setTimeout(() => _this.oEditor.focus(), 100);
		}
	}
	
	oMessenger.prototype.jumpToJot = function(iJumpJotId, fCallback){
		const iJotId = iJumpJotId ? iJumpJotId : this.iReplyId,
			 { jotMain, selectedJot } = window.oMessengerSelectors.JOT,
			  _this = this;

		if (iJotId){
			const oJot = $(`${jotMain}[data-id="${iJotId}"]`);
			if (oJot.length)
				this.updateScrollPosition('center', undefined, oJot, () => oJot.addClass(selectedJot.substr(1)));
			else 
			{
				this.iSelectedJot = iJotId;
				this.loadJotsForLot(this.oSettings.lot, iJotId, fCallback);
			}
		}
	}

	oMessenger.prototype.editJot = function(oObject){
		const { jotMain, jotMessage, jotMessageBody } = window.oMessengerSelectors.JOT,
			oJot = $(oObject).closest(jotMain),
			iJotId = oJot.data('id') || 0,
			_this = this;
		
		if ($(this.sEditJotArea).length)
			$(this.sEditJotArea).fadeOut().remove();

		oJot.closest(jotMessageBody).removeClass('hidden');
		if (iJotId)
		{
			bx_loading($(jotMessage, oJot).parent(), true);
			$.post('modules/?r=messenger/edit_jot_form', { jot: iJotId }, function({ code, html })
			{
				bx_loading($(jotMessage, oJot).parent(), false);
				if (!parseInt(code))
				{
					const sTmpText = $(jotMessage, oJot).html();
					_this.lastEditText = sTmpText.length ? sTmpText : $(_this.sEditJotAreaId, html).html();
					const updateScrollFunction = () => {
						const fMaxHeight = parseInt($(_this.sEditJotAreaId).css('max-height'));
						if (_this.oActiveEditQuill.root.clientHeight >= fMaxHeight)
							$(_this.sEditJotAreaId).css('overflow-y', 'auto');
						else
							$(_this.sEditJotAreaId).css('overflow-y', 'visible');
					};

					$(jotMessage, oJot)
						.html(html)
						.find(_this.sEditJotArea)
						.fadeIn('slow', function()
						{
							const __this = this;
							const oEditEditor = _this.initTextEditor({
								selector: _this.sEditJotAreaId,
								onEnter:() => {
									if (!(oMUtils.isMobileDevice() || oMUtils.isUnaMobileApp())) {
										_this.saveJot($(_this.sEditJotAreaId));
										_this.oEditor.focus();
										return true;
									}

									return false;
								},
								onChange: () => updateScrollFunction(),
								onESC: () => {
									_this.cancelEdit(__this);
									_this.oEditor.focus();
								}
							});

							_this.oActiveEditQuill = oEditEditor.oEditor;
							oEditEditor.focus();

							if (oJot.is(':last-child'))
								_this.updateScrollPosition('bottom');
						});
				}
			}, 'json');
		}
	};
	
	oMessenger.prototype.copyJotLink = function(oObject){
		const _this = this,
			{ jotMain } = window.oMessengerSelectors.JOT,
			  iJotId = $(oObject)
				.parents(jotMain)
				.data('id') || 0,
				oTextArea = document.createElement('textArea');

		// IOS mobile devices only
		if (_this.aPlatforms.includes(navigator.platform) && oMUtils.isMobileDevice()) {
			bx_prompt('&nbsp;', _this.sJotUrl + iJotId, () => {
				$('#bx-popup-prompt-value').get(0).setSelectionRange(0, 999999);
				if (document.queryCommandSupported("copy")) {
					document.execCommand('copy');
					$('#bx-popup-prompt').dolPopupHide();
					$('#bx-popup-prompt-value').get(0).blur();
				}
			}, undefined, {
				ok:{
					title: _t('_bx_messenger_share_jot')
				}
			});

			// iOS only selects "form" elements with SelectionRange
			return ;
		}

		oTextArea.readOnly = false;
		oTextArea.contentEditable = true;
		oTextArea.value = _this.sJotUrl + iJotId;
		document.body.appendChild(oTextArea);

		try {
			if (document.body.createTextRange) {// IE
				const oTextRange = document.body.createTextRange();
				oTextRange.moveToElementText(oTextArea);
				oTextRange.select();
				oTextRange.execCommand("Copy");
			} else if (window.getSelection && document.createRange) {// non-IE
				const oRange = document.createRange();
				oRange.selectNodeContents(oTextArea);
				const oSel = window.getSelection();
				oSel.removeAllRanges();
				oSel.addRange(oRange); // Does not work for Firefox if a textarea or input
				oTextArea.select(); // Firefox will only select a form element with select()

				if (document.queryCommandSupported("copy"))
					document.execCommand('copy');
			}
		}catch (e) {
			console.log(e.toString());
		}

		document.body.removeChild(oTextArea);
	};

	$.fn.setRandomBGColor = function() {
		$('img', this).each(function(){
			let hex = Math.floor(Math.random() * 0xFFFFFF);
			$(this).css('background-color', "#" + ("000000" + hex.toString(16)).substr(-6));
		});

		return this;
	};

	$.fn.bxMsgTime = function() {
		$(this)
			.bxTime()
			.find('time')
			.each(function(){
				$(this).prop('title', $(this).text());
			});

		return this;
	};

	/**
	* Convert plan text links/emails to urls, mailto
	*@param string sText text of the message
	*@param bool bDontBroadcast don't broadcast event as new message
	*@param bool bDontAddAttachment don't add repost link to the jot 
	*/
	$.fn.linkify = function(bDontAddAttachment, bDontBroadcast){
		const { jotMessage } = window.oMessengerSelectors.JOT;

		let sUrlPattern = /((https?):\/\/[^"<\s]+)(?![^<>]*>|[^"]*?<\/a)/gim,
		// www, http, https
			sPUrlPattern = /(^|[^\/"'])(www\.[\S]+(\b|$))/gim,
		// Email addresses
			sEmailPattern = /([\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6}))(?![^<>]*>|[^"]*?<\/a)/gim,
			sJotLinkPattern = new RegExp(_oMessenger.sJotUrl.replace('?', '\\?') + '\\d+', 'i');

		const oJot = $(jotMessage, this).first();
		if (!$(oJot).length)
			return this;

		let sUrl = '',
			sText = $(oJot)
				.html()
				.replace(sUrlPattern, function(str)
				{
					sUrl = str;
					return !sJotLinkPattern.test(str) ? _oMessenger.sEmbedTemplate.replace(/__url__/g, str) : `<a href="${str}">${str}</a>`;
				})
				.replace(sPUrlPattern, function(str, p1, p2)
				{
					sUrl = 'http://' + p2;
					return p1 + (!sJotLinkPattern.test(str) ? _oMessenger.sEmbedTemplate.replace(/__url__/g, p2) : `<a href="${p2}">${p2}</a>`);
				})
				.replace(sEmailPattern, str => `<a href="mailto:${str}">${str}</a>`);

		if (!sUrl){
			const aMatch = sText.match(/<a[^"](?!class="bx-mention[^"]*").*href="(https?:\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|])".*a>/);
			if (Array.isArray(aMatch) && aMatch.length >= 2)
				sUrl = aMatch[1];
		}

		$(oJot).html(sText);
		if ($(oJot).siblings(_oMessenger.sAttachmentArea).length)
			return this;
		
		if (sUrl.length)
		{
			if (!bDontBroadcast)
				_oMessenger.iAttachmentUpdate = true;
		
			$(oJot)
				.attacheLinkContent(sUrl, bDontAddAttachment,
				function()
				{
					if (!bDontBroadcast)
					{
						_oMessenger.broadcastMessage();
						_oMessenger.updateScrollPosition('bottom');
						_oMessenger.iAttachmentUpdate = false;
					}
				});
		}
		else
		{
			$(oJot)
				.siblings(_oMessenger.sAttachmentArea)
				.remove() /* remove attachment block if exists*/
		}

		return this;
	}
	
	/**
	* Add attachment for the urls
	*@param string sUrl internal or external link
	*@param bool bDontAddAttachment don't attached link to the message jot to parse on html page
	*@param function fCallback call when ajax request is completed 
	*@return object this
	*/
	$.fn.attacheLinkContent = function(sUrl, bDontAddAttachment, fCallback){
		const _this = this,
			{ jotMain } = window.oMessengerSelectors.JOT;

		$.post('modules/?r=messenger/parse_link',
			{
				link:sUrl,
				jot_id:$(_this)
						.parents(jotMain)
						.data('id'),
				dont_attach: !!bDontAddAttachment
			},
			function(oData)
			{
				if (!parseInt(oData.code))
					$(_this)
						.siblings(_oMessenger.sAttachmentBlock)
						.remove() /* remove attachment if exists */
						.end()
						.after(oData.html);
				
				if (typeof fCallback == 'function')
					fCallback();
			},
			'json');
			
		return this;
	}
	
	/**
	* Check for not processed videos and update them, if they are ready 
	*/
	oMessenger.prototype.updateProcessedMedia = function(){
		const _this = this,
			  fMedia = (sMediaType, sType) => document.createElement(sMediaType.toLowerCase()).canPlayType(sType),
			 { conversationBody } = window.oMessengerSelectors.HISTORY;

		let aMedia = [];

		$(this.sMediaATArea.join(','), conversationBody).each(
			function()
			{
				let __this = $(this);
				$(`${_this.sTmpVideoFile}, audio`, this).each(function(){
					if (!$('source', this).prop('src') || fMedia($(this).prop('tagName'), $('source', this).prop('type')) === '')
						aMedia.push($(__this).data('media-id'));
				});
			});
		
		if (aMedia.length)
			$.post('modules/?r=messenger/get_processed_media',{ media: aMedia },
			function(oData)
			{
				for(let i=0; i < aMedia.length; i++)
				{
					if (typeof oData[aMedia[i]] !== 'undefined') {
						$(`[data-media-id="${aMedia[i]}"] ${_this.sTmpVideoFile}`, conversationBody)
							.replaceWith(oData[aMedia[i]]);

						$('[data-media-id="' + aMedia[i] + '"] .audio .file', conversationBody)
							.replaceWith(oData[aMedia[i]]);
					}
				}
			}, 'json');
	}
		
	/**
	* Add attachment to the message
	*@param string sUrl internal or external link
	*@return object this
	*/
	oMessenger.prototype.attacheFiles = function(iJotId, bBottom = true, fCallback){
		const _this = this,
			{ talkListJotSelector } = window.oMessengerSelectors.JOT;
		_this.iAttachmentUpdate = true;
		$.post('modules/?r=messenger/get_attachment', { jot_id: iJotId}, function(oData)
		{
			if (!parseInt(oData['code']))
			{
				$(_this.sAttachmentArea, '[data-id="' + iJotId + '"]').remove();

				$(_this.sReactionsArea, '[data-id="' + iJotId + '"]')
					.before(
								$(oData['html'])
									.waitForImages(() => {
										if (typeof fCallback === 'function')
											fCallback();

										if (bBottom || $(talkListJotSelector).last().data('id') == iJotId)
											_this.updateScrollPosition('bottom');
									})
								);

				$('[data-id="' + iJotId + '"]').initJotIcons().initAccordion();
				_this.broadcastMessage();
			}
			
			_this.iAttachmentUpdate = false;
		},
		'json');
			
		return this;
	}

	/**
	* Select lot in left side column when member clicks on it
	*@param object oBlock selected lot
	*/
	oMessenger.prototype.selectLotEmit = function(oBlock){
		const { active, talkItemBubble, unreadLot, talkItemInfo } = window.oMessengerSelectors.TALKS_LIST;

		oBlock
			.addClass(active)
			.removeClass(unreadLot)
			.siblings()
			.removeClass(active)
			.end()
			.find(talkItemBubble)
			.addClass('hidden');
	}
	
	/**
	* Change page's favicon 
	*@param boolean bEnable 
	*/
	oMessenger.prototype.updatePageIcon = function(bEnable, iLot)
	{
		const { talksListItems } = window.oMessengerSelectors.TALKS_LIST,
			  iCurrentLot = $(talksListItems).first().data('lot');

		let iUnreadLotsCount = +this.oNotifications.inbox;

		if (iUnreadLotsCount === 1 && iLot === iCurrentLot && (!oMUtils.isMobile()))
			iUnreadLotsCount = 0;

		this.notifyNewUnreadChats(iUnreadLotsCount);

		$(document).prop('title', $(document).prop('title').replace(/\(\d\)$/g, ''));
		if (bEnable === true || iUnreadLotsCount) {
			$('link[rel="shortcut icon"]').attr('href', this.sInfoFavIcon);
			$(document).prop('title', $(document).prop('title') + ` (${iUnreadLotsCount})`);
		}
		else 
		if (bEnable === false || !iUnreadLotsCount)
			$('link[rel="shortcut icon"]').attr('href', this.sDefaultFavIcon);
	};
	
	$.fn.waitForImages = function(fCallback){
		const aImg = $(`${_oMessenger.sGiphyImages} img, ${_oMessenger.sAttachmentImages} img`, $(this));
		let iTotalImg = aImg.length;

		const waitImgLoad = () =>
			{
				iTotalImg--;
				if (!iTotalImg && typeof fCallback === 'function') {
					fCallback(this);
				}
			};

			if (!iTotalImg) {
				if (typeof fCallback === 'function')
					setTimeout(() => fCallback(this), 0);
			}
			else
				aImg.one('load',function(){
					waitImgLoad();
				}).each(function() {
					if(this.complete)
						$(this).load();
				});

		return this;
	};

    oMessenger.prototype.markJotsAsRead = function(iLotId, fCallback){
        $.post('modules/?r=messenger/mark_jots_as_read', { lot: iLotId }, function(oData){
            if (!parseInt(oData.code) && typeof fCallback === 'function')
                fCallback();
        }, 'json');
    };

    oMessenger.prototype.updateCounters = function(iNumber, bForceUpdate = false){
		const { talkItem } = window.oMessengerSelectors.TALKS_LIST,
			  { talkBlock, mainScrollArea, unreadJotsCounter } = window.oMessengerSelectors.HISTORY,
			  { talkListJotSelector } = window.oMessengerSelectors.JOT
			  iCounter = bForceUpdate ? iNumber : +$(unreadJotsCounter).text(),
			  { lot, area_type, group_id } = this.oSettings;

		if (!iCounter)
			$(unreadJotsCounter).hide();

		if (bForceUpdate) {
			$(unreadJotsCounter).text(iCounter);
			if (iCounter)
				$(unreadJotsCounter).show();
			else
			{
				const iScrollPosition = $(talkBlock).prop('scrollHeight') - $(talkBlock).prop('clientHeight') - $(talkBlock).scrollTop();
				const iHeight = $(talkListJotSelector).last().height();
				if (iScrollPosition <= iHeight)
					$(mainScrollArea).fadeOut();
			}
		}

		this.iUnreadJotsNumber = iCounter;

		if (!$(unreadJotsCounter).is(':visible')) {
			$(this).updateMenuBubbles(lot, { type:  area_type,  group_id }, false);
			this.selectLotEmit($(`[data-lot="${lot}"]${talkItem}`));
		}
	}

    oMessenger.prototype.broadcastView = function(iJotId){
		const
			  { conversationBody } = window.oMessengerSelectors.HISTORY,
			  { talkListJotSelector } = window.oMessengerSelectors.JOT,
			  iLastJotId = $(talkListJotSelector).last().data('id'),
			  iJot = iLastJotId === this.iLastReadJotId ? iLastJotId : this.iLastUnreadJot,
			  oJot = $(`[data-id="${iJot}"]`, conversationBody);

		if (!+oJot.data('my') && +oJot.data('new')) {
			$.get('modules/?r=messenger/viewed_jot', { jot_id: iJot }, ({ unread_jots, last_unread_jot }) => {
				this.updateCounters(unread_jots, true);
				this.iLastUnreadJot = last_unread_jot;
			}, 'json');

			oJot.data('new', 0);

			return this.broadcastMessage({
				jot_id: iJot,
				addon: 'check_viewed'
			});
		}

		return;
    };

	oMessenger.prototype.showSearchCounter = function(iLotId){
		const _this = this,
			 { searchCriteria } = window.oMessengerSelectors.TALKS_LIST,
			 { searchItems, searchScrollArea } = window.oMessengerSelectors.HISTORY,
			 oObject = $(searchScrollArea);

		if (!$(searchCriteria).val().length) {
			oObject.find(searchItems).text(0).end().fadeOut();
			return false;
		}

		let iCounter = 0;
		if ($(searchCriteria).val().length && _this.aSearchJotsList !== null){
			if (typeof _this.aSearchJotsList[iLotId] !== 'undefined'){
				const { list } = _this.aSearchJotsList[iLotId] || {};
				iCounter = list?.length;
			}
		}

		if (iCounter)
			oObject.fadeIn();
		else
			oObject.fadeOut();

		oObject.find(searchItems).text(iCounter);
		return false;
	}

	oMessenger.prototype.editOnClick = function(){
		const _this = this,
			{ bxTitle } = window.oMessengerSelectors.SYSTEM,
			{ messengerHistoryBlock } = window.oMessengerSelectors.HISTORY;

		if (!oMUtils.isMobile())
			$(bxTitle, messengerHistoryBlock).dblclick(() => _this.createList('edit'));
	}

	/**
	 * Load history for selected lot
	 * @param iLotId
	 * @param iJotId
	 * @param bDontChangeCol
	 * @param fCallback
	 * @param bMarkAsRead
	 */
	oMessenger.prototype.loadTalk = function(iLotId, iJotId, fCallback = null, bMarkAsRead = false){
		const _this = this,
			{ mainTalkBlock, messengerHistoryBlock, createTalkArea, tableWrapper, conversationBlockHistory, historyColumn, talkBlock, conversationBody, selectedJot } = window.oMessengerSelectors.HISTORY,
			{ talksListItems, talkItem } = window.oMessengerSelectors.TALKS_LIST,
			{ textArea } = window.oMessengerSelectors.TEXT_AREA,
			{ groupsPanel } = window.oMessengerSelectors.TALK_BLOCK,
			{ talkListJotSelector, jotMain } = window.oMessengerSelectors.JOT,
			{ blockHeader, blockContainer } = window.oMessengerSelectors.SYSTEM,
			{ lot, area_type } = this.oSettings,
			 oLotBlock = $(`[data-lot="${iLotId}"]${talkItem}`),
			fEmpty = { done: (r) => r()};

		if (!iLotId)
			return fEmpty;

		if (_this.isBlockVersion()) {
			_this.oMenu.toggleBlockGroupsPanel();
			$(historyColumn).html('');
		} else
		{
			_this.selectLotEmit(oLotBlock);
			if (oLotBlock){
				if (oMUtils.isMobile()) {
					if (!_this.oMenu.isHistoryColActive())
						_this.oMenu.showHistoryPanel();
				}

				_this.updateScrollPosition('bottom');
				$(`${blockHeader}, ${talkBlock}`, historyColumn).html('');
			}
		}

		_this.disableCreateList();

        // to change active lot ID in the same time when user click on load but not when history is loaded
		_this.oSettings.lot = iLotId;
		_this.blockSendMessages(true);

		$(_this.sDateNavigator).hide();
		bx_loading($(conversationBlockHistory), true);
		return $.post('modules/?r=messenger/load_talk', { lot_id: iLotId, jot_id: iJotId, mark_as_read: +bMarkAsRead, area_type, is_block: _this.isBlockVersion() },
			function({ title, history, header, code, unread_jots, last_unread_jot, text_area, muted, talks_list, params })
		{
			if (~code)
			{
				_this.iMuted = +muted;
				_this.blockSendMessages(false);

				const oMessengerBlock = $(messengerHistoryBlock).length ? messengerHistoryBlock : $(mainTalkBlock).closest(blockContainer);
				if (typeof text_area !== 'undefined' && text_area.length){
					if (!$(textArea, oMessengerBlock).length)
					$(tableWrapper, oMessengerBlock).append(text_area);
				else
					$(tableWrapper, oMessengerBlock).find(textArea).replaceWith(text_area);
				} else
					$(tableWrapper, oMessengerBlock).find(textArea).remove();

				$(talkBlock).css('visibility', 'hidden');
				$(oMessengerBlock)
						.find(blockHeader)
						.replaceWith(header)
						.end()
						.find(talkBlock)
						.html(history)
						.bxProcessHtml()
						.end()
						.bxMsgTime()
						.show(
							function(){
								_this.setPositionOnSelectedJot();
								_this.updateLotSettings({
									lot: iLotId,
									last_unread_jot,
									unread_jots,
									group_id: +params?.group_id || 0,
									title
								});

								_this.updateCounters(unread_jots, true);
								_this.updatePageIcon(undefined, iLotId);
							}
						)
						.waitForImages(() => {
							_this.setPositionOnSelectedJot(() => {
								bx_loading($(conversationBlockHistory), false);
								$(talkBlock).css('visibility', 'visible');
								if (typeof fCallback === 'function')
									fCallback();
							});
						});

					if (talks_list){
						$(oMessengerBlock)
							.find(groupsPanel)
							.replaceWith(talks_list)	
					}
					
					if (typeof title !== 'undefined')
						$(document).prop('title', title);

					if (oLotBlock)
						_this.setUsersStatuses(oLotBlock);

					if (+$(talkListJotSelector).last().data('new')) {
						if (!_this.iLastUnreadJot || $(selectedJot, conversationBody).nextAll(jotMain).length < _this.iMaxHistory/2)
						_this.broadcastView($(talkListJotSelector).last().data('id'));
					}

					if (_this.oFilesUploader)
						_this.oFilesUploader.removeInstances();

					// init text area
					_this.initTextArea();
					_this.oSendPool = new Map();

					if (_this.oEditor && !oMUtils.isMobile())
						setTimeout(() => _this.oEditor.focus(), 1000);

					_this.showSearchCounter(iLotId);

				/* ----  End ---- */
				} else
					bx_loading($(conversationBlockHistory), false);

		}, 'json');
	};

	oMessenger.prototype.onReplyInThread = function(oObject){
		const _this = this,
			{ jotMain } = window.oMessengerSelectors.JOT,
			{ blockHeader } = window.oMessengerSelectors.SYSTEM,
			{ conversationBlockHistory, historyColumn, talkBlock } = window.oMessengerSelectors.HISTORY,
			oJot = $(oObject).closest(jotMain);

		if (oMUtils.isMobile()) {
			_this.oMenu.showHistoryPanel();
			$(`${blockHeader}, ${talkBlock}`, historyColumn).html('');
		}

		// to change active lot ID in the same time when user click on load but not when history is loaded
		_this.blockSendMessages(true);
		bx_loading($(conversationBlockHistory), true);

		$.post('modules/?r=messenger/load_thread_talk', { jot_id: oJot.data('id') }, function({ history, header, code, text_area, top_area, lot }){
			bx_loading($(conversationBlockHistory), false);
			if (+code || !+lot)
				return false;

			return _this.loadTalk(lot);
		}, 'json');
	}

	oMessenger.prototype.loadJotsForLot = function(iLotId, iJotId, fCallback){
		const _this = this,
			 { talkBlock, mainTalkBlock } = window.oMessengerSelectors.HISTORY;
		
		bx_loading($(mainTalkBlock), true);
		$.post('modules/?r=messenger/load_jots', { id: iLotId, jot_id: iJotId }, function({ code, history }){
			bx_loading($(mainTalkBlock), false);
			if (code === 1)
					window.location.reload();
						
			if (!parseInt(code))
			{
				$(mainTalkBlock)
					.find(talkBlock)
					.html(history)
					.end()
					.bxMsgTime()
					.waitForImages(() => _this.updateScrollPosition(iJotId ? 'position' : 'bottom', 'fast', $(`[data-id="${iJotId}"]`)));

					if (typeof fCallback == 'function')
						fCallback();
			}
		}, 'json');	
	}
	/**
	 * Main send message function, occurs when member send message
	 * @param string sMessage text of the message
	 * @param object mixedObjects, it may be array of files or object with elements
	 * @param function fCallBack
	 */
	oMessenger.prototype.sendMessage = function(sMessage, mixedObjects, fCallBack){
		const _this = this,
			oParams = Object.assign({}, this.oSettings, _this.getSendAreaAttachmentsIds()),
			msgTime = new Date(),
			{ talkTitle, textArea, replyAreaMessage, replyArea } = window.oMessengerSelectors.TEXT_AREA,
			{ conversationBody, messengerHistoryBlock, uploaderAreaPlaceholderPrefix } = window.oMessengerSelectors.HISTORY,
			{ blockHeader, blockContainer } = window.oMessengerSelectors.SYSTEM,
			{ threadReplies } = window.oMessengerSelectors.THREAD,
			{ talkListJotSelector, jotMessageBody, jotMain, jotContainer, jotMessage, jotTitle, jotAvatar } = window.oMessengerSelectors.JOT;

		oParams.tmp_id = msgTime.getTime();
		if (_this.oFilesUploader) {
			oParams.files = _this.oFilesUploader.getAllFiles();

			if (oParams.files.length && !_this.oFilesUploader.isReady())
				_this.aUploaderQueue[_this.oFilesUploader.name()] = { id: oParams.tmp_id, lot: this.oSettings.lot };
		}

		if (typeof mixedObjects !== 'undefined' && Array.isArray(mixedObjects.files))
			oParams.files = mixedObjects.files;
		
		if (_this.iThreadId)
			oParams.parent = _this.iThreadId;
				
		oParams.participants = _this.getParticipantsList();

		oParams.message = $.trim(sMessage);
		if (!oParams.message.length && !oParams.files.length && typeof oParams.giphy === 'undefined')
			return;
				
		// talk's title instead of users list
		if ($(talkTitle).length)
			oParams.title = $(talkTitle).val();

		// remove MSG (if it exists) from clean history page
		if ($(blockContainer, conversationBody).length)
				$(blockContainer, conversationBody).remove();

		if (oParams.message.length > this.iMaxLength) 
			oParams.message = oParams.message.substr(0, this.iMaxLength);

		if ((oParams.message || oParams.files.length || (typeof oParams.giphy !== 'undefined' && oParams.giphy.length)) && _this.bAllowAttachMessages)
		{
			let sUploadingArea = '';
			if (_this.oFilesUploader && oParams.files.length && !_this.oFilesUploader.isReady())
				sUploadingArea = `<div class="${uploaderAreaPlaceholderPrefix}" id="${uploaderAreaPlaceholderPrefix}-${oParams.tmp_id}"></div>`;

			const oUserTemplate = _this.oUsersTemplate.clone();
			if (oParams.message.length)
				oUserTemplate.find(jotMessageBody).removeClass('hidden');

			if (_this.iReplyId){
				const sContent = $(replyAreaMessage, textArea).html();
				oUserTemplate.html(
									oUserTemplate
										.html()
										.replace(/{reply_message}/g, sContent)
										.replace(/{reply_parent_id}/g, _this.iReplyId)
								  )
							  .find(replyArea)
							  .css('display', 'flex');
			}
			 else 
				$(oUserTemplate).find(replyArea).remove();

			if ($(talkListJotSelector).last().data('my')) {
					$(oUserTemplate)
						.removeClass('pt-4')
						.find(jotTitle)
						.remove()
						.end()
						.find(jotAvatar)
						.children()
						.remove();
			}

			const sContent = $(oUserTemplate)
									.find(jotMessage)
									.html()
									.replace('{message}', oParams.message || '');


			// append content of the message to the history page
			if (!_this.bCreateNew)
				$(conversationBody)
						.append(oUserTemplate
									.attr('data-tmp', oParams.tmp_id)
									.find(jotMessage)
									.html(sContent)
									.fadeIn('slow')
									.end()
									.find(jotContainer)
									.append(sUploadingArea)
									.end()
								);

			const oLastLine = $(oUserTemplate).find('span.time').prev('p');
			if (oLastLine.length)
				$(oUserTemplate).find('span.time').appendTo(oLastLine);

			if (sUploadingArea.length) {
				_this.oFilesUploader.move(`#${uploaderAreaPlaceholderPrefix}-${oParams.tmp_id}`);
				_this.createFilesUploader();
			}

			$('[data-tmp="' + oParams.tmp_id + '"]').initJotIcons();
		}

		if (_this.iReplyId && $(replyAreaMessage).length){
			oParams.reply = +_this.iReplyId;
			_this.cleanReplayArea();
		}

		if (_this.bCreateNew) {
			oParams.lot = 0;
			if (!['groups'].includes(_this.oSettings.area_type)) {
				oParams.group_id = 0;
			}

			const aBroadcastData = oMUtils.getBroadcastFields();
			if (Object.keys(aBroadcastData).length)
				oParams['broadcast'] = aBroadcastData;
		}
			else
		{
			if (!+_this.oSettings.lot){
				if (!oParams.participants.length) {
					if (+_this.iSelectedPersonToTalk) {
						oParams.participants.push(_this.iSelectedPersonToTalk);
						_this.iSelectedPersonToTalk = 0;
					} else {
						bx_alert(_t('_bx_messenger_lot_parts_empty'));
						return ;
					}
				}

				oParams.type = _this.iLotType;
			}
		}

		_this.updateScrollPosition('bottom');
		// save message to database and broadcast to all participants
		_this.oSendPool.set( oParams.tmp_id, { 'promise': null, 'run': () => $.post('modules/?r=messenger/send', oParams, function ({
																						jot_id, header,
																						tmp_id, message,
																						code, time, lot_id, separator
																						}) {
					switch (parseInt(code)) {
						case 0:
							const iJotId = parseInt(jot_id), sTime = time || msgTime.toISOString();

							if (iJotId) {
								if (typeof tmp_id !== 'undefined') {
									Object.keys(_this.aUploaderQueue).map((sKey) => {
										if (+_this.aUploaderQueue[sKey].id === +tmp_id) {
											_this.aUploaderQueue[sKey].uploading_jot_id = jot_id;
										}
									});
								}

								if (typeof lot_id !== 'undefined') {
									if (typeof header !== 'undefined')
										$(messengerHistoryBlock)
											.find(blockHeader)
											.replaceWith(header);

									_this.updateLotSettings({ lot: +lot_id });
									_this.updateTalksListArea();

									const fLoadTalksCallback = () => _this.loadTalk(lot_id, undefined, () => {
																												if (!_this.isBlockVersion())
																													_this.upLotsPosition(_this.oSettings);
																											 });

									if (!['inbox', 'direct', 'groups'].includes(_this.oSettings.area_type))
										return _this.loadTalksListByParam({ group : 'direct' }, fLoadTalksCallback);
									else
										return fLoadTalksCallback();
								}

								if (!_this.isBlockVersion())
									_this.upLotsPosition(_this.oSettings);

								if (typeof tmp_id !== 'undefined') {
									$('[data-tmp="' + tmp_id + '"]', conversationBody)
										.data('id', jot_id)
										.attr('data-id', jot_id)
										.find('time')
										.html('')
										.attr('datetime', sTime)
										.closest(jotMain)
										.bxMsgTime()
										.bxProcessHtml()
										.linkify()
										.find('.time > img')
										.remove()
										.end()
										.find('div[id^="jot-menu-"]')
										.attr('id', `jot-menu-${jot_id}`);
								}

								if (typeof separator !== 'undefined'){
									$('[data-tmp="' + tmp_id + '"]', conversationBody).before($(separator).bxTime());
									_this.updateScrollPosition('bottom');
								}

								if ((_this.oFilesUploader && oParams.files && _this.oFilesUploader.isReady()) || typeof oParams.giphy !== 'undefined')
									_this.attacheFiles(iJotId);

							}
							
							if (_this.iThreadId && $(threadReplies).length){
								let iCounter = parseInt($('>span', threadReplies).text());
								$('>span', threadReplies).text(++iCounter);
							}
							
							if (!_this.iAttachmentUpdate){
								_this.broadcastMessage({
									addon: {
										jot_id: jot_id
									}
								});
							}
							break;

						default:
							if (message) {
								bx_alert(message);

								if (_this.bCreateNew) { // in case if an error occurs during talk creation
									_this.oSendPool.delete(oParams.tmp_id);
									_this.oEditor.setContents(_this.aTmpContent.ops);

									if (_this.oPrevSettings !== null)
										_this.updateLotSettings(_this.oPrevSettings);

									return;
								}

								$(`[data-tmp="${oParams.tmp_id}"]`, conversationBody).remove();
							} else
								window.location.reload();

							_this.setStorageData();
							break;
					}

					if (typeof fCallBack == 'function')
						fCallBack(jot_id);

				}, 'json')
				.done(() => {
					if (_this.oSendPool.has(oParams.tmp_id)) {
						_this.oSendPool.delete(oParams.tmp_id);
						if (_this.oSendPool.size && !+$(`[data-tmp="${oParams.tmp_id}"]`).data('retry'))
							for (let sTmp of _this.oSendPool.keys()) {
								if (!$(`[data-tmp="${sTmp}"]`).data('retry')){
										const oThread = _this.oSendPool.get(sTmp);
										if (oThread.promise === null)
											oThread.promise = oThread.run();
									break;
								}
							}
					}
				})
				.fail(() => {
					for (let sTmp of _this.oSendPool.keys()) {
						$(_this.sJotMessageTitle, $(`[data-tmp="${sTmp}"]`))
							.find('time img')
							.replaceWith(
								$(`<a href="javascript:void(0);" class="bx-messenger-send-retry bx-form-warn">
									<i class="sys-icon exclamation-circle"></i>
							  		</a>`)
									.on('click', function(){
										if (_this.oSendPool.has(sTmp)) {
											const oThread = _this.oSendPool.get(sTmp);
											oThread.promise = oThread.run();

											$(`[data-tmp="${sTmp}"]`)
												.find('time')
												.html(_this.sJotSpinner);
										}
									})
							)
							.end()
							.closest(jotMain)
							.data('retry', true);
					}
				})});

		// in case if there are some not sent messages, find the first just sent
		let bRetry = false, iNewCount = 0;
		if  (_this.oSendPool.size > 1){
			for (let sTmp of _this.oSendPool.keys()) {
				if (+$(`[data-tmp="${sTmp}"]`).data('retry'))
					bRetry = true;
				else
					iNewCount++;
			}
		}

		if (_this.oSendPool.size === 1 || (bRetry && iNewCount === 1)) {
			const oThread = _this.oSendPool.get(oParams.tmp_id);
			if (oThread.promise === null) {
				if (_this.bCreateNew)
					bx_confirm(_t('_bx_messenger_create_talk_confirm'), () => {
						_this.oPrevSettings = Object.assign({}, _this.oSettings);
						_this.updateLotSettings({ title: oParams.title || '', lot: 0, group_id: oParams.group_id });
						oThread.promise = oThread.run();
					},
					() =>
					{
						/* delete _this.aUploaderQueue[_this.oFilesUploader.name()]; */

						_this.oSendPool.delete(oParams.tmp_id);
						_this.oEditor.setContents(_this.aTmpContent.ops);
					});
				else
					oThread.promise = oThread.run();
			}
		}

		return true;
	};

	oMessenger.prototype.broadcastMessage = function(oInfo){
		const oMessage = Object.assign({
												lot: this.oSettings.lot,
												name: this.oSettings.name,
												user_id: this.oSettings.user_id
											 }, oInfo || {});

		if (this.oRTWSF !== undefined)
			this.oRTWSF.message(oMessage);
	};
	
	/**
	* Get all participants from users selector area
	*/
	oMessenger.prototype.getParticipantsList = function(){
		const list = [],
			{ selectedUsersListInputs } = window.oMessengerSelectors.CREATE_TALK;
		
		if ($(selectedUsersListInputs).length){
			$(selectedUsersListInputs).each(function(){
				list.push($(this).val());
			});
		}
		
		return list;
	};

	oMessenger.prototype.stopActiveSound = function() {
		if (this.oActiveAudioInstance) {
			this.oActiveAudioInstance.stop();
			this.oActiveAudioInstance.destroy();
			this.oActiveAudioInstance = null;
		}
	};

	oMessenger.prototype.getVideoCall = function({ lot, vc, user_id }){
		const _this = this;

		if (!lot)
			return false;

		switch(vc){
				case 'start':
					if (!$(_this.sJitsiMain).length && (!_oMessenger.isBlockVersion() || (_oMessenger.isBlockVersion() && _oMessenger.oSettings.lot === lot)))
						$.get('modules/?r=messenger/get_call_popup', { lot },
							function (oData) {
								if (!oData.code) {
									processJsonData(oData);
									_this.playSound('call', true);
									_this.broadcastMessage({
										lot: lot,
										addon: 'vc',
										type: 'vc',
										vc: 'got'
									});

									if (typeof(_this.aJitisActiveUsers[lot]) === 'undefined')
										_this.aJitisActiveUsers[lot] =  { owner: user_id, got: 0 };
									else
										_this.aJitisActiveUsers[lot].owner = user_id;
								}
							}, 'json');
				break;
				case 'stop':
					if (typeof(_this.aJitisActiveUsers[lot]) !== 'undefined') {
						if ($(`div[data-conferance='${lot}']`).length && _this.aJitisActiveUsers[lot].owner === user_id) {
							_this.onCloseCallPopup($(`div[data-conferance='${lot}']`), lot);
						}
					}
					break;
				case 'got':
					if (typeof(_this.aJitisActiveUsers[lot]) !== 'undefined')
				        _this.aJitisActiveUsers[lot].got++;
					else
						_this.aJitisActiveUsers[lot] =  { owner: 0, got: 1 };

					break;
				case 'break':
                    if (typeof(_this.aJitisActiveUsers[lot]) !== 'undefined') {
                    	if (+_this.aJitisActiveUsers[lot].got)
                    		 _this.aJitisActiveUsers[lot].got--;

                        if (!_this.aJitisActiveUsers[lot].got && _this.aJitisActiveUsers[lot].owner === _this.oSettings.user_id) {
                            _this.closeJitsi(_this.sJitsiMain, lot);
                            _this.beep();
                        }
                    }
				break;
				case 'join':
					_this.stopActiveSound();
				break;
		}
	};
	
	/**
	* Move lot's brief to the top of the left side when new message received or just update brief message
	*@param object oObject lot's settings
	*/
	oMessenger.prototype.upLotsPosition = function(oObject, bSilentMode = false){
		const _this = this,
			{ lot, addon } = oObject,
			{ talksListItems, talksList, topItem, talkItem } = window.oMessengerSelectors.TALKS_LIST,
			{ msgContainer } = window.oMessengerSelectors.SYSTEM;

		if (this.iThreadId)
			return;

		let	oLot = $('[data-lot=' + lot + ']');
		if (addon === 'remove_lot' && oLot.length) {
			oLot.fadeOut().remove();
			if ($(talksListItems).length)
				$(talksListItems).first().click();

			return;
		}

		if (typeof addon === 'string' && addon !== 'delete')
			return;

		$.get('modules/?r=messenger/update_lot_brief', { lot_id: lot },
				function({ html, code, muted, params })
				{
					if (+code)
						return ;

					if (typeof params !== 'undefined' && lot !== _this.oSettings.lot) {
						if (!bSilentMode)
							$(_this).updateMenuBubbles(lot, params);

						const { type, group_id } = params,
							  { area_type } = _this.oSettings;
						if ( type !== area_type && area_type !== 'inbox')
							return;
						else
							if (area_type === 'groups' && type === 'groups' && +group_id !== +_this.oSettings.group_id)
							return;
					}

					const sHtml = html.replace(new RegExp(_this.sJotUrl + '\\d+', 'i'), _t('_bx_messenger_repost_message')),
						oNewLot = $(sHtml).css('display', 'flex');

					if ($(msgContainer, talksList).length)
						$(msgContainer, talksList).remove();

						const sFunc = () =>	{
												const oUpdatedLot = $(oNewLot).bxMsgTime().fadeIn('slow');
												if ($(topItem).length)
													$(topItem)
														.after(oUpdatedLot);
												else
													$('> ul', talksList)
														.prepend(oUpdatedLot);

												if (+lot === +_this.oSettings.lot)
													_this.oMenu.toggleMenuItem(`${talkItem}[data-lot="${lot}"]`);

												_this.updatePageIcon();

											};
						if ($(`[data-lot='${lot}']`).length)
							$(`[data-lot='${lot}']`).fadeOut('slow', () => {
														$(`[data-lot='${lot}']`).remove();
														 sFunc();
													 });
							else
								sFunc();

					_this.setUsersStatuses(oLot);
					if (typeof addon === 'undefined' || typeof addon === 'object') /* only for new messages */
					{
						if (!bSilentMode && !muted)
							$(_this).trigger(jQuery.Event('message'));

					}

				}, 'json');
	};

	oMessenger.prototype.notifyNewUnreadChats = function(iNewNumberOfUnreadChats) {
		if (typeof window.glBxMessengerOnNotificationChange !== 'undefined' && window.glBxMessengerOnNotificationChange instanceof Array) {
			for (let i = 0; i < window.glBxMessengerOnNotificationChange.length; i++)
				if (typeof window.glBxMessengerOnNotificationChange[i] === "function")
					window.glBxMessengerOnNotificationChange[i](iNewNumberOfUnreadChats);
		}
	};
	
	/**
	* Show member's typing area when member is typing a message
	*@param object oData profile info
	*/
	oMessenger.prototype.showTyping = function({ name, lot }) {
		const _this = this,
			sName = name ? name.toLowerCase() : '',
			{ infoArea, typingInfoArea } = window.oMessengerSelectors.HISTORY_INFO;
	
		if (this.isActiveLot(lot))
		{			
			if (!~this.aUsers.indexOf(sName)) 
							this.aUsers.push(sName);
			
			$(typingInfoArea).text(this.aUsers.join(','));
			$(infoArea).fadeIn();
		}
		
		clearTimeout(this.iTimer);	
		this.iTimer = setTimeout(function(){
			$(infoArea)
			.fadeOut()
				.find(typingInfoArea)
			.html('');
			
			_this.aUsers = [];

		}, _this.iTypingUsersTitleHide);
	};
	
	oMessenger.prototype.onReconnecting = function(oData) {	
		const _this = this,
			{ infoArea, typingInfoArea, connectingArea } = window.oMessengerSelectors.HISTORY_INFO;
			
		$(infoArea).fadeIn();
		$(typingInfoArea).parent().hide();
		$(connectingArea).show();
		$(' > span', connectingArea).html('');
		
		this.blockSendMessages(true);
		clearInterval(this.iTimer);	

		this.iTimer = setInterval(function(){
			let sHTML = $(' > span', connectingArea).html();
			sHTML += '.';
			$(' > span', connectingArea).html(sHTML);
		}, 1000);		
	};
	
	oMessenger.prototype.onReconnected = function(oData) {	
		const _this = this,
			{ infoArea, typingInfoArea, connectingArea } = window.oMessengerSelectors.HISTORY_INFO;

		$(connectingArea).hide();
		$(infoArea).fadeOut();
		$(typingInfoArea).parent().show();
		
		clearInterval(this.iTimer);
		this.blockSendMessages(false);
		this.updateJots({
			action: 'msg'
		});

		const { lot, area_type, group_id } = this.oSettings;
		this.loadTalksListByParam({ group: area_type, id: group_id }, () => {
			if (lot) {
				const { talkItem } = window.oMessengerSelectors.TALKS_LIST;
				_this.selectLotEmit($(`[data-lot="${lot}"]${talkItem}`));
			}
		});
	};
	
	oMessenger.prototype.onReconnectFailed = function(oData) {	
		const { connectingArea, connectionFailedArea } = window.oMessengerSelectors.HISTORY_INFO;
		$(connectingArea).hide();
		$(connectionFailedArea).fadeIn();
		
		clearInterval(this.iTimer);
	};	
	
	/**
	* Check if specified lot is currently active
	*@param int iId profile id 
	*@return boolean
	*/
	oMessenger.prototype.isActiveLot = function(iId, sArea = false){
		const { lot, area_type } = this.oSettings;

		return iId && +lot === +iId && ((sArea !== false && sArea === area_type) || sArea === false);
	}

	oMessenger.prototype.isViewInBottomPosition = function(){
		const { talkBlock } = window.oMessengerSelectors.HISTORY,
			  oTalkBlock = $(talkBlock),
			  iHeight = oTalkBlock.prop('scrollHeight'),
			  iClient = oTalkBlock.prop('clientHeight'),
			  _this = this;

		if (iHeight > iClient){
			const iCurrentScrollHeight = iHeight - iClient;
			const iCurrentScrollPos = oTalkBlock.scrollTop();

			if ((iCurrentScrollHeight - iCurrentScrollPos) > iClient)
				return false;
		}

		return true;
	}
	/**
	* Correct scroll position in history area depends on loaded messages (old history or new just received)
	*@param string sPosition position name
	*@param string sEff name of the effect for load 
	*@param object oObject any history item near which to place the scroll 
	*@param function fCallback executes when scrolling complete
	*/
	oMessenger.prototype.updateScrollPosition = function(sPosition, sEff, mixedObject, fCallback){
		const sEffect = sEff,
			 { talkBlock } = window.oMessengerSelectors.HISTORY,
			 { talkListJotSelector } = window.oMessengerSelectors.JOT,
			 iHeight = $(talkBlock).prop('scrollHeight');


		let iPosition = 0;
		switch(sPosition){
			case 'top':
					if (mixedObject && typeof mixedObject[0].scrollIntoView === 'function') {
						mixedObject[0].scrollIntoView({behavior: 'auto', block: 'start'});

						if (typeof fCallback === 'function')
							setTimeout(() => fCallback(), 200);

						return;
					}

					const { pos } = mixedObject || {};
					iPosition = pos ? pos : 0;

					break;
			case 'bottom':
					const oLast = mixedObject && mixedObject[0] && typeof mixedObject[0].scrollIntoView === 'function' ? mixedObject[0] : $(talkListJotSelector).last()[0];
					if (typeof oLast !=='undefined' && typeof oLast.scrollIntoView === 'function' && !sEff) {
						$(talkListJotSelector).last()[0].scrollIntoView({behavior: 'auto', block: 'end'});

						if (typeof fCallback === 'function')
							setTimeout(() => fCallback(), 200);

						return;
					}

					iPosition = iHeight;
					break;
			case 'position':
					iPosition = typeof mixedObject !== 'undefined' ? mixedObject.position().top : 0;
					break;
			case 'center':
					const oJot = mixedObject[0];
					if (oJot && typeof oJot.scrollIntoView === 'function') {
						oJot.scrollIntoView({behavior: 'auto', block: 'center'});

						if (typeof fCallback === 'function')
							setTimeout(() => fCallback(), 200);

						return;
					}

					iPosition = mixedObject.position().top - $(talkBlock).prop('clientHeight')/2;
					break;
			case 'freeze':
					iPosition = $(talkBlock).scrollTop();
					break;
		}

		if (sEffect !== 'slow') {
			setTimeout(() => {
				$(talkBlock).scrollTop(iPosition);
				if (typeof fCallback === 'function')
					fCallback();
			}, 0);
		}
		else
			$(talkBlock).animate({
											scrollTop: iPosition,
										 }, sEffect === 'slow' ? this.iScrollDownSpeed : 0,
										 typeof fCallback === 'function' ? fCallback : function(){});
	}
	
	/**
	* Sound when message received
	*/
	oMessenger.prototype.beep = function(){
		if (!document.hasFocus())
		{
			if (!this.iMuted)
				this.playSound('incomingMessage');

			this.updatePageIcon(true);
		}
	};

	oMessenger.prototype.getSendAreaAttachmentsIds = function(sSelector = '', bClean = true){
		const oObject = { length: 0 },
			{ attachmentArea } = window.oMessengerSelectors.TEXT_AREA;

		$(`${sSelector}${attachmentArea}`)
			.children()
			.each(function(){
				const oPicture = $('picture', $(this)),
				 	  iId = $(oPicture).data('id'),
					  sType = $(oPicture).data('type');

				if (iId && sType) {
					if (typeof oObject[sType] === 'undefined' || !Array.isArray(oObject[sType]))
						oObject[sType] = [];

					oObject[sType].push(iId);
					oObject.length++;
				}
			});

		if (bClean === true)
			$(`${sSelector}${attachmentArea}`).html('');

		return oObject;
	};

	/**
	* Update history area, occurs when new messages are received(move scroll to the very bottom) or member loads the history(move scroll to the very top)
	*@param object oAction info about an action
	*/
	oMessenger.prototype.updateJots = function(oAction, bSilentMode = false){
		const _this = this,
			{ talkBlock, conversationBody } = window.oMessengerSelectors.HISTORY,
			{ talkListJotSelector, jotMain, jotMessage, jotMessageView } = window.oMessengerSelectors.JOT,
			{ addon, position, action, last_viewed_jot, callback, jot_id, user_id } = oAction;

		let sAction = typeof addon === 'string' ? addon : (action !== 'msg' ? action : 'new'),
			iRequestJot = 0,
			iJotId = 0;

		const sPosition = position || (sAction === 'new' ? 'bottom' : 'position'),
			oObjects = $(talkListJotSelector);

		if (this.iThreadId)
			return;

		switch(sAction)
		{
			case 'update_attachment':
					if (+_this.oSettings.user_id !== +user_id)
						_this.attacheFiles(jot_id);
				return;
			case 'check_viewed':
			case 'reaction':
			case 'delete':
			case 'edit':
			case 'vc':
					iJotId = jot_id || 0;
					break;
			case 'clear':
				  return $(conversationBody).html('');
			case 'prev':
				iJotId = oObjects
					.first()
					.data('id');

				break;
			case 'new':
				iRequestJot = (typeof addon === 'object' && typeof addon.jot_id !== 'undefined' ? addon.jot_id : 0);
				if (!oObjects.length)
					sAction = 'all';
			default:
				iJotId = oObjects
					.last()
					.data('id');
		}

		const iLotId = _this.oSettings.lot; // additional check for case when ajax request is not finished yet but another talk is selected

		if (sAction === 'prev' || (sAction === 'new' && _this.iSelectedJot)) {
			bx_loading($(`[data-id="${iJotId}"]${jotMain}`), true);
		}

		const bIsMobileTalksList = oMUtils.isMobile() && _this.oMenu.isHistoryColActive();
		$.post('modules/?r=messenger/update',
		{
			url: this.oSettings.url,
			jot: iJotId,
			lot: this.oSettings.lot,
			area_type: this.oSettings.area_type,
			load: sAction,
			req_jot: iRequestJot,
			focus: +( bIsMobileTalksList ? false : document.hasFocus()),
			last_viewed_jot
		},
		function({ html, unread_jots, code, last_unread_jot, allow_attach, reload })
		{
			bx_loading($(`[data-id="${iJotId}"]${jotMain}`), false);
			const oList = $(conversationBody);

			if (iLotId !== _this.oSettings.lot)
					return ;

			if (+reload) {
				window.location.reload();
				return;
			}

			if (!parseInt(code))
			{
				if (iJotId === undefined)
						oList.html('');

					switch(sAction)
					{
						case 'all':
						case 'new':
								_this.updateCounters(unread_jots, true);

								if (last_unread_jot && (!_this.iLastUnreadJot || _this.iLastUnreadJot < last_unread_jot))
									_this.iLastUnreadJot = last_unread_jot;

								_this.bAllowAttachMessages = allow_attach;
								if (!html.length)
									return ;

							    const oContent = $(html).initJotIcons().initAccordion().bxProcessHtml(),
									  aContent = [];

							    oContent
									.filter(jotMain)
									.each(
										function() {
											if ($('div[data-id="' + $(this).data('id') + '"]', oList).length)
												return;

											$(`${jotMessageView} img`, this)
												.each(function() {
													$(`${jotMain} ${jotMessageView} img[data-viewer-id="${$(this).data('viewer-id')}"]`).remove()
												})
												.end()
												.closest(jotMessageView)
												.fadeIn();

											aContent.push($(this));
										})
									.end();

							if(aContent.length) {
								$(oList)
									.append(oContent)
									.waitForImages(() => _this.updateScrollPosition(sPosition ? sPosition : 'bottom', 'fast', $(conversationBody).last()));


								if ((_this.isBlockVersion() || (oMUtils.isMobile() && _oMessenger.oMenu.isHistoryColActive())) && !bSilentMode)  /* play sound for jots only on mobile devices when chat area is active */
									$(_this).trigger(jQuery.Event('message'));

								if ($(talkListJotSelector).length > _this.iMaxHistory && iRequestJot) {
									let iCountToRemove = $(talkListJotSelector).length - _this.iMaxHistory;
									while (iCountToRemove-- > 0) {
										$(talkListJotSelector).first().remove();
									}
								}
							}

								break;
						case 'prev':
							oList
								.prepend($(html)
											.initAccordion()
											.bxProcessHtml()
											.filter(jotMain)
											.each(function(){
												$(`${jotMessageView} img`, this)
													.each(function(){
														if ($(`${jotMain} ${jotMessageView} img[data-viewer-id="${$(this).data('viewer-id')}"]`).length)
															$(this).remove();
													})
													.end()
													.closest(jotMessageView)
													.fadeIn();
											})
											.end())
								.waitForImages(() => {
									_this.updateScrollPosition('top', 'fast', oObjects.first());
								});

							break;
						case 'edit':
						case 'vc':
							if (!$('div[data-id="' + iJotId + '"]').length)
								oList
								.append(html);
							else
								$('div[data-id="' + iJotId + '"] ' + jotMessage, oList)
									.html(html)
									.parent()
									.bxMsgTime();// don't update attachment for message and don't broadcast as new message
							return;
						case 'delete':
								const onRemove = () => {
															$(this).remove();
															_this.updateScrollPosition('bottom');
														};

								if (html.length)
										$('div[data-id="' + iJotId + '"] ' + jotMessage, oList)
											.html(html)
											.parent()
											.linkify(true, true)
											.find(_this.sAttachmentArea)
											.fadeOut('slow', onRemove);
								/*  if nothing returns, then remove html code completely */
								 else
								{
									$('div[data-id="' + iJotId + '"]', oList)
										.fadeOut('slow', onRemove);
								}
								break;
						case 'check_viewed':
						    const aUsers = $(html).filter('img');

							if (aUsers.length) {
    						    aUsers.each(function(){
									let iProfileId = $(this).data('viewer-id');
									$(`${jotMain} ${jotMessageView} img[data-viewer-id="${iProfileId}"]`).remove();
								});

								return $(`div[data-id="${iJotId}"] ${jotMessageView}`, oList)
									.html(html)
									.fadeIn();
							}
							break;
						case 'reaction':
								let iOriginalCount = 0;

								$(html)
									.each(function(){
									iOriginalCount += $(this).data('count');
								});

								$(`div[data-id="${iJotId}"] ${_this.sReactionsArea} > span`, oList)
									.each(function(){
										iOriginalCount -= $(this).data('count');
									});

								if (iOriginalCount > 0)
									_this.playSound('reaction');

								const oReaction = $(`div[data-id="${iJotId}"] ${_this.sReactionsArea}`, oList);

								$('> span', oReaction).remove();

								oReaction
									.prepend(html);

								if (html.length)
									$(_this.sReactionMenu, oReaction).fadeIn();
								else
									$(_this.sReactionMenu, oReaction).fadeOut();
					}

					oList
						.find(jotMain + ':hidden')
						.fadeIn(
							function()
							{
								$(this).css('display', 'flex').initJotIcons();
							})
						.bxMsgTime();

				if (typeof callback === 'function')
					callback();
			}

			if (sAction === 'prev')
				bx_loading($(talkBlock), false);

		}, 'json');
	};
		
	/**
	* Init user selector when create or edit participants list of the lot
	*@param boolean bMode if used for edit or to create new lot
	*/
	oMessenger.prototype.onJotAddReaction = function(oEmoji, iJotId) {
		const { id } = oEmoji,
			_this = this,
			{ conversationBody } = window.oMessengerSelectors.HISTORY;

		if (id && iJotId) {
			const oReactionsArea = $(`div[data-id="${iJotId}"] ${this.sReactionsArea}`, conversationBody),
				oReaction = $(`span[data-emoji="${id}"]`, oReactionsArea);

			if (!oReaction.length) {
				oReactionsArea.prepend(
					this.sReactionTemplate
						.replace(/__emoji_id__/g, id)
						.replace(/__parts__/g, this.oSettings.user_id)
						.replace(/__count__/g, 1)
						.replace(/__value__/g, oEmoji.native)
				).fadeIn(() => _this.playSound('reaction'));
			} else {
				let iCount = +$(oReaction).data('count'),
					aParts = $(oReaction).data('part').toString().split(',');

				if (!~aParts.indexOf(this.oSettings.user_id + '')) {
					iCount++;
					aParts.push(this.oSettings.user_id);
					$(oReaction).data('part', aParts.join(','));
					$(oReaction).data('count', iCount);

					if ($('> span', oReaction).length)
						$('> span', oReaction).text(iCount);

					_this.playSound('reaction');
				}
			}

			$.post('modules/?r=messenger/jot_reaction', { jot: iJotId, emoji: oEmoji, action: 'add'}, function (oData) {

				if ($(_this.sReactionItem, oReactionsArea).length === 1)
					$(_this.sReactionMenu, oReactionsArea).fadeIn();

				if (+!oData.code)
					_this.broadcastMessage({
						jot_id: iJotId,
						addon: 'reaction'
					});

			}, 'json');
		}
	};

	oMessenger.prototype.onTextAreaAddEmoji = function (oEmoji) {
		this.oEditor.addToCurrentPosition(oEmoji.native);
	};

    /**
     * Run Jitsi video chat
     *@param string sId of the image
     */
    oMessenger.prototype.startVideoCall = function(oEl, iLotId, sRoom, oOptions = {}){
        const _this = this,

			fDesktopCall = () => {
				 let oParams = Object.assign({}, oOptions, !iLotId && { url : encodeURIComponent(_this.oSettings.url), title: _this.oSettings.title });
				 if (typeof oParams.callback !== 'undefined')
					 delete oParams['callback'];

				if (oEl)
					bx_loading_btn($(oEl), true);

				 $(window).dolPopupAjax({
					 url: bx_append_url_params(`modules/?r=messenger/get_jitsi_conference_form/${iLotId}`, oParams),
					 id: {
						 force: true,
						 value: _this.sJitsiVideo.substr(1)
					 },
					 fog: false,
					 removeOnClose: true,
					 closeOnOuterClick: false,
					 onBeforeShow: () => oOptions && typeof oOptions.callback === 'function' && oOptions.callback(),
					 onShow: () => oEl && bx_loading_btn($(oEl), false),
				 });
			 },

			 fMobileCall = () => {
				 if ('undefined' !== typeof(window.ReactNativeWebView)) {

						 if (typeof window.glBxVideoCallJoined === 'undefined') {
							 window.glBxVideoCallJoined = [];
						 }

						 window.glBxVideoCallJoined.push(function (e) {
							 if (oEl)
								 bx_loading_btn($(oEl), true);

							 if (oOptions && typeof oOptions.callback === 'function')
								 oOptions.callback();
							 
							 $.get('modules/?r=messenger/create_jitsi_video_conference/', { lot_id: iLotId }, function (oData) {
									 const { message, opened, code, jot_id } = oData;
									 bx_loading_btn($(oEl), false);

									 if (+code === 1) {
										 bx_alert(message);
										 return;
									 }

									 if (typeof opened !== 'undefined' && Array.isArray(opened))
										 if (Array.isArray(opened))
											 opened.map(jot_id => _this.updateJots({
												 action: 'vc',
												 jot_id
											 }));

									 if (iLotId) {
										 const oInfo = { type: 'vc', vc: 'start' };

										 if (jot_id && !oData.new) {
											 oInfo.jot_id = jot_id;
											 oInfo.vc = 'join';
										 }
										  else
											 _this.playSound('call', true);

										 _this.broadcastMessage(oInfo);
										 _this.updateJots(oInfo);
									 }

									 if (typeof window.glBxVideoCallTerminated === 'undefined') {
										 window.glBxVideoCallTerminated = [];
									 }

									 window.glBxVideoCallTerminated.push(function (e) {
										 	 _this.stopActiveSound();
											 $.get('modules/?r=messenger/stop_jvc/', {lot_id: iLotId}, (oData) => {
												 const oInfo = {
													 jot_id: jot_id,
													 addon: 'vc',
													 type: 'vc',
													 vc: 'stop'
												 };

												 if (+oData.code && oData.msg)
													 bx_alert(oData.msg);

												 _this.broadcastMessage(oInfo);
												 _this.updateJots(oInfo);

											 }, 'json');
									 });
								 },
								 'json');
						 });

						 const oVideoParams = { uri: ( _this.sJitsiServerUrl ? `${_this.sJitsiServerUrl}/${sRoom}` : sRoom ) };
						 if (typeof oOptions.startAudioOnly !== 'undefined' && oOptions.startAudioOnly === true)
							 oVideoParams['audio'] = true;

						 // call mobile video call
						 if (typeof bx_mobile_apps_post_message === 'function')
							 bx_mobile_apps_post_message({ video_call_start: oVideoParams });
				 };

			return false;
		};

		if (oMUtils.isMobileDevice()){
			if (!oMUtils.isUnaMobileApp())
				bx_confirm(_t('_bx_messenger_jitsi_mobile_warning'), fDesktopCall, fMobileCall);
			else
				fMobileCall();
		}
		else
			fDesktopCall();
    };

	oMessenger.prototype.onCloseCallPopup = function (oEl, iLotId, sType = 'break', bClose = true) {
		const oParams = {
			type: 'vc',
			vc: sType,
			lot: iLotId
		},
		{ jotMain } = window.oMessengerSelectors.JOT,
		iJot = $(this.sJitsiJoinButton)
			.last()
			.closest(jotMain)
			.data('id');

		this.stopActiveSound();
		this.broadcastMessage(oParams);

		if (bClose) {
			if (iJot)
				this.updateJots(Object.assign(oParams, {
					action: 'vc',
					jot_id: iJot
				}));

			if (typeof (this.aJitisActiveUsers[iLotId]) !== 'undefined')
				delete this.aJitisActiveUsers[iLotId];
		}

		$(oEl)
			.closest('.bx-popup-active:visible')
			.dolPopupHide({
				removeOnClose: true
			});
	};

	oMessenger.prototype.closeJitsi = function(oElement, iLotID){
		const oJitsi = this.oJitsi,
			  _this = this,
			 { jotMain } = window.oMessengerSelectors.JOT,
			  fClose = 	function(){
			  const jotId = $(_this.sJitsiJoinButton)
					  		.last()
					  		.closest(jotMain)
				  			.data('id');

					  sFunc = () => {
						  const oInfo = {
							  jot_id: jotId,
							  addon: 'vc',
							  type: 'vc',
							  vc: 'stop'
						  };
						  _this.broadcastMessage(oInfo);
						  _this.updateJots(oInfo);

						  if (typeof(_this.aJitisActiveUsers[iLotID]) !== 'undefined')
							  delete _this.aJitisActiveUsers[iLotID];
					  };

				  	  _this.stopActiveSound();
					  $.get('modules/?r=messenger/stop_jvc/', { lot_id: iLotID || _this.oSettings.lot }, (oData) => {
						  if (+oData.code && oData.msg)
							  bx_alert(oData.msg);
						  sFunc();
					  }, 'json');

				  if (oJitsi){
					    oJitsi.dispose();
					    _this.oJitsi = null;
				   }
		 },
		oPopupWindow = oElement && $(oElement).closest(this.sActivePopup);

		if (oPopupWindow && oPopupWindow.length)
			oPopupWindow.dolPopupHide({
				removeOnClose: true,
				onBeforeHide: fClose,
			});
		else
			fClose();

		$(window).unbind('beforeunload');
	};

	oMessenger.prototype.setPositionOnSelectedJot = function(fCallback){
		const _this = this,
			{ conversationBody, mainScrollArea } = window.oMessengerSelectors.HISTORY,
			{ selectedJot } = window.oMessengerSelectors.JOT;

		if ($(selectedJot, conversationBody).length)
			_this.updateScrollPosition('center', 'fast', $(selectedJot, conversationBody),
				function(){
					$(mainScrollArea).fadeIn('slow', () => {
						if (typeof fCallback === 'function')
							fCallback();
					});
				});
		else {
			_this.updateScrollPosition('bottom', undefined, undefined, () => {
				if (typeof fCallback === 'function')
					fCallback();
			});
		}
	}

	oMessenger.prototype.loadTalksList = function(fCallback, bUpdate = true){
		const _this = this,
			{ talksList, talkItem, talksListItems } = window.oMessengerSelectors.TALKS_LIST;

		let oParams = Object.create(null);
		let oLotObject = $(talksList);

		if (!bUpdate) {
			oLotObject = $(talksListItems).last();
			oParams = { count : $(talksListItems).length, group: _this.oSettings.area_type };
		}

		if (_this.iSelectedJot || _this.iSelectedPersonToTalk)
			oParams.exclude_convo = _this.oSettings.lot;

		bx_loading(oLotObject, true);
		$.post('modules/?r=messenger/get_talks_list', oParams, function ({ code, html, reload, title }) {
				bx_loading(oLotObject, false);

				if (+reload) {
					window.location.reload();
					return;
				}

				if (!+code){
					$('> ul', talksList)
						[bUpdate ? 'html' : 'append']($(html).bxMsgTime());
					}
				else
					$(talksListItems).first().removeClass('hidden');

				if (title && $(_this.sInboxTitle).length)
					$(_this.sInboxTitle).text(title);

				if (typeof fCallback === 'function')
					fCallback(+code);
			},
			'json');
	}

	oMessenger.prototype.getThreadsReplies = function(iReplyId){
		const _this = this,
			{ conversationBody } = window.oMessengerSelectors.HISTORY,
			{ jotMessage } = window.oMessengerSelectors.JOT,
			 oObject = $(`div[data-id="${iReplyId}"]`, conversationBody);

		if (!iReplyId || !oObject.length)
			return;

		$.post('modules/?r=messenger/get_thread_replies', { jot_id: iReplyId}, function ({ code, html}) {
				if (!+code) {
					$('.bx-messenger-jot-replies', oObject).remove();
					$(oObject).find(jotMessage).after(html);
				}
			},
		'json');
	}

	oMessenger.prototype.loadTalksListByParam = function(mixedData, fCallback){
		const _this = this,
			{ group, id, lot} = mixedData || {},
			{ talksList, topItem, inboxAreaTitle, talkItem, talksListItems } = window.oMessengerSelectors.TALKS_LIST,
			{ messengerBlock } = window.oMessengerSelectors.TALK_BLOCK,
			{ mainTalkBlock, conversationBody } = window.oMessengerSelectors.HISTORY,
			{ blockContainer, blockHeader } = window.oMessengerSelectors.SYSTEM,
			sTopSelector = `ul > li:not(${topItem}), ul > div`;

		_this.oSettings.area_type = group;
		_this.oSettings.group_id = id;
		if (group === 'groups' && +id) {
			_this.oSettings.group_id = id;
		}

		$(sTopSelector, talksList)
			.remove();

		bx_loading($(talksList), true);
		$.post('modules/?r=messenger/get_talks_list', { group, id, lot }, function ({ code, html, title}) {
				bx_loading($(talksList), false);
				if (html.length){
					$('> ul', talksList)
						.append( $( code ? '<li>' + html + '</li>' : html).bxMsgTime() );
				}

				$(talksList).initLazyLoading((oObject, bFlag) => _this.loadTalksList(oObject, bFlag));
				if (title && $(inboxAreaTitle).length)
					$(inboxAreaTitle).text(title);

				const oMessengerBlock = $(messengerBlock).length ? messengerBlock : $(mainTalkBlock).closest(blockContainer);
				if (code)
				{
					$(oMessengerBlock)
						.find(blockHeader)
						.html('')
						.end()
						.find(conversationBody)
						.html('')
						.end()
						.find(_this.sTextArea)
						.html('');

					_this.oSettings.lot = 0;
					_this.oSettings.group_id = 0;
				}

				if (typeof fCallback === 'function')
					fCallback(+code);
			},
			'json');
	}

	/**
	 * Init settings, occurs when member opens the main messenger page
	 * @param fCallback
	 */
	oMessenger.prototype.initMessengerPage = function(fCallback) {
		const _this = this,
			{ conversationBody } = window.oMessengerSelectors.HISTORY,
			{ talkItem, talksList } = window.oMessengerSelectors.TALKS_LIST,
			{ searchUsersInput } = window.oMessengerSelectors.CREATE_TALK,
			{ bxMain } = window.oMessengerSelectors.SYSTEM;

		if (typeof oMessengerMemberStatus !== 'undefined') {
			oMessengerMemberStatus.init(function (iStatus) {
				_this.iStatus = iStatus;
				if (typeof _this.oRTWSF !== "undefined")
					_this.oRTWSF.updateStatus({
						user_id: _this.oSettings.user_id,
						status: iStatus,
					});
			});
		}

		let iTimeout = null;
		$(window).on('touchmove resize', function ({ type }) { //resize
			_this.updateSendAreaButtons();
				clearTimeout(iTimeout);
				iTimeout = setTimeout(() => {
					oNavMenu.onResize();
					_this.selectLotEmit($(`[data-lot="${_this.oSettings.lot}"]${talkItem}`));
					$(conversationBody).waitForImages(() => {
						if (type === 'resize')
							_this.setPositionOnSelectedJot(fCallback);
					});

					_this.setScrollBarWidth();

					if ($(searchUsersInput).length)
						$(searchUsersInput).focus();
					else if (_this.oEditor && !oMUtils.isMobile())
						_this.oEditor.focus();

					if (oMUtils.isMobile() && $(bxMain).length)
						$(bxMain).height($(window).height());

				}, 200);
		});

		$(window).resize();

		_this.setPositionOnSelectedJot(fCallback);

		$(talksList).initLazyLoading((oObject, bFlag) => _this.loadTalksList(oObject, bFlag));

		_this.updatePageIcon();

		// this module class is missed when you open messenger page using not direct menu link.
		$('body').addClass("bx-page-messenger");
	};

	oMessenger.prototype.initGiphy = function(sSelector = '') {
		let iTotal = 0;
		let iScrollPosition = 0;

		const _this = this,
			oContainer = $(`${sSelector}${this.sGiphyItems}`),
			oScroll = $(`${sSelector}.bx-messenger-giphy-scroll`),
			fInitVisibility = (sType, sValue) => {
				let stopLoading = false;
				oScroll.on('scroll', (e) => {
					const { scrollLeft,  scrollWidth, clientWidth} = e.currentTarget;
					const iItems = $('picture', oContainer).length;
					const scrollLeftMax = scrollWidth - clientWidth;
					let	bPassed = scrollLeft >= scrollLeftMax*0.6; // 60% passed
					iScrollPosition = scrollLeft;

					if (!bPassed || (iTotal && iItems && iItems >= iTotal))
						return;

					if (!stopLoading) {
						stopLoading = true;
						fGiphy(sType, sValue, () => setTimeout(() => {
							stopLoading = false;
							oScroll.scrollLeft(iScrollPosition);
						}, 0));
					}
				});
			},
			fGiphy = (sType, sValue, fCallback) => {
				const fHeight = oContainer.height();
			$('div.search', `${sSelector}${_this.sGiphyBlock}`).addClass('loading');
				$.get('modules/?r=messenger/get_giphy', {
						height: fHeight,
						action: sType,
						filter: sValue,
						start: $('picture', oContainer).length
					}, function (oData) {
						iTotal = oData.total;

						oContainer
							.append(
								oData.code
									? oData.message
									: oData.html
							)
							.setRandomBGColor();

						$('div.search', `${sSelector}${_this.sGiphyBlock}`).removeClass('loading');
						if (typeof fCallback === 'function')
							fCallback(sType, sValue);
					},
					'json');
			};

		if ($(`${sSelector}${_this.sGiphMain}`).css('visibility') === 'visible') {
			let iTimer = 0;
			$('input', `${sSelector}${_this.sGiphMain}`).keypress(function (e) {
				clearTimeout(iTimer);
				iTimer = setTimeout(() => {
					iScrollPosition = 0;
					iTotal = 0;
					oContainer.html('');
					oScroll.scrollLeft(0);
					const sFilter = $(this).val();
					fGiphy(sFilter && 'search', sFilter, fInitVisibility);

				}, 1000);
				return true;
			}).on('keydown', function (e) {
				if (e.keyCode === 8 || e.keyCode === 46)
					$(this).trigger('keypress');
			});

			if (oContainer && !oContainer.find('img').length) {
				fGiphy(undefined, undefined, fInitVisibility);
			}
		}
	};

	/**
	* Returns object with public methods 
	*/
	return {
		/**
		 * Init main Lot's settings and object to work with (settings, real-time frame work, page builder and etc...)
		 *@param object oOptions options
		 */
		init: function (oOptions) {
			const _this = this;
			if (_oMessenger != null)
				return true;

			_oMessenger = new oMessenger(oOptions);

			const { inputArea, sendAreaActionsButtons } = window.oMessengerSelectors.TEXT_AREA,
				{ talkItem, talksListItems } = window.oMessengerSelectors.TALKS_LIST,
				{ infoArea, typingInfoArea, connectionFailedArea } = window.oMessengerSelectors.HISTORY_INFO,
				{ talkBlock } = window.oMessengerSelectors.HISTORY,
				{ messengerColumns } = window.oMessengerSelectors.MAIN_PAGE,
				{ searchUsersInput } = window.oMessengerSelectors.CREATE_TALK;

			if (createjs) {
				createjs.Sound.registerSound(_oMessenger.incomingMessage, 'incomingMessage');
				createjs.Sound.registerSound(_oMessenger.reaction, 'reaction');
				createjs.Sound.registerSound(_oMessenger.call, 'call');
			}

			/* Init sockets settings begin*/
			if (typeof _oMessenger.oRTWSF !== 'undefined' && _oMessenger.oRTWSF.isInitialized()) {

				$(window).on('beforeunload', function () {
					if (_oMessenger.oRTWSF !== undefined)
						_oMessenger.oRTWSF.end({
							user_id: oOptions.user_id
						});
				});

				_oMessenger.oRTWSF.onTyping = function (oData) {
					_this.onTyping(oData);
				};

				_oMessenger.oRTWSF.onMessage = function (oData) {
					_this.onMessage(oData);
				};

				_oMessenger.oRTWSF.onStatusUpdate = function (oData) {
					_this.onStatusUpdate(oData);
				};

				_oMessenger.oRTWSF.onServerResponse = function (oData) {
					_this.onServerResponse(oData);
				};

				_oMessenger.oRTWSF.onReconnecting = function (oData) {
					_oMessenger.onReconnecting(oData);
				};

				_oMessenger.oRTWSF.onReconnected = function (oData) {
					_oMessenger.onReconnected(oData);
				};

				_oMessenger.oRTWSF.onReconnectFailed = function (oData) {
					_oMessenger.onReconnectFailed(oData);
				};

				_oMessenger.oRTWSF.getSettings = function () {
					return $.extend({status: _oMessenger.iStatus}, _oMessenger.oSettings);
				};


				_oMessenger.oRTWSF.onDestroy = function (oData) {
					$(infoArea).fadeIn();
					$(typingInfoArea).parent().hide();
					$(connectionFailedArea).fadeIn();
					_oMessenger.oRTWSF.end();
					_oMessenger.oRTWSF = undefined;
				};

			} else {
				console.log('Real-time frameworks was not initialized');
				const { serverErrorArea } = window.oMessengerSelectors.HISTORY_INFO;
				$(infoArea).fadeIn();
				$(typingInfoArea).parent().hide();
				$(serverErrorArea).show();
			}

			/* Init sockets settings end */

			// init browser storage
			if (typeof oMessengerStorage !== 'undefined' && !_oMessenger.oStorage) {
				_oMessenger.oStorage = new oMessengerStorage();
			}

			// init text area
			_oMessenger.initTextArea();
			// init default talks params
			const oInitParams = {
				lot: oOptions.lot,
				jot: oOptions.jot_id,
				last_unread_jot: oOptions.last_unread_jot,
				unread_jots: oOptions.unread_jots,
				allow_attach: oOptions.allow_attach
			};

			_oMessenger.updateLotSettings(oInitParams);
			_oMessenger.initScrollArea();

			if (!_oMessenger.isBlockVersion())
				_oMessenger.initMessengerPage();
			else
			{
				$(document).ready(() => _oMessenger.setPositionOnSelectedJot(() => _oMessenger.setScrollBarWidth()));
				$(window).on('resize', (e) => _oMessenger.setScrollBarWidth());
			}

			// find the all intervals in history
			$(talkBlock)
				.bxMsgTime();

			$(talksListItems)
				.bxMsgTime();

			// init menu
			if (!_oMessenger.oMenu && typeof window.oNavMenu !== 'undefined')
			{
				_oMessenger.oMenu = window.oNavMenu;
				_oMessenger.oMenu.setUniqueMode(_oMessenger.bUniqueMode);
				_oMessenger.oMenu.toggleMenuItem(`${talkItem}[data-lot="${oOptions.lot}"]`);
			}

			// attach on ESC button return from create talk area
			$(messengerColumns).on('keydown touchend mousedown', function (e) {
				const { type, keyCode, target } = e;

				if (+keyCode === 27 && $(target).prop('id') === searchUsersInput.substr(1)) {
					return history.back();
				}

				if ((type === 'touchend' || type === 'mousedown') && !$(target).closest(`${inputArea}, ${sendAreaActionsButtons}`).length) {
					if (_oMessenger.oEditor && oMUtils.isMobile())
						_oMessenger.oEditor.blur();
				};
			});

			$(window).on('focus', () => {
				_oMessenger.updatePageIcon();
				_oMessenger.broadcastView();
			});

			//remove all edit jot areas on their lost focus
			$(document).on('mouseup', function (oEvent) {
				_oMessenger.removeEditArea(oEvent);
			})
			.on('click touchstart', (oEvent) => _oMessenger.onOuterClick(oEvent));

           _oMessenger.editOnClick();
			if ((+oOptions.selected_profile || (+oOptions.jot_id && _oMessenger.bByUrl)) && oMUtils.isMobile())
				_oMessenger.oMenu.showHistoryPanel();

			_oMessenger.oHistory.pushState({ action: 'init', lot: oOptions.lot, jot: oOptions.jot_id, area: oOptions.area_type }, null);
			_oMessenger.showWelcomeMessage(oOptions.welcome_message);

			$(_oMessenger).initMenuBubbles(oOptions.messages);
		},

		/**
		 * Init Lot settings only (occurs when member selects any lot from lots list)
		 *@param object oOptions options
		 */
		initLotSettings: function (oOptions) {
			_oMessenger.initLotSettings(oOptions);
		},

		initTextArea: function () {
			_oMessenger.initTextArea();
		},

		initFilesUploader: function () {
			_oMessenger.initFilesUploader();
		},

		loadTalk: function (iLotId, iJotId = undefined) {
			if (~_oMessenger.aLoadingRequestsPool.indexOf(iLotId))
				return;

			const iLength = _oMessenger.aLoadingRequestsPool.length;
			const fLoading = () => {
				const lot = _oMessenger.aLoadingRequestsPool[0];

				if (+lot){
					_oMessenger
						.loadTalk(lot, iJotId)
						.done(() => {
							if (typeof _oMessenger.oHistory.pushState === 'function')
								_oMessenger.oHistory.pushState({ action: 'load_talk', lot: iLotId, area: _oMessenger.oSettings.area_type, jot: iJotId }, null);

							if (_oMessenger.aLoadingRequestsPool.length) {
								if (_oMessenger.aLoadingRequestsPool.length > 1)
									_oMessenger.aLoadingRequestsPool = _oMessenger.aLoadingRequestsPool.slice(-1);
								else
									_oMessenger.aLoadingRequestsPool.shift();

								fLoading();
							}

							_oMessenger.setScrollBarWidth();
						});
				}
			}

			const { talkItem } = window.oMessengerSelectors.TALKS_LIST,
				  { infoColumn } = window.oMessengerSelectors.INFO;

			_oMessenger.selectLotEmit($(`[data-lot="${iLotId}"] ${talkItem}`));
			_oMessenger.aLoadingRequestsPool.push(iLotId);

			if ($(infoColumn).is(':visible') && !_oMessenger.isBlockVersion())
				_oMessenger.oMenu.showInfoPanel();

			if (!iLength)
				fLoading();

			return this;
		},
		onNextSearch: function (){
			const iLotId = _oMessenger.oSettings.lot,
				 { jotMain, selectedJot } = window.oMessengerSelectors.JOT;

			let iLeftJotId = 0;
			if (typeof _oMessenger.aSearchJotsList[iLotId] !== 'undefined'){
				const { list, current } = _oMessenger.aSearchJotsList[iLotId];
				if (typeof current === 'undefined' || (current === list.length - 1))
					_oMessenger.aSearchJotsList[iLotId].current = 0;
				else
					_oMessenger.aSearchJotsList[iLotId].current++;

				iLeftJotId = list[current || 0];
			}

			if (iLeftJotId) {
				const oPrevJot = $(`${jotMain}[data-id="${iLeftJotId}"]`);
				if (oPrevJot.length)
					_oMessenger.updateScrollPosition('center', 'fast', oPrevJot.addClass(selectedJot.substr(1)));
				else
					_oMessenger.jumpToJot(iLeftJotId, () => {
						$(`${jotMain}[data-id="${iLeftJotId}"]`).addClass(selectedJot.substr(1));
					});

				_oMessenger.showSearchCounter(iLotId);
			}

			return this;
		},
		onScrollDown: function () {
			const { iUnreadJotsNumber, iMaxHistory, iSelectedJot, oSettings: { lot }, iScrollDownPositionJotId } = _oMessenger,
				{ talkListJotSelector } = window.oMessengerSelectors.JOT,
				{ unreadJotsCounter } = window.oMessengerSelectors.HISTORY;

			if (iScrollDownPositionJotId) {
				const oPrevJot = $(`${jotMain}[data-id="${iScrollDownPositionJotId}"]`);
				if (oPrevJot.length)
					_oMessenger.updateScrollPosition('center', 'fast', oPrevJot);
				else
					_oMessenger.jumpToJot(iScrollDownPositionJotId);

				_oMessenger.iScrollDownPositionJotId = 0;
				return;
			}

			if (iMaxHistory >= iUnreadJotsNumber && !iSelectedJot)
				_oMessenger.updateScrollPosition('bottom', 'fast');
			else
			{
				const iLastJotId = $(talkListJotSelector).last().data('id');
				_oMessenger.loadJotsForLot(lot, iLastJotId);

				$(unreadJotsCounter)
					.text('')
					.hide();
			}

			return this;
		},
		searchByItems: function (sText) {
			_oMessenger.searchByItems(_oMessenger.iFilterType, sText);
			return this;
		},
		onSaveParticipantsList: function (iLotId) {
			_oMessenger.saveParticipantsList(iLotId);
			return this;
		},
		onLeaveLot: function (iLotId) {
			bx_confirm(_t('_bx_messenger_are_you_sure_leave', _oMessenger.oSettings.title) , () => _oMessenger.leaveLot(iLotId));
			return this;
		},
		onLotSettings: function () {
			$.post('modules/?r=messenger/get_lot_settings', {lot: _oMessenger.oSettings.lot}, (oData) => {
				processJsonData(oData);
			}, 'json');

			return this;
		},
		onSaveLotSettings: function (oEl) {
			const aOptions = [];
			$(oEl)
				.closest('form')
				.find('input[type="checkbox"]:checked')
				.each(function () {
					aOptions.push($(this).prop('name'));
				})

			$.post('modules/?r=messenger/save_lot_settings', {
				lot: _oMessenger.oSettings.lot,
				options: aOptions
			}, ({code, msg}) => {
				$(oEl)
					.closest('.bx-popup-applied:visible')
					.dolPopupHide();

				if (+code && msg)
					bx_alert(msg);

			}, 'json');

		},
		onViewDeletedJot: function (iJotId) {
			_oMessenger.viewJot(iJotId);
			return this;
		},
		onMuteLot: function (oEl, iLotId) {
			_oMessenger.muteLot(iLotId, oEl);
			return this;
		},
		onStarLot: function (oEl, iLotId) {
			_oMessenger.starLot(iLotId, oEl);
			return this;
		},
		onDeleteLot: function (iLotId) {
			bx_confirm(_t('_bx_messenger_delete_lot', _oMessenger.oSettings.title) , () => _oMessenger.deleteLot(iLotId));
			return this;
		},
		onClearLot: function (iLotId) {
			bx_confirm(_t('_bx_messenger_clear_lot', _oMessenger.oSettings.title) , () => _oMessenger.clearLot(iLotId));
			return this;
		},
		showLotsByType: function (iType) {
			_oMessenger.searchByItems(iType);
			return this;
		},
		onDeleteJot: function (oObject, bCompletely) {
			const { jotMain } = window.oMessengerSelectors.JOT,
				{ talkBlock, conversationBody}  = window.oMessengerSelectors.HISTORY;

			bx_confirm(_t('_bx_messenger_remove_jot_confirm') , () => {
				oMessengerJotMenu.deleteJot(oObject, bCompletely, function(oInfo){
					if (!_oMessenger.isBlockVersion())
						_oMessenger.upLotsPosition($.extend(oInfo, _oMessenger.oSettings));

					_oMessenger.broadcastMessage(oInfo);
				}, () => {
					if ($(conversationBody).prop('scrollHeight') <= $(talkBlock).prop('clientHeight') && $(jotMain, talkBlock).length === 1)
						_oMessenger.updateJots({
							action: 'prev',
							position: 'bottom'
						});
					else
						_oMessenger.updateScrollPosition('bottom');
				});
			});
		},
		onEditJot: function (oObject) {
			_oMessenger.editJot(oObject);
		},
		onSaveJot: function (oObject) {
			_oMessenger.saveJot(oObject);
		},
		onSaveJotItem: function (oObject) {
			_oMessenger.onSaveJotItem(oObject);
		},
		onCancelEdit: function (oObject) {
			_oMessenger.cancelEdit(oObject);
		},
		onCopyJotLink: function (oObject) {
			_oMessenger.copyJotLink(oObject);
		},
		onReplyJot: function (oObject) {
			_oMessenger.replyJot(oObject);
		},
		onCleanReplayArea: function () {
			_oMessenger.cleanReplayArea();
		},
		jumpToParentMessage: function (oElement, iJumpJotId) {
			const { jotMain } = window.oMessengerSelectors.JOT;
			if (iJumpJotId && oElement)
				_oMessenger.iScrollDownPositionJotId = $(oElement).closest(jotMain).data('id');

			_oMessenger.jumpToJot(iJumpJotId);
		},
		loadThreadsParent: function (iLotId, sType, iJotId) {
			$('#bx-messenger-menu-block a').removeClass('active');
			$('p[data-talks-type="threads"]').closest('a').addClass('active');
			_oMessenger.loadTalksListByParam({ group : sType }, () =>{
				_oMessenger.loadTalk(iLotId, iJotId);
			});
		},
		/**
		 * Methods below occur when messenger gets data from the server
		 */
		onTyping: function (oData) {
			_oMessenger.showTyping(oData);
			return this;
		},
		onMedia: function () {
			const { infoColumnContent } = window.oMessengerSelectors.INFO,
				 { attPrefixSelector } = window.oMessengerSelectors.ATTACHMENTS;

			if (!_oMessenger.isBlockVersion())
				_oMessenger.oMenu.showInfoPanel();
			else
				_oMessenger.oMenu.toggleBlockInfoPanel();

			// remove previous content
			$(infoColumnContent).html('');
			return _oMessenger.loadTalkFiles($(infoColumnContent), $(`[class^="${attPrefixSelector}"]`, infoColumnContent).length, () =>
							$(infoColumnContent).initLazyLoading(
								function() {
									_oMessenger.loadTalkFiles($(infoColumnContent), $(`[class^="${attPrefixSelector}"]`, infoColumnContent).length)
								}
							)
							);
		},
		onLotInfo: function () {
			const { infoColumnContent } = window.oMessengerSelectors.INFO,
				{ attPrefixSelector } = window.oMessengerSelectors.ATTACHMENTS;

			if (!_oMessenger.isBlockVersion())
				_oMessenger.oMenu.showInfoPanel();
			else
				_oMessenger.oMenu.toggleBlockInfoPanel();

			// remove previous content
			$(infoColumnContent).html('');
			return _oMessenger.loadTalkInfo($(infoColumnContent));
		},
		onToggleInfoPanel: function () {
			if (!_oMessenger.isBlockVersion())
				_oMessenger.oMenu.showInfoPanel();
			else
				_oMessenger.oMenu.toggleBlockInfoPanel();

			return this;
		},
		onSelectItem: function(oObject, iLotId){
			_oMessenger.oMenu.toggleBlockGroupsPanel();
		},
		onMessage: function (oData) {
			const bSilent = _oMessenger.oSettings.user_id === oData.user_id || (oData.type === 'vc' && oData.vc !== 'start');
			try {
				if (!_oMessenger.isBlockVersion())
					_oMessenger.upLotsPosition(oData, bSilent);

			} catch (e) {
				console.log('Lot list message update error', e);
			}

			try {
				if (+oData.lot === +_oMessenger.oSettings.lot)
					_oMessenger.updateJots(oData, bSilent);

				if (oData.type === 'vc' && +oData.lot)
					_oMessenger.getVideoCall(oData);

			} catch (e) {
				console.log('Talk history update error', e);
			}

			return this;
		},
		onStatusUpdate: function (oData) {
			_oMessenger.updateStatuses(oData);
			return this;
		},
		onServerResponse: function (oData) {
			const { addon } = oData;
			return this;
		},

		/**
		 * Executes on files uploading window close
		 *@param string sMessage confirmation message
		 *@param int iFilesNumber files number
		 */
		onCloseUploadingForm: function (sMessage, iFilesNumber) {
			if (!iFilesNumber || (iFilesNumber && confirm(sMessage))) {
				$(_oMessenger.sAddFilesFormComments).html('');
				$(_oMessenger.sAddFilesForm).dolPopupHide();
				return true;
			}

			return false;
		},

		/**
		 * Occurs on image click, allows to make image bigger in popup.
		 *@param int iId image file id
		 */
		zoomImage: function (iId) {
			$(window).dolPopupAjax({
				url: 'modules/?r=messenger/get_big_image/' + iId + '/' + $(window).width() + '/' + $(window).height(),
				id: {force: true, value: 'bx-messenger-big-img'},
				top: '0px',
				left: '0px',
				onBeforeShow: function () {
					$('#bx-messenger-big-img, #bx-messenger-big-img .bx-popup-element-close, #bx-messenger-big-img img, #bx-popup-fog').click(function () {
						$('#bx-messenger-big-img').dolPopupHide().remove();
					});
				}
			});
		},

		/**
		 * Select giphy item to send, allows to add message to gif image.
		 *@param string sId of the image
		 */
		onSelectGiphy: function (oElement) {
			const oUploader = _oMessenger.oFilesUploader,
				{ attachmentArea } = window.oMessengerSelectors.TEXT_AREA;

			if (oUploader && (oUploader.getFiles().length || oUploader.isLoadingStarted())) {
				$(_oMessenger.sGiphMain).fadeOut();
				return;
			} else
				$(_oMessenger.sGiphMain)
					.fadeOut(() => {
						const oObject = $(oElement)
							.clone()
							.wrap('<div class="giphy-item"></div>')
							.parent();

						_oMessenger.updateSendArea(false);
						$(attachmentArea)
							.html(
								oObject
									.append(
										$(`<i class="sys-icon times"></i>`)
											.on('click', function () {
												$(this)
													.closest('.giphy-item')
													.fadeOut()
													.remove();

												_oMessenger.updateSendArea(true);
											})
									)
							);
					});

		},
		initJitsi: function (oJitsi, bNew = false, bChatSync = false) {
			_oMessenger.oJitsi = oJitsi;

			if (oJitsi._lotId) {
				const oInfo = {type: 'vc', vc: 'start'};

				if (oJitsi._jotId && !bNew) {
					oInfo.jot_id = oJitsi._jotId;
					oInfo.vc = 'join';
				} else {
					_oMessenger.playSound('call', true);
					_oMessenger.aJitisActiveUsers[oJitsi._lotId] = {owner: _oMessenger.oSettings.user_id, got: 0};
				}

				_oMessenger.broadcastMessage(oInfo);
				_oMessenger.updateJots({
					action: 'msg'
				});

				$(window)
					.on('beforeunload', () => _t('_bx_messenger_are_you_sure_close_jisti'))
					.on('unload', () => {
						$.get('modules/?r=messenger/stop_jvc/', {lot_id: oJitsi._lotId}, (oData) => {
							const oInfo = {
								jot_id: oJitsi._jotId,
								addon: 'vc',
								type: 'vc',
								vc: 'stop'
							};
							_oMessenger.broadcastMessage(oInfo);
							_oMessenger.updateJots(oInfo);
							_oMessenger.stopActiveSound();

						}, 'json');
						oJitsi.dispose();
					});

				if (bChatSync)
					oJitsi.on('outgoingMessage', ({message}) => {
						_oMessenger.sendMessage(message, {vc: oJitsi._lotId});
						_oMessenger.updateJots({
							action: 'msg'
						});
					});

				oJitsi.on('videoConferenceLeft', () => {
					_oMessenger.closeJitsi(_oMessenger.sJitsiMain, oJitsi._lotId);
				});
			}
		},

		onJitsiClose: (oElement, iLotId) => {
			_oMessenger.closeJitsi(oElement, iLotId);
		},

		/**
		 * Run Jitsi video chat
		 *@param string sId of the image
		 */

		onStartVideoCall: function (oEl, iLotId, sRoom) {
			_oMessenger.startVideoCall(oEl, iLotId, sRoom);
		},

		getCall: function (oEl, iLotId, sRoom, bAudioOnly = false) {
			if (!iLotId)
				return;

			if (!_oMessenger.isActiveLot(iLotId))
				_oMessenger.loadTalk(iLotId);

			_oMessenger.startVideoCall(undefined, iLotId, sRoom, {
				startAudioOnly: +bAudioOnly,
				callback: () => {
					_oMessenger.onCloseCallPopup(oEl, iLotId, 'get_call', false);
				}
			});
		},
		/**
		 * Show only marked as important lot
		 *@param object oEl
		 */
		showStarred: function (oEl) {
			const { searchCriteria } = window.oMessengerSelectors.TALKS_LIST;
			if (!_oMessenger.iStarredTalks) {
				$(oEl)
					.addClass('active')
					.find('i.star')
					.addClass('fill')
			} else
				$(oEl)
					.removeClass('active')
					.find('i.star')
					.removeClass('fill');

			_oMessenger.iStarredTalks = !_oMessenger.iStarredTalks;
			this.searchByItems($(searchCriteria).val());
		},

		removeFile: (oEl, id) => bx_confirm(_t('_bx_messenger_post_confirm_delete_file'), () => oMessengerJotMenu.removeFile(oEl, id)),
		downloadFile: (iFileId) => oMessengerJotMenu.downloadFile(iFileId),
		sendVideoRecord: function (oFile, oCallback) {
			let fileName = (new Date().getTime()),
				formData = new FormData();

			if (oFile.type !== undefined) {
				let sExt = (~oFile.type.indexOf(';') ? oFile.type.substring(0, oFile.type.lastIndexOf(';')) : oFile.type).replace('video/', '.');
				fileName += sExt;
			};

			formData.append('name', fileName);
			formData.append('file', oFile);

			bx_loading($(_oMessenger.sFilesUploadAreaOnForm), true);
			$.ajax({
				url: 'modules/?r=messenger/upload_video_file',
				data: formData,
				type: 'POST',
				dataType: 'json',
				contentType: false,
				processData: false,
			})
				.done(
					function (oData) {
						bx_loading($(_oMessenger.sFilesUploadAreaOnForm), false);
						if (!parseInt(oData.code)) {
							const sMessage = $(_oMessenger.sAddFilesFormComments).text();
							_oMessenger.sendMessage(sMessage, {files: [{ complete: 1, realname: fileName, name: fileName }]}, function (iJotId) {
								if (typeof oCallback == 'function')
									oCallback();

								_oMessenger.attacheFiles(iJotId);
							});
						} else
							bx_alert(oData.message);
					});


		},
		updateCommentsAreaWidth: function (fWidth) {
			_oMessenger.updateCommentsAreaWidth(fWidth);
		},
		onAddReaction: function (oObject, bNear) {
			_oMessenger.onAddReaction(oObject, bNear);
		},
		onRemoveReaction: function (oObject) {
			const _this = this,
				{ jotMain } = window.oMessengerSelectors.JOT,
				oEmoji = $(oObject),
				oReactionArea = oEmoji.closest(_oMessenger.sReactionsArea),
				iJotId = +$(oEmoji).closest(jotMain).data('id'),
				sEmojiId = $(oEmoji).data('emoji'),
				fUpdateParams = () => {
					$(oEmoji).data('part', aParts.join(','));
					$(oEmoji).data('count', aParts.length);
					_oMessenger.broadcastMessage({
						jot_id: iJotId,
						addon: 'reaction'
					});
				};

			if (!iJotId)
				return;

			let iCount = +$(oEmoji).data('count'),
				aParts = $(oEmoji)
					.data('part')
					.toString()
					.split(',');

			if (~aParts.indexOf(_oMessenger.oSettings.user_id + '')) {
				if (iCount === 1)
					$(oEmoji)
						.fadeOut()
						.remove();
				else
					$('> span.count', oEmoji)
						.text(--iCount);

				aParts = aParts.filter((iPart) => {
					return +iPart !== _oMessenger.oSettings.user_id
				});

				$.get('modules/?r=messenger/update_reaction', {
					jot: iJotId,
					emoji_id: sEmojiId,
					action: 'remove'
				}, function (oData) {
					if (!parseInt(oData.code)) {
						fUpdateParams();
						if (!$(_oMessenger.sReactionItem, oReactionArea).length)
							$(_oMessenger.sReactionMenu, oReactionArea).fadeOut();
					}
				}, 'json');
			} else {
				iCount++;
				aParts.push(_oMessenger.oSettings.user_id);
				if ($('> span.count', oEmoji).length)
					$('> span.count', oEmoji).text(iCount);
				else
					$(oEmoji).append(`<span>${iCount}</span>`);

				_oMessenger.playSound('reaction');
				$.get('modules/?r=messenger/update_reaction', {
					jot: iJotId,
					emoji_id: sEmojiId,
					action: 'add'
				}, function (oData) {
					if (!parseInt(oData.code))
						fUpdateParams();
				}, 'json');
			}
		},
		updateJots(oJots, sType) {
			if (Array.isArray(oJots))
				oJots.map(iJot => _oMessenger.updateJots({
					action: sType || 'edit',
					jot_id: iJot
				}));
		},
		onHangUp: (oEl, iLotId) => {
			_oMessenger.onCloseCallPopup(oEl, iLotId);
		},
		stopActiveSound: () => _oMessenger.stopActiveSound(),
		showInfoMenu: (oMenu, sLotMenuId) => {
			$(`#${sLotMenuId}`).dolPopup({
				pointer: {el: $(oMenu).parent()},
				moveToDocRoot: _oMessenger.isBlockVersion(),
				onShow: function (oEl) {
					$(oEl).unbind('click').click(() => { $(oEl).hide() });
				}
			})
		},
		getVideoRecording: async () => {
			const sText = _oMessenger.oEditor ? _oMessenger.oEditor.getText() : '';

			if (navigator.mediaDevices === undefined){
				bx_alert(_t('_bx_messenger_video_recorder_is_not_available'));
				return;
			}

			try
			{
				await navigator.mediaDevices.getUserMedia({video: true, audio: true});

				$(window).dolPopupAjax({
					url: 'modules/?r=messenger/get_record_video_form',
					id: { force: true, value: _oMessenger.sAddFilesForm.substr(1) },
					onShow: function () {
						if (typeof fCallback == 'function')
							fCallback();

						if (sText && sText.length)
							$(_oMessenger.sAddFilesFormComments).text(sText);

						setTimeout(() => _oMessenger.updateCommentsAreaWidth(), 100);
					},
					closeOnOuterClick: false,
					removeOnClose: true,
					onHide: function () {
						_oMessenger.updateScrollPosition('bottom');
					}
				});
			}
			catch({ name }) {
				switch(name){
					case 'NotAllowedError' :
						bx_alert(_t('_bx_messenger_video_recorder_is_blocked', sUrlRoot));
						break;
					default:
						bx_alert(_t('_bx_messenger_video_recorder_is_not_available'));
				}
			}
		},
		getUserByTerm: function(sTerm){
			const _this = _oMessenger,
				{ group_id, area_type, lot } = _this.oSettings,
				{ foundUsersArea, selectedUsersListInputs } = window.oMessengerSelectors.CREATE_TALK,
				fExecute = () => {
					bx_loading($(foundUsersArea), true);
					$.post('modules/?r=messenger/get_users_list', { group_id, area_type, lot, term: sTerm, except: function(){
							let aUsers = [];
							$(selectedUsersListInputs)
								.each(function(){
									aUsers.push($(this).val());
								});

							return aUsers.join(',');
						}}, ({content}) => 	$(foundUsersArea).html(content), 'json');
				};

			clearTimeout(_this.iTimer);
			_this.iTimer = setTimeout(fExecute, _this.iRunSearchInterval);
		},
		createList: function(action = 'new', fCallback){
			const { lot, area_type } = _oMessenger.oSettings;

			_oMessenger.createList(action, fCallback);
			_oMessenger.oHistory.pushState({ action: 'create_list', type: action, lot, area: area_type }, null);
		},
		onSelectUser: function(oUser){
			const { selectedUsersArea, existedUsersArea } = window.oMessengerSelectors.CREATE_TALK;

			if (typeof oUser !== 'undefined') {
				const iId = $(oUser).data('id');

				if (!$(existedUsersArea, selectedUsersArea).find(`[data-id=${iId}]`).length) {
					const sUser = $('.avatar', oUser).html(),
						sUsername = $('.username', oUser).html(),
						oUserObject = $(_oMessenger.sAddUserTemplate).clone(),
						sTemplate = oUserObject
							.prop('outerHTML')
							.replace(/{id}/g, iId)
							.replace(/{avatar}/g, sUser)
							.replace(/{name}/g, sUsername);


					$(existedUsersArea, selectedUsersArea)
						.prepend($(sTemplate).append(`<input type="hidden" name="users[]" value="${iId}" />`));
				}

				$(oUser).remove();
			}
		},
		loadTalksList: function(oMenu, mixedGroup){
			const { group } = mixedGroup,
				{ talksListItems } = window.oMessengerSelectors.TALKS_LIST;

			_oMessenger.oMenu.toggleMenuPanel();
			_oMessenger.oMenu.toggleAlwaysOnTop(false);
			_oMessenger.loadTalksListByParam(mixedGroup, () => {
				const oLotId = $(talksListItems).first(),
					  iLotId = oLotId && +oLotId.data('lot');

				if (iLotId && !oMUtils.isMobile())
					_oMessenger.loadTalk(iLotId);

				if (typeof _oMessenger.oHistory.pushState === 'function'){
					const oParentMenu = $(oMenu).closest("li.bx-menu-item");

					let sParentModule = '';
					if (oParentMenu.length)
						sParentModule = oParentMenu.attr('class').replace(/bx-menu-item-?|\s/ig, '');

					_oMessenger.oHistory.pushState({ action: 'load_talk', lot: iLotId, area: _oMessenger.oSettings.area_type, menu: sParentModule}, null);
				}
			});

		},
		loadTalkWithArea: function(iLotId, iJotId){
			const sArea = 'inbox',
 				  oParams = { group: sArea, lot: iLotId };

			_oMessenger.loadTalksListByParam(oParams, () => {
				_oMessenger.loadTalk(iLotId, iJotId); // set previous area type value to allow to load new talk, because area should be different
				_oMessenger.oHistory.pushState({ action: 'load_talk', lot: iLotId, jot: iJotId }, null);
			});
		},
		onReplyInThread: function (oObject) {
			const { jotMain } = window.oMessengerSelectors.JOT,
				oParams = { group: 'threads' };

			if (_oMessenger.isBlockVersion()) {
				window.location.href = _oMessenger.sJotUrl + +$(oObject).closest(jotMain).data('id');
				return;
  			}

			_oMessenger.loadTalksListByParam(oParams, () => {
				_oMessenger.onReplyInThread(oObject);
				_oMessenger.oHistory.pushState({ action: 'create_thread', lot: _oMessenger.oSettings.lot, jot: +$(oObject).closest(jotMain).data('id') }, null);
			});

		},
		toggleFilterTalks: function(){
			const { searchCriteria, searchInput, inboxAreaTitle } = window.oMessengerSelectors.TALKS_LIST;
			$(searchInput).toggle(function(){
				if ($(this).is(':visible')) {
					$(searchCriteria).focus();
					$(inboxAreaTitle).hide();
				} else
					$(inboxAreaTitle).fadeIn();
			});
		},
		removeProfileItem : function(oElement){
			const { selectedUsersArea } = window.oMessengerSelectors.CREATE_TALK,
				iId = +$(oElement).data('id');

			$(`input[value=${iId}]`, selectedUsersArea).remove();
			$(oElement).remove();
		},
		closeEditForm: function(){
			_oMessenger.disableCreateList();
		},
		clearSearch: () => {
			const { searchCriteria, searchCloseIcon } = window.oMessengerSelectors.TALKS_LIST;
			$(searchCriteria).val('');
			$(searchCloseIcon).hide();
			_oMessenger.searchByItems('');
			_oMessenger.aSearchJotsList = null;
		}
	}
})(jQuery);

/** @} */