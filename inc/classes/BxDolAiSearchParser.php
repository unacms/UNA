<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * Natural language search query -> structured search filter, using a judge AI model (see BxDolAiJudge).
 *
 * "all events starting on 23/09" ->
 *   section = bx_events, keyword = '', date = [field => starts, from => 2026-09-23, to => 2026-09-23]
 *
 * The judge only answers closed questions (which section, which time field, day, month, relative anchor,
 * which words are the topic); dates are assembled in code. When no judge model is configured the query
 * is returned as a plain keyword, so callers work exactly as before.
 */
class BxDolAiSearchParser extends BxDolFactory
{
    const CONFIDENCE_MIN = 0.35;
    const TOPIC_PROBABILITY_MIN = 0.2;
    const TOPIC_TOKENS_MAX = 60;

    const NONE = 'none';

    protected $_oJudge;
    protected $_aAnswers = [];

    /**
     * English hints per well-known search section; the section title (site language) is always appended.
     */
    protected $_aSectionHints = [
        'bx_events' => 'Events, meetups, happenings, things scheduled on a date',
        'bx_posts' => 'Posts, articles, blog entries, news',
        'bx_persons' => 'People, members, users, profiles',
        'bx_organizations' => 'Organizations, companies',
        'bx_groups' => 'Groups, communities',
        'bx_spaces' => 'Spaces, communities',
        'bx_channels' => 'Channels, hashtags, topics',
        'bx_forum' => 'Forum discussions, threads, questions',
        'bx_courses' => 'Courses, lessons, learning',
        'bx_market' => 'Products, market listings, things for sale',
        'bx_jobs' => 'Jobs, vacancies',
        'bx_polls' => 'Polls, votes',
        'bx_photos' => 'Photos, pictures',
        'bx_videos' => 'Videos',
        'bx_files' => 'Files, documents',
        'bx_albums' => 'Albums, media collections',
        'bx_timeline' => 'Feed updates, timeline',
        'bx_classes' => 'Classes, schedules',
        'bx_wiki' => 'Wiki pages, documentation',
        'bx_tasks' => 'Tasks, to-dos',
    ];

    protected $_aRelative = [
        'today' => 'Today',
        'yesterday' => 'Yesterday',
        'tomorrow' => 'Tomorrow',
        'weekend' => 'This weekend, Saturday or Sunday',
        'this_week' => 'This week',
        'last_week' => 'Last week, the previous week',
        'next_week' => 'Next week',
        'this_month' => 'This month',
        'last_month' => 'Last month, the previous month',
        'next_month' => 'Next month',
    ];

    protected function __construct()
    {
        parent::__construct();
        $this->_oJudge = BxDolAiJudge::getInstance();
    }

    public static function getInstance()
    {
        if (!isset($GLOBALS['bxDolClasses'][__CLASS__]))
            $GLOBALS['bxDolClasses'][__CLASS__] = new BxDolAiSearchParser();

        return $GLOBALS['bxDolClasses'][__CLASS__];
    }

    public function isAvailable(): bool
    {
        return (bool)$this->_oJudge;
    }

    /**
     * @param $sQuery natural language query
     * @param $aOptions
     *   sections  - [name => title] search sections the user may search in (required for section detection)
     *   timezone  - IANA timezone of the user, used for "today"/"tomorrow" and day boundaries
     *   debug     - include raw judge answers in the result
     * @return array
     *   query, keyword, section, section_title,
     *   date => null | [field (starts|ends|created), mode (absolute|relative), anchor, from (Y-m-d), to (Y-m-d)],
     *   confidence => [section, date, keyword], judge => null | [model, ms, usage]
     */
    public function parse(string $sQuery, array $aOptions = []): array
    {
        $sQuery = trim(preg_replace('/\s+/u', ' ', $sQuery));
        $aSections = !empty($aOptions['sections']) && is_array($aOptions['sections']) ? $aOptions['sections'] : [];
        $oTz = $this->_getTimezone($aOptions['timezone'] ?? '');

        $aResult = [
            'query' => $sQuery,
            'keyword' => $sQuery,
            'section' => '',
            'section_title' => '',
            'date' => null,
            'confidence' => ['section' => 0, 'date' => 0, 'keyword' => 0],
            'judge' => null,
        ];

        if ($sQuery === '' || !$this->_oJudge)
            return $aResult;

        $aTokens = $this->_getTopicTokens($sQuery);
        $aQuestions = $this->_getQuestions($aSections, $aTokens);

        $oNow = new DateTime('now', $oTz);
        $aState = [
            'today' => $oNow->format('Y-m-d l'),
            'query' => $sQuery,
        ];

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

        // section
        list($sSection, $fConfidence) = $this->_getChoice('section');
        if ($sSection && $sSection != 'any' && isset($aSections[$sSection]) && $fConfidence >= self::CONFIDENCE_MIN) {
            $aResult['section'] = $sSection;
            $aResult['section_title'] = $aSections[$sSection];
        }
        $aResult['confidence']['section'] = $fConfidence;

        // date
        $aDate = $this->_getDate($sQuery, $oNow, $aResult['section']);
        if ($aDate) {
            $aResult['date'] = $aDate['date'];
            $aResult['confidence']['date'] = $aDate['confidence'];

            // a bare date with no section makes sense for events only
            if (!$aResult['section'] && in_array($aDate['date']['field'], ['starts', 'ends']) && isset($aSections['bx_events'])) {
                $aResult['section'] = 'bx_events';
                $aResult['section_title'] = $aSections['bx_events'];
            }
        }

        // keyword
        list($sKeyword, $fConfidence) = $this->_getKeyword($aTokens);
        $aResult['keyword'] = $sKeyword;
        $aResult['confidence']['keyword'] = $fConfidence;

        return $aResult;
    }

    // questions ------------------------

    protected function _getQuestions(array $aSections, array $aTokens): array
    {
        $aQuestions = [];

        if ($aSections) {
            $aCriteria = [];
            foreach ($aSections as $sName => $sTitle)
                $aCriteria[$sName] = (isset($this->_aSectionHints[$sName]) ? $this->_aSectionHints[$sName] . ' - ' : '') . $sTitle;
            $aCriteria['any'] = 'Not specified, everything, or a kind of content not listed';

            $aQuestions['section'] = BxDolAiJudge::choice('Which kind of content does the user want to find? The query may be in any language.', $aCriteria);
        }

        $aQuestions['time_field'] = BxDolAiJudge::choice('If the query mentions a date or time, which moment of the items is meant?', [
            'starts' => 'When the item starts, happens, takes place, is held (e.g. events on a date)',
            'ends' => 'When the item ends, its deadline or closing date',
            'created' => 'When the item was posted, published, created, added',
            self::NONE => 'The query has no date or time reference',
        ]);

        $aQuestions['time_mode'] = BxDolAiJudge::choice('How is the date written in the query?', [
            'absolute' => 'A calendar date: 23/09, 23.09.2026, September 23, 23 sep',
            'relative' => 'Relative to today: today, tomorrow, this week, next week, this weekend, this month',
            self::NONE => 'No date in the query',
        ]);

        $aDays = [];
        for ($i = 1; $i <= 31; $i++)
            $aDays[(string)$i] = "Day {$i} of the month";
        $aDays[self::NONE] = 'No day of month is written';
        $aQuestions['day'] = BxDolAiJudge::choice('Which day of the month is written in the query? In numeric dates like 23/09 or 23.09 the day comes first.', $aDays);

        $aQuestions['month'] = BxDolAiJudge::choice('Which month is written in the query? In numeric dates like 23/09 or 23.09 the month comes second.', [
            '1' => 'January', '2' => 'February', '3' => 'March', '4' => 'April', '5' => 'May', '6' => 'June',
            '7' => 'July', '8' => 'August', '9' => 'September', '10' => 'October', '11' => 'November', '12' => 'December',
            self::NONE => 'No month is written',
        ]);

        $aQuestions['relative'] = BxDolAiJudge::choice('If the date is relative to today, which period is meant?', $this->_aRelative + [
            self::NONE => 'The date is not relative, or there is no date',
        ]);

        if ($aTokens) {
            $aCriteria = [];
            foreach ($aTokens as $sToken)
                $aCriteria[$sToken] = 'The word "' . $sToken . '"';
            $aCriteria[self::NONE] = 'No topic word: the query only names a kind of content and/or a time';

            $aQuestions['topic'] = BxDolAiJudge::choice('Which word names the topic, subject, name or thing to search for? Words that only name a kind of content (events, posts, people, groups, courses...), dates, time words (today, tomorrow, week), verbs like "find/show/start" and function words are NOT topic words.', $aCriteria);
        }

        return $aQuestions;
    }

    /**
     * Candidate words for the keyword: letters only, 2+ chars, unique, original order.
     */
    protected function _getTopicTokens(string $sQuery): array
    {
        $aWords = preg_split('/[^\p{L}\p{N}]+/u', $sQuery, -1, PREG_SPLIT_NO_EMPTY);

        $aTokens = [];
        foreach ($aWords as $sWord) {
            if (mb_strlen($sWord) < 2 || preg_match('/\p{N}/u', $sWord))
                continue;
            $sKey = mb_strtolower($sWord);
            if (isset($aTokens[$sKey]) || $sKey == self::NONE || $sKey == 'any')
                continue;
            $aTokens[$sKey] = $sWord;
            if (count($aTokens) >= self::TOPIC_TOKENS_MAX)
                break;
        }

        return array_values($aTokens);
    }

    // answers ------------------------

    /**
     * @return array [choice, confidence]
     */
    protected function _getChoice(string $sId): array
    {
        $a = $this->_aAnswers[$sId] ?? null;
        if (!is_array($a) || !isset($a['choice']))
            return ['', 0.0];

        return [(string)$a['choice'], (float)($a['confidence'] ?? 0)];
    }

    protected function _getProbabilities(string $sId): array
    {
        $a = $this->_aAnswers[$sId] ?? null;
        return is_array($a) && isset($a['probabilities']) && is_array($a['probabilities']) ? $a['probabilities'] : [];
    }

    /**
     * @return array|null ['date' => [field, mode, anchor, from, to], 'confidence' => float]
     */
    protected function _getDate(string $sQuery, DateTime $oNow, string $sSection)
    {
        list($sField, $fFieldConfidence) = $this->_getChoice('time_field');
        list($sMode, $fModeConfidence) = $this->_getChoice('time_mode');

        // exact numeric date in the query beats the model's reading of day/month
        $aLiteral = $this->_getLiteralDate($sQuery);

        if (!$aLiteral && ($sMode == self::NONE || $sMode == '' || $fModeConfidence < self::CONFIDENCE_MIN))
            return null;

        if (!in_array($sField, ['starts', 'ends', 'created']))
            $sField = $sSection && $sSection != 'bx_events' ? 'created' : 'starts';

        $iYear = (int)$oNow->format('Y');
        $sMode = $aLiteral ? 'absolute' : $sMode;

        if ($sMode == 'relative') {
            list($sAnchor, $fAnchorConfidence) = $this->_getChoice('relative');
            if (!isset($this->_aRelative[$sAnchor]) || $fAnchorConfidence < self::CONFIDENCE_MIN)
                return null;

            list($oFrom, $oTo) = $this->_getRelativeRange($sAnchor, $oNow);
            return [
                'date' => ['field' => $sField, 'mode' => 'relative', 'anchor' => $sAnchor, 'from' => $oFrom->format('Y-m-d'), 'to' => $oTo->format('Y-m-d')],
                'confidence' => min($fFieldConfidence, $fModeConfidence, $fAnchorConfidence),
            ];
        }

        // absolute
        $fConfidence = min($fFieldConfidence, $fModeConfidence);
        if ($aLiteral) {
            list($iDay, $iMonth, $iLiteralYear) = $aLiteral;
            $fConfidence = max($fConfidence, $fFieldConfidence);
        }
        else {
            list($sDay, $fDayConfidence) = $this->_getChoice('day');
            list($sMonth, $fMonthConfidence) = $this->_getChoice('month');
            if ($sDay == self::NONE || $sMonth == self::NONE || !is_numeric($sDay) || !is_numeric($sMonth))
                return null;

            $iDay = (int)$sDay;
            $iMonth = (int)$sMonth;
            $iLiteralYear = 0;
            $fConfidence = min($fConfidence, $fDayConfidence, $fMonthConfidence);
        }

        if ($fConfidence < self::CONFIDENCE_MIN)
            return null;

        if ($iLiteralYear)
            $iYear = $iLiteralYear;
        else {
            // no year stated: nearest sensible one
            if (checkdate($iMonth, $iDay, $iYear)) {
                $oCandidate = (clone $oNow)->setDate($iYear, $iMonth, $iDay)->setTime(0, 0, 0);
                $iDiffDays = (int)$oNow->diff($oCandidate)->format('%r%a');
                if ($sField == 'created' && $iDiffDays > 1)
                    $iYear--;
                elseif ($sField != 'created' && $iDiffDays < -30)
                    $iYear++;
            }
        }

        if (!checkdate($iMonth, $iDay, $iYear))
            return null;

        $sDate = sprintf('%04d-%02d-%02d', $iYear, $iMonth, $iDay);
        return [
            'date' => ['field' => $sField, 'mode' => 'absolute', 'anchor' => '', 'from' => $sDate, 'to' => $sDate],
            'confidence' => $fConfidence,
        ];
    }

    /**
     * 23/09, 23.09, 23-09, 23/09/2026, 23.09.26 -> [day, month, year|0]; null when absent or impossible.
     */
    protected function _getLiteralDate(string $sQuery)
    {
        if (!preg_match('/(?<![\d\/.\-])(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2}|\d{4}))?(?![\d\/.\-])/', $sQuery, $m))
            return null;

        $iDay = (int)$m[1];
        $iMonth = (int)$m[2];
        $iYear = isset($m[3]) ? (int)$m[3] : 0;
        if ($iYear && $iYear < 100)
            $iYear += 2000;

        if ($iMonth > 12 && $iDay <= 12) // 09/23 written month-first
            list($iDay, $iMonth) = [$iMonth, $iDay];

        if ($iDay < 1 || $iDay > 31 || $iMonth < 1 || $iMonth > 12)
            return null;

        return [$iDay, $iMonth, $iYear];
    }

    /**
     * @return array [DateTime from, DateTime to]
     */
    protected function _getRelativeRange(string $sAnchor, DateTime $oNow): array
    {
        $oFrom = (clone $oNow)->setTime(0, 0, 0);
        $oTo = clone $oFrom;
        $iDow = (int)$oNow->format('N'); // 1 = Monday .. 7 = Sunday

        switch ($sAnchor) {
            case 'yesterday':
                $oFrom->modify('-1 day');
                $oTo = clone $oFrom;
                break;
            case 'tomorrow':
                $oFrom->modify('+1 day');
                $oTo = clone $oFrom;
                break;
            case 'last_week':
                $oFrom->modify('-' . ($iDow + 6) . ' days');
                $oTo = (clone $oFrom)->modify('+6 days');
                break;
            case 'last_month':
                $oFrom->modify('first day of last month');
                $oTo = (clone $oFrom)->modify('last day of this month');
                break;
            case 'next_month':
                $oFrom->modify('first day of next month');
                $oTo = (clone $oFrom)->modify('last day of this month');
                break;
            case 'weekend':
                $oFrom->modify($iDow == 7 ? '-1 day' : '+' . (6 - $iDow) . ' days');
                $oTo = (clone $oFrom)->modify('+1 day');
                break;
            case 'this_week':
                $oFrom->modify('-' . ($iDow - 1) . ' days');
                $oTo = (clone $oFrom)->modify('+6 days');
                break;
            case 'next_week':
                $oFrom->modify('+' . (8 - $iDow) . ' days');
                $oTo = (clone $oFrom)->modify('+6 days');
                break;
            case 'this_month':
                $oFrom->modify('first day of this month');
                $oTo = (clone $oFrom)->modify('last day of this month');
                break;
            case 'today':
            default:
                break;
        }

        return [$oFrom, $oTo];
    }

    /**
     * @return array [keyword, confidence]
     */
    protected function _getKeyword(array $aTokens): array
    {
        if (!$aTokens || !isset($this->_aAnswers['topic']))
            return ['', 0.0];

        list($sChoice, $fConfidence) = $this->_getChoice('topic');
        $aProbabilities = $this->_getProbabilities('topic');

        if ($sChoice == self::NONE || ($aProbabilities[self::NONE] ?? 0) > 0.5)
            return ['', $fConfidence];

        $aKeyword = [];
        foreach ($aTokens as $sToken)
            if ($sToken == $sChoice || ($aProbabilities[$sToken] ?? 0) >= self::TOPIC_PROBABILITY_MIN)
                $aKeyword[] = $sToken;

        return [implode(' ', $aKeyword), $fConfidence];
    }

    protected function _getTimezone(string $sTimezone): DateTimeZone
    {
        if ($sTimezone && in_array($sTimezone, timezone_identifiers_list()))
            return new DateTimeZone($sTimezone);

        return new DateTimeZone(date_default_timezone_get() ?: 'UTC');
    }
}

/** @} */
