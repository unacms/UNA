<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Natural language query -> extended search params for ANY extended search object
 * (sys_objects_search_extended, fields configured in Studio > Forms > Search fields).
 *
 * "python course under 50 in Berlin" for object bx_market ->
 *   search_params = [
 *     cat          => [type => select_multiple, value => [3],       operator => in],
 *     price_single => [type => text_range,      value => ['', 50],  operator => between],
 *     location     => [type => location,        value => [array => [0, 0, '', '', 'Berlin', ''], string => 'Berlin'], operator => locate],
 *     title        => [type => text,            value => 'python',  operator => like],
 *   ]
 * which is exactly what BxDolSearchExtended::getResults(['search_params' => ...]) / the module's
 * get_search_result_extended consume. Questions to the judge model are generated from the
 * field list, so a field added or removed in Studio changes the parser automatically.
 *
 * Field search types handled: select / select_multiple / checkbox_set (pre-values list -> choice),
 * checkbox / switcher (noul), text_range / slider (numbers from the query + choice min/max/exact),
 * datepicker_range / datetime_range (calendar logic of BxDolAiSearchParser), location (city word +
 * country choice), text (topic words -> like). Others are ignored.
 */
class BxDolAiSearchExtParser extends BxDolAiSearchParser
{
    const LIST_OPTIONS_MAX = 250;
    const LIST_PROBABILITY_MIN = 0.3;
    const BOOL_MIN = 0.6;
    const RADIUS_DEFAULT_KM = 50;   // radius search when the query names a place but no distance
    const RADIUS_MAX_KM = 500;

    protected $_aFields = [];
    protected $_aNumbers = [];
    protected $_aTokens = [];
    protected $_sQuery = '';
    protected $_sObject = '';
    protected $_iRadius = 0;        // km, when the query says "within 20 km"

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolAiSearchExtParser();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    /**
     * Fields of an extended search object that the parser can ask about, for the block (chips legend).
     * @return array [name => [caption, kind]]
     */
    public function getFields(string $sObject): array
    {
        $aResult = [];
        foreach ($this->_loadFields($sObject) as $sName => $aField)
            $aResult[$sName] = ['caption' => $aField['caption'], 'kind' => $aField['kind']];

        return $aResult;
    }

    /**
     * @param $sObject extended search object name (e.g. bx_market)
     * @param $sQuery natural language query
     * @param $aOptions timezone, debug
     * @return array
     *   object, query, search_params (ready for get_results), chips [name => [field, caption, label, value]],
     *   confidence [name => float], judge => null | [model, ms, usage], error / request / answers (debug)
     */
    public function parseObject(string $sObject, string $sQuery, array $aOptions = []): array
    {
        $sQuery = trim(preg_replace('/\s+/u', ' ', $sQuery));
        $oTz = $this->_getTimezone($aOptions['timezone'] ?? '');
        $oNow = new DateTime('now', $oTz);

        $aResult = [
            'object' => $sObject,
            'query' => $sQuery,
            'search_params' => [],
            'filters' => [],
            'keyword_field' => '',
            'chips' => [],
            'confidence' => [],
            'judge' => null,
        ];

        $this->_sObject = $sObject;
        $this->_aFields = $this->_loadFields($sObject);
        if ($sQuery === '' || !$this->_oJudge || !$this->_aFields)
            return $aResult;

        $this->_sQuery = $sQuery;
        $this->_iRadius = $this->_getRadius($sQuery);
        $this->_aNumbers = $this->_getNumbers($sQuery);
        $this->_aTokens = $this->_getTopicTokens($sQuery);

        $aQuestions = $this->_getObjectQuestions();
        if (!$aQuestions)
            return $aResult;

        $aState = ['today' => $oNow->format('Y-m-d l'), 'query' => $sQuery];

        $fStart = microtime(true);
        $aAnswers = $this->_oJudge->askSafe($aState, $aQuestions);
        if (!$aAnswers) {
            if (!empty($aOptions['debug'])) {
                $aResult['request'] = $this->_oJudge->getLastRequest();
                $aResult['error'] = $this->_oJudge->getLastError() ?: 'empty answers';
            }
            return $aResult;
        }

        $this->_aAnswers = $aAnswers;
        $aResult['judge'] = [
            'model' => $this->_oJudge->getLastModel(),
            'ms' => (int)round((microtime(true) - $fStart) * 1000),
            'usage' => $this->_oJudge->getLastUsage(),
        ];
        if (!empty($aOptions['debug'])) {
            $aResult['request'] = $this->_oJudge->getLastRequest();
            $aResult['answers'] = $aAnswers;
        }

        foreach ($this->_aFields as $sName => $aField) {
            $aParam = null;
            switch ($aField['kind']) {
                case 'list':
                    $aParam = $this->_answerList($sName, $aField);
                    break;
                case 'bool':
                    $aParam = $this->_answerBool($sName, $aField);
                    break;
                case 'number':
                    continue 2; // handled once per group below
                case 'date':
                    $aParam = $this->_answerDate($sName, $aField, $oNow);
                    break;
                case 'location':
                    $aParam = $this->_answerLocation($sName, $aField);
                    break;
                case 'text':
                    $aParam = $this->_answerText($sName, $aField);
                    break;
            }

            if (!$aParam)
                continue;

            $aResult['search_params'][$sName] = [
                'type' => $aField['search_type'],
                'value' => $aParam['value'],
                'operator' => $aField['operator'],
            ];

            // same shape the search form would submit, for the page's own results block
            $aFilters = $this->_getFilters($sName, $aField, $aParam);
            foreach ($aFilters as $sKey => $mixedValue)
                $aResult['filters'][$sKey] = $mixedValue;

            $aResult['chips'][$sName] = [
                'field' => $sName,
                'caption' => $aField['caption'],
                'label' => $aParam['label'],
                'value' => $aParam['value'],
                'filter_keys' => array_keys($aFilters),
            ];
            $aResult['confidence'][$sName] = $aParam['confidence'];

            if ($aField['kind'] == 'text')
                $aResult['keyword_field'] = $sName;
        }

        $this->_applyNumbers($aResult);

        return $aResult;
    }

    /**
     * Numeric fields with the same caption are one thing for the user (Market has two "Price" fields:
     * one-time and recurring), so the query gets one constraint, one chip and a filter for every field
     * of the group. An upper bound / "free" is applied to all of them (conditions are ANDed and the
     * price a product does not use is 0); a lower bound or an exact value would then exclude everything,
     * so it goes to the field the model picked.
     */
    protected function _applyNumbers(array &$aResult)
    {
        $aGroups = $this->_getNumberGroups();
        if (!$aGroups)
            return;

        $sGroup = $this->_getNumberGroup($aGroups);
        if ($sGroup === '' || empty($aGroups[$sGroup]))
            return;

        $aParam = $this->_answerNumber();
        if (!$aParam)
            return;

        $aNames = $aGroups[$sGroup];
        if (!in_array($aParam['op'], ['max', 'zero'], true)) {
            $sPrimary = $this->_getNumberPrimaryField($aNames);
            $aNames = [$sPrimary];
        }

        $aFilterKeys = [];
        foreach ($aNames as $sName) {
            $aField = $this->_aFields[$sName];

            $aResult['search_params'][$sName] = [
                'type' => $aField['search_type'],
                'value' => $aParam['value'],
                'operator' => $aField['operator'],
            ];

            foreach ($this->_getFilters($sName, $aField, $aParam) as $sKey => $mixedValue) {
                $aResult['filters'][$sKey] = $mixedValue;
                $aFilterKeys[] = $sKey;
            }
        }

        $sChipId = reset($aNames);
        $aResult['chips'][$sChipId] = [
            'field' => $sChipId,
            'caption' => $sGroup,
            'label' => $aParam['label'],
            'value' => $aParam['value'],
            'filter_keys' => $aFilterKeys,
        ];
        $aResult['confidence'][$sChipId] = $aParam['confidence'];
    }

    /**
     * Numeric fields grouped by caption: [caption => [field name, ...]]
     */
    protected function _getNumberGroups(): array
    {
        $aGroups = [];
        foreach ($this->_aFields as $sName => $aField)
            if ($aField['kind'] == 'number')
                $aGroups[$aField['caption']][] = $sName;

        return $aGroups;
    }

    /**
     * Which group the query is about: the only one, or the one the model picked.
     */
    protected function _getNumberGroup(array $aGroups): string
    {
        if (count($aGroups) == 1)
            return (string)key($aGroups);

        list($sChoice, $fConfidence) = $this->_getChoice('num_field');
        if ($sChoice === '' || $sChoice == self::NONE || $fConfidence < self::CONFIDENCE_MIN || !isset($aGroups[$sChoice]))
            return '';

        return $sChoice;
    }

    /**
     * Field of the group a lower / exact bound is applied to: the one the model picked, else the first.
     */
    protected function _getNumberPrimaryField(array $aNames): string
    {
        if (count($aNames) > 1 && isset($this->_aAnswers['num_which'])) {
            list($sChoice, $fConfidence) = $this->_getChoice('num_which');
            if ($sChoice !== '' && $sChoice != self::NONE && $fConfidence >= self::CONFIDENCE_MIN && in_array($sChoice, $aNames, true))
                return $sChoice;
        }

        return reset($aNames);
    }

    /**
     * One parsed field -> values as the search form would submit them ($_POST keys),
     * so `get_results` (params.filters) builds exactly the same search as a manual form submit.
     * @return array [input name => value]
     */
    protected function _getFilters(string $sName, array $aField, array $aParam): array
    {
        switch ($aField['kind']) {
            case 'list':
                // select posts one value, multiple selects post an array
                return [$sName => $aField['multi'] ? (array)$aParam['value'] : (is_array($aParam['value']) ? reset($aParam['value']) : $aParam['value'])];

            case 'bool':
                return [$sName => 1];

            case 'number':
                // *_range inputs are rendered as name[] twice (from, to)
                return [$sName => [(string)$aParam['value'][0], (string)$aParam['value'][1]]];

            case 'date':
                // the form checker converts date strings to timestamps itself
                return [$sName => [$aParam['date_from'], $aParam['date_to']]];

            case 'location':
                // the main input holds the address string, the rest is read from {name}_{key} inputs
                $aLocation = $aParam['value']['array'];
                $aKeys = ['lat', 'lng', 'country', 'state', 'city', 'zip', 'street', 'street_number'];
                $aFilters = [$sName => $aParam['value']['string']];
                foreach ($aKeys as $iIndex => $sKey)
                    $aFilters[$sName . '_' . $sKey] = isset($aLocation[$iIndex]) ? $aLocation[$iIndex] : '';
                return $aFilters;

            case 'text':
            default:
                return [$sName => $aParam['value']];
        }
    }

    // fields ------------------------

    /**
     * Active fields of the extended search object, normalized:
     * [name => [caption, kind (list|bool|number|date|location|text), multi, values, search_type, operator, type]]
     */
    protected function _loadFields(string $sObject): array
    {
        bx_import('BxDolForm'); // BX_DATA_LISTS_KEY_PREFIX, used while reading the fields' pre-values
        $aObject = BxDolSearchExtendedQuery::getSearchObject($sObject);
        if (!$aObject || empty($aObject['fields']) || !is_array($aObject['fields']))
            return [];

        $aFields = [];
        foreach ($aObject['fields'] as $aField) {
            if (empty($aField['active']))
                continue;

            $sName = $aField['name'];
            $sSearchType = $aField['search_type'];
            $sOperator = $aField['search_operator'];
            $sCaption = trim(strip_tags(_t($aField['caption'])));
            if ($sCaption === '' || $sCaption == $aField['caption'])
                $sCaption = ucfirst(str_replace('_', ' ', $sName));

            $a = ['caption' => $sCaption, 'search_type' => $sSearchType, 'operator' => $sOperator, 'type' => $aField['type'], 'multi' => false, 'values' => []];

            switch ($sSearchType) {
                case 'select':
                case 'select_multiple':
                case 'checkbox_set':
                    $aValues = [];
                    if (!empty($aField['values']) && is_array($aField['values']))
                        foreach ($aField['values'] as $mixedKey => $mixedValue) {
                            if ($mixedKey === '' || $mixedKey === 0 || $mixedKey === '0' || is_array($mixedValue))
                                continue;
                            $aValues[(string)$mixedKey] = trim(strip_tags(_t((string)$mixedValue)));
                        }
                    if (count($aValues) < 1 || count($aValues) > self::LIST_OPTIONS_MAX)
                        continue 2;
                    $a['kind'] = 'list';
                    $a['multi'] = $sSearchType != 'select';
                    $a['values'] = $aValues;
                    break;

                case 'checkbox':
                case 'switcher':
                    $a['kind'] = 'bool';
                    break;

                case 'text_range':
                case 'slider':
                    $a['kind'] = 'number';
                    break;

                case 'datepicker_range':
                case 'datetime_range':
                    $a['kind'] = 'date';
                    break;

                case 'location':
                case 'location_radius':
                    $a['kind'] = 'location';
                    break;

                case 'text':
                    if ($sOperator != 'like' || in_array($aField['type'], ['textarea']))
                        continue 2;
                    $a['kind'] = 'text';
                    break;

                default:
                    continue 2;
            }

            $aFields[$sName] = $a;
        }

        return $aFields;
    }

    // questions ------------------------

    protected function _getObjectQuestions(): array
    {
        $aQuestions = [];
        $aDateFields = [];
        $aTextFields = [];
        $aNumberFields = [];
        $bLocation = false;

        foreach ($this->_aFields as $sName => $aField) {
            switch ($aField['kind']) {
                case 'list':
                    $aCriteria = $aField['values'];
                    $aCriteria[self::NONE] = "The query does not specify {$aField['caption']}";
                    $aQuestions["f_{$sName}"] = BxDolAiJudge::choice(
                        "Which {$aField['caption']} does the user ask for? The query may be in any language; match by meaning." . ($aField['multi'] ? ' Several may apply.' : ''),
                        $aCriteria
                    );
                    break;

                case 'bool':
                    $aQuestions["f_{$sName}"] = BxDolAiJudge::noul("Does the user explicitly ask for items where \"{$aField['caption']}\" is true / enabled / yes?");
                    break;

                case 'number':
                    $aNumberFields[$sName] = $aField['caption'];
                    break;

                case 'date':
                    $aDateFields[$sName] = $aField['caption'];
                    break;

                case 'location':
                    $bLocation = true;
                    break;

                case 'text':
                    $aTextFields[$sName] = $aField['caption'];
                    break;
            }
        }

        if ($aNumberFields) {
            $sCaptions = implode(' / ', array_unique(array_values($aNumberFields)));

            // one constraint per query: which numeric thing it is about, and how
            $aGroups = $this->_getNumberGroups();
            if (count($aGroups) > 1) {
                $aCriteria = [];
                foreach ($aGroups as $sCaption => $aNames)
                    $aCriteria[$sCaption] = $sCaption;
                $aQuestions['num_field'] = BxDolAiJudge::choice(
                    'If the query limits a number, which one does it mean?',
                    $aCriteria + [self::NONE => 'The query does not limit any of these']
                );
            }

            // fields sharing a caption are alternatives (one-time vs recurring price): for a lower or
            // exact bound only one of them can be meant
            foreach ($aGroups as $sCaption => $aNames) {
                if (count($aNames) < 2)
                    continue;
                $aCriteria = [];
                foreach ($aNames as $sName)
                    $aCriteria[$sName] = ucfirst(str_replace('_', ' ', $sName));
                $aQuestions['num_which'] = BxDolAiJudge::choice(
                    "\"{$sCaption}\" is stored in several ways. Which one does the query mean?",
                    $aCriteria + [self::NONE => 'Not specified']
                );
                break;
            }

            if ($this->_aNumbers) {
                $sNumbers = implode(', ', $this->_aNumbers);
                $aQuestions['num_op'] = BxDolAiJudge::choice(
                    "The query contains the number(s) {$sNumbers}. How do they limit {$sCaptions}? Signs >, <, >=, <= and words under, over, from, up to, at least, max, min say how.",
                    [
                        'max' => 'at most / under / below / cheaper than the number (<, <=, under, up to, max)',
                        'min' => 'at least / over / above / more than the number (>, >=, from, at least, min)',
                        'exact' => 'exactly the number',
                        'range' => 'between two numbers',
                        self::NONE => 'The number is not a limit for it (a date, a quantity of something else, part of a name)',
                    ]
                );
            }

            $aQuestions['num_zero'] = BxDolAiJudge::noul("Does the user ask for items that are free — no charge, cost nothing, zero {$sCaptions}?");
        }

        if ($aDateFields) {
            $aQuestions['time_mode'] = BxDolAiJudge::choice('How is the date written in the query?', [
                'absolute' => 'A calendar date: 23/09, 23.09.2026, September 23, 23 sep',
                'relative' => 'Relative to today: today, yesterday, tomorrow, this/last/next week, this weekend, this/last/next month',
                self::NONE => 'No date in the query',
            ]);
            $aDays = [];
            for ($i = 1; $i <= 31; $i++)
                $aDays[(string)$i] = "Day {$i} of the month";
            $aDays[self::NONE] = 'No day of month is written';
            $aQuestions['day'] = BxDolAiJudge::choice('Which day of the month is written in the query? In numeric dates like 23/09 the day comes first.', $aDays);
            $aQuestions['month'] = BxDolAiJudge::choice('Which month is written in the query? In numeric dates like 23/09 the month comes second.', [
                '1' => 'January', '2' => 'February', '3' => 'March', '4' => 'April', '5' => 'May', '6' => 'June',
                '7' => 'July', '8' => 'August', '9' => 'September', '10' => 'October', '11' => 'November', '12' => 'December',
                self::NONE => 'No month is written',
            ]);
            $aQuestions['relative'] = BxDolAiJudge::choice('If the date is relative to today, which period is meant?', $this->_aRelative + [
                self::NONE => 'The date is not relative, or there is no date',
            ]);
            if (count($aDateFields) > 1)
                $aQuestions['date_field'] = BxDolAiJudge::choice('If the query mentions a date, which of these dates is meant?', $aDateFields + [
                    self::NONE => 'No date in the query',
                ]);
        }

        if ($bLocation && $this->_aTokens) {
            // the word is geocoded afterwards, so any language and spelling works ("в берлин" -> Berlin)
            $aQuestions['loc_city'] = BxDolAiJudge::choice(
                'Which word names a place the items should be at — a city, town, area or country?',
                $this->_tokensCriteria() + [self::NONE => 'No place in the query']
            );
        }

        if ($aTextFields && $this->_aTokens) {
            $aTopicCriteria = $this->_tokensCriteria(true);
            if ($aTopicCriteria)
                $aQuestions['topic'] = BxDolAiJudge::choice(
                    'Which word names the topic, subject, product, title or name to search for in the text of the items? Words naming a kind of content, categories, places, dates, numbers, prices, time words, verbs like "find/show" and function words are NOT topic words.',
                    $aTopicCriteria + [self::NONE => 'No topic word: the query only has categories, places, numbers or time']
                );
        }

        return $aQuestions;
    }

    protected function _tokensCriteria(bool $bSkipFieldWords = false): array
    {
        $aSkip = $bSkipFieldWords ? $this->_getFieldWords() : [];

        $aCriteria = [];
        foreach ($this->_aTokens as $sToken)
            if (!isset($aSkip[mb_strtolower($sToken)]))
                $aCriteria[$sToken] = 'The word "' . $sToken . '"';

        return $aCriteria;
    }

    /**
     * Words of the field captions ("price", "category", "location"...): they name a filter,
     * not the thing being searched for, so they must not become the keyword.
     */
    protected function _getFieldWords(): array
    {
        $aWords = [];
        foreach ($this->_aFields as $aField) {
            foreach (preg_split('/[^\p{L}\p{N}]+/u', $aField['caption'], -1, PREG_SPLIT_NO_EMPTY) as $sWord)
                if (mb_strlen($sWord) > 2)
                    $aWords[mb_strtolower($sWord)] = true;
        }

        return $aWords;
    }

    /**
     * Numbers written in the query (integers / decimals), in order of appearance; parts of dates (23/09) are skipped.
     */
    protected function _getNumbers(string $sQuery): array
    {
        // drop date literals (23/09, 23.09.2026) but keep decimals like 50.5
        $sClean = preg_replace_callback('/(?<![\d.])(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2}|\d{4}))?(?![\d.])/', function ($m) {
            $iA = (int)$m[1];
            $iB = (int)$m[2];
            $bDate = !empty($m[3]) || ($iA >= 1 && $iA <= 31 && $iB >= 1 && $iB <= 12) || ($iA >= 1 && $iA <= 12 && $iB >= 1 && $iB <= 31);
            return $bDate ? ' ' : $m[0];
        }, $sQuery);
        if (!preg_match_all('/(?<![\p{L}\d])(\d+(?:[.,]\d+)?)(?![\d])/u', $sClean, $m))
            return [];

        $aNumbers = [];
        foreach ($m[1] as $s) {
            $fNumber = (float)str_replace(',', '.', $s);
            if ($this->_iRadius > 0 && $fNumber == (float)$this->_iRadius)
                continue; // it is the search radius, not a value of a field
            $aNumbers[] = $fNumber;
        }

        return $aNumbers;
    }

    // answers ------------------------

    /**
     * @return array|null [value, label, confidence]
     */
    protected function _answerList(string $sName, array $aField)
    {
        list($sChoice, $fConfidence) = $this->_getChoice("f_{$sName}");
        if ($sChoice === '' || $sChoice == self::NONE || $fConfidence < self::CONFIDENCE_MIN)
            return null;

        $aKeys = [];
        if ($aField['multi']) {
            $aProbabilities = $this->_getProbabilities("f_{$sName}");
            foreach ($aField['values'] as $sKey => $sTitle)
                if ($sKey == $sChoice || ($aProbabilities[$sKey] ?? 0) >= self::LIST_PROBABILITY_MIN)
                    $aKeys[] = $sKey;
        }
        if (!$aKeys)
            $aKeys = [$sChoice];

        $aTitles = [];
        foreach ($aKeys as $sKey)
            $aTitles[] = $aField['values'][$sKey] ?? $sKey;

        return [
            'value' => $aField['operator'] == 'in' || $aField['operator'] == 'and' ? $aKeys : $aKeys[0],
            'label' => implode(', ', $aTitles),
            'confidence' => $fConfidence,
        ];
    }

    protected function _answerBool(string $sName, array $aField)
    {
        $a = $this->_aAnswers["f_{$sName}"] ?? null;
        if (!is_array($a) || !isset($a['noul']) || (float)$a['noul'] < self::BOOL_MIN)
            return null;

        return ['value' => 1, 'label' => $aField['caption'], 'confidence' => (float)$a['noul']];
    }

    /**
     * The numeric constraint of the query: ['op' => max|min|exact|range|zero, 'value' => [from, to], 'label', 'confidence']
     */
    protected function _answerNumber()
    {
        $aZero = $this->_aAnswers['num_zero'] ?? null;
        $bZero = is_array($aZero) && isset($aZero['noul']) && (float)$aZero['noul'] >= self::BOOL_MIN;

        if (!$this->_aNumbers) {
            if (!$bZero)
                return null;

            return ['op' => 'zero', 'value' => ['', 0], 'label' => '0', 'confidence' => (float)$aZero['noul']];
        }

        list($sChoice, $fConfidence) = $this->_getChoice('num_op');
        if ($bZero && ($sChoice === '' || $sChoice == self::NONE || $fConfidence < self::CONFIDENCE_MIN))
            return ['op' => 'zero', 'value' => ['', 0], 'label' => '0', 'confidence' => (float)$aZero['noul']];

        if ($sChoice === '' || $sChoice == self::NONE || $fConfidence < self::CONFIDENCE_MIN)
            return null;

        $fNumber = $this->_aNumbers[0];
        // "> 0" / ">= 0" is no constraint at all (UNA's between ignores an empty/zero lower bound)
        if ($sChoice == 'min' && $fNumber <= 0)
            return null;
        $sFormatted = rtrim(rtrim(number_format($fNumber, 2, '.', ''), '0'), '.');
        switch ($sChoice) {
            case 'max':
                return ['op' => 'max', 'value' => ['', $fNumber], 'label' => "≤ {$sFormatted}", 'confidence' => $fConfidence];
            case 'min':
                return ['op' => 'min', 'value' => [$fNumber, ''], 'label' => "≥ {$sFormatted}", 'confidence' => $fConfidence];
            case 'exact':
                return ['op' => 'exact', 'value' => [$fNumber, $fNumber], 'label' => "= {$sFormatted}", 'confidence' => $fConfidence];
            case 'range':
                if (count($this->_aNumbers) < 2)
                    return null;
                $fMin = min($this->_aNumbers[0], $this->_aNumbers[1]);
                $fMax = max($this->_aNumbers[0], $this->_aNumbers[1]);
                return ['op' => 'range', 'value' => [$fMin, $fMax], 'label' => rtrim(rtrim(number_format($fMin, 2, '.', ''), '0'), '.') . ' – ' . rtrim(rtrim(number_format($fMax, 2, '.', ''), '0'), '.'), 'confidence' => $fConfidence];
        }

        return null;
    }

    protected function _answerDate(string $sName, array $aField, DateTime $oNow)
    {
        // several date fields: the model picks which one the date is about
        if (isset($this->_aAnswers['date_field'])) {
            list($sChoice, $fConfidence) = $this->_getChoice('date_field');
            if ($sChoice != $sName || $fConfidence < self::CONFIDENCE_MIN)
                return null;
        }

        $aDate = $this->_getDate($this->_sQuery, $oNow, '');
        if (!$aDate)
            return null;

        $oTz = $oNow->getTimezone();
        $oFrom = new DateTime($aDate['date']['from'] . ' 00:00:00', $oTz);
        $oTo = new DateTime($aDate['date']['to'] . ' 23:59:59', $oTz);

        $bTimestamps = $aField['search_type'] == 'datetime_range' || $aField['type'] == 'datetime';
        $mixedFrom = $bTimestamps ? $oFrom->getTimestamp() : $oFrom->format('Y-m-d');
        $mixedTo = $bTimestamps ? $oTo->getTimestamp() : $oTo->format('Y-m-d');

        $sLabel = $aDate['date']['from'] == $aDate['date']['to'] ? $aDate['date']['from'] : $aDate['date']['from'] . ' – ' . $aDate['date']['to'];
        return [
            'value' => [$mixedFrom, $mixedTo],
            'date_from' => $bTimestamps ? $oFrom->format('Y-m-d H:i:s') : $oFrom->format('Y-m-d'),
            'date_to' => $bTimestamps ? $oTo->format('Y-m-d H:i:s') : $oTo->format('Y-m-d'),
            'label' => $sLabel,
            'confidence' => $aDate['confidence'],
        ];
    }

    protected function _answerLocation(string $sName, array $aField)
    {
        list($sPlace, $fConfidence) = $this->_getChoice('loc_city');
        if ($sPlace === '' || $sPlace == self::NONE || $fConfidence < self::CONFIDENCE_MIN)
            return null;

        $aGeo = $this->_geocode($sPlace);
        if (!$aGeo)
            return null;

        $bRadius = $aField['search_type'] == 'location_radius';
        $iRadius = $this->_iRadius > 0 ? $this->_iRadius : self::RADIUS_DEFAULT_KM;

        $sLabel = $aGeo['label'] !== '' ? $aGeo['label'] : $sPlace;
        if ($bRadius)
            $sLabel .= ' +' . $iRadius . ' km';

        // location_radius searches a box around the coordinates; plain location matches the stored
        // country / city, so the geocoder's normalized names are used instead of the typed word
        $aValue = [
            (float)$aGeo['lat'],
            (float)$aGeo['lng'],
            $bRadius ? '' : $aGeo['country'],
            '',
            $bRadius ? '' : $aGeo['city'],
            '',
            '',
            '',
        ];
        if ($bRadius)
            $aValue[] = $iRadius;

        return [
            'value' => [
                'array' => $aValue,
                'string' => $sLabel,
            ],
            'label' => $sLabel,
            'confidence' => $fConfidence,
        ];
    }

    /**
     * Place name (in any language) -> coordinates and normalized names, through the site's location
     * field object (Nominatim by default). Cached, the geocoder is a remote service.
     * @return array|null [lat, lng, country (2 letters), city, label]
     */
    protected function _geocode(string $sPlace)
    {
        $sPlace = trim($sPlace);
        if ($sPlace === '')
            return null;

        $oDb = BxDolDb::getInstance();
        $sCacheKey = 'sys_ai_search_geo_' . md5(mb_strtolower($sPlace));
        $mixedCached = $oDb->getCache($sCacheKey, '');
        if (is_array($mixedCached))
            return $mixedCached ?: null;

        $o = BxDolLocationField::getObjectInstance(getParam('sys_location_field_default'));
        if (!$o || !method_exists($o, 'getLocation'))
            $o = BxDolLocationField::getObjectInstance('sys_plain'); // Nominatim, no API key needed
        if (!$o || !method_exists($o, 'getLocation'))
            return null;

        $aLocation = $o->getLocation(['q' => $sPlace]);
        if (empty($aLocation) || !isset($aLocation['lat'], $aLocation['lon'])) {
            $oDb->setCache($sCacheKey, []);
            return null;
        }

        $aAddress = !empty($aLocation['address']) && is_array($aLocation['address']) ? $aLocation['address'] : [];
        $sCity = '';
        foreach (['city', 'town', 'village', 'municipality', 'county', 'state'] as $sKey)
            if (!empty($aAddress[$sKey])) {
                $sCity = (string)$aAddress[$sKey];
                break;
            }

        $aResult = [
            'lat' => (float)$aLocation['lat'],
            'lng' => (float)$aLocation['lon'],
            'country' => !empty($aAddress['country_code']) ? strtoupper((string)$aAddress['country_code']) : '',
            'city' => $sCity,
            'label' => trim(implode(', ', array_filter([$sCity, !empty($aAddress['country']) ? $aAddress['country'] : '']))),
        ];

        $oDb->setCache($sCacheKey, $aResult);

        return $aResult;
    }

    /**
     * "in 20 km", "в радиусе 20 км" -> 20; the number is not a value of any field then.
     */
    protected function _getRadius(string $sQuery): int
    {
        if (!preg_match('/(\d{1,4})\s*(km|k\.?m\.?|км|mi|miles?|миль|мили)\b/iu', $sQuery, $m))
            return 0;

        $iRadius = (int)$m[1];

        return $iRadius > 0 && $iRadius <= self::RADIUS_MAX_KM ? $iRadius : 0;
    }

    protected function _answerText(string $sName, array $aField)
    {
        // the keyword goes to the first text field only (conditions are ANDed by the engine)
        foreach ($this->_aFields as $sOther => $aOther) {
            if ($aOther['kind'] == 'text') {
                if ($sOther != $sName)
                    return null;
                break;
            }
        }

        list($sKeyword, $fConfidence) = $this->_getKeyword(array_keys($this->_tokensCriteria(true)));
        if ($sKeyword === '')
            return null;

        return ['value' => $sKeyword, 'label' => $sKeyword, 'confidence' => $fConfidence];
    }

    /**
     * The extended parser has no time_field question: a date always refers to the field's own date.
     */
    protected function _getDate(string $sQuery, DateTime $oNow, string $sSection)
    {
        if (!isset($this->_aAnswers['time_field']))
            $this->_aAnswers['time_field'] = ['type' => 'choice', 'choice' => 'created', 'confidence' => 1.0, 'probabilities' => ['created' => 1.0]];

        return parent::_getDate($sQuery, $oNow, $sSection);
    }
}

/** @} */
