<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Services for Wiki functionality
 */
class BxBaseServiceWiki extends BxDol
{
    protected $_bIsApi;
    protected $_bJsCssAdded = false;

    public function __construct()
    {
        parent::__construct();

        $this->_bIsApi = bx_is_api();
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-wiki_page wiki_page
     * 
     * @code bx_srv('system', 'wiki_page', ["index"], 'TemplServiceWiki'); @endcode
     * @code {{~system:wiki_page:TemplServiceWiki["index"]~}} @endcode
     * 
     * Display WIKI page.
     * @param $sUri categories object name
     * 
     * @see BxBaseServiceWiki::serviceWikiPage
     */
    /** 
     * @ref bx_system_general-wiki_page "wiki_page"
     */
    public function serviceWikiPage ($sWikiObjectUri, $sUri)
    {
        $oWiki = BxDolWiki::getObjectInstanceByUri($sWikiObjectUri);
        if(!$oWiki) {
            if($this->_bIsApi)
                return null;

            BxDolTemplate::getInstance()->displayPageNotFound();
        }

        $oPage = BxDolPage::getObjectInstanceByModuleAndURI($oWiki->getObjectName(), $sUri);
        if($oPage) {
            $_GET['i'] = $sUri;

            if($this->_bIsApi)
                return $oPage;

            $oPage->displayPage();
        } 
        else {
            if($oWiki->isAllowed('add-page')) {
                if(($oPage = BxDolPage::getObjectInstanceByURI($sUri)) !== false) {
                    if($this->_bIsApi) {
                        $aPage = $oPage->getObject();
                        if(($sUrl = $aPage['url'] ?? false))
                            return bx_api_get_relative_url(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink($aPage['url']));
                        else
                            return null;
                    }

                    BxDolTemplate::getInstance()->displayErrorOccured(_t("_sys_wiki_error_page_exists", bx_process_output($sUri)));
                } 
                else {
                    $oPage = BxDolPage::getObjectInstance('sys_wiki_add_page');
                    if(!$oPage)
                        return $this->_bIsApi ? null : BxDolTemplate::getInstance()->displayPageNotFound();

                    $oPage->addMarkers([
                        'object' => $oWiki->getObjectName(),
                        'uri' => $sUri
                    ]);

                    if($this->_bIsApi)
                        return $oPage;

                    $this->_addCssJs(true);
                    $oPage->displayPage();
                }
            }
            else {
                if($this->_bIsApi)
                    return null;

                BxDolTemplate::getInstance()->displayPageNotFound();
            }
        }
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-wiki_add_page wiki_add_page
     * 
     * @code bx_srv('system', 'wiki_add_page', [...], 'TemplServiceWiki'); @endcode
     * 
     * Display add WIKI page.
     * @param $sObject wiki object name
     * @param $sUri new page URI
     * 
     * @see BxBaseServiceWiki::serviceWikiAddPage
     */
    /** 
     * @ref bx_system_general-wiki_add_page "wiki_add_page"
     */
    public function serviceWikiAddPage ($sObject, $sUri)
    {
        $oWiki = BxDolWiki::getObjectInstance($sObject);
        if(!$oWiki)
            return $this->_bIsApi ? [] : '';

        $sTitle = _t('_sys_wiki_add_page');
        $sText = _t('_sys_wiki_add_page_text');
        
        if($this->_bIsApi)
            return [bx_api_get_block('wiki_add_page', [
                'title' => $sTitle,
                'text' => $sText,
                'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $oWiki->getUri() . '&params[]=add-page&params[]=' . $sUri
            ])];

        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_create_page.html', [
            'page_uri' => bx_process_output($sUri),
            'action_uri' => $oWiki->getUri(),
            'create_page' => $sTitle,
            'text' => $sText,
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-wiki_action wiki_action
     * 
     * @code bx_srv('system', 'wiki_action', [...], 'TemplServiceWiki'); @endcode
     * 
     * Perform WIKI action.
     * @param $sWikiObjectUri wiki object URI
     * 
     * @see BxBaseServiceWiki::serviceWikiAction
     */
    /** 
     * @ref bx_system_general-wiki_action "wiki_action"
     */
    public function serviceWikiAction ($sWikiObjectUri, $sAction)
    {
        $oWiki = BxDolWiki::getObjectInstanceByUri($sWikiObjectUri);
        if(!$oWiki)
            return ($sMsg = _t('_sys_wiki_error_missing_wiki_object', $sWikiObjectUri)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 1]])] : echoJson(['code' => 1, 'actions' => 'ShowMsg', 'msg' => $sMsg]);

        $sMethod = 'action' . bx_gen_method_name($sAction, array('-'));
        if(!method_exists($oWiki, $sMethod) || !$oWiki->isAllowed($sAction))
            return ($sMsg = _t('_sys_wiki_error_action_not_allowed', $sAction, $sWikiObjectUri)) && $this->_bIsApi ? [bx_api_get_msg($sMsg, ['ext' => ['code' => 2]])] : echoJson(['code' => 2, 'actions' => 'ShowMsg', 'msg' => $sMsg]);

        $mixed = call_user_func_array([$oWiki, $sMethod], array_slice(func_get_args(), 2));
        if($this->_bIsApi)
            return $mixed;

        if(is_array($mixed))
            echoJson($mixed);
        else
            echo $mixed;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-wiki_controls wiki_controls
     * 
     * Get wiki block controls panel
     * 
     * @see BxBaseServiceWiki::serviceWikiControls
     */
    /** 
     * @ref bx_system_general-wiki_controls "wiki_controls"
     */
    public function serviceWikiControls ($oWikiObject, $aWikiVer, $aWikiVerLatest, $iBlockId)
    {
        $this->_addCssJs();

        $sObject = $oWikiObject->getObjectName();
        $bAllowedManage = $oWikiObject->isAllowed('history');

        $mixedInfo = '';
        if($aWikiVer && $aWikiVerLatest['revision'] == $aWikiVer['revision']) {
            $mixedInfo = $this->_bIsApi ? [
                'added' => $aWikiVer['added']
            ] : bx_time_js($aWikiVer['added']);
        } 
        else if($aWikiVer) {
            $oProfile = BxDolProfile::getInstanceMagic($aWikiVer['profile_id']);

            $mixedInfo = $this->_bIsApi ? [
                'revision' => $aWikiVer['revision'],
                'author_data' => BxDolProfile::getData($aWikiVer['profile_id']),
                'added' => $aWikiVer['added']
            ] : _t('_sys_wiki_view_rev', $aWikiVer['revision'], $oProfile->getUrl(), $oProfile->getDisplayName(), bx_time_js($aWikiVer['added']));
        }

        if($this->_bIsApi) {
            $mixedMenu = '';
            if($bAllowedManage) {
                $oMenu = BxTemplMenu::getObjectInstance('sys_wiki');
                $oMenu->setParams($sObject, $iBlockId);

                $mixedMenu = $oMenu->getCodeAPI();
            }

            return [
                'info' => $mixedInfo,
                'menu' => $mixedMenu
            ];
        }

        $o = BxDolTemplate::getInstance();
        $o->addJs('stackedit.js/stackedit.min.js');
        return $o->parseHtmlByName('wiki_controls.html', [
            'obj' => $sObject,
            'block_id' => $iBlockId,
            'info' => $mixedInfo,
            'options' => json_encode([
                'block_id' => $iBlockId,
                'language' => isset($aWikiVer['language']) ? $aWikiVer['language'] : bx_lang_name(),
                'wiki_action_uri' => $oWikiObject->getUri(),
                't_confirm_block_deletion' => _t('_sys_wiki_confirm_block_deletion'),
            ]),
            'bx_if:menu' => [
                'condition' => $bAllowedManage,
                'content' => [
                    'obj' => $sObject,
                    'block_id' => $iBlockId,
                ],
            ],
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-wiki_add_block wiki_add_block
     * 
     * Get "add wiki block" panel
     * 
     * @see BxBaseServiceWiki::serviceWikiAddBlock
     */
    /** 
     * @ref bx_system_general-wiki_add_block "wiki_add_block"
     */
    public function serviceWikiAddBlock ($oWikiObject, $sPageObject, $sCellId)
    {
        $this->_addCssJs();

        $aMatches = [];
        if(!preg_match("/cell_(\d+)/", $sCellId, $aMatches))
            return '';

        $iCellId = $aMatches[1];
        $sTxtAddBlock = _t('_sys_wiki_add_block');

        if($this->_bIsApi) {
            $sUri = $oWikiObject->getUri();

            return [
                'id' => $sUri . '_add_block',
                'module' => $oWikiObject->getModule(),
                'title' => '',
                'description' => '',
                'icon' => '',
                'designbox_id' => 0,
                'hidden_on' => false,
                'content' => [bx_api_get_block('wiki_add_block', [
                    'title' => $sTxtAddBlock, 
                    'request_url' => 'system/wiki_action/TemplServiceWiki&params[]=' . $sUri . '&params[]=add&params[]=' . $sPageObject . '&params[]=' . $iCellId
                ])],
                'content_empty' => '',
                'config_api' => '',
                'menu' => '',
                'source' => 'system:block_' . $sUri . '_add_block'
            ];
        }

        return BxDolTemplate::getInstance()->parseHtmlByName('wiki_add_block.html', [
            'add_block' => $sTxtAddBlock,
            'page' => $sPageObject,
            'cell_id' => $iCellId,
            'action_uri' => $oWikiObject->getUri(),
        ]);
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-get_design_boxes get_design_boxes
     * 
     * Get "design boxes" array
     * 
     * @see BxBaseServiceWiki::serviceGetDesignBoxes
     */
    /** 
     * @ref bx_system_general-get_design_boxes "get_design_boxes"
     */
    public function serviceGetDesignBoxes ()
    {
        $o = new BxDolStudioBuilderPageQuery();
        $aItems = array();
        if (!$o->getDesignBoxes(array('type' => 'all'), $aItems, false))
            return array();
        $a = array();
        foreach($aItems as $r)
            $a[$r['id']] = _t($r['title']);
        return $a;
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-pages_list pages_list
     * 
     * Get list of pages in current module
     * 
     * @see BxBaseServiceWiki::servicePagesList
     */
    /** 
     * @ref bx_system_general-pages_list "pages_list"
     */
    public function servicePagesList ()
    {
        if (!($sPageObject = BxDolPageQuery::getPageObjectNameByURI(bx_get('i'))))
            return '';
        if (!($aPage = BxDolPageQuery::getPageObject ($sPageObject)))
            return '';
        if (!($oWiki = BxDolWiki::getObjectInstance($aPage['module'])))
            return '';

        BxDolTemplate::getInstance()->addCss(['wiki.css']);

        return $oWiki->getContents();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-wiki Wiki
     * @subsubsection bx_system_general-page_contents page_contents
     * 
     * Get table of contents for current page, generated automatically from paragraphs headers
     * 
     * @see BxBaseServiceWiki::servicePageContents
     */
    /** 
     * @ref bx_system_general-page_contents "page_contents"
     */
    public function servicePageContents ()
    {
        $o = BxDolTemplate::getInstance();
        $o->addJs('toc.js');
        return $o->parseHtmlByName('wiki_page_contents.html', []);
    }

    protected function _addCssJs ($bAddPage = false)
    {
        if ($this->_bJsCssAdded)
            return false;

        $o = BxDolTemplate::getInstance();
        $o->addCss(['wiki.css']);
        $o->addJs('BxDolWiki.js');
        $o->addJsTranslation('_sys_wiki_external_editor_references_comment');
        if ($bAddPage)
            $o->addJs('studio/js/|forms.js');
        $this->_bJsCssAdded = true;
    }
}

/** @} */
