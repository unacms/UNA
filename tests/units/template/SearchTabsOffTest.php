<?php

use PHPUnit\Framework\TestCase;

/**
 * One search window: a module's "Search" tab is off as installed (its page stays for projects that use it), and sites
 * that are installed get it off by their module's migration, only where the tab is still as installed.
 */
class SearchTabsOffTest extends TestCase
{
    public function testEveryModuleSearchTabIsOffAndHasItsMigration(): void
    {
        $sRoot = dirname(__DIR__, 3) . '/';
        $iFound = 0;
        foreach (glob($sRoot . 'modules/boonex/*/install/sql/enable.sql') as $sFile) {
            $sSql = file_get_contents($sFile);
            if (!preg_match_all("/^\('(bx_[a-z_]+_submenu)', ('bx_[a-z_]+'|@sName), '([a-z_-]+-search)'.*, (\d), \d, \d+\)[,;]?\r?$/m", $sSql, $aMatches, PREG_SET_ORDER))
                continue;

            $sModuleDir = dirname($sFile, 3);
            foreach ($aMatches as $a) {
                $iFound++;
                // the module of a file that names itself `@sName`
                if ($a[2] === '@sName' && preg_match("/SET @sName = '(bx_[a-z_]+)'/", $sSql, $aName))
                    $a[2] = $aName[1];
                else
                    $a[2] = trim($a[2], "'");
                $this->assertSame('0', $a[4], $sFile . ': ' . $a[3] . ' is off');

                $sApp = @file_get_contents($sModuleDir . '/install/sql/enable-app.sql');
                $this->assertStringNotContainsString("`name`='" . $a[3] . "'", (string)$sApp, $a[3] . ' is not turned on for the apps');

                $sMigration = @file_get_contents($sModuleDir . '/migrations/2026112595_search_tab_off.sql');
                $this->assertIsString($sMigration, $a[3] . ': migration');
                $this->assertStringContainsString("SET `active` = 0 WHERE `set_name` = '" . $a[1] . "' AND `module` = '" . $a[2] . "' AND `name` = '" . $a[3] . "' AND `active` = 1;", $sMigration);
                $this->assertStringContainsString("AND `active_api` = 1;", $sMigration);
            }
        }

        $this->assertGreaterThanOrEqual(20, $iFound, 'the modules\' Search tabs');
    }
}
