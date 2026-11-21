<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 * 
 * @{
 */

require_once('BxBaseModGroupsGridPrices.php');

class BxBaseModGroupsGridPricesView extends BxBaseModGroupsGridPrices
{
    /**
     * Array with check_sum => JS_code pairs of all JS codes 
     * which should be added to the page.
     */
    protected $_aJsCodes;

    protected $_oPayment;
    protected $_bTypeSingle;
    protected $_bTypeRecurring;

    protected $_iSeller;
    protected $_iClient;
    protected $_iClientRole;

    public function __construct ($aOptions, $oTemplate = false)
    {
        parent::__construct ($aOptions, $oTemplate);

        $this->_aJsCodes = array();
    }

    public function setClientId($iClientId = 0)
    {
        $this->_iClient = $iClientId;
        if(empty($this->_iClient))
            $this->_iClient = bx_get_logged_profile_id();

        $this->_iClientRole = 0;
        if(!empty($this->_iGroupProfileId))
            $this->_iClientRole = $this->_oModule->getRole($this->_iGroupProfileId, $this->_iClient);
    }

    public function setSellerId($iSellerId = 0)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_iSeller = $iSellerId;
        if(empty($this->_iSeller) && !empty($this->_aGroupContentInfo) && is_array($this->_aGroupContentInfo))
            $this->_iSeller = $this->_aGroupContentInfo[$CNF['FIELD_AUTHOR']];

        if(empty($this->_oPayment))
            $this->_oPayment = BxDolPayments::getInstance();

        $this->_bTypeSingle = $this->_oPayment->isAcceptingPayments($this->_iSeller, BX_PAYMENT_TYPE_SINGLE);
        $this->_bTypeRecurring = $this->_oPayment->isAcceptingPayments($this->_iSeller, BX_PAYMENT_TYPE_RECURRING);
    }

    public function setProfileId($iProfileId)
    {
        parent::setProfileId($iProfileId);

        $this->setClientId();
        $this->setSellerId();
    }

    public function performActionChoose()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = $this->_getIds();
        if($aIds === false)
            return $this->_bIsApi ? [] : echoJson([]);

        $aItem = $this->_oModule->_oDb->getPrices(['type' => 'by_id', 'value' => $aIds[0]]);
        if(!is_array($aItem) || empty($aItem) || (float)$aItem['price'] != 0)
            return $this->_bIsApi ? [] : echoJson([]);

        $aResult = [];
        if($this->_oModule->setRole($this->_iGroupProfileId, $this->_iClient, $aItem['role_id'], ['period' => $aItem['period'], 'period_unit' => $aItem['period_unit']]))
            $aResult = ['grid' => $this->getCode(false), 'blink' => $aItem['id'], 'toast' => _t($CNF['T']['msg_performed'])];
        else
            $aResult = ['msg' => _t($CNF['T']['err_cannot_perform'])];

        return $this->_bIsApi ? [] : echoJson($aResult);
    }

    public function performActionBuy()
    {
        if(!$this->_bIsApi)
            return echoJson([]);

        $aIds = $this->_getIds();
        if($aIds === false || !is_array($aIds))
            return [];

        if(($sDescriptor = array_shift($aIds))) {
            $aDescriptor = $this->_oPayment->getActiveObject()->_oConfig->descriptorS2A($sDescriptor);
            if($aDescriptor && is_array($aDescriptor) && (int)$aDescriptor[0] == $this->_iSeller) {
                $aResult = $this->_oPayment->addToCart($this->_iSeller, $this->_sModule, (int)$aDescriptor[2], 1, true);
                if(isset($aResult['code']) && (int)$aResult['code'] != 0)
                    return [bx_api_get_msg($aResult['message'])];
            }
        }

        return [];
    }

    public function performActionSubscribe()
    {
        if(!$this->_bIsApi)
            return echoJson([]);
        
        $aIds = $this->_getIds();
        if($aIds === false)
            return [];

        //TODO: Payment Provider selector should be realized.
        $aResult = $this->_oPayment->subscribeWithAddons($this->_iSeller, 'stripe_v3', $this->_sModule, array_shift($aIds), 1, true);
        if(isset($aResult['code']) && (int)$aResult['code'] != 0)
            return [bx_api_get_msg($aResult['message'])];

        return [];
    }

    public function getCode($isDisplayHeader = true)
    {
    	return parent::getCode($isDisplayHeader) . $this->getJsCode();
    }

    public function getJsCode()
    {
        if(empty($this->_aJsCodes) || !is_array($this->_aJsCodes))
            return '';

        return implode('', $this->_aJsCodes);
    }

    protected function _getCellRoleId($mixedValue, $sKey, $aField, $aRow)
    {
        return parent::_getCellDefault(!empty($aRow['caption']) ? $aRow['caption'] : $this->_aRoles[$mixedValue], $sKey, $aField, $aRow);
    }

    protected function _getActionChoose ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        if((float)$aRow['price'] != 0 || $this->_oModule->getRole($this->_iGroupProfileId, $this->_iClient) === (int)$aRow['role_id'])
            return $this->_bIsApi ? [] : '';
        
        if($this->_bIsApi)
            return array_merge($a, ['name' => $sKey, 'type' => 'callback', 'on_callback' => 'hide']);

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getActionBuy ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if((float)$aRow['price'] == 0 || !$this->_bTypeSingle || ($this->_bTypeRecurring && !$this->_isLifetime($aRow)))
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'callback', 
                'on_callback' => 'redirect',
                'redirect_url' => bx_api_get_relative_url($this->_oPayment->getCartUrl($this->_iSeller)),
                'payment_type' => BX_PAYMENT_TYPE_SINGLE,
                'seller_id' => $this->_iSeller,
                'items' => [$this->_oPayment->getCartItemDescriptor($this->_iSeller, $this->_oModule->_oConfig->getId(), $aRow['id'], 1)],
            ]);

        $aJs = $this->_oPayment->getAddToCartJs($this->_iSeller, $this->_sModule, $aRow['id'], 1, true);
        if(!empty($aJs) && is_array($aJs)) {
            list($sJsCode, $sJsMethod) = $aJs;

            $sJsCodeCheckSum = md5($sJsCode);
            if(!isset($this->_aJsCodes[$sJsCodeCheckSum]))
                $this->_aJsCodes[$sJsCodeCheckSum] = $sJsCode;

            $a['attr'] = array(
                'title' => bx_html_attribute(_t($CNF['T']['txt_buy_title'])),
                'onclick' => $sJsMethod
            );
        }

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getActionSubscribe ($sType, $sKey, $a, $isSmall = false, $isDisabled = false, $aRow = array())
    {
        $CNF = &$this->_oModule->_oConfig->CNF;

        if((float)$aRow['price'] == 0 || !$this->_bTypeRecurring || ($this->_bTypeSingle && $this->_isLifetime($aRow)))
            return $this->_bIsApi ? [] : '';

        if($this->_bIsApi)
            return array_merge($a, [
                'name' => $sKey, 
                'type' => 'object', 
                'object_name' => 'stripe_v3',
                'payment_type' => BX_PAYMENT_TYPE_RECURRING,
                'seller_id' => $this->_iSeller,
                'items' => [$this->_oPayment->getCartItemDescriptor($this->_iSeller, $this->_oModule->_oConfig->getId(), $aRow['id'], 1)],
            ]);

        $aJs = $this->_oPayment->getSubscribeJs($this->_iSeller, '', $this->_sModule, $aRow['id'], 1);
        if(!empty($aJs) && is_array($aJs)) {
            list($sJsCode, $sJsMethod) = $aJs;

            $sJsCodeCheckSum = md5($sJsCode);
            if(!isset($this->_aJsCodes[$sJsCodeCheckSum]))
                $this->_aJsCodes[$sJsCodeCheckSum] = $sJsCode;

            $a['attr'] = array(
                'title' => bx_html_attribute(_t($CNF['T']['txt_subscribe_title'])),
                'onclick' => $sJsMethod
            );
        }

        return  parent::_getActionDefault($sType, $sKey, $a, false, $isDisabled, $aRow);
    }

    protected function _getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage)
    {
        $this->_aOptions['source'] .= $this->_oModule->_oDb->prepareAsString("AND `profile_id`=? ", $this->_iGroupProfileId);

        return parent::_getDataSql($sFilter, $sOrderField, $sOrderDir, $iStart, $iPerPage);;
    }

    protected function _isLifetime($aRow)
    {
        return empty($aRow['period']) && empty($aRow['period_unit']);
    }
}

/** @} */
