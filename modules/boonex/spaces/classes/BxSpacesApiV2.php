<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Spaces Spaces
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Spaces: the router finds this class only while the module is enabled.
 * A space is a context profile like a group (kind `group`, module `bx_spaces`): its id is its
 * profile id, its feed is GET /profiles/{id}/timeline, a post goes into it with POST /feed-posts
 * `context_id`, and joining, leaving and members are the groups base's (BxBaseModGroupsApiV2).
 * What a space has that a group lacks is a place in a tree: a space may be in another space
 * (its parent, FIELD_PARENT, the parent's profile id), and its subspaces are the spaces whose
 * parent it is.
 */
class BxSpacesApiV2 extends BxBaseModGroupsApiV2
{
    const API_TAG = 'spaces';
    const API_KIND = 'space';
    const API_NOUN = 'space';

    /** Subspaces the viewer would find under each space of the page being mapped (profile id => count). */
    protected $_aChildCounts = [];

    /** Whether the viewer may know each parent of the page being mapped (profile id => bool). */
    protected $_aParentVisible = [];

    public function __construct()
    {
        parent::__construct('bx_spaces');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/spaces', id: 'listMySpaces', tag: 'spaces', auth: 'required',
        summary: 'Spaces the acting profile is a member of, most recently joined first',
        description: 'A plain array, as GET /me/groups: the ' . self::MY_GROUPS_MAX . ' most recently joined at most. Active memberships only; secret spaces the profile is in are listed too.',
        responses: [200 => 'array:Space'])]
    public function listMySpaces(BxDolApiV2Request $oReq)
    {
        return $this->_myGroups($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/spaces', id: 'listSpaces', tag: 'spaces', paged: true,
        summary: 'Spaces the viewer may find, newest first',
        description: 'As the site\'s browse page lists them: public spaces, ones for site members when signed in, and closed ones (name and picture only, `content_visible` false). Secret spaces are never listed here. `top_level` keeps the spaces that are in no other space (the site\'s top level list); `parent_id` the subspaces of one space, as GET /spaces/{id}/spaces lists them.',
        params: [
            'top_level' => ['in' => 'query', 'schema' => ['type' => 'boolean', 'default' => false], 'description' => 'Only spaces that are in no other space'],
            'parent_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'Only the subspaces of this space; not with `top_level`'],
        ],
        responses: [200 => 'Page_Space', 403 => null, 404 => null, 422 => null])]
    public function listSpaces(BxDolApiV2Request $oReq)
    {
        $bTopLevel = $oReq->queryBool('top_level');
        $iParentId = $this->_idParam($oReq, 'parent_id');
        if ($bTopLevel && $iParentId)
            throw BxDolApiV2Problem::validation([['field' => 'parent_id', 'code' => 'conflict', 'message' => 'A subspace is not top level: send one of top_level and parent_id']]);
        if ($iParentId)
            return $this->_children($oReq, $iParentId);
        return $this->_browse($oReq, $bTopLevel ? 'top_level' : 'recent');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/spaces/{id}', id: 'getSpace', tag: 'spaces',
        summary: 'A space, with the viewer\'s membership',
        description: 'As GET /groups/{id} for a group: the id is the space\'s profile id; 404 for a secret space the viewer is neither in nor invited to, and for a profile that is no space; 403 for one the viewer may not see at all. `parent_id` is the space it is in, `child_count` how many subspaces GET /spaces/{id}/spaces lists.',
        responses: [200 => 'Space', 403 => null, 404 => null])]
    public function getSpace(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/spaces/{id}/spaces', id: 'listSpaceChildren', tag: 'spaces', paged: true,
        summary: 'The subspaces of a space, newest first',
        description: 'The spaces whose parent this space is, as the site\'s browse list would show them to the viewer (public, members-only to members, closed ones with their name and picture; secret subspaces are not listed: their members find them in GET /me/spaces). 404 and 403 as GET /spaces/{id} for the space itself, and 403 for a closed space seen from outside: the site\'s page of a closed space shows outsiders its info and members, not its subspaces.',
        responses: [200 => 'Page_Space', 403 => null, 404 => null])]
    public function listSpaceChildren(BxDolApiV2Request $oReq)
    {
        return $this->_children($oReq, $oReq->id());
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/spaces/{id}/membership', id: 'joinSpace', tag: 'spaces', auth: 'required',
        summary: 'Join a space, or ask to',
        description: 'As POST /groups/{id}/membership: an open space, or one that invited the viewer, makes a member at once (`active`); one whose admins approve members gets a request (`pending`). Asking again is not an error. 403 when the space refuses, 409 `questionnaire_required` or `paid_join` when joining needs the site. The body (JoinRequest) may be left out.',
        body: 'JoinRequest', bodyRequired: false,
        responses: [200 => 'JoinResult', 403 => null, 404 => null, 409 => null])]
    public function joinSpace(BxDolApiV2Request $oReq)
    {
        return $this->_join($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/spaces/{id}/membership', id: 'leaveSpace', tag: 'spaces', auth: 'required',
        summary: 'Leave a space, withdraw a request to join, or decline an invitation',
        description: 'As DELETE /groups/{id}/membership. Not being in the space is not an error. Leaving a space does not leave its subspaces or its parent: each has its own members.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function leaveSpace(BxDolApiV2Request $oReq)
    {
        return $this->_leave($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/spaces/{id}/members', id: 'listSpaceMembers', tag: 'spaces', paged: true,
        summary: 'A space\'s members, most recently joined first',
        description: 'Active members with their role, to those who may see the space\'s content (403 for a closed space seen from outside).',
        responses: [200 => 'Page_Member', 403 => null, 404 => null])]
    public function listSpaceMembers(BxDolApiV2Request $oReq)
    {
        return $this->_members($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/spaces', id: 'searchSpaces', tag: 'search', limit: 'search',
        summary: 'Spaces whose name matches, best match first',
        description: 'As GET /search/groups, for spaces: up to `limit` active spaces found by the module\'s quick search (the space\'s name), ranked as GET /search/profiles. Public and closed spaces are found; a secret space only by its members.',
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Part of a space\'s name, or its handle'],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 20]],
        ],
        responses: [200 => 'array:Profile', 422 => null])]
    public function searchSpaces(BxDolApiV2Request $oReq)
    {
        return BxDolApiV2Search::profiles(BxDolApiV2Search::query($oReq), [$this->_oModule->getName()], $oReq->limit());
    }

    /*
     * Subspaces
     */

    /**
     * A page of the subspaces of a space the viewer may see in full (not a closed one seen from
     * outside: the site's closed page shows no subspaces), through the module's browse list with the parent as one more condition.
     */
    protected function _children(BxDolApiV2Request $oReq, $iParentId)
    {
        $this->_isolated(function () use ($iParentId) {
            $sAccess = $this->_access($this->_existing($iParentId));
            $this->_refuse($sAccess);
            if ($sAccess !== self::ACCESS_FULL)
                throw BxDolApiV2Problem::forbidden('The viewer may not see the subspaces of this space');
        });
        return $this->_browse($oReq, 'recent', ['parent' => $this->_parentRestriction([(int)$iParentId])]);
    }

    protected function _parentRestriction(array $aParentIds)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aIds = array_values(array_unique(array_map('intval', $aParentIds)));
        return count($aIds) === 1
            ? ['value' => $aIds[0], 'field' => $CNF['FIELD_PARENT'], 'operator' => '=', 'table' => $CNF['TABLE_ENTRIES']]
            : ['value' => $aIds, 'field' => $CNF['FIELD_PARENT'], 'operator' => 'in', 'table' => $CNF['TABLE_ENTRIES']];
    }

    /**
     * What the page's spaces need besides the Group, read for the whole page at once:
     * - the subspaces of every space, counted in one query (the module's browse list of spaces
     *   whose parent is one of them, grouped by the parent: what GET /spaces/{id}/spaces lists);
     * - whether the viewer may know each parent, checked once per distinct parent.
     */
    protected function _prime(array $aProfiles)
    {
        parent::_prime($aProfiles);
        $CNF = &$this->_oModule->_oConfig->CNF;
        $this->_aChildCounts = [];
        $this->_aParentVisible = [];
        $aParents = [];
        foreach ($aProfiles as $oProfile) {
            $this->_aChildCounts[(int)$oProfile->id()] = 0;
            $aContent = BxDolApiV2Map::profileContent($oProfile);
            if (($iParent = (int)($aContent[$CNF['FIELD_PARENT']] ?? 0)) > 0)
                $aParents[$iParent] = $iParent;
        }
        foreach ($aParents as $iParent)
            $this->_aParentVisible[$iParent] = $this->_visibleParent($iParent) > 0;

        $aIds = array_keys($this->_aChildCounts);
        if (!$aIds)
            return;
        $oResult = $this->_searchResult('recent', ['parent' => $this->_parentRestriction($aIds)]);
        if (!$oResult)
            return;
        $aCounts = BxDolApiV2Search::isolated(function () use ($oResult) {
            $aJoins = $oResult->getJoins(false);
            return $this->_oModule->_oDb->getApiV2ChildCounts($oResult->aCurrent['table'], is_array($aJoins) ? $aJoins['join'] : '', $oResult->getRestriction());
        });
        foreach ((array)$aCounts as $iParent => $iCount)
            if (isset($this->_aChildCounts[(int)$iParent]))
                $this->_aChildCounts[(int)$iParent] = (int)$iCount;
    }

    /**
     * A Space: the Group, with the space it is in and how many subspaces it has.
     */
    protected function _group($oProfile, $sAccess, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aContent = BxDolApiV2Map::profileContent($oProfile);
        $iId = (int)$oProfile->id();

        $iParent = (int)($aContent[$CNF['FIELD_PARENT']] ?? 0);
        if ($iParent > 0 && !isset($this->_aParentVisible[$iParent]))
            $this->_aParentVisible[$iParent] = $this->_visibleParent($iParent) > 0;

        return parent::_group($oProfile, $sAccess, $iViewerId) + [
            'parent_id' => BxDolApiV2Map::idOrNull($iParent > 0 && $this->_aParentVisible[$iParent] ? $iParent : 0),
            // the subspaces path refuses those who see the space only in part (a closed one)
            'child_count' => $sAccess === self::ACCESS_FULL ? (int)($this->_aChildCounts[$iId] ?? 0) : 0,
        ];
    }

    /**
     * The parent's profile id when the viewer may know it (a space of this module, active,
     * seen fully or in part), else 0: a secret parent is not told to those outside it.
     */
    protected function _visibleParent($iParentId)
    {
        if ($iParentId <= 0 || !($oParent = $this->_profile($iParentId)) || $oParent->getStatus() !== BX_PROFILE_STATUS_ACTIVE)
            return 0;
        return in_array($this->_access($oParent), [self::ACCESS_FULL, self::ACCESS_PARTIAL], true) ? $iParentId : 0;
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        return parent::schemas() + [
            'Space' => static::_contextSchema(
                'A space: a context like a group (Group\'s fields, kind `group`, module `bx_spaces`), which may be in another space and have subspaces.',
                [
                    'parent_id' => ['oneOf' => [$aId, ['type' => 'null']], 'description' => 'The space this one is in (GET /spaces/{id}); null for a top level space, and for one whose parent the viewer may not know of (a secret one) or that is not active'],
                    'child_count' => ['type' => 'integer', 'minimum' => 0, 'description' => 'How many subspaces GET /spaces/{id}/spaces lists to the viewer (secret ones are not counted; 0 for a closed space seen from outside, whose subspaces that path refuses)'],
                ],
                ['parent_id', 'child_count']
            ),
            'Page_Space' => BxDolApiV2Map::pageSchema('Space'),
        ];
    }
}

/** @} */
