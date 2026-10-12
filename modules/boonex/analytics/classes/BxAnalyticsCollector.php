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
 *
 * Health hits (see BxAnalyticsModule::serviceGetTrackerConfig for the client settings: send
 * them only when `errors` is true, and vitals only for `vitals_sample` percent of page loads):
 *
 *   {type: 'error', url, kind, message, source, line, col, stack, component_stack, fatal,
 *    repeats, status, age, deferred}
 *     kind       js (uncaught error), promise (unhandled rejection), react (error boundary),
 *                native (RN global handler), http (a request answered 500 or more), resource
 *                (a script or style that failed to load)
 *     message    the error's message, up to 500 characters (255 are kept); for http
 *                "HTTP 502 /api.php" (no query string), or empty with `status` set
 *     source, line, col   the script and position, when known
 *     stack      the stack as the runtime prints it (V8/Hermes "at fn (file:1:2)" or
 *                Firefox/Safari "fn@file:1:2"), up to 8000 characters; component_stack is
 *                React's component stack of an error boundary
 *     fatal      1 when the app or page could not go on (a root boundary, isFatal on native)
 *     repeats    how many times it happened on this page or screen, 1 to 100 (deduplicate
 *                on the client and count instead of sending each)
 *     status     HTTP status, http kind only
 *     age        milliseconds since it happened, up to 7 days: an app that crashed sends the
 *                error on its next launch with `deferred: 1` and the real age
 *   Error hits never start a visit. They join the visitor's visit on the platform they
 *   happened in (the running one, or for a deferred error the earlier one it ended), or are
 *   stored on their own (an app that crashes before its first page). At most 10 per request
 *   and 50 per visit; messages matching the ignore list are dropped. Strip query strings
 *   before sending (keep only `i` and `r`); the server strips them again and redacts tokens
 *   and emails.
 *
 *   {type: 'vitals', url, nav, metrics: {ttfb, fcp, lcp, inp, cls, screen_load, app_start}}
 *     one per page view or screen, sent once when it is left or hidden (with the leave hit);
 *     timings in milliseconds (0 to 120000), cls a score (0 to 10); leave out what wasn't
 *     measured. Web pages: ttfb, fcp, lcp, inp, cls on a full load; screen_load (and cls,
 *     inp) after a soft navigation. Apps: screen_load, from the navigation to the screen's
 *     content laid out; app_start once per cold start, from process start to the first page.
 *     nav: navigate, reload, back_forward, prerender, soft, restore.
 *   Vitals join a running visit and are dropped without one; they count no pageview or event.
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
        if(!is_array($aPayload))
            return 0;

        $aAccept = $this->_accept($aPayload, $aContext);
        if(!empty($aAccept['reasons'])) {
            // a bot that runs the tracker (a headless browser): counted with the bots
            if($aAccept['reasons'][0] == 'bot')
                $this->collectBot($aAccept['user_agent'], $aAccept['hits'][0]['url'], $aAccept['platform']);

            return 0;
        }

        $sPlatform = $aAccept['platform'];
        $aHits = $aAccept['hits'];
        $sIp = $aAccept['ip'];
        $sUserAgent = $aAccept['user_agent'];
        $aClient = $aAccept['client'];
        $iProfileId = $aAccept['profile_id'];

        $sVid = isset($aPayload['vid']) && is_string($aPayload['vid']) && preg_match('/^[a-zA-Z0-9_-]{16,64}$/', $aPayload['vid']) ? $aPayload['vid'] : '';
        $aVisitor = $this->_getVisitor($sIp, $sUserAgent, $iProfileId, $sVid);

        // what an error hit outside a visit records about the client
        $aClientRow = [
            'lookup' => $aVisitor['lookup'],
            'visitor' => $aVisitor['id'],
            'profile_id' => $iProfileId,
            'platform' => $sPlatform,
            'app_version' => $this->_string($aPayload, 'app_version', 32, '/^[a-zA-Z0-9._+ -]+$/'),
            'browser' => $aClient['browser'],
            'os' => $aClient['os'],
            'device' => $aClient['device'],
            'country' => $this->_oConfig->getGeoSource() == BX_ANALYTICS_GEO_HEADERS ? $this->_oRequest->getCountry() : '',
        ];

        $aSession = $this->_getSession($sPlatform, $aVisitor, $iProfileId, $aPayload, $aClient, $aHits);
        if(empty($aSession)) {
            // errors without a visit (an app that crashed before its first page, a beacon after
            // the visit timed out) are kept on their own; vitals belong to a page view
            $aErrors = array_filter($aHits, function($aHit) { return $aHit['type'] == BX_ANALYTICS_HIT_ERROR; });

            return $this->_storeErrors([], $aErrors, $aClientRow);
        }

        return $this->_store($aSession, $aHits, $aClientRow);
    }

    /**
     * What collect() would do with a payload, without storing anything: the reasons it would
     * drop the hits (or `ok`), and what it knows about the request. For the Setup section's
     * check of the admin's own browser.
     *
     * @param array $aPayload decoded tracker payload
     * @param array $aContext as for collect()
     * @return array reasons (tracking_off, platform_off, dnt, cross_site, excluded_path,
     *      no_hits, excluded_ip, bot, excluded_level; or ok), notes (link_members_off: stored,
     *      but not tied to the member), platform, ip (resolved), remote_addr, country_header,
     *      country, geo_source, identity
     */
    public function check($aPayload, $aContext = [])
    {
        $aAccept = $this->_accept(is_array($aPayload) ? $aPayload : [], $aContext, true);
        $aCountry = $this->_oRequest->getCountryHeader();

        return [
            'reasons' => !empty($aAccept['reasons']) ? $aAccept['reasons'] : ['ok'],
            'notes' => $aAccept['notes'],
            'platform' => $aAccept['platform'],
            'ip' => $aAccept['ip'],
            'remote_addr' => $this->_oRequest->getRemoteAddr(),
            'country_header' => $aCountry ? $aCountry['header'] : '',
            'country' => $aCountry ? $aCountry['country'] : '',
            'geo_source' => $this->_oConfig->getGeoSource(),
            'identity' => $this->_oConfig->getIdentityMode(),
        ];
    }

    /**
     * The guards of collect() in one place: whether a payload's hits are kept, and what the
     * request tells about the visitor. collect() stops at the first reason; a check collects
     * them all.
     *
     * @param bool $bAll go on after a reason, to list every one
     * @return array reasons (empty when the hits are kept), notes, platform, hits, ip,
     *      user_agent, client (false for a bot), profile_id (0 when members aren't linked)
     */
    protected function _accept($aPayload, $aContext, $bAll = false)
    {
        $aResult = [
            'reasons' => [],
            'notes' => [],
            'platform' => isset($aPayload['platform']) && is_string($aPayload['platform']) ? $aPayload['platform'] : (isset($aContext['platform']) ? $aContext['platform'] : BX_ANALYTICS_PLATFORM_API),
            'hits' => [],
            'ip' => '',
            'user_agent' => '',
            'client' => false,
            'profile_id' => 0,
        ];

        // true when the caller should stop here
        $fReject = function($sReason) use (&$aResult, $bAll) {
            $aResult['reasons'][] = $sReason;
            return !$bAll;
        };

        if(!$this->_oConfig->isTrackingEnabled() && $fReject('tracking_off'))
            return $aResult;

        // `core` is the server's own platform, never a client's
        $sPlatform = $aResult['platform'];
        if(($sPlatform == BX_ANALYTICS_PLATFORM_CORE || !$this->_oConfig->isPlatformEnabled($sPlatform)) && $fReject('platform_off'))
            return $aResult;

        if($this->_oConfig->isRespectDnt() && $this->_oRequest->isDoNotTrack() && $fReject('dnt'))
            return $aResult;

        $bSameOrigin = !empty($aContext['same_origin']);
        if($bSameOrigin && $this->_oRequest->isCrossSite() && $fReject('cross_site'))
            return $aResult;

        $aResult['hits'] = $this->_getHits($aPayload, $bSameOrigin);
        if(empty($aResult['hits']) && $fReject($this->_getNoHitsReason($aPayload)))
            return $aResult;

        $aResult['ip'] = $this->_oRequest->getIp($this->_oConfig->getTrustedProxies(), !empty($aContext['trusted']));
        if($aResult['ip'] !== '' && BxAnalyticsRequest::inList($aResult['ip'], $this->_oConfig->getExcludedIps()) && $fReject('excluded_ip'))
            return $aResult;

        $aResult['user_agent'] = $this->_oRequest->getUserAgent();
        $aResult['client'] = $this->_getClient($sPlatform, $aPayload, $aResult['user_agent']);
        if($aResult['client'] === false && !empty($aResult['hits']) && $fReject('bot'))
            return $aResult;

        $iProfileId = isset($aContext['profile_id']) ? (int)$aContext['profile_id'] : 0;
        $bExcluded = $iProfileId ? $this->_isExcludedProfile($iProfileId) : in_array(MEMBERSHIP_ID_NON_MEMBER, $this->_oConfig->getExcludedLevels(), true);
        if($bExcluded && $fReject('excluded_level'))
            return $aResult;

        if($iProfileId && !$this->_oConfig->isLinkMembers()) {
            $aResult['notes'][] = 'link_members_off';
            $iProfileId = 0;
        }
        $aResult['profile_id'] = $iProfileId;

        return $aResult;
    }

    /**
     * Why a payload has no usable hits: all of them on excluded paths, or none valid.
     */
    protected function _getNoHitsReason($aPayload)
    {
        $aInput = isset($aPayload['hits']) && is_array($aPayload['hits']) ? $aPayload['hits'] : [$aPayload];
        foreach($aInput as $aHit) {
            $aUrl = is_array($aHit) && isset($aHit['url']) && is_string($aHit['url']) ? $this->_parseUrl($aHit['url']) : false;
            if($aUrl !== false && $this->_isExcludedPath($aUrl['path'], $this->_oConfig->getExcludedPaths()))
                return 'excluded_path';
        }

        return 'no_hits';
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
     *      request carries an accepted API key), `props`, `value`, `type` (`event` for a custom
     *      event from server code, which the "track site actions" setting doesn't turn off)
     * @return bool whether it was stored (not when tracking is off, the platform isn't
     *      enabled or the member's level is excluded)
     */
    public function collectAction($sName, $sModule, $iObjectId, $iProfileId, $aContext = [])
    {
        $sType = isset($aContext['type']) && $aContext['type'] === BX_ANALYTICS_HIT_EVENT ? BX_ANALYTICS_HIT_EVENT : BX_ANALYTICS_HIT_UNA;
        if(!$this->_oConfig->isTrackingEnabled() || ($sType == BX_ANALYTICS_HIT_UNA && !$this->_oConfig->isTrackActions()))
            return false;

        $sPlatform = !empty($aContext['platform']) ? $aContext['platform'] : $this->_oRequest->getPlatform(defined('BX_API'), !empty($aContext['api_key']));
        // a platform left out of Settings > Platforms collects nothing, server events included
        if(!$this->_oConfig->isPlatformEnabled($sPlatform))
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
            'type' => $sType,
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

        // a hit that only closes a page, reports an error or a page's timings doesn't start a visit
        $aFirst = null;
        foreach($aHits as $aHit)
            if(!in_array($aHit['type'], [BX_ANALYTICS_HIT_LEAVE, BX_ANALYTICS_HIT_ERROR, BX_ANALYTICS_HIT_VITALS], true)) {
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
     *
     * @param array $aClientRow the client's columns for errors that don't belong to the visit
     */
    protected function _store($aSession, $aHits, $aClientRow = [])
    {
        $iPageviews = (int)$aSession['pageviews'];
        $iEvents = (int)$aSession['events'];
        $bBounce = (int)$aSession['bounce'] == 1;
        $sExitPath = $aSession['exit_path'];
        $iLastSeen = (int)$aSession['last_seen'];

        $aRows = [];
        $aErrors = [];
        $iStored = 0;
        foreach($aHits as $aHit) {
            if($aHit['type'] == BX_ANALYTICS_HIT_ERROR) {
                $aErrors[] = $aHit;
                if($this->_isSessionError($aSession, $aHit))
                    $iLastSeen = max($iLastSeen, $aHit['ts']);
                continue;
            }

            $iLastSeen = max($iLastSeen, $aHit['ts']);

            // a page's timings: a row of their own, no pageview or event
            if($aHit['type'] == BX_ANALYTICS_HIT_VITALS) {
                $iStored += $this->_oDb->insertVitals(array_merge([
                    'ts' => $aHit['ts'],
                    'session_id' => (int)$aSession['id'],
                    'platform' => $aSession['platform'],
                    'device' => $aSession['device'],
                    'path' => $aHit['path'],
                    'route' => $aHit['route'],
                    'nav' => $aHit['vitals']['nav'],
                ], $aHit['vitals']['metrics']));
                continue;
            }

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

        if(!empty($aErrors))
            $iStored += $this->_storeErrors($aSession, $aErrors, $aClientRow);

        return $iStored;
    }

    /**
     * Whether an error happened in the visit: not before it started (a deferred error from an
     * app's previous run, sent when it starts again, belongs to an earlier visit). A minute of
     * slack covers an error buffered before the first pageview was sent.
     */
    protected function _isSessionError($aSession, $aHit)
    {
        return !empty($aSession) && $aHit['ts'] >= (int)$aSession['started'] - 60;
    }

    /**
     * The visit an error that is not part of the running one happened in: the visitor's last
     * visit on the platform that had started by then and had not timed out. An app that
     * crashed sends the error on its next launch, often after that visit timed out.
     *
     * @return array the visit, or [] when it happened outside any
     */
    protected function _getErrorSession($aClientRow, $aHit)
    {
        if(empty($aClientRow['lookup']))
            return [];

        $iTime = (int)$aHit['ts'];
        $aSession = $this->_oDb->getActiveSession($aClientRow['lookup'], $aClientRow['platform'], $iTime - $this->_oConfig->getSessionTimeout(), $iTime + 60);

        return !empty($aSession) && $this->_isSessionError($aSession, $aHit) ? $aSession : [];
    }

    /**
     * Store error hits under their groups. One that belongs to a visit (the running one, or
     * an earlier one it happened in) raises that visit's error count, and is dropped past the
     * limit per visit.
     *
     * @param array $aSession the running visit, or [] for none
     * @param array $aErrors error hits from _getHits
     * @param array $aClientRow visitor ids (lookup), platform and client columns for errors outside a visit
     * @return int hits stored
     */
    protected function _storeErrors($aSession, $aErrors, $aClientRow)
    {
        $aRows = [];
        foreach($aErrors as $aHit) {
            $aVisit = $this->_isSessionError($aSession, $aHit) ? $aSession : $this->_getErrorSession($aClientRow, $aHit);
            $bLinked = !empty($aVisit);
            if($bLinked && !$this->_oDb->addSessionErrors($aVisit['id'], 1, $this->_oConfig->CNF['MAX_ERRORS_PER_SESSION']))
                continue;

            $iErrorId = $this->_getErrorGroup($aHit['error'], $aHit['ts']);
            if(!$iErrorId)
                continue;

            $aSource = $bLinked ? $aVisit : $aClientRow;
            $aRows[] = [
                'error_id' => $iErrorId,
                'ts' => $aHit['ts'],
                'session_id' => $bLinked ? (int)$aVisit['id'] : 0,
                'visitor' => $aSource['visitor'],
                'profile_id' => (int)$aSource['profile_id'],
                'platform' => $aSource['platform'],
                'app_version' => $aSource['app_version'],
                'browser' => $aSource['browser'],
                'os' => $aSource['os'],
                'device' => $aSource['device'],
                'country' => $aSource['country'],
                'path' => $aHit['path'],
                'route' => $aHit['route'],
                'repeats' => $aHit['error']['repeats'],
                'fatal' => $aHit['error']['fatal'],
            ];
        }

        return $this->_oDb->insertErrorHits($aRows);
    }

    /**
     * The id of an error's group, created when it is new. Past the limit of new groups an
     * hour, a new error goes to one catch-all group, so a flood of random messages can't fill
     * the table. A resolved error that happens again after it was resolved is open again.
     */
    protected function _getErrorGroup($aError, $iTime)
    {
        $sFingerprint = BxAnalyticsErrors::getFingerprint($aError);

        $aGroup = $this->_oDb->getErrorGroupByFingerprint($sFingerprint);
        if(empty($aGroup) && $this->_oDb->getErrorGroupsCreated($this->_iNow - 3600, $this->_iNow) >= $this->_oConfig->CNF['MAX_NEW_ERROR_GROUPS_PER_HOUR']) {
            $aError = ['repeats' => $aError['repeats']] + BxAnalyticsErrors::getOverflowError();
            $sFingerprint = BxAnalyticsErrors::getFingerprint($aError);
            $aGroup = $this->_oDb->getErrorGroupByFingerprint($sFingerprint);
        }

        $iId = $this->_oDb->saveErrorGroup($sFingerprint, $aError, $iTime, $this->_iNow, !empty($aGroup) ? (int)$aGroup['id'] : 0);

        if($iId && !empty($aGroup) && $aGroup['status'] == 'resolved' && $iTime > (int)$aGroup['status_changed'])
            $this->_oDb->setErrorStatus($iId, 'open', $this->_iNow, 'resolved');

        return $iId;
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

        $aTypes = [BX_ANALYTICS_HIT_PAGEVIEW, BX_ANALYTICS_HIT_EVENT, BX_ANALYTICS_HIT_LEAVE];
        if($this->_oConfig->isTrackErrors())
            $aTypes[] = BX_ANALYTICS_HIT_ERROR;
        if($this->_oConfig->isTrackVitals())
            $aTypes[] = BX_ANALYTICS_HIT_VITALS;
        $aLimits = [
            BX_ANALYTICS_HIT_ERROR => $this->_oConfig->CNF['MAX_ERRORS_PER_REQUEST'],
            BX_ANALYTICS_HIT_VITALS => $this->_oConfig->CNF['MAX_VITALS_PER_REQUEST'],
        ];

        $aHits = [];
        foreach($aInput as $aHit) {
            if(!is_array($aHit))
                continue;

            $sType = isset($aHit['type']) && is_string($aHit['type']) ? $aHit['type'] : BX_ANALYTICS_HIT_PAGEVIEW;
            if(!in_array($sType, $aTypes, true))
                continue;

            if(isset($aLimits[$sType]) && $aLimits[$sType]-- <= 0)
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

            // an error may come late: an app sends the one that stopped it when it starts again
            $iMaxAge = $sType == BX_ANALYTICS_HIT_ERROR ? $this->_oConfig->CNF['MAX_ERROR_AGE'] : 3600;
            $iAge = isset($aHit['age']) && is_numeric($aHit['age']) ? (int)$aHit['age'] : 0;
            if($sType == BX_ANALYTICS_HIT_ERROR && $iAge >= $iMaxAge * 1000)
                continue;
            $iAge = $iAge > 0 && $iAge < $iMaxAge * 1000 ? intdiv($iAge, 1000) : 0;

            $aHealth = [];
            if($sType == BX_ANALYTICS_HIT_ERROR) {
                $aHealth = ['error' => $this->_getErrorInput($aHit)];
                if($aHealth['error'] === false)
                    continue;
            }
            elseif($sType == BX_ANALYTICS_HIT_VITALS) {
                $aHealth = ['vitals' => $this->_getVitalsInput($aHit)];
                if($aHealth['vitals'] === false)
                    continue;
            }
            // errors and timings keep only the page parameters of a query string, whatever
            // the client sent
            if(!empty($aHealth)) {
                $aUrl['path'] = get_mb_substr(BxAnalyticsErrors::getCleanPath($aUrl['path']), 0, 255);
                $aHealth['route'] = BxAnalyticsErrors::getRoute($aUrl['path']);
            }

            $aProps = isset($aHit['props']) && is_array($aHit['props']) ? $this->_getProps($aHit['props']) : [];

            $aHits[] = $aHealth + [
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
     * An error hit's fields, sanitized, or false for noise, an ignored message or nothing usable.
     */
    protected function _getErrorInput($aHit)
    {
        $sKind = isset($aHit['kind']) && is_string($aHit['kind']) && $aHit['kind'] !== '' ? $aHit['kind'] : 'js';
        if(!in_array($sKind, BxAnalyticsErrors::KINDS, true))
            return false;

        $aHosts = $this->_oConfig->getInternalHosts();
        $fText = function($sKey, $iInput) use ($aHit) {
            return isset($aHit[$sKey]) && is_string($aHit[$sKey]) ? get_mb_substr($aHit[$sKey], 0, $iInput) : '';
        };

        $iStatus = $sKind == 'http' && isset($aHit['status']) && is_numeric($aHit['status']) ? min(599, max(0, (int)$aHit['status'])) : 0;

        $sMessage = BxAnalyticsErrors::sanitize($fText('message', BxAnalyticsErrors::MAX_MESSAGE_INPUT), BxAnalyticsErrors::MAX_MESSAGE, $aHosts);
        if($sMessage === '' && $iStatus)
            $sMessage = 'HTTP ' . $iStatus;
        if($sMessage === '')
            return false;

        $sSource = BxAnalyticsErrors::sanitize($fText('source', 2048), BxAnalyticsErrors::MAX_SOURCE, $aHosts);
        $sStack = BxAnalyticsErrors::sanitizeStack($fText('stack', BxAnalyticsErrors::MAX_STACK_INPUT), $fText('component_stack', BxAnalyticsErrors::MAX_STACK_INPUT), $aHosts);

        if(BxAnalyticsErrors::isNoise($sMessage, $sStack, $sSource) || BxAnalyticsErrors::isIgnored($sMessage, $this->_oConfig->getErrorsIgnore()))
            return false;

        return [
            'kind' => $sKind,
            'message' => $sMessage,
            'source' => $sSource,
            'line' => isset($aHit['line']) && is_numeric($aHit['line']) ? min(10000000, max(0, (int)$aHit['line'])) : 0,
            'col' => isset($aHit['col']) && is_numeric($aHit['col']) ? min(10000000, max(0, (int)$aHit['col'])) : 0,
            'status' => $iStatus,
            'stack' => $sStack,
            'fatal' => !empty($aHit['fatal']) ? 1 : 0,
            'repeats' => isset($aHit['repeats']) && is_numeric($aHit['repeats']) ? min(100, max(1, (int)$aHit['repeats'])) : 1,
        ];
    }

    /**
     * A vitals hit's navigation type and the metrics in range, or false when none is.
     */
    protected function _getVitalsInput($aHit)
    {
        if(!isset($aHit['metrics']) || !is_array($aHit['metrics']))
            return false;

        $aMetrics = [];
        foreach(BxAnalyticsVitals::METRICS as $sMetric) {
            $mixedValue = isset($aHit['metrics'][$sMetric]) ? BxAnalyticsVitals::getValue($sMetric, $aHit['metrics'][$sMetric]) : null;
            if($mixedValue !== null)
                $aMetrics[$sMetric] = $mixedValue;
        }
        if(empty($aMetrics))
            return false;

        $sNav = isset($aHit['nav']) && is_string($aHit['nav']) && in_array($aHit['nav'], BxAnalyticsVitals::NAVS, true) ? $aHit['nav'] : '';

        return ['nav' => $sNav, 'metrics' => $aMetrics];
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
