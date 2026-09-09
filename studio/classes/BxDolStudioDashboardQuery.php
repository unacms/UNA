<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

class BxDolStudioDashboardQuery extends BxDolStudioPageQuery
{
    function __construct()
    {
        parent::__construct();
    }

    /**
     * A module's storage use split by where its files live: its objects on the Local engine and those on any remote engine.
     * @return array ['local' => ['size' => bytes, 'objects' => count], 'remote' => ['size' => bytes, 'objects' => count]]
     */
    function getModuleStorageSizes($sModule)
    {
        $aResult = array('local' => array('size' => 0, 'objects' => 0), 'remote' => array('size' => 0, 'objects' => 0));

        $sSql = "SELECT IF(`engine` = 'Local', 'local', 'remote') AS `scope`, SUM(`current_size`) AS `size`, COUNT(*) AS `objects` FROM `sys_objects_storage` WHERE `object` LIKE " . $this->escape($sModule . '%') . " GROUP BY `scope`";
        foreach($this->getAll($sSql) as $aRow)
            $aResult[$aRow['scope']] = array('size' => (int)$aRow['size'], 'objects' => (int)$aRow['objects']);

        return $aResult;
    }

    /**
     * The storage objects under a name prefix, each with its engine and counters (the dashboard splits the system module's by hand).
     */
    function getStorageObjects($sPrefix)
    {
        return $this->getAll("SELECT `object`, `engine`, `current_size`, `current_number` FROM `sys_objects_storage` WHERE `object` LIKE " . $this->escape($sPrefix . '%') . " ORDER BY `object`");
    }

    /**
     * Users block (BxBaseStudioDashboard::serviceGetBlockUsers): every account.
     */
    function getAccountsCount()
    {
        return (int)$this->getOne("SELECT COUNT(*) FROM `sys_accounts`");
    }

    /**
     * Accounts seen since a moment: their last activity or login is at or after it.
     */
    function getAccountsActiveCount($iSince)
    {
        return (int)$this->getOne("SELECT COUNT(*) FROM `sys_accounts` WHERE `active` >= :since_active OR `logged` >= :since_logged", ['since_active' => (int)$iSince, 'since_logged' => (int)$iSince]);
    }

    /**
     * Accounts online now: with a session touched within the online window, the way BxDolAccountQuery::isOnline counts one.
     */
    function getAccountsOnlineCount()
    {
        return (int)$this->getOne("SELECT COUNT(DISTINCT `ta`.`id`) FROM `sys_accounts` AS `ta` INNER JOIN `sys_sessions` AS `ts` ON `ta`.`id` = `ts`.`user_id` WHERE `ts`.`date` > (UNIX_TIMESTAMP() - 60 * :minutes)", ['minutes' => (int)getParam('sys_account_online_time')]);
    }

    /**
     * Profiles of a type whose account is online now, the way getAccountsOnlineCount counts an account.
     */
    function getProfilesOnlineCount($sType)
    {
        return (int)$this->getOne("SELECT COUNT(DISTINCT `tp`.`id`) FROM `sys_profiles` AS `tp` INNER JOIN `sys_sessions` AS `ts` ON `tp`.`account_id` = `ts`.`user_id` WHERE `tp`.`type` = :type AND `ts`.`date` > (UNIX_TIMESTAMP() - 60 * :minutes)", ['type' => $sType, 'minutes' => (int)getParam('sys_account_online_time')]);
    }

    /**
     * Every active profile with the permission level it holds, the way BxDolAclQuery::getLevelCurrent resolves it: its latest membership
     * that has started and not expired, else Standard; and since when (the membership's start, else the account's creation). A pending or
     * suspended profile is on its status' pseudo level, so it is left out. Shared by the level queries below as a derived table.
     */
    protected function getLevelMembersSql()
    {
        bx_import('BxDolAcl');
        return "SELECT `tp`.`id`, `tp`.`account_id`, COALESCE(`tm`.`IDLevel`, " . (int)MEMBERSHIP_ID_STANDARD . ") AS `level`, COALESCE(UNIX_TIMESTAMP(`tm`.`DateStarts`), `ta`.`added`) AS `since`
            FROM `sys_profiles` AS `tp`
            INNER JOIN `sys_accounts` AS `ta` ON `ta`.`id` = `tp`.`account_id`
            LEFT JOIN `sys_acl_levels_members` AS `tm` ON `tm`.`IDMember` = `tp`.`id` AND `tm`.`DateStarts` = (SELECT MAX(`tm2`.`DateStarts`) FROM `sys_acl_levels_members` AS `tm2` WHERE `tm2`.`IDMember` = `tp`.`id` AND `tm2`.`DateStarts` <= NOW() AND (`tm2`.`DateExpires` IS NULL OR `tm2`.`DateExpires` > NOW()))
            WHERE `tp`.`type` <> 'system' AND `tp`.`status` = 'active'";
    }

    /**
     * The permission levels a profile can hold, in their order: the active ones without the pseudo levels of not being logged in, having no
     * profile, or an unconfirmed, pending or suspended one.
     * @return array of ['ID', 'Name' (a language key), 'Icon']
     */
    function getLevels()
    {
        bx_import('BxDolAcl');
        $aPseudo = [MEMBERSHIP_ID_NON_MEMBER, MEMBERSHIP_ID_ACCOUNT, MEMBERSHIP_ID_UNCONFIRMED, MEMBERSHIP_ID_PENDING, MEMBERSHIP_ID_SUSPENDED];
        return $this->getAll("SELECT `ID`, `Name`, `Icon` FROM `sys_acl_levels` WHERE `Active` = 'yes' AND `ID` NOT IN (" . implode(',', array_map('intval', $aPseudo)) . ") ORDER BY `Order` ASC, `ID` ASC");
    }

    /**
     * Current members per level.
     * @return array level id => count
     */
    function getLevelsMembersCount()
    {
        return $this->getPairs("SELECT `level`, COUNT(*) AS `count` FROM (" . $this->getLevelMembersSql() . ") AS `t` GROUP BY `level`", 'level', 'count');
    }

    /**
     * A level's current members by when they joined it, counted per calendar bucket like getAccountsAddedBy.
     * @return array bucket => count
     */
    function getLevelMembersSinceBy($iLevel, $sFormat, $iSince)
    {
        return $this->getPairs("SELECT FROM_UNIXTIME(`since`, :format) AS `bucket`, COUNT(*) AS `count` FROM (" . $this->getLevelMembersSql() . ") AS `t` WHERE `level` = :level AND `since` >= :since GROUP BY `bucket` ORDER BY `bucket`", 'bucket', 'count', ['format' => $sFormat, 'level' => (int)$iLevel, 'since' => (int)$iSince]);
    }

    /**
     * A level's current members whose account is online now, the way getAccountsOnlineCount counts an account.
     */
    function getLevelOnlineCount($iLevel)
    {
        return (int)$this->getOne("SELECT COUNT(DISTINCT `t`.`id`) FROM (" . $this->getLevelMembersSql() . ") AS `t` INNER JOIN `sys_sessions` AS `ts` ON `ts`.`user_id` = `t`.`account_id` WHERE `t`.`level` = :level AND `ts`.`date` > (UNIX_TIMESTAMP() - 60 * :minutes)", ['level' => (int)$iLevel, 'minutes' => (int)getParam('sys_account_online_time')]);
    }

    /**
     * When the first account was added; 0 without accounts.
     */
    function getAccountsFirstAdded()
    {
        return (int)$this->getOne("SELECT MIN(`added`) FROM `sys_accounts` WHERE `added` > 0");
    }

    /**
     * Accounts added since a moment, counted per calendar bucket named by a MySQL date format ('%Y-%m-%d' days, '%Y-%m' months, '%Y' years).
     * @return array bucket => count
     */
    function getAccountsAddedBy($sFormat, $iSince)
    {
        return $this->getPairs("SELECT FROM_UNIXTIME(`added`, :format) AS `bucket`, COUNT(*) AS `count` FROM `sys_accounts` WHERE `added` >= :since GROUP BY `bucket` ORDER BY `bucket`", 'bucket', 'count', ['format' => $sFormat, 'since' => (int)$iSince]);
    }

    /**
     * Accounts last seen (their latest activity or login) since a moment, counted per calendar bucket like getAccountsAddedBy.
     * @return array bucket => count
     */
    function getAccountsSeenBy($sFormat, $iSince)
    {
        return $this->getPairs("SELECT FROM_UNIXTIME(GREATEST(`active`, `logged`), :format) AS `bucket`, COUNT(*) AS `count` FROM `sys_accounts` WHERE GREATEST(`active`, `logged`) >= :since GROUP BY `bucket` ORDER BY `bucket`", 'bucket', 'count', ['format' => $sFormat, 'since' => (int)$iSince]);
    }

    /**
     * Rows of a module's content table (a profile type's profiles) added since a moment, counted per calendar bucket like getAccountsAddedBy.
     * @return array bucket => count
     */
    function getEntriesAddedBy($sTable, $sField, $sFormat, $iSince)
    {
        $sTable = preg_replace('/[^a-zA-Z0-9_]/', '', $sTable);
        $sField = preg_replace('/[^a-zA-Z0-9_]/', '', $sField);
        return $this->getPairs("SELECT FROM_UNIXTIME(`" . $sField . "`, :format) AS `bucket`, COUNT(*) AS `count` FROM `" . $sTable . "` WHERE `" . $sField . "` >= :since GROUP BY `bucket` ORDER BY `bucket`", 'bucket', 'count', ['format' => $sFormat, 'since' => (int)$iSince]);
    }

    /**
     * Profiles per type (the module that owns them), the system's own left out, with how many of them are active.
     * @return array of ['type', 'total', 'active']
     */
    function getProfilesByType()
    {
        return $this->getAll("SELECT `type`, COUNT(*) AS `total`, SUM(`status` = 'active') AS `active` FROM `sys_profiles` WHERE `type` <> 'system' GROUP BY `type` ORDER BY `total` DESC, `type` ASC");
    }

    /**
     * Whether remote storage is in use: some storage object lives on a remote engine, or new objects would (the default engine option).
     */
    function isRemoteStorageUsed()
    {
        if(getParam('sys_storage_default') != 'Local')
            return true;

        return (int)$this->getOne("SELECT COUNT(*) FROM `sys_objects_storage` WHERE `engine` <> 'Local'") > 0;
    }
}

/** @} */
