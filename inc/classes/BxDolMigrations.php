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
 * migration file, which periodic/migrate.php applies once per database and records in the
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
 *
 * Migrations run in id order across all folders; on the same id common runs first, then system,
 * then modules by name. The first failure stops the run: it is not recorded, rolled back where
 * the tables allow, and tried again on the next run.
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

    /**
     * @param array|null $aSources folders to read, see getSources(); null reads the site's
     * @param string|null $sSystemVersion null reads the installed system version
     */
    public function __construct(BxDolMigrationsQuery $oQuery, ?array $aSources = null, ?callable $fLog = null, ?string $sSystemVersion = null)
    {
        $this->_oQuery = $oQuery;
        $this->_aSources = $aSources;
        $this->_fLog = $fLog ?? function (string $s): void {};
        $this->_sSystemVersion = $sSystemVersion;
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
     * Folders whose migrations run: the common one and those of enabled modules.
     *
     * @return list<array{scope: string, module: string, dir: string, lang_category: string}>
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
        foreach ($this->_oQuery->getEnabledModules() as $aModule)
            if (($aSource = $this->_getModuleSource($aModule)) !== null)
                $aResult[] = $aSource;

        return $aResult;
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

        usort($aResult, function ($a, $b) {
            return [substr($a['id'], 0, 10), self::SCOPE_ORDER[$a['scope']], $a['module'], $a['id']]
                <=> [substr($b['id'], 0, 10), self::SCOPE_ORDER[$b['scope']], $b['module'], $b['id']];
        });

        return $aResult;
    }

    /**
     * Run every migration the ledger lacks, in order, and stop at the first failure.
     *
     * $fRefresh rebuilds what the migrations made stale and returns what failed, or ''; null
     * means refresh(). It runs while the refresh flag is set, also after a failure (the
     * migrations before it did run), and under the same lock as the migrations, so one run
     * cannot clear the flag that another run set after its own migrations.
     *
     * @return array{applied: list<string>, baseline: list<string>, failed: string, error: string, refreshed: bool, refresh_error: string}
     */
    public function run(?callable $fRefresh = null): array
    {
        $aResult = ['applied' => [], 'baseline' => [], 'failed' => '', 'error' => '', 'refreshed' => false, 'refresh_error' => ''];
        $fRefresh = $fRefresh ?? [$this, 'refresh'];

        $this->_withLock(function () use ($fRefresh, &$aResult) {
            $this->_runMigrations($this->listMigrations(), $aResult);
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
     * periodic/migrate.php creates it.
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
     * @return array<string, array<string, array{checksum: string, status: string, applied: int}>> by module ('' for common), then by id
     */
    public function getRecorded(): array
    {
        return $this->_oQuery->withExceptions(function () {
            $this->_oQuery->createLedger();

            $aResult = $this->_oQuery->getRecorded();
            unset($aResult[''][self::REFRESH_PENDING]);
            return array_filter($aResult);
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
     * or begin with a keyword.
     *
     * @return list<string>
     */
    public static function splitSql(string $sSql): array
    {
        $aResult = [];
        $sDelimiter = ';';
        $sCurrent = '';
        $sQuote = '';
        // Delimiters, quotes and comment markers are ASCII, so walking bytes never splits a character.
        $iLen = strlen($sSql);
        for ($i = 0; $i < $iLen; $i++) {
            $c = $sSql[$i];

            if ($sQuote !== '') {
                $sCurrent .= $c;
                if ($c === '\\' && $sQuote !== '`' && $i + 1 < $iLen)
                    $sCurrent .= $sSql[++$i];
                else if ($c === $sQuote)
                    $sQuote = '';
                continue;
            }

            $bLineStart = $i === 0 || $sSql[$i - 1] === "\n";
            if ($bLineStart && trim($sCurrent) === '' && preg_match('/\G[ \t]*DELIMITER[ \t]+(\S+)[^\n]*\n?/i', $sSql, $aMatch, 0, $i)) {
                $sDelimiter = $aMatch[1];
                $i += strlen($aMatch[0]) - 1;
                continue;
            }

            $sNext = $i + 1 < $iLen ? $sSql[$i + 1] : '';
            if ($c === '#' || ($c === '-' && $sNext === '-' && ($i + 2 >= $iLen || ctype_space($sSql[$i + 2])))) {
                $iEnd = strpos($sSql, "\n", $i);
                $i = $iEnd === false ? $iLen : $iEnd - 1;
                continue;
            }
            if ($c === '/' && $sNext === '*') {
                $iEnd = strpos($sSql, '*/', $i + 2);
                $iEnd = $iEnd === false ? $iLen : $iEnd + 2;
                // A space keeps `SELECT/**/1` two tokens.
                $sCurrent .= ($sSql[$i + 2] ?? '') === '!' ? substr($sSql, $i, $iEnd - $i) : ' ';
                $i = $iEnd - 1;
                continue;
            }

            if (substr_compare($sSql, $sDelimiter, $i, strlen($sDelimiter)) === 0) {
                if (($sStatement = trim($sCurrent)) !== '')
                    $aResult[] = $sStatement;
                $sCurrent = '';
                $i += strlen($sDelimiter) - 1;
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
        $bFlagged = false;

        foreach ($aMigrations as $aMigration) {
            $sModule = $aMigration['module'];
            $sId = $aMigration['id'];
            $sLabel = $aMigration['label'];

            if (isset($aDone[$sModule][$sId])) {
                if ($aDone[$sModule][$sId]['checksum'] !== $aMigration['checksum'] && $aDone[$sModule][$sId]['status'] === self::STATUS_APPLIED)
                    ($this->_fLog)("$sLabel changed after it ran; the change will not run. Add a new migration instead.");
                continue;
            }

            if (version_compare($sVersion, $aMigration['min_version'], '<')) {
                $aResult['failed'] = $sLabel;
                $aResult['error'] = "needs UNA {$aMigration['min_version']} or later; this site has " . ($sVersion !== '' ? $sVersion : 'no version');
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
                $aResult['failed'] = $sLabel;
                $aResult['error'] = ($aMissing ? 'this database never ran ' . implode(', ', $aMissing) . ', which the baseline covers; ' : '') . $e->getMessage();
                return;
            }

            $aDone[$sModule][$sId] = ['checksum' => $aMigration['checksum'], 'status' => self::STATUS_APPLIED];
            $aResult['applied'][] = $sLabel;
            ($this->_fLog)("$sLabel applied");
        }
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
     * Only module folders under modules/, the application's own files, ever run PHP.
     */
    protected function _getModuleSource(array $aModule): ?array
    {
        if (!preg_match('/^[a-z0-9_]+\/(?:[a-z0-9_]+\/)?$/i', $aModule['path']))
            return null;

        $sDir = realpath(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'migrations');
        $sModules = realpath(BX_DIRECTORY_PATH_MODULES);
        if ($sDir === false || $sModules === false || !str_starts_with($sDir, $sModules . DIRECTORY_SEPARATOR) || !is_dir($sDir))
            return null;

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
