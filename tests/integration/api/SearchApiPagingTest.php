<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Search services an API client (a guest too) can call get at most 50 units a page from each
 * search section: per_page outside 1-50 gets the service's default, the per_page query string
 * param no longer changes it, start is a whole number from 0 to 100000, and the sections a
 * client lists are each searched once.
 *
 * The test adds two global search sections backed by a search result class that records the
 * paging it was given and returns as many rows as the page holds, then removes them.
 */
#[Group('integration')]
class SearchApiPagingTest extends BxDolIntegrationTestCase
{
    const SECTION_A = 'bx_test_search_api_paging_a';
    const SECTION_B = 'bx_test_search_api_paging_b';

    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        $oDb = BxDolDb::getInstance();
        $this->deleteSections();
        foreach ([self::SECTION_A, self::SECTION_B] as $sSection)
            $oDb->query("INSERT INTO `sys_objects_search` (`ObjectName`, `Title`, `Order`, `GlobalSearch`, `ClassName`, `ClassPath`) VALUES (:name, :name, 9999, 1, :class, '')", [
                'name' => $sSection,
                'class' => SearchApiPagingTestResult::class,
            ]);
        $this->cleanSearchCache();

        SearchApiPagingTestResult::$aCalls = [];
        SearchApiPagingTestResult::$aLimits = [];
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        try {
            $this->deleteSections();
            $this->cleanSearchCache();
        }
        finally {
            $_GET = $this->_aGetBackup ?? [];
            parent::tearDown();
        }
    }

    protected function deleteSections(): void
    {
        BxDolDb::getInstance()->query("DELETE FROM `sys_objects_search` WHERE `ObjectName` IN (:a, :b)", [
            'a' => self::SECTION_A,
            'b' => self::SECTION_B,
        ]);
    }

    protected function cleanSearchCache(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach (['sys_objects_search', 'sys_global_search_pairs'] as $sName)
            $oDb->cleanCache($sName);
        $oDb->cleanMemoryAll();
    }

    /**
     * get_data_search_api as api.php calls it, with the params as JSON.
     */
    protected function searchApi(array $aParams): array
    {
        $_GET['api'] = 1;

        // true: skip the memory cache of results, every call is a new request
        $aResult = BxDolService::call('system', 'get_data_search_api', [json_encode(['params' => $aParams])], 'TemplServicesSearch', true);
        $this->assertIsArray($aResult);
        $this->assertCount(1, $aResult);

        return $aResult[0];
    }

    protected function lastPaginate(): array
    {
        $this->assertNotEmpty(SearchApiPagingTestResult::$aCalls, 'The test section was not searched.');
        return end(SearchApiPagingTestResult::$aCalls);
    }

    public function testDataSearchPerPageIsBounded(): void
    {
        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false, 'per_page' => 500]);

        $this->assertSame('browse', $aBlock['type']);
        $this->assertSame(12, $this->lastPaginate()['perPage']);
        $this->assertCount(12, $aBlock['data']['data']);
        $this->assertSame(12, $aBlock['data']['params']['per_page']);

        foreach ([0, -1, 51, '500', 'abc', 'sys_per_page_browse_showcase'] as $mixedPerPage) {
            $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false, 'per_page' => $mixedPerPage]);
            $this->assertSame(12, $this->lastPaginate()['perPage'], 'per_page ' . var_export($mixedPerPage, true));
        }
    }

    public function testDataSearchKeepsPerPageInRange(): void
    {
        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false, 'per_page' => '30']);

        $this->assertSame(30, $this->lastPaginate()['perPage']);
        $this->assertCount(30, $aBlock['data']['data']);
        $this->assertSame(30, $aBlock['data']['params']['per_page']);

        //--- No per_page: the default 12, as NEO's search uses it.
        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false]);
        $this->assertSame(12, $this->lastPaginate()['perPage']);
        $this->assertSame(12, $aBlock['data']['params']['per_page']);
        $this->assertSame(0, $aBlock['data']['params']['start']);
    }

    public function testDataSearchIgnoresPerPageInQueryString(): void
    {
        $_GET['per_page'] = '500';

        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false, 'per_page' => 20]);

        $this->assertSame(20, $this->lastPaginate()['perPage']);
        $this->assertCount(20, $aBlock['data']['data']);
    }

    public function testDataSearchStartIsBounded(): void
    {
        foreach ([[-5, 0], ['abc', 0], ['24', 24], [1000000000, 100000]] as list($mixedStart, $iStart)) {
            $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A, 'live' => false, 'start' => $mixedStart]);
            $this->assertSame($iStart, $this->lastPaginate()['start'], 'start ' . var_export($mixedStart, true));
            $this->assertSame($iStart, $aBlock['data']['params']['start']);
        }
    }

    public function testDataSearchSearchesEachSectionOnce(): void
    {
        $sSections = implode(',', array_merge(array_fill(0, 20, self::SECTION_A), ['bx_test_search_api_paging_unknown', self::SECTION_A]));

        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => $sSections, 'live' => false, 'per_page' => 12]);

        $this->assertSame('search_sections', $aBlock['type']);
        $this->assertCount(1, SearchApiPagingTestResult::$aCalls);
        $this->assertCount(1, $aBlock['data']['data']);
        $this->assertSame(self::SECTION_A, $aBlock['data']['data'][0]['section']);
        $this->assertCount(12, $aBlock['data']['data'][0]['data']);
    }

    public function testDataSearchSectionsPerPageIsBounded(): void
    {
        $aBlock = $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A . ',' . self::SECTION_B, 'live' => false, 'per_page' => 500]);

        $this->assertSame('search_sections', $aBlock['type']);
        $this->assertCount(2, SearchApiPagingTestResult::$aCalls);
        foreach (SearchApiPagingTestResult::$aCalls as $aPaginate)
            $this->assertSame(12, $aPaginate['perPage']);
        foreach ($aBlock['data']['data'] as $aSection)
            $this->assertCount(12, $aSection['data']);
    }

    public function testLiveSearchUnionLimitIsBounded(): void
    {
        $_GET['per_page'] = '500';

        $this->searchApi(['keyword' => 'x', 'section' => self::SECTION_A . ',' . self::SECTION_B, 'live' => true, 'per_page' => 500]);

        $this->assertCount(2, SearchApiPagingTestResult::$aCalls);
        foreach (SearchApiPagingTestResult::$aCalls as $aPaginate)
            $this->assertSame(12, $aPaginate['perPage']);
        $this->assertSame(['LIMIT 0, 12', 'LIMIT 0, 12'], SearchApiPagingTestResult::$aLimits);
    }

    public function testKeywordSearchPerPageIsBounded(): void
    {
        $_GET['api'] = 1;

        foreach ([[500, BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT], [0, BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT], [-3, BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT], [30, 30]] as list($iPerPage, $iExpected)) {
            BxDolService::call('system', 'keyword_search', [self::SECTION_A, ['keyword' => 'x'], '', 0, $iPerPage], 'TemplServicesSearch', true);
            $this->assertSame($iExpected, $this->lastPaginate()['perPage'], 'per_page ' . $iPerPage);
        }

        //--- per_page in the query string doesn't count on the API.
        $_GET['per_page'] = '500';
        BxDolService::call('system', 'keyword_search', [self::SECTION_A, ['keyword' => 'x'], '', 0, 30], 'TemplServicesSearch', true);
        $this->assertSame(30, $this->lastPaginate()['perPage']);
    }
}

/**
 * Search section for the test: records the paging it ends up with and returns that many rows.
 */
class SearchApiPagingTestResult extends BxTemplSearchResult
{
    public static $aCalls = [];
    public static $aLimits = [];

    public function __construct()
    {
        parent::__construct();

        $this->aCurrent = [
            'name' => 'bx_test_search_api_paging',
            'title' => 'Search API paging test',
            'module_name' => 'system',
            'table' => 'sys_objects_search',
            'ownFields' => [],
            'searchFields' => [],
            'restriction' => [],
            'paginate' => [],
        ];
    }

    function getSearchData()
    {
        $this->setPaginate();
        self::$aCalls[] = $this->aCurrent['paginate'];

        $this->aCurrent['paginate']['num'] = $this->aCurrent['paginate']['perPage'];
        return array_fill(0, $this->aCurrent['paginate']['perPage'], ['id' => 0]);
    }

    function getSearchQuery($sObject, $aParams = [])
    {
        $this->setPaginate();
        self::$aCalls[] = $this->aCurrent['paginate'];
        self::$aLimits[] = $this->getLimit();

        return ['query' => "SELECT 0 AS `id`, 0 AS `added`, '' AS `content_info`", 'order' => '', 'limit' => $this->getLimit()];
    }

    function displaySearchUnit($aData)
    {
        return '';
    }
}
