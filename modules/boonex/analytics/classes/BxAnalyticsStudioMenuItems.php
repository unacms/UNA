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
 * Studio side menu items with Lucide glyphs on Studio's gray tiles, like Studio's own pages.
 * An item names its glyph in `lucide`; the rest is Studio's menu as is.
 */
class BxAnalyticsStudioMenuItems extends BxTemplStudioMenu
{
    protected $_oIconset;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_oIconset = BxDolIconset::getObjectInstance('sys_lucide');
    }

    protected function _getMenuItem($aItem)
    {
        $sLucide = isset($aItem['lucide']) ? $aItem['lucide'] : '';

        $aItem = parent::_getMenuItem($aItem);
        if($aItem === false || $sLucide === '' || !$this->_oIconset)
            return $aItem;

        $sSvg = $this->_oIconset->getIconHtml($sLucide, ['class' => 'bx-analytics-std-menu-icon', 'aria-hidden' => 'true']);
        if($sSvg === false)
            return $aItem;

        return array_merge($aItem, [
            'bx_if:icon' => ['condition' => false, 'content' => ['icon' => '']],
            'bx_if:image' => ['condition' => false, 'content' => ['icon_url' => '', 'attrs' => '']],
            'bx_if:image_inline' => ['condition' => true, 'content' => ['image' => $sSvg]],
            'bx_if:show_icon' => ['condition' => true, 'content' => []],
            'bx_if:show_icon_bg' => ['condition' => true, 'content' => []],
        ]);
    }
}

/** @} */
