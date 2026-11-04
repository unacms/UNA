<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Recommendations called by an API client: they are the viewer's own whichever profile the
 * client names (a guest gets none), a page has 1 to 50 profiles, otherwise the default number,
 * and start is a whole number from 0 to 100000.
 */
#[Group('integration')]
class RecommendationsApiPagingTest extends BxDolIntegrationTestCase
{
    protected $_aGetBackup;
    protected $_aIsApiBackup = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;

        $_GET['api'] = 1;

        // the services and modules know if they serve the API when they are made, and they are kept for the request
        unset($GLOBALS['bxDolClasses']['BxTemplServiceProfiles']);
        foreach ($this->fansModules() as $sModule) {
            $oModule = BxDolModule::getInstance($sModule);
            $this->_aIsApiBackup[$sModule] = $this->bxGetProtected($oModule, '_bIsApi', BxBaseModGeneralModule::class);
            $this->bxSetProtected($oModule, '_bIsApi', true, BxBaseModGeneralModule::class);
        }

        // as inside a page: the service reads the App config of the block it renders
        BxDolPage::setBlockProcessing(['config_api' => '']);
    }

    protected function tearDown(): void
    {
        foreach ($this->_aIsApiBackup as $sModule => $bIsApi)
            $this->bxSetProtected(BxDolModule::getInstance($sModule), '_bIsApi', $bIsApi, BxBaseModGeneralModule::class);
        unset($GLOBALS['bxDolClasses']['BxTemplServiceProfiles']);

        BxDolPage::unsetBlockProcessing();
        $_GET = $this->_aGetBackup ?? [];
        parent::tearDown();
    }

    protected function browse(string $sMethod, int $iProfileId, array $aParams = [], string $sModule = 'system')
    {
        // true: skip the memory cache of results, every call is a new request
        return BxDolService::call($sModule, $sMethod, [$iProfileId, json_encode(['params' => $aParams])], $sModule == 'system' ? 'TemplServiceProfiles' : 'Module', true);
    }

    /**
     * A profile other than the viewer's.
     */
    protected function otherProfileId(int $iOwnProfileId = 0): int
    {
        $iProfileId = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `type` <> 'system' AND `status` = 'active' AND `id` <> :id ORDER BY `id` LIMIT 1", ['id' => $iOwnProfileId]);
        if (!$iProfileId)
            $this->markTestSkipped('There is no other active profile.');

        return $iProfileId;
    }

    protected function loginAsMember(): int
    {
        $this->bxLoginAsAdmin();

        $iProfileId = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $iProfileId);

        return $iProfileId;
    }

    protected function fansModules(): array
    {
        $aModules = [];
        foreach (['bx_groups', 'bx_spaces', 'bx_jobs'] as $sModule)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sModule) && BxDolService::call($sModule, 'is_safe_service', ['browse_recommendations_fans']))
                $aModules[] = $sModule;

        return $aModules;
    }

    public function testGuestCantNameAProfile(): void
    {
        $this->bxBecomeGuest();
        $iProfileId = $this->otherProfileId();

        foreach (['browse_recommendations_friends', 'browse_recommendations_subscriptions'] as $sMethod)
            $this->assertSame('', $this->browse($sMethod, $iProfileId), $sMethod);

        foreach ($this->fansModules() as $sModule)
            $this->assertSame('', $this->browse('browse_recommendations_fans', $iProfileId, [], $sModule), $sModule);
    }

    public function testMemberGetsOwnRecommendations(): void
    {
        $iOwnProfileId = $this->loginAsMember();
        $iProfileId = $this->otherProfileId($iOwnProfileId);

        foreach (['browse_recommendations_friends', 'browse_recommendations_subscriptions'] as $sMethod) {
            $aResult = $this->browse($sMethod, $iProfileId);
            $this->assertStringContainsString('&params[]=' . $iOwnProfileId . '&', $aResult[0]['data']['request_url'], $sMethod);
        }

        foreach ($this->fansModules() as $sModule) {
            $aResult = $this->browse('browse_recommendations_fans', $iProfileId, [], $sModule);
            $this->assertStringContainsString('&params[]=' . $iOwnProfileId . '&', $aResult[0]['data']['request_url'], $sModule);
        }
    }

    public function testPerPageIsBounded(): void
    {
        $iOwnProfileId = $this->loginAsMember();
        $iDefault = (int)getParam('sys_per_page_recommendations');

        $aMethods = [
            ['system', 'browse_recommendations_friends'],
            ['system', 'browse_recommendations_subscriptions'],
        ];
        foreach ($this->fansModules() as $sModule)
            $aMethods[] = [$sModule, 'browse_recommendations_fans'];

        foreach ($aMethods as list($sModule, $sMethod)) {
            $sCase = $sModule . ' ' . $sMethod;

            foreach ([500, '500', 51, -1, 'abc'] as $mixedPerPage)
                $this->assertSame($iDefault, $this->browse($sMethod, $iOwnProfileId, ['per_page' => $mixedPerPage], $sModule)[0]['data']['params']['per_page'], $sCase . ' per_page ' . var_export($mixedPerPage, true));

            $this->assertSame(20, $this->browse($sMethod, $iOwnProfileId, ['per_page' => 20], $sModule)[0]['data']['params']['per_page'], $sCase);

            foreach ([[-5, 0], [24, 24], [1000000000, 100000]] as list($iStart, $iExpected))
                $this->assertSame($iExpected, $this->browse($sMethod, $iOwnProfileId, ['start' => $iStart], $sModule)[0]['data']['params']['start'], $sCase . ' start ' . $iStart);

            //--- the query string overrides the params, so it is bounded the same way
            $_GET['per_page'] = '500';
            $this->assertSame($iDefault, $this->browse($sMethod, $iOwnProfileId, [], $sModule)[0]['data']['params']['per_page'], $sCase . ' per_page in the query string');
            unset($_GET['per_page']);
        }
    }
}
