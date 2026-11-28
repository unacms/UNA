<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Reputation Reputation
 * @ingroup     UnaModules
 *
 * @{
 */

class BxReputationAlertsResponse extends BxBaseModNotificationsResponse
{
    public function __construct()
    {
        $this->_sModule = 'bx_reputation';

        parent::__construct();
    }

    public function response($oAlert)
    {
        parent::response($oAlert);

        $sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction);           	
        if(method_exists($this, $sMethod))
            return $this->$sMethod($oAlert);

        /**
         * @hooks
         * @hookdef hook-bx_reputation-before_register_alert 'bx_reputation', 'before_register_alert' - hook to override alert (hook) before processing
         * - $unit_name - equals `bx_reputation`
         * - $action - equals `before_register_alert`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `unit` - [string] alert (hook) unit
         *      - `action` - [string] alert (hook) action
         *      - `alert` - [array] by ref, an instance of alert (hook), @see BxDolAlerts, can be overridden in hook processing        
         * @hook @ref hook-bx_reputation-before_register_alert
         */
        bx_alert($this->_oModule->getName(), 'before_register_alert', 0, 0, [
            'unit' => $oAlert->sUnit,
            'action' => $oAlert->sAction,
            'alert' => &$oAlert,
        ]);

        if(($sMethod = '_checkByAction' . bx_gen_method_name($oAlert->sAction)) && method_exists($this, $sMethod) && !$this->$sMethod($oAlert))
            return;

        $aHandler = $this->_oModule->_oConfig->getHandlers($oAlert->sUnit . '_' . $oAlert->sAction);
        if(empty($aHandler) || !is_array($aHandler))
            return;

        $iOwnerId = $oAlert->iSender;
        $iObjectOwnerId = abs($this->_getObjectOwnerId($oAlert->aExtras));
        $iObjectPrivacyView = $this->_getObjectPrivacyView($oAlert->aExtras);

        $bInContext = $iObjectPrivacyView < 0;
        $iContextId = $bInContext ? abs($iObjectPrivacyView) : 0;

        $aEvent = [
            'owner_id' => 0,
            'context_id' => $iContextId,
            'type' => $oAlert->sUnit,
            'action' => $oAlert->sAction,
            'object_id' => $oAlert->iObject,
            'object_owner_id' => $iObjectOwnerId,
            'points' => 0,
            'date' => time()
        ];

        if(($iPoints = (int)$aHandler['points_active']) != 0) {
            $this->_oModule->_oDb->insertEvent(array_merge($aEvent, [
                'owner_id' => $iOwnerId, 
                'points' => $iPoints
            ]));

            $this->_oModule->assignPoints($iOwnerId, 0, $iPoints);
            if($bInContext)
                $this->_oModule->assignPoints($iOwnerId, $iContextId, $iPoints);
        }

        if(($iPoints = (int)$aHandler['points_passive']) != 0 && $iOwnerId != $iObjectOwnerId) {
            $this->_oModule->_oDb->insertEvent(array_merge($aEvent, [
                'owner_id' => $iObjectOwnerId, 
                'points' => $iPoints
            ]));

            $this->_oModule->assignPoints($iObjectOwnerId, 0, $iPoints);
            if($bInContext)
                $this->_oModule->assignPoints($iObjectOwnerId, $iContextId, $iPoints);
        }
    }

    protected function _checkByActionConnectionAdded($oAlert)
    {
        if(($sType = $oAlert->aExtras['object']->getType()) && ($sType == 'one-way' || ($sType == 'mutual' && $oAlert->aExtras['mutual'])))
            return true;

        return false;
    }

    protected function _processProfileDelete($oAlert)
    {
        $this->_oModule->_oDb->deleteProfile($oAlert->iObject);
    }
}

/** @} */
