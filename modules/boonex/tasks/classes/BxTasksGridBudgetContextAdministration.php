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

class BxTasksGridBudgetContextAdministration extends BxBaseModGeneralGrid
{
    protected $_iLogged;
    protected $_iContextPid;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_tasks';

        parent::__construct ($aOptions, $oTemplate);

        $this->_iLogged = bx_get_logged_profile_id();

        if(($iContextPid = bx_get('context_pid')) !== false) 
            $this->setContextPid($iContextPid);
    }

    public function setContextPid($iContextPid)
    {
        $this->_iContextPid = (int)$iContextPid;
        $this->_aQueryAppend['context_pid'] = $this->_iContextPid;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&context_pid=' . $this->_iContextPid . '&id=' . $iId;
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'add':
                $sResult = _t('_bx_tasks_grid_popup_title_bdt_add');
                break;

            case 'edit':
                $sResult = _t('_bx_tasks_grid_popup_title_bdt_edit');
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
            $aValsToAdd = [
                'context_id' => $this->_iContextPid,
                'profile_id' => $this->_iLogged,
                'date' => $iNow
            ];

            $iTrackId = $oForm->insert($aValsToAdd);
            if(!$iTrackId)
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            $this->_oModule->_oDb->insertBudget($this->_iContextPid, 60 * $oForm->getCleanValue('value'));

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iTrackId]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('budget_popup'), _t('_bx_tasks_grid_popup_title_bdt_add'), $this->_oModule->_oTemplate->parseHtmlByName('popup_budget.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    public function performActionEdit()
    {
        $sAction = 'edit';

        $iTrackId = $this->_getId();
        $aTrack = $this->_oModule->_oDb->getBudgetTracks(['sample' => 'id', 'id' => $iTrackId]);
        if(empty($aTrack) || !is_array($aTrack) || (int)$aTrack['context_id'] !== $this->_iContextPid)
            return $this->_getActionResult([]);

        $oForm = $this->_getFormObject($sAction, $aTrack);
        $oForm->initChecker($aTrack);
        if($oForm->isSubmittedAndValid()) {
            if(!$oForm->update($iTrackId))
                return $this->_getActionResult(['msg' => _t('_bx_tasks_txt_err_cannot_perform_action')]);

            $this->_oModule->_oDb->updateBudgetTotal($this->_iContextPid, 60 * ($oForm->getCleanValue('value') - (int)$aTrack['value']));

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => $iTrackId]);    
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iTrackId);

        $sContent = BxTemplFunctions::getInstance()->popupBox($this->_oModule->_oConfig->getHtmlIds('budget_popup'), _t('_bx_tasks_grid_popup_title_bdt_edit'), $this->_oModule->_oTemplate->parseHtmlByName('popup_budget.html', [
            'form_id' => $oForm->getId(),
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        return echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _delete ($mixedId)
    {
        $aTrack = $this->_oModule->_oDb->getBudgetTracks(['sample' => 'id', 'id' => (int)$mixedId]);
        if(empty($aTrack) || !is_array($aTrack) || (int)$aTrack['context_id'] !== $this->_iContextPid)
            return false;

        $bResult = parent::_delete($mixedId);
        if($bResult)
            $this->_oModule->_oDb->updateBudgetTotal($this->_iContextPid, -(int)$aTrack['value']);

        return $bResult;
    }

    protected function _getCellProfileId($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'profile', 'data' => BxDolProfile::getData($mixedValue)];

        return parent::_getCellDefault(BxDolProfile::getInstanceMagic($mixedValue)->getUnit(), $sKey, $aField, $aRow);
    }

    protected function _getCellValue($mixedValue, $sKey, $aField, $aRow)
    {
        if (!$this->_bIsApi)
            $mixedValue = $this->_oModule->_oConfig->timeI2S(60 * (int)$mixedValue);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDate($mixedValue, $sKey, $aField, $aRow)
    {
        if ($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];

        return parent::_getCellDefault(bx_time_js($mixedValue), $sKey, $aField, $aRow);
    }

    protected function _getFormObject($sAction, $aTrack = [])
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $bActionEdit = $sAction == 'edit';

        $bTrack = !empty($aTrack) && is_array($aTrack);

        $aActionParams = [
            'o' => $this->_sObject, 
            'a' => $sAction,
            'context_pid' => $this->_iContextPid
        ];
        if($bActionEdit && $bTrack)
            $aActionParams['id'] = (int)$aTrack['id'];

        $sForm = $CNF['OBJECT_FORM_BUDGET_DISPLAY_' . strtoupper($sAction)];
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_BUDGET'], $sForm);
        $oForm->setId($sForm);
        $oForm->setName($sForm);
    	$oForm->setAction(BX_DOL_URL_ROOT . bx_append_url_params('grid.php', $aActionParams));

        return $oForm;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `context_id`=?", $this->_iContextPid);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _getId()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds))
            return reset($aIds);

        if(($iId = bx_get('id')) !== false) 
            return (int)$iId;

        return false;
    }
}

/** @} */
