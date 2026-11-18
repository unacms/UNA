<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Studio's Apps switches: Navigation > a menu's items (the grid's 'switcher_api' column, action 'enable_api') and
 * Pages > a page's blocks (action 'block_switch') save `active_api`, and refuse what they are not for.
 */
#[Group('integration')]
class StudioSwitcherApiTest extends BxDolIntegrationTestCase
{
    protected const SET = 'sys_test_switcher_api';

    protected $_aItemIds = [];
    protected $_aBlockIds = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach ($this->_aItemIds as $iId)
            $oDb->query("DELETE FROM `sys_menu_items` WHERE `id` = :id", ['id' => $iId]);
        foreach ($this->_aBlockIds as $iId)
            $oDb->query("DELETE FROM `sys_pages_blocks` WHERE `id` = :id", ['id' => $iId]);

        unset($_GET['ids'], $_REQUEST['ids'], $_GET['id'], $_REQUEST['id'], $_GET['field'], $_REQUEST['field'], $_GET['checked'], $_REQUEST['checked']);

        parent::tearDown();
    }

    protected function addItem(int $iEditable): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_menu_items` SET " . $oDb->arrayToSQL([
            'set_name' => self::SET, 'module' => 'system', 'name' => 'test-' . uniqid(), 'title_system' => '', 'title' => 'Test',
            'link' => '', 'onclick' => '', 'target' => '', 'icon' => '', 'addon' => '', 'markers' => '', 'submenu_object' => '',
            'visibility_custom' => '', 'config_api' => '', 'editable' => $iEditable, 'active' => 1, 'active_api' => 0, 'order' => 1,
        ]));

        return $this->_aItemIds[] = (int)$oDb->lastId();
    }

    protected function addBlock(): int
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `sys_pages_blocks` SET " . $oDb->arrayToSQL([
            'object' => 'sys_test_switcher_api', 'module' => 'custom', 'title_system' => '', 'title' => 'Test', 'icon' => '',
            'header_icon' => '', 'content' => '', 'text' => '', 'text_updated' => 0, 'help' => '', 'config_api' => '',
            'active' => 0, 'active_api' => 0, 'order' => 1,
        ]));

        return $this->_aBlockIds[] = (int)$oDb->lastId();
    }

    protected function value(string $sTable, int $iId, string $sField): int
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT `$sField` FROM `$sTable` WHERE `id` = :id", ['id' => $iId]);
    }

    protected function grid(string $sObject): BxDolGrid
    {
        $this->bxLoginAsAdmin();

        $oGrid = BxDolGrid::getObjectInstance($sObject, BxDolStudioTemplate::getInstance());
        $this->assertInstanceOf(BxDolGrid::class, $oGrid);
        $this->bxSetProtected($oGrid, '_bIsApi', true, BxDolGrid::class);

        return $oGrid;
    }

    public function testNavigationItemsGridSavesTheAppsSwitch(): void
    {
        $iId = $this->addItem(1);
        $oGrid = $this->grid('sys_studio_nav_items');

        $_GET['ids'] = $_REQUEST['ids'] = [$iId];

        $this->assertEquals([$iId], $oGrid->performActionEnableApi(1));
        $this->assertSame(1, $this->value('sys_menu_items', $iId, 'active_api'));
        $this->assertSame(1, $this->value('sys_menu_items', $iId, 'active'), 'The site switch is left as it was.');

        $this->assertEquals([$iId], $oGrid->performActionEnableApi(0));
        $this->assertSame(0, $this->value('sys_menu_items', $iId, 'active_api'));
    }

    public function testNavigationItemWithoutASwitchIsNotChanged(): void
    {
        $iId = $this->addItem(0);
        $oGrid = $this->grid('sys_studio_nav_items');

        $_GET['ids'] = $_REQUEST['ids'] = [$iId];

        $this->assertSame([], $oGrid->performActionEnableApi(1));
        $this->assertSame(0, $this->value('sys_menu_items', $iId, 'active_api'));
    }

    public function testGridWithoutTheAppsFieldRefusesTheAction(): void
    {
        $iId = $this->addItem(1);
        $oGrid = $this->grid('sys_studio_nav_import'); // the same table, but no Apps switch

        $_GET['ids'] = $_REQUEST['ids'] = [$iId];

        $this->assertSame([], $oGrid->performActionEnableApi(1));
        $this->assertSame(0, $this->value('sys_menu_items', $iId, 'active_api'));
    }

    public function testPageBlockSwitchSavesOneField(): void
    {
        $iId = $this->addBlock();
        $this->bxLoginAsAdmin();

        $_GET['id'] = $_REQUEST['id'] = $iId;
        $_GET['field'] = $_REQUEST['field'] = 'active_api';
        $_GET['checked'] = $_REQUEST['checked'] = 1;

        $oBuilder = new BxTemplStudioBuilderPage('system', 'sys_terms');
        $aResult = $this->bxCallProtected($oBuilder, 'actionBlockSwitch');

        $this->assertSame(1, $aResult['active_api'] ?? null);
        $this->assertSame(0, $aResult['active'] ?? null);
        $this->assertStringContainsString('onSwitchBlock(' . $iId . ', oData)', $aResult['eval'] ?? '');
        $this->assertSame(1, $this->value('sys_pages_blocks', $iId, 'active_api'));
        $this->assertSame(0, $this->value('sys_pages_blocks', $iId, 'active'));
    }

    public function testPageBlockSwitchRefusesOtherFields(): void
    {
        $iId = $this->addBlock();
        $this->bxLoginAsAdmin();

        $_GET['id'] = $_REQUEST['id'] = $iId;
        $_GET['field'] = $_REQUEST['field'] = 'deletable';
        $_GET['checked'] = $_REQUEST['checked'] = 0;

        $oBuilder = new BxTemplStudioBuilderPage('system', 'sys_terms');
        $aResult = $this->bxCallProtected($oBuilder, 'actionBlockSwitch');

        $this->assertArrayHasKey('msg', $aResult);
        $this->assertArrayNotHasKey('eval', $aResult);
        $this->assertSame(1, $this->value('sys_pages_blocks', $iId, 'deletable'));
    }

    public function testPageBlockGreyedOnlyWhenOffEverywhere(): void
    {
        $oBuilder = new BxTemplStudioBuilderPage('system', 'sys_terms');

        $this->assertTrue($this->bxCallProtected($oBuilder, 'isBlockInactive', ['active' => 0, 'active_api' => 0]));
        $this->assertFalse($this->bxCallProtected($oBuilder, 'isBlockInactive', ['active' => 0, 'active_api' => 1]));
        $this->assertFalse($this->bxCallProtected($oBuilder, 'isBlockInactive', ['active' => 1, 'active_api' => 0]));
    }
}
