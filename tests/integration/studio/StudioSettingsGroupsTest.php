<?php

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Studio > Settings: the system settings in nine groups instead of one "Global" page. Categories keep their
 * names, the hard-coded ones stay in the `system` type, and a link to a category opens the group it is in now.
 */
#[Group('integration')]
class StudioSettingsGroupsTest extends BxDolIntegrationTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // BX_DOL_STUDIO_STG_* constants are declared in BxDolStudioOptions.php, which a Settings page loads first.
        class_exists('BxTemplStudioOptions');
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
            ['sys_ftp', 'system_advanced'],
        ];
    }

    #[DataProvider('groupsOfCategories')]
    public function testCategoryIsInItsGroup(string $sCategory, string $sType): void
    {
        $this->assertSame($sType, $this->typeOfCategory($sCategory));
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
}
