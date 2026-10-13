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

require_once('BxMessengerStorage.php');

define('BX_IM_TYPE_PUBLIC', 1);
define('BX_IM_TYPE_PRIVATE', 2);
define('BX_IM_TYPE_SETS', 3);
define('BX_IM_TYPE_GROUPS', 4);
define('BX_IM_TYPE_EVENTS', 5);
define('BX_IM_TYPE_BROADCAST', 6);
define('BX_IM_EMPTY_URL', '');
define('BX_IM_EMPTY', 0);

// Attachment types
define('BX_ATT_TYPE_FILES', 'files');
define('BX_ATT_TYPE_FILES_UPLOADING', 'uploading');
define('BX_ATT_TYPE_GIPHY', 'giphy');
define('BX_ATT_TYPE_REPOST', 'repost');
define('BX_ATT_TYPE_CUSTOM', 'custom');
define('BX_ATT_TYPE_REPLY', 'reply');
define('BX_ATT_TYPE_VC', 'vc'); // video conference
define('BX_ATT_GROUPS_ATTACH', 'attachment');

// Reactions actions
define('BX_JOT_REACTION_ADD', 'add');
define('BX_JOT_REACTION_REMOVE', 'remove');

// Public jitsi actions
define('BX_JOT_PUBLIC_JITSI_LEAVE', 'leave');
define('BX_JOT_PUBLIC_JITSI_JOIN', 'join');
define('BX_JOT_PUBLIC_JITSI_CLOSE', 'close');

// Notifications types
define('BX_MSG_NTFS_MESSAGE', 'message');
define('BX_MSG_NTFS_MENTION', 'mention');
define('BX_MSG_NTFS_BROADCAST', 'broadcast');

// Membership actions
define('BX_MSG_ACTION_EDIT_MESSAGES', 'edit_messages');
define('BX_MSG_ACTION_DELETE_MESSAGES', 'delete_messages');
define('BX_MSG_ACTION_CREATE_TALKS', 'create_talks');
define('BX_MSG_ACTION_ADMINISTRATE_TALKS', 'administrate_talks');
define('BX_MSG_ACTION_SEND_MESSAGE', 'send_messages');
define('BX_MSG_ACTION_SEND_FIELS', 'send_files');
define('BX_MSG_ACTION_CREATE_VC', 'create_vc');
define('BX_MSG_ACTION_CREATE_IM_VC', 'video_conference');
define('BX_MSG_ACTION_VIDEO_RECORDER', 'video_recorder');
define('BX_MSG_ACTION_JOIN_IM_VC', 'join_personal_vc');
define('BX_MSG_ACTION_JOIN_TALK_VC', 'join_vc');
define('BX_MSG_ACTION_CREATE_GROUPS', 'create_groups');
define('BX_MSG_ACTION_CREATE_BROADCASTS', 'create_broadcasts');

// Lot settings
define('BX_MSG_SETTING_MSG', 'msg'); // allow to send messages
define('BX_MSG_SETTING_GIPHY', 'giphy'); // allow to send giphy
define('BX_MSG_SETTING_FILES', 'files'); // allow to send files
define('BX_MSG_SETTING_VIDEO_RECORD', 'video_rec'); // allow to record videos
define('BX_MSG_SETTING_SMILES', 'smiles'); // allow to record videos

// Talk's types
define('BX_MSG_TALK_TYPE_INBOX', 'inbox');
define('BX_MSG_TALK_TYPE_THREADS', 'threads');
define('BX_MSG_TALK_TYPE_GROUPS', 'groups');
define('BX_MSG_TALK_TYPE_DIRECT', 'direct');
define('BX_MSG_TALK_TYPE_FILES', 'files');
define('BX_MSG_TALK_TYPE_MR', 'mr');
define('BX_MSG_TALK_TYPE_REPLIES', 'replies');
define('BX_MSG_TALK_TYPE_SAVED', 'saved');
define('BX_MSG_TALK_TYPE_BROADCAST', 'broadcast');

// Pages types
define('BX_MSG_TALK_TYPE_PAGES', 'bx_messenger_pages');

// Search criteria
define('BX_SEARCH_CRITERIA_TITLES', 'titles');
define('BX_SEARCH_CRITERIA_PARTS', 'participants');
define('BX_SEARCH_CRITERIA_CONTENT', 'content');

// Visibility
define('BX_MSG_VISIBILITY_VISIBLE', 0);
define('BX_MSG_VISIBILITY_HIDDEN', 1);
define('BX_MSG_VISIBILITY_ALL', 2);

// Talks classes
define('BX_MSG_TALK_CLASS_MEMBERS', 'members');
define('BX_MSG_TALK_CLASS_MARKET', 'market');
define('BX_MSG_TALK_CLASS_CUSTOM', 'custom');
define('BX_MSG_TALK_CLASS_BLOCK', 'block');

// Classes
define('BX_MSG_CLASS_ATTACHMENT', 'message-attachment');

/**
 * Messenger module
 */
class BxMessengerModule extends BxBaseModGeneralModule
{
    private $_iUserId = 0;
    private $_iJotId = 0;
    private $_iSelectedProfileId = 0;
    private $_iSelectedConvoId = 0;
    private $_isBlockMessenger = false;
    private $_sWelcomeMessage = '';

    function __construct(&$aModule)
    {
        parent::__construct($aModule);
        $this->_iUserId = bx_get_logged_profile_id();
    }

    /**
     * Returns left side block for messenger page and loads config data
     */
    public function serviceGetBlockInbox()
    {
		$mixedContent = $this->_oTemplate->getLotsList($this->_iProfileId, $this->_iSelectedConvoId);
        if (bx_is_api())
            return $mixedContent;

		return $mixedContent . $this->_oTemplate->loadConfig($this->_iProfileId,
                [
                    'is_block_version' => false,
                    'lot' => $this->_iSelectedConvoId,
                    'jot'=> $this->_iJotId,
                    'selected_profile' => $this->_iSelectedProfileId,
                    'welcome' => $this->_sWelcomeMessage
                ]);
    }
    /**
     * Returns right side block for messenger page
     */
    public function serviceGetBlockLot()
    {
        if ($this->_iSelectedConvoId){
            return $this->_oTemplate->getTalkBlock($this->_iProfileId, $this->_iSelectedConvoId, $this->_iJotId);
        } else if ($this->_iSelectedProfileId && $this->onCheckContact($this->_iProfileId, $this->_iSelectedProfileId))
            return $this->_oTemplate->getTalkBlockByUserName($this->_iProfileId, $this->_iSelectedProfileId);

        return $this->_oTemplate->getTalkBlock($this->_iProfileId, BX_IM_EMPTY);
    }

    /**
     * Returns block with messenger for any page
     * @param string $sModule module name
     * @return string block's content
     */
    public function serviceGetBlockMessenger($sModule, $bAsHtml = false)
    {
        $this->_isBlockMessenger = true;
        $CNF = &$this->_oConfig->CNF;

        $this->_oTemplate->loadCssJs('view');

        $sClass = str_replace('{type}', '', $sModule);
        $aLotInfo = [];
        if ($sClass)
            $aLotInfo = $this->_oDb->getLotByClass($sClass);

        $sUrl = $this->_oConfig->getPageIdent();

        $iType = $this->_oConfig->getTalkType($sModule);
        if (empty($aLotInfo) && $sUrl)
            $aLotInfo = $this->_oDb->findLotByParams(array(
                $CNF['FIELD_TYPE'] => $iType,
                $CNF['FIELD_CLASS'] => BX_MSG_TALK_CLASS_CUSTOM,
                $CNF['FIELD_URL'] => $sUrl
            ));

        $iLotId = !empty($aLotInfo) && isset($aLotInfo[$CNF['FIELD_ID']]) ? (int)$aLotInfo[$CNF['FIELD_ID']] : 0;
        if (!$iLotId) {
            
            if (!$sUrl)
                return false;

            $sTalkUrl = $this->getPreparedUrl($sUrl);
            $sTalkTitle = BxDolTemplate::getInstance()->getPageHeader();

            $iLotId = $this->_oDb->createLot($this->_iProfileId,
                array(
                    'url' => $sTalkUrl,
                    'title' => $sTalkTitle,
                    'type' => $iType,
                    'page' => $this->_oConfig->getPageName($sUrl)));

            $this->_oDb->registerGroup($sUrl, $iLotId);
        }

        $sConfig = $this->_oTemplate->loadConfig($this->_iProfileId, ['lot' => $iLotId, 'type' => $iType]);
        $aHeader = $this->_oTemplate->getTalkHeader($iLotId, $this->_iProfileId, true, true);
        
        $sContent = $this->_oTemplate->parseHtmlByName('talk-body.html', array(
            'history' => $this->_oTemplate->getHistory($this->_iProfileId, $iLotId, BX_IM_EMPTY),
            'text_area' => $this->_oTemplate->getTextArea($this->_iProfileId, $iLotId),
            'groups_list' => $this->_oTemplate->getTalksList($iLotId),
            'info' => $this->_oTemplate->getInfoSection($iLotId, $this->_iProfileId),
        ));

        $this->_oTemplate->addCss(array('threads.css'));
		if ($bAsHtml){
			$sContent = $this->_oTemplate->getTalkBlock($this->_iProfileId, $iLotId, BX_IM_EMPTY, $this->_isBlockMessenger);
			return $sConfig . $sContent;
		}

		$oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_ACTIONS_TALK_MENU']);
        $oMenu->setContentId($iLotId);

        return array(
            'title' => $aHeader['title'],
            'content' => $sConfig . $sContent,
            'menu' => $oMenu
        );
    }

    private function initDefaultParams() {
        $CNF = &$this->_oConfig->CNF;

        $this->_iSelectedProfileId = (int)bx_get('profile_id');
        if ($this->_iSelectedProfileId && !$this->onCheckContact($this->_iProfileId, $this->_iSelectedProfileId))
            $this->_iSelectedProfileId = 0;

        if ($this->_iSelectedProfileId) {
            $oProfile = BxDolProfile::getInstance($this->_iSelectedProfileId);
            $sModule = $oProfile->getModule();
            $bIsProfile = BxDolRequest::serviceExists($sModule, 'act_as_profile') && BxDolService::call($sModule, 'act_as_profile');
            if ($sModule && !$bIsProfile && BxDolRequest::serviceExists($sModule, 'is_group_profile') && BxDolService::call($sModule, 'is_group_profile')) {
                $aOwnerInfo = BxDolService::call($sModule, 'get_info', array($oProfile->getContentId(), false));
                if(!empty($aOwnerInfo) && is_array($aOwnerInfo) && BxDolService::call($sModule, 'check_allowed_view_for_profile', array($aOwnerInfo)) === CHECK_ACTION_RESULT_ALLOWED) {
                    $oModule = BxDolModule::getInstance($sModule);
                    if ($oModule->_oConfig) {
                        $oMCNF = $oModule->_oConfig->CNF;
                        $sUrl = "i={$oMCNF['URI_VIEW_ENTRY']}&id=" . $oProfile->getContentId();
                        if ($sUrl && $aTalk = $this->_oDb->getLotByUrl($sUrl))
                            $this->_iSelectedConvoId = $aTalk[$CNF['FIELD_ID']];
                    }
                }
            }
            else
            {
                $aExistedTalk = $this->_oDb->getLotsByParticipantsList([$this->_iSelectedProfileId, $this->_iProfileId], BX_IM_TYPE_PRIVATE);
                if (!empty($aExistedTalk))
                    $this->_iSelectedConvoId = $aExistedTalk[$CNF['FIELD_ID']];
            }
        }
        else
        {
            if ($this->_iJotId)
                $this->_iSelectedConvoId = $this->_oDb->getLotByJotId($this->_iJotId);
            else
            {
                $aLotsList = $this->_oDb->getMyLots($this->_iProfileId, ['inbox' => true]);
                $this->_iSelectedConvoId = !empty($aLotsList) ? current($aLotsList)[$CNF['FIELD_ID']] : 0;
            }
        }
    }

    public function serviceGetMainMessengerPage(){
        if(bx_is_api())
            return bx_srv($this->getName(), 'get_block_main', [], 'Services');

        $this->initDefaultParams();

        $bSimpleMode = $this->_oConfig->CNF['USE-UNIQUE-MODE'];
        $aData = [
            'menu' => $this->_oTemplate->getLeftMainMenu(),
            'info' => $this->_oTemplate->getInfoSection(),
            'list' => $this->serviceGetBlockInbox(),
            'history' => $this->serviceGetBlockLot(),
            'list_width' => $bSimpleMode ? 'xl:col-span-3' : 'xl:col-span-3',
            'history_width' => $bSimpleMode ? 'xl:col-span-7' : 'xl:col-span-5',
        ];

        return $this->_oTemplate->parseHtmlByName('main.html', $aData);
    }

	public function actionGetThreadReplies(){
        $iJotId = (int)bx_get('jot_id');
        $aJotInfo = $this->_oDb->getJotById($iJotId);        
		$aLotInfo = $this->_oDb->getLotByParentId($iJotId);
        $CNF = &$this->_oConfig->CNF;

        if (empty($aJotInfo) || !$this->isLogged() || ($aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE && !$this->_oDb->isParticipant($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)))
            return echoJson(array('code' => 1));
        
        echoJson(array('code' => 0, 'html' => $this->_oTemplate->getThreadReply($iJotId)));
    }
	
    public function actionGetThreadsPanel(){
        $iJotId = bx_get('jot_id');
        if (!$this->isLogged() || !$iJotId)
            return echoJson(array('code' => 1));

        $CNF = $this->_oConfig->CNF;
        $aJotInfo = $this->_oDb->getJotById($iJotId);
		if (empty($aJotInfo))
			return echoJson(array('code' => 1));
        
		$aLotInfo = $this->_oDb->getLotByParentId($iJotId);
		if (!empty($aLotInfo) && $aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE && !$this->_oDb->isParticipant($aLotInfo[$CNF['FIELD_ID']], $this->_iProfileId))
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_participant')));

        echoJson(array('code' => 0, 'html' => $this->_oTemplate->getThreadsPanel($iJotId, $this->_iProfileId)));
    }
    /**
     * Adds messenger block to all pages with comments and trigger pages during installation
     */
    public function serviceAddMessengerBlocks()
    {
        if (!isAdmin())
            return '';

        $aPages = $this->_oDb->getPagesWithComments();

        $aUrl = array();
        foreach ($aPages as $sModule => $sPage) {
            $sParams = parse_url($sPage, PHP_URL_QUERY);
            if (!empty($sParams))
                parse_str($sParams, $aUrl);

            if (isset($aUrl['i'])) {
                $sPage = BxDolPageQuery::getPageObjectNameByURI($aUrl['i']);
                if (!$this->_oDb->isBlockAdded($sPage))
                    $this->_oDb->addMessengerBlock($sPage);
            }
        }
    }

    /**
     * Builds main messenger page
     */
    public function actionHome()
    {
        if (!$this->isLogged())
            bx_login_form();

        $oPage = BxDolPage::getObjectInstance('bx_messenger_main');
        if (!$oPage) {
            $this->_oTemplate->displayPageNotFound();
            exit;
        }

        $oPage->displayPage();
    }

    public function actionArchive($iJotId)
    {
        $iLotId = $this->_oDb->getLotByJotId($iJotId);
        $this->_iJotId = $iJotId;
        if (!$iLotId){
            $this->_sWelcomeMessage = _t('_bx_messenger_not_found_to_read');
            $this->_iJotId = BX_IM_EMPTY;
        }
        else
            if (!$this->_oDb->isParticipant($iLotId, $this->_iProfileId)) {
                $this->_sWelcomeMessage = _t('_bx_messenger_not_allowed_to_read');
                $this->_iJotId = BX_IM_EMPTY;
            }

        $this->actionHome();
    }

    /**
     * Create List of participants received from request (POST, GET)
     * @param mixed $mixedParticipants participants list
     * @param bool $bExcludeLogged don't add logged profile to the participants list
     * @return array  participants list
     */
    private function getParticipantsList($mixedParticipants, $bExcludeLogged = false)
    {
        if (empty($mixedParticipants))
            return [];

        $aParticipants = is_array($mixedParticipants) ? $mixedParticipants : array(intval($mixedParticipants));
        if (!$bExcludeLogged && !in_array($this->_iProfileId, $aParticipants))
            $aParticipants[] = $this->_iProfileId;

        return array_unique($aParticipants, SORT_NUMERIC);
    }


    public function serviceSendMessage($iRecipient = 0, $mixedData = '', $iSender = 0)
    {
        if (!$iSender)
            $iSender = $this->_iProfileId;

        if (empty($mixedData))
            return _t('_bx_messenger_send_message_no_data');

        $aData = array();
        if (is_array($mixedData))
            $aData = $mixedData;
        elseif (is_string($mixedData) && strlen($mixedData))
            $aData['message'] = $mixedData;

        if (empty($aData))
            return _t('_bx_messenger_send_message_no_data');

        $aData['participants'] = array();
        if ($iRecipient)
            $aData['participants'][] = $iRecipient;

        if ($iSender)
            $aData['participants'][] = $iSender;

        $mixedResult = $this->sendMessage($aData, $iRecipient, $iSender);
        if (is_array($mixedResult) && isset($mixedResult['jot_id']))
            return true;

        return is_string($mixedResult) ? $mixedResult : false;
    }
	
	/**
	 * Main function to send Messages
	* @param array $aData params for a message, files, text, participants...
	* @param int $iRecipient recipient's profile id
	* @param int $iSender sender's profile id
	* @return array/string
	*/
    public function sendMessage(&$aData, $iRecipient = 0, $iSender = 0){
        $sMessage = isset($aData['message']) ? trim($aData['message']) : '';
        $iLotId = isset($aData['lot']) ? (int)$aData['lot'] : 0;
        $iGroupId = isset($aData['group_id']) ? (int)$aData['group_id'] : 0;
        $iType = (isset($aData['type']) && $aData['type'] && $this->_oDb->isLotType($aData['type'])) ? (int)$aData['type'] : BX_IM_TYPE_PRIVATE;
        $aFiles = $aData[BX_ATT_TYPE_FILES] ?? [];
        $aGiphy = $aData[BX_ATT_TYPE_GIPHY] ?? [];
		$iReply = isset($aData['reply']) ? (int)$aData['reply'] : '';
		$aParticipants = $aData['participants'] ?? [];
        $aAttachments = $aData['attachment'] ?? [];
        $sClass = $aData['class'] ?? '';
        $sTitle = isset($aData['title']) ? html2txt($aData['title']) : '';
        $iParent = isset($aData['parent']) ? (int)$aData['parent'] : 0;
		$sUrl = '';
        
		$CNF = &$this->_oConfig->CNF;

		// check if message contains toxic
		if ($sMessage && $CNF['CHECK-CONTENT-FOR-TOXIC'] && BxDolRequest::serviceExists('bx_antispam', 'is_toxic')){
            if (bx_srv('bx_antispam', 'is_toxic', [$sMessage]) === true)
                return _t('_bx_messenger_toxic_message');
        }

		if ($iRecipient && !($oRecipient = BxDolProfile::getInstance($iRecipient)))
		    return _t('_bx_messenger_profile_not_found');

		if (!$iSender)
			$iSender = $this->_iProfileId;

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_SEND_MESSAGE, $iSender);
        if ($mixedResult !== true)
			return $mixedResult;

        if ($iLotId) {
            if (!($aLotInfo = $this->_oDb->getLotInfoById($iLotId)))
                return _t('_bx_messenger_not_found');

            $mixedOptions = $this->_oDb->getLotSettings($iLotId);

            $bCheckAction = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $iSender) === true;
            $bIsAuthor = $bCheckAction || $this->_oDb->isAuthor($iLotId, $iSender);

            if ($sMessage && $mixedOptions !== false && !in_array(BX_MSG_SETTING_MSG, $mixedOptions) && !$bIsAuthor)
                return _t('_bx_messenger_send_message_save_error');

            if (!empty($aFiles)) {
                if (count($aFiles) == 1 && isset(current($aFiles)['content_type']) && current($aFiles)['content_type'] == BX_MSG_SETTING_VIDEO_RECORD) {
                    if ($mixedOptions !== false && !in_array(BX_MSG_SETTING_VIDEO_RECORD, $mixedOptions) && !$bIsAuthor)
                        return _t('_bx_messenger_send_message_save_error');
                }
                if ($mixedOptions !== false && !in_array(BX_MSG_SETTING_FILES, $mixedOptions) && !$bIsAuthor)
                    return _t('_bx_messenger_send_message_save_error');
            }

            if (!empty($aGiphy) && $mixedOptions !== false && !in_array(BX_MSG_SETTING_GIPHY, $mixedOptions) && !$bIsAuthor)
                return _t('_bx_messenger_send_message_save_error');

            $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
            $iType = isset($aLotInfo[$CNF['FIELD_TYPE']]) ? $aLotInfo[$CNF['FIELD_TYPE']] : BX_IM_TYPE_PUBLIC;
			if ($iType == BX_IM_TYPE_PRIVATE && !$iRecipient){
				$aPartList = $this->_oDb->getParticipantsList($iLotId, true, $iSender);
				if (count($aPartList) == 1){
					$iRecipient = current($aPartList);
				}
			}
		}
		
		if ($iRecipient && !$this->onCheckContact($iSender, $iRecipient))
			return _t('_bx_messenger_contact_privacy_not_allowed');

        if ($iType !== BX_IM_TYPE_PRIVATE || $sClass)
            $sUrl = isset($aData['url']) ? $aData['url'] : '';

        // prepare participants list
        $aParticipants = $this->getParticipantsList($aParticipants, $iSender !== $this->_iProfileId);
        if (!$iLotId && empty($aParticipants) && $iType === BX_IM_TYPE_PRIVATE)
            return _t('_bx_messenger_save_part_failed');

        if (empty($aParticipants) && $iType === BX_IM_TYPE_BROADCAST && isset($aData[BX_MSG_TALK_TYPE_BROADCAST])) {
            $aBroadcastParticipants = $this->getProfilesByCriteria($aData[BX_MSG_TALK_TYPE_BROADCAST]);
            if (empty($aBroadcastParticipants))
                return _t('_bx_messenger_save_part_failed');
        }

		$sMessage = $this -> prepareMessageToDb($sMessage);
		if ($sMessage && $iType != BX_IM_TYPE_PRIVATE && $sUrl)
            $sUrl = $this->getPreparedUrl($sUrl);

        if ($sClass === BX_MSG_TALK_CLASS_MARKET)
            $sUrl = $this->_oConfig->getPageIdent($sUrl);

        $aResult = [];
        if (($sMessage || !empty($aFiles) || !empty($aGiphy) || !empty($aAttachments)) && ($iId = $this->_oDb->saveMessage(
            array(
                    'message' => $sMessage,
                    'type' => $iType,
                    'member_id' => $this->_iProfileId,
                    'url' => $sUrl,
                    'title' => $sTitle,
                    'lot' => $iLotId,
					'reply' => $iReply,
					'parent' => $iParent,
					'group_id' => $iGroupId,
                    'class' => $sClass,
                    'participants' => $aParticipants
            ))))
        {
            if (!$iLotId)
                $aResult['lot_id'] = $this->_oDb->getLotByJotId($iId);

            if ($iType === BX_IM_TYPE_BROADCAST && !$iLotId && (int)$aResult['lot_id']) {
                $iAuthorId = $this->_iProfileId;
                $iCreatedLot = (int)$aResult['lot_id'];
                if (isset($aData[BX_MSG_TALK_TYPE_BROADCAST]['author']) && (int)$aData[BX_MSG_TALK_TYPE_BROADCAST]['author']) {
                    $iAuthorId = $aData[BX_MSG_TALK_TYPE_BROADCAST]['author'];
                    $this->_oDb->updateConvoFiled($iCreatedLot, $CNF['FIELD_AUTHOR'], $aData[BX_MSG_TALK_TYPE_BROADCAST]['author']);
                    $this->_oDb->updateJot($iId, $CNF['FIELD_MESSAGE_AUTHOR'], $aData[BX_MSG_TALK_TYPE_BROADCAST]['author']);
                }

                $aBroadcastParticipants = $this->getProfilesByCriteria($aData[BX_MSG_TALK_TYPE_BROADCAST]);
                $aPartList = array_unique(array_merge($aParticipants, $aBroadcastParticipants), SORT_NUMERIC);

                $sModule = $this->_oConfig->getObject('alert');
                $sTemplateName = $this->_oConfig->getName();
                bx_alert($sModule, 'broadcast_attachment_before', $iId, $aResult['lot_id'], [
                        'id' => &$iId,
                        'talk_id' => $aResult['lot_id'],
                        'author' => &$iAuthorId,
                        'template' => &$sTemplateName,
                        'participants' => &$aPartList,
                        'data' => &$aData
                    ]);

                $this->_oDb->createBroadcastUsers($iCreatedLot, $aPartList);
                $this->_oDb->markAsNewJot($aPartList, $iCreatedLot, $iId);

                $aAttachments[$sTemplateName] = (int)$iId;
                $aNotificationsType = [];
                if (isset($aData[BX_MSG_TALK_TYPE_BROADCAST]['notify_by'])) {
                    if ($aNotifData = $aData[BX_MSG_TALK_TYPE_BROADCAST]['notify_by'])
                        $aNotificationsType['silent_mode'] = $this->_oConfig->getSelectedNotificationMode($aNotifData);
                }

                foreach ($aPartList as &$iPart) {
                    bx_alert($sModule, 'got_broadcast_ntfs', $iCreatedLot, $iAuthorId, [
                            'object_author_id' => $iPart,
                            'recipient_id' => $iPart,
                            'subobject_id' => $iId,
                        ] + $aNotificationsType);
                }
            }

		    if (!empty($aFiles)) {
                $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
                $aUploadingFilesNames = $aCompleteFilesNames = array();

                if (bx_is_api()){
                    if (is_array($aFiles))
                        foreach($aFiles as &$iFileId){
                            if ($aFile = $oStorage -> getFile($iFileId)) {
                                $aCompleteFilesNames[] = $aFile[$CNF['FIELD_ST_NAME']];
                                $this->_oDb->updateFiles($iFileId, array(
                                    $CNF['FIELD_ST_JOT'] => $iId,
                                ));
                                $oStorage->afterUploadCleanup($iFileId, $this->_iProfileId);
                            }
                        }
                } else
                foreach ($aFiles as &$aFile) {
                    if (!(int)$aFile['complete']) {
                        $aUploadingFilesNames[] = $aFile['realname'];
                        continue;
                    }

                    if (!$this->_oConfig->isValidToUpload($aFile['name'])){
                        $this->_oDb->deleteJot($iId, $this->_iProfileId, true);
                        return _t('_bx_messenger_bad_request');
                    }

                    $sFile = BX_DIRECTORY_PATH_TMP . basename($aFile['name']);
                    $sExt = $oStorage->getFileExt($sFile);
                    $sFilename = $oStorage->getFileTitle($aFile['realname']) . ".{$sExt}";
                    $iFile = $oStorage->storeFileFromPath($sFile, $iType == BX_IM_TYPE_PRIVATE, $this->_iProfileId, (int)$iId);
                    if ($iFile) {
                        $oStorage->afterUploadCleanup($iFile, $this->_iProfileId);
                        $this->_oDb->updateFiles($iFile, array(
                            $CNF['FIELD_ST_JOT'] => $iId,
                            $CNF['FIELD_ST_NAME'] => $sFilename
                        ));
                        $aCompleteFilesNames[] = $sFilename;
                        @unlink($sFile);
                    }
                }

                if (!empty($aUploadingFilesNames))
                    $aAttachments[BX_ATT_TYPE_FILES_UPLOADING] = $aUploadingFilesNames;

                if (!empty($aCompleteFilesNames))
                    $aAttachments[BX_ATT_TYPE_FILES] = $aCompleteFilesNames;
            }

            if (is_array($aGiphy) && !empty($aGiphy))
                $aAttachments[BX_ATT_TYPE_GIPHY] = current($aGiphy);

            if ($iReply)
                $this->_oDb->updateJot($iId, $CNF['FIELD_MESSAGE_REPLY'], $iReply);

            if (!empty($aAttachments))
                $this->_oDb->addAttachment($iId, $aAttachments);

            $aResult['jot_id'] = $iId;
			$aJot = $this->_oDb->getJotById($iId);
			if (!empty($aJot))
                $aResult['time'] = bx_time_utc($aJot[$CNF['FIELD_MESSAGE_ADDED']]);

            $this->onSendJot($iId);
        }
        else
            return _t('_bx_messenger_send_message_save_error');

            BxDolSession::getInstance()->exists();
            return $aResult;
	}

	public function actionSend(){
		$aData = &$_POST;
		 if (!$this->isLogged())
            return echoJson(['code' => 1, 'message' => _t('_bx_messenger_not_logged'), 'reload' => 1]);

		if (isset($aData[BX_MSG_TALK_TYPE_BROADCAST]) && $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_BROADCASTS) === true)
            $aData['type'] = BX_IM_TYPE_BROADCAST;

		$aLastJotInfo = isset($aData['lot']) ? $this->_oDb->getLatestJot($aData['lot'], BX_IM_EMPTY, false) : [];
		$mixedResult = $this->sendMessage($aData);
		if (is_array($mixedResult)){
			if (isset($mixedResult['lot_id']))
				$mixedResult['header'] = $this->_oTemplate->getTalkHeader($mixedResult['lot_id'], $this->_iProfileId);

		    $CNF = &$this->_oConfig->CNF;
			if (!empty($aLastJotInfo) && isset($aData['tmp_id'])) {
                $iTimer = $aLastJotInfo[$CNF['FIELD_MESSAGE_ADDED']];
                $iCurrent = intval($aData['tmp_id']/1000);
                if (($iCurrent - $iTimer) > $CNF['DATE-SHIFT'])
                    $mixedResult['separator'] = $this->_oTemplate->getDateSeparator($iCurrent);
            }
		} else 
			return echoJson(array('code' => 1, 'message' => $mixedResult));
		
		$mixedResult['code'] = 0;
		if ($iTmpId = bx_get('tmp_id'))
			$mixedResult['tmp_id'] = $iTmpId;
		
		echoJson($mixedResult);
	}
    

    /**
     * Loads talk to the right side block when member choose conversation or when open messenger page
     * @return array with json result
     */
	public function actionLoadTalk(){
        $iLotId = (int)bx_get('lot_id');
        $iJotId = (int)bx_get('jot_id');
        $sAreaType = bx_get('area_type');
        $this->_isBlockMessenger = (bool)bx_get('is_block');

        if (!$iLotId)
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_empty_history'))));

        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1));

        $CNF = &$this->_oConfig->CNF;

        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        $bIsParticipant = $this->_oDb->isParticipant($iLotId, $this->_iProfileId);
        if (!($bIsParticipant || $this->_oDb->getGroupIdByLotId($iLotId)) && !($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PUBLIC || $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_BROADCAST)) {
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_participant')), 'reload' => 1));
        };

        if ((int)bx_get('mark_as_read'))
            $this->_oDb->readAllMessages($iLotId, $this->_iProfileId);

        $aUnreadJots = $this->_oDb->getNewJots($this->_iProfileId, $iLotId);
        $iUnreadLotsJots = !empty($aUnreadJots) ? (int)$aUnreadJots[$CNF['FIELD_NEW_UNREAD']] : 0;
        $iLastUnreadJot = !empty($aUnreadJots) ? (int)$aUnreadJots[$CNF['FIELD_NEW_JOT']] : 0;

        $aHeader = $this->_oTemplate->getTalkHeader($iLotId, $this->_iProfileId, $this->_isBlockMessenger, true);
        $sHistory = $this->_oTemplate->getHistoryArea(['profile_id' => $this->_iProfileId,
                                                    'lot' => $iLotId, 'jot' => ($iJotId ? $iJotId : $iLastUnreadJot), 'area' => $sAreaType],
                                                    $iUnreadLotsJots && $iUnreadLotsJots < ($CNF['MAX_JOTS_BY_DEFAULT']/2));
        $sTextArea = !in_array($sAreaType, $CNF['VIEW-IN-TALKS']) ? $this->_oTemplate->getTextArea($this->_iProfileId, $iLotId) : '';
        $aVars = [
            'code' => 0,
            'title' => trim(html2txt($aHeader['title'])),
            'header' => $this->_oTemplate->parseHtmlByName('talk-header.html', $aHeader),
            'history' => $sHistory,
            'text_area' => $sTextArea,
            'last_unread_jot' => $iLastUnreadJot,
            'unread_jots' => $iUnreadLotsJots,
            'muted' => (int)$this->_oDb->isMuted($iLotId, $this->_iProfileId),
            'params' => $this->_oDb->getLotType($iLotId)
        ];

        if ($this->_isBlockMessenger)
            $aVars['talks_list'] = $this->_oTemplate->getTalksList($iLotId);

        BxDolSession::getInstance()->exists();
        echoJson($aVars);
    }

    public function actionLoadThreadTalk(){
        $CNF = &$this->_oConfig->CNF;

        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1));

        $iJotId = (int)bx_get('jot_id');
        if (!($aJotInfo = $this->_oDb->getJotById($iJotId)))
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_nothing_found')), 'reload' => 1));

        $aLotInfo = $this->_oDb->getLotByParentId($iJotId);
        if (empty($aLotInfo)){
            $aParentLot = $this->_oDb->getLotInfoById($aJotInfo[$CNF['FIELD_MESSAGE_FK']]);
            if (empty($aParentLot))
                return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_nothing_found')), 'reload' => 1));

            if (!$this->_oDb->isParticipant($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)){
                return echoJson(array('code' => 1, 'msg' => MsgBox(_t('_bx_messenger_not_participant')), 'reload' => 1));
            }

            $iLotId = $this->_oDb->createLot($this->_iProfileId,
                [
                    'title' => $aJotInfo[$CNF['FIELD_MESSAGE']] ? strmaxtextlen($aJotInfo[$CNF['FIELD_MESSAGE']]) : $aParentLot[$CNF['FIELD_TITLE']],
                    'type' => BX_IM_TYPE_PRIVATE,
                    'thread' => $iJotId,
                    'participants' => explode(',', $aParentLot[$CNF['FIELD_PARTICIPANTS']])
                ]);

            $this->onCreateLot($iLotId);
        } else
            $iLotId = $aLotInfo[$CNF['FIELD_ID']];

        echoJson(['code' => 0, 'lot' => $iLotId]);
    }

    public function actionMarkJotsAsRead(){
        $iId = (int)bx_get('lot');
        if (!$this->isLogged() || !$this->_oDb->isParticipant($iId, $this->_iUserId)) {
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1));
        };

        $this->_oDb->readAllMessages($iId, $this->_iUserId);
        echoJson(array('code' => 0));
    }

    public function actionViewedJot(){
        $iJotId = (int)bx_get('jot_id');
        $aJotInfo = $this->_oDb->getJotById($iJotId);
        $aLotInfo = $this->_oDb->getLotByJotId($iJotId, false);
        $CNF = &$this->_oConfig->CNF;

        if (empty($aJotInfo) || !$this->isLogged() || ($aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE && !$this->_oDb->isParticipant($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)))
            return echoJson(array('code' => 1));

        $this->_oDb->readMessage($iJotId, $this->_iProfileId);
        $this->_oDb->markNotificationAsRead($this->_iProfileId, $aJotInfo[$CNF['FIELD_MESSAGE_FK']]);
        $aUnreadInfo = $this->_oDb->getNewJots($this->_iProfileId, $aJotInfo[$CNF['FIELD_MESSAGE_FK']]);
        $iUnreadJotsNumber = $iLastUnreadJotId = 0;
        if (!empty($aUnreadInfo)) {
            $iLastUnreadJotId = (int)$aUnreadInfo[$CNF['FIELD_NEW_JOT']];
            $iUnreadJotsNumber = (int)$aUnreadInfo[$CNF['FIELD_NEW_UNREAD']];
        }

        echoJson(array('code' => 0, 'unread_jots' => $iUnreadJotsNumber, 'last_unread_jot' => $iLastUnreadJotId));
    }

    /**
     * Loads messages for specified lot(conversation)
     * @return array with json
     */
	public function actionLoadJots(){
        $iId = (int)bx_get('id');
        $iJotId = (int)bx_get('jot_id');
	    if (!$this->isLogged() || !$iId)
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged'))));

	    if (!$this->_oDb->isParticipant($iId, $this->_iProfileId))
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_participant'))));

        $sContent = $this->_oTemplate->getHistoryArea(['profile_id' => $this->_iProfileId, 'lot' => $iId, 'jot' => $iJotId]);
        echoJson(array('code' => 0, 'history' => $sContent));
    }

    /**
     * Loads search users area
     * @return array|void
     */
    public function actionLoadList(){
        if (!$this->isLogged())
            return echoJson(['code' => 1, 'msg' => MsgBox(_t('_bx_messenger_not_logged'))]);

        $sAction = bx_get('action');
        $iGroupId = (int)bx_get('group_id');
        $sGroupType = bx_get('area_type');
        $iLotId = (int)bx_get('lot');
        if ($sAction === 'edit') {
            if (!$iLotId || !($bAllowed = $this->_oDb->isAuthor($iLotId, $this->_iProfileId) || $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true))
                return echoJson(['code' => 1]);
        }
          else
              $iLotId = 0;

        $aProfilesList = [];
        $bIsGroupedChat = $sGroupType === BX_MSG_TALK_TYPE_GROUPS && $iGroupId;
        if ($bIsGroupedChat) {
            $aProfilesList = $this->getParticipantsListByGroupAndFilter($iGroupId);
            if (!empty($aProfilesList))
                $aProfilesList = array_map(function($aValue){
                    return $aValue['value'];
                }, $aProfilesList);
        }

        $sContent = $this->_oTemplate->getCreateListArea($iLotId, $aProfilesList, $bIsGroupedChat);
        echoJson(array('code' => 0, 'content' => $sContent, 'text_area' => $this->_oTemplate->getTextArea($this->_iProfileId, $iLotId)));
    }

    private function getParticipantsListByGroupAndFilter($iGroupId, $sTerm = ''){
        $CNF = &$this->_oConfig->CNF;

        $mixedUsers = [];
        if (!$iGroupId || !($aGroupInfo = $this->_oDb->getGroupById($iGroupId)) || $aGroupInfo[$CNF['FMG_MODULE']] === BX_MSG_TALK_TYPE_PAGES)
            return false;

        $oContextProfile = BxDolProfile::getInstance($aGroupInfo[$CNF['FMG_PROFILE_ID']]);
        if ($oContextProfile && ($mixedUsers = bx_srv($aGroupInfo[$CNF['FMG_MODULE']], 'fans', array($oContextProfile->getContentId(), true)))) {
                if ($sTerm)
                    $mixedUsers = array_filter($mixedUsers, function ($iVal) use ($sTerm){
                        $oProfile = BxDolProfile::getInstance($iVal);
                        return stripos($oProfile->getDisplayName(), $sTerm) !== false ? ['value' => $iVal] : false;
                    });

                $mixedUsers = array_map(function ($iVal){
                    return ['value' => $iVal];
                }, $mixedUsers);
        }

        return $mixedUsers;
    }

    function actionGetUsersList(){
        $aResult = array('code' => 1);
        $sTerm = bx_get('term');
        $iLotId = (int)bx_get('lot');
        $sAreaType = bx_get('area_type');
        if (!$this->isLogged())
            return echoJson($aResult);

        $sExcept = bx_get('except');
        $aExcept = array();
        if ($sExcept)
            $aExcept = explode(',', $sExcept);

        if ($iLotId && !$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return echoJson($aResult);

        $mixedUsers = false;
        if ($iLotId && $sAreaType === 'groups' && ($iGroupId = $this->_oDb->getGroupIdByLotId($iLotId))){
            $mixedUsers = $this->getParticipantsListByGroupAndFilter($iGroupId, $sTerm);
            if (is_array($mixedUsers))
                $mixedUsers = array_filter($mixedUsers, function($aValue) use ($aExcept){
                    return !in_array($aValue['value'], $aExcept);
                });                
        }

        $aUsers = $mixedUsers !== false ? $mixedUsers : $this->searchProfiles($sTerm, $aExcept,  $this->_oConfig->CNF['PARAM_SEARCH_DEFAULT_USERS']);
        if (empty($aUsers))
            return echoJson(array('content' => MsgBox(_t('_bx_messenger_empty_users_list'))));

        $aProfiles = array();
        foreach ($aUsers as &$aValue) {
            if (!$this->onCheckContact($this->_iProfileId, $aValue['value']))
                continue;

            $aProfiles[] = $aValue['value'];
        }

        if (!empty($aProfiles))
            $aResult['content'] = $this->_oTemplate->getProfilesListPreviewForCreateTalkArea($aProfiles);

        echoJson($aResult);
    }

    /**
     * Search for Lots by keywords in the right side block
     * @return string with json
     */
	public function actionSearch(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1));

        $sParam = bx_get('param');
        $iStarred = bx_get('starred');
        $sType = bx_get('type');
        $iGroupId = bx_get('group_id');

        $aResult = ['code' => 0];
        $aParams = ['term' => $sParam, 'star' => (bool)$iStarred];

        $aFoundConvos = $aMyLots = [];
        switch($sType){
            case BX_MSG_TALK_TYPE_THREADS:
                $aParams['threads'] = true;
                $aMyLots = $this->_oDb->getMyLots($this->_iProfileId, $aParams, $aFoundConvos);
                break;
            case 'public':
                $aParams['type'] = [BX_IM_TYPE_SETS, BX_IM_TYPE_PUBLIC];
                $aMyLots = $this->_oDb->getMyLots($this->_iProfileId, $aParams, $aFoundConvos);
                break;
            case BX_MSG_TALK_TYPE_MR:
                $aMyLots = $this->_oDb->getReactionsMentionsLots($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_REPLIES:
                $aMyLots = $this->_oDb->getLotsWithReplies($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_SAVED:
                $aMyLots = $this->_oDb->getSavedJotInLots($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_GROUPS:
                $aParams['group'] = $iGroupId;
                $aMyLots = $this->_oDb->getMyLots($this->_iProfileId, $aParams, $aFoundConvos);
                break;
            case BX_MSG_TALK_TYPE_DIRECT:
                $aParams['type'] = [BX_IM_TYPE_PRIVATE];
            default:
                $aMyLots = $this->_oDb->getMyLots($this->_iProfileId, $aParams, $aFoundConvos);
        }

        if (empty($aMyLots))
            $sContent = $sParam ? MsgBox(_t('_bx_messenger_txt_msg_no_results')) : $this->_oTemplate->getFriendsList($sParam);
        {
            $sContent = $this->_oTemplate->getLotsPreview($this->_iProfileId, $aMyLots);
            if (!empty($aFoundConvos['jots_list'])) {
                foreach($aFoundConvos['jots_list'] as $iJot => $iConvo){
                    $aResult['search_list'][$iConvo]['list'][] = $iJot;
                }
            }
        }

        $aResult['html'] = $sContent;
        echoJson($aResult);
    }

    /**
     * Update brief of the specified lot in the lots list
     * @return string with json
     */
	public function actionUpdateLotBrief(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1));

        $iLotId = (int)bx_get('lot_id');
        if (!$iLotId || !$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return echoJson(array('code' => 1));

        if ($aLots = $this->_oDb->getLotInfoById($iLotId)) {
            return echoJson(array(
                                    'code' => 0,
                                    'html' => $this->_oTemplate->getLotsPreview($this->_iProfileId, array($aLots)),
                                    'muted' => (int)$this->_oDb->isMuted($iLotId, $this->_iProfileId),
                                    'params' => $this->_oDb->getLotType($iLotId)
                                ));
        }

        echoJson(array('code' => 1));
    }

    /**
     * Prepare url for Lot title if it was created on separated page
     * @param string URL
     * @return string URL
     */
    private function getPreparedUrl($sUrl)
    {
        if (!$sUrl)
            return false;

        $aUrl = parse_url($sUrl);
        return strtolower($aUrl['path'] . (isset($aUrl['query']) ? '?' . $aUrl['query'] : ''));
    }

    private function isAvailable($iLotId){
        if (!$iLotId)
            return false;

        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if (!empty($aLotInfo) && !$this->_oDb->isParticipant($iLotId, $this->_iProfileId) && $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
            return false;

        return true;
    }

    /**
     * Loads messages for  lot(conversation) (when member wants to view history or get new messages from participants)
     * @return string with json
     */
    public function actionUpdate(){
        $CNF = &$this->_oConfig->CNF;

        $iJot = (int)bx_get('jot');
        $iLotId = (int)bx_get('lot');
        $sLoad = bx_get('load');
        $sArea = bx_get('area_type');

        if (!$this->isLogged() && !($sLoad && $iJot && $iLotId))
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_logged'), 'reload' => 1));

        if (!$this->isAvailable($iLotId))
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_talk_is_not_allowed')));

        $sUrl = bx_get('url');
        if ($sUrl)
            $sUrl = $this->getPreparedUrl($sUrl);

        $isFocused = (bool)bx_get('focus');
        $iRequestedJot = (int)bx_get('req_jot');
        $iLastViewedJot = (int)bx_get('last_viewed_jot');
        $bUpdateHistory = true;
        $sContent = '';
        $iUnreadJotsNumber = 0;
        $iLastUnreadJotId = 0;
        $bAttach = true;
        $bRemoveSeparator = false;
		switch($sLoad)
		{
		    case 'new':
                if (!$iJot)
                {
                    $iJot = $this->_oDb->getFirstUnreadJot($this->_iProfileId, $iLotId);
                    if ($iJot)
                        $iJot = $this->_oDb->getPrevJot($iLotId, $iJot);
                    else
                    {
                        $aLatestJot = $this->_oDb->getLatestJot($iLotId);
                        $iJot = !empty($aLatestJot) ? (int)$aLatestJot[$CNF['FIELD_MESSAGE_ID']] : 0;
                    }
                }

                if ($iRequestedJot) {
                    if ($this->_oDb->getJotsNumber($iLotId, $iJot, $iRequestedJot) >= $CNF['MAX_JOTS_LOAD_HISTORY'])
                        $bUpdateHistory = false;
                    else if ($isFocused)
                        $this->_oDb->readMessage($iRequestedJot, $this->_iProfileId);
                }

                if ($iLastViewedJot && $bUpdateHistory && $isFocused) {
                    $this->_oDb->readMessage($iLastViewedJot, $this->_iProfileId);
                }

                $bAttach = $iJot ? $this->_oDb->getJotsNumber($iLotId, $iJot) < $CNF['MAX_JOTS_LOAD_HISTORY'] : false;
            case 'all':
            case 'prev':
                $aOptions = array(
                    'lot_id' => $iLotId,
                    'url' => $sUrl,
                    'start' => $iJot,
                    'load' => $sLoad,
                    'limit' => $CNF['MAX_JOTS_LOAD_HISTORY'],
                    'views' => true,
                    'dynamic' => true,
                    'area' => $sArea
                );

                $iLastUnreadJotId = $iUnreadJotsNumber = 0;
                $aUnreadInfo = $this->_oDb->getNewJots($this->_iProfileId, $iLotId);
                if (!empty($aUnreadInfo)) {
                    $iLastUnreadJotId = (int)$aUnreadInfo[$CNF['FIELD_NEW_JOT']];
                    $iUnreadJotsNumber = (int)$aUnreadInfo[$CNF['FIELD_NEW_UNREAD']];
                }

                $sContent = '';
                if ($bUpdateHistory){
                   $aJots = $this->_oTemplate->getJotsOfLot($this->_iProfileId, $aOptions);
                   $sContent = $aJots['content'];

                    if (isset($aJots['first_jot']) && $iJot && ($aJotInfo = $this->_oDb->getJotById($iJot))) {
                        $iFDate = strtotime(date("Y-m-d", $aJots['first_jot'][$CNF['FIELD_MESSAGE_ADDED']]));
                        $iSDate = strtotime(date("Y-m-d", $aJotInfo[$CNF['FIELD_MESSAGE_ADDED']]));
                        $bRemoveSeparator = +($iFDate == $iSDate);
                    }
                }
                
                break;
            case 'edit':
                  $aJotInfo = $this->_oDb->getJotById($iJot);
                  $sContent = $aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE']];
                break;
            case 'vc':
            case 'delete':
                  $sContent = $this->_oTemplate->getMessageIcons($iJot, $sLoad, $this->_oDb->isAuthor($iLotId, $this->_iProfileId) || isAdmin());
                break;
            case 'check_viewed':
                if ($iLotId && $iJot)
                    $sContent = $this->_oTemplate->getViewedJotProfiles($iJot, $this->_iProfileId);
                break;

            case 'reaction':
                if ($iJot) {
                    $aJotInfo = $this->_oDb->getJotById($iJot);
                    if (!empty($aJotInfo))
                        $sContent = $this->_oTemplate->getJotReactions($iJot);
                }
            break;
        }

        $aResult = array(
                            'code' => 0,
                            'html' => $sContent,
                            'unread_jots' => $iUnreadJotsNumber,
                            'last_unread_jot' => $iLastUnreadJotId,
                            'allow_attach' => +$bAttach,
                            'remove_separator' => +$bRemoveSeparator
                        );

        // update session
        BxDolSession::getInstance()->exists();

        echoJson($aResult);
    }

    public function searchFriends($sTerm, $aProfilesList = array()){
        if (!$sTerm || !($aTerms = preg_split("/[\s,]+/", $sTerm)))
            return array();

        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends');
        $aProfiles = !empty($aProfilesList) ? $aProfilesList : $oConnection->getConnectedContent($this->_iProfileId, true);

        $aResult = array();
        if (empty($aProfiles))
            return $aResult;

        $aModules = BxDolService::call('system', 'get_profiles_modules', array(), 'TemplServiceProfiles');
        if (empty($aModules))
            return $aResult;

        $aProfilesModules = array();
        foreach($aModules as &$aModule)
            $aProfilesModules[$aModule['name']] = BxDolModule::getInstance($aModule['name']);

        $aFieldsFilter = array();
        foreach($aProfiles as &$iID){
            $oProfileInfo = BxDolProfile::getInstance($iID);
            if (!empty($oProfileInfo)) {
                $aInfo = $oProfileInfo->getInfo();
                if (isset($aInfo['type']) && isset($aProfilesModules[$aInfo['type']])) {
                    $aProfileInfo = $aProfilesModules[$aInfo['type']]->_oDb->getContentInfoByProfileId($iID);

                    if (!isset($aFieldsFilter[$aInfo['type']])) {
                    $sFields = getParam($aProfilesModules[$aInfo['type']]->_oConfig->CNF['PARAM_SEARCHABLE_FIELDS']);
                        if ($sFields)
                            $aFieldsFilter[$aInfo['type']] = explode(',', $sFields);
                    }

                    if ($aFieldsFilter[$aInfo['type']]) {
                        $sSearchString = '';
                        foreach($aFieldsFilter[$aInfo['type']] as &$sKey)
                           $sSearchString .= " {$aProfileInfo[$sKey]}";

                        if ($sSearchString) {
                            $bResult = true;
                            foreach ($aTerms as &$sValue)
                                if (stripos($sSearchString, $sValue) === FALSE) {
                                    $bResult = false;
                                    break;
                                }

                            if ($bResult)
                                $aResult[$aInfo['type']][] = $aProfileInfo;
                        }
                    }
                }
            }
        }

        return $aResult;
    }

    public function searchProfiles($sTerm, $aExcept = array(), $iLimit = 10)
    {
        $CNF = &$this->_oConfig->CNF;
        $aModules = BxDolService::call('system', 'get_profiles_modules', array(), 'TemplServiceProfiles');
        if (empty($aModules))
            return array();

        if ($CNF['USE-FRIENDS-ONLY-MODE'])
            $aSearchResult = $this->searchFriends($sTerm);
        else {
            $aModules = array_map(function ($aModule) {
                return $aModule['name'];
            }, $aModules);

            $o = new BxDolSearch($aModules);
            $o->setDataProcessing(true);
            $o->setCustomSearchCondition(array('keyword' => $sTerm));
            $o->setCustomCurrentCondition(array(
                'paginate' => array(
                    'perPage' => $iLimit / count($aModules) + 0.5
                )
            ));

            $aSearchResult = $o->response();
            if (empty($aSearchResult))
                return array();
        }

        bx_alert($this->getName(), 'get_profiles_list', 0, 0, ['term' => $sTerm, 'override_list' => &$aSearchResult]);

        $aUsers = [];
        if (!bx_is_api()) {
            foreach ($aSearchResult as $sModule => $aItems) {
            $aCNF = BxDolModule::getInstance($sModule)->_oConfig->CNF;
            $sTitleField = $aCNF['FIELD_TITLE'];
            $sIdField = $aCNF['FIELD_ID'];
                foreach ($aItems as &$aItem) {
                $sLabel = isset($aItem[$sTitleField]) ? $aItem[$sTitleField] : false;
                if ($sLabel)
                    $aUsers[] = array(
                        'value' => BxDolProfile::getInstanceByContentAndType($aItem[$sIdField], $sModule)->id(),
                        'label' => $sLabel,
                    );
            }
        }

        // sort result
        usort($aUsers, function($r1, $r2) {
            return strcmp($r1['label'], $r2['label']);
        });

        if (!empty($aExcept))
            $aUsers = array_filter($aUsers, function($aUsers) use ($aExcept) {
                return !in_array($aUsers['value'], $aExcept);
            });
        }
        else
            $aUsers = $aSearchResult;
  
        return array_slice($aUsers, 0, $iLimit);
    }
    /**
     * Occurs when member adds or edit participants list for new of specified lot
     * @return string with json code
     */
	public function actionGetAutoComplete(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_logged'), 'reload' => 1));

        $aResult = $aExcept = array();
        $sExcept = bx_get('except');
	    if ($sExcept)
            $aExcept = explode(',', $sExcept);

	    $aUsers = $this->searchProfiles(bx_get('term'), $aExcept,  $this->_oConfig->CNF['PARAM_SEARCH_DEFAULT_USERS']);
	    if (empty($aUsers))
            return echoJson(array('items' => $aUsers));

        $bDonShowDesc = $this->_oConfig->CNF['DONT-SHOW-DESC'];
        foreach ($aUsers as &$aValue) {
            if (!$this->onCheckContact($this->_iUserId, $aValue['value']))
                continue;

            if (!($oProfile = BxDolProfile::getInstance($aValue['value'])))
                continue;

            $aProfileInfo = $oProfile->getInfo();
            $aProfileInfoDetails = BxDolService::call($aProfileInfo['type'], 'get_content_info_by_id', array($aProfileInfo['content_id']));
            $oAccountInfo = BxDolAccount::getInstance($aProfileInfo['account_id']);

            $sThumb = $oProfile->getThumb();
            $bThumb = stripos($sThumb, 'no-picture') === FALSE;
            $sDisplayName = $oProfile->getDisplayName();
            if (!empty($aProfileInfoDetails) && !empty($oAccountInfo)) {
                $aResult[$aProfileInfo['type']]['results'][] = array(
                    'value' => $sDisplayName,
                    'no_desc' => (int)$bDonShowDesc,
                    'icon' => $bThumb ? $sThumb : '',
                    'color' => implode(', ', BxDolTemplate::getColorCode($aValue['value'], 1.0)),
                    'letter' => mb_substr($sDisplayName, 0, 1),
                    'id' => $oProfile->id(),
                    'profile_url' => $oProfile->getUrl(),
                    'description' => !$bDonShowDesc ? _t('_bx_messenger_search_desc',
                        bx_process_output($oAccountInfo->getInfo()['logged'], BX_DATA_DATE_TS),
                        bx_process_output($aProfileInfoDetails['added'], BX_DATA_DATE_TS)) : ''
                );
            }
        }

        foreach($aResult as $sKey => $aValues){
            $aResult[$sKey]['name'] =_t("_{$sKey}");
        }

        echoJson(array('results' => $aResult));
    }

    /**
     * Returns processed videos by received videos ids
     * @return array with json
     */
	public function actionGetProcessedMedia(){
        $CNF = &$this->_oConfig->CNF;
        $aMedia = bx_get('media');
        $aResult = array();

        if (empty($aMedia))
            return echoJson($aResult);

        $oTranscoderAudio = BxDolTranscoderAudio::getObjectInstance($CNF['OBJECT_MP3_TRANSCODER']);
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (empty($oStorage))
            return echoJson($aResult);

		foreach($aMedia as &$iMedia)
		{
            $aFile = $oStorage->getFile($iMedia);
            if ($oTranscoderAudio->isMimeTypeSupported($aFile['mime_type']) && $oTranscoderAudio->isFileReady($iMedia))
                $aResult[$iMedia] = $this->_oTemplate->audioPlayer($oTranscoderAudio->getFileUrl($aFile[$CNF['FIELD_ST_ID']]), true);

            if (!strncmp('video/', $aFile['mime_type'], 6))
                $aResult[$iMedia] = $this->_oTemplate->getVideoFilesToPlay($aFile);
        }

        echoJson($aResult);
    }

    /**
     * Search for lot by participants list and occurs when member edit participants list
     * @return string with json
     */
    public function actionFindLot()
    {
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_logged'), 'reload' => 1));

        $CNF = &$this->_oConfig->CNF;
        $aParticipants = $this->getParticipantsList(bx_get('participants'));
        $aResult = array('lot' => 0);
        if (!empty($aParticipants) && ($aChat = $this->_oDb->findLotByParams(array(
                $CNF['FIELD_PARTICIPANTS'] => $aParticipants,
                $CNF['FIELD_TYPE'] => BX_IM_TYPE_PRIVATE,
                $CNF['FIELD_CLASS'] => BX_MSG_TALK_CLASS_CUSTOM,
            ))))
            $aResult['lot'] = $aChat[$this->_oConfig->CNF['FIELD_ID']];

        echoJson($aResult);
    }

    /**
     * Updats participants list (occurs when create new lost with specified participants or update already existed list)
     * @return string with json
     */

    public function saveParticipantsList($aParticipants, $iLotId = 0, $bIsBlock = 0){
        $bCheckAction = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true;
        if ($iLotId && !($this->_oDb->isAuthor($iLotId, $this->_iProfileId) || $bCheckAction))
            return ['code' => 1, 'message' => _t('_bx_messenger_lot_action_not_allowed')];

        $CNF = &$this->_oConfig->CNF;
        if (!$iLotId){
            $aLot = $this->_oDb->findLotByParams(array(
                $CNF['FIELD_PARTICIPANTS'] => $aParticipants,
                $CNF['FIELD_TYPE'] => BX_IM_TYPE_PRIVATE,
                $CNF['FIELD_CLASS'] => BX_MSG_TALK_CLASS_CUSTOM,
            ));

            if (!empty($aLot))
                $iLotId = $aLot[$this->_oConfig->CNF['FIELD_ID']];
        }

        $oOriginalParts = [];
        $aResult = ['code' => 0, 'message' => _t('_bx_messenger_save_part_success')];
        if (!$iLotId) {
            $iLotId = $this->_oDb->createNewLot($this->_iProfileId, ['title' => '', 'type' => BX_IM_TYPE_PRIVATE, 'url' => BX_IM_EMPTY_URL], $aParticipants);
            $aResult['lot'] = $iLotId;
            $this->onCreateLot($iLotId);
		}
        else {
            $oOriginalParts = $this->_oDb->getParticipantsList($iLotId);
            if (!$this->_oDb->saveParticipantsList($iLotId, $aParticipants))
                $aResult = ['code' => 2, 'message' => _t('_bx_messenger_lot_parts_error')];
        }

        $aRemoveParticipants = array_diff($oOriginalParts, $aParticipants);
        $aNewParticipants = array_diff($aParticipants, $oOriginalParts);

        foreach ($aNewParticipants as &$iPartId)
            $this->onAddNewParticipant($iLotId, $iPartId);

        foreach ($aRemoveParticipants as &$iPartId) {
            $this->_oDb->deleteNewJot($iPartId, $iLotId);
            $this->onRemoveParticipant($iLotId, $iPartId);
        }

        return $aResult;
    }

    public function actionSaveLotsParts()
    {
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_logged'), 'reload' => 1));

        $iLotId = bx_get('lot');
        $bIsBlockVersion = +bx_get('is_block');
        $aParticipants = $this->getParticipantsList(bx_get('participants'));
        $aResult = array('message' => _t('_bx_messenger_save_part_failed'), 'code' => 1);
        if (empty(bx_get('participants')))
            return echoJson($aResult);

        $aResult = $this->saveParticipantsList($aParticipants, $iLotId, $bIsBlockVersion);
        if ($iLotId) {
            $aHeader = $this->_oTemplate->getTalkHeader($iLotId, $this->_iProfileId, $bIsBlockVersion, true);
            $aResult['header'] = $aHeader['title'];
            $aResult['buttons'] = $aHeader['buttons'];
        }

        echoJson($aResult);
    }

    /**
     * Removes specified lot
     * @return string with json
     */
    public function actionDelete()
    {
        $iLotId = bx_get('lot');
        $aResult = array('message' => _t('_bx_messenger_can_not_delete'), 'code' => 1);

        $bAllowed = $this->_oDb->isAuthor($iLotId, $this->_iProfileId) || ($this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true);
        if (!$iLotId || !$bAllowed)
            return echoJson($aResult);

        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if ($this->_oDb->deleteLot($iLotId)) {
            $aResult = ['code' => 0];
            $this->onDeleteLot($aLotInfo);
        }

        echoJson($aResult);
    }

    /**
     * Clear specified lot
     * @return string with json
     */
    public function actionClearHistory()
    {
        $iLotId = bx_get('lot');
        $aResult = array('code' => 1, 'message' => _t('_Empty'));
        $bAllowed = $this->_oDb->isAuthor($iLotId, $this->_iProfileId) || ($this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true);
        if (!$iLotId || !$bAllowed) {
            return echoJson($aResult);
        }

        if ($this->_oDb->clearLot($iLotId))
            $aResult = array('code' => 0);

        echoJson($aResult);
    }

    /**
     * Removes specified jot
     * @return string with json
     */
    public function actionDeleteJot()
    {
        $iJotId = bx_get('jot');
        $bCompletely = (int)bx_get('completely');
        $aReturn = $this->serviceDeleteJot($iJotId, $bCompletely);
        echoJson($aReturn);
    }

    public function serviceDeleteJot($iJotId, $bCompletely = false)
    {
        $aResult = array('code' => 1);
        $aJotInfo = $this->_oDb->getJotById($iJotId);
        if (empty($aJotInfo))
            return $aResult;

        $CNF = &$this->_oConfig->CNF;
        $bIsAllowedToDelete = $this->_oDb->isAllowedToDeleteJot($iJotId, $this->_iProfileId, $aJotInfo[$CNF['FIELD_MESSAGE_AUTHOR']]);
        if (!$bIsAllowedToDelete)
            return $aResult;

        $bIsLotAuthor = $this->_oDb->isAuthor($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId);
        $bDelete = $bCompletely || $CNF['REMOVE_MESSAGE_IMMEDIATELY'];
        if ($this->_oDb->deleteJot($iJotId, $this->_iProfileId, $bDelete)){
            if ($bDelete)
                $this->onDeleteJot($aJotInfo);
            $aResult = array('code' => 0, 'html' => !$bCompletely ? $this->_oTemplate->getMessageIcons($iJotId, 'delete', $bIsLotAuthor || isAdmin()) : '');
        }

        return $aResult;
    }

    /**
     * React on defined jot
     * @return string with json
     */
    public function actionJotReaction()
    {
        $iJotId = bx_get('jot');
        $aEmoji = bx_get('emoji');
        $sAction = bx_get('action');
        $aJotInfo = $this->_oDb->getJotById($iJotId);

        $aResult = array('code' => 1);
        $CNF = &$this->_oConfig->CNF;

        if (empty($aJotInfo))
            return echoJson($aResult);

        $bIsParticipant = $this->_oDb->isParticipant($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId);
        $aLotInfo = $this->_oDb->getLotInfoById($aJotInfo[$CNF['FIELD_MESSAGE_FK']]);
        if (!$bIsParticipant) {
            if ($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
               return echoJson(array('code' => 1, 'msg' => _t('_bx_messenger_not_participant')));

            if (!empty($aLotInfo))
                $this->_oDb->addMemberToParticipantsList($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId);
        }

        if ($sAction == BX_JOT_REACTION_ADD && $this->_oDb->addJotReaction($iJotId, $this->_iProfileId, $aEmoji)) {
            $this->onReactJot($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $iJotId, $aLotInfo[$CNF['FIELD_AUTHOR']], $sAction);
            $aResult = array('code' => 0, 'html' => $this->_oTemplate->getJotReactions($iJotId));
        }

        echoJson($aResult);
    }

    public function actionUpdateReaction()
    {
        $iJotId = bx_get('jot');
        $sEmoji = bx_get('emoji_id');
        $sAction = bx_get('action');
        $aJotInfo = $this->_oDb->getJotById($iJotId);

        $aResult = array('code' => 1);
        $CNF = &$this->_oConfig->CNF;
        if (empty($aJotInfo))
            return echoJson($aResult);

        $bIsParticipant = $this->_oDb->isParticipant($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $this->_iProfileId);
        $aLotInfo = $this->_oDb->getLotInfoById($aJotInfo[$CNF['FIELD_MESSAGE_FK']]);
        if (!$bIsParticipant && $sAction == BX_JOT_REACTION_ADD && $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
            return echoJson($aResult);

        if ($this->_oDb->updateReaction($iJotId, $this->_iProfileId, $sEmoji, $sAction)){
            $this->onReactJot(
                $aJotInfo[$CNF['FIELD_MESSAGE_FK']],
                $iJotId,
                $aLotInfo[$CNF['FIELD_AUTHOR']], $sAction === BX_JOT_REACTION_ADD ? BX_JOT_REACTION_ADD : BX_JOT_REACTION_REMOVE
            );

            $aResult = array('code' => 0);
        }

        echoJson($aResult);
    }

  /**
     * Get body of the jot
     * @return string with json
     */
    public function actionViewJot()
    {
        $iJotId = bx_get('jot');
        $aJotInfo = $this->_oDb->getJotById($iJotId);
        if (empty($aJotInfo) || !(isAdmin() || $this->_oDb->isAuthor($aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)))
            return echoJson(array('code' => 1));

        $aResult = array('code' => 0, 'html' => $this->_oTemplate->getJotsBody($iJotId));
        echoJson($aResult);
    }

  /**
       * Get body of the jot
      * @return string with json
     */
    public function actionGetJotPreview()
    {
        $iJotId = bx_get('jot');
        $aJotInfo = $this->_oDb->getJotById($iJotId);
        if (empty($aJotInfo) || !(isAdmin() || $this->_oDb->isAuthor($aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)))
            return echoJson(array('code' => 1));

        $aResult = array('code' => 0, 'html' => $this->_oTemplate->getReplyPreview($iJotId));
        echoJson($aResult);
    }


    /**
     * Jot edit panel
     * @return string with json
     */
    public function actionEditJotForm()
    {
        $iJotId = bx_get('jot');
        $aResult = array('code' => 1);
        $aJotInfo = $this->_oDb->getJotById($iJotId);

        $mixedResult = $this->_oDb->isAllowedToEditJot($iJotId, $this->_iProfileId);
        if (empty($aJotInfo) || $mixedResult !== true)
            return echoJson($aResult);

        echoJson(['code' => 0, 'html' => $this->_oTemplate->getEditJotArea($iJotId)]);
    }

    public function actionEditJot()
    {
        $iJotId = bx_get('jot');
        $aResult = ['code' => 1];
        $sMessageData = bx_get('message');
        if (!($aJotInfo = $this->_oDb->getJotById($iJotId)))
            return echoJson($aResult);

        $sMessage = $this->prepareMessageToDb($sMessageData);
        $mixedResult = $this->_oDb->isAllowedToEditJot($iJotId, $this->_iProfileId);
        if ($mixedResult !== true)
            return echoJson($aResult);

        if ($this->_oDb->editJot($iJotId, $this->_iProfileId, $sMessage)) {
            $aResult = ['code' => 0, 'html' => $this->_oTemplate->getMessageIcons($iJotId, 'edit')];
            $this->onUpdateJot($aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE_FK']], $iJotId, $aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE_AUTHOR']]);
        }

        echoJson($aResult);
    }

    public function actionSaveJotItem(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1));

        $iJotId = bx_get('jot');
        $aJotInfo = $this->_oDb->getJotById($iJotId);
        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_nothing_found'));
        if (empty($aJotInfo))
            return echoJson($aResult);

        $CNF = &$this->_oConfig->CNF;
        if (!$this->isAvailable($aJotInfo[$CNF['FIELD_MESSAGE_FK']]))
           return echoJson(array('code' => 1, 'msg' => _t('_bx_messenger_not_participant')));

        $bSaved = $this->_oDb->isJotSaved($iJotId, $this->_iProfileId);
        $bCode = false;
        if ($bSaved)
            $bCode = $this->_oDb->deleteSavedJotItems($iJotId, $this->_iProfileId);
        else
            $bCode = $this->_oDb->saveJotItem($iJotId, $this->_iProfileId);


        echoJson(array('code' => (int)!$bCode, 'status' => (int)!$bSaved));
    }

    /**
     * Removes specified file by id
     * @return string with json
     */
    public function actionDeleteFile()
    {
        $iFileId = bx_get('id');
        $aResult = array('code' => 1, 'message' => _t('_bx_messenger_post_file_not_found'));
        if (!$iFileId)
            return echoJson($aResult);

        $CNF = &$this->_oConfig->CNF;
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $aFile = $oStorage->getFile($iFileId);

        $bIsAllowedToDelete = $this->_oDb->isAllowedToDeleteJot($aFile[$CNF['FIELD_ST_JOT']], $this->_iProfileId);
        if (!$bIsAllowedToDelete)
            return echoJson($aResult);

        $aJotInfo = $this->_oDb->getJotById($aFile[$CNF['FIELD_ST_JOT']]);
        $this->_oDb->removeFileFromJot($aJotInfo[$CNF['FIELD_MESSAGE_ID']], $iFileId);
		if ($oStorage->deleteFile($iFileId, $this->_iProfileId))
		{
            $aResult = array('code' => 0);

            $aJotFiles = $this->_oDb->getJotFiles($aFile[$CNF['FIELD_ST_JOT']]);
            if (count($aJotFiles) == 0 && !$aJotInfo[$CNF['FIELD_MESSAGE']] && $this->_oDb->deleteJot($aJotInfo[$CNF['FIELD_MESSAGE_ID']], $this->_iProfileId)) {
                $aResult['empty_jot'] = 1;
                $this->onDeleteJot($aJotInfo);
			}
			else
                $this->onUpdateJot($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $aJotInfo[$CNF['FIELD_MESSAGE_ID']], $aJotInfo[$CNF['FIELD_MESSAGE_AUTHOR']]);
        }

        echoJson($aResult);
    }

    /**
     * Leave talk with defined id
     * @return string with json
     */
	public function actionLeave(){
        $iLotId = bx_get('lot');

        if (!$iLotId || !$this->_oDb->isParticipant($iLotId, $this->_iProfileId)) {
            return echoJson(['message' => _t('_bx_messenger_not_participant'), 'code' => 1]);
        }

        if ($this->_oDb->isAuthor($iLotId, $this->_iProfileId))
            return echoJson(['message' => _t('_bx_messenger_cant_leave'), 'code' => 1]);


        if ($this->_oDb->leaveLot($iLotId, $this->_iProfileId))
            return echoJson(['message' => _t('_bx_messenger_successfully_left'), 'code' => 0]);
    }

    /**
     * Block notifications from specified lot(conversation)
     * @return string with json
     */
    public function actionMute()
    {
        $iLotId = bx_get('lot');

        if ($iLotId && $this->isAvailable($iLotId)) {
            $bMuted = $this->_oDb->muteLot($iLotId, $this->_iProfileId);
            return echoJson(array('code' => $bMuted, 'title' => $bMuted ? _t('_bx_messenger_lots_menu_mute_info_on') : _t('_bx_messenger_lots_menu_mute_info_off')));
        }

        return echoJson(array('code' => 1));
    }

    /**
     * Mark lot as favorite
     * @return string with json
     */
    public function actionStar()
    {
        $iLotId = bx_get('lot');
        if ($iLotId) {
            $bStar = $this->_oDb->starLot($iLotId, $this->_iProfileId);
            return echoJson(array('code' => $bStar, 'title' => !$bStar ? _t('_bx_messenger_lots_menu_star_on') : _t('_bx_messenger_lots_menu_star_off')));
        }

        return echoJson(array('code' => 1));
    }

    /**
     * Returns number of lots with at least one unread message
     * @return int
     */
    public function serviceGetUpdatedLotsNum($iProfileId = 0)
    {
        if (!$this->isLogged())
            return array();

       $aLots = $this->_oDb->getLotsWithUnreadMessages($iProfileId ? $iProfileId : $this->_iProfileId);
       return sizeof($aLots);
    }

    /**
     * Common function to send notifications to the Talk's participants
     * @param $iLotId integer Talk's id
     * @param $iJotId integer message id
     * @return bool|string
     */

    private function sendMessageNotification($iLotId, $iJotId){
        $aReceived = [];
        if (!$iLotId || !$iJotId)
            return false;

        $CNF = &$this->_oConfig->CNF;
        $aJot = $this->_oDb->getJotById($iJotId);

        $sMessage = $aJot[$CNF['FIELD_MESSAGE']];
        if ($sMessage){
            $sMessage = preg_replace('/<br\s?\/?>/i', "\r\n", $sMessage);
            $sMessage = html2txt($sMessage);
            $sMessage = get_mb_substr($sMessage, 0, (int)$CNF['PARAM_PUSH_NOTIFICATIONS_DEFAULT_SYMBOLS_NUM']);

            // find mentions in the message and send notifications
            if ($CNF['USE_MENTIONS'] && preg_match_all('/<a[^>]*class="bx-mention[^"]*"[^>]*data-id="(\d+)".*?<\/a>/i', $aJot[$CNF['FIELD_MESSAGE']],$aMatches)) {
                list(, $aMentionedProfiles) = $aMatches;

                if ($aMentionedProfiles) {
                    $this->sendNotification($iLotId, $iJotId, $sMessage, $aReceived, $aMentionedProfiles, BX_MSG_NTFS_MENTION);
                    $aReceived = array_diff($aReceived, $aMentionedProfiles);
                }
            }
        }

        return $this->sendNotification($iLotId, $iJotId, $sMessage, $aReceived);
    }

    /**
     * Sends push notification to the Talk's participants through the Notifications module or
     * using Messenger's push notifications settings.
     *
     * @param $iLotId
     * @param $iJotId
     * @param $sMessage
     * @param array $aReceived
     * @param array $aRecipients
     * @param string $sType
     * @return bool|string
     */
    private function sendNotification($iLotId, $iJotId, $sMessage, $aReceived = [], $aRecipients = [], $sType = BX_MSG_NTFS_MESSAGE){
        // check if the Notifications module is installed and send notifications through it
        if ($this->_oDb->isModuleByName('bx_notifications'))
            return $this->sendNotifications($iLotId, $iJotId, $aReceived, $aRecipients, $sType);
    }

    /**
     * Proper the list of the participants whom to send notifications
     * @param $iLotId
     * @param $iJotId
     * @param array $aOnlineUsers
     * @param array $aRecipients
     * @param string $sType
     * @return bool
     */

    public function sendNotifications($iLotId, $iJotId, $aOnlineUsers = [], $aRecipients = [], $sType = BX_MSG_NTFS_MESSAGE)
    {
        $CNF = &$this->_oConfig->CNF;

        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        $sModule = $this->_oConfig->getObject('alert');
        if (empty($aLotInfo))
           return false;

        $aPartList = $this->_oDb->getParticipantsList($iLotId, true, $this->_iProfileId);
        if ((int)$aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_BROADCAST) {
            $iJotCount = $this->_oDb->getJotsNumber($iLotId, 0);
            if ($iJotCount >= 2)
                $aPartList = $this->_oDb->getBroadcastParticipants($iLotId);
        }

        if (empty($aPartList))
            return false;

        if (!empty($aRecipients)){
            $aDiff = array_diff($aRecipients, $aPartList);
            if (!empty($aDiff) && (int)$aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE) // in case if the mentioned profiles are not in the participants list
                $aPartList = array_diff($aRecipients, $aDiff);
            else
                $aPartList = $aRecipients;
        }

        $bIsMention = ($sType == BX_MSG_NTFS_MENTION);
        foreach ($aPartList as &$iPart) {
            if (array_search($iPart, $aOnlineUsers) !== FALSE || $this->_oDb->isMuted($iLotId, $iPart))
                continue;

            $iCount = $this->_oDb->getSentNtfsNumber($iPart, $iLotId);
            if ($iCount >= (int)$CNF['MAX_NTFS_NUMBER'] && !$bIsMention)
                continue;

            bx_alert($sModule, !$bIsMention ? 'got_jot_ntfs' : 'got_mention_ntfs', $iLotId, $this->_iProfileId, array(
                'object_author_id' => $iPart,
                'recipient_id' => $iPart,
                'subobject_id' => $iJotId
            ));
        }

        return true;
    }

    /**
     * Creates template with member's avatar, name and etc... It is used when member posts a message to add message to member history immediately
     * @return string json
     */
    public function actionLoadMembersTemplate()
    {
        $sTemplate =  '';
        if ($this->isLogged())
            $sTemplate = $this->_oTemplate->getMembersJotTemplate($this->_iProfileId);

        echoJson(
            array(
                'data' => $sTemplate
            ));
    }

    /**
     * Delete all content by profile ID
     * @param object oAlert
     * @return boolean
     */
    public function serviceDeleteHistoryByAuthor($oAlert)
    {
        return $oAlert->iObject && !empty($oAlert->aExtras['delete_with_content']) ?
            $this->_oDb->deleteProfileInfo($oAlert->iObject) : false;
    }

    /**
     * Process alerts actions
     * @param object oAlert
     * @return boolean
     */
    public function serviceResponse($oAlert)
    {
        $CNF = &$this->_oConfig->CNF;
        $iGroupProfileId = 0;
        $iExecutor = 0;
        $sModule = '';
        if ($oAlert->sAction == 'fan_added'){
            $iGroupProfileId = $oAlert->iObject;
            $iExecutor = $oAlert->aExtras['performer_id'];
            $sModule = $oAlert->sUnit;
        } else if ($oAlert->sAction == 'connection_removed'){
            $iGroupProfileId = BxDolProfile::getInstance($oAlert->aExtras['initiator'])->getContentId();
            $iExecutor = $oAlert->iSender;
            $sModule = str_replace('_fans', '', $oAlert->sUnit);
        }

        if (BxDolRequest::serviceExists($sModule, 'is_group_profile') && $iGroupProfileId) {
            $aGroupInfo = BxDolService::call($sModule, 'get_info', array($iGroupProfileId, false));
            if(!empty($aGroupInfo) && is_array($aGroupInfo)) {
                $oModule = BxDolModule::getInstance($sModule);
                if ($oModule->_oConfig) {
                    $oMCNF = $oModule->_oConfig->CNF;
                    $sUrl = "i={$oMCNF['URI_VIEW_ENTRY']}&id=" . $aGroupInfo[$oMCNF['FIELD_ID']];
                    if ($sUrl && $aTalk = $this->_oDb->getLotByUrl($sUrl)){
                        if ($oAlert->sAction == 'fan_added' && BxDolService::call($sModule, 'check_allowed_view_for_profile', array($aGroupInfo)) === CHECK_ACTION_RESULT_ALLOWED) {
                            if (!$this->_oDb->isParticipant($aTalk[$oMCNF['FIELD_ID']], $iExecutor))
                                $this->_oDb->addMemberToParticipantsList($aTalk[$oMCNF['FIELD_ID']], $iExecutor);
                        } else if ($oAlert->sAction == 'connection_removed' && $this->_oDb->isParticipant($aTalk[$oMCNF['FIELD_ID']], $iExecutor)) {
                                $this->_oDb->removeParticipant($aTalk[$oMCNF['FIELD_ID']], $iExecutor);
                        }
                    }
                }
            }
        }
    }

    /**
     * Parse jot's link (repost)
     * @param object oAlert
     * @return string json
     */
    public function actionParseLink()
    {
        $sUrl = bx_get('link');
        $iJotId = (int)bx_get('jot_id');
        $bDontAttach = (int)bx_get('dont_attach');

        $aUrl = $this->_oConfig->isJotLink($sUrl);
		if (!empty($aUrl))
		{
            $aJotInfo = $this->_oDb->getJotById($aUrl['id']);
            if (!$this->_oDb->isParticipant($aJotInfo[$this->_oConfig->CNF['FIELD_MESSAGE_FK']], $this->_iUserId))
                return echoJson(array('code' => 0));

            $sHTML = $this->_oTemplate->getJotAsAttachment($aUrl['id']);
            if ($sHTML && !$bDontAttach)
                $this->_oDb->addAttachment($iJotId, $aUrl['id'], BX_ATT_TYPE_REPOST);

            return echoJson(array('code' => 0, 'html' => $sHTML));
        }

        echoJson(array('code' => 1));
    }

    /**
     * Parses link from the message
     * @param object oAlert
     * @return json
     */
    public function actionGetAttachment()
    {
        $iJotId = (int)bx_get('jot_id');

		if ($iJotId){
            $aJot = $this->_oDb->getJotById($iJotId);
            if (!empty($aJot) && $this->_oDb->isParticipant($aJot[$this->_oConfig->CNF['FIELD_MESSAGE_FK']], $this->_iProfileId)) {
                if (($aAttachment = $this->_oTemplate->getAttachment($aJot, true)) && isset($aAttachment[BX_ATT_GROUPS_ATTACH]))
                    return echoJson(['code' => 0, 'html' => $aAttachment[BX_ATT_GROUPS_ATTACH]]);
            }
        }

        echoJson(['code' => 1]);
    }

    /**
     * Returns HTML popup form for video recording
     */
    public function actionGetRecordVideoForm()
    {
        header('Content-type: text/html; charset=utf-8');
        echo $this->_oTemplate->getVideoRecordingForm($this->_iUserId);
        exit;
    }

    /**
     * Allows to delete/upload files in messages
     * @return string
     */
    public function actionUploadTempFile()
    {
        if (!$this->isLogged()) {
            echo _t('_bx_messenger_not_logged');
            exit;
        }

        $CNF = &$this->_oConfig->CNF;
        switch($_SERVER['REQUEST_METHOD']){
            case 'DELETE':
                if ($sName = @file_get_contents("php://input"))
                    parse_str($sName, $aName);

                if (!empty($aName) && @unlink(BX_DIRECTORY_PATH_TMP . basename($aName['name'])))
                    echo 'OK';

                break;
            case 'POST':
                $oStorage = new BxMessengerStorage($CNF['OBJECT_STORAGE']);
                if (!$oStorage) {
                    echo 0;
                    exit;
                }

                $aFiles = array_filter($_FILES, function($aFile, $sName) use ($CNF) {
                    return stripos($sName, $CNF['FILES_UPLOADER']) !== FALSE;
                }, ARRAY_FILTER_USE_BOTH);

                $aUploader = current($aFiles);
                if (!empty($aUploader) && $oStorage->isValidFileExt($aUploader['name'])) {
                    $sTempFile = $aUploader['tmp_name'];
                    $sTargetFile = BX_DIRECTORY_PATH_TMP . basename($aUploader['name']);
                    move_uploaded_file($sTempFile, $sTargetFile);
                    echo 'OK';
                }
        }

        return '';
    }

    /**
     * Uploads recorded video file
     */
    public function actionUploadVideoFile()
    {
        $oStorage = new BxMessengerStorage($this->_oConfig->CNF['OBJECT_STORAGE']);
        if (!$oStorage || !isset($_POST['name']) || empty($_FILES)) {
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_send_message_no_video')));
        }

        if ($_FILES['file'] && $oStorage->isValidFileExt($_FILES['file']['name'])) {
            $sTempFile = $_FILES['file']['tmp_name'];
            $sTargetFile = BX_DIRECTORY_PATH_TMP . basename($_POST['name']);

            if (move_uploaded_file($sTempFile, $sTargetFile))
                return echoJson(array('code' => 0));
        }

        echoJson(array('code' => 1, 'message' => _t('_bx_messenger_send_message_no_video')));
    }

    /**
     * Checks is the file has valid extension to upload.
     */
    public function actionIsValidFile()
    {
        $oStorage = new BxMessengerStorage($this->_oConfig->CNF['OBJECT_STORAGE']);
        if (!$oStorage)
            return echoJson(array('code' => 1));

        $sFileName = bx_get('name');
        if ($sFileName && (int)$oStorage->isValidFileExt($sFileName)) {
            $sIconFile = $oStorage->getFontIconNameByFileName($sFileName);
            return echoJson(array('code' => 0, 'thumbnail' => $sIconFile ? $sIconFile : '', 'is_image' => (int)$oStorage->isImageExt($sFileName)));
        }

        echoJson(array('code' => 1));
    }

    /**
     * Allows to download files from the talk
     * @param $iFileId
     * @return string
     */

    public function actionDownloadFile($iFileId)
    {
        if (!$iFileId || !$this->_iProfileId)
            return '';

        $CNF = &$this->_oConfig->CNF;
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);

        $aFile = $oStorage->getFile((int)$iFileId);
        if (empty($aFile)){
            echo _t('_bx_messenger_post_file_not_found');
            exit;
        }

        if (isset($aFile[$CNF['FIELD_ST_JOT']])){
            $iLotId = $this->_oDb->getLotByJotId($aFile[$CNF['FIELD_ST_JOT']], true);
            if (!$iLotId || !$this->_oDb->isParticipant($iLotId, $this->_iProfileId)) {
                echo _t('_bx_messenger_not_participant');
                exit;
            }
        }

        $sToken = $oStorage->genToken($iFileId);
        return $oStorage->download($aFile[$CNF['FIELD_ST_REMOTE']], $sToken);
    }

    /**
     * Allow to zoom image from talk's history
     * @param int $iStorageId file id
     * @param int $iWidth width of the window
     * @param int $iHeight height of the window
     * @return string html content
     */
    function actionGetBigImage($iStorageId, $iWidth, $iHeight)
    {
        if (!$iStorageId)
            return '';

        $iWidth = (int)$iWidth * 0.9;
        $iHeight = (int)$iHeight * 0.9;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->CNF['OBJECT_STORAGE']);
        $aFile = $oStorage->getFile((int)$iStorageId);

        $sFileUrl = $oStorage->getFileUrlById($iStorageId);
    	if (!empty($aFile)){
            $aInfo = @getimagesize($sFileUrl);
            if (empty($aInfo)){
                echo MsgBox(_t('_bx_messenger_post_file_not_found'));
                exit;
            }

            if ($aInfo[0] <= $iWidth && $aInfo[1] <= $iHeight) {
                $iWidth = (int)$aInfo[0];
                $iHeight = (int)$aInfo[1];
			}
			else
			{
                $fXRatio = $aInfo[0] / $iWidth;
                $fYRatio = $aInfo[1] / $iHeight;

                if ($fXRatio > $fYRatio)
                    $iHeight = 'auto';
                else
                    $iWidth = 'auto';
            }
        }

        echo $this->_oTemplate->parseHtmlByName('big_image.html', array(
            'height' => $iHeight,
            'width' => $iWidth,
            'url' => $oStorage->getFileUrlById((int)$iStorageId)
        ));
        exit;
    }

    /**
     * Allows to register Messenger's actions in Notifications module through the Alerts
     * @return array
     */
    public function serviceGetNotificationsData()
    {
        $sModule = $this->_aModule['name'];
        return [
            'handlers' => [
                ['group' => $sModule, 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'got_jot_ntfs', 'module_name' => $sModule, 'module_method' => 'get_message_content', 'module_class' => 'Module'],
                ['group' => $sModule, 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete_jot_ntfs'],
                ['group' => "{$sModule}_mention", 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'got_mention_ntfs', 'module_name' => $sModule, 'module_method' => 'get_message_content', 'module_class' => 'Module'],
                ['group' => "{$sModule}_mention", 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete_mention_ntfs'],
                ['group' => "{$sModule}_broadcast", 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'got_broadcast_ntfs', 'module_name' => $sModule, 'module_method' => 'get_broadcast_content', 'module_class' => 'Module'],
                ['group' => "{$sModule}_broadcast", 'type' => 'delete', 'alert_unit' => $sModule, 'alert_action' => 'delete_broadcast_ntfs']
            ],
            'settings' => [
                ['group' => $sModule, 'unit' => $sModule, 'action' => 'got_jot_ntfs', 'types' => ['personal']],
                ['group' => "{$sModule}_mention", 'unit' => $sModule, 'action' => 'got_mention_ntfs', 'types' => ['personal']],
                ['group' => "{$sModule}_broadcast", 'unit' => $sModule, 'action' => 'got_broadcast_ntfs', 'types' => ['personal']]
            ],
            'alerts' => [
                ['unit' => $sModule, 'action' => 'got_jot_ntfs'],
                ['unit' => $sModule, 'action' => 'delete_jot_ntfs'],
                ['unit' => $sModule, 'action' => 'got_mention_ntfs'],
                ['unit' => $sModule, 'action' => 'delete_mention_ntfs'],
                ['unit' => $sModule, 'action' => 'got_broadcast_ntfs'],
                ['unit' => $sModule, 'action' => 'delete_broadcast_ntfs']
            ]
        ];
    }

    public function serviceGetBroadcastContent($aEvent){
        $CNF = &$this->_oConfig->CNF;

        $aJotInfo = $this->_oDb->getJotById($aEvent['subobject_id']);
        $aLotInfo = $this->_oDb->getLotByJotId($aEvent['subobject_id'], false);
        if (empty($aJotInfo) || empty($aLotInfo))
            return array();

        $sEntryUrl = $this->_oConfig->getRepostUrl($aJotInfo[$CNF['FIELD_MESSAGE_ID']]);
        $iType = $aLotInfo[$CNF['FIELD_TYPE']];

        $sTitle = _t('_bx_messenger_broadcast_message_title');

        // replace br to spaces and truncate the line
        $sMessage = _t('_bx_messenger_broadcast_message_body');
        if ($aJotInfo[$CNF['FIELD_MESSAGE']]) {
            $sTruncatedMessage = strmaxtextlen(preg_replace('/<br\W*?\/>|\n/', " ", $aJotInfo[$CNF['FIELD_MESSAGE']]), $CNF['PARAM_MAX_JOT_NTFS_MESSAGE_LENGTH']);
            $sMessage = _t('_bx_messenger_txt_sample_comment_single', $sTruncatedMessage);
        }

        $aResult = [
            'entry_sample' => _t('_bx_messenger_message'),
            'entry_url' => $sEntryUrl,
            'entry_caption' => $sTitle,
            'entry_author' => $aEvent['object_owner_id'],
            'subentry_sample' => $sMessage,
            'lang_key' => '_bx_messenger_txt_subobject_added_broadcast'
        ];

        $sSubject = _t("_bx_messenger_notification_subject_broadcast", BxDolProfile::getInstanceMagic($aEvent['owner_id'])->getDisplayName());
        $sAlterBody = $sTruncatedMessage ? $sTruncatedMessage : _t('_bx_messenger_txt_sample_email_push', html2txt($sMessage));

        $aResult['lang_key'] = [
            'site' => $aResult['lang_key'],
            'email' => $sAlterBody,
            'push' => $sAlterBody
        ];

        $aResult['settings'] = [
            'email' => [
                'subject' => $sSubject
            ],
            'push' => [
                'subject' => $sSubject
            ]
        ];

        bx_alert($this->_oConfig->getObject('alert'), 'before_broadcast_notification', $aEvent['subobject_id'],
                $aEvent['object_owner_id'], ['data' => &$aResult,'talk' => $aLotInfo, 'message' => $aJotInfo]);

        return $aResult;
    }
    /**
     * Jot info for Notifications module
     * @param array Input alert params
     * @return array with info for notifications
     */
    public function serviceGetMessageContent($aEvent)
    {
        $CNF = &$this->_oConfig->CNF;

        $aJotInfo = $this->_oDb->getJotById($aEvent['subobject_id']);
        $aLotInfo = $this->_oDb->getLotByJotId($aEvent['subobject_id'], false);
        if (empty($aJotInfo) || empty($aLotInfo))
            return array();

        $sType = BX_MSG_NTFS_MESSAGE;
        if ($aEvent['action'] === 'got_mention_ntfs')
            $sType = BX_MSG_NTFS_MENTION;

        $sEntryUrl = $this->_oConfig->getRepostUrl($aJotInfo[$CNF['FIELD_MESSAGE_ID']]);
        $sEntryUrlApi = $this->_oConfig->getRepostUrlApi($aLotInfo[$CNF['FIELD_HASH']]);
        $iType = $aLotInfo[$CNF['FIELD_TYPE']];

        $sTitle = isset($aLotInfo[$CNF['FIELD_TITLE']]) && $aLotInfo[$CNF['FIELD_TITLE']] ?
            $aLotInfo[$CNF['FIELD_TITLE']] : _t('_bx_messenger_lots_private_lot');

        if ($this->_oDb->isLinkedTitle($iType)) {
            $sTitle = $this->_oDb->isLinkedTitle($iType) ? _t('_bx_messenger_linked_title', $sTitle) : _t($sTitle);
            $sEntryUrl = $this->_oConfig->getPageLink($aLotInfo[$CNF['FIELD_URL']]);
        }

        $bAttachmentFiles = $this->_oConfig->isAttachmentType($aJotInfo, BX_ATT_TYPE_FILES);
        $bAttachmentGiphy = $this->_oConfig->isAttachmentType($aJotInfo, BX_ATT_TYPE_GIPHY);
        $bAttachmentReply = $this->_oConfig->isAttachmentType($aJotInfo, BX_ATT_TYPE_REPLY);
        $bAttachmentRepost = $this->_oConfig->isAttachmentType($aJotInfo, BX_ATT_TYPE_REPOST);

        $sTruncatedMessage = $sMessage = '';
        // replace br to spaces and truncate the line
        if ($aJotInfo[$CNF['FIELD_MESSAGE']] && !$bAttachmentRepost) {
            $sTruncatedMessage = strmaxtextlen(preg_replace('/<br\W*?\/>|\n/', " ", $aJotInfo[$CNF['FIELD_MESSAGE']]), $CNF['PARAM_MAX_JOT_NTFS_MESSAGE_LENGTH']);
            $sMessage = _t('_bx_messenger_txt_sample_comment_single', $sTruncatedMessage);
        }

        if ($bAttachmentFiles)
            $sMessage = _t('_bx_messenger_txt_sample_comment_file_single', $this->_oDb->getJotFiles($aJotInfo[$CNF['FIELD_MESSAGE_ID']], true));
        elseif ($bAttachmentGiphy)
            $sMessage = _t('_bx_messenger_txt_sample_comment_giphy_single');
        elseif ($bAttachmentReply)
            $sMessage = _t('_bx_messenger_txt_sample_comment_reply_single');
        elseif ($bAttachmentRepost)
            $sMessage = _t('_bx_messenger_txt_sample_comment_repost_single');

        $aResult = array(
            'entry_sample' => _t('_bx_messenger_message'),
            'entry_url' => $sEntryUrl,
            'entry_url_api' => $sEntryUrlApi,
            'entry_caption' => $sTitle,
            'entry_author' => $aEvent['object_owner_id'],
            'subentry_sample' => $sMessage,
            'lang_key' =>  $bAttachmentFiles || $bAttachmentGiphy
                ? '_bx_messenger_txt_subobject_added_single' : "_bx_messenger_txt_subobject_added_{$sType}"
        );

        $sSubject = _t("_bx_messenger_notification_subject_{$sType}", BxDolProfile::getInstanceMagic($aEvent['owner_id'])->getDisplayName());

        $sAlterBody = $sTruncatedMessage ? $sTruncatedMessage : _t('_bx_messenger_txt_sample_email_push', html2txt($sMessage));

        $aResult['lang_key'] = array(
            'site' => $aResult['lang_key'],
            'email' => $sAlterBody,
            'push' => $sAlterBody
        );

        $aResult['settings'] = array(
            'email' => array(
                'subject' => $sSubject
            ),
            'push' => array(
                'subject' => $sSubject
            )
        );

        bx_alert($this->_oConfig->getObject('alert'), 'before_message_notification', $aEvent['subobject_id'],
            $aEvent['object_owner_id'], ['data' => &$aResult,'talk' => $aLotInfo, 'message' => $aJotInfo]);


        return $aResult;
    }

    /**
     * Check if the user can read Lot messages
     * @param array $aDataEntry contains Lot details
     * @param boolean $isPerformAction used for compatibility with parent method
     * @param bool $iProfileId profile id of the member show has to get notification
     * @return int
     */

    public function serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction = false, $iProfileId = false){
        if (!$iProfileId)
            $iProfileId = $this->_iProfileId;

        $mixedResult = null;

        bx_alert('system', 'check_allowed_view', 0, 0, array(
            'module' => $this->getName(),
            'content_info' => $aDataEntry,
            'profile_id' => $iProfileId,
            'override_result' => &$mixedResult)
        );

        if($mixedResult !== null)
            return $mixedResult;

        $CNF = &$this->_oConfig->CNF;
        if (empty($aDataEntry))
            return CHECK_ACTION_RESULT_ALLOWED;

        return $this->_oDb->isParticipant($aDataEntry[$CNF['FIELD_ID']], $iProfileId, true) === TRUE
        || $aDataEntry[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PUBLIC
        || $aDataEntry[$CNF['FIELD_TYPE']] == BX_IM_TYPE_SETS ? CHECK_ACTION_RESULT_ALLOWED : CHECK_ACTION_RESULT_NOT_ALLOWED;
    }

    /**
     * Execute the list of actions which are required when message is sent
     * @param $iJotId
     * @return false
     */
    public function onSendJot($iJotId)
    {
        $aJotInfo = $this->_oDb->getJotById($iJotId);

        /**
         * @hooks
         * @hookdef hook-bx_messenger-send_jot 'bx_messenger', 'send_jot' - hook after a jot (message) was sent
         * - $unit_name - equals `bx_messenger`
         * - $action - equals `send_jot`
         * - $object_id - jot (message) id
         * - $sender_id - jot (message) author profile id
         * - $extra_params - array of additional params with the following array keys:
         *      - `jot_info` - [array] jot (message) info array as key&value pairs
         * @hook @ref hook-bx_messenger-send_jot
         */
        bx_alert($this->_oConfig->getObject('alert'), 'send_jot', $iJotId, $this->_iProfileId, [
            'jot_info' => $aJotInfo
        ]);

        $CNF = &$this->_oConfig->CNF;

        $aConvoInfo = $this->_oDb->getLotByJotId($iJotId, false);
        $iLotId = $aConvoInfo[$CNF['FIELD_ID']];
        if (!$iLotId)
            return false;

        $aPartList = $this->_oDb->getParticipantsList($iLotId, true, $this->_iProfileId);
        if ((int)$aConvoInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_BROADCAST) {
            $iJotCount = $this->_oDb->getJotsNumber($iLotId, 0);
            if ($iJotCount >= 2)
                $aPartList = $this->_oDb->getBroadcastParticipants($iLotId);
            else
                return false;
        }

        if (empty($aPartList))
            return false;

        foreach ($aPartList as &$iPart)
            /**
             * @hooks
             * @hookdef hook-bx_messenger-got_jot 'bx_messenger', 'got_jot' - hook after a lot (conversation) got a new jot (message)
             * - $unit_name - equals `bx_messenger`
             * - $action - equals `got_jot`
             * - $object_id - lot (conversation) id
             * - $sender_id - jot (message) author profile id
             * - $extra_params - array of additional params with the following array keys:
             *      - `recipient_id` - [int] recipient profile id
             *      - `subobject_id` - [int] jot (message) id
             *      - `subobject_info` - [array] jot (message) info array as key&value pairs
             * @hook @ref hook-bx_messenger-got_jot
             */
            bx_alert($this->_oConfig->getObject('alert'), 'got_jot', $iLotId, $this->_iProfileId, [
                'recipient_id' => $iPart, 
                'subobject_id' => $iJotId,
                'subobject_info' => $aJotInfo
            ]);

        if (!$this->_oDb->getIntervalJotsCount($iLotId, $iJotId))
            $this->sendMessageNotification($iLotId, $iJotId);
    }

    public function onDeleteJot($aJotInfo)
    {
        if (empty($aJotInfo))
            return false;

        $CNF = &$this->_oConfig->CNF;

        $iLotId = $aJotInfo[$CNF['FIELD_MESSAGE_FK']];
        $iJotId = $aJotInfo[$CNF['FIELD_MESSAGE_ID']];

        $iProfileId = $aJotInfo[$CNF['FIELD_MESSAGE_AUTHOR']];

        $sModule = $this->_oConfig->getObject('alert');

        bx_alert($sModule, 'delete_jot', $iJotId, $this->_iProfileId, ['author_id' => $iProfileId, 'lot_id' => $iLotId]);
        bx_alert($sModule, 'delete_jot_ntfs', $iLotId, $iProfileId, ['subobject_id' => $iJotId]);
        bx_alert($sModule, 'delete_mention_ntfs', $iLotId, $iProfileId, ['subobject_id' => $iJotId]);

        $this->_oDb->removeNotifications($iJotId);
    }

    public function onReactJot($iLotId, $iJotId, $iAuthor, $sAction = 'add')
    {
        bx_alert($this->_oConfig->getObject('alert'), "reaction_" . $sAction, $iJotId, $this->_iProfileId, array('author_id' => $iAuthor, 'lot_id' => $iLotId));
    }

    public function onUpdateJot($iLotId, $iJotId, $iProfileId = 0)
    {
        bx_alert($this->_oConfig->getObject('alert'), 'update_jot', $iJotId, $this->_iUserId, array('author_id' => $iProfileId, 'lot_id' => $iLotId));
    }

    public function onCreateLot($iLotId)
    {
        bx_alert($this->_oConfig->getObject('alert'), 'create_lot', $iLotId, $this->_iProfileId, $this->_oDb->getLotInfoById($iLotId));
    }

    public function onDeleteLot($aData)
    {
        if (empty($aData))
           return false;

        $CNF = &$this->_oConfig->CNF;
        $iAuthorId = $aData[$CNF['FIELD_AUTHOR']];
        $iLotId = $aData[$CNF['FIELD_ID']];

        bx_alert($this->_oConfig->getObject('alert'), 'delete_lot', $iLotId, $this->_iProfileId, ['author_id' => $iAuthorId]);
    }

    public function onAddNewParticipant($iLotId, $iParticipant, $iProfileId = 0)
    {
        bx_alert($this->_oConfig->getObject('alert'), 'add_part', $iParticipant, $this->_iUserId, array('lot_id' => $iLotId, 'author_id' => $iProfileId));
    }

    public function onRemoveParticipant($iLotId, $iParticipant, $iProfileId = 0)
    {
        bx_alert($this->_oConfig->getObject('alert'), 'remove_part', $iParticipant, $this->_iUserId, array('lot_id' => $iLotId, 'author_id' => $iProfileId));
    }

    /**
     * Checks if logged member can contact with the person
     * @param $iSender
     * @param $iRecipient
     * @return bool|mixed|true
     */
    public function onCheckContact($iSender, $iRecipient)
    {
        $CNF = &$this->_oConfig->CNF;

        $oSenderProfile = BxDolProfile::getInstance($iSender);
        $oRecipientProfile = BxDolProfile::getInstance($iRecipient);
        if ($CNF['CONTACT-JOIN-ORGANIZATION'] && $oSenderProfile && $oRecipientProfile){
            $aSenderProfileInfo = $oSenderProfile->getInfo();
            $aRecipientProfileInfo = $oRecipientProfile->getInfo();

            if ($aSenderProfileInfo['type'] === 'bx_organizations' || $aRecipientProfileInfo['type'] === 'bx_organizations') {
                if (BxDolConnection::getObjectInstance("bx_organizations_fans")->isConnected($iSender, $iRecipient, true) || $aSenderProfileInfo['type'] === 'bx_organizations')
                    return true;

                return BxDolConnection::getObjectInstance("sys_profiles_subscriptions")->isConnected($iSender, $iRecipient);
            }
        }

       if ($CNF['DISABLE-PROFILE-PRIVACY'])
            return true;

       if(method_exists('BxDolProfile', 'checkAllowedProfileContact')) {
        $mixedResult = BxDolProfile::getInstance($iSender)->checkAllowedProfileContact($iRecipient);
            if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED)
                return false;
       }

        $bCanContact = true;
        bx_alert($this->_oConfig->getObject('alert'), 'check_contact', 0, false, array('can_contact' => &$bCanContact, 'sender' => $iSender, 'recipient' => $iRecipient, 'where' => $this->_oConfig->getName()));
        return $bCanContact;
    }

    /**
     * Check if the selected profile or any groups module's item is available to send messages for logged member
     * @param $mixedObject integer Profile id
     * @return bool|int|mixed|true
     */
    public function serviceIsContactAllowed($mixedObject)
    {
        if (!$this->_iProfileId)
            return false;

        $oProfile = BxDolProfile::getInstance($mixedObject);
        $sModule = $oProfile->getModule();

        if (BxDolRequest::serviceExists($sModule, 'act_as_profile') && BxDolService::call($sModule, 'act_as_profile'))
            return $this->onCheckContact($this->_iProfileId, (int)$mixedObject);

        if (BxDolRequest::serviceExists($sModule, 'is_group_profile') && BxDolService::call($sModule, 'is_group_profile')) {
            $aOwnerInfo = BxDolService::call($sModule, 'get_info', array($oProfile->getContentId(), false));
            if(empty($aOwnerInfo) || !is_array($aOwnerInfo))
                return CHECK_ACTION_RESULT_ALLOWED;

            return BxDolService::call($sModule, 'check_allowed_view_for_profile', array($aOwnerInfo)) === CHECK_ACTION_RESULT_ALLOWED;
        }

        return true;
    }

    /**
     * Checks if video conference is available for member
     * @param $mixedObject integer profile id
     * @return bool
     */
    public function serviceIsVideoConferenceAllowed($mixedObject)
    {
       if (!$this->_iProfileId || !$this->onCheckContact($this->_iProfileId, (int)$mixedObject))
            return false;

       $CNF = &$this->_oConfig->CNF;
       if (isset($_SERVER['REQUEST_URI'])) {
            $sRoom = $this->_oConfig->getRoomId($_SERVER['REQUEST_URI']);
            $aRoom = $this->_oDb->getPublicVideoRoom($sRoom);
            $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_IM_VC, $this->_iProfileId);
            if ((empty($aRoom) || !(int)$aRoom[$CNF['FPJVC_STATUS']]) && $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_IM_VC, $this->_iProfileId) !== true)
                return false;

            if (!empty($aRoom) && (int)$aRoom[$CNF['FPJVC_STATUS']] && (int)$mixedObject !== $this->_iProfileId && $this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_IM_VC, $this->_iProfileId) !== true)
                return false;
       } else
           return false;

        $this->_oTemplate->addCss(array('video-conference.css'));
        $this->_oTemplate->addJs('utils.js');
        return true;
    }

    /**
     * Sends immediate push notifications when Profile conference has been started
     * @param $iObjectId
     * @param $iSenderId
     * @param $iReceiverId
     * @param string $sType
     * @return false
     */
    private function sendProfilePush($iObjectId, $iSenderId, $iReceiverId, $sType = 'bx_persons'){
        $oLanguage = BxDolStudioLanguagesUtils::getInstance();
        $sLanguage = $oLanguage->getCurrentLangName(false);

        $oObject = BxDolProfile::getInstance($iObjectId);
        if (!$oObject)
            return false;

        $oReceiver = BxDolProfile::getInstance($iReceiverId);
        if (!$oReceiver)
            return false;

        $oSender = BxDolProfile::getInstance($iSenderId);
        if (!$oSender)
            return false;

        $sMessage = _t("_bx_messenger_public_vc_{$sType}_message", $sType === 'bx_persons' ? $oSender->getDisplayName() : $oObject->getDisplayName());

        $aContent = array(
          'en' => $sMessage,
        );

        if (!isset($aContent[$sLanguage]))
            $aContent[$sLanguage] = $sMessage;

        $aHeadings = array( $sLanguage => _t("_bx_messenger_push_vc_{$sType}_message_title"));

        $aInfo = array(
            'contents' => $aContent,
            'headings' => $aHeadings,
            'url' => $oObject->getUrl()
        );

        BxDolPush::getObjectInstance()->send($iReceiverId, array_merge($aInfo, array(
                'icon' => $sType === 'bx_persons' ?
                                $oSender->getThumb() :
                                $oObject->getThumb())),
            true);
    }

    public function actionGetVideoConferenceForm($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        header('Content-type: text/html; charset=utf-8');

        $sContent = '';
        if (!$oProfile)
            $sContent =  MsgBox(_t('_bx_messenger_profile_not_found'));
        else
        {
            $aInfo = $oProfile->getInfo();
            if ($aInfo['type'] == 'bx_organizations') {
                $aFans = BxDolConnection::getObjectInstance("{$aInfo['type']}_fans")->getConnectedContent($iProfileId, true);
                if (!empty($aFans)){
                    foreach($aFans as &$iPart)
                        $this->sendProfilePush($iProfileId, $this->_iProfileId, $iPart, $aInfo['type']);
                }
            } else if ($this->_iProfileId != $iProfileId)
                $this->sendProfilePush($iProfileId, $this->_iProfileId, $iProfileId, $aInfo['type']);

            $CNF = &$this->_oConfig->CNF;
            $sIdent = $this->getReferrerPageIdent();
            $sRoom = $this->_oConfig->getRoomId($sIdent);
            $aRoom = $this->_oDb->getPublicVideoRoom($sRoom);
            if (empty($aRoom) || !(int)$aRoom[$CNF['FPJVC_STATUS']]){
                $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_IM_VC, $this->_iProfileId);
                if ($mixedResult !== true)
                    $sContent = $mixedResult;
            } else
                if (!empty($aRoom) && (int)$aRoom[$CNF['FPJVC_STATUS']] && (int)$iProfileId !== $this->_iProfileId) {
                    $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_IM_VC, $this->_iProfileId);
                    if ($mixedResult !== true)
                        $sContent = $mixedResult;
                }
        }

        echo $sContent ? $sContent : $this->_oTemplate->getPublicJitsi($this->_iProfileId, $sIdent, $oProfile->getDisplayName(), 'bx-messenger-vc-call');
        exit;
    }

    private function getReferrerPageIdent(){
        $sPath = '';
        if (isset($_SERVER['HTTP_REFERER'])){
            $aPath = parse_url($_SERVER['HTTP_REFERER']);
            if (isset($aPath['path']))
                $sPath = $aPath['path'];

            if (isset($aPath['query']))
                $sPath .= '?' . $aPath['query'];

        }

        return $sPath;
    }

    public function actionUpdatePublicJitsiVideoConference(){
        $sRoom = bx_get('room');
        $sAction = bx_get('action');
        if (!$sRoom || !$this->_iProfileId || !$sAction)
            return false;

        if ($sAction == BX_JOT_PUBLIC_JITSI_JOIN)
            return $this->_oDb->createPublicVideoRoom($sRoom, $this->_iProfileId);

        return $this->_oDb->updatePublicVideoRoom($sRoom, $this->_iProfileId, $sAction);
    }

    public function serviceGetLiveUpdates($aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        $iCountNew = $this->serviceGetUpdatedLotsNum();
        if ($iCountNew == $iCount)
            return false;

        return array(
            'count' => $iCountNew,
            'method' => 'bx_menu_show_live_update(oData)',
            'data' => array(
                'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', array(
                    'content' => '{count}'
                )),
                'mi_parent' => $aMenuItemParent,
                'mi_child' => $aMenuItemChild
            ),
        );
    }

    public function serviceGetLiveVcUpdates($iCount = 0)
    {
        $iCount = 0;
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest')
        {
            $sPageUrl = $this->getReferrerPageIdent();
           /* ADD ABILITY TO call members when they on any page of the site and have incoming call */
           if (preg_match('/.*page\/(.*)\?id=(\d+).*/', $sPageUrl,$aParams)) {
               if (!empty($aParams) && isset($aParams[1]) && isset($aParams[2])){
                   $iPageOwner = $this->_oDb->findThePageOwner(array('i' => $aParams[1], 'id' => $aParams[2]));
                   //if ($this->_iProfileId == $iPageOwner)
               }
           }
           $aParticipants = $this->_oDb->getPublicRoomParticipants($this->_oConfig->getRoomId($sPageUrl));
           $iCount = count($aParticipants);
        }

        return array(
            'count' => $iCount,
            'method' => 'oMUtils.addBubble(oData)',
            'data' => array(
                'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', array(
                    'content' => '{count}'
                )),
                'selector' => '.bx-menu-item-public-vc-messenger a.bx-btn'
            ),
        );
    }

    /**
     * @param int $iObjectId item's id
     * @param strign $sType name of te module
     * @param int $iProfileId comments' author, if this param is empty, then get all comments
     * @param int $iStart get comments from position
     * @param int $iPerPage number of the comments to get at once
     * @return array comments list
     */
    public function serviceGetLiveComments($iObjectId, $sType, $iProfileId = 0, $iStart = 0, $iPerPage = 0)
    {
        $aComments = $this->_oDb->getLiveComments($iObjectId, $sType, $iProfileId, $iStart, $iPerPage);
        if (!(int)$aComments['total'])
            return array(
                            'items' => array(),
                            'id' => $iObjectId,
                            'type' => $sType,
                            'total' => 0
                        );

        $aResult = array();
        foreach ($aComments['result'] as $iKey => $aValue) {
            $oProfile = $this->_oTemplate->getObjectUser($aValue[$this->_oConfig->CNF['FIELD_LCMTS_AUTHOR']]);
            $aResult[$aValue[$this->_oConfig->CNF['FIELD_LCMTS_ID']]] = array(
                'text' => $aValue[$this->_oConfig->CNF['FIELD_LCMTS_TEXT']],
                'author' => array(
                    'id' => $aValue[$this->_oConfig->CNF['FIELD_LCMTS_AUTHOR']],
                    'name' => $oProfile->getDisplayName(),
                    'icon' => $oProfile->getAvatar(),
                    'url' => $oProfile->getUrl()
                ),
                'id' => $aValue[$this->_oConfig->CNF['FIELD_LCMTS_ID']],
                'date' => $aValue[$this->_oConfig->CNF['FIELD_LCMTS_DATE']],
            );
        }

        return array('items' => $aResult, 'id' => $iObjectId, 'type' => $sType, 'total' => (int)$aComments['total']);
    }

    /**
     * @param string $sText text of the comment
     * @param int $iObjectId item's id
     * @param string $sType $sType name of te module
     * @param int $iProfileId comment's author
     * @param int $iDate client's time when message is sent
     * @return int added object's id
     */
    public function servicePostLiveComments($sText, $iObjectId, $sType, $iProfileId, $iDate = 0)
    {
        if (!$sText || !$iObjectId || !$sType || !$iProfileId)
            return 0;

        $aResult = array('code' => 1);
        if ($iId = $this->_oDb->addLiveComment($sText, $iObjectId, $sType, $iProfileId, $iDate))
            $aResult = array('code' => 0, 'id' => $iId, 'date' => $iDate ? $iDate : time());

        return $aResult;
    }

    public function serviceRemoveLiveComment($iObjectId, $iProfileId)
    {
        if (!$iObjectId || !$iProfileId)
            return false;

        $aResult = array('code' => 0, 'id' => $iObjectId);
        return $this->_oDb->removeLiveComment($iObjectId, $iProfileId) ? $aResult : array('code' => 1);
    }

    public function actionGetFilesList($iLotId)
    {
        if (!$iLotId || !$this->_iProfileId || !$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return false;

        $aFiles = $this->_oDb->getLotFiles($iLotId);
        if (empty($aFiles))
            return array();

        $aResult = array();
        $CNF = &$this->_oConfig->CNF;
        foreach ($aFiles as $iKey => $aValue)
            $aResult[$aValue[$CNF['FIELD_ST_ID']]] = $this->_oTemplate->getFileContent($aValue);

        return $aResult;
    }

    public function actionGetLotTabs($iLotId, $sAction)
    {
        if (!$iLotId || !$this->_iUserId || !$this->_oDb->isParticipant($iLotId, $this->_iUserId))
            return echoJson(array('code' => 1, 'msg' => _t('_bx_messenger_no_permissions')));

        $sHTML = '';
        switch ($sAction) {
            case 'files':
                $aFiles = $this->actionGetFilesList($iLotId);
                if (empty($aFiles))
                    $sHTML = MsgBox(_t('_bx_messenger_txt_msg_no_results'));
                else
                    $sHTML = $this->_oTemplate->parseHtmlByName('files-feeds.html', array('bx_repeat:files' => $aFiles));
                break;
        }

        header('Content-type: text/html; charset=utf-8');
        echo $sHTML;
        exit;
    }

    /************ REACT Jot Integration *************************************/

    public function serviceGetLotsList($iProfileId)
    {
        if (!$iProfileId)
            return '';

        $aLots = $this->_oDb->getMyLots($iProfileId);
        if (empty($aLots))
            return array();

        $aLotsList = array();
        foreach ($aLots as &$aLot) {
            $aParticipantsList = $this->_oDb->getParticipantsList($aLot[$this->_oConfig->CNF['FIELD_ID']], true, $iProfileId);

            $iParticipantsCount = count($aParticipantsList);
            $aParticipantsList = $iParticipantsCount ? array_slice($aParticipantsList, 0, $this->_oConfig->CNF['PARAM_ICONS_NUMBER']) : array($iProfileId);

            $aNickNames = array();
            foreach ($aParticipantsList as $iParticipant) {
                $oProfile = $this->_oTemplate->getObjectUser($iParticipant);
                if ($oProfile) {
                    $aNickNames[] = array(
                        'name' => $oProfile->getDisplayName(),
                        'url' => $oProfile->getUrl(),
                        'thumb' => $oProfile->getThumb()
                    );
                }
            }

            if (!empty($aLot[$this->_oConfig->CNF['FIELD_TITLE']]))
                $sTitle = _t($aLot[$this->_oConfig->CNF['FIELD_TITLE']]);
            else {
                    $aTitle = array();
                    $aTmpNickNames = $iParticipantsCount > 3 ? array_slice($aNickNames, 0, $this->_oConfig->CNF['PARAM_ICONS_NUMBER']) : $aNickNames;
                    foreach ($aTmpNickNames as &$aValue)
                        $aTitle[] = $aValue['name'];

                    $sTitle = implode(', ', $aTitle);
                }


            $sStatus = '';
            if ($iParticipantsCount == 1 && $oProfile && empty($aLot[$this->_oConfig->CNF['FIELD_TITLE']]))
                $sStatus = (int)(method_exists($oProfile, 'isOnline') ? $oProfile->isOnline() : false);
            else
                $sStatus = $iParticipantsCount;

            $aLatestJots = $this->_oDb->getLatestJot($aLot[$this->_oConfig->CNF['FIELD_ID']]);
            $iTime = $aLot[$this->_oConfig->CNF['FIELD_ADDED']];

            $oSender = $sSender = $sMessage = '';
            if (!empty($aLatestJots)) {
                if (isset($aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE']])) {
                    $sMessage = $aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE']];
                    if ($aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_AT_TYPE']] == BX_ATT_TYPE_REPOST) {
                        $sMessage = $this->_oConfig->cleanRepostLinks($sMessage, $aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_AT']]);
                        $sMessage = $sMessage ? $sMessage : _t('_bx_messenger_repost_message');
                    }

                    $sMessage = BxTemplFunctions::getInstance()->getStringWithLimitedLength($sMessage, $this->_oConfig->CNF['MAX_PREV_JOTS_SYMBOLS']);
                }

                if (!$sMessage && $aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_AT_TYPE']] == BX_ATT_TYPE_FILES)
                    $sMessage = _t('_bx_messenger_attached_files_message', $this->_oDb->getJotFiles($aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_ID']], true));

                $sSender = '';
                if ($oSender = $this->_oTemplate->getObjectUser($aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_AUTHOR']]))
                    $sSender = $oSender->id() == $iProfileId ? _t('_bx_messenger_you_username_title') : $oSender->getDisplayName();

                $iTime = $aLatestJots[$this->_oConfig->CNF['FIELD_MESSAGE_ADDED']];
            }

            $aLotsList[] = array(
                'participants_count' => $iParticipantsCount,
                'participants_list' => $aNickNames,
                'title' => $sTitle,
                'lot_id' => $aLot[$this->_oConfig->CNF['FIELD_ID']],
                'status' => $sStatus,
                'latest_jot_message' => $sMessage,
                'latest_jot_message_author' => $sSender,
                'latest_jot_message_date' => $iTime,
                'latest_jot_message_author_thumb' => $oSender ? $oSender->getThumb() : '',
            );
        }

        return $aLotsList;
    }

    public function servicePerformConnAction($iInitiator, $iContent, $sAction = 'add', $sConnectionType = 'follow')
    {
        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

        if (!$iInitiator || !$iContent)
            return array();


        $oConnections = BxDolConnection::getObjectInstance($sConnectionType === 'follow' ? 'sys_profiles_subscriptions' : 'sys_profiles_friends');
        $sMethod = "{$sAction}Connection";
        if (empty($oConnections) || !method_exists($oConnections, $sMethod))
            return array();

        return array(
            'result' => (int)$oConnections->$sMethod($iInitiator, $iContent),
            'content_id' => (int)$iContent,
            'action' => $sAction
        );
    }

    public function serviceProfileConnections($sType = 'friends', $iContentId = 0, $iStart = 0, $iPerPage = 10, $iMutual = false)
    {
        $iProfileId = $iContentId ? $iContentId : $this->_iUserId;

        if (!$iProfileId)
            return array();

        $aMembers = array();
        $oFriends = BxDolConnection::getObjectInstance('sys_profiles_friends');
        $oFollowers = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');

        switch ($sType) {
            case 'friends':
                if (!$oFriends)
                    return array();

                $aMembers = $oFriends->getConnectedContent($iProfileId, $iMutual, $iStart, $iPerPage);
                break;
            case 'connections':
                if (!$oFollowers)
                    return array();

                $aMembers = $oFollowers->getConnectedContent($iProfileId, $iMutual, $iStart, $iPerPage);

                break;
            case 'recent':
            case 'active':
            case 'online':
            case 'recommended':
            case 'top':
                if (BxDolRequest::serviceExists('bx_persons', 'get_members')) {
                    $aPersons = BxDolService::call('bx_persons', 'get_members', array($sType, $iStart, $iPerPage));
                    foreach ($aPersons as &$aPerson)
                        $aMembers[$aPerson['author']] = $aPerson;
                }
                break;
        }

        if (empty($aMembers))
            return $aMembers;

        $aRet = array();
        foreach ($aMembers as $iId => $aInfo) {
            if (($oProfile = BxDolProfile::getInstance($iId))) {
                $oAccount = $oProfile->getAccountObject();
                $aRet[$iId] = array(
                    'name' => $oProfile->getDisplayName(),
                    'profile_display_name' => $oProfile->getDisplayName(),
                    'email' => $oAccount->getEmail(),
                    'id' => $iId,
                    'url' => $oProfile->getUrl(),
                    'info' => $oProfile->getInfo(),
                    'thumb' => $oProfile->getThumb(),
                    'picture' => $oProfile->getPicture(),
                    'avatar' => $oProfile->getAvatar(),
                    'is_online' => $oProfile->isOnline(),
                    'cover' => $oProfile->getUnitCover(),
                    'status' => $oProfile->getStatus(),
                    'followers' => (int)$oFollowers->getConnectedInitiatorsCount($iId),
                    'friends' => (int)$oFriends->getConnectedContentCount($iId, true),
                    'is_friend' => (int)$oFriends->isConnected($iProfileId, $iId, true),
                    'is_follow' => (int)$oFollowers->isConnected($iProfileId, $iId)
                );
            }
        }

        return $aRet;
    }

    public function serviceGetModulesList()
    {
        $aResult = array();
        if (!$this->isLogged())
            return $aResult;

        $aModules = $this->_oDb->getAllCmtsModule();
        foreach ($aModules as $sKey => $aModule) {
            if (!$aModule['icon']) {
                $aResult[$sKey] = array(
                    'icon' => 'world',
                    'icon_color' => 'green'
                );
                continue;
            }
            preg_match('/([a-z]+)(?:-[a-z]+)?\s+col-([a-z]+)/', $aModule['icon'], $aMatches);
            $aResult[$sKey] = array(
                'icon' => $aMatches[1],
                'icon_color' => $aMatches[2]
            );
        }

        return $aResult;
    }

    public function serviceSwitchProfile($iSwitchToProfileId)
    {
        $aResult = array('code' => 1);

        if ($iSwitchToProfileId) {
            $oProfile = BxDolProfile::getInstance($iSwitchToProfileId);

            if ($oProfile && BxDolService::call($oProfile->getModule(), 'act_as_profile')) {
                $iViewerAccountId = getLoggedId();
                $iSwitchToAccountId = $oProfile->getAccountId();
                $bCanSwitch = $iSwitchToAccountId == $iViewerAccountId;
                bx_alert('account', 'check_switch_context', $iSwitchToAccountId, bx_get_logged_profile_id(), array('switch_to_profile' => $iSwitchToProfileId, 'viewer_account' => $iViewerAccountId, 'override_result' => &$bCanSwitch));

                if ($bCanSwitch) {
                    $oAccount = BxDolAccount::getInstance();
                    if ($oAccount->updateProfileContext($iSwitchToProfileId))
                        $aResult = array('code' => 0, 'msg' => _t('_sys_txt_account_profile_context_changed_success', $oProfile->getDisplayName()));
                }
            }
        }

        return $aResult;
    }

    public function serviceGetLotInfo($iProfileId, $iLotId, $iJotsLimit = 0, $iStart = BX_IM_EMPTY, $sType = BX_JOT_TYPE_NEW)
    {
        $aResult = array('code' => 1);
        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if (!$iLotId || empty($aLotInfo))
            return $aResult;

        if ($iProfileId !== $this->_iUserId || !$this->_oDb->isParticipant($iLotId, $this->_iUserId))
            return array('code' => 1, _t('_bx_messenger_not_participant'));

        $CNF = $this->_oConfig->CNF;
        $iJotsLimit = $iJotsLimit ? $iJotsLimit : $CNF['MAX_JOTS_LOAD_HISTORY'];
        $aJotsList = $this->_oDb->getJotsByLotId(['lot' => $iLotId, 'start' => $iStart, 'mode' => $sType, 'limit' => $iJotsLimit]);

        $aJots = array();
        foreach ($aJotsList as &$aJot) {
            $aAuthor = BxDolProfile::getInstance($aJot[$CNF['FIELD_MESSAGE_AUTHOR']]);
            $aAttachments = $this->_oTemplate->getAttachment($aJot);
            $aJots[] = array_merge($aJot, array(
                'thumb' => $aAuthor->getThumb(),
                'name' => $aAuthor->getDisplayName(),
                'files' => isset($aAttachments[BX_ATT_GROUPS_ATTACH]) ? $aAttachments[BX_ATT_GROUPS_ATTACH] : ''
            ));
        }

        return array('lot_id' => $iLotId, 'jots' => $aJots);
    }

    public function prepareMessageToDb($sMessage)
    {
        if (!$sMessage)
            return '';

        $aReplacements = [
            '/\<p>\<br[^>]*>\<\/p>/i' => '<br/>',
            '/\<p>/i' => '',
            '/\<\/p>/i' => '<br/>',
            '/<pre.*>/i' => '<pre>'
        ];

        $sNewMessage = preg_replace(array_keys($aReplacements), $aReplacements, $sMessage);
        return preg_replace('/(?:(?:\s*)?<br\/>)+$/', '', $sNewMessage);
    }

    function actionGetGiphy(){
        if (!$this->isLogged())
            return '';

        $aContent = $this->_oTemplate->getGiphyItems(bx_get('action'), urlencode(bx_get('filter')), (float)bx_get('height'), (int)bx_get('start'));
        if (isset($aContent['content']) && $aContent['content'])
            return echoJson(array('code' => 0, 'html' => $aContent['content'], 'total' => isset($aContent['pagination']) ? $aContent['pagination']['total_count'] : (int)bx_get('start')));

        return echoJson(array('code' => 1, 'message' => MsgBox(_t('_bx_messenger_giphy_gifs_nothing_found'))));
    }

    function serviceGetTalksList($aOptions = []){
        $mixedGroup = isset($aOptions['group']) ? $aOptions['group'] : '';
        $iId = isset($aOptions['id']) ? (int)$aOptions['id'] : 0;
        $iLotId = isset($aOptions['lot']) ? (int)$aOptions['lot'] : 0;
        $aParams = ['start' => isset($aOptions['count']) ? (int)$aOptions['count'] : 0, 'lot' => $iLotId];

        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $iLotId ? $this->_oDb->getLotInfoById($iLotId) : [];
        if (!empty($aLotInfo) && ($aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE && !$this->_oDb->isParticipant($aLotInfo[$CNF['FIELD_ID']], $this->_iProfileId)))
            return ['code' => 1, 'message' => _t('_bx_messenger_not_participant')];

        $sTitle = _t('_bx_messenger_nav_menu_item_title_' . ( $mixedGroup ? $mixedGroup : 'inbox' ));
        $aLotsList = [];
		switch($mixedGroup){
            case BX_MSG_TALK_TYPE_THREADS:
				$aParams['threads'] = true;
				$aLotsList = $this->_oDb->getMyLots($this->_iProfileId, $aParams);
				break;
			case 'public':
				$aParams['type'] = array(BX_IM_TYPE_SETS, BX_IM_TYPE_PUBLIC);
				$aLotsList = $this->_oDb->getMyLots($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_FILES:
                break;
            case BX_MSG_TALK_TYPE_MR:
                $aLotsList = $this->_oDb->getReactionsMentionsLots($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_REPLIES:
                $aLotsList = $this->_oDb->getLotsWithReplies($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_SAVED:
                $aLotsList = $this->_oDb->getSavedJotInLots($this->_iProfileId, $aParams);
                break;
            case BX_MSG_TALK_TYPE_GROUPS:
                $aParams['group'] = $iId;
                $aLotsList = $this->_oDb->getMyLots($this->_iProfileId, $aParams);
                if (empty($aLotsList))
                    break;

                $aGroupInfo = $this->_oDb->getGroupById($iId);
                $sTitle = !empty($aGroupInfo) ? $aGroupInfo[$CNF['FMG_NAME']] : current($aLotsList)['title'];
                break;
            case BX_MSG_TALK_TYPE_DIRECT:
                $aLotsList = $this->_oDb->getMyLots($this->_iProfileId, array_merge($aParams, ['type' => BX_IM_TYPE_PRIVATE]));
                break;
            default:
                $aLotsList = $this->_oDb->getMyLots($this->_iProfileId, array_merge($aParams, ['inbox' => true]));
        }

        $bNext = false;
        if (isset($aParams['per_page']) && count($aLotsList) === (int)$aParams['per_page'])
            $bNext = true;
        else if (count($aLotsList) === $CNF['MAX_LOTS_NUMBER'])
            $bNext = true;

        return ['title' => $sTitle, 'list' => $aLotsList, 'code' => 0, 'next' => $bNext];
    }
    
    function actionGetTalksList(){
        if (!$this->isLogged())
            return echoJson(['code' => 1, 'reload' => 1]);

        $aParams = ['group' => bx_get('group'), 'id' => (int)bx_get('id'), 'count' => (int)bx_get('count'), 'lot' => (int)bx_get('lot')];

        $iExcludeConvo = (int)bx_get('exclude_convo');
        $aData = $this->serviceGetTalksList($aParams);
        if (isset($aData['code']) && (int)$aData['code'])
            return echoJson(['code' => 1, 'msg' => $aData['message']]);

        $sTitle = isset($aData['title']) ? $aData['title'] : '';
        $aLotsList = isset($aData['list']) ? $aData['list'] : [];

        if (!empty($aLotsList)) {
           if ($iExcludeConvo) {
               $mixedKey = array_search($iExcludeConvo, array_column($aLotsList, $this->_oConfig->CNF['FIELD_ID']));
               if ($mixedKey !== false)
                   unset($aLotsList[$mixedKey]);
           }

            $sContent = $this->_oTemplate->getLotsPreview($this->_iProfileId, $aLotsList);
            return echoJson(array(
                'code' => 0,
                'html' => $sContent,
                'title' => _t($sTitle)
            ));
        }

        return echoJson(['code' => 1, 'html' => MsgBox(_t('_bx_messenger_txt_msg_no_results')), 'title' => _t($sTitle)]);
    }

    public function actionGetTopMenuItems(){
        $CNF = &$this->_oConfig->CNF;

        $oLeftMainMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_NAV_LEFT_MENU']);
        $oLeftGroupsMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_GROUPS_MENU']);
        return ['top' => $oLeftMainMenu->getMenuItems(), 'groups' => $oLeftGroupsMenu->getMenuItems()];
    }

    public function serviceGetLotStat($mixedLotId = ''){
        if (is_numeric($mixedLotId) && (int)$mixedLotId)
            $aLotInfo = $this->_oDb->getLotInfoById($mixedLotId);
        else
        {
            $sUrl = $mixedLotId ? $this->getPreparedUrl($mixedLotId) : $this->_oConfig->getPageIdent($mixedLotId);
            $aLotInfo = $this->_oDb->getLotByUrl($sUrl);
        }

        if (empty($aLotInfo))
            return $aLotInfo;

        $CNF = &$this -> _oConfig -> CNF;
        $aMessages = $this->_oDb->getLotJotsCount($aLotInfo[$CNF['FIELD_ID']]);

        return array(
          'title' => $aLotInfo[$CNF['FIELD_TITLE']],
          'created' => $aLotInfo[$CNF['FIELD_ADDED']],
          'participants' => $aLotInfo[$CNF['FIELD_PARTICIPANTS']] ? explode(',', $aLotInfo[$CNF['FIELD_PARTICIPANTS']]) : array(),
          'author' => $aLotInfo[$CNF['FIELD_AUTHOR']],
          'url' => $aLotInfo[$CNF['FIELD_URL']],
          'type' => $aLotInfo[$CNF['FIELD_TYPE']],
          'messages' => array_merge($aMessages, array(
              'total' => array_sum($aMessages)
          ))
        );
    }	 
		
	public function serviceGetUnreadLots($iProfileId){
        if (!$iProfileId || !($oProfile = BxDolProfile::getInstance($iProfileId)))
			return array();		
				
		$aLots = $this->_oDb->getLotsWithUnreadMessages($iProfileId);
		$aLotsInfo = array();
		foreach($aLots as $iLotId => $iCount){
			$aLotsInfo[$iLotId] = array(
				'count' => $iCount,
				'participants' => $this->_oDb->getParticipantsList($iLotId),
				'new_messages' => $this->_oDb->getUnreadMessages($iProfileId, $iLotId)
			);
		}	
		
        return $aLotsInfo;
    }

    public function actionGetJitsiConferenceForm($iLotId = 0)
    {
        if (!$this->_iProfileId){
            echo MsgBox(_t('_bx_messenger_jitsi_err_can_join_conference'));
            exit;
        }

        header('Content-type: text/html; charset=utf-8');

        if (!$iLotId) {
            $sUrl = bx_get('url');
            $sTitle = bx_get('title');
            $aLot = $this -> _oDb -> getLotByUrl($sUrl);
            if (empty($aLot)) {
                $this->_oDb->createNewLot($this->_iProfileId, array('title' => $sTitle, 'type' => BX_IM_TYPE_PRIVATE, 'url' => $sUrl));
                $this->onCreateLot($iLotId);
            }
            else
                $iLotId = $aLot[$this->_oConfig->CNF['FIELD_ID']];
        }

        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        $bIsParticipant = $this->_oDb->isParticipant($iLotId, $this->_iProfileId);
        if (!$bIsParticipant) {
            if ($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE) {
                echo MsgBox(_t('_bx_messenger_jitsi_err_can_join_conference'));
                exit;
            }

            if (!empty($aLotInfo))
                $this->_oDb->addMemberToParticipantsList($iLotId, $this->_iProfileId);
        }

        $aParams['audio_only'] = bx_get('startAudioOnly') ? 1 : 0;
        $mixedAuthor = $this->_oDb->getActiveJVCItem($iLotId, $CNF['FJVCT_AUTHOR_ID']);
        if (($mixedAuthor === false || ((int)$mixedAuthor == $this->_iProfileId)) && $this->_oConfig->isJitsiAllowed($aLotInfo[$CNF['FIELD_TYPE']])) {
            echo $this->_oTemplate->getJitsi($iLotId, $this->_iProfileId, $aParams);
            exit;
        }

        $sMessage = _t('_bx_messenger_jitsi_err_cant_type_use');
        if ($mixedAuthor !== false && ((int)$mixedAuthor != $this->_iProfileId) && ($mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_TALK_VC))) {
           if ($mixedResult !== true)
             $sMessage = $mixedResult;
           else
           {
             echo $this->_oTemplate->getJitsi($iLotId, $this->_iProfileId, $aParams);
             exit;
           }
        }

        echo MsgBox($sMessage, 2.5);
        exit;
    }

    public function onCreateVC($iLotId)
    {
        bx_alert($this->_oConfig->getObject('alert'), 'create_vc', $iLotId, $this->_iUserId);
    }

    public function onJoinVC($iLotId)
    {
        $aItem = $this->_oDb->getActiveJVCItem($iLotId);
        bx_alert($this->_oConfig->getObject('alert'), 'join_vc', $iLotId, $this->_iUserId, array('object_author_id' => $aItem[$this->_oConfig->CNF['FJVCT_AUTHOR_ID']]));
    }

    public function actionCreateJitsiVideoConference(){
        $CNF = $this->_oConfig->CNF;
        $iLotId = (int)bx_get('lot_id');
        if (!$iLotId)
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_found')));

        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_jitsi_err_can_join_conference')));

        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if (empty($aLotInfo))
            return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_not_found')));

        $bIsParticipant = $this->_oDb->isParticipant($iLotId, $this->_iProfileId);
        if (!$bIsParticipant){
            if ($aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
                return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_jitsi_err_can_join_conference')));

            $this->_oDb->addMemberToParticipantsList($iLotId, $this->_iProfileId);
        }

        $mixedAuthor = $this->_oDb->getActiveJVCItem($iLotId, $CNF['FJVCT_AUTHOR_ID']);
        if ($mixedAuthor != $this->_iProfileId && ($mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_TALK_VC))) {
            if  ($mixedResult !== true)
                    return echoJson(array('code' => 1, 'message' => $mixedResult));
        }

        $aJVC = $this->_oDb->getJVC($iLotId);
        $iParticipants = count($this->_oDb->getParticipantsList($iLotId));
        $aResult = array('code' => 0, 'parts' => $iParticipants);
        if (!empty($aJVC) && (int)$aJVC[$CNF['FJVC_ACTIVE']]) {
            if ($this->_oDb->joinToActiveJVC($iLotId, $this->_iProfileId)) {
                $aResult['jot_id'] = $this->_oDb->getJotIdByJitsiItem((int)$aJVC[$CNF['FJVC_ACTIVE']]);
                $aResult[$CNF['FJVC_ROOM']] = $aJVC[$CNF['FJVC_ROOM']];
                $this->onJoinVC($iLotId);
                return echoJson($aResult);
            }
            else
               $this->_oDb->closeJVC($iLotId);
        }

        $this->onCreateVC($iLotId);
        return echoJson(
                        array_merge(
                            array('new' => 1),
                            $aResult,
                            $this->_oDb->createJVC($iLotId, $this->_iProfileId)
                        ));
    }

    public function actionStopJvc(){
        $iLotId = (int)bx_get('lot_id');
        if (!$iLotId)
            return echoJson(array('code' => 1, 'msg' => _t('_bx_messenger_not_found')));

        if (!$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return echoJson(array('code' => 1));

        if ($this->_oDb->stopJVC($iLotId, $this->_iProfileId))
            return echoJson(array('code' => 0));

        return echoJson(array('code' => 1));
    }

    public function actionLeaveJvc(){
        if (!isLogged())
            return '';

        $iLotId = (int)bx_get('lot_id');
        $this->_oDb->leaveJVC($iLotId, $this->_iProfileId);
    }

    function actionGetTalkFiles(){
        $iLotId = (int)bx_get('lot_id');
        $iNumber = (int)bx_get('number');

        $CNF = $this->_oConfig->CNF;
        if (!$iLotId)
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_found'))));

        $aLotInfo = $this->_oDb->getLotInfoById($iLotId);
        if (empty($aLotInfo) || ($aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE && !$this->_oDb->isParticipant($aLotInfo[$CNF['FIELD_ID']], $this->_iProfileId)))
            return echoJson(array('code' => 1, 'message' => '_bx_messenger_not_participant'));

        if (!($iTotal = $this->_oDb->getLotFilesCount($iLotId)))
            return echoJson(array('code' => 0, 'html' => MsgBox(_t('_bx_messenger_txt_msg_no_results'))));

        $sContent = $this->_oTemplate->getTalkFiles($this->_iProfileId, $iLotId, $iNumber);
        return echoJson(array('code' => 0, 'html' => ($iTotal !== $iNumber ? $sContent : ''), 'total' => $iTotal));
    }

    function actionGetCallPopup(){
        $iLotId = (int)bx_get('lot');
        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_not_found'));
        if (!$iLotId || !isLogged())
            return echoJson($aResult);

        if ($this->_oConfig->isAllowedAction(BX_MSG_ACTION_JOIN_TALK_VC) !== true)
            $aResult = array('code' => 1);
        else
        {
            $mixedContent = $this->_oTemplate->getCallPopup($iLotId, $this->_iProfileId);
            $aResult = array('code' => +($mixedContent === false), 'popup' => $mixedContent);
        }

        return echoJson($aResult);
    }

    function actionGetLotSettings(){
        $iLotId = (int)bx_get('lot');
        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_not_found'));
        if (!$iLotId || !isLogged())
            return echoJson($aResult);

        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_lot_can_change_settings'));
        $bCheckAction = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true;
        if (!($this->_oDb->isAuthor($iLotId, $this->_iProfileId) || $bCheckAction))
            return echoJson($aResult);

        $mixedContent = $this->_oTemplate->getLotSettingsForm($iLotId);
        $aResult = array(
            'code' => +($mixedContent === false),
            'popup' => array(
                'html' => $mixedContent,
                'options' => array(
   			        'closeOnOuterClick' => true,
			        'removeOnClose' => true
                )
            )
        );
        return echoJson($aResult);
    }

    function actionSaveLotSettings(){
        $iLotId = (int)bx_get('lot');
        $aOptions = bx_get('options');
        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_not_found'));
        if (!$iLotId || !isLogged() || !($aLotInfo = $this->_oDb->getLotInfoById($iLotId)))
            return echoJson($aResult);

        $aResult = array('code' => 1, 'msg' => _t('_bx_messenger_lot_can_change_settings'));
        $bCheckAction = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true;
        if (!($this->_oDb->isAuthor($iLotId, $this->_iProfileId) || $bCheckAction))
            return echoJson($aResult);

        if ($this->_oDb->saveLotSettings($iLotId, $aOptions))
            return echoJson(array('code' => 0/*, 'text_area' => $this->_oTemplate->getTextArea($this->_iProfileId, $iLotId)*/));

        return echoJson($aResult);
    }

    function serviceSearch($sText = '', $iStart = 0, $iLimit = 10, $sOrder = 'DESC', $iLotId = 0){
        $CNF = $this->_oConfig->CNF;

        if (($iLotId && !isLogged()) || (!isAdmin() && !$iLotId))
            return _t('_bx_messenger_no_permissions');

        $sResult = $this->_oDb->findInHistory($iLotId, $sText, $iStart, $iLimit, $sOrder);
        if (empty($sResult))
            return array();

        $aMessages = array();
        foreach($sResult as &$aMessage){
            $iType = $aMessage[$CNF['FIELD_TYPE']];
            $sTitle = $aMessage[$CNF['FIELD_TITLE']] ?
                _t($aMessage[$CNF['FIELD_TITLE']]) : _t('_bx_messenger_lots_private_lot');

            $aMessages[] = array_merge($aMessage, array(
                $CNF['FIELD_TITLE'] => $sTitle,
                'message_url' => $this->_oConfig->getRepostUrl($aMessage['message_id']),
                $CNF['FIELD_PARTICIPANTS'] => explode(',', $aMessage[$CNF['FIELD_PARTICIPANTS']])
            ));
        }

        return $aMessages;
    }

    function serviceGetVideoConference($sRoomIdent, $iInitiator, $sTitle = '', $sId = '', $aInterfaceConfig = array()){
        if (!$iInitiator)

        if (!$sRoomIdent)
            $sRoomIdent = $this->_iProfileId;

        return $this->_oTemplate->getPublicJitsi($iInitiator, $sRoomIdent, $sTitle, $sId, $aInterfaceConfig);
    }

    function serviceGetPublicRoomInfo($sRoomId){
        return $this->_oDb->getPublicVideoRoom($sRoomId);
    }

    function serviceGenerateRoomName($sIdent){
        return $this->_oConfig->getRoomId($sIdent);
    }

    function actionGetEmojiPicker(){
		if (!$this->_iProfileId)
		    return;

        echo $this->_oTemplate->getEmojiCode();
        exit;
    }

    function actionUpdateUploadedFiles(){
        $iJotId = bx_get('jot_id');
        $aFiles = bx_get('files');
        if (!$this->isLogged())
            return echoJson(['code' => 1, 'message' => MsgBox(_t('_bx_messenger_not_logged')), 'reload' => 1]);

        if (!$iJotId || empty($aFiles))
            return echoJson(['code' => 1, 'message' => MsgBox(_t('_bx_messenger_files_can_not_be_uploaded'))]);

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_SEND_MESSAGE, $this->_iProfileId);
        if ($mixedResult !== true)
            return echoJson(array('code' => 1, 'message' => $mixedResult));


        $CNF = &$this->_oConfig->CNF;
        $aLotInfo = $this->_oDb->getLotByJotId($iJotId, false);
        if (empty($aLotInfo) || ($aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_PRIVATE &&
                !$this->_oDb->isParticipant($aLotInfo[$CNF['FIELD_ID']], $this->_iProfileId)))
            return echoJson(array('code' => 1, 'message' => '_bx_messenger_not_participant'));

        $aUploadedFiles = $this->_oDb->getJotFiles($iJotId);
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $aSuccessfulFiles = array();
        foreach ($aFiles as &$aFile) {
            $sRealName = $aFile['realname'];
            if (!empty($aUploadedFiles) && array_filter($aUploadedFiles, function($aF) use ($sRealName, $CNF) {
                    return $aF[$CNF['FIELD_ST_NAME']] == $sRealName;
                }))
                continue;

            if (!$this->_oConfig->isValidToUpload($aFile['name'])){
                $this->_oDb->deleteJot($iJotId, $this->_iProfileId, true);
                return echoJson(array('code' => 1, 'message' => _t('_bx_messenger_bad_request')));
            }

            $sFile = BX_DIRECTORY_PATH_TMP . basename($aFile['name']);
            $sExt = $oStorage->getFileExt($sFile);
            $iFileId = $oStorage->storeFileFromPath($sFile, $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE, $this->_iProfileId, (int)$iJotId);
            $sFilename = $oStorage->getFileTitle($sRealName) . ".{$sExt}";
            if ($iFileId) {
                $oStorage->afterUploadCleanup($iFileId, $this->_iProfileId);
                $this->_oDb->updateFiles($iFileId, array(
                    $CNF['FIELD_ST_JOT'] => $iJotId,
                    $CNF['FIELD_ST_NAME'] => $sFilename
                ));
                $aSuccessfulFiles[] = $sFilename;
                @unlink($sFile);
            }
        }

        if (count($aSuccessfulFiles)){
            $aJotInfo = $this->_oDb->getJotById($iJotId);
            if (!empty($aJotInfo[$CNF['FIELD_MESSAGE_AT']])) {
                $aFilesData = @unserialize($aJotInfo[$CNF['FIELD_MESSAGE_AT']]);
                if (isset($aFilesData[BX_ATT_TYPE_FILES_UPLOADING]))
                    unset($aFilesData[BX_ATT_TYPE_FILES_UPLOADING]);
            }

            if (!empty($aFilesData[BX_ATT_TYPE_FILES]))
                $aFilesData[BX_ATT_TYPE_FILES] = @unserialize($aFilesData[BX_ATT_TYPE_FILES]) + $aSuccessfulFiles;// . ",{$sFilesList}";
            else
                $aFilesData[BX_ATT_TYPE_FILES] = $aSuccessfulFiles;

            $this->_oDb->updateJot($iJotId, $CNF['FIELD_MESSAGE_AT'], @serialize($aFilesData));
        }

        echoJson(array('code' => 0));
    }

    function serviceGetSearchOptions(){
        $aResult = array();
        $CNF = &$this->_oConfig->CNF;
        foreach($CNF['SEARCH-CRITERIA'] as &$sItem)
            $aResult[$sItem] = _t("_bx_messenger_search_item_{$sItem}");

        return $aResult;
    }

    function serviceSetTalkAvatar($iLotId, $mixedFile){
        if (!$mixedFile)
            return false;

        return $this->setLotAvatar($iLotId, $mixedFile);
    }

    function setLotAvatar($iLotId, $mixedFile = null) {
        if (!$this->isLogged() || $mixedFile === null)
            return false;

        if (!($aLotInfo = $this->_oDb->getLotInfoById($iLotId)))
            return false;

        $CNF = &$this->_oConfig->CNF;
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        if (is_array($mixedFile) && isset($mixedFile['name'])) {
            $sFile = BX_DIRECTORY_PATH_TMP . basename($mixedFile['name']);
            $iFileId = $oStorage->storeFileFromPath($sFile, false, $this->_iProfileId, $iLotId);
        } elseif (filter_var($mixedFile, FILTER_VALIDATE_URL) !== false)
            $iFileId = $oStorage->storeFileFromUrl($mixedFile, false, $this->_iProfileId, $iLotId);
        elseif ((int)$mixedFile)
            $iFileId = (int)$mixedFile;

        if ($iFileId) {
            $oStorage->afterUploadCleanup($iFileId, $this->_iProfileId);
            $this->_oDb->saveLotSettings($iLotId, $iFileId, $CNF['FLS_ICON']);
        }
    }

    function actionGetCreateGroupForm(){
        $iGroupId = (int)bx_get('group');
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'msg' => MsgBox(_t('_bx_messenger_not_logged'))));

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_GROUPS, $this->_iProfileId);
        if ($mixedResult !== true)
            return echoJson(array('code' => 1, 'msg' => _t($mixedResult)));

        $aResult = array('code' => 0, 'popup' => $this->_oTemplate->getCreateGroupsForm($this->_iProfileId, $iGroupId));
        echoJson($aResult);
    }

    function actionSaveGroup(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'msg' => MsgBox(_t('_bx_messenger_not_logged'))));

        $mixedResult = $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_GROUPS, $this->_iProfileId);
        if ($mixedResult !== true)
            return echoJson(array('code' => 1, 'msg' => _t($mixedResult)));

        if ($this->_oDb->addGroup($this->_iProfileId, $_POST))
            return echoJson(array('code' => 0));

        choJson(array('code' => 1, 'msg' => _t('_bx_messenger_nothing_has_been_saved')));
    }

    function actionLoadGroupsList(){
        if (!$this->isLogged())
            return echoJson(array('code' => 1, 'msg' => MsgBox(_t('_bx_messenger_not_logged'))));

        echoJson(array('code' => 0, 'content' => $this->_oTemplate->getNavGroupsMenu($this->_iProfileId)));
    }

    function serviceIsBlockVersion(){
        return $this->_isBlockMessenger;
    }

    function actionAddMembersToGroups(){
        $CNF = &$this->_oConfig->CNF;
        if (!$this->isLogged())
            return false;

        $aGroups = $this->_oDb->getAll("SELECT 
                                            `l`.*, `g`.`{$CNF['FMG_MODULE']}`, `g`.`{$CNF['FMG_NAME']}`, `gl`.`{$CNF['FMGL_GROUP_ID']}`, 
                                             IF (`l`.`{$CNF['FIELD_UPDATED']}` = 0, `l`.`{$CNF['FIELD_ADDED']}`, `l`.`{$CNF['FIELD_UPDATED']}`) as `order` 
                                             FROM `{$CNF['TABLE_ENTRIES']}` as `l`
                                             LEFT JOIN `{$CNF['TABLE_GROUPS_LOTS']}` as `gl` ON `gl`.`{$CNF['FMGL_LOT_ID']}` = `l`.`{$CNF['FIELD_ID']}`
                                             LEFT JOIN `{$CNF['TABLE_GROUPS']}` as `g` ON `g`.`{$CNF['FMG_ID']}` = `gl`.`{$CNF['FMGL_GROUP_ID']}`
                                             WHERE `l`.`{$CNF['FIELD_TYPE']}` > 3 
                                             ORDER BY `g`.`{$CNF['FMG_MODULE']}`"); //AND (`gl`.`{$CNF['FMGL_GROUP_ID']}` IS NULL OR `gl`.`{$CNF['FMGL_GROUP_ID']}` = 0)

        foreach($aGroups as $aGroup){
            if ($aGroup[$CNF['FIELD_URL']])
                $this->_oDb->registerGroup($aGroup[$CNF['FIELD_URL']], $aGroup[$CNF['FIELD_ID']]);
        }
    }

    function actionUpdateGroups(){
        if (!isLogged())
            return false;

        $aModules = bx_srv('system', 'get_modules_by_type', ['context']);
        bx_import('BxDolConnection');
        foreach($aModules as &$aModule)
            if (!bx_srv($aModule['name'], 'act_as_profile')){
                $aMyItems = bx_srv($aModule['name'], 'get_participating_profiles', [$this->_iProfileId]);
                foreach($aMyItems as &$iItem){
                    $oGroupProfile = BxDolProfile::getInstance($iItem);
                    if ($oGroupProfile) {
                        $aItemInfo = bx_srv($aModule['name'], 'get_info', array($oGroupProfile->getContentId(), false));

                        $oModule = BxDolModule::getInstance($aModule['name']);
                        $CNF = &$oModule->_oConfig->CNF;
                        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']);
                        if (!$oConnection)
                            continue;

                        $aFans = $oConnection -> getConnectedInitiators($iItem);
                        if (!empty($aFans)){
                            $aObject = BxDolPageQuery::getPageObject($CNF['OBJECT_PAGE_VIEW_ENTRY']);
                            $sUrl = "i={$aObject['uri']}&id=" . $oGroupProfile->getContentId();
                            $aLotInfo = $this->_oDb->getLotByUrl($sUrl);
                            if (empty($aLotInfo)){
                                $iLotId = $this->_oDb->createLot($aItemInfo[$CNF['FIELD_AUTHOR']], $sUrl, $aItemInfo[$CNF['FIELD_TITLE']], BX_IM_TYPE_GROUPS, $aFans);
                                $this->_oDb->registerGroup($sUrl, $iLotId);
                            }
                        }
                    }
                }
            }
    }

    function actionMediaAccordion(){
        $bShown = (bool)bx_get('hidden');
        $iFileId = (int)bx_get('id');
        if (!$this->isLogged() || !$iFileId)
            return false;

        $oStorage = BxDolStorage::getObjectInstance($this->_oConfig->CNF['OBJECT_STORAGE']);
        if (!($aFile = $oStorage->getFile($iFileId)))
            return false;

        $iLotId = $this->_oDb->getLotByJotId($aFile[$this->_oConfig->CNF['FIELD_ST_JOT']]);
        if (!$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return false;

        if (!$bShown)
            $this->_oDb->addMediaTrack($iFileId, $this->_iProfileId);
        else
            $this->_oDb->removeMediaTracker($iFileId, $this->_iProfileId);
    }

    function serviceConvertToReply(){
       $CNF = &$this->_oConfig->CNF;
       $aJots = $this->_oDb->getAll("SELECT * FROM `{$CNF['TABLE_MESSAGES']}` 
                                     WHERE `{$CNF['FIELD_MESSAGE_AT_TYPE']}`=:type OR `{$CNF['FIELD_MESSAGE_AT']}` LIKE '%\"reply\"%'", array('type' => BX_ATT_TYPE_REPLY));
       foreach($aJots as &$aJot){
           if ($aJot[$CNF['FIELD_MESSAGE_AT_TYPE']] == BX_ATT_TYPE_REPLY && (int)$aJot[$CNF['FIELD_MESSAGE_AT']])
               $this->_oDb->query("UPDATE `{$CNF['TABLE_MESSAGES']}` SET `{$CNF['FIELD_MESSAGE_REPLY']}`=:reply WHERE `{$CNF['FIELD_MESSAGE_ID']}`=:id",
                   array('id' => $aJot[$CNF['FIELD_MESSAGE_ID']], 'reply' => (int)$aJot[$CNF['FIELD_MESSAGE_AT']]));
           elseif(!$aJot[$CNF['FIELD_MESSAGE_AT_TYPE']] && $aJot[$CNF['FIELD_MESSAGE_AT']]) {
               $aAttachment = @unserialize($aJot[$CNF['FIELD_MESSAGE_AT']]);
               if (!empty($aAttachment[BX_ATT_TYPE_REPLY]))
                 $this->_oDb->query("UPDATE `{$CNF['TABLE_MESSAGES']}` SET `{$CNF['FIELD_MESSAGE_REPLY']}`=:reply
                                WHERE `{$CNF['FIELD_MESSAGE_ID']}`=:id", array('id' => $aJot[$CNF['FIELD_MESSAGE_ID']], 'reply' => $aAttachment[BX_ATT_TYPE_REPLY]));
           }
       }
    }

    function serviceUpdateMemberships(){
        $aMembershipLevels = BxDolAcl::getInstance()->getMemberships();
        $sModuleName = $this->getName();
        $iActionId = BxDolAcl::getInstance()->getMembershipActionId('administrate messages', $sModuleName);

        $iActionEditId = BxDolAcl::getInstance()->getMembershipActionId('edit messages', $sModuleName);
        $iActionDeleteId = BxDolAcl::getInstance()->getMembershipActionId('delete messages', $sModuleName);

        if (!($iActionId && $iActionEditId && $iActionDeleteId) || empty($aMembershipLevels))
            return false;

        foreach($aMembershipLevels as $iMembershipId => $sMembership){
            $aAction = BxDolAclQuery::getInstance()->getAction($iMembershipId, $iActionId);
            $aActionEdit = BxDolAclQuery::getInstance()->getAction($iMembershipId, $iActionEditId);
            $aActionDelete = BxDolAclQuery::getInstance()->getAction($iMembershipId, $iActionDeleteId);

            if (is_null($aAction['id']) || !is_null($aActionEdit['id']) || !is_null($aActionDelete['id']))
                continue;

            $this->_oDb->query("INSERT INTO `sys_acl_matrix` SET `IDLevel`=:level, `IDAction`=:action", array( 'level' => $iMembershipId, 'action' => $iActionDeleteId));
            $this->_oDb->query("INSERT INTO `sys_acl_matrix` SET `IDLevel`=:level, `IDAction`=:action", array( 'level' => $iMembershipId, 'action' => $iActionEditId));

            $this->_oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel`=:level AND `IDAction`=:action", array( 'level' => $iMembershipId, 'action' => $iActionId));
        }

        return $iActionId;
    }

    function servicePublicToPages(){
        $CNF = &$this->_oConfig->CNF;
        $aLots = $this->_oDb->getAll("SELECT * FROM `{$CNF['TABLE_ENTRIES']}`
                                               WHERE `{$CNF['FIELD_TYPE']}`!=:type AND `{$CNF['FIELD_URL']}` != ''", array('type' => BX_IM_TYPE_PRIVATE));
        foreach($aLots as &$aLot){
            $iGroupId = $this->_oDb->getGroupIdByLotId($aLot[$CNF['FIELD_ID']]);
            if ($iGroupId)
                continue;

            $sUrl = $aLot[$CNF['FIELD_URL']];
            if ($sUrl === 'index.php')
                $sUrl = "i=index";
            else
             if (stripos($sUrl, 'i=') === FALSE)
                $sUrl = "i=" . str_replace('r=', '', $aLot[$CNF['FIELD_URL']]);

            $aGroup = $this->_oDb->getGroupByUrl($sUrl);
            if (empty($aGroup))
                $this->_oDb->registerGroup($sUrl, $aLot[$CNF['FIELD_ID']], true);
            else
                $this->_oDb->addLotToGroup($aLot[$CNF['FIELD_ID']], $aGroup[$CNF['FMG_ID']]);

        }
    }

    public function serviceGetSafeServices()
    {
        return [
            'FindConvo' => 'BxMessengerServices',
            'LeaveConvo' => 'BxMessengerServices',
            'DeleteConvo' => 'BxMessengerServices',
            'GetConvo' => 'BxMessengerServices',
            'GetConvoUrl' => 'BxMessengerServices',
            'GetConvosList' => 'BxMessengerServices',
            'GetConvoMessages' => 'BxMessengerServices',
            'GetSendForm' => 'BxMessengerServices',
            'RemoveJot' => 'BxMessengerServices',
            'SearchUsers' => 'BxMessengerServices',
            'SearchLots' => 'BxMessengerServices',
            'GetPartsList' => 'BxMessengerServices',
            'SavePartsList' => 'BxMessengerServices',
            'GetBlockContacts' => 'BxMessengerServices',

            //--- Aren't used in App for now.
            'GetConvoMessage' => '',
            'GetConferenceInfoByUid' => 'BxMessengerServices',
            'GetConvoItem' => '',
            'ClearGhost' => '',
        ];
    }

    /*
     * Should be moved to Services if it's needed, otherwise removed.
     */
    public function serviceClearGhost($sParams){
        $aOptions = json_decode($sParams, true);
        if (!isset($aOptions['id']))
            return [];

        $CNF = &$this->_oConfig->CNF;
        $aJotInfo = $this->_oDb->getJotById($aOptions['id']);
        if (empty($aJotInfo) || !$this->isAvailable($aJotInfo[$CNF['FIELD_MESSAGE_FK']]))
            return [];

        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);

        if (!($aFiles = $this->_oDb->getJotFiles($aOptions['id'])))
            return [];

        $aResultFiles = array_map(function($aFile) use ($CNF){
            return $aFile[$CNF['FIELD_ST_ID']];
        }, $aFiles);

        $oStorage->afterUploadCleanup($aResultFiles, $this->_iProfileId);
    }

    /*
     * Moved to Services
     */
    public function serviceSavePartsList($sParams){
        $aOptions = json_decode($sParams, true);

        $aResult = ['code' => 1];
        if (!$sParams || !isset($aOptions['parts']))
            return $aResult;

        $aResult = $this->saveParticipantsList($aOptions['parts'], (isset($aOptions['id']) ? $aOptions['id'] : 0));
        if (isset($aResult['lot'])) {
            $CNF = &$this->_oConfig->CNF;
            $aLotInfo = $this->_oDb->getLotInfoById($aResult['lot']);
            $aItem = $this->_oTemplate->getLotsPreview($this->_iProfileId, [$aLotInfo]);            
            if (!empty($aItem)) {
                $aItem = current($aItem);
                $sImageUrl = bx_api_get_relative_url($aItem['bx_if:user']['content']['icon']);
                $aResult['convo'] = [
                    'author_data' => (int)$aItem[$CNF['FIELD_AUTHOR']] ? BxDolProfile::getInstance()->getData($aItem[$CNF['FIELD_AUTHOR']]) : [
                        'id' => 0,
                        'display_type' => 'unit',
                        'display_name' => $aItem['bx_if:user']['content']['talk_type'],
                        'url' => $sImageUrl,
                        'url_avatar' => $sImageUrl,
                        'module' => isset($aItem['author_module']) ? $aItem['author_module'] : 'bx_pages',
                    ],
                    'title' => $aItem[$CNF['FIELD_TITLE']],
                    'message' => $aItem['bx_if:user']['content']['message'],
                    'date' => $aItem['bx_if:timer']['content']['time'],
                    'id' => $aLotInfo[$CNF['FIELD_HASH']],
                    'total_messages' => $this->_oDb->getJotsNumber($aItem[$CNF['FIELD_ID']], 0)
                ];

                $aResult['lot'] = $aLotInfo[$CNF['FIELD_HASH']];
            }
        }

        return $aResult;
    }

    /*
     * Moved to Services
     */
    public function serviceSearchUsers($sParams){
        $aOptions = json_decode($sParams, true);
        $aResult = ['code' => 1];
        $aUsers = [];
        if (!$sParams || !isset($aOptions['term']))
            return $aResult;

        $aFoundProfile = $this->searchProfiles($aOptions['term'], isset($aOptions['except']) ? $aOptions['except'] : []);
        if (!empty($aFoundProfile)){
            foreach($aFoundProfile as &$aProfile) {
                $oModule = BxDolModule::getInstance($aProfile['module']);
                $oPCNF = &$oModule->_oConfig->CNF;
                $aData = $oModule->_oDb->getContentInfoById($aProfile['id']);
                $oProfile = BxDolProfile::getInstanceByContentAndType($aProfile['id'], $aProfile['module']);
                $aUsers[] = array_merge($aProfile, [
                  'id' => $oProfile->id(),
                  'image' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_PICTURE']]),
                  'cover' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_COVER']])
                ]);
            }
        }

        return $aUsers;
    }

    /*
     * Moved to Services.
     */
    public function serviceFindConvo($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $aResult = ['code' => 1];
        if (!isset($aOptions['param']))
            return $aResult;

        if ($aOptions['param']) {
            $oProfile = null;
            $aData = BxDolPageQuery::getSeoLink($this->_oConfig->getName(), 'messenger', ['param_name' => 'profile_id', 'uri' => $aOptions['param']]);
            if (!empty($aData) && isset($aData['param_value']))
                $oProfile = BxDolProfile::getInstance($aData['param_value']);

            if (!$oProfile) {
                $aPersonsData = BxDolPageQuery::getSeoLink('bx_persons', 'view-persons-profile', ['param_name' => 'id', 'uri' => $aOptions['param']]);
                if (!empty($aPersonsData) && isset($aPersonsData['param_value']))
                    $oProfile = BxDolProfile::getInstanceByContentAndType($aPersonsData['param_value'], 'bx_persons');
            }

            if (!$oProfile) {
                $aOrgData = BxDolPageQuery::getSeoLink('bx_organizations', 'view-organization-profile', ['param_name' => 'id', 'uri' => $aOptions['param']]);
                if (!empty($aOrgData) && isset($aOrgData['param_value']))
                    $oProfile = BxDolProfile::getInstanceByContentAndType($aOrgData['param_value'], 'bx_organizations');
            }


            if ($oProfile) {
                if ($aExistedTalk = $this->_oDb->getLotsByParticipantsList([$oProfile->id(), $this->_iProfileId], BX_IM_TYPE_PRIVATE))
                    return ['convo' => $aExistedTalk];

                return ['profile' => BxDolProfile::getInstance()->getData($oProfile->id())];
            }
        }

        return [];
    }

    /*
     * Should be moved to Services if it's needed, otherwise removed.
     */
    public function serviceGetConvoItem($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $aResult = array('code' => 1);
        if (!isset($aOptions['id']) || !($aLotInfo = $this->_oDb->getLotInfoById($aOptions['id'])))
            return $aResult;

        $iLotId = $aOptions['id'];
        if (!$this->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return ['code' => 1, _t('_bx_messenger_not_participant')];

        $CNF = $this->_oConfig->CNF;
        return array_merge($aLotInfo, ['author_data' => BxDolProfile::getInstance()->getData($aLotInfo[$CNF['FIELD_AUTHOR']])]);
    }

    /*
     * Moved to Services
     */
    function serviceRemoveJot($sParams = ''){
        $aOptions = json_decode($sParams, true);

        $iJotId = isset($aOptions['jot_id']) ? (int)$aOptions['jot_id'] : 0;
        $iLotId = isset($aOptions['lot_id']) ? $aOptions['lot_id'] : 0;
        if (!$iJotId)
            return [];
        $this->pusherData('convo_' . $iLotId, ['convo' => $iLotId, 'action' => 'deleted', 'data' => $iJotId]);
        return $this->serviceDeleteJot($iJotId, true);
    }

    /*
     * Moved to Services
     */
    function serviceGetConvosList($sParams = ''){
        $aOptions = json_decode($sParams, true);
        $aData = $this->serviceGetTalksList($aOptions);

        $aList = $aData['list'];
        if (isset($aData['code']) && !(int)$aData['code'] && !empty($aData['list']))
            $aList = $this->_oTemplate->getLotsPreview($this->_iProfileId, $aData['list']);

        $CNF = &$this->_oConfig->CNF;

        $aResult = [];
        if (!empty($aList)){
            foreach($aList as $iKey => $aItem){
                $sImageUrl = bx_api_get_relative_url($aItem['bx_if:user']['content']['icon']);
                $aResult[] = [
                  'author_data' => (int)$aItem[$CNF['FIELD_AUTHOR']] ? BxDolProfile::getInstance()->getData($aItem[$CNF['FIELD_AUTHOR']]) : [
                      'id' => 0,
                      'display_type' => 'unit',
                      'display_name' => $aItem['bx_if:user']['content']['talk_type'],
                      'url' => $sImageUrl,
                      'url_avatar' => $sImageUrl,
                      'module' => isset($aItem['author_module']) ? $aItem['author_module'] : 'bx_pages',
                  ],
                   'title' => $aItem[$CNF['FIELD_TITLE']],
                   'message' => $aItem['bx_if:user']['content']['message'],
                   'date' => $aItem['bx_if:timer']['content']['time'],
                   'id' => $aData['list'][$iKey][$CNF['FIELD_HASH']],
                    'id2' => $aItem[$CNF['FIELD_ID']],
                   'unread' => $aItem['count'],
                   'total_messages' => $this->_oDb->getJotsNumber($aItem[$CNF['FIELD_ID']], 0)
                ];
            }
        }
        
        return $aResult;
    }

    public function checkAllowedDeleteAnyEntryForProfile ($isPerformAction = false, $iProfileId = false){
        return true;
    }

    public function checkAllowedEditAnyEntryForProfile ($isPerformAction = false, $iProfileId = false){
        return true;
    }

    /**
     * Moved to Services
     */
    public function unitAPI($iProfileId, $aParams = [])
    {
        $CNF = &$this->_oConfig->CNF;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return '';

        $sModule = $oProfile->getModule();
        $iContentId = $oProfile->getContentId();
        $oModule = BxDolModule::getInstance($sModule);

        $aData = $oModule->_oDb->getContentInfoById($iContentId);
        $oPCNF = &$oModule->_oConfig->CNF;

        // get profile's url
        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $oPCNF['URI_VIEW_ENTRY'] . '&id=' . $iContentId));

        $aResult = [
            'id' => $iContentId,
            'module' => $sModule,
            'added' => $aData[$oPCNF['FIELD_ADDED']],
            'title' => $aData[$oPCNF['FIELD_TITLE']],
            'url' => bx_api_get_relative_url($sUrl),
            'image' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_PICTURE']]),
            'cover' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_COVER']])
        ];

        $oPrivacy = BxDolPrivacy::getObjectInstance($oPCNF['OBJECT_PRIVACY_VIEW']);
        $bPrivacy = $oPrivacy !== false;

        $sKey = 'OBJECT_MENU_SNIPPET_META';
        if(!empty($CNF[$sKey]) && ($oMetaMenu = BxDolMenu::getObjectInstance($CNF[$sKey], $oModule->_oTemplate)) !== false) {
            $bPublic = !$bPrivacy || $oPrivacy->check($iContentId) || $oPrivacy->isPartiallyVisible($aData[$CNF['FIELD_ALLOW_VIEW_TO']]);

            $oMetaMenu->setContentModule($sModule);
            $oMetaMenu->setContentId($iContentId);
            $oMetaMenu->setContentPublic($bPublic);

            $aResult['meta'] = $oMetaMenu->getCodeAPI();
        }

        return $aResult;
    }

    function serviceGetBlockContactsMessenger($mixedParams = []) {
        if(bx_is_api())
            return bx_srv($this->getName(), 'get_block_contacts', [$mixedParams], 'Services');

        return $this->_oTemplate->getContacts($this->_iProfileId, $mixedParams);
    }

    public function serviceGetBroadcastFields($aInputsAdd = array()) {
        $aFields = $this->_oTemplate->_getBroadcastFields();

        $aResult = [];
        foreach($aFields as $sName => $aField) {
            if (isset($aField['skip']) || !isset($aField['caption']))
                continue;

            $aResult[$sName] = $aField['caption'];
        }

        return $aResult;
    }

    private function getProfilesByCriteria($aData){
        if (isset($aData['connection_type'])){
            if ($oConnection = $this->_oConfig->getConnectionByType($aData['connection_type'])) {
                return $oConnection->getConnectedContent($this->_iProfileId, $aData['connection_type'] === 'friends');
            }
        }

        $CNF = &$this->_oConfig->CNF;
        if (!($oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_FILTER'], $CNF['OBJECT_FORM_FILTER_DISPLAY'], $this->_oTemplate)))
            return false;

        $oForm->filteredForm();

        $aFields = [];
        foreach($oForm->aInputs as &$aInput){
            if (!isset($aData[$aInput['name']]) || isset($aInput['skip']) || $aInput['name'] === 'convo_type')
                continue;

            if (!empty($aInput['values']))
                $aFields[$aInput['name']] = array_filter($aData[$aInput['name']], function($sVal) use ($aInput) {
                    return in_array($sVal, array_keys($aInput['values']));
                });
            else
                $aFields[$aInput['name']] = $aData[$aInput['name']];
        }

        $aProfiles = $this->_oDb->getProfilesByCriteria($aFields);
        bx_alert($this->_oConfig->getObject('alert'), 'broadcast_profiles_list', 0, 0, [
            'profiles' => &$aProfiles
        ]);

        return $aProfiles;
    }

    function actionCalculateProfiles(){
        $aData = bx_get('data');
        $aManuall = bx_get('manually');

        $iConvoType = isset($aData['convo_type']) ? $aData['convo_type'] : 0;
        if (!$this->isLogged() || (empty($aData) && empty($aManuall)) || !$iConvoType)
            return false;

        $aResult = $this->getProfilesByCriteria($aData);
        if (!empty($aManuall))
            $aResult = array_unique(array_merge($aResult, $aManuall), SORT_NUMERIC);

        echoJson(['msg' => _t('_bx_messenger_broadcast_total_profiles', count($aResult))]);
    }

    function serviceGetBroadcastCard($iJotId){
        if (!$iJotId)
            return '';

        $aLotInfo = $this->_oDb->getLotByJotId($iJotId, false);
        $aJotInfo = $this->_oDb->getJotById($iJotId);

        return $this->_oTemplate->parseHtmlByName('broadcast-message.html', ['title' => $aLotInfo['title'], 'content' => $aJotInfo['message']]);
    }

    function actionGetFilterCriteria(){
        If (!$this->isLogged() && $this->_oConfig->isAllowedAction(BX_MSG_ACTION_CREATE_BROADCASTS) !== true)
            return echoJson(['code' => 1]);

        $CNF = &$this->_oConfig->CNF;

        $sType = bx_get('type');
        $sHtml = '';
        switch($sType){
            case BX_MSG_TALK_TYPE_BROADCAST:
                $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_FILTER'], $CNF['OBJECT_FORM_FILTER_DISPLAY'], $this->_oTemplate);
                if ($oForm->filteredForm())
                    $sHtml = $oForm->getCode();
                else
                    $sHtml = MsgBox(_t('_bx_messenger_no_criteria_available'));

                break;
            case 'followers':
            case 'friends':
                $sHtml = $this->_oTemplate->getConnectionsForm($sType, $this->_iProfileId);
                break;
            /*default:
                $aForm = [
                    'form_attrs' => [
                        'method' => 'post',
                        'id' => $CNF['OBJECT_FORM_ENTRY'],
                        'class' => 'space-y-4 max-h-60 overflow-y-auto'
                    ],
                    'inputs' => $this->_oTemplate->getNotificationFormData()
                ];

                $oForm = new BxTemplFormView($aForm);
                $sHtml = $oForm -> getCode();*/
        }

        echoJson(['code' => 0, 'html' => $sHtml]);
    }

    public function actionAjaxGetRecipients ()
    {
        $sTerm = bx_get('term');
        $a = BxDolService::call('system', 'profiles_search', array($sTerm), 'TemplServiceProfiles');

        header('Content-Type:text/javascript; charset=utf-8');
        echo(json_encode($a));
    }

    function actionGetTalkInfo(){
        $iLotId = (int)bx_get('lot_id');
        if (!$iLotId)
            return echoJson(array('code' => 1, 'html' => MsgBox(_t('_bx_messenger_not_found'))));

        if (!$this->isAvailable($iLotId))
            return echoJson(array('code' => 1, 'message' => '_bx_messenger_not_participant'));

        $sContent = $this->_oTemplate->getInfoBlockContent($iLotId);
        return echoJson(array('code' => 0, 'html' => $sContent));
    }

    /**
     * Moved to Services
     */
    private function pusherData($sAction, $aData = []){
        $oSockets = BxDolSockets::getInstance();

        if (isset($aData['convo']) && (int)$aData['convo']){
            $CNF = &$this->_oConfig->CNF;
            $aLotInfo = $this->_oDb->getLotInfoById($aData['convo']);
            $aData['id'] = $aLotInfo[$CNF['FIELD_HASH']];
        }

        $aData['user_id'] = $this->_iProfileId;

        if($oSockets->isEnabled() && $sAction && !empty($aData)) {
            $oSockets->sendEvent('bx', 'messenger', $sAction, $aData);
        }
    }

}

/** @} */
