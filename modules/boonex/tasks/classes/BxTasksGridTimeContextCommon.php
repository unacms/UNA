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

            $this->_oModule->spendBudgetByContentId($iObjectId, $iValue);

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
