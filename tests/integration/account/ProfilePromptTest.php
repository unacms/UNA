<?php

use PHPUnit\Framework\Attributes\Group;

require_once __DIR__ . '/BxDolAccountTestCase.php';

/**
 * "Accounts without a profile" (sys_account_require_profile) set to "Ask after sign-in" ('prompt'): a member account
 * with no profile of its own gets the "Create your profile" window on the first page after sign-in (BxBaseInformer)
 * and the apps get `profile_prompt` in the viewer's data until they say they showed it
 * (system/account_profile_prompt_seen). Operators are left to the setup checklist.
 *
 * The member is a throwaway account made without a profile and deleted afterwards. Options are set in the param
 * cache only.
 */
#[Group('integration')]
class ProfilePromptTest extends BxDolAccountTestCase
{
    protected $_mixedOptionBackup;

    protected $_aServerBackup;

    protected $_aGetBackup;

    protected function setUp(): void
    {
        parent::setUp();

        $this->_mixedOptionBackup = getParam('sys_account_require_profile');
        $this->_aServerBackup = $_SERVER;
        $this->_aGetBackup = $_GET;

        if (!BxDolPage::getProfileCreationPages())
            $this->markTestSkipped('No profile module to create a profile with.');
    }

    protected function tearDown(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', $this->_mixedOptionBackup);
        $_SERVER = $this->_aServerBackup;
        $_GET = $this->_aGetBackup ?? [];
        unset($GLOBALS['bxDolClasses']['BxDolInformer']);

        parent::tearDown();
    }

    public function testModesOfTheOption(): void
    {
        $aModes = BxDolService::call('system', 'get_profile_requirement_modes', [], 'TemplServiceAccount');

        $this->assertSame([BxDolAccount::PROFILE_OPTIONAL, BxDolAccount::PROFILE_PROMPT, BxDolAccount::PROFILE_REQUIRED], array_keys($aModes));
        $this->assertSame(['', 'prompt', 'on'], array_keys($aModes), 'An upgraded site keeps its stored value: "" (informer only) and "on" (required).');
        foreach ($aModes as $sTitle)
            $this->assertNotSame('', $sTitle);
    }

    public function testFirstPageAfterSignInAsksOnce(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxSignInMemberWithoutProfile();

        $this->assertTrue(BxDolAccount::isProfilePromptDue());
        $this->assertFalse(BxDolAccount::isProfileRequired(), 'Asked, not required: every page stays open.');
        $this->assertFalse(BxDolPage::isLockedFromNoProfile('home'));

        $sInformer = $this->bxInformer();
        $this->assertStringContainsString('id="sys-account-profile-prompt"', $sInformer, 'The window opens with the page.');
        $this->assertStringContainsString('bx-menu-object-sys_add_profile', $sInformer, 'It lists the profile types of the add-profile menu.');
        $this->assertStringNotContainsString('id="sys-account-profile-system"', $sInformer, 'The informer leaves out its own message under the window.');

        $this->assertFalse(BxDolAccount::isProfilePromptDue(), 'Shown once per sign-in.');
        $sInformer = $this->bxInformer();
        $this->assertStringNotContainsString('sys-account-profile-prompt', $sInformer);
        $this->assertStringContainsString('id="sys-account-profile-system"', $sInformer, 'Later pages keep the informer.');
    }

    public function testNotOnProfileCreationOrAccountPages(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxSignInMemberWithoutProfile();

        foreach (array_merge(BxDolPage::getProfileCreationPages(), ['account-profile-switcher', 'account-settings-info']) as $sUri) {
            $_GET['i'] = $sUri;
            $this->assertStringNotContainsString('sys-account-profile-prompt', $this->bxInformer(), $sUri);
        }
        $this->assertTrue(BxDolAccount::isProfilePromptDue(), 'Still due: the next other page asks.');

        $_GET['i'] = 'about';
        $this->assertStringContainsString('sys-account-profile-prompt', $this->bxInformer());
    }

    public function testNotInAnswersThatArentPages(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxSignInMemberWithoutProfile();

        // A missing favicon is answered with the "not found" page: the browser never shows it.
        $_SERVER['HTTP_ACCEPT'] = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8';
        $this->assertStringNotContainsString('sys-account-profile-prompt', $this->bxInformer());

        $oTemplate = BxDolTemplate::getInstance();
        $iIndex = $oTemplate->getPageNameIndex();
        $_SERVER['HTTP_ACCEPT'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
        $oTemplate->setPageNameIndex(BX_PAGE_TRANSITION);
        try {
            $this->assertStringNotContainsString('sys-account-profile-prompt', $this->bxInformer(), 'Not on the "Please wait" page sign-in relocates through.');
        }
        finally {
            $oTemplate->setPageNameIndex($iIndex);
        }

        $this->assertTrue(BxDolAccount::isProfilePromptDue());
        $this->assertStringContainsString('sys-account-profile-prompt', $this->bxInformer());
    }

    public function testAppsGetItUntilTheyShowIt(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxSignInMemberWithoutProfile();
        $iProfileId = bx_get_logged_profile_id();

        $aPrompt = BxDolProfile::getDataForPage($iProfileId)['profile_prompt'];
        $this->assertSame(_t('_sys_page_block_title_account_profile_create'), $aPrompt['title']);
        $this->assertSame(_t('_sys_page_block_desc_account_profile_create'), $aPrompt['text']);
        $this->assertNotEmpty(BxDolProfile::getDataForPage($iProfileId)['menu']['items'] ?? [], 'The profile types come with it.');

        $this->assertTrue(BxDolService::call('system', 'is_safe_service', ['AccountProfilePromptSeen'], 'TemplServices'), 'The apps may call it.');
        $this->assertSame(['profile_prompt' => false], BxDolService::call('system', 'account_profile_prompt_seen', [], 'TemplServiceAccount'));
        $this->assertFalse(BxDolProfile::getDataForPage($iProfileId)['profile_prompt']);
    }

    public function testOtherModesNeverAsk(): void
    {
        foreach ([BxDolAccount::PROFILE_OPTIONAL, BxDolAccount::PROFILE_REQUIRED] as $sMode) {
            $this->bxSetParamCache('sys_account_require_profile', $sMode);
            $this->bxSignInMemberWithoutProfile();

            $this->assertFalse(BxDolAccount::isProfilePromptDue(), $sMode);
            $this->assertStringNotContainsString('sys-account-profile-prompt', $this->bxInformer(), $sMode);
            $this->assertSame($sMode === BxDolAccount::PROFILE_REQUIRED, BxDolAccount::isProfileRequired(), $sMode);

            $this->bxBecomeGuest();
        }
    }

    public function testOperatorsAreLeftToTheSetupChecklist(): void
    {
        $oAccount = $this->bxAccount('admin');
        if ($oAccount->getProfilesIds(false))
            $this->markTestSkipped('The test admin account has a profile of its own.');

        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxLoginAsAdmin();

        $this->assertFalse(BxDolAccount::isProfilePromptDue());
        $this->assertStringNotContainsString('sys-account-profile-prompt', $this->bxInformer());
    }

    public function testAnAccountWithAProfileIsNotAsked(): void
    {
        $oAccount = $this->bxAccount('user');
        if (!$oAccount->getProfilesIds(false))
            $this->markTestSkipped('The test user account has no profile of its own.');

        $this->bxSetParamCache('sys_account_require_profile', BxDolAccount::PROFILE_PROMPT);
        $this->bxLoginAsUser();

        $this->assertFalse(BxDolAccount::isProfilePromptDue());
    }

    /**
     * Makes a member account with no profile (auto profile creation off, as an import or social sign-in may leave
     * one) and signs it in, as the login form does.
     */
    protected function bxSignInMemberWithoutProfile(): BxDolAccount
    {
        $sAutoProfile = getParam('sys_account_auto_profile_creation');
        $this->bxSetParamCache('sys_account_auto_profile_creation', '');

        $sEmail = 'profile-prompt-' . bin2hex(random_bytes(4)) . '@example.test';
        $this->_aCreatedEmails[] = $sEmail;
        try {
            $aResult = (new BxTemplAccountForms())->createAccount([
                'name' => 'Profile Prompt',
                'email' => $sEmail,
                'password' => 'UnaTest1a',
            ], BX_PROFILE_ACTION_EXTERNAL, false);
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

    /** The informer as a page draws it (a fresh instance: it is a singleton). */
    protected function bxInformer(): string
    {
        unset($GLOBALS['bxDolClasses']['BxDolInformer']);
        $oInformer = BxDolInformer::getInstance(BxDolTemplate::getInstance());

        return (string)$oInformer->display();
    }
}
