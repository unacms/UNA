<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");
bx_import('BxDolEmbed');

if (bx_get('a') == 'get_link'){
    // the link is fetched and stored on the server, it is for the editors of signed in members only
    if (!isLogged()) {
        http_response_code(403);
        echoJson(['code' => '', 'error' => 'access denied']);
        exit;
    }

    $sLink = bx_get('l');
    $sLink = is_string($sLink) ? trim($sLink) : '';
    if ($sLink === '' || get_mb_len($sLink) > BxDolEmbed::URL_MAX_LENGTH || !bx_remote_url_is_allowed($sLink)) {
        http_response_code(400);
        echoJson(['code' => '', 'error' => 'invalid link']);
        exit;
    }

    $oEmbed = BxDolEmbed::getObjectInstance();
    if ($oEmbed) {
        $sCode = $oEmbed->getLinkHTML($sLink);

        if ($oEmbed->getFetchRefused() == BxDolEmbed::FETCH_REFUSED_LIMIT) {
            http_response_code(429);
            echoJson(['code' => '', 'error' => 'too many requests']);
            exit;
        }

        echoJson(['code' => $sCode, 'js' => strip_tags($oEmbed->addProcessLinkMethod()), 'link' => $sLink]);
    }
}