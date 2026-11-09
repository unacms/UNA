<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolQueuePush extends BxDolQueue implements iBxDolSingleton
{
    protected function __construct()
    {
        parent::__construct();

        $this->_oQuery = new BxDolQueuePushQuery();

        $this->_sParamTime = 'sys_push_queue_time';

        $this->_iLimitSend = (int)getParam('sys_push_queue_send_per_start');
        $this->_iLimitSendPerRecipient = (int)getParam('sys_push_queue_send_per_start_to_recipient');
    }

    /**
     * Get singleton instance of the class
     */
    static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolQueuePush();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Add message to push queue
     *
     * @param integer $iProfileId - recipient profile ID
     * @param array $aMessage - array with Push message 
     * @return true on success, false on error
     */
    public function add($iProfileId, $aMessage)
    {
        return (int)$this->_oQuery->insertItem(array(
        	'profile_id' => $iProfileId,
            'message' => serialize($aMessage)
        )) > 0;
    }

    /**
     * Internal method which performs sending using predefined list of params.
     */
    protected function _send($iProfileId, $sMessage)
    {
        if(isset($this->_aSentTo[$iProfileId]) && (int)$this->_aSentTo[$iProfileId] >= $this->_iLimitSendPerRecipient)
            return false;

        if(!($oPush = BxDolPush::getObjectInstance()) || !$oPush->send($iProfileId, unserialize($sMessage)))
            return false;

        if(!isset($this->_aSentTo[$iProfileId]))
            $this->_aSentTo[$iProfileId] = 0;
        $this->_aSentTo[$iProfileId] += 1;

        return true;
    }
}

/** @} */
