<?php

/**
 * Seed the member account integration tests sign in as.
 * The installer only creates admin@example.com (see install/cmd.php).
 *
 * user@example.com / unauna
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

ob_start();

if (empty($_SERVER['HTTP_HOST']))
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

$oAccount = BxDolAccount::getInstance($sEmail);
if ($oAccount) {
    fwrite(STDOUT, "Account {$sEmail} already exists.\n");
} else {
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
}

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

// The installer creates only the account profile. Guests cannot view it, and it
// cannot comment, so the feed tests need a person profile as the current one.
seedPersonProfile($oAccount, 'user', false);

$oAdmin = BxDolAccount::getInstance('admin@example.com');
if ($oAdmin)
    seedPersonProfile($oAdmin, 'admin', true);

// SETTINGS

setParam('bx_invites_enable_reg_by_inv', '');

fwrite(STDOUT, "Seeded {$sEmail}.\n");

/**
 * Make an active person the account's current profile, creating one when the account has none.
 * An administrator's person gets the administrator level, the same as creating it while logged in.
 */
function seedPersonProfile(BxDolAccount $oAccount, string $sName, bool $bAdministrator): void
{
    if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_persons'))
        return;

    $oCurrent = BxDolProfile::getInstanceByAccount($oAccount->id(), true);
    if ($oCurrent && $oCurrent->getModule() === 'bx_persons' && $oCurrent->getStatus() === BX_PROFILE_STATUS_ACTIVE)
        return;

    foreach ($oAccount->getProfiles() as $iProfileId => $aProfile) {
        if (($aProfile['type'] ?? '') === 'bx_persons' && ($aProfile['status'] ?? '') === BX_PROFILE_STATUS_ACTIVE) {
            $oAccount->updateProfileContext((int)$iProfileId);
            return;
        }
    }

    if (!$oCurrent) {
        fwrite(STDERR, "Account {$sName} has no profile to author a person.\n");
        exit(1);
    }

    if ($bAdministrator) {
        bx_login($oAccount->id());
        $GLOBALS['logged']['member'] = true;
        $GLOBALS['logged']['admin'] = true;
    }

    $iAuthor = (int)$oCurrent->id();
    $aFields = BxDolService::call('bx_persons', 'prepare_fields', [[
        'author' => $iAuthor,
        'name' => $sName,
    ]]);
    $aResult = BxDolService::call('bx_persons', 'entity_add_forcedly', [$iAuthor, $aFields]);

    if ($bAdministrator)
        bx_logout(false);

    if (!is_array($aResult) || (int)($aResult['code'] ?? 1) !== 0) {
        $sError = is_array($aResult) ? (string)($aResult['message'] ?? 'unknown') : 'unknown';
        fwrite(STDERR, "Person profile for {$sName} was not created: {$sError}\n");
        exit(1);
    }

    // approve() writes the row but leaves sys_profiles_<id> in memory as pending, so getStatus()
    // in this request is stale. Read the account's current profile from the tables instead.
    $iCurrent = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($oAccount->id(), true);
    $aCurrent = $oAccount->getProfiles(false, false)[$iCurrent] ?? null;
    if (!$aCurrent || ($aCurrent['type'] ?? '') !== 'bx_persons' || ($aCurrent['status'] ?? '') !== BX_PROFILE_STATUS_ACTIVE) {
        fwrite(STDERR, "Person profile for {$sName} is not the current profile.\n");
        exit(1);
    }
}
