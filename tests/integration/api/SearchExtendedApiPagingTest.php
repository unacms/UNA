<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Extended search results called by an API client (a guest here) through get_results: per_page
 * outside 1-50 gets the default number, and start is a whole number from 0 to 100000. The
 * returned params are the paging the search ran with.
 */
#[Group('integration')]
class SearchExtendedApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_sObject;
    protected $_iDefault;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        $this->_sObject = BxDolDb::getInstance()->getOne("SELECT `object` FROM `sys_objects_search_extended` WHERE `active` = 1 AND `class_name` = '' ORDER BY `id` LIMIT 1");
        if (!$this->_sObject)
            $this->markTestSkipped('There is no active extended search.');

        $this->_iDefault = (int)getParam('sys_per_page_search_extended');
        if (!$this->_iDefault) {
            bx_import('BxDolSearch');
            $this->_iDefault = BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT;
        }

        $this->bxBecomeGuest();
        $_GET['api'] = 1;

        // the search object knows if it serves the API when it is made, and it is kept for the request
        unset($GLOBALS['bxDolClasses']['BxDolSearchExtended!' . $this->_sObject]);
    }

    protected function tearDown(): void
    {
        if ($this->_sObject)
            unset($GLOBALS['bxDolClasses']['BxDolSearchExtended!' . $this->_sObject]);
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    /**
     * Paging params of the results block, the params sent as JSON like NEO does.
     */
    protected function paging(array $aParams): array
    {
        // true: skip the memory cache of results, every call is a new request
        $aResult = BxDolService::call('system', 'get_results', [json_encode(['params' => array_merge(['object' => $this->_sObject], $aParams)])], 'TemplSearchExtendedServices', true);

        $this->assertIsArray($aResult);
        $this->assertSame('browse', $aResult[0]['type'] ?? null);
        $this->assertLessThanOrEqual(50, count($aResult[0]['data']['data']));

        return $aResult[0]['data']['params'];
    }

    public function testPerPageIsBounded(): void
    {
        $this->assertSame($this->_iDefault, $this->paging([])['per_page']);

        foreach ([500, '500', 51, -1, 'abc'] as $mixedPerPage)
            $this->assertSame($this->_iDefault, $this->paging(['per_page' => $mixedPerPage])['per_page'], 'per_page ' . var_export($mixedPerPage, true));
    }

    public function testPerPageInRangeIsKept(): void
    {
        $this->assertSame(20, $this->paging(['per_page' => 20])['per_page']);
        $this->assertSame(50, $this->paging(['per_page' => '50'])['per_page']);
    }

    /**
     * get_results also reads per_page and start from the query string when the params have none.
     */
    public function testQueryStringIsBounded(): void
    {
        $_GET['per_page'] = '500';
        $_GET['start'] = '-5';

        $aParams = $this->paging([]);
        $this->assertSame($this->_iDefault, $aParams['per_page']);
        $this->assertSame(0, $aParams['start']);
    }

    public function testStartIsBounded(): void
    {
        foreach ([[-5, 0], ['abc', 0], [24, 24], [1000000000, 100000]] as list($mixedStart, $iStart))
            $this->assertSame($iStart, $this->paging(['start' => $mixedStart])['start'], 'start ' . var_export($mixedStart, true));
    }
}
