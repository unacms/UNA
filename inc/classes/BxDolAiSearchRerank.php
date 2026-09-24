<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Semantic ordering of search results: the SQL picks candidates, a judge model (BxDolAiJudge)
 * decides which of them actually answer the query and in which order.
 *
 * Candidates are collected with two queries (the "hybrid"), both with the same structured filters
 * (category, price, date...) and the same access rights:
 *   1. with the keyword    - exact text hits, what the plain search would return;
 *   2. without the keyword - the newest items of the filtered set.
 * The second query is what makes "course for beginners" find "Python from scratch": such an item has
 * none of the query words, so a keyword search can never return it, but the model recognises it once
 * it is among the candidates.
 *
 * Judgements are cached per (item, query) so repeated and paginated searches cost nothing, and the
 * ordered list of ids is cached per (query + filters) so pages stay consistent.
 *
 * Limits: a judge request carries at most CANDIDATES_MAX items (the model's state limit), so this is
 * re-ranking of a window, not a search over the whole table. For a big table a recall layer
 * (embeddings vector store) would be needed in front of it.
 */
class BxDolAiSearchRerank extends BxDolFactory
{
    const CANDIDATES_MAX = 120;     // items sent to the model in one request
    const KEYWORD_SHARE = 0.5;      // how much of the window the keyword query may take
    const TEXT_MAX = 220;           // characters of the item text put into the state
    const SCORE_MIN = 0.45;         // below this an item is dropped from the results
    const CACHE_TTL_ORDER = 600;    // ordered ids per query+filters, seconds
    const CACHE_TTL_ITEM = 86400;   // judgement per item+query, seconds
    const BUDGET_ITEMS_REQUEST = 200; // hard cap of judged items per request

    protected $_oJudge;
    protected $_oCache;

    protected function __construct()
    {
        parent::__construct();
        $this->_oJudge = BxDolAiJudge::getInstance();
        $this->_oCache = BxDolDb::getInstance()->getDbCacheObject();
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolAiSearchRerank();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function isAvailable(): bool
    {
        return (bool)$this->_oJudge;
    }

    /**
     * Ordered ids of an extended search object for a natural language query.
     *
     * @param $sObject extended search object (sys_objects_search_extended)
     * @param $sQuery the user's query as typed
     * @param $aSearchParams structured params (as built by BxDolAiSearchExtParser), keyword field included
     * @param $aOptions
     *   keyword_field - name of the text field holding the keyword, it is dropped in the second query
     *   debug         - return scores per item
     * @return array ['ids' => [...], 'scores' => [id => 0..1], 'judged' => N, 'cached' => N, 'ms' => N]
     *         or [] when the model is not available / nothing to rank
     */
    public function rank(string $sObject, string $sQuery, array $aSearchParams, array $aOptions = []): array
    {
        $sQuery = trim(preg_replace('/\s+/u', ' ', $sQuery));
        if (!$this->_oJudge || $sQuery === '')
            return [];

        bx_import('BxDolForm'); // BX_DATA_LISTS_KEY_PREFIX, used while reading the fields' pre-values
        $aObject = BxDolSearchExtendedQuery::getSearchObject($sObject);
        if (!$aObject || empty($aObject['object_content_info']))
            return [];

        $sCacheKeyOrder = $this->_getCacheKey('order', $sObject . '|' . $sQuery . '|' . md5(serialize($aSearchParams)));
        $aOrder = $this->_oCache->getData($sCacheKeyOrder, self::CACHE_TTL_ORDER);
        if (is_array($aOrder) && !empty($aOrder['ids']))
            return $aOrder;

        $fStart = microtime(true);

        $aIds = $this->_getCandidates($aObject, $aSearchParams, $aOptions['keyword_field'] ?? '');
        if (!$aIds)
            return [];

        $aItems = $this->_getItems($aObject, $aIds);
        if (!$aItems)
            return [];

        list($aScores, $iJudged, $iCached) = $this->_getScores($sObject, $sQuery, $aItems);
        if (!$aScores)
            return [];

        arsort($aScores);

        $aResultIds = [];
        foreach ($aScores as $iId => $fScore)
            if ($fScore >= self::SCORE_MIN)
                $aResultIds[] = (int)$iId;

        $aResult = [
            'ids' => $aResultIds,
            'judged' => $iJudged,
            'cached' => $iCached,
            'ms' => (int)round((microtime(true) - $fStart) * 1000),
        ];
        if (!empty($aOptions['debug']))
            $aResult['scores'] = $aScores;

        $this->_oCache->setData($sCacheKeyOrder, $aResult, self::CACHE_TTL_ORDER);

        return $aResult;
    }

    /**
     * Hybrid candidates: the keyword query plus the same query without the keyword.
     * Both run through the module's own search, so privacy and status conditions are applied as usual.
     */
    protected function _getCandidates(array $aObject, array $aSearchParams, string $sKeywordField): array
    {
        $oContentInfo = BxDolContentInfo::getObjectInstance($aObject['object_content_info']);
        if (!$oContentInfo)
            return [];

        $iKeywordMax = (int)round(self::CANDIDATES_MAX * self::KEYWORD_SHARE);

        $aIds = [];
        $bHasKeyword = $sKeywordField !== '' && isset($aSearchParams[$sKeywordField]);

        // 1. exact text hits
        if ($bHasKeyword) {
            $aKeywordIds = $oContentInfo->getSearchResultExtended($aSearchParams, 0, $iKeywordMax);
            if (is_array($aKeywordIds))
                $aIds = $aKeywordIds;
        }

        // 2. the same set without the keyword - items no word of the query matches.
        //    With no structured filters left this is simply the newest items of the module
        //    (filter mode, otherwise an empty param set returns nothing).
        $aParamsWide = $aSearchParams;
        if ($bHasKeyword)
            unset($aParamsWide[$sKeywordField]);

        $aWideIds = $oContentInfo->getSearchResultExtended($aParamsWide, 0, self::CANDIDATES_MAX, empty($aParamsWide));
        if (is_array($aWideIds))
            $aIds = array_merge($aIds, $aWideIds);

        $aIds = array_values(array_unique(array_map('intval', $aIds)));

        return array_slice($aIds, 0, self::CANDIDATES_MAX);
    }

    /**
     * [id => "title. text"] for the candidates, in one query when the module's table is known.
     */
    protected function _getItems(array $aObject, array $aIds): array
    {
        $aItems = [];

        $oModule = !empty($aObject['module']) ? BxDolModule::getInstance($aObject['module']) : null;
        $CNF = $oModule && !empty($oModule->_oConfig->CNF) ? $oModule->_oConfig->CNF : [];

        if (!empty($CNF['TABLE_ENTRIES']) && !empty($CNF['FIELD_ID']) && !empty($CNF['FIELD_TITLE'])) {
            $oDb = BxDolDb::getInstance();
            $sFieldText = !empty($CNF['FIELD_TEXT']) ? $CNF['FIELD_TEXT'] : '';

            $sFields = "`{$CNF['FIELD_ID']}` AS `id`, `{$CNF['FIELD_TITLE']}` AS `title`" . ($sFieldText ? ", `{$sFieldText}` AS `text`" : '');
            $aRows = $oDb->getAll("SELECT {$sFields} FROM `{$CNF['TABLE_ENTRIES']}` WHERE `{$CNF['FIELD_ID']}` IN (" . $oDb->implode_escape($aIds) . ")");

            foreach ($aRows as $aRow)
                $aItems[(int)$aRow['id']] = $this->_getItemText($aRow['title'] ?? '', $aRow['text'] ?? '');
        }
        else {
            // no CNF: fall back to the content info services
            $oContentInfo = BxDolContentInfo::getObjectInstance($aObject['object_content_info']);
            foreach ($aIds as $iId)
                $aItems[$iId] = $this->_getItemText((string)$oContentInfo->getContentTitle($iId), (string)$oContentInfo->getContentText($iId));
        }

        // keep the candidate order, drop empty ones
        $aOrdered = [];
        foreach ($aIds as $iId)
            if (!empty($aItems[$iId]))
                $aOrdered[$iId] = $aItems[$iId];

        return $aOrdered;
    }

    protected function _getItemText(string $sTitle, string $sText): string
    {
        $sTitle = trim(strip_tags($sTitle));
        $sText = trim(preg_replace('/\s+/u', ' ', strip_tags($sText)));
        if (mb_strlen($sText) > self::TEXT_MAX)
            $sText = mb_substr($sText, 0, self::TEXT_MAX) . '…';

        return trim($sTitle . ($sText !== '' ? '. ' . $sText : ''));
    }

    /**
     * Judgement per item: from cache when this item was already judged for this query,
     * the rest in one request to the model.
     * @return array [[id => score], judged, cached]
     */
    protected function _getScores(string $sObject, string $sQuery, array $aItems): array
    {
        $sQueryKey = md5(mb_strtolower($sQuery));

        $aScores = [];
        $aAsk = [];
        foreach ($aItems as $iId => $sText) {
            $mixedScore = $this->_oCache->getData($this->_getCacheKey('item', $sObject . '_' . $iId . '_' . $sQueryKey), self::CACHE_TTL_ITEM);
            if ($mixedScore !== null && $mixedScore !== false)
                $aScores[$iId] = (float)$mixedScore;
            else
                $aAsk[$iId] = $sText;
        }

        $iCached = count($aScores);
        if (!$aAsk)
            return [$aScores, 0, $iCached];

        if (count($aAsk) > self::BUDGET_ITEMS_REQUEST)
            $aAsk = array_slice($aAsk, 0, self::BUDGET_ITEMS_REQUEST, true);

        $aState = [
            'request' => $sQuery,
            'items' => [],
        ];
        $aQuestions = [];
        foreach ($aAsk as $iId => $sText) {
            $aState['items']['i' . $iId] = $sText;
            $aQuestions['i' . $iId] = BxDolAiJudge::noul(
                'Does item i' . $iId . ' satisfy the request? Judge by meaning, not by matching words: an item can answer the request with completely different wording.'
            );
        }

        $aAnswers = $this->_oJudge->askSafe($aState, $aQuestions);
        if (!$aAnswers)
            return [$aScores, 0, $iCached];

        foreach ($aAsk as $iId => $sText) {
            $a = $aAnswers['i' . $iId] ?? null;
            if (!is_array($a) || !isset($a['noul']))
                continue;

            $fScore = (float)$a['noul'];
            $aScores[$iId] = $fScore;
            $this->_oCache->setData($this->_getCacheKey('item', $sObject . '_' . $iId . '_' . $sQueryKey), $fScore, self::CACHE_TTL_ITEM);
        }

        return [$aScores, count($aAsk), $iCached];
    }

    protected function _getCacheKey(string $sType, string $sId): string
    {
        return 'sys_ai_search_' . $sType . '_' . md5($sId) . '_' . bx_site_hash() . '.php';
    }
}

/** @} */
