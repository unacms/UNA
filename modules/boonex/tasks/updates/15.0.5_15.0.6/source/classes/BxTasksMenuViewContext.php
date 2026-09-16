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
 * View entry menu
 */
class BxTasksMenuViewContext extends BxBaseModTextMenuView
{
    protected $_iContextId;

    public function __construct($aObject, $oTemplate = false)
    {
        $this->MODULE = 'bx_tasks';
        parent::__construct($aObject, $oTemplate);
    }

    public function setContextId($iContextId)
    {
        $this->_iContextId = (int)$iContextId;

        $this->addMarkers([
            'profile_id' => $this->_iContextId
        ]);
    }

    protected function _isVisible($a)
    {
        if(!parent::_isVisible($a))
            return false;

        $bResult = true;
        switch ($a['name']) {
            case 'tasks-context-time-administration':
            case 'tasks-context-budget-administration':
            case 'tasks-context-values':
                $bResult = $this->_oModule->isAllowManageByContext($this->_iContextId);
                break;
        }

        return $bResult;
    }
}

/** @} */
