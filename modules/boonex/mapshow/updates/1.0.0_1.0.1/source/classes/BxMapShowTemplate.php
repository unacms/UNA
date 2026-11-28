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

class BxMapShowTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        parent::__construct($oConfig, $oDb);
    }
    
    function getMap()
    {
        $this->addJs(array('https://openlayers.org/en/v4.6.4/build/ol.js', 'map.js'));
        $this->addCss('https://openlayers.org/en/v4.6.4/css/ol.css');
        return $this->getJsCode('map') . $this->parseHtmlByName('map.html', array());
    }
    
    public function getJsCode($sType, $aParams = array(), $bWrap = true)
    {
        $aParams = array_merge(array(
            'sPathToJsonData' => $this->_oConfig->getHomeUrl() . 'js/continents.geojson',
            'iIntervalCheckNewInSeconds' => getParam('bx_mapshow_interval_refresh_new_users_in_seconds'),
            'fCenterMapLonCoordinate' => getParam('bx_mapshow_default_center_lat_coordinate'),
            'fCenterMapLatCoordinate' => getParam('bx_mapshow_default_center_lon_coordinate'),
            'fMapZoom' => getParam('bx_mapshow_default_zoom')
        ), $aParams);
        
        return parent::getJsCode($sType, $aParams, $bWrap);
    }
}

/** @} */
