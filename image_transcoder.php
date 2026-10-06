<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

ob_start();

require_once('./inc/header.inc.php');

$sTranscoderObject = bx_process_input(bx_get('o'));
$sHandler = bx_process_input(bx_get('h'));

$oTranscoder = BxDolTranscoderImage::getObjectInstance($sTranscoderObject);

if (!$oTranscoder) {
    ob_end_clean();
    bx_transcoder_error_occured();
    exit;
}

ob_end_clean();

if (isset($_GET['dpx']))
    $oTranscoder->forceDevicePixelRatio((int)$_GET['dpx']);

// Video goes through the transcoding queue (getFileUrl queues it), never inline ffmpeg here.
if (!($oTranscoder instanceof BxDolTranscoderVideo) && !$oTranscoder->isFileReady($sHandler) && !$oTranscoder->transcode ($sHandler)) {
    bx_transcoder_error_occured();
    exit;
}

$sImageUrl = $oTranscoder->getFileUrl($sHandler);
if (!$sImageUrl) {
    bx_transcoder_error_occured();
    exit;
}

header('Location: ' . $sImageUrl);
exit;

function bx_transcoder_error_occured($sMethod = 'displayPageNotFound')
{
    require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");
    $oTemplate = BxDolTemplate::getInstance();
    $oTemplate->$sMethod ();
}

/** @} */
