<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCoreFunctions UNA Core Functions
 * @{
 */

// Trust X-Forwarded-Proto from a TLS-terminating proxy (e.g. Railway).
// header.inc.php is generated at install and often gitignored, so this lives here.
if (empty($_SERVER['HTTPS']) || 'off' === $_SERVER['HTTPS']) {
    $sFwdProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    if ('' !== $sFwdProto) {
        $sFwdFirst = strtolower(trim(explode(',', $sFwdProto, 2)[0]));
        if ('https' === $sFwdFirst)
            $_SERVER['HTTPS'] = 'on';
    }
}

define('BX_DOL_START', microtime ());

//--- Main URLs ---//
define('BX_DOL_URL_PLUGINS', BX_DOL_URL_ROOT . 'plugins/');
define('BX_DOL_URL_PLUGINS_PUBLIC', BX_DOL_URL_ROOT . 'plugins_public/');
define('BX_DOL_URL_MODULES', BX_DOL_URL_ROOT . 'modules/');
define('BX_DOL_URL_CACHE_PUBLIC', BX_DOL_URL_ROOT . 'cache_public/');
define('BX_DOL_URL_BASE', BX_DOL_URL_ROOT . 'template/');

//--- Main Pathes ---//
define('BX_DIRECTORY_PATH_INC', BX_DIRECTORY_PATH_ROOT . 'inc/');
define('BX_DIRECTORY_PATH_BASE', BX_DIRECTORY_PATH_ROOT . 'template/');
define('BX_DIRECTORY_PATH_CACHE', BX_DIRECTORY_PATH_ROOT . 'cache/');
define('BX_DIRECTORY_PATH_CACHE_PUBLIC', BX_DIRECTORY_PATH_ROOT . 'cache_public/');
define('BX_DIRECTORY_PATH_CLASSES', BX_DIRECTORY_PATH_ROOT . 'inc/classes/');
define('BX_DIRECTORY_PATH_PLUGINS', BX_DIRECTORY_PATH_ROOT . 'plugins/');
define('BX_DIRECTORY_PATH_PLUGINS_PUBLIC', BX_DIRECTORY_PATH_ROOT . 'plugins_public/');
define('BX_DIRECTORY_PATH_MODULES', BX_DIRECTORY_PATH_ROOT . 'modules/');
define('BX_DIRECTORY_PATH_TMP', BX_DIRECTORY_PATH_ROOT . 'tmp/');
define('BX_DIRECTORY_PATH_LOGS', BX_DIRECTORY_PATH_ROOT . 'logs/');
define('BX_DIRECTORY_STORAGE', BX_DIRECTORY_PATH_ROOT . 'storage/');

//--- System settings ---//
define('BX_DOL_DIR_RIGHTS', 0777);
define('BX_DOL_FILE_RIGHTS', 0666);

define('BX_DOL_STORAGE_OBJ_FILES', 'sys_files');
define('BX_DOL_STORAGE_OBJ_IMAGES', 'sys_images');

if (!defined('BX_DOL_INT_MAX'))
    define('BX_DOL_INT_MAX', 2147483647);

define('BX_DOL_TRANSCODER_OBJ_ICON_APPLE', 'sys_icon_apple');
define('BX_DOL_TRANSCODER_OBJ_ICON_ANDROID', 'sys_icon_android');
define('BX_DOL_TRANSCODER_OBJ_ICON_ANDROID_SPLASH', 'sys_icon_android_splash');
define('BX_DOL_TRANSCODER_OBJ_ICON_FACEBOOK', 'sys_icon_facebook');
define('BX_DOL_TRANSCODER_OBJ_ICON_FAVICON', 'sys_icon_favicon');
define('BX_DOL_TRANSCODER_OBJ_COVER', 'sys_cover');
define('BX_DOL_TRANSCODER_OBJ_COVER_UNIT_PROFILE', 'sys_cover_unit_profile');

//--- Module types ---//
if (!defined('BX_DOL_MODULE_TYPE_MODULE')) {
    define('BX_DOL_MODULE_TYPE_MODULE', 'module');
    define('BX_DOL_MODULE_TYPE_LANGUAGE', 'language');
    define('BX_DOL_MODULE_TYPE_TEMPLATE', 'template');
}

define('BX_DOL_MODULE_SUBTYPE_PROFILE', 1);
define('BX_DOL_MODULE_SUBTYPE_CONTEXT', 2);
define('BX_DOL_MODULE_SUBTYPE_TEXT', 3);
define('BX_DOL_MODULE_SUBTYPE_FILE', 4);
define('BX_DOL_MODULE_SUBTYPE_PAYMENT', 5);
define('BX_DOL_MODULE_SUBTYPE_NOTIFICATION', 6);
define('BX_DOL_MODULE_SUBTYPE_CONNECT', 7);

//--- Payment settings ---//
define('BX_PAYMENT_TYPE_SINGLE', 'single');
define('BX_PAYMENT_TYPE_RECURRING', 'recurring');

define('BX_PAYMENT_EMPTY_ID', 0);

//--- Studio settings ---//
if (!defined('BX_DOL_STUDIO_FOLDER')) {
    define('BX_DOL_STUDIO_FOLDER', 'studio');
}
define('BX_DOL_URL_STUDIO', BX_DOL_URL_ROOT . BX_DOL_STUDIO_FOLDER . '/');
define('BX_DOL_URL_STUDIO_BASE', BX_DOL_URL_STUDIO . 'template/');

define('BX_DOL_DIR_STUDIO', BX_DIRECTORY_PATH_ROOT . BX_DOL_STUDIO_FOLDER . '/');
define('BX_DOL_DIR_STUDIO_INC', BX_DOL_DIR_STUDIO . 'inc/');
define('BX_DOL_DIR_STUDIO_CLASSES', BX_DOL_DIR_STUDIO . 'classes/');
define('BX_DOL_DIR_STUDIO_BASE', BX_DOL_DIR_STUDIO . 'template/');

//--- User Roles ---//
define('BX_DOL_ROLE_GUEST', 0);
define('BX_DOL_ROLE_MEMBER', 1);
define('BX_DOL_ROLE_ADMIN', 2);

//--- User Roles in Studio ---//
define('BX_DOL_STUDIO_ROLE_MASTER', 1);
define('BX_DOL_STUDIO_ROLE_OPERATOR', 2);

//--- Profile Statuses ---//
define('BX_PROFILE_STATUS_SUSPENDED', 'suspended'); ///< profile status - suspended, profile is syspended by admin/moderator and usually can't access the site
define('BX_PROFILE_STATUS_ACTIVE', 'active'); ///< profile status - active, profile is active on the site
define('BX_PROFILE_STATUS_PENDING', 'pending'); ///< profile status - pending, default method of approving is manual approving

//--- Account settings ---//
define('BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_ACCOUNT_ID', '2FA_LOGIN_ACCOUNT_ID');
define('BX_ACCOUNT_SESSION_KEY_FOR_2FA_LOGIN_IS_REMEMBER', '2FA_LOGIN_IS_REMEMBER');
define('BX_ACCOUNT_SESSION_KEY_FOR_PHONE_ACTIVATEION_CODE', 'PHONE_ACTIVATEION_CODE');
define('BX_ACCOUNT_CONFIRMATION_NONE', 'none');
define('BX_ACCOUNT_CONFIRMATION_EMAIL', 'email');
define('BX_ACCOUNT_CONFIRMATION_PHONE', 'phone');
define('BX_ACCOUNT_CONFIRMATION_EMAIL_PHONE', 'email_and_phone');
define('BX_ACCOUNT_CONFIRMATION_EMAIL_OR_PHONE', 'email_or_phone');

//--- Template settings ---//
define('BX_DOL_TEMPLATE_CODE_KEY', 'skin');
define('BX_DOL_TEMPLATE_MIX_KEY', 'mix');
define('BX_DOL_TEMPLATE_DEFAULT_CODE', 'protean');
define('BX_DOL_TEMPLATE_FOLDER_ROOT', 'template');

define('BX_DOL_STUDIO_TEMPLATE_CODE_KEY', 'sskin');
define('BX_DOL_STUDIO_TEMPLATE_DEFAULT_CODE', 'protean');

// needed for BxDolStorageS3v4alt
if (!defined('AKEEBAENGINE'))
    define('AKEEBAENGINE', 1);

//--- Include files needed for basic functionality ---//
require_once(BX_DIRECTORY_PATH_CLASSES . 'BxDol.php');
require_once(BX_DIRECTORY_PATH_INC . 'utils.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'version.inc.php');

spl_autoload_register('bx_autoload');
require BX_DIRECTORY_PATH_PLUGINS . 'autoload.php';

BxDolDb::getInstance()->cacheParams();

require_once(BX_DIRECTORY_PATH_INC . 'profiles.inc.php');

bx_check_maintenance_mode_soft();

$o = new BxDolAlerts('system', 'begin', 0);
$o->alert();

check_logged();

/** @} */
