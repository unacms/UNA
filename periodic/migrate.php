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
 *   php periodic/migrate.php              run the migrations this database has not had
 *   php periodic/migrate.php --baseline   record them all as done without running them
 *   php periodic/migrate.php --check      check the migration files only; no database needed
 *
 * After any migration ran: recompile languages, clear UNA's caches and bump sys_revision, so
 * pages, menus, options and CSS/JS bundles are built again from the changed rows. Until that
 * succeeds the ledger keeps a pending flag, and every run tries it again.
 *
 * Exit status 1 when a migration failed; the ones before it stay applied and recorded.
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

BxDolDb::getInstance();
$oMigrations = new BxDolMigrations(new BxDolMigrationsQuery(), null, 'migrationsLog');

try {
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

if ($aResult['applied'])
    migrationsLog(count($aResult['applied']) . ' applied');
else if ($aResult['failed'] === '')
    migrationsLog('nothing to apply');

if ($aResult['failed'] !== '') {
    migrationsLog('FAILED ' . $aResult['failed'] . ': ' . $aResult['error']);
    migrationsLog('later migrations did not run; the next run tries again from this one');
}

if ($aResult['refreshed'])
    migrationsLog('languages compiled, caches cleared, sys_revision bumped');
else if ($aResult['refresh_error'] !== '')
    migrationsLog('FAILED ' . $aResult['refresh_error'] . ' after migrations; the next run tries again');

exit($aResult['failed'] !== '' || $aResult['refresh_error'] !== '' ? 1 : 0);

/** @} */
