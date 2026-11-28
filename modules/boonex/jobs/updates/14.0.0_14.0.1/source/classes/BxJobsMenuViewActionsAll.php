<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * View entry all actions menu
 */
class BxJobsMenuViewActionsAll extends BxBaseModGroupsMenuViewActionsAll
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_jobs';

        parent::__construct($aObject, $oTemplate);
    }

    protected function _getMenuItemJoinJobProfile($aItem)
    {
        return $this->_getMenuItemByNameActions($aItem);
    }

    protected function _getMenuItemEditJobCover($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemEditJobProfile($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemJobQuestionnaire($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemJobPricing($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemInviteToJob($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemDeleteJobProfile($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }

    protected function _getMenuItemApproveJobProfile($aItem)
    {
        return $this->_getMenuItemByNameActionsMore($aItem);
    }
}

/** @} */
