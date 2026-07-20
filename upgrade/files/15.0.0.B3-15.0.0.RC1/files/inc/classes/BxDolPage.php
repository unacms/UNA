<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Pages.
 *
 * It allows to display pages which are built from studio.
 *
 * The new system has the following page features:
 * - Layouts: page can have any structure, not just columns.
 * - SEO: page can have own SEO options, like meta tags and meta keywords, as well as instructions for search bots.
 * - Cache: page can be cached on the server.
 * - Access control: page access can be controlled using member levels.
 *
 *
 *
 * @section page_create Creating the Page object:
 *
 * 1. add record to 'sys_objects_page' table:
 *
 * - object: name of the page object, in the format: vendor prefix, underscore, module prefix, underscore, internal identifier or nothing; for example: bx_profiles_view - profile view page.
 * - title: name to display as page title.
 * - module: the module this page belongs to.
 * - layout_id: page layout to use, this is id of the record from 'sys_pages_layouts' table.
 * - visible_for_levels: bit field with set of member level ids. To use member level id in bit field - the level id minus 1 as power of 2 is used, for example:
 *      - user level id = 1 -> 2^(1-1) = 1
 *      - user level id = 2 -> 2^(2-1) = 2
 *      - user level id = 3 -> 2^(3-1) = 4
 *      - user level id = 4 -> 2^(4-1) = 8
 * - visible_for_levels_editable: it determines if 'visible_for_levels' field is editable from page builder, visibility options can be overriden by custom class and shouldn't be editable in this case.
 * - url: the page url, if it is static page.
 * - content_info: content info object name related to the content on the page,
 *                 if different from module name
 * - meta_description: meta description of the page.
 * - meta_keywords: meta keywords of the page.
 * - meta_robots: instructions for search bots.
 * - cache_lifetime: number of seconds to store cache for.
 * - cache_editable: it determines if cache can be edited from page builder.
 * - deletable: it determines if page can be deleted from page builder.
 * - override_class_name: user defined class name which is derived from BxTemplPage.
 * - override_class_file: the location of the user defined class, leave it empty if class is located in system folders.
 *
 * Page can select appropriate menu automatically if 'module' and 'object' fields in 'sys_objects_page' table are matched with 'module' and 'name' fields in 'sys_menu_items' table.
 *
 *
 * Page layout are stored in 'sys_pages_layouts' table:
 * - name: inner unique layout name.
 * - icon: layout icon to display in page builder, it should represent basic view of the layout to help studio operator determine the layout structure.
 * - title: layout name to display in page builder.
 * - template: template name to use to display page with certain layout.
 * - cells_number: number of areas in the layout, page blocks can be places into this areas(cells).
 * To define areas in the layout they should be named as '__cell_N__', where N is cell number, starting from 1.
 *
 *
 * 2. Add page blocks to 'sys_pages_blocks' table:
 * - object: page object name this block belongs to.
 * - cell_id: cell number in page layout to place block to.
 * - module: module name this block belongs to.
 * - title: block title.
 * - designbox_id: design box to use to diplay page block, it is id of the record from 'sys_pages_design_boxes' table.
 * - visible_for_levels: bit field with set of member level ids. To use member level id in bit field - the level id minus 1 as power of 2 is used, for example:
 *      - user level id = 1 -> 2^(1-1) = 1
 *      - user level id = 2 -> 2^(2-1) = 2
 *      - user level id = 3 -> 2^(3-1) = 4
 *      - user level id = 4 -> 2^(4-1) = 8
 * - type: block type
 *      - raw: HTML block, displayed in page builder as HTML textarea.
 *      - html: HTML block, displayed in page builder as visual editor, like TinyMCE.
 *      - lang: translatable language string, displayed in page builder as editable language key.
 *      - image: just an image, displayed in page builder as HTML upload form.
 *      - rss: RSS block, displayed in page builder as editable URL to RSS resource, along with number of displayed items.
 *      - menu: menu block, displayed as menu selector.
 *      - service: to display block content, the provided service method is used.
 * - content: depending on 'type' field:
 *      - raw: HTML string.
 *      - html: HTML string.
 *      - lang: language key.
 *      - image: image id in the storage and alignment (left, center, right) for example: 36\#center
 *      - rss: URL to RSS with number of displayed items, for example: http://www.example.com/rss#4
 *      - menu: menu object name.
 *      - service: serialized array of service call parameters: module - module name, method - service method name, params - array of parameters.
 * - deletable: is block deletable from page builder
 * - copyable: is block can be copied to any other page from page builder.
 * - order: block order in particular cell.
 *
 * Block design boxes are stored in 'sys_pages_design_boxes' table:
 * - id: consistent id, there are the following defines can be used in the code for each system block style:
 *      - 0 - BX_DB_CONTENT_ONLY: design box with content only - no borders, no background, no caption.
 *      - 1 - BX_DB_DEF: default design box with content, borders and caption.
 *      - 2 - BX_DB_EMPTY: just empty design box, without anything.
 *      - 3 - BX_DB_NO_CAPTION: design box with content, like BX_DB_DEF but without caption.
 *      - 10 - BX_DB_PADDING_CONTENT_ONLY: design box with content only wrapped with default padding - no borders, no background, no caption; it can be used to just wrap content with default padding.
 *      - 11 - BX_DB_PADDING_DEF: default design box with content wrapped with default padding, borders and caption.
 *      - 13 - BX_DB_PADDING_NO_CAPTION: design box with content wrapped with default padding, like BX_DB_DEF but without caption.
 * - title: block name which is displayed in studio, describes block styles.
 * - template: template name to use to display page block.
 *
 *
 * 3. Display Page.
 * Use the following sample code to display page:
 * @code
 *     $oPage = BxDolPage::getObjectInstance('sample'); // 'sample' is 'object' field from 'sys_objects_page' table, it automatically creates instance of default or custom class by object name
 *     if ($oPage)
 *         echo $oPage->getCode(); // print page
 * @endcode
 *
 */
class BxDolPage extends BxDolFactory implements iBxDolFactoryObject, iBxDolReplaceable
{
    protected static $_aBlockProcessing = [];

    protected $_sObject;
    protected $_aObject;
    protected $_oQuery;
    protected $_aMarkers = [];

    protected $_sForceRedirect = false;

    /**
     * Constructor
     * @param $aObject array of page options
     */
    protected function __construct($aObject)
    {
        parent::__construct();

        $this->_sObject = $aObject['object'];
        $this->_aObject = $aObject;
        $this->_oQuery = new BxDolPageQuery($this->_aObject);
    }

    /**
     * Get page object instance by Module name and page URI
     * @param $sModule module name
     * @param $sURI unique page URI
     * @return object instance or false on error
     */
    static public function getObjectInstanceByModuleAndURI($sModule, $sURI = '', $oTemplate = false)
    {
    	if(empty($sURI) && bx_get('i') !== false)
    		$sURI = bx_process_input(bx_get('i'));

    	if(empty($sURI))
			return false;

        $sObject = BxDolPageQuery::getPageObjectNameByURI($sURI, $sModule);
        return $sObject ? self::getObjectInstance($sObject, $oTemplate) : false;
    }

    /**
     * Get page object instance by page URI
     * @param $sURI unique page URI
     * @return object instance or false on error
     */
    static public function getObjectInstanceByURI($sURI = '', $oTemplate = false, $bRedirectCheck = false)
    {
        if(empty($sURI) && bx_get('i') !== false)
            $sURI = bx_process_input(bx_get('i'));

        if(empty($sURI))
            return false;

        $sObject = BxDolPageQuery::getPageObjectNameByURI($sURI);
        if($bRedirectCheck && !$sObject && '/' == substr($sURI, -1)) {
            unset($_GET['i']);

            header("HTTP/1.1 301 Moved Permanently");
            header('Location:' . bx_append_url_params(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . trim($sURI, '/'))), $_GET));
            exit;
        }

        if(!$sObject)
            return false;

        $oObject = self::getObjectInstance($sObject, $oTemplate);
        if(($sRedirectUrl = $oObject->getForceRedirect()) !== false) {
            if(!bx_is_api()) {
                header("Location: " . $sRedirectUrl);
                exit;
            }
            else 
                $oObject = bx_api_get_relative_url($sRedirectUrl);
        }

        return $oObject;
    }

    /**
     * Get page object instance by object name
     * @param $sObject object name
     * @return object instance or false on error
     */
    static public function getObjectInstance($sObject, $oTemplate = false)
    {
        if (isset($GLOBALS['bxDolClasses']['BxDolPage!'.$sObject]))
            return $GLOBALS['bxDolClasses']['BxDolPage!'.$sObject];

        $aObject = BxDolPageQuery::getPageObject($sObject);
        if (!$aObject || !is_array($aObject))
            return false;

        $sClass = 'BxTemplPage';
        if (!empty($aObject['override_class_name'])) {
            $sClass = $aObject['override_class_name'];
            if (!empty($aObject['override_class_file']))
                require_once(BX_DIRECTORY_PATH_ROOT . $aObject['override_class_file']);
        }

        $o = new $sClass($aObject, $oTemplate);

        return ($GLOBALS['bxDolClasses']['BxDolPage!'.$sObject] = $o);
    }

	/**
     * Process page triggers.
     * Page triggers allow to automatically add page blocks to modules with no different if dependant module was install before or after the module page block belongs to.
     * For example module "Notes" adds page blocks to all profiles modules (Persons, Organizations, etc)
     * with no difference if persons module was installed before or after "Notes" module was installed.
     * @param $sPageTriggerName trigger name to process, usually specified in module installer class - @see BxBaseModGeneralInstaller
     * @return always true, always success
     */
    static public function processPageTrigger ($sPageTriggerName)
    {
        // get list of active modules
        $aModules = BxDolModuleQuery::getInstance()->getModulesBy(array(
            'type' => 'modules',
            'active' => 1,
        ));

        // get list of page block triggers
        $aPageBlocks = BxDolPageQuery::getPageTriggers($sPageTriggerName);

        // check each page block trigger for all modules
        foreach ($aPageBlocks as $aPageBlock) {
            foreach ($aModules as $aModule) {
                if (!BxDolRequest::serviceExists($aModule['name'], 'get_page_object_for_page_trigger'))
                    continue;

				$mixedPageObject = BxDolService::call($aModule['name'], 'get_page_object_for_page_trigger', array($sPageTriggerName));
                if (!$mixedPageObject)
                    continue;

                $aPageBlockRow = $aPageBlock;

                if (is_array($mixedPageObject))
                    $aPageBlockRow = array_merge($aPageBlockRow, $mixedPageObject);
                else
                    $aPageBlockRow['object'] = $mixedPageObject;
                
                BxDolPageQuery::addPageBlockToPage($aPageBlockRow);
            }
        }

        return true;
    }

    static public function multisiteLinkCheck ($sLink, $sPageUri = '', $sPageModule = '', $aQueryParams = [])
    {
        $sMultisiteDomain = self::getMultisite($sLink, $sPageUri, $sPageModule, $aQueryParams);
        if ($sMultisiteDomain) {
            if (parse_url($sMultisiteDomain, PHP_URL_HOST) !== $_SERVER['HTTP_HOST'])
                return $sMultisiteDomain . $sLink;
        }

        if (!$sMultisiteDomain && parse_url(BX_MULTISITE_URL_MAIN, PHP_URL_HOST) !== $_SERVER['HTTP_HOST']) {
            return BX_MULTISITE_URL_MAIN . $sLink;
        }

        return false;

    }

	/**
     * Get multisite link
     * @param $sLink link to check
     * @return return multisite link if provided link is multisite, or false is other case
     */
    static public function getMultisite ($sLink, $sPageUri = '', $sPageModule = '', $aQueryParams = [])
    {
        $sMultisiteDomain = '';
        if (!$sPageModule || !$aQueryParams) {

            $sQuery = parse_url($sLink, PHP_URL_QUERY);
            if ($sQuery) {

                $aQueryParams = bx_parse_str($sQuery);
                $sPageUri = !empty($aQueryParams['i']) ? $aQueryParams['i'] : false;
                if ($sPageUri) {
                    $sPageName = BxDolPageQuery::getPageObjectNameByURI($sPageUri);
                    $aPage = $sPageName ? BxDolPageQuery::getPageObject($sPageName) : false;
                    $sPageModule = $aPage ? $aPage['module'] : '';
                }
            }
        }

        $sMultisiteDomain = '';
        if (!empty($aQueryParams['profile_id'])) {
            $oProfile = BxDolProfile::getInstance($aQueryParams['profile_id']);
            if (BX_MULTISITE_MODULE == $oProfile->getModule())
                $sMultisiteDomain = $oProfile->getDisplayName();
        }
        elseif (!empty($aQueryParams['id']) && $sPageModule) {
            $sContentInfo = !empty($aPage['content_info']) ? $aPage['content_info'] : $sPageModule;
            $oContentInfo = BxDolContentInfo::getObjectInstance($sContentInfo);
            if ($oContentInfo && BX_MULTISITE_MODULE == $sPageModule) {
                $sMultisiteDomain = $oContentInfo->getContentTitle($aQueryParams['id']);
            }
            elseif ($oContentInfo && BX_MULTISITE_MODULE != $sPageModule) {
                $iPrivacy = $oContentInfo->getContentPrivacy($aQueryParams['id']);
                if (0 > $iPrivacy) {
                    $oProfile = BxDolProfile::getInstance(abs($iPrivacy));
                    if ($oProfile && BX_MULTISITE_MODULE == $oProfile->getModule())
                        $sMultisiteDomain = $oProfile->getDisplayName();
                }
            }
        }

        if ($sMultisiteDomain)
            return str_replace('{domain}', mb_strtolower($sMultisiteDomain), BX_MULTISITE_URL_PATTERN);

        return false;
    }

	/**
     * Delete SEO link
     * @param $sModule module name
     * @param $sContentInfoObject content info object
     * @param $sId content id
     * @return number of affected rows
     */
    static public function deleteSeoLink ($sModule, $sContentInfoObject, $sId)
    {
        return BxDolPageQuery::deleteSeoLink($sModule, $sContentInfoObject, $sId);
    }

	/**
     * Delete SEO links by param
     * @param $sParamName GET param name
     * @param $sId content id
     * @return number of affected rows
     */
    static public function deleteSeoLinkByParam ($sParamName, $sId)
    {
        return BxDolPageQuery::deleteSeoLinkByParam($sParamName, $sId);
    }

	/**
     * Delete SEO links by module
     * @param $sModule module name
     * @return number of affected rows
     */
    static public function deleteSeoLinkByModule ($sModule)
    {
        return BxDolPageQuery::deleteSeoLinkByModule($sModule);
    }

	/**
     * Get page object by SEO link. It takes request part from SEO link and returns page object
     * @param $sRequest request URI with SEO link
     * @return false - if page wasn't found,  
     *         page object - on success,  
     *         string URL - if permanent redirect is needed
     */
    static public function getPageBySeoLink ($sRequest)
    {
        if (!$sRequest || '/' === $sRequest || !getParam('permalinks_seo_links'))
            return false;

        // redirect to the correct URL
        if ('/' === $sRequest[-1] || $sRequest != mb_strtolower($sRequest)) {
            unset($_GET['_q']);
            $sUrl = BX_DOL_URL_ROOT . bx_append_url_params(mb_strtolower(trim($sRequest, '/')), $_GET);
            return $sUrl;    
        }

        // parse URL
        $a = explode('/', $sRequest);
        if (!$a || empty($a[0]))
            return false;

        // check page URI rewrite redirect
        $aSeoUriRewrites = BxDolPageQuery::getSeoUriRewrites();
        if (isset($aSeoUriRewrites[$a[0]])) {
            unset($_GET['_q']);
            $a[0] = $aSeoUriRewrites[$a[0]];
            $sUrl = BX_DOL_URL_ROOT . bx_append_url_params(mb_strtolower(implode('/', $a)), $_GET);
            return $sUrl;
        }

        // check page URI rewrite
        $aSeoUriRewritesInv = array_flip($aSeoUriRewrites);
        if (isset($aSeoUriRewritesInv[$a[0]]))
            $a[0] = $aSeoUriRewritesInv[$a[0]];

        // get page
        $sPageName = BxDolPageQuery::getPageObjectNameByURI($a[0]);
        $aPage = $sPageName ? BxDolPageQuery::getPageObject($sPageName) : false;
        if (!$aPage)
            return false;

        // page with params
        if (!empty($a[1])) { 
            $r = BxDolPageQuery::getSeoLink($aPage['module'], $a[0], ['uri' => $a[1]]);
            if ($r)
                $_GET[$r['param_name']] = $_REQUEST[$r['param_name']] = $r['param_value'];
        }

        // multisite redirect
        if (defined('BX_MULTISITE_MODULE')) {
            list($sPageLink, $aPageParams) = bx_get_base_url_inline();
            unset($aPageParams['_q']);
            $sLink = bx_append_url_params($sPageLink, $aPageParams);
            if (0 === strpos($sLink, BX_DOL_URL_ROOT))
                $sLink = substr($sLink, strlen(BX_DOL_URL_ROOT));

            $s = BxDolPage::multisiteLinkCheck ('', $a[0], $aPage['module'], $_GET);
            if (false !== $s)
                return $s . $sLink;
        }

        // display page
        $_REQUEST['i'] = $_GET['i'] = $a[0];
        $oPage = BxDolPage::getObjectInstanceByURI($a[0], false, true);
        return $oPage;
    }
    
	/**
     * Process SEO links. It takes request part from SEO link and process it 
     * to make it work as regular page link
     * @param $sRequest request URI with SEO link
     * @return true - if page was found and processed correctly, false - if page wasn't found
     */
    static public function processSeoLink ($sRequest)
    {
        $mixed = self::getPageBySeoLink($sRequest);
        if (($sUrl = $mixed) && is_string($sUrl)) {
            header('Location:' . $sUrl, true, 301);
            exit;
        }
        elseif (($oPage = $mixed) && is_object($oPage)) {
            $oPage->displayPage();
            return true;
        }
        else {
            return false;
        }
    }

	/**
     * Transform regular link to SEO link. It takes regular list as param and return SEO link.
     * @param $sLink regular link
     * @param $sPrefix prefix to add to the final URL, usually BX_DOL_URL_ROOT
     * @param $aParams additional GET params
     * @return SEO link string on success, false if transform failed or not necessary
     */
    static public function transformSeoLink ($sLink, $sPrefix, $aParams = array())
    {
        static $aMemoryUrls = [];
        if (isset($aMemoryUrls[$sLink]))
            return $aMemoryUrls[$sLink];

        if (!getParam('permalinks_seo_links'))
            return false;

        if (0 !== strncmp('page.php', $sLink, 8)) // only page.php links are supported
            return false;

        $sQuery = parse_url($sLink, PHP_URL_QUERY);
        if (false === $sQuery)
            return false;

        if (function_exists('bx_parse_str'))
            $aQueryParams = bx_parse_str($sQuery);
        else
            parse_str($sQuery, $aQueryParams);

        $sPageUri = !empty($aQueryParams['i']) ? $aQueryParams['i'] : false;
        unset($aQueryParams['i']);

        if (!$sPageUri) // page URI wasn't found
            return false;

        $sPageModule = '';

        $aSeoParams = array('id', 'profile_id'); // supported SEO params which are transformed to SEO strings
        $sSeoParamName = '';
        $sSeoParamValue = '';
        if ('cmts-view' != $sPageUri) {
            foreach ($aSeoParams as $k) {
                if (empty($aQueryParams[$k]) && empty($aParams[$k]))
                    continue;
                $sSeoParamName = $k;
                $sSeoParamValue = !empty($aParams[$k]) ? $aParams[$k] : $aQueryParams[$k];
                unset($aQueryParams[$k]);
                unset($aParams[$k]);
                break; // only 1 SEO param will be transformed
            }
        }
        if (!empty($sSeoParamValue) && 0 === strpos($sSeoParamValue, '{'))
            return false;
        
        $aSeoUriRewrites = BxDolPageQuery::getSeoUriRewrites();
        if (isset($aSeoUriRewrites[$sPageUri])) {
            $sSeoPageUri = $aSeoUriRewrites[$sPageUri];
        } else {
            $sSeoPageUri = $sPageUri;
        }

        if ($sSeoParamName && $sSeoParamValue) { // process page with SEO param
            $sPageName = BxDolPageQuery::getPageObjectNameByURI($sPageUri);
            $aPage = $sPageName ? BxDolPageQuery::getPageObject($sPageName) : false;
            if ($aPage) {
                $sPageModule = $aPage['module'];
                $sContentInfo = !empty($aPage['content_info']) ? $aPage['content_info'] : $aPage['module'];
                $bSeoUrlFound = true;

                if ('id' == $sSeoParamName) {
                    $oContentInfo = BxDolContentInfo::getObjectInstance($sContentInfo);
                    if (!$oContentInfo) {
                        $bSeoUrlFound = false;
                    } else {
                        $sSeoTitle = $oContentInfo->getContentTitle($sSeoParamValue);
                    }
                    if (!$sSeoTitle)
                        $sSeoTitle = base_convert((string)sprintf('%u', crc32($sSeoParamValue . BX_DOL_SECRET)), 10, 36);
                }
                elseif ('profile_id' == $sSeoParamName) {
                    $oProfile = BxDolProfile::getInstance($sSeoParamValue);
                    if (!$oProfile) {
                        $bSeoUrlFound = false;
                    } else {
                        $sSeoTitle = $oProfile->getDisplayName();
                    }
                }
                
                $r = false;
                if (!$bSeoUrlFound) {
                    $sSeoPageUri = false;
                } else {
                    $r = BxDolPageQuery::getSeoLink($sPageModule, $sPageUri, ['param_value' => $sSeoParamValue]);
                }
                if ($bSeoUrlFound && !$r) {
                    $sSeoTitleLimited = BxTemplFunctions::getInstance()->getStringWithLimitedLength($sSeoTitle, 45);
                    $sUri = uriGenerate ($sSeoTitleLimited, 'sys_seo_links', 'uri', ['cond' => ['module' => $sPageModule, 'page_uri' => $sPageUri]]);

                    /**
                     * @hooks
                     * @hookdef hook-system-uri_generate 'system', 'uri_generate' - hook to override SEO URI generated for a page
                     * - $unit_name - equals `system`
                     * - $action - equals `uri_generate`
                     * - $object_id - not used
                     * - $sender_id - not used
                     * - $extra_params - array of additional params with the following array keys:
                     *      - `module` - [string] module name
                     *      - `page_uri` - [string] page default URI
                     *      - `param_name` - [string] param name
                     *      - `param_value` - [string] param value
                     *      - `title` - [string] SEO page title
                     *      - `uri` - [string] by ref, generated SEO URI, can be overridden in hook processing
                     * @hook @ref hook-system-uri_generate
                     */
                    bx_alert('system', 'uri_generate', 0, false, [
                        'module' => $sPageModule,
                        'page_uri' =>$sPageUri,
                        'param_name' => $sSeoParamName,
                        'param_value' => $sSeoParamValue,
                        'title' => $sSeoTitle,
                        'uri' => &$sUri,
                        'uri_ref' => &$sUri,
                    ]);

                    BxDolPageQuery::insertSeoLink($sPageModule, $sPageUri, $sSeoParamName, $sSeoParamValue, $sUri);
                }
                elseif ($r && $r['param_name'] == $sSeoParamName) {
                    $sUri = $r['uri'];
                } 
                else {
                    $sUri = false;
                }

                if ($sUri)
                    $sSeoPageUri .= '/' . $sUri;
                else
                    $sSeoPageUri = false;
            }
        }

        $sRet = false;        
        if ($sSeoPageUri) {
            $sLinkTransformed = $sPrefix . bx_append_url_params($sSeoPageUri, array_merge($aQueryParams, $aParams), false);
            if (defined('BX_MULTISITE_MODULE')) {
                $s = BxDolPage::multisiteLinkCheck ($sLinkTransformed, $sPageUri, $sPageModule, [$sSeoParamName => $sSeoParamValue]);
                if (false !== $s) 
                    $sRet = $s;
            }
            else {
                $sRet = $sLinkTransformed;
            }
        }
        
        $aMemoryUrls[$sLink] = $sRet;

        return $sRet;
    }

	/**
     * Transform SEO regular link into regular link with permalinks off.
     * @param $sSeoLink SEO link
     * @param $sPrefix prefix to add to the final URL, usually BX_DOL_URL_ROOT
     * @return unSEO link string on success, false if no transform is needed
     */
    static public function untransformSeoLink ($sSeoLink, $sPrefix)
    {
        // check for standard links first
        if (preg_match('/^(page\/|s\/|m\/|modules\/|page\.php|storage\.php)/', $sSeoLink))
            return false;

        // parse link
        $aParts = parse_url($sSeoLink);
        if (!$aParts || empty($aParts['path']))
            return false;

        $aUris = explode('/', trim($aParts['path'], '/'));

        // check if link starts with page URI and page with this URI exists 
        if (!$aUris || empty($aUris[0]) || !($sPageName = BxDolPageQuery::getPageObjectNameByURI($aUris[0], false, true)))
            return false;

        $aPage = BxDolPageQuery::getPageObject ($sPageName);

        // make final URL
        $s = 'page.php?i=' . $aPage['uri'];

        // add params
        if (!empty($aUris[1])) {
            if ($aPage) {
                $r = BxDolPageQuery::getSeoLink($aPage['module'], $aPage['uri'], ['uri' => urldecode($aUris[1])]);     
                if (!$r)
                    return false;
                $s .= '&' . $r['param_name'] . '=' .  $r['param_value'];
            }
        }

        return $s . (!empty($aParts['query']) ? '&' . $aParts['query'] : '');
    }

	/**
     * Perform SEO redorect from regular pages if needed
     * @param $sSeoLink SEO link
     * @param $sPrefix prefix to add to the final URL, usually BX_DOL_URL_ROOT
     * @return unSEO link string on success, false if no transform is needed
     */
    static public function seoRedirect ()
    {
        if (!getParam('permalinks_seo_links'))
            return;

        list($sPageLink, $aPageParams) = bx_get_base_url_inline();
        $sLink = bx_append_url_params($sPageLink, $aPageParams);
        if (0 === strpos($sLink, BX_DOL_URL_ROOT))
            $sLink = substr($sLink, strlen(BX_DOL_URL_ROOT));

        if (defined('BX_MULTISITE_MODULE')) {
            $s = BxDolPage::multisiteLinkCheck ($sLink);
            if (false !== $s) {
                header('Location:' . $s, true, 301);
                exit;
            }
        }

        if ($sSeoLink = self::transformSeoLink ($sLink, BX_DOL_URL_ROOT)) {
            header("Location:{$sSeoLink}", true, 301);
            exit;
        }
    }

    static public function getSeoHash($s)
    {
        return base_convert(substr(md5($s), -8), 16, 36);
    }

    /**
     * Static method to Get embed code
     * @return string.
     */
    static public function getEmbedData ($sUrl)
    {
        $sUrl = urldecode($sUrl);
        $aParams = [];
        
        $aUrl = bx_get_base_url($sUrl);
        if (!isset($aUrl[1]['i'])){
            return [];
        }
            
        $sUri = $aUrl[1]['i'];
        unset($aUrl[1]['i']);
        $aParams = $aUrl[1];

        $sTitle = $sAuthorName = $sAuthorUrl = $sThumb = $sHtml = '';
        if (isset($aParams['id'])) {
            $sContentInfo = BxDolPageQuery::getContentInfoObjectNameByURI($sUri);
            if(($oContentInfo = BxDolContentInfo::getObjectInstance($sContentInfo))) {
                $sTitle = $oContentInfo->getContentTitle($aParams['id']);
                $iAuthor = $oContentInfo->getContentAuthor($aParams['id']);
                if(($oAuthor = BxDolProfile::getInstance($iAuthor)) !== false) {
                    $sAuthorName = $oAuthor->getDisplayName();
                    $sAuthorUrl = $oAuthor->getUrl();
                }
                $sThumb = $oContentInfo->getContentThumb($aParams['id']);
                $sHtml = $oContentInfo->getContentEmbed($aParams['id']);
            }
        }
        else {
            $oPage = BxDolPage::getObjectInstanceByURI($sUri, false, true);
            $aPage = $oPage->getObject();
            $sTitle = $oPage->_getPageTitle();
            $sHtml = BxDolTemplate::getInstance()->parseHtmlByName('embed.html', [
                'title' => $sTitle,
                'url' => BX_DOL_URL_ROOT . 'page.php?a=embed&o=' . $oPage->getName()
            ]);
        }
        return ['url' => $sUrl, 'title' => $sTitle, 'author_name' => $sAuthorName, 'author_url' => $sAuthorUrl, 'thumbnail_url' => $sThumb, 'html' => $sHtml];
    }

    static public function getPageBlockData($iBlockId, $iContentId = 0, $sContentModule = '')
    {
        $oDb = new BxDolPageQuery([]);

        $sData = $oDb->getPageBlockData($iBlockId, $iContentId, $sContentModule);
        $aData = !empty($sData) ? json_decode($sData, true) : [];

        foreach($aData as &$j) {
            foreach($j as &$k) {
                switch($k['type']) {
                    case 'image':
                        $aImage = bx_api_get_image(['sys_images_editor', 'sys_images_editor'], (int)$k['content']);
                        if($aImage && is_array($aImage))
                            $k['content'] = $aImage;
                        break;

                    case 'link':
                        if(($oEmbed = BxDolEmbed::getObjectInstance('sys_system')) !== false)
                            $k['content_data'] = $oEmbed->getData($k['content'], '');
                        break;
                }
            }
        }

        return $aData;
    }

    static public function setPageBlockData($iBlockId, $iContentId = 0, $sContentModule = '', $mixedData = '')
    {
        $oDb = new BxDolPageQuery([]);

        $sData = is_array($mixedData) ? json_encode($mixedData) : $mixedData;

        return $oDb->setPageBlockData($iBlockId, $iContentId, $sContentModule, $sData);
    }
    
    static public function getBlockProcessing()
    {
        return self::$_aBlockProcessing;
    }

    static public function setBlockProcessing($aBlock)
    {
        self::$_aBlockProcessing = $aBlock && is_array($aBlock) ? $aBlock : [];
    }

    static public function unsetBlockProcessing()
    {
        self::$_aBlockProcessing = [];
    }

    /**
     * Display complete page
     */
    public function displayPage ($oTemplate = null)
    {
        $sSessionKey = 'sys_entrance_url';
        $oSession = BxDolSession::getInstance();
        if(!$oSession->getValue($sSessionKey)) {
            list($sPageLink, $aPageParams) = bx_get_base_url_inline();

            $oSession->setValue($sSessionKey, bx_append_url_params($sPageLink, array_intersect_key($aPageParams, array_flip(['i', 'id', 'profile_id']))));
        }

        if(isLogged())
            BxDolAccount::getInstance()->isNeedChangePassword();

        if ($this->isLockedFromUnauthenticated ($this->_aObject['uri'])) {
            $this->redirectToLoginForm();
            exit;
        }

        if(!$oTemplate)
            $oTemplate = BxDolTemplate::getInstance();

        $oTemplate->setPageNameIndex(BX_PAGE_DEFAULT);
        if(($sHxTarget = bx_get_htmx_target()) !== false) 
            $oTemplate->setPageNameIndexByTarget($sHxTarget);

        $oTemplate->setPageUrl($this->_aObject['url']);
        $oTemplate->setPageType($this->getType());
        $oTemplate->setPageInjections($this->getInjections());
        if($oTemplate->getPageNameIndex() == BX_PAGE_CONTENT_PRELOAD)
            $oTemplate->setPageContent('page_main_code', $this->getIncludes());
        else
            $oTemplate->setPageContent('page_main_code', $this->getCode());
        $oTemplate->getPageCode();
    }

    public function getId ()
    {
    	return (int)$this->_aObject['id'];
    }

    public function getType ()
    {
        if (defined('BX_MULTISITE_FORCE_PAGETYPE') && defined('BX_MULTISITE_MODULE')) {

            list($sPageLink, $aPageParams) = bx_get_base_url_inline();
            $sLink = bx_append_url_params($sPageLink, $aPageParams);
            if (0 === strpos($sLink, BX_DOL_URL_ROOT))
                $sLink = substr($sLink, strlen(BX_DOL_URL_ROOT));

            if (BxDolPage::getMultisite ($sLink))
                return BX_MULTISITE_FORCE_PAGETYPE;
        }

        return (int)$this->_aObject['type_id'];
    }

    public function getModule ()
    {
    	return $this->_aObject['module'];
    }
    
    public function getSubMenu ()
    {
        return $this->_aObject['submenu'];
    }

    public function getMetaDescription ()
    {
        return $this->_aObject['meta_description'];
    }

    public function getName ()
    {
    	return $this->_sObject;
    }
    
    public function getObject ()
    {
    	return $this->_aObject;
    }
    
    public function getInjections ()
    {
        $aResult = array();

        foreach($this->_aObject as $sKey => $sValue)
            if(strpos($sKey, 'inj_') === 0)
                $aResult[substr($sKey, 4)] = $sValue;

        return $aResult;
    }

    public function getForceRedirect ()
    {
        return $this->_sForceRedirect ?: false;
    }

    public function setForceRedirect ($sUrl)
    {
        $this->_sForceRedirect = $sUrl;
    }

    public function setTitle ($sTitle)
    {
        return $this->_aObject['title'] = $sTitle;
    }

    /**
     * Add replace markers. Markers are replaced in raw, html, lang blocks and page title, description, keywords and block titles.
     * @param $a array of markers as key => value
     * @return true on success or false on error
     */
    public function addMarkers ($a)
    {
        if (empty($a) || !is_array($a))
            return false;
        $this->_aMarkers = array_merge ($this->_aMarkers, $a);
        return true;
    }

    public function isAvailablePage ()
    {
        return $this->_isAvailablePage($this->_aObject);
    }

    public function isVisiblePage ()
    {
        return $this->_isVisiblePage($this->_aObject);
    }

    /**
     * Check if page can be seen by viewer.
     * @param array $a - page object.
     * @return type boolean (true or false).
     */
    public function isPage()
    {
        return $this->_isAvailablePage($this->_aObject) === true && $this->_isVisiblePage($this->_aObject) === true;
    }

    public function isVisiblePageSubmenu ()
    {
        return $this->_aObject['submenu'] != 'disabled';
    }

    public function isEditAllowed ()
    {
        return false;
    }

    public function isDeleteAllowed ()
    {
        return false;
    }

    /**
     * Replace provided markers in a string
     * @param $mixed string or array to replace markers in
     * @return string where all occured markers are replaced
     */
    protected function _replaceMarkers ($mixed, $aAdditionalMarkers = array())
    {
        return bx_replace_markers($mixed, array_merge($this->_aMarkers, $aAdditionalMarkers));
    }

    /**
     * Check if page block is visible.
     */
    protected function _isVisibleBlock ($a)
    {
        return BxDolAcl::getInstance()->isMemberLevelInSet($a['visible_for_levels']);
    }

    /**
     * Check if page is available.
     * @param type $a - page object.
     * @return boolean true if available, false or a string with error message otherwise.
     */
    protected function _isAvailablePage ($a)
    {
        return true;
    }

    /**
     * Check if page is visible.
     * @param array $a - page object.
     * @return boolean true if visible, false or a string with error message otherwise.
     */
    protected function _isVisiblePage ($a)
    {
        return isAdmin() || BxDolAcl::getInstance()->isMemberLevelInSet($a['visible_for_levels']);
    }

    public static function isLockedFromUnauthenticated ($sUri)
    {
        if (!isLogged() && getParam('sys_lock_from_unauthenticated') && !defined('BX_DOL_CRON_EXECUTE')) {
            $aURIs = explode(',', getParam('sys_lock_from_unauthenticated_exceptions'));
            array_walk($aURIs, function (&$sVal) {
                $sVal = trim($sVal);
            });
            $aI = array_combine($aURIs, array_fill(0, count($aURIs), 1));
            if (!preg_match('/\/oauth2\//', $_SERVER['REQUEST_URI']) /*&& !preg_match('/searchKeyword.php$/', $_SERVER['PHP_SELF'])*/ && !preg_match('/member.php$/', $_SERVER['PHP_SELF']) && !isset($aI[$sUri])) {
                return true;
            }
        }

        return false;
    }

    public static function redirectToLoginForm ()
    {
        header("Location: " . bx_append_url_params(bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=login')), ['relocate' => bx_get_self_url()]));
        exit;
    }
}

/** @} */
