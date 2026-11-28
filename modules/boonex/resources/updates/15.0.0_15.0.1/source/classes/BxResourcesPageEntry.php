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
 * Entry create/edit pages
 */
class BxResourcesPageEntry extends BxBaseModTextPageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_resources';
        parent::__construct($aObject, $oTemplate);
    }

    protected function _setSubmenu($aParams)
    {
    	parent::_setSubmenu(array_merge($aParams, [
            'title' => '',
            'icon' => ''
    	]));
    }
}

/** @} */
