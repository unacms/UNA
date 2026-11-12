<?php

/**
 * What the time summaries give to whom. Logged time is for the one who logged it and those who see everybody's
 * Logged time; the Billed time is the only one a client gets, so nothing of the Logged one may reach them.
 */
class BxTasksTimeSummaryTest extends BxDolTestCase
{
    protected function setUp(): void
    {
        if (!BxDolModule::getInstance('bx_tasks'))
            $this->markTestSkipped('bx_tasks module is not installed.');

        if (!class_exists('BxTasksTemplate', false))
            require_once(BX_DIRECTORY_PATH_MODULES . 'boonex/tasks/classes/BxTasksTemplate.php');
    }

    public function testScopeForThoseWhoSeeEverythingIsEverybodyLoggedAndBilled()
    {
        $this->assertSame([true, true, true], $this->call('_getTimeSummaryScope', [['view_logged_any' => true, 'view_billed' => true]]));
    }

    public function testScopeForAClientIsEverybodyBilledOnly()
    {
        $this->assertSame([true, false, true], $this->call('_getTimeSummaryScope', [['view_logged_any' => false, 'view_billed' => true]]));
    }

    public function testScopeForAMemberIsTheirOwnLoggedOnly()
    {
        $this->assertSame([false, true, false], $this->call('_getTimeSummaryScope', [['log' => true]]));
    }

    public function testNothingOfLoggedTimeIsLeftForAClient()
    {
        $aData = [
            'periods' => [[
                'name' => 'all_time', 'minutes' => 90, 'timer' => 60, 'billed' => 120,
                'people' => [[
                    'profile' => ['id' => 5, 'display_name' => 'Minutes Smith'],
                    'minutes' => 90, 'timer' => 60, 'billed' => 120,
                    'logs' => [['id' => 1, 'minutes' => 90, 'original' => 60, 'by_timer' => true, 'billed' => 120]],
                ]],
            ]],
            'columns' => ['logged' => false, 'billed' => true],
            'labels' => ['logged' => 'Logged', 'original' => 'Original'],
        ];

        $aResult = $this->call('_filterTimeSummary', [$aData, false, true]);

        //--- The data, not the labels: the labels of the block are text for any viewer and stay as they are.
        $sJson = json_encode($aResult['periods']);
        foreach (['"minutes"', '"timer"', '"original"', '"by_timer"'] as $sKey)
            $this->assertStringNotContainsString($sKey, $sJson, $sKey . ' is Logged time');

        $this->assertSame(120, $aResult['periods'][0]['billed']);
        $this->assertSame(120, $aResult['periods'][0]['people'][0]['logs'][0]['billed']);
        //--- Not the viewer's data of other kinds: the profile and the labels stay as they were.
        $this->assertSame('Minutes Smith', $aResult['periods'][0]['people'][0]['profile']['display_name']);
        $this->assertSame($aData['labels'], $aResult['labels']);
    }

    public function testNothingOfBilledTimeIsLeftForThoseWhoDontSeeIt()
    {
        $aData = ['periods' => [['minutes' => 90, 'billed' => 120, 'people' => [['minutes' => 90, 'billed' => 120]]]]];

        $aResult = $this->call('_filterTimeSummary', [$aData, true, false]);

        $this->assertStringNotContainsString('"billed"', json_encode($aResult));
        $this->assertSame(90, $aResult['periods'][0]['minutes']);
    }

    public function testNothingIsFilteredForThoseWhoSeeBoth()
    {
        $aData = ['periods' => [['minutes' => 90, 'timer' => 60, 'billed' => 120]]];

        $this->assertSame($aData, $this->call('_filterTimeSummary', [$aData, true, true]));
    }

    public function testManualIsWhatIsLeftOfLoggedAfterTheTimer()
    {
        //--- An entry logged from a 60 minutes timer and changed to 90 minutes, and one entered by hand: 45 minutes.
        $aSummary = ['minutes' => 0, 'timer' => 0, 'billed' => 0];
        $this->call('_addTimeSummaryTrack', [&$aSummary, ['value' => 90, 'timer' => 60, 'billed' => 90]]);
        $this->call('_addTimeSummaryTrack', [&$aSummary, ['value' => 45, 'timer' => 0, 'billed' => 45]]);

        $this->assertSame(135, $aSummary['minutes']);
        $this->assertSame(60, $aSummary['timer']);
        $this->assertSame(135, $aSummary['billed']);
    }

    protected function call($sMethod, $aArgs)
    {
        $oTemplate = (new ReflectionClass('BxTasksTemplate'))->newInstanceWithoutConstructor();
        $oMethod = new ReflectionMethod('BxTasksTemplate', $sMethod);
        $oMethod->setAccessible(true);

        return $oMethod->invokeArgs($oTemplate, $aArgs);
    }
}
