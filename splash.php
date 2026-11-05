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

bx_import('BxDolAcl');
bx_import('BxDolLanguages');

/**
 * Studio > Designer > Landing previews this page for admins, enabled or not: the saved code, or the editor's code posted with
 * the Studio form's CSRF token (so no other site can make an admin's browser run code of its choosing here).
 */
function getPreviewCode()
{
    if(!isAdmin() || bx_get('preview') === false)
        return false;

    if(isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['code'])) {
        $sToken = isset($_POST['csrf_token']) ? bx_process_input($_POST['csrf_token']) : '';
        if(!BxDolForm::isCsrfTokenValid($sToken, false))
            return false;

        return (string)$_POST['code'];
    }

    return getParam('sys_site_splash_code');
}

function getPageMainCode()
{
    $oTemplate = BxDolTemplate::getInstance();    

    $sCode = getPreviewCode();
    if($sCode === false) {
        if(!getParam('sys_site_splash_enabled'))
            $oTemplate->displayPageNotFound();

        $sCode = getParam('sys_site_splash_code');
    }

    $sJoinForm = BxDolService::call('system', 'create_account_form', array(), 'TemplServiceAccount');
    $sLoginForm = BxDolService::call('system', 'login_form', array(), 'TemplServiceLogin');

    $oPermalink = BxDolPermalinks::getInstance();

    $s = $oTemplate->parseHtmlByContent($sCode, array(
        'logo' => BxTemplFunctions::getInstance()->getMainLogo(array('attrs' => array('class' => 'bx-def-font-color'))),
        'illustration' => BxDolSplash::getInstance()->getIllustration(),
    	'join_link' => BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=create-account'),
        'join_form' => $sJoinForm,
        'join_form_in_box' => DesignBoxContent(_t('_sys_txt_splash_join'), $sJoinForm, BX_DB_PADDING_DEF),
        'login_link' => BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=login'),
    	'login_form' => $sLoginForm,
        'login_form_in_box' => DesignBoxContent(_t('_sys_txt_splash_login'), $sLoginForm, BX_DB_PADDING_DEF)
    ));

    $s = bx_process_macros($s);
    $s = bx_replace_markers($s, array('site_title' => getParam('site_title')));
    return $s;
}

check_logged();

$oTemplate = BxDolTemplate::getInstance();
$oTemplate->setPageNameIndex(BX_PAGE_DEFAULT);
$oTemplate->setPageType(BX_PAGE_TYPE_DEFAULT_WO_HF);
$oTemplate->setPageHeader(bx_replace_markers(_t('_sys_page_title_home'), array('site_title' => getParam('site_title'))));
$oTemplate->setPageContent('page_main_code', getPageMainCode());
$oTemplate->getPageCode();

/** @} */
