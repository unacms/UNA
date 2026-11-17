<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * How the apps show a section's menu on large screens (`sys_objects_menu`.`section_nav`; Studio > Navigation > a menu):
 * tabs (empty) or a sidebar column. The menu's API carries it as `section_nav`; the connections' menu (Friends,
 * Requests, Suggestions...) is installed and migrated with the sidebar, every other menu keeps tabs.
 *
 * Phones and tablets have their own choice (`section_nav_small`, the API's `section_nav_small`): tabs (empty) or a
 * list, where the section opens on the menu itself. The account's settings have the list (SettingsPageTest).
 */
#[Group('integration')]
class MenuSectionNavTest extends BxDolIntegrationTestCase
{
    /** A copy of the member toolbar with the given object fields, so the shared instance is left as it is. */
    protected function menu(array $aFields = []): BxBaseMenu
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_toolbar_member');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);
        $oMenu = clone $oMenu;

        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $oProp->setValue($oMenu, array_merge($oProp->getValue($oMenu), $aFields, ['cache' => 'off']));

        return $oMenu;
    }

    public function testColumnExists(): void
    {
        $this->assertTrue(BxDolDb::getInstance()->isFieldExists('sys_objects_menu', 'section_nav'));
    }

    public function testValues(): void
    {
        $this->assertSame([BxDolMenu::SECTION_NAV_TABS, BxDolMenu::SECTION_NAV_SIDEBAR], BxDolMenu::getSectionNavs());
        $this->assertSame(BxDolMenu::SECTION_NAV_TABS, $this->menu(['section_nav' => ''])->getSectionNav());
        $this->assertSame(BxDolMenu::SECTION_NAV_SIDEBAR, $this->menu(['section_nav' => 'sidebar'])->getSectionNav());
        $this->assertSame(BxDolMenu::SECTION_NAV_TABS, $this->menu(['section_nav' => 'columns'])->getSectionNav(), 'Anything else stored is tabs.');
    }

    public function testSmallScreensColumnExists(): void
    {
        $this->assertTrue(BxDolDb::getInstance()->isFieldExists('sys_objects_menu', 'section_nav_small'));
    }

    public function testSmallScreensValues(): void
    {
        $this->assertSame([BxDolMenu::SECTION_NAV_SMALL_TABS, BxDolMenu::SECTION_NAV_SMALL_LIST], BxDolMenu::getSectionNavsSmall());
        $this->assertSame(BxDolMenu::SECTION_NAV_SMALL_TABS, $this->menu(['section_nav_small' => ''])->getSectionNavSmall());
        $this->assertSame(BxDolMenu::SECTION_NAV_SMALL_LIST, $this->menu(['section_nav_small' => 'list'])->getSectionNavSmall());
        $this->assertSame(BxDolMenu::SECTION_NAV_SMALL_TABS, $this->menu(['section_nav_small' => 'sidebar'])->getSectionNavSmall(), 'Anything else stored is tabs.');
    }

    public function testApiCarriesTheSmallScreensChoice(): void
    {
        $this->bxLoginAsAdmin();

        $this->assertSame('list', $this->menu(['section_nav_small' => 'list'])->getCodeAPI()['section_nav_small']);
        $this->assertSame('', $this->menu(['section_nav_small' => ''])->getCodeAPI()['section_nav_small']);
    }

    public function testApiCarriesIt(): void
    {
        $this->bxLoginAsAdmin();

        $aCode = $this->menu(['section_nav' => 'sidebar'])->getCodeAPI();
        $this->assertArrayHasKey('section_nav', $aCode);
        $this->assertSame('sidebar', $aCode['section_nav']);

        $this->assertSame('', $this->menu(['section_nav' => ''])->getCodeAPI()['section_nav']);
    }

    public function testConnectionsAreASidebarSection(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_con_submenu');
        if(!$oMenu)
            $this->markTestSkipped('The connections menu is not installed.');

        // The install SQL itself is checked by tests/units/install/MenuSectionNavSqlTest.php: an installed site may have no install/ folder.
        $this->assertSame(BxDolMenu::SECTION_NAV_SIDEBAR, $oMenu->getSectionNav());
    }

    public function testStudioHasTheField(): void
    {
        $sStudio = file_get_contents(BX_DIRECTORY_PATH_ROOT . 'studio/template/scripts/BxBaseStudioNavigationMenus.php');
        $this->assertStringContainsString("'section_nav' => array(", $sStudio);
        $this->assertStringContainsString('BxDolMenu::SECTION_NAV_SIDEBAR', $sStudio);
        $this->assertStringContainsString("'section_nav_small' => array(", $sStudio);
        $this->assertStringContainsString('BxDolMenu::SECTION_NAV_SMALL_LIST', $sStudio);
    }
}
