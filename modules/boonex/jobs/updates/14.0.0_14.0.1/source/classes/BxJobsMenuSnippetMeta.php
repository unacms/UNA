<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Jobs Jobs
 * @ingroup     UnaModules
 *
 * @{
 */

class BxJobsMenuSnippetMeta extends BxBaseModGroupsMenuSnippetMeta
{
    public function __construct($aObject, $oTemplate = false)
    {
        $this->_sModule = 'bx_jobs';

        parent::__construct($aObject, $oTemplate);

        unset($this->_aConnectionToFunctionCheck['sys_profiles_friends']);
    }

    protected function _getMenuItemDateStart($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($this->_aContentInfo[$CNF['FIELD_DATE_START']])
            return $this->getUnitMetaItemText(bx_time_js($this->_aContentInfo[$CNF['FIELD_DATE_START']], BX_FORMAT_DATE_TIME, true));
        else
            return false;
    }
    
    protected function _getMenuItemDateEnd($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if ($this->_aContentInfo[$CNF['FIELD_DATE_END']])
            return $this->getUnitMetaItemText(bx_time_js($this->_aContentInfo[$CNF['FIELD_DATE_END']], BX_FORMAT_DATE_TIME, true));
        else
            return false;
    }

    protected function _getMenuItemBudget($aItem)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $sCurrencySign = BxDolPayments::getInstance()->getCurrencySign((int)$this->_aContentInfo[$CNF['FIELD_AUTHOR']]);
        
        $sResult = '';
        if(($sKey = $CNF['FIELD_PAY_TOTAL']) && !empty($this->_aContentInfo[$sKey]))
            $sResult .= _t('_bx_jobs_menu_item_title_sm_budget_total', _t_format_currency_ext((float)$this->_aContentInfo[$sKey], [
                'sign' => $sCurrencySign
            ]));

        if(($sKey = $CNF['FIELD_PAY_HOURLY']) && !empty($this->_aContentInfo[$sKey]))
            $sResult .= ($sResult ? ', ' : '') . _t('_bx_jobs_menu_item_title_sm_budget_hourly', _t_format_currency_ext((float)$this->_aContentInfo[$sKey], [
                'sign' => $sCurrencySign
            ]));

        if(!$sResult)
            $sResult = _t('_bx_jobs_menu_item_title_sm_budget_open');

        return $this->getUnitMetaItemText($sResult);
    }
}

/** @} */
