<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Charts Charts
 * @ingroup     UnaModules
 *
 * @{
 */

class BxChartsModule extends BxDolModule
{
    protected $aColors = array('#3366CC','#DC3912','#FF9900','#109618','#990099','#3B3EAC','#0099C6','#DD4477','#66AA00','#B82E2E','#316395','#994499','#22AA99','#AAAA11','#6633CC','#E67300','#8B0707','#329262','#5574A6','#3B3EAC');
    
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }
    
    /**
     * Service methods
     */
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts get_profile_modules
     * 
     * @code bx_srv('bx_charts', 'get_profile_modules', [...]); @endcode
     * 
     * Get list of avaliable profile modules
     * 
     * @return an array with avaliable modules. 
     * 
     * @see BxChartsModule::serviceGetProfileModules
     */
    /** 
     * @ref bx_charts-get_profile_modules "get_profile_modules"
     */
    public function serviceGetProfileModules()
    {
        $aResult = array();
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            if(BxDolRequest::serviceExists($aModule['name'], 'act_as_profile') && BxDolService::call($aModule['name'], 'act_as_profile') == true){
                $aResult[$aModule['name']] = $aModule['title'];
            }
        }
        return $aResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts-on-profile get_text_modules
     * 
     * @code bx_srv('bx_charts', 'get_text_modules', [...]); @endcode
     * 
     * Get list of avaliable text modules
     * 
     * @return an array with avaliable modules. 
     * 
     * @see BxChartsModule::serviceGetTextModules
     */
    /** 
     * @ref bx_charts-get_text_modules "get_text_modules"
     */
    public function serviceGetTextModules()
    {
        $aResult = array();
        $BxDolModuleQuery = BxDolModuleQuery::getInstance();
        $aModules = $BxDolModuleQuery->getModulesBy(array('type' => 'modules', 'active' => 1));
        foreach($aModules as $aModule){
            $oModule = BxDolModule::getInstance($aModule['name']);
            if($oModule instanceof iBxDolContentInfoService && isset($oModule->_oConfig->CNF['OBJECT_VOTES'])){
                $aResult[$aModule['name']] = $aModule['title'];
            }
        }
        return $aResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts get_modules
     * 
     * @code bx_srv('bx_charts', 'get_modules', [...]); @endcode
     * 
     * Get list of avaliable modules
     * 
     * @return an array with avaliable modules. 
     * 
     * @see BxChartsModule::serviceGeModules
     */
    /** 
     * @ref bx_charts-get_modules "get_modules"
     */
    public function serviceGetModules()
    {
        $aResult = array();
        $aItems = $this->_oDb->getStatistic();
        foreach($aItems as $aItem) {
            $aResult[$aItem['name']] = _t($aItem['title']);
        }
        return $aResult;
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts get_growth_group_by
     * 
     * @code bx_srv('bx_charts', 'get_growth_group_by', [...]); @endcode
     * 
     * Get list of avaliable grouping mode(day/week/month)
     * 
     * @return an array with avaliable grouping mode(day/week/month). 
     * 
     * @see BxChartsModule::serviceGetGrowthGroupBy
     */
    /** 
     * @ref bx_charts-get_growth_group_by "get_growth_group_by"
     */
    public function serviceGetGrowthGroupBy()
    {
        return array('date' => _t('_bx_charts_txt_growth_group_by_day'),'week' => _t('_bx_charts_txt_growth_group_by_week'),'month' => _t('_bx_charts_txt_growth_group_by_month'));
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts-on-profile get_chart_top_contents_by_likes
     * 
     * @code bx_srv('bx_charts', 'get_chart_top_contents_by_likes', [...]); @endcode
     * 
     * Get Chart Top Contents By Likes
     * 
     * @return an html for chart. 
     * 
     * @see BxChartsModule::serviceGetChartTopContentsByLikes
     */
    /** 
     * @ref bx_charts-get_chart_top_contents_by_likes "get_chart_top_contents_by_likes"
     */
    public function serviceGetChartTopContentsByLikes()
    {
        return $this->_oTemplate->getChart('TopContentsByLikes', 100);
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts-on-profile get_chart_most_active_profiles
     * 
     * @code bx_srv('bx_charts', 'get_chart_most_active_profiles', [...]); @endcode
     * 
     * Get Chart Most Active Profiles
     * 
     * @return an html for chart. 
     * 
     * @see BxChartsModule::serviceGetChartMostActiveProfiles
     */
    /** 
     * @ref bx_charts-get_chart_most_active_profiles "get_chart_most_active_profiles"
     */
    public function serviceGetChartMostActiveProfiles()
    {
        return $this->_oTemplate->getChart('MostActiveProfiles', 80);
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts-on-profile get_chart_most_followed_profiles
     * 
     * @code bx_srv('bx_charts', 'get_chart_most_followed_profiles', [...]); @endcode
     * 
     * Get Chart Most Followed Profiles
     * 
     * @return an html for chart. 
     * 
     * @see BxChartsModule::serviceGetChartMostFollowedProfiles
     */
    /** 
     * @ref bx_charts-get_chart_most_followed_profiles "get_chart_most_followed_profiles"
     */
    public function serviceGetChartMostFollowedProfiles()
    {
        return $this->_oTemplate->getChart('MostFollowedProfiles', 40);
    }
    
    /**
     * @page service Service Calls
     * @section bx_charts Charts
     * @subsection bx_charts-other Other
     * @subsubsection bx_charts-on-profile get_chart_growth_by_modules
     * 
     * @code bx_srv('bx_charts', 'get_chart_growth_by_modules', [...]); @endcode
     * 
     * Get Chart Growth By Modules
     * 
     * @return an html for chart. 
     * 
     * @see BxChartsModule::serviceGetChartGrowthByModules
     */
    /** 
     * @ref bx_charts-get_chart_growth_by_modules "get_chart_growth_by_modules"
     */

    public function serviceGetChartGrowthByModules()
    {
        return $this->_oTemplate->getChartGrowth('GrowthByModules', 75);
    }
    
    public function actionGetChartData($Id = 0)
    {
        if(!isAdmin() && !bx_acl_is_advanced())
            return echoJson([]);

        header('Content-Type: application/json');
        if ($Id == 'TopContentsByLikes'){
            $aValues = array('labels' => array(), 'values' => array(), 'colors' => array(), 'links' => array());
            $aData = $this->_oDb->getTopByLikes();
            foreach ($aData as $aValue) {
                $oModule = BxDolModule::getInstance($aValue['module']);
                array_push($aValues['labels'], $this->getItemName($oModule->serviceGetTitle($aValue['object_id'])) . ' (' . $oModule->_aModule['title'].')'. ' - ' . $aValue['value']);
                array_push($aValues['values'], $aValue['value']);
                array_push($aValues['links'], $oModule->serviceGetLink($aValue['object_id']));
            }
            $aValues['colors'] = array_slice($this->aColors, 0, count($aValues['values']));

            echo json_encode([
                "type" => "doughnut", 
                "data" => [
                    "labels" => $aValues['labels'],
                    "datasets" => [[
                        "data" => $aValues['values'],
                        "backgroundColor" => $aValues['colors'],
                    ]],
                ], 
                "options" => [
                    "plugins" => [
                        "legend" => [
                            "position" => "bottom",
                        ],
                    ],
                ], 
                "links" => $aValues['links'],
            ]);
        }
        
        if ($Id == 'MostActiveProfiles'){
            $aValues = array('labels' => array(), 'values1' => array(), 'values2' => array(), 'links' => array());
            $aData = $this->_oDb->getMostActiveProfiles();
            foreach ($aData as $aValue) {
                $oModule = BxDolModule::getInstance($aValue['module']);
                array_push($aValues['labels'], $this->getItemName($oModule->serviceGetTitle($aValue['object_id'])));
                array_push($aValues['values1'], $aValue['create_count']);
                array_push($aValues['values2'], $aValue['views_count']);
                array_push($aValues['links'], $oModule->serviceGetLink($aValue['object_id']));
            }
            echo json_encode([
                "type" => "bar",
                "data" => [
                    "labels" => $aValues['labels'],
                    "datasets" => [
                        [
                            "label" => _t('_bx_charts_most_active_profiles_legend_posts'),
                            "backgroundColor" => $this->aColors[0],
                            "borderColor" => $this->aColors[0],
                            "borderWidth" => 1,
                            "data" => $aValues['values1'],
                        ], [
                            "label" => _t('_bx_charts_most_active_profiles_legend_views'),
                            "backgroundColor" => $this->aColors[1],
                            "borderColor" => $this->aColors[1],
                            "borderWidth" => 1,
                            "data" => $aValues['values2'],
                        ]
                    ]
                ],
                "options" => [
                    "plugins" => [
                        "legend" => [
                            "position" => "bottom",
                        ],
                    ],
                ], 
                "links" => $aValues['links'],
            ]);
        }
        
        if ($Id == 'MostFollowedProfiles'){
            $aValues = array('labels' => array(), 'values' => array(), 'links' => array());
            $aData = $this->_oDb->getMostFollowedProfiles();
            foreach ($aData as $aValue) {
                $oModule = BxDolModule::getInstance($aValue['module']);
                array_push($aValues['labels'], $this->getItemName($oModule->serviceGetTitle($aValue['object_id'])));
                array_push($aValues['values'], $aValue['followers_count']);
                array_push($aValues['links'], $oModule->serviceGetLink($aValue['object_id']));
            }
            echo  json_encode([
                "type" => "bar",
                "data" => [
                    "labels" => $aValues['labels'],
                    "datasets" => [[
                        "label" => _t('_bx_charts_most_followed_profiles_legend'),
                        "backgroundColor" => $this->aColors[0],
                        "borderColor" => $this->aColors[0],
                        "borderWidth" => 1,
                        "data" => $aValues['values'],
                    ]], 
                ],
                "options" => [
                    "plugins" => [
                        "legend" => [
                            "position" => "bottom",
                        ],
                    ],
                ], 
                "links" => $aValues['links'],
            ]);
        }
        
        if ($Id == 'GrowthByModules'){
            $aValues = array('labels' => array(), 'values1' => array(), 'values2' => array(), 'links' => array());

            $aTmp = $this->getSelectedModulesGrowth();

            $sModuleName = $sTableName = bx_get('m');
            if (empty($sModuleName)) {
                $sModuleName = $sTableName = $aTmp[0][0];
            }

            $sModuleTitle = '';
            if(!($sModuleTitle = $aTmp[1][$sModuleName] ?? false))
                return echoJson([]);

            $oModule = BxDolModule::getInstance($sModuleName);
            if (isset($oModule->_oConfig->CNF['TABLE_ENTRIES']))
                $sTableName = $oModule->_oConfig->CNF['TABLE_ENTRIES'];

            $aData = $this->_oDb->getGrowth($sTableName);
            $aTmp2 = $this->_oDb->getGrowthInitValue($sTableName); 
            $iValuePrev = $aTmp2[0]; 
            $sGroupBy = getParam('bx_charts_chart_growth_group_by');
            foreach ($aData as $aValue) {
                $aValue['count1'] = $iValuePrev + $aValue['count'];
                $iX = $this->getXValueByParams($aValue, getParam('bx_charts_chart_growth_group_by'));
                array_push($aValues['values1'], array('x' => $iX , 'y' => $aValue['count1']));
                array_push($aValues['values2'], array('x' => $iX, 'y' => $aValue['count']));
                $iValuePrev = $aValue['count1'];
            }

            echo json_encode([
                "type" => "line",
                "data" => [
                    "datasets" => [[
                        "label" => $sModuleTitle . ':' . _t('_bx_charts_growth_speed_legend'),
                        "fill" => false,
                        "backgroundColor" => $this->aColors[2],
                        "borderColor" => $this->aColors[2],
                        "borderWidth" => 1,
                        "data" => $aValues['values2'],
                    ], [
                        "label" => $sModuleTitle . ':' . _t('_bx_charts_growth_legend'),
                        "fill" => false,
                        "backgroundColor" => $this->aColors[3],
                        "borderColor" => $this->aColors[3],
                        "borderWidth" => 1,
                        "data" => $aValues['values1'],
                    ]]
                ], 
                "options" => [
                    "plugins" => [
                        "legend" => [
                            "position" => "bottom",
                        ],
                    ],
                    "scales" => [
                        "x" => [
                            "type" => "time", 
                            "time" => [
                                "unit" => $sGroupBy == 'month' ? 'month' : 'day',
                            ],
                        ]
                    ]
                ]
            ]);
        }
    }
    
    public function getSelectedModulesGrowth()
    {
        $aModulesList = $this->serviceGetModules();
        $aModules = array_keys($aModulesList);
        $sModulesDisabled = explode(',', getParam('bx_charts_chart_growth_modules'));
        return array(array_diff($aModules, $sModulesDisabled), $aModulesList);
    }
    
    private function getItemName($sString)
    {
        $sString = strip_tags($sString);
        if ($sString == ''){
            $sString = _t('_bx_charts_txt_empty_title_item');
        }
        else{
            $sString = strmaxtextlen($sString, 50, '...');
        }
        return $sString;
    }
    
    private function getXValueByParams($aValue, $sMode)
    {
        switch ($sMode) {
            case 'date':
                return strtotime($aValue['period']) * 1000;
            case 'week':
                $mixedTime = strtotime("01.01." . $aValue['year'], time());
                $iDay = date('w', $mixedTime);
                $mixedTime += ((7 * $aValue['period']) + 1 - $iDay) * 24 * 3600;
                return $mixedTime * 1000;
            case 'month':
                return strtotime('01.' . $aValue['period'] . '.' . $aValue['year']) * 1000;
        }
    }
}

/** @} */
