<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * API v2: resource URLs under /api/v2, HTTP methods with their meaning, JSON bodies, real
 * status codes, RFC 9457 problem documents for errors and cursor paging. The OpenAPI 3.1
 * document at /api/v2/openapi.json is built from the same operation attributes the router
 * dispatches on.
 *
 * Endpoints are classes with BxDolApiV2Operation attributes on their methods:
 * - system ones are listed in $_aSystemEndpoints;
 * - an enabled module adds its own with a `classes/<ClassPrefix>ApiV2.php` file declaring
 *   `<ClassPrefix>ApiV2`, so a site's API lists only what it has installed.
 *
 * The old api.php (v1) is not touched by any of this.
 */
class BxDolApiV2Router
{
    const VERSION = '2.0.0-draft';

    /** The option that turns API v2 on (Studio > API > Settings); off as installed while v2 is a preview. */
    const OPTION_ENABLE = 'sys_api_v2_enable';

    /** Largest body (bytes) that gets an ETag: 1 MiB. */
    const ETAG_MAX_BYTES = 1048576;

    protected static $_aSystemEndpoints = [
        'BxBaseApiV2System',
        'BxBaseApiV2Me',
        'BxBaseApiV2Profiles',
        'BxBaseApiV2Sync',
        'BxBaseApiV2Search',
        'BxBaseApiV2Layout',
        'BxBaseApiV2Editor',
        'BxBaseApiV2Navigation',
        'BxBaseApiV2Agents',
        'BxBaseApiV2Uploads',
        'BxBaseApiV2Comments',
        'BxBaseApiV2Reactions',
    ];

    /** A kept route table in another format than this is built again. */
    const TABLE_FORMAT = 2;
    /** How long a kept route table is used (seconds) before the site's modules are looked into again. */
    const TABLE_LIFETIME = 3600;
    /** Public methods of endpoint classes named like this are hooks (hooks()). */
    const HOOK_PREFIX = 'apiV2';

    protected $_aOperations = null;
    protected $_aSchemas = null;
    protected $_aOwnClasses = null;

    protected static $_aSite = null;
    protected static $_aModules = [];
    protected static $_aClasses = null;
    protected static $_aTables = [];
    protected static $_aOperationSets = [];
    protected static $_aSchemaSets = [];
    protected static $_aHookObjects = [];

    /**
     * @param array|null $aClasses endpoint classes to use instead of this site's (classesFor()),
     *                             to see the API another set of enabled modules would have
     */
    public function __construct($aClasses = null)
    {
        $this->_aOwnClasses = is_array($aClasses) ? array_values($aClasses) : null;
    }

    public static function getBaseUrl()
    {
        return BX_DOL_URL_ROOT . 'api/v2';
    }

    /**
     * The request's query and form params, taken out of the superglobals: [query, form].
     *
     * They are the endpoint's to read (BxDolApiV2Request) and nobody else's. The site's code that
     * endpoints call reads the request itself (bx_get: per_page, start, order, owner and profile
     * ids ...), so a param an endpoint never declared would change what it reads or writes. After
     * this that code sees an empty request; what an endpoint means it to see, it sets for the call
     * (BxDolApiV2Search::isolated). Cookies and uploaded files stay where they are.
     */
    public static function takeRequest()
    {
        $a = [$_GET, $_POST];
        $_GET = $_POST = $_REQUEST = [];
        return $a;
    }

    /**
     * Handle the current HTTP request and send the response.
     * @param string $sPath path after /api/v2, e.g. 'me' or 'profiles/4'
     */
    public function run($sPath)
    {
        $sMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $sPath = '/' . trim((string)$sPath, '/');

        // CORS and the preflight only while the API and API v2 are on: with either off a page of
        // another origin gets no CORS header at all, and every method, OPTIONS too, the 503 below
        if (getParam('sys_api_enable') && getParam(self::OPTION_ENABLE)) {
            $this->_sendCors();

            if ($sMethod === 'OPTIONS') {
                http_response_code(204);
                return;
            }
        }

        list($aQuery, $aForm) = self::takeRequest();

        $oIdempotency = null;
        try {
            if (!getParam('sys_api_enable'))
                throw new BxDolApiV2Problem(503, 'api_disabled', 'The API is turned off on this site');
            // v2 is a preview with its own switch (Studio > API > Settings), off as installed: the
            // site and the apps on api.php (v1) work the same with it on or off.
            if (!getParam(self::OPTION_ENABLE))
                throw new BxDolApiV2Problem(503, 'api_v2_disabled', 'API v2 is a preview and is turned off on this site (an administrator turns it on in Studio > API > Settings)');

            // from here on the code v2 shares with the site and API v1 may do what only v2 wants
            bx_is_api_v2(true);

            $sKey = BxDolApiV2Idempotency::isWrite($sMethod) && isset($_SERVER['HTTP_IDEMPOTENCY_KEY']) ? (string)$_SERVER['HTTP_IDEMPOTENCY_KEY'] : null;

            list($aOp, $aPathParams) = $this->_match($sMethod === 'HEAD' ? 'GET' : $sMethod, $sPath);

            $oAuth = $aOp['attr']->auth === 'none' ? new BxDolApiV2Auth() : BxDolApiV2Auth::fromRequest($sMethod);
            if ($aOp['attr']->auth === 'required' && !$oAuth->getProfileId())
                throw BxDolApiV2Problem::unauthorized();

            // before a key is claimed or a body is read: a refused request costs one statement
            BxDolApiV2RateLimit::check($aOp['attr'], $oAuth);

            // the declared query params, before the endpoint reads any of them
            if (($aQueryErrors = self::checkQuery($aOp['query'] ?? [], $aQuery)))
                throw BxDolApiV2Problem::validation($aQueryErrors);

            // the raw body, read once: the idempotency fingerprint and _readBody share it;
            // multipart bodies (uploads) are PHP's to parse and are never fingerprinted
            $bMultipart = str_starts_with(strtolower(trim($_SERVER['CONTENT_TYPE'] ?? '')), 'multipart/');
            $sRaw = BxDolApiV2Idempotency::isWrite($sMethod) && !$bMultipart ? (string)file_get_contents('php://input') : '';

            // only signed-in requests: a key belongs to the session that sent it; guests' keys
            // and uploads' are ignored, so only a key that is used is checked
            $sScope = $sKey !== null && !$bMultipart && $oAuth->getProfileId() ? BxDolApiV2Idempotency::scope($oAuth->getMode(), $oAuth->getCredential()) : null;
            if ($sScope !== null && !BxDolApiV2Idempotency::isValidKey($sKey))
                throw new BxDolApiV2Problem(400, 'invalid_idempotency_key', 'An Idempotency-Key is 1 to 255 visible ASCII characters');
            if ($sScope !== null) {
                $oClaim = new BxDolApiV2Idempotency($sScope, $sKey, BxDolApiV2Idempotency::fingerprint($sMethod, $sPath, self::queryString($aQuery), $sRaw));
                $aReplay = $oClaim->claim();
                if ($aReplay !== null) {
                    $this->_emit($aReplay, $sMethod);
                    return;
                }
                $oIdempotency = $oClaim;
            }

            $mBody = $this->_readBody($sMethod, $aOp['attr'], $sRaw, $aForm);

            $oRequest = new BxDolApiV2Request($sMethod, $aPathParams, $aQuery, $mBody, $_FILES, $oAuth);
            // the only endpoint class a request loads, unless it reads schemas or calls hooks
            self::_load($aOp['class'], $this->_table()['classes'][$aOp['class']] ?? '');
            $oEndpoint = new $aOp['class']();
            $mResult = $oEndpoint->{$aOp['method']}($oRequest);

            $oResponse = $mResult instanceof BxDolApiV2Response ? $mResult : new BxDolApiV2Response(200, $mResult);
            // a body written as it is made (an agent's reply): sent at once, never kept
            if ($oResponse->fStream) {
                if ($oIdempotency)
                    $oIdempotency->release();
                $this->_stream($oResponse);
                return;
            }
            $aAnswer = self::answer($oResponse, $sMethod, $_SERVER['HTTP_IF_NONE_MATCH'] ?? null);
        }
        catch (BxDolApiV2Problem $e) {
            $aAnswer = self::problemAnswer($e);
        }
        catch (Throwable $e) {
            // the cause stays in the server log; the client gets no internals
            error_log('UNA API v2: ' . get_class($e) . ': ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            $aAnswer = self::problemAnswer(new BxDolApiV2Problem(500, 'internal_error', 'Something went wrong on the server'));
        }

        if ($oIdempotency) {
            try {
                $oIdempotency->finish($aAnswer, self::_setsCookie());
            }
            catch (Throwable $e) {
                // the write is done: its answer goes out even when it could not be kept
                error_log('UNA API v2: could not keep an idempotent answer: ' . $e->getMessage());
            }
        }

        $this->_emit($aAnswer, $sMethod);
    }

    /**
     * Every operation: [['attr' => BxDolApiV2Operation, 'class' => ..., 'method' => ..., 'regex' => ..., 'params' => ...], ...],
     * literal paths before those with params. No endpoint class is loaded for it when the
     * site's table is kept (_siteTable()).
     */
    public function getOperations()
    {
        if ($this->_aOperations !== null)
            return $this->_aOperations;

        // one list per request: the spec, the validator and the router share it
        $sKey = $this->_aOwnClasses !== null ? implode(',', $this->_aOwnClasses) : '*';
        if (!isset(self::$_aOperationSets[$sKey])) {
            $aOperations = [];
            foreach ($this->_table()['operations'] as $aOp) {
                $aOp['attr'] = new BxDolApiV2Operation(...$aOp['attr']);
                $aOperations[] = $aOp;
            }
            self::$_aOperationSets[$sKey] = $aOperations;
        }

        return $this->_aOperations = self::$_aOperationSets[$sKey];
    }

    /**
     * The component schemas of every endpoint class. Making them loads every class and builds
     * every schema, so only what reads schemas asks for them: the check of a JSON body and the
     * OpenAPI document. They are not kept between requests: a class may build its schemas from
     * the site's settings.
     */
    public function getSchemas()
    {
        if ($this->_aSchemas !== null)
            return $this->_aSchemas;

        $aClasses = $this->_getEndpointClasses();
        $sKey = implode(',', $aClasses);
        if (!isset(self::$_aSchemaSets[$sKey])) {
            $aSchemas = [];
            foreach ($aClasses as $sClass)
                if (method_exists($sClass, 'schemas'))
                    $aSchemas = array_merge($aSchemas, $sClass::schemas());
            self::$_aSchemaSets[$sKey] = $aSchemas;
        }

        return $this->_aSchemas = self::$_aSchemaSets[$sKey];
    }

    /**
     * The route table of loaded endpoint classes, read from their attributes. Plain arrays of
     * scalars, so every cache engine can keep it:
     * - operations: ['attr' => the attribute's arguments, 'class', 'method', 'regex', 'params',
     *   'query' => queryRules()], literal paths before those with params;
     * - hooks: method name => the classes with a public method of that name, for the names
     *   that start with HOOK_PREFIX;
     * - files: file => fileStamp(), of every file the classes and their parents are declared
     *   in (isFresh()).
     */
    public static function buildTable(array $aClasses)
    {
        $aOperations = [];
        $aPaths = [];
        $aHooks = [];
        $aFiles = [];

        // what the query params' schemas refer to: read here, once, so that a request does not
        // build every schema to check an id (queryRules())
        $aSchemas = [];
        foreach ($aClasses as $sClass)
            if (method_exists($sClass, 'schemas'))
                $aSchemas = array_merge($aSchemas, $sClass::schemas());

        foreach ($aClasses as $sClass) {
            $oClass = new ReflectionClass($sClass);
            for ($oDeclared = $oClass; $oDeclared; $oDeclared = $oDeclared->getParentClass())
                if ($oDeclared->getFileName())
                    $aFiles[$oDeclared->getFileName()] = self::fileStamp($oDeclared->getFileName());

            foreach ($oClass->getMethods(ReflectionMethod::IS_PUBLIC) as $oMethod) {
                if (str_starts_with($oMethod->getName(), self::HOOK_PREFIX))
                    $aHooks[$oMethod->getName()][] = $sClass;

                foreach ($oMethod->getAttributes('BxDolApiV2Operation') as $oAttr) {
                    $oOp = $oAttr->newInstance();
                    $aPaths[] = $oOp->path;
                    $aOperations[] = [
                        'attr' => $oAttr->getArguments(),
                        'class' => $sClass,
                        'method' => $oMethod->getName(),
                        'regex' => '#^' . preg_replace('#\\\\\{([a-z_]+)\\\\\}#', '(?P<$1>[^/]+)', preg_quote($oOp->path, '#')) . '$#',
                        'params' => substr_count($oOp->path, '{'),
                        'query' => self::queryRules($oOp, $aSchemas),
                    ];
                }
            }
        }

        // literal segments win over params: /feeds/home before /feeds/{kind}
        $aOrder = array_keys($aOperations);
        usort($aOrder, function ($i, $j) use ($aOperations, $aPaths) {
            return [$aOperations[$i]['params'], -strlen($aPaths[$i]), $i] <=> [$aOperations[$j]['params'], -strlen($aPaths[$j]), $j];
        });
        $aSorted = [];
        foreach ($aOrder as $i)
            $aSorted[] = $aOperations[$i];

        return ['format' => self::TABLE_FORMAT, 'operations' => $aSorted, 'hooks' => $aHooks, 'files' => $aFiles];
    }

    /**
     * What the router checks of an operation's query params (checkQuery()):
     * name => ['required' => bool, 'schema' => its schema with every $ref replaced by what it
     * refers to, or null when a reference leads nowhere (then only `required` is checked)].
     *
     * `cursor` and `limit` are left out: BxDolApiV2Request reads them, and a limit out of
     * range is brought into it, not refused.
     *
     * The schemas are kept with the route table, so one a query param refers to must not
     * depend on the site's settings: a changed setting would not show until the table is
     * built again. Describe such a param with a plain string and check it in the endpoint.
     * @param array $aSchemas the component schemas of the endpoint classes
     */
    public static function queryRules(BxDolApiV2Operation $oOp, array $aSchemas)
    {
        $aRules = [];
        foreach ($oOp->params as $sName => $aParam) {
            if (!is_array($aParam) || ($aParam['in'] ?? 'query') !== 'query' || in_array($sName, ['cursor', 'limit'], true))
                continue;
            $aRules[$sName] = [
                'required' => !empty($aParam['required']),
                'schema' => isset($aParam['schema']) && is_array($aParam['schema']) ? self::_inlined($aParam['schema'], $aSchemas) : null,
            ];
        }
        return $aRules;
    }

    /**
     * A schema with its references replaced by the schemas they name; null when one names
     * nothing, or they nest deeper than a query param's ever would.
     */
    protected static function _inlined(array $aSchema, array $aSchemas, $iDepth = 0)
    {
        if ($iDepth > 8)
            return null;

        if (isset($aSchema['$ref'])) {
            $sName = is_string($aSchema['$ref']) && str_starts_with($aSchema['$ref'], '#/components/schemas/') ? substr($aSchema['$ref'], strlen('#/components/schemas/')) : '';
            if ($sName === '' || !isset($aSchemas[$sName]) || !is_array($aSchemas[$sName]))
                return null;
            return self::_inlined($aSchemas[$sName], $aSchemas, $iDepth + 1);
        }

        foreach ($aSchema as $sKey => $m)
            if (is_array($m) && ($aSchema[$sKey] = self::_inlinedList($m, $aSchemas, $iDepth + 1)) === null)
                return null;

        return $aSchema;
    }

    /** _inlined() for a value inside a schema: a schema, or a list or map of them (enum values pass as they are). */
    protected static function _inlinedList(array $a, array $aSchemas, $iDepth)
    {
        if (isset($a['$ref']))
            return self::_inlined($a, $aSchemas, $iDepth);

        foreach ($a as $sKey => $m)
            if (is_array($m) && ($a[$sKey] = self::_inlinedList($m, $aSchemas, $iDepth + 1)) === null)
                return null;

        return $a;
    }

    /**
     * Check a request's query against an operation's rules (queryRules()). A query value is a
     * string: for a param described as an integer or a boolean it is read as one first
     * (`true`, `1`, `false`, `0` for a boolean), then checked as a JSON body's field is. An
     * empty value is a param left out. A param the operation does not declare is ignored.
     * @return array field errors, empty when the query is valid
     */
    public static function checkQuery(array $aRules, array $aQuery)
    {
        $aErrors = [];
        $oValidator = null;
        foreach ($aRules as $sName => $aRule) {
            $m = $aQuery[$sName] ?? '';
            if (!is_string($m)) {
                // ?name[]=a&name[]=b
                $aErrors[] = ['field' => (string)$sName, 'code' => 'invalid_type', 'message' => 'Takes one value'];
                continue;
            }
            if ($m === '') {
                if (!empty($aRule['required']))
                    $aErrors[] = ['field' => (string)$sName, 'code' => 'required', 'message' => 'Is required'];
                continue;
            }
            if (empty($aRule['schema']) || !is_array($aRule['schema']))
                continue;

            $aTypes = (array)($aRule['schema']['type'] ?? []);
            if (in_array('integer', $aTypes, true) || in_array('number', $aTypes, true)) {
                if (!preg_match('/^-?[0-9]{1,18}$/', $m)) {
                    $aErrors[] = ['field' => (string)$sName, 'code' => 'invalid_type', 'message' => 'Must be a whole number'];
                    continue;
                }
                $m = (int)$m;
            } elseif (in_array('boolean', $aTypes, true)) {
                if (!in_array($m, ['true', '1', 'false', '0'], true)) {
                    $aErrors[] = ['field' => (string)$sName, 'code' => 'invalid_type', 'message' => 'Use true or false'];
                    continue;
                }
                $m = in_array($m, ['true', '1'], true);
            }

            if ($oValidator === null)
                $oValidator = new BxDolApiV2Validator([]);
            foreach ($oValidator->validate($m, $aRule['schema'], (string)$sName) as $aError)
                $aErrors[] = $aError;
        }
        return $aErrors;
    }

    /**
     * Whether a kept table can be used: it is one of this format, and every file it was read
     * from is still there, unchanged since.
     */
    public static function isFresh($aTable)
    {
        if (!is_array($aTable) || ($aTable['format'] ?? null) !== self::TABLE_FORMAT)
            return false;
        foreach (['operations', 'hooks', 'files', 'classes'] as $sPart)
            if (!isset($aTable[$sPart]) || !is_array($aTable[$sPart]))
                return false;

        foreach ($aTable['files'] as $sFile => $sStamp)
            if (self::fileStamp($sFile) !== $sStamp)
                return false;

        return true;
    }

    /**
     * What tells a file from a changed one without reading it: its modification time and its
     * size (an edit within the same second still shows). Null for a file that is not there.
     */
    public static function fileStamp($sFile)
    {
        return is_file($sFile) ? filemtime($sFile) . ':' . filesize($sFile) : null;
    }

    /**
     * The name the site's table is kept under in the database cache: another one for another
     * set of enabled modules or another sys_revision, and for another list of system endpoint
     * classes (a class added to it is in no file the kept table lists, so nothing else would
     * tell).
     * @param array $aModules names of the enabled modules
     */
    public static function tableCacheName(array $aModules, $sRevision)
    {
        sort($aModules);
        return 'sys_api_v2_routes_' . md5(implode(',', $aModules) . '|' . $sRevision . '|' . self::TABLE_FORMAT . '|' . implode(',', self::$_aSystemEndpoints));
    }

    /**
     * The table this router works with: the site's, or the one of the classes it was given.
     * A given list is what a test or a tool asks about, so its table is never kept.
     */
    protected function _table()
    {
        if ($this->_aOwnClasses === null)
            return self::_siteTable();

        $sKey = implode(',', $this->_aOwnClasses);
        if (!isset(self::$_aTables[$sKey]))
            self::$_aTables[$sKey] = self::buildTable($this->_aOwnClasses) + ['classes' => array_fill_keys($this->_aOwnClasses, '')];
        return self::$_aTables[$sKey];
    }

    /**
     * This site's route table: buildTable() of the system endpoint classes and those of enabled
     * modules, with `classes`: class => the module it belongs to ('' for a system one).
     *
     * Reading it from the classes loads every one of them and reflects every method, so it is
     * kept in the database cache (the engine of sys_db_cache_engine) under a name made of the
     * enabled modules and sys_revision (bumped by every install and update): enabling or
     * disabling a module, and an update, make another name. A request then loads only the
     * class it runs.
     *
     * Code also changes without a new revision (a deploy from the repository, development), so
     * the table lists the files it was read from with their modification times and sizes, and
     * is built again when one of them differs or is gone. A module that gets its first ApiV2
     * file that way is not among them: the table is kept for TABLE_LIFETIME, so it shows up
     * within that time.
     */
    protected static function _siteTable()
    {
        if (self::$_aSite !== null)
            return self::$_aSite;

        $aModules = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aModules[$aModule['name']] = $aModule;
        ksort($aModules);
        self::$_aModules = $aModules;

        $oDb = BxDolDb::getInstance();
        $sName = self::tableCacheName(array_keys($aModules), getParam('sys_revision'));
        $aTable = $oDb->getCache($sName, 'getAll', self::TABLE_LIFETIME);
        if (!self::isFresh($aTable)) {
            $aOwners = array_fill_keys(self::$_aSystemEndpoints, '');
            $aWithFile = [];
            foreach ($aModules as $sModule => $aModule)
                if (file_exists(self::endpointFile($aModule))) {
                    $aWithFile[] = $sModule;
                    $aOwners[$aModule['class_prefix'] . 'ApiV2'] = $sModule;
                }

            $aClasses = self::classesFor($aModules, $aWithFile);
            $aTable = self::buildTable($aClasses) + ['classes' => array_intersect_key($aOwners, array_flip($aClasses))];
            $oDb->setCache($sName, $aTable, self::TABLE_LIFETIME);
        }

        return self::$_aSite = $aTable;
    }

    /**
     * The endpoint classes, loaded: the given ones, or every class of the site's table.
     */
    protected function _getEndpointClasses()
    {
        if ($this->_aOwnClasses !== null)
            return $this->_aOwnClasses;
        if (self::$_aClasses !== null)
            return self::$_aClasses;

        $aClasses = [];
        foreach (self::_siteTable()['classes'] as $sClass => $sModule)
            if (self::_load($sClass, $sModule))
                $aClasses[] = $sClass;

        return self::$_aClasses = $aClasses;
    }

    /**
     * Load an endpoint class of the site's table. A system one is autoloaded when it is used;
     * a module's comes from its ApiV2 file.
     */
    protected static function _load($sClass, $sModule)
    {
        if ($sModule === '' || class_exists($sClass, false))
            return true;

        if (isset(self::$_aModules[$sModule]) && file_exists(self::endpointFile(self::$_aModules[$sModule])))
            bx_import('ApiV2', self::$_aModules[$sModule]);

        return class_exists($sClass, false);
    }

    /**
     * The endpoint classes of a site with these modules enabled: the system ones, then the
     * `<ClassPrefix>ApiV2` class of each enabled module named in $aWithFile. A module that is
     * not enabled adds nothing, so its paths are not in the API or its document.
     * @param array $aModules enabled modules: name => sys_modules row
     * @param array $aWithFile names of the modules that have an ApiV2 file
     */
    public static function classesFor($aModules, $aWithFile)
    {
        $aClasses = self::$_aSystemEndpoints;
        foreach ($aWithFile as $sName) {
            if (!isset($aModules[$sName]))
                continue;
            $sClass = $aModules[$sName]['class_prefix'] . 'ApiV2';
            if (!class_exists($sClass, false) && file_exists(self::endpointFile($aModules[$sName])))
                bx_import('ApiV2', $aModules[$sName]);
            if (class_exists($sClass, false))
                $aClasses[] = $sClass;
        }
        return $aClasses;
    }

    /**
     * Where a module's endpoint class would be: `classes/<ClassPrefix>ApiV2.php`.
     */
    public static function endpointFile($aModule)
    {
        return BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'classes/' . $aModule['class_prefix'] . 'ApiV2.php';
    }

    /**
     * The endpoint classes of this site, all loaded: the system ones, then those of enabled
     * modules.
     */
    public function endpointClasses()
    {
        return $this->_getEndpointClasses();
    }

    /**
     * The endpoint objects (one per class and request) whose class has a public method of this
     * name: how endpoints ask each other for what they know without naming modules. The class
     * of $sModule comes first. Only the classes that have the method are loaded: the site's
     * table lists them for the names that start with HOOK_PREFIX, so a hook is named that way.
     * @param string $sMethod e.g. apiV2ContentTarget (BxDolApiV2Targets), apiV2Sync (GET /sync)
     */
    public static function hooks($sMethod, $sModule = '')
    {
        $sOwn = '';
        if ($sModule !== '' && ($aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule)) && !empty($aModule['class_prefix']))
            $sOwn = $aModule['class_prefix'] . 'ApiV2';

        $aTable = self::_siteTable();
        $aResult = [];
        foreach ($aTable['hooks'][$sMethod] ?? [] as $sClass) {
            if (!isset(self::$_aHookObjects[$sClass])) {
                if (!self::_load($sClass, $aTable['classes'][$sClass] ?? ''))
                    continue;
                self::$_aHookObjects[$sClass] = new $sClass();
            }
            if ($sClass === $sOwn)
                array_unshift($aResult, self::$_aHookObjects[$sClass]);
            else
                $aResult[] = self::$_aHookObjects[$sClass];
        }
        return $aResult;
    }

    /**
     * Forget the endpoint table of this request (tests that turn modules on and off).
     */
    public static function reset()
    {
        self::$_aSite = null;
        self::$_aModules = [];
        self::$_aClasses = null;
        self::$_aTables = [];
        self::$_aOperationSets = [];
        self::$_aSchemaSets = [];
        self::$_aHookObjects = [];
    }

    protected function _match($sMethod, $sPath)
    {
        $aAllowed = [];
        foreach ($this->getOperations() as $aOp) {
            if (!preg_match($aOp['regex'], $sPath, $m))
                continue;
            if ($aOp['attr']->method !== $sMethod) {
                $aAllowed[] = $aOp['attr']->method;
                continue;
            }
            return [$aOp, array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY)];
        }

        if ($aAllowed)
            throw new BxDolApiV2Problem(405, 'method_not_allowed', 'Use ' . implode(', ', array_unique($aAllowed)), [], ['Allow' => implode(', ', array_unique($aAllowed))]);

        throw new BxDolApiV2Problem(404, 'no_such_endpoint', 'There is no API v2 endpoint at this path');
    }

    /**
     * @param string $sRaw the request body as sent (not read for multipart)
     * @param array $aForm a multipart body's fields, as PHP parsed them
     */
    protected function _readBody($sMethod, BxDolApiV2Operation $oOp, $sRaw = '', $aForm = [])
    {
        if (!in_array($sMethod, ['POST', 'PUT', 'PATCH'], true) || $oOp->body === null)
            return null;

        $sContentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));

        if (str_starts_with($oOp->body, 'multipart:')) {
            if ($sContentType !== 'multipart/form-data')
                throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'Send the request as multipart/form-data');
            return $aForm;
        }

        if ($sRaw === '')
            $mBody = [];
        elseif ($sContentType !== 'application/json')
            throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'Send the request body as application/json');
        else {
            $mBody = json_decode($sRaw, true, 32);
            if (json_last_error() !== JSON_ERROR_NONE)
                throw new BxDolApiV2Problem(400, 'invalid_json', 'The request body is not valid JSON: ' . json_last_error_msg());
        }

        $oValidator = new BxDolApiV2Validator($this->getSchemas());
        $aErrors = $oValidator->validate($mBody, ['$ref' => '#/components/schemas/' . $oOp->body]);
        if ($aErrors)
            throw BxDolApiV2Problem::validation($aErrors);

        return $mBody;
    }

    protected function _sendCors()
    {
        // Bearer-token API: any origin may call it, but never with the visitor's cookies
        // (no Access-Control-Allow-Credentials), so a cookie session stays same-site.
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Accept-Language, If-None-Match, Idempotency-Key');
        header('Access-Control-Expose-Headers: ETag, Location, Retry-After, WWW-Authenticate, Idempotent-Replayed');
        header('Access-Control-Max-Age: 600');
    }

    /**
     * The answer to send for an endpoint's response: ['status' => int, 'headers' => [name =>
     * value], 'body' => string|null]. A JSON answer of 200 to GET (or HEAD) of at most
     * ETAG_MAX_BYTES carries a weak ETag, a digest of the body; one that If-None-Match names
     * (weakly, in a list, or `*`) is 304 with no body and no Content-Type, its ETag,
     * Cache-Control and Vary kept. Writes, other statuses and larger bodies get no ETag.
     * @param string|null $sIfNoneMatch the request's If-None-Match header
     */
    public static function answer(BxDolApiV2Response $oResponse, $sMethod, $sIfNoneMatch = null)
    {
        // texts are in the viewer's language, and what a viewer may see depends on who it is
        $aHeaders = $oResponse->aHeaders + [
            'Vary' => 'Authorization, Cookie, Accept-Language',
            'Cache-Control' => 'private, no-cache',
        ];

        if ($oResponse->mBody === null || $oResponse->iStatus === 204)
            return ['status' => $oResponse->iStatus, 'headers' => $aHeaders, 'body' => null];

        $sJson = self::json($oResponse->mBody);

        // strlen is the byte count of the encoded body here, not a text length
        if (in_array($sMethod, ['GET', 'HEAD'], true) && $oResponse->iStatus === 200 && !isset($aHeaders['ETag']) && strlen($sJson) <= self::ETAG_MAX_BYTES) {
            $aHeaders['ETag'] = self::etag($sJson);
            if ($sIfNoneMatch !== null && self::etagMatches($sIfNoneMatch, $aHeaders['ETag']))
                return ['status' => 304, 'headers' => $aHeaders, 'body' => null];
        }

        $aHeaders['Content-Type'] = 'application/json; charset=utf-8';
        return ['status' => $oResponse->iStatus, 'headers' => $aHeaders, 'body' => $sJson];
    }

    /**
     * `W/"<hex>"`: weak, because compression changes the bytes sent.
     */
    public static function etag($sBody)
    {
        return 'W/"' . md5($sBody) . '"';
    }

    /**
     * Whether an If-None-Match header names the tag: `*`, or one of a comma-separated list,
     * compared weakly (W/ is ignored on both sides).
     */
    public static function etagMatches($sIfNoneMatch, $sTag)
    {
        $fBare = function ($s) {
            $s = trim($s);
            return str_starts_with($s, 'W/') ? substr($s, 2) : $s;
        };
        $sTag = $fBare($sTag);
        foreach (explode(',', (string)$sIfNoneMatch) as $sWanted) {
            $sWanted = trim($sWanted);
            if ($sWanted === '*' || ($sWanted !== '' && $fBare($sWanted) === $sTag))
                return true;
        }
        return false;
    }

    public static function problemAnswer(BxDolApiV2Problem $e)
    {
        return [
            'status' => $e->getStatus(),
            'headers' => $e->getHeaders() + [
                'Cache-Control' => 'no-store',
                'Content-Type' => 'application/problem+json; charset=utf-8',
            ],
            'body' => self::json($e->toArray()),
        ];
    }

    /**
     * The query of a request as one string, the same for the same parameters in any order.
     */
    public static function queryString(array $aQuery)
    {
        ksort($aQuery);
        return http_build_query($aQuery, '', '&', PHP_QUERY_RFC3986);
    }

    protected function _emit(array $aAnswer, $sMethod)
    {
        // headers first: PHP turns the status into 401 for WWW-Authenticate and into 302 for
        // Location, and the status set after them is the one sent
        foreach ($aAnswer['headers'] as $sName => $sValue)
            header($sName . ': ' . $sValue);
        http_response_code($aAnswer['status']);

        if ($aAnswer['body'] === null) {
            // no body (204, 304): no Content-Type either, not even PHP's default one
            ini_set('default_mimetype', '');
            return;
        }

        if ($sMethod !== 'HEAD')
            echo $aAnswer['body'];
    }

    /**
     * Send a streamed answer (BxDolApiV2Response::stream): its headers, then each piece its
     * writer is given, flushed at once, with no output buffer or compression in between. What
     * fails while it streams is the endpoint's to say in the stream: the status is sent already.
     */
    protected function _stream(BxDolApiV2Response $oResponse)
    {
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');
        @ini_set('display_errors', '0');
        if (function_exists('apache_setenv'))
            @apache_setenv('no-gzip', '1');
        while (ob_get_level())
            ob_end_clean();

        foreach ($oResponse->aHeaders + ['Vary' => 'Authorization, Cookie, Accept-Language'] as $sName => $sValue)
            header($sName . ': ' . $sValue);
        http_response_code($oResponse->iStatus);

        $fWrite = function ($s) {
            echo $s;
            flush();
        };
        try {
            ($oResponse->fStream)($fWrite);
        }
        catch (Throwable $e) {
            error_log('UNA API v2: a stream ended early: ' . get_class($e) . ': ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
        }
    }

    /**
     * Whether the endpoint set a cookie (a sign-in, a session that moved its end): such an
     * answer carries a credential and is never kept for Idempotency-Key repeats.
     */
    protected static function _setsCookie()
    {
        foreach (headers_list() as $sHeader)
            if (stripos($sHeader, 'set-cookie:') === 0)
                return true;
        return false;
    }

    public static function json($m)
    {
        return json_encode($m, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_INVALID_UTF8_SUBSTITUTE);
    }
}

/** @} */
