<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Social share card endpoint - it answers with the JPEG of one entity, rendering it upon the first
 * request and streaming the stored file on every request after that.
 *
 * This is the URL every og:image tag points to, so it is written to never fail visibly: an unknown,
 * deleted or private entity gets the generic site card, a failed render gets an already stored card or
 * a plain colour image, and the answer is always HTTP 200 with image bytes - never a redirect, never a
 * 404 page, never HTML.
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

// the card is always composed for the anonymous audience, so the session cookies are dropped BEFORE the
// bootstrap: check_logged() reads $_COOKIE directly at the end of inc/params.inc.php, and without the
// cookies getLoggedId() stays 0 for the whole request. Otherwise an admin who opens this URL in a logged
// in browser would bake content only a member can see into an image cached publicly for a year.
unset($_COOKIE['memberSession'], $_COOKIE['memberID'], $_COOKIE['memberPassword']);

// and the language always comes from the site default, so the language inputs are dropped BEFORE the
// bootstrap too: BxDolLanguages::getCurrentLangName() reads them straight out of the superglobals, and the
// language is one of the hash inputs of every card. A request which picks its own language would render a
// second card, store it over the first one and rewrite the map row - any client sending a plain
// Accept-Language header could keep the endpoint doing that forever.
unset($_GET['lang'], $_POST['lang'], $_REQUEST['lang'], $_COOKIE['lang'], $_SERVER['HTTP_ACCEPT_LANGUAGE']);

define('BX_SHARE_CARD_CACHE', 31536000); ///< the URL carries the card hash, so the answer never changes
define('BX_SHARE_CARD_CACHE_STALE', 3600); ///< ... unless the requested hash is not the current one
define('BX_SHARE_CARD_CACHE_FALLBACK', 60); ///< a substituted card must be asked for again soon
define('BX_SHARE_CARD_COLOR', '#1f2937'); ///< plain colour card, when there is nothing else to send
define('BX_SHARE_CARD_LOCK_WAIT', 8); ///< max seconds to wait for a parallel render of the same card
define('BX_SHARE_CARD_LOCK_POLL', 250000); ///< lock polling interval, microseconds
define('BX_SHARE_CARD_LOG', 'sys_transcoder'); ///< share cards share the image pipeline log object

$GLOBALS['bx_share_card_sent'] = false; ///< true once the headers are out, @see bx_share_card_shutdown
$GLOBALS['bx_share_card_tmp'] = array(); ///< files to remove afterwards, @see bx_share_card_shutdown
$GLOBALS['bx_share_card_color'] = ''; ///< theme colour of the plain card, read once the site is up

// registered before the bootstrap, so that it also covers a failure inside it and, more importantly, so
// that it runs before the shutdown handlers modules register - the profiler module, for one, flushes
// whatever is left in the output buffers
register_shutdown_function('bx_share_card_shutdown');

ob_start(); // nothing may reach the browser before the image, not a stray blank line, not a PHP warning
require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
bx_share_card_reset_output();

$GLOBALS['bx_share_card_color'] = getParam('sys_pwa_manifest_theme_color'); // read before any failure

$sEntity = bx_share_card_entity(bx_process_input(bx_get('e')));
$sHashRequested = bx_share_card_hash(bx_process_input(bx_get('h')));

$oShareCard = null;

try {
    $oShareCard = BxDolShareCard::getInstance();
    $oDb = BxDolDb::getInstance();
    $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_SHARE_CARDS);

    $aSpec = $oShareCard->getSpecForEntity($sEntity);

    // an unknown entity is not an error here - scrapers keep asking for content which was deleted or
    // hidden long ago, and they still have to get an image back
    if (!$aSpec || !is_array($aSpec))
        $aSpec = $oShareCard->getDefaultSpec();

    $aSpec = $oShareCard->normalizeSpec($aSpec);

    // a private entity collapses to the generic site card as a whole - the same substitution
    // BxDolShareCard::resolve() makes on the page side, so nothing an anonymous visitor cannot see ever
    // reaches the image
    if (!empty($aSpec['private']))
        $aSpec = $oShareCard->normalizeSpec($oShareCard->getDefaultSpec());

    // the spec, not the request, decides what is drawn and under which key it is stored
    $sEntity = $oShareCard->getEntityKey($aSpec);
    $sHash = $oShareCard->getCacheKey($aSpec);

    // the validator is always the freshly computed hash, so a request carrying an outdated hash still
    // gets the current card; such a request is not answered as immutable though, since that URL will
    // keep returning whatever the entity looks like at the time
    $bImmutable = $sHashRequested === $sHash;
    $iMaxAge = $bImmutable ? BX_SHARE_CARD_CACHE : BX_SHARE_CARD_CACHE_STALE;

    if (bx_share_card_is_not_modified($sHash)) {
        bx_share_card_send_not_modified($sHash, $iMaxAge, $bImmutable);
        exit;
    }

    $aMap = bx_share_card_map_get($oDb, $sEntity);

    // the stored card is the current one
    $sFile = '';
    if ($aMap && $aMap['hash'] === $sHash)
        $sFile = bx_share_card_local_copy($oStorage, (int)$aMap['file_id']);

    if ($sFile && bx_share_card_send_file($sFile, $sHash, $iMaxAge, $bImmutable))
        exit;

    $sFile = bx_share_card_produce($oShareCard, $oStorage, $oDb, $aSpec, $sEntity, $sHash);
    if ($sFile && bx_share_card_send_file($sFile, $sHash, $iMaxAge, $bImmutable))
        exit;

    // the current card could not be produced - an outdated card of the same entity is still about that
    // entity, so it beats the generic one; it goes out with a short cache to have the next request try
    // the current card again
    $sFile = $aMap ? bx_share_card_local_copy($oStorage, (int)$aMap['file_id']) : '';
    if ($sFile && bx_share_card_send_file($sFile, '', BX_SHARE_CARD_CACHE_FALLBACK, false))
        exit;
}
catch (Throwable $oError) {
    bx_share_card_log('request for (' . $sEntity . ') failed: ' . $oError->getMessage());
}

try {
    if ($oShareCard && bx_share_card_send_generic($oShareCard, $sEntity))
        exit;
}
catch (Throwable $oError) {
    bx_share_card_log('generic card for (' . $sEntity . ') failed: ' . $oError->getMessage());
}

bx_share_card_send_solid();
exit;

/**
 * Sanitize the requested entity key. It becomes a database key and a part of the cache key inputs, so it
 * is reduced to the character set the keys of BxDolShareCard::getEntityKey() are made of.
 */
function bx_share_card_entity($sEntity)
{
    $sEntity = is_scalar($sEntity) ? substr(trim((string)$sEntity), 0, 128) : '';
    return preg_match('/^[A-Za-z0-9_.:-]+$/', $sEntity) ? $sEntity : 'site';
}

/**
 * Sanitize the requested card hash.
 */
function bx_share_card_hash($sHash)
{
    $sHash = is_scalar($sHash) ? substr(trim((string)$sHash), 0, 64) : '';
    return preg_match('/^[A-Za-z0-9_-]+$/', $sHash) ? $sHash : '';
}

/**
 * Render the card of the given spec and store it, or return the file a parallel request has just stored.
 * @return path of a local file to stream or empty string when the card could not be produced
 */
function bx_share_card_produce($oShareCard, $oStorage, $oDb, $aSpec, $sEntity, $sHash)
{
    // a disabled feature never starts a render - the endpoint still answers, with whatever is already
    // stored or with the plain colour card
    if (!$oShareCard->isEnabled())
        return '';

    $rLock = bx_share_card_lock($sHash);

    // either the request holding the lock has just produced this very card, or we gave up waiting for
    // it - both cases are answered from the map, not by rendering the same image a second time
    $aMap = bx_share_card_map_get($oDb, $sEntity);
    if ($aMap && $aMap['hash'] === $sHash && ($sFile = bx_share_card_local_copy($oStorage, (int)$aMap['file_id']))) {
        bx_share_card_unlock($rLock);
        return $sFile;
    }

    if (!$rLock)
        return '';

    $sFile = bx_share_card_tmp_file($sHash);

    $oRenderer = BxDolShareCardRenderer::getInstance();
    $bRendered = $oRenderer->render($aSpec, $sFile) && file_exists($sFile) && filesize($sFile) > 0;

    if ($bRendered)
        bx_share_card_store($oStorage, $oDb, $sFile, $sEntity, $sHash, $aMap ? (int)$aMap['file_id'] : 0);
    else
        bx_share_card_log('render of (' . $sEntity . ') failed: ' . $oRenderer->getError());

    // the lock goes before the image: streaming to a slow client must not hold up the next request
    bx_share_card_unlock($rLock);

    return $bRendered ? $sFile : '';
}

/**
 * Put the rendered card into the storage, point the map row of the entity at it and delete the card it
 * supersedes.
 * @return new file id or 0 on failure
 */
function bx_share_card_store($oStorage, $oDb, $sFile, $sEntity, $sHash, $iFileIdOld)
{
    if (!$oStorage)
        return 0;

    // the map row is claimed before the card is stored, to have a content id to store it under: a file
    // with content id 0 is an upload nothing has claimed yet, and BxDolStorage::pruneGhosts() deletes
    // those as soon as the ghost lifetime is over
    $iContentId = bx_share_card_map_reserve($oDb, $sEntity);

    $iFileId = (int)$oStorage->storeFileFromPath($sFile, false, 0, $iContentId);
    if (!$iFileId) {
        bx_share_card_log('store of (' . $sEntity . ') failed with error ' . $oStorage->getErrorCode());
        return 0;
    }

    if (!bx_share_card_map_set($oDb, $sEntity, $sHash, $iFileId)) {
        $oStorage->deleteFile($iFileId); // nothing would ever reference it
        return 0;
    }

    // the map row references the card now, so the upload record of it is not needed any more either -
    // and with it gone there is nothing left for the pruning cron to look at
    $oStorage->afterUploadCleanup($iFileId, 0, $iContentId);

    // deleted only after the map points elsewhere, so that a parallel request never resolves a file
    // which is already gone
    if ($iFileIdOld && $iFileIdOld != $iFileId)
        $oStorage->deleteFile($iFileIdOld);

    return $iFileId;
}

/**
 * Get the map row of the entity - the card which is currently stored for it.
 */
function bx_share_card_map_get($oDb, $sEntity)
{
    $aRow = array();

    // a missing or broken map table degrades to a freshly rendered card - not to the 503 page the
    // database layer shows by default, and not to the exit() its uncaught exception handler makes. The
    // error checking is turned off before the statement is prepared, since the table is missing already
    // at that point.
    $oDb->setErrorChecking(false);
    try {
        $sQuery = $oDb->prepare("SELECT `hash`, `file_id` FROM `sys_share_cards_map` WHERE `entity` = ? LIMIT 1", $sEntity);
        $aRow = $oDb->getRow($sQuery);
    }
    catch (Throwable $oError) {
        bx_share_card_log('map row of (' . $sEntity . ') could not be read: ' . $oError->getMessage());
    }
    $oDb->setErrorChecking(true);

    return $aRow && is_array($aRow) ? $aRow : array();
}

/**
 * Make sure the entity has a map row and tell its id, the id every card of this entity is stored under.
 * @return map row id or 0 when there is none
 */
function bx_share_card_map_reserve($oDb, $sEntity)
{
    $iId = 0;

    $oDb->setErrorChecking(false);
    try {
        $sQuery = $oDb->prepare("INSERT INTO `sys_share_cards_map` SET `entity` = ?, `hash` = '', `file_id` = 0, `added` = ? ON DUPLICATE KEY UPDATE `id` = LAST_INSERT_ID(`id`)", $sEntity, time());
        if (false !== $oDb->query($sQuery))
            $iId = (int)$oDb->lastId();
    }
    catch (Throwable $oError) {
        bx_share_card_log('map row of (' . $sEntity . ') could not be claimed: ' . $oError->getMessage());
    }
    $oDb->setErrorChecking(true);

    return $iId;
}

/**
 * Point the map row of the entity at the given file. There is one row per entity, so the previous card
 * of the same entity is forgotten here.
 */
function bx_share_card_map_set($oDb, $sEntity, $sHash, $iFileId)
{
    $iTime = time();
    $bResult = false;

    $oDb->setErrorChecking(false);
    try {
        $sQuery = $oDb->prepare("INSERT INTO `sys_share_cards_map` SET `entity` = ?, `hash` = ?, `file_id` = ?, `added` = ? ON DUPLICATE KEY UPDATE `hash` = ?, `file_id` = ?, `added` = ?", $sEntity, $sHash, $iFileId, $iTime, $sHash, $iFileId, $iTime);
        $bResult = false !== $oDb->query($sQuery);
    }
    catch (Throwable $oError) {
        bx_share_card_log('map row of (' . $sEntity . ') threw: ' . $oError->getMessage());
    }
    $oDb->setErrorChecking(true);

    if (!$bResult)
        bx_share_card_log('map row of (' . $sEntity . ') could not be written');

    return $bResult;
}

/**
 * Get a path on this filesystem for a stored card, downloading it first when the storage engine is a
 * remote one. The endpoint streams the bytes in every case - it is the URL the scrapers have cached, and
 * a redirect costs a round trip some of them do not make.
 * @return path or empty string when the file is gone
 */
function bx_share_card_local_copy($oStorage, $iFileId)
{
    if (!$oStorage || $iFileId <= 0)
        return '';

    $aObject = $oStorage->getObjectData();
    $aFile = $oStorage->getFile($iFileId);
    if (!$aFile || empty($aFile['path']))
        return '';

    if ('Local' == $aObject['engine']) {
        $sFile = BX_DIRECTORY_STORAGE . $aObject['object'] . '/' . $aFile['path'];
        return file_exists($sFile) ? $sFile : '';
    }

    if (!($sUrl = $oStorage->getFileUrlById($iFileId)))
        return '';

    $sData = bx_file_get_contents($sUrl);
    if (!$sData)
        return '';

    $sFile = bx_share_card_tmp_file(md5($sUrl));
    return false !== file_put_contents($sFile, $sData) ? $sFile : '';
}

/**
 * Wait for the exclusive lock of one card, up to BX_SHARE_CARD_LOCK_WAIT seconds. The non blocking flock
 * is polled because a blocking one has no timeout in PHP, and a scraper must not be kept waiting.
 * @return lock handle or false when the lock was not taken
 */
function bx_share_card_lock($sHash)
{
    $rLock = @fopen(BX_DIRECTORY_PATH_TMP . 'share_card_' . bx_share_card_key($sHash) . '.lock', 'c');
    if (!$rLock)
        return false;

    $fDeadline = microtime(true) + BX_SHARE_CARD_LOCK_WAIT;
    do {
        if (flock($rLock, LOCK_EX | LOCK_NB))
            return $rLock;
        usleep(BX_SHARE_CARD_LOCK_POLL);
    } while (microtime(true) < $fDeadline);

    fclose($rLock);
    return false;
}

/**
 * Release the lock. The lock file itself stays - unlinking it would let another request lock a file
 * nobody else can see; the pruning cron sweeps the tmp folder anyway.
 */
function bx_share_card_unlock($rLock)
{
    if (!$rLock)
        return;

    flock($rLock, LOCK_UN);
    fclose($rLock);
}

/**
 * Name of a temporary file for this request, removed when the response is over.
 */
function bx_share_card_tmp_file($sKey)
{
    // the extension matters - the storage object accepts image file types only
    $sFile = BX_DIRECTORY_PATH_TMP . 'share_card_' . bx_share_card_key($sKey) . '_' . getmypid() . '.jpg';
    $GLOBALS['bx_share_card_tmp'][] = $sFile;
    return $sFile;
}

/**
 * Reduce a hash to the characters which are safe in a file name.
 */
function bx_share_card_key($sHash)
{
    $sKey = preg_replace('/[^A-Za-z0-9_-]/', '', (string)$sHash);
    return '' !== $sKey ? $sKey : 'none';
}

/**
 * Check the validator the client already has against the current one.
 */
function bx_share_card_is_not_modified($sEtag)
{
    if (empty($_SERVER['HTTP_IF_NONE_MATCH']))
        return false;

    foreach (explode(',', $_SERVER['HTTP_IF_NONE_MATCH']) as $sCandidate) {
        $sCandidate = trim($sCandidate);
        if ('W/' === substr($sCandidate, 0, 2)) // a proxy may have weakened the validator on the way
            $sCandidate = substr($sCandidate, 2);
        if ('*' === $sCandidate || trim($sCandidate, '"') === $sEtag)
            return true;
    }

    return false;
}

/**
 * Answer that the card the client has is still the current one.
 */
function bx_share_card_send_not_modified($sEtag, $iMaxAge, $bImmutable)
{
    bx_share_card_send_headers(false, $sEtag, $iMaxAge, $bImmutable);
    header('HTTP/1.1 304 Not Modified', true, 304);
}

/**
 * Stream a card file.
 * @return true when the bytes went out, false when the file turned out to be unusable
 */
function bx_share_card_send_file($sFile, $sEtag, $iMaxAge, $bImmutable)
{
    if (!$sFile || !file_exists($sFile))
        return false;

    $iSize = (int)filesize($sFile);
    if ($iSize <= 0)
        return false;

    bx_share_card_send_headers($iSize, $sEtag, $iMaxAge, $bImmutable);
    readfile($sFile);

    return true;
}

/**
 * Stream the generic site card in place of the card which could not be produced.
 * @return true when the bytes went out
 */
function bx_share_card_send_generic($oShareCard, $sEntityTried)
{
    $aSpec = $oShareCard->normalizeSpec($oShareCard->getDefaultSpec());
    $sEntity = $oShareCard->getEntityKey($aSpec);

    $oDb = BxDolDb::getInstance();
    $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_SHARE_CARDS);
    $sHash = $oShareCard->getCacheKey($aSpec);
    $aMap = bx_share_card_map_get($oDb, $sEntity);

    $sFile = '';
    if ($aMap && $aMap['hash'] === $sHash)
        $sFile = bx_share_card_local_copy($oStorage, (int)$aMap['file_id']);

    // rendering the generic card is skipped when the generic card is the one which has just failed to be
    // rendered - a card stored for it earlier is still sent though, which is what the lookup above is for
    if (!$sFile && $sEntity !== $sEntityTried)
        $sFile = bx_share_card_produce($oShareCard, $oStorage, $oDb, $aSpec, $sEntity, $sHash);

    if (!$sFile && $aMap)
        $sFile = bx_share_card_local_copy($oStorage, (int)$aMap['file_id']);

    // these bytes belong to another entity than the one in the URL, so they go out without a validator
    // and with a short cache - that URL has to come back for its own card
    return $sFile ? bx_share_card_send_file($sFile, '', BX_SHARE_CARD_CACHE_FALLBACK, false) : false;
}

/**
 * The last resort card - one solid colour, built in memory, so that even a broken installation answers
 * with a valid image of the right proportions.
 */
function bx_share_card_send_solid()
{
    $iWidth = defined('BX_DOL_SHARE_CARD_W') ? (int)BX_DOL_SHARE_CARD_W : 1200;
    $iHeight = defined('BX_DOL_SHARE_CARD_H') ? (int)BX_DOL_SHARE_CARD_H : 630;
    list($iRed, $iGreen, $iBlue) = bx_share_card_color_rgb();

    $sImage = '';
    try {
        if (function_exists('imagecreatetruecolor')) {
            $rImage = imagecreatetruecolor($iWidth, $iHeight);
            imagefilledrectangle($rImage, 0, 0, $iWidth - 1, $iHeight - 1, imagecolorallocate($rImage, $iRed, $iGreen, $iBlue));

            ob_start();
            imagejpeg($rImage, null, 82);
            $sImage = ob_get_clean();

            imagedestroy($rImage);
        }
        elseif (class_exists('Imagick')) {
            $oImage = new Imagick();
            $oImage->newImage($iWidth, $iHeight, new ImagickPixel(sprintf('rgb(%d,%d,%d)', $iRed, $iGreen, $iBlue)));
            $oImage->setImageFormat('jpeg');
            $sImage = $oImage->getImageBlob();
            $oImage->clear();
        }
    }
    catch (Throwable $oError) {
        $sImage = ''; // without an image library there is nothing to draw with, the answer stays empty
    }

    bx_share_card_send_headers(strlen($sImage), '', BX_SHARE_CARD_CACHE_FALLBACK, false);
    echo $sImage;
}

/**
 * The colour of the plain card - the theme colour of the site, read before anything could fail.
 * @return array of red, green and blue values
 */
function bx_share_card_color_rgb()
{
    $sColor = ltrim(trim((string)($GLOBALS['bx_share_card_color'] ?? '')), '#');
    if (3 == strlen($sColor))
        $sColor = $sColor[0] . $sColor[0] . $sColor[1] . $sColor[1] . $sColor[2] . $sColor[2];

    if (!preg_match('/^[0-9a-fA-F]{6}$/', $sColor))
        $sColor = ltrim(BX_SHARE_CARD_COLOR, '#');

    return array(hexdec(substr($sColor, 0, 2)), hexdec(substr($sColor, 2, 2)), hexdec(substr($sColor, 4, 2)));
}

/**
 * Send the image headers.
 * @param $iLength content length, or false to send none of it - a 304 answer carries no body
 * @param $sEtag validator of the card, or empty string when the bytes are not the card of this URL
 * @param $iMaxAge for how long the answer may be cached
 * @param $bImmutable true when this URL can never answer with anything else
 */
function bx_share_card_send_headers($iLength, $sEtag, $iMaxAge, $bImmutable)
{
    bx_share_card_reset_output(false); // the image starts at the very first byte of the body

    // a JPEG does not compress, and a compressed body would no longer match the length sent below
    if (ini_get('zlib.output_compression'))
        @ini_set('zlib.output_compression', 'Off');

    // the answer is cached by scrapers and CDNs, so nothing request specific may ride along with it -
    // the bootstrap is free to have queued a cookie or the no cache headers of a session
    header_remove('Set-Cookie');
    header_remove('Pragma');
    header_remove('Expires');

    header('Content-Type: image/jpeg');
    header('X-Content-Type-Options: nosniff');
    if (false !== $iLength)
        header('Content-Length: ' . (int)$iLength);
    if ('' !== $sEtag)
        header('ETag: "' . $sEtag . '"');
    header('Cache-Control: public, max-age=' . (int)$iMaxAge . ($bImmutable ? ', immutable' : ''));

    $GLOBALS['bx_share_card_sent'] = true;
}

/**
 * Drop everything which is buffered, closing the buffers of the bootstrap along with ours, and start
 * buffering again when asked to. The answer is binary, so a stray byte - a PHP warning, the buffer some
 * module has left open - is dropped rather than sent.
 */
function bx_share_card_reset_output($bBuffer = true)
{
    // a buffer which is not removable - one opened with ob_start('handler', 0, 0) - makes ob_end_clean()
    // answer false and leave the level where it was, so the level is watched rather than the loop trusted
    // to end on its own
    $iLevel = ob_get_level();
    while ($iLevel > 0 && @ob_end_clean() && ob_get_level() < $iLevel)
        $iLevel = ob_get_level();

    if ($bBuffer)
        ob_start();
}

/**
 * True when the answer already belongs to something else - a redirect or an error status the bootstrap
 * has set on purpose - and the plain colour card must not be pushed into it.
 */
function bx_share_card_response_claimed()
{
    $iCode = http_response_code();
    if (is_int($iCode) && $iCode >= 300)
        return true;

    foreach (headers_list() as $sHeader)
        if (0 === stripos($sHeader, 'location:'))
            return true;

    return false;
}

/**
 * Write to the image pipeline log.
 */
function bx_share_card_log($sMessage)
{
    bx_log(BX_SHARE_CARD_LOG, '[share_card] ERROR: ' . $sMessage, BX_LOG_ERR);
}

/**
 * Clean up after the response and, when a fatal error left the visitor with nothing, answer with the
 * plain colour card - an og:image URL which returns an error page is worse than a dull image.
 */
function bx_share_card_shutdown()
{
    foreach ($GLOBALS['bx_share_card_tmp'] as $sFile)
        @unlink($sFile);

    if (!empty($GLOBALS['bx_share_card_sent']) || headers_sent())
        return;

    $aError = error_get_last();
    $bFatal = $aError && in_array($aError['type'], array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR));

    // a 503 of the maintenance mode or a redirect of the bootstrap is left alone, but a request which
    // died on a fatal error is exactly what the plain colour card is here for - and PHP has put its own
    // 500 on that one, which would look like a claimed answer otherwise
    if (!$bFatal && bx_share_card_response_claimed())
        return;

    bx_share_card_reset_output(false);

    if ($bFatal)
        http_response_code(200); // the card is a valid answer, however badly the request ended

    bx_share_card_send_solid();
}

/** @} */
