<?php

/**
 * Seed the member account integration tests sign in as.
 * The installer only creates admin@example.com (see install/cmd.php).
 *
 * user@example.com / unauna
 */

ob_start();

$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['SERVER_NAME'] = 'localhost';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$GLOBALS['bx_profiler_disable'] = true;

// Confirmation mail has nowhere to go in CI. Treat a send as done.
ini_set('sendmail_path', '/bin/true');

define('BX_SKIP_INSTALL_CHECK', 1);
require_once dirname(__DIR__) . '/inc/header.inc.php';

// The installer header does not load languages. createAccount() reports errors through _t().
bx_import('BxDolLanguages');

// SEED: user account
$sEmail = 'user@example.com';
$sPassword = 'unauna';

if (BxDolAccount::getInstance($sEmail)) {
    fwrite(STDOUT, "Account {$sEmail} already exists.\n");
    exit(0);
}

$aResult = bx_instance('BxTemplAccountForms')->createAccount([
    'name' => 'user',
    'email' => $sEmail,
    'password' => $sPassword,
], BX_PROFILE_ACTION_AUTO, false);

if (empty($aResult['account_id'])) {
    fwrite(STDERR, "Account {$sEmail} was not created: " . ($aResult['error'] ?? 'unknown') . "\n");
    exit(1);
}

$oAccount = BxDolAccount::getInstance((int)$aResult['account_id'], true);
if ($oAccount && !$oAccount->isConfirmedEmail())
    $oAccount->updateEmailConfirmed(true, false);

$aInfo = $oAccount ? $oAccount->getInfo() : false;
$iRole = (int)($aInfo['role'] ?? 0);
if (!$oAccount || !$oAccount->isConfirmedEmail() || !($iRole & BX_DOL_ROLE_MEMBER) || ($iRole & BX_DOL_ROLE_ADMIN)) {
    fwrite(STDERR, "Account {$sEmail} is not a confirmed member.\n");
    exit(1);
}

$sError = bx_check_password($sEmail, $sPassword, BX_DOL_ROLE_MEMBER);
if ($sError !== '') {
    fwrite(STDERR, "Account {$sEmail} does not accept its password: {$sError}\n");
    exit(1);
}

// SETTINGS

setParam('bx_invites_enable_reg_by_inv', '');

fwrite(STDOUT, "Seeded {$sEmail}.\n");
