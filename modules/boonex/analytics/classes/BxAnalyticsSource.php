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
 * Traffic source of a session: referrer host, UTM parameters, click ids and the channel they add up to.
 */
class BxAnalyticsSource
{
    const CHANNEL_DIRECT = 'direct';
    const CHANNEL_INTERNAL = 'internal';
    const CHANNEL_SEARCH = 'search';
    const CHANNEL_PAID_SEARCH = 'paid_search';
    const CHANNEL_SOCIAL = 'social';
    const CHANNEL_PAID_SOCIAL = 'paid_social';
    const CHANNEL_EMAIL = 'email';
    const CHANNEL_AI = 'ai';
    const CHANNEL_DISPLAY = 'display';
    const CHANNEL_AFFILIATE = 'affiliate';
    const CHANNEL_CAMPAIGN = 'campaign';
    const CHANNEL_REFERRAL = 'referral';

    /**
     * Host suffixes per channel. A host matches a suffix when it equals it or ends with "." . suffix.
     * A suffix ending with "." matches any top level domain (google.com, google.co.uk).
     */
    protected static $_aHosts = [
        self::CHANNEL_AI => [
            'chatgpt.com', 'chat.openai.com', 'openai.com', 'perplexity.ai', 'claude.ai', 'gemini.google.com', 'bard.google.com',
            'copilot.microsoft.com', 'copilot.cloud.microsoft', 'you.com', 'phind.com', 'poe.com', 'chat.deepseek.com', 'meta.ai',
            'grok.com', 'chat.mistral.ai',
        ],
        self::CHANNEL_SEARCH => [
            'google.', 'bing.com', 'yahoo.', 'duckduckgo.com', 'yandex.', 'ya.ru', 'baidu.com', 'ecosia.org', 'qwant.com',
            'search.brave.com', 'startpage.com', 'naver.com', 'seznam.cz', 'sogou.com', 'so.com', 'ask.com', 'aol.com',
            'kagi.com', 'mojeek.com', 'search.yahoo.co.jp', 'daum.net', 'coccoc.com', 'petalsearch.com',
        ],
        self::CHANNEL_SOCIAL => [
            'facebook.com', 'fb.com', 'fb.me', 'messenger.com', 'instagram.com', 't.co', 'twitter.com', 'x.com', 'linkedin.com',
            'lnkd.in', 'reddit.com', 'redd.it', 'pinterest.', 'pin.it', 'tiktok.com', 'youtube.com', 'youtu.be', 'vk.com', 'vk.ru',
            'ok.ru', 't.me', 'telegram.org', 'telegram.me', 'whatsapp.com', 'wa.me', 'threads.net', 'threads.com', 'bsky.app',
            'mastodon.social', 'quora.com', 'tumblr.com', 'discord.com', 'discord.gg', 'snapchat.com', 'weibo.com', 'weibo.cn',
            'news.ycombinator.com', 'line.me', 'kakao.com', 'twitch.tv', 'medium.com', 'substack.com', 'nextdoor.com',
            'xing.com', 'flickr.com', 'vimeo.com', 'dribbble.com', 'behance.net', 'stackoverflow.com', 'github.com',
        ],
        self::CHANNEL_EMAIL => [
            'mail.google.com', 'inbox.google.com', 'outlook.live.com', 'outlook.office.com', 'outlook.office365.com',
            'mail.yahoo.com', 'mail.yandex.ru', 'mail.ru', 'e.mail.ru', 'mail.aol.com', 'mail.proton.me', 'mail.zoho.com',
            'icloud.com', 'fastmail.com', 'gmx.net', 'gmx.com', 'web.de', 't-online.de',
        ],
    ];

    /**
     * Click id parameters that ad networks append, with the channel each one means.
     */
    protected static $_aClickIds = [
        'gclid' => self::CHANNEL_PAID_SEARCH,
        'gbraid' => self::CHANNEL_PAID_SEARCH,
        'wbraid' => self::CHANNEL_PAID_SEARCH,
        'msclkid' => self::CHANNEL_PAID_SEARCH,
        'yclid' => self::CHANNEL_PAID_SEARCH,
        'dclid' => self::CHANNEL_DISPLAY,
        'ttclid' => self::CHANNEL_PAID_SOCIAL,
        'li_fat_id' => self::CHANNEL_PAID_SOCIAL,
        'twclid' => self::CHANNEL_PAID_SOCIAL,
        'sccid' => self::CHANNEL_PAID_SOCIAL,
        'epik' => self::CHANNEL_PAID_SOCIAL,
    ];

    public static $aUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    /**
     * Work out the source of a session from its first page.
     *
     * @param string $sReferrer document.referrer or the app's referrer, may be empty
     * @param string $sUrl the landing page URL with its query string, for UTM parameters and click ids
     * @param array $aInternalHosts hosts of the site and its clients: a referrer from one of them is not a source
     * @return array with keys referrer (scheme and query stripped), referrer_host, channel and the utm_* keys
     */
    public static function classify($sReferrer, $sUrl = '', $aInternalHosts = [])
    {
        $aQuery = self::_query($sUrl);

        $aResult = [
            'referrer' => '',
            'referrer_host' => '',
            'channel' => self::CHANNEL_DIRECT,
        ];
        foreach(self::$aUtm as $sKey)
            $aResult[$sKey] = isset($aQuery[$sKey]) && is_string($aQuery[$sKey]) ? self::_clean($aQuery[$sKey], 128) : '';

        // ref= / source= are common in links without UTM (Product Hunt, newsletters)
        if($aResult['utm_source'] === '')
            foreach(['ref', 'source'] as $sKey)
                if(isset($aQuery[$sKey]) && is_string($aQuery[$sKey]) && $aQuery[$sKey] !== '') {
                    $aResult['utm_source'] = self::_clean($aQuery[$sKey], 128);
                    break;
                }

        $sHost = self::host($sReferrer);
        $bInternal = $sHost !== '' && self::_isInternal($sHost, $aInternalHosts);
        if($sHost !== '' && !$bInternal) {
            $aResult['referrer_host'] = $sHost;
            $aResult['referrer'] = self::_clean(preg_replace('/^[a-z][a-z0-9+.-]*:\/\/(www\.)?|[?#].*$/i', '', $sReferrer), 255);
        }

        $aResult['channel'] = self::channel($aResult['referrer_host'], $aResult['utm_source'], $aResult['utm_medium'], array_keys($aQuery));
        if($aResult['channel'] === self::CHANNEL_DIRECT && $bInternal)
            $aResult['channel'] = self::CHANNEL_INTERNAL;

        return $aResult;
    }

    /**
     * Channel from a referrer host, UTM source and medium, and the landing page's query parameter names.
     */
    public static function channel($sReferrerHost, $sUtmSource = '', $sUtmMedium = '', $aQueryKeys = [])
    {
        $sMedium = mb_strtolower(trim($sUtmMedium));
        $sSource = mb_strtolower(trim($sUtmSource));
        $sSourceChannel = $sSource !== '' ? self::_hostChannel($sSource) : '';
        $sReferrerChannel = $sReferrerHost !== '' ? self::_hostChannel($sReferrerHost) : '';
        $sKnown = $sSourceChannel ? $sSourceChannel : $sReferrerChannel;

        $bPaid = (bool)preg_match('/^(.*cpc|ppc|paid.*|cpm|cpv|cpa|retargeting|sem)$/', $sMedium);
        if($bPaid) {
            if(preg_match('/social/', $sMedium) || $sKnown === self::CHANNEL_SOCIAL)
                return self::CHANNEL_PAID_SOCIAL;
            if($sKnown === self::CHANNEL_SEARCH || preg_match('/search|cpc|ppc|sem/', $sMedium))
                return self::CHANNEL_PAID_SEARCH;
            return self::CHANNEL_DISPLAY;
        }

        // an explicit medium says more than a click id that an ad network appended
        if($sMedium !== '') {
            if(preg_match('/^(e[-_ ]?mail|newsletter|mailing)/', $sMedium))
                return self::CHANNEL_EMAIL;
            if(preg_match('/^(social|social[-_ ]?(network|media)|sm|post)$/', $sMedium))
                return self::CHANNEL_SOCIAL;
            if(preg_match('/^(display|banner|expandable|interstitial)$/', $sMedium))
                return self::CHANNEL_DISPLAY;
            if($sMedium === 'affiliate' || $sMedium === 'partner')
                return self::CHANNEL_AFFILIATE;
            if($sMedium === 'organic')
                return $sKnown === self::CHANNEL_SOCIAL ? self::CHANNEL_SOCIAL : self::CHANNEL_SEARCH;
            if($sMedium === 'referral')
                return $sKnown ? $sKnown : self::CHANNEL_REFERRAL;
        }

        foreach(self::$_aClickIds as $sKey => $sChannel)
            if(in_array($sKey, $aQueryKeys, true))
                return $sChannel;

        if($sKnown)
            return $sKnown;

        if($sSource !== '' || $sMedium !== '')
            return self::CHANNEL_CAMPAIGN;

        return $sReferrerHost !== '' ? self::CHANNEL_REFERRAL : self::CHANNEL_DIRECT;
    }

    /**
     * Lower case host of a URL without "www.", or '' when there is none. Android apps send
     * referrers like android-app://com.google.android.gm, which become the package name.
     */
    public static function host($sUrl)
    {
        $sUrl = trim((string)$sUrl);
        if($sUrl === '')
            return '';

        $sHost = parse_url(strpos($sUrl, '//') === false ? 'http://' . $sUrl : $sUrl, PHP_URL_HOST);
        if(!is_string($sHost) || $sHost === '')
            return '';

        $sHost = mb_strtolower(rtrim($sHost, '.'));
        if(bx_mb_strpos($sHost, 'www.') === 0)
            $sHost = get_mb_substr($sHost, 4, get_mb_len($sHost));

        return preg_match('/^[a-z0-9.-]{1,253}$/', $sHost) ? $sHost : '';
    }

    protected static function _hostChannel($sHost)
    {
        $sHost = mb_strtolower($sHost);

        // Android app referrers
        $aApps = [
            'com.google.android.gm' => self::CHANNEL_EMAIL,
            'com.google.android.googlequicksearchbox' => self::CHANNEL_SEARCH,
            'com.facebook.katana' => self::CHANNEL_SOCIAL,
            'com.instagram.android' => self::CHANNEL_SOCIAL,
            'com.twitter.android' => self::CHANNEL_SOCIAL,
            'com.linkedin.android' => self::CHANNEL_SOCIAL,
            'com.reddit.frontpage' => self::CHANNEL_SOCIAL,
            'org.telegram.messenger' => self::CHANNEL_SOCIAL,
            'com.whatsapp' => self::CHANNEL_SOCIAL,
            'com.openai.chatgpt' => self::CHANNEL_AI,
        ];
        if(isset($aApps[$sHost]))
            return $aApps[$sHost];

        foreach(self::$_aHosts as $sChannel => $aSuffixes)
            foreach($aSuffixes as $sSuffix) {
                if(bx_mb_strpos($sSuffix, '/') !== false)
                    continue;

                if(get_mb_substr($sSuffix, -1, 1) === '.') {
                    // google. matches google.com, google.co.uk, news.google.com
                    if(preg_match('/(^|\.)' . preg_quote($sSuffix, '/') . '[a-z]{2,3}(\.[a-z]{2})?$/', $sHost))
                        return $sChannel;
                    continue;
                }

                if($sHost === $sSuffix || self::_endsWith($sHost, '.' . $sSuffix))
                    return $sChannel;
            }

        // a bare UTM source like "google", "facebook" or "newsletter"
        if(bx_mb_strpos($sHost, '.') === false) {
            if(preg_match('/^(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|naver|brave)$/', $sHost))
                return self::CHANNEL_SEARCH;
            if(preg_match('/^(facebook|fb|instagram|ig|twitter|x|linkedin|reddit|pinterest|tiktok|youtube|vk|telegram|whatsapp|threads|bluesky|mastodon|discord|snapchat)$/', $sHost))
                return self::CHANNEL_SOCIAL;
            if(preg_match('/^(chatgpt|openai|perplexity|claude|gemini|copilot|deepseek|grok)$/', $sHost))
                return self::CHANNEL_AI;
            if(preg_match('/^(newsletter|email|mail|gmail|outlook)$/', $sHost))
                return self::CHANNEL_EMAIL;
        }

        return '';
    }

    protected static function _isInternal($sHost, $aInternalHosts)
    {
        foreach($aInternalHosts as $sInternal) {
            $sInternal = self::host($sInternal);
            if($sInternal !== '' && ($sHost === $sInternal || self::_endsWith($sHost, '.' . $sInternal)))
                return true;
        }

        return false;
    }

    protected static function _endsWith($s, $sEnd)
    {
        $iLength = get_mb_len($sEnd);

        return get_mb_len($s) >= $iLength && get_mb_substr($s, -$iLength, $iLength) === $sEnd;
    }

    protected static function _query($sUrl)
    {
        $sQuery = parse_url((string)$sUrl, PHP_URL_QUERY);
        if(!is_string($sQuery) || $sQuery === '')
            return [];

        $aQuery = [];
        parse_str($sQuery, $aQuery);

        return $aQuery;
    }

    protected static function _clean($s, $iMaxLength)
    {
        $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$s));

        return get_mb_substr($s, 0, $iMaxLength);
    }
}

/** @} */
