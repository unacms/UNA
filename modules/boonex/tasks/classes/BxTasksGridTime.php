<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT 
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

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
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'calculate':
                $sResult = _t('_bx_tasks_grid_popup_title_tm_calculate');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
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

        $this->_oModule->spendBudgetByContentId($iObjectId, -$aTrack['value']);

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
            $isDisabled = true;

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
