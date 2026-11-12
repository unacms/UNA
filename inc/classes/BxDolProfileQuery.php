<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * All queries related to profiles
 */
class BxDolProfileQuery extends BxDolDb implements iBxDolSingleton
{
    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolProfileQuery();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Get all account profiles.
     * @param  string  $iAccountId account id
     * @return profile array
     */
    public function getProfilesByAccount ($iAccountId)
    {
        if (!$iAccountId)
            return array();

        $oAccountQuery = BxDolAccountQuery::getInstance();
        $aAccountInfo = $oAccountQuery->getInfoById($iAccountId);

        $sSql = $this->prepare("SELECT * FROM `sys_profiles` WHERE `account_id` = ? ORDER BY `id` = ? DESC", $iAccountId, $aAccountInfo['profile_id']);
        return $this->getAllWithKey($sSql, 'id');
    }

    /**
     * Get profile(s) by params
     * @param  array   $aParams browse params
     * @return array with profile(s)
     */
    public function getProfiles($aParams)
    {
        $aMethod = ['name' => 'getAll', 'params' => [0 => 'query']];

    	$sFieldsClause = "`tp`.*"; 
    	$sJoinClause = $sWhereClause = $sGroupClause = "";
        $sOrderClause = "`tp`.`id` ASC";

    	switch($aParams['type']) {
            case 'id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = [
                    'id' => $aParams['id']
                ];

                $sWhereClause = " AND `tp`.`id`=:id";
                break;

            case 'active':
                $sWhereClause = " AND `tp`.`status`='active'";

                if(isset($aParams['types'])) {
                    if(!is_array($aParams['types']))
                        $aParams['types'] = [$aParams['types']];

                    $sWhereClause .= " AND `tp`.`type` IN (" . $this->implode_escape($aParams['types']) . ")";
                }
                break;
                
            case 'id_by_module_content_id':
                $sFieldsClause = "`tp`.`id`";
                $sWhereClause = $this->prepareAsString(" AND `tp`.`type`=?", $aParams['module']);
                
                if(!is_array($aParams['content_id'])) {
                    $aMethod['name'] = 'getOne';
                    $sWhereClause .= $this->prepareAsString(" AND `tp`.`content_id`=?", $aParams['content_id']);
                }
                else {
                    $aMethod['name'] = 'getColumn';
                    $sWhereClause .= " AND `tp`.`content_id` IN (" . $this->implode_escape($aParams['content_id']) . ")";
                }
                break;

            case 'id_to_type':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'type';
                $sWhereClause = " AND `tp`.`id` IN (" . $this->implode_escape($aParams['ids']) . ")";
                break;

            case 'all':
                break;
    	}

    	$sGroupClause = $sGroupClause ? "GROUP BY " . $sGroupClause : "";
        $sOrderClause = $sOrderClause ? "ORDER BY " . $sOrderClause : "";

        $aMethod['params'][0] = "SELECT
            " . $sFieldsClause . "
            FROM `sys_profiles` AS `tp`" . $sJoinClause . "
            WHERE 1" . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause;

        return call_user_func_array([$this, $aMethod['name']], $aMethod['params']);
    }

    /**
     * Get profile by content id, type and account.
     * @param  string $iAccountId account id
     * @return array  if aprofile ids, key is profile id
     */
    public function getProfileByContentTypeAccount ($iContentId, $sType, $iAccountId)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_profiles` WHERE `account_id` = ? AND `type` = ? AND `content_id` = ?", $iAccountId, $sType, $iContentId);
        return $this->getRow($sSql);
    }

    /**
     * Get profile by content id and type.
     * @param  string $iAccountId account id
     * @return array  if aprofile ids, key is profile id
     */
    public function getProfileByContentAndType ($iContentId, $sType, $bClearCache = false)
    {
        if (!$iContentId)
            return false;

        $sKey = 'BxDolProfileQuery::getProfileByContentAndType' . $iContentId . $sType;
        if ($bClearCache)
            $this->cleanMemory($sKey);

        $sSql = $this->prepare("SELECT * FROM `sys_profiles` WHERE `content_id` = ? AND `type` = ?", $iContentId, $sType);        
        $mixedResult = $this->fromMemory($sKey, 'getRow', $sSql);
        if (!$mixedResult)
            $this->cleanMemory($sKey);
        return $mixedResult;
    }

    public function getConnectedProfilesByType ($aSqlParts, $sType, $iStart, $iLimit)
    {
        if(empty($aSqlParts['join']))
            return array();

        $aBindings = array();

        $sSelectClause = '';
        if(!empty($aSqlParts['fields']))
            foreach($aSqlParts['fields'] as $sName => $sField)
                $sSelectClause .= ', ' . $sField;

        $sWhereClause = '';
        if(!empty($sType)) {
            $sWhereClause = ' AND `sys_profiles`.`type`=:type';

            $aBindings['type'] = $sType;
        }

        $sOrderClause = '';
        if(!empty($aSqlParts['fields']['added']))
            $sOrderClause = ' ORDER BY ' . $aSqlParts['fields']['added'] . ' DESC';

        $sLimitClause = '';
        if(!empty($iLimit))
            $sLimitClause = $this->prepareAsString(' LIMIT ?, ?', $iStart, $iLimit);

        return $this->getAllWithKey("SELECT `sys_profiles`.*" . $sSelectClause . " FROM `sys_profiles` " . $aSqlParts['join'] . " WHERE 1" . $sWhereClause . $sOrderClause . $sLimitClause, 'id', $aBindings);
    }

    /**
     * Insert account and content id association. Also if currect profile id is not defined - it updates current profile id in account.
     * @param $iAccountId account id
     * @param $iContentId content id
     * @param $sStatus profile status
     * @param $sType profile content type
     * @return inserted profile's id
     */
    public function insertProfile ($iAccountId, $iContentId, $sStatus, $sType = 'system')
    {
        $sSql = $this->prepare("INSERT INTO `sys_profiles` SET `account_id` = ?, `type` = ?, `content_id` = ?, `status` = ?", $iAccountId, $sType, $iContentId, $sStatus);
        if (!$this->query($sSql))
            return false;
        $iProfileId = $this->lastId();
        $this->getCurrentProfileByAccount($iAccountId); // it updates current profile id automatically if it is not defined
        return $iProfileId;
    }

    /**
     * Update profile's account id
     * @param $iProfileId profile id
     * @param $iAccountId new Account ID
     * @return true on success or false otherwise
     */
    public function changeAccountId ($iProfileId, $iAccountId)
    {
        $aInfoOld = $this->getInfoById($iProfileId);
        $bRet = $this->_updateField ($iProfileId, 'account_id', $iAccountId);
        if ($bRet && $aInfoOld) {
            // invalidate profile switcher cache for old and new account
            bx_content_cache_del("profile_switcher_" . $aInfoOld['account_id'] . "_0");
            bx_content_cache_del("profile_switcher_" . $aInfoOld['account_id'] . "_1");
            bx_content_cache_del("profile_switcher_" . $iAccountId . "_0");
            bx_content_cache_del("profile_switcher_" . $iAccountId . "_1");
        }
        return $bRet;
    }

    /**
     * Update profile's status
     * @param $iProfileId profile id
     * @param $sStatus profile status
     * @return true on success or false otherwise
     */
    public function changeStatus ($iProfileId, $sStatus)
    {
        return $this->_updateField ($iProfileId, 'status', $sStatus);
    }

    /**
     * Update profile's content filter value (watch)
     * @param $iProfileId profile id
     * @param $iValue bitmask of selected items 
     * @return true on success or false otherwise
     */
    public function changeCfwValue ($iProfileId, $iValue)
    {
        return $this->_updateField ($iProfileId, 'cfw_value', $iValue);
    }

    /**
     * Update profile's content filter items (watch)
     * @param $iProfileId profile id
     * @param $iValue bitmask of available items 
     * @return true on success or false otherwise
     */
    public function changeCfwItems ($iProfileId, $iValue)
    {
        return $this->_updateField ($iProfileId, 'cfw_items', $iValue);
    }

    /**
     * Update profile's content filter items (use)
     * @param $iProfileId profile id
     * @param $iValue bitmask of available items 
     * @return true on success or false otherwise
     */
    public function changeCfuItems ($iProfileId, $iValue)
    {
        return $this->_updateField ($iProfileId, 'cfu_items', $iValue);
    }

    /**
     * Get current account profile.
     * @param  string  $iAccountId account id
     * @return current account's profile id
     */
    public function getCurrentProfileByAccount ($iAccountId, $bClearCache = false)
    {
        if (!$iAccountId)
            return false;

        $sKey = 'BxDolProfileQuery::getCurrentProfileByAccount' . $iAccountId;
        if ($bClearCache)
            $this->cleanMemory($sKey);

        $sSql = $this->prepare("SELECT `profile_id` FROM `sys_accounts` AS `a` INNER JOIN `sys_profiles` AS `p` ON (`a`.`profile_id` = `p`.`id`) WHERE `a`.`id` = ? LIMIT 1", $iAccountId);        
        $iProfileId = $this->fromMemory($sKey, 'getOne', $sSql);
        if (!$iProfileId) {
            $this->cleanMemory($sKey);
            $sSql = $this->prepare("SELECT `id` FROM `sys_profiles` WHERE `account_id` = ? ORDER BY FIELD(`type`, 'system', 'bx_organizations', 'bx_persons') DESC LIMIT 1", $iAccountId);
            $iProfileId = $this->getOne($sSql);
            if (!$iProfileId)
                return false;

            if (!BxDolAccountQuery::getInstance()->updateCurrentProfile($iAccountId, $iProfileId))
                return false;
        }
        return $iProfileId;
    }

    /**
     * Get profile by specified field name and value.
     * It is for internal usage only.
     * Use other funtions to get profile info, like getInfoById, etc.
     * @param  string $sField database field name
     * @param  mixed  $sValue database field value
     * @return array  with porfile info
     */
    protected function _getDataByField ($sField, $sValue)
    {
        $sSql = $this->prepare("SELECT * FROM `sys_profiles` WHERE `$sField` = ? LIMIT 1", $sValue);
        return $this->fromMemory('sys_profiles_' . $sField . '_' . $sValue, 'getRow', $sSql);
    }

    /**
     * The rows of these profiles read in one query and kept in memory where getInfoById,
     * getIdById and getProfileByContentAndType keep each one, for a page of many profiles.
     */
    public function primeInfos($aIds)
    {
        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aIds), function ($i) { return $i > 0 && !array_key_exists('sys_profiles_id_' . $i, self::$_aDbCacheData); })));
        if (!$aIds)
            return;

        foreach ($this->getAll("SELECT * FROM `sys_profiles` WHERE `id` IN (" . $this->implode_escape($aIds) . ")") as $aRow) {
            self::$_aDbCacheData['sys_profiles_id_' . (int)$aRow['id']] = $aRow;
            self::$_aDbCacheData['BxDolProfileQuery::getIdById' . (int)$aRow['id']] = $aRow['id'];
            self::$_aDbCacheData['BxDolProfileQuery::getProfileByContentAndType' . $aRow['content_id'] . $aRow['type']] = $aRow;
        }
    }

    /**
     * The profile ids of a module's entries (content id => profile id), their rows read in one
     * query and kept in memory as primeInfos keeps them, for a page of many profiles.
     */
    public function primeByContentAndType($aContentIds, $sType)
    {
        $aContentIds = array_values(array_unique(array_filter(array_map('intval', (array)$aContentIds), function ($i) { return $i > 0; })));
        if (!$aContentIds)
            return [];

        $aResult = [];
        $aRows = $this->getAll("SELECT * FROM `sys_profiles` WHERE `type` = :type AND `content_id` IN (" . $this->implode_escape($aContentIds) . ")", ['type' => $sType]);
        foreach ($aRows as $aRow) {
            self::$_aDbCacheData['sys_profiles_id_' . (int)$aRow['id']] = $aRow;
            self::$_aDbCacheData['BxDolProfileQuery::getIdById' . (int)$aRow['id']] = $aRow['id'];
            self::$_aDbCacheData['BxDolProfileQuery::getProfileByContentAndType' . $aRow['content_id'] . $aRow['type']] = $aRow;
            $aResult[(int)$aRow['content_id']] = (int)$aRow['id'];
        }
        return $aResult;
    }

    /**
     * get profile id by id
     */
    public function getIdById($iId, $bClearCache = false)
    {
        if (!$iId)
            return false;

        $sKey = 'BxDolProfileQuery::getIdById' . $iId;
        if ($bClearCache)
            $this->cleanMemory($sKey);
        
        $sSql = $this->prepare("SELECT `id` FROM `sys_profiles` WHERE `id` = ? LIMIT 1", $iId);
        $mixedResult = $this->fromMemory($sKey, 'getOne', $sSql);
        if (!$mixedResult)
            $this->cleanMemory($sKey);
        return $mixedResult;
    }

    /**
     * get account info by profile id
     */
    public function getAccountInfoByProfileId($iId)
    {
        $sSql = $this->prepare("SELECT `a`.* FROM `sys_accounts` AS `a` INNER JOIN `sys_profiles` AS `p` ON (`p`.`account_id` = `a`.`id`) WHERE `p`.`id` = ? LIMIT 1", $iId);
        return $this->getRow($sSql);
    }

    /**
     * get account email by profile id
     */
    public function getEmailById($iId)
    {
        $a = $this->getAccountInfoByProfileId($iId);
        if (!$a || empty($a['email']))
            return false;
        return $a['email'];
    }

    /**
     * Get profile info by id
     * @param  int   $iID profile id
     * @return array with profile info
     */
    public function getInfoById( $iID )
    {
        return $this->_getDataByField('id', (int)$iID);
    }

	/**
     * Is profile online by id
     * @param  int $iId profile id
     * @return profile online status
     */
    public function isOnline($iId)
    {
        $sSql = $this->prepare("SELECT 
        		`tp`.`id` 
        	FROM `sys_profiles` AS `tp` 
        	INNER JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` 
        	INNER JOIN `sys_sessions` AS `ts` ON `tp`.`account_id`=`ts`.`user_id` 
        	WHERE 
        		`tp`.`id` = ? AND 
        		`ta`.`profile_id`=`tp`.`id` AND 
        		`ts`.`date` > (UNIX_TIMESTAMP() - 60 * ?) 
        	LIMIT 1", $iId, (int)getParam('sys_account_online_time'));
        return (int)$this->getOne($sSql) > 0;
    }
    
    /**
     * Get online profiles count 
     * @return online profiles count 
     */
    public function getOnlineCount()
    {
        $sSql = $this->prepare("SELECT 
        		COUNT(`tp`.`id`) 
        	FROM `sys_profiles` AS `tp` 
        	INNER JOIN `sys_accounts` AS `ta` ON `tp`.`account_id`=`ta`.`id` 
        	INNER JOIN `sys_sessions` AS `ts` ON `tp`.`account_id`=`ts`.`user_id` 
        	WHERE 
        		`ta`.`profile_id`=`tp`.`id` AND 
        		`ts`.`date` > (UNIX_TIMESTAMP() - 60 * ?)", (int)getParam('sys_account_online_time'));
        return (int)$this->getOne($sSql);
    }

    public function getProfileQuota($iProfileId)
    {
        $a = ['current_size' => 0, 'current_number' => 0, 'quota_size' => 0, 'quota_number' => 0, 'max_file_size' => 0];

        if ($iProfileId) {
            $sQuery = $this->prepare("SELECT `current_size`, `current_number`, 0 as `quota_size`, 0 as `quota_number`, 0 as `max_file_size` FROM `sys_storage_user_quotas` WHERE `profile_id` = ?", $iProfileId);
            $a = $this->getRow($sQuery);
            if (!is_array($a) || !$a)
                $a = ['current_size' => 0, 'current_number' => 0, 'quota_size' => 0, 'quota_number' => 0, 'max_file_size' => 0];
        }

        // get quota_number and quota_size from user's acl/membership
        $aMembershipInfo = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);
        if ($aMembershipInfo) {
            if (isset($aMembershipInfo['quota_size']))
                $a['quota_size'] = $aMembershipInfo['quota_size'];
            if (isset($aMembershipInfo['quota_number']))
                $a['quota_number'] = $aMembershipInfo['quota_number'];
            if (isset($aMembershipInfo['quota_max_file_size']))
                $a['max_file_size'] = $aMembershipInfo['quota_max_file_size'];
        }

        return $a;
    }

    public function updateProfileQuota($iProfileId, $iSize, $iNumber = 1)
    {
        if (!$iProfileId) // for guests and storages without owner don't update per-user quota
            return true;

        $iTime = time();
        $sQuery = $this->prepare("
            INSERT INTO `sys_storage_user_quotas`
            SET `profile_id` = ?, `current_size` = `current_size` + ?, `current_number` = `current_number` + ?, `ts` = ?
            ON DUPLICATE KEY UPDATE `current_size` = `current_size` + ?, `current_number` = `current_number` + ?, `ts` = ?",
            $iProfileId, $iSize, $iNumber, $iTime, $iSize, $iNumber, $iTime
        );
        if ($this->query($sQuery))
            return true;
        else
            return false;
    }

    /**
     * Get profile field by specified field name and value.
     * In most cases it is for internal usage only.
     * Use other funtions to get profile info, like getIdByEmail, etc.
     * @param  string    $sFieldRequested database field name to return
     * @param  string    $sFieldSearch    database field name to search for
     * @param  mixed     $sValue          database field value
     * @return specified profile field value
     */
    protected function _getFieldByField ($sFieldRequested, $sFieldSearch, $sValue)
    {
        $sSql = $this->prepare("SELECT `$sFieldRequested` FROM `sys_profiles` WHERE `$sFieldSearch` = ? LIMIT 1", $sValue);
        return $this->getOne($sSql);
    }

    /**
     * Update some field by profile id
     * In most cases it is for internal usage only.
     * Use other funtions to get profile info, like updateLogged, etc.
     * @param  string    $sFieldRequested database field name to return
     * @param  string    $sFieldSearch    database field name to search for
     * @param  mixed     $sValue          database field value
     * @return specified profile field value
     */
    protected function _updateField ($iId, $sFieldForUpdate, $sValue)
    {
        $sSql = $this->prepare("UPDATE `sys_profiles` SET `$sFieldForUpdate` = ? WHERE `id` = ? LIMIT 1", $sValue, $iId);
        return $this->query($sSql);
    }

    /**
     * Delete profile info by id
     * @param  int      $iID profile id
     * @return affected rows
     */
    public function delete($iID)
    {
        $aInfo = $this->getInfoById($iID);
        $sSql = $this->prepare("DELETE FROM `sys_profiles` WHERE `id` = ? LIMIT 1", $iID);
        if ($res = $this->query($sSql)) {
            $this->getProfileByContentAndType($aInfo['content_id'], $aInfo['type'], true);
            $this->getCurrentProfileByAccount($aInfo['account_id'], true);
            $this->getIdById($iID, true);
        }
        return $res;
    }

    /**
     * Reset deleted profile ids and assign system profile ids.
     * Should be called after profiles module deletion.
     * It can be called automatically if 
     * @code
     * 'process_deleted_profiles' => 1 
     * @endcode
     * is specified in module config.php file in 'uninstall' section.
     */
    public function processDeletedProfiles ()
    {
        $bResult = true;

        // reset deleted profiles
        $bResult &= $this->query("UPDATE `sys_accounts` AS `a` LEFT OUTER JOIN `sys_profiles` AS `p` ON `a`.`profile_id`=`p`.`id` SET `a`.`profile_id`='0' WHERE `p`.`id` IS NULL") !== false;

        // try to assign another non-system profile to reset accounts
        $bResult &= $this->query("UPDATE `sys_accounts` AS `a` INNER JOIN `sys_profiles` AS `p` ON `a`.`id`=`p`.`account_id` AND `p`.`type`<>'system' AND `a`.`profile_id`='0' SET `a`.`profile_id`=`p`.`id`") !== false;

        // assign system profile to reset accounts
        $bResult &= $this->query("UPDATE `sys_accounts` AS `a` INNER JOIN `sys_profiles` AS `p` ON `a`.`id`=`p`.`account_id` AND `p`.`type`='system' AND `a`.`profile_id`='0' SET `a`.`profile_id`=`p`.`id`") !== false;

        return $bResult;
    }
    
    public function updateProfileTrack($iProfileId, $sAction)
    {
        return $this->query("INSERT INTO `sys_profiles_track` SET `profile_id`=:profile_id, `action`=:action, `date`=:now ON DUPLICATE KEY UPDATE `date`=:now", [
            'profile_id' => $iProfileId,
            'action' => $sAction,
            'now' => time()
        ]);
    }

    public function getProfileTrack($iProfileId, $sAction)
    {
        return (int)$this->getOne("SELECT `date` FROM `sys_profiles_track` WHERE `profile_id`=:profile_id AND `action`=:action LIMIT 1", [
            'profile_id' => $iProfileId,
            'action' => $sAction
        ]);
    }
}

/** @} */
