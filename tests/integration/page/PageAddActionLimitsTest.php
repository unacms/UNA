<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/../account/BxDolAccountTestCase.php';

/**
 * A section's "add" action (BxBasePage::getAddEntryParams, drawn by the site's title row and by the apps from `menu`)
 * asks exactly what the module's create page asks (addDataForm: checkAllowedAdd), only without performing it:
 * - People gets "Add person", also for an account with no profile, which may create one at the Account level;
 * - an account at its profile limit (sys_account_limit_profiles_number) gets no "Add person";
 * - a member whose level allows a number of entries and who has made them gets no "Add post";
 * - drawing the button does not use up an allowance;
 * - every installed module with the button hides it at its limit.
 *
 * Options are changed in the param cache only; ACL rows and action counters are restored, the account made without a
 * profile is deleted.
 */
#[Group('integration')]
class PageAddActionLimitsTest extends BxDolAccountTestCase
{
    private $_aGetBackup;
    private $_sProfilesLimitBackup;
    /** @var array of ['level', 'action', 'count', 'period'] to put back into sys_acl_matrix, or ['level', 'action'] of a row this test added */
    private array $_aMatrixBackups = [];
    /** @var array of ['action', 'profile', 'row' => original sys_acl_actions_track row or false] */
    private array $_aTrackBackups = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->_aGetBackup = $_GET;
        $this->_sProfilesLimitBackup = getParam('sys_account_limit_profiles_number');
        $this->bxBecomeGuest();
        BxDolDb::getInstance()->cleanMemoryAll();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        foreach (array_reverse($this->_aMatrixBackups) as $a)
            if (array_key_exists('count', $a))
                $oDb->query("UPDATE `sys_acl_matrix` SET `AllowedCount` = :count, `AllowedPeriodLen` = :period WHERE `IDLevel` = :level AND `IDAction` = :action", $a);
            else
                $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $a);
        foreach (array_reverse($this->_aTrackBackups) as $a) {
            $oDb->query("DELETE FROM `sys_acl_actions_track` WHERE `IDAction` = :action AND `IDMember` = :profile", ['action' => $a['action'], 'profile' => $a['profile']]);
            if ($a['row'])
                $oDb->query("INSERT INTO `sys_acl_actions_track` SET `IDAction` = :action, `IDMember` = :profile, `ActionsLeft` = :left, `ValidSince` = :since", [
                    'action' => $a['action'], 'profile' => $a['profile'], 'left' => $a['row']['ActionsLeft'], 'since' => $a['row']['ValidSince'],
                ]);
        }

        $this->bxSetParamCache('sys_account_limit_profiles_number', $this->_sProfilesLimitBackup);
        $_GET = $this->_aGetBackup ?? [];
        $this->bxBecomeGuest();
        $this->resetObjects();
        $GLOBALS['glMemCache'] = [];
        parent::tearDown();
    }

    private function requireModule(string $sModule): void
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            $this->markTestSkipped($sModule . ' is not installed.');
    }

    /** Page, menu and module objects keep the viewer they were made for: drop them. */
    private function resetObjects(): void
    {
        foreach ($GLOBALS['bxDolClasses'] ?? [] as $sKey => $o)
            if ($o instanceof BxDolModule || strpos($sKey, 'BxDolMenu!') === 0 || strpos($sKey, 'BxDolPage!') === 0)
                unset($GLOBALS['bxDolClasses'][$sKey]);
        BxDolMenu::setSelectedGlobal('', '');
        BxDolDb::getInstance()->cleanMemoryAll();
    }

    /** The add action of a module's section page on the site and in the apps' `menu`, for the current viewer. */
    private function addAction(string $sUri): array
    {
        $this->resetObjects();
        $_GET = [];
        $oPage = BxDolPage::getObjectInstanceByURI($sUri);
        $this->assertInstanceOf(BxBasePage::class, $oPage, $sUri);
        $aSite = $oPage->getAddEntryAction();

        $this->resetObjects();
        $_GET = ['api' => 1];
        $aData = BxDolService::call('system', 'get_page_by_request', ['page/' . $sUri, '', json_encode(new stdClass())], 'TemplServicePages', true);
        $_GET = [];
        $this->assertIsArray($aData['menu'] ?? null, $sUri);

        return [$aSite, $aData['menu']];
    }

    private function module(string $sModule): BxDolModule
    {
        $this->resetObjects();
        $oModule = BxDolModule::getInstance($sModule);
        $this->assertInstanceOf(BxDolModule::class, $oModule);

        return $oModule;
    }

    /**
     * Lets the viewer's level do "create entry" in the module (adds the matrix row if the level has none; restored in
     * tearDown) and returns the action id.
     */
    private function allowCreate(string $sModule): int
    {
        $oAcl = BxDolAcl::getInstance();
        $aLevel = $oAcl->getMemberMembershipInfo((int)bx_get_logged_profile_id());
        $iAction = (int)$oAcl->getMembershipActionId('create entry', $sModule);
        $this->assertGreaterThan(0, $iAction, $sModule . ' has a "create entry" action.');

        $oDb = BxDolDb::getInstance();
        $aKey = ['level' => (int)$aLevel['id'], 'action' => $iAction];
        if (!$oDb->getRow("SELECT `IDLevel` FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", $aKey)) {
            $oDb->query("INSERT INTO `sys_acl_matrix` SET `IDLevel` = :level, `IDAction` = :action", $aKey);
            $this->_aMatrixBackups[] = $aKey;
            $oDb->cleanMemoryAll();
        }

        return $iAction;
    }

    /** Lets the viewer's level do "create entry" in the module $iCount times, every $iPeriodHours hours if set (restored in tearDown). */
    private function limitCreate(string $sModule, int $iCount, ?int $iPeriodHours = null): int
    {
        $iAction = $this->allowCreate($sModule);
        $iProfileId = (int)bx_get_logged_profile_id();
        $aLevel = BxDolAcl::getInstance()->getMemberMembershipInfo($iProfileId);

        $oDb = BxDolDb::getInstance();
        $aRow = $oDb->getRow("SELECT `AllowedCount`, `AllowedPeriodLen` FROM `sys_acl_matrix` WHERE `IDLevel` = :level AND `IDAction` = :action", ['level' => (int)$aLevel['id'], 'action' => $iAction]);

        $this->_aMatrixBackups[] = ['level' => (int)$aLevel['id'], 'action' => $iAction, 'count' => $aRow['AllowedCount'], 'period' => $aRow['AllowedPeriodLen']];
        $this->_aTrackBackups[] = ['action' => $iAction, 'profile' => $iProfileId, 'row' => $oDb->getRow("SELECT * FROM `sys_acl_actions_track` WHERE `IDAction` = :action AND `IDMember` = :profile", ['action' => $iAction, 'profile' => $iProfileId])];

        $oDb->query("UPDATE `sys_acl_matrix` SET `AllowedCount` = :count, `AllowedPeriodLen` = :period WHERE `IDLevel` = :level AND `IDAction` = :action", ['count' => $iCount, 'period' => $iPeriodHours, 'level' => (int)$aLevel['id'], 'action' => $iAction]);
        $oDb->query("DELETE FROM `sys_acl_actions_track` WHERE `IDAction` = :action AND `IDMember` = :profile", ['action' => $iAction, 'profile' => $iProfileId]);
        $oDb->cleanMemoryAll();

        return $iAction;
    }

    private function actionsLeft(int $iAction): ?int
    {
        $mixed = BxDolDb::getInstance()->getOne("SELECT `ActionsLeft` FROM `sys_acl_actions_track` WHERE `IDAction` = :action AND `IDMember` = :profile", ['action' => $iAction, 'profile' => (int)bx_get_logged_profile_id()]);

        return $mixed === false || $mixed === null ? null : (int)$mixed;
    }

    /** A member account with no profile of its own, signed in (deleted in tearDown). */
    private function signInWithoutProfile(): BxDolAccount
    {
        $sAutoProfile = getParam('sys_account_auto_profile_creation');
        $this->bxSetParamCache('sys_account_auto_profile_creation', '');

        $sEmail = 'add-action-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;
        try {
            $aResult = (new BxTemplAccountForms())->createAccount(['name' => 'Add Action', 'email' => $sEmail, 'password' => 'UnaTest1a'], BX_PROFILE_ACTION_EXTERNAL, false);
        }
        finally {
            $this->bxSetParamCache('sys_account_auto_profile_creation', $sAutoProfile);
        }
        $this->assertArrayHasKey('account_id', $aResult, $aResult['error'] ?? '');

        $oAccount = BxDolAccount::getInstance((int)$aResult['account_id'], true);
        $this->assertSame([], $oAccount->getProfilesIds(false));

        $aInfo = bx_login($oAccount->id());
        $this->bxSyncSessionCookie();
        $this->bxSetLoggedFlags((int)$aInfo['role']);
        $this->assertFalse(isAdmin());

        return $oAccount;
    }

    public function testAnAccountWithNoProfileGetsAddPerson(): void
    {
        $this->requireModule('bx_persons');
        $this->signInWithoutProfile();

        $this->allowCreate('bx_persons');
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->module('bx_persons')->checkAllowedAdd(), 'The create page lets the account in.');

        [$aSite, $aMenu] = $this->addAction('persons-home');
        $sTitle = _t('_sys_txt_add_entry', _t('_bx_persons_txt_sample_single'));

        $this->assertSame(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=create-persons-profile')), $aSite['url'] ?? null);
        $this->assertSame($sTitle, $aSite['title'] ?? null);

        $this->assertSame('create-persons-profile', $aMenu['add_url'] ?? null);
        $this->assertSame($sTitle, $aMenu['add_title'] ?? null);
        $this->assertTrue($aMenu['add_allowed'] ?? null);
    }

    public function testAnAccountAtItsProfileLimitGetsNoAddPerson(): void
    {
        $this->requireModule('bx_persons');
        $this->bxLoginAsUser();
        if (isAdmin())
            $this->markTestSkipped('The user account is an operator: the profile limit does not apply.');

        $iProfiles = BxDolAccount::getInstance()->getProfilesNumber();
        if (!$iProfiles)
            $this->markTestSkipped('The user account has no profile.');

        $this->allowCreate('bx_persons');
        $this->bxSetParamCache('sys_account_limit_profiles_number', (string)($iProfiles + 1));
        [$aSite, $aMenu] = $this->addAction('persons-home');
        $this->assertNotSame([], $aSite, 'Below the limit the button is there.');
        $this->assertTrue($aMenu['add_allowed'] ?? null);

        $this->bxSetParamCache('sys_account_limit_profiles_number', (string)$iProfiles);
        $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $this->module('bx_persons')->checkAllowedAdd(), 'The create page refuses.');
        [$aSite, $aMenu] = $this->addAction('persons-home');
        $this->assertSame([], $aSite);
        $this->assertFalse($aMenu['add_allowed'] ?? null);
        $this->assertSame('create-persons-profile', $aMenu['add_url'] ?? null, 'The apps keep the section\'s Search.');
    }

    public function testAMemberWhoUsedTheirOnePostGetsNoAddPost(): void
    {
        $this->requireModule('bx_posts');
        $this->bxLoginAsUser();
        $iAction = $this->limitCreate('bx_posts', 1);

        [$aSite, $aMenu] = $this->addAction('posts-home');
        $this->assertNotSame([], $aSite, 'One post left: the button is there.');
        $this->assertTrue($aMenu['add_allowed'] ?? null);

        // What the create page does once the post is saved (addDataForm).
        $this->module('bx_posts')->checkAllowedAdd(true);
        $this->assertSame(0, $this->actionsLeft($iAction));

        [$aSite, $aMenu] = $this->addAction('posts-home');
        $this->assertSame([], $aSite);
        $this->assertFalse($aMenu['add_allowed'] ?? null);
    }

    public function testDrawingTheButtonDoesNotUseUpTheAllowance(): void
    {
        $this->requireModule('bx_posts');
        $this->bxLoginAsUser();
        $iAction = $this->limitCreate('bx_posts', 1);

        for ($i = 0; $i < 3; $i++) {
            [$aSite, $aMenu] = $this->addAction('posts-home');
            $this->assertNotSame([], $aSite);
            $this->assertTrue($aMenu['add_allowed'] ?? null);
        }

        $this->assertContains($this->actionsLeft($iAction), [null, 1], 'Only checked: the one post is still allowed.');
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $this->module('bx_posts')->checkAllowedAdd());
    }

    /** An allowance that renews: spent, the button is gone; once its period is over it is back, and drawing it spends nothing. */
    public function testARenewedAllowanceBringsTheButtonBack(): void
    {
        $this->requireModule('bx_posts');
        $this->bxLoginAsUser();
        $iAction = $this->limitCreate('bx_posts', 1, 24);

        $this->module('bx_posts')->checkAllowedAdd(true);
        $this->assertSame(0, $this->actionsLeft($iAction));
        [$aSite, $aMenu] = $this->addAction('posts-home');
        $this->assertSame([], $aSite, 'Spent within the period.');
        $this->assertFalse($aMenu['add_allowed'] ?? null);

        // The period started 25 hours ago.
        BxDolDb::getInstance()->query("UPDATE `sys_acl_actions_track` SET `ValidSince` = NOW() - INTERVAL 25 HOUR WHERE `IDAction` = :action AND `IDMember` = :profile", ['action' => $iAction, 'profile' => (int)bx_get_logged_profile_id()]);

        for ($i = 0; $i < 2; $i++) {
            [$aSite, $aMenu] = $this->addAction('posts-home');
            $this->assertNotSame([], $aSite, 'A new period: the button is back.');
            $this->assertTrue($aMenu['add_allowed'] ?? null);
        }
        $this->assertSame(1, $this->actionsLeft($iAction), 'Drawing it spent nothing of the new period.');
    }

    /** Every installed module with an add button hides it once the member's level allows no more entries. */
    public function testEveryModuleHidesTheButtonAtItsLimit(): void
    {
        $this->bxLoginAsUser();
        if (isAdmin())
            $this->markTestSkipped('The user account is an operator.');

        $iChecked = 0;
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule) {
            $sModule = $aModule['name'];
            if (!bx_srv('system', 'is_module_content', [$sModule]) && !bx_srv('system', 'is_module_context', [$sModule]) && !bx_srv('system', 'is_module_profile', [$sModule]))
                continue;

            $oModule = $this->module($sModule);
            if (!($aAdd = BxBasePage::getAddEntryParams($oModule)) || !$aAdd['allowed'])
                continue;

            $iAction = $this->limitCreate($sModule, 1);

            $oModule = $this->module($sModule);
            $this->assertTrue(BxBasePage::getAddEntryParams($oModule)['allowed'], $sModule . ': one left.');

            $oModule->checkAllowedAdd(true);
            $this->assertSame(0, $this->actionsLeft($iAction), $sModule);

            $oModule = $this->module($sModule);
            $this->assertNotSame(CHECK_ACTION_RESULT_ALLOWED, $oModule->checkAllowedAdd(), $sModule . ': the create page refuses.');
            $this->assertFalse(BxBasePage::getAddEntryParams($oModule)['allowed'], $sModule . ': no button at the limit.');
            $iChecked++;
        }

        if (!$iChecked)
            $this->markTestSkipped('No module the user may add to.');
    }
}
