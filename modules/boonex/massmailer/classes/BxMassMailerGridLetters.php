<?php defined('BX_DOL') or die('hack attempt');
/**
* Copyright (c) UNA, Inc - https://una.io
* MIT License - https://opensource.org/licenses/MIT
*
* @defgroup    MassMailer Mass Mailer
* @ingroup     UnaModules
* 
* @{
*/

class BxMassMailerGridLetters extends BxTemplGrid
{
    protected $_sModule;
    protected $_oModule;

    protected $_iContentId;

    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->_sModule = 'bx_massmailer';
        $this->_oModule = BxDolModule::getInstance($this->_sModule);

        parent::__construct ($aOptions, $oTemplate);

        $this->_iContentId = 0;
        if(($iContentId = bx_get('content_id')) !== false) 
            $this->setContentId($iContentId);
    }

    public function setContentId($iContentId)
    {
        $this->_iContentId = (int)$iContentId;
        $this->_aQueryAppend['content_id'] = $this->_iContentId;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&content_id=' . $this->_iContentId . '&id=' . $iId;
    }

    protected function _getCellDateSent($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDate($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDateSeen($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDate($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDateClick($mixedValue, $sKey, $aField, $aRow)
    {
        return $this->_getCellDate($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellDate($mixedValue, $sKey, $aField, $aRow)
    {
        if($this->_bIsApi)
            return ['type' => 'time', 'data' => $mixedValue];

        return parent::_getCellDefault($mixedValue != '0' ? bx_time_js($mixedValue, BX_FORMAT_DATE, true) : _t('_bx_massmailer_txt_never_sent'), $sKey, $aField, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `campaign_id`=?", $this->_iContentId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
