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
    $oSplash = BxDolSplash::getInstance();

    $s = $oTemplate->parseHtmlByContent($sCode, array(
        'logo' => BxTemplFunctions::getInstance()->getMainLogo(array('attrs' => array('class' => 'bx-def-font-color'))),
        'illustration' => $oSplash->getIllustration(),
    	'join_link' => BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=create-account'),
        'join_form' => $sJoinForm,
        // The boxes have the icon and the description of the sign-in and join blocks, as the apps' splash draws them.
        // Their padding and title sizes are the home page's blocks' (Studio > Pages > Home), as in the apps.
        'join_form_in_box' => $oSplash->getFormInBox('system:create_account_form', [_t('_sys_txt_splash_join'), _t('_sys_page_block_desc_create_account'), 'user-plus'], $sJoinForm),
        'login_link' => BX_DOL_URL_ROOT . $oPermalink->permalink('page.php?i=login'),
    	'login_form' => $sLoginForm,
        'login_form_in_box' => $oSplash->getFormInBox('system:login_form', [_t('_sys_txt_splash_login'), _t('_sys_page_block_desc_login'), 'user-round-key'], $sLoginForm)
    ));

    $s = bx_process_macros($s);
    $s = bx_replace_markers($s, array('site_title' => getParam('site_title'), 'site_description' => bx_process_output($oSplash->getSiteDescription())));
    return $s;
}

check_logged();

$oTemplate = BxDolTemplate::getInstance();
$oTemplate->setPageNameIndex(BX_PAGE_DEFAULT);

// The splash is the guest's home page: the main menu marks Home as the current page, as on the home page itself
// (BxBasePageHome) and in the apps.
BxDolMenu::setSelectedGlobal('system', 'home');
$oTemplate->setPageHeader(bx_replace_markers(_t('_sys_page_title_home'), array('site_title' => getParam('site_title'))));

// The splash stands in for the home page: it has the home page's description, or the site's default one.
$sDescription = BxDolPage::getMetaDescriptionByObject('sys_home');
if($sDescription !== '') {
    $oTemplate->setPageDescription($sDescription);
}

// The page is drawn in the site's shell, between its header and footer. The shell gives a page without a cover a hidden
// <h1>; a splash with a title of its own keeps the one.
$sPageMainCode = getPageMainCode();
if(preg_match('/<h1[\s>]/i', $sPageMainCode)) {
    BxDolCover::getInstance()->setPageHasHeading();
}

$oTemplate->setPageContent('page_main_code', $sPageMainCode);
$oTemplate->getPageCode();

/** @} */
