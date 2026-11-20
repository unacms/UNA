<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaConnect Dolphin Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxDolConModule extends BxBaseModConnectModule
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
        return (bool)($this->_oConfig->sApiID && $this->_oConfig->sApiSecret && trim(getParam('bx_dolcon_url'), '/'));
    }

    /**
     * Redirect to remote site login form
     *
     * @return n/a/ - redirect or HTML page in case of error
     */
    function actionStart()
    {
        if (isLogged())
            $this->_redirect ($this -> _oConfig -> sDefaultRedirectUrl);

        if (!$this->isConfigured()) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_dolcon_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_dolcon'), $sCode);            
        } 
        else {

            // define redirect URL to the remote site
            $sUrl = bx_append_url_params($this->_oConfig->sApiUrl . 'auth', array(
                'response_type' => 'code',
                'client_id' => $this->_oConfig->sApiID,
                'redirect_uri' => $this->_oConfig->sPageHandle,
                'scope' => $this->_oConfig->sScope,
                'state' => $this->_genToken(),
            ));
            $this->_redirect($sUrl);
        }
    }

    function actionHandle()
    {
        return $this->_actionHandle();
    }

    protected function _makeFriends($iProfileId)
    {
        return parent::__makeFriends($iProfileId);
    }
    
    /**
     * @param $aProfileInfo - remote profile info
     * @param $sAlternativeName - suffix to add to NickName to make it unique
     * @return profile array info, ready for the local database
     */
    protected function _convertRemoteFields($aProfileInfo, $sAlternativeName = '')
    {
        $aProfileFields = $aProfileInfo;

        $sFullname = $aProfileInfo['NickName'];
        if (!empty($aProfileInfo['FullName']))
            $sFullname = $aProfileInfo['FullName'];
        if (!empty($aProfileInfo['FirstName']))
            $sFullname = $aProfileInfo['FirstName'] . (!empty($aProfileInfo['LastName']) ? ' ' . $aProfileInfo['LastName'] : '');

        $aProfileFields['name'] = $aProfileInfo['NickName'];
        $aProfileFields['gender'] = isset($aProfileInfo['Sex']) && ('male' == $aProfileInfo['Sex'] || 'female' == $aProfileInfo['Sex']) ? ('male' == $aProfileInfo['Sex'] ? 1 : 2) : '';
        $aProfileFields['birthday'] = isset($aProfileInfo['DateOfBirth']) ? $aProfileInfo['DateOfBirth'] : '';
        $aProfileFields['fullname'] = $sFullname;
        $aProfileFields['picture'] = $aProfileInfo['picture'];
        $aProfileFields['description'] = $aProfileInfo['DescriptionMe'];
        $aProfileFields['allow_view_to'] = getParam('bx_dolcon_privacy');
            
        return $aProfileFields;
    }
}

/** @} */
