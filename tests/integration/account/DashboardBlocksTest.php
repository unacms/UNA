<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountTestCase.php';

/**
 * The member dashboard: "Your membership" (system/profile_membership_stats: the level and storage against the level's
 * limits, for the site and the apps) and "Create your profile" (system/create_profile_block: the profile types for an
 * account without a profile, left to "Get started" while the operators' checklist shows).
 *
 * The member is a throwaway account made without a profile and deleted afterwards.
 */
#[Group('integration')]
class DashboardBlocksTest extends BxDolAccountTestCase
{
    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_aGetBackup = $_GET;
    }

    protected function tearDown(): void
    {
        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolInformer']);
        // Menus keep the mode (site or API) they were made in.
        foreach (['sys_dashboard_account', 'sys_account_preferences', 'sys_profile_stats', 'sys_profile_stats_tiles'] as $sMenu)
            unset($GLOBALS['bxDolClasses']['BxDolMenu!' . $sMenu]);
        parent::tearDown();
    }

    public function testLayout(): void
    {
        $oDb = BxDolDb::getInstance();
        $aBlocks = $oDb->getAllWithKey("SELECT `id`, `cell_id`, `title`, `title_system`, `content`, `active`, `active_api` FROM `sys_pages_blocks` WHERE `object` = 'sys_dashboard' AND `module` = 'system'", 'id');
        $aByTitle = [];
        foreach ($aBlocks as $a)
            $aByTitle[$a['title_system'] ?: $a['title']] = $a;

        $this->assertSame(3, (int)$aByTitle['_sys_page_block_title_membership_stats']['cell_id'], '"Your membership" is in the right column.');
        $this->assertSame(1, (int)$aByTitle['_sys_page_block_title_membership_stats']['active_api'], 'The apps show it too.');

        foreach (['_sys_page_block_title_system_onboarding_operator' => 2, '_sys_page_block_title_system_create_profile' => 2, '_sys_page_block_title_system_dashboard_account' => 2] as $sTitle => $iCell) {
            $this->assertArrayHasKey($sTitle, $aByTitle);
            $this->assertSame($iCell, (int)$aByTitle[$sTitle]['cell_id'], $sTitle);
            $this->assertSame(1, (int)$aByTitle[$sTitle]['active'], $sTitle);
        }
        $this->assertSame(1, (int)$aByTitle['_sys_page_block_title_system_dashboard_account']['active_api'], 'The apps draw "Your account" too.');
        $this->assertSame(0, (int)$aByTitle['_sys_page_block_title_system_dashboard_profiles']['active'], 'The profile switcher is in "Your account".');
        $this->assertSame(0, (int)$aByTitle['_sys_page_block_title_dash_stats']['active_api'], 'The apps\' own stats block gives way to "Your account".');
        $this->assertNotSame('Membership Limits', _t('_sys_page_block_title_membership_stats'));
    }

    public function testMembershipForTheApps(): void
    {
        $this->bxSignInMemberWithoutProfile();
        $_GET['api'] = 1;

        $a = BxDolService::call('system', 'profile_membership_stats', [], 'TemplServiceProfiles');
        $this->assertIsArray($a);
        $this->assertSame('membership_stats', $a[0]['type'] ?? null);

        $aData = $a[0]['data'];
        $this->assertNotSame('', $aData['level']['name']);
        $this->assertNotSame('', $aData['level']['icon']);
        $this->assertSame(['storage', 'files'], array_slice(array_column($aData['usage'], 'key'), 0, 2));

        foreach ($aData['usage'] as $aItem) {
            $this->assertArrayHasKey('value', $aItem);
            if ($aItem['unlimited'])
                $this->assertSame(_t('_sys_membership_stats_unlimited'), $aItem['badge'], 'No limit reads as a badge.');
            if ($aItem['limit'] > 0)
                $this->assertGreaterThanOrEqual(0, $aItem['percent']);
        }

        $aFiles = $aData['usage'][1];
        if ($aFiles['limit'] == 0)
            $this->assertSame($aFiles['current'] == 1 ? _t('_sys_membership_stats_files_one') : _t('_sys_membership_stats_files', $aFiles['current']), $aFiles['value'], 'Files are counted in words: "1 file", "3 files".');

        if (!empty($aData['action']))
            $this->assertStringNotContainsString('://', $aData['action']['url'], 'The apps get a page of the site, relative.');
    }

    public function testMembershipOnTheSite(): void
    {
        $this->bxSignInMemberWithoutProfile();

        $s = BxDolService::call('system', 'profile_membership_stats', [], 'TemplServiceProfiles');
        $this->assertIsString($s);
        $this->assertStringContainsString('bx-pms-level', $s);
        $this->assertStringNotContainsString('(' . _t('_unlimited') . ')', $s, 'No "(unlimited)" after the numbers.');
    }

    public function testCreateProfileForAMemberWithoutProfile(): void
    {
        $this->bxSignInMemberWithoutProfile();

        $s = BxDolService::call('system', 'create_profile_block', [], 'TemplServiceProfiles');
        $this->assertIsString($s);
        $this->assertStringContainsString('bx-menu-object-sys_add_profile', $s, 'The profile types to start from.');

        $_GET['api'] = 1;
        $a = (new BxTemplServiceProfiles())->serviceCreateProfileBlock();
        $this->assertSame('menu', $a[0]['type'] ?? null);
        $this->assertNotEmpty($a[0]['data']['content']);
    }

    public function testNoCreateProfileForAnAccountWithAProfile(): void
    {
        $this->bxLoginAsUser();
        if (!BxDolTours::getInstance()->hasProfile())
            $this->markTestSkipped('The test user has no profile.');

        $this->assertSame('', BxDolService::call('system', 'create_profile_block', [], 'TemplServiceProfiles'));
    }

    public function testYourAccountOnTheSite(): void
    {
        $this->bxLoginAsUser();
        if (!bx_get_logged_profile_id())
            $this->markTestSkipped('The test user has no profile.');

        $s = BxDolService::call('system', 'account_dashboard', [], 'TemplServiceProfiles', true);
        $this->assertIsString($s);
        $this->assertStringContainsString('bx-menu-object-sys_dashboard_account', $s);
        $this->assertStringContainsString('bx-mda-profile', $s, 'The profile and its switcher.');
        $this->assertStringContainsString('bx-menu-tiles', $s, 'The stats as tiles.');
        $this->assertStringContainsString('bx-menu-object-sys_account_preferences', $s, 'The preferences.');
        $this->assertStringContainsString('logout', $s, 'Sign out.');
        $this->assertStringNotContainsString('bx-psmi-show-more', $s, 'Tiles show every item: no Show more.');
    }

    public function testYourAccountForTheApps(): void
    {
        $this->bxLoginAsUser();
        if (!bx_get_logged_profile_id())
            $this->markTestSkipped('The test user has no profile.');

        $_GET['api'] = 1;
        $a = (new BxTemplServiceProfiles())->serviceAccountDashboard();
        $this->assertSame('account_dashboard', $a[0]['type'] ?? null);

        $aParts = array_column($a[0]['data']['items'], null, 'name');
        $this->assertSame(['profile', 'stats', 'preferences', 'logout'], array_keys($aParts));
        $this->assertSame(bx_get_logged_profile_id(), (int)$aParts['profile']['profile']['id']);
        $this->assertArrayHasKey('switcher', $aParts['profile']);
        $this->assertSame('sys_profile_stats_tiles', $aParts['stats']['menu']['object']);
        $this->assertContains('settings', array_column($aParts['preferences']['menu']['items'], 'name'));
    }

    public function testNoYourAccountWithoutAProfile(): void
    {
        $this->bxSignInMemberWithoutProfile();

        $this->assertSame('', BxDolService::call('system', 'account_dashboard', [], 'TemplServiceProfiles', true));
    }

    public function testPersonalMenuForTheApps(): void
    {
        $this->bxLoginAsUser();
        if (!bx_get_logged_profile_id())
            $this->markTestSkipped('The test user has no profile.');

        $_GET['api'] = 1;
        $a = (new BxTemplServiceProfiles())->serviceProfileMenu();
        $this->assertSame('profile_menu', $a[0]['type'] ?? null);
        $this->assertSame('sys_profile_stats', $a[0]['data']['object'], 'The home\'s left column is the member\'s own menu, as on the site, not the main menu.');
    }

    protected function bxSignInMemberWithoutProfile(): BxDolAccount
    {
        $sAutoProfile = getParam('sys_account_auto_profile_creation');
        $this->bxSetParamCache('sys_account_auto_profile_creation', '');

        $sEmail = 'dashboard-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;
        try {
            $aResult = (new BxTemplAccountForms())->createAccount([
                'name' => 'Dashboard Member',
                'email' => $sEmail,
                'password' => 'UnaTest1a',
            ], BX_PROFILE_ACTION_EXTERNAL, false);
        }
        finally {
            $this->bxSetParamCache('sys_account_auto_profile_creation', $sAutoProfile);
        }
        $this->assertArrayHasKey('account_id', $aResult, $aResult['error'] ?? '');

        $oAccount = BxDolAccount::getInstance((int)$aResult['account_id'], true);
        $aInfo = bx_login($oAccount->id());
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);
        $this->assertFalse(isAdmin());

        return $oAccount;
    }
}
