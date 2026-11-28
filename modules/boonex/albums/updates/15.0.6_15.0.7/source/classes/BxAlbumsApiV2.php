<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Albums Albums
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Albums: the router finds this class only while the module is enabled.
 *
 * An album is an entry of the module (on the text base), an Album: a title, a text, an
 * author, an audience, the media of its first items as `preview` and its count of items; its
 * comments and reactions are those of its Item (`content_id`). Its items are FileItems
 * (GET /albums/{id}/items) whose `id` is the item's own (the module's media id), shown as the
 * module's copies, the original only to its owner; they are seen by whom the album is.
 *
 * New albums and new items come from uploads of purpose `album` (POST /uploads into the module's
 * storage) through the module's forms, so its checks, alerts (the Timeline's "added N photos"
 * among them) and the ACL counters are the site's.
 */
class BxAlbumsApiV2 extends BxBaseModTextApiV2
{
    const API_TAG = 'albums';
    const API_KIND = 'album';
    const API_NOUN = 'album';
    const API_NOUN_PLURAL = 'albums';

    /** The upload purpose of an album's photos (POST /uploads). */
    const UPLOAD_PURPOSE = 'album';
    /** The most uploads one request takes. */
    const MAX_MEDIA = 50;
    /** How many media an album's `preview` has. */
    const PREVIEW = 4;

    /** A list page's previews and counts of items (_primeMedia): album id => rows, album id => count. */
    protected $_aPreviews = [];
    protected $_aCounts = [];

    public function __construct()
    {
        parent::__construct('bx_albums');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/albums', id: 'listAlbums', tag: 'albums', paged: true,
        summary: 'Albums the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: active albums, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s albums, `context` (or `context_id`) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only albums in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context` (v2 only)'],
        ],
        responses: [200 => 'Page_Album', 403 => null, 422 => null])]
    public function listAlbums(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/albums/{id}', id: 'getAlbum', tag: 'albums',
        summary: 'An album, with what the viewer may do with it',
        description: 'Counts a view, as opening it on the site does (once a day per viewer). 404 when there is none (or it is hidden or waiting for approval, and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it. Its items are GET /albums/{id}/items, its comments GET /content/{content_id}/comments.',
        responses: [200 => 'Album', 403 => null, 404 => null])]
    public function getAlbum(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/albums', id: 'createAlbum', tag: 'albums', auth: 'required',
        summary: 'Make an album, with photos in it or empty',
        description: 'Through the site\'s album form. `title` is needed (the form\'s length limits apply: 422 with its message). `media_ids` are up to 50 of the viewer\'s uploads of purpose `album` (POST /uploads) that nothing took yet (422 otherwise, 415 for one that is no photo), its items in this order, each titled with its file name. `text_html` is user HTML the site filters (or plain text, each line a paragraph). `context_id` puts it in a group (or another context) whose members may add albums there (403 otherwise); its audience is then the context\'s, so `audience` may not be sent with it. `comments_enabled` false is 422: the site can\'t turn comments off. The uploads are photos only (the site\'s own pages add videos too).',
        body: 'NewAlbum', responses: [201 => 'Album', 403 => null, 415 => null, 422 => null])]
    public function createAlbum(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not make albums');
        if (($aBody['comments_enabled'] ?? null) === false)
            throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'This site does not turn comments off']]);
        $sTitle = trim((string)($aBody['title'] ?? ''));
        if ($sTitle === '')
            throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'An album needs a title']]);

        $iPrivacy = $this->_newPrivacy($aBody);
        list($aFileIds, $aPost) = $this->_uploads((array)($aBody['media_ids'] ?? []), $iViewerId);
        // the form takes its uploads in their ghosts' order
        if ($aFileIds && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])))
            $oStorage->reorderGhosts($iViewerId, 0, $aFileIds);

        // the form reads its files and their titles with its values (the add form's object is the
        // one its after-add step takes them from)
        $aContent = $this->_add($iViewerId, [
            $CNF['FIELD_TITLE'] => $sTitle,
            $CNF['FIELD_TEXT'] => $this->_cleanHtml((string)($aBody['text_html'] ?? '')),
            $CNF['FIELD_ALLOW_VIEW_TO'] => $iPrivacy,
        ] + $aPost, $aPost, [
            $CNF['FIELD_TITLE'] => 'title',
            $CNF['FIELD_TEXT'] => 'text_html',
            $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience',
            $CNF['FIELD_PHOTO'] => 'media_ids',
        ]);
        return BxDolApiV2Response::created($this->_one($aContent, $iViewerId), '/albums/' . (int)$aContent[$CNF['FIELD_ID']]);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/albums/{id}', id: 'updateAlbum', tag: 'albums', auth: 'required',
        summary: 'Change an album\'s title, text or audience',
        description: 'One\'s own, or any for moderators (the module\'s edit check; 403 otherwise). A new audience is its items\' too, as they are seen by whom the album is. `audience` is not for one in a context (422).',
        body: 'AlbumChanges', responses: [200 => 'Album', 403 => null, 404 => null, 422 => null])]
    public function updateAlbum(BxDolApiV2Request $oReq)
    {
        return $this->_update($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/albums/{id}', id: 'deleteAlbum', tag: 'albums', auth: 'required',
        summary: 'Delete an album and what is in it',
        description: 'One\'s own where the membership level may delete albums, or any for administrators (the module\'s delete check; 403 otherwise). Its items, their files and comments, and its activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deleteAlbum(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/albums/{id}/items', id: 'listAlbumItems', tag: 'albums', paged: true,
        summary: 'The photos and videos in an album, in its order',
        description: 'In the order the album\'s page shows them. 404 and 403 as GET /albums/{id}. An item is the album\'s own (its `id` is the item\'s, `album_id` the album\'s), not an entry of Photos or Videos, so GET /photos/{id} does not answer for it; it has no Item (`content_id` null), so its comments and likes stay on the site, and its viewer\'s `can_edit` and `can_delete` are what the album\'s author may do there.',
        responses: [200 => 'Page_FileItem', 403 => null, 404 => null])]
    public function listAlbumItems(BxDolApiV2Request $oReq)
    {
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aRows = $this->_oModule->_oDb->getMediaPage((int)$aContent[$this->_oModule->_oConfig->CNF['FIELD_ID']], $iOffset, $iLimit + 1);
        $aItems = $this->_albumItems($aContent, array_slice($aRows, 0, $iLimit));
        return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/albums/{id}/items', id: 'addToAlbum', tag: 'albums', auth: 'required',
        summary: 'Add photos to an album, at its end',
        description: 'As the site\'s Add images form adds them: `media_ids` are up to 50 of the viewer\'s uploads of purpose `album` that nothing took yet (422 otherwise, 415 for one that is no photo), added at the end in this order, each titled with its file name. Only the album\'s author adds here, where the membership level lets them edit it (403 otherwise: the site\'s form takes its author\'s uploads only). The answer is the new items, in this order; when the site does not take them all it is 422 and the uploads are the viewer\'s again, taken by nothing. Uploads of purpose `album` are open to who may make albums or has one.',
        body: 'AddToAlbum', responses: [201 => 'array:FileItem', 403 => null, 404 => null, 415 => null, 422 => null])]
    public function addToAlbum(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $this->_refuse($this->_oModule->checkAllowedEdit($aContent), 'The viewer may not add to this album');
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        // the site's Add images form takes only its author's uploads (a moderator's would be left
        // with nowhere to go): refused before anything changes
        if ((int)$aContent[$CNF['FIELD_AUTHOR']] !== $iViewerId)
            throw BxDolApiV2Problem::forbidden('Only the album\'s author can add photos to it here');

        if (empty($aBody['media_ids']) || !is_array($aBody['media_ids']))
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'required', 'message' => 'Send the uploads (POST /uploads with purpose album) to add']]);
        list($aFileIds, $aPost) = $this->_uploads($aBody['media_ids'], $iViewerId);

        // the uploads become the album's ghosts, after its others, as the Add images form leaves them
        $oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']);
        $oStorage->updateGhostsContentId($aFileIds, $iViewerId, $iId);
        $this->_oModule->_oDb->setGhostsOrderLast($iId, $aFileIds);

        $this->_withPost($aPost, function () use ($aContent, $iId, $CNF) {
            // the form's file processing: the items, their titles, and the alerts of media added
            $oForm = $this->_oModule->getFormsHelper()->getObjectFormEdit('bx_albums_entry_add_images');
            if (!$oForm)
                throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s album form is not there');
            $oForm->initChecker($aContent);
            $oForm->processFiles($CNF['FIELD_PHOTO'], $iId, false);
        });

        // in the order given; one the form did not take (another's upload of a moderator) is 422
        $aRows = [];
        foreach ($this->_oModule->_oDb->getMediaByFileIds($iId, $aFileIds) as $aRow)
            $aRows[(int)$aRow['file_id']] = $aRow;
        $aMissing = array_values(array_diff($aFileIds, array_keys($aRows)));
        if ($aMissing) {
            // the uploads it did not take are the viewer's again, taken by nothing, to send again
            $oStorage->updateGhostsContentId($aMissing, $iViewerId, 0);
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'rejected', 'message' => 'The album did not take ' . count($aMissing) . ' of them']], 'Not all of them were added');
        }

        $aItems = $this->_albumItems($this->_oModule->_oDb->getContentInfoById($iId) ?: $aContent, array_map(function ($iFileId) use ($aRows) { return $aRows[$iFileId]; }, $aFileIds));
        return BxDolApiV2Response::created($aItems, '/albums/' . $iId . '/items');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/albums', id: 'searchAlbums', tag: 'search', limit: 'search', paged: true,
        summary: 'Albums whose title or text contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the albums the viewer may see (as GET /albums/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_Album', 422 => null])]
    public function searchAlbums(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Uploads
     */

    /**
     * POST /uploads `album`: into the module's storage, as its form's uploader puts them (photos
     * here; the site's pages add videos too).
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_STORAGE']))
            return [];
        $aCopies = $this->_photoTranscoders();
        return [[
            'purpose' => self::UPLOAD_PURPOSE,
            'object' => $CNF['OBJECT_STORAGE'],
            'kind' => 'image',
            'uploader' => (string)($CNF['OBJECT_UPLOADERS'][0] ?? ''),
            'thumb' => $aCopies['thumb'],
            'view' => $aCopies['large'],
        ]];
    }

    /**
     * Who may upload for an album: who may make one, or add to one of theirs (POST
     * /albums/{id}/items checks the album itself) though their level makes no more.
     * @return true|string
     */
    public function apiV2UploadAllowed($sPurpose)
    {
        $mCheck = $this->_oModule->checkAllowedAdd();
        if ($mCheck === CHECK_ACTION_RESULT_ALLOWED)
            return true;
        $iViewerId = (int)bx_get_logged_profile_id();
        if ($iViewerId > 0 && (int)$this->_oModule->_oDb->getEntriesNumByAuthor($iViewerId) > 0)
            return true;
        return (string)$mCheck;
    }

    /**
     * The uploads a request takes, each one of the viewer's of purpose `album` that nothing
     * took, once: their file ids, and what the module's form reads from the request for them
     * (the files, and each one's title: its file name without its extension).
     * @return array [file ids, the form's request values]
     */
    protected function _uploads(array $aMediaIds, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aMediaIds = array_values($aMediaIds);
        if (count($aMediaIds) > self::MAX_MEDIA)
            throw BxDolApiV2Problem::validation([['field' => 'media_ids', 'code' => 'too_many', 'message' => 'Up to ' . self::MAX_MEDIA . ' at a time']]);

        $aFileIds = [];
        $aPost = [];
        $aSeen = [];
        foreach ($aMediaIds as $i => $mId) {
            $sField = 'media_ids[' . $i . ']';
            if (!is_scalar($mId) || isset($aSeen[(string)$mId]))
                throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'duplicate', 'message' => 'Is given twice']]);
            $aSeen[(string)$mId] = true;
            list($iFileId, $aFile) = $this->_takeUpload((string)$mId, $iViewerId, $CNF['OBJECT_STORAGE'], $sField, 'image/');
            $aFileIds[] = (int)$iFileId;
            $aPost['title-' . (int)$iFileId] = $this->_titleFromFileName($aFile['file_name']);
        }
        if ($aFileIds)
            $aPost[$CNF['FIELD_PHOTO']] = $aFileIds;
        return [$aFileIds, $aPost];
    }

    /*
     * Mapping
     */

    /** The module's copies of an item that is a photo: its square preview, the browse one and the big one. */
    protected function _photoTranscoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        // the image transcoders behind the module's proxies (its own objects, from its install)
        return [
            'thumb' => 'bx_albums_preview',
            'medium' => 'bx_albums_browse',
            'large' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_BIG'] ?? ''),
        ];
    }

    /** The module's copies of an item that is a video, as BxDolApiV2Map::videoMedia names them. */
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
     * An item's Media: a photo's copies or a video's, the original only for its owner.
     */
    protected function _itemMedia($aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iFileId = (int)$aRow['file_id'];
        $aFile = BxDolApiV2Map::fileRow($CNF['OBJECT_STORAGE'], $iFileId);
        if (!$aFile)
            return null;
        if (str_starts_with((string)$aFile['mime_type'], 'video/'))
            return BxDolApiV2Map::videoMedia($CNF['OBJECT_STORAGE'], $iFileId, $this->_videoTranscoders());
        return BxDolApiV2Map::photoMedia($CNF['OBJECT_STORAGE'], $iFileId, $this->_photoTranscoders());
    }

    /**
     * The files of these items and their copies, a query per storage and transcoder table.
     */
    protected function _primeFiles($aRows)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aFiles = array_values(array_unique(array_filter(array_map('intval', array_column($aRows, 'file_id')))));
        if (!$aFiles || !($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE'])))
            return;
        $oStorage->primeFileRows($aFiles);
        BxDolApiV2Map::primeOwnOriginals($CNF['OBJECT_STORAGE'], $aFiles);

        // the photos' copies and the videos', each only for a page that has some
        $aByKind = ['image' => [], 'video' => []];
        foreach ($aFiles as $iFileId)
            if (($aFile = BxDolApiV2Map::fileRow($CNF['OBJECT_STORAGE'], $iFileId)))
                $aByKind[str_starts_with((string)$aFile['mime_type'], 'video/') ? 'video' : 'image'][] = $iFileId;
        if ($aByKind['image'])
            BxDolTranscoder::primeFiles(array_values(array_filter($this->_photoTranscoders())), $aByKind['image']);
        if ($aByKind['video'])
            BxDolTranscoder::primeFiles(array_values(array_filter($this->_videoTranscoders())), $aByKind['video']);
    }

    /**
     * A page's previews and counts of items in two queries, and their files (_items opens the
     * scopes they are kept in).
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aIds = array_map('intval', array_column($aContents, $CNF['FIELD_ID']));
        $this->_aPreviews = $this->_oModule->_oDb->getMediaPreviews($aIds, self::PREVIEW);
        $this->_aCounts = $this->_oModule->_oDb->getMediaCounts($aIds);
        $this->_primeFiles(array_merge([], ...array_values($this->_aPreviews ?: [[]])));
    }

    /**
     * An Album, with its module, content_id (the Item whose comments and reactions
     * are the album's) and url.
     */
    protected function _item($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];

        // a single answer reads its own (a list's are primed)
        if (!array_key_exists($iId, $this->_aPreviews))
            $this->_aPreviews += $this->_oModule->_oDb->getMediaPreviews([$iId], self::PREVIEW);
        if (!array_key_exists($iId, $this->_aCounts))
            $this->_aCounts += $this->_oModule->_oDb->getMediaCounts([$iId]);
        $aPreview = [];
        foreach ($this->_aPreviews[$iId] ?? [] as $aRow)
            if (($aMedia = $this->_itemMedia($aRow)))
                $aPreview[] = $aMedia;

        $iChars = !empty($CNF['PARAM_CHARS_SUMMARY_PLAIN']) ? (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN']) : 0;
        $iAdded = (int)$aContent[$CNF['FIELD_ADDED']];
        $iChanged = (int)($aContent[$CNF['FIELD_CHANGED']] ?? 0);

        return [
            'id' => BxDolApiV2Map::id($iId),
            'module' => $this->_oModule->getName(),
            'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
            'excerpt' => BxDolApiV2Map::text($sHtml, $iChars > 0 ? $iChars : self::SUMMARY_LENGTH),
            'text_html' => $this->_bFull ? $sHtml : null,
            'preview' => $aPreview,
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'state' => $this->_state($aContent),
            'moderation' => $this->_moderation($aContent),
            'links' => [],
            'comments_enabled' => !empty($CNF['OBJECT_COMMENTS']),
            'featured' => (int)($aContent['featured'] ?? 0) > 0,
            'stats' => [
                'items' => (int)($this->_aCounts[$iId] ?? 0),
                'comments' => (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0),
                'reactions' => $this->_reactionCount($aContent),
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'content_id' => BxDolApiV2Map::idOrNull($this->_itemId($iId)),
            'url' => $this->_entryUrl($iId),
            'viewer' => $iViewerId ? $this->_itemViewer($aContent) : null,
            'published_at' => BxDolApiV2Map::date($iAdded),
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, $iChanged)),
        ];
    }

    /**
     * An album's items as FileItems (BxBaseModFilesApiV2::fileSchemas), their files and their
     * authors read at once: what the album says of them (audience, state, the viewer's rights)
     * read once for all.
     */
    protected function _albumItems($aContent, $aRows)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iAlbumId = (int)$aContent[$CNF['FIELD_ID']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $iViewerId = (int)bx_get_logged_profile_id();
        $aAlbum = [
            'audience' => $this->_audience($iPrivacy),
            'context_id' => BxDolApiV2Map::idOrNull($iPrivacy < 0 ? -$iPrivacy : 0),
            'state' => $this->_state($aContent),
            'moderation' => $this->_moderation($aContent),
        ];
        $aViewer = $iViewerId ? [
            'reaction' => null,
            'favorited' => false,
            'can_react' => false,
            'can_comment' => false,
            'can_edit' => $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED,
            'can_delete' => $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
        ] : null;
        $sUri = (string)($CNF['URI_VIEW_MEDIA'] ?? '');

        $iRows = BxDolStorageQuery::openFileRowsScope();
        $iHandlers = BxDolTranscoderQuery::openHandlersScope();
        $iSeo = BxDolPageQuery::openSeoLinksScope();
        try {
            $this->_primeFiles($aRows);
            BxDolApiV2Map::primeProfiles(array_column($aRows, 'author'));
            if ($sUri !== '' && getParam('permalinks_seo_links'))
                BxDolPageQuery::primeSeoLinks($this->_oModule->getName(), $sUri, array_column($aRows, 'id'));

            $aItems = [];
            foreach ($aRows as $aRow) {
                $aMedia = $this->_itemMedia($aRow);
                $iAdded = (int)($aRow['added'] ?? 0);
                $iAuthorId = (int)$aRow['author'];
                $aItems[] = [
                    'id' => BxDolApiV2Map::id((int)$aRow['id']),
                    'kind' => ($aMedia['kind'] ?? 'image') === 'video' ? 'video' : 'photo',
                    'module' => $this->_oModule->getName(),
                    'title' => trim((string)$aRow['title']),
                    'excerpt' => '',
                    'text_html' => null,
                    'media' => $aMedia,
                    'embed_url' => null,
                    'embed_player_url' => null,
                    'album_id' => BxDolApiV2Map::id($iAlbumId),
                    'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
                    'audience' => $aAlbum['audience'],
                    'context_id' => $aAlbum['context_id'],
                    // a video still being converted is processing whatever its album is
                    'state' => $aAlbum['state'] === 'published' && ($aMedia['state'] ?? 'ready') === 'processing' ? 'processing' : $aAlbum['state'],
                    'moderation' => $aAlbum['moderation'],
                    'links' => [],
                    'comments_enabled' => !empty($CNF['OBJECT_COMMENTS_MEDIA']),
                    'featured' => (int)($aRow['featured'] ?? 0) > 0,
                    'stats' => [
                        'comments' => (int)($aRow['comments'] ?? 0),
                        // the site's likes of an item
                        'reactions' => (int)($aRow['votes'] ?? 0),
                        'views' => (int)($aRow['views'] ?? 0),
                    ],
                    'content_id' => null,
                    'url' => $sUri !== '' ? BxDolApiV2Map::absoluteUrl(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $sUri . '&id=' . (int)$aRow['id'])) : null,
                    'viewer' => $aViewer,
                    'published_at' => BxDolApiV2Map::date($iAdded),
                    'created_at' => BxDolApiV2Map::date($iAdded),
                    'updated_at' => BxDolApiV2Map::date($iAdded),
                ];
            }
            return $aItems;
        }
        finally {
            BxDolPageQuery::closeSeoLinksScope($iSeo);
            BxDolTranscoderQuery::closeHandlersScope($iHandlers);
            BxDolStorageQuery::closeFileRowsScope($iRows);
        }
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];
        $aCount = ['type' => 'integer', 'minimum' => 0];
        $aMedia = ['type' => 'array', 'maxItems' => self::MAX_MEDIA, 'items' => $aId];

        return BxBaseModFilesApiV2::fileSchemas() + [
            'AlbumStats' => [
                'type' => 'object',
                'required' => ['items', 'comments', 'reactions', 'views'],
                'properties' => [
                    'items' => $aCount + ['description' => 'Photos and videos in it'],
                    'comments' => $aCount,
                    'reactions' => $aCount,
                    'views' => $aCount,
                ],
            ],
            'Album' => [
                'type' => 'object',
                'description' => 'An album, with its `module`, `content_id` and `url`. Its comments and reactions are those of the Item `content_id`; its items are GET /albums/{id}/items.',
                'required' => ['id', 'module', 'title', 'excerpt', 'text_html', 'preview', 'author', 'audience', 'context_id', 'state', 'moderation', 'links', 'comments_enabled', 'featured', 'stats', 'content_id', 'url', 'viewer', 'published_at', 'created_at', 'updated_at'],
                'properties' => [
                    'id' => $aId,
                    'module' => ['type' => 'string', 'description' => 'The UNA module (v2 only)', 'example' => 'bx_albums'],
                    'title' => ['type' => 'string'],
                    'excerpt' => ['type' => 'string', 'description' => 'The start of its text, as plain text'],
                    'text_html' => ['type' => ['string', 'null'], 'description' => 'Its text as the site keeps it (user HTML the site filtered: sanitize it again before showing it). Only on single answers; null in lists'],
                    'preview' => ['type' => 'array', 'maxItems' => self::PREVIEW, 'items' => ['$ref' => '#/components/schemas/Media'], 'description' => 'The media of its first items, in its order; the first is its cover. Copies only, the originals for their owner'],
                    'author' => BxDolApiV2Map::profileOrNullSchema(),
                    'audience' => ['$ref' => '#/components/schemas/Audience', 'description' => 'Its items\' too'],
                    'context_id' => $aIdOrNull + ['description' => 'The group or other context it is in'],
                    'state' => ['$ref' => '#/components/schemas/ContentState'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'links' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/LinkPreview'], 'description' => 'Always empty here: the site keeps no previews of links in an album\'s text'],
                    'comments_enabled' => ['type' => 'boolean', 'description' => 'The module takes comments (the site can\'t turn them off for one album)'],
                    'featured' => ['type' => 'boolean'],
                    'stats' => ['$ref' => '#/components/schemas/AlbumStats'],
                    'content_id' => $aIdOrNull + ['description' => 'v2 only: the Item that shows it in the feeds, whose comments and reactions are its; null when the Timeline shows none'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'v2 only: its page on the site'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/ItemViewer'], ['type' => 'null']], 'description' => 'What the viewer did and may do; null for guests. `can_edit` also means they may add to it. `reaction`, `favorited`, `can_react` and `can_comment` are read on single answers only (null and false in lists)'],
                    'published_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'When it was made: this site publishes albums at once'],
                    'created_at' => ['type' => 'string', 'format' => 'date-time'],
                    'updated_at' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_Album' => BxDolApiV2Map::pageSchema('Album'),
            'NewAlbum' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['title'],
                'description' => 'A new album.',
                'properties' => [
                    'title' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 255],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'User HTML the site filters, or plain text (each line a paragraph)'],
                    'media_ids' => $aMedia + ['description' => 'Uploads of purpose `album` (POST /uploads), its items in this order. v2 differs: photos only'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public', 'description' => 'Its items\' too'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'A group (or other context) to put it in; not with `audience`'],
                    'comments_enabled' => ['type' => 'boolean', 'default' => true, 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
            'AlbumChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'Fields to change; omitted ones (and nulls) stay. A new audience is its items\' too.',
                'properties' => [
                    'title' => ['type' => ['string', 'null'], 'minLength' => 1, 'maxLength' => 255],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Replaces the whole text: user HTML the site filters, or plain text (each line a paragraph)'],
                    'audience' => ['oneOf' => [['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private']], ['type' => 'null']], 'description' => 'Not for one in a context (422)'],
                    'comments_enabled' => ['type' => ['boolean', 'null'], 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
            'AddToAlbum' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['media_ids'],
                'description' => 'Uploads to add to an album.',
                'properties' => [
                    'media_ids' => $aMedia + ['minItems' => 1, 'description' => 'Uploads of purpose `album` (POST /uploads), added at the end in this order. v2 differs: photos only'],
                ],
            ],
        ];
    }
}

/** @} */
