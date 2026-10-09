<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */


define('BX_DOL_OBJECT_ERR_NOT_AVAILABLE', 1);
define('BX_DOL_OBJECT_ERR_ACCESS_DENIED', 2);
define('BX_DOL_OBJECT_ERR_DUPLICATE', 3);
define('BX_DOL_OBJECT_ERR_WRONG_DATE', 4);
define('BX_DOL_OBJECT_ERR_CANNOT_PERFORM', 5);

/**
 * Base class for all "Object" classes.
 * Child classes usually represents high level programming constructions to generate ready 'objects' functionality, like Comments, Votings, Forms.
 */
class BxDolObject extends BxDolFactory implements iBxDolReplaceable
{
    protected $_oTemplate = null;
    protected $_oQuery = null;

    protected $_bIsApi = false;

    protected $_iId = 0; ///< item id the action to be performed with
    protected $_sSystem = ''; ///< current system name
    protected $_aSystem = array(); ///< current system array

    protected $_aMarkers = array ();

    protected $_sTmplContentElementBlock = '';
    protected $_sTmplContentElementInline = '';
    protected $_sTmplContentDoAction;
    protected $_sTmplContentDoActionLabel = '';
    protected $_sTmplContentCounter = '';
    protected $_sTmplContentCounterLabel = '';

    protected function __construct($sSystem, $iId, $iInit = true, $oTemplate = false)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $aSystems = $this->getSystems();
        if(!isset($aSystems[$sSystem]))
            return;

        $this->_sSystem = $sSystem;
        $this->_aSystem = $aSystems[$sSystem];

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        if(!$this->isEnabled())
            return;

        if($iInit)
            $this->init($iId);
    }

    public static function &getSystems()
    {
        $aResult = [];

        return $aResult;
    }

    static public function pruning()
    {
        $iResults = 0;

        $sClass = get_called_class();
        $sMethod = 'getSystems';
        if(!method_exists($sClass, $sMethod))
            return $iResults;

        $aSystems = $sClass::$sMethod();
        foreach($aSystems as $aSystem) {
            if(empty($aSystem['pruning']))
                continue;

            $oObject = $sClass::getObjectInstance($aSystem['name'], 0, false);
            if(!$oObject || !$oObject->isEnabled())
                continue;

            $iResults += $oObject->_oQuery->pruningByDate($aSystem['pruning']);
        }

        return $iResults;
    }

    public function init($iId)
    {
        if(!$this->isEnabled())
            return false;

        if(empty($this->_iId) && $iId)
            $this->setId($iId);

		$this->addMarkers(array(
            'object_id' => $this->getId(),
            'user_id' => $this->_getAuthorId()
        ));

        return true;
    }

    public function getSystemId()
    {
        return $this->_aSystem['id'];
    }

    public function getSystemName()
    {
        return $this->_sSystem;
    }

    public function getSystemInfo()
    {
        return $this->_aSystem;
    }

    public function getId()
    {
        return $this->_iId;
    }

    public function setId($iId)
    {
        if($iId == $this->getId())
            return;

        $this->_iId = $iId;
    }

    public function isEnabled ()
    {
        return $this->_aSystem && (int)$this->_aSystem['is_on'] == 1;
    }

    public function isPerformed($iObjectId, $iAuthorId, $iAuthorIp = 0)
    {
        return $this->_oQuery->isPerformed($iObjectId, $iAuthorId);
    }

    public function getVote($iObjectId = 0, $bForceGet = false)
    {
        return $this->_getVote($iObjectId, $bForceGet);
    }

    public function getTrack($iObjectId, $iAuthorId)
    {
        return $this->_getTrack($iObjectId, $iAuthorId);
    }

    /**
     * Interface functions for outer usage
     */
    public function getConditions($sMainTable, $sMainField)
    {
        if(!$this->isEnabled())
            return array();

        $sTable = isset($this->_aSystem['table_main']) ? $this->_aSystem['table_main'] : '';
        if(empty($sTable) || empty($sMainTable) || empty($sMainField))
            return array();

        return array(
            'join' => array (
                'objects_' . $this->_sSystem => array(
                    'type' => 'INNER',
                    'table' => $sTable,
                    'mainTable' => $sMainTable,
                    'mainField' => $sMainField,
                    'onField' => 'object_id',
                    'joinFields' => array('count'),
                ),
            ),
        );
    }

    public function getConditionsTrack($sMainTable, $sMainField, $iAuthorId = 0)
    {
        if(!$this->isEnabled())
            return array();

        $sTableTrack = isset($this->_aSystem['table_track']) ? $this->_aSystem['table_track'] : '';
        if(empty($sTableTrack) || empty($sMainTable) || empty($sMainField))
            return array();

        return array(
            'restriction' => array (
                'objects_' . $this->_sSystem . '_author' => array(
                    'value' => $iAuthorId,
                    'field' => 'author_id',
                    'operator' => '=',
                    'table' => $sTableTrack,
                ),
            ),
            'join' => array (
                'objects_' . $this->_sSystem => array(
                    'type' => 'INNER',
                    'table' => $sTableTrack,
                    'mainTable' => $sMainTable,
                    'mainField' => $sMainField,
                    'onField' => 'object_id',
                    'joinFields' => array('author_id'),
                ),
            ),

        );
    }
    
    public function getSqlParts($sMainTable, $sMainField)
    {
        if(!$this->isEnabled())
            return array();

        return $this->_oQuery->getSqlParts($sMainTable, $sMainField);
    }

    public function getSqlPartsTrack($sMainTable, $sMainField, $iAuthorId = 0)
    {
        if(!$this->isEnabled())
            return array();

        return $this->_oQuery->getSqlPartsTrack($sMainTable, $sMainField, $iAuthorId);
    }

    public function getSqlPartsTrackAuthor($sMainTable, $sMainField, $iObjectId = 0)
    {
        if(!$this->isEnabled())
            return array();

        return $this->_oQuery->getSqlPartsTrackAuthor($sMainTable, $sMainField, $iObjectId);
    }

    public function addMarkers($aMarkers)
    {
        if(empty($aMarkers) || !is_array($aMarkers))
			return false;

        $this->_aMarkers = array_merge($this->_aMarkers, $aMarkers);
        return true;
    }

    public function getElementAPI($aParams = [])
    {
        if(!$this->_bIsApi)
            return;

        //TODO: Implement for Objects like Views, Votes, etc.
        $sClass = get_class($this);
        return [
            'display_type' => 'element',
            'name' => md5($sClass),
            'title' => get_class($this)
        ];
    }

    public function getCounterAPI($aParams = [])
    {
        if(!$this->_bIsApi)
            return;

        //TODO: Implement for Objects like Views, Votes, etc.
        $sClass = get_class($this);
        return [
            'display_type' => 'element',
            'name' => md5($sClass),
            'title' => get_class($this)
        ];
    }

    /**
     * Database functions
     */
    public function getQueryObject ()
    {
        return $this->_oQuery;
    }

	/**
     * Permissions functions
     */
	public function checkAction ($sAction, $isPerformAction = false)
    {
        $iId = $this->_getAuthorId();
        $a = checkActionModule($iId, $sAction, 'system', $isPerformAction);
        return $a[CHECK_ACTION_RESULT] === CHECK_ACTION_RESULT_ALLOWED;
    }

    public function checkActionErrorMsg ($sAction)
    {
        $iId = $this->_getAuthorId();
        $a = checkActionModule($iId, $sAction, 'system');
        return $a[CHECK_ACTION_RESULT] !== CHECK_ACTION_RESULT_ALLOWED ? $a[CHECK_ACTION_MESSAGE] : '';
    }

    /**
     * Actions' response functions
     */
    public function onObjectDelete($iObjectId = 0)
    {
        $this->_oQuery->deleteObjectEntries($iObjectId ? $iObjectId : $this->getId());
    }

    /**
     * Internal functions
     */
    protected function _getAuthorId ()
    {
        return isMember() ? bx_get_logged_profile_id() : 0;
    }

    protected function _getAuthorPassword ()
    {
        return getLoggedPassword();
    }

    protected function _getAuthorIp ()
    {
        return getVisitorIP();
    }

    protected function _getAuthorInfo($iAuthorId = 0)
    {
        $oProfile = $this->_getAuthorObject($iAuthorId);

        return array(
            $oProfile->getDisplayName(),
            $oProfile->getUrl(),
            $oProfile->getThumb(),
            $oProfile->getUnit(),
            $oProfile->getUnit(0, array('template' => 'unit_wo_info'))
        );
    }

    protected function _getAuthorObject($iAuthorId = 0)
    {
    	if($iAuthorId == 0)
    		return BxDolProfileUndefined::getInstance();

        $oProfile = BxDolProfile::getInstance($iAuthorId);
        if(!$oProfile)
			$oProfile = BxDolProfileUndefined::getInstance();

        return $oProfile;
    }

    /**
     * Update Trigger table using data which is automatically gotten from object's internal table.
     */
    protected function _trigger()
    {
        if(!$this->_aSystem['trigger_table'])
            return false;

        $iId = $this->getId();
        if(!$iId)
            return false;

        return $this->_oQuery->updateTriggerTable($iId);
    }

    /**
     * Update (increment/decrement) Trigger table using provided value.
     */
    protected function _triggerValue($iValue)
    {
        if(!$this->_aSystem['trigger_table'])
            return false;

        $iId = $this->getId();
        if(!$iId)
            return false;

        return $this->_oQuery->updateTriggerTableValue($iId, $iValue);
    }

    /**
     * Replace provided markers in a string
     * @param $mixed string or array to replace markers in
     * @return string where all occured markers are replaced
     */
    protected function _replaceMarkers ($mixed)
    {
        return bx_replace_markers($mixed, $this->_aMarkers);
    }

    protected function _prepareParamsData($aParams)
    {
        $aParams = array_merge([
            'sSystem' => $this->getSystemName(),
            'iObjId' => $this->getId(),
            'iAuthorId' => $this->_getAuthorId(),
            'sRootUrl' => BX_DOL_URL_ROOT,
        ], $aParams);

        foreach($aParams as $sKey => $mixedValue)
            if(is_bool($mixedValue))
                $aParams[$sKey] = (int)$mixedValue;

        return $aParams;
    }

    protected function _getRequestParamsData($aKeys = array())
    {
        $sParams = bx_get('params');
        if($sParams === false)
            return [];

        $aParams = [];
        parse_str(bx_process_input($sParams), $aParams);

        return $aParams;
    }

    protected function _prepareRequestParamsData($aParams, $aParamsAdd = array())
    {
        $aRequestParams = array_intersect_key($aParams, $this->_aElementDefaults);
        $aRequestParams = array_merge($aRequestParams, $aParamsAdd);

        foreach($aRequestParams as $sKey => $mixedValue)
            if(is_bool($mixedValue))
                $aRequestParams[$sKey] = (int)$mixedValue;

        return $aRequestParams;
    }

    protected function _getTmplContentElementBlock()
    {
        return $this->_sTmplContentElementBlock;
    }

    protected function _getTmplContentElementInline()
    {
        return $this->_sTmplContentElementInline;
    }

    protected function _getTmplContentDoAction()
    {
        return $this->_sTmplContentDoAction;
    }

    protected function _getTmplContentDoActionLabel()
    {
        return $this->_sTmplContentDoActionLabel;
    }

    protected function _getTmplContentCounter()
    {
        return $this->_sTmplContentCounter;
    }

    protected function _getTmplContentCounterLabel()
    {
        return $this->_sTmplContentCounterLabel;
    }
}

/** @} */
