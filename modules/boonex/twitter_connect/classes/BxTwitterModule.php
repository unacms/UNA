<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    TwitterConnect Twitter Connect
 * @ingroup     UnaModules
 *
 * @{
 */

use OAuth\OAuth1\Service\Twitter;
use OAuth\Common\Storage\Session;
use OAuth\Common\Consumer\Credentials;

class BxTwitterModule extends BxBaseModConnectModule
{
    protected $_oStorage;
    protected $_oCredentials;

    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * The settings the module needs to sign people in are filled in.
     */
    public function isConfigured()
    {
        return (bool)($this->_oConfig->sApiID && $this->_oConfig->sApiSecret);
    }

    /**
     * Redirect to remote site login form
     *
     * @return n/a - redirect or HTML page in case of error
     */
    function actionStart()
    {
        if (isLogged())
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);
        
        if (!$this->isConfigured()) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_twitter_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_twitter'), $sCode);            
        } 
        else {
            $this->_init();
            $oToken = $this->_oTwitterService->requestRequestToken();
            $sUrl = $this->_oTwitterService->getAuthorizationUri(array('oauth_token' => $oToken->getRequestToken()));
            $this->_redirect($sUrl);
        }
    }

    function actionHandle()
    {
        require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

        // check token
        if (empty($_GET['oauth_token'])) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_bx_twitter_error_no_oauth_token')));
            return;
        }

        $this->_init();

        $oToken = $this->_oStorage->retrieveAccessToken('Twitter');
        
        $this->_oTwitterService->requestAccessToken(
            $_GET['oauth_token'],
            $_GET['oauth_verifier'],
            $oToken->getRequestTokenSecret()
        );

        $s = $this->_oTwitterService->request('account/verify_credentials.json?include_email=true');

        // handle error
        if (!$s || NULL === ($aResponse = json_decode($s, true)) || !$aResponse || !isset($aResponse['id'])) {
            $sErrorDescription = _t('_error occured'); 
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($sErrorDescription));
            return;
        }

        $aRemoteProfileInfo = $aResponse;

        if ($aRemoteProfileInfo) {

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aRemoteProfileInfo['id']);
            
            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile ->id());
            }             
            else {  
                // register new user
                $this->_createProfile($aRemoteProfileInfo);
            }
        } 
        else {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox(_t('_sys_connect_profile_error_info')));
        }
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;

        $aProfileFields['name'] = $aProfileInfo['screen_name'];
        $aProfileFields['fullname'] = $aProfileInfo['name'];
        $aProfileFields['email'] = isset($aProfileInfo['email']) ? $aProfileInfo['email'] : '';
        $aProfileFields['picture'] = isset($aProfileInfo['profile_image_url']) ? str_replace('_normal', '', $aProfileInfo['profile_image_url']) : '';
        $aProfileFields['allow_view_to'] = getParam('bx_twitter_privacy');
        
        return $aProfileFields;
    }

    protected function _init() 
    {
        if ($this->_oStorage)
            return;

        $this->_oStorage = new Session();

        $this->_oCredentials = new Credentials(
            $this->_oConfig->sApiID,
            $this->_oConfig->sApiSecret,
            $this->_oConfig->sPageHandle
        );

        $oServiceFactory = new OAuth\ServiceFactory();

        $this->_oTwitterService = $oServiceFactory->createService('twitter', $this->_oCredentials, $this->_oStorage);
    }

}

/** @} */
