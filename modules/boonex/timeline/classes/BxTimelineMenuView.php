<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Timeline Timeline
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View block menu.
 */
class BxTimelineMenuView extends BxTemplMenuCustom
{
    protected $_oModule;

    protected $_bShowDivider;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->_oModule = BxDolModule::getInstance('bx_timeline');

        parent::__construct($aObject, $this->_oModule->_oTemplate);

        $this->_bShowDivider = false;
        $this->_bCueSelect = true; // the feed switcher is a row of tabs (interface sounds)
    }
}

/** @} */
