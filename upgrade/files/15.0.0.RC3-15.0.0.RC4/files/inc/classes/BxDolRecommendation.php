<?php defined('BX_DOL') or defined('BX_DOL_INSTALL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 */

class BxDolRecommendation extends BxDolFactory implements iBxDolFactoryObject
{
    protected $_bIsApi;

    protected $_oDb;

    protected $_iObject;
    protected $_sObject;
    protected $_aObject;
    protected $_aCriteria;

    protected $_iProfileId;

    protected $_iReducerAdd;
    protected $_iReducerIgnore;

    protected $_iPerPageDefault;
    protected $_iPerPageDefaultShowcase;

    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();

        $this->_aObject = $aObject['object'];
        $this->_iObject = (int)$this->_aObject['id'];
        $this->_sObject = $this->_aObject['name'];
        $this->_aCriteria = $aObject['criteria'];

        $this->_oDb = new BxDolRecommendationQuery();
        $this->_oDb->init($this->_aObject);

        $this->_iProfileId = bx_get_logged_profile_id();

        $this->_iReducerAdd = 5;
        $this->_iReducerIgnore = 10;

        $this->_iPerPageDefault = (int)getParam('sys_per_page_recommendations');
        if(!$this->_iPerPageDefault)
            $this->_iPerPageDefault = 12;
        $this->_iPerPageDefaultShowcase = (int)getParam('sys_per_page_recommendations_showcase');
        if(!$this->_iPerPageDefaultShowcase)
            $this->_iPerPageDefaultShowcase = 24;
    }

    public static function getObjectInstance($sObject)
    {
        if(isset($GLOBALS['bxDolClasses']['BxDolRecommendation!' . $sObject]))
            return $GLOBALS['bxDolClasses']['BxDolRecommendation!' . $sObject];

        $aObject = BxDolRecommendationQuery::getObject($sObject);
        if(!$aObject || !is_array($aObject) || empty($aObject['object']))
            return false;

        $sClass = 'BxTemplRecommendation';
        if(!empty($aObject['object']['class_name'])) {
            $sClass = $aObject['object']['class_name'];
            if(!empty($aObject['object']['class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['object']['class_file']);
        }

        $o = new $sClass($aObject);
        return ($GLOBALS['bxDolClasses']['BxDolRecommendation!' . $sObject] = $o);
    }

    public static function updateData($iProfileId = 0, $bImmediate = false)
    {
        if(!$iProfileId) {
            if(isLogged())
                $iProfileId = bx_get_logged_profile_id();
            else
                return false;
        }

        $mixedResult = true;
        if($bImmediate) {
            $mixedResult = [];

            $aObjects = BxDolRecommendationQuery::getObjects();
            foreach($aObjects as $aObject)
                if(($oRecommendation = BxDolRecommendation::getObjectInstance($aObject['name'])) !== false)
                    $mixedResult[] = [
                        'object' => $aObject['name'],
                        'items' => $oRecommendation->processCriteria($iProfileId)
                    ];
        }
        else {
            $sName = 'recommendations_for_' . $iProfileId;
            if(($oCronQuery = BxDolCronQuery::getInstance()) && !$oCronQuery->isTransientJobService($sName))
                $oCronQuery->addTransientJobService($sName, ['system', 'update_data', [$iProfileId], 'TemplServiceRecommendations']);
        }

        return $mixedResult;
    }

    public static function getContextName($sObject)
    {
        return str_replace(['sys_', 'bx_'], ['recom_', 'recom_'], $sObject); 
    }

    public function getConnection()
    {
        return $this->_aObject['connection'];
    }

    public function getContentInfo()
    {
        return $this->_aObject['content_info'];
    }

    public function getList($iProfileId = 0, $aParams = [])
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        return $this->_oDb->get($iProfileId, $this->_aObject['id'], $aParams);
    }

    public function getCount($iProfileId = 0, $aParams = [])
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        return $this->_oDb->get($iProfileId, $this->_aObject['id'], array_merge($aParams, ['count_only' => true]));
    }

    public function actionAdd($iProfileId = 0, $iItemId = 0)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        if (!bx_is_logged_profile($iProfileId))
            return ['code' => 1, 'msg' => '_sys_txt_access_denied'];

        if(!$iItemId)
            $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$this->add($iProfileId, $iItemId))
            return ['code' => 1, 'msg' => '_sys_txt_error_occured'];

        return ['code' => 0];
    }

    public function actionIgnore($iProfileId = 0, $iItemId = 0)
    {
        if(!$iProfileId)
            $iProfileId = $this->_iProfileId;

        if (!bx_is_logged_profile($iProfileId))
            return ['code' => 1, 'msg' => '_sys_txt_access_denied'];

        if(!$iItemId)
            $iItemId = bx_process_input(bx_get('id'), BX_DATA_INT);

        if(!$this->ignore($iProfileId, $iItemId))
            return ['code' => 1, 'msg' => '_sys_txt_error_occured'];

        return ['code' => 0];
    }

    public function add($iProfileId, $iItemId)
    {
        $aItem = $this->_oDb->getItem($iProfileId, $this->_iObject, $iItemId);

        /**
         * Action 'add' moves the item to the end not so much as 'ignore'.
         * For this purpose (+) is used instead of the (*). Is needed to hide
         * the recomended item. Isn't removed completely because friend request 
         * can be rejected.
         */
        $iReducer = (int)$aItem['item_reducer'] + $this->_iReducerAdd;

        return $this->_oDb->update($iProfileId, $this->_iObject, $iItemId, ['item_reducer' => $iReducer]);
    }

    public function ignore($iProfileId, $iItemId)
    {
        $aItem = $this->_oDb->getItem($iProfileId, $this->_iObject, $iItemId);

        /**
         * Action 'ignore' moves the item to the end.
         * Repeated action do it much more, therefore (*) is used.
         */
        $iReducer = !empty($aItem['item_reducer']) ? (int)$aItem['item_reducer'] : 1;
        $iReducer *= $this->_iReducerIgnore;

        return $this->_oDb->update($iProfileId, $this->_iObject, $iItemId, ['item_reducer' => $iReducer]);
    }

    public function processCriteria($iProfileId, $iLimit = 100)
    {
        if(!$iProfileId)
            return 0;

        $aWeights = array_map(function($fValue) use ($iLimit) { return $fValue * $iLimit; } , $this->_aObject['weights']);

        $aCriterionItems = [];
        foreach($this->_aCriteria as $sCriterion => $aCriterion) {
            $aCriterionParams = $this->_getCriterionParams($iProfileId, $aCriterion['params']);
            $iCriterionWeight = (float)$aCriterion['weight'];           

            switch($aCriterion['source_type']) {
                case 'sql':
                    $aCriterionItems[$sCriterion] = [];

                    if(empty($aCriterion['source']))
                        break;

                    $sQuery = bx_replace_markers($aCriterion['source'], $aCriterionParams);
                    if($this->_aObject['countable']) {
                        if(strpos($sQuery, '{order_by}') !== false)
                            $sQuery = bx_replace_markers($sQuery, ['order_by' => '`value` DESC']);
                        else
                            $sQuery .= ' ORDER BY `value` DESC';
                    }
                    $sQuery .= ' LIMIT ' . $iLimit;

                    $aCriterionItems[$sCriterion] = $this->_oDb->getPairs($sQuery, 'id', 'value');
                    break;

                case 'service':
                    $aCriterionItems[$sCriterion] = BxDolService::callSerialized($aCriterion['source'], $aCriterionParams);
                    break;
            }
        }

        $aResults = [];
        foreach($aCriterionItems as $sCriteria => $aItems) {
            $iCriteriaResults = 0;
            foreach($aItems as $iId => $iValue) {
                if(!isset($aResults[$iId]))
                    $aResults[$iId] = 0;

                $aResults[$iId] += $iValue;

                if(++$iCriteriaResults >= $aWeights[$sCriteria])
                    break;
            }
        }

        $this->_oDb->clean($iProfileId, $this->_iObject);

        $oProfile = BxDolProfile::getInstance($iProfileId);
        $oConnection = BxDolConnection::getObjectInstance($this->getConnection());
        $bConnectionMutual = $oConnection->getType() == BX_CONNECTIONS_TYPE_MUTUAL;

        $aItems = $this->_oDb->getBy(['type' => 'profile_object_ids', 'profile_id' => $iProfileId, 'object_id' => $this->_iObject]);
        foreach($aItems as $aItem)
            if(!$oProfile->isActive($aItem['item_id']) || $oConnection->isConnected($iProfileId, $aItem['item_id'], $bConnectionMutual))
                $this->_oDb->delete($iProfileId, $this->_iObject, $aItem['item_id']);

        $aItemItt = $this->getItemsTypes(array_keys($aResults));

        $iResult = 0;
        foreach($aResults as $iId => $iValue) {
            if(!$oProfile->isActive($iId))
                continue;

            if($this->_oDb->add($iProfileId, $this->_iObject, $iId, (isset($aItemItt[$iId]) ? $aItemItt[$iId] : ''), $iValue))
                $iResult++;
        }

        return $iResult;
    }

    public function outputActionResult ($mixed, $sFormat = 'json')
    {
        switch ($sFormat) {
            case 'html':
                echo $mixed;
                break;
                
            case 'json':
            default:
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode($mixed);     
        }
        exit;
    }

    protected function _getContextName()
    {
        return str_replace('sys_', 'recom_', $this->_sObject); 
    }

    protected function _getCriterionParams($iProfileId, $aParams)
    {
        $aResult = ['profile_id' => $iProfileId];
        if(empty($aParams))
            return $aResult;

        if(is_string($aParams))
            $aParams = unserialize($aParams);

        if(!empty($aParams) && is_array($aParams))
            $aResult = array_merge($aResult, $aParams);

        return $aResult;
    }

    /**
     * The first variant. Isn't used.
     */
    public function processCriteriaForSelection($iProfileId, $iStart, $iPerPage, &$bShowPaginate)
    {
        if(($iStartGet = bx_get('start')) !== false)
            $iStart = (int)bx_get('start');

        $aStarts = [];
        if(($sStartsGet = bx_get('starts')) !== false)
            $aStarts = array_combine(array_keys($this->_aCriteria), json_decode($sStartsGet, true));

        $aWeights = array_map(function($fValue) use ($iPerPage) { return $fValue * $iPerPage; }, $this->_aObject['weights']);

        $aCriterionItems = [];
        foreach($this->_aCriteria as $sCriterion => $aCriterion) {
            $aCriterionParams = $this->_getCriterionParams($iProfileId, $aCriterion['params']);
            $iCriterionWeight = (float)$aCriterion['weight'];
            $iCriterionStart = isset($aStarts[$sCriterion]) ? (int)$aStarts[$sCriterion] : $iStart * $iCriterionWeight;

            switch($aCriterion['source_type']) {
                case 'sql':
                    $aCriterionItems[$sCriterion] = [];

                    if(empty($aCriterion['source']))
                        break;

                    $sQuery = bx_replace_markers($aCriterion['source'], $aCriterionParams);
                    if($this->_aObject['countable'])
                        $sQuery .= ' ORDER BY `value` DESC';
                    $sQuery .= ' LIMIT ' . $iCriterionStart . ', ' . $iPerPage;

                    $aCriterionItems[$sCriterion] = $this->_oDb->getPairs($sQuery, 'id', 'value');
                    break;

                case 'service':
                    //TODO: Realize this!
                    break;
            }           
        }

        $aResults = [];
        $aHeap = [];
        $aStats = [];
        foreach($aCriterionItems as $sCriteria => $aItems) {
            $iCriteriaAdded = 0;
            $iCriteriaUpdated = 0;
            foreach($aItems as $iId => $iValue) {
                $bAddded = isset($aResults[$iId]);
                if(!$bAddded && $iCriteriaAdded < $aWeights[$sCriteria]) {
                    $aResults[$iId] = $iValue;
                    $iCriteriaAdded++;
                }
                else {
                    if($bAddded) {
                        $aResults[$iId] += $iValue;
                        $iCriteriaUpdated++;
                    }
                    else
                        $aHeap[$sCriteria][$iId] = $iValue;
                }
            }

            $aStats[$sCriteria] = $iCriteriaAdded + $iCriteriaUpdated;
        }

        $iResults = count($aResults);
        if($iResults < $iPerPage && !empty($aHeap)) {
            foreach($aHeap as $sCriteria => $aItems) {
                if(!$aItems)
                    continue;

                arsort($aItems);

                foreach($aItems as $iId => $iValue) {
                    $aResults[$iId] = $iValue;

                    $aStats[$sCriteria]++;
                    if(++$iResults == $iPerPage)
                        break;
                }
            }
        }

        arsort($aResults);
        return $aResults;
    }
}

/** @} */
