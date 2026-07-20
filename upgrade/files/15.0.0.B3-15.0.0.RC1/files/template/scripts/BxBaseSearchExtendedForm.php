<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Extended Search Form.
 * 
 * @see BxDolSearchExtended
 */
class BxBaseSearchExtendedForm extends BxTemplFormView
{
    protected $_iAgeMin;
    protected $_iAgeMax;

    public function __construct($aInfo, $oTemplate = false)
    {
        parent::__construct($aInfo, $oTemplate);

        $this->_iAgeMin = 1;
        $this->_iAgeMax = 75;
    }

    function getCleanValue($sName)
    {
        $bType = isset($this->aInputs[$sName]['type']);

        //--- Process field with 'Location' type. 
        if($bType && $this->aInputs[$sName]['type'] == 'location') {
            $aLocation = BxDolMetatags::locationsRetrieveFromForm($sName, $this);
            if ($aLocation && !bx_is_empty_array($aLocation)) {
                return [
                    'string' => parent::getCleanValue($sName),
                    'array' => $aLocation,
                ];
            }
        }

        //--- Process field with 'Location Radius' type. 
        if($bType && $this->aInputs[$sName]['type'] == 'location_radius') {
            $aLocation = BxDolMetatags::locationsRetrieveFromForm($sName, $this);
            if ($aLocation && !bx_is_empty_array($aLocation)) {
                $aLocation[] = (int)$this->getLocationVal($this->aInputs[$sName], 'rad');
                return [
                    'string' => parent::getCleanValue($sName),
                    'array' => $aLocation,
                ];
            }
        }

        //--- Process field with 'Date Range Age' and 'Date-Time Range Age' type.
        if($bType && in_array($this->aInputs[$sName]['type'], array('datepicker_range_age', 'datetime_range_age'))) {
            $bTypeDateTime = $this->aInputs[$sName]['type'] == 'datetime_range_age';

            $sMethod = $this->aFormAttrs['method'];
            $sValue = self::getSubmittedValue($sName, $sMethod);

            if(!empty($sValue) && is_string($sValue)) {
                $aMatches = array();
                if(!preg_match("/^([0-9]+)-([0-9]+)$/i", $sValue, $aMatches))
                    return array();

                $aArgs = array("%s-%s-%s", date('Y'), date('m'), date('d'));
                if($bTypeDateTime) {
                    $aArgs[0] = "%s-%s-%s %s:%s:%s";
                    $aArgs = array_merge($aArgs, array(date('H'), date('i'), date('s')));
                }

                $aArgsFrom = $aArgs;
                $aArgsFrom[1] -= ($aMatches[2] + 1);
                if($bTypeDateTime)
                    $aArgsFrom[6] += 1;
                else
                    $aArgsFrom[3] += 1;

                $aArgsTo = $aArgs;
                $aArgsTo[1] -= $aMatches[1];

                self::setSubmittedValue($sName, array(
                    call_user_func_array('sprintf', $aArgsFrom),
                    call_user_func_array('sprintf', $aArgsTo)
                ), $sMethod);
            }
        }

        return parent::getCleanValue($sName);
    }

    public function genInput(&$aInput)
    {
        switch($aInput['type'])
        {
            case 'text_range':
            case 'datepicker_range':
            case 'datetime_range':
                $bValue = !empty($aInput['value']) && is_array($aInput['value']);

                $aInput['name'] .= '[]';
                $aInput['type'] = str_replace('_range', '', $aInput['type']);

                if(!isset($aInput['attrs_wrapper']['class']))
                    $aInput['attrs_wrapper']['class'] = '';
                $aInput['attrs_wrapper']['class'] .= ' range';

                $aSubInputs = array($aInput, $aInput);
                foreach($aSubInputs as $iKey => $aSubInput) {
                    if($bValue && isset($aInput['value'][$iKey]))
                        $aSubInput['value'] = $aInput['value'][$iKey];

                    $aSubInputs[$iKey] = $this->genInputStandard($aSubInput);
                }

                return implode(' - ', $aSubInputs);

            case 'datepicker_range_age':
            case 'datetime_range_age':
                $iMin = $this->_iAgeMin;
                $iMax = $this->_iAgeMax;

                $aInput['type'] = 'doublerange';
				
                if(empty($aInput['value']))
                    $aInput['value'] = $iMin . '-' . $iMax;
                else if(is_array($aInput['value'])) {
                    $iCYear = (int)date('Y');
                    $iCMonth = (int)date('n');
                    $iCDay = (int)date('j');
                    
                    $aRange = array();
                    foreach($aInput['value'] as $iIndex => $sDate) {
                        $aDate = explode('-', $sDate);

                        $aRange[$iIndex] = $iCYear - (int)$aDate[0];
                        if($iCMonth < (int)$aDate[1] || ($iCMonth == (int)$aDate[1] && $iCDay < (int)$aDate[2]))
                            $aRange[$iIndex] -= 1;
                    }
                    sort($aRange);

                    $aInput['value'] = implode('-', $aRange);
                }

                if (!isset($aInput['attrs']['min']) && !isset($aInput['attrs']['max'])){
                    $aAttrs = array('min' => $iMin, 'max' => $iMax, 'step' => 1);
                    if(!empty($aInput['attrs']) && is_array($aInput['attrs']))
                        $aInput['attrs'] = array_merge($aInput['attrs'], $aAttrs);
                    else 
                        $aInput['attrs'] = $aAttrs;
                }

                return $this->genInputStandard($aInput);

            case 'location_radius':
                return $this->genInputLocationRadius($aInput);
        }

        return parent::genInput($aInput);
    }

    public function genInputLocation(&$aInput)
    {
        $aInput['manual_input'] = true;
        return parent::genInputLocation($aInput);
    }

    public function genInputLocationRadius(&$aInput)
    {
        $aInput['manual_input'] = true;
        
        $aInputRadius = $aInput;
        $aInputRadius['type'] = 'text';
        $aInputRadius['name'] = $aInputRadius['name'] . '_rad';
        $aInputRadius['value'] = $this->getLocationVal($aInput, 'rad');
        $aInputRadius['attrs']['placeholder'] = _t('_sys_form_input_location_radius_label');

        return $this->oTemplate->parseHtmlByName('form_field_location_radius.html', array (
            'location_input' => parent::genInputLocation($aInput),
            'radius_input' => parent::genInputStandard($aInputRadius),
        ));
    }

    protected function genCustomInputAuthor($aInput)
    {
        $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . 'searchExtended.php?action=get_authors';

        return $this->genCustomInputUsernamesSuggestions($aInput);
    }

    protected function genCustomInputLabels (&$aInput)
    {
        $aLabels = BxDolLabel::getInstance()->getLabels(['type' => 'values']);
        if(!empty($aLabels) && is_array($aLabels))
            $aInput['values'] = array_combine($aLabels, $aLabels);       

        return $this->genInputCheckboxSet($aInput);
    }

    protected function genCustomInputAllowViewTo (&$aInput)
    {
        $iProfileId = bx_get_logged_profile_id();
        $oConnection = BxDolConnection::getObjectInstance('sys_profiles_subscriptions');

        $aModules = bx_srv('system', 'get_modules_by_type', ['context']);

        $aValues = [
            ['key' => 0, 'value' => _t('_sys_please_select')],
            ['key' => 3, 'value' => _t('_sys_ps_group_title_public')]
        ];
        foreach($aModules as $aModule) {
            $aItems = $oConnection->getConnectedContentByType($iProfileId, $aModule['name']);
            if($aItems && is_array($aItems)) {
                $aValues[] = [
                    'type' => 'group_header', 
                    'value' => mb_strtoupper(bx_srv($aModule['name'], 'get_space_title'))
                ];

                foreach($aItems as $iItem)
                    if(($oProfile = BxDolProfile::getInstance($iItem)) !== false && ($sDisplayName = $oProfile->getDisplayName()))
                        $aValues[] = ['key' => -$iItem, 'value' => $sDisplayName];

                $aValues[] = [
                    'type' => 'group_end'
                ];
            }
        }

        $aInput['values'] = $aValues;
        return $this->{'genInput' . ($aInput['type'] == 'hidden' ? 'Standard' : 'Select')}($aInput);
    }

    function addCssJsCore ()
    {
        parent::addCssJsCore();

        $this->_addCss('search_extended.css');
    }
}

/** @} */
