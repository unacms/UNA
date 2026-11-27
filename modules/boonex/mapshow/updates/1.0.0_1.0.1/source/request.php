<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    MapShow Display last sign up users on map
* @ingroup     UnaModules
*
* @{
*/

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

check_logged();

BxBaseModTextRequest::processAsAction($GLOBALS['aModule'], $GLOBALS['aRequest']);

/** @} */
