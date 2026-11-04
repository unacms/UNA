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

class BxReputationModule extends BxBaseModNotificationsModule
{
    public function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->_oConfig->init($this->_oDb);
    }

    /**
     * ACTION METHODS
     */
    public function actionCheckName()
    {
        $CNF = &$this->_oConfig->CNF;

    	$sName = bx_process_input(bx_get('name'));
    	if(empty($sName))
            return echoJson([]);

        $sResult = '';
        if(($iId = (int)bx_get('id')) != 0) {
            $aLevel = $this->_oDb->getLevels(['sample' => 'id', 'id' => $iId]);
            if(strcmp($sName, $aLevel[$CNF['FIELD_LEVEL_NAME']]) == 0) 
                $sResult = $sName;
        }

    	echoJson([
            'name' => !empty($sResult) ? $sResult : $this->_oConfig->getLevelName($sName)
    	]);
    }

    public function actionGetLeaderboard()
    {
        $aParams = $this->_prepareParamsGet();

        return echoJson($this->serviceGetLeaderboard($aParams));
    }

    public function actionGetFiltersLeaderboard()
    {
        $aParams = $this->_prepareParamsGet();

        $sContent = $this->_oTemplate->getFiltersLeaderboard($aParams);
        if(empty($sContent))
            return echoJson([]);

        echoJson([
            'code' => 0,
            'popup' => [
                'html' => $sContent,
                'options' => [
                    'closeOnOuterClick' => true,
                    'removeOnClose' => false,
                ]
            ],
        ]);
    }

    /**
     * SERVICE METHODS
     */
    public function serviceGetSafeServices()
    {
        return array_merge(parent::serviceGetSafeServices(), [
            'GetLeaderboard' => '',
            'GetBlockActions' => '',
            'GetBlockLevels' => '',
            'GetBlockLeaderboard' => '',
            'GetBlockSummary' => '',
        ]);
    }

    public function serviceAssignPoints($iProfileId, $iPoints, $iContextId = 0)
    {
        return $this->assignPoints($iProfileId, $iContextId, $iPoints);
    }

    public function serviceGetLevels($iProfileId)
    {
        return $this->_oDb->getLevels([
            'sample' => 'profile_id', 
            'profile_id' => $iProfileId
        ]);
    }

    public function serviceGetLeaderboard($mixedParams)
    {
        // params from an API client, a string or an array, go through the same filter as the query string ones
        if($this->_bIsApi)
            $mixedParams = $this->_prepareParamsGet(is_string($mixedParams) ? bx_api_get_browse_params($mixedParams) : $mixedParams);

        $aResult = $this->_oTemplate->getBlockLeaderboard($mixedParams);
        if($this->_bIsApi)
            return $aResult;

        return !empty($aResult['content']) ? [
            'code' => 0, 
            'content' => $aResult['content'],
        ] : [];
    }

    public function serviceGetBlockActions($iStart = 0, $iLimit = 0)
    {
        if(($iGetStart = bx_get('start')) !== false)
            $iStart = (int)$iGetStart;
        if(($iGetPerPage = bx_get('per_page')) !== false)
            $iLimit = (int)$iGetPerPage;

        $mixedResult = $this->_oTemplate->getBlockActions($iStart, $iLimit);

        return !$this->_bIsApi ? $mixedResult : [
            bx_api_get_block('reputation_actions', $mixedResult)
        ];
    }

    public function serviceGetBlockLevels()
    {
        $mixedResult = $this->_oTemplate->getBlockLevels();

        return !$this->_bIsApi ? $mixedResult : [
            bx_api_get_block('reputation_levels', $mixedResult)
        ];
    }

    public function serviceGetBlockSummary($iProfileId = 0, $iContextId = 0)
    {
        if(!$iProfileId && ($iLoggedId = bx_get_logged_profile_id()))
            $iProfileId = $iLoggedId;
        if(!$iProfileId)
            return false;

        $mixedResult = $this->_oTemplate->getBlockSummary($iProfileId, $iContextId);

        return !$this->_bIsApi ? $mixedResult : [
            bx_api_get_block('reputation_summary', $mixedResult)
        ];
    }

    public function serviceGetBlockHistory($iProfileId = 0, $iContextId = 0, $iStart = 0, $iLimit = 0)
    {
        if(!$iProfileId && ($iLoggedId = bx_get_logged_profile_id()))
            $iProfileId = $iLoggedId;
        if(!$iProfileId)
            return false;

        if(($iGetStart = bx_get('start')) !== false)
            $iStart = (int)$iGetStart;
        if(($iGetPerPage = bx_get('per_page')) !== false)
            $iLimit = (int)$iGetPerPage;

        return $this->_oTemplate->getBlockHistory($iProfileId, $iContextId, $iStart, $iLimit);
    }

    public function serviceGetBlockLeaderboard($iContextId = 0, $iDays = 0, $bFilters = false, $bManage = false)
    {
        $mixedResult = $this->_oTemplate->getBlockLeaderboard([
            'context_id' => (int)$iContextId, 
            'days' => (int)$iDays,
            'filters' => (bool)$bFilters,
            'manage' => (bool)$bManage
        ]);

        return !$this->_bIsApi ? $mixedResult : [
            bx_api_get_block('reputation_leaderboard', $mixedResult)
        ];
    }

    public function serviceGetBlockManage($iContextId = 0)
    {
        $CNF = &$this->_oConfig->CNF;

        if(!$iContextId && ($_iContextId = bx_get('context_id')) !== false)
            $iContextId = (int)$_iContextId;

        if(($mixedResult = $this->checkAllowedManage($iContextId)) !== CHECK_ACTION_RESULT_ALLOWED)
            return $this->_bIsApi ? [bx_api_get_msg($mixedResult)] : MsgBox($mixedResult);

        $oGrid = BxDolGrid::getObjectInstance($CNF['OBJECT_GRID_MANAGE_LEADERBOARD']);
        if(!$oGrid)
            return '';

        $oGrid->setContextId($iContextId);

        if($this->_bIsApi)
            return [
                bx_api_get_block('grid', $oGrid->getCodeAPI())
            ];

        return $oGrid->getCode();
    }

    public function serviceGetBlockWidget($iProfileId = 0, $iContextId = 0, $aParams = [])
    {
        $iLoggedId = 0;
        if(!$iProfileId && ($iLoggedId = bx_get_logged_profile_id()))
            $iProfileId = $iLoggedId;
        if(!$iProfileId)
            return false;

        if(!$this->_bIsApi)
            return false;

        $sModule = $this->getName();
        $sLangKey = '_bx_reputation_page_block_title_';

        $sParamProfile = '&params[]=' . $iProfileId;
        $sParamContext = '&params[]=' . $iContextId;

        $aTabs = [
            'leaderboard_week' => [
                'url' => '/api.php?r=' . $sModule . '/get_block_leaderboard' . $sParamContext . '&params[]=7', 
                'title' => _t($sLangKey . 'leaderboard_week'),
            ], 
            'leaderboard_month' => [
                'url' => '/api.php?r=' . $sModule . '/get_block_leaderboard' . $sParamContext . '&params[]=30', 
                'title' => _t($sLangKey . 'leaderboard_month')
            ], 
            'leaderboard_all_time' => [
                'url' => '/api.php?r=' . $sModule . '/get_block_leaderboard' . $sParamContext . '', 
                'title' => _t($sLangKey . 'leaderboard_all_time')
            ],
            'summary' => [
                'url' => '/api.php?r=' . $sModule . '/get_block_summary' . $sParamProfile . $sParamContext, 
                'title' => _t($sLangKey . 'summary' . ($iProfileId == $iLoggedId ? '_own' : '')),
            ]
        ];

        if(($sKey = 'tabs_order') && !empty($aParams[$sKey]) && is_array($aParams[$sKey]))
            $aTabs = array_merge(array_flip($aParams[$sKey]), $aTabs);

        $sTabSelected = ($sKey = 'tab_selected') && !empty($aParams[$sKey]) && isset($aTabs[$aParams[$sKey]]) ? $aParams[$sKey] : array_key_first($aTabs);

        $aTabs[$sTabSelected] = array_merge($aTabs[$sTabSelected], [
            'selected' => true,
            'data' => $this->{'_getTabData' . bx_gen_method_name($sTabSelected)}((int)$iProfileId, (int)$iContextId),
        ]);

        return [
            bx_api_get_block('reputation_widget', [
                'tabs'=> array_values($aTabs)
            ])
        ];
    }

    private function _getTabDataLeaderboardWeek($iProfileId, $iContextId)
    {
        return $this->_oTemplate->getBlockLeaderboard([
            'profile_id' => $iProfileId,
            'context_id' => $iContextId,
            'days' => 7
        ]);
    }

    private function _getTabDataLeaderboardMonth($iProfileId, $iContextId)
    {
        return $this->_oTemplate->getBlockLeaderboard([
            'profile_id' => $iProfileId,
            'context_id' => $iContextId,
            'days' => 30
        ]);
    }

    private function _getTabDataLeaderboardAllTime($iProfileId, $iContextId)
    {
        return $this->_oTemplate->getBlockLeaderboard([
            'profile_id' => $iProfileId,
            'context_id' => $iContextId
        ]);
    }

    private function _getTabDataSummary($iProfileId, $iContextId)
    {
        return $this->_oTemplate->getBlockSummary($iProfileId, $iContextId);
    }

    /**
     * @return CHECK_ACTION_RESULT_ALLOWED if access is granted or error message if access is forbidden. So make sure to make strict(===) checking.
     */
    public function checkAllowedManage ($iContextId = 0, $isPerformAction = false)
    {
        // moderator have access
        if($this->_isModerator($isPerformAction))
            return CHECK_ACTION_RESULT_ALLOWED;

        // check for context's admins 
        if($iContextId && ($oContext = BxDolProfile::getInstance($iContextId)) !== false) {
            $sModule = $oContext->getModule();
            $oModule = BxDolModule::getInstance($sModule);

            // check for context's extra roles with rights
            if (method_exists($oModule, 'isAllowedModuleActionByProfile')) {
                $bResult = $oModule->isAllowedModuleActionByProfile($oContext->getContentId(), $this->getName(), 'edit_any');
                if($bResult !== NULL) 
                    return $bResult;
            }

            $aEntity = [];
            if(($sMethod = 'get_all') && bx_is_srv($sModule, $sMethod))
                $aEntity = bx_srv($sModule, $sMethod, [['type' => 'id', 'id' => $oContext->getContentId()]]);

            // if allowed edit a group then allowed to edit anything inside its context
            if(!empty($aEntity) && $oModule->checkAllowedEdit($aEntity) === CHECK_ACTION_RESULT_ALLOWED)
                return CHECK_ACTION_RESULT_ALLOWED;
        }

        return _t('_sys_txt_access_denied');
    }

    /**
     * COMMON METHODS
     */
    public function assignPoints($iProfileId, $iContextId, $iPoints)
    {
        if(!$this->_oDb->insertProfile($iProfileId, $iContextId, $iPoints))
            return false; 

        $this->assignLevels($iProfileId, $iContextId);

        return true; 
    }

    public function assignLevels($iProfileId, $iContextId)
    {
        $bMultilevel = $this->_oConfig->isMultilevel();
        $iProfilePoints = $this->_oDb->getProfilePoints($iProfileId, $iContextId);

        $aLevels = $this->_oDb->getLevels([
            'sample' => 'points', 
            'points' => $iProfilePoints
        ]);

        if($bMultilevel)
            $this->_oDb->deleteProfilesLevelsByPoints($iProfileId, $iContextId, $iProfilePoints);

        foreach($aLevels as $aLevel) {
            $iLevelId = (int)$aLevel['id'];
            if($this->hasLevel($iProfileId, $iContextId, $iLevelId))
                continue;

            if(!$bMultilevel)
                $this->_oDb->deleteProfilesLevels([
                    'sample' => 'profile_id', 
                    'profile_id' => $iProfileId, 
                    'context_id' => $iContextId
                ]);

            $this->_oDb->insertProfilesLevels($iProfileId, $iContextId, $iLevelId);
        }
    }

    public function hasLevel($iProfileId, $iContextId, $iLevelId)
    {
        $aProfileLevels = $this->_oDb->getLevels([
            'sample' => 'profile_id', 
            'profile_id' => $iProfileId,
            'context_id' => $iContextId
        ]);

        foreach($aProfileLevels as $aProfileLevel)
            if($aProfileLevel['id'] == $iLevelId)
                return true;

        return false;
    }

    public function  getUnitTitle($sUnit)
    {
        if(($sKey = '_' . $sUnit) && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            return $_sKey;

        if(($sKey = '_bx_reputation_txt_au_' . $sUnit) && ($_sKey = _t($sKey)) && strcmp($sKey, $_sKey) != 0)
            return $_sKey;

        if(($iPosition = strpos($sUnit, '_fans')) !== false)
            return _t('_bx_reputation_txt_au_module_fans', _t('_' . substr($sUnit, 0, $iPosition)));

        return $sUnit;
    }

    public function  getActionTitle($sAction)
    {
        return _t('_bx_reputation_txt_aa_' . $sAction);
    }

    protected function _prepareParamsGet($mParams = false)
    {
        $aKeys = ['name', 'context_id', 'days', 'username', 'start', 'per_page'];

        $aParams = [];
        if(!empty($mParams) && is_array($mParams))
            foreach($aKeys as $sKey)
                $aParams[$sKey] = isset($mParams[$sKey]) ? $mParams[$sKey] : false;
        else
            foreach($aKeys as $sKey)
                $aParams[$sKey] = bx_get($sKey);

        $aParams['name'] = $aParams['name'] !== false ? bx_process_input($aParams['name']) : '';
        $aParams['context_id'] = $aParams['context_id'] !== false ? bx_process_input($aParams['context_id'], BX_DATA_INT) : 0;

        $aParams['days'] = $aParams['days'] !== false ? bx_process_input(str_replace('d-', '', $aParams['days']), BX_DATA_INT) : 0;
        $aParams['username'] = $aParams['username'] !== false ? bx_process_input($aParams['username']) : '';

        $aParams['start'] = $aParams['start'] !== false ? bx_process_input($aParams['start'], BX_DATA_INT) : 0;
        $aParams['per_page'] = $aParams['per_page'] !== false ? bx_process_input($aParams['per_page'], BX_DATA_INT) : 12;

        return array_merge($aParams, [
            'dynamic_mode' => true,
        ]);
    }
}

/** @} */
