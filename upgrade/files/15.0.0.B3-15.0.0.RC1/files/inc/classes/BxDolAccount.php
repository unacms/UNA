<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

bx_import('BxDolAcl');

class BxDolAccount extends BxDolFactory implements iBxDolSingleton
{
    protected $_bIsApi;

    protected $_iAccountID;
    protected $_aInfo;
    protected $_oQuery;

    protected $_sImageField;
    protected $_aImageTranscoders;

    /**
     * Constructor
     */
    protected function __construct ($iAccountId)
    {
        $iAccountId = (int)$iAccountId;
        $sClass = get_class($this) . '_' . $iAccountId;
        if (isset($GLOBALS['bxDolClasses'][$sClass]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_iAccountID = $iAccountId; // since constructor is protected $iAccountId is always valid
        $this->_oQuery = BxDolAccountQuery::getInstance();

        $this->_sImageField = 'picture';
        $this->_aImageTranscoders = [
            'icon' => 'sys_accounts_icon',
            'thumb' => 'sys_accounts_thumb',
            'ava' => 'sys_accounts_avatar',
            'ava_big' => 'sys_accounts_avatar_big',
            'picture' => 'sys_accounts_picture'
        ];
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        $sClass = get_class($this) . '_' . $this->_iProfileID;
        if (isset($GLOBALS['bxDolClasses'][$sClass]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance($mixedAccountId = false,  $bClearCache = false)
    {
        if (!$mixedAccountId)
            $mixedAccountId = getLoggedId();

        $iAccountId = self::getID($mixedAccountId);
        if (!$iAccountId)
            return false;

        $sClass = __CLASS__ . '_' . $iAccountId;
        
        if ($bClearCache && isset($GLOBALS['bxDolClasses'][$sClass]))
            unset($GLOBALS['bxDolClasses'][$sClass]);
        
        if(!isset($GLOBALS['bxDolClasses'][$sClass]))
            $GLOBALS['bxDolClasses'][$sClass] = new BxDolAccount($iAccountId);

        return $GLOBALS['bxDolClasses'][$sClass];
    }

    /**
     * Get studio operator account singleton instance on the class
     */
    public static function getInstanceStudioOperator()
    {
        $oQuery = BxDolAccountQuery::getInstance();
        if (!($iId = $oQuery->getStudioOperatorId()))
            return false;

        return self::getInstance($iId);
    }

    /**
     * Get account id
     */
    public function id()
    {
        $a = $this->getInfo($this->_iAccountID);
        return isset($a['id']) ? $a['id'] : false;
    }

    /**
     * Check if account is confirmed, it is checked by email confirmation
     */
    public function isConfirmed($iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        $a = $this->getInfo($iId);

        $bResult = false;
        $sConfirmationType = getParam('sys_account_confirmation_type');
        switch($sConfirmationType) {
            case BX_ACCOUNT_CONFIRMATION_NONE:
                $bResult = true;
                break;

            case BX_ACCOUNT_CONFIRMATION_EMAIL:
                if($a['email_confirmed'])
                    $bResult = true;
                break;

            case BX_ACCOUNT_CONFIRMATION_PHONE:
                if($a['phone_confirmed'])
                    $bResult = true;
                break;

            case BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE:
                if($a['email_confirmed'] && $a['phone_confirmed'])
                    $bResult = true;
                break;
                
            case BX_ACCOUNT_CONFIRMATION_EMAIL_OR_PHONE:
                if($a['email_confirmed'] || $a['phone_confirmed'])
                    $bResult = true;
                break;  
                
        }

        /**
         * @hooks
         * @hookdef hook-account-is_confirmed 'account', 'is_confirmed' - hook in  $oAccount->isConfirmed check
         * - $unit_name - equals `account`
         * - $action - equals `is_confirmed` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] confirmation type can be none/phone/email/email_and_phone/email_or_phone
         *      - `override_result` - [bool] by ref, if account confirmed = true, otherwise false, can be overridden in hook processing
         * @hook @ref hook-account-is_confirmed
         */
        bx_alert('account', 'is_confirmed', $iId, false, array('type' => $sConfirmationType, 'override_result' => &$bResult));

        return $bResult;
    }
    
    public function getCurrentConfirmationStatusValue($iAccountId = false)
    {
        $a = $this->getInfo((int)$iAccountId);
        $sTmp = $a['email_confirmed'] . $a['phone_confirmed'];
        switch ($sTmp) {
            case '01':
                return BX_ACCOUNT_CONFIRMATION_PHONE;
            case '10':
                return BX_ACCOUNT_CONFIRMATION_EMAIL;
            case '11':
                return BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE;
        }
        return BX_ACCOUNT_CONFIRMATION_NONE;
    }

    public function isConfirmedEmail($iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        $bResult = false;
        if(self::isNeedConfirmEmail()) {
            $a = $this->getInfo($iId);

            $bResult = $a['email_confirmed'] ? true : false;
        }
        else 
            $bResult = true;

        /**
         * @hooks
         * @hookdef hook-account-is_confirmed 'account', 'is_confirmed_email' - hook in  $oAccount->isConfirmedEmail check
         * - $unit_name - equals `account`
         * - $action - equals `is_confirmed_email` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [bool] by ref, if email confirmed = true, otherwise false, can be overridden in hook processing
         * @hook @ref hook-account-is_confirmed_email
         */
        bx_alert('account', 'is_confirmed_email', $iId, false, array('override_result' => &$bResult));

        return $bResult;
    }

    public function isConfirmedPhone($iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        $bResult = false;        
        if(self::isNeedConfirmPhone()) {
            $a = $this->getInfo((int)$iAccountId);

            $bResult = $a['phone_confirmed'] ? true : false;
        }
        else
            $bResult = true;

        /**
         * @hooks
         * @hookdef hook-account-is_confirmed_phone 'account', 'is_confirmed_phone' - hook in  $oAccount->isConfirmedPhone check
         * - $unit_name - equals `account`
         * - $action - equals `is_confirmed_phone` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [bool] by ref, if phone confirmed = true, otherwise false, can be overridden in hook processing
         * @hook @ref hook-account-is_confirmed_phone
         */
        bx_alert('account', 'is_confirmed_phone', $iId, false, array('override_result' => &$bResult));

        return $bResult;
    }

    static public function isNeedConfirmEmail()
    {
        if(in_array(getParam('sys_account_confirmation_type'), array(BX_ACCOUNT_CONFIRMATION_EMAIL, BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE, BX_ACCOUNT_CONFIRMATION_EMAIL_OR_PHONE)))
            return true;
        return false;
    }
    
    static public function isNeedConfirmPhone()
    {
        if(in_array(getParam('sys_account_confirmation_type'), array(BX_ACCOUNT_CONFIRMATION_PHONE, BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE, BX_ACCOUNT_CONFIRMATION_EMAIL_OR_PHONE)))
            return true;
        return false;
    }
    
    public function isLocked($iAccountId = false)
    {
        $a = $this->getInfo((int)$iAccountId);
        return $a['locked'] ? true : false;
    }
    
    //

    /**
     * Set account email to confirmed or unconfirmed
     * @param  int  $isConfirmed - false: mark email as unconfirmed, true: as confirmed
     * @param  int  $iAccountId  - optional account id
     * @return true on success or false on error
     */
    public function updateEmailConfirmed($isConfirmed, $isAutoSendConfrmationEmail = true, $iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        if (!$isConfirmed && $isAutoSendConfrmationEmail && self::isNeedConfirmEmail()) // if email_confirmation procedure is enabled - send email confirmation letter
            $this->sendConfirmationEmail($iId);

        if ($this->_oQuery->updateEmailConfirmed($isConfirmed, $iId)) {
            $this->_aInfo = false;
            /**
             * @hooks
             * @hookdef hook-account-confirm 'account', 'confirm' - hook in email confirmation $oAccount->updateEmailConfirmed 
             * - $unit_name - equals `account`
             * - $action - can be confirm/unconfirm
             * - $object_id - account id 
             * - $sender_id - not used 
             * - $extra_params - not used 
             * @hook @ref hook-account-confirm
             */
            bx_alert('account', $this->isConfirmed() ? 'confirm' : 'unconfirm', $iId);
            return true;
        }
        return false;
    }
    
    /**
     * Set account phone to confirmed or unconfirmed
     * @param  int  $isConfirmed - false: mark phone as unconfirmed, true: as confirmed
     * @param  int  $iAccountId  - optional account id
     * @return true on success or false on error
     */
    public function updatePhoneConfirmed($isConfirmed, $iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        
        if ($this->_oQuery->updatePhoneConfirmed($isConfirmed, $iId)) {
            $this->_aInfo = false;
            bx_alert('account', $this->isConfirmed() ? 'confirm' : 'unconfirm', $iId);
            return true;
        }
        return false;
    }
    /**
     * Change account password
     * @param  string  $sPassword - new password
     * @param  int  $iAccountId  - optional account id
     * @return true on success or false on error
     */
    public function updatePassword($sPassword, $iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        $sSalt = genRndSalt();
        $sPasswordHash = encryptUserPwd($sPassword, $sSalt);

        $this->_oQuery->logPassword($iId);
        
        if((int)$this->_oQuery->updatePassword($sPasswordHash, $sSalt, $iId) > 0) {
            /**
             * @hooks
             * @hookdef hook-account-edited 'account', 'edited' - hook on account edited $oAccount->updatePassword 
             * - $unit_name - equals `account`
             * - $action - equals edited
             * - $object_id - account id 
             * - $sender_id - account sender id 
             * - $extra_params - array of additional params with the following array keys:
             *      - `action` - [string] action's name, can be reset_password
             * @hook @ref hook-account-edited
             */
            bx_alert('account', 'edited', $iId, ($iSenderId = getLoggedId()) != 0 ? $iSenderId : $iId, [
                'action' => 'reset_password'
            ]);

            $this->doAudit($iId, '_sys_audit_action_account_reset_password');
            return true;
        }

        return false;
    }
    /**
     * Set account phone
     * @param  string  $sPhone - phone number
     * @param  int  $iAccountId  - optional account id
     * @return true on success or false on error
     */
    public function updatePhone($sPhone, $iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        if ($this->_oQuery->updatePhone($sPhone, $iId)) {
            /**
             * @hooks
             * @hookdef hook-account-set_phone 'account', 'set_phone' - hook after accout password changed
             * - $unit_name - equals `account`
             * - $action - equals `set_phone` 
             * - $object_id - account id 
             * - $sender_id - not used 
             * - $extra_params - not used
             * @hook @ref hook-account-set_phone
             */
            bx_alert('account', 'set_phone', $iId);
            return true;
        }
        return false;
    }
    /**
     * Switch context automatically to the first available profile
     * @param $iProfileIdFilterOut profile ID to exclude from the list of possible profiles
     * @param $iAccountId account ID to use istead of current account
     * @return true on success or false on error
     */ 
    public function updateProfileContextAuto($iProfileIdFilterOut = false, $iAccountId = false)
    {
        $oAccount = (!$iAccountId || $iAccountId == $this->_iAccountID ? $this : BxDolAccount::getInstance ($iAccountId));
        if (!$oAccount)
            return false;
        $aAccountInfo = $oAccount->getInfo();
        $aProfiles = $oAccount->getProfiles();
        $oProfileAccount = BxDolProfile::getInstanceAccountProfile($oAccount->id());

        // unset deleted profile and account profile
        if ($iProfileIdFilterOut)
            unset($aProfiles[$iProfileIdFilterOut]);
        unset($aProfiles[$oProfileAccount->id()]);

        if ($aProfiles) {
            // try to use another profile
            reset($aProfiles);
            $iProfileId = key($aProfiles);
        } 
        else {
            // if no profiles exist, use account profile
            $iProfileId = $oProfileAccount->id();
        }

        return $oAccount->updateProfileContext($iProfileId);
    }
    
    public function updateProfileContext($iSwitchToProfileId, $iAccountId = false)
    {
        $iId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        $aInfo = $this->getInfo((int)$iId);
        if (!$aInfo)
            return false;

        $ret = null;
        /**
         * @hooks
         * @hookdef hook-account-before_switch_context 'account', 'before_switch_context' - hook before switch profile_id from current logged user
         * - $unit_name - equals `account`
         * - $action - equals `before_switch_context` 
         * - $object_id - account id 
         * - $sender_id - profile_id to switch to
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id_current` - [int] current profile_id
         *      - `override_result` - [int] by ref, profile_id to switch to, can be overridden in hook processing
         * @hook @ref hook-account-before_switch_context
         */
        bx_alert('account', 'before_switch_context', $iId, $iSwitchToProfileId, array('profile_id_current' => $aInfo['profile_id'], 'override_result' => &$ret));
        if ($ret !== null)
            return $ret;

        if (!$this->_oQuery->updateCurrentProfile($iId, $iSwitchToProfileId))
            return false;

        $this->_aInfo = false;
        
        /**
         * @hooks
         * @hookdef hook-account-switch_context 'account', 'switch_context' - hook before switch profile_id from current logged user
         * - $unit_name - equals `account`
         * - $action - equals `switch_context` 
         * - $object_id - account id 
         * - $sender_id - profile_id to switch to
         * - $extra_params - array of additional params with the following array keys:
         *      - `profile_id_old` - [int] old profile_id
         * @hook @ref hook-account-switch_context
         */
        bx_alert('account', 'switch_context', $iId, $iSwitchToProfileId, array('profile_id_old' => $aInfo['profile_id']));

        return true;
    }

    /**
     * Send "confirmation" email
     */
    public function sendConfirmationEmail($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId;
        if(!$iAccountId)
            $iAccountId = $this->_iAccountID;

        $aAccountInfo = $this->getInfo($iAccountId);
        if(empty($aAccountInfo) || !is_array($aAccountInfo))
            return false;

        $oKey = BxDolKey::getInstance();
        $sConfirmationCode = $oKey->getNewKeyNumeric(['account_id' => $iAccountId]);
        $sConfirmationLink = bx_append_url_params(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-email'), ['code' => $sConfirmationCode]);

        $sEmailTemplate = 't_Confirmation';
        $aEmailReplaceVars = [
            'name' => $this->getDisplayName($iAccountId),
            'email' => $aAccountInfo['email'],
            'conf_code' => $sConfirmationCode,
            'conf_link' => $sConfirmationLink,
            'conf_form_link' => BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-email')
        ];

        $bResult = sendMailTemplate($sEmailTemplate, $iAccountId, (int)$aAccountInfo['profile_id'], $aEmailReplaceVars, BX_EMAIL_SYSTEM);
        if($bResult)
            $this->doAudit($iAccountId, '_sys_audit_action_account_resend_confirmation_email');

        return $bResult;
    }

    /**
     * Send "welcome" email
     */
    public function sendWelcomeEmail($iAccountId = false)
    {
        if(getParam('sys_account_welcome_letter') != 'on')
            return false;

        $iAccountId = (int)$iAccountId;
        if(!$iAccountId)
            $iAccountId = $this->_iAccountID;

        $aAccountInfo = $this->getInfo($iAccountId);
        if(empty($aAccountInfo) || !is_array($aAccountInfo))
            return false;

        if((int)$aAccountInfo['welcome_sent'] != 0)
            return true;

        $sEmailTemplate = 't_Welcome';
        $aEmailReplaceVars = [
            'name' => $this->getDisplayName($iAccountId),
        ];

        $bResult = sendMailTemplate($sEmailTemplate, $iAccountId, (int)$aAccountInfo['profile_id'], $aEmailReplaceVars, BX_EMAIL_SYSTEM);
        if($bResult)
            $this->_oQuery->updateWelcomeSent(1, $iAccountId);

        return $bResult;
    }

    public function sendResetPasswordEmail($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId;
        if(!$iAccountId)
            $iAccountId = $this->_iAccountID;

        $aAccountInfo = $this->getInfo($iAccountId);
        if(empty($aAccountInfo) || !is_array($aAccountInfo))
            return false;

        $sKey = bx_get_reset_password_key($aAccountInfo['email']);

        $aReplaceVars = array(
            'name' => $this->getDisplayName($iAccountId),
            'email' => $aAccountInfo['email'],
            'key' => $sKey,
            'forgot_password_url' => bx_get_reset_password_link_by_key($sKey)
        );

        return sendMailTemplate('t_Forgot', $iAccountId, (int)$aAccountInfo['profile_id'], $aReplaceVars, BX_EMAIL_SYSTEM);
    }

    /**
     * Get account info
     */
    public function getInfo($iAccountId = false)
    {        
        if ($iAccountId && $iAccountId != $this->_iAccountID)
            return $this->_oQuery->getInfoById((int)$iAccountId ? (int)$iAccountId : $this->_iAccountID);

        if ($this->_aInfo)
            return $this->_aInfo;

        $this->_aInfo = $this->_oQuery->getInfoById($this->_iAccountID);
        return $this->_aInfo;
    }

    /**
     * Get account display name
     */
    public function getDisplayName($iAccountId = false)
    {
        $aInfo = $this->getInfo($iAccountId);

        $sDisplayName = !empty($aInfo['name']) ? $aInfo['name'] : _t('_sys_txt_user_n', $aInfo['id']);
        
        /**
         * @hooks
         * @hookdef hook-account-account_name 'account', 'account_name' - hook on get account display name
         * - $unit_name - equals `account`
         * - $action - equals `account_name` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `info` - [array] contains account info from $oAccount->getInfo()
         *      - `display_name` - [string] by ref, account display name,  can be overridden in hook processing
         * @hook @ref hook-account-account_name
         */
        bx_alert('account', 'account_name', $iAccountId, 0, array('info' => $aInfo, 'display_name' => &$sDisplayName, 'display_name_ref' => &$sDisplayName));

        return bx_process_output($sDisplayName);
    }

    /**
     * Get account url
     */
    public function getUrl($iAccountId = false)
    {
        return 'javascript:void(0);';
    }

    /**
     * Get account url
     */
    public function getUnit($iAccountId = false, $aParams = array())
    {
        $sTemplate = 'unit';
        $sTemplateSize = false;
        $aTemplateVars = array();
        if(!empty($aParams['template'])) {
            if(is_string($aParams['template']))
                $sTemplate = $aParams['template'];
            else if(is_array($aParams['template'])) {
                if(!empty($aParams['template']['name']))
                    $sTemplate = $aParams['template']['name'];

                if(!empty($aParams['template']['size']))
                    $sTemplateSize = $aParams['template']['size'];

                if(!empty($aParams['template']['vars']))
                    $aTemplateVars = $aParams['template']['vars'];
            }
        }

        $sTemplate = 'account_' . $sTemplate . '.html';
        if(empty($sTemplateSize))
            $sTemplateSize = 'thumb';

        $sTitle = $this->getDisplayName($iAccountId);
        $aInfo = $this->getInfo($iAccountId);

        $sImageUrl = $this->_getImageUrl($sTemplateSize, $aInfo);
        $bImageUrl = !empty($sImageUrl);

        $aTmplVars = [
            'size' => $sTemplateSize,
            'content_url' => $this->getUrl($iAccountId),
            'title' => $sTitle,
            'title_attr' => bx_html_attribute($sTitle),
            'bx_if:show_thumb_image' => [
                'condition' => $bImageUrl,
                'content' => [
                    'size' => $sTemplateSize,
                    'url' => $sImageUrl
                ]
            ],
            'bx_if:show_thumb_letter' => [
                'condition' => !$bImageUrl,
                'content' => [
                    'size' => $sTemplateSize,
                    'color' => implode(', ', BxDolTemplate::getColorCode(($iAccountId ? $iAccountId : $this->_iAccountID), 1.0)),
                    'letter' => mb_strtoupper(mb_substr($sTitle, 0, 1)),
                ]
            ],
            'bx_if:show_online' => [
                'condition' => $this->isOnline($iAccountId),
                'content' => []
            ]
        ];

        if(!empty($aTemplateVars) && is_array($aTemplateVars))
            $aTmplVars = array_merge ($aTmplVars, $aTemplateVars);

        return BxDolTemplate::getInstance()->parseHtmlByName($sTemplate, $aTmplVars);
    }
    
    public function getUnitApi($iAccountId = false, $aParams = array())
    {
        if(!$iAccountId)
            $iAccountId = $this->_iAccountID;

        $sModule = 'system';

        $iAuthorId = 0;
        $aAuthorData = [];
        if(($oProfile = BxDolProfile::getInstanceByContentAndType($iAccountId, $sModule)) !== false) {
            $iAuthorId = $oProfile->id();
            $aAuthorData = BxDolProfile::getData($iAuthorId);
        }

        $aInfo = $this->getInfo($iAccountId);

        return [
            'id' => $aInfo['id'], 
            'module' => $sModule,
            'module_title' => $sModule,
            'added' => $aInfo['added'],
            'author' => $iAuthorId,
            'author_data' => $aAuthorData,
            'title' => $this->getDisplayName($iAccountId),
        ];
    }

    /**
     * Get picture url
     */
    public function getPicture($iAccountId = false)
    {
        if($this->_bIsApi)
            return '';

        $sImageUrl = $this->_getImageUrl('picture', $iAccountId);
        if(!$sImageUrl)
            $sImageUrl = BxDolTemplate::getInstance()->getImageUrl('account.svg');

        return $sImageUrl;
    }

    /**
     * Get big (2x) avatar url
     */
    public function getAvatarBig($iAccountId = false)
    {
        if($this->_bIsApi)
            return '';

        $sImageUrl = $this->_getImageUrl('ava_big', $iAccountId);
        if(!$sImageUrl)
            $sImageUrl = BxDolTemplate::getInstance()->getImageUrl('account.svg');

        return $sImageUrl;
    }

    /**
     * Get avatar url
     */
    public function getAvatar($iAccountId = false)
    {
        if($this->_bIsApi)
            return '';

        $sImageUrl = $this->_getImageUrl('ava', $iAccountId);
        if(!$sImageUrl)
            $sImageUrl = BxDolTemplate::getInstance()->getImageUrl('account.svg');

        return $sImageUrl;
    }

    /**
     * Get thumb picture url
     */
    public function getThumb($iAccountId = false)
    {
        if($this->_bIsApi)
            return '';

        $sImageUrl = $this->_getImageUrl('thumb', $iAccountId);
        if(!$sImageUrl)
            $sImageUrl = BxDolTemplate::getInstance()->getImageUrl('account.svg');

        return $sImageUrl;
    }

    /**
     * Get icon picture url
     */
    public function getIcon($iAccountId = false)
    {
        if($this->_bIsApi)
            return '';

        $sImageUrl = $this->_getImageUrl('icon', $iAccountId);
        if(!$sImageUrl)
            $sImageUrl = BxDolTemplate::getInstance()->getImageUrl('account.svg');

        return $sImageUrl;
    }

    /**
     * Get account email
     */
    public function getEmail($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        $aAccountInfo = $this->getInfo($iAccountId);
        return $aAccountInfo['email'];
    }

    /**
     * Get language ID
     */
    public function getLanguageId($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        $aAccountInfo = $this->getInfo($iAccountId);
        return $aAccountInfo['lang_id'];
    }

    /**
     * Is account online
     */
    public function isOnline($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        return $this->_oQuery->isOnline($iAccountId);
    }

    /**
     * Validate account.
     * @param $s - account identifier (id or email)
     * @return account id or false if account was not found
     */
    static public function getID($s)
    {
        $oQuery = BxDolAccountQuery::getInstance();

        bx_import('BxDolForm');
        if (BxDolFormCheckerHelper::checkEmail($s)) {
            $iId = (int)$oQuery->getIdByEmail($s);
            return $iId ? $iId : false;
        }
        if (preg_match("/^\+[0-9\s]+$/", $s)) {
            $iId = (int)$oQuery->getIdByPhone($s);
            return $iId ? $iId : false;
        }
        
        $iId = $oQuery->getIdById((int)$s);
        return $iId ? $iId : false;
    }

    /**
     * Check if profiles limit reached
     */
    public function isProfilesLimitReached ()
    {
        $iProfilesLimit = (int)getParam('sys_account_limit_profiles_number');
        /**
         * @hooks
         * @hookdef hook-account-get_limit_profiles_number 'account', 'get_limit_profiles_number' - hook on get account limit on the number of profiles
         * - $unit_name - equals `account`
         * - $action - equals `get_limit_profiles_number` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `account_id` - [int] account id 
         *      - `number` - [int] by ref, account limit on the number of profiles,  can be overridden in hook processing
         * @hook @ref hook-account-get_limit_profiles_number
         */
        bx_alert('account', 'get_limit_profiles_number', 0, 0, array('account_id' => $this->_iAccountID, 'number' => &$iProfilesLimit, 'number_ref' => &$iProfilesLimit));
        if (!isAdmin() && $iProfilesLimit && ($iProfilesNum = $this->getProfilesNumber()) && $iProfilesNum >= $iProfilesLimit)
            return true;

        return false;
    }

    /**
     * Get number of profiles associated with the account
     */
    public function getProfilesNumber ($isFilterNonSwitchableProfiles = true)
    {
        $a = $this->getProfilesIds($isFilterNonSwitchableProfiles);
        return count($a);
    }
    
    /**
     * Get all profile ids associated with the account
     */
    public function getProfilesIds ($isFilterNonSwitchableProfiles = true, $isFilterSystemProfiles = true)
    {
        $a = $this->getProfiles ($isFilterNonSwitchableProfiles, $isFilterSystemProfiles);
        return $a ? array_keys($a) : array();
    }

    /**
     * Get all profiles associated with the account
     */
    public function getProfiles ($isFilterNonSwitchableProfiles = true, $isFilterSystemProfiles = true)
    {
        $oProfileQuery = BxDolProfileQuery::getInstance();
        $aProfiles = $oProfileQuery->getProfilesByAccount($this->_iAccountID);

        if ($isFilterNonSwitchableProfiles) {
            foreach ($aProfiles as $iProfileId => $aProfile) {
                if ('system' == $aProfile['type'])
                    continue;
                if (!BxDolService::call($aProfile['type'], 'act_as_profile'))
                    unset($aProfiles[$iProfileId]);
            }
        }

        if ($isFilterSystemProfiles) {
            foreach ($aProfiles as $iProfileId => $aProfile) {
                if ('system' == $aProfile['type'])
                    unset($aProfiles[$iProfileId]);
            }
        }

        return $aProfiles;
    }

    /**
     * Delete profile.
     * @param $bDeleteWithContent - delete associated profiles with all its contents
     * @param $bScheduled - delete account using background jobs.
     */
    function delete($bDeleteWithContent = false, $bScheduled = false)
    {
        if ($bScheduled)
            return BxDolBackgroundJobs::getInstance()->add('account_delete_' . $this->_iAccountID, ['system', 'account_delete', [$this->_iAccountID, $bDeleteWithContent], 'TemplServiceAccount']);

        $aAccountInfo = $this->_oQuery->getInfoById($this->_iAccountID);
        if (!$aAccountInfo)
            return false;

        // create system event before deletion
        $isStopDeletion = false;
        /**
         * @hooks
         * @hookdef hook-account-before_delete 'account', 'before_delete' - hook on before delete account, 
         * - $unit_name - equals `account`
         * - $action - equals `before_delete` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `delete_with_content` - [bool] if account will delete with content = true, otherwise = false
         *      - `stop_deletion` - [bool] by ref, if it set to true account deletion will stopped, can be overridden in hook processing
         * @hook @ref hook-account-before_delete
         */
        bx_alert('account', 'before_delete', $this->_iAccountID, 0, array('delete_with_content' => $bDeleteWithContent, 'stop_deletion' => &$isStopDeletion, 'stop_deletion_ref' => &$isStopDeletion));
        if ($isStopDeletion)
            return false;

        $oAccountQuery = BxDolAccountQuery::getInstance();

        $oProfileQuery = BxDolProfileQuery::getInstance();
        $aProfiles = $oProfileQuery->getProfilesByAccount($this->_iAccountID);
        foreach ($aProfiles as $iProfileId => $aRow) {
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if (!$oProfile)
                continue;
            $oProfile->delete(false, $bDeleteWithContent, true);
        }

        // delete profile
        if (!$oAccountQuery->delete($this->_iAccountID))
            return false;

        // unset class instance to prevent creating the instance again
        $sClass = __CLASS__ . '_' . $this->_iAccountID;
        unset($GLOBALS['bxDolClasses'][$sClass]);

       /**
         * @hooks
         * @hookdef hook-account-delete 'account', 'delete' - hook on after delete account 
         * - $unit_name - equals `account`
         * - $action - equals `delete` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `delete_with_content` - [bool] if account will delete with content = true, otherwise = false
         * @hook @ref hook-account-delete
         */
        bx_alert('account', 'delete', $this->_iAccountID, 0, array ('delete_with_content' => $bDeleteWithContent));
        
        $this->doAudit($this->_iAccountID, $bDeleteWithContent ? '_sys_audit_action_account_deleted_with_content' : '_sys_audit_action_account_deleted');
        
        return true;
    }

    /**
     * Add permament messages.
     */
    public function addInformerPermanentMessages ($oInformer)
    {
        if (!$this->isConfirmed()) {
            if (!$this->isConfirmedEmail()) {
                $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-email');
                $aAccountInfo = $this->getInfo();
                $oInformer->add('sys-account-unconfirmed-email', _t('_sys_txt_account_unconfirmed_email', $sUrl . '&resend=1', $aAccountInfo['email'], $sUrl), BX_INFORMER_ALERT);
            }
            if (!$this->isConfirmedPhone()) {
                $sUrl = BxDolPermalinks::getInstance()->permalink('page.php?i=confirm-phone') . '';
                $aAccountInfo = $this->getInfo();
                $oInformer->add('sys-account-unconfirmed-phone', _t('_sys_txt_account_unconfirmed_phone', $sUrl), BX_INFORMER_ALERT);
            }
        }

        $this->isNeedChangePassword(false, $oInformer);
    }
    
    public function addInformerDeletionScheduled($oInformer)
    {
        if(BxDolBackgroundJobs::getInstance()->exists('account_delete_' . $this->_iAccountID))
            $oInformer->add('sys-account-deletion-scheduled', _t('_sys_txt_account_deletion_scheduled'), BX_INFORMER_ALERT);
    }

    /**
     * Get unsubscribe link for the specified mesage type
     */
    public function getUnsubscribeLink($iEmailType, $iAccountId = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        $sUrl = '';
        switch ($iEmailType) {
            case BX_EMAIL_NOTIFY:
                $sUrl = 'page.php?i=unsubscribe-notifications';
                break;
            case BX_EMAIL_MASS:
                $sUrl = 'page.php?i=unsubscribe-news';
                break;
            default:
                return '';
        }
        return BxDolPermalinks::getInstance()->permalink($sUrl) . '&id=' . $iAccountId . '&code=' . $this->getEmailHash();
    }

    public function getEmailHash($iAccountId = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;
        $a = $this->getInfo();
        return md5($a['email'] . $a['salt'] . BX_DOL_SECRET);
    }
    
    public function getPasswordChangedDate($mixedAccount = false)
    {
        if(($bEmpty = empty($mixedAccount)) || !is_array($mixedAccount))
            $mixedAccount = $this->_oQuery->getInfoById(!$bEmpty ? (int)$mixedAccount : $this->_iAccountID);

        $iLastChanged = (int)$mixedAccount['password_changed'];
        return $iLastChanged ? $iLastChanged : (int)$mixedAccount['added'];
    }

    public function getPasswordExpiredDate($iPasswordExpiredForMembership, $mixedAccount = false)
    {
        if($iPasswordExpiredForMembership == 0)
            return 0;

        return $iPasswordExpiredForMembership * 86400 + $this->getPasswordChangedDate($mixedAccount);
    }

    public function isNeedChangePassword($iAccountId = false, $oInformer = false)
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        list($sPageLink, $aPageParams) = bx_get_base_url_inline();

        $sChangePasswordUri = 'account-settings-password';
        $bNeedRedirectToChangePassword = true;
        if(isset($aPageParams['i']) && $aPageParams['i'] == $sChangePasswordUri)
            $bNeedRedirectToChangePassword = false;

        /**
         * @hooks
         * @hookdef hook-account-is_need_to_change_password 'account', 'is_need_to_change_password' - hook on after delete account 
         * - $unit_name - equals `account`
         * - $action - equals `is_need_to_change_password` 
         * - $object_id - account id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [bool] by ref, if Need Redirect To Change Password = true, otherwise = false, can be overridden in hook processing
         * @hook @ref hook-account-is_need_to_change_password
         */
        bx_alert('account', 'is_need_to_change_password',  $iAccountId, false, [
            'override_result' => &$bNeedRedirectToChangePassword
        ]);

        if(!$bNeedRedirectToChangePassword)
            return;

        $aAccountInfo = $this->getInfo();
        $aMembershipInfo = BxDolAcl::getInstance()->getMemberMembershipInfo($aAccountInfo['profile_id']);
        $sChangePasswordUrl = BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('page.php?i=' . $sChangePasswordUri);

        if(($iPasswordExpiredDate = $this->getPasswordExpiredDate($aMembershipInfo['password_expired'], $aAccountInfo)) && $iPasswordExpiredDate < time()) {
            if(getParam('sys_account_accounts_force_password_change_after_expiration') == 'on') {
                header('Location: ' . $sChangePasswordUrl);
                exit;
            }
            else {
                if(!$oInformer)
                    $oInformer = BxDolInformer::getInstance();

                $oInformer->add('sys-account-need-to-change-password', _t('_sys_txt_account_need_to_change_password', $sChangePasswordUrl), BX_INFORMER_ALERT);
            }
        }
    }

    public function doAudit($iAccountId, $sAction, $aData = [])
    {
        $iAccountId = (int)$iAccountId ? (int)$iAccountId : $this->_iAccountID;

        bx_audit($iAccountId, 'bx_accounts', $sAction,  [
            'content_title' => $this->getEmail(), 
            'data' => $aData
        ]);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    static public function isAllowedCreate ($iProfileId, $isPerformAction = false)
    {
        $aCheck = checkActionModule($iProfileId, 'create account', 'system', $isPerformAction);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($aCheck[CHECK_ACTION_MESSAGE]);
        return CHECK_ACTION_RESULT_ALLOWED;
    }
    
    static public function isAllowedCreateMultiple ($iProfileId, $isPerformAction = false)
    {
        $iLimit = (int)getParam('sys_account_limit_profiles_number');

        $bResult = false;
        if(isAdmin() || $iLimit != 1)
            $bResult = true;

        $oProfile = BxDolProfile::getInstance($iProfileId);
        if($iLimit == 1 && $oProfile->getModule() == 'system')
            $bResult = true;

        if($oProfile && $oProfile->getAccountId() != getLoggedId())
            $bResult = false;

        /**
         * @hooks
         * @hookdef hook-account-allow_create_another_profile 'profile', 'allow_create_another_profile' - hook on check allow create profile 
         * - $unit_name - equals `profile`
         * - $action - equals `allow_create_another_profile` 
         * - $object_id - profile id 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [bool] by ref, if allow create another profile = true, otherwise = false, can be overridden in hook processing
         * @hook @ref hook-account-allow_create_another_profile
         */
        bx_alert('profile', 'allow_create_another_profile', $iProfileId, 0, [
            'override_result' => &$bResult
        ]);

        return $bResult;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    static public function isAllowedEdit ($iProfileId, $aContentInfo, $isPerformAction = false)
    {
        $oProfile = BxDolProfile::getInstance($iProfileId);
        if (!$oProfile)
            return _t('_sys_txt_access_denied');

        $aProfileInfo = $oProfile->getInfo();
        if (!$aProfileInfo || getLoggedId() != $aProfileInfo['account_id'])
            return _t('_sys_txt_access_denied');

        return CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden.
     */
    static public function isAllowedDelete ($iProfileId, $aContentInfo, $isPerformAction = false)
    {
        $iAccountId = (int)BxDolProfile::getInstance($iProfileId)->getAccountId();
        if(isAdmin($iAccountId) && $iAccountId == (int)$aContentInfo['id'])
            return _t('_sys_txt_account_cannot_delete');

        $aCheck = checkActionModule($iProfileId, 'delete account', 'system', $isPerformAction);
        if ($aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED)
            return $aCheck[CHECK_ACTION_MESSAGE];

        return CHECK_ACTION_RESULT_ALLOWED;
    }
    
    static public function pruning ()
    {
        $iCount = 0;
        $iTime = time() - getParam('sys_account_accounts_pruning_interval') * 86400;
        $oAccountQuery = BxDolAccountQuery::getInstance();
        $aAccounts = [];
        $aAccountsSuspend = [];
        $bSuspend = false;
        $aPruning = explode(',', getParam('sys_account_accounts_pruning'));
        foreach ($aPruning as $sPruning) {
            switch($sPruning) {
                 case 'no_login_suspend':
                    $aAccountsSuspend = $oAccountQuery->getAccountsForPruning('no_login', $iTime);   
                    break;  

                case 'no_login_delete':
                    $aAccounts = array_merge($aAccounts, $oAccountQuery->getAccountsForPruning('no_login', $iTime));   
                    break;



                case 'no_confirm_delete':
                    $aAccounts1 = $oAccountQuery->getAccountsForPruning('no_confirm', $iTime);
                    foreach ($aAccounts1 as $k => $aAccount) {
                        $oAccount = BxDolAccount::getInstance($aAccount['id']);
                        if($oAccount->isConfirmed()){
                            unset($aAccounts1[$k]);
                        }
                    }
                    $aAccounts = array_merge($aAccounts, $aAccounts1);   
                    break;

                case 'no_profile_delete':
                    $aAccounts = array_merge($aAccounts, $aAccounts = $oAccountQuery->getAccountsForPruning('no_profile', $iTime));
                    break;
            }
        }
        
        foreach ($aAccountsSuspend as $k => $aAccount) {
            $oAccount = BxDolAccount::getInstance($aAccount['id']);
            $oProfile = BxDolProfile::getInstanceAccountProfile($aAccount['id']);
            $oProfile->suspend(BX_PROFILE_ACTION_AUTO, 0 ,false);
            $aProfiles = $oAccount->getProfiles();
            foreach($aProfiles as $aProfile){
                BxDolProfile::getInstance($aProfile['id'])->suspend(BX_PROFILE_ACTION_AUTO, 0 ,false);
            }
            $iCount++;
        }

        
        foreach ($aAccounts as $k => $aAccount) {
            $oAccount = BxDolAccount::getInstance($aAccount['id']);
            $oAccount->delete(false);
            $iCount++;
        }

        return $iCount;
    }

    protected function _getImageUrl($sSize, $mixedData)
    {
        if(!is_array($mixedData))
            $mixedData = $this->getInfo((int)$mixedData);

        $sImageUrl = '';
        if(!empty($mixedData[$this->_sImageField]) && !empty($this->_aImageTranscoders[$sSize]) && ($oImagesTranscoder = BxDolTranscoderImage::getObjectInstance($this->_aImageTranscoders[$sSize])) !== false)
            $sImageUrl = $oImagesTranscoder->getFileUrl($mixedData[$this->_sImageField]);

        return $sImageUrl;
    }
}

/** @} */
