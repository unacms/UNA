<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaStudio UNA Studio
 * @{
 */

bx_import('BxDolStudioInstallerUtils');

define('BX_DOL_STUDIO_STR_TYPE_DEFAULT', 'downloaded');

class BxDolStudioStore extends BxTemplStudioWidget
{
    protected $sPage;
    protected $aContent;
    protected $sBaseUrl;

    protected $iClient;
    protected $sClientKey; 

    protected $sStoreDataUrlPublic;
    protected $bAuthAccessUpdates;

    protected $sSessionKeyNonOwnerNotified;

    function __construct($sPage = "")
    {
        parent::__construct('store');

        $this->oDb = new BxDolStudioStoreQuery();

        $this->sBaseUrl = BX_DOL_URL_STUDIO . 'store.php';

        $this->sStoreDataUrlPublic = BxDolStudioInstallerUtils::getInstance()->getStoreDataUrl();
        $this->bAuthAccessUpdates = true;

        $this->sSessionKeyNonOwnerNotified = 'str_non_owner_notified';

        $this->sPage = BX_DOL_STUDIO_STR_TYPE_DEFAULT;
        if(is_string($sPage) && !empty($sPage))
            $this->sPage = $sPage;

        $this->initClient();
    }

    public function checkAction()
    {
        $sAction = bx_get('str_action');
    	if($sAction === false)
            return false;

        $sAction = bx_process_input($sAction);

        $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_mod_err_cannot_process_action'));
        switch($sAction) {
            case 'get-file':
                $iFileId = (int)bx_get('str_id');
                $aResult = $this->getFile($iFileId);
                break;

            case 'get-product':
                $sModuleName = bx_process_input(bx_get('str_id'));
                $aResult = $this->getProduct($sModuleName);
                break;

            case 'get-update':
                $sModuleName = bx_process_input(bx_get('str_id'));
                $aResult = $this->getUpdate($sModuleName);
                break;

            case 'get-update-and-install':
                $sModuleName = bx_process_input(bx_get('str_id'));
                $aResult = $this->getUpdate($sModuleName, true);
                break;

            case 'get-products-by-type':
                $this->sPage = bx_process_input(bx_get('str_value'));

                $sContent = $this->getPageCode();
                if(!empty($sContent))
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'content' => $sContent);
                else
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_act_err_failed_page_loading'));
                break;

            case 'get-products-by-page':
                $this->sPage = bx_process_input(bx_get('str_type'));

                $sContent = $this->getPageContent();
                if(!empty($sContent))
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'content' => $sContent);
                else
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_act_err_failed_page_loading'));
                break;

            case 'add-to-cart':
                $iVendor = (int)bx_get('str_vendor');
                $iItem = (int)bx_get('str_item');
                $iItemCount = 1;

                if(empty($iVendor) || empty($iItem)) {
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_err_modules_cannot_add_to_cart'));
                    break;
                }

                BxDolStudioCart::getInstance()->add($iVendor, $iItem, $iItemCount);
                $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => _t('_adm_msg_modules_success_added_to_cart'));
                break;

            case 'delete-from-cart':
                $iVendor = (int)bx_get('str_vendor');
                $iItem = (int)bx_get('str_item');

                if(empty($iVendor)) {
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_err_modules_cannot_delete_from_cart'));
                    break;
                }

                BxDolStudioCart::getInstance()->delete($iVendor, $iItem);
                $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => '');
                break;

            case 'checkout-cart':
                $iVendor = (int)bx_get('str_vendor');
                if(empty($iVendor)) {
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_err_modules_cannot_checkout_empty_vendor'));
                    break;
                }

                $sLocation = $this->checkoutCart($iVendor);
                $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => '', 'redirect' => $sLocation);
                break;

                            case 'subscribe':
                $iVendor = (int)bx_get('str_vendor');
                $iItem = (int)bx_get('str_item');
                if(empty($iVendor) || empty($iItem)) {
                    $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_err_modules_cannot_subscribe'));
                    break;
                }

                $sLocation = $this->subscribe($iVendor, $iItem);
                $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => '', 'redirect' => $sLocation);
                break;

            case 'install':
                $sValue = bx_process_input(bx_get('str_value'));
                if(empty($sValue))
                    break;

                $aResult = BxDolStudioInstallerUtils::getInstance()->perform($sValue, 'install', array('auto_enable' => true, 'html_response' => true));
                break;

            case 'update':
                $sValue = bx_process_input(bx_get('str_value'));
                if(empty($sValue))
                    break;

                $aResult = BxDolStudioInstallerUtils::getInstance()->perform($sValue, 'update', array('html_response' => true));
                break;

            case 'delete':
                $sValue = bx_process_input(bx_get('str_value'));
                if(empty($sValue))
                    break;

                $aResult = BxDolStudioInstallerUtils::getInstance()->perform($sValue, 'delete', array('html_response' => true));
                break;
        }

        if(!empty($aResult['message'])) {
            $oTemplate = BxDolStudioTemplate::getInstance();

            $aResult['message'] = $oTemplate->parseHtmlByName('popup_chain.html', array(
                'html_id' => 'mod_action_result',
                'bx_repeat:items' => array(array(
                    'bx_if:show_as_hidden' => array(
                        'condition' => false,
                        'content' => array(),
                    ),
                    'item' => $oTemplate->parseHtmlByName('str_notification.html', array(
                        'content' => $aResult['message']
                    )),
                    'bx_if:show_previous' => array(
                        'condition' => false,
                        'content' => array(
                            'onclick_previous' => ''
                        )
                    ),
                    'bx_if:show_close' => array(
                       'condition' => false,
                        'content' => array(
                            'onclick_close' => ''
                        )
                    )
                ))
            ));
        }

        return $aResult;
    }
        
        
    protected function initClient()
    {
        $this->iClient = BxDolStudioOAuth::getAuthorizedClient();
        if(!empty($this->iClient))
            $this->sClientKey = $this->oDb->getParam('sys_oauth_key');
    }

    protected function authorizeClient()
    {
        $mixedResult = BxDolStudioInstallerUtils::getInstance()->getAccessObject(true)->doAuthorize();
        if($mixedResult === true)
            $this->initClient();

        return $mixedResult;
    }

    protected function loadGoodies()
    {
        $iPerPage = 4;
        $aProducts = array();

        $sVersion = bx_get_ver();
        $oJson = BxDolStudioJson::getInstance();

        // Load Featured
        $aProducts[] = array(
            'caption' => '_adm_block_cpt_featured',
            'actions' => array(
                array('name' => 'featured', 'caption' => '_adm_action_cpt_see_all', 'url' => $this->getBaseUrl('featured'))
            ),
            'items' => $oJson->load($this->sStoreDataUrlPublic . 'json_browse_featured', array('start' => 0, 'per_page' => $iPerPage, 'client' => $this->iClient, 'key' => $this->sClientKey, 'version' => $sVersion))
        );

        // Load Latest
        $aProducts[] = array(
            'caption' => '_adm_block_cpt_latest',
            'actions' => array(
                array('name' => 'latest', 'caption' => '_adm_action_cpt_see_all', 'url' => $this->getBaseUrl('latest'))
            ),
            'items' => $oJson->load($this->sStoreDataUrlPublic . 'json_browse_latest', array('start' => 0, 'per_page' => $iPerPage, 'client' => $this->iClient, 'key' => $this->sClientKey, 'version' => $sVersion))
        );

        // Load Popular
        $aProducts[] = array(
            'caption' => '_adm_block_cpt_popular',
            'actions' => array(
                array('name' => 'popular', 'caption' => '_adm_action_cpt_see_all', 'url' => $this->getBaseUrl('popular'))
            ),
            'items' => $oJson->load($this->sStoreDataUrlPublic . 'json_browse_popular', array('start' => 0, 'per_page' => $iPerPage, 'client' => $this->iClient, 'key' => $this->sClientKey, 'version' => $sVersion))
        );

        return $aProducts;
    }

    protected function loadLatest($iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_latest', array(
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadFeatured($iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_featured', array(
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadPopular($iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_popular', array(
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadCategories()
    {
        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_categories', array(
            'client' => $this->iClient, 
            'key' => $this->sClientKey
        ));
    }

    protected function loadCategory($iCategory, $iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_by_category', array(
            'value' => $iCategory, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadTags()
    {
        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_tags', array(
            'client' => $this->iClient, 
            'key' => $this->sClientKey
        ));
    }

    protected function loadTag($sTag, $iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_by_tag', array(
            'value' => $sTag, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadSearch($sKeyword, $iStart, $iPerPage)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_browse_by_keyword', array(
            'value' => $sKeyword, 
            'start' => $iStart, 
            'per_page' => $iPerPage, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey, 
            'version' => $sVersion
        ));
    }

    protected function loadPurchases()
    {
        return BxDolStudioInstallerUtils::getInstance()->checkModules(true);
    }

    protected function loadUpdates()
    {
        return BxDolStudioInstallerUtils::getInstance()->checkUpdates($this->bAuthAccessUpdates);
    }

    protected function loadCheckout()
    {
        $oJson = BxDolStudioJson::getInstance();

        $aVendors = BxDolStudioCart::getInstance()->parseByVendor();

        $aResult = array();
        foreach($aVendors as $sVendor => $aItems) {
            $aIds = $aCounts = array();
            foreach($aItems as $aItem) {
                $aIds[] = $aItem['item_id'];
                $aCounts[$aItem['item_id']] = $aItem['item_count'];
            }

            $aProducts = $oJson->load($this->sStoreDataUrlPublic . 'json_browse_selected', array('products' => base64_encode(json_encode($aIds)), 'client' => $this->iClient, 'key' => $this->sClientKey));
            if(!empty($aProducts))
                $aResult[$sVendor] = array(
                    'ids' => $aIds,
                    'counts' => $aCounts,
                    'products' => $aProducts
                );
        }

        return $aResult;
    }

    protected function loadDownloaded()
    {
        $oInstallerUtils = BxDolStudioInstallerUtils::getInstance();

        return array(
            'modules' => $oInstallerUtils->getModules(),
            'updates' => $oInstallerUtils->getUpdates()
        );
    }

    protected function loadProduct($sModuleName)
    {
        $sVersion = bx_get_ver();

        return BxDolStudioJson::getInstance()->load($this->sStoreDataUrlPublic . 'json_get_product_by_name', array(
            'value' => $sModuleName, 
            'client' => $this->iClient, 
            'key' => $this->sClientKey,
            'version' => $sVersion
        ));
    }

    protected function loadLocalProduct($sModuleName)
    {
        $aModules = BxDolStudioInstallerUtils::getInstance()->getModules(false);

        return isset($aModules[$sModuleName]) && is_array($aModules[$sModuleName])
            ? $aModules[$sModuleName]
            : array();
    }

    /*
     * Load package (module, update) using OAuth authorization.
     */
    protected function loadFile($iFileId)
    {
        return BxDolStudioInstallerUtils::getInstance()->downloadFileAuthorized($iFileId);
    }

    /*
     * Load update's package publicly.
     */
    protected function loadUpdate($sModuleName, $bApplyUpdate = false)
    {
        return BxDolStudioInstallerUtils::getInstance()->downloadUpdatePublic($sModuleName, $bApplyUpdate);
    }

    protected function getBaseUrl($mixedParams = array())
    {
        if(is_string($mixedParams))
            $mixedParams = array('page' => $mixedParams);

        return bx_append_url_params($this->sBaseUrl, $mixedParams);
    }

    private function checkoutCart($iVendor)
    {
        $oCart = BxDolStudioCart::getInstance();

        $aItems = $oCart->getByVendor($iVendor);
        if(empty($aItems) || !is_array($aItems))
            return false;

        $aIds = array();
        foreach($aItems as $aItem)
            $aIds[] = $aItem['item_id'];

        $sSid = bx_site_hash();
        return $this->sStoreDataUrlPublic . 'purchase/' . $iVendor . '?sid=' . $sSid . '&products=' . base64_encode(implode(',', $aIds));
    }

	private function subscribe($iVendor, $iItem)
    {
        $sSid = bx_site_hash();
        return $this->sStoreDataUrlPublic . 'subscribe/' . $iVendor . '/'. $iItem . '?sid=' . $sSid;
    }
}

/** @} */
