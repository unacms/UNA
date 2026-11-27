<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Forum Forum
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Discussions: the router finds this class only while the module is enabled.
 *
 * A discussion is an entry of the module: its title, its text, a category and who may see it
 * (an audience, or a context: a group it is in). Its replies are the module's comments, which
 * the API already has for every item the Timeline shows: `Discussion.content_id` is that Item
 * (/content/{id}), so /content/{id}/comments lists and takes the replies and
 * /comments/{id}/replies the answers to one, with the same Comment shape and checks as a post's.
 * A discussion the Timeline shows nothing for (made while the Timeline was not installed) has
 * no content_id, and its replies are on the site only.
 *
 * Visibility is the module's own: lists are the module's search results (its active entries,
 * its privacy conditions), and every discussion shown goes through its view check, as on the
 * site. Changes go through the module's forms helper and its permission checks, so the site's
 * validation, alerts (the Timeline, notifications, subscriptions) and ACL counters apply.
 */
class BxForumApiV2 extends BxBaseModTextApiV2
{
    const API_TAG = 'discussions';
    const API_KIND = 'discussion';
    const API_NOUN = 'discussion';
    const API_NOUN_PLURAL = 'discussions';
    const API_VERB = 'start';
    const API_VERB_PAST = 'started';

    /** The add form's categories, read once per request (_categories). */
    protected $_aCategories = null;

    /** GET /discussions `sort`. */
    const LIST_SORTS = ['latest', 'new', 'featured'];

    /** GET /layout/resolve: the module's browse blocks as a sort of GET /discussions (Featured Discussions and the list). */
    const PAGE_BLOCK_SORTS = ['browse_featured' => 'featured', 'browse_latest' => 'latest', 'browse_new' => 'new'];

    public function __construct()
    {
        parent::__construct('bx_forum');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/discussions', id: 'listDiscussions', tag: 'discussions', paged: true,
        summary: 'Discussions the viewer may see, the most recently replied to first',
        description: 'As the site\'s browse pages list them: active discussions, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort` `latest` (the default) orders by the last reply (a discussion without replies by when it started), `new` by when it started, `featured` keeps the featured ones, the last featured first (the site\'s Featured Discussions). `category` keeps one category (GET /discussions/categories), `context_id` the discussions in a group (or another context) the viewer may see; a context the viewer may not see is 403.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => self::LIST_SORTS, 'default' => 'latest']],
            'category' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A category id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A group\'s (or other context\'s) profile id'],
        ],
        responses: [200 => 'Page_Discussion', 403 => null, 422 => null])]
    public function listDiscussions(BxDolApiV2Request $oReq)
    {
        $sSort = (string)$oReq->query('sort', 'latest');
        if (!in_array($sSort, self::LIST_SORTS, true))
            throw BxDolApiV2Problem::validation([['field' => 'sort', 'code' => 'invalid_value', 'message' => 'Use ' . implode(', ', self::LIST_SORTS)]]);

        $iCategory = $this->_idParam($oReq, 'category');
        if ($iCategory && !isset($this->_categories()[$iCategory]))
            throw BxDolApiV2Problem::validation([['field' => 'category', 'code' => 'not_found', 'message' => 'No such category']]);

        $iContextId = $this->_idParam($oReq, 'context_id');
        if ($iContextId)
            $this->_viewableContext($iContextId);

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aIds = $this->_discussionRows($sSort, $iCategory, $iContextId, $iOffset, $iLimit + 1);

        $aItems = $this->_discussions($this->_visibleContents(array_slice($aIds, 0, $iLimit)), (int)$oReq->viewerId());

        return $oReq->pageAt($aItems, count($aIds) > $iLimit ? $iOffset + $iLimit : null);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/discussions/categories', id: 'listDiscussionCategories', tag: 'discussions',
        summary: 'The categories a discussion can be in, and whether the viewer may start one',
        description: 'The categories the site\'s form for a new discussion offers, in its order. `can_create` says whether POST /discussions would be accepted (the membership level may create discussions); false for guests. With `counts=true` each has `count`, as the site\'s Categories block counts its discussions (GET /discussions?category= lists them).',
        params: ['counts' => self::CATEGORY_COUNTS_PARAM],
        responses: [200 => 'DiscussionCategories', 422 => null])]
    public function listDiscussionCategories(BxDolApiV2Request $oReq)
    {
        $aCounts = $oReq->queryBool('counts') ? $this->_categoryCounts() : null;
        $aCategories = [];
        foreach ($this->_categories() as $iId => $sTitle) {
            $a = ['id' => BxDolApiV2Map::id($iId), 'title' => $sTitle];
            if ($aCounts !== null)
                $a['count'] = (int)($aCounts[$iId] ?? 0);
            $aCategories[] = $a;
        }

        return [
            'categories' => $aCategories,
            'can_create' => $oReq->viewerId() > 0 && $this->_oModule->checkAllowedAdd() === CHECK_ACTION_RESULT_ALLOWED,
        ];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/discussions/{id}', id: 'getDiscussion', tag: 'discussions',
        summary: 'A discussion, with what the viewer may do with it',
        description: 'Counts a view, as opening it on the site does (once a day per viewer). 404 when there is none (or it was deleted, or it is hidden or waiting for approval and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it (one in a closed group from outside). Its replies are GET /content/{content_id}/comments.',
        responses: [200 => 'Discussion', 403 => null])]
    public function getDiscussion(BxDolApiV2Request $oReq)
    {
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);

        return $this->_discussion($this->_countView($aContent), (int)$oReq->viewerId());
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/discussions', id: 'createDiscussion', tag: 'discussions', auth: 'required',
        summary: 'Start a discussion',
        description: 'Send `body` (plain text: each line is a paragraph, and a literal `<` stays text) or `body_html` (HTML as the site\'s editor writes it: formatting, lists, quotes, code, links, mentions, hashtags and pictures; the site\'s form filters it and indexes its mentions and hashtags), not both. Without `category_id` the first category is used. `context_id` puts it in a group (or another context) whose members may post discussions there (403 otherwise); its audience is then the group\'s, so `audience` may not be sent with it (422). The site\'s own checks of the form apply (422 with its message for a field it refuses).',
        body: 'NewDiscussion', responses: [201 => 'Discussion', 403 => null])]
    public function createDiscussion(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (($mCheck = $this->_oModule->checkAllowedAdd()) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not start discussions');

        $aCategories = $this->_categories();
        $iCategory = isset($aBody['category_id']) ? (int)$aBody['category_id'] : (int)array_key_first($aCategories);
        if (!isset($aCategories[$iCategory]))
            throw BxDolApiV2Problem::validation([['field' => 'category_id', 'code' => 'not_found', 'message' => 'No such category']]);

        $iContextId = isset($aBody['context_id']) ? (int)$aBody['context_id'] : 0;
        if ($iContextId && isset($aBody['audience']))
            throw BxDolApiV2Problem::validation([['field' => 'audience', 'code' => 'context_post', 'message' => 'A discussion in a context is seen by whom the context lets see it']]);
        if ($iContextId)
            $this->_checkPostInContext($iContextId);

        $sHtml = $this->_bodyHtml($aBody);
        $sTitle = trim((string)$aBody['title']);
        if ($sTitle === '')
            throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A discussion needs a title']]);

        $a = $this->_oModule->serviceEntityAdd($iViewerId, [
            $CNF['FIELD_TITLE'] => $sTitle,
            $CNF['FIELD_CATEGORY'] => $iCategory,
            $CNF['FIELD_TEXT'] => $sHtml,
            $CNF['FIELD_ALLOW_VIEW_TO'] => $iContextId ? -$iContextId : $this->_privacyOf($aBody['audience'] ?? 'public'),
        ]);
        if (!isset($a['code']) || (int)$a['code'] !== 0 || empty($a['content'][$CNF['FIELD_ID']]))
            throw BxDolApiV2Problem::validation($this->_formErrors($a), 'The discussion was not started');

        // the ACL counter, as the site's add form counts it
        $this->_oModule->checkAllowedAdd(true);

        $iId = (int)$a['content'][$CNF['FIELD_ID']];
        return BxDolApiV2Response::created($this->_discussion($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId), '/discussions/' . $iId);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/discussions/{id}', id: 'updateDiscussion', tag: 'discussions', auth: 'required',
        summary: 'Edit a discussion: its title, text or category',
        description: 'One\'s own, or any for moderators and the admins of the group it is in (the module\'s edit check; 403 otherwise). `body` (plain text) or `body_html` (as in NewDiscussion) replaces the whole text; a plain-text `body` would lose links, mentions or formatting, so for a discussion whose text has them (`viewer.can_edit_text` is false) it is 409 formatted_text: send `body_html`. Who may see it does not change here.',
        body: 'DiscussionChanges', responses: [200 => 'Discussion', 403 => null, 409 => null])]
    public function updateDiscussion(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send title, body, category_id or more of them']]);

        if (($mCheck = $this->_oModule->checkAllowedEdit($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not edit this discussion');

        $aValues = [];
        if (isset($aBody['title'])) {
            if (($sTitle = trim((string)$aBody['title'])) === '')
                throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A discussion needs a title']]);
            $aValues[$CNF['FIELD_TITLE']] = $sTitle;
        }
        if (isset($aBody['category_id'])) {
            if (!isset($this->_categories()[(int)$aBody['category_id']]))
                throw BxDolApiV2Problem::validation([['field' => 'category_id', 'code' => 'not_found', 'message' => 'No such category']]);
            $aValues[$CNF['FIELD_CATEGORY']] = (int)$aBody['category_id'];
        }
        if (isset($aBody['body']) || isset($aBody['body_html'])) {
            if (isset($aBody['body']) && !isset($aBody['body_html']) && !BxDolApiV2Map::isPlainHtml($aContent[$CNF['FIELD_TEXT']]))
                throw new BxDolApiV2Problem(409, 'formatted_text', 'This discussion has links, mentions or formatting that a plain-text edit would lose; send body_html');
            $aValues[$CNF['FIELD_TEXT']] = $this->_bodyHtml($aBody);
        }

        $iId = (int)$aContent[$CNF['FIELD_ID']];
        // the edit runs the form's db passes (the site's HTML filter on the text) on what it is given
        $sError = BxDolApiV2Forms::editEntity($this->_oModule, $iId, $aValues);
        if ($sError !== '')
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)]], 'The discussion was not saved');

        // the ACL counter, as the site's edit form counts it
        $this->_oModule->checkAllowedEdit($aContent, true);

        return $this->_discussion($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/discussions/{id}', id: 'deleteDiscussion', tag: 'discussions', auth: 'required',
        summary: 'Delete a discussion, with its replies',
        description: 'One\'s own where the membership level may delete discussions, or any for administrators and the admins of the group it is in (the module\'s delete check; 403 otherwise). Its replies, its activity in the feeds and its files go with it, as on the site.',
        responses: [204 => null, 403 => null])]
    public function deleteDiscussion(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/discussions', id: 'searchDiscussions', tag: 'search', limit: 'search', paged: true,
        summary: 'Discussions whose title, text or replies contain the words, newest first',
        description: "The module's keyword search (the fields its search settings name: by default the title, the text and the replies' text), newest first, of the discussions the viewer may see (as GET /discussions/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_Discussion', 422 => null])]
    public function searchDiscussions(BxDolApiV2Request $oReq)
    {
        $a = $this->_searchContents($oReq);
        return ['items' => $this->_discussions($a['contents'], (int)$oReq->viewerId()), 'next_cursor' => $a['cursor']];
    }

    /*
     * Reading
     */

    /**
     * Ids of the module's browse list (BxBaseModTextApiV2::_browseRows): in a context, in a
     * category, or all, by the last reply (or when it started, `new`), the id breaking ties.
     */
    protected function _discussionRows($sSort, $iCategory, $iContextId, $iStart, $iPerPage)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if ($iContextId)
            list($sMode, $aParams) = ['context', ['context' => $iContextId]];
        elseif ($iCategory)
            list($sMode, $aParams) = ['category', ['category' => $iCategory]];
        else
            list($sMode, $aParams) = ['latest', []];

        $aRestrictions = $iCategory ? ['category' => $iCategory] : [];
        // featured ones only (the search result's restriction is "not 0" once it has a value), the last featured first
        if ($sSort === 'featured')
            $aRestrictions['featured'] = '0';
        $sField = $sSort === 'new' ? $CNF['FIELD_ADDED'] : ($sSort === 'featured' ? 'featured' : $CNF['FIELD_LR_ADDED']);
        return $this->_browseRows($sMode, $aParams, $iStart, $iPerPage, '`' . $CNF['TABLE_ENTRIES'] . '`.`' . $sField . '` DESC', $aRestrictions);
    }

    /**
     * The categories the add form offers: id => title.
     */
    protected function _categories()
    {
        if ($this->_aCategories !== null)
            return $this->_aCategories;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = $this->_oModule->getFormsHelper()->getObjectFormAdd();
        $aValues = $oForm && isset($oForm->aInputs[$CNF['FIELD_CATEGORY']]['values']) ? $oForm->aInputs[$CNF['FIELD_CATEGORY']]['values'] : [];

        $aResult = [];
        foreach ((array)$aValues as $mKey => $mValue) {
            // a list of key => title, or of ['key' => ..., 'value' => ...]
            list($iId, $sTitle) = is_array($mValue) ? [(int)($mValue['key'] ?? 0), (string)($mValue['value'] ?? '')] : [(int)$mKey, (string)$mValue];
            if ($iId > 0)
                $aResult[$iId] = BxDolApiV2Map::text($sTitle);
        }
        return $this->_aCategories = $aResult;
    }

    /*
     * Notifications
     */

    /**
     * A reply in a discussion (a comment or a reply to one in the module's comments object) is
     * `discussions.reply` for every recipient (its author and those following it),
     * with the new comment and the discussion's title. commentPost is on the discussion;
     * replyPost is on the parent comment, whose discussion is read from it.
     */
    public function apiV2NotificationKind($aEvent, $aTarget, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sAction = (string)($aEvent['action'] ?? '');
        if (empty($CNF['OBJECT_COMMENTS']) || ($aEvent['type'] ?? '') !== $CNF['OBJECT_COMMENTS'] || !in_array($sAction, ['commentPost', 'replyPost'], true))
            return null;
        if (!$aTarget || $aTarget['kind'] !== BxDolApiV2Targets::COMMENT)
            return ['kind' => 'other', 'data' => []];

        $iDiscussionId = (int)$aEvent['object_id'];
        if ($sAction === 'replyPost') {
            $oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], 0, false);
            $aParent = $oCmts ? $oCmts->getQueryObject()->getCommentById($iDiscussionId) : [];
            $iDiscussionId = is_array($aParent) ? (int)($aParent['cmt_object_id'] ?? 0) : 0;
        }
        $aContent = $iDiscussionId > 0 ? $this->_oModule->_oDb->getContentInfoById($iDiscussionId) : [];

        return ['kind' => 'discussions.reply', 'data' => [
            'comment_id' => BxDolApiV2Map::id($aTarget['id']),
            'title' => is_array($aContent) ? trim((string)($aContent[$CNF['FIELD_TITLE']] ?? '')) : '',
        ]];
    }

    /*
     * Mapping
     */

    /**
     * A page of discussions, their authors' and last repliers' badges read in one query.
     */
    protected function _discussions($aContents, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        BxDolApiV2Map::primeBadges(array_merge(array_column($aContents, $CNF['FIELD_AUTHOR']), array_column($aContents, $CNF['FIELD_LR_AUTHOR'])));
        BxDolApiV2Targets::primeContent($this->_oModule->getName(), array_column($aContents, $CNF['FIELD_ID']));

        $aItems = [];
        foreach ($aContents as $aContent)
            $aItems[] = $this->_discussion($aContent, $iViewerId);
        return $aItems;
    }

    protected function _discussion($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $iReplies = (int)$aContent[$CNF['FIELD_COMMENTS']];
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];
        $iCategory = (int)$aContent[$CNF['FIELD_CATEGORY']];
        $aCategories = $this->_categories();
        $iLastBy = (int)$aContent[$CNF['FIELD_LR_AUTHOR']];

        // the Item that shows it in the feeds, whose comments are its replies
        $iItemId = $this->_itemId($iId);

        return [
            'id' => BxDolApiV2Map::id($iId),
            'content_id' => BxDolApiV2Map::idOrNull($iItemId),
            // the form keeps the title as typed (BX_DATA_TEXT): it is text, a `<` included
            'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
            'summary' => BxDolApiV2Map::text($sHtml, self::SUMMARY_LENGTH),
            'body' => BxDolApiV2Map::text($sHtml),
            'body_html' => $sHtml,
            // an anonymous discussion keeps its author as a negative id: never named
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'anonymous' => $iAuthorId < 0,
            'category' => $iCategory && isset($aCategories[$iCategory]) ? ['id' => BxDolApiV2Map::id($iCategory), 'title' => $aCategories[$iCategory]] : null,
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'stats' => [
                'replies' => $iReplies,
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'sticky' => (int)($aContent[$CNF['FIELD_STICK']] ?? 0) > 0,
            'locked' => (int)($aContent[$CNF['FIELD_LOCK']] ?? 0) > 0,
            'resolved' => !empty($aContent[$CNF['FIELD_RESOLVABLE']]) ? (int)($aContent[$CNF['FIELD_RESOLVE']] ?? 0) > 0 : null,
            'last_reply_at' => $iReplies > 0 ? BxDolApiV2Map::date($aContent[$CNF['FIELD_LR_ADDED']]) : null,
            'last_reply_by' => $iReplies > 0 && $iLastBy > 0 ? BxDolApiV2Map::profileSummary($iLastBy) : null,
            'url' => $this->_entryUrl($iId),
            'created_at' => BxDolApiV2Map::date($aContent[$CNF['FIELD_ADDED']]),
            'updated_at' => BxDolApiV2Map::date(max((int)$aContent[$CNF['FIELD_ADDED']], (int)$aContent[$CNF['FIELD_CHANGED']])),
            'viewer' => $iViewerId ? $this->_viewer($aContent, $iItemId) : null,
        ];
    }

    protected function _viewer($aContent, $iItemId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $bCanEdit = $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED;
        $oCmts = $iItemId && !empty($CNF['OBJECT_COMMENTS']) ? BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], (int)$aContent[$CNF['FIELD_ID']]) : null;

        return [
            'can_edit' => $bCanEdit,
            'can_edit_text' => $bCanEdit && BxDolApiV2Map::isPlainHtml($aContent[$CNF['FIELD_TEXT']]),
            'can_delete' => $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
            // the module's comments refuse replies to a locked discussion
            'can_reply' => $oCmts && $oCmts->isEnabled() && $oCmts->isPostAllowed(),
        ];
    }

    protected function _formErrors($aResult, $aFields = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return parent::_formErrors($aResult, $aFields ?: [$CNF['FIELD_TITLE'] => 'title', $CNF['FIELD_TEXT'] => 'body', $CNF['FIELD_CATEGORY'] => 'category_id', $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience']);
    }

    /**
     * The text of a NewDiscussion or DiscussionChanges as the site keeps it: `body` (plain
     * text, as paragraphs) or `body_html` (the module's form filters it as it filters what the
     * site's editor sends), one of them, with some text in it.
     */
    protected function _bodyHtml($aBody)
    {
        $bText = isset($aBody['body']);
        if ($bText === isset($aBody['body_html']))
            throw BxDolApiV2Problem::validation([['field' => $bText ? 'body_html' : 'body', 'code' => $bText ? 'conflict' : 'required', 'message' => 'Send body or body_html']]);

        $sHtml = $bText ? BxDolApiV2Map::htmlFromText($aBody['body']) : (string)$aBody['body_html'];
        if (BxDolApiV2Map::text($sHtml) === '' && !preg_match('/<img\\b/i', $sHtml))
            throw BxDolApiV2Problem::validation([['field' => $bText ? 'body' : 'body_html', 'code' => 'required', 'message' => 'A discussion needs text']]);
        return $sHtml;
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aProfileOrNull = BxDolApiV2Map::profileOrNullSchema();
        $aBool = ['type' => 'boolean'];
        $aCategory = [
            'type' => 'object',
            'required' => ['id', 'title'],
            'properties' => ['id' => $aId, 'title' => ['type' => 'string'], 'count' => ['type' => 'integer', 'minimum' => 0, 'description' => 'How many discussions it has (GET /discussions/categories with `counts=true` only)']],
        ];

        return [
            'DiscussionCategory' => $aCategory,
            'DiscussionCategories' => [
                'type' => 'object',
                'required' => ['categories', 'can_create'],
                'properties' => [
                    'categories' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/DiscussionCategory']],
                    'can_create' => array_merge($aBool, ['description' => 'POST /discussions would be accepted; false for guests']),
                ],
            ],
            'Discussion' => [
                'type' => 'object',
                'description' => 'A discussion of the Discussions module. Its replies are the comments of the Item `content_id` (GET and POST /content/{content_id}/comments).',
                'required' => ['id', 'content_id', 'title', 'summary', 'body', 'body_html', 'author', 'anonymous', 'category', 'audience', 'context_id', 'stats', 'sticky', 'locked', 'resolved', 'last_reply_at', 'last_reply_by', 'url', 'created_at', 'updated_at', 'viewer'],
                'properties' => [
                    'id' => $aId,
                    'content_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The Item that shows it in the feeds: its comments are the replies. Null when the Timeline shows none (then the replies are on the site only).'],
                    'title' => ['type' => 'string'],
                    'summary' => ['type' => 'string', 'description' => 'The start of the text as plain text, for lists'],
                    'body' => ['type' => 'string', 'description' => 'The text as plain text'],
                    'body_html' => ['type' => 'string', 'description' => 'The text as the site keeps it (user HTML: sanitize before showing it)'],
                    'author' => $aProfileOrNull + ['description' => 'Null for an anonymous discussion, or an author who is gone'],
                    'anonymous' => $aBool,
                    'category' => ['oneOf' => [['$ref' => '#/components/schemas/DiscussionCategory'], ['type' => 'null']]],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private'], 'description' => 'Who may see it: `context` for one in a group (`context_id`), `private` for the author only or another privacy of the site'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The group (or other context) it is in'],
                    'stats' => [
                        'type' => 'object',
                        'required' => ['replies', 'views'],
                        'properties' => [
                            'replies' => ['type' => 'integer', 'minimum' => 0],
                            'views' => ['type' => 'integer', 'minimum' => 0],
                        ],
                    ],
                    'sticky' => array_merge($aBool, ['description' => 'Pinned to the top of the site\'s lists by a moderator']),
                    'locked' => array_merge($aBool, ['description' => 'Closed to new replies by a moderator']),
                    'resolved' => ['type' => ['boolean', 'null'], 'description' => 'Whether a question was answered; null for a discussion that is not a question'],
                    'last_reply_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'Null while it has no replies'],
                    'last_reply_by' => $aProfileOrNull,
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/DiscussionViewer'], ['type' => 'null']], 'description' => 'What the acting profile may do; null for guests'],
                ],
            ],
            'DiscussionViewer' => [
                'type' => 'object',
                'required' => ['can_edit', 'can_edit_text', 'can_delete', 'can_reply'],
                'properties' => [
                    'can_edit' => array_merge($aBool, ['description' => 'PATCH /discussions/{id} would be accepted']),
                    'can_edit_text' => array_merge($aBool, ['description' => 'A plain-text `body` in PATCH would be accepted: false for a text with links, mentions or formatting, which `body_html` edits']),
                    'can_delete' => array_merge($aBool, ['description' => 'DELETE /discussions/{id} would be accepted']),
                    'can_reply' => array_merge($aBool, ['description' => 'POST /content/{content_id}/comments would be accepted (false for a locked discussion)']),
                ],
            ],
            'Page_Discussion' => BxDolApiV2Map::pageSchema('Discussion'),
            'NewDiscussion' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['title'],
                'description' => 'A title and one of `body` and `body_html`.',
                'properties' => [
                    'title' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 255],
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50000, 'description' => 'Plain text; each line a paragraph. Or `body_html`'],
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100000, 'description' => 'HTML as the site\'s editor writes it; the site\'s form filters it. Or `body`'],
                    'category_id' => $aId + ['description' => 'GET /discussions/categories; the first one by default'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public'],
                    'context_id' => $aId + ['description' => 'A group to start it in; not with `audience`'],
                ],
            ],
            'DiscussionChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'properties' => [
                    'title' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 255],
                    'body' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50000, 'description' => 'Plain text; replaces the whole text'],
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100000, 'description' => 'HTML; replaces the whole text'],
                    'category_id' => $aId,
                ],
            ],
        ];
    }
}

/** @} */
