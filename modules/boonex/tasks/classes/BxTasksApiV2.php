<?php defined('BX_DOL') or die('hack attempt');
/**
 * Copyright (c) UNA, Inc - https://una.io
 * MIT License - https://opensource.org/licenses/MIT
 *
 * @defgroup    Tasks Tasks
 * @ingroup     UnaModules
 *
 * @{
 */

/**
 * API v2 endpoints of Tasks: the router finds this class only while the module is enabled.
 *
 * A task is an entry of the module in a context (a group, space, event ...): the context's
 * members see it as they see the context's content (its privacy is the context's negative
 * profile id). It is in one of the context's task lists, or in none: the site calls that its
 * Inbox (`list_id` null). Its comments and reactions are those of its Item (`content_id`), as
 * a discussion's are. Who is assigned to it is the module's assignments connection (initiator
 * the profile, content the task); a page reads them at once.
 *
 * Changes go through the module: a new task through its add form as its tasks view adds one
 * (insert with the list, then its onPublished: metas, the `added` alert, GitHub), a task's list,
 * priority, state, due date and assignees through its set_property service, completing through
 * its set_completed service (its alerts and the activity it logs as comments), the title and
 * text through its edit form's body display; each checks what the module checks there.
 *
 * A task has a type, a priority, an estimate (points: the site's task list shows a point as an
 * hour), a state and labels (the site's stickers, a set), from the site's pre-lists; a context
 * may have types and labels of its own (bx_tasks_pre_values, labels with colours), which its
 * tasks take then, as the site's forms offer them (GET /tasks/choices). Labels change through
 * the module's setStickers, which only API v2 calls: the site edits them in its edit form only
 * and its set_property service does not take them.
 *
 * Lists of tasks take the filters of the site's Tasks page (type, priority, estimate, state,
 * labels, assignees, lists), one of its saved filters (GET /task-filters, as its filter menu
 * offers them) and their counts by each of those (GET /tasks/facets), all from the same
 * conditions (BxTasksDb::getTasksFilterSql). Time is the module's: the viewer's timers (start,
 * pause, resume, clear, log, as BxTasksMenuTimer offers them, through process_timer), and the
 * time records of a task (BxTasksTime, the time form), whose sum is the task's `time` (minutes).
 */
class BxTasksApiV2 extends BxBaseModTextApiV2
{
    const API_TAG = 'tasks';
    const API_KIND = 'task';
    const API_NOUN = 'task';
    const API_NOUN_PLURAL = 'tasks';

    /** The most people one task is assigned to through the API. */
    const MAX_ASSIGNEES = 50;
    /** A task's or list's title, as the site's forms take it (their Length checks: 3 to 160). */
    const TITLE_MIN = 3;
    const TITLE_MAX = 160;

    /** A page's assignees (task id => profile ids) and lists (list id => row): _primeMedia. */
    protected $_aAssignees = [];
    protected $_aLists = [];
    /** Whether the viewer administers a context (context id => bool), once per request. */
    protected $_aContextAdmin = [];
    /** The site's priorities, states, types, estimates and stickers (value => title), once per request. */
    protected $_aChoices = [];
    /** The contexts' own types and stickers (context id => list => value => row): _primeMedia, _contextValues. */
    protected $_aContextValues = [];
    /** The viewer's timers on a page's tasks (task id => row): _primeMedia. */
    protected $_aTimers = [];
    /** Whether the viewer may log time (the time object's report check), once per request. */
    protected $_mTimeAllowed = null;

    /** The most values one filter of a list takes. */
    const MAX_FILTER_VALUES = 50;
    /** The most time records GET /tasks/{id}/time gives, and the most timers GET /me/timers. */
    const MAX_TIME_RECORDS = 200;
    const MAX_TIMERS = 100;
    /** The longest time one record logs: 1000 hours. */
    const MAX_TIME_MINUTES = 60000;
    /** A budget entry's hours either way, its note's length and the longest search of the notes. */
    const BUDGET_HOURS_MAX = 100000;
    const BUDGET_NOTE_MAX = 2000;
    const BUDGET_QUERY_MAX = 100;
    /** How a list may be ordered: open ones first in each. */
    const SORTS_TASKS = ['due', 'priority', 'created', 'updated'];
    /** A task's logged minutes: the trigger field of the time object (sys_objects_report bx_tasks_time). */
    const FIELD_TIME = 'time';

    public function __construct()
    {
        parent::__construct('bx_tasks');
        // not for the class BxDolForm, which is autoloaded: for what else its file defines and
        // the autoloader cannot find by name, BxDolFormCheckerHelper (the stickers set's helpers,
        // used by reads that make no form) and the BX_DOL_FORM_* constants
        bx_import('BxDolForm');
    }

    /*
     * Task lists
     */

    #[BxDolApiV2Operation(method: 'GET', path: '/task-lists', id: 'listTaskLists', tag: 'tasks',
        summary: 'The task lists of a context, its Inbox first',
        description: 'v2 only. A context\'s lists as its Tasks page on the site shows them: the Inbox (tasks in no list, `id` null) first, then its lists in the order they were made, each with how many active tasks it has and how many of those are open. Also the site\'s priorities and states a task may have, and whether the viewer may add lists. `context_id` is needed: 422 for one that is no context or that the viewer may not know of (a secret one from outside), 403 for one whose content the viewer may not see.',
        params: [
            'context_id' => ['in' => 'query', 'required' => true, 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A group\'s (or other context\'s) profile id'],
        ],
        responses: [200 => 'TaskLists', 403 => null, 422 => null])]
    public function listTaskLists(BxDolApiV2Request $oReq)
    {
        $iContextId = $this->_idParam($oReq, 'context_id');
        if (!$iContextId)
            throw BxDolApiV2Problem::validation([['field' => 'context_id', 'code' => 'required', 'message' => 'Send the context whose lists to show']]);
        $oContext = $this->_viewableContext($iContextId);
        $iViewerId = (int)$oReq->viewerId();

        $aCounts = $this->_oModule->_oDb->getListCounts($iContextId);
        $bAdd = $iViewerId && $this->_canAddIn($oContext);
        $bLists = $iViewerId && $this->_oModule->isAllowAdd($iContextId);
        $bManage = $iViewerId && $this->_contextAdmin($iContextId);

        $aLists = [$this->_taskList(['id' => 0, 'context_id' => $iContextId, 'title' => ''], $aCounts, $bAdd, false, false)];
        foreach ((array)$this->_oModule->_oDb->getLists($iContextId) as $aList)
            $aLists[] = $this->_taskList($aList, $aCounts, $bAdd, $bLists, $bManage);

        return [
            'context_id' => BxDolApiV2Map::id($iContextId),
            'items' => $aLists,
            'can_add_lists' => $bLists,
            'priorities' => $this->_choiceList('priorities'),
            'states' => $this->_choiceList('states'),
        ];
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/task-lists', id: 'createTaskList', tag: 'tasks', auth: 'required',
        summary: 'Add a task list to a context',
        description: 'v2 only, through the site\'s list form: who may post in the context may add lists there (403 otherwise; 422 for a context the viewer may not know of). `title` is needed (the form\'s checks apply: 422 with its message).',
        body: 'NewTaskList', responses: [201 => 'TaskList', 403 => null, 422 => null])]
    public function createTaskList(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $aBody = $oReq->body();
        $iContextId = (int)($aBody['context_id'] ?? 0);
        $this->_viewableContext($iContextId);
        if (!$this->_oModule->isAllowAdd($iContextId))
            throw BxDolApiV2Problem::forbidden('The viewer may not add task lists in this context');
        $sTitle = $this->_listTitle($aBody);

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = $this->_listForm($CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_ADD'], [], $sTitle);
        $iId = (int)$oForm->insert([$CNF['FIELD_LIST_CONTEXT_ID'] => $iContextId]);
        if (!$iId)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => 'The list was not added']], 'It was not added');

        $aList = $this->_oModule->_oDb->getList($iId);
        return BxDolApiV2Response::created($this->_taskList($aList, [], $this->_canAddIn(BxDolProfile::getInstance($iContextId)), true, $this->_contextAdmin($iContextId)), '/task-lists?context_id=' . $iContextId);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/task-lists/{id}', id: 'updateTaskList', tag: 'tasks', auth: 'required',
        summary: 'Rename a task list',
        description: 'v2 only, through the site\'s list form: who may post in the list\'s context may rename it (403 otherwise). 404 for no such list, or one in a context the viewer may not know of.',
        body: 'TaskListChanges', responses: [200 => 'TaskList', 403 => null, 404 => null, 422 => null])]
    public function updateTaskList(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($aList, $iContextId) = $this->_existingList($oReq->id());
        if (!$this->_oModule->isAllowAdd($iContextId))
            throw BxDolApiV2Problem::forbidden('The viewer may not change task lists in this context');
        $sTitle = $this->_listTitle($oReq->body());

        $CNF = &$this->_oModule->_oConfig->CNF;
        if ($sTitle !== (string)$aList[$CNF['FIELD_LIST_TITLE']]) {
            $oForm = $this->_listForm($CNF['OBJECT_FORM_LIST_ENTRY_DISPLAY_EDIT'], $aList, $sTitle);
            if (!$oForm->update((int)$aList[$CNF['FIELD_LIST_ID']]))
                throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'rejected', 'message' => 'The list was not changed']], 'It was not saved');
            $aList = $this->_oModule->_oDb->getList((int)$aList[$CNF['FIELD_LIST_ID']]);
        }

        return $this->_taskList($aList, $this->_oModule->_oDb->getListCounts($iContextId), $this->_canAddIn(BxDolProfile::getInstance($iContextId)), true, $this->_contextAdmin($iContextId));
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/task-lists/{id}', id: 'deleteTaskList', tag: 'tasks', auth: 'required',
        summary: 'Delete a task list and its tasks',
        description: 'v2 only: the context\'s administrators may delete its lists (403 otherwise), when they may delete every task in it (403 before anything changes for one they may not, such as one with time tracked). Each task goes through the module\'s delete, its comments, files and feed activity with it, and counts in the membership level\'s delete limit, then the list. A 409 (the module did not delete one) can leave the tasks before it deleted and the list with the rest. v2 differs: the site\'s own delete removes the tasks\' rows only.',
        responses: [204 => null, 403 => null, 404 => null, 409 => null])]
    public function deleteTaskList(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($aList, $iContextId) = $this->_existingList($oReq->id());
        if (!$this->_contextAdmin($iContextId))
            throw BxDolApiV2Problem::forbidden('Only the context\'s administrators may delete its task lists');

        $CNF = &$this->_oModule->_oConfig->CNF;
        $iListId = (int)$aList[$CNF['FIELD_LIST_ID']];
        $aTasks = (array)$this->_oModule->_oDb->getTasks($iContextId, $iListId);
        foreach ($aTasks as $aTask)
            if ($this->_oModule->checkAllowedDelete($aTask) !== CHECK_ACTION_RESULT_ALLOWED)
                throw BxDolApiV2Problem::forbidden('The viewer may not delete the task "' . BxDolApiV2Map::text($aTask[$CNF['FIELD_TITLE']]) . '" in this list');
        foreach ($aTasks as $aTask) {
            if (($sError = $this->_oModule->serviceDeleteEntity((int)$aTask[$CNF['FIELD_ID']])))
                throw new BxDolApiV2Problem(409, 'not_deleted', BxDolApiV2Map::text($sError));
            // the ACL counter, as a single delete counts it
            $this->_oModule->checkAllowedDelete($aTask, true);
        }
        if (!$this->_oModule->serviceDeleteTaskList($iContextId, $iListId))
            throw new BxDolApiV2Problem(409, 'not_deleted', 'The list was not deleted');
        return BxDolApiV2Response::noContent();
    }

    /*
     * Tasks
     */

    #[BxDolApiV2Operation(method: 'GET', path: '/tasks', id: 'listTasks', tag: 'tasks', paged: true,
        summary: 'Tasks the viewer may see: open ones first, then by due date',
        description: 'v2 only. Active tasks with the module\'s privacy, open ones first, then those due soonest (tasks without a due date after them), then the first added (`sort`: `priority` the most urgent first, `created` the newest first, `updated` the latest changed first; open ones first in each). `context_id` keeps a context\'s tasks (422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see), `list_id` some of its lists (comma-separated; `inbox` its tasks in no list; with `context_id` only). `assignee` keeps the tasks assigned to any of these profiles (comma-separated; `me`: the viewer), `author` those a profile added, `state` `open` or `completed` ones (`all` by default). `type_id`, `priority_id`, `estimate_id`, `state_id` and `label_id` keep those with any of these values (comma-separated: GET /tasks/choices), as the filters of the site\'s Tasks page do, and `filter_id` those one of its saved filters keeps (GET /task-filters). Without `context_id`, `assignee` or `author` is needed for those filters, and the tasks are only those in contexts whose content the viewer may see (and, outside any, the public ones, all of them for their author), so a page and its `next_cursor` say nothing of others. Cursors are offsets in this order: completing or adding a task moves the rest, so a client that changed tasks loads the list again from its first page. GET /tasks/facets counts the same tasks.',
        params: [
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A group\'s (or other context\'s) profile id'],
            'list_id' => ['in' => 'query', 'schema' => ['type' => 'string', 'pattern' => '^([1-9][0-9]{0,18}|inbox)(,([1-9][0-9]{0,18}|inbox)){0,49}$'], 'description' => 'Lists of the context, `inbox` for its tasks in no list'],
            'assignee' => ['in' => 'query', 'schema' => ['type' => 'string', 'pattern' => '^([1-9][0-9]{0,18}|me)(,([1-9][0-9]{0,18}|me)){0,49}$'], 'description' => 'Profile ids, `me` for the viewer'],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A profile id'],
            'state' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['open', 'completed', 'all'], 'default' => 'all']],
            'type_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'priority_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'estimate_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'state_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'label_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'filter_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id'], 'description' => 'A saved filter (GET /task-filters)'],
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => self::SORTS_TASKS, 'default' => 'due']],
        ],
        responses: [200 => 'Page_Task', 403 => null, 422 => null])]
    public function listTasks(BxDolApiV2Request $oReq)
    {
        list($iContextId, $aFilter, $aAssignees, $iAuthor) = $this->_listParams($oReq);
        return $this->_tasksPage($oReq, $iContextId, $aFilter, $aAssignees, $iAuthor, $this->_sortParam($oReq));
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/tasks/facets', id: 'getTaskFacets', tag: 'tasks',
        summary: 'How many tasks of a list there are by state, priority, type, estimate, label, list, context and assignee',
        description: 'v2 only. The tasks GET /tasks lists for the same filters (`state` aside: `open` and `completed` count both), counted by each of their properties, and how many of those are open: the counts of a list\'s groups and of its filters. A value of none (no priority, the Inbox) is `id` null; a task with several labels or assignees counts under each. Without `context_id`, `assignee` or `author` is needed (422). In a few queries, whatever the number of tasks.',
        params: [
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
            'list_id' => ['in' => 'query', 'schema' => ['type' => 'string', 'pattern' => '^([1-9][0-9]{0,18}|inbox)(,([1-9][0-9]{0,18}|inbox)){0,49}$']],
            'assignee' => ['in' => 'query', 'schema' => ['type' => 'string', 'pattern' => '^([1-9][0-9]{0,18}|me)(,([1-9][0-9]{0,18}|me)){0,49}$']],
            'author' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
            'type_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'priority_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'estimate_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'state_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'label_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'filter_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
        ],
        responses: [200 => 'TaskFacets', 403 => null, 422 => null])]
    public function getTaskFacets(BxDolApiV2Request $oReq)
    {
        list($iContextId, $aFilter, $aAssignees, $iAuthor) = $this->_listParams($oReq, true);
        return $this->_facets($iContextId, $aFilter, $aAssignees, $iAuthor);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/tasks', id: 'listMyTasks', tag: 'tasks', auth: 'required', paged: true,
        summary: 'Tasks assigned to the acting profile (or added by it), those due soonest first',
        description: 'v2 only: what GET /tasks?assignee=me gives (`role` `created`: GET /tasks?author= the viewer), open ones by default (`state`), those due soonest first (overdue ones first of all), tasks without a due date after them, then the first added (`sort` as GET /tasks). It takes the filters of GET /tasks but `context_id`, `list_id`, `assignee` and `author`. Tasks in contexts the profile has left stay listed while it may see them.',
        params: [
            'role' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['assigned', 'created'], 'default' => 'assigned']],
            'state' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['open', 'completed', 'all'], 'default' => 'open']],
            'type_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'priority_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'estimate_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'state_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'label_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'filter_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
            'sort' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => self::SORTS_TASKS, 'default' => 'due']],
        ],
        responses: [200 => 'Page_Task', 422 => null])]
    public function listMyTasks(BxDolApiV2Request $oReq)
    {
        list($aFilter, $aAssignees, $iAuthor) = $this->_myParams($oReq, false);
        return $this->_tasksPage($oReq, 0, $aFilter, $aAssignees, $iAuthor, $this->_sortParam($oReq));
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/tasks/facets', id: 'getMyTaskFacets', tag: 'tasks', auth: 'required',
        summary: 'How many of one\'s tasks there are by state, priority, type, estimate, label, list, context and assignee',
        description: 'v2 only: GET /tasks/facets of the tasks GET /me/tasks lists for the same `role` and filters.',
        params: [
            'role' => ['in' => 'query', 'schema' => ['type' => 'string', 'enum' => ['assigned', 'created'], 'default' => 'assigned']],
            'type_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'priority_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'estimate_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'state_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'label_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/TaskIdList']],
            'filter_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
        ],
        responses: [200 => 'TaskFacets', 422 => null])]
    public function getMyTaskFacets(BxDolApiV2Request $oReq)
    {
        list($aFilter, $aAssignees, $iAuthor) = $this->_myParams($oReq, true);
        return $this->_facets(0, $aFilter, $aAssignees, $iAuthor);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/tasks/choices', id: 'getTaskChoices', tag: 'tasks',
        summary: 'The types, priorities, estimates, states and labels a task may have',
        description: 'v2 only. The site\'s pre-lists in their order, in the viewer\'s language, as its task form offers them; with `context_id`, that context\'s own types (the active ones) and labels (with their colours) where it has them, as the form offers them there (422 for one that is no context or that the viewer may not know of, 403 for one whose content the viewer may not see). Estimates are points (`points`; the site\'s task list shows a point as an hour); a state that is `done` completes its task.',
        params: [
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
        ],
        responses: [200 => 'TaskChoices', 403 => null, 422 => null])]
    public function getTaskChoices(BxDolApiV2Request $oReq)
    {
        $iContextId = $this->_idParam($oReq, 'context_id');
        if ($iContextId) {
            $this->_viewableContext($iContextId);
            $this->_primeContextValues([$iContextId]);
        }
        $aLabels = [];
        foreach ($this->_labelChoices($iContextId) as $sId => $a)
            $aLabels[] = ['id' => (string)$sId] + $a;
        $aTypes = [];
        foreach ($this->_typeChoices($iContextId) as $sId => $sTitle)
            $aTypes[] = ['id' => (string)$sId, 'title' => $sTitle];
        $aEstimates = [];
        foreach ($this->_choices('estimates') as $sId => $sTitle)
            $aEstimates[] = ['id' => (string)$sId, 'title' => $sTitle, 'points' => (int)$sId];
        return [
            'context_id' => BxDolApiV2Map::idOrNull($iContextId),
            'types' => $aTypes,
            'priorities' => $this->_choiceList('priorities'),
            'estimates' => $aEstimates,
            'states' => $this->_choiceList('states'),
            'labels' => $aLabels,
        ];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/task-filters', id: 'listTaskFilters', tag: 'tasks',
        summary: 'The saved filters of the site\'s Tasks page',
        description: 'v2 only. The filters its filter menu offers, in its order: the site\'s (`system`: owned by or assigned to the viewer, open or completed), a context\'s (`context`, with `context_id`: those its administrators saved for everyone) and the viewer\'s own saved ones there (`mine`). GET /tasks `filter_id` applies one. A guest gets none.',
        params: [
            'context_id' => ['in' => 'query', 'schema' => ['$ref' => '#/components/schemas/Id']],
        ],
        responses: [200 => 'TaskFilters', 403 => null, 422 => null])]
    public function listTaskFilters(BxDolApiV2Request $oReq)
    {
        $iContextId = $this->_idParam($oReq, 'context_id');
        if ($iContextId)
            $this->_viewableContext($iContextId);
        $aItems = [];
        foreach ($this->_savedFilters($iContextId, (int)$oReq->viewerId()) as $aFilter)
            $aItems[] = [
                'id' => BxDolApiV2Map::id((int)$aFilter['id']),
                'title' => BxDolApiV2Map::text(_t((string)$aFilter['title'])),
                'kind' => $aFilter['_kind'],
            ];
        return ['context_id' => BxDolApiV2Map::idOrNull($iContextId), 'items' => $aItems];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/task-contexts', id: 'listMyTaskContexts', tag: 'tasks', auth: 'required',
        summary: 'The contexts one has tasks in, with their lists and how many tasks each has',
        description: 'v2 only: as the site\'s Tasks page lists them under each kind of context (Groups, Spaces ...): those the acting profile added tasks in or has tasks assigned in, whose content it may see, by kind (`module`, `module_title`) and name. Each has its lists (the Inbox first, `id` null), each with how many active tasks it has and how many of those are open. In a few queries, whatever the number of contexts.',
        responses: [200 => 'TaskContexts'])]
    public function listMyTaskContexts(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $aIds = $this->_oModule->_oDb->getTaskContextIdsOfProfile($iViewerId);
        BxDolApiV2Targets::primeContexts($aIds);
        $aSeen = [];
        foreach ($aIds as $iId) {
            try {
                $aSeen[$iId] = $this->_viewableContext($iId);
            }
            catch (BxDolApiV2Problem $e) {
                // a context one may not see into any more, or may not know of
            }
        }
        $aIds = array_keys($aSeen);
        BxDolApiV2Map::primeProfiles($aIds);
        $aLists = $this->_oModule->_oDb->getListsByContexts($aIds);
        $aCounts = $this->_oModule->_oDb->getListCountsByContexts($aIds);

        $aTitles = [];
        $aItems = [];
        foreach ($aSeen as $iId => $oContext) {
            $sModule = $oContext->getModule();
            if (!isset($aTitles[$sModule]))
                $aTitles[$sModule] = BxDolApiV2Map::text($this->_oModule->getModuleTitle($sModule));
            $aRows = array_merge([[$CNF['FIELD_LIST_ID'] => 0, $CNF['FIELD_LIST_TITLE'] => '']], $aLists[$iId] ?? []);
            $aListItems = [];
            $iTotal = $iOpen = 0;
            foreach ($aRows as $aList) {
                $iListId = (int)$aList[$CNF['FIELD_LIST_ID']];
                $a = $aCounts[$iId][$iListId] ?? ['total' => 0, 'open' => 0];
                $iTotal += $a['total'];
                $iOpen += $a['open'];
                $aListItems[] = [
                    'id' => BxDolApiV2Map::idOrNull($iListId),
                    'title' => $iListId ? trim((string)$aList[$CNF['FIELD_LIST_TITLE']]) : BxDolApiV2Map::text(_t('_bx_tasks_txt_list_inbox')),
                    'task_count' => $a['total'],
                    'open_count' => $a['open'],
                ];
            }
            $aItems[] = [
                'context' => BxDolApiV2Map::profileSummary($iId),
                'module' => $sModule,
                'module_title' => $aTitles[$sModule],
                'task_count' => $iTotal,
                'open_count' => $iOpen,
                'lists' => $aListItems,
                'can_view_budget' => $this->_contextAdmin($iId),
            ];
        }
        usort($aItems, function ($a, $b) {
            return [$a['module_title'], mb_strtolower((string)$a['context']['display_name'])] <=> [$b['module_title'], mb_strtolower((string)$b['context']['display_name'])];
        });
        return ['items' => $aItems];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/me/timers', id: 'listMyTimers', tag: 'tasks', auth: 'required',
        summary: 'The tasks the acting profile has timers on, the running one first',
        description: 'v2 only: the site\'s My Timers. Each task has its `timer` (running or paused, the time it has counted so far). A profile has one running timer at most: starting one pauses the others. Tasks the profile may no longer see are left out. Up to ' . self::MAX_TIMERS . '.',
        responses: [200 => 'TaskTimers'])]
    public function listMyTimers(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aTimers = array_slice($this->_oModule->_oDb->getTimersOfProfile($iViewerId), 0, self::MAX_TIMERS, true);
        $aItems = $this->_items($this->_visibleContents(array_keys($aTimers)), $iViewerId);
        $iTotal = 0;
        foreach ($aItems as $aItem)
            $iTotal += (int)($aItem['timer']['seconds'] ?? 0);
        return ['items' => $aItems, 'total_seconds' => $iTotal];
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/tasks/{id}', id: 'getTask', tag: 'tasks',
        summary: 'A task, with what the viewer may do with it',
        description: 'v2 only. Counts a view, as opening it on the site does (once a day per viewer). 404 when there is none (or it is hidden or waiting for approval and the viewer is not its author or a moderator; or it is in a secret context the viewer may not know of), 403 when the viewer may not see it (one in a closed group from outside). Its comments are GET /content/{content_id}/comments; the module also logs what was done to the task (completed, its due date set ...) there as comments of whoever did it.',
        responses: [200 => 'Task', 403 => null, 404 => null])]
    public function getTask(BxDolApiV2Request $oReq)
    {
        return $this->_get($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/tasks', id: 'createTask', tag: 'tasks', auth: 'required',
        summary: 'Add a task to a context\'s list or Inbox',
        description: 'v2 only, through the site\'s task form as the context\'s Tasks page adds one: the membership level may add tasks, the module lets tasks into contexts of this kind and the viewer may post in it (403 otherwise; 422 for a context the viewer may not know of). `context_id` is needed: v2 adds tasks in contexts only, as the site\'s task lists hold them (its other add page makes one outside any, which v2 shows but does not make). `list_id` is one of its lists (null or left out: its Inbox). `title` is needed (the form\'s checks apply); `body` is plain text, each line a paragraph. `assignee_ids` are members of the context (422 for another profile), the viewer alone by default as the site\'s form has it (`[]` for nobody); each is told, as on the site. `due_at` and `priority_id` (GET /task-lists `priorities`) are set as the module\'s set_property sets them.',
        body: 'NewTask', responses: [201 => 'Task', 403 => null, 422 => null])]
    public function createTask(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;

        $this->_refuse($this->_oModule->checkAllowedAdd(), 'The viewer may not add tasks');
        $iContextId = (int)($aBody['context_id'] ?? 0);
        if (!$iContextId)
            throw BxDolApiV2Problem::validation([['field' => 'context_id', 'code' => 'required', 'message' => 'A task is added in a context']]);
        $this->_checkPostInContext($iContextId);

        $iListId = $this->_listParam($aBody['list_id'] ?? null, $iContextId);
        $sTitle = trim((string)($aBody['title'] ?? ''));
        if ($sTitle === '')
            throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A task needs a title']]);
        $aAssignees = array_key_exists('assignee_ids', $aBody) && $aBody['assignee_ids'] !== null ? $this->_assigneesParam($aBody['assignee_ids'], $iContextId) : [$iViewerId];
        $iDue = array_key_exists('due_at', $aBody) ? $this->_dueParam($aBody['due_at']) : 0;
        $iPriority = array_key_exists('priority_id', $aBody) ? $this->_choiceParam('priorities', $aBody['priority_id'], 'priority_id') : 0;
        $this->_primeContextValues([$iContextId]);
        $iType = array_key_exists('type_id', $aBody) ? $this->_choiceParam('types', $aBody['type_id'], 'type_id', $iContextId) : 0;
        $iEstimate = array_key_exists('estimate_id', $aBody) ? $this->_choiceParam('estimates', $aBody['estimate_id'], 'estimate_id') : 0;
        $iState = array_key_exists('state_id', $aBody) ? $this->_choiceParam('states', $aBody['state_id'], 'state_id') : 0;
        $iLabels = array_key_exists('label_ids', $aBody) ? $this->_labelsParam($aBody['label_ids'], $iContextId) : 0;

        // the add form, as the context's Tasks page fills it (its context, the context's privacy)
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_ADD']);
        if (!$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s task form is not there');
        $oForm->setContextId($iContextId);
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $aValues = [
            $CNF['FIELD_TITLE'] => $sTitle,
            $CNF['FIELD_TEXT'] => BxDolApiV2Map::htmlFromText((string)($aBody['body'] ?? '')),
            $CNF['FIELD_ALLOW_VIEW_TO'] => -$iContextId,
            $CNF['FIELD_PRIORITY'] => $iPriority ?: '',
            $CNF['FIELD_TYPE'] => $iType ?: '',
            $CNF['FIELD_ESTIMATE'] => $iEstimate ?: '',
            $CNF['FIELD_STICKERS'] => BxDolFormCheckerHelper::displaySet($iLabels),
            $CNF['FIELD_INITIAL_MEMBERS'] => $aAssignees,
        ];
        $aValues += $this->_submitted($oForm);
        $oForm->initChecker([], $aValues);
        // the form offers assignees to moderators only, and starts them at the viewer: its insert
        // assigns these, so one pass tells each (setAssignments below is for the others)
        if (isset($oForm->aInputs[$CNF['FIELD_INITIAL_MEMBERS']]))
            $oForm->aInputs[$CNF['FIELD_INITIAL_MEMBERS']]['value'] = $aAssignees;
        $this->_validForm($oForm, [$CNF['FIELD_TITLE'] => 'title', $CNF['FIELD_TEXT'] => 'body', $CNF['FIELD_PRIORITY'] => 'priority_id', $CNF['FIELD_TYPE'] => 'type_id', $CNF['FIELD_ESTIMATE'] => 'estimate_id', $CNF['FIELD_STICKERS'] => 'label_ids'], 'It was not added');

        // a state as the due date: the form offers both to moderators only; a done one completes it
        $aAdd = [
            $CNF['FIELD_AUTHOR'] => $iViewerId,
            $CNF['FIELD_TASKLIST'] => $iListId,
            $CNF['FIELD_DUE_DATE'] => $iDue,
        ];
        if ($iState)
            $aAdd += [$CNF['FIELD_STATE'] => $iState, $CNF['FIELD_COMPLETED'] => $this->_oModule->_oConfig->isCompleted($iState) ? 1 : 0];
        $iId = (int)$oForm->insert($aAdd);
        if (!$iId)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => 'The task was not added']], 'It was not added');
        $this->_oModule->onPublished($iId);
        $this->_oModule->checkAllowedAdd(true);

        // the assignees the form takes only from moderators and administrators, as it would
        $oConnection = BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION']);
        $aNow = array_map('intval', (array)$oConnection->getConnectedInitiators($iId));
        if (array_diff($aNow, $aAssignees) || array_diff($aAssignees, $aNow))
            $this->_oModule->setAssignments($iId, $aAssignees);

        return BxDolApiV2Response::created($this->_one($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId), '/tasks/' . $iId);
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/tasks/{id}', id: 'updateTask', tag: 'tasks', auth: 'required',
        summary: 'Complete, reopen, assign, move or change a task',
        description: 'v2 only. `completed` through the module\'s set_completed, and `list_id` (null: the Inbox), `priority_id`, `type_id`, `estimate_id` (null: none; GET /tasks/choices, the context\'s types where it has its own), `state_id`, `due_at` (null: none) and `assignee_ids` (members of its context; `[]` for nobody) through its set_property, and `label_ids` (`[]` for none) set the same way: who manages the task may (its author, a moderator, the context\'s administrators and whoever it is assigned to; `viewer.can_complete`), 403 otherwise. `title` and `body` (plain text, each line a paragraph) through its edit form: its author or a moderator (`viewer.can_edit`), 403 otherwise. Everything is checked before anything changes, the edit form\'s checks of `title` and `body` too (422 with its message). A task in no context (one the site made outside any) takes only `title` and `body` here (422 `context_needed` otherwise): the module\'s manage check reads the context. The module tells the assignees and the author, and logs each change as a comment of the viewer\'s on the task. A state the site counts as done (Cancelled, Duplicate, Done) completes the task, another one reopens it, as on the site.',
        body: 'TaskChanges', responses: [200 => 'Task', 403 => null, 404 => null, 422 => null])]
    public function updateTask(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $aBody = array_filter($oReq->body(), function ($mValue, $sKey) {
            // nulls are "leave it", but for the fields where null means none
            return $mValue !== null || in_array($sKey, ['due_at', 'list_id', 'priority_id', 'type_id', 'estimate_id'], true);
        }, ARRAY_FILTER_USE_BOTH);
        if (!$aBody)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'required', 'message' => 'Send what to change']]);

        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $iContextId = $iPrivacy < 0 ? -$iPrivacy : 0;

        // everything checked first, so a refusal changes nothing
        $aProperties = [];
        if (array_key_exists('list_id', $aBody)) {
            if (!$iContextId)
                throw BxDolApiV2Problem::validation([['field' => 'list_id', 'code' => 'context_needed', 'message' => 'A task in no context is in no list']]);
            $aProperties[$CNF['FIELD_TASKLIST']] = $this->_listParam($aBody['list_id'], $iContextId);
        }
        if (array_key_exists('priority_id', $aBody))
            $aProperties[$CNF['FIELD_PRIORITY']] = $this->_choiceParam('priorities', $aBody['priority_id'], 'priority_id');
        if (array_key_exists('state_id', $aBody))
            $aProperties[$CNF['FIELD_STATE']] = $this->_choiceParam('states', $aBody['state_id'], 'state_id');
        if ($iContextId)
            $this->_primeContextValues([$iContextId]);
        if (array_key_exists('type_id', $aBody))
            $aProperties[$CNF['FIELD_TYPE']] = $this->_choiceParam('types', $aBody['type_id'], 'type_id', $iContextId);
        if (array_key_exists('estimate_id', $aBody))
            $aProperties[$CNF['FIELD_ESTIMATE']] = $this->_choiceParam('estimates', $aBody['estimate_id'], 'estimate_id');
        if (array_key_exists('label_ids', $aBody))
            $aProperties[$CNF['FIELD_STICKERS']] = $this->_labelsParam($aBody['label_ids'], $iContextId);
        if (array_key_exists('due_at', $aBody))
            $aProperties[$CNF['FIELD_DUE_DATE']] = $aBody['due_at'] === null ? 0 : $this->_dueParam($aBody['due_at']);
        $aAssignees = null;
        if (array_key_exists('assignee_ids', $aBody)) {
            if (!$iContextId)
                throw BxDolApiV2Problem::validation([['field' => 'assignee_ids', 'code' => 'context_needed', 'message' => 'A task in no context is assigned to nobody here']]);
            $aAssignees = $this->_assigneesParam($aBody['assignee_ids'], $iContextId);
        }
        $aText = [];
        if (array_key_exists('title', $aBody)) {
            if (($sTitle = trim((string)$aBody['title'])) === '')
                throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A task needs a title']]);
            $aText[$CNF['FIELD_TITLE']] = $sTitle;
        }
        if (array_key_exists('body', $aBody))
            $aText[$CNF['FIELD_TEXT']] = BxDolApiV2Map::htmlFromText((string)$aBody['body']);

        if ($aProperties || $aAssignees !== null || array_key_exists('completed', $aBody)) {
            // the module's manage check reads the task's context (the absolute value of its privacy)
            if (!$iContextId)
                throw BxDolApiV2Problem::validation([['field' => array_key_first(array_diff_key($aBody, ['title' => 1, 'body' => 1])), 'code' => 'context_needed', 'message' => 'Only a task in a context is managed here']]);
            if (!$this->_oModule->isAllowManage($aContent))
                throw BxDolApiV2Problem::forbidden('The viewer may not manage this task');
        }
        if ($aText) {
            $this->_refuse($this->_oModule->checkAllowedEdit($aContent), 'The viewer may not edit this task');
            $this->_checkText($aContent, $aText);
        }

        // what it is already is no change: the module logs each one it makes
        $aFields = [$CNF['FIELD_TASKLIST'] => 'list_id', $CNF['FIELD_PRIORITY'] => 'priority_id', $CNF['FIELD_STATE'] => 'state_id', $CNF['FIELD_DUE_DATE'] => 'due_at', $CNF['FIELD_TYPE'] => 'type_id', $CNF['FIELD_ESTIMATE'] => 'estimate_id', $CNF['FIELD_STICKERS'] => 'label_ids'];
        foreach ($aProperties as $sField => $mValue)
            if ((string)$aContent[$sField] !== (string)$mValue && ($m = $sField === $CNF['FIELD_STICKERS'] ? $this->_oModule->setStickers($iId, $mValue) : $this->_oModule->serviceSetProperty($iId, $sField, $mValue)) !== true)
                throw BxDolApiV2Problem::validation([['field' => $aFields[$sField], 'code' => 'rejected', 'message' => BxDolApiV2Map::text($m['msg'] ?? _t('_sys_txt_error_occured'))]], 'It was not saved');
        if ($aAssignees !== null) {
            $aNow = array_map('intval', (array)BxDolConnection::getObjectInstance($CNF['OBJECT_CONNECTION'])->getConnectedInitiators($iId));
            if (array_diff($aNow, $aAssignees) || array_diff($aAssignees, $aNow))
                $this->_oModule->serviceSetProperty($iId, $CNF['FIELD_INITIAL_MEMBERS'], $aAssignees);
        }
        if (array_key_exists('completed', $aBody)) {
            BxDolDb::getInstance()->cleanMemoryAll();
            $aNow = $this->_oModule->_oDb->getContentInfoById($iId);
            if ((bool)$aNow[$CNF['FIELD_COMPLETED']] !== (bool)$aBody['completed'] && ($this->_oModule->serviceSetCompleted($iId, $aBody['completed'] ? 1 : 0)['code'] ?? 1) !== 0)
                throw BxDolApiV2Problem::validation([['field' => 'completed', 'code' => 'rejected', 'message' => 'It was not changed']], 'It was not saved');
        }
        if ($aText) {
            // what it is already is no change (the edit runs the form's db passes on what it is given)
            $aText = $this->_changed($this->_oModule->getFormsHelper()->getObjectFormEdit($CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BODY']), $aText, $aContent);
            if ($aText && ($sError = BxDolApiV2Forms::editEntity($this->_oModule, $iId, $aText, $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BODY'])))
                throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => BxDolApiV2Map::text($sError)]], 'It was not saved');
            if ($aText)
                $this->_oModule->checkAllowedEdit($aContent, true);
        }

        BxDolDb::getInstance()->cleanMemoryAll();
        return $this->_one($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/tasks/{id}', id: 'deleteTask', tag: 'tasks', auth: 'required',
        summary: 'Delete a task',
        description: 'v2 only: one\'s own where the membership level may delete tasks, or any for administrators (the module\'s delete check: not one with time tracked or a timer running; 403 otherwise). Its comments, files, assignments and feed activity go with it, as on the site.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deleteTask(BxDolApiV2Request $oReq)
    {
        return $this->_delete($oReq);
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/tasks/{id}/timer', id: 'changeTaskTimer', tag: 'tasks', auth: 'required',
        summary: 'Start, pause, resume, clear or log the viewer\'s timer on a task',
        description: 'v2 only, through the module\'s process_timer as the timer on a task\'s page does it: who manages the task (`viewer.can_track_time`; 403 otherwise) has one timer on it. `start` starts one (pausing the viewer\'s running timer on any other task) or restarts a paused one, `pause` and `resume` it, `clear` drops it, `log` adds what it counted as a time record (rounded up to the next minute, as on the site; the time object\'s report check applies) and drops it. 409 when there is nothing to do (pausing no running timer, logging an empty one). A task in no context is 422 `context_needed`. The task as it is now, with its `timer` and `time_spent`.',
        body: 'TimerAction', responses: [200 => 'Task', 403 => null, 404 => null, 409 => null, 422 => null])]
    public function changeTaskTimer(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_managedTask($oReq->id(), 'action');
        $sAction = (string)($oReq->body()['action'] ?? '');
        if (!in_array($sAction, ['start', 'pause', 'resume', 'clear', 'log'], true))
            throw BxDolApiV2Problem::validation([['field' => 'action', 'code' => 'invalid_value', 'message' => 'Use start, pause, resume, clear or log']]);
        if ($sAction === 'log' && !$this->_timeAllowed())
            throw BxDolApiV2Problem::forbidden('The viewer may not log time');

        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $aResult = $this->_oModule->serviceProcessTimer($sAction, $iId, $iViewerId);
        if (($aResult['code'] ?? 1) !== 0)
            throw new BxDolApiV2Problem(409, 'not_changed', $sAction === 'log' ? 'The timer has no time to log' : 'The timer was not changed');

        BxDolDb::getInstance()->cleanMemoryAll();
        return $this->_one($this->_oModule->_oDb->getContentInfoById($iId), $iViewerId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/tasks/{id}/time', id: 'listTaskTime', tag: 'tasks', auth: 'required',
        summary: 'The time logged on a task, the latest first',
        description: 'v2 only: a task\'s time records (BxTasksTime). Who may see the site\'s time reports (its `report_view` check: moderators and administrators on a site as installed) sees everyone\'s; anyone else who may see the task sees their own. `total_seconds` is all the time logged on it (its `time_spent`), `viewer_seconds` the viewer\'s. Up to ' . self::MAX_TIME_RECORDS . ' records.',
        responses: [200 => 'TaskTime', 403 => null, 404 => null])]
    public function listTaskTime(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_existing($oReq->id());
        $this->_checkView($aContent);
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];

        $oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iId);
        $bAll = $oTime && $oTime->isEnabled() && $oTime->isAllowedReportView();
        $aRows = $this->_oModule->_oDb->getTimeTracksByTask($iId, self::MAX_TIME_RECORDS);
        $iMine = 0;
        $aItems = [];
        BxDolApiV2Map::primeProfiles(array_column($aRows, 'author_id'));
        foreach ($aRows as $aRow) {
            $bMine = (int)$aRow['author_id'] === $iViewerId;
            if ($bMine)
                $iMine += 60 * (int)$aRow['value'];
            if ($bAll || $bMine)
                $aItems[] = $this->_timeRecord($aRow);
        }
        $bManage = $this->_canManageTask($aContent);
        return [
            'items' => $aItems,
            'total_seconds' => 60 * (int)$aContent[self::FIELD_TIME],
            'viewer_seconds' => $iMine,
            'all' => $bAll,
            'can_add' => $bManage && $this->_timeAllowed(),
        ];
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/tasks/{id}/time', id: 'logTaskTime', tag: 'tasks', auth: 'required',
        summary: 'Log time spent on a task',
        description: 'v2 only, through the site\'s time form as its Log time does (BxTasksTime): who manages the task and passes the time object\'s report check (`viewer.can_track_time`; 403 otherwise) logs `minutes` (1 to ' . self::MAX_TIME_MINUTES . ') on a day (`date`, YYYY-MM-DD, today by default) with a note (`text`, plain text). It adds to the task\'s `time_spent` and its context\'s budget, and the module logs it as a comment of the viewer\'s. A task in no context is 422 `context_needed`. The viewer\'s timer on it stays.',
        body: 'NewTimeRecord', responses: [201 => 'TimeRecord', 403 => null, 404 => null, 422 => null])]
    public function logTaskTime(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $aContent = $this->_managedTask($oReq->id(), 'minutes');
        if (!$this->_timeAllowed())
            throw BxDolApiV2Problem::forbidden('The viewer may not log time');
        $aBody = $oReq->body();
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];

        $mMinutes = $aBody['minutes'] ?? null;
        if (!is_int($mMinutes) || $mMinutes < 1 || $mMinutes > self::MAX_TIME_MINUTES)
            throw BxDolApiV2Problem::validation([['field' => 'minutes', 'code' => 'invalid_value', 'message' => 'From 1 to ' . self::MAX_TIME_MINUTES . ' minutes']]);
        $sDate = $aBody['date'] ?? null;
        if ($sDate === null)
            $sDate = date('Y-m-d');
        elseif (!is_string($sDate) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $sDate) || !($oDate = date_create_immutable($sDate . 'T00:00:00Z')) || $oDate->format('Y-m-d') !== $sDate)
            throw BxDolApiV2Problem::validation([['field' => 'date', 'code' => 'invalid_value', 'message' => 'A day as YYYY-MM-DD']]);
        $sText = trim((string)($aBody['text'] ?? ''));

        $oTime = BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], $iId);
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_TIME'], $CNF['OBJECT_FORM_TIME_DISPLAY_ADD']);
        if (!$oTime || !$oTime->isEnabled() || !$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s time form is not there');

        // the form as the time object makes it (BxDolReport::_getFormObject) and Log time fills
        // it: hours and minutes, the day, the note
        $oForm->aParams['db']['table'] = $CNF['TABLE_TIME_TRACK'];
        $oForm->aInputs['sys']['value'] = $CNF['OBJECT_REPORTS_TIME'];
        $oForm->aInputs['object_id']['value'] = $iId;
        $oForm->aInputs['action']['value'] = 'Report';
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $aValues = [
            'object_id' => $iId,
            'value_h' => intdiv($mMinutes, 60),
            'value_m' => $mMinutes % 60,
            'value_date' => $sDate,
            'text' => $sText,
        ];
        $aValues += $this->_submitted($oForm);
        $oForm->initChecker([], $aValues);
        $this->_validForm($oForm, ['value_h' => 'minutes', 'value_m' => 'minutes', 'value_date' => 'date', 'text' => 'text'], 'It was not logged');

        // as BxTasksTime::_report does once its form is valid
        $iValue = $this->_oModule->_oConfig->timeA2I([intdiv($mMinutes, 60), $mMinutes % 60]);
        if (!$oTime->isAllowedReport(true))
            throw BxDolApiV2Problem::forbidden(BxDolApiV2Map::text($oTime->msgErrAllowedReport()) ?: 'The viewer may not log time');
        $iTrackId = (int)$oForm->insert([
            'object_id' => $iId,
            'author_id' => $iViewerId,
            'author_nip' => bx_get_ip_hash(getVisitorIP()),
            'value' => $iValue,
            'text' => bx_process_input($sText),
            'date' => time(),
        ]);
        if (!$iTrackId || !$oTime->putReport($iId, $iViewerId, $iTrackId))
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => 'The time was not logged']], 'It was not logged');
        $this->_oModule->spendBudgetByContentId($iId, $iValue);

        return BxDolApiV2Response::created($this->_timeRecord($this->_oModule->_oDb->getTimeTrackById($iTrackId)), '/tasks/' . $iId . '/time');
    }

    /*
     * Budget
     */

    #[BxDolApiV2Operation(method: 'GET', path: '/task-contexts/{id}/budget', id: 'getTaskBudget', tag: 'tasks', auth: 'required',
        summary: 'A context\'s budget of time: how much it has, how much is spent and what remains',
        description: 'v2 only: the site\'s Budget summary of a context (its Budget page, get_block_budget). A budget is time: its `total_seconds` is what its entries add (each a number of hours, GET .../budget/entries), and `spent_seconds` the time logged on the context\'s tasks (a timer\'s Log, POST /tasks/{id}/time), as the module counts them (bx_tasks_budget). `remaining_seconds` is what is left (below 0 when more is spent), `remaining_percent` the same of the total (null while there is no total). Only the context\'s administrators and the site\'s see a budget, as on the site (isAllowManageByContext): 403 for anyone else; 404 for no such context, or a secret one the viewer may not know of. A context without a budget yet has one of nothing.',
        responses: [200 => 'TaskBudget', 403 => null, 404 => null])]
    public function getTaskBudget(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $iContextId = $this->_budgetContext($oReq->id());
        return $this->_budget($iContextId);
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/task-contexts/{id}/budget/entries', id: 'listTaskBudgetEntries', tag: 'tasks', auth: 'required', paged: true,
        summary: 'The entries of a context\'s budget, the newest first',
        description: 'v2 only: the site\'s Budget table of a context (the bx_tasks_budget_context_administration grid): who added each, its note, its hours and when. `q` keeps those whose note has the words. Who may see the budget sees them (GET /task-contexts/{id}/budget: 403, 404 as there).',
        params: [
            'q' => ['in' => 'query', 'required' => false, 'schema' => ['type' => 'string', 'maxLength' => self::BUDGET_QUERY_MAX], 'description' => 'Words the note has'],
        ],
        responses: [200 => 'Page_TaskBudgetEntry', 403 => null, 404 => null, 422 => null])]
    public function listTaskBudgetEntries(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        $iContextId = $this->_budgetContext($oReq->id());
        $sQuery = trim((string)$oReq->query('q', ''));
        if (mb_strlen($sQuery) > self::BUDGET_QUERY_MAX)
            throw BxDolApiV2Problem::validation([['field' => 'q', 'code' => 'too_long', 'message' => 'Up to ' . self::BUDGET_QUERY_MAX . ' characters']]);

        $iLimit = $oReq->limit();
        $aRows = (array)$this->_oModule->_oDb->getBudgetTracksByContext($iContextId, $oReq->cursorBefore(), $iLimit + 1, $sQuery !== '' ? htmlspecialchars($sQuery, ENT_QUOTES | ENT_HTML5, 'UTF-8') : '');
        BxDolApiV2Map::primeProfiles(array_column($aRows, 'profile_id'));
        $aItems = array_map(function ($aRow) { return $this->_budgetEntry($aRow); }, $aRows);
        return $oReq->pageBefore($aItems, $iLimit, function ($aItem) { return (int)$aItem['id']; });
    }

    #[BxDolApiV2Operation(method: 'POST', path: '/task-contexts/{id}/budget/entries', id: 'addTaskBudgetEntry', tag: 'tasks', auth: 'required',
        summary: 'Add hours to a context\'s budget',
        description: 'v2 only, through the site\'s budget form as its Budget page adds one (bx_tasks_budget_add): `hours` (a whole number, not 0; fewer than 0 takes hours off) and a `note` (plain text). Its hours go on the budget\'s total. Who may see the budget adds to it (403, 404 as GET .../budget); 422 with the form\'s message for what it refuses.',
        body: 'NewTaskBudgetEntry', responses: [201 => 'TaskBudgetEntry', 403 => null, 404 => null, 422 => null])]
    public function addTaskBudgetEntry(BxDolApiV2Request $oReq)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $iContextId = $this->_budgetContext($oReq->id());
        $aBody = $oReq->body();
        $iHours = $this->_budgetHours($aBody['hours'] ?? null);
        $sNote = $this->_budgetNote($aBody['note'] ?? null);

        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = $this->_budgetForm($CNF['OBJECT_FORM_BUDGET_DISPLAY_ADD'], [], $iHours, $sNote);
        $iId = (int)$oForm->insert([
            'context_id' => $iContextId,
            'profile_id' => $iViewerId,
            'date' => time(),
        ]);
        if (!$iId)
            throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => 'The entry was not added']], 'It was not added');
        // as the site's grid does: the total is kept in minutes
        $this->_oModule->_oDb->insertBudget($iContextId, 60 * $iHours);

        return BxDolApiV2Response::created($this->_budgetEntry($this->_oModule->_oDb->getBudgetTrackById($iId)), '/task-contexts/' . $iContextId . '/budget/entries');
    }

    #[BxDolApiV2Operation(method: 'PATCH', path: '/task-budget-entries/{id}', id: 'updateTaskBudgetEntry', tag: 'tasks', auth: 'required',
        summary: 'Change an entry of a budget',
        description: 'v2 only, through the site\'s budget form (bx_tasks_budget_edit): its `hours` and `note`; what is left out stays. A change of its hours changes the budget\'s total by as much. Who may see its context\'s budget changes its entries (403); 404 for no such entry, or one in a context the viewer may not know of.',
        body: 'TaskBudgetEntryChanges', responses: [200 => 'TaskBudgetEntry', 403 => null, 404 => null, 422 => null])]
    public function updateTaskBudgetEntry(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($aEntry, $iContextId) = $this->_existingBudgetEntry($oReq->id());
        $aBody = $oReq->body();
        $iId = (int)$aEntry['id'];
        $oDb = $this->_oModule->_oDb;

        $CNF = &$this->_oModule->_oConfig->CNF;
        for ($iTry = 0; ; $iTry++) {
            $iBefore = (int)$aEntry['value'];
            $iHours = array_key_exists('hours', $aBody) ? $this->_budgetHours($aBody['hours']) : $iBefore;
            $sNote = array_key_exists('note', $aBody) ? $this->_budgetNote($aBody['note']) : (string)$aEntry['text'];
            if ($iHours === $iBefore && $sNote === (string)$aEntry['text'])
                break;

            $oForm = $this->_budgetForm($CNF['OBJECT_FORM_BUDGET_DISPLAY_EDIT'], $aEntry, $iHours, $sNote);
            // the hours and the total change together, and only while the entry still has the
            // hours read above: another change of it made meanwhile is not counted twice
            if ($iHours === $iBefore || $oDb->changeBudgetTrackValue($iId, $iBefore, $iHours)) {
                // the form writes the note: the hours are written, and are not its to write back
                unset($oForm->aInputs['value']['db']);
                if (!$oForm->update($iId) && $iHours === $iBefore)
                    throw BxDolApiV2Problem::validation([['field' => '(body)', 'code' => 'rejected', 'message' => 'The entry was not changed']], 'It was not saved');
                break;
            }

            // someone changed or deleted it since it was read: again, from what it is now
            list($aNow, $iContextId) = $this->_existingBudgetEntry($iId);
            if ((int)$aNow['value'] === $iBefore)
                // or its context has no row for the total yet
                $oDb->insertBudget($iContextId, 0);
            if ($iTry >= 3)
                throw new BxDolApiV2Problem(409, 'conflict', 'The entry is being changed by someone else; try again', [], ['Retry-After' => '1']);
            $aEntry = $aNow;
        }

        return $this->_budgetEntry($oDb->getBudgetTrackById($iId));
    }

    #[BxDolApiV2Operation(method: 'DELETE', path: '/task-budget-entries/{id}', id: 'deleteTaskBudgetEntry', tag: 'tasks', auth: 'required',
        summary: 'Delete an entry of a budget, taking its hours off the total',
        description: 'v2 only, as the site\'s Budget table deletes one: who may see its context\'s budget (403); 404 for no such entry, or one in a context the viewer may not know of.',
        responses: [204 => null, 403 => null, 404 => null])]
    public function deleteTaskBudgetEntry(BxDolApiV2Request $oReq)
    {
        $oReq->requireViewer();
        list($aEntry, $iContextId) = $this->_existingBudgetEntry($oReq->id());
        // it is deleted only with the hours that are taken off the total: when its hours were
        // changed since it was read, it is read again (404 when someone else deleted it)
        for ($iTry = 0; !$this->_oModule->_oDb->deleteBudgetTrackByValue((int)$aEntry['id'], (int)$aEntry['value']); $iTry++) {
            if ($iTry >= 3)
                throw new BxDolApiV2Problem(409, 'conflict', 'The entry is being changed by someone else; try again', [], ['Retry-After' => '1']);
            list($aEntry, $iContextId) = $this->_existingBudgetEntry((int)$aEntry['id']);
        }
        $this->_oModule->_oDb->updateBudgetTotal($iContextId, -60 * (int)$aEntry['value']);
        return BxDolApiV2Response::noContent();
    }

    #[BxDolApiV2Operation(method: 'GET', path: '/search/tasks', id: 'searchTasks', tag: 'search', limit: 'search', paged: true,
        summary: 'Tasks whose title or text contain the words, newest first',
        description: "v2 only. The module's keyword search (the fields its search settings name), newest first, of the tasks the viewer may see (as GET /tasks/{id} decides), so a page can have fewer than `limit` and still a `next_cursor`.",
        params: [
            'q' => ['in' => 'query', 'required' => true, 'schema' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100], 'description' => 'Words to find'],
        ],
        responses: [200 => 'Page_Task', 422 => null])]
    public function searchTasks(BxDolApiV2Request $oReq)
    {
        return $this->_search($oReq);
    }

    /*
     * Reading
     */

    /**
     * The params of GET /tasks and /tasks/facets: the context, the filter of the tasks
     * (BxTasksDb::getTasksFilterSql), the assignees and the author. Without a context, the facets
     * need an assignee or an author ($bFacets), as a filter does.
     * @return array [context id, filter, assignee ids, author id]
     */
    protected function _listParams(BxDolApiV2Request $oReq, $bFacets = false)
    {
        $iContextId = $this->_idParam($oReq, 'context_id');
        if ($iContextId) {
            $this->_viewableContext($iContextId);
            $this->_primeContextValues([$iContextId]);
        }

        $aFilter = $this->_filterParams($oReq, $iContextId);

        $mList = $oReq->query('list_id');
        if ($mList !== null) {
            if (!$iContextId)
                throw BxDolApiV2Problem::validation([['field' => 'list_id', 'code' => 'context_needed', 'message' => 'Send the list\'s context_id too']]);
            $aLists = [];
            foreach ($this->_csv($mList, 'list_id', '/^([1-9][0-9]{0,18}|inbox)$/') as $sList) {
                if ($sList !== 'inbox' && !$this->_listInContext((int)$sList, $iContextId))
                    throw BxDolApiV2Problem::validation([['field' => 'list_id', 'code' => 'not_found', 'message' => 'No such list in this context']]);
                $aLists[] = $sList === 'inbox' ? 0 : (int)$sList;
            }
            $aFilter['lists'] = array_values(array_unique($aLists));
        }

        $aAssignees = [];
        if (($mAssignee = $oReq->query('assignee')) !== null)
            foreach ($this->_csv($mAssignee, 'assignee', '/^([1-9][0-9]{0,18}|me)$/') as $sAssignee) {
                if ($sAssignee === 'me')
                    $aAssignees[] = (int)$oReq->requireViewer();
                elseif (BxDolProfile::getInstance((int)$sAssignee))
                    $aAssignees[] = (int)$sAssignee;
                else
                    throw BxDolApiV2Problem::validation([['field' => 'assignee', 'code' => 'not_found', 'message' => 'No such profile']]);
            }
        $aAssignees = array_values(array_unique($aAssignees));

        $iAuthor = $this->_idParam($oReq, 'author');
        if ($iAuthor && !BxDolProfile::getInstance($iAuthor))
            throw BxDolApiV2Problem::validation([['field' => 'author', 'code' => 'not_found', 'message' => 'No such profile']]);

        if (!$bFacets) {
            $sState = (string)$oReq->query('state', 'all');
            if (!in_array($sState, ['open', 'completed', 'all'], true))
                throw BxDolApiV2Problem::validation([['field' => 'state', 'code' => 'invalid_value', 'message' => 'Use open, completed or all']]);
            if ($sState !== 'all')
                $aFilter['completed'] = $sState === 'completed' ? 1 : 0;
        }

        // across contexts, only a profile's own tasks (assigned or added) take filters
        $bFiltered = count(array_diff_key($aFilter, ['completed' => 1])) > 0;
        if (!$iContextId && !$aAssignees && !$iAuthor && ($bFacets || $bFiltered))
            throw BxDolApiV2Problem::validation([['field' => 'assignee', 'code' => 'required', 'message' => 'Send context_id, assignee or author with these filters']]);

        return [$iContextId, $aFilter, $aAssignees, $iAuthor];
    }

    /** The params of GET /me/tasks and /me/tasks/facets: [filter, assignee ids, author id]. */
    protected function _myParams(BxDolApiV2Request $oReq, $bFacets)
    {
        $iViewerId = (int)$oReq->requireViewer();
        $sRole = (string)$oReq->query('role', 'assigned');
        if (!in_array($sRole, ['assigned', 'created'], true))
            throw BxDolApiV2Problem::validation([['field' => 'role', 'code' => 'invalid_value', 'message' => 'Use assigned or created']]);
        $aFilter = $this->_filterParams($oReq, 0);
        if (!$bFacets) {
            $sState = (string)$oReq->query('state', 'open');
            if (!in_array($sState, ['open', 'completed', 'all'], true))
                throw BxDolApiV2Problem::validation([['field' => 'state', 'code' => 'invalid_value', 'message' => 'Use open, completed or all']]);
            if ($sState !== 'all')
                $aFilter['completed'] = $sState === 'completed' ? 1 : 0;
        }
        return $sRole === 'created' ? [$aFilter, [], $iViewerId] : [$aFilter, [$iViewerId], 0];
    }

    /**
     * The property filters (type, priority, estimate, state, label) and the saved filter of a
     * list's params, as BxTasksDb::getTasksFilterSql takes them.
     */
    protected function _filterParams(BxDolApiV2Request $oReq, $iContextId)
    {
        $aFilter = [];
        foreach (['type_id' => 'types', 'priority_id' => 'priorities', 'estimate_id' => 'estimates', 'state_id' => 'states', 'label_id' => 'labels'] as $sParam => $sKey)
            if (($mValue = $oReq->query($sParam)) !== null)
                $aFilter[$sKey] = array_values(array_unique(array_map('intval', $this->_csv($mValue, $sParam, '/^[1-9][0-9]{0,9}$/'))));
        foreach ($aFilter['labels'] ?? [] as $iLabel)
            if ($iLabel > 31)
                throw BxDolApiV2Problem::validation([['field' => 'label_id', 'code' => 'not_found', 'message' => 'No such label']]);

        if (($iFilterId = $this->_idParam($oReq, 'filter_id'))) {
            $aSaved = $this->_savedFilters($iContextId, (int)$oReq->viewerId());
            if (!isset($aSaved[$iFilterId]))
                throw BxDolApiV2Problem::validation([['field' => 'filter_id', 'code' => 'not_found', 'message' => 'No such filter here (GET /task-filters)']]);
            $aFilter['filter'] = $this->_oModule->_oDb->getFilterById($iFilterId);
        }
        return $aFilter;
    }

    /** A comma-separated query param, each value as $sPattern has it, up to MAX_FILTER_VALUES. */
    protected function _csv($mValue, $sParam, $sPattern)
    {
        $aValues = is_string($mValue) ? explode(',', $mValue) : [];
        if (!$aValues || count($aValues) > self::MAX_FILTER_VALUES)
            throw BxDolApiV2Problem::validation([['field' => $sParam, 'code' => 'invalid_value', 'message' => 'One to ' . self::MAX_FILTER_VALUES . ' values, comma-separated']]);
        foreach ($aValues as $sValue)
            if (!preg_match($sPattern, $sValue))
                throw BxDolApiV2Problem::validation([['field' => $sParam, 'code' => 'invalid_value', 'message' => 'Not a value it takes: ' . mb_substr($sValue, 0, 40)]]);
        return $aValues;
    }

    protected function _sortParam(BxDolApiV2Request $oReq)
    {
        $sSort = (string)$oReq->query('sort', 'due');
        if (!in_array($sSort, self::SORTS_TASKS, true))
            throw BxDolApiV2Problem::validation([['field' => 'sort', 'code' => 'invalid_value', 'message' => 'Use ' . implode(', ', self::SORTS_TASKS)]]);
        return $sSort;
    }

    /**
     * The saved filters the site's filter menu offers here (BxTasksTemplate::_getEntriesFilters):
     * the site's, the context's for everyone, the viewer's own saved ones; none for guests.
     * @return array filter id => row with `_kind` (system, context, mine)
     */
    protected function _savedFilters($iContextId, $iViewerId)
    {
        if (!$iViewerId)
            return [];
        $aResult = [];
        $aKinds = [
            'system' => ['sample' => 'active', 'context_id' => 0, 'author' => 0],
            'context' => ['sample' => 'active', 'context_id' => (int)$iContextId, 'author' => 0],
            'mine' => ['sample' => 'active', 'context_id' => (int)$iContextId, 'author' => (int)$iViewerId, 'permanent' => 1],
        ];
        foreach ($aKinds as $sKind => $aParams) {
            if ($sKind === 'context' && !$iContextId)
                continue;
            foreach ((array)$this->_oModule->_oDb->getFilters($aParams) as $aFilter)
                if (!isset($aResult[(int)$aFilter['id']]))
                    $aResult[(int)$aFilter['id']] = $aFilter + ['_kind' => $sKind];
        }
        return $aResult;
    }

    /**
     * A page of tasks: in a context (or a profile's own: assigned to them or added by them,
     * across contexts), with a filter (BxTasksDb::getTasksFilterSql); open ones first, then in
     * the order of $sSort (`due`: by due date, none last, then the first added).
     */
    protected function _tasksPage(BxDolApiV2Request $oReq, $iContextId, $aFilter, $aAssignees, $iAuthor, $sSort)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $sTable = '`' . $CNF['TABLE_ENTRIES'] . '`';

        if ($iContextId)
            list($sMode, $aParams) = ['context', ['context' => $iContextId]];
        elseif ($iAuthor)
            list($sMode, $aParams) = ['author', ['author' => $iAuthor]];
        else
            list($sMode, $aParams) = ['public', []];

        $aRestrictions = [];
        if ($iContextId && $iAuthor)
            $aFilter['author'] = $iAuthor;
        if ($aAssignees)
            $aFilter['assignees'] = $aAssignees;
        // across contexts: the tasks of those whose content the viewer may see (not the public
        // content alone, which leaves out every task in a context), in SQL, so that a page and its
        // next_cursor never count others; each one still goes through the view check
        if (!$iContextId && ($aAssignees || $iAuthor) && !empty($CNF['OBJECT_PRIVACY_VIEW']))
            $aRestrictions['privacy_' . $CNF['OBJECT_PRIVACY_VIEW']] = ['value' => $this->_seenPrivacy($aAssignees, $iAuthor) ?: [0], 'field' => $CNF['FIELD_ALLOW_VIEW_TO'], 'operator' => 'in'];

        $sCompleted = $sTable . '.`' . $CNF['FIELD_COMPLETED'] . '` ASC, ';
        $sDue = $sTable . '.`' . $CNF['FIELD_DUE_DATE'] . '` = 0 ASC, ' . $sTable . '.`' . $CNF['FIELD_DUE_DATE'] . '` ASC, ';
        $sAdded = $sTable . '.`' . $CNF['FIELD_ADDED'] . '`';
        switch ($sSort) {
            case 'priority':
                // the most urgent first (1), none (0) last
                $sOrder = $sCompleted . $sTable . '.`' . $CNF['FIELD_PRIORITY'] . '` = 0 ASC, ' . $sTable . '.`' . $CNF['FIELD_PRIORITY'] . '` ASC, ' . $sDue . $sAdded . ' ASC';
                break;
            case 'created':
                $sOrder = $sCompleted . $sAdded . ' DESC';
                break;
            case 'updated':
                $sOrder = $sCompleted . 'GREATEST(' . $sAdded . ', ' . $sTable . '.`' . $CNF['FIELD_CHANGED'] . '`) DESC';
                break;
            default:
                $sOrder = $sCompleted . $sDue . $sAdded . ' ASC';
        }

        $iOffset = $oReq->cursorOffset();
        $iLimit = $oReq->limit();
        $sSql = $this->_oModule->_oDb->getTasksFilterSql($aFilter, $CNF['TABLE_ENTRIES']);
        $aIds = $this->_browseRows($sMode, $aParams, $iOffset, $iLimit + 1, $sOrder, $aRestrictions, '', [], $sSql);

        $aItems = $this->_items($this->_visibleContents(array_slice($aIds, 0, $iLimit)), (int)$oReq->viewerId());
        return $oReq->pageAt($aItems, count($aIds) > $iLimit ? $iOffset + $iLimit : null);
    }

    /**
     * TaskFacets: the tasks _tasksPage would list for the filter (open and completed), counted
     * by each property (BxTasksDb::getTaskFacets).
     */
    protected function _facets($iContextId, $aFilter, $aAssignees, $iAuthor)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        unset($aFilter['completed']);
        if ($iAuthor)
            $aFilter['author'] = $iAuthor;
        if ($aAssignees)
            $aFilter['assignees'] = $aAssignees;
        $aPrivacy = $iContextId ? [-$iContextId] : $this->_seenPrivacy($aAssignees, $iAuthor);
        $aFacets = $this->_oModule->_oDb->getTaskFacets($aPrivacy, $this->_oModule->_oDb->getTasksFilterSql($aFilter, 'te'));

        $iTotal = $iOpen = 0;
        foreach ($aFacets['state'] ?? [] as $a) {
            $iTotal += $a['total'];
            $iOpen += $a['open'];
        }
        $fBuckets = function ($sFacet) use ($aFacets) {
            $aResult = [];
            foreach ($aFacets[$sFacet] ?? [] as $sValue => $a)
                $aResult[] = ['id' => (int)$sValue > 0 ? (string)(int)$sValue : null, 'count' => $a['total'], 'open' => $a['open']];
            usort($aResult, function ($a, $b) { return [$a['id'] === null, (int)$a['id']] <=> [$b['id'] === null, (int)$b['id']]; });
            return $aResult;
        };

        // labels: each task under each of its stickers, those with none under null
        $aLabels = [];
        foreach ($aFacets['stickers'] ?? [] as $sValue => $a)
            foreach (BxDolFormCheckerHelper::displaySet((int)$sValue) ?: [0] as $iLabel) {
                $aLabels[$iLabel] = $aLabels[$iLabel] ?? ['total' => 0, 'open' => 0];
                $aLabels[$iLabel]['total'] += $a['total'];
                $aLabels[$iLabel]['open'] += $a['open'];
            }
        ksort($aLabels);
        $aLabelItems = [];
        foreach ($aLabels as $iLabel => $a)
            $aLabelItems[] = ['id' => $iLabel ? (string)$iLabel : null, 'count' => $a['total'], 'open' => $a['open']];
        if (isset($aLabels[0]))
            $aLabelItems[] = array_shift($aLabelItems);

        // lists: by context, the Inbox (null) of each
        $aLists = [];
        foreach ($aFacets['list'] ?? [] as $sValue => $a) {
            list($sPrivacy, $sList) = explode(':', $sValue) + [1 => '0'];
            $aLists[] = ['context_id' => (int)$sPrivacy < 0 ? (string)-(int)$sPrivacy : null, 'id' => (int)$sList > 0 ? (string)(int)$sList : null, 'count' => $a['total'], 'open' => $a['open']];
        }
        // each context's Inbox first, then its lists in the order they were made
        usort($aLists, function ($a, $b) { return [(int)$a['context_id'], $a['id'] !== null, (int)$a['id']] <=> [(int)$b['context_id'], $b['id'] !== null, (int)$b['id']]; });
        $aContexts = [];
        foreach ($aFacets['privacy'] ?? [] as $sValue => $a)
            if ((int)$sValue < 0)
                $aContexts[] = ['id' => (string)-(int)$sValue, 'count' => $a['total'], 'open' => $a['open']];

        return [
            'total' => $iTotal,
            'open' => $iOpen,
            'completed' => $iTotal - $iOpen,
            'states' => $fBuckets('state'),
            'priorities' => $fBuckets('priority'),
            'types' => $fBuckets('type'),
            'estimates' => $fBuckets('estimate'),
            'labels' => $aLabelItems,
            'lists' => $aLists,
            'contexts' => $aContexts,
            'assignees' => $fBuckets('assignee'),
        ];
    }

    /**
     * Of the privacy values the tasks assigned to any of $aAssignees and/or added by $iAuthor
     * have, those whose tasks the viewer may see: contexts whose content they may see (as GET
     * /tasks?context_id decides), and outside any, the public groups (all of them for the tasks'
     * own author).
     * @return array of int
     */
    protected function _seenPrivacy($aAssignees, $iAuthor)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aContexts = [];
        $aGroups = [];
        foreach ($this->_oModule->_oDb->getPrivacyValuesOfTasks($aAssignees, $iAuthor) as $iValue) {
            if ($iValue < 0)
                $aContexts[] = -$iValue;
            elseif ($iValue > 0)
                $aGroups[] = $iValue;
        }

        $aResult = [];
        BxDolApiV2Targets::primeContexts($aContexts);
        foreach ($aContexts as $iContextId) {
            try {
                BxDolApiV2Targets::viewableContext($iContextId, 'context_id');
                $aResult[] = -$iContextId;
            }
            catch (BxDolApiV2Problem $e) {
                // a context the viewer may not see into, or may not know of
            }
        }

        if ($aGroups && ($oPrivacy = BxDolPrivacy::getObjectInstance($CNF['OBJECT_PRIVACY_VIEW']))) {
            // the site's public content condition: none for the content's own author
            $aCondition = $oPrivacy->getContentPublicAsCondition((int)$iAuthor);
            $aRestriction = is_array($aCondition['restriction'] ?? null) ? reset($aCondition['restriction']) : null;
            $aPublic = is_array($aRestriction) ? array_map('intval', (array)$aRestriction['value']) : null;
            $aResult = array_merge($aResult, $aPublic === null ? $aGroups : array_values(array_intersect($aGroups, $aPublic)));
        }
        return $aResult;
    }

    /**
     * A list and its context, or 404: no such list, its context gone or one the viewer may not
     * know of; 403 when the viewer may not see the context's content.
     * @return array [list row, context id]
     */
    protected function _existingList($iId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $aList = $iId > 0 ? $this->_oModule->_oDb->getList($iId) : [];
        $iContextId = (int)($aList[$CNF['FIELD_LIST_CONTEXT_ID']] ?? 0);
        if (empty($aList) || !$iContextId || !BxDolProfile::getInstance($iContextId) || !BxDolApiV2Targets::visible(BxDolApiV2Targets::make(BxDolApiV2Targets::GROUP, $iContextId)))
            throw BxDolApiV2Problem::notFound('The task list');
        try {
            $this->_viewableContext($iContextId);
        }
        catch (BxDolApiV2Problem $e) {
            if ($e->getStatus() === 403)
                throw $e;
            throw BxDolApiV2Problem::notFound('The task list');
        }
        return [$aList, $iContextId];
    }

    protected function _listInContext($iListId, $iContextId)
    {
        $aList = $this->_oModule->_oDb->getList((int)$iListId);
        return !empty($aList) && (int)$aList[$this->_oModule->_oConfig->CNF['FIELD_LIST_CONTEXT_ID']] === (int)$iContextId;
    }

    /** A `list_id` of a body: one of the context's lists, or 0 (its Inbox) for null. */
    protected function _listParam($mValue, $iContextId)
    {
        if ($mValue === null)
            return 0;
        if (!is_string($mValue) || !preg_match('/^[1-9][0-9]{0,18}$/', $mValue) || !$this->_listInContext((int)$mValue, $iContextId))
            throw BxDolApiV2Problem::validation([['field' => 'list_id', 'code' => 'not_found', 'message' => 'No such list in this context']]);
        return (int)$mValue;
    }

    /** A `due_at` of a body: a timestamp, or 0 for null. */
    protected function _dueParam($mValue)
    {
        if ($mValue === null)
            return 0;
        $oDate = is_string($mValue) && preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/', $mValue) ? date_create_immutable($mValue) : false;
        if (!$oDate || $oDate->getTimestamp() <= 0)
            throw BxDolApiV2Problem::validation([['field' => 'due_at', 'code' => 'invalid_value', 'message' => 'A date and time with its zone (RFC 3339)']]);
        return $oDate->getTimestamp();
    }

    /**
     * `assignee_ids` of a body: members of the context (its fans, as the site's form suggests
     * them), each once.
     */
    protected function _assigneesParam($mValue, $iContextId)
    {
        if (!is_array($mValue) || count($mValue) > self::MAX_ASSIGNEES)
            throw BxDolApiV2Problem::validation([['field' => 'assignee_ids', 'code' => 'invalid_value', 'message' => 'Up to ' . self::MAX_ASSIGNEES . ' profile ids']]);
        $oContext = BxDolProfile::getInstance($iContextId);
        $sModule = $oContext ? $oContext->getModule() : '';
        $aIds = [];
        foreach (array_values($mValue) as $i => $mId) {
            $iId = is_string($mId) && preg_match('/^[1-9][0-9]{0,18}$/', $mId) ? (int)$mId : 0;
            $bMember = $iId && BxDolProfile::getInstance($iId) && $sModule !== '' && bx_is_srv($sModule, 'is_fan') && bx_srv($sModule, 'is_fan', [$iContextId, $iId]);
            if (!$bMember || in_array($iId, $aIds, true))
                throw BxDolApiV2Problem::validation([['field' => 'assignee_ids[' . $i . ']', 'code' => $bMember ? 'duplicate' : 'not_member', 'message' => $bMember ? 'Is given twice' : 'Not a member of the task\'s context']]);
            $aIds[] = $iId;
        }
        return $aIds;
    }

    /**
     * What makes the form submitted: its first submit button (they sit in an input set, which
     * BxBaseModGeneralFormsEntryHelper::addData does not find).
     */
    protected function _submitted($oForm)
    {
        $aNames = (array)($oForm->aParams['db']['submit_name'] ?? []);
        return $aNames ? [reset($aNames) => 1] : [];
    }

    protected function _listTitle($aBody)
    {
        $sTitle = trim((string)($aBody['title'] ?? ''));
        if ($sTitle === '')
            throw BxDolApiV2Problem::validation([['field' => 'title', 'code' => 'required', 'message' => 'A list needs a title']]);
        return $sTitle;
    }

    /**
     * The site's list form with a title, checked as it checks it (422 with its message).
     */
    protected function _listForm($sDisplay, $aList, $sTitle)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_LIST_ENTRY'], $sDisplay);
        if (!$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s list form is not there');
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $aValues = [$CNF['FIELD_LIST_TITLE'] => $sTitle];
        $aValues += $this->_submitted($oForm);
        $oForm->initChecker($aList, $aValues);
        $this->_validForm($oForm, [$CNF['FIELD_LIST_TITLE'] => 'title'], 'It was not saved');
        return $oForm;
    }

    /**
     * A task's new title and text checked as the site's edit form (its body display) checks
     * them, before anything changes: 422 with its messages. Nothing is saved here.
     */
    protected function _checkText($aContent, $aText)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_ENTRY'], $CNF['OBJECT_FORM_ENTRY_DISPLAY_EDIT_BODY']);
        if (!$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s task form is not there');
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        // what is not changed is checked as it is
        $aValues = $aText + [
            $CNF['FIELD_TITLE'] => (string)$aContent[$CNF['FIELD_TITLE']],
            $CNF['FIELD_TEXT'] => (string)$aContent[$CNF['FIELD_TEXT']],
        ];
        $aValues += $this->_submitted($oForm);
        $oForm->initChecker($aContent, $aValues);
        $this->_validForm($oForm, [$CNF['FIELD_TITLE'] => 'title', $CNF['FIELD_TEXT'] => 'body'], 'It was not saved');
    }

    /** 422 with the form's messages ($aFields: its field names => the API's) when it refuses what it was given. */
    protected function _validForm($oForm, $aFields, $sTitle)
    {
        if ($oForm->isSubmittedAndValid())
            return;
        $aErrors = [];
        foreach ($oForm->aInputs as $sKey => $aInput)
            if (!empty($aInput['error']))
                $aErrors[$sKey] = $aInput['error'];
        // the fields the client sent; the form's general "check your inputs" (on its submit
        // button) only when none of them is named
        $aNamed = array_intersect_key($aErrors, $aFields);
        throw BxDolApiV2Problem::validation($this->_formErrors(['errors' => $aNamed ?: $aErrors], $aFields), $sTitle);
    }

    /**
     * Whether the viewer may add tasks in the context (the level, the module's contexts, the
     * context's post privacy), without refusing.
     */
    protected function _canAddIn($oContext)
    {
        return $oContext && $this->_oModule->checkAllowedAdd() === CHECK_ACTION_RESULT_ALLOWED
            && $this->_oModule->serviceCheckAllowedAddInContext($oContext->getModule()) === CHECK_ACTION_RESULT_ALLOWED
            && $this->_canPostIn($oContext);
    }

    /** Whether the viewer administers the context (the module's isAllowManageByContext), once per context. */
    protected function _contextAdmin($iContextId)
    {
        $iContextId = (int)$iContextId;
        if ($iContextId <= 0 || !bx_get_logged_profile_id() || !BxDolProfile::getInstance($iContextId))
            return false;
        if (!array_key_exists($iContextId, $this->_aContextAdmin))
            $this->_aContextAdmin[$iContextId] = (bool)$this->_oModule->isAllowManageByContext($iContextId);
        return $this->_aContextAdmin[$iContextId];
    }

    /**
     * The site's pre-list values of $sKind (priorities, states, types, estimates, stickers):
     * value => title, without "please select", in the list's order.
     */
    protected function _choices($sKind)
    {
        if (!isset($this->_aChoices[$sKind])) {
            $CNF = &$this->_oModule->_oConfig->CNF;
            $aLists = [
                'priorities' => $CNF['OBJECT_PRE_LIST_PRIORITIES'],
                'states' => $CNF['OBJECT_PRE_LIST_STATES'],
                'types' => $CNF['OBJECT_PRE_LIST_TYPES'],
                'estimates' => $CNF['OBJECT_PRE_LIST_ESTIMATES'],
                'stickers' => $CNF['OBJECT_PRE_LIST_STICKERS'],
            ];
            $aItems = BxDolFormQuery::getDataItems($aLists[$sKind]);
            $this->_aChoices[$sKind] = [];
            foreach ((array)$aItems as $mValue => $sTitle)
                if ((int)$mValue > 0)
                    $this->_aChoices[$sKind][(string)(int)$mValue] = BxDolApiV2Map::text((string)$sTitle);
        }
        return $this->_aChoices[$sKind];
    }

    protected function _choiceList($sKind)
    {
        $aResult = [];
        foreach ($this->_choices($sKind) as $sId => $sTitle)
            $aResult[] = ['id' => (string)$sId, 'title' => $sTitle] + ($sKind === 'states' ? ['done' => (bool)$this->_oModule->_oConfig->isCompleted((int)$sId)] : []);
        return $aResult;
    }

    protected function _choice($sKind, $iValue)
    {
        $aChoices = $this->_choices($sKind);
        $sId = (string)(int)$iValue;
        if (!isset($aChoices[$sId]))
            return null;
        $aResult = ['id' => $sId, 'title' => $aChoices[$sId]];
        if ($sKind === 'states')
            $aResult['done'] = (bool)$this->_oModule->_oConfig->isCompleted((int)$sId);
        if ($sKind === 'estimates')
            $aResult['points'] = (int)$sId;
        return $aResult;
    }

    /** The contexts' own types and stickers, read at once for those not read yet. */
    protected function _primeContextValues($aContextIds)
    {
        $aIds = array_values(array_diff(array_unique(array_filter(array_map('intval', (array)$aContextIds))), array_keys($this->_aContextValues)));
        if (!$aIds)
            return;
        $aRows = $this->_oModule->_oDb->getPreValuesByContexts($aIds, ['type', 'sticker']);
        foreach ($aIds as $iId)
            $this->_aContextValues[$iId] = $aRows[$iId] ?? [];
    }

    /** A context's own values of a pre-list (`type`, `sticker`): value => row. */
    protected function _contextValues($iContextId, $sList)
    {
        if (!$iContextId)
            return [];
        $this->_primeContextValues([$iContextId]);
        return $this->_aContextValues[(int)$iContextId][$sList] ?? [];
    }

    /**
     * The types a task in the context may have, as its form offers them: the context's own active
     * ones where it has them, else the site's. value => title.
     */
    protected function _typeChoices($iContextId)
    {
        $aResult = [];
        foreach ($this->_contextValues($iContextId, 'type') as $sValue => $aRow)
            if ((int)$aRow['active'] && (int)$sValue > 0)
                $aResult[(string)(int)$sValue] = BxDolApiV2Map::text((string)$aRow['title']);
        return $aResult ?: $this->_choices('types');
    }

    /**
     * The labels a task in the context may have, as its form offers them: the context's own
     * stickers where it has them (with their colours), else the site's. value => [title, color].
     */
    protected function _labelChoices($iContextId)
    {
        $aResult = [];
        foreach ($this->_contextValues($iContextId, 'sticker') as $sValue => $aRow)
            if ((int)$sValue >= 1 && (int)$sValue <= 31)
                $aResult[(string)(int)$sValue] = ['title' => BxDolApiV2Map::text((string)$aRow['title']), 'color' => $this->_color((string)$aRow['color'])];
        if (!$aResult)
            foreach ($this->_choices('stickers') as $sId => $sTitle)
                if ((int)$sId <= 31)
                    $aResult[$sId] = ['title' => $sTitle, 'color' => null];
        return $aResult;
    }

    /** A task's type, the context's own title first, as BxTasksModule::getType reads it. */
    protected function _type($iValue, $iContextId)
    {
        if ((int)$iValue <= 0)
            return null;
        $aRow = $this->_contextValues($iContextId, 'type')[(string)(int)$iValue] ?? null;
        if ($aRow)
            return ['id' => (string)(int)$iValue, 'title' => BxDolApiV2Map::text((string)$aRow['title'])];
        return $this->_choice('types', $iValue);
    }

    /** A task's labels (its stickers), the context's own first, as BxTasksModule::getStickers reads them. */
    protected function _labels($iSet, $iContextId)
    {
        $aContext = $this->_contextValues($iContextId, 'sticker');
        $aSite = $this->_choices('stickers');
        $aResult = [];
        foreach (BxDolFormCheckerHelper::displaySet((int)$iSet) as $iValue) {
            $sId = (string)$iValue;
            if (isset($aContext[$sId]))
                $aResult[] = ['id' => $sId, 'title' => BxDolApiV2Map::text((string)$aContext[$sId]['title']), 'color' => $this->_color((string)$aContext[$sId]['color'])];
            elseif (isset($aSite[$sId]))
                $aResult[] = ['id' => $sId, 'title' => $aSite[$sId], 'color' => null];
        }
        return $aResult;
    }

    /** A colour the site's colour field wrote, as CSS: #hex or rgb()/rgba() only, else null. */
    protected function _color($sColor)
    {
        $sColor = trim($sColor);
        return preg_match('/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*,\s*[0-9.]+%?\s*(,\s*[0-9.]+%?\s*)?\))$/', $sColor) ? $sColor : null;
    }

    /**
     * A pre-list value of a body ($sKind `priorities`, `states`, `estimates`, or `types` of the
     * context): one this site (the context) offers, 0 for null.
     */
    protected function _choiceParam($sKind, $mValue, $sField, $iContextId = 0)
    {
        if ($mValue === null)
            return 0;
        $aChoices = $sKind === 'types' ? $this->_typeChoices($iContextId) : $this->_choices($sKind);
        if (!is_string($mValue) || !preg_match('/^[1-9][0-9]*$/', $mValue) || !isset($aChoices[$mValue]))
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'not_found', 'message' => 'Not one this site offers (GET /tasks/choices ' . $sKind . ')']]);
        return (int)$mValue;
    }

    /** `label_ids` of a body: labels of the context (GET /tasks/choices), each once, as the set the task keeps. */
    protected function _labelsParam($mValue, $iContextId)
    {
        $aChoices = $this->_labelChoices($iContextId);
        if (!is_array($mValue) || count($mValue) > 31)
            throw BxDolApiV2Problem::validation([['field' => 'label_ids', 'code' => 'invalid_value', 'message' => 'A list of label ids']]);
        $aIds = [];
        foreach (array_values($mValue) as $i => $mId) {
            if (!is_string($mId) || !isset($aChoices[$mId]) || in_array((int)$mId, $aIds, true))
                throw BxDolApiV2Problem::validation([['field' => 'label_ids[' . $i . ']', 'code' => 'not_found', 'message' => 'Not a label of this context, or given twice']]);
            $aIds[] = (int)$mId;
        }
        return (int)BxDolFormCheckerHelper::passSet($aIds);
    }

    /**
     * A task the viewer may see and manage (its author, a moderator, the context's administrators
     * and its assignees), in a context ($sField names the field that needs one): 404, 403, 422.
     */
    protected function _managedTask($iId, $sField)
    {
        $aContent = $this->_existing($iId);
        $this->_checkView($aContent);
        $CNF = &$this->_oModule->_oConfig->CNF;
        if ((int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']] >= 0)
            throw BxDolApiV2Problem::validation([['field' => $sField, 'code' => 'context_needed', 'message' => 'Only a task in a context is managed here']]);
        if (!$this->_oModule->isAllowManage($aContent))
            throw BxDolApiV2Problem::forbidden('The viewer may not manage this task');
        return $aContent;
    }

    /** The module's isAllowManage of a task in a context, from what a page read (see _item). */
    protected function _canManageTask($aContent)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        return (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']] < 0 && $this->_oModule->isAllowManage($aContent);
    }

    /** Whether the viewer may log time: the time object is on and its report check lets them. */
    protected function _timeAllowed()
    {
        if ($this->_mTimeAllowed === null) {
            $CNF = &$this->_oModule->_oConfig->CNF;
            $oTime = !empty($CNF['OBJECT_REPORTS_TIME']) ? BxDolReport::getObjectInstance($CNF['OBJECT_REPORTS_TIME'], 0) : null;
            $this->_mTimeAllowed = $oTime && $oTime->isEnabled() && $oTime->isAllowedReport();
        }
        return $this->_mTimeAllowed;
    }

    /**
     * A context whose budget the viewer may see and change: 404 for no such context or one the
     * viewer may not know of, 403 when they may not see what is in it or do not administer it
     * (the module's isAllowManageByContext, which its Budget page and blocks check).
     */
    protected function _budgetContext($iContextId)
    {
        try {
            $this->_viewableContext($iContextId, 'id');
        }
        catch (BxDolApiV2Problem $e) {
            if ($e->getStatus() === 422)
                throw BxDolApiV2Problem::notFound('The context');
            throw $e;
        }
        if (!$this->_contextAdmin($iContextId))
            throw BxDolApiV2Problem::forbidden('Only the context\'s administrators see its budget');
        return (int)$iContextId;
    }

    /** A budget entry and its context, which the viewer may see the budget of; 404 for none. */
    protected function _existingBudgetEntry($iId)
    {
        $aEntry = $this->_oModule->_oDb->getBudgetTrackById($iId);
        if (empty($aEntry) || !is_array($aEntry))
            throw BxDolApiV2Problem::notFound('The budget entry');
        return [$aEntry, $this->_budgetContext((int)$aEntry['context_id'])];
    }

    /** A TaskBudget: the module keeps a context's total and spent time in minutes (bx_tasks_budget). */
    protected function _budget($iContextId)
    {
        $aBudget = $this->_oModule->_oDb->getBudget(['sample' => 'context_id', 'context_id' => (int)$iContextId]);
        $iTotal = 60 * (int)($aBudget['value_total'] ?? 0);
        $iSpent = 60 * (int)($aBudget['value_spent'] ?? 0);
        $iRemaining = $iTotal - $iSpent;
        return [
            'context_id' => BxDolApiV2Map::id((int)$iContextId),
            'context' => BxDolApiV2Map::profileSummary((int)$iContextId),
            'total_seconds' => $iTotal,
            'spent_seconds' => $iSpent,
            'remaining_seconds' => $iRemaining,
            // as the site's summary works it out (BxTasksTemplate::getBlockBudget)
            'remaining_percent' => $iTotal > 0 ? round(100 * $iRemaining / $iTotal, 2) : null,
            'can_add' => $this->_contextAdmin($iContextId),
        ];
    }

    /** A TaskBudgetEntry of a budget track row: its value is in hours. */
    protected function _budgetEntry($aRow)
    {
        $iContextId = (int)$aRow['context_id'];
        $iAuthorId = (int)$aRow['profile_id'];
        $sNote = BxDolApiV2Map::text((string)$aRow['text']);
        $bManage = $this->_contextAdmin($iContextId);
        return [
            'id' => BxDolApiV2Map::id((int)$aRow['id']),
            'context_id' => BxDolApiV2Map::id($iContextId),
            'author' => $iAuthorId > 0 && BxDolProfile::getInstance($iAuthorId) ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'hours' => (int)$aRow['value'],
            'note' => $sNote !== '' ? $sNote : null,
            'created_at' => BxDolApiV2Map::date((int)$aRow['date']),
            'can_edit' => $bManage,
            'can_delete' => $bManage,
        ];
    }

    /** An entry's hours: a whole number, not 0, up to BUDGET_HOURS_MAX either way (422 otherwise). */
    protected function _budgetHours($mHours)
    {
        if (!is_int($mHours) || $mHours === 0 || abs($mHours) > self::BUDGET_HOURS_MAX)
            throw BxDolApiV2Problem::validation([['field' => 'hours', 'code' => 'invalid_value', 'message' => 'A whole number of hours, not 0, from -' . self::BUDGET_HOURS_MAX . ' to ' . self::BUDGET_HOURS_MAX]]);
        return $mHours;
    }

    /** An entry's note as the site keeps it: plain text, escaped (null: none). */
    protected function _budgetNote($mNote)
    {
        if ($mNote === null)
            return '';
        if (!is_string($mNote) || mb_strlen($mNote) > self::BUDGET_NOTE_MAX)
            throw BxDolApiV2Problem::validation([['field' => 'note', 'code' => 'invalid_value', 'message' => 'Plain text, up to ' . self::BUDGET_NOTE_MAX . ' characters']]);
        return htmlspecialchars(trim($mNote), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    /** The site's budget form with an entry's hours and note, checked as it checks them (422 with its message). */
    protected function _budgetForm($sDisplay, $aEntry, $iHours, $sNote)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $oForm = BxDolForm::getObjectInstance($CNF['OBJECT_FORM_BUDGET'], $sDisplay);
        if (!$oForm)
            throw new BxDolApiV2Problem(503, 'form_unavailable', 'The site\'s budget form is not there');
        $oForm->aFormAttrs['method'] = BX_DOL_FORM_METHOD_SPECIFIC;
        $oForm->aParams['csrf']['disable'] = true;
        $aValues = ['value' => (string)$iHours, 'text' => $sNote];
        $aValues += $this->_submitted($oForm);
        $oForm->initChecker($aEntry, $aValues);
        $this->_validForm($oForm, ['value' => 'hours', 'text' => 'note'], 'It was not saved');
        return $oForm;
    }

    /** A TimeRecord of a time track row. */
    protected function _timeRecord($aRow)
    {
        $iAuthorId = (int)$aRow['author_id'];
        return [
            'id' => BxDolApiV2Map::id((int)$aRow['id']),
            'task_id' => BxDolApiV2Map::id((int)$aRow['object_id']),
            'author' => $iAuthorId > 0 && BxDolProfile::getInstance($iAuthorId) ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'seconds' => 60 * (int)$aRow['value'],
            'date' => gmdate('Y-m-d', (int)($aRow['value_date'] ?: $aRow['date'])),
            'text' => (string)$aRow['text'] !== '' ? BxDolApiV2Map::text((string)$aRow['text']) : null,
            'created_at' => BxDolApiV2Map::date((int)$aRow['date']),
        ];
    }

    /** The viewer's TaskTimer of a timer row: running or paused, what it has counted until now. */
    protected function _timer($aTimer)
    {
        if (!$aTimer)
            return null;
        $iStarted = (int)$aTimer['started'];
        return [
            'state' => $iStarted > 0 ? 'running' : 'paused',
            'seconds' => (int)$aTimer['duration'] + ($iStarted > 0 ? max(0, time() - $iStarted) : 0),
            'started_at' => $iStarted > 0 ? BxDolApiV2Map::date($iStarted) : null,
        ];
    }

    /*
     * Mapping
     */

    /** A TaskList (id 0: the context's Inbox, whose `id` is null). */
    protected function _taskList($aList, $aCounts, $bAdd, $bEdit, $bDelete)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aList[$CNF['FIELD_LIST_ID']];
        $iViewerId = (int)bx_get_logged_profile_id();
        return [
            'id' => BxDolApiV2Map::idOrNull($iId),
            'context_id' => BxDolApiV2Map::id((int)$aList[$CNF['FIELD_LIST_CONTEXT_ID']]),
            'title' => $iId ? trim((string)$aList[$CNF['FIELD_LIST_TITLE']]) : BxDolApiV2Map::text(_t('_bx_tasks_txt_list_inbox')),
            'task_count' => (int)($aCounts[$iId]['total'] ?? 0),
            'open_count' => (int)($aCounts[$iId]['open'] ?? 0),
            'viewer' => $iViewerId ? [
                'can_add' => (bool)$bAdd,
                'can_edit' => $iId > 0 && $bEdit,
                'can_delete' => $iId > 0 && $bDelete,
            ] : null,
        ];
    }

    /**
     * A page's assignees and lists in one query each, and the profiles a page shows (authors,
     * assignees and contexts) at once.
     */
    protected function _primeMedia($aContents)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $this->_aAssignees = $this->_oModule->_oDb->getAssigneesByTasks(array_column($aContents, $CNF['FIELD_ID']));
        $this->_aLists = $this->_oModule->_oDb->getListsByIds(array_column($aContents, $CNF['FIELD_TASKLIST']));
        $aContexts = [];
        foreach ($aContents as $aContent)
            if (($iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']]) < 0)
                $aContexts[] = -$iPrivacy;
        BxDolApiV2Map::primeProfiles(array_merge(array_column($aContents, $CNF['FIELD_AUTHOR']), $aContexts, ...array_values($this->_aAssignees ?: [[]])));
        // the contexts' own types and labels, and the viewer's timers on these tasks
        $this->_primeContextValues($aContexts);
        if (($iViewerId = (int)bx_get_logged_profile_id()))
            $this->_aTimers = $this->_oModule->_oDb->getTimersOfProfile($iViewerId, array_column($aContents, $CNF['FIELD_ID'])) + array_fill_keys(array_map('intval', array_column($aContents, $CNF['FIELD_ID'])), null);
    }

    /**
     * A Task: what it is, where it is, who added it and who is assigned to it, when it is due,
     * its priority and state, and what the viewer may do with it.
     */
    protected function _item($aContent, $iViewerId)
    {
        $CNF = &$this->_oModule->_oConfig->CNF;
        $iId = (int)$aContent[$CNF['FIELD_ID']];
        $iAuthorId = (int)$aContent[$CNF['FIELD_AUTHOR']];
        $iPrivacy = (int)$aContent[$CNF['FIELD_ALLOW_VIEW_TO']];
        $iContextId = $iPrivacy < 0 ? -$iPrivacy : 0;
        $sHtml = (string)$aContent[$CNF['FIELD_TEXT']];
        $iListId = (int)$aContent[$CNF['FIELD_TASKLIST']];

        // a single answer reads its own (a page's are primed)
        if (!array_key_exists($iId, $this->_aAssignees))
            $this->_aAssignees += [$iId => $this->_oModule->_oDb->getAssigneesByTasks([$iId])[$iId] ?? []];
        if ($iListId && !array_key_exists($iListId, $this->_aLists))
            $this->_aLists += $this->_oModule->_oDb->getListsByIds([$iListId]);
        $aAssignees = $this->_aAssignees[$iId] ?? [];
        $aList = $iListId ? ($this->_aLists[$iListId] ?? null) : null;
        if ($iViewerId && !array_key_exists($iId, $this->_aTimers))
            $this->_aTimers += [$iId => $this->_oModule->_oDb->getTimersOfProfile($iViewerId, [$iId])[$iId] ?? null];

        $iChars = !empty($CNF['PARAM_CHARS_SUMMARY_PLAIN']) ? (int)getParam($CNF['PARAM_CHARS_SUMMARY_PLAIN']) : 0;
        $iAdded = (int)$aContent[$CNF['FIELD_ADDED']];
        $iChanged = (int)($aContent[$CNF['FIELD_CHANGED']] ?? 0);
        $iDue = (int)$aContent[$CNF['FIELD_DUE_DATE']];
        $oContext = $iContextId ? BxDolProfile::getInstance($iContextId) : null;

        $aViewer = null;
        if ($iViewerId) {
            $bEdit = $this->_oModule->checkAllowedEdit($aContent) === CHECK_ACTION_RESULT_ALLOWED;
            // the module's isAllowManage, from what the page read: its editors, the context's
            // administrators and its assignees (in a context: PATCH manages no other task)
            $bManage = $iContextId && ($bEdit || $this->_contextAdmin($iContextId) || in_array((int)$iViewerId, $aAssignees, true));
            $aViewer = [
                'can_edit' => $bEdit,
                'can_complete' => $bManage,
                'can_track_time' => $bManage && $this->_timeAllowed(),
                'can_delete' => $this->_bFull && $this->_oModule->checkAllowedDelete($aContent) === CHECK_ACTION_RESULT_ALLOWED,
                'can_comment' => false,
                'can_react' => false,
                'reaction' => null,
            ];
            if ($this->_bFull) {
                $aItemViewer = $this->_itemViewer($aContent);
                $aViewer['can_comment'] = $aItemViewer['can_comment'];
                $aViewer['can_react'] = $aItemViewer['can_react'];
                $aViewer['reaction'] = $aItemViewer['reaction'];
            }
        }

        return [
            'id' => BxDolApiV2Map::id($iId),
            'module' => $this->_oModule->getName(),
            'title' => trim((string)$aContent[$CNF['FIELD_TITLE']]),
            'summary' => BxDolApiV2Map::text($sHtml, $iChars > 0 ? $iChars : self::SUMMARY_LENGTH),
            'body_html' => $this->_bFull ? $sHtml : null,
            'context_id' => BxDolApiV2Map::idOrNull($iContextId),
            'context' => $oContext ? BxDolApiV2Map::profileSummary($iContextId) : null,
            'list_id' => BxDolApiV2Map::idOrNull($aList ? $iListId : 0),
            'list_title' => $iContextId ? ($aList ? trim((string)$aList[$CNF['FIELD_LIST_TITLE']]) : BxDolApiV2Map::text(_t('_bx_tasks_txt_list_inbox'))) : null,
            'author' => $iAuthorId > 0 ? BxDolApiV2Map::profileSummary($iAuthorId) : null,
            'assignees' => array_values(array_filter(array_map(function ($iProfileId) { return BxDolProfile::getInstance($iProfileId) ? BxDolApiV2Map::profileSummary($iProfileId) : null; }, $aAssignees))),
            'due_at' => $iDue > 0 ? BxDolApiV2Map::date($iDue) : null,
            'completed' => (bool)$aContent[$CNF['FIELD_COMPLETED']],
            'priority' => $this->_choice('priorities', (int)$aContent[$CNF['FIELD_PRIORITY']]),
            'state' => $this->_choice('states', (int)$aContent[$CNF['FIELD_STATE']]),
            'type' => $this->_type((int)$aContent[$CNF['FIELD_TYPE']], $iContextId),
            'estimate' => $this->_choice('estimates', (int)$aContent[$CNF['FIELD_ESTIMATE']]),
            'labels' => $this->_labels((int)$aContent[$CNF['FIELD_STICKERS']], $iContextId),
            'time_spent' => 60 * (int)($aContent[self::FIELD_TIME] ?? 0),
            'timer' => $iViewerId ? $this->_timer($this->_aTimers[$iId] ?? null) : null,
            'audience' => $this->_audience($iPrivacy),
            'moderation' => $this->_moderation($aContent),
            'stats' => [
                'comments' => (int)($aContent[$CNF['FIELD_COMMENTS']] ?? 0),
                'reactions' => $this->_reactionCount($aContent),
                'views' => (int)($aContent[$CNF['FIELD_VIEWS']] ?? 0),
            ],
            'content_id' => BxDolApiV2Map::idOrNull($this->_itemId($iId)),
            'url' => $this->_entryUrl($iId),
            'viewer' => $aViewer,
            'created_at' => BxDolApiV2Map::date($iAdded),
            'updated_at' => BxDolApiV2Map::date(max($iAdded, $iChanged)),
        ];
    }

    public static function schemas()
    {
        $aId = ['$ref' => '#/components/schemas/Id'];
        $aIdOrNull = ['oneOf' => [$aId, ['type' => 'null']]];
        $aCount = ['type' => 'integer', 'minimum' => 0];
        $aDate = ['type' => 'string', 'format' => 'date-time'];
        $aChoiceOrNull = ['oneOf' => [['$ref' => '#/components/schemas/TaskChoice'], ['type' => 'null']]];
        $aAssignees = ['type' => 'array', 'maxItems' => self::MAX_ASSIGNEES, 'items' => $aId];
        $aTitle = ['type' => 'string', 'minLength' => self::TITLE_MIN, 'maxLength' => self::TITLE_MAX, 'description' => 'As the site\'s form takes it (its own checks apply too: 422 with its message)'];

        return [
            'TaskChoice' => [
                'type' => 'object',
                'description' => 'A type, priority, estimate, state or label the site offers a task (its form\'s pre-values, in the viewer\'s language; a context\'s own types and labels where it has them).',
                'required' => ['id', 'title'],
                'properties' => [
                    'id' => $aId,
                    'title' => ['type' => 'string'],
                    'done' => ['type' => 'boolean', 'description' => 'States only: whether the site counts a task in it as done (Cancelled, Duplicate, Done)'],
                    'points' => ['type' => 'integer', 'minimum' => 0, 'description' => 'Estimates only: its points (the site\'s task list shows a point as an hour)'],
                    'color' => ['type' => ['string', 'null'], 'description' => 'Labels only: a CSS colour (#hex, rgb() or rgba()) the context gave it; null for none'],
                ],
            ],
            'TaskIdList' => ['type' => 'string', 'pattern' => '^[1-9][0-9]{0,9}(,[1-9][0-9]{0,9}){0,49}$', 'description' => 'Ids of GET /tasks/choices, comma-separated: a task with any of them'],
            'TaskTimer' => [
                'type' => 'object',
                'description' => 'The viewer\'s timer on a task.',
                'required' => ['state', 'seconds', 'started_at'],
                'properties' => [
                    'state' => ['type' => 'string', 'enum' => ['running', 'paused']],
                    'seconds' => $aCount + ['description' => 'What it has counted, until the answer was made'],
                    'started_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'When it was (re)started; null while paused'],
                ],
            ],
            'TaskViewer' => [
                'type' => 'object',
                'required' => ['can_edit', 'can_complete', 'can_track_time', 'can_delete', 'can_comment', 'can_react', 'reaction'],
                'properties' => [
                    'can_edit' => ['type' => 'boolean', 'description' => 'May change its title and text (its author, moderators)'],
                    'can_track_time' => ['type' => 'boolean', 'description' => 'May run a timer on it and log time (who may complete it, where the site lets them log time)'],
                    'can_complete' => ['type' => 'boolean', 'description' => 'May complete or reopen it, and change its list, priority, state, due date and assignees (its author, moderators, the context\'s administrators and its assignees; false for one in no context)'],
                    'can_delete' => ['type' => 'boolean', 'description' => 'Read on single answers only (false in lists)'],
                    'can_comment' => ['type' => 'boolean', 'description' => 'Read on single answers only (false in lists)'],
                    'can_react' => ['type' => 'boolean', 'description' => 'Read on single answers only (false in lists)'],
                    'reaction' => ['type' => ['string', 'null'], 'description' => 'The viewer\'s reaction; read on single answers only (null in lists)'],
                ],
            ],
            'TaskStats' => [
                'type' => 'object',
                'required' => ['comments', 'reactions', 'views'],
                'properties' => ['comments' => $aCount, 'reactions' => $aCount, 'views' => $aCount],
            ],
            'Task' => [
                'type' => 'object',
                'description' => 'A task. Its comments and reactions are those of the Item `content_id`.',
                'required' => ['id', 'module', 'title', 'summary', 'body_html', 'context_id', 'context', 'list_id', 'list_title', 'author', 'assignees', 'due_at', 'completed', 'priority', 'state', 'type', 'estimate', 'labels', 'time_spent', 'timer', 'audience', 'moderation', 'stats', 'content_id', 'url', 'viewer', 'created_at', 'updated_at'],
                'properties' => [
                    'id' => $aId,
                    'module' => ['type' => 'string', 'example' => 'bx_tasks'],
                    'title' => ['type' => 'string'],
                    'summary' => ['type' => 'string', 'description' => 'The start of its text, as plain text'],
                    'body_html' => ['type' => ['string', 'null'], 'description' => 'Its text as the site keeps it (user HTML the site filtered: sanitize it again before showing it). Only on single answers; null in lists'],
                    'context_id' => $aIdOrNull + ['description' => 'The group (or other context) it is in; null for one added outside any on the site'],
                    'context' => BxDolApiV2Map::profileOrNullSchema() + ['description' => 'That context'],
                    'list_id' => $aIdOrNull + ['description' => 'Its list in the context; null: the context\'s Inbox (or no context)'],
                    'list_title' => ['type' => ['string', 'null'], 'description' => 'Its list\'s title, the Inbox\'s as the site names it; null for one in no context'],
                    'author' => BxDolApiV2Map::profileOrNullSchema(),
                    'assignees' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Profile'], 'description' => 'Who it is assigned to, the first assigned first'],
                    'due_at' => ['type' => ['string', 'null'], 'format' => 'date-time', 'description' => 'When it is due; null for no due date'],
                    'completed' => ['type' => 'boolean'],
                    'priority' => $aChoiceOrNull,
                    'state' => $aChoiceOrNull + ['description' => 'Its state on the context\'s board (Backlog, To do ...). Completing it does not change it, as on the site'],
                    'type' => $aChoiceOrNull + ['description' => 'Bug, Feature ... (the context\'s own where it has them)'],
                    'estimate' => $aChoiceOrNull + ['description' => 'Its estimate in points (`points`)'],
                    'labels' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice'], 'description' => 'Its labels (the site\'s stickers; the context\'s own, with their colours, where it has them)'],
                    'time_spent' => $aCount + ['description' => 'All the time logged on it, in seconds (whole minutes)'],
                    'timer' => ['oneOf' => [['$ref' => '#/components/schemas/TaskTimer'], ['type' => 'null']], 'description' => 'The viewer\'s timer on it; null for none (and for guests)'],
                    'audience' => ['$ref' => '#/components/schemas/Audience'],
                    'moderation' => ['$ref' => '#/components/schemas/Moderation'],
                    'stats' => ['$ref' => '#/components/schemas/TaskStats'],
                    'content_id' => $aIdOrNull + ['description' => 'The Item that shows it in the feeds, whose comments and reactions are its; null when the Timeline shows none'],
                    'url' => ['type' => ['string', 'null'], 'format' => 'uri', 'description' => 'Its page on the site'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/TaskViewer'], ['type' => 'null']], 'description' => 'What the viewer may do; null for guests'],
                    'created_at' => $aDate,
                    'updated_at' => $aDate,
                ],
            ],
            'Page_Task' => BxDolApiV2Map::pageSchema('Task'),
            'TaskListViewer' => [
                'type' => 'object',
                'required' => ['can_add', 'can_edit', 'can_delete'],
                'properties' => [
                    'can_add' => ['type' => 'boolean', 'description' => 'May add tasks to it'],
                    'can_edit' => ['type' => 'boolean', 'description' => 'May rename it (false for the Inbox)'],
                    'can_delete' => ['type' => 'boolean', 'description' => 'May delete it with its tasks (the context\'s administrators; false for the Inbox)'],
                ],
            ],
            'TaskList' => [
                'type' => 'object',
                'description' => 'A context\'s task list; `id` null is its Inbox, the tasks in no list.',
                'required' => ['id', 'context_id', 'title', 'task_count', 'open_count', 'viewer'],
                'properties' => [
                    'id' => $aIdOrNull,
                    'context_id' => $aId,
                    'title' => ['type' => 'string'],
                    'task_count' => $aCount + ['description' => 'Its active tasks'],
                    'open_count' => $aCount + ['description' => 'Those not completed'],
                    'viewer' => ['oneOf' => [['$ref' => '#/components/schemas/TaskListViewer'], ['type' => 'null']], 'description' => 'null for guests'],
                ],
            ],
            'TaskLists' => [
                'type' => 'object',
                'required' => ['context_id', 'items', 'can_add_lists', 'priorities', 'states'],
                'properties' => [
                    'context_id' => $aId,
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskList'], 'description' => 'The Inbox first, then the lists in the order they were made'],
                    'can_add_lists' => ['type' => 'boolean'],
                    'priorities' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                    'states' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                ],
            ],
            'NewTaskList' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['context_id', 'title'],
                'properties' => [
                    'context_id' => $aId,
                    'title' => $aTitle,
                ],
            ],
            'TaskListChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['title'],
                'properties' => [
                    'title' => $aTitle,
                ],
            ],
            'NewTask' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['context_id', 'title'],
                'properties' => [
                    'context_id' => $aId,
                    'list_id' => $aIdOrNull + ['description' => 'One of the context\'s lists; null or left out: its Inbox'],
                    'title' => $aTitle,
                    'body' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Plain text: each line a paragraph'],
                    'due_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
                    'assignee_ids' => ['oneOf' => [$aAssignees, ['type' => 'null']], 'description' => 'Members of the context; the viewer alone by default, [] for nobody'],
                    'priority_id' => $aIdOrNull + ['description' => 'GET /tasks/choices `priorities`'],
                    'type_id' => $aIdOrNull + ['description' => 'GET /tasks/choices?context_id= `types`'],
                    'estimate_id' => $aIdOrNull,
                    'state_id' => $aIdOrNull + ['description' => 'Backlog by default as on the site; a done one adds it completed'],
                    'label_ids' => ['type' => 'array', 'maxItems' => 31, 'items' => $aId, 'description' => 'GET /tasks/choices?context_id= `labels`'],
                ],
            ],
            'TaskChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'Fields to change; omitted ones stay, and so do nulls but for `due_at`, `list_id` (the Inbox), `priority_id`, `type_id` and `estimate_id`, where null is none.',
                'properties' => [
                    'title' => ['type' => ['string', 'null']] + $aTitle,
                    'body' => ['type' => ['string', 'null'], 'maxLength' => 50000, 'description' => 'Replaces the whole text: plain text, each line a paragraph'],
                    'completed' => ['type' => ['boolean', 'null']],
                    'list_id' => $aIdOrNull,
                    'priority_id' => $aIdOrNull + ['description' => 'null: none'],
                    'type_id' => $aIdOrNull + ['description' => 'null: none'],
                    'estimate_id' => $aIdOrNull + ['description' => 'null: none'],
                    'label_ids' => ['type' => ['array', 'null'], 'maxItems' => 31, 'items' => $aId, 'description' => 'Replacing those it has; [] for none'],
                    'state_id' => $aIdOrNull + ['description' => 'GET /tasks/choices `states`; a done one completes the task, another one reopens it'],
                    'due_at' => ['type' => ['string', 'null'], 'format' => 'date-time'],
                    'assignee_ids' => ['oneOf' => [$aAssignees, ['type' => 'null']], 'description' => 'Members of the context, replacing those it has; [] for nobody'],
                ],
            ],
            'TaskChoices' => [
                'type' => 'object',
                'required' => ['context_id', 'types', 'priorities', 'estimates', 'states', 'labels'],
                'properties' => [
                    'context_id' => $aIdOrNull,
                    'types' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                    'priorities' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice'], 'description' => 'The most urgent first'],
                    'estimates' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                    'states' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                    'labels' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskChoice']],
                ],
            ],
            'TaskFacetBucket' => [
                'type' => 'object',
                'required' => ['id', 'count', 'open'],
                'properties' => [
                    'id' => $aIdOrNull + ['description' => 'The value (a choice, a profile); null for none'],
                    'count' => $aCount,
                    'open' => $aCount + ['description' => 'Those not completed'],
                ],
            ],
            'TaskListBucket' => [
                'type' => 'object',
                'required' => ['context_id', 'id', 'count', 'open'],
                'properties' => [
                    'context_id' => $aIdOrNull,
                    'id' => $aIdOrNull + ['description' => 'The list; null for the context\'s Inbox'],
                    'count' => $aCount,
                    'open' => $aCount,
                ],
            ],
            'TaskFacets' => [
                'type' => 'object',
                'description' => 'How many tasks a list has, open and completed, by each property.',
                'required' => ['total', 'open', 'completed', 'states', 'priorities', 'types', 'estimates', 'labels', 'lists', 'contexts', 'assignees'],
                'properties' => [
                    'total' => $aCount,
                    'open' => $aCount,
                    'completed' => $aCount,
                    'states' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket']],
                    'priorities' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket']],
                    'types' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket']],
                    'estimates' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket']],
                    'labels' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket'], 'description' => 'A task under each of its labels; null: those with none'],
                    'lists' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskListBucket']],
                    'contexts' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket']],
                    'assignees' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFacetBucket'], 'description' => 'A task under each of its assignees'],
                ],
            ],
            'TaskFilter' => [
                'type' => 'object',
                'required' => ['id', 'title', 'kind'],
                'properties' => [
                    'id' => $aId,
                    'title' => ['type' => 'string'],
                    'kind' => ['type' => 'string', 'enum' => ['system', 'context', 'mine'], 'description' => 'The site\'s, the context\'s for everyone, or the viewer\'s own'],
                ],
            ],
            'TaskFilters' => [
                'type' => 'object',
                'required' => ['context_id', 'items'],
                'properties' => [
                    'context_id' => $aIdOrNull,
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskFilter']],
                ],
            ],
            'TaskListCount' => [
                'type' => 'object',
                'required' => ['id', 'title', 'task_count', 'open_count'],
                'properties' => [
                    'id' => $aIdOrNull + ['description' => 'null: the Inbox'],
                    'title' => ['type' => 'string'],
                    'task_count' => $aCount,
                    'open_count' => $aCount,
                ],
            ],
            'TaskContext' => [
                'type' => 'object',
                'required' => ['context', 'module', 'module_title', 'task_count', 'open_count', 'lists', 'can_view_budget'],
                'properties' => [
                    'context' => ['$ref' => '#/components/schemas/Profile'],
                    'module' => ['type' => 'string', 'example' => 'bx_groups'],
                    'module_title' => ['type' => 'string', 'description' => 'Its kind as the site names it (Groups, Spaces ...)'],
                    'task_count' => $aCount + ['description' => 'Its active tasks'],
                    'open_count' => $aCount,
                    'lists' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskListCount'], 'description' => 'The Inbox first, then its lists in the order they were made'],
                    'can_view_budget' => ['type' => 'boolean', 'description' => 'May see and change its budget (GET /task-contexts/{id}/budget): its administrators and the site\'s'],
                ],
            ],
            'TaskBudget' => [
                'type' => 'object',
                'description' => 'A context\'s budget of time (the module\'s bx_tasks_budget, kept in minutes): what its entries add, what is logged on its tasks.',
                'required' => ['context_id', 'context', 'total_seconds', 'spent_seconds', 'remaining_seconds', 'remaining_percent', 'can_add'],
                'properties' => [
                    'context_id' => $aId,
                    'context' => ['$ref' => '#/components/schemas/Profile'],
                    'total_seconds' => ['type' => 'integer', 'description' => 'What its entries add (their hours); below 0 when they take off more than they add'],
                    'spent_seconds' => ['type' => 'integer', 'description' => 'The time logged on the context\'s tasks since it has a budget'],
                    'remaining_seconds' => ['type' => 'integer', 'description' => 'total less spent: below 0 when more is spent'],
                    'remaining_percent' => ['type' => ['number', 'null'], 'description' => 'remaining of total, in percent (two decimals; below 0 when more is spent); null while the total is not above 0'],
                    'can_add' => ['type' => 'boolean', 'description' => 'May add entries (POST .../budget/entries)'],
                ],
            ],
            'TaskBudgetEntry' => [
                'type' => 'object',
                'description' => 'Hours added to (or taken off) a context\'s budget.',
                'required' => ['id', 'context_id', 'author', 'hours', 'note', 'created_at', 'can_edit', 'can_delete'],
                'properties' => [
                    'id' => $aId,
                    'context_id' => $aId,
                    'author' => BxDolApiV2Map::profileOrNullSchema() + ['description' => 'Who added it'],
                    'hours' => ['type' => 'integer', 'description' => 'Whole hours; below 0 takes hours off'],
                    'note' => ['type' => ['string', 'null'], 'description' => 'Plain text'],
                    'created_at' => $aDate,
                    'can_edit' => ['type' => 'boolean'],
                    'can_delete' => ['type' => 'boolean'],
                ],
            ],
            'Page_TaskBudgetEntry' => BxDolApiV2Map::pageSchema('TaskBudgetEntry'),
            'NewTaskBudgetEntry' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['hours'],
                'properties' => [
                    'hours' => ['type' => 'integer', 'minimum' => -self::BUDGET_HOURS_MAX, 'maximum' => self::BUDGET_HOURS_MAX, 'description' => 'Whole hours, not 0; below 0 takes hours off'],
                    'note' => ['type' => ['string', 'null'], 'maxLength' => self::BUDGET_NOTE_MAX, 'description' => 'Plain text'],
                ],
            ],
            'TaskBudgetEntryChanges' => [
                'type' => 'object',
                'additionalProperties' => false,
                'description' => 'What to change; what is left out stays.',
                'properties' => [
                    'hours' => ['type' => 'integer', 'minimum' => -self::BUDGET_HOURS_MAX, 'maximum' => self::BUDGET_HOURS_MAX],
                    'note' => ['type' => ['string', 'null'], 'maxLength' => self::BUDGET_NOTE_MAX, 'description' => 'null or empty: none'],
                ],
            ],
            'TaskContexts' => [
                'type' => 'object',
                'required' => ['items'],
                'properties' => [
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TaskContext'], 'description' => 'By kind, then by name'],
                ],
            ],
            'TaskTimers' => [
                'type' => 'object',
                'required' => ['items', 'total_seconds'],
                'properties' => [
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/Task'], 'description' => 'Each with its `timer`, the running one first'],
                    'total_seconds' => $aCount + ['description' => 'What they have counted together'],
                ],
            ],
            'TimerAction' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['action'],
                'properties' => [
                    'action' => ['type' => 'string', 'enum' => ['start', 'pause', 'resume', 'clear', 'log']],
                ],
            ],
            'TimeRecord' => [
                'type' => 'object',
                'description' => 'Time logged on a task.',
                'required' => ['id', 'task_id', 'author', 'seconds', 'date', 'text', 'created_at'],
                'properties' => [
                    'id' => $aId,
                    'task_id' => $aId,
                    'author' => BxDolApiV2Map::profileOrNullSchema(),
                    'seconds' => $aCount + ['description' => 'Whole minutes'],
                    'date' => ['type' => 'string', 'format' => 'date', 'description' => 'The day it was spent on'],
                    'text' => ['type' => ['string', 'null'], 'description' => 'Its note, as plain text'],
                    'created_at' => $aDate,
                ],
            ],
            'TaskTime' => [
                'type' => 'object',
                'required' => ['items', 'total_seconds', 'viewer_seconds', 'all', 'can_add'],
                'properties' => [
                    'items' => ['type' => 'array', 'items' => ['$ref' => '#/components/schemas/TimeRecord'], 'description' => 'The latest first'],
                    'total_seconds' => $aCount + ['description' => 'All the time logged on the task'],
                    'viewer_seconds' => $aCount + ['description' => 'The viewer\'s'],
                    'all' => ['type' => 'boolean', 'description' => 'Whether `items` are everyone\'s (the site\'s report_view check); else the viewer\'s own'],
                    'can_add' => ['type' => 'boolean', 'description' => 'May log time (POST /tasks/{id}/time)'],
                ],
            ],
            'NewTimeRecord' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['minutes'],
                'properties' => [
                    'minutes' => ['type' => 'integer', 'minimum' => 1, 'maximum' => self::MAX_TIME_MINUTES],
                    'date' => ['type' => ['string', 'null'], 'format' => 'date', 'description' => 'The day it was spent on; today by default'],
                    'text' => ['type' => ['string', 'null'], 'maxLength' => 2000, 'description' => 'A note, plain text'],
                ],
            ],
        ];
    }
}

/** @} */
