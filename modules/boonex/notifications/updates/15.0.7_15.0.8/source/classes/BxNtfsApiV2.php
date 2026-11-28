<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Notifications Notifications
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Notifications.
 * Read state is one marker per profile (the last notification read): everything newer is
 * unread, so marking one as read also marks the older ones.
 */
class BxNtfsApiV2
{
    /** New notifications one GET /sync answer sends at most; past that it says `more`. */
    const SYNC_ENTRIES = 20;

    protected $_oModule;

    /** Kinds whose object is the Item a new comment is on (object_id), not the comment. */
    protected static $_aOnTheItem = ['social.comment', 'social.reply', 'discussions.reply'];

    /** The reactions of the page's reaction events: "unit" => [track id => reaction or false]. */
    protected $_aReactions = [];

    public function __construct()
    {
        $this->_oModule = BxDolModule::getInstance('bx_notifications');
    }

    /**
     * GET /api/v2 `modules`: this module is here, with the tag of its paths.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), 'notifications', 'notification');
    }

    /**
     * GET /navigation: an item of this module that goes to its notifications page (the apps' menu's
     * Notifications) opens the notifications, the section of this module's tag.
     */
    public function apiV2NavigationTarget(array $aItem, array $aPage)
    {
        if ($aItem['module'] !== $this->_oModule->getName() || ($aPage['module'] ?? '') !== $this->_oModule->getName() || ($aPage['uri'] ?? '') !== 'notifications-view')
            return null;
        return ['kind' => BxBaseApiV2Navigation::TARGET_SECTION, 'section' => 'notifications'];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/notifications', id: 'listNotifications', tag: 'notifications', auth: 'required', paged: true,
        summary: 'The viewer\'s notifications, newest first',
        params: ['unread_only' => ['in' => 'query', 'schema' => ['type' => 'boolean', 'default' => false], 'description' => 'Only the ones not read yet']],
        responses: [200 => 'Page_Notification'])]
    public function listNotifications(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $iLimit = $oReq->limit();
        $bUnreadOnly = $oReq->queryBool('unread_only');

        // the cursor is the id the scan got to, which can be past the last item shown when some were left out
        $a = $this->_oModule->getApiV2Notifications($iViewerId, $oReq->cursorBefore(), $iLimit);

        // Listed by date, read by id (the marker): an event dated later than its id says (a
        // post's date changed, a scheduled one) is read among unread ones, so a read one does
        // not end the unread list; only a cursor at or under the marker does, as every event
        // past it has a lower id.
        $aItems = [];
        $iBefore = $a['before'];
        $this->_prefetch($a['events']);
        foreach ($a['events'] as $aEvent) {
            $bRead = (int)$aEvent['id'] <= $a['last_read'];
            if ($bUnreadOnly && $bRead)
                continue;
            $aItems[] = $this->_notification($aEvent, $bRead, $iViewerId);
        }
        if ($bUnreadOnly && $iBefore > 0 && $iBefore <= $a['last_read'])
            $iBefore = 0;

        return $oReq->pageBeforeAt($aItems, $iBefore);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/notifications/unread-count', id: 'getUnreadCount', tag: 'notifications', auth: 'required',
        summary: 'How many notifications the viewer has not read', responses: [200 => 'UnreadCount'])]
    public function getUnreadCount(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        return ['unread' => (int)$this->_oModule->serviceGetUnreadNotificationsNum($iViewerId)];
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/notifications/read', id: 'markNotificationsRead', tag: 'notifications', auth: 'required',
        summary: 'Mark notifications as read',
        description: 'Without `ids` everything is marked as read. With `ids`, the newest of them and everything older is: read state is one marker per profile.',
        body: 'MarkRead', responses: [204 => null])]
    public function markNotificationsRead(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aIds = array_map('intval', $oReq->body()['ids'] ?? []);

        $this->_oModule->markApiV2NotificationsRead($iViewerId, $aIds ? max($aIds) : 0);
        return BxDolApiV2Response::noContent();
    }

    /**
     * GET /sync: the unread count (as GET /notifications/unread-count) and the notifications
     * newer than the cursor's head as `changes` (type `notification`,
     * the Notification as `data`, a digest of it as `version`), as GET /notifications shows
     * them (privacy checked, grouped). The first sync, and one after a reset, only sets the
     * head: what came before the client asked is in the list, not new.
     *
     * At most SYNC_ENTRIES go in one answer, newest first. When more came, the answer says
     * `more` and its cursor goes on below the last one sent (`b`) with the head the round
     * started from (`n`) and the one it ends at (`x`); the round is over when it reaches `n`,
     * and the cursor's head becomes `x`. So nothing is skipped, only sent in parts.
     */
    public function apiV2Sync($iViewerId, $aCursor, $bReset)
    {
        return $this->_sync($iViewerId, $aCursor, $bReset, self::SYNC_ENTRIES);
    }

    /**
     * apiV2Sync with at most $iMax notifications in an answer (tests take a small one).
     */
    protected function _sync($iViewerId, $aCursor, $bReset, $iMax)
    {
        $fInt = function ($sKey) use ($aCursor, $bReset) {
            return !$bReset && isset($aCursor[$sKey]) && is_int($aCursor[$sKey]) && $aCursor[$sKey] >= 0 ? $aCursor[$sKey] : null;
        };
        $iHead = $fInt('n');
        $iBelow = $iHead !== null ? (int)$fInt('b') : 0;
        $iEnd = $iBelow > 0 ? $fInt('x') : null;

        $iNewest = $this->_oModule->getApiV2NewestId($iViewerId);
        $aChanges = [];
        $bMore = false;
        $aNext = ['n' => max($iNewest, (int)$iHead)];

        if ($iHead !== null && ($iBelow > 0 || $iNewest > $iHead)) {
            $iEnd = $iEnd ?? $iNewest;
            $a = $this->_oModule->getApiV2Notifications($iViewerId, $iBelow, $iMax + 1);
            $this->_prefetch($a['events']);

            $bDone = false;
            $iLast = 0;
            foreach ($a['events'] as $aEvent) {
                if ((int)$aEvent['id'] <= $iHead) {
                    $bDone = true;
                    break;
                }
                if (count($aChanges) >= $iMax) {
                    $bMore = true;
                    break;
                }
                $aNotification = $this->_notification($aEvent, (int)$aEvent['id'] <= $a['last_read'], (int)$iViewerId);
                $aChanges[] = [
                    'type' => 'notification',
                    'id' => $aNotification['id'],
                    'version' => BxDolApiV2Map::digest($aNotification),
                    'data' => $aNotification,
                ];
                $iLast = (int)$aEvent['id'];
            }
            // the scan stopped at its row limit before reaching the head: go on from where it got to
            if (!$bDone && !$bMore && (int)$a['before'] > $iHead) {
                $bMore = true;
                $iLast = (int)$a['before'];
            }

            // what came during a round in parts is newer than its end: the next round sends it
            $aNext = $bMore && $iLast > $iHead ? ['n' => $iHead, 'b' => $iLast, 'x' => $iEnd] : ['n' => $iEnd];
        }

        return [
            'cursor' => $aNext,
            'badges' => ['notifications' => (int)$this->_oModule->serviceGetUnreadNotificationsNum($iViewerId)],
            'changes' => $aChanges,
            'more' => $bMore,
        ];
    }

    /**
     * A notification: `kind` in the API's vocabulary (or `other`), `actor`
     * (the profile that did it), `actors` (v2 does not coalesce: always 1), `data` for the
     * kind, `updated_at` (an event has one date: its created_at). v2 adds `source`, UNA's
     * `<unit>.<action>`, and keeps module, text, url and its own target fields.
     */
    protected function _notification($aEvent, $bRead, $iViewerId)
    {
        $mText = $aEvent['content_parsed'] ?? '';
        if (is_array($mText))
            $mText = $mText['site'] ?? reset($mText);

        $sUrl = $aEvent['content']['entry_url'] ?? '';
        $aTarget = $this->_target($aEvent);
        $aKind = $this->_kind($aEvent, $aTarget, (int)$iViewerId);

        // a negative author is anonymous: never fall back to a profile that could be that author
        $iActorId = isset($aKind['actor_id']) ? (int)$aKind['actor_id'] : ((int)$aEvent['author_id'] > 0 ? (int)$aEvent['author_id'] : (int)$aEvent['owner_id']);
        $sDate = BxDolApiV2Map::date($aEvent['date']);

        return [
            'id' => BxDolApiV2Map::id($aEvent['id']),
            'kind' => $aKind['kind'],
            'source' => $aEvent['type'] . '.' . $aEvent['action'],
            'module' => (string)$aEvent['type'],
            'actor' => (int)$aEvent['author_id'] < 0 ? null : BxDolApiV2Map::profileSummary($iActorId),
            'actors' => 1,
            'text' => BxDolApiV2Map::text((string)$mText, 500),
            'url' => $sUrl !== '' ? BxDolApiV2Map::absoluteUrl($this->_url($sUrl)) : null,
        ] + $this->_targetFields($aTarget, $aKind['kind']) + [
            'data' => (object)($aKind['data'] ?? []),
            'read' => $bRead,
            'created_at' => $sDate,
            'updated_at' => $sDate,
        ];
    }

    /**
     * The kind of a notification event in the API's vocabulary, with its
     * data: ['kind' => ..., 'data' => [...]], and 'actor_id'
     * where the actor is not the event's author. A module that knows its events says so
     * (apiV2NotificationKind($aEvent, $aTarget, $iViewerId), null for events it doesn't know);
     * these are the system's. A kind says what happened to the recipient (someone followed
     * them, commented on their post), so an event the viewer gets about what someone else owns
     * (a comment on a post of someone they follow) is `other`, as is any event with no kind.
     */
    protected function _kind($aEvent, $aTarget, $iViewerId)
    {
        foreach (BxDolApiV2Router::hooks('apiV2NotificationKind') as $oEndpoint)
            if (is_array($a = $oEndpoint->apiV2NotificationKind($aEvent, $aTarget, $iViewerId)))
                return $a;

        $aOther = ['kind' => 'other', 'data' => []];
        $sUnit = (string)$aEvent['type'];
        $sAction = (string)$aEvent['action'];

        // the recipient is the one it is about: what was followed or mentioned, the owner of what was commented or reacted on
        if ($iViewerId <= 0 || abs((int)$aEvent['object_owner_id']) !== $iViewerId)
            return $aOther;

        if ($sAction === 'connection_added' && $sUnit === 'sys_profiles_subscriptions')
            return ['kind' => 'graph.followed', 'data' => []];

        // a request (content.request 1), or the other side accepted one (0)
        if ($sAction === 'connection_added' && $sUnit === 'sys_profiles_friends')
            return ['kind' => !empty($aEvent['content']['request']) ? 'graph.friend_requested' : 'graph.befriended', 'data' => []];

        if ($sUnit === 'meta_mention' && $sAction === 'added')
            return ['kind' => 'social.mentioned', 'data' => []];

        // a comment, or a reply to the recipient's comment: the unit is the comments object
        $aCmtsSystems = BxDolCmts::getSystems();
        if (isset($aCmtsSystems[$sUnit]) && in_array($sAction, ['commentPost', 'replyPost'], true))
            return $aTarget && $aTarget['kind'] === BxDolApiV2Targets::COMMENT
                ? ['kind' => $sAction === 'replyPost' ? 'social.reply' : 'social.comment', 'data' => ['comment_id' => BxDolApiV2Map::id($aTarget['id'])]]
                : $aOther;

        // a reaction (not a like or a score): the reaction is in the vote's track row, subobject_id;
        // a reaction taken back since has none, and what it was is not known: other
        if ($sAction === 'doVote' && ($sReaction = $this->_reaction($sUnit, (int)($aEvent['subobject_id'] ?? 0))) !== false)
            return ['kind' => 'social.reacted', 'data' => ['kind' => $sReaction]];

        return $aOther;
    }

    /**
     * Read what the notifications of a page need in one query each instead of one per
     * notification: the reactions of reaction events, by vote object, and the actors' badges.
     */
    protected function _prefetch($aEvents)
    {
        $aIds = [];
        $aActors = [];
        foreach ($aEvents as $aEvent) {
            if (($aEvent['action'] ?? '') === 'doVote' && (int)($aEvent['subobject_id'] ?? 0) > 0)
                $aIds[(string)$aEvent['type']][] = (int)$aEvent['subobject_id'];
            $aActors[] = (int)($aEvent['author_id'] ?? 0) > 0 ? (int)$aEvent['author_id'] : (int)($aEvent['owner_id'] ?? 0);
            // a group's join request names the one asking, its actor, in subobject_id
            // (BxBaseModGroupsApiV2::apiV2NotificationKind); a stray id here costs nothing
            if (($aEvent['action'] ?? '') === 'join_request' && (int)($aEvent['subobject_id'] ?? 0) > 0)
                $aActors[] = (int)$aEvent['subobject_id'];
        }
        BxDolApiV2Map::primeBadges($aActors);

        foreach ($aIds as $sUnit => $a) {
            $oVote = BxDolVote::getObjectInstance($sUnit, 0, false);
            if (!$oVote instanceof BxDolVoteReactions)
                continue;
            $aFound = $oVote->getQueryObject()->getReactionsByTrackIds($a);
            foreach ($a as $iId)
                $this->_aReactions[$sUnit][$iId] = isset($aFound[$iId]) && $aFound[$iId] !== '' ? (string)$aFound[$iId] : false;
        }
    }

    /**
     * The reaction of a vote object's track row, false when the object is not a reactions one
     * or the row is gone.
     */
    protected function _reaction($sUnit, $iTrackId)
    {
        if ($iTrackId <= 0)
            return false;
        if (isset($this->_aReactions[$sUnit]) && array_key_exists($iTrackId, $this->_aReactions[$sUnit]))
            return $this->_aReactions[$sUnit][$iTrackId];

        $oVote = BxDolVote::getObjectInstance($sUnit, 0, false);
        if (!$oVote instanceof BxDolVoteReactions)
            return $this->_aReactions[$sUnit][$iTrackId] = false;
        $aFound = $oVote->getQueryObject()->getReactionsByTrackIds([$iTrackId]);
        return $this->_aReactions[$sUnit][$iTrackId] = isset($aFound[$iTrackId]) && $aFound[$iTrackId] !== '' ? (string)$aFound[$iTrackId] : false;
    }

    /**
     * Where a notification leads in the API, from its target (_target): object_kind and
     * object_id, and for a comment the Item it is on (item_id) and the top-level comment a
     * reply is shown under (thread_id). A comment or reply kind is about the Item
     * it is on (the comment is data.comment_id); other kinds are about
     * what the target names.
     */
    protected function _targetFields($a, $sNotificationKind = 'other')
    {
        if ($a && $a['kind'] === BxDolApiV2Targets::COMMENT && (int)$a['item_id'] > 0 && in_array($sNotificationKind, self::$_aOnTheItem, true))
            return [
                'object_kind' => BxDolApiV2Targets::CONTENT,
                'object_id' => BxDolApiV2Map::id($a['item_id']),
                'item_id' => BxDolApiV2Map::id($a['item_id']),
                'thread_id' => BxDolApiV2Map::idOrNull($a['thread_id']),
            ];

        // groups and other contexts are profiles here: GET /profiles/{id} shows them
        $sKind = $a ? ($a['kind'] === BxDolApiV2Targets::GROUP ? BxDolApiV2Targets::PROFILE : $a['kind']) : 'other';
        return [
            'object_kind' => $sKind,
            'object_id' => $a ? BxDolApiV2Map::idOrNull($a['id']) : null,
            'item_id' => $a ? BxDolApiV2Map::idOrNull($a['item_id']) : null,
            'thread_id' => $a ? BxDolApiV2Map::idOrNull($a['thread_id']) : null,
        ];
    }

    /**
     * The target of a notification event, read with what UNA knows about its unit: a module
     * that knows the event better says so (apiV2NotificationTarget); a connection (follow,
     * friend) is the other profile; a comment, reply, or a vote or report on a comment is the
     * comment; otherwise it is the content the Notifications module checks the event against
     * (BxNtfsConfig::getContentModule, getContentObjectId). Null when it is none of these.
     */
    protected function _target($aEvent)
    {
        foreach (BxDolApiV2Router::hooks('apiV2NotificationTarget') as $oEndpoint)
            if (is_array($a = $oEndpoint->apiV2NotificationTarget($aEvent)))
                return $a;

        $sUnit = (string)$aEvent['type'];
        $sAction = (string)$aEvent['action'];
        $iObjectId = (int)$aEvent['object_id'];
        $iSubobjectId = (int)($aEvent['subobject_id'] ?? 0);

        if (BxDolConnection::getObjectInstance($sUnit)) {
            // the event's owner made the connection with the object; the viewer is one of them
            $iViewerId = (int)bx_get_logged_profile_id();
            return BxDolApiV2Targets::profile($iObjectId === $iViewerId ? (int)$aEvent['owner_id'] : $iObjectId);
        }

        // a comment or a reply: the unit is the comments object, subobject_id the new comment
        $aCmtsSystems = BxDolCmts::getSystems();
        if (isset($aCmtsSystems[$sUnit]) && in_array($sAction, ['commentPost', 'replyPost'], true))
            return BxDolApiV2Targets::comment($sUnit, $iSubobjectId);

        // the core's own comment alert carries the comment's unique id
        if ($sUnit === 'comment')
            return BxDolApiV2Targets::commentByUniqId($iSubobjectId);

        // votes, reactions and reports on comments: the object is the comment's unique id
        $aVotes = BxDolVote::getSystems();
        $aReports = BxDolReport::getSystems();
        if (($aVotes[$sUnit]['trigger_table'] ?? '') === BxDolCmts::$sTableIds || ($aReports[$sUnit]['trigger_table'] ?? '') === BxDolCmts::$sTableIds)
            return BxDolApiV2Targets::commentByUniqId($iObjectId);

        // a mention names what it is in
        $aContent = is_array($aEvent['content'] ?? null) ? $aEvent['content'] : [];
        if (!empty($aContent['module']) && !empty($aContent['content_id']) && is_string($aContent['module']))
            return $aContent['module'] === 'sys_cmts' ? BxDolApiV2Targets::commentByUniqId((int)$aContent['content_id']) : BxDolApiV2Targets::content($aContent['module'], (int)$aContent['content_id']);

        $oConfig = $this->_oModule->_oConfig;
        $sModule = $oConfig->getContentModule($aEvent);
        $iContentId = $sModule !== '' ? (int)$oConfig->getContentObjectId($aEvent) : 0;
        return $iContentId > 0 ? BxDolApiV2Targets::content($sModule, $iContentId) : null;
    }

    /**
     * Content links are stored as standard links ('page.php?i=...') or with a {bx_url_root} marker.
     */
    protected function _url($sUrl)
    {
        $sUrl = str_replace('{bx_url_root}', BX_DOL_URL_ROOT, $sUrl);
        if (!preg_match('#^https?://#', $sUrl))
            $sUrl = BxDolPermalinks::getInstance()->permalink($sUrl);
        return $sUrl;
    }

    public static function schemas()
    {
        return [
            'Notification' => [
                'type' => 'object',
                'description' => 'A notification (`kind`, `actor`, `actors`, `data`, `updated_at`) with `source`, `module`, `text`, `url` and target fields. v2 does not coalesce: each notification is one event, so `actors` is 1 and `updated_at` is `created_at`.',
                'required' => ['id', 'kind', 'source', 'module', 'actors', 'text', 'object_kind', 'object_id', 'data', 'read', 'created_at', 'updated_at'],
                'properties' => [
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'kind' => [
                        'type' => 'string',
                        'description' => 'What happened: `graph.followed`, `graph.friend_requested`, `graph.befriended`, `social.reacted` (`data.kind`), `social.mentioned`, `social.comment` and `social.reply` (`data.comment_id`), `discussions.reply` (`data.comment_id`, `data.title`), `groups.join_requested`, `groups.approved`, `groups.invited` (`data.group_id`), `invites.joined`, `timeline.reposted` (`data.activity_id`); `other` for anything else, which `source` names. For `graph.*` and `invites.joined` the person is the `actor`: the follower, the one asking to be friends, the new friend, the new member. `groups.*` carry the group in `data.group_id`, and as `object_id` too. A kind says what happened to the recipient: a comment on a post of someone the viewer follows is `other`. More kinds may come: show an unknown one as `other`.',
                        'example' => 'social.comment',
                    ],
                    'source' => ['type' => 'string', 'description' => 'UNA\'s `<unit>.<action>` of the event (v2 only), e.g. `bx_timeline.commentPost`', 'example' => 'bx_timeline.commentPost'],
                    'module' => ['type' => 'string', 'description' => 'The event\'s unit, the first part of `source`'],
                    'actor' => BxDolApiV2Map::profileOrNullSchema() + ['description' => 'Who did it; null when anonymous. For `graph.*` and `invites.joined` the person it is about (the follower, the requester, the new friend, the new member); for `groups.join_requested` the one asking, not the group'],
                    'actors' => ['type' => 'integer', 'format' => 'int32', 'minimum' => 1, 'description' => 'How many actors this notification stands for: always 1, as v2 does not coalesce'],
                    'text' => ['type' => 'string', 'description' => 'What happened, in the viewer\'s language'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Where it happened, on the site'],
                    'object_kind' => [
                        'type' => 'string',
                        'enum' => ['content', 'profile', 'conversation', 'comment', 'other'],
                        'description' => 'What it is about, so a client can open it: `content` an Item (`object_id` for GET /content/{id}), `profile` a profile or a group (GET /profiles/{id}), `conversation` a conversation (GET /conversations/{id}), `comment` a comment (its id; `item_id` is the Item it is on and `thread_id`, for a reply, the top-level comment it is listed under in GET /comments/{id}/replies). `other` has no place in the API: open `url`. `social.comment`, `social.reply` and `discussions.reply` are about the Item the new comment is on (`content`, with the new comment as `data.comment_id` and, for a reply, `thread_id`); a reaction or mention is about what was reacted to or mentions the viewer (an Item, or a comment); `graph.*` about the profile; `groups.*` about the group (`profile`). `object_id` is always what `object_kind` names.',
                    ],
                    'object_id' => ['type' => ['string', 'null'], 'description' => 'The id of what `object_kind` names; null for `other`'],
                    'item_id' => ['type' => ['string', 'null'], 'description' => 'For a comment, the Item it is on'],
                    'thread_id' => ['type' => ['string', 'null'], 'description' => 'For a reply, the top-level comment it is listed under'],
                    'data' => [
                        'type' => 'object',
                        'description' => 'What the kind carries; `{}` for kinds with nothing more and for `other`',
                        'properties' => [
                            'kind' => ['type' => 'string', 'description' => '`social.reacted`: the reaction'],
                            'comment_id' => ['$ref' => '#/components/schemas/Id', 'description' => '`social.comment`, `social.reply`, `discussions.reply`: the new comment, on the Item `object_id`'],
                            'title' => ['type' => 'string', 'description' => '`discussions.reply`: the discussion\'s title'],
                            'group_id' => ['$ref' => '#/components/schemas/Id', 'description' => '`groups.*`: the group (its profile id), which `object_id` names too'],
                            'activity_id' => ['$ref' => '#/components/schemas/Id', 'description' => '`timeline.reposted`: the repost'],
                        ],
                    ],
                    'read' => ['type' => 'boolean'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time', 'description' => 'The newest actor\'s time: `created_at` in v2'],
                ],
            ],
            'Page_Notification' => BxDolApiV2Map::pageSchema('Notification'),
            'UnreadCount' => [
                'type' => 'object',
                'required' => ['unread'],
                'properties' => ['unread' => ['type' => 'integer']],
            ],
            'MarkRead' => [
                'type' => 'object',
                'additionalProperties' => false,
                'properties' => [
                    'ids' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Id'], 'maxItems' => 100],
                ],
            ],
        ];
    }
}

/** @} */
