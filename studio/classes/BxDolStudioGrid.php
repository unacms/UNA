<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

define('BX_DOL_STUDIO_GRID_PARAMS_DIVIDER', '#-#');

class BxDolStudioGrid extends BxTemplGrid
{
    /**
     * The Studio app (page name) each system grid belongs to, by the start of the grid's object name. A grid of an app is shown,
     * and its actions run, only for operators whose Studio role may use that app, as the app's page is.
     */
    protected static $aStudioPagesByObject = [
        'sys_studio_lang_' => 'polyglot',
        'sys_studio_roles' => 'builder_roles',
        'sys_studio_acl' => 'builder_permissions',
        'sys_studio_nav_' => 'builder_menus',
        'sys_studio_forms' => 'builder_forms',
        'sys_studio_search_forms' => 'builder_forms',
        'sys_studio_labels' => 'builder_forms',
        'sys_studio_categories' => 'builder_forms',
        'sys_studio_groups_roles' => 'builder_forms',
        'sys_studio_strg_' => 'storages',
        'sys_studio_api_' => 'api',
        'sys_studio_agents_' => 'agents',
        'sys_badges_administration' => 'badges',
    ];

    /**
     * Grids that change the roles themselves, which also take "Manage roles".
     */
    protected static $aObjectsManageRoles = ['sys_studio_roles', 'sys_studio_roles_actions'];

    protected $sParamsDivider;
    public $oDb;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate ? $oTemplate : BxDolStudioTemplate::getInstance());

        $this->oDb = null;
        $this->sParamsDivider = BX_DOL_STUDIO_GRID_PARAMS_DIVIDER;
    }

    public function getSystemName($sValue)
    {
        return BxDolStudioUtils::getSystemName($sValue);
    }

    public function getClassName($sValue)
    {
        return BxDolStudioUtils::getClassName($sValue);
    }

    protected function getModuleTitle($sName)
    {
        return BxDolStudioUtils::getModuleTitle($sName);
    }

    protected function getModules($bShowCustom = true, $bShowSystem = true)
    {
        return BxDolStudioUtils::getModules($bShowCustom, $bShowSystem);
    }

    protected function _isVisibleGrid ($a)
    {
        if(!isAdmin())
            return false;

        return self::isAllowedForRole(isset($a['object']) ? $a['object'] : $this->_sObject);
    }

    /**
     * Whether the logged in operator's Studio role allows the grid with the object name (see $aStudioPagesByObject).
     */
    public static function isAllowedForRole($sObject, $iAccountId = 0)
    {
        $oUtils = BxDolStudioRolesUtils::getInstance();

        if(in_array($sObject, self::$aObjectsManageRoles) && !$oUtils->isActionAllowed(BX_SRA_MANAGE_ROLES, $iAccountId))
            return false;

        foreach(self::$aStudioPagesByObject as $sPrefix => $sPage)
            if(str_starts_with($sObject, $sPrefix))
                return $oUtils->isPageAllowed($sPage, $iAccountId);

        return true;
    }
}
/** @} */
