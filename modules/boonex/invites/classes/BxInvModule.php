<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Invites Invites
 * @ingroup     UnaModules
 *
 * @{
 */

bx_import('BxDolAcl');

define('BX_INV_TYPE_FROM_MEMBER', 'from_member');
define('BX_INV_TYPE_FROM_SYSTEM', 'from_system');

class BxInvModule extends BxDolModule
{
    protected $_bIsApi;

    /**
     * Constructor
     */
    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_bIsApi = bx_is_api();

        $this->_oConfig->init($this->_oDb);
    }

    /**
     * ACTION METHODS
     */
    public function actionGetCode()
    {
        $aParams = $this->_prepareParamsGet();

        $this->serviceGetCode($aParams);
    }

    public function actionGetLink()
    {
        $aParams = $this->_prepareParamsGet();

        $this->serviceGetLink($aParams);
    }
    
    public function actionSetSeenMark($Code)
    {
        header('Content-Type: image/png');
        if (isset($Code) && trim($Code) != "")
            $this->_oDb->updateDateSeenForInvite($Code);
    }

    /**
     * SERVICE METHODS
     */
    
    public function serviceGetSafeServices()
    {
        return array (
            'GetBlockInvite' => '',
            'GetBlockInviteToContext' => '',
            'GetBlockFormInvite' => '',
            'GetBlockFormRequest' => '',
            'GetLink' => '',
            'GetCode' => '',
            'GetContextByCode' => ''
        );
    }

    public function serviceGetCode($aParams)
    {
        if($this->_bIsApi && is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        $iProfileId = $this->getProfileId();
        $iAccountId = $this->getAccountId($iProfileId);

        $mixedAllowed = $this->isAllowedInvite($iProfileId);
        if($mixedAllowed !== true)
            return echoJson(['message' => $mixedAllowed]);

        $iKeyLength = 0;
        $iKeyLifetime = $this->_oConfig->getKeyLifetime();

        $bContextAdmin = false;
        if(isset($aParams['aj_action'], $aParams['aj_params']) && $aParams['aj_action'] == 'invite_to_context' && ($iContextPid = (int)$aParams['aj_params']) != 0) {
            $iKeyLength = $this->_oConfig->getContextKeyLength();
            $bContextAdmin = ($oContext = BxDolProfile::getInstance($iContextPid)) !== false && bx_srv($oContext->getModule(), 'is_admin', [$iContextPid, $iProfileId]);
        }

        if(!isAdmin($iAccountId) && !$bContextAdmin && $this->_oConfig->getCountPerUser() <= 0)
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_limit_reached'))] : echoJson(['message' => _t('_bx_invites_err_limit_reached')]);

        $oKeys = BxDolKey::getInstance();
        if(!$oKeys)
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_not_available'))] : echoJson(['message' => _t('_bx_invites_err_not_available')]);

        $aKeyParams = [];
        if(!empty($aParams['key']))
            $aKeyParams['key'] = $aParams['key'];
        if(!empty($aParams['key_lifetime']))
            $iKeyLifetime = (int)$aParams['key_lifetime'];
        if($iKeyLength)
            $aKeyParams['length'] = $iKeyLength;

        if($aKeyParams)
            $sKey = $oKeys->getNewKeyExt(false, $iKeyLifetime, $aKeyParams);
        else
            $sKey = $oKeys->getNewKey(false, $iKeyLifetime);

        $this->getFormObjectInvite()->insert(array_merge([
            'account_id' => $iAccountId,
            'profile_id' => $iProfileId,
            'key' => $sKey,
            'multi' => 1,
            'date' => time()
        ], $aParams));
        $this->onInvite($iProfileId);

        $sLink = $this->getJoinLink($sKey);

        if($this->_bIsApi)
            return [
                'code' => $sKey,
                'link' => bx_api_get_relative_url($sLink)
            ];

        echoJson(['popup' => $this->_oTemplate->getCodePopup($sKey, $sLink)]);
    }

    function serviceGetLink($aParams)
    {
        $iProfileId = $this->getProfileId();
        $iAccountId = $this->getAccountId($iProfileId);

        $mixedAllowed = $this->isAllowedInvite($iProfileId);
        if($mixedAllowed !== true)
            return echoJson(array('message' => $mixedAllowed));

        if(!isAdmin($iAccountId)) {
            if($this->_oConfig->getCountPerUser() <= 0)
                return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_limit_reached'))] : echoJson(array('message' => _t('_bx_invites_err_limit_reached')));
        }

        $oKeys = BxDolKey::getInstance();
        if(!$oKeys)
            return $this->_bIsApi ? [bx_api_get_msg(_t('_bx_invites_err_not_available'))] : echoJson(array('message' => _t('_bx_invites_err_not_available')));

        $sKey = $oKeys->getNewKey(false, $this->_oConfig->getKeyLifetime());

        $this->getFormObjectInvite()->insert(array_merge([
            'account_id' => $iAccountId,
            'profile_id' => $iProfileId,
            'key' => $sKey,
            'date' => time()
        ], $aParams));
        $this->onInvite($iProfileId);

        $sLink = $this->getJoinLink($sKey);

        if($this->_bIsApi)
            return ['link' => bx_api_get_relative_url($sLink)];

        echoJson(['popup' => $this->_oTemplate->getLinkPopup($sLink)]);
    }

    public function serviceGetContextByCode($sKey = false, $aParams = [])
    {
        if($this->_bIsApi && !$sKey)
            return [bx_api_get_block('invite_in_context', ['request_url' => 'bx_invites/get_context_by_code/&params[]='])]; 

        if($this->_bIsApi && is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        $oKeys = BxDolKey::getInstance();

        $aInvite = $this->_oDb->getInvites(['type' => 'by_key', 'key' => $sKey]);
        if(empty($aInvite) || !is_array($aInvite) || !$oKeys->isKeyExists($sKey))
            return ($sMsg = _t('_bx_invites_err_code_not_found')) && $this->_bIsApi ? ['result' => false, 'message' => $sMsg] : ['msg' => $sMsg];

        $iContextPid = 0;
        $oContextProfile = false;
        if($aInvite['aj_action'] != 'invite_to_context' || !($iContextPid = (int)$aInvite['aj_params']) || ($oContextProfile = BxDolProfile::getInstance($iContextPid)) == false)
            return ($sMsg = _t('_bx_invites_err_context_not_found')) && $this->_bIsApi ? ['result' => false, 'message' => $sMsg] : ['msg' => $sMsg];

        if(isset($aParams['initiate']) && (bool)$aParams['initiate'] === true)
            $this->_oConfig->setKey($sKey);

        return $this->_bIsApi ? ['result' => true, 'data' => BxDolProfile::getData($oContextProfile)] : [
            'module' => $oContextProfile->getModule(),
            'id' => $oContextProfile->getContentId(),
            'profile_id' => $iContextPid,
            'display_name' => $oContextProfile->getDisplayName(),
            'url' => $oContextProfile->getUrl()
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-other Other
     * @subsubsection bx_invites-get_include get_include
     * 
     * @code bx_srv('bx_invites', 'get_include', [...]); @endcode
     * 
     * Get all necessary CSS and JS files to include in a page.
     *
     * @return string with all necessary CSS and JS files.
     * 
     * @see BxInvModule::serviceGetInclude
     */
    /** 
     * @ref bx_invites-get_include "get_include"
     */
    public function serviceGetInclude()
    {
        return $this->_oTemplate->getInclude();
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_invite get_block_invite
     * 
     * @code bx_srv('bx_invites', 'get_block_invite', [...]); @endcode
     * 
     * Get page block which displays invitations related info and action(s).
     *
     * @return an array describing a block to display on the site or empty string if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockInvite
     */
    /** 
     * @ref bx_invites-get_block_invite "get_block_invite"
     */
    public function serviceGetBlockInvite($bRedirect = false)
    {
        $iProfileId = $this->getProfileId();
        if(($mixedAllowed = $this->isAllowedInvite($iProfileId)) !== true)
            return '';

        $iAccountId = $this->getAccountId($iProfileId);
        if(!isAdmin($iAccountId) && $this->_oConfig->getCountPerUser() <= 0)
            return '';

        return [
            'content' => $this->_oTemplate->getBlockInvite($iAccountId, $iProfileId, [
                'redirect' => (bool)$bRedirect
            ])
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_invite get_block_invite_to_context
     * 
     * @code bx_srv('bx_invites', 'get_block_invite_to_context', [...]); @endcode
     * 
     * Get page block which displays invitations related info and action(s). It's similar to BxInvModule::serviceGetBlockInvite 
     * but should be used on View Context page (should receive Context Profile ID). It invites to the context after joining the site.
     *
     * @return an array describing a block to display on the site or empty string if something is wrong. 
     * All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockInviteToContext
     */
    /** 
     * @ref bx_invites-get_block_invite_to_context "get_block_invite_to_context"
     */
    public function serviceGetBlockInviteToContext($iContextPid)
    {
        $oContext = false;
        if(!$iContextPid || !($oContext = BxDolProfile::getInstance($iContextPid)))
            return '';

        $sContext = $oContext->getModule();
        if(!bx_srv('system', 'is_module_context', [$sContext]))
            return '';

        $iProfileId = $this->getProfileId();
        if(($mixedAllowed = $this->isAllowedInvite($iProfileId)) !== true)
            return '';

        $iAccountId = $this->getAccountId($iProfileId);
        if(!isAdmin($iAccountId) && !bx_srv($sContext, 'is_admin', [$iContextPid, $iProfileId]) && $this->_oConfig->getCountPerUser() <= 0)
            return '';

        return [
            'content' => $this->_oTemplate->getBlockInvite($iAccountId, $iProfileId, [
                'context' => (int)$iContextPid
            ])
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_accept_by_code get_block_accept_by_code
     * 
     * @code bx_srv('bx_invites', 'get_block_accept_by_code', [...]); @endcode
     * 
     * Get page block with accept invitation (by code) form.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockAcceptByCode
     */
    /** 
     * @ref bx_invites-get_block_accept_by_code "get_block_accept_by_code"
     */
    public function serviceGetBlockAcceptByCode()
    {
        $mixedResult = $this->_oTemplate->getBlockAcceptByCode();
        // The module is one instance for the process and keeps the API mode from when it was built.
        // A later API call has to receive the block; printing it and exiting ends the request.
        if(bx_is_api())
            return $mixedResult;

        if(is_array($mixedResult)) {
            echoJson($mixedResult);
            exit;
        }

        return [
            'content' => $mixedResult
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_form_invite get_block_form_invite
     * 
     * @code bx_srv('bx_invites', 'get_block_form_invite', [...]); @endcode
     * 
     * Get page block with invite form.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockFormInvite
     */
    /** 
     * @ref bx_invites-get_block_form_invite "get_block_form_invite"
     */
    public function serviceGetBlockFormInvite($aParams = [])
    {
        if(!isset($aParams['aj_action'], $aParams['aj_params']))
            $aParams = array_merge($aParams, $this->_prepareParamsGet());

        $oForm = $this->getFormObjectInvite();

        $oForm->aInputs['text']['value'] = _t('_bx_invites_msg_invitation');

        foreach(['aj_action', 'aj_params'] as $sKey)
            if(!empty($aParams[$sKey]))
                $oForm->aInputs[$sKey] = [
                    'name' => $sKey,
                    'type' => 'hidden',
                    'value' => $aParams[$sKey]
                ];

        $sResult = '';
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()){
            $sResult = MsgBox($this->processFormObjectInvite($oForm));
            if($this->_bIsApi)
                return [bx_api_get_msg($sResult)];
        }

        if($this->_bIsApi)
            return [bx_api_get_block('form', $oForm->getCodeAPI(), ['ext' => ['name' => $this->getName(), 'request' => ['url' => '/api.php?r=' . $this->getName() . '/get_block_form_invite', 'immutable' => true]]])];

        return [
            'content' => $sResult . $oForm->getCode()
        ];
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_form_request get_block_form_request
     * 
     * @code bx_srv('bx_invites', 'get_block_form_request', [...]); @endcode
     * 
     * Get page block with request invitation form.
     *
     * @return an array describing a block to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockFormRequest
     */
    /** 
     * @ref bx_invites-get_block_form_request "get_block_form_request"
     */
    public function serviceGetBlockFormRequest()
    {
        $mixedResult = $this->_oTemplate->getBlockFormRequest();

        // The module is one instance for the process and keeps the API mode from when it was built.
        // The home page asks for this block in the API after that, and printing it and exiting ends the request.
        if (bx_is_api())
            return $mixedResult;

        if(is_array($mixedResult)) {
            echoJson($mixedResult);
            exit;
        }

        return array(
            'content' => $mixedResult
        );
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_manage_requests get_block_manage_requests
     * 
     * @code bx_srv('bx_invites', 'get_block_manage_requests', [...]); @endcode
     * 
     * Get page block with manage invitation requests table.
     *
     * @return HTML string with block content to display on the site or empty string if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockManageRequests
     */
    /** 
     * @ref bx_invites-get_block_manage_requests "get_block_manage_requests"
     */
    public function serviceGetBlockManageRequests()
    {
        return $this->getBlockManage('requests');
    }
    
    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-page_blocks Page Blocks
     * @subsubsection bx_invites-get_block_manage_invites get_block_manage_requests
     * 
     * @code bx_srv('bx_invites', 'get_block_manage_invites', [...]); @endcode
     * 
     * Get page block with manage invitations table.
     *
     * @return HTML string with block content to display on the site or empty string if something is wrong. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxInvModule::serviceGetBlockManageInvites
     */
    /** 
     * @ref bx_invites-get_block_manage_invites "get_block_manage_invites"
     */
    public function serviceGetBlockManageInvites()
    {
        return $this->getBlockManage('invites');
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-other Other
     * @subsubsection bx_invites-get_menu_addon_requests get_menu_addon_requests
     * 
     * @code bx_srv('bx_invites', 'get_menu_addon_requests', [...]); @endcode
     * 
     * Get number or invitation requests.
     *
     * @return integer value with number of invitation requests.
     * 
     * @see BxInvModule::serviceGetMenuAddonRequests
     */
    /** 
     * @ref bx_invites-get_menu_addon_requests "get_menu_addon_requests"
     */
    public function serviceGetMenuAddonRequests()
    {
        return array('counter3_value' => $this->_oDb->getRequests(array('type' => 'count_all')));
    }

    /**
     * @page service Service Calls
     * @section bx_invites Invitations
     * @subsection bx_invites-other Other
     * @subsubsection bx_invites-account_add_form_check account_add_form_check
     * 
     * @code bx_srv('bx_invites', 'account_add_form_check', [...]); @endcode
     * 
     * Perform neccessary checking on join form.
     *
     * @return empty string - if join is allowed and should be processed as usual, non-empty string - if join form need to be replaced with this code.
     * In API mode the string is plain text: the join form adds a request link to it (BxInvTemplate::getBlockRequestAPI), social sign-in shows it as a message.
     * 
     * @see BxInvModule::serviceAccountAddFormCheck
     */
    /** 
     * @ref bx_invites-account_add_form_check "account_add_form_check"
     */
    public function serviceAccountAddFormCheck()
    {
        $sReturn = '';

        $sKey = bx_get($this->_oConfig->getKeyCode());
        $bKey = $sKey !== false;
        if($bKey) {
            $sKey = bx_process_input($sKey);

            $oKeys = BxDolKey::getInstance();
            if($oKeys->isKeyExists($sKey))
                $this->_oConfig->setKey($sKey);
            else
                $this->_oConfig->unsetKey();
        }

        if($this->_oConfig->getKey() !== false)
            return $sReturn;

        if($this->_bIsApi) {
            $aTexts = [];
            if($bKey)
                $aTexts[] = _t('_bx_invites_err_used');
            if($this->_oConfig->isRegistrationByInvitation())
                $aTexts[] = _t('_bx_invites_txt_request_block_text');

            return implode(' ', $aTexts);
        }

        if($bKey)
            $sReturn .= MsgBox(_t('_bx_invites_err_used'));

        if($this->_oConfig->isRegistrationByInvitation())
            $sReturn .= $this->_oTemplate->getBlockRequest();

        return $sReturn;
    }
    
    /**
     * Data for Notifications module
     */
    public function serviceGetNotificationsData()
    {
    	$sModule = $this->_aModule['name'];

    	$sEventPrivacy = $sModule . '_allow_view_event_to';
        if(BxDolPrivacy::getObjectInstance($sEventPrivacy) === false)
            $sEventPrivacy = '';

        return array(
            'handlers' => array(
                array('group' => $sModule . '_object', 'type' => 'insert', 'alert_unit' => $sModule, 'alert_action' => 'request_notify', 'module_name' => $sModule, 'module_method' => 'get_notifications_request', 'module_class' => 'Module', 'module_event_privacy' => $sEventPrivacy),
            ),
            'settings' => array(
                array('group' => 'request', 'unit' => $sModule, 'action' => 'request_notify', 'types' => array('personal')),
            ),
            'alerts' => array(
                array('unit' => $sModule, 'action' => 'request_notify'),
            )
        );
    }
    
    /**
     * Entry post for Notifications module
     */
    public function serviceGetNotificationsRequest($aEvent)
    {  
        if (getParam('bx_invites_requests_notifications') != 'on')
            return [];

        $aRequest = $this->_oDb->getRequests(array('type' => 'by_id', 'value' => $aEvent['object_id']));
        if (!$aRequest)
            return [];

        $CNF = &$this->_oConfig->CNF;
        $sEntryUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($CNF['URL_REQUESTS']), '{bx_url_root}');

        return [
            'entry_sample' => $aRequest['name'] . '(' . $aRequest['email'] . ')',
            'entry_url' => $sEntryUrl,
            'entry_caption' => $aRequest['text'],
            'entry_author' => '',
            'entry_privacy' => '', //may be empty or not specified. In this case Public privacy will be used.
            'lang_key' => '_bx_invites_alert_action_request', //may be empty or not specified. In this case the default one from Notification module will be used.
        ];
    }

    public function attachAccountIdToInvite($iAccountId, $sKey)
    {
        $this->_oDb->attachAccountIdToInvite($iAccountId, $sKey);
    }

    public function invite($sType, $aEmails, $sText, $aParams = [])
    {
        if(empty($aEmails) || !is_array($aEmails))
            return false;

        $oKeys = BxDolKey::getInstance();
        if(!$oKeys || !in_array($sType, [BX_INV_TYPE_FROM_MEMBER, BX_INV_TYPE_FROM_SYSTEM]))
            return false;

        $iKeyLifetime = $this->_oConfig->getKeyLifetime();

        $sEmailTemplate = '';
        switch($sType) {
            case BX_INV_TYPE_FROM_MEMBER:
                $sEmailTemplate = 'bx_invites_invite_form_message';
                break;

            case BX_INV_TYPE_FROM_SYSTEM:
                $sEmailTemplate = 'bx_invites_invite_by_request_message';
                break;
        }

        $iDate = time();
        $iProfileId = $this->getProfileId();
        $iAccountId = $this->getAccountId($iProfileId);
        $aMessage = BxDolEmailTemplates::getInstance()->parseTemplate($sEmailTemplate, array(
            'text' => $sText
        ), $iAccountId, $iProfileId);

        $iEmailUse = !empty($aParams['email_use']) ? (int)$aParams['email_use'] : 0;
        $bLimit = !empty($aParams['limit']) && is_numeric($aParams['limit']);

        $aResults = [];
        foreach($aEmails as $sEmail) {
            $sEmail = trim($sEmail);
            if(empty($sEmail))
                continue;

            $sKey = $oKeys->getNewKey(false, $iKeyLifetime);
            $aMarkers = [
                'join_url' => $this->getJoinLink($sKey), 
                'seen_image_url' => $this->getSeenImageUrl($sKey)
            ];

            if(sendMail($sEmail, $aMessage['Subject'], $aMessage['Body'], 0, $aMarkers, BX_EMAIL_SYSTEM, 'html', false, [], true)) {
                $iInviteId = (int)$this->_oDb->insertInvite([
                    'account_id' => $iAccountId, 
                    'profile_id' => $iProfileId, 
                    'key' => $sKey, 
                    'email' => $sEmail, 
                    'email_use' => $iEmailUse,
                    'aj_action' => !empty($aParams['aj_action']) ? $aParams['aj_action'] : '',
                    'aj_params' => !empty($aParams['aj_params']) ? $aParams['aj_params'] : '',
                    'date' => $iDate
                ]);

                $this->onInvite($iProfileId);

                $aResults[$iInviteId] = $sEmail;
                if($bLimit && count($aResults) == (int)$aParams['limit'])
                    break;
            }
        }

        return $aResults;
    }
    
    public function processFormObjectInvite(&$oForm)
    {
        $iProfileId = $this->getProfileId();
        $iAccountId = $this->getAccountId($iProfileId);

        $mixedAllowed = $this->isAllowedInvite($iProfileId);
        if($mixedAllowed !== true)
            return $mixedAllowed;

        $aInviteParams = [];
        if(!isAdmin($iAccountId) && ($aInviteParams['limit'] = $this->_oConfig->getCountPerUser()) <= 0)
            return _t('_bx_invites_err_limit_reached');

        $sEmails = bx_process_input($oForm->getCleanValue('emails'));
        $aEmails = preg_split("/[\s\n,;]+/", $sEmails);

        $aInviteParams['email_use'] = (int)$oForm->getCleanValue('email_use');

        if(($sA = 'aj_action') && ($$sA = $oForm->getCleanValue($sA)) && ($sP = 'aj_params') && ($$sP = $oForm->getCleanValue($sP))) 
            $aInviteParams = array_merge($aInviteParams, [
                $sA => $$sA,
                $sP => $$sP
            ]);

        $sText = bx_process_pass($oForm->getCleanValue('text'));

        $sResult = _t('_bx_invites_err_not_available');
        if(($aEmailsSent = $this->invite(BX_INV_TYPE_FROM_MEMBER, $aEmails, $sText, $aInviteParams)) !== false) {
            $sEmailsResult = '';
            if(count($aEmails) != count($aEmailsSent))
                $sEmailsResult = implode('; ', array_diff($aEmails, $aEmailsSent));
            $oForm->aInputs['emails']['value'] = $sEmailsResult;

            $sResult = _t('_bx_invites_msg_invitation_sent', count($aEmailsSent));
        }           

        return $sResult;
    }

    public function processInviteToContext($iPid, $iContextPid)
    {
        $oContext = null;
        if(!$iPid || !$iContextPid || !($oContext = BxDolProfile::getInstance($iContextPid)))
            return false;

        $sContext = $oContext->getModule();
        if(!bx_srv('system', 'is_module_context', [$sContext]))
            return false;

        $bAutoJoin = $this->_oConfig->isContextAutoJoin();

        $bResult = false;
        if($bAutoJoin && ($oConnection = bx_srv($sContext, 'get_fans_connection_object')) !== false)
            $bResult = $oConnection->addConnection($iContextPid, $iPid) && $oConnection->addConnection($iPid, $iContextPid);

        if(!$bAutoJoin || !$bResult)
            $bResult = bx_srv($sContext, 'add_invitation', [$iContextPid, $iPid]);

        return $bResult;
    }

    public function isAllowedInvite($iProfileId, $bPerform = false)
    {
        $aCheckResult = checkActionModule($iProfileId, 'invite', $this->getName(), $bPerform);
        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedRequest($iProfileId, $bPerform = false)
    {
        $aCheckResult = checkActionModule($iProfileId, 'request', $this->getName(), $bPerform);
        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function isAllowedDeleteRequest($iProfileId, $bPerform = false)
    {
        $aCheckResult = checkActionModule($iProfileId, 'delete request', $this->getName(), $bPerform);
        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }
    
    public function isAllowedDeleteInvite($iProfileId, $bPerform = false)
    {
        $aCheckResult = checkActionModule($iProfileId, 'delete invite', $this->getName(), $bPerform);
        return $aCheckResult[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheckResult[CHECK_ACTION_MESSAGE] : true;
    }

    public function getProfileId()
    {
        return isLogged() ? bx_get_logged_profile_id() : 0;
    }

    public function getProfileObject($iProfileId = 0)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile)
            $oProfile = BxDolProfileUndefined::getInstance();

        return $oProfile;
    }

    public function getAccountId($iProfileId)
    {
        $oProfile = $this->getProfileObject($iProfileId);
        if($oProfile->id() == 0)
            return 0;

        return $oProfile->getAccountId();
    }

    public function onRequest($iRequestId)
    {
        /**
         * @hooks
         * @hookdef hook-bx_invites-deleted_answer_notif 'bx_invites', 'request' - hook on create new request on invite
         * - $unit_name - equals `bx_invites`
         * - $action - equals `request` 
         * - $object_id - request id
         * - $sender_id - not used
         * @hook @ref hook-bx_invites-request
         */
        bx_alert($this->_oConfig->getObject('alert'), 'request', $iRequestId);
        $aProfiles = BxDolAclQuery::getInstance()->getProfilesByMembership(array(MEMBERSHIP_ID_MODERATOR, MEMBERSHIP_ID_ADMINISTRATOR));
        foreach($aProfiles as $aProfile) {
            /**
             * @hooks
             * @hookdef hook-bx_invites-request_notify 'bx_invites', 'request_notify' - hook on notify all admins&moderators about new request
             * - $unit_name - equals `bx_invites`
             * - $action - equals `request_notify` 
             * - $object_id - request id
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `parent_author_id` - [int] profile_id of notified profile
             * @hook @ref hook-bx_invites-request_notify
             */
            bx_alert($this->_oConfig->getObject('alert'), 'request_notify', $iRequestId, 0, array('parent_author_id' => $aProfile['id']));
        }
        //--- Event -> Request for Alerts Engine ---//
    }

    public function getFormObjectInvite($sDisplay = '')
    {
        if(empty($sDisplay))
            $sDisplay = $this->_oConfig->getObject('form_display_invite_send');

        bx_import('FormCheckerHelper', $this->_aModule);
        return BxDolForm::getObjectInstance($this->_oConfig->getObject('form_invite'), $sDisplay);
    }
    
    protected function getBlockManage($sType)
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_' . $sType));
        if(!$oGrid)
            return '';
        
        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        $this->_oTemplate->addCss(['main.css']);
        $this->_oTemplate->addJs(['jquery.form.min.js', 'main.js']);
        $this->_oTemplate->addJsTranslation(['_sys_grid_search']);

        return [
           'menu' => $this->_oTemplate->getMenuForManageBlocks($sType),
           'content' => $this->_oTemplate->getJsCode('main', ['grid' => $sType]) . $oGrid->getCode()
        ];
    }

    public function onInvite($iProfileId)
    {
        $this->isAllowedInvite($iProfileId, true);

        /**
         * @hooks
         * @hookdef hook-bx_invites-invite 'bx_invites', 'invite' - hook on new invite
         * - $unit_name - equals `bx_invites`
         * - $action - equals `invite` 
         * - $object_id - not used
         * - $sender_id - invited profile_id
         * @hook @ref hook-bx_invites-invite
         */
        bx_alert($this->_oConfig->getObject('alert'), 'invite', 0, $iProfileId);
    }

    public function getJoinLink($sKey)
    {
        return bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-account', [
            $this->_oConfig->getKeyCode() => $sKey
        ]));
    }
    
    public function getSeenImageUrl($sKey)
    {
        return  BX_DOL_URL_ROOT . $this->_oConfig->getBaseUri() . 'SetSeenMark/' . $sKey . "/";
    }

    protected function _prepareParamsGet()
    {
        $sAjAction = bx_get('aja');
        if(!$sAjAction || !($sAjAction = bx_process_input($sAjAction)) || !in_array($sAjAction, ['redirect', 'invite_to_context']))
            return [];

        $sAjParams = bx_get('ajp');
        if(!$sAjParams)
            return [];
        
        switch($sAjAction) {
            case 'redirect':
                $sAjParams = $this->_oConfig->urlDecode(bx_process_input($sAjParams));
                break;

            case 'invite_to_context':
                $sAjParams = bx_process_input($sAjParams, BX_DATA_INT);
                break;
        }
        
        return [
            'aj_action' => $sAjAction, 
            'aj_params' => $sAjParams
        ]; 
    }
}

/** @} */
