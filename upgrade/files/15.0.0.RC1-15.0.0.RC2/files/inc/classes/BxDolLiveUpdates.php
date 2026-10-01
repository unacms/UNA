<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

class BxDolLiveUpdates extends BxDolFactory implements iBxDolSingleton
{
    protected $_oQuery;

    /*
     * List of all systems (active and inactive) with full description.
     */
    protected $_aSystems;

    /*
     * List of active systems without any additional info.
     */
    protected $_aSystemsActive;

    /*
     * List of dynamically added transient systems without any additional info. 
     * It depends on the page where a user is.  
     */
    protected $_aSystemsTransient;  

    protected $_iProfileId;

    protected $_iInterval;

    protected $_oCacheObject;
    protected $_sCacheKeySystems;
    protected $_sCacheKeyData;
    protected $_iCacheTTL;

    protected $_sJsClass;
    protected $_sJsObject;

    protected function __construct()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        /**
         * Note. Currently Live Updates are associated with profiles (Profile ID) and therefore they are used for logged in members only.
         * If it's needed Session ID can be used instead of Profile ID. In this case Live Updates can be used for visitors too. Don't forget
         * to update BxBaseLiveUpdates::init if Session ID will be used.
         */
        $this->_iProfileId = (int)bx_get_logged_profile_id();
        if(!$this->_iProfileId)
            return;

        $this->_oQuery = new BxDolLiveUpdatesQuery();

        $this->_iInterval = (int)$this->_oQuery->getParam('sys_live_updates_interval');
        
        $this->_oCacheObject = $this->_oQuery->getDbCacheObject();
        $this->_sCacheKeySystems = 'sys_live_updates_systems';
        $this->_sCacheKeyData = 'sys_live_updates_data_' . $this->_iProfileId;
        $this->_iCacheTTL = 86400;

        $this->_sJsClass = 'BxDolLiveUpdates';
    	$this->_sJsObject = 'oLiveUpdates';

    	$this->_aSystems = $this->_getCachedSystems();
    	$this->_aSystemsActive = array_keys($this->_aSystems);
    	$this->_aSystemsTransient = array();
    }

    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * get live updates instanse
     * @return ready to use class instance
     */
    public static function getInstance()
    {
        if(!isLogged())
            return false;

        if(!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxTemplLiveUpdates();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * 
     * Is called via Ajax Requests only. 
     */
    public function perform()
    {
        $iIndex = (int)bx_get('index');

        $mixedCacheKey = bx_get('hash');
        if($mixedCacheKey !== false)
            $this->_sCacheKeySystems = $this->_decodeHash(bx_process_input($mixedCacheKey));

        $mixedSystemsActive = bx_get('systems_active');
        if($mixedSystemsActive !== false)
            $this->_aSystemsActive = array_keys($mixedSystemsActive);

        $mixedSystemsTransient = bx_get('systems_transient');
        if($mixedSystemsTransient !== false)
            $this->_aSystemsTransient = array_keys($mixedSystemsTransient);

        $this->_aSystems = $this->_getCachedSystems();
    	if(empty($this->_aSystems) || !is_array($this->_aSystems))
            return array();

        $aCurrent = $mixedSystemsActive;
        if(empty($aCurrent) || !is_array($aCurrent))
            $aCurrent = $this->_getCachedData();

        $aRequested = $this->_getRequestedData($iIndex, true, $aCurrent);

        $aResult = array();
        $bUpdateCache = false;
        foreach($aRequested as $sName => $aData) {
            if(isset($aCurrent[$sName])) {
                if((int)$aCurrent[$sName] == (int)$aData['count'])			    
                    continue;

                $aResultData = array('count_new' => (int)$aData['count'], 'count_old' => (int)$aCurrent[$sName]);
                if(isset($aData['data']))
                    $aResultData = array_merge($aResultData, $aData['data']);

                $aResult[] = array(
                    'system' => $sName, 
                    'data' => $aResultData,
                    'method' => $aData['method']
                );
            }

            $aCurrent[$sName] = $aData['count'];
            $bUpdateCache = true;
        }

        if($bUpdateCache)
            $this->_updateCached('data', $aCurrent);

    	return $aResult;
    }

    public function performApi($bInit = false)
    {
        $aCurrent = $this->_getCachedData($bInit);
        if($bInit)
            $aCurrent = array_intersect_key($aCurrent, array_flip($this->_aSystemsActive));

        $aRequested = $this->_getRequestedData(0, !$bInit, !$bInit ? $aCurrent : []);

        $bUpdateCache = false;
        foreach($aCurrent as $sName => &$iCount)
            if(($iRequestedCount = (int)($aRequested[$sName]['count'] ?? 0)) && $iRequestedCount != (int)$iCount) {
                $iCount = $iRequestedCount;
                $bUpdateCache = true;
            }

        if($bUpdateCache)
            $this->_updateCached('data', $aCurrent);

        return $aCurrent;
    }

    protected function _addSystem($sName, $iFrequency, $sServiceCall, $mixedActive = true)
    {
        if(!$this->_iProfileId)
            return false;

        if(empty($this->_aSystemsTransient))
            $this->_sCacheKeySystems .= $this->_getPageId();

        if(!in_array($sName, $this->_aSystemsTransient))
            $this->_aSystemsTransient[] = $sName;

        if(!in_array($sName, $this->_aSystemsActive))
            $this->_aSystemsActive[] = $sName;

        if(empty($this->_aSystems[$sName])) {
            list($bActive, $bInit) = is_array($mixedActive) ? $mixedActive : [$mixedActive, true];
            
            $this->_aSystems[$sName] = [
                'name' => $sName,
                'init' => $bInit ? 1 : 0,
                'frequency' => $iFrequency,
                'service_call' => $sServiceCall,
                'active' => $bActive ? 1 : 0
            ];

            $this->_updateCached('systems', $this->_aSystems);
        }

        return true;
    }
    
    protected function _addData($sName, $iValue)
    {
        $aCachedData = $this->_getCachedData();
        $aCachedData[$sName] = $iValue;
        $this->_updateCached('data', $aCachedData);

        return true;
    }

    protected function _getCacheInfo($sType)
    {
    	return array(
            $this->_oCacheObject,
            $this->_getCacheKey($sType),
            $this->_iCacheTTL
    	);
    }

    protected function _getCacheKey($sType)
    {
        return $this->_oQuery->genDbCacheKey($this->{'_sCacheKey' . ucfirst($sType)});
    }

    protected function _getCached($sType)
    {
        list($oCache, $sCacheKey, $iCacheTtl) = $this->_getCacheInfo($sType);

        $aCached = $oCache->getData($sCacheKey, $iCacheTtl);
        if(empty($aCached)) {
            switch($sType) {
                case 'systems':
                    $aCached = $this->_oQuery->getSystems();
                    break;

                case 'data':
                    if(empty($aCached))
                        $aCached = array();

                    $aRequested = $this->_getRequestedData();
                    foreach($this->_aSystems as $sName => $aSystem)
                        $aCached[$sName] = !empty($aRequested[$sName]['count']) ? (int)$aRequested[$sName]['count'] : 0;
                    break;
            }

            if(!empty($aCached))
                $oCache->setData($sCacheKey, $aCached, $iCacheTtl);
        }

        return $aCached;
    }

    protected function _getCachedSystems()
    {
        $aSystems = $this->_getCached('systems');
        if(!empty($aSystems) && !empty($this->_aSystemsActive))
            $aSystems = array_intersect_key($aSystems, array_flip($this->_aSystemsActive));

        return $aSystems;
    }

    protected function _getCachedData($bInit = false)
    {
        $aData = $this->_getCached('data');
        if($bInit)
            foreach($this->_aSystems as $aSystem)
                if(isset($aData[$aSystem['name']]) && (int)$aSystem['init'] == 0)
                    $aData[$aSystem['name']] = 0;

    	return $aData;
    }

    protected function _clearCached()
    {
        $this->_oCacheObject->delData($this->_getCacheKey('systems'));
        $this->_oCacheObject->delData($this->_getCacheKey('data'));
    }

    protected function _updateCached($sType, $aData)
    {
    	list($oCache, $sCacheKey, $iCacheTtl) = $this->_getCacheInfo($sType);

    	$aCached = $oCache->getData($sCacheKey, $iCacheTtl);
        $aCached = array_merge($aCached ? $aCached : array(), $aData);

    	$oCache->setData($sCacheKey, $aCached, $iCacheTtl);
    }

    protected function _getRequestedData($iIndex = 0, $bIndexCheck = false, $aCachedData = array())
    {
        $bInit = !$bIndexCheck && empty($aCachedData);

        $aResult = array();
        foreach($this->_aSystems as $sName => $aSystem) {
            if(empty($aSystem) || !is_array($aSystem) || (int)$aSystem['active'] != 1 || ($bInit && (int)$aSystem['init'] == 0))
                continue;

            if($bIndexCheck && $iIndex % (int)$aSystem['frequency'] != 0)
                continue;

            $bCachedDataBySystem = !empty($aCachedData) && isset($aCachedData[$sName]);
            $mixedResponce = $this->_getRequestedDataBySystem($aSystem, ($bCachedDataBySystem ? (int)$aCachedData[$sName] : 0), !$bCachedDataBySystem);
            if($mixedResponce === false)
                continue;

            $aResult[$sName] = $mixedResponce;
        }

        return $aResult;
    }

    protected function _getRequestedDataBySystem($aSystem, $iCachedData = 0, $bInit = true)
    {
        if(!BxDolService::isSerializedService($aSystem['service_call']))
            return false;

        $aResponce = BxDolService::callSerialized($aSystem['service_call'], array('count' => (int)$iCachedData, 'init' => ($bInit ? 1 : 0)));
        if(empty($aResponce) || !is_array($aResponce) || !isset($aResponce['count']) || (!$bInit && !isset($aResponce['method'])))
            return false;

        return $aResponce;
    }

    protected function _getPageId()
    {
        $aPageParams = array();
        parse_str($_SERVER['QUERY_STRING'], $aPageParams);
        $aPageParams = array_diff_assoc($aPageParams, array('start', 'per_page', 'order', 'filter'));

        return '_' . $this->_iProfileId . '_' . md5(bx_append_url_params($_SERVER['PHP_SELF'], $aPageParams));
    }

    protected function _encodeHash()
    {
        return base64_encode($this->_sCacheKeySystems);
    }

    protected function _decodeHash($sHash)
    {
        return base64_decode($sHash);
    }
}

/** @} */
