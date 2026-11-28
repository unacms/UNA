<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: one cheap poll for what changed (GET /sync), where to listen for live events
 * (GET /realtime), and site links as places in the API (GET /links/resolve).
 *
 * GET /sync asks every endpoint class that defines apiV2Sync($iViewerId, $aCursor, $bReset)
 * for its part (BxDolApiV2Router::hooks): badge counts, new list entries and what it keeps in
 * the cursor. So a site without Conversations has no messages badge, and no module is named
 * here. GET /realtime asks them the same way for their channels (apiV2RealtimeChannels).
 */
class BxBaseApiV2Sync
{
    #[BxDolApiV2Operation(
        method: 'GET', path: '/realtime', id: 'getRealtime', tag: 'realtime',
        summary: 'Where to listen for live events',
        description: "The site's sockets server, which speaks the Pusher protocol (Soketi): `url` to open a WebSocket to and the app `key`, and the public channels a client listens to for what it shows: `activities` (the feed: events `added`, `edited` and `deleted`, each with the Activity's `id`) and, for a signed-in viewer, `connections` (event `changed` when one of the viewer's friendships or follows changes). An Item's comments come on its own channel (`Item.live.comments`: events `comment_added`, `comment_edited`, `comment_deleted`). Events carry ids, not content: anyone may listen to these channels, so a client loads what changed through this API, as the viewer may see it. `enabled` is false, with no `url`, when the site has no sockets server: a client then polls `GET /sync` alone. The channels a site lists depend on its modules; skip a name you do not know.",
        responses: [200 => 'Realtime'],
    )]
    public function getRealtime(BxDolApiV2Request $oReq)
    {
        $oSockets = BxDolSockets::getInstance();
        $aConfig = $oSockets && $oSockets->isEnabled() ? $oSockets->getClientConfig() : null;
        if (!$aConfig)
            return ['enabled' => false, 'url' => null, 'key' => null, 'channels' => new stdClass()];

        $iViewerId = (int)$oReq->viewerId();
        $aChannels = [];
        foreach (BxDolApiV2Router::hooks('apiV2RealtimeChannels') as $oEndpoint)
            if (is_array($a = $oEndpoint->apiV2RealtimeChannels($iViewerId)))
                $aChannels = array_merge($aChannels, $a);

        return ['enabled' => true, 'url' => self::socketUrl($aConfig), 'key' => $aConfig['key'], 'channels' => (object)$aChannels];
    }

    /**
     * The WebSocket address of a Pusher-protocol server (Soketi): ws or wss as the sockets URL's
     * scheme says, its host and port, the app key and the protocol version.
     */
    public static function socketUrl($aConfig)
    {
        $bSecure = in_array(strtolower((string)$aConfig['scheme']), ['https', 'wss'], true);
        $sPort = (string)$aConfig['port'] !== '' ? ':' . (int)$aConfig['port'] : '';
        return ($bSecure ? 'wss' : 'ws') . '://' . $aConfig['host'] . $sPort . '/app/' . rawurlencode($aConfig['key']) . '?protocol=7&client=una-api-v2&version=1';
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/sync', id: 'pollSync', tag: 'realtime', auth: 'required',
        summary: 'Badge counts and new notifications since the last sync',
        description: "One request for what a client polls: `badges` (unread notifications, unread messages, friend requests waiting, each the same count as its own endpoint) and, in `changes`, the notifications that came since `cursor` (`type` `notification`, the Notification as `data`). Send back the `cursor` of the previous answer; the first sync (no cursor) only starts one. A cursor of another profile (the account switched profiles) answers `reset` and starts over. When more came than one answer takes, it says `more`: sync again at once with its cursor for the rest (each part newest first).\n\nThe answer is the same while nothing changes, so a client that sends `If-None-Match` with the last ETag gets 304 Not Modified, with no body, until something does. The answer is a `SyncResponse` without held entities or list heads, so `lists` is empty. This API has no `POST /sync` (held entities, the `home` head) and no WebSocket: a client polls this instead and reloads what it holds.",
        params: ['cursor' => ['in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'The `cursor` of the previous sync']],
        responses: [200 => 'SyncResponse', 422 => null],
    )]
    public function pollSync(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();

        $aCursor = [];
        if (($sCursor = $oReq->query('cursor')) !== null) {
            $aCursor = BxDolApiV2Request::decodeCursor($sCursor);
            if (!is_array($aCursor) || !isset($aCursor['p']) || !is_int($aCursor['p']))
                throw BxDolApiV2Problem::validation([['field' => 'cursor', 'code' => 'invalid_cursor', 'message' => 'Pass back the cursor of a previous sync']]);
        }
        $bReset = isset($aCursor['p']) && $aCursor['p'] !== $iViewerId;

        $aNext = ['p' => $iViewerId];
        $aBadges = [];
        $aChanges = [];
        $bMore = false;
        foreach (BxDolApiV2Router::hooks('apiV2Sync') as $oEndpoint) {
            $a = $oEndpoint->apiV2Sync($iViewerId, $bReset ? [] : $aCursor, $bReset);
            if (!is_array($a))
                continue;
            $aBadges = array_merge($aBadges, $a['badges'] ?? []);
            $aChanges = array_merge($aChanges, $a['changes'] ?? []);
            $bMore = $bMore || !empty($a['more']);
            $aNext = array_merge($aNext, $a['cursor'] ?? []);
        }

        return [
            'cursor' => BxDolApiV2Request::encodeCursor($aNext),
            'changes' => $aChanges,
            // objects even when empty, as the schema says; GET /sync sends no list heads, so no lists
            'lists' => new stdClass(),
            'badges' => (object)$aBadges,
            'more' => $bMore,
            'reset' => $bReset,
        ];
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/links/resolve', id: 'resolveLink', tag: 'system',
        summary: 'Where a link to this site is in the API',
        description: 'A link to the page of one post, profile, group or conversation on this site (a permalink, an SEO link or a page.php link, as the site reads them), as the resource that shows it, so an app opens it itself instead of in the browser. Any other link, a link to another site, and a link to what the viewer may not see (a post hidden from them, a conversation they are not in) answer 404, the same as a link to nothing, so the answer never tells whether something hidden exists.',
        params: ['url' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'format' => 'uri', 'maxLength' => 2000], 'description' => 'An absolute http(s) link']],
        responses: [200 => 'LinkTarget', 404 => null, 422 => null],
    )]
    public function resolveLink(BxDolApiV2Request $oReq)
    {
        $sUrl = $oReq->query('url');
        if ($sUrl === null || get_mb_len($sUrl) > 2000 || !preg_match('#^https?://#i', $sUrl))
            throw BxDolApiV2Problem::validation([['field' => 'url', 'code' => 'invalid', 'message' => 'Pass an absolute http or https link']]);

        $a = BxDolApiV2Targets::url($sUrl);
        if (!$a)
            throw new BxDolApiV2Problem(404, 'not_found', 'This link is not to a post, profile, group or conversation of this site');

        $aTarget = [
            'kind' => $a['kind'],
            'id' => BxDolApiV2Map::id($a['id']),
            'item_id' => BxDolApiV2Map::idOrNull($a['item_id']),
            'thread_id' => BxDolApiV2Map::idOrNull($a['thread_id']),
        ];
        // which module's paths show a profile or a context (a group, a space)
        if (in_array($a['kind'], [BxDolApiV2Targets::PROFILE, BxDolApiV2Targets::GROUP], true) && ($oProfile = BxDolProfile::getInstance((int)$a['id'])))
            $aTarget['module'] = $oProfile->getModule();
        return $aTarget;
    }

    public static function schemas()
    {
        return [
            'Realtime' => [
                'type' => 'object',
                'description' => 'Where to listen for live events: a Pusher-protocol sockets server and the public channels for what a client shows',
                'required' => ['enabled', 'url', 'key', 'channels'],
                'properties' => [
                    'enabled' => ['type' => 'boolean', 'description' => 'The site has a sockets server; without one, poll GET /sync alone'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The WebSocket to open (ws or wss), with the app key and protocol 7 in it'],
                    'key' => ['type' => ['string', 'null'], 'description' => 'The app key the server knows the site by (public: it is in every site page that listens)'],
                    'channels' => [
                        'type' => 'object',
                        'description' => 'Public channels by what they carry: `activities` (the feed), `connections` (the viewer\'s friendships and follows). More may come: skip a name you do not know',
                        'additionalProperties' => ['type' => 'string'],
                    ],
                ],
            ],
            'SyncResponse' => [
                'type' => 'object',
                'description' => 'What changed since the cursor',
                'required' => ['cursor', 'changes', 'lists', 'badges', 'more', 'reset'],
                'properties' => [
                    'cursor' => ['type' => 'string', 'description' => 'Send it with the next sync'],
                    'changes' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Change'], 'description' => 'What changed since the cursor. Here the new notifications (`type` `notification`, `data` a Notification), newest first, when the site has Notifications; skip a `type` you do not know'],
                    'lists' => [
                        'type' => 'object',
                        'description' => 'New entries by list name, for the heads sent: always empty here, since GET /sync sends none',
                        'additionalProperties' => ['$ref' => '#/components/schemas/ListUpdate'],
                        'maxProperties' => 0,
                    ],
                    'badges' => ['$ref' => '#/components/schemas/Badges'],
                    'more' => ['type' => 'boolean', 'description' => 'More changes are waiting: sync again at once with this cursor'],
                    'reset' => ['type' => 'boolean', 'description' => 'The cursor was another profile\'s: reload lists'],
                ],
            ],
            'Change' => [
                'type' => 'object',
                'description' => 'An entity that changed, or a tombstone for one the viewer may no longer see',
                'required' => ['type', 'id'],
                'properties' => [
                    'type' => ['type' => 'string', 'description' => '`notification`, `activity`, ...'],
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'version' => ['type' => ['string', 'null'], 'description' => 'A digest of the entity as the viewer sees it; absent on tombstones'],
                    'data' => ['type' => ['object', 'null'], 'additionalProperties' => true, 'description' => 'The entity as its own endpoint answers it; absent on tombstones'],
                    'gone' => ['type' => 'boolean', 'description' => 'The viewer may no longer see it: drop it'],
                ],
            ],
            'ListUpdate' => [
                'type' => 'object',
                'description' => 'New entries at the top of a list the client shows',
                'required' => ['entries', 'gap'],
                'properties' => [
                    'entries' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Change'], 'description' => 'Newer than the cursor, newest first'],
                    'gap' => ['type' => 'boolean', 'description' => 'More arrived than fit: reload the list from the top'],
                ],
            ],
            'Badges' => [
                'type' => 'object',
                'description' => 'Counts to show on badges. A count is there when the site has its module.',
                'properties' => [
                    'notifications' => ['type' => 'integer', 'minimum' => 0, 'description' => 'Unread notifications, as GET /notifications/unread-count'],
                    'messages' => ['type' => 'integer', 'minimum' => 0, 'description' => 'Unread messages, as GET /conversations/unread-count'],
                    'friend_requests' => ['type' => 'integer', 'minimum' => 0, 'description' => 'Friend requests waiting, as many as GET /me/friend-requests lists'],
                ],
                'additionalProperties' => ['type' => 'integer'],
            ],
            'LinkTarget' => [
                'type' => 'object',
                'required' => ['kind', 'id', 'item_id', 'thread_id'],
                'properties' => [
                    'kind' => [
                        'type' => 'string',
                        'enum' => ['content', 'comment', 'profile', 'group', 'conversation'],
                        'description' => '`content`: GET /content/{id}. `profile` and `group`: GET /profiles/{id}; `group` is any context (a group, a space, an event), whose own paths `module` says. `conversation`: GET /conversations/{id}. `comment`: the comment `id` on the Item `item_id`.',
                    ],
                    'id' => ['$ref' => '#/components/schemas/Id'],
                    'item_id' => ['type' => ['string', 'null'], 'description' => 'For a comment, the Item it is on'],
                    'thread_id' => ['type' => ['string', 'null'], 'description' => 'For a reply, the top-level comment it is listed under'],
                    'module' => ['type' => 'string', 'description' => 'For `profile` and `group`, the profile\'s module (v2 only): a group\'s is `bx_groups`, a space\'s `bx_spaces`, so a client opens it through the paths of the module GET /api/v2 lists with that name', 'example' => 'bx_spaces'],
                ],
            ],
        ];
    }
}

/** @} */
