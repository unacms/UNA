<?php

use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Test Antispam module
 */
#[AllowMockObjectsWithoutExpectations]
class BxAntispamModuleTest extends BxDolTestCase
{
    protected $_sSampleEmail = 'some@email.com';
    protected $_sSampleIP = '0.0.0.0';

    protected $_oModule;

    protected $_oMockIP;
    protected $_oMockDNSBlacklists;
    protected $_oMockDNSURIBlacklists;
    protected $_oMockStopForumSpam;
    protected $_oMockAkismet;

    protected function setUp(): void
    {
        $this->_oModule = $this->bxRequireAntispam();

        $this->_oMockIP = $this->bxMockGet('BxAntispamIP', $this->_oModule->_aModule);
        $this->_oMockDNSBlacklists = $this->bxMockGet('BxAntispamDNSBlacklists', $this->_oModule->_aModule, true);
        $this->_oMockDNSURIBlacklists = $this->bxMockGet('BxAntispamDNSURIBlacklists', $this->_oModule->_aModule, true);
        $this->_oMockStopForumSpam = $this->bxMockGet('BxAntispamStopForumSpam', $this->_oModule->_aModule);
        $this->_oMockAkismet = $this->bxMockGet('BxAntispamAkismet', $this->_oModule->_aModule);
    }

    protected function tearDown(): void
    {
        if ($this->_oMockIP)
            $this->bxMockFree($this->_oMockIP);
        if ($this->_oMockDNSBlacklists)
            $this->bxMockFree($this->_oMockDNSBlacklists);
        if ($this->_oMockDNSURIBlacklists)
            $this->bxMockFree($this->_oMockDNSURIBlacklists);
        if ($this->_oMockStopForumSpam)
            $this->bxMockFree($this->_oMockStopForumSpam);
        if ($this->_oMockAkismet)
            $this->bxMockFree($this->_oMockAkismet);

        if ($this->_oModule && $this->_oModule->_oConfig)
            $this->_oModule->_oConfig->restoreAntispamOptions();
    }

    static public function providerForServiceIsSpam()
    {
        $any = null;//'ANY';
        return array(
            array(true, $any, $any, $any, $any, $any, $any, false), // no spam detection for admin account
//            array(false, true, $any, $any, $any, $any, $any, false), // no spam detection for whitelisted IP

//            array(false, false, 'on', false, $any, $any, 'on', false), // no spam detection if not listed in URIDNSBL (in "blocking" mode)
//            array(false, false, 'on', true, $any, $any, 'on', true), // it is spam if listed in URIDNSBL (in "blocking" mode)

//            array(false, false, '', $any, 'on', false, 'on', false), // no spam detection if not listed in Akismet (in "blocking" mode)
//            array(false, false, '', $any, 'on', true, 'on', true), // it is spam if listed in Akismet (in "blocking" mode)

//            array(false, false, 'on', true, 'on', true, '', false), // no spam detection in URIDNSBL nor Akismet if not in "blocking" mode
        );
    }

    #[DataProvider('providerForServiceIsSpam')]
    public function testServiceIsSpam($isAdmin, $bIpWhitelisted, $sUriDnsblEnable, $bUriDnsblBlacklisted, $sAkismetlEnable, $bAkismetBlacklisted, $sBlock, $bRes)
    {
        $this->_oModule->_oConfig->setAntispamOption('antispam_report', ''); // turn off reporting during testing
        $this->_oModule->_oConfig->setAntispamOption('uridnsbl_enable', $sUriDnsblEnable);
        $this->_oModule->_oConfig->setAntispamOption('akismet_enable', $sAkismetlEnable);
        $this->_oModule->_oConfig->setAntispamOption('antispam_block', $sBlock);

        $GLOBALS['logged']['admin'] = $isAdmin;

        if ($isAdmin) { // if admin no futher call are performed
            $this->_oMockIP->expects($this->never())->method('isIpWhitelisted');
            $this->_oMockDNSURIBlacklists->expects($this->never())->method('isSpam');
            $this->_oMockAkismet->expects($this->never())->method('isSpam');
        } else { // if not admin then check for whitelisting
            $this->_oMockIP->expects($this->once())->method('isIpWhitelisted')
                ->willReturn($bIpWhitelisted);
        }

        if ('on' != $sUriDnsblEnable || $isAdmin || $bIpWhitelisted) { // don't check in DNDBL if anything is true
            $this->_oMockDNSURIBlacklists->expects($this->never())->method('isSpam');
        } else { // check in URIDNSBL if URIDNSBL is enabled, not admin and IP is not whitelisted
            $this->_oMockDNSURIBlacklists->expects($this->once())->method('isSpam')
                ->willReturn($bUriDnsblBlacklisted);
        }

        if ('on' != $sAkismetlEnable || $isAdmin || $bIpWhitelisted || ($bUriDnsblBlacklisted && $sUriDnsblEnable)) { // don't check in Akismet if anything is true
            $this->_oMockAkismet->expects($this->never())->method('isSpam');
        } else { // check in Akismet if Akismet is enabled, not admin, IP is not whitelisted and not previouslu detected in DNSBL
            $this->_oMockAkismet->expects($this->once())->method('isSpam')
                ->willReturn($bAkismetBlacklisted);
        }

        // check result boolean value
        $sContent = 'test';
        $this->assertEquals($bRes, $this->_oModule->serviceIsSpam($sContent, $this->_sSampleIP));
    }

    static public function providerForServiceCheckJoin()
    {
        $any = null;//'ANY';
        return array(
            array(true, $any, $any, $any, $any, false, false), // join is NOT allowed for blocked IPs
            array(false, '', $any, $any, false, false, true), // join is allowed if IP isn't blocked, DNSBL checking disabled, not listed in StopForumSpam
            array(false, 'on', 'approval', false, false, false, true), // join is allowed if IP isn't blocked and DNSBL enabled in "approval" mode, but not listed
            array(false, 'on', 'block', false, false, false, true), // join is allowed if IP isn't blocked and DNSBL enabled in "block", but not listed
//            array(false, 'on', 'approval', true, false, true, true), // join is allowed if IP isn't blocked and DNSBL enabled in "approval" and IP listed
//            array(false, 'on', 'block', true, $any, false, false), // join is NOT allowed if IP isn't blocked and DNSBL enabled in "block" and IP listed
            array(false, '', $any, $any, true, false, false), // join is NOT allowed if IP isn't blocked but listed in StopForumSpam
        );
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    #[DataProvider('providerForServiceCheckJoin')]
    public function testServiceCheckJoin($bIpBlocked, $sDnsblEnable, $sDnsblBehaviour, $bDnsblIpBlacklisted, $bStopForumSpamSpammer, $bResultSetApprove, $bResultEmptyString)
    {
        // save exception handler
        $previousHandler = set_exception_handler(function () {});

        try {

            // set different options
            $this->_oModule->_oConfig->setAntispamOption('dnsbl_enable', $sDnsblEnable);
            $this->_oModule->_oConfig->setAntispamOption('dnsbl_behaviour_join', $sDnsblBehaviour);

            // first IP address block checking is called
            $this->_oMockIP->expects($this->once())->method('isIpBlocked')
                ->with($this->equalTo($this->_sSampleIP))
                ->willReturn($bIpBlocked);

            if ($bIpBlocked) { // if ip is blocked no other methods should be called

                $this->_oMockDNSBlacklists->expects($this->never())->method('dnsbl_lookup_ip');
                $this->_oMockStopForumSpam->expects($this->never())->method('isSpammer');

            } elseif (!$bIpBlocked) { // if ip is NOT blocked - perform further checks

                if ('on' != $sDnsblEnable) { // DNSBL shouldn't be called if it isn't enabled
                    $this->_oMockDNSBlacklists->expects($this->never())->method('dnsbl_lookup_ip');
                } elseif ('on' == $sDnsblEnable) {
    /*
                    $this->_oMockDNSBlacklists->expects($this->at(0))->method('dnsbl_lookup_ip')
                        ->with($this->equalTo(BX_DOL_DNSBL_CHAIN_SPAMMERS), $this->equalTo($this->_sSampleIP))
                        ->will($this->returnValue($bDnsblIpBlacklisted ? BX_DOL_DNSBL_POSITIVE : BX_DOL_DNSBL_NEGATIVE));
    */
                    $this->_oMockDNSBlacklists->expects($this->atLeastOnce())->method('dnsbl_lookup_ip');
                }

                if ('on' == $sDnsblEnable && $bDnsblIpBlacklisted && 'block' == $sDnsblBehaviour) { // StopForumSpam shouldn't be called if DNSBL detected spam
                    $this->_oMockStopForumSpam->expects($this->never())->method('isSpammer');
                } else {
                    $this->_oMockStopForumSpam->expects($this->once())->method('isSpammer')
                        ->willReturn($bStopForumSpamSpammer);
                }
            }

            // empty string - no spam detected
            $bSetApprove = false;
            $this->assertTrue($bResultEmptyString == ('' == $this->_oModule->serviceCheckJoin($this->_sSampleEmail, $bSetApprove, $this->_sSampleIP)));
            $this->assertTrue($bResultSetApprove == $bSetApprove);
            
        } finally {
            // restore exception handler
            set_exception_handler($previousHandler);
        }
    }

    static public function providerForServiceCheckLogin()
    {
        $any = null;//'ANY';
        return array(
            array(true, $any, $any, $any, false),
            array(false, false, $any, $any, true),
            array(false, true, 'log', false, true),
            array(false, true, 'block', false, true),
            array(false, true, 'log', true, true),
//            array(false, true, 'block', true, false),
        );
    }

    #[RunInSeparateProcess]
    #[PreserveGlobalState(false)]
    #[DataProvider('providerForServiceCheckLogin')]
    public function testServiceCheckLogin($bIpBlocked, $sDnsblEnable, $sDnsblBehaviour, $bDnsblIpBlacklisted, $bResultEmptyString)
    {
        // set different options
        $this->_oModule->_oConfig->setAntispamOption('dnsbl_enable', $sDnsblEnable);
        $this->_oModule->_oConfig->setAntispamOption('dnsbl_behaviour_login', $sDnsblBehaviour);

        // first IP address block checking is called
        $this->_oMockIP->expects($this->once())->method('isIpBlocked')
            ->willReturn($bIpBlocked);

        if ($bIpBlocked || 'on' != $sDnsblEnable) { // if ip is blocked, or DNSBL isn't enabled - DNSBL checking shouldn't be called

            $this->_oMockDNSBlacklists->expects($this->never())->method('dnsbl_lookup_ip');

        } elseif (!$bIpBlocked && 'on' == $sDnsblEnable) { // call DNSBL checking only if enabled and IP isn't already blocked
/*
            $this->_oMockDNSBlacklists->expects($this->at(0))->method('dnsbl_lookup_ip')
                ->with($this->equalTo(BX_DOL_DNSBL_CHAIN_SPAMMERS), $this->_sSampleIP)
                ->will($this->returnValue($bDnsblIpBlacklisted ? BX_DOL_DNSBL_POSITIVE : BX_DOL_DNSBL_NEGATIVE));
*/

            $this->_oMockDNSBlacklists->expects($this->atLeastOnce())->method('dnsbl_lookup_ip');

        }

        // empty string - no spam detected
        $this->assertTrue($bResultEmptyString == ('' == $this->_oModule->serviceCheckLogin($this->_sSampleIP)));
    }

    static public function providerForServiceIsIpDnsBlacklisted()
    {
        return array(
            array(false, false, false),
            //array(true, false, true),
            //array(true, true, false),
            array(false, true, false),
        );
    }

    #[DataProvider('providerForServiceIsIpDnsBlacklisted')]
    public function testServiceIsIpDnsBlacklisted($bDnsblSpammer, $bDnsblWhitelisted, $bRes)
    {
        // check of whitelisting should be called once
        $this->_oMockIP->expects($this->once())->method('isIpWhitelisted')
            ->with($this->equalTo($this->_sSampleIP))
            ->willReturn(false);
/*
        // check in 'spammers' chain
        $this->_oMockDNSBlacklists->expects($this->at(0))->method('dnsbl_lookup_ip')
            ->with($this->equalTo(BX_DOL_DNSBL_CHAIN_SPAMMERS), $this->equalTo($this->_sSampleIP))
            ->will($this->returnValue($bDnsblSpammer ? BX_DOL_DNSBL_POSITIVE : BX_DOL_DNSBL_NEGATIVE));

        if ($bDnsblSpammer) { // if found in 'spammers' chain, then check if it is whitelisted in 'whitelist' chain
            $this->_oMockDNSBlacklists->expects($this->at(1))->method('dnsbl_lookup_ip')
                ->with($this->equalTo(BX_DOL_DNSBL_CHAIN_WHITELIST), $this->equalTo($this->_sSampleIP))
                ->will($this->returnValue($bDnsblWhitelisted ? BX_DOL_DNSBL_POSITIVE : BX_DOL_DNSBL_NEGATIVE));
        }
*/

        $this->_oMockDNSBlacklists
            ->expects($this->exactly($bDnsblSpammer ? 2 : 1))
            ->method('dnsbl_lookup_ip');

        // check result boolean value
        $this->assertEquals($bRes, $this->_oModule->serviceIsIpDnsBlacklisted($this->_sSampleIP));
    }

    public function testServiceIsIpDnsBlacklistedWhenIpIsWhiletisted()
    {
        $this->_oMockIP->expects($this->once())->method('isIpWhitelisted')
            ->willReturn(true);
        $this->_oMockDNSBlacklists->expects($this->never())->method('dnsbl_lookup_ip');

        $this->assertEquals(false, $this->_oModule->serviceIsIpDnsBlacklisted($this->_sSampleIP));
    }

    public function testServiceIsIpWhitelisted()
    {
        $this->_oMockIP->expects($this->once())->method('isIpWhitelisted');

        $this->_oModule->serviceIsIpWhitelisted($this->_sSampleIP);
    }

    public function testServiceIsIpBlocked()
    {
        $this->_oMockIP->expects($this->once())->method('isIpBlocked');

        $this->_oModule->serviceIsIpBlocked($this->_sSampleIP);
    }

    public function testServiceBlockIp()
    {
        $this->_oMockIP->expects($this->once())->method('blockIp');

        $this->_oModule->serviceBlockIp($this->_sSampleIP);
    }
}
