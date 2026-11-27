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

// Only links made by the site (signed when a page shows the file) are served, see BxDolTranscoder::getHandlerSignature.
// A link without a signature is one an editor saved in a text before links were signed, see BxDolTranscoder::isUnsignedHandlerAllowed.
$sSignature = bx_get('s');
$bUnsigned = false === $sSignature || '' === $sSignature;
if (!$oTranscoder || !($bUnsigned ? $oTranscoder->isUnsignedHandlerAllowed($sHandler) : $oTranscoder->isHandlerSignatureValid($sHandler, $sSignature))) {
    ob_end_clean();
    bx_transcoder_error_occured();
    exit;
}

ob_end_clean();

// A link made before the browser stored its pixel density has no dpx: the cookie, set by then, decides.
// Without the cookie (cookies off) it is the 1x copy, so getFileUrl below never gives this link back.
if (isset($_GET['dpx']))
    $oTranscoder->forceDevicePixelRatio((int)$_GET['dpx']);
elseif (!isset($_COOKIE['devicePixelRatio']))
    $oTranscoder->forceDevicePixelRatio(1);

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

/**
 * Nothing to show for this image or video address: a bare 404, not the site's 404 page.
 * The address is loaded by img and video elements and fetch (NEO checks a video that is
 * still processing every 15 s), and the answer isn't cached, so the file shows once it's ready.
 */
function bx_transcoder_error_occured()
{
    header('HTTP/1.0 404 Not Found');
    header('Status: 404 Not Found');
    header('Cache-Control: no-store');
}

/** @} */
