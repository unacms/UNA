<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Invites Invites
 * @ingroup     UnaModules
 *
 * @{
 */

class BxInvResponse extends BxDolAlertsResponse
{
    protected $_sModule;
    protected $_oModule;

    public function __construct()
    {
        parent::__construct();

        $this->_sModule = 'bx_invites';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);
    }

    /**
     * Overwtire the method of parent class.
     *
     * @param BxDolAlerts $oAlert an instance of alert.
     */
    public function response($oAlert)
    {
        $sMethod = '_process' . bx_gen_method_name($oAlert->sUnit . '_' . $oAlert->sAction);
        if(!method_exists($this, $sMethod))
            return;

        return $this->$sMethod($oAlert);
    }

    protected function _processAccountAddFormCheck($oAlert)
    {
        $sKey = $this->_oModule->_oConfig->getKey();
        if($sKey === false)
            return;

        $aInvite = $this->_oModule->_oDb->getInvites(['type' => 'by_key', 'key' => $sKey]);
        if(!empty($aInvite) && is_array($aInvite) && (int)$aInvite['email_use'] != 0) {
            $oForm = &$oAlert->aExtras['form_object'];
            if($oForm->isSubmittedAndValid() && $oForm->aInputs['email']['value'] != $aInvite['email']) {
                $oForm->aInputs['email']['error'] = _t('_bx_invites_err_wrong_email');

                $oForm->setValid(false);
            }
        }
    }

    protected function _processAccountAddForm($oAlert)
    {
        if(!($sCode = $this->_oModule->serviceAccountAddFormCheck())) {
            $aInvite = $this->_oModule->_oDb->getInvites([
                'type' => 'by_key', 
                'key' => $this->_oModule->_oConfig->getKey()
            ]);

            if(!empty($aInvite) && is_array($aInvite)) {
                $bGetCode = false;

                if(!empty($aInvite['email_use'])) {
                    $oAlert->aExtras['form_object']->aInputs['email']['value'] = $aInvite['email'];

                    if(!is_array($oAlert->aExtras['form_object']->aInputs['email']['attrs']))
                        $oAlert->aExtras['form_object']->aInputs['email']['attrs'] = [];
                    $oAlert->aExtras['form_object']->aInputs['email']['attrs']['readonly'] = 'readonly';

                    $bGetCode = true;
                }

                if(!empty($aInvite['aj_action']) && in_array($aInvite['aj_action'], ['redirect', 'invite_to_context'])) {
                    $sRedirectUrl = '';

                    switch($aInvite['aj_action']) {
                        case 'redirect':
                            if(!empty($aInvite['aj_params']))
                                $sRedirectUrl = BxDolPermalinks::getInstance()->permalink($aInvite['aj_params']);
                            break;

                        case 'invite_to_context':
                            if(($iContextPid = (int)$aInvite['aj_params']) && ($oContext = BxDolProfile::getInstanceMagic($iContextPid)))
                                $sRedirectUrl = $oContext->getUrl();
                            break;
                    }

                    if($sRedirectUrl) {
                        $sRedirectUrl = bx_absolute_url($sRedirectUrl);
                        if(bx_is_api())
                            $sRedirectUrl = bx_api_get_relative_url($sRedirectUrl);

                        $oAlert->aExtras['form_object']->aInputs['relocate'] = [
                            'name' => 'relocate',
                            'type' => 'hidden',
                            'value' => $sRedirectUrl
                        ];
                    }

                    $bGetCode = true;
                }

                if($bGetCode)
                    $oAlert->aExtras['form_code'] = $oAlert->aExtras['form_object']->getCode();
            }
        }
        else {
            $oAlert->aExtras['form_code'] = $sCode;
            if(bx_is_api())
                $oAlert->aExtras['form_code_api'] = $this->_oModule->_oTemplate->getBlockRequestAPI($sCode);
            $oAlert->aExtras['form_object'] = false;
        }
    }

    protected function _processAccountAdded($oAlert)
    {
        $sKey = $this->_oModule->_oConfig->getUnsetKey();
        if($sKey === false)
            return;

        $this->_oModule->attachAccountIdToInvite($oAlert->iObject, $sKey);

        /**
         * Don't remove key if multi join invitation was used.
         */
        if(($aInvite = $this->_oModule->_oDb->getInvites(['type' => 'by_key', 'key' => $sKey])) && is_array($aInvite) && (int)$aInvite['multi'] != 0)
            return;

        $aKeysToRemove = [$sKey];
        if(($sKeysToRemove = $this->_oModule->_oDb->getInvites(['type' => 'invites_code_by_single', 'value' => $sKey])))
            $aKeysToRemove = explode(',', $sKeysToRemove);  

        $oKeys = BxDolKey::getInstance();
        foreach($aKeysToRemove as $sKeyToRemove)
            if($oKeys->isKeyExists($sKeyToRemove))
                $oKeys->removeKey($sKeyToRemove);
    }

    protected function _processProfileAdd($oAlert)
    {
        $oProfile = BxDolProfile::getInstanceMagic($oAlert->iObject);
        if(!$oProfile || !$oProfile->isActAsProfile())
            return;

        $aInvite = $this->_oModule->_oDb->getInvites([
            'type' => 'by_joined_account_id', 
            'account_id' => $oProfile->getAccountId()
        ]);
        $bInvite = !empty($aInvite) && is_array($aInvite);

        //--- Check 'invite_to_context'
        if($bInvite && !empty($aInvite['aj_action']) && $aInvite['aj_action'] == 'invite_to_context')
            $this->_oModule->processInviteToContext($oAlert->iObject, (int)$aInvite['aj_params']);

        //--- Check automatic befriending
        if(getParam('bx_invites_automatically_befriend') == 'on') {
            $bNeedToFriend = true;

            /**
             * @hooks
             * @hookdef hook-bx_invites-add_friend 'bx_invites', 'add_friend' - hook on add friend on new user registred by invitaion
             * - $unit_name - equals `add_friend`
             * - $action - equals `invite` 
             * - $object_id - not used
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `profile_id` - [int] profile_id for user registred by invitaion
             *      - `override_result` - [bool] by ref, if true friend will be added, can be overridden in hook processing
             * @hook @ref hook-bx_invites-add_friend
             */
            bx_alert($this->_sModule, 'add_friend', 0, 0, [
                'profile_id' => $oAlert->iObject,
                'override_result' => &$bNeedToFriend,
            ]);

            if($bNeedToFriend) {
                $iProfileInvitor = $this->_oModule->_oDb->getInvites([
                    'type' => 'profile_id_by_joined_account_id', 
                    'value' => $oProfile->getAccountId()
                ]);

                if($iProfileInvitor && ($oConnection = BxDolConnection::getObjectInstance('sys_profiles_friends')) !== false){
                    $oConnection->addConnection($oAlert->iObject, $iProfileInvitor);
                    $oConnection->addConnection($iProfileInvitor, $oAlert->iObject);
                }
            }
        }
        
        
    }
    
    protected function _processProfileDelete($oAlert)
    {
        $this->_oModule->_oDb->deleteInvites(array('profile_id' => $oAlert->iObject));
    }
    
    protected function _processAccountDelete($oAlert)
    {
        $this->_oModule->_oDb->deleteInvitesByAccount(array('joined_account_id' => $oAlert->iObject));
    }
    
    protected function _processBxAnalyticsGetModules($oAlert)
    {
        $oAlert->aExtras['list'][$this->_oModule->_aModule['name']] = $this->_oModule->_aModule['title'];
    }
    
    protected function _processBxAnalyticsGetReports($oAlert)
    {
        if ($this->_oModule->_aModule['name'] == $oAlert->aExtras['module']){
            $oAlert->aExtras['list'] = array();
            $oAlert->aExtras['list']['content_total_invited'] = _t('_bx_invites_reports_for_analytics_invited_total');
            $oAlert->aExtras['list']['content_speed_invited'] = _t('_bx_invites_reports_for_analytics_invited_speed_grows');
            $oAlert->aExtras['list']['content_total_invitation'] = _t('_bx_invites_reports_for_analytics_invitation_total');
            $oAlert->aExtras['list']['content_speed_invitation'] = _t('_bx_invites_reports_for_analytics_invitation_speed_grows');
        }
    }
    
    protected function _processBxAnalyticsGetChartDataLine($oAlert)
    {
        if ($this->_oModule->_aModule['name'] == $oAlert->aExtras['module']){
            $bIsInvited = false; 
            if (substr_count($oAlert->aExtras['report_name'], '_invited') > 0)
                $bIsInvited = true; 
            
            if (substr_count($oAlert->aExtras['report_name'], '_total_') > 0)
                $oAlert->aExtras['report_type'] = BX_ANALYTICS_CONTENT_TOTAL;
            
            $oAlert->aExtras['data'] = $this->_oModule->_oDb->getDataForCharts($oAlert->aExtras['date_from'], $oAlert->aExtras['date_to'], $bIsInvited);
            $oAlert->aExtras['prev_value'] = $this->_oModule->_oDb->getInitValueForCharts($oAlert->aExtras['date_from'], $bIsInvited);
        }
    }
}

/** @} */
