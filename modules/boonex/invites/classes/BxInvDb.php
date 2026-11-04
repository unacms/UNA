<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Invites Invites
 * @ingroup     UnaModules
 *
 * @{
 */

class BxInvDb extends BxDolModuleDb
{
    protected $_oConfig;

    protected $_sTableInvites;
    protected $_sTableRequests;

    /*
     * Constructor.
     */
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);

        $this->_oConfig = $oConfig;
        $CNF = $oConfig->CNF;
        $this->_sTableInvites = $CNF['TABLE_INVITES'];
        $this->_sTableRequests = $CNF['TABLE_REQUESTS'];
    }

    public function getInvites($aParams, $bReturnCount = false)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        $sSelectClause = "`{$this->_sTableInvites}`.*";

        switch($aParams['type']) {
            case 'count_by_account':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'account_id' => $aParams['value']
                );

                $sSelectClause = "COUNT(`{$this->_sTableInvites}`.`id`) AS `count`";
                $sWhereClause = "AND `{$this->_sTableInvites}`.`account_id`=:account_id ";
                $sLimitClause = "LIMIT 1";
                break;
            case 'count_by_request':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'request_id' => $aParams['value']
                );

                $sSelectClause = "COUNT(`{$this->_sTableInvites}`.`id`) AS `count`";
                $sWhereClause = "AND `{$this->_sTableInvites}`.`request_id`=:request_id ";
                $sLimitClause = "LIMIT 1";
                break;
            case 'account_by_request':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'request_id' => $aParams['value']
                );

                $sSelectClause = "MAX(`{$this->_sTableInvites}`.`joined_account_id`)";
                $sWhereClause = "AND joined_account_id IS NOT NULL AND `{$this->_sTableInvites}`.`request_id`=:request_id ";
                $sLimitClause = "LIMIT 1";
                break;
            case 'profile_id_by_joined_account_id':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'joined_account_id' => $aParams['value']
                );

                $sSelectClause = "MAX(`{$this->_sTableInvites}`.`profile_id`)";
                $sWhereClause = "AND `{$this->_sTableInvites}`.`joined_account_id`=:joined_account_id ";
                $sLimitClause = "LIMIT 1";
                break;  
            case 'date_joined_by_request':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'request_id' => $aParams['value']
                );

                $sSelectClause = "MAX(`{$this->_sTableInvites}`.`date_joined`)";
                $sWhereClause = "AND joined_account_id IS NOT NULL AND `{$this->_sTableInvites}`.`request_id`=:request_id ";
                $sLimitClause = "LIMIT 1";
                break;
            case 'invites_code_by_single':
                $aMethod['name'] = 'getOne';
                $aMethod['params'][1] = array(
                    'keyvalue' => $aParams['value']
                );

                $sSelectClause = "GROUP_CONCAT(`{$this->_sTableInvites}`.`key` SEPARATOR ',')";
                $sWhereClause = "AND `{$this->_sTableInvites}`.`request_id` IN (SELECT `request_id` FROM `{$this->_sTableInvites}` WHERE `key`=:keyvalue ) ";
                $sLimitClause = "";
                break;

            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`id`=:id ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'by_key':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'key' => $aParams['key']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`key`=:key ";
                $sLimitClause = "LIMIT 1";
                break;
            
            case 'by_joined_account_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'account_id' => $aParams['account_id']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`joined_account_id`=:account_id ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'all':
                $aMethod['params'][1] = [
                    'request_id' => $aParams['value']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`request_id`=:request_id ";
                break;

            case 'all_by_profile_id':
                $aMethod['params'][1] = [
                    'profile_id' => $aParams['profile_id']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`profile_id`=:profile_id ";
                break;

            case 'all_by_joined_account_id':
                $aMethod['params'][1] = [
                    'account_id' => $aParams['account_id']
                ];

                $sWhereClause = "AND `{$this->_sTableInvites}`.`joined_account_id`=:account_id ";
                break;
        }

        $sSql = "SELECT {select} FROM `{$this->_sTableInvites}` " . $sJoinClause . " WHERE 1 " . $sWhereClause . " {order} {limit}";

        $aMethod['params'][0] = str_replace(array('{select}', '{order}', '{limit}'), array($sSelectClause, $sOrderClause, $sLimitClause), $sSql);
        $aEntries = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return $aEntries;

        $aMethod['name'] = 'getOne';
        $aMethod['params'][0] = str_replace(array('{select}', '{order}', '{limit}'), array("COUNT(*)", "", ""), $sSql);

        return array($aEntries, (int)call_user_func_array(array($this, $aMethod['name']), $aMethod['params']));
    }

    public function deleteInvites($aParams)
    {
        $sSql = "DELETE FROM `{$this->_sTableInvites}` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }
    
    public function deleteInvitesByAccount($aParams)
    {
        $sSql = "DELETE FROM `{$this->_sTableInvites}` WHERE " . $this->arrayToSQL($aParams, " AND ");
        return $this->query($sSql);
    }
    
    public function attachInviteToRequest($iReqestId, $iInviteId)
    {
        $aBindings = array(
            'request_id' => $iReqestId,
            'id' => $iInviteId
        );
        $this->query("UPDATE `{$this->_sTableInvites}` SET request_id=:request_id WHERE `id`=:id", $aBindings);
        $this->updateRequestStatusByRequestId(1, $iReqestId);
    }
     
    public function attachAccountIdToInvite($iAccountId, $sKey)
    {
        $this->query("UPDATE `{$this->_sTableInvites}` SET `joined_account_id`=:joined_account_id, `date_joined`=:date_joined WHERE `key`=:keyvalue", [
            'joined_account_id' => $iAccountId,
            'keyvalue' => $sKey,
            'date_joined' => time(),
        ]);

        $this->updateRequestStatusByInviteCode(3, $sKey);
    }

    public function updateDateSeenForInvite($sKey)
    {
        $this->query("UPDATE `{$this->_sTableInvites}` SET `date_seen`=:date_seen WHERE `key`=:keyvalue", [
            'date_seen' => time(),
            'keyvalue' => $sKey
        ]);

        $this->updateRequestStatusByInviteCode(2, $sKey);
    }

    public function insertInvite($aInvite)
    {
        return $this->query("INSERT INTO `{$this->_sTableInvites}` SET " . $this->arrayToSQL($aInvite)) !== false ? (int)$this->lastId() : false;
    }

    public function getRequests($aParams, $bReturnCount = false)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sWhereClause = $sJoinClause = $sOrderClause = $sLimitClause = "";
        $sSelectClause = "`{$this->_sTableRequests}`.* ";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                    'id' => $aParams['value']
                );

                $sWhereClause = "AND `{$this->_sTableRequests}`.`id`=:id ";
                $sLimitClause = "LIMIT 1";
                break;

            case 'count_all':
                $aMethod['name'] = 'getOne';
                $sSelectClause = "COUNT(`{$this->_sTableRequests}`.`id`) AS `count`";
                break;
            case 'count_by_email':
                $aMethod['name'] = 'getOne';
                $sSelectClause = "COUNT(`{$this->_sTableRequests}`.`id`) AS `count`";
                $aMethod['params'][1] = array(
                    'email' => $aParams['value']
                );
                $sWhereClause = "AND `{$this->_sTableRequests}`.`email`=:email ";
                break;
        }

        $sSql = "SELECT {select} FROM `{$this->_sTableRequests}` " . $sJoinClause . " WHERE 1 " . $sWhereClause . " {order} {limit}";
       
        $aMethod['params'][0] = str_replace(array('{select}', '{order}', '{limit}'), array($sSelectClause, $sOrderClause, $sLimitClause), $sSql);
        $aEntries = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return $aEntries;

        $aMethod['name'] = 'getOne';
        $aMethod['params'][0] = str_replace(array('{select}', '{order}', '{limit}'), array("COUNT(*)", "", ""), $sSql);

        return array($aEntries, (int)call_user_func_array(array($this, $aMethod['name']), $aMethod['params']));
    }
    
    public function getDataForCharts($iDateFrom, $iDateTo, $isInvited = false)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom,
            'dateto' => $iDateTo
        );
        $sQuery = "SELECT DATE(FROM_UNIXTIME(`date`)) AS `period`, YEAR(FROM_UNIXTIME(`date`)) AS `year`, COUNT(*) AS `count` FROM `" . $this->_sTableInvites . "` WHERE `date` >= :datefrom AND `date` <= :dateto " . $this->getAddSqlForCharts($isInvited) . " GROUP BY `period`, `year` ORDER BY `year`, `period` ASC";
        return $this->getAll($sQuery, $aBindings);
    }
    
    public function getInitValueForCharts($iDateFrom, $isInvited = false)
    {
        $aBindings = array(
            'datefrom' => $iDateFrom
        );
        $sQuery = "SELECT COUNT(*) AS `count` FROM " . $this->_sTableInvites . " WHERE `date` < :datefrom " . $this->getAddSqlForCharts($isInvited);
        return $this->getOne($sQuery, $aBindings);
    }
    
    private function getAddSqlForCharts($isInvited)
    {
        $sSqlAdd = "";
        if ($isInvited){
            $sSqlAdd = " AND `joined_account_id` IS NOT NULL ";
        }
        return $sSqlAdd;
    }
    
    private function updateRequestStatusByRequestId($iStatus, $iReqestId)
    {
        $aBindings = array(
            'request_id' => $iReqestId,
            'status' => $iStatus
        );
        $this->query("UPDATE `{$this->_sTableRequests}` SET `status`=:status WHERE `id`=:request_id AND `status` < :status", $aBindings);
    }
    
    private function updateRequestStatusByInviteCode($iStatus, $sKey)
    {
        $iReqestId = $this->getOne("SELECT request_id FROM `{$this->_sTableInvites}` WHERE `key`=:keyvalue", array('keyvalue' => $sKey));
        if ($iReqestId != "")
            $this->updateRequestStatusByRequestId($iStatus, $iReqestId);
    }
}

/** @} */
