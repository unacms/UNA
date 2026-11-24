<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * One search for the site and the apps: the search window, the results page (search-keyword), Explore
 * and the API read the same query and get the same results.
 *
 * The query (from a URL, a form or API params; normalize() keeps only what it understands):
 *  - keyword: the text searched for;
 *  - section: module names (a csv string or an array); one module is the module scope;
 *  - context: a context profile id (a group, an event, a space...): content posted in it;
 *  - author: a profile id, "Created by";
 *  - title_only: 1 to look in titles only;
 *  - date_from, date_to (Y-m-d), date_field (created, starts, ends), timezone;
 *  - filters: values of the module's extended search fields, {field: value} (the search form's and
 *    the apps' filter format), applied only in the module scope;
 *  - tab: one module of the scope to show alone (the results' tabs), the scope stays as it is;
 *  - sort: best (default) or new;
 *  - per_page, cursor (one module's next page).
 *
 * Results are grouped by module: a module's comments are part of its group. Every row is checked
 * the way its own page checks it (BxDolContentInfo::isViewAllowed) before it is shown or counted,
 * so counts never include what the viewer may not open.
 */
class BxDolSearchUnified extends BxDol
{
    const SCOPE_GLOBAL = 'global';
    const SCOPE_MODULE = 'module';
    const SCOPE_CONTEXT = 'context';

    /** rows per module in the "All" view */
    const ALL_PER_GROUP = 3;
    /** rows counted per module in the "All" view: more shows as "10+" */
    const ALL_COUNT_CAP = 10;
    /** rows counted on a module's first page: more shows as "50+" */
    const GROUP_COUNT_CAP = 50;
    const PER_PAGE_DEFAULT = 12;
    const PER_PAGE_MAX = 50;
    const KEYWORD_MAX = 200;
    /** rows read from a section at once while looking for visible ones */
    const BATCH = 20;
    /** rows a module's results check at most per request, so rows the viewer may not see can't make a search slow:
     * the count shows "+" and the next page goes on after them */
    const SCAN_MAX = 120;

    protected static $_oInstance;

    /** search groups by module name, see getGroups */
    protected $_aGroups = null;

    /** only the modules the apps search (sys_api_search_sections), see setApiSections */
    protected $_bApiSections = false;

    public static function getInstance()
    {
        if(!self::$_oInstance)
            self::$_oInstance = new BxDolSearchUnified();

        return self::$_oInstance;
    }

    /**
     * The query in its one format from any source (request params, API params); unknown keys are dropped.
     * @param array $aIn raw values
     * @return array
     */
    public function normalize($aIn)
    {
        $aIn = is_array($aIn) ? $aIn : [];

        $sKeyword = isset($aIn['keyword']) && is_scalar($aIn['keyword']) ? trim(bx_process_input((string)$aIn['keyword'])) : '';
        if(get_mb_len($sKeyword) > self::KEYWORD_MAX)
            $sKeyword = get_mb_substr($sKeyword, 0, self::KEYWORD_MAX);

        $aGroups = $this->getGroups();
        $mixedSection = $aIn['section'] ?? '';
        $aSection = is_array($mixedSection) ? $mixedSection : explode(',', (string)$mixedSection);
        $aSections = [];
        foreach($aSection as $sSection)
            if(is_string($sSection) && ($sSection = trim($sSection)) !== '' && isset($aGroups[$sSection]) && !in_array($sSection, $aSections))
                $aSections[] = $sSection;

        $aFilters = [];
        $mixedFilters = $aIn['filters'] ?? [];
        if(is_string($mixedFilters) && $mixedFilters !== '')
            $mixedFilters = json_decode($mixedFilters, true);
        if(is_array($mixedFilters))
            foreach($mixedFilters as $sName => $mixedValue)
                if(is_string($sName) && preg_match('/^[a-zA-Z0-9_]+$/', $sName) && ($mixedValue = $this->_cleanValue($mixedValue)) !== null)
                    $aFilters[$sName] = $mixedValue;

        $sDateFrom = isset($aIn['date_from']) && is_string($aIn['date_from']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $aIn['date_from']) ? $aIn['date_from'] : '';
        $sDateTo = isset($aIn['date_to']) && is_string($aIn['date_to']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $aIn['date_to']) ? $aIn['date_to'] : '';
        $sDateField = isset($aIn['date_field']) && in_array($aIn['date_field'], ['created', 'starts', 'ends'], true) ? $aIn['date_field'] : 'created';
        $sTimezone = isset($aIn['timezone']) && is_string($aIn['timezone']) && in_array($aIn['timezone'], timezone_identifiers_list(), true) ? $aIn['timezone'] : '';

        $iPerPage = (int)($aIn['per_page'] ?? 0);
        if($iPerPage <= 0)
            $iPerPage = self::PER_PAGE_DEFAULT;

        return [
            'keyword' => $sKeyword,
            'section' => $aSections,
            'context' => max(0, (int)($aIn['context'] ?? 0)),
            'author' => max(0, (int)($aIn['author'] ?? 0)),
            'title_only' => !empty($aIn['title_only']) ? 1 : 0,
            'date_from' => $sDateFrom,
            'date_to' => $sDateTo,
            'date_field' => $sDateField,
            'timezone' => $sTimezone,
            'filters' => count($aSections) == 1 ? $aFilters : [],
            'tab' => isset($aIn['tab']) && is_string($aIn['tab']) && isset($aGroups[$aIn['tab']]) && (!$aSections || in_array($aIn['tab'], $aSections)) && count($aSections) != 1 ? $aIn['tab'] : '',
            'sort' => isset($aIn['sort']) && $aIn['sort'] === 'new' ? 'new' : 'best',
            'per_page' => min($iPerPage, self::PER_PAGE_MAX),
            'cursor' => isset($aIn['cursor']) && is_string($aIn['cursor']) && preg_match('/^[A-Za-z0-9_\-]{1,512}$/', $aIn['cursor']) ? $aIn['cursor'] : '',
        ];
    }

    /**
     * The query as URL params of the results page; empty values are left out, so the link is short.
     */
    public function toUrlParams($aQuery)
    {
        $aResult = [];
        foreach(['keyword', 'context', 'author', 'title_only', 'date_from', 'date_to', 'timezone', 'tab'] as $sKey)
            if(!empty($aQuery[$sKey]))
                $aResult[$sKey] = $aQuery[$sKey];

        if(!empty($aQuery['section']))
            $aResult['section'] = implode(',', $aQuery['section']);
        if(!empty($aQuery['date_from']) && ($aQuery['date_field'] ?? 'created') != 'created')
            $aResult['date_field'] = $aQuery['date_field'];
        if(!empty($aQuery['filters']))
            $aResult['filters'] = json_encode($aQuery['filters']);
        if(($aQuery['sort'] ?? 'best') == 'new')
            $aResult['sort'] = 'new';

        return $aResult;
    }

    /**
     * Link to the results page for the query.
     */
    public function getResultsUrl($aQuery)
    {
        return bx_append_url_params(BX_DOL_URL_ROOT . BxDolPermalinks::getInstance()->permalink('searchKeyword.php'), $this->toUrlParams($aQuery));
    }

    /**
     * Whether the query asks for anything: a keyword, or a narrowing (context, author, date, fields).
     */
    public function hasQuery($aQuery)
    {
        return $aQuery['keyword'] !== '' || $aQuery['context'] || $aQuery['author'] || $aQuery['date_from'] || !empty($aQuery['filters']);
    }

    /**
     * Search for the apps: only the modules Studio > API > Settings lists for them (sys_api_search_sections, with their
     * comments), when it lists any; the site searches every global search section.
     */
    public function setApiSections($b)
    {
        if($this->_bApiSections != (bool)$b)
            $this->_aGroups = null;

        $this->_bApiSections = (bool)$b;
    }

    /**
     * Searchable modules in the site's search order: the sections of global search (Studio > Search, `GlobalSearch`)
     * of enabled modules, grouped by the module they belong to, comments with their module.
     * @return array module name => ['name', 'title', 'icon', 'sections' => [section name => 'main'|'cmts'|'pages'], 'profile' => bool, 'context' => bool]
     */
    public function getGroups()
    {
        if($this->_aGroups !== null)
            return $this->_aGroups;

        $oModules = BxDolModuleQuery::getInstance();
        $aIcons = BxDolSearchUnifiedQuery::getModuleIcons();

        $this->_aGroups = [];
        foreach(BxDolSearch::getSections(true) as $sSection => $aSection) {
            $oResult = $this->_getResultObject($sSection);
            if(!$oResult || !empty($oResult->isError))
                continue;

            $sModule = $oResult->getModuleName();
            if($sModule === '' || ($sModule !== 'system' && !$oModules->isEnabledByName($sModule)))
                continue;

            if($sSection == 'sys_pages')
                $sKind = 'pages';
            else if(($oCi = BxDolContentInfo::getObjectInstance($oResult->getContentInfoName())) && $oCi instanceof BxDolContentInfoCmts)
                $sKind = 'cmts';
            else if($oCi)
                $sKind = 'main';
            else
                continue;

            if(!isset($this->_aGroups[$sModule])) {
                $aModule = $sModule !== 'system' ? $oModules->getModuleByName($sModule) : [];
                $CNF = $this->_getCnf($sModule);

                $this->_aGroups[$sModule] = [
                    'name' => $sModule,
                    'title' => !empty($aModule['title']) ? _t($aModule['title']) : _t($aSection['title']),
                    'icon' => $aIcons[$sModule] ?? ($sModule == 'system' ? 'file-text' : 'search'),
                    'sections' => [],
                    'profile' => $sModule !== 'system' && BxDolRequest::serviceExists($sModule, 'act_as_profile') && bx_srv($sModule, 'act_as_profile'),
                    'context' => $sModule !== 'system' && !empty($CNF['FIELD_ALLOW_VIEW_TO']),
                ];
            }

            $this->_aGroups[$sModule]['sections'][$sSection] = $sKind;
        }

        // the apps' modules
        $aApi = $this->_bApiSections ? array_filter(array_map('trim', explode(',', (string)getParam('sys_api_search_sections')))) : [];
        if($aApi)
            foreach($this->_aGroups as $sModule => $aGroup)
                if(!array_intersect(array_keys($aGroup['sections']), $aApi))
                    unset($this->_aGroups[$sModule]);

        // a module only with comments in search (its own section is off) isn't a group
        foreach($this->_aGroups as $sModule => $aGroup)
            if(!in_array('main', $aGroup['sections']) && !in_array('pages', $aGroup['sections']))
                unset($this->_aGroups[$sModule]);

        return $this->_aGroups;
    }

    /**
     * Whether a module is searched (a global search section of an enabled module) and its title, without building the
     * search groups: for the Search buttons every page of a section draws.
     * @return string the module's title, '' when it isn't searched
     */
    public function getModuleSearchTitle($sModule)
    {
        if($this->_aGroups !== null)
            return isset($this->_aGroups[$sModule]) ? $this->_aGroups[$sModule]['title'] : '';

        $aSections = BxDolSearch::getSections(true);
        if($sModule === '' || $sModule == 'system' || !isset($aSections[$sModule]) || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return '';

        $aApi = $this->_bApiSections ? array_filter(array_map('trim', explode(',', (string)getParam('sys_api_search_sections')))) : [];
        if($aApi && !in_array($sModule, $aApi))
            return '';

        $aModule = BxDolModuleQuery::getInstance()->getModuleByName($sModule);
        return !empty($aModule['title']) ? _t($aModule['title']) : _t($aSections[$sModule]['title']);
    }

    /**
     * What the window shows for the query: the scope and its chips.
     * @return array ['scope' => global|module|context, 'chips' => [...], 'groups' => [['name', 'title', 'icon']], 'context' => [...]|null, 'fields' => [...]]
     */
    public function getScope($aQuery)
    {
        $aGroups = $this->getGroups();

        $aContext = null;
        if($aQuery['context'] && ($aContext = $this->getContextInfo($aQuery['context'])) === false)
            $aContext = null;

        $sScope = $aContext ? self::SCOPE_CONTEXT : (count($aQuery['section']) == 1 ? self::SCOPE_MODULE : self::SCOPE_GLOBAL);

        $aChips = [];
        if($aContext)
            $aChips[] = ['name' => 'context', 'type' => 'scope', 'caption' => _t('_sys_search_chip_in', $aContext['title']), 'value' => $aContext['id'], 'removable' => true];

        foreach($aQuery['section'] as $sModule)
            $aChips[] = ['name' => 'section', 'type' => 'scope', 'caption' => _t('_sys_search_chip_in', $aGroups[$sModule]['title']), 'value' => $sModule, 'removable' => true, 'icon' => $aGroups[$sModule]['icon']];

        $aChips[] = ['name' => 'title_only', 'type' => 'toggle', 'caption' => _t('_sys_search_chip_title_only'), 'value' => $aQuery['title_only']];

        $aAuthor = $aQuery['author'] ? $this->getProfileInfo($aQuery['author']) : false;
        $aChips[] = ['name' => 'author', 'type' => 'profile', 'caption' => _t('_sys_search_chip_created_by'), 'value' => $aAuthor ? $aAuthor['id'] : 0, 'value_title' => $aAuthor ? $aAuthor['title'] : ''];

        $aDateFields = [['value' => 'created', 'title' => _t('_sys_search_chip_date_created')]];
        if(count($aQuery['section']) == 1 && ($CNF = $this->_getCnf($aQuery['section'][0])) && !empty($CNF['FIELD_DATE_START']))
            $aDateFields = array_merge($aDateFields, [
                ['value' => 'starts', 'title' => _t('_sys_search_chip_date_starts')],
                ['value' => 'ends', 'title' => _t('_sys_search_chip_date_ends')],
            ]);
        $aChips[] = ['name' => 'date', 'type' => 'date_range', 'caption' => _t('_sys_search_chip_date'), 'value' => $aQuery['date_from'] ? ['from' => $aQuery['date_from'], 'to' => $aQuery['date_to'], 'field' => $aQuery['date_field']] : null, 'fields' => $aDateFields];

        if($sScope == self::SCOPE_MODULE)
            foreach($this->getFieldChips($aQuery['section'][0]) as $aField) {
                $aField['value'] = $aQuery['filters'][$aField['name']] ?? null;
                $aChips[] = $aField;
            }

        $aGroupsOut = [];
        foreach($this->_getQueryGroups($aQuery, $aContext) as $sModule)
            $aGroupsOut[] = ['name' => $sModule, 'title' => $aGroups[$sModule]['title'], 'icon' => $aGroups[$sModule]['icon']];

        return [
            'scope' => $sScope,
            'context' => $aContext,
            'chips' => $aChips,
            'groups' => $aGroupsOut,
            'ai' => BxDolAiSearchParser::getInstance()->isAvailable() ? 1 : 0,
            'results_url' => $this->getResultsUrl($aQuery),
        ];
    }

    /**
     * Chips of a module's extended search fields (Studio > a module's search form): the fields with a list of
     * values, which narrow the module's results the way its search form does (BxBaseModGeneralSearchResult::
     * addConditionsForSearchFilters). Text fields are the keyword's; privacy, content filter, author and
     * location fields have chips of their own or none.
     * @return array [['name', 'type' => 'options', 'caption', 'multiple', 'options' => [['value', 'title']]]]
     */
    public function getFieldChips($sModule)
    {
        // the fields' lists are read with BX_DATA_LISTS_KEY_PREFIX, a constant of BxDolForm's file, which autoloading
        // brings only with the class (as BxBaseServicesSearch::_getSearchExtendedObject does)
        bx_import('BxDolForm');
        $aObject = BxDolSearchExtendedQuery::getSearchObject($sModule);
        if(!$aObject || empty($aObject['active']) || empty($aObject['fields']))
            return [];

        $CNF = $this->_getCnf($sModule);
        $sTable = $CNF['TABLE_ENTRIES'] ?? '';
        $aSkip = array_filter([$CNF['FIELD_ALLOW_VIEW_TO'] ?? '', $CNF['FIELD_CF'] ?? '', $CNF['FIELD_AUTHOR'] ?? '', 'allow_view_to', 'cf', 'author']);

        $aResult = [];
        foreach($aObject['fields'] as $aField) {
            if(empty($aField['active']) || in_array($aField['name'], $aSkip) || !in_array($aField['search_operator'], ['in', '=']))
                continue;
            if(!in_array($aField['search_type'], ['checkbox_set', 'select', 'select_multiple', 'radio_set']))
                continue;
            if($sTable === '' || !BxDolDb::getInstance()->isFieldExists($sTable, $aField['name']))
                continue;
            if(empty($aField['values']) || !is_array($aField['values']))
                continue;

            $aOptions = [];
            foreach($aField['values'] as $mixedKey => $mixedValue) {
                if($mixedKey === '' || $mixedKey === 0 && $mixedValue === '')
                    continue;
                $aOptions[] = ['value' => (string)$mixedKey, 'title' => is_array($mixedValue) ? _t($mixedValue['value'] ?? '') : _t((string)$mixedValue)];
            }
            if(!$aOptions)
                continue;

            $aResult[] = [
                'name' => $aField['name'],
                'type' => 'options',
                'caption' => _t($aField['caption']),
                'multiple' => $aField['search_operator'] == 'in' ? 1 : 0,
                'options' => $aOptions,
            ];
        }

        return $aResult;
    }

    /**
     * A context the viewer may see: ['id', 'title', 'module', 'url'], else false.
     */
    public function getContextInfo($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance((int)$iProfileId);
        if(!$oProfile || $oProfile->getStatus() !== BX_PROFILE_STATUS_ACTIVE)
            return false;

        $sModule = $oProfile->getModule();
        if(!BxDolRequest::serviceExists($sModule, 'is_group_profile') && !BxDolRequest::serviceExists($sModule, 'act_as_profile'))
            return false;

        if($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return [
            'id' => (int)$oProfile->id(),
            'title' => $oProfile->getDisplayName(),
            'module' => $sModule,
            'url' => $oProfile->getUrl(),
        ];
    }

    /**
     * A profile for "Created by": ['id', 'title'] when it is active, else false.
     */
    public function getProfileInfo($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance((int)$iProfileId);
        if(!$oProfile || $oProfile->getStatus() !== BX_PROFILE_STATUS_ACTIVE)
            return false;

        // not even the name of a profile the viewer may not see
        if($oProfile->checkAllowedProfileView() !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        return ['id' => (int)$oProfile->id(), 'title' => $oProfile->getDisplayName()];
    }

    /**
     * Results for the query.
     *  - Several modules (no section, or more than one): the "All" view, a few rows of each module with its count.
     *  - One module: a page of its rows, its count on the first page and a cursor for the next.
     * @param string $sOutput 'api' (each row as the apps' unit data), 'html' (the site's live search units) or 'hits'
     *        (API v2: kind, module, id, title, url, date)
     * @return array ['groups' => [...], 'total' => int, 'total_more' => bool] or ['group' => [...]]
     */
    public function search($aQuery, $sOutput = 'api')
    {
        $aGroups = $this->getGroups();

        $aContext = $aQuery['context'] ? $this->getContextInfo($aQuery['context']) : false;
        if($aQuery['context'] && !$aContext)
            return ['groups' => [], 'total' => 0, 'total_more' => false];

        if(!$this->hasQuery($aQuery))
            return ['groups' => [], 'total' => 0, 'total_more' => false];

        $aModules = $this->_getQueryGroups($aQuery, $aContext);

        $sOne = $aQuery['tab'] !== '' ? $aQuery['tab'] : (count($aQuery['section']) == 1 ? $aQuery['section'][0] : '');
        if($sOne !== '') {
            $sModule = $sOne;
            if(!in_array($sModule, $aModules))
                return ['group' => $this->_groupOut($aGroups[$sModule], ['items' => [], 'count' => 0, 'count_more' => false, 'cursor' => ''], $sOutput)];

            $aCursor = $this->_decodeCursor($aQuery['cursor'], $aGroups[$sModule]);
            $aRes = $this->_collect($aGroups[$sModule], $aQuery, $aContext, $aCursor, $aQuery['per_page'], $aCursor ? 0 : self::GROUP_COUNT_CAP);
            return ['group' => $this->_groupOut($aGroups[$sModule], $aRes, $sOutput)];
        }

        $aOut = [];
        $iTotal = 0;
        $bTotalMore = false;
        foreach($aModules as $sModule) {
            $aRes = $this->_collect($aGroups[$sModule], $aQuery, $aContext, [], self::ALL_PER_GROUP, self::ALL_COUNT_CAP, true);
            // a module whose checked rows were all hidden may still have more after them: its tab goes on there
            if(!$aRes['count'] && !$aRes['count_more'])
                continue;

            $iTotal += $aRes['count'];
            $bTotalMore = $bTotalMore || $aRes['count_more'];
            $aOut[] = $this->_groupOut($aGroups[$sModule], $aRes, $sOutput);
        }

        return ['groups' => $aOut, 'total' => $iTotal, 'total_more' => $bTotalMore];
    }

    /**
     * Modules the query looks in: the chosen ones, else all; in a context only modules whose content is
     * posted in contexts (not profiles, not pages).
     */
    protected function _getQueryGroups($aQuery, $aContext)
    {
        $aGroups = $this->getGroups();
        $aModules = $aQuery['section'] ? $aQuery['section'] : array_keys($aGroups);

        $aResult = [];
        foreach($aModules as $sModule) {
            if(!isset($aGroups[$sModule]))
                continue;
            if($aContext && (!$aGroups[$sModule]['context'] || $aGroups[$sModule]['profile']))
                continue;
            if(($aQuery['author'] || $aQuery['title_only']) && $sModule == 'system')
                continue;
            $aResult[] = $sModule;
        }

        return $aResult;
    }

    /**
     * Visible rows of a module's sections, merged newest first: up to $iNeed rows from where the cursor
     * says, counting visible rows up to $iCountCap (0: no count).
     * @return array ['items' => [['section', 'kind', 'id', 'row']], 'count', 'count_more', 'cursor']
     */
    protected function _collect($aGroup, $aQuery, $aContext, $aCursor, $iNeed, $iCountCap, $bRankAll = false)
    {
        $aSections = [];
        foreach($aGroup['sections'] as $sSection => $sKind) {
            // a module's comments are with it in the "All" view and its tab, not in the module scope (its entries only)
            if($sKind == 'cmts' && ($aContext || $aQuery['title_only'] || count($aQuery['section']) == 1 || $aQuery['keyword'] === ''))
                continue;
            if($sKind == 'cmts' && !empty($aQuery['filters']))
                continue;
            $aSections[$sSection] = $sKind;
        }

        $aOffsets = [];
        $aQueues = [];
        $aDone = [];
        foreach($aSections as $sSection => $sKind) {
            $aOffsets[$sSection] = isset($aCursor[$sSection]) ? (int)$aCursor[$sSection] : 0;
            $aQueues[$sSection] = [];
            $aDone[$sSection] = $aOffsets[$sSection] < 0;
        }

        // the offset each section reads from next, and where it stood after the last row kept
        $aRead = $aOffsets;
        $aNext = $aOffsets;

        $aItems = [];
        $aVisible = [];
        $iCount = 0;
        $bMore = false;
        $iLimit = max($iNeed, $iCountCap);
        $iScanned = 0;
        $bCapped = false;
        while(true) {
            if($iScanned >= self::SCAN_MAX) {
                $bCapped = true;
                break;
            }

            // refill empty queues
            foreach($aSections as $sSection => $sKind)
                if(!$aQueues[$sSection] && !$aDone[$sSection]) {
                    $aRows = $this->_sectionRows($sSection, $sKind, $aQuery, $aContext, $aRead[$sSection], self::BATCH);
                    $aDone[$sSection] = count($aRows) < self::BATCH;
                    $aRead[$sSection] += count($aRows);
                    $aQueues[$sSection] = $aRows;
                }

            // the newest of the queues' heads
            $sBest = null;
            foreach($aQueues as $sSection => $aRows)
                if($aRows && ($sBest === null || $aRows[0]['date'] > $aQueues[$sBest][0]['date']))
                    $sBest = $sSection;
            if($sBest === null)
                break;

            $aRow = array_shift($aQueues[$sBest]);
            $iScanned++;
            $aOffsetsNow = [];
            foreach($aSections as $sSection => $sKind)
                $aOffsetsNow[$sSection] = $aRead[$sSection] - count($aQueues[$sSection]);

            if(!$this->_isVisible($sBest, $aSections[$sBest], $aRow))
                continue;

            $aItem = ['section' => $sBest, 'kind' => $aSections[$sBest], 'id' => $aRow['id'], 'row' => $aRow];
            if(count($aVisible) <= $iLimit)
                $aVisible[] = $aItem;

            if(count($aItems) < $iNeed) {
                $aItems[] = $aItem;
                $aNext = $aOffsetsNow;
            }
            else if(!$bMore)
                $bMore = true;

            $iCount++;
            if($iCount >= $iLimit + 1)
                break;
        }

        // checked as far as the cap: what is left may hold more
        if($bCapped) {
            $bMore = $bMore || count($aItems) >= $iNeed || array_filter($aDone, function($b) { return !$b; }) || array_filter($aQueues);
            if($bMore && count($aItems) < $iNeed)
                $aNext = [];
        }

        $bCountMore = ($iCountCap && $iCount > $iCountCap) || ($bCapped && $bMore);

        $sCursor = '';
        if($bMore) {
            $aCursorOut = [];
            // a page cut short by the cap goes on where the check stopped
            $aFrom = $aNext ? $aNext : $aOffsetsNow ?? $aOffsets;
            foreach($aSections as $sSection => $sKind)
                $aCursorOut[$sSection] = $aDone[$sSection] && !$aQueues[$sSection] && $aFrom[$sSection] >= $aRead[$sSection] ? -1 : $aFrom[$sSection];
            $sCursor = $this->_encodeCursor($aCursorOut);
        }

        // best matches: in the "All" view among every row found (it has no next page), on a module's page
        // among the page's rows (its cursor goes on in date order)
        if($aQuery['sort'] == 'best' && $aQuery['keyword'] !== '')
            $aItems = $bRankAll ? array_slice($this->_rank($aQuery['keyword'], $aVisible), 0, $iNeed) : $this->_rank($aQuery['keyword'], $aItems);

        return [
            'items' => $aItems,
            'count' => $iCountCap ? min($iCount, $iCountCap) : count($aItems),
            'count_more' => $bCountMore,
            'cursor' => $sCursor,
        ];
    }

    /**
     * The best matches first, among the rows found: a title that is the keyword, that starts with it, that has
     * a word starting with it, then the rest; newest first within each.
     */
    protected function _rank($sKeyword, $aItems)
    {
        $aCandidates = [];
        foreach($aItems as $iIndex => $aItem)
            $aCandidates[] = ['id' => $iIndex, 'name' => $aItem['row']['title'] ?? '', 'exact' => false];

        $aResult = [];
        foreach(BxDolApiV2Search::rank($sKeyword, $aCandidates) as $iIndex)
            $aResult[] = $aItems[$iIndex];

        return $aResult;
    }

    /**
     * One batch of a section's rows for the query, newest first: [['id', 'date'], ...]. The section's own
     * search object reads them (its search fields, status and content filter), without the request's own
     * params (BxDolApiV2Search::isolated), with the scope's conditions added under keys of their own.
     */
    protected function _sectionRows($sSection, $sKind, $aQuery, $aContext, $iStart, $iPerPage)
    {
        $oResult = null;
        $aData = BxDolApiV2Search::isolated(function () use ($sSection, $sKind, $aQuery, $aContext, $iStart, $iPerPage, &$oResult) {
            $oResult = $this->_getResultObject($sSection, $sKind == 'main' && !empty($aQuery['filters']) ? ['filters' => $aQuery['filters']] : [], true);
            if(!$oResult || !empty($oResult->isError))
                return null;

            // each row is checked as its page checks it, so the "public only" conditions aren't needed
            $oResult->setProcessPrivateContent(true);
            $oResult->setCustomSearchCondition(['keyword' => $aQuery['keyword']]);
            $oResult->aCurrent['paginate']['forceStart'] = (int)$iStart;
            $oResult->aCurrent['paginate']['perPage'] = (int)$iPerPage;
            $oResult->setPaginatePerPage((int)$iPerPage);

            if(!$this->_addConditions($oResult, $sKind, $aQuery, $aContext))
                return null;

            // newest first, the id breaking a tie, so a cursor's offsets keep one order
            $oResult->aCurrent['sorting'] = 'last';
            $aSort = $oResult->getSorting('last');
            $sTable = isset($oResult->aCurrent['table']) ? (string)$oResult->aCurrent['table'] : '';
            $sIdent = !empty($oResult->aCurrent['ident']) ? (string)$oResult->aCurrent['ident'] : 'id';
            if($sTable !== '' && is_array($aSort) && count($aSort) === 1 && isset($aSort['order']) && preg_match('/^\s*ORDER BY\s/i', (string)$aSort['order']))
                $oResult->aCurrent['sorting_sql'] = trim($aSort['order']) . ', `' . $sTable . '`.`' . $sIdent . '` DESC';

            return $oResult->getSearchData();
        });
        if(!is_array($aData))
            return [];

        $sId = !empty($oResult->aCurrent['ident']) ? $oResult->aCurrent['ident'] : 'id';
        $sDate = $sKind == 'pages' ? 'updated_max' : (!empty($oResult->aCurrent['added']) ? $oResult->aCurrent['added'] : 'added');

        // search data may come with the fields renamed to the class's pseudonyms (comments: cmt_id as id, cmt_time as added)
        $aRows = [];
        foreach($aData as $aRow) {
            if(!is_array($aRow))
                continue;
            $iId = (int)($aRow[$sId] ?? $aRow['id'] ?? 0);
            $iDate = (int)($aRow[$sDate] ?? $aRow['added'] ?? $aRow['date'] ?? 0);
            if($iId > 0) {
                $aOut = ['id' => $iId, 'date' => $iDate];
                if($sKind == 'pages')
                    $aOut['page'] = $aRow;
                $aRows[] = $aOut;
            }
        }

        return array_slice($aRows, 0, $iPerPage);
    }

    /**
     * The scope's conditions on a section's search object, under keys of their own (an existing key such as
     * 'author' would be merged into, not replaced). False when the section can't take them.
     */
    protected function _addConditions($oResult, $sKind, $aQuery, $aContext)
    {
        $sModule = $oResult->getModuleName();
        $CNF = $this->_getCnf($sModule);
        $sTable = (string)($oResult->aCurrent['table'] ?? '');

        if($sKind == 'pages')
            return !$aContext && !$aQuery['author'] && !$aQuery['title_only'] && !$aQuery['date_from'];

        if($aQuery['title_only']) {
            if($sKind != 'main' || empty($CNF['FIELD_TITLE']) || !BxDolDb::getInstance()->isFieldExists($sTable, $CNF['FIELD_TITLE']))
                return false;
            $oResult->aCurrent['searchFields'] = [$CNF['FIELD_TITLE']];
        }

        if($aContext) {
            if($sKind != 'main' || empty($CNF['FIELD_ALLOW_VIEW_TO']) || !BxDolDb::getInstance()->isFieldExists($sTable, $CNF['FIELD_ALLOW_VIEW_TO']))
                return false;
            $oResult->aCurrent['restriction']['usr_context'] = ['value' => -$aContext['id'], 'field' => $CNF['FIELD_ALLOW_VIEW_TO'], 'operator' => '=', 'table' => $sTable];
        }

        if($aQuery['author']) {
            $sField = $sKind == 'cmts' ? 'cmt_author_id' : ($CNF['FIELD_AUTHOR'] ?? '');
            if($sField === '' || !BxDolDb::getInstance()->isFieldExists($sTable, $sField))
                return false;
            $oResult->aCurrent['restriction']['usr_author'] = ['value' => (int)$aQuery['author'], 'field' => $sField, 'operator' => '=', 'table' => $sTable];
        }

        if($aQuery['date_from']) {
            $aRange = $this->_getDateRange($aQuery);
            if(!$aRange)
                return false;

            $sField = '';
            $sDateTable = $sTable;
            if($aQuery['date_field'] == 'created') {
                $sDateTable = !empty($oResult->aCurrent['tableSearch']) ? $oResult->aCurrent['tableSearch'] : $sTable;
                $sField = !empty($oResult->aCurrent['added']) ? $oResult->aCurrent['added'] : 'added';
            }
            else if($sKind == 'main')
                $sField = $CNF[$aQuery['date_field'] == 'starts' ? 'FIELD_DATE_START' : 'FIELD_DATE_END'] ?? '';

            if($sField === '' || !BxDolDb::getInstance()->isFieldExists($sDateTable, $sField))
                return false;

            $oResult->aCurrent['restriction']['usr_date_from'] = ['value' => $aRange[0], 'field' => $sField, 'operator' => '>=', 'table' => $sDateTable];
            $oResult->aCurrent['restriction']['usr_date_to'] = ['value' => $aRange[1], 'field' => $sField, 'operator' => '<=', 'table' => $sDateTable];
        }

        return true;
    }

    /**
     * [from, to] timestamps of the query's dates, whole days in its timezone; [] when they don't make a range.
     */
    protected function _getDateRange($aQuery)
    {
        $sTo = $aQuery['date_to'] ? $aQuery['date_to'] : $aQuery['date_from'];
        try {
            $oTimezone = new DateTimeZone($aQuery['timezone'] ? $aQuery['timezone'] : (date_default_timezone_get() ?: 'UTC'));
            $iFrom = (new DateTime($aQuery['date_from'] . ' 00:00:00', $oTimezone))->getTimestamp();
            $iTo = (new DateTime($sTo . ' 23:59:59', $oTimezone))->getTimestamp();
        }
        catch (Exception $e) {
            return [];
        }

        return $iTo >= $iFrom ? [$iFrom, $iTo] : [];
    }

    /**
     * Whether the viewer may open the row, as its own page decides; keeps its title for ranking.
     */
    protected function _isVisible($sSection, $sKind, &$aRow)
    {
        if($sKind == 'pages') {
            $sTitle = _t($aRow['page']['title'] ?? '');
            $aRow['title'] = $sTitle;
            return $sTitle !== '' && !preg_match('/{.*?}/', $sTitle);
        }

        $oResult = $this->_getResultObject($sSection);
        $oCi = $oResult ? BxDolContentInfo::getObjectInstance($oResult->getContentInfoName()) : null;
        if(!$oCi || !$oCi->isViewAllowed($aRow['id']))
            return false;

        $aRow['title'] = (string)$oCi->getContentTitle($aRow['id']);
        return true;
    }

    protected function _groupOut($aGroup, $aRes, $sOutput)
    {
        $aItems = [];
        foreach($aRes['items'] as $aItem)
            if(($mixedItem = $this->_itemOut($aItem, $sOutput)))
                $aItems[] = $mixedItem;

        return [
            'name' => $aGroup['name'],
            'title' => $aGroup['title'],
            'icon' => $aGroup['icon'],
            'count' => $aRes['count'],
            'count_more' => $aRes['count_more'],
            'cursor' => $aRes['cursor'],
            'items' => $aItems,
        ];
    }

    /**
     * A row as the apps' unit data (with `search_kind`: content, comment, profile or page) or the site's live
     * search unit.
     */
    protected function _itemOut($aItem, $sOutput)
    {
        if($aItem['kind'] == 'pages') {
            $aPage = $aItem['row']['page'];
            $sUrl = bx_absolute_url(BxDolPermalinks::getInstance()->permalink($aPage['url']));
            if($sOutput == 'html') {
                $oResult = $this->_getResultObject($aItem['section']);
                $oResult->setLiveSearch(true);
                return $oResult->displaySearchUnit($aPage);
            }

            if($sOutput == 'hits')
                return ['kind' => 'page', 'module' => 'system', 'id' => (string)$aPage['id'], 'title' => $aItem['row']['title'], 'url' => $sUrl, 'date' => (int)$aItem['row']['date']];

            return ['search_kind' => 'page', 'id' => (int)$aPage['id'], 'title' => $aItem['row']['title'], 'url' => bx_api_get_relative_url($sUrl), 'module' => 'system'];
        }

        $oResult = $this->_getResultObject($aItem['section']);
        $oCi = BxDolContentInfo::getObjectInstance($oResult->getContentInfoName());
        if(!$oCi)
            return false;

        if($sOutput == 'hits')
            return [
                'kind' => $aItem['kind'] == 'cmts' ? 'comment' : ($this->getGroups()[$oResult->getModuleName()]['profile'] ?? false ? 'profile' : 'content'),
                'module' => $oResult->getModuleName(),
                'id' => (string)$aItem['id'],
                'title' => strip_tags((string)($aItem['row']['title'] ?? '')),
                'url' => bx_absolute_url((string)$oCi->getContentLink($aItem['id'])),
                'date' => (int)$aItem['row']['date'],
            ];

        if($sOutput == 'html')
            return $oCi->getContentSearchResultUnit($aItem['id'], $aItem['kind'] == 'cmts' ? 'comment_live_search.html' : 'unit_live_search.html');

        $aData = $oCi->getContentInfoAPI($aItem['id'], getParam('sys_api_extended_units') == 'on');
        // content without an API unit of its own (an album's pictures): its title, link and thumbnail
        if(!$aData || !is_array($aData)) {
            $sLink = (string)$oCi->getContentLink($aItem['id']);
            if($sLink === '')
                return false;

            $aData = [
                'id' => (int)$aItem['id'],
                'title' => strip_tags((string)($aItem['row']['title'] ?? '')),
                'url' => bx_api_get_relative_url(bx_absolute_url($sLink)),
                'image' => (string)$oCi->getContentThumb($aItem['id']),
                'added' => (int)$aItem['row']['date'],
            ];
        }

        $aData['search_kind'] = $aItem['kind'] == 'cmts' ? 'comment' : ($this->getGroups()[$oResult->getModuleName()]['profile'] ?? false ? 'profile' : 'content');
        $aData['search_module'] = $oResult->getModuleName();
        return $aData;
    }

    /**
     * A section's search object; the one without params is kept for the request.
     */
    protected function _getResultObject($sSection, $aParams = [], $bFresh = false)
    {
        static $aCache = [];
        $bFresh = $bFresh || !empty($aParams);
        if(!$bFresh && isset($aCache[$sSection]))
            return $aCache[$sSection];

        $aSections = BxDolSearch::getSections();
        if(!isset($aSections[$sSection]))
            return null;

        $aSection = $aSections[$sSection];
        $sClass = !empty($aSection['class']) ? $aSection['class'] : 'BxTemplSearchResult';
        if(!empty($aSection['file']))
            require_once(BX_DIRECTORY_PATH_ROOT . $aSection['file']);
        if(!class_exists($sClass))
            return null;

        $oResult = $aParams ? new $sClass('', $aParams) : new $sClass();
        if(!$bFresh)
            $aCache[$sSection] = $oResult;

        return $oResult;
    }

    protected function _getCnf($sModule)
    {
        if($sModule === '' || $sModule === 'system')
            return [];

        $oModule = BxDolModule::getInstance($sModule);
        return $oModule && isset($oModule->_oConfig->CNF) && is_array($oModule->_oConfig->CNF) ? $oModule->_oConfig->CNF : [];
    }

    /**
     * A filter value: a string, a number, or a list of them; null when empty.
     */
    protected function _cleanValue($mixedValue)
    {
        if(is_array($mixedValue)) {
            $aResult = [];
            foreach($mixedValue as $mixedItem)
                if(is_scalar($mixedItem) && ($mixedItem = trim((string)$mixedItem)) !== '')
                    $aResult[] = bx_process_input($mixedItem);
            return $aResult ? array_slice($aResult, 0, 50) : null;
        }

        if(!is_scalar($mixedValue) || ($mixedValue = trim((string)$mixedValue)) === '')
            return null;

        return bx_process_input($mixedValue);
    }

    protected function _encodeCursor($aOffsets)
    {
        return rtrim(strtr(base64_encode(json_encode($aOffsets)), '+/', '-_'), '=');
    }

    /**
     * Offsets of the module's sections from a cursor; [] for a cursor that isn't one of this module's.
     */
    protected function _decodeCursor($sCursor, $aGroup)
    {
        if($sCursor === '')
            return [];

        $a = json_decode((string)base64_decode(strtr($sCursor, '-_', '+/')), true);
        if(!is_array($a))
            return [];

        $aResult = [];
        foreach($a as $sSection => $iOffset)
            if(isset($aGroup['sections'][$sSection]) && is_int($iOffset) && $iOffset >= -1 && $iOffset <= 100000)
                $aResult[$sSection] = $iOffset;

        return $aResult;
    }
}

/** @} */
