<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * What an API client shows when a list comes back empty: a title, a line of text and up to three
 * buttons. A module gives its default (a search result's getEmptyStateApi); a page block can
 * replace any part of it in Studio, in the block's "Config (for App in JSON format)":
 *
 *     {"empty": {"title": "_my_key", "text": "_my_text_key", "buttons": [{"title": "_my_button", "link": "page.php?i=create-post"}]}}
 *
 * Titles and text are language keys (or plain text), so each language gets its own words. A key
 * the block leaves out keeps the module's; `"buttons": []` shows none. Links are the site's own:
 * relative, or absolute under the site's URL; anything else (another host, a script) is dropped.
 * Sent to the client as `empty_state` beside the list.
 */
class BxDolEmptyState
{
    const MAX_BUTTONS = 3;

    /**
     * The empty state for an API list: the module's default with the processing block's override.
     *
     * @param array $aDefault ['title' => key, 'text' => key, 'buttons' => [['title' => key, 'link' => url, 'style' => 'primary'|'secondary'], ...]]
     * @return array|null the resolved empty state, or null when there is nothing to say
     */
    public static function forApi($aDefault = [])
    {
        $aState = is_array($aDefault) ? $aDefault : [];

        $aBlock = BxDolPage::getBlockProcessing();
        $aConfig = isset($aBlock['config_api']) && is_array($aBlock['config_api']) ? $aBlock['config_api'] : [];
        if (isset($aConfig['empty']) && is_array($aConfig['empty']))
            foreach (['title', 'text', 'buttons'] as $sKey)
                if (array_key_exists($sKey, $aConfig['empty']))
                    $aState[$sKey] = $aConfig['empty'][$sKey];

        return self::resolve($aState);
    }

    /**
     * Language keys turned into the viewer's words, buttons checked; null when nothing is left.
     */
    public static function resolve($aState)
    {
        if (!is_array($aState))
            return null;

        $aResult = [];
        foreach (['title', 'text'] as $sKey)
            if (($s = self::text($aState[$sKey] ?? '')) !== '')
                $aResult[$sKey] = $s;

        $aButtons = [];
        foreach (is_array($aState['buttons'] ?? null) ? $aState['buttons'] : [] as $aButton) {
            if (!is_array($aButton) || count($aButtons) >= self::MAX_BUTTONS)
                continue;

            $sTitle = self::text($aButton['title'] ?? '');
            $sLink = self::link($aButton['link'] ?? '');
            if ($sTitle === '' || $sLink === '')
                continue;

            $aButtons[] = [
                'title' => $sTitle,
                'link' => $sLink,
                'style' => ($aButton['style'] ?? '') === 'secondary' || count($aButtons) > 0 ? 'secondary' : 'primary',
            ];
        }
        if ($aButtons)
            $aResult['buttons'] = $aButtons;

        return $aResult ?: null;
    }

    protected static function text($mValue)
    {
        if (!is_string($mValue) || ($mValue = trim($mValue)) === '')
            return '';

        return strip_tags(strncmp($mValue, '_', 1) === 0 ? _t($mValue) : $mValue);
    }

    /**
     * A link of this site, as the apps open it: relative to the site's root ("/page/..."), or ''.
     */
    protected static function link($mValue)
    {
        if (!is_string($mValue) || ($sLink = trim($mValue)) === '')
            return '';

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $sLink) || strncmp($sLink, '//', 2) === 0) {
            $iRoot = get_mb_len(BX_DOL_URL_ROOT);
            if (get_mb_substr($sLink, 0, $iRoot) !== BX_DOL_URL_ROOT)
                return '';
            $sLink = get_mb_substr($sLink, $iRoot, get_mb_len($sLink) - $iRoot);
        }

        $sLink = ltrim($sLink, '/');
        if ($sLink === '' || strpbrk($sLink, "<>\"'\\ \t\r\n") !== false)
            return '';

        return bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sLink), '');
    }
}

/** @} */
