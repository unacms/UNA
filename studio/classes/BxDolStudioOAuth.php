<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

bx_import('BxDolStudioInstallerUtils');

class BxDolStudioOAuth extends BxDolFactory
{
    protected static $sSessionKeyToken = 'sys_oauth_token';
    protected static $sSessionKeySecret = 'sys_oauth_secret';
    protected static $sSessionKeyAuthorized = 'sys_oauth_authorized';
    protected static $sSessionKeyAuthorizedUser = 'sys_oauth_authorized_user';
    protected static $sSessionKeyAuthorizedOwner = 'sys_oauth_authorized_owner';

    protected $oSession;

    protected $sErrorCode;
    protected $sErrorMessage;

    protected $sKey;
    protected $sSecret;
    protected $sDataRetrieveMethod;

    protected function __construct()
    {
        parent::__construct ();

        $this->oSession = BxDolSession::getInstance();

        $this->sErrorCode = 'oauth_err_code';
        $this->sErrorMessage = 'oauth_err_message';
    }

    static function unsetAuthorized()
    {
        $oSession = BxDolSession::getInstance();
        $oSession->unsetValue(self::$sSessionKeyToken);
        $oSession->unsetValue(self::$sSessionKeyAuthorized);
        $oSession->unsetValue(self::$sSessionKeyAuthorizedUser);
        $oSession->unsetValue(self::$sSessionKeyAuthorizedOwner);
    }

    static function isAuthorizedClient()
    {
        return (int)BxDolSession::getInstance()->getValue(self::$sSessionKeyAuthorized) == 1;
    }

    static function getAuthorizedClient()
    {
        return (int)BxDolSession::getInstance()->getValue(self::$sSessionKeyAuthorizedUser);
    }

    static function isAuthorizedOwner()
    {
        return (int)BxDolSession::getInstance()->getValue(self::$sSessionKeyAuthorizedOwner) == 1;
    }

    public function loadItems($aParams = array())
    {
        if(empty($this->sKey) || empty($this->sSecret))
            return MsgBox($this->getEmptyKeySecretMessage());

        $mixedResult = $this->authorize();
        if($mixedResult !== true)
            return $this->onAuthorizeFailed($mixedResult);

        $aItems = $this->fetch($aParams);
        if(is_null($aItems))
            return MsgBox(_t('_adm_err_oauth_cannot_read_answer'));
        else if(empty($aItems))
            return MsgBox(_t('_Empty'));

        return $aItems;
    }

    /**
     * Sign in to the UNA market. Without a session the browser is sent to the market's sign-in page, or with $bRedirect
     * false it gets a message that links there, so a page that only might need the market still opens when it is offline.
     * @return true when signed in, otherwise the message to show
     */
    public function doAuthorize($bRedirect = true)
    {
        if(empty($this->sKey) || empty($this->sSecret))
            return MsgBox($this->getEmptyKeySecretMessage());

        $mixedResult = $this->authorize();
        if($mixedResult !== true)
            return $this->onAuthorizeFailed($mixedResult, $bRedirect);

        BxDolStudioInstallerUtils::getInstance()->checkModules(true);
        return $mixedResult;
    }

    /**
     * No UNA account key and secret yet: where to enter them (Settings > System > General).
     */
    protected function getEmptyKeySecretMessage()
    {
        return _t('_adm_err_oauth_empty_key_secret', BX_DOL_URL_STUDIO . 'settings.php?page=system&category=general');
    }

    protected function onAuthorizeFailed($mixedResult, $bRedirect = true)
    {
        if(is_string($mixedResult))
            return MsgBox($mixedResult);

        $bArray = is_array($mixedResult);
        if($bRedirect && $bArray && !empty($mixedResult['redirect'])) {
            header('Location: ' . $mixedResult['redirect']);
            exit;
        }

        if($bArray && !empty($mixedResult['message']))
            return MsgBox($mixedResult['message']);
    }

    protected function isAuthorized()
    {
        return self::isAuthorizedClient();
    }

    protected function getAuthorizedUser()
    {
    	return self::getAuthorizedClient();
    }

    protected function unsetAuthorizedUser()
    {
        self::unsetAuthorized();
    }

    protected function isServerError($aResult)
    {
        return isset($aResult[$this->sErrorCode]) && isset($aResult[$this->sErrorMessage]);
    }
}

/** @} */
