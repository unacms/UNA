<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaBaseView UNA Base Representation Classes
 * @{
 */

/**
 * System services related to search.
 */
class BxBaseServicesSearch extends BxDol
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'keyword_search', ["bx_posts", ["keyword" => "test"}], 'TemplServicesSearch'); @endcode
     * 
     * @code {{~system:keyword_search:TemplServicesSearch["bx_posts", {"keyword":"test"}]~}} @endcode
     * @code {{~system:keyword_search:TemplServicesSearch["bx_albums", {"meta_type": "location_country", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServicesSearch["bx_albums", {"meta_type": "location_country_state", "state":"NSW", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServicesSearch["bx_albums", {"meta_type": "location_country_city", "state":"NSW", "city":"Manly", "keyword": "AU"}, "unit.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServicesSearch["bx_posts", {"meta_type": "mention", "keyword": 2}, "unit_gallery.html"]~}} @endcode
     * @code {{~system:keyword_search:TemplServicesSearch["bx_posts", {"cat": "bx_posts_cats", "keyword": 3}, "unit_gallery.html"]~}} @endcode
     * 
     * Search by keyword
     * @param $sSection - search object to search in, usually module name, for example: bx_posts
     * @param $aCondition - condition for search, supported conditions: 
     *          - search by keyword: ["keyword" => "test"]
     *          - search by country: ["meta_type" => "location_country", "keyword" => "AU"]
     *          - search by country and state: ["meta_type": "location_country_state", "state":"NSW", "keyword": "AU"]
     *          - search by country, state and city: ["meta_type": "location_country_city", "state":"NSW", "city":"Manly", "keyword": "AU"]
     *          - search for mentions: ["meta_type" => "mention", "keyword" => 2]
     *          - search in category: ["cat": "bx_posts_cats", "keyword": 3]
     * @param $sTemplate - template for displaying search results, for example: unit.html
     * @param $iStart - paginate, display records starting from this number
     * @param $iPerPage - paginate, display this number of records per page
     * @param $bLiveSearch - search results like in live search
     * 
     * @see BxBaseServicesSearch::serviceKeywordSearch
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceKeywordSearch ($sSection, $aCondition, $sTemplate = '', $iStart = 0, $iPerPage = 0, $bLiveSearch = 0, $bPaginate = false)
    {
        if (!$sSection || !isset($aCondition['keyword']))
            return '';

        $sClass = 'BxTemplSearch';

        $sElsName = 'bx_elasticsearch';
        $sElsMethod = 'is_configured';
        if(BxDolRequest::serviceExists($sElsName, $sElsMethod) && BxDolService::call($sElsName, $sElsMethod)) {
             $oModule = BxDolModule::getInstance($sElsName);

             bx_import('Search', $oModule->_aModule);
             $sClass = 'BxElsSearch';
        }

        $oSearch = new $sClass(array($sSection));
        $oSearch->setLiveSearch($bLiveSearch);
        $oSearch->setMetaType(isset($aCondition['meta_type']) ? $aCondition['meta_type'] : '');
        $oSearch->setCategoryObject(isset($aCondition['cat']) ? $aCondition['cat'] : '');
        $oSearch->setCustomSearchCondition($aCondition);
        if (!$bPaginate)
            $oSearch->setRawProcessing(true);
        $oSearch->setCustomCurrentCondition(array(
            'paginate' => array (
                'start' => $iStart,
                'perPage' => $iPerPage ? $iPerPage : BX_DOL_SEARCH_RESULTS_PER_PAGE_DEFAULT,
            )));
        if ($sTemplate)
            $oSearch->setUnitTemplate($sTemplate);
        
        return $oSearch->response();
    }

    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'search_keyword_form', 'TemplServicesSearch'); @endcode
     * 
     * Block with Search by Keywords Form
     *  
     * @see BxBaseServicesSearch::serviceSearchKeywordForm
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceSearchKeywordForm ()
    {
        return $this->_getSearchObject()->getForm(BX_DB_PADDING_DEF, false, true);
    }
    
    /**
     * @page service Service Calls
     * @section bx_system_general System Services 
     * @subsection bx_system_general-general General
     * @subsubsection bx_system_general-keyword_search keyword_search
     * 
     * @code bx_srv('system', 'search_keyword_result', 'TemplServicesSearch'); @endcode
     * 
     * Block with Search by Keywords Results
     *  
     * @see BxBaseServicesSearch::serviceSearchKeywordResult
     */
    /** 
     * @ref bx_system_general-keyword_search "keyword_search"
     */
    public function serviceSearchKeywordResult ()
    {
        $sType = bx_process_input(bx_get('type'));
        $sKeyword = bx_process_input(bx_get('keyword'));
        $bKeyword = $sKeyword !== false;

        if(bx_is_api())
            return $this->serviceGetDataSearchApi(['params' => [
                'type' => $sType,
                'keyword' => $sKeyword,
                'section' => bx_process_input(bx_get('section')),
                'cat' => bx_process_input(bx_get('cat')),
                'filter' => $this->_getSearchApiFilterFromRequest(),
                'list' => bx_get('list') ? 1 : 0
            ]]);

        $sCode = '';
        if($bKeyword) {
            $oSearch = $this->_getSearchObject();

            if(($sCode = $oSearch->response()))
                $sCode = BxDolTemplate::getInstance()->parseHtmlByName('search_result_block.html', [
                    'html_id' => 'bx-search-results-keyword',
                    'class' => 'bx-search-results-container',
                    'attrs' => '',
                    'content' => $sCode,
                    'bx_if:do_center' => [
                        'condition' => false,
                        'content' => [
                            'html_id' => '',
                            'selector_content' => ''
                        ]
                    ]
                ]);
            else
                $sCode = $oSearch->getEmptyResult();
        }

        return $sCode;
    }

    /** 
     * @ref bx_system_general-get_date_search_api "get_date_search_api"
     * @api @ref bx_system_general-get_date_search_api "get_date_search_api"
     */
    public function serviceGetDataSearchApi ($aParams)
    {
        if(!bx_is_api())
            return false;

        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);

        $bForceAll = ($aParams['params']['type'] ?? '') == 'keyword';

        $aSectionsAvail = explode(',', getParam('sys_api_search_sections'));
        $aSectionsAll = BxDolDb::getInstance()->fromCache(
            'sys_global_search_pairs', 
            'getPairs', 
            'SELECT `ObjectName` AS `name`, `Title` AS `title` FROM `sys_objects_search` WHERE `GlobalSearch`=\'1\' ORDER BY `Order` ASC',
            'name', 'title'
        );

        $aSections = [];
        foreach($aSectionsAll as $sSectionName => $sSectionTitle)
            if(in_array($sSectionName, $aSectionsAvail) || $bForceAll)
                $aSections[$sSectionName] = [
                    'name' => $sSectionName,
                    'title' => _t($sSectionTitle)
                ];

        $aParamsBrowse = array_merge([
            'keyword' => '',
            'section' => '',
            'sections' => array_values($aSections),
            'start' => 0,
            'per_page' => 12
        ], !empty($aParams['params']) && is_array($aParams['params']) ? $aParams['params'] : []);

        if(empty($aParamsBrowse['section']))
            $aParamsBrowse['section'] = array_keys($aSections);
        else if(is_string($aParamsBrowse['section']))
            $aParamsBrowse['section'] = explode(',', $aParamsBrowse['section']);

        $sClass = 'BxTemplSearch';
        
        $sSections = $aParamsBrowse['section'];
        if ($aParamsBrowse['live'] !== true && count($sSections) > 1){
            
            $aParamsBrowse['section'] = [];
            $aParamsBrowse['sections'] = [];
            
            $aDataRv = [];
            foreach ($sSections as $sSection) {
                $oSearch = new $sClass($sSection);
                $oSearch->setLiveSearch(true);
                $oSearch->setDataProcessing(true);
                $oSearch->setCustomSearchCondition(['keyword' => $aParamsBrowse['keyword']]);
                $oSearch->setCustomCurrentCondition([
                    'paginate' => [
                        'forceStart' => $aParamsBrowse['start'],
                        'perPage' => $aParamsBrowse['per_page'],
                    ]
                ]);

                $aData = $oSearch->response();
                if(count($aData) > $aParamsBrowse['per_page'])
                    $aData = array_slice($aData, $aParamsBrowse['start'], $aParamsBrowse['per_page']);

                if (count($aData) > 0) {
                    $oSearchResult = $oSearch->getSearchResultObject($sSection);
                    $sSectionTitle = $oSearchResult->aCurrent['title'];

                    $aParamsBrowse['section'][] = $sSection;
                    $aParamsBrowse['sections'][] = ['name' => $sSection, 'title' => $sSectionTitle];

                    $aDataRv[] = [
                        'section' => $sSection, 
                        'section_name' => $sSectionTitle, 
                        'data' => $aData,
                        'is_profile' => bx_srv('system', 'is_module_profile', [$oSearchResult->aCurrent['module_name']])
                    ];
                }
                
            }
            return [bx_api_get_block('search_sections', [
                'data' => $aDataRv,
                'params' => $aParamsBrowse
            ])];
        }
        else{
            $oSearch = new $sClass($aParamsBrowse['section']);
            $oSearch->setLiveSearch(true);
            $oSearch->setDataProcessing(true);
            $oSearch->setCustomSearchCondition(['keyword' => $aParamsBrowse['keyword']]);

            $aCurrentCondition = [
                'paginate' => [
                    'forceStart' => $aParamsBrowse['start'],
                    'perPage' => $aParamsBrowse['per_page'],
                ]
            ];

            // date filter (from search_parse): single section only
            $aFilter = !empty($aParamsBrowse['filter']) && is_array($aParamsBrowse['filter']) ? $aParamsBrowse['filter'] : [];
            if ($aFilter && count($aParamsBrowse['section']) == 1 && ($oSearchResult = $oSearch->getSearchResultObject($aParamsBrowse['section'][0]))) {
                $aRestriction = $this->_getSearchApiFilterRestriction($oSearchResult, $aFilter);
                if ($aRestriction) {
                    $aCurrentCondition['restriction'] = $aRestriction;
                    // live search returns nothing without a keyword, a date filter alone is enough here
                    if (empty($aParamsBrowse['keyword']))
                        $oSearch->setLiveSearch(false);
                }
                else
                    unset($aParamsBrowse['filter']);
            }
            else
                unset($aParamsBrowse['filter']);

            // "all events": section without keyword and date - list the section instead of an empty live search
            if (!empty($aParamsBrowse['list']) && empty($aParamsBrowse['keyword']) && count($aParamsBrowse['section']) == 1)
                $oSearch->setLiveSearch(false);

            $oSearch->setCustomCurrentCondition($aCurrentCondition);

            $aData = $oSearch->response();
            if(count($aData) > $aParamsBrowse['per_page'])
                $aData = array_slice($aData, $aParamsBrowse['start'], $aParamsBrowse['per_page']);

            return [
                bx_api_get_block('browse', [
                    'unit' => 'search-results',  
                    'request_url' => '/api.php?r=system/get_data_search_api/TemplServicesSearch&params[]=',
                    'params' => $aParamsBrowse,
                    'data' => $aData
                ])
            ];
        }
    }

    /**
     * Natural language search query -> structured filter (section, keyword, date) via a judge AI model.
     * Guest safe. Without an active judge model the query is returned as a plain keyword.
     *
     * @code /api.php?r=system/search_parse/TemplServicesSearch&params={"params":{"query":"events on 23/09","timezone":"Europe/Berlin"}} @endcode
     */
    public function serviceSearchParse ($aParams)
    {
        if(!bx_is_api())
            return false;

        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);
        $aParams = !empty($aParams['params']) && is_array($aParams['params']) ? $aParams['params'] : [];

        $sQuery = isset($aParams['query']) ? bx_process_input(trim((string)$aParams['query'])) : '';
        $sTimezone = isset($aParams['timezone']) ? bx_process_input((string)$aParams['timezone']) : '';
        $bDebug = !empty($aParams['debug']) && isAdmin();

        // extended search object (sys_objects_search_extended): fields of that object -> search_params
        $sObject = isset($aParams['object']) ? bx_process_input((string)$aParams['object'], BX_DATA_TEXT) : '';
        if($sObject !== '' && $this->_getSearchExtendedObject($sObject)) {
            $oParser = BxDolAiSearchExtParser::getInstance();
            $aResult = $oParser->parseObject($sObject, $sQuery, [
                'timezone' => $sTimezone,
                'debug' => $bDebug,
            ]);
            $aResult['available'] = $oParser->isAvailable();
            $aResult['mode'] = 'extended';

            return [bx_api_get_block('search_parse', $aResult)];
        }

        $aSections = $this->_getSearchApiSections();

        $oParser = BxDolAiSearchParser::getInstance();
        $aResult = $oParser->parse($sQuery, [
            'sections' => $aSections,
            'timezone' => $sTimezone,
            'debug' => $bDebug,
        ]);

        $aResult['available'] = $oParser->isAvailable();
        $aResult['mode'] = 'sections';
        $aResult['sections'] = [];
        foreach($aSections as $sSectionName => $sSectionTitle)
            $aResult['sections'][] = ['name' => $sSectionName, 'title' => $sSectionTitle];

        // filter for get_data_search_api / search-keyword page
        $aResult['filter'] = $aResult['date'] ? [
            'date_field' => $aResult['date']['field'],
            'date_from' => $aResult['date']['from'],
            'date_to' => $aResult['date']['to'],
            'timezone' => $sTimezone,
        ] : null;

        return [bx_api_get_block('search_parse', $aResult)];
    }

    /**
     * Page block "AI search" (NEO element `search_ai`): one input, the query is parsed by `search_parse`
     * into section / keyword / date chips, results come from `get_data_search_api`. API only.
     *
     * @param $mixedParams optional; a search section (e.g. bx_events) or an extended search object
     *        (e.g. bx_market) to lock the block to, or an array:
     *        ['object' => 'bx_market', 'use_page_results' => true] - the block only produces filters
     *        and the page's own get_results block (TemplSearchExtendedServices) renders the results,
     *        exactly as the search form does it.
     *        ['object' => 'bx_market', 'rerank' => true] - the block renders the results itself and
     *        orders them by meaning (BxDolAiSearchRerank), not by the SQL order.
     */
    public function serviceGetBlockSearchAi ($mixedParams = '')
    {
        if(!bx_is_api())
            return '';

        $bUsePageResults = false;
        $bRerank = false;
        if(is_array($mixedParams)) {
            $bUsePageResults = !empty($mixedParams['use_page_results']);
            $bRerank = !empty($mixedParams['rerank']);
            $sSection = isset($mixedParams['object']) ? (string)$mixedParams['object'] : (isset($mixedParams['section']) ? (string)$mixedParams['section'] : '');
        }
        else
            $sSection = (string)$mixedParams;

        // extended search object (e.g. bx_market): chips are the object's search fields, results via search_ai_results
        if($sSection !== '' && $this->_getSearchExtendedObject($sSection)) {
            $oParser = BxDolAiSearchExtParser::getInstance();
            $aFields = [];
            foreach($oParser->getFields($sSection) as $sName => $aField)
                $aFields[] = ['name' => $sName, 'caption' => $aField['caption'], 'kind' => $aField['kind']];

            return [bx_api_get_block('search_ai', [
                'mode' => 'extended',
                'available' => $oParser->isAvailable(),
                'object' => $sSection,
                'fields' => $aFields,
                'parse_url' => '/api.php?r=system/search_parse/TemplServicesSearch&params=',
                // true: the parsed values are pushed into the page's own get_results block as `filters`
                // (same contract as the search form); false: the block fetches and renders results itself
                'use_page_results' => $bUsePageResults ? 1 : 0,
                // semantic ordering by the judge model: with use_page_results the block swaps the page's
                // list source to search_ai_results, ranked results cannot be expressed as form filters
                'rerank' => $bRerank && BxDolAiSearchRerank::getInstance()->isAvailable() ? 1 : 0,
                'results_url' => '/api.php?r=system/search_ai_results/TemplServicesSearch&params=',
            ])];
        }

        $aSections = $this->_getSearchApiSections();
        $sSection = $sSection && isset($aSections[$sSection]) ? $sSection : '';

        $aSectionsList = [];
        foreach($aSections as $sSectionName => $sSectionTitle)
            $aSectionsList[] = ['name' => $sSectionName, 'title' => $sSectionTitle];

        return [bx_api_get_block('search_ai', [
            'mode' => 'sections',
            'available' => BxDolAiSearchParser::getInstance()->isAvailable(),
            'section' => $sSection,
            'sections' => $aSectionsList,
            'parse_url' => '/api.php?r=system/search_parse/TemplServicesSearch&params=',
            'search_url' => '/api.php?r=system/get_data_search_api/TemplServicesSearch&params=',
            'results_url' => '/search-keyword',
        ])];
    }

    /**
     * Results of an extended search object for search_params produced by search_parse (or edited via chips).
     * Only field names of the object are accepted; type and operator are taken from the object's field
     * definitions, never from the client. Guest safe (the module's own privacy conditions apply).
     *
     * @code /api.php?r=system/search_ai_results/TemplServicesSearch&params={"params":{"object":"bx_market","search_params":{"cat":{"value":[3]}},"start":0,"per_page":12}} @endcode
     */
    public function serviceSearchAiResults ($aParams)
    {
        if(!bx_is_api())
            return false;

        if(is_string($aParams))
            $aParams = bx_api_get_browse_params($aParams);
        $aParams = !empty($aParams['params']) && is_array($aParams['params']) ? $aParams['params'] : [];

        $sObject = isset($aParams['object']) ? bx_process_input((string)$aParams['object'], BX_DATA_TEXT) : '';
        $iStart = isset($aParams['start']) ? (int)$aParams['start'] : 0;
        $iPerPage = isset($aParams['per_page']) ? (int)$aParams['per_page'] : 12;
        if($iPerPage < 1 || $iPerPage > 50)
            $iPerPage = 12;

        $aObject = $sObject !== '' ? $this->_getSearchExtendedObject($sObject) : false;
        $oSearch = $aObject ? BxDolSearchExtended::getObjectInstance($sObject) : false;
        if(!$oSearch || !$oSearch->isEnabled())
            return [bx_api_get_msg(_t('Not Found'), ['ext' => ['msg_type' => 'result']])];

        $aFields = [];
        foreach($aObject['fields'] as $aField)
            if(!empty($aField['active']))
                $aFields[$aField['name']] = $aField;

        $aSearchParams = [];
        $aClient = !empty($aParams['search_params']) && is_array($aParams['search_params']) ? $aParams['search_params'] : [];
        foreach($aClient as $sName => $aParam) {
            if(!isset($aFields[$sName]) || !is_array($aParam) || !isset($aParam['value']))
                continue;

            $mixedValue = $aParam['value'];
            if(is_array($mixedValue)) {
                array_walk_recursive($mixedValue, function(&$mixed) {
                    $mixed = is_string($mixed) ? bx_process_input($mixed) : (is_numeric($mixed) ? $mixed + 0 : '');
                });
            }
            else
                $mixedValue = is_numeric($mixedValue) ? $mixedValue + 0 : bx_process_input((string)$mixedValue);

            if($mixedValue === '' || $mixedValue === [] || (is_array($mixedValue) && bx_is_empty_array($mixedValue)))
                continue;

            $aSearchParams[$sName] = [
                'type' => $aFields[$sName]['search_type'],
                'value' => $mixedValue,
                'operator' => $aFields[$sName]['search_operator'],
            ];
        }

        $sQuery = isset($aParams['query']) ? bx_process_input(trim((string)$aParams['query'])) : '';
        $bRerank = !empty($aParams['rerank']) && $sQuery !== '';

        // semantic ordering: the SQL picks candidates (with and without the keyword), the judge model
        // decides which of them answer the query and in which order
        if($bRerank) {
            $aRank = BxDolAiSearchRerank::getInstance()->rank($sObject, $sQuery, $aSearchParams, [
                'keyword_field' => isset($aParams['keyword_field']) ? bx_process_input((string)$aParams['keyword_field'], BX_DATA_TEXT) : '',
                'debug' => !empty($aParams['debug']) && isAdmin(),
            ]);

            if(!empty($aRank['ids'])) {
                // getContentSearchResultUnit loads the row and, on the API, returns it without
                // applying the content filter again, so drop ids this viewer cannot watch first.
                $aRank['ids'] = $this->_filterRankedIds($aObject, $aRank['ids']);
                if(!empty($aRank['scores']) && is_array($aRank['scores']))
                    $aRank['scores'] = array_intersect_key($aRank['scores'], array_flip($aRank['ids']));
            }

            if(!empty($aRank['ids'])) {
                $aIds = array_slice($aRank['ids'], $iStart, $iPerPage + 1);
                $bHasMore = count($aIds) > $iPerPage;
                if($bHasMore)
                    array_pop($aIds);

                $oContentInfo = BxDolContentInfo::getObjectInstance($aObject['object_content_info']);
                $aData = [];
                foreach($aIds as $iId)
                    if(($mixedUnit = $oContentInfo->getContentSearchResultUnit($iId)))
                        $aData[] = $mixedUnit;

                $aBlockParams = ['per_page' => $iPerPage, 'start' => $iStart, 'object' => $sObject, 'search_params' => $aSearchParams, 'query' => $sQuery, 'rerank' => 1];
                if(!empty($aRank['scores']))
                    $aBlockParams['scores'] = $aRank['scores'];

                return [bx_api_get_block('browse', [
                    'nocache' => true,
                    'module' => $aObject['module'],
                    'unit' => 'general-content-list',
                    'request_url' => '/api.php?r=system/search_ai_results/TemplServicesSearch&params=',
                    'params' => $aBlockParams,
                    'data' => $aData,
                ], ['ext' => ['rerank' => ['judged' => $aRank['judged'], 'cached' => $aRank['cached'], 'ms' => $aRank['ms'], 'total' => count($aRank['ids'])]]])];
            }
        }

        if(!$aSearchParams)
            return [bx_api_get_msg(_t('Nothing found'), ['ext' => ['msg_type' => 'result']])];

        $aResults = $oSearch->getResults([
            'search_params' => $aSearchParams,
            'start' => $iStart,
            'per_page' => $iPerPage,
            'js_mode' => true,
        ]);
        if(!is_array($aResults))
            return [bx_api_get_msg(_t('Nothing found'), ['ext' => ['msg_type' => 'result']])];

        // pagination goes through this service again
        foreach($aResults as $iIndex => $aBlock)
            if(isset($aBlock['data']['request_url'])) {
                $aResults[$iIndex]['data']['request_url'] = '/api.php?r=system/search_ai_results/TemplServicesSearch&params=';
                $aResults[$iIndex]['data']['params'] = ['object' => $sObject, 'search_params' => $aSearchParams, 'per_page' => $iPerPage, 'start' => $iStart];
            }

        return $aResults;
    }

    /**
     * Ids still visible to the current profile under the module's content filter, in the same order.
     * Modules without a content-filter field are returned unchanged.
     */
    protected function _filterRankedIds(array $aObject, array $aIds)
    {
        $aIds = array_values(array_filter(array_map('intval', $aIds)));
        if(!$aIds)
            return [];

        $oModule = !empty($aObject['module']) ? BxDolModule::getInstance($aObject['module']) : null;
        $CNF = $oModule && !empty($oModule->_oConfig->CNF) ? $oModule->_oConfig->CNF : [];
        if(empty($CNF['TABLE_ENTRIES']) || empty($CNF['FIELD_ID']) || empty($CNF['FIELD_CF']))
            return $aIds;

        $oCf = BxDolContentFilter::getInstance();
        if(!$oCf->isEnabled())
            return $aIds;

        $oDb = BxDolDb::getInstance();
        $aVisible = $oDb->getColumn("SELECT `" . $CNF['FIELD_ID'] . "` FROM `" . $CNF['TABLE_ENTRIES'] . "` WHERE `" . $CNF['FIELD_ID'] . "` IN (" . $oDb->implode_escape($aIds) . ")" . $oCf->getSQLParts($CNF['TABLE_ENTRIES'], $CNF['FIELD_CF']));
        if(!is_array($aVisible))
            return [];

        $aVisible = array_flip(array_map('intval', $aVisible));
        $aResult = [];
        foreach($aIds as $iId)
            if(isset($aVisible[$iId]))
                $aResult[] = $iId;

        return $aResult;
    }

    /**
     * Extended search object with its fields; BxDolForm must be loaded first, its file defines
     * BX_DATA_LISTS_KEY_PREFIX which the fields' pre-values are read with.
     */
    protected function _getSearchExtendedObject($sObject)
    {
        bx_import('BxDolForm');
        return BxDolSearchExtendedQuery::getSearchObject($sObject);
    }

    /**
     * Global search sections enabled for the API: [name => translated title]
     */
    protected function _getSearchApiSections()
    {
        $aSectionsAvail = explode(',', getParam('sys_api_search_sections'));
        $aSectionsAll = BxDolDb::getInstance()->fromCache(
            'sys_global_search_pairs',
            'getPairs',
            'SELECT `ObjectName` AS `name`, `Title` AS `title` FROM `sys_objects_search` WHERE `GlobalSearch`=\'1\' ORDER BY `Order` ASC',
            'name', 'title'
        );

        $aSections = [];
        foreach($aSectionsAll as $sSectionName => $sSectionTitle)
            if(in_array($sSectionName, $aSectionsAvail))
                $aSections[$sSectionName] = _t($sSectionTitle);

        return $aSections;
    }

    /**
     * Date filter passed as plain GET params of the search-keyword page
     */
    protected function _getSearchApiFilterFromRequest()
    {
        $sFrom = bx_process_input(bx_get('date_from'));
        if(!$sFrom)
            return null;

        return [
            'date_field' => bx_process_input(bx_get('date_field')),
            'date_from' => $sFrom,
            'date_to' => bx_process_input(bx_get('date_to')),
            'timezone' => bx_process_input(bx_get('timezone')),
        ];
    }

    /**
     * Convert a date filter [date_field => starts|ends|created, date_from => Y-m-d, date_to => Y-m-d, timezone]
     * into search restrictions for the given search result object; [] when it can't be applied.
     */
    protected function _getSearchApiFilterRestriction($oSearchResult, $aFilter)
    {
        $sFrom = isset($aFilter['date_from']) ? (string)$aFilter['date_from'] : '';
        $sTo = isset($aFilter['date_to']) && $aFilter['date_to'] ? (string)$aFilter['date_to'] : $sFrom;
        if(!preg_match('/^\d{4}-\d{2}-\d{2}$/', $sFrom) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $sTo))
            return [];

        $sTimezone = isset($aFilter['timezone']) && in_array($aFilter['timezone'], timezone_identifiers_list()) ? $aFilter['timezone'] : date_default_timezone_get();
        $oTimezone = new DateTimeZone($sTimezone ?: 'UTC');
        try {
            $iFrom = (new DateTime($sFrom . ' 00:00:00', $oTimezone))->getTimestamp();
            $iTo = (new DateTime($sTo . ' 23:59:59', $oTimezone))->getTimestamp();
        }
        catch (Exception $e) {
            return [];
        }
        if($iTo < $iFrom)
            return [];

        $sDateField = isset($aFilter['date_field']) ? (string)$aFilter['date_field'] : 'created';
        $aCurrent = $oSearchResult->aCurrent;
        $sModule = isset($aCurrent['module_name']) ? $aCurrent['module_name'] : '';

        if($sModule == 'bx_events') {
            $sTable = 'bx_events_data';
            $aFields = ['starts' => 'date_start', 'ends' => 'date_end', 'created' => 'added'];
            $sField = isset($aFields[$sDateField]) ? $aFields[$sDateField] : 'date_start';
        }
        else {
            $sTable = !empty($aCurrent['tableSearch']) ? $aCurrent['tableSearch'] : (isset($aCurrent['table']) ? $aCurrent['table'] : '');
            $sField = !empty($aCurrent['added']) ? $aCurrent['added'] : 'added';
        }

        if(!$sTable || !BxDolDb::getInstance()->isFieldExists($sTable, $sField))
            return [];

        return [
            'api_filter_date_from' => ['value' => $iFrom, 'field' => $sField, 'operator' => '>=', 'table' => $sTable],
            'api_filter_date_to' => ['value' => $iTo, 'field' => $sField, 'operator' => '<=', 'table' => $sTable],
        ];
    }

    private function _getSearchObject()
    {
        $sClass = 'BxTemplSearch';
        $sElsName = 'bx_elasticsearch';
        $sElsMethod = 'is_configured';
        if(BxDolRequest::serviceExists($sElsName, $sElsMethod) && BxDolService::call($sElsName, $sElsMethod) && !bx_get('cat') && !bx_get('type')) {
            $oModule = BxDolModule::getInstance($sElsName);
            bx_import('Search', $oModule->_aModule);
            $sClass = 'BxElsSearch';
        }
        /**
         * @hooks
         * @hookdef hook-system-search_keyword 'system', 'search_keyword' - hook to override sClass for search
         * - $unit_name - equals `system`
         * - $action - equals `search_keyword` 
         * - $object_id - not used 
         * - $sender_id - not used 
         * - $extra_params - array of additional params with the following array keys:
         *      - `override_result` - [string] by ref, class name for search, can be overridden in hook processing
         * @hook @ref hook-system-search_keyword
         */
        bx_alert('system', 'search_keyword', 0, 0, array('class' => &$sClass, 'class_name_ref' => &$sClass));

        $oSearch = new $sClass(bx_get('section'));
        $oSearch->setLiveSearch(bx_get('live_search') ? 1 : 0);
        $oSearch->setMetaType(bx_process_input(bx_get('type')));
        $oSearch->setCategoryObject(bx_process_input(bx_get('cat')));

        return $oSearch;
    }
}

/** @} */
