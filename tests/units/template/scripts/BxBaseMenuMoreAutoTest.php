<?php

/**
 * Menus with a 'more-auto' item (BxBaseMenuMoreAuto) set themselves up in the browser with BxDolMenuMoreAuto.
 * The init code they print runs every time it is rendered, also when content loaded by htmx brings a menu that
 * was on the page before: the JS object skips an element it has already set up.
 */
class BxBaseMenuMoreAutoTest extends BxDolTestCase
{
    private function callProtected($oObject, string $sMethod, array $aArgs = [])
    {
        $oMethod = new ReflectionMethod($oObject, $sMethod);
        return $oMethod->invokeArgs($oObject, $aArgs);
    }

    private function getSiteMenu(): BxBaseMenuMoreAuto
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_site');
        if (!($oMenu instanceof BxBaseMenuMoreAuto) || !$oMenu->isMoreAuto())
            $this->markTestSkipped('The site menu has no active more-auto item.');

        return $oMenu;
    }

    /**
     * @return array [JS object name, JS class, decoded params]
     */
    private function parseInit(string $sCode): array
    {
        $bMatched = preg_match('/var (oMenuMoreAuto\w+) = new (\w+)\((\{.*\})\); \1\.init\(\);/s', $sCode, $aMatches);
        $this->assertSame(1, $bMatched, 'The init code creates the JS object and calls init(): ' . $sCode);

        $aParams = json_decode($aMatches[3], true);
        $this->assertIsArray($aParams);

        return [$aMatches[1], $aMatches[2], $aParams];
    }

    public function testInitCodeRunsEachTimeItIsRendered(): void
    {
        $oMenu = $this->getSiteMenu();

        $sCode = $this->callProtected($oMenu, '_getJsCodeMoreAuto');
        [$sJsObject] = $this->parseInit($sCode);

        $this->assertSame('oMenuMoreAutoSysSite', $sJsObject);
        $this->assertStringNotContainsString('if(!' . $sJsObject . ')', $sCode, 'A guard on the global would skip a menu that htmx brought in again.');
        $this->assertSame($sCode, $this->callProtected($oMenu, '_getJsCodeMoreAuto'), 'Rendering the menu again prints the same init code.');
    }

    public function testInitCodePassesTheMenuAndItsPopup(): void
    {
        $oMenu = $this->getSiteMenu();

        [, $sJsClass, $aParams] = $this->parseInit($this->callProtected($oMenu, '_getJsCodeMoreAuto'));

        $this->assertMatchesRegularExpression('/^Bx\w*MenuMoreAuto$/', $sJsClass);
        $this->assertSame('sys_site', $aParams['sObject']);
        $this->assertSame(['main' => 'sys-site', 'more_auto_popup' => 'sys-site-ma-popup'], $aParams['aHtmlIds']);
        $this->assertIsInt($aParams['iItemsStatic']);
        $this->assertContains($aParams['bItemsStaticOnly'], [0, 1]);
    }
}
