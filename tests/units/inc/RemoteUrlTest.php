<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Remote fetches refuse private and non-http targets (GHSA-mf88-2949-fv36).
 */
class RemoteUrlTest extends BxDolTestCase
{
    #[DataProvider('providerForBlocked')]
    public function testBlocksUnroutableTargets($sUrl)
    {
        $aUrl = parse_url($sUrl);
        $sHost = isset($aUrl['host']) ? $aUrl['host'] : '';
        if (isset($sHost[0]) && $sHost[0] === '[')
            $sHost = trim($sHost, '[]');
        $iPort = isset($aUrl['port']) ? (int)$aUrl['port'] : ((isset($aUrl['scheme']) && strtolower($aUrl['scheme']) === 'https') ? 443 : 80);

        if ($sHost !== '' && bx_remote_url_is_site($sHost, $iPort))
            $this->assertTrue(bx_remote_url_is_allowed($sUrl));
        else
            $this->assertFalse(bx_remote_url_is_allowed($sUrl));
    }

    static public function providerForBlocked()
    {
        return [
            ['http://127.0.0.1/'],
            ['http://127.0.0.1:8080/latest'],
            ['http://10.0.0.5/'],
            ['http://172.16.0.1/'],
            ['http://192.168.1.1/'],
            ['http://169.254.169.254/latest/meta-data/'],
            ['http://0.0.0.0/'],
            ['http://2130706433/'],
            ['http://0177.0.0.1/'],
            ['http://127.1/'],
            ['http://0x7f.0.0.1/'],
            ['http://0x7f000001/'],
            ['http://[::1]/'],
            ['http://[::ffff:127.0.0.1]/'],
            ['http://[::ffff:169.254.169.254]/'],
            ['http://224.0.0.1/'],
            ['http://100.64.0.1/'],
            ['http://user:pass@1.1.1.1/'],
            ['http://1.1.1.1@169.254.169.254/'],
            ['file:///etc/passwd'],
            ['php://filter/resource=/etc/passwd'],
            ['ftp://1.1.1.1/file'],
            ['gopher://1.1.1.1/'],
            ['http://127.0.0.1%2e1/'],
            ["http://1.1.1.1/\r\nHost:127.0.0.1"],
            [''],
        ];
    }

    #[DataProvider('providerForAllowed')]
    public function testAllowsGlobalAddresses($sUrl)
    {
        $this->assertTrue(bx_remote_url_is_allowed($sUrl));
    }

    static public function providerForAllowed()
    {
        return [
            ['http://1.1.1.1/'],
            ['https://8.8.8.8/dns-query'],
            ['http://1.1.1.1:8080/path?q=1'],
        ];
    }

    public function testFetchStopsBeforeALoopbackConnection()
    {
        $sCode = 'unset';
        $mResult = bx_file_get_contents('http://169.254.169.254/latest/meta-data/', [], 'get', [], $sCode);
        $this->assertFalse($mResult);
        $this->assertSame(0, $sCode);
    }

    public function testRedirectTargetIsCheckedAgain()
    {
        $this->assertSame(
            'http://169.254.169.254/latest/meta-data/',
            bx_remote_redirect_url('https://1.1.1.1/preview', 'http://169.254.169.254/latest/meta-data/')
        );
        $this->assertFalse(bx_remote_url_is_allowed(
            bx_remote_redirect_url('https://1.1.1.1/preview', 'http://169.254.169.254/latest/meta-data/')
        ));

        $sNext = bx_remote_redirect_url('https://1.1.1.1/a/b', '/secret');
        $this->assertSame('https://1.1.1.1/secret', $sNext);
        $this->assertTrue(bx_remote_url_is_allowed($sNext));

        $sInternal = bx_remote_redirect_url('https://1.1.1.1/a/b', 'http://10.1.1.1/');
        $this->assertFalse(bx_remote_url_is_allowed($sInternal));
    }

    public function testIpv4ObfuscationLandsOnLoopback()
    {
        $this->assertSame('127.0.0.1', bx_host_to_ipv4('2130706433'));
        $this->assertSame('127.0.0.1', bx_host_to_ipv4('0177.0.0.1'));
        $this->assertSame('127.0.0.1', bx_host_to_ipv4('127.1'));
        $this->assertSame('127.0.0.1', bx_host_to_ipv4('0x7f000001'));
        $this->assertNull(bx_host_to_ipv4('example.com'));
    }
}
