<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Apply database migrations from the command line (see BxDolMigrations and migrations/README.md).
 *
 *   php periodic/migration.php                run the migrations this database has not had
 *   php periodic/migration.php --status       list pending and failed migrations and file problems; runs nothing
 *   php periodic/migration.php --channel=dev  set the update channel (dev, beta or stable); runs nothing
 *   php periodic/migration.php --accept       take changed or removed files of migrations that ran as they are now
 *   php periodic/migration.php --baseline     record them all as done without running them
 *   php periodic/migration.php --check        check the migration files only; no database needed
 *
 * Migrations run only on the dev channel for now: beta and stable will run what a signed release
 * manifest lists, and reading manifests is not built yet.
 *
 * After any migration ran: recompile languages, clear UNA's caches and bump sys_revision, so
 * pages, menus, options and CSS/JS bundles are built again from the changed rows. Until that
 * succeeds the ledger keeps a pending flag, and every run tries it again.
 *
 * Exit status 1 when a migration failed (the ones before it stay applied and recorded) or a
 * file of a migration that ran changed.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$aArgs = array_slice($argv, 1);

if (in_array('--check', $aArgs, true)) {
    define('BX_DOL', 1);
    require_once(__DIR__ . '/../inc/classes/BxDolMigrations.php');

    $aErrors = BxDolMigrations::validateTree(dirname(__DIR__));
    foreach ($aErrors as $sError)
        fwrite(STDERR, "[migrations] $sError\n");
    if (!$aErrors)
        fwrite(STDERR, "[migrations] all migration files are valid\n");
    exit($aErrors ? 1 : 0);
}

$_SERVER['HTTP_HOST'] = $_SERVER['HTTP_HOST'] ?? 'localhost';
$_SERVER['SERVER_NAME'] = $_SERVER['SERVER_NAME'] ?? $_SERVER['HTTP_HOST'];
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/';
$GLOBALS['bx_profiler_disable'] = true;

require_once(__DIR__ . '/../inc/header.inc.php');
// _t(), which cache clearing calls, is declared with this class; a command line run does not load it.
bx_import('BxDolLanguages');

function migrationsLog(string $s): void
{
    fwrite(STDERR, "[migrations] $s\n");
}

function migrationsList(string $sTitle, array $aItems): void
{
    if (!$aItems)
        return;

    migrationsLog($sTitle);
    foreach ($aItems as $s)
        migrationsLog("  $s");
}

BxDolDb::getInstance();
$oMigrations = new BxDolMigrations(new BxDolMigrationsQuery(), null, 'migrationsLog');
$sChannelHint = 'beta and stable will run only what a signed release manifest lists, which is not built yet; on a site that follows the code repository, set the dev channel: php periodic/migration.php --channel=dev';

try {
    foreach ($aArgs as $sArg) {
        if (!preg_match('/^--channel=(.*)$/', $sArg, $aMatch))
            continue;

        if (!in_array($aMatch[1], BxDolMigrations::CHANNELS, true)) {
            migrationsLog("FAILED: '{$aMatch[1]}' is not a channel; use " . implode(', ', BxDolMigrations::CHANNELS));
            exit(1);
        }
        setParam(BxDolMigrations::CHANNEL_OPTION, $aMatch[1]);
        migrationsLog("update channel: {$aMatch[1]}");
        exit(0);
    }

    if (in_array('--status', $aArgs, true)) {
        $aStatus = $oMigrations->status();
        migrationsLog("update channel: {$aStatus['channel']}, system version: {$aStatus['version']}, {$aStatus['recorded']} migration(s) recorded");
        migrationsList('pending:', $aStatus['pending']);
        migrationsList('failed:', $aStatus['failures']);
        migrationsList('files of migrations that ran, changed or gone:', $aStatus['problems']);
        if (!$aStatus['pending'] && !$aStatus['failures'] && !$aStatus['problems'])
            migrationsLog('nothing pending');
        exit(0);
    }

    if (in_array('--accept', $aArgs, true)) {
        $aAccepted = $oMigrations->accept();
        migrationsList('accepted as they are now:', $aAccepted);
        if (!$aAccepted)
            migrationsLog('no changed or removed files to accept');
        exit(0);
    }

    if (in_array('--baseline', $aArgs, true)) {
        migrationsLog('recorded ' . $oMigrations->baseline() . ' migration(s) without running them');
        exit(0);
    }

    $aResult = $oMigrations->run();
}
catch (Throwable $e) {
    migrationsLog('FAILED: ' . $e->getMessage());
    exit(1);
}

if ($aResult['problems']) {
    migrationsList('FAILED: files of migrations that ran changed or are gone, so none ran:', $aResult['problems']);
    migrationsLog('sites that ran them never run them again. Restore the files, or check that the database is right and run php periodic/migration.php --accept');
}

if ($aResult['applied'])
    migrationsLog(count($aResult['applied']) . ' applied');
else if ($aResult['failed'] === '' && !$aResult['waiting'] && !$aResult['problems'])
    migrationsLog('nothing to apply');

if ($aResult['waiting']) {
    migrationsList(count($aResult['waiting']) . ' migration(s) wait for the ' . $oMigrations->getChannel() . ' channel to allow them:', $aResult['waiting']);
    if ($oMigrations->getChannel() !== BxDolMigrations::CHANNEL_DEV)
        migrationsLog($sChannelHint);
}

if ($aResult['failed'] !== '') {
    migrationsLog('FAILED ' . $aResult['failed'] . ': ' . $aResult['error']);
    migrationsLog('later migrations did not run; the next run tries again from this one');
}

if ($aResult['refreshed'])
    migrationsLog('languages compiled, caches cleared, sys_revision bumped');
else if ($aResult['refresh_error'] !== '')
    migrationsLog('FAILED ' . $aResult['refresh_error'] . ' after migrations; the next run tries again');

exit($aResult['failed'] !== '' || $aResult['problems'] || $aResult['refresh_error'] !== '' ? 1 : 0);

/** @} */
