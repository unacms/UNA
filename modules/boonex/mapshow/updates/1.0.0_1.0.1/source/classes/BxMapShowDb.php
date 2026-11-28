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

class BxMapShowDb extends BxBaseModGeneralDb
{
    function __construct(&$oConfig)
    {
        parent::__construct($oConfig);
    }
    
    public function getLngLatData($iLastId)
    {
        $CNF = &$this->_oConfig->CNF;
        $iIntervalInHour = intval(getParam('bx_mapshow_initial_timeframe_users_shown_in_hours'));
        $sSql = "";
        $aBindings = array();
        if ($iLastId == 0) {
            $aBindings['interval'] = time() - $iIntervalInHour * 3600;
            $sSql = "`sys_accounts`.`added` > :interval "  ;
        }
        else{
            $aBindings['id'] = $iLastId;
            $sSql = "`" . $CNF['TABLE_ENTRIES'] . "`.`" . $CNF['FIELD_ID'] . "` > :id";
        }
        
        return $this->getAll("SELECT `" . $CNF['TABLE_ENTRIES'] . "`." . $CNF['FIELD_LNG'] . ", `" . $CNF['TABLE_ENTRIES'] . "`." . $CNF['FIELD_LAT'] . ", `" . $CNF['TABLE_ENTRIES'] . "`." . $CNF['FIELD_ID'] . " FROM `" . $CNF['TABLE_ENTRIES'] . "` LEFT JOIN `sys_accounts` ON `sys_accounts`.`id` = `" . $CNF['TABLE_ENTRIES'] . "`." . $CNF['FIELD_ACCOUNT_ID'] . "  WHERE " . $sSql, $aBindings);
    }
    
    public function addIpInfo($iAccountId, $sIp, $sLng, $sLat)
    {
        $CNF = &$this->_oConfig->CNF;
        $aBindings = array(
            'account_id' => $iAccountId,
            'lng' => $sLng,
            'lat' => $sLat
        );
        $this->query("INSERT INTO " . $CNF['TABLE_ENTRIES'] . " (" . $CNF['FIELD_ACCOUNT_ID'] . ", " . $CNF['FIELD_LNG'] . ", " . $CNF['FIELD_LAT'] . ") VALUES (:account_id, :lng, :lat)", $aBindings);
    }
}

/** @} */
