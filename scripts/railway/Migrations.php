<?php
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * Railway: database migrations for a site that follows master (api.unacms.app).
 *
 * UNA's installer runs install SQL once, on an empty database, and module update packs only
 * between released versions. A site deployed from every master commit gets neither: a merged
 * change to install SQL reaches new installs but never the running database. Each file in
 * scripts/railway/migrations/ carries one such change for databases installed before it, and
 * runs once per database, in file name order. The ledger table records what ran.
 *
 * A file is `YYYYMMDD-short-name.sql` or `.php`:
 * - SQL runs statement by statement with an empty sql_mode, like UNA's installer, so it may
 *   rely on column defaults the way install SQL does. DELIMITER lines work as in install SQL.
 * - PHP returns a function, called with UNA loaded; returning false or throwing fails it.
 * - A line `-- module: bx_name` (`// module: bx_name` in PHP) runs it only where that module is
 *   installed. Elsewhere it is recorded as skipped: installing the module later runs its install
 *   SQL, which has the change already.
 *
 * Every migration must be safe to run on a database that already has the change: a fresh install
 * records the migrations it ships with as `baseline` without running them, but a site installed
 * from an older commit, or restored from a backup, runs them all.
 *
 * Plain PDO and no UNA classes, so tests can point it at their own folder and ledger.
 */

class UnaRailwayMigrations
{
    public const LEDGER = 'sys_deploy_migrations';
    public const NAME_PATTERN = '/^\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*\.(sql|php)$/';
    /** Ledger row, never a file name: migrations ran and caches and languages still need rebuilding. */
    public const REFRESH_PENDING = '~refresh-pending';

    protected PDO $_oPdo;
    protected string $_sDir;
    protected string $_sLedger;
    /** @var callable */
    protected $_fLog;

    public function __construct(PDO $oPdo, string $sDir, string $sLedger = self::LEDGER, ?callable $fLog = null)
    {
        if (!preg_match('/^[a-z0-9_]+$/', $sLedger))
            throw new InvalidArgumentException("Bad ledger table name: $sLedger");

        $this->_oPdo = $oPdo;
        $this->_sDir = rtrim($sDir, '/');
        $this->_sLedger = $sLedger;
        $this->_fLog = $fLog ?? function (string $s): void {};
    }

    /**
     * Migration files in the order they run.
     *
     * @return array<string, array{path: string, type: string, module: string, checksum: string}> keyed by id (file name without extension)
     */
    public function listMigrations(): array
    {
        if (!is_dir($this->_sDir))
            return [];

        $aNames = array_filter(scandir($this->_sDir), function ($s) {
            return preg_match('/\.(sql|php)$/', $s);
        });
        sort($aNames, SORT_STRING);

        $aResult = [];
        foreach ($aNames as $sName) {
            if (!preg_match(self::NAME_PATTERN, $sName, $aMatch))
                throw new UnexpectedValueException("$sName: migration file names are YYYYMMDD-short-name.sql or .php");

            $sId = substr($sName, 0, -4);
            if (isset($aResult[$sId]))
                throw new UnexpectedValueException("$sId: there is both a .sql and a .php file");

            $sPath = $this->_sDir . '/' . $sName;
            $sContent = (string)file_get_contents($sPath);
            $aResult[$sId] = [
                'path' => $sPath,
                'type' => $aMatch[1],
                'module' => self::parseModule($sContent),
                'checksum' => sha1($sContent),
            ];
        }

        return $aResult;
    }

    /**
     * The module named on a `-- module: bx_name` line (`#`, `//` and ` * ` work too), or ''.
     */
    public static function parseModule(string $sContent): string
    {
        return preg_match('/^[ \t]*(?:--|#|\/\/|\*)[ \t]*module:[ \t]*([a-z0-9_]+)[ \t]*\r?$/mi', $sContent, $aMatch) ? $aMatch[1] : '';
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

    /**
     * Run every migration the ledger lacks, in order. Stops at the first failure; that one is
     * not recorded, so the next start tries it again.
     *
     * $fRefresh rebuilds what the migrations made stale and returns what failed, or ''. It runs
     * while the refresh flag is set, also after a failure (the migrations before it did run), and
     * under the same lock as the migrations, so one start cannot clear the flag that another
     * start set after its own migrations.
     *
     * @return array{applied: list<string>, skipped: list<string>, failed: string, error: string, refreshed: bool, refresh_error: string}
     */
    public function run(?callable $fRefresh = null): array
    {
        $aMigrations = $this->listMigrations();
        $aResult = ['applied' => [], 'skipped' => [], 'failed' => '', 'error' => '', 'refreshed' => false, 'refresh_error' => ''];

        $this->_withLock(function () use ($aMigrations, $fRefresh, &$aResult) {
            $this->_runMigrations($aMigrations, $aResult);
            if ($fRefresh === null || !$this->isRefreshPending())
                return;

            try {
                $aResult['refresh_error'] = (string)$fRefresh();
            }
            catch (Throwable $e) {
                $aResult['refresh_error'] = $e->getMessage();
            }
            if ($aResult['refresh_error'] === '') {
                $this->_setRefreshPending(false);
                $aResult['refreshed'] = true;
            }
        });

        return $aResult;
    }

    protected function _runMigrations(array $aMigrations, array &$aResult): void
    {
        $aDone = $this->getRecorded();
        foreach ($aMigrations as $sId => $aMigration) {
            if (isset($aDone[$sId])) {
                if ($aDone[$sId]['checksum'] !== $aMigration['checksum'])
                    ($this->_fLog)("$sId changed after it ran; the change will not run. Add a new migration instead.");
                continue;
            }

            if ($aMigration['module'] !== '' && !$this->_isModuleInstalled($aMigration['module'])) {
                $this->_record($sId, $aMigration['checksum'], 'skipped');
                $aResult['skipped'][] = $sId;
                ($this->_fLog)("$sId skipped: {$aMigration['module']} is not installed");
                continue;
            }

            try {
                $this->_apply($aMigration);
            }
            catch (Throwable $e) {
                $aResult['failed'] = $sId;
                $aResult['error'] = $e->getMessage();
                return;
            }

            if (!$aResult['applied'])
                $this->_setRefreshPending(true);
            $this->_record($sId, $aMigration['checksum'], 'applied');
            $aResult['applied'][] = $sId;
            ($this->_fLog)("$sId applied");
        }
    }

    /**
     * Record every migration as done without running it: for a database the installer has just
     * created from this same code, whose install SQL already has every change.
     *
     * @return int number of migrations recorded
     */
    public function baseline(): int
    {
        $aMigrations = $this->listMigrations();
        $iCount = 0;

        $this->_withLock(function () use ($aMigrations, &$iCount) {
            $aDone = $this->getRecorded();
            foreach ($aMigrations as $sId => $aMigration) {
                if (isset($aDone[$sId]))
                    continue;

                $this->_record($sId, $aMigration['checksum'], 'baseline');
                $iCount++;
            }
        });

        return $iCount;
    }

    /**
     * @return array<string, array{checksum: string, status: string, applied: int}>
     */
    public function getRecorded(): array
    {
        $this->_ensureLedger();

        $aResult = [];
        foreach ($this->_oPdo->query("SELECT `id`, `checksum`, `status`, `applied` FROM `{$this->_sLedger}`", PDO::FETCH_ASSOC) as $aRow)
            if ($aRow['id'] !== self::REFRESH_PENDING)
                $aResult[$aRow['id']] = ['checksum' => $aRow['checksum'], 'status' => $aRow['status'], 'applied' => (int)$aRow['applied']];

        return $aResult;
    }

    /**
     * Whether migrations ran and the rebuild after them (languages, caches) has not succeeded
     * yet. The flag is set before the first migration of a run is recorded, so a start that
     * dies or fails to rebuild leaves it for the next start.
     */
    public function isRefreshPending(): bool
    {
        $this->_ensureLedger();

        $oStatement = $this->_oPdo->prepare("SELECT 1 FROM `{$this->_sLedger}` WHERE `id` = ?");
        $oStatement->execute([self::REFRESH_PENDING]);
        $bResult = (bool)$oStatement->fetchColumn();
        $oStatement->closeCursor();
        return $bResult;
    }

    protected function _setRefreshPending(bool $b): void
    {
        $this->_ensureLedger();

        $oStatement = $b
            ? $this->_oPdo->prepare("INSERT IGNORE INTO `{$this->_sLedger}` (`id`, `checksum`, `status`, `applied`) VALUES (?, '', 'pending', UNIX_TIMESTAMP())")
            : $this->_oPdo->prepare("DELETE FROM `{$this->_sLedger}` WHERE `id` = ?");
        $oStatement->execute([self::REFRESH_PENDING]);
    }

    protected function _apply(array $aMigration): void
    {
        if ($aMigration['type'] === 'php') {
            $fMigration = (static function (string $sPath) {
                return require $sPath;
            })($aMigration['path']);

            if (!is_callable($fMigration))
                throw new UnexpectedValueException('a PHP migration must return a function');
            if ($fMigration() === false)
                throw new RuntimeException('the migration returned false');

            return;
        }

        // Install SQL relies on column defaults; a strict server would refuse its INSERTs.
        $this->_execute("SET SESSION sql_mode = ''");
        foreach (self::splitSql((string)file_get_contents($aMigration['path'])) as $iIndex => $sStatement) {
            try {
                $this->_execute($sStatement);
            }
            catch (PDOException $e) {
                $sShort = preg_replace('/\s+/', ' ', $sStatement);
                if (strlen($sShort) > 200)
                    $sShort = substr($sShort, 0, 200) . '...';
                throw new RuntimeException('statement ' . ($iIndex + 1) . ' (' . $sShort . '): ' . $e->getMessage(), 0, $e);
            }
        }
    }

    /**
     * PDO::exec() leaves a result set unread (a `SELECT @v := ...`, a CALL), and the connection
     * then refuses the next statement, so every result is read and the cursor closed.
     */
    protected function _execute(string $sStatement): void
    {
        $oStatement = $this->_oPdo->query($sStatement);
        do {
            if ($oStatement->columnCount() > 0)
                $oStatement->fetchAll();
        } while ($oStatement->nextRowset());
        $oStatement->closeCursor();
    }

    protected function _ensureLedger(): void
    {
        $this->_oPdo->exec("CREATE TABLE IF NOT EXISTS `{$this->_sLedger}` (
            `id` varchar(128) NOT NULL,
            `checksum` char(40) NOT NULL,
            `status` varchar(16) NOT NULL,
            `applied` int(11) unsigned NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    protected function _record(string $sId, string $sChecksum, string $sStatus): void
    {
        $oStatement = $this->_oPdo->prepare("INSERT INTO `{$this->_sLedger}` (`id`, `checksum`, `status`, `applied`) VALUES (?, ?, ?, ?)");
        $oStatement->execute([$sId, $sChecksum, $sStatus, time()]);
    }

    protected function _isModuleInstalled(string $sName): bool
    {
        $oStatement = $this->_oPdo->prepare('SELECT 1 FROM `sys_modules` WHERE `name` = ? LIMIT 1');
        $oStatement->execute([$sName]);
        $bResult = (bool)$oStatement->fetchColumn();
        $oStatement->closeCursor();
        return $bResult;
    }

    /**
     * Two containers starting together (a deploy and a restart) must not both run a migration.
     * PDO errors throw inside, whatever error mode the connection had.
     */
    protected function _withLock(callable $f): void
    {
        $iErrorMode = $this->_oPdo->getAttribute(PDO::ATTR_ERRMODE);
        $this->_oPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        try {
            $oStatement = $this->_oPdo->query('SELECT DATABASE()');
            $sLock = 'una_migrations_' . md5($oStatement->fetchColumn() . '.' . $this->_sLedger);
            $oStatement->closeCursor();

            $oStatement = $this->_oPdo->prepare('SELECT GET_LOCK(?, 600)');
            $oStatement->execute([$sLock]);
            $iLocked = (int)$oStatement->fetchColumn();
            $oStatement->closeCursor();
            if ($iLocked !== 1)
                throw new RuntimeException('another start is running migrations; waited 10 minutes');

            try {
                $f();
            }
            finally {
                $oStatement = $this->_oPdo->prepare('SELECT RELEASE_LOCK(?)');
                $oStatement->execute([$sLock]);
                $oStatement->closeCursor();
            }
        }
        finally {
            $this->_oPdo->setAttribute(PDO::ATTR_ERRMODE, $iErrorMode);
        }
    }
}
