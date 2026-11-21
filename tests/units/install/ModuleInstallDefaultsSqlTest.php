<?php

/**
 * Installing a module must not take over a fresh site: Invitations leaves sign-up open, Font Awesome leaves the
 * site's icon set alone (Lucide is the default). Read from the modules' install SQL.
 */
class ModuleInstallDefaultsSqlTest extends \PHPUnit\Framework\TestCase
{
    private const ROOT = __DIR__ . '/../../../';

    private static function read(string $sPath): string
    {
        $s = file_get_contents(self::ROOT . $sPath);
        if ($s === false)
            self::fail($sPath . ' is not readable.');

        return str_replace("\r", '', $s);
    }

    public function testInvitationsLeaveSignUpOpen(): void
    {
        $sSql = self::read('modules/boonex/invites/install/sql/enable.sql');

        $this->assertMatchesRegularExpression("/^\\('bx_invites_enable_reg_by_inv', '', /m", $sSql, 'Sign-up by invitation only is off until the site turns it on.');
    }

    public function testFontAwesomeLeavesTheIconSetAlone(): void
    {
        $sEnable = self::read('modules/boonex/fontawesome/install/sql/enable.sql');
        $sDisable = self::read('modules/boonex/fontawesome/install/sql/disable.sql');

        $this->assertDoesNotMatchRegularExpression('/^\s*UPDATE[^;]*sys_iconset_default/mi', $sEnable, 'Enabling the module keeps the site\'s icon set.');

        preg_match_all('/^\s*UPDATE[^;]*sys_iconset_default[^;]*;/mi', $sDisable, $aMatches);
        $this->assertCount(1, $aMatches[0]);
        $this->assertStringContainsString("AND `value` = 'bx_fontawesome'", $aMatches[0][0], 'Disabling it changes the icon set only of a site that uses it.');
    }

    public function testMessengerVideoCallsWaitForAServer(): void
    {
        $sSql = self::read('modules/boonex/messenger/install/sql/enable.sql');

        $this->assertMatchesRegularExpression("/^\\('bx_messenger_jitsi_enable', '', /m", $sSql, 'Video calls are off on a new site.');
        $this->assertMatchesRegularExpression("/^\\('bx_messenger_jitsi_server', '', /m", $sSql, 'No public Jitsi server is preset.');
    }

    public function testEventsDatesMatchTheSite(): void
    {
        $sSql = self::read('modules/boonex/events/install/sql/enable.sql');

        $this->assertMatchesRegularExpression("/^\\('bx_events_time_format', 'g:i A', /m", $sSql);
        $this->assertMatchesRegularExpression("/^\\('bx_events_short_date_format', 'M j, Y', /m", $sSql);
        $this->assertMatchesRegularExpression("/^\\('bx_events_datetime_format', 'M j, Y g:i A', /m", $sSql);
    }

    public function testNoModulePointsAtTheRetiredHelpFeed(): void
    {
        foreach (glob(self::ROOT . 'modules/*/*/install/config.php') as $sFile)
            $this->assertStringNotContainsString('feed.una.io', (string)file_get_contents($sFile), $sFile);
    }
}
