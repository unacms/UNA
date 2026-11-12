<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseProfile Base classes for profile modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 for profile modules (persons, and organizations the same way): the module's directory,
 * the people the site's browse pages list. A module's own `<Prefix>ApiV2` class extends this one
 * and puts the operation attributes on its paths (/persons), since attributes can't be shared;
 * the work is here. API_TAG and API_KIND name the module's paths and the kind of its entries in
 * GET /api/v2's `modules`; PAGE_VIEWS says which of the module's pages is which view, for
 * GET /navigation.
 *
 * A list is the module's own search result in the mode of its browse block (`recent` for
 * Recent, `active`, `online`), so its conditions hold: active profiles of the module, accounts
 * confirmed where the site hides unconfirmed ones, and the module's browse check
 * (checkAllowedBrowse, which the `check_allowed_browse` hook may make refuse). As on the site, a profile whose
 * privacy keeps its page from the viewer is listed with its name, and its picture when the
 * viewer may see that (BxDolApiV2Map::profileSummary's checks); its page answers 403.
 */
class BxBaseModProfileApiV2
{
    /** The tag of the module's paths and the kind of its entries. */
    const API_TAG = 'persons';
    const API_KIND = 'person';

    /** The views of the list, each the search result's mode of the same name, the first the default. */
    const VIEWS = ['recent', 'active', 'online'];

    /** The module's pages (their URI) that are a view of its section, for GET /navigation. */
    const PAGE_VIEWS = [];

    protected $_oModule;

    public function __construct($sModule)
    {
        $this->_oModule = BxDolModule::getInstance($sModule);
    }

    /**
     * GET /api/v2 `modules`: the module, with the tag of its paths.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), static::API_TAG, static::API_KIND);
    }

    /**
     * GET /navigation: the module's browse pages (PAGE_VIEWS: the site menu's item and its
     * submenu's Recent, Active, Online) are its section at that view. Other pages of the module
     * (a profile's, one's friends) are left to the system's rules.
     */
    public function apiV2NavigationTarget(array $aItem, array $aPage)
    {
        if (!$aPage || ($aPage['module'] ?? '') !== $this->_oModule->getName() || !isset(static::PAGE_VIEWS[$aPage['uri'] ?? '']))
            return null;
        return ['kind' => BxBaseApiV2Navigation::TARGET_SECTION, 'section' => static::API_TAG, 'view' => static::PAGE_VIEWS[$aPage['uri']]];
    }

    /**
     * A page of the module's profiles in a view, as its browse block lists them for the viewer:
     * 403 when the module's browse check refuses, 422 for a view it has not.
     * The cursor counts rows, so a profile left out makes a page shorter rather than shifting
     * the next one.
     */
    protected function _browse(BxDolApiV2Request $oReq)
    {
        $sView = (string)$oReq->query('view', static::VIEWS[0]);
        if (!in_array($sView, static::VIEWS, true))
            throw BxDolApiV2Problem::validation([['field' => 'view', 'code' => 'invalid_value', 'message' => 'Use ' . implode(', ', static::VIEWS)]]);

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();

        return BxDolApiV2Search::isolated(function () use ($sView, $iOffset, $iLimit, $oReq) {
            $mCheck = $this->_oModule->checkAllowedBrowse();
            if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

            $aIds = $this->_browseRows($sView, $iOffset, $iLimit + 1);

            $aShown = array_slice($aIds, 0, $iLimit);
            $aSummaries = BxBaseApiV2Profiles::summaries($aShown);
            $aItems = [];
            foreach ($aShown as $iId)
                if (($aSummary = $aSummaries[$iId] ?? null) && $aSummary['status'] === 'active')
                    $aItems[] = $aSummary;

            return $oReq->pageAt($aItems, count($aIds) > $iLimit ? $iOffset + $iLimit : null);
        });
    }

    /**
     * Profile ids of a page of the module's search result in a view's mode, in the mode's order
     * with the profile id breaking ties, so pages don't overlap: Recent by when the profile was
     * added, Active by when its account last signed in, Online by its newest session.
     */
    protected function _browseRows($sView, $iStart, $iPerPage)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sClass = $this->_oModule->_oConfig->getClassPrefix() . 'SearchResult';
        bx_import('SearchResult', $this->_oModule->_aModule);
        $oResult = new $sClass($sView);
        if (!empty($oResult->isError))
            return [];

        $sProfiles = '`sys_profiles`.`id`';
        switch ($sView) {
            case 'active':
                $sOrder = 'ORDER BY `sys_accounts`.`logged` DESC, ' . $sProfiles . ' DESC';
                break;
            case 'online':
                $sOrder = 'ORDER BY MAX(`sys_sessions`.`date`) DESC, ' . $sProfiles . ' DESC';
                break;
            default:
                $sOrder = 'ORDER BY `' . $CNF['TABLE_ENTRIES'] . '`.`' . $CNF['FIELD_ADDED'] . '` DESC, ' . $sProfiles . ' DESC';
        }

        $oResult->aCurrent['paginate']['forceStart'] = (int)$iStart;
        $oResult->aCurrent['paginate']['perPage'] = (int)$iPerPage;
        $oResult->setPaginatePerPage((int)$iPerPage);
        $oResult->aCurrent['sorting_sql'] = $sOrder;
        $aData = $oResult->getSearchData();
        $aContentIds = [];
        foreach (is_array($aData) ? $aData : [] as $aRow)
            if (is_array($aRow) && (int)($aRow['id'] ?? 0) > 0)
                $aContentIds[] = (int)$aRow['id'];

        // their profiles in one query, in the list's order
        $aProfiles = BxDolProfileQuery::getInstance()->primeByContentAndType($aContentIds, $this->_oModule->getName());
        $aIds = [];
        foreach ($aContentIds as $iContentId)
            if (!empty($aProfiles[$iContentId]))
                $aIds[] = $aProfiles[$iContentId];
        return array_slice($aIds, 0, $iPerPage);
    }

    public static function schemas()
    {
        return [
            'Page_Profile' => BxDolApiV2Map::pageSchema('Profile'),
        ];
    }
}

/** @} */
