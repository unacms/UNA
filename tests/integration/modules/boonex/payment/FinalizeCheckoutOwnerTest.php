<?php

/**
 * A browser finalize is checked against the owner of the pending order before the
 * provider runs, so a refused request leaves the pending order as it was (and a charged
 * payment can still be finalized by its owner), while providers that read the order from
 * the payment service itself (PayPal IPN, PayPal API) need no buyer session.
 * Pending orders are seeded with the data `test-fin` and deleted afterwards, and the
 * seller's Stripe settings are replaced for the test and put back afterwards.
 */
class FinalizeCheckoutOwnerTest extends BxDolIntegrationTestCase
{
    protected $_oModule;
    protected $_oDb;
    protected $_iSeller = 0;
    protected $_iClient = 0;
    protected $_iOther = 0;
    protected $_aBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_payment'))
            $this->markTestSkipped('bx_payment is not installed');

        $this->_oDb = BxDolDb::getInstance();

        // the viewer is forced by profile id, which has to be a real profile
        $aProfiles = array_values(array_filter($this->_oDb->getColumn("SELECT `id` FROM `sys_profiles` WHERE `type`<>'system' AND `status`='active' ORDER BY `id` ASC LIMIT 20"), function ($iId) {
            return BxDolProfile::getInstance((int)$iId) !== false;
        }));
        if (count($aProfiles) < 2)
            $this->markTestSkipped('two active profiles are needed');

        $this->_iSeller = $this->_iClient = (int)$aProfiles[0];
        $this->_iOther = (int)$aProfiles[1];

        $this->_oModule = BxDolModule::getInstance('bx_payment');

        $this->_cleanup();
        $this->_aBackup = $this->_oDb->getAll("SELECT `tuv`.* FROM `bx_payment_user_values` AS `tuv` INNER JOIN `bx_payment_providers_options` AS `tpo` ON `tuv`.`option_id`=`tpo`.`id` WHERE `tuv`.`user_id`=:user_id AND `tpo`.`name` LIKE 'strp\\_v3\\_%'", ['user_id' => $this->_iSeller]);
        $this->_clearOptions();
        $this->_seedOptions(['strp_v3_active' => 'on', 'strp_v3_mode' => '2', 'strp_v3_test_pub_key' => 'pk_test_x', 'strp_v3_test_sec_key' => 'sk_test_x']);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_cleanup();
            $this->_clearOptions();
            foreach ($this->_aBackup as $aRow)
                $this->_oDb->query("REPLACE INTO `bx_payment_user_values` SET `user_id`=:user_id, `option_id`=:option_id, `value`=:value", [
                    'user_id' => $aRow['user_id'],
                    'option_id' => $aRow['option_id'],
                    'value' => $aRow['value']
                ]);
        }
        $GLOBALS['glForceCurrentProfileId'] = 0;

        parent::tearDown();
    }

    public function testOwnerMayFinalize()
    {
        $iPendingId = $this->_pending($this->_iClient);

        $GLOBALS['glForceCurrentProfileId'] = $this->_iClient;
        $this->assertTrue($this->_oModule->isFinalizeAllowed($iPendingId));
    }

    public function testOtherMemberAndGuestMayNot()
    {
        $iPendingId = $this->_pending($this->_iClient);

        $GLOBALS['glForceCurrentProfileId'] = $this->_iOther;
        $this->assertFalse($this->_oModule->isFinalizeAllowed($iPendingId));

        $GLOBALS['glForceCurrentProfileId'] = 0;
        $this->assertFalse($this->_oModule->isFinalizeAllowed($iPendingId));
    }

    public function testOrderBeforeJoiningMayBeFinalized()
    {
        $iPendingId = $this->_pending(0);

        $GLOBALS['glForceCurrentProfileId'] = 0;
        $this->assertTrue($this->_oModule->isFinalizeAllowed($iPendingId));
    }

    public function testMissingPendingOrderIsRefused()
    {
        $GLOBALS['glForceCurrentProfileId'] = $this->_iClient;
        $this->assertFalse($this->_oModule->isFinalizeAllowed(0));
        $this->assertFalse($this->_oModule->isFinalizeAllowed(2147483000));
    }

    public function testRefusedFinalizeLeavesPendingOrderUnused()
    {
        $iPendingId = $this->_pending($this->_iClient);

        $GLOBALS['glForceCurrentProfileId'] = $this->_iOther;
        $aResult = $this->_oModule->serviceFinalizeCheckout('stripe_v3', $this->_iSeller, [
            'mode' => 'payment',
            'order_id' => 'pi_test_fin',
            'customer_id' => 'cus_test_fin',
            'pending_id' => $iPendingId,
            'redirect' => ''
        ]);

        $this->assertArrayHasKey('error', $aResult);

        // nothing was written: the owner's own finalize still goes through
        $aPending = $this->_oDb->getRow("SELECT * FROM `bx_payment_transactions_pending` WHERE `id`=:id", ['id' => $iPendingId]);
        $this->assertSame('', $aPending['order']);
        $this->assertSame('', $aPending['error_code']);
        $this->assertSame('', $aPending['error_msg']);
        $this->assertSame(0, (int)$aPending['processed']);
    }

    public function testProvidersReadPendingIdFromTheirOwnData()
    {
        $oStripe = $this->_oModule->getObjectProvider('stripe_v3', $this->_iSeller);
        $this->assertNotFalse($oStripe);
        $aData = ['pending_id' => '42'];
        $this->assertSame(42, $oStripe->getFinalizePendingId($aData));
        $this->assertFalse($oStripe->isFinalizeVerified());

        $oCredits = $this->_oModule->getObjectProvider('credits', $this->_iSeller);
        if ($oCredits !== false) {
            $aData = ['c' => urlencode(base64_encode($this->_iSeller . '|43'))];
            $this->assertSame(43, $oCredits->getFinalizePendingId($aData));
            $this->assertFalse($oCredits->isFinalizeVerified());
        }

        $oPayPal = $this->_oModule->getObjectProvider('paypal', $this->_iSeller);
        if ($oPayPal !== false)
            $this->assertTrue($oPayPal->isFinalizeVerified());
    }

    protected function _pending($iClientId)
    {
        $this->_oDb->query("INSERT INTO `bx_payment_transactions_pending` SET `client_id`=:client_id, `seller_id`=:seller_id, `type`='single', `provider`='stripe_v3', `items`='', `customs`='', `amount`=10, `currency`='USD', `order`='', `data`='test-fin', `date`=UNIX_TIMESTAMP()", [
            'client_id' => $iClientId,
            'seller_id' => $this->_iSeller
        ]);

        return (int)$this->_oDb->lastId();
    }

    protected function _cleanup()
    {
        $this->_oDb->query("DELETE FROM `bx_payment_transactions_pending` WHERE `data`='test-fin'");
    }

    protected function _seedOptions($aValues)
    {
        $aOptions = $this->_oDb->getAll("SELECT `id`, `name` FROM `bx_payment_providers_options` WHERE `name` LIKE 'strp\\_v3\\_%'");
        foreach ($aOptions as $aOption)
            if (isset($aValues[$aOption['name']]))
                $this->_oDb->query("REPLACE INTO `bx_payment_user_values` SET `user_id`=:user_id, `option_id`=:option_id, `value`=:value", [
                    'user_id' => $this->_iSeller,
                    'option_id' => $aOption['id'],
                    'value' => $aValues[$aOption['name']]
                ]);
    }

    protected function _clearOptions()
    {
        $this->_oDb->query("DELETE `tuv` FROM `bx_payment_user_values` AS `tuv` INNER JOIN `bx_payment_providers_options` AS `tpo` ON `tuv`.`option_id`=`tpo`.`id` WHERE `tuv`.`user_id`=:user_id AND `tpo`.`name` LIKE 'strp\\_v3\\_%'", ['user_id' => $this->_iSeller]);
    }
}
