<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

define('BX_DOL_VIEW_OLD_VIEWS', 3 * 86400); ///< views older than this number of seconds will be deleted automatically

define('BX_DOL_VIEW_USAGE_BLOCK', 'block');
define('BX_DOL_VIEW_USAGE_INLINE', 'inline');
define('BX_DOL_VIEW_USAGE_DEFAULT', BX_DOL_VIEW_USAGE_BLOCK);

/**
 * Track any object views automatically
 *
 * Add record to sys_object_view table to track object views,
 * to record view just create this class instance with your object id,
 * for example:
 * @code
 *  BxDolView::getObjectInstance('my_system', 25); // 25 - is object id
 * @endcode
 *
 * Description of sys_object_view table fields:
 * @code
 *  `name` - system name, it is better to use unique module prefix here, lowercase and all spaces are underscored
 *  `table_track` - table to track views
 *  `period` - period in secs to update next views, default is 86400(1 day)
 *  `is_on` - is the system activated
 *  `trigger_table` - table where you need to update views field
 *  `trigger_field_id` - table field id to unique determine object
 *  `trigger_field_count` - table field where total view number is stored
 *  `class_name` - your custom class name, if you overrride default class
 *  `class_file` - your custom class path
 * @endcode
 *
 * Structure of the track table is the following:
 * @code
 *  CREATE TABLE `my_views_track` (
 *      `object_id` int(11) NOT NULL default '0', -- this field type must be exact as your object id type
 *      `viewer_id` int(11) NOT NULL default '0', -- viewer profile id
 *      `viewer_nip` int(11) unsigned NOT NULL default '0', -- viewer ip address to track guest views
 *      `date` int(11) NOT NULL default '0', -- timestamp of last recorded view
 *      KEY `id` (`object_id`,`viewer_id`,`viewer_nip`)
 *  );
 * @endcode
 *
 */
class BxDolView extends BxDolObject
{
    protected function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct($sSystem, $iId, $iInit, $oTemplate);
        if(empty($this->_sSystem))
            return;

        $this->_aSystem['per_page_default'] = 20;

        $this->_oQuery = new BxDolViewQuery($this);
    }

   /**
     * get votes object instanse
     * @param $sSys view object name
     * @param $iId associated content id, where vote is available
     * @param $iInit perform initialization
     * @return null on error, or ready to use class instance
     */
    public static function getObjectInstance($sSys, $iId, $iInit = true)
    {
        $sKey = 'BxDolView!' . $sSys . $iId;
        if(isset($GLOBALS['bxDolClasses'][$sKey]))
            return $GLOBALS['bxDolClasses'][$sKey];

        $aSystems = self::getSystems();
        if(!isset($aSystems[$sSys]))
            return null;

        $sClassName = 'BxTemplView';
        if(!empty($aSystems[$sSys]['class_name'])) {
            $sClassName = $aSystems[$sSys]['class_name'];
            if(!empty($aSystems[$sSys]['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aSystems[$sSys]['class_file']);
        }

        $o = new $sClassName($sSys, $iId, $iInit);
        return ($GLOBALS['bxDolClasses'][$sKey] = $o);
    }

    public static function &getSystems()
    {
        $sKey = 'bx_dol_cache_memory_view_systems';

        if(!isset($GLOBALS[$sKey]))
            $GLOBALS[$sKey] = BxDolDb::getInstance()->fromCache('sys_objects_view', 'getAllWithKey', '
                SELECT
                    `id` as `id`,
                    `name` AS `name`,
                    `module` AS `module`,
                    `table_track` AS `table_track`,
                    `period` AS `period`,
                    `pruning` AS `pruning`,
                    `is_on` AS `is_on`,
                    `trigger_table` AS `trigger_table`,
                    `trigger_field_id` AS `trigger_field_id`,
                    `trigger_field_author` AS `trigger_field_author`,
                    `trigger_field_count` AS `trigger_field_count`,
                    `class_name` AS `class_name`,
                    `class_file` AS `class_file`
                FROM `sys_objects_view`', 'name');

        return $GLOBALS[$sKey];
    }

    public static function onAuthorDelete ($iAuthorId)
    {
        $aSystems = self::getSystems();
        foreach($aSystems as $sSystem => $aSystem)
            self::getObjectInstance($sSystem, 0)->getQueryObject()->deleteAuthorEntries($iAuthorId);

        return true;
    }

    public function actionGetViewedBy()
    {
        if (!$this->isEnabled())
           return '';

        return $this->_getViewedBy();
    }
    
    public function actionGetUsers()
    {
        if (!$this->isEnabled())
           return echoJson(array());

        $iStart = (int)bx_get('start');
        $iPerPage = (int)bx_get('per_page');
        return echoJson(array(
            'content' => $this->_getViewedBy($iStart, $iPerPage),
            'eval' => $this->getJsObjectName() . '.onGetUsers(oData)'
        ));
    }

    public function doView()
    {
        if(!$this->isEnabled())
            return false;

        $iObjectId = $this->getId();
        $iAuthorId = $this->_getAuthorId();
        $sAuthorIp = $this->_getAuthorIp();

        if($this->_oQuery->doView($iObjectId, $iAuthorId, $sAuthorIp)) {
            $this->_trigger();

            $oZ = new BxDolAlerts($this->_sSystem, 'view', $iObjectId, $iAuthorId);
            $oZ->alert();

            return true;
        }

        return false;
    }

	/**
     * Permissions functions
     * 
     * Note. The 'view' action is performed automatically and therefore the manual action is not allowed.
     */
    public function isAllowedView($isPerformAction = false)
    {
        return false;
    }

    public function isAllowedViewView($isPerformAction = false)
    {
        if(isAdmin())
            return true;

        return $this->checkAction('view_view', $isPerformAction);
    }

    public function isAllowedViewViewViewers($isPerformAction = false)
    {
        if(isAdmin() || bx_acl_is_advanced())
            return true;

        if(!empty($this->_aSystem['module']) && BxDolRequest::serviceExists($this->_aSystem['module'], 'act_as_profile') && BxDolService::call($this->_aSystem['module'], 'act_as_profile') === true)
            $iObjectAuthorId = BxDolProfile::getInstanceByContentAndType($this->_iId, $this->_aSystem['module'])->id();
        else
            $iObjectAuthorId = $this->_oQuery->getObjectAuthorId($this->_iId);

        return $iObjectAuthorId != 0 && $iObjectAuthorId == $this->_getAuthorId() && $this->checkAction('view_view_viewers_own', $isPerformAction);
    }

    /**
     * Internal functions
     */
    protected function _getIconDo()
    {
    	return 'eye';
    }

    protected function _getTitleDo()
    {
    	return '_view_do_view';
    }
}

/** @} */
