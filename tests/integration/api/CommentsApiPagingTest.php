<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Comments called by an API client (a guest here) through get_data_api: a page has 1 to 50 root
 * comments however the client asks for more, start_from is a whole number from 0 to 100000, and
 * comments asked for by id are at most 50 of this object's own.
 *
 * The comments object is a double over the Posts comments system: it records the queries and
 * structures the service asks for instead of reading the database.
 */
#[Group('integration')]
class CommentsApiPagingTest extends BxDolIntegrationTestCase
{
    const OBJECT_ID = 2000000001;

    protected $_aGetBackup;
    protected $_aRequestBackup;
    protected $_oCmts;
    protected $_iPerView;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
        $this->_aRequestBackup = $_REQUEST;

        $aSystems = BxDolCmts::getSystems();
        if (!isset($aSystems['bx_posts']))
            $this->markTestSkipped('Posts comments are not installed.');

        $this->bxBecomeGuest();
        $_GET['api'] = 1;

        $this->_oCmts = new CommentsApiPagingTestCmts('bx_posts', self::OBJECT_ID);
        $this->_oCmts->aKnownIds = range(1, 100);
        $GLOBALS['bxDolClasses']['BxDolCmts!bx_posts' . self::OBJECT_ID] = $this->_oCmts;

        $this->_iPerView = (int)$this->_oCmts->getPerView(0);
        $this->assertGreaterThan(0, $this->_iPerView);
        $this->assertLessThan(50, $this->_iPerView);
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['bxDolClasses']['BxDolCmts!bx_posts' . self::OBJECT_ID]);
        $_GET = $this->_aGetBackup ?? [];
        $_REQUEST = $this->_aRequestBackup ?? [];
        parent::tearDown();
    }

    /**
     * The comments list get_data_api returns, the params sent as JSON like NEO does.
     */
    protected function comments(array $aParams): array
    {
        $this->_oCmts->aQueries = $this->_oCmts->aStructures = [];

        // true: skip the memory cache of results, every call is a new request
        $aResult = BxDolService::call('system', 'get_data_api', [json_encode(array_merge([
            'module' => 'bx_posts',
            'object_id' => self::OBJECT_ID,
            'is_form' => false,
        ], $aParams))], 'TemplCmtsServices', true);

        $this->assertIsArray($aResult);
        $this->assertSame('browse', $aResult['browse']['type'] ?? null);

        return $aResult['browse']['data'];
    }

    protected function lastQuery(): array
    {
        $this->assertNotEmpty($this->_oCmts->aQueries, 'Comments were not read.');
        return end($this->_oCmts->aQueries);
    }

    public function testDefaultPageIsUnchanged(): void
    {
        $aData = $this->comments([]);

        $this->assertSame([0, $this->_iPerView + 1], $this->lastQuery());
        $this->assertCount($this->_iPerView, $aData['data']);
        $this->assertSame($this->_iPerView, $aData['per_view']);
    }

    public function testPerViewIsBounded(): void
    {
        foreach ([500, 51, -1, 0, 'abc'] as $mixedPerView) {
            $aData = $this->comments(['per_view' => $mixedPerView]);

            $this->assertSame($this->_iPerView + 1, $this->lastQuery()[1], 'per_view ' . var_export($mixedPerView, true));
            $this->assertCount($this->_iPerView, $aData['data'], 'per_view ' . var_export($mixedPerView, true));
        }

        $this->comments(['per_view' => 20]);
        $this->assertSame(20, $this->lastQuery()[1]);
    }

    public function testBrowseParamsAreBounded(): void
    {
        foreach (['per_view', 'init_view'] as $sKey)
            foreach ([100000, -2] as $iValue) {
                $aData = $this->comments(['aBp' => [$sKey => $iValue]]);

                $this->assertLessThanOrEqual($this->_iPerView + 1, $this->lastQuery()[1], $sKey . ' ' . $iValue);
                $this->assertGreaterThan(0, $this->lastQuery()[1], $sKey . ' ' . $iValue);
                $this->assertLessThanOrEqual($this->_iPerView, count($aData['data']), $sKey . ' ' . $iValue);
            }

        $this->comments(['aBp' => ['init_view' => 3]]);
        $this->assertSame(3, $this->lastQuery()[1]);
    }

    /**
     * CmtPerView in the request is read by the comments object itself, as on the web.
     */
    public function testCmtPerViewIsBounded(): void
    {
        $_GET['CmtPerView'] = $_REQUEST['CmtPerView'] = '100000';

        $aData = $this->comments([]);
        $this->assertSame($this->_iPerView + 1, $this->lastQuery()[1]);
        $this->assertCount($this->_iPerView, $aData['data']);
    }

    public function testStartIsBounded(): void
    {
        foreach ([[-5, 0], ['abc', 0], [10, 10], [1000000000, 100000]] as list($mixedStart, $iStart)) {
            $this->comments(['start_from' => $mixedStart]);
            $this->assertSame($iStart, $this->lastQuery()[0], 'start_from ' . var_export($mixedStart, true));
        }
    }

    public function testCommentIdsAreBounded(): void
    {
        //--- whole numbers only, each once, at most 50
        $aIds = array_merge(range(1, 100), range(1, 100), ['abc', '-1', '2.5']);
        $aData = $this->comments(['comment_id' => implode(',', $aIds)]);

        $this->assertSame([], $this->_oCmts->aQueries);
        $this->assertSame(range(1, 50), $this->_oCmts->aStructures);
        $this->assertCount(50, $aData['data']);
    }

    /**
     * An id that isn't a comment of this object would give the structure of all its comments.
     */
    public function testUnknownCommentIdIsSkipped(): void
    {
        $aData = $this->comments(['comment_id' => '999,7']);

        $this->assertSame([7], $this->_oCmts->aStructures);
        $this->assertCount(1, $aData['data']);

        $this->comments(['comment_id' => ['1', '2']]);
        $this->assertSame([], $this->_oCmts->aStructures);
    }
}

/**
 * Posts comments that record what the service reads: a comments query gives as many rows as it
 * asks for (1000 without a LIMIT), and comments 1 to 100 exist.
 */
class CommentsApiPagingTestCmts extends BxTemplCmts
{
    public $aQueries = [];
    public $aStructures = [];
    public $aKnownIds = [];

    public function isEnabled()
    {
        return true;
    }

    public function isViewAllowed($isPerformAction = false)
    {
        return CHECK_ACTION_RESULT_ALLOWED;
    }

    function getFormPost($iCmtParentId = 0, $aDp = array())
    {
        return [];
    }

    public function getCommentsCount($iObjectId = 0, $iCmtVParentId = -1, $sFilter = '')
    {
        return 0;
    }

    public function getCommentsArray($iVParentId, $sFilter, $aOrder, $iStart = 0, $iCount = -1)
    {
        $this->aQueries[] = [$iStart, $iCount];

        $aResult = [];
        for ($i = 1, $iRows = $iCount == -1 ? 1000 : min((int)$iCount, 1000); $i <= $iRows; $i++)
            $aResult[] = ['cmt_id' => $i];

        return $aResult;
    }

    public function getCommentSimple($iCmtId)
    {
        return in_array((int)$iCmtId, $this->aKnownIds, true) ? ['cmt_id' => (int)$iCmtId, 'cmt_parent_id' => 0, 'cmt_author_id' => 0] : [];
    }

    public function getCommentStructure($iCmtId, $aBp = array(), $aDp = array())
    {
        $this->aStructures[] = (int)$iCmtId;

        return ['i' . (int)$iCmtId => ['data' => ['cmt_parent_id' => 0]]];
    }
}
