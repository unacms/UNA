<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 * 
 * @{
 */

class BxBaseModGroupsCronPruning extends BxDolCron
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct();
    }

    function processing()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $oPayments = BxDolPayments::getInstance();

        $aRoles = $this->_oModule->_oDb->getRoles(array('type' => 'expired'));
        foreach($aRoles as $aRole) {
            $aSubscription = $oPayments->getSubscriptionsInfo(array('subscription_id' => $aRole['order']), true);
            if(!empty($aSubscription) && is_array($aSubscription)) {
                $aSubscription = array_shift($aSubscription);

                $iRecurringReserve = 86400 * $CNF['PARAM_RECURRING_RESERVE'];
                if($aSubscription['data']['status'] == 'active') {
                    $this->_oModule->_oDb->updateRoles(array('expired' => $aSubscription['data']['cperiod_end'] + $iRecurringReserve), array('id' => $aRole['id']));
                    continue;
                }
                else {
                    $oPayments->sendSubscriptionExpirationLetters($aSubscription['pending_id'], $aRole['order']);

                    $this->_oModule->_oDb->updateRoles(array('expired' => $aRole['expired'] + $iRecurringReserve), array('id' => $aRole['id']));
                    continue;
                }
            }

            $this->_oModule->unsetRole($aRole['group_profile_id'], $aRole['fan_id']);
        }
    }
}

/** @} */
