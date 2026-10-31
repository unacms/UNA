<?php

/**
 * The '[Main Menu]' button (name 'main-menu') is an item of the member toolbar, on the right side of the header
 * next to the account, notifications and add content buttons. It used to be the only item of the site toolbar
 * on the left of the logo.
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

    private function getMemberToolbar(): BxTemplMenuToolbar
    {
        $aObject = BxDolMenuQuery::getMenuObject('sys_toolbar_member');
        if (empty($aObject))
            $this->markTestSkipped('The member toolbar menu is not installed.');

        return new BxTemplMenuToolbar($aObject, BxDolTemplate::getInstance());
    }

    private function getMemberToolbarRows(BxTemplMenuToolbar $oMenu): array
    {
        $oQuery = new ReflectionProperty($oMenu, '_oQuery');
        $aRows = [];
        foreach ($oQuery->getValue($oMenu)->getMenuItems() as $aRow)
            $aRows[$aRow['name']] = $aRow;

        if (!isset($aRows['main-menu']))
            $this->markTestSkipped("This site has no '[Main Menu]' item in the member toolbar (the migration is not applied).");

        return $aRows;
    }

    private static function isArtificer(BxTemplMenuToolbar $oMenu): bool
    {
        return strpos((new ReflectionClass($oMenu))->getFileName(), '/artificer/') !== false;
    }

    public function testFreshInstallPutsTheMainMenuInTheMemberToolbar(): void
    {
        $sSql = self::readFile('install/sql/system.sql');

        $this->assertDoesNotMatchRegularExpression("/\\('sys_toolbar_site', 'system', 'main-menu',/", $sSql, 'The site toolbar no longer has it.');

        $bFound = preg_match("/\\('sys_toolbar_member', 'system', 'main-menu', '_sys_menu_item_title_system_main_menu', [^\\n]*?, (\\d+), (\\d+), (\\d+), (\\d+), (\\d+)\\)[,;]\\n/", $sSql, $aMatch);
        $this->assertSame(1, $bFound, 'system.sql adds it to the member toolbar.');
        [, $iVisibleFor, , $iActive, , $iOrder] = array_map('intval', $aMatch);
        $this->assertSame(2147483647, $iVisibleFor, 'Guests see it too.');
        $this->assertSame(1, $iActive);
        $this->assertSame(9999, $iOrder, 'It stays the last button, also after modules add their own.');

        $sAppSql = self::readFile('modules/system/install/sql/enable-app-menus.sql');
        $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_toolbar_member' AND `module`='system' AND `name`='main-menu';", $sAppSql);
        $this->assertStringNotContainsString("`set_name`='sys_toolbar_site' AND `module`='system' AND `name`='main-menu'", $sAppSql);
    }

    public function testMainMenuOpensTheSiteSidebar(): void
    {
        $oMenu = $this->getMemberToolbar();
        if (!self::isArtificer($oMenu))
            $this->markTestSkipped('The site sidebar belongs to the Artificer template.');

        $aRows = $this->getMemberToolbarRows($oMenu);
        $a = $this->callProtected($oMenu, '_getMenuItem', [$aRows['main-menu']]);

        $this->assertIsArray($a);
        $this->assertStringContainsString('bx-sidebar-site-trigger', $a['class_add_a'], 'The sidebar script binds to this class.');
        $this->assertFalse($a['bx_if:onclick']['condition'], 'No sliding menu opens on top of the sidebar.');
        $this->assertContains('lg:hidden', explode(' ', $a['class_add']), 'Wide screens show the main menu inline and have no sidebar.');
        $this->assertStringContainsString('aria-controls="bx-sidebar-site"', $a['attrs']);
        $this->assertStringContainsString('aria-expanded="false"', $a['attrs']);
    }

    public function testApiReadsTheToolbarWithoutWarnings(): void
    {
        $mixedApiBackup = $_GET['api'] ?? null;
        $_GET['api'] = 1;

        $aWarnings = [];
        set_error_handler(function ($iErrno, $sError, $sFile, $iLine) use (&$aWarnings) {
            $aWarnings[] = $sError . ' in ' . $sFile . ':' . $iLine;
            return true;
        }, E_WARNING | E_NOTICE);

        try {
            //--- Show every item, as a signed-in member sees 'add-content', 'account' and the rest.
            $aObject = BxDolMenuQuery::getMenuObject('sys_toolbar_member');
            if (empty($aObject))
                $this->markTestSkipped('The member toolbar menu is not installed.');

            $oMenu = new class($aObject, BxDolTemplate::getInstance()) extends BxTemplMenuToolbar {
                protected function _isVisible($a)
                {
                    return true;
                }
            };

            $aItems = [];
            foreach ($this->getMemberToolbarRows($oMenu) as $sName => $aRow)
                if (($a = $this->callProtected($oMenu, '_getMenuItem', [$aRow])) !== false)
                    $aItems[$sName] = $a;
        }
        finally {
            restore_error_handler();
            if ($mixedApiBackup === null)
                unset($_GET['api']);
            else
                $_GET['api'] = $mixedApiBackup;
        }

        $this->assertSame([], $aWarnings, 'A PHP warning printed into api.php output breaks the JSON NEO reads.');
        $this->assertArrayHasKey('main-menu', $aItems);
        $this->assertArrayHasKey('add-content', $aItems, 'Members-only items are rendered too.');
        $this->assertArrayNotHasKey('class_add', $aItems['main-menu'], 'HTML-only classes stay out of the API item.');
    }
}
