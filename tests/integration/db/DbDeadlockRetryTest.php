<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolDb::res() runs a statement again after a deadlock (1213) only when the statement was a
 * transaction of its own. A deadlock rolls the whole InnoDB transaction back, so inside
 * beginTransaction() or with autocommit off the error reaches the caller, who rolls back:
 * a statement run again there would land outside the transaction, and a migration would be
 * recorded as applied with its first statements gone.
 */
#[Group('integration')]
class DbDeadlockRetryTest extends BxDolIntegrationTestCase
{
    protected const TABLE = 'bx_test_deadlock_retry';

    /** Rows the other connection changes first, so that it outweighs this one and the server rolls this one back. */
    protected const HEAVY_ROWS = 20;

    protected ?mysqli $oOther = null;

    protected function setUp(): void
    {
        parent::setUp();

        $oDb = BxDolDb::getInstance();
        $oDb->query("DROP TABLE IF EXISTS `" . self::TABLE . "`");
        $oDb->query("CREATE TABLE `" . self::TABLE . "` (`id` int unsigned NOT NULL PRIMARY KEY, `v` int NOT NULL DEFAULT 0) ENGINE=InnoDB");
        if (0 != strcasecmp('InnoDB', (string)$oDb->getOne("SELECT `ENGINE` FROM `information_schema`.`TABLES` WHERE `TABLE_SCHEMA` = DATABASE() AND `TABLE_NAME` = ?", [self::TABLE])))
            $this->markTestSkipped('InnoDB is not available on this server.');

        $aValues = ['(1)', '(2)'];
        for ($i = 0; $i < self::HEAVY_ROWS; ++$i)
            $aValues[] = '(' . (100 + $i) . ')';
        $oDb->query("INSERT INTO `" . self::TABLE . "` (`id`) VALUES " . implode(', ', $aValues));
    }

    protected function tearDown(): void
    {
        // The other connection may still hold its locks or wait for a reply: end it from here.
        if ($this->oOther) {
            try {
                BxDolDb::getInstance()->query("KILL " . (int)$this->oOther->thread_id);
            }
            catch (Throwable $e) {
                // already gone
            }
            $this->oOther = null;
        }

        $oPdo = BxDolDb::getLink();
        if ($oPdo->inTransaction())
            $oPdo->rollBack();
        $oDb = BxDolDb::getInstance();
        $oDb->query("ROLLBACK");
        $oDb->query("SET autocommit = 1, innodb_lock_wait_timeout = DEFAULT");
        $oDb->query("DROP TABLE IF EXISTS `" . self::TABLE . "`");

        parent::tearDown();
    }

    protected function connectOther(): mysqli
    {
        if (!class_exists('mysqli'))
            $this->markTestSkipped('The mysqli extension is needed for a second connection that waits in the background.');

        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        $this->oOther = new mysqli(BX_DATABASE_HOST, BX_DATABASE_USER, BX_DATABASE_PASS, BX_DATABASE_NAME, (int)BX_DATABASE_PORT ?: 3306, BX_DATABASE_SOCK ?: null);
        $this->oOther->query("SET innodb_lock_wait_timeout = 10");
        return $this->oOther;
    }

    /**
     * Runs a deadlock with this connection as its victim, inside a transaction that $fBegin opens:
     * this connection updates row 1, the other connection updates row 2 (and many more, so it is
     * the heavier transaction) and then waits for row 1, and this connection then asks for row 2.
     * Returns the error code of what BxDolDb did with that last statement, 0 when it went through.
     */
    protected function deadlock(callable $fBegin): int
    {
        $oDb = BxDolDb::getInstance();
        $oOther = $this->connectOther();

        // Without the fix the statement waits for row 2 again: keep that wait short.
        $oDb->query("SET innodb_lock_wait_timeout = 1");

        $fBegin($oDb);
        $oDb->query("UPDATE `" . self::TABLE . "` SET `v` = `v` + 1 WHERE `id` = 1");

        $oOther->begin_transaction();
        $oOther->query("UPDATE `" . self::TABLE . "` SET `v` = `v` + 10 WHERE `id` = 2 OR `id` >= 100");
        $oOther->query("UPDATE `" . self::TABLE . "` SET `v` = `v` + 10 WHERE `id` = 1", MYSQLI_ASYNC);

        // Wait until the other connection runs that statement (a session sees its own user's threads
        // without the PROCESS privilege), then a little longer for it to queue for the lock.
        $iOtherId = (int)$oOther->thread_id;
        for ($i = 0; $i < 50; ++$i) {
            usleep(50000);
            if ($oDb->getOne("SELECT `COMMAND` FROM `information_schema`.`PROCESSLIST` WHERE `ID` = ?", [$iOtherId]) == 'Query')
                break;
        }
        usleep(200000);

        $iCode = 0;
        try {
            if (false === $oDb->query("UPDATE `" . self::TABLE . "` SET `v` = `v` + 1 WHERE `id` = 2"))
                $iCode = -1;
        }
        catch (PDOException $e) {
            $iCode = (int)$e->errorInfo[1];
        }

        // This connection's transaction is gone: the other one gets row 1 and finishes.
        $oOther->reap_async_query();
        $oOther->commit();

        return $iCode;
    }

    protected function rows(): array
    {
        return array_map('intval', BxDolDb::getInstance()->getPairs("SELECT `id`, `v` FROM `" . self::TABLE . "` WHERE `id` IN (1, 2)", 'id', 'v'));
    }

    public function testDeadlockInsideBeginTransactionReachesTheCaller(): void
    {
        $iCode = $this->deadlock(function () {
            BxDolDb::getLink()->beginTransaction();
        });

        $this->assertSame(1213, $iCode, 'The deadlock is thrown, not retried into a lock wait timeout outside the transaction.');
        $this->assertFalse(BxDolDb::getLink()->inTransaction(), 'The server rolled the transaction back.');
        $this->assertSame([1 => 10, 2 => 10], $this->rows(), "Only the other connection's changes are there: none of this transaction's.");
    }

    public function testDeadlockWithAutocommitOffReachesTheCaller(): void
    {
        $iCode = $this->deadlock(function (BxDolDb $oDb) {
            $oDb->query("SET autocommit = 0");
        });

        $this->assertSame(1213, $iCode, 'The deadlock is thrown, not retried into a lock wait timeout.');

        BxDolDb::getInstance()->query("COMMIT");
        $this->assertSame([1 => 10, 2 => 10], $this->rows(), "Only the other connection's changes are there: none of this transaction's.");
    }

    /**
     * Runs an update of row 1 through a connection whose first $iFails statements fail with $iCode.
     * Returns how many times the statement was sent and the error code that reached the caller, 0 for none.
     */
    protected function failing(int $iCode, int $iFails = 1): array
    {
        $oDb = BxDolDbDeadlockOnceTest::make($iCode, $iFails);
        $iThrown = 0;
        try {
            $oDb->query("UPDATE `" . self::TABLE . "` SET `v` = `v` + 1 WHERE `id` = 1");
        }
        catch (PDOException $e) {
            $iThrown = (int)$e->errorInfo[1];
        }
        finally {
            $oDb->release();
        }
        return [$oDb->iCalls, $iThrown];
    }

    public function testDeadlockOfAStatementOnItsOwnIsRetried(): void
    {
        $this->assertSame([2, 0], $this->failing(1213), 'The statement ran again after the deadlock.');
        $this->assertSame([1 => 1, 2 => 0], $this->rows());
    }

    public function testDeadlockInsideATransactionIsNotRetried(): void
    {
        BxDolDb::getLink()->beginTransaction();
        $this->assertSame([1, 1213], $this->failing(1213), 'The statement ran once and the deadlock reached the caller.');
    }

    public function testDeadlockWithAutocommitOffIsNotRetried(): void
    {
        BxDolDb::getInstance()->query("SET autocommit = 0");
        $this->assertSame([1, 1213], $this->failing(1213), 'The statement ran once and the deadlock reached the caller.');
    }

    public function testLockWaitTimeoutInsideATransactionIsRetried(): void
    {
        BxDolDb::getLink()->beginTransaction();
        $this->assertSame([2, 0], $this->failing(1205), 'A lock wait timeout rolls back only the statement: it runs again.');
    }

    public function testLastAttemptReachesTheCaller(): void
    {
        $this->assertSame([3, 1205], $this->failing(1205, 3), 'After the last attempt the error is thrown, not swallowed.');
        $this->assertSame([3, 1213], $this->failing(1213, 3));
        $this->assertSame([1 => 0, 2 => 0], $this->rows());
    }
}

/**
 * The shared connection, with its first statements failing as a deadlock (or another error code)
 * without reaching the server, thrown as BxDolDb::executeStatementException() throws them.
 */
class BxDolDbDeadlockOnceTest extends BxDolDb
{
    public int $iCalls = 0;
    public int $iFails = 1;
    protected int $iFailCode = 1213;

    public static function make(int $iFailCode = 1213, int $iFails = 1): self
    {
        $o = new self();
        restore_exception_handler();
        $o->iFailCode = $iFailCode;
        $o->iFails = $iFails;
        return $o;
    }

    public function release(): void
    {
        $this->iFails = 0;
    }

    protected function executeStatement($oStatement, $aBindings = array(), $bVerbose = null, &$iErrorCode = null)
    {
        ++$this->iCalls;
        if ($this->iFails > 0) {
            --$this->iFails;
            $e = new PDOException('Simulated error ' . $this->iFailCode);
            $e->errorInfo = ['40001', $this->iFailCode, 'Simulated error'];
            throw $e;
        }
        return parent::executeStatement($oStatement, $aBindings, $bVerbose, $iErrorCode);
    }
}
