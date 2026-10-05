<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: post-install settings for an API-backed site (NEO client in front).
 * Runs from entrypoint.sh on every container start, after install, so it must be
 * idempotent. Plain mysqli on purpose: no UNA bootstrap, nothing cached yet.
 *
 * Environment:
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD  set by entrypoint.sh
 *   UNA_API_KEY      key the NEO server proxy sends as `Authorization: Bearer`
 *   UNA_API_ORIGINS  comma-separated browser origins allowed to call the API directly
 *   UNA_CLIENT_URL   public client URL (links in emails and push notifications)
 *
 * Mirrors the "Database Configuration" and "New API Setup" stages of scripts/Jenkinsfile,
 * except that unsafe API services (raw SQL through r=q) stay off.
 */

$oDb = new mysqli(
    getenv('DB_HOST'),
    getenv('DB_USER'),
    getenv('DB_PASSWORD'),
    getenv('DB_NAME'),
    (int)(getenv('DB_PORT') ?: 3306)
);
$oDb->set_charset('utf8mb4');

function setOption(mysqli $oDb, string $sName, string $sValue): void
{
    $oStmt = $oDb->prepare('UPDATE `sys_options` SET `value` = ? WHERE `name` = ?');
    $oStmt->bind_param('ss', $sValue, $sName);
    $oStmt->execute();
}

function listFromEnv(string $sName): array
{
    return array_values(array_filter(array_map('trim', explode(',', (string)getenv($sName)))));
}

$sClientUrl = rtrim((string)getenv('UNA_CLIENT_URL'), '/');

$aOptions = [
    // API: the NEO proxy authenticates with a key; browsers (Expo web, local dev) by origin.
    'sys_api_enable' => 'on',
    'sys_api_access_by_key' => 'on',
    'sys_api_access_by_origin' => 'on',
    'sys_api_access_unsafe_services' => '',
    'sys_session_auth' => 'on',
    'sys_api_cookie_path' => '/',
    'sys_api_cookie_samesite' => 'Lax',
    'sys_api_cookie_secure' => 'on',
    // Same API behaviour as api.neo.so.
    'sys_api_search_sections' => 'bx_posts,bx_persons,bx_groups,bx_events,bx_spaces,bx_market,bx_organizations,bx_ads,bx_videos,sys_pages,bx_timeline',
    'sys_api_conn_in_prof_units' => 'on',
    'sys_api_context_connection' => 'subscriptions',
    'sys_api_context_switcher' => 'bx_spaces',
    'sys_api_root_page_guest' => 'splash',
    'sys_api_root_page_member' => 'home',
    'sys_iconset_default' => 'sys_lucide',
];
if ($sClientUrl !== '') {
    $aOptions['sys_api_url_root_email'] = $sClientUrl . '/';
    $aOptions['sys_api_url_root_push'] = $sClientUrl . '/';
}
foreach ($aOptions as $sName => $sValue)
    setOption($oDb, $sName, $sValue);

// Same "tmp fix for search via API" as the Jenkinsfile.
$oDb->query("UPDATE `sys_objects_search` SET `GlobalSearch` = '0' WHERE `ObjectName` IN ('sys_pages', 'bx_timeline')");

if (($sKey = trim((string)getenv('UNA_API_KEY'))) !== '') {
    $oStmt = $oDb->prepare("INSERT INTO `sys_api_keys` (`title`, `key`, `order`) VALUES ('NEO', ?, 1) ON DUPLICATE KEY UPDATE `title` = `title`");
    $oStmt->bind_param('s', $sKey);
    $oStmt->execute();
}

$aOrigins = listFromEnv('UNA_API_ORIGINS');
if ($sClientUrl !== '')
    $aOrigins[] = $sClientUrl;
foreach (array_unique($aOrigins) as $iOrder => $sOrigin) {
    $oStmt = $oDb->prepare('SELECT 1 FROM `sys_api_origins` WHERE `url` = ?');
    $oStmt->bind_param('s', $sOrigin);
    $oStmt->execute();
    if ($oStmt->get_result()->num_rows)
        continue;

    $oStmt = $oDb->prepare('INSERT INTO `sys_api_origins` (`url`, `order`) VALUES (?, ?)');
    $iPos = $iOrder + 1;
    $oStmt->bind_param('si', $sOrigin, $iPos);
    $oStmt->execute();
}

echo "API configured" . ($sClientUrl !== '' ? " for $sClientUrl" : '') . "\n";
