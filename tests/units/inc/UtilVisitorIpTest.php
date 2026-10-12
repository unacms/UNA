<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Visitor address behind proxies: getVisitorIP and the address helpers it uses.
 */
class UtilVisitorIpTest extends \PHPUnit\Framework\TestCase
{
    protected $_aServerBackup;

    protected function setUp(): void
    {
        $this->_aServerBackup = $_SERVER;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->_aServerBackup;
    }

    #[DataProvider('providerForGetVisitorIp')]
    public function testGetVisitorIp($aServer, $aTrustedProxies, $sOut)
    {
        $this->assertSame($sOut, bx_get_visitor_ip($aServer, $aTrustedProxies));
    }

    static public function providerForGetVisitorIp()
    {
        return [
            'direct visitor' => [['REMOTE_ADDR' => '81.2.69.142'], [], '81.2.69.142'],
            'direct IPv6 visitor' => [['REMOTE_ADDR' => '2001:4860:4860::8888'], [], '2001:4860:4860::8888'],
            'direct visitor on a private network' => [['REMOTE_ADDR' => '192.168.1.20'], [], '192.168.1.20'],
            'direct visitor can not spoof X-Forwarded-For' => [['REMOTE_ADDR' => '81.2.69.142', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8'], [], '81.2.69.142'],
            'direct visitor can not spoof CF-Connecting-IP' => [['REMOTE_ADDR' => '81.2.69.142', 'HTTP_CF_CONNECTING_IP' => '8.8.8.8'], [], '81.2.69.142'],
            'direct visitor can not spoof Client-IP' => [['REMOTE_ADDR' => '81.2.69.142', 'HTTP_CLIENT_IP' => '8.8.8.8'], [], '81.2.69.142'],
            'private proxy chain' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, 10.0.0.1, 10.0.0.2'], [], '93.184.216.34'],
            'private hop first in the chain' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '192.168.1.2, 93.184.216.34'], [], '93.184.216.34'],
            'loopback proxy' => [['REMOTE_ADDR' => '127.0.0.1', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], '93.184.216.34'],
            'IPv6 loopback proxy' => [['REMOTE_ADDR' => '::1', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], '93.184.216.34'],
            'shared address proxy (Railway)' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], '93.184.216.34'],
            'X-Forwarded-For sent by the visitor through a proxy' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 81.2.69.142'], [], '81.2.69.142'],
            'private address sent by the visitor through a proxy' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_X_FORWARDED_FOR' => '10.0.0.9, 81.2.69.142'], [], '81.2.69.142'],
            'CF-Connecting-IP sent by the visitor through a proxy' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_CF_CONNECTING_IP' => '8.8.8.8', 'HTTP_X_FORWARDED_FOR' => '81.2.69.142'], [], '81.2.69.142'],
            'X-Real-IP sent by the visitor through a proxy' => [['REMOTE_ADDR' => '172.16.0.2', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34', 'HTTP_X_REAL_IP' => '81.2.69.142'], [], '93.184.216.34'],
            'X-Real-IP without X-Forwarded-For' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_X_REAL_IP' => '93.184.216.34'], [], '93.184.216.34'],
            'True-Client-IP without X-Forwarded-For' => [['REMOTE_ADDR' => '172.16.0.2', 'HTTP_TRUE_CLIENT_IP' => '81.2.69.142', 'HTTP_X_REAL_IP' => '93.184.216.34'], [], '81.2.69.142'],
            'CF-Connecting-IP without X-Forwarded-For' => [['REMOTE_ADDR' => '172.16.0.2', 'HTTP_CF_CONNECTING_IP' => '2001:4860:4860::8888', 'HTTP_TRUE_CLIENT_IP' => '81.2.69.142'], [], '2001:4860:4860::8888'],
            'Client-IP is not a proxy header' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_CLIENT_IP' => '93.184.216.34'], [], '10.0.0.5'],
            'Cloudflare behind a load balancer, ranges listed' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34, 173.245.48.10'], ['173.245.48.0/20'], '93.184.216.34'],
            'Cloudflare behind a load balancer, ranges not listed' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34, 173.245.48.10'], [], '173.245.48.10'],
            'Cloudflare in front of the site' => [['REMOTE_ADDR' => '173.245.48.10', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34'], ['173.245.48.0/20'], '93.184.216.34'],
            'trusted public proxy' => [['REMOTE_ADDR' => '173.245.48.10', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34'], ['173.245.48.0/20'], '93.184.216.34'],
            'trusted IPv6 proxy' => [['REMOTE_ADDR' => '2400:cb00::1', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], ['2400:cb00::/32'], '93.184.216.34'],
            'untrusted public proxy' => [['REMOTE_ADDR' => '173.245.48.10', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34'], ['103.21.244.0/22'], '173.245.48.10'],
            'IPv4 address with a port' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34:51234'], [], '93.184.216.34'],
            'IPv6 address with a port' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '[2606:4700:4700::1111]:443'], [], '2606:4700:4700::1111'],
            'trailing comma' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, '], [], '93.184.216.34'],
            'garbage header falls back to the proxy' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => 'unknown, <script>'], [], '10.0.0.5'],
            'unknown hop stops the walk' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, unknown, 10.0.0.2'], [], '10.0.0.2'],
            'private network only' => [['REMOTE_ADDR' => '172.18.0.4', 'HTTP_X_FORWARDED_FOR' => '192.168.65.1'], [], '192.168.65.1'],
            'private chain gives the farthest address' => [['REMOTE_ADDR' => '172.18.0.4', 'HTTP_X_FORWARDED_FOR' => '10.1.1.1, 10.0.0.2'], [], '10.1.1.1'],
            'header that is not a string' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => ['93.184.216.34']], [], '10.0.0.5'],
            'no REMOTE_ADDR' => [['HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], '0.0.0.0'],
            'invalid REMOTE_ADDR' => [['REMOTE_ADDR' => 'unix:', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], '0.0.0.0'],
        ];
    }

    public function testGetVisitorIpReadsTrustedProxiesOption()
    {
        $sKey = 'sys_trusted_proxies';
        $oProp = new ReflectionProperty(BxDolDb::class, '_aParams');
        $aParams = $oProp->getValue();
        $bHad = is_array($aParams) && array_key_exists($sKey, $aParams);
        $sOld = $bHad ? $aParams[$sKey] : null;

        $aServer = ['REMOTE_ADDR' => '173.245.48.10', 'HTTP_CF_CONNECTING_IP' => '93.184.216.34'];
        $aServerBehindBalancer = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, 173.245.48.10'];
        try {
            $aParams[$sKey] = "103.21.244.0/22,\n173.245.48.0/20";
            $oProp->setValue(null, $aParams);
            $this->assertSame('93.184.216.34', bx_get_visitor_ip($aServer));
            $this->assertSame('93.184.216.34', bx_get_visitor_ip($aServerBehindBalancer));

            $aParams[$sKey] = '';
            $oProp->setValue(null, $aParams);
            $this->assertSame('173.245.48.10', bx_get_visitor_ip($aServer));
            $this->assertSame('173.245.48.10', bx_get_visitor_ip($aServerBehindBalancer));
        } finally {
            if ($bHad)
                $aParams[$sKey] = $sOld;
            else
                unset($aParams[$sKey]);
            $oProp->setValue(null, $aParams);
        }
    }

    public function testGetVisitorIpUsesServer()
    {
        $_SERVER = ['REMOTE_ADDR' => '81.2.69.142'];
        $this->assertSame('81.2.69.142', getVisitorIP());

        // a whole X-Forwarded-For list used to fail validation and return 0.0.0.0
        $_SERVER = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, 10.0.0.1'];
        $this->assertSame('93.184.216.34', getVisitorIP());

        unset($_SERVER['REMOTE_ADDR']);
        $this->assertSame('0.0.0.0', getVisitorIP());
    }

    public function testGuestsBehindOneProxyStayApart()
    {
        $_SERVER = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, 10.0.0.1'];
        $sFirst = bx_get_ip_hash(getVisitorIP());

        $_SERVER = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '81.2.69.142, 10.0.0.1'];
        $sSecond = bx_get_ip_hash(getVisitorIP());

        $this->assertNotSame($sFirst, $sSecond);
    }

    #[DataProvider('providerForIpNormalize')]
    public function testIpNormalize($sIn, $sOut)
    {
        $this->assertSame($sOut, bx_ip_normalize($sIn));
    }

    static public function providerForIpNormalize()
    {
        return [
            ['93.184.216.34', '93.184.216.34'],
            [' 93.184.216.34 ', '93.184.216.34'],
            ['93.184.216.34:8080', '93.184.216.34'],
            ['2001:db8::1', '2001:db8::1'],
            ['[2001:db8::1]', '2001:db8::1'],
            ['[2001:db8::1]:443', '2001:db8::1'],
            ['::ffff:93.184.216.34', '::ffff:93.184.216.34'],
            ['93.184.216.34:port', ''],
            ['999.1.1.1', ''],
            ['unknown', ''],
            ['', ''],
            [null, ''],
        ];
    }

    #[DataProvider('providerForIsInternalIp')]
    public function testIsInternalIp($sIp, $bOut)
    {
        $this->assertSame($bOut, bx_is_internal_ip($sIp));
    }

    static public function providerForIsInternalIp()
    {
        return [
            ['10.1.2.3', true],
            ['172.16.0.1', true],
            ['192.168.0.1', true],
            ['127.0.0.1', true],
            ['169.254.1.1', true],
            ['100.64.0.1', true],
            ['100.127.255.255', true],
            ['::1', true],
            ['fd12::1', true],
            ['fe80::1', true],
            ['100.63.255.255', false],
            ['100.128.0.1', false],
            ['93.184.216.34', false],
            ['2606:4700:4700::1111', false],
            ['not-an-ip', false],
        ];
    }

    #[DataProvider('providerForIpInList')]
    public function testIpInList($sIp, $aList, $bOut)
    {
        $this->assertSame($bOut, bx_ip_in_list($sIp, $aList));
    }

    static public function providerForIpInList()
    {
        return [
            'exact address' => ['203.0.113.77', ['203.0.113.77'], true],
            'other address' => ['203.0.113.78', ['203.0.113.77'], false],
            'second entry' => ['203.0.113.77', ['10.0.0.0/8', '203.0.113.0/24'], true],
            'outside the range' => ['203.0.114.1', ['203.0.113.0/24'], false],
            'range not on a byte boundary' => ['10.1.2.3', ['10.0.0.0/9'], true],
            'outside a range not on a byte boundary' => ['10.200.2.3', ['10.0.0.0/9'], false],
            'single address range' => ['203.0.113.77', ['203.0.113.77/32'], true],
            'everything' => ['203.0.113.77', ['0.0.0.0/0'], true],
            'IPv6 range' => ['2001:db8::1', ['2001:db8::/32'], true],
            'outside the IPv6 range' => ['2001:db9::1', ['2001:db8::/32'], false],
            'IPv6 address' => ['2001:db8::1', ['2001:0db8:0000::1'], true],
            'IPv4 address against IPv6 range' => ['10.0.0.1', ['::/0'], false],
            'IPv6 address against IPv4 range' => ['::1', ['0.0.0.0/0'], false],
            'entry with spaces' => ['203.0.113.77', [' 203.0.113.0/24 '], true],
            'prefix too long' => ['203.0.113.77', ['203.0.113.0/33'], false],
            'prefix not a number' => ['203.0.113.77', ['203.0.113.0/x'], false],
            'negative prefix' => ['203.0.113.77', ['203.0.113.0/-1'], false],
            'invalid entry' => ['203.0.113.77', ['example.com', ''], false],
            'invalid address' => ['not-an-ip', ['0.0.0.0/0'], false],
            'empty list' => ['203.0.113.77', [], false],
        ];
    }

    public function testIpBits()
    {
        $this->assertSame('00001010' . '00000000' . '00000001' . '11111111', bx_ip_bits('10.0.1.255'));
        $this->assertSame('0010000000000001' . str_repeat('0', 111) . '1', bx_ip_bits('2001::1'));
        $this->assertSame('', bx_ip_bits('10.0.1'));
        $this->assertSame('', bx_ip_bits(''));
    }

    public function testIpList()
    {
        $this->assertSame(['173.245.48.0/20', '103.21.244.0/22', '2400:cb00::/32', '1.2.3.4'], bx_ip_list(" 173.245.48.0/20,103.21.244.0/22\r\n2400:cb00::/32 ;\n\n1.2.3.4 "));
        $this->assertSame([], bx_ip_list(''));
        $this->assertSame([], bx_ip_list(false));
    }
}
