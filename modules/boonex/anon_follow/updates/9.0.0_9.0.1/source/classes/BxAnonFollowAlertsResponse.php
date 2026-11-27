<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    AnonymousFollow Anonymous Follow
 * @ingroup     UnaModules
 *
 * @{
 */

class BxAnonFollowAlertsResponse extends BxDolAlertsResponse
{
    public function __construct()
    {
        parent::__construct();
    }
    
    public function response($oAlert)
    {
        if ($oAlert->sUnit == 'sys_profiles_subscriptions'){
            if ($oAlert->sAction == 'connection_added'){
                if (isset($oAlert->aExtras['initiator']) && isset($oAlert->aExtras['content']) && bx_get('anon') == '1'){
                    $oModule = BxDolModule::getInstance('bx_anon_follow');
                    $oModule->_oDb->addFollower($oAlert->aExtras['initiator'], $oAlert->aExtras['content']);
                }
            }
            
            if ($oAlert->sAction == 'connection_removed'){
                if (isset($oAlert->aExtras['initiator']) && isset($oAlert->aExtras['content'])){
                    $oModule = BxDolModule::getInstance('bx_anon_follow');
                    $oModule->_oDb->removeFollower($oAlert->aExtras['initiator'], $oAlert->aExtras['content']);
                }
            }
        }
        
        if ($oAlert->sAction == 'menu_custom_item'){
            if($oAlert->aExtras['item']['module'] == 'bx_anon_follow' && $oAlert->aExtras['item']['name'] == 'anon-follow'){
                $oModule = BxDolModule::getInstance('bx_anon_follow');
                $oAlert->aExtras['res'] = '';
                $bIsSubscribed = $oModule->checkIsSubscribed($oAlert->aExtras['content_data']['profile_id']);
                if ($bIsSubscribed){
                    $oAlert->aExtras['res'] = '';
                    return;
                }
                $oAlert->aExtras['res'] = $oModule->_oTemplate->parseHtmlByName('follow_button.html', array(
                    'profile_id' => $oAlert->aExtras['content_data']['profile_id'],
                    'title' => _t('_bx_anon_follow_txt_button')
                ));
            }
        }
    }
}

/** @} */
