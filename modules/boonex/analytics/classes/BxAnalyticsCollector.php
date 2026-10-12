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

define('BX_ANALYTICS_HIT_PAGEVIEW', 'pageview');
define('BX_ANALYTICS_HIT_EVENT', 'event');
define('BX_ANALYTICS_HIT_LEAVE', 'leave');

/**
 * Takes a batch of hits from a tracker, decides whether to keep them, adds what the server
 * knows (visitor id, member, country, browser, traffic source) and writes sessions and events.
 *
 * Payload, as JSON from the classic tracker, NEO or any API client:
 *   platform     core-web | next-web | rn-ios | rn-android | api
 *   app, app_version   bundle id or client name and its version (apps)
 *   referrer     document.referrer or the app's referrer, for a new session
 *   language     navigator.language
 *   screen       "1440x900"
 *   vid          random visitor id kept by the client, used in persistent identity mode only
 *   os, os_version, device   sent by native apps, which have no browser user agent
 *   hits         list of {type: pageview|event|leave, url, title, name, value, props, engaged,
 *                module, object_id, context_id, age}; one hit may also be given at the top level
 */
class BxAnalyticsCollector
{
    protected $_oModule;
    protected $_oConfig;
    protected $_oDb;
    protected $_oRequest;
    protected $_iNow;

    protected $_aSalts = [];

    /**
     * Query parameters removed from stored paths: campaign tags and click ids are in the
     * session's source already, and would split one page into many rows.
     */
    protected $_aDropParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
        'gclid', 'gbraid', 'wbraid', 'dclid', 'msclkid', 'fbclid', 'ttclid', 'twclid', 'li_fat_id',
        'yclid', 'mc_cid', 'mc_eid', 'igshid', 'sccid', 'epik', '_ga', '_gl', 'ref', 'source', '_r', '_t',
    ];

    public function __construct($oModule, $oRequest = null, $iNow = null)
    {
        $this->_oModule = $oModule;
        $this->_oConfig = $oModule->_oConfig;
        $this->_oDb = $oModule->_oDb;
        $this->_oRequest = $oRequest ? $oRequest : new BxAnalyticsRequest();
        $this->_iNow = $iNow ? (int)$iNow : time();
    }

    /**
     * @param array $aPayload decoded tracker payload, see the class description
     * @param array $aContext what the entry point knows: `platform` (default when the payload
     *      has none), `trusted` (the request carries a valid API key), `profile_id` (signed-in
     *      profile), `same_origin` (hits must come from the site's own pages)
     * @return int number of hits stored
     */
    public function collect($aPayload, $aContext = [])
    {
        if(!is_array($aPayload) || !$this->_oConfig->isTrackingEnabled())
            return 0;

        $sPlatform = isset($aPayload['platform']) && is_string($aPayload['platform']) ? $aPayload['platform'] : (isset($aContext['platform']) ? $aContext['platform'] : BX_ANALYTICS_PLATFORM_API);
        // `core` is the server's own platform, never a client's
        if($sPlatform == BX_ANALYTICS_PLATFORM_CORE || !$this->_oConfig->isPlatformEnabled($sPlatform))
            return 0;

        if($this->_oConfig->isRespectDnt() && $this->_oRequest->isDoNotTrack())
            return 0;

        $bSameOrigin = !empty($aContext['same_origin']);
        if($bSameOrigin && $this->_oRequest->isCrossSite())
            return 0;

        $aHits = $this->_getHits($aPayload, $bSameOrigin);
        if(empty($aHits))
            return 0;

        $sIp = $this->_oRequest->getIp($this->_oConfig->getTrustedProxies(), !empty($aContext['trusted']));
        if($sIp !== '' && BxAnalyticsRequest::inList($sIp, $this->_oConfig->getExcludedIps()))
            return 0;

        $sUserAgent = $this->_oRequest->getUserAgent();
        $aClient = $this->_getClient($sPlatform, $aPayload, $sUserAgent);
        if($aClient === false)
            return 0;

        $iProfileId = isset($aContext['profile_id']) ? (int)$aContext['profile_id'] : 0;
        if($iProfileId && $this->_isExcludedProfile($iProfileId))
            return 0;
        if(!$iProfileId && in_array(MEMBERSHIP_ID_NON_MEMBER, $this->_oConfig->getExcludedLevels(), true))
            return 0;
        if(!$this->_oConfig->isLinkMembers())
            $iProfileId = 0;

        $sVid = isset($aPayload['vid']) && is_string($aPayload['vid']) && preg_match('/^[a-zA-Z0-9_-]{16,64}$/', $aPayload['vid']) ? $aPayload['vid'] : '';
        $aVisitor = $this->_getVisitor($sIp, $sUserAgent, $iProfileId, $sVid);

        $aSession = $this->_getSession($sPlatform, $aVisitor, $iProfileId, $aPayload, $aClient, $aHits);
        if(empty($aSession))
            return 0;

        return $this->_store($aSession, $aHits);
    }

    /**
     * Visitor ids for a hit: `id` to store, `lookup` to find a running session.
     * Members get one id across devices and days. Persistent mode uses the client's own id.
     * Cookieless mode hashes the address and user agent with a salt that changes daily, and
     * also checks yesterday's id so a visit doesn't split at midnight.
     */
    protected function _getVisitor($sIp, $sUserAgent, $iProfileId, $sVid)
    {
        $sToday = gmdate('Y-m-d', $this->_iNow);
        $sYesterday = gmdate('Y-m-d', $this->_iNow - 86400);

        $aAnonymous = [
            $this->_hash($sIp . '|' . $sUserAgent, $this->_getSalt($sToday)),
            $this->_hash($sIp . '|' . $sUserAgent, $this->_getSalt($sYesterday)),
        ];

        if($sVid !== '' && $this->_oConfig->getIdentityMode() == BX_ANALYTICS_IDENTITY_PERSISTENT)
            $aAnonymous = [$this->_hash('v:' . $sVid, BX_DOL_SECRET)];

        if($iProfileId) {
            $sMember = $this->_hash('p:' . $iProfileId, BX_DOL_SECRET);
            return ['id' => $sMember, 'lookup' => array_merge([$sMember], $aAnonymous), 'anonymous' => $aAnonymous];
        }

        return ['id' => $aAnonymous[0], 'lookup' => $aAnonymous, 'anonymous' => $aAnonymous];
    }

    /**
     * The visitor's running session on this platform, or a new one. A guest session that
     * signs in continues as the member's.
     */
    protected function _getSession($sPlatform, $aVisitor, $iProfileId, $aPayload, $aClient, $aHits)
    {
        $aSession = $this->_oDb->getActiveSession($aVisitor['lookup'], $sPlatform, $this->_iNow - $this->_oConfig->getSessionTimeout());
        if(!empty($aSession)) {
            if($iProfileId && !(int)$aSession['profile_id'] && $aSession['visitor'] !== $aVisitor['id']) {
                $this->_oDb->updateSession($aSession['id'], ['profile_id' => $iProfileId, 'visitor' => $aVisitor['id']]);
                $aSession['profile_id'] = $iProfileId;
                $aSession['visitor'] = $aVisitor['id'];
            }
            return $aSession;
        }

        // a hit that only closes a page doesn't start a visit
        $aFirst = null;
        foreach($aHits as $aHit)
            if($aHit['type'] != BX_ANALYTICS_HIT_LEAVE) {
                $aFirst = $aHit;
                break;
            }
        if($aFirst === null)
            return [];

        $sReferrer = isset($aPayload['referrer']) && is_string($aPayload['referrer']) ? $aPayload['referrer'] : '';
        $aSource = BxAnalyticsSource::classify($sReferrer, $aFirst['url'], $this->_oConfig->getInternalHosts());

        $sLanguage = isset($aPayload['language']) && is_string($aPayload['language']) && preg_match('/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})?$/', $aPayload['language']) ? $aPayload['language'] : $this->_oRequest->getLanguage();
        $sScreen = isset($aPayload['screen']) && is_string($aPayload['screen']) && preg_match('/^\d{2,5}x\d{2,5}$/', $aPayload['screen']) ? $aPayload['screen'] : '';

        $aGeo = ['country' => '', 'region' => '', 'city' => ''];
        if($this->_oConfig->getGeoSource() == BX_ANALYTICS_GEO_HEADERS)
            $aGeo = [
                'country' => $this->_oRequest->getCountry(),
                'region' => $this->_oRequest->getRegion(),
                'city' => $this->_oRequest->getCity(),
            ];

        $iStarted = $aFirst['ts'];
        $aSession = array_merge([
            'visitor' => $aVisitor['id'],
            'profile_id' => $iProfileId,
            'platform' => $sPlatform,
            'app' => $this->_string($aPayload, 'app', 64, '/^[a-zA-Z0-9._ -]+$/'),
            'app_version' => $this->_string($aPayload, 'app_version', 32, '/^[a-zA-Z0-9._+ -]+$/'),
            'started' => $iStarted,
            'last_seen' => $iStarted,
            'duration' => 0,
            'pageviews' => 0,
            'events' => 0,
            'bounce' => 1,
            'hostname' => $aFirst['hostname'],
            'entry_path' => $aFirst['path'],
            'exit_path' => $aFirst['path'],
            'language' => get_mb_substr($sLanguage, 0, 16),
            'screen' => $sScreen,
        ], $aSource, $aGeo, $aClient);

        unset($aSession['bot']);

        $aSession['id'] = $this->_oDb->insertSession($aSession);
        if(!$aSession['id'])
            return [];

        return $aSession;
    }

    /**
     * Write the hits and update the session's counters in one query.
     */
    protected function _store($aSession, $aHits)
    {
        $iPageviews = (int)$aSession['pageviews'];
        $iEvents = (int)$aSession['events'];
        $bBounce = (int)$aSession['bounce'] == 1;
        $sExitPath = $aSession['exit_path'];
        $iLastSeen = (int)$aSession['last_seen'];

        $aRows = [];
        $iStored = 0;
        foreach($aHits as $aHit) {
            $iLastSeen = max($iLastSeen, $aHit['ts']);

            if($aHit['type'] == BX_ANALYTICS_HIT_LEAVE) {
                if($aHit['engaged'] > 0)
                    $this->_oDb->addEngagedTime($aSession['id'], $aHit['path'], $aHit['engaged'], $this->_oConfig->CNF['MAX_ENGAGED_MS']);
                $iStored++;
                continue;
            }

            if($aHit['type'] == BX_ANALYTICS_HIT_PAGEVIEW) {
                $iPageviews++;
                $sExitPath = $aHit['path'];
                if($iPageviews > 1)
                    $bBounce = false;
            }
            else {
                $iEvents++;
                if(empty($aHit['non_interactive']))
                    $bBounce = false;
            }

            $aRows[] = [
                'session_id' => $aSession['id'],
                'visitor' => $aSession['visitor'],
                'profile_id' => (int)$aSession['profile_id'],
                'platform' => $aSession['platform'],
                'ts' => $aHit['ts'],
                'type' => $aHit['type'],
                'name' => $aHit['name'],
                'hostname' => $aHit['hostname'],
                'path' => $aHit['path'],
                'title' => $aHit['title'],
                'module' => $aHit['module'],
                'object_id' => $aHit['object_id'],
                'context_id' => $aHit['context_id'],
                'value' => $aHit['value'],
                'engaged' => 0,
                'props' => $aHit['props'],
            ];
        }

        if(!empty($aRows))
            $iStored += $this->_oDb->insertEvents($aRows);

        $this->_oDb->updateSession($aSession['id'], [
            'last_seen' => $iLastSeen,
            'duration' => max((int)$aSession['duration'], $iLastSeen - (int)$aSession['started']),
            'pageviews' => min($iPageviews, 65535),
            'events' => min($iEvents, 65535),
            'bounce' => $bBounce ? 1 : 0,
            'exit_path' => $sExitPath,
        ]);

        return $iStored;
    }

    /**
     * Validated hits from a payload. A hit without a usable URL, or from another site when
     * `$bSameOrigin`, is dropped, and so is one on an excluded path.
     */
    protected function _getHits($aPayload, $bSameOrigin)
    {
        $aInput = isset($aPayload['hits']) && is_array($aPayload['hits']) ? array_values($aPayload['hits']) : [$aPayload];
        $aInput = array_slice($aInput, 0, $this->_oConfig->CNF['MAX_HITS_PER_REQUEST']);

        $aInternalHosts = $this->_oConfig->getInternalHosts();
        $aExcludedPaths = $this->_oConfig->getExcludedPaths();
        $sPlatform = isset($aPayload['platform']) ? $aPayload['platform'] : '';
        $sApp = $this->_string($aPayload, 'app', 64, '/^[a-zA-Z0-9._ -]+$/');

        $aHits = [];
        foreach($aInput as $aHit) {
            if(!is_array($aHit))
                continue;

            $sType = isset($aHit['type']) && is_string($aHit['type']) ? $aHit['type'] : BX_ANALYTICS_HIT_PAGEVIEW;
            if(!in_array($sType, [BX_ANALYTICS_HIT_PAGEVIEW, BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_LEAVE], true))
                continue;

            $aUrl = $this->_parseUrl(isset($aHit['url']) && is_string($aHit['url']) ? $aHit['url'] : '');
            if($aUrl === false)
                continue;

            // native apps send paths; their "host" is the app
            if($aUrl['hostname'] === '' && $this->_oConfig->isAppPlatform($sPlatform))
                $aUrl['hostname'] = mb_strtolower($sApp);

            if($bSameOrigin && !in_array($aUrl['hostname'], array_map('strtolower', $aInternalHosts), true))
                continue;

            if($this->_isExcludedPath($aUrl['path'], $aExcludedPaths))
                continue;

            $sName = '';
            if($sType == BX_ANALYTICS_HIT_EVENT) {
                $sName = $this->_string($aHit, 'name', 64, '/^[\p{L}\p{N} _.:\/-]+$/u');
                if($sName === '')
                    continue;
            }

            $iAge = isset($aHit['age']) ? (int)$aHit['age'] : 0;
            $iAge = $iAge > 0 && $iAge < 3600 * 1000 ? intdiv($iAge, 1000) : 0;

            $aProps = isset($aHit['props']) && is_array($aHit['props']) ? $this->_getProps($aHit['props']) : [];

            $aHits[] = [
                'type' => $sType,
                'name' => $sName,
                'url' => $aUrl['url'],
                'hostname' => $aUrl['hostname'],
                'path' => $aUrl['path'],
                'title' => $this->_string($aHit, 'title', 255),
                'module' => $this->_string($aHit, 'module', 32, '/^[a-z0-9_]+$/'),
                'object_id' => isset($aHit['object_id']) ? max(0, (int)$aHit['object_id']) : 0,
                'context_id' => isset($aHit['context_id']) ? abs((int)$aHit['context_id']) : 0,
                'value' => isset($aHit['value']) && is_numeric($aHit['value']) ? (float)$aHit['value'] : 0,
                'engaged' => isset($aHit['engaged']) ? min(max(0, (int)$aHit['engaged']), $this->_oConfig->CNF['MAX_ENGAGED_MS']) : 0,
                'props' => empty($aProps) ? '' : json_encode($aProps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                'non_interactive' => !empty($aHit['non_interactive']),
                'ts' => $this->_iNow - $iAge,
            ];
        }

        return $aHits;
    }

    /**
     * Browser, system and device of the client, or false for a bot. Browsers are read from the
     * user agent; native apps report their system and device themselves.
     */
    protected function _getClient($sPlatform, $aPayload, $sUserAgent)
    {
        if(!$this->_oConfig->isAppPlatform($sPlatform)) {
            $aUserAgent = BxAnalyticsUserAgent::parse($sUserAgent);
            if($aUserAgent['bot'] && $sPlatform != BX_ANALYTICS_PLATFORM_API)
                return false;

            return $aUserAgent;
        }

        $sDevice = $this->_string($aPayload, 'device', 16, '/^[a-z]+$/');
        if(!in_array($sDevice, [BxAnalyticsUserAgent::DEVICE_MOBILE, BxAnalyticsUserAgent::DEVICE_TABLET, BxAnalyticsUserAgent::DEVICE_DESKTOP, BxAnalyticsUserAgent::DEVICE_TV], true))
            $sDevice = BxAnalyticsUserAgent::DEVICE_MOBILE;

        $sOs = $this->_string($aPayload, 'os', 32, '/^[a-zA-Z0-9 ]+$/');
        if($sOs === '')
            $sOs = $sPlatform == BX_ANALYTICS_PLATFORM_RN_IOS ? ($sDevice == BxAnalyticsUserAgent::DEVICE_TABLET ? 'iPadOS' : 'iOS') : 'Android';

        return [
            'browser' => '',
            'browser_version' => '',
            'os' => $sOs,
            'os_version' => $this->_string($aPayload, 'os_version', 16, '/^[0-9.]+$/'),
            'device' => $sDevice,
            'bot' => false,
        ];
    }

    protected function _isExcludedProfile($iProfileId)
    {
        $aExcluded = $this->_oConfig->getExcludedLevels();
        if(empty($aExcluded))
            return false;

        $aMembership = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);

        return !empty($aMembership['id']) && in_array((int)$aMembership['id'], $aExcluded, true);
    }

    /**
     * Excluded paths are prefixes, or patterns with * for any characters.
     */
    protected function _isExcludedPath($sPath, $aExcluded)
    {
        foreach($aExcluded as $sPattern) {
            if(bx_mb_strpos($sPattern, '*') === false) {
                if(bx_mb_strpos($sPath, $sPattern) === 0)
                    return true;
                continue;
            }

            if(preg_match('/^' . str_replace('\*', '.*', preg_quote($sPattern, '/')) . '$/', $sPath))
                return true;
        }

        return false;
    }

    /**
     * Host, path and full URL of a hit. The path keeps its query string, because classic
     * pages are told apart by it (page.php?i=view-post&id=5), but drops tracking parameters.
     *
     * @return array|false
     */
    protected function _parseUrl($sUrl)
    {
        $sUrl = trim($sUrl);
        if($sUrl === '' || get_mb_len($sUrl) > 2048)
            return false;

        $aParts = parse_url($sUrl);
        if($aParts === false)
            return false;

        if(isset($aParts['scheme']) && !in_array(mb_strtolower($aParts['scheme']), ['http', 'https'], true))
            return false;

        $sPath = isset($aParts['path']) && $aParts['path'] !== '' ? $aParts['path'] : '/';
        if($sPath[0] !== '/')
            $sPath = '/' . $sPath;

        if(!empty($aParts['query'])) {
            $aQuery = [];
            foreach(explode('&', $aParts['query']) as $sPair) {
                if($sPair === '')
                    continue;
                $sKey = mb_strtolower(urldecode(explode('=', $sPair, 2)[0]));
                if(!in_array($sKey, $this->_aDropParams, true))
                    $aQuery[] = $sPair;
            }
            if(!empty($aQuery))
                $sPath .= '?' . implode('&', $aQuery);
        }

        return [
            'url' => $sUrl,
            'hostname' => isset($aParts['host']) ? mb_strtolower($aParts['host']) : '',
            'path' => get_mb_substr(rawurldecode($sPath), 0, 255),
        ];
    }

    /**
     * Scalar properties only, with short keys, within the size limit.
     */
    protected function _getProps($aProps)
    {
        $aResult = [];
        foreach($aProps as $sKey => $mixedValue) {
            if(count($aResult) >= 30)
                break;

            if(!is_string($sKey) || !preg_match('/^[a-zA-Z0-9_.-]{1,40}$/', $sKey))
                continue;

            if(is_bool($mixedValue) || is_int($mixedValue) || is_float($mixedValue))
                $aResult[$sKey] = $mixedValue;
            elseif(is_string($mixedValue))
                $aResult[$sKey] = get_mb_substr($mixedValue, 0, 255);
        }

        while(!empty($aResult) && get_mb_len(json_encode($aResult, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) > $this->_oConfig->CNF['MAX_PROPS_LENGTH'])
            array_pop($aResult);

        return $aResult;
    }

    protected function _getSalt($sDay)
    {
        if(!isset($this->_aSalts[$sDay]))
            $this->_aSalts[$sDay] = $this->_oDb->getSalt($sDay);

        return $this->_aSalts[$sDay];
    }

    /**
     * 16-byte visitor id.
     */
    protected function _hash($sValue, $sKey)
    {
        // a binary digest, not text
        return substr(hash_hmac('sha256', $sValue, $sKey, true), 0, 16);
    }

    protected function _string($a, $sKey, $iMaxLength, $sPattern = '')
    {
        if(!isset($a[$sKey]) || !is_string($a[$sKey]))
            return '';

        $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $a[$sKey]));
        $s = get_mb_substr($s, 0, $iMaxLength);
        if($s === '' || ($sPattern && !preg_match($sPattern, $s)))
            return '';

        return $s;
    }
}

/** @} */
