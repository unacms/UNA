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
 * View entry menu
 */
class BxStoriesMenuView extends BxBaseModTextMenuView
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_stories';

        parent::__construct($aObject, $oTemplate);

        $this->addMarkers([
            'js_object' => $this->_oModule->_oConfig->getJsObject('main')
        ]);
    }
}

/** @} */
