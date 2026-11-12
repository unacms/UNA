<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolBadges extends BxDolFactory implements iBxDolSingleton
{
    protected $_oDb;

    protected function __construct()
    {
        parent::__construct();

        $this->_oDb = new BxDolBadgesQuery();
    }

    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolBadges();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function getData($aParams = array(), &$aItems = false)
    {
        return $this->_oDb->getData($aParams, $aItems);
    }
    
    /**
     * The badges of many profiles in one query, by profile id (see BxDolBadgesQuery::getByProfileIds).
     */
    public function getByProfileIds($aProfileIds)
    {
        $aResult = [];
        foreach ($this->_oDb->getByProfileIds($aProfileIds) as $aRow)
            $aResult[(int)$aRow['profile_id']][] = $aRow;
        return $aResult;
    }

    public function add($iBadgeId, $iObjectId, $sModule)
    {
        return $this->_oDb->add($iBadgeId, $iObjectId, $sModule);
    }

    public function delete($aParams)
    {
        return $this->_oDb->delete($aParams);
    }

    public static function onModuleUninstall ($sModuleName, &$iFiles = null)
    {
        $oBadges = BxDolBadges::getInstance();
        $oBadges->_oDb->delete(['type' => 'by_module', 'module' => $sModuleName]);
        return true;
    }
}

/** @} */
