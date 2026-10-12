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
    protected $_sIgnoredParams = null;

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
        if($aClient === false) {
            // a bot that runs the tracker (a headless browser): counted with the bots
            $this->collectBot($sUserAgent, $aHits[0]['url'], $sPlatform);
            return 0;
        }

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
     * Count a request from a bot. Bots don't run the tracker, so the page itself reports
     * them as it renders. They are kept as totals per day, bot and page, never as visits.
     *
     * @param string $sUserAgent the request's user agent
     * @param string $sUrl the requested URL or path
     * @param string $sPlatform where the request came to
     * @return bool whether it was a bot and was counted
     */
    public function collectBot($sUserAgent, $sUrl, $sPlatform = BX_ANALYTICS_PLATFORM_CORE_WEB)
    {
        if(!$this->_oConfig->isTrackingEnabled() || !$this->_oConfig->isTrackBots() || !$this->_oConfig->isPlatform($sPlatform))
            return false;

        $aBot = BxAnalyticsUserAgent::getBot($sUserAgent);
        if(!$aBot)
            return false;

        $aUrl = $this->_parseUrl((string)$sUrl);
        $sPath = $aUrl !== false ? $aUrl['path'] : '';
        if($sPath !== '' && $this->_isExcludedPath($sPath, $this->_oConfig->getExcludedPaths()))
            return false;

        return $this->_oDb->addBotHit(gmdate('Y-m-d', $this->_iNow), $aBot['name'], $aBot['category'], $sPlatform, $sPath, $this->_iNow);
    }

    /**
     * Record something done on the site (a sign-up, a post, a comment, a reaction) as an
     * event of type `una`, from whatever client did it. The event joins the actor's running
     * visit on that client when there is one, so funnels and journeys see it.
     *
     * @param string $sName action name: signup, login, profile_add, content_add, comment, vote, connection...
     * @param string $sModule module or object system the action happened in
     * @param int $iObjectId content, comment or profile the action is about
     * @param int $iProfileId who did it
     * @param array $aContext `platform` (otherwise worked out from the request), `api_key` (the
     *      request carries an accepted API key), `props`, `value`
     * @return bool whether it was stored
     */
    public function collectAction($sName, $sModule, $iObjectId, $iProfileId, $aContext = [])
    {
        if(!$this->_oConfig->isTrackingEnabled() || !$this->_oConfig->isTrackActions())
            return false;

        $sPlatform = !empty($aContext['platform']) ? $aContext['platform'] : $this->_oRequest->getPlatform(defined('BX_API'), !empty($aContext['api_key']));
        if(!$this->_oConfig->isPlatform($sPlatform))
            return false;

        $iProfileId = (int)$iProfileId;
        if($iProfileId && $this->_isExcludedProfile($iProfileId))
            return false;

        $iLinkedProfileId = $this->_oConfig->isLinkMembers() ? $iProfileId : 0;
        list($aVisitor, $aSession) = $this->_getRequestVisit($sPlatform, $iLinkedProfileId, !empty($aContext['api_key']));

        $aProps = isset($aContext['props']) && is_array($aContext['props']) ? $this->_getProps($aContext['props']) : [];

        $iStored = $this->_oDb->insertEvents([[
            'session_id' => !empty($aSession) ? (int)$aSession['id'] : 0,
            'visitor' => !empty($aSession) ? $aSession['visitor'] : $aVisitor['id'],
            'profile_id' => $iLinkedProfileId,
            'platform' => $sPlatform,
            'ts' => $this->_iNow,
            'type' => BX_ANALYTICS_HIT_UNA,
            'name' => get_mb_substr((string)$sName, 0, 64),
            'hostname' => '',
            'path' => '',
            'title' => '',
            'module' => get_mb_substr(preg_replace('/[^a-z0-9_]/', '', mb_strtolower((string)$sModule)), 0, 32),
            'object_id' => max(0, (int)$iObjectId),
            'context_id' => 0,
            'value' => isset($aContext['value']) && is_numeric($aContext['value']) ? (float)$aContext['value'] : 0,
            'engaged' => 0,
            'props' => empty($aProps) ? '' : json_encode($aProps, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]]);

        if($iStored && !empty($aSession))
            $this->_oDb->updateSession($aSession['id'], [
                'events' => min((int)$aSession['events'] + 1, 65535),
                'bounce' => 0,
                'last_seen' => max((int)$aSession['last_seen'], $this->_iNow),
            ]);

        return $iStored > 0;
    }

    /**
     * Whether something a member did may be tied to their visits: tracking is on and the
     * member's level isn't excluded. For the member's own request (`$bRequest`) also: its
     * platform is enabled, it doesn't ask not to be tracked (when that is respected), its
     * address isn't excluded and a browser platform isn't a bot.
     *
     * @param string $sPlatform platform of the request
     * @param int $iProfileId the member
     * @param bool $bApiKey the request carries an accepted API key
     * @param bool $bRequest the request is the member's own, not a webhook or a cron job
     */
    public function isTracked($sPlatform, $iProfileId, $bApiKey = false, $bRequest = true)
    {
        if(!$this->_oConfig->isTrackingEnabled())
            return false;

        if((int)$iProfileId && $this->_isExcludedProfile((int)$iProfileId))
            return false;

        if(!$bRequest)
            return true;

        if(!$this->_oConfig->isPlatformEnabled($sPlatform))
            return false;

        if($this->_oConfig->isRespectDnt() && $this->_oRequest->isDoNotTrack())
            return false;

        $sIp = $this->_oRequest->getIp($this->_oConfig->getTrustedProxies(), $bApiKey);
        if($sIp !== '' && BxAnalyticsRequest::inList($sIp, $this->_oConfig->getExcludedIps()))
            return false;

        if($this->_oConfig->isBrowserPlatform($sPlatform) && BxAnalyticsUserAgent::isBot($this->_oRequest->getUserAgent()))
            return false;

        return true;
    }

    /**
     * The running visit of the request's visitor on a platform, or an empty array.
     *
     * @param string $sPlatform platform of the request
     * @param int $iProfileId the signed-in member, used when members are linked to visits
     * @param bool $bApiKey the request carries an accepted API key
     */
    public function getRequestSession($sPlatform, $iProfileId, $bApiKey = false)
    {
        list(, $aSession) = $this->_getRequestVisit($sPlatform, $this->_oConfig->isLinkMembers() ? (int)$iProfileId : 0, $bApiKey);

        return $aSession;
    }

    /**
     * Visitor ids of the current request and its running visit on a platform. The server's
     * own platform has no visits: its visitor is the member, or nobody.
     *
     * @return array [visitor ids, session or []]
     */
    protected function _getRequestVisit($sPlatform, $iLinkedProfileId, $bApiKey)
    {
        if($sPlatform == BX_ANALYTICS_PLATFORM_CORE)
            return [['id' => $iLinkedProfileId ? $this->_hash('p:' . $iLinkedProfileId, BX_DOL_SECRET) : str_repeat("\0", 16)], []];

        $aVisitor = $this->_getVisitor($this->_oRequest->getIp($this->_oConfig->getTrustedProxies(), $bApiKey), $this->_oRequest->getUserAgent(), $iLinkedProfileId, '');

        // a visit that started after the action (a clock given by a test or an import) isn't its visit
        return [$aVisitor, $this->_oDb->getActiveSession($aVisitor['lookup'], $sPlatform, $this->_iNow - $this->_oConfig->getSessionTimeout(), $this->_iNow)];
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

        $aGeo = ['country' => '', 'region' => '', 'city' => '', 'lat' => null, 'lng' => null];
        if($this->_oConfig->getGeoSource() == BX_ANALYTICS_GEO_HEADERS) {
            $aCoordinates = $this->_oRequest->getCoordinates();
            $aGeo = [
                'country' => $this->_oRequest->getCountry(),
                'region' => $this->_oRequest->getRegion(),
                'city' => $this->_oRequest->getCity(),
                'lat' => $aCoordinates ? $aCoordinates[0] : null,
                'lng' => $aCoordinates ? $aCoordinates[1] : null,
            ];
        }

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
            $sIgnored = $this->_getIgnoredParamsPattern();
            $aQuery = [];
            foreach(explode('&', $aParts['query']) as $sPair) {
                if($sPair === '')
                    continue;
                $sKey = mb_strtolower(urldecode(explode('=', $sPair, 2)[0]));
                if(!in_array($sKey, $this->_aDropParams, true) && ($sIgnored === '' || !preg_match($sIgnored, $sKey)))
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
     * One regular expression for the ignored query parameters setting, or ''.
     */
    protected function _getIgnoredParamsPattern()
    {
        if($this->_sIgnoredParams !== null)
            return $this->_sIgnoredParams;

        $aPatterns = [];
        foreach($this->_oConfig->getIgnoredParams() as $sParam)
            $aPatterns[] = str_replace('\\*', '.*', preg_quote(mb_strtolower($sParam), '/'));

        return $this->_sIgnoredParams = empty($aPatterns) ? '' : '/^(' . implode('|', $aPatterns) . ')$/u';
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
