<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * API v2 front controller: /api/v2/<path> is rewritten here as ?_q=<path>
 * (.htaccess, scripts/docker-compose/nginx.conf). See BxDolApiV2Router.
 */

// Responses are JSON only: a PHP notice printed into one would break every client.
ini_set('display_errors', '0');

$sApiV2Path = isset($_GET['_q']) && is_string($_GET['_q']) ? $_GET['_q'] : '';
unset($_GET['_q']);
// `api` puts the site in its own API mode (bx_is_api), where transcoders link the original
// uploads instead of their display copies: v2 has no such switch, so it is no request's to set.
unset($_GET['api'], $_POST['api'], $_REQUEST['api']);

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'profiles.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

ini_set('display_errors', '0');

bx_import('BxDolLanguages');

(new BxDolApiV2Router())->run($sApiV2Path);
