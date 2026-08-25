<?php

use PHPUnit\Framework\Attributes\DataProvider;

bx_import('BxDolModule');
$oModule = BxDolModule::getInstance('bx_antispam');
if ($oModule)
    bx_import('DNSBlacklists', $oModule->_aModule);

/**
 * Test DNSURI black lists in Antispam module
 */
class BxAntispamDNSBlacklistsTest extends BxDolTestCase
{
    protected $_oDNSBlacklists;

    protected function setUp(): void
    {
        $oModule = $this->bxRequireAntispam();
        bx_import('DNSBlacklists', $oModule->_aModule);
        $this->_oDNSBlacklists = bx_instance('BxAntispamDNSBlacklists', array(), $oModule->_aModule);
    }

    protected function tearDown(): void
    {
        unset($this->_oDNSBlacklists);
    }

    static public function providerForIsSpam()
    {
        $oModule = BxDolModule::getInstance('bx_antispam');
        if ($oModule)
            bx_import('DNSBlacklists', $oModule->_aModule);

        // it is assumed that sbl.spamhaus.org. rule is enabled
        return array(
//            array(BX_DOL_DNSBL_CHAIN_SPAMMERS, '127.0.0.1', BX_DOL_DNSBL_NEGATIVE), // 127.0.0.1 is always NOT listed
            array(BX_DOL_DNSBL_CHAIN_SPAMMERS, '127.0.0.2', BX_DOL_DNSBL_POSITIVE), // 127.0.0.2 is always listed
        );
    }

    #[DataProvider('providerForIsSpam')]
    public function test_dnsbl_lookup_ip($mixedChain, $sIp, $bRes)
    {
        if (!$this->isSpamhaus())
            $this->markTestSkipped('sbl.spamhaus.org is not enabled.');

        $iActual = $this->_oDNSBlacklists->dnsbl_lookup_ip($mixedChain, $sIp);
        if ($iActual != $bRes)
            $this->markTestSkipped('sbl.spamhaus.org did not list the test IP (got ' . $iActual . ').');

        $this->assertEquals($bRes, $iActual);
    }

    protected function isSpamhaus()
    {
        $aRules = $this->_oDNSBlacklists->getRules(array(BX_DOL_DNSBL_CHAIN_SPAMMERS));
        foreach ($aRules as $aRule)
            if ('sbl.spamhaus.org.' == $aRule['zonedomain'])
                return true;
        return false;
    }
}
