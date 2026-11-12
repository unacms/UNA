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
 * Pauses timers left running without a pause for longer than TIMER_RUNNING_LIMIT
 * and tells their authors and the context administrators.
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

        $aTimers = $this->_oModule->_oDb->getTimers([
            'sample' => 'running_since',
            'started_before' => time() - (int)$CNF['TIMER_RUNNING_LIMIT']
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
