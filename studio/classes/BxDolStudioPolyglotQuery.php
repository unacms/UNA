<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioPolyglotQuery extends BxDolStudioLanguagesUtilsQuery
{
    function __construct()
    {
        parent::__construct();
    }

    function getKeyFullInfo($iId, $iPreviewLength = 10)
    {
        $sSql = $this->prepare("SELECT
                `tlk`.`ID` AS `id`,
                `tlk`.`Key` AS `key`,
                IFNULL((SELECT `tm`.`title` FROM `sys_modules` AS `tm` WHERE `tm`.`lang_category`=`tlc`.`Name` LIMIT 1), `tlc`.`Name`) AS `module`
            FROM `sys_localization_keys` AS `tlk`
            LEFT JOIN `sys_localization_categories` AS `tlc` ON `tlk`.`IDCategory`=`tlc`.`ID`
            WHERE `tlk`.`ID`=? LIMIT 1", $iId);
        $aResult = $this->getRow($sSql);
        if(!is_array($aResult) || empty($aResult))
            return array();

        $sSql = $this->prepare("SELECT
                `tls`.`String` AS `string`,
                SUBSTRING(`tls`.`String`, 1, ?) AS `preview`,
                `tll`.`Name` AS `lang_name`,
                `tll`.`Title` AS `lang_title`
            FROM `sys_localization_strings` AS `tls`
            LEFT JOIN `sys_localization_languages` AS `tll` ON `tls`.`IDLanguage`=`tll`.`ID`
            WHERE `tls`.`IDKey`=?", $iPreviewLength, $iId);
        $aResult['strings'] = $this->getAllWithKey($sSql, 'lang_name');

        return $aResult;
    }

    /**
     * Language categories as Polyglot shows them: by the title of the module they belong to ("English", not the
     * category's name "BoonEx English"), by name when no module has them (System, Custom).
     * @return array category ID => title, ordered by title
     */
    public function getCategoryTitles()
    {
        return $this->getPairs("SELECT
                `tlc`.`ID` AS `id`,
                IFNULL((SELECT `tm`.`title` FROM `sys_modules` AS `tm` WHERE `tm`.`lang_category`=`tlc`.`Name` LIMIT 1), `tlc`.`Name`) AS `title`
            FROM `sys_localization_categories` AS `tlc`
            ORDER BY `title`", 'id', 'title');
    }

    function getEtemplates($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tet`.`ID` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause = " AND `tet`.`ID`=:id ";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause .= ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `tet`.`Module`";
                break;
            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tet`.`ID` AS `id`,
                `tet`.`Module` AS `module`,
                `tet`.`NameSystem` AS `name_system`,
                `tet`.`Name` AS `name`,
                `tet`.`Subject` AS `subject`,
                `tet`.`Body` AS `body`" . $sSelectClause . "
            FROM `sys_email_templates` AS `tet` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }
}

/** @} */
