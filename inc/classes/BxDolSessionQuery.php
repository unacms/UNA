<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * @see BxDolSession
 */
class BxDolSessionQuery extends BxDolDb
{
    protected $sTable;

    public function __construct()
    {
        parent::__construct();

        $this->sTable = 'sys_sessions';
    }
    function getTableName()
    {
        return $this->sTable;
    }
    /**
     * The session with this id, unless it is over: a remembered one past its `ttl`, any other one
     * idle for too long. An ended session stops working at once; the cron job deletes it later.
     */
    function exists($sId)
    {
        $aSession = $this->getRow("SELECT * FROM `" . $this->sTable . "` WHERE `id`=:id AND IF(`ttl` != 0, `ttl` >= :now, `date` >= IF(`user_id` != 0, :idle_user, :idle_guest)) LIMIT 1", [
            'id' => (string)$sId,
            'now' => time(),
            'idle_user' => time() - BX_DOL_SESSION_IDLE_TIMEOUT,
            'idle_guest' => time() - BX_DOL_SESSION_IDLE_TIMEOUT_GUESTS,
        ]);

        return !empty($aSession) ? $aSession : false;
    }
    function save($sId, $aSet)
    {
        $aSet['date'] = time();
        $aUpdate = $aSet;
        $aSet['id'] = $sId;
        $aBind = $aSet;
        unset($aBind['date']);

        if ($this->getOne("SELECT `date` FROM `" . $this->sTable . "` WHERE `id` = :id AND `data` = :data AND `user_id` = :user_id AND `ttl` = :ttl AND `date` > UNIX_TIMESTAMP() - " . BX_DOL_SESSION_SKIP_UPDATE, $aBind))
            return true;

        $this->updateLastActivity($sId);

        return (int)$this->query("INSERT INTO `" . $this->sTable . "` SET " . $this->arrayToSQL($aSet) . " ON DUPLICATE KEY UPDATE " . $this->arrayToSQL($aUpdate)) > 0;
    }
	function update($sId, $aSet = array())
    {
    	$sSet = !empty($aSet) ? $this->arrayToSQL($aSet) . ", " : "";
    	$sSet .= "`date`=UNIX_TIMESTAMP()";

        $this->updateLastActivity($sId);

        $iRet = (int)$this->query("UPDATE `" . $this->sTable . "` SET " . $sSet . " WHERE `id`=:id", array('id' => $sId)) > 0;
        $this->setReadOnlyMode(true);
        return $iRet;
    }
    function delete($sId)
    {
        $aRow = $this->getRow("SELECT `user_id`, `date` FROM `" . $this->sTable . "` WHERE `id`=:id LIMIT 1", ['id' => $sId]);
        if(!empty($aRow) && is_array($aRow))
            $this->updateLastActivityAccount($aRow['user_id'], $aRow['date']);

        $sSql = $this->prepare("DELETE FROM `" . $this->sTable . "` WHERE `id`=? LIMIT 1", $sId);
        return (int)$this->query($sSql) > 0;
    }
    function deleteExpired()
    {
        $iIdleUser = time() - BX_DOL_SESSION_IDLE_TIMEOUT;
        $iIdleGuest = time() - BX_DOL_SESSION_IDLE_TIMEOUT_GUESTS;
        $aRows = $this->getAll("SELECT `user_id`, `date` FROM `" . $this->sTable . "` WHERE ((`date` < :time AND `ttl` = 0) OR (`ttl` != 0 AND `ttl` < :now)) AND `user_id` != 0 ORDER BY `date` DESC LIMIT 50000", ['time' => $iIdleUser, 'now' => time()]);

        foreach ($aRows as $aRow) {
            $this->updateLastActivityAccount($aRow['user_id'], $aRow['date']);
        }
        
        $iRet = (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `date` < :time AND `ttl` = 0 AND `user_id` = 0", ['time' => $iIdleGuest]);
        $iRet += (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `date` < :time AND `ttl` = 0 AND `user_id` != 0", ['time' => $iIdleUser]);
        $iRet += (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `ttl` != 0 AND `ttl` < :now", ['now' => time()]);
        if ($iRet > 10)
            $this->query("OPTIMIZE TABLE `" . $this->sTable . "`");
        return $iRet;
    }
    
    /**
     * Delete a session without moving the account's last activity: one that goes on under
     * a new id (BxDolSession::setUserId), or one that is over already.
     */
    public function deleteById($sId)
    {
        return (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `id` = :id LIMIT 1", ['id' => $sId]) > 0;
    }

    public function deleteByAccountIdExcept($iAccountId, $sKeepId = '')
    {
        if(!(int)$iAccountId) {
            return 0;
        }

        return (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `user_id` = :id AND `id` != :keep", [
            'id' => (int)$iAccountId,
            'keep' => (string)$sKeepId
        ]);
    }

    function deleteByAccountId($iAccountId)
    {
        $iDate = $this->getOne("SELECT `date` FROM `" . $this->sTable . "` WHERE `user_id` = :id ORDER BY `date` DESC", ['id' => $iAccountId]);
        if ($iDate)
            $this->updateLastActivityAccount($iAccountId, $iDate);
        
        return (int)$this->query("DELETE FROM `" . $this->sTable . "` WHERE `user_id` = :id", ['id' => $iAccountId]);
    }

    function updateLastActivity($iId)
    {
        if (defined('BX_DOL_SESSION_UPDATE_ACTIVE') && ($aRow = $this->getRow("SELECT `date`, `user_id` FROM `" . $this->sTable . "` WHERE `id` = :id AND `date` < UNIX_TIMESTAMP() - " . BX_DOL_SESSION_UPDATE_ACTIVE, ['id' => $iId]))) {
            $this->updateLastActivityAccount($aRow['user_id'], $aRow['date']);
        }
    }

    function updateLastActivityAccount($iAccountId, $iDate)
    {
        if ($iDate > 0) {
            $a = BxDolAccountQuery::getInstance()->getInfoById($iAccountId);
            if ($a && $iDate > $a['active'])
                BxDolAccountQuery::getInstance()->_updateField($iAccountId, 'active', $iDate);
        }
    }

    function getLastActivityAccount($iUserId)
    {
        $sSql = $this->prepare("SELECT `date` FROM `" . $this->sTable . "` WHERE `user_id`=? ORDER BY `date` DESC LIMIT 1", $iUserId);
        return $this->getOne($sSql);
    }

    function getOldSession($iUserId) {
        $sSql = $this->prepare("SELECT `id` FROM `" . $this->sTable . "` WHERE `user_id`=? LIMIT 1", $iUserId);
        $sSession = $this->getOne($sSql);
        return !empty($sSession) ? $sSession : false;
    }
}

/** @} */
