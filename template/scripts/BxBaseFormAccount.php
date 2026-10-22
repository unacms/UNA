<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

class BxFormAccountCheckerHelper extends BxDolFormCheckerHelper
{
    /**
     * Password confirmation check.
     */
    function checkPasswordConfirm ($s)
    {
        return $s == bx_process_input(bx_get(BxTemplFormAccount::$FIELD_PASSWORD));
    }
    
    function checkPassword ($s, $r)
    {
        $bValid = parent::checkPreg($s, $r);
        
        if (!$bValid)
            return $bValid;
        
        $oAccount = BxDolAccount::getInstance();
        if ($oAccount){
            $aPasswords = BxDolAccountQuery::getInstance()->getLastPasswordLog($oAccount->id());
            $bUsed = false;
            foreach ($aPasswords as $aPassword){
                if($aPassword['password'] == encryptUserPwd($s, $aPassword['salt']))
                    $bUsed = true;
            }

            if ($bUsed)
                return _t('_sys_form_account_input_password_error_old_used');
        }
        
        return true;
    }

    /**
     * Password confirmation check.
     */
    function checkPasswordCurrent ($s)
    {
        $oAccount = BxDolAccount::getInstance();
        if (!$oAccount)
            return false;

        $aInfo = $oAccount->getInfo();
        $sPassCheck = encryptUserPwd($s, $aInfo['salt']);
                
        /**
         * @hooks
         * @hookdef hook-system-encrypt_password_after 'system', 'encrypt_password_after' - hook to override password using another encrypt function
         * - $unit_name - equals `system`
         * - $action - equals `encrypt_password_after`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `info` - [array]  account info array as key&value pairs
         *      - `pwd` - [string] original password
         *      - `password` - [string] by ref, encrypt password, can be overridden in hook processing
         * @hook @ref hook-system-encrypt_password_after
         */
        bx_alert('system', 'encrypt_password_after', 0, false, [
            'info' => $aInfo,
            'pwd' => $s,
            'password' => &$sPassCheck,
            'password_ref' => &$sPassCheck,
        ]);

        return $aInfo['password'] == $sPassCheck;
    }
    
    /**
     * Check if phone is exists.
     */
    function checkPhoneExist ($s)
    {
        $s = trim($s);
        if(!preg_match("/^\+[0-9\s]*$/", $s)) {
            return _t('_sys_form_forgot_password_phone_error_format');
        }

        return BxDolAccountQuery::getInstance()->getIdByPhone($s) ? _t('_sys_form_account_input_phone_uniq_error_loggedin') : true;
    }

    /**
     * Check if email is uniq.
     */
    function checkEmailUniq ($s)
    {
    	$s = trim($s);

        if (!$this->checkEmail($s))
            return false;

        $oAccount = BxDolAccount::getInstance();
        if ($oAccount) { // user is logged in
            $aAccountInfo = $oAccount->getInfo();
            if ($s == $aAccountInfo['email']) // don't check email for uniq, if it wasn't changed
                return true;
            return BxDolAccountQuery::getInstance()->getIdByEmail($s) ? _t('_sys_form_account_input_email_uniq_error_loggedin') : true;
        }

        return BxDolAccountQuery::getInstance()->getIdByEmail($s) ? _t('_sys_form_account_input_email_uniq_error', bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=forgot-password'))) : true;
    }
}

/**
 * Create/Edit Account Form.
 */
class BxBaseFormAccount extends BxTemplFormView
{
    static $FIELD_PICTURE = 'picture';
    static $FIELD_EMAIL = 'email';
    static $FIELD_PASSWORD = 'password';
    static $FIELD_PASSWORD_CHANGED = 'password_changed';
    static $FIELD_SALT = 'salt';
    static $FIELD_ADDED = 'added';
    static $FIELD_CHANGED = 'changed';
    static $FIELD_IP = 'ip';
    static $FIELD_REFERRED = 'referred';
    static $FIELD_PHONE = 'phone';

    protected $_bSetPendingApproval = false;

    protected $_sGhostTemplate = 'account_form_ghost_template.html';

    public function __construct($aInfo, $oTemplate)
    {
        parent::__construct($aInfo, $oTemplate);
        
        $this->_bSetPendingApproval = !(bool)getParam('sys_account_autoapproval');

        $this->aParams['checker_errors']['summary']['disabled'] = true;

        if(($sField = 'picture') && isset($this->aInputs[$sField])) {
            /**
             * Note. For now Account Picture is available in edit form only. 
             * To make it available on create form Uploader should correctly support 
             * uploading by visitor.
             */
            if($this->aParams['display'] == 'sys_account_settings_info')
                $this->aInputs[$sField] = array_merge($this->aInputs[$sField], [
                    'storage_object' => 'sys_accounts_pictures',
                    'uploaders' => !empty($this->aInputs[$sField]['value']) ? unserialize($this->aInputs[$sField]['value']) : ['sys_crop'],
                    'images_transcoder' => 'sys_accounts_thumb',
                    'storage_private' => 0,
                    'multiple' => false,
                    'content_id' => 0,
                    'ghost_template' => ''
                ]);
            else
                unset($this->aInputs[$sField]);
        }
    }

    function isValid ()
    {
        if (!parent::isValid ())
            return false;

        if (isLogged() || !$this->isSubmitted()) return true; // exit in case it is an account edit or form has not been submitted yet

        $sErrorMsg = '';
        
        /**
         * @hooks
         * @hookdef hook-account-check_join 'account', 'check_join' - hook to check email address for spam
         * - $unit_name - equals `account`
         * - $action - equals `check_join`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `error_msg` - [string] by ref, error message, can be overridden in hook processing
         *      - `email` - [string] email address to check
         *      - `approve` - [boolean] by ref, pending approval status for created profile, can be overridden in hook processing
         * @hook @ref hook-account-check_join
         */
        bx_alert('account', 'check_join', 0, false, [
            'error_msg' => &$sErrorMsg, 
            'error_msg_ref' => &$sErrorMsg, 
            'email' => $this->getCleanValue('email'), 
            'approve' => &$this->_bSetPendingApproval,
            'approve_ref' => &$this->_bSetPendingApproval,
        ]);
        if ($sErrorMsg)
            $this->_setCustomError ($sErrorMsg);

        return $sErrorMsg ? false : true;
    }

    public function isSetPendingApproval()
    {
        return $this->_bSetPendingApproval;
    }

    public function setPendingApproval($b)
    {
        return ($this->_bSetPendingApproval = $b);
    }

    public function initChecker ($aValues = [], $aSpecificValues = [])
    {
        $bValues = $aValues && !empty($aValues['id']);

        if(($sField = 'picture') && isset($this->aInputs[$sField])) {
            if($bValues)
                $this->aInputs[$sField]['content_id'] = $aValues['id'];

            $this->aInputs[$sField]['ghost_template'] = $this->oTemplate->parseHtmlByName($this->_sGhostTemplate, $this->_getGhostTmplVars($sField));
        }

        parent::initChecker($aValues, $aSpecificValues);
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $iNow = time();

    	$sEmail = isset($aValsToAdd[self::$FIELD_EMAIL]) ? $aValsToAdd[self::$FIELD_EMAIL] : $this->getCleanValue(self::$FIELD_EMAIL);
    	$sEmail = trim(strtolower($sEmail));

        $sPhone = isset($aValsToAdd[self::$FIELD_PHONE]) ? $aValsToAdd[self::$FIELD_PHONE] : $this->getCleanValue(self::$FIELD_PHONE);
    	$sPhone = trim(strtolower($sPhone));

        $sPwd = isset($aValsToAdd[self::$FIELD_PASSWORD]) ? $aValsToAdd[self::$FIELD_PASSWORD] : $this->getCleanValue(self::$FIELD_PASSWORD);
        $sSalt = genRndSalt();
        $sPasswordHash = encryptUserPwd($sPwd, $sSalt);

        return parent::insert(array_merge($aValsToAdd, [
            self::$FIELD_EMAIL => $sEmail, 
            self::$FIELD_PASSWORD => $sPasswordHash,
            self::$FIELD_PASSWORD_CHANGED => $iNow,
            self::$FIELD_SALT => $sSalt,
            self::$FIELD_ADDED => $iNow,
            self::$FIELD_CHANGED => $iNow,
            self::$FIELD_IP => getVisitorIP(),
            self::$FIELD_REFERRED => isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '',
            self::$FIELD_PHONE => $sPhone,
        ]), $isIgnore);
    }

    function update ($val, $aValsToAdd = [], &$aTrackTextFieldsChanges = null)
    {
        $oDb = BxDolAccountQuery::getInstance();
        $iNow = time();

        $_aValsToAdd = [
            self::$FIELD_CHANGED => $iNow
        ];

        if(($mixedPicture = $this->getCleanValue(self::$FIELD_PICTURE))) {
            $iPicture = is_array($mixedPicture) ? array_pop($mixedPicture) : (int)$mixedPicture;
            if($iPicture)
                $_aValsToAdd[self::$FIELD_PICTURE] = $iPicture;
        }

        if(($sPwd = $this->getCleanValue(self::$FIELD_PASSWORD))) {
            $oDb->logPassword($val);

            $sSalt = genRndSalt();
            $sPasswordHash = encryptUserPwd($sPwd, $sSalt);            

            $_aValsToAdd = array_merge($_aValsToAdd, [
                self::$FIELD_PASSWORD => $sPasswordHash,
                self::$FIELD_PASSWORD_CHANGED => $iNow,
                self::$FIELD_SALT => $sSalt
            ]);
        }

        $aInfoOld = $oDb->getInfoById($val);

        $bResult = parent::update($val, array_merge($aValsToAdd, $_aValsToAdd), $aTrackTextFieldsChanges);
        if($bResult) {
            $aInfoNew = $oDb->getInfoById($val);

            /**
             * @hooks
             * @hookdef hook-account-change_receive_news 'account', 'change_receive_news' - hook after change receive_news parameter for account
             * - $unit_name - equals `system`
             * - $action - equals `change_receive_news` 
             * - $object_id - not used 
             * - $sender_id - not used 
             * - $extra_params - array of additional params with the following array keys:
             *      - `account_id` - [int] account id 
             *      - `old_value` - [bool] old value for receive_news parameter
             *      - `new_value` - [bool] new value for receive_news parameter
             *      - `email` - [string] account's email
             * @hook @ref hook-account-change_receive_news
             */
            bx_alert('account', 'change_receive_news', 0, false, [
                'account_id' => $val, 
                'old_value' => $aInfoOld['receive_news'], 
                'new_value' => $aInfoNew['receive_news'], 
                'email' => $aInfoNew['email']]
            );
        }

        return $bResult;
    }

    public function processFiles($sFieldFile, $iAccountId = 0, $isAssociateWithContent = false)
    {
        if (!isset($this->aInputs[$sFieldFile]))
            return true;

        $mixedFileIds = $this->getCleanValue($sFieldFile);
        if(!$mixedFileIds)
            return true;

        $oStorage = BxDolStorage::getObjectInstance($this->aInputs[$sFieldFile]['storage_object']);
        if (!$oStorage)
            return false;

        $iProfileId = 0;
        if($iAccountId && ($aAccountInfo = BxDolAccountQuery::getInstance()->getInfoById($iAccountId)))
            $iProfileId = $aAccountInfo['profile_id'];
        else
            $iProfileId = bx_get_logged_profile_id();

        $aGhostFiles = $oStorage->getGhosts ($iProfileId, $isAssociateWithContent ? 0 : $iAccountId, true, $this->_isAdmin());
        if(!empty($aGhostFiles) && is_array($aGhostFiles))
            foreach($aGhostFiles as $aFile) {
                if(is_array($mixedFileIds) && !in_array($aFile['id'], $mixedFileIds))
                    continue;

                if($aFile['private'])
                    $oStorage->setFilePrivate ($aFile['id'], 1);

                if($iAccountId)
                    $oStorage->updateGhostsContentId ($aFile['id'], $iProfileId, $iAccountId, $this->_isAdmin());
            }

        return true;
    }

    protected function genCustomInputAgreement ($aInput)
    {
    	$oPermalink = BxDolPermalinks::getInstance();
        return '<div>' . _t('_sys_form_account_input_agreement_value', bx_absolute_url($oPermalink->permalink('page.php?i=terms')), bx_absolute_url($oPermalink->permalink('page.php?i=privacy'))) . '</div>';
    }

    protected function _setCustomError ($s)
    {
        $this->aInputs['do_submit']['error'] = $s;
    }

    protected function _isAdmin()
    {
        return bx_acl_is_advanced();
    }

    protected function _getGhostTmplVars($sField)
    {
    	return [
            'name' => $this->aInputs[$sField]['name'],
            'content_id' => $this->aInputs[$sField]['content_id'],
            'bx_if:set_thumb' => [
                'condition' => false,
                'content' => [],
            ]
        ];
    }
}

/** @} */
