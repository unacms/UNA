<?php

use PHPUnit\Framework\Attributes\DataProvider;

require_once(__DIR__ . '/../../../scripts/railway/Migrations.php');

/**
 * scripts/railway/Migrations.php without a database: file names and order, the module line,
 * and splitting SQL into statements.
 */
class RailwayMigrationsTest extends BxDolTestCase
{
    private string $_sDir = '';

    protected function tearDown(): void
    {
        if ($this->_sDir !== '' && is_dir($this->_sDir)) {
            array_map('unlink', glob($this->_sDir . '/*'));
            rmdir($this->_sDir);
        }

        parent::tearDown();
    }

    public static function providerSplitSql(): array
    {
        return [
            'two statements' => ["SELECT 1;\nSELECT 2;", ['SELECT 1', 'SELECT 2']],
            'last without semicolon' => ["SELECT 1;\nSELECT 2", ['SELECT 1', 'SELECT 2']],
            'line breaks kept' => ["UPDATE `t` SET `a` = 0\nWHERE `b` = 1;", ["UPDATE `t` SET `a` = 0\nWHERE `b` = 1"]],
            'semicolon in a string' => ["INSERT INTO `t` VALUES ('a;b');", ["INSERT INTO `t` VALUES ('a;b')"]],
            'escaped quote' => ["INSERT INTO `t` VALUES ('it\\'s; ok');SELECT 2;", ["INSERT INTO `t` VALUES ('it\\'s; ok')", 'SELECT 2']],
            'doubled quote' => ["INSERT INTO `t` VALUES ('it''s; ok');", ["INSERT INTO `t` VALUES ('it''s; ok')"]],
            'serialized value' => ["INSERT INTO `t` VALUES ('a:1:{s:1:\"h\";s:3:\"720\";}');", ["INSERT INTO `t` VALUES ('a:1:{s:1:\"h\";s:3:\"720\";}')"]],
            'semicolon in an identifier' => ["SELECT `a;b` FROM `t`;", ['SELECT `a;b` FROM `t`']],
            'line comments' => ["-- first\nSELECT 1; -- after\n# hash\nSELECT 2;", ['SELECT 1', 'SELECT 2']],
            'comment marker in a string' => ["SELECT '-- no', '# no';", ["SELECT '-- no', '# no'"]],
            'minus minus without space' => ["SELECT 1--1;", ['SELECT 1--1']],
            'block comment' => ["/* note; with semicolon */SELECT 1;", ['SELECT 1']],
            'block comment between tokens' => ["SELECT/**/1;", ['SELECT 1']],
            'executable comment kept' => ["/*!40101 SET NAMES utf8mb4 */;", ['/*!40101 SET NAMES utf8mb4 */']],
            'only comments' => ["-- nothing\n\n", []],
            'delimiter' => [
                "DELIMITER //\nCREATE PROCEDURE p() BEGIN SELECT 1; SELECT 2; END//\nDELIMITER ;\nSELECT 3;",
                ['CREATE PROCEDURE p() BEGIN SELECT 1; SELECT 2; END', 'SELECT 3'],
            ],
            'crlf' => ["SELECT 1;\r\n-- c\r\nSELECT 2;\r\n", ['SELECT 1', 'SELECT 2']],
            'multibyte text' => ["UPDATE `t` SET `s` = 'Grüße; 日本';", ["UPDATE `t` SET `s` = 'Grüße; 日本'"]],
        ];
    }

    #[DataProvider('providerSplitSql')]
    public function testSplitSql(string $sSql, array $aExpected): void
    {
        $this->assertSame($aExpected, UnaRailwayMigrations::splitSql($sSql));
    }

    public function testParseModule(): void
    {
        $this->assertSame('bx_posts', UnaRailwayMigrations::parseModule("-- module: bx_posts\nUPDATE `t` SET `a` = 1;"));
        $this->assertSame('bx_posts', UnaRailwayMigrations::parseModule("-- Posts menu\n--   module:  bx_posts  \r\nSELECT 1;"));
        $this->assertSame('bx_groups', UnaRailwayMigrations::parseModule("<?php\n// module: bx_groups\nreturn function () {};"));
        $this->assertSame('', UnaRailwayMigrations::parseModule("UPDATE `t` SET `module` = 'x'; -- module: bx_posts"));
        $this->assertSame('', UnaRailwayMigrations::parseModule("SELECT 1;"));
    }

    public function testListOrdersByName(): void
    {
        $this->_files([
            '20261102-second.sql' => 'SELECT 2;',
            '20261101-first.php' => "<?php\nreturn function () {};",
            '20261102-a-third.sql' => "-- module: bx_posts\nSELECT 3;",
            'README.md' => 'not a migration',
        ]);

        $aList = $this->_migrations()->listMigrations();

        $this->assertSame(['20261101-first', '20261102-a-third', '20261102-second'], array_keys($aList));
        $this->assertSame('php', $aList['20261101-first']['type']);
        $this->assertSame('bx_posts', $aList['20261102-a-third']['module']);
        $this->assertSame(sha1('SELECT 2;'), $aList['20261102-second']['checksum']);
    }

    public function testListRejectsBadName(): void
    {
        $this->_files(['2026-11-01-first.sql' => 'SELECT 1;']);

        $this->expectException(UnexpectedValueException::class);
        $this->_migrations()->listMigrations();
    }

    public function testListRejectsSameIdTwice(): void
    {
        $this->_files(['20261101-first.sql' => 'SELECT 1;', '20261101-first.php' => '<?php return function () {};']);

        $this->expectException(UnexpectedValueException::class);
        $this->_migrations()->listMigrations();
    }

    public function testMissingFolderHasNone(): void
    {
        $this->assertSame([], (new UnaRailwayMigrations($this->createStub(PDO::class), '/nonexistent/migrations'))->listMigrations());
    }

    public function testBadLedgerName(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new UnaRailwayMigrations($this->createStub(PDO::class), '/tmp', 'sys_x`; DROP TABLE `sys_options');
    }

    /**
     * Every file in scripts/railway/migrations has a name the runner accepts.
     */
    public function testShippedMigrationNames(): void
    {
        $oMigrations = new UnaRailwayMigrations($this->createStub(PDO::class), __DIR__ . '/../../../scripts/railway/migrations');
        $this->assertIsArray($oMigrations->listMigrations());
    }

    private function _files(array $aFiles): void
    {
        $this->_sDir = sys_get_temp_dir() . '/una-migrations-' . bin2hex(random_bytes(4));
        mkdir($this->_sDir);
        foreach ($aFiles as $sName => $sContent)
            file_put_contents($this->_sDir . '/' . $sName, $sContent);
    }

    private function _migrations(): UnaRailwayMigrations
    {
        return new UnaRailwayMigrations($this->createStub(PDO::class), $this->_sDir);
    }
}
