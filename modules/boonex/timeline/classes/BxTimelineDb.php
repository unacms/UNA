<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTimelineDb extends BxBaseModNotificationsDb
{
    protected $_sTableSlice;
    protected $_sTableEvent2User;

    protected $_sTableRepostsTrack;
    protected $_sTableHotTrack;

    protected $_aTablesMedia;
    protected $_aTablesMedia2Events;

    /*
     * Constructor.
     */
    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $CNF = &$this->_oConfig->CNF;

        $this->_sTableAlias = 'te';
        $this->_sTableSlice = $this->_sPrefix . 'events_slice';
        $this->_sTableEvent2User = $this->_sPrefix . 'events2users';

        $this->_sTableRepostsTrack = $this->_sPrefix . 'reposts_track';
        $this->_sTableHotTrack = $this->_sPrefix . 'hot_track';

        $this->_aTablesMedia = [
            $CNF['FIELD_PHOTO'] => $this->_sPrefix . 'photos',
            $CNF['FIELD_VIDEO'] => $this->_sPrefix . 'videos',
            $CNF['FIELD_FILE'] => $this->_sPrefix . 'files' 
        ];
        $this->_aTablesMedia2Events = [
            $CNF['FIELD_PHOTO'] => $this->_sPrefix . 'photos2events',
            $CNF['FIELD_VIDEO'] => $this->_sPrefix . 'videos2events',
            $CNF['FIELD_FILE'] => $this->_sPrefix . 'files2events'
        ];
    }

    /**
     * A query with an IGNORE INDEX hint for a key of its table. It is returned unchanged when the
     * table has no such key (a site that didn't get the module update which adds it: a hint naming
     * a missing key is an error) or when the hint is there already.
     */
    public function addIgnoreIndexHint($sQuery, $sTable, $sIndex)
    {
        if(!$this->isIndexExists($sTable, $sIndex))
            return $sQuery;

        return preg_replace('/FROM `' . preg_quote($sTable, '/') . '`(?! IGNORE INDEX)/', 'FROM `' . $sTable . '` IGNORE INDEX (`' . $sIndex . '`)', $sQuery, 1);
    }

    public function deleteModuleEvents($aData)
    {
        foreach($aData['handlers'] as $aHandler) {
            //Delete system events.
            $this->deleteEvent(array('type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));

            //Delete reposted events.
            $aEvents = $this->getEvents(array('browse' => 'reposted_by_descriptor', 'type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));
                foreach($aEvents as $aEvent) {
                    $aContent = unserialize($aEvent['content']);
                    if(isset($aContent['type']) && $aContent['type'] == $aHandler['alert_unit'] && isset($aContent['action']) && $aContent['action'] == $aHandler['alert_action'])
                        $this->deleteEvent(array('id' => (int)$aEvent['id']));
                }
        }
    }
    
    public function updateStatusAdmin($iContentId, $isActive)
    {
        $CNF = $this->_oConfig->CNF;
        $sQuery = $this->prepare("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `active` = ? WHERE `" . $CNF['FIELD_ID'] . "` = ?", $isActive ? '1' : '0', $iContentId);
        return $this->query($sQuery);
    }

    public function activateModuleEvents($aData, $bActivate = true)
    {
        $iActivate = $bActivate ? 1 : 0;

        foreach($aData['handlers'] as $aHandler) {
            //Activate (deactivate) system events.
            $this->updateEvent(array('active' => $iActivate), array('type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));

            //Activate (deactivate) reposted events.
            $aEvents = $this->getEvents(array('browse' => 'reposted_by_descriptor', 'type' => $aHandler['alert_unit'], 'action' => $aHandler['alert_action']));
            foreach($aEvents as $aEvent) {
                $aContent = unserialize($aEvent['content']);
                if(isset($aContent['type']) && $aContent['type'] == $aHandler['alert_unit'] && isset($aContent['action']) && $aContent['action'] == $aHandler['alert_action'])
                    $this->updateEvent(array('active' => $iActivate), array('id' => (int)$aEvent['id']));
            }
        }
    }

    public function getMaxDuration($aParams)
    {
        $aParams['browse'] = 'last';
        if(isset($aParams['timeline']))
            unset($aParams['timeline']);

        $aEvent = $this->getEvents($aParams);
        if(empty($aEvent) || !is_array($aEvent))
            return 0;

        $iNowYear = date('Y', time());
        return (int)$aEvent['year'] < $iNowYear ? (int)$aEvent['year'] : 0;
    }

    public function markAsRead($iUserId, $iEventId)
    {
        return (int)$this->query("INSERT IGNORE INTO `{$this->_sTableEvent2User}` SET `user_id` = :user_id, `event_id` = :event_id", [
            'user_id' => $iUserId,
            'event_id' => $iEventId
        ]) !== false;
    }

    public function cleanRead($iLimit)
    {
        $aUsers = $this->getAll("SELECT `user_id` AS `id`, COUNT(`event_id`) AS `reads` FROM `{$this->_sTableEvent2User}` WHERE 1 GROUP BY `user_id` HAVING `reads`>:limit", [
            'limit' => $iLimit
        ]);
        
        foreach($aUsers as $aUser)
            $this->query("DELETE FROM `{$this->_sTableEvent2User}` WHERE `user_id`=:user_id ORDER BY `event_id` LIMIT :limit", [
                'user_id' => $aUser['id'],
                'limit' => (int)$aUser['reads'] - $iLimit
            ]);
    }

    //--- Repost related methods ---//
    public function insertRepostTrack($iEventId, $iAuthorId, $sAuthorIp, $iRepostedId)
    {
        $iNow = time();
        $iAuthorNip = bx_get_ip_hash($sAuthorIp);
        $sQuery = $this->prepare("INSERT INTO `{$this->_sTableRepostsTrack}` SET `event_id` = ?, `author_id` = ?, `author_nip` = ?, `reposted_id` = ?, `date` = ?", $iEventId, $iAuthorId, $iAuthorNip, $iRepostedId, $iNow);
        return (int)$this->query($sQuery) > 0;
    }

    public function updateRepostTrack($aParamsSet, $aParamsWhere)
    {
        if(empty($aParamsSet) || empty($aParamsWhere))
            return false;

        $sSql = "UPDATE `{$this->_sTableRepostsTrack}` SET " . $this->arrayToSQL($aParamsSet) . " WHERE " . $this->arrayToSQL($aParamsWhere, " AND ");
        return $this->query($sSql);
    }

    public function deleteRepostTrack($iEventId)
    {
        $sQuery = $this->prepare("DELETE FROM `{$this->_sTableRepostsTrack}` WHERE `event_id` = ?", $iEventId);
        return (int)$this->query($sQuery) > 0;
    }

    public function updateRepostCounter($iId, $iCounter, $iIncrement = 1)
    {
        return (int)$this->updateEvent(array('reposts' => (int)$iCounter + $iIncrement), array('id' => $iId)) > 0;
    }

    public function getReposted($sType, $sAction, $iObjectId)
    {
        if(!$this->isHandler($sType, $sAction))
            return [];

    	$bSystem = $this->_oConfig->isSystem($sType, $sAction);

        $aReposted = $this->getEvents($bSystem ? [
            'browse' => 'descriptor', 'type' => $sType, 'action' => $sAction, 'object_id' => $iObjectId
        ] : [
            'browse' => 'id', 'value' => $iObjectId
        ]);

        if($bSystem && (empty($aReposted) || !is_array($aReposted))) {
            $iOwnerId = 0;
            $iDate = 0;
            $sStatus = BX_TIMELINE_STATUS_DELETED;

            $mixedResult = $this->_oConfig->getSystemDataByDescriptor($sType, $sAction, $iObjectId);
            if(is_array($mixedResult)) {
                $iOwnerId = !empty($mixedResult['owner_id']) ? (int)$mixedResult['owner_id'] : 0;
                $iDate = !empty($mixedResult['date']) ? (int)$mixedResult['date'] : 0;
                if($this->_oConfig->isUnhideRestored() && !empty($iOwnerId) && !empty($iDate))
                    $sStatus = BX_TIMELINE_STATUS_ACTIVE;
            }

            $iId = $this->insertEvent([
                'owner_id' => $iOwnerId,
                'type' => $sType,
                'action' => $sAction,
                'object_id' => $iObjectId,
                'object_owner_id' => $iOwnerId,
                'object_privacy_view' => $this->_oConfig->getPrivacyViewDefault('object'),
                'content' => '',
                'title' => '',
                'description' => '',
                'date' => $iDate,
                'reacted' => $iDate,
                'status' => $sStatus
            ]);

            $aReposted = $this->getEvents(['browse' => 'id', 'value' => $iId]);
        }

        return $aReposted;
    }

    function getRepostedBy($iRepostedId)
    {
        $sQuery = $this->prepare("SELECT `author_id` FROM `{$this->_sTableRepostsTrack}` WHERE `reposted_id`=?", $iRepostedId);
        return $this->getColumn($sQuery);
    }

    function getReposts($iRepostedId)
    {
        return $this->getAll("SELECT * FROM `{$this->_sTableRepostsTrack}` WHERE `reposted_id`=:reposted_id", array(
            'reposted_id' => $iRepostedId
        ));
    }

    function isReposted($iRepostedId, $iOwnerId, $iAuthorId)
    {
    	$sQuery = $this->prepare("SELECT 
    			`te`.`id`
    		FROM `{$this->_sTableRepostsTrack}` AS `tst` 
    		LEFT JOIN `{$this->_sTable}` AS `te` ON `tst`.`event_id`=`te`.`id` 
    		WHERE `tst`.`author_id`=? AND `tst`.`reposted_id`=? AND `te`.`owner_id`=?", $iAuthorId, $iRepostedId, $iOwnerId);

    	return (int)$this->getOne($sQuery) > 0;
    }

    //--- Photo uploader related methods ---//
    public function saveMedia($sType, $iEventId, $iItemId)
    {
        return (int)$this->query("INSERT INTO `" . $this->_aTablesMedia2Events[$sType] . "` SET `event_id`=:event_id, `media_id`=:media_id", array(
            'event_id' => $iEventId,
            'media_id' => $iItemId
        )) > 0;
    }

    public function deleteMedia($sType, $iEventId)
    {
        return (int)$this->query("DELETE FROM `" . $this->_aTablesMedia2Events[$sType] . "` WHERE `event_id`=:event_id", array(
            'event_id' => $iEventId
        )) > 0;
    }

    public function hasMedia($iEventId)
    {
        $bResult = false;

        foreach(array_keys($this->_aTablesMedia) as $sType) {
            $aMedia = $this->getMedia($sType, $iEventId);
            if(!empty($aMedia) && is_array($aMedia)) {
                $bResult = true;
                break;
            }
        }

        return $bResult;
    }

    public function getMedia($sType, $iEventId, $iOffset = 0, $bFullInfo = false)
    {
    	$sTableMedia = $this->_aTablesMedia[$sType];
    	$sTableMedia2Events = $this->_aTablesMedia2Events[$sType];

        $sMethod = 'getColumn';
        $sSelectClause = "`tme`.`media_id` AS `id`";
        if($bFullInfo) {
            $sMethod = 'getAll';
            $sSelectClause = "`tm`.*, `tme`.`event_id` AS `event_id`";
        }

        $sLimitAddon = '';
        if($iOffset != 0)
            $sLimitAddon = $this->prepareAsString(" OFFSET ?", $iOffset);

        $sQuery = $this->prepare("SELECT " . $sSelectClause . " 
            FROM `" . $sTableMedia2Events . "` AS `tme`
            LEFT JOIN `" . $sTableMedia . "` AS `tm` ON `tme`.`media_id`=`tm`.`id`
            WHERE `tme`.`event_id`=?" . $sLimitAddon, $iEventId);

        return $this->$sMethod($sQuery);
    }

    public function getMediaById($sType, $iMediaId)
    {
        $sTableMedia = $this->_aTablesMedia[$sType];
    	$sTableMedia2Events = $this->_aTablesMedia2Events[$sType];

        return $this->getRow("SELECT `tm`.*, `tme`.`event_id` AS `event_id` FROM `" . $sTableMedia2Events . "` AS `tme` LEFT JOIN `" . $sTableMedia . "` AS `tm` ON `tme`.`media_id`=`tm`.`id` WHERE `tme`.`media_id`=:media_id LIMIT 1", array(
            'media_id' => $iMediaId
        ));
    }

    //--- Link attach related methods ---//
    public function getUnusedLinks($iUserId)
    {
        return $this->getLinksBy(array(
            'type' => 'unused',
            'profile_id' => $iUserId
        ));
    }

    public function deleteUnusedLinks($iUserId, $iLinkId = 0)
    {
    	$aBindings = [
            'profile_id' => $iUserId
    	];

        $sWhereAddon = '';
        if(!empty($iLinkId)) {
            $aBindings['id'] = $iLinkId;

            $sWhereAddon = " AND `tl`.`id`=:id";
        }

        return $this->query("DELETE FROM `tl`, `tle` USING `" . $this->_sPrefix . "links` AS `tl` LEFT JOIN `" . $this->_sPrefix . "links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id` WHERE `tl`.`profile_id`=:profile_id AND ISNULL(`tle`.`event_id`)" . $sWhereAddon, $aBindings);
    }

    public function saveLink($iEventId, $iLinkId)
    {
        $aBindings = array(
            'event_id' => $iEventId,
            'link_id' => $iLinkId
        );

        $iId = $this->getOne("SELECT `id` FROM `" . $this->_sPrefix . "links2events` WHERE `event_id`=:event_id AND `link_id`=:link_id LIMIT 1", $aBindings);
        if(!empty($iId))
            return true;

        return (int)$this->query("INSERT INTO `" . $this->_sPrefix . "links2events` SET `event_id`=:event_id, `link_id`=:link_id", $aBindings) > 0;
    }

    public function deleteLink($iId)
    {
        return (int)$this->query("DELETE FROM `tl`, `tle` USING `" . $this->_sPrefix . "links` AS `tl` LEFT JOIN `" . $this->_sPrefix . "links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id` WHERE `tl`.`id` = :id", array(
            'id' => $iId
        )) > 0;
    }

    public function deleteLinks($iEventId)
    {
        return (int)$this->query("DELETE FROM `tl`, `tle` USING `" . $this->_sPrefix . "links` AS `tl` LEFT JOIN `" . $this->_sPrefix . "links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id` WHERE `tle`.`event_id` = :event_id", array(
            'event_id' => $iEventId
        )) > 0;
    }

    public function getLinks($iEventId)
    {
        return $this->getLinksBy(array('type' => 'event_id', 'event_id' => $iEventId));
    }

    public function getLinksBy($aParams = array())
    {
        $CNF = &$this->_oConfig->CNF;
    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sSelectClause = "`tl`.*";
    	$sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";
        switch($aParams['type']) {
            case 'id':
            	$aMethod['name'] = 'getRow';
            	$aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `tl`.`id`=:id";

                if(!empty($aParams['profile_id'])) {
                    $aMethod['params'][1]['profile_id'] = $aParams['profile_id'];

                    $sWhereClause .= " AND `tl`.`profile_id`=:profile_id";
                }
                break;

            case 'event_id':
            	$aMethod['params'][1] = array(
                    'event_id' => $aParams['event_id']
                );

                $sJoinClause = "LEFT JOIN `" . $this->_sPrefix . "links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id`";
                $sWhereClause = " AND `tle`.`event_id`=:event_id";
                break;

            case 'unused':
                $aBindings = array(
                    'profile_id' => $aParams['profile_id']
                );

                if(isset($aParams['short']) && $aParams['short'] === true) {
                    $aMethod['name'] = 'getPairs';
                    $aMethod['params'][1] = 'url';
                    $aMethod['params'][2] = 'id';
                    $aMethod['params'][3] = $aBindings;
                }
                else
                    $aMethod['params'][1] = $aBindings;

                $sJoinClause = "LEFT JOIN `" . $this->_sPrefix . "links2events` AS `tle` ON `tl`.`id`=`tle`.`link_id`";
                $sWhereClause = " AND `tl`.`profile_id`=:profile_id AND ISNULL(`tle`.`event_id`)";
                $sOrderClause = "`tl`.`added` DESC";
                break;
        }

        $sOrderClause = !empty($sOrderClause) ? "ORDER BY " . $sOrderClause : $sOrderClause;
        $sLimitClause = !empty($sLimitClause) ? "LIMIT " . $sLimitClause : $sLimitClause;

        $aMethod['params'][0] = "SELECT
                " . $sSelectClause . "
            FROM `" . $this->_sPrefix . "links` AS `tl` " . $sJoinClause . "
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getHot()
    {
        return $this->fromCache($this->_oConfig->getCacheHotKey(), 'getColumn', "SELECT `event_id` FROM `" . $this->_sTableHotTrack . "`");
    }

    public function clearHot()
    {
        $this->cleanCache($this->_oConfig->getCacheHotKey());

        return $this->query("TRUNCATE TABLE `" . $this->_sTableHotTrack . "`");
    }

    public function getHotTrackByDate($iInterval = 0)
    {
        $aBindings = [
            'mux' => $this->_oConfig->getHotContentAgeMux()
        ];
        $sQueryWhere = "";

        if($iInterval != 0) {
            $aBindings['interval'] = $iInterval;

            $sQueryWhere .= " AND `te`.`date` > (UNIX_TIMESTAMP() - 3600 * :interval)";
        }

        $sQuery = "SELECT 
                `te`.`id` AS `event_id`,
                `te`.`date` * (1 - :mux * (UNIX_TIMESTAMP() - `te`.`date`) / UNIX_TIMESTAMP()) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            WHERE (`te`.`system` <> 0 OR `te`.`owner_id` = 0)" . $sQueryWhere;

        return $this->getPairs($sQuery, 'event_id', 'value', $aBindings);
    }

    public function getHotTrackByCommentsDate($sModule, $sTableTrack, $iInterval = 0, $iThresholdAge = 0, $iThresholdCount = 0)
    {
        $aBindings = [
            'mux' => $this->_oConfig->getHotContentAgeMux(),
            'module' => $sModule, 
        ];

        $sQueryWhere = " AND (`te`.`system` <> 0 OR `te`.`owner_id` = 0)";
        
        if($iInterval != 0) {
            $aBindings['interval'] = $iInterval;
            
            $sQueryWhere .= " AND `tt`.`cmt_time` > (UNIX_TIMESTAMP() - 3600 * :interval)";
        }

        if($iThresholdAge != 0) {
            $aBindings['threshold_age'] = $iThresholdAge;

            $sQueryWhere .= " AND (UNIX_TIMESTAMP() - `te`.`date`) / 86400 <= :threshold_age";
        }

        $sQueryGroup = "`te`.`id`";
        if($iThresholdCount != 0) {
            $aBindings['threshold_count'] = $iThresholdCount;

            $sQueryGroup .= " HAVING COUNT(DISTINCT `tt`.`cmt_author_id`) >= :threshold_count";
        }

        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                MAX(`tt`.`cmt_time`) * (1 - :mux * (UNIX_TIMESTAMP() - `te`.`date`) / UNIX_TIMESTAMP()) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`id`=`tt`.`cmt_object_id` AND `te`.`object_owner_id`<>`tt`.`cmt_author_id` AND `te`.`type`=:module 
            WHERE 1 " . $sQueryWhere . " 
            GROUP BY " . $sQueryGroup;

        return $this->getPairs($sQuery, 'event_id', 'value', $aBindings);
    }

    public function getHotTrackByCommentsDateModule($sModule, $sTableTrack, $iInterval = 0, $iThresholdAge = 0, $iThresholdCount = 0)
    {
        $aBindings = [
            'mux' => $this->_oConfig->getHotContentAgeMux(),
            'module' => $sModule, 
        ];

        $sQueryWhere = " AND (`te`.`system` <> 0 OR `te`.`owner_id` = 0)";
        if($iInterval != 0) {
            $aBindings['interval'] = $iInterval;
            
            $sQueryWhere .= " AND `tt`.`cmt_time` > (UNIX_TIMESTAMP() - 3600 * :interval)";
        }

        if($iThresholdAge != 0) {
            $aBindings['threshold_age'] = $iThresholdAge;

            $sQueryWhere .= " AND (UNIX_TIMESTAMP() - `te`.`date`) / 86400 <= :threshold_age";
        }

        $sQueryGroup = "`te`.`object_id`";
        if($iThresholdCount != 0) {
            $aBindings['threshold_count'] = $iThresholdCount;

            $sQueryGroup .= " HAVING COUNT(DISTINCT `tt`.`cmt_author_id`) >= :threshold_count";
        }

        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                MAX(`tt`.`cmt_time`) * (1 - :mux * (UNIX_TIMESTAMP() - `te`.`date`) / UNIX_TIMESTAMP()) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`object_id`=`tt`.`cmt_object_id` AND `te`.`object_owner_id`<>`tt`.`cmt_author_id` AND `te`.`type`=:module
            WHERE 1 " . $sQueryWhere . " 
            GROUP BY " . $sQueryGroup;

        return $this->getPairs($sQuery, 'event_id', 'value', $aBindings);
    }

    public function getHotTrackByVotesDate($sModule, $sTableTrack, $iInterval = 0, $iThresholdAge = 0, $iThresholdCount = 0)
    {
        $aBindings = [
            'mux' => $this->_oConfig->getHotContentAgeMux(),
            'module' => $sModule, 
        ];

        $sQueryWhere = " AND (`te`.`system` <> 0 OR `te`.`owner_id` = 0)";
        if($iInterval != 0) {
            $aBindings['interval'] = $iInterval;

            $sQueryWhere .= " AND `tt`.`date` > (UNIX_TIMESTAMP() - 3600 * :interval)";
        }

        if($iThresholdAge != 0) {
            $aBindings['threshold_age'] = $iThresholdAge;

            $sQueryWhere .= " AND (UNIX_TIMESTAMP() - `te`.`date`) / 86400 <= :threshold_age";
        }

        $sQueryGroup = "`te`.`id`";
        if($iThresholdCount != 0) {
            $aBindings['threshold_count'] = $iThresholdCount;

            $sQueryGroup .= " HAVING COUNT(DISTINCT `tt`.`author_id`) >= :threshold_count";
        }

        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                MAX(`tt`.`date`) * (1 - :mux * (UNIX_TIMESTAMP() - `te`.`date`) / UNIX_TIMESTAMP()) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`id`=`tt`.`object_id` AND `te`.`object_owner_id`<>`tt`.`author_id` AND `te`.`type`=:module 
            WHERE 1 " . $sQueryWhere . " 
            GROUP BY " . $sQueryGroup;

        return $this->getPairs($sQuery, 'event_id', 'value', $aBindings);
    }

    public function getHotTrackByVotesDateModule($sModule, $sTableTrack, $iInterval = 0, $iThresholdAge = 0, $iThresholdCount = 0)
    {
        $aBindings = [
            'mux' => $this->_oConfig->getHotContentAgeMux(),
            'module' => $sModule, 
        ];

        $sQueryWhere = " AND (`te`.`system` <> 0 OR `te`.`owner_id` = 0)";
        if($iInterval != 0) {
            $aBindings['interval'] = $iInterval;

            $sQueryWhere .= " AND `tt`.`date` > (UNIX_TIMESTAMP() - 3600 * :interval)";
        }

        if($iThresholdAge != 0) {
            $aBindings['threshold_age'] = $iThresholdAge;

            $sQueryWhere .= " AND (UNIX_TIMESTAMP() - `te`.`date`) / 86400 <= :threshold_age";
        }

        $sQueryGroup = "`te`.`object_id`";
        if($iThresholdCount != 0) {
            $aBindings['threshold_count'] = $iThresholdCount;

            $sQueryGroup .= " HAVING COUNT(DISTINCT `tt`.`author_id`) >= :threshold_count";
        }

        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                MAX(`tt`.`date`) * (1 - :mux * (UNIX_TIMESTAMP() - `te`.`date`) / UNIX_TIMESTAMP()) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`object_id`=`tt`.`object_id` AND `te`.`object_owner_id`<>`tt`.`author_id` AND `te`.`type`=:module 
            WHERE 1 " . $sQueryWhere . " 
            GROUP BY " . $sQueryGroup;

        return $this->getPairs($sQuery, 'event_id', 'value', $aBindings);
    }

    /**
     * Hot Track by Sum of Votes during specified Period is currently disabled.
     */
    public function getHotTrackByVotesSum($sModule, $sTableTrack, $iInterval = 24)
    {
        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                SUM(`tt`.`value`) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`id`=`tt`.`object_id` AND `te`.`type`=:module 
            WHERE (`te`.`system` <> 0 OR `te`.`owner_id` = 0) AND `tt`.`date` > (UNIX_TIMESTAMP() - 3600 * :interval) 
            GROUP BY `te`.`id`";

        return $this->getAll($sQuery, array('module' => $sModule, 'interval' => $iInterval));
    }

    /**
     * Hot Track by Sum of Votes during specified Period is currently disabled.
     */
    public function getHotTrackByVotesSumModule($sModule, $sTableTrack, $iInterval = 24)
    {
        $sQuery = "SELECT 
                `te`.`id` as `event_id`,
                SUM(`tt`.`value`) AS `value`
            FROM `" . $this->_sTable . "` AS `te`
            INNER JOIN `" . $sTableTrack . "` AS `tt` ON `te`.`object_id`=`tt`.`object_id` AND `te`.`type`=:module 
            WHERE (`te`.`system` <> 0 OR `te`.`owner_id` = 0) AND `tt`.`date` > (UNIX_TIMESTAMP() - 3600 * :interval) 
            GROUP BY `te`.`object_id`";

        return $this->getAll($sQuery, array('module' => $sModule, 'interval' => $iInterval));
    }

    public function updateHotTrack($iEventId, $iValue)
    {
        return (int)$this->query("INSERT INTO `" . $this->_sTableHotTrack . "` (`event_id`, `value`) VALUES (:event_id, :value) ON DUPLICATE KEY UPDATE `value` = :value", [
            'event_id' => $iEventId,
            'value' => $iValue
        ]) > 0;
    }

    public function rebuildSlice()
    {
        $this->query("TRUNCATE TABLE `" . $this->_sTableSlice . "`");

        $aWhereConditions = [];

        $iInterval = $this->_oConfig->getCacheTableInterval();
        $aCheckFields = $this->_oConfig->getCacheTableCheckFields();
        foreach($aCheckFields as $sField => $sType)
            switch($sType) {
                case 'flag':
                    $aWhereConditions[] = "`" . $sField . "` <> 0";
                    break;

                case 'date':
                    $aWhereConditions[] = "`" . $sField . "` > (UNIX_TIMESTAMP() - " . $iInterval . ")";
                    break;
            }

        return $this->query("INSERT INTO `" . $this->_sTableSlice . "` SELECT * FROM `" . $this->_sTable . "` WHERE " . implode(" OR ", $aWhereConditions));
    }

    public function getEvents($aParams)
    {
        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_events_before 'bx_timeline', 'get_events_before' - hook to override params which are used to get events
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_events_before`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `params` - [array] by ref, params array as key&value pairs, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_events_before
         */
        bx_alert($this->_oConfig->getName(), 'get_events_before', 0, 0, [
            'params' => &$aParams,
            'params_ref' => &$aParams,
        ]);

        $sTable = isset($aParams['from_cache']) && $aParams['from_cache'] === true ? $this->_sTableSlice : $this->_sTable;
        $sTableAlias = $this->getTableAlias();

        list($sMethod, $sSelectClause, $mixedJoinClause, $mixedWhereClause, $sOrderClause, $sLimitClause) = $this->_getSqlPartsEvents($aParams);

        $bCount = isset($aParams['count']) && $aParams['count'] === true;
        if($bCount) {
            $sMethod = 'getOne';
            $sSelectClause = 'COUNT(*)';
            $sOrderClause = '';
            $sLimitClause = '';
        }

        $aAlertParams = $aParams;
        unset($aAlertParams['browse']);

        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_events 'bx_timeline', 'get_events' - hook to override events list which will be received from database
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_events`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `browse` - [string] browsing type
         *      - `params` - [array] browse params array as key&value pairs
         *      - `table` - [string] datatbase table name
         *      - `table_alias` - [string] datatbase table alias
         *      - `method` - [string] by ref, database class method name, @see BxDolDb, can be overridden in hook processing
         *      - `select_clause` - [string] by ref, 'select' part of SQL query, can be overridden in hook processing
         *      - `join_clause` - [string] by ref, 'join' part of SQL query, can be overridden in hook processing
         *      - `where_clause` - [string] by ref, 'where' part of SQL query, can be overridden in hook processing
         *      - `order_clause` - [string] by ref, 'order' part of SQL query, can be overridden in hook processing
         *      - `limit_clause` - [string] by ref, 'limit' part of SQL query, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_events
         */
        bx_alert($this->_oConfig->getName(), 'get_events', 0, 0, [
            'browse' => $aParams['browse'],
            'params' => $aAlertParams,
            'table' => $sTable,
            'table_alias' => $sTableAlias,

            'method' => &$sMethod,
            'select_clause' => &$sSelectClause,
            'join_clause' => &$mixedJoinClause,
            'where_clause' => &$mixedWhereClause,
            'order_clause' => &$sOrderClause,
            'limit_clause' => &$sLimitClause,

            'method_ref' => &$sMethod,
            'select_clause_ref' => &$sSelectClause,
            'join_clause_ref' => &$mixedJoinClause,
            'where_clause_ref' => &$mixedWhereClause,
            'order_clause_ref' => &$sOrderClause,
            'limit_clause_ref' => &$sLimitClause,
        ]);

        $sSqlMask = "SELECT {select}
            FROM `{$sTable}` AS `{$sTableAlias}`
            LEFT JOIN `{$this->_sTableHandlers}` ON `{$sTableAlias}`.`type`=`{$this->_sTableHandlers}`.`alert_unit` AND `{$sTableAlias}`.`action`=`{$this->_sTableHandlers}`.`alert_action` {join}
            WHERE 1 {where} {order} {limit}";

        if(is_string($mixedWhereClause)) {
            $aSqlMarkers = array(
                'select' => $sSelectClause, 
                'join' => $mixedJoinClause, 
                'where' => $mixedWhereClause, 
                'order' => $sOrderClause, 
                'limit' => $sLimitClause
            );

            return $this->$sMethod(bx_replace_markers($sSqlMask, $aSqlMarkers));
        }

        $bJoinAsArray = !empty($mixedJoinClause) && is_array($mixedJoinClause);

        $sOrderSubclause = $sLimitSubclause = '';
        if(!$bCount) {
            $sOrderSubclause = $sOrderClause;
            $sLimitSubclause = isset($aParams['per_page']) ? 'LIMIT 0, ' . ($aParams['start'] + $aParams['per_page']) : '';
        }

        $aSqlParts = array();
        foreach($mixedWhereClause as $sKey => $sValue) {
            $aSqlMarkers = array(
                'select' => $sSelectClause, 
                'join' => $bJoinAsArray ? (isset($mixedJoinClause[$sKey]) ? $mixedJoinClause[$sKey] : '') : $mixedJoinClause, 
                'where' => $sValue, 
                'order' => $sOrderSubclause, 
                'limit' => $sLimitSubclause
            );
            $sSqlPart = bx_replace_markers($sSqlMask, $aSqlMarkers);

            $aSqlParts[] = !$bCount ? $sSqlPart : (int)$this->$sMethod($sSqlPart);
        }

        if($bCount)
            return array_sum($aSqlParts);

        $sSqlMaskUnion = 'SELECT *, GROUP_CONCAT(`owner_id`) AS `owner_id_grouped` FROM ((' . implode(') UNION (', $aSqlParts) . ')) AS `tu` GROUP BY `tu`.`source` {order} {limit}';
        $sSql = bx_replace_markers($sSqlMaskUnion, [
            'order' => str_replace("`{$sTableAlias}`.", '', $sOrderClause),
            'limit' => str_replace("`{$sTableAlias}`.", '', $sLimitClause),
        ]);

        //echoDbg($sSql); exit;
        return $this->$sMethod($sSql);
    }

    public function updateEventFlagsByType($sType, $iEventId)
    {
        $aTablesEventFlags = $this->_oConfig->getFiltersMedia(false);
        if(empty($aTablesEventFlags[$sType]))
            return false;

        return $this->query("INSERT IGNORE INTO `" . $aTablesEventFlags[$sType] . "` (`event_id`) VALUES (:event_id)", [
            'event_id' => $iEventId,
        ]) !== false;
    }

    public function deleteEventFlagsByType($sType, $iEventId)
    {
        $aTablesEventFlags = $this->_oConfig->getFiltersMedia(false);
        if(empty($aTablesEventFlags[$sType]))
            return false;

        return $this->query("DELETE FROM `" . $aTablesEventFlags[$sType] . "` WHERE `event_id`=:event_id", [
            'event_id' => $iEventId
        ]) !== false;
    }

    public function deleteEventFlags($iEventId)
    {
        $aTypes = $this->_oConfig->getFiltersMedia();
        foreach($aTypes as $sType)
            $this->deleteEventFlagsByType($sType, $iEventId);
    }

    protected function _getFilterAddon($iOwnerId, $sFilter)
    {
        $sTableAlias = $this->getTableAlias();

        switch($sFilter) {
            /**
             * Direct posts in Timeline made by a timeline owner ($iOwnerId)
             */
            case BX_TIMELINE_FILTER_OWNER:
                $sFilterAddon = $this->prepareAsString(" AND `{$sTableAlias}`.`action`='' AND `{$sTableAlias}`.`object_id`=? ", $iOwnerId);
                break;

            /**
             * Direct posts in Timeline made by users except a timeline owner ($iOwnerId)
             */
            case BX_TIMELINE_FILTER_OTHER:
                $sFilterAddon = $this->prepareAsString(" AND `{$sTableAlias}`.`action`='' AND `{$sTableAlias}`.`object_id`<>? ", $iOwnerId);
                break;

            /**
             * All (Direct and System) posts in Timeline (owned by $iOwnerId) made by users except the viewer
             */
            case BX_TIMELINE_FILTER_OTHER_VIEWER:
                $sFilterAddon = $this->prepareAsString(" AND (`{$sTableAlias}`.`action`<>'' OR (`{$sTableAlias}`.`action`='' AND `{$sTableAlias}`.`object_id`<>?)) ", bx_get_logged_profile_id());
                break;
                

            case BX_TIMELINE_FILTER_ALL:
            default:
                $sFilterAddon = "";
        }
        return $sFilterAddon;
    }

    protected function _getSqlPartsEvents($aParams)
    {
    	$sMethod = 'getAll';
        $sTableAlias = $this->getTableAlias();
    	$sSelectClause = "`{$sTableAlias}`.*";
        $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        switch($aParams['browse']) {
            case 'owner_id':
                $sWhereClause = $this->prepareAsString("AND `{$sTableAlias}`.`owner_id`=? ", $aParams['value']);
                break;

            case 'source':
                $sWhereClause = $this->prepareAsString("AND `{$sTableAlias}`.`source`=? ", $aParams['value']);
                break;

            case 'common_by_object':
                $sCommonPostPrefix = $this->_oConfig->getPrefix('common_post');
                $sWhereClause = $this->prepareAsString("AND `{$sTableAlias}`.`system`='0' AND `{$sTableAlias}`.`object_id`=? ", $aParams['value']);
                break;

            case 'descriptor':
                $sMethod = 'getRow';
                $sWhereClause = "";

                if(isset($aParams['type']))
                    $sWhereClause .= $this->prepareAsString("AND `{$sTableAlias}`.`type`=? ", $aParams['type']);
                if(isset($aParams['action']))
                    $sWhereClause .= $this->prepareAsString("AND `{$sTableAlias}`.`action`=? ", $aParams['action']);
                if(isset($aParams['object_id']))
                    $sWhereClause .= $this->prepareAsString("AND `{$sTableAlias}`.`object_id`=? ", $aParams['object_id']);

                $sLimitClause = "LIMIT 1";
                break;

            case 'reposted_by_track':
                $sJoinClause = $this->prepareAsString("INNER JOIN `" . $this->_sTableRepostsTrack . "` AS `trt` ON `{$sTableAlias}`.`id`=`trt`.`event_id` AND `trt`.`reposted_id`=?", $aParams['value']);
                break;

            case 'reposted_by_descriptor':
            	$sWhereClause = "";

            	if(isset($aParams['type']))
                    $sWhereClause .= "AND `{$sTableAlias}`.`content` LIKE " . $this->escape('%' . $aParams['type'] . '%');

                if(isset($aParams['action']))
                    $sWhereClause .= "AND `{$sTableAlias}`.`content` LIKE " . $this->escape('%' . $aParams['action'] . '%');
                break;

            case 'last':
                $sMethod = 'getRow';
                $sSelectClause .= ", YEAR(FROM_UNIXTIME(`{$sTableAlias}`.`date`)) AS `year`";
                list($sJoinClause, $sWhereClause) = $this->_getSqlPartsEventsList($aParams);
                $sOrderClause = "ORDER BY `{$sTableAlias}`.`date` ASC, `{$sTableAlias}`.`id` ASC";
                $sLimitClause = "LIMIT 1";
                break;

            case 'ids':
                $sWhereClause = "AND `{$sTableAlias}`.`id` IN (" . $this->implode_escape($aParams['ids']) . ") ";
                break;

            default:
            	list($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause) = parent::_getSqlPartsEvents($aParams);
        }

        if($this->_isList($aParams)) {
            $sOrderClause = "";

            switch($aParams['type']) {
                case BX_TIMELINE_TYPE_HOT:
                    $sOrderClause = "`{$sTableAlias}`.`sticked` DESC, `{$this->_sTableHotTrack}`.`value` DESC, ";
                    break;

                    case BX_BASE_MOD_NTFS_TYPE_PUBLIC:
                    case BX_BASE_MOD_NTFS_TYPE_CONNECTIONS:
                    case BX_TIMELINE_TYPE_CHANNELS:
                    case BX_TIMELINE_TYPE_CONNECTED_CONTEXTS:
                    case BX_TIMELINE_TYPE_FEED:
                    case BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS:
                        $sOrderClause = "`{$sTableAlias}`.`sticked` DESC, ";
                        break;

                    case BX_BASE_MOD_NTFS_TYPE_OWNER:
                        $sOrderClause = "`{$sTableAlias}`.`pinned` DESC, ";
                        break;
            }
            
            if($this->_oConfig->isSortByUnread()) {
                $oProfileQuery = BxDolProfileQuery::getInstance();

                $iDate = 0;
                $iOwner = (int)$aParams['owner_id'];
                $aOwner = $oProfileQuery->getInfoById($iOwner);
                $iViewer = !empty($aParams['viewer_id']) ? (int)$aParams['viewer_id'] : bx_get_logged_profile_id();
                if(!empty($aOwner) && is_array($aOwner) && BxDolRequest::serviceExists($aOwner['type'], 'is_fan') && bx_srv($aOwner['type'], 'is_fan', [$iOwner, $iViewer])) {
                    $oModule = BxDolModule::getInstance($aOwner['type']);
                    $aConnection = BxDolConnection::getObjectInstance($oModule->_oConfig->CNF['OBJECT_CONNECTIONS'])->getConnection($iViewer, $iOwner);
                    $iDate = (int)$aConnection['added'];
                }
                else {
                    $aViewer = $oProfileQuery->getInfoById($iViewer);
                    if(!empty($aViewer) && is_array($aViewer))
                        $iDate = bx_srv($aViewer['type'], 'get_date_added', [$aViewer['content_id']]);
                }

                $sSelectClause .= ", IF(NOT ISNULL(`teu`.`id`), 1, 0) AS `read`";
                $sOrderClause .= $this->prepareAsString("IF(`{$sTableAlias}`.`date` > ?, `read`, 1) ASC, ", $iDate);
            }

            if($this->_oConfig->isSortByReaction())
                $sOrderClause .= "`{$sTableAlias}`.`reacted` DESC, ";
            else
                $sOrderClause .= "`{$sTableAlias}`.`date` DESC, ";

            $sOrderClause = "ORDER BY " . $sOrderClause . "`{$sTableAlias}`.`id` DESC";
        }

        return array($sMethod, $sSelectClause, $sJoinClause, $sWhereClause, $sOrderClause, $sLimitClause);
    }

    protected function _getSqlPartsEventsListStatusAdmin($aParams)
    {
        if(isset($aParams['moderator']) && $aParams['moderator'] === true)
            return '';

        $iViewerId = !empty($aParams['viewer_id']) ? $aParams['viewer_id'] : bx_get_logged_profile_id();       

        $sTableAlias = $this->getTableAlias();

        //--- Check viewer as event author.
        $sWhereClause = $this->prepareAsString("`{$sTableAlias}`.`object_owner_id`=?", $iViewerId);

        //--- Check viewer as an administrator/moderator of event author.
        $aGroups = [];
        $aModules = bx_srv('system', 'get_modules_by_type', ['profile']);
        foreach($aModules as $aModule) {
            $oModule = BxDolModule::getInstance($aModule['name']);
            if(!$oModule || !($oModule instanceof BxBaseModGroupsModule))
                continue;

            $aGroups = array_merge($aGroups, $oModule->getGroupsByFan($iViewerId, [
                BX_BASE_MOD_GROUPS_ROLE_ADMINISTRATOR,
                BX_BASE_MOD_GROUPS_ROLE_MODERATOR
            ]));
        }

        if(!empty($aGroups))
            $sWhereClause .= " OR `{$sTableAlias}`.`object_owner_id` IN (" . $this->implode_escape($aGroups) . ")";

        return $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0' AND (" . $sWhereClause . "), 1, `{$sTableAlias}`.`status_admin`=?) ", isset($aParams['status_admin']) ? $aParams['status_admin'] : BX_TIMELINE_STATUS_ACTIVE);
    }

    protected function _getSqlPartsEventsList($aParams)
    {
        $sCommonPostPrefix = $this->_oConfig->getPrefix('common_post');

        $sTableAlias = $this->getTableAlias();
    	$mixedJoinClause = $mixedWhereClause = "";

        $mixedJoinClause = "INNER JOIN `sys_profiles` AS `tpoo` ON ABS(`{$sTableAlias}`.`object_owner_id`)=`tpoo`.`id` AND `tpoo`.`status`='active'";

        if($this->_oConfig->isSortByUnread())
            $mixedJoinClause .= $this->prepareAsString(" LEFT JOIN `{$this->_sTableEvent2User}` AS `teu` ON `{$sTableAlias}`.`id`=`teu`.`event_id` AND `teu`.`user_id`=? ", $aParams['viewer_id']);

        $sWhereClauseStatus = "AND `{$sTableAlias}`.`active`='1' ";
        $sWhereClauseStatus .= $this->prepareAsString("AND `{$sTableAlias}`.`status`=? ", isset($aParams['status']) ? $aParams['status'] : BX_TIMELINE_STATUS_ACTIVE);
        $sWhereClauseStatus .= $this->_getSqlPartsEventsListStatusAdmin($aParams);

        //--- Apply filter
        $sWhereClauseFilter = "";
        if(isset($aParams['filter']))
            $sWhereClauseFilter = $this->_getFilterAddon($aParams['owner_id'], $aParams['filter']);

        //--- Apply timeline
        $sWhereClauseTimeline = "";
        if(isset($aParams['timeline']) && !empty($aParams['timeline']) && strpos($aParams['timeline'], '-') !== false) {
            list($iY, $iM, $iD) = explode('-', $aParams['timeline']);

            $sWhereClauseTimeline = $this->prepareAsString("AND `date`<=? ", mktime(23, 59, 59, (int)$iM, (int)$iD, (int)$iY));
        }

        //--- Apply modules or handlers filter
        $sWhereClauseModules = "";
        if(!empty($aParams['modules']) && is_array($aParams['modules']))
            $sWhereClauseModules = "AND `" . $sTableAlias . "`.`type` IN (" . $this->implode_escape($aParams['modules']) . ") ";
        
        $sWhereClauseHidden = "";
        if(empty($sWhereClauseModules)) {
            $aHidden = $this->_oConfig->getHandlersHidden();
            $sWhereClauseHidden = !empty($aHidden) && is_array($aHidden) ? "AND `" . $this->_sTableHandlers . "`.`id` NOT IN (" . $this->implode_escape($aHidden) . ") " : "";
        }

        //--- Apply media filter
        $sWhereClauseMedias = "";
        if(($sKm = 'media') && !empty($aParams[$sKm])) {
            $aTablesEventFlags = $this->_oConfig->getFiltersMedia(false);
            if(is_array($aParams[$sKm]) && ($aMts = $aParams[$sKm]) && !(count($aMts) == 1 && empty($aTablesEventFlags[reset($aMts)])) && $aMts !== array_keys($aTablesEventFlags)) {
                $sWhereSubclauseMedias = "0";
                foreach($aMts as $sMt) {
                    if(empty($aTablesEventFlags[$sMt]))
                        continue;

                    $sTableAliasFlag = 't' . substr($sMt, 0, 2);
                    $mixedJoinClause .= " LEFT JOIN `" . $aTablesEventFlags[$sMt] . "` AS `{$sTableAliasFlag}` ON `{$sTableAlias}`.`id`=`{$sTableAliasFlag}`.`event_id`";
                    $sWhereSubclauseMedias .= " OR NOT ISNULL(`{$sTableAliasFlag}`.`event_id`)";
                }
                $sWhereClauseMedias .= "AND ({$sWhereSubclauseMedias}) ";
            }
            else if(is_string($aParams[$sKm]) && ($sMt = $aParams[$sKm]) && !empty($aTablesEventFlags[$sMt])) {
                $sTableAliasFlag = 't' . substr($sMt, 0, 2);
                $mixedJoinClause .= " INNER JOIN `" . $aTablesEventFlags[$sMt] . "` AS `{$sTableAliasFlag}` ON `{$sTableAlias}`.`id`=`{$sTableAliasFlag}`.`event_id`";
            }
        }

        //--- Apply mute filter
        $sWhereClauseMuted = "";
        $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('connection_mute'));
        if($oConnection) {
            $aMuted = $oConnection->getConnectedContent(bx_get_logged_profile_id());
            if(!empty($aMuted) && is_array($aMuted)) {
                $sMuted = "NOT IN (". $this->implode_escape($aMuted) . ")";

                $sWhereClauseMuted = "AND `{$sTableAlias}`.`owner_id` $sMuted AND `{$sTableAlias}`.`object_owner_id` $sMuted ";
            }
        }

        //--- Apply unpublished (date in future) filter
        $sWhereClauseUnpublished = $this->prepareAsString("AND IF(`{$sTableAlias}`.`system`='0' AND `{$sTableAlias}`.`object_id` = ?, 1, `{$sTableAlias}`.`date` <= UNIX_TIMESTAMP()) ", bx_get_logged_profile_id());

        //--- Apply content filter
        $oCf = BxDolContentFilter::getInstance();
        $sWhereClauseCf = $oCf->isEnabled() ? $oCf->getSQLParts($sTableAlias, 'object_cf') . ' ' : '';

        //--- Check type
        $mixedJoinSubclause = $mixedWhereSubclause = "";
        switch($aParams['type']) {
            //--- Feed: Hot
            case BX_TIMELINE_TYPE_HOT:
                //--- Apply privacy filter
                $aPrivacyGroups = array(BX_DOL_PG_ALL);
                if(isLogged())
                    $aPrivacyGroups[] = BX_DOL_PG_MEMBERS;

                $aQueryParts = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'))->getContentByGroupAsSQLPart($aPrivacyGroups);
                $mixedWhereClause .= $aQueryParts['where'] . " ";

                //--- Select Hot posts.
                $mixedJoinSubclause = "LEFT JOIN `{$this->_sTableHotTrack}` ON `{$sTableAlias}`.`id`=`{$this->_sTableHotTrack}`.`event_id`";
                $mixedWhereSubclause = "NOT ISNULL(`{$this->_sTableHotTrack}`.`value`)";

                //--- Select Promoted posts.
                $mixedWhereSubclause .= " OR `{$sTableAlias}`.`promoted` <> '0'";
                break;

            //--- Feed: Public
            case BX_BASE_MOD_NTFS_TYPE_PUBLIC:
                //--- Apply privacy filter
                $aPrivacyGroups = array(BX_DOL_PG_ALL);
                if(isLogged())
                    $aPrivacyGroups[] = BX_DOL_PG_MEMBERS;

                $aQueryParts = BxDolPrivacy::getObjectInstance($this->_oConfig->getObject('privacy_view'))->getContentByGroupAsSQLPart($aPrivacyGroups);
                $mixedWhereClause .= $aQueryParts['where'] . " ";

                if($this->_oConfig->isShowAll())
                    break;

                //--- Select All System posts
                $mixedWhereSubclause = "`{$sTableAlias}`.`system`='1'";

                //--- Select Public (created on Home Page Timeline (Public Feed)) updates 
                $mixedWhereSubclause .= $this->prepareAsString(" OR `{$sTableAlias}`.`owner_id`=?", 0);

                //--- Select Promoted posts.
                $mixedWhereSubclause .= " OR `{$sTableAlias}`.`promoted` <> '0'";
                break;

            //--- Feed: Profile
            case BX_BASE_MOD_NTFS_TYPE_OWNER:
                if(empty($aParams['owner_id']))
                    break;

                //--- Select Own (System and Direct) posts from Profile's Timeline.
                $mixedWhereSubclause = $this->prepareAsString("(`{$sTableAlias}`.`owner_id` = ?)", $aParams['owner_id']);

                //--- Select Own Public (Direct) posts from Home Page Timeline (Public Feed).
                $mixedWhereSubclause .= $this->prepareAsString(" OR (`{$sTableAlias}`.`owner_id` = '0' AND `{$sTableAlias}`.`system`='0' AND `{$sTableAlias}`.`object_id` = ?)", $aParams['owner_id']);
                break;

            //--- Feed: All Profile Connections 
            case BX_BASE_MOD_NTFS_TYPE_CONNECTIONS:
                if(empty($aParams['owner_id']))
                    break;

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                //--- Join System and Direct posts received by and made by following members. 'LEFT' join is essential to apply different conditions.
                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                $aJoin1 = $aQueryParts['join'];

                $mixedJoinSubclause['p1'] = "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                $mixedWhereSubclause['p1'] = "1";

                //--- Exclude Own (Direct) posts on timelines of following members.
                //--- Note. Disabled for now.
                //$mixedWhereSubclause['p1'] .= $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0', `{$sTableAlias}`.`object_id` <> ?, 1)", $aParams['owner_id']);

                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'object_id', $aParams['owner_id']);
                $aJoin2 = $aQueryParts['join'];

                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'object_id', $aParams['owner_id']);
                $aJoin2 = $aQueryParts['join'];
                $aJoin2['table_alias'] = 'cc';
                $aJoin2['condition'] = str_replace('`c`', '`' . $aJoin2['table_alias'] . '`', $aJoin2['condition']);

                $mixedJoinSubclause['p2'] = "INNER JOIN `" . $aJoin2['table'] . "` AS `" . $aJoin2['table_alias'] . "` ON `" . $sTableAlias . "`.`system`='0' AND " . $aJoin2['condition'];
                $mixedWhereSubclause['p2'] = "1";

                //--- Select Promoted posts.
                $mixedJoinSubclause['p3'] = "";
                $mixedWhereSubclause['p3'] = "`{$sTableAlias}`.`promoted` <> '0'";
                break;

            //--- Feed: Profile Connections to contexts by type (groups, events, spaces, etc) only.
            case BX_TIMELINE_TYPE_CONNECTED_CONTEXTS:
                if(empty($aParams['owner_id']) || empty($aParams['context']))
                    break;

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                //--- Filter out unnecessary contexts.
                $aContexts = is_array($aParams['context']) ? $aParams['context'] : [$aParams['context']];
                $mixedJoinSubclause['p1'] = "INNER JOIN `sys_profiles` AS `tpo` ON ABS(`{$sTableAlias}`.`owner_id`)=`tpo`.`id` AND `tpo`.`type` IN (" . $this->implode_escape($aContexts) . ") AND `tpo`.`status`='active' ";

                //--- Join System posts received by following contexts.
                $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));
                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                $aJoin1 = $aQueryParts['join'];

                $mixedJoinSubclause['p1'] .= "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                $mixedWhereSubclause['p1'] = "1";

                /*
                 * Disabled because promoted posts from different contexts 
                 * took a lot of space in the beginning of timeline.
                 * 
                //--- Select Promoted posts.
                $mixedJoinSubclause['p2'] = "";
                $mixedWhereSubclause['p2'] = "`{$sTableAlias}`.`promoted` <> '0'";
                */
                break;

            //--- Feed: Profile Connections to Channel contexts only
            case BX_TIMELINE_TYPE_CHANNELS:
                if(empty($aParams['owner_id']))
                    break;

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                //--- Join System posts received by following channels.
                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                $aJoin1 = $aQueryParts['join'];

                $mixedJoinSubclause['p1'] = "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                $mixedWhereSubclause['p1'] = "`{$sTableAlias}`.`type`='bx_channels'";

                //--- Exclude Own (Direct) posts on timelines of following members.
                //--- Note. Disabled for now.
                //$mixedWhereSubclause['p1'] = $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0', `{$sTableAlias}`.`object_id` <> ?, 1)", $aParams['owner_id']);

                //--- Select Promoted posts.
                $mixedJoinSubclause['p2'] = "";
                $mixedWhereSubclause['p2'] = "`{$sTableAlias}`.`promoted` <> '0'";
                break;

            //--- Feed: Profile + Profile Connections to Non-Channel contexts
            case BX_TIMELINE_TYPE_FEED:
            case BX_TIMELINE_TYPE_FOR_YOU:
                if(empty($aParams['owner_id']))
                    break;

                $bForYou = $aParams['type'] == BX_TIMELINE_TYPE_FOR_YOU;
                $aForYouSources = $bForYou ? $this->_oConfig->getForYouSources() : [];

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                if($aParams['type'] == BX_TIMELINE_TYPE_FEED || ($bForYou && in_array(BX_TIMELINE_FYFS_FEED, $aForYouSources))) {
                    $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                    //--- Select Own (System and Direct) posts from Profile's Timeline.
                    $sWhereSubclauseOwnProfile = $this->prepareAsString("(`{$sTableAlias}`.`owner_id` = ?)", $aParams['owner_id']);

                    //--- Select Own Public (Direct) posts from Home Page Timeline (Public Feed).
                    $sWhereSubclauseOwnPublic = $this->prepareAsString("(`{$sTableAlias}`.`owner_id` = '0' AND `{$sTableAlias}`.`system`='0' AND `{$sTableAlias}`.`object_id` = ?)", $aParams['owner_id']);

                    $mixedJoinSubclause['p1'] = "";
                    $mixedWhereSubclause['p1'] = "(" . $sWhereSubclauseOwnProfile . " OR " . $sWhereSubclauseOwnPublic . ")";

                    //--- Join System and Direct posts received by and made by following members. 'LEFT' join is essential to apply different conditions.
                    $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                    $aJoin1 = $aQueryParts['join'];

                    $mixedJoinSubclause['p2'] = "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                    $mixedWhereSubclause['p2'] = "`{$sTableAlias}`.`type`<>'bx_channels'";

                    //--- Exclude Own (Direct) posts on timelines of following members.
                    //--- Note. Disabled for now and next check is used instead. 
                    //$mixedWhereSubclause['p2'] = $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0', `{$sTableAlias}`.`object_id` <> ?, 1))", $aParams['owner_id']);

                    $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'object_owner_id', $aParams['owner_id']);
                    $aJoin2 = $aQueryParts['join'];
                    $aJoin2['table_alias'] = 'cc';
                    $aJoin2['condition'] = str_replace('`c`', '`' . $aJoin2['table_alias'] . '`', $aJoin2['condition']);

                    $mixedJoinSubclause['p3'] = "INNER JOIN `" . $aJoin2['table'] . "` AS `" . $aJoin2['table_alias'] . "` ON `" . $sTableAlias . "`.`system` = 0 AND `" . $sTableAlias . "`.`object_privacy_view` > 0 AND " . $aJoin2['condition'];
                    $mixedWhereSubclause['p3'] = "1";

                    //--- Select Promoted posts.
                    $mixedJoinSubclause['p4'] = "";
                    $mixedWhereSubclause['p4'] = "`{$sTableAlias}`.`promoted` <> '0'";
                }

                //--- 'For You' feed only: Channels
                if($bForYou && in_array(BX_TIMELINE_FYFS_CHANNELS, $aForYouSources)) {
                    $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                    //--- Join System posts received by following channels.
                    $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                    $aJoin1 = $aQueryParts['join'];

                    $mixedJoinSubclause['p5'] = "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                    $mixedWhereSubclause['p5'] = "`{$sTableAlias}`.`type`='bx_channels'";
                }
                
                //--- 'For You' feed only: Add Hot posts
                if($bForYou && in_array(BX_TIMELINE_FYFS_HOT, $aForYouSources)) {
                    $mixedJoinSubclause['p6'] = "INNER JOIN `{$this->_sTableHotTrack}` ON `{$sTableAlias}`.`id`=`{$this->_sTableHotTrack}`.`event_id`";
                    $mixedWhereSubclause['p6'] = "1";
                }

                //--- 'For You' feed only: Add posts from recommended friends
                if($bForYou && in_array(BX_TIMELINE_FYFS_RECOM_FRIENDS, $aForYouSources) && ($oRecommendation = BxDolRecommendation::getObjectInstance('sys_friends')) !== false) {
                    $aList = $oRecommendation->getList($aParams['owner_id'], [
                        'threshold' => $this->_oConfig->getForYouThresholdRecomFrds()
                    ]);

                    if(!empty($aList) && is_array($aList)) {
                        $mixedJoinSubclause['p7'] = "";
                        $mixedWhereSubclause['p7'] = "`{$sTableAlias}`.`owner_id` IN (" . $this->implode_escape(array_keys($aList)) . ")";
                    }
                }

                //--- 'For You' feed only: Add posts from recommended subscriptions
                if($bForYou && in_array(BX_TIMELINE_FYFS_RECOM_SUBSCRIPTIONS, $aForYouSources) && ($oRecommendation = BxDolRecommendation::getObjectInstance('sys_subscriptions')) !== false) {
                    $aList = $oRecommendation->getList($aParams['owner_id'], [
                        'threshold' => $this->_oConfig->getForYouThresholdRecomSbns()
                    ]);

                    if(!empty($aList) && is_array($aList)) {
                        $mixedJoinSubclause['p8'] = "";
                        $mixedWhereSubclause['p8'] = "`{$sTableAlias}`.`owner_id` IN (" . $this->implode_escape(array_keys($aList)) . ")";
                    }
                }

                //--- 'For You' feed only: Public
                if($bForYou && in_array(BX_TIMELINE_FYFS_PUBLIC, $aForYouSources)) {
                    //--- Select All System posts
                    $sWhereSubclause = "`{$sTableAlias}`.`system`='1'";

                    //--- Select Public (created on Home Page Timeline (Public Feed)) updates or all if 'showAll' setting is enabled
                    if(!$this->_oConfig->isShowAll())
                        $sWhereSubclause .= $this->prepareAsString(" OR `{$sTableAlias}`.`owner_id`=?", 0);
                    else
                        $sWhereSubclause .= $this->prepareAsString(" OR `{$sTableAlias}`.`owner_id`<>?", $aParams['owner_id']);

                    $mixedJoinSubclause['p9'] = "";
                    $mixedWhereSubclause['p9'] = "(" . $sWhereSubclause . ")";
                }
                break;

            //--- Feed: Profile + All Profile Connections
            case BX_TIMELINE_TYPE_OWNER_AND_CONNECTIONS:
                if(empty($aParams['owner_id']))
                    break;

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                //--- Select Own (System and Direct) posts from Profile's Timeline.
                $sWhereSubclauseOwnProfile = $this->prepareAsString("(`{$sTableAlias}`.`owner_id` = ?)", $aParams['owner_id']);

                //--- Select Own Public (Direct) posts from Home Page Timeline (Public Feed).
                $sWhereSubclauseOwnPublic = $this->prepareAsString("(`{$sTableAlias}`.`owner_id` = '0' AND `{$sTableAlias}`.`system`='0' AND `{$sTableAlias}`.`object_id` = ?)", $aParams['owner_id']);

                $mixedJoinSubclause['p1'] = "";
                $mixedWhereSubclause['p1'] = "(" . $sWhereSubclauseOwnProfile . " OR " . $sWhereSubclauseOwnPublic . ")";

                //--- Join System and Direct posts received by and made by following members. 'LEFT' join is essential to apply different conditions.
                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                $aJoin1 = $aQueryParts['join'];

                $mixedJoinSubclause['p2'] = "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];
                $mixedWhereSubclause['p2'] = "1";
                
                //--- Exclude Own (Direct) posts on timelines of following members.
                //--- Note. Disabled for now and next check is used instead. 
                //$mixedWhereSubclause['p2'] = $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0', `{$sTableAlias}`.`object_id` <> ?, 1))", $aParams['owner_id']);

                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'object_id', $aParams['owner_id']);
                $aJoin2 = $aQueryParts['join'];
                $aJoin2['table_alias'] = 'cc';
                $aJoin2['condition'] = str_replace('`c`', '`' . $aJoin2['table_alias'] . '`', $aJoin2['condition']);

                $mixedJoinSubclause['p3'] = "INNER JOIN `" . $aJoin2['table'] . "` AS `" . $aJoin2['table_alias'] . "` ON `" . $sTableAlias . "`.`system`='0' AND " . $aJoin2['condition'];
                $mixedWhereSubclause['p3'] = "1";

                //--- Select Promoted posts.
                $mixedJoinSubclause['p4'] = "";
                $mixedWhereSubclause['p4'] = "`{$sTableAlias}`.`promoted` <> '0'";
                break;

            //--- Feed: Profile Connections to contexts from Selected module
            default:
                if(empty($aParams['owner_id']))
                    break;

                $mixedJoinSubclause = [];
                $mixedWhereSubclause = [];

                $oConnection = BxDolConnection::getObjectInstance($this->_oConfig->getObject('conn_subscriptions'));

                //--- Join System posts received by following channels.
                $aQueryParts = $oConnection->getConnectedContentAsSQLPartsExt($sTableAlias, 'owner_id', $aParams['owner_id']);
                $aJoin1 = $aQueryParts['join'];

                $mixedJoinSubclause['p1'] = "INNER JOIN `sys_profiles` AS `p` ON `" . $sTableAlias ."`.`owner_id`=`p`.`id` AND `p`.`type`='" . $aParams['type'] . "' ";
                $mixedJoinSubclause['p1'] .= "INNER JOIN `" . $aJoin1['table'] . "` AS `" . $aJoin1['table_alias'] . "` ON " . $aJoin1['condition'];

                $mixedWhereSubclause['p1'] = "1";
                if(!empty($aParams['context']))
                    $mixedWhereSubclause['p1'] .= $this->prepareAsString(" AND `" . $aJoin1['table_alias'] . "`.`content`=?", $aParams['context']);

                //--- Exclude Own (Direct) posts on timelines of following members.
                //--- Note. Disabled for now.
                //$mixedWhereSubclause['p1'] = $this->prepareAsString(" AND IF(`{$sTableAlias}`.`system`='0', `{$sTableAlias}`.`object_id` <> ?, 1)", $aParams['owner_id']);

                //--- Select Promoted posts.
                $mixedJoinSubclause['p2'] = "";
                $mixedWhereSubclause['p2'] = "`" . $sTableAlias . "`.`promoted` <> '0'";
                break;
        }

        $aAlertParams = $aParams;
        unset($aAlertParams['type'], $aAlertParams['owner_id']);

        /**
         * @hooks
         * @hookdef hook-bx_timeline-get_list_by_type 'bx_timeline', 'get_list_by_type' - hook to override SQL query parts which are used to get events list
         * - $unit_name - equals `bx_timeline`
         * - $action - equals `get_list_by_type`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `type` - [string] a type of events list
         *      - `owner_id` - [int] owner profile id
         *      - `params` - [array] browse params array as key&value pairs
         *      - `table` - [string] datatbase table name
         *      - `table_alias` - [string] datatbase table alias
         *      - `join_clause` - [string] by ref, 'join' part of SQL query, can be overridden in hook processing
         *      - `join_subclause` - [string] or [array] by ref, 'join subclause' part of SQL query, string is attached to 'join' part, array is used to create query with UNIONs, can be overridden in hook processing
         *      - `where_clause` - [string] by ref, 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_status` - [string] by ref, 'status' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_filter` - [string] by ref, 'filter' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_timeline` - [string] by ref, 'timeline' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_modules` - [string] by ref, 'modules' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_hidden` - [string] by ref, 'hidden' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_medias` - [string] by ref, 'medias' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_muted` - [string] by ref, 'muted' conditions in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_unpublished` - [string] by ref, 'unpublished' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_clause_cf` - [string] by ref, 'cf' condition in 'where' part of SQL query, can be overridden in hook processing
         *      - `where_subclause` - [string] or [array] by ref, 'where subclause' part of SQL query, string is attached to 'where' part, array is used to create query with UNIONs, can be overridden in hook processing
         * @hook @ref hook-bx_timeline-get_list_by_type
         */
        bx_alert($this->_oConfig->getName(), 'get_list_by_type', 0, 0, [
            'type' => $aParams['type'],
            'owner_id' => $aParams['owner_id'],
            'params' => $aAlertParams,
            'table' => isset($aParams['from_cache']) && $aParams['from_cache'] === true ? $this->_sTableSlice : $this->_sTable,
            'table_alias' => $sTableAlias,

            'join_clause' => &$mixedJoinClause,
            'join_subclause' => &$mixedJoinSubclause,
            'where_clause' => &$mixedWhereClause,
            'where_clause_status' => &$sWhereClauseStatus,
            'where_clause_filter' => &$sWhereClauseFilter,
            'where_clause_timeline' => &$sWhereClauseTimeline,
            'where_clause_modules' => &$sWhereClauseModules,
            'where_clause_hidden' => &$sWhereClauseHidden,
            'where_clause_medias' => &$sWhereClauseMedias,
            'where_clause_muted' => &$sWhereClauseMuted,
            'where_clause_unpublished' => &$sWhereClauseUnpublished,
            'where_clause_cf' => &$sWhereClauseCf,
            'where_subclause' => &$mixedWhereSubclause,

            'join_clause_ref' => &$mixedJoinClause,
            'join_subclause_ref' => &$mixedJoinSubclause,
            'where_clause_ref' => &$mixedWhereClause,
            'where_clause_status_ref' => &$sWhereClauseStatus,
            'where_clause_filter_ref' => &$sWhereClauseFilter,
            'where_clause_timeline_ref' => &$sWhereClauseTimeline,
            'where_clause_modules_ref' => &$sWhereClauseModules,
            'where_clause_hidden_ref' => &$sWhereClauseHidden,
            'where_clause_medias_ref' => &$sWhereClauseMedias,
            'where_clause_muted_ref' => &$sWhereClauseMuted,
            'where_clause_unpublished_ref' => &$sWhereClauseUnpublished,
            'where_clause_cf_ref' => &$sWhereClauseCf,
            'where_subclause_ref' => &$mixedWhereSubclause,
        ]);

        $mixedWhereClause .= $sWhereClauseStatus;
        $mixedWhereClause .= $sWhereClauseFilter;
        $mixedWhereClause .= $sWhereClauseTimeline;
        $mixedWhereClause .= $sWhereClauseModules;
        $mixedWhereClause .= $sWhereClauseHidden;
        $mixedWhereClause .= $sWhereClauseMedias;
        $mixedWhereClause .= $sWhereClauseMuted;
        $mixedWhereClause .= $sWhereClauseUnpublished;
        $mixedWhereClause .= $sWhereClauseCf;

        //--- Combine general Join with SubJoins.
        if(!empty($mixedJoinSubclause)) {
            if(is_array($mixedJoinSubclause)) {
                $aJoinClause = [];
                foreach($mixedJoinSubclause as $sKey => $sValue)
                    $aJoinClause[$sKey] = $mixedJoinClause . " " . $sValue . " ";
                $mixedJoinClause = $aJoinClause;
            }
            else
                $mixedJoinClause .= " " . $mixedJoinSubclause . " ";
        }

        //--- Combine general Where with SubWheres.
        if(!empty($mixedWhereSubclause)) {
            if(is_array($mixedWhereSubclause)) {
                $aWhereClause = [];
                foreach($mixedWhereSubclause as $sKey => $sValue)
                    $aWhereClause[$sKey] = $mixedWhereClause . "AND " . $sValue . " ";
                $mixedWhereClause = $aWhereClause;
            }
            else
                $mixedWhereClause .= "AND (" . $mixedWhereSubclause . ") ";
        }

        return [$mixedJoinClause, $mixedWhereClause];
    }

    protected function _isList($aParams)
    {
        return $this->_oConfig->isBrowseList($aParams) && (!isset($aParams['newest']) || $aParams['newest'] === false);
    }

    public function getMenuItemMaxOrder($sSetName)
    {
        return $this->getOne("SELECT IFNULL(MAX(`order`), 0) FROM `sys_menu_items` WHERE `set_name`=:set_name LIMIT 1", [
            'set_name' => $sSetName
        ]);
    }

    public function getMenuItemId($sSetName, $sName)
    {
        return (int)$this->getOne("SELECT `id` FROM `sys_menu_items` WHERE `set_name`=:set_name AND `name`=:name LIMIT 1", [
            'set_name' => $sSetName,
            'name' => $sName
        ]);
    }

    public function insertMenuItem($sSetName, $sModule, $sName, $sTitle, $iOrder)
    {
        return $this->query("INSERT INTO `sys_menu_items` SET " . $this->arrayToSQL([
            'set_name' => $sSetName, 
            'module' => $sModule, 
            'name' => $sName, 
            'title_system' => $sTitle,
            'title' => $sTitle,
            'link' => 'javascript:void(0)', 
            'onclick' => "javascript:{js_object_view}.changeFeed(this, '" . $sModule . "')", 
            'target' => '_self',
            'collapsed' => 1,
            'order' => $iOrder
        ]));
    }
    
    public function deleteMenuItem($sSetName, $sName)
    {
        return $this->query("DELETE FROM `sys_menu_items` WHERE `set_name`=:set_name AND `name`=:name LIMIT 1", [
            'set_name' => $sSetName,
            'name' => $sName
        ]);
    }
    
    
    /**
     * TEMPORARY: to find the source of Duplicates.
     */
    public function insertEvent($aParamsSet)
    {
        if(!empty($aParamsSet['date']) && $aParamsSet['date'] < (time() - 86400)) {
            $sTracks = '';
            $aTracks = debug_backtrace();
            foreach($aTracks as $aTrack)
                $sTracks .= "{$aTrack['file']} ({$aTrack['line']})\n";

            bx_log('bx_timeline_custom', $sTracks, BX_LOG_DEBUG);
        }
            
        return parent::insertEvent($aParamsSet);
    }
}

/** @} */
