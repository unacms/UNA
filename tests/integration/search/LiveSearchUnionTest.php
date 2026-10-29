<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API live search joins its sections in one union. A section adds no query when it has no
 * results ('@' looks for people, so it finds nothing in posts), the union reads its rows
 * without counting them first, and units are built only for the rows the caller keeps.
 */
#[Group('integration')]
class LiveSearchUnionTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aPostIds = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $_GET['api'] = 1;
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aPostIds as $iId) {
            BxDolPage::deleteSeoLink('bx_posts', 'bx_posts', $iId);
            $oDb->query("DELETE FROM `bx_posts_posts` WHERE `id` = :id", ['id' => $iId]);
        }
        $oDb->cleanMemoryAll();

        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    /**
     * Public posts by the admin whose title holds $sKeyword, deleted in tearDown.
     */
    protected function addPosts(string $sKeyword, int $iCount): void
    {
        $oDb = BxDolDb::getInstance();
        $iAuthor = (int)BxDolProfile::getInstanceAccountProfile($this->bxAccount('admin')->id())->id();
        $iNow = time();

        for ($i = 1; $i <= $iCount; $i++) {
            $oDb->query("INSERT INTO `bx_posts_posts` SET " . $oDb->arrayToSQL([
                'author' => $iAuthor,
                'added' => $iNow - $i,
                'changed' => $iNow - $i,
                'published' => $iNow - $i,
                'thumb' => 0,
                'thumb_data' => '',
                'title' => 'LiveSearchUnionTest ' . $sKeyword . ' ' . $i,
                'cat' => 0,
                'multicat' => '',
                'abstract' => '',
                'text' => '<p>LiveSearchUnionTest post.</p>',
                'labels' => '',
                'location' => '',
                'allow_view_to' => BX_DOL_PG_ALL,
                'status' => 'active',
                'status_admin' => 'active',
            ]));
            $this->_aPostIds[] = (int)$oDb->lastId();
        }
        $oDb->cleanMemoryAll();
    }

    /**
     * Installed sections among the default API ones, those that act as profiles or not.
     */
    protected function sections(?bool $bProfiles = null): array
    {
        $aSections = [];
        foreach (['bx_persons', 'bx_posts', 'bx_groups'] as $sSection) {
            if (!BxDolModuleQuery::getInstance()->isEnabledByName($sSection))
                continue;

            $bProfile = bx_is_srv($sSection, 'act_as_profile') && bx_srv($sSection, 'act_as_profile');
            if ($bProfiles === null || $bProfiles === $bProfile)
                $aSections[] = $sSection;
        }

        return $aSections;
    }

    protected function searchResult(string $sSection, string $sKeyword): BxDolSearchResult
    {
        $oResult = (new BxTemplSearch([$sSection]))->getSearchResultObject($sSection);
        $oResult->setLiveSearch(true);
        $oResult->setCustomSearchCondition(['keyword' => $sKeyword]);

        return $oResult;
    }

    protected function search(array $aSections, string $sKeyword, int $iPerPage): BxTemplSearch
    {
        $oSearch = new BxTemplSearch($aSections);
        $oSearch->setLiveSearch(true);
        $oSearch->setDataProcessing(true);
        $oSearch->setCustomSearchCondition(['keyword' => $sKeyword]);
        $oSearch->setCustomCurrentCondition(['paginate' => ['forceStart' => 0, 'perPage' => $iPerPage]]);

        return $oSearch;
    }

    protected function record(callable $fCallback): array
    {
        $oRecorder = new class {
            public array $aQueries = [];
            public function beginQuery($sSql) { $this->aQueries[] = preg_replace('/\s+/', ' ', $sSql); }
            public function __call($sName, $aArgs) { return null; }
        };

        $mixedPrevious = $GLOBALS['bx_profiler'] ?? null;
        $GLOBALS['bx_profiler'] = $oRecorder;
        try {
            $fCallback();
        }
        finally {
            if ($mixedPrevious !== null)
                $GLOBALS['bx_profiler'] = $mixedPrevious;
            else
                unset($GLOBALS['bx_profiler']);
        }

        return $oRecorder->aQueries;
    }

    public function testAtKeywordAddsNoQueryForSectionsOfNoProfiles(): void
    {
        $aContent = $this->sections(false);
        $aProfiles = $this->sections(true);
        if (!$aContent || !$aProfiles)
            $this->markTestSkipped('A content section and a profile section are needed.');

        $this->assertSame('', $this->searchResult($aContent[0], '@phpunit')->getSearchQuery($aContent[0])['query'], 'Posts have no people.');
        $this->assertNotSame('', $this->searchResult($aProfiles[0], '@phpunit')->getSearchQuery($aProfiles[0])['query'], 'People are looked up.');
        $this->assertSame('', $this->searchResult($aContent[0], '')->getSearchQuery($aContent[0])['query'], 'Live search needs a keyword.');
    }

    public function testUnionOfSectionsWithoutQueriesIsEmpty(): void
    {
        $aContent = $this->sections(false);
        if (count($aContent) < 2)
            $this->markTestSkipped('Two content sections are needed.');

        $this->assertSame([], $this->search($aContent, '@phpunit', 12)->response());
    }

    public function testUnionQueryDoesNotCountRows(): void
    {
        $aContent = $this->sections(false);
        if (!$aContent)
            $this->markTestSkipped('A content section is needed.');

        $oResult = $this->searchResult($aContent[0], 'e');
        $aQuery = [];
        $aQueries = $this->record(function () use ($oResult, $aContent, &$aQuery) {
            $aQuery = $oResult->getSearchQuery($aContent[0]);
        });

        $this->assertNotSame('', $aQuery['query']);
        $sCount = 'SELECT * FROM `' . $oResult->aCurrent['table'] . '`';
        $this->assertSame([], array_values(array_filter($aQueries, fn($s) => strpos($s, $sCount) === 0)), 'The union reads the rows itself.');
    }

    public function testUnitsSliceKeepsTheUnitsTheCallerKeeps(): void
    {
        $aSections = $this->sections();
        if (count($aSections) < 2 || !in_array('bx_posts', $aSections))
            $this->markTestSkipped('Posts and one more section are needed.');

        // Three posts only this test can find: the search returns exactly them.
        $sKeyword = 'phpunitslice' . mt_rand(100000, 999999);
        $this->addPosts($sKeyword, 3);

        $aFull = $this->search($aSections, $sKeyword, 3)->response();
        $this->assertCount(3, $aFull, 'Every test post is found.');

        $oSearch = $this->search($aSections, $sKeyword, 3);
        $oSearch->setUnitsSlice(1, 2);
        $aSliced = $oSearch->response();

        $fIds = fn($a) => array_map(fn($aUnit) => [$aUnit['module'] ?? '', $aUnit['id'] ?? ''], $a);
        $this->assertCount(2, $aSliced);
        $this->assertSame($fIds(array_slice($aFull, 1, 2)), $fIds($aSliced), 'The same units as array_slice of all of them.');
    }
}
