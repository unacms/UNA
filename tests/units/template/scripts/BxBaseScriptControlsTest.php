<?php

/**
 * Controls that only run a script (a popup, a toggle, an action) are drawn as javascript: links. They carry
 * role="button": assistive technology hears a button, and crawlers don't count them as links nobody can follow
 * (Lighthouse "Links are not crawlable"). inc/js/functions.js gives them the Space key of a button.
 */
class BxBaseScriptControlsTest extends BxDolTestCase
{
    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function menuCode(array $aItems): string
    {
        $aItem = ['active' => 1, 'visible_for_levels' => 2147483647, 'target' => '', 'onclick' => '', 'icon' => '', 'addon' => '', 'submenu_object' => ''];
        foreach($aItems as $i => $aItemOwn)
            $aItems[$i] = array_merge($aItem, ['id' => $aItemOwn['name']], $aItemOwn);

        $oMenu = new BxTemplMenu([
            'object' => 'bx_script_controls_test_menu',
            'template' => 'menu_vertical.html',
            'menu_items' => $aItems,
        ], BxDolTemplate::getInstance());

        return $oMenu->getCode();
    }

    /**
     * The opening <a> tag of the link with the given text.
     */
    private function anchor(string $sHtml, string $sText): string
    {
        $this->assertSame(1, preg_match('/<a\s[^>]*>(?:(?!<\/a>).)*' . preg_quote($sText, '/') . '/s', $sHtml, $aMatches), 'The menu draws "' . $sText . '": ' . $sHtml);
        return substr($aMatches[0], 0, strpos($aMatches[0], '>') + 1);
    }

    public function testMenuItemThatRunsAScriptIsAButton(): void
    {
        $sCode = $this->menuCode([
            ['name' => 'latest', 'title' => 'Latest', 'link' => 'page.php?i=latest'],
            ['name' => 'share', 'title' => 'Share', 'link' => 'javascript:void(0)', 'onclick' => 'bx_menu_popup(this)'],
        ]);

        $this->assertStringContainsString('role="button"', $this->anchor($sCode, 'Share'));
        $this->assertStringNotContainsString('role=', $this->anchor($sCode, 'Latest'), 'A link to a page stays a link.');
    }

    public function testMenuItemKeepsARoleOfItsOwn(): void
    {
        $sCode = $this->menuCode([
            ['name' => 'pick', 'title' => 'Pick', 'link' => 'javascript:void(0)', 'attrs_add' => 'role="menuitemradio"'],
        ]);

        $sAnchor = $this->anchor($sCode, 'Pick');
        $this->assertSame(1, substr_count($sAnchor, 'role='), $sAnchor);
        $this->assertStringContainsString('role="menuitemradio"', $sAnchor);
    }

    public function testStudioMenusLeaveItToTheirButtons(): void
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_studio_account_popup');
        if(!$oMenu)
            $this->markTestSkipped('The Studio account popup menu is not installed.');

        $sAttrs = $this->callProtected($oMenu, '_getMenuAttrs', [['name' => 'edit', 'title' => 'Edit', 'link' => 'javascript:void(0)']]);
        $this->assertStringNotContainsString('role="button"', $sAttrs);
    }

    public function testParseLinkMarksOnlyScriptLinks(): void
    {
        $oTemplate = BxDolTemplate::getInstance();

        $this->assertStringContainsString(' role="button"', $oTemplate->parseLink('javascript:void(0)', 'Who liked', ['onclick' => 'oVote.toggleByPopup(this)']));
        $this->assertStringNotContainsString('role=', $oTemplate->parseLink(BX_DOL_URL_ROOT . 'page.php?i=home', 'Home'));

        $sOwnRole = $oTemplate->parseLink('javascript:void(0)', 'Tab', ['role' => 'tab']);
        $this->assertSame(1, substr_count($sOwnRole, 'role='), $sOwnRole);
        $this->assertStringContainsString('role="tab"', $sOwnRole);
    }

    public function testDesignBoxButtonThatRunsAScriptIsAButton(): void
    {
        $sCode = BxTemplFunctions::getInstance()->designBoxMenu('', [
            ['icon' => 'plus', 'title' => 'Add', 'onclick' => 'oBlock.add(this)'],
            ['icon' => 'link', 'title' => 'Open', 'href' => BX_DOL_URL_ROOT . 'page.php?i=home'],
        ]);

        $this->assertStringContainsString('role="button"', $this->anchor($sCode, 'Add'));
        $this->assertStringNotContainsString('role=', $this->anchor($sCode, 'Open'));
    }

    public function testShowMoreLessToggleIsAButton(): void
    {
        $oMenu = new BxTemplMenu(['object' => 'bx_script_controls_test_menu', 'template' => 'menu_vertical.html', 'menu_items' => []], BxDolTemplate::getInstance());

        $aItems = [];
        for($i = 1; $i <= 6; $i++)
            $aItems[] = ['name' => 'item' . $i, 'title' => 'Item ' . $i, 'link' => 'page.php?i=item' . $i, 'class_add' => '', 'attrs' => ''];

        $aToggles = array_filter($this->callProtected($oMenu, '_addMenuItemsMoreLess', [$aItems, 3]), function($aItem) {
            return in_array($aItem['name'], ['show-more', 'show-less']);
        });

        $this->assertCount(2, $aToggles, 'More items than the minimum add the "show more" and "show less" toggles.');
        foreach($aToggles as $aToggle)
            $this->assertStringContainsString('role="button"', $aToggle['attrs'], $aToggle['name']);
    }

    public function testUnitMetaButtonThatRunsAScriptIsAButton(): void
    {
        // Snippet meta menus draw their action buttons (befriend, recommend, join) through this method.
        $oMenu = (new ReflectionClass('BxTemplMenuUnitMeta'))->newInstanceWithoutConstructor();
        foreach(['_oTemplate' => BxDolTemplate::getInstance(), '_sStylePrefix' => 'sys-meta'] as $sProperty => $mixedValue) {
            $oProperty = new ReflectionProperty($oMenu, $sProperty);
            $oProperty->setValue($oMenu, $mixedValue);
        }

        $sScript = $oMenu->getUnitMetaItemButtonOrLink('button', 'Add friend', ['onclick' => 'bx_conn_action(this)']);
        $this->assertStringContainsString('role="button"', $sScript);

        $sLink = $oMenu->getUnitMetaItemButtonOrLink('button', 'Profile', ['href' => BX_DOL_URL_ROOT . 'page.php?i=home']);
        $this->assertStringNotContainsString('role=', $sLink, 'A button that opens a page stays a link.');

        $sOwnRole = $oMenu->getUnitMetaItemButtonOrLink('button', 'Tab', ['role' => 'tab']);
        $this->assertSame(1, substr_count($sOwnRole, 'role='), $sOwnRole);
    }

    /**
     * Hand-written templates with a script-only link: each one carries the role itself.
     */
    public function testTemplateScriptLinksAreButtons(): void
    {
        $sRoot = __DIR__ . '/../../../../';
        foreach(['modules/boonex/artificer/template/color_scheme_switcher.html', 'modules/boonex/invites/template/block_invite.html'] as $sFile) {
            $sHtml = file_get_contents($sRoot . $sFile);
            $this->assertNotFalse($sHtml, $sFile);

            preg_match_all('/<a\s[^>]*href="javascript:[^>]*>/', $sHtml, $aMatches);
            $this->assertNotEmpty($aMatches[0], $sFile . ' has script links.');
            foreach($aMatches[0] as $sAnchor)
                $this->assertStringContainsString('role="button"', $sAnchor, $sFile);
        }
    }

    public function testCommentCounterIsAButtonOnlyWhenItRunsAScript(): void
    {
        $aSystems = BxDolCmts::getSystems();
        if(!$aSystems)
            $this->markTestSkipped('No comment system is installed.');

        $oCmts = BxDolCmts::getObjectInstance(array_key_first($aSystems), 1);
        if(!$oCmts)
            $this->markTestSkipped('The comment system has no object.');

        $sScript = $oCmts->getCounter(['show_counter_empty' => true, 'show_script' => false, 'overwrite_counter_link_href' => 'javascript:void(0)', 'overwrite_counter_link_onclick' => 'oView.commentItem(this)']);
        $this->assertMatchesRegularExpression('/<a class="sys-ac-link[^"]*" href="javascript:void\(0\)" role="button" onclick=/', $sScript);

        $sLink = $oCmts->getCounter(['show_counter_empty' => true, 'show_script' => false]);
        $this->assertMatchesRegularExpression('/<a class="sys-ac-link[^"]*" href="(?!javascript:)[^"]*"/', $sLink);
        $this->assertStringNotContainsString('role="button"', $sLink, 'A counter that opens the comments page stays a link.');
    }
}
