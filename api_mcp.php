<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MCP server front controller: /api/mcp is rewritten here (.htaccess, scripts/Caddyfile,
 * scripts/docker-compose/nginx.conf). See BxDolMcpServer.
 */

// Answers are JSON-RPC only: a PHP notice printed into one would break every client.
ini_set('display_errors', '0');

unset($_GET['api'], $_POST['api'], $_REQUEST['api']);

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'profiles.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

ini_set('display_errors', '0');

bx_import('BxDolLanguages');

BxDolMcpServer::serve();
