<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * BxDolMigrations without a database: file names, metadata, language files, order across
 * folders, splitting SQL into statements, and the check CI runs on the source tree.
 */
class BxDolMigrationsTest extends BxDolTestCase
{
    private const SQL_META = "-- UNA-Migration-Min-System-Version: 15.0.0\n";
    private const PHP_HEAD = "<?php defined('BX_DOL') or die('hack attempt');\n// UNA-Migration-Min-System-Version: 15.0.0\n";
    private const XML_HEAD = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!-- UNA-Migration-Min-System-Version: 15.0.0 -->\n";

    private string $_sDir = '';

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sDir = sys_get_temp_dir() . '/una-migrations-' . bin2hex(random_bytes(4));
        mkdir($this->_sDir);
    }

    protected function tearDown(): void
    {
        $this->_remove($this->_sDir);

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
        $this->assertSame($aExpected, BxDolMigrations::splitSql($sSql));
    }

    public function testParseMeta(): void
    {
        $sKey = BxDolMigrations::META_MIN_VERSION;
        $this->assertSame('15.0.0', BxDolMigrations::parseMeta("-- $sKey: 15.0.0\nSELECT 1;", $sKey));
        $this->assertSame('15.0.0-RC3', BxDolMigrations::parseMeta("/*\n * $sKey:   15.0.0-RC3  \r\n */", $sKey));
        $this->assertSame('15.0.0', BxDolMigrations::parseMeta("<!-- $sKey: 15.0.0 -->", $sKey));
        $this->assertSame('15.0.0', BxDolMigrations::parseMeta("/* $sKey: 15.0.0 */", $sKey));
        $this->assertNull(BxDolMigrations::parseMeta('SELECT 1;', $sKey));
    }

    public static function providerBadFiles(): array
    {
        $sVersion = BxDolMigrations::META_MIN_VERSION;
        $sCovers = BxDolMigrations::META_COVERS;
        return [
            'dashes' => ['2026-11-01_first.sql', self::SQL_META . 'SELECT 1;', 'file names are'],
            'no serial' => ['20261101_first.sql', self::SQL_META . 'SELECT 1;', 'file names are'],
            'not a date' => ['2026133100_first.sql', self::SQL_META . 'SELECT 1;', 'file names are'],
            'uppercase' => ['2026110100_First.sql', self::SQL_META . 'SELECT 1;', 'file names are'],
            'hyphen' => ['2026110100_first-one.sql', self::SQL_META . 'SELECT 1;', 'file names are'],
            'uppercase extension' => ['2026110100_first.SQL', self::SQL_META . 'SELECT 1;', 'file names are'],
            'unknown type' => ['2026110100_first.txt', 'x', 'unknown migration type'],
            'no version' => ['2026110100_first.sql', 'SELECT 1;', "no $sVersion"],
            'bad version' => ['2026110100_first.sql', "-- $sVersion: latest\nSELECT 1;", 'not a version'],
            'php without guard' => ['2026110100_first.php', "<?php\n// $sVersion: 15.0.0\nreturn 1;", "defined('BX_DOL')"],
            'xml baseline' => ['2026110100_first.xml', self::XML_HEAD . "<!-- $sCovers: 2026100100_old -->\n<resources name=\"en\" flag=\"gb\" title=\"English\"/>", 'a baseline is'],
            'covers a file name' => ['2026110100_first.sql', self::SQL_META . "-- $sCovers: 2026100100_old.sql\nSELECT 1;", 'not a migration id'],
            'covers nothing' => ['2026110100_first.sql', self::SQL_META . "-- $sCovers:\nSELECT 1;", 'lists no migrations'],
            'xml syntax' => ['2026110100_first.xml', self::XML_HEAD . '<resources name="en" flag="gb" title="English"><string_add name="_a">x</string_upd></resources>', 'not valid XML'],
            'xml root' => ['2026110100_first.xml', self::XML_HEAD . '<strings name="en" flag="gb" title="English"/>', '<resources>'],
            'xml no flag' => ['2026110100_first.xml', self::XML_HEAD . '<resources name="en" title="English"/>', 'no flag attribute'],
            'xml operation' => ['2026110100_first.xml', self::XML_HEAD . '<resources name="en" flag="gb" title="English"><string name="_a">x</string></resources>', '<string> is not one of'],
            'xml no key' => ['2026110100_first.xml', self::XML_HEAD . '<resources name="en" flag="gb" title="English"><string_upd>x</string_upd></resources>', 'no name attribute'],
        ];
    }

    #[DataProvider('providerBadFiles')]
    public function testReadFileRejects(string $sName, string $sContent, string $sMessage): void
    {
        file_put_contents($this->_sDir . '/' . $sName, $sContent);

        try {
            BxDolMigrations::readFile($this->_sDir . '/' . $sName);
        }
        catch (UnexpectedValueException $e) {
            $this->assertStringStartsWith($sName . ': ', $e->getMessage(), 'the error names the file');
            $this->assertStringContainsString($sMessage, $e->getMessage());
            return;
        }
        $this->fail("$sName was accepted");
    }

    public function testReadFile(): void
    {
        $sCovers = BxDolMigrations::META_COVERS;
        $sContent = self::PHP_HEAD . "// $sCovers: 2026100100_old, 2026100200_older\nreturn true;";
        file_put_contents($this->_sDir . '/2026110100_baseline_one.php', $sContent);

        $this->assertSame([
            'name' => '2026110100_baseline_one.php',
            'id' => '2026110100_baseline_one',
            'path' => $this->_sDir . '/2026110100_baseline_one.php',
            'type' => 'php',
            'checksum' => sha1($sContent),
            'min_version' => '15.0.0',
            'covers' => ['2026100100_old', '2026100200_older'],
        ], BxDolMigrations::readFile($this->_sDir . '/2026110100_baseline_one.php'));
    }

    public function testReadLanguageFile(): void
    {
        $this->assertSame([
            'name' => 'en',
            'category' => 'bx_posts',
            'add' => ['_a' => 'A & <b>b</b>'],
            'upd' => ['_b' => 'B'],
            'del' => ['_c'],
        ], BxDolMigrations::readLanguageFile(self::XML_HEAD . '<resources name="en" flag="gb" title="English" category="bx_posts">
            <string_add name="_a"><![CDATA[A & <b>b</b>]]></string_add>
            <string_upd name="_b">B</string_upd>
            <string_del name="_c"></string_del>
        </resources>'));
    }

    public function testFolderRejectsSameSerialTwice(): void
    {
        $this->_files('common', [
            '2026110100_first.sql' => self::SQL_META . 'SELECT 1;',
            '2026110100_first_strings.xml' => self::XML_HEAD . '<resources name="en" flag="gb" title="English"/>',
        ]);

        $this->expectExceptionMessage('same YYYYMMDDNN');
        BxDolMigrations::readFolder($this->_sDir . '/common');
    }

    public function testFolderRejectsCoveringLaterMigration(): void
    {
        $this->_files('common', [
            '2026110100_baseline.sql' => self::SQL_META . '-- ' . BxDolMigrations::META_COVERS . ": 2026110200_later\nSELECT 1;",
        ]);

        $this->expectExceptionMessage('not earlier than the baseline');
        BxDolMigrations::readFolder($this->_sDir . '/common');
    }

    public function testMissingFolderHasNone(): void
    {
        $this->assertSame([], BxDolMigrations::readFolder($this->_sDir . '/nonexistent'));
    }

    public function testOrderAcrossFolders(): void
    {
        $this->_files('common', [
            '2026110200_common.sql' => self::SQL_META . 'SELECT 2;',
            '2026110100_common_first.php' => self::PHP_HEAD . 'return true;',
            'README.md' => 'not a migration',
            '.htaccess' => 'Deny from all',
        ]);
        $this->_files('system', ['2026110200_system.sql' => self::SQL_META . 'SELECT 2;']);
        $this->_files('posts', [
            '2026110200_posts.sql' => self::SQL_META . 'SELECT 2;',
            '2026103100_posts_first.xml' => self::XML_HEAD . '<resources name="en" flag="gb" title="English"/>',
        ]);
        $this->_files('albums', ['2026110200_albums.sql' => self::SQL_META . 'SELECT 2;']);

        $oMigrations = new BxDolMigrations($this->createStub(BxDolMigrationsQuery::class), [
            $this->_source('module', 'bx_posts', 'posts'),
            $this->_source('module', 'bx_albums', 'albums'),
            $this->_source('system', 'system', 'system'),
            $this->_source('common', '', 'common'),
        ]);

        $this->assertSame([
            'bx_posts: 2026103100_posts_first.xml',
            'common: 2026110100_common_first.php',
            'common: 2026110200_common.sql',
            'system: 2026110200_system.sql',
            'bx_albums: 2026110200_albums.sql',
            'bx_posts: 2026110200_posts.sql',
        ], array_column($oMigrations->listMigrations(), 'label'));
    }

    public function testValidateTree(): void
    {
        $this->_files('migrations', ['2026110100_ok.sql' => self::SQL_META . 'SELECT 1;']);
        $this->_files('modules/system/migrations', ['2026110100_ok.sql' => self::SQL_META . 'SELECT 1;']);
        $this->_files('modules/boonex/posts/migrations', ['2026110100_bad.sql' => 'SELECT 1;']);

        $this->assertSame(
            ['modules/boonex/posts/migrations/2026110100_bad.sql: no ' . BxDolMigrations::META_MIN_VERSION . ' line'],
            BxDolMigrations::validateTree($this->_sDir)
        );
    }

    /**
     * Every migration in this source tree passes the check CI runs.
     */
    public function testShippedMigrationsAreValid(): void
    {
        $this->assertSame([], BxDolMigrations::validateTree(__DIR__ . '/../../../..'));
    }

    public function testBadLedgerName(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new BxDolMigrationsQuery('sys_x`; DROP TABLE `sys_options');
    }

    private function _files(string $sFolder, array $aFiles): void
    {
        $sDir = $this->_sDir . '/' . $sFolder;
        mkdir($sDir, 0777, true);
        foreach ($aFiles as $sName => $sContent)
            file_put_contents($sDir . '/' . $sName, $sContent);
    }

    private function _source(string $sScope, string $sModule, string $sFolder): array
    {
        return ['scope' => $sScope, 'module' => $sModule, 'dir' => $this->_sDir . '/' . $sFolder, 'lang_category' => ''];
    }

    private function _remove(string $sPath): void
    {
        if (is_dir($sPath) && !is_link($sPath)) {
            foreach (array_diff(scandir($sPath), ['.', '..']) as $sName)
                $this->_remove($sPath . '/' . $sName);
            rmdir($sPath);
        }
        else if (file_exists($sPath)) {
            unlink($sPath);
        }
    }
}
