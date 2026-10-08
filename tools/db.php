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
const MAX_RESULT_ROWS = 1000;

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
        'description' => 'Run SQL against the installed UNA database. Several statements separated by semicolons run in one transaction and commit together. If a later statement fails, earlier statements in that transaction are rolled back. A statement that commits on its own, such as a schema change, is kept, and the error includes the results of statements that already committed. Each result set returns at most ' . MAX_RESULT_ROWS . ' rows and sets truncated when more rows matched.',
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
                            'truncated' => ['type' => 'boolean'],
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
    catch (DbCallException $oException) {
        return ['result' => toolError($oException->getMessage(), $oException->aResults)];
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

function toolError(string $sMessage, array $aResults = []): array
{
    if ($aResults !== [])
        $sMessage .= "\n\n" . formatResults($aResults);

    $aError = [
        'content' => [[
            'type' => 'text',
            'text' => $sMessage,
        ]],
        'isError' => true,
    ];
    if ($aResults !== [])
        $aError['structuredContent'] = ['results' => $aResults];
    return $aError;
}

class DbCallException extends RuntimeException
{
    /** @var list<array<string, mixed>> */
    public array $aResults;

    /**
     * @param list<array<string, mixed>> $aResults
     */
    public function __construct(string $sMessage, array $aResults)
    {
        parent::__construct($sMessage);
        $this->aResults = $aResults;
    }
}

/**
 * @return list<array{columns?: list<string>, rows?: list<list<string|null>>, affected?: int, truncated?: bool}>
 */
function runSql(string $sSql): array
{
    $aStatements = splitSqlStatements($sSql);
    if ($aStatements === [])
        throw new RuntimeException('sql must contain a statement');

    $oDb = dbConnect();
    try {
        if (dbInTransaction($oDb))
            $oDb->rollback();
    }
    catch (RuntimeException $oException) {
        dbDisconnect();
        $oDb = dbConnect();
    }
    dbBegin($oDb);
    $aPending = [];
    $aCommitted = [];
    try {
        foreach ($aStatements as $sStatement) {
            $bRestart = statementRestartsTransaction($sStatement);
            $aStatementResults = runStatement($oDb, $sStatement);
            if ($bRestart) {
                $aCommitted = array_merge($aCommitted, $aPending);
                $aPending = [];
            }
            if (!dbInTransaction($oDb)) {
                if (!$bRestart && statementDiscardsPending($sStatement))
                    $aPending = [];
                else
                    $aCommitted = array_merge($aCommitted, $aPending, $aStatementResults);
                $aPending = [];
                dbBegin($oDb);
            }
            else {
                foreach ($aStatementResults as $aResult)
                    $aPending[] = $aResult;
            }
        }
        if (dbInTransaction($oDb))
            dbCommit($oDb);
    }
    catch (RuntimeException $oException) {
        $bOpen = false;
        try {
            $bOpen = dbInTransaction($oDb);
        }
        catch (RuntimeException $oIgnored) {
            dbDisconnect();
            $aMaybe = array_merge($aCommitted, $aPending);
            if ($aMaybe !== []) {
                throw new DbCallException(
                    $oException->getMessage() . "\nThe connection closed before the outcome of earlier statements could be confirmed.",
                    $aMaybe
                );
            }
            throw $oException;
        }

        if ($bOpen) {
            try {
                $oDb->rollback();
            }
            catch (mysqli_sql_exception $oRollback) {
                dbDisconnect();
            }
            if ($aCommitted !== []) {
                throw new DbCallException(
                    $oException->getMessage() . "\nEarlier statements that already committed are listed below. The rest of this call was rolled back.",
                    $aCommitted
                );
            }
            if ($aPending !== [])
                throw new RuntimeException($oException->getMessage() . "\nEarlier statements in this call were rolled back.");
            throw $oException;
        }

        $aCommitted = array_merge($aCommitted, $aPending);
        if ($aCommitted !== []) {
            throw new DbCallException(
                $oException->getMessage() . "\nEarlier statements already committed on the live database.",
                $aCommitted
            );
        }
        throw $oException;
    }

    return array_merge($aCommitted, $aPending);
}

/**
 * @return list<array{columns?: list<string>, rows?: list<list<string|null>>, affected?: int, truncated?: bool}>
 */
function runStatement(mysqli $oDb, string $sSql): array
{
    try {
        $oDb->real_query($sSql);
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException($oException->getMessage());
    }

    $aResults = [];
    do {
        $oResult = $oDb->use_result();
        if ($oResult instanceof mysqli_result)
            $aResults[] = fetchBounded($oDb, $oResult);
        elseif ($oDb->errno)
            throw new RuntimeException($oDb->error !== '' ? $oDb->error : 'Query failed');
        elseif ($oDb->field_count === 0)
            $aResults[] = ['affected' => $oDb->affected_rows];
    } while ($oDb->more_results() && nextDbResult($oDb));

    if ($oDb->errno)
        throw new RuntimeException($oDb->error !== '' ? $oDb->error : 'Query failed');

    return $aResults;
}

/**
 * @return array{columns: list<string>, rows: list<list<string|null>>, truncated?: bool}
 */
function fetchBounded(mysqli $oDb, mysqli_result $oResult): array
{
    $aColumns = [];
    foreach ($oResult->fetch_fields() as $oField)
        $aColumns[] = $oField->name;

    $aRows = [];
    $bTruncated = false;
    while ($aRow = $oResult->fetch_row()) {
        if (count($aRows) >= MAX_RESULT_ROWS) {
            $bTruncated = true;
            break;
        }
        $aCells = [];
        foreach ($aRow as $mValue)
            $aCells[] = $mValue === null ? null : (string)$mValue;
        $aRows[] = $aCells;
    }

    if ($bTruncated)
        releaseResult($oDb, $oResult);
    else
        $oResult->free();

    $aResult = ['columns' => $aColumns, 'rows' => $aRows];
    if ($bTruncated)
        $aResult['truncated'] = true;
    return $aResult;
}

function releaseResult(mysqli $oDb, mysqli_result $oResult): void
{
    try {
        $oKiller = dbOpen();
        try {
            $oKiller->query('KILL QUERY ' . (int)$oDb->thread_id);
        }
        catch (mysqli_sql_exception $oException) {
        }
        $oKiller->close();
    }
    catch (RuntimeException $oException) {
    }

    try {
        $oResult->free();
    }
    catch (mysqli_sql_exception $oException) {
        $bAlive = false;
        try {
            $bAlive = $oDb->ping();
        }
        catch (mysqli_sql_exception $oPing) {
            $bAlive = false;
        }
        if (!$bAlive) {
            dbDisconnect();
            throw new RuntimeException($oException->getMessage());
        }
    }
}

/**
 * @return list<string>
 */
function splitSqlStatements(string $sSql): array
{
    $aChars = mb_str_split($sSql);
    $iLen = count($aChars);
    $aStatements = [];
    $sCurrent = '';
    $sMode = '';
    $sQuote = '';

    for ($i = 0; $i < $iLen; $i++) {
        $sChar = $aChars[$i];
        $sNext = $i + 1 < $iLen ? $aChars[$i + 1] : '';

        if ($sMode === 'line') {
            $sCurrent .= $sChar;
            if ($sChar === "\n" || $sChar === "\r")
                $sMode = '';
            continue;
        }
        if ($sMode === 'block') {
            $sCurrent .= $sChar;
            if ($sChar === '*' && $sNext === '/') {
                $sCurrent .= $sNext;
                $i++;
                $sMode = '';
            }
            continue;
        }
        if ($sMode === 'quote' || $sMode === 'ident') {
            $sCurrent .= $sChar;
            if ($sMode === 'quote' && $sChar === '\\' && $sNext !== '') {
                $sCurrent .= $sNext;
                $i++;
                continue;
            }
            if ($sChar === $sQuote) {
                if ($sNext === $sQuote) {
                    $sCurrent .= $sNext;
                    $i++;
                    continue;
                }
                $sMode = '';
            }
            continue;
        }

        if ($sChar === "'" || $sChar === '"') {
            $sMode = 'quote';
            $sQuote = $sChar;
            $sCurrent .= $sChar;
            continue;
        }
        if ($sChar === '`') {
            $sMode = 'ident';
            $sQuote = '`';
            $sCurrent .= $sChar;
            continue;
        }
        if ($sChar === '#') {
            $sMode = 'line';
            $sCurrent .= $sChar;
            continue;
        }
        if ($sChar === '-' && $sNext === '-') {
            $sThird = $i + 2 < $iLen ? $aChars[$i + 2] : '';
            if ($sThird === '' || preg_match('/\s/u', $sThird) === 1) {
                $sMode = 'line';
                $sCurrent .= $sChar;
                continue;
            }
        }
        if ($sChar === '/' && $sNext === '*') {
            $sMode = 'block';
            $sCurrent .= $sChar;
            continue;
        }
        if ($sChar === ';') {
            if (sqlWithoutLeadingComments($sCurrent) !== '')
                $aStatements[] = $sCurrent;
            $sCurrent = '';
            continue;
        }
        $sCurrent .= $sChar;
    }

    if (sqlWithoutLeadingComments($sCurrent) !== '')
        $aStatements[] = $sCurrent;
    return $aStatements;
}

function sqlWithoutLeadingComments(string $sSql): string
{
    $s = $sSql;
    do {
        $sNext = preg_replace(
            '/\A(?:\s+|\/\*[\s\S]*?\*\/|#.*(?:\n|$)|--[ \t].*(?:\n|$)|--(?:\r\n|\n|\r|$))/u',
            '',
            $s,
            1,
            $iCount
        );
        if (!is_string($sNext))
            return trim($s);
        $s = $sNext;
    } while ($iCount > 0);

    return $s;
}

function statementRestartsTransaction(string $sSql): bool
{
    $s = sqlWithoutLeadingComments($sSql);
    if (preg_match('/^BEGIN\b(?!\s+NOT\b)/i', $s) === 1)
        return true;
    return preg_match('/^START\s+TRANSACTION\b/i', $s) === 1;
}

function statementDiscardsPending(string $sSql): bool
{
    $s = sqlWithoutLeadingComments($sSql);
    return preg_match('/^ROLLBACK\b(?!\s+TO\b)/i', $s) === 1;
}

function dbBegin(mysqli $oDb): void
{
    try {
        $oDb->begin_transaction();
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException($oException->getMessage());
    }
}

function dbCommit(mysqli $oDb): void
{
    try {
        $oDb->commit();
    }
    catch (mysqli_sql_exception $oException) {
        try {
            $oDb->rollback();
        }
        catch (mysqli_sql_exception $oRollback) {
            dbDisconnect();
        }
        throw new RuntimeException($oException->getMessage());
    }
}

function dbInTransaction(mysqli $oDb): bool
{
    try {
        $oResult = $oDb->query('SELECT @@SESSION.in_transaction');
    }
    catch (mysqli_sql_exception $oException) {
        throw new RuntimeException($oException->getMessage());
    }
    $aRow = $oResult->fetch_row();
    $oResult->free();
    return isset($aRow[0]) && $aRow[0] === '1';
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
        if (!empty($aResult['truncated']))
            $aLines[] = '(truncated to ' . count($aResult['rows']) . ' rows)';
        $aBlocks[] = implode("\n", $aLines);
    }
    return implode("\n\n", $aBlocks);
}

function &dbStoredLink(): ?mysqli
{
    static $oDb = null;
    return $oDb;
}

function dbDisconnect(): void
{
    $oDb = &dbStoredLink();
    if ($oDb instanceof mysqli) {
        try {
            $oDb->close();
        }
        catch (mysqli_sql_exception $oException) {
        }
    }
    $oDb = null;
}

function dbConnect(): mysqli
{
    $oDb = &dbStoredLink();
    if ($oDb instanceof mysqli) {
        try {
            if ($oDb->ping())
                return $oDb;
        }
        catch (mysqli_sql_exception $oException) {
            $oDb = null;
        }
    }

    $oDb = dbOpen();
    return $oDb;
}

function dbOpen(): mysqli
{
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

    return $oLink;
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
