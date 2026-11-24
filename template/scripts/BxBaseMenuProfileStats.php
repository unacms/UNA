<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Menu representation.
 * @see BxDolMenu
 */
class BxBaseMenuProfileStats extends BxTemplMenuAccountNotifications
{
    /**
     * How many items show before "Show more", the same on the site and in the apps (getCodeAPI sends it as
     * `more_after`). The tiles show every item.
     */
    const ITEMS_VISIBLE = 10;

    /** How long the apps keep the member's counters, in seconds: the home asks for this menu on every load. */
    const API_COUNTERS_TTL = 60;

    protected $_iMenuItemsMin;

    /** While getCodeAPI builds the items: the counters by item id, read from the cache or collected for it. */
    protected $_aApiAddons = null;
    protected $_bApiAddonsCached = false;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject, $oTemplate);

        $this->_bDisplayAddons = true;
        $this->_iMenuItemsMin = static::ITEMS_VISIBLE;
    }

    /**
     * The menu for the apps, with `more_after`: how many items show before "Show more" (0: all, as the tiles), and
     * the control's labels (`more_title`, `less_title`). The counters are kept for the member for API_COUNTERS_TTL,
     * so the apps' home doesn't call every counter's service on each load; the key starts as the menu's own cache
     * does (`menu_<object>`), so clearing the menu's caches clears it too.
     */
    public function getCodeAPI ()
    {
        $sKey = $this->_getApiAddonsCacheKey();
        $mixedCached = $sKey !== '' ? bx_content_cache_get($sKey, static::API_COUNTERS_TTL) : null;
        $this->_bApiAddonsCached = is_array($mixedCached);
        $this->_aApiAddons = $this->_bApiAddonsCached ? $mixedCached : [];

        try {
            $aResult = parent::getCodeAPI();
            if ($sKey !== '' && !$this->_bApiAddonsCached)
                bx_content_cache_set($sKey, $this->_aApiAddons, static::API_COUNTERS_TTL);
        }
        finally {
            $this->_aApiAddons = null;
            $this->_bApiAddonsCached = false;
        }

        $aResult['more_after'] = $this->_isTiles() ? 0 : (int)$this->_iMenuItemsMin;
        // The site's own labels for the control (_addMenuItemsMoreLess), so the apps say the same in every language.
        $aResult['more_title'] = _t('_sys_show_more');
        $aResult['less_title'] = _t('_sys_show_less');

        return $aResult;
    }

    /**
     * Forget the member's menu, the site's (`menu_<object>_p<id>` and its variants) and the apps' counts, after
     * something that changes a count (their content added or deleted).
     */
    public static function clearCacheForProfile ($iProfileId)
    {
        $iProfileId = (int)$iProfileId;
        if (!$iProfileId)
            return;

        foreach (['sys_profile_stats', 'sys_profile_stats_tiles'] as $sObject) {
            bx_content_cache_del('menu_' . $sObject . '_p' . $iProfileId);
            bx_content_cache_del_by_prefix('menu_' . $sObject . '_p' . $iProfileId . '_');
        }
    }

    protected function _getApiAddonsCacheKey ()
    {
        $iProfileId = (int)bx_get_logged_profile_id();
        if (!$iProfileId || !getParam('sys_content_cache_enable'))
            return '';

        return 'menu_' . $this->_sObject . '_p' . $iProfileId . '_api_addons';
    }

    /**
     * A counter, from the member's cache while getCodeAPI builds the items (_aApiAddons), otherwise as usual.
     */
    protected function _getMenuAddon ($aMenuItem)
    {
        if (!$this->_bIsApi || !is_array($this->_aApiAddons) || !isset($aMenuItem['id']))
            return parent::_getMenuAddon($aMenuItem);

        $iId = (int)$aMenuItem['id'];
        if ($this->_bApiAddonsCached)
            return $this->_aApiAddons[$iId] ?? '';

        return $this->_aApiAddons[$iId] = parent::_getMenuAddon($aMenuItem);
    }

    public function getMenuItems ()
    {
        $aItems = parent::getMenuItems();
        if(empty($aItems) || !is_array($aItems) || $this->_bIsApi || $this->_isTiles())
            return $aItems;

        return $this->_addMenuItemsMoreLess($aItems, $this->_iMenuItemsMin);
    }

    /**
     * Tiles (the dashboard's "Your account") show every item: there is no Show more.
     */
    protected function _isTiles ()
    {
        return isset($this->_aObject['template_id']) && (int)$this->_aObject['template_id'] == BX_MENU_TEMPLATE_TILES;
    }

    protected function getMenuItemsRaw ()
    {
        return $this->getMenuItemsRawProfileRelated();
    }

    protected function _getMenuItem($a)
    {
        $mixedResult = parent::_getMenuItem($a);

        if($mixedResult !== false && !empty($mixedResult['link']) && strpos($mixedResult['link'], 'javascript:') === false)
            $mixedResult['link'] = static::appendOwnerParam($mixedResult['link']);

        return $mixedResult;
    }

    /**
     * `owner=1` in the link's query (author pages show the member's own entries with it), before a `#fragment`
     * (Followers' `#subscribers`), which would otherwise keep it.
     */
    public static function appendOwnerParam($sLink)
    {
        $sFragment = '';
        if(($iHash = bx_mb_strpos($sLink, '#')) !== false) {
            $sFragment = get_mb_substr($sLink, $iHash, get_mb_len($sLink) - $iHash);
            $sLink = get_mb_substr($sLink, 0, $iHash);
        }

        return bx_append_url_params($sLink, ['owner' => 1]) . $sFragment;
    }
}

/** @} */
