<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Settings: Global starts with the Site section and keeps what the operator sets up first; the server settings
 * are on the Advanced page, right after Global in the side menu. Studio > API > Settings: the API v2 options are in
 * their own "API v2 preview" section, and Search sections is a list of the site's search sections.
 */
#[Group('integration')]
class StudioSettingsGroupsTest extends BxDolIntegrationTestCase
{
    private const SERVER = ['general', 'cache', 'permalinks', 'storage', 'notifications_push', 'sms', 'sockets'];

    private $_sSearchSections;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sSearchSections = getParam('sys_api_search_sections');
    }

    protected function tearDown(): void
    {
        setParam('sys_api_search_sections', $this->_sSearchSections);

        parent::tearDown();
    }

    public function testGlobalStartsWithSiteAndHasNoServerSettings(): void
    {
        $aCategories = $this->visibleCategories('system');

        $this->assertSame('site_settings', $aCategories[0], 'Site is the first section');
        $this->assertSame('Site', _t('_adm_stg_cpt_category_site_settings'));
        $this->assertContains('account', $aCategories);
        $this->assertSame([], array_values(array_intersect(self::SERVER, $aCategories)));
        $this->assertLessThan(array_search('security', $aCategories), array_search('account', $aCategories), 'Account comes before Security');
    }

    public function testAdvancedHasTheServerSettings(): void
    {
        $this->assertSame(self::SERVER, $this->visibleCategories('advanced'));
        $this->assertSame('Advanced', _t('_adm_stg_cpt_type_advanced'));
    }

    public function testAdvancedComesRightAfterGlobalInTheSideMenu(): void
    {
        $aTypes = [];
        (new BxDolStudioSettingsQuery())->getTypes(['type' => 'all', 'not_in_group' => ['templates']], $aTypes);

        $aSystem = array_values(array_map(function ($aType) {
            return $aType['name'];
        }, array_filter($aTypes, function ($aType) {
            return $aType['group'] == 'system';
        })));

        $this->assertSame(['system', 'advanced'], $aSystem);
    }

    public function testApiV2OptionsAreInThePreviewSection(): void
    {
        foreach (['sys_api_v2_enable', 'sys_api_v2_rate_limit', 'sys_api_v2_rate_limit_general', 'sys_api_v2_rate_limit_upload'] as $sName)
            $this->assertSame('api_preview', $this->option($sName)['category'], $sName);

        $this->assertSame('api_general', $this->option('sys_api_enable')['category']);
    }

    public function testSearchSectionsIsAListOfTheSiteSections(): void
    {
        $aOption = $this->option('sys_api_search_sections');
        $this->assertSame('list', $aOption['type']);
        $this->assertTrue(BxDolService::isSerializedService($aOption['extra']));

        setParam('sys_api_search_sections', 'bx_posts,sys_test_gone_section');
        $aValues = BxDolService::callSerialized($aOption['extra']);

        foreach (BxDolSearch::getSections() as $sName => $aSection)
            if ((int)$aSection['GlobalSearch'] == 1)
                $this->assertSame(_t($aSection['title']), $aValues[$sName], $sName);
            else
                $this->assertArrayNotHasKey($sName, $aValues, 'a section the site search leaves out is not offered');

        $this->assertSame('sys_test_gone_section', $aValues['sys_test_gone_section'], 'a saved name that is no section any more is kept');
    }

    /**
     * The visible categories of a settings page, in order.
     */
    private function visibleCategories(string $sType): array
    {
        $aCategories = [];
        BxDolStudioOptionsQuery::getInstance()->getCategories(['type' => 'by_type_name_key_name', 'type_name' => $sType, 'hidden' => 0], $aCategories);

        return array_keys($aCategories);
    }

    private function option(string $sName): array
    {
        return BxDolDb::getInstance()->getRow("SELECT `o`.`type`, `o`.`extra`, `c`.`name` AS `category`
            FROM `sys_options` AS `o` INNER JOIN `sys_options_categories` AS `c` ON `o`.`category_id` = `c`.`id`
            WHERE `o`.`name` = :name", ['name' => $sName]);
    }
}
