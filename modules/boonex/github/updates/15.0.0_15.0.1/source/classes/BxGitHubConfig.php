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

class BxGitHubConfig extends BxBaseModGeneralConfig
{
    protected $_oDb;

    protected $_sAuthorize;

    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array (
            // database tables
            'TABLE_APPS' => $aModule['db_prefix'] . 'apps',
            'TABLE_AUTHORIZATIONS' => $aModule['db_prefix'] . 'authorizations',
            'TABLE_SETTINGS' => $aModule['db_prefix'] . 'settings',

            // database fields
            'FIELD_' => '',

            // some params
            'PARAM_AUTHORIZE' => 'bx_github_authorize',

            // page URIs
            'URL_SETTINGS' => 'page.php?i=github-settings',

            // objects
            'OBJECT_FORM_APPS' => 'bx_github_form_apps',
            'OBJECT_FORM_APPS_DISPLAY_ADD' => 'bx_github_form_apps_add',
            'OBJECT_FORM_APPS_DISPLAY_EDIT' => 'bx_github_form_apps_edit',
            'OBJECT_FORM_SETTINGS' => 'bx_github_form_settings',
            'OBJECT_FORM_SETTINGS_DISPLAY_EDIT' => 'bx_github_form_settings_edit',
            'OBJECT_GRID_APPS' => 'bx_github_apps',
            'OBJECT_GRID_AUTHORIZATIONS' => 'bx_github_authorizations',
            'OBJECT_LOG_API' => 'bx_github_api'
        );

        $sHtmlPrefix = str_replace('_', '-', $this->_sName);
        $this->_aHtmlIds = array_merge($this->_aHtmlIds, [
            'apps_popup_add' => $sHtmlPrefix . '-popup-apps-add',
            'apps_popup_edit' => $sHtmlPrefix . '-popup-apps-edit'
        ]);
    }

    public function init(&$oDb)
    {
        $this->_oDb = &$oDb;

        $this->_sAuthorize = getParam($this->CNF['PARAM_AUTHORIZE']);
    }

    public function getAuthorize()
    {
        return $this->_sAuthorize;
    }

    public function isAuthorizeByApp()
    {
        return $this->_sAuthorize == BX_GITHUB_AUTHORIZE_APP;
    }

    public function isAuthorizeByPat()
    {
        return $this->_sAuthorize == BX_GITHUB_AUTHORIZE_PAT;
    }

    public function getHtmlIds($sKey = '')
    {
        if(empty($sKey))
            return $this->_aHtmlIds;

        return isset($this->_aHtmlIds[$sKey]) ? $this->_aHtmlIds[$sKey] : '';
    }
}

/** @} */
