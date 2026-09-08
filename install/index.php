<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaInstall UNA Install
 * @{
 */

define ('BX_DOL_INSTALL',  true);
define ('BX_SKIP_INSTALL_CHECK', true);

define ('BX_DOL_VER', '15.0.0-RC1');

define ('BX_INSTALL_DEFAULT_LANGUAGE', 'en');

define ('BX_INSTALL_URL_ROOT', '../');
define ('BX_INSTALL_URL_MODULES', BX_INSTALL_URL_ROOT . 'modules/');

$aPathInfo = pathinfo(__FILE__);
define ('BX_INSTALL_DIR', $aPathInfo['dirname'] . '/');
define ('BX_INSTALL_DIR_ROOT', BX_INSTALL_DIR . '../');
define ('BX_INSTALL_DIR_MODULES', BX_INSTALL_DIR_ROOT . 'modules/');
define ('BX_INSTALL_DIR_PLUGINS', BX_INSTALL_DIR_ROOT . 'plugins/');
define ('BX_INSTALL_DIR_TEMPLATES', BX_INSTALL_DIR . 'templates/');
define ('BX_INSTALL_DIR_CLASSES', BX_INSTALL_DIR . 'classes/');

define ('BX_INSTALL_PATH_HEADER', BX_INSTALL_DIR_ROOT . 'inc/header.inc.php');

if (!defined('BX_DOL_MODULE_TYPE_MODULE')) {
    define('BX_DOL_MODULE_TYPE_MODULE', 'module');
    define('BX_DOL_MODULE_TYPE_LANGUAGE', 'language');
    define('BX_DOL_MODULE_TYPE_TEMPLATE', 'template');
}

// needed for BxDolStorageS3v4alt
if (!defined('AKEEBAENGINE'))
    define('AKEEBAENGINE', 1);

require_once(BX_INSTALL_DIR_ROOT . 'inc/utils.inc.php');
require_once(BX_INSTALL_DIR_ROOT . 'inc/classes/BxDol.php');
require_once(BX_INSTALL_DIR_ROOT . 'inc/classes/BxDolFactory.php');
require_once(BX_INSTALL_DIR_ROOT . 'inc/classes/BxDolIO.php');
require_once(BX_INSTALL_DIR_ROOT . 'inc/classes/BxDolDb.php');
require_once(BX_INSTALL_DIR_ROOT . 'inc/classes/BxDolXmlParser.php');
require_once(BX_INSTALL_DIR_ROOT . 'template/scripts/BxBaseConfig.php');
require_once(BX_INSTALL_DIR_ROOT . 'studio/classes/BxDolStudioTools.php');
require_once(BX_INSTALL_DIR_ROOT . 'studio/classes/BxDolStudioToolsAudit.php');

require_once(BX_INSTALL_DIR_CLASSES . 'BxDolInstallController.php');
require_once(BX_INSTALL_DIR_CLASSES . 'BxDolInstallView.php');
require_once(BX_INSTALL_DIR_CLASSES . 'BxDolInstallModulesTools.php');
require_once(BX_INSTALL_DIR_CLASSES . 'BxDolInstallLang.php');
require_once(BX_INSTALL_DIR_CLASSES . 'BxDolInstallSiteConfig.php');

require BX_INSTALL_DIR_PLUGINS . 'autoload.php';

$oController = new BxDolInstallController ();
$oController->run(isset($_REQUEST['action']) ? $_REQUEST['action'] : '');

/** @} */
