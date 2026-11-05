<?php

/**
 * Buyer-safe Stripe settings: `get_provider_public_options` gives a buyer the public key of
 * a seller and nothing else, while `get_provider_options` stays limited to the seller and admins.
 * An existing profile acts as the seller and a visitor who is not the seller (a guest) as the buyer.
 * The seller's Stripe settings are replaced for the test and put back afterwards.
 */
class ProviderPublicOptionsTest extends BxDolIntegrationTestCase
{
    protected $_oModule;
    protected $_oDb;
    protected $_iSeller = 0;
    protected $_aBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_payment'))
            $this->markTestSkipped('bx_payment is not installed');

        $this->_oDb = BxDolDb::getInstance();

        $this->_iSeller = (int)$this->_oDb->getOne("SELECT `id` FROM `sys_profiles` WHERE `type`<>'system' AND `status`='active' ORDER BY `id` ASC LIMIT 1");
        if (!$this->_iSeller)
            $this->markTestSkipped('an active profile is needed');

        $this->_oModule = BxDolModule::getInstance('bx_payment');

        $this->_aBackup = $this->_oDb->getAll("SELECT `tuv`.* FROM `bx_payment_user_values` AS `tuv` INNER JOIN `bx_payment_providers_options` AS `tpo` ON `tuv`.`option_id`=`tpo`.`id` WHERE `tuv`.`user_id`=:user_id AND `tpo`.`name` LIKE 'strp\\_v3\\_%'", ['user_id' => $this->_iSeller]);
        $this->_clear();
        $this->_seed(['strp_v3_active' => 'on', 'strp_v3_mode' => '2', 'strp_v3_live_pub_key' => 'pk_live_x', 'strp_v3_live_sec_key' => 'sk_live_x', 'strp_v3_test_pub_key' => 'pk_test_x', 'strp_v3_test_sec_key' => 'sk_test_x']);
    }

    protected function tearDown(): void
    {
        if ($this->_oModule) {
            $this->_clear();
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

    public function testBuyerGetsOnlyPublicKey()
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;

        $aResult = $this->_oModule->serviceGetProviderPublicOptions($this->_iSeller, 'stripe_v3');
        $this->assertSame(['name' => 'stripe_v3', 'public_key' => 'pk_test_x'], $aResult);
        $this->assertStringNotContainsString('sk_', json_encode($aResult));
    }

    public function testBuyerCannotReadFullOptions()
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;

        $this->assertFalse($this->_oModule->serviceGetProviderOptions($this->_iSeller, 'stripe_v3'));
    }

    public function testSellerStillReadsFullOptions()
    {
        $GLOBALS['glForceCurrentProfileId'] = $this->_iSeller;

        $aResult = $this->_oModule->serviceGetProviderOptions($this->_iSeller, 'stripe_v3');
        $this->assertIsArray($aResult);
        $this->assertSame('sk_test_x', $aResult['options']['strp_v3_test_sec_key']['value']);
    }

    public function testBuyerStillChecksProviderPresence()
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;

        $this->assertTrue($this->_oModule->serviceIsProviderOptions($this->_iSeller, 'stripe_v3'));
    }

    public function testOtherProvidersAreNotExposed()
    {
        $GLOBALS['glForceCurrentProfileId'] = 0;

        $this->assertFalse($this->_oModule->serviceGetProviderPublicOptions($this->_iSeller, 'paypal'));
    }

    protected function _seed($aValues)
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

    protected function _clear()
    {
        $this->_oDb->query("DELETE `tuv` FROM `bx_payment_user_values` AS `tuv` INNER JOIN `bx_payment_providers_options` AS `tpo` ON `tuv`.`option_id`=`tpo`.`id` WHERE `tuv`.`user_id`=:user_id AND `tpo`.`name` LIKE 'strp\\_v3\\_%'", ['user_id' => $this->_iSeller]);
    }
}
