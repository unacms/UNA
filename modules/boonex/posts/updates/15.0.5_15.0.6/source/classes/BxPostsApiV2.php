<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Posts Posts
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Posts: the router finds this class only while the module is enabled.
 *
 * A post is an entry of the module (on the text base), shown as a Post: a title, a summary
 * (the site's abstract, else the start of the text), the text, a cover and who may see it (an
 * audience, or a context it is in). Its comments and reactions are those of its Item
 * (`content_id`), and the feeds' Item of a post names it (`Item.entry_id`), so a client opens the
 * post from the feeds.
 *
 * Visibility is the module's own: lists are its search results (its active entries, its privacy
 * conditions), and every post shown goes through its view check, as on the site. Writing goes
 * through its add and edit forms and their checks, so the site's validation, alerts (the
 * Timeline, notifications) and ACL counters apply.
 */
class BxPostsApiV2 extends BxBaseModTextApiV2
{
    const API_TAG = 'posts';
    const API_KIND = 'post';
    const API_NOUN = 'post';
    const API_NOUN_PLURAL = 'posts';

    /** The upload purpose of a new post's cover (POST /uploads `purpose`). */
    const UPLOAD_PURPOSE = 'post_cover';
    /** The title lengths the site's form takes (its Length checker). */
    const TITLE_MIN = 3;
    const TITLE_MAX = 160;
    const TEXT_MAX = 100000;
    const SUMMARY_MAX = 5000;
    /** Words a minute, for `reading_minutes`. */
    const WORDS_PER_MINUTE = 200;

    /** The states a post of one's own can be in (`/me/posts?state=`): ContentState. */
    const STATES = ['draft', 'scheduled', 'processing', 'published', 'hidden', 'deleted'];

    /** The add form's categories, read once per request (_categories). */
    protected $_aCategories = null;
    /** The add form, built once per request (_formAdd). */
    protected $_oFormAdd = null;

    public function __construct()
    {
        parent::__construct('bx_posts');
    }

    /*
     * Hooks other endpoints ask
     */

    /**
     * POST /uploads `post_cover`: a new post's cover goes to the module's cover storage.
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_STORAGE']) || empty($CNF['FIELD_COVER']))
            return [];
        return [[
            'purpose' => self::UPLOAD_PURPOSE,
            'object' => $CNF['OBJECT_STORAGE'],
            'kind' => 'image',
            'uploader' => (string)($CNF['OBJECT_UPLOADERS'][0] ?? ''),
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'] ?? ''),
            'view' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''),
        ]];
    }

    /*
     * Endpoints
     */

    #[BxDolApiV2Operation(method: 'GET', path: '/posts', id: 'listPosts', tag: 'posts', paged: true,
        summary: 'Posts the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: published posts, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s posts (the Posts of a profile\'s page; one\'s own scheduled and processing ones too), `context` (or `context_id`) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see. `category` keeps one category\'s posts (its `id` or `slug` from GET /posts/categories; 422 for none of them). In lists `body_html` is null and `media` and `links` are empty: GET /posts/{id} has them.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only posts in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context`'],
            'category' => ['in' => 'query', 'schema' => ['type' => 'string', 'maxLength' => 40], 'description' => 'Only posts in this category: its `id` or `slug` (GET /posts/categories)'],
        ],
        responses: [200 => 'Page_Post', 403 => null, 422 => null])]
    public function listPosts(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    /**
     * GET /posts `category`: the search result's condition on the post's category. Its id and its
     * slug are the same number here; 422 for one GET /posts/categories does not list.
     */
    protected function _listRestrictions(BxDolApiV2Request $oReq)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sCategory = $oReq->query('category');
        if ($sCategory === null || $sCategory === '')
            return [];
        $iCategory = ctype_digit((string)$sCategory) ? (int)$sCategory : 0;
        if (empty($CNF['FIELD_CATEGORY']) || $this->_categoryName($iCategory) === '')
            throw BxDolApiV2Problem::validation([['field' => 'category', 'code' => 'not_found', 'message' => 'No such category (GET /posts/categories)']]);
        return ['api_category' => ['value' => $iCategory, 'operator' => '=', 'field' => $CNF['FIELD_CATEGORY']]];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/posts', id: 'listMyPosts', tag: 'posts', auth: 'required', paged: true,
        summary: 'The acting profile\'s own posts, newest first, in any state',
        description: 'The site keeps no drafts, so without `state` it lists every post of one\'s own (published, scheduled, processing, hidden, and those waiting for approval or rejected: `moderation`); `state` keeps one state, and `draft` and `deleted` give an empty page. Anonymous posts of one\'s own are listed too, with their author shown to the viewer only.',
        params: [
            'state' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/ContentState'], 'description' => 'Only posts in this state; every state by default'],
        ],
        responses: [200 => 'Page_Post', 422 => null])]
    public function listMyPosts(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sState = $oReq->query('state');
        if ($sState !== null && !in_array($sState, self::STATES, true))
            throw BxDolApiV2Problem::validation([['field' => 'state', 'code' => 'invalid_value', 'message' => 'Use ' . implode(', ', self::STATES)]]);
        if ($sState === 'draft' || $sState === 'deleted')
            return $oReq->pageAt([], null);

        $aRestrictions = [
            'status' => ['value' => ['active', 'awaiting', 'failed', 'hidden'], 'operator' => 'in'],
            'statusAdmin' => ['value' => ['active', 'pending', 'hidden'], 'operator' => 'in'],
        ];
        $iNow = time();
        switch ($sState) {
            case 'published':
                $aRestrictions['status'] = 'active';
                break;
            case 'scheduled':
                $aRestrictions['status'] = 'awaiting';
                $aRestrictions['api_published'] = ['value' => $iNow, 'operator' => '>', 'field' => $CNF['FIELD_PUBLISHED']];
                break;
            case 'processing':
                $aRestrictions['status'] = 'awaiting';
                $aRestrictions['api_published'] = ['value' => $iNow, 'operator' => '<=', 'field' => $CNF['FIELD_PUBLISHED']];
                break;
            case 'hidden':
                $aRestrictions['status'] = ['value' => ['failed', 'hidden'], 'operator' => 'in'];
                break;
        }

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aIds = $this->_browseRows('author', ['author' => $iViewerId], $iOffset, $iLimit + 1, '', $aRestrictions, 'last');
        $aItems = $this->_items($this->_visibleContents(array_slice($aIds, 0, $iLimit)), $iViewerId);
        return $oReq->pageAt($aItems, count($aIds) > $iLimit ? $iOffset + $iLimit : null);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/posts/categories', id: 'listPostCategories', tag: 'posts',
        summary: 'The categories a post can be in',
        description: 'The categories the site\'s form for a new post offers, in its order. The site keeps no slugs, so `slug` is the category\'s value on the site; with `counts=true` each has `count`, as the site\'s Categories block counts its posts (GET /posts?category= lists them).',
        params: ['counts' => self::CATEGORY_COUNTS_PARAM],
        responses: [200 => 'PostCategoryList', 422 => null])]
    public function listPostCategories(BxDolApiV2Request $oReq)
    {
        $aCounts = $oReq->queryBool('counts') ? $this->_categoryCounts() : null;
        $aResult = [];
        foreach ($this->_categories() as $iId => $sName) {
            $a = ['id' => BxDolApiV2Map::id($iId), 'slug' => (string)$iId, 'name' => $sName];
            if ($aCounts !== null)
                $a['count'] = (int)($aCounts[$iId] ?? 0);
            $aResult[] = $a;
        }
        return $aResult;
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/posts/{id}', id: 'getPost', tag: 'posts',
        summary: 'A post, with its text, cover, photos and videos',
        description: 'Counts a view, as opening its page on the site does (once a day per viewer). 404 when there is none (or it is scheduled, hidden or waiting for approval and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it. Its comments are GET /content/{content_id}/comments.',
        responses: [200 => 'Post', 403 => null, 404 => null])]
    public function getPost(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/posts', id: 'createPost', tag: 'posts', auth: 'required',
        summary: 'Write a post',
        description: 'Through the site\'s post form after its add check (403 otherwise). `title` is 3 to 160 characters, as the site\'s form takes it. `body_html` is user HTML the site filters (plain text becomes paragraphs); `summary` is plain text (the site\'s abstract), taken from the text when absent. `audience` (public by default; one the site has turned off is 422), or `context_id` for a group or other context whose members may post there (403 otherwise; then `audience` may not be sent). `cover_media_id` is one of the viewer\'s uploads of purpose `post_cover` (POST /uploads) that nothing took yet. `category_id` is one of GET /posts/categories, required where the site\'s form requires a category (422 `required` without one). The post is published at once (`status` other than `published` and `publish_at` are 422: the site\'s form schedules for administrators only), `media_ids`, `poll` and `anonymous` are not taken here (attach photos, videos and polls on the site), and `comments_enabled` false is 422 where the site\'s form does not offer it to the viewer. It shows in the feeds as the site\'s alerts put it there.',
        body: 'NewPost', responses: [201 => 'Post', 403 => null, 415 => null, 422 => null])]
    public function createPost(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not write posts');

        if (isset($aBody['status']) && $aBody['status'] !== 'published')
            throw BxDolApiV2Problem::validation([['field' => 'status', 'code' => 'unsupported', 'message' => 'Posts are published at once here']]);
        if (!empty($aBody['publish_at']))
            throw BxDolApiV2Problem::validation([['field' => 'publish_at', 'code' => 'unsupported', 'message' => 'Posts are published at once here']]);
        foreach (['media_ids', 'poll'] as $sField)
            if (!empty($aBody[$sField]))
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'unsupported', 'message' => 'Attach photos, videos and polls on the site']]);
        if (!empty($aBody['anonymous']))
            throw BxDolApiV2Problem::validation([['field' => 'anonymous', 'code' => 'unsupported', 'message' => 'Anonymous posts are written on the site']]);

        $oForm = $this->_formAdd();
        $aValues = $this->_textValues($aBody, true);
        // the text must still say something once the site's HTML filter is through (the form's
        // insert filters it again)
        $this->_checkText($this->_dbPassed($oForm, $aValues));
        $aValues[$CNF['FIELD_ALLOW_VIEW_TO']] = $this->_newPrivacy($aBody);

        $aCategories = $this->_categories();
        if (isset($aBody['category_id'])) {
            $iCategory = (int)$aBody['category_id'];
            if (!isset($aCategories[$iCategory]))
                throw BxDolApiV2Problem::validation([['field' => 'category_id', 'code' => 'not_found', 'message' => 'No such category (GET /posts/categories)']]);
            $aValues[$CNF['FIELD_CATEGORY']] = $iCategory;
        }
        elseif ($this->_offered($oForm, 'FIELD_CATEGORY') && !empty($oForm->aInputs[$CNF['FIELD_CATEGORY']]['required']))
            throw BxDolApiV2Problem::validation([['field' => 'category_id', 'code' => 'required', 'message' => 'Choose a category (GET /posts/categories)']]);

        if (($aBody['comments_enabled'] ?? null) === false) {
            if (!$this->_offered($oForm, 'FIELD_ALLOW_COMMENTS'))
                throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'The site does not let you turn comments off']]);
            $aValues[$CNF['FIELD_ALLOW_COMMENTS']] = 0;
        }

        // the cover: the upload the form's cover field takes, and the form's thumb choice (it reads $_POST)
        $aPost = [];
        if (isset($aBody['cover_media_id']) && $aBody['cover_media_id'] !== null) {
            list($iFileId) = $this->_takeUpload((string)$aBody['cover_media_id'], $iViewerId, $CNF['OBJECT_STORAGE'], 'cover_media_id', 'image/');
            if ($this->_oModule->checkAllowedSetThumb() !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden('The viewer may not give posts a cover');
            $aValues[$CNF['FIELD_COVER']] = [$iFileId];
            $aPost[$CNF['FIELD_THUMB']] = [$iFileId];
        }

        $aLinks = BxDolApiV2Map::links($aBody['links'] ?? []);
        if ($aLinks && !$this->_oModule->_oConfig->isAttachLinks())
            throw BxDolApiV2Problem::validation([['field' => 'links', 'code' => 'unsupported', 'message' => 'Posts on this site take no links']]);

        $aContent = $this->_add($iViewerId, $aValues, $aPost, $this->_fieldMap());
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        // the links, as the post form's link field attaches them: the site reads each page (addAttachLink) and links it to the post
        foreach ($aLinks as $sLink) {
            $aLink = $this->_oModule->addAttachLink([$CNF['FIELD_ATTACH_LINK_CONTENT_ID'] => $iId, $CNF['FIELD_ATTACH_LINK_URL'] => $sLink]);
            if (is_array($aLink) && !empty($aLink['id']))
                $this->_oModule->_oDb->saveLink($iId, (int)$aLink['id']);
        }
        return BxDolApiV2Response::created($this->_one($aLinks ? $this->_oModule->_oDb->getContentInfoById($iId) : $aContent, $iViewerId), '/posts/' . $iId);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/posts/{id}', id: 'updatePost', tag: 'posts', auth: 'required',
        summary: 'Change a post\'s title, summary, text, category, audience or comments',
        description: 'One\'s own, or any for moderators (the module\'s edit check; 403 otherwise), through the site\'s edit form. Fields left out stay. `audience` is not for one in a context (422). The site keeps no revisions (`revision` stays 1), the cover, photos and videos change on the site (`cover_media_id` and `media_ids` are not taken), `status` and `publish_at` are not taken, and `comments_enabled` changes only where the site\'s form offers it to the viewer (422 otherwise).',
        body: 'PostChanges', responses: [200 => 'Post', 403 => null, 404 => null, 422 => null])]
    public function updatePost(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send title, body_html, summary or more of them']]);
        $this->_refuse($this->_oModule->checkAllowedEdit($aContent), 'The viewer may not edit this post');

        foreach (['cover_media_id', 'media_ids', 'status', 'publish_at'] as $sField)
            if (array_key_exists($sField, $aBody) && $aBody[$sField] !== null)
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'unsupported', 'message' => 'Change it on the site']]);

        $oForm = $this->_oModule->getFormsHelper()->getObjectFormEdit();
        $aValues = $this->_textValues($aBody, false);
        if (array_key_exists('audience', $aBody) && $aBody['audience'] !== null) {
            if ((int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']] < 0)
                throw BxDolApiV2Problem::validation([['field' => 'audience', 'code' => 'context_post', 'message' => 'A post in a context is seen by whom the context lets see it']]);
            $aValues[$CNF['FIELD_ALLOW_VIEW_TO']] = $this->_privacyOf($aBody['audience']);
        }
        if (array_key_exists('category_id', $aBody) && $aBody['category_id'] !== null) {
            if (!isset($this->_categories()[(int)$aBody['category_id']]))
                throw BxDolApiV2Problem::validation([['field' => 'category_id', 'code' => 'not_found', 'message' => 'No such category (GET /posts/categories)']]);
            $aValues[$CNF['FIELD_CATEGORY']] = (int)$aBody['category_id'];
        }
        if (array_key_exists('comments_enabled', $aBody) && $aBody['comments_enabled'] !== null) {
            if ($this->_offered($oForm, 'FIELD_ALLOW_COMMENTS'))
                $aValues[$CNF['FIELD_ALLOW_COMMENTS']] = $aBody['comments_enabled'] ? 1 : 0;
            elseif ((bool)$aBody['comments_enabled'] !== $this->_commentsEnabled($aContent))
                throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'The site does not let you change this']]);
        }

        $iId = (int)$aContent[$CNF['FIELD_ID']];
        // the text must still say something once the site's HTML filter is through
        $this->_checkText($this->_dbPassed($oForm, $aValues));
        // what it is already is no change: the module's edit says it failed when no row changes
        // (the edit runs the form's db passes on what it is given)
        $aValues = $this->_changed($oForm, $aValues, $aContent);
        if ($aValues) {
            $sError = $this->_withPost([], function () use ($iId, $aValues) {
                return BxDolApiV2Forms::editEntity($this->_oModule, $iId, $aValues);
            });
            if ($sError !== '' && $sError !== null)
                throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)]], 'The post was not saved');
            // the ACL counter, as the site's edit form counts it
            $this->_oModule->checkAllowedEdit($aContent, true);
        }

        return $this->_one($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/posts/{id}', id: 'deletePost', tag: 'posts', auth: 'required',
        summary: 'Delete a post',
        description: 'One\'s own where the membership level may delete posts, or any for administrators (the module\'s delete check; 403 otherwise). Its cover, photos, videos, comments and activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deletePost(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/posts', id: 'searchPosts', tag: 'search', limit: 'search', paged: true,
        summary: 'Posts whose title or text contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the posts the viewer may see (as GET /posts/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_Post', 422 => null])]
    public function searchPosts(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Writing
     */

    /**
     * The title, text and summary of a new post ($bNew: the title and the text are required) or
     * of changes to one (only what is sent), as the module's form keeps them.
     */
    protected function _textValues($aBody, $bNew)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aValues = [];

        if ($bNew || (array_key_exists('title', $aBody) && $aBody['title'] !== null)) {
            $sTitle = trim((string)($aBody['title'] ?? ''));
            $iLength = get_mb_len($sTitle);
            if ($iLength < self::TITLE_MIN || $iLength > self::TITLE_MAX)
                throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => $iLength ? 'invalid_length' : 'required', 'message' => 'A title of ' . self::TITLE_MIN . ' to ' . self::TITLE_MAX . ' characters']]);
            $aValues[$CNF['FIELD_TITLE']] = $sTitle;
        }
        if ($bNew || (array_key_exists('body_html', $aBody) && $aBody['body_html'] !== null)) {
            $sHtml = $this->_cleanHtml((string)($aBody['body_html'] ?? ''));
            if (trim(BxDolApiV2Map::text($sHtml)) === '' && !preg_match('/<(img|iframe|video)\b/i', $sHtml))
                throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'required', 'message' => 'A post needs text']]);
            if (get_mb_len($sHtml) > self::TEXT_MAX)
                throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'too_long', 'message' => 'At most ' . self::TEXT_MAX . ' characters']]);
            $aValues[$CNF['FIELD_TEXT']] = $sHtml;
        }
        if (array_key_exists('summary', $aBody) && $aBody['summary'] !== null) {
            $sSummary = trim((string)$aBody['summary']);
            if (get_mb_len($sSummary) > self::SUMMARY_MAX)
                throw BxDolApiV2Problem::validation([['field' => 'summary', 'code' => 'too_long', 'message' => 'At most ' . self::SUMMARY_MAX . ' characters']]);
            if (!empty($CNF['FIELD_ABSTRACT']))
                $aValues[$CNF['FIELD_ABSTRACT']] = $sSummary;
        }
        return $aValues;
    }

    /**
     * 422 on `body_html` for a text the site's HTML filter left nothing of (`<script>x</script>`):
     * $aValues are passed values (_dbPassed).
     */
    protected function _checkText($aValues)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!array_key_exists($CNF['FIELD_TEXT'], $aValues))
            return;
        $sHtml = (string)$aValues[$CNF['FIELD_TEXT']];
        if (trim(BxDolApiV2Map::text($sHtml)) === '' && !preg_match('/<(img|iframe|video)\b/i', $sHtml))
            throw BxDolApiV2Problem::validation([['field' => 'body_html', 'code' => 'required', 'message' => 'A post needs text (the site\'s filter left none)']]);
    }

    /**
     * Whether the form shows the viewer its input of $sKey (a CNF field name): BxDolForm keeps
     * inputs of other membership levels (`visible_for_levels`) in aInputs and only skips them
     * when it checks and saves, so being there is not enough.
     */
    protected function _offered($oForm, $sKey)
    {
        $sField = $this->_oModule->_oConfig->CNF[$sKey] ?? '';
        return $sField !== '' && $oForm && isset($oForm->aInputs[$sField]) && BxDolForm::isVisible($oForm->aInputs[$sField]);
    }

    /** The add form, built once per request. */
    protected function _formAdd()
    {
        if ($this->_oFormAdd === null)
            $this->_oFormAdd = $this->_oModule->getFormsHelper()->getObjectFormAdd() ?: false;
        return $this->_oFormAdd ?: null;
    }

    /** The module's form fields by the API's names, for its refusals. */
    protected function _fieldMap()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [
            $CNF['FIELD_TITLE'] => 'title',
            $CNF['FIELD_TEXT'] => 'body_html',
            $CNF['FIELD_ABSTRACT'] => 'summary',
            $CNF['FIELD_CATEGORY'] => 'category_id',
            $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience',
            $CNF['FIELD_COVER'] => 'cover_media_id',
        ];
    }

    /*
     * Mapping
     */

    /**
     * The categories the add form offers: id => name.
     */
    protected function _categories()
    {
        if ($this->_aCategories !== null)
            return $this->_aCategories;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = !empty($CNF['FIELD_CATEGORY']) ? $this->_formAdd() : null;
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

    /**
     * The PostCategory of a post's category, or null: its title from the module's category
     * object (the site's cached list, not the add form, which a list page need not build).
     */
    protected function _category($iId)
    {
        $sName = $this->_categoryName($iId);
        return $sName !== '' ? ['id' => BxDolApiV2Map::id($iId), 'slug' => (string)$iId, 'name' => $sName] : null;
    }

    /** A category's name, '' for none: from the module's category object (the site's cached list). */
    protected function _categoryName($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if ($iId <= 0)
            return '';
        if ($this->_aCategories !== null)
            return $this->_aCategories[$iId] ?? '';
        $oCategory = !empty($CNF['OBJECT_CATEGORY']) ? BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']) : null;
        return $oCategory ? BxDolApiV2Map::text((string)$oCategory->getCategoryTitle($iId)) : '';
    }

    /** The copies of a post's cover: the module's preview, gallery and cover transcoders. */
    protected function _coverTranscoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'] ?? ''),
            'medium' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''),
            'large' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_COVER'] ?? ''),
        ];
    }

    /** The copies of a post's photos. */
    protected function _photoTranscoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW_PHOTOS'] ?? ''),
            'medium' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY_PHOTOS'] ?? ''),
            'large' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_VIEW_PHOTOS'] ?? ''),
        ];
    }

    /** The copies of a post's videos: the mp4 to play, the HD one, and the stills. */
    protected function _videoTranscoders()
    {
        $aTc = (array)($this->_oModule->_oConfig->CNF['OBJECT_VIDEOS_TRANSCODERS'] ?? []);
        return [
            'mp4' => (string)($aTc['mp4'] ?? ''),
            'mp4_hd' => (string)($aTc['mp4_hd'] ?? ''),
            'poster' => (string)($aTc['poster'] ?? ''),
            'thumb' => (string)($aTc['poster_preview'] ?? ''),
        ];
    }

    /**
     * The covers a page of posts shows, read at once (their rows and copies; _items opens the
     * scopes they are kept in).
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aFiles = array_values(array_filter(array_map('intval', array_column($aContents, $CNF['FIELD_THUMB']))));
        if ($aFiles && !empty($CNF['OBJECT_STORAGE']) && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
            $oStorage->primeFileRows($aFiles);
            BxDolApiV2Map::primeOwnOriginals($CNF['OBJECT_STORAGE'], $aFiles);
            BxDolTranscoder::primeFiles(array_values(array_filter($this->_coverTranscoders())), $aFiles);
        }
    }

    /**
     * The photos and videos attached to a post, in the order its form shows them (single answers
     * only): the copies the module shows, the originals for their owner only.
     */
    protected function _attachedMedia($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aMedia = [];
        foreach ([['OBJECT_STORAGE_PHOTOS', 'photo'], ['OBJECT_STORAGE_VIDEOS', 'video']] as list($sKey, $sKind)) {
            $oStorage = !empty($CNF[$sKey]) ? BxDolStorage::getObjectInstance($CNF[$sKey]) : null;
            $aGhosts = $oStorage ? $oStorage->getGhosts(false, $iId) : [];
            if (!$aGhosts || !is_array($aGhosts))
                continue;
            $aIds = array_map('intval', array_column($aGhosts, 'id'));
            $oStorage->primeFileRows($aIds);
            BxDolApiV2Map::primeOwnOriginals($CNF[$sKey], $aIds);
            BxDolTranscoder::primeFiles(array_values(array_filter($sKind === 'photo' ? $this->_photoTranscoders() : $this->_videoTranscoders())), $aIds);
            foreach ($aIds as $iFileId) {
                $a = $sKind === 'photo' ? BxDolApiV2Map::photoMedia($CNF[$sKey], $iFileId, $this->_photoTranscoders()) : BxDolApiV2Map::videoMedia($CNF[$sKey], $iFileId, $this->_videoTranscoders());
                if ($a)
                    $aMedia[] = $a;
            }
        }
        return $aMedia;
    }

    /**
     * The previews of the links attached to a post (single answers only), as LinkPreview.
     * The site keeps no site name and no image size: `site_name` is the host, and an image is 0 by 0.
     * Links of other schemes are left out.
     */
    protected function _linkPreviews($iId)
    {
        $aLinks = [];
        foreach ((array)$this->_oModule->_oDb->getLinks($iId) as $a) {
            // http(s) only: a client opens it in a browser or a web view
            if (!is_array($a) || empty($a['url']) || !is_string($a['url']) || !preg_match('#^https?://#i', $a['url']))
                continue;
            $sHost = (string)(parse_url($a['url'], PHP_URL_HOST) ?: '');
            $aLinks[] = [
                'id' => BxDolApiV2Map::id($a['id'] ?? 0),
                'url' => $a['url'],
                'host' => $sHost,
                'state' => 'ready',
                'title' => BxDolApiV2Map::text((string)($a['title'] ?? '')),
                'description' => BxDolApiV2Map::text((string)($a['text'] ?? ''), 600),
                'site_name' => $sHost,
                'image' => null,
            ];
        }
        return $aLinks;
    }

    /**
     * The ContentState of a post: `scheduled` while it waits for its publishing time (the
     * module's `awaiting` with a time to come), `processing` while its video is converted.
     */
    protected function _state($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if ((string)($aContent[$CNF['FIELD_STATUS']] ?? '') === 'awaiting' && (int)($aContent[$CNF['FIELD_PUBLISHED']] ?? 0) > time())
            return 'scheduled';
        return parent::_state($aContent);
    }

    protected function _commentsEnabled($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return empty($CNF['FIELD_ALLOW_COMMENTS']) || !array_key_exists($CNF['FIELD_ALLOW_COMMENTS'], $aContent) || (int)$aContent[$CNF['FIELD_ALLOW_COMMENTS']] !== 0;
    }

    /**
     * A Post, with its `content_id`, `module` and `url`. `body_html`, `media` and
     * `links` only on single answers.
     */
    protected function _item($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];
        $sText = BxDolApiV2Map::text($sHtml);
        $sAbstract = trim((string)($aContent[$CNF['FIELD_ABSTRACT']] ?? ''));
        $iThumb = (int)($aContent[$CNF['FIELD_THUMB']] ?? 0);
        $iAdded = (int)$aContent[$CNF['FIELD_ADDED']];
        $iChanged = (int)($aContent[$CNF['FIELD_CHANGED']] ?? 0);
        $iPublished = (int)($aContent[$CNF['FIELD_PUBLISHED']] ?? 0) ?: $iAdded;
        $sState = $this->_state($aContent);
        // an anonymous post keeps its author as a negative id: named to the author only
        $bAnonymous = $iAuthorId < 0;
        $bOwn = $iViewerId > 0 && abs($iAuthorId) === (int)$iViewerId;
        $iWords = $sText !== '' ? count(preg_split('/\s+/u', $sText, -1, PREG_SPLIT_NO_EMPTY) ?: []) : 0;

        return [
            'id' => BxDolApiV2Map::id($iId),
            'content_id' => BxDolApiV2Map::idOrNull($this->_itemId($iId)),
            'module' => $this->_oModule->getName(),
            // the form keeps the title as typed (Xss): text, a `<` included
            'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
            'summary' => $sAbstract !== '' ? BxDolApiV2Map::text($sAbstract, self::SUMMARY_LENGTH) : BxDolApiV2Map::text($sHtml, self::SUMMARY_LENGTH),
            'body_html' => $this->_bFull ? $sHtml : null,
            'author' => !$bAnonymous || $bOwn ? (abs($iAuthorId) > 0 ? BxDolApiV2Map::profileSummary(abs($iAuthorId)) : null) : null,
            'anonymous' => $bAnonymous,
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'audience' => $this->_audience($iPrivacy),
            'state' => $sState,
            'moderation' => $this->_moderation($aContent),
            'category' => $this->_category((int)($aContent[$CNF['FIELD_CATEGORY']] ?? 0)),
            'cover' => $iThumb > 0 && !empty($CNF['OBJECT_STORAGE']) ? BxDolApiV2Map::photoMedia($CNF['OBJECT_STORAGE'], $iThumb, $this->_coverTranscoders()) : null,
            'media' => $this->_bFull ? $this->_attachedMedia($iId) : [],
            'links' => $this->_bFull ? $this->_linkPreviews($iId) : [],
            'poll' => null,
            'reading_minutes' => max(1, (int)ceil($iWords / self::WORDS_PER_MINUTE)),
            'comments_enabled' => $this->_commentsEnabled($aContent),
            'featured' => (int)($aContent['featured'] ?? 0) > 0,
            'stats' => [
                'comments' => (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0),
                'reactions' => $this->_reactionCount($aContent),
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'revision' => 1,
            'url' => $this->_entryUrl($iId),
            'viewer' => $iViewerId ? $this->_itemViewer($aContent) : null,
            'published_at' => $sState === 'scheduled' ? null : BxDolApiV2Map::date($iPublished),
            'publish_at' => $sState === 'scheduled' ? BxDolApiV2Map::date($iPublished) : null,
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, $iChanged)),
        ];
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];
        $aCount = ['type' => 'integer', 'minimum' => 0];
        $aDateOrNull = ['type' => ['string', 'null'], 'format' => 'date-time'];
        $aAudiences = ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private']];

        return [
            'Audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'context', 'private']],
            'ContentState' => BxDolApiV2Map::contentStateSchema(),
            'Moderation' => BxDolApiV2Map::moderationSchema(),
            'ItemViewer' => BxDolApiV2Map::itemViewerSchema(),
            'LinkPreview' => BxDolApiV2Map::linkPreviewSchema(),
            'LinkImage' => BxDolApiV2Map::linkImageSchema(),
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
            'PostCategory' => [
                'type' => 'object',
                'required' => ['id', 'slug', 'name'],
                'description' => 'A post category. The site keeps no slugs: `slug` is the category\'s value on the site.',
                'properties' => [
                    'id' => $aId,
                    'slug' => ['type' => 'string'],
                    'name' => ['type' => 'string'],
                    'count' => ['type' => 'integer', 'minimum' => 0, 'description' => 'How many posts it has (v2 only, with `counts=true`)'],
                ],
            ],
            'PostCategoryList' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/PostCategory']],
            'PostStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'views'],
                'properties' => ['comments' => $aCount, 'reactions' => $aCount, 'views' => $aCount],
            ],
            'Post' => [
                'type' => 'object',
                'description' => 'A post of the Posts module, with its `content_id`, `module` and `url`. Its comments and reactions are those of the Item `content_id` (GET and POST /content/{content_id}/comments, PUT /content/{content_id}/reaction); the feeds\' Item of a post names it (`Item.entry_id`).',
                'required' => ['id', 'content_id', 'module', 'title', 'summary', 'body_html', 'author', 'anonymous', 'context_id', 'audience', 'state', 'moderation', 'category', 'cover', 'media', 'links', 'poll', 'reading_minutes', 'comments_enabled', 'featured', 'stats', 'revision', 'url', 'viewer', 'published_at', 'publish_at', 'created_at', 'updated_at'],
                'properties' => [
                    'id' => $aId,
                    'content_id' => $aIdOrNull + ['description' => 'v2 only. The Item that shows it in the feeds: its comments and reactions are the post\'s. Null when the Timeline shows none'],
                    'module' => ['type' => 'string', 'description' => 'The UNA module (v2 only)', 'example' => 'bx_posts'],
                    'title' => ['type' => 'string'],
                    'summary' => ['type' => 'string', 'description' => 'Plain text: the summary its author wrote (the site\'s abstract), else the start of the text'],
                    'body_html' => ['type' => ['string', 'null'], 'description' => 'The text as the site keeps it (user HTML the site filtered: sanitize it again before showing it). Only on single answers (GET, POST and PATCH of one); null in lists'],
                    'author' => BxDolApiV2Map::profileOrNullSchema() + ['description' => 'Null for an anonymous post (except to its author: only they see who wrote it), or an author who is gone'],
                    'anonymous' => ['type' => 'boolean'],
                    'context_id' => $aIdOrNull + ['description' => 'The group or other context it is in'],
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'state' => ['$ref' => '#/components/schemas/ContentState', 'description' => '`scheduled` while it waits for its publishing time, `processing` while a video of it is converted (seen by its author and moderators only)'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'category' => ['oneOf' => [['$ref' => '#/components/schemas/PostCategory'], ['type' => 'null']]],
                    'cover' => ['oneOf' => [['$ref' => '#/components/schemas/Media'], ['type' => 'null']], 'description' => 'The cover, as the module\'s copies (`variants`); its original (`url`) only for its owner'],
                    'media' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Media'], 'description' => 'The photos and videos attached to it, as the module\'s copies. Only on single answers: empty in lists (v2 differs)'],
                    'links' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/LinkPreview'], 'description' => 'Previews of the http and https links attached to it. Only on single answers: empty in lists (v2 differs)'],
                    'poll' => ['type' => 'null', 'description' => 'Always null. Polls on posts are made and answered on the site'],
                    'reading_minutes' => ['type' => 'integer', 'minimum' => 1, 'description' => 'Its words at 200 a minute, at least 1'],
                    'comments_enabled' => ['type' => 'boolean'],
                    'featured' => ['type' => 'boolean'],
                    'stats' => ['$ref' => '#/components/schemas/PostStats'],
                    'revision' => ['type' => 'integer', 'description' => 'The site keeps no revisions: always 1 (v2 differs)'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'v2 only. Its page on the site'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ItemViewer'], ['type' => 'null']], 'description' => 'What the viewer did with it and may do (its reaction, favourite and comment rights on single answers only); null for guests'],
                    'published_at' => $aDateOrNull + ['description' => 'Null while it is scheduled'],
                    'publish_at' => $aDateOrNull + ['description' => 'When a scheduled post is published; null otherwise'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_Post' => BxDolApiV2Map::pageSchema('Post'),
            'NewPost' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['title', 'body_html'],
                'description' => 'A new post. It is published at once, and photos, videos, polls and anonymous posts are added on the site.',
                'properties' => [
                    'title' => ['type' => 'string', 'minLength' => self::TITLE_MIN, 'maxLength' => self::TITLE_MAX],
                    'summary' => ['type' => ['string', 'null'], 'maxLength' => self::SUMMARY_MAX, 'description' => 'Plain text. Taken from the text when absent'],
                    'body_html' => ['type' => 'string', 'minLength' => 1, 'maxLength' => self::TEXT_MAX, 'description' => 'User HTML the site filters; plain text becomes paragraphs'],
                    'audience' => $aAudiences + ['default' => 'public', 'description' => 'One of GET /api/v2 `modules` `audiences`; not with `context_id`'],
                    'context_id' => $aIdOrNull + ['description' => 'A group (or other context) to post into; the viewer must be allowed to post there'],
                    'category_id' => $aIdOrNull + ['description' => 'One of GET /posts/categories; required where the site\'s form requires a category'],
                    'cover_media_id' => $aIdOrNull + ['description' => 'An upload of purpose `post_cover` (POST /uploads)'],
                    'media_ids' => ['type' => 'array', 'maxItems' => 0, 'items' => $aId, 'description' => 'Not taken here: attach photos and videos on the site'],
                    'links' => ['type' => 'array', 'maxItems' => BxDolApiV2Map::LINKS_MAX, 'items' => ['type' => 'string', 'format' => 'uri', 'maxLength' => 2000], 'description' => 'v2 only. Links to attach with their previews (`links` of the post), as the site\'s post form attaches them; absolute http(s) links to public addresses only (422 on `links[i]` otherwise), and 422 where the site\'s posts take no links'],
                    'anonymous' => ['type' => 'boolean', 'default' => false, 'description' => 'Only false here'],
                    'comments_enabled' => ['type' => 'boolean', 'default' => true, 'description' => 'False only where the site\'s form offers it to the viewer'],
                    'status' => ['type' => 'string', 'enum' => ['draft', 'scheduled', 'published', 'hidden'], 'default' => 'published', 'description' => 'Only `published` here'],
                    'publish_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'Not taken here'],
                ],
            ],
            'PostChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'Fields to change, omitted ones stay. The cover, photos, videos and publishing change on the site, and no revision is kept.',
                'properties' => [
                    'title' => ['type' => ['string', 'null'], 'minLength' => self::TITLE_MIN, 'maxLength' => self::TITLE_MAX],
                    'summary' => ['type' => ['string', 'null'], 'maxLength' => self::SUMMARY_MAX],
                    'body_html' => ['type' => ['string', 'null'], 'maxLength' => self::TEXT_MAX],
                    'audience' => ['oneOf' => [$aAudiences, ['type' => 'null']]],
                    'category_id' => $aIdOrNull,
                    'comments_enabled' => ['type' => ['boolean', 'null']],
                    'cover_media_id' => ['type' => 'null', 'description' => 'Not taken here'],
                    'media_ids' => ['type' => 'null', 'description' => 'Not taken here'],
                    'status' => ['type' => 'null', 'description' => 'Not taken here'],
                    'publish_at' => ['type' => 'null', 'description' => 'Not taken here'],
                ],
            ],
        ];
    }
}

/** @} */
