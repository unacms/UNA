<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Services for dashboard objects functionality
 * @see BxDolChart
 */
class BxBaseDashboardServices extends BxDol
{
    public function serviceManageReports()
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_dashboard_reports');
        if(!$oMenu)
            return '';

        $aSystems = BxDolReport::getSystems();

        $sSelected = '';
        if(($_sSelected = bx_get('object')) !== false)
            $sSelected = bx_process_input($_sSelected);
        if(!$sSelected)
            $sSelected = reset($aSystems)['name'];

        $oGrid = BxDolGrid::getObjectInstance('sys_reports_administration');
        $oGrid->setObject($aSystems[$sSelected]['name']);

        if(!$oGrid)
            return '';

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->addJs(['BxDolReportsManageTools.js', 'BxDolGrid.js']);
        $oTemplate->addCss(['manage_tools.css']);
        $oTemplate->addJsTranslation(['_sys_grid_search']);

    	return [
            'content' =>$oGrid->getCode(),
            'menu' => $oMenu
        ];
    }
    
    public function serviceGetReportsCount($sObjectReposrt, $iStatus)
    {
        $oReport = BxDolReport::getObjectInstance($sObjectReposrt, 0, false);
        $iCount = $oReport->getCountByStatus($iStatus);
        
        if ($iCount > 0)
            return $iCount;
        
        return ;

    }
    
    public function serviceGetStatBlock()
    {
        $bApi = bx_is_api();
        if(!$bApi)
            return '';

        $aData = [];

        $bEmpty = defined('BX_API_PAGE');
        $iStartDate = time() - 24*3600*31;

        $iProfileId = (int)bx_get_logged_profile_id();
        $iV1 = $bEmpty ? 0 : BxDolConnection::getObjectInstance('sys_profiles_friends')->getConnectedContentCount($iProfileId, true);
        $iV2 =$bEmpty ? 0 :  BxDolConnection::getObjectInstance('sys_profiles_friends')->getConnectedContentCount($iProfileId, true, $iStartDate);
        $aData[] = ['title' => 'Friends', 'key' => 'friends', 'type' => 'growth', 'url' =>'/friends', 'current' => $iV1, 'prev' => $iV2, 'growth' => $iV2 > 0 ? round(($iV1 - $iV2)/$iV2*100, 2) : 0];
        
        $iV1 = $bEmpty ? 0 : BxDolConnection::getObjectInstance('sys_profiles_subscriptions')->getConnectedContentCount($iProfileId, false);
        $iV2 = $bEmpty ? 0 : BxDolConnection::getObjectInstance('sys_profiles_subscriptions')->getConnectedContentCount($iProfileId, false, $iStartDate);
        $aData[] = ['title' =>'Followers', 'key' => 'followers', 'type' => 'growth', 'url' =>'/followers', 'current' => $iV1, 'prev' => $iV2, 'growth' =>  $iV2 > 0 ? round(($iV1 - $iV2)/$iV2*100 ,2) : 0];
        
        $oPermalink = BxDolPermalinks::getInstance();
        
        $aModules = bx_srv('system', 'get_modules_by_type', ['content']);
        foreach($aModules as $aModule) {
            $oModule = BxDolModule::getInstance($aModule['name']);
            $CNF = &$oModule->_oConfig->CNF;
            if(method_exists($oModule->_oDb, 'getStatByProfile')) {
                $a = $bEmpty ? [] : $oModule->_oDb->getStatByProfile($iProfileId);

                $aData[] = array_merge([
                    'key' => $aModule['name'], 
                    'title' => $aModule['title'], 
                    'add_url' => !empty($CNF['URI_ADD_ENTRY']) ? $CNF['URI_ADD_ENTRY'] : '', 
                    'url' => !empty($CNF['URL_MANAGE_COMMON']) ? $oPermalink->permalink($CNF['URL_MANAGE_COMMON']) : '', 
                    'action' => 'views', 
                    'icon' => !empty($CNF['ICON']) ? $CNF['ICON'] : '', 
                    'type' => 'simple'
                ], $a);
            }
        }
       
        $aModules = bx_srv('system', 'get_modules_by_type', ['context']);
        foreach($aModules as $aModule) {
            $oModule = BxDolModule::getInstance($aModule['name']);
            $CNF = &$oModule->_oConfig->CNF;
            if (method_exists($oModule->_oDb, 'getStatByProfile')){
                $a = $bEmpty ? [] : $oModule->_oDb->getStatByProfile($iProfileId);

                $iMembers = 0;
                if(!$bEmpty && isset($CNF['OBJECT_CONNECTIONS']) && ($sConnection = $CNF['OBJECT_CONNECTIONS'])) {
                    $aContexts = $oModule->_oDb->getEntriesBy(['type' => 'author', 'author' => $iProfileId]);
                    foreach($aContexts as $aContext)
                        if(($oProfile = BxDolProfile::getInstanceByContentAndType($aContext[$CNF['FIELD_ID']], $aModule['name'])) !== false && ($oConnection = BxDolConnection::getObjectInstance($sConnection)) !== false)
                            $iMembers += $oConnection->getConnectedInitiatorsCount($oProfile->id(), true);
                }

                $aData[] = array_merge([
                    'key' => $aModule['name'], 
                    'title' => ($_sTitle = '_' . $aModule['name']) && ($sTitle = _t($_sTitle)) && $_sTitle != $sTitle ? $sTitle : $aModule['title'], 
                    'url' => $oPermalink->permalink($CNF['URL_MANAGE_COMMON']), 
                    'add_url' => str_replace('edit-', 'create-',$CNF['URI_EDIT_ENTRY']), 
                    'action' => 'member',  
                    'icon' => !empty($CNF['ICON']) ? $CNF['ICON'] : '', 
                    'type' => 'simple', 
                    'members' => $iMembers
                ], $a);
            }
        }

        return [bx_api_get_block('dashboard_stat', ['modules' => $aData])];
    }

    public function serviceGetAdminBlock()
    {
        $bApi = bx_is_api();
        if(!$bApi)
            return '';

        $oMenu = BxDolMenu::getObjectInstance('sys_account_dashboard_manage_tools');
        if(!$oMenu)
            return [];

        return [bx_api_get_block('dashboard_stat', ['manage' => $oMenu->getCodeAPI()])];
    }

    public function serviceManageAudit()
    {
        return bx_srv('system', 'manage_tools', array(), 'TemplAuditServices');
    }

    public function serviceManageContent()
    {
        $oMenu = BxDolMenu::getObjectInstance('sys_dashboard_content');
        if(!$oMenu)
            return '';

        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]);

    	$aModulesList = [];
        foreach($aModules as $aModule) {
            $oModule = BxDolModule::getInstance($aModule['name']);
            if(!$oModule || !($oModule instanceof iBxDolContentInfoService))
                continue;

            if(empty($oModule->_oConfig->CNF['OBJECT_GRID_ADMINISTRATION']) || !bx_is_srv($aModule['name'], 'manage_tools'))
                continue;

            $aModulesList[$aModule['uri']] = $aModule;
        }

        $sSelected = bx_get('module');        
        if($sSelected == '')
            $sSelected = reset($aModulesList)['uri'];

        $sContent = '';
        if(isset($aModulesList[$sSelected])) {
            $sSelectedModule = $aModulesList[$sSelected]['name'];

            $aBlock = bx_srv($sSelectedModule, 'manage_tools', array('administration'));
            if(!empty($aBlock) && is_array($aBlock))
                $sContent = $aBlock['content'];
        }
        else {
            $sSelectedModule = 'system';

            $sMethod = '_getManageContent' . bx_gen_method_name($sSelected);
            if(method_exists($this, $sMethod))
                $sContent = $this->$sMethod();
        }

        $oMenu->setMenuData($aModulesList);
        $oMenu->setSelected($sSelectedModule, $sSelected);

    	return array(
            'content' => $sContent,
            'menu' => $oMenu
        );
    }

    protected function _getManageContentCmts()
    {
        $aBlock = bx_srv('system', 'manage_tools', ['administration'], 'TemplCmtsServices');
        if(empty($aBlock) || !is_array($aBlock))
            return '';

        return $aBlock['content'];
    }
}

/** @} */
