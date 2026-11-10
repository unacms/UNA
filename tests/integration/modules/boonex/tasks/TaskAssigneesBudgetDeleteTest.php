<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * Three places where Tasks read or counted the wrong thing:
 *
 * - An expired (or completed) task told the wrong profiles. An assignment is a connection whose
 *   initiator is the assignee and whose content is the task; the alerts read the connection the
 *   other way round, so the assignees were not told, and the tasks assigned to the profile whose
 *   id happens to equal the task's id were taken for profiles to tell.
 * - Deleting a budget entry took its hours off a total that is kept in minutes.
 * - The delete check never counted the action: it gave its parent `false` whatever it was asked.
 *
 * The test makes its own task, assignments and budget rows and removes them, with the line
 * that completing a task writes to its activity. While a test records alerts, no other handler
 * runs, so nothing is notified or mailed.
 */
#[Group('integration')]
class TaskAssigneesBudgetDeleteTest extends BxDolIntegrationTestCase
{
    protected $_iAuthor = 0;
    protected $_aTaskIds = [];
    protected $_aAssignmentIds = [];
    protected $_iBudgetContext = 0;
    protected $_aAlertsCacheBackup = null;
    protected $_mProfileIdBackup = null;
    protected $_oAclBackup = null;

    protected function setUp(): void
    {
        parent::setUp();

        if (!BxDolModuleQuery::getInstance()->isEnabledByName('bx_tasks'))
            $this->markTestSkipped('Tasks are not installed.');

        $this->bxLoginAsAdmin();
        $this->_iAuthor = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $this->_iAuthor);

        // a module keeps the profile it was created for, which an earlier test may have logged in as
        $this->_mProfileIdBackup = BxDolModule::getInstance('bx_tasks')->setProfileId($this->_iAuthor);

        BxTestTaskAlertsRecorder::$aSeen = [];
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_aAssignmentIds)
            $oDb->query("DELETE FROM `bx_tasks_assignments` WHERE `id` IN (" . implode(',', array_map('intval', $this->_aAssignmentIds)) . ")");
        if ($this->_aTaskIds) {
            $sTasks = implode(',', array_map('intval', $this->_aTaskIds));
            // the lines complete() logs to a task's activity are its comments
            $oDb->query("DELETE FROM `sys_cmts_ids` WHERE `system_id` IN (SELECT `ID` FROM `sys_objects_cmts` WHERE `Name` = 'bx_tasks') AND `cmt_id` IN (SELECT `cmt_id` FROM `bx_tasks_cmts` WHERE `cmt_object_id` IN (" . $sTasks . "))");
            $oDb->query("DELETE FROM `bx_tasks_cmts` WHERE `cmt_object_id` IN (" . $sTasks . ")");
            $oDb->query("DELETE FROM `bx_tasks_tasks` WHERE `id` IN (" . $sTasks . ")");
        }
        if ($this->_iBudgetContext) {
            $oDb->query("DELETE FROM `bx_tasks_budget_track` WHERE `context_id` = :c", ['c' => $this->_iBudgetContext]);
            $oDb->query("DELETE FROM `bx_tasks_budget` WHERE `context_id` = :c", ['c' => $this->_iBudgetContext]);
        }

        if ($this->_aAlertsCacheBackup !== null) {
            (new ReflectionProperty(BxDolAlerts::class, '_aCacheData'))->setValue(null, $this->_aAlertsCacheBackup);
            $this->_aAlertsCacheBackup = null;
        }
        if ($this->_oAclBackup !== null) {
            $GLOBALS['bxDolClasses']['BxDolAcl'] = $this->_oAclBackup;
            $this->_oAclBackup = null;
        }
        if ($this->_mProfileIdBackup !== null)
            BxDolModule::getInstance('bx_tasks')->setProfileId($this->_mProfileIdBackup);

        parent::tearDown();
    }

    public function testAnExpiredTaskTellsItsAssignees(): void
    {
        list($iTask, $aAssignees) = $this->addAssignedTask('expired');

        $this->recordTaskAlerts();
        BxDolModule::getInstance('bx_tasks')->onExpired($iTask);

        $this->assertSame($aAssignees, $this->toldOf('expired', $iTask));
    }

    public function testACompletedOrReopenedTaskTellsItsAuthorAndItsAssigneesOnce(): void
    {
        // the author is assigned too: told as the author, and not again as an assignee
        list($iTask, $aAssignees) = $this->addAssignedTask('completed');
        $this->assertContains($this->_iAuthor, $aAssignees);

        $this->recordTaskAlerts();
        $oModule = BxDolModule::getInstance('bx_tasks');

        $oModule->complete($iTask, 1);
        $this->assertSame($aAssignees, $this->toldOf('completed', $iTask));
        $this->assertSame([], $this->toldOf('reopened', $iTask));
        $this->assertSame(1, (int)BxDolDb::getInstance()->getOne("SELECT `completed` FROM `bx_tasks_tasks` WHERE `id` = :id", ['id' => $iTask]));

        BxTestTaskAlertsRecorder::$aSeen = [];
        $oModule->complete($iTask, 0);
        $this->assertSame($aAssignees, $this->toldOf('reopened', $iTask));
        $this->assertSame([], $this->toldOf('completed', $iTask));
    }

    public function testDeletingABudgetEntryTakesItsHoursOffTheMinutes(): void
    {
        $oDb = BxDolDb::getInstance();
        $this->_iBudgetContext = 900000000 + random_int(1, 99999);

        // 10 hours in all, kept in minutes, 4 of them from this entry
        $oDb->query("INSERT INTO `bx_tasks_budget` (`context_id`, `value_total`, `value_spent`) VALUES (:c, 600, 0)", ['c' => $this->_iBudgetContext]);
        $oDb->query("INSERT INTO `bx_tasks_budget_track` (`context_id`, `profile_id`, `value`, `text`, `date`) VALUES (:c, :p, 4, 'TaskAssigneesBudgetDeleteTest', :d)", [
            'c' => $this->_iBudgetContext, 'p' => $this->_iAuthor, 'd' => time(),
        ]);
        $iTrack = (int)$oDb->lastId();

        $oGrid = BxDolGrid::getObjectInstance('bx_tasks_budget_context_administration');
        $this->assertNotFalse($oGrid);
        $oGrid->setContextPid($this->_iBudgetContext);
        $this->assertNotEmpty((new ReflectionMethod($oGrid, '_delete'))->invoke($oGrid, $iTrack));

        $this->assertSame(0, (int)$oDb->getOne("SELECT COUNT(*) FROM `bx_tasks_budget_track` WHERE `id` = :id", ['id' => $iTrack]));
        $this->assertSame(360, (int)$oDb->getOne("SELECT `value_total` FROM `bx_tasks_budget` WHERE `context_id` = :c", ['c' => $this->_iBudgetContext]));
    }

    public function testTheDeleteCheckCountsTheActionOnlyWhenAsked(): void
    {
        $iTask = $this->addTask('delete check');
        $oModule = BxDolModule::getInstance('bx_tasks');
        $aTask = $oModule->_oDb->getContentInfoById($iTask);
        $this->assertNotEmpty($aTask);

        $oAcl = $this->recordAclChecks();

        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $oModule->checkAllowedDelete($aTask));
        $this->assertNotEmpty($oAcl->aChecks, 'the check asks the ACL');
        $this->assertNotContains(true, array_column($oAcl->aChecks, 'perform'), 'a check alone counts nothing');

        $oAcl->aChecks = [];
        $this->assertSame(CHECK_ACTION_RESULT_ALLOWED, $oModule->checkAllowedDelete($aTask, true));
        $this->assertContains(true, array_column($oAcl->aChecks, 'perform'), 'a delete is counted');
    }

    /**
     * A task assigned to active profiles (its author, and another one where the site has one),
     * with a row that reads as an assignment only the wrong way round: [task id, the assignees' ids in order].
     */
    protected function addAssignedTask(string $sTitle): array
    {
        $iTask = $this->addTask($sTitle);
        $iOther = $this->addTask($sTitle . ', another');

        $aAssignees = [$this->_iAuthor];
        $iSecond = (int)BxDolDb::getInstance()->getOne("SELECT `id` FROM `sys_profiles` WHERE `status` = 'active' AND `type` <> 'system' AND `id` <> :id ORDER BY `id` LIMIT 1", ['id' => $this->_iAuthor]);
        if ($iSecond)
            $aAssignees[] = $iSecond;
        sort($aAssignees);

        foreach ($aAssignees as $iAssignee)
            $this->assign($iAssignee, $iTask);
        // read the other way round, this row makes the other task a profile to tell: it says
        // the profile whose id is this task's id is assigned to that task
        $this->assign($iTask, $iOther);

        return [$iTask, $aAssignees];
    }

    /** The profiles the recorded alerts of this action and task were for, in order; one twice if told twice. */
    protected function toldOf(string $sAction, int $iTask): array
    {
        $aTold = array_column(array_filter(BxTestTaskAlertsRecorder::$aSeen, function ($a) use ($sAction, $iTask) {
            return $a['unit'] === 'bx_tasks' && $a['action'] === $sAction && $a['object'] === $iTask;
        }), 'profile');
        sort($aTold);

        return $aTold;
    }

    protected function addTask(string $sTitle): int
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_tasks_tasks` SET `author` = :author, `added` = :now, `changed` = :now, `published` = :now, `thumb` = 0, `title` = :title, `cat` = 0, `multicat` = '', `text` = '', `labels` = '', `due_date` = 0, `tasks_list` = 0, `allow_view_to` = :view", [
            'author' => $this->_iAuthor,
            'now' => $iNow,
            'title' => 'TaskAssigneesBudgetDeleteTest ' . $sTitle,
            'view' => (string)BX_DOL_PG_ALL,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aTaskIds[] = $iId;

        return $iId;
    }

    protected function assign(int $iProfile, int $iTask): void
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_tasks_assignments` (`initiator`, `content`, `added`) VALUES (:p, :t, :now)", ['p' => $iProfile, 't' => $iTask, 'now' => time()]);
        $this->_aAssignmentIds[] = (int)$oDb->lastId();
    }

    /**
     * Send the tasks' alerts about a task (expired, completed, reopened) to the recorder. No
     * other handler of any alert runs until tearDown: completing a task also adds a line to its
     * activity, which alerts too.
     */
    protected function recordTaskAlerts(): void
    {
        // the cache is filled by the first alert
        new BxDolAlerts('system', 'phpunit_init', 0, 0);

        $oProp = new ReflectionProperty(BxDolAlerts::class, '_aCacheData');
        $this->_aAlertsCacheBackup = $oProp->getValue();
        $aCache = $this->_aAlertsCacheBackup;

        $sId = 'phpunit_task_alerts';
        $aCache['handlers'][$sId] = [
            'name' => $sId,
            'class' => BxTestTaskAlertsRecorder::class,
            'file' => 'tests/integration/modules/boonex/tasks/TaskAssigneesBudgetDeleteTest.php',
            'service_call' => '',
            'active' => 1,
        ];
        $aCache['alerts'] = ['bx_tasks' => array_fill_keys(['expired', 'completed', 'reopened'], [$sId])];
        $oProp->setValue(null, $aCache);
    }

    /**
     * Put an ACL in place that notes each check and counts none of them.
     */
    protected function recordAclChecks(): BxTestTaskRecordingAcl
    {
        $this->_oAclBackup = BxDolAcl::getInstance();
        $oAcl = BxTestTaskRecordingAcl::make();
        $GLOBALS['bxDolClasses']['BxDolAcl'] = $oAcl;

        return $oAcl;
    }
}

class BxTestTaskAlertsRecorder
{
    public static $aSeen = [];

    public function response($oAlert)
    {
        self::$aSeen[] = [
            'unit' => (string)$oAlert->sUnit,
            'action' => (string)$oAlert->sAction,
            'object' => (int)$oAlert->iObject,
            'profile' => (int)($oAlert->aExtras['object_author_id'] ?? 0),
        ];
    }
}

class BxTestTaskRecordingAcl extends BxTemplAcl
{
    public $aChecks = [];

    public static function make(): self
    {
        return new self();
    }

    public function checkAction($iProfileId, $iActionId, $bPerformAction = false)
    {
        $this->aChecks[] = ['action' => (int)$iActionId, 'perform' => (bool)$bPerformAction];

        return parent::checkAction($iProfileId, $iActionId, false);
    }
}
