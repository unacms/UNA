<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The apps' header shows the tools of the site's member toolbar (sys_toolbar_member) the viewer gets: UNA sends
 * their names with the viewer's data (`toolbar`, BxDolProfile::getDataForPage), read with
 * BxBaseMenu::getMenuItemsNames, so a module that isn't installed leaves no button.
 */
#[Group('integration')]
class MenuItemsNamesTest extends BxDolIntegrationTestCase
{
    /** A copy of the member toolbar, so the shared instance is left as it is. */
    protected function toolbar(): BxBaseMenu
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_toolbar_member');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);

        return clone $oMenu;
    }

    protected function setProtected($oObject, string $sProperty, $mixedValue): void
    {
        $oProp = new ReflectionProperty($oObject, $sProperty);
        $oProp->setValue($oObject, $mixedValue);
    }

    protected function withItems(BxBaseMenu $oMenu, array $aItems): BxBaseMenu
    {
        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $aObject = $oProp->getValue($oMenu);
        $aObject['menu_items'] = array_combine(array_column($aItems, 'name'), $aItems);
        $oProp->setValue($oMenu, $aObject);

        return $oMenu;
    }

    public function testNamesAreTheItemsTheMenuBuilds(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = $this->toolbar();
        $aBuilt = array_column($oMenu->getMenuItems(), 'name');

        $this->assertNotEmpty($aBuilt);
        $this->assertSame($aBuilt, $oMenu->getMenuItemsNames());
    }

    public function testInactiveAndHiddenItemsAreLeftOut(): void
    {
        $this->bxLoginAsAdmin();

        $aItems = [
            ['name' => 'shown', 'active' => 1, 'active_api' => 0, 'visible_for_levels' => 2147483647],
            ['name' => 'off', 'active' => 0, 'active_api' => 1, 'visible_for_levels' => 2147483647],
            ['name' => 'hidden', 'active' => 1, 'active_api' => 1, 'visible_for_levels' => 0],
        ];

        $oSite = $this->withItems($this->toolbar(), $aItems);
        $this->setProtected($oSite, '_bIsApi', false);
        $this->assertSame(['shown'], $oSite->getMenuItemsNames(), 'The site goes by `active`.');

        $oApps = $this->withItems($this->toolbar(), $aItems);
        $this->setProtected($oApps, '_bIsApi', true);
        $this->assertSame(['off'], $oApps->getMenuItemsNames(), 'The apps go by `active_api`.');
    }

    public function testViewerDataCarriesTheToolbar(): void
    {
        $this->bxLoginAsAdmin();

        $aData = BxDolProfile::getDataForPage(bx_get_logged_profile_id());

        $this->assertArrayHasKey('toolbar', $aData);
        $this->assertSame($this->toolbar()->getMenuItemsNames(), $aData['toolbar']);
    }
}
