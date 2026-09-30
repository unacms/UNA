<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BasePayment Base classes for Payment like modules
 * @ingroup     UnaModules
 *
 * @{
 */

class BxBaseModPaymentConfig extends BxBaseModGeneralConfig
{
    protected $_oDb;

    protected $_sCurrencySign;
    protected $_sCurrencyCode;

    protected $_iSiteAdmin;
    protected $_bSingleSeller;

    protected $_aPerPage;
    protected $_aHtmlIds;

    protected $_sAnimationEffect;
    protected $_iAnimationSpeed;

    function __construct($aModule)
    {
        parent::__construct($aModule);

        $this->CNF = array_merge($this->CNF, [
            // some params
            'PARAM_CURRENCY_CODE' => $this->_sName . '_default_currency_code',

            'PARAM_CMSN_ENABLE' => true,
            'PARAM_CMSN_INVOICE_ISSUE_DAY' => 1, //the first day of month
            'PARAM_CMSN_INVOICE_LIFETIME' => 4, //in days
            'PARAM_CMSN_INVOICE_EXPIRATION_NOTIFY' => 1, //in days, before expiration date
            'PARAM_CMSN_DATE_FORMAT' => 'd.m.Y',
            'PARAM_CMSN_DATE_TIME_FORMAT' => 'd.m.Y H:i',

            // objects
            'OBJECT_FORM_DETAILES' => $this->_sName . '_form_details',
            'OBJECT_FORM_DETAILES_EDIT' => $this->_sName . '_form_details_edit',
            'OBJECT_FORM_PRELISTS_CURRENCIES' => '',

            'PROVIDER_GENERIC' => 'generic',

            'KEY_SESSION_PENDING' => $this->_sName . '_pending_id',
            'KEY_REQUEST_PENDING' => $this->_sName . '_pending_id',

            'DIVIDER_DESCRIPTOR' => '_',
            'DIVIDER_DESCRIPTORS' => ':',
            'DIVIDER_GRID_FILTERS' => '#-#',
        ]);

        $this->_aPrefixes = [
            'general' => $this->_sName . '_',
            'langs' => '_' . $this->_sName . '_',
            'options' => $this->_sName . '_'
        ];

        $this->_aObjects = array_merge($this->_aObjects, [
            'form_details' => $this->CNF['OBJECT_FORM_DETAILES'],
            'form_display_details_edit' => $this->CNF['OBJECT_FORM_DETAILES_EDIT'],
            'form_pendings' => $this->_sName . '_form_pendings',
            'form_processed' => $this->_sName . '_form_processed',
            'form_display_pendings_process' => $this->_sName . '_form_pendings_process',
            'form_display_processed_add' => $this->_sName . '_form_processed_add',
            'form_commissions' => $this->_sName . '_form_commissions',
            'form_display_commissions_add' => $this->_sName . '_form_commissions_add',
            'form_display_commissions_edit' => $this->_sName . '_form_commissions_edit',
            'form_invoices' => $this->_sName . '_form_invoices',
            'form_display_invoices_edit' => $this->_sName . '_form_invoices_edit',

            'menu_dashboard' => 'sys_account_dashboard',
            'menu_cart_submenu' => $this->_sName . '_menu_cart_submenu',
            'menu_orders_submenu' => $this->_sName . '_menu_orders_submenu',
            'menu_sbs_submenu' => $this->_sName . '_menu_sbs_submenu',
            'menu_sbs_actions' => $this->_sName . '_menu_sbs_actions',

            'grid_providers' => $this->_sName . '_grid_providers',
            'grid_history' => $this->_sName . '_grid_orders_history',
            'grid_processed' => $this->_sName . '_grid_orders_processed',
            'grid_pending' => $this->_sName . '_grid_orders_pending',
            'grid_commissions' => $this->_sName . '_grid_commissions',
            'grid_invoices' => $this->_sName . '_grid_invoices',
            'grid_carts' => $this->_sName . '_grid_carts',
            'grid_cart' => $this->_sName . '_grid_cart',
            'grid_sbs_list_my' => $this->_sName . '_grid_sbs_list_my',
            'grid_sbs_list_all' => $this->_sName . '_grid_sbs_list_all',
            'grid_sbs_history' => $this->_sName . '_grid_sbs_history',
        ]);

        $this->_aPerPage = [];
        $this->_aHtmlIds = [];

        $this->_sAnimationEffect = 'fade';
        $this->_iAnimationSpeed = 'slow';
    }

    public function init(&$oDb)
    {
    	$this->_oDb = $oDb;

        $sPrefix = $this->getPrefix('options');

        $this->_sCurrencyCode = (string)$this->_oDb->getParam($this->CNF['PARAM_CURRENCY_CODE']);
        $this->_sCurrencySign = $this->retrieveCurrencySign($this->_sCurrencyCode);

        $this->_iSiteAdmin = (int)$this->_oDb->getParam($sPrefix . 'site_admin');
        $this->_bSingleSeller = $this->_oDb->getParam($sPrefix . 'single_seller') == 'on';
    }

    public function getDefaultCurrencySign()
    {
        return $this->_sCurrencySign;
    }

    public function getDefaultCurrencyCode()
    {
        return $this->_sCurrencyCode;
    }

    public function getSiteAdmin()
    {
        return $this->_iSiteAdmin;
    }

    public function isSiteAdmin($iProfileId = 0)
    {
        if(empty($iProfileId))
            $iProfileId = bx_get_logged_profile_id();

        return $iProfileId == $this->_iSiteAdmin;
    }

    public function isSingleSeller()
    {
        return $this->_bSingleSeller;
    }

    public function isCommissions()
    {
        $sKey = 'PARAM_CMSN_ENABLE';
        return is_bool($this->CNF[$sKey]) ? $this->CNF[$sKey] : $this->_oDb->getParam($this->CNF[$sKey]) == 'on';
    }

    public function getInvoiceIssueDay()
    {
        $sKey = 'PARAM_CMSN_INVOICE_ISSUE_DAY';
        return is_numeric($this->CNF[$sKey]) ? $this->CNF[$sKey] : $this->_oDb->getParam($this->CNF[$sKey]);
    }

    public function getInvoiceLifetime()
    {
        $sKey = 'PARAM_CMSN_INVOICE_LIFETIME';
        return is_numeric($this->CNF[$sKey]) ? $this->CNF[$sKey] : $this->_oDb->getParam($this->CNF[$sKey]);
    }

    public function getInvoiceExpirationNotify()
    {
        $sKey = 'PARAM_CMSN_INVOICE_EXPIRATION_NOTIFY';
        return is_numeric($this->CNF[$sKey]) ? $this->CNF[$sKey] : $this->_oDb->getParam($this->CNF[$sKey]);
    }

    public function getKey($sType)
    {
    	$sResult = '';
    	if(empty($sType) || !isset($this->CNF[$sType]))
            return $sResult;

        return $this->CNF[$sType];
    }

    public function getUrl($sType, $aParams = array(), $bSsl = false)
    {
        $sResult = '';
        if(empty($sType) || !isset($this->CNF[$sType]))
            return $sResult;

        if(strncmp($this->CNF[$sType], BX_DOL_URL_ROOT, strlen(BX_DOL_URL_ROOT)) === 0)
            $sResult = bx_append_url_params($this->CNF[$sType], $aParams);
        else
            $sResult = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->CNF[$sType], $aParams));

        if($this->_bIsApi)
            return bx_api_get_relative_url($sResult);

        return $bSsl ? $this->http2https($sResult) : $sResult;
    }

    public function getDivider($sType)
    {
    	$sResult = '';
    	if(empty($sType) || !isset($this->CNF[$sType]))
            return $sResult;

        return $this->CNF[$sType];
    }

    public function getPerPage($sType = 'default')
    {
    	if(empty($sType))
            return $this->_aPerPage;

        return isset($this->_aPerPage[$sType]) ? $this->_aPerPage[$sType] : '';
    }

    public function getHtmlIds($sType, $sKey = '')
    {
        if(empty($sKey))
            return isset($this->_aHtmlIds[$sType]) ? $this->_aHtmlIds[$sType] : array();

        return isset($this->_aHtmlIds[$sType][$sKey]) ? $this->_aHtmlIds[$sType][$sKey] : '';
    }

    public function getAnimationEffect()
    {
        return $this->_sAnimationEffect;
    }

    public function getAnimationSpeed()
    {
        return $this->_iAnimationSpeed;
    }

    public function getLicense()
    {
        list($fMilliSec, $iSec) = explode(' ', microtime());
        $fSeed = (float)$iSec + ((float)$fMilliSec * 100000);
        srand((int)$fSeed);

        $sResult = '';
        for($i=0; $i < 16; ++$i) {
            switch(rand(1,2)) {
                case 1:
                    $c = chr(rand(ord('A'),ord('Z')));
                    break;
                case 2:
                    $c = chr(rand(ord('0'),ord('9')));
                    break;
            }
            $sResult .= $c;
        }

        return $sResult;
    }

    public function formatDate($iTs)
    {
        return gmdate($this->CNF['PARAM_CMSN_DATE_FORMAT'], $iTs);
    }

    public function formatDateTime($iTs)
    {
        return gmdate($this->CNF['PARAM_CMSN_DATE_TIME_FORMAT'], $iTs);
    }

    public function retrieveCurrencySign($sCode)
    {
        if(empty($sCode))
            return '';

        $aCurrencies = BxDolForm::getDataItems($this->CNF['OBJECT_FORM_PRELISTS_CURRENCIES'], false, BX_DATA_VALUES_ADDITIONAL);
        if(!isset($aCurrencies[$sCode]))
            return '';

        return $aCurrencies[$sCode];
    }
}

/** @} */
