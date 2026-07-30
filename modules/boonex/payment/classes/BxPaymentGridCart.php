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


class BxPaymentGridCart extends BxBaseModPaymentGridCarts
{
    public function __construct ($aOptions, $oTemplate = false)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct ($aOptions, $oTemplate);

        $this->_bSelectAll = true;
    }
    
    public function getCodeAPI($bForceReturn = false)
    {
        $aData = parent::getCodeAPI($bForceReturn);
        $aData['settings']['field_id'] = 'id';
        foreach ($aData['data'] as &$aRow){
            $aRow['id'] = $aRow['checkbox']['data'];
            $aRow['title']['value'] = strip_tags($aRow['title']['value']);
            $aRow['price_single']['value'] = str_replace('&#36; ','$', $aRow['price_single']['value']);
            
        }
        return $aData;
    }

    public function performActionQuantitySub()
    {
        $sId = $this->_getItemId();
        list($iVendorId, $iModuleId, $iItemId, $iItemCount) = $this->_oModule->_oConfig->descriptorS2A($sId);

        if($iItemCount == 1)
            return echoJson([]);
        
        $aResult = $this->_oModule->getObjectCart()->serviceAddToCart($iVendorId, $iModuleId, $iItemId, -1);
        if($aResult['code'] != 0 && isset($aResult['message']))
            return echoJson(['msg' => $aResult['message']]);

        return echoJson(['grid' => $this->getCode(false), 'blink' => $sId]);
    }

    public function performActionQuantityAdd()
    {
        $sId = $this->_getItemId();
        list($iVendorId, $iModuleId, $iItemId, $iItemCount) = $this->_oModule->_oConfig->descriptorS2A($sId);

        $aResult = $this->_oModule->getObjectCart()->serviceAddToCart($iVendorId, $iModuleId, $iItemId, 1);
        if($aResult['code'] != 0 && isset($aResult['message']))
            return echoJson(['msg' => $aResult['message']]);

        return echoJson(['grid' => $this->getCode(false), 'blink' => $sId]);
    }

    public function performActionCheckout()
    {
        $aParams = array(
            'seller_id' => bx_process_input(bx_get('seller_id'), BX_DATA_INT), 
            'provider' => bx_process_input(bx_get('provider')), 
            'items' => bx_process_input(bx_get('ids'))
        );

        if(empty($aParams['seller_id']) || empty($aParams['provider']))
            return $this->_bIsApi ? [] : echoJson([]);

        if(empty($aParams['items']) || !is_array($aParams['items'])) 
            return ($sMsg = _t('_bx_payment_err_nothing_selected')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : echoJson(['msg' => $sMsg]);

        $oProvider = $this->_oModule->getObjectProvider($aParams['provider'], $aParams['seller_id']);
        if($oProvider !== false) {
            if(method_exists($oProvider, 'overwriteCheckoutParamsSingle') && ($aResults = $oProvider->overwriteCheckoutParamsSingle($aParams, $this)))
                return $this->_bIsApi ? $aResults : echoJson($aResults);

            if(method_exists($oProvider, 'getCheckoutParamsSingle'))
                $aParams = $oProvider->getCheckoutParamsSingle($aParams, $this);
        }

        if($this->_bIsApi) {
            $sItems = $this->_oModule->_oConfig->descriptorsA2S($aParams['items']);
            $sRedirect = $this->_oModule->_oConfig->urlEncode($this->_oModule->_oConfig->getUrl('URL_HISTORY'));

            return [
                'url' => '/api.php?r=' . $this->MODULE . '/initialize_checkout_api&params[]=' . implode('&params[]=', [BX_PAYMENT_TYPE_SINGLE, $aParams['seller_id'], $aParams['provider'], $sItems, $sRedirect])
            ];
        }
        else
            echoJson([
                'eval' => $this->_oModule->_oConfig->getJsObject('cart') . '.onCartCheckout(oData);', 
                'link' => bx_append_url_params($this->_oModule->_oConfig->getUrl('URL_CART_CHECKOUT'), $aParams)
            ]);
    }

    protected function _getCellTitle($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_bIsApi)
            $mixedValue = $this->_oModule->_oTemplate->displayLink('link', array(
                'href' => $aRow['url'],
                'title' => bx_html_attribute($aRow['title']),
                'content' => $aRow['title']
            ));

    	return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getCellPriceSingle($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(_t_format_currency_ext($mixedValue, ['sign' => $this->_sCurrencySign]), $sKey, $aField, $aRow);
    }

    protected function _getCellQuantity($mixedValue, $sKey, $aField, $aRow)
    {
        if(!$this->_bIsApi)
            $mixedValue = $this->_oModule->_oTemplate->parseHtmlByName('cart_quantity.html', [
                'sub' => $this->_getActionQuantity('sub', $aRow),
                'quantity' => $mixedValue,
                'add' => $this->_getActionQuantity('add', $aRow)
            ]);

        return parent::_getCellDefault($mixedValue, $sKey, $aField, $aRow);
    }

    protected function _getActionQuantitySub ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActionQuantityAdd ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActionQuantity($sAction, &$aRow)
    {
        $sAction = 'quantity_' . $sAction;
        $aAction = array_merge($this->_aOptions['actions_single'][$sAction], ['attr' => [
            'bx_grid_action_single' => $sAction,
            'bx_grid_action_data' => $aRow[$this->_aOptions['field_id']],
            'bx_grid_action_confirm' => $this->_aOptions['actions_single'][$sAction]['confirm'],
            'bx_grid_action_reset_paginate' => 0
        ]]);

        return $this->_getActionDefault('single', $sAction, $aAction, false, false, $aRow);
    }

    protected function _getActionCheckout ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        return '';
    }

    protected function _getActions ($sType, $sActionData = false, $isSmall = false, $isDisabled = false, $isPermanentState = false, $aRow = array())
    {
    	$CNF = &$this->_oModule->_oConfig->CNF;

    	$sActions = '';
    	if($sType == 'bulk' && !empty($this->_aQueryAppend['seller_id'])) {
            $sActionName = 'checkout';

            $iClientId = (int)$this->_aQueryAppend['client_id'];
            $iSellerId = (int)$this->_aQueryAppend['seller_id'];
            $aCartInfo = $this->_oModule->getObjectCart()->getInfo(BX_PAYMENT_TYPE_SINGLE, $iClientId, $iSellerId);

            $bCreditsOnly = $this->_oModule->_oConfig->isCreditsOnly();

            $bPayForCredits = true;
            if(!empty($aCartInfo['items']) && is_array($aCartInfo['items']))
                foreach($aCartInfo['items'] as $aItem) {
                    $aModule = $this->_oModule->_oDb->getModuleById((int)$aItem['module_id']);
                    if($aModule['name'] != $CNF['MODULE_CREDITS']) {
                        $bPayForCredits = false;
                        break;
                    }
                }

            $aProviders = $this->_oModule->_oDb->getVendorInfoProvidersSingle($iSellerId);
            foreach($aProviders as $aProvider) {
                $bProviderCredits = $aProvider['name'] == $CNF['OBJECT_PP_CREDITS'];

                /*
                 * Hide all non-Credits payment providers when 'credits only' mode is enabled 
                 * and purchasing items aren't credits.
                 */
                if($bCreditsOnly && !$bProviderCredits && !$bPayForCredits)
                    continue;

                /*
                 * Hide Credits payment provider when paying for credits.
                 */
                if($bProviderCredits && $bPayForCredits)
                    continue;

                $sAction = $this->_getActionDefault($sType, $sActionName, array(
                    'title'=> _t('_bx_payment_grid_action_title_crt_checkout', _t($CNF['T']['TXT_CART_PROVIDER'] . $aProvider['name'])),
                    'icon' => '',
                    'icon_only' => 0,
                    'confirm' => 0,
                    'attr' => array(
                        'bx_grid_action_' . $sType => $sActionName,
                        'bx_grid_action_append' => json_encode(array('provider' => $aProvider['name'])),
                        'bx_grid_action_confirm' => 0,
                        'bx_grid_action_reset_paginate' => 0,
                    )
                ), $isSmall, $isDisabled, $aRow);

                $oProvider = $this->_oModule->getObjectProvider($aProvider['name'], $iSellerId);
                if($oProvider !== false && method_exists($oProvider, 'getButtonSingle')) {
                    $aParams = array(
                        'sObjNameGrid' => $this->getObject(),
                        'aCartInfo' => $aCartInfo,
                        'sAction' => $sAction
                    );

                    if(!empty($aCartInfo['items_price']) && !empty($aCartInfo['items']) && is_array($aCartInfo['items'])) {
                        $aTitles = array();
                        foreach ($aCartInfo['items'] as $aItem)
                            $aTitles[] = $aItem['title'];

                        $aParams = array_merge($aParams, array(
                            'iAmount' => (int)round(100 * (float)$aCartInfo['items_price']),
                            'sItemTitle' => implode(', ', $aTitles)
                        ));
                    }

                    $mixedButton = $oProvider->getButtonSingle($iClientId, $iSellerId, $aParams);
                    if($mixedButton !== false)
                        $sAction = $mixedButton;
                }

                $sActions .= $sAction;
            }
    	}else{
           if (bx_is_api())
               return parent::_getActions ($sType, $sActionData, $isSmall, $isDisabled, $isPermanentState, $aRow);
        }

        
    	return $sActions . parent::_getActions ($sType, $sActionData, $isSmall, $isDisabled, $isPermanentState, $aRow);
    }

    protected function _getActionsAPI($sType)
    {
        if($sType != 'bulk' || empty($this->_aQueryAppend['seller_id']))
            return parent::_getActionsAPI($sType);

        $CNF = &$this->_oModule->_oConfig->CNF;

        $iClientId = (int)$this->_aQueryAppend['client_id'];
        $iSellerId = (int)$this->_aQueryAppend['seller_id'];
        $aCartInfo = $this->_oModule->getObjectCart()->getInfo(BX_PAYMENT_TYPE_SINGLE, $iClientId, $iSellerId);

        $bCreditsOnly = $this->_oModule->_oConfig->isCreditsOnly();

        $bPayForCredits = true;
        if(!empty($aCartInfo['items']) && is_array($aCartInfo['items']))
            foreach($aCartInfo['items'] as $aItem) {
                $aModule = $this->_oModule->_oDb->getModuleById((int)$aItem['module_id']);
                if($aModule['name'] != $CNF['MODULE_CREDITS']) {
                    $bPayForCredits = false;
                    break;
                }
            }

        $aActions = [];
        $aProviders = $this->_oModule->_oDb->getVendorInfoProvidersSingle($iSellerId);
        foreach($aProviders as $aProvider) {
            $bProviderCredits = $aProvider['name'] == $CNF['OBJECT_PP_CREDITS'];

            /*
             * Hide all non-Credits payment providers when 'credits only' mode is enabled 
             * and purchasing items aren't credits.
             */
            if($bCreditsOnly && !$bProviderCredits && !$bPayForCredits)
                continue;

            /*
             * Hide Credits payment provider when paying for credits.
             */
            if($bProviderCredits && $bPayForCredits)
                continue;

            $aActions[$aProvider['name']] = [
                'payment_type' => BX_PAYMENT_TYPE_SINGLE,
                'name' => $aProvider['name'],
                'title'=> _t('_bx_payment_grid_action_title_crt_checkout', _t($CNF['T']['TXT_CART_PROVIDER'] . $aProvider['name'])),
                'icon' => '',
                'icon_only' => 0,
                'confirm' => 0,
            ];
        }
        return $aActions;
    }    

    protected function _getDataArray($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        if(empty($this->_aQueryAppend['client_id']) || empty($this->_aQueryAppend['seller_id']))
            return array();

        $aCart = $this->_oCart->getInfo(BX_PAYMENT_TYPE_SINGLE, $this->_aQueryAppend['client_id'], $this->_aQueryAppend['seller_id']);
        if(empty($aCart) || empty($aCart['items']) || !is_array($aCart['items']))
            return array();

        $this->_aOptions['source'] = array();
        foreach($aCart['items'] as $aCartItem) {
            $this->_aOptions['source'][] = array_merge($aCartItem, [
                'descriptor' => $this->_oModule->_oConfig->descriptorA2S(array($aCartItem['author_id'], $aCartItem['module_id'], $aCartItem['id'], $aCartItem['quantity'])),
                'description' => strip_tags($aCartItem['description']),
                'currency_code' => $aCart['vendor_currency_code'],
                'currency_sign' => $aCart['vendor_currency_sign']
            ]);
        }

        return parent::_getDataArray($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);
    }

    protected function _delete($mixedId)
    {
    	list($iVendorId, $iModuleId, $iItemId) = $this->_oModule->_oConfig->descriptorS2A($mixedId);
    	if(!$this->_oModule->isSingleSeller() && (int)$iVendorId != (int)$this->_aQueryAppend['seller_id'])
            return false;

    	return $this->_oCart->serviceDeleteFromCart($iVendorId, $iModuleId, $iItemId);
    }

    protected function _getItemId()
    {
        if(($aIds = bx_get('ids')) && is_array($aIds)) 
            return array_shift($aIds);

        if(($sId = bx_get('id')))
            return $sId;

        return false;
    }
}

/** @} */
