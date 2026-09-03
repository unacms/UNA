<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Notifications Notifications
 * @ingroup     UnaModules
 *
 * @{
 */

class BxNtfsDb extends BxBaseModNotificationsDb
{
    protected $_sTableEvt2Usr;
    protected $_sTableQueue;
    protected $_sTableRead;
    protected $_sTableEtemplates;

    /*
     * Constructor.
     */
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_aDeliveryTypes = array(
            BX_BASE_MOD_NTFS_DTYPE_SITE, 
            BX_BASE_MOD_NTFS_DTYPE_EMAIL, 
            BX_BASE_MOD_NTFS_DTYPE_PUSH
        );

        $this->_sTableEvt2Usr = $this->_sPrefix . 'events2users';
        $this->_sTableQueue = $this->_sPrefix . 'queue';
        $this->_sTableRead = $this->_sPrefix . 'read';
        $this->_sTableEtemplates = $this->_sPrefix . 'etemplates';
    }

    public function getHandlerTypes()
    {
        return $this->getColumn("SELECT DISTINCT `alert_unit` FROM `{$this->_sTableHandlers}` WHERE `type`='insert'");
    }

    public function getHandlerActions($sUnit = '')
    {
        $aBindings = [];
        $sWhereClause = "";

        if($sUnit) {
            $aBindings['alert_unit'] = $sUnit;
            $sWhereClause .= " AND `alert_unit`=:alert_unit";
        }

        return $this->getColumn("SELECT DISTINCT `alert_action` FROM `{$this->_sTableHandlers}` WHERE `type`='insert'" . $sWhereClause, $aBindings);
    }

    public function markAsClicked($iUserId, $iEventId)
    {
        return $this->query("INSERT INTO `" . $this->_sTableEvt2Usr . "` (`user_id`, `event_id`, `clicked`) VALUES (:user_id, :event_id, 1) ON DUPLICATE KEY UPDATE `clicked`=1", [
            'user_id' => $iUserId,
            'event_id' => $iEventId
        ]);
    }

    public function markAsRead($iUserId, $iEventId)
    {
        $this->queueDeleteByProfile($iUserId, $iEventId);

        return $this->query("INSERT INTO `" . $this->_sTableRead . "` (`user_id`, `event_id`) VALUES (:user_id, :event_id) ON DUPLICATE KEY UPDATE `event_id`=:event_id", array(
            'user_id' => $iUserId,
            'event_id' => $iEventId
        ));
    }

    public function getLastRead($iUserId)
    {
        return (int)$this->getOne("SELECT `event_id` FROM `" . $this->_sTableRead . "` WHERE `user_id`=:user_id LIMIT 1", array(
            'user_id' => (int)$iUserId
        ));
    }

    public function deleteEvent($aParams, $sWhereAddon = "")
    {
        $aEvents = $this->getAll("SELECT * FROM `{$this->_sTable}` WHERE " . $this->arrayToSQL($aParams, " AND ") . $sWhereAddon);
        if(!empty($aEvents) && is_array($aEvents)) 
            foreach($aEvents as $aEvent)
                $this->queueDelete(array('event_id' => $aEvent['id']));

        return parent::deleteEvent($aParams, $sWhereAddon);
    }

    public function getEvents($aParams, $bReturnCount = false)
    {
        /**
         * @hooks
         * @hookdef hook-bx_notifications-get_events_before 'bx_notifications', 'get_events_before' - hook to override params which are used to get events
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `get_events_before`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] by ref, params array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-get_events_before
         */
        bx_alert($this->_oConfig->getName(), 'get_events_before', 0, 0, [
            'params' => &$aParams,
            'params_ref' => &$aParams,
        ]);

        if($aParams['browse'] != 'list' || $aParams['type'] != BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS)
            return parent::getEvents($aParams);

        $bEventsGroupedDb = $this->_oConfig->isEventsGroupedDb();
        $bClickedIndicator = $this->_oConfig->isClickedIndicator();
        $bCountOnly = !empty($aParams['count_only']);
        $bViewerId = !empty($aParams['viewer_id']);

        $sSelectClauseClicked = ", 0 AS `clicked`";
        $sLimitClause = isset($aParams['per_page']) ? "LIMIT 0, " . ($aParams['start'] + $aParams['per_page']) : "";

        $sSelectClauseGrouped = $sGroupByClauseGrouped = "";
        if($bEventsGroupedDb) {
            $sSelectClauseGrouped =  ", GROUP_CONCAT(`{$this->_sTable}`.`id` ORDER BY `{$this->_sTableHandlers}`.`priority` DESC SEPARATOR ',') AS `subgrouped_by_mac`";
            $sGroupByClauseGrouped = "`{$this->_sTable}`.`source_mac`";
        }

        //--- Get query for 'Object Owner' notifications
        $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_OBJECT_OWNER;

        $sGroupByClausePo = "";
        list($sMethod, $sSelectClause, $sJoinClausePo, $sWhereClausePo, $sOrderClausePo) = $this->_getSqlPartsEvents($aParams);       

        if($bClickedIndicator && $bViewerId) {
            $sSelectClauseClicked = ", IF(ISNULL(`{$this->_sTableEvt2Usr}`.`clicked`) OR `{$this->_sTableEvt2Usr}`.`clicked`=0, 0, 1) AS `clicked`";
            $sJoinClausePo .= $this->prepareAsString(" LEFT JOIN `{$this->_sTableEvt2Usr}` ON `{$this->_sTable}`.`id`=`{$this->_sTableEvt2Usr}`.`event_id` AND `{$this->_sTableEvt2Usr}`.`user_id`=?", $aParams['viewer_id']);
        }

        $sGroupByClausePo .= $sGroupByClauseGrouped;
        if($sGroupByClausePo)
            $sGroupByClausePo = " GROUP BY " . $sGroupByClausePo;

        $sQueryOwner = "SELECT {select}
            FROM `{$this->_sTable}`
            LEFT JOIN `{$this->_sTableHandlers}` ON `{$this->_sTable}`.`type`=`{$this->_sTableHandlers}`.`alert_unit` AND `{$this->_sTable}`.`action`=`{$this->_sTableHandlers}`.`alert_action` " . $sJoinClausePo . "
            WHERE 1 " . $sWhereClausePo . $sGroupByClausePo . (!$bCountOnly ? " " . $sOrderClausePo . " " . $sLimitClause : "");

        //--- Get query for 'Connections based' notifications
        $aParams['type'] = BX_BASE_MOD_NTFS_TYPE_CONNECTIONS;

        $sGroupByClausePc = "";
        list($sMethod, $sSelectClause, $sJoinClausePc, $sWhereClausePc, $sOrderClausePc) = $this->_getSqlPartsEvents($aParams);

        if($bClickedIndicator && $bViewerId) {
            $sSelectClauseClicked = ", IF(ISNULL(`{$this->_sTableEvt2Usr}`.`clicked`) OR `{$this->_sTableEvt2Usr}`.`clicked`=0, 0, 1) AS `clicked`";
            $sJoinClausePc .= $this->prepareAsString(" LEFT JOIN `{$this->_sTableEvt2Usr}` ON `{$this->_sTable}`.`id`=`{$this->_sTableEvt2Usr}`.`event_id` AND `{$this->_sTableEvt2Usr}`.`user_id`=?", $aParams['viewer_id']);
        }

        $sGroupByClausePc .= $sGroupByClauseGrouped;
        if($sGroupByClausePc)
            $sGroupByClausePc = " GROUP BY " . $sGroupByClausePc;

        $sQueryConnections = "SELECT {select}
            FROM `{$this->_sTable}`
            LEFT JOIN `{$this->_sTableHandlers}` ON `{$this->_sTable}`.`type`=`{$this->_sTableHandlers}`.`alert_unit` AND `{$this->_sTable}`.`action`=`{$this->_sTableHandlers}`.`alert_action` " . $sJoinClausePc . "
            WHERE 1 " . $sWhereClausePc . $sGroupByClausePc . (!$bCountOnly ? " " . $sOrderClausePc . " " . $sLimitClause : "");

        $sSelectClause .= $sSelectClauseClicked;
        $sSelectClause .= $sSelectClauseGrouped;

        //--- Combine both queries in one
        $bStartFromItem = isset($aParams['start_from_item']) && $aParams['start_from_item'] === true;

        $sUnionMethod = 'getColumn';
        $sUnionOrderClause = $sUnionLimitClause = '';
        if(!$bCountOnly) {
            $sUnionMethod = $sMethod;
            $sUnionOrderClause = "ORDER BY `date` DESC, `id` DESC";
            $sUnionLimitClause = isset($aParams['per_page']) ? "LIMIT " . (!$bStartFromItem ? $aParams['start'] : 0) . ", " . $aParams['per_page'] : "";
        }

        $aAlertParams = $aParams;
        unset($aAlertParams['browse']);

        /**
         * Parts: 
         * PO - notifications related to Owner's content
         * PC - notifications related to Connections' content
         */
        /**
         * @hooks
         * @hookdef hook-bx_notifications-get_events 'bx_notifications', 'get_events' - hook to override events list which will be received from database
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `get_events`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `browse` - [string] browsing type
         *      - `params` - [array] browse params array as key&value pairs
         *      - `table` - [string] datatbase table name
         *      - `method` - [string] by ref, database class method name, @see BxDolDb, can be overridden in hook processing
         *      - `select_clause` - [string] by ref, 'select' part of SQL query, can be overridden in hook processing
         *      - `join_clause_po` - [string] by ref, 'join' part of Owner's SQL query, can be overridden in hook processing
         *      - `join_clause_pc` - [string] by ref, 'join' part of Connections' SQL query, can be overridden in hook processing
         *      - `where_clause_po` - [string] by ref, 'where' part of Owner's SQL query, can be overridden in hook processing
         *      - `where_clause_pc` - [string] by ref, 'where' part of Connections' SQL query, can be overridden in hook processing
         *      - `order_clause_po` - [string] by ref, 'order' part of Owner's SQL query, can be overridden in hook processing
         *      - `order_clause_pc` - [string] by ref, 'order' part of Connections' SQL query, can be overridden in hook processing
         *      - `order_clause` - [string] by ref, 'order' part of SQL query, can be overridden in hook processing
         *      - `limit_clause` - [string] by ref, 'limit' part of SQL query, can be overridden in hook processing
         *      - `query_po` - [string] by ref, Owner's SQL query, can be overridden in hook processing
         *      - `query_pc` - [string] by ref, Connections' SQL query, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-get_events
         */
        bx_alert($this->_oConfig->getName(), 'get_events', 0, 0, [
            'browse' => $aParams['browse'],
            'params' => $aAlertParams,
            'table' => $this->_sTable,

            'method' => &$sUnionMethod,
            'select_clause' => &$sSelectClause,
            'join_clause_po' => &$sJoinClausePo,
            'join_clause_pc' => &$sJoinClausePc,
            'where_clause_po' => &$sWhereClausePo,
            'where_clause_pc' => &$sWhereClausePc,
            'order_clause_po' => &$sOrderClausePo,
            'order_clause_pc' => &$sOrderClausePc,
            'order_clause' => &$sUnionOrderClause,
            'limit_clause' => &$sUnionLimitClause,
            'query_po' => &$sQueryOwner,
            'query_pc' => &$sQueryConnections,

            'method_ref' => &$sUnionMethod,
            'select_clause_ref' => &$sSelectClause,
            'join_clause_po_ref' => &$sJoinClausePo,
            'join_clause_pc_ref' => &$sJoinClausePc,
            'where_clause_po_ref' => &$sWhereClausePo,
            'where_clause_pc_ref' => &$sWhereClausePc,
            'order_clause_po_ref' => &$sOrderClausePo,
            'order_clause_pc_ref' => &$sOrderClausePc,
            'order_clause_ref' => &$sUnionOrderClause,
            'limit_clause_ref' => &$sUnionLimitClause,
            'query_po_ref' => &$sQueryOwner,
            'query_pc_ref' => &$sQueryConnections,
        ]);

        if($bEventsGroupedDb)
            $sQuery = "SELECT *, GROUP_CONCAT(`subgrouped_by_mac` ORDER BY `priority` DESC SEPARATOR ',') AS `grouped_by_mac` FROM ((" . $sQueryOwner . ") UNION (" . $sQueryConnections . ")) AS `tu` GROUP BY `source_mac` {order} {limit}";
        else
            $sQuery = "(" . $sQueryOwner . ") UNION (" . $sQueryConnections . ") {order} {limit}";
        $sQuery = str_replace(['{select}', '{order}', '{limit}'], [$sSelectClause, $sUnionOrderClause, $sUnionLimitClause], $sQuery);
        $aEntries = $this->$sUnionMethod($sQuery);

        if($bCountOnly)
            $aEntries = (int)array_sum($aEntries);

        return $aEntries;
    }

    protected function _getSqlPartsEvents($aParams)
    {
        list($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause) = parent::_getSqlPartsEvents($aParams);

        switch($aParams['browse']) {
            case 'descriptor':
                $sMethod = 'getRow';
                $sWhereClause = "";

                if(isset($aParams['type']))
                    $sWhereClause .= $this->prepareAsString("AND `" . $this->_sTable . "`.`type`=? ", $aParams['type']);
                if(isset($aParams['action']))
                    $sWhereClause .= $this->prepareAsString("AND `" . $this->_sTable . "`.`action`=? ", $aParams['action']);
                if(isset($aParams['object_id']))
                    $sWhereClause .= $this->prepareAsString("AND `" . $this->_sTable . "`.`object_id`=? ", $aParams['object_id']);

                $sLimitClause = "LIMIT 1";
                break;

            case 'first':
                $sWhereClause .= $this->prepareAsString("AND `" . $this->_sTable . "`.`date` <= ? ", time());
                break;

            case 'list':
                if(!empty($aParams['count_only'])) {
                    $sMethod = 'getOne';
                    $sSelectClause = 'COUNT(DISTINCT `' . $this->_sTable . '`.`id`)';
                }
                else {
                    $sSelectClause .= ", `{$this->_sTableHandlers}`.`priority` AS `priority`";

                    if(in_array($aParams['type'], array(BX_BASE_MOD_NTFS_TYPE_CONNECTIONS, BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS)))
                        $sSelectClause = 'DISTINCT ' . $sSelectClause;
                }

                $sWhereClause .= $this->prepareAsString("AND `" . $this->_sTable . "`.`date` <= ? ", time());
                break;
        }

        return array($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);
    }

    protected function _getSqlPartsEventsList($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

        $sJoinClause = $sWhereClause = "";

        //--- Apply 'start from'  filter
        $sWhereClauseStartFrom = '';
        if(isset($aParams['start_from_item']) && $aParams['start_from_item'] === true && $aParams['start'] != 0)
            $sWhereClauseStartFrom = $this->prepareAsString("AND `{$this->_sTable}`.`id`<? ", (int)$aParams['start']);

        //--- Apply status filter
        $sWhereClauseStatus = '';
        if(isset($aParams['active']))
            $sWhereClauseStatus = $this->prepareAsString("AND `{$this->_sTable}`.`active`=? ", (int)$aParams['active']);

        //--- Apply modules or handlers filter
        $sWhereClauseModules = '';
        if(!empty($aParams['modules']) && is_array($aParams['modules']))
            $sWhereClauseModules = "AND `" . $this->_sTable . "`.`type` IN (" . $this->implode_escape($aParams['modules']) . ") ";

        if($sWhereClauseModules == '') {
            $aHidden = $this->_oConfig->getHandlersHidden();
            $sWhereClauseModules = !empty($aHidden) && is_array($aHidden) ? "AND `" . $this->_sTableHandlers . "`.`id` NOT IN (" . $this->implode_escape($aHidden) . ") " : "";
        }

        //--- Check flag 'New'
        $sWhereClauseNew = '';
        if(!empty($aParams['new']) && !empty($aParams['owner_id']))
            $sWhereClauseNew = $this->prepareAsString("AND `{$this->_sTable}`.`id`>? ", $this->getLastRead((int)$aParams['owner_id']));

        //--- Check type
        $sWhereClauseSettings = $sWhereClauseType = '';
        if(!empty($aParams['owner_id']))
            switch($aParams['type']) {
                /*
                 * Note. It isn't used for now and outdated.
                 */
                case BX_BASE_MOD_NTFS_TYPE_OWNER:
                    $sWhereClauseType = $this->prepareAsString("AND `{$this->_sTable}`.`owner_id`=? ", $aParams['owner_id']);
                    break;

                case BX_BASE_MOD_NTFS_TYPE_OBJECT_OWNER:
                    $sJoinClause .= $this->prepareAsString(" INNER JOIN `{$this->_sTableSettings}` ON `{$this->_sTableHandlers}`.`id`=`{$this->_sTableSettings}`.`handler_id` AND `{$this->_sTableSettings}`.`delivery`='" . BX_BASE_MOD_NTFS_DTYPE_SITE . "' AND `{$this->_sTableSettings}`.`active`='1' AND `{$this->_sTableSettings}`.`type`=?", BX_NTFS_STYPE_PERSONAL);

                    $sJoinClauseS2U = " LEFT JOIN `{$this->_sTableSettings2Users}` ON `{$this->_sTableSettings}`.`id`=`{$this->_sTableSettings2Users}`.`setting_id` ";
                    if(!empty($aParams['owner_id']))
                        $sJoinClauseS2U .= $this->prepareAsString("AND `{$this->_sTableSettings2Users}`.`user_id`=? ", $aParams['owner_id']);

                    $sJoinClause .= $sJoinClauseS2U;
                    $sWhereClauseSettings = "AND ((ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings}`.`value`='1') OR (NOT ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings2Users}`.`active`='1')) ";

                    $sWhereClauseType = $this->prepareAsString("AND `{$this->_sTable}`.`owner_id`<>`{$this->_sTable}`.`object_owner_id` AND ((`{$this->_sTable}`.`owner_id`=? AND `{$this->_sTable}`.`object_privacy_view`<0 AND `{$this->_sTable}`.`owner_id`=ABS(`{$this->_sTable}`.`object_privacy_view`)) OR `{$this->_sTable}`.`object_owner_id`=?) ", $aParams['owner_id'], $aParams['owner_id']);
                    break;

                case BX_BASE_MOD_NTFS_TYPE_CONNECTIONS:
                    $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));
                    $aQueryParts = $oConnection->getConnectedContentAsSQLParts($this->_sTable, 'owner_id', $aParams['owner_id']);
                    if(empty($aQueryParts) || !is_array($aQueryParts) || empty($aQueryParts['join']))
                        break;

                    //--- Show notifications from connected contexts (using INNER JOIN)
                    $sJoinClause .= " LEFT JOIN `sys_profiles` AS `tsp` ON `{$this->_sTable}`.`owner_id`=`tsp`.`id` " . $aQueryParts['join'];

                    $sWhereClauseType = '';
                    if(getParam($CNF['PARAM_OWN_ACTIONS']) != 'on') {
                        //--- Don't show notifications about own posts to connected contexts
                        $sWhereClauseType .= $this->prepareAsString("AND `{$this->_sTable}`.`object_owner_id` <> ? ", $aParams['owner_id']);

                        //--- Don't show notifications about the other own actions performed in connected contexts
                        $sWhereClauseType .= $this->prepareAsString("AND `{$this->_sTable}`.`author_id` <> ? ", $aParams['owner_id']);
                    }
                    //--- Don't show notifications about posts created before the connection was established
                    if(!empty($aQueryParts['fields']['added']))
                        $sWhereClauseType .= "AND `{$this->_sTable}`.`date` >= " . $aQueryParts['fields']['added'];

                    list($aModulesProfiles, $aModulesContexts) = $this->_oConfig->getProfileBasedModules();
                    $sJoinClause .= $this->prepareAsString(" INNER JOIN `{$this->_sTableSettings}` ON `{$this->_sTableHandlers}`.`id`=`{$this->_sTableSettings}`.`handler_id` AND `{$this->_sTableSettings}`.`delivery`='" . BX_BASE_MOD_NTFS_DTYPE_SITE . "' AND `{$this->_sTableSettings}`.`active`='1' AND ((`{$this->_sTableSettings}`.`type`=? AND `tsp`.`type` IN (" . $this->implode_escape($aModulesProfiles) . ")) || (`{$this->_sTableSettings}`.`type`=? AND `tsp`.`type` IN (" . $this->implode_escape($aModulesContexts) . ")))", BX_NTFS_STYPE_FOLLOW_MEMBER, BX_NTFS_STYPE_FOLLOW_CONTEXT);

                    $sJoinClauseS2U = " LEFT JOIN `{$this->_sTableSettings2Users}` ON `{$this->_sTableSettings}`.`id`=`{$this->_sTableSettings2Users}`.`setting_id` ";
                    if(!empty($aParams['owner_id']))
                        $sJoinClauseS2U .= $this->prepareAsString("AND `{$this->_sTableSettings2Users}`.`user_id`=? ", $aParams['owner_id']);

                    $sJoinClause .= $sJoinClauseS2U;
                    $sWhereClauseSettings = "AND ((ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings}`.`value`='1') OR (NOT ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings2Users}`.`active`='1')) ";
                    break;

                case BX_NTFS_TYPE_OBJECT_OWNER_AND_CONNECTIONS:
                    /**
                     * 'personal' notifications are taken by: 
                     * 1. 'owner_id', in case of somebody performed an action in requested profile's context
                     * 'object_privacy_view' < 0 AND 'owner_id' == ABS('object_privacy_view'))
                     * Currently it happens when somebody posted a Direct Timeline post in requested profile.
                     * 2. 'object_owner_id', in case of somebody performed an action with content 
                     * owned by the requested profile.
                     */
                    $sWhereClauseObjectOwner = $this->prepareAsString("`{$this->_sTable}`.`owner_id` <> `{$this->_sTable}`.`object_owner_id` AND ((`{$this->_sTable}`.`owner_id`=? AND `{$this->_sTable}`.`object_privacy_view`<0 AND `{$this->_sTable}`.`owner_id`=ABS(`{$this->_sTable}`.`object_privacy_view`)) OR `{$this->_sTable}`.`object_owner_id`=?) ", $aParams['owner_id'], $aParams['owner_id']);

                    /**
                     * 'follow' notifications are taken by connection with `owner_id`
                     */
                    $sWhereClauseConnections = '0';
                    $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));
                    $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($this->_sTable, 'owner_id', $aParams['owner_id']);
                    if(!empty($aQueryParts) && is_array($aQueryParts) && !empty($aQueryParts['join'])) {
                        $sJoinClause .= " LEFT JOIN `sys_profiles` AS `tsp` ON `{$this->_sTable}`.`owner_id`=`tsp`.`id`";
                        $sJoinClause .= " LEFT JOIN `" . $aQueryParts['join']['table'] . "` AS `" . $aQueryParts['join']['table_alias'] . "` ON (" . $aQueryParts['join']['condition'] . ")";

                        //--- Show notifications from connected contexts
                        $sWhereClauseConnections = "NOT ISNULL(`c`.`content`) ";
                        if(getParam($CNF['PARAM_OWN_ACTIONS']) != 'on') {
                            //--- Don't show notifications about own posts to connected contexts
                            $sWhereClauseConnections .= $this->prepareAsString("AND `{$this->_sTable}`.`object_owner_id` <> ? ", $aParams['owner_id']);

                            //--- Don't show notifications about the other own actions performed in connected contexts
                            $sWhereClauseType .= $this->prepareAsString("AND `{$this->_sTable}`.`author_id` <> ? ", $aParams['owner_id']);
                        }
                        //--- Don't show notifications about posts created before the connection was established
                        if(!empty($aQueryParts['fields']['added']))
                            $sWhereClauseConnections .= "AND `{$this->_sTable}`.`date` >= `" . $aQueryParts['fields']['added']['table_alias'] . "`.`" . $aQueryParts['fields']['added']['name'] . "` ";
                    }

                    list($aModulesProfiles, $aModulesContexts) = $this->_oConfig->getProfileBasedModules();
                    $sJoinClause .= $this->prepareAsString(" INNER JOIN `{$this->_sTableSettings}` ON `{$this->_sTableHandlers}`.`id`=`{$this->_sTableSettings}`.`handler_id` AND `{$this->_sTableSettings}`.`delivery`='" . BX_BASE_MOD_NTFS_DTYPE_SITE . "' AND `{$this->_sTableSettings}`.`active`='1' AND (`{$this->_sTableSettings}`.`type`=? OR ((`{$this->_sTableSettings}`.`type`=? AND `tsp`.`type` IN (" . $this->implode_escape($aModulesProfiles) . ")) || (`{$this->_sTableSettings}`.`type`=? AND `tsp`.`type` IN (" . $this->implode_escape($aModulesContexts) . "))))", BX_NTFS_STYPE_PERSONAL, BX_NTFS_STYPE_FOLLOW_MEMBER, BX_NTFS_STYPE_FOLLOW_CONTEXT);

                    $sJoinClauseS2U = " LEFT JOIN `{$this->_sTableSettings2Users}` ON `{$this->_sTableSettings}`.`id`=`{$this->_sTableSettings2Users}`.`setting_id` ";
                    if(!empty($aParams['owner_id']))
                        $sJoinClauseS2U .= $this->prepareAsString("AND `{$this->_sTableSettings2Users}`.`user_id`=? ", $aParams['owner_id']);

                    $sJoinClause .= $sJoinClauseS2U;
                    $sWhereClauseSettings = "AND ((ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings}`.`value`='1') OR (NOT ISNULL(`{$this->_sTableSettings2Users}`.`active`) AND `{$this->_sTableSettings2Users}`.`active`='1')) ";

                    $sWhereClauseType = "AND ((" . $sWhereClauseObjectOwner . ") OR (" . $sWhereClauseConnections . ")) ";
                    break;
            }

        $aAlertParams = $aParams;
        unset($aAlertParams['type'], $aAlertParams['owner_id']);

        /**
         * @hooks
         * @hookdef hook-bx_notifications-get_list_by_type 'bx_notifications', 'get_list_by_type' - hook to override SQL query parts which are used to get events list
         * - $unit_name - equals `bx_notifications`
         * - $action - equals `get_list_by_type`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] a type of events list
         *      - `owner_id` - [int] owner profile id
         *      - `params` - [array] browse params array as key&value pairs
         *      - `table` - [string] datatbase table name
         *      - `join_clause` - [string] by ref, 'join' part of SQL query, can be overridden in hook processing
         *      - `where_clause` - [string] by ref, 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_start_from` - [string] by ref, 'start_from' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_status` - [string] by ref, 'status' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_modules` - [string] by ref, 'modules' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_new` - [string] by ref, 'new' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_settings` - [string] by ref, 'settings' conditions in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_type` - [string] by ref, 'type' condition in 'where' part of SQL query, can be overridden in hook processing
         * @hook @ref hook-bx_notifications-get_list_by_type
         */
        bx_alert($this->_oConfig->getName(), 'get_list_by_type', 0, 0, [
            'type' => $aParams['type'],
            'owner_id' => $aParams['owner_id'],
            'params' => $aAlertParams,
            'table' => $this->_sTable,

            'join_clause' => &$sJoinClause,
            'where_clause' => &$sWhereClause,
            'where_clause_start_from' => &$sWhereClauseStartFrom,
            'where_clause_status' => &$sWhereClauseStatus,
            'where_clause_modules' => &$sWhereClauseModules,
            'where_clause_new' => &$sWhereClauseNew,
            'where_clause_settings' => &$sWhereClauseSettings,
            'where_clause_type' => &$sWhereClauseType,

            'join_clause_ref' => &$sJoinClause,
            'where_clause_ref' => &$sWhereClause,
            'where_clause_start_from_ref' => &$sWhereClauseStartFrom,
            'where_clause_status_ref' => &$sWhereClauseStatus,
            'where_clause_modules_ref' => &$sWhereClauseModules,
            'where_clause_new_ref' => &$sWhereClauseNew,
            'where_clause_settings_ref' => &$sWhereClauseSettings,
            'where_clause_type_ref' => &$sWhereClauseType,
        ]);

        $sWhereClause .= $sWhereClauseStartFrom;
        $sWhereClause .= $sWhereClauseStatus;
        $sWhereClause .= $sWhereClauseModules;
        $sWhereClause .= $sWhereClauseNew;
        $sWhereClause .= $sWhereClauseSettings;
        $sWhereClause .= $sWhereClauseType;

        return [$sJoinClause, $sWhereClause];
    }

    public function getEventsToProcess($iLimit = 0)
    {
        $aEvents = $this->getAll("SELECT * FROM `" . $this->_sTable . "` WHERE `id`>:id ORDER BY `id` ASC" . ($iLimit != 0 ? ' LIMIT ' . $iLimit : ''), array(
            'id' => $this->_oConfig->getProcessedEvent()
        ));

        if(!empty($aEvents) && is_array($aEvents)) {
            $aEventEnd = end($aEvents);

            $this->_oConfig->setProcessedEvent($aEventEnd['id']);

            reset($aEvents);
        }

        return $aEvents;
    }

    public function queueGet($aParams)
    {
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sSelectClause = "*";
    	$sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['type']) {
            case 'count':
            	$aMethod['name'] = 'getOne';

                $sSelectClause = "COUNT(*)";
                break;

            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `id`=:id";
                break;

            case 'all_to_send':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = array(
                    'timeout' => $aParams['timeout']
                );

                $sWhereClause = " AND `date`+:timeout < UNIX_TIMESTAMP()";
                $sOrderClause = "`date` ASC";
                break;
        }

        $sOrderClause = !empty($sOrderClause) ? "ORDER BY " . $sOrderClause : $sOrderClause;
        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `" . $this->_sTableQueue . "`
            WHERE 1" . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function queueAdd($aSet)
    {
        if(empty($aSet))
            return false;

        return (int)$this->query("INSERT INTO `" . $this->_sTableQueue . "` SET " . $this->arrayToSQL($aSet)) > 0;
    }

    public function queueDelete($aWhere)
    {
    	if(empty($aWhere))
            return false;

        return (int)$this->query("DELETE FROM `" . $this->_sTableQueue . "` WHERE " . $this->arrayToSQL($aWhere, ' AND ')) > 0;
    }

    public function queueDeleteByProfile($iProfileId, $iEventId)
    {
        return (int)$this->query("DELETE FROM `" . $this->_sTableQueue . "` WHERE `profile_id`=:profile_id AND `event_id`<=:event_id", array(
            'profile_id' => $iProfileId,
            'event_id' => $iEventId
        )) > 0;
    }

    public function queueDeleteByIds($mixedId)
    {
        if(empty($mixedId))
            return false;

        if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return (int)$this->query("DELETE FROM `" . $this->_sTableQueue . "` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }
    
    public function getEtemplates($aParams)
    {
    	$aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];

    	$sSelectClause = "*";
    	$sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['sample']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause = " AND `id`=:id";
                break;

            case 'type_action':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = [
                    'type' => $aParams['type'],
                    'action' => $aParams['action']
                ];

                $sWhereClause = " AND `type`=:type AND `action`=:action";

                if(isset($aParams['active'])) {
                    $aMethod['params'][1]['active'] = (int)$aParams['active'];

                    $sWhereClause .= " AND `active`=:active";
                }
                break;
        }

        $sOrderClause = !empty($sOrderClause) ? "ORDER BY " . $sOrderClause : $sOrderClause;
        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `" . $this->_sTableEtemplates . "`
            WHERE 1" . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }
    
    public function cleanEvents($iClearIntervalInDays)
    {
        $this->query("DELETE FROM `{$this->_sTable}` WHERE `date` < :date", array('date' => time() - $iClearIntervalInDays * 86400));
    }   

    public function filterProfileIdsByModule($aIds, $mixedModule)
    {
        if(!is_array($mixedModule))
            $mixedModule = array($mixedModule);

        return $this->getColumn("SELECT `id` FROM `sys_profiles` WHERE `id` IN (" . $this->implode_escape($aIds) . ") AND `type` IN (" . $this->implode_escape($mixedModule) . ")");
    }
}

/** @} */
