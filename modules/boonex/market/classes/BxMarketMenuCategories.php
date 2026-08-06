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
class BxMarketMenuCategories extends BxBaseModTextMenuCategories
{
    public function __construct ($aObject, $oTemplate)
    {
        $this->_sModule = 'bx_market';

        parent::__construct ($aObject, $oTemplate);
    }

    protected function _getExtendedInfo($iId)
    {
        return [];
    }
}

/** @} */
