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

    const BOT_SEARCH = 'search';
    const BOT_AI_CRAWLER = 'ai_crawler';
    const BOT_AI_AGENT = 'ai_agent';
    const BOT_SEO = 'seo';
    const BOT_SOCIAL = 'social';
    const BOT_MONITOR = 'monitor';
    const BOT_FEED = 'feed';
    const BOT_SCRIPT = 'script';
    const BOT_OTHER = 'other';

    /**
     * Known bots as [pattern, name, category]. AI agents fetch a page because a person asked
     * an assistant about it; AI crawlers collect pages for training or search indexes.
     */
    protected static $_aBots = [
        ['/ChatGPT-User/i', 'ChatGPT', self::BOT_AI_AGENT],
        ['/Claude-User/i', 'Claude', self::BOT_AI_AGENT],
        ['/Perplexity-User/i', 'Perplexity', self::BOT_AI_AGENT],
        ['/MistralAI-User/i', 'Mistral', self::BOT_AI_AGENT],
        ['/DuckAssistBot/i', 'DuckAssist', self::BOT_AI_AGENT],
        ['/Google-NotebookLM/i', 'NotebookLM', self::BOT_AI_AGENT],
        ['/OAI-SearchBot/i', 'OAI-SearchBot', self::BOT_AI_CRAWLER],
        ['/GPTBot/i', 'GPTBot', self::BOT_AI_CRAWLER],
        ['/Claude-SearchBot/i', 'Claude-SearchBot', self::BOT_AI_CRAWLER],
        ['/ClaudeBot|anthropic-ai|Claude-Web/i', 'ClaudeBot', self::BOT_AI_CRAWLER],
        ['/PerplexityBot/i', 'PerplexityBot', self::BOT_AI_CRAWLER],
        ['/CCBot/i', 'CCBot', self::BOT_AI_CRAWLER],
        ['/Bytespider/i', 'Bytespider', self::BOT_AI_CRAWLER],
        ['/meta-externalagent|meta-externalfetcher/i', 'Meta AI', self::BOT_AI_CRAWLER],
        ['/Amazonbot/i', 'Amazonbot', self::BOT_AI_CRAWLER],
        ['/cohere-ai|cohere-training/i', 'Cohere', self::BOT_AI_CRAWLER],
        ['/Diffbot/i', 'Diffbot', self::BOT_AI_CRAWLER],
        ['/YouBot/i', 'YouBot', self::BOT_AI_CRAWLER],
        ['/AI2Bot/i', 'AI2Bot', self::BOT_AI_CRAWLER],
        ['/Timpibot|ImagesiftBot|Omgilibot|PetalBot.*AI/i', 'Other AI crawler', self::BOT_AI_CRAWLER],
        ['/Googlebot|Google-InspectionTool|GoogleOther|Storebot-Google|AdsBot-Google|Mediapartners-Google/i', 'Googlebot', self::BOT_SEARCH],
        ['/bingbot|BingPreview|msnbot|adidxbot/i', 'Bingbot', self::BOT_SEARCH],
        ['/YandexBot|YandexImages|YandexMetrika|YandexMobileBot/i', 'YandexBot', self::BOT_SEARCH],
        ['/Baiduspider/i', 'Baiduspider', self::BOT_SEARCH],
        ['/DuckDuckBot/i', 'DuckDuckBot', self::BOT_SEARCH],
        ['/Applebot/i', 'Applebot', self::BOT_SEARCH],
        ['/Sogou/i', 'Sogou', self::BOT_SEARCH],
        ['/SeznamBot/i', 'SeznamBot', self::BOT_SEARCH],
        ['/PetalBot/i', 'PetalBot', self::BOT_SEARCH],
        ['/Yeti\//i', 'Naver', self::BOT_SEARCH],
        ['/Qwantbot|Qwantify/i', 'Qwant', self::BOT_SEARCH],
        ['/MojeekBot/i', 'Mojeek', self::BOT_SEARCH],
        ['/coccocbot/i', 'Coc Coc', self::BOT_SEARCH],
        ['/Exabot/i', 'Exabot', self::BOT_SEARCH],
        ['/AhrefsBot|AhrefsSiteAudit/i', 'Ahrefs', self::BOT_SEO],
        ['/SemrushBot|SiteAuditBot/i', 'Semrush', self::BOT_SEO],
        ['/MJ12bot/i', 'Majestic', self::BOT_SEO],
        ['/DotBot/i', 'Moz', self::BOT_SEO],
        ['/rogerbot/i', 'Moz', self::BOT_SEO],
        ['/Screaming Frog/i', 'Screaming Frog', self::BOT_SEO],
        ['/BLEXBot/i', 'BLEXBot', self::BOT_SEO],
        ['/DataForSeoBot/i', 'DataForSEO', self::BOT_SEO],
        ['/serpstatbot/i', 'Serpstat', self::BOT_SEO],
        ['/facebookexternalhit|facebookcatalog|Facebot/i', 'Facebook', self::BOT_SOCIAL],
        ['/Twitterbot/i', 'X (Twitter)', self::BOT_SOCIAL],
        ['/LinkedInBot/i', 'LinkedIn', self::BOT_SOCIAL],
        ['/Slackbot|Slack-ImgProxy/i', 'Slack', self::BOT_SOCIAL],
        ['/Discordbot/i', 'Discord', self::BOT_SOCIAL],
        ['/TelegramBot/i', 'Telegram', self::BOT_SOCIAL],
        ['/WhatsApp/i', 'WhatsApp', self::BOT_SOCIAL],
        ['/Pinterest/i', 'Pinterest', self::BOT_SOCIAL],
        ['/redditbot/i', 'Reddit', self::BOT_SOCIAL],
        ['/vkShare/i', 'VK', self::BOT_SOCIAL],
        ['/SkypeUriPreview/i', 'Skype', self::BOT_SOCIAL],
        ['/Embedly|Iframely/i', 'Embed service', self::BOT_SOCIAL],
        ['/Mastodon|Bluesky|Cardyb/i', 'Fediverse', self::BOT_SOCIAL],
        ['/UptimeRobot/i', 'UptimeRobot', self::BOT_MONITOR],
        ['/Pingdom/i', 'Pingdom', self::BOT_MONITOR],
        ['/StatusCake/i', 'StatusCake', self::BOT_MONITOR],
        ['/Site24x7/i', 'Site24x7', self::BOT_MONITOR],
        ['/Datadog/i', 'Datadog', self::BOT_MONITOR],
        ['/NewRelic/i', 'New Relic', self::BOT_MONITOR],
        ['/Better Uptime|BetterStack/i', 'Better Stack', self::BOT_MONITOR],
        ['/Chrome-Lighthouse|PageSpeed|GTmetrix/i', 'Speed test', self::BOT_MONITOR],
        ['/Feedly|Inoreader|NewsBlur|Feedfetcher|Feedbin|FreshRSS|\brss/i', 'Feed reader', self::BOT_FEED],
        ['/HeadlessChrome|PhantomJS|puppeteer|playwright|selenium/i', 'Headless browser', self::BOT_SCRIPT],
        ['/curl\//i', 'curl', self::BOT_SCRIPT],
        ['/Wget\//i', 'Wget', self::BOT_SCRIPT],
        ['/python-requests|python-urllib|aiohttp|httpx|Scrapy/i', 'Python', self::BOT_SCRIPT],
        ['/Go-http-client/i', 'Go', self::BOT_SCRIPT],
        ['/axios|node-fetch|undici|Node\.js/i', 'Node.js', self::BOT_SCRIPT],
        ['/GuzzleHttp/i', 'PHP', self::BOT_SCRIPT],
        ['/Java\/|Apache-HttpClient|okhttp/i', 'Java', self::BOT_SCRIPT],
        ['/libwww-perl/i', 'Perl', self::BOT_SCRIPT],
    ];

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

    /**
     * Name and category of a bot's user agent, or null for a browser.
     *
     * @return array|null ['name' => ..., 'category' => ...]
     */
    public static function getBot($sUserAgent)
    {
        $sUserAgent = trim((string)$sUserAgent);
        if($sUserAgent === '')
            return ['name' => 'Unknown', 'category' => self::BOT_SCRIPT];

        foreach(self::$_aBots as list($sPattern, $sName, $sCategory))
            if(preg_match($sPattern, $sUserAgent))
                return ['name' => $sName, 'category' => $sCategory];

        if(!self::isBot($sUserAgent))
            return null;

        // an unlisted bot: its own name when the user agent carries one ("ExampleBot/1.0")
        if(preg_match('/([A-Za-z][A-Za-z0-9._-]{1,40}(?:bot|crawler|spider))\b/i', $sUserAgent, $aMatch))
            return ['name' => get_mb_substr($aMatch[1], 0, 64), 'category' => self::BOT_OTHER];

        return ['name' => 'Other', 'category' => self::BOT_OTHER];
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
