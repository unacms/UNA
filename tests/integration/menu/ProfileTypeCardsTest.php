<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * The profile types of "Create your profile" (menu `sys_add_profile`, template "Cards with descriptions"): each card
 * has the item's Info, editable in Studio > Navigation, and the default profile type (Studio > Settings > Account)
 * comes first. Options are set in the param cache only.
 */
#[Group('integration')]
class ProfileTypeCardsTest extends BxDolIntegrationTestCase
{
    protected $_sDefaultBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_sDefaultBackup = getParam('sys_account_default_profile_type');

        if (count(BxDolPage::getProfileCreationPages()) < 2)
            $this->markTestSkipped('Needs two profile modules.');
    }

    protected function tearDown(): void
    {
        $this->bxSetParamCache('sys_account_default_profile_type', $this->_sDefaultBackup);
        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    public function testCardsWithTheItemsInfo(): void
    {
        $this->bxLoginAsAdmin();

        $aMenu = BxDolMenuQuery::getMenuObject('sys_add_profile');
        $this->assertSame('menu_list_desc_cards.html', $aMenu['template']);

        $sCode = BxDolMenu::getObjectInstance('sys_add_profile')->getCode();
        $this->assertStringContainsString('bx-menu-list-desc-cards', $sCode);

        foreach ((new BxDolMenuQuery($aMenu))->getMenuItemsFromSet($aMenu['set_name']) as $aItem) {
            if (empty($aItem['active']) || empty($aItem['info']))
                continue;
            $this->assertStringContainsString(bx_process_output(_t($aItem['info'])), $sCode, $aItem['name']);
        }
    }

    public function testTheDefaultProfileTypeComesFirst(): void
    {
        $this->bxLoginAsAdmin();

        $aModules = [];
        foreach (BxDolMenu::getObjectInstance('sys_add_profile')->getMenuItems() as $aItem)
            $aModules[] = $aItem['module'];
        $this->assertGreaterThanOrEqual(2, count($aModules));

        $sLast = end($aModules);
        $this->bxSetParamCache('sys_account_default_profile_type', $sLast);
        unset($GLOBALS['bxDolClasses']['BxDolMenu!sys_add_profile']);

        $oMenu = BxDolMenu::getObjectInstance('sys_add_profile');
        $aItems = $oMenu->getMenuItems();
        $this->assertSame($sLast, $aItems[0]['module']);
        $this->assertSame(count($aModules), count($aItems), 'Only the order changes.');
    }
}
