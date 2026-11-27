<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Resources Resources
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry social actions menu
 */
class BxResourcesMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_resources';

        parent::__construct($aObject, $oTemplate);

        $this->addMarkers([
            'js_object' => $this->_oModule->_oConfig->getJsObject('main')
        ]);
    }

    protected function _getMenuItemEditResource($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemDeleteResource($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }
}

/** @} */
