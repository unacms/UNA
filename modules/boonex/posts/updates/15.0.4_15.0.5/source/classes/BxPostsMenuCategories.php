<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Posts Posts
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Menu based category list.
 * @see BxDolMenu
 */
class BxPostsMenuCategories extends BxBaseModTextMenuCategories
{
    public function __construct ($aObject, $oTemplate)
    {
        $this->_sModule = 'bx_posts';

        parent::__construct ($aObject, $oTemplate);
    }

    protected function _getExtendedInfo($iId)
    {
        return [];
    }
}

/** @} */
