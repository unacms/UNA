<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * What the HTTP request of a hit tells about the visitor: address, country, privacy signals.
 * Reads a $_SERVER-like array, so tests can pass their own.
 */
class BxAnalyticsRequest
{
    /**
     * Headers that carry the client address when a proxy or CDN sits in front of the site
     * and there is no X-Forwarded-For, checked in this order.
     */
    protected static $_aIpHeaders = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_TRUE_CLIENT_IP',
        'HTTP_X_REAL_IP',
    ];

    /**
     * The shared address space of carrier-grade NAT, where cloud load balancers (Railway)
     * connect from; PHP doesn't count it as private.
     */
    protected static $_aInternalRanges = ['100.64.0.0/10'];

    /**
     * Location headers set by CDNs and hosting edges, per edge: country, region, city and
     * coordinates. With no edge chosen, the first one found is read, in this order. An edge
     * sets its own headers and passes the others through, so a client can add another CDN's.
     */
    protected static $_aGeoHeaders = [
        'cloudflare' => [
            'country' => ['HTTP_CF_IPCOUNTRY'],
            'region' => [],
            'city' => ['HTTP_CF_IPCITY'],
            'coordinates' => [['HTTP_CF_IPLATITUDE', 'HTTP_CF_IPLONGITUDE']],
        ],
        'vercel' => [
            'country' => ['HTTP_X_VERCEL_IP_COUNTRY'],
            'region' => ['HTTP_X_VERCEL_IP_COUNTRY_REGION'],
            'city' => ['HTTP_X_VERCEL_IP_CITY'],
            'coordinates' => [['HTTP_X_VERCEL_IP_LATITUDE', 'HTTP_X_VERCEL_IP_LONGITUDE']],
        ],
        'cloudfront' => [
            'country' => ['HTTP_CLOUDFRONT_VIEWER_COUNTRY'],
            'region' => ['HTTP_CLOUDFRONT_VIEWER_COUNTRY_REGION'],
            'city' => ['HTTP_CLOUDFRONT_VIEWER_CITY'],
            'coordinates' => [['HTTP_CLOUDFRONT_VIEWER_LATITUDE', 'HTTP_CLOUDFRONT_VIEWER_LONGITUDE']],
        ],
        '' => [
            'country' => ['HTTP_CF_IPCOUNTRY', 'HTTP_X_VERCEL_IP_COUNTRY', 'HTTP_CLOUDFRONT_VIEWER_COUNTRY', 'HTTP_X_COUNTRY_CODE', 'HTTP_X_APPENGINE_COUNTRY'],
            'region' => ['HTTP_X_VERCEL_IP_COUNTRY_REGION'],
            'city' => ['HTTP_X_VERCEL_IP_CITY', 'HTTP_CF_IPCITY'],
            'coordinates' => [['HTTP_X_VERCEL_IP_LATITUDE', 'HTTP_X_VERCEL_IP_LONGITUDE'], ['HTTP_CF_IPLATITUDE', 'HTTP_CF_IPLONGITUDE']],
        ],
    ];

    protected $_aServer;

    public function __construct($aServer = null)
    {
        $this->_aServer = is_array($aServer) ? $aServer : $_SERVER;
    }

    /**
     * Client address. Proxy headers count only when the request comes from a trusted proxy:
     * a private, loopback or shared (100.64.0.0/10) address (load balancers, the NEO server in
     * the same network), an address from the trusted list, or a request the caller has
     * already authenticated (the NEO server's API key).
     *
     * X-Forwarded-For is read from the right, as core's visitor address is: each proxy
     * appends the address it got the request from, so trusted proxies are skipped and the
     * first address that isn't one is the client. Whatever is left of it came from the
     * client, which could otherwise pick any address for each request: past the rate limits
     * and the excluded addresses. CF-Connecting-IP, True-Client-IP and X-Real-IP count only
     * without X-Forwarded-For, since a proxy that doesn't set them passes the client's own.
     *
     * @param array $aTrustedProxies addresses and CIDR ranges whose proxy headers are trusted
     * @param bool $bTrustedRequest the request carries a valid API key
     * @return string an IP address, or '' when there is none
     */
    public function getIp($aTrustedProxies = [], $bTrustedRequest = false)
    {
        $sRemote = $this->_valid($this->_get('REMOTE_ADDR'));
        if($sRemote === '' && !$bTrustedRequest)
            return '';

        if(!$bTrustedRequest && !self::isTrustedProxy($sRemote, $aTrustedProxies))
            return $sRemote;

        $sForwarded = $this->_get('HTTP_X_FORWARDED_FOR');
        if($sForwarded !== '') {
            $sIp = $sRemote;
            foreach(array_reverse(explode(',', $sForwarded)) as $sCandidate) {
                if(trim($sCandidate) === '')
                    continue;

                // a hop that didn't know the address ("unknown"): nothing left of it is reliable
                $sCandidate = $this->_valid($sCandidate);
                if($sCandidate === '')
                    break;

                $sIp = $sCandidate;
                if(!self::isTrustedProxy($sCandidate, $aTrustedProxies))
                    break;
            }

            return $sIp;
        }

        foreach(self::$_aIpHeaders as $sHeader) {
            $sIp = $this->_valid($this->_get($sHeader));
            if($sIp !== '')
                return $sIp;
        }

        return $sRemote;
    }

    /**
     * Whether the proxy headers of a request from an address are trusted: a private,
     * loopback or shared address, or one in the trusted list.
     */
    public static function isTrustedProxy($sIp, $aTrustedProxies = [])
    {
        return self::isPrivate($sIp) || self::inList($sIp, self::$_aInternalRanges) || self::inList($sIp, $aTrustedProxies);
    }

    /**
     * The address the request came from, before any proxy header is read, or ''.
     */
    public function getRemoteAddr()
    {
        return $this->_valid($this->_get('REMOTE_ADDR'));
    }

    /**
     * ISO 3166-1 alpha-2 country from CDN headers, or ''. "XX" and "T1" (Tor) mean unknown.
     *
     * @param string $sEdge the CDN whose headers are read (cloudflare, vercel, cloudfront), '' for any
     */
    public function getCountry($sEdge = '')
    {
        $aCountry = $this->getCountryHeader($sEdge);

        return $aCountry ? $aCountry['country'] : '';
    }

    /**
     * The CDN header the country comes from and its value, or null when there is none.
     *
     * @param string $sEdge as for getCountry()
     * @return array|null header (as in $_SERVER) and country
     */
    public function getCountryHeader($sEdge = '')
    {
        foreach(self::_getGeoHeaders($sEdge, 'country') as $sHeader) {
            $sValue = mb_strtoupper(trim($this->_get($sHeader)));
            if(preg_match('/^[A-Z]{2}$/', $sValue) && !in_array($sValue, ['XX', 'T1', 'ZZ'], true))
                return ['header' => $sHeader, 'country' => $sValue];
        }

        return null;
    }

    /**
     * Region and city where the edge provides them, URL-decoded, or ''.
     *
     * @param string $sEdge as for getCountry()
     */
    public function getRegion($sEdge = '')
    {
        return $this->_clean(rawurldecode($this->_getFirst(self::_getGeoHeaders($sEdge, 'region'))), 64);
    }

    public function getCity($sEdge = '')
    {
        return $this->_clean(rawurldecode($this->_getFirst(self::_getGeoHeaders($sEdge, 'city'))), 64);
    }

    /**
     * Visitor coordinates from the edge (Vercel, CloudFront, or Cloudflare's visitor location
     * headers), rounded to one decimal (about 10 km), or null.
     *
     * @param string $sEdge as for getCountry()
     * @return array|null [lat, lng]
     */
    public function getCoordinates($sEdge = '')
    {
        foreach(self::_getGeoHeaders($sEdge, 'coordinates') as list($sLat, $sLng)) {
            $sLatValue = $this->_get($sLat);
            $sLngValue = $this->_get($sLng);
            if(!is_numeric($sLatValue) || !is_numeric($sLngValue))
                continue;

            $fLat = (float)$sLatValue;
            $fLng = (float)$sLngValue;
            if($fLat < -90 || $fLat > 90 || $fLng < -180 || $fLng > 180)
                continue;

            return [round($fLat, 1), round($fLng, 1)];
        }

        return null;
    }

    /**
     * The client of the current request, for actions recorded on the server.
     * - no request (cron, background jobs, command line): core
     * - a page or form of the classic UI: core-web
     * - NEO says which client it is in X-Neo-Platform (web, ios, android)
     * - otherwise the NEO web server is the request with the API key, and the native apps
     *   are told apart by their HTTP stack (CFNetwork on iOS, okhttp on Android)
     * - any other API client: api
     *
     * @param bool $bApi the request came through api.php
     * @param bool $bApiKey it carries an API key api.php accepted
     */
    public function getPlatform($bApi, $bApiKey = false)
    {
        // cron and the command line have no request method
        if($this->_get('REQUEST_METHOD') === '')
            return BX_ANALYTICS_PLATFORM_CORE;

        if(!$bApi)
            return BX_ANALYTICS_PLATFORM_CORE_WEB;

        $aNeo = [
            'web' => BX_ANALYTICS_PLATFORM_NEXT_WEB,
            'ios' => BX_ANALYTICS_PLATFORM_RN_IOS,
            'android' => BX_ANALYTICS_PLATFORM_RN_ANDROID,
        ];
        $sNeo = mb_strtolower($this->_get('HTTP_X_NEO_PLATFORM'));
        if(isset($aNeo[$sNeo]))
            return $aNeo[$sNeo];

        if($bApiKey)
            return BX_ANALYTICS_PLATFORM_NEXT_WEB;

        $sUserAgent = $this->_get('HTTP_USER_AGENT');
        if($this->_get('HTTP_ORIGIN') !== '') {
            if(preg_match('/CFNetwork|Darwin/i', $sUserAgent))
                return BX_ANALYTICS_PLATFORM_RN_IOS;
            if(preg_match('/okhttp|Dalvik/i', $sUserAgent))
                return BX_ANALYTICS_PLATFORM_RN_ANDROID;
        }

        return BX_ANALYTICS_PLATFORM_API;
    }

    public function getUserAgent()
    {
        return $this->_clean($this->_get('HTTP_USER_AGENT'), 512);
    }

    public function getLanguage()
    {
        $sValue = $this->_get('HTTP_ACCEPT_LANGUAGE');
        if(!preg_match('/^\s*([a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,4})?)/', $sValue, $aMatch))
            return '';

        return $aMatch[1];
    }

    /**
     * The browser asks not to be tracked: Do Not Track or Global Privacy Control.
     */
    public function isDoNotTrack()
    {
        return $this->_get('HTTP_DNT') === '1' || $this->_get('HTTP_SEC_GPC') === '1';
    }

    /**
     * The request comes from another site's page, which a same-origin tracker never does.
     * Browsers send Sec-Fetch-Site with fetch and sendBeacon; old ones send nothing, which passes.
     */
    public function isCrossSite()
    {
        $sSite = mb_strtolower($this->_get('HTTP_SEC_FETCH_SITE'));
        return $sSite === 'cross-site';
    }

    public static function isPrivate($sIp)
    {
        if(!filter_var($sIp, FILTER_VALIDATE_IP))
            return false;

        return filter_var($sIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false;
    }

    /**
     * Whether an address matches a list of addresses and CIDR ranges (IPv4 and IPv6).
     */
    public static function inList($sIp, $aList)
    {
        $sIpBin = @inet_pton($sIp);
        if($sIpBin === false)
            return false;

        foreach($aList as $sEntry) {
            $sEntry = trim($sEntry);
            if($sEntry === '')
                continue;

            $iBits = null;
            if(bx_mb_strpos($sEntry, '/') !== false)
                list($sEntry, $iBits) = explode('/', $sEntry, 2);

            $sNetBin = @inet_pton($sEntry);
            if($sNetBin === false || strlen($sNetBin) != strlen($sIpBin))
                continue;

            if($iBits === null || $iBits === '') {
                if($sNetBin === $sIpBin)
                    return true;
                continue;
            }

            $iBits = (int)$iBits;
            $iBytes = intdiv($iBits, 8);
            if(substr($sNetBin, 0, $iBytes) !== substr($sIpBin, 0, $iBytes))
                continue;

            $iRest = $iBits % 8;
            if($iRest == 0)
                return true;

            $iMask = (0xFF << (8 - $iRest)) & 0xFF;
            if((ord($sNetBin[$iBytes]) & $iMask) === (ord($sIpBin[$iBytes]) & $iMask))
                return true;
        }

        return false;
    }

    protected function _get($sKey)
    {
        return isset($this->_aServer[$sKey]) && is_string($this->_aServer[$sKey]) ? trim($this->_aServer[$sKey]) : '';
    }

    /**
     * The first of some headers that isn't empty, or ''.
     */
    protected function _getFirst($aKeys)
    {
        foreach($aKeys as $sKey)
            if(($sValue = $this->_get($sKey)) !== '')
                return $sValue;

        return '';
    }

    /**
     * Location headers of an edge ('' for any) of a kind: country, region, city, coordinates.
     * An unknown edge has none.
     */
    protected static function _getGeoHeaders($sEdge, $sKind)
    {
        $sEdge = (string)$sEdge;

        return isset(self::$_aGeoHeaders[$sEdge][$sKind]) ? self::$_aGeoHeaders[$sEdge][$sKind] : [];
    }

    protected function _valid($sIp)
    {
        $sIp = trim((string)$sIp);

        // "1.2.3.4:5678" and "[::1]:5678" from some proxies
        if(preg_match('/^\[([0-9a-f:.]+)\](?::\d+)?$/i', $sIp, $aMatch))
            $sIp = $aMatch[1];
        elseif(preg_match('/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/', $sIp, $aMatch))
            $sIp = $aMatch[1];

        return filter_var($sIp, FILTER_VALIDATE_IP) ? $sIp : '';
    }

    protected function _clean($s, $iMaxLength)
    {
        $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$s));

        return get_mb_substr($s, 0, $iMaxLength);
    }
}

/** @} */
