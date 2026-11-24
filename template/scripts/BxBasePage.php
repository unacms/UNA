<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

require_once(BX_DIRECTORY_PATH_INC . 'design.inc.php');

/**
 * Page representation.
 * @see BxDolPage
 */
class BxBasePage extends BxDolPage
{
    protected $_oTemplate;

    protected $_sStorage; //--- Storage object for page's images like custom cover, HTML block attachments, etc.
    protected $_oPageCacheObject = null;
    protected $_oBlockCacheObject = null;
    
    protected $_sJsClassName = '';
    protected $_sJsObjectName = '';
    protected $_aHtmlIds = [];

    protected $_bStickyColumns = false;

    /** A block's title already stands as the page's heading (_setBlockTitleAsHeading). */
    protected $_bHeadingBlock = false;

    protected $_bSubPage = false;

    protected $_aMetaImages = []; //--- Size and twitter card of page meta images by url, @see _getMetaImage

    public function __construct ($aObject, $oTemplate)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sStorage = 'sys_images';
        
        $this->_sJsClassName = 'BxDolPage';
        $this->_sJsObjectName = 'oBxDolPage';
        
        $this->_bStickyColumns = isset($this->_aObject['sticky_columns']) && $this->_aObject['sticky_columns'] == 1;

        $sHtmlId = str_replace(array('_' , ' '), array('-', '-'), $this->_sObject);
        $this->_aHtmlIds = array(
            'help_popup' => $sHtmlId . '-help-popup-',
        );
        $this->addMarkers(array('site_title' => getParam('site_title')));
        if (isLogged() && $oProfile = BxDolProfile::getInstance()) {
            $this->addMarkers([
                'logged_profile_id' => $oProfile->id(),
                'logged_profile_cid' => $oProfile->getContentId(),
                'logged_account_id' => $oProfile->getAccountId(),
                'logged_profile_module' => $oProfile->getModule(),
                'logged_display_name' => $oProfile->getDisplayName(),
                'logged_profile_url' => $oProfile->getUrl(),
            ]);
        }
        if (isset($GLOBALS['bxReplaceableMarkersPages'])) {
            $this->addMarkers($GLOBALS['bxReplaceableMarkersPages']);
        }
    }

    public function performActionGetHelp ()
    {
        $iBlockId = (int)bx_get('block_id');
        if(empty($iBlockId))
            return;

        $aBlock = $this->_oQuery->getPageBlock($iBlockId);
        if(empty($aBlock) || !is_array($aBlock) || empty($aBlock['help']))
            return;

        echo $this->_oTemplate->parseHtmlByName('designbox_help_popup.html', array(
            'content' => _t($aBlock['help'])
        ));
    }
    
    public function performActionGetShare ()
    {
        $aEmbedData = BxDolPage::getEmbedData(bx_get('url'));
        if(!isset($aEmbedData['url'])) 
            return; 

        $sMenu = '';
        if(getParam('sys_a2a_enable') != 'on') {
            if(($oMenu = BxDolMenu::getObjectInstance('sys_social_sharing')) !== false) {
                $oMenu->addMarkers([
                    'url' => $aEmbedData['url'],
                    'img_url_encoded' => '',
                    'title_encoded' => ''
                ]);
                // in the popup each service is a row with its mark and name, as in other popup menus
                $oMenu->setTemplateById(6); // menu_vertical.html
                $sMenu = $oMenu->getCode();
            }
        }
        else
            $sMenu = getParam('sys_a2a_code');

        echo PopupBox('sys_share_popup', _t('_sys_txt_share_popup_header'), $this->_oTemplate->parseHtmlByName('designbox_share_popup.html', [
            'url' => bx_process_output($aEmbedData['url']),
            'menu' => $sMenu,
            'code' => htmlspecialchars($aEmbedData['html']),
        ]), true);
    }
    
    public function performActionEmbed ()
    {
        $aCover = $this->getPageCoverImage();
        $sTitle = $this->_getPageTitle();
        $this->_oTemplate->getEmbed($this->_oTemplate->parseHtmlByName('embed_card.html', [
            'title' => $sTitle,
            'url' => BxDolPermalinks::getInstance()->permalink($this->_aObject['url']),
            'bx_if:thumb' => [
                'condition' => $this->isPageCover() && count($aCover) > 0,
                'content' => [
                    'title' => $sTitle,
                    'url' => BxDolPermalinks::getInstance()->permalink($this->_aObject['url']),
                    'background' => BxDolCover::getInstance(BxDolTemplate::getInstance())->getCoverImageUrl($aCover)
                ],
            ],
            'bx_if:no_thumb' => [
                'condition' => count($aCover) == 0 || !$this->isPageCover(),
                'content' => [
                    'title' => $sTitle,
                    'url' => BxDolPermalinks::getInstance()->permalink($this->_aObject['url']),
                ]
            ]
        ]
        ));
    }

    public function performActionCreativeSave()
    {
        if(!$this->isAllowedCreativeManage())
            return echoJson(['code' => 1]);

        $iId = 0;
        $sContent = '';
        if(($iId = bx_get('b')) === false || ($sContent = bx_get('c')) === false)
            return echoJson(['code' => 2]);

        $iId = bx_process_input($iId, BX_DATA_INT);
        $sContent = bx_process_input($sContent, BX_DATA_HTML);
        if(!$this->_oQuery->setPageBlockContent($iId, $sContent))
            return echoJson(['code' => 3]);

        return echoJson(['code' => 0]);
    }

    public function isAllowedCreativeManage()
    {
        return isAdmin();
    }

    /**
     * Very similar to BxBasePage::getCode
     * but adds css and js files which are needed for the corect page display
     */ 
    public function getCodeDynamic ()
    {
        // TODO: remake to use use collect* template methods

        $oTemplate = BxDolTemplate::getInstance();

        // get js&css before the page code is generated
        $aCssBefore = $oTemplate->getCss();
        $aJsBefore = $oTemplate->getJs();

        // generate page code
        $sContent = $this->getCode();

        // get js&css after the page code is generated
        $aCssAfter = $oTemplate->getCss();
        $aJsAfter = $oTemplate->getJs();

        // compare files which were added before and after page code is generated
        $f = function ($a1, $a2) {
            return strcasecmp($a1['url'], $a2['url']);
        };
        $aCssNew = array_udiff($aCssAfter, $aCssBefore, $f);
        $aJsNew = array_udiff($aJsAfter, $aJsBefore, $f);

        // add newly added js&css files in static mode
        $sCss = $sJs = '';
        foreach ($aCssNew as $a)
            $sCss .= $oTemplate->addCss($a['url'], true);
        foreach ($aJsNew as $a)
            $sJs .= $oTemplate->addJs($a['url'], true);

        return $sJs . $sCss . $sContent;
    }

    public function getIncludes ()
    {
        $oTemplate = BxDolTemplate::getInstance();

        // generate page code
        $this->getCode();

        // get js&css after the page code is generated
        $aCss = $oTemplate->getCss();
        $aJs = $oTemplate->getJs();

        // add js&css files in static mode
        $sResult = '';
        foreach ($aCss as $a)
            $sResult .= $oTemplate->addCss($a['url'], true);
        foreach ($aJs as $a)
            $sResult .= $oTemplate->addJs($a['url'], true);
        
        // add js translations
        $sResult .= $oTemplate->getJsTranslation(true);

        return $sResult;
    }
    
    /**
     * Get page code with automatic caching, adding necessary css/js files and system template vars.
     * @return string.
     */
    public function getCode ()
    {
        if (bx_get('dynamic') && ($iBlockId = (int)bx_get('pageBlock'))) {

            if (self::isLockedFromUnauthenticated($this->_aObject['uri']) || self::isLockedFromNoProfile($this->_aObject['uri']) || !$this->_isVisiblePage($this->_aObject)) {
                header('HTTP/1.0 403 Forbidden');
                exit;
            }

            /**
             * @hooks
             * @hookdef hook-system-page_output_block 'system', 'page_output_block' - hook with page block data to be output
             * - $unit_name - equals `system`
             * - $action - equals `page_output_block`
             * - $object_id - not used
             * - $sender_id - not used
             * - $extra_params - array of additional params with the following array keys:
             *      - `page_name` - [string] page object name
             *      - `page_object` - [object] an instance of page class, @see BxDolPage 
             *      - `page_query` - [object] an instance of page related query class
             *      - `block_id` - [int] block id
             * @hook @ref hook-system-page_output_block
             */
            bx_alert('system', 'page_output_block', 0, false, [
                'page_name' => $this->_sObject,
                'page_object' => $this,
                'page_query' => $this->_oQuery,
                'block_id' => (int)$iBlockId,
            ]);

            header( 'Content-type:text/html;charset=utf-8' );

            BxDolTemplate::getInstance()->collectingStart();

            $s = $this->_getBlockOnlyCode($iBlockId);

            $sCss = bx_get('includedCss');
            $sJs = bx_get('includedJs');
            echo BxDolTemplate::getInstance()->collectingEndGetCode($sCss ? @json_decode($sCss) : [], $sJs ? @json_decode($sJs) : []);

            echo $s;
            exit;
        }

        if (($mixedAvailable = $this->_isAvailablePage($this->_aObject)) !== true) 
            return $this->_getPageNotFoundMsg($mixedAvailable);

        if (($mixedVisible = $this->_isVisiblePage($this->_aObject)) !== true) {
            BxDolTemplate::getInstance()->resetPageMeta();
            return $this->_getPageAccessDeniedMsg($mixedVisible);
        }

        $this->_addJsCss();

        if (!$this->_bSubPage) {
            $this->_addSysTemplateVars();

            $this->_selectMenu();

            $this->_setSubmenu(array());
        }

        if (bx_is_dbg() || !getParam('sys_page_cache_enable') || !$this->_aObject['cache_lifetime'] || (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST')) {
            $sPageCode = $this->_getPageCode();
        }
        else {
            $oCache = $this->_getPageCacheObject();
            $sKey = $this->_getPageCacheKey();
            $sKeyCssJs = 'cssjs_' . $sKey;

            $mixedRet = $oCache->getData($sKey, $this->_aObject['cache_lifetime']);
            $aRetCssJs = $oCache->getData($sKeyCssJs, $this->_aObject['cache_lifetime']);

            if ($mixedRet !== null && $aRetCssJs !== null) {
                BxDolTemplate::getInstance()->collectingStart();                
                BxDolTemplate::getInstance()->collectingInject($aRetCssJs['css'], $aRetCssJs['js']);
                $sPageCode = BxDolTemplate::getInstance()->collectingEndGetCode();
                $sPageCode .= $mixedRet;
            } else {

                BxDolTemplate::getInstance()->collectingStart();

                $sPageCode = $this->_getPageCode();

                $aPageCssJs = BxDolTemplate::getInstance()->collectingEndGetCode(array(), array(), 'array');

                $oCache->setData($sKey, $sPageCode, $this->_aObject['cache_lifetime']);
                $oCache->setData($sKeyCssJs, $aPageCssJs, $this->_aObject['cache_lifetime']);
            }
        }
        
        /**
         * @hooks
         * @hookdef hook-system-page_output 'system', 'page_output' - hook with page data to be output
         * - $unit_name - equals `system`
         * - $action - equals `page_output`
         * - $object_id - not used
         * - $sender_id - not used
         * - $extra_params - array of additional params with the following array keys:
         *      - `page_name` - [string] page object name
         *      - `page_object` - [object] an instance of page class, @see BxDolPage 
         *      - `page_query` - [object] an instance of page related query class
         *      - `page_code` - [string] by ref, final page code to be output, can be overridden in hook processing
         *      - `sub_page` - [boolean] if the page is used as subpage of some parent page
         * @hook @ref hook-system-page_output
         */
        bx_alert('system', 'page_output', 0, false, [
            'page_name' => $this->_sObject,
            'page_object' => $this,
            'page_query' => $this->_oQuery,
            'page_code' => &$sPageCode,
            'page_code_ref' => &$sPageCode,
            'sub_page' => $this->_bSubPage,
        ]);

        if (!$this->_bSubPage)
            $sPageCode .= $this->getJsScript();
        
        return $sPageCode;
    }
    
    public function getJsClassName()
    {
        return $this->_sJsClassName;
    }

    public function getJsObjectName()
    {
        return $this->_sJsObjectName;
    }
    
    function _wrapInTagJsCode($sCode)
    {
        return "<script language=\"javascript\">\n<!--\n" . $sCode . "\n-->\n</script>";
    }

    public function getJsScript()
    {
        $sJsObjName = $this->getJsObjectName();
        $sJsObjClass = $this->getJsClassName();
        $sCode = "if(window['" . $sJsObjName . "'] == undefined) var " . $sJsObjName . " = new " . $sJsObjClass . "(" . json_encode(array(
            'sObjName' => $sJsObjName,
            'sObject' => $this->_sObject,
            'sRootUrl' => BX_DOL_URL_ROOT,
            'aHtmlIds' => $this->_aHtmlIds,
            'isStickyColumns' => $this->_bStickyColumns
        )) . ");";

        return $this->_wrapInTagJsCode($sCode);
    }

    /**
     * Is page cover enabled.
     * @return string
     */
    /**
     * A page without a cover whose block is titled as the page (Sign in, Sign up, Forgot password) has one heading:
     * the block's title becomes the page's `<h1>`, in place of the hidden one the empty cover gives (BxBaseCover).
     * Not where a block of the page has an `<h1>` in its content (_setHeadingBlockByContent, called first): that
     * block is the heading, and the titled block keeps its `<h2>`.
     * @param array $aBlock the block
     * @param string $sCode the block's code in its design box
     * @return string the code
     */
    protected function _setBlockTitleAsHeading($aBlock, $sCode)
    {
        if($this->_bHeadingBlock || $this->isPageTitle())
            return $sCode;

        $sPageTitle = mb_strtolower(trim(strip_tags($this->_getPageTitle())));
        $sBlockTitle = mb_strtolower(trim(strip_tags($this->getBlockTitle($aBlock))));
        if($sPageTitle === '' || $sPageTitle !== $sBlockTitle)
            return $sCode;

        $sCode = preg_replace('#<h2 class="bx-dbt-ttl">(.*?)</h2>#s', '<h1 class="bx-dbt-ttl">$1</h1>', $sCode, 1, $iCount);
        if($iCount) {
            $this->_bHeadingBlock = true;
            BxDolCover::getInstance()->setPageHasHeading();
        }

        return $sCode;
    }

    public function isPageCover()
    {
        return self::isShownToViewer($this->_aObject['cover'], isLogged());
    }

    /**
     * Whether a part of the page set to one of Studio's audiences (Cover, Title) shows to this viewer.
     * @param mixed $mixedMode 0 disabled, 1 enabled for all, 2 for guests only, 3 for members only; true or false
     *        where a page sets it in code (setPageCover)
     * @param bool $bMember the viewer is signed in
     * @return bool
     */
    public static function isShownToViewer($mixedMode, $bMember)
    {
        if(is_bool($mixedMode))
            return $mixedMode;

        switch((int)$mixedMode) {
            case 1: //--- Enabled for all
                return true;

            case 2: //--- Enabled for visitors only
                return !$bMember;

            case 3: //--- Enabled for members only
                return (bool)$bMember;
        }

        return false;
    }

    /**
     * Who sees the page's title (Studio > Pages > page > Title), as `cover`: 0 disabled, 1 all, 2 guests, 3 members.
     * A page whose title was never set (NULL, as every page before the title had settings of its own) follows its
     * cover: the title shows where the cover shows, to the same viewers, and not where covers are off in Studio >
     * Designer > Cover.
     * @return mixed the mode, or the cover's (an int, or a bool a page set in code); 0 where it follows a cover that
     *         is off for the whole site
     */
    public function getPageTitleMode()
    {
        if(isset($this->_aObject['title_show']) && $this->_aObject['title_show'] !== '')
            return (int)$this->_aObject['title_show'];

        return BxDolCover::getInstance()->isEnabled() ? $this->_aObject['cover'] : 0;
    }

    /**
     * Whether the page shows its title to this viewer (Studio > Pages > page > Title), with or without its cover.
     * @return bool
     */
    public function isPageTitle()
    {
        return self::isShownToViewer($this->getPageTitleMode(), isLogged());
    }

    /**
     * The screen sizes the page's title is hidden on (Studio > Pages > page > Title hidden on), BX_DB_HIDDEN_* bits as
     * the cover's. A page whose title was never set follows its cover's.
     * @return int
     */
    public function getPageTitleHiddenOn()
    {
        if(isset($this->_aObject['title_hidden_on']))
            return (int)$this->_aObject['title_hidden_on'];

        return $this->getPageCoverHiddenOn();
    }

    /**
     * The screen sizes the page's cover is hidden on (Studio > Pages > Cover: "Cover hidden on"), a set of
     * BX_DB_HIDDEN_* bits as a block's "Hidden on".
     * @return int
     */
    public function getPageCoverHiddenOn()
    {
        return isset($this->_aObject['cover_hidden_on']) ? (int)$this->_aObject['cover_hidden_on'] : 0;
    }

    /**
     * Names of the screen sizes a set of BX_DB_HIDDEN_* bits hides on, as the apps get them: phone, tablet, desktop,
     * mobile-app.
     * @return array
     */
    public static function getHiddenOnNamesAPI($iHiddenOn)
    {
        $aNames = [];
        foreach([BX_DB_HIDDEN_PHONE => 'phone', BX_DB_HIDDEN_TABLET => 'tablet', BX_DB_HIDDEN_DESKTOP => 'desktop', BX_DB_HIDDEN_MOBILE => 'mobile-app'] as $iBit => $sName)
            if((int)$iHiddenOn & pow(2, $iBit - 1))
                $aNames[] = $sName;

        return $aNames;
    }

    public function setSubPage($b = true)
    {
        $this->_bSubPage = $b;
    }

    public function setPageCover($bCover = true)
    {
        $this->_aObject['cover'] = (bool)$bCover;
    }

	public function getPageCoverImage($bTranscoder = true)
    {
    	$iId = (int)$this->_aObject['cover_image'];
    	if(empty($iId)) {
    		$iId = (int)getParam('sys_site_cover_common');
    		if(empty($iId))
    			return array();
    	}

    	$aResult = array(
    		'id' => $iId
    	);
    	if($bTranscoder)
    		$aResult['transcoder'] = BX_DOL_TRANSCODER_OBJ_COVER;
    	else 
    		$aResult['object'] = $this->_sStorage;

    	return $aResult;
    }

    /**
     * The page's cover band for the apps, as the site draws it above the page's title and tabs (cover.html): the
     * picture, else the template's art. None where the site draws no page cover: covers off in Studio > Designer >
     * Cover, the page's cover off for this viewer, the home page (its own cover, `cover_home`) and the pages of an
     * entry or a profile, whose cover is the entry's or the profile's (`cover_block`).
     * @return array image (the page's cover picture, else the site's common cover; '' for none) and image_default
     *         (the template's art for a cover without a picture: light and dark URLs); [] for no band
     */
    public function getPageCoverBandAPI()
    {
        $oCover = BxDolCover::getInstance();
        if(!$oCover->isEnabled() || !$this->isPageCover() || $oCover->isCover())
            return [];

        if($this instanceof BxBasePageHome || isset($this->_aProfileInfo) || $this instanceof BxBaseModGeneralPageEntry)
            return [];

        $sImage = '';
        if(($aCover = $this->getPageCoverImage()))
            $sImage = (string)BxDolCover::getCoverImageUrl($aCover);

        list($sArtLight, $sArtDark) = BxDolCover::getDefaultArt(BxDolModuleQuery::getInstance()->getModuleByUri($this->_oTemplate->getCode()));

        return [
            'image' => $sImage,
            'image_default' => [
                'light' => $sArtLight,
                'dark' => $sArtDark,
            ],
        ];
    }

    /**
     * The "add" action of this page: the + at the end of a section's title row on the site (cover.html) and the "Add"
     * button the apps draw from `menu.add_url` (getPageAPI), so the two always agree. Only on pages of a content, a
     * context or a profile module with a create page ("Add person" on People: an account with no profile may create
     * one), and only for a viewer who may create that item type (the create page's check).
     * @return array ['url' => absolute URL of the create page, 'title' => "Add organization", 'icon' => Lucide name], or an empty array
     */
    public function getAddEntryAction()
    {
        $sModule = !empty($this->_aObject['module']) ? $this->_aObject['module'] : '';
        if(!$sModule || $sModule == 'system' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return [];

        // Not on a page the viewer can't open (an operator's Administration page): the apps show its 403 card there.
        if($this->_isAvailablePage($this->_aObject) !== true || $this->_isVisiblePage($this->_aObject) !== true)
            return [];

        if(!bx_srv('system', 'is_module_content', [$sModule]) && !bx_srv('system', 'is_module_context', [$sModule]) && !bx_srv('system', 'is_module_profile', [$sModule]))
            return [];

        $oModule = BxDolModule::getInstance($sModule);
        if(!$oModule || !($aAdd = self::getAddEntryParams($oModule)) || !$aAdd['allowed'])
            return [];

        return [
            'url' => bx_absolute_url(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $aAdd['url'])),
            'title' => $aAdd['title'],
            'icon' => $aAdd['icon'],
        ];
    }

    /**
     * A content or context module's create page and its add label, and whether the viewer may create that item type.
     * @param BxDolModule $oModule
     * @return array ['url' => page URI, 'title' => "Add organization", 'icon' => Lucide name, 'allowed' => bool], or an empty array when the module
     *      has no create page
     */
    public static function getAddEntryParams($oModule)
    {
        $CNF = &$oModule->_oConfig->CNF;

        $sUri = '';
        if(!empty($CNF['URI_ADD_ENTRY']))
            $sUri = $CNF['URI_ADD_ENTRY'];
        else if(!empty($CNF['URI_EDIT_ENTRY']))
            $sUri = str_replace('edit-', 'create-', $CNF['URI_EDIT_ENTRY']);
        if(!$sUri)
            return [];

        // The module's own add icon, which tells its button from the site's Add menu: the icon of the create item in the
        // module's "My" menu (Studio > Navigation; the menu object's item set), a Lucide name, as both the site and the apps
        // draw it. A module without one, or with an uploaded picture or markup there, keeps the plus.
        $sIcon = '';
        if(!empty($CNF['OBJECT_MENU_ACTIONS_MY_ENTRIES']) && ($aMenu = BxDolMenuQuery::getMenuObject($CNF['OBJECT_MENU_ACTIONS_MY_ENTRIES'])) && !empty($aMenu['set_name']))
            $sIcon = trim(BxDolMenuQuery::getMenuItemIconByLink($aMenu['set_name'], 'page.php?i=' . $sUri));
        if(!preg_match('/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/', $sIcon))
            $sIcon = 'plus';

        $sTitle = _t('_sys_txt_add');
        if(!empty($CNF['T']['txt_sample_single']) && ($sSample = _t($CNF['T']['txt_sample_single'])) !== $CNF['T']['txt_sample_single'])
            $sTitle = _t('_sys_txt_add_entry', $sSample);

        // Guests never get it; members exactly as the create page checks them (addDataForm: checkAllowedAdd, which is
        // ACL "create entry" with its count and period limits and, for profiles, the account's profile limit), only
        // checked here: the create page counts the action when the entry is saved. An account with no profile is checked
        // at the Account level, which may create a profile.
        // A module without that ACL action (Channels: made from hashtags) has no button: checking it would stop the page.
        $bAllowed = isLogged() && method_exists($oModule, 'checkAllowedAdd')
            && BxDolAcl::getInstance()->getMembershipActionId('create entry', $oModule->getName())
            && $oModule->checkAllowedAdd() === CHECK_ACTION_RESULT_ALLOWED;

        return [
            'url' => $sUri,
            'title' => $sTitle,
            'icon' => $sIcon,
            'allowed' => $bAllowed,
        ];
    }

    public function getPageCoverParams()
    {
        $aParams = [
            'title' => $this->_getPageTitle(),
            'actions' => '',
            'bx_if:image' => [
                'condition' => false,
                'content' => []
            ],
            'bx_if:icon' => [
                'condition' => false,
                'content' => []
            ],
        ];

        if(($oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu')) !== false) {
            $aCoverParams = $oMenuSubmenu->getPageCoverParams();
            if(!empty($aCoverParams) && is_array($aCoverParams))
                $aParams = $aCoverParams;
        }

        $aParams['title'] = self::getCustomTitle(isset($aParams['title']) ? $aParams['title'] : '', isset($this->_aObject['cover_title']) ? $this->_aObject['cover_title'] : '');

    	return $aParams;
    }

    /**
     * The page's title with its custom title (Studio > Pages > page > Title > Custom title, `cover_title`): the custom
     * one where it has a translation in the viewer's language, else the page's or its section's own.
     * @param string $sTitle the page's or its section's title
     * @param string $sCustomKey the custom title's language key, '' for none
     * @return string
     */
    public static function getCustomTitle($sTitle, $sCustomKey)
    {
        if(empty($sCustomKey))
            return $sTitle;

        $sCustom = _t($sCustomKey);
        return $sCustom && strcmp($sCustom, $sCustomKey) != 0 ? $sCustom : $sTitle;
    }

    /**
     * Get block title.
     * @return string
     */
    public function getBlockTitle ($aBlock)
    {
        return $this->_replaceMarkers(_t($aBlock['title']), array('block_id' => $aBlock['id']));
    }

    /**
     * Get block description.
     * @return string
     */
    public function getBlockDescription ($aBlock)
    {
        return $this->_replaceMarkers(_t($aBlock['description']), ['block_id' => $aBlock['id']]);
    }

    /**
     * Get block icon.
     * @return string
     */
    public function getBlockIcon ($aBlock)
    {
        return $aBlock['icon'] ?? '';
    }

    /**
     * Get block header icon: the larger icon before the block's title and description. getBlockIcon is the title
     * icon, the small one on the title's line.
     * @return string
     */
    public function getBlockHeaderIcon ($aBlock)
    {
        return $aBlock['header_icon'] ?? '';
    }

    /**
     * Get help control if help is available for the block.
     * @return string
     */
    public function getBlockHelp ($aBlock)
    {
        if(empty($aBlock['help']) || empty(strip_tags(_t($aBlock['help']))))
            return '';

        return $this->_oTemplate->parseHtmlByName('designbox_help.html', array(
            'js_object' => $this->_sJsObjectName,
            'block_id' => $aBlock['id']
        ));
    }

    /**
     * Get code to load block asyncroniously
     * @param $aBlock block code
     * @param $iAsync if greater than 0 the it defines loading indicator for the block
     * @return HTML code string
     */
    public function getBlockAsyncCode($aBlock, $iAsync)
    {
        $aContentPlaceholder = $this->_oQuery->getPageBlockContentPlaceholder($iAsync);
        if (!$aContentPlaceholder)
            return _t('_sys_txt_error_occured');
        $oTemplate = $this->_oTemplate;
        if ('system' != $aContentPlaceholder['module']) {
            $oModule = BxDolModule::getInstance($aContentPlaceholder['module']);
            if (!$oModule)
                return _t('_sys_txt_error_occured');
            $oTemplate = $oModule->_oTemplate;
        }
        return $oTemplate->parseHtmlByName($aContentPlaceholder['template'], $aBlock);
    }

    /**
     * Get page array with all cells and blocks
     */
    public function getPageAPI ($aBlocks = [])
    {
        if(!defined('BX_API_PAGE'))
            define('BX_API_PAGE', true);

        $aGetParams = bx_get('params');
        $bGetParams = $aGetParams !== false;

        $sQueryString = '';
        if($bGetParams && !empty($aGetParams[2]) && ($_aGetParams = json_decode($aGetParams[2], true)) && is_array($_aGetParams)) {
            $sQueryString = http_build_query($_aGetParams);

            parse_str($sQueryString, $aQueryString);
            $_GET = array_merge($_GET, $aQueryString);
        }

        $bLogged = isLogged();
        $bIsAvailable = $this->_isAvailablePage($this->_aObject);
        $bIsVisible = $this->_isVisiblePage($this->_aObject);
        //TODO: If page isn't Available or isn't Visible then we should exit with related Error Codes immediately.

        // A site locked from guests (sys_lock_from_unauthenticated) opens them its exception pages only: page.php sends them
        // to the login form, clients (NEO and link previews made from it) get 403 and nothing of the page's content.
        $bIsLocked = self::isLockedFromUnauthenticated($this->_aObject['uri']);
        if($bIsLocked)
            $bIsVisible = false;

        // Clients (NEO link previews among them) get nothing of the content of a page the viewer can't open.
        $bIsAllowed = $bIsAvailable === true && $bIsVisible === true;

        $sMetaTitle = $bIsAllowed ? $this->_getPageMetaTitle() : '';
        $sName = $bIsAllowed ? $this->_getPageTitle() : getParam('site_title');
        $sMetaImage = $bIsAllowed ? $this->_getPageMetaImage() : '';
        $aMetaImage = $sMetaImage ? $this->getMetaImageInfo($sMetaImage) : [];
        $sUri = $this->_aObject['uri'];
        $sUrl = ($bGetParams && !empty($aGetParams[0]) ? $aGetParams[0] : $sUri) . ($sQueryString != '' ? '?' . $sQueryString : '');
        $sModule = $this->getModule();
        // A guest's home is the splash where Studio > Designer > Splash turns it on for the asking app (X-Neo-Platform).
        $sSplashPlatform = BxDolSplash::getPlatformFromRequest();
        $bSplash = !$bLogged && $sUri == 'home' && BxDolSplash::getInstance()->isEnabledForApp($sSplashPlatform);

        // A closed page has no blocks either: the blocks of a pending entry show it, NEO shows the error by page_status.
        // A guest's home also has its sign-in and join blocks while they are off for the apps, marked `splash_only`: the
        // splash draws them, also one an app forces on itself (NEO's `layout.use_splash_page`), the home page doesn't.
        $aSourcesOff = !$bLogged && $sUri == 'home' ? BxDolSplash::AUTH_BLOCKS : [];
        $aElements = $bIsAllowed ? $this->getPageBlocksAPI($aBlocks, $aSourcesOff) : [];

        if(!$bLogged && !in_array($sUri, ['home', 'login', 'create-account']) && ($sAutoProfile = getParam('sys_account_default_profile_type'))) {
            $sRedirect = getParam($sAutoProfile . '_redirect_aadd');
            if($sRedirect == 'last') {
                $aAutoProfileConfig = bx_srv($sAutoProfile, 'module_config');
                if($sUri != ($aAutoProfileConfig['URI_ADD_ENTRY'] ?? ''))
                    BxDolSession::getInstance()->setValue('custom-referrer', $sUrl);
            }
        }

        $a = [
            'id' => $this->_aObject['id'],
            'title' => $sMetaTitle ? $sMetaTitle : $sName,
            'name' => $sName,
            'description' => $bIsAllowed ? htmlspecialchars(BxTemplFunctions::getInstance()->getMetaText($this->_getPageMetaDesc()), ENT_QUOTES | ENT_HTML5, 'UTF-8') : '',
            'keywords' => $bIsAllowed ? $this->_getPageMetaKeywords() : '',
            'image' => $sMetaImage,
            // Link preview data clients can't make of the fields above.
            'meta' => [
                'image_width' => (int)($aMetaImage['width'] ?? 0),
                'image_height' => (int)($aMetaImage['height'] ?? 0),
                'card' => $sMetaImage ? ($aMetaImage['card'] ?? 'summary_large_image') : 'summary',
                'og_type' => $bIsAllowed ? $this->_getPageMetaType() : 'website',
            ],
            'uri' => $sUri,
            'url' => $sUrl,
            'author' => $this->_aObject['author'],
            'added' => $this->_aObject['added'],
            'module' => $sModule,
            'type' => $this->getType (),
            // The header for this page's layout and this viewer, as Designer sets it: its width and where the main menu sits.
            'header' => BxDolTemplate::getHeaderLayout($this->getType()),
            // The footer for this page's layout and this viewer, as Designer sets it: as wide as the page's content, or the window.
            'footer' => BxDolTemplate::getFooterLayout($this->getType()),
            // How wide the page's content is for this viewer, as Designer sets it: pixels, or 'full'.
            'page_width' => BxDolTemplate::getPageWidth($this->getType()),
            // The favicons uploaded in Designer (fav, svg, dark: '' for each one not uploaded), for the apps' browser tabs.
            'icons' => BxTemplFunctions::getUploadedFaviconUrls(),
            // The site's own mark and logo, light and dark (null for each the site has none of: the apps draw UNA's).
            'logo' => BxBaseApiV2System::logos(),
            // The accent Designer picked (step => "r g b", NEO's --accent-*), or null for the default blue.
            'accent' => BxDolDesigns::getAccentScale() ?: null,
            'layout' => $bSplash ? 'splash' : str_replace('.html', '', $this->_aObject['template']),
            'layout_parsed' => !is_numeric(trim(current(array_keys($aElements)), 'cell_')),
            'cover_block' => '',
            'cover' => $this->_aObject['cover'],
            // Where the cover is hidden: phone, tablet, desktop, mobile-app.
            'cover_hidden_on' => self::getHiddenOnNamesAPI($this->getPageCoverHiddenOn()),
            // Who sees the page's title, as `cover` (0 none, 1 all, 2 guests, 3 members), apart from the cover; a page
            // whose title was never set gets its cover's.
            'title_show' => $this->getPageTitleMode(),
            // Where the page's title is hidden: phone, tablet, desktop, mobile-app.
            'title_hidden_on' => self::getHiddenOnNamesAPI($this->getPageTitleHiddenOn()),
            'menu_top' => '',
            'menu' => '',
            'menu_bottom' => '',
            'menu_add' => '',
            'config' => $this->_aObject['config_api'],
            'elements' => $aElements
        ];

        // The splash UNA draws for the app: its code (markers as placeholders, see BxDolSplash), unless there is none.
        if($bSplash)
            $a['splash'] = BxDolSplash::getInstance()->getSplashAPI($sSplashPlatform);

        $sMenuTop = getParam('sys_api_menu_top');
        if (!empty($sMenuTop) && ($oMenuTop = BxDolMenu::getObjectInstance($sMenuTop)) !== false)
            $a['menu_top'] = $oMenuTop->getCodeAPI();

        if (($oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu')) !== false) {
            if(($sSubmenu = $this->getSubMenu()) !== '')
                $oMenuSubmenu->setObjectSubmenu($sSubmenu, []);

            $a['menu'] = $oMenuSubmenu->getCodeAPI();
            $bModuleEntries = $sModule && $sModule != 'system' && (bx_srv('system', 'is_module_content', [$sModule]) || bx_srv('system', 'is_module_context', [$sModule]));
            $bModuleProfiles = !$bModuleEntries && $sModule && $sModule != 'system' && bx_srv('system', 'is_module_profile', [$sModule]);
            if(($bModuleEntries || $bModuleProfiles) && ($oModule = BxDolModule::getInstance($sModule))) {
                $CNF = &$oModule->_oConfig->CNF;

                // Section name and icon for NEO's sidebar title; profile modules (Persons) get them too. The title is the
                // section's own (the selected site menu item, "People", as UNA's cover shows it), else the module's.
                $aSectionCover = $oMenuSubmenu->getPageCoverParams();
                $aMenuAdd = [
                    'name' => $oModule->getName(),
                    'title' => !empty($aSectionCover['title']) ? $aSectionCover['title'] : BxDolModule::getTitle($oModule->_oConfig->getUri()),
                    'icon' => !empty($CNF['ICON']) ? $CNF['ICON'] : '',
                ];

                // "Add" button: content and context entries and profiles ("Add person" on People). `add_url` also gives the
                // section its Search in the apps, so it stays for a viewer who may not add: `add_allowed` hides the button then.
                // The site draws the same button from the same data (getAddEntryAction, cover.html).
                if(($aAdd = self::getAddEntryParams($oModule))) {
                    $aMenuAdd['add_url'] = $aAdd['url'];
                    $aMenuAdd['add_title'] = $aAdd['title'];
                    $aMenuAdd['add_icon'] = $aAdd['icon'];
                    $aMenuAdd['add_allowed'] = $aAdd['allowed'];
                }

                $a['menu'] = array_merge($a['menu'], $aMenuAdd);
            }
        }

        // The words of the apps' own landing pages (the home splash, Sign up), in the viewer's language, so Studio's
        // language strings reach them; a project's own text in the app wins.
        $aTexts = [];
        if($sUri == 'home')
            $aTexts = ['title' => '_sys_txt_splash_title', 'text' => '_sys_txt_splash_slogan'];
        else if($sUri == 'create-account')
            $aTexts = ['title' => '_sys_txt_join_title', 'text' => '_sys_txt_join_text', 'title_invite' => '_sys_txt_join_title_invite', 'text_invite' => '_sys_txt_join_text_invite'];
        if($aTexts)
            $a['texts'] = self::getTranslatedTextsAPI($aTexts);
        // The home page's tagline: the site's description while the splash shows it ({site_description}).
        if($sUri == 'home' && ($sTagline = BxDolSplash::getInstance()->getTagline()) !== '')
            $a['texts']['text'] = $sTagline;

        // The title UNA's cover shows (the selected site menu item for a section, else the page's), for the apps' header.
        // HTML-escaped like `title`.
        if($bIsAllowed) {
            $aCoverParams = $this->getPageCoverParams();
            $a['cover_title'] = isset($aCoverParams['title']) ? (string)$aCoverParams['title'] : '';

            // The band UNA's cover draws above the page's title and tabs, for the apps to draw the same.
            if(($aCoverBand = $this->getPageCoverBandAPI()))
                $a['cover_band'] = $aCoverBand;
        }
    
        /**
         * Profile/Context view page.
         */
        if(!$bIsLocked && isset($this->_aProfileInfo)) {
            $oProfileModule = BxDolModule::getInstance($this->_aProfileInfo['type']);
            if($oProfileModule !== null)
                $aProfileContentInfo = $oProfileModule->_oDb->getContentInfoById($this->_aProfileInfo['content_id']);

            if(!empty($aProfileContentInfo) && is_array($aProfileContentInfo)) {
                $CNF = &$oProfileModule->_oConfig->CNF;

                /**
                 * Process page cover with related menus and lists.
                 * A profile the viewer can't open shows no cover: it carries the profile info and the original cover image.
                 */
                if($bIsAllowed && BxDolCover::getInstance($this)->isCover())
                    $a['cover_block'] = $oProfileModule->getCoverBlockAPI($aProfileContentInfo);
                
                /**
                 * Process page mange menu.
                 */
                if(($oMenuManage = BxDolMenu::getObjectInstance('sys_site_manage')) !== false) {
                    if(!empty($CNF['FIELD_ID']))
                        $oMenuManage->setContentId($aProfileContentInfo[$CNF['FIELD_ID']]);

                    $aObjectManage = [];
                    if(!empty($CNF['OBJECT_MENU_MANAGE_VIEW_ENTRY']))
                        $aObjectManage = [$CNF['OBJECT_MENU_MANAGE_VIEW_ENTRY']];
                    else if(!empty($CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE']))
                        $aObjectManage = [$CNF['OBJECT_MENU_ACTIONS_VIEW_ENTRY_MORE'], true];

                    call_user_func_array([$oMenuManage, 'setObjectManage'], $aObjectManage);

                    $aMenuManage = $oMenuManage->getCodeAPI();
                    if(!empty($aMenuManage) && is_array($aMenuManage)) {
                        if(isset($a['cover_block'], $a['cover_block']['actions_menu']) && is_array($a['cover_block']['actions_menu']))
                            $a['cover_block']['actions_menu']['items'] = array_merge($a['cover_block']['actions_menu']['items'], $aMenuManage['items']);
                        else
                            $a['cover_block']['actions_menu'] = $aMenuManage;
                    }
                }
            }
        }

        if($bLogged && ($o = BxDolProfile::getInstance()) !== false) {
            $iLogged = $o->id();

            $a['user'] = BxDolProfile::getDataForPage($o);

            if(($sContextSwitcher = getParam('sys_api_context_switcher')) && ($sContextConnection = getParam('sys_api_context_connection'))) {
                $aCpIds = bx_srv($sContextSwitcher, 'get_participating_profiles', [$iLogged, ($sContextConnection != 'participants' ? $sContextConnection : false)]);

                $aContexts = [];
                foreach($aCpIds as $iCpId) {
                    $aProfileData = BxDolProfile::getData($iCpId); 
                    if($aProfileData['display_name'] === false && $aProfileData['url'] === false )
                        continue;

                    $aContexts[] = $aProfileData;
                }

                $aInvitedTo = [];
                if(($aInvitations = bx_srv($sContextSwitcher, 'invitations', [$iLogged, true])) && is_array($aInvitations))
                    foreach($aInvitations as $aInvitation)
                        $aInvitedTo[] = BxDolProfile::getData($aInvitation['group_profile_id']);

                $aCurrent = [];
                if(($iId = bx_get('id')) !== false) {
                    $aInfo = bx_srv($sModule, 'get_info', [(int)$iId, false]);

                    if($aInfo && (($iValue = (int)($aInfo['allow_view_to'] ?? 0)) || ($iValue = (int)($aInfo['object_privacy_view'] ?? 0)))) {
                        $mixedContext = false;
                        if($iValue < 0) {
                            $aContext = BxDolProfileQuery::getInstance()->getInfoById(abs($iValue));
                            if($aContext && $aContext['type'] == $sContextSwitcher)
                                $mixedContext = (int)$aContext['id'];
                        }
                        else if($sModule == $sContextSwitcher)
                            $mixedContext = BxDolProfile::getInstanceByContentAndType((int)$aInfo['id'], $sModule);

                        if($mixedContext !== false)
                            $aCurrent = BxDolProfile::getData($mixedContext);
                    }
                }
                else if(($iContextPid = bx_get('profile_id')) !== false && ($oContext = BxDolProfile::getInstance($iContextPid)) !== false)
                    $aCurrent = BxDolProfile::getData($oContext);

                $_sSample = '_' . $sContextSwitcher . '_txt_sample_single';
                $sSample = _t($_sSample);
                if(strcmp($_sSample, $sSample) == 0)
                    $sSample = _t('_Context');

                $a['context'] = [
                    'list' => $aContexts,
                    'invitations' => $aInvitedTo,
                    'current' => $aCurrent,
                    'links' => []
                ];

                if(bx_srv($sContextSwitcher, 'check_allowed', ['add']) === CHECK_ACTION_RESULT_ALLOWED)
                    $a['context']['links'][] = [
                        'title' => _t('_api_create_context', $sSample),
                        'icon' => 'Plus',
                        'url' => bx_api_get_relative_url(bx_srv($sContextSwitcher, 'get_link_add'))
                    ];
            }
        }

        // A locked page is 403 whatever it holds: a 404 would tell guests which entries exist.
        if($bIsLocked)
            $a['page_status'] = 403;
        else if($bIsAvailable !== true)
            $a['page_status'] = 404;
        else if($bIsVisible !== true)
            $a['page_status'] = 403;

        return array_merge($a, [
            'version' => ($sVersion = bx_get_ver()) && $sVersion == BX_DOL_VERSION ? $sVersion : 'invalid',
            // Interface sounds settings ride along with every page, so the apps never wait on them to play a sound.
            'sounds' => BxDolSounds::getInstance()->getConfig(),
            'ts' => time()
        ]);
    }

    /**
     * The strings of the language keys in $aKeys (field => key), in the viewer's language. A string the site's
     * language doesn't have comes back from _t as its key: it is left out, so the app uses its own words.
     */
    public static function getTranslatedTextsAPI($aKeys)
    {
        $aTexts = [];
        foreach($aKeys as $sField => $sKey)
            if(($sText = _t($sKey)) !== $sKey)
                $aTexts[$sField] = $sText;

        return $aTexts;
    }

    public function getPageContentAPI($aBlocks = [])
    {
        $sModule = $this->getModule();

        // A page the viewer can't open (a pending or private entry, a private list) gives out neither its title nor its blocks, as in getPageAPI.
        // A page a site locked from guests covers is 403 for them, whatever it holds.
        $bIsLocked = self::isLockedFromUnauthenticated($this->_aObject['uri']);
        $bIsAllowed = !$bIsLocked && $this->_isAvailablePage($this->_aObject) === true && $this->_isVisiblePage($this->_aObject) === true;

        return [
            'module' => $sModule,
            'title' => $bIsAllowed ? ($this->_getPageMetaTitle() ?: $this->_getPageTitle()) : getParam('site_title'),
            'elements' => $bIsAllowed ? $this->getPageBlocksAPI($aBlocks) : [],
        ] + ($bIsLocked ? ['page_status' => 403] : []);
    }

    /**
     * `module:method` of a service block, empty for any other block.
     */
    protected static function getBlockServiceSource($aBlock)
    {
        if(($aBlock['type'] ?? '') != 'service') {
            return '';
        }

        $aContent = @unserialize($aBlock['content']);
        return is_array($aContent) && isset($aContent['module'], $aContent['method']) ? $aContent['module'] . ':' . $aContent['method'] : '';
    }

    /**
     * The page's blocks for the apps, by cell.
     * @param array $aBlocks only these blocks (`module:method` of a service block, a custom block's content, `system:block_<id>`)
     * @param array $aSourcesOff these service blocks also while they are off for the apps (`active_api`), marked
     *              `splash_only` (the guest home's sign-in blocks, BxDolSplash::AUTH_BLOCKS)
     */
    public function getPageBlocksAPI($aBlocks = [], $aSourcesOff = [])
    {
        $aHiddenOn = [
            pow(2, BX_DB_HIDDEN_PHONE - 1) => 'phone',
            pow(2, BX_DB_HIDDEN_TABLET - 1) => 'tablet',
            pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'desktop',
            pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'mobile-app'
        ];
        $aFieldsUnset = ['object', 'cell_id', 'title_system', 'class', 'submenu', 'tabs', 'async', 'visible_for_levels', 'type', 'text', 'text_updated', 'cache_lifetime', 'active', 'active_api', 'copyable', 'deletable', 'order'];

        $bBlocks = !empty($aBlocks) && is_array($aBlocks);

        $bSourcesOff = !empty($aSourcesOff) && is_array($aSourcesOff);

        $aCells = $this->_oQuery->getPageBlocks(true, $bSourcesOff);
        foreach($aCells as $sKey => &$aCell) {
            foreach($aCell as $i => &$aBlock) {
                $bSplashOnly = $bSourcesOff && (int)$aBlock['active_api'] != 1;
                if($bSplashOnly && !in_array(self::getBlockServiceSource($aBlock), $aSourcesOff, true)) {
                    unset($aCells[$sKey][$i]);
                    continue;
                }

                if(!$this->_isVisibleBlock($aBlock)) {
                    unset($aCells[$sKey][$i]);
                    continue;
                }

                $this->processPageBlock($aCells[$sKey][$i], true);
                $aBlock = $aCells[$sKey][$i];

                $sSource = '';
                if($aBlock['type'] == 'service') {
                    $sSource = self::getBlockServiceSource($aBlock);
                }
                else if($aBlock['type'] == 'custom')
                    $sSource = $aBlock['content'];
                else
                    $sSource = 'system:block_' . $aBlock['id'];

                if($bBlocks && !in_array($sSource, $aBlocks)) {
                    unset($aCells[$sKey][$i]);
                    continue;
                }

                if(($sK = 'config_api') && !empty($aBlock[$sK])) {
                    $aConfigApi = json_decode($aBlock[$sK], true);
                    if(!empty($aConfigApi) && is_array($aConfigApi))
                        $aBlock[$sK] = $aConfigApi;
                }
                
                if(($sK = 'help') && !empty($aBlock[$sK]))
                    $aBlock[$sK] = _t($aBlock[$sK]);

                $mBlock = $aBlock['content'];
                if(($sFunc = '_getBlock' . bx_gen_method_name($aBlock['type'])) && method_exists($this, $sFunc))
                    $mBlock = $this->$sFunc($aBlock); 

                if(empty($mBlock)) {
                    unset($aCells[$sKey][$i]);
                    continue;
                }

                $sIcon = '';
                if(($sIcon = $this->getBlockIcon($aBlock))) {
                    list($sIcon, $sIconUrl, $sIconA, $sIconHtml) = $this->_oTemplate->getTemplateFunctions()->getIcon($sIcon);
                    
                    if($sIcon)
                        $sIcon = BxDolIconset::getObjectInstance()->getIcon($sIcon);
                    else if($sIconHtml)
                        $sIcon = $sIconHtml;
                }

                $sHeaderIcon = '';
                if(($sHeaderIcon = $this->getBlockHeaderIcon($aBlock))) {
                    list($sHeaderIcon, $sIconUrl, $sIconA, $sIconHtml) = $this->_oTemplate->getTemplateFunctions()->getIcon($sHeaderIcon);

                    if($sHeaderIcon)
                        $sHeaderIcon = BxDolIconset::getObjectInstance()->getIcon($sHeaderIcon);
                    else if($sIconHtml)
                        $sHeaderIcon = $sIconHtml;
                }

                $aCells[$sKey][$i] = array_merge($aCells[$sKey][$i], [
                    'title' => isset($mBlock['title']) ? $mBlock['title'] : $this->getBlockTitle($aBlock),
                    'description' => isset($mBlock['description']) ? $mBlock['description'] : $this->getBlockDescription($aBlock),
                    'icon' => $sIcon,
                    'header_icon' => $sHeaderIcon,
                    'content' => isset($mBlock['content']) ? $mBlock['content'] : $mBlock,
                    'menu' => isset($mBlock['menu']) ? $mBlock['menu'] : '',
                    'source' => $sSource
                ]);

                // Off for the apps, sent for the splash only.
                if($bSplashOnly) {
                    $aCells[$sKey][$i]['splash_only'] = true;
                }

                if(($sK = 'hidden_on') && !empty($aBlock[$sK])) {
                    $aHoResults = [];
                    foreach($aHiddenOn as $iHiddenOn => $sHiddenOn)
                        if((int)$aBlock[$sK] & $iHiddenOn)
                            $aHoResults[] = $sHiddenOn;

                    $aCells[$sKey][$i][$sK] = $aHoResults;
                }
                else 
                    $aCells[$sKey][$i][$sK] = false;

                // Where its title, background or padding is hidden (Studio), for the apps' design box per screen size.
                foreach(BxDolPageDesignbox::PARTS as $sPart)
                    $aCells[$sKey][$i][$sPart . '_hidden_on'] = !empty($aBlock[$sPart . '_hidden_on']) ? self::getHiddenOnNamesAPI($aBlock[$sPart . '_hidden_on']) : false;
                // Its title and padding sizes (Studio): '' (regular), 'compact' or 'large'.
                foreach(BxDolPageDesignbox::SIZED_PARTS as $sPart) {
                    $aCells[$sKey][$i][$sPart . '_size'] = BxDolPageDesignbox::getSize($aBlock, $sPart);
                }

                $aCells[$sKey][$i] = array_diff_key($aCells[$sKey][$i], array_flip($aFieldsUnset));
            }
        }

        return array_map('array_values', $aCells);
    }

    /**
     * A block that draws a heading of its own (the Sign up page's picture and words) is the page's heading, wherever
     * it stands on the page: the blocks' code is looked through before any block's title is made the heading
     * (_setBlockTitleAsHeading), so a block titled as the page keeps its `<h2>` also when it comes first, as after an
     * operator moves the blocks in Studio.
     * @param array $aCodes the code of the page's blocks in their design boxes
     */
    protected function _setHeadingBlockByContent($aCodes)
    {
        if($this->_bHeadingBlock || $this->isPageTitle())
            return;

        foreach($aCodes as $sCode) {
            if(!is_string($sCode) || !preg_match('/<h1[\s>]/i', $sCode))
                continue;

            $this->_bHeadingBlock = true;
            BxDolCover::getInstance()->setPageHasHeading();
            return;
        }
    }

    /**
     * Get page code vars
     * @return string
     */
    protected function _getPageCodeVars ()
    {
    	$aHiddenOn = array(
            pow(2, BX_DB_HIDDEN_PHONE - 1) => 'bx-def-media-phone-hide',
            pow(2, BX_DB_HIDDEN_TABLET - 1) => 'bx-def-media-tablet-hide',
            pow(2, BX_DB_HIDDEN_DESKTOP - 1) => 'bx-def-media-desktop-hide',
            pow(2, BX_DB_HIDDEN_MOBILE - 1) => 'bx-def-mobile-app-hide'
        );

        $aVars = array (
            'page_id' => 'bx-page-' . $this->_aObject['uri'],
            'bx_if:show_layout_row_dump' => array(
                'condition' => false,
                'content' => array()
            )
        );
        $aBlocks = $this->_oQuery->getPageBlocks();
        // Every block's code first: which block holds the page's heading is known only once all are drawn.
        $aCodes = [];
        foreach ($aBlocks as $sKey => $aCell) {
            foreach ($aCell as $i => $aBlock) {
                $this->processPageBlock($aBlock, false);

                // Drawing a block may change it (a service that returns a class for its container): kept after.
                $aCodes[$sKey . ':' . $i] = $this->_getBlockCodeWithCache($aBlock, $aBlock['async']);
                $aBlocks[$sKey][$i] = $aBlock;
            }
        }
        $this->_setHeadingBlockByContent($aCodes);

        foreach ($aBlocks as $sKey => $aCell) {
            $sCell = '';
            foreach ($aCell as $i => $aBlock) {
                $sContentWithBox = $aCodes[$sKey . ':' . $i];
                if($sContentWithBox)
                    $sContentWithBox = $this->_setBlockTitleAsHeading($aBlock, $sContentWithBox);

            	$sClassAdd = '';
                if(!empty($aBlock['class']))
                    $sClassAdd .= ' ' . $aBlock['class'];

                if(!empty($aBlock['hidden_on']))
                    foreach($aHiddenOn as $iHiddenOn => $sHiddenOnClass)
                        if((int)$aBlock['hidden_on'] & $iHiddenOn)
                            $sClassAdd .= ' ' . $sHiddenOnClass;

                // Its title, background or padding hidden on some screen sizes (Studio).
                if(($sDesignboxClasses = BxDolPageDesignbox::getHiddenOnClasses($aBlock)))
                    $sClassAdd .= ' ' . $sDesignboxClasses;

                // Its title and padding sizes, compact or large (Studio).
                $sSizeClasses = BxDolPageDesignbox::getSizeClasses($aBlock);
                if($sSizeClasses) {
                    $sClassAdd .= ' ' . $sSizeClasses;
                }

                if ($sContentWithBox)
                    $sCell .= $this->_oTemplate->parseHtmlByName('designbox_container.html', array(
                        'class_add' => $sClassAdd,
                        'bx_if:show_html_id' => array(
                            'condition' => true,
                            'content' => array(
                                'html_id' => 'bx-page-block-' . $aBlock['id']
                            ),
                        ),
                        'content' => $sContentWithBox
                    ));
            }
            $aVars[$sKey] = $sCell;
        }

        // A one-column page with nothing to show this viewer (Explore for guests without Timeline)
        // says so, as the apps do, instead of a blank area under the cover.
        if((int)$this->_aObject['cells_number'] == 1 && isset($aVars['cell_1']) && trim($aVars['cell_1']) === '')
            $aVars['cell_1'] = MsgBox(_t('_Empty'));

        return $aVars;
    }

    /**
     * Process block values, especially if someting need to be overrided 
     */
    protected function processPageBlock(&$aBlock, $bApi = false) 
    {

    }

    /**
     * Get page code only.
     * @return string
     */
    protected function _getPageCode ()
    {
        $aVars = $this->_getPageCodeVars ();
        return $this->_oTemplate->parseHtmlByName($this->_aObject['template'], $aVars);
    }

    /**
     * Get one block code only.
     * @return string
     */
    protected function _getBlockOnlyCode ($iBlockId)
    {
        if (!($aBlock = $this->_oQuery->getPageBlock((int)$iBlockId)))
            return '';
        return $this->_getBlockCodeWithCache($aBlock, 0);
    }


    protected function _getBlockCodeWithCache(&$aBlock, $iAsync = 0)
    {
        if (bx_is_dbg() || !getParam('sys_pb_cache_enable') || !$aBlock['cache_lifetime'] || $iAsync || (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST')) {
            $sBlockCode = $this->_getBlockCode($aBlock, $iAsync);
        }
        else {
            $oCache = $this->_getBlockCacheObject();
            $sKey = $this->_getBlockCacheKey(false, $aBlock);
            $sKeyCssJs = 'cssjs_' . $sKey;

            $mixedRet = $oCache->getData($sKey, $aBlock['cache_lifetime']);
            $aRetCssJs = $oCache->getData($sKeyCssJs, $aBlock['cache_lifetime']);

            if ($mixedRet !== null && $aRetCssJs !== null) {
                BxDolTemplate::getInstance()->collectingStart();
                BxDolTemplate::getInstance()->collectingInject($aRetCssJs['css'], $aRetCssJs['js']);
                $sBlockCode = BxDolTemplate::getInstance()->collectingEndGetCode();
                $sBlockCode .= $mixedRet;
            } else {
                BxDolTemplate::getInstance()->collectingStart();

                $sBlockCode = $this->_getBlockCode($aBlock, $iAsync);

                $aBlockCssJs = BxDolTemplate::getInstance()->collectingEndGetCode(array(), array(), 'array');

                $oCache->setData($sKey, $sBlockCode, $aBlock['cache_lifetime']);
                $oCache->setData($sKeyCssJs, $aBlockCssJs, $aBlock['cache_lifetime']);
            }
        }

        return $sBlockCode;
    }

    /**
     * Get block code.
     * @return string
     */
    protected function _getBlockCode(&$aBlock, $iAsync = 0)
    {
        $sContentWithBox = '';
        $oFunctions = $this->_oTemplate->getTemplateFunctions();

        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->beginPageBlock(_t($aBlock['title']), $aBlock['id']);

        $aDbNoTitle = [BX_DB_CONTENT_ONLY, BX_DB_PADDING_CONTENT_ONLY, BX_DB_NO_CAPTION, BX_DB_PADDING_NO_CAPTION];

        $sTitle = $this->getBlockTitle($aBlock);
        $sDescription = $this->getBlockDescription($aBlock);
        $sIcon = $this->getBlockIcon($aBlock);
        $sHeaderIcon = $this->getBlockHeaderIcon($aBlock);
        $sHelp = $this->getBlockHelp($aBlock);

        $sFunc = '_getBlock' . ucfirst($aBlock['type']);
        $bBlockVisible = $this->_isVisibleBlock($aBlock);
        if ($iAsync && $bBlockVisible) {
            $iDesignboxId = $aBlock['designbox_id'];

            $sHelpTitle = $sHelpContent = '';
            if(!in_array($iDesignboxId, $aDbNoTitle))
                $sHelpTitle = $sHelp;
            else
                $sHelpContent = $sHelp;

            $sContent = $this->getBlockAsyncCode($aBlock, $iAsync);
            $aParams = [
                ($sBlTitle = $sTitle . $sHelpTitle) && ($sDescription || $sIcon || $sHeaderIcon) ? [$sBlTitle, $sDescription, $sIcon, $sHeaderIcon] : $sBlTitle,
                $sContent . $sHelpContent,
                $iDesignboxId
            ];
            $sContentWithBox = call_user_func_array(array($oFunctions, 'designBoxContent'), $aParams);
        } 
        elseif ($bBlockVisible && method_exists($this, $sFunc)) {
            $mixedContent = $this->$sFunc($aBlock);

            if(!empty($aBlock['content_empty'])) {
                $sEmpty = _t($aBlock['content_empty']);
                $sRegExp = '/(<[A-Za-z0-9]+\b.[^<]*[\pPi\pPf]bx\-msg\-box\b.*[\pPi\pPf][^>]*>)(' . _t('_Empty') . ')(<\/[A-Za-z0-9]+>)/su';
                if(is_string($mixedContent))
                    $mixedContent = preg_replace($sRegExp, "\${1}" . $sEmpty . "\${3}", $mixedContent);
                else if(is_array($mixedContent) && !empty($mixedContent['content']))
                   $mixedContent['content'] = preg_replace($sRegExp, "\${1}" . $sEmpty . "\${3}", $mixedContent['content']);
            }

            $this->_oQuery->setReadOnlyMode(true);

            if(is_array($mixedContent) && !empty($mixedContent['content'])) {
                $iDesignboxId = isset($mixedContent['designbox_id']) ? $mixedContent['designbox_id'] : $aBlock['designbox_id'];

                // A block can give its own description, as it can in the apps (getPageAPI).
                if(isset($mixedContent['description']))
                    $sDescription = $mixedContent['description'];

                if(!empty($mixedContent['markers']) && is_array($mixedContent['markers'])) {
                    $this->addMarkers($mixedContent['markers']);

                    $sTitle = $this->getBlockTitle($aBlock);
                    $sDescription = $this->getBlockDescription($aBlock);
                }

                $sHelpTitle = $sHelpContent = '';
                if(!in_array($iDesignboxId, $aDbNoTitle))
                    $sHelpTitle = $sHelp;
                else
                    $sHelpContent = $sHelp;

                $aParams = [
                    ($sBlTitle = ($mixedContent['title'] ?? $sTitle) . $sHelpTitle) && ($sDescription || $sIcon || $sHeaderIcon) ? [$sBlTitle, $sDescription, $sIcon, $sHeaderIcon] : $sBlTitle,
                    $mixedContent['content'] . $sHelpContent,
                    $iDesignboxId
                ];

                $mixedMenu = false;
                if(isset($mixedContent['menu']))
                    $mixedMenu = $mixedContent['menu'];
                else if(!empty($aBlock['submenu']))
                    $mixedMenu = $aBlock['submenu'];
                $aParams[] = $mixedMenu;

                if(isset($mixedContent['buttons']))
                    $aParams[] = $mixedContent['buttons'];
                else if($mixedMenu)
                    $aParams[] = (int)$aBlock['tabs'] == 1 ? true : array();

                if(isset($mixedContent['class']))
                    $aBlock['class'] = $mixedContent['class'];
            }
            else if(is_string($mixedContent) && !empty($mixedContent)) {
                $iDesignboxId = $aBlock['designbox_id'];

                $sHelpTitle = $sHelpContent = '';
                if(!in_array($iDesignboxId, $aDbNoTitle))
                    $sHelpTitle = $sHelp;
                else
                    $sHelpContent = $sHelp;

                $aParams = array(
                    ($sBlTitle = $sTitle . $sHelpTitle) && ($sDescription || $sIcon || $sHeaderIcon) ? [$sBlTitle, $sDescription, $sIcon, $sHeaderIcon] : $sBlTitle,
                    $mixedContent . $sHelpContent,
                    $iDesignboxId
                );

                $mixedMenu = !empty($aBlock['submenu']) ? $aBlock['submenu'] : false;
                $aParams[] = $mixedMenu;

                if($mixedMenu)
                    $aParams[] = (int)$aBlock['tabs'] == 1 ? true : array();
            }

            if(!empty($aParams))
                $sContentWithBox = call_user_func_array(array($oFunctions, 'designBoxContent'), $aParams);
        }

        if (isset($GLOBALS['bx_profiler'])) $GLOBALS['bx_profiler']->endPageBlock($aBlock['id'], $sContentWithBox ? false : true, false );

        return $sContentWithBox;
    }

    /**
     * Add necessary js and css files.
     */
    protected function _addJsCss()
    {
        $this->_oTemplate->addJs(array('BxDolPage.js', 'theia-sticky-sidebar/theia-sticky-sidebar.umd.js', 'theia-sticky-sidebar/ResizeSensor.min.js'));
        $this->_oTemplate->addCss('page_layouts.css');
    }

    /**
     * Set system template variables, like page title, meta description, meta keywords and meta robots.
     */
    protected function _addSysTemplateVars ()
    {
        $oTemplate = BxDolTemplate::getInstance();

        $sPageTitle = $this->_getPageTitle();
        if ($sPageTitle)
            $oTemplate->setPageHeader ($sPageTitle);

        $sMetaTitle = $this->_getPageMetaTitle();
        if ($sMetaTitle)
            $oTemplate->setPageMetaTitle ($sMetaTitle);
        
        $sMetaDesc = $this->_getPageMetaDesc();
        if ($sMetaDesc)
            $oTemplate->setPageDescription ($sMetaDesc);

        $sMetaRobots = $this->_getPageMetaRobots();
        if ($sMetaRobots)
            $oTemplate->setPageMetaRobots ($sMetaRobots);

        $sMetaImage = $this->_getPageMetaImage();
        if ($sMetaImage)
            $oTemplate->addPageMetaImage($sMetaImage, $this->getMetaImageInfo($sMetaImage));

        $oTemplate->setPageMetaType($this->_getPageMetaType());

        $sMetaKeywords = $this->_getPageMetaKeywords();
        if ($sMetaKeywords)
            $oTemplate->addPageKeywords ($sMetaKeywords);
    }

    /**
     * Select menu from page properties.
     */
    protected function _selectMenu ()
    {
        BxDolMenu::setSelectedGlobal ($this->_aObject['module'], $this->_aObject['uri']);
    }

    /**
     * Set page submenu if it's specified
     */
    protected function _setSubmenu ($aParams)
    {
        if(empty($this->_aObject['submenu']) || $this->_aObject['submenu'] == 'disabled')
            return;

        $oMenuSubmenu = BxDolMenu::getObjectInstance('sys_site_submenu');
        if(!$oMenuSubmenu)
            return;

        $oMenuSubmenu->setObjectSubmenu($this->_aObject['submenu'], $aParams);
    }

    /**
     * Get content for 'raw' block type.
     * @return string
     */
    protected function _getBlockRaw ($aBlock)
    {
        if (bx_is_api()){
            return [bx_api_get_block('raw', ['title' => _t($aBlock['title']), 'content' => BxDolTemplate::getInstance()->parseHtmlByContent($aBlock['content'], array())])];
        }
        
        $s = '<div class="bx-page-raw-container bx-def-vanilla-html max-w-none">' . BxDolTemplate::getInstance()->parseHtmlByContent($aBlock['content'], array()) . '</div>';
        $s = $this->_replaceMarkers($s, array('block_id' => $aBlock['id']));
        $s = bx_process_macros($s);
        return $s;
    }

    /**
     * Get content for 'custom' block type.
     * @return string
     */
    protected function _getBlockCustom ($aBlock)
    {
        if (bx_is_api()){
            return [bx_api_get_block('custom', ['title' => _t($aBlock['title']), 'content' => BxDolTemplate::getInstance()->parseHtmlByContent($aBlock['content'], array())])];
        }
        
        $s = '<div class="bx-page-custom-container">' . BxDolTemplate::getInstance()->parseHtmlByContent($aBlock['content'], array()) . '</div>';
        $s = $this->_replaceMarkers($s, array('block_id' => $aBlock['id']));
        $s = bx_process_macros($s);
        return $s;
    }

    /**
     * Get content for 'html' block type.
     * @return string
     */
    protected function _getBlockHtml ($aBlock)
    {
        if (bx_is_api()){
            return [bx_api_get_block('html', ['title' => _t($aBlock['title']), 'content' => $aBlock['content']])];
        }
        
        $s = '<div class="bx-page-html-container bx-def-vanilla-html max-w-none">' . $aBlock['content'] . '</div>';
        $s = $this->_replaceMarkers($s, array('block_id' => $aBlock['id']));
        $s = bx_process_macros($s);
        return $s;
    }
    
    /**
     * Get content for 'creative' block type.
     * @return string
     */
    protected function _getBlockCreative ($aBlock)
    {
        if(bx_is_api())
            return [bx_api_get_block('creative', ['title' => _t($aBlock['title']), 'content' => $aBlock['content']])];

        $s = $this->_replaceMarkers($aBlock['content'], ['block_id' => $aBlock['id']]);
        $s = bx_process_macros($s);

        $bCanManage = $this->isAllowedCreativeManage();

        if($bCanManage) {
            $this->_oTemplate->addCss([
                BX_DIRECTORY_PATH_PLUGINS_PUBLIC . 'grapesjs/|grapes.min.css',
            ]);

            $this->_oTemplate->addJs([
                'grapesjs/grapes.min.js',
                'grapesjs/grapesjs-blocks-basic.js',
                'grapesjs/grapesjs-style-bg.js',
                'grapesjs/grapesjs-preset-webpage.min.js',
            ]);
        }
        
        return $this->_oTemplate->parseHtmlByName('block_creative.html', [
            'block_id' => $aBlock['id'],
            'content' => $s,
            'bx_if:show_controls' => [
                'condition' => $bCanManage,
                'content' => [
                    'onclick_edit' => $this->_sJsObjectName . '.creativeEdit(this, ' . $aBlock['id'] . ')',
                    'onclick_save' => $this->_sJsObjectName . '.creativeSave(this, ' . $aBlock['id'] . ')'
                ]
            ]
        ]);
    }

    /**
     * Get content for 'bento_grid' block type.
     * @return string
     */
    protected function _getBlockBentoGrid ($aBlock)
    {
        if(bx_is_api()) {
            $iBlockId = (int)$aBlock['id'];

            $iContentId = 0;
            if(($mContentId = bx_get('id')) !== false) 
                $iContentId = (int)$mContentId;

            $sContentModule = '';
            if(!empty($this->_aObject['module']) && !in_array($this->_aObject['module'], ['system', 'custom']))
                $sContentModule = $this->_aObject['module'];

            $bIsAllowedEdit = false;
            if(!empty($sContentModule) && bx_is_srv($sContentModule, 'check_allowed_with_content'))
                $bIsAllowedEdit = bx_srv($sContentModule, 'check_allowed_with_content', ['edit', $iContentId]) === CHECK_ACTION_RESULT_ALLOWED;
            else
                $bIsAllowedEdit = isAdmin();

            return [bx_api_get_block('bento_grid', [
                'title' => _t($aBlock['title']), 
                'content' => self::getPageBlockData($iBlockId, $iContentId, $sContentModule)
            ], ['ext' => [
                'block_id' => $iBlockId,
                'content_id' => $iContentId,
                'content_module' => $sContentModule,
                'is_allowed_edit' => $bIsAllowedEdit
            ]])];
        }

        /**
         * Isn't supported for now.
         */
        return '';
    }

    /**
     * Get content for 'wiki' block type.
     * @return string
     */
    protected function _getBlockWiki ($aBlock)
    {
        $oWiki = BxDolWiki::getObjectInstance($this->_aObject['module']);
        if (!$oWiki) {
            $sContent = ($sMsg = _t('_sys_wiki_error_missing_wiki_object', $this->_aObject['module'])) && $this->_bIsApi ? ['content' => $sMsg] : $sMsg;
        } 
        else {
            $sContent = $oWiki->getBlockContent($aBlock['id'], false, ($iRevision = bx_get($aBlock['id'] . 'rev')) !== false ? (int)$iRevision : false);
        }

        if($this->_bIsApi)
            return [bx_api_get_block('html', array_merge([
                'title' => _t($aBlock['title']), 
                'content' => ''
            ], $sContent))];

        $s = '<div id="bx-page-wiki-container-' . $aBlock['id'] . '" class="bx-page-wiki-container markdown-body bx-def-vanilla-html">' . $sContent . '</div>';
        $s = $this->_replaceMarkers($s, array('block_id' => $aBlock['id']));
        $s = bx_process_macros($s);
        return $s;
    }

    /**
     * Get content for 'lang' block type.
     * @return string
     */
    protected function _getBlockLang ($aBlock)
    {
        if (bx_is_api()){
            // Markers such as {site_title}, as on the web.
            $sContent = $this->_replaceMarkers(_t(trim($aBlock['content'])), ['block_id' => $aBlock['id']]);
            return [bx_api_get_block('lang', ['title' => _t($aBlock['title']), 'content' => bx_process_macros($sContent)])];
        }
    
        // The default Terms and Privacy until the operator saves them once: a note only the operator sees.
        if(isAdmin() && BxDolPage::isLangBlockToReview($aBlock['content']))
            BxDolInformer::getInstance()->add('sys-page-lang-block-review-' . $aBlock['id'], _t('_sys_txt_page_lang_block_review'), BX_INFORMER_ALERT, [
                'action_url' => BX_DOL_URL_STUDIO . 'builder_page.php?type=' . rawurlencode($this->_aObject['module']) . '&page=' . rawurlencode($this->_aObject['object']),
                'action_title' => _t('_sys_txt_page_lang_block_review_action'),
            ]);

        $s = '<div class="bx-page-lang-container bx-def-vanilla-html max-w-none">' . _t(trim($aBlock['content'])) . '</div>';
        $s = $this->_replaceMarkers($s, array('block_id' => $aBlock['id']));
        $s = bx_process_macros($s);
        return $s;
    }

    /**
     * Get content for 'image' block type.
     * @return string
     */
    protected function _getBlockImage ($aBlock)
    {
        if (empty($aBlock['content']))
            return false;

        list($iFileId, $sAlign ) = explode('#', $aBlock['content']);
        $iFileId = (int)$iFileId;
        if (!$iFileId)
            return false;

        $oStorage = BxDolStorage::getObjectInstance(BX_DOL_STORAGE_OBJ_IMAGES);
        if (!$oStorage)
            return false;

        $sUrl = $oStorage->getFileUrlById($iFileId);
        if (!$sUrl)
            return false;

        $sStyleAdd = '';
        $sClassAdd = 'bx-page-image-container';
        $aAlign = ['left' => 'start', 'center' => 'center', 'right' => 'end'];
        if(array_key_exists($sAlign, $aAlign)) {
            $sClassAdd .= ' flex justify-' . $aAlign[$sAlign];

            $sStyleAdd = 'style="text-align:' . $sAlign . '"';
        }

        return '<div class="' . $sClassAdd . '" ' . $sStyleAdd . '><img src="' . $sUrl . '" /></div>';
    }

    /**
     * Get content for 'rss' block type.
     * @return string
     */
    protected function _getBlockRss ($aBlock)
    {
        if (empty($aBlock['content']))
            return false;

        list( $sUrl, $iNum ) = explode('#', $aBlock['content']);
        $iNum = (int)$iNum;

        return BxDolRss::getObjectInstance('sys_page_block')->getHolder($aBlock['id'], $iNum);
    }

    /**
     * Get content for 'menu' block type.
     * @return string
     */
    protected function _getBlockMenu ($aBlock)
    {
        $bIsApi = bx_is_api();

        $oMenu = BxTemplMenu::getObjectInstance($aBlock['content']);
        if(!$oMenu)
            return $bIsApi ? [] : '';

        if($bIsApi) {
            $aMenu = $oMenu->getCodeAPI();

            // A menu without items is no block on the site (BxBaseMenu::getCode gives nothing), so the apps get none either.
            if(empty($aMenu['items']))
                return [];

            return [bx_api_get_block('menu' . ($this->_sObject == 'sys_sub_wiki_pages_list' ? '_wiki' : ''), ['title' => _t($aBlock['title']), 'content' => $aMenu])];
        }

        return $oMenu ? $oMenu->getCode() : '';
    }

    /**
     * Get content for 'service' block type.
     * @return string
     */
    protected function _getBlockService ($aBlock)
    {
        self::setBlockProcessing($aBlock);

        $sContent = $aBlock['content'];
        // get_mockup_block blocks are stored with empty params, so BxDolService's memory cache would
        // hand every such block on the page the same tree; key the call by block id instead.
        // Read and rewritten through the service-call codec: new blocks are stored as JSON, and
        // old serialized ones must never be unserialized with objects allowed.
        $aCall = BxDolService::decodeServiceCall($sContent);
        if (is_array($aCall) && ($aCall['method'] ?? '') === 'get_mockup_block')
            $sContent = BxDolService::getSerializedService($aCall['module'], $aCall['method'], [(int)$aBlock['id']], $aCall['class'] ?? '');

        $aResult = BxDolService::callSerialized($sContent, array_merge($this->_aMarkers, [
            'block_id' => $aBlock['id']
        ]));

        self::unsetBlockProcessing();

        return $aResult;
    }

    /**
     * Get page title.
     * @return string
     */
    protected function _getPageTitle()
    {
        return $this->_replaceMarkers(_t($this->_aObject['title']));
    }

    /**
     * Get page meta description.
     * @return string
     */
    protected function _getPageMetaDesc()
    {
        // A page without a description of its own describes itself with its first text (About, Terms), else it gets the
        // site's default one (Studio > Languages), not an empty one.
        $sResult = $this->_replaceMarkers(_t($this->_aObject['meta_description']));
        if(trim(strip_tags($sResult)) === '')
            $sResult = $this->_getPageMetaDescFromBlocks();
        if(trim(strip_tags($sResult)) === '')
            $sResult = $this->_replaceMarkers(_t('_sys_page_meta_description_default'));

        return $sResult;
    }

    /**
     * The text of the page's first text block (`lang` or `html`) the viewer can see, for a page without a description.
     * @return string HTML, empty when the page has no such block
     */
    protected function _getPageMetaDescFromBlocks()
    {
        foreach($this->_oQuery->getPageTextBlocks(bx_is_api()) as $aBlock) {
            if(!$this->_isVisibleBlock($aBlock))
                continue;

            $sText = $this->_replaceMarkers($aBlock['type'] == 'lang' ? _t(trim($aBlock['content'])) : $aBlock['content']);
            if(trim(strip_tags($sText)) !== '')
                return $sText;
        }

        return '';
    }

    /**
     * Get page meta title.
     * @return string
     */
    protected function _getPageMetaTitle()
    {
        return $this->_replaceMarkers(_t($this->_aObject['meta_title']));
    }
    
    /**
     * Get page meta image: the picture link previews show.
     * @return string image url
     */
    protected function _getPageMetaImage()
    {
        return $this->getMetaImageDefault();
    }

    /**
     * Get page meta type (Open Graph type).
     * @return string 'website', 'article' or 'profile'
     */
    protected function _getPageMetaType()
    {
        return 'website';
    }

    /**
     * Get the meta image of a page which has no image of its own: the page cover (or the common site cover),
     * else the site icon as a small square picture.
     * @return string image url or an empty string
     */
    public function getMetaImageDefault()
    {
        if(($aCover = $this->getPageCoverImage()) && ($sUrl = $this->_getMetaImage($aCover)))
            return $sUrl;

        $aImage = static::getSiteMetaImage();
        if(empty($aImage['url']))
            return '';

        $this->_aMetaImages[$aImage['url']] = ['width' => $aImage['width'], 'height' => $aImage['height'], 'card' => $aImage['card']];
        return $aImage['url'];
    }

    /**
     * The site's picture for link previews, for pages without one of their own and scripts that aren't pages (the
     * splash): an uploaded icon through the biggest (512px) icon transcoder, as Facebook and others show none under
     * 200px, else the uploaded logo (not an SVG, which previews don't show), else the template's own 512px icon, so a
     * shared link always has a picture. Shown small and square.
     * @return array 'url', 'width', 'height' (0 when unknown) and 'card'
     */
    public static function getSiteMetaImage()
    {
        $aResult = false;

        if(($oTranscoder = BxDolTranscoder::getObjectInstance(BX_DOL_TRANSCODER_OBJ_ICON_ANDROID_SPLASH)) !== false)
            foreach(['icon_android_splash', 'icon_android', 'icon_apple'] as $sIcon)
                if(($iIcon = (int)getParam('sys_site_' . $sIcon)) != 0 && ($aResult = $oTranscoder->getFileMetaImage($iIcon)) && !empty($aResult['url']))
                    break;

        if(empty($aResult['url']) && ($iLogo = (int)getParam('sys_site_logo')) != 0 && ($oStorage = BxDolStorage::getObjectInstance('sys_images_custom')) !== false) {
            $aFile = $oStorage->getFile($iLogo);
            if($aFile && !$aFile['private'] && strncmp($aFile['mime_type'], 'image/', 6) === 0 && !$oStorage->isMimeTypeSvg($aFile['mime_type'])) {
                $aSize = !empty($aFile['dimensions']) ? explode('x', $aFile['dimensions']) : [];
                $aResult = ['url' => $oStorage->getFileUrlById($iLogo), 'width' => (int)($aSize[0] ?? 0), 'height' => (int)($aSize[1] ?? 0)];
            }
        }

        if(empty($aResult['url'])) {
            // A real address: the template may inline a small image as a data: URL, which previews can't fetch.
            $sUrl = BxDolTemplate::getInstance()->getIconUrl('android-icon-512.png');
            if(!$sUrl || str_starts_with($sUrl, 'data:'))
                $sUrl = BX_DOL_URL_ROOT . 'template/images/icons/android-icon-512.png';

            $aResult = ['url' => $sUrl, 'width' => 512, 'height' => 512];
        }

        return ['url' => $aResult['url'], 'width' => (int)$aResult['width'], 'height' => (int)$aResult['height'], 'card' => 'summary'];
    }

    /**
     * Get the size and the twitter card of a meta image got with _getMetaImage.
     * @param string $sUrl image url
     * @return array 'width', 'height' (0 when unknown) and 'card', or an empty array for an unknown image
     */
    public function getMetaImageInfo($sUrl)
    {
        return $this->_aMetaImages[$sUrl] ?? [];
    }

    /**
     * Get the url of a page meta image and remember its size and twitter card.
     * The image is a public transcoded copy, never the original upload or a url with a short-lived token.
     * @param array $aImage ['id' => file id, 'transcoder' => transcoder object] or ['id' => file id, 'object' => storage object]
     * @param boolean $bWide a picture of the content (cover, photo) is shown big when its size allows it, otherwise (avatar, icon) small and square
     * @return string image url or an empty string
     */
    protected function _getMetaImage($aImage, $bWide = true)
    {
        if(empty($aImage['id']) || !is_array($aImage))
            return '';

        $aResult = false;
        if(!empty($aImage['transcoder'])) {
            if(($oTranscoder = BxDolTranscoder::getObjectInstance($aImage['transcoder'])) !== false)
                $aResult = $oTranscoder->getFileMetaImage($aImage['id']);
        }
        else if(!empty($aImage['object']) && ($oStorage = BxDolStorage::getObjectInstance($aImage['object'])) !== false) {
            $aFile = $oStorage->getFile($aImage['id']);
            if($aFile && !$aFile['private'] && strncmp($aFile['mime_type'], 'image/', 6) === 0 && !$oStorage->isMimeTypeSvg($aFile['mime_type'])) {
                $aSize = !empty($aFile['dimensions']) ? explode('x', $aFile['dimensions']) : [];
                $aResult = ['url' => $oStorage->getFileUrlById($aImage['id']), 'width' => (int)($aSize[0] ?? 0), 'height' => (int)($aSize[1] ?? 0)];
            }
        }

        if(empty($aResult['url']))
            return '';

        $iWidth = $aResult['width'];
        $iHeight = $aResult['height'];

        // A big picture needs a big landscape image: X crops it to 2:1, WhatsApp takes 4:1 at most.
        $bLarge = $bWide && (!$iWidth || !$iHeight || ($iWidth >= 600 && $iHeight >= 315 && $iWidth >= 1.3 * $iHeight && $iWidth <= 4 * $iHeight));

        $this->_aMetaImages[$aResult['url']] = [
            'width' => $iWidth,
            'height' => $iHeight,
            'card' => $bLarge ? 'summary_large_image' : 'summary',
        ];

        return $aResult['url'];
    }
    
    /**
     * Get page meta keywords.
     * @return string
     */
    protected function _getPageMetaKeywords()
    {
        return $this->_replaceMarkers(_t($this->_aObject['meta_keywords']));
    }

    /**
     * Get page meta robots.
     * @return string
     */
    protected function _getPageMetaRobots()
    {
        return _t($this->_aObject['meta_robots']);
    }

    /**
     * Get page not found message.
     * @return string
     */
    protected function _getPageNotFoundMsg ($mixedMsg = false)
    {
        $this->_oTemplate->displayPageNotFound();
        exit;
    }

    /**
     * Get access denied message.
     * @return string
     */
    protected function _getPageAccessDeniedMsg ($mixedMsg = false)
    {
        $sMsg = is_string($mixedMsg) && $mixedMsg !== '' ? $mixedMsg : _t('_Access denied');

        if (!$this->_bSubPage && !bx_is_api()) {
            if (!headers_sent()) {
                header('HTTP/1.0 403 Forbidden');
                header('Status: 403 Forbidden');
            }

            // The page keeps its name in the title bar; a title with markers would name the content, so it is left out.
            $sTitle = _t($this->_aObject['title']);
            if ($sTitle !== '' && !str_contains($sTitle, '{')) {
                BxDolTemplate::getInstance()->setPageHeader($sTitle);
            }
        }

        // A guest gets the same "Sign in to continue" card as a block that needs an account.
        if (!isLogged() && !BxDolAcl::getDenialState($sMsg)) {
            return DesignBoxContent('', MsgBox(BxDolAcl::getDenialStateByLevel(MEMBERSHIP_ID_NON_MEMBER, _t('_sys_txt_access_denied_guest_page'))), BX_DB_PADDING_NO_CAPTION);
        }

        return MsgBox($sMsg);
    }

    /**
     * Get page cache object.
     * @return cache object instance
     */
    protected function _getPageCacheObject ()
    {
        return $this->_getCacheObject ();
    }

    /**
     * Get block cache object.
     * @return cache object instance
     */
    protected function _getBlockCacheObject ()
    {
        return $this->_getCacheObject ('Block', 'pb');
    }

    protected function _getCacheObject ($sSuffixObj = 'Page', $sSuffixParam = 'page')
    {
        $sObj = '_o' . $sSuffixObj . 'CacheObject';
        $sParam = 'sys_' . $sSuffixParam . '_cache_engine';

        if ($this->{$sObj} != null) {
            return $this->{$sObj};
        } else {
            $sEngine = getParam($sParam);
            $this->{$sObj} = bx_instance ('BxDolCache' . $sEngine);
            if (!$this->{$sObj}->isAvailable())
                $this->{$sObj} = bx_instance ('BxDolCacheFile');
            return $this->{$sObj};
        }
    }

    /**
     * Get page cache key.
     * @param $isPrefixOnly return key prefix only.
     * @return string
     */
    protected function _getPageCacheKey ($isPrefixOnly = false)
    {
        $s = 'page_' . $this->_aObject['object'] . '_';
        if ($isPrefixOnly)
            return $s;
        $s .= $this->_getPageCacheParams ();
        $s .= bx_site_hash() . '.php';
        return $s;
    }

    /**
     * Get block cache key.
     * @param $isPrefixOnly return key prefix only.
     * @return string
     */
    protected function _getBlockCacheKey ($isPrefixOnly = false, $aBlock = array())
    {
        $s = $this->_getPageCacheKey(true) . 'block_';
        if ($isPrefixOnly)
            return $s;
        $s .= ($aBlock ? $aBlock['id'] : 0) . '_' . $this->_getPageCacheParams ();
        $s .= bx_site_hash() . '.php';
        return $s;
    }

    /**
     * Additional cache key. In the case of dynamic page.
     * For example - profile page, where each profile has own page.
     * @return string
     */
    protected function _getPageCacheParams ()
    {
        return md5(serialize($_GET) . bx_lang_name());
    }

    /**
     * Clean page cache.
     * @param $isDelAllWithPagePrefix delete cache by prefix, it can be used for dynamic pages, like profile view, where for each profile separate cache is generated.
     * @return string
     */
    protected function cleanCache ($isDelAllWithPagePrefix = false)
    {
        $a = ['Page', 'Block'];
        $bRet = false;
        foreach ($a as $s) {
            $oCache = $this->{'_get' . $s . 'CacheObject'} ();
            $sKey = $this->{'_get'. $s . 'CacheKey'} ($isDelAllWithPagePrefix);

            if ($isDelAllWithPagePrefix)
                $bRet = $bRet && $oCache->removeAllByPrefix($sKey);
            else
                $bRet = $bRet && $oCache->delData($sKey);
        }
        return $bRet;
    }
}

/** @} */
