<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defdroup    GitHub GitHub
 * @indroup     UnaModules
 *
 * @{
 */

/*
 * 
 * Register App
 * https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
 * 
 * Create "Login with GitHub" web flow.
 * https://docs.github.com/en/apps/creating-github-apps/writing-code-for-a-github-app/building-a-login-with-github-button-with-a-github-app
 * 
 */

class BxGitHubApp extends BxDol
{
    protected $_oModule;

    protected $_sClientId;
    protected $_sClientSecret;

    protected $_sUrlAuthorize;
    protected $_sUrlAccessToken;

    protected $_bInit;

    public function __construct(&$oModule)
    {
        $this->_oModule = $oModule;

        $this->_sUrlAuthorize = 'https://github.com/login/oauth/authorize';
        $this->_sUrlAccessToken = 'https://github.com/login/oauth/access_token';

        $this->_bInit = false;
    }

    public function init($iAppId)
    {
        $aApp = $this->_oModule->_oDb->getApps(['sample' => 'id', 'id' => $iAppId]);
        if(empty($aApp) || !is_array($aApp))
            return false;

        $this->_sClientId = $aApp['client_id'] ?? false;
        $this->_sClientSecret = $aApp['client_secret'] ?? false;

        $this->_bInit = $this->_sClientId && $this->_sClientSecret;

        return true;
    }

    public function getUrlAuthorize()
    {
        return bx_append_url_params($this->_sUrlAuthorize, [
            'client_id' => $this->_sClientId
        ]);
    }

    public function getAccessToken($sCode)
    {        
        $mixedResponse = $this->_apiCallAccessToken($this->_sUrlAccessToken, [
            'code' => $sCode
        ]);

        if($mixedResponse === false || empty($mixedResponse['access_token'])) {
            $this->_oModule->log(['Get Access Token:', $mixedResponse], BX_LOG_ERR);

            return false;
        }

        $aResult = [
            'access_token' => $mixedResponse['access_token']
        ];

        if(isset($mixedResponse['expires_in'], $mixedResponse['refresh_token'], $mixedResponse['refresh_token_expires_in']))
            $aResult = array_merge($aResult, [
                'at_expires_in' => $mixedResponse['expires_in'],
                'refresh_token' => $mixedResponse['refresh_token'],
                'rt_expires_in' => $mixedResponse['refresh_token_expires_in']
            ]);

        return $aResult;
    }

    public function refreshAccessToken($sRefreshToken)
    {
        $mixedResponse = $this->_apiCallAccessToken($this->_sUrlAccessToken, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $sRefreshToken
        ]);

        if($mixedResponse === false || !isset($mixedResponse['access_token'], $mixedResponse['refresh_token'])) {
            $this->_oModule->log(['Refresh Access Token:', $mixedResponse], BX_LOG_ERR);

            return false;
        }

        return [
            'access_token' => $mixedResponse['access_token'],
            'at_expires_in' => $mixedResponse['expires_in'],
            'refresh_token' => $mixedResponse['refresh_token'],
            'rt_expires_in' => $mixedResponse['refresh_token_expires_in']
        ];
    }

    protected function _apiCallAccessToken($sEndpoint, $aParams = [])
    {
        $sResponse = $this->_apiCall($sEndpoint, array_merge([
            'client_id' => $this->_sClientId,
            'client_secret' => $this->_sClientSecret,
        ], $aParams));

        return !empty($sResponse) ? json_decode($sResponse, true) : false;
    }

    protected function _apiCall($sEndpoint, $aParams = [], $aHeaders = [], $sMethod = 'post', $aBasicAuth = [], &$sHttpCode = null)
    {
        $aHeaders = array_merge([
            'Accept: application/json',
        ], $aHeaders);

        return bx_file_get_contents($sEndpoint, $aParams, $sMethod, $aHeaders, $sHttpCode, $aBasicAuth);
    }
}