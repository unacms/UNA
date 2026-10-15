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
        $this->assertSame('sys_agents_vector_mariadb', BxDolAIVectorStoreMariaDb::tableName(BxDolAIVectorStoreMariaDb::TABLE));

        try {
            BxDolAIVectorStoreMariaDb::tableName('sys_agents_vs_1; DROP TABLE sys_accounts');
            $this->fail('A table name must be an identifier');
        }
        catch (Exception $oException) {
            $this->assertSame('MariaDB vector store table name is invalid', $oException->getMessage());
        }
    }

    public function testPdoIsBxDolDbLink()
    {
        BxDolDb::getInstance();
        $this->assertSame(BxDolDb::getLink(), BxDolAIVectorStoreMariaDb::pdo());
    }

    public function testSearchIsLimitedToStore()
    {
        $sVersion = (string)BxDolDb::getInstance()->getOne('SELECT VERSION()');
        if (!BxDolAIVectorStoreMariaDb::describe($sVersion)['supported'])
            $this->markTestSkipped('MariaDB vector store is not supported on this server');

        $aNearA = array_fill(0, BxDolAIVectorStoreMariaDb::DIMENSION, 0.0);
        $aNearA[0] = 1.0;
        $aNearB = array_fill(0, BxDolAIVectorStoreMariaDb::DIMENSION, 0.0);
        $aNearB[1] = 1.0;

        $oStoreA = BxDolAIVectorStoreMariaDb::open(901, BxDolAIVectorStoreMariaDb::TABLE, 4);
        $oStoreB = BxDolAIVectorStoreMariaDb::open(902, BxDolAIVectorStoreMariaDb::TABLE, 4);
        $oDocA = new NeuronAI\RAG\Document('store-a-only');
        $oDocA->embedding = $aNearA;
        $oDocA->sourceType = '901';
        $oDocA->sourceName = 'search-filter';
        $oDocB = new NeuronAI\RAG\Document('store-b-only');
        $oDocB->embedding = $aNearB;
        $oDocB->sourceType = '902';
        $oDocB->sourceName = 'search-filter';

        try {
            $oStoreA->addDocument($oDocA);
            $oStoreB->addDocument($oDocB);

            $aFromA = iterator_to_array($oStoreA->similaritySearch($aNearB));
            $aFromB = iterator_to_array($oStoreB->similaritySearch($aNearB));

            $this->assertSame('store-a-only', $aFromA[0]->getContent());
            $this->assertSame('901', (string)$aFromA[0]->getSourceType());
            $this->assertSame('store-b-only', $aFromB[0]->getContent());
            $this->assertSame('902', (string)$aFromB[0]->getSourceType());
        }
        finally {
            $oStoreA->deleteBy('901', 'search-filter');
            $oStoreB->deleteBy('902', 'search-filter');
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

    protected static function normalize(string $sVersion): string
    {
        $aParts = explode('.', $sVersion);
        $aParts = array_slice(array_pad($aParts, 3, '0'), 0, 3);
        return implode('.', $aParts);
    }
}
