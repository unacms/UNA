<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) AQB Soft - http://www.aqbsoft.com/
 * CC-BY License - http://creativecommons.org/licenses/by/3.0/
 *
 * @defgroup    Points System Points System
 * @ingroup     UnaModules
 *
 * @{
 */

class BxMessengerFilterForm extends BxBaseModGeneralFormEntry
{
    protected $_sModule;
    protected $_oModule;
    protected $_oConfig;
    protected $_oTemplate;
    protected $_sJsObject;

    function __construct($aCustomForm = [])
    {
        $this->MODULE = 'bx_messenger';
    	$this->_oModule = BxDolModule::getInstance($this -> MODULE);

    	$this->_oConfig = &$this->_oModule->_oConfig;
    	$this->_oTemplate = &$this->_oModule->_oTemplate;

        $aCustomForm = $this->initForm();
        parent::__construct ($aCustomForm, $this->_oTemplate);
    }

    function filteredForm(){
        $CNF = &$this->_oModule->_oConfig->CNF;

        if (!$CNF['BROADCAST-FIELDS'])
            return false;

        $aFilterFields = explode(',', $CNF['BROADCAST-FIELDS']);
        if (empty($aFilterFields))
            return false;

        $aBFields = $this->_oConfig->getBroadcastAllowedFields();
        foreach($aBFields as &$sValue){
            if (!in_array($sValue, $aFilterFields))
                unset($this->aInputs[$sValue]);
        }

        return true;
    }

    private function initForm(){
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aFilterFields = $this->_oModule->_oConfig->getBroadcastAllowedFields();
        $aForm = [];
        $aInputs['type'] = [
            'type' => 'hidden',
            'value' => BX_IM_TYPE_BROADCAST,
            'name' => 'convo_type'
        ];

        if (in_array('membership', $aFilterFields)) {
            $aMembershipLevels = BxDolAcl::getInstance()->getMemberships(false, true, true, true);
            $aInputs['membership'] = [
                    'type' => 'checkbox_set',
                    'name' => 'membership',
                    'caption' => _t('_bx_messenger_filter_criteria_membership'),
                    'values' => $aMembershipLevels
                ];
        }

        $aModules = BxDolService::call('system', 'get_profiles_modules', array(), 'TemplServiceProfiles');
        if (!empty($aModules)) {
            foreach ($aModules as &$aModule) {
                $sModule = $aModule['name'];
                $oModule = BxDolModule::getInstance($sModule);

                $oCNF = &$oModule->_oConfig->CNF;
                $oForm = BxDolForm::getObjectInstance($oCNF['OBJECT_FORM_ENTRY'], $oCNF['OBJECT_FORM_ENTRY_DISPLAY_ADD'], $this->_oTemplate);
                if (!$oForm)
                    continue;

                $aFormInputs = $oForm->aInputs;
                foreach ($aFormInputs as $r)
                    if (in_array($r['name'], $aFilterFields)) {
                        if ($r['name'] === 'location') {
                            $aCountries = BxDolFormQuery::getDataItems('Country', false, BX_DATA_VALUES_DEFAULT);
                            $aInputs[$r['name']] = [
                                'type' => 'select_multiple',
                                'name' => $r['name'],
                                'caption' => _t($r['caption']),
                                'values' => $aCountries,
                                'value' => isset($r['value']) ? $r['value'] : ''
                            ];

                        } else
                            $aInputs[$r['name']] = [
                                'type' => $r['type'] === 'select' ? 'checkbox_set' : $r['type'],
                                'name' => $r['name'],
                                'caption' => _t($r['caption']),
                                'values' => isset($r['values']) ? $r['values'] : [],
                                'value' => isset($r['value']) ? $r['value'] : ''
                            ];
                    }
            }

            $aNotifFields = $this->_oModule->_oTemplate->getNotificationFormData();

            bx_alert($this->_oConfig->getObject('alert'), 'attachment_form_before', 0, 0, [
                'inputs' => &$aInputs
            ]);

            $aForm = [
                'form_attrs' => [
                    'method' => 'post',
                    'id' => $CNF['OBJECT_FORM_ENTRY'],
                    'class' => 'space-y-4 max-h-60 overflow-y-auto'
                ],
                'inputs' => array_merge(
                    $aInputs,
                    $aNotifFields,
                    ['author' => [
                        'type' => 'custom',
                        'skip' => true,
                        'custom' => ['only_once' => true, 'b_img' => 2],
                        'name' => 'author',
                        'caption' =>  _t('_bx_messenger_broadcast_field_author'),
                        'info' =>  _t('_bx_messenger_broadcast_field_author_info'),
                       ]
                    ],
                    ['bottom' =>
                      [
                        'type' => 'button',
                        'skip' => true,
                        'value' => _t('_bx_messenger_broadcast_field_calculate'),
                        'name' => 'calculate',
                        'attrs' => ['onclick' => "{$CNF['JSMessengerLib']}.onCalculateProfiles();"]
                      ]
                    ]
                ),
            ];
        }

        return $aForm;
    }

    protected function genCustomInputAuthor ($aInput)
    {
        $aInput['ajax_get_suggestions'] = BX_DOL_URL_ROOT . "modules/?r=messenger/ajax_get_recipients";
        return $this->genCustomInputUsernamesSuggestions($aInput);
    }
}

/** @} */
