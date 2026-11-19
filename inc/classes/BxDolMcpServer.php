<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * The site's MCP server (Model Context Protocol, protocol 2026-07-28) at /api/mcp: one JSON-RPC
 * message per HTTP POST, answered as application/json (api_mcp.php).
 *
 * A request is signed in with `Authorization: Bearer <token>`: a personal access token
 * (BxDolApiTokens, account settings > Connectors) or an OAuth access token with the `api` scope,
 * as for API v2 (BxDolApiV2Auth). Every tool acts as that account's current profile, so the site's
 * own permission checks decide what it may do.
 *
 * Tools:
 * - every API v2 operation (BxDolApiV2Router), named by its operationId and run through
 *   BxDolApiV2Router::dispatch() with its rate limit and its checks: what any member may do with
 *   their own content. Uploads and streamed answers are left out;
 * - the agent tools (sys_agents_tools) switched on in Studio > Agents > Tools, apart from whether agents
 *   have them, and only those whose code allows it (BxDolAIToolFactory::isMcpAllowed()): for every member
 *   those with `mcp_members`, which only a tool made for it can have (BxDolAITool::isMemberSafe()):
 *   it then runs in the member's scope (BxDolAITool::setMemberScope()), acting as the member with
 *   the site's permission checks; for an operator (isAdmin(), with the Studio role action `use mcp`)
 *   also those with `mcp`, which act on
 *   the whole site, each call logged.
 */
class BxDolMcpServer
{
    const PROTOCOL_VERSION = '2026-07-28';
    const SERVER_NAME = 'una';
    const SERVER_VERSION = '1.0.0';

    /** The Studio role action (Studio > Roles) that lets an operator use the operator tools. */
    const ROLE_ACTION = 'use mcp';

    /** Largest request body, bytes. */
    const BODY_MAX = 1048576;

    const JSONRPC_PARSE_ERROR = -32700;
    const JSONRPC_INVALID_REQUEST = -32600;
    const JSONRPC_METHOD_NOT_FOUND = -32601;
    const JSONRPC_INVALID_PARAMS = -32602;
    const JSONRPC_INTERNAL_ERROR = -32603;
    const MCP_UNSUPPORTED_PROTOCOL_VERSION = -32022;

    protected $_oAuth;
    protected $_oRouter;
    protected $_aTools = null;

    public function __construct(BxDolApiV2Auth $oAuth, ?BxDolApiV2Router $oRouter = null)
    {
        $this->_oAuth = $oAuth;
        $this->_oRouter = $oRouter ?: new BxDolApiV2Router();
    }

    /**
     * Answer the current HTTP request.
     */
    public static function serve()
    {
        $sMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        BxDolApiV2Router::takeRequest();

        if ($sMethod !== 'POST') {
            self::_emit(405, ['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => self::JSONRPC_INVALID_REQUEST, 'message' => 'Send JSON-RPC messages with POST']], ['Allow' => 'POST']);
            return;
        }

        if (!getParam('sys_api_enable') || !getParam(BxDolApiV2Router::OPTION_ENABLE)) {
            self::_emit(503, self::_error(null, self::JSONRPC_INTERNAL_ERROR, 'The API is turned off on this site (an administrator turns API v2 on in Studio > API > Settings)'));
            return;
        }

        bx_is_api_v2(true);

        try {
            $oAuth = BxDolApiV2Auth::fromRequest('POST');
        }
        catch (BxDolApiV2Problem $e) {
            self::_emit($e->getStatus(), self::_error(null, self::JSONRPC_INVALID_REQUEST, $e->getMessage()), $e->getHeaders());
            return;
        }

        // a token only: the site's session cookie is for the site's own pages
        if ($oAuth->getMode() !== BxDolApiV2Auth::MODE_TOKEN || !$oAuth->getProfileId()) {
            self::_emit(401, self::_error(null, self::JSONRPC_INVALID_REQUEST, 'Send a personal access token (account settings > Connectors) as "Authorization: Bearer <token>"'), ['WWW-Authenticate' => 'Bearer realm="mcp"']);
            return;
        }

        $sRaw = (string)file_get_contents('php://input', false, null, 0, self::BODY_MAX + 1);
        if (strlen($sRaw) > self::BODY_MAX) {
            self::_emit(413, self::_error(null, self::JSONRPC_INVALID_REQUEST, 'The message is too large'));
            return;
        }

        try {
            $mMessage = json_decode($sRaw, false, 64, JSON_THROW_ON_ERROR);
        }
        catch (JsonException $e) {
            self::_emit(400, self::_error(null, self::JSONRPC_PARSE_ERROR, 'Parse error'));
            return;
        }

        $aAnswer = (new static($oAuth))->handle($mMessage);
        if ($aAnswer === null) {
            // a notification: nothing to answer
            http_response_code(202);
            return;
        }

        self::_emit(200, $aAnswer);
    }

    /**
     * One JSON-RPC message, decoded with objects as stdClass.
     * @return array|null the answer, null for a notification
     */
    public function handle($mMessage)
    {
        if (!is_object($mMessage))
            return self::_error(null, self::JSONRPC_INVALID_REQUEST, 'Invalid Request');

        $bHasId = property_exists($mMessage, 'id');
        $mId = $bHasId ? $mMessage->id : null;
        $bValidId = is_string($mId) || is_int($mId);
        if (!$bHasId)
            return null;

        $sMethod = $mMessage->method ?? null;
        if (!$bValidId || ($mMessage->jsonrpc ?? null) !== '2.0' || !is_string($sMethod) || $sMethod === '')
            return self::_error($bValidId ? $mId : null, self::JSONRPC_INVALID_REQUEST, 'Invalid Request');

        if (isset($mMessage->params) && !is_object($mMessage->params))
            return self::_error($mId, self::JSONRPC_INVALID_PARAMS, 'Invalid params');
        $oParams = $mMessage->params ?? new stdClass();

        if ($sMethod === 'ping')
            return self::_result($mId, new stdClass());

        if (($aProtocolError = self::protocolError($oParams)) !== null)
            return self::_error($mId, $aProtocolError[0], $aProtocolError[1], $aProtocolError[2]);

        switch ($sMethod) {
            case 'server/discover':
                return self::_result($mId, [
                    'supportedVersions' => [self::PROTOCOL_VERSION],
                    'capabilities' => [
                        'tools' => ['listChanged' => false],
                    ],
                    'serverInfo' => ['name' => self::SERVER_NAME, 'title' => getParam('site_title'), 'version' => self::SERVER_VERSION],
                    'instructions' => $this->_instructions(),
                    'ttlMs' => 3600000,
                    'cacheScope' => 'private',
                ]);

            case 'tools/list':
                if (isset($oParams->cursor) && $oParams->cursor !== '') {
                    if (!is_string($oParams->cursor))
                        return self::_error($mId, self::JSONRPC_INVALID_PARAMS, 'Invalid params: cursor must be a string');
                    return self::_result($mId, ['tools' => [], 'ttlMs' => 3600000, 'cacheScope' => 'private']);
                }
                return self::_result($mId, [
                    'tools' => array_values(array_map(function ($a) {
                        return $a['tool'];
                    }, $this->getTools())),
                    'ttlMs' => 3600000,
                    'cacheScope' => 'private',
                ]);

            case 'tools/call':
                if (!isset($oParams->name) || !is_string($oParams->name) || $oParams->name === '')
                    return self::_error($mId, self::JSONRPC_INVALID_PARAMS, 'Invalid params: tool name is required');
                if (isset($oParams->arguments) && !is_object($oParams->arguments))
                    return self::_error($mId, self::JSONRPC_INVALID_PARAMS, 'Invalid params: arguments must be an object');

                $aTools = $this->getTools();
                if (!isset($aTools[$oParams->name]))
                    return self::_error($mId, self::JSONRPC_INVALID_PARAMS, 'Unknown tool: ' . $oParams->name);

                $aArgs = isset($oParams->arguments) ? json_decode(json_encode($oParams->arguments), true) : [];
                return self::_result($mId, $this->callTool($aTools[$oParams->name], is_array($aArgs) ? $aArgs : []));
        }

        return self::_error($mId, self::JSONRPC_METHOD_NOT_FOUND, 'Method not found');
    }

    /**
     * @return array{0: int, 1: string, 2: ?array}|null
     */
    public static function protocolError($oParams)
    {
        if (!isset($oParams->_meta) || !is_object($oParams->_meta))
            return [self::JSONRPC_INVALID_PARAMS, 'Invalid params: _meta is required', null];

        $oMeta = $oParams->_meta;
        $sVersion = $oMeta->{'io.modelcontextprotocol/protocolVersion'} ?? null;
        if (!is_string($sVersion) || $sVersion === '')
            return [self::JSONRPC_INVALID_PARAMS, 'Invalid params: protocol version is required', null];
        if ($sVersion !== self::PROTOCOL_VERSION)
            return [self::MCP_UNSUPPORTED_PROTOCOL_VERSION, 'Unsupported protocol version', [
                'supported' => [self::PROTOCOL_VERSION],
                'requested' => $sVersion,
            ]];

        if (!isset($oMeta->{'io.modelcontextprotocol/clientCapabilities'}) || !is_object($oMeta->{'io.modelcontextprotocol/clientCapabilities'}))
            return [self::JSONRPC_INVALID_PARAMS, 'Invalid params: client capabilities are required', null];

        return null;
    }

    /**
     * Whether the signed-in account gets the operator's tools.
     */
    public function isOperator()
    {
        if ($this->_oAuth->getProfileId() <= 0 || !isAdmin())
            return false;

        // the Studio role's action (Studio > Roles), as the operator's other apps are; every role has it as installed
        $oProfile = BxDolProfile::getInstance($this->_oAuth->getProfileId());
        return $oProfile && BxDolStudioRolesUtils::getInstance()->isActionAllowed(self::ROLE_ACTION, (int)$oProfile->getAccountId());
    }

    /**
     * The tools of the signed-in account: name => ['tool' => its MCP description, 'kind' => 'api'|'operator'|'member', ...].
     * A name is given once: an API v2 operation first, then an operator's tool, then a member's.
     */
    public function getTools()
    {
        if ($this->_aTools !== null)
            return $this->_aTools;

        $aTools = $this->_apiTools();
        foreach ($this->isOperator() ? ['operator', 'member'] : ['member'] as $sKind)
            foreach ($this->_agentTools($sKind) as $sName => $a)
                if (!isset($aTools[$sName]))
                    $aTools[$sName] = $a;

        return $this->_aTools = $aTools;
    }

    /**
     * Run a tool of getTools() with its arguments.
     * @return array a CallToolResult
     */
    public function callTool(array $aTool, array $aArgs)
    {
        try {
            return $aTool['kind'] === 'api' ? $this->_callApiTool($aTool, $aArgs) : $this->_callAgentTool($aTool, $aArgs);
        }
        catch (BxDolApiV2Problem $e) {
            $aProblem = $e->toArray();
            return self::toolError(($aProblem['detail'] ?? $aProblem['title']) . ' (' . $aProblem['code'] . ')', $aProblem);
        }
        catch (Throwable $e) {
            bx_log('sys_agents', 'MCP tool ' . $aTool['tool']['name'] . ' failed: ' . get_class($e) . ': ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine(), BX_LOG_ERR);
            return self::toolError($aTool['kind'] === 'api' ? 'Something went wrong on the server' : $e->getMessage());
        }
    }

    public static function toolError($sMessage, $aStructured = null)
    {
        $a = [
            'content' => [['type' => 'text', 'text' => (string)$sMessage]],
            'isError' => true,
        ];
        if (is_array($aStructured) && $aStructured)
            $a['structuredContent'] = $aStructured;
        return $a;
    }

    protected function _instructions()
    {
        $a = [
            'Tools of the community site ' . getParam('site_title') . ' (' . BX_DOL_URL_ROOT . '). They act as the signed-in member, with the permissions that member has on the site.',
            'Most tools are API v2 operations, named by their operationId: path params and query params are arguments of their own, a JSON request body is the `body` argument, and lists are paged with `cursor` (the `next_cursor` of the previous page) and `limit`.',
        ];
        $a[] = 'Tools with snake_case names (such as content_search or comments_add) are the site\'s agent tools that its operators made available here.';
        if ($this->isOperator())
            $a[] = 'As an operator you also have operator tools, which act on the whole site (such as mysql_select_query): confirm a change with the person before you make it, and prefer dry_run where a tool has one.';

        return implode("\n\n", $a);
    }

    protected function _apiTools()
    {
        $aSchemas = $this->_oRouter->getSchemas();

        $aTools = [];
        foreach ($this->_oRouter->getOperations() as $aOp) {
            $oOp = $aOp['attr'];
            if ($oOp->body !== null && str_starts_with($oOp->body, 'multipart:'))
                continue;
            $bStream = false;
            foreach ($oOp->responses as $mSchema)
                if (is_string($mSchema) && str_starts_with($mSchema, 'sse:'))
                    $bStream = true;
            if ($bStream)
                continue;

            $aProperties = [];
            $aRequired = [];
            $aPath = [];
            if (preg_match_all('/\{([a-z_]+)\}/', $oOp->path, $m))
                foreach ($m[1] as $sName) {
                    $aParam = $oOp->params[$sName] ?? [];
                    $aSchema = self::_schema($aParam['schema'] ?? ['$ref' => '#/components/schemas/Id'], $aSchemas, ['type' => 'string']);
                    $aProperties[$sName] = self::_described($aSchema, $aParam['description'] ?? '');
                    $aRequired[] = $sName;
                    $aPath[] = $sName;
                }

            $aQuery = [];
            foreach ($oOp->params as $sName => $aParam) {
                if (!is_array($aParam) || ($aParam['in'] ?? 'query') !== 'query' || isset($aProperties[$sName]))
                    continue;
                $aSchema = self::_schema($aParam['schema'] ?? ['type' => 'string'], $aSchemas, ['type' => 'string']);
                $aProperties[$sName] = self::_described($aSchema, $aParam['description'] ?? '');
                if (!empty($aParam['required']))
                    $aRequired[] = $sName;
                $aQuery[] = $sName;
            }

            if ($oOp->paged) {
                $aProperties['cursor'] = ['type' => 'string', 'description' => '`next_cursor` of the previous page'];
                $aProperties['limit'] = ['type' => 'integer', 'minimum' => 1, 'maximum' => BxDolApiV2Request::LIMIT_MAX, 'description' => 'Items per page'];
                $aQuery[] = 'cursor';
                $aQuery[] = 'limit';
            }

            $bBody = $oOp->body !== null && in_array($oOp->method, ['POST', 'PUT', 'PATCH'], true);
            if ($bBody) {
                $aProperties['body'] = self::_described(self::_schema(['$ref' => '#/components/schemas/' . $oOp->body], $aSchemas, ['type' => 'object']), 'The request body (' . $oOp->body . ')');
                if ($oOp->bodyRequired)
                    $aRequired[] = 'body';
            }

            $sMethod = $oOp->method;
            $aTools[$oOp->id] = [
                'kind' => 'api',
                'op' => $oOp->id,
                'path' => $aPath,
                'query' => $aQuery,
                'body' => $bBody,
                'tool' => [
                    'name' => $oOp->id,
                    'title' => $oOp->summary,
                    'description' => trim($oOp->summary . ($oOp->description !== '' ? "\n\n" . $oOp->description : '') . "\n\n" . $sMethod . ' /api/v2' . $oOp->path),
                    'inputSchema' => [
                        'type' => 'object',
                        'properties' => $aProperties ?: new stdClass(),
                        'required' => array_values(array_unique($aRequired)),
                    ],
                    'annotations' => [
                        'title' => $oOp->summary,
                        'readOnlyHint' => in_array($sMethod, ['GET', 'HEAD'], true),
                        'destructiveHint' => $sMethod === 'DELETE',
                        'idempotentHint' => in_array($sMethod, ['GET', 'HEAD', 'PUT', 'DELETE'], true),
                        'openWorldHint' => false,
                    ],
                ],
            ];
        }

        return $aTools;
    }

    protected function _callApiTool(array $aTool, array $aArgs)
    {
        $aOp = $this->_oRouter->findOperation($aTool['op']);
        if (!$aOp)
            return self::toolError('This tool is no longer available');

        $aPath = [];
        foreach ($aTool['path'] as $sName)
            if (isset($aArgs[$sName]) && is_scalar($aArgs[$sName]))
                $aPath[$sName] = (string)$aArgs[$sName];

        $aQuery = [];
        foreach ($aTool['query'] as $sName) {
            if (!isset($aArgs[$sName]))
                continue;
            if (is_bool($aArgs[$sName]))
                $aQuery[$sName] = $aArgs[$sName] ? 'true' : 'false';
            elseif (is_scalar($aArgs[$sName]))
                $aQuery[$sName] = (string)$aArgs[$sName];
            else
                return self::toolError('"' . $sName . '" takes one value');
        }

        $oResponse = $this->_oRouter->dispatch($aOp, $aPath, $aQuery, $aTool['body'] ? ($aArgs['body'] ?? null) : null, $this->_oAuth);
        if ($oResponse->fStream)
            return self::toolError('This operation streams its answer, which an MCP tool can\'t pass on');

        if ($oResponse->iStatus >= 400)
            return self::toolError('HTTP ' . $oResponse->iStatus, is_array($oResponse->mBody) ? $oResponse->mBody : null);

        if ($oResponse->mBody === null || $oResponse->mBody === '')
            return ['content' => [['type' => 'text', 'text' => 'Done (HTTP ' . $oResponse->iStatus . ')']], 'isError' => false];

        $a = [
            'content' => [['type' => 'text', 'text' => json_encode($oResponse->mBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE)]],
            'isError' => false,
        ];
        // structured content is an object: a list is not one
        if (is_array($oResponse->mBody) && $oResponse->mBody && !array_is_list($oResponse->mBody))
            $a['structuredContent'] = $oResponse->mBody;
        return $a;
    }

    /**
     * The agent tools of a kind: 'operator' (switched on for operators, `mcp`) or 'member' (switched on for every
     * member, `mcp_members`, and made for it). A member's tool leaves out the arguments that name who acts.
     */
    protected function _agentTools($sKind)
    {
        $bMember = $sKind === 'member';

        $aTools = [];
        foreach ((new BxDolAiQuery())->getMcpTools($bMember ? 'mcp_members' : 'mcp') as $aRow) {
            if (!BxDolAIToolFactory::isMcpAllowed($aRow) || ($bMember && !self::isMemberSafeTool($aRow)))
                continue;

            try {
                $oTool = BxDolAIToolFactory::getToolInstance((int)$aRow['id']);
                $sName = $oTool->getName();
                $aSchema = $oTool->getInputSchema();
            }
            catch (Throwable $e) {
                bx_log('sys_agents', 'MCP: tool ' . $aRow['id'] . ' could not be loaded: ' . $e->getMessage(), BX_LOG_ERR);
                continue;
            }

            if ($sName === '' || isset($aTools[$sName]))
                continue;

            $aScoped = $bMember && $oTool instanceof BxDolAITool ? $oTool::memberScopedArgs() : [];
            $aProperties = is_array($aSchema['properties'] ?? null) ? $aSchema['properties'] : [];
            foreach ($aScoped as $sArg)
                unset($aProperties[$sArg]);
            $aSchema['properties'] = $aProperties ?: new stdClass();
            $aSchema['required'] = array_values(array_diff($aSchema['required'] ?? [], $aScoped));

            $sTitle = (string)($aRow['title'] ?? $sName);
            $aTools[$sName] = [
                'kind' => $sKind,
                'id' => (int)$aRow['id'],
                'scoped' => $aScoped,
                'tool' => [
                    'name' => $sName,
                    'title' => $sTitle,
                    'description' => trim((string)$oTool->getDescription() . "\n\n" . ($bMember ? 'Acts as you, with your permissions on the site.' : 'Operator tool: acts on the whole site.')),
                    'inputSchema' => $aSchema,
                    'annotations' => [
                        'title' => $sTitle,
                        'readOnlyHint' => in_array($aRow['type'], ['mysql_schema', 'mysql_select', 'content_structure', 'content_get', 'content_search', 'comments_get', 'comment_get'], true),
                        'destructiveHint' => !in_array($aRow['type'], ['content_add', 'comments_add'], true),
                        'idempotentHint' => false,
                        'openWorldHint' => in_array($aRow['type'], ['tavily_web_search', 'tavily_extract', 'jina_web_search', 'jina_url_reader'], true),
                    ],
                ],
            ];
        }

        return $aTools;
    }

    /**
     * Whether a row of sys_agents_tools may be given to members: a UNA tool class made for it (BxDolAITool::isMemberSafe()).
     */
    public static function isMemberSafeTool(array $aRow)
    {
        $sClass = (string)($aRow['class_name'] ?? '');
        if ($sClass === '')
            return false;

        if (!empty($aRow['class_file']) && is_file(BX_DIRECTORY_PATH_ROOT . $aRow['class_file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aRow['class_file']);

        return class_exists($sClass) && is_subclass_of($sClass, 'BxDolAITool') && $sClass::isMemberSafe();
    }

    protected function _callAgentTool(array $aTool, array $aArgs)
    {
        $bOperator = $aTool['kind'] === 'operator';

        // checked again: the list of tools may be older than a change of the account's role
        if ($bOperator && !$this->isOperator())
            return self::toolError(_t('_sys_txt_access_denied'));

        if ($bOperator)
            bx_log('sys_agents', 'MCP operator tool ' . $aTool['tool']['name'] . ' by profile ' . $this->_oAuth->getProfileId() . ': ' . json_encode($aArgs, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE), BX_LOG_INFO);

        // a member acts as themselves, whatever the arguments say
        foreach ($aTool['scoped'] ?? [] as $sArg)
            $aArgs[$sArg] = $this->_oAuth->getProfileId();

        BxDolAITool::setMemberScope($bOperator ? 0 : $this->_oAuth->getProfileId());
        try {
            $oTool = clone BxDolAIToolFactory::getToolInstance($aTool['id']);
            $oTool->setInputs($aArgs);
            $oTool->execute();
            $mResult = $oTool->getResult();
        }
        finally {
            BxDolAITool::setMemberScope(0);
        }

        if ($mResult instanceof NeuronAI\Tools\ToolOutput)
            return ['content' => [['type' => 'text', 'text' => $mResult->getText()]], 'isError' => $mResult->isError()];

        $sResult = (string)$mResult;
        $m = json_decode($sResult, true);
        // the tools answer a refusal as {"code": 403, ...}
        $bError = is_array($m) && isset($m['code']) && is_numeric($m['code']) && (int)$m['code'] >= 400;
        $a = ['content' => [['type' => 'text', 'text' => $sResult]], 'isError' => $bError];
        if (is_array($m) && $m && !array_is_list($m))
            $a['structuredContent'] = $m;
        return $a;
    }

    /**
     * An API v2 schema as one an MCP client reads: its references replaced by what they name, or
     * $aFallback when that can't be done (a schema that refers to itself).
     */
    protected static function _schema(array $aSchema, array $aSchemas, array $aFallback)
    {
        $a = BxDolApiV2Router::inlineSchema($aSchema, $aSchemas);
        return is_array($a) && $a ? $a : $aFallback;
    }

    protected static function _described(array $aSchema, $sDescription)
    {
        if ($sDescription !== '' && empty($aSchema['description']))
            $aSchema['description'] = $sDescription;
        return $aSchema;
    }

    protected static function _result($mId, $mResult)
    {
        return ['jsonrpc' => '2.0', 'id' => $mId, 'result' => $mResult];
    }

    protected static function _error($mId, $iCode, $sMessage, $aData = null)
    {
        $aError = ['code' => $iCode, 'message' => $sMessage];
        if ($aData !== null)
            $aError['data'] = $aData;
        return ['jsonrpc' => '2.0', 'id' => $mId, 'error' => $aError];
    }

    protected static function _emit($iStatus, array $aBody, array $aHeaders = [])
    {
        http_response_code((int)$iStatus);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        foreach ($aHeaders as $sName => $sValue)
            header($sName . ': ' . $sValue);
        echo json_encode($aBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    }
}

/** @} */
