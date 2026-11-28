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

class BxAnonFollowModule extends BxDolModule
{
    public function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }
    
    /**
     * SERVICE METHODS
     */
    
    /**
     * @page service Service Calls
     * @section bx_anon_follow Anonymous Follow
     * @subsection bx_anon_follow-page_blocks Page Blocks
     * @subsubsection bx_anon_follow-get_profile_fields get_profile_fields
     * 
     * @code bx_srv('bx_anon_follow', 'get_profile_fields', [...]); @endcode
     * 
     * Get array with module filelds
     *
     * @param $aParams an array with search params.
     * @return array with module filelds
     * 
     * @see BxAnonFollowModule::GetProfileFields
     */
    /** 
     * @ref bx_anon_follow-get_profile_fields "get_profile_fields"
     */
    public function serviceGetProfileFields($sModule)
    {
        $aResult = array();
        $oModule = BxDolModule::getInstance($sModule);
        $aFields = BxDolRequest::serviceExists($sModule, 'get_searchable_fields_extended') ? BxDolService::call($sModule, 'get_searchable_fields_extended') : array();
        foreach($aFields as $sKey => $aField){
            if ($aField['type'] == 'text' || $aField['type'] == 'select')
            $aResult[$sKey] = _t($aField['caption']);
        }
        return $aResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_anon_follow Anonymous Follow
     * @subsection bx_anon_follow-page_blocks Page Blocks
     * @subsubsection bx_anon_follow-check_is_subscribed check_is_subscribed
     * 
     * @code bx_srv('bx_anon_follow', 'check_is_subscribed', [...]); @endcode
     * 
     * Get subscribed connection for specified profile
     *
     * @param $aParams an array with search params.
     * @return boolean connection for specified profile
     * 
     * @see BxAnonFollowModule::CheckIsSubscribed
     */
    /** 
     * @ref bx_anon_follow-check_is_subscribed "check_is_subscribed"
     */
    public function serviceCheckIsSubscribed ($iProfileId)
    {
        if(isset($iProfileId)){
            return !$this->checkIsSubscribed($iProfileId);
        }
        return false;
    }
    
    /**
     * @page service Service Calls
     * @section bx_anon_follow Anonymous Follow
     * @subsection bx_anon_follow-page_blocks Page Blocks
     * @subsubsection bx_anon_follow-subscribed_me_table subscribed_me_table
     * 
     * @code bx_srv('bx_anon_follow', 'subscribed_me_table', [...]); @endcode
     * 
     * Get grid with subscribers list
     *
     * @param $aParams an array with search params.
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxAnonFollowModule::serviceSubscribedMeTable
     */
    /** 
     * @ref bx_anon_follow-subscribed_me_table "subscribed_me_table"
     */
    public function serviceSubscribedMeTable ($iProfileId = 0)
    {
       
        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $aProfile = BxDolProfile::getInstance($iProfileId)->getInfo();
       
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        $oGrid = BxDolGrid::getObjectInstance('bx_anon_follow_grid_subscribed_me');

        if(!$oGrid)
            return false;
       
        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        
        $iCount = BxDolService::call('system', 'get_connected_initiators_num', array('sys_profiles_subscriptions', $aProfile['id']), 'TemplServiceConnections');
        return $this->_oTemplate->parseHtmlByName('connections_list.html', array(
            'name' => 'subscribers',
            'content' => $sContent,
            'count_info' => _t('_bx_anon_follow_txt_followers_count_info', $iCount),
        ));
    }
    
    /**
     * @page service Service Calls
     * @section bx_anon_follow Anonymous Follow
     * @subsection bx_anon_follow-page_blocks Page Blocks
     * @subsubsection bx_anon_follow-subscriptions_table subscriptions_table
     * 
     * @code bx_srv('bx_anon_follow', 'subscriptions_table', [...]); @endcode
     * 
     * Get grid with subscriptions list
     *
     * @param $aParams an array with search params.
     * @return HTML string with block content to display on the site. All necessary CSS and JS files are automatically added to the HEAD section of the site HTML.
     * 
     * @see BxAnonFollowModule::serviceSubscriptionsTable
     */
    /** 
     * @ref bx_anon_follow-subscriptions_table "subscriptions_table"
     */
    public function serviceSubscriptionsTable ($iProfileId = 0)
    {
        
        if(!$iProfileId && bx_get('profile_id') !== false)
            $iProfileId = bx_process_input(bx_get('profile_id'), BX_DATA_INT);

        $aProfile = BxDolProfile::getInstance($iProfileId)->getInfo();
        
        if(empty($aProfile) || !is_array($aProfile))
            return false;

        $oGrid = BxDolGrid::getObjectInstance('bx_anon_follow_grid_subscriptions');

        if(!$oGrid)
            return false;

        $oGrid->setProfileId($iProfileId);
        $sContent = $oGrid->getCode();
        if(empty($sContent))
            return false;

        
        $iCount = BxDolService::call('system', 'get_connected_content_num', array('sys_profiles_subscriptions', $aProfile['id']), 'TemplServiceConnections');
        return $this->_oTemplate->parseHtmlByName('connections_list.html', array(
            'name' => 'subscribers',
            'content' => $sContent,
            'count_info' => _t('_bx_anon_follow_txt_following_count_info', $iCount),
        ));
    }
    
    /**
     * @page service Service Calls
     * @section bx_anon_follow Anonymous Follow
     * @subsection bx_anon_follow-page_blocks Page Blocks
     * @subsubsection bx_anon_follow-include_js include_js
     * 
     * @code bx_srv('bx_anon_follow', 'include_js', [...]); @endcode
     * 
     * Add js to injection in head
     *
     * @param $aParams an array with search params.
     * @return void
     * 
     * @see BxAnonFollowModule::serviceIncludeJs
     */
    /** 
     * @ref bx_anon_follow-include_js "include_js"
     */
    public function serviceIncludeJs ()
    {
        $this->_oTemplate->addJs(array('main.js'));
        return ;
    }
    
    public function checkIsSubscribed($iProfileId)
    {
        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');
        if(!$oConnection){
            return false;
        }
		if($iProfileId == bx_get_logged_profile_id()){
            return true;
        }
        if($oConnection->isConnected(bx_get_logged_profile_id(), $iProfileId)){
            return true;
        }
    }
}

/** @} */
