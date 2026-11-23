<?php

/**
 * A donation plan that is turned off can't be bought any more, but the subscriptions
 * to it keep renewing (`get_subscription_item`, read by BxPaymentSubscriptions::prolong),
 * and a renewal the payment provider has already charged for it (Stripe, Credits)
 * is still recorded.
 * A plan named `test-retired-*` and its entries (order `test-retired-*`) are seeded
 * and deleted afterwards.
 */
class RetiredPlanRenewalTest extends BxDolIntegrationTestCase
{
    const NAME = 'test-retired-plan';
    const ORDER = 'test-retired-sub';
    const CLIENT = 987654411;
    const LICENSE = 'test-retired-license';

    protected $_oModule;
    protected $_oDb;
    protected $_iTypeId = 0;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_donations'))
            $this->markTestSkipped('bx_donations is not installed');

        $this->_oModule = BxDolModule::getInstance('bx_donations');
        $this->_oDb = BxDolDb::getInstance();

        $this->_cleanup();
        $this->_oDb->query("INSERT INTO `bx_donations_types` SET `name`=:name, `title`='', `period`=1, `period_unit`='month', `amount`=5, `custom`=0, `active`=0, `order`=0", ['name' => self::NAME]);
        $this->_iTypeId = (int)$this->_oDb->lastId();
    }

    protected function tearDown(): void
    {
        if ($this->_oDb)
            $this->_cleanup();

        parent::tearDown();
    }

    public function testRetiredPlanCannotBeBought()
    {
        $this->assertSame([], $this->_oModule->serviceGetCartItem($this->_iTypeId));
        $this->assertSame([], $this->_oModule->serviceGetCartItem(self::NAME));
    }

    public function testRenewalOfRetiredPlanIsRecorded()
    {
        $aItem = $this->_register();

        $this->assertIsArray($aItem);
        $this->assertEquals($this->_iTypeId, $aItem['id']);
        $this->assertEquals(5, (float)$aItem['price_recurring']);
        $this->assertSame(1, $this->_entries());
    }

    public function testRefundOfRetiredPlanIsRecorded()
    {
        $this->_register();

        $this->assertTrue($this->_oModule->serviceUnregisterSubscriptionItem(self::CLIENT, $this->_oModule->_oConfig->getOwner(), $this->_iTypeId, 1, self::ORDER, self::LICENSE));
        $this->assertSame(0, $this->_entries());
    }

    public function testRetiredPlanIsStillASubscriptionItem()
    {
        // BxPaymentSubscriptions::prolong reads the plan this way before it records a renewal
        $aItem = $this->_oModule->serviceGetSubscriptionItem($this->_iTypeId);
        $this->assertIsArray($aItem);
        $this->assertEquals($this->_iTypeId, $aItem['id']);
        $this->assertEquals(1, (int)$aItem['period_recurring']);
        $this->assertSame('month', $aItem['period_unit_recurring']);

        // even by someone who already donated on it, it can't be bought again
        $this->_register();
        $this->assertSame([], $this->_oModule->serviceGetCartItem($this->_iTypeId, self::CLIENT));
    }

    public function testPaymentsRenewalReadsRetiredPlan()
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_payment'))
            $this->markTestSkipped('bx_payment is not installed');

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName('bx_donations');
        $oPayment = BxDolModule::getInstance('bx_payment');

        $this->assertSame([], $oPayment->callGetCartItem((int)$aModule['id'], [$this->_iTypeId, self::CLIENT]));

        $aItem = $oPayment->callGetSubscriptionItem((int)$aModule['id'], [$this->_iTypeId, self::CLIENT]);
        $this->assertIsArray($aItem);
        $this->assertEquals($this->_iTypeId, $aItem['id']);
    }

    public function testActivePlanCanStillBeBought()
    {
        $this->_oDb->query("UPDATE `bx_donations_types` SET `active`=1 WHERE `id`=:id", ['id' => $this->_iTypeId]);

        $aItem = $this->_oModule->serviceGetCartItem($this->_iTypeId);
        $this->assertIsArray($aItem);
        $this->assertEquals($this->_iTypeId, $aItem['id']);
    }

    protected function _register()
    {
        return $this->_oModule->serviceRegisterSubscriptionItem(self::CLIENT, $this->_oModule->_oConfig->getOwner(), $this->_iTypeId, 1, self::ORDER, self::LICENSE);
    }

    protected function _entries()
    {
        return (int)$this->_oDb->getOne("SELECT COUNT(*) FROM `bx_donations_entries` WHERE `order`=:order", ['order' => self::ORDER]);
    }

    protected function _cleanup()
    {
        $this->_oDb->query("DELETE FROM `bx_donations_entries` WHERE `order`=:order", ['order' => self::ORDER]);
        $this->_oDb->query("DELETE FROM `bx_donations_entries_deleted` WHERE `order`=:order", ['order' => self::ORDER]);
        $this->_oDb->query("DELETE FROM `bx_donations_types` WHERE `name`=:name", ['name' => self::NAME]);
    }
}
