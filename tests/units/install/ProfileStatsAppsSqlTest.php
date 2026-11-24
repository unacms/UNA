<?php

/**
 * The member's own menu (Profile stats, `sys_profile_stats`) lists the same items on the site and in the apps: an
 * item a module installs on for the site (`active`, its enable.sql) is on for the apps too (`active_api`, its
 * enable-app.sql), and one off on the site is off in the apps. Read from the install SQL itself.
 */
class ProfileStatsAppsSqlTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../';

    /**
     * Items that stay off in the apps, with the reason: the apps can't open their page.
     * - bx_convos: a Convos folder (`modules/?r=convos/...`) is no page; the apps have Messenger.
     * - bx_market, bx_jobs: the page the item opens is not on for the apps.
     * - the rest: the module has no enable-app.sql, so none of its pages is in the apps.
     */
    private const SITE_ONLY = [
        'bx_convos' => ['profile-stats-unread-messages'],
        'bx_market' => ['profile-stats-my-market'],
        'bx_jobs' => ['profile-stats-my-jobs'],
    ];

    private static function read(string $sPath): string
    {
        $s = file_get_contents($sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r", '', $s);
    }

    /** The module's profile stats items with their `active` value, from its enable.sql. */
    private static function siteItems(string $sSql): array
    {
        // ('sys_profile_stats', module, name, ..., active, copyable, order): the columns between differ by module
        preg_match_all("/^\\('sys_profile_stats', '([^']+)', '([^']+)',.*, ([01]), ([01]), [^,]+\\)[,;]$/m", $sSql, $aMatches, PREG_SET_ORDER);

        $aResult = [];
        foreach ($aMatches as $a)
            $aResult[$a[2]] = (int)$a[3];
        return $aResult;
    }

    private static function appItems(string $sSql): array
    {
        preg_match_all("/SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='[^']+' AND `name`='([^']+)';/", $sSql, $aMatches);
        return $aMatches[1];
    }

    public function testModulesItemsAreTheSameOnTheSiteAndInTheApps(): void
    {
        $iChecked = 0;
        foreach (glob(self::ROOT . 'modules/boonex/*/install/sql/enable.sql') as $sEnable) {
            $aSite = self::siteItems(self::read($sEnable));
            if (!$aSite)
                continue;

            $sDir = dirname($sEnable);
            $sApp = $sDir . '/enable-app.sql';
            $aApp = file_exists($sApp) ? self::appItems(self::read($sApp)) : [];
            if (!file_exists($sApp)) {
                $this->assertSame([], $aApp);
                continue;
            }

            preg_match("/^\\('sys_profile_stats', '([^']+)'/m", self::read($sEnable), $m);
            $sModule = $m[1];
            foreach ($aSite as $sName => $iActive) {
                $bSiteOnly = in_array($sName, self::SITE_ONLY[$sModule] ?? [], true);
                $bExpected = $iActive === 1 && !$bSiteOnly;
                $this->assertSame($bExpected, in_array($sName, $aApp, true), $sModule . ': ' . $sName . ($bExpected ? ' is on for the site, so on for the apps' : ' is off for the site, so off for the apps'));
                $iChecked++;
            }
        }

        $this->assertGreaterThan(20, $iChecked);
    }

    public function testSystemItemsAreOnInTheApps(): void
    {
        $sApp = self::read(self::ROOT . 'modules/system/install/sql/enable-app-menus.sql');
        foreach (['profile-stats-profile', 'friend-suggestions'] as $sName)
            $this->assertStringContainsString("SET `active_api`=1 WHERE `set_name`='sys_profile_stats' AND `module`='system' AND `name`='" . $sName . "';", $sApp);
    }

    public function testMigrationsChangeOnlyTheShippedValue(): void
    {
        $aFiles = [
            'modules/system/migrations/2026112460_profile_stats_connections_in_apps.sql' => '`active_api` = 0;',
            'modules/boonex/persons/migrations/2026112460_profile_stats_as_on_site.sql' => '`active_api` = 1;',
            'modules/boonex/organizations/migrations/2026112460_profile_stats_as_on_site.sql' => '`active_api` = 1;',
            'modules/boonex/courses/migrations/2026112460_profile_stats_courses_in_apps.sql' => '`active_api` = 0;',
        ];
        foreach ($aFiles as $sFile => $sOld) {
            $sSql = self::read(self::ROOT . $sFile);
            $this->assertStringContainsString("`set_name` = 'sys_profile_stats'", $sSql, $sFile);
            $this->assertStringEndsWith($sOld, trim($sSql), $sFile . ': an operator\'s own choice stays');
        }
    }
}
