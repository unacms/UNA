<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup	Messenger Messenger
 * @ingroup		UnaModules
 *
 * @{
 */

/**
 * Module  representation
 */
class BxMessengerTemplate extends BxBaseModGeneralTemplate
{
	function __construct(&$oConfig, &$oDb)
	{
		parent::__construct($oConfig, $oDb);
	}
	
	/**
	* Attach js and css files for messenger depends on page with messenger block
	*@param string $sMode 
	*/
	public function loadCssJs($sMode = 'all'){
	    $aCss = [
				   'main.css',
                   'video-conference.css',
                   'video-recorder.css',
                   'emoji.css',
                   'messenger-phone.css',
                   'quill.bubble.css',
                   'menu-accordion.css',
                   'lot-briefs.css',
                   'text-area.css',
                   'menu-column.css',
                   'history.css',
                   'history-header.css',
                   'message.css',
                   'talk.css',
                   'talks-list.css',
                   'info-block.css',
                   'time-divider.css',
                   'message-menu.css',
                   'giphy.css',
                   'tailwind-messenger.css',
                   'create-list.css',
                   'attachment.css',
                   'scroll-elements.css',
                   '3rd-libs.css',
                   'talk-info.css'
				];

		$aJs = [
                    'primus.js',
                    'record-video.js',
                    'editor.js',
                    'storage.js',
                    'connect.js',
                    'status.js',
                    'lazy-loading.js',
                    'selectors.js',
                    'jot-menu.js',
                    'giphy.js',
                    'messenger.js',
                    'RecordRTC.min.js',
                    'adapter.js',
                    'soundjs.min.js',
                    'quill.min.js',
                    'nav-menu.js',
                    'utils.js',
                    'media-accordion.js',
                    'notification-bubbles.js',
                    'jquery-ui/jquery.ui.widget.min.js',
                    'jquery-ui/jquery.ui.tooltip.min.js',
                    'emoji.js',
                    'create-convo-menu.js'
				];


		if ($sMode === 'all')
			array_push($aCss, 'messenger.css');

		if ($sMode === 'view')
			array_push($aCss, 'talk-block.css');

        if ($this->_oConfig->CNF['USE_MENTIONS']) {
            array_push($aCss, 'quill.mention.css');
            array_push($aJs, 'quill.mention.min.js');
        }

        $this->initFilesUploader();

        $this->addCss($aCss);
		$this->addJs($aJs); 
	}

	/**
	* Main function to build post messages area with messages history
	*@param int $iProfileId logged member id
	*@param int $iLotId id of conversation. It can be empty if new talk
	*@param int $iJotId jot id, allows to load history from jot's position
	*@return string html code
	*/
	public function getHistory($iProfileId, $iLotId = BX_IM_EMPTY, $iJotId = BX_IM_EMPTY){
		$CNF = $this->_oConfig->CNF;
		$aParams = [
			'content' => $this -> parseHtmlByName('history-block.html', array(
                'content' => MsgBox(_t('_bx_messenger_empty_history'))
            )),
            'info' => $this -> parseHtmlByName('info-area.html', []),
            'new_msg_active' => 'none',
            'unread_count' => 0
		];

        if ($iLotId){
            $iUnreadLotsJots = $this->_oDb->getUnreadJotsMessagesCount($iProfileId, $iLotId);
            if ($iUnreadLotsJots && !$iJotId)
                $iJotId = $this -> _oDb -> getFirstUnreadJot($iProfileId, $iLotId);

            $sContent = $this->getHistoryArea(['profile_id' => $iProfileId, 'lot' => $iLotId, 'jot' => $iJotId],
                                               $iUnreadLotsJots && $iUnreadLotsJots < (int)($CNF['MAX_JOTS_BY_DEFAULT']/2));
            $aParams = [
			    'content' => $sContent,
                'new_msg_active' => $iUnreadLotsJots ? 'block' : 'none',
                'unread_count' => $iUnreadLotsJots,
                'info' => $this -> parseHtmlByName('info-area.html', []),
            ];
		}

        $aParams['bx_if:search'] = array(
            'condition' => $this->_oConfig->isSearchCriteria(BX_SEARCH_CRITERIA_CONTENT),
            'content' => []
        );

		return bx_is_api() ? $aParams : $this -> parseHtmlByName('history.html', $aParams);
	}

    public function getHistoryArea($aData, $bRead = false, $bEmptyMessage = false){
        $CNF = $this->_oConfig->CNF;
        $iProfileId = isset($aData['profile_id']) ? (int)$aData['profile_id']: BX_IM_EMPTY;
        $iLotId = isset($aData['lot']) ? (int)$aData['lot']: BX_IM_EMPTY;
        $iJotId = isset($aData['jot']) ? (int)$aData['jot']: BX_IM_EMPTY;
        $sArea = isset($aData['area']) ? $aData['area']: '';

        $sContent = !$bEmptyMessage ? MsgBox(_t('_bx_messenger_empty_history')) : '';
        if ($iLotId){
            $aJots = $this -> getJotsOfLot($iProfileId,
                array(
                        'lot_id' => $iLotId,
                        'limit' => $CNF['MAX_JOTS_BY_DEFAULT'],
                        'start' => $iJotId,
                        'display' => true,
                        'select' => true,
                        'views' => true,
                        'read' => $bRead,
                        'area' => $sArea
                    ));

            if (!empty($aJots) && isset($aJots['content']))
                $sContent = $aJots['content'];
        }

        if (bx_is_api())
            return $aJots;

        return $this -> parseHtmlByName('history-block.html', array(
            'content' => $sContent
        ));
    }

	public function getTextArea($iProfileId, $iLotId = 0, $bHideTopics = false){
	    $CNF = $this->_oConfig->CNF;

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_SEND_MESSAGE, $iProfileId);
	    if (!$iProfileId || $mixedResult !== true)
	        return '';

	    $bRecorder = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_VIDEO_RECORDER, $iProfileId) === true;
        $bFiles = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_SEND_FIELS, $iProfileId) === true;
        $bGiphy = $CNF['GIPHY']['api_key'] !== '';
        $bSmiles = true;

        $bCheckAction = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $iProfileId) === true;
        $bIsAuthor = $bCheckAction || $this->_oDb->isAuthor($iLotId, $iProfileId);

        $mixedOptions = $this->_oDb->getLotSettings($iLotId);
        if ($mixedOptions !== FALSE && is_array($mixedOptions) && !$bIsAuthor) {
            if (!in_array(BX_MSG_SETTING_MSG, $mixedOptions))
               return '';

           $bFiles &= in_array(BX_MSG_SETTING_FILES, $mixedOptions);
           $bRecorder &= in_array(BX_MSG_SETTING_VIDEO_RECORD, $mixedOptions);
           $bGiphy &= in_array(BX_MSG_SETTING_GIPHY, $mixedOptions);
           $bSmiles = in_array(BX_MSG_SETTING_SMILES, $mixedOptions);
        }

	    $aVars = [
              'bx_if:giphy' => [
                  'condition' => $bGiphy,
                  'content' => []
              ],
              'bx_if:recording' => [
                  'condition' => $bRecorder,
                  'content' => []
              ],
              'bx_if:files' => [
                  'condition' => $bFiles,
                  'content' => []
              ],
              'bx_if:smiles' => [
                  'condition' => $bSmiles,
                  'content' => []
              ],
              'bx_if:text' => [
                  'condition' => true,
                  'content' => []
              ],
              'giphy' => $bGiphy ? $this->getGiphyPanel() : '',
              'bx_if:topics' => [
                  'condition' => !$iLotId && !$bHideTopics,
                  'content'  => []
              ]
         ];

        return $this -> parseHtmlByName('text-area.html', $aVars);
    }

	public function initFilesUploader(){
        $this->addCss(array(
            'filepond-custom.css',
            'filepond-plugin-media-preview.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond.min.css',
            BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'filepond/|filepond-plugin-image-preview.min.css'
        ));

        $this->addJs(array(
            'uploader.js',
            'filepond/filepond.min.js',
            'filepond/filepond-plugin-image-preview.min.js',
            'filepond/filepond-plugin-file-validate-size.min.js',
            'filepond-plugin-media-preview.min.js',
            'filepond-plugin-file-rename.min.js'
        ));

        $this->addJsTranslation(array(
            '_bx_messenger_upload_delete',
            '_bx_messenger_delete_confirm',
            '_bx_messenger_upload_invalid_file_type',
            '_bx_messenger_max_files_upload_error',
            '_bx_messenger_upload_is_complete',
            '_bx_messenger_upload_cancelled',
            '_bx_messenger_uploading_file',
            '_bx_messenger_invalid_server_response',
            '_bx_messenger_uploading_remove_button',
			'_bx_messenger_file_is_too_large_error',
            '_bx_messenger_file_is_too_large_error_details',
			'_bx_messenger_file_type_is_not_allowed',
            '_bx_messenger_empty_history',
            '_bx_messenger_create_talk_confirm'
        ));
    }

    private function getJotMenuCode($iJotId){
	    $CNF = &$this->_oConfig->CNF;

        $oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_JOT_MENU']);
        $oMenu->setContentId($iJotId);

        foreach($CNF['JOT-MENU-TO-SHOW'] as &$sName)
            $aItems['bx_repeat:items'][] = $oMenu->getMenuItemByName($sName);

        $aItems['jot_menu'] = $oMenu->getCode();
        return $this->parseHtmlByName('jot-menu.html', $aItems);
    }

    private function getFileMenuCode($iFileId, $bAllowedDelete){
        $CNF = &$this->_oConfig->CNF;

        $oStorage = new BxMessengerStorage($CNF['OBJECT_STORAGE']);
        $aFile = $oStorage->getFile($iFileId);
        $aMenuItems = [
                        [
                            'onclick' => "{$CNF['JSMain']}.downloadFile({$iFileId})",
                            'href' => $this->_oConfig->getBaseUri() . "download_file/{$iFileId}",
                            'attrs' => 'download="' . $aFile[$CNF['FIELD_ST_NAME']] . '"',
                            'title' => _t('_bx_messenger_file_download'),
                            'icon' => 'download'
                        ],
                        [
                            'permissions' => true,
                            'href' => 'javascript:void(0)',
                            'attrs' => '',
                            'onclick' => "{$CNF['JSMain']}.removeFile(this, {$iFileId})",
                            'title' => _t('_bx_messenger_upload_delete'),
                            'icon' => 'trash'
                        ],
                      ];

        $aVars = [];
        foreach ($aMenuItems as &$aItem) {
            if (isset($aItem['permissions']) && !$bAllowedDelete)
                continue;

            $aVars['bx_repeat:menu'][] = $aItem;
        }

        return $this->parseHtmlByName('file-menu.html', $aVars);
    }

    /**
     * Returns right side file's menu in talk history. Allows to  remove or download the file
     *@param int $iFileId file id in storage table
     *@param boolean $bIsDeleteAllowed is the vendor of the file
     *@return string html
     */
    public function getFileMenu($iFileId, $bIsDeleteAllowed = false){
        return $this -> getFileMenuCode($iFileId, $bIsDeleteAllowed);
    }

    /**
     * Main function to build post message block for any page
     * @param int $iProfileId logged member id
     * @param int $iLotId id of conversation. It can be empty if new talk
     * @param int $iJotId id of the message in history
     * @param bool $bIsBlockVersion
     * @return array content and title of the block
     */
	public function getTalkBlock($iProfileId, $iLotId = BX_IM_EMPTY, $iJotId = BX_IM_EMPTY, $bIsBlockVersion = false){
        $aData = [
                    'header' => $this->getTalkHeader($iLotId, $iProfileId, $bIsBlockVersion),
                    'history' => $this->getHistory($iProfileId, $iLotId, $iJotId)
                ];

	    return bx_is_api() ? $aData : $this -> parseHtmlByName('talk.html', array(
			'header' => $this->getTalkHeader($iLotId, $iProfileId, $bIsBlockVersion),
            'top_area'=> $this->getHistoryTopArea(),
			'history' => $this->getHistory($iProfileId, $iLotId, $iJotId),
            'text_area' => $this->getTextArea($iProfileId, $iLotId)
		));
	}

    public function getTalkBlockByUserName($iViewer, $iProfileId){
        return $this -> parseHtmlByName('talk.html', array(
            'header' => $this->getTalkHeaderForUsername($iViewer, $iProfileId),
            'top_area'=> $this->getHistoryTopArea(),
            'history' => $this-> getHistory($iViewer),
            'text_area' => $this->getTextArea($iViewer)
        ));
    }

	public function getTalkHeaderForUsername($iViewer, $iProfileId, $bWrap = true){
	    $oViewer = $this -> getObjectUser($iViewer);
        $oProfile = $this -> getObjectUser($iProfileId);
        if (!$oProfile || !$oViewer)
            return '';

	    return $bWrap ? $this -> parseHtmlByName('talk-header.html', array(
            'buttons' => '',
            'back_title' => bx_js_string(_t('_bx_messenger_lots_menu_back_title')),
            'title' => $this->getThumbsWithUsernames($iProfileId),
			'menu_button' => $this -> parseHtmlByName('mobile-menu-button.html', array())
        )): $this->getThumbsWithUsernames($iProfileId);
    }

    public function getThumbsWithUsernames($mixedProfiles){
	    if (empty($mixedProfiles))
	        return '';

	    $aProfiles = $aVars = array();
	    if (!is_array($mixedProfiles))
            $aProfiles[] = (int)$mixedProfiles;
	    else
            $aProfiles = $mixedProfiles;

	    foreach($aProfiles as &$iProfileId){
           $oProfile = $this -> getObjectUser($iProfileId);
           if (!$oProfile)
                continue;

           $sThumb = $oProfile->getThumb();
           $bThumb = stripos($sThumb, 'no-picture') === FALSE;
           $sDisplayName = $oProfile->getDisplayName();

           $aVars['bx_repeat:usernames'][] = array(
                'username' => $sDisplayName,
                'bx_if:avatars' => array(
                    'condition' => $bThumb,
                    'content' => array(
                        'thumb' => $sThumb,
                        'title' => $sDisplayName,
                    )
                ),
                'bx_if:letters' => array(
                    'condition' => !$bThumb,
                    'content' => array(
                        'color' => implode(', ', BxDolTemplate::getColorCode($iProfileId, 1.0)),
                        'title' => $sDisplayName,
                        'letter' => mb_substr($sDisplayName, 0, 1)
                    )
                )
           );
        }

        return $this -> parseHtmlByName('thumb-usernames.html', $aVars);
    }

    /**
     * @param integer $iLotId Talk's id
     * @param integer $iProfileId Viewer id
     * @param bool $bIsBlockVersion indicates if it is Block Messenger version
     * @return false|string
     */

	public function getTalkHeader($iLotId, $iProfileId, $bIsBlockVersion = false, $isArray = false){
	    $CNF = &$this->_oConfig->CNF;
        $aLotInfo = array();
        if ($iLotId)
            $aLotInfo = $this -> _oDb -> getLotInfoById($iLotId);

        $sTitle = _t('_bx_messenger_page_block_title');
        if (!empty($aLotInfo))
        {
            if ($aLotInfo[$CNF['FIELD_TITLE']])
                $sTitle = $aLotInfo[$CNF['FIELD_TITLE']];

            if (!$bIsBlockVersion && $this->_oDb->isLinkedTitle($aLotInfo[$CNF['FIELD_TYPE']]))
                $sTitle = _t('_bx_messenger_linked_title', '<a href ="' . $this->_oConfig->getPageLink($aLotInfo[$CNF['FIELD_URL']]) . '">' . $sTitle . '</a>');
            else if (!empty($aLotInfo[$CNF['FIELD_TITLE']]))
                $sTitle = _t($aLotInfo[$CNF['FIELD_TITLE']]);
            else if ($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
                $sTitle = $this -> getParticipantsNames($iProfileId, $iLotId);

            if ($aLotInfo[$CNF['FIELD_CLASS']] === BX_MSG_TALK_CLASS_MARKET) {
                $aParticipants = $this->_oDb->getParticipantsList($iLotId, true, $iProfileId);
                if (count($aParticipants) == 1) {
                    $sOpponent = BxDolProfile::getInstance(current($aParticipants))->getDisplayName();
                    $sTitle = $this->_oConfig->replaceConstant(_t('_bx_messenger_talk_types_market_title'), array('opponent' => $sOpponent));
                }
            }
        }

       $aVars = [
                  'buttons' => $this->getTalkHeaderButtons($iLotId, $bIsBlockVersion),
                  'title' => $sTitle,
                  'menu_button' => !$bIsBlockVersion ? $this->parseHtmlByName('mobile-menu-button.html', []) : ''
                ];

        return $isArray || bx_is_api() ? $aVars : $this -> parseHtmlByName('talk-header.html', $aVars);
    }

    public function getHistoryTopArea($sContent = ''){
	    return $this -> parseHtmlByName('history-top-area.html', ['content' => $sContent]);
    }

    public function getThreadTalkHeader($iProfileId, $iJotId){
        $CNF = &$this->_oConfig->CNF;
        $aParentLotInfo = $this->_oDb->getLotByJotId($iJotId);
        if (empty($aParentLotInfo))
            return '';

        $iLotId = $aParentLotInfo[$CNF['FIELD_ID']];
        $sTitle = $this -> getParticipantsNames($iProfileId, $aParentLotInfo[$CNF['FIELD_ID']]);
        $aVars = array(
            'buttons' => $this->getTalkHeaderButtons($iLotId, false),
            'title' => $sTitle,
            'menu_button' => $this->parseHtmlByName('mobile-menu-button.html', array())
        );

        return $this -> parseHtmlByName('talk-thread-header.html', $aVars);
    }

    public function getTalkHeaderButtons($iLotId, $bIsBlockVersion = false){
        $CNF = &$this->_oConfig->CNF;
	    $oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_TALK_MENU']);
	    $oMenu->setMessengerType($bIsBlockVersion);
	    $oMenu->setTemplateById(BX_DB_MENU_TEMPLATE_TABS);
        $oMenu->setContentId($iLotId);

        return $oMenu->getCode();
	}

	/**
	* Create top of the block with participants names and statuses
	*@param int $iProfileId logged member id
	*@param int $iLotId id of conversation. It can be empty if new talk
    *@return string HTML code
	*/
	public function getParticipantsNames($iProfileId, $iLotId){
		$aNickNames = array();

		$aParticipantsList = $this->_oDb->getParticipantsList($iLotId, true, $iProfileId);
		if (empty($aParticipantsList))
			return '';
		
		$iCount = count($aParticipantsList);
		$aParticipantsList = array_slice($aParticipantsList, 0, $this->_oConfig->CNF['PARAM_ICONS_NUMBER']);
	
		if (count($aParticipantsList) == 1)
		{
			$oProfile = $this -> getObjectUser($aParticipantsList[0]);
			if ($oProfile)
			{
				$aNickNames['bx_repeat:users'][] = array(
				    'profile_username' => $oProfile -> getUrl(),
					'username' =>  $oProfile -> getDisplayName(),
				);
			}
			$sCode = $this -> parseHtmlByName('status_usernames.html', $aNickNames);
		}
		else
		{
			foreach($aParticipantsList as $iParticipant)
			{			
				$oProfile = $this -> getObjectUser($iParticipant);
				if ($oProfile)
					$aNickNames[] = $oProfile->getDisplayName();
			}
			
			$sOthers = $iCount > (int)$this -> _oConfig -> CNF['PARAM_ICONS_NUMBER'] ? _t('_bx_messenger_lot_title_participants_number', $iCount - (int)$this -> _oConfig -> CNF['PARAM_ICONS_NUMBER']) : '';
			$sCode = $this -> parseHtmlByName('simple_usernames.html', array('usernames' => implode(', ', $aNickNames) . " {$sOthers}"));
		}
		
		return $sCode;
	}

    function getProfileItem($iProfileId){
        $oProfile = $this -> getObjectUser($iProfileId);

        if (!$oProfile)
            return false;

        $sThumb = $oProfile->getThumb();
        $bThumb = stripos($sThumb, 'no-picture') === FALSE;
        $sDisplayName = $oProfile->getDisplayName();

        $iUserId = $oProfile -> id();
        return [
                'name' => $sDisplayName,
                'id' => $iUserId,
                'bx_if:avatars' => array(
                    'condition' => $bThumb,
                    'content' => array(
                        'thumb' => $sThumb,
                        'title' => $sDisplayName,
                    )
                ),
                'bx_if:letters' => array(
                    'condition' => !$bThumb,
                    'content' => array(
                        'color' => implode(', ', BxDolTemplate::getColorCode($iUserId, 1.0)),
                        'title' => $sDisplayName,
                        'letter' => mb_substr($sDisplayName, 0, 1)
                    )
                )
            ];
    }
    function getProfilesListWithDesign($iLotId = 0, $aProfilesList = []){
        $aProfilesList = empty($aProfilesList) && $iLotId ? $this->_oDb->getParticipantsList($iLotId) : $aProfilesList;
        if (empty($aProfilesList))
            return '';

        $sProfilesList = '';
        foreach($aProfilesList as &$iValue) {
            if (!($aProfile = $this->getProfileItem($iValue)))
                continue;

            $sProfilesList .= $this->parseHtmlByName('edit-profiles-list-item.html', $aProfile);
        }

        return $sProfilesList;
    }

    public function _getBroadcastFields()
    {
        $CNF = &$this->_oConfig->CNF;
        if(!isset($CNF['OBJECT_FORM_FILTER']))
            return [];

        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_FILTER'], $CNF['OBJECT_FORM_FILTER_DISPLAY'], $this);
        if(!$oForm)
            return [];

        return $oForm->aInputs;
    }

    function getNotificationFormData(){
        $aNotifFields = [];
        if ($aNotifications = $this->_oDb->getNotificationsSettings($this->_oConfig->getName() . '_' . BX_MSG_NTFS_BROADCAST)) {
            $aNotifValues = [];
            foreach ($aNotifications as $sKey => $iValue) {
                if ((int)$iValue)
                    $aNotifValues[$sKey] = _t("_bx_messenger_broadcast_field_{$sKey}");
            }

            if (!empty($aNotifValues)){
                $aNotifFields['notifications'] = [
                    'type' => 'checkbox_set',
                    'skip' => true,
                    'caption' =>  _t('_bx_messenger_broadcast_field_notify'),
                    'info' => _t('_bx_messenger_broadcast_field_notify_info'),
                    'name' => 'notify_by',
                    'attrs' => ['class' => 'flex items-center'],
                    'attrs_wrapper' => ['class' => 'flex items-center'],
                    'value' => array_keys($aNotifValues),
                    'values' => $aNotifValues
                ];
            }
        }

        return $aNotifFields;
    }

    function getCreateListArea($iLotId = 0, $mixedProfiles = [], $bEmptyDefaultList = false){
        $sContent = '';

        $CNF = &$this->_oConfig->CNF;
	    if ($this->_oConfig->CNF['SHOW-FRIENDS'] && !$bEmptyDefaultList)
            $sContent = $this->getFriendsList();

       $sProfilesList = $iLotId ? $this->getProfilesListWithDesign($iLotId, $mixedProfiles) : '';
       $oCreateMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_CREATE_CONVO_MENU']);

	   return $this->parseHtmlByName('create-list.html', [
	       'items' => $sContent,
           'menu_button' => $this->parseHtmlByName('mobile-menu-button.html', []),
           'profiles_list' => $sProfilesList,
           'bx_if:broadcast' => [
                'condition' => $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_BROADCASTS) === true && !$iLotId,
                'content' => [
                    'convo_menu' => $oCreateMenu !== FALSE ? $oCreateMenu->getCode() : '',
                ],
           ],
           'bx_if:edit' => [
                'condition' => $iLotId,
                'content' => [ 'id' => $iLotId ]
              ]
           ]);
    }
	/**
	* Search friends function which shows fiends only if member have no any talks yet
	*@param string $sParam keywords
	*@return string html code
	*/
	function getFriendsList($sParam = '', $bListAsArray = false){
		$iLimit = (int)$this->_oConfig->CNF['PARAM_FRIENDS_NUM_BY_DEFAULT'] ?? 5;

		$sContent = MsgBox(_t('_Empty'));
		if (!$this->_oConfig->CNF['SHOW-FRIENDS'])
			return $sContent;

         $aFriends = [];
         if ($sParam)
         {
            $aUsers = BxDolService::call('system', 'profiles_search', array($sParam, $iLimit), 'TemplServiceProfiles');
            if (empty($aUsers))
                 return $sContent;

            foreach($aUsers as &$aValue)
                $aFriends[] = $aValue['value'];
         }
          else
         {
             bx_import('BxDolConnection');
             $oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends');
             if (!$oConnection || !$aFriends = $oConnection->getConnectionsAsArray('content', bx_get_logged_profile_id(), 0, false, 0, $iLimit + 1, BX_CONNECTIONS_ORDER_ADDED_DESC))
                 return $sContent;
         }

        return $this->getProfilesListPreviewForCreateTalkArea($aFriends, !$bListAsArray);
	}

	function getProfilesListPreviewForCreateTalkArea($aList, $bWrap = true){
        $aItems = [];
	    foreach($aList as &$iValue){
            if (!($oProfile = $this -> getObjectUser($iValue)))
                continue;

            $sThumb = $oProfile->getThumb();
            $bThumb = stripos($sThumb, 'no-picture') === FALSE;
            $sDisplayName = $oProfile->getDisplayName();

            $aItems[] = array(
                'name' => $sDisplayName,
                'id' => $oProfile -> id(),
                'bx_if:avatars' => array(
                    'condition' => $bThumb,
                    'content' => array(
                        'thumb' => $sThumb,
                        'title' => $sDisplayName,
                    )
                ),
                'bx_if:letters' => array(
                    'condition' => !$bThumb,
                    'content' => array(
                        'color' => implode(', ', BxDolTemplate::getColorCode($iValue, 1.0)),
                        'title' => $sDisplayName,
                        'letter' => mb_substr($sDisplayName, 0, 1)
                    )
                )
            );
        }

        if (!$bWrap)
            return $aItems;

        return $this -> parseHtmlByName('profiles-list.html', ['bx_repeat:profiles' => $aItems]);
    }
	/**
	*  List of Lots (left side block content)
	*@param int $iProfileId logged member id
	*@param array $aLots list of lost to show
	*@param boolean $bShowTime display time(last message) in the right side of the lot
	*@return string html code
	*/
	function getLotsPreview($iProfileId, $aLots, $bShowTime = true){
		$CNF = &$this->_oConfig->CNF;

		$sContent = '';
		$aContent = [];
		foreach($aLots as &$aLot) {
          $aVars = [];
		  $aParticipantsList = $this -> _oDb -> getParticipantsList($aLot[$CNF['FIELD_ID']], true, $iProfileId);
		  $iParticipantsCount = count($aParticipantsList);
		  $aParticipantsList = $iParticipantsCount ? array_slice($aParticipantsList, 0, $CNF['PARAM_ICONS_NUMBER']) : [$iProfileId];
          $oAuthor = null;

          $sGroupName = $sModuleTitle = $sThumb = $sModuleIcon = '';
          $bIsGroupTalk = isset($aLot[$CNF['FMGL_GROUP_ID']]) && (int)$aLot[$CNF['FMGL_GROUP_ID']];
          if ($bIsGroupTalk) {
                $aGroupInfo = $this->_oDb->getGroup($aLot[$CNF['FMGL_GROUP_ID']]);
                if ($aGroupInfo[$CNF['FMG_MODULE']] !== BX_MSG_TALK_TYPE_PAGES) {
                    $oGroupProfile = BxDolProfile::getInstance($aGroupInfo[$CNF['FMG_PROFILE_ID']]);
                    if ($oGroupProfile) {
                        $sThumb = $oGroupProfile->getIcon();
                        if (!$sThumb)
                            $sThumb = bx_srv($aGroupInfo[$CNF['FMG_MODULE']], 'get_thumb', [$oGroupProfile->getContentId()]);

                        $aVars['author_module'] = $sModule = $oGroupProfile->getModule();
                        $sModuleTitle = _t('_' . $oGroupProfile->getModule());
                        $aGroupItemInfo = BxDolService::call($oGroupProfile->getModule(), 'get_info', [$oGroupProfile->getContentId(), false]);
                        if (!empty($aGroupItemInfo)) {
                            $oModule = BxDolModule::getInstance($aGroupInfo[$CNF['FMG_MODULE']]);
                            if ($oModule->_oConfig) {
                                $oMCNF = $oModule->_oConfig->CNF;
                                $sGroupName = isset($aGroupItemInfo[$oMCNF['FIELD_TITLE']]) ? $aGroupItemInfo[$oMCNF['FIELD_TITLE']] : '';
                            }
                        }
                    }

                    if (!$sThumb)
                        $sThumb = BxDolModule::getInstance($aGroupInfo[$CNF['FMG_MODULE']])->_oTemplate->getImageUrl('no-picture.svg');

                    $sModuleIcon = $sThumb;
                } else
                {
                    $sModuleIcon = $this->_oConfig->getPageIcon();                    
                    $sThumb = $sModuleIcon;

                    $aVars['author_module'] = 'bx_pages';
                    $sModuleTitle = _t('_bx_messenger_pages');
                    $aUrl = array();
                    parse_str($aGroupInfo[$CNF['FMG_URL']], $aUrl);
                    if (isset($aUrl['i']) && ($oPage = BxTemplPage::getObjectInstanceByURI($aUrl['i']))) {
                        $aPageObject = $oPage->getObject();
                        $sGroupName = _t($aPageObject['title']);
                    }
                }

                $aVars['bx_repeat:avatars'][] = [
                    'bx_if:avatars' => [
                            'condition' => true,
                            'content' => [
                                'title' => $sModuleTitle,
                                'thumb' => $sModuleIcon,
                        ]
                    ],
                    'bx_if:letters' => [
                        'condition' => false,
                        'content' => []
                    ]
                ];
            }
            else
            {
                $oAuthor = $iParticipantsCount == 1 ? $this->getObjectUser(current($aParticipantsList)) : $this->getObjectUser($aLot[$CNF['FIELD_AUTHOR']]);
                $sThumb = $oAuthor->getThumb();
                $bThumb = stripos($sThumb, 'no-picture') === FALSE;
                $sTitle = $oAuthor->getDisplayName();
                    
                $aVars['bx_repeat:avatars'][] = array(
                    'bx_if:avatars' => array(
                        'condition' => $bThumb,
                        'content' => array(
                            'title' => $sTitle,
                            'thumb' => $sThumb,
                        )
                    ),
                    'bx_if:letters' => array(
                        'condition' => !$bThumb,
                        'content' => array(
                            'color' => implode(', ', BxDolTemplate::getColorCode($aLot[$CNF['FIELD_AUTHOR']], 1.0)),
                            'letter' => mb_substr($sTitle, 0, 1)
                        )
                    )
                );
            }

            if (!$CNF['HIDE-PARTS']) {
                $aLastAnsweredParticipants = $this->_oDb->getLatestJotsAuthors($aLot[$CNF['FIELD_ID']]);
                $aParticipantsViewList = [];
                foreach ($aLastAnsweredParticipants as $iParticipant) {
                    $oProfile = $this->getObjectUser($iParticipant);
                    if ($oProfile) {
                        $sThumb = $oProfile->getThumb();
                        $bThumb = stripos($sThumb, 'no-picture') === FALSE;
                        $sDisplayName = $oProfile->getDisplayName();
                        $aParticipantsViewList[] = array(
                            'bx_if:avatars' => array(
                                'condition' => $bThumb,
                                'content' => array(
                                    'title' => $sDisplayName,
                                    'thumb' => $sThumb,
                                )
                            ),
                            'bx_if:letters' => array(
                                'condition' => !$bThumb,
                                'content' => array(
                                    'color' => implode(', ', BxDolTemplate::getColorCode($iParticipant, 1.0)),
                                    'letter' => mb_substr($sDisplayName, 0, 1)
                                )
                            )
                        );
                    }
                }

                $aVars['bx_if:parts_list'] = ['condition' => true, 'content' => ['bx_repeat:participants' => $aParticipantsViewList]];
            } else
                $aVars['bx_if:parts_list'] = ['condition' => false, 'content' => []];
			
			if (!empty($aLot[$CNF['FIELD_TITLE']]))
				$sTitle = _t($aLot[$CNF['FIELD_TITLE']]);
			else
			{
                $aNickNamesTitles = [];
                foreach ($aParticipantsList as &$iPartId)
                    $aNickNamesTitles[] = $this->getObjectUser($iPartId)->getDisplayName();

			    if ($iParticipantsCount > 3)
					$sTitle = implode(', ', array_slice($aNickNamesTitles, 0, $CNF['PARAM_ICONS_NUMBER'])) . '...';
				else
					$sTitle = implode(', ', $aNickNamesTitles);
			}

			$sStatus = $sCount = '';
			if ($iParticipantsCount <= 1 && $oAuthor && !$bIsGroupTalk){
                $sStatus = (method_exists($oAuthor, 'isOnline') ? $oAuthor -> isOnline() : false) ?
					$this -> getOnlineStatus($oAuthor-> id(), 1) :
					$this -> getOnlineStatus($oAuthor-> id(), 0) ;
			}
			else
                $sCount = '<div class="bx-def-label bx-def-font-middle status">' . $iParticipantsCount .'</div>';

			$aVars[$CNF['FIELD_ID']] = $aLot[$CNF['FIELD_ID']];
			$aVars[$CNF['FIELD_TITLE']] = $sTitle;
			$aVars['number'] = $sCount;
			$aVars['status'] = $sStatus;

			$aLatestJots = $this -> _oDb -> getLatestJot($aLot[$CNF['FIELD_ID']]);
			$aVars[$CNF['FIELD_MESSAGE']] = $aVars['sender_username'] = '';

            $iTime = bx_time_js($aLot[$CNF['FIELD_ADDED']], BX_FORMAT_DATE);
            if (bx_is_api()) {
                $iTime = $aLot[$CNF['FIELD_ADDED']];
            }

            $aVars[$CNF['FIELD_AUTHOR']] = $aLot[$CNF['FIELD_AUTHOR']];

            $sMessage = '';
			if (!empty($aLatestJots)) {
                $aAttachType = [];
                if ($aLatestJots[$CNF['FIELD_MESSAGE_AT_TYPE']])
                    $aAttachType = array($aLatestJots[$CNF['FIELD_MESSAGE_AT_TYPE']] => $aLatestJots[$CNF['FIELD_MESSAGE_AT']]);
                else if ($aLatestJots[$CNF['FIELD_MESSAGE_AT']])
                    $aAttachType = @unserialize($aLatestJots[$CNF['FIELD_MESSAGE_AT']]);

				if (isset($aLatestJots[$CNF['FIELD_MESSAGE']])) {
                    $sMessage = preg_replace( '/<br\W*?\/>|\n/', " ", $aLatestJots[$CNF['FIELD_MESSAGE']]);
				    $sMessage = html2txt($sMessage);
                    if (isset($aAttachType[BX_ATT_TYPE_REPOST]))
                    {
                        $sMessage = $this -> _oConfig -> cleanRepostLinks($sMessage, $aAttachType[BX_ATT_TYPE_REPOST]);
                        $sMessage = $sMessage ? $sMessage : _t('_bx_messenger_repost_message');
                    }

                    $sMessage = BxTemplFunctions::getInstance()->getStringWithLimitedLength($sMessage, $CNF['MAX_PREV_JOTS_SYMBOLS']);
				}

                if (!$sMessage){
                    if (isset($aAttachType[BX_ATT_TYPE_FILES]))
                        $sMessage = _t('_bx_messenger_attached_files_message', $this -> _oDb -> getJotFiles($aLatestJots[$CNF['FIELD_MESSAGE_ID']], true));

                    if (isset($aAttachType[BX_ATT_TYPE_GIPHY]))
                        $sMessage = _t('_bx_messenger_attached_giphy_message');

                    if ((int)$aLatestJots[$CNF['FIELD_MESSAGE_VIDEOC']])
                        $sMessage = _t('_bx_messenger_lots_menu_video_conf_start');
                }

				if ($oSender = $this -> getObjectUser($aLatestJots[$CNF['FIELD_MESSAGE_AUTHOR']]))
				{
					$aVars['sender_username'] = $oSender -> id() == $iProfileId ? _t('_bx_messenger_you_username_title') : $oSender -> getDisplayName();
                    $sModuleIcon = $sModuleIcon ? $sModuleIcon : $oSender -> getIcon();
				}
				
				$iTime = bx_is_api() ? $aLatestJots[$CNF['FIELD_MESSAGE_ADDED']] : bx_time_js($aLatestJots[$CNF['FIELD_MESSAGE_ADDED']], BX_FORMAT_DATE);
			}

			$iUnreadJotsCount = $this->_oDb->getNewJots($iProfileId, $aLot[$CNF['FIELD_ID']], true);

            $aVars['class'] = $iUnreadJotsCount ? 'unread-lot' : '';
			$aVars['title_class'] = $iUnreadJotsCount ? 'bx-def-font-extrabold' : '';
			$aVars['message_class'] = $iUnreadJotsCount ? 'bx-def-font-semibold' : '';
			$aVars['view_in_chat'] = '';
			$aVars['bubble_class'] = $iUnreadJotsCount ? '' : 'hidden';
			$aVars['count'] = $iUnreadJotsCount;
                        $aVars['participants'] = $aLot[$CNF['FIELD_PARTICIPANTS']];
                        

            $aVars['bx_if:user'] = [
                'condition' => $sModuleIcon,
                'content' => [
                    'talk_type' => $bIsGroupTalk ? $sModuleTitle : $aVars['sender_username'],
                    'icon' => $sModuleIcon,
                    'message' => $bIsGroupTalk && $sGroupName ? $sGroupName : $sMessage
                ]
            ];

	        $aVars['bx_if:timer'] = ['condition' => $bShowTime, 'content' => [ 'time' => $iTime ]];
	        $oTemplate = &$this;
            bx_alert($this->_oConfig->getObject('alert'), 'talk_preview_data', $aLot[$CNF['FIELD_ID']], $aLot[$CNF['FIELD_ID']], [
               'vars' => &$aVars,
               'template' => &$oTemplate,
               'talk' => $aLot,
            ]);

			$aContent[] = $aVars;
			$sContent .= $oTemplate->parseHtmlByName('lots-briefs.html',  $aVars);
		}
		
		return  bx_is_api() ? $aContent : $sContent;
	}
  
  	/**
	* Builds top talk area with Profiles names and Statuses
	*@param int $iProfileId logget member id
	*@param int $iStatus member status
	*@return string html code
	*/
	private function getOnlineStatus($iProfileId, $iStatus){
	    switch($iStatus){
			case 0:
					$sTitle = _t('_bx_messenger_offline');
					$sClass = 'offline';
				break;
			case 2:
					$sTitle = _t('_bx_messenger_away');
					$sClass = 'away';
				break;
			default:
					$sTitle = _t('_bx_messenger_online');
					$sClass = 'online';
		}


		return !bx_is_api() ? $this -> parseHtmlByName('online-status.html', array(
			'id' => (int)$iProfileId,
			'title' => $sTitle,
			'class' => $sClass
		)) : $sClass ;
	}

    /**
     * Returns html with users show viewed the message
     * @param $iJotId int message id
     * @param $iExcludeProfile int exclude defined profile id from the list
     * @return bool|string
     */
	public function getViewedJotProfiles($iJotId, $iExcludeProfile = 0){
        $CNF = $this->_oConfig->CNF;
        $aJotInfo = $this -> _oDb -> getJotById($iJotId);
        if (empty($aJotInfo))
            return '';

        $aResult = $aParticipants = $this -> _oDb -> getParticipantsList($aJotInfo[$CNF['FIELD_MESSAGE_FK']], true);
        if ($CNF['MAX_VIEWS_PARTS_NUMBER'] < count($aResult))
            return '';

        $aUnreadProfiles = $this->_oDb->getForWhomJotIsNew($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $iJotId);
        if (!empty($aUnreadProfiles))
            $aResult = array_diff($aParticipants, $aUnreadProfiles);
        else
            $aResult = $aParticipants;

        $aIcons = array();
        foreach($aResult as &$iProfileId) {
            if ($iExcludeProfile && +$iExcludeProfile == +$iProfileId)
                continue;

            if ($oProfile = BxDolProfile::getInstance($iProfileId))
                $aIcons[] = array(
                    'id' => $iProfileId,
                    'icon' => $oProfile->getIcon(),
                    'name' => $oProfile->getDisplayName(),
                );
        }

        return $this -> parseHtmlByName('viewed.html', array(
            'bx_repeat:viewed' => $aIcons
        ));
    }
	/**
	* Get jots list by specified criteria
	*@param int $iProfileId logged member id
	*@param array $aParams options
	*	- int $iLotId 
	*	- string $sUrl of the lot block
	*	- int $iStart jot's id from which to load the messages
	*	- string $sLoad type of the load (new jots or prev from history) 
	*	- int $iLimit number of jots
	*	- boolean $bDisplay make jots visible before loading
	*	- string html code
	*	- boolean load history from defined jot id and to select it
    *@return array HTML code
	*/
	public function getJotsOfLot($iProfileId, $aParams){
        $CNF = &$this -> _oConfig -> CNF;
		$iLotId = isset($aParams['lot_id']) ? (int)$aParams['lot_id'] : BX_IM_EMPTY;
		$sUrl = isset($aParams['url']) ? $aParams['url'] : BX_IM_EMPTY_URL;
		$iStart = isset($aParams['start']) ? (int)$aParams['start'] : BX_IM_EMPTY; 
		$sLoad = isset($aParams['load']) ? $aParams['load'] : 'new';
		$iLimit = isset($aParams['limit']) ? (int)$aParams['limit'] : BX_IM_EMPTY; 
		$bDisplay = isset($aParams['display']) ? (bool)$aParams['display'] : false;
		$bSelectJot = isset($aParams['select']) ? (bool)$aParams['select'] : false;
		$bMarkAsRead = isset($aParams['read']) && $aParams['read'] === true;
        $bShowViews = isset($aParams['views']);
        $bDynamic = isset($aParams['dynamic']);
        $iParent = isset($aParams['parent']) && $aParams['parent'] ? $aParams['parent'] : 0;
        $sArea = isset($aParams['area']) ? $aParams['area'] : 0;

        $aResult = array('content' => '');
		$aLotInfo = $this -> _oDb -> getLotByIdOrUrl($iLotId, $sUrl, $iProfileId);
		if (empty($aLotInfo))
			return bx_is_api() ? [] : $aResult;

		if ($bSelectJot && $iStart){
		    $aStartMiddleJot = $this -> _oDb -> getJotsByLotId([
		        'lot' => $aLotInfo[$CNF['FIELD_ID']],
                'start' => $iStart,
                'mode' => 'prev',
                'area' => $sArea,
                'limit' => (int)$CNF['MAX_JOTS_BY_DEFAULT']/2]);

			if (!empty($aStartMiddleJot))
			    $iStart = current($aStartMiddleJot)[$CNF['FIELD_MESSAGE_ID']];
		}
		
		$aJots = $this->_oDb->getJotsByLotId(['lot' => $aLotInfo[$CNF['FIELD_ID']],
                                              'start' => $iStart,
                                              'mode' => $sLoad,
                                              'area' => $sArea,
                                              'limit' => $iLimit,
                                              'include' => $bSelectJot && $iStart,
                                              'parent' => $iParent]);
		if (bx_is_api())
            return $aJots;
                
		if (empty($aJots))
			return $aResult;

        $iJotCount = count($aJots);
		$aVars['bx_repeat:jots'] = array();
        $iFirstUnreadJot = $this->_oDb->getFirstUnreadJot($iProfileId, $iLotId);
		$bShowThreadsMenu = !(int)$aLotInfo[$CNF['FIELD_PARENT_JOT']];
        $iTimeFromToShift = $iPrevAuthor = 0;
		foreach($aJots as $iKey => $aJot) {
            $oProfile = $this->getObjectUser($aJot[$CNF['FIELD_MESSAGE_AUTHOR']]);
            $iJot = $aJot[$CNF['FIELD_MESSAGE_ID']];
            $bMediaAttachment = $bShowDateSeparator = false;
            if (!$iTimeFromToShift || (($iTimeFromToShift + $CNF['DATE-SHIFT']) < $aJot[$CNF['FIELD_MESSAGE_ADDED']])){
                $bShowDateSeparator = true;
                $iTimeFromToShift = $aJot[$CNF['FIELD_MESSAGE_ADDED']];
            }

            if ($oProfile) {
                    $sReply = $sAttachment = $sMessage = '';
                    $aAttachments = [];
                    $bIsTrash = (int)$aJot[$CNF['FIELD_MESSAGE_TRASH']];
                    $iIsVC = (int)$aJot[$CNF['FIELD_MESSAGE_VIDEOC']];
                    $bIsLotAuthor = $this->_oDb->isAuthor($iLotId, $iProfileId);
                    $isAllowedDelete = $this->_oDb->isAllowedToDeleteJot($aJot[$CNF['FIELD_MESSAGE_ID']], $iProfileId, $aJot[$CNF['FIELD_MESSAGE_AUTHOR']], $aJot[$CNF['FIELD_MESSAGE_FK']]);

                    if ($bIsTrash || ($iIsVC && !$aJot[$CNF['FIELD_MESSAGE']]))
                        $sMessage = $this->getMessageIcons($aJot[$CNF['FIELD_MESSAGE_ID']], $bIsTrash ? 'delete' : 'vc', isAdmin() || $bIsLotAuthor);
                    else
                    {
                        if ($aLotInfo[$CNF['FIELD_TYPE']] != BX_IM_TYPE_BROADCAST || ($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_BROADCAST && empty($aJot[$CNF['FIELD_MESSAGE_AT']])))
                        $sMessage = $this->_oConfig->bx_linkify($aJot[$CNF['FIELD_MESSAGE']]);

                        if (!empty($aJot[$CNF['FIELD_MESSAGE_AT']])) {
                            $aAttachments = $this->getAttachment($aJot);
                            if (isset($aAttachments[BX_ATT_GROUPS_ATTACH]) && !empty($aAttachments[BX_ATT_GROUPS_ATTACH])) {
                                $sAttachment = $aAttachments[BX_ATT_GROUPS_ATTACH];

                                $bIsEmpty = false;
                                bx_alert($this->_oConfig->getObject('alert'), 'attachment_before', $iJot, $iLotId, [
                                    'is_empty' => &$bIsEmpty
                                ]);

                                if ($bIsEmpty) {
                                    $aVars['bx_repeat:jots'][] = $this->getEmptyMessageTemplate(['attachment' => $sAttachment, 'id' => $iJot]);

                                    if ($bMarkAsRead)
                                        $this->_oDb->readMessage($iJot, $iProfileId);

                                    continue;
                                }
                            }
                        }

                        if (($iReplyId = (int)$aJot[$CNF['FIELD_MESSAGE_REPLY']]) && ($aReplyJot = $this->_oDb->getJotById($iReplyId))) {
                            $sReply = $this->parseHtmlByName('reply.html', [
                                'id' => $iReplyId,
                                'message' => $this->getReplyPreview($iReplyId),
                            ]);
                        }
                    }


                $sActionIcon = '';
                $sDisplayName = $oProfile->getDisplayName();
                if (!$bIsTrash) {
                    if ($aJot[$CNF['FIELD_MESSAGE_EDIT_BY']])
                        $sActionIcon = $this->parseHtmlByName('edit-icon.html',
                            [
                                'edit' => _t('_bx_messenger_edit_by',
                                bx_process_output($aJot[$CNF['FIELD_MESSAGE_LAST_EDIT']], BX_DATA_DATETIME_TS),
                                $this->getObjectUser($aJot[$CNF['FIELD_MESSAGE_EDIT_BY']])->getDisplayName()),
                            ]
                        );
                    else
                        if ($iIsVC && $aJot[$CNF['FIELD_MESSAGE']]) {
                            $aJVCItem = $this->_oDb->getJVCItem($iIsVC);
                            $sActionIcon = $this->parseHtmlByName('vc_icon.html',
                                array(
                                    'info' => _t('_bx_messenger_jitsi_vc_into_title', $sDisplayName->getDisplayName(), bx_process_output($aJVCItem[$CNF['FJVCT_START']], BX_DATA_DATETIME_TS))
                                )
                            );
                        }

                }

                $sThumb = $oProfile->getThumb();
                $bThumb = stripos($sThumb, 'no-picture') === FALSE;

                $sReactions = $this->getJotReactions($iJot);
				$aVars['bx_repeat:jots'][] = [
                    'new' => (int)($iFirstUnreadJot && $iJot >= $iFirstUnreadJot),
                    'immediately' => +$this->_oConfig->CNF['REMOVE_MESSAGE_IMMEDIATELY'],
                    'bx_if:show_author' => array(
                        'condition' => $iPrevAuthor !== $oProfile->id(),
                        'content' => array(
                            'url' => $oProfile->getUrl(),
                            'bx_if:avatars' => array(
                                'condition' => $bThumb,
                                'content' => array(
                                    'thumb' => $sThumb,
                                    'title' => $sDisplayName,
                                )
                            ),
                            'bx_if:letters' => array(
                                'condition' => !$bThumb,
                                'content' => array(
                                    'color' => implode(', ', BxDolTemplate::getColorCode($aJot[$CNF['FIELD_MESSAGE_AUTHOR']], 1.0)),
                                    'letter' => mb_substr($sDisplayName, 0, 1)
                                )
                            ),
                        )
                    ),
                    'bx_if:show_title' => array(
                        'condition' => $iPrevAuthor !== $oProfile->id(),
                        'content' => array(
                            'title' => $sDisplayName,
                        )
                    ),
                    'bx_if:time-separator' => array(
                        'condition' => $bShowDateSeparator,
                        'content' => [
                            'date' => $this-> getDateSeparator($aJot[$CNF['FIELD_MESSAGE_ADDED']]),
                        ]
                    ),
                    'bx_if:new' => array(
                        'condition' => $iPrevAuthor !== $oProfile->id(),
                        'content' => array()
                    ),
                    'id' => $aJot[$CNF['FIELD_MESSAGE_ID']],
                    'message' => preg_replace('/(?:\s*<br *\/?>\s*)+$/', "", $sMessage),
                    'attachment' => $sAttachment,
					'reply' => $sReply,
                    'my' => (int)$iProfileId === (int)$aJot[$CNF['FIELD_MESSAGE_AUTHOR']] ? 1 : 0,
                    'bx_if:jot_menu' => array(
                        'condition' => $iProfileId && !$bIsTrash,
                        'content' => array(
                            'jot_menu' => $this->getJotMenuCode($iJot)
                        )
                    ),
                    'icons' => $sMessage ? $this->parseHtmlByName('jot-icons.html', array(
                        'edit_icon' => $aJot[$CNF['FIELD_MESSAGE_EDIT_BY']] && !$bIsTrash ?
                            $this->parseHtmlByName('edit-icon.html',
                                array(
                                    'edit' => _t('_bx_messenger_edit_by',
                                        bx_process_output($aJot[$CNF['FIELD_MESSAGE_LAST_EDIT']], BX_DATA_DATETIME_TS),
                                        $this->getObjectUser($aJot[$CNF['FIELD_MESSAGE_EDIT_BY']])->getDisplayName()),
                                )
                            ) : '',
                        'views' => $bShowViews && ($iJotCount - 1 == $iKey) ? $this->getViewedJotProfiles($iJot, $iProfileId) : '',
                    )) : '',
                    'bx_if:show_reactions_area' => array(
                        'condition' => !$bIsTrash,
                        'content' => array(
                            'bx_if:reactions' => array(
                                'condition' => true,
                                'content' => array(
                                    'reactions' => $sReactions,
                                    'bx_if:reactions_menu' => array(
                                        'condition' => $iProfileId,
                                        'content' => array(
                                            'display' => $sReactions ? 'block' : 'none',
                                        )
                                    ),
                                )
                            ),
                            'bx_if:edit' => array(
                                'condition' => $isAllowedDelete,
                                'content' => array()
                            ),
                        )
                    ),
                    'thread_replies' => $this->getThreadReply($iJot),
                    'display' => !$bDisplay ? 'style="display:none;"' : '',
                    'bx_if:blink-jot' => array(
                        'condition' => $bSelectJot && $aParams['start'] == $iJot,
                        'content' => array()
                    ),
                    'display_message' => '',
                    'view_in_chat' => in_array($sArea, $CNF['VIEW-IN-TALKS']) ?
                                        $this->parseHtmlByName('view-in-chat.html', array('lot' => $iLotId, 'jot' => $iJot)) : "",
                    'message_class' => !$sMessage ? 'hidden' : '',
                ];

                if ($bMarkAsRead)
                    $this->_oDb->readMessage($aJot[$CNF['FIELD_MESSAGE_ID']], $iProfileId);

                $iPrevAuthor = $oProfile->id();
            }
        }

        if ($bMarkAsRead)
            $this->_oDb->markNotificationAsRead($iProfileId, $iLotId);

		return ['content' => $this -> parseHtmlByName('jots.html',  $aVars),
                'first_jot' => $sLoad == 'prev' ? $aJots[count($aJots) - 1] : $aJots[0]];
	}

	function getDateSeparator($iDate){
	    return $this->parseHtmlByName('date-separator.html', array('date' => $this->_oConfig->getSeparatorTime($iDate)));
    }

    /**
     * Builds left column with content
     *@param int $iProfileId logged member id
     *@return string html code
     */
    public function getLotsList($iProfileId, $iSelectedLotId = 0){
        $CNF = &$this->_oConfig->CNF;
        $aMyLots = $this->_oDb->getMyLots($iProfileId);
        $sContent = MsgBox(_t('_Empty'));
        if (!empty($aMyLots)) {
            if ($iSelectedLotId && array_search($iSelectedLotId, array_column($aMyLots, $CNF['FIELD_ID'])) === false) {
                $aPrependConvo = $this->_oDb->getLotInfoById($iSelectedLotId);
                $aMyLots = array_merge([$aPrependConvo], $aMyLots);
            }

            $sContent = $this->getLotsPreview($iProfileId, $aMyLots);
        }

        $bSimpleMode = $this->_oConfig->CNF['SHOW-SEARCH-BOX'];

        $oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_TALK_MENU']);
		$aVars = [
                    'items' => $sContent,
                    'custom_class_title' => $bSimpleMode ? 'hidden' : 'block',
                    'custom_class_search' => $bSimpleMode ? 'block' : 'hidden',
                    'search_for_title' => bx_js_string(_t('_bx_messenger_search_for_lost_title')),
                    'bx_repeat:menu' => [['menu_title' => _t("_bx_messenger_lots_type_all"), 'type' => 0, 'count' => '']],
                    'star_icon' => $CNF['STAR_ICON'],
                    'star_color' => $CNF['STAR_BACKGROUND_COLOR'],
                    'bx_if:create' => array(
                        'condition' => $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_TALKS, $iProfileId) === true,
                        'content' => array(
                            'create_lot_title' => bx_js_string(_t('_bx_messenger_lots_menu_create_lot_title')),
                        )
                    ),
                    'bx_if:featured' => array(
                        'condition' => $oMenu->isActive('star'),
                        'content' => array(
                            'star_title' => bx_js_string(_t('_bx_messenger_lots_menu_star_title')),
                        )
                    )
                ];

		return  bx_is_api() ? $aVars : $this -> parseHtmlByName('lots-list.html', $aVars);
	}

    /**
     * Create js configuration for the messenger depends on administration settings
     * @param int $iProfileId logged member id
     * @param bool $bBlockVersion
     * @param int $iLotId
     * @param int $iJotId
     * @param int $iPersonToTalk
     * @param int $iType
     * @return string html code
     */
	public function loadConfig($iProfileId, $aParams){
	    $CNF = &$this->_oConfig->CNF;
	    $aUrlInfo = parse_url(BX_DOL_URL_ROOT);

        $bBlockVersion = isset($aParams['is_block_version']) ? (bool)$aParams['is_block_version'] : true;
        $iLotId = isset($aParams['lot']) ? (int)$aParams['lot'] :  BX_IM_EMPTY;
        $iJotId = isset($aParams['jot']) ? (int)$aParams['jot'] : BX_IM_EMPTY;
        $iPersonToTalk = isset($aParams['selected_profile']) ? (int)$aParams['selected_profile'] : BX_IM_EMPTY;
        $iType =  isset($aParams['type']) ? (int)$aParams['type'] : BX_IM_TYPE_PRIVATE;
        $sWelcomeMessage = isset($aParams['welcome']) ? strval($aParams['welcome']) : '';

	    $oEmbed = BxDolEmbed::getObjectInstance();
        $sEmbedTemplate = '';
		if($oEmbed && $CNF['USE_EMBEDLY'])
           $sEmbedTemplate = $oEmbed->getLinkHTML('__url__');

        $this->addJsTranslation(array(
            '_bx_messenger_online',
            '_bx_messenger_offline',
            '_bx_messenger_away',
            '_bx_messenger_repost_message',
            '_bx_messenger_close_video_confirm',
            '_bx_messenger_video_recorder_is_not_available',
            '_bx_messenger_video_recorder_is_blocked',
            '_bx_messenger_max_video_file_exceeds',
            '_bx_messenger_video_record_is_not_supported',
            '_bx_messenger_search_no_results',
            '_bx_messenger_search_query_issue',
            '_bx_messenger_wait_for_uploading',
            '_bx_messenger_are_you_sure_close_jisti',
            '_bx_messenger_jisti_connection_error',
            '_bx_messenger_post_area_message',
            '_bx_messenger_jitsi_mobile_warning',
            '_bx_messenger_loading',
            '_bx_messenger_share_jot',
            '_bx_messenger_notification_request',
            '_bx_messenger_notification_request_yes',
            '_bx_messenger_notification_request_no',
            '_bx_messenger_remove_jot_confirm',
            '_bx_messenger_post_confirm_delete_file',
            '_bx_messenger_delete_lot',
            '_bx_messenger_clear_lot',
            '_bx_messenger_are_you_sure_leave',
            '_bx_messenger_lot_parts_empty',
            '_bx_messenger_jot_menu_remove_save',
            '_bx_messenger_jot_menu_save'
        ));

        $sUsername = '';
        $oProfile = $this -> getObjectUser($iProfileId);
        if($oProfile)
            $sUsername = bx_js_string($oProfile -> getDisplayName());

        $sUrl = $this->_oConfig->getPageIdent();
        if ($iPersonToTalk && ($oModuleProfile = BxDolProfile::getInstance($iPersonToTalk))) {
            $sModule = $oModuleProfile->getModule();
            $bIsProfile = BxDolRequest::serviceExists($sModule, 'act_as_profile') && BxDolService::call($sModule, 'act_as_profile');
            if (BxDolRequest::serviceExists($sModule, 'is_group_profile') && BxDolService::call($sModule, 'is_group_profile') && !$bIsProfile) {
                $aOwnerInfo = BxDolService::call($sModule, 'get_info', array($oModuleProfile->getContentId(), false));
                if (!empty($aOwnerInfo) && is_array($aOwnerInfo) && BxDolService::call($sModule, 'check_allowed_view_for_profile', array($aOwnerInfo)) === CHECK_ACTION_RESULT_ALLOWED) {
                    $oModule = BxDolModule::getInstance($sModule);
                    if ($oModule->_oConfig) {
                        $oMCNF = $oModule->_oConfig->CNF;

                        $sUrl = "i={$oMCNF['URI_VIEW_ENTRY']}&id=" . $oModuleProfile->getContentId();
                        if ($sUrl && $aTalk = $this->_oDb->getLotByUrl($sUrl))
                            $iLotId = $aTalk[$CNF['FIELD_ID']];
                        else
                        {
                            $sTalkTitle = $oModuleProfile->getDisplayName();
                            $iType = $this->_oConfig->getTalkType($sModule);
                            $iLotId = $this->_oDb->createLot($iProfileId, array('url' => $sUrl, 'title' => $sTalkTitle, 'type' => $iType, 'participants' => array($iProfileId)));
                        }
                    }
                }
            }
        }

        $iGroupId = 0;
        if ($iLotId && ($aLotInfo = $this->_oDb->getLotInfoById($iLotId))){
            if ($aLotInfo[$CNF['FIELD_TYPE']] != BX_IM_TYPE_PRIVATE && isset($aLotInfo[$CNF['FIELD_URL']]))
                $sUrl = $aLotInfo[$CNF['FIELD_URL']];

            $iType = $aLotInfo[$CNF['FIELD_TYPE']];
            $iGroupId = (int)$aLotInfo[$CNF['FMGL_GROUP_ID']] ? (int)$aLotInfo[$CNF['FMGL_GROUP_ID']] : 0;
        };

        $aUnreadJotsInfo = $this->_oDb->getNewJots($iProfileId, $iLotId);

        $iUnreadJotsNumber = $iLastUnreadJot = 0;
        $iStartJot = (int)$iJotId;
        if (!empty($aUnreadJotsInfo)){
            $iStartJot = $iStartJot ? $iStartJot : (int)$aUnreadJotsInfo[$CNF['FIELD_NEW_JOT']];
            $iUnreadJotsNumber = (int)$aUnreadJotsInfo[$CNF['FIELD_NEW_UNREAD']];
            $iLastUnreadJot = (int)$aUnreadJotsInfo[$CNF['FIELD_NEW_JOT']];
        }

        $bAttach = true;
        if ($iStartJot)
            $bAttach = $this->_oDb->getJotsNumber($iLotId, $iStartJot) < (int)$CNF['MAX_JOTS_BY_DEFAULT']/2;

        $sJotJWT = $CNF['JOT-JWT'];
        $aUnreadJotsStat = $this->_oDb->getUnreadMessagesStat($iProfileId);
        $aVars = [
			'profile_id' => (int)$iProfileId,
            'group_id' => $iGroupId,
            'username' => $sUsername,
            'lot' => (int)$iLotId,
            'url' => $sUrl,
            'type' => $iType,
            'direction' => BxDolLanguages::getInstance()->getLangDirection(),
            'selected_profile' => (int)$iPersonToTalk,
            'jot_id' => $iStartJot,
            'by_url' => (int)($iJotId != BX_IM_EMPTY),
			'block_version' => +$bBlockVersion,
			'server_url' => $this->_oConfig-> CNF['SERVER_URL'],
            'message_length' => (int)$CNF['MAX_SEND_SYMBOLS'],
            'jot_jwt' => $sJotJWT ? $this->_oConfig->generateJWTToken($iProfileId, array('profile' => $iProfileId)) : '',
            'ident' => md5(BX_DOL_URL_ROOT . BX_DOL_SECRET),
			'ip' => gethostbyname($aUrlInfo['host']),
			'embed_template' => $sEmbedTemplate,
			'thumb_icon' => $this->parseHtmlByName('thumb-icon.html', []),
			'thumb_letter' => $this->parseHtmlByName('thumb-letter.html', []),
			'add_user_item' => $this->parseHtmlByName('add-user-item.html', []),
			'max_history' => (int)$CNF['MAX_JOTS_BY_DEFAULT'],
			'jitsi_server' => $this->_oConfig->getValidUrl($CNF['JITSI-SERVER'], 'url'),
			'last_unread_jot' => $iLastUnreadJot,
			'unread_jots' => $iUnreadJotsNumber,
            'unqiue_mode' => (int)$CNF['USE-UNIQUE-MODE'],
			'allow_attach' => +$bAttach,
			'messages' => count($aUnreadJotsStat) ? json_encode($aUnreadJotsStat) : 0,
			'muted' => ($iLotId && $iProfileId ? (int)$this->_oDb->isMuted($iLotId, $iProfileId) : 0),
			'dates_intervals_template' => $this->parseHtmlByName('date-separator.html', array('date' => '__date__')),
            'emoji_set' => $CNF['EMOJI_SET'],
            'emoji_prev' => +$CNF['EMOJI_PREVIEW'],
            'welcome_message' => $sWelcomeMessage,
            'reaction_template' => $this->parseHtmlByName('reaction.html', array(
			    'emoji_id' => '__emoji_id__',
			    'on_click' => 'oMessenger.onRemoveReaction(this);',
			    'parts' => '__parts__',
			    'title' => _t('_bx_messenger_reaction_title_author'),
                'number' => 1,
                'count' => 1,
                'value' => '__value__',
                'params' => json_encode(array(
                    'id' => '__emoji_id__',
                    'size' => $CNF['REACTIONS_SIZE'],
                    'native' => $CNF['EMOJI_SET'] === 'native',
                    'set' => $CNF['EMOJI_SET']
                ))
            )),
			'jot_template' => $this->getMembersJotTemplate($iProfileId),
			'jot_url' => $this->_oConfig->getRepostUrl()
		];

        // init files Uploader
        $oStorage = new BxMessengerStorage($this->_oConfig-> CNF['OBJECT_STORAGE']);
        if ($oStorage) {
            $sBaseUrl = $this->_oConfig->getBaseUri();
            $aVars['files_uploader'] = json_encode(array(
              'input_name' => $CNF['FILES_UPLOADER'],
              'restricted_extensions' => json_encode($oStorage->getRestrictedExt()),
              'uploader_url' => $sBaseUrl . 'upload_temp_file',
              'remove_temp_file_url' => $sBaseUrl . 'upload_temp_file',
              'file_size' => (int)$oStorage->getMaxUploadFileSize($iProfileId)/(1024*1024),// in bytes
              'number_of_files' => (int)$this->_oConfig->CNF['MAX_FILES_TO_UPLOAD'],
              'is_block_version' => +$bBlockVersion
            ));
        }

		return $this -> parseHtmlByName('config.html', $aVars);
	}
	public function getJotReactions($iJotId){
        $CNF = &$this->_oConfig->CNF;
	    $aReactions = $this->_oDb->getJotReactions($iJotId);
	    if (empty($aReactions))
	        return '';

	    $aJotReactions = array();
        $iViewer = bx_get_logged_profile_id();
        foreach($aReactions as &$aReaction) {
            $aJotReactions[$aReaction[$CNF['FIELD_REACT_EMOJI_ID']]]['profiles'][$aReaction[$CNF['FIELD_REACT_PROFILE_ID']]] =
                $aReaction[$CNF['FIELD_REACT_PROFILE_ID']] == $iViewer
                    ? _t('_bx_messenger_reaction_title_author') : $this->getObjectUser($aReaction[$CNF['FIELD_REACT_PROFILE_ID']])->getDisplayName();

            $aJotReactions[$aReaction[$CNF['FIELD_REACT_EMOJI_ID']]][$CNF['FIELD_REACT_NATIVE']] = $aReaction[$CNF['FIELD_REACT_NATIVE']];
        }

        $sReactions = '';
        foreach($aJotReactions as $sEmojiId => $aItems) {
            $aProfiles = $aItems['profiles'];
            $iCount = count($aProfiles);
            $sReactions .= $this->parseHtmlByName('reaction.html', [
                'title' => _t('_bx_messenger_reaction_title', implode(', ', $aProfiles), $sEmojiId),
                'emoji_id' => $sEmojiId,
                'number' => $iCount,
                'parts' => implode(',', array_keys($aProfiles)),
                'count' => $iCount,
                'on_click' => $iViewer ? 'oMessenger.onRemoveReaction(this);' : 'javascript:void(0);',
                'value' => $aItems[$CNF['FIELD_REACT_NATIVE']]
            ]);
        }

        return $sReactions;
    }

	public function getMessageIcons($iJotId, $sType = 'edit', $isAdmin = false)
	{ 
		$CNF = &$this->_oConfig->CNF;
		$sContent = '';		
		if (!($aJotInfo = $this -> _oDb -> getJotById($iJotId)))
			return $sContent;
		
		$sDate = bx_process_output($aJotInfo[$CNF['FIELD_MESSAGE_LAST_EDIT']], BX_DATA_DATETIME_TS);
		$sEditorName = $aJotInfo[$CNF['FIELD_MESSAGE_EDIT_BY']] ? $this -> getObjectUser($aJotInfo[$CNF['FIELD_MESSAGE_EDIT_BY']]) -> getDisplayName() : '';
		
		switch($sType)
		{
			case 'edit':
				$sContent = $aJotInfo[$CNF['FIELD_MESSAGE_EDIT_BY']] ?
								$this -> parseHtmlByName('edit-icon.html',
									array(
											'edit' => _t('_bx_messenger_edit_by', $sDate, $sEditorName)
										)
								) : '';
				break;
			case 'delete':
				$sContent = $this -> parseHtmlByName('deleted_jot.html',
						array(
								'bx_if:allow_to_delete' => array(
															'condition' => $isAdmin,
															'content'	=>
                                                                            array(
                                                                                    'message' => bx_js_string(_t('_bx_messenger_confirm_delete_completely')),
                                                                                    'id' => $iJotId
                                                                                ),
															),
								'info' => $sEditorName ? _t('_bx_messenger_deleted_by', $sDate, $sEditorName) : ''
							)
					);
				break;
            case 'vc':
                $iVC = $aJotInfo[$CNF['FIELD_MESSAGE_VIDEOC']];
                $sContent = _t('_bx_messenger_jitsi_err_vc_was_not_found');
                $sParticipants = '';

                if ($iVC && ($aJVCItem = $this->_oDb->getJVCItem($iVC)))
                {
                    $aParticipants = explode(',', $aJVCItem[$CNF['FJVCT_PART']]);
                    if (!$aJVCItem[$CNF['FJVCT_END']])
                       $sInfo = _t('_bx_messenger_jitsi_has_started', bx_time_js($aJVCItem[$CNF['FJVCT_START']]));
                    else
                    {
                            $iDiff = $aJVCItem[$CNF['FJVCT_END']] - $aJVCItem[$CNF['FJVCT_START']];
                            $iH = floor( $iDiff / 3600 );
                            $iM = floor( (int)( $iDiff / 60 ) % 60 );
                            $iS = $iDiff % 60;

                            $sDate = _t('_bx_messenger_jitsi_vc_duration_s', $iS);
                            if ($iH)
                                $sDate = _t('_bx_messenger_jitsi_vc_duration_h', $iH, $iM, $iS);
                            else
                                if ($iM)
                                    $sDate = _t('_bx_messenger_jitsi_vc_duration_m', $iM, $iS);

                            $aIcons = array();
                            foreach($aParticipants as &$iProfileId) {
                                if ($oProfile = BxDolProfile::getInstance($iProfileId))
                                $aIcons[] = array(
                                    'id' => $iProfileId,
                                    'icon' => $oProfile->getIcon(),
                                    'name' => $oProfile->getDisplayName(),
                                );
                            }

                            $sParticipants = !empty($aIcons) ? $this -> parseHtmlByName('viewed.html', array(
                                'bx_repeat:viewed' => $aIcons
                            )) : '';

                            $sInfo = _t('_bx_messenger_jitsi_conference', $sDate);
                     }

                        $aLotInfo = $this->_oDb->getLotByJotId($iJotId, false);
                        $aJVC = $this->_oDb->getJVC($aLotInfo[$CNF['FIELD_ID']]);
                        $sRoom = empty($aJVC) && !empty($aLotInfo) ? $this->_oConfig->getRoomId($aLotInfo[$CNF['FIELD_ID']], $aLotInfo[$CNF['FIELD_AUTHOR']]) : $aJVC[$CNF['FJVC_ROOM']];

                        $sContent = $this -> parseHtmlByName('vc_message.html',
                            array(
                                'info' => $sInfo,
                                'bx_if:join' => array(
                                    'condition' => !$aJVCItem[$CNF['FJVCT_END']] && ($isAdmin || $this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_TALK_VC) === true),
                                    'content' => array(
                                        'id' => $aLotInfo[$CNF['FIELD_ID']],
                                        'room' => $sRoom
                                    )
                                ),
                                'bx_if:part' => array(
                                    'condition' => $sParticipants,
                                    'content' => array(
                                       'participants' => $sParticipants
                                   )
                                )
                            ));
                }
                break;
		}
		
		return $sContent;
	}
	
	/**
	* Create profile html template for jot which is used when member posts a message
	*@param int $iProfileId logget member id
	*@return string html code
	*/
	public function getMembersJotTemplate($iProfileId){
		if (!$iProfileId)
		    return '';

		$CNF = &$this->_oConfig->CNF;
		$oProfile = $this -> getObjectUser($iProfileId);

        $isAllowedDelete = $CNF['ALLOW_TO_REMOVE_MESSAGE'] || isAdmin();
		if ($oProfile)
		{
			$aJot = [];
            $sDisplayName = $oProfile->getDisplayName();
            $sThumb = $oProfile->getThumb();
            $bThumb = stripos($sThumb, 'no-picture') === FALSE;

		    $aVars['bx_repeat:jots'][] = array
			(
				'title' => $oProfile->getDisplayName(),
        		'url' => $oProfile->getUrl(),
				'thumb' => $oProfile->getThumb(),
				'display' => 'style="display:flex;"',
				'display_message' => 'style="display:none;"',
				'id' => 0,
				'new' => '',
				'my' => 1,
				'message' => '{message}',
				'attachment' => '',
				'reply' => $this -> parseHtmlByName('reply.html', array(
                    'id' => '{reply_parent_id}',
                    'message' => '{reply_message}'
                )),
                'bx_if:show_author' => array(
                    'condition' => true,
                    'content' => array(
                        'url' => $oProfile->getUrl(),
                        'bx_if:avatars' => array(
                            'condition' => $bThumb,
                            'content' => array(
                                'thumb' => $sThumb,
                                'title' => $sDisplayName,
                            )
                        ),
                        'bx_if:letters' => array(
                            'condition' => !$bThumb,
                            'content' => array(
                                'color' => implode(', ', BxDolTemplate::getColorCode($oProfile->id(), 1.0)),
                                'letter' => mb_substr($sDisplayName, 0, 1)
                            )
                        ),
                    )
                ),
                'bx_if:show_title' => array(
                    'condition' => true,
                    'content' => array(
                        'title' => $sDisplayName,
                    )
                ),
                'bx_if:jot_menu' => array(
                    'condition' => true,
                    'content' => array(
                        'jot_menu' => $this->getJotMenuCode(BX_IM_EMPTY)
                    )
                ),
                'bx_if:time-separator' => array(
                    'condition' => false,
                    'content' => array(
                        'date' => '',
                    )
                ),
				'thread_replies' => '',
                'bx_if:show_reactions_area' => array(
                    'condition' => true,
                    'content' => array(
                        'bx_if:reactions' => array(
                            'condition' => true,
                            'content' => array(
                                'reactions' => '',
                                'bx_if:reactions_menu' => array(
                                    'condition' => true,
                                    'content' => array(
                                        'display' => 'none',
                                    )
                                ),
                            )
                        ),
                        'bx_if:edit' => array(
                            'condition' => $isAllowedDelete,
                            'content'	=> array()
                        ),
                    )
                ),
				'bx_if:blink-jot' => array(
					'condition' => false,
					'content' => array()
				),
                'bx_if:new' => array(
                    'condition' => true,
                    'content' => array()
                ),
                'icons' => $this->parseHtmlByName('jot-icons.html', array(
                                        'edit_icon' => '',
                                        'time' => bx_time_js(time(), BX_FORMAT_TIME, true),
                                        'views' => '',
                                    )),
				'edit_icon' => '',
                'reactions' => '',
				'action_icon' => '',
                'view_in_chat' => '',
                'message_class' => 'hidden'
			);
			return $this -> parseHtmlByName('jots.html',  $aVars);
		}
		
		return '';
	}

    function videoPlayer ($sUrlPoster, $sUrlMP4, $sUrlWebM = '', $sUrlMP4Hd = '', $aAttrs = false, $bDynamic = true)
    {
        $oPlayer = BxDolPlayer::getObjectInstance();
        if (!$oPlayer)
            return '';

        return $oPlayer->getCodeVideo (BX_PLAYER_STANDARD, array(
            'poster' => $sUrlPoster,
            'mp4' => array('sd' => $sUrlMP4, 'hd' => $sUrlMP4Hd),
            'webm' => array('sd' => $sUrlWebM ),
            'attrs' => $aAttrs,
            'styles' => 'width:90%; max-width:480px; height:auto;',
        ), $bDynamic);
    }

    function getAttachmentsVideoTranscoders($sStorage = ''){
	    $aTranscoders = parent::getAttachmentsVideoTranscoders($sStorage);
	    if (!$aTranscoders)
            return array();

        $aTranscoders['webm'] = BxDolTranscoderImage::getObjectInstance($this -> _oConfig -> CNF['OBJECT_VIDEOS_TRANSCODERS']['webm']);
        return $aTranscoders;
    }

    function getVideoFilesToPlay($aFile){
        $CNF = &$this -> _oConfig -> CNF;

        $sFileUrl = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
        $aTranscodersVideo = $this -> getAttachmentsVideoTranscoders();
        if (empty($aTranscodersVideo))
            return '';

        $sMp4File = $aTranscodersVideo['mp4']->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);
        $sMp4HDFile = $aTranscodersVideo['mp4_hd']->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);
        $sWebMFile = $aTranscodersVideo['webm']->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);
        $sPoster = $aTranscodersVideo['poster']->getFileUrl($aFile[$CNF['FIELD_ST_ID']]);

        if (!$sMp4File && !$sWebMFile){
            if ($aFile[$CNF['FIELD_ST_EXT']] == 'webm') {
                $sWebMFile = $sFileUrl;
                $sPoster = '';
            }
            if ($aFile[$CNF['FIELD_ST_EXT']] == 'mp4' || $aFile[$CNF['FIELD_ST_EXT']] == 'mov') {
                $sMp4File = $sMp4HDFile = $sFileUrl;
                $sPoster = '';
            }
        }

       return ($sMp4File || $sWebMFile) ? $this -> videoPlayer(
                $sPoster,
                $sMp4File,
                $sWebMFile,
                $sMp4HDFile,
                array('preload' => 'metadata'),
                true
            ) : $this->parseHtmlByName('tmp_video.html', array('img' => $sPoster));
    }

	function getReplyPreview($iJotId){
	    if (!$iJotId || !($aJot = $this->_oDb->getJotById($iJotId)))
	        return '';

        $CNF = &$this -> _oConfig -> CNF;
        if (!empty($aJot))
        {
            $aAttachType = [];
            if ($aJot[$CNF['FIELD_MESSAGE_AT_TYPE']])
                $aAttachType = array($aJot[$CNF['FIELD_MESSAGE_AT_TYPE']] => $aJot[$CNF['FIELD_MESSAGE_AT']]);
            else if ($aJot[$CNF['FIELD_MESSAGE_AT']])
                $aAttachType = @unserialize($aJot[$CNF['FIELD_MESSAGE_AT']]);

            $sAttachmentType = '';
            foreach($aAttachType as $sType => $sValue){
                if ($sType == BX_ATT_TYPE_REPLY && !$aJot[$CNF['FIELD_MESSAGE']])
                    continue;

                $sAttachmentType = $sType;
                break;
            }

            if ((int)$aJot[$CNF['FIELD_MESSAGE_REPLY']])
                $sAttachmentType = BX_ATT_TYPE_REPLY;

            switch($sAttachmentType)
            {               
                case BX_ATT_TYPE_GIPHY:
                    return '<img src="//media1.giphy.com/media/' . $aAttachType[$sAttachmentType] . '/giphy_s.gif" />';
                case BX_ATT_TYPE_REPLY:
                    return get_mb_substr(html2txt($aJot[$CNF['FIELD_MESSAGE']]), 0, $CNF['JOT-PREVIEW-TEXT-LENGTH']);
                case BX_ATT_TYPE_FILES_UPLOADING:
                case BX_ATT_TYPE_FILES:
                    $aFiles = $this -> _oDb -> getJotFiles($aJot[$CNF['FIELD_MESSAGE_ID']]);
                    $aItems = array(
                        'bx_repeat:images' => array(),
                        'bx_repeat:files' => array(),
                        'bx_repeat:videos' => array(),
                        'bx_repeat:audios' => array(),
                        'bx_repeat:loading_placeholder' => array()
                    );

                    $aTranscodersVideo = $this -> getAttachmentsVideoTranscoders();
                    $oStorage = new BxMessengerStorage($CNF['OBJECT_STORAGE']);
                    $oTranscoderMp3 = BxDolTranscoderAudio::getObjectInstance($CNF['OBJECT_MP3_TRANSCODER']);
                    $aFile = current($aFiles);
                    $isVideo = $aTranscodersVideo && (0 == strncmp('video/', $aFile['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($aFile['mime_type']);
                    if ($oStorage -> isImageFile($aFile[$CNF['FIELD_ST_TYPE']])) {
                        if ($oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']))
                            $sPhotoThumb = $oImagesTranscoder->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);

                        $sFileUrl = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
                        return '<img src="' . ($sPhotoThumb ? $sPhotoThumb : $sFileUrl) . '" />';
                    }

                    if ($isVideo)
                         return '<img src="' . $aTranscodersVideo['poster']->getFileUrl($aFile[$CNF['FIELD_ST_ID']]) . '" />';

                    if ($oTranscoderMp3 -> isMimeTypeSupported($aFile[$CNF['FIELD_ST_TYPE']]))
                        return $aFile[$CNF['FIELD_ST_NAME']];
					
					return $this -> parseHtmlByName('file.html', array(
																	'type' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
																	'name' => $aFile[$CNF['FIELD_ST_NAME']],
																	'file_type' => $aFile[$CNF['FIELD_ST_TYPE']],
															   ));
				 default:
                    return html2txt($aJot[$CNF['FIELD_MESSAGE']]);											   
            }
        }
	}
    /**
		 * Returns attachment according jot's attachment type
		 * @param array $aJot jot info
		 * @param bool $bIsDynamicallyLoad true when message is dynamically loaded to the history
         * @param bool $bImplode implode attachments types to the groups to show in history
		 * @return array/bool html code
	 */
    function getAttachment($aJot, $bIsDynamicallyLoad = false, $bImplode = true){
		$iViewer = bx_get_logged_profile_id();
		$CNF = &$this -> _oConfig -> CNF;

        if (empty($aJot) || (empty($aJot[$CNF['FIELD_MESSAGE_AT']]) && !(int)$aJot[$CNF['FIELD_MESSAGE_REPLY']]))
            return false;
		
		$bIsLotAuthor = $this -> _oDb -> isAuthor($aJot[$CNF['FIELD_MESSAGE_FK']], $iViewer);
        if ($aJot[$CNF['FIELD_MESSAGE_AT_TYPE']])
            $mixedValues = array($aJot[$CNF['FIELD_MESSAGE_AT_TYPE']] => $aJot[$CNF['FIELD_MESSAGE_AT']]);
        else
            $mixedValues = @unserialize($aJot[$CNF['FIELD_MESSAGE_AT']]);

        $aResult = array();
        foreach($mixedValues as $sType => $sValue) {
            switch($sType)
			{
				case BX_ATT_TYPE_REPOST:
				    $aResult[BX_ATT_TYPE_REPOST][] = $this -> getJotAsAttachment($sValue);
					break;
				case BX_ATT_TYPE_GIPHY:
                    $aResult[BX_ATT_TYPE_GIPHY][] = $this -> parseHtmlByName('giphy.html', array(
                        'gif' => $sValue,
                        'time' => time(),
                        'static' => $bIsDynamicallyLoad ? 'none' : 'flex',
                        'dynamic' => $bIsDynamicallyLoad ? 'block' : 'none',
                    ));
                    break;
                case BX_ATT_TYPE_FILES_UPLOADING:
                case BX_ATT_TYPE_FILES:
                        if (is_string($sValue))
                            $aUploadingFilesList = explode(',', $sValue);
                        else if (is_array($sValue))
                            $aUploadingFilesList = $sValue;
                        else
                            $aUploadingFilesList = [];

						$aFiles = $this -> _oDb -> getJotFiles($aJot[$CNF['FIELD_MESSAGE_ID']]);
						$aItems = array(
							'bx_repeat:images' => [],
							'bx_repeat:files' => [],
							'bx_repeat:videos' => [],
							'bx_repeat:audios' => [],
                            'bx_repeat:loading_placeholder' => []
						);
						
						$aTranscodersVideo = $this -> getAttachmentsVideoTranscoders();
						$oStorage = new BxMessengerStorage($this->_oConfig-> CNF['OBJECT_STORAGE']);
						$oTranscoderMp3 = BxDolTranscoderAudio::getObjectInstance($this -> _oConfig -> CNF['OBJECT_MP3_TRANSCODER']);

						foreach($aFiles as &$aFile)
						{
    						    if (($iKey = array_search($aFile[$CNF['FIELD_ST_NAME']], $aUploadingFilesList)) !== FALSE)
    						        unset($aUploadingFilesList[$iKey]);

    						    $bCollapsed = (boolean)$aFile[$CNF['FJMT_COLLAPSED']];
                                $isAllowedDelete = $this->_oDb->isAllowedToDeleteJot($aJot[$CNF['FIELD_MESSAGE_ID']], $iViewer, $aJot[$CNF['FIELD_MESSAGE_AUTHOR']], $bIsLotAuthor);
    				            $isVideo = $aTranscodersVideo && (0 == strncmp('video/', $aFile['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($aFile['mime_type']);
								if ($oStorage -> isImageFile($aFile[$CNF['FIELD_ST_TYPE']]))
								{
								    $sPhotoThumb = '';
									if ($aFile[$CNF['FIELD_ST_TYPE']] != 'image/gif' && $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']))
										$sPhotoThumb = $oImagesTranscoder->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);
									
									$sFileUrl = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
									$aItems['bx_repeat:images'][] = array(
                                        'media_accordion' => $this->parseHtmlByName('media-accordion.html',[
                                            'file_name' => $aFile[$CNF['FIELD_ST_NAME']],
                                            'icon' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
                                            'hidden' => +$bCollapsed,
                                            'up_class' => $bCollapsed ? '' : 'hidden',
                                            'down_class' => !$bCollapsed ? '' : 'hidden',
                                        ]),
										'hidden' => $bCollapsed ? 'hidden' : '',
										'url' => $sPhotoThumb ? $sPhotoThumb : $sFileUrl,
										'id' => $aFile[$CNF['FIELD_ST_ID']],
										'name' => $aFile[$CNF['FIELD_ST_NAME']],
										'file_menu' => $this -> getFileMenu($aFile[$CNF['FIELD_ST_ID']], $isAllowedDelete)
									);
								}
							    elseif ($isVideo)
								{
									$aItems['bx_repeat:videos'][] = array(
                                        'media_accordion' => $this->parseHtmlByName('media-accordion.html',[
                                            'file_name' => $aFile[$CNF['FIELD_ST_NAME']],
                                            'icon' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
                                            'hidden' => +$bCollapsed,
                                            'up_class' => $bCollapsed ? '' : 'hidden',
                                            'down_class' => !$bCollapsed ? '' : 'hidden',
                                        ]),
                                        'hidden' => $bCollapsed ? 'hidden' : '',
									    'file_name' => $aFile[$CNF['FIELD_ST_NAME']],
										'id' => $aFile[$CNF['FIELD_ST_ID']],
										'video' => $this -> getVideoFilesToPlay($aFile),
										'file_menu' => $this -> getFileMenu($aFile[$CNF['FIELD_ST_ID']], $isAllowedDelete)
									);

								}
                                elseif ($oTranscoderMp3 -> isMimeTypeSupported($aFile[$CNF['FIELD_ST_TYPE']]))
                                {
                                   $sFileUrl = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
                                   $sMp3File = $aFile[$CNF['FIELD_ST_EXT']] == 'mp3' ? $sFileUrl : $oTranscoderMp3->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);

                                   $aItems['bx_repeat:audios'][] = array(
                                       'media_accordion' => $this->parseHtmlByName('media-accordion.html',[
                                           'file_name' => $aFile[$CNF['FIELD_ST_NAME']],
                                           'icon' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
                                           'hidden' => +$bCollapsed,
                                           'up_class' => $bCollapsed ? '' : 'hidden',
                                           'down_class' => !$bCollapsed ? '' : 'hidden',
                                        ]),
                                        'id' => $aFile[$CNF['FIELD_ST_ID']],
                                        'title' => $aFile[$CNF['FIELD_ST_NAME']],
                                        'mp3' => $this -> audioPlayer($sMp3File, true),
                                        'bx_if:loading' => array(
                                            'condition' => !$sMp3File,
                                            'content' => array(
                                                'loading_img' => BxDolTemplate::getInstance()->getImageUrl('video-na.png')
                                            )
                                        ),
                                        'file_menu' => $this -> getFileMenu($aFile[$CNF['FIELD_ST_ID']], $isAllowedDelete)
									);
								}
								else
									$aItems['bx_repeat:files'][] = array(
																			'file' => $this -> parseHtmlByName('a-file.html',
																															  [
																																'file' => $this -> parseHtmlByName('file.html',
                                                                                                                                   [
																																			'type' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
																																			'name' => $aFile[$CNF['FIELD_ST_NAME']],
																																			'file_type' => $aFile[$CNF['FIELD_ST_TYPE']],
                                                                                                                                            'bx_if:time' => [
                                                                                                                                                'condition' => !$aJot[$CNF['FIELD_MESSAGE']],
                                                                                                                                                'content' => [
                                                                                                                                                'time' => bx_time_js($aFile[$CNF['FIELD_ST_ADDED']], BX_FORMAT_TIME, !$CNF['TIME-FROM-NOW']),
                                                                                                                                                ]
                                                                                                                                            ]
																																    ]),
                                                                                                                                    'id' => $aFile[$CNF['FIELD_MESSAGE_ID']],
                                                                                                                                    'name' => $aFile[$CNF['FIELD_ST_NAME']],
                                                                                                                                    'url' => BX_DOL_URL_ROOT
																															    ]),
																			'file_menu' => $this -> getFileMenu($aFile[$CNF['FIELD_MESSAGE_ID']], $isAllowedDelete)
																		);								
						}

                        foreach($aUploadingFilesList as $sFileName)
                            $aItems['bx_repeat:loading_placeholder'][] = array(
                                'url' => $this->getImageUrl('audio-na.png'),
                                'name' => $sFileName,
                            );

                        $aResult[BX_ATT_TYPE_FILES][] = $this -> parseHtmlByName('files.html', $aItems);
						break;
                default:
                    if ($sType && ($aService = $this->_oDb->getLotAttachmentType($sType)) && (int)$sValue){
                        if (isset($aService['module']) && isset($aService['method']) && BxDolRequest::serviceExists($aService['module'], $aService['method'])) {
                            $sContent = BxDolService::call($aService['module'], $aService['method'], array((int)$sValue));
                            $aResult[BX_ATT_TYPE_CUSTOM][] = $this -> parseHtmlByName('custom-attachment.html', array('content' => $sContent));
                        }
                    }
            }
        }

        $aAttachments = [];
        if ($bImplode) {
            foreach ($CNF['IMPLODE_GROUPS'] as $sGroup => $aItems) {
                foreach ($aResult as $sKey => $sValue) {
                    if (in_array($sKey, $aItems)) {
                        if (!isset($aAttachments[$sGroup]))
                            $aAttachments[$sGroup] = '';

                        $aAttachments[$sGroup] .= implode('', $aResult[$sKey]);
                    } else
                        $aAttachments[$sKey] = implode('', $aResult[$sKey]);
                }
            }
        }

        return $aAttachments;
	}

	public function getFileContent($aFile){
        $CNF = &$this -> _oConfig -> CNF;

        $oStorage = new BxMessengerStorage($this->_oConfig-> CNF['OBJECT_STORAGE']);
        if ($oStorage -> isImageFile($aFile[$CNF['FIELD_ST_TYPE']]))
        {
            $sPhotoThumb = '';
            if ($aFile[$CNF['FIELD_ST_TYPE']] != 'image/gif' && $oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW']))
                $sPhotoThumb = $oImagesTranscoder->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);

            $sFileUrl = BxDolStorage::getObjectInstance($this->_oConfig-> CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
            return $this -> parseHtmlByName('img.html', array(
                                                                        'url' => $sPhotoThumb ? $sPhotoThumb : $sFileUrl,
                                                                        'name' => $aFile[$CNF['FIELD_ST_NAME']],
                                                                        'id' => $aFile[$CNF['FIELD_ST_ID']]
                                                                    ));
        }

        $aTranscodersVideo = $this -> getAttachmentsVideoTranscoders();
        $isVideo = $aTranscodersVideo && (0 == strncmp('video/', $aFile['mime_type'], 6)) && $aTranscodersVideo['poster']->isMimeTypeSupported($aFile['mime_type']);
        if ($isVideo)
              return $this -> parseHtmlByName('video.html', array(
                                                                            'id' => $aFile[$CNF['FIELD_ST_ID']],
                                                                            'video' => $this->getVideoFilesToPlay($aFile),
                                                                        ));

        $oTranscoderMp3 = BxDolTranscoderAudio::getObjectInstance($this -> _oConfig -> CNF['OBJECT_MP3_TRANSCODER']);
        if ($oTranscoderMp3 -> isMimeTypeSupported($aFile[$CNF['FIELD_ST_TYPE']]))
        {
                $sFileUrl = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])->getFileUrlById((int)$aFile[$CNF['FIELD_ST_ID']]);
                $sMp3File = $aFile[$CNF['FIELD_ST_EXT']] == 'mp3' ? $sFileUrl : $oTranscoderMp3->getFileUrl((int)$aFile[$CNF['FIELD_ST_ID']]);

                return $this -> parseHtmlByName('audio.html', array(
                                                                    'id' => $aFile[$CNF['FIELD_ST_ID']],
                                                                    'title' => $aFile[$CNF['FIELD_ST_NAME']],
                                                                    'mp3' => $this -> audioPlayer($sMp3File, true)
                                                                ));
        }


         return $this -> parseHtmlByName('a-file.html', [
                                                                    'file' => $this -> parseHtmlByName('file.html', [
                                                                        'type' => $oStorage -> getFontIconNameByFileName($aFile[$CNF['FIELD_ST_NAME']]),
                                                                        'name' => $aFile[$CNF['FIELD_ST_NAME']],
                                                                        'file_type' => $aFile[$CNF['FIELD_ST_TYPE']],
                                                                    ]),
                                                                    'id' => $aFile[$CNF['FIELD_MESSAGE_ID']],
                                                                    'url' => BX_DOL_URL_ROOT,
                                                                    'name' => $aFile[$CNF['FIELD_ST_NAME']],
															   ]);
    }

	/**
	* Returns Jot content as attachment(repost) for a message
	*@param int $iJotId jot id
	*@return string html code
	*/
	function getJotAsAttachment($iJotId){
        $CNF = &$this->_oConfig->CNF;
		$sHTML = '';

		$aJot = $this -> _oDb -> getJotById($iJotId);
		if (empty($aJot))
			return $sHTML;

		$iAttachedJotId = $this -> _oDb -> hasAttachment($iJotId);
        if ($iAttachedJotId !== false)
		{
			$sOriginalMessage = $this->_oConfig->cleanRepostLinks($aJot[$CNF['FIELD_MESSAGE']], $iAttachedJotId);
			if (!$sOriginalMessage)
				$aJot = $this -> _oDb -> getJotById($iAttachedJotId);
		}
		
	$sMessage = '';
        if (isset($aJot[$CNF['FIELD_MESSAGE_AT']]) && $aJot[$CNF['FIELD_MESSAGE_AT']]) {
            $aAttachment = $this->getAttachment($aJot);
            if (isset($aAttachment[BX_ATT_GROUPS_ATTACH]))
                $sMessage = $aJot[$CNF['FIELD_MESSAGE']] . $aAttachment[BX_ATT_GROUPS_ATTACH];
        }
		else
			$sMessage = $this -> _oConfig -> bx_linkify($aJot[$CNF['FIELD_MESSAGE']]);
		
		if (!empty($aJot))
		{
			$aLotsTypes = $this -> _oDb -> getLotsTypesPairs();
            $oProfile = $this -> getObjectUser($aJot[$CNF['FIELD_MESSAGE_AUTHOR']]);
			$aLotInfo =  $this -> _oDb -> getLotByJotId($iJotId, false);
			$sHTML = $this -> parseHtmlByName('repost.html', array(
					'icon' => $oProfile -> getThumb(),
					'message' => $sMessage,
					'username' => $oProfile -> getDisplayName(),
                    'message_type' => !empty($aLotInfo) && isset($aLotInfo[$CNF['FIELD_TYPE']])? _t('_bx_messenger_lots_message_type_' . $aLotsTypes[$aLotInfo[$CNF['FIELD_TYPE']]]) : '',
                    'date' => bx_process_output($aJot[$CNF['FIELD_MESSAGE_ADDED']], BX_DATA_DATETIME_TS),
            ));
		}
		
		return $sHTML;
	}
	
	/**
	* Returns user profile even if it was removed from the site 
	*@param int $iProfileId profile id 
	*@return object instance of Profile
	*/
	public function getObjectUser($iProfileId)
	{
		bx_import('BxDolProfile');
		$oProfile = BxDolProfile::getInstance($iProfileId);
		if (!$oProfile)
		{
			bx_import('BxDolProfileUndefined');
			$oProfile = BxDolProfileUndefined::getInstance();
		}

		return $oProfile;
	}

	/**
	* Returns files uploading form
	*@param int $iJotId message id
	*@return string html form
	*/
	public function getEditJotArea($iJotId)
	{
		$aJot = $this -> _oDb -> getJotById($iJotId);
		return $this -> parseHtmlByName('edit-jot.html', array(
			'place_holder' => _t('_bx_messenger_post_area_message'),
			'content' => $aJot[$this->_oConfig->CNF['FIELD_MESSAGE']]
        ));
	}

	/**
	* Returns body of the jot
	*@param int $iJotId id of the jot
	*@return string html form
	*/	
	public function getJotsBody($iJotId)
	{
		$aJot = $this -> _oDb -> getJotById($iJotId);
		if (empty($aJot))
			return '';

        $sMessage = $this->_oConfig->bx_linkify($aJot[$this -> _oConfig -> CNF['FIELD_MESSAGE']]);
        $aAttachment = $this -> getAttachment($aJot);
		$aVars = array(
			'message' => $sMessage,
            'attachment' => isset($aAttachment[BX_ATT_GROUPS_ATTACH]) ? $aAttachment[BX_ATT_GROUPS_ATTACH] : ''
		);
		
		return $this -> parseHtmlByName('hidden-jot.html',  $aVars);
	}

	/**
	* Returns Video Recording form
	*@param int $iProfile viewer profile id
	*@return string html form
	*/
	public function getVideoRecordingForm(){
		return $this -> parseHtmlByName('video-record-form.html', array('max_video_length' => (int)$this->_oConfig->CNF['MAX_VIDEO_LENGTH']  * 60 * 1000));
	}

    function audioPlayer($sUrlMP3, $bReturnBothIfEmpty = false, $aAttrs = false, $sStyles = '')
    {
        $aAttrsDefaults = array(
            'controls' => '',
            'loop' => '',
            'preload' => 'metadata',
            'download' => true
        );

        if ($bReturnBothIfEmpty && !$sUrlMP3)
            unset($aAttrsDefaults['controls']);

        $aAttrs = array_merge($aAttrsDefaults, is_array($aAttrs) ? $aAttrs : array());
        $sAttrs = bx_convert_array2attrs($aAttrs, '', $sStyles);

        $sLoading = '<img style="max-height:3rem;" src="' . $this->getImageUrl('audio-na.png') . '" />';

        $sAudio = "<audio {$sAttrs}>
                     " . ($sUrlMP3 ? '<source type="audio/mp3" src="' . $sUrlMP3 .'" />' : '') . "
                   </audio>";

        if ($bReturnBothIfEmpty && !$sUrlMP3)
            return $sLoading . $sAudio;

        return $sUrlMP3 ? $sAudio : $sLoading;
    }

    public function getGiphyPanel(){
	    return $this -> parseHtmlByName('giphy-panel.html', [
	        'bx_if:powered_by' => [
	           'condition' => $this->_oConfig->CNF['GIPHY-POWERED-BY'],
               'content' => []
	        ]
        ]);
    }

    public function getGiphyItems($sAction, $sQuery, $fHeight = 0, $iStart = 0){
        $oResult = $this->_oConfig->getGiphyGifs($sAction, $sQuery, $iStart);
        $fGifHeight = $fHeight/200;
        $iTime = time();

        $aResult = array('pagination' => array(), 'content' => '');
        if ($oResult && ($aResult = json_decode($oResult, true))){
            if (!empty($aResult['data'])){
                $aVars['bx_repeat:gifs'] = array();
                foreach($aResult['data'] as &$aGif) {
                    $aImage = $aGif['images']['fixed_height'];
                    $aVars['bx_repeat:gifs'][] = array(
                        'id' => $aGif['id'],
                        'width' => $aImage['width'] * $fGifHeight,
                        'height' => $fHeight,
                        'gif' => $aGif['id'],
                        'time' => $iTime,
                        'title' => $aGif['title']
                    );
                }

                if (!empty($aVars['bx_repeat:gifs']))
                    $aResult = array('pagination' => $aResult['pagination'], 'content' => $this->parseHtmlByName('giphy-items.html', $aVars));
            }
        }

        return $aResult;
    }

    public function getJitsi($iLotId, $iProfileId, $aOptions){
	    $CNF = &$this->_oConfig->CNF;
        $JITSI = &$CNF['JITSI'];
        $sError = '';

        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if (empty($aLotInfo))
            $sError = MsgBox(_t('_bx_messenger_not_found'));

        if (!$this->_oDb->isParticipant($iLotId, $iProfileId))
            $sError = MsgBox(_t('_bx_messenger_not_participant'));

        if ($sError)
            return BxBaseFunctions::getInstance()->msgBox($sError, 2.5);

        $sTitle = isset($aLotInfo[$CNF['FIELD_TITLE']]) && $aLotInfo[$CNF['FIELD_TITLE']]
            ? $aLotInfo[$CNF['FIELD_TITLE']]
            : $this -> getParticipantsNames($iProfileId, $iLotId);

        $sTitle = _t($sTitle);

        $oProfileInfo = BxDolProfile::getInstance($iProfileId);
        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $sLanguage = $oLanguage->getCurrentLangName(false);

        $aJVC = $this->_oDb->getJVC($iLotId);
        $sRoom = empty($aJVC) ? $this->_oConfig->getRoomId($aLotInfo[$CNF['FIELD_ID']], $aLotInfo[$CNF['FIELD_AUTHOR']]) : $aJVC[$CNF['FJVC_ROOM']];

        $mixedJWT = $this->getJWTToken($sRoom, $iProfileId);
        $sCode = $this -> parseHtmlByName('jitsi_video_form.html', array(
            'id' => $iLotId,
            'domain' => $this->_oConfig->getValidUrl($CNF['JITSI-SERVER']),
            'lang' => $sLanguage,
            'site_title' =>  bx_js_string(getParam('site_title')),
            'lib_link' => $this->_oConfig->getValidUrl($CNF['JITSI-SERVER'], 'url') . '/' . $JITSI['LIB-LINK'],
            'info_enabled' => +$CNF['JITSI-HIDDEN-INFO'],
            'chat_enabled' => +$CNF['JITSI-CHAT'],
            'chat_sync' => +$CNF['JITSI-CHAT-SYNC'],
            'audio_only' => +isset($aOptions['audio_only']),
            'show_watermark' => +$CNF['JITSI-ENABLE-WATERMARK'],
            'watermark_url' => $CNF['JITSI-WATERMARK-URL'],
            'support_link' => $CNF['JITSI-SUPPORT-LINK'],
            'jitsi_meet_title' => bx_js_string(_t('_bx_messenger_jitsi_meet_app_title', getParam('site_title'))),
            'user_name' => $oProfileInfo->getDisplayName(),
            'me' => _t('_bx_messenger_jitsi_meet_me'),
            'avatar' => $oProfileInfo->getAvatar(),
            'name' => $sRoom,
            'title' => bx_js_string(strmaxtextlen($sTitle)),
            'jwt_token' => $mixedJWT !== false ? $mixedJWT : ''
        ));

        return $sCode;
	}

    public function getPublicJitsi($iProfileId, $sIdent, $sTitle = '', $sId = 'bx-messenger-jitsi', $aInterfaceConfig = array()){
        $CNF = &$this->_oConfig->CNF;
        $JITSI = &$CNF['JITSI'];

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (empty($oProfile))
            return false;

        $sTitle = $sTitle ? $sTitle : $oProfile->getDisplayName();

        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $sLanguage = $oLanguage->getCurrentLangName(false);

        $sRoom = $this->_oConfig->getRoomId($sIdent ? $sIdent : $iProfileId);        
        $mixedJWT = $this->getJWTToken($sRoom, $iProfileId);
        return $this -> parseHtmlByName('jitsi_public_video_form.html', array(
            'domain' => $this->_oConfig->getValidUrl($CNF['JITSI-SERVER']),
            'lang' => $sLanguage,
            'site_title' => getParam('site_title'),
            'lib_link' => $this->_oConfig->getValidUrl($CNF['JITSI-SERVER'], 'url') . '/' . $JITSI['LIB-LINK'],
            'info_enabled' => +$CNF['JITSI-HIDDEN-INFO'],
            'chat_enabled' => +$CNF['JITSI-CHAT'],
            'chat_sync' => +$CNF['JITSI-CHAT-SYNC'],
            'audio_only' => 0,
            'show_watermark' => +$CNF['JITSI-ENABLE-WATERMARK'],
            'watermark_url' => $CNF['JITSI-WATERMARK-URL'],
            'support_link' => $CNF['JITSI-SUPPORT-LINK'],
            'jitsi_meet_title' => bx_js_string(_t('_bx_messenger_jitsi_meet_app_title', getParam('site_title'))),
            'user_name' => $oProfile->getDisplayName(),
            'me' => _t('_bx_messenger_jitsi_meet_me'),
            'avatar' => $oProfile->getAvatar(),
            'name' => $sRoom,
            'id' => $sId,
            'title' => bx_js_string(strmaxtextlen($sTitle)),
            'interface_config' => json_encode($aInterfaceConfig),
            'jwt_token' => $mixedJWT !== false ? $mixedJWT : ''
        ));
    }

    function getJWTToken($sRoom, $iProfileId){
        $oProfileInfo = BxDolProfile::getInstance( $iProfileId );
        if (empty($oProfileInfo) || !$sRoom)
            return false;

        $CNF = $this->_oConfig->CNF;
        if (empty($CNF['JWT']['app_id']) || empty($CNF['JWT']['secret']))
            return false;

        // Encode Header to Base64Url String
        $sHeader = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        $sHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sHeader));

        // Create token payload as a JSON string
        $sPayload = json_encode(['context' =>
            [
                'user' => [
                    'avatar' => $oProfileInfo->getThumb(),
                    'name' => $oProfileInfo->getDisplayName(),
                    'email' => $oProfileInfo->getAccountObject()->getEmail()
                ],
            ],
            "aud" => $this->_oConfig->CNF['JITSI-SERVER'],
            "iss" => $CNF['JWT']['app_id'],
            "sub" => $this->_oConfig->CNF['JITSI-SERVER'],
            "room" => $sRoom
        ]);

        $sPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sPayload));

        // Create Signature Hash
        $sSignature = hash_hmac('sha256', $sHeader . "." . $sPayload, $CNF['JWT']['secret'], true);
        $sSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($sSignature));

        return "{$sHeader}.{$sPayload}.{$sSignature}";
    }

    public function getTalkFiles($iProfileId, $iLotId, $iStart = 0){
        $CNF = &$this->_oConfig->CNF;
        if (!$iLotId || !$iProfileId || !$this->_oDb->isParticipant($iLotId, $iProfileId))
            return MsgBox(_t('_bx_messenger_no_permissions'));

        $sContent = MsgBox(_t('_bx_messenger_txt_msg_no_results'));
        $aFiles = $this -> _oDb -> getLotFiles($iLotId, $iStart, $CNF['PARAM_DEFAULT_TALK_FILES_NUM']);
        if (!empty($aFiles)) {
            $aFilesItems = array();
            foreach ($aFiles as &$aValue) {
                $oOwner = $this->getObjectUser($aValue[$CNF['FIELD_ST_AUTHOR']]);
                $sThumb = $oOwner->getThumb();
                $bThumb = stripos($sThumb, 'no-picture') === FALSE;
                $sDisplayName = $oOwner->getDisplayName();
                $aFilesItems[] = array(
                    'time' => bx_time_js($aValue[$CNF['FIELD_ST_ADDED']], BX_FORMAT_TIME, !$CNF['TIME-FROM-NOW']),
                    'file' => $this->getFileContent($aValue),
                    'url' => $oOwner->getUrl(),
                    'id' => $aValue[$CNF['FIELD_ST_ID']],
                    'username' => $sDisplayName,
                    'bx_if:avatars' => array(
                        'condition' => $bThumb,
                        'content' => array(
                            'thumb' => $sThumb,
                            'title' => $sDisplayName,
                        )
                    ),
                    'bx_if:letters' => array(
                        'condition' => !$bThumb,
                        'content' => array(
                            'color' => implode(', ', BxDolTemplate::getColorCode($aValue[$CNF['FIELD_ST_AUTHOR']], 1.0)),
                            'letter' => mb_substr($sDisplayName, 0, 1),
                            'title' => $sDisplayName
                        )
                    ),
                );
            }

            if (!empty($aFilesItems))
                $sContent = $this->parseHtmlByName('files-feeds.html', array('bx_repeat:files' => $aFilesItems));
        }

        return $iStart && !$sContent ? '' : $sContent;
    }

    public function getCallPopup($iLotId, $iProfileId){
        $CNF = &$this->_oConfig->CNF;
	    $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        $aActiveVC = $this->_oDb->getActiveJVCItem($iLotId);
        $oProfile = $this -> getObjectUser($aActiveVC[$CNF['FJVCT_AUTHOR_ID']]);
        if (empty($aLotInfo) || !$this->_oDb->isParticipant($iLotId, $iProfileId) || empty($aActiveVC) || (int)$iProfileId == (int)$aActiveVC[$CNF['FJVCT_AUTHOR_ID']] || !$oProfile)
            return false;

        $sTitle = isset($aLotInfo[$CNF['FIELD_TITLE']]) && $aLotInfo[$CNF['FIELD_TITLE']]
                ? _t($aLotInfo[$CNF['FIELD_TITLE']])
                : $this -> getParticipantsNames($iProfileId, $iLotId);


        $aJVC = $this->_oDb->getJVC($iLotId);
        if (empty($aJVC))
            return MsgBox(_t('_bx_messenger_jitsi_err_vc_was_not_found'));

        $aVars = array(
            'title' => $sTitle,
            'thumb' => $oProfile -> getThumb(),
            'id' => $iLotId,
            'room' => $aJVC[$CNF['FJVC_ROOM']]
        );

	    $sContent = $this->parseHtmlByName('conference_call.html', $aVars);
        return BxTemplFunctions::getInstance()->transBox('bx-messenger-vc-call', $sContent);
    }

    public function getLotSettingsForm($iLotId){
        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);

        if (empty($aLotInfo) || empty($CNF['LOT_OPTIONS']))
            $sContent = MsgBox(_t('_Empty'));
        else
        {
            $aOptions = array();
            $aLotSettings = $this->_oDb->getLotSettings($iLotId);
            foreach ($CNF['LOT_OPTIONS'] as &$sValue) {
                $aOptions[] = array(
                    'type' => 'checkbox',
                    'name' => $sValue,
                    'label' => _t("_bx_messenger_lot_options_item_{$sValue}"),
                    'checked' => $aLotSettings === false || in_array($sValue, $aLotSettings)
                );
            }

            $aForm = array(
                'form_attrs' => array(
                    'name' => 'lot_options',
                    'method' => 'post',
                    'enctype' => 'multipart/form-data'
                ),
                'inputs' => array(
                    'options' => array(
                        'type' => 'input_set',
                        'dv' => '<br/>'
                    ),
                    'buttons' => array(
                        'type' => 'input_set',
                        'attrs_wrapper' => array('class' => 'bx-messenger-options-buttons'),
                        array(
                            'type' => 'button',
                            'name' => 'save',
                            'value' => _t("_bx_messenger_save_button"),
                            'attrs' => array('onclick' => "javascript:{$CNF['JSMain']}.onSaveLotSettings(this);")
                        ),
                        array(
                            'type' => 'button',
                            'name' => 'close',
                            'value' => _t("_bx_messenger_cancel_button"),
                            'attrs' => array('onclick' => "javascript:$(this).closest('.bx-popup-applied:visible').dolPopupHide();")
                        ),
                    )
                )
            );

            if (!empty($aOptions))
                $aForm['inputs']['options'] = array_merge($aForm['inputs']['options'], $aOptions);


            $oForm = new BxTemplFormView($aForm);
            $sContent = $oForm -> getCode();
        }

        return BxTemplFunctions::getInstance()->popupBox('lot-settings', _t('_bx_messenger_lot_options_title'), $sContent);
    }

	public function getNavGroupsMenu($iProfileId){
        $CNF = $this->_oConfig->CNF;

        $aGroupsList = $this->_oDb->getMyLotsByGroups($iProfileId);
        $aResultGroups = array();

        $i = 0;
        foreach($aGroupsList as $sModule => $aGroups){
			$aResultGroups['bx_repeat:groups'][$i] = array(
                'module' => _t('_' . $sModule),
				'module_type' => $sModule,
            );
			foreach($aGroups as &$aGroup){
				$aResultGroups['bx_repeat:groups'][$i]['bx_repeat:module_items'][] = array(
					'title' => $aGroup[$CNF['FMG_NAME']],
					'id' => $aGroup[$CNF['FMG_ID']],
				);
			}
			
			$i++;
        }
	
        if (empty($aResultGroups))
            return '';

        return $this -> parseHtmlByName('nav-groups-menu.html', $aResultGroups);
    }

    public function getLeftMainMenu(){
        $CNF = &$this->_oConfig->CNF;

        $oLeftMainMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_NAV_LEFT_MENU']);
        $oLeftGroupsMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_GROUPS_MENU']);

        $bSimpleMode = $this->_oConfig->CNF['USE-UNIQUE-MODE'];
        return bx_is_api() ?  [
                                'menu' => $oLeftMainMenu->getMenuItems(),
                                'nav_groups_menu' => $oLeftGroupsMenu->getMenuItems()
                            ] :
                            $this -> parseHtmlByName('left-nav-menu.html', array(
                                'menu' => $oLeftMainMenu -> getCode(),
                                'nav_groups_menu' => $oLeftGroupsMenu -> getCode(),
                                'js_code' => $CNF['JSMain'],
                                'menu_width' => !$bSimpleMode ? 'xl:block xl:col-span-2': ''
                            ));
    }

    public function getInfoSection($sType = 'info', $iProfileId = 0){
        $CNF = &$this->_oConfig->CNF;

        return $this -> parseHtmlByName('info-section.html', array(
            'info' => ''
        ));
    }

    public function getCreateGroupsForm($iProfileId, $iGroupId = 0){
        $CNF = &$this->_oConfig->CNF;

        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_GROUPS']);
        $aPrivacy = $oPrivacy->getGroupChooser($CNF['OBJECT_PRIVACY_GROUPS'], $iProfileId);

        $aForm = array(
            'form_attrs' => array(
                'name' => 'create_groups',
                'method' => 'post',
                'enctype' => 'multipart/form-data'
            ),
            'inputs' => array(
                'id' => array(
                    'type' => 'hidden',
                    'name' => 'id',
                    'value' => $iGroupId,
                ),
                'name' => array(
                    'type' => 'text',
                    'name' => 'name',
                    'caption' => _t('_bx_messenger_groups_name'),
                    'info' => _t('_bx_messenger_groups_name_info'),
                ),
                'desc' => array(
                    'type' => 'text',
                    'name' => 'desc',
                    'caption' => _t('_bx_messenger_groups_desc'),
                    'info' => _t('_bx_messenger_groups_desc_info'),
                ),
                'privacy' => $aPrivacy,
                'options' => array(
                    'type' => 'input_set',
                    'dv' => '<br/>'
                ),
                'buttons' => array(
                    'type' => 'input_set',
                    'attrs_wrapper' => array('class' => 'bx-messenger-options-buttons'),
                    array(
                        'type' => 'button',
                        'name' => 'save',
                        'value' => _t("_bx_messenger_save_button"),
                        'attrs' => array('onclick' => "javascript:{$CNF['JSMessengerLib']}.onSaveGroup(this);")
                    ),
                    array(
                        'type' => 'button',
                        'name' => 'close',
                        'value' => _t("_bx_messenger_cancel_button"),
                        'attrs' => array('onclick' => "javascript:$(this).closest('.bx-popup-applied:visible').dolPopupHide();")
                    ),
                )
            )
        );


        $oForm = new BxTemplFormView($aForm);
        $sContent = $oForm -> getCode();

        return BxTemplFunctions::getInstance()->popupBox('groups-form', _t('_bx_messenger_groups_create_form_title'), $sContent);
    }

    function getTalksList($iLotId){
        $CNF = &$this->_oConfig->CNF;
        $sList = _t('_Empty');

        $iProfileId = bx_get_logged_profile_id();
		if ($iGroupId = $this->_oDb->getGroupIdByLotId($iLotId)){
			$aGroupsList = $this->_oDb->getTalksByGroupId($iGroupId);
			if (!empty($aGroupsList)){
				unset($aGroupsList[$iLotId]);

				foreach($aGroupsList as $iKey => $aItem) {
                    if (!$this->_oDb->isParticipant($aGroupsList[$iKey][$CNF['FIELD_ID']], $iProfileId) && (int)$aGroupsList[$iKey][$CNF['FIELD_TYPE']] !== BX_IM_TYPE_PUBLIC)
                        continue;

                    $aGroupsList[$iKey][$CNF['FIELD_TITLE']] = _t($aItem[$CNF['FIELD_TITLE']]);
                }

				$sList = $this->parseHtmlByName('groups-list-item.html', array(
					'bx_repeat:list' => $aGroupsList
				));
			}
		}
		
		return $this->parseHtmlByName('groups-list.html', array(
		    'list' => $sList
        ));
	}

	function getThreadReply($iJotId){
        $CNF = &$this->_oConfig->CNF;
        $aParentLotInfo = $this->_oDb->getLotByParentId($iJotId);
        $iReplies = !empty($aParentLotInfo) ? $this->_oDb->getJotReplies($aParentLotInfo[$CNF['FIELD_ID']], true) : 0;

        return $iReplies ? $this->parseHtmlByName('thread-reply.html', array(
            'replies' => $iReplies
        )) : '';
    }

    function getContacts($iProfileId, $aParams = []){
        $aLotsList = $this->_oDb->getMyLots($iProfileId, ['type' => BX_IM_TYPE_PRIVATE]);
        if (empty($aLotsList))
            return [];

        $CNF = &$this->_oConfig->CNF;
        $aVars = $aResult = $aContacts = [];
        foreach($aLotsList as &$aItem){
            $aList = explode(',', $aItem[$CNF['FIELD_PARTICIPANTS']]);
            if (!empty($aList)) {
                foreach ($aList as &$iPart) {
                    if ($iPart === $iProfileId || array_key_exists($iPart, $aContacts))
                        continue;

                    $aContacts[$iPart] = BxDolProfile::getInstance($iPart)->isOnline();
                }
            }

            if (count($aContacts) >= $CNF['PARAM_CONTACTS_NUM_BY_DEFAULT'])
                break;
        }

        foreach($aContacts as $iProfileId => $iStatus) {
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if (bx_is_api())
                $aResult[] = $oProfile->getData($iProfileId);
            else
            {
                $sThumb = $oProfile->getThumb();
                $bThumb = stripos($sThumb, 'no-picture') === FALSE;
                $sTitle = $oProfile->getDisplayName();
                $aVars['bx_repeat:contacts'][] = [
                    'status' => $this->getOnlineStatus($iProfileId, $iStatus),
                    'url' => $oProfile->getUrl(),
                    'displyname' => $oProfile->getDisplayName(),
                    'bx_if:avatars' => [
                        'condition' => $bThumb,
                        'content' => [
                            'title' => $sTitle,
                            'thumb' => $sThumb,
                        ]
                    ],
                    'bx_if:letters' => [
                        'condition' => !$bThumb,
                        'content' => [
                            'color' => implode(', ', BxDolTemplate::getColorCode($iProfileId, 1.0)),
                            'letter' => mb_substr($sTitle, 0, 1)
                        ]
                    ],
                ];
            }
        }

        return bx_is_api() ? $aResult : $this->parseHtmlByName('contacts-block.html', $aVars);
    }

    function getConnectionsForm($sType, $iProfileId){
        $sText = MsgBox(_t("_bx_messenger_filter_criteria_on_$sType"));
        if ($oConnection = $this->_oConfig->getConnectionByType($sType)) {
            $sText = MsgBox(_t("_bx_messenger_filter_criteria_on_$sType"));
            if ($iCount = $oConnection->getConnectedContentCount($iProfileId, $sType === 'friends'))
                $sText = MsgBox(_t("_bx_messenger_filter_criteria_{$sType}_message", $iCount));
        }

        $CNF = &$this->_oConfig->CNF;

        $aNotifFields = $this->getNotificationFormData();
	    $aForm = [
                    'form_attrs' => [
                        'method' => 'post',
                        'id' => $CNF['OBJECT_FORM_ENTRY'],
                        'class' => 'space-y-4 max-h-60 overflow-y-auto'
                    ],
                    'inputs' => array_merge([
                        'type' => [
                            'type' => 'hidden',
                            'name' => 'connection_type',
                            'value' => $sType
                        ],
                        'action' => [
                            'type' => 'custom',
                            'content' => $sText,
                        ]
                    ], $aNotifFields)
                ];

        $oForm = new BxTemplFormView($aForm);
        return $oForm -> getCode();
    }

    function getInfoBlockContent($iLotId){
        if (!($aLotInfo = $this->_oDb->getLotInfoById($iLotId)))
            return '';

        $CNF = $this->_oConfig->CNF;
        if (!($oProfile = $this->getObjectUser($aLotInfo[$CNF['FIELD_AUTHOR']])))
            return '';

        $sThumb = $oProfile->getAvatar();
        $bThumb = stripos($sThumb, 'no-picture') === FALSE;
        $sDisplayName = $oProfile->getDisplayName();

        $aPartList = $this->_oDb->getParticipantsList($iLotId);
        if ((int)$aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_BROADCAST)
            $aPartList = $this->_oDb->getBroadcastParticipants($iLotId);

        $iPartCount = count($aPartList);
        $iFilesCount = $this->_oDb->getLotFilesCount($iLotId);
        $iMessagesCount = $this->_oDb->getJotsNumber($iLotId, 0);

        $aItem = [
          'parts' => $iPartCount,
          'files' => $iFilesCount,
          'messages' => $iMessagesCount,
          'profile_url' => $oProfile->getUrl()
        ];

        $aItem = array_merge($aItem,[
            'name' => $sDisplayName,
            'id' => $oProfile -> id(),
            'bx_if:avatars' => array(
                'condition' => $bThumb,
                'content' => array(
                    'thumb' => $sThumb,
                    'title' => $sDisplayName,
                )
            ),
            'bx_if:letters' => array(
                'condition' => !$bThumb,
                'content' => array(
                    'color' => implode(', ', BxDolTemplate::getColorCode($aLotInfo[$CNF['FIELD_AUTHOR']], 1.0)),
                    'title' => $sDisplayName,
                    'letter' => mb_substr($sDisplayName, 0, 1)
                )
            )
        ]);

        $sContent = '';
        bx_alert($this->_oConfig->getObject('alert'), 'talk_info_before', $iLotId, $iLotId, [
            'content' => &$sContent
        ]);
        
        $aItem['content'] = $sContent;
        return $this->parseHtmlByName('talk-info.html', $aItem);
    }


    private function getEmptyMessageTemplate($aData){
        $aVars = [
                'title' => '',
                'url' => '',
                'thumb' => '',
                'display' => '',
                'display_message' => '',
                'id' => 0,
                'new' => '',
                'my' => 1,
                'message' => '',
                'attachment' => '',
                'reply' => '',
                'bx_if:show_author' => [
                    'condition' => false,
                    'content' => [
                        'url' => '',
                        'bx_if:avatars' => [
                            'condition' => false,
                            'content' => [
                                'thumb' => '',
                                'title' => '',
                            ]
                        ],
                        'bx_if:letters' => array(
                            'condition' => false,
                            'content' => array(
                                'color' => '',
                                'letter' => ''
                            )
                        ),
                    ]
                ],
                'bx_if:show_title' => array(
                    'condition' => false,
                    'content' => array(
                        'title' => '',
                    )
                ),
                'bx_if:jot_menu' => array(
                    'condition' => false,
                    'content' => array(
                        'jot_menu' => ''
                    )
                ),
                'bx_if:time-separator' => array(
                    'condition' => false,
                    'content' => array(
                        'date' => '',
                    )
                ),
                'thread_replies' => '',
                'bx_if:show_reactions_area' => array(
                    'condition' => false,
                    'content' => array(
                        'bx_if:reactions' => array(
                            'condition' => false,
                            'content' => array(
                                'reactions' => '',
                                'bx_if:reactions_menu' => array(
                                    'condition' => false,
                                    'content' => array(
                                        'display' => 'none',
                                    )
                                ),
                            )
                        ),
                        'bx_if:edit' => array(
                            'condition' => false,
                            'content'	=> array()
                        ),
                    )
                ),
                'bx_if:blink-jot' => array(
                    'condition' => false,
                    'content' => array()
                ),
                'bx_if:new' => array(
                    'condition' => false,
                    'content' => []
                ),
                'icons' => '',
                'edit_icon' => '',
                'reactions' => '',
                'action_icon' => '',
                'view_in_chat' => '',
                'message_class' => 'hidden'
            ];

        return array_merge($aVars, $aData);
    }
}

/** @} */
