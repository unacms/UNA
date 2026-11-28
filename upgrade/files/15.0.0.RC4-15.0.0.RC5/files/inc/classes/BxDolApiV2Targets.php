<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    UnaCore UNA Core
 * @{
 */

/**
 * API v2: where something on the site is in the API, as a target a client can route to.
 * - content: an Item (`/content/{id}`, the Timeline event that shows the entry);
 * - comment: a Comment (its unique id), with the Item it is on and, for a reply, the
 *   top-level comment it is shown under (`/comments/{id}/replies`);
 * - profile, group: a profile (`/profiles/{id}`); group for contexts (groups, events, spaces);
 * - conversation: a conversation (`/conversations/{id}`).
 *
 * The modules that know their content say where it is. An endpoint class (system or a
 * module's ApiV2 class) may define (BxDolApiV2Router::hooks):
 * - apiV2ContentTarget($sModule, $iContentId): the target of a module's content entry, or
 *   null. The class of that module is asked first; the Timeline answers for the content of
 *   any module it shows.
 * - apiV2NotificationTarget($aEvent): the target of a notification event it knows better than
 *   the general rules of the Notifications module, or null.
 * - apiV2NotificationKind($aEvent, $aTarget, $iViewerId): the kind and data of a
 *   notification event of its own units (BxNtfsApiV2::_kind), or null.
 * - apiV2ItemKind($sModule): the Item.kind of a module's content (`post`,
 *   `discussion`), or null; the Timeline asks the module's own class first.
 * - apiV2TargetVisible($aTarget): whether the viewer may see a target of its own (an Item, a
 *   conversation): true or false, or null for a target it doesn't know.
 * - apiV2Item($iId): the Item of an id, for the endpoints that work on any Item (its comments
 *   and reactions: item()): its row, false for one the viewer may not see, null for an id it
 *   doesn't know. The Timeline answers: an Item is the event that shows the entry.
 * - apiV2ItemIdsByComments($sSystem, $iObjectId): the ids of the Items that may show the
 *   comments of a comments object's entry (itemIdsByComments()), or null.
 *
 * A target says where to look, not that the viewer may see it: the endpoint that shows the
 * target checks access, as always. Only a link (url()) is checked here, since anyone may ask
 * about any link and the answer must not tell whether something hidden from them exists.
 */
class BxDolApiV2Targets
{
    const CONTENT = 'content';
    const COMMENT = 'comment';
    const PROFILE = 'profile';
    const GROUP = 'group';
    const CONVERSATION = 'conversation';

    /** The thread above a reply is looked up this many levels at most, when its level is not known. */
    const PARENTS_MAX = 20;
    /** However deep its level says a comment is, the walk up stops after this many steps. */
    const LEVELS_MAX = 100;

    protected static $_aContent = [];
    protected static $_aComments = [];
    /** The top-level comment above each comment looked up: "system:cmt_id" => row. */
    protected static $_aTops = [];

    /**
     * Forget what this request looked up (tests that change content in-process).
     */
    public static function reset()
    {
        self::$_aContent = [];
        self::$_aComments = [];
        self::$_aTops = [];
    }

    /**
     * A target: kind, the id of what it is, the Item a comment is on and the top-level
     * comment a reply is shown under (0 when there is none).
     */
    public static function make($sKind, $iId, $iItemId = 0, $iThreadId = 0)
    {
        return ['kind' => $sKind, 'id' => (int)$iId, 'item_id' => (int)$iItemId, 'thread_id' => (int)$iThreadId];
    }

    /**
     * The Item of an id (`/content/{id}`), as the endpoint class that shows Items knows it
     * (apiV2Item): its row, with `id` and, where it takes them, `comments` and `reactions`
     * (each ['system' => the object, 'object_id' => its entry there]). False for an Item the
     * viewer may not see, null when there is none (or no enabled module shows Items).
     */
    public static function findItem($iId)
    {
        $bForbidden = false;
        foreach (BxDolApiV2Router::hooks('apiV2Item') as $oEndpoint) {
            $m = $oEndpoint->apiV2Item((int)$iId);
            if (is_array($m) && $m)
                return $m;
            $bForbidden = $bForbidden || $m === false;
        }
        return $bForbidden ? false : null;
    }

    /**
     * findItem(), or a problem: 403 for an Item the viewer may not see, 404 when there is none.
     * @throws BxDolApiV2Problem
     */
    public static function item($iId)
    {
        $m = self::findItem($iId);
        if (is_array($m))
            return $m;
        if ($m === false)
            throw BxDolApiV2Problem::forbidden('The viewer may not see this activity');
        throw BxDolApiV2Problem::notFound('The activity');
    }

    /**
     * The ids of the Items that may show the comments of a comments object's entry
     * (apiV2ItemIdsByComments), the likeliest first; the caller checks which one does.
     */
    public static function itemIdsByComments($sSystem, $iObjectId)
    {
        foreach (BxDolApiV2Router::hooks('apiV2ItemIdsByComments') as $oEndpoint)
            if (is_array($m = $oEndpoint->apiV2ItemIdsByComments((string)$sSystem, (int)$iObjectId)))
                return $m;
        return [];
    }

    /**
     * A module's content entry: the profile of a profile module's entry, otherwise what the
     * modules say (an Item, a conversation). Null when no module knows it.
     */
    public static function content($sModule, $iContentId)
    {
        $iContentId = (int)$iContentId;
        if ($sModule === '' || $sModule === 'system' || $iContentId <= 0 || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return null;

        $sKey = $sModule . ':' . $iContentId;
        if (array_key_exists($sKey, self::$_aContent))
            return self::$_aContent[$sKey];

        $aTarget = null;
        if (BxDolRequest::serviceExists($sModule, 'act_as_profile')) {
            $oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $sModule);
            $aTarget = $oProfile ? self::profile($oProfile->id()) : null;
        }
        else {
            foreach (BxDolApiV2Router::hooks('apiV2ContentTarget', $sModule) as $oEndpoint) {
                $m = $oEndpoint->apiV2ContentTarget($sModule, $iContentId);
                if (is_array($m)) {
                    $aTarget = $m;
                    break;
                }
            }
        }

        return self::$_aContent[$sKey] = $aTarget;
    }

    /**
     * Looks up the targets of a page of a module's content at once (content() then answers
     * from memory): the first endpoint that reads many at once (apiV2ContentTargets, the
     * Timeline's: one query for the page) says for each one. A profile module's content is
     * its profile, which needs no lookup.
     */
    public static function primeContent($sModule, $aContentIds)
    {
        if ($sModule === '' || $sModule === 'system' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule) || BxDolRequest::serviceExists($sModule, 'act_as_profile'))
            return;

        $aMissing = [];
        foreach ((array)$aContentIds as $mId)
            if (($i = (int)$mId) > 0 && !array_key_exists($sModule . ':' . $i, self::$_aContent))
                $aMissing[$i] = $i;
        if (!$aMissing)
            return;

        foreach (BxDolApiV2Router::hooks('apiV2ContentTargets', $sModule) as $oEndpoint) {
            $m = $oEndpoint->apiV2ContentTargets($sModule, array_values($aMissing));
            if (!is_array($m))
                continue;
            foreach ($aMissing as $i)
                self::$_aContent[$sModule . ':' . $i] = $m[$i] ?? null;
            return;
        }
    }

    /**
     * What the view checks of content in these contexts (group profiles) read, read at once:
     * the contexts' profiles, entries and privacy (BxDolApiV2Map::primeProfiles) and the
     * viewer's membership of each (its module's fans connection, both ways; none for a guest)
     * and role there (BxBaseModGroupsDb::primeRoles), for a page of content from many contexts (a search's).
     */
    public static function primeContexts($aProfileIds)
    {
        $aIds = array_values(array_unique(array_filter(array_map('intval', (array)$aProfileIds), function ($i) { return $i > 0; })));
        if (!$aIds)
            return;
        BxDolApiV2Map::primeProfiles($aIds);

        $aByModule = [];
        foreach ($aIds as $iId)
            if (($oProfile = BxDolProfile::getInstance($iId)) && ($sModule = $oProfile->getModule()) !== 'system')
                $aByModule[$sModule][] = $iId;
        $iViewerId = (int)bx_get_logged_profile_id();
        foreach ($aByModule as $sModule => $aModuleIds) {
            $CNF = BxDolApiV2Map::profileCnf($sModule);
            $oFans = !empty($CNF['OBJECT_CONNECTIONS']) ? BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTIONS']) : null;
            if ($oFans)
                $oFans->primeConnections(max(0, $iViewerId), $aModuleIds);
            $oModule = BxDolModule::getInstance($sModule);
            $oDb = $oModule && is_object($oModule->_oDb) ? $oModule->_oDb : null;
            if (!$oDb)
                continue;
            // the viewer's role in each (a context's admins may do more there)
            if ($iViewerId > 0 && method_exists($oDb, 'primeRoles'))
                $oDb->primeRoles($iViewerId, $aModuleIds);
            // who manages the content of each (an entry's active check asks it), their roles and
            // whether they are still fans, and the viewer's invitations (the view check's): read
            // for all of them at the first check that asks
            if (method_exists($oDb, 'primeContextsLater'))
                $oDb->primeContextsLater($aModuleIds);
        }
    }

    /**
     * A profile by its id: a group for contexts.
     */
    public static function profile($iProfileId)
    {
        $oProfile = BxDolProfile::getInstance((int)$iProfileId);
        if (!$oProfile || (int)$oProfile->id() <= 0)
            return null;
        return self::make(BxDolApiV2Map::profileKind($oProfile->getModule()) === 'group' ? self::GROUP : self::PROFILE, $oProfile->id());
    }

    /**
     * A comment by its unique id (sys_cmts_ids).
     */
    public static function commentByUniqId($iUniqId)
    {
        $aInfo = BxDolCmtsQuery::getInfoByUniqId((int)$iUniqId);
        if (empty($aInfo['system_name']) || empty($aInfo['cmt_id']))
            return null;
        return self::comment($aInfo['system_name'], (int)$aInfo['cmt_id']);
    }

    /**
     * A comment of a comments object, by its id there (cmt_id). A message of a conversation
     * is the conversation; a comment on a profile is the profile. Comments that are not on an
     * entry of their module (notes, comments on an album's photos) have no target here.
     */
    public static function comment($sSystem, $iCmtId)
    {
        $iCmtId = (int)$iCmtId;
        if ($iCmtId <= 0)
            return null;

        $sKey = $sSystem . ':' . $iCmtId;
        if (!array_key_exists($sKey, self::$_aComments))
            self::$_aComments[$sKey] = self::_comment($sSystem, $iCmtId);
        return self::$_aComments[$sKey];
    }

    /**
     * A link to a page of this site: the entry an entry's view page shows (a post, a profile,
     * a group, a conversation), or null for any other link. The link is read the way the site
     * reads it: permalinks and SEO links become the standard page.php link first.
     */
    public static function url($sUrl)
    {
        $sRelative = self::relativeUrl($sUrl);
        if ($sRelative === null)
            return null;

        $sStandard = BxDolPermalinks::getInstance()->unpermalink($sRelative);
        $aParts = parse_url($sStandard);
        if (!is_array($aParts) || ($aParts['path'] ?? '') !== 'page.php' || empty($aParts['query']))
            return null;

        parse_str($aParts['query'], $aQuery);
        $sUri = isset($aQuery['i']) && is_string($aQuery['i']) ? $aQuery['i'] : '';
        $sId = isset($aQuery['id']) && is_string($aQuery['id']) ? $aQuery['id'] : '';
        if ($sUri === '' || !preg_match('/^[1-9][0-9]{0,18}$/', $sId))
            return null;

        $sPage = BxDolPageQuery::getPageObjectNameByURI($sUri, false, true);
        $aPage = $sPage ? BxDolPageQuery::getPageObject($sPage) : false;
        $sModule = is_array($aPage) ? (string)($aPage['module'] ?? '') : '';
        if ($sModule === '' || $sModule === 'system' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return null;

        // only the page that shows one entry of the module
        $oModule = BxDolModule::getInstance($sModule);
        if (!$oModule || !isset($oModule->_oConfig->CNF['URI_VIEW_ENTRY']) || $oModule->_oConfig->CNF['URI_VIEW_ENTRY'] !== $aPage['uri'])
            return null;

        $aTarget = self::content($sModule, (int)$sId);
        return $aTarget && self::visible($aTarget) ? $aTarget : null;
    }

    /**
     * Whether the viewer may see a target, as the endpoint that shows it would answer: false
     * when the endpoint class that knows the target says so (apiV2TargetVisible).
     */
    public static function visible($aTarget)
    {
        foreach (BxDolApiV2Router::hooks('apiV2TargetVisible') as $oEndpoint)
            if ($oEndpoint->apiV2TargetVisible($aTarget) === false)
                return false;
        return true;
    }

    /**
     * A context (group, space ...) whose content a list filters by (`context` of GET /events,
     * `context_id` of GET /discussions): its profile, as the viewer may know it. 422 on $sField,
     * the param the client sent:
     * - `not_found` for an id that is no context of an enabled module, and for one the viewer
     *   may not know of (GET /{tag}/{id} would answer 404: a secret one to those outside it), so
     *   the answer never tells that it exists;
     * - `invalid_value` for a context of a kind $oContentModule never keeps its content in (its
     *   serviceCheckAllowedAddInContext, as its add form offers contexts), when it is given.
     * 403 when the viewer may know of it but not see what is in it (a closed one from outside).
     */
    public static function viewableContext($iContextId, $sField, $oContentModule = null)
    {
        $oContext = (int)$iContextId > 0 ? BxDolProfile::getInstance((int)$iContextId) : false;
        $sModule = $oContext ? $oContext->getModule() : '';
        $oModule = $oContext && BxDolApiV2Map::profileKind($sModule) === 'group' && BxDolModuleQuery::getInstance()->isEnabledByName($sModule) ? BxDolModule::getInstance($sModule) : null;
        $aContent = $oModule ? BxDolApiV2Map::profileContent($oContext) : [];
        if (!$oModule || !$aContent || !BxBaseApiV2Profiles::isAvailable($oContext, $oModule) || !self::visible(self::make(self::GROUP, $oContext->id())))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'not_found', 'message' => 'No such context']]);
        if ($oContentModule && $oContentModule->serviceCheckAllowedAddInContext($sModule) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'invalid_value', 'message' => 'This kind of context keeps none']]);
        if ($oModule->checkAllowedView($aContent) !== CHECK_ACTION_RESULT_ALLOWED)
            throw BxDolApiV2Problem::forbidden('The viewer may not see what is in this context');
        return $oContext;
    }

    /**
     * An id query param ($sName): 0 when it is not sent, 422 when it is no id.
     */
    public static function idParam(BxDolApiV2Request $oReq, $sName)
    {
        $s = $oReq->query($sName);
        if ($s === null)
            return 0;
        if (!is_string($s) || !preg_match('/^[1-9][0-9]{0,18}$/', $s))
            throw BxDolApiV2Problem::validation([['field' => $sName, 'code' => 'invalid_value', 'message' => 'Must be an id']]);
        return (int)$s;
    }

    /**
     * The part of a link after the site's root (path and query, no fragment), or null when
     * the link is not to this site. http and https count as the same site.
     */
    public static function relativeUrl($sUrl)
    {
        $aUrl = parse_url(trim((string)$sUrl));
        $aRoot = parse_url(BX_DOL_URL_ROOT);
        if (!is_array($aUrl) || !is_array($aRoot) || empty($aUrl['host']) || empty($aUrl['scheme']))
            return null;
        if (!in_array(mb_strtolower($aUrl['scheme']), ['http', 'https'], true) || isset($aUrl['user']) || isset($aUrl['pass']))
            return null;

        $fPort = function ($a) {
            return isset($a['port']) ? (int)$a['port'] : (mb_strtolower($a['scheme'] ?? '') === 'https' ? 443 : 80);
        };
        $bSameHost = mb_strtolower($aUrl['host']) === mb_strtolower($aRoot['host'] ?? '');
        // the same port, or each scheme's default (a site on http and https)
        $bSamePort = $fPort($aUrl) === $fPort($aRoot) || (!isset($aUrl['port']) && !isset($aRoot['port']));
        if (!$bSameHost || !$bSamePort)
            return null;

        $sRootPath = $aRoot['path'] ?? '/';
        $sPath = $aUrl['path'] ?? '/';
        if ($sPath === rtrim($sRootPath, '/'))
            $sPath = $sRootPath;
        if (bx_mb_strpos($sPath, $sRootPath) !== 0)
            return null;

        $sRelative = get_mb_substr($sPath, get_mb_len($sRootPath), get_mb_len($sPath));
        return $sRelative . (isset($aUrl['query']) && $aUrl['query'] !== '' ? '?' . $aUrl['query'] : '');
    }

    protected static function _comment($sSystem, $iCmtId)
    {
        $aSystems = BxDolCmts::getSystems();
        $sModule = (string)($aSystems[$sSystem]['module'] ?? '');
        if ($sModule === '' || !BxDolModuleQuery::getInstance()->isEnabledByName($sModule))
            return null;

        // only the module's own comments are on its entries
        $oModule = BxDolModule::getInstance($sModule);
        if (!$oModule || ($oModule->_oConfig->CNF['OBJECT_COMMENTS'] ?? '') !== $sSystem)
            return null;

        $oCmts = BxDolCmts::getObjectInstance($sSystem, 0, false);
        if (!$oCmts)
            return null;

        $oQuery = $oCmts->getQueryObject();
        $aCmt = $oQuery->getCommentById($iCmtId);
        if (empty($aCmt) || !is_array($aCmt))
            return null;

        $aTarget = self::content($sModule, (int)$aCmt['cmt_object_id']);
        if (!$aTarget || $aTarget['kind'] !== self::CONTENT)
            return $aTarget;

        $aTop = self::_top($sSystem, $oQuery, $aCmt);

        $fUniqId = function ($a) use ($oCmts) {
            // a comment from before unique ids gets one now, as the site does
            return !empty($a['cmt_unique_id']) ? (int)$a['cmt_unique_id'] : (int)$oCmts->getCommentUniqId((int)$a['cmt_id'], (int)$a['cmt_author_id']);
        };
        $iUniqId = $fUniqId($aCmt);
        if ($iUniqId <= 0)
            return null;

        $iThreadId = (int)$aTop['cmt_id'] !== $iCmtId ? $fUniqId($aTop) : 0;
        return self::make(self::COMMENT, $iUniqId, $aTarget['id'], $iThreadId);
    }

    /**
     * The top-level comment a comment is shown under (itself for a top-level one). Every comment
     * the walk up passes is remembered with it, so the replies of one thread read its parents
     * once. The walk takes as many steps as the comment's level says (PARENTS_MAX when it has
     * none, LEVELS_MAX at most) and stops at a parent that is gone or one it passed.
     */
    protected static function _top($sSystem, $oQuery, $aCmt)
    {
        // at least one step for a reply, however its level was saved; never without end
        $iSteps = isset($aCmt['cmt_level']) ? min(max(1, (int)$aCmt['cmt_level']), self::LEVELS_MAX) : self::PARENTS_MAX;
        $aPassed = [];
        $aTop = $aCmt;
        for ($i = 0; $i < $iSteps && (int)$aTop['cmt_parent_id'] > 0; $i++) {
            $sKey = $sSystem . ':' . (int)$aTop['cmt_id'];
            if (isset(self::$_aTops[$sKey])) {
                $aTop = self::$_aTops[$sKey];
                break;
            }
            $aPassed[] = $sKey;

            $iParentId = (int)$aTop['cmt_parent_id'];
            if (in_array($sSystem . ':' . $iParentId, $aPassed, true))
                break;
            $aParent = $oQuery->getCommentById($iParentId);
            if (empty($aParent) || !is_array($aParent))
                break;
            $aTop = $aParent;
        }

        foreach ($aPassed as $sKey)
            self::$_aTops[$sKey] = $aTop;
        return $aTop;
    }
}

/** @} */
