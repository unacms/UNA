<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * MCP server front controller: /api/mcp, and the OAuth discovery documents MCP clients read
 * (/.well-known/oauth-protected-resource, /.well-known/oauth-authorization-server), are rewritten
 * here (.htaccess, scripts/Caddyfile, scripts/docker-compose/nginx.conf). See BxDolMcpServer.
 */

// Answers are JSON-RPC only: a PHP notice printed into one would break every client.
ini_set('display_errors', '0');

// /.well-known/oauth-protected-resource and /.well-known/oauth-authorization-server are rewritten here with _wk
$sMcpWellKnown = isset($_GET['_wk']) && is_string($_GET['_wk']) ? $_GET['_wk'] : '';
unset($_GET['_wk'], $_GET['api'], $_POST['api'], $_REQUEST['api']);

require_once('./inc/header.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'profiles.inc.php');
require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

ini_set('display_errors', '0');

bx_import('BxDolLanguages');

if ($sMcpWellKnown !== '')
    BxDolMcpServer::serveWellKnown($sMcpWellKnown);
else
    BxDolMcpServer::serve();
