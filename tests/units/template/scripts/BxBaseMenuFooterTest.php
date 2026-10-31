<?php

/**
 * The footer menu (sys_footer, BxBaseMenuFooter): the Theme and Sounds switchers with their menus, the tools on the
 * right, and text items such as the copyright notice.
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

    private function footerItems(): array
    {
        $aItems = [];
        foreach ($this->footer()->getMenuItems() as $aItem)
            $aItems[$aItem['name']] = $aItem;

        return $aItems;
    }

    public function testCopyrightNamesTheSiteOwner(): void
    {
        $sYear = date('Y');

        $this->withOption('site_title', 'Acme Inc.', function () use ($sYear) {
            $oFooter = $this->footer();
            $this->assertSame(_t('_sys_txt_copyright_full', $sYear, 'Acme Inc'), $oFooter->getCopyright(), 'The full form ends the name with its own full stop, not a second one.');
            $this->assertSame(_t('_sys_txt_copyright_short', $sYear, 'Acme Inc.'), $oFooter->getCopyright(true));
        });

        $this->withOption('site_title', 'Acme', function () use ($sYear) {
            $sFull = $this->footer()->getCopyright();
            $this->assertStringContainsString($sYear, $sFull);
            $this->assertStringContainsString('Acme', $sFull);
            $this->assertStringNotContainsString('Acme..', $sFull);
        });
    }

    public function testCopyrightIsTextNotALink(): void
    {
        $aItems = $this->footerItems();
        $this->assertArrayHasKey('copyright', $aItems, 'The footer shows the copyright notice.');

        $aCopyright = $aItems['copyright'];
        $this->assertTrue($aCopyright['bx_if:text']['condition']);
        $this->assertFalse($aCopyright['bx_if:link']['condition'], 'Nothing to click: menu_footer.html draws no link for it.');
        $this->assertSame(bx_process_output($this->footer()->getCopyright()), $aCopyright['bx_if:text']['content']['text']);
        $this->assertSame(bx_process_output($this->footer()->getCopyright(true)), $aCopyright['bx_if:text']['content']['text_short'], 'Phones get the short form.');

        $this->assertFalse($aItems['about']['bx_if:text']['condition']);
        $this->assertTrue($aItems['about']['bx_if:link']['condition']);
        $this->assertSame($aItems['about']['link'], $aItems['about']['bx_if:link']['content']['link'], 'A link keeps its own markers inside bx_if:link.');
    }

    public function testAnyItemWithoutALinkIsText(): void
    {
        $oFooter = $this->footer();
        $aLine = ['name' => 'custom_line', 'title' => '_sys_menu_item_title_copyright', 'link' => '', 'onclick' => ''];

        $this->assertTrue($this->callProtected($oFooter, '_isTextItem', [$aLine]));
        $this->assertSame(['text' => _t('_sys_menu_item_title_copyright'), 'text_short' => _t('_sys_menu_item_title_copyright')], $this->callProtected($oFooter, '_getItemText', [$aLine]), 'An admin\'s own line shows its title.');
        $this->assertFalse($this->callProtected($oFooter, '_isTextItem', [['link' => 'page.php?i=about', 'onclick' => '']]));
        $this->assertFalse($this->callProtected($oFooter, '_isTextItem', [['link' => '', 'onclick' => 'bx_menu_popup(1);']]));
    }

    public function testTextItemsReachTheAppsAsPlainText(): void
    {
        $oFooter = $this->footer();
        $aItem = $this->callProtected($oFooter, '_getMenuItemAPI', [['id' => 1, 'name' => 'copyright', 'title' => '_sys_menu_item_title_copyright', 'link' => '', 'onclick' => '']]);

        $this->assertSame('text', $aItem['display_type']);
        $this->assertSame('', $aItem['link']);
        $this->assertSame(html_entity_decode(strip_tags($oFooter->getCopyright()), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $aItem['text']);
        $this->assertSame(html_entity_decode(strip_tags($oFooter->getCopyright(true)), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $aItem['text_short']);
        $this->assertStringNotContainsString('&', $aItem['text'], 'The apps get plain text, not HTML.');
    }

    public function testOldCopyrightRowIsTextToo(): void
    {
        // A site that hasn't run the migration still has the link to the popup; the apps get the notice as text.
        $oFooter = $this->footer();
        $aOld = ['id' => 1, 'name' => 'copyright', 'title' => '_sys_menu_item_title_copyright', 'link' => 'javascript:void(0)', 'onclick' => 'on_copyright_click()'];

        $this->assertTrue($this->callProtected($oFooter, '_isTextItem', [$aOld]));

        $aItem = $this->callProtected($oFooter, '_getMenuItemAPI', [$aOld]);
        $this->assertSame('text', $aItem['display_type']);
        $this->assertSame('', $aItem['link']);
        $this->assertSame(html_entity_decode(strip_tags($oFooter->getCopyright()), ENT_QUOTES | ENT_HTML5, 'UTF-8'), $aItem['text']);

        $this->assertFalse($this->callProtected($oFooter, '_isTextItem', [['name' => 'about', 'link' => 'javascript:void(0)', 'onclick' => 'on_copyright_click()']]), 'Only the Copyright item.');
    }

    public function testToolsStartOnTheRight(): void
    {
        $aStarts = [];
        foreach ($this->footerItems() as $sName => $aItem)
            if (strpos($aItem['class_add'] ?? '', 'bx-menu-footer-tools-start') !== false)
                $aStarts[] = $sName;

        $this->assertCount(1, $aStarts, 'One item pushes the tools to the right.');
        $this->assertContains($aStarts[0], BxBaseMenuFooter::TOOLS, 'It is the first tool, not a link or the copyright.');
    }

    public function testThePageYoureOnIsMarkedCurrent(): void
    {
        $oSelModule = new ReflectionProperty(BxDolMenu::class, 'SEL_MODULE');
        $oSelName = new ReflectionProperty(BxDolMenu::class, 'SEL_NAME');
        $aPrior = [$oSelModule->getValue(), $oSelName->getValue()];

        BxDolMenu::setSelectedGlobal('system', 'terms');
        try {
            $aItems = $this->footerItems();
        }
        finally {
            BxDolMenu::setSelectedGlobal($aPrior[0], $aPrior[1]);
        }

        $this->assertArrayHasKey('terms', $aItems, 'The footer has the Terms item.');
        $this->assertStringContainsString('aria-current="page"', $aItems['terms']['attrs']);
        $this->assertStringNotContainsString('aria-current', $aItems['about']['attrs'] ?? '');
    }

    public function testEachLinkHasOneTitle(): void
    {
        // The item's attributes carry its title (BxBaseMenu::_getMenuAttrs); the templates must not add another one.
        foreach (['template/menu_footer.html', 'modules/boonex/artificer/data/template/system/menu_footer.html'] as $sFile)
            $this->assertStringNotContainsString('title="__title_attr__"', (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile);

        $aItems = $this->footerItems();
        $this->assertSame(1, substr_count($aItems['about']['attrs'], 'title='));

        $sPoweredBy = bx_html_attribute(_t('_sys_txt_powered_by_una'));
        $this->assertStringNotContainsString('title=', $aItems['powered_by']['attrs'], 'The badge shows its name itself, not as the browser\'s tooltip.');
        $this->assertStringContainsString('aria-label="' . $sPoweredBy . '"', $aItems['powered_by']['attrs'], 'The logo is named "Powered by UNA".');
    }

    public function testPoweredByBadgeShowsItsNameOnHover(): void
    {
        foreach (['template/menu_footer.html', 'modules/boonex/artificer/data/template/system/menu_footer.html'] as $sFile)
            $this->assertMatchesRegularExpression('/<bx_if:link>.*<bx_if:tooltip>.*__tooltip__.*<\/bx_if:tooltip>.*<\/bx_if:link>/s', (string)file_get_contents(BX_DIRECTORY_PATH_ROOT . $sFile), $sFile . ' shows the name inside the link.');

        $aItems = $this->footerItems();
        $aTooltip = $aItems['powered_by']['bx_if:link']['content']['bx_if:tooltip'];
        $this->assertTrue($aTooltip['condition']);
        $this->assertSame(bx_process_output(_t('_sys_txt_powered_by_una')), $aTooltip['content']['tooltip'], 'Its name comes from a language string, so it is translated.');
        $this->assertNotSame('_sys_txt_powered_by_una', $aTooltip['content']['tooltip'], 'The language string is installed.');

        $this->assertFalse($aItems['about']['bx_if:link']['content']['bx_if:tooltip']['condition'], 'Other links have no tooltip.');
    }

    public function testPoweredByBadgeReachesTheAppsWhileOnInUna(): void
    {
        $oFooter = $this->footer();
        $aRaw = null;
        foreach ($this->callProtected($oFooter, 'getMenuItemsRaw') as $aItem)
            if ($aItem['name'] == 'powered_by')
                $aRaw = $aItem;
        $this->assertNotNull($aRaw, 'The footer has the Powered by badge.');

        $aItem = $this->callProtected($oFooter, '_getMenuItemAPI', [$aRaw]);
        $this->assertStringStartsWith('<svg', $aItem['icon'], 'The apps draw the item\'s own badge.');
        $this->assertSame(_t('_sys_txt_powered_by_una'), $aItem['title_attr'], 'And name it, as the site does.');

        $oApi = new ReflectionProperty(BxDolMenu::class, '_bIsApi');
        $bPrior = $oApi->getValue($oFooter);
        $oApi->setValue($oFooter, true);
        try {
            $this->assertTrue($this->callProtected($oFooter, '_isVisible', [array_merge($aRaw, ['active' => 1])]));
            $this->assertFalse($this->callProtected($oFooter, '_isVisible', [array_merge($aRaw, ['active' => 0])]), 'Switched off in Navigation, it is gone from the apps too.');

            // API items have no `attrs`: a warning here would print before the JSON and break the apps' footer.
            set_error_handler(function ($iErrno, $sError) {
                throw new ErrorException($sError, 0, $iErrno);
            }, E_WARNING | E_NOTICE | E_DEPRECATED);
            try {
                $aApiItems = $oFooter->getMenuItems();
            }
            finally {
                restore_error_handler();
            }
            foreach ($aApiItems as $aApiItem)
                $this->assertArrayNotHasKey('bx_if:tooltip', $aApiItem, 'The tooltip is the site\'s; the apps show their own.');
        }
        finally {
            $oApi->setValue($oFooter, $bPrior);
        }
    }

    public function testLanguageItemShowsTheCodeAndOpensAMenuAbove(): void
    {
        $aItems = $this->footerItems();
        if (!isset($aItems['switch_language']))
            $this->markTestSkipped('The language switcher shows only with two or more languages installed.');

        $sLanguage = BxDolLanguages::getInstance()->getCurrentLangName();
        $aLanguages = BxDolLanguagesQuery::getInstance()->getLanguages(false, true);
        $aItem = $aItems['switch_language'];

        $this->assertStringContainsString('>' . $sLanguage . '</span>', $aItem['bx_if:title']['content']['title'], 'The code, as in the apps ("EN" by CSS).');
        $sLabel = bx_html_attribute(_t('_sys_menu_item_title_switch_language_current', $aLanguages[$sLanguage]));
        $this->assertStringContainsString('aria-label="' . $sLabel . '"', $aItem['attrs']);
        $this->assertSame(1, substr_count($aItem['attrs'], 'aria-label='), 'One name.');
        $this->assertStringContainsString('aria-haspopup="menu"', $aItem['attrs']);
    }

    public function testLanguageMenuMarksTheLanguageInUse(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_switch_language_inline');
        $aItems = $oMenu->getMenuItems();
        if (count($aItems) < 2)
            $this->markTestSkipped('Needs two or more languages installed.');

        $sCurrent = 'lang-' . BxDolLanguages::getInstance()->getCurrentLangName();
        foreach ($aItems as $aItem) {
            $bCurrent = $aItem['name'] == $sCurrent;
            $this->assertSame($bCurrent, strpos($aItem['class_add'] ?? '', 'bx-menu-tab-active') !== false, $aItem['name']);
            $this->assertSame($bCurrent, strpos($aItem['attrs'] ?? '', 'aria-current="true"') !== false, $aItem['name']);
        }
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
