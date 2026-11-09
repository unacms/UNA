<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseNotifications Base classes for Notifications like modules
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxBaseModNotificationsDb extends BxBaseModGeneralDb
{
    protected $_oConfig;

    protected $_sTable;
    protected $_sTableAlias;
    protected $_sTableHandlers;
    protected $_sTableSettings;
    protected $_sTableSettings2Users;

    protected $_sHandlerMask;
    protected $_aDeliveryTypes;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_oConfig = $oConfig;

        $this->_sTable = $this->_sPrefix . 'events';
        $this->_sTableAlias = '';
        $this->_sTableHandlers = $this->_sPrefix . 'handlers';
        $this->_sTableSettings = $this->_sPrefix . 'settings';
        $this->_sTableSettings2Users = $this->_sPrefix . 'settings2users';

        $this->_sHandlerMask = "%s-%s";
        $this->_aDeliveryTypes = array(BX_BASE_MOD_NTFS_DTYPE_SITE);
    }

    public function getTable()
    {
        return $this->_sTable;
    }

    public function isTableAlias()
    {
        return !empty($this->_sTableAlias);
    }

    public function getTableAlias()
    {
        return !empty($this->_sTableAlias) ? $this->_sTableAlias : $this->_sTable;
    }

    public function getAlertHandlerId()
    {
        $sQuery = $this->prepare("SELECT `id` FROM `sys_alerts_handlers` WHERE `name`=? LIMIT 1", $this->_oConfig->getObject('alert'));
        return (int)$this->getOne($sQuery);
    }

    public function insertData($aData)
    {
        $aHandlers = [];
        $aHandlerFields = $this->_oConfig->getHandlerFields();
    	$aHandlerDescriptor = $this->_oConfig->getHandlerDescriptor();

    	//--- Update Timeline Handlers ---//
        foreach($aData['handlers'] as $aHandler) {
            $sContent = $sPrivacy = '';

            if($aHandler['type'] == BX_BASE_MOD_NTFS_HANDLER_TYPE_INSERT) {
            	if(empty($aHandler['module_class']))
                    $aHandler['module_class'] = 'Module';

            	$sContent = serialize(array_intersect_key($aHandler, $aHandlerDescriptor));
            	$sPrivacy = !empty($aHandler['module_event_privacy']) ? $aHandler['module_event_privacy'] : '';
            }

            $aHandler = array_merge($aHandler, [
                'content' => $sContent,
                'privacy' => $sPrivacy
            ]);

            $sQuery = "INSERT INTO `{$this->_sTableHandlers}` SET " . $this->arrayToSQL(array_intersect_key($aHandler, array_flip($aHandlerFields)));
            if(!$this->query($sQuery))
                continue;

            $aHandlers[sprintf($this->_sHandlerMask, $aHandler['alert_unit'], $aHandler['alert_action'])] = (int)$this->lastId();
        }

        //--- Update Settings ---//
        if(!empty($aData['settings']) && is_array($aData['settings']))
            foreach($aData['settings'] as $aSetting) {
                $sHandler = sprintf($this->_sHandlerMask, $aSetting['unit'], $aSetting['action']);
                if(empty($aHandlers[$sHandler]))
                    continue;

                foreach($this->_aDeliveryTypes as $sDeliveryType) {
                    $iOrder = (int)$this->getSetting(array('by' => 'delivery_max_order', 'delivery' => $sDeliveryType));

                    foreach($aSetting['types'] as $sType) {
                        $sTitle = $this->_oConfig->getHandlersActionTitle($aSetting['unit'], $aSetting['action'], $sType);

                        $this->query("INSERT INTO `{$this->_sTableSettings}` SET `group`=:group, `handler_id`=:handler_id, `type`=:type, `delivery`=:delivery, `title`=:title, `order`=:order", array(
                            'group' => $aSetting['group'],
                            'handler_id' => (int)$aHandlers[$sHandler],
                            'type' => $sType,
                            'delivery' => $sDeliveryType,
                            'title' => strcmp($sTitle, _t($sTitle)) !== 0 ? $sTitle : '',
                            'order' => ++$iOrder
                        ));
                    }
                }
            }

        //--- Update System Alerts ---//
        $iHandlerId = $this->getAlertHandlerId();
        foreach($aData['alerts'] as $aAlert) {
            $sQuery = $this->prepare("INSERT INTO
                    `sys_alerts`
                SET
                    `unit`=?,
                    `action`=?,
                    `handler_id`=?", $aAlert['unit'], $aAlert['action'], $iHandlerId);

            $this->query($sQuery);
        }
    }

    public function deleteData($aData)
    {
        $aHandlers = array();

    	//--- Update Timeline Handlers ---//
        foreach($aData['handlers'] as $aHandler) {
            $sHandler = sprintf($this->_sHandlerMask, $aHandler['alert_unit'], $aHandler['alert_action']); 
            $aBindings = array(
                'alert_unit' => $aHandler['alert_unit'],
                'alert_action' => $aHandler['alert_action'],

                'group' => $aHandler['group'],
                'type' => $aHandler['type']
            );

            $aHandlers[$sHandler] = $this->getOne("SELECT `id` FROM `{$this->_sTableHandlers}` WHERE (`alert_unit`=:alert_unit AND `alert_action`=:alert_action) OR (`group`=:group AND `type`=:type) LIMIT 1", $aBindings);

            $this->query("DELETE FROM `{$this->_sTableHandlers}` WHERE (`alert_unit`=:alert_unit AND `alert_action`=:alert_action) OR (`group`=:group AND `type`=:type) LIMIT 1", $aBindings);
        }

        //--- Update Settings ---//
        if(!empty($aData['settings']) && is_array($aData['settings']))
            foreach($aData['settings'] as $aSetting) {
                $sHandler = sprintf($this->_sHandlerMask, $aSetting['unit'], $aSetting['action']); 
                if(empty($aHandlers[$sHandler]))
                    continue;

                foreach($aSetting['types'] as $sType)
                    $this->query("DELETE FROM `ts`, `tsu` USING `{$this->_sTableSettings}` AS `ts` LEFT JOIN `{$this->_sTableSettings2Users}` AS `tsu` ON `ts`.`id`=`tsu`.`setting_id` WHERE `ts`.`handler_id`=:handler_id AND `ts`.`type`=:type", array(
                        'handler_id' => (int)$aHandlers[$sHandler],
                        'type' => $sType,
                    ));
            }

        //--- Update System Alerts ---//
        $iHandlerId = $this->getAlertHandlerId();
        foreach($aData['alerts'] as $aAlert) {
            $sQuery = $this->prepare("DELETE FROM
                    `sys_alerts`
                WHERE
                    `unit`=? AND
                    `action`=? AND
                    `handler_id`=?
                LIMIT 1", $aAlert['unit'], $aAlert['action'], $iHandlerId);

            $this->query($sQuery);
        }
    }

    public function deleteModuleEvents($aData)
    {
		//Delete system events.
    	foreach($aData['handlers'] as $aHandler)
            $this->deleteEvent(array('type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));
    }

    public function activateModuleEvents($aData, $bActivate = true)
    {
    	$iActivate = $bActivate ? 1 : 0;

    	//Activate (deactivate) system events.
    	foreach($aData['handlers'] as $aHandler)    		
            $this->updateEvent(array('active' => $iActivate), array('type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));
    }

    public function getHandlers($aParams = array())
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sWhereClause = '';

        if(!empty($aParams))
            switch($aParams['type']) {
                case 'by_id':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'id' => $aParams['value']
                    ];

                    $sWhereClause = "AND `id`=:id";
                    break;

                case 'by_unit_action':
                    $aMethod['name'] = 'getRow';
                    $aMethod['params'][1] = [
                        'alert_unit' => $aParams['unit'],
                        'alert_action' => $aParams['action'],
                    ];

                    $sWhereClause = "AND `alert_unit`=:alert_unit AND `alert_action`=:alert_action";
                    break;

                case 'by_type':
                    $aMethod['params'][1] = array(
                        'type' => $aParams['value']
                    );

                    $sWhereClause = "AND `type`=:type";
                    break;

                case 'by_group_key_type':
                    $aMethod['name'] = 'getAllWithKey';
                    $aMethod['params'][1] = 'type';
                    $aMethod['params'][2] = array(
                            'group' => $aParams['group']
                    );

                    $sWhereClause = "AND `group`=:group";
                    break;
            }

        $aMethod['params'][0] = "SELECT * FROM `{$this->_sTableHandlers}` WHERE 1 " . $sWhereClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function isHandler($sUnit, $sAction)
    {
        return ($aHandler = $this->getHandlers(['type' => 'by_unit_action', 'unit' => $sUnit, 'action' => $sAction])) && is_array($aHandler);
    }

    public function getSetting($aParams = array())
    {
    	$CNF = &$this->_oConfig->CNF;
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sSelectClause = "`ts`.*, `th`.`alert_unit` AS `unit`, `th`.`alert_action` AS `action`";
    	$sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";
        switch($aParams['by']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `ts`.`id`=:id";
                break;

            case 'tsu_id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sJoinClause = "LEFT JOIN `" . $this->_sTableSettings2Users . "` AS `tsu` ON `ts`.`id`=`tsu`.`setting_id`";
                $sWhereClause = " AND `tsu`.`id`=:id";
                break;

            case 'tsu_allowed':
                $aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'handler_id' => $aParams['handler_id'], 
                    'delivery' => $aParams['delivery'], 
                    'type' => $aParams['type'], 
                    'user_id' => $aParams['user_id']
                );

                $sSelectClause = "`ts`.`active` AS `active_adm`, IF(NOT ISNULL(`tsu`.`active`), `tsu`.`active`, `ts`.`value`) AS `active_pnl`";
                $sJoinClause = "LEFT JOIN `" . $this->_sTableSettings2Users . "` AS `tsu` ON `ts`.`id`=`tsu`.`setting_id` AND `tsu`.`user_id`=:user_id";
                $sWhereClause = " AND `ts`.`handler_id`=:handler_id AND `ts`.`delivery`=:delivery AND `ts`.`type`=:type";
                break;

            case 'delivery_max_order':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'delivery' => $aParams['delivery'],
                );

                $sSelectClause = "`ts`.`order`";
                $sWhereClause = " AND `ts`.`delivery`=:delivery";
                $sOrderClause = "`ts`.`order` DESC";
                $sLimitClause = "1";
                break;

            case 'group_type_delivery':
                $aMethod['name'] = 'getColumn';
                $aMethod['params'][1] = array(
                    'group' => $aParams['group'],
                    'delivery' => $aParams['delivery'],
                    'type' => $aParams['type']
                );

                $sSelectClause = "`ts`.`id`";
                $sWhereClause = " AND `ts`.`group`=:group AND `ts`.`delivery`=:delivery AND `ts`.`type`=:type";
                if($aParams['active'])
                     $sWhereClause .= " AND `ts`.`active`='1'";
                break;

            case 'user_id_pairs':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'active';
                $aMethod['params'][3] = array(
                    'user_id' => $aParams['user_id']
                );

                $sSelectClause = "`ts`.`id` AS `id`, `tsu`.`active` AS `active`";
                $sJoinClause = "LEFT JOIN `" . $this->_sTableSettings2Users . "` AS `tsu` ON `ts`.`id`=`tsu`.`setting_id`";
                $sWhereClause = " AND `tsu`.`user_id`=:user_id";
                break;

            case 'all_active':
                $sWhereClause = " AND `ts`.`active`='1'";
                break;

            case 'all_inactive':
                $sWhereClause = " AND `ts`.`active`='0'";
                break;
        }

        $sOrderClause = !empty($sOrderClause) ? "ORDER BY " . $sOrderClause : $sOrderClause;
        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `" . $this->_sTableSettings . "` AS `ts`
            LEFT JOIN `" . $this->_sTableHandlers . "` AS `th` ON `ts`.`handler_id`=`th`.`id` " . $sJoinClause . "
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function updateSetting($aParamsSet, $aParamsWhere)
    {
        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `{$this->_sTableSettings}` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function activateSettingById($bActive, $mixedId)
    {
        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return $this->query("UPDATE `{$this->_sTableSettings}` SET `active`=:active WHERE `id` IN (" . $this->implode_escape($mixedId) . ")", array(
            'active' => (int)$bActive
        ));
    }

    public function activateSettingByIdUser($bActive, $iUserId, $mixedSettingId)
    {
        if(!is_array($mixedSettingId))
            $mixedSettingId = array($mixedSettingId);

        return $this->query("UPDATE `{$this->_sTableSettings2Users}` SET `active`=:active WHERE `user_id`=:user_id AND `setting_id` IN (" . $this->implode_escape($mixedSettingId) . ")", array(
            'user_id' => $iUserId, 
            'active' => (int)$bActive
        ));
    }
    
    public function changeSettingById($sField, $mixedValue, $mixedId)
    {
        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return $this->query("UPDATE `{$this->_sTableSettings}` SET `" . $sField . "`=:value WHERE `id` IN (" . $this->implode_escape($mixedId) . ")", array(
            'value' => $mixedValue
        ));
    }

    public function changeSettingByIdUser($sField, $mixedValue, $iUserId, $mixedSettingId)
    {
        if(!is_array($mixedSettingId))
            $mixedSettingId = array($mixedSettingId);

        return $this->query("UPDATE `{$this->_sTableSettings2Users}` SET `" . $sField . "`=:value WHERE `user_id`=:user_id AND `setting_id` IN (" . $this->implode_escape($mixedSettingId) . ")", array(
            'user_id' => $iUserId, 
            'value' => $mixedValue
        ));
    }

    public function initSettingUser($iUserId)
    {
        $aSettingsAll = $this->getSetting(array('by' => 'all_active'));
        $aSettingsUser = $this->getSetting(array('by' => 'user_id_pairs', 'user_id' => $iUserId));

        foreach($aSettingsAll as $aSetting) {
            if(isset($aSettingsUser[$aSetting['id']]))
                continue;

            $this->insertSettingUser(array(
                'user_id' => $iUserId,
                'setting_id' => $aSetting['id'],
                'active' => $aSetting['value']
            ));
        }

        $aSettingsAll = $this->getSetting(array('by' => 'all_inactive'));
        foreach($aSettingsAll as $aSetting) {
            if(!isset($aSettingsUser[$aSetting['id']]))
                continue;

            $this->deleteSettingUser(array(
                'user_id' => $iUserId,
                'setting_id' => $aSetting['id']
            ));
        }
    }

    public function insertSettingUser($aParamsSet)
    {
        if(empty($aParamsSet))
            return 0;

        if((int)$this->query("INSERT INTO `{$this->_sTableSettings2Users}` SET " . $this->arrayToSQL($aParamsSet)) <= 0)
            return 0;

        return (int)$this->lastId();
    }

    public function deleteSettingUser($aParamsWhere)
    {
        if(empty($aParamsWhere))
            return false;

        return (int)$this->query("DELETE FROM `{$this->_sTableSettings2Users}` WHERE " . $this->arrayToSQL($aParamsWhere, ' AND ')) <= 0;
    }

    public function insertEvent($aParamsSet)
    {
        if(empty($aParamsSet))
            return 0;

        $aSet = array();
        foreach($aParamsSet as $sKey => $sValue)
           $aSet[] = "`" . $sKey . "`=:" . $sKey;

		if(!isset($aParamsSet['date']))
			$aSet[] = "`date`=UNIX_TIMESTAMP()";

        if((int)$this->query("INSERT INTO `{$this->_sTable}` SET " . implode(", ", $aSet), $aParamsSet) <= 0)
            return 0;

        return (int)$this->lastId();
    }

    public function updateEvent($aParamsSet, $aParamsWhere)
    {
        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `{$this->_sTable}` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function deleteEvent($aParams, $sWhereAddon = "")
    {
        $sSql = "DELETE FROM `{$this->_sTable}` WHERE " . $this->arrayToSQL($aParams, " AND ") . $sWhereAddon;
        return $this->query($sSql);
    }

    public function getEvents($aParams)
    {
        $sTableAlias = $this->getTableAlias();

        $sFromClause = "`{$this->_sTable}`" . ($this->isTableAlias() ? " AS `" . $sTableAlias . "`" : "");
        list($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause) = $this->_getSqlPartsEvents($aParams);

        $sSql = "SELECT {select}
            FROM {$sFromClause}
            LEFT JOIN `{$this->_sTableHandlers}` ON `{$sTableAlias}`.`type`=`{$this->_sTableHandlers}`.`alert_unit` AND `{$sTableAlias}`.`action`=`{$this->_sTableHandlers}`.`alert_action` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " {order} {limit}";

        return $this->$sMethod(str_replace(array('{select}', '{order}', '{limit}'), array($sSelectClause, $sOrderClause, $sLimitClause), $sSql));
    }

    protected function _getSqlPartsEvents($aParams)
    {
        $sTableAlias = $this->getTableAlias();

    	$sMethod = 'getAll';
        $sSelectClause = "`{$sTableAlias}`.*";
        $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['browse']) {
            case 'id':
                $sMethod = 'getRow';
                $sWhereClause = $this->prepareAsString("AND `{$sTableAlias}`.`id`=? ", $aParams['value']);
                $sLimitClause = "LIMIT 1";
                break;

            case 'first':
                $sMethod = 'getRow';
                list($sJoinClause, $sWhereClause) = $this->_getSqlPartsEventsList($aParams);
                $sOrderClause = "ORDER BY `{$sTableAlias}`.`date` DESC, `{$sTableAlias}`.`id` DESC";
                $sLimitClause = "LIMIT 1";
                break;

            case 'list':
                list($sJoinClause, $sWhereClause) = $this->_getSqlPartsEventsList($aParams);
                $sOrderClause = "ORDER BY `{$sTableAlias}`.`date` DESC, `{$sTableAlias}`.`id` DESC";
                $sLimitClause = isset($aParams['per_page']) ? "LIMIT " . (int)$aParams['start'] . ", " . (int)$aParams['per_page'] : "";
                break;
        }

        return array($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);
    }

    protected function _getSqlPartsEventsList($aParams)
    {
    	$sJoinClause = $sWhereClause = "";

    	return array($sJoinClause, $sWhereClause);
    }
}

/** @} */
