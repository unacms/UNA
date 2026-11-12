<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * API v2 search, shared by the endpoints that search (GET /search/profiles, /search/groups and
 * /search/content): the query, profiles found by the profile modules' own quick search and
 * ranked, and content found by the site's search objects (sys_objects_search), section by
 * section, newest first.
 *
 * Nothing here decides who may see what: profiles go through their module's view check and
 * content through the endpoint that shows it (the Timeline, as GET /content/{id}).
 */
class BxDolApiV2Search
{
    const QUERY_MAX = 100;

    /** profiles one module's quick search returns at most, for ranking before the limit */
    const PROFILE_CANDIDATES = 50;

    /**
     * The `q` query param: trimmed, 1 to 100 characters, or 422.
     */
    public static function query(BxDolApiV2Request $oReq)
    {
        $s = trim((string)$oReq->query('q', ''));
        if ($s === '')
            throw BxDolApiV2Problem::validation([['field' => 'q', 'code' => 'required', 'message' => 'Is required']]);
        if (get_mb_len($s) > self::QUERY_MAX)
            throw BxDolApiV2Problem::validation([['field' => 'q', 'code' => 'too_long', 'message' => 'At most ' . self::QUERY_MAX . ' characters']]);
        return $s;
    }

    /*
     * Profiles
     */

    /**
     * Profiles of these modules whose name matches, the best matches first, as embedded Profiles:
     * only active ones the viewer may see. Each module's own quick search finds them
     * (searchByTerm over its FIELDS_QUICK_SEARCH, most recently active first), and the one
     * whose handle is the query exactly is added.
     * @param array $aModules profile module names
     */
    public static function profiles($sQuery, $aModules, $iLimit)
    {
        $aCandidates = [];
        $iByHandle = BxDolApiV2Map::profileIdByHandle($sQuery);

        foreach ($aModules as $sModule) {
            // _oDb is made on first read (BxDolModule::__get), so isset() would say false
            $oModule = BxDolModule::getInstance($sModule);
            $oDb = $oModule ? $oModule->_oDb : null;
            if (!is_object($oDb) || !method_exists($oDb, 'searchByTerm'))
                continue;

            foreach ($oDb->searchByTerm($sQuery, self::PROFILE_CANDIDATES) as $aRow)
                if (!empty($aRow['profile_id']))
                    $aCandidates[(int)$aRow['profile_id']] = $sModule;

            if ($iByHandle && !isset($aCandidates[$iByHandle]) && ($oProfile = BxDolProfile::getInstance($iByHandle)) && $oProfile->getModule() === $sModule)
                $aCandidates[$iByHandle] = $sModule;
        }

        // ranked by name first, then checked best first until there are enough: the view check
        // (ACL, privacy, the module's content) is the costly part, so it runs for about $iLimit
        // candidates, not for all of them
        $aRank = [];
        foreach ($aCandidates as $iProfileId => $sModule)
            if (($oProfile = BxDolProfile::getInstance($iProfileId)))
                $aRank[] = ['id' => $iProfileId, 'name' => $oProfile->getDisplayName(), 'exact' => $iProfileId === $iByHandle];

        $aIds = [];
        foreach (self::rank($sQuery, $aRank) as $iProfileId) {
            if (count($aIds) >= $iLimit)
                break;
            $oProfile = BxDolProfile::getInstance($iProfileId);
            if ($oProfile && $oProfile->getStatus() === BX_PROFILE_STATUS_ACTIVE && self::profileVisible($oProfile))
                $aIds[] = $iProfileId;
        }

        BxDolApiV2Map::primeBadges($aIds);
        $aItems = [];
        foreach ($aIds as $iProfileId)
            if (($aSummary = BxDolApiV2Map::profileSummary($iProfileId)))
                $aItems[] = $aSummary;
        return $aItems;
    }

    /**
     * Ids of the candidates, best match first: the exact handle or the whole name, then names
     * that start with the query, then names with a word that does, then the rest. Within each
     * the order they came in (the module's own, most recently active first) stays.
     * @param array $aCandidates [['id' => int, 'name' => string, 'exact' => bool], ...]
     */
    public static function rank($sQuery, $aCandidates)
    {
        $sQuery = mb_strtolower(trim((string)$sQuery));

        $aScored = [];
        foreach (array_values($aCandidates) as $i => $a) {
            $sName = mb_strtolower(trim((string)($a['name'] ?? '')));
            $iPos = $sQuery === '' ? false : bx_mb_strpos($sName, $sQuery);
            if (!empty($a['exact']) || $sName === $sQuery)
                $iScore = 0;
            elseif ($iPos === 0)
                $iScore = 1;
            elseif ($sQuery !== '' && preg_match('/(^|[\s\-_.,(])' . preg_quote($sQuery, '/') . '/u', $sName))
                $iScore = 2;
            else
                $iScore = 3;
            $aScored[] = [$iScore, $i, (int)$a['id']];
        }

        usort($aScored, function ($a, $b) {
            return [$a[0], $a[1]] <=> [$b[0], $b[1]];
        });
        return array_values(array_unique(array_column($aScored, 2)));
    }

    /**
     * Whether a search may list the profile: the viewer may open it (the module's view check,
     * as GET /profiles/{id}), or only its privacy refused and that privacy leaves it partly
     * visible, as the site shows such a profile's page with its name and picture (a closed
     * group, a person for friends only). A secret group, or one for members only to a guest, is
     * left out, and so is every profile of a module whose 'view entry' the viewer's membership
     * level does not have, or that a check_allowed_view hook refused: partial visibility only
     * stands in for the privacy step, as on the site (BxBaseModProfileTemplate).
     */
    public static function profileVisible($oProfile)
    {
        $sModule = $oProfile->getModule();
        $oModule = $sModule !== 'system' ? BxDolModule::getInstance($sModule) : null;
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        if (!$oModule || !$aContent || !method_exists($oModule, 'checkAllowedView'))
            return false;

        $mResult = $oModule->checkAllowedView($aContent);
        if ($mResult === CHECK_ACTION_RESULT_ALLOWED)
            return true;

        // the privacy step's refusal (BxBaseModGeneralModule::_serviceCheckAllowedViewForProfile),
        // not the ACL's or a hook's, and the viewer's level may view the module's profiles
        if ($mResult !== _t('_sys_access_denied_to_private_content'))
            return false;
        $aAcl = checkActionModule(bx_get_logged_profile_id(), 'view entry', $sModule);
        if (($aAcl[CHECK_ACTION_RESULT] ?? null) !== CHECK_ACTION_RESULT_ALLOWED)
            return false;

        $CNF = BxDolApiV2Map::profileCnf($sModule);
        if (empty($CNF['OBJECT_PRIVACY_VIEW']) || empty($CNF['FIELD_ALLOW_VIEW_TO']) || !isset($aContent[$CNF['FIELD_ALLOW_VIEW_TO']]))
            return false;
        $oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);
        return $oPrivacy && method_exists($oPrivacy, 'isPartiallyVisible') && $oPrivacy->isPartiallyVisible($aContent[$CNF['FIELD_ALLOW_VIEW_TO']]);
    }

    /*
     * Content
     */

    /**
     * The content kinds content search looks in: the site's search sections the admin chose for
     * the API (sys_api_search_sections) that are enabled modules of content, not profiles or
     * contexts (those are GET /search/profiles and /search/groups), in the site's search order.
     * @return array kind (module name) => [search section row of sys_objects_search]
     */
    public static function contentSections()
    {
        $aChosen = array_filter(array_map('trim', explode(',', (string)getParam('sys_api_search_sections'))));
        $oModules = BxDolModuleQuery::getInstance();

        $aResult = [];
        foreach (BxDolSearch::getSections() as $sName => $aSection) {
            if (!in_array($sName, $aChosen, true) || !$oModules->isEnabledByName($sName))
                continue;
            if (BxDolRequest::serviceExists($sName, 'act_as_profile'))
                continue;
            $aResult[$sName] = $aSection;
        }
        return $aResult;
    }

    /**
     * One page of content rows matching the query, newest first across the sections, each
     * section read by its own search object (its fields, its status and privacy conditions).
     * The cursor keeps where each section's scan got to, so a page is merged from the next rows
     * of every section and goes on where the last one stopped.
     * @param array $aSections kind => section row, from contentSections()
     * @return array ['rows' => [['kind' => ..., 'id' => int], ...], 'cursor' => string|null]
     */
    public static function contentRows(BxDolApiV2Request $oReq, $sQuery, $aSections, $iLimit)
    {
        $aKinds = array_keys($aSections);
        $iSum = crc32(implode(',', $aKinds));

        // where each section goes on: an offset, or -1 when it has nothing more
        $aOffsets = array_fill(0, count($aKinds), 0);
        if (($sCursor = $oReq->query('cursor')) !== null) {
            $a = BxDolApiV2Request::decodeCursor($sCursor);
            if (!is_array($a) || ($a['k'] ?? null) !== $iSum || !isset($a['o']) || !is_array($a['o']) || count($a['o']) !== count($aKinds))
                throw BxDolApiV2Problem::validation([['field' => 'cursor', 'code' => 'invalid_cursor', 'message' => 'Pass back a next_cursor from a previous page with the same q and kind']]);
            foreach (array_values($a['o']) as $i => $iOffset) {
                if (!is_int($iOffset) || $iOffset < -1 || $iOffset > BxDolApiV2Request::OFFSET_MAX)
                    throw BxDolApiV2Problem::validation([['field' => 'cursor', 'code' => 'invalid_cursor', 'message' => 'Pass back a next_cursor from a previous page']]);
                $aOffsets[$i] = $iOffset;
            }
        }

        $aQueues = [];
        $aFetched = [];
        foreach ($aKinds as $i => $sKind) {
            $aQueues[$i] = $aOffsets[$i] < 0 ? [] : self::sectionRows($sKind, $sQuery, $aOffsets[$i], $iLimit + 1);
            $aFetched[$i] = count($aQueues[$i]);
        }

        list($aPage, $aTaken) = self::merge($aQueues, $iLimit);

        $bMore = false;
        $aNext = [];
        foreach ($aKinds as $i => $sKind) {
            if ($aOffsets[$i] < 0) {
                $aNext[$i] = -1;
                continue;
            }
            // a section that gave fewer rows than asked and had them all taken is done
            $bDone = $aFetched[$i] <= $iLimit && $aTaken[$i] === $aFetched[$i];
            $aNext[$i] = $bDone ? -1 : $aOffsets[$i] + $aTaken[$i];
            if ($aNext[$i] > BxDolApiV2Request::OFFSET_MAX)
                $aNext[$i] = -1;
            $bMore = $bMore || $aNext[$i] >= 0;
        }

        $aRows = [];
        foreach ($aPage as list($i, $aRow))
            $aRows[] = ['kind' => $aKinds[$i], 'id' => $aRow['id']];

        return [
            'rows' => $aRows,
            'cursor' => $bMore ? BxDolApiV2Request::encodeCursor(['k' => $iSum, 'o' => $aNext]) : null,
        ];
    }

    /**
     * Up to $iLimit rows from sections whose rows are each newest first, newest first: each
     * step takes the newest of the sections' next rows (the earlier section on a tie), so what
     * is taken from a section is always the start of its rows and its scan goes on after them.
     * @param array $aQueues section index => [['id' => int, 'date' => int], ...]
     * @return array [[[section index, row], ...], [section index => rows taken]]
     */
    public static function merge($aQueues, $iLimit)
    {
        $aHeads = array_fill_keys(array_keys($aQueues), 0);
        $aPage = [];
        while (count($aPage) < $iLimit) {
            $iBest = null;
            foreach ($aQueues as $i => $aRows) {
                if (!isset($aRows[$aHeads[$i]]))
                    continue;
                if ($iBest === null || $aRows[$aHeads[$i]]['date'] > $aQueues[$iBest][$aHeads[$iBest]]['date'])
                    $iBest = $i;
            }
            if ($iBest === null)
                break;
            $aPage[] = [$iBest, $aQueues[$iBest][$aHeads[$iBest]]];
            $aHeads[$iBest]++;
        }
        return [$aPage, $aHeads];
    }

    /**
     * Runs a read of a search object without the request's own params: search objects read
     * the request too (per_page, start, `<name>_mode`, ownerName, userID, api ...), which here
     * would let a client change a read's page size, order or owner, or make it unbounded. The
     * superglobals are back as they were afterwards, also after an exception.
     */
    public static function isolated(callable $fn)
    {
        $aGet = $_GET;
        $aPost = $_POST;
        $aRequest = $_REQUEST;
        $_GET = $_POST = $_REQUEST = [];
        try {
            return $fn();
        }
        finally {
            $_GET = $aGet;
            $_POST = $aPost;
            $_REQUEST = $aRequest;
        }
    }

    /**
     * Rows of one search section for a keyword: [['id' => content id, 'date' => timestamp], ...],
     * newest first. The search object reads them as for the site's keyword search, which leaves
     * the privacy of each row to whoever shows it. It reads without the request's params
     * (isolated()), with only the keyword, the start and the page size given here, so a client
     * can't break the merge and the cursor.
     */
    protected static function sectionRows($sSection, $sQuery, $iStart, $iPerPage)
    {
        $oResult = null;
        $aData = self::isolated(function () use ($sSection, $sQuery, $iStart, $iPerPage, &$oResult) {
            $oSearch = new BxDolSearch([$sSection]);
            $oResult = $oSearch->getSearchResultObject($sSection);
            if (!$oResult || !empty($oResult->isError))
                return null;

            $oResult->setCustomSearchCondition(['keyword' => $sQuery]);
            $oResult->aCurrent['paginate']['forceStart'] = (int)$iStart;
            $oResult->aCurrent['paginate']['perPage'] = (int)$iPerPage;
            $oResult->setPaginatePerPage((int)$iPerPage);

            // newest first, and the id breaks a tie, so rows of the same second keep one order
            // from page to page (an offset over an order with ties may repeat or skip one)
            $oResult->aCurrent['sorting'] = 'last';
            $aSort = $oResult->getSorting('last');
            $sTable = isset($oResult->aCurrent['table']) ? (string)$oResult->aCurrent['table'] : '';
            $sIdent = !empty($oResult->aCurrent['ident']) ? (string)$oResult->aCurrent['ident'] : 'id';
            if ($sTable !== '' && is_array($aSort) && count($aSort) === 1 && isset($aSort['order']) && preg_match('/^\s*ORDER BY\s/i', (string)$aSort['order']))
                $oResult->aCurrent['sorting_sql'] = trim($aSort['order']) . ', `' . $sTable . '`.`' . $sIdent . '` DESC';

            return $oResult->getSearchData();
        });
        if (!is_array($aData))
            return [];

        $sId = !empty($oResult->aCurrent['ident']) ? $oResult->aCurrent['ident'] : 'id';
        $sDate = !empty($oResult->aCurrent['added']) ? $oResult->aCurrent['added'] : 'added';

        $aRows = [];
        foreach ($aData as $aRow)
            if (is_array($aRow) && (int)($aRow[$sId] ?? 0) > 0)
                $aRows[] = ['id' => (int)$aRow[$sId], 'date' => (int)($aRow[$sDate] ?? 0)];
        return array_slice($aRows, 0, $iPerPage);
    }
}

/** @} */
