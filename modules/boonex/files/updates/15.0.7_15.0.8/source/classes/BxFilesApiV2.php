<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Files Files
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Files: the router finds this class only while the module is enabled.
 *
 * A file is an entry of the module, a FileItem of kind `file` (BxBaseModFilesApiV2): one
 * uploaded file of any type the module's storage takes, with a title, a description, an author
 * and an audience. Its comments and reactions are those of its Item (`content_id`).
 *
 * Unlike a photo's or a video's, the original goes to everyone who may see the file: the site's
 * own download (download-file) is its view check, so `media.url` and `media.download_url` are
 * the file itself for them, with its name and size. The module's copies are there too: a
 * preview of an image of the types the module previews (`thumb`, `medium`), a video's `mp4`
 * and `poster` once the site converted it. The site makes no still of a PDF or other document.
 *
 * New files are made as the module's upload form makes them: one entry for each upload of
 * purpose `file` (POST /uploads into the module's storage), with the form's category, audience
 * and checks, so its alerts, the Timeline and the ACL counters are the site's. Folders and
 * bookmarks stay on the site: lists show the files only, wherever they are filed.
 */
class BxFilesApiV2 extends BxBaseModFilesApiV2
{
    const API_TAG = 'files';
    const API_KIND = 'file';
    const API_FILE_KIND = 'file';
    const API_NOUN = 'file';
    const API_NOUN_PLURAL = 'files';

    /** The upload purpose of a new file (POST /uploads). */
    const UPLOAD_PURPOSE = 'file';
    /** The most uploads one POST /files takes. */
    const MAX_FILES = 20;
    /** The images the module previews (BxFilesModule::_addFileFields' `is_image`). */
    const PREVIEW_EXTS = ['jpg', 'jpeg', 'png', 'gif'];

    public function __construct()
    {
        parent::__construct('bx_files');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/files', id: 'listFiles', tag: 'files', paged: true,
        summary: 'Files the viewer may see, newest first or in another order',
        description: 'As the site\'s browse pages list them: active files (never folders), with the module\'s privacy, so a page can have fewer items than `limit` and still a `next_cursor`. Without `author` or `context` it has the files outside groups and other contexts only, as the site\'s browse pages: those in a context are in its list (`context`), their author\'s (`author`) and search (GET /search/files), wherever the viewer may see them. `sort`: `recent` (the default, newest first), `updated`, `popular` (most viewed), `top` (most liked) or `featured` (featured ones only). `author` keeps one profile\'s files, those in groups and other contexts the viewer may see too (v2 differs from the site\'s author page, which lists the ones outside contexts), `context` (or `context_id`, as Discussions name it) those in a group or other context: 422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see. The files in a folder are listed with the others: folders stay on the site.',
        params: [
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['recent', 'updated', 'popular', 'top', 'featured'], 'default' => 'recent']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'context' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only files in this group (or other context): its profile id'],
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'The same as `context` (v2 only)'],
        ],
        responses: [200 => 'Page_FileItem', 403 => null, 422 => null])]
    public function listFiles(BxDolApiV2Request $oReq)
    {
        return $this->_list($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/files/{id}', id: 'getFileItem', tag: 'files',
        summary: 'A file the viewer may see, with its description and download',
        description: 'Counts a view, as opening it on the site does (once a day per viewer). `media.download_url` is the file itself (a private one\'s link carries a token valid for a few minutes: ask again for a fresh one before a download that waited). 404 when there is none (or it is a folder, or hidden or waiting for approval and the viewer is not its author or a moderator, or in a secret group or other context the viewer may not know of), 403 when the viewer may not see it (one in a closed context from outside). Its comments are GET /content/{content_id}/comments.',
        responses: [200 => 'FileItem', 403 => null, 404 => null])]
    public function getFileItem(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/files', id: 'createFiles', tag: 'files', auth: 'required',
        summary: 'Add files: one for each upload',
        description: 'As the site\'s upload form adds them: each of `media_ids` (up to 20 of the viewer\'s uploads of purpose `file`, POST /uploads, that nothing took yet; 422 otherwise) becomes a file, in this order, and the answer lists them so. `title` is every file\'s title, each upload\'s file name without its extension when absent. `text_html` is every file\'s description: user HTML the site filters as its edit form does (or plain text, each line a paragraph). `context_id` puts them in a group (or another context) whose members may add files there (403 otherwise); their audience is then the context\'s, so `audience` may not be sent with it. `comments_enabled` false is 422: the site can\'t turn comments off. The site\'s form checks apply (422 with its message). The site adds them one by one while the membership level\'s limit of files allows (403 when it allows none): when it stops part way the answer is still 201, with the files made, and the uploads not taken are the ones no file\'s `media.id` in it is; they stay the viewer\'s, to send again later or delete (DELETE /uploads/{id}). A video among them is put in the queue of the module\'s converter, as its page does when it is first shown, so it plays once converted. The category is the upload form\'s first. A file\'s name is seen by whoever sees it, as on the site.',
        body: 'NewFiles', responses: [201 => 'array:FileItem', 403 => null, 422 => null])]
    public function createFiles(BxDolApiV2Request $oReq)
    {
        return $this->_createFromUploads($oReq, $this->_oModule->_oConfig->CNF['OBJECT_STORAGE'], '', self::MAX_FILES, self::UPLOAD_PURPOSE);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/files/{id}', id: 'updateFileItem', tag: 'files', auth: 'required',
        summary: 'Change a file\'s title, description or audience',
        description: 'One\'s own, or any for moderators (the module\'s edit check; 403 otherwise). The file itself does not change here: add a new one instead. `audience` is not for one in a context (422).',
        body: 'FileItemChanges', responses: [200 => 'FileItem', 403 => null, 404 => null, 422 => null])]
    public function updateFileItem(BxDolApiV2Request $oReq)
    {
        return $this->_update($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/files/{id}', id: 'deleteFileItem', tag: 'files', auth: 'required',
        summary: 'Delete a file',
        description: 'One\'s own where the membership level may delete files, or any for administrators (the module\'s delete check; 403 otherwise). The stored file, its copies, comments and activity in the feeds go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deleteFileItem(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/files', id: 'searchFiles', tag: 'search', limit: 'search', paged: true,
        summary: 'Files whose title or description contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the files the viewer may see (as GET /files/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_FileItem', 422 => null])]
    public function searchFiles(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Uploads
     */

    /**
     * POST /uploads `file`: into the module's storage, as its upload form's uploader puts them,
     * any type it takes; an upload's Media shows the copies a file has.
     */
    public function apiV2UploadStorages()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['OBJECT_STORAGE']))
            return [];
        return [[
            'purpose' => self::UPLOAD_PURPOSE,
            'object' => $CNF['OBJECT_STORAGE'],
            'kind' => 'file',
            'uploader' => (string)($CNF['OBJECT_UPLOADERS'][0] ?? ''),
            'transcoders' => $this->_transcoders(),
            'image_exts' => self::PREVIEW_EXTS,
        ]];
    }

    /**
     * The copies of a file: an image's preview and gallery copies, a video's mp4 and poster.
     */
    protected function _transcoders()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aVideo = (array)($CNF['OBJECT_VIDEOS_TRANSCODERS'] ?? []);
        return [
            'thumb' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_PREVIEW'] ?? ''),
            'medium' => (string)($CNF['OBJECT_IMAGES_TRANSCODER_GALLERY'] ?? ''),
            'mp4' => (string)($aVideo['mp4'] ?? ''),
            'poster' => (string)($aVideo['poster'] ?? ''),
        ];
    }

    /**
     * A new file that is a video goes into the queue of the module's video transcoders, as its
     * page puts it there when it first shows it, so it plays once converted.
     */
    protected function _afterAddFromUploads($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aVideo = (array)($CNF['OBJECT_VIDEOS_TRANSCODERS'] ?? []);
        if (empty($aVideo['mp4']))
            return;
        foreach ($aContents as $aContent)
            BxDolApiV2Map::queueVideo($CNF['OBJECT_STORAGE'], (int)$aContent[$CNF['FIELD_FILE_ID']], $aVideo);
    }

    /*
     * Reading
     */

    /**
     * The module's search result, as its browse blocks use it: without its file manager (its
     * toolbar, folders and one folder's files), so a list has the files only; a profile's list
     * has those in contexts too.
     */
    protected function _browseRows($sMode, $aParams, $iStart, $iPerPage, $sOrderSql = '', $aRestrictions = [], $sSorting = '', $aJoins = [], $sRestrictionSql = '')
    {
        $aParams['no_toolbar'] = true;
        $aRestrictions['files_only'] = 'file';
        if ($sMode === 'author')
            $aRestrictions['context_filter'] = '';
        return parent::_browseRows($sMode, $aParams, $iStart, $iPerPage, $sOrderSql, $aRestrictions, $sSorting, $aJoins, $sRestrictionSql);
    }

    /** A folder is not a file here: 404, as for none. */
    protected function _existing($iId)
    {
        $aContent = parent::_existing($iId);
        if (($aContent['type'] ?? 'file') !== 'file')
            throw BxDolApiV2Problem::notFound('The ' . static::API_NOUN);
        return $aContent;
    }

    /** Lists and search hits are files only. */
    protected function _visible($aContent)
    {
        return ($aContent['type'] ?? 'file') === 'file' && parent::_visible($aContent);
    }

    /*
     * Mapping
     */

    /**
     * The file's Media: the original to everyone who sees it (the site's download), with the
     * copies the module makes.
     */
    protected function _media($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return [BxDolApiV2Map::fileMedia($CNF['OBJECT_STORAGE'], (int)$aContent[$CNF['FIELD_FILE_ID']], $this->_transcoders(), self::PREVIEW_EXTS), null, [], null];
    }

    /**
     * The page's files, their copies and their links (a private file's reused token, which every
     * viewer of a file gets): a query per storage, transcoder table and token table instead of a
     * few per file.
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aFiles = array_values(array_filter(array_map('intval', array_column($aContents, $CNF['FIELD_FILE_ID']))));
        if ($aFiles && ($oStorage = BxDolStorage::getObjectInstance($CNF['OBJECT_STORAGE']))) {
            $oStorage->primeFileRows($aFiles);
            BxDolTranscoder::primeFiles(array_values(array_filter($this->_transcoders())), $aFiles);
            $oStorage->primeFileUrlsShared($aFiles);
            // where the videos among them are in the converter's queue (their `state`)
            $aVideos = array_values(array_filter($aFiles, function ($iFile) use ($CNF) {
                $aFile = BxDolApiV2Map::fileRow($CNF['OBJECT_STORAGE'], $iFile);
                return $aFile && str_starts_with((string)$aFile['mime_type'], 'video/');
            }));
            $sMp4 = $this->_transcoders()['mp4'];
            if ($aVideos && $sMp4 !== '' && ($oMp4 = BxDolTranscoder::getObjectInstance($sMp4)))
                $oMp4->getDb()->primeQueue($aVideos);
        }
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];

        return self::fileSchemas() + [
            'NewFiles' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['media_ids'],
                'description' => 'Files to add, one for each upload.',
                'properties' => [
                    'media_ids' => ['type' => 'array', 'minItems' => 1, 'maxItems' => self::MAX_FILES, 'items' => $aId, 'description' => 'Uploads of purpose `file` (POST /uploads), in order. Each becomes a file'],
                    'title' => ['type' => ['string', 'null'], 'maxLength' => 255, 'description' => 'Every file\'s title; each upload\'s file name (without its extension) when absent'],
                    'text_html' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Every file\'s description: user HTML the site filters, or plain text (each line a paragraph)'],
                    'audience' => ['type' => 'string', 'enum' => ['public', 'members', 'friends', 'private'], 'default' => 'public'],
                    'context_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'A group (or other context) to add them to; not with `audience`'],
                    'comments_enabled' => ['type' => 'boolean', 'default' => true, 'description' => 'false is 422: the site can\'t turn comments off'],
                ],
            ],
        ];
    }
}

/** @} */
