<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    MapShow Display last sign up users on map
 * @ingroup     UnaModules
 *
 * @{
 */
define('BX_MAP_SHOW_IP_2_LOCATION_URL', 'https://freegeoip.app/json/');

class BxMapShowModule extends BxDolModule
{
    function __construct(&$aModule)
    {
        parent::__construct($aModule);
    }
    
    public function addIpInfoToDb($iAccountId, $sIp)
    {
        $sLngLatInfo = $this->callApi($sIp);
        if ($sLngLatInfo != ''){
            $oLngLatInfo = json_decode($sLngLatInfo);
            if (isset($oLngLatInfo->longitude) && isset($oLngLatInfo->latitude)){
                $sLng = $oLngLatInfo->longitude;
                $sLat = $oLngLatInfo->latitude;
                if ($sLng != "0" && $sLat != "0")
                    $this->_oDb->addIpInfo($iAccountId, $sIp, $sLng, $sLat);
            }
        }
    }
    
    /**
     * @page service Service Calls
     * @section bx_mapshow MapShow 
     * @subsection bx_mapshow-other Other
     * @subsubsection bx_mapshow-get_map
     * 
     * @code bx_srv('bx_mapshow', 'get_map', [...]); @endcode
     * 
     * Get html for map
     * 
     * @return string - html for map .
     * 
     * @see BxMapShowModule::serviceGetMap
     */
    /** 
     * @ref bx_mapshow-get_map "get_map"
     */
    public function serviceGetMap()
    {
        return $this->_oTemplate->getMap();
    }
    
    public function actionGetMapPoints($Id = 0)
    {
        $aData = $this->_oDb->getLngLatData($Id);
        header('Content-Type: application/json');
        echo json_encode($aData);
    }
    
    private function callApi($sIp)
    {
        $sApiUrl = BX_MAP_SHOW_IP_2_LOCATION_URL . $sIp;
        return bx_file_get_contents($sApiUrl);
    }
}

/** @} */
