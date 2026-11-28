<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * API v2: what a rich text editor needs from the site, as the site's own editor gets it:
 * pictures in the text (POST /uploads/inline, the editor storage upload_inline uses), hashtags
 * to suggest after `#` (GET /hashtags) and a link's preview card (GET /links/preview, the
 * site's embed provider).
 */
class BxBaseApiV2Editor
{
    /** The editor's own storage and its resized copy, as UNA's editors and NEO upload to. */
    const INLINE_STORAGE = 'sys_images_editor';
    const INLINE_TRANSCODER = 'sys_images_editor';

    const TITLE_MAX = 300;
    const DESCRIPTION_MAX = 1000;

    #[BxDolApiV2Operation(
        method: 'GET', path: '/hashtags', id: 'suggestHashtags', tag: 'editor', limit: 'search',
        summary: 'Hashtags that start with the words, the most used first',
        description: "What an editor suggests after `#`, as the site's own editor does: the keywords of every content module's posts (and comments) that start with `q`, matched without regard to case, labels left out where the site takes only hashtags as keywords, the most used first. `url` is the hashtag's page on the site, the link a picked hashtag is written with (`<a class=\"bx-tag-link\" dchar=\"#\" href=\"url\">#tag</a>`). Guests get them too, as the site's own suggestions do. One query for all of them.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 50], 'description' => 'The start of the hashtag, without `#`'],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20, 'default' => 8]],
        ],
        responses: [200 => 'array:Hashtag', 422 => null],
    )]
    public function suggestHashtags(BxDolApiV2Request $oReq)
    {
        $sTerm = trim((string)$oReq->query('q', ''));
        $sTerm = ltrim($sTerm, '#');
        if ($sTerm === '' || get_mb_len($sTerm) > 50 || preg_match('/[\s#]/u', $sTerm))
            throw BxDolApiV2Problem::validation([['field' => 'q', 'code' => 'invalid', 'message' => 'Send the start of one hashtag']]);
        $iLimit = (int)$oReq->query('limit', 8);
        $iLimit = max(1, min(20, $iLimit ?: 8));

        $aResult = [];
        foreach (BxDolMetatags::getHashtagsByTerm($sTerm, $iLimit) as $a)
            $aResult[] = [
                'tag' => $a['keyword'],
                'count' => $a['count'],
                'url' => BxDolApiV2Map::absoluteUrl($a['url']),
            ];
        return $aResult;
    }

    #[BxDolApiV2Operation(
        method: 'GET', path: '/links/preview', id: 'previewLink', tag: 'editor', auth: 'required', limit: 'preview',
        summary: 'A link\'s preview card: its title, description and picture',
        description: "Read by the site's embed provider (Studio > Settings > Embeds; the built-in one reads the page itself), as the site's `embed.php` reads it for its link cards, and kept as the site keeps them (`sys_embed_lifetime` days). Only http and https links to public addresses: one whose host is, or resolves to, a private, loopback, link-local or reserved address is 422 `not_allowed` (the site's own check, bx_remote_url_is_allowed, which its fetch repeats for every redirect with the address pinned). A provider that reads pages in the background answers `pending` first: ask again a little later. A provider that only draws its cards in the browser gives no data: the card is then the host alone.",
        params: ['url' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'format' => 'uri', 'maxLength' => 2000], 'description' => 'An absolute http(s) link']],
        responses: [200 => 'LinkCard', 422 => null, 503 => null],
    )]
    public function previewLink(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $sUrl = trim((string)$oReq->query('url', ''));
        if ($sUrl === '' || get_mb_len($sUrl) > 2000 || !preg_match('#^https?://#i', $sUrl))
            throw BxDolApiV2Problem::validation([['field' => 'url', 'code' => 'invalid', 'message' => 'Pass an absolute http or https link']]);
        if (!bx_remote_url_is_allowed($sUrl))
            throw BxDolApiV2Problem::validation([['field' => 'url', 'code' => 'not_allowed', 'message' => 'The site does not read links to this address']]);

        $oEmbed = BxDolEmbed::getObjectInstance();
        if (!$oEmbed)
            throw new BxDolApiV2Problem(503, 'embeds_unavailable', 'This site has no embed provider');

        $sHost = (string)parse_url($sUrl, PHP_URL_HOST);
        $aData = $oEmbed->getData($sUrl, '');
        if (!is_array($aData))
            $aData = [];

        return [
            'url' => $sUrl,
            'host' => $sHost,
            'state' => !empty($aData['processing']) ? 'pending' : 'ready',
            'title' => self::_plain($aData['title'] ?? '', self::TITLE_MAX) ?: $sHost,
            'description' => self::_plain($aData['description'] ?? '', self::DESCRIPTION_MAX),
            'site_name' => self::_plain($aData['provider_name'] ?? $aData['site_name'] ?? '', 100) ?: (string)($aData['domain'] ?? $sHost),
            'image' => self::_image($aData),
        ];
    }

    #[BxDolApiV2Operation(
        method: 'POST', path: '/uploads/inline', id: 'uploadInline', tag: 'uploads', auth: 'required', limit: 'upload',
        summary: 'Upload a picture to put in a text',
        description: "A multipart/form-data body with one `file`: a picture for the text of a post, a discussion or a comment, stored as the site's editors store theirs (`upload_inline`): in the editor storage (`sys_images_editor`), public, and the viewer's from then on (it never becomes an attachment, and no ghost lifetime deletes it). The answer's `url` is what the text's `<img src>` takes: the editor's resized copy (1600px at most) for a JPEG or PNG, the file itself for other pictures; `width` and `height` are the size it is shown at. The storage's own limits apply: the types it takes (pictures only, 415), its size and quota (413). The content must be the picture its name says (415).",
        body: 'multipart:InlineUploadForm', responses: [201 => 'InlineImage', 413 => null, 415 => null, 422 => null],
    )]
    public function uploadInline(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();

        $aFields = $oReq->body();
        if (is_array($aFields) && ($aUnknown = array_keys($aFields)))
            throw BxDolApiV2Problem::validation([['field' => (string)$aUnknown[0], 'code' => 'unknown_field', 'message' => 'Is not a field of this request']]);

        $aFile = $oReq->file('file');
        if (!$aFile) {
            $iError = $oReq->fileError('file');
            if (in_array($iError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || ($iError === null && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > return_bytes(ini_get('post_max_size'))))
                throw new BxDolApiV2Problem(413, 'file_too_big', 'The file is larger than the site accepts');
            throw BxDolApiV2Problem::validation([['field' => 'file', 'code' => 'required', 'message' => 'Send the picture as the `file` field']]);
        }

        $oStorage = BxDolStorage::getObjectInstance(self::INLINE_STORAGE);
        if (!$oStorage)
            throw new BxDolApiV2Problem(503, 'uploads_unavailable', 'This site takes no pictures in texts');

        // a picture by its name, and by its content too
        $sMime = (string)$oStorage->getMimeTypeByFileName((string)$aFile['name']);
        if (!str_starts_with($sMime, 'image/'))
            throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'Upload a picture');
        $aSize = @getimagesize($aFile['tmp_name']);
        $sSniffed = '';
        if (function_exists('finfo_open') && ($oInfo = finfo_open(FILEINFO_MIME_TYPE))) {
            $sSniffed = (string)finfo_file($oInfo, $aFile['tmp_name']);
            finfo_close($oInfo);
        }
        if (!$aSize || ($sSniffed !== '' && !str_starts_with($sSniffed, 'image/')))
            throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'The file is not a picture, as its name says');

        // public and kept, as upload_inline stores them
        $iFileId = (int)$oStorage->storeFileFromForm($aFile, false, $iViewerId);
        if (!$iFileId) {
            $iCode = (int)$oStorage->getErrorCode();
            $sMessage = BxDolApiV2Map::text($oStorage->getErrorString());
            if (in_array($iCode, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE, BX_DOL_STORAGE_ERR_FILE_TOO_BIG], true))
                throw new BxDolApiV2Problem(413, 'file_too_big', $sMessage ?: 'The file is larger than the site accepts');
            if (in_array($iCode, [BX_DOL_STORAGE_ERR_USER_QUOTA_EXCEEDED, BX_DOL_STORAGE_ERR_OBJECT_QUOTA_EXCEEDED, BX_DOL_STORAGE_ERR_SITE_QUOTA_EXCEEDED], true))
                throw new BxDolApiV2Problem(413, 'quota_exceeded', $sMessage ?: 'There is no room left for this file');
            if ($iCode === BX_DOL_STORAGE_ERR_WRONG_EXT)
                throw new BxDolApiV2Problem(415, 'unsupported_media_type', $sMessage ?: 'The site does not take pictures of this type');
            if (in_array($iCode, [BX_DOL_STORAGE_ERR_NO_FILE, BX_DOL_STORAGE_INVALID_FILE, UPLOAD_ERR_PARTIAL, UPLOAD_ERR_NO_FILE], true))
                throw BxDolApiV2Problem::validation([['field' => 'file', 'code' => 'invalid_file', 'message' => $sMessage ?: 'The file did not arrive whole']]);
            throw new BxDolApiV2Problem(500, 'not_stored', $sMessage ?: 'The file could not be stored');
        }
        $oStorage->afterUploadCleanup($iFileId, $iViewerId);

        $aInfo = $oStorage->getFile($iFileId);
        $iWidth = (int)$aSize[0];
        $iHeight = (int)$aSize[1];
        $sUrl = '';
        // the resized copy for the types upload_inline resizes
        if ($aInfo && in_array(mb_strtolower((string)$aInfo['ext']), ['jpg', 'jpeg', 'jpe', 'png'], true) && ($oTranscoder = BxDolTranscoderImage::getObjectInstance(self::INLINE_TRANSCODER))) {
            $sUrl = (string)$oTranscoder->getFileUrl($iFileId);
            list($iWidth, $iHeight) = BxDolApiV2Map::variantSize(self::INLINE_TRANSCODER, $iWidth, $iHeight);
        }
        if ($sUrl === '')
            $sUrl = (string)$oStorage->getFileUrlById($iFileId);

        return BxDolApiV2Response::created([
            'url' => BxDolApiV2Map::absoluteUrl($sUrl),
            'width' => $iWidth ?: null,
            'height' => $iHeight ?: null,
            'mime_type' => (string)($aInfo['mime_type'] ?? $sMime),
        ]);
    }

    /** Text of a page's card: no markup, one line, at most $iMax characters. */
    protected static function _plain($s, $iMax)
    {
        $s = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string)$s), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
        if (get_mb_len($s) > $iMax)
            $s = rtrim(get_mb_substr($s, 0, $iMax - 1)) . '…';
        return $s;
    }

    /** The card's picture: the copy the site keeps (the built-in provider), or the provider's link. */
    protected static function _image($aData)
    {
        $sUrl = '';
        if (($iImageId = (int)($aData['image_id'] ?? 0)) && ($oStorage = BxDolStorage::getObjectInstance('sys_images')))
            $sUrl = (string)$oStorage->getFileUrlById($iImageId);
        if ($sUrl === '')
            foreach (['image', 'thumbnail_url'] as $sKey)
                if (!empty($aData[$sKey]) && is_string($aData[$sKey])) {
                    $sUrl = $aData[$sKey];
                    break;
                }
        $sUrl = BxDolApiV2Map::absoluteUrl($sUrl);
        return $sUrl && preg_match('#^https?://#i', $sUrl) ? $sUrl : null;
    }

    public static function schemas()
    {
        return [
            'Hashtag' => [
                'type' => 'object',
                'required' => ['tag', 'count', 'url'],
                'properties' => [
                    'tag' => ['type' => 'string', 'description' => 'Without `#`, as the site keeps it'],
                    'count' => ['type' => 'integer', 'description' => 'How many posts and comments have it'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'The hashtag\'s page on the site: the `href` of a picked hashtag'],
                ],
            ],
            'LinkCard' => [
                'type' => 'object',
                'description' => 'A link\'s preview card, as the site\'s embed provider reads it',
                'required' => ['url', 'host', 'state', 'title', 'description', 'site_name', 'image'],
                'properties' => [
                    'url' => ['type' => 'string'],
                    'host' => ['type' => 'string'],
                    'state' => ['type' => 'string', 'enum' => ['ready', 'pending'], 'description' => '`pending`: the provider reads it in the background; ask again a little later'],
                    'title' => ['type' => 'string', 'maxLength' => self::TITLE_MAX, 'description' => 'Plain text; the host when the page has none'],
                    'description' => ['type' => 'string', 'maxLength' => self::DESCRIPTION_MAX, 'description' => 'Plain text, maybe empty'],
                    'site_name' => ['type' => 'string', 'description' => 'The provider\'s name of the site, else the host'],
                    'image' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'An absolute http(s) URL of its picture; null without one'],
                ],
            ],
            'InlineUploadForm' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['file'],
                'properties' => [
                    'file' => ['type' => 'string', 'format' => 'binary', 'description' => 'A picture, with its file name (the extension says its type)'],
                ],
            ],
            'InlineImage' => [
                'type' => 'object',
                'required' => ['url', 'width', 'height', 'mime_type'],
                'properties' => [
                    'url' => ['type' => 'string', 'format' => 'uri', 'description' => 'What the text\'s `<img src>` takes: an absolute URL on the site'],
                    'width' => ['type' => ['integer', 'null'], 'description' => 'The width it is shown at; null when the site does not know'],
                    'height' => ['type' => ['integer', 'null']],
                    'mime_type' => ['type' => 'string'],
                ],
            ],
        ];
    }
}

/** @} */
