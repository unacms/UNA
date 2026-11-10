<?php

/**
 * Who can edit an entry of the time grids. An entry comes by its id, so the context
 * administrator of one context must not edit the time of another.
 */
class BxTasksGridTimeEditTest extends BxDolTestCase
{
    protected function setUp(): void
    {
        if (!BxDolModule::getInstance('bx_tasks'))
            $this->markTestSkipped('bx_tasks module is not installed.');

        if (!class_exists('BxTasksGridTime', false))
            require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/tasks/classes/BxTasksGridTime.php');
    }

    public function testSiteAdministrationGridEditsEverythingForModerators()
    {
        $oGrid = $this->grid('bx_tasks_time_administration', 0, ['moderator' => true]);

        $this->assertTrue($this->isAllowed($oGrid, $this->track(1, 10)));
    }

    public function testSiteAdministrationGridRefusesOthers()
    {
        $oGrid = $this->grid('bx_tasks_time_administration', 0, []);

        $this->assertFalse($this->isAllowed($oGrid, $this->track(1, 10)));
    }

    public function testSiteCommonGridEditsOnlyOwnEntries()
    {
        $oGrid = $this->grid('bx_tasks_time_common', 0, []);

        $this->assertTrue($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id(), 10)));
        $this->assertFalse($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id() + 1, 10)));
    }

    public function testContextAdministratorEditsEntriesOfTheContext()
    {
        $oGrid = $this->grid('bx_tasks_time_context_administration', 79198, ['manages' => [79198]], [10 => -79198]);

        $this->assertTrue($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id() + 1, 10)));
    }

    public function testContextAdministratorCannotEditEntriesOfAnotherContext()
    {
        //--- The context in the request is the one the viewer manages, the entry is a task of another context.
        $oGrid = $this->grid('bx_tasks_time_context_administration', 79198, ['manages' => [79198]], [11 => -5]);

        $this->assertFalse($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id() + 1, 11)));
    }

    public function testContextAdministrationGridRefusesWithoutContext()
    {
        $oGrid = $this->grid('bx_tasks_time_context_administration', 0, ['manages' => [79198]], [10 => -79198]);

        $this->assertFalse($this->isAllowed($oGrid, $this->track(1, 10)));
    }

    public function testContextMemberEditsOnlyOwnEntriesOfTheContext()
    {
        $oGrid = $this->grid('bx_tasks_time_context_common', 79198, [], [10 => -79198, 11 => -5]);

        $this->assertTrue($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id(), 10)));
        $this->assertFalse($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id() + 1, 10)));
        $this->assertFalse($this->isAllowed($oGrid, $this->track(bx_get_logged_profile_id(), 11)));
    }

    protected function track($iAuthorId, $iObjectId)
    {
        return ['id' => 1, 'author_id' => $iAuthorId, 'object_id' => $iObjectId];
    }

    protected function isAllowed($oGrid, $aTrack)
    {
        $oMethod = new ReflectionMethod('BxTasksGridTime', '_isAllowedEdit');
        $oMethod->setAccessible(true);

        return (bool)$oMethod->invoke($oGrid, $aTrack);
    }

    /**
     * @param string $sObject grid object
     * @param int $iContextPid context of the grid
     * @param array $aViewer 'moderator' => bool, 'manages' => ids of the contexts the viewer administers
     * @param array $aTasks task id => allow_view_to of the task
     */
    protected function grid($sObject, $iContextPid, $aViewer, $aTasks = [])
    {
        $CNF = [
            'OBJECT_GRID_TIME_ADMINISTRATION' => 'bx_tasks_time_administration',
            'OBJECT_GRID_TIME_COMMON' => 'bx_tasks_time_common',
            'OBJECT_GRID_TIME_CONTEXT_ADMINISTRATION' => 'bx_tasks_time_context_administration',
            'OBJECT_GRID_TIME_CONTEXT_COMMON' => 'bx_tasks_time_context_common',
            'FIELD_ALLOW_VIEW_TO' => 'allow_view_to',
        ];

        $oModule = new class($CNF, $aViewer, $aTasks) {
            public $_oConfig;
            public $_oDb;
            protected $_aViewer;

            public function __construct($CNF, $aViewer, $aTasks)
            {
                $this->_aViewer = $aViewer;
                $this->_oConfig = (object)['CNF' => $CNF];
                $this->_oDb = new class($aTasks) {
                    protected $_aTasks;
                    public function __construct($aTasks) { $this->_aTasks = $aTasks; }
                    public function getContentInfoById($iId)
                    {
                        return isset($this->_aTasks[$iId]) ? ['id' => $iId, 'allow_view_to' => $this->_aTasks[$iId]] : [];
                    }
                };
            }

            public function _isModerator() { return !empty($this->_aViewer['moderator']); }
            public function _isAdministrator() { return false; }
            public function isAllowManageByContext($iContextPid) { return in_array($iContextPid, $this->_aViewer['manages'] ?? []); }
        };

        $oGrid = (new ReflectionClass('BxTasksGridTime'))->newInstanceWithoutConstructor();
        foreach (['_sObject' => $sObject, '_oModule' => $oModule, '_iContextPid' => $iContextPid] as $sName => $mixedValue) {
            for ($oClass = new ReflectionClass($oGrid); $oClass && !$oClass->hasProperty($sName); $oClass = $oClass->getParentClass());
            $oProperty = $oClass->getProperty($sName);
            $oProperty->setAccessible(true);
            $oProperty->setValue($oGrid, $mixedValue);
        }

        return $oGrid;
    }
}
