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
 * The test makes its own task, assignments and budget rows and removes them. Alerts of the task
 * go to a recorder only, so nothing is notified or mailed.
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
        if ($this->_aTaskIds)
            $oDb->query("DELETE FROM `bx_tasks_tasks` WHERE `id` IN (" . implode(',', array_map('intval', $this->_aTaskIds)) . ")");
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
        $iTask = $this->addTask('expired');
        $iOther = $this->addTask('another');
        // assignees are active profiles: the author, and another one where the site has one
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

        $this->recordTaskAlerts(['expired']);
        BxDolModule::getInstance('bx_tasks')->onExpired($iTask);

        $aTold = array_column(array_filter(BxTestTaskAlertsRecorder::$aSeen, function ($a) use ($iTask) {
            return $a['action'] === 'expired' && $a['object'] === $iTask;
        }), 'profile');
        sort($aTold);
        $this->assertSame($aAssignees, $aTold);
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
     * Send the task alerts of these actions to the recorder, and to nothing else.
     */
    protected function recordTaskAlerts(array $aActions): void
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
        foreach ($aActions as $sAction)
            $aCache['alerts']['bx_tasks'][$sAction] = [$sId];
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
