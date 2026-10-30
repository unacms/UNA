<?php

/**
 * The footer menu (sys_footer, BxBaseMenuFooter): the Theme and Sounds switchers with their menus, and the copyright
 * notice the apps show in a dialog.
 */
class BxBaseMenuFooterTest extends BxDolTestCase
{
    private function footer(): BxBaseMenuFooter
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_footer');
        $this->assertInstanceOf(BxBaseMenuFooter::class, $oMenu);

        return $oMenu;
    }

    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function withOption(string $sName, string $sValue, callable $fTest)
    {
        $sPrior = getParam($sName);
        setParam($sName, $sValue);
        try {
            return $fTest();
        }
        finally {
            setParam($sName, $sPrior);
        }
    }

    private function item(string $sName): array
    {
        return ['name' => $sName, 'title' => '', 'visible_for_levels' => 2147483647];
    }

    public function testCopyrightCarriesItsTextForTheApps(): void
    {
        $aData = $this->callProtected($this->footer(), '_getMenuCallbackDataAPI', [['name' => 'copyright', 'title' => '_sys_menu_item_title_copyright']]);

        $this->assertSame(_t('_sys_menu_item_title_copyright'), $aData['title']);
        $this->assertSame(html_entity_decode(strip_tags(_t('_copyright', date('Y'))), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $aData['text']);
        $this->assertStringContainsString(date('Y'), $aData['text'], 'The year is filled in, as on the site.');
        $this->assertStringNotContainsString('&copy;', $aData['text'], 'The apps get plain text, not HTML.');
    }

    public function testThePageYoureOnIsMarkedCurrent(): void
    {
        $oSelModule = new ReflectionProperty(BxDolMenu::class, 'SEL_MODULE');
        $oSelName = new ReflectionProperty(BxDolMenu::class, 'SEL_NAME');
        $aPrior = [$oSelModule->getValue(), $oSelName->getValue()];

        BxDolMenu::setSelectedGlobal('system', 'terms');
        try {
            $aItems = [];
            foreach ($this->footer()->getMenuItems() as $aItem)
                $aItems[$aItem['name']] = $aItem;
        }
        finally {
            BxDolMenu::setSelectedGlobal($aPrior[0], $aPrior[1]);
        }

        $this->assertArrayHasKey('terms', $aItems, 'The footer has the Terms item.');
        $this->assertStringContainsString('aria-current="page"', $aItems['terms']['attrs']);
        $this->assertStringNotContainsString('aria-current', $aItems['about']['attrs'] ?? '');
    }

    public function testOtherItemsSendNoCallbackData(): void
    {
        $this->assertSame([], $this->callProtected($this->footer(), '_getMenuCallbackDataAPI', [$this->item('about')]));
    }

    public function testSoundsItemShowsWhereSoundsPlayOnTheSite(): void
    {
        $oFooter = $this->footer();

        $this->assertTrue($this->withOption('sys_sounds_platforms', 'site,ios', fn() => $this->callProtected($oFooter, '_isVisible', [$this->item('sounds')])));
        $this->assertFalse($this->withOption('sys_sounds_platforms', 'studio,ios,android', fn() => $this->callProtected($oFooter, '_isVisible', [$this->item('sounds')])));
    }

    public function testSoundsMenuOffersEachLevel(): void
    {
        $sMenu = $this->footer()->getSoundsMenu();

        $this->assertStringContainsString('id="' . BxBaseMenuFooter::POPUP_SOUNDS . '"', $sMenu);
        foreach (BxDolSounds::LEVELS as $sLevel) {
            $this->assertStringContainsString('data-bx-sounds-option="' . $sLevel . '"', $sMenu, 'bx_sound_mark_switches marks the visitor\'s level by this attribute.');
            $this->assertStringContainsString("bx_sound_set_level('" . $sLevel . "')", $sMenu);
            $this->assertStringContainsString(_t('_sys_txt_sounds_level_' . $sLevel), $sMenu);
        }
    }

    public function testThemeItemShowsOnlyWithATemplateColorScheme(): void
    {
        $oFunctions = BxTemplFunctions::getInstance();
        $bSwitchable = $oFunctions->isColorSchemeSwitchable();

        $this->assertSame($bSwitchable, $this->callProtected($this->footer(), '_isVisible', [$this->item('color_scheme')]));

        $sMenu = $oFunctions->getColorSchemeMenu('bx-test-color-scheme');
        if (!$bSwitchable) {
            $this->assertSame('', $sMenu);
            return;
        }

        $this->assertStringContainsString('id="bx-test-color-scheme"', $sMenu);
        foreach ([0, 1, 2] as $iCode)
            $this->assertStringContainsString('data-bx-color-scheme="' . $iCode . '"', $sMenu, 'Each option carries the code oBxArtificerUtils.setColorScheme takes.');
    }

    public function testCoreTemplateHasNoColorScheme(): void
    {
        $oCore = (new ReflectionClass(BxBaseFunctions::class))->newInstanceWithoutConstructor();

        $this->assertFalse($oCore->isColorSchemeSwitchable());
        $this->assertSame('', $oCore->getColorSchemeMenu('bx-test-color-scheme'));
    }
}
