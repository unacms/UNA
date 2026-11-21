<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaEndAdmin UNA Studio End Admin Pages
 * @ingroup     UnaStudio
 * @{
 */

require_once('./../inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');
require_once(BX_DOL_DIR_STUDIO_INC . 'utils.inc.php');

bx_import('BxDolLanguages');

bx_require_authentication(true);

$sType = bx_get('type');
if($sType === false)
    $sType = bx_get('bp_type');
$sType = $sType !== false ? bx_process_url_param($sType) : '';

$sPage = bx_get('page');
if($sPage === false)
    $sPage = bx_get('bp_page');
$sPage = $sPage !== false ? bx_process_url_param($sPage) : '';

// Opened without a page: show the Homepage rather than an empty list to pick from.
if($sPage === '' && bx_get('bp_action') === false)
    $sPage = BxTemplStudioBuilderPage::getDefaultPage($sType);

$oPage = new BxTemplStudioBuilderPage($sType, $sPage);
BxDolStudioTemplate::getInstance()->displayPage($oPage);
/** @} */
