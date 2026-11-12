<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * API v2 rate limits: how many requests one subject may send in a minute, by kind of request.
 *
 * - The subject is the profile a signed-in request acts as, or a guest's address (an IPv6
 *   address counts as its /64 network, which is what one connection gets). The address is
 *   getVisitorIP()'s, the one the rest of the site uses for a visitor.
 * - Every operation is counted in one bucket, the one its attribute names in `limit`
 *   (BxDolApiV2Operation), or `write` for POST, PUT, PATCH and DELETE and `general` for the
 *   rest. Each bucket has its own limit, a setting (Studio > API > Settings); 0 is no limit,
 *   and sys_api_v2_rate_limit switches all of them off.
 * - Windows are fixed minutes of the clock, the same for everyone. A subject may send its limit
 *   in each, so at most twice the limit around the turn of a minute.
 * - A request over the limit is answered 429 `rate_limited` with `Retry-After`, the seconds
 *   until the next window, before anything of it runs.
 *
 * Counting is one statement per request (BxDolApiQuery::hitRateLimit) and no read. The counts
 * are in a table, not in the site's cache: the cache has no atomic increment, so requests that
 * arrive together would be counted as one, and its default engine keeps every entry as a PHP
 * file that opcache compiles again after each change.
 *
 * When the count can't be kept (the table is not there yet, the database refuses), the request
 * runs: a limit that fails must not take the API down with it.
 */
class BxDolApiV2RateLimit
{
    /** Length of a window, seconds: the limits are requests a minute. */
    const WINDOW = 60;

    const GENERAL = 'general';
    const WRITE = 'write';
    const SEARCH = 'search';
    const PREVIEW = 'preview';
    const AGENT = 'agent';
    const UPLOAD = 'upload';

    /** The setting that switches rate limits on. */
    const OPTION = 'sys_api_v2_rate_limit';

    /** Bucket => the setting with its limit, requests a minute by one subject. */
    protected static $_aOptions = [
        self::GENERAL => 'sys_api_v2_rate_limit_general',
        self::WRITE => 'sys_api_v2_rate_limit_write',
        self::SEARCH => 'sys_api_v2_rate_limit_search',
        self::PREVIEW => 'sys_api_v2_rate_limit_preview',
        self::AGENT => 'sys_api_v2_rate_limit_agent',
        self::UPLOAD => 'sys_api_v2_rate_limit_upload',
    ];

    public static function buckets()
    {
        return array_keys(self::$_aOptions);
    }

    /**
     * The setting that holds a bucket's limit, or null for a name that is not a bucket.
     */
    public static function optionOf($sBucket)
    {
        return self::$_aOptions[$sBucket] ?? null;
    }

    /**
     * The bucket an operation's requests are counted in.
     */
    public static function bucketOf(BxDolApiV2Operation $oOp)
    {
        if ($oOp->limit !== null && isset(self::$_aOptions[$oOp->limit]))
            return $oOp->limit;

        return BxDolApiV2Idempotency::isWrite($oOp->method) ? self::WRITE : self::GENERAL;
    }

    public static function isEnabled()
    {
        return getParam(self::OPTION) === 'on';
    }

    /**
     * A bucket's limit: requests a minute by one subject; 0 for no limit.
     */
    public static function limitOf($sBucket)
    {
        return isset(self::$_aOptions[$sBucket]) ? max(0, (int)getParam(self::$_aOptions[$sBucket])) : 0;
    }

    /**
     * Who a request is counted for: the profile it acts as, or a guest's address. Null when
     * there is nobody to count for: a guest whose address is not known.
     * @param string|null $sIp the request's address, getVisitorIP()'s when left out
     */
    public static function subject($iProfileId, $sIp = null)
    {
        if ((int)$iProfileId > 0)
            return 'profile:' . (int)$iProfileId;

        $sNetwork = self::network($sIp ?? getVisitorIP());
        return $sNetwork === null ? null : 'ip:' . $sNetwork;
    }

    /**
     * The address guests are counted by: an IPv4 address as it is, an IPv6 address as its /64
     * network. Null for what is not an address, and for 0.0.0.0, which is what getVisitorIP()
     * answers when it does not know: every such guest would share one count.
     */
    public static function network($sIp)
    {
        if (!is_string($sIp) || $sIp === '0.0.0.0' || !filter_var($sIp, FILTER_VALIDATE_IP))
            return null;
        if (!filter_var($sIp, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6))
            return $sIp;

        // the first 8 of an IPv6 address's 16 bytes are its /64 network
        return inet_ntop(inet_pton($sIp) & (str_repeat("\xff", 8) . str_repeat("\0", 8))) . '/64';
    }

    /**
     * When the window of a moment started.
     */
    public static function windowStart($iNow, $iWindow = self::WINDOW)
    {
        return (int)$iNow - (int)$iNow % (int)$iWindow;
    }

    /**
     * Seconds from a moment until the next window starts: 1 to the window's length.
     */
    public static function retryAfter($iNow, $iWindow = self::WINDOW)
    {
        return self::windowStart($iNow, $iWindow) + (int)$iWindow - (int)$iNow;
    }

    /**
     * What a request that is the $iHits-th of its window gets: 0 to run, or the seconds to
     * wait when it is over the limit.
     */
    public static function waitFor($iHits, $iLimit, $iNow, $iWindow = self::WINDOW)
    {
        return (int)$iHits > (int)$iLimit ? self::retryAfter($iNow, $iWindow) : 0;
    }

    /**
     * Count a request of a subject in a bucket. 0 when it may run, or the seconds to wait.
     */
    public static function hit($sSubject, $sBucket, $iLimit, $iNow = null)
    {
        $iNow = $iNow ?? time();

        // the subject is kept as a keyed digest: a fixed-size key, and no address at rest.
        // Counting stops one above the limit: that is all a refusal needs to know.
        $sKey = hash_hmac('sha256', $sSubject, BX_DOL_SECRET);
        $iHits = BxDolApiQuery::getInstance()->hitRateLimit($sKey, $sBucket, self::windowStart($iNow), (int)$iLimit + 1);

        return self::waitFor($iHits, $iLimit, $iNow);
    }

    /**
     * Count the request the router is about to run, and refuse it when it is over its limit.
     * @throws BxDolApiV2Problem 429 rate_limited, with Retry-After
     */
    public static function check(BxDolApiV2Operation $oOp, BxDolApiV2Auth $oAuth)
    {
        if (!self::isEnabled())
            return;

        $sBucket = self::bucketOf($oOp);
        $iLimit = self::limitOf($sBucket);
        if ($iLimit <= 0)
            return;

        $sSubject = self::subject($oAuth->getProfileId());
        if ($sSubject === null)
            return;

        try {
            $iWait = self::hit($sSubject, $sBucket, $iLimit);
        }
        catch (Throwable $e) {
            error_log('UNA API v2: could not count a request for its rate limit: ' . $e->getMessage());
            return;
        }

        if ($iWait > 0)
            throw self::problem($iWait);
    }

    public static function problem($iWait)
    {
        return new BxDolApiV2Problem(429, 'rate_limited', 'Too many requests; try again in ' . (int)$iWait . ' s', [], ['Retry-After' => (string)(int)$iWait]);
    }

    /**
     * Forget the counts of windows that have passed; the number deleted.
     */
    public static function prune($iNow = null)
    {
        return (int)BxDolApiQuery::getInstance()->pruneRateLimits(self::windowStart($iNow ?? time()));
    }
}

/** @} */
