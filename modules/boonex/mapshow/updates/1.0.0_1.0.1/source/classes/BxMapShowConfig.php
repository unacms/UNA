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

class BxMapShowConfig extends BxBaseModGeneralConfig
{
    function __construct($aModule)
    {
        parent::__construct($aModule);
        $this->CNF = array (
            // database tables
            'TABLE_ENTRIES' => $aModule['db_prefix'] . 'accounts',
            
             // database fields
            'FIELD_ID' => 'id',
            'FIELD_ACCOUNT_ID' => 'account_id',
            'FIELD_LNG' => 'lng',
            'FIELD_LAT' => 'lat'
        );
        
        $this->_aJsClasses = array(
            'map' => 'BxMapShow'
        );
        $this->_aJsObjects = array(
            'map' => 'oMapShow'
        );
    }
}

/** @} */
