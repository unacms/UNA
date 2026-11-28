<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

class BxTasksAlertsResponse extends BxBaseModTextAlertsResponse
{
    public function __construct()
    {
        $this->MODULE = 'bx_tasks';

        parent::__construct();
    }

    public function response($oAlert)
    {
        parent::response($oAlert);

        if(($sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction)) && method_exists($this, $sMethod))
            $this->$sMethod($oAlert);
    }

    /**
     * The SEO link of a task is its number (view-task/una-12), not its title.
     */
    protected function _processSystemUriGenerate($oAlert)
    {
        if(($oAlert->aExtras['module'] ?? '') != $this->MODULE || ($oAlert->aExtras['param_name'] ?? '') != 'id')
            return;

        if(($sIdentifier = $this->_oModule->getIdentifier((int)$oAlert->aExtras['param_value'])) !== '')
            $oAlert->aExtras['uri'] = mb_strtolower($sIdentifier);
    }

    /**
     * A former link of a task still finds it: one with a former prefix of its community
     * (view-task/web-12, after it became SITE), or the one made from its title before tasks had
     * numbers (view-task/fix-the-sign-in).
     */
    protected function _processSystemSeoLinkNotFound($oAlert)
    {
        if(($oAlert->aExtras['module'] ?? '') != $this->MODULE)
            return;

        $sUri = (string)($oAlert->aExtras['uri'] ?? '');
        $iContentId = $this->_oModule->getContentIdByIdentifier($sUri);
        if(!$iContentId)
            $iContentId = $this->_oModule->_oDb->getContentIdByFormerSeoLink((string)($oAlert->aExtras['page_uri'] ?? ''), $sUri);

        if($iContentId > 0)
            $oAlert->aExtras['link'] = ['param_name' => 'id', 'param_value' => (string)$iContentId];
    }

    /**
     * The prefix of the tasks in no community changes with its option; a prefix another community
     * has or had leaves it as it was.
     */
    protected function _processSystemSaveSetting($oAlert)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(($oAlert->aExtras['option'] ?? '') != $CNF['PARAM_PERSONAL_PREFIX'])
            return;

        if(!$this->_oModule->setContextPrefix(0, (string)$oAlert->aExtras['value']))
            setParam($CNF['PARAM_PERSONAL_PREFIX'], $this->_oModule->getContextPrefix(0));
    }

    protected function _processProfileSearchByTerm($oAlert)
    {
        $sName = $oAlert->aExtras['params']['name'] ?? '';

        if($sName == $this->MODULE . '_initial_members' && ($oContext = BxDolProfile::getInstance((int)$oAlert->aExtras['params']['context_pid'])) !== false) {
            $aIds = bx_srv($oContext->getModule(), 'fans', [$oContext->getContentId(), true]);

            $oAlert->aExtras['where'] .= " AND `p`.`id` IN (" . $this->_oModule->_oDb->implode_escape($aIds) . ")";
        }
    }
}

/** @} */
