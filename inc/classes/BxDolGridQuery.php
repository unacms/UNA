<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for grid.
 * @see BxDolGrid
 */
class BxDolGridQuery extends BxDolDb
{
    protected $_aObject;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    public static function isGridObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        return (bool)$oDb->getOne($oDb->prepare("SELECT 1 FROM `sys_objects_grid` WHERE `object` = ? LIMIT 1", $sObject));
    }

    public static function setGridEngine ($sObject, $sEngine)
    {
        $oDb = BxDolDb::getInstance();
        return $oDb->query($oDb->prepare("UPDATE `sys_objects_grid` SET `engine` = ? WHERE `object` = ?", $sEngine, $sObject)) !== false;
    }

    static public function getGridObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_grid` WHERE `object` = ?", $sObject);
        $aObject = $oDb->getRow($sQuery);
        if (!$aObject || !is_array($aObject))
            return false;

        // paginate
        if (!empty($aObject['paginate_url']) && 0 !== strncasecmp($aObject['paginate_url'], 'http://', 7) && 0 !== strncasecmp($aObject['paginate_url'], 'https://', 8))
            $aObject['paginate_url'] = BX_DOL_URL_ROOT . $aObject['paginate_url'];

        // filter
        if ($aObject['filter_fields'])
            $aObject['filter_fields'] = array_map('trim', explode(',', $aObject['filter_fields']));

        if ($aObject['filter_fields_translatable'])
            $aObject['filter_fields_translatable'] = array_map('trim', explode(',', $aObject['filter_fields_translatable']));

        // sorting
        if ($aObject['sorting_fields'])
            $aObject['sorting_fields'] = array_map('trim', explode(',', $aObject['sorting_fields']));

        if ($aObject['sorting_fields_translatable']) {
            $aObject['sorting_fields_translatable'] = array_map('trim', explode(',', $aObject['sorting_fields_translatable']));
            $aObject['sorting_fields'] = array_merge ($aObject['sorting_fields'], $aObject['sorting_fields_translatable']);
        }

        // get fields
        $sQuery = $oDb->prepare("SELECT * FROM `sys_grid_fields` WHERE `object` = ? ORDER BY `order`", $sObject);
        $aFields = $oDb->getAllWithKey($sQuery, 'name');
        if (!$aFields || !is_array($aFields)) // it is impossible to have grid without any fields
            return false;
        foreach ($aFields as $sKey => $aRow) {
            $aObject['fields'][$sKey] = array(
                'name' => $sKey,
                'title' => _t($aRow['title']),
                'width' => $aRow['width'],
                'translatable' => $aRow['translatable'],
                'chars_limit' => $aRow['chars_limit'],
                'hidden_on' => $aRow['hidden_on'],
            );
            if (empty($aRow['params']))
                continue;
            $aAdd = unserialize($aRow['params']);
            if (!empty($aAdd) && is_array($aAdd))
                $aObject['fields'][$sKey] = array_merge($aObject['fields'][$sKey], $aAdd);
        }
        // get actions
        $a = array('bulk','single','independent');
        foreach ($a as $sActionType) {
            $sActionField = 'actions_' . $sActionType;
            $aObject[$sActionField] = array();
            $sQuery = $oDb->prepare("SELECT * FROM `sys_grid_actions` WHERE `object` = ? AND `type` = ? ORDER BY `order`", $sObject, $sActionType);
            $aActions = $oDb->getAllWithKey($sQuery, 'name');
            if (!$aActions || !is_array($aActions))
                continue;
            foreach ($aActions as $sKey => $aRow)
                $aObject[$sActionField][$sKey] = [
                    'title' => _t($aRow['title']), 
                    'icon' => $aRow['icon'], 
                    'icon_only' => $aRow['icon_only'],
                    'confirm' => $aRow['confirm'], 
                    'active' => $aRow['active']
                ];
        }

        return $aObject;
    }

}

/** @} */
