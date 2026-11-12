<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Polls (bx_polls, BxPollsApiV2 on the text base), over real HTTP: polls each test
 * makes through POST /polls and deletes after. Asking, voting once (never again, never for an
 * answer of another poll), results shown to all or to voters only, Item.poll on the poll's feed
 * item, a secret group's poll, lists, search, deleting, and the paths only with the module.
 * Skips without bx_polls.
 */
#[Group('integration')]
class ApiV2PollsTest extends ApiV2TestCase
{
    /** Polls a test made, deleted after it through the module. */
    protected $_aPolls = [];
    /** The groups a test made, deleted after it. */
    protected $_aGroups = [];

    protected function tearDown(): void
    {
        if ($this->_aPolls && BxDolModuleQuery::getInstance()->isEnabledByName('bx_polls')) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $oModule = BxDolModule::getInstance('bx_polls');
            foreach ($this->_aPolls as $iId)
                if ($oModule->_oDb->getContentInfoById($iId))
                    $oModule->serviceDeleteEntity($iId);
        }
        if ($this->_aGroups)
            BxDolDb::getInstance()->cleanMemoryAll();
        foreach ($this->_aGroups as $iProfileId)
            if (($oProfile = BxDolProfile::getInstance($iProfileId)))
                $oProfile->delete(false, true, true);
        parent::tearDown();
    }

    /** A poll of the token's profile: its Poll. */
    protected function makePoll(array $aAuth, string $sQuestion, array $aOptions = ['Yes', 'No'], array $aBody = []): array
    {
        $a = $this->http('POST', 'polls', $aAuth + ['Content-Type' => 'application/json'], json_encode(['question' => $sQuestion, 'options' => $aOptions] + $aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aPolls[] = (int)$a['json']['id'];
        return $a['json'];
    }

    protected function vote(array $aAuth, string $sPoll, string $sOption): array
    {
        return $this->http('PUT', 'polls/' . $sPoll . '/vote', $aAuth + ['Content-Type' => 'application/json'], json_encode(['option_id' => $sOption]));
    }

    protected function requireAdding(array $aAuth): void
    {
        $this->requireModule('bx_polls');
        $a = $this->http('POST', 'polls', $aAuth + ['Content-Type' => 'application/json'], json_encode(['question' => 'ApiV2Test probe', 'options' => ['a', 'b']]));
        if ($a['status'] === 403)
            $this->markTestSkipped('The test user may not add polls here.');
        $this->assertSame(201, $a['status'], $a['body']);
        $this->_aPolls[] = (int)$a['json']['id'];
    }

    public function testPollPathsOnlyWhilePollsIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/polls', '/polls/{id}', '/polls/{id}/vote', '/search/polls'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_polls']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxPollsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Polls');
        $this->assertArrayNotHasKey('NewPoll', $aSpec['components']['schemas']);
        // Item.poll names Poll on a site without Polls too
        if (isset($aEnabled['bx_timeline']))
            $this->assertArrayHasKey('Poll', $aSpec['components']['schemas']);

        $this->requireModule('bx_polls');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxPollsApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Polls');
        $this->assertSame('votePoll', $aSpec['paths']['/polls/{id}/vote']['put']['operationId']);
        $this->assertEqualsCanonicalizing(['get', 'delete'], array_keys($aSpec['paths']['/polls/{id}']));

        $a = $this->http('GET', '');
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_polls', 'tag' => 'polls', 'kind' => 'poll'], array_diff_key($aModules['bx_polls'] ?? [], ['title' => 1, 'audiences' => 1]));
        $this->assertSame('poll', (new BxPollsApiV2())->apiV2ItemKind('bx_polls'));
        $this->assertNull((new BxPollsApiV2())->apiV2ItemPolls('bx_posts', [1]));
    }

    public function testAskingVotingOnceAndResults(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];
        $aJson = $aAuth + ['Content-Type' => 'application/json'];

        // a question and 2 to 10 different answers; guests ask nothing
        $fField = function ($a) { return [$a['status'], $a['json']['errors'][0]['field'] ?? null]; };
        $this->assertSame([422, 'question'], $fField($this->http('POST', 'polls', $aJson, json_encode(['question' => ' ', 'options' => ['a', 'b']]))));
        $this->assertSame([422, 'options'], $fField($this->http('POST', 'polls', $aJson, json_encode(['question' => 'Q?', 'options' => ['only one']]))));
        $this->assertSame([422, 'options'], $fField($this->http('POST', 'polls', $aJson, json_encode(['question' => 'Q?', 'options' => array_map('strval', range(1, 11))]))));
        $this->assertSame([422, 'options[1]'], $fField($this->http('POST', 'polls', $aJson, json_encode(['question' => 'Q?', 'options' => ['Same', ' same ']]))));
        $this->assertSame([422, 'options[2]'], $fField($this->http('POST', 'polls', $aJson, json_encode(['question' => 'Q?', 'options' => ['a', 'b', '  ']]))));
        $this->assertSame(401, $this->http('POST', 'polls', ['Content-Type' => 'application/json'], json_encode(['question' => 'Q?', 'options' => ['a', 'b']]))['status']);

        $aPoll = $this->makePoll($aAuth, "ApiV2Test which day?\nThe workshop is open in the evening.", ['Tuesday', 'Thursday', 'Saturday']);
        $this->assertSchema('Poll', $aPoll);
        $this->assertSame("ApiV2Test which day?\nThe workshop is open in the evening.", $aPoll['question']);
        $this->assertSame(['Tuesday', 'Thursday', 'Saturday'], array_column($aPoll['options'], 'title'), 'in their order');
        $this->assertSame([0, 0, 0], array_column($aPoll['options'], 'votes'));
        $this->assertSame([0, false, true, 'public'], [$aPoll['voters'], $aPoll['hidden_results'], $aPoll['results_visible'], $aPoll['audience']]);
        $this->assertSame(['voted' => null, 'can_vote' => true, 'can_delete' => true], $aPoll['viewer']);
        $this->assertNotNull($aPoll['content_id'], 'the feeds show it');
        $sThursday = $aPoll['options'][1]['id'];

        // one vote: the poll as it is now, the viewer's answer marked; never again, not even the same
        $a = $this->vote($aOther, $aPoll['id'], $sThursday);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Poll', $a['json']);
        $this->assertSame([0, 1, 0], array_column($a['json']['options'], 'votes'));
        $this->assertSame([1, $sThursday, false], [$a['json']['voters'], $a['json']['viewer']['voted'], $a['json']['viewer']['can_vote']]);
        $this->assertSame(409, ($b = $this->vote($aOther, $aPoll['id'], $sThursday))['status']);
        $this->assertSame('already_voted', $b['json']['code']);
        $this->assertSame(409, $this->vote($aOther, $aPoll['id'], $aPoll['options'][0]['id'])['status']);

        // an answer of another poll, or none, is no answer of this one; guests vote on the site
        $aOtherPoll = $this->makePoll($aAuth, 'ApiV2Test another', ['A', 'B']);
        $this->assertSame(['unknown_option', 'option_id'], (function ($a) { return [$a['json']['code'] ?? null, $a['json']['errors'][0]['field'] ?? null]; })($this->vote($aAuth, $aPoll['id'], $aOtherPoll['options'][0]['id'])));
        $this->assertSame(422, $this->http('PUT', 'polls/' . $aPoll['id'] . '/vote', $aJson, json_encode(['option_id' => 'x']))['status']);
        $this->assertSame(401, $this->vote([], $aPoll['id'], $sThursday)['status']);

        // what others see: the counts, but not who voted; the author has not voted
        $a = $this->http('GET', 'polls/' . $aPoll['id'], $aAuth);
        $this->assertSame([[0, 1, 0], null, true], [array_column($a['json']['options'], 'votes'), $a['json']['viewer']['voted'], $a['json']['viewer']['can_vote']]);
        $this->assertIsString($a['json']['text_html']);
        $a = $this->http('GET', 'polls/' . $aPoll['id']);
        $this->assertSame([[0, 1, 0], null], [array_column($a['json']['options'], 'votes'), $a['json']['viewer']]);

        // only its author (or an administrator) deletes it
        $this->assertSame(403, $this->http('DELETE', 'polls/' . $aOtherPoll['id'], $aOther)['status']);
        $this->assertSame(204, $this->http('DELETE', 'polls/' . $aOtherPoll['id'], $aAuth)['status']);
        $this->assertSame(404, $this->http('GET', 'polls/' . $aOtherPoll['id'], $aAuth)['status']);
        $this->assertSame(404, $this->vote($aOther, $aOtherPoll['id'], $aOtherPoll['options'][0]['id'])['status']);
    }

    public function testResultsHiddenUntilOneVotes(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];

        $aPoll = $this->makePoll($aAuth, 'ApiV2Test hidden results', ['Red', 'Blue'], ['hidden_results' => true]);
        $this->assertSame([true, false, [null, null]], [$aPoll['hidden_results'], $aPoll['results_visible'], array_column($aPoll['options'], 'votes')]);

        $a = $this->vote($aOther, $aPoll['id'], $aPoll['options'][1]['id']);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([true, [0, 1], 1], [$a['json']['results_visible'], array_column($a['json']['options'], 'votes'), $a['json']['voters']]);
        foreach ([$aAuth, []] as $aHeaders) {
            $b = $this->http('GET', 'polls/' . $aPoll['id'], $aHeaders);
            $this->assertSame([false, [null, null], 1], [$b['json']['results_visible'], array_column($b['json']['options'], 'votes'), $b['json']['voters']], 'who has not voted sees how many did');

            // and so in a list of the author's polls and on the poll's feed item
            $aRows = array_column($this->http('GET', 'polls?author=' . $iViewer . '&limit=50', $aHeaders)['json']['items'], null, 'id');
            $this->assertSame([false, [null, null]], [$aRows[$aPoll['id']]['results_visible'] ?? null, array_column($aRows[$aPoll['id']]['options'] ?? [], 'votes')], 'in GET /polls');
            if ($aPoll['content_id'] !== null) {
                $c = $this->http('GET', 'content/' . $aPoll['content_id'], $aHeaders);
                $this->assertSame(200, $c['status'], $c['body']);
                $this->assertSame([false, [null, null], 1], [$c['json']['poll']['results_visible'], array_column($c['json']['poll']['options'], 'votes'), $c['json']['poll']['voters']], 'in Item.poll');
            }
        }
        // the voter sees them in both
        $aRows = array_column($this->http('GET', 'polls?author=' . $iViewer . '&limit=50', $aOther)['json']['items'], null, 'id');
        $this->assertSame([0, 1], array_column($aRows[$aPoll['id']]['options'] ?? [], 'votes'));
        if ($aPoll['content_id'] !== null)
            $this->assertSame([0, 1], array_column($this->http('GET', 'content/' . $aPoll['content_id'], $aOther)['json']['poll']['options'], 'votes'));
    }

    public function testNoVotesWhereTheLevelMayNotVote(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $aPoll = $this->makePoll($aAuth, 'ApiV2Test no votes for this level', ['Up', 'Down']);
        $this->assertTrue($aPoll['viewer']['can_vote']);

        $oDb = BxDolDb::getInstance();
        $aLevel = BxDolAcl::getInstance()->getMemberMembershipInfo($iViewer);
        $aMatrix = $oDb->getRow("SELECT `m`.* FROM `sys_acl_matrix` AS `m` INNER JOIN `sys_acl_actions` AS `a` ON `a`.`ID` = `m`.`IDAction` WHERE `a`.`Module` = 'bx_polls' AND `a`.`Name` = 'vote entry' AND `m`.`IDLevel` = :l", ['l' => (int)($aLevel['id'] ?? 0)]);
        if (!$aMatrix)
            $this->markTestSkipped('The test user\'s level may not vote in polls here.');

        $oDb->query("DELETE FROM `sys_acl_matrix` WHERE `IDLevel` = :l AND `IDAction` = :a", ['l' => $aMatrix['IDLevel'], 'a' => $aMatrix['IDAction']]);
        try {
            $a = $this->http('GET', 'polls/' . $aPoll['id'], $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertFalse($a['json']['viewer']['can_vote']);
            $a = $this->vote($aAuth, $aPoll['id'], $aPoll['options'][0]['id']);
            $this->assertSame(403, $a['status'], $a['body']);
        }
        finally {
            $oDb->query("INSERT INTO `sys_acl_matrix` SET " . implode(', ', array_map(function ($s) {
                return '`' . $s . '` = :' . $s;
            }, array_keys($aMatrix))), $aMatrix);
        }
        $this->assertSame([0, 0], array_column($this->http('GET', 'polls/' . $aPoll['id'], $aAuth)['json']['options'], 'votes'), 'nothing was counted');
    }

    public function testNoVotesInAPollThatIsNotOpen(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $CNF = &BxDolModule::getInstance('bx_polls')->_oConfig->CNF;
        $aPoll = $this->makePoll($aAuth, 'ApiV2Test waiting for a moderator', ['Now', 'Later']);

        // its author still sees it while it waits, but nobody votes in it
        foreach (['status_admin' => [$CNF['FIELD_STATUS_ADMIN'], 'pending'], 'status' => [$CNF['FIELD_STATUS'], 'hidden']] as $sCase => list($sField, $sValue)) {
            BxDolDb::getInstance()->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $sField . "` = :v WHERE `" . $CNF['FIELD_ID'] . "` = :i", ['v' => $sValue, 'i' => (int)$aPoll['id']]);
            $a = $this->http('GET', 'polls/' . $aPoll['id'], $aAuth);
            $this->assertSame(200, $a['status'], $sCase . ': ' . $a['body']);
            $this->assertFalse($a['json']['viewer']['can_vote'], $sCase);
            $a = $this->vote($aAuth, $aPoll['id'], $aPoll['options'][0]['id']);
            $this->assertSame([409, 'not_open'], [$a['status'], $a['json']['code'] ?? null], $sCase . ': ' . $a['body']);
            BxDolDb::getInstance()->query("UPDATE `" . $CNF['TABLE_ENTRIES'] . "` SET `" . $sField . "` = 'active' WHERE `" . $CNF['FIELD_ID'] . "` = :i", ['i' => (int)$aPoll['id']]);
        }
        $this->assertSame([0, 0], array_column($this->http('GET', 'polls/' . $aPoll['id'], $aAuth)['json']['options'], 'votes'), 'nothing was counted');
    }

    public function testThePollOnItsFeedItem(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        $this->requireModule('bx_timeline');
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOther = ['Authorization' => 'Bearer ' . $this->profileToken($iOther)];

        $aPoll = $this->makePoll($aAuth, 'ApiV2Test in the feed', ['Here', 'There']);
        $a = $this->http('GET', 'content/' . $aPoll['content_id'], $aOther);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Item', $a['json']);
        $this->assertSame(['poll', 'bx_polls', $aPoll['id']], [$a['json']['kind'], $a['json']['module'], $a['json']['poll']['id'] ?? null]);
        $this->assertSame([true, null], [$a['json']['poll']['viewer']['can_vote'], $a['json']['poll']['text_html']]);
        $sVersion = $a['json']['version'];

        $this->assertSame(200, $this->vote($aOther, $aPoll['id'], $aPoll['options'][0]['id'])['status']);
        $a = $this->http('GET', 'content/' . $aPoll['content_id'], $aOther);
        $this->assertSame([$aPoll['options'][0]['id'], [1, 0]], [$a['json']['poll']['viewer']['voted'], array_column($a['json']['poll']['options'], 'votes')]);
        $this->assertNotSame($sVersion, $a['json']['version'], 'a vote changes the item');

        // the author's feed has it with the poll, as other items have none
        $a = $this->http('GET', 'feeds/profile/' . $iViewer . '?limit=20', $aOther);
        if ($a['status'] === 200) {
            $aItems = array_column(array_column($a['json']['items'], 'object'), null, 'id');
            $this->assertSame($aPoll['id'], $aItems[$aPoll['content_id']]['poll']['id'] ?? null);
            foreach ($aItems as $aItem)
                if ($aItem['kind'] !== 'poll')
                    $this->assertArrayNotHasKey('poll', $aItem);
        }
    }

    public function testAPollInASecretGroup(): void
    {
        $this->requireModule('bx_groups');
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);
        if (BxDolModule::getInstance('bx_polls')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('This site keeps no polls in groups.');
        $iOwner = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $aOwner = ['Authorization' => 'Bearer ' . $this->profileToken($iOwner)];

        $iSecret = $this->makeGroup($iOwner, 's');
        $aPoll = $this->makePoll($aOwner, 'ApiV2Test secret poll', ['Yes', 'No'], ['context_id' => (string)$iSecret]);
        $this->assertSame(['context', (string)$iSecret], [$aPoll['audience'], $aPoll['context_id']]);
        $this->assertSame(422, $this->http('POST', 'polls', $aOwner + ['Content-Type' => 'application/json'], json_encode(['question' => 'Q?', 'options' => ['a', 'b'], 'context_id' => (string)$iSecret, 'audience' => 'public']))['status'], 'not both');

        foreach ([$aAuth, []] as $aHeaders) {
            $this->assertSame(404, $this->http('GET', 'polls/' . $aPoll['id'], $aHeaders)['status']);
            $this->assertNotContains($aPoll['id'], array_column($this->http('GET', 'polls?author=' . $iOwner . '&limit=50', $aHeaders)['json']['items'], 'id'));
        }
        $this->assertSame(404, $this->vote($aAuth, $aPoll['id'], $aPoll['options'][0]['id'])['status']);
        $this->assertSame(422, $this->http('GET', 'polls?context=' . $iSecret, $aAuth)['status'], 'a context the viewer may not know of');
        $a = $this->http('GET', 'polls?context=' . $iSecret, $aOwner);
        $this->assertSchema('Page_Poll', $a['json']);
        $this->assertSame([$aPoll['id']], array_column($a['json']['items'], 'id'), 'its members list it');
    }

    public function testListsSearchAndContextContent(): void
    {
        list($iViewer, $sToken) = $this->userToken();
        $aAuth = ['Authorization' => 'Bearer ' . $sToken];
        $this->requireAdding($aAuth);

        $sWord = 'apiv2poll' . bin2hex(random_bytes(4));
        $aFirst = $this->makePoll($aAuth, 'ApiV2Test ' . $sWord . ' first');
        $aSecond = $this->makePoll($aAuth, 'ApiV2Test ' . $sWord . ' second');
        $aPrivate = $this->makePoll($aAuth, 'ApiV2Test ' . $sWord . ' private', ['a', 'b'], ['audience' => 'private']);

        // an author's polls page by page, newest first, next_cursor null at the end
        $aIds = [];
        $sPath = 'polls?author=' . $iViewer . '&limit=1';
        for ($i = 0; $i < 3 && $sPath; $i++) {
            $a = $this->http('GET', $sPath, $aAuth);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Poll', $a['json']);
            $this->assertArrayHasKey('next_cursor', $a['json']);
            $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
            $sPath = $a['json']['next_cursor'] !== null ? 'polls?author=' . $iViewer . '&limit=1&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        $this->assertSame([$aPrivate['id'], $aSecond['id'], $aFirst['id']], array_slice($aIds, 0, 3));

        $a = $this->http('GET', 'search/polls?q=' . $sWord, $aAuth);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Poll', $a['json']);
        $this->assertEqualsCanonicalizing([$aFirst['id'], $aSecond['id'], $aPrivate['id']], array_column($a['json']['items'], 'id'));
        $iOther = $this->ordinaryProfileIdOtherThan([$iViewer]);
        $a = $this->http('GET', 'search/polls?q=' . $sWord, ['Authorization' => 'Bearer ' . $this->profileToken($iOther)]);
        $this->assertEqualsCanonicalizing([$aFirst['id'], $aSecond['id']], array_column($a['json']['items'], 'id'), 'not the private one');
        $this->assertContains($this->http('GET', 'polls/' . $aPrivate['id'], ['Authorization' => 'Bearer ' . $this->profileToken($iOther)])['status'], [403, 404], 'the private one is not shown to others');

        $oPolls = new BxPollsApiV2();
        foreach (['bx_groups', 'bx_spaces', 'bx_events'] as $sContext)
            if (BxDolModuleQuery::getInstance()->isEnabledByName($sContext))
                $this->assertSame(BxDolModule::getInstance('bx_polls')->serviceCheckAllowedAddInContext($sContext) === CHECK_ACTION_RESULT_ALLOWED ? 'polls' : null, $oPolls->apiV2ContextContent($sContext), $sContext);
    }

    private function makeGroup(int $iOwner, string $sView): int
    {
        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2PollsTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2PollsTest</p>',
                'group_cat' => (string)(array_key_last(is_array($aCats) ? $aCats : []) ?? ''),
                'allow_view_to' => $sView,
                'allow_post_to' => 'p',
                'join_confirmation' => 0,
            ]);
        }
        finally {
            $GLOBALS['glForceCurrentProfileId'] = $mBefore;
        }
        $this->assertSame(0, $a['code'] ?? null, 'the group was made: ' . json_encode($a['errors'] ?? $a['message'] ?? ''));
        $iProfileId = (int)BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_groups')->id();
        $this->_aGroups[] = $iProfileId;
        BxDolDb::getInstance()->cleanMemoryAll();
        return $iProfileId;
    }
}
