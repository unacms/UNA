<?php

use PHPUnit\Framework\Attributes\Group;

/**
 * A list id in the URL has to belong to the context that passed the permission check
 * (GHSA-8vcm-w38h-mh3f). Managing one context must not rename or delete another
 * context's task or resource list, or file a new entry into it.
 *
 * The admin passes the context permission check for every profile, which is the same
 * gap a member has on a group they administer. The test makes its own lists and removes them.
 */
#[Group('integration')]
class ListContextBindingTest extends BxDolIntegrationTestCase
{
    protected $_bTasks = false;
    protected $_bResources = false;
    protected $_iOwn = 0;
    protected $_iOther = 0;
    protected $_sMark = '';
    protected $_aTaskListIds = [];
    protected $_aTaskIds = [];
    protected $_aResourceListIds = [];
    protected $_aResourceIds = [];
    protected $_aProfileIdBackup = [];

    protected function setUp(): void
    {
        parent::setUp();

        $oModules = BxDolModuleQuery::getInstance();
        $this->_bTasks = $oModules->isEnabledByName('bx_tasks');
        $this->_bResources = $oModules->isEnabledByName('bx_resources');
        if (!$this->_bTasks && !$this->_bResources)
            $this->markTestSkipped('Neither Tasks nor Resources is installed.');

        $this->bxLoginAsAdmin();
        $this->_iOwn = (int)bx_get_logged_profile_id();
        $this->assertGreaterThan(0, $this->_iOwn);

        // A module keeps the profile it was created for, which an earlier test may have logged in as.
        $aModules = ['bx_persons', 'bx_tasks', 'bx_resources'];
        foreach ($aModules as $sModule) {
            if (!$oModules->isEnabledByName($sModule))
                continue;

            $oModule = BxDolModule::getInstance($sModule);
            $this->_aProfileIdBackup[$sModule] = $oModule->setProfileId($this->_iOwn);
        }

        $iOther = (int)BxDolProfileQuery::getInstance()->getCurrentProfileByAccount($this->bxAccount('user')->id(), false);
        if ($iOther <= 0 || $iOther === $this->_iOwn)
            $iOther = $this->_iOwn + 900000;
        $this->_iOther = $iOther;

        $this->_sMark = 'ListContextBindingTest ' . uniqid();
    }

    protected function tearDown(): void
    {
        $oDb = BxDolDb::getInstance();
        if ($this->_bTasks) {
            if ($this->_aTaskIds)
                $oDb->query("DELETE FROM `bx_tasks_tasks` WHERE `id` IN (" . $this->bxIdList($this->_aTaskIds) . ")");
            if ($this->_aTaskListIds)
                $oDb->query("DELETE FROM `bx_tasks_lists` WHERE `id` IN (" . $this->bxIdList($this->_aTaskListIds) . ")");
        }
        if ($this->_bResources) {
            if ($this->_aResourceIds)
                $oDb->query("DELETE FROM `bx_resources_entries` WHERE `id` IN (" . $this->bxIdList($this->_aResourceIds) . ")");
            if ($this->_aResourceListIds)
                $oDb->query("DELETE FROM `bx_resources_lists` WHERE `id` IN (" . $this->bxIdList($this->_aResourceListIds) . ")");
        }

        foreach ($this->_aProfileIdBackup as $sModule => $iProfileId)
            BxDolModule::getInstance($sModule)->setProfileId($iProfileId);
        $this->_aProfileIdBackup = [];

        $_POST = [];
        parent::tearDown();
    }

    public function testTaskListDeleteStaysInsideTheContext()
    {
        if (!$this->_bTasks)
            $this->markTestSkipped('Tasks is not installed.');

        $iForeign = $this->bxTaskList($this->_iOther, $this->_sMark . ' foreign');
        $iTask = $this->bxTask($iForeign, $this->_iOther, $this->_sMark . ' foreign task');
        $iOwn = $this->bxTaskList($this->_iOwn, $this->_sMark . ' own');
        $iOwnTask = $this->bxTask($iOwn, $this->_iOwn, $this->_sMark . ' own task');

        $oModule = BxDolModule::getInstance('bx_tasks');
        $this->assertFalse($oModule->serviceDeleteTaskList($this->_iOwn, $iForeign));
        $this->assertSame($this->_sMark . ' foreign', $this->bxTaskListTitle($iForeign));
        $this->assertSame(1, $this->bxCount('bx_tasks_tasks', $iTask));

        $this->assertTrue($oModule->serviceDeleteTaskList($this->_iOwn, $iOwn));
        $this->assertSame(0, $this->bxCount('bx_tasks_lists', $iOwn));
        $this->assertSame(0, $this->bxCount('bx_tasks_tasks', $iOwnTask));
        $this->assertSame(1, $this->bxCount('bx_tasks_lists', $iForeign));
    }

    public function testTaskListEditStaysInsideTheContext()
    {
        if (!$this->_bTasks)
            $this->markTestSkipped('Tasks is not installed.');

        $oModule = BxDolModule::getInstance('bx_tasks');
        $this->assertTrue($oModule->isAllowAdd($this->_iOwn), 'The admin cannot post in their own profile, so the form path is not reached.');

        $iForeign = $this->bxTaskList($this->_iOther, $this->_sMark . ' foreign');
        $iOwn = $this->bxTaskList($this->_iOwn, $this->_sMark . ' own');

        $_POST = [];
        BxDolForm::unSetObjectInstance('bx_tasks_list', 'bx_tasks_list_entry_edit');
        $mForeign = $oModule->serviceProcessTaskListForm($this->_iOwn, $iForeign);
        $this->assertSame([], $mForeign);

        $this->bxPostList('renamed by attacker');
        BxDolForm::unSetObjectInstance('bx_tasks_list', 'bx_tasks_list_entry_edit');
        $mRename = $oModule->serviceProcessTaskListForm($this->_iOwn, $iForeign);
        $this->assertSame([], $mRename);
        $this->assertSame($this->_sMark . ' foreign', $this->bxTaskListTitle($iForeign));

        $_POST = [];
        BxDolForm::unSetObjectInstance('bx_tasks_list', 'bx_tasks_list_entry_edit');
        $mOwn = $oModule->serviceProcessTaskListForm($this->_iOwn, $iOwn);
        $this->assertIsString($mOwn);
        $this->assertStringContainsString($this->_sMark . ' own', $mOwn);

        $this->bxPostList($this->_sMark . ' renamed');
        BxDolForm::unSetObjectInstance('bx_tasks_list', 'bx_tasks_list_entry_edit');
        $mOwnRename = $oModule->serviceProcessTaskListForm($this->_iOwn, $iOwn);
        $this->assertTrue($mOwnRename);
        $this->assertSame($this->_sMark . ' renamed', $this->bxTaskListTitle($iOwn));
    }

    public function testTaskCreateRefusesAnotherContextsList()
    {
        if (!$this->_bTasks)
            $this->markTestSkipped('Tasks is not installed.');

        $oModule = BxDolModule::getInstance('bx_tasks');
        $this->assertTrue($oModule->isAllowAdd($this->_iOwn));

        $iForeign = $this->bxTaskList($this->_iOther, $this->_sMark . ' foreign');
        $iBefore = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_tasks_tasks` WHERE `tasks_list` = :id", ['id' => $iForeign]);

        $_POST = [];
        $mForeign = $oModule->serviceProcessTaskForm($this->_iOwn, $iForeign);
        $this->assertSame([], $mForeign);
        $this->assertSame($iBefore, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_tasks_tasks` WHERE `tasks_list` = :id", ['id' => $iForeign]));

        $mInbox = $oModule->serviceProcessTaskForm($this->_iOwn, 0);
        $this->assertIsString($mInbox);
        $this->assertNotSame('', $mInbox);
    }

    public function testResourceListDeleteStaysInsideTheContext()
    {
        if (!$this->_bResources)
            $this->markTestSkipped('Resources is not installed.');

        $iForeign = $this->bxResourceList($this->_iOther, $this->_sMark . ' foreign');
        $iEntry = $this->bxResource($iForeign, $this->_iOther, $this->_sMark . ' foreign resource');
        $iOwn = $this->bxResourceList($this->_iOwn, $this->_sMark . ' own');
        $iOwnEntry = $this->bxResource($iOwn, $this->_iOwn, $this->_sMark . ' own resource');

        $oModule = BxDolModule::getInstance('bx_resources');
        ob_start();
        $oModule->actionDeleteList($this->_iOwn, $iForeign);
        ob_end_clean();
        $this->assertSame($this->_sMark . ' foreign', $this->bxResourceListTitle($iForeign));
        $this->assertSame(1, $this->bxCount('bx_resources_entries', $iEntry));

        ob_start();
        $oModule->actionDeleteList($this->_iOwn, $iOwn);
        ob_end_clean();
        $this->assertSame(0, $this->bxCount('bx_resources_lists', $iOwn));
        $this->assertSame(0, $this->bxCount('bx_resources_entries', $iOwnEntry));
        $this->assertSame(1, $this->bxCount('bx_resources_lists', $iForeign));
    }

    public function testResourceListEditStaysInsideTheContext()
    {
        if (!$this->_bResources)
            $this->markTestSkipped('Resources is not installed.');

        $oModule = BxDolModule::getInstance('bx_resources');
        $this->assertTrue($oModule->isAllowAdd($this->_iOwn), 'The admin cannot post in their own profile, so the form path is not reached.');

        $iForeign = $this->bxResourceList($this->_iOther, $this->_sMark . ' foreign');
        $iOwn = $this->bxResourceList($this->_iOwn, $this->_sMark . ' own');

        $_POST = [];
        BxDolForm::unSetObjectInstance('bx_resources_list', 'bx_resources_list_entry_edit');
        ob_start();
        $mOwn = $oModule->actionProcessListForm($this->_iOwn, $iOwn);
        $sOwn = ob_get_clean();
        $this->assertNull($mOwn);
        $this->assertStringContainsString($this->_sMark . ' own', $sOwn);

        BxDolForm::unSetObjectInstance('bx_resources_list', 'bx_resources_list_entry_edit');
        ob_start();
        $mForeign = $oModule->actionProcessListForm($this->_iOwn, $iForeign);
        $sForeign = ob_get_clean();
        $this->assertSame('', $mForeign);
        $this->assertStringNotContainsString($this->_sMark . ' foreign', $sForeign);

        $this->bxPostList('renamed by attacker');
        BxDolForm::unSetObjectInstance('bx_resources_list', 'bx_resources_list_entry_edit');
        ob_start();
        $mRename = $oModule->actionProcessListForm($this->_iOwn, $iForeign);
        ob_end_clean();
        $this->assertSame('', $mRename);
        $this->assertSame($this->_sMark . ' foreign', $this->bxResourceListTitle($iForeign));

        $this->bxPostList($this->_sMark . ' renamed');
        BxDolForm::unSetObjectInstance('bx_resources_list', 'bx_resources_list_entry_edit');
        ob_start();
        $oModule->actionProcessListForm($this->_iOwn, $iOwn);
        ob_end_clean();
        $this->assertSame($this->_sMark . ' renamed', $this->bxResourceListTitle($iOwn));
    }

    public function testResourceCreateRefusesAnotherContextsList()
    {
        if (!$this->_bResources)
            $this->markTestSkipped('Resources is not installed.');

        $oModule = BxDolModule::getInstance('bx_resources');
        $this->assertTrue($oModule->isAllowAdd($this->_iOwn));

        $iForeign = $this->bxResourceList($this->_iOther, $this->_sMark . ' foreign');
        $iBefore = (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_resources_entries` WHERE `list` = :id", ['id' => $iForeign]);

        $_POST = [];
        ob_start();
        $mForeign = $oModule->actionProcessEntryForm($this->_iOwn, $iForeign);
        $sForeign = ob_get_clean();
        $this->assertSame([], json_decode($sForeign, true));
        $this->assertNull($mForeign);
        $this->assertSame($iBefore, (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `bx_resources_entries` WHERE `list` = :id", ['id' => $iForeign]));

        ob_start();
        $oModule->actionProcessEntryForm($this->_iOwn, 0);
        $sInbox = ob_get_clean();
        $this->assertNotSame('[]', $sInbox);
        $this->assertStringContainsString('form', $sInbox);
    }

    protected function bxPostList($sTitle)
    {
        $_POST = [
            'title' => $sTitle,
            'do_submit' => 'Submit',
            'csrf_token' => BxDolForm::getCsrfToken(),
        ];
    }

    protected function bxTaskList($iContextId, $sTitle)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_tasks_lists` SET `context_id` = :context, `title` = :title", [
            'context' => $iContextId,
            'title' => $sTitle,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aTaskListIds[] = $iId;

        return $iId;
    }

    protected function bxTask($iListId, $iContextId, $sTitle)
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_tasks_tasks` SET `author` = :author, `added` = :now, `changed` = :now, `published` = :now, `thumb` = 0, `title` = :title, `cat` = 0, `multicat` = '', `text` = '', `labels` = '', `due_date` = 0, `tasks_list` = :list, `allow_view_to` = :view", [
            'author' => $this->_iOwn,
            'now' => $iNow,
            'title' => $sTitle,
            'list' => $iListId,
            'view' => '-' . (int)$iContextId,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aTaskIds[] = $iId;

        return $iId;
    }

    protected function bxResourceList($iContextId, $sTitle)
    {
        $oDb = BxDolDb::getInstance();
        $oDb->query("INSERT INTO `bx_resources_lists` SET `context_id` = :context, `title` = :title, `default` = 0", [
            'context' => $iContextId,
            'title' => $sTitle,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aResourceListIds[] = $iId;

        return $iId;
    }

    protected function bxResource($iListId, $iContextId, $sTitle)
    {
        $oDb = BxDolDb::getInstance();
        $iNow = time();
        $oDb->query("INSERT INTO `bx_resources_entries` SET `author` = :author, `list` = :list, `added` = :now, `changed` = :now, `published` = :now, `thumb` = 0, `thumb_data` = '', `link` = '', `title` = :title, `cat` = 0, `text` = '', `labels` = '', `allow_view_to` = :view", [
            'author' => $this->_iOwn,
            'list' => $iListId,
            'now' => $iNow,
            'title' => $sTitle,
            'view' => '-' . (int)$iContextId,
        ]);
        $iId = (int)$oDb->lastId();
        $this->assertGreaterThan(0, $iId);
        $this->_aResourceIds[] = $iId;

        return $iId;
    }

    protected function bxTaskListTitle($iId)
    {
        $sTitle = BxDolDb::getInstance()->getOne("SELECT `title` FROM `bx_tasks_lists` WHERE `id` = :id", ['id' => $iId]);

        return $sTitle ? (string)$sTitle : '';
    }

    protected function bxResourceListTitle($iId)
    {
        $sTitle = BxDolDb::getInstance()->getOne("SELECT `title` FROM `bx_resources_lists` WHERE `id` = :id", ['id' => $iId]);

        return $sTitle ? (string)$sTitle : '';
    }

    protected function bxCount($sTable, $iId)
    {
        return (int)BxDolDb::getInstance()->getOne("SELECT COUNT(*) FROM `" . $sTable . "` WHERE `id` = :id", ['id' => $iId]);
    }

    protected function bxIdList(array $aIds)
    {
        return implode(',', array_map('intval', $aIds));
    }
}
