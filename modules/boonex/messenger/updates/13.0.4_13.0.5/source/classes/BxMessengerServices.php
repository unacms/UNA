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
 * For API only.
 */
class BxMessengerServices extends BxDol
{
    protected $_sModule;
    protected $_oModule;

    protected $_iProfileId;

    public function __construct()
    {
        parent::__construct();

        $this->_sModule = 'bx_messenger';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        $this->_iProfileId = bx_get_logged_profile_id();
    }

    public function serviceGetBlockMain()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aMenuMain = [];
        if(($oMenuMain = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_NAV_LEFT_MENU'])) !== false)
            $aMenuMain =  $oMenuMain->getCodeAPI();

        return [
            bx_api_get_block('messenger_main_page', [
                'menu' => $aMenuMain, 
                'form' => ['data' => $this->serviceGetSendForm()]
            ], [
                'ext' => [
                    'name' => $this->_sModule, 
                    'request' => ['url' => '/api.php?r=' . $this->_sModule . '/get_send_form/Services', 'immutable' => true]
                ]
            ])
        ];
    }

    public function serviceGetBlockContacts($mixedParams)
    {
        $aParams = bx_api_get_browse_params($mixedParams, true);

        $aProfiles = !defined('BX_API_PAGE') ? $this->_oModule->_oTemplate->getContacts($this->_iProfileId, $aParams) : [];

        $aResultProfiles = [];
        foreach($aProfiles as &$aProfile)
            if($aProfile['id'] != $this->_iProfileId)
                $aResultProfiles[] = $this->_unitProfile($aProfile['id']);

        $aData = array_merge([
            'data' => $aResultProfiles
        ], [
            'params' => [
                'start' => isset($aParams['start']) ? $aParams['start'] : 0,
                'per_page' => isset($aParams['per_page']) ? $aParams['per_page'] : 0 
        ]], [
            'module' => $this->_sModule,
            'unit' => 'mixed',
            'request_url' => '/api.php?r=' . $this->_sModule . '/get_block_contacts/Services&params[]='
        ]);

        return [bx_api_get_block('browse', $aData)];
    }

    /*
     * Find convo (lot) related to logged in profile and context if the last one is provided.
     */
    public function serviceFindConvo($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $aParticipants = [$this->_iProfileId];
        if(!empty($aOptions['context']))
            $aParticipants[] = $aOptions['context'];

        $aLot = $this->_oModule->_oDb->getLotsByParticipantsList($aParticipants, BX_IM_TYPE_PRIVATE);
        if(empty($aLot) || !is_array($aLot))
            return [];

        return ['lot' => $aLot];
    }
    
    /**
     * Leave convo (lot) with defined ID
     */
    public function serviceLeaveConvo($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $iLotId = isset($aOptions['lot']) ? (int)$aOptions['lot'] : 0;

        if(!$iLotId || !$this->_oModule->_oDb->isParticipant($iLotId, $this->_iProfileId))
            return ['code' => 1, 'message' => _t('_bx_messenger_not_participant')];

        if($this->_oModule->_oDb->isAuthor($iLotId, $this->_iProfileId))
            return ['code' => 2, 'message' => _t('_bx_messenger_cant_leave')];

        return ['code' => !$this->_oModule->_oDb->leaveLot($iLotId, $this->_iProfileId) ? 3 : 0];
    }

    /**
     * Delete convo (lot) with defined ID
     */
    public function serviceDeleteConvo($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $iLotId = isset($aOptions['lot']) ? (int)$aOptions['lot'] : 0;

        if(!$iLotId || !($this->_oModule->_oDb->isAuthor($iLotId, $this->_iProfileId) || ($this->_oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true)))
            return ['code' => 1, 'message' => _t('_bx_messenger_can_not_delete')];

        return ['code' => !$this->_oModule->_oDb->deleteLot($iLotId) ? 2 : 0];
    }
    
    /**
     * Get convo (lot) info with defined ID
     */
    public function serviceGetConvo($sParams)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aOptions = json_decode($sParams, true);

        $iLotId = isset($aOptions['lot']) ? (int)$aOptions['lot'] : 0;
        $aLotInfo = [];

        if(!$iLotId || !($aLotInfo = $this->_oModule->_oDb->getLotInfoById($iLotId)))
            return ['code' => 1, 'message' => _t('_bx_messenger_not_found')];

        if(!$this->_isAvailable($iLotId))
            return ['code' => 2, 'message' => _t('_bx_messenger_not_participant')];

        $aPartList = $this->_oModule->_oDb->getParticipantsList($iLotId);
        if((int)$aLotInfo[$CNF['FIELD_TYPE']] === BX_IM_TYPE_BROADCAST)
            $aPartList = $this->_oModule->_oDb->getBroadcastParticipants($iLotId);

        return ['code' => 0, 'lot' => [
            'author_data' => BxDolProfile::getData($aLotInfo[$CNF['FIELD_AUTHOR']]),
            'parts' => count($aPartList),
            'files' => $this->_oModule->_oDb->getLotFilesCount($iLotId),
            'messages' => $this->_oModule->_oDb->getJotsNumber($iLotId, 0),
        ]];
    }

    /**
     * Get convo (lot) URL by recipient ID
     */
    public function serviceGetConvoUrl($sParams)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aOptions = json_decode($sParams, true);
        
        $aParticipants = [$this->_iProfileId];
        if(!empty($aOptions['recipient']))
            $aParticipants[] = $aOptions['recipient'];
        
        $aLot = $this->_oModule->_oDb->findLotByParams([
            $CNF['FIELD_PARTICIPANTS'] => $aParticipants,
            $CNF['FIELD_TYPE'] => BX_IM_TYPE_PRIVATE
        ]);

        if(empty($aLot) || !is_array($aLot)) {
            $aResult = $this->_oModule->saveParticipantsList($aParticipants);
            if(!isset($aResult['lot']))
                return false;

            $aLot = $this->_oModule->_oDb->getLotInfoById($aResult['lot']);
            if(empty($aLot) || !is_array($aLot))
                return false;
        }

        return bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_HOME']) . '/inbox/' . $aLot['hash']);
    }

    public function serviceGetConvosList($sParams = '')
    {
        $aOptions = json_decode($sParams, true);
        $aData = $this->_oModule->serviceGetTalksList($aOptions);

        $aList = $aData['list'];
        if(isset($aData['code']) && !(int)$aData['code'] && !empty($aData['list']))
            $aList = $this->_oModule->_oTemplate->getLotsPreview($this->_iProfileId, $aData['list']);

        $aResult = [];
        if(empty($aList))
            return $aResult;

        foreach($aList as $iKey => $aItem)
            $aResult[] = $this->_unitLot($aData['list'][$iKey], $aItem);

        return $aResult;
    }

    public function serviceGetConvoMessages($sParams)
    {
        $aOptions = is_array($sParams) ? $sParams : json_decode($sParams, true);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $iJot = isset($aOptions['jot']) ? (int)$aOptions['jot'] : 0;
        $iStart = isset($aOptions['start']) ? (int)$aOptions['start'] : 0;

        $iLotId = 0;
        if(isset($aOptions['lot']) && $aOptions['lot'])
            $iLotId = $this->_oModule->_oDb->getConvoByHash($aOptions['lot']);

        $sLoad = isset($aOptions['load']) ? $aOptions['load'] : 'prev';
        $sArea = isset($aOptions['area_type']) ? $aOptions['area_type'] : 'index';

        if ($iLotId && !$this->_isAvailable($iLotId))
            return ['code' => 1, 'message' => _t('_bx_messenger_talk_is_not_allowed')];

        $sUrl = isset($aOptions['url']) ? $aOptions['url'] : '';
        if ($sUrl)
            $sUrl = $this->_oModule->getPreparedUrl($sUrl);

        $isFocused = (bool)bx_get('focus');
        $iRequestedJot = (int)bx_get('req_jot');
        $iLastViewedJot = (int)bx_get('last_viewed_jot');
        $bUpdateHistory = true;
        $mixedContent = '';
        $iUnreadJotsNumber = 0;
        $iLastUnreadJotId = 0;
        $bAttach = true;
        $bRemoveSeparator = false;
        $aParamsBrowse = [];
        switch ($sLoad) {
            case 'new':
                if (!$iJot) {
                    $iJot = $this->_oModule->_oDb->getFirstUnreadJot($this->_iProfileId, $iLotId);
                    if ($iJot)
                        $iJot = $this->_oModule->_oDb->getPrevJot($iLotId, $iJot);
                    else {
                        $aLatestJot = $this->_oModule->_oDb->getLatestJot($iLotId);
                        $iJot = !empty($aLatestJot) ? (int)$aLatestJot[$CNF['FIELD_MESSAGE_ID']] : 0;
                    }
                }

                if ($iRequestedJot) {
                    if ($this->_oModule->_oDb->getJotsNumber($iLotId, $iJot, $iRequestedJot) >= $CNF['MAX_JOTS_LOAD_HISTORY'])
                        $bUpdateHistory = false;
                    else if ($isFocused)
                        $this->_oModule->_oDb->readMessage($iRequestedJot, $this->_iProfileId);
                }

                if ($iLastViewedJot && $bUpdateHistory && $isFocused) {
                    $this->_oModule->_oDb->readMessage($iLastViewedJot, $this->_iProfileId);
                }

            case 'ids':
                $mixedContent = [$this->_oModule->_oDb->getJotById($iJot)];
                break;

            case 'prev':
                $aCriteria = [
                    'lot' => $iLotId,
                    'url' => $sUrl,
                    'start' => $iJot,
                    'load' => $sLoad,
                    'start' => $iStart,
                    'limit' => $CNF['MAX_JOTS_BY_DEFAULT'],
                    'area' => $sArea,
                ];

                $iLastUnreadJotId = $iUnreadJotsNumber = 0;
                $aUnreadInfo = $this->_oModule->_oDb->getNewJots($this->_iProfileId, $iLotId);
                if (!empty($aUnreadInfo)) {
                    $iLastUnreadJotId = (int)$aUnreadInfo[$CNF['FIELD_NEW_JOT']];
                    $iUnreadJotsNumber = (int)$aUnreadInfo[$CNF['FIELD_NEW_UNREAD']];
                }

                $aParamsBrowse = array_merge($aParamsBrowse, [
                    'start' => $iStart,
                    'limit' => $CNF['MAX_JOTS_BY_DEFAULT'],
                ]);
                $mixedContent = $this->_oModule->_oDb->getJotsByLotIdApi($aCriteria);
                break;
        }

        $aResult = [];
        if (is_array($mixedContent) && $mixedContent){
            $oMenu = BxTemplMenu::getObjectInstance($CNF['OBJECT_MENU_JOT_MENU']);

            $sStorage = $CNF['OBJECT_STORAGE'];
            $oStorage = new BxMessengerStorage($sStorage);

            foreach($mixedContent as &$aJot) {
                $iJotId = $aJot[$CNF['FIELD_MESSAGE_ID']];

                $this->_oModule->_oDb->readMessage($iJotId, $this->_iProfileId);

                $aFiles = [];
                if ($mixedFiles = $this->_oModule->_oDb->getJotFiles($iJotId))
                    foreach($mixedFiles as &$aFile) {
                        if ($oStorage->isImageFile($aFile[$CNF['FIELD_ST_TYPE']]))
                            $aFiles[] = bx_api_get_image($sStorage, (int)$aFile[$CNF['FIELD_ST_ID']]);
                    }

                $aReactions = [];
                if(($oReactions = BxDolVote::getObjectInstance($CNF['OBJECT_JOTS_RVOTES'], $iJotId)) && $oReactions->isEnabled()) {
                    $aReactionsOptions = [];
                    $aReactions = $oReactions->getElementApi($aReactionsOptions);
                }

                $oMenu->setContentId($iJotId);

                $sReplyMessage = '';
                if(($iReply = (int)$aJot['reply']) != 0) {
                    $aReply = $this->_oModule->_oDb->getJotById($iReply);
                    if(!empty($aReply) || is_array($aReply))
                        $sReplyMessage = $aReply[$CNF['FIELD_MESSAGE']];
                }

                $aResult[] = array_merge($aJot, [
                    $CNF['FIELD_MESSAGE_FK'] => $aOptions['lot'],
                    $CNF['FIELD_MESSAGE'] => $aJot[$CNF['FIELD_MESSAGE']],
                    'author_data' => BxDolProfile::getData($aJot[$CNF['FIELD_MESSAGE_AUTHOR']]),
                    'reactions' => $aReactions,
                    'menu' => $oMenu->getCodeAPI(),
                    'files' => $aFiles,
                    'reply_message' => $sReplyMessage
                ]);
            }
        }

        return [
            'code' => 0,
            'jots' => $aResult,
            'params' => $aParamsBrowse,
            'unread_jots' => $iUnreadJotsNumber,
            'last_unread_jot' => $iLastUnreadJotId
        ];
    }

    public function serviceGetSendForm($sParams = '')
    {
        if (!$this->_oModule->isLogged())
            return ['code' => 1, 'msg' => _t('_bx_messenger_not_logged')];

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = BxBaseFormView::getObjectInstance($CNF['OBJECT_API_FORM_NAME'], $CNF['OBJECT_API_FORM_NAME']);

        if ($sParams)
            $aOptions = json_decode($sParams, true);

        if (!empty($aOptions)){
            if (isset($aOptions['action']) && $aOptions['action'] === 'edit' && isset($aOptions['id']) && (int)$aOptions['id']){
                $aJotInfo = $this->_oModule->_oDb->getJotById((int)$aOptions['id']);
                if ($this->_isAvailable($aJotInfo[$CNF['FIELD_MESSAGE_FK']])){
                    $oForm->aInputs['message_id']['value'] = $aJotInfo[$CNF['FIELD_MESSAGE_ID']];
                    $oForm->aInputs['action']['value'] = 'edit';
                    $oForm->aInputs['message']['value'] = $aJotInfo[$CNF['FIELD_MESSAGE']];
                }
            }
        }

        if ($oForm->isSubmittedAndValid()){
            
           /*   if (isset($aOptions['convo_id'])){
                 $oForm->aInputs['id']['value'] = $aOptions['convo_id'];
            }     */
            if (isset($aOptions['reply_id'])){
                 $oForm->aInputs['reply']['value'] = $aOptions['reply_id'];
            } 
        
            $iLotId = 0 ;
            $mixedLotId = bx_get('id');
            
            if (!$mixedLotId){
                $mixedLotId = $oForm->aInputs['id']['value'] = $aOptions['convo_id'];
            }
            
            if ($mixedLotId)
                $iLotId = $this->_oModule->_oDb->getConvoByHash($mixedLotId);

            $aLotInfo = $this->_oModule->_oDb->getLotInfoById($iLotId);
            if (!empty($aLotInfo) && !$this->_isAvailable($iLotId))
                return ['code' => 1, 'msg' => _t('_bx_messenger_not_participant')];


            $aData = [
                'lot' => $iLotId, 
                'message' => bx_get('message')
            ];

           /* if(($iReply = bx_get('reply')) !== false)
                $aData['reply'] = (int)$iReply;*/
            if (isset($aOptions['reply_id'])){
                  $aData['reply'] = $aOptions['reply_id'];
            } 

            if(($mixPayload = bx_get('payload')) !== false && !$aData['lot']) {
                $aData = array_merge($aData, json_decode($mixPayload, true));
                if(isset($aData['participants']) && !in_array($this->_iProfileId, $aData['participants']))
                    $aData['participants'][] = $this->_iProfileId;
            }

            if(($mixedFiles = bx_get('files')) !== false && !empty($mixedFiles))
                $aData['files'] = explode(',', $mixedFiles);

            $iMessageId = bx_get('message_id');
            $sAction = bx_get('action');
            if ($iMessageId && $sAction === 'edit') {
                $aJotInfo = $this->_oModule->_oDb->getJotById($iMessageId);
                if (empty($aJotInfo))
                    return ['code' => 1, 'msg' => _t('_Empty')];

                if (!$this->_isAvailable($aJotInfo[$CNF['FIELD_MESSAGE_FK']]))
                    return ['code' => 1, 'msg' => _t('_bx_messenger_not_participant')];

                $sMessage = $this->_oModule->prepareMessageToDb($aData['message']);
                $mixedResult = $this->_oModule->_oDb->isAllowedToEditJot($iMessageId, $this->_iProfileId);
                if ($mixedResult !== true)
                    return ['code' => 1, 'msg' => $mixedResult];

                if (!empty($aData['files'])) {
                    $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
                    $aFilesNames = [];
                    foreach($aData['files'] as &$iFileId) {
                        $aFile = $oStorage->getFile($iFileId);
                        if (empty($aFile))
                            continue;

                        $aFilesNames[] = $aFile[$CNF['FIELD_ST_NAME']];
                        $this->_oModule->_oDb->updateFiles($iFileId, array(
                            $CNF['FIELD_ST_JOT'] => $iMessageId,
                        ));
                        $oStorage->afterUploadCleanup($iFileId, $this->_iProfileId);
                    }

                    $aFilesData = [];
                    if (!empty($aJotInfo[$CNF['FIELD_MESSAGE_AT']]))
                        $aFilesData = @unserialize($aJotInfo[$CNF['FIELD_MESSAGE_AT']]);

                    if (!empty($aFilesNames))
                        $aFilesData[BX_ATT_TYPE_FILES] = ( isset($aFilesData[BX_ATT_TYPE_FILES]) ? $aFilesData[BX_ATT_TYPE_FILES] : [] ) + $aFilesNames;

                    $this->_oModule->_oDb->updateJot($iMessageId, $CNF['FIELD_MESSAGE_AT'], @serialize($aFilesData));
                }

                if ($sMessage && $this->_oModule->_oDb->editJot($iMessageId, $this->_iProfileId, $sMessage)) {
                    $this->_oModule->onUpdateJot($aJotInfo[$CNF['FIELD_MESSAGE_FK']], $iMessageId, $aJotInfo[$CNF['FIELD_MESSAGE_AUTHOR']]);
                    $this->_pusherData('convo_' . $aLotInfo['hash'], ['convo' => $iLotId, 'action' => 'edited', 'data' => $this->serviceGetConvoMessages(['jot' => $iMessageId, 'load' => 'ids'])]);
                    //$this->_pusherData('edit-message', ['convo' => $iLotId, 'message' => $iMessageId]);
                    return ['code' => 0, 'jot_id' => $iMessageId];
                }

                return ['code' => 1];
            }

            $aResult = $this->_oModule->sendMessage($aData);
            $aResult['time'] = bx_get('payload');
           //$this->_pusherData('new-message', ['convo' => $iLotId, 'message' => $aResult['jot_id']]);
            $this->_pusherData('convo_' . $aLotInfo['hash'], ['convo' => $iLotId, 'action' => 'added', 'data' => $this->serviceGetConvoMessages(['jot' => $aResult['jot_id'], 'load' => 'ids'])]);
            
            $aParticipantsList = $this->_oModule->_oDb->getParticipantsList($iLotId, true);
            foreach($aParticipantsList as $iProfile){
                $this->_pusherData('profile_' . $iProfile, ['convo' => $iLotId]);
            }

            return $aResult;
        }

        return $oForm->getCodeAPI();
    }

    /*
     * Get participants list by lot ID.
     */
    public function serviceGetPartsList($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $iLotId = isset($aOptions['lot']) ? (int)$aOptions['lot'] : 0;
        if(!$iLotId || !($bAllowed = $this->_oModule->_oDb->isAuthor($iLotId, $this->_iProfileId) || $this->_oModule->_oConfig->isAllowedAction(BX_MSG_ACTION_ADMINISTRATE_TALKS, $this->_iProfileId) === true))
            return ['code' => 1];
        
        $aIds = $this->_oModule->_oDb->getParticipantsList($iLotId);
        if(empty($aIds) || !is_array($aIds))
            return ['code' => 2];

        $aResult = [];
        foreach($aIds as $iId)
            $aResult[] = BxDolProfile::getData($iId);
        
        return $aResult;
    }

    public function serviceSavePartsList($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $aResult = ['code' => 1];
        if (!$sParams || !isset($aOptions['parts']))
            return $aResult;

        if(!in_array($this->_iProfileId, $aOptions['parts']))
            $aOptions['parts'][] = $this->_iProfileId;

        $aResult = $this->_oModule->saveParticipantsList($aOptions['parts'], (isset($aOptions['id']) ? $aOptions['id'] : 0));
        if(!isset($aResult['lot']))
            return $aResult;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $aLot = $this->_oModule->_oDb->getLotInfoById($aResult['lot']);
        $aItems = $this->_oModule->_oTemplate->getLotsPreview($this->_iProfileId, [$aLot]);            
        if(!empty($aItems) && is_array($aItems))
            $aResult = array_merge($aResult, [
                'convo' => $this->_unitLot($aLot, current($aItems)),
                'lot' => $aLot[$CNF['FIELD_HASH']]
            ]);

        return $aResult;
    }

    public function serviceSearchUsers($sParams)
    {
        $aOptions = json_decode($sParams, true);
        $aResult = ['code' => 1];
        $aUsers = [];
        if (!$sParams || !isset($aOptions['term']))
            return $aResult;

        $aFoundProfile = $this->_oModule->searchProfiles($aOptions['term'], isset($aOptions['except']) ? $aOptions['except'] : []);
        if (!empty($aFoundProfile)){
            foreach($aFoundProfile as &$aProfile) {
                $oModule = BxDolModule::getInstance($aProfile['module']);
                $oPCNF = &$oModule->_oConfig->CNF;
                $aData = $oModule->_oDb->getContentInfoById($aProfile['id']);
                $oProfile = BxDolProfile::getInstanceByContentAndType($aProfile['id'], $aProfile['module']);
                $aUsers[] = $aProfile['author_data'];
            }
        }

        return $aUsers;
    }

    public function serviceSearchLots($sParams)
    {
        $aOptions = json_decode($sParams, true);

        $sTerm = isset($aOptions['term']) ? $aOptions['term'] : '';
        $iStarred = isset($aOptions['starred']) ? (int)$aOptions['starred'] : 0;

        $aJots = [];
        $aLots = $this->_oModule->_oDb->getMyLots($this->_iProfileId, ['term' => $sTerm, 'star' => (bool)$iStarred], $aJots);
        if(empty($aLots) || !is_array($aLots))
            return [];

        $aResult = [
            'lots' => [],
            'search_list' => []
        ];

        $aItems = $this->_oModule->_oTemplate->getLotsPreview($this->_iProfileId, $aLots);
        foreach($aItems as $iKey => $aItem)
            $aResult['lots'][] = $this->_unitLot($aLots[$iKey], $aItem);

        if(!empty($aJots['jots_list']) && is_array($aJots['jots_list'])) {
            foreach($aJots['jots_list'] as $iJot => $iLot) {
                if(!isset($aResult['search_list'][$iLot]))
                    $aResult['search_list'][$iLot] = [
                        'id' => $iLot,
                        'jots' => []
                    ];

                $aResult['search_list'][$iLot]['jots'][] = $iJot;
            }
            
            if(!empty($aResult['search_list']))
                $aResult['search_list'] = array_values($aResult['search_list']);
        }

        return $aResult;
    }

    public function serviceRemoveJot($sParams = '')
    {
        $aOptions = json_decode($sParams, true);

        $iJotId = isset($aOptions['jot_id']) ? (int)$aOptions['jot_id'] : 0;
        $iLotId = isset($aOptions['lot_id']) ? $aOptions['lot_id'] : 0;
        if(!$iJotId)
            return [];
        $iLotId2 = $this->_oModule->_oDb->getConvoByHash($iLotId);
        $this->_pusherData('convo_' . $iLotId, ['convo' => $iLotId2, 'action' => 'deleted', 'data' => $iJotId]);

        return $this->_oModule->serviceDeleteJot($iJotId, true);
    }

    protected function _unitProfile($iProfileId, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return '';

        $sModule = $oProfile->getModule();
        $iContentId = $oProfile->getContentId();
        $oModule = BxDolModule::getInstance($sModule);

        $aData = $oModule->_oDb->getContentInfoById($iContentId);
        $oPCNF = &$oModule->_oConfig->CNF;

        $aResult = [
            'id' => $iContentId,
            'module' => $sModule,
            'title' => $oProfile->getDisplayName(),
            'url' => bx_api_get_relative_url($oProfile->getUrl()),
            'image' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_PICTURE']]),
            'cover' => bx_api_get_image($oPCNF['OBJECT_STORAGE'], $aData[$oPCNF['FIELD_COVER']]),
        ];

        $sKey = 'OBJECT_MENU_SNIPPET_META';
        if(!empty($CNF[$sKey]) && ($oMetaMenu = BxDolMenu::getObjectInstance($CNF[$sKey], $oModule->_oTemplate)) !== false) {
            $oPrivacy = BxDolPrivacy::getObjectInstance($oPCNF['OBJECT_PRIVACY_VIEW']);
            $bPrivacy = $oPrivacy !== false;

            $bPublic = !$bPrivacy || $oPrivacy->check($iContentId) || $oPrivacy->isPartiallyVisible($aData[$CNF['FIELD_ALLOW_VIEW_TO']]);

            $oMetaMenu->setContentModule($sModule);
            $oMetaMenu->setContentId($iContentId);
            $oMetaMenu->setContentPublic($bPublic);

            $aResult['meta'] = $oMetaMenu->getCodeAPI();
        }

        return $aResult;
    }

    protected function _unitLot($aLot, $aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aParticipants = [];
        if(!empty($aItem[$CNF['FIELD_PARTICIPANTS']])) {
            $aPartIds = explode(',', $aItem[$CNF['FIELD_PARTICIPANTS']]);
            foreach($aPartIds as $iPartId)
                $aParticipants[] = BxDolProfile::getData($iPartId);
        }

        $sImageUrl = bx_api_get_relative_url($aItem['bx_if:user']['content']['icon']);

        return [
            'author_data' => (int)$aItem[$CNF['FIELD_AUTHOR']] ? BxDolProfile::getData($aItem[$CNF['FIELD_AUTHOR']]) : [
                'id' => 0,
                'display_type' => 'unit',
                'display_name' => $aItem['bx_if:user']['content']['talk_type'],
                'url' => $sImageUrl,
                'url_avatar' => $sImageUrl,
                'module' => isset($aItem['author_module']) ? $aItem['author_module'] : 'bx_pages',
            ],
            'participants' => $aParticipants,
            'title' => $aItem[$CNF['FIELD_TITLE']],
            'message' => $aItem['bx_if:user']['content']['message'],
            'date' => $aItem['bx_if:timer']['content']['time'],
            'id' => $aLot[$CNF['FIELD_HASH']],
            'id2' => $aItem[$CNF['FIELD_ID']],
            'unread' => $aItem['count'],
            'total_messages' => $this->_oModule->_oDb->getJotsNumber($aItem[$CNF['FIELD_ID']], 0)
        ];
    }

    protected function _pusherData($sAction, $aData = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oSockets = BxDolSockets::getInstance();

        if(!empty($aData['convo'])) {
            $aLotInfo = $this->_oModule->_oDb->getLotInfoById($aData['convo']);
            $aData['id'] = $aLotInfo[$CNF['FIELD_HASH']];
        }

        $aData['user_id'] = $this->_iProfileId;

        if($oSockets->isEnabled() && $sAction && !empty($aData)) {
            $oSockets->sendEvent('bx', 'messenger', $sAction, $aData);
        }
    }

    protected function _isAvailable($iLotId)
    {
        if(!$iLotId)
            return false;

        $CNF = &$this->_oModule->_oConfig->CNF;

        $aLotInfo = $this->_oModule->_oDb->getLotInfoById($iLotId);
        if(!empty($aLotInfo) && !$this->_oModule->_oDb->isParticipant($iLotId, $this->_iProfileId) && $aLotInfo[$CNF['FIELD_TYPE']] == BX_IM_TYPE_PRIVATE)
            return false;

        return true;
    }

    public function log($mixedContents, $sSection = '', $sTitle = '')
    {
        if(is_array($mixedContents))
            $mixedContents = var_export($mixedContents, true);	
        else if(is_object($mixedContents))
            $mixedContents = json_encode($mixedContents);

        if(empty($sSection))
            $sSection = "Core";

        $sTitle .= "\n";

        bx_log($this->_sModule, ":\n[" . $sSection . "] " . $sTitle . $mixedContents);
    }
}

/** @} */
