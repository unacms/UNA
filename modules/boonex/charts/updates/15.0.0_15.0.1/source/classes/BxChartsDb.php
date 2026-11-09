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

bx_import('BxDolModuleDb');

class BxChartsDb extends BxBaseModGeneralDb
{
    protected $_sTableTopByLikes;
    protected $_sTableMostActiveProfiles;
    protected $_sTableMostFollowedProfiles;

    public function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
        $this->_sTableTopByLikes = $this->_sPrefix . 'top_by_likes';
        $this->_sTableMostActiveProfiles = $this->_sPrefix . 'most_active_profiles';
        $this->_sTableMostFollowedProfiles = $this->_sPrefix . 'most_followed_profiles';
    }

    /* TopByLikes part */
    public function saveTopByLikes($sModuleName, $sTableName)
    {
        $iInterval = intval(getParam('bx_charts_chart_top_contents_by_likes_interval_day'));
        $sQuery = "INSERT INTO `" . $this->_sTableTopByLikes . "` (`object_id`, `module`, `value`) SELECT `object_id`,'" . $sModuleName . "', COUNT(`id`) FROM `" . $sTableName . "` WHERE `date` > " . ($iInterval > 0 ? $this->getTimeFromDaysBefore($iInterval) : 0) . " GROUP BY `object_id` ORDER BY  COUNT(`id`) DESC LIMIT 0, " . intval(getParam('bx_charts_chart_top_contents_by_likes_count'));
        $this->query($sQuery);
    }
    
    public function clearTopByLikes()
    {
        $sQuery = "TRUNCATE TABLE `" . $this->_sTableTopByLikes . "`";
        $this->query($sQuery);
    }
    
    public function getTopByLikes()
    {
        return $this->getAll("SELECT * FROM  `" . $this->_sTableTopByLikes . "` ORDER BY `value` DESC LIMIT 0," . intval(getParam('bx_charts_chart_top_contents_by_likes_count')));
    }
    
    /* MostActiveProfiles part */
    public function saveMostActiveProfiles_View($sProfileModuleName, $sTableName)
    {
        $iInterval = intval(getParam('bx_charts_chart_most_active_profiles_interval_day'));
        $sQuery = "INSERT INTO `" . $this->_sTableMostActiveProfiles . "` (`object_id`, `profile_module`, `views_count`) SELECT `object_id`,'" . $sProfileModuleName . "', COUNT(`date`) AS views FROM `" . $sTableName . "` 
 WHERE `object_id` IN (SELECT `object_id` FROM `" . $this->_sTableMostActiveProfiles . "` WHERE `profile_module` = '" . $sProfileModuleName . "' ) AND `date` > " . ($iInterval > 0 ? $this->getTimeFromDaysBefore($iInterval) : 0) . " GROUP BY `object_id`";
       
        $this->query($sQuery);
    }
    
    public function saveMostActiveProfiles_Create($sProfileModuleName, $sContentModuleName, $sTableName, $sColumnAuthor, $sColumnAdded)
    {
        $iInterval = intval(getParam('bx_charts_chart_most_active_profiles_interval_day'));
        $sQuery = "INSERT INTO `" . $this->_sTableMostActiveProfiles . "` (`object_id`, `profile_module`, `content_module`, `create_count`)  SELECT `sys_profiles`.`content_id`, `sys_profiles`.`type`, '" . $sContentModuleName . "' , COUNT(`" . $sTableName . "`.`id`) FROM `" . $sTableName . "`
  INNER JOIN `sys_profiles`  ON `sys_profiles`.`id` = `" . $sTableName . "`.`" . $sColumnAuthor . "` WHERE sys_profiles.type='" . $sProfileModuleName . "' AND  `" . $sTableName . "`.`" . $sColumnAdded . "` > " . ($iInterval > 0 ? $this->getTimeFromDaysBefore($iInterval) : 0) . " GROUP BY `sys_profiles`.`content_id`, `sys_profiles`.`type` ORDER BY COUNT(`" . $sTableName . "`.`id`) DESC LIMIT 0," . intval(getParam('bx_charts_chart_most_active_profiles_count'));
        $this->query($sQuery);
    }
    
    public function clearMostActiveProfiles()
    {
        $sQuery = "TRUNCATE TABLE `" . $this->_sTableMostActiveProfiles . "`";
        $this->query($sQuery);
    }
    
    public function getMostActiveProfiles()
    {
        return $this->getAll("SELECT SUM(`views_count`) AS views_count, SUM(`create_count`) AS create_count, `object_id`, `profile_module` as `module` FROM `" . $this->_sTableMostActiveProfiles . "` GROUP BY `object_id`, `module` ORDER BY SUM(`create_count`) DESC, SUM(`views_count`) DESC LIMIT 0," . intval(getParam('bx_charts_chart_most_active_profiles_count')));
    }
   
    /* MostFollowedProfiles part */
    public function saveMostFollowedProfiles($sProfileModuleName)
    {
        $iInterval = intval(getParam('bx_charts_chart_most_followed_profiles_interval_day'));
        $sQuery = "INSERT INTO `" . $this->_sTableMostFollowedProfiles . "` (`object_id`, `profile_module`, `followers_count`)  SELECT `sys_profiles`.`content_id`, `sys_profiles`.`type` , COUNT(`sys_profiles_conn_subscriptions`.`id`) FROM `sys_profiles_conn_subscriptions`
  INNER JOIN `sys_profiles`  ON `sys_profiles`.`id` = `sys_profiles_conn_subscriptions`.`content` WHERE sys_profiles.type='" . $sProfileModuleName . "' AND  `sys_profiles_conn_subscriptions`.`added` > " . ($iInterval > 0 ? $this->getTimeFromDaysBefore($iInterval) : 0) . " GROUP BY `sys_profiles`.`content_id`, `sys_profiles`.`type` ORDER BY COUNT(`sys_profiles_conn_subscriptions`.`id`) DESC LIMIT 0," . intval(getParam('bx_charts_chart_most_followed_profiles_count'));
        $this->query($sQuery);
    }
    
    public function clearMostFollowedProfiles()
    {
        $sQuery = "TRUNCATE TABLE `" . $this->_sTableMostFollowedProfiles . "`";
        $this->query($sQuery);
    }
    
    public function getMostFollowedProfiles()
    {
        return $this->getAll("SELECT SUM(`followers_count`) AS followers_count, `object_id`, `profile_module` as `module` FROM `" . $this->_sTableMostFollowedProfiles . "` GROUP BY `object_id`, `module` ORDER BY SUM(`followers_count`) DESC LIMIT 0," . intval(getParam('bx_charts_chart_most_followed_profiles_count')));
    }
    
    /* Growth part */
    public function getStatistic()
    {
        return $this->getAll("SELECT * FROM `sys_statistics` WHERE `name` <> 'bx_albums_media' ORDER BY `order`");
    }

    /* Growth part */
    public function getGrowth($sTableName)
    {
        $iInterval = intval(getParam('bx_charts_chart_growth_interval_day'));
        $sQuery =  "SELECT " . getParam('bx_charts_chart_growth_group_by') . "(FROM_UNIXTIME(`added`))  AS `period`, YEAR(FROM_UNIXTIME(`added`))  AS `year`,  COUNT(*) AS `count` FROM `" . $sTableName . "` WHERE `added` > " . ($iInterval > 0 ? $this->getTimeFromDaysBefore($iInterval) : 0) . " GROUP BY `period`, `year` ORDER BY `year`, `period` ASC";
        return $this->getAll($sQuery);
    }
    
    public function getGrowthInitValue($sTableName)
    {
        $iInterval = intval(getParam('bx_charts_chart_growth_interval_day'));
        $mixedStartDate = $this->getTimeFromDaysBefore($iInterval);

        $sQuery =  "SELECT  COUNT(*) AS `count` FROM `" . $sTableName . "` WHERE `added` < " . ($iInterval > 0 ? $mixedStartDate : 0);
        $mixedStartValue = $this->getOne($sQuery);

        if ($iInterval == 0){
            $sQuery =  "SELECT  MIN(`added`) AS `mindata` FROM " . $sTableName;
            $mixedStartDate = $this->getOne($sQuery);
        }

        return array($mixedStartValue,$mixedStartDate);
    }
    
    private function getTimeFromDaysBefore($iDay){
        return time() - $iDay * 86400;
    }
}

/** @} */
