<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

require_once(BX_DOL_DIR_STUDIO_INC . 'utils.inc.php');
require_once('BxTasksGridTimeContextAdministration.php');

class BxTasksGridTimeContextCommon extends BxTasksGridTimeContextAdministration
{
    protected $_iLogged;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_iLogged = bx_get_logged_profile_id();
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'add':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_add');
                break;

            case 'edit':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_edit');
                break;

            default:
                parent::getFormBlockTitleAPI($sAction, $iId);
        }

        return $sResult;
    }
    
    public function performActionAdd()
    {
        $sAction = 'add';

        $oForm = $this->_getFormObject($sAction);
        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iNow = time();
            $iValue = $this->_oModule->_oConfig->timeA2I([(int)$oForm->getCleanValue('value_h'), (int)$oForm->getCleanValue('value_m')]);
            $aValsToAdd = [
                'author_id' => $this->_iLogged,
                'author_nip' => bx_get_ip_hash(getVisitorIP()),
                'value' => $iValue,
                'value_date' => $oForm->getCleanValue('value_date') ?: $iNow,
                'date' => $iNow
            ];

            $iTrackId = $oForm->insert($aValsToAdd);
            if(!$iTrackId)
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            $sSystem = $oForm->getCleanValue('sys');
            $iObjectId = $oForm->getCleanValue('object_id');
            if(($oTime = BxDolReport::getObjectInstance($sSystem, $iObjectId)) && $oTime->isEnabled())
                $oTime->putReport($iObjectId, $this->_iLogged, $iTrackId);

            $this->_oModule->updateBudgetByContentId($iObjectId, $iValue);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iTrackId]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('time_popup'), _t('_bx_tasks_grid_popup_title_tm_add'), $this->_oModule->_oTemplate->parseHtmlByName('popup_time.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionEdit()
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

        $sAction = 'edit';

        $aIds = $this->_getIds();
        if($aIds === false)
            return $this->_getActionResult([]);

        $iTrackId = array_shift($aIds);
        $aTrack = $this->_oModule->_oDb->getTimeTracks(['sample' => 'id', 'id' => $iTrackId]);
        if(empty($aTrack) || !is_array($aTrack))
            return $this->_getActionResult([]);

        $oForm = $this->_getFormObject($sAction, $aTrack);
        $oForm->initChecker($aTrack);
        if($oForm->isSubmittedAndValid()) {
            $aValsToAdd = [
                'value' => $this->_oModule->_oConfig->timeA2I([(int)$oForm->getCleanValue('value_h'), (int)$oForm->getCleanValue('value_m')]),
            ];

            if(!$oForm->update($iTrackId, $aValsToAdd))
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            $iObjectId = (int)$aTrack['object_id'];
            $iAuthorId = (int)$aTrack['author_id'];
            if(($oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iObjectId)) && $oTime->isEnabled()) {
                $oTime->putReport($iObjectId, $iAuthorId, $aTrack, true); //--- Revoke old value
                $oTime->putReport($iObjectId, $iAuthorId, $iTrackId); //--- Process new value
            }

            $this->_oModule->updateBudgetByContentId($iObjectId, $aValsToAdd['value'] - $aTrack['value']);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iTrackId]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iTrackId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('time_popup'), _t('_bx_tasks_grid_popup_title_tm_edit'), $this->_oModule->_oTemplate->parseHtmlByName('popup_time.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getFormObject($sAction, $aTrack = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bActionAdd = $sAction == 'add';
        $bActionEdit = $sAction == 'edit';

        $bTrack = !empty($aTrack) && is_array($aTrack);

        $aActionParams = [
            'o' => $this->_sObject, 
            'a' => $sAction,
            'context_pid' => $this->_iContextPid
        ];
        if($bActionEdit && $bTrack)
            $aActionParams['id'] = (int)$aTrack['id'];

        $sForm = $CNF['OBJECT_FORM_TIME_DISPLAY_' . strtoupper($sAction)];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_TIME'], $sForm);
        $oForm->setId($sForm);
        $oForm->setName($sForm);
    	$oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams));

        $oForm->aParams['db']['table'] = $CNF['TABLE_TIME_TRACK'];
        if($bActionAdd) {
            $oForm->aInputs['sys']['value'] = $CNF['OBJECT_REPORTS_TIME'];
            $oForm->aInputs['action']['value'] = 'Report';
            $oForm->aInputs['object_id'] = array_merge($oForm->aInputs['object_id'], [
                'type' => 'select',
                'values' => [['key' => 0, 'value' => _t('_sys_please_select')]],
                'required' => true,
                'checker' => [
                    'func' => 'Avail',
                    'error' => _t('_bx_tasks_form_time_input_object_id_err')
                ]
            ]);

            $aTasks = $this->_oModule->_oDb->getTasks($this->_iContextPid);
            foreach($aTasks as $aTask) {
                if($aTask[$CNF['FIELD_STATUS_ADMIN']] !== 'active')
                    continue;

                $oForm->aInputs['object_id']['values'][] = [
                    'key' => $aTask[$CNF['FIELD_ID']],
                    'value' => $aTask[$CNF['FIELD_TITLE']]
                ];
            }
        }
        else if($bActionEdit) {
            if($bTrack) {
                list($value_h, $value_m) = $this->_oModule->_oConfig->timeI2A($aTrack['value']);

                foreach($oForm->aInputs['value'] as $mixedKey => $mixedValue) {
                    if(!is_numeric($mixedKey) || !is_array($mixedValue))
                        continue;

                    if(($iValue = ${$mixedValue['name']} ?? false) !== false)
                        $oForm->aInputs['value'][$mixedKey]['value'] = (int)$iValue;
                }
            }
        }
        
        if($this->_bIsApi && ($sK = 'value') && isset($oForm->aInputs[$sK])) {
            foreach($oForm->aInputs[$sK] as $mixedKey => $mixedValue) 
                if(($sName = $mixedValue['name'] ?? false) && in_array($sName, ['value_h', 'value_m']) && ($sCaptionSrc = '_bx_tasks_form_time_input_' . $sName))
                    $oForm->aInputs = bx_array_insert_before([$sName => array_merge(
                        $mixedValue, [
                            'caption_src' => $sCaptionSrc,
                            'caption' => _t($sCaptionSrc)
                        ]
                    )], $oForm->aInputs, 'value_date');

            unset($oForm->aInputs[$sK]);
        }

        return $oForm;
    }

    protected function _getFilterControls()
    {
        $this->_getFcDefault();

        $sContent = $this->_getFilterSelectOne($this->_sFilter2Name, $this->_sFilter2Value, $this->_aFilter2Values, '_bx_tasks_grid_filter_item_title_tm_select_one_object_id');
        $sContent .= $this->_getFcDateSearch();
        return $sContent;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `ttt`.`author_id`=?", $this->_iLogged);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
