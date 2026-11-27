<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Remembers that the logged in account has closed or finished an introduction tour.
 * @see BxDolTours
 */

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

header('Content-Type: application/json; charset=utf-8');

$sTour = bx_process_input(bx_get('tour'));

// Only a same-origin script can send this header (jQuery adds it), so another site cannot post here for a visitor.
$bAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest';

$bResult = $_SERVER['REQUEST_METHOD'] == 'POST'
    && $bAjax
    && isLogged()
    && bx_get('action') === 'seen'
    && is_string($sTour)
    && BxDolTours::getInstance()->setSeen($sTour);

echo json_encode(['code' => $bResult ? 0 : 1]);

/** @} */
