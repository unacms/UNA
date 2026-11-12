<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    BaseGroups Base classes for groups modules
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 for context modules (groups, spaces, and later events): what a context is, who is in
 * it and joining or leaving it. A module's own `<Prefix>ApiV2` class extends this one and puts
 * the operation attributes on its paths (/groups, /spaces ...), since attributes can't be
 * shared; the work is here. API_TAG, API_KIND and API_NOUN name the module's paths, the kind of
 * its entries in GET /api/v2's `modules` and the word its problems use.
 *
 * A context is a profile: its id is its profile id, its feed is GET /profiles/{id}/timeline and
 * posting into it is POST /feed-posts with `context_id`. Membership is the module's fans
 * connection (CNF OBJECT_CONNECTIONS, mutual): a member is connected both ways, a request is the
 * member's half, and an invitation is a row of the module's invites table. Every change goes
 * through the connection object's own actions and the module's services, so the module's
 * checks (bans, questionnaires, paid join), its alerts (join requests to the admins, the follow
 * on join) and notifications are the site's.
 */
class BxBaseModGroupsApiV2
{
    const ACCESS_FULL = 'full';
    const ACCESS_PARTIAL = 'partial';
    const ACCESS_DENIED = 'denied';
    const ACCESS_HIDDEN = 'hidden';

    /** How many of the viewer's groups GET /me/groups lists at most. */
    const MY_GROUPS_MAX = 200;

    /** The tag of the module's paths (/groups), its entries' kind and the word for one. */
    const API_TAG = 'groups';
    const API_KIND = 'group';
    const API_NOUN = 'group';

    protected $_oModule;

    /** The content kinds each context module takes (apiV2ContextContent), per request. */
    protected static $_aContentKinds = [];

    public function __construct($sModule)
    {
        $this->_oModule = BxDolModule::getInstance($sModule);

        // the privacy class defines the module's privacy groups (BX_BASE_MOD_GROUPS_PG_*)
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['OBJECT_PRIVACY_VIEW']))
            BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']);
    }

    /**
     * Contexts the viewer is a member of, most recently joined first: one list for
     * GET /me/groups, of the MY_GROUPS_MAX newest memberships (each Group reads a
     * dozen module checks, so 500 would be too slow here).
     */
    protected function _myGroups(BxDolApiV2Request $oReq)
    {
        return $this->_isolated(function () use ($oReq) {
            $iViewerId = (int)$oReq->requireViewer();

            // the member's half of each membership: the viewer is the initiator, the context the content
            $aRows = $this->_fans()->getConnectedContentWithDates($iViewerId, true, 0, static::MY_GROUPS_MAX, BX_CONNECTIONS_ORDER_ADDED_DESC);

            $aRows = is_array($aRows) ? $aRows : [];
            BxDolApiV2Map::primeBadges(array_keys($aRows));
            $aProfiles = [];
            foreach ($aRows as $iGroupId => $iAdded)
                if (($oProfile = $this->_profile((int)$iGroupId)))
                    $aProfiles[] = $oProfile;
            $this->_prime($aProfiles);
            $aItems = [];
            foreach ($aProfiles as $oProfile)
                if (($a = $this->_groupIfListed($oProfile, $iViewerId)))
                    $aItems[] = $a;

            return $aItems;
        });
    }

    /**
     * Active contexts of the module the viewer may find, newest first, as the module's own
     * browse page lists them (its search result in `recent` mode, or another of its modes,
     * with the module's privacy conditions): public ones, closed ones (name and picture),
     * never secret ones. $aRestrictions are more conditions of the search result (a parent).
     */
    protected function _browse(BxDolApiV2Request $oReq, $sMode = 'recent', $aRestrictions = [])
    {
        return $this->_isolated(function () use ($oReq, $sMode, $aRestrictions) {
            $iViewerId = (int)$oReq->viewerId();
            $iOffset = $oReq->cursorOffset();
            $iLimit = $oReq->limit();

            $aRows = $this->_browseRows($iOffset, $iLimit + 1, $sMode, $aRestrictions);

            $aProfiles = [];
            foreach (array_slice($aRows, 0, $iLimit) as $iContentId)
                if (($oProfile = BxDolProfile::getInstanceByContentAndType($iContentId, $this->_oModule->getName())))
                    $aProfiles[] = $oProfile;
            BxDolApiV2Map::primeBadges(array_map(function ($oProfile) { return (int)$oProfile->id(); }, $aProfiles));
            $this->_prime($aProfiles);

            $aItems = [];
            foreach ($aProfiles as $oProfile)
                if (($a = $this->_groupIfListed($oProfile, $iViewerId)))
                    $aItems[] = $a;

            return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
        });
    }

    /**
     * One context: 404 when there is none of this module or the viewer may not know it exists (a
     * secret one, to all but its members and invitees), 403 when the viewer may not see it at all.
     */
    protected function _get(BxDolApiV2Request $oReq)
    {
        return $this->_isolated(function () use ($oReq) {
            $oProfile = $this->_existing($oReq->id());
            $sAccess = $this->_access($oProfile);
            $this->_refuse($sAccess);
            $this->_prime([$oProfile]);
            return $this->_group($oProfile, $sAccess, (int)$oReq->viewerId());
        });
    }

    /**
     * Join: at once when the context is open or the viewer was invited, as a request to its
     * admins otherwise. Joining again (or asking again) is not an error.
     */
    protected function _join(BxDolApiV2Request $oReq)
    {
        return $this->_isolated(function () use ($oReq) {
            $iViewerId = (int)$oReq->requireViewer();
            $this->_forgetPrimed();
            $oProfile = $this->_existing($oReq->id());
            $iGroupId = (int)$oProfile->id();
            $this->_refuse($this->_access($oProfile));

            $sStatus = $this->_status($iGroupId, $iViewerId);
            if ($sStatus === 'active' || $sStatus === 'pending')
                return ['status' => $sStatus];

            // an invitation of the invites table: the module's own accept, as its invitation link does
            if ($sStatus === 'invited' && ($sKey = $this->_inviteKey($iGroupId, $iViewerId)) !== '') {
                $this->_oModule->serviceProcessInvite($sKey, $iGroupId, true);
                return $this->_joined($iGroupId, $iViewerId);
            }

            if (($sSite = $this->_joinOnSite($iGroupId, $iViewerId)) !== '')
                throw new BxDolApiV2Problem(409, $sSite, $sSite === 'paid_join' ? 'This ' . static::API_NOUN . ' asks for a payment to join: join on the site' : 'This ' . static::API_NOUN . ' asks questions before one joins: join on the site');

            $aContent = BxDolApiV2Map::profileContent($oProfile);
            if (($mCheck = $this->_oModule->checkAllowedFanAdd($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

            $oFans = $this->_fans();
            $a = $oFans->actionAdd($iGroupId, $iViewerId);
            if (!empty($a['err']) && !$oFans->isConnected($iViewerId, $iGroupId))
                throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));

            return $this->_joined($iGroupId, $iViewerId);
        });
    }

    /**
     * Leave, withdraw a request or decline an invitation. Not being in the context is not an error.
     */
    protected function _leave(BxDolApiV2Request $oReq)
    {
        return $this->_isolated(function () use ($oReq) {
            $iViewerId = (int)$oReq->requireViewer();
            $this->_forgetPrimed();
            $oProfile = $this->_existing($oReq->id());
            $iGroupId = (int)$oProfile->id();

            $oFans = $this->_fans();
            $fConnected = function () use ($oFans, $iGroupId, $iViewerId) {
                return $oFans->isConnected($iViewerId, $iGroupId) || $oFans->isConnected($iGroupId, $iViewerId);
            };

            if ($fConnected()) {
                $aContent = BxDolApiV2Map::profileContent($oProfile);
                if (($mCheck = $this->_oModule->checkAllowedFanRemove($aContent)) !== CHECK_ACTION_RESULT_ALLOWED)
                    throw BxDolApiV2Problem::forbidden(is_string($mCheck) ? BxDolApiV2Map::text($mCheck) : '');

                $a = $oFans->actionRemove($iGroupId, $iViewerId);
                if ($fConnected())
                    throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($a['msg'] ?? ''));
            }
            elseif (($sKey = $this->_inviteKey($iGroupId, $iViewerId)) !== '')
                $this->_oModule->serviceProcessInvite($sKey, $iGroupId, false);
            else
                // nothing to leave; a context the viewer may not know of is still 404
                $this->_refuse($this->_access($oProfile));

            return BxDolApiV2Response::noContent();
        });
    }

    /**
     * Members, the most recently joined first: to those who may see the context's content.
     */
    protected function _members(BxDolApiV2Request $oReq)
    {
        return $this->_isolated(function () use ($oReq) {
            $oProfile = $this->_existing($oReq->id());
            $iGroupId = (int)$oProfile->id();
            $sAccess = $this->_access($oProfile);
            $this->_refuse($sAccess);
            if ($sAccess !== self::ACCESS_FULL)
                throw BxDolApiV2Problem::forbidden('Only members see who is in this ' . static::API_NOUN);

            $oFans = $this->_fans();
            $iOffset = $oReq->cursorOffset();
            $iLimit = $oReq->limit();

            // the context's half of each membership, as the module's own members block reads it
            $aRows = $oFans->getConnectedContentWithDates($iGroupId, true, $iOffset, $iLimit + 1, BX_CONNECTIONS_ORDER_ADDED_DESC);
            $aRows = is_array($aRows) ? $aRows : [];

            $aContent = BxDolApiV2Map::profileContent($oProfile);
            // every row is a member's: their roles in one query, not one per member, and their
            // profiles read at once
            $aShown = array_slice($aRows, 0, $iLimit, true);
            $aRoles = $this->_roles($iGroupId, array_keys($aShown));
            $aSummaries = BxBaseApiV2Profiles::summaries(array_keys($aShown));
            $aItems = [];
            foreach ($aShown as $iMemberId => $iAdded) {
                if (!($aSummary = $aSummaries[(int)$iMemberId] ?? null))
                    continue;
                $aItems[] = [
                    'profile' => $aSummary,
                    'role' => $this->_role($iGroupId, (int)$iMemberId, $aContent, (int)($aRoles[(int)$iMemberId] ?? 0)),
                    'status' => 'active',
                    'since' => BxDolApiV2Map::date((int)$iAdded),
                ];
            }

            return $oReq->pageAt($aItems, count($aRows) > $iLimit ? $iOffset + $iLimit : null);
        });
    }

    /**
     * Runs an operation without the request's query and form params (the request object has its
     * own copy): the module's view and invitation checks read `key`, an invitation link's key,
     * which here would let a stray param hide a real invitation or change which one is used.
     */
    protected function _isolated(callable $fn)
    {
        return BxDolApiV2Search::isolated($fn);
    }

    /*
     * Mapping
     */

    /**
     * The Group shape of a context. A partly visible one (closed, to those outside it) has its
     * name and picture, as the site shows such a page, and no about or cover.
     */
    protected function _group($oProfile, $sAccess, $iViewerId)
    {
        $iGroupId = (int)$oProfile->id();
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        $bFull = $sAccess === self::ACCESS_FULL;

        $a = BxDolApiV2Map::profile($iGroupId);
        if (!$bFull) {
            $aSummary = BxDolApiV2Map::profileSummary($iGroupId);
            $a['avatar'] = $aSummary['avatar'] ?? null;
            $a['about'] = '';
            $a['cover'] = null;
        }

        return array_merge($a, [
            'visibility' => static::visibility($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? ''),
            'join_policy' => !empty($CNF['FIELD_JOIN_CONFIRMATION']) && !empty($aContent[$CNF['FIELD_JOIN_CONFIRMATION']]) ? 'approval' : 'open',
            'member_count' => $this->_memberCount($iGroupId),
            'content_visible' => $bFull,
            'content_kinds' => $this->_contentKinds(),
            'viewer' => $iViewerId ? $this->_viewer($oProfile, $iViewerId, $bFull) : null,
        ]);
    }

    /**
     * Read what the mapping of these contexts needs for all of them at once, before a page
     * maps them one by one, so that a page runs these queries once and not once per context:
     * - their member counts, in one query;
     * - the viewer's memberships, requests and invitations of the fans connection, both ways,
     *   in one query, kept where the connection object's isConnected reads them (the module's
     *   own checks then need no query of their own for them either);
     * - the viewer's invitations of the module's invites table, in one query.
     * A module with more to show reads it in one query too, after these.
     */
    protected function _prime(array $aProfiles)
    {
        $aIds = array_values(array_unique(array_map(function ($oProfile) { return (int)$oProfile->id(); }, $aProfiles)));
        $oFans = $aIds ? $this->_oModule->serviceGetFansConnectionObject() : null;
        if (!$oFans)
            return;

        foreach ($oFans->getConnectedContentCounts($aIds, true) as $iId => $iCount)
            $this->_aMemberCounts[(int)$iId] = (int)$iCount;

        $iViewerId = (int)bx_get_logged_profile_id();
        if ($iViewerId <= 0)
            return;
        $oFans->primeConnections($iViewerId, $aIds);
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['TABLE_INVITES'])) {
            $aInvites = $this->_oModule->_oDb->getInvites(['sample' => 'invited_pid', 'invited_pid' => $iViewerId]);
            $this->_aInvites[$iViewerId] = is_array($aInvites) ? $aInvites : [];
        }
    }

    /** Member counts read by _prime: profile id => count. */
    protected $_aMemberCounts = [];
    /** The viewer's invitations read by _prime: viewer id => context profile id => row. */
    protected $_aInvites = [];

    /**
     * Forget what _prime read: a change (joining, leaving) makes it stale.
     */
    protected function _forgetPrimed()
    {
        $this->_aMemberCounts = [];
        $this->_aInvites = [];
    }

    /**
     * How many members a context has: read with the page's others (_prime), or alone.
     */
    protected function _memberCount($iGroupId)
    {
        return $this->_aMemberCounts[(int)$iGroupId] ?? (int)$this->_fans()->getConnectedContentCount((int)$iGroupId, true);
    }

    protected function _idParam(BxDolApiV2Request $oReq, $sName)
    {
        return BxDolApiV2Targets::idParam($oReq, $sName);
    }

    /**
     * The tags of the modules whose content may go into a context of this module, in the order
     * of the endpoint classes: each class that defines apiV2ContextContent($sContextModule)
     * answers with its tag or null (Discussions asks its privacy, as the site's add form does).
     * The same for every context of the module, so it is asked once per request.
     */
    protected function _contentKinds()
    {
        $sModule = $this->_oModule->getName();
        if (isset(self::$_aContentKinds[$sModule]))
            return self::$_aContentKinds[$sModule];

        $aKinds = [];
        foreach (BxDolApiV2Router::hooks('apiV2ContextContent') as $oEndpoint) {
            $s = $oEndpoint->apiV2ContextContent($sModule);
            if (is_string($s) && $s !== '' && !in_array($s, $aKinds, true))
                $aKinds[] = $s;
        }
        return self::$_aContentKinds[$sModule] = $aKinds;
    }

    /**
     * Forget the content kinds read in this request (tests that turn modules on and off).
     */
    public static function reset()
    {
        self::$_aContentKinds = [];
    }

    /**
     * What GET /api/v2 lists about the module (`modules`): its name, the tag of its paths, its
     * title and the kind of its entries.
     */
    public function apiV2ModuleInfo()
    {
        return BxDolApiV2Map::moduleInfo($this->_oModule->getName(), static::API_TAG, static::API_KIND);
    }

    /**
     * GET /layout/resolve: the module's browse blocks (their service method) as a list of its
     * contexts: [kind suffix, path (`{tag}` the module's tag), query]. The viewer's own list
     * (`/me/{tag}`) only for a block of the viewer's own (no profile, or the viewer's).
     */
    const PAGE_BLOCK_LISTS = [
        'browse_recent_profiles' => ['list', '/{tag}', []],
        'browse_joined_entries' => ['joined', '/me/{tag}', []],
    ];

    /** GET /layout/resolve: the route of a context's Members block (`fans`), `{tag}` the module's tag, `{id}` the context's profile. */
    const PAGE_BLOCK_MEMBERS = '/{tag}/{id}/members';

    /**
     * GET /layout/resolve (BxBaseApiV2Layout): a browse block of the module (its newest
     * contexts, those the viewer joined) as `<API_TAG>.list` or `<API_TAG>.joined`, read from
     * the module's list route, and on a context's page its Members as `<API_TAG>.members`
     * (people with their role); one the API has no route for is left out by the resolver.
     */
    public function apiV2PageBlock($aCall, $aContext)
    {
        // a context's page: its Members (the module's fans block), of the context the page shows
        if ($aCall['module'] === $this->_oModule->getName() && $aCall['method'] === 'fans' && static::PAGE_BLOCK_MEMBERS !== '') {
            $iProfileId = BxBaseApiV2Layout::pageProfileId($aContext);
            $oProfile = $iProfileId ? BxDolProfile::getInstance($iProfileId) : null;
            if (!$oProfile || $oProfile->getModule() !== $this->_oModule->getName())
                return null;
            return ['kind' => static::API_TAG . '.members', 'endpoint' => str_replace(['{tag}', '{id}'], [static::API_TAG, $iProfileId], static::PAGE_BLOCK_MEMBERS)];
        }

        if ($aCall['module'] !== $this->_oModule->getName() || !isset(static::PAGE_BLOCK_LISTS[$aCall['method']]))
            return null;
        list($sKind, $sPath, $aQuery) = static::PAGE_BLOCK_LISTS[$aCall['method']];
        if (str_starts_with($sPath, '/me/')) {
            $mProfile = $aCall['params'][0] ?? 0;
            if (empty($aContext['viewer']) || (!in_array($mProfile, [0, '0', '', '{logged_profile_id}'], true) && (int)$mProfile !== (int)$aContext['viewer']))
                return null;
        }
        return ['kind' => static::API_TAG . '.' . $sKind, 'endpoint' => str_replace('{tag}', static::API_TAG, $sPath), 'query' => $aQuery];
    }

    /**
     * A context of this module is visible to the viewer unless GET /{tag}/{id} would answer
     * 404 (a secret one to those outside it, one that is not active): a link to it then
     * resolves to nothing, so the answer never tells that it exists. Null for a target of
     * another module.
     */
    public function apiV2TargetVisible($aTarget)
    {
        if (($aTarget['kind'] ?? '') !== BxDolApiV2Targets::GROUP || !($oProfile = $this->_profile((int)($aTarget['id'] ?? 0))))
            return null;
        return $this->_isolated(function () use ($oProfile) {
            return $this->_access($oProfile) !== self::ACCESS_HIDDEN;
        });
    }

    /**
     * The Group if a list may show it to the viewer (fully or partly visible), else null.
     */
    protected function _groupIfListed($oProfile, $iViewerId)
    {
        if ($oProfile->getStatus() !== BX_PROFILE_STATUS_ACTIVE)
            return null;
        $sAccess = $this->_access($oProfile);
        return in_array($sAccess, [self::ACCESS_FULL, self::ACCESS_PARTIAL], true) ? $this->_group($oProfile, $sAccess, $iViewerId) : null;
    }

    /**
     * The viewer's membership and what the context lets the viewer do, as the module checks it.
     */
    protected function _viewer($oProfile, $iViewerId, $bFull)
    {
        $iGroupId = (int)$oProfile->id();
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        $sStatus = $this->_status($iGroupId, $iViewerId);
        $bActive = $sStatus === 'active';

        $sSite = '';
        $bCanJoin = false;
        if ($sStatus === 'invited')
            $bCanJoin = $this->_inviteKey($iGroupId, $iViewerId) !== '' || $this->_oModule->checkAllowedFanAdd($aContent) === CHECK_ACTION_RESULT_ALLOWED;
        elseif ($sStatus === 'none' && $this->_oModule->checkAllowedFanAdd($aContent) === CHECK_ACTION_RESULT_ALLOWED) {
            $sSite = $this->_joinOnSite($iGroupId, $iViewerId);
            $bCanJoin = $sSite === '';
        }

        $bCanLeave = false;
        if ($sStatus === 'active' || $sStatus === 'pending')
            $bCanLeave = $this->_oModule->checkAllowedFanRemove($aContent) === CHECK_ACTION_RESULT_ALLOWED;
        elseif ($sStatus === 'invited')
            $bCanLeave = true;

        return [
            'status' => $sStatus,
            'role' => $bActive ? $this->_role($iGroupId, $iViewerId, $aContent) : null,
            'can_join' => $bCanJoin,
            'join_on_site' => $sSite !== '',
            'can_leave' => $bCanLeave,
            'can_post' => $bFull && $this->_canPost($oProfile),
            'can_edit' => $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED,
        ];
    }

    /**
     * active, pending (the viewer asked), invited (by an admin) or none.
     */
    protected function _status($iGroupId, $iViewerId)
    {
        $oFans = $this->_fans();
        if ($oFans->isConnected($iViewerId, $iGroupId, true))
            return 'active';
        if ($oFans->isConnected($iViewerId, $iGroupId))
            return 'pending';
        if ($oFans->isConnected($iGroupId, $iViewerId) || $this->_inviteKey($iGroupId, $iViewerId) !== '')
            return 'invited';
        return 'none';
    }

    /**
     * owner (the context's author), admin, moderator or member.
     */
    protected function _role($iGroupId, $iMemberId, $aContent, $iRole = null)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (!empty($CNF['FIELD_AUTHOR']) && (int)($aContent[$CNF['FIELD_AUTHOR']] ?? 0) === (int)$iMemberId)
            return 'owner';

        // a role read with the others of a page (_roles), or the module's own for one member
        if ($iRole === null)
            $iRole = (int)$this->_oModule->getRole($iGroupId, $iMemberId);
        if ($iRole && $this->_oModule->isRole($iRole, BX_BASE_MOD_GROUPS_ROLE_ADMINISTRATOR))
            return 'admin';
        if ($iRole && $this->_oModule->isRole($iRole, BX_BASE_MOD_GROUPS_ROLE_MODERATOR))
            return 'moderator';
        return 'member';
    }

    /**
     * The roles of these members (profile id => role bits; none for a plain member), in one query.
     */
    protected function _roles($iGroupId, $aMemberIds)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aMemberIds = array_values(array_filter(array_map('intval', $aMemberIds)));
        if (!$aMemberIds || empty($CNF['TABLE_ADMINS']))
            return [];
        $aRoles = $this->_oModule->_oDb->getRoles(['type' => 'roles_by_group_pid_fan_ids', 'group_profile_id' => (int)$iGroupId, 'fan_ids' => $aMemberIds]);
        return is_array($aRoles) ? $aRoles : [];
    }

    /**
     * Whether a feed post into the context would be accepted: the Timeline's own destination
     * check (the context's post privacy and roles), as POST /feed-posts makes it.
     */
    protected function _canPost($oProfile)
    {
        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline'))
            return false;
        return $oProfile->checkAllowedPostInProfile((int)$oProfile->id(), 'bx_timeline') === CHECK_ACTION_RESULT_ALLOWED;
    }

    /**
     * Why joining needs the site, or '': the module's paid join, or a questionnaire to answer.
     */
    protected function _joinOnSite($iGroupId, $iViewerId)
    {
        if ($this->_oModule->isPaidJoinByProfileForProfile($iGroupId, $iViewerId))
            return 'paid_join';
        $oFans = $this->_fans();
        if (method_exists($oFans, 'hasQuestionnaire') && $oFans->hasQuestionnaire($iGroupId) && !$oFans->isQuestionnaireAnswered($iGroupId, $iViewerId))
            return 'questionnaire_required';
        return '';
    }

    /**
     * The key of the viewer's invitation (the module's invites table), or ''.
     */
    protected function _inviteKey($iGroupId, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        if (empty($CNF['TABLE_INVITES']))
            return '';
        // read with the page's others (_prime): the module's own check is a row of the viewer's
        if (isset($this->_aInvites[(int)$iViewerId]) && (int)$iViewerId === (int)bx_get_logged_profile_id())
            return (string)($this->_aInvites[(int)$iViewerId][(int)$iGroupId]['key'] ?? '');
        if (!$this->_oModule->serviceIsInvited($iGroupId, $iViewerId))
            return '';
        return (string)$this->_oModule->serviceGetInvitedKey($iGroupId, $iViewerId);
    }

    protected function _joined($iGroupId, $iViewerId)
    {
        $sStatus = $this->_status($iGroupId, $iViewerId);
        if ($sStatus !== 'active' && $sStatus !== 'pending')
            throw BxDolApiV2Problem::forbidden('The ' . static::API_NOUN . ' did not take the request');
        return ['status' => $sStatus];
    }

    /**
     * How much of the context the viewer may see: all (the module's view check allows it),
     * partly (only its privacy refused and that privacy leaves the name and picture visible, a
     * closed group), hidden (a secret one, or one that is not active: not even that it exists)
     * or denied.
     */
    protected function _access($oProfile)
    {
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        // suspended or waiting for approval: as the site's page, known only to its moderators
        if (!$aContent || !BxBaseApiV2Profiles::isAvailable($oProfile, $this->_oModule))
            return self::ACCESS_HIDDEN;
        if ($this->_oModule->checkAllowedView($aContent) === CHECK_ACTION_RESULT_ALLOWED)
            return self::ACCESS_FULL;
        if (BxDolApiV2Search::profileVisible($oProfile))
            return self::ACCESS_PARTIAL;

        $CNF = &$this->_oModule->_oConfig->CNF;
        $sView = (string)($aContent[$CNF['FIELD_ALLOW_VIEW_TO']] ?? '');
        if (defined('BX_BASE_MOD_GROUPS_PG_SECRET') && $sView === BX_BASE_MOD_GROUPS_PG_SECRET)
            return self::ACCESS_HIDDEN;
        // in another context (an event in a group): hidden with it, so it never tells of a
        // secret one; refused when that one may be known (a closed group from outside)
        if (is_numeric($sView) && (int)$sView < 0 && !$this->_contextVisible(-(int)$sView))
            return self::ACCESS_HIDDEN;
        return self::ACCESS_DENIED;
    }

    /** How deep _contextVisible is looking now: contexts in contexts end somewhere. */
    protected static $_iContextDepth = 0;

    /**
     * Whether the viewer may know of the context a context is in (BxDolApiV2Targets::visible,
     * which asks that context's own class); false for none or too deep a chain.
     */
    protected function _contextVisible($iContextId)
    {
        if ($iContextId <= 0 || self::$_iContextDepth >= 5)
            return false;
        self::$_iContextDepth++;
        try {
            return BxDolProfile::getInstance($iContextId) && BxDolApiV2Targets::visible(BxDolApiV2Targets::make(BxDolApiV2Targets::GROUP, $iContextId));
        }
        finally {
            self::$_iContextDepth--;
        }
    }

    protected function _refuse($sAccess)
    {
        if ($sAccess === self::ACCESS_HIDDEN)
            throw BxDolApiV2Problem::notFound('The ' . static::API_NOUN);
        if ($sAccess === self::ACCESS_DENIED)
            throw BxDolApiV2Problem::forbidden('The viewer may not see this ' . static::API_NOUN);
    }

    /**
     * The profile of a context of this module, or 404.
     */
    protected function _existing($iGroupId)
    {
        $oProfile = $this->_profile($iGroupId);
        if (!$oProfile)
            throw BxDolApiV2Problem::notFound('The ' . static::API_NOUN);
        return $oProfile;
    }

    protected function _profile($iGroupId)
    {
        $oProfile = $iGroupId > 0 ? BxDolProfile::getInstance($iGroupId) : false;
        return $oProfile && $oProfile->getModule() === $this->_oModule->getName() ? $oProfile : null;
    }

    /**
     * The module's membership notifications in the API's vocabulary, with the group (its
     * profile id) as data.group_id; object_id is the context content entry, sender the
     * context's profile:
     * - join_request (to those who manage the group): `groups.join_requested`, the actor being
     *   who asks (subobject_id) rather than the group;
     * - join_invitation_notif (to the invited, object_owner_id): `groups.invited`;
     * - fan_added (a new member, to the group's followers): `groups.approved` only for the new
     *   member (subobject_id), `other` for everyone else.
     */
    public function apiV2NotificationKind($aEvent, $aTarget, $iViewerId)
    {
        $sAction = (string)($aEvent['action'] ?? '');
        if (($aEvent['type'] ?? '') !== $this->_oModule->getName() || !in_array($sAction, ['join_request', 'join_invitation_notif', 'fan_added'], true))
            return null;

        $aOther = ['kind' => 'other', 'data' => []];
        $oGroup = BxDolProfile::getInstanceByContentAndType((int)$aEvent['object_id'], $this->_oModule->getName());
        if (!$oGroup || $iViewerId <= 0)
            return $aOther;
        $aData = ['group_id' => BxDolApiV2Map::id($oGroup->id())];
        $iSubobjectId = (int)($aEvent['subobject_id'] ?? 0);

        switch ($sAction) {
            case 'join_request':
                return ['kind' => 'groups.join_requested', 'data' => $aData] + ($iSubobjectId > 0 ? ['actor_id' => $iSubobjectId] : []);
            case 'join_invitation_notif':
                return abs((int)$aEvent['object_owner_id']) === (int)$iViewerId ? ['kind' => 'groups.invited', 'data' => $aData] : $aOther;
            default:
                return $iSubobjectId === (int)$iViewerId ? ['kind' => 'groups.approved', 'data' => $aData] : $aOther;
        }
    }

    protected function _fans()
    {
        $oFans = $this->_oModule->serviceGetFansConnectionObject();
        if (!$oFans)
            throw new BxDolApiV2Problem(503, 'unavailable', 'Membership is not set up for this module');
        return $oFans;
    }

    /**
     * Content ids of the module's browse list, newest first: its search result in `recent`
     * mode (or $sMode, another of its modes: `top_level` for spaces), which applies the
     * module's own conditions (active entries, privacy groups the viewer may find), with
     * $aRestrictions added to them. It reads without the request's params (start, per_page,
     * `<name>_mode`), and the id breaks ties of the date, so pages don't overlap.
     */
    protected function _browseRows($iStart, $iPerPage, $sMode = 'recent', $aRestrictions = [])
    {
        $oResult = $this->_searchResult($sMode, $aRestrictions);
        return $oResult ? $this->_searchRows($oResult, $iStart, $iPerPage, 'content_id') : [];
    }

    /**
     * The module's search result in one of its browse modes (with the mode's $aParams), with
     * more restrictions added to the module's own, or null for a mode the module does not have. Made while the request's
     * params are hidden (the result reads them when it is made).
     */
    protected function _searchResult($sMode, $aRestrictions = [], $aParams = [])
    {
        $sClass = $this->_oModule->_oConfig->getClassPrefix() . 'SearchResult';
        return BxDolApiV2Search::isolated(function () use ($sClass, $sMode, $aRestrictions, $aParams) {
            bx_import('SearchResult', $this->_oModule->_aModule);
            // $aParams are the mode's own (a context's id, the joined profile's)
            $oResult = $aParams ? new $sClass($sMode, $aParams) : new $sClass($sMode);
            if (!empty($oResult->isError))
                return null;
            foreach ($aRestrictions as $sKey => $aRestriction)
                $oResult->aCurrent['restriction'][$sKey] = $aRestriction;
            return $oResult;
        });
    }

    /**
     * A page of a search result, newest first (the id breaks ties of the date), or in the
     * order of $sOrderSql (an ORDER BY clause ending in a tie breaker): the value of $sField
     * of each row, or the rows themselves when $sField is ''.
     */
    protected function _searchRows($oResult, $iStart, $iPerPage, $sField = '', $sOrderSql = '')
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return BxDolApiV2Search::isolated(function () use ($CNF, $oResult, $iStart, $iPerPage, $sField, $sOrderSql) {
            $oResult->aCurrent['paginate']['forceStart'] = (int)$iStart;
            $oResult->aCurrent['paginate']['perPage'] = (int)$iPerPage;
            $oResult->setPaginatePerPage((int)$iPerPage);
            $sTable = '`' . $CNF['TABLE_ENTRIES'] . '`';
            $oResult->aCurrent['sorting_sql'] = $sOrderSql !== '' ? $sOrderSql : 'ORDER BY ' . $sTable . '.`' . $CNF['FIELD_ADDED'] . '` DESC, ' . $sTable . '.`' . $CNF['FIELD_ID'] . '` DESC';

            $aData = $oResult->getSearchData();
            $aRows = [];
            foreach (is_array($aData) ? $aData : [] as $aRow)
                if ($sField === '' && is_array($aRow))
                    $aRows[] = $aRow;
                elseif (is_array($aRow) && (int)($aRow[$sField] ?? 0) > 0)
                    $aRows[] = (int)$aRow[$sField];
            return array_slice($aRows, 0, $iPerPage);
        });
    }

    /**
     * public, members (site members only), closed (name and picture to all, the rest to
     * members), secret (members and invitees only), context (in another context) or other.
     */
    public static function visibility($sAllowViewTo)
    {
        $s = (string)$sAllowViewTo;
        if ($s === BX_DOL_PG_ALL)
            return 'public';
        if ($s === BX_DOL_PG_MEMBERS)
            return 'members';
        if ($s === 'c')
            return 'closed';
        if ($s === 's')
            return 'secret';
        if (is_numeric($s) && (int)$s < 0)
            return 'context';
        return 'other';
    }

    /**
     * The schema of a context of a module: Group's, with $sDescription, and with $aExtra
     * properties (name => schema) after Group's; $aRequired of them are required. A module
     * with more to say than Group (a space's parent) declares its own shape with it.
     */
    protected static function _contextSchema($sDescription, $aExtra = [], $aRequired = [])
    {
        $aBool = ['type' => 'boolean'];
        $a = BxDolApiV2Map::profileSchema();
        $a['description'] = $sDescription;
        $a['required'] = array_merge($a['required'], ['visibility', 'join_policy', 'member_count', 'content_visible', 'content_kinds', 'viewer'], $aRequired);
        $a['properties'] += [
            'visibility' => ['$ref' => '#/components/schemas/GroupVisibility'],
            'join_policy' => ['type' => 'string', 'enum' => ['open', 'approval'], 'description' => 'open: joining makes a member at once; approval: it asks the admins of the group (or other context)'],
            'member_count' => ['type' => 'integer', 'minimum' => 0],
            'content_visible' => array_merge($aBool, ['description' => 'Whether the viewer may see its about, cover, feed and members; false for a closed one seen from outside']),
            'content_kinds' => [
                'type' => 'array',
                'items' => ['type' => 'string', 'example' => 'discussions'],
                'description' => 'The tags of the modules whose content may be added in a context of this module (v2 only): `discussions` when GET /discussions?context_id= lists its discussions and POST /discussions takes it as `context_id`. The same for every context of the module, and whether the viewer may add is that endpoint\'s check. Posts (the feed) are not listed: `viewer.can_post` says those',
            ],
            'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/GroupViewer'], ['type' => 'null']], 'description' => 'The acting profile\'s membership; null for guests'],
        ] + $aExtra;
        return $a;
    }

    public static function schemas()
    {
        $aBool = ['type' => 'boolean'];
        $aGroup = static::_contextSchema('A group (or another context: a space, an event): the profile it is, with its policies and the viewer\'s membership. A closed one seen from outside has its name and picture only (`content_visible` false).');

        return [
            'GroupVisibility' => ['type' => 'string', 'enum' => ['public', 'members', 'closed', 'secret', 'context', 'other'], 'description' => 'Who may see the group (or other context): anyone, site members, its name to anyone and the rest to members (closed), members and invitees only (secret), as the context it is in (context), or another privacy of the site'],
            'MemberStatus' => ['type' => 'string', 'enum' => ['active', 'pending', 'invited'], 'description' => 'A member, a request waiting for the admins, or an invitation waiting for the profile'],
            'GroupRole' => ['type' => 'string', 'enum' => ['owner', 'admin', 'moderator', 'member'], 'description' => 'Ordered from most to least powerful; the owner is who made the group (or other context)'],
            'Group' => $aGroup,
            'GroupViewer' => [
                'type' => 'object',
                'description' => 'The viewer\'s membership of a group or another context. `membership` below is the context\'s own path: /groups/{id}/membership, /spaces/{id}/membership',
                'required' => ['status', 'role', 'can_join', 'join_on_site', 'can_leave', 'can_post', 'can_edit'],
                'properties' => [
                    'status' => ['type' => 'string', 'enum' => ['active', 'pending', 'invited', 'none']],
                    'role' => ['oneOf' => [['$ref' => '#/components/schemas/GroupRole'], ['type' => 'null']], 'description' => 'Null unless a member'],
                    'can_join' => array_merge($aBool, ['description' => 'POST of its membership would join or ask to']),
                    'join_on_site' => array_merge($aBool, ['description' => 'Joining needs the site: it asks questions first or asks for a payment (POST answers 409)']),
                    'can_leave' => array_merge($aBool, ['description' => 'DELETE of its membership would leave, withdraw the request or decline the invitation']),
                    'can_post' => array_merge($aBool, ['description' => 'POST /feed-posts with this context_id would be accepted']),
                    'can_edit' => array_merge($aBool, ['description' => 'The viewer may change its details on the site']),
                ],
            ],
            'JoinRequest' => [
                'type' => 'object',
                'description' => 'A request to join. The body may be left out, and fields it does not have are ignored.',
                'properties' => [
                    'token' => ['type' => ['string', 'null'], 'maxLength' => 255, 'description' => 'From an invite link. Accepted and not used: an invitation is found by the viewer\'s profile'],
                ],
            ],
            'JoinResult' => [
                'type' => 'object',
                'required' => ['status'],
                'properties' => ['status' => ['$ref' => '#/components/schemas/MemberStatus']],
            ],
            'Member' => [
                'type' => 'object',
                'required' => ['profile', 'role', 'status', 'since'],
                'properties' => [
                    'profile' => ['$ref' => '#/components/schemas/Profile'],
                    'role' => ['$ref' => '#/components/schemas/GroupRole'],
                    'status' => ['$ref' => '#/components/schemas/MemberStatus'],
                    'since' => ['type' => 'string', 'format' => 'date-time'],
                ],
            ],
            'Page_Group' => BxDolApiV2Map::pageSchema('Group'),
            'Page_Member' => BxDolApiV2Map::pageSchema('Member'),
        ];
    }
}

/** @} */
