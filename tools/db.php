<?php
/**
 * UNA database MCP server (stdio, protocol 2026-07-28).
 *
 * Credentials come from inc/header.inc.php. The rest of UNA is not loaded.
 * Messages are one JSON-RPC object per line on stdin. Responses are one
 * JSON-RPC object per line on stdout. Logs go to stderr.
 *
 *   docker compose exec -T -w /opt/una php php tools/db.php <<'EOF'
 *   {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"query","arguments":{"sql":"SELECT 1"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}
 *   EOF
 */

if (PHP_SAPI !== 'cli')
    exit(1);

const MCP_PROTOCOL_VERSION = '2026-07-28';
const MCP_SERVER_NAME = 'una-db';
const MCP_SERVER_VERSION = '1.0.0';

const JSONRPC_PARSE_ERROR = -32700;
const JSONRPC_INVALID_REQUEST = -32600;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_PARAMS = -32602;
const MCP_UNSUPPORTED_PROTOCOL_VERSION = -32022;

if (isset($argv[1])) {
    fwrite(STDERR, usage());
    exit($argv[1] === '--help' || $argv[1] === '-h' ? 0 : 2);
}

if (stream_isatty(STDIN))
    fwrite(STDERR, "una-db MCP server (" . MCP_PROTOCOL_VERSION . "), reading JSON-RPC from stdin\n");

while (($sLine = fgets(STDIN)) !== false) {
    $sLine = rtrim($sLine, "\r\n");
    if ($sLine === '')
        continue;
    handleLine($sLine);
}

exit(0);

function handleLine(string $sLine): void
{
    try {
        $mixed = json_decode($sLine, false, 512, JSON_THROW_ON_ERROR);
    }
    catch (JsonException $oException) {
        writeError(null, JSONRPC_PARSE_ERROR, 'Parse error');
        return;
    }

    if (!is_object($mixed)) {
        writeError(null, JSONRPC_INVALID_REQUEST, 'Invalid Request');
        return;
    }

    $bHasId = property_exists($mixed, 'id');
    $mId = $bHasId ? $mixed->id : null;
    $bValidId = is_string($mId) || is_int($mId);
    if (!$bHasId)
        return;

    $sMethod = $mixed->method ?? null;
    if (!$bValidId || ($mixed->jsonrpc ?? null) !== '2.0' || !is_string($sMethod) || $sMethod === '') {
        writeError($bValidId ? $mId : null, JSONRPC_INVALID_REQUEST, 'Invalid Request');
        return;
    }

    if (isset($mixed->params) && !is_object($mixed->params)) {
        writeError($mId, JSONRPC_INVALID_PARAMS, 'Invalid params');
        return;
    }
    $oParams = $mixed->params ?? new stdClass();

    $aProtocolError = protocolError($oParams);
    if ($aProtocolError !== null) {
        writeError($mId, $aProtocolError[0], $aProtocolError[1], $aProtocolError[2]);
        return;
    }

    switch ($sMethod) {
        case 'server/discover':
            writeResult($mId, [
                'supportedVersions' => [MCP_PROTOCOL_VERSION],
                'capabilities' => [
                    'tools' => ['listChanged' => false],
                ],
                'instructions' => 'Run SQL on the installed UNA database with the query tool. Statements execute on the live database for this instance.',
                'ttlMs' => 86400000,
                'cacheScope' => 'public',
            ]);
            return;

        case 'tools/list':
            if (isset($oParams->cursor) && $oParams->cursor !== '') {
                if (!is_string($oParams->cursor)) {
                    writeError($mId, JSONRPC_INVALID_PARAMS, 'Invalid params: cursor must be a string');
                    return;
                }
                writeResult($mId, [
                    'tools' => [],
                    'ttlMs' => 86400000,
                    'cacheScope' => 'public',
                ]);
                return;
            }
            writeResult($mId, [
                'tools' => [queryTool()],
                'ttlMs' => 86400000,
                'cacheScope' => 'public',
            ]);
            return;

        case 'tools/call':
            $aCall = callTool($oParams);
            if (isset($aCall['error'])) {
                writeError($mId, $aCall['error'][0], $aCall['error'][1]);
                return;
            }
            writeResult($mId, $aCall['result']);
            return;

        default:
            writeError($mId, JSONRPC_METHOD_NOT_FOUND, 'Method not found');
    }
}

/**
 * @return array{0: int, 1: string, 2: ?array}|null
 */
function protocolError(object $oParams): ?array
{
    if (!isset($oParams->_meta) || !is_object($oParams->_meta))
        return [JSONRPC_INVALID_PARAMS, 'Invalid params: _meta is required', null];

    $oMeta = $oParams->_meta;
    $sVersion = $oMeta->{'io.modelcontextprotocol/protocolVersion'} ?? null;
    if (!is_string($sVersion) || $sVersion === '')
        return [JSONRPC_INVALID_PARAMS, 'Invalid params: protocol version is required', null];
    if ($sVersion !== MCP_PROTOCOL_VERSION) {
        return [MCP_UNSUPPORTED_PROTOCOL_VERSION, 'Unsupported protocol version', [
            'supported' => [MCP_PROTOCOL_VERSION],
            'requested' => $sVersion,
        ]];
    }

    $mCapabilities = $oMeta->{'io.modelcontextprotocol/clientCapabilities'} ?? null;
    if (!is_object($mCapabilities))
        return [JSONRPC_INVALID_PARAMS, 'Invalid params: client capabilities are required', null];

    return null;
}

function queryTool(): array
{
    return [
        'name' => 'query',
        'title' => 'Query UNA database',
        'description' => 'Run SQL against the installed UNA database. Several statements separated by semicolons are allowed. The statement runs on the live database for this instance.',
        'inputSchema' => [
            'type' => 'object',
            'properties' => [
                'sql' => [
                    'type' => 'string',
                    'description' => 'SQL to execute.',
                ],
            ],
            'required' => ['sql'],
            'additionalProperties' => false,
        ],
        'outputSchema' => [
            'type' => 'object',
            'properties' => [
                'results' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'columns' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                            ],
                            'rows' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'array',
                                    'items' => ['type' => ['string', 'null']],
                                ],
                            ],
                            'affected' => ['type' => 'integer'],
                        ],
                    ],
                ],
            ],
            'required' => ['results'],
        ],
        'annotations' => [
            'title' => 'Query UNA database',
            'readOnlyHint' => false,
            'destructiveHint' => true,
            'idempotentHint' => false,
            'openWorldHint' => false,
        ],
    ];
}

/**
 * @return array{error: array{0: int, 1: string}}|array{result: array}
 */
function callTool(object $oParams): array
{
    if (!isset($oParams->name) || !is_string($oParams->name) || $oParams->name === '')
        return ['error' => [JSONRPC_INVALID_PARAMS, 'Invalid params: tool name is required']];
    if ($oParams->name !== 'query')
        return ['error' => [JSONRPC_INVALID_PARAMS, 'Unknown tool: ' . $oParams->name]];
    if (isset($oParams->arguments) && !is_object($oParams->arguments))
        return ['error' => [JSONRPC_INVALID_PARAMS, 'Invalid params: arguments must be an object']];

    $mSql = isset($oParams->arguments) ? ($oParams->arguments->sql ?? null) : null;
    if (!is_string($mSql) || trim($mSql) === '') {
        return ['result' => toolError('sql must be a non-empty string')];
    }

    try {
        $aResults = runSql($mSql);
    }
    catch (RuntimeException $oException) {
        return ['result' => toolError($oException->getMessage())];
    }

    return ['result' => [
        'content' => [[
            'type' => 'text',
            'text' => formatResults($aResults),
        ]],
        'structuredContent' => ['results' => $aResults],
        'isError' => false,
    ]];
}

function toolError(string $sMessage): array
{
    return [
        'content' => [[
            'type' => 'text',
            'text' => $sMessage,
        ]],
        'isError' => true,
    ];
}

/**
 * @return list<array{columns: list<string>, rows: list<list<string|null>>}|array{affected: int}>
 */
function runSql(string $sSql): array
{
    $oDb = dbConnect();
    try {
        $bQueryOk = $oDb->multi_query($sSql);
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException($oException->getMessage());
    }
    if (!$bQueryOk)
        throw new RuntimeException($oDb->error !== '' ? $oDb->error : 'Query failed');

    $aResults = [];
    do {
        $oResult = $oDb->store_result();
        if ($oResult instanceof mysqli_result) {
            $aColumns = [];
            foreach ($oResult->fetch_fields() as $oField)
                $aColumns[] = $oField->name;
            $aRows = [];
            while ($aRow = $oResult->fetch_row()) {
                $aCells = [];
                foreach ($aRow as $mValue)
                    $aCells[] = $mValue === null ? null : (string)$mValue;
                $aRows[] = $aCells;
            }
            $oResult->free();
            $aResults[] = ['columns' => $aColumns, 'rows' => $aRows];
        }
        elseif ($oDb->errno) {
            throw new RuntimeException($oDb->error);
        }
        elseif ($oDb->field_count === 0) {
            $aResults[] = ['affected' => $oDb->affected_rows];
        }
    } while ($oDb->more_results() && nextDbResult($oDb));

    if ($oDb->errno)
        throw new RuntimeException($oDb->error);

    return $aResults;
}

function nextDbResult(mysqli $oDb): bool
{
    try {
        return $oDb->next_result();
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException($oException->getMessage());
    }
}

/**
 * @param list<array{columns?: list<string>, rows?: list<list<string|null>>, affected?: int}> $aResults
 */
function formatResults(array $aResults): string
{
    $aBlocks = [];
    foreach ($aResults as $aResult) {
        if (isset($aResult['affected'])) {
            $aBlocks[] = "affected\t" . $aResult['affected'];
            continue;
        }
        $aLines = [implode("\t", $aResult['columns'])];
        foreach ($aResult['rows'] as $aRow) {
            $aCells = [];
            foreach ($aRow as $mValue) {
                if ($mValue === null)
                    $aCells[] = 'NULL';
                else
                    $aCells[] = str_replace(["\t", "\r", "\n"], ['\\t', '\\r', '\\n'], $mValue);
            }
            $aLines[] = implode("\t", $aCells);
        }
        $aBlocks[] = implode("\n", $aLines);
    }
    return implode("\n\n", $aBlocks);
}

function dbConnect(): mysqli
{
    static $oDb = null;
    if ($oDb instanceof mysqli) {
        try {
            if ($oDb->ping())
                return $oDb;
        }
        catch (mysqli_sql_exception $oException) {
            $oDb = null;
        }
    }

    $sHeaderPath = dirname(__DIR__) . '/inc/header.inc.php';
    if (!is_readable($sHeaderPath))
        throw new RuntimeException('UNA is not installed (inc/header.inc.php is missing)');

    $aDb = dbCredentials(file_get_contents($sHeaderPath));
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $oLink = mysqli_init();
    $iPort = ($aDb['port'] === '' || $aDb['port'] === '0') ? 3306 : (int)$aDb['port'];
    try {
        $oLink->real_connect(
            $aDb['host'],
            $aDb['user'],
            $aDb['pass'],
            $aDb['name'],
            $iPort,
            $aDb['sock'] !== '' ? $aDb['sock'] : null
        );
        $oLink->set_charset('utf8mb4');
        $oLink->query("SET NAMES utf8mb4 COLLATE " . $aDb['collate']);
        $oLink->query("SET sql_mode = ''");
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException('Database connect failed: ' . $oException->getMessage());
    }

    $oDb = $oLink;
    return $oDb;
}

/**
 * @return array{host: string, sock: string, port: string, user: string, pass: string, name: string, collate: string}
 */
function dbCredentials(string $sHeader): array
{
    $aMap = [
        'host' => ['BX_DATABASE_HOST', 'UNA_DB_HOST'],
        'sock' => ['BX_DATABASE_SOCK', 'UNA_DB_SOCK'],
        'port' => ['BX_DATABASE_PORT', 'UNA_DB_PORT'],
        'user' => ['BX_DATABASE_USER', 'UNA_DB_USER'],
        'pass' => ['BX_DATABASE_PASS', 'UNA_DB_PWD'],
        'name' => ['BX_DATABASE_NAME', 'UNA_DB_NAME'],
    ];

    $aDb = [];
    foreach ($aMap as $sKey => $aPair) {
        [$sConst, $sEnv] = $aPair;
        $sFromEnv = getenv($sEnv);
        if ($sFromEnv !== false) {
            $aDb[$sKey] = $sFromEnv;
            continue;
        }

        $sPattern = "/define\\(\\s*'" . $sConst . "'\\s*,\\s*\\\$_ENV\\['" . preg_quote($sEnv, '/') . "'\\]\\s*\\?\\?\\s*'((?:\\\\'|\\\\\\\\|[^'])*)'\\s*\\)/";
        if (!preg_match($sPattern, $sHeader, $aMatch))
            throw new RuntimeException("Cannot read $sConst from inc/header.inc.php");
        $aDb[$sKey] = str_replace(["\\'", "\\\\"], ["'", "\\"], $aMatch[1]);
    }

    foreach (['host', 'user', 'name'] as $sKey) {
        if ($aDb[$sKey] === '' || preg_match('/%[A-Z0-9_]+%/', $aDb[$sKey]))
            throw new RuntimeException('UNA is not installed (database settings in inc/header.inc.php are empty)');
    }

    $sCollate = getenv('UNA_DATABASE_COLLATE');
    $aDb['collate'] = ($sCollate !== false && $sCollate !== '') ? $sCollate : 'utf8mb4_unicode_ci';
    if (!preg_match('/^[A-Za-z0-9_]+$/', $aDb['collate']))
        throw new RuntimeException('Invalid database collation');

    return $aDb;
}

/**
 * @param string|int|null $mId
 * @param array<string, mixed> $aResult
 */
function writeResult(string|int|null $mId, array $aResult): void
{
    $aResult['resultType'] = 'complete';
    $aResult['_meta'] = [
        'io.modelcontextprotocol/serverInfo' => [
            'name' => MCP_SERVER_NAME,
            'version' => MCP_SERVER_VERSION,
        ],
    ];
    writeMessage([
        'jsonrpc' => '2.0',
        'id' => $mId,
        'result' => $aResult,
    ]);
}

/**
 * @param string|int|null $mId
 */
function writeError(string|int|null $mId, int $iCode, string $sMessage, ?array $aData = null): void
{
    $aError = [
        'code' => $iCode,
        'message' => $sMessage,
    ];
    if ($aData !== null)
        $aError['data'] = $aData;

    $aMessage = ['jsonrpc' => '2.0'];
    if ($mId !== null)
        $aMessage['id'] = $mId;
    $aMessage['error'] = $aError;
    writeMessage($aMessage);
}

function writeMessage(array $aMessage): void
{
    $sJson = json_encode($aMessage, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_THROW_ON_ERROR);
    fwrite(STDOUT, $sJson . "\n");
    fflush(STDOUT);
}

function usage(): string
{
    return "Usage: php tools/db.php\n"
        . "Reads newline-delimited JSON-RPC (MCP 2026-07-28) from stdin and writes responses to stdout.\n"
        . "Methods: server/discover, tools/list, tools/call (tool name: query, argument: sql).\n"
        . "\n"
        . "  docker compose exec -T -w /opt/una php php tools/db.php <<'EOF'\n"
        . "  {\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"query\",\"arguments\":{\"sql\":\"SELECT 1\"},\"_meta\":{\"io.modelcontextprotocol/protocolVersion\":\"2026-07-28\",\"io.modelcontextprotocol/clientCapabilities\":{}}}}\n"
        . "  EOF\n";
}
