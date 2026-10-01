<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Basic iconset representation.
 * @see BxDolIconset
 */
class BxBaseIconset extends BxDolIconset
{
    protected $_oTemplate;

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();
    }

    public function getPreloaderCss()
    {
        return false;
    }

    public function getPreloaderJs()
    {
        return false;
    }

    public function getIcon($sIcon)
    {
        return $sIcon;
    }

    /**
     * Get icon as ready to use HTML code (e.g. inline SVG) which doesn't depend on the iconset's CSS/JS being loaded on the page.
     * @param $sIcon - icon name
     * @param $aAttrs - additional HTML attributes, e.g. `class`
     * @return string|false - HTML code or false if the iconset doesn't support it and a font icon (`<i class="sys-icon ...">`) should be used instead.
     */
    public function getIconHtml($sIcon, $aAttrs = [])
    {
        return false;
    }

    public function getCode()
    {
        return false;
    }
}

/** @} */
