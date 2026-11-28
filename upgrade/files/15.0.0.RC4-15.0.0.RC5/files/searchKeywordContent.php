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

// The search window (BxBaseSearchWindow): the chips and results of a query, as JSON.
if (bx_get('window')) {
    bx_import('BxDolLanguages');

    header('Content-type: application/json; charset=utf-8');
    echo json_encode(BxTemplServicesSearch::getSearchWindowParts($_GET));
    exit;
}

if (bx_get('keyword')){
    bx_import('BxDolLanguages');

    $sClass = bx_get_search_class_name();

    $o = new $sClass(bx_get('section'));
    $o->setLiveSearch(bx_get('live_search') ? 1 : 0);
    $o->setMetaType(bx_process_input(bx_get('type')));
    $o->setCategoryObject(bx_process_input(bx_get('cat')));

    $s = $o->response();
    if (!$s)
        $s = $o->getEmptyResult();

    header('Content-type: text/html; charset=utf-8');
    echo $s;
}
/** @} */
