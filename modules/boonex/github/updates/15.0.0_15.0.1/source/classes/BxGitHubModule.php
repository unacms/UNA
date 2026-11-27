<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    GitHub GitHub
 * @ingroup     UnaModules
 *
 * @{
 */

define('BX_GITHUB_AUTHORIZE_APP', 'app');
define('BX_GITHUB_AUTHORIZE_PAT', 'pat');

class BxGitHubModule extends BxBaseModGeneralModule
{
    protected $_iLoggedId;

    protected $_oApi;

    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);

        $this->_iLoggedId = bx_get_logged_profile_id();

        $this->_oApi = $this->getObjectApi();
        /*
         * Below authorization using profile ID only is used 
         * when "Personal Access Token" authorization is enabled.
         */
        if($this->_iLoggedId && ($sAccessToken = $this->getAccessToken($this->_iLoggedId)) !== false)
            $this->_oApi->init($sAccessToken);
    }

    /**
     * ACTION METHODS
     */
    public function actionAuthorize($iAppId)
    {
        $CNF = &$this->_oConfig->CNF;

        if(($oApp = $this->getObjectApp($iAppId)) !== false && ($sCode = bx_get('code')) !== false) {
            $aAccessToken = $oApp->getAccessToken($sCode);
            if($aAccessToken !== false) {
                $this->_oDb->insertAuthorization($this->_iLoggedId, $iAppId, $aAccessToken);

                header('Location: ' . BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($CNF['URL_SETTINGS']));
                exit;
            }
        }

        return $this->_oTemplate->displayErrorOccured();
    }
    
    /**
     * SERVICE METHODS
     */
    public function serviceGetOptionsAuthorize()
    {
        $aResult = [];
        foreach(['pat', 'app'] as $sItem)
            $aResult[] = [
                'key' => $sItem, 
                'value' => _t('_bx_github_option_authorize_' . $sItem)
            ];

        return $aResult;
    }

    public function serviceGetApps($iProfileId)
    {
        if(!$this->_oConfig->isAuthorizeByApp())
            return false;

        if(!$iProfileId)
            return [];

        return $this->_oDb->getApps(['sample' => 'profile_id', 'profile_id' => $iProfileId]);
    }

    public function serviceRefreshAccessToken($iAppId, $iProfileId = 0)
    {
        if(!$this->_oConfig->isAuthorizeByApp())
            return false;

        if(!$iProfileId && !($iProfileId = $this->_iLoggedId))
            return false;

        return $this->refreshAccessToken($iProfileId, $iAppId);
    }

    public function serviceGetBlockAuthorize($iAppId, $iProfileId = 0)
    {
        if(!$this->_oConfig->isAuthorizeByApp())
            return '';

        if(!$iProfileId && !($iProfileId = $this->_iLoggedId))
            return '';

        return $this->_oTemplate->getBlockAuthorize($iAppId, $iProfileId);
    }

    public function serviceGetBlockApps($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId || ($iProfileId != $this->_iLoggedId && !$this->_isAdministrator()))
            $iProfileId = $this->_iLoggedId;

        if(!$iProfileId)
            return MsgBox(_t('_sys_txt_access_denied'));

        if(($mixedCheck = $this->checkAllowedAddApp($iProfileId)) !== CHECK_ACTION_RESULT_ALLOWED)
            return MsgBox($mixedCheck);

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_APPS']);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        $oGrid->setProfileId($iProfileId);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }

    public function serviceGetBlockAuthorizations($iProfileId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iProfileId || ($iProfileId != $this->_iLoggedId && !$this->_isAdministrator()))
            $iProfileId = $this->_iLoggedId;

        if(!$iProfileId)
            return MsgBox(_t('_sys_txt_access_denied'));

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_AUTHORIZATIONS']);
        if(!$oGrid)
            return $this->_bIsApi ? [] : '';

        $oGrid->setProfileId($iProfileId);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }

    public function serviceGetBlockSettings($iProfileId = 0)
    {
        if(!$iProfileId || ($iProfileId != $this->_iLoggedId && !$this->_isAdministrator()))
            $iProfileId = $this->_iLoggedId;

        if(!$iProfileId)
            return MsgBox(_t('_sys_txt_access_denied'));

        return $this->_oTemplate->getBlockSettingsClient($iProfileId);
    }

    public function serviceGetRepositories($sUsername, $mixedAuth)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->getRepositories($sUsername);
    }

    public function serviceGetIssues($sUsername, $sRepository, $mixedAuth, $sState = 'open')
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->getIssues($sUsername, $sRepository, $sState);
    }

    public function serviceGetIssue($sUsername, $sRepository, $mixedAuth, $iIssue)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->getIssue($sUsername, $sRepository, $iIssue);
    }

    public function serviceCreateIssue($sUsername, $sRepository, $mixedAuth, $sTitle, $sText = '', $aParams = [])
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->createIssue($sUsername, $sRepository, $sTitle, $sText, $aParams);
    }

    public function serviceUpdateIssue($sUsername, $sRepository, $mixedAuth, $iIssue, $aParams)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->updateIssue($sUsername, $sRepository, $iIssue, $aParams);
    }

    public function serviceCloseIssue($sUsername, $sRepository, $mixedAuth, $iIssue)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->updateIssue($sUsername, $sRepository, $iIssue, ['state' => 'closed']);
    }

    public function serviceReopenIssue($sUsername, $sRepository, $mixedAuth, $iIssue)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->updateIssue($sUsername, $sRepository, $iIssue, ['state' => 'open']);
    }

    public function serviceCreateLabel($sUsername, $sRepository, $mixedAuth, $mixedLabel)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->createLabel($sUsername, $sRepository, $mixedLabel);
    }

    public function serviceAddLabel($sUsername, $sRepository, $mixedAuth, $iIssue, $mixedLabel)
    {
        $this->_authenticate($mixedAuth);

        return $this->_oApi->addLabel($sUsername, $sRepository, $iIssue, $mixedLabel);
    }

    /*
     * COMMON METHODS
     */
    public function getObjectApi()
    {
        bx_import('Api', $this->_aModule);
        return new BxGitHubApi($this);
    }

    public function getObjectApp($iAppId)
    {
        bx_import('App', $this->_aModule);
        $oApp = new BxGitHubApp($this);
        return $oApp->init($iAppId) ? $oApp : false;
    }

    public function getAccessToken($iProfileId, $iAppId = 0)
    {
        $sToken = '';

        if($this->_oConfig->isAuthorizeByApp()) {
            if(!$iAppId)
                return false;

            $aAuthorization = $this->_oDb->getAuthorization($iProfileId, $iAppId);
            if($aAuthorization === false)
                return false;

            if(($iExpiresIn = (int)$aAuthorization['at_expires_in']) != 0 && ((int)$aAuthorization['changed'] + $iExpiresIn) < time()) {
                $this->refreshAccessToken($iProfileId, $iAppId, $aAuthorization['refresh_token']);

                $aAuthorization = $this->_oDb->getAuthorization($iProfileId, $iAppId);
                if($aAuthorization === false)
                    return false;
            }

            $sToken = $aAuthorization['access_token'];
        }
        else {
            $aSettings = $this->_oDb->getSettings(['sample' => 'profile_id', 'profile_id' => $iProfileId]);
            if(empty($aSettings) || !is_array($aSettings) || empty($aSettings['pat']))
                return false;

            $sToken = $aSettings['pat'];
        }

        return $sToken;
    }

    public function refreshAccessToken($iProfileId, $iAppId, $sRefreshToken = '')
    {
        $oApp = $this->getObjectApp($iAppId);
        if(!$oApp)
            return false;

        if(!$sRefreshToken) {
            $aAuthorization = $this->_oDb->getAuthorizations([
                'sample' => 'profile_app_ids',
                'profile_id' => $iProfileId,
                'app_id' => $iAppId
            ]);
            if(!$aAuthorization || !is_array($aAuthorization) || empty($aAuthorization['refresh_token']))
                return false;

            $sRefreshToken = $aAuthorization['refresh_token'];
        }

        $aAccessToken = $oApp->refreshAccessToken($sRefreshToken);
        if(!$aAccessToken)
            return false;

        return $this->_oDb->insertAuthorization($iProfileId, $iAppId, $aAccessToken) !== false;
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedAddApp($iProfileId, $isPerformAction = false)
    {
        $aCheck = checkActionModule($iProfileId, 'add app', $this->getName(), $isPerformAction);

        return $aCheck[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $aCheck[CHECK_ACTION_MESSAGE] : CHECK_ACTION_RESULT_ALLOWED;
    }

    public function log($sContents, $iLevel = BX_LOG_DEBUG)
    {
        $CNF = &$this->_oConfig->CNF;

        if (is_array($sContents))
            $sContents = var_export($sContents, true);	
        else if (is_object($sContents))
            $sContents = json_encode($sContents);

        bx_log($CNF['OBJECT_LOG_API'], $sContents, $iLevel);
    }

    protected function _authenticate($mixedAuth)
    {
        if(!$mixedAuth)
            return;

        $iProfileId = $iAppId = 0;
        if(is_array($mixedAuth) && ($iAuthParams = count($mixedAuth)))
            if($iAuthParams == 2)
                list($iProfileId, $iAppId) = $mixedAuth;
            else
                $iProfileId = (int)reset($mixedAuth);
        else
            $iProfileId = (int)$mixedAuth;

        if(($iProfileId && $iProfileId != $this->_iLoggedId) || $iAppId) {
            $sAccessToken = $this->getAccessToken($iProfileId, $iAppId);
            if($sAccessToken !== false)
                $this->_oApi->init($sAccessToken);
        }
    }
}

/** @} */
