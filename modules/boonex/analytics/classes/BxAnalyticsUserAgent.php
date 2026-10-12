<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Analytics Analytics
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * User agent parser for web analytics: browser, operating system, device type and bots.
 *
 * Covers the browsers, systems and devices that make up nearly all real traffic. Rules are
 * checked in order, so a token shared by several browsers (Chrome, Safari) comes last.
 * Native app hits carry their own system and device fields and don't depend on this class.
 */
class BxAnalyticsUserAgent
{
    const DEVICE_DESKTOP = 'desktop';
    const DEVICE_MOBILE = 'mobile';
    const DEVICE_TABLET = 'tablet';
    const DEVICE_TV = 'tv';
    const DEVICE_CONSOLE = 'console';
    const DEVICE_BOT = 'bot';

    /**
     * Crawlers, link previews, monitoring and HTTP libraries. A browser never sends these tokens.
     */
    protected static $_sBotsPattern = '/(?<!cu)bot\b|(?<!cu)bot\/|crawl|spider|slurp|mediapartners|adsbot|facebookexternalhit|facebookcatalog|meta-externalagent|embedly|quora link preview|outbrain|pinterest\/|vkshare|w3c_validator|whatsapp|telegrambot|discordbot|slackbot|skypeuripreview|bitlybot|headlesschrome|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|site24x7|datadog|newrelic|python-requests|python-urllib|aiohttp|httpx|curl\/|wget\/|libwww|httpclient|go-http-client|java\/|axios\/|node-fetch|undici|guzzlehttp|okhttp\/[0-9.]+$|scrapy|feedfetcher|rss|preview|archive\.org|ia_archiver|gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|perplexitybot|ccbot|bytespider|amazonbot|applebot|petalbot|semrush|ahrefs|mj12bot|dotbot|yandex(bot|images|metrika)|baiduspider|sogou|exabot|seznambot|bingpreview|google-inspectiontool|googleother|storebot/i';

    /**
     * Browsers as [name, pattern with the version in the first group]. Order matters.
     */
    protected static $_aBrowsers = [
        ['Edge', '/\bEdg(?:e|A|iOS)?\/([\d.]+)/'],
        ['Opera', '/\b(?:OPR|OPiOS|OPT)\/([\d.]+)/'],
        ['Opera', '/\bOpera(?:.*Version)?[\/ ]([\d.]+)/'],
        ['Samsung Internet', '/\bSamsungBrowser\/([\d.]+)/'],
        ['Yandex Browser', '/\bYaBrowser\/([\d.]+)/'],
        ['UC Browser', '/\bUC ?Browser\/([\d.]+)/'],
        ['Vivaldi', '/\bVivaldi\/([\d.]+)/'],
        ['DuckDuckGo', '/\b(?:DuckDuckGo|Ddg)\/([\d.]+)/'],
        ['Huawei Browser', '/\bHuaweiBrowser\/([\d.]+)/'],
        ['MIUI Browser', '/\bMiuiBrowser\/([\d.]+)/'],
        ['Facebook', '/\bFBAV\/([\d.]+)/'],
        ['Instagram', '/\bInstagram ([\d.]+)/'],
        ['TikTok', '/\b(?:musical_ly|BytedanceWebview|TikTok)[_\/ ]([\d.]+)/'],
        ['Firefox', '/\b(?:Firefox|FxiOS)\/([\d.]+)/'],
        ['Chrome', '/\bCriOS\/([\d.]+)/'],
        ['Android WebView', '/; wv\).*Chrome\/([\d.]+)/'],
        ['Chrome', '/\b(?:Chrome|Chromium)\/([\d.]+)/'],
        ['Safari', '/\bVersion\/([\d.]+).*Safari\//'],
        ['iOS WebView', '/\b(?:iPhone|iPad|iPod).*AppleWebKit\/[\d.]+()/'],
        ['Internet Explorer', '/\b(?:MSIE |Trident\/.*rv:)([\d.]+)/'],
    ];

    /**
     * Operating systems as [name, pattern with an optional version in the first group]. Order matters.
     */
    protected static $_aSystems = [
        ['iPadOS', '/\biPad.*?OS ([\d_]+)/'],
        ['iOS', '/\b(?:iPhone|iPod).*?OS ([\d_]+)/'],
        ['iOS', '/\b(?:iPhone|iPad|iPod)\b()/'],
        ['HarmonyOS', '/\bHarmonyOS ?([\d.]*)/'],
        ['Android', '/\bAndroid[ \/]?([\d.]*)/'],
        ['Windows Phone', '/\bWindows Phone(?: OS)? ([\d.]+)/'],
        ['Windows', '/\bWindows NT ([\d.]+)/'],
        ['Windows', '/\bWindows\b()/'],
        ['Chrome OS', '/\bCrOS \S+ ([\d.]+)/'],
        ['macOS', '/\bMac OS X ([\d_.]+)/'],
        ['macOS', '/\bMacintosh\b()/'],
        ['KaiOS', '/\bKAIOS\/([\d.]+)/i'],
        ['Tizen', '/\bTizen ?([\d.]*)/'],
        ['webOS', '/\b(?:web0s|webos)\b()/i'],
        ['PlayStation', '/\bPlayStation ?([\d.]*)/'],
        ['Xbox', '/\bXbox\b()/'],
        ['Ubuntu', '/\bUbuntu\b()/'],
        ['Linux', '/\bLinux\b()/'],
        ['FreeBSD', '/\bFreeBSD\b()/'],
    ];

    /**
     * Windows NT kernel versions; 10.0 covers both Windows 10 and 11.
     */
    protected static $_aWindowsVersions = [
        '10.0' => '10',
        '6.3' => '8.1',
        '6.2' => '8',
        '6.1' => '7',
        '6.0' => 'Vista',
        '5.1' => 'XP',
    ];

    /**
     * Parse a user agent string.
     *
     * @param string $sUserAgent the User-Agent header
     * @return array with keys browser, browser_version, os, os_version, device and bot
     */
    public static function parse($sUserAgent)
    {
        $sUserAgent = trim((string)$sUserAgent);

        $aResult = [
            'browser' => '',
            'browser_version' => '',
            'os' => '',
            'os_version' => '',
            'device' => self::DEVICE_DESKTOP,
            'bot' => false,
        ];

        if($sUserAgent === '' || self::isBot($sUserAgent)) {
            $aResult['device'] = self::DEVICE_BOT;
            $aResult['bot'] = true;
            return $aResult;
        }

        foreach(self::$_aBrowsers as list($sName, $sPattern))
            if(preg_match($sPattern, $sUserAgent, $aMatch)) {
                $aResult['browser'] = $sName;
                $aResult['browser_version'] = self::_majorMinor($aMatch[1]);
                break;
            }

        foreach(self::$_aSystems as list($sName, $sPattern))
            if(preg_match($sPattern, $sUserAgent, $aMatch)) {
                $aResult['os'] = $sName;
                $aResult['os_version'] = self::_systemVersion($sName, isset($aMatch[1]) ? $aMatch[1] : '');
                break;
            }

        $aResult['device'] = self::_device($sUserAgent, $aResult['os']);

        return $aResult;
    }

    /**
     * Whether a user agent belongs to a crawler, a link preview, a monitor or an HTTP library.
     */
    public static function isBot($sUserAgent)
    {
        $sUserAgent = trim((string)$sUserAgent);
        if($sUserAgent === '')
            return true;

        return (bool)preg_match(self::$_sBotsPattern, $sUserAgent);
    }

    protected static function _device($sUserAgent, $sOs)
    {
        if(preg_match('/\b(?:SmartTV|SMART-TV|Smart TV|AppleTV|Apple TV|GoogleTV|Android TV|BRAVIA|HbbTV|NetCast|Web0S|webOS TV|Tizen.*TV|CrKey|AFT[A-Z]+|Roku)\b/i', $sUserAgent))
            return self::DEVICE_TV;

        if(preg_match('/\b(?:PlayStation|Xbox|Nintendo)\b/i', $sUserAgent))
            return self::DEVICE_CONSOLE;

        if(preg_match('/\b(?:iPad|Tablet|Kindle|Silk|PlayBook)\b/i', $sUserAgent) || $sOs === 'iPadOS')
            return self::DEVICE_TABLET;

        if($sOs === 'Android' && stripos($sUserAgent, 'Mobile') === false)
            return self::DEVICE_TABLET;

        if(preg_match('/Mobi|iPhone|iPod|Windows Phone|Opera Mini|BlackBerry|BB10|KAIOS/i', $sUserAgent) || in_array($sOs, ['iOS', 'Android', 'HarmonyOS'], true))
            return self::DEVICE_MOBILE;

        return self::DEVICE_DESKTOP;
    }

    protected static function _systemVersion($sOs, $sVersion)
    {
        $sVersion = str_replace('_', '.', $sVersion);
        if($sOs === 'Windows')
            return isset(self::$_aWindowsVersions[$sVersion]) ? self::$_aWindowsVersions[$sVersion] : '';

        // Safari has reported macOS as 10.15.7 since Big Sur, so the minor version means nothing.
        if($sOs === 'macOS' && bx_mb_strpos($sVersion, '10.15') === 0)
            return '';

        return self::_majorMinor($sVersion);
    }

    protected static function _majorMinor($sVersion)
    {
        $aParts = explode('.', (string)$sVersion);
        if($aParts[0] === '')
            return '';

        return isset($aParts[1]) && $aParts[1] !== '' && $aParts[1] !== '0' ? $aParts[0] . '.' . $aParts[1] : $aParts[0];
    }
}

/** @} */
