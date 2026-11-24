<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    DrupalConnect Drupal Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDrupalModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }

    /**
     * Logins are checked against Drupal only once its login URL is set; until then the site's own login form stays.
     */
    public function isConfigured()
    {
        return (bool)getParam('bx_drupal_login_url');
    }

    /**
     * Drupal accounts sign in through the login form itself, the module has no "Continue with" page to link to.
     */
    public function isAuthButtonShown()
    {
        return false;
    }

    function actionLoginSubmit()
    {
        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

        $oForm = BxDolForm::getObjectInstance('bx_drupal_login', 'bx_drupal_login');

        $oForm->initChecker();
        $oForm->setRole(bx_get('role'));
        $bLoginSuccess = $oForm->isSubmittedAndValid();

        // sign in the local account of the Drupal user that the password was checked for, not an account found by the typed login;
        // the account may still be refused (locked) or continue with two-factor sign-in
        $mixedLogged = false;
        $sUrl2fa = '';
        if ($bLoginSuccess) {
            $mixedLogged = $this->setLogged($oForm->getProfileId(), '', false, $oForm->getCleanValue('rememberMe') ? true : false);
            if (is_array($mixedLogged)) {
                $sUrl2fa = $mixedLogged['redirect'];
            }
            elseif (true !== $mixedLogged) {
                $bLoginSuccess = false;
            }
        }

        $bAjxMode = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') ? true : false;
        if ($bAjxMode) {

            if ($sUrl2fa) {
                $s = _t('_sys_txt_login_2fa_continue', $sUrl2fa);
            }
            elseif ($bLoginSuccess) {
                $s = 'OK';
            }
            else {
                $s = is_string($mixedLogged) ? $mixedLogged : $oForm->getLoginError();
            }

            if (isset($_SERVER['HTTP_ACCEPT'])) {
                if (false !== strpos($_SERVER['HTTP_ACCEPT'], 'application/json') || false !== strpos($_SERVER['HTTP_ACCEPT'], 'text/javascript')) {
                    header('Content-type: application/json; charset=utf-8');
                    echo json_encode(['res' => $s, 'form' => $oForm->getCode()] + ($sUrl2fa ? ['redirect' => $sUrl2fa] : []));
                    exit;
                }
            }

            header('Content-type: text/html; charset=utf-8');
            echo $s;

            exit;

        }
        elseif ($sUrl2fa) {
            header('Location: ' . $sUrl2fa);
            exit;
        }
        elseif ($bLoginSuccess) {

            $sUrlRelocate = $oForm->getCleanValue('relocate');
            if (!$sUrlRelocate || 0 !== strncmp($sUrlRelocate, BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)))
                $sUrlRelocate = BX_DOL_ROLE_ADMIN == $oForm->getRole() ? BX_DOL_URL_STUDIO . 'launcher.php' : BX_DOL_URL_ROOT . 'member.php';

            BxDolTemplate::getInstance()->setPageNameIndex (BX_PAGE_TRANSITION);
            BxDolTemplate::getInstance()->setPageHeader (_t('_Please Wait'));
            BxDolTemplate::getInstance()->setPageContent ('page_main_code', BxDolTemplate::getInstance()->parseHtmlByName('transition_wait.html', ['text' => _t('_Please Wait')]));
            BxDolTemplate::getInstance()->setPageContent ('url_relocate', bx_html_attribute($sUrlRelocate, BX_ESCAPE_STR_QUOTE));

            BxDolTemplate::getInstance()->getPageCode();
            exit;
        }
        elseif (is_string($mixedLogged)) {
            $this->_oTemplate->getPage(_t('_Error'), MsgBox($mixedLogged));
            exit;
        }

        bx_require_authentication();

        header('Location: ' . BX_DOL_URL_ROOT);
    }

    /**
     * Find or create the local profile of a Drupal user whose password Drupal has accepted. It doesn't sign anyone in.
     * @param $aRemoteProfileInfo - the user info Drupal returned
     * @return local profile id, or an error message string
     */
    public function serviceHandleUser($aRemoteProfileInfo)
    {
        // it trusts the remote profile info given by the caller, so it is for internal calls only (not for API clients)
        if (BxDolService::isExternalCall($this->getName(), 'handle_user')) {
            return false;
        }

        $mixedRemoteId = $aRemoteProfileInfo['user']['uid'] ?? null;
        if (null === $mixedRemoteId) {
            return _t('_sys_connect_profile_error_info');
        }

        // check if user logged in before
        $iLocalProfileId = $this->_oDb->getProfileId($mixedRemoteId);
        $oProfile = $iLocalProfileId ? BxDolProfile::getInstance($iLocalProfileId) : null;
        if ($oProfile) {
            bx_alert($this->getName(), 'login', 0, $oProfile->id(), array('remote_profile_info' => $aRemoteProfileInfo));
            return $oProfile->id();
        }

        // register new user, or link an existing account with the same verified email
        $aRemoteProfileInfo['id'] = $mixedRemoteId;
        return $this->_createProfileId($aRemoteProfileInfo);
    }

    /**
     * Create the local profile of a new Drupal user, without signing in.
     * @return local profile id, or an error message string
     */
    protected function _createProfileId($aRemoteProfileInfo)
    {
        $mixed = $this->_createProfileRaw($aRemoteProfileInfo, '', true, false);
        if (is_array($mixed) && isset($mixed['join_page_redirect'])) {
            $this->_getJoinPage($mixed['profile_fields'], $mixed['remote_profile_info']['id']);
            exit;
        }

        if (is_array($mixed) && !empty($mixed['profile_id'])) {
            return (int)$mixed['profile_id'];
        }

        return is_string($mixed) && $mixed !== '' ? $mixed : _t('_sys_txt_error_account_creation');
    }

    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $sFirstName = '';
        if (isset($aProfileInfo['user']) && isset($aProfileInfo['user']['field_first_name'])) {
            $a = array_pop($aProfileInfo['user']['field_first_name']['und']);
            $sFirstName = $a['value'];
        }
        
        $sLastName = '';
        if (isset($aProfileInfo['user']) && isset($aProfileInfo['user']['field_last_name'])) {
            $a = array_pop($aProfileInfo['user']['field_last_name']['und']);
            $sLastName = $a['value'];
        }

        if (empty($sFirstName)) {
            if (isset($aProfileInfo['user']['mail']) && false !== ($iPos = mb_strpos($aProfileInfo['user']['mail'], '@')))
                $sFirstName = mb_substr($aProfileInfo['user']['mail'], 0, $iPos);
        }

        $aProfileFields['id'] = $aProfileInfo['user']['uid'];
        $aProfileFields['name'] = empty($sFirstName) ? $aProfileInfo['user']['uid'] : $sFirstName;
        $aProfileFields['fullname'] = $sFirstName . (empty($sLastName) ? '' : ' ' . $sLastName);
        $aProfileFields['email'] = isset($aProfileInfo['user']['mail']) ? $aProfileInfo['user']['mail'] : '';
        $aProfileFields['picture'] = isset($aProfileInfo['user']['picture']) ? $aProfileInfo['user']['picture'] : '';
        $aProfileFields['allow_view_to'] = getParam('bx_drupal_privacy');
        
        return $aProfileFields;
    }
}

/** @} */
