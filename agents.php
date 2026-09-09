<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "utils.inc.php");

bx_import('BxDolLanguages');

$sTool = bx_process_input(bx_get('t'));

/**
 * Work with Providers
 */
if(($iProviderId = bx_get('p')) !== false) {
    $iProviderId = bx_process_input($iProviderId, BX_DATA_INT);
    if(!$iProviderId)
        exit;

    $oProvider = BxDolAIProvider::getObjectInstance($iProviderId);
    if(!$oProvider)
        exit;

    if(($sAction = bx_get('a')) !== false) {
        $sAction = 'processAction' . bx_gen_method_name(bx_process_input($sAction));
        if(method_exists($oProvider, $sAction))
            $oProvider->$sAction();
    }
    else {
        $mixedResponce = $oProvider->call('products/7433953116300.json', ['fields' => 'id,title,handle,body_html,tags,variants'], 'get');
        print_r($mixedResponce);
    }
}

/** @} */
