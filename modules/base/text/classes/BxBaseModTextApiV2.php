<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseText Base classes for text modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 for text modules (Discussions, Videos, Photos, Albums, later Posts, Polls ...): what an
 * entry of such a module is to the API, the checks every one of them shares, and the lists,
 * reads, edits and writes a module's class answers with in its own shape (_item). A module's own
 * `<Prefix>ApiV2` class extends this one (or the files base on it) and puts the operation
 * attributes on its paths (/discussions, /videos ...), since attributes can't be shared; the
 * work is here. API_TAG names the module's paths and its content kind in Group.content_kinds,
 * API_KIND its entries' Item.kind and its kind in GET /api/v2's `modules`, and the API_NOUN
 * words are what its problems say.
 *
 * Visibility is the module's own: lists are the module's search results (its active entries,
 * its privacy conditions), and every entry shown goes through its view check, as on the site.
 * Changes go through the module's forms helper and its permission checks, so the site's
 * validation, alerts (the Timeline, notifications, subscriptions) and ACL counters apply.
 */
class BxBaseModTextApiV2
{
    const SUMMARY_LENGTH = 300;

    /** The tag of the module's paths (/discussions) and its content kind in contexts. */
    const API_TAG = '';
    /** Its entries' Item.kind and its kind in GET /api/v2 `modules`. */
    const API_KIND = '';
    /** The words its problems use: "The discussion was not found", "Discussions can't be started in this kind of context". */
    const API_NOUN = 'entry';
    const API_NOUN_PLURAL = 'entries';
    const API_VERB = 'add';
    const API_VERB_PAST = 'added';

    /** The sorts of a list and the search result's sorting of each. */
    const SORTS = ['recent' => 'last', 'updated' => 'updated', 'popular' => 'popular', 'top' => 'top', 'featured' => 'featured'];

    /** Whether the FileItems being mapped carry their text and the viewer's reaction (single answers). */
    protected $_bFull = false;

    protected $_oModule;
    /** The Audience => the module's privacy group. */
    protected $_aAudienceToPrivacy;

    public function __construct($sModule)
    {
        $this->_oModule = BxDolModule::getInstance($sModule);

        bx_import('BxDolPrivacy'); // the BX_DOL_PG_* constants
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['OBJECT_PRIVACY_VIEW']))
            BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);

        $this->_aAudienceToPrivacy = [
            'public' => BX_DOL_PG_ALL,
            'members' => BX_DOL_PG_MEMBERS,
            'friends' => BX_DOL_PG_FRIENDS,
            'private' => BX_DOL_PG_MEONLY,
        ];
    }

    /*
     * Hooks other endpoints ask (BxDolApiV2Router::hooks)
     */

    /**
     * The module's entries are Item.kind API_KIND; null for other modules.
     */
    public function apiV2ItemKind($sModule)
    {
        return static::API_KIND !== '' && $sModule === $this->_oModule->getName() ? static::API_KIND : null;
    }

    /**
     * Item.entry_id (BxTimelineApiV2): the module's paths take its entries' content ids, so the
     * feeds' item of one names it (GET /{API_TAG}/{entry_id}); false for other modules.
     */
    public function apiV2ItemEntry($sModule)
    {
        return static::API_TAG !== '' && $sModule === $this->_oModule->getName();
    }

    /**
     * GET /api/v2 `modules`: the module is here, with its paths' tag.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), static::API_TAG, static::API_KIND) + [
            'audiences' => $this->_audiences(),
        ];
    }

    /**
     * The audiences a new entry may have here: those of the privacy groups the site has
     * turned on (Studio > Privacy), in its order. Another one is 422 (_privacyOf).
     */
    protected function _audiences()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oPrivacy = !empty($CNF['OBJECT_PRIVACY_VIEW']) ? BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']) : null;
        if (!$oPrivacy)
            return array_keys($this->_aAudienceToPrivacy);
        $aActive = array_map('intval', (array)$oPrivacy->getGroupsBy(['type' => 'active_list']));
        return array_values(array_filter(array_keys($this->_aAudienceToPrivacy), function ($sAudience) use ($aActive) {
            return in_array((int)$this->_aAudienceToPrivacy[$sAudience], $aActive, true);
        }));
    }

    /**
     * The privacy group of an audience the site offers (_audiences); 422 on $sField for one it
     * has turned off, which nobody but the author could see.
     */
    protected function _privacyOf($sAudience, $sField = 'audience')
    {
        $sAudience = (string)$sAudience;
        if (!isset($this->_aAudienceToPrivacy[$sAudience]) || !in_array($sAudience, $this->_audiences(), true))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'invalid_value', 'message' => 'This site offers ' . implode(', ', $this->_audiences())]]);
        return $this->_aAudienceToPrivacy[$sAudience];
    }

    /**
     * Group.content_kinds: API_TAG for contexts of a module the site lets the module's entries
     * go into (the module's privacy, as its add form offers the context), else null.
     */
    public function apiV2ContextContent($sContextModule)
    {
        return $this->_oModule->serviceCheckAllowedAddInContext($sContextModule) === CHECK_ACTION_RESULT_ALLOWED ? static::API_TAG : null;
    }

    /** GET /layout/resolve: the module's browse blocks (their service method) as a sort of its list, GET /{API_TAG}. */
    const PAGE_BLOCK_SORTS = ['browse_public' => 'recent', 'browse_updated' => 'updated', 'browse_popular' => 'popular', 'browse_top' => 'top', 'browse_featured' => 'featured'];

    /**
     * GET /layout/resolve (BxBaseApiV2Layout): a browse block of the module (Recent, Popular,
     * Featured ...) as its list in that order, `<API_TAG>.list`, and its Categories menu block
     * (the `<module>_categories` menu) as `<API_TAG>.categories`, the module's categories with
     * how many items each has (GET /{API_TAG}/categories?counts=true). A module whose list has
     * no such sort, or that has no categories route, is left out by the resolver, which takes
     * only the routes this site serves and the parameters they declare.
     */
    public function apiV2PageBlock($aCall, $aContext)
    {
        if (static::API_TAG === '' || $aCall['module'] !== $this->_oModule->getName())
            return null;
        if (($aCall['menu'] ?? '') !== '')
            return $aCall['menu'] === $this->_oModule->getName() . '_categories' ? ['kind' => static::API_TAG . '.categories', 'endpoint' => '/' . static::API_TAG . '/categories', 'query' => ['counts' => true]] : null;
        if (!isset(static::PAGE_BLOCK_SORTS[$aCall['method']]))
            return null;
        return ['kind' => static::API_TAG . '.list', 'endpoint' => '/' . static::API_TAG, 'query' => ['sort' => static::PAGE_BLOCK_SORTS[$aCall['method']]]];
    }

    /**
     * GET /{API_TAG}/categories `counts`: how many items each category has, as the site's
     * Categories block counts them (BxDolCategory: active and public ones, or those for members
     * to a member), in one query; category value => number.
     */
    protected function _categoryCounts()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oCategory = !empty($CNF['OBJECT_CATEGORY']) ? BxDolCategory::getObjectInstance($CNF['OBJECT_CATEGORY']) : null;
        return $oCategory ? $oCategory->getItemsNums() : [];
    }

    /** The `counts` parameter of a categories route. */
    const CATEGORY_COUNTS_PARAM = ['in' => 'query', 'schema' => ['type' => 'boolean', 'default' => false], 'description' => 'Add `count` to each category: how many items it has, as the site\'s Categories block counts them (active, and public or for members)'];

    /*
     * Reading
     */

    /**
     * Ids of a list of the module's search result in one of its modes ($sMode with its
     * $aParams: `context`, `author`, `featured` ...), as it reads them (active entries and its
     * privacy conditions), the id breaking ties, without the request's own params
     * (BxDolApiV2Search::isolated). $sOrderSql replaces the mode's order (with the id after
     * it); by default the mode's own order is kept, or the search result's $sSorting (`last`,
     * `updated`, `popular`, `top`, `featured`). $aRestrictions are more conditions of the search
     * result: name => value of one it has, or name => ['value' => ..., 'operator' => ...], with
     * 'field' (and 'table') for one it does not have. $aJoins are more of its joins (name =>
     * a join as BxDolSearch::getJoins reads it), for a restriction on another table.
     * $sRestrictionSql is more of its WHERE as SQL (starting with " AND "), as a module's Db
     * class writes it (on the entries table by its name).
     */
    protected function _browseRows($sMode, $aParams, $iStart, $iPerPage, $sOrderSql = '', $aRestrictions = [], $sSorting = '', $aJoins = [], $sRestrictionSql = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sClass = $this->_oModule->_oConfig->getClassPrefix() . 'SearchResult';

        return BxDolApiV2Search::isolated(function () use ($CNF, $sClass, $sMode, $aParams, $iStart, $iPerPage, $sOrderSql, $aRestrictions, $sSorting, $aJoins, $sRestrictionSql) {
            bx_import('SearchResult', $this->_oModule->_aModule);
            $oResult = new $sClass($sMode, $aParams);
            if (!empty($oResult->isError))
                return [];

            foreach ($aRestrictions as $sName => $mValue) {
                // [value, operator] for one whose operator changes too (`in` a list), with
                // `field` (and `table`) for one the search result does not have
                if (is_array($mValue) && array_key_exists('operator', $mValue)) {
                    $oResult->aCurrent['restriction'][$sName]['operator'] = $mValue['operator'];
                    foreach (['field', 'table'] as $sKey)
                        if (isset($mValue[$sKey]))
                            $oResult->aCurrent['restriction'][$sName][$sKey] = $mValue[$sKey];
                    $mValue = $mValue['value'];
                }
                $oResult->aCurrent['restriction'][$sName]['value'] = $mValue;
            }
            foreach ($aJoins as $sName => $aJoin)
                $oResult->aCurrent['join'][$sName] = $aJoin;
            if ($sSorting !== '')
                $oResult->aCurrent['sorting'] = $sSorting;
            if ($sRestrictionSql !== '')
                $oResult->aCurrent['restriction_sql'] = ($oResult->aCurrent['restriction_sql'] ?? '') . $sRestrictionSql;

            $oResult->aCurrent['paginate']['forceStart'] = (int)$iStart;
            $oResult->aCurrent['paginate']['perPage'] = (int)$iPerPage;
            $oResult->setPaginatePerPage((int)$iPerPage);

            $sTable = '`' . $CNF['TABLE_ENTRIES'] . '`';
            $sId = $sTable . '.`' . $CNF['FIELD_ID'] . '`';
            if ($sOrderSql !== '') {
                $oResult->aCurrent['sorting_sql'] = 'ORDER BY ' . $sOrderSql . ', ' . $sId . ' DESC';
            }
            else {
                // the mode's own order, the id breaking its ties so that pages don't repeat or skip one
                $aSort = $oResult->getSorting($oResult->aCurrent['sorting'] ?? 'last');
                if (is_array($aSort) && count($aSort) === 1 && isset($aSort['order']) && preg_match('/^\s*ORDER BY\s/i', (string)$aSort['order']))
                    $oResult->aCurrent['sorting_sql'] = trim($aSort['order']) . ', ' . $sId . ' DESC';
            }

            $aData = $oResult->getSearchData();
            $aIds = [];
            foreach (is_array($aData) ? $aData : [] as $aRow)
                if (is_array($aRow) && (int)($aRow[$CNF['FIELD_ID']] ?? 0) > 0)
                    $aIds[] = (int)$aRow[$CNF['FIELD_ID']];
            return array_slice($aIds, 0, $iPerPage);
        });
    }

    /**
     * The entries of these ids the viewer may see, in their order (_contentRows, then the
     * module's checks of each one).
     */
    protected function _visibleContents($aIds)
    {
        // the privacy the view check reads of each, read at once
        $CNF = &$this->_oModule->_oConfig->CNF;
        if ($aIds && !empty($CNF['OBJECT_PRIVACY_VIEW']) && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW'])))
            $oPrivacy->primeObjects($aIds);

        $aRows = $this->_contentRows($aIds);
        // the contexts of those in one (a search's hits come from many), read at once
        if (!empty($CNF['FIELD_ALLOW_VIEW_TO']))
            BxDolApiV2Targets::primeContexts(array_map(function ($aContent) use ($CNF) { return -(int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']]; }, $aRows));

        $aContents = [];
        foreach ($aRows as $aContent)
            if ($this->_visible($aContent))
                $aContents[] = $aContent;
        return $aContents;
    }

    /**
     * The rows of these entries, in their order, as getContentInfoById reads them: in one query
     * (BxBaseModGeneralDb::getContentInfoByIds) where the module's Db reads a row the base way,
     * or one by one where it reads one its own way (a profile module's, Polls' with its salt),
     * unless it gives getContentInfoByIds of its own too.
     */
    protected function _contentRows($aIds)
    {
        $oDb = $this->_oModule->_oDb;
        $aRows = null;
        if (method_exists($oDb, 'getContentInfoByIds')) {
            $sOne = (new ReflectionMethod($oDb, 'getContentInfoById'))->getDeclaringClass()->getName();
            $sMany = (new ReflectionMethod($oDb, 'getContentInfoByIds'))->getDeclaringClass()->getName();
            if ($sOne === 'BxBaseModGeneralDb' || $sMany !== 'BxBaseModGeneralDb')
                $aRows = $oDb->getContentInfoByIds($aIds);
        }

        $aContents = [];
        foreach ($aIds as $iId)
            if (($aContent = is_array($aRows) ? ($aRows[(int)$iId] ?? null) : $oDb->getContentInfoById((int)$iId)))
                $aContents[] = $aContent;
        return $aContents;
    }

    /**
     * A page of the module's keyword search (BxDolApiV2Search::contentRows): the rows of the
     * entries the viewer may see, and the cursor of the next page.
     * @return array ['contents' => rows, 'cursor' => string|null]
     */
    protected function _searchContents(BxDolApiV2Request $oReq)
    {
        $sQuery = BxDolApiV2Search::query($oReq);
        $a = BxDolApiV2Search::contentRows($oReq, $sQuery, [$this->_oModule->getName() => []], $oReq->limit());
        return ['contents' => $this->_visibleContents(array_map(function ($aRow) { return (int)$aRow['id']; }, $a['rows'])), 'cursor' => $a['cursor']];
    }

    protected function _idParam(BxDolApiV2Request $oReq, $sName)
    {
        return BxDolApiV2Targets::idParam($oReq, $sName);
    }

    /**
     * A context the viewer may see the content of (BxDolApiV2Targets::viewableContext): 422 for
     * an id that is no context or one the viewer may not know of (a secret one from outside),
     * 403 when its module's view check refuses.
     */
    protected function _viewableContext($iContextId, $sParam = 'context_id')
    {
        return BxDolApiV2Targets::viewableContext($iContextId, $sParam);
    }

    /**
     * The viewer may add an entry to the context: they may see it, the module allows its
     * entries in contexts of its kind, and the context's post privacy lets them post.
     */
    protected function _checkPostInContext($iContextId)
    {
        $oContext = $this->_viewableContext($iContextId);
        if ($this->_oModule->serviceCheckAllowedAddInContext($oContext->getModule()) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(ucfirst(static::API_NOUN_PLURAL) . ' can\'t be ' . static::API_VERB_PAST . ' in this kind of context');
        if ($this->_canPostIn($oContext) !== true)
            throw BxDolApiV2Problem::forbidden('The viewer may not ' . static::API_VERB . ' ' . static::API_NOUN_PLURAL . ' in this group');
    }

    protected function _canPostIn($oContext)
    {
        return $oContext->checkAllowedPostInProfile((int)$oContext->id(), $this->_oModule->getName()) === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * The entry, or 404: none with this id, or one that is not active (hidden, waiting for
     * approval) to anyone but its author, the moderators and the admins of its context, as the
     * site hides its page.
     */
    protected function _existing($iId)
    {
        $aContent = $iId > 0 ? $this->_oModule->_oDb->getContentInfoById($iId) : false;
        if (empty($aContent) || $this->_contextGone($aContent) || !$this->_oModule->isEntryActive($aContent))
            throw BxDolApiV2Problem::notFound('The ' . static::API_NOUN);
        return $aContent;
    }

    /**
     * An entry in a context (a group) that is gone: deleting a group leaves its entries behind
     * with the group's id as their privacy. The module's checks call the context's profile,
     * which is no more, so such an entry is treated as gone too.
     */
    protected function _contextGone($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['FIELD_ALLOW_VIEW_TO']) || ($iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']]) >= 0)
            return false;
        return !BxDolProfile::getInstance(-$iPrivacy);
    }

    /**
     * 403 when the module's view check refuses the entry, with its words; 404 instead for one
     * in a context the viewer may not know of (a secret one from outside: BxDolApiV2Targets::
     * visible, as GET of that context answers 404), so the answer never tells that the entry
     * or its context exist. One in a closed context stays 403: that context may be known.
     */
    protected function _checkView($aContent)
    {
        if (($mCheck = $this->_oModule->checkAllowedView($aContent)) === CHECK_ACTION_RESULT_ALLOWED)
            return;
        if ($this->_inHiddenContext($aContent))
            throw BxDolApiV2Problem::notFound('The ' . static::API_NOUN);
        throw BxDolApiV2Problem::forbidden(is_string($mCheck) && $mCheck !== '' ? BxDolApiV2Map::text($mCheck) : 'The viewer may not see this ' . static::API_NOUN);
    }

    /**
     * Whether the entry is in a context (its privacy is the context's negative profile id) that
     * the viewer may not know of.
     */
    protected function _inHiddenContext($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iPrivacy = !empty($CNF['FIELD_ALLOW_VIEW_TO']) ? (int)($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? 0) : 0;
        return $iPrivacy < 0 && !BxDolApiV2Targets::visible(BxDolApiV2Targets::make(BxDolApiV2Targets::GROUP, -$iPrivacy));
    }

    /**
     * Whether a list may show the entry: the module's view check allows it (which an entry in a
     * secret context never passes for those outside it), and it is active or the viewer's own.
     */
    protected function _visible($aContent)
    {
        return !$this->_contextGone($aContent) && $this->_oModule->isEntryActive($aContent) && $this->_oModule->checkAllowedView($aContent) === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Counts a view of the entry, as opening it on the site does (once a day per viewer), and
     * gives its row as it is now.
     */
    protected function _countView($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['OBJECT_VIEWS']) && ($oViews = BxDolView::getObjectInstance($CNF['OBJECT_VIEWS'], (int)$aContent[$CNF['FIELD_ID']])) && $oViews->isEnabled() && $oViews->doView())
            $aContent = $this->_oModule->_oDb->getContentInfoById((int)$aContent[$CNF['FIELD_ID']]) ?: $aContent;
        return $aContent;
    }

    /**
     * 403 with the module's own words for a refusal (a check that gave a message), else $sDefault.
     */
    protected function _refuse($mCheck, $sDefault)
    {
        if ($mCheck !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) && $mCheck !== '' ? BxDolApiV2Map::text($mCheck) : $sDefault);
    }

    /*
     * Writing
     */

    /**
     * Deletes the entry through the module (its files, comments and feed activity go with it, as
     * on the site), after its delete check, and counts it in the ACL.
     */
    protected function _delete(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);

        if (($mCheck = $this->_oModule->checkAllowedDelete($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : 'The viewer may not delete this ' . static::API_NOUN);

        $sError = $this->_oModule->serviceDeleteEntity((int)$aContent[$this->_oModule->_oConfig->CNF['FIELD_ID']]);
        if ($sError)
            throw new BxDolApiV2Problem(409, 'not_deleted', BxDolApiV2Map::text($sError));

        $this->_oModule->checkAllowedDelete($aContent, true);
        return BxDolApiV2Response::noContent();
    }

    /*
     * Mapping
     */

    /**
     * The Audience of a privacy value: `context` for one in a context (a negative value),
     * `private` for the author only or another privacy of the site.
     */
    protected function _audience($iPrivacy)
    {
        if ($iPrivacy < 0)
            return 'context';
        switch ((string)$iPrivacy) {
            case BX_DOL_PG_ALL: return 'public';
            case BX_DOL_PG_MEMBERS: return 'members';
            case BX_DOL_PG_FRIENDS: return 'friends';
        }
        return 'private';
    }

    /**
     * The entry's page on the site.
     */
    protected function _entryUrl($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return BxDolApiV2Map::absoluteUrl(BxDolPermalinks::getInstance()->permalink('page.php?i=' . $CNF['URI_VIEW_ENTRY'] . '&id=' . (int)$iId));
    }

    /**
     * The Item that shows the entry in the feeds (its comments and reactions), or 0.
     */
    protected function _itemId($iId)
    {
        $aTarget = BxDolApiV2Targets::content($this->_oModule->getName(), (int)$iId);
        return ($aTarget['kind'] ?? '') === BxDolApiV2Targets::CONTENT ? (int)$aTarget['id'] : 0;
    }

    /**
     * The form's refusals as Problem errors: $aFields maps the module's field names to the
     * API's (the first one's message otherwise).
     */
    protected function _formErrors($aResult, $aFields = [])
    {
        $aErrors = [];
        foreach ((array)($aResult['errors'] ?? []) as $sField => $sError)
            $aErrors[] = ['field' => $aFields[$sField] ?? $sField, 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)];
        if (!$aErrors)
            $aErrors[] = ['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text(_t($aResult['message'] ?? '_sys_txt_error_occured'))];
        return $aErrors;
    }

    /*
     * Endpoints a module's class puts its attributes on: lists, one entry, search and edits of
     * the module's entries, which its class maps (_item) to its own shape (FileItem, Album ...)
     */

    /**
     * A page of the module's entries the viewer may see, in a sort, by an author, in a context.
     */
    protected function _list(BxDolApiV2Request $oReq)
    {
        $sSort = (string)$oReq->query('sort', 'recent');
        if (!isset(static::SORTS[$sSort]))
            throw BxDolApiV2Problem::validation([['field' => 'sort', 'code' => 'invalid_value', 'message' => 'Use ' . implode(', ', array_keys(static::SORTS))]]);

        $iAuthor = $this->_idParam($oReq, 'author');
        if ($iAuthor && !BxDolProfile::getInstance($iAuthor))
            throw BxDolApiV2Problem::validation([['field' => 'author', 'code' => 'not_found', 'message' => 'No such profile']]);

        // `context`, and `context_id` as Discussions name it
        $sContextParam = $oReq->query('context') !== null ? 'context' : 'context_id';
        $iContext = $this->_idParam($oReq, $sContextParam);
        if ($iContext)
            $this->_viewableContext($iContext, $sContextParam);

        if ($iContext)
            list($sMode, $aParams) = ['context', ['context' => $iContext]];
        elseif ($iAuthor)
            list($sMode, $aParams) = ['author', ['author' => $iAuthor]];
        else
            list($sMode, $aParams) = ['public', []];

        $aRestrictions = [];
        if ($iContext && $iAuthor)
            $aRestrictions['author'] = $iAuthor;
        // the search result's `featured` restriction is "not 0" once it has a value
        if ($sSort === 'featured')
            $aRestrictions['featured'] = '0';
        // an author's own list (and a moderator's look at it) has the entries still being
        // converted or whose converting failed: isEntryActive keeps them from everyone else
        $iViewerId = (int)$oReq->viewerId();
        if ($iAuthor && $iViewerId && ($iAuthor === $iViewerId || $this->_oModule->_isModerator()))
            $aRestrictions['status'] = ['value' => ['active', 'awaiting', 'failed'], 'operator' => 'in'];

        $aRestrictions += $this->_listRestrictions($oReq);

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $aIds = $this->_browseRows($sMode, $aParams, $iOffset, $iLimit + 1, '', $aRestrictions, static::SORTS[$sSort]);

        $aItems = $this->_items($this->_visibleContents(array_slice($aIds, 0, $iLimit)), $iViewerId);
        return $oReq->pageAt($aItems, count($aIds) > $iLimit ? $iOffset + $iLimit : null);
    }

    /**
     * More conditions of a module's list from its own params (_browseRows $aRestrictions): none here.
     */
    protected function _listRestrictions(BxDolApiV2Request $oReq)
    {
        return [];
    }

    /**
     * One entry, counting a view as opening its page does: 404 for none (or a hidden one, or
     * one waiting for approval, to all but its author and moderators), 403 when the viewer may
     * not see it.
     */
    protected function _get(BxDolApiV2Request $oReq)
    {
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        return $this->_one($this->_countView($aContent), (int)$oReq->viewerId());
    }

    /**
     * Keyword search of the module's entries the viewer may see, newest first.
     */
    protected function _search(BxDolApiV2Request $oReq)
    {
        $a = $this->_searchContents($oReq);
        return ['items' => $this->_items($a['contents'], (int)$oReq->viewerId()), 'next_cursor' => $a['cursor']];
    }

    /**
     * FileItemChanges: the title, the text (`text_html`, user HTML the site's form
     * filters), who may see it (`audience`: not for one in a context, which the context's
     * members see) and `comments_enabled` (the site can't turn comments off: false is 422).
     * Through the module's edit form and its check, so the site's alerts and counters apply.
     */
    protected function _update(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send title, text_html, audience or more of them']]);

        if (($mCheck = $this->_oModule->checkAllowedEdit($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden(is_string($mCheck) && $mCheck !== '' ? BxDolApiV2Map::text($mCheck) : 'The viewer may not edit this ' . static::API_NOUN);

        $aValues = [];
        if (array_key_exists('title', $aBody) && $aBody['title'] !== null) {
            if (($sTitle = trim((string)$aBody['title'])) === '')
                throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'It needs a title']]);
            $aValues[$CNF['FIELD_TITLE']] = $sTitle;
        }
        if (array_key_exists('text_html', $aBody) && $aBody['text_html'] !== null)
            $aValues[$CNF['FIELD_TEXT']] = $this->_cleanHtml((string)$aBody['text_html']);
        if (array_key_exists('audience', $aBody) && $aBody['audience'] !== null) {
            if ((int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']] < 0)
                throw BxDolApiV2Problem::validation([['field' => 'audience', 'code' => 'context_post', 'message' => 'One in a context is seen by whom the context lets see it']]);
            $aValues[$CNF['FIELD_ALLOW_VIEW_TO']] = $this->_privacyOf($aBody['audience']);
        }
        if (($aBody['comments_enabled'] ?? null) === false)
            throw BxDolApiV2Problem::validation([['field' => 'comments_enabled', 'code' => 'unsupported', 'message' => 'This site does not turn comments off']]);

        $iId = (int)$aContent[$CNF['FIELD_ID']];
        // what it is already is no change: the module's edit says it failed when no row changes
        // (the edit runs the form's db passes on what it is given)
        $aValues = $this->_changed($this->_oModule->getFormsHelper()->getObjectFormEdit(), $aValues, $aContent);
        if ($aValues) {
            $sError = $this->_withPost($this->_editPost($aContent), function () use ($iId, $aValues) {
                return BxDolApiV2Forms::editEntity($this->_oModule, $iId, $aValues);
            });
            if ($sError !== '' && $sError !== null)
                throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)]], 'It was not saved');

            // the ACL counter, as the site's edit form counts it
            $this->_oModule->checkAllowedEdit($aContent, true);
        }

        return $this->_one($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    /*
     * Uploads (POST /uploads `purpose`)
     */

    /**
     * Who may upload for a new entry: who may add one.
     * @return true|string
     */
    public function apiV2UploadAllowed($sPurpose)
    {
        $mCheck = $this->_oModule->checkAllowedAdd();
        return $mCheck === CHECK_ACTION_RESULT_ALLOWED ? true : (string)$mCheck;
    }

    /**
     * One of the viewer's uploads for a new entry that nothing took yet: the file id in $sStorage,
     * or 422 on $sField (415 for a file of another kind than $sMimePrefix).
     */
    protected function _takeUpload($sId, $iViewerId, $sStorage, $sField, $sMimePrefix)
    {
        list($iStorageId, $iFileId) = BxDolApiV2Map::uploadParts($sId);
        $aObject = BxDolStorageQuery::getStorageObject($sStorage);
        $oStorage = $iFileId && !empty($aObject['id']) && (int)$aObject['id'] === $iStorageId ? BxDolStorage::getObjectInstance($sStorage) : null;
        $aGhost = $oStorage ? $oStorage->getGhost($iFileId) : null;
        if (empty($aGhost) || (int)$aGhost['profile_id'] !== (int)$iViewerId || (int)$aGhost['content_id'] !== 0)
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'not_found', 'message' => 'No upload of yours for this that nothing has taken (POST /uploads with its purpose)']]);

        $aFile = BxDolApiV2Map::fileRow($sStorage, $iFileId);
        if (!$aFile || !str_starts_with((string)$aFile['mime_type'], $sMimePrefix))
            throw new BxDolApiV2Problem(415, 'unsupported_media_type', 'The upload is not of the kind this takes');
        return [$iFileId, $aFile];
    }

    /**
     * The title the site's upload forms give an untitled upload: its file's name without its
     * extension (seen by whoever sees the entry, as on the site).
     */
    protected function _titleFromFileName($sFileName)
    {
        // not pathinfo: it depends on the locale with multibyte names
        $sFileName = (string)$sFileName;
        return trim((string)(preg_replace('/\.[^.]*$/u', '', $sFileName) ?? $sFileName));
    }

    /*
     * Writing
     */

    /**
     * The privacy value of a new entry: a context's (its negative profile id) after checking the
     * viewer may add there, or the audience's (public by default); not both.
     */
    protected function _newPrivacy($aBody)
    {
        $iContextId = isset($aBody['context_id']) ? (int)$aBody['context_id'] : 0;
        if ($iContextId && isset($aBody['audience']))
            throw BxDolApiV2Problem::validation([['field' => 'audience', 'code' => 'context_post', 'message' => 'One in a context is seen by whom the context lets see it']]);
        if ($iContextId) {
            $this->_checkPostInContext($iContextId);
            return -$iContextId;
        }
        return $this->_privacyOf($aBody['audience'] ?? 'public');
    }

    /**
     * User HTML as the module's form keeps it (its text field filters it on save); plain text
     * becomes paragraphs.
     */
    protected function _cleanHtml($sHtml)
    {
        $sHtml = trim($sHtml);
        if ($sHtml === '')
            return '';
        return preg_match('/<[a-z][^>]*>/i', $sHtml) ? $sHtml : BxDolApiV2Map::htmlFromText($sHtml);
    }

    /**
     * Values as the form's db pass keeps what it saves (BxDolApiV2Forms::dbPassed), to check them
     * before a save. serviceEditEntity runs these passes itself: give it _changed() instead.
     */
    protected function _dbPassed($oForm, $aValues)
    {
        return BxDolApiV2Forms::dbPassed($oForm, $aValues);
    }

    /**
     * The values, as they came, that would change what the content has (BxDolApiV2Forms::changed).
     */
    protected function _changed($oForm, $aValues, $aContent)
    {
        return BxDolApiV2Forms::changed($oForm, $aValues, $aContent);
    }

    /**
     * The first category the add form offers (a module whose form asks for one); 0 for none.
     */
    protected function _defaultCategory()
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['FIELD_CATEGORY']))
            return 0;
        $oForm = $this->_oModule->getFormsHelper()->getObjectFormAdd();
        $aValues = $oForm && isset($oForm->aInputs[$CNF['FIELD_CATEGORY']]['values']) ? $oForm->aInputs[$CNF['FIELD_CATEGORY']]['values'] : [];
        foreach ((array)$aValues as $mKey => $mValue) {
            $iId = is_array($mValue) ? (int)($mValue['key'] ?? 0) : (int)$mKey;
            if ($iId > 0)
                return $iId;
        }
        return 0;
    }

    /**
     * Adds an entry through the module's add form, as the viewer, with what its form reads from
     * the request ($aPost: the source of a video, the file chosen as its main one) set for the
     * call only. The new entry's row, after the ACL counter.
     */
    protected function _add($iViewerId, $aValues, $aPost, $aFields)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $a = $this->_withPost($aPost, function () use ($iViewerId, $aValues) {
            return $this->_oModule->serviceEntityAdd($iViewerId, $aValues);
        });
        if (!isset($a['code']) || (int)$a['code'] !== 0 || empty($a['content'][$CNF['FIELD_ID']]))
            throw BxDolApiV2Problem::validation($this->_formErrors($a, $aFields), 'It was not added');

        // the ACL counter, as the site's add form counts it
        $this->_oModule->checkAllowedAdd(true);
        return $this->_oModule->_oDb->getContentInfoById((int)$a['content'][$CNF['FIELD_ID']]);
    }

    /**
     * What the module's edit form reads from the request besides its values, for an entry ($_POST).
     */
    protected function _editPost($aContent)
    {
        return [];
    }

    /**
     * Runs $fn with only $aPost as the request's POST (and GET) values, and the request's own
     * values back after it: the module's forms read some of their fields there.
     */
    protected function _withPost($aPost, callable $fn)
    {
        return BxDolApiV2Search::isolated(function () use ($aPost, $fn) {
            $_POST = $aPost;
            $_REQUEST = $aPost;
            return $fn();
        });
    }

    /*
     * Mapping shared by the shapes of entries
     */

    /**
     * ContentState: processing while the module converts its upload (`awaiting`),
     * hidden when it failed or is hidden, published otherwise.
     */
    protected function _state($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        switch ((string)($aContent[$CNF['FIELD_STATUS']] ?? 'active')) {
            case 'awaiting': return 'processing';
            case 'active': return 'published';
        }
        return 'hidden';
    }

    /**
     * Moderation, from the site's admin status.
     */
    protected function _moderation($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        switch ((string)($aContent[$CNF['FIELD_STATUS_ADMIN']] ?? 'active')) {
            case 'pending': return 'pending';
            case 'hidden': return 'rejected';
        }
        return 'approved';
    }

    /**
     * One entry as its class maps it, with its text and the viewer's reaction and favourite
     * (single answers).
     */
    protected function _full($aContent, $iViewerId)
    {
        $this->_bFull = true;
        try {
            return $this->_itemOrFail($aContent, $iViewerId);
        }
        finally {
            $this->_bFull = false;
        }
    }

    /**
     * How many reacted: the count the module's reactions object keeps on the entry's row.
     */
    protected function _reactionCount($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oReactions = !empty($CNF['OBJECT_REACTIONS']) ? BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], 0, false) : null;
        $aInfo = $oReactions ? $oReactions->getSystemInfo() : [];
        $sField = (string)($aInfo['trigger_field_count'] ?? '');
        return $sField !== '' ? (int)($aContent[$sField] ?? 0) : 0;
    }

    /**
     * The ItemViewer of an entry: the reaction and the favourite are read on single answers only (null
     * and false in lists), and so are can_react and can_comment; can_edit and can_delete always.
     */
    protected function _itemViewer($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iViewerId = (int)bx_get_logged_profile_id();

        $aViewer = [
            'reaction' => null,
            'favorited' => false,
            'can_react' => false,
            'can_comment' => false,
            'can_edit' => $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED,
            'can_delete' => $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
        ];
        if (!$this->_bFull)
            return $aViewer;

        if (!empty($CNF['OBJECT_REACTIONS']) && ($oReactions = BxDolVote::getObjectInstance($CNF['OBJECT_REACTIONS'], $iId)) && $oReactions->isEnabled()) {
            $aViewer['reaction'] = $oReactions->getReactionsBy($iId, $iViewerId)[0] ?? null;
            $aViewer['can_react'] = (bool)$oReactions->isAllowedVote();
        }
        if (!empty($CNF['OBJECT_FAVORITES']) && ($oFavorite = BxDolFavorite::getObjectInstance($CNF['OBJECT_FAVORITES'], $iId)) && $oFavorite->isEnabled())
            $aViewer['favorited'] = (bool)$oFavorite->getQueryObject()->isPerformed($iId, $iViewerId);
        if (!empty($CNF['OBJECT_COMMENTS']) && ($oCmts = BxDolCmts::getObjectInstance($CNF['OBJECT_COMMENTS'], $iId)) && $oCmts->isEnabled())
            $aViewer['can_comment'] = (bool)$oCmts->isPostAllowed();
        return $aViewer;
    }

    /**
     * A page of entries as their class maps them (_item): its entries' Items, their files (the
     * uploads' rows, which copies the transcoders made, and those copies' rows: _primeMedia),
     * their pages' SEO links and their authors' badges, pictures and pages
     * (BxDolApiV2Map::primeProfiles) read at once. $bFull: as single answers (_one).
     */
    protected function _items($aContents, $iViewerId, $bFull = false)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        BxDolApiV2Targets::primeContent($this->_oModule->getName(), array_column($aContents, $CNF['FIELD_ID']));

        $iRows = BxDolStorageQuery::openFileRowsScope();
        $iHandlers = BxDolTranscoderQuery::openHandlersScope();
        $iSeo = BxDolPageQuery::openSeoLinksScope();
        try {
            $this->_primeMedia($aContents);
            BxDolApiV2Map::primeProfiles(array_column($aContents, $CNF['FIELD_AUTHOR']));
            if (getParam('permalinks_seo_links') && !empty($CNF['URI_VIEW_ENTRY']))
                BxDolPageQuery::primeSeoLinks($this->_oModule->getName(), $CNF['URI_VIEW_ENTRY'], array_column($aContents, $CNF['FIELD_ID']));

            $this->_bFull = (bool)$bFull;
            $aItems = [];
            foreach ($aContents as $aContent)
                $aItems[] = $this->_itemOrFail($aContent, $iViewerId);
            return $aItems;
        }
        finally {
            $this->_bFull = false;
            BxDolPageQuery::closeSeoLinksScope($iSeo);
            BxDolTranscoderQuery::closeHandlersScope($iHandlers);
            BxDolStorageQuery::closeFileRowsScope($iRows);
        }
    }

    /**
     * One entry as a single answer (its text, the viewer's reaction and favourite: _full), what
     * it shows read as a page's are (_items), so one entry costs no more than a page of one.
     */
    protected function _one($aContent, $iViewerId)
    {
        return $this->_items([$aContent], $iViewerId, true)[0];
    }

    /**
     * Reads the files of a page of entries at once, inside the scopes _items opens
     * (BxDolStorage::primeFileRows, BxDolTranscoder::primeFiles). The module's class knows its files.
     */
    protected function _primeMedia($aContents)
    {
    }

    /**
     * One entry in the module's shape (FileItem for files, Album for albums ...), with
     * its text where _bFull says so. The module's class (or its base) maps it: this one maps
     * none and gives an empty array, which _itemOrFail refuses.
     */
    protected function _item($aContent, $iViewerId)
    {
        return [];
    }

    /**
     * _item of an entry; a class that maps no entries (it has no _item of its own) is a mistake
     * in the code, not something to answer with.
     */
    protected function _itemOrFail($aContent, $iViewerId)
    {
        $aItem = $this->_item($aContent, $iViewerId);
        if (!$aItem)
            throw new LogicException(static::class . ' maps no entries');
        return $aItem;
    }
}

/** @} */
