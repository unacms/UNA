<?php
/**
 * UNA language-key MCP server (stdio, protocol 2026-07-28).
 *
 * Adds a missing English or Russian string to the language XML and, when
 * that language is installed, to the database. An existing translation is
 * left unchanged. The language cache is recompiled after a new string.
 *
 * Messages are one JSON-RPC object per line on stdin. Responses are one
 * JSON-RPC object per line on stdout. Logs go to stderr.
 *
 *   docker compose exec -T -w /opt/una php php tools/add_lang_key.php <<'EOF'
 *   {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"add","arguments":{"language":"en","key":"_sys_example","translation":"Hello"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}
 *   EOF
 */

if (PHP_SAPI !== 'cli')
    exit(1);

const MCP_PROTOCOL_VERSION = '2026-07-28';
const MCP_SERVER_NAME = 'una-lang';
const MCP_SERVER_VERSION = '1.0.0';

const JSONRPC_PARSE_ERROR = -32700;
const JSONRPC_INVALID_REQUEST = -32600;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_PARAMS = -32602;
const MCP_UNSUPPORTED_PROTOCOL_VERSION = -32022;

ini_set('display_errors', 'stderr');
ini_set('log_errors', '1');

if (isset($argv[1])) {
    fwrite(STDERR, usage());
    exit($argv[1] === '--help' || $argv[1] === '-h' ? 0 : 2);
}

if (stream_isatty(STDIN))
    fwrite(STDERR, "una-lang MCP server (" . MCP_PROTOCOL_VERSION . "), reading JSON-RPC from stdin\n");

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
                'instructions' => 'Add a missing English or Russian language key with the add tool. The string is written into the language XML and, when that language is installed, into the database. An existing translation is left unchanged.',
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
                'tools' => [addTool()],
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

function addTool(): array
{
    return [
        'name' => 'add',
        'title' => 'Add language key',
        'description' => 'Add a missing English or Russian string. The key is inserted into the language XML beside the closest existing keys, and into the database when that language is installed. An existing translation is left unchanged. Pass module when the key prefix does not name the module (for example _bx_orgs_ belongs to bx_organizations).',
        'inputSchema' => [
            'type' => 'object',
            'properties' => [
                'language' => [
                    'type' => 'string',
                    'enum' => ['en', 'ru'],
                    'description' => 'Language name: en or ru.',
                ],
                'key' => [
                    'type' => 'string',
                    'description' => 'Language key, a single line such as _sys_example or _bx_posts_example.',
                ],
                'translation' => [
                    'type' => 'string',
                    'description' => 'Translation text. Line breaks are kept.',
                ],
                'module' => [
                    'type' => 'string',
                    'description' => 'Module name to write into when the key prefix cannot identify it.',
                ],
            ],
            'required' => ['language', 'key', 'translation'],
            'additionalProperties' => false,
        ],
        'outputSchema' => [
            'type' => 'object',
            'properties' => [
                'language' => ['type' => 'string'],
                'key' => ['type' => 'string'],
                'file' => ['type' => 'string'],
                'xml' => [
                    'type' => 'string',
                    'enum' => ['added', 'already_present'],
                ],
                'keptExisting' => ['type' => 'boolean'],
                'languageInstalled' => ['type' => 'boolean'],
                'keyCreated' => ['type' => 'boolean'],
                'translationStatus' => [
                    'type' => 'string',
                    'enum' => ['added', 'already_present', 'skipped'],
                ],
                'keyId' => ['type' => ['integer', 'null']],
                'category' => ['type' => 'string'],
                'recompiled' => ['type' => 'boolean'],
            ],
            'required' => [
                'language',
                'key',
                'file',
                'xml',
                'keptExisting',
                'languageInstalled',
                'keyCreated',
                'translationStatus',
                'keyId',
                'category',
                'recompiled',
            ],
        ],
        'annotations' => [
            'title' => 'Add language key',
            'readOnlyHint' => false,
            'destructiveHint' => false,
            'idempotentHint' => true,
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
    if ($oParams->name !== 'add')
        return ['error' => [JSONRPC_INVALID_PARAMS, 'Unknown tool: ' . $oParams->name]];
    if (isset($oParams->arguments) && !is_object($oParams->arguments))
        return ['error' => [JSONRPC_INVALID_PARAMS, 'Invalid params: arguments must be an object']];

    $oArgs = $oParams->arguments ?? new stdClass();
    $sInvalid = invalidAddArguments($oArgs);
    if ($sInvalid !== null)
        return ['result' => toolError($sInvalid)];

    $sModule = (isset($oArgs->module) && is_string($oArgs->module) && $oArgs->module !== '') ? $oArgs->module : null;

    try {
        $aAdded = addLanguageKey(strtolower($oArgs->language), $oArgs->key, $oArgs->translation, $sModule);
    }
    catch (Throwable $oException) {
        return ['result' => toolError($oException->getMessage())];
    }

    $bFailed = isset($aAdded['error']);
    $sText = statusText($aAdded['status'], $bFailed);
    if ($bFailed)
        $sText .= "\n" . $aAdded['error'];

    return ['result' => [
        'content' => [[
            'type' => 'text',
            'text' => $sText,
        ]],
        'structuredContent' => $aAdded['status'],
        'isError' => isset($aAdded['error']),
    ]];
}

function invalidAddArguments(object $oArgs): ?string
{
    $mLang = $oArgs->language ?? null;
    if (!is_string($mLang) || !in_array(strtolower($mLang), ['en', 'ru'], true))
        return 'language must be en or ru';

    $mKey = $oArgs->key ?? null;
    if (!is_string($mKey) || $mKey === '')
        return 'key must be a non-empty string';
    if (strpbrk($mKey, "\r\n") !== false)
        return 'key must be a single line';

    $mTranslation = $oArgs->translation ?? null;
    if (!is_string($mTranslation) || $mTranslation === '')
        return 'translation must be a non-empty string';
    if (function_exists('mb_check_encoding') && !mb_check_encoding($mTranslation, 'UTF-8'))
        return 'translation is not valid UTF-8';

    if (isset($oArgs->module) && !is_string($oArgs->module))
        return 'module must be a string';

    return null;
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
 * @param array{language: string, key: string, file: string, xml: string, keptExisting: bool, languageInstalled: bool, keyCreated: bool, translationStatus: string, keyId: int|null, category: string, recompiled: bool} $aStatus
 */
function statusText(array $aStatus, bool $bFailed): string
{
    $aLines = [];
    if ($aStatus['xml'] === 'added')
        $aLines[] = 'xml: added to ' . $aStatus['file'];
    else {
        $aLines[] = 'xml: already present in ' . $aStatus['file'];
        if ($aStatus['keptExisting'])
            $aLines[] = 'kept the translation already in the language file';
    }

    if (!$aStatus['languageInstalled']) {
        if (!$bFailed)
            $aLines[] = "Language '" . $aStatus['language'] . "' is not installed in the database";
        return implode("\n", $aLines);
    }

    if ($aStatus['keyCreated'])
        $aLines[] = 'db: created key ' . $aStatus['keyId'] . " in '" . $aStatus['category'] . "'";

    if ($aStatus['translationStatus'] === 'already_present')
        $aLines[] = 'db: already present for ' . $aStatus['language'];
    elseif ($aStatus['translationStatus'] === 'added' && $aStatus['recompiled'])
        $aLines[] = 'db: added translation for ' . $aStatus['language'] . ' and recompiled';
    elseif ($aStatus['translationStatus'] === 'added')
        $aLines[] = 'db: added translation for ' . $aStatus['language'];

    return implode("\n", $aLines);
}

/**
 * @return array{status: array, error?: string}
 */
function addLanguageKey(string $sLang, string $sKey, string $sTranslation, ?string $sForcedModule): array
{
    $sRoot = dirname(__DIR__) . '/';
    $aModules = loadModules($sRoot);

    if ($sForcedModule !== null) {
        if (!isset($aModules[$sForcedModule]))
            throw new RuntimeException("Unknown module '$sForcedModule'");
        $aModule = $aModules[$sForcedModule];
    }
    else {
        $aModule = findModuleByExistingKey($sRoot, $sKey, $aModules);
        if (!$aModule)
            $aModule = inferModule($sKey, $aModules);
    }

    $sFile = resolveLangFile($sRoot, $sLang, $aModule, loadLanguageModules($sRoot));
    $sRel = ltrim(str_replace('\\', '/', substr($sFile, strlen($sRoot))), '/');

    $sExisting = is_file($sFile) ? readLangString($sFile, $sKey) : null;
    if ($sExisting !== null) {
        $sXml = 'already_present';
        $bKept = $sExisting !== $sTranslation;
        $sStore = $sExisting;
    }
    else {
        if (!writeLangString($sFile, $sLang, $sKey, $sTranslation))
            throw new RuntimeException("Failed to write $sRel");
        $sXml = 'added';
        $bKept = false;
        $sStore = $sTranslation;
    }

    $aStatus = [
        'language' => $sLang,
        'key' => $sKey,
        'file' => $sRel,
        'xml' => $sXml,
        'keptExisting' => $bKept,
        'languageInstalled' => false,
        'keyCreated' => false,
        'translationStatus' => 'skipped',
        'keyId' => null,
        'category' => $aModule['language_category'],
        'recompiled' => false,
    ];

    try {
        dbAddMissing($sLang, $sKey, $sStore, $aModule['language_category'], $aStatus);
    }
    catch (Throwable $oException) {
        return ['error' => $oException->getMessage(), 'status' => $aStatus];
    }

    return ['status' => $aStatus];
}

/**
 * @param array{languageInstalled: bool, keyCreated: bool, translationStatus: string, keyId: int|null, category: string, recompiled: bool} $aStatus
 */
function dbAddMissing(string $sLang, string $sKey, string $sTranslation, string $sCategory, array &$aStatus): void
{
    $iBuffers = ob_get_level();
    ob_start();
    try {
        bootUna();

        $oDb = BxDolDb::getInstance();
        $aLang = $oDb->getRow($oDb->prepare("SELECT `ID` AS `id` FROM `sys_localization_languages` WHERE `Name` = ? LIMIT 1", $sLang));
        if (!$aLang) {
            $aStatus['languageInstalled'] = false;
            return;
        }
        $aStatus['languageInstalled'] = true;
        $iLangId = (int)$aLang['id'];

        $aKey = $oDb->getRow($oDb->prepare("SELECT `ID` AS `id` FROM `sys_localization_keys` WHERE `Key` = ? LIMIT 1", $sKey));
        if (!$aKey) {
            $iCategoryId = categoryId($oDb, $sCategory);
            if (!$iCategoryId)
                throw new RuntimeException("Could not resolve language category '$sCategory'");

            $iInserted = (int)$oDb->query($oDb->prepare(
                "INSERT INTO `sys_localization_keys` (`IDCategory`, `Key`) VALUES (?, ?)",
                $iCategoryId,
                $sKey
            ));
            if ($iInserted <= 0)
                throw new RuntimeException('Could not insert language key');

            $aStatus['keyCreated'] = true;
            $aStatus['keyId'] = (int)$oDb->lastId();
        }
        else {
            $aStatus['keyId'] = (int)$aKey['id'];
        }

        $iKeyId = $aStatus['keyId'];
        $aString = $oDb->getRow($oDb->prepare(
            "SELECT `IDKey` AS `id` FROM `sys_localization_strings` WHERE `IDKey` = ? AND `IDLanguage` = ? LIMIT 1",
            $iKeyId,
            $iLangId
        ));
        if ($aString) {
            $aStatus['translationStatus'] = 'already_present';
            return;
        }

        $iInserted = (int)$oDb->query($oDb->prepare(
            "INSERT INTO `sys_localization_strings` (`IDKey`, `IDLanguage`, `String`) VALUES (?, ?, ?)",
            $iKeyId,
            $iLangId,
            $sTranslation
        ));
        if ($iInserted <= 0)
            throw new RuntimeException('Could not insert translation');

        $aStatus['translationStatus'] = 'added';

        bx_import('BxDolStudioLanguagesUtils');
        BxDolLanguages::getInstance();
        if (!BxDolStudioLanguagesUtils::getInstance()->compileLanguage($iLangId, true))
            throw new RuntimeException('Translation stored, but the language cache was not recompiled');

        $aStatus['recompiled'] = true;
    }
    finally {
        while (ob_get_level() > $iBuffers) {
            $sLeak = ob_get_clean();
            if (is_string($sLeak) && $sLeak !== '')
                fwrite(STDERR, $sLeak);
        }
    }
}

function categoryId(object $oDb, string $sCategory): int
{
    $aCategory = $oDb->getRow($oDb->prepare(
        "SELECT `ID` AS `id` FROM `sys_localization_categories` WHERE `Name` = ? LIMIT 1",
        $sCategory
    ));
    if ($aCategory)
        return (int)$aCategory['id'];

    $iInserted = (int)$oDb->query($oDb->prepare(
        "INSERT INTO `sys_localization_categories` (`Name`) VALUES (?)",
        $sCategory
    ));
    if ($iInserted <= 0)
        return 0;

    return (int)$oDb->lastId();
}

function bootUna(): void
{
    if (defined('BX_DOL'))
        return;

    $GLOBALS['bx_profiler_disable'] = true;
    if (!defined('BX_DOL_CRON_EXECUTE'))
        define('BX_DOL_CRON_EXECUTE', '1');

    $_ENV['UNA_SKIP_REDIRECT'] = '1';
    $_ENV['UNA_SKIP_MINIMAL_REQUIREMENTS'] = '1';
    $_ENV['UNA_SKIP_INSTALL_FOLDER_CHECK'] = '1';
    $_ENV['UNA_DEBUG_VISUAL_PROCESSING'] = false;
    $_ENV['UNA_DEBUG_EMAIL_REPORT'] = false;
    $_ENV['UNA_DEBUG_MODE'] = false;

    if (empty($_SERVER['HTTP_HOST'])) {
        $_SERVER['HTTP_HOST'] = 'hihi.com';
        $_SERVER['REQUEST_URI'] = '/una/';
        $_SERVER['SERVER_NAME'] = 'hihi.com';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
    }

    $sHeader = dirname(__DIR__) . '/inc/header.inc.php';
    if (!is_readable($sHeader))
        throw new RuntimeException('UNA is not installed (inc/header.inc.php is missing)');

    require_once $sHeader;
    require_once BX_DIRECTORY_PATH_INC . 'design.inc.php';
}

function loadModules(string $sRoot): array
{
    $a = [
        'system' => [
            'name' => 'system',
            'home_dir' => 'system/',
            'language_category' => 'System',
        ],
    ];

    foreach (glob($sRoot . 'modules/*/*/install/config.php') as $sConfig) {
        $s = file_get_contents($sConfig);
        if ($s === false)
            continue;

        $sName = configValue($s, 'name');
        $sHome = configValue($s, 'home_dir');
        if ($sName === null || $sHome === null || $sName === '')
            continue;

        $sCategory = configValue($s, 'language_category');
        if ($sCategory === null || $sCategory === '')
            $sCategory = $sName;

        $a[$sName] = [
            'name' => $sName,
            'home_dir' => rtrim($sHome, '/') . '/',
            'language_category' => $sCategory,
        ];
    }

    return $a;
}

function loadLanguageModules(string $sRoot): array
{
    $a = [
        'en' => ['home_dir' => 'boonex/english/'],
        'ru' => ['home_dir' => 'boonex/russian/'],
    ];

    foreach (glob($sRoot . 'modules/*/*/install/config.php') as $sConfig) {
        $s = file_get_contents($sConfig);
        if ($s === false)
            continue;

        $sUri = configValue($s, 'home_uri');
        $sHome = configValue($s, 'home_dir');
        if (($sUri !== 'en' && $sUri !== 'ru') || $sHome === null)
            continue;

        $a[$sUri] = ['home_dir' => rtrim($sHome, '/') . '/'];
    }

    return $a;
}

function configValue(string $sSource, string $sKey): ?string
{
    $sPattern = '/[\'"]' . preg_quote($sKey, '/') . '[\'"]\s*=>\s*[\'"]([^\'"]*)[\'"]/';
    if (!preg_match($sPattern, $sSource, $aMatch))
        return null;
    return $aMatch[1];
}

function findModuleByExistingKey(string $sRoot, string $sKey, array $aModules): ?array
{
    $aFound = [];
    $aFiles = array_merge(
        glob($sRoot . 'modules/*/*/install/langs/*.xml') ?: [],
        glob($sRoot . 'modules/*/*/data/langs/*/*.xml') ?: []
    );

    foreach ($aFiles as $sFile) {
        if (readLangString($sFile, $sKey) === null)
            continue;

        $sNorm = str_replace('\\', '/', $sFile);
        $aModule = null;

        if (preg_match('#/data/langs/([^/]+)/[^/]+\.xml$#', $sNorm, $aMatch) && isset($aModules[$aMatch[1]]))
            $aModule = $aModules[$aMatch[1]];
        elseif (preg_match('#/modules/(.+)/install/langs/[^/]+\.xml$#', $sNorm, $aMatch)) {
            $sHome = $aMatch[1] . '/';
            foreach ($aModules as $aCandidate) {
                if ($aCandidate['home_dir'] === $sHome) {
                    $aModule = $aCandidate;
                    break;
                }
            }
        }

        if ($aModule)
            $aFound[$aModule['name']] = $aModule;
    }

    if (!$aFound)
        return null;

    if (isset($aFound['system']) && count($aFound) > 1)
        unset($aFound['system']);

    return reset($aFound);
}

function inferModule(string $sKey, array $aModules): array
{
    $sBare = ltrim($sKey, '_');
    $aNames = array_keys($aModules);
    usort($aNames, function ($sA, $sB) {
        return strlen($sB) - strlen($sA);
    });

    foreach ($aNames as $sName) {
        if ($sName === 'system')
            continue;
        if ($sBare === $sName || strpos($sBare, $sName . '_') === 0)
            return $aModules[$sName];
    }

    return $aModules['system'];
}

function resolveLangFile(string $sRoot, string $sLang, array $aModule, array $aLangModules): string
{
    $sPack = $sRoot . 'modules/' . $aLangModules[$sLang]['home_dir'] . 'data/langs/' . $aModule['name'] . '/' . $sLang . '.xml';
    if (is_file($sPack))
        return $sPack;

    if ($aModule['name'] !== 'system') {
        $sInstall = $sRoot . 'modules/' . $aModule['home_dir'] . 'install/langs/' . $sLang . '.xml';
        if (is_file($sInstall) || $sLang === 'en')
            return $sInstall;
    }

    return $sPack;
}

function readLangString(string $sPath, string $sKey): ?string
{
    $s = @file_get_contents($sPath);
    if ($s === false)
        return null;

    $aVariants = array_unique([$sKey, htmlspecialchars($sKey, ENT_QUOTES | ENT_XML1, 'UTF-8')]);
    foreach ($aVariants as $sVariant) {
        $sPattern = '/<string\b[^>]*\bname=(["\'])' . preg_quote($sVariant, '/') . '\\1[^>]*>(.*?)<\/string>/s';
        if (!preg_match($sPattern, $s, $aMatch))
            continue;

        $sInner = $aMatch[2];
        if (preg_match('/^\s*<!\[CDATA\[(.*)\]\]>\s*$/s', $sInner, $aCdata))
            return str_replace(']]]]><![CDATA[>', ']]>', $aCdata[1]);

        return html_entity_decode($sInner, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    return null;
}

function writeLangString(string $sFile, string $sLang, string $sKey, string $sTranslation): bool
{
    $aMeta = [
        'en' => ['flag' => 'gb', 'title' => 'English'],
        'ru' => ['flag' => 'ru', 'title' => 'Russian'],
    ];

    $sNl = "\n";
    if (is_file($sFile)) {
        $sXml = file_get_contents($sFile);
        if ($sXml === false)
            return false;
        if (strpos($sXml, "\r\n") !== false)
            $sNl = "\r\n";
    }
    else {
        $sDir = dirname($sFile);
        if (!is_dir($sDir) && !mkdir($sDir, 0775, true))
            return false;

        $sXml = '<?xml version="1.0" encoding="utf-8"?>' . $sNl
            . '<resources name="' . $sLang . '" flag="' . $aMeta[$sLang]['flag'] . '" title="' . $aMeta[$sLang]['title'] . '">' . $sNl
            . '</resources>' . $sNl;
    }

    $iPos = insertionOffset($sXml, $sKey);
    if ($iPos === false)
        return false;

    $sIndent = indentAt($sXml, $iPos);
    $sLine = $sIndent . '<string name="' . htmlspecialchars($sKey, ENT_QUOTES | ENT_XML1, 'UTF-8') . '"><![CDATA[' . cdata($sTranslation) . ']]></string>' . $sNl;
    if ($iPos > 0 && $sXml[$iPos - 1] !== "\n")
        $sLine = $sNl . $sLine;

    $sXml = substr($sXml, 0, $iPos) . $sLine . substr($sXml, $iPos);
    return file_put_contents($sFile, $sXml, LOCK_EX) !== false;
}

/**
 * Byte offset where $sKey should be inserted: after the closest earlier
 * sibling, or before </resources> when nothing shares a meaningful prefix.
 * Sibling groups stay intact, so a new key lands beside a family rather
 * than between two keys that belong together.
 *
 * @return int|false
 */
function insertionOffset(string $sXml, string $sKey)
{
    $iFallback = strrpos($sXml, '</resources>');
    if ($iFallback === false)
        return false;

    $aEntries = langStringEntries($sXml);
    if (!$aEntries)
        return $iFallback;

    $iBest = 0;
    foreach ($aEntries as $aEntry) {
        $iScore = commonNonEmptySegments($sKey, $aEntry['name']);
        if ($iScore > $iBest)
            $iBest = $iScore;
    }
    if ($iBest < 2)
        return $iFallback;

    $aClose = [];
    foreach ($aEntries as $i => $aEntry) {
        if (commonNonEmptySegments($sKey, $aEntry['name']) === $iBest)
            $aClose[$i] = $aEntry;
    }

    $iPred = null;
    $sPredName = null;
    foreach ($aClose as $i => $aEntry) {
        if (strcmp($aEntry['name'], $sKey) < 0 && ($sPredName === null || strcmp($aEntry['name'], $sPredName) > 0)) {
            $iPred = $i;
            $sPredName = $aEntry['name'];
        }
    }
    if ($iPred !== null)
        return clusterEdge($aEntries, $iPred, $iBest, false);

    $iSucc = null;
    $sSuccName = null;
    foreach ($aClose as $i => $aEntry) {
        if (strcmp($aEntry['name'], $sKey) > 0 && ($sSuccName === null || strcmp($aEntry['name'], $sSuccName) < 0)) {
            $iSucc = $i;
            $sSuccName = $aEntry['name'];
        }
    }
    if ($iSucc !== null)
        return clusterEdge($aEntries, $iSucc, $iBest, true);

    return $iFallback;
}

function clusterEdge(array $aEntries, int $iAnchor, int $iMinScore, bool $bStart): int
{
    $sAnchor = $aEntries[$iAnchor]['name'];
    $iEdge = $iAnchor;

    if ($bStart) {
        for ($i = $iAnchor - 1; $i >= 0; $i--) {
            if (commonNonEmptySegments($sAnchor, $aEntries[$i]['name']) <= $iMinScore)
                break;
            $iEdge = $i;
        }
        return $aEntries[$iEdge]['start'];
    }

    $iCount = count($aEntries);
    for ($i = $iAnchor + 1; $i < $iCount; $i++) {
        if (commonNonEmptySegments($sAnchor, $aEntries[$i]['name']) <= $iMinScore)
            break;
        $iEdge = $i;
    }
    return $aEntries[$iEdge]['end'];
}

function langStringEntries(string $sXml): array
{
    $aEntries = [];
    $sPattern = '/^([ \t]*)<string\b[^>]*\bname=(["\'])(.*?)\2[^>]*>.*?<\/string>[ \t]*(?:\r?\n)?/ms';
    if (!preg_match_all($sPattern, $sXml, $aMatches, PREG_OFFSET_CAPTURE))
        return $aEntries;

    foreach ($aMatches[0] as $i => $aFull) {
        $aEntries[] = [
            'name' => html_entity_decode($aMatches[3][$i][0], ENT_QUOTES | ENT_XML1, 'UTF-8'),
            'indent' => $aMatches[1][$i][0],
            'start' => $aFull[1],
            'end' => $aFull[1] + strlen($aFull[0]),
        ];
    }
    return $aEntries;
}

function commonNonEmptySegments(string $sA, string $sB): int
{
    $aA = explode('_', $sA);
    $aB = explode('_', $sB);
    $n = min(count($aA), count($aB));
    $iNonEmpty = 0;
    for ($i = 0; $i < $n; $i++) {
        if ($aA[$i] !== $aB[$i])
            break;
        if ($aA[$i] !== '')
            $iNonEmpty++;
    }
    return $iNonEmpty;
}

function indentAt(string $sXml, int $iPos): string
{
    $aEntries = langStringEntries($sXml);
    $sIndent = '    ';
    foreach ($aEntries as $aEntry) {
        if ($aEntry['start'] <= $iPos)
            $sIndent = $aEntry['indent'];
        if ($aEntry['start'] >= $iPos)
            return $aEntry['indent'] !== '' ? $aEntry['indent'] : $sIndent;
    }
    return $sIndent;
}

function cdata(string $s): string
{
    return str_replace(']]>', ']]]]><![CDATA[>', $s);
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
    return "Usage: php tools/add_lang_key.php\n"
        . "Reads newline-delimited JSON-RPC (MCP 2026-07-28) from stdin and writes responses to stdout.\n"
        . "Methods: server/discover, tools/list, tools/call (tool name: add; arguments: language, key, translation; optional module).\n"
        . "\n"
        . "  docker compose exec -T -w /opt/una php php tools/add_lang_key.php <<'EOF'\n"
        . "  {\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"add\",\"arguments\":{\"language\":\"en\",\"key\":\"_sys_example\",\"translation\":\"Hello\"},\"_meta\":{\"io.modelcontextprotocol/protocolVersion\":\"2026-07-28\",\"io.modelcontextprotocol/clientCapabilities\":{}}}}\n"
        . "  EOF\n";
}
