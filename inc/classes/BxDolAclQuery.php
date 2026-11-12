<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for ACL
 * @see BxDolAcl
 */
class BxDolAclQuery extends BxDolDb implements iBxDolSingleton
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
    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolAclQuery();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    function getLevels($aParams, &$aItems, $bReturnCount = true)
    {
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
           $sOrderClause = "ORDER BY `tal`.`Order` ASC";

        switch($aParams['type']) {
            case 'by_id':
                $aMethod['name'] = 'getRow';
                $aMethod['params'][1] = array(
                	'id' => $aParams['value']
                );

                $sWhereClause .= "AND `tal`.`ID`=:id";
                $sLimitClause .= "LIMIT 1";
                break;

            case 'all_active':
                $sWhereClause .= "AND `tal`.`Active`='yes'";
                break;

            case 'all_active_purchasble_pair':
                $aMethod['name'] = "getPairs";
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'name';
                $sWhereClause .= "AND `tal`.`Active`='yes' AND `tal`.`Purchasable`='yes'";
                break;

            case 'all_active_pair':
                $aMethod['name'] = "getPairs";
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'name';
                $sWhereClause .= "AND `tal`.`Active`='yes'";
                break;

            case 'all_active_not_automatic_pair':
                $aMethod['name'] = "getPairs";
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'name';
                $sWhereClause .= "AND `tal`.`Active`='yes' AND `tal`.`ID` NOT IN (" . $this->implode_escape(array(
                    MEMBERSHIP_ID_NON_MEMBER,
                    MEMBERSHIP_ID_ACCOUNT,
                    MEMBERSHIP_ID_UNCONFIRMED,
                    MEMBERSHIP_ID_PENDING,
                    MEMBERSHIP_ID_SUSPENDED
                    
                )) . ")";

                if(($sAvailableTo = $aParams['available_to'] ?? false))
                    $sWhereClause .= " AND `tal`.`UnavailableTo` NOT LIKE " . $this->escape('%|' . $aParams['available_to'] . '|%');
                break;

            case 'all_pair':
                $aMethod['name'] = "getPairs";
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = 'name';
                break;

            case 'all_order_id':
                $sOrderClause = "ORDER BY `tal`.`ID` ASC";
                break;
                
            case 'password_can_expired':
                $sWhereClause .= "AND `tal`.`PasswordExpired` <> 0";
                break;
            
            case 'password_expired_notify':
                $sWhereClause .= "AND `tal`.`PasswordExpired` <> 0 AND `tal`.`PasswordExpiredNotify` <> 0";
                break;

            case 'all':
                break;
        }

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `tal`.`ID` AS `id`,
                `tal`.`Name` AS `name`,
                `tal`.`Icon` AS `icon`,
                `tal`.`Description` AS `description`,
                `tal`.`Active` AS `active`,
                `tal`.`Purchasable` AS `purchasable`,
                `tal`.`Removable` AS `removable`,
                `tal`.`UnavailableTo` AS `unavailable_to`,
                `tal`.`QuotaSize` AS `quota_size`,
                `tal`.`QuotaNumber` AS `quota_number`,
                `tal`.`QuotaMaxFileSize` AS `quota_max_file_size`,
                `tal`.`PasswordExpired` AS `password_expired`,
                `tal`.`PasswordExpiredNotify` AS `password_expired_notify`,
                `tal`.`Order` AS `order`" . $sSelectClause . "
            FROM `sys_acl_levels` AS `tal` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sOrderClause . " " . $sLimitClause;
        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    function getActions($aParams, &$aItems, $bReturnCount = true)
    {
        $sMemoryKey = '';
        $aMethod = array('name' => 'getAll', 'params' => array(0 => 'query'));
        $sSelectClause = $sJoinClause = $sWhereClause = $sGroupClause = $sOrderClause = $sLimitClause = "";

        if(!isset($aParams['order']) || empty($aParams['order']))
            $sOrderClause = "`taa`.`Title` ASC";

        switch($aParams['type']) {
            case 'by_names_and_module':
                $aMethod['params'][1] = array(
                    'module' => $aParams['module']
                );

                $sWhereClause .= $this->_actionsByNamesWhere($aParams['value']);
                $sMemoryKey = $this->_actionsByNamesKey($aParams['module'], $aParams['value']);
                // API v2 only: the other actions are asked for too (each check of a page asks for
                // one), so they are all read at once; the site and API v1 read each as it is asked for
                if(bx_is_api_v2() && is_string($aParams['value']) && !array_key_exists($sMemoryKey, self::$_aDbCacheData))
                    $this->_primeActions();
                break;

            case 'by_names':
                $sWhereClause .= " AND `taa`.`Name` IN(" . $this->implode_escape($aParams['value']) . ")";
                break;

            case 'by_level_id':
                $aMethod['params'][1] = [
                    'level_id' => $aParams['value'],
                    'level_code' => pow(2, ($aParams['value'] - 1))
                ];

                $sSelectClause .= ", `tam`.`AllowedCount` AS `allowed_count`, `tam`.`AllowedPeriodLen` AS `allowed_period_len`, `tam`.`AllowedPeriodStart` AS `allowed_period_start`, `tam`.`AllowedPeriodEnd` AS `allowed_period_end`, `tam`.`AdditionalParamValue` AS `additional_param_value` ";
                $sJoinClause .= "LEFT JOIN `sys_acl_matrix` AS `tam` ON `taa`.`ID`=`tam`.`IDAction` ";
                $sWhereClause .= "AND `tam`.`IDLevel`=:level_id AND (`taa`.`DisabledForLevels`='0' OR `taa`.`DisabledForLevels`&:level_code=0)";

                if(isset($aParams['start'], $aParams['limit']))
                    $sLimitClause = $this->prepareAsString("?, ?", $aParams['start'], $aParams['limit']);
                break;

            case 'by_level_id_key_id':
                $aMethod['name'] = 'getAllWithKey';
                $aMethod['params'][1] = 'id';
                $aMethod['params'][2] = array(
                    'level_id' => $aParams['value']
                );

                $sSelectClause .= ", `tam`.`AllowedCount` AS `allowed_count`, `tam`.`AllowedPeriodLen` AS `allowed_period_len` ";
                $sJoinClause .= "LEFT JOIN `sys_acl_matrix` AS `tam` ON `taa`.`ID`=`tam`.`IDAction` ";
                $sWhereClause .= "AND `tam`.`IDLevel`=:level_id";
                break;

            case 'counter_by_modules':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'module';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", COUNT(*) AS `counter`";
                $sGroupClause = "GROUP BY `taa`.`Module`";
                break;

            case 'counter_by_levels':
                $aMethod['name'] = 'getPairs';
                $aMethod['params'][1] = 'level_id';
                $aMethod['params'][2] = 'counter';
                $sSelectClause = ", `tam`.`IDLevel` AS `level_id`, COUNT(`tam`.`IDAction`) AS `counter`";
                $sJoinClause = "LEFT JOIN `sys_acl_matrix` AS `tam` ON `taa`.`ID`=`tam`.`IDAction` AND (`taa`.`DisabledForLevels`='0' OR `taa`.`DisabledForLevels`&POW(2, `tam`.`IDLevel`-1)=0) ";
                $sGroupClause = "GROUP BY `tam`.`IDLevel`";
                break;
        }

        if($sOrderClause)
            $sOrderClause = "ORDER BY " . $sOrderClause;

        if($sLimitClause)
            $sLimitClause = "LIMIT " . $sLimitClause;

        $aMethod['params'][0] = "SELECT " . ($bReturnCount ? "SQL_CALC_FOUND_ROWS" : "") . "
                `taa`.`ID` AS `id`,
                `taa`.`Module` AS `module`,
                `taa`.`Name` AS `name`,
                `taa`.`Title` AS `title`,
                `taa`.`Countable` AS `countable`,
                `taa`.`DisabledForLevels` AS `disabled_for_levels`" . $sSelectClause . "
            FROM `sys_acl_actions` AS `taa` " . $sJoinClause . "
            WHERE 1 " . $sWhereClause . " " . $sGroupClause . " " . $sOrderClause . " " . $sLimitClause;

        if ($sMemoryKey) {
            array_unshift($aMethod['params'], $sMemoryKey, $aMethod['name']);
            $aItems = call_user_func_array(array($this, 'fromMemory'), $aMethod['params']);
            return $bReturnCount ? count($aItems) : !empty($aItems);
        }

        $aItems = call_user_func_array(array($this, $aMethod['name']), $aMethod['params']);

        if(!$bReturnCount)
            return !empty($aItems);

        return (int)$this->getOne("SELECT FOUND_ROWS()");
    }

    /**
     * Fetch the last purchased/assigned membership that is still active for the given profile.
     *
     * NOTE. Don't use cache here, because it's causing an error, if a number of memberrship levels are purchased at the same time.
     * fromMemory returns the same DateExpires because setMembership (old buyMembership) function is called in cycle in the same session.
     */
    function getLevelCurrent($iProfileId, $iTime = 0)
    {
        $iTime = $iTime == 0 ? time() : (int)$iTime;

        $sSql = $this->prepare("
            SELECT  `sys_acl_levels_members`.`IDLevel` as `id`,
                    `sys_acl_levels`.`Name` AS `name`,
                    `sys_acl_levels`.`QuotaSize` AS `quota_size`,
                    `sys_acl_levels`.`QuotaNumber` AS `quota_number`,
                    `sys_acl_levels`.`QuotaMaxFileSize` AS `quota_max_file_size`,
                    `sys_acl_levels`.`PasswordExpired` AS `password_expired`,
                    UNIX_TIMESTAMP(`sys_acl_levels_members`.`DateStarts`) as `date_starts`,
                    UNIX_TIMESTAMP(`sys_acl_levels_members`.`DateExpires`) as `date_expires`,
                    `sys_acl_levels_members`.`State` AS `state`,
                    `sys_acl_levels_members`.`TransactionID` AS `transaction_id`,
                    `sys_profiles`.`status`
            FROM `sys_acl_levels_members`
            RIGHT JOIN `sys_profiles` ON `sys_acl_levels_members`.IDMember = `sys_profiles`.`id`
                AND (`sys_acl_levels_members`.DateStarts IS NULL OR `sys_acl_levels_members`.DateStarts <= FROM_UNIXTIME(?))
                AND (`sys_acl_levels_members`.DateExpires IS NULL OR `sys_acl_levels_members`.DateExpires > FROM_UNIXTIME(?))
            LEFT JOIN `sys_acl_levels` ON `sys_acl_levels_members`.IDLevel = `sys_acl_levels`.ID
            WHERE `sys_profiles`.`id` = ?
            ORDER BY `sys_acl_levels_members`.DateStarts DESC
            LIMIT 1", $iTime, $iTime, $iProfileId);

        return $this->fromMemory('BxDolAclQuery::getLevelCurrent' . $iProfileId . $iTime, 'getRow', $sSql);
    }

    function getLevelByIdCached($iLevel)
    {
        $sQuery = $this->prepare("SELECT
                `tal`.`ID` AS `id`,
                `tal`.`Name` AS `name`,
                `tal`.`QuotaSize` AS `quota_size`,
                `tal`.`QuotaNumber` AS `quota_number`,
                `tal`.`QuotaMaxFileSize` AS `quota_max_file_size`,
                `tal`.`PasswordExpired` AS `password_expired`
            FROM `sys_acl_levels` AS `tal`
            WHERE `tal`.`ID`=?
            LIMIT 1", $iLevel);
        return $this->fromCache('sys_acl_levels' . $iLevel, 'getRow', $sQuery);
    }

    /**
     * The where clause and the memory key of getActions by_names_and_module.
     */
    protected function _actionsByNamesWhere($mixedNames)
    {
        return " AND `taa`.`Name` IN(" . $this->implode_escape($mixedNames) . ") AND `taa`.`Module` = :module ";
    }

    protected function _actionsByNamesKey($sModule, $mixedNames)
    {
        return 'BxDolAclQuery::getActionsby_names_and_module' . $sModule . $this->_actionsByNamesWhere($mixedNames);
    }

    /**
     * Each action as getActions by_names_and_module of its name and module reads it, all in one
     * query kept in memory where getActions keeps it: an action's id is looked up by its name
     * once for every check, and a page checks many actions of many modules (the table is small).
     */
    protected function _primeActions()
    {
        $sPrimed = 'BxDolAclQuery::actionsByNamePrimed';
        if(array_key_exists($sPrimed, self::$_aDbCacheData))
            return;
        self::$_aDbCacheData[$sPrimed] = true;

        $aByName = [];
        foreach($this->getAll("SELECT
                `taa`.`ID` AS `id`,
                `taa`.`Module` AS `module`,
                `taa`.`Name` AS `name`,
                `taa`.`Title` AS `title`,
                `taa`.`Countable` AS `countable`,
                `taa`.`DisabledForLevels` AS `disabled_for_levels`
            FROM `sys_acl_actions` AS `taa`
            ORDER BY `taa`.`Title` ASC") as $aRow)
            $aByName[$aRow['module']][$aRow['name']][] = $aRow;

        foreach($aByName as $sActionsModule => $aNames)
            foreach($aNames as $sName => $aRows) {
                $sKey = $this->_actionsByNamesKey((string)$sActionsModule, (string)$sName);
                if(!array_key_exists($sKey, self::$_aDbCacheData))
                    self::$_aDbCacheData[$sKey] = $aRows;
            }
    }

    /**
     * The rights of a level for every action, in one query, kept in memory where getAction
     * keeps each one: a page checks many actions of many modules (the tables are small).
     */
    protected function _primeActionsForLevel($iMembershipId)
    {
        $sPrimed = 'BxDolAclQuery::actionsForLevelPrimed' . (int)$iMembershipId;
        if(array_key_exists($sPrimed, self::$_aDbCacheData))
            return;
        self::$_aDbCacheData[$sPrimed] = true;

        $aRows = $this->getAll("SELECT
                `taa`.`ID` AS `action_id`,
                `tam`.`IDAction` AS `id`,
                `taa`.`Name` AS `name`,
                `taa`.`Title` AS `title`,
                `tam`.`AllowedCount` AS `allowed_count`,
                `tam`.`AllowedPeriodLen` AS `allowed_period_len`,
                UNIX_TIMESTAMP(`tam`.`AllowedPeriodStart`) as `allowed_period_start`,
                UNIX_TIMESTAMP(`tam`.`AllowedPeriodEnd`) as `allowed_period_end`,
                `tam`.`AdditionalParamValue` AS `additional_param_value`
            FROM `sys_acl_actions` AS `taa`
            LEFT JOIN `sys_acl_matrix` AS `tam` ON `tam`.`IDAction` = `taa`.`ID` AND `tam`.`IDLevel` = :level", [
            'level' => (int)$iMembershipId,
        ]);
        foreach($aRows as $aRow) {
            $sKey = 'BxDolAclQuery::getAction' . (int)$iMembershipId . '_' . (int)$aRow['action_id'];
            unset($aRow['action_id']);
            if(!array_key_exists($sKey, self::$_aDbCacheData))
                self::$_aDbCacheData[$sKey] = $aRow;
        }
    }

    function getAction($iMembershipId, $iActionId)
    {
        // the site and API v1 keep a level's action under the key they always had
        $sKey = 'BxDolAclQuery::getAction' . $iMembershipId . $iActionId;
        if(bx_is_api_v2()) {
            // API v2 only: the level and the action apart (without the '_' level 1 with action 23
            // and level 12 with action 3 are kept under one key, and the second one asked for
            // gets the first one's rights), and the level's rights for every action read at once
            // (a page checks many)
            $sKey = 'BxDolAclQuery::getAction' . (int)$iMembershipId . '_' . (int)$iActionId;
            if(!array_key_exists($sKey, self::$_aDbCacheData))
                $this->_primeActionsForLevel($iMembershipId);
        }

        $sQuery = $this->prepare("SELECT
                `tam`.`IDAction` AS `id`,
                `taa`.`Name` AS `name`,
                `taa`.`Title` AS `title`,
                `tam`.`AllowedCount` AS `allowed_count`,
                `tam`.`AllowedPeriodLen` AS `allowed_period_len`,
                UNIX_TIMESTAMP(`tam`.`AllowedPeriodStart`) as `allowed_period_start`,
                UNIX_TIMESTAMP(`tam`.`AllowedPeriodEnd`) as `allowed_period_end`,
                `tam`.`AdditionalParamValue` AS `additional_param_value`
            FROM `sys_acl_actions` AS `taa`
            LEFT JOIN `sys_acl_matrix` AS `tam` ON `tam`.`IDAction` = `taa`.`ID` AND `tam`.`IDLevel` = ?
            WHERE `taa`.`ID` = ?", $iMembershipId, $iActionId);
        return $this->fromMemory($sKey, 'getRow', $sQuery);
    }

    function getActionTrack($iActionId, $iProfileId)
    {
        $sQuery = $this->prepare("SELECT
                `taat`.`ActionsLeft` AS `actions_left`,
                UNIX_TIMESTAMP(`taat`.`ValidSince`) as `valid_since`
            FROM `sys_acl_actions_track` AS `taat`
            WHERE `taat`.`IDAction`=? AND `taat`.`IDMember`=?", $iActionId, $iProfileId);
        return $this->getRow($sQuery);
    }

    function insertActionTarck($iActionId, $iProfileId, $iActionsLeft, $iValidSince)
    {
        $sQuery = $this->prepare("INSERT INTO `sys_acl_actions_track`(`IDAction`, `IDMember`, `ActionsLeft`, `ValidSince`) VALUES (?, ?, ?, FROM_UNIXTIME(?))", $iActionId, $iProfileId, $iActionsLeft, $iValidSince);
        return (int)$this->query($sQuery) > 0;
    }

    function updateActionTrack($iActionId, $iProfileId, $iActionsLeft, $iValidSince = 0)
    {
    	$aBindings = array(
    		'actions_left' => $iActionsLeft,
    		'action_id' => $iActionId,
    		'member_id' => $iProfileId
    	);

        $sUpdateAddon = "";
        if($iValidSince != 0) {
        	$aBindings['valid_since'] = $iValidSince;

            $sUpdateAddon = ", ValidSince=FROM_UNIXTIME(:valid_since)";
        }

        $sQuery = "UPDATE `sys_acl_actions_track` SET `ActionsLeft`=:actions_left" . $sUpdateAddon . " WHERE `IDAction`=:action_id AND `IDMember`=:member_id";
        return (int)$this->query($sQuery, $aBindings) > 0;
    }

    function insertLevelByProfileId($iProfileId, $iMembershipId, $iDateStarts, $aPeriod, $sTransactionId)
    {
    	$aBindings = array(
            'member_id' => $iProfileId,
            'level_id' => $iMembershipId,
            'transaction_id' => $sTransactionId,
            'date_starts' => $iDateStarts
        );

    	$sSetClause = '';
    	if((int)$aPeriod['period'] != 0) {
            $aBindings['period'] = (int)$aPeriod['period'];

            switch($aPeriod['period_unit']) {
                case MEMBERSHIP_PERIOD_UNIT_DAY:
                case MEMBERSHIP_PERIOD_UNIT_WEEK:
                    if($aPeriod['period_unit'] == MEMBERSHIP_PERIOD_UNIT_WEEK)
                        $aBindings['period'] *= 7;

                    $sSetClause = "DATE_ADD(FROM_UNIXTIME(:date_starts), INTERVAL :period DAY)";
                    break;

                case MEMBERSHIP_PERIOD_UNIT_MONTH:
                    $sSetClause = "DATE_ADD(FROM_UNIXTIME(:date_starts), INTERVAL :period MONTH)";
                    break;

                case MEMBERSHIP_PERIOD_UNIT_YEAR:
                    $sSetClause = "DATE_ADD(FROM_UNIXTIME(:date_starts), INTERVAL :period YEAR)";
                    break;
            }

            if(!empty($sSetClause) && !empty($aPeriod['period_reserve'])) {
                $aBindings['reserve'] = (int)$aPeriod['period_reserve'];

                $sSetClause = "DATE_ADD(" . $sSetClause . ", INTERVAL :reserve DAY)";
            }

            if(!empty($sSetClause))
                $sSetClause = ", `DateExpires`=" . $sSetClause;

            if(isset($aPeriod['period_trial']) && $aPeriod['period_trial'] === true) {
                $aBindings['state'] = 'trial';

                $sSetClause .= ", `State`=:state";
            }
    	}

        $sQuery = $this->prepare("INSERT `sys_acl_levels_members` SET `IDMember`=:member_id, `IDLevel`=:level_id, `DateStarts`=FROM_UNIXTIME(:date_starts), `TransactionID`=:transaction_id" . $sSetClause);
        return (int)$this->query($sQuery, $aBindings) > 0;
    }

    function deleteLevelByProfileId($iProfileId, $bAll = false)
    {
        $sQuery = $this->prepare("DELETE FROM `sys_acl_levels_members` WHERE `IDMember` = ? " . ($bAll ? "" : " AND (`DateExpires` IS NULL OR `DateExpires` > NOW())"), $iProfileId);
        return (int)$this->query($sQuery) > 0;
    }

	function deleteLevelBy($aWhere)
    {
    	if(empty($aWhere))
    		return false;

        $sQuery = "DELETE FROM `sys_acl_levels_members` WHERE " . $this->arrayToSQL($aWhere, ' AND ');
        return (int)$this->query($sQuery) > 0;
    }

    function maintenance($iDaysToCleanMemLevels = 0)
    {
        $sQuery = $this->prepare("DELETE FROM `sys_acl_levels_members` WHERE `DateExpires` < NOW() - INTERVAL ? DAY", $iDaysToCleanMemLevels);
        if ($iDeleteMemLevels = $this->query($sQuery))
            $this->query("OPTIMIZE TABLE `sys_acl_levels_members`");
        return $iDeleteMemLevels;
    }

    function clearActionsTracksForMember($iMemberId)
    {
        $sQuery = $this->prepare("DELETE FROM `sys_acl_actions_track` WHERE `IDMember` = ?", (int)$iMemberId);
	    return $this->query($sQuery);
    }

    function getContentByLevelAsSQLPart($sContentTable, $sContentField, $mixedLevelId)
    {
    	$sJoin = $sWhere = ""; 
        $iLevelId = !is_array($mixedLevelId) ? $mixedLevelId : 0;
        if (!$iLevelId && is_array($mixedLevelId) && 1 == count($mixedLevelId)) {
            $a = array_values($mixedLevelId);
            $iLevelId = array_shift($a);
        }

        // unconfirmed
        if (MEMBERSHIP_ID_UNCONFIRMED == $iLevelId) {
            return array(
                'where' => " AND `cblasp_a`.`email_confirmed` = 0 ",
                'join' => " INNER JOIN `sys_profiles` AS `cblasp_p` ON (`" . $sContentTable . "`.`" . $sContentField . "`=`cblasp_p`.`id`) INNER JOIN `sys_accounts` AS `cblasp_a` ON (`cblasp_a`.`id`=`cblasp_p`.`account_id`) ",
            );
        }
        // standard
        elseif (MEMBERSHIP_ID_STANDARD == $iLevelId) {

            $sWhere .= " AND (`tlm`.`DateStarts` IS NULL OR `tlm`.`DateStarts` <= NOW()) AND (`tlm`.`DateExpires` IS NULL OR `tlm`.`DateExpires` > NOW()) AND `tlm`.`IDMember` IS NULL AND `cblasp_a`.`email_confirmed` != 0 ";

            $sJoin .= " LEFT JOIN `sys_acl_levels_members` AS `tlm` ON `" . $sContentTable . "`.`" . $sContentField . "`=`tlm`.`IDMember` INNER JOIN `sys_profiles` AS `cblasp_p` ON (`" . $sContentTable . "`.`" . $sContentField . "`=`cblasp_p`.`id`) INNER JOIN `sys_accounts` AS `cblasp_a` ON (`cblasp_a`.`id`=`cblasp_p`.`account_id`) ";

            return array(
                'where' => $sWhere,
                'join' => $sJoin
            );
        }
        // other levels
        else {

            if(is_array($mixedLevelId))
                $sWhere .= " AND `tlm`.`IDLevel` IN (" . $this->implode_escape($mixedLevelId) . ")";
            else
                $sWhere .= $this->prepareAsString(" AND `tlm`.`IDLevel` = ?", (int)$mixedLevelId);

            $sWhere .= " AND (`tlm`.`DateStarts` IS NULL OR `tlm`.`DateStarts` <= NOW()) AND (`tlm`.`DateExpires` IS NULL OR `tlm`.`DateExpires` > NOW()) AND `cblasp_a`.`email_confirmed` != 0 ";

            $sJoin .= " INNER JOIN `sys_acl_levels_members` AS `tlm` ON `" . $sContentTable . "`.`" . $sContentField . "`=`tlm`.`IDMember` INNER JOIN `sys_profiles` AS `cblasp_p` ON (`" . $sContentTable . "`.`" . $sContentField . "`=`cblasp_p`.`id`) INNER JOIN `sys_accounts` AS `cblasp_a` ON (`cblasp_a`.`id`=`cblasp_p`.`account_id`) ";

            return array(
                'where' => $sWhere,
                'join' => $sJoin
            );
        }
    }
    
    function getContentByActionAsSQLPart($sContentTable, $sContentField, $mixedActionName, $aParams = [])
    {
        $sWhere = " AND (`tlm`.`DateStarts` IS NULL OR `tlm`.`DateStarts` <= NOW()) AND (`tlm`.`DateExpires` IS NULL OR `tlm`.`DateExpires` > NOW()) ";

        $sJoinWhere = "";
        if(is_array($mixedActionName))
            $sJoinWhere .= " AND `ta`.`Name` IN (" . $this->implode_escape($mixedActionName) . ")";
        else
            $sJoinWhere .= $this->prepareAsString(" AND `ta`.`Name` = ?", $mixedActionName);
        
        if(!empty($aParams['module']))
            $sJoinWhere .= $this->prepareAsString(" AND `ta`.`Module` = ?", $aParams['module']);

        $sJoin = " INNER JOIN `sys_acl_levels_members` AS `tlm` ON `" . $sContentTable . "`.`" . $sContentField . "`=`tlm`.`IDMember` INNER JOIN `sys_acl_matrix` AS `tm` ON `tlm`.`IDLevel`=`tm`.`IDLevel` INNER JOIN `sys_acl_actions` AS `ta` ON (`tm`.`IDAction`=`ta`.`ID` " . $sJoinWhere . ") ";

        return array(
            'where' => $sWhere,
            'join' => $sJoin
        );
    }

    function getProfilesByMembership($mixedLevelId, $aParams = [])
    {
        $sSelectClause = $sJoinClause = $sWhereClause = '';

    	$aSqlParts = $this->getContentByLevelAsSQLPart('sys_profiles', 'id', $mixedLevelId);
        if(isset($aSqlParts['join'], $aSqlParts['where'])) {
            $sJoinClause = $aSqlParts['join'];
            $sWhereClause = $aSqlParts['where'];
        }

        if(isset($aParams['password_expired'], $aParams['password_expired_notify'])) {
            $iExpire = (int)$aParams['password_expired'] * 86400;
            $iNotify = ($iExpire - (int)$aParams['password_expired_notify']) * 86400;

            $sSelectClause .= ", `ta`.`email` AS `email`, IF(`ta`.`password_changed` <> 0, `ta`.`password_changed`, `ta`.`added`) + " . $iExpire . " AS `password_expired`";
            $sJoinClause .= " LEFT JOIN `sys_accounts` AS `ta` ON `sys_profiles`.`account_id`=`ta`.`id`";
            $sWhereClause .= " AND IF(`ta`.`password_changed` <> 0, `ta`.`password_changed`, `ta`.`added`) + " . $iNotify . " < UNIX_TIMESTAMP() AND IF(`ta`.`password_changed` <> 0, `ta`.`password_changed`, `ta`.`added`) + " . $iExpire . " >= UNIX_TIMESTAMP()";
        }

    	return $this->getAll("SELECT `sys_profiles`.*" . $sSelectClause . " FROM `sys_profiles`" . $sJoinClause . " WHERE 1" . $sWhereClause);
    }

    function getProfilesByAction($mixedActionName, $aParams = [])
    {
        $sMethod = "getAll";
        $sSqlSelect = "`sys_profiles`.*";
        if(isset($aParams['ids_only']) && $aParams['ids_only'] === true) {
            $sMethod = "getColumn";
            $sSqlSelect = "`sys_profiles`.`id`";
        }

        $aSqlParts = $this->getContentByActionAsSQLPart('sys_profiles', 'id', $mixedActionName, $aParams);

    	return $this->$sMethod("SELECT DISTINCT " . $sSqlSelect . " FROM `sys_profiles`" . $aSqlParts['join'] . " WHERE 1" . $aSqlParts['where']);
    }
}

/** @} */
