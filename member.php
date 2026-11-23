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

bx_import('BxDolLanguages');

if (isset($_POST['ID'])) { // login form is submitted

    $oForm = BxDolForm::getObjectInstance('sys_login', 'sys_login');

    bx_alert('account', 'before_login', 0, 0, array('form' => $oForm));

    $oForm->initChecker();
    $oForm->setRole(bx_get('role'));
    $bLoginSuccess = $oForm->isSubmittedAndValid();

    // SMS two-factor login: a correct password leads to the code steps only, however the form is sent.
    $sUrl2fa = '';
    if ($bLoginSuccess) {
        $oAccount = BxDolAccount::getInstance(trim($oForm->getCleanValue('ID')));
        if (($sUrl2fa = BxTemplServiceLogin::start2faLogin($oAccount->id(), $oForm->getRememberMe())))
            $sUrl2fa = BX_DOL_URL_ROOT . $sUrl2fa;
    }

    $bAjxMode = (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest') ? true : false;
    if ($bAjxMode) {

        if ($sUrl2fa) {
            $s = _t('_sys_txt_login_2fa_continue', $sUrl2fa);
        }
        else if ($bLoginSuccess) {
            $s = 'OK';
            $aAccount = bx_login($oAccount->id(), $oForm->getRememberMe());
        }
        else {
            $s = $oForm->getLoginError();
        }

        if (isset($_SERVER['HTTP_ACCEPT'])) {
            if (false !== strpos($_SERVER['HTTP_ACCEPT'], 'application/json') || false !== strpos($_SERVER['HTTP_ACCEPT'], 'text/javascript')) {
                header('Content-type: application/json; charset=utf-8');
                echo json_encode(['res' => $s, 'form' => $oForm->getCode()] + ($sUrl2fa ? ['redirect' => $sUrl2fa] : []));
                exit;
            }
        }

        header('Content-type: text/html; charset=utf-8');
        echo $s;
        exit;

    } 
    elseif ($sUrl2fa) {
        header('Location: ' . $sUrl2fa);
    }
    elseif ($bLoginSuccess) {
        $aAccount = bx_login($oAccount->id(), $oForm->getRememberMe());

        $sUrlRelocate = $oForm->getCleanValue('relocate');
        if (!$sUrlRelocate || 0 !== strncmp($sUrlRelocate, BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)))
            $sUrlRelocate = BX_DOL_ROLE_ADMIN == $oForm->getRole() ? BX_DOL_URL_STUDIO . 'launcher.php' : BX_DOL_URL_ROOT . 'member.php';

        bx_alert('account', 'login_after', $oAccount->id(),  false, array(
            'account' => $aAccount,
            'url_relocate' => &$sUrlRelocate,
            'url_relocate_ref' => &$sUrlRelocate,
        ));

        BxDolTemplate::getInstance()->setPageNameIndex (BX_PAGE_TRANSITION);
        BxDolTemplate::getInstance()->setPageHeader (_t('_Please Wait'));
        BxDolTemplate::getInstance()->setPageContent ('page_main_code', BxDolTemplate::getInstance()->parseHtmlByName('transition_wait.html', ['text' => _t('_Please Wait')]));
        BxDolTemplate::getInstance()->setPageContent ('url_relocate', bx_html_attribute($sUrlRelocate, BX_ESCAPE_STR_QUOTE));

        BxDolTemplate::getInstance()->getPageCode();
        exit;
    }

}

bx_require_authentication();

header('Location: ' . BX_DOL_URL_ROOT);

/** @} */
