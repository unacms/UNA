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

        $this->assertStringNotContainsString('sys_account_join', $sSql, 'Installing Invitations doesn\'t change who can join.');
        $this->assertStringNotContainsString('bx_invites_enable_reg_by_inv', $sSql, '"Who can join" in Studio > Settings > Account decides it.');
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
}
