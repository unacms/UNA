<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of the Timeline: feeds, activities, feed posts and the Item an activity
 * shows.
 *
 * Content ids: an Item's id is the timeline event id, which is also what
 * /content/{id}/comments and /content/{id}/reaction take (BxBaseApiV2Comments,
 * BxBaseApiV2Reactions). The event knows which comments and reactions objects of its module
 * belong to it (apiV2Item), so these work for posts of every module that shows in the timeline.
 * A comment is found from its comments object: the event itself for the Timeline's comments,
 * the event the content was added with for another module's (apiV2ItemIdsByComments).
 *
 * A feed post's photos and videos are uploads (BxBaseApiV2Uploads) to the Timeline's storages
 * (apiV2PostUploadStorages).
 *
 * Visibility is the Timeline's own: events go through the same checks as on the site.
 */
class BxTimelineApiV2
{
    protected $_oModule;
    protected $_aAudienceToPrivacy;
    /** The uploads endpoint, for what it knows of the site's upload storages (_uploads). */
    protected $_oUploads = null;
    /** What _prefetchViewer read for a page: the event a repost of each event reposts, by event id. */
    protected $_aRepostedEvents = [];
    /** Reposted event id => whether the viewer reposted it, for the events of a page. */
    protected $_aRepostedByViewer = [];
    /** "module:content id" => whether it is in the viewer's favorites, for the events of a page. */
    protected $_aFavorites = [];
    /** "reactions object:object id" => the viewer's reaction or null, for the items of a page. */
    protected $_aItemReactions = [];
    /** "module:content id" => the Poll an item shows (or null: none), for the events of a page (_primePolls). */
    protected $_aPolls = [];

    public function __construct()
    {
        $this->_oModule = BxDolModule::getInstance('bx_timeline');
        // items carry the viewer's state (reaction, counters), so no shared item cache, as for API v1
        $this->_oModule->_oTemplate->setNoItemCache(true);

        bx_import('BxDolPrivacy'); // the BX_DOL_PG_* constants
        $this->_aAudienceToPrivacy = [
            'public' => BX_DOL_PG_ALL,
            'members' => BX_DOL_PG_MEMBERS,
            'friends' => BX_DOL_PG_FRIENDS,
            'private' => BX_DOL_PG_MEONLY,
        ];
    }

    /**
     * GET /api/v2 `modules`: this module is here, with the tag of its paths.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), 'feeds', 'activity');
    }

    /**
     * GET /layout/resolve (BxBaseApiV2Layout): the module's feed blocks as the feed each shows
     * (Home's public feed, the viewer's feed, Hot, For You; a profile's timeline on a page with
     * its `profile_id`, or a profile's page), and the site's Create Post block as the composer (`timeline.compose`,
     * which posts to the feeds, so it is the Timeline's while the module is enabled). Feeds the
     * API has no route for (channels, an account's profiles, media) are left out.
     */
    public function apiV2PageBlock($aCall, $aContext)
    {
        if ($aCall['module'] === 'system' && $aCall['method'] === 'get_create_post_form')
            return !empty($aContext['viewer']) ? ['kind' => 'timeline.compose', 'module' => 'bx_timeline'] : null;
        if ($aCall['module'] !== 'bx_timeline')
            return null;

        $sType = '';
        switch ($aCall['method']) {
            case 'get_block_view_home':
                $sType = BX_BASE_MOD_NTFS_TYPE_PUBLIC;
                break;
            case 'get_block_view_hot':
                $sType = BX_TIMELINE_TYPE_HOT;
                break;
            case 'get_block_view_feed_and_hot':
                $sType = BX_TIMELINE_TYPE_FOR_YOU;
                break;
            case 'get_block_views_timeline':
            case 'get_block_views_outline':
                $sType = is_string($aCall['params'][0] ?? null) ? $aCall['params'][0] : BX_BASE_MOD_NTFS_TYPE_PUBLIC;
                break;
            case 'get_block_view_profile':
            case 'get_block_view':
                // the profile the page shows: its profile_id, or its module's content id (a profile's page)
                $iProfile = BxBaseApiV2Layout::pageProfileId($aContext);
                return $iProfile > 0 ? ['kind' => 'timeline.profile', 'endpoint' => '/profiles/' . $iProfile . '/timeline'] : null;
        }

        // the feed each timeline type shows (the module's constants are defined by now)
        $aFeeds = [
            BX_BASE_MOD_NTFS_TYPE_PUBLIC => ['timeline.public', '/feeds/public'],
            BX_TIMELINE_TYPE_FEED => ['timeline.home', '/feeds/home'],
            BX_TIMELINE_TYPE_HOT => ['timeline.hot', '/feeds/hot'],
            BX_TIMELINE_TYPE_FOR_YOU => ['timeline.for_you', '/feeds/for-you'],
        ];
        if (!isset($aFeeds[$sType]))
            return null;
        list($sKind, $sEndpoint) = $aFeeds[$sType];
        return ['kind' => $sKind, 'endpoint' => $sEndpoint];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/feeds/public', id: 'publicFeed', tag: 'feeds', paged: true,
        summary: 'Everything public on the site, newest first', responses: [200 => 'Page_Activity'])]
    public function publicFeed(BxDolApiV2Request $oReq)
    {
        return $this->_feed($oReq, BX_BASE_MOD_NTFS_TYPE_PUBLIC);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/feeds/home', id: 'homeFeed', tag: 'feeds', auth: 'required', paged: true,
        summary: 'The viewer\'s own posts and what they follow', responses: [200 => 'Page_Activity'])]
    public function homeFeed(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        return $this->_feed($oReq, BX_TIMELINE_TYPE_FEED);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/feeds/hot', id: 'hotFeed', tag: 'feeds', paged: true,
        summary: 'Posts with the most activity lately', responses: [200 => 'Page_Activity'])]
    public function hotFeed(BxDolApiV2Request $oReq)
    {
        return $this->_feed($oReq, BX_TIMELINE_TYPE_HOT);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/feeds/for-you', id: 'forYouFeed', tag: 'feeds', paged: true,
        summary: 'The home feed mixed with hot posts', responses: [200 => 'Page_Activity'])]
    public function forYouFeed(BxDolApiV2Request $oReq)
    {
        return $this->_feed($oReq, $oReq->viewerId() ? BX_TIMELINE_TYPE_FOR_YOU : BX_TIMELINE_TYPE_HOT);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/profiles/{id}/timeline', id: 'profileTimeline', tag: 'feeds', paged: true,
        summary: 'What a profile posted and what was posted on its timeline', responses: [200 => 'Page_Activity', 403 => null])]
    public function profileTimeline(BxDolApiV2Request $oReq)
    {
        $iProfileId = $oReq->id();
        BxBaseApiV2Profiles::viewableProfile($iProfileId);
        return $this->_feed($oReq, BX_BASE_MOD_NTFS_TYPE_OWNER, $iProfileId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/activities/{id}', id: 'getActivity', tag: 'activities',
        summary: 'One activity of a feed', responses: [200 => 'Activity', 403 => null])]
    public function getActivity(BxDolApiV2Request $oReq)
    {
        return $this->_activity($this->_event($oReq->id()));
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/content/{id}', id: 'getItem', tag: 'content',
        summary: 'What an activity shows: a feed post, or content of another module',
        description: 'The id is an Item id, as in Activity.object.id and Comment.target_id. 404 when it does not exist (or was deleted), 403 when the viewer may not see it.',
        responses: [200 => 'Item', 403 => null])]
    public function getItem(BxDolApiV2Request $oReq)
    {
        return $this->_item($this->_event($oReq->id()));
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/activities/{id}', id: 'deleteActivity', tag: 'activities', auth: 'required',
        summary: 'Remove an activity from the feeds',
        description: 'For a feed post this deletes the post. For content of another module it removes the activity only; the content stays in its module.',
        responses: [204 => null, 403 => null])]
    public function deleteActivity(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aEvent = $this->_event($oReq->id());

        if (($mCheck = $this->_oModule->isAllowedDelete($aEvent)) !== true)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

        if (!$this->_oModule->deleteEvent($aEvent))
            throw new BxDolApiV2Problem(409, 'not_deleted', 'The activity could not be deleted');

        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/feed-posts', id: 'createFeedPost', tag: 'activities', auth: 'required',
        summary: 'Post to the viewer\'s timeline or to a context (group, event, ...)',
        body: 'NewFeedPost', responses: [201 => 'Activity', 403 => null])]
    public function createFeedPost(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        $aBody = $oReq->body();

        if (($mCheck = $this->_oModule->isAllowedPost()) !== true)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

        $iContextId = isset($aBody['context_id']) ? (int)$aBody['context_id'] : 0;
        $sAudience = $aBody['audience'] ?? 'public';

        if ($iContextId && !BxDolProfile::getInstance($iContextId))
            throw BxDolApiV2Problem::validation([['field' => 'context_id', 'code' => 'not_found', 'message' => 'No such context']]);

        // the form checks this too, but answers with a message block; a refusal is a 403 here
        if (!$this->_oModule->isAllowedApiV2PostDestination($iContextId ?: $iViewerId))
            throw BxDolApiV2Problem::forbidden($iContextId ? 'The viewer may not post in this context' : 'The viewer may not post on this timeline');

        $sText = (string)($aBody['body_html'] ?? '');
        $aLinks = BxDolApiV2Map::links($aBody['links'] ?? []);
        $aMedia = $this->_takeUploads($aBody['media_ids'] ?? [], $iViewerId);
        if ($sText === '' && !$aMedia['photo'] && !$aMedia['video'] && !$aLinks)
            throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'required', 'message' => 'A post needs text, media or links']]);

        $CNF = &$this->_oModule->_oConfig->CNF;
        $aResult = $this->_oModule->addApiV2Post([
            'type' => 'post',
            'text' => $sText,
            'owner_id' => $iContextId ?: $iViewerId,
            'object_privacy_view' => $iContextId ? -$iContextId : $this->_aAudienceToPrivacy[$sAudience],
        ] + array_filter($aMedia) + ($aLinks ? [$CNF['FIELD_LINK'] => implode(',', $aLinks)] : []));

        if (empty($aResult['id']) && empty($aResult['form_object']) && isset($aResult[0]['type']) && $aResult[0]['type'] === 'msg')
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text(is_string($aResult[0]['data'] ?? null) ? $aResult[0]['data'] : ''));

        if (empty($aResult['id']))
            throw BxDolApiV2Problem::validation($this->_formErrors($aResult), 'The post was not created');

        return BxDolApiV2Response::created($this->_activity($this->_event((int)$aResult['id'])), '/activities/' . (int)$aResult['id']);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/feed-posts/{id}', id: 'updateFeedPost', tag: 'activities', auth: 'required',
        summary: 'Edit a feed post: its text or who can see it',
        description: 'The id is an Activity id. The site\'s edit check applies: one\'s own posts where the site lets authors edit, any for moderators; reposts and content of other modules are not editable (403). `body_html` replaces the whole text (the site filters it, and does not clear a post\'s text: an empty one keeps the old). The post\'s media and location stay as they are. A post in a context keeps the context\'s audience (422 on `audience`).',
        body: 'FeedPostChanges', responses: [200 => 'Activity', 403 => null])]
    public function updateFeedPost(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aEvent = $this->_event($oReq->id());
        $aBody = $oReq->body();
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send body_html, audience or both']]);

        if (($mCheck = $this->_oModule->isAllowedEdit($aEvent)) !== true)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not edit this post');

        $iPrivacy = (int)$aEvent['object_privacy_view'];
        if (isset($aBody['audience']) && $iPrivacy < 0)
            throw BxDolApiV2Problem::validation([['field' => 'audience', 'code' => 'context_post', 'message' => 'A post in a context is seen by whom the context lets see it']]);

        $mResult = $this->_oModule->editApiV2Post((int)$aEvent['id'], array_filter([
            'text' => $aBody['body_html'] ?? null,
            'object_privacy_view' => isset($aBody['audience']) ? $this->_aAudienceToPrivacy[$aBody['audience']] : null,
        ], function ($m) { return $m !== null; }));

        if (!is_array($mResult) || empty($mResult['id']) || isset($mResult['message']) || isset($mResult['form'])) {
            if (is_array($mResult) && isset($mResult['message']))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($mResult['message']));
            throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'rejected', 'message' => 'The post was not saved']], 'The post was not saved');
        }

        // the post as it is now, not as this request read it before the edit
        $this->_oModule->_oTemplate->forgetMemoryCacheItem((int)$aEvent['id']);
        return $this->_activity($this->_event((int)$aEvent['id']));
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/content', id: 'searchContent', tag: 'search', limit: 'search', paged: true,
        summary: 'Content matching the words that the viewer may see, newest first',
        description: "Posts of the timeline and entries of content modules whose searchable fields (the site's search settings of each module) contain `q`, newest first across the modules. A hit is the Activity that shows the entry in the feeds, so it opens, takes comments and reactions like any other; an entry the viewer may not see (as GET /content/{id} decides: its audience, its module's own view check, the context it is in), or one no activity shows, is left out. The `kind` filter takes a module from the site's search sections for the API (`sys_api_search_sections`, profiles and groups excepted, for example `bx_timeline` or `bx_posts`); without it every one of them is searched. A hit is a Hit (`id`, `kind`, `author`, `card`, `published_at`, from the Item) plus `module` and the whole `activity`. A page can have fewer hits than `limit` and still a `next_cursor`, which holds where the search of each module got to.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
            'kind' => ['in' => 'query', 'schema' => ['type' => 'string'], 'description' => 'Only this module, for example `bx_timeline`; 422 for one that is not searched'],
        ],
        responses: [200 => 'Page_Hit', 422 => null])]
    public function searchContent(BxDolApiV2Request $oReq)
    {
        $sQuery = BxDolApiV2Search::query($oReq);
        $iLimit = $oReq->limit();

        $aSections = BxDolApiV2Search::contentSections();
        if (($sKind = $oReq->query('kind')) !== null) {
            if (!isset($aSections[$sKind]))
                throw BxDolApiV2Problem::validation([['field' => 'kind', 'code' => 'invalid_value', 'message' => 'Use one of: ' . implode(', ', array_keys($aSections))]]);
            $aSections = [$sKind => $aSections[$sKind]];
        }

        $a = BxDolApiV2Search::contentRows($oReq, $sQuery, $aSections, $iLimit);

        $aItems = [];
        $aSeen = [];
        foreach ($a['rows'] as $aRow) {
            $aEvent = $this->_searchHitEvent($aRow['kind'], (int)$aRow['id']);
            if (!$aEvent || isset($aSeen[(int)$aEvent['id']]))
                continue;
            $aSeen[(int)$aEvent['id']] = true;
            $aActivity = $this->_activity($aEvent);
            $aItems[] = [
                'id' => $aActivity['object']['id'],
                'kind' => $aActivity['object']['kind'],
                'author' => $aActivity['object']['author'],
                'card' => $aActivity['object']['card'],
                'published_at' => $aActivity['object']['published_at'],
                'module' => $aRow['kind'],
                'content_id' => $aActivity['object']['id'],
                'activity' => $aActivity,
            ];
        }

        return ['items' => $aItems, 'next_cursor' => $a['cursor']];
    }

    /**
     * The event that shows a search hit to the viewer, or null: the event itself for a
     * Timeline post, the first event the viewer may see of those another module's entry was
     * added with otherwise.
     */
    protected function _searchHitEvent($sKind, $iId)
    {
        $aIds = $sKind === $this->_oModule->getName() ? [$iId] : $this->_oModule->getApiV2EventIdsByContent($sKind, $iId);
        foreach ($aIds as $iEventId) {
            $iCode = 1;
            if (($aEvent = $this->_oModule->getApiV2Event((int)$iEventId, $iCode)) && $iCode === 0)
                return $aEvent;
        }
        return null;
    }

    /*
     * Targets (BxDolApiV2Targets)
     */

    /**
     * The Item that shows a module's content entry: the event itself for the Timeline's own
     * posts (when it still exists), otherwise the event the entry was added with. Null when
     * the Timeline shows none.
     */
    public function apiV2ContentTarget($sModule, $iContentId)
    {
        if ($sModule === $this->_oModule->getName()) {
            $aEvent = $this->_oModule->_oDb->getEvents(['browse' => 'id', 'value' => (int)$iContentId]);
            return !empty($aEvent['id']) ? BxDolApiV2Targets::make(BxDolApiV2Targets::CONTENT, $iContentId) : null;
        }

        $aIds = $this->_oModule->getApiV2EventIdsByContent($sModule, $iContentId);
        return $aIds ? BxDolApiV2Targets::make(BxDolApiV2Targets::CONTENT, $aIds[0]) : null;
    }

    /**
     * The Items of a page of another module's content in one query (BxDolApiV2Targets::primeContent):
     * content id => target, as apiV2ContentTarget finds each one (the event of the first of the
     * module's insert handlers that has one). Null for the Timeline's own posts.
     */
    public function apiV2ContentTargets($sModule, $aContentIds)
    {
        if ($sModule === $this->_oModule->getName())
            return null;

        $aActions = [];
        foreach ($this->_oModule->_oConfig->getHandlers() as $aHandler)
            if (is_array($aHandler) && $aHandler['type'] === BX_BASE_MOD_NTFS_HANDLER_TYPE_INSERT && $aHandler['alert_unit'] === $sModule)
                $aActions[] = (string)$aHandler['alert_action'];
        if (!$aActions)
            return [];

        $aRows = $this->_oModule->_oDb->getApiV2EventIdsByContents($sModule, $aActions, $aContentIds);
        $aResult = [];
        foreach ($aActions as $sAction)
            foreach ($aRows[$sAction] ?? [] as $iContentId => $iEventId)
                if (!isset($aResult[(int)$iContentId]))
                    $aResult[(int)$iContentId] = BxDolApiV2Targets::make(BxDolApiV2Targets::CONTENT, (int)$iEventId);
        return $aResult;
    }

    /**
     * An Item is visible when GET /content/{id} would show it to the viewer.
     */
    public function apiV2TargetVisible($aTarget)
    {
        if (($aTarget['kind'] ?? '') !== BxDolApiV2Targets::CONTENT)
            return null;
        $iCode = 1;
        return $this->_oModule->getApiV2Event((int)$aTarget['id'], $iCode) !== false && $iCode === 0;
    }

    /**
     * The Item of an id (BxDolApiV2Targets::item, for its comments and reactions): the event as
     * GET /content/{id} reads it, with its `comments` and `reactions` objects; false for one the
     * viewer may not see, null when there is none.
     */
    public function apiV2Item($iId)
    {
        $iCode = 1;
        $aEvent = $this->_oModule->getApiV2Event((int)$iId, $iCode);
        if ($aEvent)
            return $aEvent;
        return $iCode === 2 ? false : null;
    }

    /**
     * The events that may show the comments of a comments object's entry
     * (BxDolApiV2Targets::itemIdsByComments).
     */
    public function apiV2ItemIdsByComments($sSystem, $iObjectId)
    {
        return $this->_oModule->getApiV2EventIdsByComments($sSystem, $iObjectId);
    }

    /**
     * GET /reactions (BxBaseApiV2Reactions): the reactions object whose list of reactions the
     * site's items take, the Timeline's.
     */
    public function apiV2ReactionsObject()
    {
        return (string)$this->_oModule->_oConfig->getObject('reaction');
    }

    /**
     * POST /uploads (BxBaseApiV2Uploads), purpose `post`: the Timeline's photo and video
     * storages, with the post form's field and uploader of each.
     */
    public function apiV2PostUploadStorages()
    {
        $oConfig = $this->_oModule->_oConfig;
        $CNF = &$oConfig->CNF;
        return [
            ['object' => $oConfig->getObject('storage_photos'), 'kind' => 'image', 'field' => $CNF['FIELD_PHOTO'], 'uploader' => $CNF['OBJECT_UPLOADER_PHOTO_HTML5']],
            ['object' => $oConfig->getObject('storage_videos'), 'kind' => 'video', 'field' => $CNF['FIELD_VIDEO'], 'uploader' => $CNF['OBJECT_UPLOADER_VIDEO_HTML5']],
        ];
    }

    /**
     * Who may upload for a feed post is who may post one.
     */
    public function apiV2UploadAllowed($sPurpose)
    {
        return $this->_oModule->isAllowedPost();
    }

    /**
     * A post on a profile's or context's timeline (the profile module's timeline_post_common
     * alert) is about the post, the event in subobject_id.
     */
    public function apiV2NotificationTarget($aEvent)
    {
        if (($aEvent['action'] ?? '') !== 'timeline_post_common' || (int)($aEvent['subobject_id'] ?? 0) <= 0)
            return null;
        return BxDolApiV2Targets::make(BxDolApiV2Targets::CONTENT, (int)$aEvent['subobject_id']);
    }

    /**
     * A repost of the recipient's post is `timeline.reposted`, with the repost (the
     * new event, subobject_id) as data.activity_id; one of someone else's post is `other`. The
     * Timeline's comments and reactions are the system's kinds (BxNtfsApiV2::_kind).
     */
    public function apiV2NotificationKind($aEvent, $aTarget, $iViewerId)
    {
        if (($aEvent['type'] ?? '') !== $this->_oModule->_oConfig->getObject('alert') || ($aEvent['action'] ?? '') !== 'repost')
            return null;
        if ($iViewerId <= 0 || abs((int)$aEvent['object_owner_id']) !== (int)$iViewerId || (int)($aEvent['subobject_id'] ?? 0) <= 0)
            return ['kind' => 'other', 'data' => []];
        return ['kind' => 'timeline.reposted', 'data' => ['activity_id' => BxDolApiV2Map::id((int)$aEvent['subobject_id'])]];
    }

    /*
     * Mapping
     */

    protected function _feed(BxDolApiV2Request $oReq, $sType, $iOwnerId = 0)
    {
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        $aParams = $this->_oModule->getApiV2BrowseParams([
            'type' => $sType,
            'view' => BX_TIMELINE_VIEW_TIMELINE,
            'owner_id' => $iOwnerId,
            'start' => $iOffset,
            'per_page' => $iLimit + 1,
        ]);
        $aParams['return_data_type'] = 'array';

        // The cursor is a row of the feed's table, not a count of items: events the viewer may
        // not see are left out, as on the site, and the scan goes on past them, so a page with
        // hidden events never ends the feed early (see BxTimelineTemplate::getApiV2Posts).
        // An anonymous post is on its author's own timeline (owner_id is the author): listing it
        // there would name the author. Only those who may see who wrote it (the author, admins
        // and moderators, as BxDolProfileAnonymous decides) get it in that timeline.
        $fVisible = null;
        if ($sType === BX_BASE_MOD_NTFS_TYPE_OWNER && $iOwnerId)
            $fVisible = function ($aEvent) use ($iOwnerId) {
                $iAuthorId = (int)$aEvent['object_owner_id'];
                return $iAuthorId >= 0 || abs($iAuthorId) !== (int)$iOwnerId || BxDolProfileAnonymous::getInstance($iAuthorId)->isShowRealProfile();
            };

        // While the page is read and mapped, a file's row, a transcoded copy, a page's SEO link
        // and an entry's row are each read once (the site's pipeline asks for them again and
        // again), and what the rows of each batch need is read for the batch (_primeEvents).
        // A feed shows many modules' content, and asks whether each module is there.
        BxDolModuleQuery::getInstance()->primeEnabledByName();
        $iRows = BxDolStorageQuery::openFileRowsScope();
        $iHandlers = BxDolTranscoderQuery::openHandlersScope();
        $iSeo = BxDolPageQuery::openSeoLinksScope();
        $iContent = BxDolDb::openRowScope();
        try {
            $a = $this->_oModule->_oTemplate->getApiV2Posts($aParams, $iLimit, min(10 * ($iLimit + 1), 500), $fVisible, function ($aEvents) {
                $this->_primeEvents($aEvents);
            });
            $this->_prefetchViewer($a['events']);

            $aItems = [];
            foreach ($a['events'] as $aEvent)
                if (is_array($aEvent) && !empty($aEvent['id']))
                    $aItems[] = $this->_activity($aEvent);
        }
        finally {
            BxDolDb::closeRowScope($iContent);
            BxDolPageQuery::closeSeoLinksScope($iSeo);
            BxDolTranscoderQuery::closeHandlersScope($iHandlers);
            BxDolStorageQuery::closeFileRowsScope($iRows);
        }

        return $oReq->pageAt($aItems, $a['next']);
    }

    /**
     * What the site's checks and data of a batch of feed rows read (BxTimelineTemplate::getPost),
     * read for the batch inside the scopes _feed opens: the rows' privacy, their authors' and
     * owners' profiles, what the feed's own posts have attached (and those files), and for each
     * content module whose entries they show what its timeline post of them reads (the module's
     * primeTimelinePosts, or the entries' rows).
     */
    protected function _primeEvents($aEvents)
    {
        $oConfig = $this->_oModule->_oConfig;
        $CNF = &$oConfig->CNF;

        // What the rows show is read only for rows the privacy check will not leave out for
        // sure (hidden ones, and others' "me only" ones for those who are not admins): that the
        // check may still let one through (its hook) only costs that one's reads.
        $iViewerId = (int)bx_get_logged_profile_id();
        $bAdmin = isAdmin();
        $fShown = function ($sGroup, $iOwnerId) use ($iViewerId, $bAdmin) {
            return $sGroup !== BX_DOL_PG_HIDDEN && ($sGroup !== BX_DOL_PG_MEONLY || $bAdmin || ($iViewerId && $iViewerId === $iOwnerId));
        };

        $aSystem = $aCommon = $aByModule = $aCommonShown = $aProfiles = [];
        foreach ($aEvents as $aEvent) {
            if (!is_array($aEvent) || empty($aEvent['id']))
                continue;
            foreach (['owner_id', 'object_owner_id'] as $sKey)
                if (is_numeric($aEvent[$sKey] ?? null) && (int)$aEvent[$sKey] !== 0)
                    $aProfiles[] = abs((int)$aEvent[$sKey]);
            $sGroup = (string)$aEvent['object_privacy_view'];
            if ($oConfig->isSystem($aEvent['type'], $aEvent['action'])) {
                $aSystem[] = (int)$aEvent['id'];
                if ((int)$aEvent['object_id'] > 0 && $fShown($sGroup, is_numeric($aEvent['owner_id'] ?? null) ? (int)$aEvent['owner_id'] : 0))
                    $aByModule[(string)$aEvent['type']][] = (int)$aEvent['object_id'];
            }
            else {
                $aCommon[] = (int)$aEvent['id'];
                $aProfiles[] = abs((int)$aEvent['object_id']);
                if ($fShown($sGroup, (int)$aEvent['object_id']))
                    $aCommonShown[] = (int)$aEvent['id'];
            }
        }

        // the files of every module are read together at the end
        BxDolTranscoder::primeFilesLater();
        try {
            $this->_primeEventsOf($aSystem, $aCommon, $aCommonShown, $aByModule, $aProfiles);
        }
        finally {
            BxDolTranscoder::primeFilesNow();
        }
    }

    protected function _primeEventsOf($aSystem, $aCommon, $aCommonShown, $aByModule, $aProfiles)
    {
        $oConfig = $this->_oModule->_oConfig;
        $CNF = &$oConfig->CNF;

        // getPost checks a system event's privacy with its owner, a post's with its author
        $oPrivacy = BxDolPrivacy::getObjectInstance($oConfig->getObject('privacy_view'));
        if ($oPrivacy) {
            $oPrivacy->setTableFieldAuthor('owner_id');
            $oPrivacy->primeObjects($aSystem);
            $oPrivacy->setTableFieldAuthor('object_id');
            $oPrivacy->primeObjects($aCommon);
        }

        // the profiles' rows (the shown events' profiles are read whole for the page: _prefetchViewer)
        BxDolProfileQuery::getInstance()->primeInfos($aProfiles);

        // the feed's own posts: their links, photos, videos, files and polls, and the photos' and videos' files
        if ($aCommonShown) {
            $oDb = $this->_oModule->_oDb;
            $oDb->primeEventAttachments($aCommonShown);
            foreach ([[$CNF['FIELD_PHOTO'], 'storage_photos'], [$CNF['FIELD_VIDEO'], 'storage_videos']] as list($sType, $sStorage)) {
                $aFiles = [];
                foreach ($aCommonShown as $iId)
                    $aFiles = array_merge($aFiles, (array)$oDb->getMedia($sType, $iId));
                BxDolTranscoder::primeFilesOfStorage($oConfig->getObject($sStorage), $aFiles);
            }
        }

        foreach ($aByModule as $sModule => $aIds) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || !($oModule = BxDolModule::getInstance($sModule)) || !($oModule->_oDb instanceof BxBaseModGeneralDb))
                continue;
            if (method_exists($oModule, 'primeTimelinePosts'))
                $oModule->primeTimelinePosts($aIds);
            else
                $oModule->_oDb->primeContentInfos($aIds);
        }
    }

    protected function _event($iId)
    {
        $iCode = 1;
        $aEvent = $this->_oModule->getApiV2Event($iId, $iCode);
        if ($aEvent)
            return $aEvent;
        if ($iCode === 2)
            throw BxDolApiV2Problem::forbidden('The viewer may not see this activity');
        throw BxDolApiV2Problem::notFound('The activity');
    }

    /**
     * The uploads endpoint (one per endpoint object): the site's upload storages and uploads.
     */
    protected function _uploads()
    {
        if ($this->_oUploads === null)
            $this->_oUploads = new BxBaseApiV2Uploads();
        return $this->_oUploads;
    }

    protected function _activity($aEvent)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('common_post');
        $iAuthorId = (int)$aEvent['object_owner_id'];
        $iOwnerId = (int)$aEvent['owner_id'];

        // An anonymous post keeps its author as a negative id. Neither the actor nor the
        // timeline it is on may give that author away: the timeline of an anonymous post that
        // is not in a context is the author's own.
        $bAnonymous = $iAuthorId < 0;
        if ($bAnonymous && $iOwnerId === abs($iAuthorId))
            $iOwnerId = 0;

        $aActivity = [
            'id' => BxDolApiV2Map::id($aEvent['id']),
            'verb' => $aEvent['type'] === $sPrefix . 'repost' ? 'reposted' : 'posted',
            'actor' => $bAnonymous ? null : BxDolApiV2Map::profileSummary($iAuthorId),
            'owner_id' => BxDolApiV2Map::idOrNull($iOwnerId),
            'object' => $this->_item($aEvent),
            'pinned' => (int)$aEvent['pinned'] > 0,
            'sticky' => (int)$aEvent['sticked'] > 0,
            'promoted' => (int)$aEvent['promoted'] > 0,
            'viewer' => $this->_activityViewer($aEvent),
            'created_at' => BxDolApiV2Map::date($aEvent['date']),
        ];
        $aActivity['version'] = BxDolApiV2Map::version($aActivity);
        return $aActivity;
    }

    /**
     * What the viewer did with the activity and may do: whether they reposted what it shows
     * (to their own timeline, as v2 has no other repost) and whether the site lets them. Null
     * for guests. The viewer's reaction is the item's (object.viewer).
     */
    protected function _activityViewer($aEvent)
    {
        $iViewerId = (int)bx_get_logged_profile_id();
        if (!$iViewerId)
            return null;

        // what a repost would repost: the event itself, or the one a repost shows
        $iId = (int)$aEvent['id'];
        $aReposted = array_key_exists($iId, $this->_aRepostedEvents) ? $this->_aRepostedEvents[$iId] : $this->_repostedEvent($aEvent);
        if (!$aReposted)
            return ['reposted' => false, 'can_repost' => false];

        $iReposted = (int)$aReposted['id'];
        return [
            'reposted' => array_key_exists($iReposted, $this->_aRepostedByViewer) ? $this->_aRepostedByViewer[$iReposted] : $this->_oModule->_oDb->isReposted($iReposted, $iViewerId, $iViewerId),
            'can_repost' => $this->_oModule->isAllowedRepost($aReposted) === true,
        ];
    }

    /**
     * Read what a page of events needs in one query each instead of one per event: the badges
     * of their authors, and the viewer state, what the viewer reposted (_activityViewer) and,
     * per module, what is in their favorites (_favorited). Guests have no viewer state.
     */
    protected function _prefetchViewer($aEvents)
    {
        // the profiles the activities show (actors, authors, contexts), the contexts' memberships
        // and roles (the viewer's checks), and the events' rows (the viewer's checks read them again)
        $aProfiles = $aContexts = $aEventIds = [];
        foreach ($aEvents as $aEvent)
            if (is_array($aEvent) && !empty($aEvent['id'])) {
                $aEventIds[] = (int)$aEvent['id'];
                foreach (['object_owner_id', 'owner_id'] as $sKey)
                    if (is_numeric($aEvent[$sKey] ?? null) && (int)$aEvent[$sKey] > 0)
                        $aProfiles[] = (int)$aEvent[$sKey];
                if ((int)$aEvent['object_privacy_view'] < 0)
                    $aContexts[] = -(int)$aEvent['object_privacy_view'];
                elseif (is_numeric($aEvent['owner_id'] ?? null) && (int)$aEvent['owner_id'] > 0 && (int)$aEvent['owner_id'] !== abs((int)$aEvent['object_owner_id']))
                    $aContexts[] = (int)$aEvent['owner_id'];
            }
        BxDolApiV2Map::primeProfiles(array_merge($aProfiles, $aContexts));
        BxDolApiV2Targets::primeContexts($aContexts);
        $this->_oModule->_oDb->primeContentInfos($aEventIds);
        $this->_primePolls($aEvents);

        $iViewerId = (int)bx_get_logged_profile_id();
        if (!$iViewerId)
            return;

        $sPrefix = $this->_oModule->_oConfig->getPrefix('common_post');
        $aReposted = [];
        $aFavorites = [];
        $aReactions = [];
        foreach ($aEvents as $aEvent) {
            if (!is_array($aEvent) || empty($aEvent['id']))
                continue;
            if (!empty($aEvent['reactions']['system']) && (int)($aEvent['reactions']['object_id'] ?? 0) > 0)
                $aReactions[(string)$aEvent['reactions']['system']][] = (int)$aEvent['reactions']['object_id'];
            $aOriginal = $this->_repostedEvent($aEvent);
            $this->_aRepostedEvents[(int)$aEvent['id']] = $aOriginal;
            if ($aOriginal)
                $aReposted[] = (int)$aOriginal['id'];

            $sModule = (string)$aEvent['type'];
            if (strpos($sModule, $sPrefix) !== 0 && (int)$aEvent['object_id'] > 0)
                $aFavorites[$sModule][] = (int)$aEvent['object_id'];
        }

        if ($aReposted) {
            $aYes = array_flip($this->_oModule->_oDb->getRepostedIds($aReposted, $iViewerId, $iViewerId));
            foreach ($aReposted as $iId)
                $this->_aRepostedByViewer[$iId] = isset($aYes[$iId]);
        }

        // the viewer's reaction to each item (getReactionsBy's first), a query per reactions object
        foreach ($aReactions as $sSystem => $aIds) {
            $oReactions = BxDolVote::getObjectInstance($sSystem, 0);
            if (!$oReactions || !($oReactions instanceof BxDolVoteReactions))
                continue;
            $aGiven = $oReactions->getQueryObject()->getFirstReactionsByObjects($aIds, $iViewerId);
            foreach ($aIds as $iId)
                $this->_aItemReactions[$sSystem . ':' . $iId] = $aGiven[$iId] ?? null;
        }

        foreach ($aFavorites as $sModule => $aIds) {
            $oFavorite = $this->_favoriteObject($sModule);
            if (!$oFavorite)
                continue;
            $aYes = array_flip($oFavorite->getQueryObject()->getPerformedObjects($aIds, $iViewerId));
            foreach ($aIds as $iId)
                $this->_aFavorites[$sModule . ':' . $iId] = isset($aYes[$iId]);
        }
    }

    /**
     * The favorites object of a content module (CNF OBJECT_FAVORITES), null when it has none
     * or it is off.
     */
    protected function _favoriteObject($sModule)
    {
        static $aObjects = [];

        if (!array_key_exists($sModule, $aObjects)) {
            $aObjects[$sModule] = null;
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sModule)) {
                $CNF = BxDolApiV2Map::profileCnf($sModule);
                $oFavorite = !empty($CNF['OBJECT_FAVORITES']) ? BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], 0) : null;
                $aObjects[$sModule] = $oFavorite && $oFavorite->isEnabled() ? $oFavorite : null;
            }
        }
        return $aObjects[$sModule];
    }

    /**
     * The event a repost of this event reposts, as the site's repost button finds it: for a
     * repost the event it shows (its row), otherwise the event itself. Null when there is none.
     */
    protected function _repostedEvent($aEvent)
    {
        $oConfig = $this->_oModule->_oConfig;
        $sType = (string)$aEvent['type'];
        $sAction = (string)$aEvent['action'];
        $bSystem = $oConfig->isSystem($sType, $sAction);

        // the event itself (it has the event's own columns, which the repost check reads): no query
        if ($bSystem || str_replace($oConfig->getPrefix('common_post'), '', $sType) !== BX_TIMELINE_PARSE_TYPE_REPOST)
            return $aEvent;

        // a repost: the original its row names. The site's own lookup (getReposted) inserts a
        // missing system event; a GET must not write, so an original is used only when it exists
        $aRaw = $this->_oModule->_oDb->getEvents(['browse' => 'id', 'value' => (int)$aEvent['id']]);
        if (empty($aRaw) || !is_array($aRaw))
            return null;

        $aData = @unserialize((string)$aRaw['content']);
        if (!is_array($aData) || empty($aData['type']))
            return null;
        $aOriginal = $oConfig->isSystem($aData['type'], $aData['action'] ?? '')
            ? $this->_oModule->_oDb->getEvents(['browse' => 'descriptor', 'type' => $aData['type'], 'action' => $aData['action'] ?? '', 'object_id' => (int)($aData['object_id'] ?? 0)])
            : $this->_oModule->_oDb->getEvents(['browse' => 'id', 'value' => (int)($aData['object_id'] ?? 0)]);
        return !empty($aOriginal) && is_array($aOriginal) ? $aOriginal : null;
    }

    protected function _item($aEvent)
    {
        $aContent = is_array($aEvent['content'] ?? null) ? $aEvent['content'] : [];
        $iAuthorId = (int)$aEvent['object_owner_id'];
        $iPrivacy = (int)$aEvent['object_privacy_view'];
        $sPrefix = $this->_oModule->_oConfig->getPrefix('common_post');

        $iContextId = 0;
        if ($iPrivacy < 0)
            $iContextId = -$iPrivacy;
        elseif ((int)$aEvent['owner_id'] > 0 && (int)$aEvent['owner_id'] !== abs($iAuthorId))
            $iContextId = (int)$aEvent['owner_id'];

        $sHtml = (string)($aContent['text'] ?? '');

        $aItem = [
            'id' => BxDolApiV2Map::id($aEvent['id']),
            'kind' => $this->_itemKind((string)$aEvent['type']),
            'module' => strpos($aEvent['type'], $sPrefix) === 0 ? $this->_oModule->getName() : $aEvent['type'],
            'author' => $iAuthorId < 0 ? null : BxDolApiV2Map::profileSummary($iAuthorId),
            'anonymous' => $iAuthorId < 0,
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iContextId),
            'card' => [
                'title' => ($s = BxDolApiV2Map::text($aContent['title'] ?? '')) !== '' && strpos($aEvent['type'], $sPrefix) !== 0 ? $s : null,
                'text' => BxDolApiV2Map::text($sHtml, 600),
                'body_html' => $sHtml !== '' ? $sHtml : null,
                'url' => BxDolApiV2Map::absoluteUrl($aContent['url'] ?? ''),
            ],
            'media' => $this->_media($aContent),
            'links' => $this->_links($aContent),
            'stats' => [
                'comments' => (int)($aEvent['comments']['count'] ?? 0),
                'reactions' => (int)($aEvent['reactions']['count'] ?? 0),
                'reposts' => (int)($aEvent['reposts'] ?? 0),
                'views' => (int)($aEvent['views']['count'] ?? 0),
            ],
            'published_at' => BxDolApiV2Map::date($aEvent['date']),
            'viewer' => $this->_itemViewer($aEvent),
            'live' => $this->_live($aEvent),
        ];
        // Item.poll, for an item that is a poll (only there: other items' versions stay)
        if (($aPoll = $this->_poll($aEvent)))
            $aItem['poll'] = $aPoll;
        // v2's Item.entry_id, for an entry of a module with paths of its own (/posts/{id} ...)
        if (($iEntryId = $this->_entryId($aEvent)))
            $aItem['entry_id'] = BxDolApiV2Map::id($iEntryId);
        $aItem['version'] = BxDolApiV2Map::version($aItem);
        return $aItem;
    }

    /**
     * Item.live: the sockets channel its comments come on (BxDolCmts sends comment_added,
     * comment_edited and comment_deleted there), while the site has a sockets server and the
     * item takes comments. Null otherwise.
     */
    protected function _live($aEvent)
    {
        static $bSockets = null;
        if ($bSockets === null)
            $bSockets = ($oSockets = BxDolSockets::getInstance()) && $oSockets->isEnabled();

        $sSystem = (string)($aEvent['comments']['system'] ?? '');
        $iObjectId = (int)($aEvent['comments']['object_id'] ?? 0);
        if (!$bSockets || $sSystem === '' || $iObjectId <= 0)
            return null;
        return ['comments' => BxDolCmts::getSocketNameOf($sSystem) . '_' . $iObjectId];
    }

    /**
     * GET /realtime: the feed's channel, where the Timeline says `added`, `edited` and `deleted`
     * with an event's id (its content id 0 is every event's: BxTimelineModule::onPost ...).
     */
    public function apiV2RealtimeChannels($iViewerId)
    {
        return ['activities' => $this->_oModule->_oConfig->getSocketName() . '_0'];
    }

    /**
     * The Polls of a page of events, a call per module whose endpoint class gives them
     * (apiV2ItemPolls: Polls), which reads them at once.
     */
    protected function _primePolls($aEvents)
    {
        $sPrefix = $this->_oModule->_oConfig->getPrefix('common_post');
        $aByModule = [];
        foreach ($aEvents as $aEvent)
            if (is_array($aEvent) && !empty($aEvent['id']) && strpos((string)$aEvent['type'], $sPrefix) !== 0 && (int)$aEvent['object_id'] > 0 && !array_key_exists($aEvent['type'] . ':' . (int)$aEvent['object_id'], $this->_aPolls))
                $aByModule[(string)$aEvent['type']][] = (int)$aEvent['object_id'];

        foreach ($aByModule as $sModule => $aIds) {
            $aPolls = null;
            foreach (BxDolApiV2Router::hooks('apiV2ItemPolls', $sModule) as $oEndpoint)
                if (is_array($aPolls = $oEndpoint->apiV2ItemPolls($sModule, $aIds)))
                    break;
            // a module with no polls is cached too, so its other items do not ask again one by one
            foreach ($aIds as $iId)
                $this->_aPolls[$sModule . ':' . $iId] = is_array($aPolls) ? ($aPolls[$iId] ?? null) : null;
        }
    }

    /**
     * The Poll an event's item shows: read for the page (_primePolls), or for this one.
     */
    protected function _poll($aEvent)
    {
        if (strpos((string)$aEvent['type'], $this->_oModule->_oConfig->getPrefix('common_post')) === 0 || (int)$aEvent['object_id'] <= 0)
            return null;
        $sKey = $aEvent['type'] . ':' . (int)$aEvent['object_id'];
        if (!array_key_exists($sKey, $this->_aPolls))
            $this->_primePolls([$aEvent]);
        return $this->_aPolls[$sKey] ?? null;
    }

    /**
     * The id of the entry an event's item shows in its module's own paths (GET /posts/{id},
     * /videos/{id} ...): its content id, for a module whose endpoint class says its paths take
     * them (apiV2ItemEntry: the text and files bases); 0 for the Timeline's own posts and for
     * content of other modules (contexts, whose paths take profile ids).
     */
    protected function _entryId($aEvent)
    {
        static $aModules = [];

        $sType = (string)$aEvent['type'];
        if (strpos($sType, $this->_oModule->_oConfig->getPrefix('common_post')) === 0 || (int)$aEvent['object_id'] <= 0)
            return 0;
        if (!isset($aModules[$sType])) {
            $aModules[$sType] = false;
            foreach (BxDolApiV2Router::hooks('apiV2ItemEntry', $sType) as $oEndpoint)
                if ($oEndpoint->apiV2ItemEntry($sType) === true) {
                    $aModules[$sType] = true;
                    break;
                }
        }
        return $aModules[$sType] ? (int)$aEvent['object_id'] : 0;
    }

    /**
     * Item.kind: `feed_post` for the Timeline's own posts; for another module's
     * content what that module's ApiV2 class says (apiV2ItemKind: `post`, `discussion`), else
     * `content`. `module` says which module it is.
     */
    protected function _itemKind($sType)
    {
        static $aKinds = [];

        if (strpos($sType, $this->_oModule->_oConfig->getPrefix('common_post')) === 0)
            return 'feed_post';
        if (!isset($aKinds[$sType])) {
            $aKinds[$sType] = 'content';
            foreach (BxDolApiV2Router::hooks('apiV2ItemKind', $sType) as $oEndpoint)
                if (is_string($s = $oEndpoint->apiV2ItemKind($sType)) && $s !== '') {
                    $aKinds[$sType] = $s;
                    break;
                }
        }
        return $aKinds[$sType];
    }

    /**
     * The link previews a feed post shows (the Timeline's attached links), as a
     * LinkPreview. The site keeps no site name and no image size: `site_name` is the host, and
     * an image is 0 by 0.
     */
    protected function _links($aContent)
    {
        $aLinks = [];
        foreach ((array)($aContent['links'] ?? []) as $a) {
            if (!is_array($a) || empty($a['url']) || !is_string($a['url']))
                continue;
            $sHost = (string)(parse_url($a['url'], PHP_URL_HOST) ?: '');
            $sImage = !empty($a['thumbnail']) ? BxDolApiV2Map::absoluteUrl((string)$a['thumbnail']) : null;
            $aLinks[] = [
                'id' => BxDolApiV2Map::id($a['id'] ?? 0),
                'url' => $a['url'],
                'host' => $sHost,
                'state' => 'ready',
                'title' => BxDolApiV2Map::text((string)($a['title'] ?? '')),
                'description' => BxDolApiV2Map::text((string)($a['text'] ?? ''), 600),
                'site_name' => $sHost,
                'image' => $sImage !== null ? ['path' => $sImage, 'width' => 0, 'height' => 0] : null,
            ];
        }
        return $aLinks;
    }

    protected function _audience($iPrivacy)
    {
        if ($iPrivacy < 0)
            return 'context';
        switch ((string)$iPrivacy) {
            case BX_DOL_PG_ALL: return 'public';
            case BX_DOL_PG_MEMBERS: return 'members';
            case BX_DOL_PG_FRIENDS: return 'friends';
        }
        return 'private';
    }

    protected function _media($aContent)
    {
        $oConfig = $this->_oModule->_oConfig;
        $sPhotos = $oConfig->getObject('storage_photos');

        $aMedia = [];
        foreach (['images', 'images_attach'] as $sKey)
            foreach ((array)($aContent[$sKey] ?? []) as $a)
                if (is_array($a) && !empty($a['src'])) {
                    // the copies the Timeline makes of its own photos; another module's are of unknown size
                    $bOwn = ($a['storage'] ?? '') === $sPhotos;
                    list($sStorage, $iFileId) = $this->_mediaFile($a);
                    $aMedia[] = BxDolApiV2Map::media($this->_mediaId($a), 'image', 'ready', $sStorage, $iFileId, [
                        'thumb' => [$a['src_small'] ?? $a['src'], $bOwn ? $oConfig->getObject('transcoder_photos_view') : ''],
                        'medium' => [$a['src_medium'] ?? $a['src'], $bOwn ? $oConfig->getObject('transcoder_photos_medium') : ''],
                        'large' => [$a['src_orig'] ?? $a['src'], $bOwn ? $oConfig->getObject('transcoder_photos_big') : ''],
                    ], $a['src_orig'] ?? $a['src']);
                }

        foreach (['videos', 'videos_attach'] as $sKey)
            foreach ((array)($aContent[$sKey] ?? []) as $a)
                if (is_array($a) && (!empty($a['src_mp4']) || !empty($a['src_poster']))) {
                    $bOwn = ($a['storage'] ?? '') === $oConfig->getObject('storage_videos');
                    $sState = $this->_videoState($a);
                    $bHd = !empty($a['src_mp4_hd']);
                    list($sStorage, $iFileId) = $this->_mediaFile($a);
                    $aMedia[] = BxDolApiV2Map::media($this->_mediaId($a), 'video', $sState, $sStorage, $iFileId, $sState === 'ready' ? [
                        'mp4' => [$bHd ? $a['src_mp4_hd'] : ($a['src_mp4'] ?? null), $bOwn ? $oConfig->getObject($bHd ? 'transcoder_videos_mp4_hd' : 'transcoder_videos_mp4') : ''],
                        'poster' => [$a['src_poster'] ?? null, $bOwn ? $oConfig->getObject('transcoder_videos_poster') : ''],
                    ] : [], $bHd ? $a['src_mp4_hd'] : ($a['src_mp4'] ?? null));
                }

        return $aMedia;
    }

    /**
     * A media item's id: for a file of a known storage the storage and the file in one number
     * (uploadId), unique across storages and the same id as its upload; otherwise the file id.
     */
    protected function _mediaId($a)
    {
        $sStorage = isset($a['storage']) && is_string($a['storage']) ? $a['storage'] : '';
        $aObject = $sStorage !== '' ? BxDolStorageQuery::getStorageObject($sStorage) : null;
        return !empty($aObject['id']) && !empty($a['id']) ? BxDolApiV2Map::uploadId((int)$aObject['id'], (int)$a['id']) : BxDolApiV2Map::id($a['id'] ?? 0);
    }

    /**
     * A video of the Timeline's video storage is `processing` until its mp4 copy is made. Read
     * without the outdated check, which deletes transcoded copies older than the transcoder's
     * settings: a GET never changes files (the copy is made again when it is next requested).
     */
    protected function _videoState($a)
    {
        $bTimeline = false;
        foreach ($this->_uploads()->storages() as $aOne)
            if ($aOne['kind'] === 'video' && ($a['storage'] ?? '') === $aOne['object'])
                $bTimeline = true;
        if (!$bTimeline || empty($a['id']))
            return 'ready';

        $oTranscoder = BxDolTranscoder::getObjectInstance($this->_oModule->_oConfig->getObject('transcoder_videos_mp4'));
        return !$oTranscoder || $oTranscoder->isFileReady((int)$a['id'], false) ? 'ready' : 'processing';
    }

    /**
     * The storage and file of a media item, for its original's facts (size, type, name, link):
     * the timeline's own photos and videos and the covers of content modules name their
     * storage object (`storage`). ['', 0] for a file without one.
     * @return array [storage object or '', file id]
     */
    protected function _mediaFile($a)
    {
        return isset($a['storage']) && is_string($a['storage']) && !empty($a['id']) ? [$a['storage'], (int)$a['id']] : ['', 0];
    }

    /**
     * The uploads a new post takes. Each must be one of the viewer's uploads that no post has
     * yet; they are shown in the order given (the post form shows media in their ghosts' order).
     * @return array post form field (photo, video) => file ids
     */
    protected function _takeUploads($aIds, $iViewerId)
    {
        $aResult = [];
        foreach ($this->_uploads()->storages() as $aStorage)
            if ($aStorage['purpose'] === 'post')
                $aResult[$aStorage['field']] = [];

        $aErrors = [];
        $aSeen = [];
        $aOrder = [];
        foreach (array_values((array)$aIds) as $i => $sId) {
            $sField = 'media_ids[' . $i . ']';
            if (isset($aSeen[$sId])) {
                $aErrors[] = ['field' => $sField, 'code' => 'duplicate', 'message' => 'Is given twice'];
                continue;
            }
            $aSeen[$sId] = true;

            $aUpload = $this->_uploads()->find((int)$sId);
            if (!$aUpload || $aUpload[0]['purpose'] !== 'post' || (int)$aUpload[2]['profile_id'] !== (int)$iViewerId || (int)$aUpload[2]['content_id'] !== 0) {
                $aErrors[] = ['field' => $sField, 'code' => 'not_found', 'message' => 'No upload of yours that a post has not taken'];
                continue;
            }
            $aResult[$aUpload[0]['field']][] = $aUpload[1];
            $aOrder[$aUpload[0]['object']][] = $aUpload[1];
        }
        if ($aErrors)
            throw BxDolApiV2Problem::validation($aErrors, 'Some media are not uploads of yours');

        foreach ($aOrder as $sObject => $aFileIds)
            if (($oStorage = BxDolStorage::getObjectInstance($sObject)))
                $oStorage->reorderGhosts($iViewerId, 0, $aFileIds);

        return $aResult;
    }

    /**
     * POST /uploads and GET /uploads/{id} (BxBaseApiV2Uploads): an upload for a feed post as
     * Media, with the copies a post shows: for a photo the same transcoders as a post's photos,
     * for a video, once converted, its mp4 and poster.
     * @param array $aStorage one of apiV2PostUploadStorages, with the storage object's `id`
     */
    public function apiV2PostUploadMedia($aStorage, $iFileId)
    {
        $oConfig = $this->_oModule->_oConfig;
        $fCopy = function ($sTranscoder) use ($oConfig, $iFileId) {
            $sObject = $oConfig->getObject($sTranscoder);
            $o = BxDolTranscoder::getObjectInstance($sObject);
            return [$o ? (string)$o->getFileUrl($iFileId) : null, $sObject];
        };

        $sId = BxDolApiV2Map::uploadId($aStorage['id'], $iFileId);
        if ($aStorage['kind'] === 'image')
            return BxDolApiV2Map::media($sId, 'image', 'ready', $aStorage['object'], $iFileId, [
                'thumb' => $fCopy('transcoder_photos_view'),
                'medium' => $fCopy('transcoder_photos_medium'),
                'large' => $fCopy('transcoder_photos_big'),
            ]);

        $sState = $this->_videoState(['storage' => $aStorage['object'], 'id' => $iFileId]);
        return BxDolApiV2Map::media($sId, 'video', $sState, $aStorage['object'], $iFileId, $sState === 'ready' ? [
            'mp4' => $fCopy('transcoder_videos_mp4'),
            'poster' => $fCopy('transcoder_videos_poster'),
        ] : []);
    }

    /**
     * What the viewer did with the item and may do; null for guests.
     */
    protected function _itemViewer($aEvent)
    {
        $iViewerId = (int)bx_get_logged_profile_id();
        if (!$iViewerId)
            return null;

        $aViewer = [
            'reaction' => null,
            'favorited' => $this->_favorited($aEvent, $iViewerId),
            'can_react' => false,
            'can_comment' => false,
            'can_edit' => $this->_oModule->isAllowedEdit($aEvent) === true,
            'can_delete' => $this->_oModule->isAllowedDelete($aEvent) === true,
        ];

        if (($oReactions = BxBaseApiV2Reactions::objectOf($aEvent, false)) !== null) {
            $sKey = $aEvent['reactions']['system'] . ':' . (int)$oReactions->getId();
            $aViewer['reaction'] = array_key_exists($sKey, $this->_aItemReactions) ? $this->_aItemReactions[$sKey] : ($oReactions->getReactionsBy($oReactions->getId(), $iViewerId)[0] ?? null);
            $aViewer['can_react'] = (bool)$oReactions->isAllowedVote();
        }

        if (($oCmts = BxBaseApiV2Comments::objectOf($aEvent, false)) !== null)
            $aViewer['can_comment'] = (bool)$oCmts->isPostAllowed();

        return $aViewer;
    }

    /**
     * Whether the viewer has the content in their favorites: for content of a module with a
     * favorites object (CNF OBJECT_FAVORITES). Feed posts have none, so they are never.
     */
    protected function _favorited($aEvent, $iViewerId)
    {
        $sModule = (string)$aEvent['type'];
        $iObjectId = (int)$aEvent['object_id'];
        if (strpos($sModule, $this->_oModule->_oConfig->getPrefix('common_post')) === 0 || $iObjectId <= 0)
            return false;
        if (array_key_exists($sModule . ':' . $iObjectId, $this->_aFavorites))
            return $this->_aFavorites[$sModule . ':' . $iObjectId];

        $oFavorite = $this->_favoriteObject($sModule);
        return $oFavorite && $oFavorite->getQueryObject()->isPerformed($iObjectId, $iViewerId);
    }

    protected function _formErrors($aResult)
    {
        $aErrors = [];
        if (!empty($aResult['form_object']) && is_object($aResult['form_object']))
            foreach ($aResult['form_object']->aInputs as $sName => $aInput)
                if (is_array($aInput) && !empty($aInput['error']))
                    $aErrors[] = ['field' => $sName === 'text' ? 'body_html' : $sName, 'code' => 'rejected', 'message' => BxDolApiV2Map::text($aInput['error'])];

        if (!$aErrors)
            $aErrors[] = ['field' => '(body)', 'code' => 'rejected', 'message' => 'The post was not created'];
        return $aErrors;
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aProfileOrNull = BxDolApiV2Map::profileOrNullSchema();
        $aVersion = ['type' => 'string', 'description' => 'Changes whenever anything shown here changes for this viewer, except view counts (24 hex digits of a digest)'];

        // Item.poll names Poll, on a site without Polls too
        return BxDolApiV2Map::pollSchemas() + [
            'Audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private']],
            'Activity' => [
                'type' => 'object',
                'required' => ['id', 'verb', 'object', 'pinned', 'sticky', 'promoted', 'created_at', 'version'],
                'properties' => [
                    'id' => $aId,
                    'verb' => ['type' => 'string', 'enum' => ['posted', 'reposted']],
                    'actor' => $aProfileOrNull + ['description' => 'Who posted it; null for an anonymous post'],
                    'owner_id' => ['type' => ['string', 'null'], 'description' => 'The timeline (profile or context) it is on; null for an anonymous post on its author\'s own timeline'],
                    'object' => ['$ref' => '#/components/schemas/Item'],
                    'pinned' => ['type' => 'boolean'],
                    'sticky' => ['type' => 'boolean'],
                    'promoted' => ['type' => 'boolean'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ActivityViewer'], ['type' => 'null']], 'description' => 'Null for guests'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'version' => $aVersion,
                ],
            ],
            'ActivityViewer' => [
                'type' => 'object',
                'description' => 'What the signed-in viewer did with the activity. Their reaction is the item\'s: `object.viewer`.',
                'required' => ['reposted', 'can_repost'],
                'properties' => [
                    'reposted' => ['type' => 'boolean', 'description' => 'The viewer reposted what it shows to their own timeline'],
                    'can_repost' => ['type' => 'boolean', 'description' => 'The site lets the viewer repost it: public and members-only items'],
                ],
            ],
            'Page_Activity' => BxDolApiV2Map::pageSchema('Activity'),
            'Hit' => [
                'type' => 'object',
                'description' => 'A found item, as a feed shows it (a Hit), with the module it was found in and the activity that shows it.',
                'required' => ['id', 'kind', 'card', 'module', 'content_id', 'activity'],
                'properties' => [
                    'id' => $aId + ['description' => 'The Item id (GET /content/{id}), the same as activity.object.id'],
                    'kind' => ['type' => 'string', 'description' => 'The Item kind (activity.object.kind)', 'example' => 'feed_post'],
                    'author' => $aProfileOrNull,
                    'card' => ['$ref' => '#/components/schemas/Card'],
                    'published_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
                    'module' => ['type' => 'string', 'description' => 'The module it was found in, as the `kind` filter takes it (v2 only)', 'example' => 'bx_timeline'],
                    'content_id' => $aId + ['description' => 'The same as `id`; deprecated, from before the current shape', 'deprecated' => true],
                    'activity' => ['$ref' => '#/components/schemas/Activity'],
                ],
            ],
            'Page_Hit' => BxDolApiV2Map::pageSchema('Hit'),
            'Item' => [
                'type' => 'object',
                'description' => 'What an activity shows: a feed post, or content of another module. `id` is the id for /content/{id}/comments and /content/{id}/reaction.',
                'required' => ['id', 'kind', 'module', 'anonymous', 'audience', 'card', 'media', 'links', 'stats', 'published_at'],
                'properties' => [
                    'id' => $aId,
                    'kind' => ['type' => 'string', 'examples' => ['feed_post', 'post', 'discussion', 'content'], 'description' => '`feed_post` (the Timeline\'s posts), `post` (Posts), `discussion` (Discussions), and `content` for another module\'s entry, which `module` names. More may come: treat an unknown kind as `content`'],
                    'module' => ['type' => 'string', 'example' => 'bx_posts'],
                    'author' => $aProfileOrNull,
                    'anonymous' => ['type' => 'boolean'],
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'context_id' => ['type' => ['string', 'null']],
                    'card' => ['$ref' => '#/components/schemas/Card'],
                    'media' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Media']],
                    'links' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/LinkPreview'], 'description' => 'Previews of the links a feed post has (the Timeline\'s attached links); empty for other content'],
                    'stats' => ['$ref' => '#/components/schemas/ItemStats'],
                    'published_at' => ['type' => 'string', 'format' => 'date-time'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ItemViewer'], ['type' => 'null']], 'description' => 'What the viewer did with the item and may do; null for guests'],
                    'live' => [
                        'type' => ['object', 'null'],
                        'description' => 'v2 only. The sockets channel of the item\'s comments (GET /realtime: events comment_added, comment_edited and comment_deleted, ids only), while the site has a sockets server and the item takes comments; null otherwise. Left out where a module draws its items without it',
                        'required' => ['comments'],
                        'properties' => ['comments' => ['type' => 'string']],
                    ],
                    'poll' => ['$ref' => '#/components/schemas/Poll', 'description' => 'The poll an item of kind `poll` is (Polls), so a client shows its answers and votes in place (PUT /polls/{id}/vote). Left out for other items'],
                    'entry_id' => array_merge($aId, ['description' => 'v2 only. For an entry of a module with paths of its own here (Posts, Videos, Photos, Albums, Files, Polls, Tasks, Discussions), its id there: GET /posts/{entry_id} opens the post this item shows. Left out for feed posts and other content']),
                    'version' => ['type' => 'string', 'description' => 'Changes whenever anything shown here changes for this viewer, except view counts (24 hex digits of a digest)'],
                ],
            ],
            'Card' => [
                'type' => 'object',
                'required' => ['text'],
                'properties' => [
                    'title' => ['type' => ['string', 'null']],
                    'text' => ['type' => 'string', 'description' => 'Plain text, shortened'],
                    'body_html' => ['type' => ['string', 'null'], 'description' => 'The full text as HTML, filtered by the site; sanitize it again before display'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The content page on the site'],
                ],
            ],
            'LinkPreview' => BxDolApiV2Map::linkPreviewSchema(),
            'LinkImage' => BxDolApiV2Map::linkImageSchema(),
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
            'ItemStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'reposts', 'views'],
                'properties' => [
                    'comments' => ['type' => 'integer'],
                    'reactions' => ['type' => 'integer'],
                    'reposts' => ['type' => 'integer'],
                    'views' => ['type' => 'integer'],
                ],
            ],
            'ItemViewer' => BxDolApiV2Map::itemViewerSchema(),
            'NewFeedPost' => [
                'type' => 'object',
                'description' => 'A post needs `body_html`, `media_ids`, `links` or more of them.',
                'additionalProperties' => false,
                'properties' => [
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50000, 'description' => 'HTML; the site filters it'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'Post in this group, event or other context instead of the viewer\'s timeline'],
                    'media_ids' => ['type' => 'array', 'maxItems' => 20, 'items' => $aId, 'description' => 'The viewer\'s uploads (Media ids from POST /uploads) to show in the post, in this order. An id that is not an upload of the viewer\'s, or one a post already took, is 422.'],
                    'links' => ['type' => 'array', 'maxItems' => BxDolApiV2Map::LINKS_MAX, 'items' => ['type' => 'string', 'format' => 'uri', 'maxLength' => 2000], 'description' => 'Links to attach with their previews, as the site\'s post form attaches them (the site reads each page, and `links` of the item shows them). Absolute http(s) links to public addresses only: another is 422 on `links[i]`.'],
                ],
            ],
            'FeedPostChanges' => [
                'type' => 'object',
                'description' => 'What to change in a feed post; at least one field.',
                'additionalProperties' => false,
                'properties' => [
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50000, 'description' => 'HTML that replaces the whole text; the site filters it'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private']],
                ],
            ],
        ];
    }
}

/** @} */
