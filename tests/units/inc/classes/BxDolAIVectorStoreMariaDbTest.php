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
        $this->assertSame('sys_agents_vector_mariadb_1024', BxDolAIVectorStoreMariaDb::tableForDimension(1024));
        $this->assertSame('sys_agents_vector_mariadb_384', BxDolAIVectorStoreMariaDb::tableForDimension(384));

        try {
            BxDolAIVectorStoreMariaDb::tableForDimension(1536);
            $this->fail('An embedding width must be 1024 or 384');
        }
        catch (Exception $oException) {
            $this->assertSame('MariaDB vector store expects embedding width 1024 or 384, got 1536', $oException->getMessage());
        }

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

    public function testWrongEmbeddingWidthIsRejected()
    {
        $this->skipUnlessMariaDb();

        $oStore = BxDolAIVectorStoreMariaDb::open(903, 4);
        $oDocument = new NeuronAI\RAG\Document('width-mismatch');
        $oDocument->setEmbedding([0.1, 0.2, 0.3]);
        $oDocument->setSourceType('903');
        $oDocument->setSourceName('width-mismatch');

        try {
            $oStore->addDocument($oDocument);
            $this->fail('A short embedding must not be stored');
        }
        catch (Exception $oException) {
            $this->assertSame(
                'MariaDB vector store expects embedding width 1024 or 384, got 3',
                $oException->getMessage()
            );
        }

        foreach (BxDolAIVectorStoreMariaDb::DIMENSIONS as $iDimension) {
            $sTable = BxDolAIVectorStoreMariaDb::tableForDimension($iDimension);
            $iLeft = (int)BxDolDb::getInstance()->getOne(
                "SELECT COUNT(*) FROM `{$sTable}` WHERE `sourceName` = 'width-mismatch'"
            );
            $this->assertSame(0, $iLeft, $sTable);
        }
    }

    public static function providerForDimension(): array
    {
        return [
            '1024' => [1024],
            '384' => [384],
        ];
    }

    #[DataProvider('providerForDimension')]
    public function testClosestDocumentRanksFirst(int $iDimension)
    {
        $this->skipUnlessMariaDb();

        $aNear = array_fill(0, $iDimension, 0.0);
        $aNear[0] = 1.0;
        $aFar = array_fill(0, $iDimension, 0.0);
        $aFar[1] = 1.0;

        $oStore = BxDolAIVectorStoreMariaDb::open(904, 4);
        $oFar = new NeuronAI\RAG\Document('far-chunk');
        $oFar->setEmbedding($aFar);
        $oFar->setSourceType('904');
        $oFar->setSourceName('rank');
        $oNear = new NeuronAI\RAG\Document('near-chunk');
        $oNear->setEmbedding($aNear);
        $oNear->setSourceType('904');
        $oNear->setSourceName('rank');

        try {
            $oStore->addDocument($oFar);
            $oStore->addDocument($oNear);

            $aFound = iterator_to_array($oStore->search(new NeuronAI\RAG\VectorStore\SearchRequest($aNear)));

            $this->assertSame('near-chunk', $aFound[0]->getContent());
            $this->assertGreaterThan(0.9, $aFound[0]->getScore());
            $this->assertGreaterThanOrEqual(0.0, $aFound[1]->getScore());
            $this->assertGreaterThan($aFound[1]->getScore(), $aFound[0]->getScore());
        }
        finally {
            $oStore->delete(NeuronAI\RAG\VectorStore\Filter\Filter::where('sourceType', '904')->where('sourceName', 'rank'));
        }
    }

    public function testSearchStaysOnTheMatchingDimensionTable()
    {
        $this->skipUnlessMariaDb();

        $aWide = array_fill(0, 1024, 0.0);
        $aWide[0] = 1.0;
        $aNarrow = array_fill(0, 384, 0.0);
        $aNarrow[0] = 1.0;

        $oStore = BxDolAIVectorStoreMariaDb::open(905, 4);
        $oWide = new NeuronAI\RAG\Document('wide-chunk');
        $oWide->setEmbedding($aWide);
        $oWide->setSourceType('905');
        $oWide->setSourceName('cross-dim');
        $oNarrow = new NeuronAI\RAG\Document('narrow-chunk');
        $oNarrow->setEmbedding($aNarrow);
        $oNarrow->setSourceType('905');
        $oNarrow->setSourceName('cross-dim');

        try {
            $oStore->addDocument($oWide);
            $oStore->addDocument($oNarrow);

            $aFromWide = iterator_to_array($oStore->search(new NeuronAI\RAG\VectorStore\SearchRequest($aWide)));
            $aFromNarrow = iterator_to_array($oStore->search(new NeuronAI\RAG\VectorStore\SearchRequest($aNarrow)));

            $this->assertCount(1, $aFromWide);
            $this->assertSame('wide-chunk', $aFromWide[0]->getContent());
            $this->assertCount(1, $aFromNarrow);
            $this->assertSame('narrow-chunk', $aFromNarrow[0]->getContent());
            $this->assertSame(1, $this->countBySourceName(1024, 'cross-dim'));
            $this->assertSame(1, $this->countBySourceName(384, 'cross-dim'));
        }
        finally {
            $oStore->delete(NeuronAI\RAG\VectorStore\Filter\Filter::where('sourceType', '905')->where('sourceName', 'cross-dim'));
        }

        $this->assertSame(0, $this->countBySourceName(1024, 'cross-dim'));
        $this->assertSame(0, $this->countBySourceName(384, 'cross-dim'));
    }

    #[DataProvider('providerForDimension')]
    public function testSearchIsLimitedToStore(int $iDimension)
    {
        $this->skipUnlessMariaDb();

        $aNearA = array_fill(0, $iDimension, 0.0);
        $aNearA[0] = 1.0;
        $aNearB = array_fill(0, $iDimension, 0.0);
        $aNearB[1] = 1.0;

        $oStoreA = BxDolAIVectorStoreMariaDb::open(901, 4);
        $oStoreB = BxDolAIVectorStoreMariaDb::open(902, 4);
        $oDocA = new NeuronAI\RAG\Document('store-a-only');
        $oDocA->setEmbedding($aNearA);
        $oDocA->setSourceType('901');
        $oDocA->setSourceName('search-filter');
        $oDocB = new NeuronAI\RAG\Document('store-b-only');
        $oDocB->setEmbedding($aNearB);
        $oDocB->setSourceType('902');
        $oDocB->setSourceName('search-filter');

        try {
            $oStoreA->addDocument($oDocA);
            $oStoreB->addDocument($oDocB);

            $aFromA = iterator_to_array($oStoreA->search(new NeuronAI\RAG\VectorStore\SearchRequest($aNearB)));
            $aFromB = iterator_to_array($oStoreB->search(new NeuronAI\RAG\VectorStore\SearchRequest($aNearB)));

            $this->assertSame('store-a-only', $aFromA[0]->getContent());
            $this->assertSame('901', (string)$aFromA[0]->getSourceType());
            $this->assertSame('store-b-only', $aFromB[0]->getContent());
            $this->assertSame('902', (string)$aFromB[0]->getSourceType());
        }
        finally {
            $oStoreA->delete(NeuronAI\RAG\VectorStore\Filter\Filter::where('sourceType', '901')->where('sourceName', 'search-filter'));
            $oStoreB->delete(NeuronAI\RAG\VectorStore\Filter\Filter::where('sourceType', '902')->where('sourceName', 'search-filter'));
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

    protected function skipUnlessMariaDb(): void
    {
        $sVersion = (string)BxDolDb::getInstance()->getOne('SELECT VERSION()');
        if (!BxDolAIVectorStoreMariaDb::describe($sVersion)['supported'])
            $this->markTestSkipped('MariaDB vector store is not supported on this server');
    }

    protected function countBySourceName(int $iDimension, string $sSourceName): int
    {
        $sTable = BxDolAIVectorStoreMariaDb::tableForDimension($iDimension);
        return (int)BxDolDb::getInstance()->getOne(
            "SELECT COUNT(*) FROM `{$sTable}` WHERE `sourceName` = ?",
            [$sSourceName]
        );
    }

    protected static function normalize(string $sVersion): string
    {
        $aParts = explode('.', $sVersion);
        $aParts = array_slice(array_pad($aParts, 3, '0'), 0, 3);
        return implode('.', $aParts);
    }
}
