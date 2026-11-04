<?php

// BxDolSearchResult is declared in BxDolSearch.php, which the autoloader finds by BxDolSearch only.
bx_import('BxDolSearch');

/**
 * BxDolSearchResult::setPaginate: on the web the per_page query string param chooses the page
 * size, as before. An API request takes it from the service params only, so a client can't
 * add per_page to the URL (or to the params get_page_by_request copies into $_GET) to get
 * more units than the service allows.
 */
class BxDolSearchResultPaginateTest extends BxDolTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup;
    }

    protected function searchResult(bool $bApi, array $aParams = []): BxDolSearchResultPaginateTestResult
    {
        $o = new BxDolSearchResultPaginateTestResult($aParams);
        $this->bxSetProtected($o, '_bIsApi', $bApi, BxDolSearchResult::class);

        return $o;
    }

    public function testApiIgnoresPerPageFromQueryString()
    {
        $_GET['per_page'] = '500';

        $o = $this->searchResult(true);
        $o->setPaginate();

        $this->assertSame(12, $o->aCurrent['paginate']['perPage']);
    }

    public function testApiTakesPerPageFromServiceParams()
    {
        $_GET['per_page'] = '500';

        $o = $this->searchResult(true, ['per_page' => 20]);
        $o->setPaginate();

        $this->assertSame(20, $o->aCurrent['paginate']['perPage']);
    }

    /**
     * Browse services pass the client's params on to the search result (browse_favorite and
     * others), so on the API a page size from them is bounded here too.
     */
    public function testApiBoundsPerPageFromServiceParams()
    {
        foreach ([500, '500', 51, 'abc'] as $mixedPerPage) {
            $o = $this->searchResult(true, ['per_page' => $mixedPerPage]);
            $o->setPaginate();

            $this->assertSame(12, $o->aCurrent['paginate']['perPage'], 'per_page ' . var_export($mixedPerPage, true));
        }

        $o = $this->searchResult(false, ['per_page' => 500]);
        $o->setPaginate();
        $this->assertSame(500, $o->aCurrent['paginate']['perPage'], 'The web keeps what the server passes.');
    }

    /**
     * A per_page that isn't a number is read as a setting name by some search results
     * (author, context), which can hold any number: an API page still has 1 to 50 units.
     */
    public function testApiPageSizeIsBoundedWhateverItsSource()
    {
        foreach ([[100000, 50], [51, 50], [50, 50], [-5, 1]] as list($iPerPage, $iExpected)) {
            $o = $this->searchResult(true);
            $o->aCurrent['paginate']['perPage'] = $iPerPage;
            $o->setPaginate();

            $this->assertSame($iExpected, $o->aCurrent['paginate']['perPage'], 'perPage ' . $iPerPage);
        }

        $o = $this->searchResult(false);
        $o->aCurrent['paginate']['perPage'] = 100;
        $o->setPaginate();
        $this->assertSame(100, $o->aCurrent['paginate']['perPage'], 'The web keeps the configured number.');
    }

    public function testWebStillTakesPerPageFromQueryString()
    {
        $_GET['per_page'] = '30';

        $o = $this->searchResult(false);
        $o->setPaginate();

        $this->assertSame(30, $o->aCurrent['paginate']['perPage']);
    }

    public function testNegativeStartIsZero()
    {
        $o = $this->searchResult(true);
        $o->aCurrent['paginate']['forceStart'] = -12;
        $o->setPaginate();

        $this->assertSame(0, $o->aCurrent['paginate']['start']);
    }
}

class BxDolSearchResultPaginateTestResult extends BxDolSearchResult
{
    public $aCurrent = [
        'paginate' => ['perPage' => 12],
    ];

    public function __construct(array $aParams = [])
    {
        parent::__construct();

        $this->_aParams = $aParams;
    }
}
