<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaView UNA Studio Representation classes
 * @ingroup     UnaStudio
 * @{
 */

class BxBaseStudioStore extends BxDolStudioStore
{
    protected $iPerPageDefault = 24;

    function __construct($sPage = "")
    {
        parent::__construct($sPage);
    }

    function getPageCss()
    {
        return array_merge(parent::getPageCss(), array(BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'fancybox/|jquery.fancybox.css', 'module.css', 'store.css'));
    }

    function getPageJs()
    {
    	BxDolStudioTemplate::getInstance()->addJsTranslation(array('_adm_btn_queued_submit'));
        return array_merge(parent::getPageJs(), array('fancybox/jquery.fancybox.pack.js', 'store.js'));
    }

    function getPageJsObject()
    {
        return 'oBxDolStudioStore';
    }

    function getPageMenu($aMenu = array(), $aMarkers = array())
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aMenu = [];
        $aMenuItems = [
            'goodies' => ['icon' => 'mi-str-home.svg'],
            'latest' => ['icon' => 'mi-str-latest.svg'],
            'featured' => ['icon' => 'mi-str-featured.svg'],
            'popular' => ['icon' => 'mi-str-popular.svg'],
            'categories' => ['icon' => 'mi-str-categories.svg'],
            'search' => ['icon' => 'mi-str-search.svg'],
            'purchases' => ['icon' => 'mi-str-purchases.svg'], 
            'updates' => ['icon' => 'mi-str-updates.svg'], 
            'checkout' => ['icon' => 'mi-str-checkout.svg', 'title' => '_adm_lmi_ttl_checkout'], 
            'downloaded' => ['icon' => 'mi-str-downloaded.svg']
        ];
        foreach($aMenuItems as $sMenuItem => $aItem)
            $aMenu[] = [
                'name' => $sMenuItem,
                'icon' => $aItem['icon'],
                'icon_bg' => true,
                'link' => $this->getBaseUrl($sMenuItem),
                'title' => _t('_adm_lmi_cpt_' . $sMenuItem),
                'title_attr' => !empty($aItem['title']) ? _t($aItem['title']) : '',
                'selected' => $sMenuItem == $this->sPage
            ];

        $iCounter = BxDolStudioCart::getInstance()->getCount();

        $aMarkers = array(
            'checkout_counter' => $oTemplate->parseHtmlByName('menu_side_counter.html', array(
                'bx_if:hide_counter' => array(
                    'condition' => $iCounter <= 0,
                    'content' => array()
                ),
                'counter' => $iCounter
            ))
        );

        return parent::getPageMenu($aMenu, $aMarkers);
    }

    function getPageCode($sPage = '', $bWrap = true)
    {
        $sResult = parent::getPageCode($sPage, $bWrap);
        if($sResult === false)
            return false;

        $sMethod = 'get' . ucfirst($this->sPage) . 'List';
        if(!method_exists($this, $sMethod))
            return '';

        return $this->$sMethod() . $sResult;
    }

    function getPageContent()
    {
        $sMethod = 'get' . ucfirst($this->sPage) . 'List';
        if(!method_exists($this, $sMethod))
            return '';

        return $this->$sMethod(false);
    }

    protected function getGoodiesList()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $mixedResult = $this->authorizeClient();
        if($mixedResult === true) {
            $aProducts = $this->loadGoodies();

            $sContent = "";
            $sContent .= $this->displayNonOwnerNotification();

            $sContent .= $this->getBlocksLine(array(
                array(
                    'caption' => '_adm_block_cpt_categories',
                        'actions' => array(),
                    'items' => $this->getCategoriesList(false)
                ),
                array(
                    'caption' => '_adm_block_cpt_tags',
                        'actions' => array(),
                    'items' => $this->getTagsList(false)
                )
            ));

            foreach($aProducts as $aBlock) {
                $aBlock['items'] = $oTemplate->parseHtmlByName('str_products.html', array(
                    'list' => $this->displayProducts($aBlock['items']),
                    'paginate' => ''
                ));

                $sContent .= $this->getBlockCode($aBlock);
            }
        }
        else
        	$sContent = $this->getBlockCode(array(
                'caption' => '_adm_block_cpt_goodies',
                'items' => $mixedResult,
            ));

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $sContent
        ));
    }

    protected function getLatestList($bWrapInBlock = true)
    {
        return $this->getBrowsingList('latest', $bWrapInBlock);
    }

    protected function getFeaturedList($bWrapInBlock = true)
    {
        return $this->getBrowsingList('featured', $bWrapInBlock);
    }

    protected function getPopularList($bWrapInBlock = true)
    {
        return $this->getBrowsingList('popular', $bWrapInBlock);
    }

    protected function getBrowsingList($sType, $bWrapInBlock = true)
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $mixedResult = $this->authorizeClient();
        if($mixedResult === true) {
	        $iStart = (int)bx_get('str_start');
	        $iPerPage = (int)bx_get('str_per_page');
	        if(empty($iPerPage))
	            $iPerPage = $this->iPerPageDefault;

	        $aProducts = $this->{'load' . bx_gen_method_name($sType)}($iStart, $iPerPage + 1);

	        $oPaginate = new BxTemplPaginate(array(
	            'start' => $iStart,
	            'per_page' => $iPerPage,
	            'on_change_page' => $sJsObject . ".changePagePaginate(this, '" . $sType . "', null, {start}, {per_page})"
	        ));
	        $oPaginate->setNumFromDataArray($aProducts);

	        $sContent = $oTemplate->parseHtmlByName('str_products.html', array(
	            'list' => $this->displayProducts($aProducts),
	            'paginate' => $oPaginate->getSimplePaginate()
	        ));
        }
        else 
            $sContent = $mixedResult;

		if(!$bWrapInBlock)
			return $sContent;

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $this->getBlockCode(array(
				'caption' => '_adm_block_cpt_' . $sType,
				'items' => $sContent
			))
        ));
    }

    protected function getCategoriesList($bWrapInBlock = true)
    {
        return $this->getLabelsList('categories', $bWrapInBlock);
    }

    protected function getCategoryList($bWrapInBlock = true)
    {
        $sKey = 'value';
        if(bx_get($sKey) === false)
            $sKey = 'str_value';

        $aValue = array();
        $aValue['value'] = (int)bx_get($sKey);
        if(bx_get('title') !== false)
            $aValue['title'] = bx_process_input(urldecode(bx_get('title')));

        return $this->getLabelList('category', $aValue, $bWrapInBlock);
    }

    protected function getTagsList($bWrapInBlock = true)
    {
        return $this->getLabelsList('tags', $bWrapInBlock);
    }

    protected function getTagList($bWrapInBlock = true)
    {
        $sKey = 'value';
        if(bx_get($sKey) === false)
            $sKey = 'str_value';

        return $this->getLabelList('tag', bx_process_input(bx_get($sKey)), $bWrapInBlock);
    }

    protected function getLabelsList($sType, $bWrapInBlock = true)
    {
        $mixedResult = $this->authorizeClient();
        if($mixedResult === true) {
            $aLabels = $this->{'load' . bx_gen_method_name($sType)}();
            $sContent = $this->{'display' . bx_gen_method_name($sType)}($aLabels);
        }
        else 
            $sContent = $mixedResult;

    	if(!$bWrapInBlock)
			return $sContent;

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('store.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => $this->getBlockCode(array(
				'caption' => '_adm_block_cpt_' . $sType,
				'items' => $sContent
			))
        ));
    }

    protected function getLabelList($sType, $mixedValue, $bWrapInBlock = true)
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $iStart = (int)bx_get('str_start');
        $iPerPage = (int)bx_get('str_per_page');
        if(empty($iPerPage))
            $iPerPage = $this->iPerPageDefault;

        $bArray = is_array($mixedValue);
        $sValue = $bArray ? $mixedValue['value'] : $mixedValue;
        $sTitle = $bArray && !empty($mixedValue['title']) ? $mixedValue['title'] : $sValue;

		$sMethod = 'load' . bx_gen_method_name($sType);
        $aProducts = $this->$sMethod($sValue, $iStart, $iPerPage + 1);

        $oPaginate = new BxTemplPaginate(array(
            'start' => $iStart,
            'per_page' => $iPerPage,
            'on_change_page' => $sJsObject . ".changePagePaginate(this, '" . $sType . "', '" . $sValue . "', {start}, {per_page})"
        ));
        $oPaginate->setNumFromDataArray($aProducts);

        $sContent = $oTemplate->parseHtmlByName('str_products.html', array(
            'list' => $this->displayProducts($aProducts),
            'paginate' => $oPaginate->getSimplePaginate()
        ));

        if(!$bWrapInBlock)
            return $sContent;

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $this->getBlockCode(array(
				'caption' => array('_adm_block_cpt_' . $sType, $sTitle),
				'items' => $sContent,
			))
        ));
    }

    protected function getSearchList($bWrapInBlock = true)
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $mixedResult = $this->authorizeClient();
        if($mixedResult === true) {
            //--- Search form
            $aForm = array(
                'form_attrs' => array(
                    'id' => 'adm-str-search-form',
                    'name' => 'adm-str-search-form',
                    'action' => '',
                    'method' => 'post'
                ),
                'params' => array(
                    'db' => array(
                        'table' => '',
                        'key' => '',
                        'uri' => '',
                        'uri_title' => '',
                        'submit_name' => 'search'
                    ),
                ),
                'inputs' => array(
                    'page' => array(
                        'type' => 'hidden',
                        'name' => 'page',
                        'value' => $this->sPage
                    ),
                    'keyword' => array(
                        'type' => 'text',
                        'name' => 'keyword',
                        'caption' => '',
                        'value' => '',
                        'attrs' => array(
                            'placeholder' => bx_html_attribute(_t('_sys_search_placeholder'))
                        ),
                        'db' => array (
                            'pass' => 'Xss',
                        )
                    ),
                    'search' => array(
                        'type' => 'submit',
                        'name' => 'search',
                        'value' => _t('_adm_btn_store_search'),
                    )
                )
            );
    
            $oForm = new BxTemplStudioFormView($aForm);
            $oForm->initChecker();
    
            $sResults = '';
            if($oForm->isSubmittedAndValid()) {
                $sKeyword = $oForm->getCleanValue('keyword');

                $iStart = (int)bx_get('str_start');
    	        $iPerPage = (int)bx_get('str_per_page');
    	        if(empty($iPerPage))
    	            $iPerPage = 999;
    
    	        $aProducts = $this->loadSearch($sKeyword, $iStart, $iPerPage + 1);
	            $sResults = empty($aProducts) || !is_array($aProducts) ? MsgBox(_t('_Empty')) : $oTemplate->parseHtmlByName('str_products.html', array(
    	            'list' => $this->displayProducts($aProducts),
    	            'paginate' => ''
    	        ));
            }         

            $sContent = $oTemplate->parseHtmlByName('str_search.html', array(
                'form' => $oForm->getCode(),
                'bx_if:show_results' => array(
                    'condition' => !empty($sResults),
                    'content' => array(
                        'results' => $sResults
                    )
                )
            ));
        }
        else 
            $sContent = $mixedResult;

        if(!$bWrapInBlock)
			return $sContent;

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $this->getBlockCode(array(
				'caption' => '_adm_block_cpt_search',
				'items' => $sContent
			))
        ));
    }

    protected function getPurchasesList()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();

        $aProducts = $this->loadPurchases();
        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => $this->getBlockCode(array(
				'caption' => '_adm_block_cpt_purchases',
				'items' => $oTemplate->parseHtmlByName('str_products.html', array(
		            'list' => $this->displayProducts($aProducts),
		            'paginate' => ''
		        ))
			))
        ));
    }

    protected function getUpdatesList()
    {
    	$oTemplate = BxDolStudioTemplate::getInstance();

        $aUpdates = $this->loadUpdates();
        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => $this->getBlockCode(array(
				'caption' => '_adm_block_cpt_updates',
				'items' => $oTemplate->parseHtmlByName('str_products.html', array(
		            'list' => $this->displayUpdates($aUpdates),
		            'paginate' => ''
		        ))
			))
        ));
    }

    protected function getCheckoutList()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        //--- Empty cart by vendor if the payment was accepted.
        $mixedVendor = bx_get('vendor');
        $mixedProducts = bx_get('products');
        if($mixedVendor !== false && $mixedProducts !== false) {
            $oCart = BxDolStudioCart::getInstance();

            $aProducts = explode(',', base64_decode($mixedProducts));
            foreach($aProducts as $iId)
                $oCart->delete($mixedVendor, $iId);

            return $this->getMessage('_adm_block_cpt_checkout', '_adm_msg_modules_success_checkouted');
        }

        $aVendors = $this->loadCheckout();
        if(empty($aVendors))
            return $this->getMessage('_adm_block_cpt_checkout', '_Empty');        

        $sContent = '';
        foreach($aVendors as $iVendor => $aInfo) {
            $fTotal = 0;
            $sVendor = $sCurrency = '';
            if(!empty($aInfo['products']) && is_array($aInfo['products']))
                foreach($aInfo['products'] as $aProduct) {
                    $iCount = isset($aInfo['counts'][$aProduct['id']]) ? (int)$aInfo['counts'][$aProduct['id']] : 1;
                    $fTotal += $iCount * $aProduct['price_single'];

                    if($sVendor == '' && isset($aProduct['author_name']))
                        $sVendor = $aProduct['author_name'];

                                    if($sCurrency == '' && isset($aProduct['author_currency_sign']))
                        $sCurrency = $aProduct['author_currency_sign'];
                }

            $aMenu = array(
                array('id' => 'checkout-' . $iVendor, 'name' => 'checkout-' . $iVendor, 'link' => 'javascript:void(0)', 'onclick' => $sJsObject . ".checkoutCart(" . $iVendor . ", this);", 'target' => '_self', 'title' => '_adm_action_cpt_checkout', 'active' => 1),
                array('id' => 'delete-all-' . $iVendor, 'name' => 'delete-all-' . $iVendor, 'link' => 'javascript:void(0)', 'onclick' => $sJsObject . ".deleteAllFromCart(" . $iVendor . ", this)", 'target' => '_self', 'title' => '_adm_action_cpt_delete_all', 'active' => 1)
            );
	        $oMenu = new BxTemplMenu(array('object'=> 'adm-std-checkout', 'template' => 'menu_buttons_hor.html', 'menu_items' => $aMenu));

	        $sContent .= $this->getBlockCode(array(
                'caption' => _t('_adm_block_cpt_checkout_by_vendor_csign', $sVendor, $sCurrency, $fTotal),
                'items' => $oTemplate->parseHtmlByName('str_products.html', array(
		            'list' => $this->displayProducts($aInfo['products'], array('is_shopping_cart' => true, 'counts' => $aInfo['counts'])),
		            'paginate' => ''
		        )),
                'panel_bottom' => $oMenu->getCode()
            ));
        }

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $sContent
        ));
    }

    protected function getDownloadedList()
    {
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sContent = $sModules = $sUpdates = "";
        $aProducts = $this->loadDownloaded();

        //--- Prepare modules.
        $bCacheImage = getParam('sys_template_cache_image_enable') == 'on';
        foreach($aProducts['modules'] as $aModule) {
            $sIcon = BxDolStudioUtils::getModuleIcon($aModule, 'store');
            $bIcon = ($bCacheImage && substr($sIcon, 0, 10) == 'data:image') || strpos($sIcon, '.') !== false;

            $bInstalled = $aModule['installed'];
            $bQueued = !$bInstalled && $this->oDb->isQueued('action', $aModule['dir']);

            $sModules .= $oTemplate->parseHtmlByName('str_product_v1.html', array(
                'js_object' => $sJsObject,
             	'name' => $aModule['name'],
            	'bx_if:no_icon' => array (
                    'condition' => !$bIcon,
                    'content' => array(
                            'icon' => $sIcon
                    ),
                ),
                'bx_if:icon' => array (
                    'condition' => $bIcon,
                    'content' => array(
                            'icon_url' => $sIcon,
                    ),
                ),
                'title' => $aModule['title'],
                'vendor' => strtolower($aModule['vendor']) == 'boonex' ? 'UNA INC' : $aModule['vendor'],
                'version' => $aModule['version'],
                'dir' => $aModule['dir'],
                'bx_if:hide_install' => array(
                    'condition' => $bInstalled || $bQueued,
                    'content' => array()
                ),
                'bx_if:hide_queued' => array(
                    'condition' => !$bQueued,
                    'content' => array()
                ),
                'bx_if:hide_installed' => array(
                    'condition' => !$bInstalled || $bQueued,
                    'content' => array()
                )
            ));
        }

        //--- Prepare updates.
        foreach($aProducts['updates'] as $aUpdate) {
            $sIcon = BxDolStudioUtils::getModuleIcon(array('type' => $aUpdate['module_type'], 'name' => $aUpdate['module_name'], 'dir' => $aUpdate['module_dir']), 'store');
            $bIcon = ($bCacheImage && substr($sIcon, 0, 10) == 'data:image') || strpos($sIcon, '.') !== false;

            $sUpdates .= $oTemplate->parseHtmlByName('str_update_v1.html', array(
                'js_object' => $sJsObject,
            	'name' => $aUpdate['module_name'],
            	'bx_if:no_icon' => array (
                    'condition' => !$bIcon,
                    'content' => array(
                        'icon' => $sIcon
                    ),
                ),
                'bx_if:icon' => array (
                    'condition' => $bIcon,
                    'content' => array(
                        'icon_url' => $sIcon,
                    ),
                ),
                'title' => $aUpdate['title'],
                'vendor' => strtolower($aUpdate['vendor']) == 'boonex' ? 'UNA INC' : $aUpdate['vendor'],
                'versions' => _t('_adm_str_txt_update_from_to', $aUpdate['version_from'], $aUpdate['version_to']),
                'dir' => $aUpdate['dir']
            ));
        }

        if(!empty($sModules))
            $sContent .= $this->getBlockCode(array(
                'type' => BX_DB_DEF,
                'caption' => '_adm_block_cpt_downloaded_modules',
                'items' => $oTemplate->parseHtmlByName('str_products.html', array(
                    'list' => $sModules,
                    'paginate' => ''
                )),
            ));

        if(!empty($sUpdates))
            $sContent .= $this->getBlockCode(array(
                'type' => BX_DB_DEF,
                'caption' => '_adm_block_cpt_downloaded_updates',
                'items' => $oTemplate->parseHtmlByName('str_products.html', array(
                    'list' => $sUpdates,
                    'paginate' => ''
                )),
            ));

        return $oTemplate->parseHtmlByName('store.html', array(
            'js_object' => $sJsObject,
            'content' => $sContent
        ));
    }

    protected function getMessage($sCaption, $sContent, $aActions = array())
    {
        return BxDolStudioTemplate::getInstance()->parseHtmlByName('store.html', array(
            'js_object' => $this->getPageJsObject(),
            'content' => $this->getBlockCode(array(
				'caption' => $sCaption,
        		'actions' => $aActions,
				'items' => MsgBox(_t($sContent))
			))
        ));
    }

    protected function getProduct($sModuleName)
    {
        $bShowRating = true;
        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aProduct = $this->loadProduct($sModuleName);
        if(empty($aProduct) || !is_array($aProduct))
            return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => (!empty($aProduct) ? $aProduct : _t('_adm_str_err_no_product_info')));

		$aDownloaded = $this->getDownloadedModules(false);

        $bFree = (int)$aProduct['is_free'] == 1;
        $bPurchased = (int)$aProduct['is_purchased'] == 1;

        $bPurchaseSingle = !$bFree && !$bPurchased && (float)$aProduct['price_single'] != 0;
		$bInCart = $bPurchaseSingle && BxDolStudioCart::getInstance()->exists($aProduct['author_id'], $aProduct['id']);

		$bPurchaseRecurring = !$bFree && !$bPurchased && (float)$aProduct['price_recurring'] != 0;

        $bDownloadable = (int)$aProduct['is_file'] == 1;
        $bDownloaded = array_key_exists($sModuleName, $aDownloaded);
        $bDownload = ($bFree || $bPurchased) && $bDownloadable;

        $bDiscount = !empty($aProduct['discount_single']);
        $sVersion = $bDownloaded && version_compare(strtolower($aDownloaded[$sModuleName]['version']), strtolower($aProduct['version'])) != 0 ? _t('_adm_str_txt_pv_version_mask', $aDownloaded[$sModuleName]['version'], $aProduct['version']) : $aProduct['version'];

        $iScreenshots = 0;
        $aScreenshots = array();
        $bScreenshots = is_array($aProduct['screenshots']) && !empty($aProduct['screenshots']);
        if($bScreenshots) {
            $iScreenshots = count($aProduct['screenshots']);
            foreach($aProduct['screenshots'] as $aScreenshot)
                $aScreenshots[] = array(
                    'view_url' => $aProduct['url'],
                    'image_url' => $aScreenshot['big'],
                    'image_alt' => bx_html_attribute(_t('_adm_str_txt_pv_screenshot', $aProduct['title']))
                );
        }

		$bTmplVarsRate = $bShowRating;
		if($bTmplVarsRate)
		    $aTmplVarsRate = array(
		        'rate' => $this->getVoteStars($aProduct)
		    );

		$aTmplVarsVotes = array();
		$bTmplVarsVotes = $bShowRating && (int)$aProduct['votes_cnt'] > 0;
		if($bTmplVarsVotes)
		    $aTmplVarsVotes = array(
		        'count' => (int)$aProduct['votes_cnt']
		    );

        $sContent = $oTemplate->parseHtmlByname('str_product_view.html', array(
            'id' => $aProduct['id'],
            'title' => $aProduct['title'],
            'url' => $aProduct['url'],
            'author_name' => $aProduct['author_name'],
            'author_url' => $aProduct['author_url'],
            'version' => $sVersion,
        	'bx_if:show_price_single' => array(
        		'condition' => $bFree || (float)$aProduct['price_single'] != 0,
        		'content' => array(
        			'price_single' => !$bFree ? _t('_adm_str_txt_price_single', $aProduct['author_currency_sign'], $aProduct['price_single']) : _t('_adm_str_txt_price_free'),
		        	'bx_if:show_discount' => array(
		                'condition' => !$bFree && $bDiscount,
		                'content' => array(
		                    'discount_single' => $bDiscount ? _t('_adm_str_txt_pv_discount_off_csign', $aProduct['discount_single']['percent'], $aProduct['author_currency_sign'], $aProduct['discount_single']['save']) : ''
		                )
		            )
        		)
        	),
        	'bx_if:show_price_recurring' => array(
				'condition' => (float)$aProduct['price_recurring'] != 0,
        		'content' => array(
					'price_recurring' => _t('_adm_str_txt_price_recurring', $aProduct['author_currency_sign'], $aProduct['price_recurring'], _t('_adm_str_txt_per_' . $aProduct['duration_recurring']))
        		)
        	),
        	'bx_if:show_rate' => array(
                'condition' => $bTmplVarsRate,
                'content' => $aTmplVarsRate
            ),
            'bx_if:show_votes' =>  array(
                'condition' => $bTmplVarsVotes,
                'content' => $aTmplVarsVotes
            ),
            'category' => $aProduct['category'],
            'category_url' => $aProduct['category_url'],
            'tags' => implode(', ', explode(',', $aProduct['tags'])),
            'reviews' => _t('_adm_str_txt_pv_stats_reviews', $aProduct['reviews_cnt']),
            'reviews_url' => $aProduct['reviews_url'],
            'votes' => _t('_adm_str_txt_pv_stats_votes', $aProduct['votes_cnt']),
            'views' => _t('_adm_str_txt_pv_stats_views', $aProduct['views_cnt']),
            'created' => bx_time_js($aProduct['created']),
            'updated' => bx_time_js($aProduct['updated']),
            'description' => $aProduct['description'],
            'bx_if:show_screenshots' => array(
                'condition' => $bScreenshots,
                'content' => array(
                    'width' => 222 * $iScreenshots - 20,
                    'bx_repeat:screenshots' => $aScreenshots
                )
            ),
            'bx_if:show_purchase' => array(
            	'condition' => $bPurchaseSingle || $bPurchaseRecurring,
            	'content' => array(
            		'bx_if:show_purchase_single' => array(
		                'condition' => $bPurchaseSingle && !$bInCart,
		                'content' => array(
		                    'js_object' => $sJsObject,
		                    'id' => $aProduct['id'],
		                    'vendor_id' => $aProduct['author_id'],
		            		'price_single' => _t('_adm_str_txt_price_single', $aProduct['author_currency_sign'], $aProduct['price_single'])
		                )
		            ),
		            'bx_if:show_checkout_single' => array(
						'condition' => $bPurchaseSingle,
						'content' => array(
							'js_object' => $sJsObject,
							'id' => $aProduct['id'],
							'vendor_id' => $aProduct['author_id'],
							'bx_if:show_as_hidden' => array(
								'condition' => !$bInCart,
								'content' => array()
							)
						)
					),
					'bx_if:show_purchase_recurring' => array(
						'condition' => $bPurchaseRecurring,
						'content' => array(
							'js_object' => $sJsObject,
							'id' => $aProduct['id'],
							'vendor_id' => $aProduct['author_id'],
							'price_recurring' => _t('_adm_str_txt_price_recurring', $aProduct['author_currency_sign'], $aProduct['price_recurring'], _t('_adm_str_txt_per_' . $aProduct['duration_recurring']))
						)
					)
            	)
            ),
            'bx_if:show_download' => array(
                'condition' => $bDownload && !$bDownloaded,
                'content' => array(
                    'js_object' => $sJsObject,
                    'file_id' => $aProduct['file_id'],
                )
            ),
            'bx_if:show_download_disabled' => array(
				'condition' => $bDownload && $bDownloaded,
				'content' => array()
			),
        ));

        return [
            'code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 
            'message' => '', 
            'popup' => BxTemplStudioFunctions::getInstance()->popupBox('bx-std-str-popup-product', $aProduct['title'], $sContent, true), 
            'screenshots' => $iScreenshots
        ];
    }

    protected function getFile($iFileId)
    {
        $mixedResult = $this->loadFile($iFileId);
        if($mixedResult === true)
        	return array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => _t('_adm_str_msg_download_successfully'));

        if(is_string($mixedResult))
			return array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => (!empty($mixedResult) ? $mixedResult : _t('_adm_str_err_download_failed')));

		if(is_array($mixedResult))
			return array_merge(array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_str_err_download_failed')), $mixedResult);
    }

    protected function getUpdate($sModuleName, $bApplyUpdate = false)
    {
        $aResult = array();

        $mixedResult = $this->loadUpdate($sModuleName, $bApplyUpdate);
        if($mixedResult === true)
            $aResult = array('code' => BX_DOL_STUDIO_IU_RC_SUCCESS, 'message' => _t('_adm_str_msg_download' . ($bApplyUpdate ? '_and_install' : '') . '_successfully'));
        else if(is_string($mixedResult))
            $aResult = array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => (!empty($mixedResult) ? $mixedResult : _t('_adm_str_err_download_failed')));
        else if(is_array($mixedResult))
            $aResult = array_merge(array('code' => BX_DOL_STUDIO_IU_RC_FAILED, 'message' => _t('_adm_str_err_download_failed')), $mixedResult);

        $aResult['reload'] = 3000;
        return $aResult;
    }

    protected function displayProducts($mixedItems, $aParams = array())
    {
        $bShowRating = false;

        if(!is_array($mixedItems))
            return MsgBox($mixedItems);

        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $aDownloaded = $this->getDownloadedModules();
        $bShoppingCart = isset($aParams['is_shopping_cart']) && $aParams['is_shopping_cart'];

        $sResult = '';
        foreach($mixedItems as $aItem) {
            $bFree = (int)$aItem['is_free'] == 1;
            $bPurchased = (int)$aItem['is_purchased'] == 1;

            $bPurchaseSingle = !$bShoppingCart && !$bFree && !$bPurchased && (float)$aItem['price_single'] != 0;
            $bInCart = $bPurchaseSingle && BxDolStudioCart::getInstance()->exists($aItem['author_id'], $aItem['id']);

            $bPurchaseRecurring = !$bShoppingCart && !$bFree && !$bPurchased && (float)$aItem['price_recurring'] != 0;

            $bDownloadable = (int)$aItem['is_file'] == 1;
            $bDownloaded = in_array($aItem['name'], $aDownloaded);
            $bDownload = !$bShoppingCart && ($bFree || $bPurchased) && $bDownloadable;
            $bQueued = $this->oDb->isQueued('download', $aItem['name']);

            $sPrice = !$bFree ? _t('_adm_str_txt_price_single', $aItem['author_currency_sign'], $aItem['price_single']) : _t('_adm_str_txt_price_free');
            $sDiscount = !$bFree && !empty($aItem['discount_single']) ? _t('_adm_str_txt_discount_csign', $aItem['author_currency_sign'], $aItem['discount_single']['price']) : '';

            $sIcon = !empty($aItem['thumbnail']['small']) ? $aItem['thumbnail']['small'] : BxDolStudioUtils::getIconDefault(BX_DOL_MODULE_TYPE_MODULE);
            $bIcon = strpos($sIcon, '.') !== false;

            $sImage = '';
            $bImage = $bImageRaw = false;
            if(empty($aItem['cover_raw'])) {
                if(!empty($aItem['cover']['medium']))
                    $sImage = $aItem['cover']['medium'];
                else if(!empty($aItem['cover']['large']))
                    $sImage = $aItem['cover']['large'];
                else if(!empty($aItem['cover']['big']))
                    $sImage = $aItem['cover']['big'];
                
                $bImage = !empty($sImage) && strpos($sImage, '.') !== false;
            }
            else {
                $sImage = $aItem['cover_raw'];
                $bImageRaw = true;
            }

            $aTmplVarsRate = array();
            $bTmplVarsRate = $bShowRating && !$bShoppingCart;
            if($bTmplVarsRate)
                $aTmplVarsRate = array(
                    'rate' => $this->getVoteStars($aItem)
                );

            $aTmplVarsVotes = array();
            $bTmplVarsVotes = $bShowRating && !$bShoppingCart && (int)$aItem['votes_cnt'] > 0;
            if($bTmplVarsVotes)
                $aTmplVarsVotes = array(
                    'count' => (int)$aItem['votes_cnt']
                );

            $sResult .= $oTemplate->parseHtmlByName('str_product_v2.html', array(
                'js_object' => $sJsObject,
                'id' => $aItem['id'],
            	'name' => $aItem['name'],
                'url' => $aItem['url'],
            	'description_plain_attr' => bx_html_attribute($aItem['description_plain']),
            	'bx_if:no_icon' => array (
	                'condition' => !$bIcon,
	                'content' => array(
            			'icon' => $sIcon
            		),
	            ),
                'bx_if:icon' => array (
	                'condition' => $bIcon,
	                'content' => array(
	                	'icon_url' => $sIcon,
	            	),
	            ),
                'bx_if:no_image' => array (
	                'condition' => !$bImage && !$bImageRaw,
	                'content' => array(
            			'description_plain' => $aItem['description_plain'],
	                	'strecher' => mb_strlen($aItem['description_plain']) > 240 ? '' : str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', round((240 - mb_strlen($aItem['description_plain'])) / 6))
            		),
	            ),
                'bx_if:image' => array (
	                'condition' => $bImage,
	                'content' => array(
	                	'image_url' => $sImage,
	            		'strecher' => str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', 40)
	            	),
	            ),
                'bx_if:image_raw' => array (
	                'condition' => $bImageRaw,
	                'content' => array(
                            'image_raw' => $sImage,
	            	),
	            ),
                'title' => $aItem['title'],
                'bx_if:show_vendor' => array(
                    'condition' => !$bShoppingCart,
                    'content' => array(
                        'vendor_name' => $aItem['author_name'],
	            		'vendor_url' => $aItem['author_url'],
	            		'bx_if:show_version' => array(
	            			'condition' => !empty($aItem['file_version']),
	            			'content' => array(
	            				'version' => $aItem['file_version'],
	            			)
	            		),
                    )
                ),
                'bx_if:show_count_price' => array(
                    'condition' => $bShoppingCart,
                    'content' => array(
                        'count' => isset($aParams['counts'][$aItem['id']]) ? (int)$aParams['counts'][$aItem['id']] : 1,
                        'price_single' => $sPrice,
                        'discount_single' => $sDiscount,
                    )
                ),
                'bx_if:show_rate' => array(
                    'condition' => $bTmplVarsRate,
                    'content' => $aTmplVarsRate
                ),
                'bx_if:show_votes' =>  array(
                    'condition' => $bTmplVarsVotes,
                    'content' => $aTmplVarsVotes
                ),
                'bx_if:show_purchase_single' => array(
                    'condition' => $bPurchaseSingle && !$bInCart,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'id' => $aItem['id'],
                        'vendor_id' => $aItem['author_id'],
                		'price_single' => _t('_adm_str_txt_price_single', $aItem['author_currency_sign'], $aItem['price_single'])
                    )
                ),
                'bx_if:show_checkout_single' => array(
                    'condition' => $bPurchaseSingle,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'id' => $aItem['id'],
                        'vendor_id' => $aItem['author_id'],
                		'bx_if:show_as_hidden' => array(
                			'condition' => !$bInCart,
                			'content' => array()
                		)
                    )
                ),
                'bx_if:show_purchase_recurring' => array(
                	'condition' => $bPurchaseRecurring,
                	'content' => array(
                		'js_object' => $sJsObject,
                        'id' => $aItem['id'],
                        'vendor_id' => $aItem['author_id'],
                		'price_recurring' => _t('_adm_str_txt_price_recurring', $aItem['author_currency_sign'], $aItem['price_recurring'], _t('_adm_str_txt_per_' . $aItem['duration_recurring'] . '_short'))
                	)
                ),
                'bx_if:show_download' => array(
                    'condition' => $bDownload && !$bQueued && !$bDownloaded,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'file_id' => $aItem['file_id']
                    )
                ),
                'bx_if:show_download_disabled' => array(
					'condition' => $bDownload && !$bQueued && $bDownloaded,
					'content' => array()
				),
				'bx_if:show_queued_disabled' => array(
					'condition' => $bDownload && $bQueued && !$bDownloaded,
					'content' => array()
				),
                'bx_if:show_delete' => array(
                    'condition' => $bShoppingCart,
                    'content' => array(
                        'js_object' => $sJsObject,
                        'id' => $aItem['id'],
                        'vendor_id' => $aItem['author_id']
                    )
                )
            ));
        }

        return $sResult;
    }

    protected function displayUpdates($mixedItems, $aParams = array())
    {
        if(!is_array($mixedItems))
            return MsgBox($mixedItems);

		if(empty($mixedItems))
			return MsgBox(_t('_Empty'));

        $sJsObject = $this->getPageJsObject();
        $oTemplate = BxDolStudioTemplate::getInstance();

        $sResult = '';
        foreach($mixedItems as $aItem) {
            $bDownloadable = (int)$aItem['is_file'] == 1;
            $bQueued = $this->oDb->isQueued('download', $aItem['name']);

            $sIcon = !empty($aItem['thumbnail']['big']) ? $aItem['thumbnail']['big'] : BxDolStudioUtils::getIconDefault(BX_DOL_MODULE_TYPE_MODULE);
            $bIcon = strpos($sIcon, '.') !== false;

            $sImage = !empty($aItem['cover']['big']) ? $aItem['cover']['big'] : '';
            $bImage = strpos($sImage, '.') !== false;

            $sResult .= $oTemplate->parseHtmlByName('str_update_v2.html', array(
                'js_object' => $sJsObject,
                'id' => $aItem['id'],
            	'name' => $aItem['name'],
                'url' => $aItem['url'],
            	'bx_if:no_icon' => array (
	                'condition' => !$bIcon,
	                'content' => array(
            			'icon' => $sIcon
            		),
	            ),
                'bx_if:icon' => array (
	                'condition' => $bIcon,
	                'content' => array(
	                	'icon_url' => $sIcon,
	            	),
	            ),
            	'bx_if:no_image' => array (
	                'condition' => !$bImage,
	                'content' => array(
	                	'note' => $aItem['description_plain'],
	                	'strecher' => mb_strlen($aItem['description_plain']) > 240 ? '' : str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', round((240 - mb_strlen($aItem['description_plain'])) / 6))
            		),
	            ),
                'bx_if:image' => array (
	                'condition' => $bImage,
	                'content' => array(
						'image_url' => $sImage,
						'strecher' => str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ', 40)
	            	),
	            ),
                'title' => $aItem['title'],
                'vendor' => $aItem['author_name'],
                'versions' => _t('_adm_str_txt_update_from_to', $aItem['file_version'], $aItem['file_version_to']),
                'bx_if:show_download' => array(
                    'condition' => $bDownloadable && !$bQueued,
                    'content' => array(
                        'caption' => _t('_adm_btn_install_submit'),
                        'on_click' => $sJsObject . ".getUpdateAndInstall('" . $aItem['name'] . "', this)"
                    )
                ),
                'bx_if:show_queued_disabled' => array(
                    'condition' => $bDownloadable && $bQueued,
                    'content' => array()
                )
            ));
        }

        return $sResult;
    }

    protected function displayCategories($aCategories)
    {
        foreach($aCategories['bx_repeat:cats'] as $iKey => $aItem)
            $aCategories['bx_repeat:cats'][$iKey]['url'] = $this->getBaseUrl(array('page' => 'category', 'value' => $aItem['value'], 'title' => urlencode($aItem['name'])));

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('str_lbl_categories.html', $aCategories);
    }

    protected function displayTags($aTags)
    {
        foreach($aTags['bx_repeat:units'] as $iKey => $aItem)
            $aTags['bx_repeat:units'][$iKey]['href'] = $this->getBaseUrl(array('page' => 'tag', 'value' => $aItem['keyword']));

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('str_lbl_tags.html', $aTags);
    }

    protected function displayNonOwnerNotification()
    {
        if(BxDolStudioOAuth::isAuthorizedOwner())
            return;

        $oSession = BxDolSession::getInstance();
        if($oSession->getValue($this->sSessionKeyNonOwnerNotified) === true)
            return;

        $oSession->setValue($this->sSessionKeyNonOwnerNotified, true);
        return $this->getJsResultBy(array(
            'message' => '_adm_msg_oauth_non_owner_logged',
            'translate' => array(BX_DOL_MARKET_URL_ROOT),
            'on_page_load' => true
        ));
    }

    private function getDownloadedModules($bNamesOnly = true)
    {
		$aModules = BxDolStudioInstallerUtils::getInstance()->getModules(false);

        return $bNamesOnly ? array_keys($aModules) : $aModules;
    }

    private function getVoteStars($aItem)
    {
        $aTmplVarsStars = array();
        for($i = (int)$aItem['rate_min']; $i <= (int)$aItem['rate_max']; $i++)
            $aTmplVarsStars[] = array('value' => $i);

        return BxDolStudioTemplate::getInstance()->parseHtmlByName('str_vote_stars.html', array(
        	'id' => $aItem['id'],
        	'value' => (float)$aItem['rate'],
            'bx_repeat:stars' => $aTmplVarsStars,
            'bx_repeat:slider' => $aTmplVarsStars,
        ));
    }
}

/** @} */
