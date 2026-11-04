<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The Discussions grid called by an API client (a guest here) through perfom_action_api: the
 * browse params (bp) come from the client, so per_page outside 1-50 gets the module's number.
 * The web keeps what it is given.
 */
#[Group('integration')]
class ForumGridApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum'))
            $this->markTestSkipped('Discussions are not installed.');

        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        unset($GLOBALS['bxDolClasses']['BxDolGrid!bx_forum']);
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    /**
     * Page size of the grid's display action for the browse params a client sends.
     */
    protected function perPage(array $aBrowseParams, bool $bApi = true): int
    {
        // the grid reads bp when it is made
        unset($GLOBALS['bxDolClasses']['BxDolGrid!bx_forum']);

        $_GET['bp'] = urlencode(json_encode(array_merge(['type' => 'new'], $aBrowseParams)));
        if ($bApi) {
            $_GET['api'] = 1;

            // true: skip the memory cache of results, every call is a new request
            $aResult = BxDolService::call('system', 'perfom_action_api', [['object' => 'bx_forum', 'action' => 'display']], 'TemplServiceGrid', true);
            $this->assertIsArray($aResult);
            $this->assertArrayHasKey('settings', $aResult, 'Guests can\'t see the Discussions grid here.');

            return $aResult['settings']['per_page'];
        }

        unset($_GET['api']);
        $oGrid = BxDolGrid::getObjectInstance('bx_forum');
        $this->assertNotFalse($oGrid);

        return (int)$this->bxGetProtected($oGrid, '_aOptions')['paginate_per_page'];
    }

    public function testPerPageIsBounded(): void
    {
        $iDefault = (int)BxDolModule::getInstance('bx_forum')->_oDb->getParam('bx_forum_per_page_browse');
        $this->assertSame($iDefault, $this->perPage([]));

        foreach ([500, '500', 51, -1, 'abc'] as $mixedPerPage)
            $this->assertSame($iDefault, $this->perPage(['per_page' => $mixedPerPage]), 'per_page ' . var_export($mixedPerPage, true));
    }

    public function testPerPageInRangeIsKept(): void
    {
        $this->assertSame(20, $this->perPage(['per_page' => 20]));
        $this->assertSame(50, $this->perPage(['per_page' => '50']));
    }

    public function testWebKeepsPerPage(): void
    {
        $this->assertSame(500, $this->perPage(['per_page' => 500], false));
    }
}
