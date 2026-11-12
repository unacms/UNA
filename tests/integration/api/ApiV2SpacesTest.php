<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Spaces (bx_spaces, BxSpacesApiV2 on the groups base), over real HTTP: spaces each
 * test makes through the module's add service and deletes after (subspaces first); joining,
 * subspaces and the top level, secret spaces, search, the module list of GET /api/v2,
 * `content_kinds` and link targets that say a space's module. Skips without bx_spaces.
 */
#[Group('integration')]
class ApiV2SpacesTest extends ApiV2TestCase
{
    /** Spaces a test made, in the order made: deleted the other way round. */
    protected $_aSpaces = [];
    protected $_aEvents = [];

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_aEvents && BxDolModuleQuery::getInstance()->isEnabledByName('bx_timeline')) {
            $oTimeline = BxDolModule::getInstance('bx_timeline');
            foreach ($this->_aEvents as $iId)
                if (($aEvent = $oTimeline->_oDb->getEvents(['browse' => 'id', 'value' => $iId])))
                    $oTimeline->deleteEvent($aEvent);
        }
        // the server process made the memberships: this process's memory of the rows is stale
        if ($this->_aSpaces)
            $oDb->cleanMemoryAll();
        foreach (array_reverse($this->_aSpaces) as $iSpace)
            if (($oSpace = BxDolProfile::getInstance($iSpace)))
                $oSpace->delete(false, true, true);
        parent::tearDown();
    }

    public function testSpacePathsOnlyWhileSpacesIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/me/spaces', '/spaces', '/spaces/{id}', '/spaces/{id}/spaces', '/spaces/{id}/membership', '/spaces/{id}/members', '/search/spaces'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_spaces']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxSpacesApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Spaces');
        $this->assertArrayNotHasKey('Space', $aSpec['components']['schemas']);
        $this->assertArrayHasKey('/profiles/{id}', $aSpec['paths'], 'the rest of the API stays');

        $this->requireModule('bx_spaces');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxSpacesApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Spaces');

        // the discovery document lists the module, as each endpoint class says it
        $a = $this->http('GET', '');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('ApiInfo', $a['json']);
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_spaces', 'tag' => 'spaces', 'kind' => 'space'], array_diff_key($aModules['bx_spaces'] ?? [], ['title' => 1]));
        $this->assertNotSame('', $aModules['bx_spaces']['title']);
        // a module is listed when its endpoint class says what it is, and only then
        foreach ($aEnabled as $sName => $aModule) {
            $sClass = $aModule['class_prefix'] . 'ApiV2';
            if (in_array($sClass, $aClasses, true) && method_exists($sClass, 'apiV2ModuleInfo'))
                $this->assertArrayHasKey($sName, $aModules, $sName . ' has an endpoint class');
            else
                $this->assertArrayNotHasKey($sName, $aModules, $sName . ' has no endpoint class');
        }
        foreach (['bx_groups' => 'groups', 'bx_forum' => 'discussions', 'bx_timeline' => 'feeds'] as $sName => $sTag)
            if (isset($aEnabled[$sName]))
                $this->assertSame($sTag, $aModules[$sName]['tag'] ?? null, $sName);
    }

    public function testJoinAnOpenSpaceAndAskToJoinAClosedOne(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iOpen = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false);
        $iClosed = $this->makeSpace($iOwner, 'c', true);

        $a = $this->http('GET', 'spaces/' . $iOpen, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Space', $a['json']);
        $this->assertSame(['group', 'bx_spaces', 'public', 'open', 1, null, 0], [$a['json']['kind'], $a['json']['module'], $a['json']['visibility'], $a['json']['join_policy'], $a['json']['member_count'], $a['json']['parent_id'], $a['json']['child_count']]);
        $this->assertSame('none', $a['json']['viewer']['status']);
        $this->assertTrue($a['json']['viewer']['can_join']);
        $this->assertSame(404, $this->http('GET', 'groups/' . $iOpen, $aAuth)['status'], 'a space is no group of the Groups module');

        $a = $this->http('POST', 'spaces/' . $iOpen . '/membership', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('JoinResult', $a['json']);
        $this->assertSame('active', $a['json']['status']);
        $a = $this->http('GET', 'me/spaces', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertTrue(array_is_list($a['json']));
        foreach ($a['json'] as $aSpace)
            $this->assertSchema('Space', $aSpace);
        $this->assertSame((string)$iOpen, $a['json'][0]['id'] ?? null, 'the space joined last comes first');
        $this->assertNotContains((string)$iOpen, array_column((array)$this->http('GET', 'me/groups', $aAuth)['json'], 'id'), 'spaces are not in one\'s groups');

        $a = $this->http('GET', 'spaces/' . $iOpen . '/members', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Member', $a['json']);
        $aRoles = array_column(array_map(function ($a) { return ['id' => $a['profile']['id'], 'role' => $a['role']]; }, $a['json']['items']), 'role', 'id');
        $this->assertSame(['member', 'owner'], [$aRoles[(string)$iViewer] ?? null, $aRoles[(string)$iOwner] ?? null]);

        $this->assertSame(204, $this->http('DELETE', 'spaces/' . $iOpen . '/membership', $aAuth)['status']);
        $this->assertSame('none', $this->http('GET', 'spaces/' . $iOpen, $aAuth)['json']['viewer']['status'] ?? null);

        // a closed space: its name and picture from outside, a request to its admins
        $a = $this->http('GET', 'spaces/' . $iClosed, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Space', $a['json']);
        $this->assertSame(['closed', 'approval', false, ''], [$a['json']['visibility'], $a['json']['join_policy'], $a['json']['content_visible'], $a['json']['about']]);
        $this->assertSame(403, $this->http('GET', 'spaces/' . $iClosed . '/members', $aAuth)['status']);
        $a = $this->http('POST', 'spaces/' . $iClosed . '/membership', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame('pending', $a['json']['status']);
        $this->assertSame('pending', $this->http('GET', 'spaces/' . $iClosed, $aAuth)['json']['viewer']['status'] ?? null);
        $this->assertSame(204, $this->http('DELETE', 'spaces/' . $iClosed . '/membership', $aAuth)['status'], 'the request withdrawn');

        $this->assertSame(401, $this->http('POST', 'spaces/' . $iOpen . '/membership')['status']);
        $this->assertSame(401, $this->http('GET', 'me/spaces')['status']);
        $this->assertSame(404, $this->http('GET', 'spaces/' . $iViewer, $aAuth)['status'], 'a person is no space');
    }

    public function testSecretSpacesExistOnlyForTheirMembers(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iParent = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false);
        $iSecret = $this->makeSpace($iOwner, 's', true, $iParent);

        foreach ([$aAuth, []] as $aHeaders) {
            foreach (['spaces/' . $iSecret, 'spaces/' . $iSecret . '/members', 'spaces/' . $iSecret . '/spaces'] as $sPath) {
                $a = $this->http('GET', $sPath, $aHeaders);
                $this->assertSame(404, $a['status'], $sPath . ': ' . $a['body']);
                $this->assertSchema('Problem', $a['json']);
            }
            $this->assertNotContains((string)$iSecret, array_column($this->http('GET', 'spaces?limit=50', $aHeaders)['json']['items'], 'id'));
            $a = $this->http('GET', 'spaces/' . $iParent . '/spaces', $aHeaders);
            $this->assertSame([], $a['json']['items'], 'a secret subspace is not listed under its parent');
            $this->assertSame(0, $this->http('GET', 'spaces/' . $iParent, $aHeaders)['json']['child_count'], 'nor counted');
        }
        $this->assertSame(404, $this->http('POST', 'spaces/' . $iSecret . '/membership', $aAuth)['status']);

        // a link to it tells nothing either: 404 as a link to nothing, to a guest and an outsider
        $sResolve = 'links/resolve?url=' . rawurlencode(BxDolProfile::getInstance($iSecret)->getUrl());
        foreach ([$aAuth, []] as $aHeaders) {
            $a = $this->http('GET', $sResolve, $aHeaders);
            $this->assertSame(404, $a['status'], 'a secret space\'s link: ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }

        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $a = $this->http('GET', $sResolve, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['group', (string)$iSecret, 'bx_spaces'], [$a['json']['kind'], $a['json']['id'], $a['json']['module'] ?? null], 'its owner resolves it');
        $a = $this->http('GET', 'spaces/' . $iSecret, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(['secret', 'owner', (string)$iParent], [$a['json']['visibility'], $a['json']['viewer']['role'], $a['json']['parent_id']]);
        $this->assertContains((string)$iSecret, array_column($this->http('GET', 'me/spaces', $aOwner)['json'], 'id'), 'its owner finds it');
    }

    public function testSubspacesAndTheTopLevel(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iParent = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false);
        $iOlder = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false, $iParent);
        $iNewer = $this->makeSpace($iOwner, 'c', true, $iParent);
        // the second is a second younger: the list is newest first
        BxDolDb::getInstance()->query("UPDATE `bx_spaces_data` SET `added` = `added` - 10 WHERE `id` = :i", ['i' => (int)BxDolProfile::getInstance($iOlder)->getContentId()]);

        $a = $this->http('GET', 'spaces/' . $iParent, $aAuth);
        $this->assertSame([null, 2], [$a['json']['parent_id'], $a['json']['child_count']], $a['body']);
        $a = $this->http('GET', 'spaces/' . $iOlder);
        $this->assertSame([(string)$iParent, 0], [$a['json']['parent_id'], $a['json']['child_count']], 'a guest sees the public parent');

        $a = $this->http('GET', 'spaces/' . $iParent . '/spaces', $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Space', $a['json']);
        $this->assertSame([(string)$iNewer, (string)$iOlder], array_column($a['json']['items'], 'id'), 'newest first, the closed one too');
        $this->assertNull($a['json']['next_cursor']);
        $a = $this->http('GET', 'spaces/' . $iParent . '/spaces?limit=1', $aAuth);
        $this->assertSame([(string)$iNewer], array_column($a['json']['items'], 'id'));
        $this->assertNotNull($a['json']['next_cursor']);
        $a = $this->http('GET', 'spaces/' . $iParent . '/spaces?limit=1&cursor=' . rawurlencode($a['json']['next_cursor']), $aAuth);
        $this->assertSame([(string)$iOlder], array_column($a['json']['items'], 'id'));
        $this->assertSame(array_column($this->http('GET', 'spaces/' . $iParent . '/spaces', $aAuth)['json']['items'], 'id'), array_column($this->http('GET', 'spaces?parent_id=' . $iParent, $aAuth)['json']['items'], 'id'), 'parent_id lists the same');

        $aTop = array_column($this->http('GET', 'spaces?top_level=true&limit=50', $aAuth)['json']['items'], 'id');
        $this->assertContains((string)$iParent, $aTop);
        $this->assertNotContains((string)$iOlder, $aTop, 'a subspace is not top level');
        $this->assertContains((string)$iOlder, array_column($this->http('GET', 'spaces?limit=50', $aAuth)['json']['items'], 'id'), 'without top_level, subspaces are listed too');

        foreach (['spaces?top_level=true&parent_id=' . $iParent, 'spaces?parent_id=abc', 'spaces?top_level=maybe'] as $sPath) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(422, $a['status'], $sPath . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }
        $this->assertSame(404, $this->http('GET', 'spaces?parent_id=' . $iViewer, $aAuth)['status'], 'a person has no subspaces');
        $this->assertSame(404, $this->http('GET', 'spaces/999999999/spaces', $aAuth)['status']);

        // a closed space shows outsiders no subspaces, as its page on the site
        $iClosed = $this->makeSpace($iOwner, 'c', true);
        $iInClosed = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false, $iClosed);
        foreach (['spaces/' . $iClosed . '/spaces', 'spaces?parent_id=' . $iClosed] as $sPath) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(403, $a['status'], $sPath . ': ' . $a['body']);
            $this->assertSchema('Problem', $a['json']);
        }
        $a = $this->http('GET', 'spaces/' . $iClosed, $aAuth);
        $this->assertSame([false, 0], [$a['json']['content_visible'], $a['json']['child_count']], 'nor counts them');
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $a = $this->http('GET', 'spaces/' . $iClosed . '/spaces', $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([(string)$iInClosed], array_column($a['json']['items'], 'id'));

        // one page with several parents: each counts its own subspaces
        $aCounts = array_column($this->http('GET', 'spaces?top_level=true&limit=50', $aOwner)['json']['items'], 'child_count', 'id');
        $this->assertSame([2, 1], [$aCounts[(string)$iParent] ?? null, $aCounts[(string)$iClosed] ?? null], 'subspaces per parent');
        $aMine = array_column($this->http('GET', 'me/spaces', $aOwner)['json'], null, 'id');
        $this->assertSame([2, 1, 0, (string)$iClosed], [$aMine[(string)$iParent]['child_count'] ?? null, $aMine[(string)$iClosed]['child_count'] ?? null, $aMine[(string)$iInClosed]['child_count'] ?? null, $aMine[(string)$iInClosed]['parent_id'] ?? null]);
    }

    public function testPostsGoIntoASpaceAndDiscussionsAreItsContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iSpace = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false);

        $aSpace = $this->http('GET', 'spaces/' . $iSpace, $aAuth)['json'];
        $this->assertFalse($aSpace['viewer']['can_post'], 'members post');
        $sBody = json_encode(['body_html' => '<p>ApiV2SpacesTest post</p>', 'context_id' => (string)$iSpace]);
        $this->assertSame(403, $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], $sBody)['status'], 'not from outside');
        $this->assertSame('active', $this->http('POST', 'spaces/' . $iSpace . '/membership', $aAuth)['json']['status'] ?? null);
        $this->assertTrue($this->http('GET', 'spaces/' . $iSpace, $aAuth)['json']['viewer']['can_post']);
        $a = $this->http('POST', 'feed-posts', $aAuth + ['Content-Type' => 'application/json'], $sBody);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aEvents[] = (int)$a['json']['id'];
        $this->assertSame((string)$iSpace, $a['json']['object']['context_id']);
        $this->assertContains($a['json']['id'], array_column($this->http('GET', 'profiles/' . $iSpace . '/timeline', $aAuth)['json']['items'], 'id'), 'in the space\'s feed');

        // what else goes into a space: Discussions, where the site lets them
        $bForum = BxDolModuleQuery::getInstance()->isEnabledByName('bx_forum');
        $bAllowed = $bForum && BxDolModule::getInstance('bx_forum')->serviceCheckAllowedAddInContext('bx_spaces') === CHECK_ACTION_RESULT_ALLOWED;
        $this->assertSame($bAllowed, in_array('discussions', $aSpace['content_kinds'], true), 'a space\'s discussions');
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_groups') && ($iGroup = $this->seedAnyPublicGroup())) {
            $a = $this->http('GET', 'groups/' . $iGroup, $aAuth);
            if ($a['status'] === 200) {
                $bInGroups = $bForum && BxDolModule::getInstance('bx_forum')->serviceCheckAllowedAddInContext('bx_groups') === CHECK_ACTION_RESULT_ALLOWED;
                $this->assertSchema('Group', $a['json']);
                $this->assertSame($bInGroups, in_array('discussions', $a['json']['content_kinds'], true), 'a group\'s discussions');
            }
        }

        // a link to a space resolves to a group-kind target of its module
        $a = $this->http('GET', 'links/resolve?url=' . rawurlencode(BxDolProfile::getInstance($iSpace)->getUrl()), $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('LinkTarget', $a['json']);
        $this->assertSame(['group', (string)$iSpace, 'bx_spaces'], [$a['json']['kind'], $a['json']['id'], $a['json']['module'] ?? null]);
        $a = $this->http('GET', 'links/resolve?url=' . rawurlencode(BxDolProfile::getInstance($iViewer)->getUrl()), $aAuth);
        $this->assertSame(['profile', BxDolProfile::getInstance($iViewer)->getModule()], [$a['json']['kind'] ?? null, $a['json']['module'] ?? null], $a['body']);
    }

    public function testSearchSpaces(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $sWord = 'Zq' . bin2hex(random_bytes(3));
        $iPublic = $this->makeSpace($iOwner, BX_DOL_PG_ALL, false, 0, $sWord . ' public');
        $iSecret = $this->makeSpace($iOwner, 's', true, 0, $sWord . ' secret');

        $a = $this->http('GET', 'search/spaces?q=' . rawurlencode($sWord), $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        foreach ($a['json'] as $aHit)
            $this->assertSchema('Profile', $aHit);
        $this->assertSame([(string)$iPublic], array_column($a['json'], 'id'), 'not the secret one');
        $this->assertSame('bx_spaces', $a['json'][0]['module']);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];
        $this->assertEqualsCanonicalizing([(string)$iPublic, (string)$iSecret], array_column($this->http('GET', 'search/spaces?q=' . rawurlencode($sWord), $aOwner)['json'], 'id'), 'its owner finds the secret one');
        $this->assertSame(422, $this->http('GET', 'search/spaces', $aAuth)['status']);
    }

    /**
     * A space made through the module's add service as its owner, deleted after the test.
     * @param int $iParent the profile id of the space it is in, or 0
     */
    private function makeSpace(int $iOwner, string $sView, bool $bApproval, int $iParent = 0, string $sName = ''): int
    {
        $this->requireModule('bx_spaces');
        if ($this->_iNotificationsFrom === null)
            $this->forgetNotificationsFromNowOn();

        $aCats = BxDolForm::getDataItems('bx_spaces_cats');
        $aValues = [
            'space_name' => $sName !== '' ? $sName : 'ApiV2SpacesTest ' . bin2hex(random_bytes(3)),
            'space_desc' => '<p>Made by ApiV2SpacesTest</p>',
            'space_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
            'allow_view_to' => $sView,
            'allow_post_to' => 'p', // BX_BASE_MOD_GROUPS_PG_PARTICIPANTS: members
            'join_confirmation' => $bApproval ? 1 : 0,
        ];
        if ($iParent)
            $aValues['parent_space'] = [$iParent];
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_spaces')->serviceEntityAddForcedly($iOwner, $aValues);
        }
        finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the space was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));

        $oProfile = BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_spaces');
        $this->_aSpaces[] = (int)$oProfile->id();
        BxDolDb::getInstance()->cleanMemoryAll();
        $aContent = BxDolModule::getInstance('bx_spaces')->_oDb->getContentInfoById((int)$a['content']['id']);
        $this->assertSame($iParent, (int)($aContent['parent_space'] ?? -1), 'its parent');
        $sStatus = BxDolProfileQuery::getInstance()->getInfoById((int)$oProfile->id())['status'] ?? '';
        if ($sStatus !== BX_PROFILE_STATUS_ACTIVE)
            $this->markTestSkipped('New spaces wait for approval on this site (' . $sStatus . ').');
        return (int)$oProfile->id();
    }
}
