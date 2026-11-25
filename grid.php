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
require_once(BX_DIRECTORY_PATH_INC . "utils.inc.php");

bx_import('BxDolLanguages');

$sObject = bx_process_input(bx_get('o'));
if (!$sObject)
    exit;

$oTemplate = null;
if(bx_get(BX_DOL_STUDIO_TEMPLATE_CODE_KEY) !== false)
    $oTemplate = BxDolStudioTemplate::getInstance();

$oGrid = BxDolGrid::getObjectInstance($sObject, $oTemplate);
if (!$oGrid) {
    // no such grid object available
    exit;
}

if(method_exists($oGrid, 'init'))
    $oGrid->init();

$sAction = 'performAction' . bx_gen_method_name(bx_process_input(bx_get('a')));
if (method_exists($oGrid, $sAction)) {
    if ($oGrid->isActionCsrfCheckingDisabled() || BxDolForm::isCsrfTokenValid(bx_get('csrf_token'), false)) {
        $sActionName = (string)bx_process_input(bx_get('a'));
        $bStudio = bx_get(BX_DOL_STUDIO_TEMPLATE_CODE_KEY) !== false || $oGrid instanceof BxDolStudioGrid;
        BxDolAdminLog::runGrid($oGrid, $sActionName, $bStudio, function () use ($oGrid, $sAction) {
            $oGrid->$sAction();
        });
    }
    else {
        echoJson(['msg' => _t('_sys_txt_form_submission_error_csrf_expired'), 'grid' => $oGrid->getCode(false)]);
    }
}

/** @} */
