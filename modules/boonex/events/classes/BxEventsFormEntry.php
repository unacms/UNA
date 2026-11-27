<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Events Events
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * Create/Edit Group Form.
 */
class BxEventsFormEntry extends BxBaseModGroupsFormEntry
{
    protected static $_isCssJsEventsAdded = false;

    protected $_iContentId = 0;

    public function __construct($aInfo, $oTemplate = false)
    {
        $this->MODULE = 'bx_events';
        parent::__construct($aInfo, $oTemplate);

        $CNF = &$this->_oModule->_oConfig->CNF;

        if (isset($this->aInputs['reoccurring'])) {
            $this->aInputs['reoccurring']['ghost_template'] = array (
                
                'params' => array(
                    'nested_form_template' => 'form_ghost_template_wrapper.html',
                    'db' => array(
                        'table' => 'bx_events_intervals',
                        'key' => 'interval_id',
                        'submit_name' => 'interval_id',
                    ),
                ),
                'inputs' => array (
                    'interval_id' => array (
                        'type' => 'hidden',
                        'name' => 'interval_id[]',
                        'value' => '{interval_id}',
                        'caption' => _t('Interval ID'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),                
                    'repeat_year' => array (
                        'type' => 'select',                    
                        'name' => 'repeat_year[]',
                        'value' => '{repeat_year}',
                        'values' => BxDolForm::getDataItems('bx_events_repeat_year'),
                        'caption' => _t('_bx_events_form_input_repeat_year'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),
                    'repeat_month' => array (
                        'type' => 'select',
                        'name' => 'repeat_month[]',
                        'value' => '{repeat_month}',
                        'values' => BxDolForm::getDataItems('bx_events_repeat_month'),
                        'caption' => _t('_bx_events_form_input_repeat_month'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),
                    'repeat_week_of_month' => array (
                        'type' => 'select',
                        'name' => 'repeat_week_of_month[]',
                        'value' => '{repeat_week_of_month}',
                        'values' => BxDolForm::getDataItems('bx_events_repeat_week_of_month'),
                        'caption' => _t('_bx_events_form_input_repeat_week_of_month'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),                
                    'repeat_day_of_month' => array (
                        'type' => 'select',
                        'name' => 'repeat_day_of_month[]',
                        'value' => '{repeat_day_of_month}',
                        'values' => BxDolForm::getDataItems('bx_events_repeat_day_of_month'),
                        'caption' => _t('_bx_events_form_input_repeat_day_of_month'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),
                    'repeat_day_of_week' => array (
                        'type' => 'select',
                        'name' => 'repeat_day_of_week[]',
                        'value' => '{repeat_day_of_week}',
                        'values' => BxDolForm::getDataItems('bx_events_repeat_day_of_week'),
                        'caption' => _t('_bx_events_form_input_repeat_day_of_week'),
                        'db' => array (
                            'pass' => 'Int',
                        ),
                    ),
                    'repeat_stop' => array (
                        'type' => 'datepicker',
                        'name' => 'repeat_stop[]',
                        'value' => '{repeat_stop}',
                        'caption' => _t('_bx_events_form_input_stop_repeating'),
                        'db' => array (
                            'pass' => 'DateTs',
                        ),
                    ),
                ),
            );
        }

        if (isset($this->aInputs[$CNF['FIELD_TIMEZONE']]) && !$this->aParams['view_mode']) {
            $this->aInputs[$CNF['FIELD_TIMEZONE']]['values'] = array_combine(timezone_identifiers_list(), timezone_identifiers_list());
        }

        if(isset($this->aInputs[$CNF['FIELD_REMINDER']]) && !$this->_oModule->_oConfig->isInternalNotifications())
            unset($this->aInputs[$CNF['FIELD_REMINDER']]);
    }

    function getCode($bDynamicMode = false)
    {
        $sJsCode = '';
        if(empty($this->aParams['view_mode']))
            $sJsCode = $this->_oModule->_oTemplate->getJsCode('entry');

        return $sJsCode . parent::getCode($bDynamicMode);
    }

    protected function fixTimezone(&$aValues, $bAdd = true)
    {
        $sTimezone = 'UTC';
        if (isset($aValues['timezone']) && $aValues['timezone'])
            $sTimezone = $aValues['timezone'];
        elseif (isset($this->aInputs['timezone']['value']) && $this->aInputs['timezone']['value'])
            $sTimezone = $this->aInputs['timezone']['value'];

        $oTz = new DateTimeZone($sTimezone);
        $oDateTz = new DateTime("now", $oTz);
        $iTimeOffset = $oTz->getOffset($oDateTz);
        $a = array('date_start', 'date_end');
        foreach ($a as $sField) {
            if (!isset($aValues[$sField]) && isset($this->aInputs[$sField]['value']) && $this->aInputs[$sField]['value']) {
                $aValues[$sField] = $this->getCleanValue($sField);
            }
            if (isset($aValues[$sField]) && $aValues[$sField] && isset($this->aInputs[$sField]) && isset($this->aInputs[$sField]['db']['pass']) && 'DateTimeUtc' == $this->aInputs[$sField]['db']['pass']) {
                $aValues[$sField] += ($bAdd ? $iTimeOffset : -$iTimeOffset);
            }
        }
    }

    function initChecker ($aValues = array (), $aSpecificValues = array())
    {        
        $this->fixTimezone($aValues, true);

        if (isset($aValues[$this->_oModule->_oConfig->CNF['FIELD_ID']]))
            $this->_iContentId = $aValues[$this->_oModule->_oConfig->CNF['FIELD_ID']];
        
        parent::initChecker($aValues, $aSpecificValues);
        
        if ($this->isSubmitted ()) {
            if (isset($this->aInputs['date_start']) && $this->aInputs['date_start']['value'] != '' && isset($this->aInputs['date_end'])){
                if ($this->aInputs['date_end']['value'] != ''){
                    if (strtotime($this->aInputs['date_end']['value']) < strtotime($this->aInputs['date_start']['value'])){
                        $this->aInputs['date_end']['error'] = _t('_bx_events_form_profile_input_date_end_invalid_err');
                        $this->_isValid = false;       
                        
                        $sSubmitName = false;
                        foreach ($this->aInputs as $k => $a) {
                            if (isset($a['visible_for_levels']) && !BxDolForm::isVisible($a))
                                continue;

                            if (empty($a['name']) || 'submit' == $a['type'] || 'reset' == $a['type'] || 'button' == $a['type'] || 'value' == $a['type']) {
                                if (isset($a['type']) && 'submit' == $a['type'])
                                    $sSubmitName = $k;
                                continue;
                            }

                            if ('input_set' == $a['type'])
                                foreach ($a as $r)
                                    if (isset($r['type']) && 'submit' == $r['type'])
                                        $sSubmitName = $k;

                        }
                        if ($sSubmitName)
                            $this->aInputs[$sSubmitName]['error'] = _t('_sys_txt_form_submission_error');
                        
                    }
                }
                else {
                    $this->aInputs['date_end']['value'] = $this->aInputs['date_start']['value']; //--- is needed for correct work of 'fixTimezone' in insert/update
                    $this->setSubmittedValue('date_end', $this->aInputs['date_start']['value'], BX_DOL_FORM_METHOD_POST);
                }
            }
        }
        
    }

    protected function genCustomRowDateEnd (&$aInput)
    {
        if ($this->aParams['view_mode'])
            return $this->_isSameDayEvent() ? '' : $this->genViewRowWrapped($aInput);

        return $this->genRowStandard($aInput);
    }

    protected function _isSameDayEvent()
    {
        $aStartEnd = $this->_getStartEnd();
        if($aStartEnd === false || (is_array($aStartEnd) && empty($aStartEnd)))
            return false;
        if(empty($aStartEnd['start']) || empty($aStartEnd['end']))
            return false;

        return $aStartEnd['start']->format('Y-m-d') == $aStartEnd['end']->format('Y-m-d');
    }

    protected function _getStartEnd()
    {
        if(!isset($this->aInputs['timezone']['value']) || !isset($this->aInputs['date_start']['value']) || !isset($this->aInputs['date_end']['value']))
            return false;

        if(empty($this->aInputs['date_start']['value']) && empty($this->aInputs['date_end']['value']))
            return array();

        $iTimeStart = bx_process_input ($this->aInputs['date_start']['value'], isset($this->aInputs['date_start']['date_filter']) ? $this->aInputs['date_start']['date_filter'] : BX_DATA_DATETIME_TS, false, false);
        $iTimeEnd = bx_process_input ($this->aInputs['date_end']['value'], isset($this->aInputs['date_end']['date_filter']) ? $this->aInputs['date_end']['date_filter'] : BX_DATA_DATETIME_TS, false, false);

        $oDateStart = !empty($iTimeStart) ? date_create("@$iTimeStart") : false;
        $oDateEnd = !empty($iTimeEnd) ? date_create("@$iTimeEnd") : false;
        if($oDateStart === false && $oDateEnd === false)
            return array();

        return array('start' => $oDateStart, 'end' => $oDateEnd);
    }
    
    protected function genCustomRowTime (&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!$this->aParams['view_mode'])
            return '';

        $aStartEnd = $this->_getStartEnd();

        if ($aStartEnd === false)
            $aInput['value'] = "Timezone, date start & date end fields are required to display this field";
        else if(is_array($aStartEnd) && empty($aStartEnd))
            $aInput['value'] = '';
        else {
            if (!empty($aStartEnd['start']) && !empty($aStartEnd['end']) && $aStartEnd['start']->format('Y-m-d') == $aStartEnd['end']->format('Y-m-d'))
                $aInput['value'] = _t('_bx_events_txt_from_time_to_time', date(getParam($CNF['PARAM_FORMAT_TIME']), $aStartEnd['start']->getTimestamp()), date(getParam($CNF['PARAM_FORMAT_TIME']), $aStartEnd['end']->getTimestamp()));
            else
                $aInput['value'] = '';
        }
        return $this->genViewRowWrapped($aInput);
    }
 
    function genViewRowValue(&$aInput)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (in_array($aInput['name'], array('date_start', 'date_end'))) {

            $aStartEnd = $this->_getStartEnd();
            if($aStartEnd === false)
                return "Timezone, date start & date end fields are required to display this field";

            if(is_array($aStartEnd) && empty($aStartEnd))
                return null;

            $oDate = 'date_start' == $aInput['name'] ? $aStartEnd['start'] : $aStartEnd['end'];
            if (empty($oDate))
                return null;

            $bSameDay = !empty($aStartEnd['start']) && !empty($aStartEnd['end']) && $aStartEnd['start']->format('Y-m-d') == $aStartEnd['end']->format('Y-m-d');
            $sFormat = getParam($bSameDay ? $CNF['PARAM_FORMAT_DATE'] : $CNF['PARAM_FORMAT_DATETIME']);
            return date($sFormat, $oDate->getTimestamp());
        }
        return parent::genViewRowValue($aInput);
    }

    protected function genCustomRowReoccurring (&$aInput)
    {
        return $this->genRowCustom($aInput, 'genInputReoccurring');
    }

    protected function genInputReoccurring (&$aInput, $sInfo = '', $sError = '')
    {
        $sUniqId = genRndPwd (8, false);

        return $this->oTemplate->parseHtmlByName('form_field_reoccurring.html', array(
            'info' => $sInfo,
            'error' => $sError,
            'uniq_id' => $sUniqId,
            'js_instance_name' => 'oBxEventsIntervals_' . $sUniqId,
            'options' => json_encode(array(
                'uniq_id' => $sUniqId,
                'js_instance_name' => 'oBxEventsIntervals_' . $sUniqId,
                'template_ghost' => $this->genGhostTemplate($aInput),
                'content_id' => $this->_iContentId, 
            )),
        ));
    }

    protected function genCustomViewRowValueTimezone ($aInput)
    {
        return $aInput['value'];
    }

    public function insert ($aValsToAdd = array(), $isIgnore = false)
    {
        $this->fixTimezone($aValsToAdd, false);

        $iContentId = parent::insert ($aValsToAdd, $isIgnore);

        $iDateMax = $aValsToAdd['date_end'];

        if (isset($this->aInputs['reoccurring']) && is_array($this->aInputs['reoccurring']['ghost_template']) && !isset($this->aInputs['reoccurring']['ghost_template']['inputs'])) {
            foreach ($this->aInputs['reoccurring']['ghost_template'] as $oFormNested) {

                $iStopRepeating = bx_process_input($oFormNested->getSubmittedValue('repeat_stop', BX_DOL_FORM_METHOD_SPECIFIC, $aSpecificValues), BX_DATA_DATE_TS);
                if ($iStopRepeating > $iDateMax || 0 == (int)$iStopRepeating)
                    $iDateMax = (int)$iStopRepeating;

                $oFormNested->insert(array('event_id' => $iContentId));
            }
        }
        
        $this->_oModule->_oDb->updateEntriesBy(['date_max' => $iDateMax], ['id' => $iContentId]);

        return $iContentId;
    }

    function update ($val, $aValsToAdd = array(), &$aTrackTextFieldsChanges = null)
    {
        $this->fixTimezone($aValsToAdd, false);

        $iAffectedRows = parent::update($val, $aValsToAdd, $aTrackTextFieldsChanges);

        $iDateMax = $aValsToAdd['date_end'];

        if (isset($this->aInputs['reoccurring']) && is_array($this->aInputs['reoccurring']['ghost_template']) && !isset($this->aInputs['reoccurring']['ghost_template']['inputs'])) {
            foreach ($this->aInputs['reoccurring']['ghost_template'] as $oFormNested) {
                $aSpecificValues = $oFormNested->getSpecificValues();
                $iIntervalId = $oFormNested->getSubmittedValue('interval_id', BX_DOL_FORM_METHOD_SPECIFIC, $aSpecificValues);

                $iStopRepeating = bx_process_input($oFormNested->getSubmittedValue('repeat_stop', BX_DOL_FORM_METHOD_SPECIFIC, $aSpecificValues), BX_DATA_DATE_TS);
                if ($iStopRepeating > $iDateMax || 0 == (int)$iStopRepeating)
                    $iDateMax = (int)$iStopRepeating;

                if ($iIntervalId) {
                    $oFormNested->update($iIntervalId);
                } else {
                    $oFormNested->insert(array('event_id' => $this->_iContentId));
                }
            }
        }

        $this->_oModule->_oDb->updateEntriesBy(['date_max' => $iDateMax], ['id' => $this->_iContentId]);

        return $iAffectedRows;
    }
    
    function addCssJs ()
    {
        if ((!isset($this->aParams['view_mode']) || !$this->aParams['view_mode']) && !self::$_isCssJsEventsAdded) {
            $this->oTemplate->addJs(array('moment-timezone-with-data-1970-2030.min.js', 'modules/base/groups/js/|entry.js', 'entry.js', 'intervals.js'));
            $this->oTemplate->addCss('informer.css');
            self::$_isCssJsEventsAdded = true;
        }  

        parent::addCssJs ();
    }
}

/** @} */
