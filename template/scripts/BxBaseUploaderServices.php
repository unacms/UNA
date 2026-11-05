<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services related to Comments.
 */
class BxBaseUploaderServices extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_cmts System Services 
     * @subsection bx_system_cmts-general General
     * @subsubsection bx_system_cmts-get_data_api get_data_api
     * 
     * @code bx_srv('system', 'get_data_api', [], 'TemplCmtsServices'); @endcode
     * 
     * Get comments data
     * @param $aParams array with paramenters :
     *         "module":"bx_posts","object_id":3,"start_from":5,"order_way":"desc","is_form":false
     * 
     * @see TemplCmtsServices::serviceGetDataApi
     */
    /** 
     * @ref bx_system_cmts-get_data_api "get_data_api"
     * @api @ref bx_system_cmts-get_data_api "get_data_api"
     */
    
    public function serviceGetDataApi($aParams = [])
    {
        $sUploaderObject = bx_process_input(bx_get('uo'));
        $sStorageObject = bx_process_input(bx_get('so'));
        $sAction = bx_process_input(bx_get('a'));
        if (!in_array($sAction, ['upload', 'upload_inline']))
            $sAction = 'upload';
        $sUniqId = preg_match("/^[\d\w]+$/", bx_get('uid')) ? bx_get('uid') : '';
        $isMultiple = bx_get('m') ? true : false;

        $sFormat = bx_process_input(bx_get('f'));
        if ($sFormat != 'html' &&  $sFormat != 'json')
            $sFormat = 'html';

        $iContentId = bx_get('c');
        if (false === $iContentId || '' === $iContentId)
            $iContentId = false;
        else
            $iContentId = bx_process_input($iContentId, BX_DATA_INT);

        $iProfileId = (int)bx_get_logged_profile_id();
        $isPrivate = (int)bx_get('p') ? 1 : 0;
        $sAction = bx_process_input(bx_get('a'));

        // An upload token is required for guests and for direct uploads (bypassing the app proxy),
        // where the profile comes from the token. A logged in profile uploading through the proxy
        // owns its files, so they are tracked as ghosts and pruned without a token.
        $sUploadToken = bx_get('ut');
        $aUploadToken = false;
        $bUpload = in_array($sAction, ['upload', 'upload_inline']);
        if (BxDolUploader::isUploadTokenEnabled() && ($bUpload ? (!$iProfileId || !empty($sUploadToken)) : !empty($sUploadToken))) {
            if (!$bUpload)
                return ['error' => _t('_Access denied'), 'code' => 403];
            $aUploadToken = BxDolUploader::checkUploadToken($sUploadToken, $sAction, $sStorageObject, $sUploaderObject, true);
            if (!$aUploadToken)
                return ['error' => _t('_Access denied'), 'code' => 403];
            $iProfileId = (int)$aUploadToken['profile_id'];
        }

        $oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, $sUniqId);

        switch ($sAction) {

            case 'restore_ghosts':
                $sImagesTranscoder = bx_process_input(bx_get('img_trans'));
                $oData = $oUploader->getGhostsWithOrder($iProfileId, $sFormat, $sImagesTranscoder, $iContentId);
                $aRv = isset($oData['g']) ? [$oData['g'], $oData['o']] : [];
                return $aRv;
                break;

            case 'delete':
                header('Content-type: text/html; charset=utf-8');
                $iFileId = bx_process_input(bx_get('id'), BX_DATA_INT);
                return $oUploader->deleteGhost($iFileId, $iProfileId);
                break;

            case 'upload':
                if(($aFile = $_FILES['file'] ?? false)) {
                    $aResult = $oUploader->handleUploads($iProfileId, $aFile, $isMultiple, $iContentId, $isPrivate);

                    if(($iId = (int)($aResult['id'] ?? 0)) && ($sImagesTranscoder = bx_get('img_trans')) !== false) {
                        $aGhosts = $oUploader->getGhosts($iProfileId, 'array', bx_process_input($sImagesTranscoder), $iContentId);
                        if(isset($aGhosts[$iId]))
                            $aResult['ghost'] = $aGhosts[$iId];
                    }

                    return $aResult;
                }
                break;

            case 'upload_inline':
                // The upload token is bound to `so`; the inline storage must be the same one.
                $sInlineStorage = bx_process_input(bx_get('o'));
                if(!empty($sUploadToken) && $sInlineStorage !== $sStorageObject)
                    return ['error' => _t('_Access denied'), 'code' => 403];
                $sStorageObject = $sInlineStorage;
                $sFile = bx_process_input(bx_get('f'));

                $oStorage = BxDolStorage::getObjectInstance($sStorageObject);
                if (!$oStorage || empty($_FILES['file']))
                    return array('error' => '1');

                // Only an image transcoder fed by this storage is allowed; check it before the file is stored.
                $oImageTranscoder = false;
                if (($sImageTranscoder = bx_process_input(bx_get('t')))) {
                    $aTranscoder = BxDolTranscoderQuery::getTranscoderObject($sImageTranscoder);
                    $aSource = !empty($aTranscoder['source_params']) ? unserialize($aTranscoder['source_params']) : [];
                    $oImageTranscoder = ($aSource['object'] ?? '') === $sStorageObject ? BxDolTranscoderImage::getObjectInstance($sImageTranscoder) : false;
                    if (!$oImageTranscoder)
                        return ['error' => _t('_Access denied'), 'code' => 403];
                }

                if (!($iId = $oStorage->storeFileFromForm($_FILES['file'], false, $iProfileId))) {
                    return array('error' => '1');
                    exit;
                }

                $oStorage->afterUploadCleanup($iId, $iProfileId);

                $aFileInfo = $oStorage->getFile($iId);

                // Video: queue transcoding and return stable image_transcoder.php links
                // (`vt` - mp4 transcoder, `pt` - poster transcoder); they redirect once ready.
                if ($aFileInfo && 0 === strncmp($aFileInfo['mime_type'], 'video/', 6) && ($sVideoTranscoder = bx_get('vt'))) {
                    $aResult = ['link' => '', 'poster' => '', 'video' => 1];
                    foreach (['link' => $sVideoTranscoder, 'poster' => bx_get('pt')] as $sKey => $sTranscoder) {
                        if (!$sTranscoder)
                            continue;

                        $sTranscoder = bx_process_input($sTranscoder);
                        // Only transcoders fed by this storage, so `h` can't point at foreign files.
                        $aTranscoder = BxDolTranscoderQuery::getTranscoderObject($sTranscoder);
                        $aSource = !empty($aTranscoder['source_params']) ? unserialize($aTranscoder['source_params']) : [];
                        if (($aSource['object'] ?? '') !== $sStorageObject || !($oTranscoder = BxDolTranscoder::getObjectInstance($sTranscoder)))
                            continue;

                        $oTranscoder->getFileUrl($iId); // adds the file to the transcoding queue
                        $aResult[$sKey] = BX_DOL_URL_ROOT . 'image_transcoder.php?o=' . $sTranscoder . '&h=' . $iId . '&s=' . $oTranscoder->getHandlerSignature($iId);
                    }

                    return $aResult['link'] ? $aResult : ['link' => $oStorage->getFileUrlById($iId)];
                }

                if ($oImageTranscoder && $aFileInfo && in_array($aFileInfo['ext'], array('jpg', 'jpeg', 'jpe', 'png'))) {
                    $sUrl = $oImageTranscoder->getFileUrl($iId);
                }
                else {
                    $sUrl = $oStorage->getFileUrlById($iId);
                }
                return ['link' => $sUrl];
                break;

        }
    }

    public function serviceGetUploadToken()
    {
        $sUploaderObject = bx_process_input(bx_get('uo'));
        $sStorageObject = bx_process_input(bx_get('so'));
        $sAction = bx_process_input(bx_get('a'));
        if(!in_array($sAction, ['upload', 'upload_inline']))
            $sAction = 'upload';
        if(!$sUploaderObject || !$sStorageObject || !BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, 'token'))
            return ['error' => _t('_sys_request_page_not_found_cpt'), 'code' => 404];
        // NEO posts the file straight to api.php without cookies, so the token can't be bound to a session.
        $iLifetime = BxDolUploader::getUploadTokenLifetime(true);
        $sToken = BxDolUploader::getUploadToken($sAction, $sStorageObject, $sUploaderObject, [], true);
        if(!$sToken)
            return ['error' => _t('_error occured'), 'code' => 500];

        return [
            'token' => $sToken,
            'url' => BX_DOL_URL_ROOT . 'api.php',
            'expire' => $iLifetime,
        ];
    }

    // Kept for callers that need to inspect legacy uploader token payloads.
    public function isUploadTokenValid($aToken, $sUploaderObject, $sStorageObject)
    {
        return !empty($aToken) && is_array($aToken)
            && ($aToken['uploader'] ?? '') === $sUploaderObject
            && ($aToken['storage'] ?? '') === $sStorageObject;
    }
}

/** @} */
