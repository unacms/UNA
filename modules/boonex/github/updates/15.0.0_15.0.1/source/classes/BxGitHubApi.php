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
 * Creating a fine-grained personal access token
 * https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token
 * 
 * Creating a personal access token (classic)
 * https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic
 * 
 * Web application flow
 * https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
 * 
 * PHP GitHub API
 * https://github.com/KnpLabs/php-github-api/tree/master/doc
 * 
 */

class BxGitHubApi extends BxDol
{
    protected $_oModule;

    protected $_oClient;
    protected $_sToken;
    protected $_bInit;

    public function __construct(&$oModule)
    {
        $this->_oModule = $oModule;

        $this->_oClient = new \Github\Client();

        $this->_sToken = '';
        $this->_bInit = false;
    }

    public function init($sToken)
    {
        if(!$sToken)
            return false;

        $this->_sToken = $sToken;
        $this->_bInit = true;

        return true;
    }

    public function authenticate()
    {
        if(!$this->_bInit)
            return false;      

        $this->_oClient->authenticate($this->_sToken, '', Github\AuthMethod::ACCESS_TOKEN);

        return true;
    }

    public function getRepositories($sUsername)
    {
        $aRepositories = [];
        if(!$this->authenticate())
            return $aRepositories;

        try {
            $aRepositories = $this->_oClient->api('user')->repositories($sUsername);
        } catch (Exception $ex) {
            $this->_processException('Get Repositories:', $oException);
        }

        return $aRepositories;
    }

    public function getIssues($sUsername, $sRepository, $sState = 'open')
    {
        $aIssues = [];
        if(!$this->authenticate())
            return $aIssues;

        try {
            $aIssues = $this->_oClient->api('issue')->all($sUsername, $sRepository, ['state' => $sState]);
        }
        catch (Exception $oException) {
            $this->_processException('Get Issues:', $oException);
        }

        return $aIssues;
    }

    public function getIssue($sUsername, $sRepository, $iIssue)
    {
        $aIssue = [];
        if(!$this->authenticate() || !$iIssue)
            return $aIssue;

        try {
            $aIssue = $this->_oClient->api('issue')->show($sUsername, $sRepository, $iIssue);
        }
        catch (Exception $oException) {
            $this->_processException('Get Issue:', $oException);
        }

        return $aIssue;
    }

    public function createIssue($sUsername, $sRepository, $sTitle, $sText = '', $aParams = [])
    {
        $aIssue = [];
        if(!$this->authenticate())
            return $aIssue;

        try {
            $aIssue = $this->_oClient->api('issue')->create($sUsername, $sRepository, array_merge(['title' => $sTitle, 'body' => $sText], $aParams));
        }
        catch (Exception $oException) {
            $this->_processException('Create Issue:', $oException);
        }

        return $aIssue;
    }

    public function updateIssue($sUsername, $sRepository, $iIssue, $aParams)
    {
        if(!$this->authenticate() || !$iIssue || !$aParams || !is_array($aParams))
            return false;

        $aIssue = false;

        try {
            $aIssue = $this->_oClient->api('issue')->update($sUsername, $sRepository, $iIssue, $aParams);
        } 
        catch (Exception $oException) {
            $this->_processException('Update issue:', $oException);
        }

        return $aIssue;
    }

    public function createLabel($sUsername, $sRepository, $mixedLabel)
    {
        $aResult = [];
        if(!$this->authenticate() || !$mixedLabel)
            return $aResult;

        return $this->_oClient->api('issue')->labels()->create($sUsername, $sRepository, is_array($mixedLabel) ? $mixedLabel : [
            'name' => $mixedLabel
        ]);
    }
    
    public function addLabel($sUsername, $sRepository, $iIssue, $sLabel)
    {
        if(!$this->authenticate() || !$iIssue || !$sLabel)
            return false;

        return $this->_oClient->api('issue')->labels()->add($sUsername, $sRepository, $iIssue, $sLabel);
    }

    protected function _processException($sMessage, &$oException)
    {
        $sError = $oException->getMessage();

        $this->_logError($sMessage . ' ' . $sError);

        return false;
    }

    protected function _logError($sContents)
    {
        $this->_oModule->log($sContents, BX_LOG_ERR);
    }
}