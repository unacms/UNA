<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Events: the router finds this class only while the module is enabled.
 *
 * An event is a context profile like a group (Profile.kind `group`, module `bx_events`): its id
 * is its profile id, its feed is GET /profiles/{id}/timeline and a
 * post goes into it with POST /feed-posts `context_id`. Going to an event is being in it: PUT
 * /events/{id}/rsvp `going` joins it through the groups base (BxBaseModGroupsApiV2), with the
 * module's own checks, approval and alerts, and DELETE leaves it. The shape is an Event,
 * with what a context has besides (visibility, join policy, the viewer's membership).
 *
 * Lists are the module's own search result in its modes (`upcoming`, which counts repeating
 * events that still repeat, `past`, `context`, `joined_entries`), with its privacy conditions,
 * ordered by the start, and each event is checked as GET /events/{id} checks it.
 */
class BxEventsApiV2 extends BxBaseModGroupsApiV2
{
    const API_TAG = 'events';
    const API_KIND = 'event';
    const API_NOUN = 'event';

    /** GET /layout/resolve: Upcoming, Past and the viewer's events, as the lists of GET /events and /me/events. */
    const PAGE_BLOCK_LISTS = [
        'browse_upcoming_profiles' => ['list', '/events', ['when' => 'upcoming']],
        'browse_past_profiles' => ['list', '/events', ['when' => 'past']],
        'browse_joined_entries' => ['joined', '/me/events', ['when' => 'upcoming']],
    ];

    /** GET /layout/resolve: an event's Participants block (`fans`) is who is going. */
    const PAGE_BLOCK_MEMBERS = '/events/{id}/attendees';

    /** Whether the Event being mapped carries `body_html` (single-event answers only). */
    protected $_bBody = false;

    public function __construct()
    {
        parent::__construct('bx_events');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/events', id: 'listEvents', tag: 'events', paged: true,
        summary: 'Events the viewer may find, upcoming ones first',
        description: '`when=upcoming` (the default) lists the events that have not ended, ongoing ones and repeating ones that still repeat included, by their start, soonest first; `past` the ones that ended, the latest start first. `from` and `to` keep the events that overlap that time (a month for a calendar), by their start; with them `when` is only applied when sent. Public events, ones for site members when signed in, and closed ones (name, dates and picture only, `content_visible` false), as the site\'s browse lists; secret events are never listed here. `author` keeps the events a profile made (their public ones, as on their profile page); `context` the events in a group or space (v2 also takes it as `context_id`, the name GET /discussions uses), to those who may see its content: 422 `not_found` for an id that is no context or one the viewer may not know of (a secret one from outside, as for an id with no profile), `invalid_value` for a context of a kind that keeps no events (an event), 403 when the viewer may know of it but not see what is in it (a closed one from outside).',
        params: [
            'when' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['upcoming', 'past']], 'description' => 'Upcoming (the default without `from` and `to`) or past'],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only events this profile made'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only events in this group or space'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context` (v2 only); not with it'],
            'from' => ['in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date-time'], 'description' => 'Only events that end after this time (v2 only)'],
            'to' => ['in' => 'query', 'schema' => ['type' => 'string', 'format' => 'date-time'], 'description' => 'Only events that start before this time (v2 only); after `from`'],
        ],
        responses: [200 => 'Page_Event', 403 => null, 422 => null])]
    public function listEvents(BxDolApiV2Request $oReq)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        list($iFrom, $iTo) = $this->_range($oReq);
        $sWhen = $this->_when($oReq, $iFrom || $iTo ? null : 'upcoming');
        $iAuthor = $this->_idParam($oReq, 'author');

        $iContext = $this->_idParam($oReq, 'context');
        $sContextField = 'context';
        if (($iContextId = $this->_idParam($oReq, 'context_id'))) {
            if ($iContext && $iContext !== $iContextId)
                throw BxDolApiV2Problem::validation([['field' => 'context_id', 'code' => 'conflict', 'message' => 'Send one of context and context_id']]);
            $iContext = $iContextId;
            $sContextField = 'context_id';
        }

        $aRestrictions = [];
        if ($iAuthor)
            $aRestrictions['owner'] = ['value' => $iAuthor, 'field' => $CNF['FIELD_AUTHOR'], 'operator' => '=', 'table' => $CNF['TABLE_ENTRIES']];

        if ($iContext) {
            // a context the viewer may know of, of a kind that keeps events (groups and spaces)
            $this->_isolated(function () use ($iContext, $sContextField) {
                BxDolApiV2Targets::viewableContext($iContext, $sContextField, $this->_oModule);
            });
            // the module's events of a context: all of them, each checked as it is mapped
            return $this->_events($oReq, 'context', ['context' => $iContext], $aRestrictions, $sWhen, $iFrom, $iTo);
        }

        return $this->_events($oReq, $sWhen ?? 'recent', [], $aRestrictions, $sWhen, $iFrom, $iTo);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/events', id: 'listMyEvents', tag: 'events', auth: 'required', paged: true,
        summary: 'Events the acting profile is going to, upcoming ones first',
        description: 'v2 only: the events the profile is in (an active membership: a request waiting for approval is not one), secret ones included, in the order of GET /events: `when=upcoming` (the default) soonest first, `past` the latest first.',
        params: [
            'when' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['upcoming', 'past'], 'default' => 'upcoming']],
        ],
        responses: [200 => 'Page_Event', 422 => null])]
    public function listMyEvents(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $sWhen = $this->_when($oReq, 'upcoming');
        $sFans = $this->_oModule->_oConfig->getDbPrefix() . 'fans';
        // joined_entries joins the member's half of each membership; the other half makes it active
        return $this->_events($oReq, 'joined_entries', ['joined_profile' => $iViewerId], [
            'fans_mutual' => ['value' => 1, 'field' => 'mutual', 'operator' => '=', 'table' => $sFans],
        ], $sWhen, 0, 0);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/events/{id}', id: 'getEvent', tag: 'events',
        summary: 'An event, with the viewer\'s answer and membership',
        description: 'With `body_html`. The id is the event\'s profile id. 404 for a secret event the viewer is neither in nor invited to, for one that is not active (to all but its moderators) and for a profile that is no event; 403 for one the viewer may not see at all. A closed event seen from outside has its name, dates, place and picture (`content_visible` false), as its page on the site.',
        responses: [200 => 'Event', 403 => null, 404 => null])]
    public function getEvent(BxDolApiV2Request $oReq)
    {
        $this->_bBody = true;
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'PUT', path: '/events/{id}/rsvp', id: 'rsvpEvent', tag: 'events', auth: 'required',
        summary: 'Say the acting profile is going to an event',
        description: 'Answers the Event. `going` joins the event as POST /groups/{id}/membership joins a group: at once for an open event or one that invited the viewer (`viewer.rsvp` going), as a request to its organisers for one that approves its members (`viewer.status` pending, `rsvp` still null). Saying it again is not an error. `maybe` is 422 `unsupported`: the site keeps no such answer. 403 when the event refuses, 409 `questionnaire_required` or `paid_join` when joining needs the site. An event that has ended is not refused (the site lets one join it).',
        body: 'EventRsvp',
        responses: [200 => 'Event', 403 => null, 404 => null, 409 => null, 422 => null])]
    public function rsvpEvent(BxDolApiV2Request $oReq)
    {
        $aBody = $oReq->body();
        if (($aBody['status'] ?? '') === 'maybe')
            throw BxDolApiV2Problem::validation([['field' => 'status', 'code' => 'unsupported', 'message' => 'This site keeps no maybe: send going, or DELETE the answer']]);
        $this->_join($oReq);
        $this->_bBody = true;
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/events/{id}/rsvp', id: 'withdrawEventRsvp', tag: 'events', auth: 'required',
        summary: 'Withdraw the acting profile\'s answer: leave the event, withdraw a request or decline an invitation',
        description: 'As DELETE /groups/{id}/membership. Having no answer is not an error.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function withdrawEventRsvp(BxDolApiV2Request $oReq)
    {
        return $this->_leave($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/events/{id}/attendees', id: 'listEventAttendees', tag: 'events', paged: true,
        summary: 'Who is going to an event, in the order they answered',
        description: 'The event\'s members, the first to join first, each `going` (with `role`, v2 only). `status=maybe` is an empty page: the site keeps no maybe. To those who may see the event\'s content (403 for a closed event seen from outside, as its members on the site).',
        params: [
            'status' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/EventRsvpStatus'], 'description' => 'Only those with this answer'],
        ],
        responses: [200 => 'Page_EventAttendee', 403 => null, 404 => null])]
    public function listEventAttendees(BxDolApiV2Request $oReq)
    {
        $sStatus = $oReq->query('status');
        if ($sStatus !== null && !in_array($sStatus, ['going', 'maybe'], true))
            throw BxDolApiV2Problem::validation([['field' => 'status', 'code' => 'invalid_value', 'message' => 'Must be going or maybe']]);

        return $this->_isolated(function () use ($oReq, $sStatus) {
            $oProfile = $this->_existing($oReq->id());
            $iEventId = (int)$oProfile->id();
            $sAccess = $this->_access($oProfile);
            $this->_refuse($sAccess);
            if ($sAccess !== self::ACCESS_FULL)
                throw BxDolApiV2Problem::forbidden('Only members see who is going to this event');
            if ($sStatus === 'maybe')
                return $oReq->pageAt([], null);

            $iOffset = $oReq->cursorOffset();
            $iLimit = $oReq->limit();
            $aRows = $this->_fans()->getConnectedContentWithDates($iEventId, true, $iOffset, $iLimit + 1, BX_CONNECTIONS_ORDER_ADDED_ASC);
            $aRows = is_array($aRows) ? $aRows : [];
            $aPage = array_slice($aRows, 0, $iLimit, true);

            $aContent = BxDolApiV2Map::profileContent($oProfile);
            $aRoles = $this->_roles($iEventId, array_keys($aPage));
            $aSummaries = BxBaseApiV2Profiles::summaries(array_keys($aPage));
            $aItems = [];
            foreach ($aPage as $iMemberId => $iAdded) {
                if (!($aSummary = $aSummaries[(int)$iMemberId] ?? null))
                    continue;
                $aItems[] = [
                    'profile' => $aSummary,
                    'status' => 'going',
                    'created_at' => BxDolApiV2Map::date((int)$iAdded),
                    'role' => $this->_role($iEventId, (int)$iMemberId, $aContent, (int)($aRoles[(int)$iMemberId] ?? 0)),
                ];
            }
            return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
        });
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/events', id: 'searchEvents', tag: 'search', limit: 'search',
        summary: 'Events whose name matches, best match first',
        description: 'As GET /search/groups, for events, answering Events (with their dates) rather than Profiles: up to `limit` active events found by the module\'s quick search (the event\'s name), ranked as GET /search/profiles. Public and closed events are found; a secret one only by its members.',
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Part of an event\'s name, or its handle'],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 20]],
        ],
        responses: [200 => 'array:Event', 422 => null])]
    public function searchEvents(BxDolApiV2Request $oReq)
    {
        $aHits = BxDolApiV2Search::profiles(BxDolApiV2Search::query($oReq), [$this->_oModule->getName()], $oReq->limit());
        return $this->_isolated(function () use ($oReq, $aHits) {
            $aProfiles = [];
            foreach ($aHits as $aHit)
                if (($oProfile = $this->_profile((int)$aHit['id'])))
                    $aProfiles[] = $oProfile;
            return $this->_mapListed($aProfiles, (int)$oReq->viewerId());
        });
    }

    /*
     * Lists
     */

    /**
     * A page of events of the module's search result in $sMode (with its $aParams and more
     * $aRestrictions), narrowed to upcoming or past ones ($sWhen, null for neither) and to those
     * that overlap [$iFrom, $iTo] (0 for no bound), by their start: soonest first, past ones the
     * latest first. Rows the viewer may not see are left out of the page, not counted against
     * its size: the next cursor is the offset in the module's list.
     */
    protected function _events(BxDolApiV2Request $oReq, $sMode, $aParams, $aRestrictions, $sWhen, $iFrom, $iTo)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sTable = $CNF['TABLE_ENTRIES'];

        if ($iTo)
            $aRestrictions['filter_date_start'] = ['value' => $iTo, 'field' => $CNF['FIELD_DATE_START'], 'operator' => '<', 'table' => $sTable];
        if ($iFrom)
            $aRestrictions['filter_date_end'] = ['value' => $iFrom, 'field' => $CNF['FIELD_DATE_END'], 'operator' => '>', 'table' => $sTable];
        if ($sWhen === 'past')
            $aRestrictions['past'] = ['value' => time(), 'field' => $CNF['FIELD_DATE_END'], 'operator' => '<', 'table' => $sTable];

        $oResult = $this->_searchResult($sMode, $aRestrictions, $aParams);
        if (!$oResult)
            return $oReq->pageAt([], null);

        // upcoming: the module's own condition (not ended, or still repeating), from its upcoming
        // mode; past: ended and not repeating any more, so an event that still repeats is listed
        // in Upcoming only (the site's own Past page lists it in both)
        if (($sWhen === 'upcoming' || $sWhen === 'past') && empty($oResult->aCurrent['join']['intervals'])) {
            $oUpcoming = $this->_searchResult('upcoming');
            if (!$oUpcoming || empty($oUpcoming->aCurrent['join']['intervals']))
                return $oReq->pageAt([], null);
            $aJoin = $oUpcoming->aCurrent['join']['intervals'];
            if ($sWhen === 'past')
                $aJoin['groupHaving'] = BxDolDb::getInstance()->prepareAsString(" (MIN(`repeat_stop`) IS NULL OR (MIN(`repeat_stop`) <> 0 AND MAX(`repeat_stop`) <= ?)) ", time());
            $oResult->aCurrent['join']['intervals'] = $aJoin;
        }

        $sDir = $sWhen === 'past' ? 'DESC' : 'ASC';
        $sEntries = '`' . $sTable . '`';
        $sOrder = 'ORDER BY ' . $sEntries . '.`' . $CNF['FIELD_DATE_START'] . '` ' . $sDir . ', ' . $sEntries . '.`' . $CNF['FIELD_DATE_END'] . '` ' . $sDir . ', ' . $sEntries . '.`' . $CNF['FIELD_ID'] . '` ' . $sDir;

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aRows = $this->_searchRows($oResult, $iOffset, $iLimit + 1, 'content_id', $sOrder);

        $iViewerId = (int)$oReq->viewerId();
        $aItems = $this->_isolated(function () use ($aRows, $iLimit, $iViewerId) {
            $aProfiles = [];
            foreach (array_slice($aRows, 0, $iLimit) as $iContentId)
                if (($oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->_oModule->getName())))
                    $aProfiles[] = $oProfile;
            return $this->_mapListed($aProfiles, $iViewerId);
        });

        return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
    }

    /**
     * The Events of these profiles a list may show the viewer (seen fully or in part), their
     * extras read for all of them at once.
     */
    protected function _mapListed(array $aProfiles, $iViewerId)
    {
        BxDolApiV2Map::primeBadges(array_map(function ($oProfile) { return (int)$oProfile->id(); }, $aProfiles));
        $this->_prime($aProfiles);
        $aItems = [];
        foreach ($aProfiles as $oProfile)
            if (($a = $this->_groupIfListed($oProfile, $iViewerId)))
                $aItems[] = $a;
        return $aItems;
    }

    /**
     * `when`: upcoming or past, $sDefault when it is not sent.
     */
    protected function _when(BxDolApiV2Request $oReq, $sDefault)
    {
        $s = $oReq->query('when');
        if ($s === null)
            return $sDefault;
        if (!in_array($s, ['upcoming', 'past'], true))
            throw BxDolApiV2Problem::validation([['field' => 'when', 'code' => 'invalid_value', 'message' => 'Must be upcoming or past']]);
        return $s;
    }

    /**
     * `from` and `to` as timestamps (0 for one not sent); `to` after `from`.
     */
    protected function _range(BxDolApiV2Request $oReq)
    {
        $aRange = [];
        foreach (['from', 'to'] as $sName) {
            $s = $oReq->query($sName);
            $aRange[$sName] = 0;
            if ($s === null)
                continue;
            $o = is_string($s) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/', $s) ? date_create($s) : false;
            if (!$o)
                throw BxDolApiV2Problem::validation([['field' => $sName, 'code' => 'invalid_value', 'message' => 'Must be an RFC 3339 date-time']]);
            $aRange[$sName] = (int)$o->getTimestamp();
        }
        if ($aRange['from'] && $aRange['to'] && $aRange['to'] <= $aRange['from'])
            throw BxDolApiV2Problem::validation([['field' => 'to', 'code' => 'invalid_value', 'message' => 'Must be after from']]);
        return [$aRange['from'], $aRange['to']];
    }

    /*
     * Hooks
     */

    /**
     * An event in the feeds is of Item.kind `event`; null for other modules.
     */
    public function apiV2ItemKind($sModule)
    {
        return $sModule === $this->_oModule->getName() ? 'event' : null;
    }

    /**
     * Group.content_kinds: `events` for contexts of a module the site lets events go into
     * (the module's privacy, as its add form offers the context), else null.
     */
    public function apiV2ContextContent($sContextModule)
    {
        return $this->_oModule->serviceCheckAllowedAddInContext($sContextModule) === CHECK_ACTION_RESULT_ALLOWED ? 'events' : null;
    }

    /*
     * Mapping
     */

    /** The page's locations read by _prime: content id => location row (none for none). */
    protected $_aLocations = [];

    /**
     * What a context's page reads at once (the base: going counts, the viewer's answers and
     * invitations), and the badges of the events' organisers and the events' places, each in
     * one query.
     */
    protected function _prime(array $aProfiles)
    {
        parent::_prime($aProfiles);
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aAuthors = [];
        $aContentIds = [];
        foreach ($aProfiles as $oProfile) {
            $aContent = BxDolApiV2Map::profileContent($oProfile);
            if (!empty($aContent[$CNF['FIELD_AUTHOR']]))
                $aAuthors[] = (int)$aContent[$CNF['FIELD_AUTHOR']];
            if (!empty($aContent[$CNF['FIELD_ID']]))
                $aContentIds[] = (int)$aContent[$CNF['FIELD_ID']];
        }
        BxDolApiV2Map::primeBadges($aAuthors);

        $oMetatags = $aContentIds && !empty($CNF['OBJECT_METATAGS']) ? BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']) : null;
        if ($oMetatags && $oMetatags->locationsIsEnabled()) {
            $aRows = $oMetatags->locationsGetMultiple($aContentIds);
            foreach ($aContentIds as $iContentId)
                $this->_aLocations[$iContentId] = $aRows[$iContentId] ?? [];
        }
    }

    /**
     * The Item that shows the event in the feeds when the viewer may open it (GET /content/{id}
     * would answer), else 0. The site's Item of an added event is its author's alone (its
     * privacy is the event profile's `me only`), so most viewers have none.
     */
    protected function _itemId($iContentId)
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            return 0;
        foreach (BxDolModule::getInstance('bx_timeline')->getApiV2EventIdsByContent($this->_oModule->getName(), $iContentId) as $iItemId)
            if (BxDolApiV2Targets::visible(BxDolApiV2Targets::make(BxDolApiV2Targets::CONTENT, (int)$iItemId)))
                return (int)$iItemId;
        return 0;
    }

    /**
     * An Event: its fields where the site has them, with what a context has besides. A
     * closed one seen from outside has its name, dates, place and picture, as its page on the
     * site, and no text, cover or counts of its content.
     */
    protected function _group($oProfile, $sAccess, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        $bFull = $sAccess === self::ACCESS_FULL;
        $iId = (int)$oProfile->id();
        $iContentId = (int)$aContent[$CNF['FIELD_ID']];
        $sView = (string)($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? '');
        $iAuthorId = (int)($aContent[$CNF['FIELD_AUTHOR']] ?? 0);
        $iStart = (int)($aContent[$CNF['FIELD_DATE_START']] ?? 0);
        $iEnd = (int)($aContent[$CNF['FIELD_DATE_END']] ?? 0);
        $iAdded = (int)($aContent[$CNF['FIELD_ADDED']] ?? 0);
        $iPublished = (int)($aContent[$CNF['FIELD_PUBLISHED']] ?? 0);
        $sHtml = (string)($aContent[$CNF['FIELD_TEXT']] ?? '');
        $aSummary = BxDolApiV2Map::profileSummary($iId) ?? [];

        // single answers only: finding whether the viewer may open it builds the whole Item
        $iItemId = $this->_bBody && $bFull ? $this->_itemId($iContentId) : 0;
        $oCmts = !empty($CNF['OBJECT_COMMENTS']) ? BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iContentId) : null;

        $a = [
            'id' => BxDolApiV2Map::id($iId),
            'module' => $this->_oModule->getName(),
            'title' => $oProfile->getDisplayName(),
            'summary' => $bFull ? BxDolApiV2Map::text($sHtml, (int)getParam($CNF['PARAM_CHARS_SUMMARY']) ?: 700) : '',
        ];
        if ($this->_bBody)
            $a['body_html'] = $bFull ? $sHtml : null;

        return $a + [
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'context_id' => BxDolApiV2Map::idOrNull(is_numeric($sView) && (int)$sView < 0 ? -(int)$sView : 0),
            'audience' => $this->_audience($sView),
            'visibility' => static::visibility($sView),
            'join_policy' => !empty($aContent[$CNF['FIELD_JOIN_CONFIRMATION']]) ? 'approval' : 'open',
            'state' => $this->_state($aContent),
            'moderation' => $this->_moderation($aContent),
            'handle' => $aSummary['handle'] ?? null,
            'avatar' => $aSummary['avatar'] ?? null,
            'cover' => $bFull ? $this->_cover($aContent) : null,
            'media' => [],
            'starts_at' => $iStart > 0 ? BxDolApiV2Map::date($iStart) : null,
            'ends_at' => $iEnd > 0 ? BxDolApiV2Map::date(max($iStart, $iEnd)) : null,
            // the site keeps times, never a day without hours
            'all_day' => false,
            'timezone' => $this->_timezone($aContent[$CNF['FIELD_TIMEZONE']] ?? ''),
            'location' => $this->_location($iContentId),
            'online_url' => null,
            'capacity' => null,
            'going_count' => $this->_memberCount($iId),
            'comments_enabled' => $oCmts && $oCmts->isEnabled(),
            'featured' => (int)($aContent['featured'] ?? 0) > 0,
            'stats' => [
                'comments' => $bFull ? (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0) : 0,
                'reactions' => $bFull ? (int)($aContent[$CNF['FIELD_REACTIONS']] ?? 0) : 0,
                'views' => $bFull ? (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0) : 0,
            ],
            'content_visible' => $bFull,
            'content_id' => BxDolApiV2Map::idOrNull($iItemId),
            'content_kinds' => $this->_contentKinds(),
            'url' => BxDolApiV2Map::absoluteUrl($oProfile->getUrl()),
            'published_at' => $iPublished > 0 && $this->_state($aContent) === 'published' ? BxDolApiV2Map::date($iPublished) : null,
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, (int)($aContent[$CNF['FIELD_CHANGED']] ?? 0))),
            'viewer' => $iViewerId ? $this->_eventViewer($oProfile, $aContent, $iViewerId, $bFull, $oCmts, $iItemId) : null,
        ] + (isset($aSummary['badges']) ? ['badges' => $aSummary['badges']] : []);
    }

    /**
     * EventViewer: the viewer's answer (going while a member), what they did with the event and
     * may do, and the membership of GroupViewer. Reacting and commenting go through the event's
     * Item ($iItemId, single answers only): without one the viewer can't do either here, so
     * `can_react` and `can_comment` are false. Their reaction and favourite are read on single
     * answers only (each is a query of its own): in lists `reaction` is null and `favorited` false.
     */
    protected function _eventViewer($oProfile, $aContent, $iViewerId, $bFull, $oCmts, $iItemId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iContentId = (int)$aContent[$CNF['FIELD_ID']];
        $aMembership = $this->_viewer($oProfile, $iViewerId, $bFull);

        $sReaction = null;
        $bCanReact = false;
        $oReactions = $this->_bBody && $bFull && !empty($CNF['OBJECT_REACTIONS']) ? BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], $iContentId) : null;
        if ($oReactions && $oReactions instanceof BxDolVoteReactions && $oReactions->isEnabled()) {
            $sReaction = $oReactions->getReactionsBy($oReactions->getId(), $iViewerId)[0] ?? null;
            $bCanReact = $iItemId > 0 && (bool)$oReactions->isAllowedVote();
        }

        $oFavorite = $this->_bBody && !empty($CNF['OBJECT_FAVORITES']) ? BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], $iContentId) : null;

        return [
            'rsvp' => $aMembership['status'] === 'active' ? 'going' : null,
            'reaction' => $sReaction,
            'favorited' => $oFavorite && $oFavorite->isEnabled() && $oFavorite->getQueryObject()->isPerformed($iContentId, $iViewerId),
            'can_react' => $bCanReact,
            'can_comment' => $iItemId > 0 && $bFull && $oCmts && $oCmts->isEnabled() && $oCmts->isPostAllowed(),
            'can_edit' => $aMembership['can_edit'],
            'can_delete' => $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
        ] + $aMembership;
    }

    /**
     * The Audience: public, members, friends or context; closed and secret events (and any
     * other privacy) are private. `visibility` says which exactly.
     */
    protected function _audience($sView)
    {
        if (is_numeric($sView) && (int)$sView < 0)
            return 'context';
        switch ($sView) {
            case BX_DOL_PG_ALL: return 'public';
            case BX_DOL_PG_MEMBERS: return 'members';
            case BX_DOL_PG_FRIENDS: return 'friends';
        }
        return 'private';
    }

    /**
     * The ContentState: published, scheduled (waiting for its publishing time) or hidden.
     */
    protected function _state($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        switch ((string)($aContent[$CNF['FIELD_STATUS']] ?? 'active')) {
            case 'awaiting':
                return 'scheduled';
            case 'hidden':
                return 'hidden';
        }
        return (int)($aContent[$CNF['FIELD_PUBLISHED']] ?? 0) > time() ? 'scheduled' : 'published';
    }

    /**
     * The Moderation, from the site's admin status.
     */
    protected function _moderation($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        switch ((string)($aContent[$CNF['FIELD_STATUS_ADMIN']] ?? 'active')) {
            case 'pending':
                return 'pending';
            case 'hidden':
                return 'rejected';
        }
        return 'approved';
    }

    /**
     * The event's zone, as the site keeps it; UTC for none or one PHP does not know.
     */
    protected function _timezone($sZone)
    {
        static $aZones = null;
        if ($aZones === null)
            $aZones = array_flip(timezone_identifiers_list());
        $sZone = (string)$sZone;
        return $sZone !== '' && isset($aZones[$sZone]) ? $sZone : 'UTC';
    }

    /**
     * Where it happens, as the site writes the event's location in one line; null for none.
     * The location is the one read with the page's others (_prime), or read alone.
     */
    protected function _location($iContentId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oMetatags = !empty($CNF['OBJECT_METATAGS']) ? BxDolMetatags::getObjectInstance($CNF['OBJECT_METATAGS']) : null;
        if (!$oMetatags || !$oMetatags->locationsIsEnabled())
            return null;
        $sHtml = array_key_exists((int)$iContentId, $this->_aLocations)
            ? ($this->_aLocations[(int)$iContentId] ? $oMetatags->locationsStringFromArray($this->_aLocations[(int)$iContentId], false) : '')
            : $oMetatags->locationsString($iContentId, false);
        $s = trim(BxDolApiV2Map::text((string)$sHtml));
        return $s !== '' ? $s : null;
    }

    /**
     * The cover as Media, its copies only (the original keeps the camera's metadata): `thumb`,
     * `medium` and `large` from the module's cover thumbnail, gallery and cover transcoders.
     */
    protected function _cover($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iFileId = (int)($aContent[$CNF['FIELD_COVER']] ?? 0);
        $sStorage = (string)($CNF['OBJECT_STORAGE_COVER'] ?? '');
        $aObject = $iFileId > 0 && $sStorage !== '' ? BxDolStorageQuery::getStorageObject($sStorage) : null;
        if (empty($aObject['id']))
            return null;

        $aVariants = [];
        foreach (['thumb' => 'OBJECT_IMAGES_TRANSCODER_COVER_THUMB', 'medium' => 'OBJECT_IMAGES_TRANSCODER_GALLERY', 'large' => 'OBJECT_IMAGES_TRANSCODER_COVER'] as $sName => $sKey) {
            $o = !empty($CNF[$sKey]) ? BxDolTranscoderImage::getObjectInstance($CNF[$sKey]) : null;
            if ($o)
                $aVariants[$sName] = [(string)$o->getFileUrl($iFileId), $CNF[$sKey]];
        }
        if (!$aVariants)
            return null;
        return BxDolApiV2Map::media(BxDolApiV2Map::uploadId((int)$aObject['id'], $iFileId), 'image', 'ready', $sStorage, $iFileId, $aVariants);
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aBool = ['type' => 'boolean'];
        $aTime = ['type' => 'string', 'format' => 'date-time'];
        $aTimeOrNull = ['type' => ['string', 'null'], 'format' => 'date-time'];
        $aCount = ['type' => 'integer', 'minimum' => 0];

        $aViewer = parent::schemas()['GroupViewer'];
        $aViewer['description'] = 'What the viewer did with an event and may do, with the membership of GroupViewer, whose `membership` is PUT and DELETE /events/{id}/rsvp';
        $aViewer['required'] = array_values(array_unique(array_merge(['rsvp', 'reaction', 'favorited', 'can_react', 'can_comment', 'can_edit', 'can_delete'], $aViewer['required'])));
        $aViewer['properties'] = [
            'rsvp' => ['oneOf' => [['$ref' => '#/components/schemas/EventRsvpStatus'], ['type' => 'null']], 'description' => '`going` while the viewer is in the event; null otherwise (a request waiting for approval is `status` pending)'],
            'reaction' => ['type' => ['string', 'null'], 'description' => 'Their reaction to the event, if any. Read on single answers only (GET /events/{id}, PUT /events/{id}/rsvp): null in lists'],
            'favorited' => array_merge($aBool, ['description' => 'Whether they keep it among their favourites. Read on single answers only: false in lists']),
            'can_react' => array_merge($aBool, ['description' => 'The viewer may react, on the Item `content_id`: false when the answer has none (lists, and on most sites everyone but the organiser)']),
            'can_comment' => array_merge($aBool, ['description' => 'The event takes comments and the viewer may comment, on the Item `content_id`: false when the answer has none (lists, and on most sites everyone but the organiser)']),
            'can_edit' => array_merge($aBool, ['description' => 'The viewer may change its details (on the site)']),
            'can_delete' => $aBool,
        ] + $aViewer['properties'];

        return [
            'EventRsvpStatus' => ['type' => 'string', 'enum' => ['going', 'maybe'], 'description' => 'This site keeps `going` only'],
            'EventRsvp' => [
                'type' => 'object',
                'required' => ['status'],
                'properties' => ['status' => ['$ref' => '#/components/schemas/EventRsvpStatus']],
            ],
            'ContentState' => BxDolApiV2Map::contentStateSchema(),
            'Moderation' => BxDolApiV2Map::moderationSchema(),
            'EventViewer' => $aViewer,
            'EventStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'views'],
                'properties' => ['comments' => $aCount, 'reactions' => $aCount, 'views' => $aCount],
            ],
            'Event' => [
                'type' => 'object',
                'description' => 'An event, with what a context has besides (module, handle, avatar, badges, visibility, join_policy, content_visible, content_id, content_kinds, url, and the membership in `viewer`). It is a context profile (Profile.kind `group`, module `bx_events`): `id` is its profile id, its feed GET /profiles/{id}/timeline. A closed event seen from outside has its name, dates, place and picture, no text, cover or counts of its content (`content_visible` false).',
                'required' => ['id', 'module', 'title', 'summary', 'author', 'context_id', 'audience', 'visibility', 'join_policy', 'state', 'moderation', 'handle', 'avatar', 'cover', 'media', 'starts_at', 'ends_at', 'all_day', 'timezone', 'location', 'online_url', 'capacity', 'going_count', 'comments_enabled', 'featured', 'stats', 'content_visible', 'content_id', 'content_kinds', 'url', 'published_at', 'created_at', 'updated_at', 'viewer'],
                'properties' => [
                    'id' => $aId,
                    'module' => ['type' => 'string', 'description' => 'The UNA module (v2 only): `bx_events`', 'example' => 'bx_events'],
                    'title' => ['type' => 'string', 'description' => 'Its name, as Profile.display_name'],
                    'summary' => ['type' => 'string', 'description' => 'The start of its description as plain text; empty for a closed event seen from outside'],
                    'body_html' => ['type' => ['string', 'null'], 'description' => 'The description as the site keeps it (user HTML: sanitize before showing it). Only on GET /events/{id} and PUT /events/{id}/rsvp; null for a closed event seen from outside'],
                    'author' => ['oneOf' => [['$ref' => '#/components/schemas/Profile'], ['type' => 'null']], 'description' => 'Who made it: its organiser'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The group or space it is in'],
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'visibility' => ['$ref' => '#/components/schemas/GroupVisibility'],
                    'join_policy' => ['type' => 'string', 'enum' => ['open', 'approval'], 'description' => 'open: going makes a member at once; approval: it asks its organisers'],
                    'state' => ['$ref' => '#/components/schemas/ContentState'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'handle' => ['type' => ['string', 'null'], 'description' => 'As Profile.handle (v2 only)'],
                    'avatar' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Its square picture, as Profile.avatar (v2 only)'],
                    'cover' => ['oneOf' => [['$ref' => '#/components/schemas/Media'], ['type' => 'null']], 'description' => 'The wide picture, copies only (`thumb`, `medium`, `large`); null for none and for a closed event seen from outside'],
                    'media' => ['type' => 'array', 'maxItems' => 0, 'items' => ['$ref' => '#/components/schemas/Media'], 'description' => 'Always empty: an event keeps no photos of its own here (its posts do)'],
                    'starts_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'When it starts. Null for an event the site keeps no date for'],
                    'ends_at' => array_merge($aTimeOrNull, ['description' => 'When it ends, at or after `starts_at`; null for none. A repeating event\'s are its first time\'s']),
                    'all_day' => array_merge($aBool, ['description' => 'Always false: the site keeps times']),
                    'timezone' => ['type' => 'string', 'description' => 'The IANA zone the event was set in, such as `Europe/Berlin` (`UTC` for none); the times are instants and show in the viewer\'s zone as well'],
                    'location' => ['type' => ['string', 'null'], 'description' => 'Where it happens, in one line'],
                    'online_url' => ['type' => ['string', 'null'], 'description' => 'Always null: the site keeps none'],
                    'capacity' => ['type' => ['integer', 'null'], 'description' => 'Always null: the site sets no limit'],
                    'going_count' => array_merge($aCount, ['description' => 'Its members']),
                    'comments_enabled' => $aBool,
                    'featured' => $aBool,
                    'stats' => ['$ref' => '#/components/schemas/EventStats'],
                    'content_visible' => array_merge($aBool, ['description' => 'Whether the viewer may see its description, cover, feed and attendees (v2 only); false for a closed one seen from outside']),
                    'content_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The Item that shows it in the feeds, when the viewer may open it (v2 only): its comments and reactions are the event\'s (GET /content/{content_id}/comments). Only on single answers (GET /events/{id}, PUT /events/{id}/rsvp), null in lists. The site\'s Item of an added event is its author\'s alone, so it is null for everyone else, and when the Timeline shows none'],
                    'content_kinds' => ['type' => 'array', 'items' => ['type' => 'string'], 'description' => 'As Group.content_kinds (v2 only)'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Its page on the site (v2 only)'],
                    'badges' => ['type' => 'array', 'minItems' => 1, 'items' => ['$ref' => '#/components/schemas/ProfileBadge'], 'description' => 'As Profile.badges (v2 only); left out when it has none'],
                    'published_at' => array_merge($aTimeOrNull, ['description' => 'When it was published; null while scheduled']),
                    'created_at' => $aTime,
                    'updated_at' => $aTime,
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/EventViewer'], ['type' => 'null']], 'description' => 'Null for guests'],
                ],
            ],
            'EventAttendee' => [
                'type' => 'object',
                'description' => 'Someone who answered an event (here: a member of it), with their role',
                'required' => ['profile', 'status', 'created_at'],
                'properties' => [
                    'profile' => ['$ref' => '#/components/schemas/Profile'],
                    'status' => ['$ref' => '#/components/schemas/EventRsvpStatus'],
                    'created_at' => array_merge($aTime, ['description' => 'When they joined']),
                    'role' => ['$ref' => '#/components/schemas/GroupRole'],
                ],
            ],
            'Page_Event' => BxDolApiV2Map::pageSchema('Event'),
            'Page_EventAttendee' => BxDolApiV2Map::pageSchema('EventAttendee'),
            // shared with the Timeline's and the Conversations' classes: a site may have neither
            'Audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private']],
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
        ] + parent::schemas();
    }
}

/** @} */
