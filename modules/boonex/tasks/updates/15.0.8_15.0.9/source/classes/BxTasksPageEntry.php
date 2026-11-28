<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Entry create/edit pages
 */
class BxTasksPageEntry extends BxBaseModTextPageEntry
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_tasks';
        parent::__construct($aObject, $oTemplate);

        // the task's number before its title (UNA-12 Fix the sign in), where the viewer sees the title
        if(!empty($this->_aMarkers['title']) && $this->_aContentInfo && ($sIdentifier = $this->_oModule->getIdentifier($this->_aContentInfo)) !== '')
            $this->addMarkers(['title' => $sIdentifier . ' ' . $this->_aMarkers['title']]);
    }

    protected function _setSubmenu($aParams)
    {
    	parent::_setSubmenu(array_merge($aParams, array(
    		'title' => '',
    		'icon' => ''
    	)));
    }
}

/** @} */
