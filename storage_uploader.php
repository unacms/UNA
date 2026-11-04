<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

require_once('./inc/header.inc.php');

$sUploaderObject = bx_process_input(bx_get('uo'));
$sStorageObject = bx_process_input(bx_get('so'));
$sUniqId = preg_match("/^[\d\w]+$/", bx_get('uid')) ? bx_get('uid') : '';
$isMultiple = bx_get('m') ? true : false;
$isLatest = bx_get('l') ? true : false;

$sFormat = bx_process_input(bx_get('f'));
if ($sFormat != 'html' &&  $sFormat != 'json')
    $sFormat = 'html';

$iContentId = bx_get('c');
if (false === $iContentId || '' === $iContentId)
    $iContentId = false;
else
    $iContentId = bx_process_input($iContentId, BX_DATA_INT);

if (!$sUploaderObject || !$sStorageObject || !$sUniqId)
    exit;

$isPrivate = (int)bx_get('p') ? 1 : 0;

$oUploader = BxDolUploader::getObjectInstance($sUploaderObject, $sStorageObject, $sUniqId);
if (!$oUploader) {
    // no such uploader available
    exit;
}

if(($bM = bx_get('m')) !== false)
    $oUploader->setMultiple((bool)$bM);

$sAction = bx_process_input(bx_get('a'));

if ($sAction == 'upload' && BxDolUploader::isUploadTokenEnabled()) {
    $aUploadToken = BxDolUploader::checkUploadToken(bx_get('ut'), 'upload', $sStorageObject, $sUploaderObject);
    if (!$aUploadToken) {
        header('HTTP/1.0 403 Forbidden');
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => _t('_Access denied'), 'code' => 403]);
        exit;
    }
}

switch ($sAction) {
    case 'show_uploader_form':
        header('Content-type: text/html; charset=utf-8');

        require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

        bx_import('BxDolLanguages');

        echo $oUploader->getUploaderForm($isMultiple, $iContentId, $isPrivate);
        break;

    case 'restore_ghosts':
        header('Content-Type: application/json; charset=utf-8');
        $sImagesTranscoder = bx_process_input(bx_get('img_trans'));
        echo $oUploader->getGhostsWithOrder((int)bx_get_logged_profile_id(), $sFormat, $sImagesTranscoder, $iContentId, $isLatest);
        break;
    
    case 'reorder_ghosts':
        header('Content-Type: application/json; charset=utf-8');
        $aGhosts = bx_process_input(bx_get('ghosts'));
        echo $oUploader->reorderGhosts((int)bx_get_logged_profile_id(), $sFormat, $aGhosts, $iContentId);
        break;

    case 'delete':
        header('Content-type: text/html; charset=utf-8');
        $iFileId = bx_process_input(bx_get('id'), BX_DATA_INT);
        echo $oUploader->deleteGhost($iFileId, bx_get_logged_profile_id());
        break;

    case 'upload':
        header('Content-type: text/html; charset=utf-8');

        bx_import('BxDolLanguages');

        $iProfileId = isset($aUploadToken) && is_array($aUploadToken) ? (int)$aUploadToken['profile_id'] : (int)bx_get_logged_profile_id();
        $oUploader->handleUploads($iProfileId, isset($_FILES['f']) ? $_FILES['f'] : null, $isMultiple, $iContentId, $isPrivate);
        break;
}

/** @} */
