<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for introduction tours.
 * @see BxDolTours
 */
class BxDolToursQuery extends BxDolDb
{
    public function __construct()
    {
        parent::__construct();
    }

    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolToursQuery();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function isSeen($iAccountId, $sTour)
    {
        return (int)$this->getOne("SELECT 1 FROM `sys_accounts_tours` WHERE `account_id` = :account AND `tour` = :tour LIMIT 1", [
            'account' => (int)$iAccountId,
            'tour' => $sTour
        ]) == 1;
    }

    public function setSeen($iAccountId, $sTour)
    {
        return $this->query("INSERT IGNORE INTO `sys_accounts_tours` (`account_id`, `tour`, `added`) VALUES (:account, :tour, :added)", [
            'account' => (int)$iAccountId,
            'tour' => $sTour,
            'added' => time()
        ]) !== false;
    }

    public function deleteByAccount($iAccountId)
    {
        return $this->query("DELETE FROM `sys_accounts_tours` WHERE `account_id` = :account", [
            'account' => (int)$iAccountId
        ]);
    }
}

/** @} */
