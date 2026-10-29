<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database migrations: changes to the database of an installed site, each applied once.
 *
 * Install SQL reaches only new installs. A change that an installed site also needs goes in a
 * migration file, which periodic/migration.php applies once per database and records in the
 * `sys_migrations` ledger. migrations/README.md has the rules for writing one.
 *
 * Folders:
 * - `migrations/` at the root: common migrations, which belong to no module;
 * - `modules/<vendor>/<module>/migrations/` (`modules/system/migrations/` for the system
 *   module): a module's own. They run while the module is installed and enabled; installing
 *   a module records its migrations without running them, since its install SQL has them.
 *
 * File names are `YYYYMMDDNN_short_desc.ext`, NN a serial number for the day (00, 01, ...).
 * The name without extension is the migration id; the YYYYMMDDNN part is unique in its folder.
 * The extension sets the format:
 * - `.sql`: statements, run one by one with an empty sql_mode, like install SQL;
 * - `.php`: code run with UNA loaded; returning false or throwing fails it, and a returned
 *   function is called the same way;
 * - `.xml`: language strings in the update format of module update packs: `string_add`,
 *   `string_upd` and `string_del` inside `<resources name="en" flag="gb" title="English">`.
 *
 * Every file declares `UNA-Migration-Min-System-Version: X.Y.Z` in a comment: it does not run,
 * and the run stops, while the installed system is older.
 *
 * A baseline also declares `UNA-Migration-Baseline-Covers: <id> <id> ...`, earlier migrations
 * of its folder that were folded into install SQL and deleted. A database that has all of them
 * in the ledger just records the baseline. One that misses some runs the baseline's own
 * statements or code, which must bring it to the state the covered migrations would have.
 * It runs where the first migration it covers ran.
 *
 * Migrations run in id order across all folders; on the same id common runs first, then system,
 * then modules, each after the modules it depends on and otherwise by name. The first failure
 * stops the run: it is rolled back where the tables allow, recorded as `failed` with its error,
 * and tried again on the next run.
 *
 * Which migrations may run depends on the site's update channel, the `sys_upgrade_channel`
 * option. On `dev` every migration in the files may. On `beta` and `stable` only those a signed
 * release manifest lists will; reading manifests is not built yet, so there none run.
 *
 * A run first compares the files of migrations that ran with the checksums in the ledger. A
 * changed or removed file (one no baseline covers) stops it until someone checks the database
 * and accepts the files as they are (accept()).
 */
class BxDolMigrations
{
    public const ID_PATTERN = '/^(\d{4})(\d{2})(\d{2})\d{2}_[a-z0-9]+(?:_[a-z0-9]+)*$/';
    public const TYPES = ['sql', 'php', 'xml'];
    public const META_MIN_VERSION = 'UNA-Migration-Min-System-Version';
    public const META_COVERS = 'UNA-Migration-Baseline-Covers';
    public const VERSION_PATTERN = '/^\d+\.\d+\.\d+(?:-[A-Za-z]+\d*)?$/';
    public const SCOPE_COMMON = 'common';
    public const SCOPE_SYSTEM = 'system';
    public const SCOPE_MODULE = 'module';
    public const STATUS_APPLIED = 'applied';
    public const STATUS_BASELINE = 'baseline';
    public const STATUS_FAILED = 'failed';
    public const CHANNEL_OPTION = 'sys_upgrade_channel';
    public const CHANNEL_DEV = 'dev';
    public const CHANNELS = ['stable', 'beta', self::CHANNEL_DEV];
    /** Ledger row, never a migration id: migrations ran and caches and languages still need rebuilding. */
    public const REFRESH_PENDING = '~refresh-pending';

    protected const SCOPE_ORDER = [self::SCOPE_COMMON => 0, self::SCOPE_SYSTEM => 1, self::SCOPE_MODULE => 2];
    protected const LANGUAGE_OPERATIONS = ['string_add', 'string_upd', 'string_del'];

    protected BxDolMigrationsQuery $_oQuery;
    /** @var list<array{scope: string, module: string, dir: string, lang_category: string}>|null */
    protected ?array $_aSources;
    /** @var callable */
    protected $_fLog;
    protected ?string $_sSystemVersion;
    protected ?string $_sChannel;

    /**
     * @param array|null $aSources folders to read, see getSources(); null reads the site's
     * @param string|null $sSystemVersion null reads the installed system version
     * @param string|null $sChannel null reads the site's update channel
     */
    public function __construct(BxDolMigrationsQuery $oQuery, ?array $aSources = null, ?callable $fLog = null, ?string $sSystemVersion = null, ?string $sChannel = null)
    {
        $this->_oQuery = $oQuery;
        $this->_aSources = $aSources;
        $this->_fLog = $fLog ?? function (string $s): void {};
        $this->_sSystemVersion = $sSystemVersion;
        $this->_sChannel = $sChannel;
    }

    public static function getInstance(): self
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            BxDolDb::getInstance();
            $GLOBALS['bxDolClasses'][__CLASS__] = new self(new BxDolMigrationsQuery());
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * The site's update channel: dev, beta or stable.
     */
    public function getChannel(): string
    {
        return $this->_sChannel ?? (string)getParam(self::CHANNEL_OPTION);
    }

    /**
     * Folders whose migrations run: the common one and those of enabled modules. A module's
     * `rank` puts it after the modules it depends on; `dependency_error` says why its
     * migrations cannot run.
     *
     * @return list<array{scope: string, module: string, dir: string, lang_category: string, rank?: int, dependency_error?: string}>
     */
    public function getSources(): array
    {
        if ($this->_aSources !== null)
            return $this->_aSources;

        $aResult = [[
            'scope' => self::SCOPE_COMMON,
            'module' => '',
            'dir' => BX_DIRECTORY_PATH_ROOT . 'migrations',
            'lang_category' => '',
        ]];

        $aModules = $this->_oQuery->getEnabledModules();
        $aOrder = self::orderModules($aModules);
        foreach ($aModules as $aModule)
            if (($aSource = $this->_getModuleSource($aModule)) !== null)
                $aResult[] = array_merge($aSource, [
                    'rank' => $aOrder['rank'][$aModule['name']],
                    'dependency_error' => $aOrder['errors'][$aModule['name']] ?? '',
                ]);

        return $aResult;
    }

    /**
     * Order modules so each comes after the modules it depends on (`sys_modules`.`dependencies`,
     * from `dependencies` in the module's config.php: names or URIs), otherwise by name.
     *
     * @param list<array{name: string, uri: string, dependencies: string}> $aModules enabled modules
     * @return array{rank: array<string, int>, errors: array<string, string>} rank by module name; errors for modules whose dependencies are not enabled or depend on each other
     */
    public static function orderModules(array $aModules): array
    {
        $aByKey = [];
        foreach ($aModules as $aModule) {
            $aByKey[$aModule['name']] = $aModule['name'];
            if (($aModule['uri'] ?? '') !== '' && !isset($aByKey[$aModule['uri']]))
                $aByKey[$aModule['uri']] = $aModule['name'];
        }

        $aErrors = [];
        $aDepends = [];
        foreach ($aModules as $aModule) {
            $sName = $aModule['name'];
            $aDepends[$sName] = [];
            foreach (preg_split('/\s*,\s*/', trim((string)($aModule['dependencies'] ?? '')), -1, PREG_SPLIT_NO_EMPTY) as $sKey) {
                if (!isset($aByKey[$sKey]))
                    $aErrors[$sName] = "needs the $sKey module, which is not installed and enabled";
                else if ($aByKey[$sKey] !== $sName)
                    $aDepends[$sName][$aByKey[$sKey]] = true;
            }
        }

        $aRank = [];
        $aLeft = $aDepends;
        ksort($aLeft, SORT_STRING);
        while ($aLeft) {
            $sNext = null;
            foreach ($aLeft as $sName => $aNeeds)
                if (!array_diff_key($aNeeds, $aRank)) {
                    $sNext = $sName;
                    break;
                }

            if ($sNext === null) {
                // What is left depends on each other; they go last, by name.
                foreach ($aLeft as $sName => $aNeeds) {
                    $aErrors[$sName] = 'depends on modules that depend on it: ' . implode(', ', array_keys(array_intersect_key($aNeeds, $aLeft)));
                    $aRank[$sName] = count($aRank);
                }
                break;
            }

            $aRank[$sNext] = count($aRank);
            unset($aLeft[$sNext]);
        }

        return ['rank' => $aRank, 'errors' => $aErrors];
    }

    /**
     * Every migration of the sources, in the order they run.
     *
     * @return list<array> source fields plus readFile() fields and `label`
     */
    public function listMigrations(): array
    {
        $aResult = [];
        foreach ($this->getSources() as $aSource)
            foreach (self::readFolder($aSource['dir']) as $aFile)
                $aResult[] = array_merge($aSource, $aFile, [
                    'label' => ($aSource['module'] !== '' ? $aSource['module'] : self::SCOPE_COMMON) . ': ' . $aFile['name'],
                ]);

        // A baseline takes the place of the first migration it covers, so whatever other folders'
        // migrations came after that one still runs after the baseline's changes.
        $fPosition = function (array $a): string {
            return substr($a['covers'] ? min($a['covers']) : $a['id'], 0, 10);
        };
        usort($aResult, function ($a, $b) use ($fPosition) {
            return [$fPosition($a), self::SCOPE_ORDER[$a['scope']], $a['rank'] ?? 0, $a['module'], $a['id']]
                <=> [$fPosition($b), self::SCOPE_ORDER[$b['scope']], $b['rank'] ?? 0, $b['module'], $b['id']];
        });

        return $aResult;
    }

    /**
     * Run every migration the ledger lacks, in order, and stop at the first failure.
     *
     * Nothing runs while a migration that ran has a changed or removed file (`problems`, see
     * accept()). Migrations the channel does not allow wait (`waiting`), and so do all after
     * the first of them.
     *
     * $fRefresh rebuilds what the migrations made stale and returns what failed, or ''; null
     * means refresh(). It runs while the refresh flag is set, also after a failure (the
     * migrations before it did run), and under the same lock as the migrations, so one run
     * cannot clear the flag that another run set after its own migrations.
     *
     * @return array{applied: list<string>, baseline: list<string>, waiting: list<string>, failed: string, error: string, problems: list<string>, refreshed: bool, refresh_error: string}
     */
    public function run(?callable $fRefresh = null): array
    {
        $aResult = ['applied' => [], 'baseline' => [], 'waiting' => [], 'failed' => '', 'error' => '', 'problems' => [], 'refreshed' => false, 'refresh_error' => ''];
        $fRefresh = $fRefresh ?? [$this, 'refresh'];

        $this->_withLock(function () use ($fRefresh, &$aResult) {
            $aMigrations = $this->listMigrations();
            foreach ($this->_checkFiles($aMigrations) as $aProblem)
                $aResult['problems'][] = $aProblem['message'];
            if (!$aResult['problems'])
                $this->_runMigrations($aMigrations, $aResult);
            if (!$this->isRefreshPending())
                return;

            try {
                $aResult['refresh_error'] = (string)$fRefresh();
            }
            catch (Throwable $e) {
                $aResult['refresh_error'] = $e->getMessage();
            }
            if ($aResult['refresh_error'] === '') {
                $this->_oQuery->forget('', self::REFRESH_PENDING);
                $aResult['refreshed'] = true;
            }
        });

        return $aResult;
    }

    /**
     * What a run would do, without running anything.
     *
     * @return array{channel: string, version: string, recorded: int, pending: list<string>, failures: list<string>, problems: list<string>}
     */
    public function status(): array
    {
        $aMigrations = $this->listMigrations();
        $aDone = $this->getRecorded();

        $aResult = [
            'channel' => $this->getChannel(),
            'version' => $this->_sSystemVersion ?? $this->_oQuery->getSystemVersion(),
            'recorded' => array_sum(array_map('count', $aDone)),
            'pending' => [],
            'failures' => [],
            'problems' => array_column($this->_checkFiles($aMigrations), 'message'),
        ];
        $aFailures = $this->getFailures();
        foreach ($aMigrations as $aMigration) {
            if (isset($aDone[$aMigration['module']][$aMigration['id']]))
                continue;

            $aResult['pending'][] = $aMigration['label'];
            // Only for files still waiting: a failed file that was removed has nothing to fix.
            if (($aFailure = $aFailures[$aMigration['module']][$aMigration['id']] ?? null) !== null)
                $aResult['failures'][] = ($aMigration['module'] !== '' ? $aMigration['module'] : self::SCOPE_COMMON) . ": {$aMigration['id']} failed " . date('Y-m-d H:i:s', $aFailure['attempted']) . ': ' . $aFailure['error'];
        }

        return $aResult;
    }

    /**
     * Take the files of migrations that ran as they are now, after someone checked that the
     * database is right: a changed file's new checksum, or none for a removed file. A run
     * stops until then (see run()).
     *
     * @return list<string> what was accepted
     */
    public function accept(): array
    {
        $aResult = [];

        $this->_withLock(function () use (&$aResult) {
            foreach ($this->_checkFiles($this->listMigrations()) as $aProblem) {
                $this->_oQuery->setChecksum($aProblem['module'], $aProblem['id'], $aProblem['checksum']);
                $aResult[] = $aProblem['message'];
            }
        });

        return $aResult;
    }

    /**
     * Record every migration as done without running it: for a database the installer has just
     * created from this same code, whose install SQL already has every change.
     *
     * @return int number of migrations recorded
     */
    public function baseline(): int
    {
        $iCount = 0;

        $this->_withLock(function () use (&$iCount) {
            $iCount = $this->_recordBaseline($this->listMigrations());
        });

        return $iCount;
    }

    /**
     * Record a module's migrations without running them, when the module is installed: its
     * install SQL has them. Does nothing on a site without the ledger yet; the first run of
     * periodic/migration.php creates it.
     *
     * @param string $sPath the module's path, as in `sys_modules`: `vendor/module/`
     * @return int number of migrations recorded
     */
    public function baselineModule(string $sPath): int
    {
        return $this->_oQuery->withExceptions(function () use ($sPath) {
            if (!$this->_oQuery->isLedger())
                return 0;

            $aModule = $this->_oQuery->getModuleByPath($sPath);
            if ($aModule === null || ($aSource = $this->_getModuleSource($aModule)) === null)
                return 0;

            $aMigrations = [];
            foreach (self::readFolder($aSource['dir']) as $aFile)
                $aMigrations[] = array_merge($aSource, $aFile);

            return $this->_recordBaseline($aMigrations);
        });
    }

    /**
     * Migrations that are done: applied, or recorded as a baseline.
     *
     * @return array<string, array<string, array{checksum: string, status: string, applied: int, attempted: int, error: string}>> by module ('' for common), then by id
     */
    public function getRecorded(): array
    {
        return $this->_getRows(function (array $aRow) {
            return in_array($aRow['status'], [self::STATUS_APPLIED, self::STATUS_BASELINE], true);
        });
    }

    /**
     * Migrations whose last run failed, with the error.
     *
     * @return array<string, array<string, array{checksum: string, status: string, applied: int, attempted: int, error: string}>> by module ('' for common), then by id
     */
    public function getFailures(): array
    {
        return $this->_getRows(function (array $aRow) {
            return $aRow['status'] === self::STATUS_FAILED;
        });
    }

    /**
     * Whether migrations ran and the rebuild after them (languages, caches) has not succeeded
     * yet. The flag is set before the first migration of a run, so a run that dies or fails to
     * rebuild leaves it for the next run.
     */
    public function isRefreshPending(): bool
    {
        return $this->_oQuery->withExceptions(function () {
            return $this->_oQuery->isLedger() && $this->_oQuery->isRecorded('', self::REFRESH_PENDING);
        });
    }

    /**
     * Migrations change rows that UNA caches: options, pages, menus, language strings.
     *
     * @return string what failed, or '' on success
     */
    public function refresh(): string
    {
        $oDb = BxDolDb::getInstance();
        $oDb->cleanMemoryAll();
        $oDb->cacheParams(true, true);

        if (!BxDolStudioLanguagesUtils::getInstance()->compileLanguage())
            return 'compiling languages';

        $iRevision = (int)getParam('sys_revision', false);
        $oCache = BxDolCacheUtilities::getInstance();
        foreach (['db', 'content', 'template', 'css', 'js'] as $sCache) {
            // false: that cache is off, so there is nothing to clear.
            $mixedResult = $oCache->clear($sCache);
            if (is_array($mixedResult) && (int)$mixedResult['code'] !== 0)
                return "clearing the $sCache cache";
        }

        // clear() bumps it only when the CSS or JS cache is on.
        if ((int)getParam('sys_revision', false) === $iRevision)
            setParam('sys_revision', $iRevision + 1);

        return '';
    }

    /**
     * Migration files of a folder, keyed by id. Dot files and `*.md` are not migrations.
     *
     * @return array<string, array> readFile() fields
     * @throws UnexpectedValueException naming the file, for a file that is not a valid migration
     */
    public static function readFolder(string $sDir): array
    {
        if (!is_dir($sDir))
            return [];

        $aNames = array_filter(scandir($sDir), function ($s) {
            return $s[0] !== '.' && !preg_match('/\.md$/i', $s);
        });
        sort($aNames, SORT_STRING);

        $aResult = [];
        $aSerials = [];
        foreach ($aNames as $sName) {
            $aFile = self::readFile($sDir . '/' . $sName);

            $sSerial = substr($aFile['id'], 0, 10);
            if (isset($aSerials[$sSerial]))
                throw new UnexpectedValueException("$sName: {$aSerials[$sSerial]} has the same YYYYMMDDNN; give one of them the next NN");
            $aSerials[$sSerial] = $sName;

            $aResult[$aFile['id']] = $aFile;
        }

        foreach ($aResult as $aFile)
            foreach ($aFile['covers'] as $sCovered)
                if (strcmp($sCovered, $aFile['id']) >= 0)
                    throw new UnexpectedValueException("{$aFile['name']}: covers $sCovered, which is not earlier than the baseline");

        return $aResult;
    }

    /**
     * Read and check one migration file.
     *
     * @return array{name: string, id: string, path: string, type: string, checksum: string, min_version: string, covers: list<string>}
     * @throws UnexpectedValueException naming the file
     */
    public static function readFile(string $sPath): array
    {
        $sName = basename($sPath);
        if (!is_file($sPath))
            throw new UnexpectedValueException("$sName: not a file");

        $sType = strtolower(pathinfo($sName, PATHINFO_EXTENSION));
        $sId = pathinfo($sName, PATHINFO_FILENAME);
        if (!in_array($sType, self::TYPES, true))
            throw new UnexpectedValueException("$sName: unknown migration type; use .sql, .php or .xml");
        if (!preg_match(self::ID_PATTERN, $sId, $aMatch) || !checkdate((int)$aMatch[2], (int)$aMatch[3], (int)$aMatch[1]) || $sName !== $sId . '.' . $sType)
            throw new UnexpectedValueException("$sName: migration file names are YYYYMMDDNN_short_desc.$sType, lowercase, words joined by _");

        $sContent = (string)file_get_contents($sPath);

        $sVersion = self::parseMeta($sContent, self::META_MIN_VERSION);
        if ($sVersion === null)
            throw new UnexpectedValueException("$sName: no " . self::META_MIN_VERSION . ' line');
        if (!preg_match(self::VERSION_PATTERN, $sVersion))
            throw new UnexpectedValueException("$sName: " . self::META_MIN_VERSION . " is '$sVersion', not a version like 15.0.0");

        $aCovers = [];
        if (($sCovers = self::parseMeta($sContent, self::META_COVERS)) !== null) {
            if ($sType === 'xml')
                throw new UnexpectedValueException("$sName: a baseline is .sql or .php");

            $aCovers = preg_split('/[\s,]+/', $sCovers, -1, PREG_SPLIT_NO_EMPTY);
            if (!$aCovers)
                throw new UnexpectedValueException("$sName: " . self::META_COVERS . ' lists no migrations');
            foreach ($aCovers as $sCovered)
                if (!preg_match(self::ID_PATTERN, $sCovered))
                    throw new UnexpectedValueException("$sName: covers '$sCovered', which is not a migration id (a file name without extension)");
        }

        if ($sType === 'sql' && !mb_check_encoding($sContent, 'UTF-8'))
            throw new UnexpectedValueException("$sName: not valid UTF-8");

        if ($sType === 'php' && !preg_match('/^<\?php\s+defined\(\s*[\'"]BX_DOL[\'"]\s*\)\s+or\s+die\b/', $sContent))
            throw new UnexpectedValueException("$sName: a PHP migration starts with <?php defined('BX_DOL') or die('hack attempt');");

        if ($sType === 'xml') {
            try {
                self::readLanguageFile($sContent);
            }
            catch (UnexpectedValueException $e) {
                throw new UnexpectedValueException("$sName: " . $e->getMessage(), 0, $e);
            }
        }

        return [
            'name' => $sName,
            'id' => $sId,
            'path' => $sPath,
            'type' => $sType,
            'checksum' => hash('sha256', $sContent),
            'min_version' => $sVersion,
            'covers' => $aCovers,
        ];
    }

    /**
     * The value on the first `Key: value` line, in any comment style, or null.
     */
    public static function parseMeta(string $sContent, string $sKey): ?string
    {
        if (!preg_match('/' . preg_quote($sKey, '/') . ':[ \t]*([^\r\n]*?)[ \t]*(?:\*\/|-->)?[ \t]*\r?$/m', $sContent, $aMatch))
            return null;

        return $aMatch[1];
    }

    /**
     * Check a language migration and read its changes.
     *
     * @return array{name: string, category: string, add: array<string, string>, upd: array<string, string>, del: list<string>}
     * @throws UnexpectedValueException
     */
    public static function readLanguageFile(string $sXml): array
    {
        $bErrors = libxml_use_internal_errors(true);
        libxml_clear_errors();
        $oXml = simplexml_load_string($sXml, 'SimpleXMLElement', LIBXML_NOCDATA | LIBXML_NONET);
        $aErrors = libxml_get_errors();
        libxml_clear_errors();
        libxml_use_internal_errors($bErrors);

        if ($oXml === false) {
            $oError = $aErrors[0] ?? null;
            throw new UnexpectedValueException('not valid XML' . ($oError ? ' (line ' . $oError->line . ': ' . trim($oError->message) . ')' : ''));
        }
        if ($oXml->getName() !== 'resources')
            throw new UnexpectedValueException('the root element is <resources>');
        foreach (['name', 'flag', 'title'] as $sAttribute)
            if (trim((string)$oXml[$sAttribute]) === '')
                throw new UnexpectedValueException("<resources> has no $sAttribute attribute");

        $aResult = ['name' => (string)$oXml['name'], 'category' => (string)$oXml['category'], 'add' => [], 'upd' => [], 'del' => []];
        foreach ($oXml->children() as $oString) {
            $sOperation = $oString->getName();
            if (!in_array($sOperation, self::LANGUAGE_OPERATIONS, true))
                throw new UnexpectedValueException("<$sOperation> is not one of <" . implode('>, <', self::LANGUAGE_OPERATIONS) . '>');

            $sKey = (string)$oString['name'];
            if (!preg_match('/^\S+$/', $sKey))
                throw new UnexpectedValueException("<$sOperation> has no name attribute");

            if ($sOperation === 'string_del')
                $aResult['del'][] = $sKey;
            else
                $aResult[$sOperation === 'string_add' ? 'add' : 'upd'][$sKey] = (string)$oString;
        }

        return $aResult;
    }

    /**
     * Check every migration folder of a source tree without a database, for CI.
     *
     * @return list<string> problems, each naming its folder and file
     */
    public static function validateTree(string $sRoot): array
    {
        $sRoot = rtrim($sRoot, '/');
        $aDirs = array_merge(
            [$sRoot . '/migrations'],
            glob($sRoot . '/modules/*/migrations', GLOB_ONLYDIR) ?: [],
            glob($sRoot . '/modules/*/*/migrations', GLOB_ONLYDIR) ?: []
        );

        $aResult = [];
        foreach ($aDirs as $sDir) {
            try {
                self::readFolder($sDir);
            }
            catch (UnexpectedValueException $e) {
                $aResult[] = substr($sDir, strlen($sRoot) + 1) . '/' . $e->getMessage();
            }
        }

        return $aResult;
    }

    /**
     * Split SQL into statements. Comments are dropped, except MySQL's executable `/*! ... *\/`.
     * Unlike BxDolDb::executeSQL, line breaks inside a statement are kept, so a line may end
     * or begin with a keyword. Walks characters, not bytes, so text in any language is kept
     * whole.
     *
     * @return list<string>
     * @throws UnexpectedValueException for SQL that is not valid UTF-8
     */
    public static function splitSql(string $sSql): array
    {
        $aChars = preg_split('//u', $sSql, -1, PREG_SPLIT_NO_EMPTY);
        if ($aChars === false)
            throw new UnexpectedValueException('not valid UTF-8');

        $aResult = [];
        $aDelimiter = [';'];
        $sCurrent = '';
        $sQuote = '';
        $iLen = count($aChars);
        // Index of the next line break at or after $i, or $iLen.
        $fLineEnd = function (int $i) use ($aChars, $iLen): int {
            while ($i < $iLen && $aChars[$i] !== "\n")
                $i++;
            return $i;
        };

        for ($i = 0; $i < $iLen; $i++) {
            $c = $aChars[$i];

            if ($sQuote !== '') {
                $sCurrent .= $c;
                if ($c === '\\' && $sQuote !== '`' && $i + 1 < $iLen)
                    $sCurrent .= $aChars[++$i];
                else if ($c === $sQuote)
                    $sQuote = '';
                continue;
            }

            if (($i === 0 || $aChars[$i - 1] === "\n") && trim($sCurrent) === '') {
                $iEnd = $fLineEnd($i);
                if (preg_match('/^[ \t]*DELIMITER[ \t]+(\S+)/i', implode('', array_slice($aChars, $i, $iEnd - $i)), $aMatch)) {
                    $aDelimiter = preg_split('//u', $aMatch[1], -1, PREG_SPLIT_NO_EMPTY);
                    $i = $iEnd;
                    continue;
                }
            }

            $sNext = $aChars[$i + 1] ?? '';
            if ($c === '#' || ($c === '-' && $sNext === '-' && ($i + 2 >= $iLen || ctype_space($aChars[$i + 2])))) {
                $i = $fLineEnd($i) - 1;
                continue;
            }
            if ($c === '/' && $sNext === '*') {
                $iEnd = $i + 2;
                while ($iEnd < $iLen && !($aChars[$iEnd] === '*' && ($aChars[$iEnd + 1] ?? '') === '/'))
                    $iEnd++;
                $iEnd = min($iEnd + 2, $iLen);
                // A space keeps `SELECT/**/1` two tokens.
                $sCurrent .= ($aChars[$i + 2] ?? '') === '!' ? implode('', array_slice($aChars, $i, $iEnd - $i)) : ' ';
                $i = $iEnd - 1;
                continue;
            }

            if (array_slice($aChars, $i, count($aDelimiter)) === $aDelimiter) {
                if (($sStatement = trim($sCurrent)) !== '')
                    $aResult[] = $sStatement;
                $sCurrent = '';
                $i += count($aDelimiter) - 1;
                continue;
            }

            if ($c === '\'' || $c === '"' || $c === '`')
                $sQuote = $c;
            $sCurrent .= $c;
        }

        if (($sStatement = trim($sCurrent)) !== '')
            $aResult[] = $sStatement;

        return $aResult;
    }

    protected function _runMigrations(array $aMigrations, array &$aResult): void
    {
        $aDone = $this->getRecorded();
        $sVersion = $this->_sSystemVersion ?? $this->_oQuery->getSystemVersion();
        $bAllowed = $this->getChannel() === self::CHANNEL_DEV;
        $bFlagged = false;

        foreach ($aMigrations as $aMigration) {
            $sModule = $aMigration['module'];
            $sId = $aMigration['id'];
            $sLabel = $aMigration['label'];

            if (isset($aDone[$sModule][$sId]))
                continue;

            // The manifest check of beta and stable goes here; until then only dev runs migrations.
            if (!$bAllowed || $aResult['waiting']) {
                $aResult['waiting'][] = $sLabel;
                continue;
            }

            $sError = '';
            if (version_compare($sVersion, $aMigration['min_version'], '<'))
                $sError = "needs UNA {$aMigration['min_version']} or later; this site has " . ($sVersion !== '' ? $sVersion : 'no version');
            else if (($aMigration['dependency_error'] ?? '') !== '')
                $sError = "the $sModule module " . $aMigration['dependency_error'];
            if ($sError !== '') {
                $this->_fail($aMigration, $sError, $aResult);
                return;
            }

            $aMissing = array_values(array_filter($aMigration['covers'], function ($s) use ($aDone, $sModule) {
                return !isset($aDone[$sModule][$s]);
            }));
            if ($aMigration['covers'] && !$aMissing) {
                $this->_record($aMigration, self::STATUS_BASELINE);
                $aDone[$sModule][$sId] = ['checksum' => $aMigration['checksum'], 'status' => self::STATUS_BASELINE];
                $aResult['baseline'][] = $sLabel;
                ($this->_fLog)("$sLabel recorded: this database ran everything it covers");
                continue;
            }

            if (!$bFlagged) {
                // Before the migration, outside its transaction: a failure may leave changes too.
                $this->_oQuery->record('', self::REFRESH_PENDING, '', '', '', 'pending');
                $bFlagged = true;
            }

            $this->_oQuery->beginTransaction();
            try {
                $this->_apply($aMigration);
                $this->_record($aMigration, self::STATUS_APPLIED);
                $this->_oQuery->commitTransaction();
            }
            catch (Throwable $e) {
                $this->_oQuery->rollbackTransaction();
                $this->_fail($aMigration, ($aMissing ? 'this database never ran ' . implode(', ', $aMissing) . ', which the baseline covers; ' : '') . $e->getMessage(), $aResult);
                return;
            }

            $aDone[$sModule][$sId] = ['checksum' => $aMigration['checksum'], 'status' => self::STATUS_APPLIED];
            $aResult['applied'][] = $sLabel;
            ($this->_fLog)("$sLabel applied");
        }
    }

    protected function _fail(array $aMigration, string $sError, array &$aResult): void
    {
        $aResult['failed'] = $aMigration['label'];
        $aResult['error'] = $sError;

        if (get_mb_len($sError) > 4000)
            $sError = get_mb_substr($sError, 0, 4000) . '...';
        $this->_oQuery->recordFailure($aMigration['module'], $aMigration['id'], $aMigration['scope'], $aMigration['type'], $aMigration['checksum'], $sError);
    }

    /**
     * Migrations that ran and whose files changed since, or are gone without a baseline that
     * covers them. A checksum of '' is a removed file someone accepted.
     *
     * @return list<array{module: string, id: string, checksum: string, message: string}> checksum: the file's now, '' when it is gone
     */
    protected function _checkFiles(array $aMigrations): array
    {
        $aFiles = [];
        $aCovered = [];
        foreach ($aMigrations as $aMigration) {
            $aFiles[$aMigration['module']][$aMigration['id']] = $aMigration;
            foreach ($aMigration['covers'] as $sCovered)
                $aCovered[$aMigration['module']][$sCovered] = true;
        }

        $aModules = [];
        foreach ($this->getSources() as $aSource)
            $aModules[$aSource['module']] = true;

        $aResult = [];
        foreach ($this->getRecorded() as $sModule => $aRows) {
            // A disabled module's files are not read, so there is nothing to compare.
            if (!isset($aModules[$sModule]))
                continue;

            $sPrefix = ($sModule !== '' ? $sModule : self::SCOPE_COMMON) . ': ';
            foreach ($aRows as $sId => $aRow) {
                $aFile = $aFiles[$sModule][$sId] ?? null;
                if ($aFile !== null && $aFile['checksum'] !== $aRow['checksum'])
                    $aResult[] = ['module' => $sModule, 'id' => $sId, 'checksum' => $aFile['checksum'],
                        'message' => $sPrefix . $aFile['name'] . ' changed after it ' . ($aRow['status'] === self::STATUS_BASELINE ? 'was recorded' : 'ran')];
                else if ($aFile === null && $aRow['checksum'] !== '' && !isset($aCovered[$sModule][$sId]))
                    $aResult[] = ['module' => $sModule, 'id' => $sId, 'checksum' => '',
                        'message' => $sPrefix . $sId . ' ' . ($aRow['status'] === self::STATUS_BASELINE ? 'was recorded' : 'ran') . ', and its file is gone with no baseline covering it'];
            }
        }

        return $aResult;
    }

    protected function _getRows(callable $fFilter): array
    {
        return $this->_oQuery->withExceptions(function () use ($fFilter) {
            $this->_oQuery->createLedger();

            $aResult = [];
            foreach ($this->_oQuery->getRecorded() as $sModule => $aRows)
                if ($aRows = array_filter($aRows, $fFilter))
                    $aResult[$sModule] = $aRows;
            return $aResult;
        });
    }

    protected function _apply(array $aMigration): void
    {
        switch ($aMigration['type']) {
            case 'php':
                // Not require_once: a check runs the same migration again under another ledger.
                $mixedResult = (static function (string $sPath) {
                    return require $sPath; // NOSONAR
                })($aMigration['path']);

                if (is_callable($mixedResult))
                    $mixedResult = $mixedResult();
                if ($mixedResult === false)
                    throw new RuntimeException('the migration returned false');
                return;

            case 'xml':
                $this->_applyLanguage($aMigration);
                return;
        }

        $aStatements = self::splitSql((string)file_get_contents($aMigration['path']));
        if (!$aStatements && $aMigration['covers'])
            throw new RuntimeException('the baseline has no statements to bring it to that state');

        // Install SQL relies on column defaults; a strict server would refuse its INSERTs.
        $this->_oQuery->runStatement("SET SESSION sql_mode = ''");
        foreach ($aStatements as $iIndex => $sStatement) {
            try {
                $this->_oQuery->runStatement($sStatement);
            }
            catch (PDOException $e) {
                $sShort = preg_replace('/\s+/', ' ', $sStatement);
                if (get_mb_len($sShort) > 200)
                    $sShort = get_mb_substr($sShort, 0, 200) . '...';
                throw new RuntimeException('statement ' . ($iIndex + 1) . ' (' . $sShort . '): ' . $e->getMessage(), 0, $e);
            }
        }
    }

    /**
     * The way BxDolStudioUpdater applies the language file of an update pack: deletions from
     * every language, additions and updates to the file's language, in the module's category.
     */
    protected function _applyLanguage(array $aMigration): void
    {
        $aLanguage = self::readLanguageFile((string)file_get_contents($aMigration['path']));

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();
        $aInstalled = $oLanguages->getLanguagesExt();
        if (!isset($aInstalled[$aLanguage['name']])) {
            // Installing the language later brings its current strings.
            ($this->_fLog)("{$aMigration['label']}: language {$aLanguage['name']} is not installed; nothing to change");
            return;
        }
        $iLanguage = (int)$aInstalled[$aLanguage['name']]['id'];

        $sCategory = $aLanguage['category'] !== '' ? $aLanguage['category'] : $aMigration['lang_category'];
        $iCategory = $sCategory !== '' ? $oLanguages->getLanguageCategory($sCategory) : 0;
        if ($iCategory === 0)
            $iCategory = BX_DOL_LANGUAGE_CATEGORY_SYSTEM;

        foreach ($aLanguage['del'] as $sKey)
            $oLanguages->deleteLanguageString($sKey, 0, false);
        foreach ($aLanguage['add'] as $sKey => $sValue)
            $oLanguages->addLanguageString($sKey, $sValue, $iLanguage, $iCategory, false);
        foreach ($aLanguage['upd'] as $sKey => $sValue)
            $oLanguages->updateLanguageString($sKey, $sValue, $iLanguage, $iCategory, false);
    }

    protected function _recordBaseline(array $aMigrations): int
    {
        $aDone = $this->getRecorded();
        $iCount = 0;
        foreach ($aMigrations as $aMigration) {
            if (isset($aDone[$aMigration['module']][$aMigration['id']]))
                continue;

            $this->_record($aMigration, self::STATUS_BASELINE);
            $iCount++;
        }

        return $iCount;
    }

    protected function _record(array $aMigration, string $sStatus): void
    {
        $this->_oQuery->record($aMigration['module'], $aMigration['id'], $aMigration['scope'], $aMigration['type'], $aMigration['checksum'], $sStatus);
    }

    /**
     * Only module folders under modules/, the application's own files, ever run PHP. A module
     * without the folder is a source with nothing in it, so the files of migrations it ran
     * count as gone.
     */
    protected function _getModuleSource(array $aModule): ?array
    {
        if (!preg_match('/^[a-z0-9_]+\/(?:[a-z0-9_]+\/)?$/i', $aModule['path']))
            return null;

        $sDir = BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'migrations';
        if (file_exists($sDir)) {
            $sDir = realpath($sDir);
            $sModules = realpath(BX_DIRECTORY_PATH_MODULES);
            if ($sDir === false || $sModules === false || !str_starts_with($sDir, $sModules . DIRECTORY_SEPARATOR) || !is_dir($sDir))
                return null;
        }

        return [
            'scope' => $aModule['name'] === 'system' ? self::SCOPE_SYSTEM : self::SCOPE_MODULE,
            'module' => $aModule['name'],
            'dir' => $sDir,
            'lang_category' => (string)$aModule['lang_category'],
        ];
    }

    protected function _withLock(callable $f): void
    {
        $this->_oQuery->withExceptions(function () use ($f) {
            $this->_oQuery->createLedger();
            if (!$this->_oQuery->lock())
                throw new RuntimeException('another run is applying migrations; waited 10 minutes');

            try {
                $f();
            }
            finally {
                $this->_oQuery->unlock();
            }
        });
    }
}

/** @} */
