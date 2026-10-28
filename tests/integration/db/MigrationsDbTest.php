<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolMigrations against the test database: the ledger, order across folders, failures,
 * transactions, versions, language files, baselines and the rebuild after a run. Each case uses
 * its own ledger table, data tables, language keys and folders, and removes them afterwards.
 *
 * testShippedMigrationsRun runs the real migrations of migrations/ and of the installed modules,
 * which changes the test database the way a deploy changes a site.
 */
#[Group('integration')]
class MigrationsDbTest extends BxDolIntegrationTestCase
{
    private const SQL_META = "-- UNA-Migration-Min-System-Version: 15.0.0\n";
    private const PHP_HEAD = "<?php defined('BX_DOL') or die('hack attempt');\n// UNA-Migration-Min-System-Version: 15.0.0\n";
    private const XML_HEAD = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!-- UNA-Migration-Min-System-Version: 15.0.0 -->\n";

    private PDO $_oPdo;
    private string $_sSuffix = '';
    private string $_sDir = '';
    private array $_aTables = [];
    private array $_aKeys = [];

    protected function setUp(): void
    {
        parent::setUp();

        BxDolDb::getInstance();
        $this->_oPdo = BxDolDb::getLink();
        $this->_sSuffix = bin2hex(random_bytes(4));
        $this->_sDir = sys_get_temp_dir() . '/una-migrations-' . $this->_sSuffix;
        mkdir($this->_sDir . '/common', 0777, true);
        mkdir($this->_sDir . '/module');
    }

    protected function tearDown(): void
    {
        foreach ($this->_aTables as $sTable)
            $this->_oPdo->exec("DROP TABLE IF EXISTS `$sTable`");

        $oLanguages = BxDolStudioLanguagesUtils::getInstance();
        foreach ($this->_aKeys as $sKey)
            $oLanguages->deleteLanguageString($sKey, 0, false);

        foreach (['common', 'module'] as $sFolder) {
            array_map('unlink', glob($this->_sDir . "/$sFolder/*"));
            rmdir($this->_sDir . "/$sFolder");
        }
        rmdir($this->_sDir);

        parent::tearDown();
    }

    public function testRunsInOrderOnce(): void
    {
        $sData = $this->_table('data');
        $this->_write('2026110100_create.sql', self::SQL_META . "CREATE TABLE IF NOT EXISTS `$sData` (`v` varchar(32) NOT NULL, `n` int NOT NULL, PRIMARY KEY (`v`));");
        // An INSERT that leaves out a NOT NULL column without a default works, as in install SQL.
        // A statement that returns rows (here from a variable) must not block the next one.
        $this->_write('2026110200_rows.sql', self::SQL_META . "INSERT IGNORE INTO `$sData` (`v`) VALUES ('a');\nSELECT @n := 5;\nUPDATE `$sData` SET `n` = @n\nWHERE `v` = 'a';", 'module');
        $this->_write('2026110300_php.php', self::PHP_HEAD . "BxDolDb::getInstance()->query(\"INSERT INTO `$sData` (`v`) VALUES ('php')\");");
        $this->_write('2026110400_function.php', self::PHP_HEAD . "return function () { BxDolDb::getInstance()->query(\"INSERT INTO `$sData` (`v`) VALUES ('function')\"); };", 'module');

        $oMigrations = $this->_migrations();
        $aResult = $oMigrations->run(function () { return ''; });

        $this->assertSame(['common: 2026110100_create.sql', 'bx_test: 2026110200_rows.sql', 'common: 2026110300_php.php', 'bx_test: 2026110400_function.php'], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
        $this->assertSame(['a' => 5, 'function' => 0, 'php' => 0], $this->_rows($sData));

        $aRecorded = $oMigrations->getRecorded();
        $this->assertSame(['2026110100_create', '2026110300_php'], array_keys($aRecorded['']));
        $this->assertSame(['2026110200_rows', '2026110400_function'], array_keys($aRecorded['bx_test']));
        $this->assertSame('applied', $aRecorded['bx_test']['2026110200_rows']['status']);
        $this->assertSame(sha1_file($this->_sDir . '/module/2026110200_rows.sql'), $aRecorded['bx_test']['2026110200_rows']['checksum']);

        // The PHP migrations are not idempotent: a second run would fail on the duplicate key.
        $aResult = $oMigrations->run(function () { return ''; });
        $this->assertSame([], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
    }

    public function testFailureStopsAndRetries(): void
    {
        $sData = $this->_table('data');
        $this->_write('2026110100_create.sql', self::SQL_META . "CREATE TABLE IF NOT EXISTS `$sData` (`v` varchar(32) NOT NULL, PRIMARY KEY (`v`)) ENGINE=MyISAM;");
        $this->_write('2026110200_broken.sql', self::SQL_META . "INSERT INTO `$sData` (`v`) VALUES ('before');\nINSERT INTO `{$sData}_missing` (`v`) VALUES ('x');\nSELECT 1;", 'module');
        $this->_write('2026110300_later.sql', self::SQL_META . "INSERT INTO `$sData` (`v`) VALUES ('later');");

        $oMigrations = $this->_migrations();
        $aResult = $oMigrations->run(function () { return ''; });

        $this->assertSame(['common: 2026110100_create.sql'], $aResult['applied']);
        $this->assertSame('bx_test: 2026110200_broken.sql', $aResult['failed']);
        $this->assertStringContainsString('statement 2', $aResult['error']);
        $this->assertSame([''], array_keys($oMigrations->getRecorded()));
        $this->assertSame(['before' => ''], $this->_rows($sData), 'a MyISAM table keeps the statements before the failure');

        // Fixed in a later commit by editing the same file, made safe to run again.
        $this->_write('2026110200_broken.sql', self::SQL_META . "INSERT IGNORE INTO `$sData` (`v`) VALUES ('before');", 'module');
        $aResult = $oMigrations->run(function () { return ''; });

        $this->assertSame(['bx_test: 2026110200_broken.sql', 'common: 2026110300_later.sql'], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
        $this->assertSame(['before' => '', 'later' => ''], $this->_rows($sData));
    }

    public function testFailureRollsBackInnoDb(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL) ENGINE=InnoDB");
        $this->_write('2026110100_broken.sql', self::SQL_META . "INSERT INTO `$sData` (`v`) VALUES ('before');\nINSERT INTO `{$sData}_missing` (`v`) VALUES ('x');");

        $aResult = $this->_migrations()->run(function () { return ''; });

        $this->assertSame('common: 2026110100_broken.sql', $aResult['failed']);
        $this->assertSame([], $this->_rows($sData));
        $this->assertFalse($this->_oPdo->inTransaction());
    }

    public function testPhpReturningFalseFails(): void
    {
        $this->_write('2026110100_false.php', self::PHP_HEAD . 'return false;');
        $this->_write('2026110200_function_false.php', self::PHP_HEAD . 'return function () { return false; };');
        $this->_write('2026110300_throws.php', self::PHP_HEAD . "throw new RuntimeException('no transcoder');");

        $oMigrations = $this->_migrations();
        $this->assertSame('common: 2026110100_false.php', $oMigrations->run(function () { return ''; })['failed']);

        unlink($this->_sDir . '/common/2026110100_false.php');
        $this->assertSame('common: 2026110200_function_false.php', $oMigrations->run(function () { return ''; })['failed']);

        unlink($this->_sDir . '/common/2026110200_function_false.php');
        $aResult = $oMigrations->run(function () { return ''; });
        $this->assertSame('common: 2026110300_throws.php', $aResult['failed']);
        $this->assertSame('no transcoder', $aResult['error']);
        $this->assertSame([], $oMigrations->getRecorded());
    }

    public function testNewerSystemVersionStops(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $this->_write('2026110100_now.sql', "-- UNA-Migration-Min-System-Version: 15.0.0-RC3\nINSERT INTO `$sData` VALUES ('now');");
        $this->_write('2026110200_later.sql', "-- UNA-Migration-Min-System-Version: 15.0.0\nINSERT INTO `$sData` VALUES ('later');");
        $this->_write('2026110300_after.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('after');");

        $aResult = $this->_migrations($aLog, '15.0.0-RC3')->run(function () { return ''; });

        $this->assertSame(['common: 2026110100_now.sql'], $aResult['applied']);
        $this->assertSame('common: 2026110200_later.sql', $aResult['failed']);
        $this->assertSame('needs UNA 15.0.0 or later; this site has 15.0.0-RC3', $aResult['error']);
        $this->assertSame(['now' => ''], $this->_rows($sData));
    }

    public function testLanguageStrings(): void
    {
        $sAdd = $this->_key('add');
        $sUpd = $this->_key('upd');
        $sDel = $this->_key('del');
        $oLanguages = BxDolStudioLanguagesUtils::getInstance();
        $iCategory = $oLanguages->getLanguageCategory('System');
        $oLanguages->addLanguageString($sUpd, 'Old', 0, $iCategory, false);
        $oLanguages->addLanguageString($sDel, 'Gone', 0, $iCategory, false);

        $this->_write('2026110100_strings.xml', self::XML_HEAD . "<resources name=\"en\" flag=\"gb\" title=\"English\">
    <string_add name=\"$sAdd\"><![CDATA[New <b>&</b> Grüße]]></string_add>
    <string_upd name=\"$sUpd\"><![CDATA[Changed]]></string_upd>
    <string_del name=\"$sDel\"></string_del>
</resources>", 'module');
        $this->_write('2026110200_other_language.xml', self::XML_HEAD . "<resources name=\"zz\" flag=\"zz\" title=\"Not installed\">
    <string_add name=\"$sAdd\"><![CDATA[Never]]></string_add>
</resources>");

        $aLog = [];
        $aResult = $this->_migrations($aLog)->run(function () { return ''; });

        $this->assertSame(['bx_test: 2026110100_strings.xml', 'common: 2026110200_other_language.xml'], $aResult['applied']);
        $this->assertSame(['en' => 'New <b>&</b> Grüße'], $this->_strings($sAdd));
        $this->assertSame('Changed', $this->_strings($sUpd)['en']);
        $this->assertSame([], $this->_strings($sDel));
        $this->assertStringContainsString('language zz is not installed', implode("\n", $aLog));
    }

    public function testBaselineRecordsWithoutRunning(): void
    {
        $this->_write('2026110100_would_fail.sql', self::SQL_META . "INSERT INTO `table_that_does_not_exist_{$this->_sSuffix}` VALUES (1);");
        $this->_write('2026110100_module.sql', self::SQL_META . "INSERT INTO `table_that_does_not_exist_{$this->_sSuffix}` VALUES (1);", 'module');

        $oMigrations = $this->_migrations();
        $this->assertSame(2, $oMigrations->baseline());
        $this->assertSame(0, $oMigrations->baseline());
        $this->assertSame('baseline', $oMigrations->getRecorded()['bx_test']['2026110100_module']['status']);

        $aResult = $oMigrations->run(function () { return ''; });
        $this->assertSame([], $aResult['applied']);
        $this->assertSame('', $aResult['failed']);
    }

    public function testBaselineModuleWithoutLedger(): void
    {
        $oMigrations = new BxDolMigrations(new BxDolMigrationsQuery('test_migrations_none_' . $this->_sSuffix));
        $this->assertSame(0, $oMigrations->baselineModule('system/'));
    }

    public function testBaselineFile(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $sCovers = '-- ' . BxDolMigrations::META_COVERS . ': 2026110100_one 2026110200_two';
        $this->_write('2026110100_one.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('one');");
        $this->_write('2026110200_two.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('two');");

        // A database that ran both: the baseline is recorded, its statements never run.
        $oRan = $this->_migrations();
        $oRan->run(function () { return ''; });
        unlink($this->_sDir . '/common/2026110100_one.sql');
        unlink($this->_sDir . '/common/2026110200_two.sql');
        $this->_write('2026110300_baseline.sql', self::SQL_META . "$sCovers\nINSERT INTO `$sData` VALUES ('baseline');");

        $aResult = $oRan->run(function () { return ''; });
        $this->assertSame([], $aResult['applied']);
        $this->assertSame(['common: 2026110300_baseline.sql'], $aResult['baseline']);
        $this->assertSame('baseline', $oRan->getRecorded()['']['2026110300_baseline']['status']);
        $this->assertSame(['one' => '', 'two' => ''], $this->_rows($sData));

        // A database that never ran them runs the baseline's statements.
        $aResult = $this->_migrations($aLog, '99.0.0', 'ledger_new')->run(function () { return ''; });
        $this->assertSame(['common: 2026110300_baseline.sql'], $aResult['applied']);
        $this->assertSame(['baseline' => '', 'one' => '', 'two' => ''], $this->_rows($sData));

        // A baseline with nothing to run fails there and names what that database misses.
        $this->_write('2026110300_baseline.sql', self::SQL_META . "$sCovers\n-- the changes are in install SQL");
        $aResult = $this->_migrations($aLog, '99.0.0', 'ledger_empty')->run(function () { return ''; });
        $this->assertSame('common: 2026110300_baseline.sql', $aResult['failed']);
        $this->assertStringContainsString('never ran 2026110100_one, 2026110200_two', $aResult['error']);
    }

    public function testChangedFileIsNotRunAgain(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $this->_write('2026110100_row.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('one');");

        $aLog = [];
        $oMigrations = $this->_migrations($aLog);
        $oMigrations->run(function () { return ''; });

        $this->_write('2026110100_row.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('two');");
        $this->assertSame([], $oMigrations->run(function () { return ''; })['applied']);
        $this->assertSame(['one' => ''], $this->_rows($sData));
        $this->assertStringContainsString('common: 2026110100_row.sql changed after it ran', implode("\n", $aLog));
    }

    public function testInvalidFileStopsBeforeAnything(): void
    {
        $sData = $this->_table('data');
        $this->_oPdo->exec("CREATE TABLE `$sData` (`v` varchar(32) NOT NULL)");
        $this->_write('2026110100_row.sql', self::SQL_META . "INSERT INTO `$sData` VALUES ('one');");
        $this->_write('2026110200_no_version.sql', "INSERT INTO `$sData` VALUES ('two');", 'module');

        try {
            $this->_migrations()->run(function () { return ''; });
            $this->fail('an invalid file was accepted');
        }
        catch (UnexpectedValueException $e) {
            $this->assertStringContainsString('2026110200_no_version.sql', $e->getMessage());
        }
        $this->assertSame([], $this->_rows($sData));
    }

    public function testConnectionKeepsItsErrorMode(): void
    {
        $iMode = $this->_oPdo->getAttribute(PDO::ATTR_ERRMODE);
        $this->_write('2026110100_broken.sql', self::SQL_META . "SELECT * FROM `table_that_does_not_exist_{$this->_sSuffix}`;");

        $this->_migrations()->run(function () { return ''; });

        $this->assertSame($iMode, $this->_oPdo->getAttribute(PDO::ATTR_ERRMODE));
    }

    public function testRefreshUntilItSucceeds(): void
    {
        $this->_write('2026110100_noop.sql', self::SQL_META . 'SELECT 1;');
        $aCalls = [];
        $fRefresh = function () use (&$aCalls) {
            $aCalls[] = 'refresh';
            return count($aCalls) === 1 ? 'clearing the db cache' : '';
        };

        $oMigrations = $this->_migrations();
        $this->assertFalse($oMigrations->isRefreshPending());

        $aResult = $oMigrations->run($fRefresh);
        $this->assertSame(['common: 2026110100_noop.sql'], $aResult['applied']);
        $this->assertFalse($aResult['refreshed']);
        $this->assertSame('clearing the db cache', $aResult['refresh_error']);
        $this->assertTrue($oMigrations->isRefreshPending(), 'a failed rebuild keeps the flag');
        $this->assertSame(['2026110100_noop'], array_keys($oMigrations->getRecorded()['']), 'the flag is not a migration');

        // The next run has nothing to apply but rebuilds again, and clears the flag.
        $aResult = $oMigrations->run($fRefresh);
        $this->assertSame([], $aResult['applied']);
        $this->assertTrue($aResult['refreshed']);
        $this->assertFalse($oMigrations->isRefreshPending());

        $aResult = $oMigrations->run($fRefresh);
        $this->assertFalse($aResult['refreshed'], 'nothing pending, nothing rebuilt');
        $this->assertSame(['refresh', 'refresh'], $aCalls);
    }

    public function testRefreshAfterFailedMigration(): void
    {
        $this->_write('2026110100_ok.sql', self::SQL_META . 'SELECT 1;');
        $this->_write('2026110200_broken.sql', self::SQL_META . "SELECT * FROM `table_that_does_not_exist_{$this->_sSuffix}`;");

        $aResult = $this->_migrations()->run(function () {
            throw new RuntimeException('cache folder is read-only');
        });

        $this->assertSame('common: 2026110200_broken.sql', $aResult['failed']);
        $this->assertSame('cache folder is read-only', $aResult['refresh_error'], 'the migration before the failure still gets its rebuild');
    }

    /**
     * Every shipped migration (migrations/ and the installed modules' folders) runs on this
     * database without an error (on CI a fresh install of the same commit, which already has
     * every change), and a second run changes no table.
     */
    public function testShippedMigrationsRun(): void
    {
        $oShipped = new BxDolMigrations(new BxDolMigrationsQuery());
        $aSources = $oShipped->getSources();
        if (!$oShipped->listMigrations())
            $this->markTestSkipped('no migrations in migrations/ or the installed modules yet');

        $this->_assertSecondRunChangesNothing($aSources);
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
            '2026110100_unquoted.sql' => self::SQL_META . "INSERT IGNORE INTO $sData (v) VALUES ('again');",
            '2026110100_php.php' => self::PHP_HEAD . "BxDolDb::getInstance()->query(\"INSERT INTO $sData VALUES ('again')\");",
        ] as $sName => $sContent) {
            array_map('unlink', glob($this->_sDir . '/common/*'));
            $this->_write($sName, $sContent);

            try {
                $this->_assertSecondRunChangesNothing([$this->_source('common')], '99.0.0');
            }
            catch (\PHPUnit\Framework\AssertionFailedError $e) {
                $this->assertStringContainsString($sData, $e->getMessage(), $sName);
                continue;
            }
            $this->fail("$sName: a second run added a row and the check missed it");
        }
    }

    /**
     * @param string|null $sVersion null for the installed system version
     */
    private function _assertSecondRunChangesNothing(array $aSources, ?string $sVersion = null): void
    {
        $sSuffix = bin2hex(random_bytes(4));
        $fRefresh = function () { return ''; };

        $aResult = (new BxDolMigrations(new BxDolMigrationsQuery($this->_table('ledger_first_' . $sSuffix)), $aSources, null, $sVersion))->run($fRefresh);
        $this->assertSame('', $aResult['failed'], $aResult['failed'] . ': ' . $aResult['error']);

        $aBefore = $this->_checksums();
        $aResult = (new BxDolMigrations(new BxDolMigrationsQuery($this->_table('ledger_second_' . $sSuffix)), $aSources, null, $sVersion))->run($fRefresh);
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
            return !str_starts_with($sTable, 'test_migrations_ledger');
        });

        $aResult = [];
        foreach (array_chunk($aTables, 100) as $aChunk)
            foreach ($this->_oPdo->query('CHECKSUM TABLE `' . implode('`, `', $aChunk) . '`', PDO::FETCH_NUM) as $aRow)
                $aResult[$aRow[0]] = $aRow[1];

        return $aResult;
    }

    /**
     * Two folders: common, and one of a module `bx_test` in the System language category.
     */
    private function _migrations(?array &$aLog = null, string $sVersion = '99.0.0', string $sLedger = 'ledger'): BxDolMigrations
    {
        $aLog = [];
        return new BxDolMigrations(
            new BxDolMigrationsQuery($this->_table($sLedger)),
            [$this->_source('common'), $this->_source('module')],
            function (string $s) use (&$aLog) {
                $aLog[] = $s;
            },
            $sVersion
        );
    }

    private function _source(string $sFolder): array
    {
        return $sFolder === 'common'
            ? ['scope' => 'common', 'module' => '', 'dir' => $this->_sDir . '/common', 'lang_category' => '']
            : ['scope' => 'module', 'module' => 'bx_test', 'dir' => $this->_sDir . '/module', 'lang_category' => 'System'];
    }

    private function _table(string $sName): string
    {
        $sTable = 'test_migrations_' . $sName . '_' . $this->_sSuffix;
        if (!in_array($sTable, $this->_aTables, true))
            $this->_aTables[] = $sTable;

        return $sTable;
    }

    private function _key(string $sName): string
    {
        return $this->_aKeys[] = '_test_migrations_' . $sName . '_' . $this->_sSuffix;
    }

    private function _write(string $sName, string $sContent, string $sFolder = 'common'): void
    {
        file_put_contents($this->_sDir . "/$sFolder/$sName", $sContent);
    }

    private function _rows(string $sTable): array
    {
        $aResult = [];
        foreach ($this->_oPdo->query("SELECT * FROM `$sTable` ORDER BY `v`", PDO::FETCH_NUM) as $aRow)
            $aResult[$aRow[0]] = isset($aRow[1]) ? (int)$aRow[1] : '';

        return $aResult;
    }

    /**
     * @return array<string, string> by language name
     */
    private function _strings(string $sKey): array
    {
        $oStatement = $this->_oPdo->prepare("SELECT `l`.`Name`, `s`.`String`
            FROM `sys_localization_keys` AS `k`
            INNER JOIN `sys_localization_strings` AS `s` ON `s`.`IDKey` = `k`.`ID`
            INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
            WHERE `k`.`Key` = ?");
        $oStatement->execute([$sKey]);
        return $oStatement->fetchAll(PDO::FETCH_KEY_PAIR);
    }
}
