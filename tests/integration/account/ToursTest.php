<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * First-run help: the "Get started" onboarding checklist (a menu whose items are its steps) and the Studio tour. A tour
 * closed or finished and a checklist hidden are remembered for the account; the steps follow the site's real state.
 */
#[Group('integration')]
class ToursTest extends BxDolIntegrationTestCase
{
    protected array $_aSeenBefore = [];
    protected int $_iAdminId = 0;
    protected array $_aParamsBefore = [];

    protected function setUp(): void
    {
        parent::setUp();

        foreach(['site_tour_home', 'site_tour_studio'] as $sName) {
            $this->_aParamsBefore[$sName] = getParam($sName);
            setParam($sName, 'on');
        }
        foreach(['sys_site_logo', 'sys_site_mark', 'sys_site_logo_inline', 'sys_site_mark_inline', 'sys_site_cover_common', 'sys_site_cover_disabled', 'sys_account_join'] as $sName)
            $this->_aParamsBefore[$sName] = getParam($sName);

        // The admin account's own state is put back afterwards.
        $this->_iAdminId = (int)$this->bxAccount('admin')->id();
        $oQuery = BxDolToursQuery::getInstance();
        foreach([BxDolTours::HOME, BxDolTours::STUDIO, BxDolTours::ONBOARDING_OPERATOR] as $sTour)
            $this->_aSeenBefore[$sTour] = $oQuery->isSeen($this->_iAdminId, $sTour);
        $oQuery->deleteByAccount($this->_iAdminId);
    }

    protected function tearDown(): void
    {
        $oQuery = BxDolToursQuery::getInstance();
        $oQuery->deleteByAccount($this->_iAdminId);
        foreach($this->_aSeenBefore as $sTour => $bSeen)
            if($bSeen)
                $oQuery->setSeen($this->_iAdminId, $sTour);

        foreach($this->_aParamsBefore as $sName => $sValue)
            setParam($sName, $sValue);

        parent::tearDown();
    }

    public function testClosedTourIsRememberedPerAccountAndPerTour(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        $this->assertFalse($oTours->isSeen(BxDolTours::HOME));
        $this->assertSame(1, $oTours->getTemplateVars(BxDolTours::HOME)['autostart']);

        $this->assertTrue($oTours->setSeen(BxDolTours::HOME));
        $this->assertTrue($oTours->setSeen(BxDolTours::HOME), 'closing a tour twice is not an error');

        $this->assertTrue($oTours->isSeen(BxDolTours::HOME));
        $this->assertSame(0, $oTours->getTemplateVars(BxDolTours::HOME)['autostart']);
        $this->assertFalse($oTours->isSeen(BxDolTours::STUDIO), 'the Studio tour is remembered on its own');
    }

    public function testOnlyOperatorsAndKnownToursAreRemembered(): void
    {
        $oTours = BxDolTours::getInstance();

        $this->bxBecomeGuest();
        $this->assertFalse($oTours->isAvailable(BxDolTours::HOME));
        $this->assertFalse($oTours->setSeen(BxDolTours::HOME));

        $this->bxLoginAsAdmin();
        $this->assertTrue($oTours->isAvailable(BxDolTours::HOME));
        $this->assertTrue($oTours->isAvailable(BxDolTours::STUDIO));
        $this->assertFalse($oTours->isAvailable('no-such-tour'));
        $this->assertFalse($oTours->setSeen('no-such-tour'));
        $this->assertFalse(BxDolToursQuery::getInstance()->isSeen($this->_iAdminId, 'no-such-tour'));
    }

    public function testTourTurnedOffInSettingsIsNotAvailable(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        setParam('site_tour_home', '');
        $this->assertFalse($oTours->isAvailable(BxDolTours::HOME));
        $this->assertFalse(BxDolService::call('system', 'is_tour_available', [BxDolTours::HOME], 'TemplServiceAccount', true));
        $this->assertTrue($oTours->isAvailable(BxDolTours::STUDIO));
    }

    public function testDeletedAccountLeavesNoRows(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        $oTours->setSeen(BxDolTours::STUDIO);
        $this->assertTrue($oTours->isSeen(BxDolTours::STUDIO));

        $oTours->onAccountDelete($this->_iAdminId);
        $this->assertFalse($oTours->isSeen(BxDolTours::STUDIO));
    }

    public function testJoinModeAndWhereToChangeIt(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        setParam('sys_account_join', '');
        $this->assertSame(BxDolTours::JOIN_OPEN, $oTours->getJoinMode(), 'not chosen yet is anyone');
        $this->assertSame(BxDolTours::STEP_TODO, $oTours->getStepState('join'));

        setParam('sys_account_join', BxDolAccount::JOIN_CLOSED);
        $this->assertSame(BxDolTours::JOIN_CLOSED, $oTours->getJoinMode());
        $this->assertSame(BxDolTours::STEP_DONE, $oTours->getStepState('join'), 'chosen is done');
        $this->assertStringContainsString('settings.php?page=system_members&category=account', $oTours->getJoinSettingsUrl());

        setParam('sys_account_join', BxDolAccount::JOIN_INVITE);
        $sExpected = BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites') ? BxDolTours::JOIN_INVITE : BxDolTours::JOIN_OPEN;
        $this->assertSame($sExpected, $oTours->getJoinMode(), 'invitation only needs the Invitations app');
        $this->assertStringContainsString('category=account', $oTours->getJoinSettingsUrl(), 'one place for who can join');
    }

    public function testJoinModeChoicesAndCheck(): void
    {
        $aModes = BxDolService::call('system', 'get_join_modes', [], 'TemplServiceAccount', true);
        $this->assertSame([BxDolAccount::JOIN_OPEN, BxDolAccount::JOIN_INVITE, BxDolAccount::JOIN_CLOSED], array_keys($aModes), 'Anyone comes first');

        require_once(BX_DIRECTORY_PATH_ROOT . 'studio/classes/BxDolStudioForm.php');
        $oChecker = new BxDolStudioFormCheckerHelper();
        $this->assertTrue($oChecker->checkJoinMode(BxDolAccount::JOIN_OPEN));
        $this->assertTrue($oChecker->checkJoinMode(BxDolAccount::JOIN_CLOSED));
        $this->assertFalse($oChecker->checkJoinMode('anything'));
        $this->assertFalse($oChecker->checkJoinMode(''));
    }

    public function testNobodyCanJoinTakesNoSignUp(): void
    {
        $this->bxBecomeGuest();

        setParam('sys_account_join', BxDolAccount::JOIN_CLOSED);
        $oForms = new BxTemplAccountForms();
        $this->assertStringContainsString(_t('_sys_txt_join_closed'), $oForms->createAccountForm());

        setParam('sys_account_join', BxDolAccount::JOIN_OPEN);
        $this->assertStringNotContainsString(_t('_sys_txt_join_closed'), $oForms->createAccountForm());
    }

    public function testOnboardingStepsFollowTheSiteState(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        foreach(['sys_site_logo', 'sys_site_mark', 'sys_site_logo_inline', 'sys_site_mark_inline', 'sys_site_cover_common', 'sys_site_cover_disabled'] as $sName)
            setParam($sName, '');

        $this->assertSame(BxDolTours::STEP_TODO, $oTours->getStepState('logo'));
        $this->assertSame(BxDolTours::STEP_TODO, $oTours->getStepState('cover'));
        $this->assertSame($oTours->hasProfile() ? BxDolTours::STEP_DONE : BxDolTours::STEP_TODO, $oTours->getStepState('profile'));

        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
        setParam('sys_site_cover_common', '5');
        $this->assertSame(BxDolTours::STEP_DONE, $oTours->getStepState('logo'), 'a logo as SVG code counts');
        $this->assertSame(BxDolTours::STEP_DONE, $oTours->getStepState('cover'));

        $this->assertTrue(BxDolService::call('system', 'is_onboarding_step_available', ['cover'], 'TemplServiceAccount', true));
        setParam('sys_site_cover_disabled', 'on');
        $this->assertFalse(BxDolService::call('system', 'is_onboarding_step_available', ['cover'], 'TemplServiceAccount', true), 'no cover step while covers are off');

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $sPost = BxDolService::call('bx_timeline', 'get_onboarding_step_state', ['post'], 'Module', true);
            if($oTours->hasProfile())
                $this->assertContains($sPost, [BxDolTours::STEP_DONE, BxDolTours::STEP_TODO]);
            else
                $this->assertSame(BxDolTours::STEP_LOCKED, $sPost, 'posting waits for a profile');
        }
    }

    public function testOnboardingChecklistShowsUntilHidden(): void
    {
        $oTours = BxDolTours::getInstance();
        $sMenu = BxDolTours::ONBOARDING_OPERATOR;

        $this->assertTrue(BxDolTours::isOnboardingName($sMenu));
        $this->assertTrue(BxDolTours::isOnboardingName('bx_persons_onboarding_members'));
        $this->assertFalse(BxDolTours::isOnboardingName('sys_site'));

        $this->bxBecomeGuest();
        $this->assertFalse($oTours->isOnboardingShown($sMenu));
        $this->assertFalse($oTours->setSeen($sMenu));

        $this->bxLoginAsAdmin();
        $this->assertTrue($oTours->isOnboardingShown($sMenu));

        $this->assertTrue($oTours->setSeen($sMenu));
        $this->assertFalse($oTours->isOnboardingShown($sMenu), 'hidden by the operator');
        $this->assertTrue($oTours->isOnboardingShown($sMenu, true), 'the account menu item brings it back');

        setParam('site_tour_home', '');
        $this->assertFalse($oTours->isOnboardingShown($sMenu, true), 'off in settings');
    }

    public function testOnboardingBlockIsTheMenuInAStandardBlock(): void
    {
        $this->bxLoginAsAdmin();
        setParam('sys_site_logo', '');
        setParam('sys_site_mark', '');
        setParam('sys_site_logo_inline', '');
        setParam('sys_site_mark_inline', '');

        $oMenu = BxDolMenu::getObjectInstance(BxDolTours::ONBOARDING_OPERATOR);
        $this->assertInstanceOf(BxBaseMenuOnboarding::class, $oMenu, 'the checklist is a menu (Studio > Navigation)');

        $mBlock = BxDolService::call('system', 'get_block_onboarding', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true);
        $this->assertIsArray($mBlock);
        $this->assertMatchesRegularExpression('/^\d+ of \d+ done$/', $mBlock['description']);
        $this->assertStringContainsString('bx-menu-list-desc', $mBlock['content'], 'drawn by the "List with descriptions" menu template');
        $this->assertStringContainsString('bx_onboarding_hide', $mBlock['buttons'][0]['onclick'], 'Hide is the block\'s own button');

        $this->assertTrue(BxDolService::call('system', 'is_safe_service', ['onboarding_hide'], 'TemplServices'));
        $this->assertSame(['code' => 0], BxDolService::call('system', 'onboarding_hide', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true));
        $this->assertSame('', BxDolService::call('system', 'get_block_onboarding', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true), 'hidden: the block is left out');
        $this->assertSame('', BxDolService::call('system', 'get_block_onboarding', ['sys_site'], 'TemplServiceAccount', true), 'only a checklist menu');

        $this->bxBecomeGuest();
        $this->assertSame('', BxDolService::call('system', 'get_block_onboarding', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true));
        $this->assertSame(['code' => 1], BxDolService::call('system', 'onboarding_hide', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true));
    }

    /**
     * The checklist's steps are set in Studio, which the mobile apps don't have: every "Get started" block (home,
     * dashboard, the block library) is hidden on the mobile app (BX_DB_HIDDEN_MOBILE), and the page API says so, so the
     * apps leave it out while the site and the web app keep it.
     */
    public function testOnboardingBlocksAreHiddenInTheMobileApps(): void
    {
        $iMobileApp = pow(2, BX_DB_HIDDEN_MOBILE - 1);
        $aBlocks = BxDolDb::getInstance()->getAll("SELECT `object`, `hidden_on` FROM `sys_pages_blocks` WHERE `module` = 'system' AND `title_system` IN ('_sys_page_block_title_system_onboarding_operator', '_sys_page_block_title_system_onboarding')");
        $this->assertNotEmpty($aBlocks);

        $aObjects = [];
        foreach($aBlocks as $aBlock) {
            $aObjects[] = $aBlock['object'];
            $this->assertSame($iMobileApp, (int)$aBlock['hidden_on'] & $iMobileApp, 'hidden on the mobile app: ' . ($aBlock['object'] ?: 'block library'));
            $this->assertSame(0, (int)$aBlock['hidden_on'] & ~$iMobileApp, 'shown on every screen size: ' . ($aBlock['object'] ?: 'block library'));
        }
        foreach(['sys_home', 'sys_dashboard', ''] as $sObject)
            $this->assertContains($sObject, $aObjects);

        $this->assertSame(['mobile-app'], BxBasePage::getHiddenOnNamesAPI($iMobileApp));
    }

    public function testEveryRowCountsAndDoneSaysSetUp(): void
    {
        $this->bxLoginAsAdmin();
        setParam('sys_account_join', '');
        BxDolService::cleanMemoryCache();

        $oMenu = BxDolMenu::getObjectInstance(BxDolTours::ONBOARDING_OPERATOR);
        $oMenu->getCode();
        list(, $iSteps) = $oMenu->getProgress();
        $this->assertSame(count($oMenu->getStates()), $iSteps, 'every row of the checklist is a counted step, "Choose who can join" too');

        // Every step done: the block stays and says "You're set up" instead of vanishing.
        setParam('sys_account_join', BxDolAccount::JOIN_OPEN);
        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
        setParam('sys_site_cover_common', '5');
        setParam('sys_site_cover_disabled', '');

        // Timeline's "Write the first post" asks the feed: a post of the operator's profile for the test.
        $iPostId = 0;
        $aProfileIds = BxDolTours::getInstance()->getProfileIds();
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline') && $aProfileIds) {
            $oDb = BxDolDb::getInstance();
            $oDb->query("INSERT INTO `bx_timeline_events` (`owner_id`, `type`, `action`, `object_id`, `object_owner_id`, `object_privacy_view`, `description`, `date`, `status`) VALUES (:id, 'timeline_common_post', '', 0, :id, 3, 'phpunit', UNIX_TIMESTAMP(), 'active')", ['id' => (int)reset($aProfileIds)]);
            $iPostId = (int)$oDb->lastId();
        }

        try {
            BxDolService::cleanMemoryCache();
            $oMenu->getCode();
            list($iDone, $iSteps) = $oMenu->getProgress();
            if($iDone != $iSteps)
                $this->markTestSkipped('A step is still to do on this site: ' . json_encode($oMenu->getStates()));

            $mBlock = BxDolService::call('system', 'get_block_onboarding', [BxDolTours::ONBOARDING_OPERATOR], 'TemplServiceAccount', true);
            $this->assertIsArray($mBlock, 'all done still shows the block');
            $this->assertSame(_t('_sys_onboarding_done'), $mBlock['description']);
            $this->assertStringContainsString('bx_onboarding_hide', $mBlock['buttons'][0]['onclick']);
        }
        finally {
            if($iPostId)
                BxDolDb::getInstance()->query("DELETE FROM `bx_timeline_events` WHERE `id` = :id", ['id' => $iPostId]);
            BxDolService::cleanMemoryCache();
        }
    }
}
