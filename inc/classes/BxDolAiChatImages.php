<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Images in agent chats: composer uploads (`sys_agents_chat_images` storage),
 * image parts of an AG-UI request, and NeuronAI content blocks built from them.
 */
class BxDolAiChatImages
{
    const STORAGE = 'sys_agents_chat_images';
    const MAX_BYTES = 8388608;
    const MAX_PER_TURN = 4;
    const MIME_DEFAULT = 'image/jpeg';
    /** Session key listing the file ids this visitor uploaded (guests have no profile id to own a file by). */
    const SESSION_KEY = 'sys_agents_chat_images_own';
    const SESSION_MAX = 50;

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new self();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Store one composer upload (`$_FILES` entry) into the chat images storage.
     *
     * @return array{file_id:int,url:string,mime:string}|array{error:string}
     */
    public function storeUpload($aFile, $iProfileId = 0)
    {
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        if (!$oStorage)
            return ['error' => 'Storage is not available'];

        $sName = (string)($aFile['name'] ?? '');
        $sTmp = (string)($aFile['tmp_name'] ?? '');
        $iSize = (int)($aFile['size'] ?? 0);
        if ($sTmp === '' || !is_uploaded_file($sTmp))
            return ['error' => 'No file'];
        if ($iSize <= 0 || $iSize > self::MAX_BYTES)
            return ['error' => 'File is too large'];

        $sMime = strtolower((string)($aFile['type'] ?? ''));
        $sExt = strtolower(pathinfo($sName, PATHINFO_EXTENSION));
        $aMime = [
            'jpg' => self::MIME_DEFAULT, 'jpeg' => self::MIME_DEFAULT, 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp',
        ];
        if (!isset($aMime[$sExt]))
            return ['error' => 'Only JPEG, PNG, GIF, WebP'];
        if ($sMime && strncmp($sMime, 'image/', 6) !== 0)
            return ['error' => 'Only images'];

        $iId = (int)$oStorage->storeFileFromForm($aFile, false, (int)$iProfileId);
        if (!$iId)
            return ['error' => $oStorage->getErrorString() ?: 'Upload failed'];

        if (method_exists($oStorage, 'afterUploadCleanup'))
            $oStorage->afterUploadCleanup($iId, (int)$iProfileId);

        $sUrl = $oStorage->getFileUrlById($iId);
        if (!$sUrl)
            return ['error' => 'Upload failed'];

        $this->rememberOwnFile($iId);

        $aInfo = $oStorage->getFile($iId) ?: [];
        return [
            'file_id' => $iId,
            'url' => $sUrl,
            'mime' => (string)($aInfo['mime_type'] ?? $aMime[$sExt]),
        ];
    }

    /**
     * Image part of an AG-UI / stored message: `{type:image, source:{type:url|data,...}}`,
     * `{type:image_url, image_url:{url}}`, `{url}`, or a `file_id` from storeUpload.
     *
     * @return array{url:string,mime:string,file_id:int}|null
     */
    public function parsePart($aPart)
    {
        if (!is_array($aPart))
            return null;

        $sType = strtolower((string)($aPart['type'] ?? ''));
        $sUrl = '';
        $sMime = self::MIME_DEFAULT;
        $aSource = is_array($aPart['source'] ?? null) ? $aPart['source'] : [];
        $iFileId = (int)($aPart['file_id'] ?? $aSource['file_id'] ?? 0);

        // A URL our own storage produced is trusted as it is (it may live on an S3 host).
        if ($iFileId > 0) {
            $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
            $sStored = $oStorage ? (string)$oStorage->getFileUrlById($iFileId) : '';
            if ($sStored !== '') {
                $aFile = $this->getStoredFile($iFileId);
                return ['url' => $sStored, 'mime' => $this->sanitizeMime($aFile['mime_type'] ?? ''), 'file_id' => $iFileId];
            }
        }

        if ($sType !== 'image' && $sType !== 'image_url')
            return null;

        $sUrl = $this->sanitizeUrl($this->partUrl($aPart));
        if ($sUrl === '')
            return null;

        $sMime = (string)($aSource['mimeType'] ?? $aPart['media_type'] ?? $aPart['mediaType'] ?? $aPart['mime'] ?? $aPart['mimeType'] ?? $sMime);
        return ['url' => $sUrl, 'mime' => $this->sanitizeMime($sMime), 'file_id' => 0];
    }

    /**
     * Image part of the chat request the visitor is sending. Accepted only when it
     * points at a file in the chat images storage that this visitor uploaded, by
     * `file_id` or by the exact URL storeUpload returned. The server never fetches a
     * URL the client sent: the image bytes are read from that stored file.
     *
     * @return array{url:string,mime:string,file_id:int}|null
     */
    public function parseRequestPart($aPart)
    {
        if (!is_array($aPart))
            return null;

        $sType = strtolower((string)($aPart['type'] ?? ''));
        $aSource = is_array($aPart['source'] ?? null) ? $aPart['source'] : [];
        $iFileId = (int)($aPart['file_id'] ?? $aSource['file_id'] ?? 0);
        if ($iFileId <= 0) {
            if ($sType !== 'image' && $sType !== 'image_url')
                return null;
            $iFileId = $this->fileIdFromUrl($this->partUrl($aPart));
        }

        if ($iFileId <= 0 || !$this->isOwnFile($iFileId))
            return null;

        $aFile = $this->getStoredFile($iFileId);
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $sUrl = $oStorage ? (string)$oStorage->getFileUrlById($iFileId) : '';
        if (!$aFile || $sUrl === '')
            return null;

        return ['url' => $sUrl, 'mime' => $this->sanitizeMime($aFile['mime_type'] ?? ''), 'file_id' => $iFileId];
    }

    /**
     * The URL an image part carries: `source.value`, `url`, `image_url.url`, or `content`.
     */
    protected function partUrl($aPart)
    {
        $aSource = is_array($aPart['source'] ?? null) ? $aPart['source'] : [];
        if (($aSource['type'] ?? '') === 'url' && !empty($aSource['value']))
            return (string)$aSource['value'];
        if (!empty($aPart['url']) && is_string($aPart['url']))
            return $aPart['url'];
        if (!empty($aPart['image_url']['url']) && is_string($aPart['image_url']['url']))
            return $aPart['image_url']['url'];

        $sContent = (string)($aPart['content'] ?? '');
        if ($sContent !== '' && (strpos($sContent, 'http://') === 0 || strpos($sContent, 'https://') === 0 || (strpos($sContent, '/') === 0 && strpos($sContent, '//') !== 0)))
            return $sContent;

        return '';
    }

    public function sanitizeMime($sMime)
    {
        $sMime = strtolower(trim((string)$sMime));
        return preg_match('#^image/(jpeg|png|gif|webp)$#', $sMime) ? $sMime : self::MIME_DEFAULT;
    }

    /**
     * Only http(s) URLs on this site's own host. Site-relative paths are made
     * absolute. Used to display stored images; nothing here is fetched server-side.
     */
    public function sanitizeUrl($sUrl)
    {
        $sUrl = trim((string)$sUrl);
        if ($sUrl === '' || preg_match('#^(javascript|data|file):#i', $sUrl))
            return '';

        if (strpos($sUrl, '/') === 0 && strpos($sUrl, '//') !== 0)
            $sUrl = rtrim(BX_DOL_URL_ROOT, '/') . $sUrl;

        $aUrl = parse_url($sUrl);
        $aRoot = parse_url(BX_DOL_URL_ROOT);
        if (empty($aUrl['scheme']) || empty($aUrl['host']))
            return '';
        if (!in_array(strtolower($aUrl['scheme']), ['http', 'https'], true))
            return '';

        $sHost = strtolower(preg_replace('/^www\./i', '', (string)$aUrl['host']));
        $sRootHost = strtolower(preg_replace('/^www\./i', '', (string)($aRoot['host'] ?? '')));
        if ($sRootHost === '' || strcasecmp($sHost, $sRootHost) !== 0)
            return '';
        $fPort = function ($a) {
            return (int)($a['port'] ?? (strtolower((string)($a['scheme'] ?? '')) === 'https' ? 443 : 80));
        };
        if ($fPort($aUrl) !== $fPort($aRoot))
            return '';

        return $sUrl;
    }

    /**
     * NeuronAI user message: text block plus one image block per image.
     * Images that cannot be turned into a block are passed as their URL in text.
     *
     * @param array<int, array{file_id:int,mime?:string}> $aImages from parseRequestPart
     * @return NeuronAI\Chat\Messages\UserMessage|null null when there is nothing to send
     */
    public function makeUserMessage($sText, $aImages = [])
    {
        $aBlocks = [];
        $sText = (string)$sText;
        if ($sText !== '')
            $aBlocks[] = new NeuronAI\Chat\Messages\ContentBlocks\TextContent($sText);

        $aBlocks = array_merge($aBlocks, $this->imageBlocks($aImages));
        if (!$aBlocks)
            return null;

        try {
            return new NeuronAI\Chat\Messages\UserMessage($aBlocks);
        } catch (Throwable $oException) {
            return $this->userMessageAddingBlocks($sText, $aBlocks);
        }
    }

    /**
     * One NeuronAI image block per stored image that can be read.
     *
     * @param array<int, array{file_id:int,mime?:string}> $aImages
     * @return array<int, NeuronAI\Chat\Messages\ContentBlocks\ImageContent>
     */
    protected function imageBlocks($aImages)
    {
        $aBlocks = [];
        foreach ((array)$aImages as $aImage) {
            $iFileId = (int)($aImage['file_id'] ?? 0);
            $sMime = trim((string)($aImage['mime'] ?? self::MIME_DEFAULT));
            $oImage = $iFileId > 0 ? $this->makeNeuronImageContent($iFileId, $sMime) : null;
            if ($oImage)
                $aBlocks[] = $oImage;
        }
        return $aBlocks;
    }

    /**
     * Fallback for NeuronAI versions whose UserMessage does not take a block list:
     * a text message with the image blocks added one by one.
     */
    protected function userMessageAddingBlocks($sText, $aBlocks)
    {
        $oMessage = new NeuronAI\Chat\Messages\UserMessage($sText !== '' ? $sText : ' ');
        if (!method_exists($oMessage, 'addContent'))
            return $oMessage;

        foreach ($aBlocks as $oBlock) {
            if (!($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\TextContent))
                $oMessage->addContent($oBlock);
        }
        return $oMessage;
    }

    /**
     * Image block for a file in the chat images storage. Prefer base64 (the model
     * does not have to fetch our URL); fall back to a URL block with the storage URL.
     */
    public function makeNeuronImageContent($iFileId, $sMime = self::MIME_DEFAULT)
    {
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $sUrl = $oStorage ? (string)$oStorage->getFileUrlById((int)$iFileId) : '';
        if ($sUrl === '')
            return null;

        $sMime = $this->sanitizeMime($sMime);
        $sClass = 'NeuronAI\\Chat\\Messages\\ContentBlocks\\ImageContent';
        if (!class_exists($sClass))
            return null;

        $sData = $this->storedFileBase64((int)$iFileId, $sUrl);
        if ($sData !== '') {
            if (method_exists($sClass, 'fromBase64'))
                return $sClass::fromBase64($sData, $sMime);
            if (class_exists('NeuronAI\\Chat\\Enums\\SourceType')) {
                try {
                    return new $sClass($sData, NeuronAI\Chat\Enums\SourceType::BASE64, $sMime);
                } catch (Throwable $oException) {
                }
            }
        }

        if (method_exists($sClass, 'fromUrl'))
            return $sClass::fromUrl($sUrl);

        try {
            if (class_exists('NeuronAI\\Chat\\Enums\\SourceType'))
                return new $sClass($sUrl, NeuronAI\Chat\Enums\SourceType::URL, $sMime);
            return new $sClass($sUrl);
        } catch (Throwable $oException) {
            return null;
        }
    }

    /**
     * NeuronAI ImageContent block → UI part (`{type:image, source:{type:url|data,...}}`).
     */
    public function neuronBlockToUiPart($oBlock)
    {
        if (!($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\ImageContent))
            return null;

        $sContent = (string)($oBlock->content ?? '');
        if ($sContent === '')
            return null;

        $sMime = (string)($oBlock->mediaType ?? self::MIME_DEFAULT);
        $sSource = '';
        if (isset($oBlock->sourceType)) {
            $sSource = $oBlock->sourceType instanceof \BackedEnum
                ? (string)$oBlock->sourceType->value
                : (string)$oBlock->sourceType;
        }

        if ($sSource === 'base64')
            return ['type' => 'image', 'source' => ['type' => 'data', 'value' => $sContent, 'mimeType' => $sMime]];

        $sUrl = $this->sanitizeUrl($sContent);
        if ($sUrl === '')
            return null;
        return ['type' => 'image', 'source' => ['type' => 'url', 'value' => $sUrl, 'mimeType' => $sMime]];
    }

    /**
     * Base64 of a stored chat image: read from disk for the Local engine, otherwise
     * downloaded from the URL our storage produced. '' when it cannot be read.
     */
    protected function storedFileBase64($iFileId, $sStorageUrl)
    {
        $sBin = false;
        $sLocal = $this->storedFileLocalPath($iFileId);
        if ($sLocal !== '')
            $sBin = @file_get_contents($sLocal);
        if (!is_string($sBin) || $sBin === '')
            $sBin = bx_file_get_contents($sStorageUrl);
        if (!is_string($sBin) || $sBin === '' || strlen($sBin) > self::MAX_BYTES)
            return '';
        return base64_encode($sBin);
    }

    /**
     * Disk path of a Local-engine chat image (`{storage}/{object}/a/ab/abc/{remote_id}`), '' otherwise.
     */
    protected function storedFileLocalPath($iFileId)
    {
        if (!defined('BX_DIRECTORY_STORAGE'))
            return '';

        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        $aObject = $oStorage ? $oStorage->getObjectData() : [];
        $aFile = $this->getStoredFile($iFileId);
        if (!$aFile || ($aObject['engine'] ?? '') !== 'Local')
            return '';

        $sRemoteId = (string)($aFile['remote_id'] ?? '');
        if (!preg_match('/^[A-Za-z0-9]+$/', $sRemoteId))
            return '';

        $sPath = '';
        for ($i = 1, $iLevels = (int)($aObject['levels'] ?? 0); $i <= $iLevels; $i++)
            $sPath .= substr($sRemoteId, 0, $i) . '/';

        $sLocal = BX_DIRECTORY_STORAGE . self::STORAGE . '/' . $sPath . $sRemoteId;
        return is_file($sLocal) ? $sLocal : '';
    }

    /**
     * Row of the chat images storage table, false when there is none.
     */
    protected function getStoredFile($iFileId)
    {
        if ((int)$iFileId <= 0)
            return false;
        return BxDolDb::getInstance()->getRow("SELECT * FROM `" . self::STORAGE . "` WHERE `id` = :id", ['id' => (int)$iFileId]);
    }

    /**
     * File id behind a URL storeUpload returned: the URL must be exactly that file's
     * storage URL. 0 for anything else.
     */
    protected function fileIdFromUrl($sUrl)
    {
        $sUrl = trim((string)$sUrl);
        if ($sUrl === '')
            return 0;
        if (strpos($sUrl, '/') === 0 && strpos($sUrl, '//') !== 0)
            $sUrl = rtrim(BX_DOL_URL_ROOT, '/') . $sUrl;

        $aUrl = parse_url($sUrl);
        if (!is_array($aUrl))
            return 0;

        $aQuery = [];
        if (!empty($aUrl['query']))
            parse_str((string)$aUrl['query'], $aQuery);
        $sName = !empty($aQuery['f']) && is_string($aQuery['f']) ? $aQuery['f'] : (string)($aUrl['path'] ?? '');
        $sRemoteId = pathinfo(basename($sName), PATHINFO_FILENAME);
        if (!preg_match('/^[A-Za-z0-9]+$/', $sRemoteId))
            return 0;

        $iFileId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `" . self::STORAGE . "` WHERE `remote_id` = :r", ['r' => $sRemoteId]);
        $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
        if ($iFileId <= 0 || !$oStorage)
            return 0;

        return (string)$oStorage->getFileUrlById($iFileId) === $sUrl ? $iFileId : 0;
    }

    /**
     * The file was uploaded by this visitor: the logged-in profile owns it, or this
     * session uploaded it (guests store files as profile 0).
     */
    public function isOwnFile($iFileId)
    {
        $aFile = $this->getStoredFile($iFileId);
        if (!$aFile)
            return false;

        $iProfileId = (int)bx_get_logged_profile_id();
        if ($iProfileId > 0 && (int)$aFile['profile_id'] === $iProfileId)
            return true;

        $aOwn = BxDolSession::getInstance()->getValue(self::SESSION_KEY);
        return is_array($aOwn) && in_array((int)$iFileId, array_map('intval', $aOwn), true);
    }

    protected function rememberOwnFile($iFileId)
    {
        $oSession = BxDolSession::getInstance();
        $aOwn = $oSession->getValue(self::SESSION_KEY);
        $aOwn = is_array($aOwn) ? array_map('intval', $aOwn) : [];
        $aOwn[] = (int)$iFileId;
        $oSession->setValue(self::SESSION_KEY, array_slice(array_values(array_unique($aOwn)), -self::SESSION_MAX));
    }
}

/** @} */
