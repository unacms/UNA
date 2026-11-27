<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit entry form
 */
class BxTasksFormTime extends BxTemplFormView
{
    protected $_sModule;
    protected $_oModule;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct($aInfo, $oTemplate);

        if(($sKey = 'value') && isset($this->aInputs[$sKey])) { 
            foreach($this->aInputs[$sKey] as $mixedKey => $mixedValue) {
                if(!is_numeric($mixedKey) || !is_array($mixedValue))
                    continue;

                if(!empty($mixedValue['attrs']['placeholder']))
                    $this->aInputs[$sKey][$mixedKey]['attrs']['placeholder'] = _t($mixedValue['attrs']['placeholder']);

                //--- Hours and minutes take digits only.
                if(($mixedValue['type'] ?? '') == 'text')
                    $this->aInputs[$sKey][$mixedKey]['attrs'] = array_merge($this->aInputs[$sKey][$mixedKey]['attrs'] ?? [], ['type' => 'number', 'min' => 0]);
            }
        }

        if(($sKey = 'value_date') && isset($this->aInputs[$sKey]))
            $this->aInputs[$sKey]['value'] ??= time();

        //--- Replaced by the Billed time of an entry, which those allowed to change it set in the time grids.
        unset($this->aInputs['billable']);
    }
    
    public function initChecker ($aValues = [], $aSpecificValues = [])
    {
        if(($iContentId = $this->aInputs['object_id']['value'] ?? 0) && ($iProfileId = bx_get_logged_profile_id())) {
            $aTimer = $this->_oModule->_oDb->getTimers([
                'sample' => 'content_profile_ids', 
                'content_id' => $iContentId, 
                'profile_id' => $iProfileId
            ]);

            if($aTimer && is_array($aTimer) && ($iDuration = (int)$aTimer['duration']) && ($sKey = 'value') && isset($this->aInputs[$sKey])) {
                list($iHours, $iMinutes) = $this->_oModule->_oConfig->timeI2A($iDuration, true);

                foreach($this->aInputs[$sKey] as $mixedKey => $mixedValue) {
                    if(!is_numeric($mixedKey) || !is_array($mixedValue))
                        continue;

                    switch($this->aInputs[$sKey][$mixedKey]['name']) {
                        case 'value_h':
                            $this->aInputs[$sKey][$mixedKey]['value'] = $iHours;
                            break;

                        case 'value_m':
                            $this->aInputs[$sKey][$mixedKey]['value'] = $iMinutes + 1;
                            break;
                    }
                }

                $this->aInputs['timer_id'] = [
                    'type' => 'hidden',
                    'name' => 'timer_id',
                    'value' => $aTimer['id']
                ];
            }
        }

        return parent::initChecker ($aValues, $aSpecificValues);
    }
}

/** @} */
