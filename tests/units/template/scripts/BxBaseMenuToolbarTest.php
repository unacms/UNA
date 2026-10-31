<?php

/**
 * The '[Main Menu]' button (name 'main-menu') is the item of the site toolbar (sys_toolbar_site), the menu Studio has
 * always had for it. The header renders that menu in its own wrapper on the right, after the member toolbar, so a
 * site keeps whatever it set up in that menu. It is not an item of the member toolbar.
 */
class BxBaseMenuToolbarTest extends BxDolTestCase
{
    private static function readFile(string $sPath): string
    {
        $s = file_get_contents(__DIR__ . '/../../../../' . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return $s;
    }

    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function getToolbar(string $sObject): BxTemplMenuToolbar
    {
        $aObject = BxDolMenuQuery::getMenuObject($sObject);
        if (empty($aObject))
            $this->markTestSkipped("The '" . $sObject . "' menu is not installed.");

        return new BxTemplMenuToolbar($aObject, BxDolTemplate::getInstance());
    }

    private function getToolbarRows(BxTemplMenuToolbar $oMenu): array
    {
        $oQuery = new ReflectionProperty($oMenu, '_oQuery');
        $aRows = [];
        foreach ($oQuery->getValue($oMenu)->getMenuItems() as $aRow)
            $aRows[$aRow['name']] = $aRow;

        return $aRows;
    }

    private function getMainMenuRow(BxTemplMenuToolbar $oSiteToolbar): array
    {
        $aRows = $this->getToolbarRows($oSiteToolbar);
        if (!isset($aRows['main-menu']))
            $this->markTestSkipped("This site has no '[Main Menu]' item in the site toolbar (the migration is not applied).");

        return $aRows['main-menu'];
    }

    private static function isArtificer(BxTemplMenuToolbar $oMenu): bool
    {
        return strpos((new ReflectionClass($oMenu))->getFileName(), '/artificer/') !== false;
    }

    public function testFreshInstallPutsTheMainMenuInTheSiteToolbar(): void
    {
        $sSql = self::readFile('install/sql/system.sql');

        $this->assertStringNotContainsString("('sys_toolbar_member', 'system', 'main-menu',", $sSql, 'The member toolbar does not have it.');

        $bFound = preg_match("/\\('sys_toolbar_site', 'system', 'main-menu', '_sys_menu_item_title_system_main_menu', [^\\n]*?, (\\d+), (\\d+), (\\d+), (\\d+)\\)[,;]\\n/", $sSql, $aMatch);
        $this->assertSame(1, $bFound, 'system.sql adds it to the site toolbar.');
        [, $iVisibleFor, $iActive, , $iOrder] = array_map('intval', $aMatch);
        $this->assertSame(2147483647, $iVisibleFor, 'Guests see it too.');
        $this->assertSame(1, $iActive);
        $this->assertSame(1, $iOrder);

        $sAppSql = self::readFile('modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_toolbar_site' AND `module`='system' AND `name`='main-menu';", $sAppSql);
        $this->assertStringNotContainsString("`set_name`='sys_toolbar_member' AND `module`='system' AND `name`='main-menu'", $sAppSql);
    }

    public function testHeaderRendersTheSiteToolbarAfterTheMemberToolbar(): void
    {
        foreach (['template/_page_toolbar.html', 'modules/boonex/artificer/template/header.html'] as $sPath) {
            $sHtml = self::readFile($sPath);

            $this->assertSame(1, substr_count($sHtml, '<bx_menu:sys_toolbar_site />'), $sPath . ' renders the site toolbar once.');
            $iSite = strpos($sHtml, '<bx_menu:sys_toolbar_site />');
            $iMember = strpos($sHtml, '<bx_menu:sys_toolbar_member />');
            $this->assertNotFalse($iMember, $sPath);
            $this->assertGreaterThan(strpos($sHtml, 'id="bx-logo-container"'), $iSite, $sPath . ' puts it on the right, not left of the logo.');
            $this->assertGreaterThan($iMember, $iSite, $sPath . ' puts it after the member toolbar, outside of it.');
        }
    }

    public function testArtificerWrapsTheSiteToolbarOnTheRight(): void
    {
        $sHtml = self::readFile('modules/boonex/artificer/data/template/system/menu_toolbar_left.html');

        $this->assertStringContainsString('<bx_include_auto:menu_toolbar.html />', $sHtml);
        $this->assertMatchesRegularExpression('/<div id="bx-menu-toolbar-1-container" class="([^"]*)">/', $sHtml, 'Its own wrapper, with the id older sites style.');
        preg_match('/<div id="bx-menu-toolbar-1-container" class="([^"]*)">/', $sHtml, $aMatch);
        $aClasses = explode(' ', $aMatch[1]);
        $this->assertContains('lg:hidden', $aClasses, 'Wide screens show the main menu inline.');
        $this->assertContains('ltr:ml-2', $aClasses, 'The same 8px gap as between the toolbar buttons.');
        $this->assertContains('rtl:mr-2', $aClasses);
        $this->assertNotContains('ltr:mr-4', $aClasses, 'No gap towards a logo on its right.');

        $this->assertStringContainsString('ltr:mr-4', self::readFile('template/menu_toolbar_left.html'), 'Lucid, Decorous and Ocean still show it left of their logo.');
    }

    public function testMainMenuOpensTheSiteSidebar(): void
    {
        $oMenu = $this->getToolbar('sys_toolbar_site');
        if (!self::isArtificer($oMenu))
            $this->markTestSkipped('The site sidebar belongs to the Artificer template.');

        $a = $this->callProtected($oMenu, '_getMenuItem', [$this->getMainMenuRow($oMenu)]);

        $this->assertIsArray($a);
        $this->assertStringContainsString('bx-sidebar-site-trigger', $a['class_add_a'], 'The sidebar script binds to this class.');
        $this->assertFalse($a['bx_if:onclick']['condition'], 'No sliding menu opens on top of the sidebar.');
        $this->assertContains('lg:hidden', explode(' ', $a['class_add']), 'Wide screens show the main menu inline and have no sidebar.');
        $this->assertStringContainsString('aria-haspopup="dialog"', $a['attrs']);
        $this->assertStringContainsString('aria-controls="bx-sidebar-site"', $a['attrs']);
        $this->assertStringContainsString('aria-expanded="false"', $a['attrs']);
    }

    public function testMainMenuLeftInTheMemberToolbarStillWorks(): void
    {
        $oMemberToolbar = $this->getToolbar('sys_toolbar_member');
        if (!self::isArtificer($oMemberToolbar))
            $this->markTestSkipped('The site sidebar belongs to the Artificer template.');

        //--- A site installed while the button was a member toolbar item keeps a working button until it is moved back:
        //--- its own row where the migration is not applied, otherwise the site toolbar's row moved over.
        $aMemberRows = $this->getToolbarRows($oMemberToolbar);
        $aRow = $aMemberRows['main-menu'] ?? array_merge($this->getMainMenuRow($this->getToolbar('sys_toolbar_site')), ['set_name' => 'sys_toolbar_member', 'order' => 9999]);
        $a = $this->callProtected($oMemberToolbar, '_getMenuItem', [$aRow]);

        $this->assertIsArray($a);
        $this->assertStringContainsString('bx-sidebar-site-trigger', $a['class_add_a']);
        $this->assertStringContainsString('aria-controls="bx-sidebar-site"', $a['attrs']);
    }

    public function testApiReadsTheToolbarsWithoutWarnings(): void
    {
        $mixedApiBackup = $_GET['api'] ?? null;
        $_GET['api'] = 1;

        $aWarnings = [];
        set_error_handler(function ($iErrno, $sError, $sFile, $iLine) use (&$aWarnings) {
            $aWarnings[] = $sError . ' in ' . $sFile . ':' . $iLine;
            return true;
        }, E_WARNING | E_NOTICE);

        try {
            $aItems = [];
            foreach (['sys_toolbar_site', 'sys_toolbar_member'] as $sObject) {
                //--- Show every item, as a signed-in member sees 'add-content', 'account' and the rest.
                $aObject = BxDolMenuQuery::getMenuObject($sObject);
                if (empty($aObject))
                    $this->markTestSkipped("The '" . $sObject . "' menu is not installed.");

                $oMenu = new class($aObject, BxDolTemplate::getInstance()) extends BxTemplMenuToolbar {
                    protected function _isVisible($a)
                    {
                        return true;
                    }
                };

                foreach ($this->getToolbarRows($oMenu) as $sName => $aRow)
                    if (($a = $this->callProtected($oMenu, '_getMenuItem', [$aRow])) !== false)
                        $aItems[$sObject][$sName] = $a;
            }
        }
        finally {
            restore_error_handler();
            if ($mixedApiBackup === null)
                unset($_GET['api']);
            else
                $_GET['api'] = $mixedApiBackup;
        }

        $this->assertSame([], $aWarnings, 'A PHP warning printed into api.php output breaks the JSON NEO reads.');
        if (!isset($aItems['sys_toolbar_site']['main-menu']))
            $this->markTestSkipped("This site has no '[Main Menu]' item in the site toolbar (the migration is not applied).");

        $this->assertArrayHasKey('add-content', $aItems['sys_toolbar_member'], 'Members-only items are rendered too.');
        $this->assertArrayNotHasKey('class_add', $aItems['sys_toolbar_site']['main-menu'], 'HTML-only classes stay out of the API item.');
    }
}
