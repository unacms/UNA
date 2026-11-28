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
 * View entry menu
 */
class BxResourcesMenuView extends BxBaseModTextMenuView
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_resources';
        parent::__construct($aObject, $oTemplate);
    }
}

/** @} */
