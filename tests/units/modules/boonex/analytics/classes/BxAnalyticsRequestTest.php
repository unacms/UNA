<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Client address behind proxies, country headers and privacy signals.
 */
class BxAnalyticsRequestTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsConfig.php';
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsRequest.php';
    }

    public static function providerIp()
    {
        return [
            'direct visitor' => [['REMOTE_ADDR' => '81.2.69.142'], [], false, '81.2.69.142'],
            'public client ignores forwarded headers' => [['REMOTE_ADDR' => '81.2.69.142', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8'], [], false, '81.2.69.142'],
            'private proxy with a chain' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34, 10.0.0.1'], [], false, '93.184.216.34'],
            'private hop first in the chain' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '192.168.1.2, 93.184.216.34'], [], false, '93.184.216.34'],
            'Cloudflare header without X-Forwarded-For' => [['REMOTE_ADDR' => '172.16.0.2', 'HTTP_CF_CONNECTING_IP' => '2001:4860:4860::8888'], [], false, '2001:4860:4860::8888'],
            'X-Forwarded-For before a header the proxy may pass through' => [['REMOTE_ADDR' => '172.16.0.2', 'HTTP_CF_CONNECTING_IP' => '8.8.8.8', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], false, '93.184.216.34'],
            'address the client sent is not taken' => [['REMOTE_ADDR' => '127.0.0.1', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34'], [], false, '93.184.216.34'],
            'shared address space of a cloud load balancer' => [['REMOTE_ADDR' => '100.64.0.2', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34'], [], false, '93.184.216.34'],
            'trusted hops skipped from the right' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '8.8.8.8, 93.184.216.34, 81.2.69.10'], ['81.2.69.0/24'], false, '93.184.216.34'],
            'trusted public proxy' => [['REMOTE_ADDR' => '81.2.69.10', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], ['81.2.69.0/24'], false, '93.184.216.34'],
            'request with the API key' => [['REMOTE_ADDR' => '76.76.21.21', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34'], [], true, '93.184.216.34'],
            'address with a port' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '93.184.216.34:51234'], [], false, '93.184.216.34'],
            'garbage header falls back' => [['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => 'unknown, <script>'], [], false, '10.0.0.5'],
            'local network only' => [['REMOTE_ADDR' => '172.18.0.4', 'HTTP_X_FORWARDED_FOR' => '192.168.65.1'], [], false, '192.168.65.1'],
        ];
    }

    #[DataProvider('providerIp')]
    public function testGetIp($aServer, $aTrusted, $bTrustedRequest, $sExpected)
    {
        $this->assertSame($sExpected, (new BxAnalyticsRequest($aServer))->getIp($aTrusted, $bTrustedRequest));
    }

    public function testInList()
    {
        $this->assertTrue(BxAnalyticsRequest::inList('203.0.113.77', ['10.0.0.0/8', '203.0.113.0/24']));
        $this->assertTrue(BxAnalyticsRequest::inList('203.0.113.77', ['203.0.113.77']));
        $this->assertFalse(BxAnalyticsRequest::inList('203.0.114.1', ['203.0.113.0/24']));
        $this->assertTrue(BxAnalyticsRequest::inList('2001:db8::1', ['2001:db8::/32']));
        $this->assertFalse(BxAnalyticsRequest::inList('2001:db9::1', ['2001:db8::/32']));
        $this->assertTrue(BxAnalyticsRequest::inList('10.1.2.3', ['10.0.0.0/9']));
        $this->assertFalse(BxAnalyticsRequest::inList('10.200.2.3', ['10.0.0.0/9']));
        $this->assertFalse(BxAnalyticsRequest::inList('not-an-ip', ['0.0.0.0/0']));
    }

    public function testCountry()
    {
        $this->assertSame('DE', (new BxAnalyticsRequest(['HTTP_CF_IPCOUNTRY' => 'de']))->getCountry());
        $this->assertSame('AU', (new BxAnalyticsRequest(['HTTP_X_VERCEL_IP_COUNTRY' => 'AU']))->getCountry());
        $this->assertSame('', (new BxAnalyticsRequest(['HTTP_CF_IPCOUNTRY' => 'XX']))->getCountry(), 'unknown');
        $this->assertSame('', (new BxAnalyticsRequest(['HTTP_CF_IPCOUNTRY' => 'T1']))->getCountry(), 'Tor');
        $this->assertSame('São Paulo', (new BxAnalyticsRequest(['HTTP_X_VERCEL_IP_CITY' => 'S%C3%A3o%20Paulo']))->getCity());
    }

    public function testLocationFromOneEdgeOnly()
    {
        // behind Vercel, a client adds Cloudflare's headers, which Vercel passes through
        $oRequest = new BxAnalyticsRequest([
            'HTTP_CF_IPCOUNTRY' => 'KP',
            'HTTP_CF_IPCITY' => 'Pyongyang',
            'HTTP_CF_IPLATITUDE' => '39.03',
            'HTTP_CF_IPLONGITUDE' => '125.75',
            'HTTP_X_VERCEL_IP_COUNTRY' => 'DE',
            'HTTP_X_VERCEL_IP_COUNTRY_REGION' => 'BE',
            'HTTP_X_VERCEL_IP_CITY' => 'Berlin',
        ]);
        $this->assertSame('KP', $oRequest->getCountry(), 'any edge: the first header found');
        $this->assertSame(['DE', 'BE', 'Berlin', null], [$oRequest->getCountry('vercel'), $oRequest->getRegion('vercel'), $oRequest->getCity('vercel'), $oRequest->getCoordinates('vercel')]);
        $this->assertSame(['header' => 'HTTP_X_VERCEL_IP_COUNTRY', 'country' => 'DE'], $oRequest->getCountryHeader('vercel'));
        $this->assertSame(['KP', '', 'Pyongyang', [39.0, 125.8]], [$oRequest->getCountry('cloudflare'), $oRequest->getRegion('cloudflare'), $oRequest->getCity('cloudflare'), $oRequest->getCoordinates('cloudflare')]);
        $this->assertSame(['', '', '', null], [$oRequest->getCountry('cloudfront'), $oRequest->getRegion('cloudfront'), $oRequest->getCity('cloudfront'), $oRequest->getCoordinates('cloudfront')]);
        $this->assertSame('', $oRequest->getCountry('unknown'), 'an unknown edge has no headers');

        $oRequest = new BxAnalyticsRequest(['HTTP_CLOUDFRONT_VIEWER_COUNTRY' => 'fr', 'HTTP_CLOUDFRONT_VIEWER_CITY' => 'Lyon', 'HTTP_CLOUDFRONT_VIEWER_LATITUDE' => '45.76', 'HTTP_CLOUDFRONT_VIEWER_LONGITUDE' => '4.83']);
        $this->assertSame(['FR', 'Lyon', [45.8, 4.8]], [$oRequest->getCountry('cloudfront'), $oRequest->getCity('cloudfront'), $oRequest->getCoordinates('cloudfront')]);
    }

    public static function providerPlatform()
    {
        return [
            'cron' => [[], false, false, 'core'],
            'classic page' => [['REQUEST_METHOD' => 'POST'], false, false, 'core-web'],
            'NEO says so' => [['REQUEST_METHOD' => 'GET', 'HTTP_X_NEO_PLATFORM' => 'android'], true, false, 'rn-android'],
            'NEO web server' => [['REQUEST_METHOD' => 'GET'], true, true, 'next-web'],
            'iOS app' => [['REQUEST_METHOD' => 'GET', 'HTTP_ORIGIN' => 'neo://app', 'HTTP_USER_AGENT' => 'NEO/1 CFNetwork/1568 Darwin/24.0.0'], true, false, 'rn-ios'],
            'Android app' => [['REQUEST_METHOD' => 'GET', 'HTTP_ORIGIN' => 'neo://app', 'HTTP_USER_AGENT' => 'okhttp/4.12.0'], true, false, 'rn-android'],
            'other API client' => [['REQUEST_METHOD' => 'GET', 'HTTP_USER_AGENT' => 'curl/8.4.0'], true, false, 'api'],
        ];
    }

    #[DataProvider('providerPlatform')]
    public function testPlatform($aServer, $bApi, $bApiKey, $sExpected)
    {
        $this->assertSame($sExpected, (new BxAnalyticsRequest($aServer))->getPlatform($bApi, $bApiKey));
    }

    public function testPrivacySignals()
    {
        $this->assertTrue((new BxAnalyticsRequest(['HTTP_DNT' => '1']))->isDoNotTrack());
        $this->assertTrue((new BxAnalyticsRequest(['HTTP_SEC_GPC' => '1']))->isDoNotTrack());
        $this->assertFalse((new BxAnalyticsRequest(['HTTP_DNT' => '0']))->isDoNotTrack());

        $this->assertTrue((new BxAnalyticsRequest(['HTTP_SEC_FETCH_SITE' => 'cross-site']))->isCrossSite());
        $this->assertFalse((new BxAnalyticsRequest(['HTTP_SEC_FETCH_SITE' => 'same-origin']))->isCrossSite());
        $this->assertFalse((new BxAnalyticsRequest([]))->isCrossSite(), 'browsers without the header pass');
    }
}
