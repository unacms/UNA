<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A menu's button style and size (`sys_objects_menu`.`button_style` / `button_size`; Studio > Navigation > a menu):
 * the site gets them as classes on each of the menu's items, the apps as two fields of the menu's API. Empty is
 * automatic and adds nothing, so a menu nobody touched renders as before.
 */
#[Group('integration')]
class MenuButtonStyleTest extends BxDolIntegrationTestCase
{
    /** A copy of the member toolbar with the given object fields, so the shared instance is left as it is. */
    protected function menu(array $aFields = [], bool $bApi = false): BxBaseMenu
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_toolbar_member');
        $this->assertInstanceOf(BxBaseMenu::class, $oMenu);
        $oMenu = clone $oMenu;

        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $aObject = array_merge($oProp->getValue($oMenu), $aFields);
        $aObject['cache'] = 'off';
        $aObject['menu_items'] = [
            'first' => ['id' => 1, 'name' => 'first', 'title' => 'First', 'link' => 'page.php?i=first', 'onclick' => '', 'target' => '', 'icon' => '', 'addon' => '', 'submenu_object' => '', 'active' => 1, 'active_api' => 1, 'visible_for_levels' => 2147483647, 'visibility_custom' => '', 'hidden_on' => 0, 'hidden_on_cxt' => '', 'hidden_on_pt' => 0, 'hidden_on_col' => 0, 'module' => 'system', 'set_name' => 'sys_toolbar_member', 'config_api' => '', 'primary' => 0, 'collapsed' => 0, 'markers' => '', 'title_system' => ''],
        ];
        $oProp->setValue($oMenu, $aObject);

        $oApi = new ReflectionProperty($oMenu, '_bIsApi');
        $oApi->setValue($oMenu, $bApi);

        return $oMenu;
    }

    protected function itemClass(BxBaseMenu $oMenu): string
    {
        $aItems = $oMenu->getMenuItems();
        $this->assertNotEmpty($aItems, 'The test menu has its one item.');

        $aItem = reset($aItems);
        return (string)$aItem['class_add'];
    }

    public function testColumnsExist(): void
    {
        $oDb = BxDolDb::getInstance();

        $this->assertTrue($oDb->isFieldExists('sys_objects_menu', 'button_style'));
        $this->assertTrue($oDb->isFieldExists('sys_objects_menu', 'button_size'));
    }

    public function testAutomaticAddsNothing(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = $this->menu(['button_style' => '', 'button_size' => '']);

        $this->assertSame(BxDolMenu::BUTTON_STYLE_AUTO, $oMenu->getButtonStyle());
        $this->assertSame(BxDolMenu::BUTTON_SIZE_AUTO, $oMenu->getButtonSize());
        $this->assertSame('', $oMenu->getButtonClasses());
        $this->assertStringNotContainsString('bx-menu-btn-', $this->itemClass($oMenu));
    }

    public function testObjectWithoutTheColumnsIsAutomatic(): void
    {
        $oMenu = $this->menu();

        $oProp = new ReflectionProperty($oMenu, '_aObject');
        $aObject = $oProp->getValue($oMenu);
        unset($aObject['button_style'], $aObject['button_size']);
        $oProp->setValue($oMenu, $aObject);

        $this->assertSame('', $oMenu->getButtonClasses(), 'A menu object cached before the columns were added still renders.');
    }

    public function testStyleAndSizeBecomeItemClasses(): void
    {
        $this->bxLoginAsAdmin();

        $sClass = $this->itemClass($this->menu(['button_style' => BxDolMenu::BUTTON_STYLE_GLASS, 'button_size' => BxDolMenu::BUTTON_SIZE_SMALL]));

        $this->assertStringContainsString(' bx-menu-btn-style-glass', $sClass);
        $this->assertStringContainsString(' bx-menu-btn-size-small', $sClass);
    }

    public function testEveryValueHasItsClass(): void
    {
        foreach(BxDolMenu::getButtonStyles() as $sStyle) {
            $sClasses = $this->menu(['button_style' => $sStyle, 'button_size' => ''])->getButtonClasses();
            $this->assertSame($sStyle == BxDolMenu::BUTTON_STYLE_AUTO ? '' : ' bx-menu-btn-style-' . $sStyle, $sClasses);
        }

        foreach(BxDolMenu::getButtonSizes() as $sSize) {
            $sClasses = $this->menu(['button_style' => '', 'button_size' => $sSize])->getButtonClasses();
            $this->assertSame($sSize == BxDolMenu::BUTTON_SIZE_AUTO ? '' : ' bx-menu-btn-size-' . $sSize, $sClasses);
        }
    }

    public function testUnknownValuesAreAutomatic(): void
    {
        $oMenu = $this->menu(['button_style' => 'glass" onmouseover="x', 'button_size' => 'huge']);

        $this->assertSame(BxDolMenu::BUTTON_STYLE_AUTO, $oMenu->getButtonStyle());
        $this->assertSame(BxDolMenu::BUTTON_SIZE_AUTO, $oMenu->getButtonSize());
        $this->assertSame('', $oMenu->getButtonClasses(), 'Only the known values reach the markup.');
    }

    public function testApiCarriesTheFieldsAndNoClasses(): void
    {
        $this->bxLoginAsAdmin();

        $oMenu = $this->menu(['button_style' => BxDolMenu::BUTTON_STYLE_GLASS, 'button_size' => BxDolMenu::BUTTON_SIZE_LARGE], true);
        $aApi = $oMenu->getCodeAPI();

        $this->assertSame('glass', $aApi['button_style']);
        $this->assertSame('large', $aApi['button_size']);
        $this->assertStringNotContainsString('bx-menu-btn-', json_encode($aApi['items']), 'The apps read the fields, not the site\'s classes.');

        $aApiAuto = $this->menu([], true)->getCodeAPI();
        $this->assertSame('', $aApiAuto['button_style']);
        $this->assertSame('', $aApiAuto['button_size']);
    }
}
