<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

bx_import('BxDolLanguages');

BxDolRequest::processAsAction($GLOBALS['aModule'], $GLOBALS['aRequest']);

/** @} */
