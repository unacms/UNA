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
 * A button can also name an action the app does in place, with the link as its fallback:
 * `"action": "compose"` opens the post form of the page's composer block, if the page has one;
 * `"action": "create_menu"` opens the add-content menu (every type the viewer can create).
 * Sent to the client as `empty_state` beside the list.
 */
class BxDolEmptyState
{
    const MAX_BUTTONS = 3;

    /** Actions a button can ask the app for (see the class comment). */
    const ACTIONS = ['compose', 'create_menu'];

    /**
     * The empty state for an API list: the module's default with the processing block's override.
     *
     * @param array $aDefault ['title' => key, 'text' => key, 'buttons' => [['title' => key, 'link' => url, 'style' => 'primary'|'secondary', 'action' => 'compose'|'create_menu'], ...]]
     * @return array|null the resolved empty state, or null when there is nothing to say
     */
    public static function forApi($aDefault = [])
    {
        $aState = is_array($aDefault) ? $aDefault : [];

        $aBlock = BxDolPage::getBlockProcessing();
        $aOverride = $aBlock['config_api']['empty'] ?? null;
        if (is_array($aOverride)) {
            foreach (['title', 'text', 'buttons'] as $sKey) {
                if (array_key_exists($sKey, $aOverride)) {
                    $aState[$sKey] = $aOverride[$sKey];
                }
            }
        }

        return self::resolve($aState);
    }

    /**
     * Language keys turned into the viewer's words, buttons checked; null when nothing is left.
     */
    public static function resolve($aState)
    {
        if (!is_array($aState)) {
            return null;
        }

        $aResult = [];
        foreach (['title', 'text'] as $sKey) {
            $s = self::text($aState[$sKey] ?? '');
            if ($s !== '') {
                $aResult[$sKey] = $s;
            }
        }

        $aButtons = self::buttons($aState['buttons'] ?? null);
        if (!empty($aButtons)) {
            $aResult['buttons'] = $aButtons;
        }

        return empty($aResult) ? null : $aResult;
    }

    /**
     * Up to MAX_BUTTONS buttons with a title and a link of this site; the first is primary unless
     * it asks to be secondary, the others are secondary.
     */
    protected static function buttons($mButtons)
    {
        $aButtons = [];
        foreach (is_array($mButtons) ? $mButtons : [] as $aButton) {
            if (count($aButtons) >= self::MAX_BUTTONS) {
                break;
            }
            if (!is_array($aButton)) {
                continue;
            }

            $sTitle = self::text($aButton['title'] ?? '');
            $sLink = self::link($aButton['link'] ?? '');
            if ($sTitle === '' || $sLink === '') {
                continue;
            }

            $bSecondary = ($aButton['style'] ?? '') === 'secondary' || !empty($aButtons);
            $aResult = ['title' => $sTitle, 'link' => $sLink, 'style' => $bSecondary ? 'secondary' : 'primary'];
            if (in_array($aButton['action'] ?? '', self::ACTIONS, true)) {
                $aResult['action'] = $aButton['action'];
            }
            $aButtons[] = $aResult;
        }

        return $aButtons;
    }

    protected static function text($mValue)
    {
        if (!is_string($mValue) || ($mValue = trim($mValue)) === '') {
            return '';
        }

        return strip_tags(strncmp($mValue, '_', 1) === 0 ? _t($mValue) : $mValue);
    }

    /**
     * A link of this site, as the apps open it: relative to the site's root ("/page/..."), or ''.
     */
    protected static function link($mValue)
    {
        $sLink = self::sitePath($mValue);
        if ($sLink === '' || strpbrk($sLink, "<>\"'\\ \t\r\n") !== false) {
            return '';
        }

        return bx_api_get_relative_url(BxDolPermalinks::getInstance()->permalink($sLink), '');
    }

    /**
     * The link's path under the site's root, without the leading slash: '' for an empty link or
     * one with a scheme or host other than the site's own.
     */
    protected static function sitePath($mValue)
    {
        $sLink = is_string($mValue) ? trim($mValue) : '';

        if (preg_match('/^[a-z][a-z0-9+.-]*:/i', $sLink) || strncmp($sLink, '//', 2) === 0) {
            $iRoot = get_mb_len(BX_DOL_URL_ROOT);
            $sLink = get_mb_substr($sLink, 0, $iRoot) === BX_DOL_URL_ROOT ? get_mb_substr($sLink, $iRoot, get_mb_len($sLink) - $iRoot) : '';
        }

        return ltrim($sLink, '/');
    }
}

/** @} */
