<?php

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Referrer hosts, UTM parameters, click ids and the channel of a session.
 */
class BxAnalyticsSourceTest extends \PHPUnit\Framework\TestCase
{
    protected $_aHosts = ['una.example.com'];

    public static function setUpBeforeClass(): void
    {
        require_once BX_DIRECTORY_PATH_MODULES . 'boonex/analytics/classes/BxAnalyticsSource.php';
    }

    public static function providerChannels()
    {
        return [
            'no referrer' => ['', 'https://una.example.com/', 'direct', ''],
            'search engine' => ['https://www.google.com/', 'https://una.example.com/', 'search', 'google.com'],
            'country search domain' => ['https://www.google.co.uk/search?q=una', 'https://una.example.com/', 'search', 'google.co.uk'],
            'social' => ['https://t.co/abc', 'https://una.example.com/', 'social', 't.co'],
            'facebook link shim' => ['https://l.facebook.com/l.php?u=x', 'https://una.example.com/p?fbclid=abc', 'social', 'l.facebook.com'],
            'AI assistant' => ['https://chatgpt.com/', 'https://una.example.com/?utm_source=chatgpt.com', 'ai', 'chatgpt.com'],
            'other site' => ['https://someblog.net/2026/10/post?x=1', '', 'referral', 'someblog.net'],
            'own site' => ['https://una.example.com/feed', 'https://una.example.com/post/1', 'internal', ''],
            'newsletter' => ['', 'https://una.example.com/?utm_source=newsletter&utm_medium=email', 'email', ''],
            'paid social by medium' => ['', 'https://una.example.com/?utm_source=facebook&utm_medium=paid_social', 'paid_social', ''],
            'paid search by click id' => ['', 'https://una.example.com/?gclid=xyz', 'paid_search', ''],
            'explicit medium beats a click id' => ['', 'https://una.example.com/?utm_medium=email&gclid=xyz', 'email', ''],
            'cpc from a search engine' => ['https://www.bing.com/', 'https://una.example.com/?utm_medium=cpc', 'paid_search', 'bing.com'],
            'ref parameter' => ['', 'https://una.example.com/?ref=producthunt', 'campaign', ''],
            'Android app referrer' => ['android-app://com.google.android.gm', '', 'email', 'com.google.android.gm'],
        ];
    }

    #[DataProvider('providerChannels')]
    public function testClassify($sReferrer, $sUrl, $sChannel, $sHost)
    {
        $a = BxAnalyticsSource::classify($sReferrer, $sUrl, $this->_aHosts);

        $this->assertSame($sChannel, $a['channel']);
        $this->assertSame($sHost, $a['referrer_host']);
    }

    public function testUtmAndReferrerAreStored()
    {
        $a = BxAnalyticsSource::classify('https://www.example.org/path/page?secret=1#top', 'https://una.example.com/?utm_source=nl&utm_medium=email&utm_campaign=oct&utm_term=t&utm_content=c', $this->_aHosts);

        $this->assertSame('example.org/path/page', $a['referrer'], 'scheme, www, query and fragment are dropped');
        $this->assertSame(['nl', 'email', 'oct', 't', 'c'], [$a['utm_source'], $a['utm_medium'], $a['utm_campaign'], $a['utm_term'], $a['utm_content']]);
    }

    public function testHost()
    {
        $this->assertSame('example.com', BxAnalyticsSource::host('https://WWW.Example.com./x'));
        $this->assertSame('', BxAnalyticsSource::host(''));
        $this->assertSame('', BxAnalyticsSource::host('javascript:alert(1)'));
    }
}
