<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * "Require a profile" (sys_account_require_profile): an account with no profile of its own is sent to profile
 * creation on the site (BxDolPage::isLockedFromNoProfile) and in the apps (`profile_required` in the viewer's data),
 * while the option is on. Off, the default, it only gets the "create a profile" informer.
 *
 * The option is changed in memory only, so the site itself never requires a profile because of the test.
 */
#[Group('integration')]
class PageProfileRequiredTest extends BxDolIntegrationTestCase
{
    protected $_mixedOptionBackup;

    protected function setUp(): void
    {
        parent::setUp();
        $this->_mixedOptionBackup = getParam('sys_account_require_profile');
    }

    protected function tearDown(): void
    {
        $this->bxSetParamCache('sys_account_require_profile', $this->_mixedOptionBackup);
        parent::tearDown();
    }

    protected function bxSetParamCache(string $sKey, $mixedValue): void
    {
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $aParams[$sKey] = $mixedValue;
        $oProp->setValue(null, $aParams);
    }

    /** Signs in as the test admin, which needs to have no profile of its own (a fresh install's admin has none). */
    protected function loginWithoutProfile(): BxDolAccount
    {
        $oAccount = $this->bxAccount('admin');
        if ($oAccount->getProfilesIds(false))
            $this->markTestSkipped('The test admin account has a profile of its own.');

        $this->bxLoginAsAdmin();

        return $oAccount;
    }

    public function testOffByDefaultNothingIsLocked(): void
    {
        $this->loginWithoutProfile();
        $this->bxSetParamCache('sys_account_require_profile', '');

        $this->assertFalse(BxDolAccount::isProfileRequired());
        foreach (['home', 'view-post', 'about'] as $sUri)
            $this->assertFalse(BxDolPage::isLockedFromNoProfile($sUri), $sUri);
    }

    public function testOnSendsAnAccountWithoutAProfileToProfileCreation(): void
    {
        $this->loginWithoutProfile();
        $this->bxSetParamCache('sys_account_require_profile', 'on');

        $this->assertTrue(BxDolAccount::isProfileRequired());

        foreach (['home', 'view-post', 'about', 'dashboard'] as $sUri)
            $this->assertTrue(BxDolPage::isLockedFromNoProfile($sUri), $sUri);

        // Its account pages and the profile forms stay open, or it could neither create a profile nor manage the account.
        $aCreation = BxDolPage::getProfileCreationPages();
        foreach (array_merge(['account-profile-switcher', 'account-settings-info'], $aCreation) as $sUri)
            $this->assertFalse(BxDolPage::isLockedFromNoProfile($sUri), $sUri);

        $sUrl = BxDolPage::getProfileRequiredUrl();
        $this->assertStringStartsWith(BX_DOL_URL_ROOT, $sUrl);
        $this->assertStringContainsString(count($aCreation) == 1 ? $aCreation[0] : 'account-profile-switcher', $sUrl, 'One kind of profile: its form; several: the switcher, as in the apps.');
    }

    public function testAppsGetTheFlagForTheViewer(): void
    {
        $oAccount = $this->loginWithoutProfile();
        $iProfileId = bx_get_logged_profile_id();

        $this->bxSetParamCache('sys_account_require_profile', 'on');
        $this->assertTrue(BxDolProfile::getDataForPage($iProfileId)['profile_required']);

        $this->bxSetParamCache('sys_account_require_profile', '');
        $this->assertFalse(BxDolProfile::getDataForPage($iProfileId)['profile_required']);

        $this->assertSame((int)$oAccount->id(), (int)BxDolProfile::getInstance($iProfileId)->getAccountId());
    }

    public function testGuestsAreLeftToTheGuestLock(): void
    {
        $this->bxBecomeGuest();
        $this->bxSetParamCache('sys_account_require_profile', 'on');

        $this->assertFalse(BxDolAccount::isProfileRequired());
        $this->assertFalse(BxDolPage::isLockedFromNoProfile('home'));
    }
}
