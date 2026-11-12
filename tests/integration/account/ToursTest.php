<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Introduction tours: a tour an operator has closed or finished is remembered for the account.
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
}
