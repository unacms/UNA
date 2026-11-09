<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * BxDolMigrationsHelper against the test database: every shorthand runs twice and the second run
 * changes nothing. Each case uses its own table and module row and removes them afterwards.
 */
#[Group('integration')]
class MigrationsHelperDbTest extends BxDolIntegrationTestCase
{
    private PDO $_oPdo;
    private string $_sSuffix = '';
    private string $_sTable = '';
    private string $_sUri = '';

    protected function setUp(): void
    {
        parent::setUp();

        BxDolDb::getInstance();
        $this->_oPdo = BxDolDb::getLink();
        $this->_sSuffix = bin2hex(random_bytes(4));
        $this->_sTable = 'bx_test_helper_' . $this->_sSuffix;
        $this->_sUri = 'bx_test_helper_' . $this->_sSuffix;
        $this->_oPdo->exec("CREATE TABLE `{$this->_sTable}` (`id` int NOT NULL, `a` int NOT NULL DEFAULT 0, PRIMARY KEY (`id`))");
    }

    protected function tearDown(): void
    {
        $this->_oPdo->exec("DROP TABLE IF EXISTS `{$this->_sTable}`");
        $this->_oPdo->prepare("DELETE FROM `sys_modules` WHERE `uri` = ?")->execute([$this->_sUri]);

        parent::tearDown();
    }

    public function testAddColumnOnce(): void
    {
        $this->assertTrue(BxDolMigrationsHelper::addColumn($this->_sTable, 'b', "varchar(16) NOT NULL DEFAULT 'x' AFTER `a`"));
        $this->assertFalse(BxDolMigrationsHelper::addColumn($this->_sTable, 'b', "varchar(16) NOT NULL DEFAULT 'x' AFTER `a`"));

        $this->assertSame(['id', 'a', 'b'], $this->_oPdo->query("SHOW COLUMNS FROM `{$this->_sTable}`")->fetchAll(PDO::FETCH_COLUMN));
    }

    public function testAddIndexOnce(): void
    {
        $this->assertTrue(BxDolMigrationsHelper::addIndex($this->_sTable, 'a_id', ['a', 'id']));
        $this->assertFalse(BxDolMigrationsHelper::addIndex($this->_sTable, 'a_id', ['a', 'id']));
        $this->assertTrue(BxDolMigrationsHelper::addIndex($this->_sTable, 'a_only', 'a'));

        $aColumns = $this->_oPdo->query("SHOW INDEXES FROM `{$this->_sTable}` WHERE `Key_name` = 'a_id'")->fetchAll(PDO::FETCH_COLUMN, 4);
        $this->assertSame(['a', 'id'], $aColumns);
    }

    public function testBadNamesAreRefused(): void
    {
        $this->expectException(InvalidArgumentException::class);
        BxDolMigrationsHelper::addColumn($this->_sTable, 'b` int, ADD `c', 'int');
    }

    public function testBadDefinitionIsRefused(): void
    {
        $this->expectException(InvalidArgumentException::class);
        BxDolMigrationsHelper::addColumn($this->_sTable, 'b', 'int; DROP TABLE `sys_modules`');
    }

    public function testModuleUpdatedOnlyFromTheOldVersion(): void
    {
        $this->_insertModule('15.0.0.RC3');

        // The row spells the version with a dot, the migration with a dash.
        $this->assertTrue(BxDolMigrationsHelper::moduleUpdated($this->_sUri, '15.0.0-RC3', '15.0.0-RC4'));
        $this->assertSame('15.0.0-RC4', $this->_version());

        $this->assertFalse(BxDolMigrationsHelper::moduleUpdated($this->_sUri, '15.0.0-RC3', '15.0.0-RC4'));
        $this->assertSame('15.0.0-RC4', $this->_version());

        // A site that is ahead of the migration keeps its version.
        $this->_oPdo->prepare("UPDATE `sys_modules` SET `version` = '15.1.0' WHERE `uri` = ?")->execute([$this->_sUri]);
        $this->assertFalse(BxDolMigrationsHelper::moduleUpdated($this->_sUri, '15.0.0-RC3', '15.0.0-RC4'));
        $this->assertSame('15.1.0', $this->_version());
    }

    public function testModuleUpdatedUnknownModule(): void
    {
        $this->assertFalse(BxDolMigrationsHelper::moduleUpdated($this->_sUri, '1.0.0', '1.0.1'));
    }

    private function _insertModule(string $sVersion): void
    {
        $oStatement = $this->_oPdo->prepare("INSERT INTO `sys_modules` (`type`, `name`, `title`, `vendor`, `version`, `path`, `uri`, `class_prefix`, `db_prefix`, `lang_category`, `dependencies`, `date`, `enabled`) VALUES ('module', ?, 'Test', 'UNA INC', ?, 'bx_nosuch/', ?, 'BxTest', 'bx_test_', '', '', UNIX_TIMESTAMP(), 0)");
        $oStatement->execute([$this->_sUri, $sVersion, $this->_sUri]);
    }

    private function _version(): string
    {
        $oStatement = $this->_oPdo->prepare("SELECT `version` FROM `sys_modules` WHERE `uri` = ?");
        $oStatement->execute([$this->_sUri]);
        return (string)$oStatement->fetchColumn();
    }
}
