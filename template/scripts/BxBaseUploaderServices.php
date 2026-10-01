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

        // Direct upload (bypassing the app proxy): the profile comes from a one-time upload token.
        $sUploadToken = bx_get('ut');
        if($sUploadToken !== false && $sUploadToken !== '') {
            $sUploadToken = bx_process_input($sUploadToken);
            $aToken = BxDolKey::getInstance()->getKeyData($sUploadToken, 'uploader');
            if($sAction != 'upload' || !$this->isUploadTokenValid($aToken, $sUploaderObject, $sStorageObject))
                return ['error' => _t('_Access denied'), 'code' => 403];

            $iProfileId = (int)$aToken['profile_id'];
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

                    // One-time token: burn it once the file is stored.
                    if(!empty($sUploadToken))
                        BxDolKey::getInstance()->removeKey($sUploadToken);

                    if(($iId = (int)($aResult['id'] ?? 0)) && ($sImagesTranscoder = bx_get('img_trans')) !== false) {
                        $aGhosts = $oUploader->getGhosts($iProfileId, 'array', bx_process_input($sImagesTranscoder), $iContentId);
                        if(isset($aGhosts[$iId]))
                            $aResult['ghost'] = $aGhosts[$iId];
                    }

                    return $aResult;
                }
                break;

            case 'upload_inline':
                $sStorageObject = bx_process_input(bx_get('o'));
                $sFile = bx_process_input(bx_get('f'));

                $oStorage = BxDolStorage::getObjectInstance($sStorageObject);

                if (!($iId = $oStorage->storeFileFromForm($_FILES['file'], false, $iProfileId))) {
                    return array('error' => '1');
                    exit;
                }

                $oStorage->afterUploadCleanup($iId, $iProfileId);

                $aFileInfo = $oStorage->getFile($iId);
                if ($aFileInfo && in_array($aFileInfo['ext'], array('jpg', 'jpeg', 'jpe', 'png'))) {
                    $oTranscoder = BxDolTranscoderImage::getObjectInstance(bx_get('t'));
                    $sUrl = $oTranscoder->getFileUrl($iId);
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
        $iProfileId = (int)bx_get_logged_profile_id();
        if(!$iProfileId)
            return ['error' => _t('_Access denied'), 'code' => 403];

        $sUploaderObject = bx_process_input(bx_get('uo'));
        $sStorageObject = bx_process_input(bx_get('so'));
        if(!$sUploaderObject || !$sStorageObject || !BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, 'token'))
            return ['error' => _t('_sys_request_page_not_found_cpt'), 'code' => 404];

        $iLifetime = 900;
        $sToken = BxDolKey::getInstance()->getNewKey([
            'profile_id' => $iProfileId,
            'uo' => $sUploaderObject,
            'so' => $sStorageObject,
            'expire' => time() + $iLifetime,
        ], $iLifetime, 'uploader');
        if(!$sToken)
            return ['error' => _t('_error occured'), 'code' => 500];

        return [
            'token' => $sToken,
            'url' => BX_DOL_URL_ROOT . 'api.php',
            'expire' => $iLifetime,
        ];
    }

    // sys_keys doesn't check expiration on read (only prune does), so the token keeps its own.
    public function isUploadTokenValid($aToken, $sUploaderObject, $sStorageObject)
    {
        return !empty($aToken) && is_array($aToken)
            && (int)($aToken['profile_id'] ?? 0) > 0
            && (int)($aToken['expire'] ?? 0) >= time()
            && ($aToken['uo'] ?? '') === $sUploaderObject
            && ($aToken['so'] ?? '') === $sStorageObject;
    }
}

/** @} */
