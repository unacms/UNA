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
 *   one while the first still runs is 409 `idempotency_in_progress` (Retry-After: 1). A claim
 *   left pending for a minute belongs to a request that died, and a repeat runs again.
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
    /** A pending claim older than this (seconds) belongs to a request that died. */
    const ABANDONED = 60;
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
            return null;
        }

        $aRow = $this->_oDb->getIdempotencyKey($this->_sScope, $this->_sKey);
        if (!$aRow)
            throw self::inProgress(); // released or pruned between the two statements

        // older than a day: the key is new again, for any request
        if ((int)$aRow['added'] < $iNow - self::LIFETIME) {
            if ($this->_oDb->takeOverIdempotencyKey($this->_sScope, $this->_sKey, $this->_sFingerprint, $iNow, (int)$aRow['added'], false)) {
                $this->_iAdded = $iNow;
                return null;
            }
            throw self::inProgress();
        }

        if (!hash_equals((string)$aRow['fingerprint'], $this->_sFingerprint))
            throw new BxDolApiV2Problem(422, 'idempotency_key_reused', 'This Idempotency-Key was used for another request');

        if ($aRow['status'] === null) {
            if ((int)$aRow['added'] >= $iNow - self::ABANDONED)
                throw self::inProgress();
            // only while still pending: a first request that ends now keeps its answer
            if ($this->_oDb->takeOverIdempotencyKey($this->_sScope, $this->_sKey, $this->_sFingerprint, $iNow, (int)$aRow['added'], true)) {
                $this->_iAdded = $iNow;
                return null;
            }
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
        return (bool)$this->_oDb->releaseIdempotencyKey($this->_sScope, $this->_sKey, $this->_iAdded);
    }

    /**
     * After the request ran: keep its answer for repeats, or let the key go.
     */
    public function finish(array $aAnswer, $bSetsCookie)
    {
        // a claim taken over by a retry (this request ran past ABANDONED) is the retry's now:
        // the row is changed only while it is still this request's pending claim
        if ($this->_iAdded === null)
            return false;

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
