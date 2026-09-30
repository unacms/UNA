<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Payment Payment
 * @ingroup     UnaModules
 * 
 * @{
 */


class BxPaymentGridPending extends BxBaseModPaymentGridOrders
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct ($aOptions, $oTemplate);

        $this->_sOrdersType = 'pending';
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'process':
                $sResult = _t($this->_sLangsPrefix . 'popup_title_ods_order_' . $this->_sOrdersType . '_process');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
    }

    public function performActionProcess()
    {
    	$aIds = bx_get('ids');
        if(!$aIds || !is_array($aIds)) {
            $iId = (int)bx_get('id');
            if(!$iId)
                return $this->_bIsApi ? [] : echoJson([]);

            $aIds = array($iId);
        }

        $iId = (int)$aIds[0];

    	$sAction = 'process';
        $sFormObject = $this->_oModule->_oConfig->getObject('form_pendings');
        $sFormDisplay = $this->_oModule->_oConfig->getObject('form_display_pendings_process');

        $oForm = BxDolForm::getObjectInstance($sFormObject, $sFormDisplay, $this->_oModule->_oTemplate);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction;

        $oForm->aInputs['id']['value'] = $iId;
        $oForm->aInputs['seller_id']['value'] = $this->_aQueryAppend['seller_id'];

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $iId = $oForm->getCleanValue('id');

            $this->_oModule->_oDb->updateOrderPending($iId, [
                'order' => $oForm->getCleanValue('order'),
                'error_code' => 0,
                'error_msg' => 'Manually processed'
            ]);

            if($this->_oModule->registerPayment($iId))
                $aRes = $this->_bIsApi ? [] : ['grid' => $this->getCode(false), 'blink' => $iId];
            else
                $aRes = ($sMsg = _t($this->_sLangsPrefix . 'err_cannot_perform')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : ['msg' => $sMsg];

            return $this->_bIsApi ? $aRes : echoJson($aRes);
        }

        if($this->_bIsApi)
            return $this->getFormBlockAPI($oForm, $sAction, $iId);

        $sKey = 'order_' . $this->_sOrdersType . '_process';
        $sId = $this->_oModule->_oConfig->getHtmlIds('pending', $sKey);
    	$sTitle = _t($this->_sLangsPrefix . 'popup_title_ods_' . $sKey);

        $sContent = BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $this->_oModule->_oTemplate->parseHtmlByName('order_pending_process.html', [
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        ]));

        echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getActionCancel ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = [])
    {
        if($this->_bIsApi)
            return array_merge($a, ['name' => $sKey, 'type' => 'callback', 'on_callback' => 'hide_row']);

        return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
    	if(empty($this->_aQueryAppend['seller_id']))
            return array();

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tt`.`seller_id`=?", $this->_aQueryAppend['seller_id']);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
