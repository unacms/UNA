<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    CASConnect CAS Connect
 * @ingroup     UnaModules
 *
 * @{
 */


class BxCASModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * The settings the module needs to sign people in are filled in.
     */
    public function isConfigured()
    {
        return (bool)(getParam('bx_cas_path_simplesamlphp'));
    }

	/**
	 * This service need to be called when we call logout from UNA,
	 * so it will propagate logout to IDP
	 * Other words: logout in UNA, IDP and all other SP
	 */
	public function serviceLogout()
	{
		if (!$this->isConfigured())
			return;
		if (!isLogged())
			return;

		bx_logout(false /* disable logout hook, so serviceLogout isn't called in a loop*/);

		require_once(getParam('bx_cas_path_simplesamlphp') . '/src/_autoload.php');

		$as = new \SimpleSAML\Auth\Simple('default-sp');
		$as->logout(BX_DOL_URL_ROOT);

		\SimpleSAML\Session::getSessionFromRequest()->cleanup();
	}

	/**
     * Redirect to remote site login form
     *
     * @return n/a - redirect or HTML page in case of error
     */
    public function actionStart()
    {
        if (isLogged())
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);

        if (!$this->isConfigured()) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_cas_profile_error_config') );
            $this->_oTemplate->getPage(_t('_bx_cas'), $sCode);
        }
	    else {
            // add referrer to the session to redirect after login
            if(isset($_SERVER['HTTP_REFERER']) && mb_stripos($_SERVER['HTTP_REFERER'], BX_DOL_URL_ROOT) === 0)
                BxDolSession::getInstance()->setValue($this->_oConfig->getName() . '_relocate', $_SERVER['HTTP_REFERER']);
                
            require_once(getParam('bx_cas_path_simplesamlphp') . '/src/_autoload.php');
			require_once(getParam('bx_cas_path_simplesamlphp') . '/una_helpers/session_cleanup_class.php');
            // session_cleanup_class.php must be included twice:
            //  - UNA: in BxCASModule.php (here)
            //  - SimpleSAMLPHP: in config/config.php
            // 
            // SAMPLE session_cleanup_class.php:
            // ```
            // if (!defined('BX_DOL_VERSION'))
	        //     require_once('/var/www/staging.novaliscircle.org/current/html/inc/header.inc.php');
            //
            // class BxCasLogoutCallback
            // {
            //     public static function run()
            //     {
            //         bx_logout(false);
            //     }
            // }
            // ```

            $as = new \SimpleSAML\Auth\Simple('default-sp');

            $as->requireAuth();

			\SimpleSAML\Session::getSessionFromRequest()->registerLogoutHandler('default-sp', 'BxCasLogoutCallback', 'run');

            $aAttributes = $as->getAttributes();

            // check if user logged in before
            $iLocalProfileId = $this->_oDb->getProfileId($aAttributes['salesforce_id'][0]);

            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

            if ($iLocalProfileId && $oProfile = BxDolProfile::getInstance($iLocalProfileId)) {
                // user already exists
                $this->setLogged($oProfile->id(), '', true, true); 
            }
            else {
                // register new user
                $aAttributes['id'] = $this->_getAttrValue($aAttributes['salesforce_id']);
                $this->_createProfile($aAttributes);
            }
        }
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = [];

        $aProfileFields['id'] = $this->_getAttrValue($aProfileInfo['some_id']); // TODO: change to actual value
        $aProfileFields['name'] = $this->_getAttrValue($aProfileInfo['some_name']); // TODO: change to actual value
        $aProfileFields['fullname'] = $this->_getAttrValue($aProfileInfo['first_name']) . ' ' . (isset($aProfileInfo['last_name']) ? $this->_getAttrValue($aProfileInfo['last_name']) : '');

		if (isset($aProfileInfo['first_name']))
            $aProfileFields['first_name'] = $this->_getAttrValue($aProfileInfo['first_name']);

        if (isset($aProfileInfo['last_name']))
            $aProfileFields['last_name'] = $this->_getAttrValue($aProfileInfo['last_name']);

        $aProfileFields['email'] = isset($aProfileInfo['email']) ? $this->_getAttrValue($aProfileInfo['email']) : '';
		$aProfileFields['allow_view_to'] = getParam('bx_cas_privacy');

        return $aProfileFields;
    }

    protected function _getAttrValue($a) 
    {
        if (isset($a[0]))
            return $a[0];
        return false;
    }

    public function serviceAccountAddFormCheck()
    {
        if (!getParam('bx_cas_disable_join_form'))
            return '';

        return '<div></div>';
    }
}

/** @} */
