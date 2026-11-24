<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The member's own menu (Profile stats, `sys_profile_stats`) for the apps: its items with their counts (`addon`),
 * how many show before "Show more" (`more_after`, the same number the site folds at) and the control's labels. The
 * counts are kept for the member a short while, so the apps' home doesn't call every counter's service each time.
 */
#[Group('integration')]
class ProfileStatsApiTest extends BxDolIntegrationTestCase
{
    /** A copy of the menu in API mode, so the shared instance is left as it is. */
    protected function menu(string $sObject = 'sys_profile_stats'): BxBaseMenuProfileStats
    {
        $oMenu = BxDolMenu::getObjectInstance($sObject);
        if (!$oMenu)
            $this->markTestSkipped($sObject . ' is not installed.');
        $this->assertInstanceOf(BxBaseMenuProfileStats::class, $oMenu);
        $oMenu = clone $oMenu;

        (new ReflectionProperty($oMenu, '_bIsApi'))->setValue($oMenu, true);
        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $oProp->setValue($oMenu, array_merge($oProp->getValue($oMenu), ['cache' => 'off']));

        return $oMenu;
    }

    public function testApiCarriesItemsCountsAndTheLimit(): void
    {
        $this->bxLoginAsUser();
        bx_content_cache_del('menu_sys_profile_stats_p' . bx_get_logged_profile_id() . '_api_addons');

        $aCode = $this->menu()->getCodeAPI();

        $this->assertSame('sys_profile_stats', $aCode['object']);
        $this->assertSame(BxBaseMenuProfileStats::ITEMS_VISIBLE, $aCode['more_after'], 'The apps fold where the site does.');
        $this->assertSame(_t('_sys_show_more'), $aCode['more_title']);
        $this->assertSame(_t('_sys_show_less'), $aCode['less_title']);

        $this->assertNotEmpty($aCode['items']);
        foreach ($aCode['items'] as $a) {
            $this->assertArrayHasKey('addon', $a, $a['name']);
            $this->assertStringNotContainsString('javascript:', (string)$a['link'], $a['name']);
        }
        $this->assertContains('profile-stats-profile', array_column($aCode['items'], 'name'));
    }

    public function testTheTilesShowEveryItem(): void
    {
        $this->bxLoginAsUser();

        $oMenu = $this->menu('sys_profile_stats_tiles');
        $this->assertSame(0, $oMenu->getCodeAPI()['more_after']);
    }

    public function testCountsAreKeptForTheMember(): void
    {
        if (!getParam('sys_content_cache_enable'))
            $this->markTestSkipped('The content cache is off.');

        $this->bxLoginAsUser();
        $sKey = 'menu_sys_profile_stats_p' . bx_get_logged_profile_id() . '_api_addons';
        bx_content_cache_del($sKey);

        $aFirst = $this->menu()->getCodeAPI();
        $aCached = bx_content_cache_get($sKey, BxBaseMenuProfileStats::API_COUNTERS_TTL);
        $this->assertIsArray($aCached, 'The first call keeps the counts.');
        $this->assertEqualsCanonicalizing(array_map('intval', array_column($aFirst['items'], 'id')), array_keys($aCached));

        // The next call takes the counts from the cache, not from the counters' services.
        $iId = (int)$aFirst['items'][0]['id'];
        bx_content_cache_set($sKey, [$iId => '42'] + $aCached, BxBaseMenuProfileStats::API_COUNTERS_TTL);
        $aSecond = $this->menu()->getCodeAPI();
        $this->assertSame('42', $aSecond['items'][0]['addon']);

        bx_content_cache_del($sKey);
    }

    public function testAddingContentClearsTheCounts(): void
    {
        if (!getParam('sys_content_cache_enable'))
            $this->markTestSkipped('The content cache is off.');

        $this->bxLoginAsUser();
        $iProfileId = (int)bx_get_logged_profile_id();
        $aKeys = ['menu_sys_profile_stats_p' . $iProfileId, 'menu_sys_profile_stats_p' . $iProfileId . '_api_addons'];
        foreach ($aKeys as $sKey)
            bx_content_cache_set($sKey, [1 => '7'], BxBaseMenuProfileStats::API_COUNTERS_TTL);
        bx_content_cache_set('menu_sys_profile_stats_p' . $iProfileId . '0_api_addons', [1 => '7'], 60);

        // what a module's entry form calls after an entry is added or deleted
        BxBaseMenuProfileStats::clearCacheForProfile($iProfileId);

        foreach ($aKeys as $sKey)
            $this->assertNull(bx_content_cache_get($sKey, BxBaseMenuProfileStats::API_COUNTERS_TTL), $sKey);
        $this->assertNotNull(bx_content_cache_get('menu_sys_profile_stats_p' . $iProfileId . '0_api_addons', 60), 'Another profile\'s counts stay.');
        bx_content_cache_del('menu_sys_profile_stats_p' . $iProfileId . '0_api_addons');
    }

    public function testOwnerParamGoesBeforeTheFragment(): void
    {
        $this->assertSame('page.php?i=persons-profile-relations&profile_id=4&owner=1#relations', BxBaseMenuProfileStats::appendOwnerParam('page.php?i=persons-profile-relations&profile_id=4#relations'));
        $this->assertSame('page.php?i=persons-manage&owner=1', BxBaseMenuProfileStats::appendOwnerParam('page.php?i=persons-manage'));
        $this->assertSame('friend-suggestions?owner=1', BxBaseMenuProfileStats::appendOwnerParam('friend-suggestions'));
    }
}
