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

bx_import('BxDolLanguages');

bx_require_authentication(true);

bx_import('BxTemplStudioMenuTop');
$oTopMenu = BxTemplStudioMenuTop::getInstance();
$oTopMenu->setSelected(BX_DOL_STUDIO_MT_CENTER, 'launcher');

$oPage = BxTemplStudioLauncher::getInstance();

if(($mixedResult = $oPage->checkAction()) !== false) {
    echoJson($mixedResult);
    exit;
}

$oTemplate = BxDolStudioTemplate::getInstance();

$sPageCode = $oPage->getPageCode();
if($sPageCode === false)
    $oTemplate->displayMsg(($sError = $oPage->getError(false)) !== false ? $sError : '_sys_txt_error_occured', true);

$oTemplate->setPageNameIndex($oPage->getPageIndex());
$oTemplate->setPageHeader($oPage->getPageHeader());
$oTemplate->setPageDescription($oPage->getPageDescription());
$oTemplate->setPageContent('page_caption_code', $oPage->getPageCaption());
$oTemplate->setPageContent('page_attributes', $oPage->getPageAttributes());
if($oPage->isLeftColumn())
    $oTemplate->setPageContent('page_menu_code', $oPage->getPageMenu());
$oTemplate->setPageContent('page_main_code', $sPageCode);
$oTemplate->addCss($oPage->getPageCss());
$oTemplate->addJs($oPage->getPageJs());
$oTemplate->getPageCode();
/** @} */
