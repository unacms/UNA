<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Videos Videos
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Videos: the router finds this class only while the module is enabled.
 *
 * A video is an entry of the module, a FileItem of kind `video` (BxBaseModFilesApiV2): an
 * upload the module converts (its mp4 and stills, made by the cron from the queue; `processing`
 * until then), or a link to a video on another site (`embed_url`, its player and its preview).
 * Its comments and reactions are those of its Item (`content_id`), as a discussion's are.
 *
 * A new video is made from an upload of purpose `video` (POST /uploads, which this class lets
 * into the module's video storage and queues for converting) or from a link, through the
 * module's add form, so its checks (the link must be one its embed providers know), its alerts
 * and the Timeline are the site's.
 */
class BxVideosApiV2 extends BxBaseModFilesApiV2
{
    const API_TAG = 'videos';
    const API_KIND = 'video';
    const API_FILE_KIND = 'video';
    const API_NOUN = 'video';
    const API_NOUN_PLURAL = 'videos';

    /** The upload purpose of a new video (POST /uploads). */
    const UPLOAD_PURPOSE = 'video';

    public function __construct()
    {
        parent::__construct('bx_videos');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/videos', id: 'listVideos', tag: 'videos', paged: true,
        summary: 'Videos the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: active videos, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s videos (to that profile, and to moderators, with those still being converted or whose converting failed: `state` `processing` or `hidden`), `context` (or `context_id`, as Discussions name it) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only videos in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context` (v2 only)'],
        ],
        responses: [200 => 'Page_FileItem', 403 => null, 422 => null])]
    public function listVideos(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/videos/{id}', id: 'getVideo', tag: 'videos',
        summary: 'A video, with what the viewer may do with it',
        description: 'Counts a view, as opening it on the site does (once a day per viewer). 404 when there is none (or it is hidden, waiting for approval or still being converted, and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it (one in a closed context from outside). Its comments are GET /content/{content_id}/comments.',
        responses: [200 => 'FileItem', 403 => null, 404 => null])]
    public function getVideo(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/videos', id: 'createVideo', tag: 'videos', auth: 'required',
        summary: 'Add a video: an upload, or a link to a video on another site',
        description: '`media_id` is one of the viewer\'s uploads of purpose `video` (POST /uploads) that nothing took yet (422 otherwise, 415 for one that is no video); the new video is `processing` (seen by its author only) until the site has converted it. `embed_url` instead is an http(s) address of a video on a site the module\'s embed providers know (422 `unsupported_link` otherwise). Send one of them. `title` defaults to the upload\'s file name; a link needs one. `text_html` is user HTML the site filters (or plain text, each line a paragraph). `context_id` puts it in a group (or another context) whose members may add videos there (403 otherwise); its audience is then the context\'s, so `audience` may not be sent with it. `comments_enabled` false is 422: the site can\'t turn comments off. The site\'s form checks apply (422 with its message).',
        body: 'NewVideo', responses: [201 => 'FileItem', 403 => null, 415 => null, 422 => null])]
    public function createVideo(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not add videos');

        $sMediaId = isset($aBody['media_id']) ? (string)$aBody['media_id'] : '';
        $sEmbed = isset($aBody['embed_url']) ? trim((string)$aBody['embed_url']) : '';
        if (($sMediaId === '') === ($sEmbed === ''))
            throw BxDolApiV2Problem::validation([['field' => 'media_id', 'code' => 'required', 'message' => 'Send media_id (an upload) or embed_url (a link), one of them']]);
        if (($aBody['comments_enabled'] ?? null) === false)
            throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'This site does not turn comments off']]);

        $iPrivacy = $this->_newPrivacy($aBody);
        $sTitle = trim((string)($aBody['title'] ?? ''));
        $aValues = [
            $CNF['FIELD_TEXT'] => $this->_cleanHtml((string)($aBody['text_html'] ?? '')),
            $CNF['FIELD_ALLOW_VIEW_TO'] => $iPrivacy,
        ];
        if (($iCategory = $this->_defaultCategory()))
            $aValues[$CNF['FIELD_CATEGORY']] = $iCategory;

        if ($sMediaId !== '') {
            list($iFileId, $aFile) = $this->_takeUpload($sMediaId, $iViewerId, $CNF['OBJECT_STORAGE_VIDEOS'], 'media_id', 'video/');
            if ($sTitle === '')
                // the file name without its extension (pathinfo depends on the locale with multibyte names)
                $sTitle = trim((string)(preg_replace('/\.[^.]*$/u', '', (string)$aFile['file_name']) ?? $aFile['file_name']));
            $aValues['video_source'] = 'upload';
            $aValues[$CNF['FIELD_VIDEOS']] = [$iFileId];
            $aPost = ['video_source' => 'upload', $CNF['FIELD_VIDEO'] => $iFileId];
        }
        else {
            if (!preg_match('#^https?://[^\s/]+#iu', $sEmbed) || get_mb_len($sEmbed) > 2000)
                throw BxDolApiV2Problem::validation([['field' => 'embed_url', 'code' => 'invalid_value', 'message' => 'An http or https address']]);
            if (!$this->_oModule->parseEmbedLink($sEmbed))
                throw BxDolApiV2Problem::validation([['field' => 'embed_url', 'code' => 'unsupported_link', 'message' => 'This site does not play videos from there']]);
            $aValues['video_source'] = 'embed';
            $aValues['video_embed'] = $sEmbed;
            $aPost = ['video_source' => 'embed'];
        }
        if ($sTitle === '')
            throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A video needs a title']]);
        $aValues[$CNF['FIELD_TITLE']] = $sTitle;

        $aContent = $this->_add($iViewerId, $aValues, $aPost, [
            $CNF['FIELD_TITLE'] => 'title',
            $CNF['FIELD_TEXT'] => 'text_html',
            $CNF['FIELD_ALLOW_VIEW_TO'] => 'audience',
            $CNF['FIELD_VIDEOS'] => 'media_id',
            'video_embed' => 'embed_url',
        ]);
        return BxDolApiV2Response::created($this->_one($aContent, $iViewerId), '/videos/' . (int)$aContent[$CNF['FIELD_ID']]);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/videos/{id}', id: 'updateVideo', tag: 'videos', auth: 'required',
        summary: 'Change a video\'s title, text or audience',
        description: 'One\'s own, or any for moderators (the module\'s edit check; 403 otherwise). The video itself (the upload or the link) does not change here. `audience` is not for one in a context (422).',
        body: 'FileItemChanges', responses: [200 => 'FileItem', 403 => null, 404 => null, 422 => null])]
    public function updateVideo(BxDolApiV2Request $oReq)
    {
        return $this->_update($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/videos/{id}', id: 'deleteVideo', tag: 'videos', auth: 'required',
        summary: 'Delete a video',
        description: 'One\'s own where the membership level may delete videos, or any for administrators (the module\'s delete check; 403 otherwise). Its file, copies, comments and activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deleteVideo(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/videos', id: 'searchVideos', tag: 'search', limit: 'search', paged: true,
        summary: 'Videos whose title or text contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the videos the viewer may see (as GET /videos/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_FileItem', 422 => null])]
    public function searchVideos(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Uploads
     */

    /**
     * POST /uploads `video`: into the module's video storage, as its add form's uploader puts
     * them, converted by its transcoders.
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_STORAGE_VIDEOS']) || empty($CNF['OBJECT_VIDEOS_TRANSCODERS']['mp4']))
            return [];
        return [[
            'purpose' => self::UPLOAD_PURPOSE,
            'object' => $CNF['OBJECT_STORAGE_VIDEOS'],
            'kind' => 'video',
            'uploader' => (string)($CNF['OBJECT_UPLOADERS'][0] ?? ''),
            'transcoders' => $this->_transcoders(),
        ]];
    }

    /**
     * The video transcoders: the mp4 to play, the HD one, and the stills.
     */
    protected function _transcoders()
    {
        $aTc = (array)($this->_oModule->_oConfig->CNF['OBJECT_VIDEOS_TRANSCODERS'] ?? []);
        return [
            'mp4' => (string)($aTc['mp4'] ?? ''),
            'mp4_hd' => (string)($aTc['mp4_hd'] ?? ''),
            'poster' => (string)($aTc['poster'] ?? ''),
            'thumb' => (string)($aTc['poster_gallery'] ?? $aTc['poster_preview'] ?? ''),
        ];
    }

    /*
     * Mapping
     */

    /**
     * An uploaded video's Media (its duration from the entry, when its author gave one), or a
     * link's address, its player and its preview. A still the author chose is the poster.
     */
    protected function _media($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        list($sPoster, $sThumb) = $this->_chosenStills($aContent);

        if (($aContent['video_source'] ?? 'upload') === 'embed') {
            $sUrl = trim((string)($aContent['video_embed'] ?? ''));
            if ($sUrl === '')
                return [null, null, [], null];
            $sHost = (string)(parse_url($sUrl, PHP_URL_HOST) ?: '');
            $aLinks = [[
                'id' => BxDolApiV2Map::id((int)$aContent[$CNF['FIELD_ID']]),
                'url' => $sUrl,
                'host' => $sHost,
                'state' => 'ready',
                'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
                'description' => '',
                'site_name' => $sHost,
                'image' => $sThumb !== null ? ['path' => $sThumb, 'width' => 0, 'height' => 0] : null,
            ]];
            return [null, $sUrl, $aLinks, $this->_playerUrl($aContent)];
        }

        $aMedia = BxDolApiV2Map::videoMedia($CNF['OBJECT_STORAGE_VIDEOS'], (int)$aContent[$CNF['FIELD_VIDEO']], $this->_transcoders(), $sPoster, $sThumb);
        if (is_array($aMedia)) {
            if (($aContent[$CNF['FIELD_STATUS']] ?? '') === 'failed' && $aMedia['state'] === 'processing')
                $aMedia['state'] = 'failed';
            $iSeconds = !empty($CNF['FIELD_DURATION']) ? (int)($aContent[$CNF['FIELD_DURATION']] ?? 0) : 0;
            if ($iSeconds > 0)
                $aMedia['duration_ms'] = $iSeconds * 1000;
        }
        return [$aMedia, null, [], null];
    }

    /**
     * The page's uploads, the pictures their authors chose, and the copies of both: a query per
     * storage and transcoder table instead of a few per video.
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aVideos = $aThumbs = [];
        foreach ($aContents as $aContent) {
            if (($aContent['video_source'] ?? 'upload') !== 'embed' && (int)$aContent[$CNF['FIELD_VIDEO']] > 0)
                $aVideos[] = (int)$aContent[$CNF['FIELD_VIDEO']];
            if (!empty($CNF['FIELD_THUMB']) && (int)($aContent[$CNF['FIELD_THUMB']] ?? 0) > 0)
                $aThumbs[] = (int)$aContent[$CNF['FIELD_THUMB']];
        }

        if ($aVideos && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE_VIDEOS']))) {
            $oStorage->primeFileRows($aVideos);
            BxDolTranscoder::primeFiles(array_values($this->_transcoders()), $aVideos);
            BxDolApiV2Map::primeOwnOriginals($CNF['OBJECT_STORAGE_VIDEOS'], $aVideos);
        }
        if ($aThumbs && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
            $oStorage->primeFileRows($aThumbs);
            BxDolTranscoder::primeFiles([$CNF['OBJECT_IMAGES_TRANSCODER_POSTER'] ?? '', $CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''], $aThumbs);
        }
    }

    /**
     * A video being converted is `processing` whatever its row says (a video added on the site
     * before its copies were made).
     */
    protected function _item($aContent, $iViewerId)
    {
        $a = parent::_item($aContent, $iViewerId);
        if ($a['state'] === 'published' && is_array($a['media']) && $a['media']['state'] === 'processing')
            $a['state'] = 'processing';
        return $a;
    }

    /**
     * The poster and the smaller still of the picture its author chose (the module's photo
     * storage), or [null, null].
     */
    protected function _chosenStills($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iThumb = !empty($CNF['FIELD_THUMB']) ? (int)($aContent[$CNF['FIELD_THUMB']] ?? 0) : 0;
        if ($iThumb <= 0 || !BxDolApiV2Map::fileRow($CNF['OBJECT_STORAGE'], $iThumb))
            return [null, null];

        $aUrls = [];
        foreach (['OBJECT_IMAGES_TRANSCODER_POSTER', 'OBJECT_IMAGES_TRANSCODER_GALLERY'] as $sKey) {
            $o = !empty($CNF[$sKey]) ? BxDolTranscoderImage::getObjectInstance($CNF[$sKey]) : null;
            $aUrls[] = $o ? BxDolApiV2Map::absoluteUrl((string)$o->getFileUrl($iThumb)) : null;
        }
        return $aUrls;
    }

    /**
     * The https address of the player in the frame the module's embed provider gave for a link,
     * or null.
     */
    protected function _playerUrl($aContent)
    {
        $mData = $aContent['video_embed_data'] ?? '';
        if (is_string($mData) && $mData !== '')
            $mData = @unserialize($mData, ['allowed_classes' => false]);
        $sHtml = is_array($mData) ? (string)($mData['embed'] ?? '') : '';
        if (!preg_match('/<iframe\b[^>]*\bsrc\s*=\s*["\']([^"\']+)["\']/i', $sHtml, $m))
            return null;
        $sSrc = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return preg_match('#^https://[^\s"\'<>]+$#i', $sSrc) ? $sSrc : null;
    }

    /**
     * What the module's edit form reads from the request: its source, its main file and (for a
     * link) its chosen picture, as they are, so an edit keeps them.
     */
    protected function _editPost($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aPost = ['video_source' => ($aContent['video_source'] ?? 'upload') === 'embed' ? 'embed' : 'upload', $CNF['FIELD_VIDEO'] => (int)$aContent[$CNF['FIELD_VIDEO']]];
        if ($aPost['video_source'] === 'embed' && !empty($CNF['FIELD_THUMB']) && (int)($aContent[$CNF['FIELD_THUMB']] ?? 0) > 0)
            $aPost[$CNF['FIELD_THUMB']] = [(int)$aContent[$CNF['FIELD_THUMB']]];
        return $aPost;
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];

        return self::fileSchemas() + [
            'NewVideo' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'An upload (`media_id`) or a link (`embed_url`), one of them.',
                'properties' => [
                    'media_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'An upload of purpose `video` (POST /uploads)'],
                    'embed_url' => ['type' => ['string', 'null'], 'maxLength' => 2000, 'description' => 'Instead of an upload: an http(s) address of a video on another site the module plays'],
                    'title' => ['type' => ['string', 'null'], 'maxLength' => 255, 'description' => 'The upload\'s file name when absent; a link needs one'],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'User HTML the site filters, or plain text (each line a paragraph)'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'A group (or other context) to add it to; not with `audience`'],
                    'comments_enabled' => ['type' => 'boolean', 'default' => true, 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
        ];
    }
}

/** @} */
