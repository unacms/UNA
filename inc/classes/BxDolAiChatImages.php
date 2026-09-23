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
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
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
        $sMime = 'image/jpeg';
        $aSource = is_array($aPart['source'] ?? null) ? $aPart['source'] : [];
        $iFileId = (int)($aPart['file_id'] ?? $aSource['file_id'] ?? 0);

        if ($iFileId > 0) {
            $oStorage = BxDolStorage::getObjectInstance(self::STORAGE);
            $sStored = $oStorage ? (string)$oStorage->getFileUrlById($iFileId) : '';
            if ($sStored !== '')
                $sUrl = $sStored;
        }

        if ($sType === 'image' || $sType === 'image_url' || $sUrl !== '') {
            if ($sUrl === '' && ($aSource['type'] ?? '') === 'url')
                $sUrl = (string)($aSource['value'] ?? '');
            elseif ($sUrl === '' && !empty($aPart['url']))
                $sUrl = (string)$aPart['url'];
            elseif ($sUrl === '' && !empty($aPart['image_url']['url']))
                $sUrl = (string)$aPart['image_url']['url'];
            elseif ($sUrl === '' && ($sType === 'image' || $sType === 'image_url')) {
                $sContent = (string)($aPart['content'] ?? '');
                if ($sContent !== '' && (strpos($sContent, 'http://') === 0 || strpos($sContent, 'https://') === 0 || (strpos($sContent, '/') === 0 && strpos($sContent, '//') !== 0)))
                    $sUrl = $sContent;
            }
            $sMime = (string)($aSource['mimeType'] ?? $aPart['media_type'] ?? $aPart['mediaType'] ?? $aPart['mime'] ?? $aPart['mimeType'] ?? $sMime);
        }

        $sUrl = $this->sanitizeUrl($sUrl);
        if ($sUrl === '')
            return null;

        return ['url' => $sUrl, 'mime' => $this->sanitizeMime($sMime), 'file_id' => $iFileId];
    }

    public function sanitizeMime($sMime)
    {
        $sMime = strtolower(trim((string)$sMime));
        return preg_match('#^image/(jpeg|png|gif|webp)$#', $sMime) ? $sMime : 'image/jpeg';
    }

    /**
     * http(s) URLs on this site or on the storage host. Site-relative paths are made absolute.
     */
    public function sanitizeUrl($sUrl)
    {
        $sUrl = trim((string)$sUrl);
        if ($sUrl === '' || preg_match('#^(javascript|data|file):#i', $sUrl))
            return '';

        if (strpos($sUrl, '/') === 0 && strpos($sUrl, '//') !== 0)
            $sUrl = rtrim(BX_DOL_URL_ROOT, '/') . $sUrl;

        $aUrl = parse_url($sUrl);
        if (empty($aUrl['scheme']) || empty($aUrl['host']) || !empty($aUrl['user']) || !empty($aUrl['pass']))
            return '';
        if (!in_array(strtolower($aUrl['scheme']), ['http', 'https'], true))
            return '';

        $sHost = strtolower(preg_replace('/^www\./', '', $aUrl['host']));
        return in_array($sHost, $this->allowedHosts(), true) ? $sUrl : '';
    }

    /**
     * This site, the storage domain, the storage endpoint, and the bucket host.
     */
    protected function allowedHosts()
    {
        $aHosts = [];
        $aRoot = parse_url(BX_DOL_URL_ROOT);
        if (!empty($aRoot['host']))
            $aHosts[] = strtolower(preg_replace('/^www\./', '', $aRoot['host']));

        $sDomain = trim((string)getParam('sys_storage_s3_domain'));
        $sEndpoint = trim((string)getParam('sys_storage_s3_endpoint'));
        $sBucket = strtolower(trim((string)getParam('sys_storage_s3_bucket')));
        $sEndpointHost = '';

        foreach ([$sDomain, $sEndpoint] as $sValue) {
            if ($sValue === '')
                continue;
            $aValue = parse_url(preg_match('#://#', $sValue) ? $sValue : 'https://' . $sValue);
            if (empty($aValue['host']))
                continue;
            $aHosts[] = strtolower($aValue['host']);
            if ($sValue === $sEndpoint)
                $sEndpointHost = strtolower($aValue['host']);
        }

        if (preg_match('/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/', $sBucket)) {
            if ($sEndpointHost !== '')
                $aHosts[] = $sBucket . '.' . $sEndpointHost;
            elseif ($sDomain === '')
                $aHosts[] = $sBucket . '.s3.amazonaws.com';
        }

        return $aHosts;
    }

    /**
     * NeuronAI user message: text block plus one image block per image.
     * Images that cannot be turned into a block are passed as their URL in text.
     *
     * @param array<int, array{url:string,mime?:string}> $aImages
     * @return NeuronAI\Chat\Messages\UserMessage|null null when there is nothing to send
     */
    public function makeUserMessage($sText, $aImages = [])
    {
        $aBlocks = [];
        $sText = (string)$sText;
        if ($sText !== '')
            $aBlocks[] = new NeuronAI\Chat\Messages\ContentBlocks\TextContent($sText);

        foreach ((array)$aImages as $aImage) {
            $sUrl = trim((string)($aImage['url'] ?? ''));
            $sMime = trim((string)($aImage['mime'] ?? 'image/jpeg'));
            $oImage = $this->makeNeuronImageContent($sUrl, $sMime);
            if ($oImage)
                $aBlocks[] = $oImage;
            elseif ($sUrl !== '')
                $aBlocks[] = new NeuronAI\Chat\Messages\ContentBlocks\TextContent($sUrl);
        }

        if (!$aBlocks)
            return null;

        try {
            return new NeuronAI\Chat\Messages\UserMessage($aBlocks);
        } catch (Throwable $oException) {
            $oMessage = new NeuronAI\Chat\Messages\UserMessage($sText !== '' ? $sText : ' ');
            foreach ($aBlocks as $oBlock) {
                if ($oBlock instanceof NeuronAI\Chat\Messages\ContentBlocks\TextContent)
                    continue;
                if (method_exists($oMessage, 'addContent'))
                    $oMessage->addContent($oBlock);
            }
            return $oMessage;
        }
    }

    /**
     * Prefer base64 (the model does not have to fetch our URL); fall back to a URL block.
     */
    public function makeNeuronImageContent($sUrl, $sMime = 'image/jpeg')
    {
        $sUrl = $this->sanitizeUrl($sUrl);
        if ($sUrl === '')
            return null;

        $sClass = 'NeuronAI\\Chat\\Messages\\ContentBlocks\\ImageContent';
        if (!class_exists($sClass))
            return null;

        $sData = $this->urlToBase64($sUrl);
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

        $sMime = (string)($oBlock->mediaType ?? 'image/jpeg');
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

    protected function urlToBase64($sUrl)
    {
        $sUrl = $this->sanitizeUrl($sUrl);
        if ($sUrl === '')
            return '';

        $sLocal = $this->urlToLocalPath($sUrl);
        $sBin = ($sLocal !== '' && is_readable($sLocal)) ? @file_get_contents($sLocal) : false;
        if (!is_string($sBin) || $sBin === '') {
            $sCode = null;
            $sBin = bx_file_get_contents($sUrl, [], 'get', [], $sCode, [], 10, [CURLOPT_FOLLOWLOCATION => false]);
        }
        if (!is_string($sBin) || $sBin === '' || strlen($sBin) > self::MAX_BYTES)
            return '';

        return base64_encode($sBin);
    }

    /**
     * Local path of a file in the chat images storage, '' when the URL is not ours.
     */
    protected function urlToLocalPath($sUrl)
    {
        if (!defined('BX_DIRECTORY_STORAGE'))
            return '';

        $aUrl = parse_url((string)$sUrl);
        $sPath = urldecode((string)($aUrl['path'] ?? ''));
        $aQuery = [];
        if (!empty($aUrl['query']))
            parse_str((string)$aUrl['query'], $aQuery);

        $sFile = '';
        if (!empty($aQuery['f']))
            $sFile = basename((string)$aQuery['f']);
        elseif (preg_match('#/' . preg_quote(self::STORAGE, '#') . '/([^/?]+)$#', $sPath, $aMatch))
            $sFile = basename((string)$aMatch[1]);

        if ($sFile === '' || strpos($sFile, '..') !== false)
            return '';

        $sLocal = BX_DIRECTORY_STORAGE . self::STORAGE . '/' . $sFile;
        return is_file($sLocal) ? $sLocal : '';
    }
}

/** @} */
