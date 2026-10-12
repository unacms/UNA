<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Browser, system, device and bot detection from user agents. Loaded without the module installed.
 */
class BxAnalyticsUserAgentTest extends \PHPUnit\Framework\TestCase
{
    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsUserAgent.php';
    }

    public static function providerBrowsers()
    {
        return [
            'Safari on macOS' => ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'Safari', '17.4', 'macOS', '', 'desktop'],
            'Edge on Windows' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0', 'Edge', '129', 'Windows', '10', 'desktop'],
            'Safari on iPhone' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1', 'Safari', '17.5', 'iOS', '17.5', 'mobile'],
            'Chrome on iPad' => ['Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/128.0.6613.98 Mobile/15E148 Safari/604.1', 'Chrome', '128', 'iPadOS', '16.6', 'tablet'],
            'Chrome on Android phone' => ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36', 'Chrome', '129', 'Android', '14', 'mobile'],
            'Samsung tablet' => ['Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Safari/537.36', 'Samsung Internet', '25', 'Android', '13', 'tablet'],
            'Cubot phone is not a bot' => ['Mozilla/5.0 (Linux; Android 12; Cubot X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', 'Chrome', '120', 'Android', '12', 'mobile'],
            'Firefox on Linux' => ['Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0', 'Firefox', '130', 'Linux', '', 'desktop'],
            'Android WebView' => ['Mozilla/5.0 (Linux; Android 10; K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.81 Mobile Safari/537.36', 'Android WebView', '129', 'Android', '10', 'mobile'],
            'Facebook in-app' => ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/440.0.0.29.107;FBBV/1]', 'Facebook', '440', 'iOS', '17', 'mobile'],
            'webOS TV' => ['Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0 Safari/537.36 WebAppManager', 'Chrome', '94', 'webOS', '', 'tv'],
            'Opera' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/114.0.0.0', 'Opera', '114', 'Windows', '10', 'desktop'],
        ];
    }

    #[DataProvider('providerBrowsers')]
    public function testParse($sUserAgent, $sBrowser, $sBrowserVersion, $sOs, $sOsVersion, $sDevice)
    {
        $a = BxAnalyticsUserAgent::parse($sUserAgent);

        $this->assertSame($sBrowser, $a['browser']);
        $this->assertSame($sBrowserVersion, $a['browser_version']);
        $this->assertSame($sOs, $a['os']);
        $this->assertSame($sOsVersion, $a['os_version']);
        $this->assertSame($sDevice, $a['device']);
        $this->assertFalse($a['bot']);
    }

    public static function providerBots()
    {
        return [
            'empty' => [''],
            'Googlebot' => ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
            'headless Chrome' => ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36'],
            'link preview' => ['facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'],
            'curl' => ['curl/8.4.0'],
            'AI crawler' => ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)'],
            'uptime monitor' => ['Mozilla/5.0+(compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)'],
        ];
    }

    #[DataProvider('providerBots')]
    public function testBots($sUserAgent)
    {
        $a = BxAnalyticsUserAgent::parse($sUserAgent);

        $this->assertTrue($a['bot']);
        $this->assertSame('bot', $a['device']);
        $this->assertTrue(BxAnalyticsUserAgent::isBot($sUserAgent));
    }
}
