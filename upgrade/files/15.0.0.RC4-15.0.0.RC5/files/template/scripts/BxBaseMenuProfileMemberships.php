<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Member Memberships (`sys_profile_memberships`, Studio > Navigation > Profile Memberships): an
 * item per context module, each with the contexts the profile belongs to, newest first: the
 * groups, events, spaces, organizations ... it is a member of (the module's own members
 * connection, CNF['OBJECT_CONNECTIONS'], confirmed both ways), and for a module without one, the
 * profiles it is friends with (sys_profiles_friends): Your friends, Your groups, Your spaces.
 * One's own groups are among them, as their author is their first member. Profile Following
 * (BxBaseMenuProfileFollowings) lists the ones it follows instead; the rest, the web's submenus
 * and the apps' items (getMenuItemsForApps), is the same.
 * @see BxDolMenu
 */
class BxBaseMenuProfileMemberships extends BxTemplMenuProfileFollowings
{
    protected function _getContextIds($iProfile, $sContextModule, $iStart, $iLimit)
    {
        $oConnection = $this->_getMembersConnection($sContextModule);
        if (!$oConnection)
            return [];

        $aIds = $oConnection->getConnectedContentByType($iProfile, [$sContextModule], true, $iStart, $iLimit, BX_CONNECTIONS_ORDER_ADDED_DESC);
        return is_array($aIds) ? $aIds : [];
    }

    /**
     * The connection object whose confirmed (mutual) pairs are a module's members: the module's
     * own members connection, else friends (sys_profiles_friends); '' for a module not enabled.
     */
    public function getMembersConnectionObject($sContextModule)
    {
        if (!$sContextModule || !BxDolModuleQuery::getInstance()->isEnabledByName($sContextModule))
            return '';

        $oModule = BxDolModule::getInstance($sContextModule);
        return $oModule && !empty($oModule->_oConfig->CNF['OBJECT_CONNECTIONS']) ? $oModule->_oConfig->CNF['OBJECT_CONNECTIONS'] : 'sys_profiles_friends';
    }

    protected function _getMembersConnection($sContextModule)
    {
        $sObject = $this->getMembersConnectionObject($sContextModule);
        return $sObject ? BxDolConnection::getObjectInstance($sObject) : false;
    }
}

/** @} */
