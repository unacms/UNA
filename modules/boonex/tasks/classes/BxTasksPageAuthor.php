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
 * Profile's entries page.
 */
class BxTasksPageAuthor extends BxBaseModTextPageAuthor
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aObject, $oTemplate = false)
    {
        parent::__construct($aObject, $oTemplate);

        $this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        if(($oMenuHolder = BxDolMenu::getObjectInstance('sys_site_submenu')) && ($oMenu = BxDolMenu::getObjectInstance($oMenuHolder->getObjectSubmenu())))
            $oMenu->setSelected($this->_sModule, 'tasks-context');
    }

    /**
     * The context's time and budget pages open as their tabs show (BxTasksMenuViewContext): a page the viewer's
     * role can't use is closed as a whole, rather than showing its blocks' access errors.
     */
    protected function _isVisiblePage ($a)
    {
        $mixedResult = parent::_isVisiblePage($a);
        if($mixedResult !== true || !$this->_oProfile)
            return $mixedResult;

        $iContextPid = $this->_oProfile->id();
        switch($a['object'] ?? '') {
            case 'bx_tasks_context_time':
                return $this->_oModule->getTimeRights($iContextPid)['log'];

            case 'bx_tasks_context_time_administration':
                return $this->_oModule->getTimeRights($iContextPid)['view_logged_any'];

            case 'bx_tasks_context_billing':
                return $this->_oModule->isAllowViewBilling($iContextPid);

            case 'bx_tasks_context_budget_administration':
                return $this->_oModule->isAdministratorByContext($iContextPid);
        }

        return $mixedResult;
    }
}

/** @} */
