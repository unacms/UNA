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
 * Pauses timers left running without a pause for longer than the module's setting
 * (bx_tasks_timer_running_limit, hours; 0 pauses none) and tells their authors and the context administrators.
 * The time they ran stays in them, to be logged or cleared by their authors.
 */
class BxTasksCronTimers extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        parent::__construct();

    	$this->_sModule = 'bx_tasks';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);
    }

    function processing()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $iHours = (int)getParam($CNF['PARAM_TIMER_RUNNING_LIMIT']);
        if($iHours <= 0)
            return;

        $aTimers = $this->_oModule->_oDb->getTimers([
            'sample' => 'running_since',
            'started_before' => time() - 3600 * $iHours
        ]);
        if(empty($aTimers) || !is_array($aTimers))
            return;

        foreach($aTimers as $aTimer) {
            $iContentId = (int)$aTimer['content_id'];
            $iProfileId = (int)$aTimer['profile_id'];

            if(!$this->_oModule->pauseTimer($iContentId, $iProfileId))
                continue;

            $this->_oModule->sendTimersEvent($iProfileId, 'pause');
            $this->_oModule->onTimerStopped($iContentId, $iProfileId);
        }
    }
}

/** @} */
