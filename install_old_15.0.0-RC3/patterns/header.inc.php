<?php

define('BX_DOL', 1);

if (isset($_ENV['UNA_HTTP_HOST']) || isset($_ENV['UNA_AUTO_HOSTNAME'])) {
    define('BX_DOL_URL_ROOT',
        (((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
         ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        ? 'https://' : 'http://')
        . ($_ENV['UNA_HTTP_HOST'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost') . '/' . ($_ENV['UNA_HTTP_PATH'] ?? '')
    );
}
else {
    define('BX_DOL_URL_ROOT', '%SITE_URL%'); ///< site url
}

define('BX_DIRECTORY_PATH_ROOT', $_ENV['UNA_ROOT_DIR'] ?? '%ROOT_DIR%'); ///< site path

define('BX_DATABASE_HOST', $_ENV['UNA_DB_HOST'] ?? '%DB_HOST%'); ///< db host
define('BX_DATABASE_SOCK', $_ENV['UNA_DB_SOCK'] ?? '%DB_SOCK%'); ///< db socket
define('BX_DATABASE_PORT', $_ENV['UNA_DB_PORT'] ?? '%DB_PORT%'); ///< db port
define('BX_DATABASE_USER', $_ENV['UNA_DB_USER'] ?? '%DB_USER%'); ///< db user
define('BX_DATABASE_PASS', $_ENV['UNA_DB_PWD'] ?? '%DB_PASSWORD%'); ///< db password
define('BX_DATABASE_NAME', $_ENV['UNA_DB_NAME'] ?? '%DB_NAME%'); ///< db name
define('BX_DATABASE_ENGINE', $_ENV['UNA_DB_ENGINE'] ?? '%DB_ENGINE%'); ///< db engine
if (isset($_ENV['UNA_DATABASE_COLLATE'])) {
    define('BX_DATABASE_COLLATE', $_ENV['UNA_DATABASE_COLLATE']); ///< db collate
}
if (isset($_ENV['UNA_DATABASE_PERSISTENT'])) {
    define('BX_DATABASE_PERSISTENT', $_ENV['UNA_DATABASE_PERSISTENT']); ///< db use porsistent connection (true by default)
}

define('BX_SYSTEM_JAVA', $_ENV['UNA_JAVA_PATH'] ?? '%JAVA_PATH%'); ///< path to java binary
define('BX_SYSTEM_FFMPEG', $_ENV['UNA_FFMPEG_PATH'] ?? '%FFMPEG_PATH%'); ///< path to ffmpeg binary
define('BX_DOL_SECRET', $_ENV['UNA_HASH_SECRET'] ?? '%SECRET%'); ///< secret word

define('BX_DB_FULL_VISUAL_PROCESSING', $_ENV['UNA_DEBUG_VISUAL_PROCESSING'] ?? true); ///< upon db error - show error message
define('BX_DB_FULL_DEBUG_MODE', $_ENV['UNA_DEBUG_MODE'] ?? false); ///< upon db error - show detailed report (turn off in production mode)
define('BX_DB_DO_EMAIL_ERROR_REPORT', $_ENV['UNA_DEBUG_EMAIL_REPORT'] ?? true); ///< upon db error - send email with detailed report
if (isset($_ENV['UNA_DEBUG_COOKIE'])) {
    define('BX_DBG_COOKIE', $_ENV['UNA_DEBUG_COOKIE']); ///< debug cookie name, if set then display errors
}
error_reporting($_ENV['UNA_DEBUG_ERROR_REPORTING'] ?? E_ALL); ///< error reporting level

if (isset($_ENV['UNA_FORCE_AUTOUPDATE_MAX_CHANGED_FILES_PERCENT'])) {
    define('BX_FORCE_AUTOUPDATE_MAX_CHANGED_FILES_PERCENT', $_ENV['UNA_FORCE_AUTOUPDATE_MAX_CHANGED_FILES_PERCENT']); ///< max % of changed files to force autoupdate, 0.05 (5%) by default
}
if (isset($_ENV['UNA_INT_MAX'])) {
    define('BX_DOL_INT_MAX', $_ENV['UNA_INT_MAX']); ///< max interger value, by default 2147483647 to support 32bit systems
}
if (isset($_ENV['UNA_STUDIO_FOLDER'])) {
    define('BX_DOL_STUDIO_FOLDER', $_ENV['UNA_STUDIO_FOLDER']); ///< studio folder name
}

mb_internal_encoding('UTF-8');
mb_regex_encoding('UTF-8');
date_default_timezone_set('UTC');

require_once('params.inc.php');

bx_check_debug_mode();
bx_check_maintenance_mode(true);
if (empty($_ENV['UNA_SKIP_MINIMAL_REQUIREMENTS'])) bx_check_minimal_requirements(true);
if (empty($_ENV['UNA_SKIP_REDIRECT'])) bx_check_redirect_to_correct_hostname(true);
if (empty($_ENV['UNA_SKIP_INSTALL_FOLDER_CHECK'])) bx_check_redirect_to_remove_install_folder(true);

