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

/**
 * Create/Edit entry form
 */
class BxCnvFormEntry extends BxBaseModTextFormEntry
{
    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_convos';
        parent::__construct($aInfo, $oTemplate);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addJsTranslation(array(
            '_bx_cnv_draft_saving_error',
            '_bx_cnv_draft_saved_success',
        ));
    }

    public function update ($iContentId, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $CNF = $this->_oModule->_oConfig->CNF;
        if ($bRet = parent::update ($iContentId, $aValsToAdd, $aTrackTextFieldsChanges)) {
            $iFolder = $this->_oModule->_oDb->getConversationFolder($iContentId, bx_get_logged_profile_id());

            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
            if ($aContentInfo && bx_get_logged_profile_id() == $aContentInfo[$CNF['FIELD_AUTHOR']]) // allow to edit participants for author only
                $this->updateParticipants ($iContentId, $iFolder, $iFolder == BX_CNV_FOLDER_DRAFTS ? true : false);
        }

        return $bRet;
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $aValsToAdd['last_reply_timestamp'] = time();
        $aValsToAdd['last_reply_profile_id'] = bx_get_logged_profile_id();

        $bSaveToDrafts = bx_get('draft_save');
        $iContentId = (int)bx_get('draft_id');
        $bDraft = $iContentId ? BX_CNV_FOLDER_DRAFTS == $this->_oModule->_oDb->getConversationFolder($iContentId, bx_get_logged_profile_id()) : false;

        // check for spam
        $bSpam = false;
        $sValue = $this->getCleanValue($CNF['FIELD_TEXT']);
         /**
         * @hooks
         * @hookdef hook-system-check_spam 'system', 'check_spam' - hook on check spam in some content
         * - $unit_name - equals `system`
         * - $action - equals `check_spam` 
         * - $object_id - not used  
         * - $sender_id - account id for current user
         * - $extra_params - array of additional params with the following array keys:
         *      - `is_spam` - [bool] by ref, сontain spam content or not, can be overridden in hook processing
         *      - `content` - [string] by ref, content, can be overridden in hook processing
         *      - `where` - [string] module name
         * @hook @ref hook-system-check_spam
         */
        bx_alert('system', 'check_spam', 0, getLoggedId(), array(
            'is_spam' => &$bSpam, 
            'content' => &$sValue, 

            'is_spam_ref' => &$bSpam, 
            'content_ref' => &$sValue, 

            'where' => $this->MODULE
        ));
        self::setSubmittedValue($CNF['FIELD_TEXT'], $sValue, $this->aFormAttrs['method']);

        if($iContentId) {
            if(!$bDraft)
                return 0;

            if(!parent::update($iContentId, $aValsToAdd))
                return 0;

        } 
        else {
            
            $iContentId = parent::insert($aValsToAdd, $isIgnore);
            if(!$iContentId)
                return 0;
        }

        if($bSaveToDrafts) {
            if(!$bDraft)
                $this->_oModule->_oDb->conversationToFolder($iContentId, BX_CNV_FOLDER_DRAFTS, bx_get_logged_profile_id(), 0);

            // process uploaded files
            if(isset($CNF['FIELD_PHOTO']))
                $this->processFiles ($CNF['FIELD_PHOTO'], $iContentId, true);

            // draft is saved via ajax call only, upon successfull draft saving content id is returned
            echo $iContentId . ',' . $this->getCsrfToken();
            exit;
        } 
        else {
            $iFolder = $bSpam ? BX_CNV_FOLDER_SPAM : BX_CNV_FOLDER_INBOX;
            $this->updateParticipants ($iContentId, $iFolder, $bDraft);
        }

        return $iContentId;
    }

    public function updateParticipants ($iContentId, $iFolder, $bDraft, $aRecipientsAdd = array()) 
    {
        $iSender = bx_get_logged_profile_id();
        $aRecipientsOld = $this->_oModule->_oDb->getCollaborators($iContentId);

        // place conversation to "inbox" (or "spam" - in case of spam) folder
        $aRecipientsFormForm = $this->getCleanValue('recipients') ? $this->getCleanValue('recipients') : array();
        $aRecipients = array_unique(array_merge($aRecipientsFormForm, array($iSender), $aRecipientsAdd), SORT_NUMERIC);
        foreach ($aRecipients as $iProfile) {
            $oProfile = BxDolProfile::getInstance($iProfile);
            if(!$oProfile)
                continue;

            if($this->_oModule->checkAllowedContact($iProfile) !== CHECK_ACTION_RESULT_ALLOWED)
                continue;

            $iRecipient = $oProfile->id();
            if($bDraft && $iRecipient == $iSender)
                $this->_oModule->_oDb->moveConvo($iContentId, $iRecipient, $iFolder);
            else {
                if($iRecipient != $iSender) {
                    $bCanContact = true;
                    /**
                     * @hooks
                     * @hookdef hook-profile-check_contact 'profile', 'check_contact' - hook on check some profile to allow contact him
                     * - $unit_name - equals `profile`
                     * - $action - equals `check_contact` 
                     * - $object_id - not used  
                     * - $sender_id - not used
                     * - $extra_params - array of additional params with the following array keys:
                     *      - `can_contact` - [bool] by ref, can contact or not, can be overridden in hook processing
                     *      - `sender` - [int] profile_id for sender
                     *      - `recipient` - [int] profile_id for recipient 
                     *      - `where` - [string] module name
                     * @hook @ref hook-profile-check_contact
                     */
                    bx_alert('profile', 'check_contact', 0, false, array(
                        'can_contact' => &$bCanContact, 
                        'can_contact_ref' => &$bCanContact, 
                        'sender' => $iSender, 
                        'recipient' => $iRecipient, 
                        'where' => $this->MODULE
                    ));
                    if(!$bCanContact)
                        $iFolder = BX_CNV_FOLDER_SPAM;
                }

                if ($aRecipientsAdd && in_array($iRecipient, $aRecipientsAdd))
                    $this->_oModule->_oDb->removeCollaborator($iContentId, $iRecipient);

                $this->_oModule->_oDb->conversationToFolder($iContentId, $iFolder, $iRecipient, $iRecipient == $iSender ? 0 : -1);
            }
        }

        // remove participants
        foreach ($aRecipientsOld as $iProfileId => $iCount) {
            if (!in_array($iProfileId, $aRecipients))
                $this->_oModule->_oDb->removeCollaborator($iContentId, $iProfileId);
        }
    }

    protected function genCustomInputRecipients ($aInput)
    {
        $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . "modules/?r=convos/ajax_get_recipients";
        return $this->genCustomInputUsernamesSuggestions($aInput);
    }

    protected function genCustomInputSubmitText ($aInput)
    {
        $aVars = array();
        return $this->_oModule->_oTemplate->parseHtmlByName('form_submit_text.html', $aVars);
    }

    function initChecker ($aValues = array (), $aSpecificValues = array())
    {
        $CNF = $this->_oModule->_oConfig->CNF;

        $iLogged = bx_get_logged_profile_id();
        if ($aValues && $aValues[$CNF['FIELD_AUTHOR']] != $iLogged) { // unset some fields for non author
            unset($this->aInputs[$CNF['FIELD_ALLOW_EDIT']]);
            unset($this->aInputs['recipients']);
        }

        /*
         * If adding from draft, fill in existing fields info.
         */
        if (($iContentId = bx_get('draft_id')) && $this->_oModule->_oDb->getConversationFolder($iContentId, $iLogged) == BX_CNV_FOLDER_DRAFTS) {
            $aContentInfo = $this->_oModule->_oDb->getContentInfoById($iContentId);
            if ($aContentInfo)
                $aValues = array_merge($aContentInfo, $aValues);
        }

        if ($sProfilesIds = bx_get('profiles')) { // if writing directly to some recipients, pre-fill them
            $a = explode(',', $sProfilesIds);
            $a = array_unique(BxDolFormCheckerHelper::passInt($a));
            if ($a)
                $aValues['recipients'] = array_merge(empty($aValues['recipients']) ? array() : $aValues['recipients'], $a);            
        }

        $sEt = bx_get('et');
        if($sEt !== false) { // if 'attachable email template' was specified, process it
            $aEt = json_decode(base64_decode(urldecode($sEt)), true);

            if(!empty($aEt) && is_array($aEt) && !empty($aEt['name'])) {
                $sName = bx_process_input($aEt['name']);
                $aParams = isset($aEt['params']) ? bx_process_input($aEt['params']) : array();

                $sAet = getParam('sys_email_attachable_email_templates');
                if(strpos($sAet, $sName) !== false) {
                    $aTemplate = BxDolEmailTemplates::getInstance()->parseTemplate($sName, $aParams);
                    if(!empty($aTemplate) && is_array($aTemplate)) {
                        if(isset($this->aInputs[$CNF['FIELD_TITLE']]) && empty($this->aInputs[$CNF['FIELD_TITLE']]['value']))
                            $this->aInputs[$CNF['FIELD_TITLE']]['value'] = $aTemplate['Subject'];

                        if(isset($this->aInputs[$CNF['FIELD_TEXT']]) && empty($this->aInputs[$CNF['FIELD_TEXT']]['value']))
                            $this->aInputs[$CNF['FIELD_TEXT']]['value'] = $aTemplate['Body'];
                    }
                }
            }
            
        }

        return parent::initChecker ($aValues, $aSpecificValues);
    }

    function isValid ()
    {
        if (bx_get('draft_save')) // form is always valid when saving to drafts
            return true;
        return parent::isValid ();
    }

    public function processFiles ($sFieldFile, $iContentId = 0, $isAssociateWithContent = false)
    {
        if (!$isAssociateWithContent && bx_get('draft_id')) // when draft is already saved then db update is called but we still need to do association since it's draft
            $isAssociateWithContent = true; // TODO: if edit mode will be added, then this functionality maybe reconsidered
         
        return parent::processFiles ($sFieldFile, $iContentId, $isAssociateWithContent);
    }
}

class BxCnvFormEntryCheckerHelper extends BxDolFormCheckerHelper
{
    static public function checkRecipients($aIds)
    {
        $bResult = self::checkAvail($aIds);
        if(!$bResult)
            return $bResult;

        $oModule = BxDolModule::getInstance('bx_convos');

        $aIdsAllowed = array();
        foreach($aIds as $iId)
            if($oModule->checkAllowedContact($iId) === CHECK_ACTION_RESULT_ALLOWED)
                $aIdsAllowed[] = $iId;

        if(empty($aIdsAllowed)) 
            return false;

        return true;
    }
}

/** @} */
