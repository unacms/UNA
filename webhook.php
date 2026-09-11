<?php

define('BX_API', true);

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . "profiles.inc.php");
require_once(BX_DIRECTORY_PATH_INC . "design.inc.php");

bx_import('BxDolLanguages');

BxDolAiTrigger::getInstance('webhook')->handle();
