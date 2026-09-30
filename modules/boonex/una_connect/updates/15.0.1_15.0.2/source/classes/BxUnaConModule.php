<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaConnect UNA Connect
 * @ingroup     UnaModules
 *
 * @{
 */

class BxUnaConModule extends BxBaseModConnectModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
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

        if (!$this->_oConfig->sApiID || !$this->_oConfig->sApiSecret || !$this->_oConfig->sApiUrl) {
            require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
            bx_import('BxDolLanguages');
            $sCode =  MsgBox( _t('_bx_unacon_profile_error_api_keys') );
            $this->_oTemplate->getPage(_t('_bx_unacon'), $sCode);            
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

    public function serviceGetActions($aWidget)
    {
        $oInformer = BxDolInformer::getInstance(BxDolStudioTemplate::getInstance());
        $oInformer->add('sys-module-discontinued', _t('_adm_txt_modules_discontinued', BX_DOL_URL_STUDIO . 'module.php?name=bx_unacon', _t('_bx_unacon_settings')), BX_INFORMER_ALERT);

        return bx_srv('system', 'get_actions', [$aWidget], 'TemplStudioModules');
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

        $aProfileFields['name'] = $aProfileInfo['profile_display_name'];
        $aProfileFields['gender'] = isset($aProfileInfo['gender']) ? $aProfileInfo['gender'] : '';
        $aProfileFields['birthday'] = isset($aProfileInfo['birthday']) ? $aProfileInfo['birthday'] : '';
        $aProfileFields['fullname'] = $aProfileInfo['profile_display_name'];
        $aProfileFields['picture'] = $aProfileInfo['picture'];
        $aProfileFields['allow_view_to'] = getParam('bx_unacon_privacy');
        
        return $aProfileFields;
    }
}

/** @} */
