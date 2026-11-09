<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

bx_import('BxDolSearch');

class BxBaseSearchResult extends BxDolSearchResult
{
    public $isError;

    protected $oFunctions;

    protected $sBrowseUrl; ///< currect browse url, used for paginate and other links in browsing

    protected $sUnitTemplate = 'unit.html'; ///< common template to try to use for displaying one item
    protected $sUnitTemplateLiveSearch = 'unit_live_search.html'; ///< common template to try to use for displaying live search results

    protected $aGetParams = array(); ///< get params to keep in paginate and other browsing links

    protected $iDesignBoxTemplate = 11; ///< design box ID to wrap result in, or false to disable design box wrapping

    protected $aConstants;

    protected $sCenterContentUnitSelector = false;

    protected $aContainerAttrs = array();
    protected $aContainerClasses = array('bx-search-result-block', 'bx-clearfix');

    protected $aUnitParams = array(); ///< additional params array to pass to unit display function

    function __construct($oFunctions = false)
    {
        parent::__construct();

        if ($oFunctions)
            $this->oFunctions = $oFunctions;
        else
            $this->oFunctions = BxTemplFunctions::getInstance();
    }

    function getMain()
    {
        // override this to return main module class
    }

    function displayResultBlock ()
    {
        $sCode = '';

        $aData = $this->getSearchData();
        if($this->aCurrent['paginate']['num'] > 0) {
            $sCode .= $this->addCustomParts();

            $sUnits = '';
            foreach ($aData as $aValue)
                $sUnits .= $this->displaySearchUnit($aValue);
            $sCode .= $this->wrapSearchUnits($sUnits);

            $sHtmlId = $this->applyContainerId();
            $sClasses = $this->applyContainerClass();

            $sAttributes = '';
            if(is_array($this->aContainerAttrs) && !empty($this->aContainerAttrs))
            	foreach ($this->aContainerAttrs as $sName => $sValue)
                    $sAttributes .= ' ' . $sName . '="' . $sValue . '"';

            $sCode = BxDolTemplate::getInstance()->parseHtmlByName('search_result_block.html', [
                'html_id' => $sHtmlId,
                'class' => $sClasses,
                'attrs' => $sAttributes,
                'content' => $sCode,
                'bx_if:do_center' => [
                    'condition' => !$this->_bLiveSearch && $this->sCenterContentUnitSelector,
                    'content' => [
                        'html_id' => $sHtmlId,
                        'selector_content' => $this->sCenterContentUnitSelector
                    ]
                ]
            ]);
        }

        /**
         * @hooks
         * @hookdef hook-simple_search-show_data 'simple_search', 'show_data' - hook in display block for search
         * - $unit_name - equals `simple_search`
         * - $action - equals `show_data` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [array] by ref, object info for current search, can be overridden in hook processing
         *      - `mode` - [string], search mode
         *      - `search_results` - [string] by ref, html for block, can be overridden in hook processing
         * @hook @ref hook-simple_search-show_data
         */
        bx_alert('simple_search', 'show_data', 0, false, [
            'object' => &$this->aCurrent, 
            'condition_array_ref' => &$this->aCurrent, 
            'mode' => $this->_sMode, 
            'search_results' => &$sCode,
            'search_results_ref' => &$sCode
        ]);

        return $sCode;
    }

    /**
     * Markup around the units inside the results container, e.g. a list for units that are list items.
     * @param string $sUnits units HTML
     * @return string
     */
    protected function wrapSearchUnits ($sUnits)
    {
        return $sUnits;
    }

    function displayResultBlockEmpty ()
    {
        return BxDolTemplate::getInstance()->parseHtmlByName('search_result_block.html', [
            'html_id' => $this->applyContainerId(),
            'class' => 'bx-search-result-block bx-search-result-block-empty',
            'attrs' => '',
            'content' => parent::displayResultBlockEmpty(),
            'bx_if:do_center' => [
                'condition' => false,
                'content' => []
            ]
        ]);
    }

    function displaySearchBox ($sContent, $sPaginate = '')
    {
        $oTemplate = BxDolTemplate::getInstance();

        $sContent = $oTemplate->parseHtmlByName('paginate_block.html', [
            'bx_if:paginate_top' => [
                'condition' => (isset($this->aCurrent['paginate']['on_top']) && $this->aCurrent['paginate']['on_top'] == true) && $sPaginate != '',
                'content' => [
                    'paginate' => $sPaginate
                ],
            ],
            'bx_if:paginate_bottom' => [
                'condition' => (!isset($this->aCurrent['paginate']['on_bottom']) || $this->aCurrent['paginate']['on_bottom'] != false) && $sPaginate != '',
                'content' => [
                    'paginate' => $sPaginate
                ],
            ],
            'content' => $sContent
        ]);

        $sMenu = $this->getDesignBoxMenu();

        if($this->id)
            return $oTemplate->parseHtmlByName('designbox_container.html', [
                'class_add' => ' bx-search-results',
                'bx_if:show_html_id' => [
                    'condition' => true,
                    'content' => [
                        'html_id' => 'bx-page-block-' . $this->id
                    ],
                ],
                'content' => $this->oFunctions->designBoxContent(_t($this->aCurrent['title']), $sContent, $this->iDesignBoxTemplate, $sMenu)
            ]);

        $this->addPageRssLink();

        return [
            'content' => $sContent,
            'menu' => $sMenu,
        ];
    }

    function displaySearchUnit ($aData)
    {
        $oMain = $this->getMain();
        return $oMain->_oTemplate->unit($aData, $this->bProcessPrivateContent, $this->_bLiveSearch ? $this->sUnitTemplateLiveSearch : $this->sUnitTemplate, $this->aUnitParams);
    }

    function setUnitTemplate ($s)
    {
        $this->sUnitTemplate = $s;
    }

    function getDesignBoxMenu ()
    {
        return array();
    }

    protected function addPageRssLink ()
    {
        if (false === ($sLink = $this->getRssPageUrl ()))
            return;

        if (!($oTemplate = BxDolTemplate::getInstance()))
            return;

        $oTemplate->addPageRssLink($this->aCurrent['title'], $sLink);
    }

    function getRssPageUrl ()
    {
        if (!isset($this->aCurrent['rss']) || !$this->aCurrent['rss']['link'])
            return false;

        $oPermalinks = BxDolPermalinks::getInstance();
        return bx_absolute_url(bx_append_url_params($oPermalinks->permalink($this->aCurrent['rss']['link']), 'rss=1'));
    }

    function showAdminActionsPanel($sWrapperId, $aButtons, $sCheckboxName = 'entry', $bSelectAll = true, $bSelectAllChecked = false, $sCustomHtml = '')
    {
        $aBtns = array();
        foreach ($aButtons as $k => $v) {
            if(is_array($v)) {
                $aBtns[] = $v;
                continue;
            }

            $aBtns[] = array(
                'type' => 'submit',
                'name' => $k,
                'value' => '_' == $v[0] ? _t($v) : $v,
                'onclick' => '',
            );
        }

        return BxDolTemplate::getInstance()->parseHtmlByName('adminActionsPanel.html', array(
            'bx_repeat:buttons' => $aBtns,
            'bx_if:custom_html' => array(
                'condition' => strlen($sCustomHtml) > 0,
                'content' => array(
                    'custom_html' => $sCustomHtml,
                )
            ),
            'bx_if:selectAll' => array(
                'condition' => $bSelectAll,
                'content' => array(
                    'wrapper_id' => $sWrapperId,
                    'checkbox_name' => $sCheckboxName,
                    'checked' => ($bSelectAll && $bSelectAllChecked ? 'checked="checked"' : '')
                )
            ),
        ));
    }

    function showAdminFilterPanel($sFilterValue, $sInputId = 'filter_input_id', $sCheckboxId = 'filter_checkbox_id', $sFilterName = 'filter', $sOnApply = '')
    {
        $sFilterValue = bx_html_attribute($sFilterValue);
        $isChecked = $sFilterValue ? ' checked="checked" ' : '';

        if(empty($sOnApply))
            $sOnApply = "on_filter_apply(this, '" . $sInputId . "', '" . $sFilterName . "')";

        return BxDolTemplate::getInstance()->parseHtmlByName('adminFilterPanel.html', array(
            'input_id' => $sInputId,
            'filter_value' => $sFilterValue,
            'checkbox_id' => $sCheckboxId,
            'is_checked' => $isChecked,
            'on_apply' => $sOnApply,
        ));
    }

    function showPagination($bAdmin = false, $bChangePage = true, $bPageReload = true)
    {
        $sOnClick = $this->getCurrentOnclick([], false);

        $aPaginate = [
            'page_url' => $this->getCurrentUrl([], false),
            'on_change_page' => $sOnClick,
            'num' => $this->aCurrent['paginate']['num'],
            'per_page' => $this->aCurrent['paginate']['perPage'],
            'start' => $this->aCurrent['paginate']['start'],
        ];

        if(!empty($this->aCurrent['paginate']['total'])) {
            if(is_numeric($this->aCurrent['paginate']['total']))
                $aPaginate['total'] = (int)$this->aCurrent['paginate']['total'];
            else
                $aPaginate['total'] = $this->getTotal();
        }

        $oPaginate = new BxTemplPaginate($aPaginate);
        return $sOnClick ? $oPaginate->getSimplePaginate() : $oPaginate->getPaginate();
    }

    /**
     * Get current browse URL with current page and additional params
     * @param $aAdditionalParams set custom additional params as key value pair
     * @param $bReplacePagesParams replace paginate params with current values or leave markers for use in paginate class
     * @return ready to use URL string with BX_DOL_URL_ROOT added in the beginning
     */
    protected function getCurrentUrl($aAdditionalParams = array(), $bReplacePagesParams = true)
    {
        if (BX_DOL_SEARCH_KEYWORD_PAGE === $this->sBrowseUrl || $this->bForceAjaxPaginate)
            return 'javascript:void(0);';

        $oPermalinks = BxDolPermalinks::getInstance();

        $sUrlStart = bx_absolute_url($oPermalinks->permalink($this->sBrowseUrl));

        return $this->addAdditionalUrlParams($sUrlStart, $aAdditionalParams, $bReplacePagesParams);
    }

    /**
     * Get current browse URL with current page and additional params
     * @param $aAdditionalParams set custom additional params as key value pair
     * @param $bReplacePagesParams replace paginate params with current values or leave markers for use in paginate class
     * @return ready to use URL string with BX_DOL_URL_ROOT added in the beginning
     */
    protected function getCurrentOnclick($aAdditionalParams = array(), $bReplacePagesParams = true)
    {
        if (BX_DOL_SEARCH_KEYWORD_PAGE !== $this->sBrowseUrl && !$this->bForceAjaxPaginate)
            return '';

        if (BX_DOL_SEARCH_KEYWORD_PAGE === $this->sBrowseUrl) {

            $sLoadDynamicUrl = BX_DOL_URL_ROOT . 'searchKeywordContent.php?searchMode=ajax&section[]=' . rawurlencode($this->aCurrent['name']) . ($this->_sCategoryObject ? '&cat=' . rawurlencode($this->_sCategoryObject) : '');
            $sLoadDynamicUrl = $this->addAdditionalUrlParams($sLoadDynamicUrl, $aAdditionalParams, $bReplacePagesParams);

            $sKeyword = bx_get('keyword');
            if ($sKeyword !== false && mb_strlen($sKeyword) > 0)
                $sLoadDynamicUrl = bx_append_url_params($sLoadDynamicUrl, 'keyword=' . rawurlencode($sKeyword));

            return "return !loadDynamicBlockAuto(this, '{$sLoadDynamicUrl}');";

        } else {
            
            return "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}', " . (empty($aAdditionalParams) ? 'undefined' : "'" . trim($this->addAdditionalUrlParams('', $aAdditionalParams, false, false), '&?') . "'") . ");"; 

        }
    }

    protected function addAdditionalUrlParams($sUrl, $aAdditionalParams, $bReplacePagesParams, $bAddPaginateParams = true)
    {
        if ($bAddPaginateParams) { // add pages params
            $sUrl = bx_append_url_params($sUrl, array (
                'type' => $this->_sMetaType,
                'start' => $bReplacePagesParams ? (int)$this->aCurrent['paginate']['start'] : '{start}',
                'per_page' => $bReplacePagesParams ? (int)$this->aCurrent['paginate']['perPage'] : '{per_page}',
            ), false);
        }

        foreach ($this->aGetParams as $sGetParam) {
            $sValue = false;
            if (isset($aAdditionalParams[$sGetParam]))
                $sValue = $aAdditionalParams[$sGetParam];
            elseif (false !== bx_get($sGetParam))
                $sValue = bx_get($sGetParam);
            if (false !== $sValue)
                $sUrl = bx_append_url_params($sUrl, $sGetParam . '=' . rawurlencode($sValue));
        }

        return $sUrl;
    }

    function clearFilters ($aPassParams = array(), $aPassJoins = array())
    {
        //clear sorting
        $this->aCurrent['sorting'] = 'last';

        //clear restrictions
        foreach ($this->aCurrent['restriction'] as $sKey => $aValue) {
            if (!in_array($sKey, $aPassParams))
                $this->aCurrent['restriction'][$sKey]['value'] = '';
        }

        //clear unnecessary joins (remains only profile join)
        $aPassJoins[] = 'profile';
        $aTemp = array();
        foreach ($aPassJoins as $sValue) {
            if (isset($this->aCurrent['join'][$sValue]) && is_array($this->aCurrent['join'][$sValue]))
                $aTemp[$sValue] = $this->aCurrent['join'][$sValue];
        }
        $this->aCurrent['join'] = $aTemp;
    }

    function fillFilters ($aParams)
    {
        // transform all given values to fields values
        if (is_array($aParams)) {
            foreach ($aParams as $sKey => $mixedValue) {
                if (isset($this->aCurrent['restriction'][$sKey]))
                    $this->aCurrent['restriction'][$sKey]['value'] = $mixedValue;
            }
        }
    }
    
    function fillFiltersByObjects ($aParams)
    {
        // transform all given values to fields values
        if (is_array($aParams)) {
            foreach ($aParams as $sKey => $mixedValue) {
                $this->aCurrent['restriction'][$sKey] = $mixedValue;
            }
        }
    }

    /**
     * Set design box template id to use to wrap search results in
     */
    function setDesignBoxTemplateId ($i)
    {
        $this->iDesignBoxTemplate = $i;
    }

    /**
     * Set unit class selector for content centering 
     */
    function setCenterContentUnitSelector ($s)
    {
        $this->sCenterContentUnitSelector = $s;
    }

    /**
     * Add ID to search result container 
     * @param $string HTML ID
     */
    function applyContainerId()
    {
        return 'bx-search-result-block-' . rand(0, PHP_INT_MAX);
    }

    /**
     * Add class to search result container 
     * @param $mixed CSS class name string or array of classes
     */
    function addContainerClass ($mixed)
    {
        if (!is_array($mixed))
            $mixed = array($mixed);

        foreach ($mixed as $s)
            if (false === array_search($s, $this->aContainerClasses))
                $this->aContainerClasses[] = $s;
    }

    /**
     * Remove class from search result container 
     * @param $mixed CSS class name string or array of classes
     */
    function removeContainerClass ($mixed)
    {
        if (!is_array($mixed))
            $mixed = array($mixed);

        foreach ($mixed as $s)
            if (false !== ($i = array_search($s, $this->aContainerClasses)))
                unset($this->aContainerClasses[$i]);
    }

    /**
     * Apply class(es) for search result container 
     * @return string with a list of classes.
     */
    function applyContainerClass ()
    {
        $sModule = $this->getMain() ? $this->getMain()->getName() : 'sys';
        return implode(' ', $this->aContainerClasses) . ' '. str_replace('_', '-', $sModule) . '-wrapper';
    }

    /**
     * Add attribute(s) to search result container 
     * @param $aAttributes an array of Key -> Value pair(s).
     */
    function addContainerAttribute ($aAttributes)
    {
    	if(empty($aAttributes) || !is_array($aAttributes))
    		return;

    	$this->aContainerAttrs = array_merge($this->aContainerAttrs, $aAttributes);
    }

	/**
     * Remove attribute(s) from search result container 
     * @param $mixedName attribute name or an array of names
     */
    function removeContainerAttribute ($mixedName)
    {
        if(!is_array($mixedName))
            $mixedName = array($mixedName);

		$this->aContainerAttrs = array_diff_assoc($this->aContainerAttrs, array_flip($mixedName));
    }

    public function setUnitParams ($aParamsAdd = array(), $aParamsRemove = array())
    {
        if ($aParamsAdd)
            $this->aUnitParams = array_merge($this->aUnitParams, $aParamsAdd);
        if ($aParamsRemove)
            $this->aUnitParams = array_diff_key($this->aUnitParams, $aParamsRemove);
    }
}

/** @} */
