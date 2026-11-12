<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * API v2 for Tasks (bx_tasks, BxTasksApiV2 on the text base), over real HTTP: a group each test
 * makes with an owner and a member who joins it, its lists and tasks made through the API, and
 * deleted after. Lists with their counts, adding (in contexts only, assignees from its members),
 * completing and reopening by an assignee, what an assignee may not change, /me/tasks by due
 * date, the activity the module logs as comments, closed and secret groups, deleting a list with
 * its tasks, search and the paths only with the module; the site's choices and a context's own
 * types and labels, filters, counts and saved filters, one's contexts with their lists, timers
 * and logged time, a context's budget and its entries. Skips without bx_tasks or bx_groups.
 */
#[Group('integration')]
class ApiV2TasksTest extends ApiV2TestCase
{
    /** Profiles a test made (groups), deleted after its tasks and lists. */
    protected $_aProfiles = [];
    /** Lists a test made. */
    protected $_aLists = [];

    protected function tearDown(): void
    {
        BxDolDb::getInstance()->cleanMemoryAll();
        if (BxDolModuleQuery::getInstance()->isEnabledByName('bx_tasks')) {
            $oModule = BxDolModule::getInstance('bx_tasks');
            foreach ($this->_aProfiles as $iContext)
                foreach ((array)$oModule->_oDb->getTasks($iContext) as $aTask)
                    $oModule->serviceDeleteEntity((int)$aTask['id']);
            foreach ($this->_aLists as $iList)
                $oModule->_oDb->deleteList($iList);
            foreach ($this->_aProfiles as $iContext)
                foreach (['bx_tasks_pre_values', 'bx_tasks_budget', 'bx_tasks_budget_track'] as $sTable)
                    BxDolDb::getInstance()->query("DELETE FROM `" . $sTable . "` WHERE `context_id` = :c", ['c' => $iContext]);
        }
        foreach (array_reverse($this->_aProfiles) as $iProfile)
            if (($oProfile = BxDolProfile::getInstance($iProfile)))
                $oProfile->delete(false, true, true);
        parent::tearDown();
    }

    public function testTaskPathsOnlyWhileTasksIsEnabled(): void
    {
        $aEnabled = [];
        foreach (BxDolModuleQuery::getInstance()->getModulesBy(['type' => 'modules', 'active' => 1]) as $aModule)
            $aEnabled[$aModule['name']] = $aModule;
        $aWithFile = array_keys($aEnabled);
        $aPaths = ['/task-lists', '/task-lists/{id}', '/tasks', '/tasks/{id}', '/me/tasks', '/search/tasks', '/tasks/facets', '/me/tasks/facets', '/tasks/choices', '/task-filters', '/me/task-contexts', '/me/timers', '/tasks/{id}/timer', '/tasks/{id}/time', '/task-contexts/{id}/budget', '/task-contexts/{id}/budget/entries', '/task-budget-entries/{id}'];

        $aWithout = $aEnabled;
        unset($aWithout['bx_tasks']);
        $aClasses = BxDolApiV2Router::classesFor($aWithout, $aWithFile);
        $this->assertNotContains('BxTasksApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayNotHasKey($sPath, $aSpec['paths'], $sPath . ' without Tasks');
        $this->assertArrayNotHasKey('Task', $aSpec['components']['schemas']);

        $this->requireModule('bx_tasks');
        $aClasses = BxDolApiV2Router::classesFor($aEnabled, $aWithFile);
        $this->assertContains('BxTasksApiV2', $aClasses);
        $aSpec = (new BxDolApiV2Spec(new BxDolApiV2Router($aClasses)))->build();
        foreach ($aPaths as $sPath)
            $this->assertArrayHasKey($sPath, $aSpec['paths'], $sPath . ' with Tasks');
        $this->assertEqualsCanonicalizing(['get', 'patch', 'delete'], array_keys($aSpec['paths']['/tasks/{id}']));

        $a = $this->http('GET', '');
        $aModules = array_column($a['json']['modules'], null, 'module');
        $this->assertSame(['module' => 'bx_tasks', 'tag' => 'tasks', 'kind' => 'task'], array_diff_key($aModules['bx_tasks'] ?? [], ['title' => 1, 'audiences' => 1]));
        $this->assertSame('task', (new BxTasksApiV2())->apiV2ItemKind('bx_tasks'));
    }

    public function testListsTasksAndAddingInAContext(): void
    {
        list($iGroup, $iOwner, $iMember, $iOutsider) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $aMember = $this->auth($iMember);

        // lists: the Inbox alone at first, with the site's choices; adding a list
        $a = $this->http('GET', 'task-lists?context_id=' . $iGroup, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskLists', $a['json']);
        $this->assertSame([[null, 0, 0]], array_map(fn($l) => [$l['id'], $l['task_count'], $l['open_count']], $a['json']['items']));
        $this->assertTrue($a['json']['can_add_lists']);
        $this->assertNotEmpty($a['json']['priorities']);
        $this->assertNotEmpty(array_filter($a['json']['states'], fn($s) => $s['done']));
        $this->assertSame(422, $this->http('GET', 'task-lists', $aOwner)['status'], 'a context is needed');

        $sList = $this->makeList($aOwner, $iGroup, 'ApiV2TasksTest sprint');
        $this->assertSame(422, $this->http('POST', 'task-lists', $this->json($aOwner), json_encode(['context_id' => (string)$iGroup, 'title' => ' ']))['status']);
        $a = $this->http('PATCH', 'task-lists/' . $sList, $this->json($aMember), json_encode(['title' => 'ApiV2TasksTest renamed']));
        $this->assertSame(200, $a['status'], 'a member may rename it, as the site\'s list form lets them: ' . $a['body']);
        $this->assertSame('ApiV2TasksTest renamed', $a['json']['title']);
        $this->assertFalse($a['json']['viewer']['can_delete'], 'only the group\'s administrators delete lists');

        // adding: in a context, a title, assignees from its members, the viewer by default
        $aJson = $this->json($aOwner);
        $this->assertSame(['context_id', 422], $this->problemField($this->http('POST', 'tasks', $aJson, json_encode(['title' => 'Something', 'context_id' => null]))), 'no context');
        $this->assertSame(['title', 422], $this->problemField($this->http('POST', 'tasks', $aJson, json_encode(['context_id' => (string)$iGroup, 'title' => ' ']))));
        $this->assertSame(['assignee_ids[0]', 422], $this->problemField($this->http('POST', 'tasks', $aJson, json_encode(['context_id' => (string)$iGroup, 'title' => 'Something', 'assignee_ids' => [(string)$iOutsider]]))), 'not a member');
        $this->assertSame(['list_id', 422], $this->problemField($this->http('POST', 'tasks', $aJson, json_encode(['context_id' => (string)$iGroup, 'title' => 'Something', 'list_id' => '999999999']))));
        $this->assertSame(403, $this->http('POST', 'tasks', $this->json($this->auth($iOutsider)), json_encode(['context_id' => (string)$iGroup, 'title' => 'Something']))['status'], 'an outsider may not post there');

        $aMine = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest mine', 'body' => "First line\nSecond line"]);
        $this->assertSame([(string)$iOwner], array_column($aMine['assignees'], 'id'), 'the viewer by default, as the site\'s form');
        $this->assertSame([null, (string)$iGroup, '<p>First line</p><p>Second line</p>'], [$aMine['list_id'], $aMine['context_id'], $aMine['body_html']]);
        $this->assertSame((string)$iGroup, $aMine['context']['id']);

        $sPriority = (string)$this->choices($aOwner, $iGroup)['priorities'][0]['id'];
        $aDue = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest due', 'list_id' => $sList, 'due_at' => '2037-03-01T09:30:00Z', 'assignee_ids' => [(string)$iMember], 'priority_id' => $sPriority]);
        $this->assertSame([$sList, 'ApiV2TasksTest renamed', '2037-03-01T09:30:00Z', [(string)$iMember], $sPriority], [$aDue['list_id'], $aDue['list_title'], $aDue['due_at'], array_column($aDue['assignees'], 'id'), $aDue['priority']['id']]);
        $aNobody = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest nobody', 'list_id' => $sList, 'due_at' => '2037-01-01T09:00:00Z', 'assignee_ids' => []]);
        $this->assertSame([], $aNobody['assignees']);

        // a list's tasks: open first, then by due date; the Inbox; counts
        $a = $this->http('GET', 'tasks?context_id=' . $iGroup . '&list_id=' . $sList, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_Task', $a['json']);
        $this->assertSame([$aNobody['id'], $aDue['id']], array_column($a['json']['items'], 'id'), 'the sooner due first');
        $this->assertSame([$aMine['id']], array_column($this->http('GET', 'tasks?context_id=' . $iGroup . '&list_id=inbox', $aMember)['json']['items'], 'id'));
        $this->assertSame(422, $this->http('GET', 'tasks?list_id=inbox', $aMember)['status'], 'a list needs its context');
        $a = $this->http('GET', 'task-lists?context_id=' . $iGroup, $aMember);
        $this->assertSame([[null, 1, 1], [$sList, 2, 2]], array_map(fn($l) => [$l['id'], $l['task_count'], $l['open_count']], $a['json']['items']));

        // the group's content kinds
        $bAllowed = BxDolModule::getInstance('bx_tasks')->serviceCheckAllowedAddInContext('bx_groups') === CHECK_ACTION_RESULT_ALLOWED;
        $this->assertSame($bAllowed, in_array('tasks', $this->http('GET', 'groups/' . $iGroup, $aMember)['json']['content_kinds'], true));
    }

    public function testCompletingAssigningAndWhatAnAssigneeMayNotDo(): void
    {
        list($iGroup, $iOwner, $iMember, $iOutsider) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $aMember = $this->json($this->auth($iMember));
        $aTask = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest assigned', 'assignee_ids' => [(string)$iMember], 'due_at' => '2037-05-01T10:00:00Z']);
        $sId = $aTask['id'];

        // the assignee manages it: completes it, reopens it, moves its due date
        $a = $this->http('GET', 'tasks/' . $sId, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Task', $a['json']);
        $this->assertSame([false, true], [$a['json']['viewer']['can_edit'], $a['json']['viewer']['can_complete']]);
        $a = $this->http('PATCH', 'tasks/' . $sId, $aMember, json_encode(['completed' => true]));
        $this->assertSame([200, true], [$a['status'], $a['json']['completed'] ?? null], $a['body']);
        $this->assertSame([$sId], array_column($this->http('GET', 'tasks?context_id=' . $iGroup . '&state=completed', $aMember)['json']['items'], 'id'), 'listed as completed');
        $this->assertSame([], $this->http('GET', 'tasks?context_id=' . $iGroup . '&state=open', $aMember)['json']['items']);
        $a = $this->http('PATCH', 'tasks/' . $sId, $aMember, json_encode(['completed' => false, 'due_at' => null]));
        $this->assertSame([200, false, null], [$a['status'], $a['json']['completed'] ?? null, array_key_exists('due_at', $a['json']) ? $a['json']['due_at'] : 'x'], $a['body']);

        // a done state completes it, as on the site
        $sDone = '';
        foreach ($this->choices($aOwner, $iGroup)['states'] as $aState)
            if ($aState['done'])
                $sDone = $aState['id'];
        $a = $this->http('PATCH', 'tasks/' . $sId, $aMember, json_encode(['state_id' => $sDone]));
        $this->assertSame([200, true, $sDone], [$a['status'], $a['json']['completed'] ?? null, $a['json']['state']['id'] ?? null], $a['body']);

        // the activity the module logs: comments as the site shows them, not their codes
        $a = $this->http('GET', 'tasks/' . $sId, $aMember);
        if (($sItem = $a['json']['content_id'])) {
            $b = $this->http('GET', 'content/' . $sItem . '/comments?limit=50', $aMember);
            $this->assertSame(200, $b['status'], $b['body']);
            $this->assertNotEmpty($b['json']['items']);
            foreach ($b['json']['items'] as $aCmt) {
                $this->assertSchema('Comment', $aCmt);
                $this->assertStringNotContainsString('"key"', $aCmt['body_html'], 'a logged change is its text');
            }
        }

        // what an assignee may not do: its title and text, deleting it; nothing changes on a refusal
        $this->assertSame(403, $this->http('PATCH', 'tasks/' . $sId, $aMember, json_encode(['title' => 'Something', 'completed' => false]))['status']);
        $this->assertTrue($this->http('GET', 'tasks/' . $sId, $aMember)['json']['completed'], 'nothing changed');
        $this->assertSame(403, $this->http('DELETE', 'tasks/' . $sId, $aMember)['status']);
        // nor may an outsider do anything
        $this->assertSame(403, $this->http('PATCH', 'tasks/' . $sId, $this->json($this->auth($iOutsider)), json_encode(['completed' => false]))['status']);

        // the author reassigns it (members only) and renames it
        $aJson = $this->json($aOwner);
        $this->assertSame(['assignee_ids[0]', 422], $this->problemField($this->http('PATCH', 'tasks/' . $sId, $aJson, json_encode(['assignee_ids' => [(string)$iOutsider]]))));
        $a = $this->http('PATCH', 'tasks/' . $sId, $aJson, json_encode(['assignee_ids' => [(string)$iOwner], 'title' => 'ApiV2TasksTest renamed', 'body' => 'New text']));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([[(string)$iOwner], 'ApiV2TasksTest renamed', '<p>New text</p>'], [array_column($a['json']['assignees'], 'id'), $a['json']['title'], $a['json']['body_html']]);
        // unassigned, the member manages it no more
        $this->assertFalse($this->http('GET', 'tasks/' . $sId, $aMember)['json']['viewer']['can_complete']);
        $this->assertSame(403, $this->http('PATCH', 'tasks/' . $sId, $aMember, json_encode(['completed' => false]))['status']);
        $this->assertSame(422, $this->http('PATCH', 'tasks/' . $sId, $aJson, '{}')['status']);
    }

    public function testMyTasksByDueDate(): void
    {
        list($iGroup, $iOwner, $iMember) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $sMember = (string)$iMember;
        $aLater = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest later', 'assignee_ids' => [$sMember], 'due_at' => '2037-09-01T09:00:00Z']);
        $aNone = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest none', 'assignee_ids' => [$sMember]]);
        $aSoon = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest soon', 'assignee_ids' => [$sMember], 'due_at' => '2037-08-01T09:00:00Z']);
        $aDone = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest done', 'assignee_ids' => [$sMember], 'due_at' => '2037-07-01T09:00:00Z']);
        $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest not theirs', 'due_at' => '2037-07-01T09:00:00Z']);
        $this->assertSame(200, $this->http('PATCH', 'tasks/' . $aDone['id'], $this->json($this->auth($iMember)), '{"completed":true}')['status']);

        // theirs, open, due soonest first, those without a due date last, page by page
        $aMember = $this->auth($iMember);
        $aIds = [];
        $sPath = 'me/tasks?limit=1';
        for ($i = 0; $i < 10 && $sPath; $i++) {
            $a = $this->http('GET', $sPath, $aMember);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('Page_Task', $a['json']);
            $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
            $sPath = $a['json']['next_cursor'] !== null ? 'me/tasks?limit=1&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        $aMine = array_values(array_intersect($aIds, [$aLater['id'], $aNone['id'], $aSoon['id'], $aDone['id']]));
        $this->assertSame([$aSoon['id'], $aLater['id'], $aNone['id']], $aMine);
        $this->assertContains($aDone['id'], array_column($this->http('GET', 'me/tasks?state=completed&limit=50', $aMember)['json']['items'], 'id'));
        $this->assertSame(401, $this->http('GET', 'me/tasks')['status']);
        $this->assertSame(401, $this->http('GET', 'tasks?assignee=me')['status']);
        $this->assertSame(array_slice($aIds, 0, 3), array_slice(array_column($this->http('GET', 'tasks?assignee=me&state=open', $aMember)['json']['items'], 'id'), 0, 3));
    }

    public function testClosedAndSecretGroupsAndDeletingAList(): void
    {
        list($iClosed, $iOwner, $iMember, $iOutsider) = $this->groupWithMember('c');
        list($iSecret) = $this->groupWithMember('s', $iOwner, false);
        $aOwner = $this->auth($iOwner);
        $aOutsider = $this->auth($iOutsider);
        $sWord = 'Zq' . bin2hex(random_bytes(3));
        $aClosed = $this->makeTask($aOwner, $iClosed, ['title' => $sWord . ' closed']);
        $aSecret = $this->makeTask($aOwner, $iSecret, ['title' => $sWord . ' secret']);

        foreach ([$aOutsider, []] as $aHeaders) {
            // a closed group may be known, its tasks not seen; a secret one is not there
            $this->assertSame(403, $this->http('GET', 'tasks/' . $aClosed['id'], $aHeaders)['status']);
            $this->assertSame(403, $this->http('GET', 'task-lists?context_id=' . $iClosed, $aHeaders)['status']);
            $this->assertSame(403, $this->http('GET', 'tasks?context_id=' . $iClosed, $aHeaders)['status']);
            $this->assertSame(404, $this->http('GET', 'tasks/' . $aSecret['id'], $aHeaders)['status']);
            $this->assertSame(['context_id', 422], $this->problemField($this->http('GET', 'task-lists?context_id=' . $iSecret, $aHeaders)));
            $this->assertSame([], array_column($this->http('GET', 'search/tasks?q=' . $sWord, $aHeaders)['json']['items'], 'id'));
        }
        // a member sees them, and finds them
        $aMember = $this->auth($iMember);
        $this->assertSame(200, $this->http('GET', 'tasks/' . $aClosed['id'], $aMember)['status']);
        $a = $this->http('GET', 'search/tasks?q=' . $sWord, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([$aClosed['id']], array_column($a['json']['items'], 'id'), 'not a member of the secret one');
        $this->assertEqualsCanonicalizing([$aClosed['id'], $aSecret['id']], array_column($this->http('GET', 'search/tasks?q=' . $sWord, $aOwner)['json']['items'], 'id'));

        // a list in the secret group is not there for the outsider; its owner deletes it with its tasks
        $sList = $this->makeList($aOwner, $iSecret, 'ApiV2TasksTest secret list');
        $aInList = $this->makeTask($aOwner, $iSecret, ['title' => 'ApiV2TasksTest in the list', 'list_id' => $sList]);
        $this->assertSame(404, $this->http('PATCH', 'task-lists/' . $sList, $this->json($aOutsider), '{"title":"Renamed"}')['status']);
        $this->assertSame(404, $this->http('DELETE', 'task-lists/' . $sList, $aOutsider)['status']);
        $this->assertSame(204, $this->http('DELETE', 'task-lists/' . $sList, $aOwner)['status']);
        $this->assertSame(404, $this->http('GET', 'tasks/' . $aInList['id'], $aOwner)['status'], 'its tasks went with it');
        $this->assertSame(200, $this->http('GET', 'tasks/' . $aSecret['id'], $aOwner)['status'], 'the Inbox\'s stayed');
        $this->assertSame(404, $this->http('DELETE', 'task-lists/' . $sList, $aOwner)['status']);

        // deleting a task
        $this->assertSame(204, $this->http('DELETE', 'tasks/' . $aSecret['id'], $aOwner)['status']);
        $this->assertSame(404, $this->http('GET', 'tasks/' . $aSecret['id'], $aOwner)['status']);
    }

    public function testTitlesAreCheckedBeforeAnythingChanges(): void
    {
        list($iGroup, $iOwner) = $this->groupWithMember();
        $aOwner = $this->json($this->auth($iOwner));
        $aTask = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest checked']);
        $sId = $aTask['id'];

        // the form's own check of the title (3 to 160 once trimmed) refuses it before the
        // completion is written: not completed, nothing logged
        $a = $this->http('PATCH', 'tasks/' . $sId, $aOwner, json_encode(['completed' => true, 'title' => '   ab   ']));
        $this->assertSame(['title', 422], $this->problemField($a), $a['body']);
        $a = $this->http('GET', 'tasks/' . $sId, $aOwner);
        $this->assertSame([false, 'ApiV2TasksTest checked'], [$a['json']['completed'], $a['json']['title']]);
        if (($sItem = $a['json']['content_id'])) {
            $b = $this->http('GET', 'content/' . $sItem . '/comments?limit=50', $aOwner);
            $this->assertSame([], $b['json']['items'] ?? null, 'no change was logged: ' . $b['body']);
        }

        // the schema has the form's limits
        $this->assertSame(['title', 422], $this->problemField($this->http('PATCH', 'tasks/' . $sId, $aOwner, json_encode(['completed' => true, 'title' => 'Go']))));
        $this->assertSame(['title', 422], $this->problemField($this->http('POST', 'tasks', $aOwner, json_encode(['context_id' => (string)$iGroup, 'title' => str_repeat('a', 161)]))));
        $this->assertSame(['title', 422], $this->problemField($this->http('POST', 'task-lists', $aOwner, json_encode(['context_id' => (string)$iGroup, 'title' => 'ab']))));
        $this->assertFalse($this->http('GET', 'tasks/' . $sId, $aOwner)['json']['completed']);

        // completed and renamed in one go; the logged change is a line of activity with no author or actions
        $a = $this->http('PATCH', 'tasks/' . $sId, $aOwner, json_encode(['completed' => true, 'title' => 'ApiV2TasksTest done and renamed']));
        $this->assertSame([200, true, 'ApiV2TasksTest done and renamed'], [$a['status'], $a['json']['completed'] ?? null, $a['json']['title'] ?? null], $a['body']);
        if (($sItem = $a['json']['content_id'])) {
            $b = $this->http('GET', 'content/' . $sItem . '/comments?limit=50', $aOwner);
            $aLogged = array_values(array_filter($b['json']['items'], fn($c) => !empty($c['automated'])));
            $this->assertNotEmpty($aLogged, $b['body']);
            foreach ($aLogged as $aCmt) {
                $this->assertSchema('Comment', $aCmt);
                $this->assertNull($aCmt['author']);
                $this->assertSame([false, false, false, false], [$aCmt['viewer']['can_react'], $aCmt['viewer']['can_comment'], $aCmt['viewer']['can_edit'], $aCmt['viewer']['can_delete']]);
            }
        }
    }

    public function testCompletingTellsTheAssigneesAndTheAuthor(): void
    {
        $this->requireModule('bx_notifications');
        list($iGroup, $iOwner, $iMember) = $this->groupWithMember();
        $aTask = $this->makeTask($this->auth($iOwner), $iGroup, ['title' => 'ApiV2TasksTest told', 'assignee_ids' => [(string)$iMember]]);

        $a = $this->http('PATCH', 'tasks/' . $aTask['id'], $this->json($this->auth($iMember)), '{"completed":true}');
        $this->assertSame(200, $a['status'], $a['body']);

        // the module's completed alert, once for the author and once for each other assignee
        // (an assignment's initiator is the profile, its content the task)
        $aOwners = array_map('intval', BxDolDb::getInstance()->getColumn("SELECT `object_owner_id` FROM `bx_notifications_events` WHERE `type` = 'bx_tasks' AND `action` = 'completed' AND `object_id` = :id", ['id' => (int)$aTask['id']]));
        $this->assertEqualsCanonicalizing([$iOwner, $iMember], $aOwners);
    }

    public function testAssigneeAndAuthorListsKeepClosedAndSecretTasksOut(): void
    {
        list($iClosed, $iOwner, $iMember, $iOutsider) = $this->groupWithMember('c');
        list($iSecret) = $this->groupWithMember('s', $iOwner, false);
        $aOwner = $this->auth($iOwner);
        $aClosed = $this->makeTask($aOwner, $iClosed, ['title' => 'ApiV2TasksTest closed, the member\'s', 'assignee_ids' => [(string)$iMember]]);
        $aSecret = $this->makeTask($aOwner, $iSecret, ['title' => 'ApiV2TasksTest secret, the owner\'s']);
        $aHidden = [$aClosed['id'], $aSecret['id']];

        foreach (['an outsider' => $this->auth($iOutsider), 'a guest' => []] as $sWho => $aHeaders) {
            foreach (['assignee=' . $iMember, 'assignee=' . $iOwner, 'author=' . $iOwner] as $sFilter) {
                $aIds = $this->allPages('tasks?' . $sFilter, $aHeaders, $sWho);
                $this->assertSame([], array_values(array_intersect($aIds, $aHidden)), $sWho . ', ' . $sFilter);
            }
        }

        // the member sees the closed group's, not the secret one's; the owner both
        $aMember = $this->auth($iMember);
        $this->assertContains($aClosed['id'], $this->allPages('tasks?assignee=' . $iMember, $aMember, 'the member'));
        $aIds = $this->allPages('tasks?author=' . $iOwner, $aMember, 'the member');
        $this->assertContains($aClosed['id'], $aIds);
        $this->assertNotContains($aSecret['id'], $aIds);
        $aIds = $this->allPages('tasks?author=' . $iOwner, $aOwner, 'the owner');
        $this->assertEqualsCanonicalizing($aHidden, array_values(array_intersect($aIds, $aHidden)));
    }

    /*
     * Helpers
     */

    /**
     * Every id of a list, a page of one at a time: each page but an empty list's has its item,
     * so a short page with a next_cursor (a task the viewer may not see holding a place) fails.
     */
    public function testChoicesTheContextsOwnTypesAndLabels(): void
    {
        list($iGroup, $iOwner, $iMember) = $this->groupWithMember();
        $aMember = $this->auth($iMember);

        // the site's pre-lists, in their order; estimates with their points
        $a = $this->http('GET', 'tasks/choices', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskChoices', $a['json']);
        $this->assertNull($a['json']['context_id']);
        foreach (['types', 'priorities', 'estimates', 'states', 'labels'] as $sKind)
            $this->assertNotEmpty($a['json'][$sKind], $sKind);
        foreach ($a['json']['estimates'] as $aEstimate)
            $this->assertSame((int)$aEstimate['id'], $aEstimate['points']);

        // a context's own: its active types replace the site's, its labels with their colours (CSS only)
        $oDb = BxDolDb::getInstance();
        // a value is one of its list for the whole site (the key is list and value): two that no context has yet
        $fnFree = function (string $sList) use ($oDb): array {
            $iMax = (int)$oDb->getOne("SELECT MAX(CAST(`value` AS UNSIGNED)) FROM `bx_tasks_pre_values` WHERE `list` = :l", ['l' => $sList]);
            return [(string)($iMax + 1), (string)($iMax + 2), (string)($iMax + 9)];
        };
        list($sType, $sTypeGone) = $fnFree('type');
        list($sLabel, $sLabelUi, $sLabelNone) = $fnFree('sticker');
        foreach ([['type', $sType, 'ApiV2 Epic', '', 1], ['type', $sTypeGone, 'ApiV2 Gone', '', 0], ['sticker', $sLabel, 'ApiV2 Blocked', '#d97706', 1], ['sticker', $sLabelUi, 'ApiV2 Ui', 'url(javascript:x)', 1]] as $i => list($sList, $sValue, $sTitle, $sColor, $iActive))
            $oDb->query("INSERT INTO `bx_tasks_pre_values` (`context_id`, `list`, `value`, `order`, `title`, `color`, `active`) VALUES (:c, :l, :v, :o, :t, :k, :a)", ['c' => $iGroup, 'l' => $sList, 'v' => $sValue, 'o' => $i, 't' => $sTitle, 'k' => $sColor, 'a' => $iActive]);
        $a = $this->http('GET', 'tasks/choices?context_id=' . $iGroup, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskChoices', $a['json']);
        $this->assertSame([['id' => $sType, 'title' => 'ApiV2 Epic']], $a['json']['types'], 'its active types only');
        $this->assertSame([[$sLabel, 'ApiV2 Blocked', '#d97706'], [$sLabelUi, 'ApiV2 Ui', null]], array_map(fn($l) => [$l['id'], $l['title'], $l['color']], $a['json']['labels']), 'a colour that is no CSS colour is none');
        $this->assertSame(422, $this->http('GET', 'tasks/choices?context_id=999999999', $aMember)['status']);

        // a task takes them: added with a type, an estimate, labels and a state; changed again
        $aOwner = $this->auth($iOwner);
        $sEstimate = $this->http('GET', 'tasks/choices', $aOwner)['json']['estimates'][0]['id'];
        $aTask = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest typed', 'type_id' => $sType, 'estimate_id' => $sEstimate, 'label_ids' => [$sLabel], 'assignee_ids' => [(string)$iMember]]);
        $this->assertSame([$sType, 'ApiV2 Epic', $sEstimate, [['id' => $sLabel, 'title' => 'ApiV2 Blocked', 'color' => '#d97706']], 0, null], [$aTask['type']['id'], $aTask['type']['title'], $aTask['estimate']['id'], $aTask['labels'], $aTask['time_spent'], $aTask['timer']]);
        $this->assertSame(['type_id', 422], $this->problemField($this->http('POST', 'tasks', $this->json($aOwner), json_encode(['context_id' => (string)$iGroup, 'title' => 'Something', 'type_id' => $sTypeGone]))), 'an inactive type of the context');

        $aJson = $this->json($aMember);
        $a = $this->http('PATCH', 'tasks/' . $aTask['id'], $aJson, json_encode(['label_ids' => [$sLabelUi, $sLabel], 'type_id' => null, 'estimate_id' => null]));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([[$sLabel, $sLabelUi], null, null], [array_column($a['json']['labels'], 'id'), $a['json']['type'], $a['json']['estimate']], 'an assignee changes them, as other properties');
        $this->assertSame(['label_ids[0]', 422], $this->problemField($this->http('PATCH', 'tasks/' . $aTask['id'], $aJson, json_encode(['label_ids' => [$sLabelNone]]))));
        $this->assertSame(['label_ids[1]', 422], $this->problemField($this->http('PATCH', 'tasks/' . $aTask['id'], $aJson, json_encode(['label_ids' => [$sLabel, $sLabel]]))));
        $a = $this->http('PATCH', 'tasks/' . $aTask['id'], $aJson, json_encode(['label_ids' => []]));
        $this->assertSame([200, []], [$a['status'], $a['json']['labels']], $a['body']);

        // the module logs the labels by their titles
        if (($sItem = $a['json']['content_id'])) {
            $aBodies = array_column($this->http('GET', 'content/' . $sItem . '/comments?limit=50', $aMember)['json']['items'], 'body_html');
            $this->assertNotEmpty(array_filter($aBodies, fn($s) => str_contains($s, 'ApiV2 Blocked, ApiV2 Ui')), json_encode($aBodies));
            $this->assertNotEmpty(array_filter($aBodies, fn($s) => str_contains($s, 'removed the labels')), json_encode($aBodies));
        }
    }

    public function testFiltersFacetsAndSavedFilters(): void
    {
        list($iGroup, $iOwner, $iMember, $iOutsider) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $aMember = $this->auth($iMember);
        $aChoices = $this->http('GET', 'tasks/choices', $aOwner)['json'];
        list($sP1, $sP2) = array_column($aChoices['priorities'], 'id');
        list($sL1, $sL2) = array_column($aChoices['labels'], 'id');
        // not Todo, a new task's state
        $sState = $aChoices['states'][2]['id'];
        $sList = $this->makeList($aOwner, $iGroup, 'ApiV2TasksTest board');

        $aA = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest a', 'priority_id' => $sP1, 'label_ids' => [$sL1, $sL2], 'assignee_ids' => [(string)$iMember], 'list_id' => $sList, 'due_at' => '2037-02-01T09:00:00Z']);
        $aB = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest b', 'priority_id' => $sP2, 'label_ids' => [$sL2], 'assignee_ids' => [(string)$iMember, (string)$iOwner], 'due_at' => '2037-01-01T09:00:00Z']);
        $aC = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest c', 'assignee_ids' => [], 'state_id' => $sState]);
        $this->assertSame($sState, $aC['state']['id']);
        $this->assertSame(200, $this->http('PATCH', 'tasks/' . $aB['id'], $this->json($aOwner), '{"completed":true}')['status']);

        $fIds = function (string $sQuery) use ($aMember, $iGroup) {
            $a = $this->http('GET', 'tasks?context_id=' . $iGroup . $sQuery, $aMember);
            $this->assertSame(200, $a['status'], $sQuery . ': ' . $a['body']);
            return array_column($a['json']['items'], 'id');
        };
        $this->assertSame([$aA['id'], $aB['id']], $fIds('&label_id=' . $sL2), 'any of the labels; open first');
        $this->assertSame([$aA['id']], $fIds('&label_id=' . $sL1 . '&priority_id=' . $sP1 . ',' . $sP2));
        $this->assertSame([$aB['id']], $fIds('&priority_id=' . $sP2));
        $this->assertSame([$aC['id']], $fIds('&state_id=' . $sState));
        $this->assertSame([$aA['id'], $aB['id']], $fIds('&assignee=' . $iMember . ',' . $iOwner), 'any of the assignees, each once');
        $this->assertSame([$aA['id']], $fIds('&list_id=' . $sList));
        $this->assertSame([$aC['id'], $aB['id']], $fIds('&list_id=inbox'));
        $this->assertSame([$aA['id'], $aC['id'], $aB['id']], $fIds('&sort=priority'), 'the most urgent first, none last; open first');
        $this->assertSame([$aC['id'], $aA['id'], $aB['id']], $fIds('&sort=created'), 'the newest first; open first');
        $this->assertSame(422, $this->http('GET', 'tasks?context_id=' . $iGroup . '&label_id=x', $aMember)['status']);
        $this->assertSame(422, $this->http('GET', 'tasks?context_id=' . $iGroup . '&sort=title', $aMember)['status']);
        $this->assertSame(422, $this->http('GET', 'tasks?priority_id=' . $sP1, $aMember)['status'], 'a filter across contexts needs an assignee or an author');

        // the counts of the same tasks: open and completed, by each property
        $a = $this->http('GET', 'tasks/facets?context_id=' . $iGroup, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskFacets', $a['json']);
        $this->assertSame([3, 2, 1], [$a['json']['total'], $a['json']['open'], $a['json']['completed']]);
        $aLabels = array_column($a['json']['labels'], null, 'id');
        $this->assertSame([2, 1], [$aLabels[$sL2]['count'], $aLabels[$sL2]['open']], 'a task under each of its labels');
        $this->assertSame([[null, 2], [$sList, 1]], array_map(fn($l) => [$l['id'], $l['count']], array_values(array_filter($a['json']['lists'], fn($l) => $l['context_id'] === (string)$iGroup))), 'the Inbox first');
        $aAssignees = array_column($a['json']['assignees'], 'count', 'id');
        $this->assertSame([2, 1], [$aAssignees[(string)$iMember] ?? 0, $aAssignees[(string)$iOwner] ?? 0]);
        $this->assertSame(1, array_column($a['json']['priorities'], 'count', 'id')[$sP1] ?? 0);
        $a = $this->http('GET', 'tasks/facets?context_id=' . $iGroup . '&label_id=' . $sL1, $aMember);
        $this->assertSame([1, 1], [$a['json']['total'], $a['json']['open']], 'with the filters of the list');
        $this->assertSame(422, $this->http('GET', 'tasks/facets', $aMember)['status']);
        $a = $this->http('GET', 'me/tasks/facets', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame(1, array_column($a['json']['contexts'], 'open', 'id')[(string)$iGroup] ?? 0, 'one\'s own open ones in the group');

        // the site's saved filters: offered, applied, and none other
        $a = $this->http('GET', 'task-filters?context_id=' . $iGroup, $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskFilters', $a['json']);
        $aSystem = array_values(array_filter($a['json']['items'], fn($f) => $f['kind'] === 'system'));
        if (!$aSystem)
            $this->markTestSkipped('The site has no saved task filters');
        // "Assigned to current user and uncompleted", as the site installs it
        $aRow = BxDolDb::getInstance()->getRow("SELECT `id` FROM `bx_tasks_filters` WHERE `title` = '_bx_tasks_filter_title_by_assignee_uncompleted' AND `context_id` = 0 AND `author` = 0");
        if ($aRow) {
            $this->assertSame([$aA['id']], $fIds('&filter_id=' . $aRow['id']), 'the member\'s open ones');
            $aMine = array_column($this->http('GET', 'me/tasks?filter_id=' . $aRow['id'] . '&state=all', $aMember)['json']['items'], 'id');
            $this->assertContains($aA['id'], $aMine);
            $this->assertNotContains($aB['id'], $aMine, 'completed');
        }
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_tasks_filters` (`context_id`, `author`, `title`, `conditions`, `active`, `permanent`, `added`) VALUES (:c, :a, 'ApiV2TasksTest mine', '{}', 1, 1, UNIX_TIMESTAMP())", ['c' => $iGroup, 'a' => $iOwner]);
        $iOwners = (int)$oDb->lastId();
        try {
            $this->assertSame([], array_values(array_filter($this->http('GET', 'task-filters?context_id=' . $iGroup, $aMember)['json']['items'], fn($f) => $f['id'] === (string)$iOwners)), 'someone else\'s is not offered');
            $this->assertSame(['filter_id', 422], $this->problemField($this->http('GET', 'tasks?context_id=' . $iGroup . '&filter_id=' . $iOwners, $aMember)));
            $this->assertSame(['mine'], array_column(array_values(array_filter($this->http('GET', 'task-filters?context_id=' . $iGroup, $aOwner)['json']['items'], fn($f) => $f['id'] === (string)$iOwners)), 'kind'));
        }
        finally {
            $oDb->query("DELETE FROM `bx_tasks_filters` WHERE `id` = :id", ['id' => $iOwners]);
        }
        $this->assertSame([], $this->http('GET', 'task-filters')['json']['items'], 'a guest has none');
    }

    public function testMyTaskContextsWithTheirLists(): void
    {
        list($iGroup, $iOwner, $iMember) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $sList = $this->makeList($aOwner, $iGroup, 'ApiV2TasksTest planning');
        $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest planned', 'list_id' => $sList, 'assignee_ids' => [(string)$iMember]]);
        $aDone = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest inbox', 'assignee_ids' => []]);
        $this->assertSame(200, $this->http('PATCH', 'tasks/' . $aDone['id'], $this->json($aOwner), '{"completed":true}')['status']);

        $a = $this->http('GET', 'me/task-contexts', $this->auth($iMember));
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskContexts', $a['json']);
        $aMine = array_values(array_filter($a['json']['items'], fn($c) => $c['context']['id'] === (string)$iGroup));
        $this->assertCount(1, $aMine, 'a context one has a task assigned in');
        $this->assertSame(['bx_groups', 2, 1], [$aMine[0]['module'], $aMine[0]['task_count'], $aMine[0]['open_count']]);
        $this->assertSame([[null, 1, 0], [$sList, 1, 1]], array_map(fn($l) => [$l['id'], $l['task_count'], $l['open_count']], $aMine[0]['lists']), 'the Inbox first');
        $this->assertNotEmpty($aMine[0]['module_title']);
        $this->assertSame(401, $this->http('GET', 'me/task-contexts')['status']);
        $this->assertSame([], array_values(array_filter($this->http('GET', 'me/task-contexts', $this->auth($this->ordinaryProfileIdOtherThan([$iOwner, $iMember])))['json']['items'] ?? [], fn($c) => $c['context']['id'] === (string)$iGroup)), 'nobody else\'s');
    }

    public function testTimersAndLoggedTime(): void
    {
        list($iGroup, $iOwner, $iMember, $iOutsider) = $this->groupWithMember();
        $aOwner = $this->auth($iOwner);
        $aMember = $this->json($this->auth($iMember));
        $aTask = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest timed', 'assignee_ids' => [(string)$iMember]]);
        $aOther = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest timed too', 'assignee_ids' => [(string)$iMember]]);
        $this->assertTrue($aTask['viewer']['can_track_time'] || !$this->http('GET', 'tasks/' . $aTask['id'], $aMember)['json']['viewer']['can_track_time']);
        if (!$this->http('GET', 'tasks/' . $aTask['id'], $aMember)['json']['viewer']['can_track_time'])
            $this->markTestSkipped('Members may not log time here');

        // a timer: started, then another one started pauses it; paused, resumed, cleared
        $a = $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"start"}');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Task', $a['json']);
        $this->assertSame('running', $a['json']['timer']['state']);
        $a = $this->http('POST', 'tasks/' . $aOther['id'] . '/timer', $aMember, '{"action":"start"}');
        $this->assertSame('running', $a['json']['timer']['state']);
        $a = $this->http('GET', 'me/timers', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskTimers', $a['json']);
        $this->assertSame([[$aOther['id'], 'running'], [$aTask['id'], 'paused']], array_map(fn($t) => [$t['id'], $t['timer']['state']], $a['json']['items']), 'the running one first; one runs at a time');
        $this->assertSame('running', $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"resume"}')['json']['timer']['state']);
        $this->assertSame('paused', $this->http('GET', 'tasks/' . $aOther['id'], $aMember)['json']['timer']['state']);
        $this->assertSame('paused', $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"pause"}')['json']['timer']['state']);
        $this->assertSame(409, $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"pause"}')['status'], 'none running');
        $a = $this->http('POST', 'tasks/' . $aOther['id'] . '/timer', $aMember, '{"action":"clear"}');
        $this->assertSame([200, null], [$a['status'], $a['json']['timer']], $a['body']);

        // a timer with time on it logs it, rounded up to the minute, and goes
        BxDolDb::getInstance()->query("UPDATE `bx_tasks_timers` SET `started` = 0, `duration` = 125 WHERE `content_id` = :c AND `profile_id` = :p", ['c' => (int)$aTask['id'], 'p' => $iMember]);
        $a = $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"log"}');
        $this->assertSame([200, null, 180], [$a['status'], $a['json']['timer'], $a['json']['time_spent']], $a['body']);
        $this->assertSame(409, $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"log"}')['status'], 'nothing to log');
        $this->assertSame(422, $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aMember, '{"action":"stop"}')['status']);

        // logging time: through the time form, its day and note; checked first
        $a = $this->http('POST', 'tasks/' . $aTask['id'] . '/time', $aMember, json_encode(['minutes' => 95, 'date' => '2037-01-02', 'text' => 'Layout <b>draft</b>']));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('TimeRecord', $a['json']);
        $this->assertSame([5700, '2037-01-02', (string)$iMember], [$a['json']['seconds'], $a['json']['date'], $a['json']['author']['id']]);
        $this->assertStringNotContainsString('<b>', (string)$a['json']['text']);
        foreach ([['minutes' => 0], ['minutes' => '60'], ['minutes' => 30, 'date' => '2037-02-30'], ['minutes' => 30, 'date' => 'tomorrow']] as $aBody)
            $this->assertSame(422, $this->http('POST', 'tasks/' . $aTask['id'] . '/time', $aMember, json_encode($aBody))['status'], json_encode($aBody));
        $a = $this->http('GET', 'tasks/' . $aTask['id'] . '/time', $aMember);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskTime', $a['json']);
        $this->assertSame([180 + 5700, 180 + 5700, true], [$a['json']['total_seconds'], $a['json']['viewer_seconds'], $a['json']['can_add']]);
        $this->assertSame(180 + 5700, $this->http('GET', 'tasks/' . $aTask['id'], $aMember)['json']['time_spent']);
        // another member sees the total, and their own records only (unless the site lets them see reports)
        $a = $this->http('GET', 'tasks/' . $aTask['id'] . '/time', $aOwner);
        $this->assertSame(180 + 5700, $a['json']['total_seconds']);
        $this->assertSame($a['json']['all'] ? 2 : 0, count($a['json']['items']));

        // who does not manage the task: no timer, no time; a guest: 401
        $aOut = $this->json($this->auth($iOutsider));
        $this->assertSame(403, $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', $aOut, '{"action":"start"}')['status']);
        $this->assertSame(403, $this->http('POST', 'tasks/' . $aTask['id'] . '/time', $aOut, '{"minutes":5}')['status']);
        $this->assertSame(401, $this->http('POST', 'tasks/' . $aTask['id'] . '/timer', ['Content-Type' => 'application/json'], '{"action":"start"}')['status']);
        $this->assertSame(401, $this->http('GET', 'me/timers')['status']);
        // a task with time logged on it is not deleted, as on the site
        $this->assertFalse($this->http('GET', 'tasks/' . $aTask['id'], $aOwner)['json']['viewer']['can_delete']);
    }

    public function testBudgetOfAContextAndItsEntries(): void
    {
        list($iGroup, $iOwner, $iMember, $iOutsider) = $this->groupWithMember();
        $aOwner = $this->json($this->auth($iOwner));
        $sBudget = 'task-contexts/' . $iGroup . '/budget';
        $fBudget = function () use ($aOwner, $sBudget) {
            $a = $this->http('GET', $sBudget, $aOwner);
            $this->assertSame(200, $a['status'], $a['body']);
            $this->assertSchema('TaskBudget', $a['json']);
            return [$a['json']['total_seconds'], $a['json']['spent_seconds'], $a['json']['remaining_seconds'], $a['json']['remaining_percent']];
        };

        // none yet: a budget of nothing, which its administrator (the group's owner) may add to
        $a = $this->http('GET', $sBudget, $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSame([(string)$iGroup, (string)$iGroup, true], [$a['json']['context_id'], $a['json']['context']['id'], $a['json']['can_add']]);
        $this->assertSame([0, 0, 0, null], $fBudget());

        // entries: whole hours, not 0, a plain text note, through the site's form
        foreach ([['hours' => 0], ['hours' => '5'], ['hours' => 1.5], ['note' => 'No hours'], ['hours' => 100001], ['hours' => 5, 'note' => str_repeat('x', 2001)]] as $aBody)
            $this->assertSame(422, $this->http('POST', $sBudget . '/entries', $aOwner, json_encode($aBody))['status'], json_encode($aBody));
        $aFirst = $this->addBudgetEntry($aOwner, $iGroup, ['hours' => 10, 'note' => 'Spring <b>season</b> & more']);
        $this->assertSame([10, 'Spring <b>season</b> & more', (string)$iOwner, (string)$iGroup, true, true], [$aFirst['hours'], $aFirst['note'], $aFirst['author']['id'], $aFirst['context_id'], $aFirst['can_edit'], $aFirst['can_delete']]);
        $aSecond = $this->addBudgetEntry($aOwner, $iGroup, ['hours' => 4]);
        $this->assertNull($aSecond['note']);
        $aCut = $this->addBudgetEntry($aOwner, $iGroup, ['hours' => -2, 'note' => 'Cut']);
        $this->assertSame([12 * 3600, 0, 12 * 3600, 100.0], $fBudget(), 'the total is what they add');

        // the newest first, a page at a time; the notes searched
        $a = $this->http('GET', $sBudget . '/entries', $aOwner);
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('Page_TaskBudgetEntry', $a['json']);
        $this->assertSame([$aCut['id'], $aSecond['id'], $aFirst['id']], array_column($a['json']['items'], 'id'));
        $a = $this->http('GET', $sBudget . '/entries?limit=2', $aOwner);
        $this->assertSame([$aCut['id'], $aSecond['id']], array_column($a['json']['items'], 'id'));
        $this->assertNotNull($a['json']['next_cursor']);
        $a = $this->http('GET', $sBudget . '/entries?limit=2&cursor=' . rawurlencode($a['json']['next_cursor']), $aOwner);
        $this->assertSame([[$aFirst['id']], null], [array_column($a['json']['items'], 'id'), $a['json']['next_cursor']]);
        $this->assertSame([$aFirst['id']], array_column($this->http('GET', $sBudget . '/entries?q=season', $aOwner)['json']['items'], 'id'));
        $this->assertSame([$aFirst['id']], array_column($this->http('GET', $sBudget . '/entries?q=' . rawurlencode('<b>season'), $aOwner)['json']['items'], 'id'), 'the note as it was written');
        $this->assertSame([], $this->http('GET', $sBudget . '/entries?q=' . rawurlencode('100%'), $aOwner)['json']['items']);
        $this->assertSame(422, $this->http('GET', $sBudget . '/entries?q=' . str_repeat('x', 101), $aOwner)['status']);

        // changing one changes the total by the difference; what is left out stays
        $a = $this->http('PATCH', 'task-budget-entries/' . $aFirst['id'], $aOwner, '{"hours":20}');
        $this->assertSame(200, $a['status'], $a['body']);
        $this->assertSchema('TaskBudgetEntry', $a['json']);
        $this->assertSame([20, 'Spring <b>season</b> & more'], [$a['json']['hours'], $a['json']['note']]);
        $this->assertSame(22 * 3600, $fBudget()[0]);
        $a = $this->http('PATCH', 'task-budget-entries/' . $aFirst['id'], $aOwner, '{"note":null}');
        $this->assertSame([200, 20, null], [$a['status'], $a['json']['hours'], $a['json']['note']], $a['body']);
        $this->assertSame(422, $this->http('PATCH', 'task-budget-entries/' . $aFirst['id'], $aOwner, '{"hours":0}')['status']);
        $this->assertSame(22 * 3600, $fBudget()[0], 'nothing changed by what was refused');

        // time logged on the context's tasks is spent from it
        $aTask = $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest budgeted']);
        if ($aTask['viewer']['can_track_time']) {
            $a = $this->http('POST', 'tasks/' . $aTask['id'] . '/time', $aOwner, '{"minutes":90}');
            $this->assertSame(201, $a['status'], $a['body']);
            $this->assertSame([22 * 3600, 5400, 22 * 3600 - 5400, round(100 * (22 * 3600 - 5400) / (22 * 3600), 2)], $fBudget());
        }

        // deleting one takes its hours off
        $this->assertSame(204, $this->http('DELETE', 'task-budget-entries/' . $aCut['id'], $aOwner)['status']);
        $this->assertSame(24 * 3600, $fBudget()[0]);
        $this->assertSame(404, $this->http('DELETE', 'task-budget-entries/' . $aCut['id'], $aOwner)['status']);
        $this->assertSame(404, $this->http('PATCH', 'task-budget-entries/999999999', $aOwner, '{"hours":1}')['status']);
        $this->assertSame(404, $this->http('GET', 'task-contexts/999999999/budget', $aOwner)['status']);

        // a member who does not administer the group, and someone outside it: not theirs to see;
        // a guest signs in first
        foreach ([$iMember => 'a member', $iOutsider => 'an outsider'] as $iWho => $sWho) {
            $aWho = $this->json($this->auth($iWho));
            $this->assertSame(403, $this->http('GET', $sBudget, $aWho)['status'], $sWho);
            $this->assertSame(403, $this->http('GET', $sBudget . '/entries', $aWho)['status'], $sWho);
            $this->assertSame(403, $this->http('POST', $sBudget . '/entries', $aWho, '{"hours":1}')['status'], $sWho);
            $this->assertSame(403, $this->http('PATCH', 'task-budget-entries/' . $aFirst['id'], $aWho, '{"hours":1}')['status'], $sWho);
            $this->assertSame(403, $this->http('DELETE', 'task-budget-entries/' . $aFirst['id'], $aWho)['status'], $sWho);
        }
        $this->assertSame(401, $this->http('GET', $sBudget)['status']);
        $this->assertSame(24 * 3600, $fBudget()[0], 'nothing changed by them');

        // the contexts one has tasks in say whose budget one may see
        $this->makeTask($aOwner, $iGroup, ['title' => 'ApiV2TasksTest for the member', 'assignee_ids' => [(string)$iMember]]);
        $fSees = function ($iWho) use ($iGroup) {
            $a = $this->http('GET', 'me/task-contexts', $this->auth($iWho));
            $this->assertSchema('TaskContexts', $a['json']);
            return array_values(array_map(fn($c) => $c['can_view_budget'], array_filter($a['json']['items'], fn($c) => $c['context']['id'] === (string)$iGroup)));
        };
        $this->assertSame([true], $fSees($iOwner));
        $this->assertSame([false], $fSees($iMember));

        // a secret group is not there for who is outside it
        list($iSecret) = $this->groupWithMember('s', $iOwner, false);
        $this->addBudgetEntry($aOwner, $iSecret, ['hours' => 3]);
        $this->assertSame(404, $this->http('GET', 'task-contexts/' . $iSecret . '/budget', $this->auth($iOutsider))['status']);
    }

    protected function addBudgetEntry(array $aAuth, int $iGroup, array $aBody): array
    {
        $a = $this->http('POST', 'task-contexts/' . $iGroup . '/budget/entries', $aAuth, json_encode($aBody));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('TaskBudgetEntry', $a['json']);
        return $a['json'];
    }

    protected function allPages(string $sPath, array $aHeaders, string $sWho): array
    {
        $aIds = [];
        $sNext = $sPath . '&limit=1';
        for ($i = 0; $i < 200 && $sNext !== ''; $i++) {
            $a = $this->http('GET', $sNext, $aHeaders);
            $this->assertSame(200, $a['status'], $sWho . ' ' . $sNext . ': ' . $a['body']);
            $this->assertSchema('Page_Task', $a['json']);
            if ($a['json']['next_cursor'] !== null || $i > 0)
                $this->assertCount(1, $a['json']['items'], $sWho . ' ' . $sNext . ': no page is short of what it could show');
            $aIds = array_merge($aIds, array_column($a['json']['items'], 'id'));
            $sNext = $a['json']['next_cursor'] !== null ? $sPath . '&limit=1&cursor=' . rawurlencode($a['json']['next_cursor']) : '';
        }
        return $aIds;
    }

    protected function auth(int $iProfile): array
    {
        return ['Authorization' => 'Bearer ' . $this->profileToken($iProfile)];
    }

    protected function json(array $aAuth): array
    {
        return $aAuth + ['Content-Type' => 'application/json'];
    }

    protected function problemField(array $a): array
    {
        return [$a['json']['errors'][0]['field'] ?? null, $a['status']];
    }

    protected function choices(array $aAuth, int $iGroup): array
    {
        return $this->http('GET', 'task-lists?context_id=' . $iGroup, $aAuth)['json'];
    }

    protected function makeList(array $aAuth, int $iGroup, string $sTitle): string
    {
        $a = $this->http('POST', 'task-lists', $this->json($aAuth), json_encode(['context_id' => (string)$iGroup, 'title' => $sTitle]));
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('TaskList', $a['json']);
        $this->_aLists[] = (int)$a['json']['id'];
        return $a['json']['id'];
    }

    protected function makeTask(array $aAuth, int $iGroup, array $aBody): array
    {
        $a = $this->http('POST', 'tasks', $this->json($aAuth), json_encode(['context_id' => (string)$iGroup] + $aBody));
        if ($a['status'] === 403)
            $this->markTestSkipped('Ordinary members may not add tasks here: ' . $a['body']);
        $this->assertSame(201, $a['status'], $a['body']);
        $this->assertSchema('Task', $a['json']);
        return $a['json'];
    }

    /**
     * A group of an ordinary owner, with another ordinary person who joined it, and a third one
     * outside it: [group, owner, member, outsider]; without $bMember nobody but its owner is in it.
     */
    protected function groupWithMember(string $sView = BX_DOL_PG_ALL, int $iOwner = 0, bool $bMember = true): array
    {
        $this->requireModule('bx_tasks');
        $this->requireModule('bx_groups');
        if (BxDolModule::getInstance('bx_tasks')->serviceCheckAllowedAddInContext('bx_groups') !== CHECK_ACTION_RESULT_ALLOWED)
            $this->markTestSkipped('Tasks may not go into groups here.');
        list($iViewer) = $this->userToken();
        $iOwner = $iOwner ?: $this->ordinaryProfileIdOtherThan([$iViewer]);
        $iMember = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner]);
        $iOutsider = $this->ordinaryProfileIdOtherThan([$iViewer, $iOwner, $iMember]);

        $aCats = BxDolForm::getDataItems('bx_groups_cats');
        $mBefore = $GLOBALS['glForceCurrentProfileId'] ?? null;
        $GLOBALS['glForceCurrentProfileId'] = $iOwner;
        try {
            $a = BxDolModule::getInstance('bx_groups')->serviceEntityAddForcedly($iOwner, [
                'group_name' => 'ApiV2TasksTest group ' . bin2hex(random_bytes(3)),
                'group_desc' => '<p>Made by ApiV2TasksTest</p>',
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
        $iGroup = (int)BxDolProfile::getInstanceByContentAndType((int)$a['content']['id'], 'bx_groups')->id();
        $this->_aProfiles[] = $iGroup;
        BxDolDb::getInstance()->cleanMemoryAll();

        if (!$bMember) {
        }
        elseif ($sView === BX_DOL_PG_ALL) {
            $b = $this->http('POST', 'groups/' . $iGroup . '/membership', $this->auth($iMember));
            $this->assertContains($b['status'], [200, 201], $b['body']);
        }
        else {
            // a closed or secret group lets its owner add members: the fans connection both ways
            $oFans = BxDolConnection::getObjectInstance('bx_groups_fans');
            $oFans->addConnection($iMember, $iGroup);
            $oFans->addConnection($iGroup, $iMember);
        }
        BxDolDb::getInstance()->cleanMemoryAll();
        return [$iGroup, $iOwner, $iMember, $iOutsider];
    }
}
