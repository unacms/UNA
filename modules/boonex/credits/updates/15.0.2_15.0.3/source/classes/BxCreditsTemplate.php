<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Credits Credits
 * @ingroup     UnaModules
 *
 * @{
 */

class BxCreditsTemplate extends BxBaseModGeneralTemplate
{
    function __construct(&$oConfig, &$oDb)
    {
        $this->MODULE = 'bx_credits';

        parent::__construct($oConfig, $oDb);

        $this->aMethodsToCallAddJsCss = array('getBlockBundles', 'getBlockCheckout');
    }

    public function getJsCode($sType, $aParams = array(), $bWrap = true)
    {
        $aParams = array_merge(array(
            'aHtmlIds' => $this->_oConfig->getHtmlIds()
        ), $aParams);

        return parent::getJsCode($sType, $aParams, $bWrap);
    }

    public function getEmptyAuthor()
    {
    	return MsgBox(_t('_bx_credits_msg_empty_author'));
    }

    public function getUnit()
    {
        $CNF = &$this->_oConfig->CNF;

        $sUnit = '';
        if(($sCode = getParam($CNF['PARAM_CODE'])) != '')
            $sUnit = $sCode;
        else if(($sIcon = getParam($CNF['PARAM_ICON'])) != '')
            $sUnit = $this->parseIcon($sIcon, array('class' => $this->_oConfig->getPrefix('style') . '-prefix-icon bx-def-margin-thd-right'));

        return $sUnit;
    }

    public function getBlockCheckout($oBuyer, $oSeller, $aData)
    {
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('checkout');

        $sTxtQt = _t('_bx_credits_txt_checkout_qt');

        $fRate = $this->_oConfig->getConversionRateUse();
        $aCurrency = $this->_oConfig->getCurrency();

        $sCurrencySign = $aCurrency['sign'];
        if(!empty($aData['currency']['sign']))
            $sCurrencySign = $aData['currency']['sign'];

        $aTmplVarsItems = array();
        foreach($aData['items'] as $iIndex => $aItem)
            $aTmplVarsItems[] = array(
                'sp' => $sStylePrefix,
                'item_index' => $iIndex + 1,
                'item_title' => $aItem['title'],
                'item_quantity' => $aItem['quantity'] . $sTxtQt
            );
        
        $sTitle = _t('_bx_credits_txt_checkout_to', $oSeller->getDisplayName());
        if($this->_bIsApi)
            return [
                'title' => $sTitle,
                'items' => $aTmplVarsItems,
                'amount' => [
                    'value' => (float)$aData['amountm'],
                    'currency' => $aData['currency']['code'] ?? $aCurrency['code']
                ],
                'rate' => $fRate != 1 ? $fRate : '',
                'request_url' => '/api.php?r=' . $this->_oConfig->getName() . '/checkout&params[]='
            ];

        $this->addJs(array('checkout.js'));
        $this->addCss(array('checkout.css'));
        return $this->parseHtmlByName('checkout.html', array(
            'sp' => $sStylePrefix,
            'jo' => $sJsObject,
            'title' => $sTitle,
            'bx_repeat:items' => $aTmplVarsItems,
            'amount' => $sCurrencySign . sprintf("%.2f", (float)($aData['amountm'])),
            'bx_if:show_rate' => array(
                'condition' => $fRate != 1,
                'content' => array(
                    'sp' => $sStylePrefix,
                    'rate' => $fRate,
                )
            ),
            'credits' => $this->getModule()->convertC2S($aData['amountc']),
            'js_code' => $this->getJsCode('checkout')
        ));
    }

    public function getBlockBundles()
    {
        $CNF = &$this->_oConfig->CNF;
        $sStylePrefix = $this->_oConfig->getPrefix('style');

        $sModule = $this->_oConfig->getName();
        $iAuthor = $this->_oConfig->getAuthor();
        $aCurrency = $this->_oConfig->getCurrency();

        $aBundles = $this->_oDb->getBundle(['type' => 'all', 'active' => 1]);
        if(empty($aBundles) || !is_array($aBundles))
            return ($sMsg = _t('_Empty')) && $this->_bIsApi ? [bx_api_get_msg($sMsg)] : MsgBox($sMsg);

        $oPayment = BxDolPayments::getInstance();

        $aTmplVarsBundles = [];
        foreach($aBundles as $aBundle) {
            $iBundle = $aBundle[$CNF['FIELD_ID']];

            $aJs = $oPayment->getAddToCartJs($iAuthor, $this->MODULE, $iBundle, 1, true);
            if(empty($aJs) || !is_array($aJs))
                continue;

            list($sJsCode, $sJsMethod) = $aJs;

            $aTmplVarsBundles[] = array_merge($aBundle, [
                'title' => _t($aBundle[$CNF['FIELD_TITLE']]),
                'description' => _t($aBundle[$CNF['FIELD_DESCRIPTION']]),
                'currency_sign' => $aCurrency['sign'],
                'currency_code' => $aCurrency['code'],
            ], !$this->_bIsApi ? [
                'sp' => $sStylePrefix,
                'bx_if:show_bonus' => [
                    'condition' => (int)$aBundle[$CNF['FIELD_BONUS']] > 0,
                    'content' => [
                        'sp' => $sStylePrefix,
                        'bonus' => (int)$aBundle[$CNF['FIELD_BONUS']]
                    ]
                ],
                'onclick' => $sJsMethod
            ] : [
                'buttons' => [[
                    'title' => _t('_bx_credits_txt_purchase'),
                    'request_url' => $sModule . '/add_to_cart/&params[]=' . $iBundle . '&params[]=',
                ]]
            ]);
        }

        return $this->_bIsApi ? $aTmplVarsBundles : $this->parseHtmlByName('bundles.html', [
            'sp' => $sStylePrefix,
            'bx_repeat:bundles' => $aTmplVarsBundles,
            'js_code' => $oPayment->getCartJs()
        ]);
    }

    public function getPopupSubscribe($oBuyer, $oSeller, $aData)
    {
        $CNF = &$this->_oConfig->CNF;
        $bDynamic = bx_is_dynamic_request();
        $sStylePrefix = $this->_oConfig->getPrefix('style');
        $sJsObject = $this->_oConfig->getJsObject('subscribe');

        $fRate = $this->_oConfig->getConversionRateUse();
        $aCurrency = $this->_oConfig->getCurrency();

        $sCurrencySign = $aCurrency['sign'];
        if(!empty($aData['currency']['sign']))
            $sCurrencySign = $aData['currency']['sign'];

        if(!empty($aData['period']) && !empty($aData['period_unit'])) {
            $sPeriod = _t('_bx_credits_txt_subscribe_period_unit_' . $aData['period_unit']);
            if((int)$aData['period'] > 1);
                $sPeriod = _t('_bx_credits_txt_subscribe_period_mask', $aData['period'], $sPeriod);
        }
        else
            $sPeriod = _t('_bx_credits_txt_subscribe_lifetime');

        $sInclude = '';
        $sInclude .= $this->addJs(array('subscribe.js'), $bDynamic);
        $sInclude .= $this->addCss(array('main.css', 'subscribe.css'), $bDynamic);

        $sContent = ($bDynamic ? $sInclude : '') . $this->parseHtmlByName('subscribe.html', array(
            'sp' => $sStylePrefix,
            'jo' => $sJsObject,
            'title' => _t('_bx_credits_txt_subscribe_for', $oSeller->getDisplayName()),
            'item_title' => $aData['title'],
            'amount' => $sCurrencySign . sprintf("%.2f", (float)($aData['amountm'])),
            'period' => $sPeriod,
            'bx_if:show_rate' => array(
                'condition' => $fRate != 1,
                'content' => array(
                    'sp' => $sStylePrefix,
                    'rate' => $fRate,
                )
            ),
            'bx_if:show_trial' => array(
                'condition' => (int)$aData['trial'] > 0,
                'content' => array(
                    'sp' => $sStylePrefix,
                    'trial' => _t('_bx_credits_txt_subscribe_trial_mask', $aData['trial'], _t('_bx_credits_txt_subscribe_period_unit_day'))
                )
            ),
            'credits' => $this->getModule()->convertC2S($aData['amountc']),
            'js_code' => $this->getJsCode('subscribe')
        ));

        return BxTemplFunctions::getInstance()->transBox($this->_oConfig->getHtmlIds('subscribe_popup'), $sContent);
    }
}

/** @} */
