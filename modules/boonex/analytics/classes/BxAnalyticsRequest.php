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
     * Headers that carry the client address when a proxy or CDN sits in front of the site,
     * checked in this order. X-Forwarded-For can list several addresses; the first public one wins.
     */
    protected static $_aIpHeaders = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_TRUE_CLIENT_IP',
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
    ];

    /**
     * Country headers set by CDNs and hosting edges.
     */
    protected static $_aCountryHeaders = [
        'HTTP_CF_IPCOUNTRY',
        'HTTP_X_VERCEL_IP_COUNTRY',
        'HTTP_CLOUDFRONT_VIEWER_COUNTRY',
        'HTTP_X_COUNTRY_CODE',
        'HTTP_X_APPENGINE_COUNTRY',
    ];

    protected $_aServer;

    public function __construct($aServer = null)
    {
        $this->_aServer = is_array($aServer) ? $aServer : $_SERVER;
    }

    /**
     * Client address. Proxy headers count only when the request comes from a trusted proxy:
     * a private or loopback address (load balancers, the NEO server in the same network),
     * an address from the trusted list, or a request the caller has already authenticated
     * (the NEO server's API key).
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

        if(!$bTrustedRequest && !self::isPrivate($sRemote) && !self::inList($sRemote, $aTrustedProxies))
            return $sRemote;

        foreach(self::$_aIpHeaders as $sHeader) {
            $sValue = $this->_get($sHeader);
            if($sValue === '')
                continue;

            $sFirstValid = '';
            foreach(explode(',', $sValue) as $sCandidate) {
                $sCandidate = $this->_valid($sCandidate);
                if($sCandidate === '')
                    continue;
                if(!self::isPrivate($sCandidate))
                    return $sCandidate;
                if($sFirstValid === '')
                    $sFirstValid = $sCandidate;
            }

            // a private network behind a private proxy (local development, intranets)
            if($sFirstValid !== '')
                return $sFirstValid;
        }

        return $sRemote;
    }

    /**
     * ISO 3166-1 alpha-2 country from CDN headers, or ''. "XX" and "T1" (Tor) mean unknown.
     */
    public function getCountry()
    {
        foreach(self::$_aCountryHeaders as $sHeader) {
            $sValue = mb_strtoupper(trim($this->_get($sHeader)));
            if(preg_match('/^[A-Z]{2}$/', $sValue) && !in_array($sValue, ['XX', 'T1', 'ZZ'], true))
                return $sValue;
        }

        return '';
    }

    /**
     * Region and city where the edge provides them (Vercel), URL-decoded, or ''.
     */
    public function getRegion()
    {
        return $this->_clean(rawurldecode($this->_get('HTTP_X_VERCEL_IP_COUNTRY_REGION')), 64);
    }

    public function getCity()
    {
        $sCity = $this->_get('HTTP_X_VERCEL_IP_CITY');
        if($sCity === '')
            $sCity = $this->_get('HTTP_CF_IPCITY');

        return $this->_clean(rawurldecode($sCity), 64);
    }

    /**
     * Visitor coordinates from the edge (Vercel, or Cloudflare's visitor location headers),
     * rounded to one decimal (about 10 km), or null.
     *
     * @return array|null [lat, lng]
     */
    public function getCoordinates()
    {
        foreach([['HTTP_X_VERCEL_IP_LATITUDE', 'HTTP_X_VERCEL_IP_LONGITUDE'], ['HTTP_CF_IPLATITUDE', 'HTTP_CF_IPLONGITUDE']] as list($sLat, $sLng)) {
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
