<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * API v2 `Idempotency-Key`: a client that sends a write again after a dropped connection gets
 * the first answer again instead of running it twice. The rules:
 *
 * - Signed-in POST, PUT, PATCH and DELETE requests with the header are recorded by credential
 *   (a digest of the bearer token or of the session cookie) and key before they run. Guests'
 *   keys are ignored, and so are multipart requests (uploads), whose bodies are not read here.
 * - A repeat with the same method, path, query and body replays the stored answer with
 *   `Idempotent-Replayed: true`; one with a different request is 422 `idempotency_key_reused`;
 *   one while the first still runs is 409 `idempotency_in_progress` (Retry-After: 1), however
 *   long it runs: a request holds a lock on its key in the database (GET_LOCK), which the
 *   server lets go when the request's connection ends. A claim left pending for a minute whose
 *   lock is free belongs to a request that died, and a repeat runs again.
 * - Server errors, 408, 409, 425, 429, answers that set a cookie and answers larger than 1 MiB
 *   are not stored, so the client can retry them; the key is let go. Other problems (403, 404,
 *   422) are answers like any other and are replayed.
 * - Keys are kept for a day (BxDolCronPruning deletes older ones; one older than that is
 *   taken as new until then).
 *
 * An answer here is ['status' => int, 'headers' => [name => value], 'body' => string|null], as
 * BxDolApiV2Router builds it.
 */
class BxDolApiV2Idempotency
{
    const HEADER = 'Idempotency-Key';
    const REPLAYED = 'Idempotent-Replayed';

    /** Answers larger than this (bytes) run normally but are not stored. */
    const MAX_STORED = 1048576;
    /** A pending claim older than this (seconds) whose lock is free belongs to a request that died. */
    const ABANDONED = 60;
    /** How long a new claim waits (seconds) for the lock of a request that is just ending. */
    const LOCK_WAIT = 1;
    /** How long an answer is replayed (seconds). */
    const LIFETIME = 86400;

    /** Headers of an answer that are stored and replayed: all the router sets on one. */
    protected static $_aStoredHeaders = ['Content-Type', 'Location', 'ETag', 'Cache-Control', 'Vary', 'Retry-After', 'WWW-Authenticate'];

    protected $_sScope;
    protected $_sKey;
    protected $_sFingerprint;
    protected $_oDb;
    /** When this request's claim was made (or taken over): finish() changes the row only while it is still that claim. */
    protected $_iAdded = null;
    /** How many times this request took the key's lock (a connection may take its own again). */
    protected $_iLocks = 0;
    /** The claims of this process that hold a lock, let go when it ends (connections are kept). */
    protected static $_aLocked = null;

    /**
     * @param string $sScope hex sha256 of the credential (scope())
     * @param string $sKey a valid key (isValidKey())
     * @param string $sFingerprint hex sha256 of the request (fingerprint())
     */
    public function __construct($sScope, $sKey, $sFingerprint)
    {
        $this->_sScope = $sScope;
        $this->_sKey = $sKey;
        $this->_sFingerprint = $sFingerprint;
        $this->_oDb = BxDolApiQuery::getInstance();
    }

    /**
     * 1 to 255 visible ASCII characters (0x21 to 0x7e).
     */
    public static function isValidKey($sKey)
    {
        return is_string($sKey) && preg_match('/^[\x21-\x7e]{1,255}$/D', $sKey) === 1;
    }

    /**
     * Whether a request of this method may carry a key.
     */
    public static function isWrite($sMethod)
    {
        return in_array($sMethod, ['POST', 'PUT', 'PATCH', 'DELETE'], true);
    }

    /**
     * Who the key belongs to: the sha256 (hex) of the credential the request was signed in
     * with, or null when there is none to keep a key for.
     * @param string $sCredential the bearer token, or the session cookie's id
     */
    public static function scope($sMode, $sCredential)
    {
        $sCredential = (string)$sCredential;
        if ($sCredential === '' || !in_array($sMode, [BxDolApiV2Auth::MODE_TOKEN, BxDolApiV2Auth::MODE_SESSION], true))
            return null;
        // a token and a session id never stand for the same session, so they never share keys
        return hash('sha256', $sMode . "\0" . $sCredential);
    }

    /**
     * The request a key was first used for: sha256 (hex) of method NUL path NUL query NUL body.
     */
    public static function fingerprint($sMethod, $sPath, $sQuery, $sBody)
    {
        return hash('sha256', $sMethod . "\0" . $sPath . "\0" . $sQuery . "\0" . $sBody);
    }

    /**
     * Whether an answer is kept for repeats.
     * @param bool $bSetsCookie the answer sets a cookie (credentials are never stored)
     */
    public static function isStorable(array $aAnswer, $bSetsCookie)
    {
        $iStatus = (int)$aAnswer['status'];
        if ($iStatus >= 500 || in_array($iStatus, [408, 409, 425, 429], true) || $bSetsCookie)
            return false;
        // strlen counts bytes here, not characters: the limit is on the stored body's size
        return strlen((string)($aAnswer['body'] ?? '')) <= self::MAX_STORED;
    }

    /**
     * Claim the key for this request. Null: this request runs (and finish() must follow);
     * an answer: the stored one, to send again.
     * @throws BxDolApiV2Problem 422 for a key used for another request, 409 while it runs
     */
    public function claim($iNow = null)
    {
        $iNow = $iNow ?? time();
        if ($this->_oDb->claimIdempotencyKey($this->_sScope, $this->_sKey, $this->_sFingerprint, $iNow)) {
            $this->_iAdded = $iNow;
            // the lock's last holder may be ending just now (it lets the row go first)
            $this->_lock(self::LOCK_WAIT);
            return null;
        }

        $aRow = $this->_oDb->getIdempotencyKey($this->_sScope, $this->_sKey);
        if (!$aRow)
            throw self::inProgress(); // released or pruned between the two statements

        // older than a day: the key is new again, for any request
        if ((int)$aRow['added'] < $iNow - self::LIFETIME) {
            if ($this->_oDb->takeOverIdempotencyKey($this->_sScope, $this->_sKey, $this->_sFingerprint, $iNow, (int)$aRow['added'], false)) {
                $this->_iAdded = $iNow;
                $this->_lock(self::LOCK_WAIT);
                return null;
            }
            throw self::inProgress();
        }

        if (!hash_equals((string)$aRow['fingerprint'], $this->_sFingerprint))
            throw new BxDolApiV2Problem(422, 'idempotency_key_reused', 'This Idempotency-Key was used for another request');

        if ($aRow['status'] === null) {
            if ((int)$aRow['added'] >= $iNow - self::ABANDONED)
                throw self::inProgress();
            // its age alone does not say that it died (a post that fetches its links may take
            // minutes): the request that made it holds the key's lock for as long as it runs
            if (!$this->_lock(0))
                throw self::inProgress();
            // only while still pending: a first request that ends now keeps its answer
            if ($this->_oDb->takeOverIdempotencyKey($this->_sScope, $this->_sKey, $this->_sFingerprint, $iNow, (int)$aRow['added'], true)) {
                $this->_iAdded = $iNow;
                return null;
            }
            $this->_unlock();
            throw self::inProgress();
        }

        $aHeaders = [];
        $aStored = json_decode((string)$aRow['headers'], true);
        if (is_array($aStored))
            foreach ($aStored as $sName => $sValue)
                if (in_array($sName, self::$_aStoredHeaders, true) && is_string($sValue))
                    $aHeaders[$sName] = $sValue;
        // an answer kept before these headers were: what the router sets on the first one
        $aHeaders += (int)$aRow['status'] >= 400
            ? ['Cache-Control' => 'no-store']
            : ['Vary' => 'Authorization, Cookie, Accept-Language', 'Cache-Control' => 'private, no-cache'];
        $aHeaders[self::REPLAYED] = 'true';

        return [
            'status' => (int)$aRow['status'],
            'headers' => $aHeaders,
            'body' => $aRow['body'] === null || $aRow['body'] === '' ? null : (string)$aRow['body'],
        ];
    }

    /**
     * Let the key go without keeping an answer (a streamed one, which can't be sent again).
     */
    public function release()
    {
        if ($this->_iAdded === null)
            return false;
        // the row first, the lock after it: a repeat never finds a pending row with a free lock
        // while this request still has something to do with it
        try {
            return (bool)$this->_oDb->releaseIdempotencyKey($this->_sScope, $this->_sKey, $this->_iAdded);
        }
        finally {
            $this->_unlock();
        }
    }

    /**
     * After the request ran: keep its answer for repeats, or let the key go.
     */
    public function finish(array $aAnswer, $bSetsCookie)
    {
        // a claim taken over by a retry (this request lost its lock: its connection to the
        // database was made again) is the retry's now: the row is changed only while it is still
        // this request's pending claim
        if ($this->_iAdded === null)
            return false;

        try {
            if (!self::isStorable($aAnswer, $bSetsCookie)) {
                $this->_oDb->releaseIdempotencyKey($this->_sScope, $this->_sKey, $this->_iAdded);
                return false;
            }

            $aHeaders = [];
            foreach (self::$_aStoredHeaders as $sName)
                if (isset($aAnswer['headers'][$sName]))
                    $aHeaders[$sName] = (string)$aAnswer['headers'][$sName];

            return (bool)$this->_oDb->storeIdempotentAnswer($this->_sScope, $this->_sKey, $this->_iAdded, (int)$aAnswer['status'], json_encode($aHeaders, JSON_UNESCAPED_SLASHES), (string)($aAnswer['body'] ?? ''));
        }
        finally {
            // after the row has its answer (or is gone), as in release()
            $this->_unlock();
        }
    }

    /**
     * Take the key's lock for this request, at once or within $iWait seconds. Without it (the
     * server has no such locks, or another connection kept one) the claim still stands, and is
     * told from an abandoned one by its age alone.
     */
    protected function _lock($iWait)
    {
        try {
            if (!$this->_oDb->lockIdempotencyKey($this->_sScope, $this->_sKey, $iWait))
                return false;
        }
        catch (Throwable $e) {
            return false;
        }

        $this->_iLocks++;
        // connections to the database outlive requests (PDO::ATTR_PERSISTENT), and their locks
        // with them: a request that ends without finish() (a fatal error, a time limit, exit)
        // lets its locks go here
        if (self::$_aLocked === null) {
            self::$_aLocked = [];
            register_shutdown_function([__CLASS__, 'unlockAll']);
        }
        self::$_aLocked[spl_object_id($this)] = $this;
        return true;
    }

    protected function _unlock()
    {
        for (; $this->_iLocks > 0; $this->_iLocks--) {
            try {
                $this->_oDb->unlockIdempotencyKey($this->_sScope, $this->_sKey);
            }
            catch (Throwable $e) {
                // the connection is gone, and its locks with it
            }
        }
        if (self::$_aLocked !== null)
            unset(self::$_aLocked[spl_object_id($this)]);
    }

    /**
     * Let go of every lock this process still holds for a claim (when it ends).
     */
    public static function unlockAll()
    {
        foreach ((array)self::$_aLocked as $oClaim)
            $oClaim->_unlock();
    }

    /**
     * Forget keys older than a day; the number deleted.
     */
    public static function prune($iNow = null)
    {
        return (int)BxDolApiQuery::getInstance()->pruneIdempotencyKeys(($iNow ?? time()) - self::LIFETIME);
    }

    protected static function inProgress()
    {
        return new BxDolApiV2Problem(409, 'idempotency_in_progress', 'A request with this Idempotency-Key is still running; try again in a moment', [], ['Retry-After' => '1']);
    }
}

/** @} */
