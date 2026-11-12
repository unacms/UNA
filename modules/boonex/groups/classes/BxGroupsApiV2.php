<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Groups Groups
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Groups: the router finds this class only while the module is enabled.
 * A group is a profile (kind `group`): its id is its profile id, its feed is
 * GET /profiles/{id}/timeline and a post goes into it with POST /feed-posts `context_id`.
 * The work is in BxBaseModGroupsApiV2, which other context modules can extend the same way.
 */
class BxGroupsApiV2 extends BxBaseModGroupsApiV2
{
    public function __construct()
    {
        parent::__construct('bx_groups');
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/groups', id: 'listMyGroups', tag: 'groups', auth: 'required',
        summary: 'Groups the acting profile is a member of, most recently joined first',
        description: 'A plain array, not a page: the ' . self::MY_GROUPS_MAX . ' most recently joined at most. Active memberships only: requests waiting for a group\'s admins and invitations are not listed (GET /groups/{id} says `viewer.status`). Secret groups the profile is in are listed too.',
        responses: [200 => 'array:Group'])]
    public function listMyGroups(BxDolApiV2Request $oReq)
    {
        return $this->_myGroups($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/groups', id: 'listGroups', tag: 'groups', paged: true,
        summary: 'Groups the viewer may find, newest first',
        description: 'As the site\'s browse page lists them (active groups whose privacy lets the viewer find them): public ones, groups for site members when signed in, and closed ones, which show their name and picture only (`content_visible` false) until one joins. Secret groups are never listed here; their members find them in GET /me/groups.',
        responses: [200 => 'Page_Group'])]
    public function listGroups(BxDolApiV2Request $oReq)
    {
        return $this->_browse($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/groups/{id}', id: 'getGroup', tag: 'groups',
        summary: 'A group, with the viewer\'s membership',
        description: 'The id is the group\'s profile id. 404 for a secret group the viewer is neither in nor invited to (as for one that does not exist); 403 for a group the viewer may not see at all (one for site members, to a guest). A closed group seen from outside has its name and picture only (`content_visible` false): its feed and members answer 403 until one joins. `viewer` says what POST and DELETE /groups/{id}/membership and POST /feed-posts with this `context_id` would do.',
        responses: [200 => 'Group', 403 => null, 404 => null])]
    public function getGroup(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/groups/{id}/membership', id: 'joinGroup', tag: 'groups', auth: 'required',
        summary: 'Join a group, or ask to',
        description: 'An open group, or one that invited the viewer, makes a member at once (`active`); one whose admins approve members gets a request (`pending`), and its admins are notified as on the site. Joining follows the group. Asking again is not an error. 403 when the group refuses (the viewer is banned from it, the membership level may not join groups); 409 `questionnaire_required` or `paid_join` when joining needs the site. The body (JoinRequest) may be left out. Its `token` is taken and checked as a string, and changes nothing here: the viewer\'s own invitation is found by the viewer\'s profile, so a token neither hides nor grants one.',
        body: 'JoinRequest', bodyRequired: false,
        responses: [200 => 'JoinResult', 403 => null, 404 => null, 409 => null])]
    public function joinGroup(BxDolApiV2Request $oReq)
    {
        return $this->_join($oReq);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/groups/{id}/membership', id: 'leaveGroup', tag: 'groups', auth: 'required',
        summary: 'Leave a group, withdraw a request to join, or decline an invitation',
        description: 'One call for all three, as on the site; leaving also stops following the group. Not being in the group is not an error. 403 when the group refuses it.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function leaveGroup(BxDolApiV2Request $oReq)
    {
        return $this->_leave($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/groups/{id}/members', id: 'listGroupMembers', tag: 'groups', paged: true,
        summary: 'A group\'s members, most recently joined first',
        description: 'Active members with their role, to those who may see the group\'s content (403 for a closed group seen from outside).',
        responses: [200 => 'Page_Member', 403 => null, 404 => null])]
    public function listGroupMembers(BxDolApiV2Request $oReq)
    {
        return $this->_members($oReq);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/groups', id: 'searchGroups', tag: 'search', limit: 'search',
        summary: 'Groups whose name matches, best match first',
        description: "Up to `limit` (20 by default) active groups found by the module's quick search (the group name), ranked as GET /search/profiles: the group whose handle or whole name is `q` first, then names that start with it, then names with a word that does. Public and closed groups are found (a closed group shows its name and picture to anyone whose membership level may view groups, as on the site); a secret group only by its members.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Part of a group\'s name, or its handle'],
            'limit' => ['in' => 'query', 'schema' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 50, 'default' => 20]],
        ],
        responses: [200 => 'array:Profile', 422 => null])]
    public function searchGroups(BxDolApiV2Request $oReq)
    {
        return BxDolApiV2Search::profiles(BxDolApiV2Search::query($oReq), [$this->_oModule->getName()], $oReq->limit());
    }
}

/** @} */
