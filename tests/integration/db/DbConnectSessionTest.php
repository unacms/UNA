<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolDb::connect sets the session up in one statement: utf8mb4 with the site's collation,
 * an empty sql_mode and the site's storage engine, without asking the server for its version.
 * It sets no transaction isolation level: transactions run at the server's own.
 */
#[Group('integration')]
class DbConnectSessionTest extends BxDolIntegrationTestCase
{
    protected function tearDown(): void
    {
        // A failed check can leave the session with the values set below: connect again.
        $oDb = BxDolDb::getInstance();
        $oDb->disconnect();
        $oDb->connect();

        parent::tearDown();
    }

    /**
     * Statement counters of the current server session.
     */
    protected function counters(BxDolDb $oDb): array
    {
        $a = [];
        foreach ($oDb->getAll("SHOW SESSION STATUS WHERE `Variable_name` IN ('Com_set_option', 'Com_select')") as $r)
            $a[$r['Variable_name']] = (int)$r['Value'];
        return $a;
    }

    /**
     * Connects again and returns what connect() itself sent: counter deltas when the server session
     * is reused (persistent connections), the new session's counters otherwise.
     */
    protected function reconnect(BxDolDb $oDb): array
    {
        $iIdBefore = (int)$oDb->getOne("SELECT CONNECTION_ID()");
        $aBefore = $this->counters($oDb);

        $oDb->disconnect();
        $oDb->connect();

        // Read the counters before any other query: the id check below runs a SELECT of its own.
        $aAfter = $this->counters($oDb);
        $bSameSession = (int)$oDb->getOne("SELECT CONNECTION_ID()") === $iIdBefore;

        $aSent = [];
        foreach ($aAfter as $k => $v)
            $aSent[$k] = $bSameSession ? $v - $aBefore[$k] : $v;
        return $aSent;
    }

    public function testConnectSetsTheSession(): void
    {
        $oDb = BxDolDb::getInstance();
        $sEngine = (new ReflectionProperty(BxDolDb::class, '_sStorageEngine'))->getValue($oDb);

        // Other values first: persistent connections reuse the server session, which would otherwise
        // already hold the expected ones, so connect() has to set each of them again.
        $oDb->pdoExec("SET NAMES latin1, sql_mode = 'STRICT_ALL_TABLES', default_storage_engine = " . (0 == strcasecmp($sEngine, 'INNODB') ? 'MYISAM' : 'INNODB'));
        $this->reconnect($oDb);

        $aState = $oDb->getRow("SELECT @@character_set_client AS `client`, @@character_set_connection AS `conn`, @@character_set_results AS `results`, @@collation_connection AS `coll`, @@sql_mode AS `mode`, @@default_storage_engine AS `engine`");

        $this->assertSame(['utf8mb4', 'utf8mb4', 'utf8mb4'], [$aState['client'], $aState['conn'], $aState['results']]);
        $this->assertSame(defined('BX_DATABASE_COLLATE') ? BX_DATABASE_COLLATE : 'utf8mb4_unicode_ci', $aState['coll']);
        $this->assertSame('', $aState['mode']);
        $this->assertSame(strtoupper($sEngine), strtoupper($aState['engine']));
    }

    public function testConnectSendsOneSetAndNoSelect(): void
    {
        $oDb = BxDolDb::getInstance();

        $aSent = $this->reconnect($oDb);

        $this->assertSame(1, $aSent['Com_set_option'], 'One SET for the session, whatever the storage engine.');
        $this->assertSame(0, $aSent['Com_select'], 'No SELECT VERSION().');
    }

    /**
     * A second, non-persistent connection to the site's database that waits at most a second for a lock.
     */
    protected function otherConnection(): PDO
    {
        $sDsn = 'mysql:' . (BX_DATABASE_SOCK ? 'unix_socket=' . BX_DATABASE_SOCK : 'host=' . BX_DATABASE_HOST . (BX_DATABASE_PORT ? ';port=' . BX_DATABASE_PORT : '')) . ';dbname=' . BX_DATABASE_NAME;
        $oPdo = new PDO($sDsn, BX_DATABASE_USER, BX_DATABASE_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $oPdo->exec("SET SESSION innodb_lock_wait_timeout = 1");
        return $oPdo;
    }

    /**
     * Whether a plain read in a transaction of this session locks the row it reads, which InnoDB does
     * only at SERIALIZABLE: another connection then can't lock the row for update until the transaction ends.
     */
    protected function readLocksRow(BxDolDb $oDb, PDO $oOther): bool
    {
        $oDb->pdoExec("START TRANSACTION");
        try {
            $oDb->getOne("SELECT `name` FROM `sys_options` WHERE `name` = 'site_title'");

            $oOther->beginTransaction();
            try {
                $oOther->query("SELECT `name` FROM `sys_options` WHERE `name` = 'site_title' FOR UPDATE")->fetchAll();
                return false;
            }
            catch (PDOException $e) {
                if (1205 != ($e->errorInfo[1] ?? 0))
                    throw $e;
                return true;
            }
            finally {
                $oOther->rollBack();
            }
        }
        finally {
            $oDb->pdoExec("COMMIT");
        }
    }

    public function testTransactionsDoNotRunSerializable(): void
    {
        $oDb = BxDolDb::getInstance();
        if (!$oDb->getOne("SELECT 1 FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = 'sys_options' AND `ENGINE` = 'InnoDB'"))
            $this->markTestSkipped('sys_options is not an InnoDB table.');

        $oOther = $this->otherConnection();
        if ($this->readLocksRow($oDb, $oOther))
            $this->markTestSkipped('The server itself runs transactions at SERIALIZABLE.');

        // The first transaction after connecting, which a one-shot SET TRANSACTION would cover, and a later one.
        $oDb->disconnect();
        $oDb->connect();
        $this->assertFalse($this->readLocksRow($oDb, $oOther), 'The first transaction after connecting runs at the server\'s level.');
        $this->assertFalse($this->readLocksRow($oDb, $oOther), 'A later transaction runs at the server\'s level.');
    }
}
