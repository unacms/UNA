<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * Extended Search objects representation.
 * 
 * @see BxDolSearchExtended
 */
class BxBaseSearchExtended extends BxDolSearchExtended
{
    protected $_sFormClassName;
    protected $_sFormClassPath;

    protected $_oForm;
    protected $_oTemplate;

    protected $_bJsMode;

    protected $_iAgeMin;
    protected $_iAgeMax;

    public function __construct ($aObject, $oTemplate = null)
    {
        parent::__construct ($aObject);

        if ($oTemplate)
            $this->_oTemplate = $oTemplate;
        else if(!empty($this->_aObject['module']))
            $this->_oTemplate = BxDolModule::getInstance($this->_aObject['module'])->_oTemplate;
        else 
            $this->_oTemplate = BxDolTemplate::getInstance();

        $this->_sFormClassName = '';
        $this->_sFormClassPath = '';

        $this->_oForm = null;

        $this->_bJsMode = false;

        $this->_iAgeMin = 1;
        $this->_iAgeMax = 75;
    }

    public function getForm($aParams = [])
    {
        if(!$this->isEnabled())
            return '';

        $oForm = $this->prepareForm($aParams);
        if(!$this->_bIsApi) 
            return $oForm->getCode();

        $sParams = $this->_aObject['module'];
        if(($sK = 'context_id') && ($iContextId = $aParams[$sK] ?? false))
            $sParams = json_encode(['object' => $this->_aObject['module'], $sK => $iContextId]);

        return [bx_api_get_block('form', $oForm->getCodeAPI(), [
            'id' => 2, 
            'ext' => [
                'name' => $this->_aObject['module'] . '_serach', 
                'request' => ['url' => '/api.php?r=system/get_form/TemplSearchExtendedServices&params[]=' . $sParams, 'immutable' => true]
            ]
        ])];
    }
    
    /**
     * Get search results from search form or from custom condition
     *
     * @param $aParams['cond'] custom condition to pass instead of form submission, 
     *        conditions are key&value pair, where 'key' is form input name and 
     *        'value' is the term to search for
     * @param $aParams['start'] position of first record to display 
     * @param $aParams['per_page'] number of items per page
     * @param $aParams['template'] custom unit templates to use
     * @return HTML string with search results
     */ 
    public function getResults($aParams = array())
    {
        if(!$this->isEnabled())
            return '';

        $bJsMode = isset($aParams['js_mode']) ? (bool)$aParams['js_mode'] : $this->_bJsMode;
        $bCondition = !empty($aParams['cond']) && is_array($aParams['cond']);

        $iStart = !empty($aParams['start']) ? (int)$aParams['start'] : 0;
        $iPerPage = !empty($aParams['per_page']) ? (int)$aParams['per_page'] : (int)getParam('sys_per_page_search_extended');
        if(!$iPerPage) {
            bx_import('BxDolSearch');
            $iPerPage = BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT;
        }
        unset($aParams['start'], $aParams['per_page']);

        $sUnitTemplate = !empty($aParams['template']) ? $aParams['template'] : '';

        $oForm = $this->prepareForm($aParams);
        if($bCondition) {
            $mixedSubmitName = $oForm->aParams['db']['submit_name'];
            if(is_array($mixedSubmitName))
                $mixedSubmitName = array_pop($mixedSubmitName);
            $aParams['cond'][$mixedSubmitName] = 1;

            $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
            $oForm->aParams['csrf']['disable'] = true;

            $oForm->initChecker([], $aParams['cond']);
        }

        if($this->_bFilterMode && ($iContextId = $aParams['context_id'] ?? false))
            $oForm->setSubmittedValue('allow_view_to', -$iContextId, $oForm->aFormAttrs['method']);

        if(!$oForm->isSubmittedAndValid() && !$this->_bFilterMode  && (!$this->_bIsApi || !isset($aParams['search_params'])))
            return $this->_bIsApi ? [$this->getResultsAPI([], $iStart, $iPerPage)] : '';

        $oContentInfo = BxDolContentInfo::getObjectInstance($this->_aObject['object_content_info']);
        if(!$oContentInfo)
            return $this->_bIsApi ? [$this->getResultsAPI([], $iStart, $iPerPage)] : '';

        $aParamsSearch = [];
        if($this->_bIsApi && ($sK = 'search_params') && !empty($aParams[$sK]) && is_array($aParams[$sK]))
            $aParamsSearch = $aParams[$sK];

        foreach($this->_aObject['fields'] as $aField) {
            $mixedValue = $oForm->getCleanValue($aField['name']);
            if(empty($mixedValue) || (is_array($mixedValue) && bx_is_empty_array($mixedValue)))
                continue;

            $aParamsSearch[$aField['name']] = [
                'type' => $aField['search_type'],
                'value' => $mixedValue,
                'operator' => $aField['search_operator']
            ];

            if(!$bCondition) {
                if(!isset($aParams['cond']))
                    $aParams['cond'] = array();

                switch($oForm->aInputs[$aField['name']]['type']) {
                    case 'location':
                    case 'location_radius':
                        $aParams['cond'][$aField['name']] = $mixedValue['string'];

                        $aLocationComponents = BxDolMetatags::locationsParseComponents($mixedValue['array'], $aField['name']);
                        if($oForm->aInputs[$aField['name']]['type'] == 'location_radius' && count($mixedValue['array']) > count($aLocationComponents))
                            $aLocationComponents[$aField['name'] . '_rad'] = array_pop($mixedValue['array']);

                        $aParams['cond'] = array_merge($aParams['cond'], $aLocationComponents);
                        break;

                    default:
                        $aParams['cond'][$aField['name']] = $mixedValue;
                }
            }
        }

        if((empty($aParamsSearch) || !is_array($aParamsSearch)) && !$this->_bFilterMode)
            return $this->_bIsApi ? [$this->getResultsAPI([], $iStart, $iPerPage, $aParamsSearch)] : '';

        if(($mixedSort = bx_get('sort')) !== false && ($aSort = explode(':', $mixedSort)))
            $aParamsSearch['order'] = [['field' => $aSort[0], 'direction' => $aSort[1]]];

        $aResults = false;

        /**
         * @hooks
         * @hookdef hook-search-get_data 'search', 'get_data' - hook in get data for serach
         * - $unit_name - equals `search`
         * - $action - equals `get_data` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `object` - [array] by ref, object info for current search, can be overridden in hook processing
         *      - `search_params` - [string] by ref, search params, can be overridden in hook processing
         *      - `search_results` - [string] by ref, html for block, can be overridden in hook processing
         * @hook @ref hook-search-get_data
         */
        bx_alert('search', 'get_data', 0, false, [
            'object' => $this->_aObject, 

            'search_params' => &$aParamsSearch, 
            'search_results' => &$aResults,

            'search_params_ref' => &$aParamsSearch, 
            'search_results_ref' => &$aResults,
        ]);

    	if($aResults === false)
    	    $aResults = $oContentInfo->getSearchResultExtended($aParamsSearch, $iStart, $iPerPage + 1, $this->_bFilterMode);

        if(empty($aResults) || !is_array($aResults))
            return $this->_bIsApi ? [$this->getResultsAPI([], $iStart, $iPerPage, $aParamsSearch)] : _t('Nothing found');

        $iResults = count($aResults);
        if($iResults > $iPerPage)
            array_pop($aResults);

        $mixedResults = $this->_bIsApi ? [] : '';
    	foreach($aResults as $iId) {
            $mixedResult = $oContentInfo->getContentSearchResultUnit($iId, $sUnitTemplate);

            if($this->_bIsApi)
                $mixedResults[] = $mixedResult;
            else
                $mixedResults .= $mixedResult;
        }

        if($this->_bIsApi)
            return [$this->getResultsAPI($mixedResults, $iStart, $iPerPage, $aParamsSearch)];

        //-- Paginate
        $bTmplVarsPaginate = false;
        $aTmplVarsPaginate = [];
        if(($bTmplVarsPaginate = $iStart || $iResults > $iPerPage) !== false) {
            if(!empty($aParams['cond']) && is_array($aParams['cond']))
                $aParams['cond'] = self::encodeConditions($aParams['cond']);

            $aPaginate = ['num' => $iResults, 'start' => $iStart, 'per_page' => $iPerPage];
            if(($sKt = 'total') && ($mixedTotal = $aParams[$sKt] ?? false)) {
                if(is_numeric($mixedTotal))
                    $aPaginate[$sKt] = (int)$mixedTotal;
                else
                    $aPaginate[$sKt] = count($oContentInfo->getSearchResultExtended($aParamsSearch, 0, 0, $this->_bFilterMode));
            }

            if(!$bJsMode) {
                $aParams['start'] = '{start}';
                $aParams['per_page'] = '{per_page}';

                list($sPageLink, $aPageParams) = bx_get_base_url_inline($aParams);
                $aPaginate['page_url'] = BxDolPermalinks::getInstance()->permalink(bx_append_url_params($sPageLink, $aPageParams, true, ['{start}', '{per_page}']));
            }
            else
                $aPaginate['on_change_page'] = "return !loadDynamicBlockAutoPaginate(this, '{start}', '{per_page}', " . bx_js_string(json_encode($aParams)) . ");"; 

            $oPaginate = new BxTemplPaginate($aPaginate);
            $aTmplVarsPaginate = [
                'paginate' => $oPaginate->getSimplePaginate()
            ];
        }

        return $this->_oTemplate->parseHtmlByName('search_extended_results.html', [
            'class' => str_replace('_', '-', $this->_sObject),
            'sort' => $mixedResults != '' ? $this->getSorting($aParams) : '',
            'code' => $mixedResults,
            'bx_if:show_paginate' => [
                'condition' => $bTmplVarsPaginate,
                'content' => $aTmplVarsPaginate
            ]
        ]);
    }

    public function getResultsAPI($aData, $iStart, $iPerPage, $aParamsSearch = '')
    {
        return bx_api_get_block('browse', [
            'nocache' => true,
            'module' => $this->_aObject['module'],
            'unit' => 'general-content-list',
            'request_url' => '/api.php?r=system/get_results/TemplSearchExtendedServices&params[]=',
            'data' =>  defined('BX_API_PAGE') ? [] : $aData,
            'params' => ['per_page' => $iPerPage, 'start' => $iStart, 'object' => $this->_aObject['module'], 'search_params' => $aParamsSearch],
        ]);
    }

    public function getSorting($aParams = [])
    {
        if(!$this->isEnabled())
            return '';

        $aTxtDirection = [
            'asc' => _t('_order_asc'),
            'desc' => _t('_order_desc')
        ];

        $bJsMode = isset($aParams['js_mode']) ? (bool)$aParams['js_mode'] : $this->_bJsMode;        

        $aValues = [];
        foreach($this->_aObject['sortable_fields'] as $aField) {
            if($aField['active'] == 0)
                continue;

            $sLangKey = $aField['caption'] . '_' . $aField['direction'];
            $sLangVal = _t($sLangKey);

            $aValues[] = [
                'key' => $aField['name'] . ':' . $aField['direction'],
                'value' => strcmp($sLangKey, $sLangVal) != 0 ? $sLangVal : _t($aField['caption']) . ' ' . $aTxtDirection[$aField['direction']]
            ];
        }

        if(!empty($aValues))
            $aValues = array_merge([['key' => '', 'value' => _t('_sys_txt_search_sort_by_default')]], $aValues);

        if($this->_bIsApi)
            return $this->getSortingAPI($aValues);

        $oForm = new BxTemplFormView([]);

        $sOnChange = '';
        if(!$bJsMode) {
            unset($aParams['start'], $aParams['per_page']);
            list($sPageLink, $aPageParams) = bx_get_base_url_inline($aParams);
            $sOnChange = "bx_search_extnded_sort(this,'" . BxDolPermalinks::getInstance()->permalink(bx_append_url_params($sPageLink, $aPageParams)) . "')";
        }
        else
            $sOnChange = "return !loadDynamicBlockAutoSort(this, $(this).val()," . bx_js_string(json_encode($aParams)) . ");";

        $sSort = '';
        if(!empty($aValues)) {
            $aInputSort = [
                'type' => 'select',
                'name' => 'sort',
                'value' =>  bx_get('sort') ? bx_get('sort') : '',
                'values' => $aValues,
                'caption' => _t('_sys_txt_search_sort_by'),
                'attrs' => [
                    'onChange' => $sOnChange,
                ],
                'tr_attrs' => [
                    'class' => 'sort'
                ]
            ];

            $sSort = $oForm->genRow($aInputSort);
        }

        return $sSort;
    }

    public function getSortingAPI($aData)
    {
        return bx_api_get_block('sorting', [
            'nocache' => true,
            'module' => $this->_aObject['module'],
            'data' => $aData
        ]);
    }

    protected function &prepareForm($aParams = [])
    {
        if(!empty($this->_oForm) && $this->_oForm instanceof BxDolForm)
            return $this->_oForm;

        $iContextId = (int)($aParams['context_id'] ?? 0);
        $sContextIdParam = $aParams['context_id_param'] ?? 'profile_id';

        $sForm = 'sys_search_extended_' . $this->_sObject;
        $sFormSubmit = 'search' . $this->_sObject;

        list($sPageLink, $aPageParams) = bx_get_base_url_inline();

        $sAction = !empty($aPageParams['i']) ? BxDolPermalinks::getInstance()->permalink(bx_append_url_params($sPageLink, ['i' => $aPageParams['i']])) : $sPageLink;
        if($iContextId)
            $sAction = bx_append_url_params($sAction, [$sContextIdParam => $iContextId]);

        $mDefValues = bx_get('filters');
        if($mDefValues)
            $mDefValues = json_decode($mDefValues, true);

        $aForm = array(
            'form_attrs' => array(
                'id' => $sForm,
                'name' => $sForm,
                'action' => $sAction,
                'method' => 'post'
            ),
            'params' => array(
                'db' => array(
                    'table' => '',
                    'key' => '',
                    'uri' => '',
                    'uri_title' => '',
                    'submit_name' => $sFormSubmit
                ),
                'checker_helper' => 'BxBaseSearchExtendedFormCheckerHelper',
            ),
            'inputs' => array()
        );

        foreach ($this->_aObject['fields'] as $aField) {
            if((int)$aField['active'] == 0)
                continue;

            if(in_array($aField['search_type'], array('checkbox_set', 'select_multiple'))) {
                if(isset($aField['values']['']))
                    unset($aField['values']['']);

                if(isset($aField['values'][0]) && !is_array($aField['values'][0]))
                    unset($aField['values'][0]);
            }

            $aAttrs = array();

            if(in_array($aField['search_type'], array('datepicker_range_age')) && !empty($aField['search_value'])) {
                $aFieldParams = BxDolService::callSerialized($aField['search_value']);
                $iMin = isset($aFieldParams['min']) && is_numeric($aFieldParams['min']) ? $aFieldParams['min'] : $this->_iAgeMin;
                $iMax = isset($aFieldParams['max']) && is_numeric($aFieldParams['max']) ? $aFieldParams['max'] : $this->_iAgeMax;

                $aField['search_value'] = $iMin . '-' . $iMax;
                $aAttrs = array('min' => $iMin, 'max' => $iMax, 'step' => 1);
            }

            if(in_array($aField['search_type'], array('datepicker_range')) && !empty($aField['search_value'])) {
                $aField['search_value'] = '';
            }

            $aForm['inputs'][$aField['name']] = array(
                'type' => $aField['search_type'],
                'name' => $aField['name'],
                'caption' => _t($aField['caption']),
            	'info' => _t($aField['info']),
                'values' => $aField['values'],
                'value' => $aField['search_value'] == '' && isset($mDefValues) && isset($mDefValues[$aField['name']]) ? $mDefValues[$aField['name']] : $aField['search_value'],
                'attrs' => $aAttrs,
                'db' => array(
                    'pass' => 'datepicker_range_age' === $aField['search_type'] ? 'AgeRange' : (!empty($aField['pass']) ? $aField['pass'] : 'Xss')
                )
            );

            if(in_array($aField['search_type'], array('location', 'location_radius')))
                $aForm['inputs'][$aField['name']]['manual_input'] = true;
        }

        if($iContextId && isset($aForm['inputs']['allow_view_to']))
            $aForm['inputs']['allow_view_to'] = array_merge($aForm['inputs']['allow_view_to'], [
                'type' => 'hidden',
                'value' => -$iContextId
            ]);

        $aForm['inputs']['search'] = [
            'type' => 'submit',
            'name' => $sFormSubmit,
            'value' => _t($this->_bFilterMode ? '_Apply' : '_Search')
        ];

        $sClass = 'BxTemplSearchExtendedForm';
        if(!empty($this->_sFormClassName)) {
            $sClass = $this->_sFormClassName;
            if(!empty($this->_sFormClassPath))
                require_once(BX_DIRECTORY_PATH_ROOT . $this->_sFormClassPath);
        }

        $bJsMode = isset($aParams['js_mode']) ? (bool)$aParams['js_mode'] : $this->_bJsMode;
        $bCondition = !empty($aParams['cond']) && is_array($aParams['cond']);
        $aValues = !$bJsMode && $bCondition ? $aParams['cond'] : array();

        $this->_oForm = new $sClass($aForm, $this->_oTemplate);
        $this->_oForm->initChecker($aValues, $aValues);

        return $this->_oForm;
    }
}

class BxBaseSearchExtendedFormCheckerHelper extends BxDolFormCheckerHelper
{
    static public function passAgeRange ($s)
    {
        if (is_array($s)) {
            $a = array ();
            foreach ($s as $k => $v)
                $a[$k] = self::_passAgeRange ($v);
            return $a;
        }
        return self::_passAgeRange ($s);
    }

    static public function _passAgeRange ($s)
    {
        $a = explode ('-', $s);
        if (!$a || count($a) != 2)
            return $s;
        $i0 = new \DateInterval("P".(int)$a[0]."Y");
        $i1 = new \DateInterval("P".(int)$a[1]."Y");

        return [
            (new DateTime("now", new DateTimeZone('UTC')))->sub($i1)->format("Y-m-d"),
            (new DateTime("now", new DateTimeZone('UTC')))->sub($i0)->format("Y-m-d"),
        ];
    }
}

/** @} */