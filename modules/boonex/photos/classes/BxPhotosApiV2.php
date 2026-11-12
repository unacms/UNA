<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Photos Photos
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Photos: the router finds this class only while the module is enabled.
 *
 * A photo is an entry of the module, a FileItem of kind `photo` (BxBaseModFilesApiV2):
 * one uploaded image, shown as the module's copies (`thumb`, `medium`, `large`), the original
 * only to its owner. Its comments and reactions are those of its Item (`content_id`).
 *
 * New photos are made as the module's upload form makes them: one entry for each upload of
 * purpose `photo` (POST /uploads into the module's storage), with the form's category, audience
 * and checks, so its alerts, the Timeline and the ACL counters are the site's.
 */
class BxPhotosApiV2 extends BxBaseModFilesApiV2
{
    const API_TAG = 'photos';
    const API_KIND = 'photo';
    const API_FILE_KIND = 'photo';
    const API_NOUN = 'photo';
    const API_NOUN_PLURAL = 'photos';

    /** The upload purpose of a new photo (POST /uploads). */
    const UPLOAD_PURPOSE = 'photo';
    /** The most uploads one POST /photos takes. */
    const MAX_PHOTOS = 20;

    public function __construct()
    {
        parent::__construct('bx_photos');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/photos', id: 'listPhotos', tag: 'photos', paged: true,
        summary: 'Photos the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: active photos, with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s photos, `context` (or `context_id`, as Discussions name it) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only photos in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context` (v2 only)'],
        ],
        responses: [200 => 'Page_FileItem', 403 => null, 422 => null])]
    public function listPhotos(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/photos/{id}', id: 'getPhoto', tag: 'photos',
        summary: 'A photo, with what the viewer may do with it',
        description: 'Counts a view, as opening it on the site does (once a day per viewer). 404 when there is none (or it is hidden or waiting for approval, and the viewer is not its author or a moderator; or it is in a secret group or other context the viewer may not know of), 403 when the viewer may not see it (one in a closed context from outside). Its comments are GET /content/{content_id}/comments.',
        responses: [200 => 'FileItem', 403 => null, 404 => null])]
    public function getPhoto(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/photos', id: 'createPhotos', tag: 'photos', auth: 'required',
        summary: 'Add photos: one for each upload',
        description: 'As the site\'s upload form adds them: each of `media_ids` (up to 20 of the viewer\'s uploads of purpose `photo`, POST /uploads, that nothing took yet; 422 otherwise, 415 for one that is no photo) becomes a photo, in this order, and the answer lists them so. `title` is every photo\'s title, each upload\'s file name when absent. `text_html` is every photo\'s text: user HTML the site filters as its edit form does (or plain text, each line a paragraph). `context_id` puts them in a group (or another context) whose members may add photos there (403 otherwise); their audience is then the context\'s, so `audience` may not be sent with it. `comments_enabled` false is 422: the site can\'t turn comments off. The site\'s form checks apply (422 with its message). The site adds them one by one while the membership level\'s limit of photos allows (403 when it allows none): when it stops part way the answer is still 201, with the photos made, and the uploads not taken are the ones no photo\'s `media.id` in it is; they stay the viewer\'s, to send again later or delete (DELETE /uploads/{id}). The category is the upload form\'s first. An untitled photo is titled with its file\'s name, as the site\'s own form titles it, so that name is seen by whoever sees the photo.',
        body: 'NewPhotos', responses: [201 => 'array:FileItem', 403 => null, 415 => null, 422 => null])]
    public function createPhotos(BxDolApiV2Request $oReq)
    {
        return $this->_createFromUploads($oReq, $this->_oModule->_oConfig->CNF['OBJECT_STORAGE'], 'image/', self::MAX_PHOTOS, self::UPLOAD_PURPOSE);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/photos/{id}', id: 'updatePhoto', tag: 'photos', auth: 'required',
        summary: 'Change a photo\'s title, text or audience',
        description: 'One\'s own, or any for moderators (the module\'s edit check; 403 otherwise). The picture itself does not change here. `audience` is not for one in a context (422).',
        body: 'FileItemChanges', responses: [200 => 'FileItem', 403 => null, 404 => null, 422 => null])]
    public function updatePhoto(BxDolApiV2Request $oReq)
    {
        return $this->_update($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/photos/{id}', id: 'deletePhoto', tag: 'photos', auth: 'required',
        summary: 'Delete a photo',
        description: 'One\'s own where the membership level may delete photos, or any for administrators (the module\'s delete check; 403 otherwise). Its file, copies, comments and activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deletePhoto(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/photos', id: 'searchPhotos', tag: 'search', limit: 'search', paged: true,
        summary: 'Photos whose title or text contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the photos the viewer may see (as GET /photos/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_FileItem', 422 => null])]
    public function searchPhotos(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Uploads
     */

    /**
     * POST /uploads `photo`: into the module's photo storage, as its upload form's uploader puts
     * them; an upload's Media shows the copies a photo has.
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_STORAGE']))
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
     * Mapping
     */

    /** The copies a photo shows: the preview (a list's still), the gallery's and the cover's. */
    protected function _transcoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'] ?? ''),
            'medium' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''),
            'large' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_COVER'] ?? ''),
        ];
    }

    /**
     * The photo's Media: its copies, the original for its owner only.
     */
    protected function _media($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [BxDolApiV2Map::photoMedia($CNF['OBJECT_STORAGE'], (int)$aContent[$CNF['FIELD_THUMB']], $this->_transcoders()), null, [], null];
    }

    /**
     * The page's uploads and their copies: a query per storage and transcoder table instead of a
     * few per photo.
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aFiles = array_values(array_filter(array_map('intval', array_column($aContents, $CNF['FIELD_THUMB']))));
        if ($aFiles && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
            $oStorage->primeFileRows($aFiles);
            BxDolTranscoder::primeFiles(array_values($this->_transcoders()), $aFiles);
            BxDolApiV2Map::primeOwnOriginals($CNF['OBJECT_STORAGE'], $aFiles);
        }
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];

        return self::fileSchemas() + [
            'NewPhotos' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['media_ids'],
                'description' => 'Photos to add, one for each upload.',
                'properties' => [
                    'media_ids' => ['type' => 'array', 'minItems' => 1, 'maxItems' => self::MAX_PHOTOS, 'items' => $aId, 'description' => 'Uploads of purpose `photo` (POST /uploads), in order. Each becomes a photo'],
                    'title' => ['type' => ['string', 'null'], 'maxLength' => 255, 'description' => 'Every photo\'s title; each upload\'s file name when absent'],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Every photo\'s text: user HTML the site filters, or plain text (each line a paragraph)'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'A group (or other context) to add them to; not with `audience`'],
                    'comments_enabled' => ['type' => 'boolean', 'default' => true, 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
        ];
    }
}

/** @} */
