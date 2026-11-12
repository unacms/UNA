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

class BxTasksGridTime extends BxBaseModGeneralGrid
{
    protected $_sFilter1Name;   //--- Assignees
    protected $_sFilter1Value;
    protected $_aFilter1Values;
    protected $_sFilter2Name;   //--- Contexts/Tasks
    protected $_sFilter2Value;
    protected $_aFilter2Values;
    protected $_sFilter3Name;   //--- Date from
    protected $_sFilter3Value;
    protected $_sFilter4Name;   //--- Date to
    protected $_sFilter4Value;

    protected $_iContextPid = 0;

    protected $_aFieldsAll = null; //--- the fields as sys_grid_fields lists them

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';

        parent::__construct ($aOptions, $oTemplate);

        $this->_sTableAlias = 'ttt';

        $this->_sDefaultSortingOrder = 'DESC';

        /*
         * Filters by date from/to
         */
        $this->_sFilter3Name = 'filter3';
        $this->_sFilter4Name = 'filter4';

        //--- Site grids: only UNA operators see Billed time there; context grids decide in setContextPid.
        $this->_setColumnBilled($this->_oModule->_isAdministrator() || $this->_oModule->_isModerator());
    }

    /**
     * The Billed column (`value_billed` in sys_grid_fields) is there only for those who see Billed time.
     */
    protected function _setColumnBilled($bShow)
    {
        if($this->_aFieldsAll === null)
            $this->_aFieldsAll = $this->_aOptions['fields'];

        $this->_aOptions['fields'] = $this->_aFieldsAll;
        if(!$bShow)
            unset($this->_aOptions['fields']['value_billed']);
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'calculate':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_calculate');
                break;

            case 'add':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_add');
                break;

            case 'edit':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_edit');
                break;
        }

        return $sResult;
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

        if(!$this->_isAllowedEdit($aTrack))
            return $this->_getActionResult([]);

        list($bEditLogged, $bEditBilled) = $this->_getEditRights($aTrack);

        $oForm = $this->_getFormObject($sAction, $aTrack);
        $oForm->initChecker($aTrack);
        if($oForm->isSubmittedAndValid()) {
            $oConfig = $this->_oModule->_oConfig;

            //--- The original time stays, the Logged time changes; Billed time follows it until it's set.
            $aValsToAdd = [];
            if($bEditLogged)
                $aValsToAdd['value'] = $oConfig->timeA2I([(int)$oForm->getCleanValue('value_h'), (int)$oForm->getCleanValue('value_m')]);

            $iBilledOld = $this->_oModule->getTrackBilled($aTrack);
            if($bEditBilled && ($iBilled = $oConfig->timeA2I([(int)$oForm->getCleanValue('billed_h'), (int)$oForm->getCleanValue('billed_m')])) != $iBilledOld)
                $aValsToAdd['value_billed'] = $iBilled;

            $bResult = $bEditLogged ? $oForm->update($iTrackId, $aValsToAdd) : (!$aValsToAdd || $this->_oModule->_oDb->updateTimeTrack($aValsToAdd, ['id' => $iTrackId]));
            if(!$bResult)
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            $iObjectId = (int)$aTrack['object_id'];
            $iAuthorId = (int)$aTrack['author_id'];
            if($bEditLogged && ($oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iObjectId)) && $oTime->isEnabled()) {
                $oTime->putReport($iObjectId, $iAuthorId, $aTrack, true); //--- Revoke old value
                $oTime->putReport($iObjectId, $iAuthorId, $iTrackId); //--- Process new value
            }

            //--- The budget is spent by Billed time.
            $this->_oModule->spendBudgetByContentId($iObjectId, $this->_oModule->getTrackBilled(array_merge($aTrack, $aValsToAdd)) - $iBilledOld);

            if($this->_bIsApi)
                return [];

            echoJson(['grid' => $this->getCode(false), 'blink' => $iTrackId]);
            return;
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iTrackId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('time_popup'), _t('_bx_tasks_grid_popup_title_tm_edit'), $this->_oModule->_oTemplate->parseHtmlByName('popup_time.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getFormObject($sAction, $aTrack = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bActionAdd = $sAction == 'add';
        $bActionEdit = $sAction == 'edit';

        $bTrack = !empty($aTrack) && is_array($aTrack);

        $aActionParams = ['o' => $this->_sObject, 'a' => $sAction];
        if($this->_iContextPid)
            $aActionParams['context_pid'] = $this->_iContextPid;
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
        else if($bActionEdit && $bTrack) {
            list($bEditLogged, $bEditBilled) = $this->_getEditRights($aTrack);

            //--- Billed time is made of the Logged time's inputs, so they are added before those may go.
            if($bEditBilled)
                $this->_addTimeInputBilled($oForm, $this->_oModule->getTrackBilled($aTrack));

            $this->_setTimeInputValue($oForm, 'value', (int)$aTrack['value']);

            //--- Logged time, its date and note are the logger's: the others see them, read only.
            if(!$bEditLogged)
                $this->_setInputsReadOnly($oForm, ['value', 'value_date', 'text']);
        }

        //--- Replaced by the Billed time (value_billed).
        unset($oForm->aInputs['billable']);

        //--- Hours and minutes stay one input set, which NEO shows in a row too.
        return $oForm;
    }

    /**
     * Read only inputs, also the inputs of an input set; not required, since the values aren't taken from them.
     */
    protected function _setInputsReadOnly(&$oForm, $aKeys)
    {
        foreach($aKeys as $sKey) {
            if(!isset($oForm->aInputs[$sKey]))
                continue;

            $aInput = &$oForm->aInputs[$sKey];
            $aInput['required'] = false;
            unset($aInput['checker']);

            //--- `disabled`: NEO gets it with the form (a `readonly` one doesn't reach it), and the site greys the input out.
            if($aInput['type'] == 'input_set') {
                foreach($aInput as $mixedKey => $mixedValue)
                    if(is_numeric($mixedKey) && is_array($mixedValue))
                        $aInput[$mixedKey]['attrs'] = array_merge($mixedValue['attrs'] ?? [], ['disabled' => 'disabled']);
            }
            else
                $aInput['attrs'] = array_merge($aInput['attrs'] ?? [], ['disabled' => 'disabled']);

            unset($aInput);
        }
    }

    /**
     * Logged time is edited by the one who logged it only, nobody else (operators neither);
     * those with `time_edit_billed` (UNA operators always) edit Billed time.
     */
    protected function _getEditRights($aTrack)
    {
        $bOwn = (int)$aTrack['author_id'] == bx_get_logged_profile_id();

        $aRights = $this->_oModule->getTimeRightsByContentId((int)$aTrack['object_id']);

        return [$bOwn, $aRights['edit_billed']];
    }

    protected function _setTimeInputValue(&$oForm, $sKey, $iValue)
    {
        if(!isset($oForm->aInputs[$sKey]))
            return;

        list($iH, $iM) = $this->_oModule->_oConfig->timeI2A($iValue);

        foreach($oForm->aInputs[$sKey] as $mixedKey => $mixedValue) {
            if(!is_numeric($mixedKey) || !is_array($mixedValue) || empty($mixedValue['name']))
                continue;

            if(str_ends_with($mixedValue['name'], '_h'))
                $oForm->aInputs[$sKey][$mixedKey]['value'] = $iH;
            else if(str_ends_with($mixedValue['name'], '_m'))
                $oForm->aInputs[$sKey][$mixedKey]['value'] = $iM;
        }
    }

    /**
     * Billed time takes the hours and minutes inputs of the Logged time (value), renamed billed_h and billed_m.
     */
    protected function _addTimeInputBilled(&$oForm, $iValue)
    {
        $aValue = $oForm->aInputs['value'] ?? false;
        if(!$aValue)
            return;

        $sKey = 'value_billed';
        $aBilled = array_merge($aValue, [
            'name' => $sKey,
            'caption' => _t('_bx_tasks_form_time_input_value_billed')
        ]);
        foreach($aBilled as $mixedKey => $mixedValue)
            if(is_numeric($mixedKey) && is_array($mixedValue) && !empty($mixedValue['name']))
                $aBilled[$mixedKey]['name'] = str_replace('value_', 'billed_', $mixedValue['name']);

        $sBefore = isset($oForm->aInputs['value_date']) ? 'value_date' : (isset($oForm->aInputs['text']) ? 'text' : 'controls');
        $oForm->aInputs = bx_array_insert_before([$sKey => $aBilled], $oForm->aInputs, $sBefore);

        $this->_setTimeInputValue($oForm, $sKey, $iValue);
    }

    public function performActionCalculate()
    {
        $sAction = 'calculate';

        $aIds = $this->_getIds();
        if($aIds === false)
            return $this->_getActionResult([]);

        $iTotal = 0;
        foreach($aIds as $iId) {
            $aTrack = $this->_oModule->_oDb->getTimeTracks(['sample' => 'id', 'id' => $iId]);
            if(empty($aTrack) || !is_array($aTrack))
                continue;

            $iTotal += $aTrack['value'];
        }
        $sTotal = $iTotal ? $this->_oModule->_oConfig->timeI2S($iTotal) : '';

        if($this->_bIsApi)
            return [
                bx_api_get_block('msg', [
                    'total' => $iTotal,
                    'total_f' => $sTotal
                ])
            ];

        $sContent = BxTemplFunctions::getInstance()->transBox($this->_oModule->_oConfig->getHtmlIds('total_popup'), $this->_oModule->_oTemplate->parseHtmlByName('popup_total.html', [
            'total' => $sTotal
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => true]]]);
    }

    protected function _delete ($mixedId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aTrack = $this->_oModule->_oDb->getTimeTracks(['sample' => 'id', 'id' => (int)$mixedId]);
        if(!is_array($aTrack) || empty($aTrack))
            return false;

        $iObjectId = (int)$aTrack['object_id'];
        $iAuthorId = (int)$aTrack['author_id'];

        $bResult = parent::_delete($mixedId);
        if($bResult && ($oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iObjectId)) && $oTime->isEnabled())
            $oTime->putReport($iObjectId, $iAuthorId, $aTrack, true);

        $this->_oModule->spendBudgetByContentId($iObjectId, -$this->_oModule->getTrackBilled($aTrack));

        return $bResult;
    }

    protected function _getCellAuthorId($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'profile', 'data' => BxDolProfile::getData($mixedValue)];

        if(($oProfile = BxDolProfile::getInstanceMagic($mixedValue)) !== false)
            $mixedValue = $oProfile->getUnit();

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellObjectId($mixedValue, $sKey, $aField, $aRow)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sTitle = $aRow[$CNF['FIELD_TITLE']];
        if((int)$aField['chars_limit'] > 0)
            $sTitle = strmaxtextlen($sTitle, (int)$aField['chars_limit']);
        if($sTitle == '')
            $sTitle = _t('_sys_txt_no_title');

        $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . $mixedValue));
        
        if($this->_bIsApi)
            return ['type' => 'link', 'data' => [
                'text' => $aRow[$CNF['FIELD_TITLE']],
                'url' => bx_api_get_relative_url($sUrl)
            ]];
        
        return parent::_getCellDefault($this->_getEntryLink($sTitle, $sUrl, $aRow), $sKey, $aField, $aRow);
    }

    protected function _getCellValue($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_oModule->_oConfig->timeI2S($mixedValue), $sKey, $aField, $aRow);
    }

    /**
     * What hands added to or took from the timer's time, + or -: an entry entered by hand is manual as a whole,
     * a timer's one by its changes; empty when there are none.
     */
    protected function _getCellValueManual($mixedValue, $sKey, $aField, $aRow)
    {
        $iManual = (int)$aRow['value'] - (!empty($aRow['by_timer']) ? (int)($aRow['value_original'] ?? $aRow['value']) : 0);

        $sValue = $iManual != 0 ? ($iManual > 0 ? '+' : "\u{2212}") . $this->_oModule->_oConfig->timeI2S(abs($iManual)) : '';

        return parent::_getCellDefault($sValue, $sKey, $aField, $aRow);
    }

    protected function _getCellValueBilled($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault($this->_oModule->_oConfig->timeI2S($this->_oModule->getTrackBilled($aRow)), $sKey, $aField, $aRow);
    }

    protected function _getCellValueDate($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_bIsApi ? [
            'type' => 'time', 
            'data' => $mixedValue
        ] : parent::_getCellDefault($mixedValue ? bx_time_js($mixedValue, BX_FORMAT_DATE, true) : '', $sKey, $aField, $aRow);
    }

    protected function _getActionDelete($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if($this->_isAdministration())
            return '';

        return parent::_getActionDelete($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFcDefault()
    {
        return parent::_getFilterControls();
    }

    protected function _getFcDateSearch()
    {
        $sContent = $this->_getFilterDatePicker($this->_sFilter3Name, $this->_sFilter3Value);
        $sContent .= $this->_getFilterLabel('-');
        $sContent .= $this->_getFilterDatePicker($this->_sFilter4Name, $this->_sFilter4Value);
        $sContent .= $this->_getSearchInput();
        return $sContent;
    }

    protected function _getFilterOnChange()
    {
        return $this->_oModule->_oConfig->getJsObject('time') . '.onChangeFilter(this)';
    }

    protected function __getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getEntryLink($sTitle, $sUrl, $aRow)
    {
        return $this->_oTemplate->parseHtmlByName('title_link.html', [
            'href' => $sUrl,
            'title' => bx_html_attribute($sTitle),
            'content' => bx_process_output($sTitle),
            'target' => '_blank'
        ]);
    }

    /**
     * Own entries everywhere; others' only in the administration grids and only for their Billed time.
     */
    protected function _isAllowedEdit($aTrack)
    {
        //--- The entry comes by its id, so it has to be in the context the permission is checked for.
        if($this->_isContext() && !$this->_isTrackInContext($aTrack))
            return false;

        list($bEditLogged, $bEditBilled) = $this->_getEditRights($aTrack);
        if($bEditLogged)
            return true;

        return $this->_isAdministration() && $bEditBilled;
    }

    protected function _isTrackInContext($aTrack)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if(!$this->_iContextPid)
            return false;

        $aTask = $this->_oModule->_oDb->getContentInfoById((int)$aTrack['object_id']);

        return !empty($aTask) && is_array($aTask) && -(int)$aTask[$CNF['FIELD_ALLOW_VIEW_TO']] == $this->_iContextPid;
    }

    protected function _isCommon()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return in_array($this->_sObject, [$CNF['OBJECT_GRID_TIME_COMMON'], $CNF['OBJECT_GRID_TIME_CONTEXT_COMMON']]);
    }

    protected function _isAdministration()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return in_array($this->_sObject, [$CNF['OBJECT_GRID_TIME_ADMINISTRATION'], $CNF['OBJECT_GRID_TIME_CONTEXT_ADMINISTRATION']]);
    }

    protected function _isContext()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        return in_array($this->_sObject, [$CNF['OBJECT_GRID_TIME_CONTEXT_ADMINISTRATION'], $CNF['OBJECT_GRID_TIME_CONTEXT_COMMON']]);
    }

    protected function _getIds()
    {
        $aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId) 
                return false;

            $aIds = [$iId];
        }

        return $aIds;
    }
}

/** @} */
