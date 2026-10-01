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


class BxPaymentGridProcessed extends BxBaseModPaymentGridOrders
{
    public function __construct ($aOptions, $oTemplate = false)
    {
        $this->MODULE = 'bx_payment';

        parent::__construct ($aOptions, $oTemplate);

        $this->_sOrdersType = 'processed';

        $this->_sJsObject = $this->_oModule->_oConfig->getJsObject('processed');
    }

    public function getFormBlockTitleAPI($sAction, $iId = 0)
    {
        $sResult = '';

        switch($sAction) {
            case 'add':
                $sResult = _t($this->_sLangsPrefix . 'popup_title_ods_order_' . $this->_sOrdersType . '_add');
                break;
        }

        return $sResult;
    }

    public function getFormCallBackUrlAPI($sAction, $iId = 0)
    {
         return '/api.php?r=system/perfom_action_api/TemplServiceGrid/&params[]=&o=' . $this->_sObject . '&a=' . $sAction . '&id=' . $iId;
    }

    public function performActionAdd()
    {
        $sType = BX_PAYMENT_TYPE_SINGLE;
        $sAction = 'add';
        $sModule = $this->_oModule->_oConfig->getName();
        $sJsObject = $this->_oModule->_oConfig->getJsObject('processed');

        $sFormObject = $this->_oModule->_oConfig->getObject('form_processed');
        $sFormDisplay = $this->_oModule->_oConfig->getObject('form_display_processed_add');

        $oForm = BxDolForm::getObjectInstance($sFormObject, $sFormDisplay, $this->_oModule->_oTemplate);
        $oForm->aFormAttrs['action'] = BX_DOL_URL_ROOT . 'grid.php?o=' . $this->_sObject . '&a=' . $sAction;

        $oForm->aInputs['seller_id']['value'] = $this->_aQueryAppend['seller_id'];

        $oForm->aInputs['client_id']['attrs'] = array(
            'id' => $this->_oModule->_oConfig->getHtmlIds('processed', 'order_processed_client_id'),
        );

        $oForm->aInputs['client']['attrs'] = array(
            'id' => $this->_oModule->_oConfig->getHtmlIds('processed', 'order_processed_client')			
        );

        $oForm->aInputs['client']['ajax_get_suggestions'] = BX_DOL_URL_ROOT . 'modules/?r=' . $this->_oModule->_oConfig->getUri() . '/get_clients';
        if($this->_bIsApi)
            $oForm->aInputs['client']['ajax_get_suggestions'] = $sModule . "/get_clients&params[]=";

        $oForm->aInputs['client']['custom'] = array(
            'only_once' => true,
            'on_select' => "function(oObject){{$sJsObject}.showPopup(oObject);}"
        );

        $oForm->aInputs['module_id']['attrs'] = array(
            'onchange' => 'javascript:' . $sJsObject . '.selectModule(this);'
        );
        $oForm->aInputs['module_id']['values'] = array(
            array('key' => '0', 'value' => _t('_Select_one'))
        );

        $aModules = $this->_oModule->_oDb->getModules();
        foreach($aModules as $aModule)
           $oForm->aInputs['module_id']['values'][] = ['key' => $aModule['id'], 'value' => $aModule['title']];

        if($this->_bIsApi)
            $oForm->aInputs['module_id']['request_url'] = '/api.php?r=' . $sModule . "/get_items&params[]=" . $sType . "&params[]=";

        $oForm->aInputs['items']['content'] = $this->_oModule->_oTemplate->displayItems($this->_aQueryAppend['seller_id'], $sType);

        $oForm->initChecker();
        if($oForm->isSubmittedAndValid()) {
            $sFormMethod = $oForm->aFormAttrs['method'];

            $aItemIds = $oForm->getSubmittedValue('items', $sFormMethod);
            if($this->_bIsApi && is_string($aItemIds))
                $aItemIds = explode(',', $aItemIds);
            if(empty($aItemIds) || !is_array($aItemIds))
                return ($sMsg = $this->_sLangsPrefix . 'err_empty_items') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : echoJson(['msg' => $sMsg]);

            $aItems = [];
            $sPriceKey = $this->_oModule->_oConfig->getKey('KEY_ARRAY_PRICE_SINGLE');
            foreach($aItemIds as $iItemId) {
                $iItemId = (int)$iItemId;
                $fItemPrice = (float)$oForm->getSubmittedValue('item-price-' . $iItemId, $sFormMethod);
                $iItemQuantity = (int)$oForm->getSubmittedValue('item-quantity-' . $iItemId, $sFormMethod);

                if($iItemQuantity <= 0)
                    return ($sMsg = $this->_sLangsPrefix . 'err_wrong_quantity') && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : echoJson(['msg' => $sMsg]);

                $aItems[$iItemId] = [
                    'id' => $iItemId, 
                     $sPriceKey => $fItemPrice, 
                    'quantity' => $iItemQuantity
                ];
            }

            $mixedResult = $this->_oModule->getObjectOrders()->addOrder([
                'client_id' => $oForm->getCleanValue('client_id'),
                'seller_id' => $oForm->getCleanValue('seller_id'),
                'provider' => 'manual',
                'type' => $sType,
                'order' => $oForm->getCleanValue('order'),
                'error_code' => 0,
                'error_msg' => 'Manually processed',        		
                'module_id' => $oForm->getCleanValue('module_id'),
                'items' => array_values($aItems)
            ]);
            if(is_array($mixedResult))
                return $this->_bIsApi ? [bx_api_get_msg($mixedResult['msg'])] : echoJson($mixedResult);

            $iPendingId = (int)$mixedResult;
            if(!$this->_oModule->registerPayment($iPendingId))
                return ($sMsg = _t($this->_sLangsPrefix . 'err_cannot_perform')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : echoJson(['msg' => $sMsg]);

            $aOrders = $this->_oModule->_oDb->getOrderProcessed(['type' => 'pending_id', 'pending_id' => $iPendingId, 'with_key' => 'id']);
            foreach($aOrders as $iOrder => $aOrder)
                if((float)$aOrder['amount'] != ($fAmount = $aItems[$aOrder['item_id']][$sPriceKey]))
                    $this->_oModule->_oDb->updateOrderProcessed($iOrder, ['amount' => $fAmount]);

            return $this->_bIsApi ? [] : echoJson(['grid' => $this->getCode(false), 'blink' => array_keys($aOrders)]);
        }

        if($this->_bIsApi)
            return [
                bx_api_get_block('payment_order_add', $oForm->getCodeAPI(), [
                    'ext' => [
                        'name' => $this->_oModule->getName(), 
                        'title' => $this->getFormBlockTitleAPI($sAction),
                        'request' => ['url' => $this->getFormCallBackUrlAPI($sAction), 'immutable' => true]]
                    ]
                )
            ];

        $sKey = 'order_' . $this->_sOrdersType . '_add';
        $sId = $this->_oModule->_oConfig->getHtmlIds('processed', $sKey);
        $sTitle = _t($this->_sLangsPrefix . 'popup_title_ods_' . $sKey);

        $sContent = BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $this->_oModule->_oTemplate->parseHtmlByName('order_processed_add.html', array(
            'js_object' => $sJsObject,
            'form_id' => $oForm->aFormAttrs['id'],
            'form' => $oForm->getCode(true),
            'object' => $this->_sObject,
            'action' => $sAction
        )));

        echoJson(['popup' => ['html' => $sContent, 'options' => ['closeOnOuterClick' => false]]]);
    }

    protected function _getActionCancel ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if(!empty($aRow['seller_id']) && $aRow['seller_id'] != bx_get_logged_profile_id())
            return '';

        if($this->_bIsApi)
            return array_merge($a, ['name' => $sKey, 'type' => 'callback', 'on_callback' => 'hide_row']);

        return $this->_getActionDefault($sType, $sKey, $a, $isSmall, $isDisabled, $aRow);
    }

    protected function _getFilterClients()
    {
        $aIds = $this->_oModule->_oDb->getOrderProcessed(array('type' => 'clients', 'seller_id' => $this->_aQueryAppend['seller_id']));

        $aValues = array();
        foreach($aIds as $iId)
            if(!empty($iId) && ($oClient = BxDolProfile::getInstanceMagic($iId)) !== false)
                $aValues[] = array('key' => $iId, 'value' => $oClient->getDisplayName());

        $this->_oModule->_oConfig->sortByColumn('value', $aValues);

        return $this->_getFilterSelectAll('client', array(
            'values' => array_merge(array(
                array('key' => '', 'value' => _t('_bx_payment_txt_all_clients'))
            ), $aValues)
        ));
    }

    protected function _getFilterAuthors()
    {
        $aIds = $this->_oModule->_oDb->getOrderProcessed(array('type' => 'authors', 'seller_id' => $this->_aQueryAppend['seller_id']));

        $aValues = array();
        foreach($aIds as $iId)
            if(!empty($iId) && ($oClient = BxDolProfile::getInstanceMagic($iId)) !== false)
                $aValues[] = array('key' => $iId, 'value' => $oClient->getDisplayName());

        $this->_oModule->_oConfig->sortByColumn('value', $aValues);

        return $this->_getFilterSelectAll('author', array(
            'values' => array_merge(array(
                array('key' => '', 'value' => _t('_bx_payment_txt_all_authors'))
            ), $aValues)
        ));
    }

    protected function _getFilterModules()
    {
        $aModules = $this->_oModule->_oDb->getModules();
        
        $aValues = array();
        foreach($aModules as $aModule) {
            $sLangKey = '_' . $aModule['name'];
            $sLangValue = _t($sLangKey);

            $aValues[] = array('key' => $aModule['id'], 'value' => $sLangKey != $sLangValue ? $sLangValue : $aModule['title']);
        }

        $this->_oModule->_oConfig->sortByColumn('value', $aValues);

        return $this->_getFilterSelectAll('module', array(
            'js_onchange' => 'onChangeFilterModule(this, ' . $this->_aQueryAppend['seller_id'] . ')',
            'values' => array_merge(array(
                array('key' => '', 'value' => _t('_bx_payment_txt_all_modules'))
            ), $aValues)
        ));
    }

    protected function _getFilterItems()
    {
        return $this->_getFilterSelectAll('item', array(
            'attrs' => array('disabled' => 'disabled'),
            'values' => array(
                array('key' => '', 'value' => _t('_bx_payment_txt_all_items'))
            )
        ));
    }

    protected function _getFilterControls ()
    {
        parent::_getFilterControls();

        $sResult = $this->_getFilterClients();
        if($this->_bSingleSeller && $this->_aQueryAppend['seller_id'] == $this->_iSingleSeller)
            $sResult .= $this->_getFilterAuthors();
        $sResult .= $this->_getFilterModules() . $this->_getFilterItems() . $this->_getSearchInput();

        return $sResult;
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
    	if(empty($this->_aQueryAppend['seller_id']))
            return array();

        $sParamsDivider = $this->_oModule->_oConfig->getDivider('DIVIDER_GRID_FILTERS');

        $iClient = $iAuthor = $iModule = $iItem = 0;
        if(strpos($sFilter, $sParamsDivider) !== false) {
            $aFilters = explode($sParamsDivider, $sFilter);
            if($this->_bSingleSeller && $this->_aQueryAppend['seller_id'] = $this->_iSingleSeller)
                list($iClient, $iAuthor, $iModule, $iItem, $sFilter) = $aFilters;
            else
                list($iClient, $iModule, $iItem, $sFilter) = $aFilters;
        }

        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND (`tt`.`seller_id`=? OR `tt`.`author_id`=?)", $this->_aQueryAppend['seller_id'], $this->_aQueryAppend['seller_id']);

        $iClient = (int)$iClient;
        if($iClient != 0)
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tt`.`client_id`=?", $iClient);

        $iAuthor = (int)$iAuthor;
        if($iAuthor != 0)
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tt`.`author_id`=?", $iAuthor);

        $iModule = (int)$iModule;
        if($iModule != 0)
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tt`.`module_id`=?", $iModule);

        $iItem = (int)$iItem;
        if($iItem != 0)
            $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString(" AND `tt`.`item_id`=?", $iItem);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }
}

/** @} */
