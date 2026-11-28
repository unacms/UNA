<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reminders Reminders
 * @ingroup     UnaModules
 *
 * @{
 */

/*
 * Module database queries
 */
class BxRemindersDb extends BxBaseModGeneralDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }

    public function getProfiles($mixedProfileType)
    {
        if(!is_array($mixedProfileType))
            $mixedProfileType = array($mixedProfileType);

        return $this->getAll("SELECT `id`, `content_id` FROM `sys_profiles` WHERE `type` IN (" . $this->implode_escape($mixedProfileType) . ")");
    }

    public function getType($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

    	$sWhereClause = $sLimitClause = '';
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                $sWhereClause = " AND `id`=:id";
                $sLimitClause = " LIMIT 1";
                break;

            case 'all':
                $aMethod['params'][1] = array();

                if(isset($aParams['personal'])) {
                    $aMethod['params'][1]['personal'] = $aParams['personal'];

                    $sWhereClause .= " AND `personal`=:personal";
                }

                if(isset($aParams['active'])) {
                    $aMethod['params'][1]['active'] = $aParams['active'];

                    $sWhereClause .= " AND `active`=:active";
                }
                break;
        }

        $aMethod['params'][0] = "SELECT * FROM `" . $CNF['TABLE_TYPES'] . "` WHERE 1 " . $sWhereClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function getEntry($aParams)
    {
        $CNF = &$this->_oConfig->CNF;

    	$aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));

        $sSelectClause = "`te`.*";
    	$sJoinClause = $sWhereClause = $sLimitClause = "";
        switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['id']
                );

                if(isset($aParams['full']) && $aParams['full'] === true) {
                    $sSelectClause .= ", `tt`.`text` AS `text`, `tt`.`link` AS `link`";
                    $sJoinClause = "LEFT JOIN `" . $CNF['TABLE_TYPES'] . "` AS `tt` ON `te`.`type_id`=`tt`.`id`";
                }

                $sWhereClause = " AND `te`.`id`=:id";
                $sLimitClause = " LIMIT 1";
                break;

            case 'reminder':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'type_id' => $aParams['type_id'],
                    'rmd_pid' => $aParams['rmd_pid']
                );

                $sWhereClause = " AND `te`.`type_id`=:type_id AND `te`.`rmd_pid`=:rmd_pid";

                if(isset($aParams['cnt_pid'])) {
                    $aMethod['params'][1]['cnt_pid'] = (int)$aParams['cnt_pid'];

                    $sWhereClause .= " AND `te`.`cnt_pid`=:cnt_pid";
                }

                if(isset($aParams['expired'])) {
                    $aMethod['params'][1]['expired'] = (int)$aParams['expired'];

                    $sWhereClause .= " AND `te`.`expired`=:expired";
                }

                $sLimitClause = " LIMIT 1";
                break;

            case 'rmd_pid':
                $aMethod['params'][1] = array(
                    'rmd_pid' => $aParams['rmd_pid'],
                    'active' => isset($aParams['active']) ? (int)$aParams['active'] : 1
                );

                if(isset($aParams['full']) && $aParams['full'] === true) {
                    $sSelectClause .= ", `tt`.`text` AS `text`, `tt`.`link` AS `link`";
                    $sJoinClause = "LEFT JOIN `" . $CNF['TABLE_TYPES'] . "` AS `tt` ON `te`.`type_id`=`tt`.`id`";
                }

                $sWhereClause .= " AND `te`.`rmd_pid`=:rmd_pid AND `te`.`active`=:active";

                if(isset($aParams['visible'])) {
                    $aMethod['params'][1]['visible'] = (int)$aParams['visible'];

                    $sWhereClause .= " AND `te`.`visible`=:visible";
                }

                break;
        }

        $aMethod['params'][0] = "SELECT " . $sSelectClause . " FROM `" . $CNF['TABLE_ENTRIES'] . "` AS `te` " . $sJoinClause . " WHERE 1 " . $sWhereClause . $sLimitClause;
        return call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);
    }

    public function isEntrySystem($iTypeId, $iRmdPid)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntry = $this->getEntry(array('type' => 'reminder', 'type_id' => $iTypeId, 'rmd_pid' => $iRmdPid));
        if(empty($aEntry) || !is_array($aEntry))
            return false;

        $aEntry['notified'] = !empty($aEntry['notified']) ? unserialize($aEntry['notified']) : array();

        return (int)$aEntry['id'];
    }

    public function isEntryPersonal($iTypeId, $iRmdPid, $iCntPid, $iExpired)
    {
        $CNF = &$this->_oConfig->CNF;

        $aEntry = $this->getEntry(array('type' => 'reminder', 'type_id' => $iTypeId, 'rmd_pid' => $iRmdPid, 'cnt_pid' => $iCntPid, 'expired' => $iExpired));
        if(empty($aEntry) || !is_array($aEntry))
            return false;

        $aEntry['notified'] = !empty($aEntry['notified']) ? unserialize($aEntry['notified']) : array();

        return $aEntry;
    }

    public function insertEntry($aValues)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aValues) || !is_array($aValues))
            return false;

        return (int)$this->query("INSERT INTO `" . $CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL($aValues)) > 0 ? $this->lastId() : false;
    }

    public function updateEntry($aValues, $aWhere)
    {
        $CNF = &$this->_oConfig->CNF;

        if(empty($aValues) || !is_array($aValues) || empty($aWhere) || !is_array($aWhere))
            return false;

        return (int)$this->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET " . $this->arrayToSQL($aValues) . " WHERE " . $this->arrayToSQL($aWhere, ' AND ')) > 0;
    }

    public function deleteEntry($mixedId)
    {
        $CNF = &$this->_oConfig->CNF;

    	if(!is_array($mixedId))
            $mixedId = array($mixedId);

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `id` IN (" . $this->implode_escape($mixedId) . ")") > 0;
    }

    public function deleteEntryExpired($iDays)
    {
        $CNF = &$this->_oConfig->CNF;           

        $sWhereClause = "";
        if($iDays > 0)
            $sWhereClause = $this->prepareAsString("`expired` < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL ? DAY))", $iDays);
        else if($iDays == 0)
            $sWhereClause = $this->prepareAsString("`expired` < UNIX_TIMESTAMP()", $iDays);
        else
            return true;

        return (int)$this->query("DELETE FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE " . $sWhereClause) > 0;
    }
}

/** @} */
