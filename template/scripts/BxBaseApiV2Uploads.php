<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: uploads (POST /uploads, GET and DELETE /uploads/{id}). A file is uploaded for a
 * purpose, into the storage the module of that purpose keeps such files in, and belongs to the
 * viewer until something of that purpose takes it.
 *
 * The storages are the modules' to name. An endpoint class may define (BxDolApiV2Router::hooks):
 * - apiV2UploadStorages(): the storages of its own purposes, each ['object', 'purpose', 'kind'
 *   (image, video or file), 'uploader', 'thumb' and 'view' (transcoders of a photo's copies),
 *   'transcoders' (a video's or file's), 'image_exts'];
 * - apiV2PostUploadStorages(): the storages of a feed post's media (purpose `post`), each
 *   ['object', 'kind' (image or video), 'field' (the post form's), 'uploader'], with
 *   apiV2PostUploadMedia($aStorage, $iFileId), an upload there as Media. The Timeline's;
 * - apiV2UploadAllowed($sPurpose): whether the viewer may upload for a purpose of its own
 *   (true, or the refusal's message).
 *
 * An upload's id is its storage and its file in one number (BxDolApiV2Map::uploadId).
 */
class BxBaseApiV2Uploads
{
    protected $_aStorages = null;

    #[BxDolApiV2Operation(method: 'POST', path: '/uploads', id: 'upload', tag: 'uploads', auth: 'required', limit: 'upload',
        summary: 'Upload a photo or a video for a feed post, a photo for a message, a profile, Photos or an album, a video for Videos, or any file for Files',
        description: 'A multipart/form-data body with one `file` and, for anything but a feed post, its `purpose`. A feed post\'s photos go to the Timeline\'s photo storage and videos to its video storage; a message\'s photos (`message`: a reply in a conversation, `conversation`: the message that starts one) go where the Conversations module keeps them; a profile\'s picture or cover (`profile`, for PATCH /profiles/{id}) goes to the storage of the acting profile\'s module; a module\'s own purposes (`video`, `photo`, `album`) go to that module\'s storage. So the site\'s size, type and quota limits of that storage apply (413, 415); the file name\'s extension decides the kind, and the content must be of that kind. A purpose the site has no storage for (no such module, or one that is not installed) is 422 on `purpose`; a file of a kind the purpose does not take (a video for `message`, `conversation` or `profile`) is 415. The upload belongs to the viewer\'s profile until a post or message of that purpose takes it (`media_ids`); one nothing takes is deleted after the site\'s ghost lifetime (an hour by default), as files uploaded on the site are. A video is converted after upload: `state` is `processing` until GET /uploads/{id} says `ready`.',
        body: 'multipart:UploadForm', responses: [201 => 'Media', 403 => null, 413 => null, 415 => null])]
    public function upload(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();

        // a multipart body is not checked against its schema by the router
        $aFields = $oReq->body();
        $sPurpose = isset($aFields['purpose']) && is_string($aFields['purpose']) ? $aFields['purpose'] : 'post';
        unset($aFields['purpose']);
        if (($aUnknown = array_keys($aFields)))
            throw BxDolApiV2Problem::validation([['field' => (string)$aUnknown[0], 'code' => 'unknown_field', 'message' => 'Is not a field of this request']]);

        $aStorages = array_filter($this->storages(), function ($a) use ($sPurpose) { return $a['purpose'] === $sPurpose; });
        if (!$aStorages && $sPurpose === 'post')
            throw new BxDolApiV2Problem(503, 'uploads_unavailable', 'This site takes no uploads for posts');
        if (!$aStorages)
            throw BxDolApiV2Problem::validation([['field' => 'purpose', 'code' => 'unknown_purpose', 'message' => 'This site takes no uploads for this']]);

        // who may upload is who may post it: the check of the module the purpose is of
        $aFirst = reset($aStorages);
        $mCheck = $aFirst['owner']->apiV2UploadAllowed($sPurpose);
        if ($mCheck !== true)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) && $mCheck !== '' ? BxDolApiV2Map::text($mCheck) : 'The viewer may not post');

        $aFile = $oReq->file('file');
        if (!$aFile) {
            $iError = $oReq->fileError('file');
            if (in_array($iError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || ($iError === null && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > return_bytes(ini_get('post_max_size'))))
                throw new BxDolApiV2Problem(413, 'file_too_big', 'The file is larger than the site accepts');
            throw BxDolApiV2Problem::validation([['field' => 'file', 'code' => 'required', 'message' => 'Send the file as the `file` field']]);
        }

        // the mime types by extension are the site's, the same for every storage
        $oProbe = BxDolStorage::getObjectInstance($aStorages[array_key_first($aStorages)]['object']);
        $sMime = $oProbe ? (string)$oProbe->getMimeTypeByFileName((string)$aFile['name']) : '';
        $sKind = str_starts_with($sMime, 'image/') ? 'image' : (str_starts_with($sMime, 'video/') ? 'video' : '');
        $aStorage = null;
        foreach ($aStorages as $iStorageId => $a)
            // a storage of any files (the Files module's) takes every kind; its own types are its storage's
            if ($a['kind'] === $sKind || $a['kind'] === 'file')
                $aStorage = $a + ['id' => $iStorageId];
        if (!$aStorage)
            throw new BxDolApiV2Problem(415, 'unsupported_media_type', count($aStorages) > 1 ? 'Upload a photo or a video' : (reset($aStorages)['kind'] === 'video' ? 'Upload a video' : 'Upload a photo'));

        // the storage goes by the name's extension; the content must be of that kind as well
        // (a photo or video; other files are what their storage takes)
        if ($sKind !== '' && function_exists('finfo_open') && ($oInfo = finfo_open(FILEINFO_MIME_TYPE))) {
            $sSniffed = (string)finfo_file($oInfo, $aFile['tmp_name']);
            finfo_close($oInfo);
            if (!str_starts_with($sSniffed, $sKind . '/'))
                throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'The file is not ' . ($sKind === 'image' ? 'an image' : 'a video') . ', as its name says');
        }

        $oStorage = BxDolStorage::getObjectInstance($aStorage['object']);
        // private, as the post form's uploader stores them: links to the file carry a token
        $iFileId = $oStorage ? (int)$oStorage->storeFileFromForm($aFile, true, $iViewerId, 0) : 0;
        if (!$iFileId) {
            $iCode = $oStorage ? (int)$oStorage->getErrorCode() : 0;
            $sMessage = $oStorage ? BxDolApiV2Map::text($oStorage->getErrorString()) : '';
            if (in_array($iCode, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE, BX_DOL_STORAGE_ERR_FILE_TOO_BIG], true))
                throw new BxDolApiV2Problem(413, 'file_too_big', $sMessage ?: 'The file is larger than the site accepts');
            if (in_array($iCode, [BX_DOL_STORAGE_ERR_USER_QUOTA_EXCEEDED, BX_DOL_STORAGE_ERR_OBJECT_QUOTA_EXCEEDED, BX_DOL_STORAGE_ERR_SITE_QUOTA_EXCEEDED], true))
                throw new BxDolApiV2Problem(413, 'quota_exceeded', $sMessage ?: 'There is no room left for this file');
            if ($iCode === BX_DOL_STORAGE_ERR_WRONG_EXT)
                throw new BxDolApiV2Problem(415, 'unsupported_media_type', $sMessage ?: 'The site does not take files of this type');
            if (in_array($iCode, [BX_DOL_STORAGE_ERR_NO_FILE, BX_DOL_STORAGE_INVALID_FILE, UPLOAD_ERR_PARTIAL, UPLOAD_ERR_NO_FILE], true))
                throw BxDolApiV2Problem::validation([['field' => 'file', 'code' => 'invalid_file', 'message' => $sMessage ?: 'The file did not arrive whole']]);
            throw new BxDolApiV2Problem(500, 'not_stored', $sMessage ?: 'The file could not be stored');
        }

        // the uploader of the post form, as the site's own upload records it
        if (($aUploader = BxDolUploaderQuery::getUploaderObject($aStorage['uploader'])))
            $oStorage->updateGhostsUploaderId($iFileId, (int)$aUploader['id']);

        // a module's video is converted by its own transcoders, queued as its site pages queue them
        if ($aStorage['purpose'] !== 'post' && $aStorage['kind'] === 'video')
            BxDolApiV2Map::queueVideo($aStorage['object'], $iFileId, $aStorage['transcoders']);

        $iId = BxDolApiV2Map::uploadId($aStorage['id'], $iFileId);
        return BxDolApiV2Response::created($this->_media($aStorage, $iFileId), '/uploads/' . $iId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/uploads/{id}', id: 'getUpload', tag: 'uploads', auth: 'required',
        summary: 'One of the viewer\'s uploads, to see whether a video is ready',
        description: 'Only the viewer\'s own uploads (404 for anyone else\'s), of every purpose. Once a post or message took it, that shows it as well.',
        responses: [200 => 'Media'])]
    public function getUpload(BxDolApiV2Request $oReq)
    {
        list($aStorage, $iFileId) = $this->_own($oReq->id(), $oReq->requireViewer());
        return $this->_media($aStorage, $iFileId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/uploads/{id}', id: 'deleteUpload', tag: 'uploads', auth: 'required',
        summary: 'Delete one of the viewer\'s uploads that no post took',
        description: 'Taking an attachment off a post being written. An upload a post took goes with the post (DELETE /activities/{id}): 409 `attached`. Anyone else\'s upload is 404.',
        responses: [204 => null, 409 => null])]
    public function deleteUpload(BxDolApiV2Request $oReq)
    {
        $iViewerId = $oReq->requireViewer();
        list($aStorage, $iFileId, $aGhost) = $this->_own($oReq->id(), $iViewerId);
        if ((int)$aGhost['content_id'] !== 0)
            throw new BxDolApiV2Problem(409, 'attached', 'A post or message has this upload; it goes with it');

        $oStorage = BxDolStorage::getObjectInstance($aStorage['object']);
        if (!$oStorage || !$oStorage->deleteFile($iFileId, $iViewerId))
            throw new BxDolApiV2Problem(409, 'not_deleted', $oStorage ? BxDolApiV2Map::text($oStorage->getErrorString()) : 'The upload could not be deleted');

        return BxDolApiV2Response::noContent();
    }

    /**
     * Where uploads go: for a feed post (purpose `post`) the storages its module names
     * (apiV2PostUploadStorages: the Timeline's photo and video storages, with the post form's
     * field and uploader); for the purposes of other modules the storages their endpoint classes
     * name (apiV2UploadStorages). The owner's apiV2UploadAllowed($sPurpose) says who may upload.
     * @return array storage id => ['object', 'kind' (image|video|file), 'purpose', 'field' (post), 'uploader', 'thumb' and 'view' (transcoders, other purposes), 'owner']
     */
    public function storages()
    {
        if ($this->_aStorages !== null)
            return $this->_aStorages;

        $this->_aStorages = [];
        foreach (BxDolApiV2Router::hooks('apiV2PostUploadStorages') as $oOwner)
            foreach ((array)$oOwner->apiV2PostUploadStorages() as $a) {
                $aObject = BxDolStorageQuery::getStorageObject($a['object']);
                if (!empty($aObject['id']) && !isset($this->_aStorages[(int)$aObject['id']]))
                    $this->_aStorages[(int)$aObject['id']] = ['object' => $a['object'], 'kind' => $a['kind'], 'purpose' => 'post', 'field' => $a['field'], 'uploader' => $a['uploader'], 'owner' => $oOwner];
            }

        foreach (BxDolApiV2Router::hooks('apiV2UploadStorages') as $oOwner) {
            foreach ((array)$oOwner->apiV2UploadStorages() as $a) {
                $aObject = BxDolStorageQuery::getStorageObject($a['object']);
                if (empty($aObject['id']) || isset($this->_aStorages[(int)$aObject['id']]) || in_array($a['purpose'], ['post', ''], true))
                    continue;
                $this->_aStorages[(int)$aObject['id']] = [
                    'object' => $a['object'],
                    // photos, unless the module says its storage takes videos (with their
                    // transcoders) or any file (`file`: the Files module's)
                    'kind' => in_array($a['kind'] ?? 'image', ['video', 'file'], true) ? $a['kind'] : 'image',
                    'purpose' => $a['purpose'],
                    'field' => null,
                    'uploader' => $a['uploader'] ?? '',
                    'thumb' => $a['thumb'] ?? '',
                    'view' => $a['view'] ?? '',
                    'transcoders' => (array)($a['transcoders'] ?? []),
                    // a storage of any files: the images it makes copies of, by extension
                    'image_exts' => (array)($a['image_exts'] ?? []),
                    'owner' => $oOwner,
                ];
            }
        }
        return $this->_aStorages;
    }

    /**
     * An upload by its id: [storage, file id, ghost row], or null when it is not one: no such
     * file in an upload storage, or a file without a ghost row (not uploaded for a post).
     */
    public function find($iId)
    {
        $iId = (int)$iId;
        $aStorages = $this->storages();
        $iStorageId = $iId >> 32;
        $iFileId = $iId & 0xFFFFFFFF;
        if ($iId <= 0 || !$iFileId || !isset($aStorages[$iStorageId]))
            return null;

        $oStorage = BxDolStorage::getObjectInstance($aStorages[$iStorageId]['object']);
        $aGhost = $oStorage ? $oStorage->getGhost($iFileId) : null;
        if (empty($aGhost) || !is_array($aGhost) || !BxDolApiV2Map::fileRow($aStorages[$iStorageId]['object'], $iFileId))
            return null;

        return [$aStorages[$iStorageId] + ['id' => $iStorageId], $iFileId, $aGhost];
    }

    /**
     * One of the viewer's uploads, or 404: someone else's upload is not told apart from none.
     */
    protected function _own($iId, $iViewerId)
    {
        $aUpload = $this->find($iId);
        if (!$aUpload || (int)$aUpload[2]['profile_id'] !== (int)$iViewerId)
            throw BxDolApiV2Problem::notFound('The upload');
        return $aUpload;
    }

    /**
     * An upload as Media, with the copies what takes it shows: a feed post's as its module
     * gives them (apiV2PostUploadMedia), another purpose's by its storage's transcoders.
     */
    protected function _media($aStorage, $iFileId)
    {
        // a feed post's photo or video: the copies a post shows
        if ($aStorage['purpose'] === 'post')
            return $aStorage['owner']->apiV2PostUploadMedia($aStorage, $iFileId);
        // a module's video (POST /videos): its copies, once its transcoders made them
        if ($aStorage['kind'] === 'video')
            return BxDolApiV2Map::videoMedia($aStorage['object'], $iFileId, $aStorage['transcoders']);
        // a module's file (POST /files): any type, with the copies its module makes of it
        if ($aStorage['kind'] === 'file')
            return BxDolApiV2Map::fileMedia($aStorage['object'], $iFileId, $aStorage['transcoders'], $aStorage['image_exts']);
        // a message's or profile's photo: the copies the module shows
        return BxDolApiV2Map::imageMedia($aStorage['object'], $iFileId, $aStorage['thumb'], $aStorage['view']);
    }

    public static function schemas()
    {
        return [
            'Media' => BxDolApiV2Map::mediaSchema(),
            'Variant' => BxDolApiV2Map::variantSchema(),
            'UploadForm' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['file'],
                'properties' => [
                    'file' => ['type' => 'string', 'format' => 'binary', 'description' => 'A photo or a video, with its file name (the extension says which)'],
                    'purpose' => ['type' => 'string', 'default' => 'post', 'maxLength' => 32, 'examples' => ['post', 'message', 'conversation', 'profile', 'video', 'photo', 'album', 'file', 'post_cover'], 'description' => 'What takes it: `post` (POST /feed-posts), and where the Conversations module is on, `message` (POST /conversations/{id}/messages) and `conversation` (POST /conversations), which take photos only, and `profile` (PATCH /profiles/{id}: a picture or cover of the acting profile), photos only too; where the Videos module is on, `video` (POST /videos), videos only, which its own transcoders convert (`state` processing until GET /uploads/{id} says ready); where the Photos module is on, `photo` (POST /photos), photos only; where the Albums module is on, `album` (POST /albums and POST /albums/{id}/items), photos only; where the Files module is on, `file` (POST /files), a file of any type its storage takes (photos and videos must be what their names say); where the Posts module is on, `post_cover` (POST /posts `cover_media_id`), photos only. Another is 422.'],
                ],
            ],
        ];
    }
}

/** @} */
