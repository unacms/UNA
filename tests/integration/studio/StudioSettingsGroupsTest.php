<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Settings: the system settings in nine groups instead of one "Global" page. Categories keep their
 * names, the hard-coded ones stay in the `system` type, and a link to a category opens the group it is in now.
 * Studio > API > Settings: the API v2 options are in their own "API v2 preview" section, and Search sections is a
 * list of the site's search sections.
 */
#[Group('integration')]
class StudioSettingsGroupsTest extends BxDolIntegrationTestCase
{
    private $_sSearchSections;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_sSearchSections = getParam('sys_api_search_sections');

        // BX_DOL_STUDIO_STG_* constants are declared in BxDolStudioOptions.php, which a Settings page loads first.
        class_exists('BxTemplStudioOptions');
    }

    protected function tearDown(): void
    {
        setParam('sys_api_search_sections', $this->_sSearchSections);

        parent::tearDown();
    }

    protected function typeOfCategory(string $sCategory): string
    {
        return (string)BxDolDb::getInstance()->getOne("SELECT `tt`.`name` FROM `sys_options_categories` AS `tc` INNER JOIN `sys_options_types` AS `tt` ON `tc`.`type_id` = `tt`.`id` WHERE `tc`.`name` = :name", ['name' => $sCategory]);
    }

    protected function categoryOfOption(string $sOption): string
    {
        return (string)BxDolDb::getInstance()->getOne("SELECT `tc`.`name` FROM `sys_options` AS `to` INNER JOIN `sys_options_categories` AS `tc` ON `to`.`category_id` = `tc`.`id` WHERE `to`.`name` = :name", ['name' => $sOption]);
    }

    protected function linkedType(string $sType, $mixedCategory): string
    {
        // A Settings page creates BxDolStudioOptionsQuery with `new`, which refuses to run once another test in
        // this process has made its singleton; set that one aside for the call, as a fresh request would have it.
        $oSingleton = $GLOBALS['bxDolClasses']['BxDolStudioOptionsQuery'] ?? null;
        unset($GLOBALS['bxDolClasses']['BxDolStudioOptionsQuery']);
        try {
            $oSettings = (new ReflectionClass('BxTemplStudioSettings'))->newInstanceWithoutConstructor();
            return (new ReflectionMethod($oSettings, 'getTypeOfCategory'))->invoke($oSettings, $sType, $mixedCategory);
        } finally {
            if ($oSingleton !== null)
                $GLOBALS['bxDolClasses']['BxDolStudioOptionsQuery'] = $oSingleton;
        }
    }

    public static function groupsOfCategories(): array
    {
        return [
            ['site_settings', 'system'],
            ['sys_updates', 'system'],
            ['permalinks', 'system'],
            ['account', 'system_members'],
            ['acl', 'system_members'],
            ['sys_sign_in_protection', 'system_security'],
            ['security', 'system_security'],
            ['sys_posting', 'system_content'],
            ['reactions', 'system_content'],
            ['storage', 'system_files'],
            ['notifications', 'system_messaging'],
            ['sys_payments', 'system_payments'],
            ['cache', 'system_performance'],
            ['sys_ftp', 'advanced'],
            ['general', 'advanced'],
        ];
    }

    #[DataProvider('groupsOfCategories')]
    public function testCategoryIsInItsGroup(string $sCategory, string $sType): void
    {
        $this->assertSame($sType, $this->typeOfCategory($sCategory));
    }

    public function testGroupNamesAreShort(): void
    {
        // Group names in the Settings menu are one or two words.
        $aTypes = BxDolDb::getInstance()->getColumn("SELECT `caption` FROM `sys_options_types` WHERE `group` = 'system'");
        $this->assertNotEmpty($aTypes);
        foreach ($aTypes as $sCaption)
            $this->assertLessThanOrEqual(2, count(preg_split('/\s+/u', trim(_t($sCaption)))), $sCaption);
    }

    public function testHardCodedCategoriesStayInSystem(): void
    {
        foreach (['languages', 'audit', 'hidden', 'system', 'templates'] as $sCategory)
            $this->assertSame('system', $this->typeOfCategory($sCategory), $sCategory);
    }

    public function testLiveHiddenOptionsAreVisible(): void
    {
        $this->assertSame('sys_updates', $this->categoryOfOption('sys_maintenance_mode'));
        $this->assertSame('sys_sessions', $this->categoryOfOption('sys_session_lifetime_in_min'));
        $this->assertSame('sys_uploads', $this->categoryOfOption('sys_files_ext_dangerous'));
        $this->assertSame('sys_interface', $this->categoryOfOption('sys_fixed_header'));
        $this->assertSame('hidden', $this->categoryOfOption('sys_cron_time'));
    }

    public function testOldSystemCategoryIsEmptyAndHidden(): void
    {
        $oDb = BxDolDb::getInstance();
        $this->assertSame(1, (int)$oDb->getOne("SELECT `hidden` FROM `sys_options_categories` WHERE `name` = 'general'"));
        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `sys_options` AS `to` INNER JOIN `sys_options_categories` AS `tc` ON `to`.`category_id` = `tc`.`id` WHERE `tc`.`name` = 'general'"));
    }

    public function testLinkToMovedCategoryOpensItsGroup(): void
    {
        $this->assertSame('system_members', $this->linkedType('system', 'account'));
        $this->assertSame('system_members', $this->linkedType('system_members', 'account'));
    }

    public function testLinkKeepsTypeOtherwise(): void
    {
        $this->assertSame('system', $this->linkedType('system', ''));
        $this->assertSame('system', $this->linkedType('system', 'account,acl'));
        $this->assertSame('system', $this->linkedType('system', ['account']));
        $this->assertSame('system', $this->linkedType('system', 'no_such_category'));
        $this->assertSame('system', $this->linkedType('system', 'hidden'));
    }

    public function testSideMenuStartsWithGeneralAndEndsWithAdvanced(): void
    {
        $aTypes = [];
        (new BxDolStudioSettingsQuery())->getTypes(['type' => 'all', 'not_in_group' => ['templates']], $aTypes);

        $aSystem = array_values(array_map(function ($aType) {
            return $aType['name'];
        }, array_filter($aTypes, function ($aType) {
            return $aType['group'] == 'system';
        })));

        $this->assertSame('system', $aSystem[0]);
        $this->assertSame('advanced', end($aSystem));
        $this->assertCount(9, $aSystem);
    }

    public function testLinkToAdvancedCategoryOpensItsGroup(): void
    {
        // Settings > Advanced (page=advanced) held the server settings before they got groups of their own.
        $this->assertSame('system_performance', $this->linkedType('advanced', 'cache'));
        $this->assertSame('system', $this->linkedType('advanced', 'permalinks'));
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

    private function option(string $sName): array
    {
        return BxDolDb::getInstance()->getRow("SELECT `o`.`type`, `o`.`extra`, `c`.`name` AS `category`
            FROM `sys_options` AS `o` INNER JOIN `sys_options_categories` AS `c` ON `o`.`category_id` = `c`.`id`
            WHERE `o`.`name` = :name", ['name' => $sName]);
    }
}
