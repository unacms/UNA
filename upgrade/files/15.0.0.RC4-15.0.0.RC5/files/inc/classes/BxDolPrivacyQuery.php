<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolPrivacyQuery extends BxDolDb
{
    protected $_aObject;

    protected $_sTable;
    protected $_sFieldId;
    protected $_sFieldOwnerId;

    protected $_sCachePrivacyObject;
    protected $_sCachePrivacyObjectDefault;

    protected $_sCacheGroup;
    protected $_sCacheGroupFriends;
    protected $_sCacheGroupsActVis;
    protected $_sCacheGroupsActVisList;

    protected $_sCacheTestedObject;

    public function __construct()
    {
        parent::__construct();
        $this->_aObject = array();

        $this->_sCachePrivacyObject = 'sys_privacy_object_';
        $this->_sCachePrivacyObjectDefault = 'sys_privacy_object_default_';

        $this->_sCacheGroup = 'sys_privacy_group_';
        $this->_sCacheGroupFriends = 'sys_privacy_group_friends_';
        $this->_sCacheGroupsActVis = 'sys_privacy_group_act_vis';
        $this->_sCacheGroupsActVisList = 'sys_privacy_group_act_vis_list';

        $this->_sCacheTestedObject = 'sys_privacy_tested_object_';
    }

    static public function getPrivacyObject($sObject)
    {
        $a = BxDolDb::getInstance()->fromCache('sys_objects_privacy', 'getAllWithKey', "SELECT * FROM `sys_objects_privacy`", 'object');
        if ($a && isset($a[$sObject]))
            return $a[$sObject];

        return false;
    }

    public function init($aObject = array())
    {
        if(empty($aObject) || !is_array($aObject)) 
            return;

        $this->_aObject = $aObject;

        $this->_sTable = $this->_aObject['table'];
        $this->_sFieldId = $this->_aObject['table_field_id'];
        $this->_sFieldOwnerId = $this->_aObject['table_field_author'];
    }

    function getObjectInfo($sAction, $iObjectId)
    {
        if(empty($this->_sTable) || empty($this->_sFieldId) || empty($this->_sFieldOwnerId))
            return array();

        $sQuery = $this->prepare("SELECT `" . $this->_sFieldId . "` AS `id`, `" . $this->_sFieldOwnerId . "` AS `owner_id`, `" . $sAction . "` AS `group_id` FROM `" . $this->_sTable . "` WHERE `" . $this->_sFieldId . "`=? LIMIT 1", $iObjectId);

        $sCacheKey = $this->_sCacheTestedObject . $this->_sTable . '_' . $this->_aObject['action'] . '_' . $iObjectId;
        return $this->fromMemory($sCacheKey, 'getRow', $sQuery);
    }

    /**
     * What getObjectInfo reads of each of these objects for an action, read in one query and
     * kept in memory where getObjectInfo keeps it, so a page that checks many of them reads it
     * once. One there is not is left to getObjectInfo.
     */
    public function primeObjectInfos($sAction, $aObjectIds)
    {
        if(empty($this->_sTable) || empty($this->_sFieldId) || empty($this->_sFieldOwnerId))
            return;

        $aIds = [];
        foreach((array)$aObjectIds as $mId)
            if(($iId = (int)$mId) > 0 && !array_key_exists($this->_sCacheTestedObject . $this->_sTable . '_' . $this->_aObject['action'] . '_' . $iId, self::$_aDbCacheData))
                $aIds[$iId] = $iId;
        if(!$aIds)
            return;

        $aRows = $this->getAll("SELECT `" . $this->_sFieldId . "` AS `id`, `" . $this->_sFieldOwnerId . "` AS `owner_id`, `" . $sAction . "` AS `group_id` FROM `" . $this->_sTable . "` WHERE `" . $this->_sFieldId . "` IN (" . $this->implode_escape(array_values($aIds)) . ")");
        foreach($aRows as $aRow)
            self::$_aDbCacheData[$this->_sCacheTestedObject . $this->_sTable . '_' . $this->_aObject['action'] . '_' . (int)$aRow['id']] = $aRow;
    }

    /**
     * What primeObjectInfos would read, taken from whole rows of the objects' table read already
     * (SELECT * of the same table): false, and nothing kept, when they are of another table or
     * lack the fields.
     * @param array $aRows rows of the table, each with all its fields
     */
    public function primeObjectInfosFromRows($sAction, $sTable, $aRows)
    {
        if(empty($this->_sTable) || $sTable !== $this->_sTable || empty($this->_sFieldId) || empty($this->_sFieldOwnerId))
            return false;

        foreach($aRows as $aRow) {
            if(!is_array($aRow) || !$aRow)
                continue;
            if(!array_key_exists($this->_sFieldId, $aRow) || !array_key_exists($this->_sFieldOwnerId, $aRow) || !array_key_exists($sAction, $aRow))
                return false;
            $sKey = $this->_sCacheTestedObject . $this->_sTable . '_' . $this->_aObject['action'] . '_' . (int)$aRow[$this->_sFieldId];
            if(!array_key_exists($sKey, self::$_aDbCacheData))
                self::$_aDbCacheData[$sKey] = ['id' => $aRow[$this->_sFieldId], 'owner_id' => $aRow[$this->_sFieldOwnerId], 'group_id' => $aRow[$sAction]];
        }
        return true;
    }

    function getGroupsBy($aParams)
    {
        $sSelectClause = "`id`, `title`, `check`, `active`";
        $sWhereClause = $sOrderClause = "";

        switch($aParams['type']) {
            case 'id':
                $sCacheFunction = 'fromCache';
                $sCacheName = $this->_sCacheGroup . $aParams['id'];
                $sMethod = 'getRow';
                $sWhereClause = $this->prepareAsString("`id`=?", (int)$aParams['id']);
                break;

            case 'active':
                $sCacheFunction = 'fromMemory';
                $sCacheName = $this->_sCacheGroupsActVis;
                $sMethod = 'getAll';
                $sWhereClause = "`active`='1' AND `visible`='1'";
                $sOrderClause = "`order` ASC";
                break;

            case 'active_list':
                $sCacheFunction = 'fromMemory';
                $sCacheName = $this->_sCacheGroupsActVisList;
                $sMethod = 'getColumn';
                $sSelectClause = "`id`";
                $sWhereClause = "`active`='1' AND `visible`='1'";
                break;
        }

        if($sOrderClause)
            $sOrderClause = "ORDER BY " . $sOrderClause;

        $sSql = "SELECT
                    " . $sSelectClause . "
                FROM `sys_privacy_groups`
                WHERE " . $sWhereClause . " " . $sOrderClause;

        return !empty($sCacheFunction) && !empty($sCacheName) ? $this->$sCacheFunction($sCacheName, $sMethod, $sSql) : $this->$sMethod($sSql);
    }

    function getActions($iOwnerId)
    {
        $sQuery = $this->prepare("SELECT
                    `tm`.`uri` AS `module_uri`,
                    `tm`.`title` AS `module_title`,
                    `ta`.`id` AS `action_id`,
                    `ta`.`title` AS `action_title`,
                    `ta`.`default_group` AS `action_default_value`,
                    `td`.`group_id` AS `default_value`
                FROM `sys_objects_privacy` AS `ta`
                LEFT JOIN `sys_privacy_defaults` AS `td` ON `ta`.`id`=`td`.`action_id` AND `td`.`owner_id`=?
                INNER JOIN `sys_modules` AS `tm` ON `ta`.`module`=`tm`.`uri`
                WHERE 1
                ORDER BY `tm`.`title`", $iOwnerId);

        return $this->getAll($sQuery);
    }

    function getTitle($sModule, $sAction)
    {
        $aAction = $this->_getAction($sModule, $sAction);
        return !empty($aAction) && isset($aAction['title']) ? $aAction['title'] : '';
    }

    function getDefaultGroup($sModule, $sAction)
    {
        $aAction = $this->_getAction($sModule, $sAction);
        return !empty($aAction) && isset($aAction['default_group']) ? $aAction['default_group'] : BX_DOL_PG_DEFAULT;
    }

    function getDefaultGroupByUser($sModule, $sAction, $iOwnerId)
    {
        $sQuery = $this->prepare("SELECT
               `td`.`group_id`
            FROM `sys_objects_privacy` AS `ta`
            LEFT JOIN `sys_privacy_defaults` AS `td` ON `ta`.`id`=`td`.`action_id` AND `td`.`owner_id`=?
            WHERE
                `ta`.`module`=? AND `ta`.`action`=?
            LIMIT 1", $iOwnerId, $sModule, $sAction);

        $sCacheKey = $this->_sCachePrivacyObjectDefault . $sModule . '_' . $sAction . '_' . $iOwnerId;
        return $this->fromMemory($sCacheKey, 'getOne', $sQuery);
    }

    function replaceDefaulfGroup($iActionId, $iOwnerId, $iGroupId)
    {
        $sSql = $this->prepare("REPLACE INTO
                `sys_privacy_defaults`
            SET
                `owner_id`=?,
                `action_id`=?,
                `group_id`=?", $iOwnerId, $iActionId, $iGroupId);

        return $this->query($sSql);
    }

    public function getGroupCustom($aParams)
    {
        $sDiv = ',';
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sSelectClause = "`tg`.*";
    	$sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";
        switch($aParams['type']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `tg`.`id`=:id";
                break;

            case 'id_ext':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sSelectClause .= ", GROUP_CONCAT(`tgm`.`" . $aParams['group_items_field'] . "` SEPARATOR  '" . $sDiv . "') AS `items`";
                $sJoinClause = "LEFT JOIN `" . $aParams['group_items_table'] . "` AS `tgm` ON `tg`.`id`=`tgm`.`group_id`";
                $sWhereClause = " AND `tg`.`id`=:id";
                $sGroupClause = "`tg`.`id`";
                break;

            case 'pco':
                $aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id'],
                    'content_id' => $aParams['content_id'],
                    'object' => $aParams['object'],
                );

                $sWhereClause = " AND `tg`.`profile_id`=:profile_id AND `tg`.`content_id`=:content_id AND `tg`.`object`=:object";
                break;

            case 'pcog_ext':
                $aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'profile_id' => $aParams['profile_id'],
                    'content_id' => $aParams['content_id'],
                    'object' => $aParams['object'],
                    'group_id' => $aParams['group_id'],
                );

                $sSelectClause .= ", GROUP_CONCAT(`tgi`.`" . $aParams['group_items_field'] . "` SEPARATOR  '" . $sDiv . "') AS `items`";
                $sJoinClause = "LEFT JOIN `" . $aParams['group_items_table'] . "` AS `tgi` ON `tg`.`id`=`tgi`.`group_id`";
                $sWhereClause = " AND `tg`.`profile_id`=:profile_id AND (`tg`.`content_id`=:content_id" . (!empty($aParams['content_id']) ? " OR `tg`.`content_id`='0'" : "") . ") AND `tg`.`object`=:object AND `tg`.`group_id`=:group_id";
                $sGroupClause = "`tg`.`id`";
                break;

            case 'profile_id':
            	$aMethod['params'][1] = [
                    'profile_id' => $aParams['profile_id']
                ];

                $sWhereClause = " AND `tg`.`profile_id`=:profile_id";

                if(isset($aParams['content_id'])) {
                    $aMethod['params'][1]['content_id'] = $aParams['content_id'];

                    $sWhereClause .= " AND `tg`.`content_id`=:content_id";
                }
                break;
        }

        $sGroupClause = !empty($sGroupClause) ? "GROUP BY " . $sGroupClause : $sGroupClause;
        $sOrderClause = !empty($sOrderClause) ? "ORDER BY " . $sOrderClause : $sOrderClause;
        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `sys_privacy_groups_custom` AS `tg` " . $sJoinClause . " 
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        $aResult = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(in_array($aParams['type'], ['id_ext', 'pcog_ext']) && !empty($aResult) && is_array($aResult))
            $aResult['items'] = !empty($aResult['items']) ? explode($sDiv, $aResult['items']) : [];

        return $aResult;
    }

    public function insertGroupCustom($aParamsSet)
    {
        if(empty($aParamsSet))
            return false;

        if(!$this->query("INSERT INTO `sys_privacy_groups_custom` SET " . $this->arrayToSQL($aParamsSet)))
            return false;

        return (int)$this->lastId();
    }

    public function updateGroupCustom($aParamsSet, $aParamsWhere)
    {
        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        return $this->query("UPDATE `sys_privacy_groups_custom` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }

    public function deleteGroupCustom($aParamsWhere)
    {
        if(empty($aParamsWhere))
            return false;

        $sWhereClause = $this->arrayToSQL($aParamsWhere, " AND ");

        $aGroup = $this->getRow("SELECT * FROM `sys_privacy_groups_custom` WHERE " . $sWhereClause . " LIMIT 1");
        if(empty($aGroup) || !is_array($aGroup))
            return true;

        $bResult = $this->query("DELETE FROM `sys_privacy_groups_custom` WHERE " . $sWhereClause . " LIMIT 1") !== false;
        if($bResult) {
            $this->deleteGroupCustomMember(['group_id' => $aGroup['id']]);
            $this->deleteGroupCustomMembership(['group_id' => $aGroup['id']]);
        }

        return $bResult;
    }

    public function insertGroupCustomMember($aParamsSet)
    {
        return $this->_insertGroupCustomItem('sys_privacy_groups_custom_members', $aParamsSet);
    }

    public function deleteGroupCustomMember($aParamsWhere)
    {
        return $this->_deleteGroupCustomItem('sys_privacy_groups_custom_members', $aParamsWhere);
    }

    public function insertGroupCustomMembership($aParamsSet)
    {
        return $this->_insertGroupCustomItem('sys_privacy_groups_custom_memberships', $aParamsSet);
    }

    public function deleteGroupCustomMembership($aParamsWhere)
    {
        return $this->_deleteGroupCustomItem('sys_privacy_groups_custom_memberships', $aParamsWhere);
    }

    public function getContentByGroupAsSQLPart($sField, $mixedGroupId)
    {
        if(is_array($mixedGroupId))
            $sWhere = " AND `" . $this->_sTable . "`.`" . $sField . "` IN (" . $this->implode_escape($mixedGroupId) . ")";
        else
            $sWhere = $this->prepareAsString(" AND `" . $this->_sTable . "`.`" . $sField . "` = ?", $mixedGroupId);

        return array(
            'where' => $sWhere
        );
    }

    public function getContentByContextAsSQLPart($sField, $mixedContextId)
    {
        if(!empty($mixedContextId))
            return $this->getContentByGroupAsSQLPart($sField, $mixedContextId);

        return [
            'where' => " AND `" . $this->_sTable . "`.`" . $sField . "` < 0"
        ];
    }

    public function getContentByGroupAndContextAsSQLPart($sField, $mixedGroupId, $mixedContextId)
    {
        $aResultGroup = $this->getContentByGroupAsSQLPart($sField, $mixedGroupId);
        $aResultContext = $this->getContentByContextAsSQLPart($sField, $mixedContextId);

        $sPattern = "/^\s*AND\s*/i";
        return [
            'where' => " AND (" . preg_replace($sPattern, '', $aResultGroup['where']) . " OR " . preg_replace($sPattern, '', $aResultContext['where']) . ")"
        ];
    }

    protected function _getAction($sModule, $sAction)
    {
        $sQuery = $this->prepare("SELECT
                `id`,
                `module`,
                `action`,
                `title`,
                `default_group`
            FROM `sys_objects_privacy` AS `ta`
            WHERE `module`=? AND `action`=?
            LIMIT 1", $sModule, $sAction);

        $sCacheKey = $this->_sCachePrivacyObject . $sModule . '_' . $sAction;
        return $this->fromCache($sCacheKey, 'getRow', $sQuery);
    }

    protected function _insertGroupCustomItem($sTable, $aParamsSet)
    {
        if(empty($aParamsSet))
            return false;

        return $this->query("INSERT IGNORE INTO `" . $sTable . "` SET " . $this->arrayToSQL($aParamsSet));
    }

    protected function _deleteGroupCustomItem($sTable, $aParamsWhere)
    {
        if(empty($aParamsWhere))
            return false;

        return $this->query("DELETE FROM `" . $sTable . "` WHERE " . $this->arrayToSQL($aParamsWhere, " AND "));
    }
}

/** @} */
