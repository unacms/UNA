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
 * View entry social actions menu
 */
class BxTasksMenuViewActions extends BxBaseModTextMenuViewActions
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';

        parent::__construct($aObject, $oTemplate);

        $this->addMarkers([
            'js_object' => $this->_oModule->_oConfig->getJsObject('tasks')
        ]);
    }

    protected function _getMenuItemEditTask($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemEditTaskState($aItem)
    {
        $aResult = $this->_getMenuItemByNameActions($aItem);

        if($this->_bIsApi)
            $aResult = array_merge($aResult, [
                'display_type' => 'callback',
                'data' => [
                    'request_url' => $this->_sModule . '/process_task_form_edit_property/&params[]=' . $this->_iContentId . '&params[]=1', 
                    'on_callback' => 'modal'
                ]
            ]);

        return $aResult;
    }

    protected function _getMenuItemDeleteTask($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemReportTime($aItem, $aParams = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return parent::_getMenuItemReport($aItem, array_merge($aParams, [
            'object' => $CNF['OBJECT_REPORTS_TIME']
        ]));
    }

    protected function _getMenuItemSetCompleted($aItem)
    {
        if($this->_bIsApi)
            return array_merge($this->_getMenuItemAPI($aItem), [
                'display_type' => 'callback',
                'data' => [
                    'request_url' => $this->_sModule . '/set_completed/&params[]=' . $this->_iContentId . '&params[]=1', 
                    'on_callback' => 'change'
                ]
            ]);

        return true;
    }

    protected function _getMenuItemSetUncompleted($aItem)
    {
        if($this->_bIsApi)
            return array_merge($this->_getMenuItemAPI($aItem), [
                'display_type' => 'callback',
                'data' => [
                    'request_url' => $this->_sModule . '/set_completed/&params[]=' . $this->_iContentId . '&params[]=0', 
                    'on_callback' => 'hide'
                ]
            ]);

        return true;
    }
}

/** @} */
