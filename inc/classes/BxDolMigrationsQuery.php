<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Database side of BxDolMigrations: the `sys_migrations` ledger, the lock and running the
 * statements of SQL migrations.
 *
 * Works on the PDO link directly and throws PDOException on every error, whatever error mode
 * the connection has, so a failed statement stops the migration that ran it.
 */
class BxDolMigrationsQuery extends BxDolDb
{
    public const LEDGER = 'sys_migrations';

    protected string $_sLedger;

    /**
     * @param string $sLedger the ledger table; tests use their own
     */
    public function __construct(string $sLedger = self::LEDGER)
    {
        if (!preg_match('/^[a-z0-9_]+$/', $sLedger))
            throw new InvalidArgumentException("Bad ledger table name: $sLedger");

        parent::__construct();

        $this->_sLedger = $sLedger;
    }

    public function getLedger(): string
    {
        return $this->_sLedger;
    }

    /**
     * Installs from before the ledger have no table yet; the command line runner creates it.
     * Never called on a page load.
     */
    public function createLedger(): void
    {
        $this->_pdo()->exec("CREATE TABLE IF NOT EXISTS `{$this->_sLedger}` (
            `module` varchar(32) NOT NULL default '',
            `id` varchar(128) NOT NULL,
            `scope` varchar(16) NOT NULL default '',
            `type` varchar(8) NOT NULL default '',
            `checksum` char(64) NOT NULL default '',
            `status` varchar(16) NOT NULL default '',
            `applied` int(11) unsigned NOT NULL default '0',
            `attempted` int(11) unsigned NOT NULL default '0',
            `error` text NOT NULL,
            PRIMARY KEY (`module`, `id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function isLedger(): bool
    {
        $oStatement = $this->_pdo()->prepare('SHOW TABLES LIKE ?');
        $oStatement->execute([$this->_sLedger]);
        $bResult = $oStatement->fetchColumn() !== false;
        $oStatement->closeCursor();
        return $bResult;
    }

    /**
     * Every row, failures included.
     *
     * @return array<string, array<string, array{checksum: string, status: string, applied: int, attempted: int, error: string}>> by module ('' for common), then by migration id
     */
    public function getRecorded(): array
    {
        $aResult = [];
        $oStatement = $this->_pdo()->query("SELECT `module`, `id`, `checksum`, `status`, `applied`, `attempted`, `error` FROM `{$this->_sLedger}`", PDO::FETCH_ASSOC);
        foreach ($oStatement as $aRow)
            $aResult[$aRow['module']][$aRow['id']] = [
                'checksum' => $aRow['checksum'],
                'status' => $aRow['status'],
                'applied' => (int)$aRow['applied'],
                'attempted' => (int)$aRow['attempted'],
                'error' => $aRow['error'],
            ];
        $oStatement->closeCursor();

        return $aResult;
    }

    /**
     * Record a migration as done. A failure recorded for it earlier is replaced; a row that
     * says it is done already is kept.
     */
    public function record(string $sModule, string $sId, string $sScope, string $sType, string $sChecksum, string $sStatus): void
    {
        $oStatement = $this->_pdo()->prepare("DELETE FROM `{$this->_sLedger}` WHERE `module` = ? AND `id` = ? AND `status` = 'failed'");
        $oStatement->execute([$sModule, $sId]);

        $iTime = time();
        $oStatement = $this->_pdo()->prepare("INSERT IGNORE INTO `{$this->_sLedger}` (`module`, `id`, `scope`, `type`, `checksum`, `status`, `applied`, `attempted`, `error`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')");
        $oStatement->execute([$sModule, $sId, $sScope, $sType, $sChecksum, $sStatus, $iTime, $iTime]);
    }

    /**
     * Record why a migration failed, for whoever looks into it. The row never counts as done.
     */
    public function recordFailure(string $sModule, string $sId, string $sScope, string $sType, string $sChecksum, string $sError): void
    {
        $oStatement = $this->_pdo()->prepare("INSERT INTO `{$this->_sLedger}` (`module`, `id`, `scope`, `type`, `checksum`, `status`, `applied`, `attempted`, `error`) VALUES (?, ?, ?, ?, ?, 'failed', 0, ?, ?)
            ON DUPLICATE KEY UPDATE
                `checksum` = IF(`status` = 'failed', VALUES(`checksum`), `checksum`),
                `attempted` = IF(`status` = 'failed', VALUES(`attempted`), `attempted`),
                `error` = IF(`status` = 'failed', VALUES(`error`), `error`)");
        $oStatement->execute([$sModule, $sId, $sScope, $sType, $sChecksum, time(), $sError]);
    }

    /**
     * After the files of migrations that ran were changed or removed and someone checked that
     * the database is right: the ledger takes the file as it is now ('' for a removed file).
     */
    public function setChecksum(string $sModule, string $sId, string $sChecksum): void
    {
        $oStatement = $this->_pdo()->prepare("UPDATE `{$this->_sLedger}` SET `checksum` = ? WHERE `module` = ? AND `id` = ? AND `status` <> 'failed'");
        $oStatement->execute([$sChecksum, $sModule, $sId]);
    }

    public function forget(string $sModule, string $sId): void
    {
        $oStatement = $this->_pdo()->prepare("DELETE FROM `{$this->_sLedger}` WHERE `module` = ? AND `id` = ?");
        $oStatement->execute([$sModule, $sId]);
    }

    public function isRecorded(string $sModule, string $sId): bool
    {
        $oStatement = $this->_pdo()->prepare("SELECT 1 FROM `{$this->_sLedger}` WHERE `module` = ? AND `id` = ?");
        $oStatement->execute([$sModule, $sId]);
        $bResult = (bool)$oStatement->fetchColumn();
        $oStatement->closeCursor();
        return $bResult;
    }

    /**
     * Installed and enabled modules, the ones whose migrations run.
     *
     * @return list<array{name: string, uri: string, path: string, lang_category: string, dependencies: string}>
     */
    public function getEnabledModules(): array
    {
        $oStatement = $this->_pdo()->query("SELECT `name`, `uri`, `path`, `lang_category`, `dependencies` FROM `sys_modules` WHERE `enabled` = 1 ORDER BY `name`", PDO::FETCH_ASSOC);
        $aResult = $oStatement->fetchAll();
        $oStatement->closeCursor();
        return $aResult;
    }

    /**
     * @return array{name: string, path: string, lang_category: string}|null
     */
    public function getModuleByPath(string $sPath): ?array
    {
        $oStatement = $this->_pdo()->prepare("SELECT `name`, `path`, `lang_category` FROM `sys_modules` WHERE `path` = ? LIMIT 1");
        $oStatement->execute([$sPath]);
        $aResult = $oStatement->fetch(PDO::FETCH_ASSOC);
        $oStatement->closeCursor();
        return $aResult ?: null;
    }

    public function getSystemVersion(): string
    {
        $oStatement = $this->_pdo()->query("SELECT `version` FROM `sys_modules` WHERE `name` = 'system'");
        $sResult = (string)$oStatement->fetchColumn();
        $oStatement->closeCursor();
        return $sResult;
    }

    /**
     * Two runs at once (a deploy and a restart, or the command line and an install) must not
     * both apply a migration.
     */
    public function lock(int $iTimeout = 600): bool
    {
        $oStatement = $this->_pdo()->prepare('SELECT GET_LOCK(?, ?)');
        $oStatement->execute([$this->_lockName(), $iTimeout]);
        $bResult = (int)$oStatement->fetchColumn() === 1;
        $oStatement->closeCursor();
        return $bResult;
    }

    public function unlock(): void
    {
        $oStatement = $this->_pdo()->prepare('SELECT RELEASE_LOCK(?)');
        $oStatement->execute([$this->_lockName()]);
        $oStatement->closeCursor();
    }

    /**
     * Run one statement of a migration. PDO::exec() leaves a result set unread (a
     * `SELECT @v := ...`, a CALL), and the connection then refuses the next statement, so every
     * result is read and the cursor closed.
     */
    public function runStatement(string $sStatement): void
    {
        $oStatement = $this->_pdo()->query($sStatement);
        do {
            if ($oStatement->columnCount() > 0)
                $oStatement->fetchAll();
        } while ($oStatement->nextRowset());
        $oStatement->closeCursor();
    }

    public function beginTransaction(): void
    {
        $this->_pdo()->beginTransaction();
    }

    /**
     * DDL commits on its own, so a migration with a CREATE or ALTER has no transaction left
     * by the time it ends.
     */
    public function commitTransaction(): void
    {
        if ($this->_pdo()->inTransaction())
            $this->_pdo()->commit();
    }

    public function rollbackTransaction(): void
    {
        if ($this->_pdo()->inTransaction())
            $this->_pdo()->rollBack();
    }

    /**
     * Run $f with the link throwing on errors, and put its error mode back after.
     */
    public function withExceptions(callable $f)
    {
        $oPdo = self::getLink();
        $iErrorMode = $oPdo->getAttribute(PDO::ATTR_ERRMODE);
        $oPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        try {
            return $f();
        }
        finally {
            $oPdo->setAttribute(PDO::ATTR_ERRMODE, $iErrorMode);
        }
    }

    protected function _pdo(): PDO
    {
        return self::getLink();
    }

    protected function _lockName(): string
    {
        $oStatement = $this->_pdo()->query('SELECT DATABASE()');
        $sDatabase = (string)$oStatement->fetchColumn();
        $oStatement->closeCursor();
        // GET_LOCK names are at most 64 characters.
        return 'una_migrations_' . substr(hash('sha256', $sDatabase . '.' . $this->_sLedger), 0, 48);
    }
}

/** @} */
