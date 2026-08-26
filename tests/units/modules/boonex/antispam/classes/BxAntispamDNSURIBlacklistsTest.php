<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Test DNSURI black lists in Antispam module
 */
class BxAntispamDNSURIBlacklistsTest extends BxDolTestCase
{
    protected $_oDNSBlacklists;
    protected $_oDNSURIBlacklists;

    protected function setUp(): void
    {
        $oModule = $this->bxRequireAntispam();

        bx_import('BxDolModule');
        bx_import('DNSBlacklists', $oModule->_aModule);
        bx_import('DNSURIBlacklists', $oModule->_aModule);

        $this->_oDNSBlacklists = bx_instance('BxAntispamDNSBlacklists', array(), $oModule->_aModule);
        $this->_oDNSURIBlacklists = bx_instance('BxAntispamDNSURIBlacklists', array(), $oModule->_aModule);
    }

    protected function tearDown(): void
    {
        unset($this->_oDNSBlacklists);
        unset($this->_oDNSURIBlacklists);
    }

    static public function providerForIsSpam()
    {
        // it is assumed that multi.surbl.org. rule is enabled
        return array(
            array("some text without urls", false), // no spam detection in text without urls
            array("Hello. \nUNA can be found on https://una.io site", false), // no spam for good urls
            array("Hello. \nUNA can be found on <a href=\"https://una.io\">una.io</a> site", false), // no spam for good urls
            array("Hello. \nUNA can be found on <a href='https://una.io'>una.io</a> site", false), // no spam for good urls
//            array("Hello. \nUNA can be found on <a href=https://una.io>una.io</a> site", false), // no spam for good urls
//            array("Hello. \nThere is spam on http://surbl-org-permanent-test-point.com site", true), // text with spammer URL
//            array("Hello. \nThere is spam on <a href=\"http://surbl-org-permanent-test-point.com\">test point</a> site", true), // text with spammer URL
//            array("Hello. \nThere is spam on <a href='http://surbl-org-permanent-test-point.com'>test point</a> site", true), // text with spammer URL
//            array("Hello. \nThere is spam on <a href=http://surbl-org-permanent-test-point.com>test point</a> site", true), // text with spammer URL
        );
    }

    #[DataProvider('providerForIsSpam')]
    public function testIsSpam($sText, $bRes)
    {
        if (!$this->isSurbl())
            $this->markTestSkipped('multi.surbl.org is not enabled.');
        else
            $this->assertEquals($bRes, $this->_oDNSURIBlacklists->isSpam($sText));
    }

    protected function isSurbl()
    {
        $aRules = $this->_oDNSBlacklists->getRules(array(BX_DOL_DNSBL_CHAIN_URIDNS));
        foreach ($aRules as $aRule)
            if ('multi.surbl.org.' == $aRule['zonedomain'])
                return true;
        return false;
    }
}
