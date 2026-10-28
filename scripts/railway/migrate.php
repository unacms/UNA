<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: apply database migrations (see Migrations.php and migrations/README.md).
 * Runs from entrypoint.sh on every container start, before configure.php and languages.php.
 *
 *   php migrate.php              run the migrations this database has not had
 *   php migrate.php --baseline   record them all as done without running them (fresh install)
 *
 * After any migration ran: recompile languages, clear UNA's caches and bump sys_revision, so
 * pages, menus, options and CSS/JS bundles are built again from the changed rows. Until that
 * succeeds the ledger keeps a pending flag, and every start tries it again.
 *
 * Environment:
 *   UNA_HEADER          another install's header, for running this outside the image
 *   UNA_MIGRATIONS_DIR  another migrations folder (default: migrations/ next to this file)
 *
 * Exit status 1 when a migration failed; the ones before it stay applied and recorded.
 */

$_SERVER['HTTP_HOST'] = getenv('RAILWAY_PUBLIC_DOMAIN') ?: 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['SERVER_NAME'] = $_SERVER['HTTP_HOST'];
$GLOBALS['bx_profiler_disable'] = true;

require_once(getenv('UNA_HEADER') ?: '/var/www/html/inc/header.inc.php');
require_once(__DIR__ . '/Migrations.php');
// _t(), which cache clearing calls, is declared with this class; a CLI start does not load it.
bx_import('BxDolLanguages');

function migrationsLog(string $s): void
{
    fwrite(STDERR, "[migrations] $s\n");
}

/**
 * Migrations change rows that UNA caches: options, pages, menus, language strings.
 *
 * @return string what failed, or '' on success
 */
function migrationsRefresh(): string
{
    $oDb = BxDolDb::getInstance();
    $oDb->cleanMemoryAll();
    $oDb->cacheParams(true, true);

    if (!BxDolStudioLanguagesUtils::getInstance()->compileLanguage())
        return 'compiling languages';

    $iRevision = (int)getParam('sys_revision', false);
    $oCache = BxDolCacheUtilities::getInstance();
    foreach (['db', 'content', 'template', 'css', 'js'] as $sCache) {
        // false: that cache is off, so there is nothing to clear.
        $mixedResult = $oCache->clear($sCache);
        if (is_array($mixedResult) && (int)$mixedResult['code'] !== 0)
            return "clearing the $sCache cache";
    }

    // clear() bumps it only when the CSS or JS cache is on.
    if ((int)getParam('sys_revision', false) === $iRevision)
        setParam('sys_revision', $iRevision + 1);

    return '';
}

BxDolDb::getInstance();
$oMigrations = new UnaRailwayMigrations(
    BxDolDb::getLink(),
    getenv('UNA_MIGRATIONS_DIR') ?: __DIR__ . '/migrations',
    UnaRailwayMigrations::LEDGER,
    'migrationsLog'
);

try {
    if (in_array('--baseline', $argv, true)) {
        migrationsLog('fresh install: recorded ' . $oMigrations->baseline() . ' migration(s) without running them');
        exit(0);
    }

    $aResult = $oMigrations->run('migrationsRefresh');
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
    migrationsLog('later migrations did not run; the next start tries again from this one');
}

if ($aResult['refreshed'])
    migrationsLog('languages compiled, caches cleared, sys_revision bumped');
else if ($aResult['refresh_error'] !== '')
    migrationsLog('FAILED ' . $aResult['refresh_error'] . ' after migrations; the next start tries again');

exit($aResult['failed'] !== '' || $aResult['refresh_error'] !== '' ? 1 : 0);
