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

class BxPaymentTemplate extends BxBaseModPaymentTemplate
{
    protected $_sLangsPrefix;

    function __construct(&$oConfig, &$oDb)
    {
    	$this->MODULE = 'bx_payment';

        parent::__construct($oConfig, $oDb);

        $this->_sLangsPrefix = $this->_oConfig->getPrefix('langs');
    }

    public function addJsCssOrders()
    {
    	$this->addJs(array(
            'jquery-ui/jquery-ui.min.js',
            'jquery.form.min.js', 
            'jquery.anim.js', 
            'jquery.webForms.js',
            'orders.js'
    	));
    	$this->addCss(array('orders.css'));
    }

    public function addJsCssSubscriptions()
    {
        $this->addJs(array('jquery.form.min.js', 'jquery.anim.js', 'jquery.webForms.js', 'main.js', 'subscriptions.js'));
        $this->addCss(array('orders.css', 'subscriptions.css'));
    }

    public function addJsCssCart($sType = '', $iVendorId = 0)
    {
    	$this->addJsTranslation(array('_bx_payment_err_nothing_selected'));
    	$this->addJs(array('jquery.anim.js', 'main.js', 'cart.js'));
    	$this->addCss(array('orders.css', 'cart.css'));

    	$oModule = $this->getModule();
    	if(!empty($iVendorId)) {
            $sMethod = 'getVendorInfoProviders' . bx_gen_method_name($sType);
            $aProviders = $this->_oDb->$sMethod($iVendorId);
            foreach($aProviders as $sProvider => $aProvider)
                $oModule->getObjectProvider($sProvider, $iVendorId)->addJsCss();
    	}
    }

    public function addJsCssInvoices()
    {
    	$this->addCss(array('invoices.css'));
    }

    public function displayBlockCheckoutOffline($oBuyer, $oSeller, $aData)
    {
        $CNF = &$this->_oConfig->CNF;

        $sTxtQt = _t('_bx_payment_txt_checkout_qt');

        $aTmplVarsItems = array();
        foreach($aData['items'] as $iIndex => $aItem)
            $aTmplVarsItems[] = array(
                'item_index' => $iIndex + 1,
                'item_title' => $aItem['title'],
                'item_quantity' => $aItem['quantity'] . $sTxtQt
            );

        $this->addCss(array('checkout.css'));
        return $this->parseHtmlByName('checkout_offline.html', array(
            'message' => _t('_bx_payment_txt_checkout_for', $oSeller->getDisplayName()),
            'bx_repeat:items' => $aTmplVarsItems,
            'amount' => $aData['currency']['sign'] . sprintf("%.2f", (float)($aData['amount'])),
            'redirect_url' => $aData['return_url']
        ));
    }

    public function displayCartJs($sType = '', $iVendorId = 0)
    {
        $this->addJsCssCart($sType, $iVendorId);
        return $this->displayJsCode('cart');
    }

    public function displayAddToCartJs($iVendorId, $iModuleId, $iItemId, $iItemCount, $bNeedRedirect = false, $aCustom = array())
    {
        $sJsCode = $this->displayCartJs(BX_PAYMENT_TYPE_SINGLE, $iVendorId);
        $sJsMethod = $this->parseHtmlByName('add_to_cart_js.html', array(
            'js_object' => $this->_oConfig->getJsObject('cart'),
            'vendor_id' => $iVendorId,
            'module_id' => $iModuleId,
            'item_id' => $iItemId,
            'item_count' => $iItemCount,
            'need_redirect' => (int)$bNeedRedirect,
            'custom' => !empty($aCustom) && is_array($aCustom) ? base64_encode(json_encode($aCustom)) : ''
        ));

        return array($sJsCode, $sJsMethod);
    }

    public function displayAddToCartLink($iVendorId, $iModuleId, $iItemId, $iItemCount, $bNeedRedirect = false, $aCustom = array())
    {
        $this->addJsCssCart(BX_PAYMENT_TYPE_SINGLE, $iVendorId);
        return $this->parseHtmlByName('add_to_cart.html', array(
            'js_object' => $this->_oConfig->getJsObject('cart'),
            'js_content' => $this->displayJsCode('cart'),
            'txt_add_to_cart' => _t($this->_sLangsPrefix . 'txt_add_to_cart'),
            'vendor_id' => $iVendorId,
            'module_id' => $iModuleId,
            'item_id' => $iItemId,
            'item_count' => $iItemCount,
            'need_redirect' => (int)$bNeedRedirect,
            'custom' => !empty($aCustom) && is_array($aCustom) ? base64_encode(json_encode($aCustom)) : ''
        ));
    }

    public function displaySubscribeJs($iVendorId, $sVendorProvider, $iModuleId, $iItemId, $iItemCount = 1, $sRedirect = '', $aCustom = array())
    {
        return $this->displaySubscribeJsWithAddons($iVendorId, $sVendorProvider, $iModuleId, $iItemId, $iItemCount, '', $sRedirect, $aCustom);
    }

    public function displaySubscribeJsWithAddons($iVendorId, $sVendorProvider, $iModuleId, $iItemId, $iItemCount = 1, $sItemAddons = '', $sRedirect = '', $aCustom = array())
    {
        $aSellerProviders = $this->_oDb->getVendorInfoProvidersRecurring($iVendorId);
        if(empty($sVendorProvider) && count($aSellerProviders) == 1) {
            $aCartItem = array($iVendorId, $iModuleId, $iItemId, $iItemCount, $sItemAddons);

            $this->addJsCssCart(BX_PAYMENT_TYPE_RECURRING, $iVendorId);
            return $this->getModule()->getProviderButtonJs($aCartItem, array_shift($aSellerProviders), $sRedirect, $aCustom);
        }

        return array(
            $this->displayCartJs(BX_PAYMENT_TYPE_RECURRING, $iVendorId),
            $this->parseHtmlByName('subscribe_js.html', array(
                'js_object' => $this->_oConfig->getJsObject('cart'),
                'vendor_id' => $iVendorId,
                'vendor_provider' => $sVendorProvider,
                'module_id' => $iModuleId,
                'item_id' => $iItemId,
                'item_count' => $iItemCount,
                'redirect' => !empty($sRedirect) ? $sRedirect : '',
                'custom' => !empty($aCustom) && is_array($aCustom) ? base64_encode(json_encode($aCustom)) : ''
            ))
        );
    }

    public function displaySubscribeLink($iVendorId, $sVendorProvider, $iModuleId, $iItemId, $iItemCount = 1, $sRedirect = '', $aCustom = array())
    {
        $this->addJsCssCart(BX_PAYMENT_TYPE_RECURRING, $iVendorId);
        return $this->parseHtmlByName('subscribe.html', array(
            'js_object' => $this->_oConfig->getJsObject('cart'),
            'js_content' => $this->displayJsCode('cart'),
            'txt_add_to_cart' => _t($this->_sLangsPrefix . 'txt_subscribe'),
            'vendor_id' => $iVendorId,
            'vendor_provider' => $sVendorProvider,
            'module_id' => $iModuleId,
            'item_id' => $iItemId,
            'item_count' => $iItemCount,
            'redirect' => !empty($sRedirect) ? $sRedirect : '',
            'custom' => !empty($aCustom) && is_array($aCustom) ? base64_encode(json_encode($aCustom)) : ''
        ));
    }

    public function displaySubscriptionGetDetails($iId)
    {
    	return $this->_displaySubscriptionData('get_details', $iId);
    }

    public function displaySubscriptionChangeDetails($iId)
    {
    	return $this->_displaySubscriptionData('change_details', $iId);
    }

    public function displaySubscriptionGetBilling($iId)
    {
    	return $this->_displaySubscriptionData('get_billing', $iId);
    }

    public function displaySubscriptionChangeBilling($iId)
    {
    	return $this->_displaySubscriptionData('change_billing', $iId);
    }

    public function displayBlockCarts($iClientId)
    {
    	$oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_carts'));
        if(!$oGrid)
            return MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $oGrid->addQueryParam('client_id', $iClientId);
        
        if($this->_bIsApi)
            return $oGrid->getCodeAPI();

        $this->addJsCssCart(BX_PAYMENT_TYPE_SINGLE);
        return $this->displayJsCode('cart') . $oGrid->getCode();
    }

    public function displayBlockCart($iClientId, $iSellerId = 0)
    {
    	$oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_cart'));
        if(!$oGrid || empty($iSellerId))
            return MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $oGrid->addQueryParam('client_id', $iClientId);
        $oGrid->addQueryParam('seller_id', $iSellerId);

        if($this->_bIsApi)
            return $oGrid->getCodeAPI();

        $this->addJsCssCart(BX_PAYMENT_TYPE_SINGLE, $iSellerId);
        return $this->displayJsCode('cart') . $oGrid->getCode();
    }

    public function displayBlockHistory($iClientId, $iSellerId)
    {
        return $this->_displayBlockHistory('grid_history', $iClientId, $iSellerId);
    }

    public function displayBlockSbsListMy($iClientId)
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_sbs_list_my'), $this->getModule()->_oTemplate);
        if(!$oGrid || empty($iClientId))
            return $this->_bIsApi ? false : MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $oGrid->addQueryParam('client_id', $iClientId);

        if($this->_bIsApi)
            return $oGrid->getCodeAPI(true);

        $this->addJsCssSubscriptions();
        return $this->displayJsCode(BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION) . $oGrid->getCode();
    }

    public function displayBlockSbsListAll()
    {
        $oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject('grid_sbs_list_all'), $this->getModule()->_oTemplate);
        if(!$oGrid)
            return $this->_bIsApi ? false : MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        if($this->_bIsApi)
            return $oGrid->getCodeAPI(true);

        $this->addJsCssSubscriptions();
        return $this->displayJsCode(BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION) . $oGrid->getCode();
    }

    public function displayBlockSbsHistory($iClientId)
    {
        return $this->_displayBlockHistory('grid_sbs_history', $iClientId);
    }

    public function displayBlockSbsDetails($iClientId)
    {
        return 'Details would be here';
    }

    public function displayBlockOrders($sType, $iSellerId)
    {
        $sGrid = $this->_oConfig->getObject('grid_' . $sType);
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid || empty($iSellerId))
            return '';

        $oGrid->addQueryParam('seller_id', $iSellerId);

        if($this->_bIsApi)
            return $oGrid->getCodeAPI();

        $this->addJsCssOrders();
        return $this->displayJsCode($sType, [
            'sObjNameGrid' => $sGrid,
            'sParamsDivider' => $this->_oConfig->getDivider('DIVIDER_GRID_FILTERS'),
            'sTextSearchInput' => _t('_sys_grid_search')
        ]) . $oGrid->getCode();
    }

    public function displayOrder($sType, $iId)
    {
        $sMethodName = 'getOrder' . bx_gen_method_name($sType);
        $aOrder = $this->_oDb->$sMethodName(array('type' => 'id', 'id' => $iId));

        if($this->_bIsApi)
            return $this->displayOrderAPI($sType, $aOrder);

        $oModule = $this->getModule();
        $aSeller = $oModule->getVendorInfo((int)$aOrder['seller_id']);
        $aClient = $oModule->getProfileInfo((int)$aOrder['client_id']);

        if(in_array($sType, [BX_PAYMENT_ORDERS_TYPE_PENDING, BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION]))
            $aItems = $this->_oConfig->descriptorsM2A($aOrder['items']);
        else
            $aItems = $this->_oConfig->descriptorsM2A($this->_oConfig->descriptorA2S([$aOrder['seller_id'], $aOrder['module_id'], $aOrder['item_id'], $aOrder['item_count']]));

        $aTmplVarsLicense = array();
        if(in_array($sType, array(BX_PAYMENT_ORDERS_TYPE_PROCESSED, BX_PAYMENT_ORDERS_TYPE_HISTORY)))
            $aTmplVarsLicense = array(
                'txt_license' => _t($this->_sLangsPrefix . 'txt_license'),
                'license' => $aOrder['license']
            );

        $bTmplVarsShowSlrAtr = !empty($aOrder['author_id']) && $aOrder['seller_id'] != $aOrder['author_id'];

        $aTmplVarsAuthor = array();
        if($bTmplVarsShowSlrAtr) {
            $aAuthor = $oModule->getProfileInfo((int)$aOrder['author_id']);

            $aTmplVarsAuthor = array(
                'txt_author' => _t($this->_sLangsPrefix . 'txt_author'),
                'author_name' => $aAuthor['name'],
                'author_url' => $aAuthor['link'],
            );
        }

        $aTmplVarsSeller = array(
            'txt_seller' => _t($this->_sLangsPrefix . 'txt_seller'),
            'bx_if:show_link' => array(
                'condition' => !empty($aSeller['link']),
                'content' => array(
                    'seller_name' => $aSeller['name'],
                    'seller_url' => $aSeller['link'],
                )
            ),
            'bx_if:show_text' => array(
                'condition' => empty($aSeller['link']),
                'content' => array(
                    'seller_name' => $aSeller['name']
                )
            ),
        );

        $aTmplVarsCustom = [];
        if(in_array($sType, [BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION])) {
            $sOrder = $aOrder['order'];
            if($oModule->_isModerator() && ($aItem = reset($aItems))) {
                $aItemModule = bx_srv((int)$aItem['module_id'], 'get_payment_data');
                if(($sUrlBrowse = $aItemModule['url_browse_order_administration'] ?? false)) 
                    $sOrder = $this->displayLink('link', [
                        'href' => bx_replace_markers($sUrlBrowse, [
                            'order' => $sOrder
                        ]),
                        'title' => bx_html_attribute($sOrder),
                        'content' => $sOrder
                    ]);
            }

            $aTmplVarsCustom = [
                'txt_order' => _t($this->_sLangsPrefix . 'txt_subscription'),
                'order' => $sOrder,
                'txt_customer_id' => _t($this->_sLangsPrefix . 'txt_customer_id'),
                'customer_id' => $aOrder['customer_id'] ?? '',
                'bx_if:show_deleted' => [
                    'condition' => false,
                    'content' => [
                        'txt_deleted' => _t($this->_sLangsPrefix . 'txt_deleted'),
                        'txt_deleted_reason' => _t($this->_sLangsPrefix . 'txt_deleted_reason'),
                        'deleted' => 0,
                        'deleted_reason' => ''
                    ]
                ]
            ];

            if(($sK = 'deleted') && isset($aOrder[$sK]) && $aOrder[$sK]) {
                $aTmplVarsCustom['bx_if:show_deleted']['condition'] = true;
                $aTmplVarsCustom['bx_if:show_deleted']['content'] = array_merge($aTmplVarsCustom['bx_if:show_deleted']['content'], [
                    'deleted' => bx_time_js($aOrder[$sK], BX_FORMAT_DATE_TIME, true),
                    'deleted_reason' => $aOrder['deleted_reason'] ?? ''
                ]);
            }
        }

        $aResult = array_merge(array(
            'txt_client' => _t($this->_sLangsPrefix . 'txt_client'),
            'txt_order' => _t($this->_sLangsPrefix . 'txt_order'),
            'txt_processed_with' => _t($this->_sLangsPrefix . 'txt_processed_with'),
            'txt_message' => _t($this->_sLangsPrefix . 'txt_message'),
            'txt_date' => _t($this->_sLangsPrefix . 'txt_date'),
            'txt_products' => _t($this->_sLangsPrefix . 'txt_products'),
            'client_name' => $aClient['name'],
            'client_url' => $aClient['link'],
            'bx_if:show_seller' => array(
                'condition' => $bTmplVarsShowSlrAtr,
                'content' => $aTmplVarsSeller
            ),
            'bx_if:show_license' => array(
                'condition' => !empty($aTmplVarsLicense),
                'content' => $aTmplVarsLicense
            ),
            'order' => $aOrder['order'],
            'provider' => _t('_bx_payment_txt_name_' . $aOrder['provider']),
            'error' => $aOrder['error_msg'],
            'date' => bx_time_js($aOrder['date'], BX_FORMAT_DATE_TIME, true),
            'bx_if:show_author' => array(
                'condition' => $bTmplVarsShowSlrAtr,
                'content' => $aTmplVarsAuthor
            ),
            'bx_repeat:items' => array()
        ), $aTmplVarsSeller, $aTmplVarsCustom);

        foreach($aItems as $aItem) {
            $aInfo = $oModule->callGetCartItem((int)$aItem['module_id'], array($aItem['item_id'], $aOrder['client_id']));
            if(!empty($aInfo) && is_array($aInfo))
                $aResult['bx_repeat:items'][] = array(
                    'bx_if:link' => array(
                        'condition' => !empty($aInfo['url']),
                        'content' => array(
                            'title' => $aInfo['title'],
                            'url' => $aInfo['url']
                        )
                    ),
                    'bx_if:text' => array(
                        'condition' => empty($aInfo['url']),
                        'content' => array(
                            'title' => $aInfo['title'],
                        )
                    ),
                    'quantity' => $aItem['item_count'],
                    'price' => $this->_oConfig->getPrice($aOrder['type'], $aInfo),
                    'currency_code' => $aSeller['currency_code']
                );
        }

        return $this->parseHtmlByName('order_' . $sType . '.html', $aResult);
    }
    
    public function displayOrderAPI($sType, $aOrder)
    {
        $oModule = $this->getModule();
        $aSeller = $oModule->getVendorInfo((int)$aOrder['seller_id']);
        $bSubscription = in_array($sType, [BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION]);

        $aResult = [
            [_t($this->_sLangsPrefix . 'txt_seller'), $aSeller['name']],
            [_t($this->_sLangsPrefix . 'txt_' . ($bSubscription ? 'subscription' : 'order')), $aOrder['order']],           
        ];

        if($bSubscription)
            $aResult[] = [_t($this->_sLangsPrefix . 'txt_customer_id'), $aOrder['customer_id']];

        if(in_array($sType, [BX_PAYMENT_ORDERS_TYPE_PROCESSED, BX_PAYMENT_ORDERS_TYPE_HISTORY]))
            $aResult[] = [_t($this->_sLangsPrefix . 'txt_license'), $aOrder['license']];

        $aResult[] = [_t($this->_sLangsPrefix . 'txt_date'), $aOrder['date']];

        if(in_array($sType, [BX_PAYMENT_ORDERS_TYPE_PENDING, BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION]))
            $aItems = $this->_oConfig->descriptorsM2A($aOrder['items']);
        else
            $aItems = $this->_oConfig->descriptorsM2A($this->_oConfig->descriptorA2S(array($aOrder['seller_id'], $aOrder['module_id'], $aOrder['item_id'], $aOrder['item_count'])));

        $sProducts = '';
        foreach($aItems as $aItem) {
            $aInfo = $oModule->callGetCartItem((int)$aItem['module_id'], array($aItem['item_id'], $aOrder['client_id']));
            if(empty($aInfo) || !is_array($aInfo))
                continue;

            $sProducts .= $aInfo['title'] . ' (' . $aItem['item_count'] . ') - ' . $this->_oConfig->getPrice($aOrder['type'], $aInfo) . $aSeller['currency_code'] . ', ';
        }

        $aResult[] = [_t($this->_sLangsPrefix . 'txt_products'), trim($sProducts, ", ")];

        return $aResult;
    }

    public function displayBlockInvoices()
    {
        $sGrid = $this->_oConfig->getObject('grid_invoices');
        $oGrid = BxDolGrid::getObjectInstance($sGrid);
        if(!$oGrid)
            return MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $this->addJsCssInvoices();
        return $oGrid->getCode();
    }

    public function displayItems($iSellerId, $sType, $aItems = [], $aParams = [])
    {
        $oModule = $this->getModule();
        $oForm = new BxTemplFormView([]);

        $sSign = !$this->_oConfig->isSingleSeller() ? $oModule->getVendorCurrencySign($iSellerId) : $this->_oConfig->getDefaultCurrencySign();

        $bFilter = !empty($aParams['filter']);
        $sFilter = $bFilter ? $aParams['filter'] : '';
        
        $aTmplVarsItems = [];
        if(!empty($aItems) && is_array($aItems))
            foreach($aItems as $aItem) {
                if($bFilter && stripos($aItem['title'], $sFilter) === false)
                    continue;

                $fPrice = $this->_oConfig->getPrice($sType, $aItem);

                $aInputCheckbox = array(
                    'type' => 'checkbox',
                    'name' => 'items[]',
                    'value' => $aItem['id']
                );
                $aInputPrice = array(
                    'type' => 'text',
                    'name' => 'item-price-' . $aItem['id'],
                    'value' => $fPrice
                );
                $aInputQuantity = array(
                    'type' => 'text',
                    'name' => 'item-quantity-' . $aItem['id'],
                    'value' => 1
                );

                $aTmplVarsItems[$aItem['name']] = array(
                    'id' => $aItem['id'],
                    'price' => $fPrice,
                    'price_f' => _t_format_currency_ext($fPrice, ['sign' => $sSign]),
                    'bx_if:link' => array(
                        'condition' => !empty($aItem['url']),
                        'content' => array(
                            'url' => $aItem['url'],
                            'title' => $aItem['title']
                        )
                    ),
                    'bx_if:text' => array(
                        'condition' => empty($aItem['url']),
                        'content' => array(
                            'title' => $aItem['title']
                        )
                    ),
                    'input_checkbox' => $oForm->genInput($aInputCheckbox),
                    'input_price' => $oForm->genInput($aInputPrice),
                    'input_quantity' => $oForm->genInput($aInputQuantity),
                );
            }

        
        $bTmplVarsItems = !empty($aTmplVarsItems) && is_array($aTmplVarsItems);
        if($bTmplVarsItems) {
            ksort($aTmplVarsItems);
            $aTmplVarsItems = array_values($aTmplVarsItems);
        }
        else 
            $aTmplVarsItems = MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $sInputFilter = '';
        if($bFilter || $bTmplVarsItems) {
            $sJsMethod = 'javascript:' . $this->_oModule->_oConfig->getJsObject('processed') . '.filterItems(event, this);';
            $aInputFilter = [
                'type' => 'text',
                'name' => 'filter',
                'value' => $sFilter,
                'attrs' => [
                    'placeholder' => _t('_sys_search_placeholder'),
                    'onkeydown' => $sJsMethod,
                    'onpaste' => $sJsMethod
                ]
            ];
            $sInputFilter = $oForm->genInput($aInputFilter);
        }       

        return $this->parseHtmlByName('items.html', array(
            'html_id' => $this->_oConfig->getHtmlIds('processed', 'order_processed_items'),
            'input_filter' => $sInputFilter,
            'bx_repeat:items' => $aTmplVarsItems
        ));
    }

    public function displayProvidersSelector($aCartItem, $aProviders, $sRedirect = '', $aCustom = array())
    {
    	$oModule = $this->getModule();

        $aTmplVarsProviders = array();
        foreach($aProviders as $sProvider => $aProvider) {
            list($sJsCode, $sJsOnclick) = $oModule->getProviderButtonJs($aCartItem, $aProvider, $sRedirect, $aCustom);

            $sCaptionKey = '_bx_payment_txt_subscribe_' . $aProvider['name'];
            $sCaptionValue = _t($sCaptionKey);
            if(strcmp($sCaptionKey, $sCaptionValue) == 0)
                $sCaptionValue = _t($aProvider['caption']);

            $aTmplVarsProviders[] = array(
                'button' => $this->parseHtmlByName('providers_select_button.html', array(
                    'onclick' => $sJsOnclick,
                    'title' => _t('_bx_payment_txt_checkout_with', $sCaptionValue),
                    'js_code' => $sJsCode
                ))
            );
        }

        return $this->parseHtmlByName('providers_select.html', array(
            'bx_repeat:providers' => $aTmplVarsProviders
        ));
    }

    protected function _displayBlockHistory($sObject, $iClientId, $iSellerId = 0)
    {
    	$oGrid = BxDolGrid::getObjectInstance($this->_oConfig->getObject($sObject), $this->getModule()->_oTemplate);
        if(!$oGrid || empty($iClientId))
            return $this->_bIsApi ? false : MsgBox(_t($this->_sLangsPrefix . 'msg_no_results'));

        $oGrid->addQueryParam('client_id', $iClientId);
        if(!empty($iSellerId))
            $oGrid->addQueryParam('seller_id', $iSellerId);

        if($this->_bIsApi)
            return $oGrid->getCodeAPI();

        $this->addJsCssOrders();
        return $this->displayJsCode(BX_PAYMENT_ORDERS_TYPE_HISTORY) . $oGrid->getCode();
    }

    protected function _displaySubscriptionData($sType, $iId)
    {
        $aResult = array('code' => 1, 'message' => _t('_bx_payment_err_cannot_perform'));

        $aPending = $this->_oDb->getOrderPending(array('type' => 'id', 'id' => $iId));
        if(empty($aPending) || !is_array($aPending))
            return $aResult;

        $aSubscription = $this->_oDb->getSubscription(array('type' => 'pending_id', 'pending_id' => $iId));
        if(empty($aSubscription) || !is_array($aSubscription))
            return $aResult;

        $mixedResult = $this->getModule()->isAllowedManage($aPending);
        if($mixedResult !== true)
            return array('code' => 2, 'message' => $mixedResult);
            
        $sMethod = bx_gen_method_name($sType) . 'Recurring';
        $oProvider = $this->getModule()->getObjectProvider($aPending['provider'], $aPending['seller_id']);
        if($oProvider === false || !$oProvider->isActive() || !method_exists($oProvider, $sMethod))
        	return $aResult;

        $mixedContent = $oProvider->$sMethod($iId, $aSubscription['customer_id'], $aSubscription['subscription_id']);
        if(empty($mixedContent))
            return $aResult;
        else if(is_array($mixedContent))
            return $mixedContent;

        $sKey = 'order_' . BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION . '_' . $sType;
    	$sId = $this->_oConfig->getHtmlIds(BX_PAYMENT_ORDERS_TYPE_SUBSCRIPTION, $sKey);
    	$sTitle = _t($this->_sLangsPrefix . 'popup_title_ods_' . $sKey);
    	return array('popup' => array(
    		'html' => BxTemplFunctions::getInstance()->popupBox($sId, $sTitle, $mixedContent), 
    		'options' => array('closeOnOuterClick' => 1)
    	));
    }
}

/** @} */
