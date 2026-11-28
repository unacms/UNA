<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * /favicon.ico, which browsers ask for when a page has no icon link (a JSON or file response, an old cached page),
 * and bots ask for always (.htaccess and the nginx config route it here). It is the favicon uploaded in Designer
 * when there is one, else favicon.ico: the default UNA glyph on a transparent background.
 */

define('BX_SKIP_INSTALL_CHECK', true); // only an icon: no "remove the install folder" redirect for it

$sDefault = __DIR__ . '/favicon.ico';
$sUrl = '';
if (file_exists(__DIR__ . '/inc/header.inc.php')) {
    require_once(__DIR__ . '/inc/header.inc.php');

    $aUrls = BxTemplFunctions::getUploadedFaviconUrls();
    $sUrl = $aUrls['fav'] ?: $aUrls['svg'];
}

// A day: an icon changed in Designer reaches browsers that already have one within that, like a new upload's link.
header('Cache-Control: public, max-age=86400');

if ($sUrl) {
    header('Location: ' . $sUrl, true, 302);
    exit;
}

header('Content-Type: image/x-icon');
header('Content-Length: ' . filesize($sDefault));
readfile($sDefault);

/** @} */
