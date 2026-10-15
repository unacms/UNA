<?php

use PHPUnit\Framework\Attributes\DataProvider;

class BxDolAIVectorStoreMariaDbTest extends BxDolTestCase
{
    #[DataProvider('providerForDescribe')]
    public function testDescribe(string $sVersion, string $sEngine, string $sNumber, bool $bSupported)
    {
        $a = BxDolAIVectorStoreMariaDb::describe($sVersion);

        $this->assertSame($sEngine, $a['engine']);
        $this->assertSame($sNumber, $a['version']);
        $this->assertSame($bSupported, $a['supported']);
    }

    public static function providerForDescribe(): array
    {
        return [
            ['11.8.2-MariaDB-ubu2404', 'mariadb', '11.8.2', true],
            ['12.1.2-MariaDB-ubu2404', 'mariadb', '12.1.2', true],
            ['11.7.0-MariaDB', 'mariadb', '11.7.0', true],
            ['11.7-MariaDB', 'mariadb', '11.7', true],
            ['11.6.2-MariaDB', 'mariadb', '11.6.2', false],
            ['10.11.6-MariaDB-1:10.11.6+maria~ubu2204', 'mariadb', '10.11.6', false],
            ['5.5.5-10.11.6-MariaDB', 'mariadb', '10.11.6', false],
            ['5.5.5-11.7.2-MariaDB', 'mariadb', '11.7.2', true],
            ['8.0.36', 'mysql', '8.0.36', false],
            ['8.0.36-0ubuntu0.22.04.1', 'mysql', '8.0.36', false],
            ['8.4.3', 'mysql', '8.4.3', false],
            ['9.0.0', 'mysql', '9.0.0', false],
            ['9.2.0-commercial', 'mysql', '9.2.0', false],
            ['', '', '', false],
        ];
    }

    public function testCompatibilityMessageNamesEngineAndVersion()
    {
        $sMaria = BxDolAIVectorStoreMariaDb::compatibilityMessage(
            BxDolAIVectorStoreMariaDb::describe('10.11.6-MariaDB')
        );
        $sMysql = BxDolAIVectorStoreMariaDb::compatibilityMessage(
            BxDolAIVectorStoreMariaDb::describe('9.0.0')
        );

        $this->assertStringContainsString('MariaDB 11.7.0', $sMaria);
        $this->assertStringContainsString('MariaDB 10.11.6', $sMaria);
        $this->assertStringContainsString('MySQL 9.0.0', $sMysql);
    }

    public function testTableName()
    {
        $this->assertSame('sys_agents_vs_3', BxDolAIVectorStoreMariaDb::tableName(3));

        try {
            BxDolAIVectorStoreMariaDb::tableName(0);
            $this->fail('A store id is required');
        }
        catch (Exception $oException) {
            $this->assertSame('MariaDB vector store id is missing', $oException->getMessage());
        }
    }

    public function testInstalledServerVersionIsRecognized()
    {
        $sVersion = (string)BxDolDb::getInstance()->getOne('SELECT VERSION()');
        $a = BxDolAIVectorStoreMariaDb::describe($sVersion);

        $this->assertContains($a['engine'], ['mariadb', 'mysql', '']);
        if ($a['version'] !== '')
            $this->assertMatchesRegularExpression('/^\d+\.\d+/', $a['version']);
        $bSupported = $a['engine'] === 'mariadb' && $a['version'] !== ''
            && version_compare(self::normalize($a['version']), BxDolAIVectorStoreMariaDb::MARIADB_MIN_VERSION, '>=');
        $this->assertSame($bSupported, $a['supported']);
    }

    public function testConnectUsesHeaderDatabase()
    {
        $oPdo = BxDolAIVectorStoreMariaDb::connect();
        $sName = (string)$oPdo->query('SELECT DATABASE()')->fetchColumn();
        $mExpected = BX_DATABASE_NAME;
        if (is_array($mExpected))
            $mExpected = reset($mExpected);

        $this->assertSame((string)$mExpected, $sName);
    }

    protected static function normalize(string $sVersion): string
    {
        $aParts = explode('.', $sVersion);
        $aParts = array_slice(array_pad($aParts, 3, '0'), 0, 3);
        return implode('.', $aParts);
    }
}
