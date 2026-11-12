<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database queries for API interface
 * @see BxDolApiQuery
 */
class BxDolApiQuery extends BxDolDb implements iBxDolSingleton
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
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolApiQuery();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function getOrigin ($sUrl)
    {
        return $this->getOne("SELECT `url` FROM `sys_api_origins` WHERE `url` = :url", ['url' => $sUrl]);
    }

    public function getKey ($sKey)
    {
        return $this->getOne("SELECT `key` FROM `sys_api_keys` WHERE `key` = :key", ['key' => $sKey]);
    }

    /**
     * API v2 Idempotency-Key claims (BxDolApiV2Idempotency). Scope and fingerprint are hex
     * sha256 digests, kept as binary(32).
     * @return bool whether this request claimed the key (it was not taken)
     */
    public function claimIdempotencyKey($sScope, $sKey, $sFingerprint, $iNow)
    {
        return (int)$this->query("INSERT IGNORE INTO `sys_api_idempotency` (`scope`, `key`, `fingerprint`, `added`) VALUES (UNHEX(:scope), :key, UNHEX(:fingerprint), :added)", [
            'scope' => $sScope, 'key' => $sKey, 'fingerprint' => $sFingerprint, 'added' => (int)$iNow,
        ]) === 1;
    }

    public function getIdempotencyKey($sScope, $sKey)
    {
        return $this->getRow("SELECT LOWER(HEX(`fingerprint`)) AS `fingerprint`, `status`, `headers`, `body`, `added` FROM `sys_api_idempotency` WHERE `scope` = UNHEX(:scope) AND `key` = :key", [
            'scope' => $sScope, 'key' => $sKey,
        ]);
    }

    /**
     * Take over a claim that was added at $iAdded (expired, or pending and abandoned) for a new
     * request; false when another request changed it first.
     * @param bool $bPendingOnly only while it has no answer yet
     */
    public function takeOverIdempotencyKey($sScope, $sKey, $sFingerprint, $iNow, $iAdded, $bPendingOnly)
    {
        return (int)$this->query("UPDATE `sys_api_idempotency` SET `fingerprint` = UNHEX(:fingerprint), `status` = NULL, `headers` = NULL, `body` = NULL, `added` = :now WHERE `scope` = UNHEX(:scope) AND `key` = :key AND `added` = :added" . ($bPendingOnly ? " AND `status` IS NULL" : ""), [
            'scope' => $sScope, 'key' => $sKey, 'fingerprint' => $sFingerprint, 'now' => (int)$iNow, 'added' => (int)$iAdded,
        ]) === 1;
    }

    /**
     * Keep the answer of the pending claim made at $iAdded; false when the claim is no longer
     * that one (a retry took it over), and nothing is changed.
     */
    public function storeIdempotentAnswer($sScope, $sKey, $iAdded, $iStatus, $sHeaders, $sBody)
    {
        return (int)$this->query("UPDATE `sys_api_idempotency` SET `status` = :status, `headers` = :headers, `body` = :body WHERE `scope` = UNHEX(:scope) AND `key` = :key AND `added` = :added AND `status` IS NULL", [
            'scope' => $sScope, 'key' => $sKey, 'added' => (int)$iAdded, 'status' => (int)$iStatus, 'headers' => $sHeaders, 'body' => $sBody,
        ]) === 1;
    }

    /**
     * Let go of the pending claim made at $iAdded; nothing when the claim is no longer that one.
     */
    public function releaseIdempotencyKey($sScope, $sKey, $iAdded)
    {
        return $this->query("DELETE FROM `sys_api_idempotency` WHERE `scope` = UNHEX(:scope) AND `key` = :key AND `added` = :added AND `status` IS NULL", [
            'scope' => $sScope, 'key' => $sKey, 'added' => (int)$iAdded,
        ]);
    }

    public function pruneIdempotencyKeys($iBefore)
    {
        return $this->query("DELETE FROM `sys_api_idempotency` WHERE `added` < :before", ['before' => (int)$iBefore]);
    }

    /**
     * API v2 rate limits (BxDolApiV2RateLimit): count one request of a subject in a bucket, in
     * the window that started at $iStarted. One statement, so requests that arrive together
     * are all counted, and nothing is read first: the new count comes back as the insert id.
     * The count stops at $iCap, where the row no longer changes, so requests over a limit
     * cost no write. A row of an earlier window starts again from 1; one of a later window (a
     * web server whose clock is behind) keeps counting in that one.
     * @param string $sSubject a hex sha256 digest, kept as binary(32)
     * @return int the requests counted in the window, this one included, at most $iCap
     */
    public function hitRateLimit($sSubject, $sBucket, $iStarted, $iCap)
    {
        $this->query("INSERT INTO `sys_api_rate_limits` (`subject`, `bucket`, `started`, `hits`) VALUES (UNHEX(:subject), :bucket, :started, 1)
            ON DUPLICATE KEY UPDATE `hits` = LAST_INSERT_ID(IF(`started` >= :same, LEAST(`hits` + 1, :cap), 1)), `started` = GREATEST(`started`, :later)", [
            'subject' => $sSubject, 'bucket' => $sBucket, 'started' => (int)$iStarted, 'same' => (int)$iStarted, 'later' => (int)$iStarted, 'cap' => (int)$iCap,
        ]);

        // a new row gives no insert id: it is the first request of its subject
        return max(1, (int)$this->lastId());
    }

    public function pruneRateLimits($iBefore)
    {
        return $this->query("DELETE FROM `sys_api_rate_limits` WHERE `started` < :before", ['before' => (int)$iBefore]);
    }
}

/** @} */
