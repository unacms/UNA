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

/*
 * Groups module representation.
 */
class BxEventsTemplate extends BxBaseModGroupsTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_events';
        parent::__construct($oConfig, $oDb);

        // the gallery card (unit.html here) is the apps' card (unit_card.html), as people's and organizations' is
        $this->_bUnitCard = true;
        $this->_aUnitCardTemplates = ['unit.html', 'unit_with_cover.html'];
        $this->_sUnitCardViewIcon = 'arrow-circle-right';
    }

    public function getBlockSessions($iContentId)
    {
        $CNF = &$this->_oConfig->CNF;

        $aSessions = $this->_oDb->getSessions(['sample' => 'event_id', 'event_id' => $iContentId, 'order_by' => $this->_bIsApi ? 'date_start' : '']);
        if(empty($aSessions) || !is_array($aSessions))
            return '';

        $aTmplVarsSession = [];
        foreach($aSessions as $aSession) {
            $aTmplVarsSession[] = [
                'title' => bx_process_output($aSession['title']),
                'description' => bx_process_output($aSession['description'], BX_DATA_HTML),
                'date_start' => $this->_bIsApi ? $aSession['date_start'] : bx_time_js($aSession['date_start'], BX_FORMAT_DATE_TIME, true),
                'date_end' => $this->_bIsApi ? $aSession['date_end'] : bx_time_js($aSession['date_end'], BX_FORMAT_DATE_TIME, true),
            ];
        }

        if($this->_bIsApi)
            return [bx_api_get_block('simple_list',  $aTmplVarsSession)];

        return $this->parseHtmlByName('entry-sessions.html', [
            'bx_repeat:sessions' => $aTmplVarsSession
        ]);
    }

    function unitVars ($aData, $isCheckPrivateContent = true, $mixedTemplate = false, $aParams = array())
    {
        $aVars = parent::unitVars ($aData, $isCheckPrivateContent, $mixedTemplate, $aParams);

        $CNF = &$this->_oConfig->CNF;

        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);

        $aContentInfo = $this->getModule()->_oDb->getContentInfoById($aData[$CNF['FIELD_ID']]);

        $oDateStart = date_create('@' . $aContentInfo['date_start']);
        if ($oDateStart)
            $oDateStart->setTimezone(new DateTimeZone($aContentInfo['timezone'] ? $aContentInfo['timezone'] : 'UTC'));

        $oDateEnd = date_create('@' . $aContentInfo['date_end']);
        if ($oDateEnd)
            $oDateEnd->setTimezone(new DateTimeZone($aContentInfo['timezone'] ? $aContentInfo['timezone'] : 'UTC'));

        $isPublic = CHECK_ACTION_RESULT_ALLOWED === $this->getModule()->checkAllowedView($aData) || $oPrivacy->isPartiallyVisible($aData[$CNF['FIELD_ALLOW_VIEW_TO']]);        
        if ($isPublic) {
            $aVars['bx_if:info']['content']['members'] = $oDateStart->format(getParam($CNF['PARAM_FORMAT_DATE']));
        }

        return array_merge($aVars, array(
			'date_start' => $aData['date_start'] ? $aData['date_start'] : '',
			'date_start_f' => $oDateStart ? bx_time_js($oDateStart->getTimestamp(), BX_FORMAT_DATE_TIME, true) : '',
			'date_end' => $aData['date_end'] ? $aData['date_end'] : '',
			'date_end_f' => $oDateEnd ? bx_time_js($oDateEnd->getTimestamp(), BX_FORMAT_DATE_TIME, true) : '',
        ));
    }

    protected function _getBrowsingFiltersContent($aParams)
    {
        $sModule = $this->_oConfig->getName();
        $sJsObject = $this->_oConfig->getJsObject('main');

        $aForm = [
            'form_attrs' => [
                'id' => $sModule . '_filters_' . $aParams['mode'],
                'action' => ''
            ],
            'params' => [
                'db' => [
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => ''
                ],
                'module' => $sModule,
                'object' => $sModule . '_filters',
                'display' => $sModule . '_filters_apply',
                'view_mode' => 0,
            ],
            'inputs' => [
                'by_location' => [
                    'name' => 'by_location',
                    'type' => 'location',
                    'caption' => _t('_bx_events_form_filters_input_by_location'),
                    'manual_input' => true,
                    'minimized' => true
                ],
                'by_date' => [
                    'name' => 'by_date',
                    'type' => 'radio_set',
                    'caption' => _t('_bx_events_form_filters_input_by_date'),
                    'values' => [
                        ['key' => 'all', 'value' => _t('_bx_events_form_filters_input_by_date_all')],
                        ['key' => 'today', 'value' => _t('_bx_events_form_filters_input_by_date_today')],
                        ['key' => 'tomorrow', 'value' => _t('_bx_events_form_filters_input_by_date_tomorrow')],
                        ['key' => 'weekend', 'value' => _t('_bx_events_form_filters_input_by_date_weekend')],
                        ['key' => 'this_week', 'value' => _t('_bx_events_form_filters_input_by_date_this_week')],
                        ['key' => 'next_week', 'value' => _t('_bx_events_form_filters_input_by_date_next_week')],
                        ['key' => 'this_month', 'value' => _t('_bx_events_form_filters_input_by_date_this_month')],
                        ['key' => 'date_range', 'value' => _t('_bx_events_form_filters_input_by_date_date_range')],
                        
                    ],
                    'value' => 'all',
                    'attrs' => ['onchange' => $sJsObject . '.onChangeBrowsingFiltersByDate(this)'],
                    'dv_thd' => 1
                ],
                'date_start' => [
                    'name' => 'date_start',
                    'type' => 'datepicker',
                    'tr_attrs' => ['class' => 'date-range date-start', 'style' => 'display:none']
                ],
                'date_end' => [
                    'name' => 'date_end',
                    'type' => 'datepicker',
                    'tr_attrs' => ['class' => 'date-range date-end', 'style' => 'display:none']
                ],
                'timezone' => [
                    'name' => 'timezone',
                    'type' => 'hidden',
                    'value' => ''
                ],
                'controls' => [
                    'name' => 'controls',
                    'type' => 'input_set',
                    [
                        'name' => 'apply',
                        'type' => 'button',
                        'value' => _t('_bx_events_form_filters_input_do_apply'),
                        'attrs' => ['onclick' => $sJsObject . '.applyBrowsingFilter(this, ' . json_encode($aParams) . ')']
                    ], [
                        'name' => 'cancel',
                        'type' => 'button',
                        'value' => _t('_Cancel'),
                        'attrs' => [
                            'class' => 'bx-def-margin-sec-left',
                            'onclick' => "$('.bx-popup-applied:visible').dolPopupHide()"
                        ]
                    ],
                    
                ],
                
            ]
        ];

        $oForm = new BxTemplFormView($aForm);
        if($this->_bIsApi)
            return $oForm->getCodeAPI();

        $sIncludes = '';
        $sIncludes .= $this->addCss(['filters.css'], true);
        $sIncludes .= $this->addJs(['moment-timezone-with-data-1970-2030.min.js'], true);

        return $sIncludes . $oForm->getCode(true);
    }
}

/** @} */
