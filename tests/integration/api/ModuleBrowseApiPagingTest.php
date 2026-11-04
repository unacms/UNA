<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A module's browse service called by an API client (a guest here): per_page outside 1-50, or
 * the name of a setting, gets the module's own number, and start is a whole number from 0 to
 * 100000. Posts is the module under test.
 */
#[Group('integration')]
class ModuleBrowseApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_oModule;
    protected $_bIsApiBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        $this->_oModule = $this->bxRequirePosts();
        $this->_bIsApiBackup = $this->bxGetProtected($this->_oModule, '_bIsApi', BxBaseModGeneralModule::class);
        $this->bxSetProtected($this->_oModule, '_bIsApi', true, BxBaseModGeneralModule::class);

        $_GET['api'] = 1;
        $this->bxBecomeGuest();
    }

    protected function tearDown(): void
    {
        try {
            if ($this->_oModule)
                $this->bxSetProtected($this->_oModule, '_bIsApi', $this->_bIsApiBackup, BxBaseModGeneralModule::class);
        }
        finally {
            $_GET = $this->_aGetBackup ?? [];
            parent::tearDown();
        }
    }

    /**
     * The paging params of the browse block bx_posts/browse returns. The params go as JSON,
     * as NEO sends them, or as an array (params[0][params][per_page]=...).
     */
    protected function browse(array $aParams, bool $bJson = true): array
    {
        // true: skip the memory cache of results, every call is a new request
        $aResult = BxDolService::call('bx_posts', 'browse', [$bJson ? json_encode($aParams) : $aParams], 'Module', true);

        $this->assertIsArray($aResult);
        $this->assertSame('browse', $aResult[0]['type'] ?? null, 'Guests can\'t browse posts here.');

        return $aResult[0]['data']['params'];
    }

    public function testPerPageIsBounded(): void
    {
        $iDefault = $this->browse(['mode' => 'recent', 'params' => []])['per_page'];
        $this->assertGreaterThan(0, $iDefault);

        foreach ([500, '500', 0, -1, 'abc', 'sys_per_page_browse_showcase'] as $mixedPerPage)
            $this->assertSame($iDefault, $this->browse(['mode' => 'recent', 'params' => ['per_page' => $mixedPerPage]])['per_page'], 'per_page ' . var_export($mixedPerPage, true));

        //--- Params sent as an array (params[0][params][per_page]=...) are the client's too.
        $this->assertSame($iDefault, $this->browse(['mode' => 'recent', 'params' => ['per_page' => '500']], false)['per_page']);
        $this->assertSame(20, $this->browse(['mode' => 'recent', 'params' => ['per_page' => '20']], false)['per_page']);
    }

    public function testPerPageInRangeIsKept(): void
    {
        $this->assertSame(20, $this->browse(['mode' => 'recent', 'params' => ['per_page' => '20']])['per_page']);
        $this->assertSame(50, $this->browse(['mode' => 'recent', 'params' => ['per_page' => 50]])['per_page']);
    }

    public function testPerPageInQueryStringIsIgnored(): void
    {
        $iDefault = $this->browse(['mode' => 'recent', 'params' => []])['per_page'];

        $_GET['per_page'] = '500';
        $this->assertSame($iDefault, $this->browse(['mode' => 'recent', 'params' => []])['per_page']);
        $this->assertSame(20, $this->browse(['mode' => 'recent', 'params' => ['per_page' => 20]])['per_page']);
    }

    /**
     * browse_author reads a per_page that isn't a number as a setting name. Whatever number
     * that setting holds, an API page has at most 50 entries.
     */
    public function testAuthorPerPageNamingASettingIsBounded(): void
    {
        $iProfileId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `type` <> 'system' AND `status` = 'active' ORDER BY `id` LIMIT 1");
        if (!$iProfileId)
            $this->markTestSkipped('There is no active profile.');

        $sOption = 'sys_per_page_browse_showcase';
        $sPrior = getParam($sOption);
        setParam($sOption, '100000');
        try {
            $aResult = BxDolService::call('bx_posts', 'browse_author', [$iProfileId, ['per_page' => $sOption]], 'Module', true);
        }
        finally {
            setParam($sOption, $sPrior);
        }

        $this->assertSame('browse', $aResult[0]['type'] ?? null);
        $this->assertSame(50, $aResult[0]['data']['params']['per_page']);
    }

    public function testStartIsBounded(): void
    {
        foreach ([['-3', 0], ['abc', 0], [24, 24], ['1000000000', 100000]] as list($mixedStart, $iStart))
            $this->assertSame($iStart, $this->browse(['mode' => 'recent', 'params' => ['start' => $mixedStart]])['start'], 'start ' . var_export($mixedStart, true));
    }
}
