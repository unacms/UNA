<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Site main menu representation.
 */
class BxBaseMenuProfileAdd extends BxTemplMenu
{
    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);
    }

    public function getCode ()
    {
        $oProfile = BxDolProfile::getInstance();
        if($oProfile && !BxDolAccount::isAllowedCreateMultiple($oProfile->id()))
            return '';

        $oAccount = BxDolAccount::getInstance();
        if($oAccount && $oAccount->isProfilesLimitReached())
            return '';

        return parent::getCode ();
    }

    /**
     * The default profile type (Studio > Settings > Account, sys_account_default_profile_type) comes first: the
     * templates that pick out one type (the hero card) take the first item.
     */
    protected function getMenuItemsRaw ()
    {
        $aItems = parent::getMenuItemsRaw ();

        $sDefault = getParam('sys_account_default_profile_type');
        if (!$sDefault || !is_array($aItems))
            return $aItems;

        $aFirst = $aRest = [];
        foreach ($aItems as $mixedKey => $aItem) {
            if (isset($aItem['module']) && $aItem['module'] == $sDefault)
                $aFirst[$mixedKey] = $aItem;
            else
                $aRest[$mixedKey] = $aItem;
        }

        return $aFirst + $aRest;
    }
}

/** @} */
