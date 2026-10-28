<?php

use PHPUnit\Framework\Attributes\Group;

require_once(__DIR__ . '/../../../scripts/railway/Migrations.php');

/**
 * scripts/railway/Migrations.php against the test database: the ledger, order, failures,
 * module lines and the fresh-install baseline. Each case uses its own ledger table, data table
 * and folder, and drops them afterwards.
 *
 * testShippedMigrationsRun runs the real files in scripts/railway/migrations, which changes the
 * test database the way a deploy changes production.
 */
#[Group('integration')]
class RailwayMigrationsDbTest extends BxDolIntegrationTestCase
{
    private PDO $_oPdo;
    private string $_sSuffix = '';
    private string $_sDir = '';
    private array $_aTables = [];

    protected function setUp(): void
    {
        parent::setUp();

        BxDolDb::getInstance();
        $this->_oPdo = BxDolDb::getLink();
        $this->_sSuffix = bin2hex(random_bytes(4));
        $this->_sDir = sys_get_temp_dir() . '/una-migrations-' . $this->_sSuffix;
        mkdir($this->_sDir);
    }

    protected function tearDown(): void
    {
        foreach ($this->_aTables as $sTable)
            $this->_oPdo->exec("DROP TABLE IF EXISTS `$sTable`");

        array_map('unlink', glob($this->_sDir . '/*'));
        rmdir($this->_sDir);

        parent::tearDown();
    }

    public function testRunsInOrderOnce(): void
    {
        $sData = $this->_table('data');
        $this->_write('20261101-create.sql', "CREATE TABLE IF NOT EXISTS `$sData` (`v` varchar(32) NOT NULL, `n` int NOT NULL, PRIMARY KEY (`v`));");
        // An INSERT that leaves out a NOT NULL column without a default works, as in install SQL.
        // A statement that returns rows (here from a variable) must not block the next one.
        $this->_write('20261102-rows.sql', "INSERT IGNORE INTO `$sData` (`v`) VALUES ('a');\nSELECT @n := 5;\nUPDATE `$sData` SET `n` = @n\nWHERE `v` = 'a';");
        $this->_write('20261103-php.php', "<?php\nreturn function () { BxDolDb::getInstance()->query(\"INSERT INTO `$sData` (`v`) VALUES ('php')\"); };");

        $oMigrations = $this->_migrations();
        $aResult = $oMigrations->run();

        $this->assertSame(['20261101-create', '20261102-rows', '20261103-php'], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
        $this->assertSame(['a' => 5, 'php' => 0], $this->_rows($sData));

        $aRecorded = $oMigrations->getRecorded();
        $this->assertSame(['20261101-create', '20261102-rows', '20261103-php'], array_keys($aRecorded));
        $this->assertSame('applied', $aRecorded['20261102-rows']['status']);
        $this->assertSame(sha1_file($this->_sDir . '/20261102-rows.sql'), $aRecorded['20261102-rows']['checksum']);

        // The PHP migration is not idempotent: a second run would fail on the duplicate key.
        $aResult = $oMigrations->run();
        $this->assertSame([], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
    }

    public function testFailureStopsAndRetries(): void
    {
        $sData = $this->_table('data');
        $this->_write('20261101-create.sql', "CREATE TABLE IF NOT EXISTS `$sData` (`v` varchar(32) NOT NULL, PRIMARY KEY (`v`));");
        $this->_write('20261102-broken.sql', "INSERT INTO `$sData` (`v`) VALUES ('before');\nINSERT INTO `{$sData}_missing` (`v`) VALUES ('x');\nSELECT 1;");
        $this->_write('20261103-later.sql', "INSERT INTO `$sData` (`v`) VALUES ('later');");

        $oMigrations = $this->_migrations();
        $aResult = $oMigrations->run();

        $this->assertSame(['20261101-create'], $aResult['applied']);
        $this->assertSame('20261102-broken', $aResult['failed']);
        $this->assertStringContainsString('statement 2', $aResult['error']);
        $this->assertSame(['20261101-create'], array_keys($oMigrations->getRecorded()));
        $this->assertSame(['before' => ''], $this->_rows($sData), 'statements before the failure stay applied');

        // Fixed in a later commit by editing the same file, made safe to run again.
        $this->_write('20261102-broken.sql', "INSERT IGNORE INTO `$sData` (`v`) VALUES ('before');");
        $aResult = $oMigrations->run();

        $this->assertSame(['20261102-broken', '20261103-later'], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
        $this->assertSame(['before' => '', 'later' => ''], $this->_rows($sData));
    }

    public function testPhpReturningFalseFails(): void
    {
        $this->_write('20261101-false.php', "<?php\nreturn function () { return false; };");
        $this->_write('20261102-not-a-function.php', "<?php\nreturn 1;");

        $oMigrations = $this->_migrations();
        $this->assertSame('20261101-false', $oMigrations->run()['failed']);

        unlink($this->_sDir . '/20261101-false.php');
        $this->assertSame('20261102-not-a-function', $oMigrations->run()['failed']);
        $this->assertSame([], $oMigrations->getRecorded());
    }

    public function testModuleLine(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $this->_write('20261101-installed.sql', "-- module: system\nINSERT INTO `$sData` VALUES ('system');");
        $this->_write('20261102-missing.sql', "-- module: bx_not_installed_xyz\nINSERT INTO `$sData` VALUES ('missing');");

        $oMigrations = $this->_migrations();
        $aResult = $oMigrations->run();

        $this->assertSame(['20261101-installed'], $aResult['applied']);
        $this->assertSame(['20261102-missing'], $aResult['skipped']);
        $this->assertSame(['system' => ''], $this->_rows($sData));
        $this->assertSame('skipped', $oMigrations->getRecorded()['20261102-missing']['status']);
    }

    public function testBaselineRecordsWithoutRunning(): void
    {
        $this->_write('20261101-would-fail.sql', "INSERT INTO `table_that_does_not_exist_{$this->_sSuffix}` VALUES (1);");

        $oMigrations = $this->_migrations();
        $this->assertSame(1, $oMigrations->baseline());
        $this->assertSame(0, $oMigrations->baseline());
        $this->assertSame('baseline', $oMigrations->getRecorded()['20261101-would-fail']['status']);

        $aResult = $oMigrations->run();
        $this->assertSame([], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
    }

    public function testChangedFileIsNotRunAgain(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $this->_write('20261101-row.sql', "INSERT INTO `$sData` VALUES ('one');");

        $aLog = [];
        $oMigrations = $this->_migrations($aLog);
        $oMigrations->run();

        $this->_write('20261101-row.sql', "INSERT INTO `$sData` VALUES ('two');");
        $this->assertSame([], $oMigrations->run()['applied']);
        $this->assertSame(['one' => ''], $this->_rows($sData));
        $this->assertStringContainsString('20261101-row changed after it ran', implode("\n", $aLog));
    }

    public function testConnectionKeepsItsErrorMode(): void
    {
        $iMode = $this->_oPdo->getAttribute(PDO::ATTR_ERRMODE);
        $this->_write('20261101-broken.sql', "SELECT * FROM `table_that_does_not_exist_{$this->_sSuffix}`;");

        $this->_migrations()->run();

        $this->assertSame($iMode, $this->_oPdo->getAttribute(PDO::ATTR_ERRMODE));
    }

    public function testRefreshPendingUntilDone(): void
    {
        $this->_write('20261101-noop.sql', 'SELECT 1;');

        $oMigrations = $this->_migrations();
        $this->assertFalse($oMigrations->isRefreshPending());

        $oMigrations->run();
        $this->assertTrue($oMigrations->isRefreshPending(), 'set once a migration ran');
        $this->assertSame(['20261101-noop'], array_keys($oMigrations->getRecorded()), 'the flag is not a migration');

        $oMigrations->run();
        $this->assertTrue($oMigrations->isRefreshPending(), 'a later start with nothing to apply still sees it');

        $oMigrations->setRefreshDone();
        $this->assertFalse($oMigrations->isRefreshPending());
    }

    /**
     * Every shipped migration runs on this database without an SQL error (on CI a fresh install
     * of the same commit, which already has every change), and a second run changes no table.
     */
    public function testShippedMigrationsRun(): void
    {
        $sShipped = __DIR__ . '/../../../scripts/railway/migrations';
        if (!(new UnaRailwayMigrations($this->_oPdo, $sShipped))->listMigrations())
            $this->markTestSkipped('scripts/railway/migrations has no migrations yet');

        $this->_assertSecondRunChangesNothing($sShipped);
    }

    /**
     * The check above catches a migration that adds its rows again, whether or not it quotes
     * the table name, and one in PHP.
     */
    public function testSecondRunCheckCatchesDuplicates(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");

        foreach ([
            '20261101-unquoted.sql' => "INSERT IGNORE INTO $sData (v) VALUES ('again');",
            '20261101-php.php' => "<?php\nreturn function () { BxDolDb::getInstance()->query(\"INSERT INTO $sData VALUES ('again')\"); };",
        ] as $sName => $sContent) {
            array_map('unlink', glob($this->_sDir . '/*'));
            $this->_write($sName, $sContent);

            try {
                $this->_assertSecondRunChangesNothing($this->_sDir);
            }
            catch (\PHPUnit\Framework\AssertionFailedError $e) {
                $this->assertStringContainsString($sData, $e->getMessage(), $sName);
                continue;
            }
            $this->fail("$sName: a second run added a row and the check missed it");
        }
    }

    private function _assertSecondRunChangesNothing(string $sDir): void
    {
        $sSuffix = bin2hex(random_bytes(4));
        $aResult = (new UnaRailwayMigrations($this->_oPdo, $sDir, $this->_table('ledger_first_' . $sSuffix)))->run();
        $this->assertSame('', $aResult['failed'], $aResult['failed'] . ': ' . $aResult['error']);

        $aBefore = $this->_checksums();
        $aResult = (new UnaRailwayMigrations($this->_oPdo, $sDir, $this->_table('ledger_second_' . $sSuffix)))->run();
        $this->assertSame('', $aResult['failed'], 'second run: ' . $aResult['failed'] . ': ' . $aResult['error']);

        $aAfter = $this->_checksums();
        $aChanged = array_keys(array_diff_assoc($aAfter, $aBefore) + array_diff_key($aBefore, $aAfter));
        $this->assertSame([], $aChanged, 'a second run of the migrations changed these tables: ' . implode(', ', $aChanged));
    }

    /**
     * Every table but this test's own ledgers, which a run is expected to change.
     */
    private function _checksums(): array
    {
        $aTables = array_filter($this->_oPdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN), function ($sTable) {
            return strpos($sTable, 'test_migrations_ledger') !== 0;
        });

        $aResult = [];
        foreach (array_chunk($aTables, 100) as $aChunk)
            foreach ($this->_oPdo->query('CHECKSUM TABLE `' . implode('`, `', $aChunk) . '`', PDO::FETCH_NUM) as $aRow)
                $aResult[$aRow[0]] = $aRow[1];

        return $aResult;
    }

    private function _migrations(?array &$aLog = null): UnaRailwayMigrations
    {
        $aLog = [];
        return new UnaRailwayMigrations($this->_oPdo, $this->_sDir, $this->_table('ledger'), function (string $s) use (&$aLog) {
            $aLog[] = $s;
        });
    }

    private function _table(string $sName): string
    {
        $sTable = 'test_migrations_' . $sName . '_' . $this->_sSuffix;
        if (!in_array($sTable, $this->_aTables, true))
            $this->_aTables[] = $sTable;

        return $sTable;
    }

    private function _write(string $sName, string $sContent): void
    {
        file_put_contents($this->_sDir . '/' . $sName, $sContent);
    }

    private function _rows(string $sTable): array
    {
        $aResult = [];
        foreach ($this->_oPdo->query("SELECT * FROM `$sTable` ORDER BY `v`", PDO::FETCH_NUM) as $aRow)
            $aResult[$aRow[0]] = isset($aRow[1]) ? (int)$aRow[1] : '';

        return $aResult;
    }
}
