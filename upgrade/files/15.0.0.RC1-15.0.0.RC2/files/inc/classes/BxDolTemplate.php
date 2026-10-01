<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

ini_set('pcre.backtrack_limit', 1000000);

define('BX_DOL_TEMPLATE_INJECTIONS_CACHE', 'sys_injections.inc');

define('BX_DOL_TEMPLATE_CHECK_IN_BOTH', 'both');
define('BX_DOL_TEMPLATE_CHECK_IN_BASE', 'base');
define('BX_DOL_TEMPLATE_CHECK_IN_TMPL', 'tmpl');

define('BX_DOL_COLOR_BG', 'bg');
define('BX_DOL_COLOR_FT', 'ft');

define('BX_DOL_PAGE_WIDTH', '1024px');

/**
 * Page display levels.
 * Note. Both levels may refer to the same HTML templates. 
 * 
 * 'System' level. It uses page's NameIndex and
 * is mainly used for pages which aren't registered 
 * in 'sys_objects_page' table. Also it's used 
 * in 'Injections' engine.  
 */
define('BX_PAGE_DEFAULT', 0); ///< default, regular page
define('BX_PAGE_CLEAR', 2); ///< clear page, without any headers and footers
define('BX_PAGE_EMBED', 22); ///< page used for embeds
define('BX_PAGE_POPUP', 44); ///< popup page, without any headers and footers
define('BX_PAGE_CONTENT_PRELOAD', 50); ///< page content preload for dynamic (htmx) loading
define('BX_PAGE_CONTENT_WITH_COVER', 54); ///< page content with cover and submenu for dynamic (htmx) loading
define('BX_PAGE_CONTENT_WITH_SUBMENU', 56); ///< page content with submenu for dynamic (htmx) loading
define('BX_PAGE_CONTENT', 58); ///< page content only for dynamic (htmx) loading
define('BX_PAGE_TRANSITION', 150); ///< transition page with redirect to display some msg, like 'please wait', without headers footers

/**
 * 'Builder based' level. It uses page's Type 
 * from BxDolPage class and is used for pages 
 * which are registered in 'sys_objects_page' table.
 * Changeable in Studio -> Pages Builder -> Settings. 
 */
define('BX_PAGE_TYPE_DEFAULT', 1); ///< default, depends on the settins
define('BX_PAGE_TYPE_DEFAULT_WO_HF', 2); ///< clear page, without any headers and footers
define('BX_PAGE_TYPE_STANDARD', 3); ///< regular page divided on columns
define('BX_PAGE_TYPE_APPLICATION', 4); ///< regular page divided on columns with left vertical menu(s) column

/**
 * Template engine.
 *
 * An object of the class allows to:
 *  1. Manage HTML templates.
 *  2. Get URL/path for any template image/icon.
 *  3. Attach CSS/JavaScript files to the output.
 *  4. Add some content to any template key using Injection engine.
 *
 *
 * Avalable constructions.
 *  1. &lt;bx_include_auto:template_name.html /&gt; - the content of the file would be inserted. File would be taken from current template if it existes there, and from base directory otherwise.
 *  2. &lt;bx_include_base:template_name.html /&gt; - the content of the file would be inserted. File would be taken from base directory.
 *  3. &lt;bx_include_tmpl:template_name.html /&gt; - the content of the file would be inserted. File would be taken from tmpl_xxx directory.
 *  4. &lt;bx_url_root /&gt; - the value of BX_DOL_URL_ROOT variable will be inserted.
 *  5. &lt;bx_url_admin /&gt; - the value of BX_DOL_URL_ADMIN variable will be inserted.
 *  6. &lt;bx_text:_language_key /&gt; - _language_key will be translated using language file(function _t()) and inserted.
       &lt;bx_text_js:_language_key /&gt; - _language_key will be translated using language file(function _t()) and inserted, use it to insert text into js string.
       &lt;bx_text_attribute:_language_key /&gt; - _language_key will be translated using language file(function _t()) and inserted, use it to insert text into html attribute.
 *  7. &lt;bx_image_url:image_file_name /&gt; - image with 'image_file_name' file name will be searched in the images folder of current template.
 *     If it's not found, then it will be searched in the images folder of base template. On success full URL will be inserted, otherwise an empty string.
 *  8. &lt;bx_icon_url:icon_file_name /&gt; - the same with &lt;bx_image_url:image_file_name /&gt;, but icons will be searched in the images/icons/ folders.
 *  9. &lt;bx_injection:injection_name /&gt; - will be replaced with injections registered with the page and injection_name in the `sys_injections`/`sys_injections_admin`/ tables.
 *  10. &lt;bx_if:tag_name&gt;some_HTML&lt;/bx_if:tag_name&gt; - will be replaced with provided content if the condition is true, and with empty string otherwise.
 *  11. &lt;bx_repeat:cycle_name&gt;some_HTML&lt;/bx_repeat:cycle_name&gt; - an inner HTML content will be repeated in accordance with received data.
 *
 *
 * Related classes:
 *  BxDolTemplateAdmin - for processing admin templates.
 *  Template classes in modules - for processing modiles' templates.
 *
 *
 * Global variables:
 *  oSysTemplate - is used for template processing in user part.
 *  oAdmTemplate - is used for template processing in admin part.
 *
 *
 * Add injection:
 *  1. Register it in the `sys_injections` table or `sys_injections_admin` table for admin panel.
 *  2. Clear injections cache(sys_injections.inc and sys_injections_admin.inc in cache folder).
 *
 *
 * Predefined template keys to add injections:
 *  1. injection_head - add injections in the &lt;head&gt; tag.
 *  2. injection_body - add ingection(attribute) in the &lt;body&gt; tag.
 *  3. injection_header - add injection inside the &lt;body&gt; tag at the very beginning.
 *  4. injection_logo_before - add injection at the left of the main logo(inside logo's DIV).
 *  5. injection_logo_after - add injection at the right of the main logo(inside logo's DIV).
 *  6. injection_between_logo_top_menu - add injection between logo and top menu.
 *  7. injection_top_menu_before - add injection at the left of the top menu(inside top menu's DIV).
 *  8. injection_top_menu_after - add injection at the right of the top menu(inside top menu's DIV).
 *  13. injection_content_before - add injection just before main content(inside content's DIV).
 *  14. injection_content_after - add injection just after main content(inside content's DIV).
 *  15. injection_between_content_footer - add injection between content and footer.
 *  16. injection_footer_before - add injection at the left of the footer(inside footer's DIV).
 *  17. injection_footer_after - add injection at the right of the footer(inside footer's DIV).
 *  18. injection_footer - add injection inside the &lt;body&gt; tag at the very end.
 *
 *
 * Example of usage:
 * @code
 *  $oSysTemplate = BxDolTemplate::getInstance();
 *
 *  $oSysTemplate->addCss(array('test1.css', 'test2.css'));
 *  $oSysTemplate->addJs(array('test1.js', 'test2.js'));
 *  $oSysTemplate->parseHtmlByName('messageBox.html', array(
 *    'id' => $iId,
 *     'msgText' => $sText,
 *     'bx_if:timer' => array(
 *        'condition' => $iTimer > 0,
 *        'content' => array(
 *           'id' => $iId,
 *           'time' => 1000 * $iTimer,
 *           'on_close' => $sOnClose,
 *        )
 *     ),
 *     'bx_if:timer' => array(
 *        array(
 *           'name' => $sName,
 *           'title' => $sTitle
 *        ),
 *        array(
 *           'name' => $sName,
 *           'title' => $sTitle
 *        )
 *     )
 *  ));
 * @endcode
 *
 *
 * Memberships/ACL:
 * Doesn't depend on user's membership.
 *
 *
 * Alerts:
 * no alerts available
 *
 */
class BxDolTemplate extends BxDolFactory implements iBxDolSingleton
{
    protected static $_sColorClassPrefix = 'col-';
    protected static $_sColorClassPrefixBg = 'bg-col-';
    protected static $_aColors = array(
    	'red1' => array(216, 9, 96), 
    	'red1-dark' => array(194, 7, 86), 
    	'red2' => array(231, 68, 30), 
    	'red2-dark' => array(207, 60, 25), 
    	'red3' => array(243, 143, 0), 
    	'red3-dark' => array(218, 128, 0), 
    	'green1' => array(96, 174, 0), 
    	'green1-dark' => array(86, 156, 0), 
    	'green2' => array(209, 211, 0), 
    	'green2-dark' => array(186, 188, 0), 
    	'green3' => array(48, 116, 36), 
    	'green3-dark' => array(43, 104, 32), 
    	'blue1' => array(10, 61, 143), 
    	'blue1-dark' => array(9, 54, 128), 
    	'blue2' => array(0, 164, 165), 
    	'blue2-dark' => array(0, 146, 148), 
    	'blue3' => array(0, 160, 206), 
    	'blue3-dark' => array(0, 143, 184), 
    	'gray' => array(97, 97, 97), 
    	'gray-dark' => array(87, 87, 87)
    );

    protected static $_aImages;
    protected static $_sImagesCacheKey;
    protected static $_iImagesCacheTTL;

    /**
     * Main fields
     */
    protected $_sName;
    protected $_sPrefix;
    protected $_sRootPath;
    protected $_sRootUrl;
    protected $_sSubPath;
    protected $_sInjectionsTable;
    protected $_sInjectionsCache;
    protected $_sCode;
    protected $_sCodeKey;
    protected $_iMix;
    protected $_sMixKey;
    protected $_sKeyWrapperHtml;
    protected $_sFolderHtml;
    protected $_sFolderCss;
    protected $_sFolderImages;
    protected $_sFolderIcons;
    protected $_aTemplates;
    protected $_aTemplatePatterns;

    protected $_aLocations;
    protected $_aLocationsJs;

    /**
     * Cache related fields
     */
    protected $_bCacheEnable;
    protected $_sCacheFolderUrl;
    protected $_sCachePublicFolderUrl;
    protected $_sCachePublicFolderPath;
    protected $_sCacheFilePrefix;
    protected $_aCacheExceptions;

    protected $_bImagesInline;
    protected $_iImagesMaxSize;

    protected $_bCssLess;
    protected $_bCssCache;
    protected $_bCssMinify;
    protected $_bCssArchive;
    protected $_sCssLessPrefix;
    protected $_sCssCachePrefix;

    protected $_bJsLess;
    protected $_bJsCache;
    protected $_bJsMinify;
    protected $_bJsArchive;
    protected $_sJsCachePrefix;

    protected $aPage;
    protected $aPageContent;
    protected $aPageSnapshot = array();

    protected $_oTemplateConfig;
    protected $_oTemplateFunctions;

    /**
     * Constructor
     */
    protected function __construct($sRootPath = BX_DIRECTORY_PATH_ROOT, $sRootUrl = BX_DOL_URL_ROOT)
    {
        if(isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error ('Multiple instances are not allowed for the class: ' . get_class($this), E_USER_ERROR);

        parent::__construct();

        $this->_sPrefix = 'BxDolTemplate';

        $this->_sRootPath = $sRootPath;
        $this->_sRootUrl = $sRootUrl;
        $this->_sInjectionsTable = 'sys_injections';
        $this->_sInjectionsCache = BX_DOL_TEMPLATE_INJECTIONS_CACHE;

        $this->_sCodeKey = BX_DOL_TEMPLATE_CODE_KEY;
        $this->_sMixKey = BX_DOL_TEMPLATE_MIX_KEY;
        list(
            $this->_sCode, 
            $this->_sName, 
            $this->_sSubPath
        ) = self::retrieveCode($this->_sCodeKey, $this->_sMixKey, $this->_sRootPath);

        $this->_iMix = 0;
        if(is_array($this->_sCode))
            list($this->_sCode, $this->_iMix) = $this->_sCode;

        if(!$this->_sSubPath)
            $this->_sSubPath = 'boonex/' . BX_DOL_TEMPLATE_DEFAULT_CODE . '/';

        if(!file_exists(BX_DIRECTORY_PATH_MODULES . $this->_sSubPath)) // just for 8.0.0-A6 upgrade
            $this->_sSubPath = 'boonex/uni/';

        if(isset($_GET[$this->_sCodeKey])) {
            if(BxDolPermalinks::getInstance()->redirectIfNecessary(array($this->_sCodeKey)))
                exit;
        }

        $this->_sKeyWrapperHtml = '__';
        $this->_sFolderHtml = '';
        $this->_sFolderCss = 'css/';
        $this->_sFolderImages = 'images/';
        $this->_sFolderIcons = 'images/icons/';
        $this->_aTemplates = ['html_tags', 'menu_item_addon', 'menu_item_addon_small', 'menu_item_addon_middle'];
        $this->_aTemplatePatterns = [
            "'<bx_include_auto:([^\s]+) \/>'s" => BX_DOL_TEMPLATE_CHECK_IN_BOTH,
            "'<bx_include_auto_mod_general:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'mod_general'],
            "'<bx_include_auto_mod_profile:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'mod_profile'],
            "'<bx_include_auto_mod_group:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'mod_group'],
            "'<bx_include_auto_mod_text:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BOTH, 'sub' => 'mod_text'],
            "'<bx_include_base:([^\s]+) \/>'s" => BX_DOL_TEMPLATE_CHECK_IN_BASE,
            "'<bx_include_base_mod_general:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BASE, 'sub' => 'mod_general'],
            "'<bx_include_base_mod_profile:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BASE, 'sub' => 'mod_profile'],
            "'<bx_include_base_mod_group:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BASE, 'sub' => 'mod_group'],
            "'<bx_include_base_mod_text:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_BASE, 'sub' => 'mod_text'],
            "'<bx_include_tmpl:([^\s]+) \/>'s" => BX_DOL_TEMPLATE_CHECK_IN_TMPL,
            "'<bx_include_tmpl_mod_general:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_TMPL, 'sub' => 'mod_general'],
            "'<bx_include_tmpl_mod_profile:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_TMPL, 'sub' => 'mod_profile'],
            "'<bx_include_tmpl_mod_group:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_TMPL, 'sub' => 'mod_group'],
            "'<bx_include_tmpl_mod_text:([^\s]+) \/>'s" => ['in' => BX_DOL_TEMPLATE_CHECK_IN_TMPL, 'sub' => 'mod_text']
        ];

        $this->addLocation('system', $this->_sRootPath, $this->_sRootUrl);

        $this->addLocationJs('system_inc_js', BX_DIRECTORY_PATH_INC . 'js/' , BX_DOL_URL_ROOT . 'inc/js/');
        $this->addLocationJs('system_inc_js_classes', BX_DIRECTORY_PATH_INC . 'js/classes/' , BX_DOL_URL_ROOT . 'inc/js/classes/');
        $this->addLocationJs('system_plugins_public', BX_DIRECTORY_PATH_PLUGINS_PUBLIC, BX_DOL_URL_PLUGINS_PUBLIC);

        $this->_bCacheEnable = !bx_is_dbg() && !defined('BX_DOL_CRON_EXECUTE') && getParam('sys_template_cache_enable') == 'on';
        $this->_sCacheFolderUrl = '';
        $this->_sCachePublicFolderUrl = BX_DOL_URL_CACHE_PUBLIC;
        $this->_sCachePublicFolderPath = BX_DIRECTORY_PATH_CACHE_PUBLIC;
        $this->_sCacheFilePrefix = "bx_templ_";
        $this->_aCacheExceptions = ['pt_standard.html', 'menu_icon.html', 'unit_showcase.html'];

        $this->_bImagesInline = getParam('sys_template_cache_image_enable') == 'on';
        $this->_iImagesMaxSize = (int)getParam('sys_template_cache_image_max_size') * 1024;

        $bArchive = getParam('sys_template_cache_compress_enable') == 'on';

        $this->_bCssLess = true; //--- Less cannot be disabled for CSS.
        $this->_bCssCache = !bx_is_dbg() && !defined('BX_DOL_CRON_EXECUTE') && getParam('sys_template_cache_css_enable') == 'on';
        $this->_bCssMinify = $this->_bCssCache && getParam('sys_template_cache_minify_css_enable') == 'on';
        $this->_bCssArchive = $this->_bCssCache && $bArchive;
        $this->_sCssLessPrefix = $this->_sCacheFilePrefix . 'less_';
        $this->_sCssCachePrefix = $this->_sCacheFilePrefix . 'css_';

        $this->_bJsLess = false; //--- Less language isn't available for JS at all.
        $this->_bJsCache = !bx_is_dbg() && !defined('BX_DOL_CRON_EXECUTE') && getParam('sys_template_cache_js_enable') == 'on';
        $this->_bJsMinify = $this->_bJsCache && getParam('sys_template_cache_minify_js_enable') == 'on';
        $this->_bJsArchive = $this->_bJsCache && $bArchive;
        $this->_sJsCachePrefix = $this->_sCacheFilePrefix . 'js_';

        $this->aPage = [];
        $this->aPageContent = [];
    }

    /**
     * Prevent cloning the instance
     */
    public function __clone()
    {
        if (isset($GLOBALS['bxDolClasses'][get_class($this)]))
            trigger_error('Clone is not allowed for the class: ' . get_class($this), E_USER_ERROR);
    }

    /**
     * Get singleton instance of the class
     */
    public static function getInstance()
    {
        if(!isset($GLOBALS['bxDolClasses'][__CLASS__])) {
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolTemplate();
            $GLOBALS['bxDolClasses'][__CLASS__]->init();
        }

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Retrieve template code and check whether it's associated with active template or not.
     *
     * @param string $sCodeKey template's code key.
     * @param string $sMixKey template's mix key.
     * @param string $sRootPath path to root directory.
     */
    public static function retrieveCode($sCodeKey = BX_DOL_TEMPLATE_CODE_KEY, $sMixKey = BX_DOL_TEMPLATE_MIX_KEY, $sRootPath = BX_DIRECTORY_PATH_ROOT)
    {
        $oDb = BxDolDb::getInstance();

        $fCheckCode = function($sCode, $bSetCookie) use($sCodeKey, $sRootPath) {
            if(empty($sCode) || !preg_match('/^[A-Za-z0-9_-]+$/', $sCode))
                return false;

            $aModule = BxDolModuleQuery::getInstance()->getModuleByUri($sCode);
            if(empty($aModule) || !is_array($aModule) || (int)$aModule['enabled'] != 1 || !file_exists(BX_DIRECTORY_PATH_MODULES . $aModule['path'] . 'data/template/'))
                return false;
            
            $aResult = array(
                $aModule['uri'], //--- Template module's URI is used as template Code.
                $aModule['name'],
                $aModule['path'],
            );

            if(!$bSetCookie || bx_get('preview'))
                return $aResult;

            bx_setcookie($sCodeKey, $sCode, time() + 60*60*24*365);

            return $aResult;
        };

        $fCheckMix = function($aResult, $iMix, $bSetCookie) use($sMixKey, $sRootPath, $oDb) {
            list($sCode, $sName) = $aResult;
            if(empty($sName) || empty($iMix))
                return false;

            $aMix = $oDb->getParamsMix($iMix);
            if(empty($aMix) || !is_array($aMix) || $aMix['type'] != $sName)
                return false;

            if(!$bSetCookie)
                return $iMix;

            bx_setcookie($sMixKey, $iMix, time() + 60*60*24*365);

            return $iMix;
        };

        $sCode = getParam('template');
        if(empty($sCode))
            $sCode = BX_DOL_TEMPLATE_DEFAULT_CODE;
        $aResult = $fCheckCode($sCode, false);

        //--- Check selected template in COOKIE(the lowest priority) ---//
        $sCode = !empty($_COOKIE[$sCodeKey]) ? $_COOKIE[$sCodeKey] : '';
        $aResultCheck = $fCheckCode($sCode, false);
        if($aResultCheck !== false)
            $aResult = $aResultCheck;

        //--- Check selected template in GET(the highest priority) ---//
        $sCode = !empty($_GET[$sCodeKey]) ? $_GET[$sCodeKey] : '';
        $aResultCheck = $fCheckCode($sCode, true);
        if($aResultCheck !== false)
            $aResult = $aResultCheck;

        if($aResult === false) 
            return $aResult;

        if(!is_array($aResult[0]))
            $aResult[0] = array($aResult[0]);

        $iMixDefault = 0;        
        if (!empty($aResult[1])) {
            if (!BxDolDb::getInstance()->isParamInCache($aResult[1] . '_default_mix')) {
                $GLOBALS['glMixesDisabled'] = true; // disable mixes, if template doesn't support mixes
            } else {
                $iMixDefault = (int)getParam($aResult[1] . '_default_mix');
            }
        }

        //--- Check selected mix in COOKIE(the lowest priority) ---//
        $iMix = !empty($_COOKIE[$sMixKey]) ? (int)$_COOKIE[$sMixKey] : 0;
        $iResultCheck = $fCheckMix($aResult, $iMix, false);
        if($iResultCheck !== false) {
            $aMix = $oDb->getParamsMix($iMix);
            if((int)$aMix['published'] == 0 && $iMix != $iMixDefault) {
                $aUrl = parse_url(BX_DOL_URL_ROOT);
                $sPath = isset($aUrl['path']) && !empty($aUrl['path']) ? $aUrl['path'] : '/';

                setcookie($sMixKey, '', time() - 96 * 3600, $sPath);
                unset($_COOKIE[$sMixKey]);
            }
            else
                $aResult[0][1] = $iResultCheck;
        }

        //--- Check selected mix in GET(the highest priority) ---//
        $iMix = !empty($_GET[$sMixKey]) ? (int)$_GET[$sMixKey] : 0;
        $iResultCheck = $fCheckMix($aResult, $iMix, true);
        if($iResultCheck !== false)
            $aResult[0][1] = $iResultCheck;

        //--- Get default mix for currently selected template ---//
        if(empty($aResult[0][1]) && !empty($iMixDefault)) {
            $iResultCheck = $fCheckMix($aResult, $iMixDefault, false);
            if($iResultCheck !== false)
                $aResult[0][1] = $iResultCheck;
        }

        if(is_array($aResult[0]) && count($aResult[0]) == 1)
           $aResult[0] = $aResult[0][0];

        return $aResult;
    }

    public function getIncludedUrls($sType)
    {
        if (!isset($this->aPage[$sType]))
            return array();
        $a = array();
        foreach ($this->aPage[$sType] as $r)
            $a[] = $r['url'];
        return $a;
    }

    /**
     * Remember current state of aPage variable with all css, js, etc
     */
    public function collectingStart()
    {
        $this->aPageSnapshot = $this->aPage;
    }

    public function collectingInject($aCss, $aJs)
    {
        $a = array('css' => 'aCss', 'js' => 'aJs');
        foreach ($a as $s => $sVar) {
            if (empty($$sVar))
                continue;
            $sKey = $s . '_compiled';
            foreach ($$sVar as $r)
                $this->aPage[$sKey][] = $r;
        }
    }

    /**
     * Get difference for non-system css and js files from previously remembered state as ready HTML code, 
     * additionally filter out css and js from $aExcludeCss and $aExcludeJs arrays
     */
    public function collectingEndGetCode($aExcludeCss = array(), $aExcludeJs = array(), $sFormat = 'html')
    {
        if (!is_array($aExcludeCss))
            $aExcludeCss = [];
        if (!is_array($aExcludeJs))
            $aExcludeJs = [];

        $aPageSave = $this->aPage; // save current state to restore later

        // filter funcs
        $fFilterCss = function ($a) use ($aExcludeCss) {
            if (in_array($a['url'], $aExcludeCss))
                return false;
            if (isset($this->aPageSnapshot['css_compiled']))
                foreach ($this->aPageSnapshot['css_compiled'] as $r)
                    if ($r['url'] == $a['url'])
                        return false;
            return true;
        };
        $fFilterJs = function ($a) use ($aExcludeJs) {
            if (in_array($a['url'], $aExcludeJs))
                return false;
            if (isset($this->aPageSnapshot['js_compiled']))
                foreach ($this->aPageSnapshot['js_compiled'] as $r)
                    if ($r['url'] == $a['url'])
                        return false;
            return true;
        };    

        // diff aPageSnapshot and aPage and output only newly added css/js
        $this->aPage['css_compiled'] = array_filter($this->aPage['css_compiled'], $fFilterCss);
        $this->aPage['js_compiled'] = array_filter($this->aPage['js_compiled'], $fFilterJs);

        // return js/css
        $mixedRet = '';
        if ('html' == $sFormat) {
            $mixedRet .= $this->includeFiles('css');
            $mixedRet .= $this->includeFiles('js');
        }
        else {
            $mixedRet = array(
                'css' => $this->aPage['css_compiled'],
                'js' => $this->aPage['js_compiled'],
            );
        }

        // restore original state
        $this->aPageSnapshot = array();
        $this->aPage = $aPageSave; 

        return $mixedRet;
    }

    public function getClassName()
    {
        return get_class($this);
    }

    public static function getColorPalette()
    {
        $aResult = self::$_aColors;

        /**
         * @hooks
         * @hookdef hook-system-get_color_palette 'system', 'get_color_palette' - hook on get color palette
         * - $unit_name - equals `system`
         * - $action - equals `get_color_palette` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [array] by ref, array of colors, can be overridden in hook processing
         * @hook @ref hook-system-get_color_palette
         */
        bx_alert('system', 'get_color_palette', 0, false, array(
            'override_result' => &$aResult
        ));

        if($aResult != self::$_aColors) {
            $oTemplate = self::getInstance();
            foreach($aResult as $sName => $aRgb) {
                $sRgb = 'rgb(' . trim(implode(', ', $aRgb)) . ') !important';

                $oTemplate->addCssStyle('.' . self::$_sColorClassPrefix . $sName, array(
                    'color' => $sRgb
                ));
                $oTemplate->addCssStyle('.' . self::$_sColorClassPrefixBg . $sName, array(
                    'background-color' => $sRgb
                ));
            }
        }

        return $aResult;
    }

    public static function getColorCode($mixedName = false, $fOpacity = false)
    {
        $aPalette = self::getColorPalette();
        $aClasses = array_keys($aPalette);

        if($mixedName === false || (is_string($mixedName) && !is_numeric($mixedName) && !in_array($mixedName, $aClasses)))
            $mixedName = $aClasses[rand(0, count($aClasses) - 1)];
        else if(is_numeric($mixedName))
            $mixedName = $aClasses[(int)$mixedName % count($aClasses)];

        $aColor = $aPalette[$mixedName];
        if($fOpacity !== false && is_numeric($fOpacity))
            $aColor[] = $fOpacity;

        return $aColor;
    }

    public static function getColorClass($sType = BX_DOL_COLOR_FT, $sName = '')
    {
        $aClasses = array_keys(self::getColorPalette());

        if(empty($sName) || !in_array($sName, $aClasses))
            $sName = $aClasses[rand(0, count($aClasses) - 1)];

        $sPrefix = '';
        switch ($sType) {
            case BX_DOL_COLOR_FT:
                $sPrefix = self::$_sColorClassPrefix;
                break;

            case BX_DOL_COLOR_BG:
                $sPrefix = self::$_sColorClassPrefixBg;
                break;
        }

        return $sPrefix . $sName;
    }

    /**
     * Load templates.
     */
    function loadTemplates()
    {
        $aResult = array();
        foreach($this->_aTemplates as $sName)
            $aResult[$sName] = $this->getHtml($sName . '.html');
        $this->_aTemplates = $aResult;
    }
    /**
     * Initialize template engine.
     * Note. The method is executed with the system, you shouldn't execute it in your subclasses.
     */
    function init()
    {
        $this->loadTemplates();

        //--- Load page elements related static variables ---//
        $this->aPage = array(
            'name_index' => BX_PAGE_DEFAULT,
            'type' => BX_PAGE_TYPE_DEFAULT,
            'url' => '',
            'header' => '',
            'header_text' => '',
            'keywords' => array(),
            'location' => array(),
            'title' => '',
            'description'  => '',
            'robots' => '',
            'base' => ['href' =>  BX_DOL_URL_ROOT],
            'css_name' => array(),
            'css_compiled' => array(),
            'css_system' => array(),
            'css_async' => array(),
            'js_name' => array(),
            'js_compiled' => array(),
            'js_system' => array(),
            'js_options' => array(),
            'js_translations' => array(),
            'js_images' => array(),
            'injections' => array()
        );

        //--- Load default CSS, JS, etc ---//
        BxDolPreloader::getInstance()->perform($this);

        //--- Load injection's cache ---//
        if (getParam('sys_db_cache_enable')) {
            $oDb = BxDolDb::getInstance();
            $oCache = $oDb->getDbCacheObject();
            $sCacheKey = $oDb->genDbCacheKey($this->_sInjectionsCache);

            $aInjections = $oCache->getData($sCacheKey);
            if ($aInjections === null) {
                $aInjections = $this->getInjectionsData();
                $oCache->setData ($sCacheKey, $aInjections);
            }
        } 
        else
            $aInjections = $this->getInjectionsData();

        $this->aPage['injections'] = $aInjections;

        //--- Load images/icons cache ---//
        $this->initImages();

        bx_import('BxTemplConfig'); // TODO: for some reason autoloader isn't working here....
        $this->_oTemplateConfig = BxTemplConfig::getInstance();

        bx_import('BxTemplFunctions');
        $this->_oTemplateFunctions = BxTemplFunctions::getInstance($this);

        $this->addJsOption('sys_fixed_header');
        $this->addJsOption('sys_confirmation_before_redirect');
        $this->addJsOption('sys_storage_s3_endpoint');
    }
    
    protected function initImages()
    {
        self::$_iImagesCacheTTL = 86400;
        self::$_sImagesCacheKey = 'sys_layout_images_' . $this->_sCode .  '_' . bx_site_hash('images') . '.php';
        self::$_aImages = BxDolDb::getInstance()->getDbCacheObject()->getData(self::$_sImagesCacheKey);
        if(!self::$_aImages)
            self::$_aImages = [];

        /**
         * @hooks
         * @hookdef hook-system-get_layout_images 'system', 'get_layout_images' - hook on get layout images
         * - $unit_name - equals `system`
         * - $action - equals `get_layout_images` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `code` - [string] page code
         *      - `override_result` - [array] by ref, array of images, can be overridden in hook processing
         * @hook @ref hook-system-get_layout_images
         */
        bx_alert('system', 'get_layout_images', 0, false, [
            'code' => $this->_sCode,
            'override_result' => &self::$_aImages
        ]);
    }

    protected function saveImages()
    {
        if(!self::$_iImagesCacheTTL)
            $this->initImages();

        BxDolDb::getInstance()->getDbCacheObject()->setData(self::$_sImagesCacheKey, self::$_aImages, self::$_iImagesCacheTTL);
    }

    protected function getInjectionsData ()
    {
        $oDb = BxDolDb::getInstance();

        $aInjections = $oDb->getAll("SELECT `page_index`, `name`, `key`, `type`, `data`, `replace` FROM `" . $this->_sInjectionsTable . "` WHERE `active`='1'");
        if (!$aInjections)
            return array();

        foreach ($aInjections as $aInjection)
            $aInjections['page_' . $aInjection['page_index']][$aInjection['key']][] = $aInjection;

        return $aInjections;
    }

    /**
     * Set page name index
     * @param int $i name index
     */
    function setPageNameIndex($i)
    {
        $this->aPage['name_index'] = $i;
    }
    
    /**
     * Set page name index by target.
     * @param string $s target. 
     */
    function setPageNameIndexByTarget($s)
    {
        $i = BX_PAGE_DEFAULT;

        switch($s) {
            case 'bx-content-preload':
                $i = BX_PAGE_CONTENT_PRELOAD;
                break;

            case 'bx-content-with-toolbar-wrapper':
                //$i = 52;
                break;

            case 'bx-content-with-cover-wrapper':
                $i = BX_PAGE_CONTENT_WITH_COVER;
                break;

            case 'bx-content-with-submenu-wrapper':
                $i = BX_PAGE_CONTENT_WITH_SUBMENU;
                break;

            case 'bx-content-wrapper':
                $i = BX_PAGE_CONTENT;
                break;
        }

        $this->aPage['name_index'] = $i;
    }

    /**
     * Get page name index
     * @return int $i name index
     */
    function getPageNameIndex()
    {
        return isset($this->aPage['name_index']) ? (int)$this->aPage['name_index'] : 0;
    }

	/**
     * Set page type
     * @param int $i page type
     */
    function setPageType($i)
    {
        $this->aPage['type'] = $i;
    }
    
    /**
     * Set page url
     * @param string $s page url
     */
    function setPageUrl($s)
    {
        $this->aPage['url'] = $s;
    }

    /**
     * Get page type
     * @return int $i page type
     */
    function getPageType()
    {
        $iType = BX_PAGE_TYPE_DEFAULT;
        if(isset($this->aPage['type']))
            $iType = (int)$this->aPage['type'];

        if($iType == BX_PAGE_TYPE_DEFAULT) 
            $iType = (int)getParam('sys_pt_default_' . (isLogged() ? 'member' : 'visitor'));

        return $iType;
    }

    /**
     * Set page header
     * @param string $s page header
     */
    function setPageHeader($s)
    {
        $this->aPage['header'] = $s;
    }

    /**
     * Get page header
     * @return string $s page header
     */
    function getPageHeader()
    {
        return $this->aPage['header'];
    }

    /**
     * Set page params. Available page params are: name_index, header
     * @param array $a page params
     */
    function setPageParams($a)
    {
        if (!empty($this->aPage))
            $this->aPage = array_merge($this->aPage, $a);
        else
            $this->aPage = $a;
    }

    /**
     * Get page params.
     * @return array $a page params
     */
    function getPageParams()
    {
        return $this->aPage;
    }

    /**
     * Set page meta title.
     *
     * @param string sTitle necessary page description.
     */
    function setPageMetaTitle($sTitle)
    {
        $this->aPage['title'] = $sTitle;
    }
    
    /**
     * Set page description.
     *
     * @param string $sDescription necessary page description.
     */
    function setPageDescription($sDescription)
    {
        $this->aPage['description'] = $sDescription;
    }

    /**
     * Set page meta robots.
     *
     * @param string $s page meta robots.
     */
    function setPageMetaRobots($s)
    {
        $this->aPage['robots'] = $s;
    }

    /**
     * Set page injections.
     *
     * @param array $aInjections name => value injections.
     */
    function setPageInjections($aInjections)
    {
        if(empty($aInjections) || !is_array($aInjections))
            return;

        foreach($aInjections as $sName => $sValue)
            $this->addInjection('injection_' . $sName, 'text', $sValue);
    }
    
    /**
     * Set page content for some variable.
     * @param string $sVar     name of content variable
     * @param string $sContent content for $sVar variable
     * @param int    $iIndex   optional page index, default is index which was set before with @see setPageNameIndex function, or 0
     */
    function setPageContent($sVar, $sContent, $iIndex = false)
    {
        $i = false !== $iIndex ? $iIndex : $this->getPageNameIndex();
        $this->aPageContent[$i][$sVar] = $sContent;
    }

    /**
     * Get page content for some variable.
     * @param  string $sVar   name of content variable
     * @param  int    $iIndex optional page index, default is index which was set before with @see setPageNameIndex function, or 0
     * @return string page content for some variable or for the whole page.
     */
    function getPageContent($sVar = false, $iIndex = false)
    {
        $i = false !== $iIndex ? $iIndex : $this->getPageNameIndex();
        return false !== $sVar ? $this->aPageContent[$i][$sVar] : $this->aPageContent[$i];
    }

    /**
     * Get currently active template name.
     *
     * @return string template's name.
     */
    function getName()
    {
        return $this->_sName;
    }
    
    /**
     * Get currently active template name.
     *
     * @return string template's name.
     */
    function getCssClassName()
    {
        return str_replace('_', '-', $this->_sName);
    }

    /**
     * Get currently active template code.
     *
     * @return string template's code.
     */
    function getCode()
    {
        return $this->_sCode;
    }
    
    /**
     * Get embed code.
     *
     * @return string embed's code.
     */
    function getEmbed($sContent)
    {
        if ($sContent == ''){
            header('Content-Security-Policy: frame-ancestors ' . getParam('sys_csp_frame_ancestors')) ;
            $this->displayPageNotFound('', BX_PAGE_EMBED);
            exit;
        }
        
        $this->addJs(['inc/js/|embed.js']);
        $this->addCss(['embed.css']);
        $this->aPage['base']['target'] = '_blank';
        $this->setPageNameIndex (BX_PAGE_EMBED);
        $this->setPageContent('page_main_code', '<div class="bx-embed">' . $sContent . '</div>');
        $this->getPageCode();
    }

    /**
     * Get code key.
     *
     * @return string template's code key.
     */
    function getCodeKey()
    {
        return $this->_sCodeKey;
    }

    /**
     * Get currently active template mix.
     *
     * @return integer template's mix.
     */
    function getMix()
    {
        return $this->_iMix;
    }

    /**
     * Get currently active template path.
     *
     * @return string template's path.
     */
    function getPath()
    {
        return $this->_sSubPath;
    }

    /**
     * Set page title.
     * @deprecated use setPageHeader
     *
     * @param string $sTitle necessary page title.
     */
    function setPageTitle($sTitle)
    {
        $this->setPageHeader($sTitle);
    }

    /**
     * Set page's main box title.
     * @deprecated use setPageParams
     *
     * @param string $sTitle necessary page's main box title.
     */
    function setPageMainBoxTitle($sTitle)
    {
        $this->setPageParams(array('header_text' => $sTitle));
    }

    /**
     * Check whether location exists or not.
     * @param string $sKey - location's unique key.
     */
    function isLocation($sKey)
    {
        return isset($this->_aLocations[$sKey]);
    }

    /**
     * Get a lis of all added locations.
     * @return array with locations.
     */
    function getLocations()
    {
        return $this->_aLocations;
    }

    /**
     * Add location in array of locations.
     * Note. Location is the path/url to folder where 'templates' folder is stored.
     *
     * @param string $sKey          - location's unique key.
     * @param string $sLocationPath - location's path. For modules: '[path_to_script]/modules/[vendor_name]/[module_name]/'
     * @param string $sLocationUrl  - location's url. For modules: '[url_to_script]/modules/[vendor_name]/[module_name]/'
     */
    function addLocation($sKey, $sLocationPath, $sLocationUrl)
    {
        $this->_aLocations[$sKey] = array(
            'path' => $sLocationPath,
            'url' => $sLocationUrl,
        );

        return $sKey;
    }
    /**
     * Add dynamic location.
     *
     * @param  string   $sLocationPath - location's path. For modules: '[path_to_script]/modules/[vendor_name]/[module_name]/'
     * @param  string   $sLocationUrl  - location's url. For modules: '[url_to_script]/modules/[vendor_name]/[module_name]/'
     * @return location key. Is needed to remove the location.
     */
    function addDynamicLocation($sLocationPath, $sLocationUrl)
    {
        $sLocationKey = time() . mt_rand();
        $this->addLocation($sLocationKey, $sLocationPath, $sLocationUrl);

        return $sLocationKey;
    }
    /**
     * Remove location from array of locations.
     * Note. Location is the path/url to folder where templates are stored.
     *
     * @param string $sKey - location's    unique key.
     */
    function removeLocation($sKey)
    {
        if(isset($this->_aLocations[$sKey]))
           unset($this->_aLocations[$sKey]);
    }
	/**
     * Check whether JS location exists or not.
     * @param string $sKey - JS location's unique key.
     */
    function isLocationJs($sKey)
    {
        return isset($this->_aLocationsJs[$sKey]);
    }
    /**
     * Add JS location in array of JS locations.
     * Note. Location is the path/url to folder where JS files are stored.
     *
     * @param string $sKey          - location's    unique key.
     * @param string $sLocationPath - location's path. For modules: '[path_to_script]/modules/[vendor_name]/[module_name]/js/'
     * @param string $sLocationUrl  - location's url. For modules: '[url_to_script]/modules/[vendor_name]/[module_name]/js/'
     */
    function addLocationJs($sKey, $sLocationPath, $sLocationUrl)
    {
        $this->_aLocationsJs[$sKey] = array(
            'path' => $sLocationPath,
            'url' => $sLocationUrl
        );

        return $sKey;
    }
    /**
     * Add dynamic JS location.
     *
     * @param  string   $sLocationPath - location's path. For modules: '[path_to_script]/modules/[vendor_name]/[module_name]/'
     * @param  string   $sLocationUrl  - location's url. For modules: '[url_to_script]/modules/[vendor_name]/[module_name]/'
     * @return location key. Is needed to remove the location.
     */
    function addDynamicLocationJs($sLocationPath, $sLocationUrl)
    {
        $sLocationKey = time() . mt_rand();
        $this->addLocationJs($sLocationKey, $sLocationPath, $sLocationUrl);

        return $sLocationKey;
    }
    /**
     * Remove JS location from array of locations.
     * Note. Location is the path/url to folder where templates are stored.
     *
     * @param string $sKey - JS location's    unique key.
     */
    function removeLocationJs($sKey)
    {
        if(isset($this->_aLocationsJs[$sKey]))
           unset($this->_aLocationsJs[$sKey]);
    }
    /**
     * Add Option in JS output.
     *
     * @param mixed $mixedName option's name or an array of options' names.
     */
    function addJsOption($mixedName)
    {
        if(is_string($mixedName))
            $mixedName = array($mixedName);

        foreach($mixedName as $sName)
            $this->aPage['js_options'][$sName] = getParam($sName);
    }
    /**
     * Add language translation for key in JS output.
     *
     * @param mixed $mixedKey language key or an array of keys.
     */
    function addJsTranslation($mixedKey, $bDynamic = false)
    {
        if(is_string($mixedKey))
            $mixedKey = array($mixedKey);

        foreach($mixedKey as $sKey)
            $this->aPage['js_translations'][$sKey] = _t($sKey, '{0}', '{1}');

        return $bDynamic ? $this->_processJsTranslations() : '';
    }

    /**
     * get added js translations
     */ 
    function getJsTranslation($bDynamic = false)
    {
        return $bDynamic ? $this->_processJsTranslations() : $this->aPage['js_translations'];
    }

    /**
     * Add image in JS output.
     *
     * @param array $aImages an array of image descriptors.
     *                       The descriptor is a key/value pear in the array of descriptors.
     */
    function addJsImage($aImages)
    {
        if(!is_array($aImages))
            return;

        foreach($aImages as $sKey => $sFile) {
            $sUrl = $this->getImageUrl($sFile);
            if(empty($sUrl))
                continue;

            $this->aPage['js_images'][$sKey] = $sUrl;
        }
    }
    /**
     * Add icon in JS output.
     *
     * @param array $aIcons an array of icons descriptors.
     *                      The descriptor is a key/value pear in the array of descriptors.
     */
    function addJsIcon($aIcons)
    {
        if(!is_array($aIcons))
            return;

        foreach($aIcons as $sKey => $sFile) {
            $sUrl = $this->getIconUrl($sFile);
            if(empty($sUrl))
                continue;

            $this->aPage['js_images'][$sKey] = $sUrl;
        }
    }
	/**
	 * Add CSS style.
	 *
	 * @param string $sName CSS class name.
	 * @param string $sContent CSS class styles.
	 */
	function addCssStyle($sName, $sContent)
	{
		$this->aPage['css_styles'][$sName] = $sContent;
	}
    /**
     * Set page keywords.
     *
     * @param mixed  $mixedKeywords necessary page keywords(string - single keyword, array - an array of keywords).
     * @param string $sDevider      - string devider.
     */
    function addPageKeywords($mixedKeywords, $sDevider = ',')
    {
        if(is_string($mixedKeywords))
            $mixedKeywords = strpos($mixedKeywords, $sDevider) !== false ? explode($sDevider, $mixedKeywords) : array($mixedKeywords);

        foreach($mixedKeywords as $iKey => $sValue)
            $mixedKeywords[$iKey] = trim($sValue);

        $this->aPage['keywords'] = isset($this->aPage['keywords']) && is_array($this->aPage['keywords']) ? array_merge($this->aPage['keywords'], $mixedKeywords) : $mixedKeywords;
    }
    /**
     * Set page locatoin coordinates.
     *
     * @param $fLat latitude
     * @param $fLng longitude
     */
    function addPageMetaLocation($fLat, $fLng, $sCountryCode)
    {
        $this->aPage['location'] = array('lat' => $fLat, 'lng' => $fLng, 'country' => $sCountryCode);
    }
    /**
     * Set page meta image.
     *
     * @param $sImageUrl meta image url
     */
    function addPageMetaImage($sImageUrl)
    {
        $this->aPage['image'] = $sImageUrl;
    }
    /**
     * Set page rss link.
     *
     * @param $sTitle - rss feed title
     * @param $sUrl - rss feed URL
     */
    function addPageRssLink($sTitle, $sUrl)
    {
        if (!isset($this->aPage['rss']))
            $this->aPage['rss'] = array('title' => $sTitle, 'url' => $sUrl);
        else
            $this->aPage['rss'] = false;
    }
    /**
     * Returns page meta info, like meta keyword, meta description, location, etc
     */
    function getMetaInfo()
    {
        $sRet = '';

        $oPage = BxDolPage::getObjectInstanceByURI();
        $bPage = $oPage !== false;

        // general meta tags
        if(!empty($this->aPage['keywords']) && is_array($this->aPage['keywords']))
            $sRet .= '<meta name="keywords" content="' . bx_html_attribute(implode(',', $this->aPage['keywords'])) . '" />';

        $sUrl = $sUri = '';
        if(($sKu = 'url') && !empty($this->aPage[$sKu])) {
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($this->aPage[$sKu]));

            list(, $aPageParams) = bx_get_base_url($this->aPage[$sKu]);
            $sUri = $aPageParams['i'] ?? '';
        }
            
        
        // Process header
        $sHeader = '';
        if(($sKh = 'header') && !empty($this->aPage[$sKh]) && is_string($this->aPage[$sKh]))
            $sHeader = $this->aPage[$sKh];
        $bHeader = !empty($sHeader);

        if($bHeader) {
            $sHeader = strip_tags($sHeader);

            // Collapse spaces/newlines and fix run-on words
            $sHeader = preg_replace('/\s+/', ' ', $sHeader);                     
            $sHeader = preg_replace('/([a-z0-9])([A-Z])/', '$1 $2', $sHeader);
            $sHeader = trim($sHeader);

            $bHeader = !empty($sHeader);
        }

        $sHeaderAttr = $bHeader ? bx_html_attribute($sHeader) : '';

        // Process description
        $sDescription = '';
        if(($sKd = 'description') && !empty($this->aPage[$sKd]) && is_string($this->aPage[$sKd]))
            $sDescription = $this->aPage[$sKd];
        if(!$sDescription && $bPage)
            $sDescription = $oPage->getMetaDescription();
        $bDescription = !empty($sDescription);

        if($bDescription) {
            // Convert HTML breaks/lists to spaces before stripping tags
            $sDescription = preg_replace('#<(?:br\s*/?|/p|/li)>#i', ' ', $sDescription);
            $sDescription = strip_tags($sDescription);

            // Normalize whitespace
            $sDescription = preg_replace('/\s+/u', ' ', $sDescription);

            // Ensure space after punctuation if missing (".This" → ". This")
            $sDescription = preg_replace('/([.,;:])([^\s])/u', '$1 $2', $sDescription);
            $sDescription = trim($sDescription);

            if(($iDescriptionMaxLen = 300) && mb_strlen($sDescription) > $iDescriptionMaxLen) {
                $sDescription = mb_substr($sDescription, 0, $iDescriptionMaxLen);

                // Trim partial word and remove dangling punctuation
                $sDescription = preg_replace('/\s+\S*$/u', '', $sDescription);
                $sDescription = rtrim($sDescription, " ,;:-");

                $sDescription .= '...';
            }
            
            $bDescription = !empty($sDescription);
        }

        $sDescriptionAttr = '';
        if($bDescription && ($sDescriptionAttr = bx_html_attribute($sDescription)))
            $sRet .= '<meta name="description" content="' . $sDescriptionAttr . '" />';

        // location
        if(!empty($this->aPage['location']) && isset($this->aPage['location']['lat']) && isset($this->aPage['location']['lng']) && isset($this->aPage['location']['country']))
            $sRet .= '
                <meta name="ICBM" content="' . $this->aPage['location']['lat'] . ';' . $this->aPage['location']['lng'] . '" />
                <meta name="geo.position" content="' . $this->aPage['location']['lat'] . ';' . $this->aPage['location']['lng'] . '" />
                <meta name="geo.region" content="' . bx_html_attribute($this->aPage['location']['country']) . '" />';

        //set meta[image] value
        if(empty($this->aPage['image'])) {
            // use cover image if exists
            if($bPage && ($aCover = $oPage->getPageCoverImage()))
                $this->aPage['image'] = BxDolCover::getInstance($this)->getCoverImageUrl($aCover);

            // use system Apple/Android icons if exists
            if(empty($this->aPage['image'])) {
                $oImgStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
                foreach(['icon_android_splash', 'icon_android', 'icon_apple'] as $sIcon)
                    if(($iIcon = (int)getParam('sys_site_' . $sIcon)) != 0 && ($sImageUrl = $oImgStorage->getFileUrlById($iIcon))) {
                        $this->aPage['image'] = $sImageUrl;
                        break;
                    }
            }
        }

        // facebook / twitter
        $bPageImage = !empty($this->aPage['image']);
        $sRet .= '<meta name="twitter:card" content="' . ($bPageImage ? 'summary_large_image' : 'summary') . '" />';

        $sOgType = 'website';
        if(preg_match("/(discussion|glossary|item|post)/", $sUri))
            $sOgType = 'article';
        else if(preg_match("/(ad|product|shopify\-entry|snipcart\-entry)/", $sUri))
            $sOgType = 'product';
        else if(preg_match("/(album|album\-media)/", $sUri))
            $sOgType = 'album';
        else if(strpos($sUri, 'profile') !== false)
            $sOgType = 'profile';
        else if(strpos($sUri, 'photo') !== false)
            $sOgType = 'image';
        else if(strpos($sUri, 'video') !== false)
            $sOgType = 'video.other';

        $sRet .= '<meta property="og:type" content="' . $sOgType . '" />';
        $sRet .= '<meta property="og:title" content="' . $sHeaderAttr . '" />';
        $sRet .= '<meta property="og:description" content="' . $sDescriptionAttr . '" />';
        if($bPageImage)
            $sRet .= '<meta property="og:image" content="' . $this->aPage['image'] . '" />';

        // Smart App Banner
        if(getParam('smart_app_banner') && false === strpos($_SERVER['HTTP_USER_AGENT'], 'UNAMobileApp')) {
            if($sAppIdIOS = getParam('smart_app_banner_ios_app_id'))
                $sRet .= '<meta name="apple-itunes-app" content="app-id=' . $sAppIdIOS . '" />';
        }

        // RSS
        $oFunctions = BxTemplFunctions::getInstance();
        $sRet .= $oFunctions->getManifests();
        $sRet .= $oFunctions->getMetaIcons();
        
        if(!empty($this->aPage['rss']) && !empty($this->aPage['rss']['url']))
            $sRet .= '<link rel="alternate" type="application/rss+xml" href="' . $this->aPage['rss']['url'] . '" title="' . bx_html_attribute($this->aPage['rss']['title'], BX_ESCAPE_STR_QUOTE) . '" />';
        $sRet .= '<link rel="alternate" type="application/json+oembed" href="' . BX_DOL_URL_ROOT . 'em.php?url=' . urlencode($_SERVER["REQUEST_URI"]) . '&format=json" title="' . $sHeaderAttr . '" />';

        if($sUrl)
            $sRet .= '<link rel="canonical" href="' . $sUrl . '" />';

        return $sRet;
    }
    /**
     * Get template, which was loaded earlier.
     * @see method this->loadTemplates and field this->_aTemplates
     *
     * @param  string $sName - template name.
     * @return string template's content.
     */
    public function getTemplate($sName)
    {
        return $this->_aTemplates[$sName];
    }

    /**
     * Get template functions object.
     * @see BxBaseFunctions
     */
    public function getTemplateFunctions()
    {
        return $this->_oTemplateFunctions;
    }

    /**
     * Get image MIME type.
     * 
     * @param string $sExtension - image file's extension.
     * @return string with MIME type. 
     */
    function getImageMimeType($sExtension)
    {
    	$sExtension = strtolower($sExtension);
    
    	$sResult = '';
    	switch($sExtension) {
    		case 'svg':
    			$sResult = 'svg+xml';
    			break;
    
    		default:
    			$sResult = $sExtension;
    	}
    
    	return 'data:image/' . $sResult;
    }

    /**
     * Get icon template in dependence of a value, provided in $mixedId.
     * 
     * @param  mixed $mixedId numeric id from Storage, string with template's file name or string with font icon.
     */
	public function getIcon($mixedId, $aParams = array())
    {
        return $this->_getImage('icon', $mixedId, $aParams);
    }

    /**
     * Get image template in dependence of a value, provided in $mixedId.
     * 
     * @param  mixed $mixedId numeric id from Storage, string with template's file name or string with font icon.
     */
    public function getImage($mixedId, $aParams = [])
    {
        return $this->_getImage('image', $mixedId, $aParams);
    }

    protected function _getImage($sType, $mixedId, $aParams = [])
    {
        $bWrap = ($sKey = 'wrap_in_tag') && (!isset($aParams[$sKey]) || $aParams[$sKey] === true);

        $sUrl = "";
        $aType2Method = ['image' => 'getImageUrl', 'icon' => 'getIconUrl'];

        //--- Check in System Storage.
        if(is_numeric($mixedId) && (int)$mixedId > 0) {
            $sStorage = BX_DOL_STORAGE_OBJ_IMAGES;
            if(!empty($aParams['storage'])) {
                $sStorage = $aParams['storage'];
                unset($aParams['storage']);
            }

            if(($sResult = BxDolStorage::getObjectInstance($sStorage)->getFileUrlById((int)$mixedId)) !== false)
                $sUrl = $sResult;
        }

        //--- Check in template folders.
        if($sUrl == "" && is_string($mixedId) && strpos($mixedId, '.') !== false)
            $sUrl = $this->{$aType2Method[$sType]}($mixedId);

        if($sUrl != "")
            return $bWrap ? $this->parseImage($sUrl, [
                'class' => isset($aParams['class']) && !empty($aParams['class']) ? $aParams['class'] : '',
            	'alt' => isset($aParams['alt']) && !empty($aParams['alt']) ? $aParams['alt'] : ''
            ]) : $sUrl;

        //--- Use iconic font.
        return $bWrap ? $this->parseIcon($mixedId, $aParams) : $mixedId;
    }

    /**
     * Get full URL for the icon.
     *
     * @param  string $sName    icon's file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string full URL.
     */
    function getIconUrl($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sContent = "";
        if(($sContent = $this->_getInlineData('icon', $sName, $sCheckIn)) !== false)
            return $sContent;

        return $this->_getAbsoluteLocation('url', $this->_sFolderIcons, $sName, $sCheckIn);
    }
    /**
     * Get absolute Path for the icon.
     *
     * @param  string $sName    - icon's file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string absolute path.
     */
    function getIconPath($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        return $this->_getAbsoluteLocation('path', $this->_sFolderIcons, $sName, $sCheckIn);
    }

    function getIconContent($sName)
    {
        if(strpos($sName, '.svg') === false)
            return false;

        $mixedResult = false;
        if(($sIconPath = $this->getIconPath($sName)))
            $mixedResult = file_get_contents($sIconPath);
        else
            $mixedResult = bx_file_get_contents($sName);

        return $mixedResult;
    }
    /**
     * Get image/icon by name automatically. Cache item description:
     * [
     *      'v' => value (name, url or source),
     *      'c' => classes list divided with comma (,)
     *      't' => parse type (ic - icon, im - image, sc - source)
     * ]
     * Cached images can be overwritten by listening 'system' - 'get_layout_images' alert.
     * 
     * @param string $sName unique name. The following format can be used: name|classes. 
     * Where name and classes can consists of multiple parts (divided with comma (,) in HTML variant). For example, 
     *     in PHP: $this->getImageAuto('far star|class1 class2');
     *     in HTML: <bx_image_auto:far,star|class1,class2 />
     * @param boolean $bWrapped wrap in HTML tag or not.
     * @param string $sCheckIn where the content would be searched(base, template, both)
     * @return string icon/image value (name, url or source) or final HTML code.
     */
    function getImageAuto($sName, $bWrapped = true, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sDivParts = '|';
        $sDivItems = ',';

        $sKey = md5($sName);

        $sClasses = '';
        if(strpos($sName, $sDivParts) !== false)
            list($sName, $sClasses) = explode($sDivParts, $sName);

        if(strpos($sName, $sDivItems) !== false)
            $sName = implode(' ', explode($sDivItems, $sName));

        if(!isset(self::$_aImages[$sKey])) {
            $aResult = [
                'v' => $sName,
                't' => 'ic',
                'c' => $sClasses
            ];

            $sUrl = '';
            foreach(['Image', 'Icon'] as $sType) 
                foreach(['svg', 'png', 'jpg', 'gif'] as $sExt)
                    if(($sUrl = $this->{'get' . $sType . 'Url'}($sName . '.' . $sExt, $sCheckIn)) != '') {
                        $aResult = [
                            'v' => $sUrl,
                            't' => 'im',
                            'c' => $sClasses
                        ];
                        break 2;
                    }

            self::$_aImages[$sKey] = $aResult;

            $this->saveImages();
        }

        if(!self::$_aImages[$sKey]['v'])
            return '';

        if(!$bWrapped || self::$_aImages[$sKey]['t'] == 'sc')
            return self::$_aImages[$sKey]['v'];       

        $aAttrs = [];
        if(self::$_aImages[$sKey]['c'] != '')
            $aAttrs['class'] = implode(' ', explode($sDivItems, self::$_aImages[$sKey]['c']));

        $aType2Method = ['ic' => 'parseIcon', 'im' => 'parseImage'];
        return $this->{$aType2Method[self::$_aImages[$sKey]['t']]}(self::$_aImages[$sKey]['v'], $aAttrs);
    }

    /**
     * Get full URL for the image.
     *
     * @param  string $sName    - images's file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string full URL.
     */
    function getImageUrl($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sContent = "";
        if(($sContent = $this->_getInlineData('image', $sName, $sCheckIn)) !== false)
            return $sContent;

        return $this->_getAbsoluteLocation('url', $this->_sFolderImages, $sName, $sCheckIn);
    }
    /**
     * Get absolute Path for the image.
     *
     * @param  string $sName    - image's file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string absolute path.
     */
    function getImagePath($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        return $this->_getAbsoluteLocation('path', $this->_sFolderImages, $sName, $sCheckIn);
    }
    /**
     * Get full URL of CSS file.
     *
     * @param  string $sName    - CSS file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string full URL.
     */
    function getCssUrl($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        if(($aFile = $this->_locateFile('css', $sName)) !== false)
            return $aFile[0];

        return $this->_getAbsoluteLocation('url', $this->_sFolderCss, $sName, $sCheckIn);
    }
    function getCssUrlWithRevision($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sUrl = $this->getCssUrl($sName, $sCheckIn);
        if(!empty($sUrl))
            $sUrl = $this->addRevision($sUrl);

        return $sUrl;
    }

    /**
     * Get full Path of CSS file.
     *
     * @param  string $sName    - CSS file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string full URL.
     */
    function getCssPath($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        if(($aFile = $this->_locateFile('css', $sName)) !== false)
            return $aFile[1];

        return $this->_getAbsoluteLocation('path', $this->_sFolderCss, $sName, $sCheckIn);
    }
    /**
     * Get full URL of JS file.
     *
     * @param  string $sName    - JS file name.
     * @return string full URL.
     */
    function getJsUrl($sName)
    {
        if(($aFile = $this->_locateFile('js', $sName)) !== false)
            return $aFile[0];

        return $this->_getAbsoluteLocationJs('url', $sName);
    }
    function getJsUrlWithRevision($sName)
    {
        $sUrl = $this->getJsUrl($sName);
        if(!empty($sUrl))
            $sUrl = $this->addRevision($sUrl);

        return $sUrl;
    }
    /**
     * Get full Path of JS file.
     *
     * @param  string $sName    - JS file name.
     * @return string full URL.
     */
    function getJsPath($sName)
    {
        if(($aFile = $this->_locateFile('js', $sName)) !== false)
            return $aFile[1];

        return $this->_getAbsoluteLocationJs('path', $sName);
    }
    /**
     * Get full URL of Template (HTML) file.
     *
     * @param  string $sName    - Template file name.
     * @return string full URL.
     */
    function getTemplateUrl($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        return $this->_getAbsoluteLocation('url', $this->_sFolderHtml, $sName, $sCheckIn);
    }
    /**
     * Get full Path of JS file.
     *
     * @param  string $sName    - JS file name.
     * @return string full URL.
     */
    function getTemplatePath($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        return $this->_getAbsoluteLocation('path', $this->_sFolderHtml, $sName, $sCheckIn);
    }

    /**
     * Get menu.
     * @param $s menu object name
     * @return html or empty string
     */
    function getMenu ($s)
    {
        $oMenu = BxDolMenu::getObjectInstance($s);
        
        if($s == 'sys_site_submenu'){
            $oPage = BxDolPage::getObjectInstanceByURI();
            if ($oPage && $oPage->getSubMenu() == 'disabled'){
                return;
            }
        }
        return $oMenu ? $oMenu->getCode () : '';
    }

    /**
     * Check whether HTML file exists or not.
     *
     * @param  string $sName    - HTML file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return boolean result of operation.
     */
    function isHtml($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        return $this->_getAbsoluteLocation('path', $this->_sFolderHtml, $sName, $sCheckIn) != '';
    }

    /**
     * Get content of HTML file.
     *
     * @param  string $sName    - HTML file name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string full content of the file and false on failure.
     */
    function getHtml($sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sAbsolutePath = $this->_getAbsoluteLocation('path', $this->_sFolderHtml, $sName, $sCheckIn);
        return !empty($sAbsolutePath) ? trim(file_get_contents($sAbsolutePath)) : false;
    }

    /**
     * Parse HTML template. Search for the template with accordance to it's file name.
     *
     * @see allows to use cache.
     *
     * @param  string $sName               - HTML file name.
     * @param  array  $aVariables          - key/value pairs. key should be the same as template's key, but without prefix and postfix.
     * @param  mixed  $mixedKeyWrapperHtml - key wrapper(string value if left and right parts are the same, array(left, right) otherwise).
     * @param  string $sCheckIn            where the content would be searched(base, template, both)
     * @return string the result of operation.
     */
    function parseHtmlByName($sName, $aVariables, $mixedKeyWrapperHtml = null, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginTemplate($sName, $sRand = time().rand());

        if (($sContent = $this->getCached($sName, $aVariables, $mixedKeyWrapperHtml, $sCheckIn)) !== false) {
            if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endTemplate($sName, $sRand, $sContent, true);
            return $sContent;
        }

        $sRet = '';
        if (($sContent = $this->getHtml($sName, $sCheckIn)) !== false)
            $sRet = $this->_parseContent($sContent, $aVariables, $mixedKeyWrapperHtml);

        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endTemplate($sName, $sRand, $sRet, false);

        return $sRet;
    }
    /**
     * Parse HTML template.
     *
     * @see Doesn't allow to use cache.
     *
     * @param  string $sContent            - HTML file content.
     * @param  array  $aVariables          - key/value pairs. key should be the same as template's key, but without prefix and postfix.
     * @param  mixed  $mixedKeyWrapperHtml - key wrapper(string value if left and right parts are the same, array(left, right) otherwise).
     * @return string the result of operation.
     */
    function parseHtmlByContent($sContent, $aVariables, $mixedKeyWrapperHtml = null)
    {
        if(empty($sContent))
            return "";

        return $this->_parseContent($sContent, $aVariables, $mixedKeyWrapperHtml);
    }
    /**
     * Parse earlier loaded HTML template.
     *
     * @see Doesn't allow to use cache.
     *
     * @param  string $sName      - template name.
     * @param  array  $aVariables - key/value pairs. Key should be the same as template's key, excluding prefix and postfix.
     * @return string the result of operation.
     * @see $this->_aTemplates
     */
    function parseHtmlByTemplateName($sName, $aVariables, $mixedKeyWrapperHtml = null)
    {
        if(!isset($this->_aTemplates[$sName]) || empty($this->_aTemplates[$sName]))
            return "";

        return $this->_parseContent($this->_aTemplates[$sName], $aVariables, $mixedKeyWrapperHtml);
    }
    /**
     * Parse page HTML template. Search for the page's template with accordance to it's file name.
     *
     * @see allows to use cache.
     *
     * @param  string $sName      - HTML file name.
     * @param  array  $aVariables - key/value pairs. key should be the same as template's key, but without prefix and postfix.
     * @return string the result of operation.
     */
    function parsePageByName($sName, $aVariables)
    {
        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginPage($sName);

        $sContent = $this->parseHtmlByName($sName, $aVariables, $this->_sKeyWrapperHtml, BX_DOL_TEMPLATE_CHECK_IN_BOTH);
        if(empty($sContent)) {
            $aType = BxDolPageQuery::getPageType($this->getPageType());
            if(!empty($aType) && is_array($aType))
                $sContent = $this->parseHtmlByName($aType['template'], $aVariables, $this->_sKeyWrapperHtml, BX_DOL_TEMPLATE_CHECK_IN_BOTH);
        }
        if(empty($sContent))
            $sContent = $this->parseHtmlByName('default.html', $aVariables, $this->_sKeyWrapperHtml, BX_DOL_TEMPLATE_CHECK_IN_BOTH);

        //---Process injection at the very last ---//
        $oTemplate = &$this;
        $sContent = preg_replace_callback("'<bx_injection:([^\s]+) />'s", function($aMatches) use($oTemplate) {
            return $oTemplate->processInjection($oTemplate->getPageNameIndex(), $aMatches[1]);
        }, $sContent);

        //--- Add CSS and JS at the very last ---//
        if(strpos($sContent, '<bx_include_css_styles />') !== false) {
            $aStyles = array(
                'display' => 'none !important'
            );

            if(isLogged())
                $this->addCssStyle('.bx-hide-when-logged-in', $aStyles);
            else
                $this->addCssStyle('.bx-hide-when-logged-out', $aStyles);

            $sContent = str_replace('<bx_include_css_styles />', $this->includeCssStyles(), $sContent);
        }

        if(strpos($sContent , '<bx_include_css_system />') !== false) {
            $sContent = str_replace('<bx_include_css_system />', $this->includeFiles('css', true), $sContent);
        }

        if(strpos($sContent , '<bx_include_css />') !== false) {
            if (!empty($this->aPage['css_name']))
                $this->addCss($this->aPage['css_name']);
            $sContent = str_replace('<bx_include_css />', $this->includeFiles('css'), $sContent);
        }
        
        if(strpos($sContent , '<bx_include_js_system />') !== false) {
            $sContent = str_replace('<bx_include_js_system />', $this->includeFiles('js', true), $sContent);
        }

        if(strpos($sContent , '<bx_include_js />') !== false) {
            if (!empty($this->aPage['js_name']))
                $this->addJs($this->aPage['js_name']);
            $sContent = str_replace('<bx_include_js />', $this->includeFiles('js') . $this->includeCssAsync(), $sContent);
        }

        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endPage($sContent);

        return $sContent;
    }
    /**
     * Parse system keys.
     *
     * @param  string $sKey key
     * @return string value associated with the key.
     */
    function parseSystemKey($sKey, $mixedKeyWrapperHtml = null, $bProcessInjection = true)
    {
        $aKeyWrappers = $this->_getKeyWrappers($mixedKeyWrapperHtml);

        $sRet = '';
        switch( $sKey ) {
            case 'page_charset':
                $sRet = 'UTF-8';
                break;
            case 'page_robots':
                if(!empty($this->aPage['robots']) && is_string($this->aPage['robots']))
                    $sRet = '<meta name="robots" content="' . bx_html_attribute($this->aPage['robots']) . '" />';
                break;
            case 'meta_info':
                $sRet = $this->getMetaInfo();
                break;
            case 'page_header':
                if (isset($this->aPage['title']) && !empty($this->aPage['title']))
                    $sRet = bx_process_output(strip_tags($this->aPage['title']));
                if(empty($sRet) && isset($this->aPage['header']))
                    $sRet = bx_process_output(strip_tags($this->aPage['header']));
                break;
            case 'page_header_text':
                if(isset($this->aPage['header_text']))
                    $sRet = bx_process_output($this->aPage['header_text']);
                break;
            case 'page_width':
                if (false === strpos($this->_oTemplateConfig->aLessConfig['bx-page-width'], 'px'))
                    $sRet = BX_DOL_PAGE_WIDTH;
                else
                    $sRet = $this->_oTemplateConfig->aLessConfig['bx-page-width'];
                break;
            case 'page_viewport':
                $sRet = getParam('sys_viewport_meta_tag');
                break;
            case 'system_injection_head':
                $sRet = $this->_oTemplateFunctions->getInjectionHead();
                break;
            case 'system_injection_header':
                $sRet = $this->_oTemplateFunctions->getInjectionHeader();
                break;
            case 'system_injection_footer':
                $sRet = $this->_oTemplateFunctions->getInjectionFooter();
                break;
            case 'lang':
                $sRet = bx_lang_code();
                break;
            case 'lang_direction':
                $sRet = bx_lang_direction();
                break;
            case 'lang_country':
                $sRet = bx_lang_country();
                break;
            case 'lang_with_country':
                $sRet = bx_lang_code_with_country();
                break;
            case 'main_logo':
                $sRet = BxTemplFunctions::getInstance()->getMainLogo();
                break;
            case 'informer':
                $oInformer = BxDolInformer::getInstance($this);
                $sRet = $oInformer ? $oInformer->display() : '';
                break;
            case 'cover':
            	$oCover = BxDolCover::getInstance($this);

            	$bCover = $oCover->isEnabled();
            	if($bCover && ($oPage = BxDolPage::getObjectInstanceByURI()) !== false) {
                    $bCover = $oPage->isPageCover();
                    if($bCover && !$oCover->isCover()) {
                        $aCover = $oPage->getPageCoverImage();
                        if(!empty($aCover))
                            $oCover->setCoverImageUrl($aCover);
                    }
            	}

                $sRet = $bCover ? $oCover->display() : $oCover->displayEmpty();
                break;
            case 'site_submenu_class':
                $oMenu = BxDolMenu::getObjectInstance('sys_site_submenu');
                if($oMenu)
                    $sRet = $oMenu->getClass();
                break;
            case 'site_submenu_hidden':
                $sClass = 'bx-menu-main-bar-hidden';

                $oPage = BxDolPage::getObjectInstanceByURI();
                if($oPage !== false && !$oPage->isVisiblePageSubmenu()) {
                    $sRet = $sClass;
                    break;
                }

                $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
                $oMenuManage = BxDolMenu::getObjectInstance('sys_site_manage');
                if($oMenuSubmenu !== false && !$oMenuSubmenu->isVisible() && $oMenuManage !== false && !$oMenuManage->isVisible()) {
                    $sRet = $sClass;
                    break;
                }

                break;
            case 'dol_images':
                $sRet = $this->_processJsImages();
                break;
            case 'dol_lang':
                $sRet = $this->_processJsTranslations();
                break;
            case 'dol_options':
                $sRet = $this->_processJsOptions();
                break;
            case 'copyright':
                $sRet = _t( '_copyright', date('Y') ) . getVersionComment();
                break;
            case 'copyright_attr':
                $sRet = bx_html_attribute(_t('_copyright', date('Y')));
                break;
            case 'extra_js':
                $sRet = empty($this->aPage['extra_js']) ? '' : $this->aPage['extra_js'];
                break;
            case 'is_profile_page':
                $sRet = (defined('BX_PROFILE_PAGE')) ? 'true' : 'false';
                break;
            case 'system_js_requred':
                $sRet = _t('_sys_javascript_requred');
                break;
            case 'included_css':
                $sRet = json_encode($this->getIncludedUrls('css_compiled'));
                break;
            case 'included_js':
                $sRet = json_encode($this->getIncludedUrls('js_compiled'));
                break;
            case 'base':
                $sRet = bx_convert_array2attrs($this->aPage['base']);
                break;
            case 'class_name':
                $sRet = $this->getCssClassName();
    
                if (preg_match('/^[A-Za-z0-9_\-]+$/', bx_get('i')))
                    $sRet .= ' bx-page-' . bx_get('i');

                if(!empty($this->_iMix)) {
                    $aMix = BxDolDb::getInstance()->getParamsMix($this->_iMix);
                    if(isset($aMix['dark']) && (int)$aMix['dark'] == 1)
                        $sRet .= ' dark';
                }

                $sRet .= ' bx-dir-' . strtolower(bx_lang_direction());
                break;
            case 'css_media_phone':
            case 'css_media_phone2':
            case 'css_media_tablet':
            case 'css_media_tablet2':
            case 'css_media_desktop':
                $aData = json_decode(getParam('sys_css_media_classes'), true);
                $sKey = str_replace('css_media_', '', $sKey);
                $sRet = $aData[$sKey];
                break;
            case 'service_worker':
                if(getParam('sys_pwa_sw_enable') != 'on')
                    break;
                $sRet = "if(navigator && navigator.serviceWorker) navigator.serviceWorker.register('sw.js.php');";
                break;
            case 'socket_engine':
                $sRet = BxDolSockets::getInstance()->getJsCode();
                break;

            case 'info':
                $sRet = 'L:' . bx_get_logged_profile_id();
                if(($oPage = BxDolPage::getObjectInstanceByURI()) !== false && method_exists($oPage, 'getContentInfo')) {
                    $aContentInfo = $oPage->getContentInfo();
                    if(isset($aContentInfo['id']))
                        $sRet .= '-C:' . (int)$aContentInfo['id'];
                    if(isset($aContentInfo['profile_id']))
                        $sRet .= '-P:' . (int)$aContentInfo['profile_id'];
                }
                break;

            default:
                $sRet = ($sTemplAdd = BxTemplFunctions::getInstance()->TemplPageAddComponent($sKey)) !== false ? $sTemplAdd : $aKeyWrappers['left'] . $sKey . $aKeyWrappers['right'];
        }

        if($bProcessInjection)
            $sRet = $this->processInjection($this->getPageNameIndex(), $sKey, $sRet);

        return $sRet;
    }

    /**
     * Parse tag <A>
     * 
     * @param string $sLink link URL
     * @param string $sContent link content
     * @param array $aAttrs an array of key => value pairs
     */
    function parseLink($sLink, $sContent, $aAttrs = array())
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return '<a href="' . $sLink . '"' . $sAttrs . '>' . $sContent . '</a>';
    }

    /**
     * Parse tag <A> using provided HTML template
     * 
     * @param string $sName template's file name
     * @param string $sLink link URL
     * @param string $sContent link content
     * @param array $aAttrs an array of key => value pairs
     */
    function parseLinkByName($sName, $sLink, $sContent, $aAttrs = array())
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return $this->parseHtmlByName($sName, array(
            'href' => $sLink,
            'attrs' => $sAttrs,
            'content' => $sContent
        ));
    }

    /**
     * Parse tag <BUTTON>
     * 
     * @param string $sContent link content
     * @param array $aAttrs an array of key => value pairs
     */
    function parseButton($sContent, $aAttrs = array())
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return '<button' . $sAttrs . '>' . $sContent . '</button>';
    }

    /**
     * Parse tag <IMG>
     * 
     * @param string $sLink URL to image source 
     * @param array $aAttrs an array of key => value pairs
     */
    function parseImage($sLink, $aAttrs = [])
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return '<img src="' . $sLink . '"' . $sAttrs . ' />';
    }
    
    function parseImageInline($sName, $aAttrs = [])
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return '<img src="' . $this->_getInlineData('image', $sName, BX_DOL_TEMPLATE_CHECK_IN_BOTH, true) . '"' . $sAttrs . ' />';
    }

    /**
     * Parse font based icon in <I> tag
     * 
     * @param string $sName font icon name
     * @param array $aAttrs an array of key => value pairs
     */
    function parseIcon($sName, $aAttrs = [])
    {
        $aIcons = BxTemplFunctions::getInstance()->getIcon($sName, $aAttrs);
        if($aIcons[0] != '')
            $aIcons[0] = '';

        return implode($aIcons);
    }
    
    function parseIconInline($sName, $aAttrs = [])
    {
        $sAttrs = '';
        foreach($aAttrs as $sKey => $sValue)
            $sAttrs .= ' ' . $sKey . '="' . bx_html_attribute($sValue) . '"';

        return '<img src="' . $this->_getInlineData('icon', $sName, BX_DOL_TEMPLATE_CHECK_IN_BOTH, true) . '"' . $sAttrs . ' />';
    }

    function parseTag($sName, $sContent, $aAttrs = [], $aParseParams = [])
    {
        if(!is_array($aAttrs))
            $aAttrs = [];

        $aTags = ['span', 'a', 'button', 'sbutton', 'custom', 'nl', 'extended'];

        $sTmplVarsClass = ''; 
        $aTmplVarsAttrs = [];
        foreach($aAttrs as $sKey => $sValue) {
            if($sKey == 'class')
                $sTmplVarsClass = $aAttrs[$sKey];
            else
                $aTmplVarsAttrs[] = ['key' => $sKey, 'value' => bx_html_attribute($sValue)];
        }

        $aTemplateVars = $aParseParams['template_vars'] ?? [];

        $aTmplVars = [];
        foreach($aTags as $sTag) {
            $aTmplVarsTag = [];
            $bTmplVarsTag = $sTag == $sName;
            if($bTmplVarsTag)
                $aTmplVarsTag = array_merge([
                    'class' => $sTmplVarsClass,
                    'content' => $sContent,
                    'bx_repeat:attrs' => $aTmplVarsAttrs
                ], $aTemplateVars);

            $aTmplVars['bx_if:' . $sTag] = [
            	'condition' => $bTmplVarsTag,
                'content' => $aTmplVarsTag
            ];
        }

        $sTemplate = $aParseParams['template_name'] ?? '_tags.html';
        return $this->parseHtmlByName($sTemplate, $aTmplVars);
    }

    function getCacheFilePrefix($sType)
    {
    	$sResult = '';
    	switch($sType) {
            case 'template':
                $sResult = $this->_sCacheFilePrefix;
                break;

            case 'less':
                $sResult = $this->_sCssLessPrefix;
                break;

            case 'css':
                $sResult = $this->_sCssCachePrefix;
                break;

            case 'js':
                $sResult = $this->_sJsCachePrefix;
                break;
    	}

    	return $sResult;
    }
    /**
     * Get cache object for templates
     * @return cache class instance
     */
    function getTemplatesCacheObject ()
    {
        $sCacheEngine = getParam('sys_template_cache_engine');
        $oCacheEngine = bx_instance('BxDolCache' . $sCacheEngine);
        if(!$oCacheEngine->isAvailable())
            $oCacheEngine = bx_instance('BxDolCacheFileHtml');
        return $oCacheEngine;
    }
    /**
     * Get template from cache if it's enabled.
     *
     * @param  string  $sName               template name
     * @param  string  $aVariables          key/value pairs. key should be the same as template's key, but without prefix and postfix.
     * @param  mixed   $mixedKeyWrapperHtml - key wrapper(string value if left and right parts are the same, array(0 => left, 1 => right) otherwise).
     * @param  string  $sCheckIn            where the content would be searched(base, template, both)
     * @param  boolean $bEvaluate           need to evaluate the template or not.
     * @return string  result of operation or false on failure.
     */
    function getCached($sName, &$aVariables, $mixedKeyWrapperHtml = null, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH, $bEvaluate = true)
    {
        // initialization

        if(!$this->_bCacheEnable)
            return false;

        if (in_array($sName, $this->_aCacheExceptions))
           return false;
        
        $sAbsolutePath = $this->_getAbsoluteLocation('path', $this->_sFolderHtml, $sName, $sCheckIn);
        if(empty($sAbsolutePath))
            return false;

        $oCacheEngine = $this->getTemplatesCacheObject ();
        $isFileBasedEngine = $bEvaluate && method_exists($oCacheEngine, 'getDataFilePath');

        // try to get cached content

        $sCacheVariableName = "a";
        $sCacheKey = $this->_getCacheFileName('html', $sAbsolutePath) . '.php';
        if ($isFileBasedEngine)
            $sCacheContent = $oCacheEngine->getDataFilePath($sCacheKey);
        else
            $sCacheContent = $oCacheEngine->getData($sCacheKey);


        // recreate cache if it is empty

        if ($sCacheContent === null && ($sContent = file_get_contents($sAbsolutePath)) !== false && ($sContent = $this->_compileContent($sContent, "\$" . $sCacheVariableName, 1, $aVariables, $mixedKeyWrapperHtml)) !== false) {
            if (false === $oCacheEngine->setData($sCacheKey, trim($sContent)))
                return false;

            if ($isFileBasedEngine)
                $sCacheContent = $oCacheEngine->getDataFilePath($sCacheKey);
            else
                $sCacheContent = $sContent;
        }

        if ($sCacheContent === null)
            return false;

        // return simple cache content

        if(!$bEvaluate)
            return $sCacheContent;

        // return evaluated cache content

        ob_start();

        $$sCacheVariableName = &$aVariables;

        if ($isFileBasedEngine)
            include($sCacheContent);
        else
            eval('?'.'>' . $sCacheContent);

        $sContent = ob_get_clean();

        return $sContent;
    }

    public function clearTemplatesCache($sType = '')
    {
        if(!$sType)
            $sType = 'template';

        $this->getTemplatesCacheObject()->removeAllByPrefix($this->getCacheFilePrefix($sType));
    }

    public function clearImagesCache($sCode = '')
    {
        if(!$sCode)
            $sCode = $this->_sCode;

        BxDolDb::getInstance()->getDbCacheObject()->removeAllByPrefix('sys_layout_images_' . $sCode .  '_');
    }

    /**
     * Add JS file(s) to global output.
     *
     * @param  mixed          $mixedFiles string value represents a single JS file name. An array - array of JS file names.
     * @param  boolean        $bDynamic   in the dynamic mode JS file(s) are not included to global output, but are returned from the function directly.
     * @return boolean/string result of operation.
     */
    function addJs($mixedFiles, $bDynamic = false)
    {
        return $this->_processFiles('js', 'add', $mixedFiles, $bDynamic);
    }

    function addJsPreloaded($aFiles, $sCallback = false, $sCondition = false, $sConditionElseCallback = false)
    {
        if(!$aFiles)
            return '';

        if(!is_array($aFiles))
            $aFiles = [$aFiles];

        $sMaskLoad = "bx_get_scripts(%s);";
        $sMaskLoadWithCallback = "bx_get_scripts(%s, function() {%s});";

        $sMaskCondition = "if(%s) {%s}";
        $sMaskConditionWithElse = "if(%s) {%s} else {setTimeout(function() {%s}, 10);}";

        $aFilesLocated = [];
        foreach($aFiles as $sFile) {
            $mixedFile = $this->_locateFile('js', $sFile);
            if($mixedFile === false)
                continue;

            list($sUrl) = $mixedFile;

            $aFilesLocated[] = $this->addRevision($sUrl);
        }
        $sFilesLocated = json_encode($aFilesLocated);

        if($sCallback !== false)
            $sResult = sprintf($sMaskLoadWithCallback, $sFilesLocated, $sCallback);
        else
            $sResult = sprintf($sMaskLoad, $sFilesLocated);

        if($sCondition === false)
            return $sResult;

        if($sConditionElseCallback !== false)
            $sResult = sprintf($sMaskConditionWithElse, $sCondition, $sResult, $sConditionElseCallback);
        else
            $sResult = sprintf($sMaskCondition, $sCondition, $sResult);

        return $sResult;
    }

    function addJsPreloadedWrapped($aFiles, $sCallback = false, $sCondition = false, $sConditionElseCallback = false)
    {
        $sCode = $this->addJsPreloaded($aFiles, $sCallback, $sCondition, $sConditionElseCallback);
        if(!$sCode)
            return '';

        return $this->_wrapInTagJsCode($sCode);
    }

    function addJsCodeOnLoad($sCallback)
    {
        $sMaskLoad = "$(document).ready(function() {%s});";

        return sprintf($sMaskLoad, $sCallback);
    }
    
    function addJsCodeOnLoadWrapped($sCallback)
    {
        $sCode = $this->addJsCodeOnLoad($sCallback);

        return $this->_wrapInTagJsCode($sCode); 
    }
    
    /**
     * get added js files
     */ 
    function getJs()
    {
        return $this->aPage['js_compiled'];
    }

    /**
     * Add System JS file(s) to global output.
     * System JS files are the files which are attached to all pages. They will be cached separately from the others.
     *
     * @param  mixed          $mixedFiles string value represents a single JS file name. An array - array of JS file names.
     * @param  boolean        $bDynamic   in the dynamic mode JS file(s) are not included to global output, but are returned from the function directly.
     * @return boolean/string result of operation.
     */
    function addJsSystem($mixedFiles)
    {
        return $this->_processFiles('js', 'add', $mixedFiles, false, true);
    }

    /**
     * Delete JS file(s) from global output.
     *
     * @param  mixed   $mixedFiles string value represents a single JS file name. An array - array of JS file names.
     * @return boolean result of operation.
     */
    function deleteJs($mixedFiles)
    {
        return $this->_processFiles('js', 'delete', $mixedFiles);
    }

    /**
     * Delete System JS file(s) from global output.
     *
     * @param  mixed   $mixedFiles string value represents a single JS file name. An array - array of JS file names.
     * @return boolean result of operation.
     */
    function deleteJsSystem($mixedFiles)
    {
        return $this->_processFiles('js', 'delete', $mixedFiles, false, true);
    }

    /**
     * Compile JS files in one file.
     *
     * @param  string $sAbsolutePath CSS file absolute path(full URL for external CSS/JS files).
     * @param  array  $aIncluded     an array of already included JS files.
     * @return string result of operation.
     */
    function _compileJs($sAbsolutePath, &$aIncluded)
    {
        if(isset($aIncluded[$sAbsolutePath]))
           return '';

        $bExternal = strpos($sAbsolutePath, "http://") !== false || strpos($sAbsolutePath, "https://") !== false;
        if($bExternal) {
            $sPath = $sAbsolutePath;
            $sName = '';

            $sContent = bx_file_get_contents($sAbsolutePath);
        } else {
            $aFileInfo = pathinfo($sAbsolutePath);
            $sPath = $aFileInfo['dirname'] . DIRECTORY_SEPARATOR;
            $sName = $aFileInfo['basename'];

            $sContent = file_get_contents($sPath . $sName);
        }

        if(empty($sContent))
            return '';

        $sUrl = bx_ltrim_str($sPath, realpath(BX_DIRECTORY_PATH_ROOT), BX_DOL_URL_ROOT);
        $sUrl = str_replace(DIRECTORY_SEPARATOR, '/', $sUrl);

        $sContent = "\r\n/*--- BEGIN: " . $sUrl . $sName . "---*/\r\n" . $sContent . ";\r\n/*--- END: " . $sUrl . $sName . "---*/\r\n";
        $sContent = preg_replace("/\/\/# sourceMappingURL\s*=.*/si", "", $sContent);
        $sContent = str_replace(["\n\r", "\r\n", "\r"], "\n", $sContent);

        $aIncluded[$sAbsolutePath] = 1;

        return preg_replace(
            array(
                "'<bx_url_root />'",
                "'\r\n'"
            ),
            array(
                BX_DOL_URL_ROOT,
                "\n"
            ),
            $sContent
        );
    }

	/**
     * Minify JS
     *
     * @param  string $s JS string to minify
     * @return string minified JS string.
     */
	function _minifyJs($s)
    {
        // since each JS file is minified separately, it has to be in own scope
    	return "\n {\n" . BxDolMinify::getInstance()->minifyJs($s) . "\n }\n";
    }

    /**
     * Wrap an URL to JS file into JS tag.
     *
     * @param  string $sFile - URL to JS file.
     * @return string the result of operation.
     */
    function _wrapInTagJs($sFile)
    {
        if (false !== strpos($sFile, '.mjs.js'))
            return "<script type=\"module\" src=\"" . $sFile . "\"></script>";
        return "<script language=\"javascript\" src=\"" . $sFile . "\"></script>";
    }

    /**
     * Wrap JS code into JS tag.
     *
     * @param  string $sCode - JS code.
     * @return string the result of operation.
     */
    function _wrapInTagJsCode($sCode)
    {
        return "<script language=\"javascript\">\n" . $sCode . "\n</script>";
    }

    /**
     * Add CSS file(s) to global output.
     *
     * @param  mixed          $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     * @param  boolean        $bDynamic   in the dynamic mode CSS file(s) are not included to global output, but are returned from the function directly.
     * @return boolean/string result of operation
     */
    function addCss($mixedFiles, $bDynamic = false)
    {
        if($bDynamic)
            return $this->addCssPreloadedWrapped($mixedFiles);
        else
            return $this->_processFiles('css', 'add', $mixedFiles, $bDynamic);
    }

    function addCssPreloaded($aFiles)
    {
        if(!$aFiles)
            return '';

        if(!is_array($aFiles))
            $aFiles = [$aFiles];

        $sMaskLoad = "bx_get_style(%s);";

        $aFilesLocated = [];
        foreach($aFiles as $sFile) {
            $mixedFile = $this->_locateFile('css', $sFile);
            if($mixedFile === false)
                continue;

            list($sUrl) = $mixedFile;

            $aFilesLocated[] = $this->addRevision($sUrl);
        }
        $sFilesLocated = json_encode($aFilesLocated);

        return sprintf($sMaskLoad, $sFilesLocated);
    }

    function addCssPreloadedWrapped($aFiles)
    {
        $sCode = $this->addCssPreloaded($aFiles);
        if(!$sCode)
            return '';

        return $this->_wrapInTagJsCode($sCode);
    }

    /**
     * get added css files
     */ 
    function getCss()
    {
        return $this->aPage['css_compiled'];
    }

    /**
     * Add additional heavy css file (not very necessary) to load asynchronously for desktop browsers only
     * @param  mixed          $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     */
    function addCssAsync($mixedFiles)
    {
        if (!is_array($mixedFiles))
            $mixedFiles = array($mixedFiles);

        foreach ($mixedFiles as $sFile)
            $this->aPage['css_async'][] = $this->_getAbsoluteLocationCss('url', $sFile);

        $this->addJs('loadCSS.js');
    }

    /**
     * Return script tag with special code to load async css.
     * This tag is added after js files list
     */
    function includeCssAsync ()
    {
        if (empty($this->aPage['css_async']))
            return '';

        $this->aPage['css_async'] = array_unique($this->aPage['css_async']);

        $sList = '';
        foreach ($this->aPage['css_async'] as $sUrl)
            $sList .= 'loadCSS("' . $sUrl . '", document.getElementById("bx_css_async"));';

        // don't load css for mobile devices
        return '
            <script id="bx_css_async">
                if(!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
                    ' . $sList . '
                }
            </script>
        ';
    }

    /**
     * Add System CSS file(s) to global output.
     * System CSS files are the files which are attached to all pages. They will be cached separately from the others.
     *
     * @param  mixed          $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     * @return boolean/string result of operation
     */
    function addCssSystem($mixedFiles)
    {
        return $this->_processFiles('css', 'add', $mixedFiles, false, true);
    }

    /**
     * Delete CSS file(s) from global output.
     *
     * @param  mixed   $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     * @return boolean result of operation.
     */
    function deleteCss($mixedFiles)
    {
        return $this->_processFiles('css', 'delete', $mixedFiles);
    }
    /**
     * Delete System CSS file(s) from global output.
     *
     * @param  mixed   $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     * @return boolean result of operation.
     */
    function deleteCssSystem($mixedFiles)
    {
        return $this->_processFiles('css', 'delete', $mixedFiles, false, true);
    }
    /**
     * Compile CSS files' structure(@see \@import css_file_path) in one file.
     *
     * @param  string $sAbsolutePath CSS file absolute path(full URL for external CSS/JS files).
     * @param  array  $aIncluded     an array of already included CSS files.
     * @return string result of operation.
     */
    function _compileCss($sAbsolutePath, &$aIncluded)
    {
        if(isset($aIncluded[$sAbsolutePath]))
           return '';

        $bExternal = strpos($sAbsolutePath, "http://") !== false || strpos($sAbsolutePath, "https://") !== false;
        if($bExternal) {
        	$sPath = $sAbsolutePath;
            $sName = '';

        	$aAPUrl = parse_url($sAbsolutePath);
        	if(!empty($aAPUrl['path'])) {
        		$aAPPath = pathinfo($aAPUrl['path']);
        		if(!empty($aAPPath['basename'])) {
        			$sPath = bx_rtrim_str($sAbsolutePath, $aAPPath['basename']);
        			$sName = $aAPPath['basename'];
        		}
        	}

            $sContent = bx_file_get_contents($sAbsolutePath);
        } else {
            $aFileInfo = pathinfo($sAbsolutePath);
            $sPath = $aFileInfo['dirname'] . DIRECTORY_SEPARATOR;
            $sName = $aFileInfo['basename'];

            $sContent = file_get_contents($sPath . $sName);
        }

        if(empty($sContent))
            return '';

        $sUrl = bx_ltrim_str($sPath, realpath(BX_DIRECTORY_PATH_ROOT), BX_DOL_URL_ROOT);
        $sUrl = str_replace(DIRECTORY_SEPARATOR, '/', $sUrl);

        $sContent = "\r\n/*--- BEGIN: " . $sUrl . $sName . "---*/\r\n" . $sContent . "\r\n/*--- END: " . $sUrl . $sName . "---*/\r\n";
        $aIncluded[$sAbsolutePath] = 1;

        $sContent = str_replace(array("\n\r", "\r\n", "\r"), "\n", $sContent);
        if($bExternal) {
            $sContent = preg_replace(
                array(
                    "'@import\s+url\s*\(\s*[\'|\"]*\s*([a-zA-Z0-9\.\/_-]+)\s*[\'|\"]*\s*\)\s*;'",
                    "'url\s*\(\s*[\'|\"]*\s*([a-zA-Z0-9\.\/\?\#_=-]+)\s*[\'|\"]*\s*\)'"
                ),
                array(
                    "",
                    "url(" . $sPath . "\\1)"
                ),
                $sContent
            );
        }
        else {
        	try {
        		$oTemplate = &$this;

        		/* Match URL based imports like the following:
        		 * @import 'http://[domain]/modules/[vendor]/[module]/template/css/view.css';
        		 * Is mainly needed for CSS files which are gotten from LESS compiler.
        		 */
        		$sContent = preg_replace_callback(
	                "'@import\s+[\'|\"]*\s*" . str_replace("/", "\/", BX_DOL_URL_ROOT) . "([a-zA-Z0-9\.\/_-]+)\s*[\'|\"]*\s*;'", function ($aMatches)  use($oTemplate, $sPath, &$aIncluded) {
	                	return $oTemplate->_compileCss(realpath(BX_DIRECTORY_PATH_ROOT . $aMatches[1]), $aIncluded);
	                }, $sContent);

				/* Match relative path based imports like the following:
				 * @import url(../../../../../../base/profile/template/css/main.css);
				 * Is mainly needed for default CSS files.
				 */
	            $sContent = preg_replace_callback(
	                "'@import\s+url\s*\(\s*[\'|\"]*\s*([a-zA-Z0-9\.\/_-]+)\s*[\'|\"]*\s*\)\s*;'", function ($aMatches)  use($oTemplate, $sPath, &$aIncluded) {
	                	return $oTemplate->_compileCss(realpath($sPath . dirname($aMatches[1])) . DIRECTORY_SEPARATOR . basename($aMatches[1]), $aIncluded);
	                }, $sContent);

	            $sContent = preg_replace_callback(
	                "'url\s*\(\s*[\'|\"]*\s*([a-zA-Z0-9\.\/\?\#_=-]+)\s*[\'|\"]*\s*\)'", function ($aMatches)  use($oTemplate, $sPath) {
						$sFile = basename($aMatches[1]);
				        $sDirectory = dirname($aMatches[1]);

				        $sRootPath = realpath(BX_DIRECTORY_PATH_ROOT) . '/';
				        $sAbsolutePath = realpath(addslashes($sPath) . $sDirectory) . DIRECTORY_SEPARATOR . $sFile;

				        $sRootPath = str_replace(DIRECTORY_SEPARATOR, '/', $sRootPath);
				        $sAbsolutePath = str_replace(DIRECTORY_SEPARATOR, '/', $sAbsolutePath);

				        return 'url(' . bx_ltrim_str($sAbsolutePath, $sRootPath, BX_DOL_URL_ROOT) . ')';
	                }, $sContent);
			}
	    	catch(Exception $oException) {
	        	return '';
	        }
        }

        return $sContent;
    }

    /**
     * Less CSS
     *
     * @param  mixed $mixed CSS string to process with Less compiler or an array with CSS file's Path and URL.
     * @return mixed string or an array with CSS file's Path and URL.
     */
    function _lessCss($mixed)
    {
        if(is_array($mixed) && isset($mixed['url']) && isset($mixed['path'])) {
            $sPathFile = realpath($mixed['path']);
            $aInfoFile = pathinfo($sPathFile);
            if (!isset($aInfoFile['extension']) || $aInfoFile['extension'] != 'less')
                return $mixed;

        	$aFiles = array($mixed['path'] => $mixed['url']);
        	$aOptions = array('cache_dir' => $this->_sCachePublicFolderPath, 'prefix' => $this->_sCssLessPrefix);
        	$sFile = Less_Cache::Get($aFiles, $aOptions, $this->_oTemplateConfig->aLessConfig);

            return array('url' => $this->_sCachePublicFolderUrl . $sFile, 'path' => $this->_sCachePublicFolderPath . $sFile);
        }

        $oLess = new Less_Parser();
        $oLess->ModifyVars($this->_oTemplateConfig->aLessConfig);
        $oLess->parse($mixed);
        return $oLess->getCss();
    }

    /**
     * Minify CSS
     *
     * @param  string $s CSS string to minify
     * @return string minified CSS string.
     */
    function _minifyCss($s)
    {
    	return BxDolMinify::getInstance()->minifyCss($s);
    }

    /**
     * Wrap an URL to CSS file into CSS tag.
     *
     * @param  string $sFile - URL to CSS file.
     * @return string the result of operation.
     */
    function _wrapInTagCss($sFile)
    {
        if (!$sFile)
            return '';
        return "<link href=\"" . $sFile . "\" rel=\"stylesheet\" type=\"text/css\" />";
    }
    /**
     * Wrap CSS code into CSS tag.
     *
     * @param  string $sCode - CSS code.
     * @return string the result of operation.
     */
    function _wrapInTagCssCode($sCode)
    {
        return "<style>" . $sCode . "</style>";
    }
	/**
     *  Include CSS style(s) in the page's head section.
     */
	function includeCssStyles()
	{
		$sResult = "";
		if(empty($this->aPage['css_styles']) || !is_array($this->aPage['css_styles']))
			return $sResult;

		foreach($this->aPage['css_styles'] as $sName => $aContent) {
			$sContent = "";
			if(!empty($aContent) && is_array($aContent))
				foreach($aContent as $sStyleName => $sStyleValue)
					$sContent .= "\t" . $sStyleName . ": " . $sStyleValue . ";\r\n";

			$sResult .= $sName . " {\r\n" . $sContent . "}\r\n";
		}

		return !empty($sResult) ? $this->_wrapInTagCssCode($sResult) : '';
	}
    /**
     * Include CSS/JS file(s) attached to the page in its head section.
     * @see the method is system and would be called automatically.
     *
     * @param  string $sType the type of file('js' or 'css')
     * @return string the result CSS code.
     */
    function includeFiles($sType, $bSystem = false, $bWrap = true)
    {
        $sUpcaseType = ucfirst($sType);

        $sArrayKey = $sType . ($bSystem ? '_system' : '_compiled');
        $aFiles = isset($this->aPage[$sArrayKey]) ? $this->aPage[$sArrayKey] : array();
        if(empty($aFiles) || !is_array($aFiles))
            return "";

        if(!$this->{'_b' . $sUpcaseType . 'Cache'})
            return $this->_includeFiles($sType, $aFiles, $bWrap);

        //--- If cache already exists, return it ---//
        $sMethodWrap = '_wrapInTag' . $sUpcaseType;
        $sMethodCompile = '_compile' . $sUpcaseType;
        $sMethodLess = '_less' . $sUpcaseType;
        $sMethodMinify = '_minify' . $sUpcaseType;

        ksort($aFiles);

        $sName = "";
        foreach($aFiles as $aFile)
            $sName .= $aFile['url'];
        $sName = $this->_getCacheFileName($sType, $sName);

        $sCacheAbsoluteUrl = $this->_sCachePublicFolderUrl . $sName . '.' . $sType;
        $sCacheAbsolutePath = $this->_sCachePublicFolderPath . $sName . '.' . $sType;
        if(file_exists($sCacheAbsolutePath)) {
            if($this->{'_b' . $sUpcaseType . 'Archive'})
                $sCacheAbsoluteUrl = $this->_getLoaderUrl($sType, $sName);

           return $bWrap ? $this->$sMethodWrap($sCacheAbsoluteUrl) : $sCacheAbsoluteUrl;
        }

        //--- Collect all attached CSS/JS in one file ---//

        $sResult = "";
        $iLine = 0;
        $aIncluded = array();
        $aSections = array();
        foreach($aFiles as $aFile) {
            if($this->{'_b' . $sUpcaseType . 'Less'})
                $aFile = $this->$sMethodLess($aFile);

            if(($sContent = $this->$sMethodCompile($aFile['path'], $aIncluded)) === false)
                continue;                

            $bMinify = !preg_match('/[\.-]min.(js|css)$/i', $aFile['path']) && $this->{'_b' . $sUpcaseType . 'Minify'}; // don't minify minified files
            if($bMinify)
                $sContent = $this->$sMethodMinify($sContent);

            $iLines = substr_count($sContent, "\n");
            if($sType == 'js' && $sContent !== '')
                $aSections[] = array(
                    'file' => $aFile,
                    'line' => $iLine,
                    'lines' => $iLines,
                    'exact' => !$bMinify && strncmp($sContent, "\n/*--- BEGIN:", 13) === 0,
                );

            $sResult .= $sContent;
            $iLine += $iLines;
        }

        //--- The JS bundle gets a source map next to it (see _getSourceMapJs), served through the same loader ---//
        if($sType == 'js' && !empty($sResult) && ($sMap = $this->_getSourceMapJs($sName, $aSections)) !== '') {
            $sMapAbsolutePath = $this->_sCachePublicFolderPath . $sName . '.js.map';
            if(($rHandler = fopen($sMapAbsolutePath, 'w')) !== false) {
                fwrite($rHandler, $sMap);
                fclose($rHandler);
                @chmod($sMapAbsolutePath, BX_DOL_FILE_RIGHTS);

                $sResult .= "\n//# sourceMappingURL=" . $this->_getLoaderUrl('js.map', $sName) . "\n";
            }
        }

        $mixedWriteResult = false;
        if(!empty($sResult) && ($rHandler = fopen($sCacheAbsolutePath, 'w')) !== false) {
            $mixedWriteResult = fwrite($rHandler, $sResult);
            fclose($rHandler);
            @chmod ($sCacheAbsolutePath, BX_DOL_FILE_RIGHTS);
        }

        if($mixedWriteResult === false)
            return $this->_includeFiles($sType, $aFiles, $bWrap);

        if($this->{'_b' . $sUpcaseType . 'Archive'})
            $sCacheAbsoluteUrl = $this->_getLoaderUrl($sType, $sName);

        return $bWrap ? $this->$sMethodWrap($sCacheAbsoluteUrl) : $sCacheAbsoluteUrl;
    }
    /**
     * Include CSS/JS files without caching.
     *
     * @param  string $sType  the file type (css or js)
     * @param  array  $aFiles CSS/JS files to be added to the page.
     * @return string result of operation.
     */
    function _includeFiles($sType, &$aFiles, $bWrap = true)
    {
        $sUpcaseType = ucfirst($sType);

        $sMethodWrap = '_wrapInTag' . $sUpcaseType;
        $sMethodLess = '_less' . $sUpcaseType;

        $mixedResult = $bWrap ? "" : [];
        foreach($aFiles as $aFile) {
            if($this->{'_b' . $sUpcaseType . 'Less'})
                $aFile = $this->$sMethodLess($aFile);

            $sFileUrl = $aFile['url'];
            if(!$this->{'_b' . $sUpcaseType . 'Cache'})
                $sFileUrl = $this->addRevision($sFileUrl);

            if($bWrap)
                $mixedResult .= $this->$sMethodWrap($sFileUrl);
            else
                $mixedResult[] = $sFileUrl;
        }

        return $mixedResult;
    }
    /**
     * Insert/Delete CSS file from output stack.
     *
     * @param  string  $sType      the file type (css or js)
     * @param  string  $sAction    add/delete
     * @param  mixed   $mixedFiles string value represents a single CSS file name. An array - array of CSS file names.
     * @return boolean result of operation.
     */
    function _processFiles($sType, $sAction, $mixedFiles, $bDynamic = false, $bSystem = false)
    {
        if(empty($mixedFiles))
            return $bDynamic ? "" : false;

        if(is_string($mixedFiles))
            $mixedFiles = array($mixedFiles);

        $sUpcaseType = ucfirst($sType);
        $sMethodLocate = '_getAbsoluteLocation' . $sUpcaseType;
        $sMethodWrap = '_wrapInTag' . $sUpcaseType;
        $sResult = '';
        foreach($mixedFiles as $sFile) {
            $mixedFile = $this->_locateFile($sType, $sFile);
            if($mixedFile === false)
                continue;

            list($sUrl, $sPath) = $mixedFile;

            $sArrayKey = $sType . ($bSystem ? '_system' : '_compiled');
            switch($sAction) {
                case 'add':
                    /**
                     * @hooks
                     * @hookdef hook-system-add_files 'system', 'add_files' - hook on add file to page 
                     * - $unit_name - equals `system`
                     * - $action - equals `add_files` 
                     * - $object_id - not used 
                     * - $sender_id - not used 
                     * - $extra_params - array of additional params with the following array keys:
                     *      - `file` - [string] file name
                     *      - `type` - [string] file type
                     *      - `dynamic` - [bool] true if added as dynamic
                     *      - `system` - [bool] true if system file
                     *      - `url` - [string] by ref, file url, can be overridden in hook processing
                     *      - `path` - [string] by ref, file path, can be overridden in hook processing
                     * @hook @ref hook-system-add_files
                     */
                    bx_alert('system', 'add_files', 0, 0, [
                        'file' => $sFile,
                        'type' => $sType,
                        'dynamic' => $bDynamic,
                        'system' => $bSystem,
                        'url' => &$sUrl,
                        'path' => &$sPath,
                        'url_ref' => &$sUrl,
                        'path_ref' => &$sPath,
                    ]);

                    if($bDynamic)
                        $sResult .= $this->$sMethodWrap($this->addRevision($sUrl));
                    else {
                        $bFound = false;
                        $aSearchIn = $bSystem ? $this->aPage[$sArrayKey] : array_merge($this->aPage[$sType . '_system'], $this->aPage[$sArrayKey]);
                        foreach($aSearchIn as $iKey => $aValue)
                            if($aValue['url'] == $sUrl && $aValue['path'] == $sPath) {
                                $bFound = true;
                                break;
                            }

                        if(!$bFound)
                            $this->aPage[$sArrayKey][] = array('url' => $sUrl, 'path' => $sPath);
                    }
                    break;
                case 'delete':
                    if(!$bDynamic)
                        foreach($this->aPage[$sArrayKey]  as $iKey => $aValue)
                            if($aValue['url'] == $sUrl) {
                                unset($this->aPage[$sArrayKey][$iKey]);
                                break;
                            }
                    break;
            }
        }

        return $bDynamic ? $sResult : true;
    }

    function _locateFile($sType, $sFile)
    {
        //--- Process 3d Party CSS/JS file ---//
        if(strpos($sFile, "http://") !== false || strpos($sFile, "https://") !== false) {
            $sUrl = $sFile;
            $sPath = $sFile;
        }
        //--- Process Custom CSS/JS file ---//
        else if(strpos($sFile, "|") !== false) {
            $sFile = implode('', explode("|", $sFile));
            $sFile = bx_ltrim_str($sFile, BX_DIRECTORY_PATH_ROOT);

            $sUrl = BX_DOL_URL_ROOT . $sFile;
            $sPath = realpath(BX_DIRECTORY_PATH_ROOT . $sFile);
        }
        //--- Process Common CSS/JS file(check in default locations) ---//
        else {
            $sMethodLocate = '_getAbsoluteLocation' . ucfirst($sType);

            $sUrl = $this->$sMethodLocate('url', $sFile);
            $sPath = $this->$sMethodLocate('path', $sFile);
        }

        return !empty($sUrl) && !empty($sPath) ? [$sUrl, $sPath] : false;
    }

    /**
     * Parse content.
     *
     * @param  string $sContent            - HTML file's content.
     * @param  array  $aVariables          - key/value pairs. key should be the same as template's key, but without prefix and postfix.
     * @param  mixed  $mixedKeyWrapperHtml - key wrapper(string value if left and right parts are the same, array(0 => left, 1 => right) otherwise).
     * @return string the result of operation.
     */
    function _parseContent($sContent, $aVariables, $mixedKeyWrapperHtml = null)
    {
        $aKeysSrc = array_keys($aVariables);
        $aValuesSrc = array_values($aVariables);

        $aKeyWrappers = $this->_getKeyWrappers($mixedKeyWrapperHtml);

        $sKeyIf = 'bx_if:';
        $sKeyRepeat = 'bx_repeat:';
        $iCountKeys = count($aKeysSrc);
        $aKeys = $aValues = array();

        //--- Parse simple keys ---//
        for ($i = 0; $i < $iCountKeys; $i++) {
            if (strncmp($aKeysSrc[$i], $sKeyRepeat, 10) === 0 || strncmp($aKeysSrc[$i], $sKeyIf, 6) === 0)
                continue;

            $aKeys[] = "'" . $aKeyWrappers['left'] . $aKeysSrc[$i] . $aKeyWrappers['right'] . "'s";
            if (is_string($aValuesSrc[$i]) || is_null($aValuesSrc[$i]))
                $aValues[] = is_null($aValuesSrc[$i]) ? '' : str_replace('$', '\\$', str_replace('\\', '\\\\', $aValuesSrc[$i]));
            else if(is_array($aValuesSrc[$i]))
                $aValues[] = _t('_error occured');
            else
                $aValues[] = $aValuesSrc[$i];
        }

        //--- Parse keys with constructions ---//
        for ($i = 0; $i < $iCountKeys; $i++) {
            if (strncmp($aKeysSrc[$i], $sKeyRepeat, 10) === 0) {
                $sKey = "'<" . $aKeysSrc[$i] . ">(.*)<\/" . $aKeysSrc[$i] . ">'s";

                $aMatches = array();
                preg_match($sKey, $sContent, $aMatches);

                $sValue = '';
                if(isset($aMatches[1]) && !empty($aMatches[1])) {
                    if(is_array($aValuesSrc[$i]))
                        foreach($aValuesSrc[$i] as $aValue)
                            if(is_array($aValue))
                                $sValue .= $this->parseHtmlByContent($aMatches[1], $aValue, $mixedKeyWrapperHtml);
                            else if(is_string($aValue))
                                $sValue .= $aValue;
                    else if(is_string($aValuesSrc[$i]))
                        $sValue = $aValuesSrc[$i];
                }
            } 
            else if (strncmp($aKeysSrc[$i], $sKeyIf, 6) === 0) {
                $sKey = "'<" . $aKeysSrc[$i] . ">(.*)<\/" . $aKeysSrc[$i] . ">'s";

                $aMatches = array();
                preg_match($sKey, $sContent, $aMatches);

                $sValue = '';
                if(isset($aMatches[1]) && !empty($aMatches[1]))
                    if(is_array($aValuesSrc[$i]) && isset($aValuesSrc[$i]['content']) && isset($aValuesSrc[$i]['condition']) && $aValuesSrc[$i]['condition'])
                        $sValue .= $this->parseHtmlByContent($aMatches[1], $aValuesSrc[$i]['content'], $mixedKeyWrapperHtml);
            } 
            else 
                continue;

            $aKeys[] = $sKey;
            $aValues[] = str_replace('$', '\\$', str_replace('\\', '\\\\', $sValue));
        }

        try {
            $oTemplate = &$this;

            foreach($this->_aTemplatePatterns as $sPattern => $sCheckIn)
                $sContent = preg_replace_callback($sPattern, function($aMatches) use($oTemplate, $aVariables, $mixedKeyWrapperHtml, $sCheckIn) {
                    return $oTemplate->parseHtmlByName($aMatches[1], $aVariables, $mixedKeyWrapperHtml, $sCheckIn);
                }, $sContent);

            $sContent = $this->_parseContentKeys($sContent, array(
                "'<bx_menu:([^\s]+) \/>'s" => 'get_menu',
            ));
        }
        catch(Exception $oException) {
            bx_log('sys_template', "Error in _parseContent method. Cannot parse template insertion (<bx_include... />).\n" . 
                "  Error ({$oException->getCode()}): {$oException->getMessage()}\n" . 
                (getLoggedId() ? "  Account ID: " . getLoggedId() . "\n" : ""),
                BX_LOG_ERR
            );

            return '';
        }

        $aKeys = array_merge($aKeys, array(
            "'<bx_url_root />'",
            "'<bx_url_studio />'",
        ));
        $aValues = array_merge($aValues, array(
            BX_DOL_URL_ROOT,
            BX_DOL_URL_STUDIO,
        ));

        //--- Parse Predefined Keys ---//
        $sContent = preg_replace($aKeys, $aValues, $sContent);

        //--- Parse System Keys ---//
        try {
            $sContent = preg_replace_callback("'" . $aKeyWrappers['left'] . "([a-zA-Z0-9_-]+)" . $aKeyWrappers['right'] . "'", function($aMatches) use($oTemplate, $mixedKeyWrapperHtml) {
                return $oTemplate->parseSystemKey($aMatches[1], $mixedKeyWrapperHtml);
            }, $sContent);
        }
        catch(Exception $oException) {
            bx_log('sys_template', "Error in _parseContent method. Cannot parse System Keys.\n" . 
                "  Error ({$oException->getCode()}): {$oException->getMessage()}\n" . 
                (getLoggedId() ? "  Account ID: " . getLoggedId() . "\n" : ""),
                BX_LOG_ERR
            );

            return '';
        }

        return $sContent;
    }

    /**
     * Compile content
     *
     * @param  string  $sContent            template.
     * @param  string  $aVarName            variable name to be saved in the output file.
     * @param  integer $iVarDepth           depth is used to process nesting, for example, in cycles.
     * @param  array   $aVarValues          values to be compiled in.
     * @param  mixed   $mixedKeyWrapperHtml key wrapper(string value if left and right parts are the same, array(0 => left, 1 => right) otherwise).
     * @return string  the result of operation.
     */
    function _compileContent($sContent, $aVarName, $iVarDepth, $aVarValues, $mixedKeyWrapperHtml = null)
    {
        $aKeys = array_keys($aVarValues);
        $aValues = array_values($aVarValues);

        $aKeyWrappers = $this->_getKeyWrappers($mixedKeyWrapperHtml);

        for($i = 0; $i < count($aKeys); $i++) {
            $sVarNameKey = $aVarName . "['" . $aKeys[$i] . "']";

            if(strpos($aKeys[$i], 'bx_repeat:') === 0) {
                $sKey = "'<" . $aKeys[$i] . ">(.*)<\/" . $aKeys[$i] . ">'s";

                $aMatches = array();
                preg_match($sKey, $sContent, $aMatches);

                $sValue = '';
                if(isset($aMatches[1]) && !empty($aMatches[1])) {
                    if(empty($aValues[$i]) || !is_array($aValues[$i]))
                        return false;

                    $sIndex = "\$" . str_repeat("i", $iVarDepth);
                    $sValue .= "<?php if(is_array(" . $sVarNameKey . ")) for(" . $sIndex . "=0; " . $sIndex . "<count(" . $sVarNameKey . "); " . $sIndex . "++){ ?>";
                    if(($sInnerValue = $this->_compileContent($aMatches[1], $sVarNameKey . "[" . $sIndex . "]", $iVarDepth + 1, current($aValues[$i]), $mixedKeyWrapperHtml)) === false)
                        return false;

                    $sValue .= $sInnerValue;
                    $sValue .= "<?php } else if(is_string(" . $sVarNameKey . ")) echo " . $sVarNameKey . "; ?>";
                }
            } 
            else if(strpos($aKeys[$i], 'bx_if:') === 0) {
                $sKey = "'<" . $aKeys[$i] . ">(.*)<\/" . $aKeys[$i] . ">'s";

                $aMatches = array();
                preg_match($sKey, $sContent, $aMatches);

                $sValue = '';
                if(isset($aMatches[1]) && !empty($aMatches[1])) {
                    if(!is_array($aValues[$i]) || empty($aValues[$i]['content']) || !is_array($aValues[$i]['content']))
                        return false;

                    $sValue .= "<?php if(isset(" . $sVarNameKey .") && " . $sVarNameKey . "['condition']){ ?>";
                    if(($sInnerValue = $this->_compileContent($aMatches[1], $sVarNameKey . "['content']", $iVarDepth, $aValues[$i]['content'], $mixedKeyWrapperHtml)) === false)
                        return false;

                    $sValue .= $sInnerValue;
                    $sValue .= "<?php } ?>";
                }
            } 
            else {
                $sKey = "'" . $aKeyWrappers['left'] . $aKeys[$i] . $aKeyWrappers['right'] . "'s";
                $sValue = "<?php echo(isset(" . $sVarNameKey . ") ? " . $sVarNameKey . " : '');?>";
            }

            $aKeys[$i] = $sKey;
            $aValues[$i] = $sValue;
        }

        try {
            $oTemplate = &$this;

            foreach($this->_aTemplatePatterns as $sPattern => $sCheckIn)
                $sContent = preg_replace_callback($sPattern, function($aMatches) use($oTemplate, $aVarValues, $mixedKeyWrapperHtml, $sCheckIn) {
                    $mixedResult = $oTemplate->getCached($aMatches[1], $aVarValues, $mixedKeyWrapperHtml, $sCheckIn, false);
                    if($mixedResult === false)
                        throw new Exception("Unable to create cache file ({$aMatches[1]}).", 1);

                    return $mixedResult;
                }, $sContent);

            $sContent = $this->_parseContentKeys($sContent);
        }
        catch(Exception $oException) {
            if(($iCode = $oException->getCode()) != 1)
                bx_log('sys_template', "Error in _compileContent method. Cannot parse template insertion (<bx_include... />).\n" . 
                    "  Error ({$iCode}): {$oException->getMessage()}\n" . 
                    (getLoggedId() ? "  Account ID: " . getLoggedId() . "\n" : ""),
                    BX_LOG_ERR
                );

            return false;
        }

        $aKeys = array_merge($aKeys, [
            "'<bx_menu:([^\s]+) \/>'s",
            "'<bx_url_root />'",
            "'<bx_url_studio />'"
        ]);
        $aValues = array_merge($aValues, [
            "<?php echo \$this->getMenu('\\1'); ?>",
            BX_DOL_URL_ROOT,
            BX_DOL_URL_STUDIO
        ]);

        //--- Parse Predefined Keys ---//
        $sContent = preg_replace($aKeys, $aValues, $sContent);

        //--- Parse System Keys ---//
        $sContent = preg_replace( "'" . $aKeyWrappers['left'] . "([a-zA-Z0-9_-]+)" . $aKeyWrappers['right'] . "'", "<?php echo \$this->parseSystemKey('\\1', \$mixedKeyWrapperHtml);?>", $sContent);

        return $sContent;
    }
    protected function _parseContentKeys($sContent, $aCallbackPatterns = array())
    {
    	$oTemplate = &$this;

    	$aCallbackPatterns = array_merge($aCallbackPatterns, array(
            "'<bx_image_auto:([^\s]+) \/>'s" => "get_image_auto",
            "'<bx_image_url:([^\s]+) \/>'s" => "get_image_url",
            "'<bx_icon_url:([^\s]+) \/>'s" => "get_icon_url",
            "'<bx_icon_inline:([^\s]+) \/>'s" => "get_icon_inline",
            "'<bx_text:([_\{\}\w\d\s]+[^\s]{1}) \/>'s" => "get_text",
            "'<bx_text_js:([^\s]+) \/>'s" => "get_text_js",
            "'<bx_text_attribute:([^\s]+) \/>'s" => "get_text_attribute",
            "'<bx_page:([^\s]+) \/>'s" => "get_page",
        ));

        foreach($aCallbackPatterns as $sPattern => $sAction)
            $sContent = preg_replace_callback($sPattern, function($aMatches) use($oTemplate, $sAction) {
            $sResult = '';

            switch($sAction) {
                case 'get_image_auto':
                    $sResult = $oTemplate->getImageAuto($aMatches[1]);
                    break;
                case 'get_image_url':
                    $sResult = $oTemplate->getImageUrl($aMatches[1]);
                    break;
                case 'get_icon_url':
                    $sResult = $oTemplate->getIconUrl($aMatches[1]);
                    break;
                case 'get_icon_inline':
                    if(($sResult = $this->getIconContent($aMatches[1])) === false)
                        $sResult = '';
                    break;
                case 'get_text':
                    $sResult = _t($aMatches[1]);
                    break;
                case 'get_text_js':
                    $sResult = bx_js_string(_t($aMatches[1]));
                    break;
                case 'get_text_attribute':
                    $sResult = bx_html_attribute(_t($aMatches[1]));
                    break;
                case 'get_injection':
                    $sResult = $oTemplate->processInjection($oTemplate->getPageNameIndex(), $aMatches[1]);
                    break;
                case 'get_menu':
                    $sResult = $oTemplate->getMenu($aMatches[1]);
                    break;
                case 'get_page':
                    $oPage = BxDolPage::getObjectInstanceByURI($aMatches[1], false, true);
                    $oPage->setSubPage(true);
                    $sResult = $oPage ? $oPage->getCode() : '';
                    break;
            }

            return $sResult;
        }, $sContent);

        return $sContent;
    }

    /**
     * Get absolute location of some template's part.
     *
     * @param  string $sType    - result type. Available values 'url' and 'path'.
     * @param  string $sFolder  - folders to be searched in. @see $_sFolderHtml, $_sFolderCss, $_sFolderImages and $_sFolderIcons
     * @param  string $sName    - requested part name.
     * @param  string $sCheckIn where the content would be searched(base, template, both)
     * @return string absolute location (path/url) of the part.
     */
    function _getAbsoluteLocation($sType, $sFolder, $sName, $sCheckIn = BX_DOL_TEMPLATE_CHECK_IN_BOTH)
    {
        $sDirectory = $this->getPath();

        if($sType == 'path') {
            $sDivider = DIRECTORY_SEPARATOR;
            $sRoot = BX_DIRECTORY_PATH_ROOT;
        } else if($sType == 'url') {
            $sDivider = '/';
            $sRoot = BX_DOL_URL_ROOT;
        }

        $aParts = [];
        if(strpos($sName,'|') !== false) {
            $aParts = explode('|', $sName);
            $sName = $aParts[1];

            if(strpos($aParts[0],'@') !== false) {
                $aLocationParts = explode('@', $aParts[0]);
                $sLocationKey = $this->addLocation($aLocationParts[0], BX_DIRECTORY_PATH_ROOT . $aLocationParts[1], BX_DOL_URL_ROOT . $aLocationParts[1]);
            }
        }

        /** 
         * Module(mod) related locations will be checked first in TMPL and BASE,
         * then system(sys) location(s) will be checked in TMPL and BASE.
         */
        $aLocationsList = array_reverse($this->_aLocations, true);
        $aLocationsGrouped = ['mod' => [], 'sys' => []];
        foreach($aLocationsList as $sLocation => $aLocation) {
            if(in_array($sLocation, ['system', 'studio']))
                $aLocationsGrouped['sys'][$sLocation] = $aLocation;
            else
                $aLocationsGrouped['mod'][$sLocation] = $aLocation;
        }

        $sResult = '';
        foreach($aLocationsGrouped as $aLocations) {
            //--- Check it Template.
            $bInSub = false;
            $aCheckIn = [BX_DOL_TEMPLATE_CHECK_IN_BOTH, BX_DOL_TEMPLATE_CHECK_IN_TMPL];
            if(in_array($sCheckIn, $aCheckIn) || $bInSub = (isset($sCheckIn['in'], $sCheckIn['sub']) && in_array($sCheckIn['in'], $aCheckIn)))
                foreach($aLocations as $sKey => $aLocation)
                    if((!$bInSub || $sCheckIn['sub'] == $sKey) && extFileExists(BX_DIRECTORY_PATH_MODULES . $this->getPath(). 'data' . DIRECTORY_SEPARATOR . BX_DOL_TEMPLATE_FOLDER_ROOT . DIRECTORY_SEPARATOR . $sKey . DIRECTORY_SEPARATOR . $sFolder . $sName)) {
                        $sResult = $sRoot . 'modules' . $sDivider . $sDirectory. 'data' . $sDivider . BX_DOL_TEMPLATE_FOLDER_ROOT . $sDivider . $sKey . $sDivider . $sFolder . $sName;
                        break 2;
                    }

            //--- Check it Base.
            $bInSub = false;
            $aCheckIn = [BX_DOL_TEMPLATE_CHECK_IN_BOTH, BX_DOL_TEMPLATE_CHECK_IN_BASE];
            if(empty($sResult) && (in_array($sCheckIn, $aCheckIn) || $bInSub = (isset($sCheckIn['in'], $sCheckIn['sub']) && in_array($sCheckIn['in'], $aCheckIn))))
                foreach($aLocations as $sKey => $aLocation)
                    if((!$bInSub || $sCheckIn['sub'] == $sKey) && extFileExists($aLocation['path'] . BX_DOL_TEMPLATE_FOLDER_ROOT . DIRECTORY_SEPARATOR . $sFolder . $sName)) {
                        $sResult = $aLocation[$sType] . BX_DOL_TEMPLATE_FOLDER_ROOT . $sDivider . $sFolder . $sName;
                        break 2;
                    }
        }

        /**
         * try to find from received path
         */
        if(!$sResult && isset($aParts[0], $aParts[1]) && @is_file(BX_DIRECTORY_PATH_ROOT . $aParts[0] . DIRECTORY_SEPARATOR . $aParts[1]))
            $sResult = $sRoot . $aParts[0] . $sDivider . $aParts[1];

        if(isset($sLocationKey))
           $this->removeLocation($sLocationKey);

        return $sType == 'path' && !empty($sResult) ? realpath($sResult) : $sResult;
    }
    /**
     * Get absolute location of some template's part.
     *
     * @param  string $sType result type. Available values 'url' and 'path'.
     * @param  string $sName requested part name.
     * @return string absolute location (path/url) of the part.
     */
    function _getAbsoluteLocationJs($sType, $sName)
    {
        $sResult = '';
        $aLocations = array_reverse($this->_aLocationsJs, true);
        foreach($aLocations as $sKey => $aLocation) {
            if(extFileExists($aLocation['path'] . $sName))
                $sResult = $aLocation[$sType] . $sName;
            else
                continue;
            break;
        }
        return $sType == 'path' && !empty($sResult) ? realpath($sResult) : $sResult;
    }
    function _getAbsoluteLocationCss($sType, $sName)
    {
    	$sNameLess = str_replace('.css', '.less', $sName);

    	$sResult = $this->_getAbsoluteLocation($sType, $this->_sFolderCss, $sNameLess);
    	if(!empty($sResult))
    		return $sResult;

        return $this->_getAbsoluteLocation($sType, $this->_sFolderCss, $sName);
    }
    /**
     * Get inline data for Images and Icons.
     *
     * @param  string  $sType    image/icon
     * @param  string  $sName    file name
     * @param  string  $sCheckIn where the content would be searched(base, template, both)
     * @return unknown
     */
    function _getInlineData($sType, $sName, $sCheckIn, $bForceInline = false)
    {
        switch($sType) {
            case 'image':
                $sFolder = $this->_sFolderImages;
                break;
            case 'icon':
                $sFolder = $this->_sFolderIcons;
                break;
        }
        $sPath = $this->_getAbsoluteLocation('path', $sFolder, $sName, $sCheckIn);

        $iFileSize = 0;
        if(($this->_bImagesInline && ($iFileSize = filesize($sPath)) !== false && $iFileSize < $this->_iImagesMaxSize) || $bForceInline) {
            $aFileInfo = pathinfo($sPath);
            return $this->getImageMimeType($aFileInfo['extension']) . ";base64," . base64_encode(file_get_contents($sPath));
        }

        return false;
    }

    /**
     * Source map for a compiled JS bundle, at file level: every line of the bundle points at the file it came from.
     * A file that went into the bundle as it is (already minified, or minification off) maps line by line; a file
     * minified here maps to its first line, because the PHP minifier emits no mappings. Sources are embedded, so
     * DevTools and Lighthouse need nothing but the map.
     *
     * @param  string $sName     bundle name without extension.
     * @param  array  $aSections one entry per bundled file: 'file' (url, path), 'line' (first line in the bundle), 'lines', 'exact'.
     * @return string JSON source map, or an empty string when there is nothing to map.
     */
    protected function _getSourceMapJs($sName, $aSections)
    {
        $aSources = $aContents = $aLines = array();
        foreach($aSections as $aSection) {
            $sPath = $aSection['file']['path'];
            $bExternal = strpos($sPath, 'http://') !== false || strpos($sPath, 'https://') !== false;
            $sContent = $bExternal ? bx_file_get_contents($sPath) : @file_get_contents($sPath);

            $iSource = count($aSources);
            $aSources[] = $aSection['file']['url'];
            $aContents[] = is_string($sContent) ? str_replace(array("\r\n", "\r"), "\n", $sContent) : '';

            for($i = 0; $i < $aSection['lines']; $i++) {
                if(!$aSection['exact'])
                    $aLines[$aSection['line'] + $i] = array($iSource, 0);
                else if($i >= 2 && $i < $aSection['lines'] - 1) // the BEGIN and END markers around the file are not in the source
                    $aLines[$aSection['line'] + $i] = array($iSource, $i - 2);
            }
        }

        if(empty($aLines))
            return '';

        $aMappings = array();
        $iPrevSource = $iPrevLine = 0;
        for($i = 0, $iLines = max(array_keys($aLines)) + 1; $i < $iLines; $i++) {
            if(!isset($aLines[$i])) {
                $aMappings[] = '';
                continue;
            }

            list($iSource, $iLine) = $aLines[$i];
            $aMappings[] = $this->_encodeVlq(0) . $this->_encodeVlq($iSource - $iPrevSource) . $this->_encodeVlq($iLine - $iPrevLine) . $this->_encodeVlq(0);
            $iPrevSource = $iSource;
            $iPrevLine = $iLine;
        }

        $sMap = json_encode(array(
            'version' => 3,
            'file' => $sName . '.js',
            'sources' => $aSources,
            'sourcesContent' => $aContents,
            'names' => array(),
            'mappings' => implode(';', $aMappings),
        ), JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);

        return is_string($sMap) ? $sMap : '';
    }

    /**
     * Base64 VLQ, the number encoding of source map mappings.
     */
    protected function _encodeVlq($iValue)
    {
        $sChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

        $iVlq = $iValue < 0 ? ((-$iValue) << 1) | 1 : $iValue << 1;
        $sResult = '';
        do {
            $iDigit = $iVlq & 31;
            $iVlq >>= 5;
            if($iVlq > 0)
                $iDigit |= 32;

            $sResult .= $sChars[$iDigit];
        } while($iVlq > 0);

        return $sResult;
    }

    /**
     * Get file name where the template would be cached.
     *
     * @param  string $sAbsolutePath template's real path.
     * @return string the result of operation.
     */
    function _getCacheFileName($sType, $sAbsolutePath)
    {
        $sResult = bx_site_hash($sAbsolutePath);
        switch($sType) {
            case 'html':
                $sResult = $this->_sCacheFilePrefix . bx_lang_name() . '_' . $this->_sCode .  '_' . $sResult;
                break;
            case 'css':
                $sResult = $this->_sCssCachePrefix . (!empty($this->_iMix) ? $this->_iMix . '_' : '') .  $sResult;
                break;
            case 'js':
                $sResult = $this->_sJsCachePrefix . $sResult;
                break;
        }

        return $sResult;
    }
    /**
     * Get template key wrappers(left, right)
     *
     * @param  mixed $mixedKeyWrapperHtml key wrapper(string value if left and right parts are the same, array(0 => left, 1 => right) otherwise).
     * @return array result of operation.
     */
    function _getKeyWrappers($mixedKeyWrapperHtml)
    {
        $aResult = array();
        if(!empty($mixedKeyWrapperHtml) && is_string($mixedKeyWrapperHtml))
            $aResult = array('left' => $mixedKeyWrapperHtml, 'right' => $mixedKeyWrapperHtml);
        else if(!empty($mixedKeyWrapperHtml) && is_array($mixedKeyWrapperHtml))
            $aResult = array('left' => $mixedKeyWrapperHtml[0], 'right' => $mixedKeyWrapperHtml[1]);
        else
            $aResult = array('left' => $this->_sKeyWrapperHtml, 'right' => $this->_sKeyWrapperHtml);
        return $aResult;
    }

    /**
     * Process all added language translations and return them as a string.
     *
     * @return string with JS code.
     */
    function _processJsTranslations()
    {
        $sReturn = '';
        if(isset($this->aPage['js_translations']) && is_array($this->aPage['js_translations'])) {
            foreach($this->aPage['js_translations'] as $sKey => $sString)
                $sReturn .= "'" .  bx_js_string($sKey) . "': '" . bx_js_string($sString) . "',";

            $sReturn = substr($sReturn, 0, -1);
        }

        return '
<script language="javascript">
    if (\'undefined\' === typeof(aDolLang)) 
        var aDolLang = {' . $sReturn . '};
    else
        $.extend(aDolLang, {' . $sReturn . '});
</script>';
    }
    /**
     * Process all added options and return them as a string.
     *
     * @return string with JS code.
     */
    function _processJsOptions()
    {
        $sReturn = '';
        if(isset($this->aPage['js_options']) && is_array($this->aPage['js_options'])) {
            foreach($this->aPage['js_options'] as $sName => $mixedValue)
                $sReturn .= "'" .  bx_js_string($sName) . "': '" . bx_js_string($mixedValue) . "',";

            $sReturn = substr($sReturn, 0, -1);
        }

        return '<script language="javascript">var aDolOptions = {' . $sReturn . '};</script>';
    }
    /**
     * Process all added images and return them as a string.
     *
     * @return string with JS code.
     */
    function _processJsImages()
    {
        $sReturn = '';
        if(isset($this->aPage['js_images']) && is_array($this->aPage['js_images'])) {
            foreach($this->aPage['js_images'] as $sKey => $sUrl)
                $sReturn .= "'" .  bx_js_string($sKey) . "': '" . bx_js_string($sUrl) . "',";

            $sReturn = substr($sReturn, 0, -1);
        }

        return '<script language="javascript">var aDolImages = {' . $sReturn . '};</script>';
    }

    /**
     * Get Gzip loader URL.
     *
     * @param $sType content type CSS/JS
     * @param $sName file name.
     * @return string with URL
     */
    function _getLoaderUrl($sType, $sName)
    {
        return BX_DOL_URL_ROOT . 'gzip_loader.php?file=' . $sName . '.' . $sType;
    }

    /**
     * Get current revision number.
     * 
     * @return integer number
     */
    public function getRevision()
    {
        return (int)getParam('sys_revision');
    }

    /**
     * Add current revision number to URL.
     * 
     * @return string with URL 
     */
    public function addRevision($sUrl)
    {
        return bx_append_url_params($sUrl, ['rev' => $this->getRevision()]);
    }

    /**
     *
     * Functions to display pages with errors, messages and so on.
     *
     */
    function displayAccessDenied ($sMsg = '', $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_PADDING_DEF)
    {
        bx_import('BxDolLanguages');
        header('HTTP/1.0 403 Forbidden');
        header('Status: 403 Forbidden');
        
        $a = [
            'title' => _t('_access_denied_page_title'),
            'content' => _t('_access_denied_page_content'),
        ];
        
        $this->displayMsg($sMsg ? $sMsg : _t('_Access denied'), false, $iPage, $iDesignBox);
    }

    function displayNoData ($sMsg = '', $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_PADDING_DEF)
    {
        bx_import('BxDolLanguages');
        header('HTTP/1.0 204 No Content');
        header('Status: 204 No Content');
        $this->displayMsg($sMsg ? $sMsg : _t('_Empty'), false, $iPage, $iDesignBox);
    }

    function displayErrorOccured ($sMsg = '', $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_PADDING_DEF)
    {
        bx_import('BxDolLanguages');
        header('HTTP/1.0 500 Internal Server Error');
        header('Status: 500 Internal Server Error');
        $this->displayMsg($sMsg ? $sMsg : _t('_error occured'), false, $iPage, $iDesignBox);
    }

    function displayPageNotFound ($sMsg = '', $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_PADDING_DEF)
    {
        bx_import('BxDolLanguages');
        header('HTTP/1.0 404 Not Found');
        header('Status: 404 Not Found');
        $this->displayMsg($sMsg ? $sMsg : _t('_sys_request_page_not_found_cpt'), false, $iPage, $iDesignBox);
    }

    function displayMsg ($s, $bTranslate = false, $iPage = BX_PAGE_DEFAULT, $iDesignBox = BX_DB_PADDING_DEF)
    {
        $sError = '_Error';
        $bArray = is_array($s);

        $sTitle = $bArray ? $s['title'] : ($bTranslate ? $sError : _t($sError));
        $sContent = $bArray ? $s['content'] : $s;

        if($bTranslate) {
            $sTitle = _t($sTitle);
            $sContent = _t($sContent);
        }
        
        if (bx_is_api())
            return [bx_api_get_msg($sContent)];

        $sContent = MsgBox($sContent);
        if($iPage == BX_PAGE_DEFAULT)
            $sContent = DesignBoxContent($sTitle, $sContent, $iDesignBox);

        $oTemplate = BxDolTemplate::getInstance();
        $oTemplate->setPageNameIndex ($iPage);
        $oTemplate->setPageHeader ($sTitle);
        $oTemplate->setPageContent ('page_main_code', $sContent);
        $oTemplate->getPageCode();
        exit;
    }
    
    /**
     * * * * Static methods for work with template injections * * *
     *
     * Static method is used to add/replace the content of some key in the template.
     * It's usefull when you don't want to modify existing template but need to add some data to existing template key.
     *
     * @param  integer $iPageIndex - page index where injections would processed. Use 0 if you want it to be done on all the pages.
     * @param  string  $sKey       - template key.
     * @param  string  $sValue     - the data to be added.
     * @return string  the result of operation.
     */
    function processInjection($iPageIndex, $sKey, $sValue = "")
    {
        if($iPageIndex != 0 && isset($this->aPage['injections']['page_0'][$sKey]) && isset($this->aPage['injections']['page_' . $iPageIndex][$sKey]))
           $aSelection = @array_merge($this->aPage['injections']['page_0'][$sKey], $this->aPage['injections']['page_' . $iPageIndex][$sKey]);
        else if(isset($this->aPage['injections']['page_0'][$sKey]))
           $aSelection = $this->aPage['injections']['page_0'][$sKey];
        else if(isset($this->aPage['injections']['page_' . $iPageIndex][$sKey]))
            $aSelection = $this->aPage['injections']['page_' . $iPageIndex][$sKey];
        else
            $aSelection = array();

        if(is_array($aSelection))
            foreach($aSelection as $aInjection) {

                if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginInjection($sRand = time().rand());

                $sInjData = '';
                switch($aInjection['type']) {
                    case 'text':
                        $sInjData = $aInjection['data'];
                        break;

                    case 'service':
                    	if(BxDolService::isSerializedService($aInjection['data']))
                    		$sInjData = BxDolService::callSerialized($aInjection['data']);                    	
                        break;
                }

                if((int)$aInjection['replace'] == 1)
                    $sValue = $sInjData;
                else
                    $sValue .= $sInjData;

                if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endInjection($sRand, $aInjection);

            }

        return $sValue != '__' . $sKey . '__' ? str_replace('__' . $sKey . '__', '', $sValue) : $sValue;
    }
    /**
     * Static method to add ingection available on the current page only.
     *
     * @param string  $sKey     - template's key.
     * @param string  $sType    - injection type(text, php).
     * @param string  $sData    - the data to be added.
     * @param integer $iReplace - replace already existed data or not.
     */
    function addInjection($sKey, $sType, $sData, $iReplace = 0)
    {
        $this->aPage['injections']['page_0'][$sKey][] = array(
            'page_index' => 0,
            'key' => $sKey,
            'type' => $sType,
            'data' => $sData,
            'replace' => $iReplace
        );
    }

    function getPageCode($oTemplate = null)
    {
        if (empty($oTemplate))
           $oTemplate = $this;

        /**
         * @hooks
         * @hookdef hook-system-design_before_output 'system', 'design_before_output' - hook on before page's html generated
         * - $unit_name - equals `system`
         * - $action - equals `design_before_output` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `page` - [array] by ref, page object paramenters, can be overridden in hook processing
         *      - `page_content` - [array] by ref, page content values, can be overridden in hook processing
         * @hook @ref hook-system-design_before_output
         */
        bx_alert('system', 'design_before_output', 0, 0, [
            'page' => &$this->aPage, 
            'page_content' => &$this->aPageContent,
            'page_ref' => &$this->aPage, 
            'page_content_ref' => &$this->aPageContent
        ]);

        header( 'Content-type: text/html; charset=utf-8' );
        $sXFrameOpts = getParam('sys_x_frame_options');
        if ('Off' !== $sXFrameOpts)
            header( 'X-Frame-Options: ' . $sXFrameOpts );
        if (BX_PAGE_EMBED == $oTemplate->getPageNameIndex())
            header('Content-Security-Policy: frame-ancestors ' . getParam('sys_csp_frame_ancestors'));

        $sResult = $oTemplate->parsePageByName('page_' . $oTemplate->getPageNameIndex() . '.html', $oTemplate->getPageContent());
        
        /**
         * @hooks
         * @hookdef hook-system-design_after_output 'system', 'design_after_output' - hook on after page's html generated
         * - $unit_name - equals `system`
         * - $action - equals `design_after_output` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [string] by ref, html content for current page, can be overridden in hook processing
         * @hook @ref hook-system-design_after_output
         */
        bx_alert('system', 'design_after_output', 0, false, ['override_result' => &$sResult]);
        
        echo $sResult;
    }
}

/** @} */
