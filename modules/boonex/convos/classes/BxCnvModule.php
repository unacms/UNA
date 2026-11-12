<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Convos Convos
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_CNV_FOLDER_INBOX', 1);
define('BX_CNV_FOLDER_DRAFTS', 2);
define('BX_CNV_FOLDER_SPAM', 3);
define('BX_CNV_FOLDER_TRASH', 4);

/**
 * Conversations module
 */
class BxCnvModule extends BxBaseModTextModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    public function sortCollaborators ($aCollaborators, $iProfileIdLastComment, $iProfileIdAuthor, $iProfileIdCurrent = 0)
    {
        if (!$iProfileIdCurrent)
            $iProfileIdCurrent = bx_get_logged_profile_id();

        $aMoveUp = array($iProfileIdCurrent, $iProfileIdLastComment, $iProfileIdAuthor);

        asort($aCollaborators, SORT_NUMERIC);

        foreach ($aMoveUp as $iProfileId) {
            if (!isset($aCollaborators[$iProfileId]))
                continue;

            $a = array($iProfileId => $aCollaborators[$iProfileId]);
            unset($aCollaborators[$iProfileId]);
            $aCollaborators = $a + $aCollaborators;
        }

        return $aCollaborators;
    }

    public function setModuleSubmenu ($iCurrentFolderId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        $aMapFolderId2MenuName = array (
            BX_CNV_FOLDER_INBOX => 'convos-folder-inbox',
            BX_CNV_FOLDER_DRAFTS => 'convos-drafts',
            BX_CNV_FOLDER_SPAM => 'convos-spam',
            BX_CNV_FOLDER_TRASH => 'convos-trash',
        );

        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if (!$oMenuSubmenu)
            return;

        $oMenuSubmenu->setObjectSubmenu($CNF['OBJECT_MENU_SUBMENU'], array (
            'title' => _t('_bx_cnv'),
            'link' => BX_DOL_URL_ROOT . $CNF['URL_HOME'],
            'icon' => '',
        ));

        $oMenuModule = BxDolMenu::getObjectInstance($CNF['OBJECT_MENU_SUBMENU']);
        if ($oMenuModule && isset($aMapFolderId2MenuName[$iCurrentFolderId]))
            $oMenuModule->setSelected($this->_aModule['name'], $aMapFolderId2MenuName[$iCurrentFolderId]);
    }

    /**
     * Mark conversation as unread for the current user
     * @return error string on error, or empty string on success
     */
    public function markUnread ($iContentId)
    {
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return _t('_sys_request_page_not_found_cpt');

        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->checkAllowedView($aContentInfo)))
            return $sMsg;

        if (!$this->_oDb->updateReadComments(bx_get_logged_profile_id(), (int)$iContentId, -1))
            return _t('_error occured');

        return '';
    }

    /**
     * Delete conversation for current user by content id, before deletetion it checks user permission to delete convos
     * @return error string on error, or empty string on success
     */
    public function deleteConvo ($iContentId)
    {
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return _t('_sys_request_page_not_found_cpt');

        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = $this->checkAllowedDelete($aContentInfo)))
            return $sMsg;

        if (!$this->_oDb->moveConvo((int)$iContentId, bx_get_logged_profile_id(), BX_CNV_FOLDER_TRASH))
            return _t('_error occured');

        return '';
    }

    /**
     * Delete whole conversation for all users by content id
     * @return error string on error, or empty string on success
     */
    public function deleteConvoForever ($iContentId)
    {
        return $this->_oDb->deleteConvo((int)$iContentId);
    }

    public function actionMarkUnread($iContentId)
    {
        header('Content-Type:text/plain; charset=utf-8');

        if ($s = $this->markUnread ($iContentId)) {
            echo $s;
            exit;
        }

        echo BX_DOL_URL_ROOT . $this->_oConfig->CNF['URL_HOME'];
        exit;
    }

    public function actionDelete($iContentId)
    {
        header('Content-Type:text/plain; charset=utf-8');

        if ($s = $this->deleteConvo ($iContentId)) {
            echo $s;
            exit;
        }

        echo BX_DOL_URL_ROOT . $this->_oConfig->CNF['URL_HOME'];
        exit;
    }

    /**
     * Display convos in folder
     */
    public function actionFolder ($iFolderId)
    {
        $oTemplate = BxDolTemplate::getInstance();

        $aFolder = $this->_oDb->getFolder((int)$iFolderId);
        $oPage = BxDolPage::getObjectInstance('bx_convos_home');

        if (!$aFolder || !$oPage) {
            $oTemplate->displayPageNotFound();
            exit;
        }

        // add replaceable markers
        $oPage->addMarkers(array(
            'folder_id' => (int)$iFolderId,
            'folder' => _t($aFolder['name']),
        ));

        $s = $oPage->getCode();

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageNameIndex (BX_PAGE_DEFAULT);
        $oTemplate->setPageContent ('page_main_code', $s);
        $_GET['i']='convos-folder'; // #1148
        $oTemplate->getPageCode();
    }

    /**
     * Get possible recipients for start conversation form
     */
    public function actionAjaxGetRecipients ()
    {
        $sTerm = bx_get('term');

        $a = BxDolService::call('system', 'profiles_search', array($sTerm), 'TemplServiceProfiles');

        header('Content-Type:text/javascript; charset=utf-8');
        echo(json_encode($a));
    }

    public function serviceGetSafeServices()
    {
        return array (
            // other
            'ModuleIcon' => '',
            'GetLink' => '',
            // forms
            'GetCreatePostForm' => '',
            'EntityEdit' => '',
            'EntityDelete' => '',
            // page blocks
            'EntityTextBlock' => '',
            'EntityInfo' => '',
            'EntityComments' => '',
            'EntityAttachments' => '',
            // menu
            'EntityAllActions' => '',
            'EntityActions' => '',
            'MyEntriesActions' => '',
            // own methods
            'ConversationsInFolder' => '',
        );
    }

    public function serviceIsAllowedContact($iProfileId)
    {
        return $this->checkAllowedContact($iProfileId) === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * @page service Service Calls
     * @section bx_convos Conversations
     * @subsection bx_convos-page_blocks Page Blocks
     * @subsubsection bx_convos-conversations_in_folder conversations_in_folder
     * 
     * @code bx_srv('bx_convos', 'conversations_in_folder', [...]); @endcode
     * 
     * Display conversations in particulr folder for currently logged-in user
     * @param $iFolderId folder ID
     * 
     * @see BxCnvModule::serviceConversationsInFolder
     */
    /** 
     * @ref bx_convos-conversations_in_folder "conversations_in_folder"
     */
    public function serviceConversationsInFolder ($iFolderId = BX_CNV_FOLDER_INBOX)
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->CNF['OBJECT_GRID']);
        if (!$oGrid)
            return false;

        $aFolder = $this->_oDb->getFolder((int)$iFolderId);
        if (!$aFolder)
            return false;

        $this->setModuleSubmenu ((int)$iFolderId);

        // TODO: incorporate markers into custom class, so replace will work in search and so on
        $oGrid->addMarkers(array(
            'folder_id' => (int)$iFolderId,
            'profile_id' => bx_get_logged_profile_id(),
        ));

        $this->_oTemplate->addCss(array('manage_tools.css'));
        $this->_oTemplate->addJs(array('manage_tools.js'));
        $this->_oTemplate->addJsTranslation(array('_sys_grid_search'));
        
        return $this->_oTemplate->getJsCode('manage_tools', array('sObjNameGrid' => $this->_oConfig->CNF['OBJECT_GRID'])) . $oGrid->getCode();
    }

    public function serviceMessagesPreviews ($iProfileId = 0, $bEmptyMessage = true)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        $a = $this->_oDb->getMessagesPreviews($iProfileId, 0, (int)getParam('bx_convos_preview_messages_num'));
        if((empty($a) || !is_array($a)) && !$bEmptyMessage)
            return '';

        return $this->_oTemplate->getMessagesPreviews($a);
    }

    /**
     * Returns preview of profile's conversations with statistic for React Jot
     * @param int $iProfileId
     * @param int $iStart
     * @param int $iPerPage
     * @param int $iFolderId
     * @return mixed
     */
    public function serviceGetMessagesPreviews ($iProfileId = 0, $iStart = 0, $iPerPage = 10, $iFolderId = BX_CNV_FOLDER_INBOX)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->_oDb->getMessagesPreviews($iProfileId, (int)$iStart, (int)$iPerPage, $iFolderId);
    }

    /**
     * Whether the apps' menu's Messages item (sys_apps_menu) is Conversations': not while Messenger is enabled,
     * whose own Messages item takes its place (menu item visibility_custom).
     * @return boolean
     */
    public function serviceIsMessagesMenuItemShown()
    {
        return !BxDolModuleQuery::getInstance()->isEnabledByName('bx_messenger');
    }

    /**
     * Get number of unread messages for spme profile
     * @param $iProfileId - profile to get unread messages for, if omitted then currently logged is profile is used
     * @return integer
     */
    public function serviceGetUnreadMessagesNum ($iProfileId = 0)
    {
        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->_oDb->getUnreadMessagesNum((int)$iProfileId);
    }

    public function serviceGetLiveUpdates($aMenuItemParent, $aMenuItemChild, $iCount = 0)
    {
        $iProfileId = (int)bx_get_logged_profile_id();
        $iCountNew = $this->_oDb->getUnreadMessagesNum($iProfileId);
        if($iCountNew == $iCount)
			return false;

        return array(
    		'count' => $iCountNew, // required
    		'method' => 'bx_menu_show_live_update(oData)', // required
    		'data' => array(
    			'code' => BxDolTemplate::getInstance()->parseHtmlByTemplateName('menu_item_addon', array(
    				'content' => '{count}'
                )),
                'mi_parent' => $aMenuItemParent,
                'mi_child' => $aMenuItemChild
    		),  // optional, may have some additional data to be passed in JS method provided using 'method' param above.
    	);
    }

    /**
     * Update last comment time and author
     */
    public function serviceTriggerCommentPost ($iContentId, $iProfileId, $iCommentId, $iTimestamp = 0, $sCommentText = '')
    {
        $CNF = &$this->_oConfig->CNF;
        
        if (!(int)$iContentId)
            return false;
        $aContentInfo = $this->_oDb->getContentInfoById((int)$iContentId);
        if (!$aContentInfo)
            return false;

        // add author to the list of collaborators when somebody replies
        // if author is removed from collaborators
        // of if authot placed message to trash
        $aCollaborators = $this->_oDb->getCollaborators($aContentInfo[$CNF['FIELD_ID']]);
        if (!isset($aCollaborators[$aContentInfo[$CNF['FIELD_AUTHOR']]]) || BX_CNV_FOLDER_TRASH == $this->_oDb->getConversationFolder($aContentInfo[$CNF['FIELD_ID']], $aContentInfo[$CNF['FIELD_AUTHOR']])) {
            $oFormsHelper = $this->serviceFormsHelper ();
            $oForm = $oFormsHelper->getObjectFormEdit();
            $oForm->updateParticipants($aContentInfo[$CNF['FIELD_ID']], BX_CNV_FOLDER_INBOX, false, array($aContentInfo[$CNF['FIELD_AUTHOR']]));
        }


        $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContentId);
        if(!$oCmts)
            return false;
            
        if (!$iTimestamp)
            $iTimestamp = time();

        if ($iProfileId == bx_get_logged_profile_id())
            $this->_oDb->updateReadComments($iProfileId, $aContentInfo[$CNF['FIELD_ID']], $aContentInfo[$CNF['FIELD_COMMENTS']]);

        if (!$this->_oDb->updateLastCommentTimeProfile((int)$iContentId, (int)$iProfileId, (int)$iCommentId, $iTimestamp))
            return false;

        // send notification to all collaborators
        if ($oProfile = BxDolProfile::getInstance($iProfileId)) {
            foreach ($aCollaborators as $iCollaborator => $iReadComments) {
                if ($iCollaborator == $iProfileId)
                    continue;
                sendMailTemplate('bx_cnv_new_reply', 0, $iCollaborator, array(
                    'SenderDisplayName' => $oProfile->getDisplayName(),
                    'SenderUrl' => $oProfile->getUrl(),
                    'PageUrl' => $oCmts->getItemUrl($iCommentId),
                    'PageTitle' => $oCmts->getObjectTitle(),
                    'Message' => $sCommentText,
                ), BX_EMAIL_NOTIFY, true);
            }
        }

        return true;
    }

    /**
     * Create entry form
     * @return HTML string
     */
    public function serviceEntityCreate ($sParams = false)
    {
        $sProfilesIds = bx_get('profiles');
        if($sProfilesIds !== false) {
            $sDiv = ',';
            $aIds = explode($sDiv, $sProfilesIds);

            $aIdsAllowed = array();
            foreach($aIds as $iId)
                if($this->checkAllowedContact($iId) === CHECK_ACTION_RESULT_ALLOWED)
                    $aIdsAllowed[] = $iId;

            if(empty($aIdsAllowed))
                return MsgBox(_t('_sys_txt_access_denied'));
            
            bx_set('profiles', implode($sDiv, $aIdsAllowed));
        }

        return parent::serviceEntityCreate();
    }

    /**
     * Entry collaborators block
     */
    public function serviceEntityCollaborators ($iContentId = 0)
    {
        if (!$iContentId)
            $iContentId = bx_process_input(bx_get('id'), BX_DATA_INT);
        if (!$iContentId)
            return false;
        $aContentInfo = $this->_oDb->getContentInfoById($iContentId);
        if (!$aContentInfo)
            return false;

        return $this->_oTemplate->entryCollaborators ($aContentInfo, 5);
    }

    /**
     * No social sharing for private conversations
     */
    public function serviceEntitySocialSharing ($mixedContent = false, $aParams = array())
    {
        return '';
    }

    /**
     * Delete content entry
     * @param $iContentId content id 
     * @return error message or empty string on success
     */
    public function serviceDeleteEntity ($iContentId, $sFuncDelete = 'deleteData')
    {
        return $this->_oDb->deleteConvo($iContentId);
    }
    
    /**
     * Delete profile from all conversation (when profile is delete without content)
     * @param $iProfileId profile id 
     * @return number of deleted items
     */    
    public function serviceRemoveCollaboratorFromAllConversations ($iProfileId)
    {
        return $this->_oDb->removeCollaboratorFromAllConversations((int)$iProfileId);
    }
    
    /**
     * Delete all content by profile (when profile is delete with content)
     * @param $iProfileId profile id 
     * @return number of deleted items
     */
    public function serviceDeleteEntitiesByAuthor ($iProfileId)
    {
        $a = $this->_oDb->getEntriesByAuthor((int)$iProfileId);
        if (!$a)
            return 0;

        $iCount = 0;
        foreach ($a as $aContentInfo)
            $iCount += ('' == $this->serviceDeleteEntity($aContentInfo[$this->_oConfig->CNF['FIELD_ID']]) ? 1 : 0);

        return $iCount;
    }
    
    /**
     * No moderators for personal convos
     */
    public function _isModerator ($isPerformAction = false)
    {
        return false;
    }

    /**
     * No thumbs for convos
     */
    public function checkAllowedSetThumb ($iContentId = 0)
    {
        return _t('_sys_txt_access_denied');
    }

    /**
     * There is no 'moderator' access in convos
     */
    public function checkAllowedEditAnyEntry ($isPerformAction = false)
    {
    	return _t('_sys_txt_access_denied');
    }

    public function checkAllowedEditAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
    	return _t('_sys_txt_access_denied');
    }
	
	public function checkAllowedDeleteAnyEntryForProfile ($isPerformAction = false, $iProfileId = false)
    {
        return _t('_sys_txt_access_denied');
    }

    public function checkAllowedEdit ($aDataEntry, $isPerformAction = false)
    {       
        if ($aDataEntry[$this->_oConfig->CNF['FIELD_ALLOW_EDIT']] && $this->isCollaborator($aDataEntry, bx_get_logged_profile_id()))
            return CHECK_ACTION_RESULT_ALLOWED;

        return parent::checkAllowedEdit ($aDataEntry, $isPerformAction);
    }
    
    /**
     * Conversations can be deleted by author and/or collaborators only.
     * Admins can't delete conversations, since it's designed for participant only, it's moved to trash actually, also it's private content.
     */
    public function checkAllowedDelete (&$aDataEntry, $isPerformAction = false)
    {
        if ($aDataEntry[$this->_oConfig->CNF['FIELD_AUTHOR']] == $this->_iProfileId || $this->isCollaborator($aDataEntry, bx_get_logged_profile_id()))
            return CHECK_ACTION_RESULT_ALLOWED;

        if ($this->_isModerator($isPerformAction))
            return _t('_sys_txt_access_denied');

        return parent::checkAllowedDelete ($aDataEntry, $isPerformAction);
    }

    /**
     * Only collaborators can view convo
     */
    public function checkAllowedView ($aDataEntry, $isPerformAction = false)
    {
        return $this->serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction);
    }

    /**
     * Checks whether contact is allowed.
     * @param integer $iProfileId - recipient profile ID
     * @param boolean $isPerformAction - perform or just check the action
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedContact($iProfileId, $isPerformAction = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if(!$oProfile)
            return _t('_sys_txt_access_denied');

        $mixedResult = $oProfile->checkAllowedProfileContact();
        if($mixedResult !== CHECK_ACTION_RESULT_ALLOWED)
            return _t('_sys_txt_access_denied');

        return $this->checkAllowedAdd($isPerformAction);
    }

    public function serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction = false, $iProfileId = false)
    {
        if (CHECK_ACTION_RESULT_ALLOWED !== ($sMsg = parent::serviceCheckAllowedViewForProfile ($aDataEntry, $isPerformAction, $iProfileId)))
            return $sMsg;

        if (!$iProfileId)
            $iProfileId = bx_get_logged_profile_id();

        return $this->isCollaborator($aDataEntry, $iProfileId) ? CHECK_ACTION_RESULT_ALLOWED : _t('_sys_txt_access_denied');
    }

    protected function isCollaborator($aDataEntry, $iProfileId)
    {
        $aCollaborators = $this->_oDb->getCollaborators($aDataEntry[$this->_oConfig->CNF['FIELD_ID']]);
        return isset($aCollaborators[$iProfileId]);
    }

    public function serviceIsAllowedPostInContext()
    {
        return false;
    }
}

/** @} */
