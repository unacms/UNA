<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * First-run help for operators: the homepage setup checklist and the Studio tour. A tour closed or finished and
 * a checklist hidden are remembered for the account; the checklist's steps follow the site's real state.
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
        foreach(['sys_site_logo', 'sys_site_mark', 'sys_site_logo_inline', 'sys_site_mark_inline', 'sys_site_cover_common', 'sys_site_cover_disabled', 'sys_account_disable_join_form'] as $sName)
            $this->_aParamsBefore[$sName] = getParam($sName);

        // The admin account's own state is put back afterwards.
        $this->_iAdminId = (int)$this->bxAccount('admin')->id();
        $oQuery = BxDolToursQuery::getInstance();
        foreach([BxDolTours::HOME, BxDolTours::STUDIO] as $sTour)
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

    public function testSetupStepsFollowTheSiteState(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        foreach(['sys_site_logo', 'sys_site_mark', 'sys_site_logo_inline', 'sys_site_mark_inline', 'sys_site_cover_common', 'sys_site_cover_disabled'] as $sName)
            setParam($sName, '');

        $aSteps = $oTours->getSetupSteps();
        $this->assertSame(['profile', 'logo', 'cover'], array_slice(array_keys($aSteps), 0, 3));
        $this->assertFalse($aSteps['logo']['done']);
        $this->assertFalse($aSteps['cover']['done']);
        $this->assertStringContainsString('designer.php?page=logo', $aSteps['logo']['url']);

        $bHasProfile = !empty(BxDolAccount::getInstance()->getProfilesIds(false));
        $this->assertSame($bHasProfile, $aSteps['profile']['done'], 'the profile step is done once the account has a profile of its own');

        setParam('sys_site_logo_inline', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>');
        setParam('sys_site_cover_common', '5');
        $aSteps = $oTours->getSetupSteps();
        $this->assertTrue($aSteps['logo']['done'], 'a logo as SVG code counts');
        $this->assertTrue($aSteps['cover']['done']);

        setParam('sys_site_cover_disabled', 'on');
        $this->assertArrayNotHasKey('cover', $oTours->getSetupSteps(), 'no cover step while covers are off');

        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $aSteps = $oTours->getSetupSteps();
            $this->assertSame(!$bHasProfile, $aSteps['post']['locked'], 'posting waits for a profile');
            $this->assertFalse(BxDolService::call('bx_timeline', 'has_posts_by', [[PHP_INT_MAX]]));
            $this->assertFalse(BxDolService::call('bx_timeline', 'has_posts_by', [[]]));
        }
    }

    public function testSetupChecklistShowsUntilHiddenOrDone(): void
    {
        $oTours = BxDolTours::getInstance();

        $this->bxBecomeGuest();
        $this->assertFalse($oTours->isSetupShown());
        $this->assertFalse($oTours->isSetupShown(true));

        $this->bxLoginAsAdmin();
        setParam('sys_site_logo', '');
        setParam('sys_site_mark', '');
        setParam('sys_site_logo_inline', '');
        setParam('sys_site_mark_inline', '');
        $this->assertTrue($oTours->isSetupShown(), 'a step is left: no logo');

        $this->assertTrue($oTours->setSeen(BxDolTours::HOME));
        $this->assertFalse($oTours->isSetupShown(), 'hidden by the operator');
        $this->assertTrue($oTours->isSetupShown(true), 'the account menu item brings it back');

        setParam('site_tour_home', '');
        $this->assertFalse($oTours->isSetupShown(true), 'off in settings');
    }

    public function testJoinModeAndWhereToChangeIt(): void
    {
        $this->bxLoginAsAdmin();
        $oTours = BxDolTours::getInstance();

        setParam('sys_account_disable_join_form', 'on');
        $this->assertSame(BxDolTours::JOIN_CLOSED, $oTours->getJoinMode());
        $this->assertStringContainsString('category=account', $oTours->getJoinSettingsUrl());

        setParam('sys_account_disable_join_form', '');
        $sMode = $oTours->getJoinMode();
        if(BxDolModuleQuery::getInstance()->isEnabledByName('bx_invites') && getParam('bx_invites_enable_reg_by_inv') == 'on') {
            $this->assertSame(BxDolTours::JOIN_INVITE, $sMode);
            $this->assertStringContainsString('name=bx_invites', $oTours->getJoinSettingsUrl());
        }
        else {
            $this->assertSame(BxDolTours::JOIN_OPEN, $sMode);
        }
    }

    public function testSetupBlockGivesTheProgressAndTheStepsForTheApps(): void
    {
        $this->bxLoginAsAdmin();
        setParam('sys_site_logo', '');
        setParam('sys_site_mark', '');
        setParam('sys_site_logo_inline', '');
        setParam('sys_site_mark_inline', '');

        $aSteps = BxDolTours::getInstance()->getSetupSteps();
        foreach($aSteps as $aStep)
            $this->assertNotEmpty($aStep['icon'], 'every step has its own icon');

        $mBlock = BxDolService::call('system', 'get_block_setup', [], 'TemplServiceAccount', true);
        $this->assertIsArray($mBlock);
        $this->assertStringContainsString('of ' . count($aSteps), $mBlock['description']);
        $this->assertStringContainsString('bx-setup-step-icon', $mBlock['content']);
        $this->assertSame('sys-setup-hide', $mBlock['menu'][0]['name']);

        $this->assertTrue(BxDolService::call('system', 'is_safe_service', ['setup_dismiss'], 'TemplServices'));
        $this->assertSame(['code' => 0], BxDolService::call('system', 'setup_dismiss', [], 'TemplServiceAccount', true));
        $this->assertSame('', BxDolService::call('system', 'get_block_setup', [], 'TemplServiceAccount', true), 'hidden: the block is left out');

        $this->bxBecomeGuest();
        $this->assertSame('', BxDolService::call('system', 'get_block_setup', [], 'TemplServiceAccount', true));
        $this->assertSame(['code' => 1], BxDolService::call('system', 'setup_dismiss', [], 'TemplServiceAccount', true));
    }
}
