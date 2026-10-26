<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for BxDolKey object.
 * @see BxDolKey
 */
class BxDolKeyQuery extends BxDolDb
{
    public function __construct()
    {
        parent::__construct();
    }

    public function insert ($sKey, $sData, $iExpire, $sSalt = '')
    {
        $sQuery = $this->prepare("INSERT INTO `sys_keys` SET `key` = ?, `data` = ?, `expire` = ?, `salt` = ?", $sKey, $sData, time() + $iExpire, $sSalt);
        return $this->query($sQuery);
    }

    public function remove ($sKey)
    {
        $sQuery = $this->prepare("DELETE FROM `sys_keys` WHERE `key` = ?", $sKey);
        return $this->query($sQuery);
    }

    public function get ($sKey, $sSalt = '')
    {
        $sWhere = '';
        $aBind = ['key' => $sKey];
        if ($sSalt) {
            $sWhere .= " AND `salt` = :salt ";
            $aBind['salt'] = $sSalt;
        }
        return $this->getOne("SELECT `key` FROM `sys_keys` WHERE `key` = :key" . $sWhere, $aBind);
    }

    public function getData ($sKey, $sSalt = '')
    {
        $sWhere = '';
        $aBind = ['key' => $sKey];
        if ($sSalt) {
            $sWhere .= " AND `salt` = :salt ";
            $aBind['salt'] = $sSalt;
        }
        return $this->getOne("SELECT `data` FROM `sys_keys` WHERE `key` = :key" . $sWhere, $aBind);
    }

    /**
     * Add one to the number kept in the data of a counter key, if it is below the maximum and the key hasn't expired.
     * @return true if the number was increased
     */
    public function increaseCounter ($sKey, $iMax)
    {
        return (int)$this->query("UPDATE `sys_keys` SET `data` = CAST(`data` AS UNSIGNED) + 1 WHERE `key` = :key AND CAST(`data` AS UNSIGNED) < :max AND `expire` >= :now", [
            'key' => $sKey,
            'max' => (int)$iMax,
            'now' => time(),
        ]) > 0;
    }

    /**
     * Take one back from the number kept in the data of a counter key.
     * @return true if the number was decreased
     */
    public function decreaseCounter ($sKey)
    {
        return (int)$this->query("UPDATE `sys_keys` SET `data` = CAST(`data` AS UNSIGNED) - 1 WHERE `key` = :key AND CAST(`data` AS UNSIGNED) > 0", [
            'key' => $sKey,
        ]) > 0;
    }

    /**
     * Check that the number kept in the data of a counter key is below the maximum, and that the key works until the given time.
     */
    public function isCounterBelow ($sKey, $iMax, $iUntil)
    {
        return (bool)$this->getOne("SELECT 1 FROM `sys_keys` WHERE `key` = :key AND CAST(`data` AS UNSIGNED) < :max AND `expire` >= :until", [
            'key' => $sKey,
            'max' => (int)$iMax,
            'until' => (int)$iUntil,
        ]);
    }

    public function prune ()
    {
        $sQuery = $this->prepare("DELETE FROM `sys_keys` WHERE `expire` < ?", time());
        return $this->query($sQuery);
    }
}

/** @} */
