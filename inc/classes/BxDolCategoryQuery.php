<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for category objects.
 * @see BxDolCategory
 */
class BxDolCategoryQuery extends BxDolDb
{
    protected $_aObject;

    public function __construct($aObject)
    {
        parent::__construct();
        $this->_aObject = $aObject;
    }

    static public function getCategoryObject ($sObject)
    {
        $oDb = BxDolDb::getInstance();
        // all the objects at once, once per request: a page asks for many, some a module has not
        $aObject = $oDb->getObjectRow('sys_objects_category', 'object', $sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        return $aObject;
    }

    static public function getCategoryObjectByFormAndList ($sObjectForm, $sListName)
    {
        $oDb = BxDolDb::getInstance();
        $sQuery = $oDb->prepare("SELECT * FROM `sys_objects_category` WHERE `form_object` = ? AND `list_name` = ?", $sObjectForm, $sListName);
        $aObject = $oDb->getRow($sQuery);
        if (!$aObject || !is_array($aObject))
            return false;

        return $aObject;
    }

    static public function getItemsNumInCategory ($aObject, $sCategoryValue, $bPublicOnly = true, $aParams = [])
    {
        $oDb = BxDolDb::getInstance();
        return $oDb->getOne("SELECT COUNT(*) FROM `" . $aObject['table'] . "` " . $aObject['join'] . " WHERE `" . $aObject['field'] . "` = :cat " . $aObject['where'] . self::_itemsWhere($aObject, $bPublicOnly, $aParams), array('cat' => $sCategoryValue));
    }

    /**
     * The number of items in each category at once, as getItemsNumInCategory counts them, in
     * one query: category value => number, categories without items left out.
     */
    static public function getItemsNumsInCategories ($aObject, $bPublicOnly = true, $aParams = [])
    {
        $oDb = BxDolDb::getInstance();
        $aPairs = $oDb->getPairs("SELECT `" . $aObject['field'] . "` AS `value`, COUNT(*) AS `num` FROM `" . $aObject['table'] . "` " . $aObject['join'] . " WHERE 1 " . $aObject['where'] . self::_itemsWhere($aObject, $bPublicOnly, $aParams) . " GROUP BY `" . $aObject['field'] . "`", 'value', 'num');
        return array_map('intval', is_array($aPairs) ? $aPairs : []);
    }

    /**
     * The condition on the items that count: public ones (or a context's), active ones.
     */
    static protected function _itemsWhere ($aObject, $bPublicOnly, $aParams)
    {
        $oDb = BxDolDb::getInstance();
        $sWhere = '';
        if ($bPublicOnly && ($oModule = BxDolModule::getInstance($aObject['module'])) && isset($oModule->_oConfig->CNF)) {
            $CNF = &$oModule->_oConfig->CNF;

            if(isset($CNF['FIELD_ALLOW_VIEW_TO'])) {
                if (isset($aParams['context_id']) && !empty($aParams['context_id'])){
                    $sWhere .= ' AND `' . $aObject['table'] . '`.`' . $CNF['FIELD_ALLOW_VIEW_TO'] . '` IN(' . -$aParams['context_id'] . ') ';
                }
                else{
                    bx_import('BxDolPrivacy');
                    $a = isLogged() ? array(BX_DOL_PG_ALL, BX_DOL_PG_MEMBERS) : array(BX_DOL_PG_ALL);
                    $sWhere .= ' AND `' . $aObject['table'] . '`.`' . $CNF['FIELD_ALLOW_VIEW_TO'] . '` IN(' . $oDb->implode_escape($a) . ') ';
                }
            }

            if(isset($CNF['FIELD_STATUS']))
                $sWhere .= ' AND `' . $aObject['table'] . '`.`' . $CNF['FIELD_STATUS'] . '` = \'active\' ';

            if(isset($CNF['FIELD_STATUS_ADMIN']))
                $sWhere .= ' AND `' . $aObject['table'] . '`.`' . $CNF['FIELD_STATUS_ADMIN'] . '` = \'active\' ';
        }
        return $sWhere;
    }
}

/** @} */
