<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Notifications Notifications
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Send notifications from internal queue by moving them to system one.
 * Is working if Delivery Timeout is set.
 */
class BxNtfsCronQueue extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
    	$this->_sModule = 'bx_notifications';
    	$this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct();
    }

    public function processing()
    {
        $iDeliveryTimeout = $this->_oModule->_oConfig->getDeliveryTimeout();
        if($iDeliveryTimeout == 0)
            return;

        $aItems = $this->_oModule->_oDb->queueGet(array('type' => 'all_to_send', 'timeout' => $iDeliveryTimeout));
        if(empty($aItems) || !is_array($aItems))
            return;

        $this->_oModule->_oDb->queueDeleteByIds(array_keys($aItems));

        /**
         * Settings are checked when a notification is added to this queue (BxNtfsCronNotify). 
         * Check the Studio switch again here, so turning a notification off for a delivery type 
         * also stops the ones which are already waiting. Items of deleted events are dropped too.
         */
        $aActive = array();

        $aSent = array();
        foreach($aItems as $aItem) {
            $sKey = (int)$aItem['event_id'] . '_' . $aItem['delivery'];
            if(!isset($aActive[$sKey]))
                $aActive[$sKey] = $this->_oModule->_oDb->isEventDeliveryActive($aItem['event_id'], $aItem['delivery']);

            if(!$aActive[$sKey])
                continue;

            if($this->_oModule->{'sendNotification' . bx_gen_method_name($aItem['delivery'])}($aItem['profile_id'], unserialize($aItem['content'])) !== false)
                $aSent[] = $aItem['id'];
        }
    }
}

/** @} */
