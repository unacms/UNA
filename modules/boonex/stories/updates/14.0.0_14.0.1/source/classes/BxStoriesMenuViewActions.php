<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Stories Stories
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry social actions menu
 */
class BxStoriesMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_stories';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemAddMediaToStory($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemEditStory($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemDeleteStory($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }
}

/** @} */
